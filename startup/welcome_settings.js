define(["exports", "./../modules/viewmanager/basesettingsview.js", "./../modules/loading/loading.js", "./../modules/emby-elements/emby-button/emby-button.js", "./../modules/emby-elements/emby-select/emby-select.js", "./../modules/emby-elements/emby-toggle/emby-toggle.js", "./../modules/emby-elements/emby-scroller/emby-scroller.js", "./../modules/emby-apiclient/connectionmanager.js", "./../modules/approuter.js", "./../modules/common/globalize.js", "./../modules/common/servicelocator.js"], function (_exports, _basesettingsview, _loading, _embyButton, _embySelect, _embyToggle, _embyScroller, _connectionmanager, _approuter, _globalize, _servicelocator) {
  Object.defineProperty(_exports, "__esModule", {
    value: true
  });
  _exports.default = void 0;
  /* jshint module: true */

  require(['material-icons']);
  function onSubmit(e) {
    _loading.default.show();
    _connectionmanager.default.connect().then(function (result) {
      _loading.default.hide();
      _approuter.default.handleConnectionResult(result);
    });
    e.preventDefault();
    e.stopPropagation();
    return false;
  }
  function setPremiereText(elem, key) {
    if (!_servicelocator.appHost.supports('externallinks') || !_servicelocator.appHost.supports('externalpremium')) {
      elem.innerHTML = _globalize.default.translate(key, '', '');
    } else {
      elem.innerHTML = _globalize.default.translate(key, '<a is="emby-linkbutton" href="https://emby.media/premiere" data-preset="premiereinfo" target="_blank" class="button-link">', '</a>');
    }
  }
  function View(view, params) {
    _basesettingsview.default.apply(this, arguments);
    setPremiereText(view.querySelector('.displayModePremiere'), 'PlaybackTvModeRequiresEmbyPremiere');
    view.querySelector('form').addEventListener('submit', onSubmit);
  }
  Object.assign(View.prototype, _basesettingsview.default.prototype);
  View.prototype.loadSettingsInternal = function () {
    var instance = this;
    return instance.loadAutoSettings();
  };
  var _default = _exports.default = View;
});
