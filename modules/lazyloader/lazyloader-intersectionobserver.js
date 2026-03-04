define(["exports"], function (_exports) {
  Object.defineProperty(_exports, "__esModule", {
    value: true
  });
  _exports.default = void 0;
  /* jshint module: true */

  function LazyLoader(options) {
    this.options = options;
  }
  LazyLoader.prototype.createObserver = function () {
    var observerOptions = {};
    var options = this.options;
    var loadedCount = 0;
    var callback = options.callback;
    observerOptions.rootMargin = "50%";
    var observerId = 'obs' + Date.now();
    var self = this;
    var observer = new IntersectionObserver(function (entries) {
      for (var j = 0, length2 = entries.length; j < length2; j++) {
        var entry = entries[j];
        var isIntersecting = entry.isIntersecting;
        if (isIntersecting == null) {
          isIntersecting = entry.intersectionRatio > 0;
        }
        if (isIntersecting) {
          // Stop watching and load the image
          var target = entry.target;
          observer.unobserve(target);
          if (!target[observerId]) {
            target[observerId] = 1;
            callback(target);
            loadedCount++;
            if (loadedCount >= self.elementCount) {
              self.destroyObserver();
            }
          }
        }
      }
    }, observerOptions);
    this.observer = observer;
  };
  LazyLoader.prototype.addElements = function (elements) {
    var observer = this.observer;
    if (!observer) {
      this.createObserver();
      observer = this.observer;
    }
    this.elementCount = (this.elementCount || 0) + elements.length;
    for (var i = 0, length = elements.length; i < length; i++) {
      observer.observe(elements[i]);
    }
  };
  LazyLoader.prototype.destroyObserver = function (elements) {
    var observer = this.observer;
    if (observer) {
      observer.disconnect();
      this.observer = null;
    }
  };
  LazyLoader.prototype.destroy = function (elements) {
    this.destroyObserver();
    this.options = null;
  };
  LazyLoader.lazyChildren = function (elem, callback) {
    var elements = elem.getElementsByClassName('lazy');
    if (!elements.length) {
      return;
    }
    var lazyLoader = new LazyLoader({
      callback: callback
    });
    lazyLoader.addElements(elements);
  };
  var _default = _exports.default = LazyLoader;
});
