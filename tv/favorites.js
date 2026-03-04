define(["exports", "./../modules/emby-apiclient/connectionmanager.js", "./../modules/common/globalize.js", "./../modules/layoutmanager.js", "./../modules/tabbedview/basetab.js", "./../modules/emby-elements/emby-itemscontainer/emby-itemscontainer.js", "./../modules/emby-elements/emby-scroller/emby-scroller.js", "./../modules/tabbedview/sectionscontroller.js"], function (_exports, _connectionmanager, _globalize, _layoutmanager, _basetab, _embyItemscontainer, _embyScroller, _sectionscontroller) {
  Object.defineProperty(_exports, "__esModule", {
    value: true
  });
  _exports.default = void 0;
  /* jshint module: true */

  function TvFavoritesTab(view, params) {
    _basetab.default.apply(this, arguments);
    _sectionscontroller.default.apply(this, arguments);
    this.view = view;
    this.params = params;
    this.apiClient = _connectionmanager.default.getApiClient(params.serverId);
  }
  Object.assign(TvFavoritesTab.prototype, _basetab.default.prototype);
  Object.assign(TvFavoritesTab.prototype, _sectionscontroller.default.prototype);
  function FavoritesTab(view, params) {
    _basetab.default.apply(this, arguments);
    _sectionscontroller.default.apply(this, arguments);
    this.view = view;
    this.params = params;
    this.apiClient = _connectionmanager.default.currentApiClient();
  }
  Object.assign(FavoritesTab.prototype, _basetab.default.prototype);
  Object.assign(FavoritesTab.prototype, _sectionscontroller.default.prototype);
  TvFavoritesTab.prototype.fetchSections = function () {
    var instance = this;
    var sections = [];
    var monitor = ['markfavorite'];
    var enableFocusPreview = instance.enableFocusPreview();
    var parentId = instance.params.parentId;
    sections.push({
      Id: 'Series',
      Name: _globalize.default.translate('HeaderFavoriteShows'),
      CollectionType: 'tvshows',
      Monitor: monitor,
      ListOptions: {
        fields: enableFocusPreview ? [] : ['Name', 'ProductionYear']
      },
      QueryOptions: {
        IncludeItemTypes: "Series",
        ParentId: parentId,
        Recursive: true
      },
      // we should limit them, but since there's only two sections it will avoid users complaining
      LimitItems: false
    });
    sections.push({
      Id: 'Episodes',
      Name: _globalize.default.translate('HeaderFavoriteEpisodes'),
      CollectionType: 'tvshows',
      Monitor: monitor,
      ListOptions: {
        fields: enableFocusPreview ? [] : ['ParentName', 'Name'],
        preferThumb: false
      },
      QueryOptions: {
        IncludeItemTypes: "Episode",
        ParentId: parentId,
        Recursive: true
      },
      // we should limit them, but since there's only two sections it will avoid users complaining
      LimitItems: false
    });
    for (var i = 0, length = sections.length; i < length; i++) {
      var section = sections[i];
      section.QueryOptions.Filters = 'IsFavorite';
    }
    return Promise.resolve(sections);
  };
  TvFavoritesTab.prototype.enablePushDownFocusPreview = function () {
    return _layoutmanager.default.tv && this.scrollDirection() === 'y';
  };
  TvFavoritesTab.prototype.onResume = function (options) {
    _basetab.default.prototype.onResume.apply(this, arguments);
    return _sectionscontroller.default.prototype.onResume.apply(this, arguments);
  };
  TvFavoritesTab.prototype.onPause = function () {
    _basetab.default.prototype.onPause.apply(this, arguments);
    _sectionscontroller.default.prototype.onPause.apply(this, arguments);
  };
  TvFavoritesTab.prototype.destroy = function () {
    _basetab.default.prototype.destroy.apply(this, arguments);
    _sectionscontroller.default.prototype.destroy.apply(this, arguments);
  };
  var _default = _exports.default = TvFavoritesTab;
});
