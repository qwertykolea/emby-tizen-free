define(["exports", "./itemstab.js"], function (_exports, _itemstab) {
  Object.defineProperty(_exports, "__esModule", {
    value: true
  });
  _exports.default = void 0;
  /* jshint module: true */

  function GenresTab(view, params, options) {
    _itemstab.default.apply(this, arguments);
  }
  Object.assign(GenresTab.prototype, _itemstab.default.prototype);
  GenresTab.prototype.getSettingsKey = function () {
    return _itemstab.default.prototype.getSettingsKey.call(this) + '-genres';
  };
  GenresTab.prototype.getPrefixesApiClientMethodName = function () {
    if (this.options && this.options.prefixesApiClientMethod) {
      return this.options.prefixesApiClientMethod;
    }
    return _itemstab.default.prototype.getPrefixesApiClientMethodName.apply(this, arguments);
  };
  GenresTab.prototype.getApiClientQueryMethodName = function () {
    return 'getGenres';
  };
  GenresTab.prototype.getSortMenuOptions = function () {
    return [];
  };
  GenresTab.prototype.loadTemplate = function () {
    return this.loadItemsTemplate();
  };
  GenresTab.prototype.getQueryIncludeItemTypes = function () {
    return this.options.queryIncludeItemTypes;
  };
  GenresTab.prototype.getItemTypes = function () {
    return ['Genre'];
  };
  var _default = _exports.default = GenresTab;
});
