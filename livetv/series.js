define(["exports", "./../modules/tabbedview/itemstab.js", "./../modules/emby-elements/emby-itemscontainer/emby-itemscontainer.js", "./../modules/emby-elements/emby-button/emby-button.js", "./../modules/emby-elements/emby-scroller/emby-scroller.js"], function (_exports, _itemstab, _embyItemscontainer, _embyButton, _embyScroller) {
  Object.defineProperty(_exports, "__esModule", {
    value: true
  });
  _exports.default = void 0;
  /* jshint module: true */

  function SeriesTab(view, params, options) {
    this.supportsViewSettings = false;
    this.enableTotalRecordCountDisplay = false;
    _itemstab.default.apply(this, arguments, options);
  }
  Object.assign(SeriesTab.prototype, _itemstab.default.prototype);
  SeriesTab.prototype.onTemplateLoaded = function () {
    _itemstab.default.prototype.onTemplateLoaded.apply(this, arguments);
    this.itemsContainer.setAttribute('data-monitor', 'SeriesTimers');
  };
  SeriesTab.prototype.getSortMenuOptions = function () {
    return [];
  };
  SeriesTab.prototype.getItemTypes = function () {
    return ['SeriesTimer'];
  };
  SeriesTab.prototype.getItems = function () {
    var query = {
      SortBy: "SortName",
      SortOrder: "Ascending"
    };
    var apiClient = this.apiClient;
    return apiClient.getLiveTvSeriesTimers(query);
  };
  SeriesTab.prototype.getBaseListRendererOptions = function () {
    var options = _itemstab.default.prototype.getBaseListRendererOptions.apply(this, arguments);
    options.draggable = false;
    options.draggableXActions = true;
    options.multiSelect = false;
    return options;
  };
  SeriesTab.prototype.getSettingsKey = function () {
    return 'livetvseries';
  };
  SeriesTab.prototype.loadTemplate = function () {
    return this.loadItemsTemplate();
  };
  var _default = _exports.default = SeriesTab;
});
