define(["exports"], function (_exports) {
  Object.defineProperty(_exports, "__esModule", {
    value: true
  });
  _exports.default = void 0;
  /* jshint module: true */

  var currentId = 0;
  var PlaylistItemPrefix = "playlistItem";
  function addUniquePlaylistItemId(item) {
    if (!item.PlaylistItemId) {
      item.PlaylistItemId = PlaylistItemPrefix + currentId;
      currentId++;
    }
  }
  function findPlaylistIndex(playlistItemId, list) {
    for (var i = 0, length = list.length; i < length; i++) {
      if (list[i].PlaylistItemId === playlistItemId) {
        return i;
      }
    }
    return -1;
  }
  function PlayQueueManager() {
    this.reset();
  }
  PlayQueueManager.prototype.getPlaylistResult = function (options) {
    var startIndex;
    var limit;
    if (options) {
      startIndex = options.StartIndex;
      limit = options.Limit;
    }
    var original = this._playlist;
    var total = original.length;
    var playlist = original.slice(startIndex || 0);
    if (limit && playlist.length > limit) {
      playlist.length = limit;
    }
    return {
      Items: playlist,
      TotalRecordCount: total
    };
  };
  PlayQueueManager.prototype.getPlaylist = function () {
    return this._playlist.slice(0);
  };
  PlayQueueManager.prototype.setPlaylist = function (items) {
    items = items.slice(0);
    for (var i = 0, length = items.length; i < length; i++) {
      addUniquePlaylistItemId(items[i]);
    }
    this._currentPlaylistItemId = null;
    this._currentPlaylistIndex = -1;
    this._playlist = items;
    this._repeatMode = 'RepeatNone';
    this._shuffle = false;
  };
  PlayQueueManager.prototype.queue = function (items) {
    for (var i = 0, length = items.length; i < length; i++) {
      addUniquePlaylistItemId(items[i]);
      this._playlist.push(items[i]);
    }
  };
  function arrayInsertAt(destArray, pos, arrayToInsert) {
    var args = [];
    args.push(pos); // where to insert
    args.push(0); // nothing to remove
    args = args.concat(arrayToInsert); // add on array to insert
    destArray.splice.apply(destArray, args); // splice it in
  }
  PlayQueueManager.prototype.queueNext = function (items) {
    for (var i = 0, length = items.length; i < length; i++) {
      addUniquePlaylistItemId(items[i]);
    }
    var currentIndex = this.getCurrentPlaylistIndex();
    if (currentIndex === -1) {
      currentIndex = this._playlist.length;
    } else {
      currentIndex++;
    }
    arrayInsertAt(this._playlist, currentIndex, items);
  };
  PlayQueueManager.prototype.getCurrentPlaylistLength = function () {
    return this._playlist.length;
  };
  PlayQueueManager.prototype.getCurrentPlaylistIndex = function () {
    return this._currentPlaylistIndex;
  };
  PlayQueueManager.prototype.getCurrentItem = function () {
    var index = this._currentPlaylistIndex;
    return index === -1 ? null : this._playlist[index];
  };
  PlayQueueManager.prototype.getCurrentPlaylistItemId = function () {
    return this._currentPlaylistItemId;
  };
  PlayQueueManager.prototype.setPlaylistState = function (playlistItemId, playlistIndex) {
    console.log('PlayQueueManager.setPlaylistState: playlistItemId: ' + playlistItemId + ', playlistIndex: ' + playlistIndex);
    this._currentPlaylistItemId = playlistItemId;
    if (playlistIndex == null) {
      this.refreshPlaylistIndex(playlistItemId);
    } else {
      this._currentPlaylistIndex = playlistIndex;
    }
  };
  PlayQueueManager.prototype.refreshPlaylistIndex = function (playlistItemId) {
    this._currentPlaylistIndex = findPlaylistIndex(playlistItemId || this._currentPlaylistItemId, this._playlist);
  };
  PlayQueueManager.prototype.setPlaylistIndex = function (playlistIndex) {
    if (playlistIndex < 0) {
      this.setPlaylistState(null);
    } else {
      this.setPlaylistState(this._playlist[playlistIndex].PlaylistItemId);
    }
  };
  PlayQueueManager.prototype.removeFromPlaylist = function (playlistItemIds) {
    var playlist = this.getPlaylist();
    if (playlist.length <= playlistItemIds.length) {
      return {
        result: 'empty'
      };
    }
    var currentPlaylistItemId = this.getCurrentPlaylistItemId();
    var isCurrentIndex = playlistItemIds.indexOf(currentPlaylistItemId) !== -1;
    this._playlist = playlist.filter(function (item) {
      return !playlistItemIds.includes(item.PlaylistItemId);
    });
    this.refreshPlaylistIndex();
    return {
      result: 'removed',
      isCurrentIndex: isCurrentIndex
    };
  };
  function moveInArray(array, from, to) {
    array.splice(to, 0, array.splice(from, 1)[0]);
  }
  PlayQueueManager.prototype.movePlaylistItem = function (playlistItemId, newIndex) {
    var playlist = this.getPlaylist();
    var oldIndex;
    for (var i = 0, length = playlist.length; i < length; i++) {
      if (playlist[i].PlaylistItemId === playlistItemId) {
        oldIndex = i;
        break;
      }
    }
    if (oldIndex === -1 || oldIndex === newIndex) {
      return {
        result: 'noop'
      };
    }
    if (newIndex >= playlist.length) {
      throw new Error('newIndex out of bounds');
    }
    moveInArray(playlist, oldIndex, newIndex);
    this._playlist = playlist;
    this.refreshPlaylistIndex();
    return {
      result: 'moved',
      playlistItemId: playlistItemId,
      oldIndex: oldIndex,
      newIndex: newIndex
    };
  };
  function shuffle(array) {
    var currentIndex = array.length;

    // While there remain elements to shuffle...
    while (currentIndex !== 0) {
      // Pick a remaining element...
      var randomIndex = Math.floor(Math.random() * currentIndex);
      currentIndex--;

      // And swap it with the current element.
      var _ref = [array[randomIndex], array[currentIndex]];
      array[currentIndex] = _ref[0];
      array[randomIndex] = _ref[1];
    }
  }
  function compareItemsDefault(a, b) {
    var aId = a.PlayQueueOriginalIndex;
    var bId = b.PlayQueueOriginalIndex;
    if (aId === bId) {
      return 0;
    }
    if (aId == null) {
      return 1;
    }
    if (bId == null) {
      return -1;
    }
    return bId > aId ? -1 : 1;
  }
  PlayQueueManager.prototype.reset = function () {
    console.log('PlayQueueManager reset');
    this._playlist = [];
    this._currentPlaylistItemId = null;
    this._currentPlaylistIndex = -1;
    this._repeatMode = 'RepeatNone';
    this._shuffle = false;
  };
  PlayQueueManager.prototype.setRepeatMode = function (value) {
    this._repeatMode = value;
  };
  PlayQueueManager.prototype.getRepeatMode = function () {
    return this._repeatMode;
  };
  function setOriginalIndexes(items) {
    var startValue = 0;
    for (var i = 0, length = items.length; i < length; i++) {
      items[i].PlayQueueOriginalIndex = startValue;
      startValue++;
    }
  }
  PlayQueueManager.prototype.setShuffle = function (value) {
    if (this._shuffle === value) {
      return;
    }
    this._shuffle = value;
    var currentPlaylistItemId = this.getCurrentPlaylistItemId();
    var items = this._playlist;
    if (value) {
      setOriginalIndexes(items);
      shuffle(items);
      var index = findPlaylistIndex(currentPlaylistItemId, items);
      if (index > 0) {
        var firstItem = items[index];
        var item = items[0];
        items[0] = firstItem;
        items[index] = item;
        this._currentPlaylistIndex = 0;
      } else {
        this.refreshPlaylistIndex(currentPlaylistItemId);
      }
    } else {
      items.sort(compareItemsDefault);
      this.refreshPlaylistIndex(currentPlaylistItemId);
    }
  };
  PlayQueueManager.prototype.getShuffle = function () {
    return this._shuffle;
  };
  PlayQueueManager.prototype.getNextItemInfo = function () {
    var newIndex;
    var playlist = this.getPlaylist();
    var playlistLength = playlist.length;
    switch (this.getRepeatMode()) {
      case 'RepeatOne':
        newIndex = this.getCurrentPlaylistIndex();
        break;
      case 'RepeatAll':
        newIndex = this.getCurrentPlaylistIndex() + 1;
        if (newIndex >= playlistLength) {
          newIndex = 0;
        }
        break;
      default:
        newIndex = this.getCurrentPlaylistIndex() + 1;
        break;
    }
    if (newIndex < 0 || newIndex >= playlistLength) {
      return null;
    }
    var item = playlist[newIndex];
    if (!item) {
      return null;
    }
    return {
      item: item,
      index: newIndex
    };
  };
  var _default = _exports.default = PlayQueueManager;
});
