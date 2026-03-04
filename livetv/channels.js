define(["exports", "./../modules/tabbedview/itemstab.js", "./../modules/emby-elements/emby-itemscontainer/emby-itemscontainer.js", "./../modules/emby-elements/emby-button/emby-button.js", "./../modules/emby-elements/emby-scroller/emby-scroller.js", "./../modules/common/usersettings/usersettings.js", "./../modules/common/globalize.js"], function (_exports, _itemstab, _embyItemscontainer, _embyButton, _embyScroller, _usersettings, _globalize) {
  Object.defineProperty(_exports, "__esModule", {
    value: true
  });
  _exports.default = void 0;
  /* jshint module: true */

  function ChannelsTab(view, params, options) {
    _itemstab.default.apply(this, arguments);
  }
  Object.assign(ChannelsTab.prototype, _itemstab.default.prototype);
  ChannelsTab.prototype.getItemTypes = function () {
    return ['TvChannel'];
  };
  ChannelsTab.prototype.getSettingsKey = function () {
    return 'livetvchannels';
  };
  ChannelsTab.prototype.saveSortingOnServer = function () {
    return true;
  };
  ChannelsTab.prototype.getCardOptions = function (items) {
    var options = _itemstab.default.prototype.getCardOptions.apply(this, arguments);
    var sorting = this.getSortValues();
    if ((sorting.sortBy || '').toLowerCase().indexOf('channelnumber,sortname') !== -1) {
      options.channelNumberFirst = true;
    }
    return options;
  };
  ChannelsTab.prototype.getSortBySettingsKey = function (sortMenuOptions) {
    return _usersettings.default.getLiveTvChannelSortSettingsKey();
  };
  ChannelsTab.prototype.getSortMenuOptions = function () {
    return _usersettings.default.getLiveTvChannelSortOrders(_globalize.default);
  };
  ChannelsTab.prototype.getDefaultSorting = function () {
    var query = {};
    _usersettings.default.addLiveTvChannelSortingToQuery(query, _globalize.default);
    return {
      sortBy: query.SortBy,
      sortOrder: query.SortOrder
    };
  };
  ChannelsTab.prototype.getSortByValue = function () {
    var query = {};
    _usersettings.default.addLiveTvChannelSortingToQuery(query, _globalize.default);
    return query.SortBy;
  };
  ChannelsTab.prototype.loadTemplate = function () {
    return this.loadItemsTemplate();
  };
  var _default = _exports.default = ChannelsTab;
});
