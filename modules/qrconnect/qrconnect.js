define(["exports", "./../qrcode-generator/qrcode.js", "./../emby-apiclient/connectionmanager.js"], function (_exports, _qrcode, _connectionmanager) {
  Object.defineProperty(_exports, "__esModule", {
    value: true
  });
  _exports.default = void 0;
  var _default = _exports.default = {
    generateQRCode: function (options) {
      var errorCorrectionLevel = 'L';
      var qr = (0, _qrcode.default)('0', errorCorrectionLevel);
      var params = {};
      var apiClient = options.apiClient;
      var server = _connectionmanager.default.getServerInfo(apiClient.serverId());
      var user = options.user;
      if (user) {
        params.username = user.Name;
      }
      if (server.LocalAddress) {
        params.localAddress = server.LocalAddress;
      }
      if (server.RemoteAddress) {
        params.remoteAddress = server.RemoteAddress;
      }
      qr.addData('emby://connect?' + new URLSearchParams(params).toString());
      qr.make();
      return qr.createDataURL();
    }
  };
});
