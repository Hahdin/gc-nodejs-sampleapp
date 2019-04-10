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

const {Datastore} = require('@google-cloud/datastore');

const ds = new Datastore();
const kind = 'Widget';
function fromDatastore(obj) {
  obj.id = obj[Datastore.KEY].id;
  return obj;
}

function toDatastore(obj, nonIndexed) {
  nonIndexed = nonIndexed || [];
  let results = [];
  Object.keys(obj).forEach(k => {
    if (obj[k] === undefined) {
      return;
    }
    results.push({
      name: k,
      value: obj[k],
      excludeFromIndexes: nonIndexed.indexOf(k) !== -1,
    });
  });
  return results;
}

function list(limit, token, cb) {
  const q = ds
    .createQuery([kind])
    .limit(limit)
    .order('item.name')
    .start(token);

  ds.runQuery(q, (err, entities, nextQuery) => {
    if (err) {
      cb(err);
      return;
    }
    const hasMore =
      nextQuery.moreResults !== Datastore.NO_MORE_RESULTS
        ? nextQuery.endCursor
        : false;
    cb(null, entities.map(fromDatastore), hasMore);
  });
}

// [START listby]
function listBy(userId, limit, token, cb) {
  const q = ds
    .createQuery([kind])
    .filter('createdById', '=', userId)
    .limit(limit)
    .start(token);

  ds.runQuery(q, (err, entities, nextQuery) => {
    if (err) {
      cb(err);
      return;
    }
    const hasMore =
      nextQuery.moreResults !== Datastore.NO_MORE_RESULTS
        ? nextQuery.endCursor
        : false;
    cb(null, entities.map(fromDatastore), hasMore);
  });
}
// [END listby]

function update(id, data, cb) {

  const q = ds
  .createQuery([kind])
  .filter('model.id', '=', data.model.id)
  .start(0);
 
  ds.runQuery(q, (err, entities, nextQuery) => {
    if (err) {
      cb(err);
      return;
    }
    if (entities.length){
      cb("already exists")
    }
    else{
      let key;
      if (id) {
        key = ds.key([kind, parseInt(id, 10)]);
      } else {
        key = ds.key(kind);
      }
    
      const entity = {
        key: key,
        data: toDatastore(data, ['designer.name']),
      };
      ds.save(entity, err => {
        data.id = entity.key.id;
        cb(err, err ? null : data);
      });
    }
  })

}

function read(id, cb) {
  const key = ds.key([kind, parseInt(id, 10)]);
  ds.get(key, (err, entity) => {
    if (!err && !entity) {
      err = {
        code: 404,
        message: 'Not found',
      };
    }
    if (err) {
      cb(err);
      return;
    }
    cb(null, fromDatastore(entity));
  });
}

function _delete(id, cb) {
  const key = ds.key([kind, parseInt(id, 10)]);
  ds.delete(key, cb);
}

module.exports = {
  create: (data, cb) => {
    update(null, data, cb);
  },
  read: read,
  update: update,
  delete: _delete,
  list: list,
  listBy: listBy,
};
