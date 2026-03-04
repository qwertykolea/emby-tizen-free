define(["exports", "./../modules/viewmanager/baseview.js", "./../modules/loading/loading.js", "./../modules/common/globalize.js", "./../modules/emby-elements/emby-button/emby-button.js", "./../modules/emby-elements/emby-scroller/emby-scroller.js", "./../modules/emby-apiclient/connectionmanager.js", "./../modules/common/servicelocator.js", "./../modules/approuter.js"], function (_exports, _baseview, _loading, _globalize, _embyButton, _embyScroller, _connectionmanager, _servicelocator, _approuter) {
  Object.defineProperty(_exports, "__esModule", {
    value: true
  });
  _exports.default = void 0;
  /* jshint module: true */

  require(['material-icons']);
  function onSubmit(e) {
    e.preventDefault();
    e.stopPropagation();
    if (_servicelocator.appHost.supports('displaymode') && !('ontouchstart' in document)) {
      _approuter.default.show('/startup/welcome_settings.html');
      return;
    }
    _loading.default.show();
    _connectionmanager.default.connect().then(function (result) {
      _loading.default.hide();
      _approuter.default.handleConnectionResult(result);
    });
    return false;
  }
  function View(view, params) {
    _baseview.default.apply(this, arguments);
    view.querySelector('form').addEventListener('submit', onSubmit);
    var downloadMessage = view.querySelector('.embyIntroDownloadMessage');
    if (_servicelocator.appHost.supports('externallinks') && _servicelocator.appHost.supports('targetblank') && _servicelocator.appHost.supports('externalappinfo')) {
      var link = '<a is="emby-linkbutton" class="button-link" href="https://emby.media" target="_blank">https://emby.media</a>';
      downloadMessage.innerHTML = _globalize.default.translate('ServerDownloadMessage', link);
    } else if (_servicelocator.appHost.supports('externallinkdisplay')) {
      downloadMessage.innerHTML = _globalize.default.translate('ServerDownloadMessage', 'https://emby.media');
    } else {
      downloadMessage.innerHTML = _globalize.default.translate('ServerDownloadMessageWithoutLink');
    }
  }
  Object.assign(View.prototype, _baseview.default.prototype);
  View.prototype.onResume = function (options) {
    _baseview.default.prototype.onResume.apply(this, arguments);
    _loading.default.hide();
  };
  var _default = _exports.default = View;
});
