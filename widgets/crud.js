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

const express = require('express');
const images = require('../lib/images');
const oauth2 = require('../lib/oauth2');

function getModel() {
  return require(`../widgets/model-${require('../config').get('DATA_BACKEND')}`);
}

const router = express.Router();

// Use the oauth middleware to automatically get the user's profile
// information and expose login/logout URLs to templates.
router.use(oauth2.template);

// Set Content-Type for all responses for these routes
router.use((req, res, next) => {
  res.set('Content-Type', 'text/html');
  next();
});

/**
 * GET /widgets
 *
 * Display a page of widgets (up to ten at a time). 
 */
router.get('/', (req, res, next) => {
  getModel().list(10, req.query.pageToken, (err, entities, cursor) => {
    if (err) {
      next(err);
      return;
    }
    res.render('widgets/list.pug', {
      widgets: entities,
      nextPageToken: cursor,
      title: 'Widgets',
    });
  });
});

/**
 * GET /widget/:id
 *
 * Display an widget.
 */
router.get('/:widget', (req, res, next) => {
  getModel().read(req.params.widget, (err, entity) => {
    if (err) {
      next(err);
      return;
    }
    console.log('here')
    res.render('widgets/view.pug', {
      widget: entity,
      //currentUserId: req.user.id,
    });
  });
});

/**
 * Errors on "/widgets/*" routes.
 */
router.use((err, req, res, next) => {
  // Format error and forward to generic error handler for logging and
  // responding to the request
  err.response = err.message;
  next(err);
});

module.exports = router;
