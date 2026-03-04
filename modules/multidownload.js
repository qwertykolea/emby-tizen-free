define(["exports"], function (_exports) {
  Object.defineProperty(_exports, "__esModule", {
    value: true
  });
  _exports.default = _default;
  /* jshint module: true */

  function sameDomain(url) {
    var a = document.createElement('a');
    a.href = url;
    return location.hostname === a.hostname && location.protocol === a.protocol;
  }
  function download(url) {
    var a = document.createElement('a');
    a.download = '';
    a.href = url;
    // firefox doesn't support `a.click()`...
    a.dispatchEvent(new MouseEvent('click'));
  }
  function _default(urls) {
    if (!urls) {
      throw new Error('`urls` required');
    }
    var delay = 0;
    urls.forEach(function (url) {
      // the download init has to be sequential for firefox if the urls are not on the same domain
      if (!sameDomain(url)) {
        return setTimeout(download.bind(null, url), 100 * ++delay);
      }
      download(url);
    });
  }
});
