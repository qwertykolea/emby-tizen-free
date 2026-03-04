define(["exports", "./../modules/tabbedview/tabbedview.js", "./../modules/common/globalize.js", "./../modules/emby-elements/emby-itemscontainer/emby-itemscontainer.js", "./../modules/emby-elements/emby-button/emby-button.js", "./../modules/emby-elements/emby-scroller/emby-scroller.js"], function (_exports, _tabbedview, _globalize, _embyItemscontainer, _embyButton, _embyScroller) {
  Object.defineProperty(_exports, "__esModule", {
    value: true
  });
  _exports.default = void 0;
  /* jshint module: true */

  function getTabs() {
    var subviews = this.item.Subviews || [];
    return [{
      name: _globalize.default.translate('Books'),
      id: 'books',
      enabled: subviews.includes('books')
    }, {
      name: _globalize.default.translate('Collections'),
      id: 'collections',
      enabled: subviews.includes('collections')
    }, {
      name: _globalize.default.translate('Genres'),
      id: 'genres',
      enabled: subviews.includes('genres')
    }, {
      name: _globalize.default.translate('Tags'),
      id: 'tags',
      enabled: subviews.includes('tags')
    }, {
      name: _globalize.default.translate('Folders'),
      id: 'folders'
    }];
  }
  function BooksView(view, params) {
    _tabbedview.default.apply(this, arguments);
  }
  Object.assign(BooksView.prototype, _tabbedview.default.prototype);
  BooksView.prototype.getTabs = getTabs;
  BooksView.prototype.getAutoBackdropItemTypes = function () {
    return ['Book'];
  };
  BooksView.prototype.loadTabController = function (id) {
    switch (id) {
      case 'collections':
        return Emby.importModule('./modules/tabbedview/collectionstab.js');
      case 'genres':
        return Emby.importModule('./modules/tabbedview/genrestab.js');
      case 'tags':
        return Emby.importModule('./modules/tabbedview/tagstab.js');
      case 'folders':
        return Emby.importModule('./modules/tabbedview/folderstab.js');
      case 'books':
        return Emby.importModule('./books/bookstab.js');
      default:
        throw new Error('tab not found: ' + id);
    }
  };
  BooksView.prototype.getTabControllerOptions = function (id) {
    var options = _tabbedview.default.prototype.getTabControllerOptions.apply(this, arguments);
    if (id === 'genres') {
      options.queryIncludeItemTypes = ['Book'];
    } else if (id === 'tags') {
      options.queryIncludeItemTypes = ['Book'];
    }
    return options;
  };
  var _default = _exports.default = BooksView;
});
