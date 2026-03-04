define(["exports", "./../emby-apiclient/events.js", "./../dom.js"], function (_exports, _events, _dom) {
  Object.defineProperty(_exports, "__esModule", {
    value: true
  });
  _exports.default = void 0;
  /* jshint module: true */

  function fullscreenManager() {}
  fullscreenManager.prototype.requestFullscreen = function (element) {
    element = element || document.documentElement;
    if (element.requestFullscreen) {
      return element.requestFullscreen({
        navigationUI: 'hide'
      });
    } else if (element.mozRequestFullScreen) {
      element.mozRequestFullScreen();
      return Promise.resolve();
    } else if (element.webkitRequestFullscreen) {
      element.webkitRequestFullscreen();
      return Promise.resolve();
    } else if (element.msRequestFullscreen) {
      element.msRequestFullscreen();
      return Promise.resolve();
    }

    // Hack - This is only available for video elements in ios safari
    if (element.tagName !== 'VIDEO') {
      element = document.querySelector('video') || element;
    }
    if (element.webkitEnterFullscreen) {
      element.webkitEnterFullscreen();
    }
    return Promise.resolve();
  };
  fullscreenManager.prototype.exitFullscreen = function () {
    if (document.exitFullscreen) {
      return document.exitFullscreen();
    } else if (document.mozCancelFullScreen) {
      document.mozCancelFullScreen();
    } else if (document.webkitExitFullscreen) {
      document.webkitExitFullscreen();
    } else if (document.webkitCancelFullscreen) {
      document.webkitCancelFullscreen();
    } else if (document.msExitFullscreen) {
      document.msExitFullscreen();
    }
    return Promise.resolve();
  };
  fullscreenManager.prototype.isFullScreen = function () {
    return document.fullscreen || document.mozFullScreen || document.webkitIsFullScreen || document.msFullscreenElement ? true : false;
  };
  var manager = new fullscreenManager();
  function onFullScreenChange() {
    _events.default.trigger(manager, 'fullscreenchange');
  }
  _dom.default.addEventListener(document, 'fullscreenchange', onFullScreenChange, {
    passive: true
  });
  if ('onwebkitfullscreenchange' in document) {
    _dom.default.addEventListener(document, 'webkitfullscreenchange', onFullScreenChange, {
      passive: true
    });
  }
  var _default = _exports.default = manager;
});
