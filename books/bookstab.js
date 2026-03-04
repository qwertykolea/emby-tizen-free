define(["exports", "./../modules/tabbedview/itemstab.js"], function (_exports, _itemstab) {
  Object.defineProperty(_exports, "__esModule", {
    value: true
  });
  _exports.default = void 0;
  /* jshint module: true */

  function BooksTab(view, params, options) {
    _itemstab.default.apply(this, arguments);
  }
  Object.assign(BooksTab.prototype, _itemstab.default.prototype);
  BooksTab.prototype.loadTemplate = function () {
    return this.loadItemsTemplate();
  };
  BooksTab.prototype.getSettingsKey = function () {
    return _itemstab.default.prototype.getSettingsKey.call(this) + '-' + 'books';
  };
  BooksTab.prototype.getItemTypes = function () {
    return ['Book'];
  };
  var _default = _exports.default = BooksTab;
});
