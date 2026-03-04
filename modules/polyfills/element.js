/* jshint module: true */

if (!Element.prototype.matches) {
  Element.prototype.matches = Element.prototype.matchesSelector || Element.prototype.mozMatchesSelector || Element.prototype.msMatchesSelector || Element.prototype.oMatchesSelector || Element.prototype.webkitMatchesSelector || function (s) {
    var matches = (this.document || this.ownerDocument).querySelectorAll(s);
    var i = matches.length;
    while (--i >= 0 && matches.item(i) !== this) {/* comment to satisfy esline no-empty */}
    return i > -1;
  };
}
if (!Element.prototype.closest) {
  Element.prototype.closest = function (s) {
    var el = this;
    do {
      if (Element.prototype.matches.call(el, s)) {
        return el;
      }
      el = el.parentElement || el.parentNode;
    } while (el !== null && el.nodeType === 1);
    return null;
  };
}
if (!Element.prototype.remove) {
  Element.prototype.remove = function (s) {
    var parentNode = this.parentNode;
    if (parentNode) {
      parentNode.removeChild(this);
    }
  };
}
if (!Element.prototype.replaceChildren) {
  Element.prototype.replaceChildren = function (addNodes) {
    while (this.lastChild) {
      this.removeChild(this.lastChild);
    }
    if (addNodes) {
      this.append(addNodes);
    }
  };
}
if (!Element.prototype.append) {
  Element.prototype.append = function () {
    // https://www.codeguage.com/courses/js/html-dom-append-polyfill-exercise
    var fragment = document.createDocumentFragment();
    for (var i = 0, len = arguments.length; i < len; i++) {
      fragment.appendChild(arguments[i] instanceof Node ? arguments[i] : document.createTextNode(String(arguments[i])));
    }

    // Since this method is append(), dump fragment into the
    // last-child position of the calling element node.
    this.appendChild(fragment);
  };
}
