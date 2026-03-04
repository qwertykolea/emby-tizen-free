define(["exports", "./../modules/tabbedview/basetab.js", "./../modules/common/globalize.js", "./../modules/emby-elements/emby-itemscontainer/emby-itemscontainer.js", "./../modules/emby-elements/emby-button/emby-button.js", "./../modules/emby-elements/emby-scroller/emby-scroller.js", "./../modules/layoutmanager.js", "./../modules/approuter.js", "./../modules/tabbedview/sectionscontroller.js", "./../modules/common/itemmanager/itemmanager.js", "./../modules/emby-apiclient/connectionmanager.js"], function (_exports, _basetab, _globalize, _embyItemscontainer, _embyButton, _embyScroller, _layoutmanager, _approuter, _sectionscontroller, _itemmanager, _connectionmanager) {
  Object.defineProperty(_exports, "__esModule", {
    value: true
  });
  _exports.default = void 0;
  /* jshint module: true */

  function MovieSuggestionsTab(view, params) {
    _basetab.default.apply(this, arguments);
    _sectionscontroller.default.apply(this, arguments);
    this.view = view;
    this.params = params;
  }
  Object.assign(MovieSuggestionsTab.prototype, _basetab.default.prototype);
  Object.assign(MovieSuggestionsTab.prototype, _sectionscontroller.default.prototype);
  MovieSuggestionsTab.prototype.onSpotlightButtonCustomAction = function (options) {
    var _item$Id;
    var item = options.item;
    if ((_item$Id = item.Id) != null && _item$Id.startsWith('videos_')) {
      var apiClient = _connectionmanager.default.getApiClient(item);
      var url = '/videos?serverId=' + apiClient.serverId() + '&parentId=' + item.ParentId;
      var idParts = item.Id.split('_');
      if (idParts.length > 1) {
        url += '&tab=' + idParts[1];
      }
      _approuter.default.show(url);
      return;
    }
    return _sectionscontroller.default.prototype.onSpotlightButtonCustomAction.apply(this, arguments);
  };
  MovieSuggestionsTab.prototype.fetchSections = function () {
    var instance = this;
    var apiClient = instance.getApiClient();
    var parentId = instance.params.parentId;
    var viewScrollX = this.scrollDirection() === 'x';
    var url = apiClient.getUrl("Movies/Recommendations", {
      userId: apiClient.getCurrentUserId(),
      categoryLimit: 6,
      ItemLimit: viewScrollX ? 6 : 12,
      Fields: instance.getRequestedItemFields() + ',PrimaryImageAspectRatio,ProductionYear',
      ImageTypeLimit: 1,
      EnableImageTypes: instance.getRequestedImageTypes(),
      GroupProgramsBySeries: true,
      ParentId: parentId
    });
    return apiClient.getJSON(url).then(function (recommendations) {
      var sections = [];
      var enableFocusPreview = instance.enableFocusPreview();
      var serverId = instance.serverId();
      if (viewScrollX && instance.options.addCategories) {
        sections.push({
          Id: 'Spotlight',
          Name: ' ',
          SectionType: 'spotlight',
          CollectionType: 'movies',
          Monitor: [],
          ListOptions: {
            shape: 'backdrop',
            multiSelect: false,
            overlayText: true,
            fields: ['Name'],
            cardClass: 'wideSpotlightCard',
            coverImage: true
          },
          QueryOptions: {
            SortBy: "Random",
            IncludeItemTypes: "Movie",
            Recursive: true,
            ParentId: parentId,
            EnableImageTypes: "Backdrop,Logo",
            ImageTypes: "Backdrop",
            Fields: 'Taglines',
            ImageTypeLimit: 1,
            Limit: 1
          },
          CommandOptions: {},
          // 30 seconds
          RefreshInterval: 1000 * 30,
          SpotlightButtons: [{
            Name: _globalize.default.translate('Movies'),
            Id: 'videos_movies',
            ParentId: parentId,
            ServerId: serverId,
            Icon: _itemmanager.default.getDefaultIcon({
              Type: 'Movie'
            }),
            // for focus handler to ignore
            Type: 'AppCategory',
            IsFolder: true
          }, {
            Name: _globalize.default.translate('Favorites'),
            Id: 'videos_favorites',
            ParentId: parentId,
            ServerId: serverId,
            Icon: 'favorite',
            // for focus handler to ignore
            Type: 'AppCategory',
            IsFolder: true
          }, {
            Name: _globalize.default.translate('Collections'),
            Id: 'videos_collections',
            ParentId: parentId,
            ServerId: serverId,
            Icon: _itemmanager.default.getDefaultIcon({
              Type: 'BoxSet'
            }),
            // for focus handler to ignore
            Type: 'AppCategory',
            IsFolder: true
          }]
        });
      }
      sections.push({
        Name: _globalize.default.translate('HeaderContinueWatching'),
        SectionType: 'resume',
        CollectionType: 'movies',
        Monitor: ['videoplayback', 'markplayed'],
        ListOptions: {
          fields: enableFocusPreview ? [] : ['ParentNameOrName', 'ProductionYear'],
          preferThumb: true
        },
        QueryOptions: {
          IncludeItemTypes: 'Movie',
          ParentId: parentId,
          Recursive: true
        },
        CommandOptions: {
          removeFromResume: true
        }
      });
      sections.push({
        Name: _globalize.default.translate('HeaderLatestMovies'),
        SectionType: 'latestmedia',
        CollectionType: 'movies',
        Monitor: ['videoplayback', 'markplayed'],
        ListOptions: {
          fields: enableFocusPreview ? [] : ['ParentNameOrName', 'ProductionYear']
        },
        QueryOptions: {
          IncludeItemTypes: 'Movie',
          ParentId: parentId,
          Recursive: true
        }
      });
      for (var i = 0, length = recommendations.length; i < length; i++) {
        var recommendation = recommendations[i];
        var title = '';
        switch (recommendation.RecommendationType) {
          case 'SimilarToRecentlyPlayed':
            title = _globalize.default.translate('BecauseYouWatchedValue', recommendation.BaselineItemName);
            break;
          case 'SimilarToLikedItem':
            title = _globalize.default.translate('BecauseYouLikeValue', recommendation.BaselineItemName);
            break;
          case 'HasDirectorFromRecentlyPlayed':
          case 'HasLikedDirector':
            title = _globalize.default.translate('DirectedByValue', recommendation.BaselineItemName);
            break;
          case 'HasActorFromRecentlyPlayed':
          case 'HasLikedActor':
            title = _globalize.default.translate('StarringValue', recommendation.BaselineItemName);
            break;
        }
        sections.push({
          Name: title,
          CollectionType: 'movies',
          Monitor: [],
          ListOptions: {
            fields: enableFocusPreview ? [] : ['ParentNameOrName', 'ProductionYear']
          },
          QueryOptions: {
            ParentId: parentId,
            Recursive: true
          },
          Items: recommendation.Items
        });
      }
      return sections;
    });
  };
  MovieSuggestionsTab.prototype.enablePushDownFocusPreview = function () {
    return _layoutmanager.default.tv && this.scrollDirection() === 'y';
  };
  MovieSuggestionsTab.prototype.onResume = function (options) {
    _basetab.default.prototype.onResume.apply(this, arguments);
    return _sectionscontroller.default.prototype.onResume.apply(this, arguments);
  };
  MovieSuggestionsTab.prototype.onPause = function () {
    _basetab.default.prototype.onPause.apply(this, arguments);
    _sectionscontroller.default.prototype.onPause.apply(this, arguments);
  };
  MovieSuggestionsTab.prototype.destroy = function () {
    _basetab.default.prototype.destroy.apply(this, arguments);
    _sectionscontroller.default.prototype.destroy.apply(this, arguments);
    this.apiClient = null;
  };
  var _default = _exports.default = MovieSuggestionsTab;
});
