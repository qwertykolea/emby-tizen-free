define(["exports", "./../modules/tabbedview/itemstab.js", "./../modules/emby-elements/emby-itemscontainer/emby-itemscontainer.js", "./../modules/emby-elements/emby-scroller/emby-scroller.js", "./../modules/emby-elements/emby-button/emby-button.js"], function (_exports, _itemstab, _embyItemscontainer, _embyScroller, _embyButton) {
  Object.defineProperty(_exports, "__esModule", {
    value: true
  });
  _exports.default = void 0;
  /* jshint module: true */

  function StudiosTab(view, params, options) {
    this.supportsViewSettings = false;
    _itemstab.default.apply(this, arguments);
  }
  Object.assign(StudiosTab.prototype, _itemstab.default.prototype);
  StudiosTab.prototype.getQueryIncludeItemTypes = function () {
    return ['Series'];
  };
  StudiosTab.prototype.getItemTypes = function () {
    return ['Studio'];
  };
  StudiosTab.prototype.getSettingsKey = function () {
    return _itemstab.default.prototype.getSettingsKey.call(this) + '-studios';
  };
  StudiosTab.prototype.getApiClientQueryMethodName = function () {
    return 'getStudios';
  };
  StudiosTab.prototype.getContext = function () {
    return 'tvshows';
  };
  StudiosTab.prototype.getCardOptions = function (items, settings) {
    var options = _itemstab.default.prototype.getCardOptions.apply(this, arguments);
    options.preferThumb = true;
    options.shape = 'backdrop';
    return options;
  };
  StudiosTab.prototype.getSortMenuOptions = function () {
    return [];
  };
  StudiosTab.prototype.loadTemplate = function () {
    return this.loadItemsTemplate();
  };
  var _default = _exports.default = StudiosTab;
});
