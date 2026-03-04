define(["exports", "./../../layoutmanager.js", "./../../scroller/smoothscroller.js", "./../../headroom/headroom.js", "./../../customelementupgrade.js", "./../../skinviewmanager.js"], function (_exports, _layoutmanager, _smoothscroller, _headroom, _customelementupgrade, _skinviewmanager) {
  Object.defineProperty(_exports, "__esModule", {
    value: true
  });
  _exports.default = void 0;
  /* jshint module: true */

  function onInit() {
    this.classList.add('emby-scroller');
  }
  var headerElement = document.querySelector('.skinHeader');
  var DefaultFocusScroll = 'adaptive';
  function initHeadroom(elem) {
    if (_skinviewmanager.default.getSkinOptions().disableHeadRoom) {
      return;
    }
    var headroom = new _headroom.default({
      scroller: elem,
      element: headerElement,
      enableScrollingStatus: true
    });
    // initialise
    headroom.init();
    elem.headroom = headroom;
  }

  // this is simply to avoid loading the resources in tv display mode, when it's not needed
  var embyScrollButtonsLoaded;
  function loadEmbyScrollButtons() {
    if (embyScrollButtonsLoaded) {
      return Promise.resolve();
    }
    embyScrollButtonsLoaded = true;
    return Emby.importModule('./modules/emby-elements/emby-scrollbuttons/emby-scrollbuttons.js');
  }
  if (!_layoutmanager.default.tv) {
    loadEmbyScrollButtons();
  }
  function onScrollButtonsLoaded(scroller) {
    var parent = scroller;
    if (scroller.getAttribute('data-scrollbuttonparent') !== 'self') {
      parent = parent.parentNode;
    }
    parent.insertAdjacentHTML('afterbegin', '<div is="emby-scrollbuttons" class="emby-scrollbuttons"></div>');
  }
  function loadScrollButtons(scroller) {
    if (_layoutmanager.default.tv) {
      return;
    }
    if (embyScrollButtonsLoaded) {
      onScrollButtonsLoaded(scroller);
      return;
    }
    loadEmbyScrollButtons().then(function () {
      onScrollButtonsLoaded(scroller);
    });
  }
  var EmbyScroller = /*#__PURE__*/function (_HTMLDivElement) {
    function EmbyScroller() {
      var _this;
      // address the upgraded instance and use it
      var self = _this = _HTMLDivElement.call(this) || this;
      onInit.call(self);
      return babelHelpers.possibleConstructorReturn(_this, self);
    }
    babelHelpers.inherits(EmbyScroller, _HTMLDivElement);
    return babelHelpers.createClass(EmbyScroller, [{
      key: "connectedCallback",
      value: function connectedCallback() {
        onInit.call(this);
        var horizontal = this.getAttribute('data-horizontal') !== 'false';
        var slider = this.querySelector('.scrollSlider');
        if (horizontal) {
          slider.style['white-space'] = 'nowrap';
        }
        var bindHeaderValue = this.getAttribute('data-bindheader');
        var bindHeader = bindHeaderValue === 'true' || _layoutmanager.default.tv && bindHeaderValue === 'tv';
        var scrollFrame = this;
        var enableScrollButtons = !_layoutmanager.default.tv && (horizontal || this.getAttribute('data-scrollbuttonstype') === 'x') && this.getAttribute('data-scrollbuttons') !== 'false';
        var focusScroll = this.getAttribute('data-focusscroll');

        // application default
        if (focusScroll === 'true') {
          focusScroll = DefaultFocusScroll;
        } else if (focusScroll === 'false') {
          focusScroll = null;
        } else if (!focusScroll) {
          focusScroll = this.getAttribute('data-centerfocus') !== 'false' ? DefaultFocusScroll : null;
        }
        this.isPrimaryScroller = bindHeader || this.getAttribute('data-primaryscroller') === 'true';
        var forceScrollbar = this.getAttribute('data-forcescrollbar') === 'true';
        var options = {
          horizontal: horizontal,
          mouseWheel: this.getAttribute('data-mousewheel') !== 'false',
          touchDragging: 1,
          slidee: slider,
          dragHandle: 1,
          hideScrollbar: enableScrollButtons && horizontal ? true : forceScrollbar ? false : null,
          forceScrollbar: enableScrollButtons && horizontal || forceScrollbar,
          allowNativeSmoothScroll: this.getAttribute('data-allownativesmoothscroll') === 'true',
          focusScroll: focusScroll,
          focusScrollOffsetLeft: this.getAttribute('data-focusscrolloffsetleft') || this.getAttribute('data-focusscrolloffset') || null,
          focusScrollOffsetTop: this.getAttribute('data-focusscrolloffsettop') || this.getAttribute('data-focusscrolloffset') || null,
          forceNativeScroll: this.getAttribute('data-forcenativescroll') === 'true',
          forceSmoothScroll: this.getAttribute('data-forcesmoothscroll') === 'true',
          dualScroll: this.getAttribute('data-dualscroll') === 'true',
          miniScrollbar: this.getAttribute('data-miniscrollbar') === 'true',
          // this default should cover the scrollers that need this. essentially for main content scrollers
          autoStartEdge: horizontal || this.isPrimaryScroller
        };
        if (options.dualScroll) {
          options.autoStartEdge = false;
        }
        if (!horizontal && !this.isPrimaryScroller) {
          options.adaptiveBorderYStart = 0;
        }
        var adaptiveBorder = this.getAttribute('data-adaptiveborder');
        if (adaptiveBorder) {
          options.adaptiveBorderXStart = options.adaptiveBorderXEnd = options.adaptiveBorderYStart = options.adaptiveBorderYEnd = parseInt(adaptiveBorder);
        }
        var adaptiveBorderXStart = this.getAttribute('data-adaptiveborderxstart');
        if (adaptiveBorderXStart) {
          options.adaptiveBorderXStart = parseInt(adaptiveBorderXStart);
        }
        var adaptiveBorderYStart = this.getAttribute('data-adaptiveborderystart');
        if (adaptiveBorderYStart) {
          options.adaptiveBorderYStart = parseInt(adaptiveBorderYStart);
        }
        var adaptiveBorderXEnd = this.getAttribute('data-adaptiveborderxend');
        if (adaptiveBorderXEnd) {
          options.adaptiveBorderXEnd = parseInt(adaptiveBorderXEnd);
        }
        var adaptiveBorderYEnd = this.getAttribute('data-adaptiveborderyend');
        if (adaptiveBorderYEnd) {
          options.adaptiveBorderYEnd = parseInt(adaptiveBorderYEnd);
        }

        // If just inserted it might not have any height yet - yes this is a hack
        this.scroller = new _smoothscroller.default(scrollFrame, options);
        this.scroller.init();
        if (bindHeader) {
          initHeadroom(this);
        }
        if (enableScrollButtons) {
          loadScrollButtons(this);
        }
        this.__upgraded = true;
        this.dispatchEvent(new CustomEvent('upgraded', {
          cancelable: false
        }));
      }
    }, {
      key: "disconnectedCallback",
      value: function disconnectedCallback() {
        var headroom = this.headroom;
        if (headroom) {
          headroom.destroy();
          this.headroom = null;
        }
        var scrollerInstance = this.scroller;
        if (scrollerInstance) {
          scrollerInstance.destroy();
          this.scroller = null;
        }
      }
    }, {
      key: "pause",
      value: function pause() {
        this.paused = true;
        var headroom = this.headroom;
        if (headroom) {
          headroom.pause();
        }
      }
    }, {
      key: "beginResume",
      value: function beginResume() {
        this.paused = false;
        var headroom = this.headroom;
        if (headroom) {
          headroom.beginResume();
        }
      }
    }, {
      key: "resume",
      value: function resume() {
        this.paused = false;
        var headroom = this.headroom;
        if (headroom) {
          headroom.resume();
        } else if (this.isPrimaryScroller) {
          headerElement.classList.add('headroom-scrolling');
          headerElement.classList.remove('headroom-hidden');
        }
      }
    }, {
      key: "getScrollSize",
      value: function getScrollSize() {
        if (this.scroller) {
          return this.scroller.getScrollSize();
        }
      }
    }, {
      key: "getScrollWidth",
      value: function getScrollWidth() {
        if (this.scroller) {
          return this.scroller.getScrollWidth();
        }
      }
    }, {
      key: "getScrollHeight",
      value: function getScrollHeight() {
        if (this.scroller) {
          return this.scroller.getScrollHeight();
        }
      }
    }, {
      key: "getScrollPosition",
      value: function getScrollPosition() {
        if (this.scroller) {
          return this.scroller.getScrollPosition();
        }
      }
    }, {
      key: "getLastScrollPosition",
      value: function getLastScrollPosition() {
        if (this.scroller) {
          return this.scroller.getLastScrollPosition();
        }
      }
    }, {
      key: "isNativeScroll",
      value: function isNativeScroll() {
        if (this.scroller) {
          return this.scroller.isNativeScroll();
        }
      }
    }, {
      key: "getScrollLeft",
      value: function getScrollLeft() {
        if (this.scroller) {
          return this.scroller.getScrollLeft();
        }
      }
    }, {
      key: "getScrollTop",
      value: function getScrollTop() {
        if (this.scroller) {
          return this.scroller.getScrollTop();
        }
      }
    }, {
      key: "getScrollContainerBoundingClientRect",
      value: function getScrollContainerBoundingClientRect() {
        if (this.scroller) {
          return this.scroller.getScrollContainerBoundingClientRect();
        }
      }
    }, {
      key: "getScrollSlider",
      value: function getScrollSlider() {
        if (this.scroller) {
          return this.scroller.getScrollSlider();
        }
      }
    }, {
      key: "scrollToBeginning",
      value: function scrollToBeginning(scrollOptions) {
        if (this.scroller) {
          if (!scrollOptions) {
            scrollOptions = {};
          }
          scrollOptions.position = 0;
          return this.scroller.scrollToPosition(scrollOptions);
        }
      }
    }, {
      key: "toStart",
      value: function toStart(elem, scrollOptions) {
        if (this.scroller) {
          this.scroller.toStart(elem, scrollOptions);
        }
      }
    }, {
      key: "toCenter",
      value: function toCenter(elem, scrollOptions) {
        if (this.scroller) {
          this.scroller.toCenter(elem, scrollOptions);
        }
      }
    }, {
      key: "scrollToElement",
      value: function scrollToElement(elem, scrollOptions) {
        if (this.scroller) {
          this.scroller.scrollToElement(elem, scrollOptions);
        }
      }
    }, {
      key: "scrollToPosition",
      value: function scrollToPosition(pos) {
        if (this.scroller) {
          return this.scroller.scrollToPosition(pos);
        }
      }
    }, {
      key: "addScrollEventListener",
      value: function addScrollEventListener(fn, options) {
        if (this.scroller) {
          this.scroller.addScrollEventListener(fn, options);
        }
      }
    }, {
      key: "removeScrollEventListener",
      value: function removeScrollEventListener(fn, options) {
        if (this.scroller) {
          this.scroller.removeScrollEventListener(fn, options);
        }
      }
    }, {
      key: "scrollBackwards",
      value: function scrollBackwards() {
        if (this.scroller) {
          this.scroller.scrollBackwards();
        }
      }
    }, {
      key: "scrollForwards",
      value: function scrollForwards() {
        if (this.scroller) {
          this.scroller.scrollForwards();
        }
      }
    }, {
      key: "scrollBy",
      value: function scrollBy(delta, scrollOptions) {
        if (this.scroller) {
          this.scroller.scrollBy(delta, scrollOptions);
        }
      }
    }, {
      key: "addResizeObserver",
      value: function addResizeObserver(fn) {
        if (this.scroller) {
          this.scroller.addResizeObserver(fn);
        }
      }
    }, {
      key: "removeResizeObserver",
      value: function removeResizeObserver(fn) {
        if (this.scroller) {
          this.scroller.removeResizeObserver(fn);
        }
      }
    }, {
      key: "getScrollMultiplier",
      value: function getScrollMultiplier() {
        if (this.scroller) {
          return this.scroller.getScrollMultiplier();
        }
      }
    }, {
      key: "getScrollLeftMultiplier",
      value: function getScrollLeftMultiplier() {
        if (this.scroller) {
          return this.scroller.getScrollLeftMultiplier();
        }
      }
    }, {
      key: "getScrollTopMultiplier",
      value: function getScrollTopMultiplier() {
        if (this.scroller) {
          return this.scroller.getScrollTopMultiplier();
        }
      }
    }, {
      key: "getPadding",
      value: function getPadding() {
        if (this.scroller) {
          return this.scroller.getPadding();
        }
      }
    }, {
      key: "getElementPosition",
      value: function getElementPosition(element, horizontal, scrollOptions) {
        if (this.scroller) {
          return this.scroller.getElementPosition(element, horizontal, scrollOptions);
        }
      }
    }, {
      key: "notifyResized",
      value: function notifyResized() {
        if (this.scroller) {
          return this.scroller.notifyResized();
        }
      }
    }, {
      key: "setHeaderBindingEnabled",
      value: function setHeaderBindingEnabled(enabled) {
        if (!this.headroom || this.paused) {
          return;
        }
        if (enabled) {
          this.headroom.beginResume({});
          this.headroom.resume({});
        } else {
          this.headroom.pause();
          this.headroom.clearTransform();
        }
      }
    }, {
      key: "setFocusScroll",
      value: function setFocusScroll(focusScroll) {
        if (this.scroller) {
          if (focusScroll == null) {
            focusScroll = DefaultFocusScroll;
          }
          if (this.scroller.options) {
            this.scroller.options.focusScroll = focusScroll;
          }
        }
      }
    }, {
      key: "setFocusScrollOffsetLeft",
      value: function setFocusScrollOffsetLeft(val) {
        if (this.scroller) {
          if (this.scroller.options) {
            this.scroller.options.focusScrollOffsetLeft = val;
          }
        }
      }
    }]);
  }(/*#__PURE__*/babelHelpers.wrapNativeSuper(HTMLDivElement)); // a fake upgrade. a bit of a hack job to upgrade old plugin pages
  EmbyScroller.upgradeElement = function (elem) {
    Object.assign(elem, EmbyScroller.prototype);
    var names = Object.getOwnPropertyNames(EmbyScroller.prototype);
    for (var i = 0, length = names.length; i < length; i++) {
      var name = names[i];
      elem[name] = EmbyScroller.prototype[name];
    }
    EmbyScroller.prototype.connectedCallback.call(elem);
  };
  customElements.define('emby-scroller', EmbyScroller, {
    extends: 'div'
  });
  var _default = _exports.default = EmbyScroller;
});
