define(["exports", "./../modules/emby-elements/emby-scroller/emby-scroller.js", "./../modules/layoutmanager.js", "./../modules/common/globalize.js", "./../modules/common/usersettings/usersettings.js", "./../modules/emby-apiclient/connectionmanager.js", "./../modules/tabbedview/sectionscontroller.js"], function (_exports, _embyScroller, _layoutmanager, _globalize, _usersettings, _connectionmanager, _sectionscontroller) {
  Object.defineProperty(_exports, "__esModule", {
    value: true
  });
  _exports.default = void 0;
  /* jshint module: true */

  function enableWrappedListView() {
    if (_layoutmanager.default.tv) {
      return false;
    }
    return true;
  }
  function addParentItemToQuery(instance, section, query) {
    var options = instance.options;
    var item = options.item;
    var parentId = instance.params.parentId;
    if (parentId) {
      query.ParentId = parentId;
    }
    var itemType = item.Type;
    switch (itemType) {
      case 'Genre':
      case 'MusicGenre':
      case 'GameGenre':
        query.GenreIds = item.Id;
        break;
      case 'Studio':
        query.StudioIds = item.Id;
        break;
      case 'Person':
        query.PersonIds = item.Id;
        break;
      case 'MusicArtist':
        query.ArtistIds = item.Id;
        break;
      case 'MusicAlbum':
        query.AlbumIds = item.Id;
        break;
      case 'Tag':
        query.TagIds = item.Id;
        break;
      case 'BoxSet':
        query.ParentId = item.Id;
        break;
      case 'Folder':
        if (section.LinkedItemType === 'Person') {
          return;
        }
        query.ParentId = item.Id;
        break;
      default:
        break;
    }
  }
  function getSupportedSections(item, collectionType) {
    var parentItemType = item == null ? void 0 : item.Type;
    var wrappedList = enableWrappedListView();
    var sortBy = 'ProductionYear,PremiereDate,SortName';
    var sortOrder = 'Descending,Descending,Ascending';
    var sections = [{
      LinkedItemType: 'TvChannel',
      Name: _globalize.default.translate('Channels'),
      CollectionType: 'livetv',
      ListOptions: {
        fields: ['Name', 'ProductionYear']
      },
      QueryOptions: {
        IncludeItemTypes: 'TvChannel',
        SortBy: 'SortName',
        SortOrder: 'Ascending'
      }
    }, {
      LinkedItemType: 'MovieSeries',
      Name: _globalize.default.translate('MoviesAndShows'),
      ListOptions: {
        fields: ['Name', 'ProductionYear']
      },
      QueryOptions: {
        IncludeItemTypes: 'Movie,Series',
        SortBy: sortBy,
        SortOrder: sortOrder
      }
    }, {
      LinkedItemType: 'Movie',
      Name: _globalize.default.translate('Movies'),
      CollectionType: 'movies',
      ListOptions: {
        fields: ['Name', 'ProductionYear']
      },
      QueryOptions: {
        IncludeItemTypes: 'Movie',
        SortBy: sortBy,
        SortOrder: sortOrder
      }
    }, {
      LinkedItemType: 'Series',
      Name: _globalize.default.translate('Shows'),
      CollectionType: 'tvshows',
      ListOptions: {
        fields: ['Name', 'ProductionYear']
      },
      QueryOptions: {
        IncludeItemTypes: 'Series',
        SortBy: sortBy,
        SortOrder: sortOrder
      }
    }, {
      LinkedItemType: 'Season',
      Name: _globalize.default.translate('Seasons'),
      CollectionType: 'tvshows',
      ListOptions: {
        fields: ['ParentName', 'Name']
      },
      QueryOptions: {
        IncludeItemTypes: 'Season',
        SortBy: sortBy,
        SortOrder: sortOrder
      }
    }, {
      LinkedItemType: 'Episode',
      Name: _globalize.default.translate('Episodes'),
      CollectionType: 'tvshows',
      ListOptions: {
        fields: ['ParentName', 'Name']
      },
      QueryOptions: {
        IncludeItemTypes: 'Episode',
        SortBy: 'SeriesName,SortParentIndexNumber,SortIndexNumber,SortName',
        SortOrder: 'Ascending'
      }
    }, {
      LinkedItemType: 'BoxSet',
      Name: _globalize.default.translate('Collections'),
      CollectionType: 'boxsets',
      disableLink: true,
      ListOptions: {
        fields: ['Name', 'ProductionYear']
      },
      QueryOptions: {
        IncludeItemTypes: 'BoxSet',
        SortBy: sortBy,
        SortOrder: sortOrder
      }
    }, {}];
    if (parentItemType === 'BoxSet') {
      sections.push({
        LinkedItemType: 'MusicArtist',
        Name: collectionType === 'audiobooks' ? _globalize.default.translate('Authors') : _globalize.default.translate('Artists'),
        CollectionType: collectionType,
        CardSizeOffset: -1,
        ListOptions: {
          fields: ['Name'],
          round: true
        },
        QueryOptions: {
          SortBy: 'SortName',
          SortOrder: 'Ascending',
          IncludeItemTypes: 'MusicArtist'
        }
      });
    } else {
      sections.push({
        LinkedItemType: 'MusicArtist',
        Name: collectionType === 'audiobooks' ? _globalize.default.translate('Authors') : _globalize.default.translate('Artists'),
        SectionType: 'artists',
        CollectionType: collectionType,
        CardSizeOffset: -1,
        ListOptions: {
          fields: ['Name'],
          round: true
        },
        QueryOptions: {
          SortBy: 'SortName',
          SortOrder: 'Ascending'
        }
      });
    }
    sections.push({
      LinkedItemType: 'MusicAlbum',
      Name: collectionType === 'audiobooks' ? _globalize.default.translate('HeaderAudioBooks') : _globalize.default.translate('Albums'),
      CollectionType: collectionType,
      ListOptions: {
        fields: parentItemType === 'MusicArtist' ? ['Name', 'ProductionYear'] : ['ParentName', 'Name']
      },
      QueryOptions: {
        IncludeItemTypes: 'MusicAlbum',
        SortBy: sortBy,
        SortOrder: sortOrder
      }
    });
    sections.push({
      LinkedItemType: 'Playlist',
      Name: _globalize.default.translate('Playlists'),
      CollectionType: 'playlists',
      ListOptions: {
        fields: ['Name']
      },
      QueryOptions: {
        IncludeItemTypes: 'Playlist',
        SortBy: 'SortName',
        SortOrder: 'Ascending'
      }
    });
    sections.push({
      LinkedItemType: 'Audio',
      Name: collectionType === 'audiobooks' ? _globalize.default.translate('Episodes') : _globalize.default.translate('Songs'),
      CollectionType: collectionType,
      ListOptions: wrappedList ? {
        action: 'playallfromhere',
        verticalWrap: true,
        mediaInfo: false,
        enableSideMediaInfo: false,
        enableUserDataButtons: false,
        fields: ['Name', 'ParentName']
      } : {
        fields: ['Name', 'ParentName'],
        action: 'playallfromhere',
        sideFooter: true
      },
      ViewType: wrappedList ? 'list' : null,
      QueryOptions: {
        IncludeItemTypes: 'Audio',
        SortBy: 'Album,ParentIndexNumber,IndexNumber,SortName',
        SortOrder: 'Ascending'
      }
    });
    sections.push({
      LinkedItemType: 'MusicVideo',
      Name: _globalize.default.translate('HeaderMusicVideos'),
      CollectionType: 'musicvideos',
      ListOptions: {
        fields: parentItemType === 'MusicArtist' ? ['Name', 'ProductionYear'] : ['ParentName', 'Name']
      },
      QueryOptions: {
        IncludeItemTypes: 'MusicVideo',
        SortBy: sortBy,
        SortOrder: sortOrder
      }
    });
    sections.push({
      LinkedItemType: 'Trailer',
      Name: _globalize.default.translate('Trailers'),
      CollectionType: 'movies',
      ListOptions: {
        fields: ['Name', 'ProductionYear']
      },
      QueryOptions: {
        IncludeItemTypes: 'Trailer',
        SortBy: sortBy,
        SortOrder: sortOrder
      }
    });
    sections.push({
      LinkedItemType: 'Video',
      Name: _globalize.default.translate('Videos'),
      CollectionType: collectionType,
      ListOptions: {
        fields: ['Name', 'ProductionYear']
      },
      QueryOptions: {
        IncludeItemTypes: 'Video',
        SortBy: sortBy,
        SortOrder: sortOrder
      }
    });
    sections.push({
      LinkedItemType: 'Photo',
      Name: _globalize.default.translate('Photos'),
      CollectionType: collectionType,
      ListOptions: {
        fields: ['Name', 'ProductionYear']
      },
      QueryOptions: {
        IncludeItemTypes: 'Photo',
        SortBy: sortBy,
        SortOrder: sortOrder
      }
    });
    sections.push({
      LinkedItemType: 'Game',
      Name: _globalize.default.translate('Games'),
      CollectionType: collectionType,
      ListOptions: {
        fields: ['Name', 'ProductionYear']
      },
      QueryOptions: {
        IncludeItemTypes: 'Game',
        SortBy: sortBy,
        SortOrder: sortOrder
      }
    });
    sections.push({
      LinkedItemType: 'Book',
      Name: _globalize.default.translate('Books'),
      CollectionType: collectionType,
      ListOptions: {
        fields: ['Name', 'ProductionYear']
      },
      QueryOptions: {
        IncludeItemTypes: 'Book',
        SortBy: sortBy,
        SortOrder: sortOrder
      }
    });
    sections.push({
      LinkedItemType: 'Folder',
      Name: _globalize.default.translate('Folders'),
      ListOptions: {
        fields: ['Name']
      },
      QueryOptions: {
        IncludeItemTypes: 'Folder',
        SortBy: 'SortName',
        SortOrder: 'Ascending'
      },
      disableLink: true
    });
    if (parentItemType === 'BoxSet') {
      sections.push({
        LinkedItemType: 'Person',
        Name: _globalize.default.translate('People'),
        ListOptions: {
          fields: ['Name']
        },
        QueryOptions: {
          IncludeItemTypes: 'Person',
          SortBy: 'SortName',
          SortOrder: 'Ascending'
        },
        disableLink: true
      });
    } else {
      sections.push({
        LinkedItemType: 'Person',
        Name: _globalize.default.translate('People'),
        SectionType: 'people',
        ListOptions: {
          fields: ['Name']
        },
        QueryOptions: {
          SortBy: 'SortName',
          SortOrder: 'Ascending'
        },
        disableLink: true
      });
    }
    sections.push({
      LinkedItemType: 'Item',
      Name: _globalize.default.translate('Items'),
      ListOptions: {
        fields: ['Name', 'ProductionYear']
      },
      QueryOptions: {
        SortBy: sortBy,
        SortOrder: sortOrder
      },
      disableLink: true,
      disableLinkedItemType: true
    });
    return sections;
  }
  function filterItemTypes(itemTypes, supportedSections) {
    return itemTypes.filter(function (t) {
      return supportedSections.filter(function (s) {
        return s.LinkedItemType === t;
      }).length > 0;
    });
  }
  function LinkedItemsView(view, params, options) {
    this.options = options;
    this.params = params;
    _sectionscontroller.default.apply(this, arguments);
  }
  Object.assign(LinkedItemsView.prototype, _sectionscontroller.default.prototype);
  function addRecursive(instance, section, query) {
    var _instance$options$ite;
    var itemType = (_instance$options$ite = instance.options.item) == null ? void 0 : _instance$options$ite.Type;
    switch (itemType) {
      case 'BoxSet':
        break;
      default:
        query.Recursive = true;
        break;
    }
  }
  function fetchItemTypes(instance, parent) {
    var apiClient = _connectionmanager.default.getApiClient(parent);
    var query = {};
    addParentItemToQuery(instance, {}, query);

    // do not allow recursive to be true for boxsets on 4.8
    addRecursive(instance, {}, query);
    return apiClient.getItemTypes(apiClient.getCurrentUserId(), query).then(function (result) {
      return result.Items.map(function (i) {
        return i.Name;
      });
    });
  }
  function loadItemTypes(instance, parent) {
    var itemType = parent.Type;
    var itemTypes = [];
    switch (itemType) {
      case 'Person':
      case 'Tag':
      case 'Genre':
        itemTypes.push('Movie');
        itemTypes.push('Video');
        itemTypes.push('Trailer');
        break;
      default:
        break;
    }
    switch (itemType) {
      case 'Person':
      case 'Tag':
      case 'Genre':
        itemTypes.push('Series');
        break;
      default:
        break;
    }
    switch (itemType) {
      case 'Person':
      case 'Tag':
      case 'Genre':
        itemTypes.push('Episode');
        break;
      default:
        break;
    }
    switch (itemType) {
      case 'MusicGenre':
      case 'Tag':
        itemTypes.push('MusicArtist');
        itemTypes.push('MusicAlbum');
        break;
      default:
        break;
    }
    switch (itemType) {
      case 'Genre':
      case 'MusicGenre':
      case 'Tag':
        itemTypes.push('Playlist');
        break;
      default:
        break;
    }
    switch (itemType) {
      case 'Studio':
      case 'MusicGenre':
      case 'Tag':
        itemTypes.push('Audio');
        break;
      default:
        break;
    }
    switch (itemType) {
      case 'Person':
      case 'MusicArtist':
      case 'Tag':
      case 'MusicGenre':
      case 'MusicAlbum':
        itemTypes.push('MusicVideo');
        break;
      default:
        break;
    }
    switch (itemType) {
      case 'Tag':
        itemTypes.push('Game');
        itemTypes.push('Photo');
        itemTypes.push('Person');
        break;
      default:
        break;
    }
    switch (itemType) {
      case 'GameGenre':
        itemTypes.push('Game');
        break;
      default:
        break;
    }
    switch (itemType) {
      case 'BoxSet':
        break;
      case 'Tag':
      case 'Person':
        // apparently these are coming up empty in 4.8
        var apiClient = _connectionmanager.default.getApiClient(parent);
        if (apiClient.isMinServerVersion('4.9.0.30')) {
          break;
        }
        return Promise.resolve(normalizeItemTypes(parent, itemTypes));
      default:
        return Promise.resolve(normalizeItemTypes(parent, itemTypes));
    }
    return fetchItemTypes(instance, parent).then(function (types) {
      if (!types.length) {
        types = ['Item'];
      }
      switch (itemType) {
        case 'BoxSet':
          var groupItems = _usersettings.default.groupCollectionItems();
          if (!groupItems && types.length > 1) {
            types = ['Item'];
          }
          break;
        default:
          break;
      }
      return normalizeItemTypes(parent, types);
    });
  }
  function normalizeItemTypes(item, types) {
    return types;
  }
  LinkedItemsView.prototype.fetchSections = function () {
    var instance = this;
    var item = instance.options.item;
    return loadItemTypes(instance, item).then(function (itemTypes) {
      var params = instance.params;
      var apiClient = instance.getApiClient();
      return (params.parentId ? apiClient.getItem(apiClient.getCurrentUserId(), params.parentId) : Promise.resolve()).then(function (parentItem) {
        var collectionType = parentItem == null ? void 0 : parentItem.CollectionType;
        var supportedSections = getSupportedSections(item, collectionType);
        itemTypes = filterItemTypes(itemTypes, supportedSections);
        var scrollDirection = null;
        var renderedSectionCount = 0;
        for (var i = 0, length = supportedSections.length; i < length; i++) {
          var section = supportedSections[i];
          if (itemTypes.includes(section.LinkedItemType)) {
            renderedSectionCount++;
          }
        }
        var itemType = item == null ? void 0 : item.Type;
        switch (itemType) {
          case 'BoxSet':
          case 'Tag':
          case 'Person':
            if (renderedSectionCount < 2) {
              scrollDirection = 'Vertical';
            }
            break;
          default:
            break;
        }
        var sections = [];
        for (var _i = 0, _length = supportedSections.length; _i < _length; _i++) {
          var supportedSectionInfo = supportedSections[_i];
          if (!itemTypes.includes(supportedSectionInfo.LinkedItemType)) {
            continue;
          }
          var monitor = (supportedSectionInfo.Monitor || []).slice(0);
          var monitorIds = (supportedSectionInfo.MonitorIds || []).slice(0);
          switch (itemType) {
            case 'BoxSet':
              monitor.push('CollectionItems');
              monitorIds.push(item.Id);
              break;
            default:
              break;
          }
          var href = supportedSectionInfo.disableLink ? null : 'list/list.html?type=' + (supportedSectionInfo.QueryOptions.IncludeItemTypes || supportedSectionInfo.LinkedItemType);
          if (href) {
            switch (itemType) {
              case 'Genre':
                href += '&genreId=' + params.id;
                break;
              case 'MusicGenre':
                href += '&musicGenreId=' + params.id;
                break;
              case 'GameGenre':
                href += '&gameGenreId=' + params.id;
                break;
              case 'Studio':
                href += '&studioId=' + params.id;
                break;
              case 'Person':
                href += '&personId=' + params.id;
                break;
              case 'MusicArtist':
                href += '&artistId=' + params.id;
                break;
              case 'Tag':
                href += '&tagId=' + params.id;
                break;
              case 'BoxSet':
              case 'Folder':
                href += '&parentId=' + params.id;
                break;
              default:
                break;
            }
            var parentId = params.parentId;
            if (parentId) {
              href += '&parentId=' + parentId;
            }
            href += '&serverId=' + params.serverId;
          }
          if (itemType === 'BoxSet') {
            href = null;
          }
          var newSection = Object.assign({
            Id: 'LinkedItems_' + supportedSectionInfo.LinkedItemType,
            Href: href,
            ScrollDirection: scrollDirection,
            Monitor: monitor,
            MonitorIds: monitorIds
          }, supportedSectionInfo);
          newSection.ListOptions = Object.assign({
            fields: instance.getRequestedItemFields()
          }, newSection.ListOptions);
          addRecursive(instance, newSection, newSection.QueryOptions);

          // why is this always applied?
          //if (itemType !== 'BoxSet' || apiClient.isMinServerVersion('4.9.0')) {
          //    newSection.QueryOptions.Recursive = true;
          //}

          addParentItemToQuery(instance, newSection, newSection.QueryOptions);
          if (itemType === 'BoxSet') {
            var sortBy = _usersettings.default.itemSortBy(item.Id) || 'default';
            if (sortBy === 'default') {
              sortBy = 'DisplayOrder';
            }
            if (!apiClient.isMinServerVersion('4.8.0.16')) {
              sortBy = null;
            }
            var sortOrder = sortBy ? _usersettings.default.itemSortOrder(item.Id) : null;
            newSection.QueryOptions.SortBy = sortBy;
            newSection.QueryOptions.SortOrder = sortOrder;
          }
          sections.push(newSection);
        }
        return sections;
      });
    });
  };
  LinkedItemsView.prototype.getRequestedItemFields = function () {
    return this.options.requestedItemFields;
  };
  LinkedItemsView.prototype.getRequestedImageTypes = function () {
    return this.options.requestedImageTypes;
  };
  LinkedItemsView.prototype.getApiClient = function () {
    return this.options.apiClient;
  };
  LinkedItemsView.prototype.scrollDirection = function () {
    return 'y';
  };
  function normalizeCollectionItems(result) {
    var instance = this;
    var collectionId = instance.options.item.Id;
    var items = result.Items;
    for (var i = 0, length = items.length; i < length; i++) {
      items[i].CollectionId = collectionId;
    }
    return result;
  }
  LinkedItemsView.prototype.fetchSectionItems = function (query) {
    var _instance$options$ite2;
    var bindInfo = this;
    var instance = bindInfo.instance;
    var section = bindInfo.section;
    if (section.Items) {
      return _sectionscontroller.default.prototype.fetchSectionItems.apply(this, arguments);
    }
    if (((_instance$options$ite2 = instance.options.item) == null ? void 0 : _instance$options$ite2.Type) === 'BoxSet') {
      return _sectionscontroller.default.prototype.fetchSectionItems.apply(this, arguments).then(normalizeCollectionItems.bind(instance));
    }
    return _sectionscontroller.default.prototype.fetchSectionItems.apply(this, arguments);
  };
  LinkedItemsView.prototype.getSectionsContainer = function () {
    return this.view;
  };
  LinkedItemsView.prototype.getBottomHtml = function () {
    return '';
  };
  LinkedItemsView.prototype.resume = function (options) {
    return _sectionscontroller.default.prototype.onResume.apply(this, arguments);
  };
  LinkedItemsView.prototype.pause = function () {
    _sectionscontroller.default.prototype.onPause.apply(this, arguments);
  };
  LinkedItemsView.prototype.destroy = function () {
    _sectionscontroller.default.prototype.destroy.apply(this, arguments);
    this.options = null;
    this.params = null;
  };
  var _default = _exports.default = LinkedItemsView;
});
