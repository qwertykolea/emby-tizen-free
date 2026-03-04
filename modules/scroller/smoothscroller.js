define(["exports", "./../layoutmanager.js", "./../dom.js", "./../focusmanager.js", "./../skinviewmanager.js"], function (_exports, _layoutmanager, _dom, _focusmanager, _skinviewmanager) {
  Object.defineProperty(_exports, "__esModule", {
    value: true
  });
  _exports.default = void 0;
  /* jshint module: true */

  require(['scrollStyles']);
  var StartLocation = 'start';
  var CenterLocation = 'center';
  var EndLocation = 'end';
  var AdaptiveLocation = 'adaptive';
  var preventScrollSupported = function () {
    var supported = false;
    try {
      var focusOptions = {};
      Object.defineProperty(focusOptions, "preventScroll", {
        /**
         * Gets an array of strings giving the formats that were set in the @see:dragstart event.
         */
        get: function () {
          supported = true;
          return true;
        },
        enumerable: true,
        configurable: true
      });
      document.createElement('div').focus(focusOptions);
    } catch (err) {
      console.log('error testing preventScroll support: ' + err);
    }
    return supported;
  }();
  var allowAnimatedScroll = function () {
    var cores = navigator.hardwareConcurrency || 4;
    if (cores < 4) {
      return false;
    }
    if ((screen.width || screen.availWidth || 0) >= 2400 || (screen.height || screen.availHeight || 0) >= 1400) {
      if (cores < 6) {
        return false;
      }
    }
    var deviceMemory = navigator.deviceMemory || 2;
    if (deviceMemory < 2) {
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
    var platform = (navigator.platform || '').toLowerCase();
    var IsAndroid = globalThis.appMode === 'android';
    var lowProfileDevice = IsAndroid && (cores < 4 || deviceMemory < 2 || platform.includes('armv7'));
    if (lowProfileDevice) {
      return false;
    }
    return true;
  }();

  /**
  * Return type of the value.
  *
  * @param  {Mixed} value
  *
  * @return {String}
  */
  /**
   * Disables an event it was triggered on and unbinds itself.
   *
   * @param  {Event} event
   *
   * @return {Void}
   */
  function onSourceClick(event) {
    var dragging = this.dragging;

    // Disable click on a source element, as it is unwelcome when dragging
    if (!dragging.locked && Math.abs(dragging.delta) > 0) {
      dragging.locked = 1;
      event.preventDefault();
      event.stopPropagation();
      var target = event.currentTarget || event.target;
      target.removeEventListener(event.type, this.onSourceClickFn);
    }
  }
  function within(number, start, end) {
    var min = start < end ? start : end;
    var max = start > end ? start : end;
    return number < min ? min : number > max ? max : number;
  }
  function onFrameClick(e) {
    if (e.which === 1) {
      var instance = this;

      // pass in false to not scroll based on focusable groupings (e.g. clicking in a blank spot within a focusable area
      var focusableParent = _focusmanager.default.focusableParent(e.target, false);
      if (focusableParent) {
        var activeElement = document.activeElement;
        if (focusableParent !== activeElement) {
          // check autoPreventScrollOnFocus to avoid scroll being prevented with tabs on iOS
          _focusmanager.default.focus(focusableParent, {
            preventScroll: instance.options.autoPreventScrollOnFocus
          });
        }
      }
    }
  }
  function parsePxToInt(value) {
    if (!value) {
      return 0;
    }
    if (value.endsWith('px')) {
      value = value.substring(0, value.length - 2);
    }
    if (!value) {
      return 0;
    }
    value = parseInt(value);
    if (isNaN(value)) {
      return 0;
    }
    return value;
  }
  var PaddingInlineStartProp = CSS.supports('padding-inline-start', '0') ? 'padding-inline-start' : CSS.supports('-webkit-padding-start', '0') ? '-webkit-padding-start' : 'padding-left';
  var PaddingInlineEndProp = CSS.supports('padding-inline-end', '0') ? 'padding-inline-end' : CSS.supports('-webkit-padding-end', '0') ? '-webkit-padding-end' : 'padding-right';
  function calcLengthToPx(lengthStr) {
    var value = parseFloat(lengthStr);
    var unit = lengthStr.match(/[a-zA-Z%]+/);
    if (!unit || unit.length === 0) {
      return value;
    }
    switch (unit[0].toLowerCase()) {
      case 'px':
        return value;
      case 'rem':
        return value * parseFloat(getComputedStyle(document.documentElement).fontSize);
      case 'vw':
        return value / 100 * _dom.default.getWindowSize().innerWidth;
      case 'vh':
        return value / 100 * _dom.default.getWindowSize().innerHeight;
      default:
    }
    throw new Error('Unsupported unit for conversion: ' + unit);
  }
  function parseFocusScrollOffset(instance, offset) {
    switch (offset) {
      case '-padding-inline-start':
        return 0 - instance.getPadding().inlineStart;
      case '-padding-top':
        return 0 - instance.getPadding().top;
      default:
        // used by wmc theme
        return calcLengthToPx(offset);
    }
  }
  function getFocusScrollOffset(instance, horizontal, offset) {
    if (!offset) {
      return null;
    }
    var type = typeof offset;
    switch (type) {
      case 'number':
        return offset;
      case 'string':
        return parseFocusScrollOffset(instance, offset);
      default:
        return null;
    }
  }
  function onFocus(e) {
    var elem = e.target;
    var preventScroll;
    var instantScroll;
    var itemBoundingClientRect;
    var direction;

    //console.log('focused element: ' + elem.className);
    var lastFocusInfo = _focusmanager.default.getLastFocusInfo();
    if (lastFocusInfo.element === elem) {
      var lastFocusOptions = lastFocusInfo.options;
      if (lastFocusOptions) {
        preventScroll = lastFocusOptions.preventScroll;
        instantScroll = lastFocusOptions.instantScroll;
        direction = lastFocusOptions.direction;
        // can only use this data once
        // also only use this data if preventScroll is supported, because otherwise the scroll will be happening twice (one automatic), and this will be out of sync.
        // this was causing https://emby.media/community/index.php?/topic/129788-top-portion-of-posterthumb-chopped-off-when-selected-on-home-screen/
        if (preventScrollSupported) {
          itemBoundingClientRect = lastFocusOptions.itemBoundingClientRect;
        }
        lastFocusOptions.itemBoundingClientRect = null;
      }
    } else {
      //console.log('focus came from elsewhere');
    }
    var options = this.options;
    if (preventScroll == null && options.autoPreventScrollOnFocus) {
      preventScroll = _layoutmanager.default.tv ? false : true;
    }
    if (preventScroll) {
      return;
    }
    var focused = /*focusManager.focusableParent(elem) ||*/elem;
    var horizontal = options.options;
    var dualScroll = options.dualScroll;
    var skipWhenAnyVisibleX;

    //if dual scroll: if direction is horizontal, don't allow any vertical shift.
    if (dualScroll) {
      switch (direction) {
        case 0:
        case 1:
          horizontal = true;
          dualScroll = false;
          break;
        case 2:
        case 3:
          skipWhenAnyVisibleX = true;
          break;
        default:
          break;
      }
    }
    if (focused) {
      //console.log('focusscroll: ' + this.options.focusScroll + '--' + focused.className + '--' + focused.innerHTML);
      this.to(this.options.focusScroll, focused, {
        useDelayedPromise: false,
        offsetLeft: options.focusScrollOffsetLeft,
        offsetTop: options.focusScrollOffsetTop,
        behavior: options.enableNativeScroll && !options.allowNativeSmoothScroll || instantScroll ? 'instant' : null,
        itemBoundingClientRect: itemBoundingClientRect,
        horizontal: horizontal,
        dualScroll: dualScroll,
        skipWhenAnyVisibleX: skipWhenAnyVisibleX,
        focusDirection: direction
      });
    }
  }
  function resetScroll() {
    this.scrollTop = 0;
    this.scrollLeft = 0;
  }
  function resetScrollTop() {
    this.scrollTop = 0;
  }
  function resetScrollLeft() {
    this.scrollLeft = 0;
  }

  /**
   * Mouse wheel delta normalization.
   *
   * @param  {Event} event
   *
   * @return {Int}
   */
  function normalizeWheelDelta(event, instance) {
    var options = instance.options;

    // wheelDelta needed only for IE8-
    instance.currentDelta = (options.horizontal ? event.deltaY || event.deltaX : event.deltaY) || -event.wheelDelta;
    if (!options.enableNativeScroll) {
      instance.currentDelta /= event.deltaMode === 1 ? 3 : 100;
    }
    return instance.currentDelta;
  }

  // Other global values
  var wheelEvent = document.implementation.hasFeature('Event.wheel', '3.0') ? 'wheel' : 'mousewheel';
  var interactiveElements = ['INPUT', 'SELECT', 'TEXTAREA'];

  // Math shorthands
  var abs = Math.abs;
  var round = Math.round;

  /**
   * Check whether element is interactive.
   *
   * @return {Boolean}
   */
  function isInteractive(element) {
    while (element) {
      if (interactiveElements.includes(element.tagName)) {
        return true;
      }
      element = element.parentNode;
    }
    return false;
  }
  var isSmoothScrollSupported = 'scrollBehavior' in document.documentElement.style;
  var SupportsScrollMethodOptions = isSmoothScrollSupported;
  function Scroller(frame, options) {
    // Extend options
    var o = Object.assign({}, {
      slidee: null,
      // Selector, DOM element with DOM element representing SLIDEE.
      horizontal: false,
      // Switch to horizontal mode.

      // Scrolling
      mouseWheel: true,
      scrollBy: 100,
      // Pixels or items to move per one mouse scroll. 0 to disable scrolling

      // Dragging
      dragSource: null,
      // Selector or DOM element for catching dragging events. Default is FRAME.
      dragThreshold: 3,
      // Distance in pixels before Sly recognizes dragging.

      // Mixed options
      speed: _skinviewmanager.default.getSkinOptions().scrollAnimationSpeed || 320,
      // Animations speed in milliseconds. 0 to disable animations.

      autoStartEdge: true,
      autoPreventScrollOnFocus: true,
      scrollTiming: _skinviewmanager.default.getSkinOptions().scrollTiming
    }, options);
    if (_skinviewmanager.default.getSkinOptions().scrollerAlwaysAllowNativeSmoothScroll) {
      o.allowNativeSmoothScroll = true;
    }
    if (_skinviewmanager.default.getSkinOptions().scrollerForceSmoothScroll) {
      o.forceSmoothScroll = true;
    }

    // native scroll is a must with touch input
    // also use native scroll when scrolling vertically in desktop mode - excluding horizontal because the mouse wheel support is choppy at the moment
    // in cases with firefox, if the smooth scroll api is supported then use that because their implementation is very good
    if (o.forceNativeScroll) {
      o.enableNativeScroll = true;
    } else if (o.forceSmoothScroll) {
      o.enableNativeScroll = !allowAnimatedScroll || isSmoothScrollSupported && o.allowNativeSmoothScroll;
    } else if (!_layoutmanager.default.tv) {
      o.enableNativeScroll = true;
    } else if (!allowAnimatedScroll) {
      // this check is simply used to detect older rendering engines
      o.enableNativeScroll = true;
    }
    o.inlineMultiplier = document.dir === 'rtl' ? -1 : 1;

    // Private variables
    this.options = o;

    // Frame
    var slideeElement = o.slidee;
    this.listenerCount = 0;
    this._pos = {
      endX: 0,
      endY: 0,
      scrollLeft: 0,
      scrollTop: 0
    };

    // Miscellaneous
    this.dragSourceElement = o.dragSource ? o.dragSource : frame;
    this.currentDelta = 0;

    // Expose properties
    this.initialized = 0;
    this.slideeElement = slideeElement;
    this.slideeElementStyle = slideeElement.style;
    this.options = o;
    this.dragging = {};
    this.contentRects = [];
    this.resizeListeners = [];

    // This is for the scroll buttons. Look for a better way to avoid the inconsistency
    var nativeScrollElement = frame;
    this.nativeScrollElement = nativeScrollElement;
    this.frame = frame;
    this.requiresReflow = true;
    this.frameSize = {
      width: 0,
      height: 0
    };
    this.slideeSize = {
      width: 0,
      height: 0
    };
    this.onSourceClickFn = onSourceClick.bind(this);
    this.onScrollForCachingFn = onScrollForCaching.bind(this);
  }
  function getOrAddContentRect(contentRects, target) {
    for (var i = 0, length = contentRects.length; i < length; i++) {
      var _rect = contentRects[i];
      if (_rect.target === target) {
        return _rect;
      }
    }
    var rect = {
      target: target
    };
    contentRects.push(rect);
    return rect;
  }
  function onResize(entries) {
    //console.log('onResize: ' + this.frame.className);

    var contentRects = this.contentRects;
    var hasResize = false;
    this._cachedScrollTop = null;
    this._cachedScrollLeft = null;
    this._cachedScrollHeight = null;
    this._cachedScrollWidth = null;
    this._framePadding = null;
    this._slideePadding = null;
    this._frameRect = null;
    for (var i = 0, length = entries.length; i < length; i++) {
      var entry = entries[i];
      if (!entry) {
        continue;
      }
      var newRect = entry.contentRect;

      // handle element being hidden
      if (newRect.width === 0 || newRect.height === 0) {
        continue;
      }
      var contentRect = contentRects ? getOrAddContentRect(contentRects, entry.target) : null;
      if (contentRect) {
        if (newRect.width !== contentRect.width || newRect.height !== contentRect.height) {
          //console.log('newRect.width: ' + newRect.width + ', contentRect.width: ' + contentRect.width + ', newRect.height: ' + newRect.height + ', contentRect.height: ' + contentRect.height);

          contentRect.width = newRect.width;
          contentRect.height = newRect.height;
          hasResize = true;
          break;
        }
      }
    }
    if (hasResize) {
      if (this.options.enableNativeScroll) {
        this.requiresReflow = true;
      } else {
        load(this, false);
      }
    }
    var listeners = this.resizeListeners;
    if (listeners) {
      for (var _i = 0, _length = listeners.length; _i < _length; _i++) {
        listeners[_i](entries);
      }
    }
  }

  /**
   * Loading function.
   *
   * Populate arrays, set sizes, bind events, ...
   *
   * @param {Boolean} [isInit] Whether load is called from within instance.init().
   * @return {Void}
   */
  function load(instance, isInit) {
    instance.requiresReflow = true;
    if (!isInit) {
      // get sizes now to ensure we stay in bounds, but get them again later on demand to ensure we get the latest values
      instance.ensureSizeInfo();
      var options = instance.options;
      if (!options.enableNativeScroll) {
        // Fix possible overflowing
        var pos = instance._pos;
        if (options.dualScroll) {
          //
        } else if (options.horizontal) {
          var newPos = within(instance.getScrollPosition(), 0, pos.endX);
          instance.scrollToPosition({
            position: newPos
          });
        } else {
          var _newPos = within(instance.getScrollPosition(), 0, pos.endY);
          instance.scrollToPosition({
            position: _newPos
          });
        }
      }
      instance.requiresReflow = true;
    }
  }

  /**
   * Stops dragging and cleans up after it.
   *
   * @return {Void}
   */
  function onDragEnd(instance) {
    var dragging = instance.dragging;
    dragging.released = true;
    var dragHandler = instance.dragHandler;
    if (dragHandler) {
      _dom.default.removeEventListener(document, 'pointermove', dragHandler, {
        passive: true
      });
      _dom.default.removeEventListener(document, 'pointerup', dragHandler, {
        passive: true
      });
    }

    // Make sure that onSourceClick is not active in next tick.
    setTimeout(function () {
      dragging.source.removeEventListener('click', instance.onSourceClickFn);
    });
    dragging.init = 0;
  }
  function calculateMomentum(current, start, time, lowerMargin, wrapperSize, deceleration) {
    var distance = current - start,
      speed = Math.abs(distance) / time;
    deceleration = deceleration === undefined ? 0.0006 : deceleration;

    //console.log('current: ' + current);

    var destination = current + speed /** speed*/ / (2 * deceleration) * (distance < 0 ? -1 : 1);
    var duration = speed / deceleration;

    //if (destination < lowerMargin) {
    //    destination = wrapperSize ? lowerMargin - (wrapperSize / 2.5 * (speed / 8)) : lowerMargin;
    //    distance = Math.abs(destination - current);
    //    duration = distance / speed;
    //}
    //else if (destination > 0) {
    //    destination = wrapperSize ? wrapperSize / 2.5 * (speed / 8) : 0;
    //    distance = Math.abs(current) + destination;
    //    duration = distance / speed;
    //}

    return {
      destination: Math.round(destination),
      duration: duration
    };
  }

  /**
   * Handler for dragging scrollbar handle or SLIDEE.
   *
   * @param  {Event} event
   *
   * @return {Void}
   */
  function dragHandler(event) {
    var dragging = this.dragging;
    var options = this.options;
    var released = event.type === 'pointerup';
    var touches = getTouches(event);
    var pointer = touches && touches.length ? touches[0] : event;
    var pathX = pointer.clientX - dragging.initX;
    var pathY = pointer.clientY - dragging.initY;
    var horizontal = options.horizontal;
    dragging.delta = horizontal ? pathX : pathY;

    //if (!options.horizontal) {
    //    console.log('dragging.delta: ' + dragging.delta);
    //}

    var absDelta = Math.abs(dragging.delta);
    if (!released && absDelta < 1) {
      return;
    }

    // We haven't decided whether this is a drag or not...
    if (!dragging.init) {
      // If the drag path was very short, maybe it's not a drag?
      if (absDelta < options.dragThreshold) {
        // If the pointer was released, the path will not become longer and it's
        // definitely not a drag. If not released yet, decide on next iteration
        return released ? onDragEnd(this) : undefined;
      } else {
        // If dragging path is sufficiently long we can confidently start a drag
        // if drag is in different direction than scroll, ignore it
        if (horizontal ? abs(pathX) > abs(pathY) : abs(pathX) < abs(pathY)) {
          dragging.init = 1;
        } else {
          return onDragEnd(this);
        }
      }
    }
    event.preventDefault();
    var newPosition = dragging.initPos - dragging.delta;
    var timeStamp = event.timeStamp;
    var duration = timeStamp - dragging.startTime;

    // Cancel dragging on release
    if (released) {
      onDragEnd(this);
      if (duration < 200 && absDelta <= 0) {

        // flick
      } else {
        var momentum = calculateMomentum(newPosition, dragging.momentumPos, duration, this.getScrollSize(), getFrameSize(this, horizontal));

        //console.log('momentum: ' + JSON.stringify(momentum));

        newPosition = Math.max(0, momentum.destination);
      }
    } else {
      // reset these if it's been a while
      if (duration > 300) {
        dragging.startTime = timeStamp;
        dragging.momentumPos = newPosition;
      }
    }
    this.scrollToPosition({
      behavior: released ? 'smooth' : 'instant',
      position: newPosition
    });
  }
  function getFrameSize(instance, horizontal, subtractPadding) {
    var frameSize = instance.frameSize;
    var result = horizontal ? frameSize.width : frameSize.height;
    if (subtractPadding) {
      return subtractPaddingFromFrameSize(instance, horizontal, result);
    }
    return result;
  }
  function subtractPaddingFromFrameSize(instance, horizontal, frameSize) {
    var padding = instance.getPadding();
    if (horizontal) {
      return frameSize - padding.inlineStart - padding.inlineEnd;
    }
    return frameSize - padding.top - padding.bottom;
  }
  function getTouches(e) {
    return e.changedTouches || e.targetTouches || e.touches;
  }
  function onDragStart(event) {
    if (event.button !== 0) {
      return;
    }
    var dragging = this.dragging;

    // Ignore when already in progress, or interactive element in non-touch navivagion
    if (dragging.init || isInteractive(event.target)) {
      return;
    }
    var options = this.options;

    // prevents native image dragging in Firefox
    event.preventDefault();

    // Properties used in dragHandler
    dragging.init = 0;
    dragging.startTime = event.timeStamp;
    dragging.source = event.target;
    var touches = getTouches(event);
    var pointer = touches && touches.length ? touches[0] : event;
    dragging.initX = pointer.clientX;
    dragging.initY = pointer.clientY;

    //if (!options.horizontal) {
    //    console.log('dragStart initY: ' + dragging.initY);
    //}

    dragging.momentumPos = dragging.initPos = this.getScrollPosition();
    dragging.delta = 0;
    dragging.locked = 0;
    dragging.source.addEventListener('click', this.onSourceClickFn);

    // Bind dragging events
    if (!options.enableNativeScroll) {
      var thisDragHandler = this.dragHandler;
      _dom.default.addEventListener(document, 'pointermove', thisDragHandler, {
        //passive: true
      });
      _dom.default.addEventListener(document, 'pointerup', thisDragHandler, {
        //passive: true
      });
    }
  }
  var SupportsTranslateProperty = CSS.supports('translate', '40px 100px');
  var TranslateProperty = SupportsTranslateProperty ? 'translate' : 'transform';

  /**
   * Initialize.
   *
   * @return {Object}
   */
  Scroller.prototype.init = function () {
    if (this.initialized) {
      return;
    }
    var options = this.options;
    var frame = this.frame;
    var slideeElement = this.slideeElement;
    if (options.enableNativeScroll) {
      var nativeScrollElement = this.nativeScrollElement;
      if (options.horizontal) {
        nativeScrollElement.classList.add('scrollX');
        if (options.miniScrollbar) {
          nativeScrollElement.classList.add('scrollX-mini');
        }
        if (options.hideScrollbar !== false || _layoutmanager.default.tv) {
          nativeScrollElement.classList.add('hiddenScrollX');
        }
        if (options.allowNativeSmoothScroll) {
          nativeScrollElement.classList.add('smoothScrollX');
        }
      } else {
        if (frame.closest('.dialog')) {
          nativeScrollElement.classList.add('dialog-scrollY');
        }
        nativeScrollElement.classList.add('scrollY');
        if (options.miniScrollbar) {
          nativeScrollElement.classList.add('scrollY-mini');
        }
        if (options.hideScrollbar || _layoutmanager.default.tv) {
          nativeScrollElement.classList.add('hiddenScrollY');
        }
        if (options.allowNativeSmoothScroll) {
          nativeScrollElement.classList.add('smoothScrollY');
        }
        if (options.forceScrollbar) {
          nativeScrollElement.classList.add('overflowYScroll');
        }
      }
    } else {
      frame.style.overflow = 'hidden';
      this.slideeElementStyle.transition = TranslateProperty + ' ' + options.speed + 'ms ease-out';
      this._lastTransitionValue = options.speed + 'ms';
    }

    // either the flex direction needs to be explicity specified, or flex-wrap applied so that the
    // scrollSlider can have a larger size than the frame

    if (options.horizontal) {
      if (_layoutmanager.default.tv) {
        frame.classList.add('scrollFrameX', 'scrollFrameX-tv', 'flex-direction-row');
      } else {
        frame.classList.add('scrollFrameX', 'flex-direction-row');
      }
      slideeElement.classList.add('scrollSliderX');
    } else {
      slideeElement.classList.add('scrollSliderY');
      frame.classList.add('scrollFrameY', 'flex-direction-column');
    }
    var dragStartHandler = onDragStart.bind(this);
    this.dragStartHandler = dragStartHandler;
    var mouseWheelHandler = onMouseWheelMove.bind(this);
    this.mouseWheelHandler = mouseWheelHandler;
    if (options.enableNativeScroll && _layoutmanager.default.tv && options.focusScroll) {
      // This can prevent others from being able to listen to mouse events
      _dom.default.addEventListener(this.dragSourceElement, 'mousedown', dragStartHandler, {
        //passive: true
      });
    }

    // this is always needed with animated scroll
    // and always needed with tv layouts due to the caching of this.frameSize
    addFrameResizeObserver(this);
    if (!options.enableNativeScroll) {
      this.dragSourceElement.style['touch-action'] = 'none';
      if (window.PointerEvent) {
        _dom.default.addEventListener(this.dragSourceElement, 'pointerdown', dragStartHandler, {
          //passive: true
        });
      } else {
        _dom.default.addEventListener(this.dragSourceElement, 'touchstart', dragStartHandler, {
          //passive: true
        });
        _dom.default.addEventListener(this.dragSourceElement, 'mousedown', dragStartHandler, {
          //passive: true
        });
      }

      // elem.focus() could be called by native code when tabbing
      if (options.dualScroll) {
        _dom.default.addEventListener(frame, 'scroll', resetScroll, {
          passive: true
        });
      } else if (options.horizontal) {
        _dom.default.addEventListener(frame, 'scroll', resetScrollLeft, {
          passive: true
        });
      } else {
        _dom.default.addEventListener(frame, 'scroll', resetScrollTop, {
          passive: true
        });
      }
      if (options.mouseWheel) {
        // Scrolling navigation
        _dom.default.addEventListener(frame, wheelEvent, mouseWheelHandler, {
          passive: true
        });
      }
    } else if (options.horizontal) {
      // Don't bind to mouse events with vertical scroll since the mouse wheel can handle this natively

      if (options.mouseWheel) {
        // Scrolling navigation
        _dom.default.addEventListener(frame, wheelEvent, mouseWheelHandler, {
          passive: true
        });
      }
    }
    if (options.focusScroll) {
      this.boundOnFrameClick = onFrameClick.bind(this);
      _dom.default.addEventListener(frame, 'click', this.boundOnFrameClick, {
        passive: true,
        capture: true
      });
      var focusHandler = this.focusHandler = onFocus.bind(this);
      _dom.default.addEventListener(frame, 'focus', focusHandler, {
        capture: true,
        passive: true
      });
    }

    // save this for later
    this.dragHandler = dragHandler.bind(this);

    // Mark instance as initialized
    this.initialized = 1;

    // Load
    load(this, true);

    // Return instance
    return this;
  };
  function addFrameResizeObserver(instance) {
    if (instance.frameResizeObserver) {
      return;
    }
    instance.frameResizeObserver = new ResizeObserver(onResize.bind(instance), {});
    if (instance.options.enableNativeScroll) {
      instance.frameResizeObserver.observe(instance.nativeScrollElement);

      // definitely need for the guide, but probably also anything that gets scrollSize/scrollWidth/scrollHeight
      instance.frameResizeObserver.observe(instance.slideeElement);
    } else {
      instance.frameResizeObserver.observe(instance.slideeElement);
      instance.frameResizeObserver.observe(instance.frame);
    }
  }

  /**
   * Mouse scrolling handler.
   *
   * @param  {Event} event
   *
   * @return {Void}
   */
  function onMouseWheelMove(event) {
    this.ensureSizeInfo();
    var options = this.options;
    var scrollBy = options.scrollBy;

    // Ignore if there is no scrolling to be done
    if (!scrollBy) {
      return;
    }
    var delta = normalizeWheelDelta(event, this);
    if (options.enableNativeScroll) {
      if (isSmoothScrollSupported) {
        delta *= 12;
      }
      this.scrollBy(delta);
    } else {
      this.scrollBy(scrollBy * delta);
    }
  }
  function scrollNative(instance, pos) {
    var elem = instance.nativeScrollElement;

    //console.log('scrollNative: ' + JSON.stringify(pos));

    var isInstant = pos.behavior === 'instant';

    // this is not having any effect in chrome when behavior is instant
    if (elem.scroll && !isInstant) {
      if (SupportsScrollMethodOptions) {
        // the browser will throw an error if it's null but not undefined
        if (pos.behavior == null) {
          pos.behavior = 'auto';
        }
        elem.scroll(pos);
      } else {
        elem.scroll(Math.round(pos.left || 0), Math.round(pos.top || 0));
      }
    } else if (elem.scrollTo && (SupportsScrollMethodOptions || !isInstant)) {
      if (SupportsScrollMethodOptions) {
        // the browser will throw an error if it's null but not undefined
        if (pos.behavior == null) {
          pos.behavior = 'auto';
        }
        elem.scrollTo(pos);
      } else {
        elem.scrollTo(Math.round(pos.left || 0), Math.round(pos.top || 0));
      }
    } else {
      if (pos.left != null) {
        elem.scrollLeft = Math.round(pos.left);
      }
      if (pos.top != null) {
        elem.scrollTop = Math.round(pos.top);
      }
    }
    instance._cachedScrollLeft = null;
    instance._cachedScrollTop = null;
    if (pos.useDelayedPromise === false) {
      return Promise.resolve();
    }
    if (!isSmoothScrollSupported || isInstant) {
      return setTimeoutPromise(0);
    }
    return setTimeoutPromise(100);
  }
  function buildTranslateValue(left, top) {
    if (!left && !top) {
      return 'none';
    }
    if (SupportsTranslateProperty) {
      return left + 'px ' + top + 'px';
    }
    return 'translate(' + left + 'px, ' + top + 'px)';
  }
  function dispatchScrollEventIfNeeded(instance) {
    if (instance.options.dispatchScrollEvent) {
      instance.frame.dispatchEvent(new CustomEvent(instance.getScrollEventName(), {
        bubbles: false,
        cancelable: false
      }));
    }
  }
  function setTimeoutPromise(delay) {
    return new Promise(function (resolve, reject) {
      setTimeout(resolve, delay);
    });
  }

  //let UseNativeAnimation = SupportsTranslateProperty && document.documentElement.animate != null && document.documentElement.getAnimations;

  function renderAnimateWithTransform(instance, scrollOptions, immediate, useDelayedPromise) {
    var options = instance.options;
    var speed = options.speed;
    if (immediate) {
      speed = 0;
    }
    var left = scrollOptions.left;
    var top = scrollOptions.top;
    if (left == null) {
      left = instance.getScrollLeft();
    }
    if (top == null) {
      top = instance.getScrollTop();
    }
    var value = buildTranslateValue(-round(left), -round(top));
    //console.log('renderAnimateWithTransform: ' + value);

    //console.log('renderAnimateWithTransform: to: ' + toPosition);

    //if (UseNativeAnimation) {

    //    if (instance.currentAnimation) {
    //        //instance.currentAnimation.pause();
    //    }

    //    let animation = elem.animate([
    //        {
    //            translate: value
    //        }
    //    ], {
    //        // timing options
    //        duration: speed,
    //        iterations: 1,
    //        easing: 'ease-out',
    //        fill: 'forwards'
    //    });

    //    instance.currentAnimation = animation;

    //    //animation.commitStyles();

    //} else {
    var lastTransitionValue = instance._lastTransitionValue;
    var scrollTiming = options.scrollTiming || 'ease-out';
    var newTransitionValue = TranslateProperty + ' ' + speed + 'ms ' + scrollTiming;
    if (newTransitionValue !== lastTransitionValue) {
      //console.log('reset');
      instance.slideeElementStyle.transitionDuration = newTransitionValue;
      instance._lastTransitionValue = newTransitionValue;
    }
    instance.slideeElementStyle[TranslateProperty] = value;
    //setTransformWithTimeout(instance, value);

    if (scrollOptions.left != null) {
      instance._pos.scrollLeft = scrollOptions.left;
    }
    if (scrollOptions.top != null) {
      instance._pos.scrollTop = scrollOptions.top;
    }
    dispatchScrollEventIfNeeded(instance);
    if (useDelayedPromise === false) {
      return Promise.resolve();
    }
    return setTimeoutPromise(speed);
  }

  /**
    * Animate to a position.
    *
    * @param {Int}  newPos    New position.
    * @param {Bool} immediate Reposition immediately without an animation.
    *
    * @return {Void}
    */
  Scroller.prototype.slideTo = function (scrollOptions, fullItemPosX, fullItemPosY) {
    this.ensureSizeInfo();
    var pos = this._pos;
    if (!scrollOptions) {
      scrollOptions = {};
    }
    var options = this.options;
    var horizontal = scrollOptions.horizontal == null ? options.horizontal : scrollOptions.horizontal;
    var dualScroll = scrollOptions.dualScroll == null ? options.dualScroll : scrollOptions.dualScroll;
    if (!options.enableNativeScroll) {
      if (horizontal || dualScroll) {
        if (scrollOptions.left != null) {
          scrollOptions.left = within(scrollOptions.left, 0, pos.endX);
        }
      }
      if (!horizontal || dualScroll) {
        if (scrollOptions.top != null) {
          scrollOptions.top = within(scrollOptions.top, 0, pos.endY);
        }
      }
    }
    if (scrollOptions.skipWhenVisibleX || scrollOptions.skipWhenVisibleY) {
      if (fullItemPosX || fullItemPosY) {
        var skipX = true;
        var skipY = true;
        if (horizontal || dualScroll) {
          if (!fullItemPosX || !(fullItemPosX.isVisible || scrollOptions.skipWhenAnyVisibleX && fullItemPosX.anyVisible)) {
            skipX = false;
          }
        }
        if (!horizontal || dualScroll) {
          if (!fullItemPosY || !(fullItemPosY.isVisible || scrollOptions.skipWhenAnyVisibleY && fullItemPosY.anyVisible)) {
            skipY = false;
          }
        }
        if (skipX && skipY) {
          return Promise.resolve();
        }
        if (skipX) {
          if (scrollOptions.left != null) {
            delete scrollOptions.left;
          }
        }
        if (skipY) {
          if (scrollOptions.top != null) {
            delete scrollOptions.top;
          }
        }
      } else if (scrollOptions.itemSize) {
        var halfSize = scrollOptions.itemSize / 2;
        var slideeOffset = scrollOptions.slideeOffset || (scrollOptions.slideeOffset = options.enableNativeScroll ? this.getScrollContainerBoundingClientRect() : this.slideeElement.getBoundingClientRect());
        var left = scrollOptions.left;
        var top = scrollOptions.top;
        if (left == null) {
          left = this.getScrollLeft();
        }
        if (top == null) {
          top = this.getScrollTop();
        }
        var elementPositionOptions = {
          itemBoundingClientRect: {
            width: horizontal ? scrollOptions.itemSize : null,
            height: horizontal ? null : scrollOptions.itemSize,
            left: horizontal ? slideeOffset.left + left - halfSize : null,
            top: horizontal ? null : slideeOffset.top + top - halfSize,
            right: horizontal ? slideeOffset.left + left + halfSize : null
          },
          location: scrollOptions.location
        };
        if (options.enableNativeScroll) {
          var scrollPos = horizontal ? this.getScrollLeft() : this.getScrollTop();
          if (horizontal) {
            elementPositionOptions.itemBoundingClientRect.left -= scrollPos;
            elementPositionOptions.itemBoundingClientRect.right -= scrollPos;
          } else {
            elementPositionOptions.itemBoundingClientRect.top -= scrollPos;
          }
        }
        var posInfo = this.getElementPosition(null, horizontal, elementPositionOptions);
        if (posInfo.isVisible || (horizontal ? scrollOptions.skipWhenAnyVisibleX : scrollOptions.skipWhenAnyVisibleY) && posInfo.anyVisible) {
          return Promise.resolve();
        }
      }
    }

    //console.log('slideTo: ' + JSON.stringify(scrollOptions));
    //console.log('slideTo: ' + JSON.stringify(scrollOptions) + '--' + new Error().stack);

    var useDelayedPromise = scrollOptions.useDelayedPromise;
    if (horizontal || dualScroll) {
      var scrollLeftValue = scrollOptions.left;
      var scrollSnapSizeX = options.scrollSnapSizeX;
      if (scrollLeftValue != null && scrollSnapSizeX != null) {
        //console.log('scrollSnapSizeX: ' + scrollSnapSizeX);

        var direction = scrollOptions.focusDirection;
        switch (direction) {
          //case 0:
          //    scrollOptions.left -= remainder;
          //    break;
          case 1:
            {
              var snapBackRemainder = scrollLeftValue % scrollSnapSizeX;
              if (snapBackRemainder < 10) {
                //console.log('snapBackRemainder: ' + snapBackRemainder);
                scrollOptions.left -= snapBackRemainder;
              } else {
                var remainder = scrollSnapSizeX - scrollLeftValue % scrollSnapSizeX;
                //console.log('remainder: ' + remainder);
                scrollOptions.left += remainder;
              }
            }
            break;
          default:
            {
              var _snapBackRemainder = scrollSnapSizeX - scrollLeftValue % scrollSnapSizeX;
              if (_snapBackRemainder < 10) {
                //console.log('snapBackRemainder: ' + snapBackRemainder);
                scrollOptions.left += _snapBackRemainder;
              } else {
                var _remainder = scrollLeftValue % scrollSnapSizeX;
                //console.log('remainder: ' + remainder);
                scrollOptions.left -= _remainder;
              }
            }
            break;
        }
      }
    }
    if (options.enableNativeScroll) {
      return scrollNative(this, scrollOptions);
    }

    // Start animation rendering
    if (scrollOptions.left != null && scrollOptions.left !== pos.scrollLeft || scrollOptions.top != null && scrollOptions.top !== pos.scrollTop) {
      var immediate = scrollOptions.behavior === 'instant';
      return renderAnimateWithTransform(this, scrollOptions, immediate, useDelayedPromise);
    }

    //console.log('skipping scroll');

    return Promise.resolve();
  };
  Scroller.prototype.scrollToPosition = function (pos) {
    var options = this.options;
    if (pos.position != null) {
      if (options.horizontal) {
        pos.left = pos.position;
      } else {
        pos.top = pos.position;
      }
      pos.position = null;
      delete pos.position;
    }
    if (!options.enableNativeScroll) {
      return this.slideTo(pos);
    }
    var hasLeft = pos.left != null;
    var hasTop = pos.top != null;
    if (hasLeft && hasTop) {
      pos.behavior = 'instant';
      return scrollNative(this, pos);
    }
    if (options.horizontal) {
      if (hasLeft) {
        // if not defined, then make one-off scrolls smooth (scroll buttons, a-z picker)
        if (!pos.behavior) {
          pos.behavior = isSmoothScrollSupported && !_layoutmanager.default.tv ? 'smooth' : 'auto';
        }
        return this.slideTo(pos);
      }
    } else {
      if (hasTop) {
        // if not defined, then make one-off scrolls smooth (scroll buttons, a-z picker)
        if (!pos.behavior) {
          pos.behavior = isSmoothScrollSupported && !_layoutmanager.default.tv ? 'smooth' : 'auto';
        }
        return this.slideTo(pos);
      }
    }
    pos.behavior = 'instant';
    return scrollNative(this, pos);
  };

  /**
   * Returns the position object.
   *
   * @param {Mixed} item
   *
   * @return {Object}
   */
  Scroller.prototype.getElementPosition = function (item, horizontal, scrollOptions) {
    var options = this.options;
    var enableNativeScroll = options.enableNativeScroll;
    var slideeOffset = scrollOptions.slideeOffset || (scrollOptions.slideeOffset = enableNativeScroll ? this.getScrollContainerBoundingClientRect() : this.slideeElement.getBoundingClientRect());
    var itemOffset = scrollOptions.itemBoundingClientRect || (scrollOptions.itemBoundingClientRect = item.getBoundingClientRect());
    var multiplier = horizontal ? this.getScrollLeftMultiplier() : this.getScrollTopMultiplier();
    var startOffset = horizontal ? multiplier === -1 ? itemOffset.right - slideeOffset.right : itemOffset.left - slideeOffset.left : itemOffset.top - slideeOffset.top;
    var size = horizontal ? itemOffset.width : itemOffset.height;
    if (!size && size !== 0) {
      size = item[horizontal ? 'offsetWidth' : 'offsetHeight'];
    }
    var centerOffset = options.centerOffset || 0;
    var scrollPos = horizontal ? this.getScrollLeft() : this.getScrollTop();
    if (enableNativeScroll) {
      startOffset += scrollPos;
    }
    var startOffsetForPositioning = startOffset;
    var scrollOffset = horizontal ? scrollOptions.offsetLeft : scrollOptions.offsetTop;
    var focusScrollOffset;
    if (scrollOffset) {
      focusScrollOffset = getFocusScrollOffset(this, horizontal, scrollOffset) || 0;
      //if (horizontal) {
      //    scrollOptions.focusScrollOffsetLeft = focusScrollOffset;
      //} else {
      //    scrollOptions.focusScrollOffsetTop = focusScrollOffset;
      //}
      startOffsetForPositioning += focusScrollOffset;
    }
    this.ensureSizeInfo();
    var frameSizeForComparison = (horizontal ? scrollOptions.frameWidthForComparison : scrollOptions.frameHeightForComparison) || getFrameSize(this, horizontal, false);
    var absScrollPos = Math.abs(scrollPos);
    var currentEnd = absScrollPos + frameSizeForComparison;
    if (scrollOptions.location === AdaptiveLocation) {
      var adaptiveBorderStart = (horizontal ? scrollOptions.adaptiveBorderXStart : scrollOptions.adaptiveBorderYStart) || 0;
      var adaptiveBorderEnd = (horizontal ? scrollOptions.adaptiveBorderXEnd : scrollOptions.adaptiveBorderYEnd) || 0;
      absScrollPos += adaptiveBorderStart;
      currentEnd -= adaptiveBorderEnd;
    }
    var absStartOffset = Math.abs(startOffset);
    var isVisible = Math.abs(startOffsetForPositioning) >= absScrollPos && absStartOffset + size <= currentEnd;
    var anyVisible = isVisible || Math.abs(startOffsetForPositioning) + size >= absScrollPos && absStartOffset <= currentEnd;
    var frameSize = subtractPaddingFromFrameSize(this, horizontal, frameSizeForComparison);

    // substracting focusScrollOffset from these is needed for the guide
    var centerPos = startOffsetForPositioning + centerOffset - (frameSize / 2 - size / 2) * multiplier - (focusScrollOffset || 0);
    var endPos = startOffsetForPositioning - (frameSize - size) * multiplier - (focusScrollOffset || 0);

    //console.log('elem: ' + item?.className + ', frameSize: ' + frameSize + ', scrollPos:' + scrollPos + ', size:' + size + '  currentEnd:' + currentEnd + ', absScrollPos: ' + absScrollPos + ', absStartOffset: ' + absStartOffset + ', startOffsetForPositioning: ' + startOffsetForPositioning + ', centerPos: ' + centerPos + ', endPos: ' + endPos + ', isVisible: ' + isVisible + ', anyVisible: ' + anyVisible);

    return {
      start: startOffsetForPositioning,
      center: centerPos,
      end: endPos,
      isVisible: isVisible,
      anyVisible: anyVisible,
      size: size
    };
  };
  Scroller.prototype.ensureSizeInfo = function () {
    if (this.requiresReflow) {
      this.requiresReflow = false;

      // Reset global variables

      var frame = this.frame;
      var options = this.options;
      var horizontal = options.horizontal;
      var newFrameSize = {};
      var dualScroll = options.dualScroll;
      if (horizontal || dualScroll) {
        newFrameSize.width = frame.offsetWidth;
      }
      if (!horizontal || dualScroll) {
        newFrameSize.height = frame.offsetHeight;
      }
      //console.log('newFrameSize: ' + JSON.stringify(newFrameSize));
      this.frameSize = newFrameSize;
      if (!options.enableNativeScroll) {
        var slideeElement = this.slideeElement;
        var slideePadding = this.getSlideePadding();
        this.slideeSize = {
          width: Math.max(slideeElement.offsetWidth, slideeElement.scrollWidth) + slideePadding.inlineStart + slideePadding.inlineEnd,
          height: Math.max(slideeElement.offsetHeight, slideeElement.scrollHeight) + slideePadding.top + slideePadding.bottom
        };

        //console.log('startPadding: ' + startPadding);

        if (horizontal || dualScroll) {
          this._pos.endX = Math.max(this.getScrollWidth() - getFrameSize(this, true, true), 0) * this.getScrollLeftMultiplier();
        }
        if (!horizontal || dualScroll) {
          this._pos.endY = Math.max(this.getScrollHeight() - getFrameSize(this, false, true), 0) * this.getScrollTopMultiplier();
        }
      }
      //console.log('this._pos.end: ' + this._pos.end);
    }
  };
  Scroller.prototype.getScrollEventName = function () {
    return this.options.enableNativeScroll ? 'scroll' : 'scrollanimate';
  };
  Scroller.prototype.getScrollContainerBoundingClientRect = function () {
    if (!this.frameResizeObserver) {
      addFrameResizeObserver(this);
      return this.nativeScrollElement.getBoundingClientRect();
    }
    var rect = this._frameRect;
    if (rect == null) {
      rect = this.nativeScrollElement.getBoundingClientRect();
      this._frameRect = rect;
    }
    return rect;
  };
  Scroller.prototype.getScrollSlider = function () {
    return this.slideeElement;
  };
  Scroller.prototype.addScrollEventListener = function (fn, options) {
    this.listenerCount++;
    this.options.dispatchScrollEvent = this.listenerCount > 0;
    // only cache if preventScroll is supported
    // discussion here: https://github.com/MediaBrowser/SamES/issues/130
    this.options.cacheScrollPositions = this.options.dispatchScrollEvent && preventScrollSupported;
    if (this.options.cacheScrollPositions) {
      this.addScrollCacheListener();
    }
    var elem = this.options.enableNativeScroll ? this.nativeScrollElement : this.frame;
    _dom.default.addEventListener(elem, this.getScrollEventName(), fn, options);
  };
  Scroller.prototype.removeScrollEventListener = function (fn, options) {
    this.listenerCount = Math.max(this.listenerCount - 1, 0);
    this.options.dispatchScrollEvent = this.listenerCount > 0;
    this.options.cacheScrollPositions = this.options.dispatchScrollEvent && preventScrollSupported;
    if (!this.options.cacheScrollPositions) {
      this.removeScrollCacheListener();
    }
    var elem = this.options.enableNativeScroll ? this.nativeScrollElement : this.frame;
    _dom.default.removeEventListener(elem, this.getScrollEventName(), fn, options);
  };
  function onScrollForCaching(e) {
    this._cachedScrollTop = null;
    this._cachedScrollLeft = null;
  }
  Scroller.prototype.addScrollCacheListener = function () {
    if (!this.options.enableNativeScroll) {
      return;
    }
    if (this._scrollCacheListenerBound) {
      return;
    }
    this._scrollCacheListenerBound = true;
    _dom.default.addEventListener(this.nativeScrollElement, 'scroll', this.onScrollForCachingFn, {
      passive: true
    });
  };
  Scroller.prototype.removeScrollCacheListener = function () {
    var elem = this.nativeScrollElement;
    if (!elem) {
      return;
    }
    this._scrollCacheListenerBound = false;
    _dom.default.removeEventListener(elem, 'scroll', this.onScrollForCachingFn, {
      passive: true
    });
  };
  Scroller.prototype.addResizeObserver = function (fn) {
    addFrameResizeObserver(this);
    if (this.resizeListeners) {
      this.resizeListeners.push(fn);
    }
  };
  Scroller.prototype.removeResizeObserver = function (fn) {
    if (this.resizeListeners) {
      var index = this.resizeListeners.indexOf(fn);
      if (index > -1) {
        this.resizeListeners.splice(index, 1); // 2nd parameter means remove one item only
      }
    }
  };
  Scroller.prototype.isNativeScroll = function (item) {
    return this.options.enableNativeScroll;
  };
  Scroller.prototype.getScrollPosition = function () {
    if (this.options.horizontal) {
      return this.getScrollLeft();
    } else {
      return this.getScrollTop();
    }
  };
  Scroller.prototype.getLastScrollPosition = function () {
    if (this.options.horizontal) {
      return this.getLastScrollLeft();
    } else {
      return this.getLastScrollTop();
    }
  };
  Scroller.prototype.getScrollLeft = function () {
    var options = this.options;
    if (!options.enableNativeScroll) {
      return this._pos.scrollLeft;
    }
    if (options.cacheScrollPositions) {
      var scrollLeft = this._cachedScrollLeft;
      if (scrollLeft == null) {
        scrollLeft = this.nativeScrollElement.scrollLeft;
        this._cachedScrollLeft = scrollLeft;
      }
      return scrollLeft;
    } else {
      return this.nativeScrollElement.scrollLeft;
    }
  };
  Scroller.prototype.getScrollMultiplier = function () {
    if (this.options.horizontal) {
      return this.getScrollLeftMultiplier();
    }
    return this.getScrollTopMultiplier();
  };
  Scroller.prototype.getScrollLeftMultiplier = function () {
    return this.options.inlineMultiplier;
  };
  Scroller.prototype.getScrollTopMultiplier = function () {
    return 1;
  };
  Scroller.prototype.getLastScrollLeft = function () {
    return this._cachedScrollLeft;
  };
  Scroller.prototype.getScrollTop = function () {
    var options = this.options;
    if (!options.enableNativeScroll) {
      return this._pos.scrollTop;
    }
    if (options.cacheScrollPositions) {
      var scrollTop = this._cachedScrollTop;
      if (scrollTop == null) {
        scrollTop = this.nativeScrollElement.scrollTop;
        this._cachedScrollTop = scrollTop;
      }
      return scrollTop;
    } else {
      return this.nativeScrollElement.scrollTop;
    }
  };
  Scroller.prototype.getLastScrollTop = function () {
    return this._cachedScrollTop;
  };
  Scroller.prototype.getScrollSize = function () {
    if (this.options.horizontal) {
      return this.getScrollWidth();
    } else {
      return this.getScrollHeight();
    }
  };
  Scroller.prototype.getPadding = function () {
    addFrameResizeObserver(this);
    var padding = this._framePadding;
    if (padding) {
      return padding;
    }
    var style = getComputedStyle(this.frame);
    var inlineStart = parsePxToInt(style.getPropertyValue(PaddingInlineStartProp));
    var inlineEnd = parsePxToInt(style.getPropertyValue(PaddingInlineEndProp));
    var top = parsePxToInt(style.getPropertyValue('padding-top'));
    var bottom = parsePxToInt(style.getPropertyValue('padding-bottom'));
    padding = {
      inlineStart: inlineStart,
      inlineEnd: inlineEnd,
      top: top,
      bottom: bottom
    };
    this._framePadding = padding;
    return padding;
  };
  Scroller.prototype.getSlideePadding = function () {
    addFrameResizeObserver(this);
    var padding = this._slideePadding;
    if (padding) {
      return padding;
    }
    var style = getComputedStyle(this.slideeElement);
    var inlineStart = parsePxToInt(style.getPropertyValue(PaddingInlineStartProp));
    var inlineEnd = parsePxToInt(style.getPropertyValue(PaddingInlineEndProp));
    var top = parsePxToInt(style.getPropertyValue('padding-top'));
    var bottom = parsePxToInt(style.getPropertyValue('padding-bottom'));
    padding = {
      inlineStart: inlineStart,
      inlineEnd: inlineEnd,
      top: top,
      bottom: bottom
    };
    this._slideePadding = padding;
    return padding;
  };
  Scroller.prototype.getScrollWidth = function () {
    var options = this.options;
    if (!options.enableNativeScroll) {
      return this.slideeSize.width;
    }
    addFrameResizeObserver(this);
    var value = this._cachedScrollWidth;
    // don't use a cached 0 size because ResizeObserver due to issues with the guide. It is not always triggering immediately and this can cause incorrect usage of a 0 value
    if (!value) {
      value = this.nativeScrollElement.scrollWidth;
      this._cachedScrollWidth = value;
    }
    return value;
  };
  Scroller.prototype.getScrollHeight = function () {
    var options = this.options;
    if (!options.enableNativeScroll) {
      return this.slideeSize.height;
    }
    addFrameResizeObserver(this);
    var value = this._cachedScrollHeight;
    // don't use a cached 0 size because ResizeObserver due to issues with the guide. It is not always triggering immediately and this can cause incorrect usage of a 0 value
    if (!value) {
      value = this.nativeScrollElement.scrollHeight;
      this._cachedScrollHeight = value;
    }
    return value;
  };

  /**
   * Slide SLIDEE by amount of pixels.
   *
   * @param {Int}  delta     Pixels/Items. Positive means forward, negative means backward.
   * @param {Bool} immediate Reposition immediately without an animation.
   *
   * @return {Void}
   */
  Scroller.prototype.scrollBy = function (delta, scrollOptions) {
    if (!delta) {
      return;
    }
    var options = this.options;
    if (options.enableNativeScroll) {
      if (options.horizontal) {
        this.nativeScrollElement.scrollLeft += delta;
      } else {
        this.nativeScrollElement.scrollTop += delta;
      }
    } else {
      if (!scrollOptions) {
        scrollOptions = {};
      }
      scrollOptions.position = this.getScrollPosition() + delta;
      this.scrollToPosition(scrollOptions);
    }
  };

  /**
   * Core method for handling `toLocation` methods.
   *
   * @param  {String} location
   * @param  {Mixed}  item
   * @param  {Bool}   immediate
   *
   * @return {Void}
   */
  Scroller.prototype.to = function (toLocation, item, scrollOptions) {
    if (!scrollOptions) {
      scrollOptions = {};
    }
    var options = this.options;
    var horizontal = scrollOptions.horizontal == null ? options.horizontal : scrollOptions.horizontal;
    var dualScroll = scrollOptions.dualScroll == null ? options.dualScroll : scrollOptions.dualScroll;
    var adaptiveScroll = toLocation === AdaptiveLocation;

    // get this earlier so that it doesn't have to be done twice (getElementPosition and slideTo)
    scrollOptions.slideeOffset = options.enableNativeScroll ? this.getScrollContainerBoundingClientRect() : this.slideeElement.getBoundingClientRect();
    var itemPosX, itemPosY;
    if (horizontal || dualScroll) {
      var location = toLocation;
      horizontal = true;
      var frameSizeForComparison = getFrameSize(this, horizontal);

      // so that we don't have to get it again in getElementPosition
      scrollOptions.frameWidthForComparison = frameSizeForComparison;
      var adaptiveBorderStart = options.adaptiveBorderXStart;
      if (adaptiveBorderStart == null) {
        adaptiveBorderStart = Math.max(horizontal ? frameSizeForComparison * 0.03 : frameSizeForComparison * 0.08, 30);
      }
      var adaptiveBorderEnd = options.adaptiveBorderXEnd;
      if (adaptiveBorderEnd == null) {
        adaptiveBorderEnd = Math.max(horizontal ? frameSizeForComparison * 0.03 : frameSizeForComparison * 0.08, 30);
      }
      scrollOptions.location = location;
      scrollOptions.adaptiveBorderXStart = adaptiveBorderStart;
      scrollOptions.adaptiveBorderXEnd = adaptiveBorderEnd;
      var itemPos = this.getElementPosition(item, horizontal, scrollOptions);
      if (adaptiveScroll) {
        var multiplier = horizontal ? this.getScrollLeftMultiplier() : this.getScrollTopMultiplier();
        var scrollPosition = (horizontal ? this.getScrollLeft() : this.getScrollTop()) * multiplier;
        var _options = this.options;
        adaptiveBorderStart *= multiplier;
        adaptiveBorderEnd *= multiplier;
        itemPos[StartLocation] -= adaptiveBorderStart;
        itemPos[EndLocation] += adaptiveBorderEnd;
        var startEdge = 0;
        if (_options.autoStartEdge) {
          var framePadding = this.getPadding();
          var slideePadding = this.getSlideePadding();
          var startPadding = horizontal ? framePadding.inlineStart + slideePadding.inlineStart : framePadding.top + slideePadding.top;
          var endPadding = horizontal ? framePadding.inlineEnd + slideePadding.inlineEnd : framePadding.bottom + slideePadding.bottom;
          if (itemPos[EndLocation] * multiplier >= (horizontal ? this._pos.endX : this._pos.endY) - startPadding - endPadding * 2 - itemPos.size) {
            itemPos[EndLocation] += endPadding;
            if (_options.enableNativeScroll) {
              // little bit of a hack
              // https://emby.media/community/index.php?/topic/141446-playback-settings-screen-chopped-off-at-bottom/#comment-1463689
              itemPos[EndLocation] += endPadding;
            }
          }
          startEdge = startPadding;
        }
        if (itemPos[StartLocation] * multiplier < startEdge && itemPos[StartLocation] !== 0) {
          itemPos[StartLocation] = 0;
        }
        if (itemPos[StartLocation] * multiplier <= scrollPosition) {
          location = StartLocation;
        } else if (itemPos[EndLocation] * multiplier >= scrollPosition) {
          location = EndLocation;
        } else {
          location = CenterLocation;
        }

        //console.log('adaptiveScroll horizontal: ' + horizontal + ', scrollPosition: ' + scrollPosition + ', location: ' + location + ', itemPos: ' + JSON.stringify(itemPos));
        scrollOptions.skipWhenVisibleX = true;
      }
      itemPosX = itemPos;
      scrollOptions.left = itemPos[location];
      //console.log('scrollOptions.left: ' + scrollOptions.left);
    }
    if (!horizontal || dualScroll) {
      var _location = toLocation;
      horizontal = false;
      var _frameSizeForComparison = getFrameSize(this, horizontal);

      // so that we don't have to get it again in getElementPosition
      scrollOptions.frameHeightForComparison = _frameSizeForComparison;
      var _adaptiveBorderStart = options.adaptiveBorderYStart;
      if (_adaptiveBorderStart == null) {
        _adaptiveBorderStart = Math.max(horizontal ? _frameSizeForComparison * 0.03 : _frameSizeForComparison * 0.08, 30);
      }
      var _adaptiveBorderEnd = options.adaptiveBorderYEnd;
      if (_adaptiveBorderEnd == null) {
        _adaptiveBorderEnd = Math.max(horizontal ? _frameSizeForComparison * 0.03 : _frameSizeForComparison * 0.08, 30);
      }
      scrollOptions.location = _location;
      scrollOptions.adaptiveBorderYStart = _adaptiveBorderStart;
      scrollOptions.adaptiveBorderYEnd = _adaptiveBorderEnd;
      var _itemPos = this.getElementPosition(item, horizontal, scrollOptions);
      if (adaptiveScroll) {
        var _multiplier = horizontal ? this.getScrollLeftMultiplier() : this.getScrollTopMultiplier();
        var _scrollPosition = (horizontal ? this.getScrollLeft() : this.getScrollTop()) * _multiplier;
        var _options2 = this.options;
        _adaptiveBorderStart *= _multiplier;
        _adaptiveBorderEnd *= _multiplier;
        _itemPos[StartLocation] -= _adaptiveBorderStart;
        _itemPos[EndLocation] += _adaptiveBorderEnd;
        var _startEdge = 0;
        if (_options2.autoStartEdge) {
          var _framePadding = this.getPadding();
          var _slideePadding = this.getSlideePadding();
          var _startPadding = horizontal ? _framePadding.inlineStart + _slideePadding.inlineStart : _framePadding.top + _slideePadding.top;
          var _endPadding = horizontal ? _framePadding.inlineEnd + _slideePadding.inlineEnd : _framePadding.bottom + _slideePadding.bottom;
          if (_itemPos[EndLocation] * _multiplier >= (horizontal ? this._pos.endX : this._pos.endY) - _startPadding - _endPadding * 2 - _itemPos.size) {
            _itemPos[EndLocation] += _endPadding;
            if (_options2.enableNativeScroll) {
              // little bit of a hack
              // https://emby.media/community/index.php?/topic/141446-playback-settings-screen-chopped-off-at-bottom/#comment-1463689
              _itemPos[EndLocation] += _endPadding;
            }
          }
          _startEdge = _startPadding;
        }
        if (_itemPos[StartLocation] * _multiplier < _startEdge && _itemPos[StartLocation] !== 0) {
          _itemPos[StartLocation] = 0;
        }
        if (_itemPos[StartLocation] * _multiplier <= _scrollPosition) {
          _location = StartLocation;
        } else if (_itemPos[EndLocation] * _multiplier >= _scrollPosition) {
          _location = EndLocation;
        } else {
          _location = CenterLocation;
        }

        //console.log('adaptiveScroll horizontal: ' + horizontal + ', scrollPosition: ' + scrollPosition + ', location: ' + location + ', itemPos: ' + JSON.stringify(itemPos));
        scrollOptions.skipWhenVisibleY = true;
      }
      itemPosY = _itemPos;
      scrollOptions.top = _itemPos[_location];
      //console.log('scrollOptions.top: ' + scrollOptions.top);
    }
    this.slideTo(scrollOptions, itemPosX, itemPosY);
  };

  /**
   * Animate element or the whole SLIDEE to the start of the frame.
   *
   * @param {Mixed} item      Item DOM element, or index starting at 0. Omitting will animate SLIDEE.
   * @param {Bool}  immediate Reposition immediately without an animation.
   *
   * @return {Void}
   */
  Scroller.prototype.toStart = function (item, scrollOptions) {
    this.to('start', item, scrollOptions);
  };

  /**
   * Animate element or the whole SLIDEE to the end of the frame.
   *
   * @param {Mixed} item      Item DOM element, or index starting at 0. Omitting will animate SLIDEE.
   * @param {Bool}  immediate Reposition immediately without an animation.
   *
   * @return {Void}
   */
  Scroller.prototype.toEnd = function (item, scrollOptions) {
    this.to('end', item, scrollOptions);
  };
  Scroller.prototype.scrollToElement = function (item, scrollOptions) {
    if (!scrollOptions) {
      scrollOptions = {};
    }
    var options = this.options;
    if (scrollOptions.offsetLeft == null) {
      scrollOptions.offsetLeft = options.focusScrollOffsetLeft;
    }
    if (scrollOptions.offsetTop == null) {
      scrollOptions.offsetTop = options.focusScrollOffsetTop;
    }
    if (options.enableNativeScroll && !options.allowNativeSmoothScroll) {
      scrollOptions.behavior = 'instant';
    }
    return this.to(options.focusScroll || StartLocation, item, scrollOptions);
  };

  /**
   * Animate element or the whole SLIDEE to the center of the frame.
   *
   * @param {Mixed} item      Item DOM element, or index starting at 0. Omitting will animate SLIDEE.
   * @param {Bool}  immediate Reposition immediately without an animation.
   *
   * @return {Void}
   */
  Scroller.prototype.toCenter = function (item, scrollOptions) {
    this.to(CenterLocation, item, scrollOptions);
  };
  Scroller.prototype.scrollBackwards = function () {
    this.scrollBy(0 - this.options.scrollBy);
  };
  Scroller.prototype.scrollForwards = function () {
    this.scrollBy(this.options.scrollBy);
  };
  Scroller.prototype.notifyResized = function () {
    onResize.call(this, []);
  };

  /**
   * Destroys instance and everything it created.
   *
   * @return {Void}
   */
  Scroller.prototype.destroy = function () {
    if (this.frameResizeObserver) {
      this.frameResizeObserver.disconnect();
      this.frameResizeObserver = null;
    }
    var frame = this.frame;

    // Reset native FRAME element scroll
    if (frame) {
      _dom.default.removeEventListener(frame, 'scroll', resetScrollTop, {
        passive: true
      });
      _dom.default.removeEventListener(frame, 'scroll', resetScrollLeft, {
        passive: true
      });
      _dom.default.removeEventListener(frame, 'scroll', resetScroll, {
        passive: true
      });
      var mouseWheelHandler = this.mouseWheelHandler;
      if (mouseWheelHandler) {
        _dom.default.removeEventListener(frame, wheelEvent, mouseWheelHandler, {
          passive: true
        });
      }
    }
    this.mouseWheelHandler = null;
    var dragStartHandler = this.dragStartHandler;
    var dragSourceElement = this.dragSourceElement;
    if (dragStartHandler && dragSourceElement) {
      _dom.default.removeEventListener(dragSourceElement, 'touchstart', dragStartHandler, {
        passive: true
      });
      _dom.default.removeEventListener(dragSourceElement, 'mousedown', dragStartHandler, {
        passive: true
      });
      _dom.default.removeEventListener(dragSourceElement, 'pointerdown', dragStartHandler, {
        passive: true
      });
    }
    this.dragStartHandler = null;
    this.dragSourceElement = null;
    var focusHandler = this.focusHandler;
    if (focusHandler && frame) {
      _dom.default.removeEventListener(frame, 'focus', focusHandler, {
        capture: true,
        passive: true
      });
    }
    this.focusHandler = null;
    var boundOnFrameClick = this.boundOnFrameClick;
    if (boundOnFrameClick && frame) {
      _dom.default.removeEventListener(frame, 'click', boundOnFrameClick, {
        passive: true,
        capture: true
      });
    }
    this.boundOnFrameClick = null;
    this.removeScrollCacheListener();
    this.initialized = null;
    this.nativeScrollElement = null;
    this.frame = null;
    this.options = null;
    this.slideeSize = null;
    this._pos = null;
    this.requiresReflow = null;
    this.frameSize = null;
    this.dragging = null;
    this.contentRects = null;
    this.dragHandler = null;
    this.onSourceClickFn = null;
    this.onScrollForCachingFn = null;
    this.resizeListeners = null;
    this._cachedScrollTop = null;
    this._cachedScrollLeft = null;
    this._cachedScrollHeight = null;
    this._cachedScrollWidth = null;
    this._framePadding = null;
    this._slideePadding = null;
    this._frameRect = null;
    this.slideeElement = null;
    this.slideeElementStyle = null;
    return this;
  };
  Scroller.create = function (frame, options) {
    var instance = new Scroller(frame, options);
    return Promise.resolve(instance);
  };
  var _default = _exports.default = Scroller;
});
