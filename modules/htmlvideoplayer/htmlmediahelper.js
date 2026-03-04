define(["exports", "./../browser.js"], function (_exports, _browser) {
  Object.defineProperty(_exports, "__esModule", {
    value: true
  });
  _exports.default = void 0;
  /* jshint module: true */

  function canPlayNativeHls() {
    var media = document.createElement('video');
    if (media.canPlayType('application/x-mpegURL').replace(/no/, '') || media.canPlayType('application/vnd.apple.mpegURL').replace(/no/, '')) {
      return true;
    }
    return false;
  }
  function canPlayHlsWithMSE() {
    if (globalThis.MediaSource != null) {
      return true;
    }
    if (globalThis.ManagedMediaSource != null) {
      return true;
    }
    return false;
  }
  function enableHlsJsPlayer(runTimeTicks, mediaType) {
    if (!canPlayHlsWithMSE()) {
      return false;
    }

    // seeing memory errors and crashing unfortunately
    if (globalThis.appMode === 'webos') {
      return false;
    }
    if (canPlayNativeHls()) {
      // Having trouble with chrome's native support and transcoded music
      if (_browser.default.android && mediaType === 'Audio') {
        return true;
      }

      // simple playback should use the native support
      if (runTimeTicks) {
        if (mediaType === 'Audio') {
          return false;
        }
      }
    }
    return true;
  }
  var _default = _exports.default = {
    enableHlsJsPlayer: enableHlsJsPlayer
  };
});
