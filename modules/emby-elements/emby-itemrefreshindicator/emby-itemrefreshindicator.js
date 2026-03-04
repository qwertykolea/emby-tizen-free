define(["exports", "./../../emby-apiclient/events.js", "./../../common/input/api.js", "./../../shortcuts.js", "./../emby-progressring/emby-progressring.js"], function (_exports, _events, _api, _shortcuts, _embyProgressring) {
  Object.defineProperty(_exports, "__esModule", {
    value: true
  });
  _exports.default = void 0;
  /* jshint module: true */

  function addNotificationEvent(instance, name, handler) {
    var localHandler = handler.bind(instance);
    _events.default.on(_api.default, name, localHandler);
    instance[name] = localHandler;
  }
  function removeNotificationEvent(instance, name) {
    var handler = instance[name];
    if (handler) {
      _events.default.off(_api.default, name, handler);
      instance[name] = null;
    }
  }
  function onRefreshProgress(e, apiClient, info) {
    var indicator = this;
    if (!indicator.itemId) {
      var item = _shortcuts.default.getItemFromChildNode(indicator);
      if (item) {
        indicator.itemId = item.Id;
      }
    }
    if (info.ItemId === indicator.itemId) {
      var progress = parseFloat(info.Progress);
      if (progress && progress < 100) {
        this.classList.remove('hide');
      } else {
        this.classList.add('hide');
      }
      this.setProgress(progress);
    }
  }
  function onInit() {
    var elem = this;
    if (elem.hasInit) {
      return;
    }
    elem.hasInit = true;
  }
  var EmbyItemRefreshIndicator = /*#__PURE__*/function (_EmbyProgressRing) {
    function EmbyItemRefreshIndicator() {
      var _this;
      // address the upgraded instance and use it
      var self = _this = _EmbyProgressRing.call(this) || this;
      onInit.call(self);
      return babelHelpers.possibleConstructorReturn(_this, self);
    }
    babelHelpers.inherits(EmbyItemRefreshIndicator, _EmbyProgressRing);
    return babelHelpers.createClass(EmbyItemRefreshIndicator, [{
      key: "connectedCallback",
      value: function connectedCallback() {
        _embyProgressring.default.prototype.connectedCallback.call(this);
        addNotificationEvent(this, 'RefreshProgress', onRefreshProgress);
      }
    }, {
      key: "disconnectedCallback",
      value: function disconnectedCallback() {
        _embyProgressring.default.prototype.disconnectedCallback.call(this);
        removeNotificationEvent(this, 'RefreshProgress');
        this.itemId = null;
      }
    }]);
  }(_embyProgressring.default);
  customElements.define('emby-itemrefreshindicator', EmbyItemRefreshIndicator, {
    extends: 'div'
  });
  var _default = _exports.default = _embyProgressring.default;
});
