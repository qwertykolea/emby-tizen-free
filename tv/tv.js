define(["exports", "./../modules/tabbedview/tabbedview.js", "./../modules/common/globalize.js", "./../modules/emby-elements/emby-itemscontainer/emby-itemscontainer.js", "./../modules/emby-elements/emby-button/emby-button.js", "./../modules/emby-elements/emby-scroller/emby-scroller.js"], function (_exports, _tabbedview, _globalize, _embyItemscontainer, _embyButton, _embyScroller) {
  Object.defineProperty(_exports, "__esModule", {
    value: true
  });
  _exports.default = void 0;
  /* jshint module: true */

  function getDefaultSubviews() {
    return ['series', 'suggestions', 'upcoming', 'favorites', 'genres', 'studios', 'episodes', 'folders'];
  }
  function getTabs() {
    var subviews = this.item.Subviews || getDefaultSubviews();
    return [{
      name: _globalize.default.translate('Shows'),
      id: 'series',
      enabled: subviews.includes('series')
    }, {
      name: _globalize.default.translate('Suggestions'),
      id: 'suggestions'
    }, {
      name: _globalize.default.translate('Upcoming'),
      id: 'upcoming'
    }, {
      name: _globalize.default.translate('Favorites'),
      id: 'favorites'
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
      name: _globalize.default.translate('Networks'),
      id: 'studios',
      enabled: subviews.includes('studios')
    }, {
      name: _globalize.default.translate('Episodes'),
      id: 'episodes',
      enabled: subviews.includes('episodes')
    }, {
      name: _globalize.default.translate('Folders'),
      id: 'folders'
    }];
  }
  function TVView(view, params) {
    _tabbedview.default.apply(this, arguments);
  }
  Object.assign(TVView.prototype, _tabbedview.default.prototype);
  TVView.prototype.getTabs = getTabs;
  TVView.prototype.getAutoBackdropItemTypes = function () {
    return ['Series'];
  };
  TVView.prototype.loadTabController = function (id) {
    switch (id) {
      case 'series':
        return Emby.importModule('./modules/tabbedview/seriestab.js');
      case 'suggestions':
        return Emby.importModule('./tv/suggestions.js');
      case 'upcoming':
        return Emby.importModule('./tv/upcoming.js');
      case 'favorites':
        return Emby.importModule('./tv/favorites.js');
      case 'collections':
        return Emby.importModule('./modules/tabbedview/collectionstab.js');
      case 'genres':
        return Emby.importModule('./modules/tabbedview/genrestab.js');
      case 'studios':
        return Emby.importModule('./tv/studios.js');
      case 'tags':
        return Emby.importModule('./modules/tabbedview/tagstab.js');
      case 'episodes':
        return Emby.importModule('./modules/tabbedview/videostab.js');
      case 'folders':
        return Emby.importModule('./modules/tabbedview/folderstab.js');
      default:
        throw new Error('tab not found: ' + id);
    }
  };
  TVView.prototype.supportsHorizontalTabScroll = function () {
    return true;
  };
  TVView.prototype.getTabControllerOptions = function (id) {
    var options = _tabbedview.default.prototype.getTabControllerOptions.apply(this, arguments);
    if (id === 'genres') {
      // match the list screen once they click a genre
      options.queryIncludeItemTypes = ['Series'];
    } else if (id === 'episodes') {
      options.itemType = 'Episode';
      options.enableAlphaPicker = false;
    }
    return options;
  };
  var _default = _exports.default = TVView;
});
