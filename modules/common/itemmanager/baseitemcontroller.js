define(["exports", "./../globalize.js", "./../../emby-apiclient/connectionmanager.js", "./../../loading/loading.js", "./../dataformatter.js", "./../servicelocator.js", "./../playback/playbackmanager.js", "./../../layoutmanager.js", "./../../emby-apiclient/apiclient.js", "./../datetime.js", "./../usersettings/usersettings.js", "./../textencoding.js", "./../../approuter.js"], function (_exports, _globalize, _connectionmanager, _loading, _dataformatter, _servicelocator, _playbackmanager, _layoutmanager, _apiclient, _datetime, _usersettings, _textencoding, _approuter) {
  Object.defineProperty(_exports, "__esModule", {
    value: true
  });
  _exports.default = void 0;
  /* jshint module: true */

  var DownloadIcon = '&#xe5db;';
  function showToast(options) {
    return Emby.importModule('./modules/toast/toast.js').then(function (toast) {
      return toast(options);
    });
  }
  function showDialog(options) {
    return Emby.importModule('./modules/dialog/dialog.js').then(function (dialog) {
      return dialog(options);
    });
  }
  function showConfirm(options) {
    return Emby.importModule('./modules/common/dialogs/confirm.js').then(function (confirm) {
      return confirm(options);
    });
  }
  function showAlert(options) {
    return Emby.importModule('./modules/common/dialogs/alert.js').then(function (alert) {
      return alert(options);
    });
  }
  function showAlertAndReject(options, response) {
    var onDone = function () {
      return Promise.reject(response);
    };
    return showAlert(options).then(onDone, onDone);
  }
  function rejectNoSupportedCommands() {
    return Promise.reject('nocommands');
  }
  function rejectNoItems() {
    return Promise.reject('noitems');
  }
  function BaseItemController() {}
  BaseItemController.prototype.getTypeNames = function () {
    return [];
  };
  BaseItemController.prototype.getDisplayName = function (item, options) {
    if (!options) {
      options = {};
    }
    var itemType = item.Type;
    var number, nameSeparator;

    //let redactName;

    var name;
    switch (itemType) {
      case 'Timer':
        item = item.ProgramInfo || item;
        itemType = item.Type;
        name = item.IsSeries || item.EpisodeTitle ? item.EpisodeTitle || '' : item.Name || item.DisplayTitle || '';
        break;
      case 'Program':
      case 'Recording':
        name = item.IsSeries || item.EpisodeTitle ? item.EpisodeTitle || '' : item.Name || item.DisplayTitle || '';
        break;
      case 'ApiKey':
        name = item.AppName;
        break;
      case 'TvChannel':
      case 'ChannelManagementInfo':
        // not sure how this could be null, but: https://emby.media/community/index.php?/topic/132028-guide-data-populating-but-guide-is-still-blank/page/2/#comment-1388147
        name = item.Name || '';
        if (item.ChannelNumber && options.includeIndexNumber !== false) {
          if (options.channelNumberFirst) {
            return item.ChannelNumber + ' ' + name;
          }
          if (!name.endsWith(item.ChannelNumber)) {
            name += ' ' + item.ChannelNumber;
          }
          return name;
        }
        return name;
      //case 'Episode':
      //    name = item.Name;
      //    if (options.hideEpisodeSpoilerInfo && itemType === 'Episode' && item.UserData?.Played === false) {
      //        name = dataFormatter.getRedactedText(name);
      //        redactName = true;
      //    }
      //    break;
      default:
        name = item.Name || item.DisplayTitle || '';
        break;
    }
    if (options.enableSpecialEpisodePrefix !== false && item.ParentIndexNumber === 0 && itemType === "Episode") {
      name = _globalize.default.translate('ValueSpecialEpisodeName', name);
    } else if (item.IndexNumber != null && options.includeIndexNumber !== false && (itemType === "Episode" || itemType === 'Program' || itemType === 'Recording')) {
      number = item.IndexNumber;
      nameSeparator = " - ";
      if (options.includeParentInfo !== false && item.ParentIndexNumber != null) {
        number = "S" + item.ParentIndexNumber + ":E" + number;
      } else {
        nameSeparator = ". ";
      }
      if (item.IndexNumberEnd != null) {
        number += "-" + item.IndexNumberEnd;
      }
      if (item.Type === 'Program' || item.Type === 'Recording') {
        if (!item.EpisodeTitle) {
          // it looks a little wierd to display a number by itself without a name next to it
          number = null;
        }
      }
      if (number) {
        //if (redactName && options.includeParentInfo !== false && options.autoBlankName !== false) {
        //    name = null;
        //}
        name = name ? number + nameSeparator + name : number;
      }
    } else if (item.IndexNumber != null && options.includeIndexNumber !== false && item.SupportsResume && itemType === "Audio") {
      number = item.IndexNumber;
      nameSeparator = " - ";
      if (number) {
        name = name ? number + nameSeparator + name : number;
      }
    }
    return name;
  };
  function canEditInternal(item, user, checkAdmin) {
    // AddServer
    if (!item.Id) {
      return false;
    }
    var itemType = item.Type;
    if (item.CanEditItems != null) {
      return item.CanEditItems === true;
    } else {
      if (checkAdmin !== false) {
        if (!(user != null && user.Policy.IsAdministrator)) {
          return false;
        }
      }
    }
    switch (itemType) {
      case 'UserRootFolder':
      case 'CollectionFolder':
      case 'UserView':
      case 'PlaylistsFolder':
      case 'ApiKey':
      case 'Program':
      case 'Genre':
      case 'MusicGenre':
      case 'GameGenre':
      case 'Studio':
      case 'Tag':
      case 'RemoteSubtitle':
      case 'GenericListItem':
      case 'Log':
      case 'Timer':
      case 'SeriesTimer':
      case 'Plugin':
      case 'Server':
      case 'ItemImage':
      case 'Recording':
      case 'ActivityLogEntry':
      case 'ActiveSession':
      case 'Chapter':
        return false;
      case 'ChannelManagementInfo':
        return item.ManagementId && item.ManagementId !== item.Id;
      default:
        return !_apiclient.default.isLocalItem(item);
    }
  }
  BaseItemController.prototype.canAddToCollection = function (item, user) {
    var invalidTypes = ['ActiveSession', 'Genre', 'MusicGenre', 'Studio', 'GameGenre', 'Log', 'Tag', 'UserView', 'CollectionFolder', 'Audio', 'Program', 'Timer', 'SeriesTimer', 'BoxSet', 'ApiKey', 'TvChannel', 'RemoteSubtitle', 'Chapter'];
    var itemType = item.Type;
    if (itemType === 'Recording') {
      if (item.Status !== 'Completed') {
        return false;
      }
    }
    if (item.CollectionType) {
      return false;
    }
    if (invalidTypes.includes(itemType)) {
      return false;
    }
    if (_apiclient.default.isLocalItem(item)) {
      return false;
    }
    if (itemType === 'Device' || itemType === 'User' || itemType === 'Plugin' || itemType === 'Server' || itemType === 'ActivityLogEntry' || itemType === 'ItemImage' || itemType === 'LiveTVTunerDevice' || itemType === 'LiveTVGuideSource' || itemType === 'ChannelManagementInfo') {
      return false;
    }

    // Not a library item
    if (!item.Id) {
      return false;
    }
    if (user) {
      return canEditInternal(item, user);
    }

    // this item supports it, without respect to user permissions
    return true;
  };
  function mapToPlaylistItemId(item) {
    return item.PlaylistItemId;
  }
  BaseItemController.prototype.removeFromPlayQueue = function (items, options) {
    return _playbackmanager.default.removeFromPlaylist(items.map(mapToPlaylistItemId));
  };
  BaseItemController.prototype.canRemoveFromCollection = function (item, user) {
    if (item.Type === 'BoxSet' && item.ItemIdInList) {
      return user && canEditInternal(item, user);
    }
    return item.CollectionId && this.canAddToCollection(item, user);
  };
  BaseItemController.prototype.canAddToPlaylist = function (item) {
    var itemType = item.Type;
    if (itemType === 'Program') {
      return false;
    }
    if (itemType === 'TvChannel') {
      return false;
    }
    if (itemType === 'Timer') {
      return false;
    }
    if (itemType === 'SeriesTimer') {
      return false;
    }
    if (itemType === 'VirtualFolder') {
      return false;
    }
    if (itemType === 'ActiveSession') {
      return false;
    }
    if (itemType === 'Chapter') {
      return false;
    }
    if (itemType === 'Recording') {
      if (item.Status !== 'Completed') {
        return false;
      }
    }
    var mediaType = item.MediaType;
    if (mediaType === 'Game') {
      return false;
    }
    var collectionType = item.CollectionType;
    if (collectionType === 'livetv' || collectionType === 'playlists') {
      return false;
    }
    if (_apiclient.default.isLocalItem(item)) {
      return false;
    }
    if (item.IsFolder || itemType === "Genre" || itemType === "MusicGenre" || itemType === "MusicAlbum" || itemType === "MusicArtist" || itemType === "Studio" || itemType === "Tag") {
      return true;
    }
    if (itemType === 'Device' || itemType === 'User' || itemType === 'Plugin' || itemType === 'Log' || itemType === 'Server' || itemType === 'ActivityLogEntry' || itemType === 'ApiKey') {
      return false;
    }

    // Not a library item
    if (!item.Id) {
      return false;
    }
    return item.MediaType;
  };
  BaseItemController.prototype.canRemoveFromPlayQueue = function (item) {
    return item.PlaylistItemId && !item.PlaylistId;
  };
  BaseItemController.prototype.canRemoveFromPlaylist = function (item) {
    return item.PlaylistItemId && item.PlaylistId;
  };
  BaseItemController.prototype.canManageMultiVersionGrouping = function (item, user) {
    if (item.IsFolder || item.MediaType !== 'Video') {
      return false;
    }
    if (_apiclient.default.isLocalItem(item)) {
      return false;
    }
    if (!user.Policy.IsAdministrator) {
      return false;
    }
    if (item.Type === 'TvChannel') {
      return false;
    }
    return true;
  };
  BaseItemController.prototype.canRate = function (item) {
    // Could be a stub object like PersonInfo
    if (!item.UserData) {
      return false;
    }
    var itemType = item.Type;
    switch (itemType) {
      case 'Program':
      case 'Timer':
      case 'SeriesTimer':
      case 'CollectionFolder':
      case 'UserView':
      case 'Channel':
      case 'Season':
      case 'Studio':
      case 'Folder':
      case 'Tag':
        return false;
      default:
        return true;
    }
  };
  BaseItemController.prototype.canMarkPlayed = function (item) {
    if (item.SupportsResume) {
      return true;
    }
    var itemType = item.Type;
    switch (itemType) {
      case 'AudioBook':
      case 'Series':
      case 'Season':
      case 'Recording':
        return true;
      case 'TvChannel':
      case 'Program':
      case 'Chapter':
        return false;
      case 'Folder':
        return true;
      case 'CollectionFolder':
        if (item.CollectionType === 'boxsets' || item.CollectionType === 'playlists' || item.CollectionType === 'music') {
          return false;
        }
        return true;
      default:
        break;
    }
    var mediaType = item.MediaType;
    switch (mediaType) {
      case 'Game':
      case 'Book':
      case 'Video':
        return true;
      default:
        break;
    }
    return false;
  };
  BaseItemController.prototype.canConvert = function (item, user) {
    // AddServer
    if (!item.Id) {
      return false;
    }
    var mediaType = item.MediaType;
    switch (mediaType) {
      case 'Book':
      case 'Photo':
      case 'Game':
      case 'Audio':
        return false;
      default:
        break;
    }
    var collectionType = item.CollectionType;
    switch (collectionType) {
      case 'livetv':
      case 'playlists':
      case 'boxsets':
        return false;
      default:
        break;
    }
    var itemType = item.Type;
    switch (itemType) {
      case 'Book':
      case 'Photo':
      case 'Game':
      case 'Audio':
      case 'TvChannel':
      case 'Channel':
      case 'Person':
      case 'Year':
      case 'Program':
      case 'Timer':
      case 'SeriesTimer':
      case 'GameGenre':
      case 'Device':
      case 'User':
      case 'Log':
      case 'Plugin':
      case 'VirtualFolder':
      case 'ItemImage':
      case 'Server':
      case 'ActivityLogEntry':
      case 'ApiKey':
      case 'LiveTVTunerDevice':
      case 'LiveTVGuideSource':
      case 'ChannelManagementInfo':
      case 'ActiveSession':
      case 'RemoteSubtitle':
      case 'Chapter':
        return false;
      default:
        break;
    }
    if (item.LocationType === 'Virtual' && !item.IsFolder) {
      return false;
    }
    if (user) {
      if (!user.Policy.EnableMediaConversion) {
        return false;
      }
    }
    if (_apiclient.default.isLocalItem(item)) {
      return false;
    }
    return true;
  };
  function mediaSupportsSubtitleEditing(item) {
    var itemType = item.Type;
    if (item.MediaType === 'Video' && itemType !== 'TvChannel' && itemType !== 'Trailer' && itemType !== 'Program' && item.LocationType !== 'Virtual' && !(itemType === 'Recording' && item.Status !== 'Completed')) {
      return true;
    }
    if (item.MediaType === 'Audio') {
      return true;
    }
    return false;
  }
  BaseItemController.prototype.getEditCommand = function (items) {
    var item = items[0];
    var itemType = item.Type;
    var text;
    switch (itemType) {
      case '':
      case 'Folder':
      case 'Movie':
      case 'Series':
      case 'Season':
      case 'Episode':
      case 'BoxSet':
      case 'Trailer':
      case 'Audio':
      case 'MusicAlbum':
      case 'MusicArtist':
      case 'MusicGenre':
      case 'MusicVideo':
      case 'Playlist':
      case 'Video':
      case 'Game':
      case 'Book':
      case 'Genre':
      case 'GameGenre':
      case 'Person':
      case 'GameSystem':
      case 'Photo':
      case 'PhotoAlbum':
      case 'TvChannel':
      case 'Studio':
      case 'Channel':
      case 'UserView':
      case 'Tag':
      case 'Device':
        text = _globalize.default.translate('HeaderEditMetadata');
        break;
      default:
        text = _globalize.default.translate('Edit');
        break;
    }
    return {
      name: text,
      id: 'edit',
      icon: 'edit'
    };
  };
  function editVirtualFolder(item, options) {
    var _button$closest;
    if (!_connectionmanager.default.getApiClient(item).isMinServerVersion('4.9.0.70')) {
      return Promise.reject('Please use the Emby web app built into your server to manage your libraries, or update to Emby Server 4.9 or greater.');
    }
    var button = options.positionTo;
    var refreshLibrary = (button == null || (_button$closest = button.closest('[data-refreshlibrary]')) == null ? void 0 : _button$closest.getAttribute('data-refreshlibrary')) === 'true';
    return Emby.importModule('./components/medialibraryeditor/medialibraryeditor.js').then(function (Medialibraryeditor) {
      return new Medialibraryeditor().show({
        refresh: refreshLibrary,
        library: item
      });
    });
  }
  function showMetadataEditor(items) {
    return Emby.importModule('./modules/metadataeditor/metadataeditor.js').then(function (MetadataEditor) {
      var metadataEditor = new MetadataEditor();
      var item = items[0];
      var apiClient = _connectionmanager.default.getApiClient(item);
      return metadataEditor.show(item.Id, apiClient.serverId());
    });
  }
  BaseItemController.prototype.editItems = function (items, options) {
    if (!items.length) {
      return rejectNoItems();
    }
    var itemType = items[0].Type;
    switch (itemType) {
      case 'Device':
      case 'User':
      case 'ActiveSession':
      case 'SeriesTimer':
      case 'Timer':
      case 'LiveTVTunerDevice':
      case 'LiveTVGuideSource':
        // TODO: port in from commandProcessor
        return rejectNoSupportedCommands();
      case 'VirtualFolder':
        return editVirtualFolder(items[0], options);
      default:
        return showMetadataEditor(items);
    }
  };
  BaseItemController.prototype.canEdit = function (items, user) {
    if (items.length === 1) {
      return canEditInternal(items[0], user);
    }
    return false;
  };
  BaseItemController.prototype.canSync = function (item, user) {
    if (user && !user.Policy.EnableContentDownloading) {
      return false;
    }
    if (_apiclient.default.isLocalItem(item)) {
      return false;
    }
    return item.SupportsSync;
  };
  BaseItemController.prototype.canDownload = function (item) {
    var itemType = item.Type;
    switch (itemType) {
      case 'Log':
      case 'RemoteSubtitle':
        return item.CanDownload;
      case 'MediaStream':
        return item.IsExternal && item.StreamType === 'Subtitle' && _servicelocator.appHost.supports('filedownload');
      default:
        return item.CanDownload && _servicelocator.appHost.supports('filedownload');
    }
  };
  BaseItemController.prototype.canDownloadSubtitles = function (item, user) {
    var itemType = item.Type;
    switch (itemType) {
      case 'Movie':
      case 'Episode':
        return this.canEditSubtitles(item, user);
      default:
        return false;
    }
  };
  BaseItemController.prototype.canIdentify = function (item, user) {
    var itemType = item.Type;
    if (itemType === "Movie" || itemType === "Trailer" || itemType === "Series" || itemType === "Game" || itemType === "BoxSet" || itemType === "Person" || itemType === "Book" || itemType === "MusicAlbum" || itemType === "MusicArtist" || itemType === "MusicVideo") {
      if (user.Policy.IsAdministrator) {
        if (!_apiclient.default.isLocalItem(item)) {
          return true;
        }
      }
    }
    return false;
  };
  BaseItemController.prototype.canResetMetadata = function (item, user) {
    var itemType = item.Type;
    switch (itemType) {
      case 'Person':
        return false;
      default:
        return this.canIdentify(item, user);
    }
  };
  BaseItemController.prototype.canShare = function (item, user) {
    var itemType = item.Type;
    switch (itemType) {
      case 'TvChannel':
      case 'Channel':
      case 'Person':
      case 'Year':
      case 'Program':
      case 'Timer':
      case 'SeriesTimer':
      case 'GameGenre':
      case 'MusicGenre':
      case 'Genre':
      case 'Device':
      case 'User':
      case 'Plugin':
      case 'Server':
      case 'ActivityLogEntry':
      case 'ApiKey':
      case 'Tag':
      case 'VirtualFolder':
      case 'ItemImage':
      case 'LiveTVTunerDevice':
      case 'LiveTVGuideSource':
      case 'ChannelManagementInfo':
      case 'ActiveSession':
      case 'CollectionFolder':
      case 'UserView':
      case 'RemoteSubtitle':
      case 'Chapter':
      case 'Recording':
        return false;
      case 'Log':
        return item.CanShare;
      default:
        if (!user) {
          return false;
        }

        // AddServer
        if (!item.Id) {
          return false;
        }
        if (_apiclient.default.isLocalItem(item)) {
          return false;
        }
        return user.Policy.EnablePublicSharing && item.Type === 'Photo' && _servicelocator.appHost.supports('sharing');
    }
  };
  BaseItemController.prototype.canEditImages = function (item, user) {
    var itemType = item.Type;
    if (item.MediaType === 'Photo') {
      return false;
    }
    if (itemType === 'CollectionFolder' || itemType === 'UserView' || itemType === 'PlaylistsFolder' || itemType === 'Genre' || itemType === 'MusicGenre' || itemType === 'GameGenre' || itemType === 'Studio' || itemType === 'Tag') {
      if (!_apiclient.default.isLocalItem(item)) {
        if (user.Policy.IsAdministrator) {
          return true;
        }
        return false;
      }
    }
    switch (itemType) {
      case 'Device':
      case 'User':
      case 'Plugin':
      case 'LiveTVTunerDevice':
      case 'LiveTVGuideSource':
      case 'Recording':
        if (item.Status !== 'Completed') {
          return false;
        }
        break;
      default:
        break;
    }
    return canEditInternal(item, user);
  };
  BaseItemController.prototype.canEditSubtitles = function (item, user) {
    if (user) {
      if (mediaSupportsSubtitleEditing(item)) {
        if (user.Policy.EnableSubtitleDownloading || user.Policy.EnableSubtitleManagement) {
          return canEditInternal(item, user, false);
        }
        if (user.Policy.EnableSubtitleDownloading == null && user.Policy.EnableSubtitleManagement == null) {
          return canEditInternal(item, user);
        }
      }
    }
    return false;
  };
  BaseItemController.prototype.canReorder = function (item, user) {
    var itemType = item.Type;
    switch (itemType) {
      case 'ChannelManagementInfo':
        return true;
      case 'ItemImage':
        return item.ImageType === 'Backdrop';
      default:
        return false;
    }
  };
  BaseItemController.prototype.canMoveUp = function (item, user) {
    if (!this.canReorder(item, user)) {
      return false;
    }
    var itemType = item.Type;
    switch (itemType) {
      case 'ChannelManagementInfo':
        return item.SortIndexNumber;
      case 'ItemImage':
        return item.ImageIndex;
      default:
        return false;
    }
  };
  BaseItemController.prototype.canMoveDown = function (item, user) {
    if (!this.canReorder(item, user)) {
      return false;
    }
    var itemType = item.Type;
    switch (itemType) {
      case 'ChannelManagementInfo':
        return true;
      case 'ItemImage':
        return item.ImageIndex < item.TotalImages - 1;
      default:
        return false;
    }
  };
  BaseItemController.prototype.moveInOrder = function (items, options) {
    return Promise.resolve();
  };
  BaseItemController.prototype.canScanLibraryFiles = function (item, user) {
    var itemType = item.Type;
    switch (itemType) {
      case 'Playlist':
      case 'Genre':
      case 'MusicGenre':
      case 'GameGenre':
      case 'Channel':
      case 'MusicArtist':
        return false;
      default:
        {
          return this.canRefreshMetadata(item, user) && item.IsFolder;
        }
    }
  };
  BaseItemController.prototype.canRefreshMetadata = function (item, user) {
    // AddServer
    if (!item.Id) {
      return false;
    }
    var itemType = item.Type;
    switch (itemType) {
      case 'Device':
      case 'User':
      case 'Plugin':
      case 'Server':
      case 'ActivityLogEntry':
      case 'ApiKey':
      case 'ItemImage':
      case 'Log':
      case 'LiveTVTunerDevice':
      case 'LiveTVGuideSource':
      case 'ChannelManagementInfo':
      case 'ActiveSession':
      case 'RemoteSubtitle':
      case 'Chapter':
        return false;
      default:
        break;
    }
    var collectionType = item.CollectionType;
    switch (collectionType) {
      case 'livetv':
      case 'boxsets':
        return false;
      default:
        break;
    }
    if (user) {
      if (user.Policy.IsAdministrator) {
        if (itemType !== 'Timer' && itemType !== 'SeriesTimer' && itemType !== 'Program' && itemType !== 'TvChannel' && !(itemType === 'Recording' && item.Status !== 'Completed')) {
          if (!_apiclient.default.isLocalItem(item)) {
            return true;
          }
        }
      }
    }
    return false;
  };
  BaseItemController.prototype.canDelete = function (item, user) {
    if (item.CanDelete) {
      return true;
    }
    var itemType = item.Type;
    switch (itemType) {
      case 'ItemImage':
        return item.ImageTag != null;
      case 'Server':
        return true;
      case 'Timer':
      case 'SeriesTimer':
      case 'Recording':
        return user == null ? void 0 : user.Policy.EnableLiveTvManagement;
      default:
        break;
    }
    if (user) {
      if ((itemType === 'LiveTVTunerDevice' || itemType === 'LiveTVGuideSource') && user.Policy.IsAdministrator) {
        return true;
      }
      if (item.Type === 'Plugin' && user.Policy.IsAdministrator) {
        return true;
      }
      if (user.Policy.IsAdministrator && item.Type === 'User' && item.Id !== _connectionmanager.default.getApiClient(item).getCurrentUserId()) {
        return true;
      }
      if (user.Policy.IsAdministrator && item.Type === 'Device' && item.Id !== _connectionmanager.default.deviceId()) {
        return true;
      }
      if (item.Type === 'MediaStream') {
        if (user.Policy.EnableSubtitleManagement || user.Policy.EnableSubtitleManagement == null && user.Policy.IsAdministrator) {
          if (item.IsExternal) {
            return true;
          }
        }
      }
      if (itemType === 'VirtualFolder' && user.Policy.IsAdministrator && item.CollectionType !== 'boxsets') {
        return true;
      }
    }
    return false;
  };
  BaseItemController.prototype.isSingleItemFetchRequired = function (type) {
    switch (type) {
      case 'Plugin':
      case 'Device':
      case 'Server':
      case 'Log':
      case 'ApiKey':
      case 'ActivityLogEntry':
      case 'MediaStream':
      case 'RemoteSubtitle':
      case 'ItemImage':
      case 'LiveTVTunerDevice':
      case 'LiveTVGuideSource':
      case 'ChannelManagementInfo':
      case 'ActiveSession':
      case 'ScheduledTask':
      case 'Chapter':
        return false;
      default:
        return true;
    }
  };
  var defaultIconsByItemType = {
    MusicAlbum: '&#xe019;',
    MusicArtist: '&#xe7FD;',
    Person: '&#xe7FD;',
    Channel: '&#xe2C7;',
    Device: '&#xe333;',
    ActiveSession: '&#xe333;',
    User: '&#xe7fd;',
    Server: '&#xe328;',
    SelectServer: '&#xe328;',
    ManualLogin: '&#xe898;',
    Downloads: '&#xe2c7;',
    CollectionFolder: '&#xe2c7;',
    UserView: '&#xe2c7;',
    ForgotPassword: '&#xe887;',
    AddServer: '&#xe147;',
    AddVirtualFolder: '&#xe147;',
    ActivityLogEntry: '&#xe878;',
    Log: '&#xe873;',
    ApiKey: '&#xe0da;',
    Tag: '&#xe892;',
    ItemImage: '&#xe3f4;',
    PluginCatalogItem: '&#xe87b;',
    TvChannel: '&#xe639;',
    ChannelManagementInfo: '&#xe639;',
    RemoteSubtitle: '&#xe01c;',
    LiveTVTunerDevice: '&#xe639;',
    LiveTVGuideSource: '&#xe1b2;',
    Audio: '&#xe019;',
    Photo: '&#xe412;',
    Book: '&#xea19;',
    Game: '&#xea28;',
    Playlist: '&#xe0ee;',
    MusicVideo: '&#xe063;',
    Studio: '&#xe06b;',
    Movie: '&#xe02c;',
    BoxSet: '&#xf1c8;',
    Series: '&#xe333;',
    Video: '&#xe02c;',
    Trailer: '&#xe02c;'
  };
  var defaultIconsByCollectionType = {
    movies: defaultIconsByItemType.Movie,
    music: '&#xe310;',
    audiobooks: '&#xe310;',
    homevideos: '&#xe412;',
    photos: defaultIconsByItemType.Photo,
    livetv: '&#xe1b2;',
    tvshows: defaultIconsByItemType.Series,
    games: defaultIconsByItemType.Game,
    trailers: defaultIconsByItemType.Trailer,
    musicvideos: defaultIconsByItemType.MusicVideo,
    books: defaultIconsByItemType.Book,
    channels: '&#xe2C7;',
    playlists: defaultIconsByItemType.Playlist,
    boxsets: defaultIconsByItemType.BoxSet
  };
  var defaultIconsByStreamType = {
    Audio: '&#xe1b8;',
    Video: defaultIconsByItemType.Video,
    Subtitle: defaultIconsByItemType.RemoteSubtitle,
    EmbeddedImage: defaultIconsByItemType.ItemImage,
    Lyrics: '&#xec0b;',
    Attachment: '&#xe2bc;'
  };
  var defaultIconsByMediaType = {
    Video: defaultIconsByItemType.Video,
    Audio: defaultIconsByItemType.Audio,
    Photo: defaultIconsByItemType.Photo,
    Book: defaultIconsByItemType.Book,
    Game: defaultIconsByItemType.Game
  };
  BaseItemController.prototype.getDefaultIcon = function (item) {
    var icon;
    var collectionType = item.CollectionType;
    if (collectionType) {
      icon = defaultIconsByCollectionType[collectionType];
      if (icon) {
        return icon;
      }
    }
    var itemType = item.Type;
    if (itemType) {
      icon = defaultIconsByItemType[itemType];
      if (icon) {
        return icon;
      }
    }

    // item.Type === MediaStream
    var streamType = item.StreamType;
    if (streamType) {
      if (item.SubtitleType === 'Lyrics') {
        streamType = 'Lyrics';
      }
      icon = defaultIconsByStreamType[streamType];
      if (icon) {
        return icon;
      }
    }
    var mediaType = item.MediaType;
    switch (itemType) {
      case 'Chapter':
        if (mediaType === 'Audio') {
          return "&#xe666;";
        }
        break;
      default:
        break;
    }
    if (mediaType) {
      icon = defaultIconsByMediaType[mediaType];
      if (icon) {
        return icon;
      }
    }
    return "&#xe2C7;";
  };
  var DeleteMessages = {
    Item: {
      single: {
        text: _globalize.default.translate('ConfirmDeleteItem') + '\n\n' + _globalize.default.translate('AreYouSureToContinue'),
        title: _globalize.default.translate('HeaderDeleteItem')
      },
      plural: {
        text: _globalize.default.translate('ConfirmDeleteItems') + '\n\n' + _globalize.default.translate('AreYouSureToContinue'),
        title: _globalize.default.translate('HeaderDeleteItems')
      }
    },
    Device: {
      single: {
        text: _globalize.default.translate('DeleteDeviceConfirmation'),
        title: _globalize.default.translate('HeaderDeleteDevice')
      },
      plural: {
        text: _globalize.default.translate('DeleteDeviceConfirmation'),
        title: _globalize.default.translate('HeaderDeleteDevice')
      }
    },
    Plugin: {
      single: {
        text: _globalize.default.translate('UninstallPluginConfirmation'),
        title: _globalize.default.translate('HeaderUninstallPlugin'),
        confirmText: _globalize.default.translate('Uninstall')
      },
      plural: {
        text: _globalize.default.translate('UninstallPluginConfirmation'),
        title: _globalize.default.translate('HeaderUninstallPlugin'),
        confirmText: _globalize.default.translate('Uninstall')
      }
    },
    Server: {
      single: {
        text: 'ForgetServerConfirmation',
        title: _globalize.default.translate('ForgetThisServer'),
        confirmText: _globalize.default.translate('ForgetThisServer')
      },
      plural: {
        text: 'ForgetServerConfirmation',
        title: _globalize.default.translate('ForgetThisServer'),
        confirmText: _globalize.default.translate('ForgetThisServer')
      }
    },
    User: {
      single: {
        text: 'DeleteUserConfirmation',
        title: _globalize.default.translate('HeaderDeleteUser')
      },
      plural: {
        text: 'DeleteUsersConfirmation',
        title: _globalize.default.translate('HeaderDeleteUser')
      }
    },
    LiveTVGuideSource: {
      single: {
        text: 'MessageConfirmDeleteGuideProvider',
        title: _globalize.default.translate('HeaderDeleteProvider')
      },
      plural: {
        text: 'MessageConfirmDeleteGuideProvider',
        title: _globalize.default.translate('HeaderDeleteProvider')
      }
    },
    LiveTVTunerDevice: {
      single: {
        text: 'MessageConfirmDeleteTunerDevice',
        title: _globalize.default.translate('HeaderDeleteDevice')
      },
      plural: {
        text: 'MessageConfirmDeleteTunerDevice',
        title: _globalize.default.translate('HeaderDeleteDevice')
      }
    },
    ApiKey: {
      single: {
        text: 'MessageConfirmRevokeApiKey',
        title: _globalize.default.translate('HeaderConfirmRevokeApiKey')
      },
      plural: {
        text: 'MessageConfirmRevokeApiKey',
        title: _globalize.default.translate('HeaderConfirmRevokeApiKey')
      }
    },
    ItemImage: {
      single: {
        text: 'ConfirmDeleteImage'
      },
      plural: {
        text: 'ConfirmDeleteImage'
      }
    },
    Timer: {
      single: {
        text: 'MessageConfirmRecordingCancellation',
        title: _globalize.default.translate('HeaderCancelRecording'),
        confirmText: _globalize.default.translate('HeaderCancelRecording'),
        cancelText: _globalize.default.translate('HeaderKeepRecording'),
        notification: 'RecordingCancelled'
      },
      plural: {
        text: 'MessageConfirmRecordingCancellation',
        title: _globalize.default.translate('HeaderCancelRecording'),
        confirmText: _globalize.default.translate('HeaderCancelRecording'),
        cancelText: _globalize.default.translate('HeaderKeepRecording'),
        notification: 'RecordingCancelled'
      }
    },
    Recording: {
      single: {
        text: 'MessageConfirmRecordingCancellation',
        title: _globalize.default.translate('HeaderCancelRecording'),
        confirmText: _globalize.default.translate('HeaderCancelRecording'),
        cancelText: _globalize.default.translate('HeaderKeepRecording'),
        notification: 'RecordingCancelled'
      },
      plural: {
        text: 'MessageConfirmRecordingCancellation',
        title: _globalize.default.translate('HeaderCancelRecording'),
        confirmText: _globalize.default.translate('HeaderCancelRecording'),
        cancelText: _globalize.default.translate('HeaderKeepRecording'),
        notification: 'RecordingCancelled'
      }
    },
    SeriesTimer: {
      single: {
        text: 'MessageConfirmRecordingCancellation',
        title: _globalize.default.translate('HeaderCancelSeries'),
        confirmText: _globalize.default.translate('HeaderCancelSeries'),
        cancelText: _globalize.default.translate('HeaderKeepSeries'),
        notification: 'SeriesCancelled'
      },
      plural: {
        text: 'MessageConfirmRecordingCancellation',
        title: _globalize.default.translate('HeaderCancelSeries'),
        confirmText: _globalize.default.translate('HeaderCancelSeries'),
        cancelText: _globalize.default.translate('HeaderKeepSeries'),
        notification: 'SeriesCancelled'
      }
    },
    VirtualFolder: {
      single: {
        text: 'MessageAreYouSureYouWishToRemoveLibrary',
        title: _globalize.default.translate('HeaderRemoveLibrary'),
        confirmText: _globalize.default.translate('Remove')
      },
      plural: {
        text: 'MessageAreYouSureYouWishToRemoveLibrary',
        title: _globalize.default.translate('HeaderRemoveLibrary'),
        confirmText: _globalize.default.translate('Remove')
      }
    }
  };
  BaseItemController.prototype.getDeleteMessages = function (item) {
    if (item.Type === 'MediaStream' && item.StreamType === 'Subtitle') {
      return {
        single: {
          text: 'MessageAreYouSureDeleteSubtitles',
          title: _globalize.default.translate('ConfirmDeletion'),
          confirmText: _globalize.default.translate('Delete')
        },
        plural: {
          text: 'MessageAreYouSureDeleteSubtitles',
          title: _globalize.default.translate('ConfirmDeletion'),
          confirmText: _globalize.default.translate('Delete')
        }
      };
    }
    return DeleteMessages[item.Type];
  };
  BaseItemController.prototype.getDeleteMessageOptions = function (options) {
    var items = options.items;
    var info = options.deleteMessages || this.getDeleteMessages(items[0]) || DeleteMessages.Item;
    info = items.length > 1 ? info.plural : info.single;
    info = Object.assign({}, info);
    info.primary = 'cancel';
    if (!info.confirmText) {
      info.confirmText = _globalize.default.translate('Delete');
    }
    if (items.length === 1) {
      info.text = _globalize.default.translate(info.text, items[0].Name);
    } else {
      info.text = _globalize.default.translate(info.text, items.length);
    }
    return info;
  };
  BaseItemController.prototype.showSeriesDeleteConfirmation = function (options) {
    var item = options.items[0];
    var apiClient = _connectionmanager.default.getApiClient(item);
    var instance = this;
    return apiClient.getEpisodes(item.Id, {
      Limit: 1,
      SortBy: 'DatePlayed',
      SortOrder: 'Descending',
      IsPlayed: true,
      UserId: apiClient.getCurrentUserId(),
      ExcludeLocationTypes: 'Virtual'
    }).then(function (result) {
      if (!result.Items.length) {
        return instance.showLibraryItemDeleteConfirmation(options).then(function () {
          return {
            deleteType: 'deleteseries'
          };
        });
      }
      return showDialog({
        title: _globalize.default.translate('HeaderDeleteSeries'),
        text: '',
        buttons: [{
          name: _globalize.default.translate('Cancel'),
          id: 'cancel',
          type: 'submit'
        }, {
          name: _globalize.default.translate('HeaderDeleteLastPlayedEpisode'),
          id: 'deletelastplayed',
          type: 'cancel'
        }, {
          name: _globalize.default.translate('HeaderDeleteSeries'),
          id: 'deleteseries',
          type: 'cancel'
        }]
      }).then(function (id) {
        if (id === 'deleteseries') {
          return {
            deleteType: id
          };
        }
        if (id === 'deletelastplayed') {
          return {
            deleteType: id,
            item: result.Items[0]
          };
        }
        if (id === 'cancel') {
          return Promise.reject();
        }
        return rejectNoSupportedCommands();
      });
    });
  };
  BaseItemController.prototype.showDeleteConfirmation = function (options) {
    if (options.items.length === 1) {
      var itemType = options.items[0].Type;
      switch (itemType) {
        case 'VirtualFolder':
        case 'SeriesTimer':
        case 'Timer':
        case 'Recording':
        case 'ItemImage':
        case 'LiveTVGuideSource':
        case 'LiveTVTunerDevice':
        case 'ApiKey':
        case 'Server':
        case 'MediaStream':
        case 'Device':
        case 'Plugin':
        case 'User':
          break;
        case 'Series':
          return this.showSeriesDeleteConfirmation(options);
        default:
          if (this.enableLibraryItemDeleteConfirmation()) {
            return this.showLibraryItemDeleteConfirmation(options);
          }
          break;
      }
    }
    return showConfirm(this.getDeleteMessageOptions(options));
  };
  BaseItemController.prototype.enableLibraryItemDeleteConfirmation = function () {
    return true;
  };
  function getDeleteText(deleteInfo, item) {
    var msg;
    if (deleteInfo.Paths.length) {
      msg = _globalize.default.translate('ConfirmDeleteItem');
      msg += '\n\n' + _globalize.default.translate('FollowingFilesWillBeDeleted') + '\n' + deleteInfo.Paths.join('\n');
      msg += '\n\n' + _globalize.default.translate('AreYouSureToContinue');
    } else {
      msg = _globalize.default.translate('DeleteItemConfirmation', item.Name);
    }
    return msg;
  }
  function getDeleteHtml(deleteInfo, item) {
    var msg;
    if (deleteInfo.Paths.length) {
      msg = _globalize.default.translate('ConfirmDeleteItem');
      msg += '<p>' + _globalize.default.translate('FollowingFilesWillBeDeleted') + '</p>';
      for (var i = 0, length = deleteInfo.Paths.length; i < length; i++) {
        msg += '<div class="secondaryText">' + deleteInfo.Paths[i] + '</div>';
      }
      msg += '<p style="margin-bottom:0;">' + _globalize.default.translate('AreYouSureToContinue') + '</p>';
    } else {
      msg = _globalize.default.translate('DeleteItemConfirmation', item.Name);
    }
    return msg;
  }
  BaseItemController.prototype.showLibraryItemDeleteConfirmation = function (options) {
    var item = options.items[0];
    var apiClient = _connectionmanager.default.getApiClient(item);
    var itemId = item.Id;
    return apiClient.getDeleteInfo(itemId).then(function (deleteInfo) {
      return showConfirm({
        title: _globalize.default.translate('HeaderDeleteItem'),
        text: getDeleteText(deleteInfo, item),
        html: getDeleteHtml(deleteInfo, item),
        confirmText: _globalize.default.translate('Delete'),
        primary: 'cancel',
        centerText: false
      });
    });
  };
  function onItemsDeleted(instance, deleteOptions, deleteResult, showNotification) {
    if (showNotification) {
      instance.showAfterDeleteNotification(deleteOptions, deleteResult);
    }
    return Emby.importModule('./modules/approuter.js').then(function (appRouter) {
      if (deleteOptions.navigate === 'back') {
        appRouter.back();
      } else if (deleteOptions.navigate) {
        var item = deleteOptions.items[0];
        var parentId = item.SeasonId || item.SeriesId || item.ParentId;
        var serverId = item.ServerId;
        if (parentId) {
          appRouter.showItem(parentId, serverId);
        } else {
          appRouter.goHome();
        }
      }
      return Promise.resolve(deleteResult);
    });
  }
  function mapToId(i) {
    return i.Id;
  }
  function getLeaveSharedItemTitle(item) {
    if (item.Type === 'Playlist') {
      //return globalize.translate('HeaderLeaveCollaboration');
    }
    return _globalize.default.translate('HeaderRemoveFromLibrary');
  }
  function leaveSharedItems(instance, items, options) {
    var item = items[0];
    var title = getLeaveSharedItemTitle(item);
    return showConfirm({
      title: title,
      text: _globalize.default.translate('RemoveSharedItemConfirmation'),
      confirmText: title,
      primary: 'cancel'
    }).then(function () {
      var apiClient = _connectionmanager.default.getApiClient(item);
      return apiClient.leaveSharedItems({
        UserId: apiClient.getCurrentUserId(),
        ItemIds: items.map(mapToId)
      }).then(function (result) {
        return onItemsDeleted(instance, options, result, false);
      });
    });
  }
  BaseItemController.prototype.deleteItems = function (options) {
    if (options.deleteType === 'leaveshareditems') {
      return leaveSharedItems(this, options.items, options);
    }
    var instance = this;
    var optionsClone = Object.assign({}, options);
    var apiClient = _connectionmanager.default.getApiClient(optionsClone.items[0]);
    // some types are user-less/pre-login (Server)
    var promise = apiClient != null && apiClient.getCurrentUserId() && optionsClone.items[0].Type !== 'Server' ? apiClient.getCurrentUser() : Promise.resolve();
    return promise.then(function (user) {
      var itemsToDelete = filterItemsByMethod(instance, optionsClone.items, 'canDelete', user);
      if (!itemsToDelete.length) {
        return rejectNoItems();
      }
      optionsClone.items = itemsToDelete;
      var promise = (options == null ? void 0 : options.confirm) === false ? Promise.resolve() : instance.showDeleteConfirmation(options);
      return promise.then(function (deleteConfirmationResult) {
        _loading.default.show();
        return instance.deleteItemsInternal(optionsClone, deleteConfirmationResult).then(function (result) {
          _loading.default.hide();
          return onItemsDeleted(instance, options, result, true);
        });
      });
    });
  };
  BaseItemController.prototype.getItemTypeName = function (type) {
    if (!type) {
      return null;
    }
    var item = type;
    type = type.Type || type;
    switch (type) {
      case 'Genre':
      case 'MusicGenre':
      case 'GameGenre':
        return _globalize.default.translate('Genre');
      case 'BoxSet':
        return _globalize.default.translate('Collection');
      case 'Audio':
        if (item.SupportsResume) {
          return _globalize.default.translate('Episode');
        }
        return _globalize.default.translate('Song');
      case 'MusicArtist':
        return _globalize.default.translate('Artist');
      case 'MusicAlbum':
        if (item.SupportsResume) {
          return _globalize.default.translate('HeaderAudioBook');
        }
        return _globalize.default.translate('Album');
      case 'MusicVideo':
        return _globalize.default.translate('HeaderMusicVideo');
      case 'TvChannel':
        return _globalize.default.translate('Channel');
      case 'LiveTvProgram':
        return _globalize.default.translate('Program');
      case 'ApiKey':
        return _globalize.default.translate('HeaderApiKey');
      case 'Timer':
        return _globalize.default.translate('Recording');
      case 'SeriesTimer':
        return _globalize.default.translate('SeriesRecording');
    }

    // best guess
    return _globalize.default.translate(type);
  };
  BaseItemController.prototype.getPluralItemTypeName = function (type) {
    switch (type) {
      case 'Genre':
      case 'MusicGenre':
      case 'GameGenre':
        return _globalize.default.translate('Genres');
      case 'BoxSet':
        return _globalize.default.translate('Collections');
      case 'Audio':
        return _globalize.default.translate('Songs');
      case 'MusicArtist':
        return _globalize.default.translate('Artists');
      case 'MusicAlbum':
        return _globalize.default.translate('Albums');
      case 'MusicVideo':
        return _globalize.default.translate('HeaderMusicVideos');
      case 'Person':
        return _globalize.default.translate('People');
      case 'TvChannel':
        return _globalize.default.translate('Channels');
      case 'Series':
        return _globalize.default.translate('Shows');
      case 'LiveTvProgram':
        return _globalize.default.translate('Programs');
      case 'ApiKey':
        return _globalize.default.translate('HeaderApiKeys');
    }

    // best guess
    return _globalize.default.translate(type + 's');
  };
  BaseItemController.prototype.showAfterDeleteNotification = function (deleteOptions, deleteResult) {
    var instance = this;
    var items = deleteOptions.items;
    var info = deleteOptions.deleteMessages || instance.getDeleteMessages(items[0]) || DeleteMessages.Item;
    info = items.length > 1 ? info.plural : info.single;
    var text = info.notification;
    if (!text) {
      return;
    }
    if (items.length === 1) {
      text = _globalize.default.translate(text, items[0].Name);
    } else {
      text = _globalize.default.translate(text, items.length);
    }
    showToast(text);
  };
  BaseItemController.prototype.supportsContextMenu = function (item) {
    var itemType = item.Type;
    switch (itemType) {
      case 'Program':
      case 'AddServer':
      case 'EmbyConnect':
        return false;
      case 'MediaStream':
        if (item.StreamType === 'Subtitle') {
          if (item.IsExternal) {
            return true;
          }
        }
        return false;
      case 'Trailer':
        if (!item.Id) {
          return false;
        }
        return true;
      default:
        return true;
    }
  };
  function htmlEncode(val) {
    return val ? _textencoding.default.htmlEncode(val) : val;
  }
  BaseItemController.prototype.resolveField = function (item, field, options) {
    var _item$Container, _item$VideoCodec, _item$AudioCodec;
    switch (field) {
      case 'LastActivityDateRelative':
        {
          var val = item.LastActivityDate || item.DateLastActivity;
          return val ? _dataformatter.default.formatRelativeTime(val) : null;
        }
      case 'LastActivityDate':
        {
          var _val = item.LastActivityDate || item.DateLastActivity;
          return _val ? _datetime.default.toLocaleString(new Date(Date.parse(_val))) : null;
        }
      case 'LastUser':
        {
          var url = item.LastUserId ? _approuter.default.getRouteUrl({
            Type: 'User',
            Name: item.LastUserName,
            Id: item.LastUserId,
            ServerId: item.ServerId
          }) : null;
          var lastUserName = _textencoding.default.htmlEncode(item.LastUserName || '');
          if (url) {
            return '<a is="emby-linkbutton" class="button-link button-link-color-inherit button-link-fontweight-inherit" href="' + url + '">' + lastUserName + '</a>';
          }
          return lastUserName;
        }
      case 'DateCreated':
        {
          var _val2 = item.DateCreated;
          return _val2 ? _datetime.default.toLocaleDateString(new Date(Date.parse(_val2))) : null;
        }
      case 'DateModified':
        {
          var _val3 = item.DateModified;
          return _val3 ? _datetime.default.toLocaleString(new Date(Date.parse(_val3))) : null;
        }
      case 'ShortOverviewHtml':
        return item.ShortOverviewHtml;
      case 'Container':
        return htmlEncode((_item$Container = item.Container) == null ? void 0 : _item$Container.toUpperCase());
      case 'AppNameVersion':
        {
          var values = [];
          if (item.AppName) {
            values.push(item.AppName);
          }
          if (item.AppVersion) {
            values.push(item.AppVersion);
          }
          return _textencoding.default.htmlEncode(values.join(' ')) || null;
        }
      case 'VideoCodec':
        return _textencoding.default.htmlEncode(((_item$VideoCodec = item.VideoCodec) == null ? void 0 : _item$VideoCodec.toUpperCase()) || '') || null;
      case 'AudioCodec':
        return _textencoding.default.htmlEncode(((_item$AudioCodec = item.AudioCodec) == null ? void 0 : _item$AudioCodec.toUpperCase()) || '') || null;
      case 'Framerate':
        var framerate = item.AverageFrameRate || item.RealFrameRate;
        return framerate ? _dataformatter.default.numberToString(framerate, 3) : null;
      case 'Size':
        {
          var _val4 = item.Size;
          return _val4 != null ? _dataformatter.default.sizeToString(_val4) : null;
        }
      case 'Bitrate':
        {
          var _val5 = item.Bitrate;
          return _val5 != null ? _dataformatter.default.bitrateToString(_val5) : null;
        }
      default:
        return htmlEncode(item[field]);
    }
  };
  function deleteVirtualFolder(virtualFolder, apiClient, options) {
    var _options$positionTo$c;
    var refreshAfterChange = ((_options$positionTo$c = options.positionTo.closest('[data-refreshlibrary]')) == null ? void 0 : _options$positionTo$c.getAttribute('data-refreshlibrary')) === 'true';
    return apiClient.removeVirtualFolder(virtualFolder, refreshAfterChange);
  }
  BaseItemController.prototype.deleteItemsInternal = function (options, deleteConfirmationResult) {
    var items = options.items;
    var item = items[0];
    switch (item.Type) {
      case 'Device':
        return _connectionmanager.default.getApiClient(item).deleteDevices(options.items);
      case 'Plugin':
        return _connectionmanager.default.getApiClient(item).uninstallPlugins(options.items);
      case 'User':
        return _connectionmanager.default.getApiClient(item).deleteUsers(options.items);
      case 'VirtualFolder':
        return deleteVirtualFolder(item, _connectionmanager.default.getApiClient(item), options);
      case 'SeriesTimer':
        return _connectionmanager.default.getApiClient(item).cancelLiveTvSeriesTimer(item.Id);
      case 'Timer':
      case 'Recording':
        return _connectionmanager.default.getApiClient(item).cancelLiveTvTimer(item.TimerId || item.Id);
      case 'ItemImage':
        return _connectionmanager.default.getApiClient(item).deleteItemImage(item.ItemId, item.ImageType, item.ImageIndex);
      case 'LiveTVGuideSource':
        return _connectionmanager.default.getApiClient(item).deleteLiveTVGuideSource(item.Id);
      case 'LiveTVTunerDevice':
        return _connectionmanager.default.getApiClient(item).deleteLiveTVTunerDevice(item.Id);
      case 'ApiKey':
        return _connectionmanager.default.getApiClient(item).deleteApiKeys(items);
      case 'Server':
        return _connectionmanager.default.deleteServer(item.Id);
      case 'Series':
        if ((deleteConfirmationResult == null ? void 0 : deleteConfirmationResult.deleteType) === 'deletelastplayed') {
          // don't leave series screen
          options.navigate = null;
          return _connectionmanager.default.getApiClient(item).deleteItems([deleteConfirmationResult.item]);
        }
        return _connectionmanager.default.getApiClient(item).deleteItems(items);
      case 'MediaStream':
        if (item.StreamType === 'Subtitle') {
          return _connectionmanager.default.getApiClient(item).deleteSubtitles(item.ItemId, item.MediaSourceId, item.Index);
        }
        // not supported
        return rejectNoSupportedCommands();
      default:
        return _connectionmanager.default.getApiClient(item).deleteItems(items);
    }
  };
  function hasLyrics(item) {
    var mediaSources = item.MediaSources;
    if (!mediaSources) {
      return false;
    }
    var mediaSource = mediaSources[0];
    if (!mediaSource) {
      return false;
    }
    var mediaStreams = mediaSource.MediaStreams || [];
    return mediaStreams.filter(function (s) {
      return s.Type === 'Subtitle';
    }).length > 0;
  }
  function filterItemsByMethod(instance, items, method, user, limit) {
    var list = [];
    for (var i = 0, length = items.length; i < length; i++) {
      var item = items[i];
      if (instance[method](item, user)) {
        list.push(item);
        if (limit && list.length >= limit) {
          break;
        }
      }
    }
    return list;
  }
  function getUserFromOptions(options, apiClient) {
    var user = options.user;

    // for multiselect
    if (!user && apiClient && options.users) {
      user = options.users[apiClient.serverId()];
    }
    return user;
  }
  BaseItemController.prototype.getDeleteCommand = function (items) {
    var itemType = items[0].Type;
    var isPrimaryCommand = this.isDeletePrimaryCommand(itemType);
    switch (itemType) {
      case 'Plugin':
        return {
          name: _globalize.default.translate('Uninstall'),
          id: 'delete',
          icon: 'delete',
          primaryCommand: isPrimaryCommand,
          horizontalDragSection: 'right'
        };
      case 'VirtualFolder':
        return {
          name: _globalize.default.translate('Remove'),
          id: 'delete',
          icon: 'remove_circle_outline',
          primaryCommand: isPrimaryCommand
        };
      case 'Timer':
        return {
          name: _globalize.default.translate('HeaderCancelRecording'),
          id: 'canceltimer',
          icon: '&#xe061;',
          primaryCommand: isPrimaryCommand
        };
      case 'SeriesTimer':
        return {
          name: _globalize.default.translate('HeaderCancelSeries'),
          id: 'cancelseriestimer',
          icon: '&#xe3c9;',
          primaryCommand: isPrimaryCommand
        };
      case 'Server':
        return {
          name: _globalize.default.translate('ForgetThisServer'),
          id: 'delete',
          icon: 'remove_circle_outline',
          primaryCommand: isPrimaryCommand,
          horizontalDragSection: 'right'
        };
      default:
        {
          return {
            name: _globalize.default.translate('Delete'),
            id: 'delete',
            icon: 'delete',
            primaryCommand: isPrimaryCommand,
            horizontalDragSection: 'right'
          };
        }
    }
  };
  var SupportsSync = _servicelocator.appHost.supports('sync');
  BaseItemController.prototype.getCommands = function (options) {
    var commands = [];
    var items = options.items;
    if (!items) {
      items = [];
      if (options.item) {
        items.push(options.item);
      }
    }
    var item = items[0];
    var canPlay = _playbackmanager.default.canPlay(item);

    // multiple playlists are not yet supported by the ProjectToMedia query on the server
    if (items.length > 1) {
      if (items.length > 1 && ['Playlist', 'BoxSet', 'Genre', 'GameGenre', 'MusicGenre', 'Tag'].includes(items[0].Type)) {
        canPlay = false;
      }
    }
    var apiClient = _connectionmanager.default.getApiClient(item);
    var user = getUserFromOptions(options, apiClient);
    var itemType = item.Type;
    var itemController = this;
    if (options.setChecked) {
      commands.push({
        name: _globalize.default.translate('Enable'),
        id: 'togglecheckbox',
        icon: '&#xe834;'
      });
    } else if (options.setUnchecked) {
      commands.push({
        name: _globalize.default.translate('Disable'),
        id: 'togglecheckbox',
        icon: '&#xe835;'
      });
    }
    if (options.programInfo && itemType === 'Program') {
      commands.push({
        name: _globalize.default.translate('Info'),
        id: 'link',
        icon: '&#xe88e;'
      });
    }
    if (canPlay) {
      if (item.MediaType === 'Photo') {
        if (options.playSlideshow !== false) {
          commands.push({
            name: _globalize.default.translate('PlaySlideshow'),
            id: 'playallfromhereautoplay',
            icon: '&#xe037;'
          });
        }
      } else {
        if (options.play !== false) {
          var isPlayQueueItem = item.PlaylistItemId && !item.PlaylistId;
          if (!isPlayQueueItem || items.length === 1) {
            commands.push({
              name: _globalize.default.translate('Play'),
              id: 'resume',
              icon: '&#xe037;',
              primaryCommand: !isPlayQueueItem
            });
          }
        }
        if (items.length === 1) {
          if (options.playFromBeginning) {
            if (itemType === 'Series' || itemType === 'MusicAlbum' && item.SupportsResume || item.UserData && item.UserData.PlaybackPositionTicks > 0) {
              commands.push({
                name: _globalize.default.translate('PlayFromBeginning'),
                id: 'playfrombeginning',
                icon: '&#xe037;'
              });
            }
          }
          if (!filterItemsByMethod(itemController, items, 'canRemoveFromPlayQueue', user, 1).length) {
            if (options.playAllFromHere && itemType !== 'Program' && itemType !== 'Recording' && itemType !== 'TvChannel' && itemType !== 'Chapter') {
              commands.push({
                name: _globalize.default.translate('PlayAllFromHere'),
                id: 'playallfromhere',
                icon: '&#xe037;'
              });
            }
          }
        }
      }
    }
    if (filterItemsByMethod(itemController, items, 'canRemoveFromPlayQueue', user, 1).length) {
      if (options.removeFromPlayQueue !== false) {
        commands.push({
          name: _globalize.default.translate('HeaderRemoveFromPlayQueue'),
          id: 'removefromplayqueue',
          icon: 'remove_circle_outline',
          primaryCommand: true,
          horizontalDragSection: 'right'
        });
      }
    } else if (_playbackmanager.default.canQueue(item)) {
      if (options.queue !== false) {
        commands.push({
          name: _globalize.default.translate('HeaderAddToPlayQueue'),
          id: 'queue',
          icon: '&#xe03b;',
          horizontalDragSection: 'left'
        });
      }
      if (options.queue !== false) {
        commands.push({
          name: _globalize.default.translate('HeaderPlayNext'),
          id: 'queuenext',
          icon: '&#xe03b;',
          horizontalDragSection: 'left'
        });
      }

      //if (options.queueAllFromHere) {
      //    commands.push({
      //        name: globalize.translate('QueueAllFromHere'),
      //        id: 'queueallfromhere'
      //    });
      //}
    }
    if (item.IsFolder || itemType === "MusicArtist" || itemType === "MusicGenre") {
      if (item.CollectionType !== 'livetv') {
        if (canPlay && options.shuffle !== false) {
          commands.push({
            name: _globalize.default.translate('Shuffle'),
            id: 'shuffle',
            icon: '&#xe043;'
          });
        }
      }
    }
    if (items.length === 1) {
      if (item.MediaType === "Audio" || itemType === "MusicAlbum" || itemType === "MusicArtist") {
        if (options.instantMix !== false && !_apiclient.default.isLocalItem(item)) {
          commands.push({
            name: _globalize.default.translate('HeaderInstantMix'),
            id: 'instantmix',
            icon: '&#xe043;'
          });
        }
      }
      if (options.gotoItem) {
        commands.push({
          name: _globalize.default.translate('HeaderGoToItem'),
          id: 'link',
          icon: this.getDefaultIcon(item)
        });
      }
    }
    if (commands.length) {
      commands[commands.length - 1].dividerAfter = true;
    }
    var needsDivider = false;
    var canAddToPlaylist = filterItemsByMethod(itemController, items, 'canAddToPlaylist', user, 1).length;
    if (filterItemsByMethod(itemController, items, 'canAddToCollection', user, 1).length) {
      commands.push({
        name: _globalize.default.translate('HeaderAddToCollection'),
        id: 'addtocollection',
        icon: '&#xe03b;',
        horizontalDragSection: canAddToPlaylist ? null : 'left'
      });
      needsDivider = true;
    }
    if (canAddToPlaylist) {
      commands.push({
        name: _globalize.default.translate('HeaderAddToPlaylist'),
        id: 'addtoplaylist',
        icon: '&#xe03b;',
        primaryCommand: true,
        horizontalDragSection: 'left'
      });
      needsDivider = true;
    }
    if (user && options.favorites !== false && filterItemsByMethod(itemController, items, 'canRate', user, 1).length) {
      if (item.UserData && item.UserData.IsFavorite) {
        commands.push({
          name: _globalize.default.translate('HeaderRemoveFromFavorites'),
          id: 'unfavorite',
          icon: '&#xe87d;',
          iconClass: 'icon_circle_strike'
        });
      } else {
        commands.push({
          name: _globalize.default.translate('HeaderAddToFavorites'),
          id: 'favorite',
          icon: '&#xe87d;'
        });
      }
      needsDivider = true;
    }
    if (user && options.played !== false && filterItemsByMethod(itemController, items, 'canMarkPlayed', user, 1).length) {
      var played = item.UserData && item.UserData.Played;
      if (played) {
        commands.push({
          name: _globalize.default.translate('HeaderMarkUnplayed'),
          id: 'markunplayed',
          icon: 'check',
          iconClass: 'icon_circle_strike'
        });
      } else {
        commands.push({
          name: _globalize.default.translate('HeaderMarkPlayed'),
          id: 'markplayed',
          icon: 'check'
        });
      }
      needsDivider = true;
    }
    if (needsDivider) {
      commands[commands.length - 1].dividerAfter = true;
      needsDivider = false;
    }
    if (items.length === 1) {
      if (options.multiSelect && !_layoutmanager.default.tv) {
        needsDivider = true;
        commands.push({
          name: _globalize.default.translate('MultiSelect'),
          id: 'multiselect',
          icon: 'select_all'
        });
      }
      if (itemType === 'MediaStream') {
        if (item.IsExternal && item.StreamType === 'Subtitle') {
          needsDivider = true;
          commands.push({
            name: _globalize.default.translate('Preview'),
            id: 'preview',
            icon: '&#xe89e;'
          });
        }
      }
      if (itemType === 'RemoteSubtitle') {
        needsDivider = true;
        commands.push({
          name: _globalize.default.translate('Preview'),
          id: 'preview',
          icon: '&#xe89e;'
        });
      }
    }
    if (needsDivider) {
      commands[commands.length - 1].dividerAfter = true;
      needsDivider = false;
    }
    if (items.length === 1) {
      if (itemType === 'VirtualFolder' && user.Policy.IsAdministrator && item.CollectionType !== 'boxsets') {
        commands.push({
          name: _globalize.default.translate('HeaderChangeFolderType'),
          id: 'changelibrarycontenttype',
          icon: '&#xe2c7;'
        });
      }
      if (itemType === 'Server') {
        commands.push({
          name: _globalize.default.translate('Connect'),
          id: 'connecttoserver',
          icon: '&#xe63E;'
        });
      }
      if (itemType === 'ApiKey' && navigator.clipboard && navigator.clipboard.writeText) {
        commands.push({
          name: _globalize.default.translate('HeaderCopyToClipboard'),
          id: 'copytoclipboard',
          icon: 'content_copy'
        });
      }
    }
    if (items.length === 1) {
      if (options.openAlbum !== false && item.AlbumId && item.MediaType !== 'Photo') {
        commands.push({
          name: _globalize.default.translate('HeaderGoToAlbum'),
          id: 'album',
          icon: this.getDefaultIcon({
            Type: 'MusicAlbum',
            IsFolder: true
          })
        });
      }
      if (options.openArtist !== false && item.ArtistItems && item.ArtistItems.length) {
        commands.push({
          name: _globalize.default.translate('HeaderGoToArtist'),
          id: 'artist',
          icon: this.getDefaultIcon({
            Type: 'MusicArtist',
            IsFolder: true
          })
        });
      }
      if (options.showSeason !== false && itemType === 'Episode' && item.SeasonId) {
        commands.push({
          name: _globalize.default.translate('HeaderGoToSeason'),
          id: 'season',
          icon: this.getDefaultIcon({
            Type: 'Season',
            IsFolder: true
          })
        });
      }
      if (options.showSeries && (itemType === 'Episode' || itemType === 'Season')) {
        commands.push({
          name: _globalize.default.translate('HeaderGoToSeries'),
          id: 'series',
          icon: this.getDefaultIcon({
            Type: 'Series',
            IsFolder: true
          })
        });
      }
    }
    if (SupportsSync && filterItemsByMethod(itemController, items, 'canSync', user, 1).length) {
      if (options.syncLocal !== false) {
        needsDivider = true;
        commands.push({
          name: _globalize.default.translate('Download'),
          id: 'synclocal',
          icon: DownloadIcon,
          horizontalDragSection: 'right'
        });
      }
    } else if (filterItemsByMethod(itemController, items, 'canDownload', user, 1).length) {
      needsDivider = true;
      commands.push({
        name: _globalize.default.translate('Download'),
        id: 'download',
        icon: DownloadIcon,
        primaryCommand: itemType === 'Log',
        horizontalDragSection: 'right'
      });
    }
    if (options.sync !== false) {
      if (filterItemsByMethod(itemController, items, 'canSync', user, 1).length) {
        needsDivider = true;
        commands.push({
          name: _globalize.default.translate('HeaderDownloadToDots'),
          id: 'sync',
          icon: DownloadIcon
        });
      }
    }
    if (options.convert !== false && filterItemsByMethod(itemController, items, 'canConvert', user, 1).length) {
      needsDivider = true;
      commands.push({
        name: _globalize.default.translate('Convert'),
        id: 'convert',
        icon: 'sync'
      });
    }
    if (needsDivider) {
      commands[commands.length - 1].dividerAfter = true;
      needsDivider = false;
    }
    if (items.length === 1) {
      if (user) {
        if (options.createRecording !== false && user.Policy.EnableLiveTvManagement && itemType === 'TvChannel') {
          commands.push({
            name: _globalize.default.translate('HeaderCreateRecording'),
            id: 'record',
            icon: '&#xe061;'
          });
        }
      }
    }
    var canEdit = itemController.canEdit(items, user);
    if (canEdit) {
      if (options.edit !== false && itemType !== 'SeriesTimer') {
        needsDivider = true;
        commands.push(itemController.getEditCommand(items));
      }
    }
    if (items.length === 1) {
      if (itemController.canEditImages(item, user)) {
        if (options.editImages !== false) {
          needsDivider = true;
          commands.push({
            name: _globalize.default.translate('HeaderEditImages'),
            id: 'editimages',
            icon: 'photo'
          });
        }
      }
      if (options.editSubtitles !== false && itemController.canEditSubtitles(item, user)) {
        if (options.editSubtitles !== false) {
          if (item.MediaType === 'Audio') {
            //    commands.push({
            //        name: globalize.translate('HeaderEditLyrics'),
            //        id: 'editsubtitles',
            //        icon: '&#xe01c;'
            //    });
          } else {
            needsDivider = true;
            commands.push({
              name: _globalize.default.translate('HeaderEditSubtitles'),
              id: 'editsubtitles',
              icon: defaultIconsByStreamType.Subtitle
            });
          }
        }
      }
    }
    if (items.length === 1 && itemType === 'User' && apiClient != null && apiClient.isMinServerVersion('4.10.0.1')) {
      commands.push({
        name: _globalize.default.translate('HeaderCopyDataToUsers'),
        id: 'copydatatousers',
        icon: '&#xe14d;'
      });
    }
    if (options.deleteItem !== false && filterItemsByMethod(itemController, items, 'canDelete', user, 1).length) {
      var deleteEnabled;

      // plugin is added down below as uninstall
      switch (itemType) {
        case 'Plugin':
        case 'VirtualFolder':
          break;
        case 'Timer':
        case 'SeriesTimer':
          deleteEnabled = options.cancelTimer !== false;
          break;
        default:
          deleteEnabled = true;
          break;
      }
      if (deleteEnabled) {
        var deleteCommand = itemController.getDeleteCommand(items);
        if (deleteCommand) {
          needsDivider = true;
          commands.push(deleteCommand);
        }
      }
    }
    if (filterItemsByMethod(itemController, items, 'canManageMultiVersionGrouping', user, 2).length > 1) {
      needsDivider = true;
      commands.push({
        name: _globalize.default.translate('HeaderGroupVersions'),
        id: 'mergeversions',
        icon: 'call_merge'
      });
    }
    if (options.identify !== false) {
      if (filterItemsByMethod(itemController, items, 'canIdentify', user, 1).length) {
        if (items.length === 1) {
          needsDivider = true;
          commands.push({
            name: _globalize.default.translate('Identify'),
            id: 'identify',
            icon: '&#xe85d;'
          });
        }
      }
      if (filterItemsByMethod(itemController, items, 'canResetMetadata', user, 1).length) {
        if (apiClient && apiClient.isMinServerVersion('4.8.0.30')) {
          needsDivider = true;
          commands.push({
            name: _globalize.default.translate('HeaderRemoveIdentification'),
            id: 'resetmetadata',
            icon: '&#xe0b8;'
          });
        }
      }
    }
    if (items.length === 1) {
      if (item.CanLeaveContent) {
        commands.push({
          name: getLeaveSharedItemTitle(item),
          id: 'leaveshareditems',
          icon: 'person_remove'
        });
      }
      if (item.CanManageAccess) {
        commands.push({
          name: itemType === 'Playlist' ? _globalize.default.translate('HeaderManageCollaboration') : _globalize.default.translate('HeaderManageAccess'),
          id: 'manageaccess',
          icon: 'person_add'
        });
      }
    }
    if (options.refreshMetadata !== false && filterItemsByMethod(itemController, items, 'canRefreshMetadata', user, 1).length) {
      needsDivider = true;
      commands.push({
        name: _globalize.default.translate('HeaderRefreshMetadata'),
        id: 'refresh',
        icon: 'refresh'
      });
    }
    if (options.refreshMetadata !== false && filterItemsByMethod(itemController, items, 'canScanLibraryFiles', user, 1).length) {
      switch (itemType) {
        case 'Playlist':
        case 'Genre':
        case 'MusicGenre':
        case 'GameGenre':
        case 'Channel':
        case 'MusicArtist':
          break;
        default:
          {
            needsDivider = true;
            commands.push({
              name: _globalize.default.translate('HeaderScanLibraryFiles'),
              id: 'scan',
              icon: 'refresh'
            });
            break;
          }
      }
    }
    if (needsDivider) {
      commands[commands.length - 1].dividerAfter = true;
      needsDivider = false;
    }
    if (options.removeFromPlaylist !== false && filterItemsByMethod(itemController, items, 'canRemoveFromPlaylist', user, 1).length) {
      commands.push({
        name: _globalize.default.translate('HeaderRemoveFromPlaylist'),
        id: 'removefromplaylist',
        icon: 'remove_circle_outline',
        primaryCommand: true,
        horizontalDragSection: 'right'
      });
    }
    if (filterItemsByMethod(itemController, items, 'canRemoveFromCollection', user, 1).length) {
      commands.push({
        name: _globalize.default.translate('HeaderRemoveFromCollection'),
        id: 'removefromcollection',
        icon: 'remove_circle_outline',
        primaryCommand: true,
        horizontalDragSection: 'right'
      });
    }
    if (user) {
      if (options.deleteItem !== false && filterItemsByMethod(itemController, items, 'canDelete', user, 1).length) {
        if (itemType === 'VirtualFolder') {
          var _deleteCommand = itemController.getDeleteCommand(items);
          if (_deleteCommand) {
            commands.push(_deleteCommand);
          }
        }
      }
      if (itemType === 'VirtualFolder' && user.Policy.IsAdministrator) {
        if (items.length === 1) {
          commands.push({
            name: _globalize.default.translate('Rename'),
            id: 'renamelibrary',
            icon: 'edit'
          });
        }
      }
    }
    if (items.length === 1) {
      if (options.removeFromNextUp) {
        commands.push({
          name: _globalize.default.translate('HeaderRemoveFromContinueWatching'),
          id: 'removefromnextup',
          icon: 'remove_circle_outline'
        });
      }
      if (options.removeFromResume) {
        commands.push({
          name: item.MediaType === 'Audio' ? _globalize.default.translate('HeaderRemoveFromContinueListening') : _globalize.default.translate('HeaderRemoveFromContinueWatching'),
          id: 'removefromresume',
          icon: 'remove_circle_outline'
        });
      }
    }
    if (items.length === 1) {
      if (options.reOrder !== false) {
        if (filterItemsByMethod(itemController, items, 'canMoveUp', user, 1).length) {
          commands.push({
            name: _globalize.default.translate('HeaderMoveUpInOrder'),
            id: 'moveupinorder',
            icon: '&#xe5d8;'
          });
        }
        if (filterItemsByMethod(itemController, items, 'canMoveDown', user, 1).length) {
          commands.push({
            name: _globalize.default.translate('HeaderDownUpInOrder'),
            id: 'movedowninorder',
            icon: '&#xe5db;'
          });
        }
      }
      if (itemType === 'ItemImage') {
        if (item.ImageTag) {
          if (_servicelocator.appHost.supports('targetblank') && !_layoutmanager.default.tv) {
            commands.push({
              name: _globalize.default.translate('HeaderOpenInNewWindow'),
              id: 'preview',
              icon: '&#xe89e;'
            });
          }
        } else {
          commands.push({
            name: _globalize.default.translate('HeaderAddImageFromUrl'),
            id: 'addimagefromurl',
            icon: 'link'
          });
        }
        if (item.ImageType !== 'Backdrop' || apiClient != null && apiClient.isMinServerVersion('4.9.0.13')) {
          if (item.Providers.length) {
            var searchText = item.ImageTag ? _globalize.default.translate('HeaderSearchNewImage') : _globalize.default.translate('HeaderSearchForAnImage');
            commands.push({
              name: searchText,
              id: 'searchimageproviders',
              icon: 'search'
            });
          }
          if (_servicelocator.appHost.supports('fileinput')) {
            commands.push({
              name: _globalize.default.translate('HeaderSelectImageFile'),
              id: 'addimage',
              icon: 'add_circle_outline'
            });
          }
        }
        if (item.ImageTag) {
          commands.push({
            name: _globalize.default.translate('HeaderSetImageFromUrl'),
            id: 'addimagefromurl',
            icon: 'link'
          });
        }
      }
      if (itemType === 'Plugin' && user.Policy.IsAdministrator && item.ConfigPageUrl) {
        commands.push({
          name: _globalize.default.translate('Settings'),
          id: 'open',
          icon: 'settings'
        });
      }
      if (options.share !== false) {
        if (itemController.canShare(item, user)) {
          commands.push({
            name: _globalize.default.translate('Share'),
            id: 'share',
            icon: 'share',
            // the browser may require it to be immediately following a user action
            executeActionOnClick: true
          });
        }
      }
      if (itemType === 'Recording' && item.Status === 'InProgress' && user.Policy.EnableLiveTvManagement && options.cancelTimer !== false) {
        commands.push({
          name: _globalize.default.translate('HeaderStopRecording'),
          id: 'canceltimer',
          icon: '&#xe061;'
        });
      }
    }
    if (itemType === 'Plugin' && filterItemsByMethod(itemController, items, 'canDelete', user, 1).length) {
      var _deleteCommand2 = itemController.getDeleteCommand(items);
      if (_deleteCommand2) {
        commands.push(_deleteCommand2);
      }
    }
    if (items.length === 1) {
      if (itemType === 'Audio' && hasLyrics(item)) {
        commands.push({
          name: _globalize.default.translate('HeaderViewLyrics'),
          id: 'lyrics',
          icon: 'lyrics'
        });
      }
      if (itemType === 'Server') {
        commands.push({
          name: _globalize.default.translate('HeaderViewServerInfo'),
          id: 'serverinfo',
          icon: '&#xe63E;'
        });
      }
      if (itemType === 'Server') {
        if (apiClient && apiClient.supportsWakeOnLan()) {
          commands.push({
            name: _globalize.default.translate('HeaderWakeServer'),
            id: 'wakeserver',
            icon: '&#xe63E;',
            primaryCommand: true
          });
        }
      }
      if (itemType === 'Series') {
        if (apiClient != null && apiClient.isMinServerVersion('4.8.0.59')) {
          commands.push({
            name: _globalize.default.translate('HeaderViewMissingEpisodes'),
            id: 'showmissingepisodes',
            icon: 'format_list_bulleted'
          });
        }
      }
      if (itemType === 'Season') {
        if (apiClient != null && apiClient.isMinServerVersion('4.8.0.60')) {
          commands.push({
            name: _globalize.default.translate('HeaderViewMissingEpisodes'),
            id: 'showmissingepisodes',
            icon: 'format_list_bulleted'
          });
        }
      }
    }
    return commands;
  };
  BaseItemController.prototype.isDeletePrimaryCommand = function (itemType) {
    switch (itemType) {
      case 'Plugin':
        return true;
      default:
        return false;
    }
  };
  BaseItemController.prototype.scanLibraryFiles = function (items, options) {
    var apiClient = _connectionmanager.default.getApiClient(items[0]);
    var instance = this;
    return apiClient.getCurrentUser().then(function (user) {
      items = filterItemsByMethod(instance, items, 'canScanLibraryFiles', user);
      if (!items.length) {
        return rejectNoItems();
      }
      return apiClient.refreshItems(items, {
        Recursive: true,
        ImageRefreshMode: 'Default',
        MetadataRefreshMode: 'Default',
        ReplaceAllImages: false,
        ReplaceAllMetadata: false
      }).then(function () {
        return showToast(_globalize.default.translate('ScanningLibraryFilesDots'));
      });
    });
  };
  BaseItemController.prototype.refreshMetadata = function (items, options) {
    var apiClient = _connectionmanager.default.getApiClient(items[0]);
    var instance = this;
    return apiClient.getCurrentUser().then(function (user) {
      items = filterItemsByMethod(instance, items, 'canRefreshMetadata', user);
      if (!items.length) {
        return rejectNoItems();
      }
      return Emby.importModule('./modules/refreshdialog/refreshdialog.js').then(function (RefreshDialog) {
        return new RefreshDialog({
          items: items
          //mode: mode
        }).show();
      });
    });
  };
  function addToList(items, listType) {
    return Emby.importModule('./modules/addtolist/addtolist.js').then(function (AddToList) {
      return new AddToList().show({
        items: items,
        type: listType
      });
    });
  }
  BaseItemController.prototype.addToPlaylist = function (items, options) {
    var apiClient = _connectionmanager.default.getApiClient(items[0]);
    var instance = this;
    return apiClient.getCurrentUser().then(function (user) {
      items = filterItemsByMethod(instance, items, 'canAddToPlaylist', user);
      if (!items.length) {
        return rejectNoItems();
      }
      return addToList(items, 'Playlist');
    });
  };
  BaseItemController.prototype.addToCollection = function (items, options) {
    var apiClient = _connectionmanager.default.getApiClient(items[0]);
    var instance = this;
    return apiClient.getCurrentUser().then(function (user) {
      items = filterItemsByMethod(instance, items, 'canAddToCollection', user);
      if (!items.length) {
        return rejectNoItems();
      }
      return addToList(items, 'Collection');
    });
  };
  BaseItemController.prototype.groupVersions = function (items, options) {
    var apiClient = _connectionmanager.default.getApiClient(items[0]);
    var instance = this;
    return apiClient.getCurrentUser().then(function (user) {
      items = filterItemsByMethod(instance, items, 'canManageMultiVersionGrouping', user);
      if (!items.length) {
        return rejectNoItems();
      }
      if (items.length < 2) {
        return showAlertAndReject(_globalize.default.translate('PleaseSelectTwoItems'));
      }
      _loading.default.show();
      return apiClient.mergeVersions(items).then(function (response) {
        _loading.default.hide();
        return Promise.resolve(response);
      }, function (response) {
        _loading.default.hide();
        return Promise.reject(response);
      });
    });
  };
  function getNumberSortOption(itemType) {
    switch (itemType) {
      case 'TvChannel':
        return {
          name: _globalize.default.translate('ChannelNumber'),
          value: 'ChannelNumber,SortName',
          defaultSortOrder: 'Ascending'
        };
      default:
        return {
          name: _globalize.default.translate('Number'),
          value: 'ParentIndexNumber,IndexNumber,SortName',
          defaultSortOrder: 'Ascending'
        };
    }
  }
  function getFileSortOption() {
    return {
      name: _globalize.default.translate('FileName'),
      value: 'IsFolder,Filename'
    };
  }
  function getDateLastActiveSortOption(itemType, apiClient) {
    switch (itemType) {
      case 'User':
      case 'Device':
        if (!(apiClient != null && apiClient.isMinServerVersion('4.8.0.47'))) {
          return null;
        }
        return {
          name: _globalize.default.translate('DateLastActive'),
          value: 'DateLastActivity,SortName',
          defaultSortOrder: 'Descending'
        };
      default:
        break;
    }
  }
  function getIpAddressSortOption(itemType, apiClient) {
    switch (itemType) {
      case 'Device':
        if (!(apiClient != null && apiClient.isMinServerVersion('4.8.0.48'))) {
          return null;
        }
        return {
          name: _globalize.default.translate('IpAddress'),
          value: 'IpAddress,DateLastActivity,SortName',
          defaultSortOrder: 'Ascending',
          sortOrderAscending: 'Ascending,Descending,Ascending',
          sortOrderDescending: 'Descending,Descending,Ascending'
        };
      default:
        break;
    }
  }
  function getDateModifiedSortOption(itemType, apiClient) {
    switch (itemType) {
      case 'Playlist':
        return {
          name: _globalize.default.translate('DateModified'),
          value: 'DateModified,SortName',
          defaultSortOrder: 'Descending'
        };
      default:
        break;
    }
  }
  function getDateAddedSortOption(itemType, apiClient) {
    switch (itemType) {
      case '':
      case 'Movie':
      case 'Series':
      case 'Season':
      case 'Episode':
      case 'BoxSet':
      case 'Trailer':
      case 'Audio':
      case 'MusicAlbum':
      case 'MusicArtist':
      case 'MusicVideo':
      case 'Video':
      case 'Game':
      case 'Book':
      case 'Person':
      case 'Photo':
      case 'TvChannel':
      case 'Playlist':
        return {
          name: _globalize.default.translate('DateAdded'),
          value: 'DateCreated,SortName',
          defaultSortOrder: 'Descending'
        };
      case 'User':
        if (!(apiClient != null && apiClient.isMinServerVersion('4.8.0.47'))) {
          return null;
        }
        return {
          name: _globalize.default.translate('DateCreated'),
          value: 'DateCreated,SortName',
          defaultSortOrder: 'Descending'
        };
      default:
        break;
    }
  }
  function getDateLastEpisodeAiredSortOption(itemType, apiClient) {
    if (!apiClient.isMinServerVersion('4.9.0.17')) {
      return null;
    }
    switch (itemType) {
      case 'Series':
        return {
          name: _globalize.default.translate('LastEpisodeDateAired'),
          value: 'LastContentPremiereDate,SortName',
          defaultSortOrder: 'Descending'
        };
      default:
        return null;
    }
  }
  function getDateLastContentAddedSortOption(itemType, apiClient) {
    switch (itemType) {
      case '':
        if (!apiClient.isMinServerVersion('4.9.1.25')) {
          return null;
        }
        return {
          name: _globalize.default.translate('LastContentDateAdded'),
          value: 'DateLastContentAdded,SortName',
          defaultSortOrder: 'Descending'
        };
      case 'MusicAlbum':
        if (!apiClient.isMinServerVersion('4.9.1.90')) {
          return null;
        }
        return {
          name: _globalize.default.translate('LastContentDateAdded'),
          value: 'DateLastContentAdded,SortName',
          defaultSortOrder: 'Descending'
        };
      case 'BoxSet':
      case 'Playlist':
        if (!apiClient.isMinServerVersion('4.9.4.2')) {
          return null;
        }
        return {
          name: _globalize.default.translate('LastContentDateAdded'),
          value: 'DateLastContentAdded,DateCreated,SortName',
          defaultSortOrder: 'Descending'
        };
      case 'Series':
        return {
          name: _globalize.default.translate('LastEpisodeDateAdded'),
          value: 'DateLastContentAdded,SortName',
          defaultSortOrder: 'Descending'
        };
      default:
        return null;
    }
  }
  function getDatePlayedSortOption(itemType) {
    switch (itemType) {
      case 'Series':
        return {
          name: _globalize.default.translate('DatePlayed'),
          value: 'SeriesDatePlayed,SortName',
          defaultSortOrder: 'Descending'
        };
      default:
        return {
          name: _globalize.default.translate('DatePlayed'),
          value: 'DatePlayed,SortName',
          defaultSortOrder: 'Descending'
        };
    }
  }
  function getCriticRatingSortOption() {
    return {
      name: _globalize.default.translate('CriticRating'),
      value: 'CriticRating,SortName',
      defaultSortOrder: 'Descending'
    };
  }
  function getPlayCountSortOption() {
    return {
      name: _globalize.default.translate('Plays'),
      value: 'PlayCount,SortName',
      defaultSortOrder: 'Descending'
    };
  }
  function getRuntimeSortOption() {
    return {
      name: _globalize.default.translate('Runtime'),
      value: 'Runtime,SortName',
      defaultSortOrder: 'Ascending'
    };
  }
  function getParentalRatingSortOption() {
    return {
      name: _globalize.default.translate('ParentalRating'),
      value: 'OfficialRating,SortName',
      defaultSortOrder: 'Descending'
    };
  }
  function getProductionYearSortOption() {
    return {
      name: _globalize.default.translate('Year'),
      value: 'ProductionYear,SortName',
      defaultSortOrder: 'Descending'
    };
  }
  function getStartDateSortOption(itemType) {
    switch (itemType) {
      case 'Program':
        return {
          name: _globalize.default.translate('AirDate'),
          value: 'StartDate',
          defaultSortOrder: 'Ascending'
        };
      default:
        return null;
    }
  }
  function getFavoritesSortOption(itemType) {
    switch (itemType) {
      case 'TvChannel':
        return {
          name: _globalize.default.translate('Favorites'),
          value: 'IsFavorite,DatePlayed,ChannelNumber,SortName',
          defaultSortOrder: 'Ascending',
          sortOrderAscending: 'Ascending,Descending,Ascending',
          sortOrderDescending: 'Descending,Ascending,Ascending'
        };
      default:
        return null;
    }
  }
  function getRandomSortOption(itemType, apiClient) {
    switch (itemType) {
      case '':
      case 'Movie':
      case 'Series':
      case 'Episode':
      case 'Audio':
      case 'MusicAlbum':
      case 'MusicArtist':
      case 'Photo':
      case 'Video':
      case 'MusicVideo':
      case 'Trailer':
        break;
      default:
        return null;
    }
    if (apiClient && apiClient.isMinServerVersion('4.8.0.11')) {
      return {
        name: _globalize.default.translate('Random'),
        value: 'Random',
        defaultSortOrder: 'Ascending'
      };
    }
    return null;
  }
  function getCommunityRatingOptionName(itemType) {
    switch (itemType) {
      case 'Movie':
      case 'Trailer':
      case 'Series':
        return _globalize.default.translate('ImdbRating');
      default:
        break;
    }
    return _globalize.default.translate('CommunityRating');
  }
  function getCommunityRatingSortOption(itemType) {
    return {
      name: getCommunityRatingOptionName(itemType),
      value: 'CommunityRating,SortName',
      defaultSortOrder: 'Descending'
    };
  }
  function getOriginalTitleSortOption() {
    return {
      name: _globalize.default.translate('OriginalTitle'),
      value: 'OriginalTitle,SortName',
      defaultSortOrder: 'Descending'
    };
  }
  function getFramerateSortOption() {
    return {
      name: _globalize.default.translate('Framerate'),
      value: 'Framerate,SortName',
      defaultSortOrder: 'Descending'
    };
  }
  function getVideoCodecSortOption() {
    return {
      name: _globalize.default.translate('LabelVideoCodec'),
      value: 'VideoCodec,SortName',
      defaultSortOrder: 'Asscending'
    };
  }
  function getAudioCodecSortOption() {
    return {
      name: _globalize.default.translate('LabelAudioCodec'),
      value: 'AudioCodec,SortName',
      defaultSortOrder: 'Asscending'
    };
  }
  function getContainerSortOption() {
    return {
      name: _globalize.default.translate('Container'),
      value: 'Container,SortName',
      defaultSortOrder: 'Descending'
    };
  }
  function getSizeSortOption(itemType) {
    switch (itemType) {
      case 'Log':
        return null;
      default:
        return {
          name: _globalize.default.translate('Size'),
          value: 'Size,SortName',
          defaultSortOrder: 'Descending'
        };
    }
  }
  function getBitrateSortOption() {
    return {
      name: _globalize.default.translate('Bitrate'),
      value: 'TotalBitrate,SortName',
      defaultSortOrder: 'Descending'
    };
  }
  function getResolutionSortOption() {
    return {
      name: _globalize.default.translate('Resolution'),
      value: 'Resolution,SortName',
      defaultSortOrder: 'Descending'
    };
  }
  function getReleaseDateSortOption() {
    return {
      name: _globalize.default.translate('ReleaseDate'),
      value: 'ProductionYear,PremiereDate,SortName',
      defaultSortOrder: 'Descending'
    };
  }
  function getSeriesSortOption(itemType) {
    switch (itemType) {
      case 'Episode':
        return {
          name: _globalize.default.translate('Series'),
          value: 'SeriesSortName,ParentIndexNumber,IndexNumber,SortName',
          defaultSortOrder: 'Ascending'
        };
      default:
        return null;
    }
  }
  function getAlbumSortOption() {
    return {
      name: _globalize.default.translate('Album'),
      value: 'Album,ParentIndexNumber,IndexNumber'
    };
  }
  function getArtistSortValue() {
    return 'Artist,Album,ParentIndexNumber,IndexNumber,SortName';
  }
  function getArtistSortOption() {
    return {
      name: _globalize.default.translate('Artist'),
      value: getArtistSortValue()
    };
  }
  function getDirectorSortOption(apiClient) {
    if (!apiClient.isMinServerVersion('4.9.0.48')) {
      return null;
    }
    return {
      name: _globalize.default.translate('Director'),
      value: 'Director,SortName'
    };
  }
  function getComposerSortOption() {
    return {
      name: _globalize.default.translate('Composer'),
      value: getArtistSortValue().replace('Artist', 'Composer')
    };
  }
  function getAlbumArtistSortOption() {
    return {
      name: _globalize.default.translate('AlbumArtist'),
      value: getArtistSortValue().replace('Artist', 'AlbumArtist')
    };
  }
  function getColumnSize(id) {
    switch (id) {
      case 'IndexNumber':
      case 'ParentIndexNumber':
      case 'Video3DFormat':
        return 3;
      case 'ProductionYear':
      case 'PlayCount':
        return 4;
      case 'Image':
      case 'Icon':
        return 4;
      case 'CommunityRating':
      case 'CriticRating':
      case 'Number':
        return 6;
      case 'EpisodeNumber':
      case 'Runtime':
        return 10;
      case 'Date':
      case 'Bitrate':
      case 'Size':
      case 'Resolution':
      case 'Container':
      case 'Version':
        return 12;
      case 'DateTime':
        return 20;
      case 'Artist':
      case 'AlbumArtist':
      case 'Composer':
      case 'SeriesName':
      case 'Album':
      case 'Genres':
      case 'Email':
      case 'Filename':
      case 'IpAddress':
        return 30;
      case 'Studios':
      case 'Name':
      case 'OriginalTitle':
      case 'SortName':
        return 40;
      case 'Path':
        return 80;
      default:
        return 15;
    }
  }
  BaseItemController.prototype.getAvailableFields = function (options) {
    var _getSeriesSortOption, _this$getNameSortOpti, _this$getNameSortOpti2, _this$getNameSortOpti3, _getDateLastActiveSor, _getDateLastActiveSor2, _getNumberSortOption, _getNumberSortOption2, _getStartDateSortOpti, _getOriginalTitleSort, _this$getNameSortOpti4, _getFileSortOption, _getFileSortOption2, _getArtistSortOption, _getAlbumArtistSortOp, _getComposerSortOptio, _getAlbumSortOption, _getCommunityRatingSo, _getCriticRatingSortO, _getParentalRatingSor, _getParentalRatingSor2, _getReleaseDateSortOp, _getReleaseDateSortOp2, _getRuntimeSortOption, _getDirectorSortOptio, _getContainerSortOpti, _getResolutionSortOpt, _getBitrateSortOption, _getSizeSortOption, _getDatePlayedSortOpt, _getPlayCountSortOpti, _options$parentItem, _getDateAddedSortOpti, _getDateAddedSortOpti2, _getDateAddedSortOpti3, _getDateModifiedSortO, _getSizeSortOption2;
    var fields = [];
    var itemType = options.itemType || '';
    var apiClient = options.apiClient;
    switch (itemType) {
      case 'User':
        fields.push({
          id: 'IsAdministrator',
          name: _globalize.default.translate('Admin'),
          gridDisplayNameHtml: '<i title="' + _globalize.default.translate('Admin') + '" class="md-icon dataGridItemCell-icon">&#xef3d;</i>',
          size: getColumnSize('Icon'),
          sortBy: null,
          gridColumnType: 'icon',
          viewTypes: 'datagrid',
          defaultVisible: 'datagrid'
        });
        break;
      default:
        break;
    }
    switch (itemType) {
      case '':
      case 'Episode':
        fields.push({
          id: 'SeriesName',
          name: _globalize.default.translate('Series'),
          size: getColumnSize('SeriesName'),
          sortBy: (_getSeriesSortOption = getSeriesSortOption(itemType)) == null ? void 0 : _getSeriesSortOption.value,
          viewTypes: 'datagrid',
          defaultVisible: 'datagrid',
          fillGrid: true
        });
        fields.push({
          id: 'EpisodeNumber',
          name: _globalize.default.translate('Number'),
          size: getColumnSize('EpisodeNumber'),
          sortBy: null,
          viewTypes: 'datagrid',
          defaultVisible: 'datagrid'
        });
        break;
      default:
        break;
    }
    switch (itemType) {
      case 'Photo':
      case 'PhotoAlbum':
        fields.push({
          id: 'Name',
          name: _globalize.default.translate('Title'),
          size: getColumnSize('Name'),
          sortBy: (_this$getNameSortOpti = this.getNameSortOption(itemType, apiClient)) == null ? void 0 : _this$getNameSortOpti.value,
          defaultVisible: 'datagrid',
          fillGrid: true
        });
        break;
      case 'ApiKey':
        break;
      case 'Log':
        fields.push({
          id: 'Name',
          name: _globalize.default.translate('FileName'),
          size: getColumnSize('Filename'),
          sortBy: (_this$getNameSortOpti2 = this.getNameSortOption(itemType, apiClient)) == null ? void 0 : _this$getNameSortOpti2.value,
          defaultVisible: '*',
          fillGrid: true
        });
        break;
      default:
        fields.push({
          id: 'Name',
          name: _globalize.default.translate('Title'),
          size: getColumnSize('Name'),
          sortBy: (_this$getNameSortOpti3 = this.getNameSortOption(itemType, apiClient)) == null ? void 0 : _this$getNameSortOpti3.value,
          defaultVisible: '*',
          fillGrid: true
        });
        break;
    }
    if (SupportsSync) {
      switch (itemType) {
        case '':
        case 'Movie':
        case 'Series':
        case 'Season':
        case 'Episode':
        case 'BoxSet':
        case 'Audio':
        case 'MusicAlbum':
        case 'MusicArtist':
        case 'MusicVideo':
        case 'Video':
        case 'Game':
        case 'Book':
        case 'Photo':
        case 'Playlist':
          fields.push({
            id: 'Download',
            name: _globalize.default.translate('Download'),
            gridDisplayNameHtml: '<i title="' + _globalize.default.translate('Download') + '" class="md-icon dataGridItemCell-icon">&#xf090;</i>',
            size: getColumnSize('Icon'),
            sortBy: null,
            gridColumnType: 'button',
            viewTypes: 'datagrid',
            defaultVisible: 'datagrid',
            center: true
          });
          break;
        default:
          break;
      }
    }
    switch (itemType) {
      case 'User':
        fields.push({
          id: 'ConnectUserName',
          name: 'Emby Connect',
          size: getColumnSize('Email'),
          sortBy: null,
          fillGrid: true
        });
        break;
      default:
        break;
    }
    switch (itemType) {
      case 'ApiKey':
        fields.push({
          id: 'AppName',
          name: _globalize.default.translate('AppName'),
          size: getColumnSize('Name'),
          sortBy: null,
          defaultVisible: '*',
          fillGrid: true
        });
        break;
      default:
        break;
    }
    switch (itemType) {
      case 'Device':
        fields.push({
          id: 'AppNameVersion',
          name: _globalize.default.translate('AppName'),
          size: getColumnSize('Name'),
          sortBy: null,
          defaultVisible: '*',
          fillGrid: true
        });
        break;
      default:
        break;
    }
    switch (itemType) {
      case 'ApiKey':
        fields.push({
          id: 'AccessToken',
          name: _globalize.default.translate('HeaderApiKey'),
          size: getColumnSize('Name'),
          sortBy: null,
          defaultVisible: '*',
          fillGrid: true
        });
        break;
      default:
        break;
    }
    switch (itemType) {
      case 'User':
        fields.push({
          id: 'LastActivityDateRelative',
          name: _globalize.default.translate('DateLastActive'),
          size: getColumnSize('Name'),
          sortBy: (_getDateLastActiveSor = getDateLastActiveSortOption(itemType, apiClient)) == null ? void 0 : _getDateLastActiveSor.value,
          viewTypes: 'cards',
          defaultVisible: 'cards,list'
        });
        break;
      default:
        break;
    }
    switch (itemType) {
      case 'Device':
      case 'User':
        fields.push({
          id: 'LastActivityDate',
          name: _globalize.default.translate('DateLastActive'),
          size: getColumnSize('DateTime'),
          sortBy: (_getDateLastActiveSor2 = getDateLastActiveSortOption(itemType, apiClient)) == null ? void 0 : _getDateLastActiveSor2.value,
          viewTypes: 'datagrid',
          defaultVisible: 'datagrid'
        });
        break;
      default:
        break;
    }
    switch (itemType) {
      case 'Device':
        fields.push({
          id: 'LastUser',
          name: _globalize.default.translate('User'),
          size: getColumnSize('Name'),
          sortBy: null,
          viewTypes: 'datagrid',
          defaultVisible: 'datagrid',
          fillGrid: true
        });
        break;
      default:
        break;
    }
    switch (itemType) {
      case '':
      case 'TvChannel':
        fields.push({
          id: 'Number',
          name: _globalize.default.translate('Number'),
          size: getColumnSize('Number'),
          sortBy: (_getNumberSortOption = getNumberSortOption(itemType)) == null ? void 0 : _getNumberSortOption.value,
          viewTypes: 'datagrid'
        });
        break;
      case 'Audio':
        fields.push({
          id: 'Number',
          name: _globalize.default.translate('Number'),
          gridDisplayNameText: '#',
          size: getColumnSize('IndexNumber'),
          sortBy: (_getNumberSortOption2 = getNumberSortOption(itemType)) == null ? void 0 : _getNumberSortOption2.value,
          viewTypes: 'datagrid'
        });
        break;
      default:
        break;
    }
    switch (itemType) {
      case 'Program':
        fields.push({
          id: 'StartDate',
          name: _globalize.default.translate('AirDate'),
          size: getColumnSize('StartDate'),
          sortBy: (_getStartDateSortOpti = getStartDateSortOption(itemType)) == null ? void 0 : _getStartDateSortOpti.value,
          viewTypes: 'datagrid',
          defaultVisible: 'datagrid'
        });
        break;
      default:
        break;
    }
    switch (itemType) {
      case '':
      case 'Movie':
      case 'Video':
      case 'Trailer':
      case 'MusicVideo':
      case 'Series':
      case 'Game':
        fields.push({
          id: 'OriginalTitle',
          name: _globalize.default.translate('OriginalTitle'),
          size: getColumnSize('OriginalTitle'),
          sortBy: (_getOriginalTitleSort = getOriginalTitleSortOption()) == null ? void 0 : _getOriginalTitleSort.value,
          viewTypes: 'datagrid',
          fillGrid: true
        });
        break;
      default:
        break;
    }
    switch (itemType) {
      case '':
      case 'Folder':
      case 'Movie':
      case 'Series':
      case 'Season':
      case 'Episode':
      case 'BoxSet':
      case 'Trailer':
      case 'Audio':
      case 'MusicAlbum':
      case 'MusicArtist':
      case 'MusicGenre':
      case 'MusicVideo':
      case 'Playlist':
      case 'Video':
      case 'Game':
      case 'Book':
      case 'Genre':
      case 'GameGenre':
      case 'Person':
      case 'GameSystem':
      case 'Photo':
      case 'PhotoAlbum':
      case 'TvChannel':
      case 'Studio':
      case 'Channel':
      case 'UserView':
      case 'Tag':
        fields.push({
          id: 'SortName',
          name: _globalize.default.translate('SortName'),
          size: getColumnSize('SortName'),
          sortBy: (_this$getNameSortOpti4 = this.getNameSortOption(itemType, apiClient)) == null ? void 0 : _this$getNameSortOpti4.value,
          viewTypes: 'datagrid',
          fillGrid: true
        });
        break;
      default:
        break;
    }
    switch (itemType) {
      case '':
      case 'Movie':
      case 'Episode':
      case 'Trailer':
      case 'Audio':
      case 'MusicVideo':
      case 'Video':
      case 'Game':
      case 'Photo':
      case 'Book':
      case 'Playlist':
        fields.push({
          id: 'Filename',
          name: _globalize.default.translate('FileName'),
          size: getColumnSize('Filename'),
          sortBy: (_getFileSortOption = getFileSortOption()) == null ? void 0 : _getFileSortOption.value,
          fillGrid: true
        });
        fields.push({
          id: 'Path',
          name: _globalize.default.translate('Path'),
          size: getColumnSize('Path'),
          sortBy: (_getFileSortOption2 = getFileSortOption()) == null ? void 0 : _getFileSortOption2.value,
          viewTypes: 'datagrid',
          fillGrid: true
        });
        break;
      default:
        break;
    }
    switch (itemType) {
      case '':
      case 'Audio':
      case 'MusicAlbum':
      case 'MusicVideo':
        fields.push({
          id: 'Artist',
          name: _globalize.default.translate('Artist'),
          size: getColumnSize('Artist'),
          sortBy: (_getArtistSortOption = getArtistSortOption()) == null ? void 0 : _getArtistSortOption.value,
          viewTypes: 'datagrid',
          defaultVisible: 'datagrid',
          fillGrid: true
        });
        fields.push({
          id: 'AlbumArtist',
          name: _globalize.default.translate('AlbumArtist'),
          size: getColumnSize('AlbumArtist'),
          sortBy: (_getAlbumArtistSortOp = getAlbumArtistSortOption()) == null ? void 0 : _getAlbumArtistSortOp.value,
          viewTypes: 'datagrid',
          defaultVisible: 'datagrid',
          fillGrid: true
        });
        fields.push({
          id: 'Composer',
          name: _globalize.default.translate('Composer'),
          size: getColumnSize('Composer'),
          sortBy: (_getComposerSortOptio = getComposerSortOption()) == null ? void 0 : _getComposerSortOptio.value,
          viewTypes: 'datagrid',
          fillGrid: true
        });
        break;
      default:
        break;
    }
    switch (itemType) {
      case '':
      case 'Audio':
        fields.push({
          id: 'Album',
          name: _globalize.default.translate('Album'),
          size: getColumnSize('Album'),
          sortBy: (_getAlbumSortOption = getAlbumSortOption()) == null ? void 0 : _getAlbumSortOption.value,
          viewTypes: 'datagrid',
          defaultVisible: 'datagrid',
          fillGrid: true
        });
        break;
      default:
        break;
    }
    switch (itemType) {
      case '':
      case 'Movie':
      case 'Series':
      case 'Season':
      case 'Episode':
      case 'BoxSet':
      case 'Trailer':
      case 'Audio':
      case 'MusicAlbum':
      case 'MusicVideo':
      case 'MusicArtist':
      case 'Video':
      case 'Game':
      case 'Book':
      case 'Photo':
      case 'Program':
      case 'TvChannel':
        fields.push({
          id: 'CommunityRating',
          name: getCommunityRatingOptionName(itemType),
          size: getColumnSize('CommunityRating'),
          sortBy: (_getCommunityRatingSo = getCommunityRatingSortOption(itemType)) == null ? void 0 : _getCommunityRatingSo.value,
          defaultVisible: 'datagrid'
        });
        break;
      default:
        break;
    }
    switch (itemType) {
      case '':
      case 'Movie':
      case 'Series':
      case 'Season':
      case 'Episode':
      case 'BoxSet':
      case 'Trailer':
      case 'MusicAlbum':
      case 'MusicVideo':
      case 'Video':
      case 'Game':
      case 'Book':
      case 'Photo':
      case 'Program':
      case 'TvChannel':
        fields.push({
          id: 'CriticRating',
          name: _globalize.default.translate('CriticRating'),
          size: getColumnSize('CriticRating'),
          sortBy: (_getCriticRatingSortO = getCriticRatingSortOption()) == null ? void 0 : _getCriticRatingSortO.value,
          defaultVisible: 'datagrid'
        });
        break;
      default:
        break;
    }
    switch (itemType) {
      case '':
      case 'Movie':
      case 'Series':
      case 'Season':
      case 'Episode':
      case 'BoxSet':
      case 'Trailer':
      case 'MusicAlbum':
      case 'MusicVideo':
      case 'Playlist':
      case 'Video':
      case 'Game':
      case 'Book':
      case 'Photo':
      case 'Program':
      case 'TvChannel':
        fields.push({
          id: 'OfficialRating',
          name: _globalize.default.translate('ParentalRating'),
          size: getColumnSize('OfficialRating'),
          sortBy: (_getParentalRatingSor = getParentalRatingSortOption()) == null ? void 0 : _getParentalRatingSor.value,
          defaultVisible: 'datagrid'
        });
        break;
      case 'Audio':
        fields.push({
          id: 'OfficialRating',
          name: _globalize.default.translate('ParentalRating'),
          size: getColumnSize('OfficialRating'),
          sortBy: (_getParentalRatingSor2 = getParentalRatingSortOption()) == null ? void 0 : _getParentalRatingSor2.value
        });
        break;
      default:
        break;
    }
    switch (itemType) {
      case '':
      case 'Movie':
      case 'Series':
      case 'Season':
      case 'Episode':
      case 'BoxSet':
      case 'Trailer':
      case 'Audio':
      case 'MusicAlbum':
      case 'MusicVideo':
      case 'Video':
      case 'Game':
      case 'Book':
      case 'Person':
      case 'Photo':
      case 'Program':
        {
          var _getProductionYearSor;
          var defaultVisible;
          switch (itemType) {
            case 'Season':
            case 'Episode':
            case 'Audio':
            case 'MusicAlbum':
            case 'MusicVideo':
            case 'Video':
            case 'Game':
            case 'Book':
            case 'Person':
            case 'Photo':
              defaultVisible = 'datagrid';
              break;
            case 'BoxSet':
            case 'Playlist':
              break;
            default:
              defaultVisible = '*';
              break;
          }
          fields.push({
            id: 'ProductionYear',
            name: _globalize.default.translate('Year'),
            size: getColumnSize('ProductionYear'),
            sortBy: (_getProductionYearSor = getProductionYearSortOption()) == null ? void 0 : _getProductionYearSor.value,
            defaultVisible: defaultVisible
          });
          break;
        }
      default:
        break;
    }
    switch (itemType) {
      case '':
      case 'Episode':
      case 'MusicVideo':
      case 'Video':
      case 'Game':
      case 'Book':
      case 'Person':
      case 'Photo':
      case 'Program':
        fields.push({
          id: 'PremiereDate',
          name: _globalize.default.translate('ReleaseDate'),
          size: getColumnSize('Date'),
          sortBy: (_getReleaseDateSortOp = getReleaseDateSortOption()) == null ? void 0 : _getReleaseDateSortOp.value,
          viewTypes: 'datagrid',
          defaultVisible: 'datagrid'
        });
        break;
      case 'Audio':
      case 'Trailer':
      case 'MusicAlbum':
      case 'Movie':
      case 'Series':
      case 'Season':
        fields.push({
          id: 'PremiereDate',
          name: _globalize.default.translate('ReleaseDate'),
          size: getColumnSize('Date'),
          sortBy: (_getReleaseDateSortOp2 = getReleaseDateSortOption()) == null ? void 0 : _getReleaseDateSortOp2.value,
          viewTypes: 'datagrid'
        });
        break;
      default:
        break;
    }
    switch (itemType) {
      case '':
      case 'Movie':
      case 'Episode':
      case 'Trailer':
      case 'MusicVideo':
      case 'Video':
      case 'Audio':
      case 'MusicAlbum':
      case 'Playlist':
      case 'Series':
      case 'Season':
        fields.push({
          id: 'Runtime',
          name: _globalize.default.translate('Runtime'),
          gridDisplayNameText: _globalize.default.translate('Time'),
          size: getColumnSize('Runtime'),
          sortBy: (_getRuntimeSortOption = getRuntimeSortOption()) == null ? void 0 : _getRuntimeSortOption.value,
          defaultVisible: 'datagrid'
        });
        break;
      default:
        break;
    }
    switch (itemType) {
      case '':
      case 'Movie':
      case 'Series':
      case 'Season':
      case 'Episode':
      case 'Trailer':
      case 'Audio':
      case 'MusicAlbum':
      case 'MusicArtist':
      case 'MusicVideo':
      case 'Video':
      case 'Game':
      case 'Book':
      case 'Program':
        fields.push({
          id: 'Genres',
          name: _globalize.default.translate('Genres'),
          size: getColumnSize('Genres'),
          sortBy: null,
          fillGrid: true,
          defaultVisible: 'datagrid'
        });
        break;
      default:
        break;
    }
    switch (itemType) {
      case 'Folder':
      case 'Photo':
      case 'GameSystem':
      case 'Playlist':
        fields.push({
          id: 'Genres',
          name: _globalize.default.translate('Genres'),
          size: getColumnSize('Genres'),
          sortBy: null,
          fillGrid: true
        });
        break;
      default:
        break;
    }
    switch (itemType) {
      case '':
      case 'Movie':
      case 'Trailer':
      case 'Series':
      case 'MusicVideo':
      case 'Episode':
      case 'Video':
        fields.push({
          id: 'Director',
          name: _globalize.default.translate('Director'),
          size: getColumnSize('Artist'),
          sortBy: (_getDirectorSortOptio = getDirectorSortOption(apiClient)) == null ? void 0 : _getDirectorSortOptio.value,
          fillGrid: true
        });
        break;
      default:
        break;
    }
    switch (itemType) {
      case '':
      case 'Folder':
      case 'Movie':
      case 'Series':
      case 'Season':
      case 'Episode':
      case 'Trailer':
      case 'Audio':
      case 'MusicAlbum':
      case 'MusicArtist':
      case 'MusicVideo':
      case 'Playlist':
      case 'Video':
      case 'Game':
      case 'Book':
      case 'Person':
      case 'GameSystem':
      case 'Photo':
      case 'Program':
      case 'TvChannel':
        fields.push({
          id: 'Tags',
          name: _globalize.default.translate('Tags'),
          size: getColumnSize('Tags'),
          sortBy: null,
          fillGrid: true
        });
        break;
      default:
        break;
    }
    switch (itemType) {
      case '':
      case 'Folder':
      case 'Movie':
      case 'Series':
      case 'Season':
      case 'Episode':
      case 'Trailer':
      case 'Audio':
      case 'MusicAlbum':
      case 'MusicArtist':
      case 'MusicVideo':
      case 'Playlist':
      case 'Video':
      case 'Game':
      case 'Book':
      case 'GameSystem':
      case 'Photo':
      case 'Program':
      case 'TvChannel':
        fields.push({
          id: 'Studios',
          name: _globalize.default.translate('Studios'),
          size: getColumnSize('Studios'),
          sortBy: null,
          fillGrid: true
        });
        break;
      default:
        break;
    }
    switch (itemType) {
      case '':
      case 'Movie':
      case 'Trailer':
      case 'Series':
      case 'MusicVideo':
      case 'Video':
        fields.push({
          id: 'Tagline',
          name: _globalize.default.translate('Tagline'),
          size: getColumnSize('Path'),
          sortBy: null,
          fillGrid: true
        });
        break;
      default:
        break;
    }
    switch (itemType) {
      case '':
      case 'Folder':
      case 'BoxSet':
      case 'Movie':
      case 'Series':
      case 'Season':
      case 'Episode':
      case 'Trailer':
      case 'Audio':
      case 'MusicAlbum':
      case 'MusicArtist':
      case 'MusicVideo':
      case 'Playlist':
      case 'Video':
      case 'Game':
      case 'Book':
      case 'Person':
      case 'GameSystem':
      case 'Photo':
      case 'Program':
        fields.push({
          id: 'Overview',
          name: _globalize.default.translate('Overview'),
          size: getColumnSize('Path'),
          sortBy: null,
          fillGrid: true
        });
        break;
      default:
        break;
    }
    switch (itemType) {
      case '':
      case 'Movie':
      case 'Episode':
      case 'Trailer':
      case 'Audio':
      case 'MusicVideo':
      case 'Video':
      case 'Game':
      case 'Photo':
      case 'Book':
        fields.push({
          id: 'Container',
          name: _globalize.default.translate('Container'),
          size: getColumnSize('Container'),
          sortBy: (_getContainerSortOpti = getContainerSortOption()) == null ? void 0 : _getContainerSortOpti.value
        });
        break;
      default:
        break;
    }
    switch (itemType) {
      case '':
      case 'Movie':
      case 'Episode':
      case 'Trailer':
      case 'MusicVideo':
      case 'Video':
      case 'TvChannel':
      case 'Program':
      case 'Photo':
        fields.push({
          id: 'Resolution',
          name: _globalize.default.translate('Resolution'),
          size: getColumnSize('Resolution'),
          sortBy: (_getResolutionSortOpt = getResolutionSortOption()) == null ? void 0 : _getResolutionSortOpt.value
        });
        break;
      default:
        break;
    }
    switch (itemType) {
      case '':
      case 'Movie':
      case 'Episode':
      case 'Trailer':
      case 'Audio':
      case 'MusicVideo':
      case 'Video':
        fields.push({
          id: 'Bitrate',
          name: _globalize.default.translate('Bitrate'),
          size: getColumnSize('Bitrate'),
          sortBy: (_getBitrateSortOption = getBitrateSortOption()) == null ? void 0 : _getBitrateSortOption.value
        });
        break;
      default:
        break;
    }
    switch (itemType) {
      case '':
      case 'Movie':
      case 'Episode':
      case 'Trailer':
      case 'Audio':
      case 'MusicVideo':
      case 'Video':
      case 'Game':
      case 'Photo':
      case 'Book':
        fields.push({
          id: 'Size',
          name: _globalize.default.translate('Size'),
          size: getColumnSize('Size'),
          sortBy: (_getSizeSortOption = getSizeSortOption(itemType)) == null ? void 0 : _getSizeSortOption.value
        });
        break;
      default:
        break;
    }
    switch (itemType) {
      case '':
      case 'Movie':
      case 'Episode':
      case 'Trailer':
      case 'MusicVideo':
      case 'Video':
        fields.push({
          id: 'Video3DFormat',
          name: '3D',
          size: getColumnSize('Video3DFormat'),
          sortBy: null,
          viewTypes: 'datagrid'
        });
        break;
      default:
        break;
    }
    switch (itemType) {
      case '':
      case 'Movie':
      case 'Episode':
      case 'Trailer':
      case 'Audio':
      case 'MusicVideo':
      case 'Video':
      case 'Game':
      case 'Book':
      case 'TvChannel':
      case 'Series':
        fields.push({
          id: 'DatePlayed',
          name: _globalize.default.translate('DatePlayed'),
          size: getColumnSize('Date'),
          sortBy: (_getDatePlayedSortOpt = getDatePlayedSortOption(itemType)) == null ? void 0 : _getDatePlayedSortOpt.value
        });
        break;
      default:
        break;
    }
    switch (itemType) {
      case '':
      case 'Movie':
      case 'Episode':
      case 'Trailer':
      case 'Audio':
      case 'MusicVideo':
      case 'Video':
      case 'Game':
      case 'Book':
      case 'TvChannel':
        fields.push({
          id: 'PlayCount',
          name: _globalize.default.translate('Plays'),
          size: getColumnSize('PlayCount'),
          sortBy: (_getPlayCountSortOpti = getPlayCountSortOption()) == null ? void 0 : _getPlayCountSortOpti.value,
          viewTypes: 'datagrid',
          defaultVisible: 'datagrid'
        });
        break;
      default:
        break;
    }
    switch (itemType) {
      case '':
      case 'Movie':
      case 'Series':
      case 'Season':
      case 'Episode':
      case 'Trailer':
      case 'Audio':
      case 'MusicVideo':
      case 'Video':
      case 'Game':
      case 'Book':
      case 'TvChannel':
      case 'MusicAlbum':
        if (itemType !== 'MusicAlbum' || ((_options$parentItem = options.parentItem) == null ? void 0 : _options$parentItem.CollectionType) === 'audiobooks') {
          fields.push({
            id: 'Played',
            name: _globalize.default.translate('Played'),
            gridDisplayNameHtml: '<i title="' + _globalize.default.translate('Played') + '" class="md-icon dataGridItemCell-icon">&#xe86c;</i>',
            size: getColumnSize('Icon'),
            sortBy: null,
            gridColumnType: 'button',
            viewTypes: 'datagrid',
            defaultVisible: 'datagrid',
            center: true
          });
        }
        break;
      default:
        break;
    }
    switch (itemType) {
      case 'User':
        fields.push({
          id: 'HasPassword',
          name: _globalize.default.translate('Password'),
          size: getColumnSize('Icon'),
          sortBy: null,
          gridColumnType: 'button',
          viewTypes: 'datagrid',
          defaultVisible: 'datagrid'
          //center: true
        });
        break;
      default:
        break;
    }
    if (apiClient != null && apiClient.isMinServerVersion('4.8.0.50')) {
      switch (itemType) {
        case 'User':
          fields.push({
            id: 'HasProfilePin',
            name: _globalize.default.translate('TitleProfilePin'),
            size: getColumnSize('Icon'),
            sortBy: null,
            gridColumnType: 'button',
            viewTypes: 'datagrid',
            defaultVisible: 'datagrid'
            //center: true
          });
          break;
        default:
          break;
      }
    }
    switch (itemType) {
      case 'User':
        fields.push({
          id: 'EnableRemoteAccess',
          name: _globalize.default.translate('RemoteAccess'),
          size: getColumnSize('Icon'),
          sortBy: null,
          gridColumnType: 'icon',
          viewTypes: 'datagrid',
          defaultVisible: 'datagrid'
          //center: true
        });
        break;
      default:
        break;
    }
    switch (itemType) {
      case 'User':
        fields.push({
          id: 'IsDisabled',
          name: _globalize.default.translate('Disabled'),
          size: getColumnSize('Icon'),
          sortBy: null,
          gridColumnType: 'icon',
          viewTypes: 'datagrid',
          defaultVisible: 'datagrid'
          //center: true
        });
        break;
      default:
        break;
    }
    switch (itemType) {
      case '':
      case 'Movie':
      case 'Series':
      case 'Season':
      case 'Episode':
      case 'BoxSet':
      case 'Trailer':
      case 'Audio':
      case 'MusicAlbum':
      case 'MusicArtist':
      case 'MusicVideo':
      case 'Video':
      case 'Game':
      case 'Book':
      case 'Person':
      case 'Photo':
      case 'TvChannel':
      case 'Playlist':
        fields.push({
          id: 'DateCreated',
          name: _globalize.default.translate('DateCreated'),
          size: getColumnSize('Date'),
          sortBy: (_getDateAddedSortOpti = getDateAddedSortOption(itemType, apiClient)) == null ? void 0 : _getDateAddedSortOpti.value
        });
        break;
      case 'User':
        fields.push({
          id: 'DateCreated',
          name: _globalize.default.translate('DateCreated'),
          size: getColumnSize('Date'),
          sortBy: (_getDateAddedSortOpti2 = getDateAddedSortOption(itemType, apiClient)) == null ? void 0 : _getDateAddedSortOpti2.value
        });
        break;
      case 'ApiKey':
        fields.push({
          id: 'DateCreated',
          name: _globalize.default.translate('DateCreated'),
          size: getColumnSize('Date'),
          sortBy: (_getDateAddedSortOpti3 = getDateAddedSortOption(itemType, apiClient)) == null ? void 0 : _getDateAddedSortOpti3.value,
          defaultVisible: '*'
        });
        break;
      default:
        break;
    }
    switch (itemType) {
      case '':
      case 'Video':
      case 'Movie':
      case 'MusicVideo':
      case 'Episode':
      case 'Trailer':
        if (apiClient != null && apiClient.isMinServerVersion('4.9.1.12')) {
          var _getVideoCodecSortOpt, _getFramerateSortOpti;
          fields.push({
            id: 'VideoCodec',
            name: _globalize.default.translate('LabelVideoCodec'),
            size: getColumnSize('Container'),
            sortBy: (_getVideoCodecSortOpt = getVideoCodecSortOption()) == null ? void 0 : _getVideoCodecSortOpt.value
          });
          fields.push({
            id: 'Framerate',
            name: _globalize.default.translate('Framerate'),
            size: getColumnSize('Container'),
            sortBy: (_getFramerateSortOpti = getFramerateSortOption()) == null ? void 0 : _getFramerateSortOpti.value
          });
        }
        break;
      default:
        break;
    }
    switch (itemType) {
      case '':
      case 'Video':
      case 'Movie':
      case 'MusicVideo':
      case 'Episode':
      case 'Trailer':
      case 'Audio':
        if (apiClient != null && apiClient.isMinServerVersion('4.9.1.12')) {
          var _getAudioCodecSortOpt;
          fields.push({
            id: 'AudioCodec',
            name: _globalize.default.translate('LabelAudioCodec'),
            size: getColumnSize('Container'),
            sortBy: (_getAudioCodecSortOpt = getAudioCodecSortOption()) == null ? void 0 : _getAudioCodecSortOpt.value
          });
        }
        break;
      default:
        break;
    }
    switch (itemType) {
      case 'Device':
        if (apiClient != null && apiClient.isMinServerVersion('4.8.0.47')) {
          var _getIpAddressSortOpti;
          fields.push({
            id: 'IpAddress',
            name: _globalize.default.translate('IpAddress'),
            size: getColumnSize('IpAddress'),
            sortBy: (_getIpAddressSortOpti = getIpAddressSortOption(itemType, apiClient)) == null ? void 0 : _getIpAddressSortOpti.value,
            defaultVisible: 'datagrid'
          });
        }
        break;
      default:
        break;
    }
    switch (itemType) {
      case 'Log':
        fields.push({
          id: 'DateModified',
          name: _globalize.default.translate('DateModified'),
          size: getColumnSize('DateTime'),
          sortBy: (_getDateModifiedSortO = getDateModifiedSortOption(itemType, apiClient)) == null ? void 0 : _getDateModifiedSortO.value,
          defaultVisible: '*'
        });
        break;
      case 'Playlist':
        if (apiClient != null && apiClient.isMinServerVersion('4.9.1.1')) {
          var _getDateModifiedSortO2;
          fields.push({
            id: 'DateModified',
            name: _globalize.default.translate('DateModified'),
            size: getColumnSize('DateTime'),
            sortBy: (_getDateModifiedSortO2 = getDateModifiedSortOption(itemType, apiClient)) == null ? void 0 : _getDateModifiedSortO2.value
          });
        }
        break;
      default:
        break;
    }
    switch (itemType) {
      case 'Log':
        fields.push({
          id: 'Size',
          name: _globalize.default.translate('Size'),
          size: getColumnSize('Size'),
          sortBy: (_getSizeSortOption2 = getSizeSortOption(itemType)) == null ? void 0 : _getSizeSortOption2.value,
          defaultVisible: 'datagrid'
        });
        break;
      default:
        break;
    }
    switch (itemType) {
      case 'Plugin':
        fields.push({
          id: 'Version',
          name: _globalize.default.translate('Version'),
          size: getColumnSize('Version'),
          sortBy: null,
          defaultVisible: '*'
        });
        break;
      default:
        break;
    }
    switch (itemType) {
      case '':
      case 'Folder':
      case 'Movie':
      case 'Series':
      case 'Season':
      case 'Episode':
      case 'BoxSet':
      case 'Trailer':
      case 'Audio':
      case 'MusicAlbum':
      case 'MusicArtist':
      case 'MusicVideo':
      case 'Playlist':
      case 'Video':
      case 'Game':
      case 'Book':
      case 'Person':
      case 'Photo':
      case 'TvChannel':
        fields.push({
          id: 'IsFavorite',
          name: _globalize.default.translate('Favorite'),
          gridDisplayNameHtml: '<i title="' + _globalize.default.translate('Favorite') + '" class="md-icon dataGridItemCell-icon autortl">&#xe87d;</i>',
          size: getColumnSize('Icon'),
          sortBy: null,
          gridColumnType: 'button',
          viewTypes: 'datagrid',
          defaultVisible: 'datagrid',
          center: true
        });
        break;
      default:
        break;
    }
    for (var i = 0, length = fields.length; i < length; i++) {
      var field = fields[i];
      if (field.gridDisplayNameHtml) {
        continue;
      }
      if (field.name && field.size) {
        var fieldName = field.gridDisplayNameText || field.name;
        if (fieldName.length > field.size) {
          field.size = Math.max(fieldName.length, field.size);
        }
      }
    }
    return fields;
  };
  function compareByName(a, b) {
    var aName = a.menuSortKey || a.name;
    var bName = b.menuSortKey || b.name;
    if (aName < bName) {
      return -1;
    }
    if (aName > bName) {
      return 1;
    }
    return 0;
  }
  BaseItemController.prototype.getNameSortOption = function (itemType, apiClient) {
    switch (itemType) {
      case 'ApiKey':
      case 'Log':
      case 'Plugin':
      case 'ActivityLogEntry':
        return null;
      case 'Device':
        if (!(apiClient != null && apiClient.isMinServerVersion('4.8.0.47'))) {
          return null;
        }
        return {
          name: _globalize.default.translate('Title'),
          value: 'SortName,DateLastActivity',
          defaultSortOrder: 'Ascending'
        };
      case 'User':
        if (!(apiClient != null && apiClient.isMinServerVersion('4.8.0.47'))) {
          return null;
        }
        return {
          name: _globalize.default.translate('Title'),
          value: 'SortName',
          defaultSortOrder: 'Ascending'
        };
      default:
        return {
          name: _globalize.default.translate('Title'),
          value: 'SortName',
          defaultSortOrder: 'Ascending'
        };
    }
  };
  BaseItemController.prototype.getDefaultSorting = function (options) {
    var itemType = options.itemType || '';
    var apiClient = options.apiClient;
    var field;
    switch (itemType) {
      case 'Episode':
        field = getSeriesSortOption(itemType);
        break;
      case 'Program':
        field = getStartDateSortOption(itemType);
        break;
      case 'Device':
        field = getDateLastActiveSortOption(itemType, apiClient);
        break;
      default:
        break;
    }
    if (!field) {
      field = this.getNameSortOption(itemType, apiClient);
    }
    if (!field) {
      return null;
    }
    return {
      sortBy: field.value,
      sortOrder: field.defaultSortOrder
    };
  };
  function getPlaylistOrCollectionSortMenuOptions(listType) {
    var options = [];
    options.push({
      name: listType === 'Playlist' ? _globalize.default.translate('PlaylistOrder') : listType === 'BoxSet' ? _globalize.default.translate('CollectionOrder') : _globalize.default.translate('Default'),
      value: 'default',
      defaultSortOrder: 'Ascending'
    });
    options.push({
      name: _globalize.default.translate('Album'),
      value: 'Album,ParentIndexNumber,IndexNumber',
      defaultSortOrder: 'Ascending'
    });
    if (listType === 'Playlist') {
      options.push({
        name: _globalize.default.translate('AlbumArtist'),
        value: 'AlbumArtist,Album,ParentIndexNumber,IndexNumber,SortName',
        defaultSortOrder: 'Ascending'
      });
    }
    options.push({
      name: _globalize.default.translate('Artist'),
      value: 'Artist,Album,ParentIndexNumber,IndexNumber,SortName',
      defaultSortOrder: 'Ascending'
    });
    options.push({
      name: _globalize.default.translate('CommunityRating'),
      value: 'CommunityRating',
      defaultSortOrder: 'Descending'
    });
    options.push({
      name: _globalize.default.translate('DateAdded'),
      value: 'DateCreated',
      defaultSortOrder: 'Descending'
    });
    options.push({
      name: _globalize.default.translate('FileName'),
      value: 'IsFolder,Filename',
      defaultSortOrder: 'Ascending'
    });
    options.push({
      name: _globalize.default.translate('Runtime'),
      value: 'Runtime',
      defaultSortOrder: 'Ascending'
    });
    options.push({
      name: _globalize.default.translate('Title'),
      value: 'SortName',
      defaultSortOrder: 'Ascending'
    });
    options.push(getReleaseDateSortOption());
    options.push({
      name: _globalize.default.translate('Year'),
      value: 'ProductionYear',
      defaultSortOrder: 'Descending'
    });
    return options;
  }
  BaseItemController.prototype.getSortMenuOptions = function (options) {
    var sortBy = [];
    var itemType = options.itemType || '';
    var apiClient = options.apiClient;
    var availableFieldIds = options.availableFieldIds;
    switch (itemType) {
      case 'PlaylistItem':
        return getPlaylistOrCollectionSortMenuOptions('Playlist');
      case 'BoxSetItem':
        if (!apiClient.isMinServerVersion('4.8.0.16')) {
          return [];
        }
        return getPlaylistOrCollectionSortMenuOptions('BoxSet');
      default:
        break;
    }
    if (availableFieldIds.Name || availableFieldIds.SortName) {
      var option = this.getNameSortOption(itemType, apiClient);
      if (option) {
        sortBy.push(option);
      }
    }
    if (availableFieldIds.Album) {
      var _option = getAlbumSortOption();
      if (_option) {
        sortBy.push(_option);
      }
    }
    if (availableFieldIds.AlbumArtist) {
      var _option2 = getAlbumArtistSortOption();
      if (_option2) {
        sortBy.push(_option2);
      }
    }
    if (availableFieldIds.Artist) {
      var _option3 = getArtistSortOption();
      if (_option3) {
        sortBy.push(_option3);
      }
    }
    if (availableFieldIds.StartDate) {
      var _option4 = getStartDateSortOption(itemType);
      if (_option4) {
        sortBy.push(_option4);
      }
    }
    if (availableFieldIds.Filename || availableFieldIds.Path) {
      var _option5 = getFileSortOption();
      if (_option5) {
        sortBy.push(_option5);
      }
    }
    if (availableFieldIds.Bitrate) {
      var _option6 = getBitrateSortOption();
      if (_option6) {
        sortBy.push(_option6);
      }
    }
    if (availableFieldIds.CommunityRating) {
      var _option7 = getCommunityRatingSortOption(itemType);
      if (_option7) {
        sortBy.push(_option7);
      }
    }
    if (availableFieldIds.Composer) {
      var _option8 = getComposerSortOption();
      if (_option8) {
        sortBy.push(_option8);
      }
    }
    if (availableFieldIds.Director) {
      var _option9 = getDirectorSortOption(apiClient);
      if (_option9) {
        sortBy.push(_option9);
      }
    }
    if (availableFieldIds.Container) {
      var _option0 = getContainerSortOption();
      if (_option0) {
        sortBy.push(_option0);
      }
    }
    if (availableFieldIds.VideoCodec) {
      var _option1 = getVideoCodecSortOption();
      if (_option1) {
        sortBy.push(_option1);
      }
    }
    if (availableFieldIds.Framerate) {
      var _option10 = getFramerateSortOption();
      if (_option10) {
        sortBy.push(_option10);
      }
    }
    if (availableFieldIds.CriticRating) {
      var _option11 = getCriticRatingSortOption();
      if (_option11) {
        sortBy.push(_option11);
      }
    }
    if (availableFieldIds.DateCreated) {
      var _option12 = getDateAddedSortOption(itemType, apiClient);
      if (_option12) {
        sortBy.push(_option12);
      }
    }
    if (availableFieldIds.DateModified) {
      var _option13 = getDateModifiedSortOption(itemType, apiClient);
      if (_option13) {
        sortBy.push(_option13);
      }
    }
    if (availableFieldIds.LastActivityDate || availableFieldIds.LastActivityDateRelative) {
      var _option14 = getDateLastActiveSortOption(itemType, apiClient);
      if (_option14) {
        sortBy.push(_option14);
      }
    }
    if (availableFieldIds.IpAddress) {
      var _option15 = getIpAddressSortOption(itemType, apiClient);
      if (_option15) {
        sortBy.push(_option15);
      }
    }
    var looseOption = getDateLastContentAddedSortOption(itemType, apiClient);
    if (looseOption) {
      sortBy.push(looseOption);
    }
    looseOption = getDateLastEpisodeAiredSortOption(itemType, apiClient);
    if (looseOption) {
      sortBy.push(looseOption);
    }
    if (availableFieldIds.DatePlayed) {
      var _option16 = getDatePlayedSortOption(itemType);
      if (_option16) {
        sortBy.push(_option16);
      }
    }
    looseOption = getFavoritesSortOption(itemType);
    if (looseOption) {
      sortBy.push(looseOption);
    }
    if (availableFieldIds.OfficialRating) {
      var _option17 = getParentalRatingSortOption();
      if (_option17) {
        sortBy.push(_option17);
      }
    }
    if (availableFieldIds.PlayCount) {
      var _option18 = getPlayCountSortOption();
      if (_option18) {
        sortBy.push(_option18);
      }
    }
    if (availableFieldIds.ProductionYear) {
      var _option19 = getProductionYearSortOption();
      if (_option19) {
        sortBy.push(_option19);
      }
    }
    if (availableFieldIds.PremiereDate) {
      var _option20 = getReleaseDateSortOption();
      if (_option20) {
        sortBy.push(_option20);
      }
    }
    if (availableFieldIds.Resolution) {
      var _option21 = getResolutionSortOption();
      if (_option21) {
        sortBy.push(_option21);
      }
    }
    if (availableFieldIds.Runtime) {
      var _option22 = getRuntimeSortOption();
      if (_option22) {
        sortBy.push(_option22);
      }
    }
    if (availableFieldIds.SeriesName) {
      var _option23 = getSeriesSortOption(itemType);
      if (_option23) {
        sortBy.push(_option23);
      }
    }
    if (availableFieldIds.Size) {
      var _option24 = getSizeSortOption(itemType);
      if (_option24) {
        sortBy.push(_option24);
      }
    }
    if (availableFieldIds.Number) {
      var _option25 = getNumberSortOption(itemType);
      if (_option25) {
        sortBy.push(_option25);
      }
    }
    looseOption = getRandomSortOption(itemType, apiClient);
    if (looseOption) {
      sortBy.push(looseOption);
    }
    sortBy.sort(compareByName);
    return sortBy;
  };
  function notifyAddedToList(listName, listType, numItems) {
    listName = _textencoding.default.htmlEncode(listName);
    var secondaryText = numItems === 1 ? _globalize.default.translate('OneItemAddedTo', listName) : _globalize.default.translate('ItemsAddedTo', numItems, listName);
    var text = listType === 'Playlist' ? _globalize.default.translate('HeaderAddedToPlaylist') : _globalize.default.translate('HeaderAddedToCollection');
    showToast({
      text: text,
      secondaryText: secondaryText,
      icon: '&#xe03b;'
    });
  }
  function confirmDuplicatesIfNeeded(apiClient, userId, type, id, addIds) {
    if (type !== 'Playlist') {
      return Promise.resolve();
    }
    return apiClient.getAddToPlaylistInfo(userId, id, addIds).then(function (result) {
      if (!result.ContainsDuplicates) {
        return Promise.resolve();
      }
      var options = {
        text: result.ItemCount > 1 ? _globalize.default.translate('ItemsAlreadyInPlaylist') : _globalize.default.translate('ItemAlreadyInPlaylist'),
        buttons: []
      };
      options.buttons.push({
        name: _globalize.default.translate('HeaderAddAgain'),
        id: 'add',
        type: 'submit'
      });
      options.buttons.push({
        name: _globalize.default.translate('Skip'),
        id: 'skip'
      });
      options.buttons.push({
        name: _globalize.default.translate('Cancel'),
        id: 'cancel',
        type: 'cancel'
      });
      return showDialog(options).then(function (result) {
        if (result === 'add') {
          return Promise.resolve(result);
        }
        if (result === 'skip') {
          return Promise.resolve(result);
        }
        return Promise.reject(result);
      });
    });
  }
  function onAddedToList(type, id) {
    var key = type === 'Playlist' ? 'playlisteditor-lastplaylistid' : 'collectioneditor-lastcollectionid';
    var lastListIds = _usersettings.default.get(key);
    lastListIds = lastListIds ? lastListIds.split(',') : [];
    if (!lastListIds.includes(id)) {
      lastListIds.unshift(id);
    }
    if (lastListIds.length > 3) {
      lastListIds.length = 3;
    }
    _usersettings.default.set(key, lastListIds.join(','));
  }
  BaseItemController.prototype.createListHelper = function (apiClient, type, name, itemIds) {
    _loading.default.show();
    return apiClient.createList(apiClient.getCurrentUserId(), type, name, itemIds).then(function (result) {
      _loading.default.hide();

      // The new list name will come from the server starting with 4.4.0.9
      var newListName = result.Name || name;
      onAddedToList(type, result.Id);
      notifyAddedToList(newListName, type, result.ItemAddedCount);
      return Promise.resolve();
    });
  };
  BaseItemController.prototype.addToListHelper = function (list, itemIds) {
    var apiClient = _connectionmanager.default.getApiClient(list.ServerId);
    var userId = apiClient.getCurrentUserId();
    return confirmDuplicatesIfNeeded(apiClient, userId, list.Type, list.Id, itemIds).then(function (result) {
      _loading.default.show();
      var skipDuplicates = result === 'skip';
      return apiClient.addToList(userId, list.Type, list.Id, itemIds, skipDuplicates).then(function (result) {
        _loading.default.hide();
        var type = list.Type === 'BoxSet' ? 'Collection' : 'Playlist';
        onAddedToList(type, list.Id);
        if (result.ItemAddedCount) {
          notifyAddedToList(list.Name, type, result.ItemAddedCount);
        }
      });
    });
  };
  BaseItemController.prototype.executeCommand = function (command, items, options) {
    return rejectNoSupportedCommands();
  };
  var _default = _exports.default = BaseItemController;
});
