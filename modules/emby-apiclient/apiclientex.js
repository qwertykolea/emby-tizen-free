define(["exports", "./apiclient.js", "./../localdatabase/localassetmanager.js", "./../common/servicelocator.js"], function (_exports, _apiclient, _localassetmanager, _servicelocator) {
  Object.defineProperty(_exports, "__esModule", {
    value: true
  });
  _exports.default = void 0;
  /* jshint module: true */

  var localPrefix = 'local:';
  var localViewPrefix = 'localview:';
  function isLocalId(str) {
    // for AlbumIds, possibly others
    if (str && Array.isArray(str)) {
      str = str[0];
    }
    return str && str.startsWith('local');
  }
  function mapToId(i) {
    return i.Id;
  }
  function isLocalViewId(str) {
    return str && str.startsWith(localViewPrefix);
  }
  function isTopLevelLocalViewId(str) {
    return str === 'localview';
  }
  function stripLocalPrefix(str) {
    var res = stripStart(str, localPrefix);
    res = stripStart(res, localViewPrefix);
    return res;
  }
  function stripStart(str, find) {
    if (str && find && str.startsWith(find)) {
      return str.substr(find.length);
    }
    return str;
  }
  function normalizeId(id) {
    if (id) {
      id = stripStart(id, 'localview:');
      id = stripStart(id, 'local:');
      return id;
    }
    return null;
  }
  function convertIdToLocal(guid) {
    if (!guid) {
      return null;
    }
    if (isLocalId(guid)) {
      return guid;
    }
    return localPrefix + guid;
  }
  function syncNow() {
    require(['localsync'], function (localSync) {
      localSync.sync();
    });
  }
  function getLocalUrl(_ref) {
    var MediaSources = _ref.MediaSources;
    if (MediaSources && MediaSources.length) {
      var mediaSource = MediaSources[0];
      return mediaSource.StreamUrl || mediaSource.Path;
    }
    return '';
  }
  function getMusicFolders(serverId) {
    var list = [];
    list.push({
      Name: 'Albums',
      ServerId: serverId,
      Id: 'localview:MusicAlbumsView',
      Type: 'MusicAlbumsView',
      IsFolder: true
    });
    list.push({
      Name: 'Songs',
      ServerId: serverId,
      Id: 'localview:MusicSongsView',
      Type: 'MusicSongsView',
      IsFolder: true
    });
    return list;
  }
  function getTopLevelViews(serverId, types, forceIncludeAll) {
    var list = [];
    if (types.includes('Audio') || forceIncludeAll) {
      list.push({
        Name: 'Music',
        ServerId: serverId,
        Id: 'localview:MusicView',
        Type: 'MusicView',
        CollectionType: 'music',
        IsFolder: true
      });
    }
    if (types.includes('Photo') || forceIncludeAll) {
      list.push({
        Name: 'Photos',
        ServerId: serverId,
        Id: 'localview:PhotosView',
        Type: 'PhotosView',
        CollectionType: 'photos',
        IsFolder: true
      });
    }
    if (types.includes('Episode') || forceIncludeAll) {
      list.push({
        Name: 'TV',
        ServerId: serverId,
        Id: 'localview:TVView',
        Type: 'TVView',
        CollectionType: 'tvshows',
        IsFolder: true
      });
    }
    if (types.includes('Movie') || forceIncludeAll) {
      list.push({
        Name: 'Movies',
        ServerId: serverId,
        Id: 'localview:MoviesView',
        Type: 'MoviesView',
        CollectionType: 'movies',
        IsFolder: true
      });
    }
    if (types.includes('Video') || forceIncludeAll) {
      list.push({
        Name: 'Videos',
        ServerId: serverId,
        Id: 'localview:VideosView',
        Type: 'VideosView',
        IsFolder: true
      });
    }
    if (types.includes('MusicVideo') || forceIncludeAll) {
      list.push({
        Name: 'Music Videos',
        ServerId: serverId,
        Id: 'localview:MusicVideosView',
        Type: 'MusicVideosView',
        CollectionType: 'musicvideos',
        IsFolder: true
      });
    }
    if (types.includes('Trailer') || forceIncludeAll) {
      list.push({
        Name: 'Trailers',
        ServerId: serverId,
        Id: 'localview:TrailersView',
        Type: 'TrailersView',
        IsFolder: true
      });
    }
    if (types.includes('Book') || forceIncludeAll) {
      list.push({
        Name: 'Books',
        ServerId: serverId,
        Id: 'localview:BooksView',
        Type: 'BooksView',
        IsFolder: true
      });
    }
    if (types.includes('Game') || forceIncludeAll) {
      list.push({
        Name: 'Games',
        ServerId: serverId,
        Id: 'localview:GamesView',
        Type: 'GamesView',
        IsFolder: true
      });
    }
    return list;
  }
  function getAllPossibleLocalViews(serverId) {
    var list = getTopLevelViews(serverId, [], true);
    list = list.concat(getMusicFolders(serverId));
    return Promise.resolve(list);
  }
  function toQueryResult(items) {
    return {
      Items: items,
      TotalRecordCount: items.length
    };
  }
  function getDownloadedItems(serverId, options) {
    var searchParentId = options.ParentId;
    searchParentId = normalizeId(searchParentId);
    switch (searchParentId) {
      case 'MusicView':
        if (!options.Recursive) {
          return Promise.resolve(toQueryResult(getMusicFolders(serverId)));
        }
        break;
      default:
        break;
    }
    return _servicelocator.itemRepository.getLibraryItems(serverId, options);
  }
  function getViews(serverId) {
    return _servicelocator.itemRepository.getLibarytemTypes(serverId).then(function (types) {
      return getTopLevelViews(serverId, types);
    });
  }
  function createGuid() {
    var d = Date.now();
    if (window.performance && typeof window.performance.now === "function") {
      d += performance.now(); //use high-precision timer if available
    }
    var uuid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
      var r = (d + Math.random() * 16) % 16 | 0;
      d = Math.floor(d / 16);
      return (c === 'x' ? r : r & 0x3 | 0x8).toString(16);
    });
    return uuid;
  }
  function adjustIdProperties(downloadedItem) {
    downloadedItem.Id = convertIdToLocal(downloadedItem.Id);
    downloadedItem.SeriesId = convertIdToLocal(downloadedItem.SeriesId);
    downloadedItem.SeasonId = convertIdToLocal(downloadedItem.SeasonId);
    downloadedItem.AlbumId = convertIdToLocal(downloadedItem.AlbumId);
    downloadedItem.ParentId = convertIdToLocal(downloadedItem.ParentId);
    downloadedItem.ParentThumbItemId = convertIdToLocal(downloadedItem.ParentThumbItemId);
    downloadedItem.ParentPrimaryImageItemId = convertIdToLocal(downloadedItem.ParentPrimaryImageItemId);
    downloadedItem.PrimaryImageItemId = convertIdToLocal(downloadedItem.PrimaryImageItemId);
    downloadedItem.ParentLogoItemId = convertIdToLocal(downloadedItem.ParentLogoItemId);
    downloadedItem.ParentBackdropItemId = convertIdToLocal(downloadedItem.ParentBackdropItemId);
    downloadedItem.ParentBackdropImageTags = null;
  }
  function getLocalView(instance, serverId, userId) {
    return instance.getLocalFolders(serverId, userId).then(function (views) {
      var localView = null;
      if (views.length > 0) {
        localView = {
          Name: instance.downloadsTitleText || 'Downloads',
          ServerId: serverId,
          Id: 'localview',
          Type: 'localview',
          IsFolder: true
        };
      }
      return Promise.resolve(localView);
    });
  }
  function updateFavoriteStatus(instance, serverId, itemId, isFavorite) {
    return _servicelocator.itemRepository.getLibraryItem(serverId, stripLocalPrefix(itemId)).then(function (item) {
      var libraryItem = item.Item;
      libraryItem.UserData = libraryItem.UserData || {};
      libraryItem.UserData.IsFavorite = isFavorite;
      return _servicelocator.itemRepository.updateLibraryItem(item.ServerId, item.Id, item).then(function () {
        return Promise.resolve();

        /*const action =
        {
            Date: new Date().toISOString(),
            ItemId: stripLocalPrefix(itemId),
            ServerId: serverId,
            Type: 'MarkFavorite',
            UserId: instance.getCurrentUserId(),
            Id: createGuid()
        };
          return userActionRepository.addUserAction(action.Id, action);*/
      });
    });
  }
  function markPlayed(instance, serverId, itemId, date) {
    return _servicelocator.itemRepository.getLibraryItem(serverId, stripLocalPrefix(itemId)).then(function (item) {
      var libraryItem = item.Item;
      libraryItem.UserData = libraryItem.UserData || {};
      libraryItem.UserData.Played = true;
      return _servicelocator.itemRepository.updateLibraryItem(item.ServerId, item.Id, item).then(function () {
        return Promise.resolve();
        /*const action =
        {
            Date: new Date().toISOString(),
            ItemId: stripLocalPrefix(itemId),
            ServerId: serverId,
            Type: 'MarkPlayed',
            UserId: instance.getCurrentUserId(),
            Id: createGuid()
        };
          return userActionRepository.addUserAction(action.Id, action);*/
      });
    });
  }
  function markUnplayed(instance, serverId, itemId) {
    return _servicelocator.itemRepository.getLibraryItem(serverId, stripLocalPrefix(itemId)).then(function (item) {
      var libraryItem = item.Item;
      libraryItem.UserData = libraryItem.UserData || {};
      libraryItem.UserData.Played = false;
      return _servicelocator.itemRepository.updateLibraryItem(item.ServerId, item.Id, item).then(function () {
        return Promise.resolve();

        /*const action =
         {
             Date: new Date().toISOString(),
             ItemId: stripLocalPrefix(itemId),
             ServerId: serverId,
             Type: 'MarkPlayed',
             UserId: instance.getCurrentUserId(),
             Id: createGuid()
         };
            return userActionRepository.addUserAction(action.Id, action);*/
      });
    });
  }
  function getRandomInt(min, max) {
    var minCeiled = Math.ceil(min);
    var maxFloored = Math.floor(max);
    return Math.floor(Math.random() * (maxFloored - minCeiled) + minCeiled); // The maximum is exclusive and the minimum is inclusive
  }
  var PlaySessionIdPrefix = Date.now() + '_' + getRandomInt(1, 100000);
  function nextPlaySessionId() {
    return PlaySessionIdPrefix + '_' + Date.now();
  }
  function ApiClientEx(serverAddress, appName, appVersion, deviceName, deviceId, devicePixelRatio) {
    _apiclient.default.apply(this, arguments);
  }
  Object.assign(ApiClientEx.prototype, _apiclient.default.prototype);
  ApiClientEx.prototype.getPlaybackInfo = function (itemId, options, deviceProfile, signal) {
    var promises = [];
    if (isLocalId(itemId) || isLocalId(options == null ? void 0 : options.MediaSourceId)) {
      promises.push(Promise.resolve({
        MediaSources: [],
        PlaySessionId: nextPlaySessionId()
      }));
    } else {
      promises.push(_apiclient.default.prototype.getPlaybackInfo.apply(this, arguments));
    }
    if (options && options.MediaSourceId && !isLocalId(options.MediaSourceId)) {
      promises.push(Promise.resolve({
        MediaSources: [],
        PlaySessionId: nextPlaySessionId()
      }));
    } else {
      promises.push(_servicelocator.itemRepository.getLibraryItem(this.serverId(), stripLocalPrefix(itemId)).then(function (item) {
        if (item) {
          if (item.SyncStatus && item.SyncStatus !== 'synced') {
            return {
              MediaSources: [],
              PlaySessionId: nextPlaySessionId()
            };
          }
          var mediaSources = item.Item.MediaSources.map(function (m) {
            if (options.AudioStreamIndex != null) {
              m.DefaultAudioStreamIndex = parseInt(options.AudioStreamIndex);
            }
            if (options.SubtitleStreamIndex != null) {
              m.DefaultSubtitleStreamIndex = parseInt(options.SubtitleStreamIndex);
            }
            m.SupportsDirectPlay = true;
            m.SupportsDirectStream = false;
            m.SupportsTranscoding = false;
            m.IsLocal = true;

            // TODO: Should we actually replace the name, or just add an indicator that it is a downloaded copy?
            m.Name = 'Downloaded version';

            // give this the local prefix but also change it to the item id
            // this will allow progress reporting to detect it as a local item and save the updated position to the local database
            m.Id = localPrefix + item.Item.Id;
            return m;
          });
          return {
            MediaSources: mediaSources,
            PlaySessionId: nextPlaySessionId()
          };
        }
        return {
          MediaSources: [],
          PlaySessionId: nextPlaySessionId()
        };
      }));
    }
    return Promise.all(promises).then(function (results) {
      var result = results[0];
      var localResult = results[1];
      if (localResult.MediaSources.length) {
        result.ErrorCode = null;
      }
      for (var i = 0, length = localResult.MediaSources.length; i < length; i++) {
        result.MediaSources.unshift(localResult.MediaSources[i]);
      }
      return result;
    });
  };
  ApiClientEx.prototype.getAudioStreamUrl = function (item, transcodingProfile, directPlayContainers, maxBitrate, maxAudioSampleRate, maxAudioBitDepth, startPosition, enableRemoteMedia) {
    if (isLocalId(item.Id)) {
      if (item.MediaSources && item.MediaSources.length) {
        var mediaSource = item.MediaSources[0];
        return mediaSource.StreamUrl || mediaSource.Path;
      }
    }

    // TODO: Handle server item that has been downloaded

    return _apiclient.default.prototype.getAudioStreamUrl.apply(this, arguments);
  };
  ApiClientEx.prototype.getAudioStreamUrls = function (items, transcodingProfile, directPlayContainers, maxBitrate, maxAudioSampleRate, maxAudioBitDepth, startPosition, enableRemoteMedia) {
    if (!items.length) {
      return Promise.resolve([]);
    }
    if (isLocalId(items[0].Id)) {
      return Promise.resolve(items.map(getLocalUrl));
    }

    // Handle server items that have been downloaded
    var instance = this;
    var ids = items.map(function (_ref2) {
      var Id = _ref2.Id;
      return Id;
    });
    return _servicelocator.itemRepository.getLibraryItemPathsByIds(items[0].ServerId, ids).then(function (localItems) {
      var localItemMap = {};
      var localUrls = localItems.map(function (libraryItem) {
        localItemMap[libraryItem.ItemId] = libraryItem;
        return libraryItem.LocalPath;
      });
      // All local urls
      if (localUrls.length === items.length) {
        return localUrls;
      }
      // All remote urls
      else if (!localItems.length) {
        return _apiclient.default.prototype.getAudioStreamUrls.call(instance, items, transcodingProfile, directPlayContainers, maxBitrate, maxAudioSampleRate, maxAudioBitDepth, startPosition, enableRemoteMedia);
      }
      // Mixed - Need to preserve order
      else {
        var streamUrls = [];
        for (var i = 0; i < items.length; i++) {
          var item = items[i];
          var streamUrl = void 0;
          if (localItemMap[item.Id]) {
            var libraryItem = localItemMap[item.Id];
            streamUrl = libraryItem.LocalPath;
          } else {
            streamUrl = _apiclient.default.prototype.getAudioStreamUrl.call(instance, item, transcodingProfile, directPlayContainers, maxBitrate, maxAudioSampleRate, maxAudioBitDepth, startPosition, enableRemoteMedia);
          }
          streamUrls.push(streamUrl || '');
        }
        return streamUrls;
      }
    });
  };
  ApiClientEx.prototype.getItems = function (userId, options) {
    if (isLocalId(options.ListItemIds)) {
      return Promise.resolve({
        Items: [],
        TotalRecordCount: 0
      });
    }
    var serverInfo = this.serverInfo();
    if (serverInfo && options.ParentId === 'localview') {
      return this.getLocalFolders(serverInfo.Id, userId).then(function (items) {
        var result = {
          Items: items,
          TotalRecordCount: items.length
        };
        return Promise.resolve(result);
      });
    } else if (serverInfo && options && (isLocalId(options.ParentId) || isLocalId(options.SeriesId) || isLocalId(options.SeasonId) || isLocalId(options.AlbumIds))) {
      return getDownloadedItems(serverInfo.Id, options).then(function (result) {
        result.Items.forEach(function (item) {
          adjustIdProperties(item);
        });
        return Promise.resolve(result);
      });
    } else if (options && options.ExcludeItemIds && options.ExcludeItemIds.length) {
      var exItems = Array.isArray(options.ExcludeItemIds) ? options.ExcludeItemIds : options.ExcludeItemIds.split(',');
      for (var i = 0; i < exItems.length; i++) {
        if (isLocalId(exItems[i])) {
          return Promise.resolve({
            Items: [],
            TotalRecordCount: 0
          });
        }
      }
    } else if (options && options.Ids && options.Ids.length) {
      var ids = Array.isArray(options.Ids) ? options.Ids : options.Ids.split(',');
      var hasLocal = false;
      for (var _i = 0; _i < ids.length; _i++) {
        if (isLocalId(ids[_i])) {
          hasLocal = true;
          break;
        }
      }
      if (hasLocal) {
        var localIds = ids.map(stripLocalPrefix);
        return _servicelocator.itemRepository.getLibraryItemsByIds(serverInfo.Id, localIds).then(function (items) {
          items.forEach(function (_ref3) {
            var Item = _ref3.Item;
            adjustIdProperties(Item);
          });
          var libraryItems = items.map(function (_ref4) {
            var Item = _ref4.Item;
            return Item;
          });
          var result = {
            Items: libraryItems,
            TotalRecordCount: libraryItems.length
          };
          return Promise.resolve(result);
        });
      }
    }
    return _apiclient.default.prototype.getItems.apply(this, arguments);
  };
  ApiClientEx.prototype.getItem = function (userId, itemId, options) {
    if (!itemId) {
      throw new Error("null itemId");
    }
    if (itemId) {
      itemId = itemId.toString();
    }
    var serverInfo;
    if (isTopLevelLocalViewId(itemId)) {
      serverInfo = this.serverInfo();
      if (serverInfo) {
        return getLocalView(this, serverInfo.Id, userId);
      }
    }
    if (isLocalViewId(itemId)) {
      serverInfo = this.serverInfo();
      if (serverInfo) {
        return getAllPossibleLocalViews(serverInfo.Id).then(function (items) {
          var views = items.filter(function (_ref5) {
            var Id = _ref5.Id;
            return Id === itemId;
          });
          if (views.length > 0) {
            return Promise.resolve(views[0]);
          }

          // TODO: Test consequence of this
          return Promise.reject();
        });
      }
    }
    if (isLocalId(itemId)) {
      serverInfo = this.serverInfo();
      if (serverInfo) {
        return _servicelocator.itemRepository.getLibraryItem(serverInfo.Id, stripLocalPrefix(itemId)).then(function (item) {
          if (item) {
            adjustIdProperties(item.Item);
            return Promise.resolve(item.Item);
          }
          return Promise.reject();
        });
      }
      return Promise.reject();
    }
    return _apiclient.default.prototype.getItem.apply(this, arguments);
  };
  ApiClientEx.prototype.getLocalFolders = function (userId) {
    var serverInfo = this.serverInfo();
    userId = userId || serverInfo.UserId;
    return getViews(serverInfo.Id, userId).catch(function () {
      return (
        // this is throwing in ios for some reason, when empty
        []
      );
    });
  };
  ApiClientEx.prototype.getSeasons = function (itemId, options) {
    if (isLocalId(itemId)) {
      options.SeriesId = itemId;
      options.IncludeItemTypes = 'Season';
      if (options.Recursive) {
        options.SortBy = 'ParentIndexNumber,IndexNumber';
      } else {
        options.SortBy = 'IndexNumber';
      }
      return this.getItems(this.getCurrentUserId(), options);
    }
    return _apiclient.default.prototype.getSeasons.apply(this, arguments);
  };
  ApiClientEx.prototype.getEpisodes = function (itemId, options) {
    if (isLocalId(options.SeasonId) || isLocalId(options.seasonId)) {
      options.SeriesId = itemId;
      options.IncludeItemTypes = 'Episode';
      options.SortBy = 'ParentIndexNumber,IndexNumber,SortName';
      return this.getItems(this.getCurrentUserId(), options);
    }

    // get episodes by recursion
    if (isLocalId(itemId)) {
      options.SeriesId = itemId;
      options.IncludeItemTypes = 'Episode';
      options.SortBy = 'ParentIndexNumber,IndexNumber,SortName';
      return this.getItems(this.getCurrentUserId(), options);
    }
    return _apiclient.default.prototype.getEpisodes.apply(this, arguments);
  };
  ApiClientEx.prototype.getLatestOfflineItems = function (options) {
    // Supported options
    // MediaType - Audio/Video/Photo/Book/Game
    // Limit
    // Filters: 'IsNotFolder' or 'IsFolder'

    options.SortBy = 'DateCreated';
    options.SortOrder = 'Descending';
    options.EnableTotalRecordCount = false;
    var serverInfo = this.serverInfo();
    if (serverInfo) {
      return _servicelocator.itemRepository.getLibraryItems(serverInfo.Id, options).then(function (_ref6) {
        var Items = _ref6.Items;
        var items = Items;
        items.forEach(function (item) {
          adjustIdProperties(item);
        });
        return Promise.resolve(items);
      });
    }
    return Promise.resolve([]);
  };
  ApiClientEx.prototype.getImageUrl = function (itemId, options) {
    if (isLocalId(itemId) || options && options.itemid && isLocalId(options.itemid)) {
      var id = stripLocalPrefix(itemId);
      return _localassetmanager.default.getImageUrl(this.serverId(), id, options);
    }
    return _apiclient.default.prototype.getImageUrl.apply(this, arguments);
  };
  ApiClientEx.prototype.updateFavoriteStatus = function (userId, itemIds, isFavorite) {
    var instance = this;
    return _apiclient.default.prototype.updateFavoriteStatus.apply(this, arguments).then(function (response) {
      itemIds = itemIds.filter(isLocalId);
      var promise;
      if (itemIds.length > 0) {
        var serverInfo = this.serverInfo();
        if (serverInfo) {
          var promises = itemIds.map(function (itemId) {
            return updateFavoriteStatus(instance, serverInfo.Id, itemId, isFavorite);
          });
          promise = Promise.all(promises);
        }
      }
      return (promise || Promise.resolve()).then(function () {
        return response;
      });
    });
  };
  ApiClientEx.prototype.markPlayed = function (userId, itemIds, date) {
    var instance = this;
    return _apiclient.default.prototype.markPlayed.apply(this, arguments).then(function (response) {
      itemIds = itemIds.filter(isLocalId);
      var promise;
      if (itemIds.length > 0) {
        var serverInfo = this.serverInfo();
        if (serverInfo) {
          var promises = itemIds.map(function (itemId) {
            return markPlayed(instance, serverInfo.Id, itemId, date);
          });
          promise = Promise.all(promises);
        }
      }
      return (promise || Promise.resolve()).then(function () {
        return response;
      });
    });
  };
  ApiClientEx.prototype.markUnplayed = function (userId, itemIds) {
    var instance = this;
    return _apiclient.default.prototype.markUnplayed.apply(this, arguments).then(function (response) {
      itemIds = itemIds.filter(isLocalId);
      var promise;
      if (itemIds.length > 0) {
        var serverInfo = this.serverInfo();
        if (serverInfo) {
          var promises = itemIds.map(function (itemId) {
            return markUnplayed(instance, serverInfo.Id, itemId);
          });
          promise = Promise.all(promises);
        }
      }
      return (promise || Promise.resolve()).then(function () {
        return response;
      });
    });
  };
  ApiClientEx.prototype.reportPlaybackProgress = function (options) {
    if (!options) {
      throw new Error("null options");
    }
    var localPromise;
    var localId = isLocalId(options.ItemId) ? options.ItemId : isLocalId(options.MediaSourceId) ? options.MediaSourceId : null;
    if (localId) {
      var serverInfo = this.serverInfo();
      if (serverInfo) {
        localPromise = _servicelocator.itemRepository.getLibraryItem(serverInfo.Id, stripLocalPrefix(localId)).then(function (item) {
          if (!item) {
            console.log('item not found in local database: ' + stripLocalPrefix(localId));
            return Promise.resolve();
          }
          var libraryItem = item.Item;
          if (libraryItem.MediaType === 'Video') {
            libraryItem.UserData = libraryItem.UserData || {};
            libraryItem.UserData.PlaybackPositionTicks = options.PositionTicks;
            libraryItem.UserData.PlayedPercentage = Math.min(libraryItem.RunTimeTicks ? 100 * ((options.PositionTicks || 0) / libraryItem.RunTimeTicks) : 0, 100);
            if (libraryItem.UserData.PlaybackPositionTicks && libraryItem.RunTimeTicks && libraryItem.UserData.PlaybackPositionTicks >= libraryItem.RunTimeTicks * 0.9) {
              libraryItem.UserData.Played = true;
              libraryItem.UserData.PlaybackPositionTicks = 0;
              libraryItem.UserData.PlayedPercentage = 0;
            }
            return _servicelocator.itemRepository.updateLibraryItem(item.ServerId, item.Id, item);
          }
        });
      }
    }
    var serverPromise = isLocalId(options.ItemId) ? Promise.resolve() : _apiclient.default.prototype.reportPlaybackProgress.apply(this, arguments);
    return Promise.all([localPromise || Promise.resolve(), serverPromise]);
  };
  ApiClientEx.prototype.reportPlaybackStopped = function (options) {
    if (!options) {
      throw new Error("null options");
    }
    var localPromise;
    var localId = isLocalId(options.ItemId) ? options.ItemId : isLocalId(options.MediaSourceId) ? options.MediaSourceId : null;
    if (localId) {
      var serverInfo = this.serverInfo();
      if (serverInfo) {
        var instance = this;
        localPromise = _servicelocator.itemRepository.getLibraryItem(serverInfo.Id, stripLocalPrefix(localId)).then(function (item) {
          if (!item) {
            console.log('item not found in local database: ' + stripLocalPrefix(localId));
            return Promise.resolve();
          }
          var libraryItem = item.Item;
          if (libraryItem.MediaType === 'Video') {
            libraryItem.UserData = libraryItem.UserData || {};
            libraryItem.UserData.PlaybackPositionTicks = options.PositionTicks;
            libraryItem.UserData.PlayedPercentage = Math.min(libraryItem.RunTimeTicks ? 100 * ((options.PositionTicks || 0) / libraryItem.RunTimeTicks) : 0, 100);
            if (libraryItem.UserData.PlaybackPositionTicks && libraryItem.RunTimeTicks && libraryItem.UserData.PlaybackPositionTicks >= libraryItem.RunTimeTicks * 0.9) {
              libraryItem.UserData.Played = true;
              libraryItem.UserData.PlaybackPositionTicks = 0;
              libraryItem.UserData.PlayedPercentage = 0;
            }
            return _servicelocator.itemRepository.updateLibraryItem(item.ServerId, item.Id, item).then(function () {
              if (!isLocalId(options.ItemId)) {
                return Promise.resolve();
              }
              var action = {
                Date: new Date().toISOString(),
                ItemId: stripLocalPrefix(localId),
                PositionTicks: options.PositionTicks,
                ServerId: serverInfo.Id,
                Type: 'PlayedItem',
                UserId: instance.getCurrentUserId(),
                Id: createGuid()
              };
              return _servicelocator.userActionRepository.addUserAction(action.Id, action);
            });
          }
        });
      }
    }
    var serverPromise = isLocalId(options.ItemId) ? Promise.resolve() : _apiclient.default.prototype.reportPlaybackStopped.apply(this, arguments);
    return Promise.all([localPromise || Promise.resolve(), serverPromise]);
  };
  ApiClientEx.prototype.getItemDownloadUrl = function (itemId, mediaSourceId) {
    var localId = isLocalId(itemId) ? itemId : isLocalId(mediaSourceId) ? mediaSourceId : null;
    if (localId) {
      var serverInfo = this.serverInfo();
      if (serverInfo) {
        return _servicelocator.itemRepository.getLibraryItem(serverInfo.Id, stripLocalPrefix(localId)).then(function (_ref7) {
          var LocalPath = _ref7.LocalPath;
          return Promise.resolve(LocalPath);
        });
      }
      return Promise.reject();
    }
    return _apiclient.default.prototype.getItemDownloadUrl.apply(this, arguments);
  };
  ApiClientEx.prototype.getItemOriginalFileUrl = function (itemId, mediaSourceId) {
    var localId = isLocalId(itemId) ? itemId : isLocalId(mediaSourceId) ? mediaSourceId : null;
    if (localId) {
      var serverInfo = this.serverInfo();
      if (serverInfo) {
        return _servicelocator.itemRepository.getLibraryItem(serverInfo.Id, stripLocalPrefix(localId)).then(function (_ref8) {
          var LocalPath = _ref8.LocalPath;
          return Promise.resolve(LocalPath);
        });
      }
      return Promise.reject();
    }
    return _apiclient.default.prototype.getItemOriginalFileUrl.apply(this, arguments);
  };
  ApiClientEx.prototype.deleteItemsInternal = function (items) {
    if (!items) {
      throw new Error("null itemId");
    }
    var itemIds = items.map(mapToId).filter(isLocalId);
    var instance = this;
    return _apiclient.default.prototype.deleteItemsInternal.apply(instance, arguments).then(function () {
      return Promise.all(itemIds.map(function (itemId) {
        return _servicelocator.itemRepository.getLibraryItem(instance.serverId(), stripLocalPrefix(itemId)).then(function (item) {
          if (item) {
            return _localassetmanager.default.removeLocalItem(item).then(syncNow);
          }
          return Promise.resolve();
        });
      }));
    });
  };
  var _default = _exports.default = ApiClientEx;
});
