define(["./emby-apiclient/events.js", "./emby-apiclient/connectionmanager.js", "./common/appsettings.js", "./common/playback/playbackmanager.js"], function (_events, _connectionmanager, _appsettings, _playbackmanager) {
  /* jshint module: true */

  var currentOwnerId;
  var currentPlayer = _playbackmanager.default.getCurrentPlayer();
  function playThemeMedia(items, ownerId) {
    if (items.length) {
      // Stop if a theme song from another ownerId
      // Leave it alone if anything else (e.g user playing a movie)
      if (!currentOwnerId && _playbackmanager.default.isPlaying()) {
        return;
      }
      console.log('thememediaplayer playing theme songs/videos');
      _playbackmanager.default.play({
        items: items,
        fullscreen: false,
        enableRemotePlayers: false
      }).then(function () {
        currentOwnerId = ownerId;
        if (_appsettings.default.repeatThemes()) {
          _playbackmanager.default.setRepeatMode('RepeatAll');
        }
      });
    } else {
      stopIfPlaying();
    }
  }
  function stopIfPlaying() {
    if (currentOwnerId) {
      console.log('thememediaplayer stop');
      _playbackmanager.default.stop();
    }
    currentOwnerId = null;
  }
  var excludeTypes = ['CollectionFolder', 'UserView', 'Program', 'SeriesTimer', 'Timer', 'Person', 'TvChannel', 'Channel', 'User', 'Plugin', 'Device', 'Tag', 'Genre', 'GameGenre', 'MusicGenre', 'Studio', 'Log'];
  function loadThemeMedia(item, signal) {
    if (item.CollectionType) {
      stopIfPlaying();
      return;
    }
    if (excludeTypes.includes(item.Type)) {
      stopIfPlaying();
      return;
    }
    if (!item.ServerId || !item.Id) {
      stopIfPlaying();
      return;
    }
    var apiClient = _connectionmanager.default.getApiClient(item);
    var enableThemeVideos = _appsettings.default.enableThemeVideos();
    apiClient.getThemeMedia(item.Id, {
      UserId: apiClient.getCurrentUserId(),
      InheritFromParent: true,
      EnableThemeSongs: _appsettings.default.enableThemeSongs(),
      EnableThemeVideos: enableThemeVideos
    }, signal).then(function (themeMediaResult) {
      if (signal != null && signal.aborted) {
        return;
      }
      var itemsResult = themeMediaResult.ThemeVideosResult.Items.length ? themeMediaResult.ThemeVideosResult : themeMediaResult.ThemeSongsResult;
      var ownerId = itemsResult.OwnerId;
      if (ownerId !== currentOwnerId) {
        var items = itemsResult.Items;
        playThemeMedia(items, ownerId);
      }
    });
  }
  document.addEventListener('viewshow', function (e) {
    var _e$detail$params;
    if (((_e$detail$params = e.detail.params) == null ? void 0 : _e$detail$params.asDialog) === 'true') {
      return;
    }
    var player = currentPlayer;
    if (player && !player.isLocalPlayer) {
      return;
    }
    if (e.detail.supportsThemeMedia) {
      // Do nothing here, allow it to keep playing
    } else {
      playThemeMedia([], null);
    }
  }, true);
  document.addEventListener('itemshow', function (e) {
    var player = currentPlayer;
    if (player && !player.isLocalPlayer) {
      return;
    }
    var detail = e.detail;
    var item = detail.item;
    if (item != null && item.ServerId) {
      var signal = detail.signal;
      loadThemeMedia(item, signal);
      return;
    }
  }, true);
  document.addEventListener('itemclear', function (e) {
    var player = currentPlayer;
    if (player && !player.isLocalPlayer) {
      return;
    }
    playThemeMedia([], null);
  }, true);
  _events.default.on(_playbackmanager.default, 'playerchange', function (e, player) {
    currentPlayer = player;
  });
  _events.default.on(_playbackmanager.default, 'playqueuestart', function (e, player, state) {
    if (!state.IsBackgroundPlayback) {
      currentOwnerId = null;
    }
  });
});
