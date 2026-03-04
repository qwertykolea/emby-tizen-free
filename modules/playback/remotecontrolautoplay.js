define(["./../common/playback/playbackmanager.js", "./../emby-apiclient/events.js"], function (_playbackmanager, _events) {
  /* jshint module: true */

  function transferPlayback(oldPlayer, newPlayer) {
    console.log('transferPlayback');
    var state = _playbackmanager.default.getPlayerState(oldPlayer);
    if (state.IsBackgroundPlayback) {
      return _playbackmanager.default.stop(oldPlayer);
    }
    var item = state.NowPlayingItem;
    if (!item) {
      console.log('aborting transferPlayback because item is null');
      return;
    }
    var playState = state.PlayState || {};
    var resumePositionTicks = playState.PositionTicks || 0;
    console.log('stopping player');
    return _playbackmanager.default.stop(oldPlayer).then(function () {
      console.log('player stopped');
      _playbackmanager.default.play({
        ids: [item.Id],
        serverId: item.ServerId,
        startPositionTicks: resumePositionTicks
      }, newPlayer);
    });
  }
  _events.default.on(_playbackmanager.default, 'playerchange', function (e, newPlayer, newTarget, oldPlayer) {
    if (!oldPlayer) {
      //console.log('Skipping remote control autoplay because old player is null');
      return;
    }
    if (!newPlayer) {
      console.log('Skipping remote control autoplay because new player is null');
      return;
    }
    if (oldPlayer.isLocalPlayer && newPlayer.isLocalPlayer) {
      console.log('Skipping remote control autoplay because both old and new players are local');
      return;
    }
    if (newPlayer.isLocalPlayer) {
      console.log('Skipping remote control autoplay because newPlayer is a local player');
      return;
    }
    return transferPlayback(oldPlayer, newPlayer);
  });
});
