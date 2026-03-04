define(["exports", "./itemstab.js"], function (_exports, _itemstab) {
  Object.defineProperty(_exports, "__esModule", {
    value: true
  });
  _exports.default = void 0;
  /* jshint module: true */

  function VideosTab(view, params, options) {
    _itemstab.default.apply(this, arguments);
  }
  Object.assign(VideosTab.prototype, _itemstab.default.prototype);
  VideosTab.prototype.getBaseQuery = function () {
    var _this$options;
    var query = _itemstab.default.prototype.getBaseQuery.call(this);
    if (((_this$options = this.options) == null ? void 0 : _this$options.itemType) === 'Episode') {
      query.ExcludeLocationTypes = 'Virtual';
    }
    return query;
  };
  VideosTab.prototype.getSettingsKey = function () {
    return _itemstab.default.prototype.getSettingsKey.call(this) + '-videos';
  };
  VideosTab.prototype.getItemTypes = function () {
    var _this$options2, _this$options3;
    if ((_this$options2 = this.options) != null && _this$options2.itemTypes) {
      return this.options.itemTypes;
    }
    if ((_this$options3 = this.options) != null && _this$options3.itemType) {
      return [this.options.itemType];
    }
    return [];
  };
  VideosTab.prototype.loadTemplate = function () {
    return this.loadItemsTemplate();
  };
  var _default = _exports.default = VideosTab;
});
