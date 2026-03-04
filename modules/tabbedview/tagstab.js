define(["exports", "./itemstab.js"], function (_exports, _itemstab) {
  Object.defineProperty(_exports, "__esModule", {
    value: true
  });
  _exports.default = void 0;
  /* jshint module: true */

  function TagsTab(view, params, options) {
    _itemstab.default.apply(this, arguments);
  }
  Object.assign(TagsTab.prototype, _itemstab.default.prototype);
  TagsTab.prototype.getSettingsKey = function () {
    return _itemstab.default.prototype.getSettingsKey.call(this) + '-tags';
  };
  TagsTab.prototype.getPrefixesApiClientMethodName = function () {
    if (this.options && this.options.prefixesApiClientMethod) {
      return this.options.prefixesApiClientMethod;
    }
    return _itemstab.default.prototype.getPrefixesApiClientMethodName.apply(this, arguments);
  };
  TagsTab.prototype.getApiClientQueryMethodName = function () {
    if (this.options && this.options.tagsApiClientMethod) {
      return this.options.tagsApiClientMethod;
    }
    return _itemstab.default.prototype.getApiClientQueryMethodName.apply(this, arguments);
  };
  TagsTab.prototype.getSortMenuOptions = function () {
    return [];
  };
  TagsTab.prototype.getContext = function () {
    if (this.options.tagsApiClientMethod === 'getLiveTvChannelTags') {
      return 'livetv';
    }
    return _itemstab.default.prototype.getContext.apply(this, arguments);
  };
  TagsTab.prototype.getItemTypes = function () {
    return ['Tag'];
  };
  TagsTab.prototype.loadTemplate = function () {
    return this.loadItemsTemplate();
  };
  var _default = _exports.default = TagsTab;
});
