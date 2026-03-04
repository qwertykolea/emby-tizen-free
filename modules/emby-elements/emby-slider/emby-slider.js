define(["exports", "./../../dom.js", "./../../layoutmanager.js", "./../../common/inputmanager.js", "./../../customelementupgrade.js"], function (_exports, _dom, _layoutmanager, _inputmanager, _customelementupgrade) {
  Object.defineProperty(_exports, "__esModule", {
    value: true
  });
  _exports.default = void 0;
  /* jshint module: true */

  require(['css!modules/emby-elements/emby-slider/emby-slider.css', 'css!!tv|modules/emby-elements/emby-slider/emby-slider_nontv.css', 'css!tv|modules/emby-elements/emby-slider/emby-slider_tv.css', 'css!modules/emby-elements/emby-slider/emby-slider2.css']);
  var insetInlineStartProp = CSS.supports('inset-inline-start', '0') ? 'insetInlineStart' : 'left';
  var insetBlockStartProp = 'bottom';

  // test these separately because tizen and legacy edge will wrongly return true as soon anytime calc is in the expression 
  var SupportsCalc = CSS.supports('width', 'min(45.2%,calc(100% - .65em))');
  var SupportsMin = CSS.supports('width', 'min(10em, 5vw)');
  var SupportsCalcMin = SupportsCalc && SupportsMin;
  function onInputCommand(e) {
    var stepUpCommand;
    var stepDownCommand;
    if (this.getAttribute('orient') === 'vertical') {
      stepUpCommand = 'up';
      stepDownCommand = 'down';
    } else {
      if (document.dir === 'rtl') {
        stepUpCommand = 'left';
        stepDownCommand = 'right';
      } else {
        stepUpCommand = 'right';
        stepDownCommand = 'left';
      }
    }
    switch (e.detail.command) {
      case stepUpCommand:
        {
          e.preventDefault();
          this.stepUp();
          var value = parseFloat(this.value);
          this.beginEditing(value);
          break;
        }
      case stepDownCommand:
        {
          e.preventDefault();
          this.stepDown();
          var _value = parseFloat(this.value);
          this.beginEditing(_value);
          break;
        }
      default:
        break;
    }
  }
  function getValueAsPercent(range, value) {
    var min = parseFloat(range.min);
    var max = parseFloat(range.max);
    var fraction = (value - min) / (max - min);
    fraction *= 100;
    return fraction;
  }
  function getValueFromPercent(range, pct) {
    pct /= 100;
    var min = parseFloat(range.min);
    var max = parseFloat(range.max);
    var value = (max - min) * pct;
    return value + min;
  }
  function updateValues(range, value) {
    // put this on a callback. Doing it within the event sometimes causes the slider to get hung up and not respond
    requestAnimationFrame(function () {
      var backgroundLower = range.backgroundLower;
      var originalPct = getValueAsPercent(range, value);
      var pct = originalPct + '%';
      if (backgroundLower) {
        var prop = range.getAttribute('orient') === 'vertical' ? 'height' : 'width';
        backgroundLower.style[prop] = pct;
      }
      var thumb = range.sliderThumb;
      if (thumb) {
        var positionProp = range.getAttribute('orient') === 'vertical' ? insetBlockStartProp : insetInlineStartProp;

        //console.log('thumb pct: ' + positionProp);

        if (SupportsMin) {
          if (originalPct < 10) {
            thumb.style[positionProp] = 'max(' + originalPct + '%,.65em)';
            return;
          } else if (originalPct > 90 && SupportsCalcMin) {
            thumb.style[positionProp] = 'min(' + originalPct + '%,calc(100% - .65em))';
            return;
          }
        }
        thumb.style[positionProp] = originalPct + '%';
      }
    });
  }
  function onBubbleResized() {
    this.bubbleOffsetSize = null;
  }
  function getBubbleOffsetSize(range) {
    var size = range.bubbleOffsetSize;
    if (!size) {
      var prop = range.getAttribute('orient') === 'vertical' ? 'offsetHeight' : 'offsetWidth';
      range.bubbleOffsetSize = size = range.getBubbleElement()[prop];
    }
    return size;
  }
  function onContainerResized() {
    this.containerOffsetSize = null;
    //console.log('onContainerResized');
  }
  function getRangeContainerOffsetSize(range) {
    var size = range.containerOffsetSize;
    if (!size) {
      var prop = range.getAttribute('orient') === 'vertical' ? 'offsetHeight' : 'offsetWidth';
      range.containerOffsetSize = size = range.containerElement[prop];
    }
    return size;
  }
  var baseSliderBubbleClass = 'sliderBubble dialog';
  function updateBubble(range, value, pct, bubble) {
    if (range.dragging) {
      range.dispatchEvent(new CustomEvent('displayvaluechange', {
        bubbles: true,
        cancelable: false,
        detail: {
          value: value
        }
      }));
    }
    var html = value;
    if (range.getBubbleHtml) {
      html = range.getBubbleHtml(html);
    } else {
      if (range.getBubbleText) {
        html = range.getBubbleText(html);
      } else {
        html = Math.round(html);
      }
      html = '<h2 class="sliderBubbleText">' + html + '</h2>';
    }
    bubble.innerHTML = html;
    var isVertical = range.getAttribute('orient') === 'vertical';
    var positionProp = isVertical ? insetBlockStartProp : insetInlineStartProp;
    if (SupportsCalcMin) {
      var size = getBubbleOffsetSize(range);
      size = Math.round(size / 2);
      if (pct < 30) {
        bubble.style[positionProp] = 'max(' + pct + '%,' + size + 'px)';
        return;
      } else if (pct > 70) {
        bubble.style[positionProp] = 'min(' + pct + '%,calc(100% - ' + size + 'px))';
        return;
      }
      bubble.style[positionProp] = pct + '%';
    }
    var bubbleSize = getBubbleOffsetSize(range);
    var containerSize = getRangeContainerOffsetSize(range);
    //console.log('bubble pct: ' + pct);
    pct = containerSize * (pct / 100);
    pct = Math.max(pct, bubbleSize / 2);
    pct = Math.min(pct, containerSize - bubbleSize / 2);
    bubble.style[positionProp] = pct + 'px';
  }
  function setRange(elem, range, startPercent, endPercent) {
    var style = elem.style;
    var positionProp = range.getAttribute('orient') === 'vertical' ? insetBlockStartProp : insetInlineStartProp;
    style[positionProp] = Math.max(startPercent, 0) + '%';
    var sizePercent = endPercent - startPercent;
    var prop = range.getAttribute('orient') === 'vertical' ? 'height' : 'width';
    style[prop] = Math.max(Math.min(sizePercent, 100), 0) + '%';
  }
  function mapRangesFromRuntimeToPercent(ranges, runtime) {
    if (!runtime) {
      return [];
    }
    return ranges.map(function (r) {
      return {
        start: r.start / runtime * 100,
        end: r.end / runtime * 100
      };
    });
  }
  var supportsTouchEvent = 'ontouchstart' in document.documentElement;
  function onPointerMove(e) {
    if (this.disabled) {
      return;
    }
    var pointerType = e.pointerType;
    if (pointerType === 'touch') {
      return;
    }
    if (!pointerType) {
      // pointer events not supported, let's take a guess
      if (supportsTouchEvent) {
        return;
      }
    }
    this.classList.add('emby-slider-hovering');
    if (!this.dragging) {
      var sliderBubble = this.sliderBubble;
      if (sliderBubble) {
        var rect = this.getBoundingClientRect();

        //console.log('clientX: ' + clientX);

        var dir = document.dir;
        var bubblePct;
        if (this.getAttribute('orient') === 'vertical') {
          var offset = rect.bottom - e.clientY;
          //console.log('offset: ' + offset);

          bubblePct = offset / rect.height;
        } else {
          var clientX = e.clientX;
          var _offset = dir === 'rtl' ? rect.right - clientX : clientX - rect.left;
          //console.log('offset: ' + offset);

          bubblePct = _offset / rect.width;
        }
        bubblePct *= 100;
        bubblePct = Math.min(Math.max(0, bubblePct), 100);
        updateBubble(this, getValueFromPercent(this, bubblePct), bubblePct, sliderBubble);
      }
    }
  }
  function onPointerLeave(e) {
    if (e.target === e.currentTarget) {
      this.classList.remove('emby-slider-hovering');
    }
  }
  function onInput(e) {
    this.beginEditing(parseFloat(this.value));
  }
  function onChange(e) {
    updateValues(this, parseFloat(this.value));
    var detail = e.detail;
    if (!detail || !detail.isStep) {
      this.endEditing();
    }
  }
  function onBlur(e) {
    this.endEditing();
  }
  function onPointerUp(e) {
    this.endEditing();
  }
  function onMouseWheel(e) {
    if (e.deltaY < 0) {
      this.stepUp();
    } else {
      this.stepDown();
    }
    e.preventDefault();
    e.stopPropagation();
  }
  function onContextMenu(e) {
    // prevent menu in chrome android
    e.preventDefault();
  }
  var EmbySlider = /*#__PURE__*/function (_HTMLInputElement) {
    function EmbySlider() {
      var _this;
      // address the upgraded instance and use it
      var self = _this = _HTMLInputElement.call(this) || this;
      return babelHelpers.possibleConstructorReturn(_this, self);
    }
    babelHelpers.inherits(EmbySlider, _HTMLInputElement);
    return babelHelpers.createClass(EmbySlider, [{
      key: "setForceDisplayThumb",
      value: function setForceDisplayThumb(forceDisplayThumb) {
        if (forceDisplayThumb || _layoutmanager.default.tv) {
          this.classList.remove('emby-slider-nothumb');
        } else {
          this.classList.add('emby-slider-nothumb');
        }
        if (forceDisplayThumb || !_layoutmanager.default.tv) {
          this.sliderThumb.classList.remove('emby-slider-thumb-hoveronly');
        } else {
          this.sliderThumb.classList.add('emby-slider-thumb-hoveronly');
        }
      }
    }, {
      key: "connectedCallback",
      value: function connectedCallback() {
        if (this.getAttribute('data-embyslider') === 'true') {
          return;
        }
        this.setAttribute('data-embyslider', 'true');
        this.classList.add('emby-slider');
        if (_dom.default.allowBackdropFilter()) {
          this.classList.add('emby-slider-backdropfilter');
        }
        var containerElement = this.parentNode;
        containerElement.classList.add('emby-slider-container');
        var htmlToInsert = '';
        var backgroundClass = ((this.getAttribute('data-sliderbackgroundclass') || '') + ' emby-slider-background').trim();
        var thumbClass = ((this.getAttribute('data-thumbclass') || '') + ' emby-slider-thumb').trim();
        var lowerClass = 'emby-slider-background-lower';
        var upperClass = 'emby-slider-background-upper';
        if (_dom.default.allowBackdropFilter()) {
          backgroundClass += ' emby-slider-background-backdropfilter';
          thumbClass += ' emby-slider-thumb-backdropfilter';
        }
        htmlToInsert += '<div class="' + backgroundClass + '">';
        htmlToInsert += '<div class="emby-slider-background-inner">';

        // the more of these, the more ranges we can display
        htmlToInsert += '<div class="' + upperClass + '"></div>';
        htmlToInsert += '<div class="' + lowerClass + '"></div>';
        htmlToInsert += '</div>';
        htmlToInsert += '</div>';
        htmlToInsert += '<div class="' + thumbClass + ' flex align-items-center justify-content-center"></div>';
        if (this.getAttribute('data-bubble') !== 'false') {
          var sliderBubbleClass = baseSliderBubbleClass;
          var customBubbleClass = this.getAttribute('data-bubbleclass');
          if (customBubbleClass) {
            sliderBubbleClass += ' ' + customBubbleClass;
          }
          var rtl = document.dir === 'rtl';
          if (rtl) {
            sliderBubbleClass += ' sliderBubble-rtl';
          }
          htmlToInsert += '<div class="' + sliderBubbleClass + '"></div>';
        }
        containerElement.insertAdjacentHTML('beforeend', htmlToInsert);
        this.backgroundElement = containerElement.querySelector('.emby-slider-background');
        this.backgroundLower = containerElement.querySelector('.emby-slider-background-lower');
        this.backgroundUpper = containerElement.querySelector('.emby-slider-background-upper');
        this.sliderThumb = containerElement.querySelector('.emby-slider-thumb');
        this.sliderBubble = containerElement.querySelector('.sliderBubble');
        this.containerElement = containerElement;
        this.containerResizeObserver = new ResizeObserver(onContainerResized.bind(this), {});
        this.containerResizeObserver.observe(containerElement);
        if (this.sliderBubble) {
          this.bubbleResizeObserver = new ResizeObserver(onBubbleResized.bind(this), {});
          this.bubbleResizeObserver.observe(this.sliderBubble);
        }
        var forceDisplayThumb = this.getAttribute('data-hoverthumb') !== 'true';
        this.setForceDisplayThumb(forceDisplayThumb);
        _dom.default.addEventListener(this, 'input', onInput, {
          passive: true
        });
        _dom.default.addEventListener(this, 'change', onChange, {
          passive: true
        });
        _dom.default.addEventListener(this, 'contextmenu', onContextMenu, {});
        _dom.default.addEventListener(this, 'blur', onBlur, {});
        _dom.default.addEventListener(this, window.PointerEvent ? 'pointermove' : 'mousemove', onPointerMove, {
          passive: true
        });
        _dom.default.addEventListener(this, window.PointerEvent ? 'pointerleave' : 'mouseleave', onPointerLeave, {
          passive: true
        });
        _dom.default.addEventListener(this, window.PointerEvent ? 'pointerup' : 'mouseup', onPointerUp, {
          passive: true
        });
        _dom.default.addEventListener(this, 'wheel', onMouseWheel, {});
        if (this.getAttribute('data-defaultinputhandling') !== 'false') {
          _inputmanager.default.on(this, onInputCommand);
        }
        this.__upgraded = true;
        this.dispatchEvent(new CustomEvent('upgraded', {
          cancelable: false
        }));
      }
    }, {
      key: "setValue",
      value: function setValue(val, triggerChange) {
        this.value = val;
        updateValues(this, val);
        if (triggerChange) {
          this.dispatchEvent(new CustomEvent('change', {
            bubbles: true,
            cancelable: false,
            detail: {
              // this is true to prevent the bubble from being closed during ff/rew
              // in other cases it should be false so at some point this api will need to be expanded
              isStep: true
            }
          }));
        }
      }
    }, {
      key: "disconnectedCallback",
      value: function disconnectedCallback() {
        this.backgroundUpper = null;
        this.backgroundLower = null;
        this.sliderThumb = null;
        this.sliderBubble = null;
        this.backgroundElement = null;
        this.containerElement = null;
        var observer = this.containerResizeObserver;
        if (observer) {
          observer.disconnect();
        }
        this.containerResizeObserver = null;
        observer = this.bubbleResizeObserver;
        if (observer) {
          observer.disconnect();
        }
        this.bubbleResizeObserver = null;
        this.bubbleOffsetSize = null;
        this.containerOffsetSize = null;
      }
    }, {
      key: "setSeekRanges",
      value: function setSeekRanges(ranges, runtime, position) {
        var elem = this.backgroundUpper;
        if (!elem) {
          return;
        }
        if (runtime != null) {
          ranges = mapRangesFromRuntimeToPercent(ranges, runtime);
          position = position / runtime * 100;
        }
        for (var i = 0, length = ranges.length; i < length; i++) {
          var range = ranges[i];
          if (position != null) {
            if (position >= range.end) {
              continue;
            }
          }
          setRange(elem, this, range.start, range.end);
          return;
        }
        setRange(elem, this, 0, 0);
      }
    }, {
      key: "setIsClear",
      value: function setIsClear(isClear) {
        var backgroundLower = this.backgroundLower;
        if (backgroundLower) {
          if (isClear) {
            backgroundLower.classList.add('emby-slider-background-lower-clear');
          } else {
            backgroundLower.classList.remove('emby-slider-background-lower-clear');
          }
        }
      }
    }, {
      key: "beginEditing",
      value: function beginEditing(value) {
        this.dragging = true;
        this.classList.add('emby-slider-editing');
        var sliderBubble = this.sliderBubble;
        //console.log(value);
        if (sliderBubble) {
          updateBubble(this, value, getValueAsPercent(this, value), sliderBubble);
        }
        updateValues(this, value);
        this.dispatchEvent(new CustomEvent('beginediting', {
          bubbles: true,
          cancelable: false
        }));
      }
    }, {
      key: "cancelEditing",
      value: function cancelEditing() {
        this.endEditing(false);
      }
    }, {
      key: "endEditing",
      value: function endEditing(triggerChange, value) {
        if (this.dragging) {
          console.log('slider endEditing');
        }
        this.dragging = false;
        this.classList.remove('emby-slider-editing');
        if (triggerChange) {
          this.value = value;
          this.dispatchEvent(new CustomEvent('change', {
            bubbles: true,
            cancelable: false
          }));
        }
        this.dispatchEvent(new CustomEvent('endediting', {
          bubbles: true,
          cancelable: false
        }));
      }
    }, {
      key: "stepUp",
      value: function stepUp() {
        HTMLInputElement.prototype.stepUp.call(this);
        this.dispatchEvent(new CustomEvent('change', {
          bubbles: true,
          cancelable: false,
          detail: {
            isStep: true
          }
        }));
      }
    }, {
      key: "stepDown",
      value: function stepDown() {
        HTMLInputElement.prototype.stepDown.call(this);
        this.dispatchEvent(new CustomEvent('change', {
          bubbles: true,
          cancelable: false,
          detail: {
            isStep: true
          }
        }));
      }
    }, {
      key: "getBubbleElement",
      value: function getBubbleElement() {
        return this.sliderBubble;
      }
    }, {
      key: "getTrackBackgroundUpper",
      value: function getTrackBackgroundUpper() {
        return this.backgroundUpper;
      }
    }, {
      key: "setThumbIcon",
      value: function setThumbIcon(options) {
        var sliderThumb = this.sliderThumb;
        if (options) {
          sliderThumb.classList.add('emby-slider-thumb-withicon');
          sliderThumb.innerHTML = options.icon;
          sliderThumb.style.fontSize = options.fontSize || null;
        } else {
          sliderThumb.classList.remove('emby-slider-thumb-withicon');
          sliderThumb.innerHTML = '';
          sliderThumb.style.fontSize = null;
        }
      }
    }]);
  }(/*#__PURE__*/babelHelpers.wrapNativeSuper(HTMLInputElement));
  customElements.define('emby-slider', EmbySlider, {
    extends: 'input'
  });
  var _default = _exports.default = EmbySlider;
});
