define(["exports", "./itemstab.js"], function (_exports, _itemstab) {
  Object.defineProperty(_exports, "__esModule", {
    value: true
  });
  _exports.default = void 0;
  /* jshint module: true */

  function CollectionsTab(view, params, options) {
    _itemstab.default.apply(this, arguments);
  }
  Object.assign(CollectionsTab.prototype, _itemstab.default.prototype);
  CollectionsTab.prototype.getSettingsKey = function () {
    return _itemstab.default.prototype.getSettingsKey.call(this) + '-collections';
  };
  CollectionsTab.prototype.getBaseQuery = function () {
    var query = _itemstab.default.prototype.getBaseQuery.apply(this, arguments);

    // used by live tv
    if (this.options && this.options.parentId) {
      query.ParentId = this.options.parentId;
    }
    return query;
  };
  CollectionsTab.prototype.getItemTypes = function () {
    return ['BoxSet'];
  };
  CollectionsTab.prototype.loadTemplate = function () {
    return this.loadItemsTemplate();
  };
  var _default = _exports.default = CollectionsTab;
});
