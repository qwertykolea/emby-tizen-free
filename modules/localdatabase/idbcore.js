define(["exports"], function (_exports) {
  Object.defineProperty(_exports, "__esModule", {
    value: true
  });
  _exports.default = void 0;
  /* jshint module: true */

  // *******************************************************************
  // Core Functions for IndexedDB
  // *******************************************************************

  function addObject(db, key, val, storeName) {
    return new Promise(function (resolve, reject) {
      var objectStore = getStore(db, storeName, 'readwrite');
      var request = objectStore.put(val, key);
      request.onerror = reject;
      request.onsuccess = resolve;
    });
  }
  function updateObject(db, key, val, storeName) {
    return new Promise(function (resolve, reject) {
      var objectStore = getStore(db, storeName, 'readwrite');
      var request = objectStore.put(val, key);
      request.onerror = reject;
      request.onsuccess = function () {
        //                console.log('updateObject >>> storeName: -' + objectStore.name + '-');
        //                console.log('updateObject >>> val.ServerId: -' + val.ServerId + '-');
        //                console.log('updateObject >>> result (Id): ' + request.result);
        resolve(request.result);
      };
    });
  }
  function deleteObject(db, key, storeName) {
    return new Promise(function (resolve, reject) {
      var objectStore = getStore(db, storeName, 'readwrite');
      var request = objectStore.delete(key);
      request.onerror = reject;
      request.onsuccess = resolve;
    });
  }
  function clearObjects(db, storeName) {
    return new Promise(function (resolve, reject) {
      var objectStore = getStore(db, storeName, 'readwrite');
      var request = objectStore.clear();
      request.onerror = reject;
      request.onsuccess = resolve;
    });
  }
  function getAllObjects(db, storeName) {
    return new Promise(function (resolve, reject) {
      var objectStore = getStore(db, storeName);
      var request;
      if (typeof objectStore.getAll === 'function') {
        request = objectStore.getAll();
        request.onsuccess = function (event) {
          resolve(event.target.result);
        };
      } else {
        // Fallback to cursor approach if getAll isn't supported.
        var results = [];
        request = objectStore.openCursor();
        request.onsuccess = function (event) {
          var cursor = event.target.result;
          if (cursor) {
            results.push(cursor.value);
            cursor.continue();
          } else {
            resolve(results);
          }
        };
      }
      request.onerror = reject;
    });
  }
  function getObjectByKey(db, key, storeName) {
    return new Promise(function (resolve, reject) {
      var objectStore = getStore(db, storeName);
      var request = objectStore.get(key);
      request.onerror = reject;
      request.onsuccess = function () {
        resolve(request.result);
      };
    });
  }
  function getObjectsByKeys(db, keys, storeName) {
    if (!Array.isArray(keys) || keys.length === 1) {
      var singleKey = Array.isArray(keys) ? keys[0] : keys;
      return getObjectByKey(db, singleKey, storeName);
    }

    // This may need to be tuned based on experience, for now, avoid more than 4 parallel queries
    if (keys.length > 4) {
      return getObjectsByKeysSequentialSeek(db, keys, storeName);
    }
    return getObjectsByKeysParallelLookup(db, keys, storeName);
  }
  function getObjectsByKeysParallelLookup(db, keys, storeName) {
    var actions = keys.map(function (key) {
      return getObjectByKey(db, key, storeName);
    });
    return Promise.all(actions).then(function (results) {
      var flattened = results.reduce(function (acc, val) {
        return acc.concat(val);
      }, []);
      return Promise.resolve(flattened);
    });
  }
  function getObjectsByKeysSequentialSeek(db, keys, storeName) {
    return new Promise(function (resolve, reject) {
      var objectStore = getStore(db, storeName);
      var set = keys.slice(0);
      set.sort(function (a, b) {
        return indexedDB.cmp(a, b);
      });
      var i = 0;
      var range = IDBKeyRange.bound(set[0], set[set.length - 1]);
      var results = [];
      var request = objectStore.openCursor(range);
      request.onsuccess = function (event) {
        var cursor = event.target.result;
        if (!cursor) {
          resolve(results);
          return;
        }
        var key = cursor.key;
        while (indexedDB.cmp(key, set[i]) > 0) {
          // The cursor has passed beyond this key. Check next.
          ++i;
          if (i === set.length) {
            // There is no next. Stop searching.
            resolve(results);
            return;
          }
        }
        if (key === set[i]) {
          // The current cursor value should be included and we should continue
          // a single step in case next item has the same key or possibly our
          // next key in set.
          results.push(cursor.value);
          cursor.continue();
        } else {
          // cursor.key not yet at set[i]. Forward cursor to the next key to hunt for.
          cursor.continue(set[i]);
        }
      };
      request.onerror = reject;
    });
  }

  // Note: for multivalued indexes, deduplication would be required!
  function getObjectsByIndexKeys(db, indexName, keys, storeName) {
    if (!Array.isArray(keys) || keys.length === 1) {
      var singleKey = Array.isArray(keys) ? keys[0] : keys;
      return getObjectsBySingleIndexKey(db, indexName, singleKey, storeName);
    }

    // This may need to be tuned based on experience, for now, avoid more than 4 parallel queries
    if (keys.length > 4) {
      return getObjectsByIndexKeysSequentialSeek(db, indexName, keys, storeName);
    }
    return getObjectsByIndexKeysParallelLookup(db, indexName, keys, storeName);
  }
  function getObjectsByIndexKeysParallelLookup(db, indexName, keys, storeName) {
    var actions = keys.map(function (key) {
      return getObjectsBySingleIndexKey(db, indexName, key, storeName);
    });
    return Promise.all(actions).then(function (results) {
      var flattened = results.reduce(function (acc, val) {
        return acc.concat(val);
      }, []);
      return Promise.resolve(flattened);
    });
  }
  function getObjectsBySingleIndexKey(db, indexName, key, storeName) {
    return new Promise(function (resolve, reject) {
      storeName = storeName || db.name;
      var transaction = db.transaction([storeName], 'readonly');
      var objectStore = transaction.objectStore(storeName);
      var index = objectStore.index(indexName);
      var request;
      if (typeof index.getAll === 'function') {
        request = index.getAll(key);
        request.onsuccess = function (event) {
          resolve(event.target.result);
        };
      } else {
        // Fallback to cursor approach if getAll isn't supported.
        var results = [];
        request = index.openCursor(key);
        request.onsuccess = function (event) {
          var cursor = event.target.result;
          if (cursor) {
            results.push(cursor.value);
            cursor.continue();
          } else {
            resolve(results);
          }
        };
      }
      request.onerror = reject;
    });
  }
  function getObjectsByIndexKeysSequentialSeek(db, indexName, keys, storeName) {
    return new Promise(function (resolve, reject) {
      var objectStore = getStore(db, storeName);
      var index = objectStore.index(indexName);
      var set = keys.slice(0);
      set.sort(function (a, b) {
        return indexedDB.cmp(a, b);
      });
      var i = 0;
      var range = IDBKeyRange.bound(set[0], set[set.length - 1]);
      var results = [];
      var request = index.openCursor(range);
      request.onsuccess = function (event) {
        var cursor = event.target.result;
        if (!cursor) {
          resolve(results);
          return;
        }
        var key = cursor.key;
        while (indexedDB.cmp(key, set[i]) > 0) {
          // The cursor has passed beyond this key. Check next.
          ++i;
          if (i === set.length) {
            // There is no next. Stop searching.
            resolve(results);
            return;
          }
        }
        if (key === set[i]) {
          // The current cursor value should be included and we should continue
          // a single step in case next item has the same key or possibly our
          // next key in set.
          results.push(cursor.value);
          cursor.continue();
        } else {
          // cursor.key not yet at set[i]. Forward cursor to the next key to hunt for.
          cursor.continue(set[i]);
        }
      };
      request.onerror = reject;
    });
  }
  function getDistinctndexKeys(db, indexName, storeName) {
    return new Promise(function (resolve, reject) {
      var objectStore = getStore(db, storeName);
      var index = objectStore.index(indexName);
      var results = [];
      var request = index.openKeyCursor(null, 'nextunique');
      request.onsuccess = function (event) {
        var cursor = event.target.result;
        if (cursor) {
          results.push(cursor.key);
          cursor.continue();
        } else {
          resolve(results);
        }
      };
      request.onerror = reject;
    });
  }
  function getStore(db, storeName, access) {
    storeName = storeName || db.name;
    access = access || 'readonly';
    var transaction = db.transaction(storeName, access);
    var objectStore = transaction.objectStore(storeName);
    return objectStore;
  }
  var _default = _exports.default = {
    addObject: addObject,
    updateObject: updateObject,
    deleteObject: deleteObject,
    clearObjects: clearObjects,
    getAllObjects: getAllObjects,
    getObjectByKey: getObjectByKey,
    getObjectsByKeys: getObjectsByKeys,
    getObjectsByIndexKeys: getObjectsByIndexKeys,
    getDistinctndexKeys: getDistinctndexKeys
  };
});
