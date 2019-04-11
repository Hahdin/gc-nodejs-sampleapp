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
 * GET /widgets/upload
 *
 * Display a form for uploading a widget.
 */
router.get('/upload',oauth2.required, (req, res) => {
  res.render('widgets/form.pug', {
    user: req.user,
    widget: {
      item: {
        name: ''
      },
      model: {
        id: '',
        type: '',
        img: '',
        description: ''
      },
      designer: {
        name: '',
        race: ''
      },
      name:{
        first: '',
        last: '',
      }
    },
    action: 'Upload Form',
  });
});
/**
 * POST /widgets/upload
 *
 * Create a widget.
 */
// [START upload]
router.post(
  '/upload',
  images.multer.single('image'),
  images.sendUploadToGCS,
  (req, res, next) => {
    const data = req.body;

    // If the user is logged in, set them as the creator of the book.
    if (req.user) {
      data.createdBy = req.user.displayName;
      data.createdById = req.user.id;
    } else { ;//bail
      next(err);
      return;
    }
    // Was an image uploaded? If so, we'll use its public URL
    // in cloud storage.
    if (req.file && req.file.cloudStoragePublicUrl) {
      data.imageUrl = req.file.cloudStoragePublicUrl;
    }
    let time = new Date();
    let orderFormData = {
      uploader: {
        name: {
          first: data.firstname,
          last: data.lastname,
        },
      },
      date: time.toISOString(),
      item:{
        name: data.itemName,
      },
      model:{
        id: data.modelId,
        type: data.modelType,
        description: data.modelDesc,
        img: data.imageUrl,
      },
      designer: {
        name: data.designerName,
        race: data.designerRace,
      },
      createdById: data.createdById,
      imageUrl: data.imageUrl,
    }
    


    // Save the data to the database.
    getModel().create(orderFormData, (err, savedData) => {
      if (err) {
        if (typeof err === 'string') {
          res.redirect(`${req.baseUrl}`);
          return
        }
        next(err); return;
      }
      res.redirect(`${req.baseUrl}/${savedData.id}`);
    });
  }
);
/**
 * GET /widgets/:id/delete
 *
 * Delete a widget.
 */
router.get('/:widget/delete', (req, res, next) => {
  getModel().delete(req.params.widget, err => {
    if (err) {
      next(err);
      return;
    }
    res.redirect(`${req.baseUrl}`);
  });
});

/**
 * GET /widget/:id
 *
 * Display a widget.
 */
router.get('/:widget', (req, res, next) => {
  
  getModel().read(req.params.widget, (err, entity) => {
    if (err) {
      next(err);
      return;
    }
    res.render('widgets/view.pug', {
      widget: entity,
      currentUserId: req.user ? req.user.id : 'none',
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
