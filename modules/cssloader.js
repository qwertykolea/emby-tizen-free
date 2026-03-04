define(["exports", "./layoutmanager.js", "./emby-apiclient/events.js", "./browser.js"], function (_exports, _layoutmanager, _events, _browser) {
  Object.defineProperty(_exports, "__esModule", {
    value: true
  });
  _exports.default = void 0;
  /* jshint module: true */

  //import mouseManager from './input/mouse.js';

  var mouseManager;

  // these checks are needed because alameda gets loaded prior to polyfills
  var DebugLegacy = false;
  var SupportsCssVariables = !DebugLegacy && typeof CSS !== 'undefined' && CSS.supports && CSS.supports('color', 'var(--fake-var)');
  var SupportsCssAspectRatio = !DebugLegacy && typeof CSS !== 'undefined' && CSS.supports('aspect-ratio', '16 / 9');

  // don't use calc or var in the supports because legacy edge will falsely say it is supported
  var SupportsVarCalcMax = !DebugLegacy && typeof CSS !== 'undefined' && CSS.supports('width', 'max(10em, 5vw)');
  var SupportsPositionTry = !DebugLegacy && typeof CSS !== 'undefined' && CSS.supports('position-try-fallbacks: top');

  // earlier versions of Chrome that supported containery syntax had numerous rendering issues. position-try is only here to limit this to even newer environments.
  var SupportsContainerQueries = !DebugLegacy && typeof CSS !== 'undefined' && CSS.supports('width', '1cqw') && SupportsPositionTry;
  function polyfillCssVars(link, loadFn) {
    Emby.importModule('./modules/css-vars-ponyfill/css-vars-ponyfill.js').then(function (cssVars) {
      cssVars({
        watch: false,
        include: [link],
        onlyLegacy: false,
        preserveVars: false,
        shadowDOM: false
      });
      loadFn();
    });
  }
  function boundOnChange() {
    this.enableIfNeeded();
  }
  function ensureBoundOnChange(instance) {
    if (!instance.boundOnChange) {
      instance.boundOnChange = boundOnChange.bind(instance);
    }
  }
  function addUrlArgs(url) {
    var args = CSSLoader.urlArgs;
    if (!args) {
      return url;
    }
    return url + (url.indexOf('?') === -1 ? '?' : '&') + args;
  }
  function CSSLoader(url, options) {
    var originalUrl = url;
    if (!url.includes('://')) {
      var baseUrl = CSSLoader.baseUrl;
      if (baseUrl) {
        url = CSSLoader.baseUrl + url;
      }
    }
    url = addUrlArgs(url);
    console.log('new CSSLoader: url: ' + url + ', original url: ' + originalUrl);
    this.url = url;
    this.options = options;
    if (options.tv != null) {
      ensureBoundOnChange(this);
      _events.default.on(_layoutmanager.default, 'modechange', this.boundOnChange);
    }
    if (options.mouselistening != null) {
      ensureBoundOnChange(this);
      _events.default.on(mouseManager, 'mouselisteningstart', this.boundOnChange);
      _events.default.on(mouseManager, 'mouselisteningstop', this.boundOnChange);
    }
  }
  CSSLoader.prototype.canEnable = function () {
    var options = this.options;
    switch (options.aspectratio) {
      case true:
        if (!SupportsCssAspectRatio) {
          return false;
        }
        break;
      case false:
        if (SupportsCssAspectRatio) {
          return false;
        }
        break;
      default:
        break;
    }
    switch (options.cssvars) {
      case true:
        if (!SupportsCssVariables) {
          return false;
        }
        break;
      case false:
        if (SupportsCssVariables) {
          return false;
        }
        break;
      default:
        break;
    }
    switch (options.containerqueries) {
      case true:
        if (!SupportsContainerQueries) {
          return false;
        }
        break;
      case false:
        if (SupportsContainerQueries) {
          return false;
        }
        break;
      default:
        break;
    }
    switch (options.varcalcmax) {
      case true:
        if (!SupportsVarCalcMax) {
          return false;
        }
        break;
      case false:
        if (SupportsVarCalcMax) {
          return false;
        }
        break;
      default:
        break;
    }
    switch (options.positiontry) {
      case true:
        if (!SupportsPositionTry) {
          return false;
        }
        break;
      case false:
        if (SupportsPositionTry) {
          return false;
        }
        break;
      default:
        break;
    }
    switch (options.osx) {
      case true:
        if (!_browser.default.osx) {
          return false;
        }
        break;
      case false:
        if (_browser.default.osx) {
          return false;
        }
        break;
      default:
        break;
    }
    switch (options.firefox) {
      case true:
        if (!_browser.default.firefox) {
          return false;
        }
        break;
      case false:
        if (_browser.default.firefox) {
          return false;
        }
        break;
      default:
        break;
    }
    return true;
  };
  CSSLoader.prototype.shouldEnable = function () {
    if (!this.canEnable()) {
      return false;
    }
    var options = this.options;
    switch (options.tv) {
      case true:
        if (!_layoutmanager.default.tv) {
          return false;
        }
        break;
      case false:
        if (_layoutmanager.default.tv) {
          return false;
        }
        break;
      default:
        break;
    }
    switch (options.mouselistening) {
      case true:
        if (!mouseManager.isListening()) {
          return false;
        }
        break;
      case false:
        if (mouseManager.isListening()) {
          return false;
        }
        break;
      default:
        break;
    }
    return true;
  };
  CSSLoader.prototype.enableIfNeeded = function () {
    if (this.shouldEnable()) {
      return this.enable();
    } else {
      this.disable();
      return Promise.resolve();
    }
  };
  function getLinkPromise(link, linkUrl, placeholderElement, options) {
    return new Promise(function (resolve, reject) {
      if (!SupportsCssVariables && options.polyfillcssvars) {
        link.onload = polyfillCssVars(link, resolve);
      } else {
        link.onload = resolve;
      }
      link.setAttribute('href', linkUrl);
      try {
        if (placeholderElement) {
          placeholderElement.parentNode.replaceChild(link, placeholderElement);
        } else {
          document.head.appendChild(link);
        }
      } catch (err) {
        // This is needed for Chromecast audio
        console.error('Error loading stylesheet', err);
        reject(err);
      }
    });
  }
  function ensurePlaceholder(instance) {
    var placeholderElement = instance.placeholderElement;
    if (placeholderElement) {
      return placeholderElement;
    }
    placeholderElement = document.createElement('div');
    placeholderElement.className = 'hide';
    instance.placeholderElement = placeholderElement;
    document.head.appendChild(placeholderElement);
    return placeholderElement;
  }
  CSSLoader.prototype.enable = function () {
    var link = this.link;
    if (link) {
      link.disabled = false;
      return Promise.resolve();
    }
    link = document.createElement('link');
    this.link = link;
    link.setAttribute('rel', 'stylesheet');
    link.setAttribute('type', 'text/css');
    var placeholderElement = ensurePlaceholder(this);
    this.placeholderElement = null;
    return getLinkPromise(link, this.url, placeholderElement, this.options);
  };
  CSSLoader.prototype.disable = function () {
    var link = this.link;
    if (link) {
      link.disabled = true;
      return;
    }
    if (!this.canEnable()) {
      return;
    }
    ensurePlaceholder(this);
  };
  function tryRemove(elem) {
    try {
      elem.remove();
    } catch (err) {
      console.error('Error removing child node: ', err);
    }
  }
  CSSLoader.prototype.destroy = function () {
    var link = this.link;
    if (link) {
      // This is crashing on netcast
      if (!SupportsCssVariables) {
        var nextSibling = link.nextSibling;
        if (nextSibling && nextSibling.getAttribute('data-cssvars-job')) {
          tryRemove(nextSibling);
        }
      }
      tryRemove(link);
      this.link = null;
    }
    if (this.placeholderElement) {
      this.placeholderElement.remove();
      this.placeholderElement = null;
    }
    this.url = null;
    this.options = null;
    if (this.boundOnChange) {
      _events.default.off(_layoutmanager.default, 'modechange', this.boundOnChange);
      if (mouseManager) {
        _events.default.off(mouseManager, 'mouselisteningstart', this.boundOnChange);
        _events.default.off(mouseManager, 'mouselisteningstop', this.boundOnChange);
      }
      this.boundOnChange = null;
    }
  };
  CSSLoader.init = function (options) {
    if (options.mouseManager) {
      mouseManager = options.mouseManager;
    }
  };
  var _default = _exports.default = CSSLoader;
});
