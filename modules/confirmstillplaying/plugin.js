define(["exports", "./../common/globalize.js", "./../emby-apiclient/events.js", "./../common/usersettings/usersettings.js", "./../common/inputmanager.js", "./../common/playback/playbackmanager.js", "./../input/mouse.js", "./../common/methodtimer.js"], function (_exports, _globalize, _events, _usersettings, _inputmanager, _playbackmanager, _mouse, _methodtimer) {
  Object.defineProperty(_exports, "__esModule", {
    value: true
  });
  _exports.default = _default;
  /* jshint module: true */

  var IsDebug = false;
  function showConfirm(options) {
    return Emby.importModule('./modules/common/dialogs/confirm.js').then(function (confirm) {
      return confirm(options);
    });
  }
  function enabled() {
    return _usersettings.default.stillWatchingTimeMs() > 0;
  }
  var isDialogOpen = false;
  function confirmStillPlaying() {
    if (isDialogOpen) {
      return Promise.resolve();
    }
    var minIdleTime = IsDebug ? 10000 : _usersettings.default.stillWatchingTimeMs();
    if (minIdleTime <= 0) {
      return Promise.resolve();
    }
    if (_inputmanager.default.idleTime() < minIdleTime) {
      return Promise.resolve();
    }
    var now = Date.now();
    if (now - _mouse.default.lastMouseInputTime() < minIdleTime) {
      return Promise.resolve();
    }
    isDialogOpen = true;
    return showConfirm({
      title: null,
      text: _globalize.default.translate('AreYouStillWatching'),
      confirmText: _globalize.default.translate('HeaderContinueWatching'),
      cancelText: _globalize.default.translate('Stop'),
      // to able to differentiate between pressing cancel or other means of dismissing the confirm dialog
      // the better choice would have been the lower level dialog to avoid this
      cancelResult: 'cancel',
      timeout: 60000
    }).then(function () {
      isDialogOpen = false;
    }, function (result) {
      isDialogOpen = false;
      console.log('confirm still playing result: ' + result);
      if (result === 'cancel' || result === '_timeout') {
        _playbackmanager.default.stop();
      }
    });
  }
  function _default() {
    var self = this;
    self.name = 'Are You Still Watching?';
    self.type = 'preplayintercept';
    self.id = 'stillplaying';
    self.intercept = function (options) {
      clearConfirmTimer();

      // Don't care about any other types
      if (options.mediaType !== 'Video') {
        return Promise.resolve();
      }

      // Don't care about video backdrops or any kind of non-fullscreen playback
      if (!options.fullscreen) {
        return Promise.resolve();
      }
      return confirmStillPlaying();
    };
    var confirmTimeout;
    function onPlaybackStart(e, player, state) {
      var item = state.NowPlayingItem || {};
      if (item.MediaType === 'Video' && player.isLocalPlayer && !player.isExternalPlayer && enabled()) {
        resetConfirmTimer();
      } else {
        clearConfirmTimer();
      }
    }
    function resetConfirmTimer() {
      clearConfirmTimer();
      confirmTimeout = new _methodtimer.default({
        onInterval: onConfirmTimeout,
        timeoutMs: IsDebug ? 3000 : 30000,
        type: 'interval'
      });
    }
    function clearConfirmTimer() {
      var timeout = confirmTimeout;
      if (timeout) {
        timeout.destroy();
        confirmTimeout = null;
      }
    }
    function onConfirmTimeout() {
      confirmStillPlaying();
    }
    _events.default.on(_playbackmanager.default, 'playbackstart', onPlaybackStart);
    _events.default.on(_playbackmanager.default, 'playbackstop', clearConfirmTimer);
  }
});
