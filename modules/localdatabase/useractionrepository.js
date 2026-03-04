define(["exports", "./idbcore.js"], function (_exports, _idbcore) {
  Object.defineProperty(_exports, "__esModule", {
    value: true
  });
  _exports.default = void 0;
  /* jshint module: true */

  // Database name
  var dbName = "useractions";

  // Database version
  var dbVersion = 2;
  var databaseInstance;
  function openUserActionDatabase() {
    return new Promise(function (resolve, reject) {
      if (databaseInstance) {
        resolve(databaseInstance);
        return;
      }
      var request = indexedDB.open(dbName, dbVersion);
      request.onerror = reject;
      request.onblocked = reject;
      request.onupgradeneeded = function (event) {
        var db = request.result;
        if (event.oldVersion < 1) {
          // Version 1 is the first version of the database.
          db.createObjectStore(dbName);
        }
        if (event.oldVersion < 2) {
          // Version 2 introduces new indexes:
          var objectStore = request.transaction.objectStore(dbName);
          objectStore.createIndex('Index_ServerId', 'ServerId');
        }
      };
      request.onsuccess = function (event) {
        var db = event.target.result;
        db.onversionchange = function () {
          // Close immediately to allow the upgrade requested by another instance to proceed.
          db.close();
          databaseInstance = null;
        };
        databaseInstance = db;
        resolve(db);
      };
    });
  }
  function getActionDb() {
    return openUserActionDatabase(dbName);
  }
  function getByServerId(serverId) {
    return getActionDb().then(function (db) {
      return _idbcore.default.getObjectsByIndexKeys(db, 'Index_ServerId', serverId);
    });
  }
  function getUserAction(key) {
    return getActionDb().then(function (db) {
      return _idbcore.default.getObjectByKey(db, key);
    });
  }
  function addUserAction(key, val) {
    return getActionDb().then(function (db) {
      return _idbcore.default.addObject(db, key, val);
    });
  }
  function deleteUserActions(keys) {
    return Promise.all(keys.map(deleteUserAction));
  }
  function deleteUserAction(key) {
    return getActionDb().then(function (db) {
      return _idbcore.default.deleteObject(db, key);
    });
  }
  function clearUserActions() {
    return getActionDb().then(function (db) {
      return _idbcore.default.clearObjects(db);
    });
  }
  var _default = _exports.default = {
    getUserAction: getUserAction,
    addUserAction: addUserAction,
    deleteUserAction: deleteUserAction,
    deleteUserActions: deleteUserActions,
    clearUserActions: clearUserActions,
    getByServerId: getByServerId
  };
});
