define(["exports", "./mediasync.js", "./../emby-apiclient/connectionmanager.js"], function (_exports, _mediasync, _connectionmanager) {
  Object.defineProperty(_exports, "__esModule", {
    value: true
  });
  _exports.default = void 0;
  /* jshint module: true */

  function performSync(apiClient, options) {
    console.log("ServerSync.performSync to server: " + apiClient.serverId());
    if (!options) {
      options = {};
    }
    return new _mediasync.default().sync(apiClient, options);
  }
  function ServerSync() {}
  ServerSync.prototype.sync = function (server, options) {
    if (!_connectionmanager.default.isLoggedIn(server.Id)) {
      console.log('Skipping sync to server ' + server.Id + ' because there is no saved authentication information.');
      return Promise.resolve();
    }
    var connectionOptions = {
      updateDateLastAccessed: false,
      enableWebSocket: false,
      reportCapabilities: false,
      enableAutomaticBitrateDetection: false,
      autoLogin: 'lastuser'
    };
    return _connectionmanager.default.connectToServer(server, connectionOptions).then(function (result) {
      if (result.State === 'SignedIn') {
        var apiClient = _connectionmanager.default.getApiClient(server.Id);
        return performSync(apiClient, options);
      } else {
        console.log('Unable to connect to server id: ' + server.Id);
        return Promise.reject();
      }
    });
  };
  var _default = _exports.default = ServerSync;
});
