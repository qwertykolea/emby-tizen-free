define(["exports", "./../modules/tabbedview/videostab.js", "./../modules/approuter.js", "./../modules/common/globalize.js"], function (_exports, _videostab, _approuter, _globalize) {
  Object.defineProperty(_exports, "__esModule", {
    value: true
  });
  _exports.default = void 0;
  /* jshint module: true */

  function TrailersTab(view, params, options) {
    if (!options) {
      options = {};
    }
    options.itemType = 'Trailer';
    _videostab.default.apply(this, arguments);
  }
  Object.assign(TrailersTab.prototype, _videostab.default.prototype);
  TrailersTab.prototype.getBaseQuery = function () {
    var query = _videostab.default.prototype.getBaseQuery.apply(this, arguments);
    var premiereDate = new Date();
    premiereDate.setTime(premiereDate.getTime() - 86400000 * 720);
    query.MinPremiereDate = premiereDate.toISOString();
    return query;
  };
  TrailersTab.prototype.isGlobalQuery = function () {
    // don't apply parentId to queries
    return true;
  };
  TrailersTab.prototype.getSettingsKey = function () {
    return _videostab.default.prototype.getSettingsKey.call(this) + '-trailers';
  };
  TrailersTab.prototype.getItemTypes = function () {
    return ['Trailer'];
  };
  function getDefaultEmptyListMessage() {
    return Promise.resolve(_globalize.default.translate('NoTrailersMessage', '', ''));
  }
  TrailersTab.prototype.getEmptyListMessage = function () {
    return this.apiClient.getCurrentUser().then(function (user) {
      var pluginCatalogRouteUrl = _approuter.default.getRouteUrl('PluginCatalog');
      if (user.Policy.IsAdministrator && _approuter.default.getRouteInfo(pluginCatalogRouteUrl)) {
        return '<div>' + _globalize.default.translate('NoTrailersMessage', '<a is="emby-linkbutton" class="button-link" href="' + pluginCatalogRouteUrl + '">', '</a></div>');
      }
      return getDefaultEmptyListMessage();
    }, getDefaultEmptyListMessage);
  };
  var _default = _exports.default = TrailersTab;
});
