define(["exports", "./serversync.js", "./../emby-apiclient/connectionmanager.js"], function (_exports, _serversync, _connectionmanager) {
  Object.defineProperty(_exports, "__esModule", {
    value: true
  });
  _exports.default = void 0;
  /* jshint module: true */

  function syncNext(servers, index, options) {
    var length = servers.length;
    if (index >= length) {
      console.log('MultiServerSync.sync complete');
      return Promise.resolve();
    }
    var server = servers[index];
    console.log("Creating ServerSync to server: " + server.Id);
    return new _serversync.default().sync(server, options).then(function () {
      console.log("ServerSync succeeded to server: " + server.Id);
      return syncNext(servers, index + 1, options);
    }, function (err) {
      console.log("ServerSync failed to server: " + server.Id + '. ' + err);
      return syncNext(servers, index + 1, options);
    });
  }
  function MultiServerSync() {}
  MultiServerSync.prototype.sync = function (options) {
    console.log('MultiServerSync.sync starting...');
    var servers = _connectionmanager.default.getSavedServers();
    return syncNext(servers, 0, options);
  };
  var _default = _exports.default = MultiServerSync;
});
