define(["./../common/playback/playbackmanager.js", "./../emby-apiclient/connectionmanager.js", "./../emby-apiclient/events.js", "./../common/itemmanager/itemmanager.js"], function (_playbackmanager, _connectionmanager, _events, _itemmanager) {
  /* jshint module: true */

  // Reports media playback to the device for lock screen control

  var currentPlayer;
  function seriesImageUrl(item, options) {
    if (item.Type !== 'Episode') {
      return null;
    }
    if (!options) {
      options = {};
    }
    options.type = options.type || "Primary";
    if (options.type === 'Primary') {
      if (item.SeriesPrimaryImageTag) {
        options.tag = item.SeriesPrimaryImageTag;
        return _connectionmanager.default.getApiClient(item).getImageUrl(item.SeriesId, options);
      }
    }
    if (options.type === 'Thumb') {
      if (item.ParentThumbImageTag) {
        options.tag = item.ParentThumbImageTag;
        return _connectionmanager.default.getApiClient(item).getImageUrl(item.ParentThumbItemId, options);
      }
    }
    return null;
  }
  function imageUrl(item, options) {
    if (!options) {
      options = {};
    }
    options.type = options.type || "Primary";
    if (item.ImageTags && item.ImageTags[options.type]) {
      options.tag = item.ImageTags[options.type];
      return _connectionmanager.default.getApiClient(item).getImageUrl(item.Id, options);
    }
    if (item.AlbumId && item.AlbumPrimaryImageTag) {
      options.tag = item.AlbumPrimaryImageTag;
      return _connectionmanager.default.getApiClient(item).getImageUrl(item.AlbumId, options);
    }
    return null;
  }
  function pushImageUrl(item, height, list) {
    var imageOptions = {
      height: height
    };
    var url = seriesImageUrl(item, imageOptions) || imageUrl(item, imageOptions);
    if (url) {
      list.push({
        src: url,
        sizes: height + 'x' + height
      });
    }
  }
  function getImageUrls(item) {
    var list = [];
    pushImageUrl(item, 96, list);
    pushImageUrl(item, 128, list);
    pushImageUrl(item, 192, list);
    pushImageUrl(item, 256, list);
    pushImageUrl(item, 384, list);
    pushImageUrl(item, 512, list);
    return list;
  }
  function updatePlayerState(player, state, eventName) {
    var item = state.NowPlayingItem;
    if (!item) {
      hideMediaControls();
      return;
    }
    if (item.MediaType !== 'Video' && item.MediaType !== 'Audio') {
      hideMediaControls();
      return;
    }
    var title = _itemmanager.default.getDisplayName(item, {});
    var albumArtist;
    if (item.AlbumArtists && item.AlbumArtists[0]) {
      albumArtist = item.AlbumArtists[0].Name;
    }
    var artist;
    if (item.ArtistItems) {
      if (item.ArtistItems.length) {
        artist = item.ArtistItems[0].Name;
      }
    } else {
      artist = item.SeriesName;
    }
    var album = item.Album || '';
    var itemId = item.Id;

    // Convert to ms
    var duration = parseInt(item.RunTimeTicks ? item.RunTimeTicks / 10000 : 0);
    var playState = state.PlayState || {};
    var currentTime = parseInt(playState.PositionTicks ? playState.PositionTicks / 10000 : 0);
    var isPaused = playState.IsPaused || false;
    var mediaMetadata = {
      title: title,
      album: album,
      artwork: getImageUrls(item),
      currentTime: currentTime,
      duration: duration,
      paused: isPaused,
      itemId: itemId,
      mediaType: item.MediaType,
      trackNumber: item.IndexNumber
    };
    if (artist) {
      mediaMetadata.artist = artist;
    }
    if (albumArtist) {
      mediaMetadata.albumArtist = albumArtist;
    }

    //console.log('media metadata: ' + JSON.stringify(mediaMetadata));

    navigator.mediaSession.metadata = new MediaMetadata(mediaMetadata);
  }
  function onGeneralEvent(e) {
    var player = this;
    var state = _playbackmanager.default.getPlayerState(player);
    updatePlayerState(player, state, e.type);
  }
  function onStateChanged(e, state) {
    var player = this;
    updatePlayerState(player, state, 'statechange');
  }
  function onPlaybackStart(e, state) {
    var player = this;
    updatePlayerState(player, state, e.type);
  }
  function onPlaybackStopped(e, state) {
    if (!state.NextMediaType) {
      hideMediaControls();
    }
  }
  function releaseCurrentPlayer() {
    if (currentPlayer) {
      _events.default.off(currentPlayer, 'playbackstart', onPlaybackStart);
      _events.default.off(currentPlayer, 'playbackstop', onPlaybackStopped);
      _events.default.off(currentPlayer, 'unpause', onGeneralEvent);
      _events.default.off(currentPlayer, 'pause', onGeneralEvent);
      _events.default.off(currentPlayer, 'statechange', onStateChanged);
      _events.default.off(currentPlayer, 'timeupdate', onGeneralEvent);
      currentPlayer = null;
      hideMediaControls();
    }
  }
  function hideMediaControls() {
    navigator.mediaSession.metadata = null;
  }
  function bindToPlayer(player) {
    releaseCurrentPlayer();
    if (!player) {
      return;
    }
    currentPlayer = player;
    var state = _playbackmanager.default.getPlayerState(player);
    updatePlayerState(player, state, 'init');
    _events.default.on(currentPlayer, 'playbackstart', onPlaybackStart);
    _events.default.on(currentPlayer, 'playbackstop', onPlaybackStopped);
    _events.default.on(currentPlayer, 'unpause', onGeneralEvent);
    _events.default.on(currentPlayer, 'pause', onGeneralEvent);
    _events.default.on(currentPlayer, 'statechange', onStateChanged);
    _events.default.on(currentPlayer, 'timeupdate', onGeneralEvent);
  }
  function execute(name) {
    _playbackmanager.default[name](currentPlayer);
  }

  // data has seekTime and fastSeek options
  function seek(data) {
    if (data.fastSeek) {

      // should we ignore this?
    } else {
      var ticks = data.seekTime * 1000 * 10000;
      _playbackmanager.default.seek(ticks, currentPlayer);
    }
  }
  navigator.mediaSession.setActionHandler('previoustrack', function () {
    execute('previousTrack');
  });
  navigator.mediaSession.setActionHandler('nexttrack', function () {
    execute('nextTrack');
  });
  navigator.mediaSession.setActionHandler('play', function () {
    execute('unpause');
  });
  navigator.mediaSession.setActionHandler('pause', function () {
    execute('pause');
  });

  // Supported in chrome 77, but older versions will throw an error
  try {
    navigator.mediaSession.setActionHandler('stop', function () {
      // When connecting to Chromecast, the browser sends a stop to mediaSession, which we want to ignore and handle with our own code
      if (!_playbackmanager.default.isPairing()) {
        execute('stop');
      }
    });
  } catch (err) {
    console.log(err);
  }

  // Supported in chrome 78, but older versions will throw an error
  try {
    navigator.mediaSession.setActionHandler('seekto', seek);
  } catch (err) {
    console.log(err);
  }
  navigator.mediaSession.setActionHandler('seekbackward', function () {
    execute('rewind');
  });
  navigator.mediaSession.setActionHandler('seekforward', function () {
    execute('fastForward');
  });
  _events.default.on(_playbackmanager.default, 'playerchange', function () {
    bindToPlayer(_playbackmanager.default.getCurrentPlayer());
  });
  bindToPlayer(_playbackmanager.default.getCurrentPlayer());
});
