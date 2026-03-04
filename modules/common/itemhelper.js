define(["exports", "./itemmanager/itemmanager.js"], function (_exports, _itemmanager) {
  Object.defineProperty(_exports, "__esModule", {
    value: true
  });
  _exports.default = void 0;
  /* jshint module: true */
  var _default = _exports.default = {
    getDisplayName: function (item, options) {
      return _itemmanager.default.getDisplayName(item, options);
    },
    supportsAddingToCollection: function (item, user) {
      return _itemmanager.default.canAddToCollection(item, user);
    },
    supportsAddingToPlaylist: function (item) {
      return _itemmanager.default.canAddToPlaylist(item);
    },
    canDelete: function (item, user) {
      return _itemmanager.default.canDelete(item, user);
    },
    canEdit: function (item, user) {
      return _itemmanager.default.canEdit([item], user);
    },
    canEditImages: function (item, user) {
      return _itemmanager.default.canEditImages(item, user);
    },
    canMarkPlayed: function (item) {
      return _itemmanager.default.canMarkPlayed(item);
    },
    canRate: function (item) {
      return _itemmanager.default.canRate(item);
    },
    canConvert: function (item, user) {
      return _itemmanager.default.canConvert(item, user);
    },
    canRefreshMetadata: function (item, user) {
      return _itemmanager.default.canRefreshMetadata(item, user);
    },
    supportsMediaSourceSelection: function (item) {
      var itemType = item.Type;
      switch (itemType) {
        case 'Movie':
        case 'Trailer':
        case 'Video':
        case 'Episode':
        case 'MusicVideo':
        case 'TvChannel':
          return true;
        default:
          return false;
      }
    },
    supportsExtras: function (item) {
      if (item.IsFolder) {
        return false;
      }
      var itemType = item.Type;
      switch (itemType) {
        case 'TvChannel':
        case 'Program':
          return false;
        default:
          break;
      }
      var mediaType = item.MediaType;
      return mediaType === 'Video';
    },
    normalizeMediaStreamForDisplay: function (item, mediaSource, stream) {
      stream = Object.assign({}, stream);
      if (stream.Type === 'Subtitle') {
        if (item.MediaType === 'Audio') {
          stream.SubtitleType = 'Lyrics';
        }
      }
      if (stream.Type !== 'MediaStream') {
        stream.StreamType = stream.Type;
        stream.Type = 'MediaStream';
      }
      stream.ServerId = item.ServerId;
      stream.ItemId = item.Id;
      stream.MediaSourceId = mediaSource.Id;
      return stream;
    }
  };
});
