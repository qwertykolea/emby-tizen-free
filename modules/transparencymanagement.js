define(["./emby-apiclient/events.js", "./common/playback/playbackmanager.js", "./approuter.js"], function (_events, _playbackmanager, _approuter) {
  /* jshint module: true */

  var currentPlayer;
  function onPlaybackStart(e, state) {
    //console.log('nowplaying event: ' + e.type);

    var player = this;
    onStateChanged.call(player, e, state);
  }
  function refreshFromPlayer(player) {
    var state = _playbackmanager.default.getPlayerState(player);
    onStateChanged.call(player, {
      type: 'init'
    }, state);
  }
  function onStateChanged(event, state) {
    var _state$NowPlayingItem;
    //console.log('nowplaying event: ' + e.type);
    var player = this;
    if (player.isLocalPlayer && ((_state$NowPlayingItem = state.NowPlayingItem) == null ? void 0 : _state$NowPlayingItem.MediaType) === 'Video') {
      if (state.IsBackgroundPlayback) {
        _approuter.default.setTransparency('backdrop');
      }
    } else {
      _approuter.default.setTransparency('none');
    }
  }
  function onPlaybackStopped(e, state) {
    //console.log('nowplaying event: ' + e.type);

    // always do this, even in between playback items to restore the backdrop from one to the next
    _approuter.default.setTransparency('none');
  }
  function releaseCurrentPlayer() {
    var player = currentPlayer;
    if (player) {
      _events.default.off(player, 'playbackstart', onPlaybackStart);
      _events.default.off(player, 'statechange', onPlaybackStart);
      _events.default.off(player, 'playbackstop', onPlaybackStopped);
      currentPlayer = null;
    }
  }
  function bindToPlayer(player) {
    if (player === currentPlayer) {
      return;
    }
    releaseCurrentPlayer();
    currentPlayer = player;
    if (!player) {
      return;
    }
    refreshFromPlayer(player);
    _events.default.on(player, 'playbackstart', onPlaybackStart);
    _events.default.on(player, 'statechange', onPlaybackStart);
    _events.default.on(player, 'playbackstop', onPlaybackStopped);
  }
  _events.default.on(_playbackmanager.default, 'playerchange', function (e, player) {
    bindToPlayer(player);
  });
  bindToPlayer(_playbackmanager.default.getCurrentPlayer());
});
