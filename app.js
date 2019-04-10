// Copyright 2019, Blacktoque Software.
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//    http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

'use strict';
const path = require('path');
const express = require('express');
const session = require('express-session');//
const passport = require('passport');
const {Datastore} = require('@google-cloud/datastore');
const DatastoreStore = require('@google-cloud/connect-datastore')(session);
const app = express();
const config = require('./config');
//temporary to upload data to storage
function getModel() {
  return require(`./widgets/model-${require('./config').get('DATA_BACKEND')}`);
}
const fs = require('fs');
const Storage = require('@google-cloud/storage');
const CLOUD_BUCKET = config.get('CLOUD_BUCKET');
const storage = Storage();
const bucket = storage.bucket(CLOUD_BUCKET);


app.disable('etag');
app.set('views', path.join(__dirname, 'views'));
/**
 * This app is using [template-engine](https://expressjs.com/en/guide/using-template-engines.html)
 * with [Pug](https://pugjs.org/api/getting-started.html)
 */
app.set('view engine', 'pug');
// let express know its behind a proxy and can trust X-Forwarded-* header fields.
app.set('trust proxy', true);

// [START session]
// Configure the session and session storage.
const sessionConfig = {
  resave: false,
  saveUninitialized: false,
  secret: config.get('SECRET'),
  signed: true,
  store: new DatastoreStore({
    dataset: new Datastore({kind: 'express-sessions'}),
  }),
};

app.use(session(sessionConfig));
// [END session]
app.use(express.static('public'));

// OAuth2
app.use(passport.initialize());
app.use(passport.session());
app.use(require('./lib/oauth2').router);


// widgets
app.use('/widgets', require('./widgets/crud'));


//home
app.use('/home', require('./home/homePath'));


// Redirect root to /home
app.get('/', (req, res) => {
  res.redirect('/home');
});

// Basic 404 handler
app.use((req, res) => {
  res.status(404).send('Not Found');
});

// Basic error handler
app.use((err, req, res) => {
  /* jshint unused:false */
  console.error(err);
  // If our routes specified a specific response, then send that. Otherwise,
  // send a generic message so as not to leak anything.
  res.status(500).send(err.response || 'Something broke!');
});
if (module === require.main) {
  // Start the server
  const server = app.listen(config.get('PORT'), () => {
    const port = server.address().port;
    console.log(`App listening on port ${port}`);
  });
}


//temp helpers
const readFile = (path, file, img = false) => {
  return new Promise((resolve, reject) => {
    let fullpath = `${path}/${file}`
    let data = fs.readFileSync(fullpath, img ? 'binary' : 'utf8')
    if (img){
      resolve({ data: data, name: file})
    }else{
      resolve({ data: JSON.parse(data), name: file})
    }
  })
}
let upload = false;//set to true to run the upload method for the json data

if (upload){
  readFile(`${__dirname}/data`, 'widgets.json').then(pr =>{
    let time = new Date()
    let count = 1;
    pr.data.forEach(widget =>{
      let data = {
        item:{
          name: widget.item.name,
        },
        date: time.toISOString(),
        model:{
          id: widget.model.id,
          type: widget.model.type,
          img: 'w1.png',
          description: widget.model.description,
        },
        designer:{
          name: widget.designer.name,
          race: widget.designer.race,
        },
        imageUrl: `https://storage.googleapis.com/smpbck-01/w${count}.svg` 
      }
      ++count;
      getModel().create(data, (err, savedData) => {
        if (err) {
          console.log(err);
          return;
        }
      });
    })
  }).catch(reason => console.log(reason))
}
module.exports = app;

