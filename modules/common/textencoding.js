define(["exports"], function (_exports) {
  Object.defineProperty(_exports, "__esModule", {
    value: true
  });
  _exports.default = void 0;
  /* jshint module: true */

  var tempDiv;
  var doc = typeof document === 'undefined' ? null : document;

  /**
   * Escapes all potentially dangerous characters, so that the
   * resulting string can be safely inserted into attribute or
   * element text.
   * @param value
   * @returns {string} escaped text
   */
  function htmlEncode(value) {
    var div = tempDiv;
    if (!div) {
      if (doc) {
        div = doc.createElement('div');
        tempDiv = div;
      } else {
        // need a dom-less way to do this
        return value;
      }
    }
    div.textContent = value;
    return div.innerHTML;
  }
  var _default = _exports.default = {
    htmlEncode: htmlEncode
  };
});
