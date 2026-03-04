define(["exports", "./../globalize.js", "./../../emby-apiclient/connectionmanager.js"], function (_exports, _globalize, _connectionmanager) {
  Object.defineProperty(_exports, "__esModule", {
    value: true
  });
  _exports.default = void 0;
  /* jshint module: true */

  function showAlert(options) {
    return Emby.importModule('./modules/common/dialogs/alert.js').then(function (alert) {
      return alert(options);
    });
  }
  function showErrorMessage() {
    return showAlert(_globalize.default.translate('MessagePlayAccessRestricted')).then(function () {
      return Promise.reject();
    });
  }
  function PlayAccessValidation() {
    this.name = 'Playback validation';
    this.type = 'preplayintercept';
    this.id = 'playaccessvalidation';
    this.order = -2;
  }
  PlayAccessValidation.prototype.intercept = function (options) {
    var item = options.item;
    if (!item) {
      return Promise.resolve();
    }
    var serverId = item.ServerId;
    if (!serverId) {
      return Promise.resolve();
    }
    return _connectionmanager.default.getApiClient(serverId).getCurrentUser().then(function (user) {
      if (user.Policy.EnableMediaPlayback) {
        return Promise.resolve();
      }

      // reject but don't show an error message
      if (!options.fullscreen) {
        return Promise.reject();
      }
      return showErrorMessage();
    });
  };
  var _default = _exports.default = PlayAccessValidation;
});
