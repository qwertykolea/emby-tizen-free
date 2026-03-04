define(["exports", "./lazyloader-intersectionobserver.js"], function (_exports, _lazyloaderIntersectionobserver) {
  Object.defineProperty(_exports, "__esModule", {
    value: true
  });
  _exports.default = void 0;
  /* jshint module: true */

  var supportsNativeLazyLoading = 'loading' in HTMLImageElement.prototype;
  if (!supportsNativeLazyLoading) {
    require(['css!modules/lazyloader/lazyimageloader.css']);
  }
  function fillImage(elem) {
    if (supportsNativeLazyLoading) {
      return;
    }
    if (elem.tagName === "IMG") {
      elem.setAttribute("src", elem.getAttribute('data-src'));
      elem.removeAttribute("data-src");
      return;
    }
    elem.classList.remove('lazy');
  }
  function lazyChildren(elem) {
    if (!supportsNativeLazyLoading) {
      _lazyloaderIntersectionobserver.default.lazyChildren(elem, fillImage);
    }
  }
  var _default = _exports.default = {
    lazyChildren: lazyChildren
  };
});
