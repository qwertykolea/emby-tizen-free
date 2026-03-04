define(["exports", "./playbackmanager.js", "./../../emby-apiclient/apiclient.js"], function (_exports, _playbackmanager, _apiclient) {
  Object.defineProperty(_exports, "__esModule", {
    value: true
  });
  _exports.default = void 0;
  /* jshint module: true */

  function validateFeature(feature, options) {
    return Emby.importModule('./modules/registrationservices/registrationservices.js').then(function (registrationServices) {
      return registrationServices.validateFeature(feature, options);
    });
  }
  function validatePlayback(options) {
    var feature = 'playback';
    if (options.item && (options.item.Type === 'TvChannel' || options.item.Type === 'Recording')) {
      feature = 'livetv';
    }
    if (feature === 'playback') {
      var player = _playbackmanager.default.getCurrentPlayer();
      if (player && !player.isLocalPlayer) {
        return Promise.resolve();
      }
    }
    return validateFeature(feature, options).then(function (result) {
      if (result && result.enableTimeLimit) {
        startAutoStopTimer();
      }
    });
  }
  var autoStopTimeout;
  function startAutoStopTimer() {
    stopAutoStopTimer();
    autoStopTimeout = setTimeout(onAutoStopTimeout, 63000);
  }
  function onAutoStopTimeout() {
    stopAutoStopTimer();
    _playbackmanager.default.stop();
  }
  function stopAutoStopTimer() {
    var timeout = autoStopTimeout;
    if (timeout) {
      clearTimeout(timeout);
      autoStopTimeout = null;
    }
  }
  function PlaybackValidation() {
    this.name = 'Playback validation';
    this.type = 'preplayintercept';
    this.id = 'playbackvalidation';
    this.order = -1;
  }
  PlaybackValidation.prototype.intercept = function (options) {
    // Don't care about video backdrops, or theme music or any kind of non-fullscreen playback
    if (!options.fullscreen) {
      return Promise.resolve();
    }
    if (options.item && _apiclient.default.isLocalItem(options.item)) {
      return Promise.resolve();
    }
    return validatePlayback(options);
  };
  var _default = _exports.default = PlaybackValidation;
});
