define(["exports", "./basetab.js", "./../modules/emby-elements/guide/guide.js"], function (_exports, _basetab, _guide) {
  Object.defineProperty(_exports, "__esModule", {
    value: true
  });
  _exports.default = void 0;
  /* jshint module: true */

  function GuideTab(view) {
    _basetab.default.apply(this, arguments);
  }
  Object.assign(GuideTab.prototype, _basetab.default.prototype);
  GuideTab.prototype.onResume = function (options) {
    var instance = this;
    return _basetab.default.prototype.onResume.apply(instance, arguments).then(function () {
      var hasFocus = instance.view.contains(document.activeElement);
      var guideInstance = instance.guideInstance;
      if (!guideInstance) {
        guideInstance = instance.guideInstance = new _guide.default({
          element: instance.view,
          serverId: instance.apiClient.serverId(),
          condensed: true,
          dateButton: false
        });
      }
      if (!options) {
        options = {};
      }
      var item = options.item || {};
      options.scrollToChannelId = item.Type === 'TvChannel' ? item.Id : null;
      options.focusOnScroll = hasFocus;
      options.scrollBehavior = 'instant';

      // todo: this should be false when returning from a dialog
      options.resetScroll = true;
      return guideInstance.resume(options);
    });
  };
  GuideTab.prototype.onPause = function () {
    _basetab.default.prototype.onPause.apply(this, arguments);
    var guideInstance = this.guideInstance;
    if (guideInstance) {
      guideInstance.pause();
    }
  };
  GuideTab.prototype.destroy = function () {
    _basetab.default.prototype.destroy.apply(this, arguments);
    var guideInstance = this.guideInstance;
    if (guideInstance) {
      guideInstance.destroy();
    }
    this.guideInstance = null;
  };
  var _default = _exports.default = GuideTab;
});
