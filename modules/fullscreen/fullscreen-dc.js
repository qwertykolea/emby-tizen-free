define(["./../dom.js", "./../common/servicelocator.js"], function (_dom, _servicelocator) {
  /* jshint module: true */

  function isTargetValid(target) {
    if (target.closest('BUTTON,INPUT,TEXTAREA')) {
      return false;
    }
    return true;
  }
  _dom.default.addEventListener(document.querySelector('.skinHeader'), 'dblclick', function (e) {
    if (isTargetValid(e.target)) {
      if (_servicelocator.fullscreenManager.isFullScreen()) {
        _servicelocator.fullscreenManager.exitFullscreen();
      } else {
        _servicelocator.fullscreenManager.requestFullscreen();
      }
    }
  }, {
    passive: true
  });
});
