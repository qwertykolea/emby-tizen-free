define(["exports", "./../emby-apiclient/connectionmanager.js", "./../common/playback/playbackmanager.js", "./../emby-apiclient/events.js"], function (_exports, _connectionmanager, _playbackmanager, _events) {
  Object.defineProperty(_exports, "__esModule", {
    value: true
  });
  _exports.default = void 0;
  /* jshint module: true */

  // Provides player events without needing to track player changes

  function CurrentPlayer() {
    var self = this;
    var player = null;
    this.get = function () {
      return player;
    };
    this.nextTrack = function () {
      if (player) {
        return _playbackmanager.default.nextTrack(player);
      }
      return Promise.reject();
    };
    this.previousTrack = function () {
      if (player) {
        return _playbackmanager.default.previousTrack(player);
      }
      return Promise.reject();
    };
    this.pause = function () {
      if (player) {
        _playbackmanager.default.pause(player);
      }
    };
    this.unpause = function () {
      if (player) {
        _playbackmanager.default.unpause(player);
      }
    };
    this.stop = function () {
      if (player) {
        return _playbackmanager.default.stop(player);
      }
      return Promise.reject();
    };
    this.rewind = function () {
      if (player) {
        return _playbackmanager.default.rewind(player);
      }
      return Promise.reject();
    };
    this.fastForward = function () {
      if (player) {
        return _playbackmanager.default.fastForward(player);
      }
      return Promise.reject();
    };
    this.seek = function (ticks) {
      if (player) {
        return _playbackmanager.default.seek(ticks, player);
      }
      return Promise.reject();
    };
    this.seekable = function () {
      if (player && player.seekable) {
        return player.seekable();
      }
      return false;
    };
    this.duration = function () {
      if (player) {
        return player.duration();
      }
      return 0;
    };
    this.currentTime = function () {
      if (player) {
        return player.currentTime();
      }
      return 0;
    };
    this.paused = function () {
      if (player) {
        return player.paused();
      }
      return false;
    };
    this.getPlayerState = function () {
      if (player) {
        return _playbackmanager.default.getPlayerState(player);
      }
      return null;
    };
    this.isPairing = function () {
      return _playbackmanager.default.isPairing();
    };
    this.getImageUrl = function (serverId, itemId, options) {
      var item = {
        ServerId: serverId
      };
      return _connectionmanager.default.getApiClient(item).getImageUrl(itemId, options);
    };
    function onPlayerEvent(e, state) {
      state = state || self.getPlayerState();
      _events.default.trigger(self, e.type, [state]);
    }
    function onTimeUpdateEvent(e, state) {
      var _state, _state2;
      state = state || self.getPlayerState();
      var durationTicks = ((_state = state) == null || (_state = _state.NowPlayingItem) == null ? void 0 : _state.RunTimeTicks) || 0;
      var positionTicks = ((_state2 = state) == null ? void 0 : _state2.PositionTicks) || 0;
      _events.default.trigger(self, e.type, [positionTicks, durationTicks]);
    }
    function releaseCurrentPlayer() {
      if (player) {
        _events.default.off(player, 'playbackstart', onPlayerEvent);
        _events.default.off(player, 'playbackstop', onPlayerEvent);
        _events.default.off(player, 'unpause', onPlayerEvent);
        _events.default.off(player, 'pause', onPlayerEvent);
        _events.default.off(player, 'statechange', onPlayerEvent);
        _events.default.off(player, 'timeupdate', onTimeUpdateEvent);
        _events.default.trigger(self, 'uninit', [player]);
        player = null;
      }
    }
    function bindToPlayer(newPlayer) {
      releaseCurrentPlayer();
      if (!newPlayer) {
        return;
      }
      player = newPlayer;
      _events.default.on(player, 'playbackstart', onPlayerEvent);
      _events.default.on(player, 'playbackstop', onPlayerEvent);
      _events.default.on(player, 'unpause', onPlayerEvent);
      _events.default.on(player, 'pause', onPlayerEvent);
      _events.default.on(player, 'statechange', onPlayerEvent);
      _events.default.on(player, 'timeupdate', onTimeUpdateEvent);
      _events.default.trigger(self, 'init', [player]);
    }
    _events.default.on(_playbackmanager.default, 'playerchange', function () {
      bindToPlayer(_playbackmanager.default.getCurrentPlayer());
    });
    bindToPlayer(_playbackmanager.default.getCurrentPlayer());
    if (navigator.mediaSession) {
      navigator.mediaSession.metadata = new MediaMetadata({
        title: 'none',
        artist: 'none'
      });
      window.setTimeout(function () {
        return navigator.mediaSession.metadata = null;
      }, 500);
    }
  }
  var _default = _exports.default = new CurrentPlayer();
});
