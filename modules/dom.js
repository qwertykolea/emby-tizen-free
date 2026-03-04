define(["exports", "./common/textencoding.js", "./browser.js"], function (_exports, _textencoding, _browser) {
  Object.defineProperty(_exports, "__esModule", {
    value: true
  });
  _exports.default = void 0;
  /* jshint module: true */

  var supportsCaptureOption = false;
  try {
    var opts = Object.defineProperty({}, 'capture', {
      // eslint-disable-next-line
      get: function () {
        supportsCaptureOption = true;
      }
    });
    window.addEventListener("test", null, opts);
  } catch (e) {}
  function addEventListenerWithOptions(target, type, handler, options) {
    var optionsOrCapture = supportsCaptureOption ? options : options.capture;
    target.addEventListener(type, handler, optionsOrCapture);
  }
  function removeEventListenerWithOptions(target, type, handler, options) {
    var optionsOrCapture = supportsCaptureOption ? options : options.capture;
    target.removeEventListener(type, handler, optionsOrCapture);
  }
  var windowSize;
  var windowSizeEventsBound;
  function clearWindowSize() {
    windowSize = null;
  }
  function getWindowSize() {
    if (!windowSize) {
      var win = window;
      windowSize = {
        innerHeight: win.innerHeight,
        innerWidth: win.innerWidth
      };
      console.log('dom getWindowSize');
      if (!windowSizeEventsBound) {
        windowSizeEventsBound = true;
        addEventListenerWithOptions(window, "orientationchange", clearWindowSize, {
          passive: true
        });
        addEventListenerWithOptions(window, 'resize', clearWindowSize, {
          passive: true
        });
      }
    }
    return windowSize;
  }
  var _animationEvent;
  function whichAnimationEvent() {
    if (_animationEvent) {
      return _animationEvent;
    }
    var el = document.createElement("div");
    var animations = {
      "animation": "animationend",
      "OAnimation": "oAnimationEnd",
      "MozAnimation": "animationend",
      "WebkitAnimation": "webkitAnimationEnd"
    };
    for (var t in animations) {
      if (el.style[t] !== undefined) {
        _animationEvent = animations[t];
        return animations[t];
      }
    }
    _animationEvent = 'animationend';
    return _animationEvent;
  }
  function whichAnimationCancelEvent() {
    return whichAnimationEvent().replace('animationend', 'animationcancel').replace('AnimationEnd', 'AnimationCancel');
  }
  var _transitionEvent;
  function whichTransitionEvent() {
    if (_transitionEvent) {
      return _transitionEvent;
    }
    var el = document.createElement("div");
    var transitions = {
      "transition": "transitionend",
      "OTransition": "oTransitionEnd",
      "MozTransition": "transitionend",
      "WebkitTransition": "webkitTransitionEnd"
    };
    for (var t in transitions) {
      if (el.style[t] !== undefined) {
        _transitionEvent = transitions[t];
        return transitions[t];
      }
    }
    _transitionEvent = 'transitionend';
    return _transitionEvent;
  }
  function supportsEventListenerOnce() {
    return supportsCaptureOption;
  }
  function removeAttributes(elem) {
    var whitelist = [];
    var attributes = elem.attributes;
    var i = attributes.length;
    while (i--) {
      var attr = attributes[i];
      if (whitelist.indexOf(attr.name) === -1) {
        elem.removeAttributeNode(attr);
      }
    }
  }
  function stripScriptsWithDom(s) {
    var div = document.createElement('div');
    div.innerHTML = s;
    var scripts = div.getElementsByTagName('script');
    var i = scripts.length;
    while (i--) {
      scripts[i].remove();
    }
    var elems = div.getElementsByTagName("*");
    var length;
    for (i = 0, length = elems.length; i < length; i++) {
      //Remove all onmouseover, onmouseout, onclick eventhandlers from element           
      var elem = elems[i];
      removeAttributes(elem);
      if (elem.tagName === "A") {
        //if the href values of the link tags start with javascript:  then set href="#""
        if (elem.href.indexOf('javascript') === 0) {
          elem.setAttribute("href", "#");
        }
      }
    }
    return div.innerHTML;
  }
  function stripScripts(s) {
    try {
      return stripScriptsWithDom(s);
    } catch (err) {
      return _textencoding.default.htmlEncode(s);
    }
  }
  var _supportsPointerTypeInClickEvent = false;
  (function () {
    // on iOS 18.2, pointerType in the click event is always mouse, even with touch input
    if (!_browser.default.iOS && !_browser.default.osx) {
      var testBtn = document.createElement('button');
      testBtn.addEventListener('click', function (e) {
        _supportsPointerTypeInClickEvent = 'pointerType' in e;
      });
      testBtn.click();
    }
  })();
  var isNativeAndroid = globalThis.appMode === 'android';
  var allowBackdropFilter = function () {
    var cores = navigator.hardwareConcurrency || 4;
    if (cores < 4) {
      return false;
    }
    var deviceMemory = navigator.deviceMemory || 2;
    if (deviceMemory < 2) {
      return false;
    }

    // too much of a performance penalty
    if (_browser.default.android) {
      return false;
    }

    // too much of a performance penalty
    if (_browser.default.chrome) {
      return false;
    }

    // newer tizen models support the css feature, but it ends up rendering transparent
    if (_browser.default.tizen) {
      return false;
    }
    if (typeof AndroidAppHost !== 'undefined' && !AndroidAppHost.allowBackdropFilter()) {
      return false;
    }

    // this is purely a way of filtering out older devices
    if (!supportsEventListenerOnce()) {
      return false;
    }
    var platform = (navigator.platform || '').toLowerCase();
    var lowProfileDevice = isNativeAndroid && (cores < 4 || deviceMemory < 2 || platform.includes('armv7'));
    if (lowProfileDevice) {
      return false;
    }
    return true;
  }();
  var allowFocusScaling = function () {
    var cores = navigator.hardwareConcurrency || 6;
    if (cores < 6) {
      return false;
    }
    var deviceMemory = navigator.deviceMemory || 4;
    if (deviceMemory < 4) {
      return false;
    }
    if (!document.documentElement.animate) {
      // this is purely a way of filtering out older devices
      return false;
    }

    // this is purely a way of filtering out older devices
    if (!CSS.supports('display', 'flow-root')) {
      return false;
    }
    if (isNativeAndroid) {
      // hate having this platform check here but there seems to be a really high performance penalty in the android webview
      return false;
    }
    return true;
  }();
  var _default = _exports.default = {
    addEventListener: addEventListenerWithOptions,
    removeEventListener: removeEventListenerWithOptions,
    getWindowSize: getWindowSize,
    whichTransitionEvent: whichTransitionEvent,
    whichAnimationEvent: whichAnimationEvent,
    whichAnimationCancelEvent: whichAnimationCancelEvent,
    htmlEncode: _textencoding.default.htmlEncode,
    supportsEventListenerOnce: supportsEventListenerOnce,
    stripScripts: stripScripts,
    supportsPointerTypeInClickEvent: function () {
      return _supportsPointerTypeInClickEvent;
    },
    allowBackdropFilter: function () {
      return allowBackdropFilter;
    },
    allowFocusScaling: function () {
      return allowFocusScaling;
    },
    supportsAsyncDecodedImages: function () {
      // decoding=async is causing flickering in safari when leaving and coming back to the app
      return !_browser.default.iOS && !_browser.default.osx;
    }
  };
});
