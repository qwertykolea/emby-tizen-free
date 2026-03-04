define(["exports", "./../common/appsettings.js"], function (_exports, _appsettings) {
  Object.defineProperty(_exports, "__esModule", {
    value: true
  });
  _exports.default = void 0;
  /* jshint module: true */

  var isSyncing;
  var localSync = {
    sync: function (options) {
      console.log('localSync.sync starting...');
      if (isSyncing) {
        return Promise.resolve();
      }
      isSyncing = true;
      return Emby.importModule('./modules/sync/multiserversync.js').then(function (MultiServerSync) {
        if (!options) {
          options = {};
        }
        options.cameraUploadServers = _appsettings.default.cameraUploadServers();
        new MultiServerSync().sync(options).then(function () {
          isSyncing = null;
        }, function (err) {
          isSyncing = null;
          return Promise.reject(err);
        });
      });
    },
    setProgressUpdatesEnabled: function (enabled) {}
  };

  //setTimeout(function () {
  //    events.trigger(localSync, 'progress', [{

  //        numItems: 10,
  //        numItemsComplete: 7,
  //        totalPercentComplete: 73
  //    }]);
  //}, 1000);
  var _default = _exports.default = localSync;
});
