define(["exports", "./../dom.js", "./../layoutmanager.js", "./../appheader/appheadercontent.js"], function (_exports, _dom, _layoutmanager, _appheadercontent) {
  Object.defineProperty(_exports, "__esModule", {
    value: true
  });
  _exports.default = void 0;
  /* jshint module: true */

  var insetsDebug = false;
  var debugHeight = '34px';
  if (insetsDebug) {
    document.body.insertAdjacentHTML('afterbegin', '<div style="background: lightgray; position: fixed; top: 0; left: 0; right: 0; height: ' + debugHeight + '; display: flex; align-items: flex-end; z-index: 99999;">Control Bar</div>');
  }
  require(['css!modules/headroom/headroom.css']);

  /**
  * UI enhancement for fixed headers.
  * Hides header when scrolling down
  * Shows header when scrolling up
  * @constructor
  * @param {DOMElement} elem the header element
  * @param {Object} options options for the widget
  */
  function Headroom(options) {
    if (!options) {
      options = {};
    }
    this.lastScrollY = 0;
    this.lastTransformScrollY = 0;
    this.element = options.element;
    this.scrollElementForEvents = options.scroller || window;
    this.scroller = /*options.scroller || document.scrollingElement ||*/this.scrollElementForEvents;
    this.offset = options.offset;
    this.enableScrollingStatus = options.enableScrollingStatus;
    this.paused = true;
  }
  var isNativeAndroid = globalThis.appMode === 'android';
  function detectCssEnvSupported() {
    // this has to do it's own thing unfortunately
    if (isNativeAndroid) {
      return true;
    }
    try {
      var val = getComputedStyle(document.documentElement).getPropertyValue('--env-inset-top');
      // make sure the actual value is returned
      if (val && !val.includes('env(')) {
        return true;
      }
    } catch (err) {}
    return false;
  }
  function removeCssVariable() {
    try {
      if (insetsDebug) {
        document.documentElement.style.setProperty('--env-inset-top', debugHeight);
      } else {
        document.documentElement.style.setProperty('--env-inset-top', '1');
      }
    } catch (err) {}
  }
  var headerElement = document.querySelector('.skinHeader');
  var currentInstance;
  _dom.default.addEventListener(headerElement, 'focus', function () {
    if (currentInstance && currentInstance.hideWithAnyScroll) {
      var scroller = currentInstance.scrollElementForEvents;
      if (scroller) {
        scroller.scrollToBeginning();
      }
    }
  }, {
    passive: true,
    capture: true
  });
  var supportsCssEnv = detectCssEnvSupported();
  removeCssVariable();
  var SupportsTranslateProperty = CSS.supports('translate', '40px 100px');
  var TranslateProperty = SupportsTranslateProperty ? 'translate' : CSS.supports('transform', 'scale(1)') ? 'transform' : '-webkit-transform';
  function buildTranslateValue(value) {
    if (SupportsTranslateProperty) {
      return '0 ' + value;
    }
    return 'translateY(' + value + ')';
  }
  var topCalcNative = insetsDebug ? buildTranslateValue('calc(-100% + var(--env-inset-top, 0))') : buildTranslateValue('calc(-100% + env(safe-area-inset-top, 0))');
  var topCalc = supportsCssEnv ? isNativeAndroid ? buildTranslateValue('calc(-100% + var(--window-inset-top, 0))') : topCalcNative : buildTranslateValue('-100%');
  function setTransformImmediate(elem, classList, value) {
    classList.add('headroom-notransition');
    elem.style[TranslateProperty] = value;
    void elem.offsetWidth;
    classList.remove('headroom-notransition');
  }
  var DefaultScrollThreshold = Math.max(10 * (window.devicePixelRatio || 1), 20);
  Headroom.prototype = {
    constructor: Headroom,
    /**
     * Initialises the widget
     */
    init: function () {
      this.isScrolling = false;
      this.attachEvent();
      if (_layoutmanager.default.tv) {
        this.hideWithAnyScroll = true;
      }
      if (this.hideWithAnyScroll) {
        this.enableScrollingStatus = false;
      }
      return this;
    },
    pause: function () {
      //console.log('pause: ' + this.scrollElementForEvents.className);
      this.paused = true;
      if (currentInstance === this) {
        currentInstance = null;
      }
      var elem = this.element;
      if (elem) {
        if (this.isScrolling) {
          elem.classList.remove('headroom-scrolling');
        }
        if (this.isHidden) {
          elem.classList.remove('headroom-hidden');
        }
      }
    },
    clearTransform: function () {
      var elem = this.element;
      if (elem) {
        if (this.isScrolling) {
          elem.classList.remove('headroom-scrolling');
        }
        if (this.isHidden) {
          elem.classList.remove('headroom-hidden');
        }
      }
      this.setTransform(0, this.lastTransformScrollY, true, true, true);
    },
    beginResume: function () {
      // resuming headroom has been moved to beginResume so that changes on view changes are immediately visible
      // but this is only possible with animated scroll because scrollTop will return 0 when not visible

      if (this.paused && this.allowBeginResume /*|| this.getLastScrollPosition() != null*/) {
        //console.log('beginResume: ' + this.scrollElementForEvents.className);
        this.paused = false;
        currentInstance = this;
        this.updateFn(null, true, true, true);
      }
    },
    resume: function () {
      if (this.paused) {
        //console.log('resume: ' + this.scrollElementForEvents.className);
        this.paused = false;
        currentInstance = this;
        this.updateFn(null, true, true, false);
      }
    },
    /**
     * Unattaches events and removes any classes that were added
     */
    destroy: function () {
      this.lastScrollY = null;
      this.lastTransformScrollY = null;

      //classList.remove('headroom');

      var scroller = this.scrollElementForEvents;
      if (scroller) {
        if (scroller.removeScrollEventListener) {
          scroller.removeScrollEventListener(this.updateFn, {
            capture: false,
            passive: true
          });
        } else {
          _dom.default.removeEventListener(scroller, 'scroll', this.updateFn, {
            capture: false,
            passive: true
          });
        }
      }
      this.scrollElementForEvents = null;
      this.scroller = null;
      this.element = null;
    },
    /**
     * Attaches the scroll event
     * @private
     */
    attachEvent: function () {
      var isNativeScroll = this.scroller.isNativeScroll();
      this.isNativeScroll = isNativeScroll;
      if (isNativeScroll) {
        this.updateFn = this.updateWithRequestAnimationFrame.bind(this);
      } else {
        this.updateFn = this.update.bind(this);
      }
      this.lastScrollY = this.scroller.getScrollPosition();
      this.allowBeginResume = !isNativeScroll;
      this.lastTransformScrollY = this.lastScrollY;
      var scroller = this.scrollElementForEvents;
      if (scroller) {
        if (scroller.addScrollEventListener) {
          scroller.addScrollEventListener(this.updateFn, {
            capture: false,
            passive: true
          });
        } else {
          _dom.default.addEventListener(scroller, 'scroll', this.updateFn, {
            capture: false,
            passive: true
          });
        }
      }

      // need to investigate, but using immediate here breaks the page transition in tv mode
      //this.updateFn(null, true, false);
    },
    setTransform: function (value, currentScrollY, top, forceRefresh, immediate) {
      var elem = this.element;
      if (!elem) {
        return;
      }
      this.lastTransformScrollY = currentScrollY;
      if (!forceRefresh && value === this.transform) {
        return;
      }
      var transformChanging = value !== elem.headroomTransform;
      this.transform = value;
      elem.headroomTransform = value;
      var isScrolling = !top;
      var isHidden;
      if (value === 0) {
        value = 'none';
      } else if (value === 1) {
        value = topCalc;
        isHidden = true;
      } else {
        value = buildTranslateValue('-' + value + 'px');
      }

      //console.log('headroom.setTransform: ' + value + '-' + top + ', transformChanging: ' + transformChanging);

      if (this.enableScrollingStatus) {
        if (this.isScrolling !== isScrolling || forceRefresh) {
          this.isScrolling = isScrolling;
          if (isScrolling) {
            elem.classList.add('headroom-scrolling');
          } else {
            elem.classList.remove('headroom-scrolling');
          }
        }
        if (this.isHidden !== isHidden || forceRefresh) {
          this.isHidden = isHidden;
          if (isHidden) {
            elem.classList.add('headroom-hidden');
          } else {
            elem.classList.remove('headroom-hidden');
          }
        }
      }

      // check forceRefresh because another screen could have mucked with the header transform on it's own
      if (!transformChanging && !forceRefresh) {
        return;
      }
      if (immediate) {
        setTransformImmediate(elem, elem.classList, value);
      } else {
        if (this.isNativeScroll) {
          elem.style[TranslateProperty] = value;
        } else if (!immediate) {
          elem.style[TranslateProperty] = value;
          // the page transition gets broken without this
          //this.setTransformWithAnimationFrame(elem, value);
        }
      }
    },
    setTransformWithAnimationFrame: function (elem, value) {
      requestAnimationFrame(function () {
        elem.style[TranslateProperty] = value;
      });
    },
    update: function (e, forceRefresh, immediate, enableBackgroundSupport) {
      if (this.paused) {
        //console.log('paused: ' + this.scrollElementForEvents.className);
        return;
      }
      var currentScrollY;
      if (enableBackgroundSupport) {
        if (this.isNativeScroll) {
          currentScrollY = this.scroller.getLastScrollPosition();
          if (currentScrollY == null) {
            currentScrollY = this.lastScrollY || 0;
          }
        } else {
          currentScrollY = this.scroller.getScrollPosition();
        }
      } else {
        currentScrollY = this.scroller.getScrollPosition();
      }

      //if (currentScrollY <= 0) {
      //    if (!this.isAtTop) {
      //        this.isAtTop = true;
      //        this.element.classList.add('headroom-top');
      //    }
      //    //console.log('headroom-top: ' + this.scrollElementForEvents.className);
      //} else {
      //    if (this.isAtTop !== false) {
      //        this.isAtTop = false;
      //        this.element.classList.remove('headroom-top');
      //    }
      //}

      var lastScrollY = this.lastScrollY;
      var hideWithAnyScroll = this.hideWithAnyScroll;
      var scrollingDirection = currentScrollY > lastScrollY ? 1 : currentScrollY < lastScrollY ? -1 : 0;
      forceRefresh = forceRefresh === true;
      if (forceRefresh) {
        // no scrolling actually occurred
        scrollingDirection = 0;
      }
      var lastTransformScrollY = this.lastTransformScrollY;
      var scrollThreshold = DefaultScrollThreshold;

      //console.log('lastTransformScrollY: ' + lastTransformScrollY);

      var top = currentScrollY <= (hideWithAnyScroll ? _appheadercontent.default.getHeight() : 0);
      var toleranceExceeded = forceRefresh || Math.abs(currentScrollY - lastTransformScrollY) > scrollThreshold;

      //console.log('scrollDirection: ' + scrollingDirection + ', top: ' + top + ', curentScrollY: ' + currentScrollY + ' - ' + this.scrollElementForEvents.className);

      if (!top && scrollingDirection === 1 && toleranceExceeded) {
        this.setTransform(1, currentScrollY, top, forceRefresh, immediate);
      } else if (scrollingDirection === -1 && !hideWithAnyScroll && toleranceExceeded || top) {
        this.setTransform(0, currentScrollY, top, forceRefresh || top, immediate);
      } else if (!scrollingDirection && forceRefresh) {
        var previousTransform = this.transform;
        var newValue = top ? 0 : previousTransform == null ? 1 : previousTransform;
        this.setTransform(newValue, currentScrollY, top, forceRefresh || top, immediate);
      }
      this.lastScrollY = currentScrollY;
    },
    /**
     * Handles updating the state of the widget
     */
    updateWithRequestAnimationFrame: function (e, forceRefresh, immediate, enableBackgroundSupport) {
      var instance = this;
      requestAnimationFrame(function () {
        instance.update(e, forceRefresh, immediate, enableBackgroundSupport);
      });
    }
  };
  var _default = _exports.default = Headroom;
});
