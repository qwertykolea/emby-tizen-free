define(["exports", "./baseitemcontroller.js", "./genericitemcontroller.js", "./../globalize.js"], function (_exports, _baseitemcontroller, _genericitemcontroller, _globalize) {
  Object.defineProperty(_exports, "__esModule", {
    value: true
  });
  _exports.default = void 0;
  /* jshint module: true */

  var DefaultItemControllerInstance = new _baseitemcontroller.default();
  var commandSources = [];
  var controllersByType = {};
  function getItemController(typeName) {
    //console.log('getItemController: ' + new Error().stack);
    return controllersByType[typeName] || DefaultItemControllerInstance;
  }
  function rejectNoItems() {
    return Promise.reject('noitems');
  }
  function registerItemController(controller) {
    var typeNames = controller.getTypeNames();
    for (var i = 0, length = typeNames.length; i < length; i++) {
      controllersByType[typeNames[i]] = controller;
    }
  }
  registerItemController(new _genericitemcontroller.default());
  var _default = _exports.default = {
    registerItemController: registerItemController,
    registerCommandSource: function (commandSource) {
      commandSources.push(commandSource);
    },
    getItemController: getItemController,
    // this is only here as a convenience due to frequency of use
    getDisplayName: function (item, options) {
      return getItemController(item.Type).getDisplayName(item, options);
    },
    // this is only here as a convenience due to frequency of use
    getDefaultIcon: function (item) {
      return getItemController(item.Type).getDefaultIcon(item);
    },
    canConvert: function (item, user) {
      return getItemController(item.Type).canConvert(item, user);
    },
    canDelete: function (item, user) {
      return getItemController(item.Type).canDelete(item, user);
    },
    canEdit: function (item, user) {
      return getItemController(item.Type).canEdit(item, user);
    },
    canEditImages: function (item, user) {
      return getItemController(item.Type).canEditImages(item, user);
    },
    canEditSubtitles: function (item, user) {
      return getItemController(item.Type).canEditSubtitles(item, user);
    },
    canAddToPlaylist: function (item, user) {
      return getItemController(item.Type).canAddToPlaylist(item, user);
    },
    canAddToCollection: function (item, user) {
      return getItemController(item.Type).canAddToCollection(item, user);
    },
    canDownload: function (item) {
      return getItemController(item.Type).canDownload(item);
    },
    canDownloadSubtitles: function (item, user) {
      return getItemController(item.Type).canDownloadSubtitles(item, user);
    },
    canIdentify: function (item, user) {
      return getItemController(item.Type).canIdentify(item, user);
    },
    canSync: function (item, user) {
      return getItemController(item.Type).canSync(item, user);
    },
    canManageMultiVersionGrouping: function (item, user) {
      return getItemController(item.Type).canManageMultiVersionGrouping(item, user);
    },
    canRefreshMetadata: function (item, user) {
      return getItemController(item.Type).canRefreshMetadata(item, user);
    },
    canShare: function (item, user) {
      return getItemController(item.Type).canShare(item, user);
    },
    getItemTypeName: function (type) {
      return getItemController(type).getItemTypeName(type);
    },
    getAvailableFields: function (options) {
      return getItemController(options.itemType).getAvailableFields(options);
    },
    getDefaultSorting: function (options) {
      return getItemController(options.itemType).getDefaultSorting(options);
    },
    getSortMenuOptions: function (options) {
      return getItemController(options.itemType).getSortMenuOptions(options);
    },
    getPluralItemTypeName: function (type) {
      return getItemController(type).getPluralItemTypeName(type);
    },
    canRate: function (item) {
      return getItemController(item.Type).canRate(item);
    },
    canMarkPlayed: function (item) {
      return getItemController(item.Type).canMarkPlayed(item);
    },
    getCommands: function (options) {
      var items = options.items;
      if (!items) {
        items = [];
        if (options.item) {
          items.push(options.item);
        }
      }
      if (!items.length) {
        return [];
      }
      var commands = getItemController(items[0].Type).getCommands(options);
      for (var i = 0, length = commandSources.length; i < length; i++) {
        var subCommands = commandSources[i].getCommands(options);
        commands = commands.concat(subCommands);
      }
      return commands;
    },
    editItems: function (items, options) {
      if (!items.length) {
        return rejectNoItems();
      }
      return getItemController(items[0].Type).editItems(items, options);
    },
    refreshMetadata: function (items, options) {
      if (!items.length) {
        return rejectNoItems();
      }
      return getItemController(items[0].Type).refreshMetadata(items, options);
    },
    scanLibraryFiles: function (items, options) {
      if (!items.length) {
        return rejectNoItems();
      }
      return getItemController(items[0].Type).scanLibraryFiles(items, options);
    },
    moveInOrder: function (items, options) {
      if (!items.length) {
        return rejectNoItems();
      }
      return getItemController(items[0].Type).moveInOrder(items, options);
    },
    removeFromPlayQueue: function (items, options) {
      if (!items.length) {
        return rejectNoItems();
      }
      return getItemController(items[0].Type).removeFromPlayQueue(items, options);
    },
    addToPlaylist: function (items, options) {
      if (!items.length) {
        return rejectNoItems();
      }
      return getItemController(items[0].Type).addToPlaylist(items, options);
    },
    addToCollection: function (items, options) {
      if (!items.length) {
        return rejectNoItems();
      }
      return getItemController(items[0].Type).addToCollection(items, options);
    },
    showDeleteConfirmation: function (options) {
      var items = options.items;
      if (!items.length) {
        return rejectNoItems();
      }
      return getItemController(items[0].Type).showDeleteConfirmation(options);
    },
    deleteItems: function (options) {
      var items = options.items;
      if (!items.length) {
        return rejectNoItems();
      }
      return getItemController(items[0].Type).deleteItems(options);
    },
    getContentTypeName: function (contentType) {
      if (!contentType) {
        return _globalize.default.translate('MixedContent');
      }
      switch (contentType) {
        case 'movies':
          return _globalize.default.translate('Movies');
        case 'music':
          return _globalize.default.translate('Music');
        case 'tvshows':
          return _globalize.default.translate('TVShows');
        case 'books':
          return _globalize.default.translate('Books');
        case 'games':
          return _globalize.default.translate('Games');
        case 'musicvideos':
          return _globalize.default.translate('MusicVideos');
        case 'homevideos':
          return _globalize.default.translate('HomeVideosAndPhotos');
        case 'audiobooks':
          return _globalize.default.translate('AudioBooks');
        case 'boxsets':
          return _globalize.default.translate('Collections');
        case 'playlists':
          return _globalize.default.translate('Playlists');
        default:
          return contentType;
      }
    },
    groupVersions: function (items, options) {
      if (!items.length) {
        return rejectNoItems();
      }
      return getItemController(items[0].Type).groupVersions(items, options);
    },
    executeCommand: function (command, items, options) {
      return getItemController(items[0].Type).executeCommand(command, items, options).catch(function (err) {
        if (err !== 'nocommands') {
          return Promise.reject(err);
        }
        var commandSourceOptions = Object.assign({}, options);
        commandSourceOptions.items = items;
        var commandSource;
        for (var i = 0, commandSourcesLength = commandSources.length; i < commandSourcesLength; i++) {
          var subCommands = commandSources[i].getCommands(commandSourceOptions);
          var subCommand = void 0;
          for (var j = 0, subCommandsLength = subCommands.length; j < subCommandsLength; j++) {
            if (subCommands[j].id === command) {
              subCommand = subCommands[j];
              break;
            }
          }
          if (subCommand) {
            commandSource = commandSources[i];
            break;
          }
        }
        if (commandSource) {
          return commandSource.executeCommand(command, items, options);
        }
        return Promise.reject('nocommands');
      });
    },
    addToListHelper: function (list, itemIds) {
      if (!itemIds.length) {
        return rejectNoItems();
      }
      return DefaultItemControllerInstance.addToListHelper(list, itemIds);
    },
    supportsSimilarItems: function (item) {
      var itemType = item.Type;
      switch (itemType) {
        case 'Movie':
        case 'Trailer':
        case 'Series':
        case 'Program':
        case 'Recording':
        case 'Game':
        case 'MusicAlbum':
        case 'MusicArtist':
        case 'MusicVideo':
          return true;
        case 'Timer':
          return item.ProgramId != null;
        default:
          return false;
      }
    },
    supportsSimilarItemsOnLiveTV: function (item, apiClient) {
      var itemType = item.Type;
      switch (itemType) {
        //case 'Movie':
        //case 'Series':
        //    return true;
        default:
          return false;
      }
    },
    enableDateAddedDisplay: function (item) {
      var itemType = item.Type;
      return !item.IsFolder && item.MediaType && itemType !== 'Program' && itemType !== 'TvChannel' && itemType !== 'Trailer';
    },
    createListHelper: function (apiClient, type, name, itemIds) {
      return DefaultItemControllerInstance.createListHelper(apiClient, type, name, itemIds);
    }
  };
});
