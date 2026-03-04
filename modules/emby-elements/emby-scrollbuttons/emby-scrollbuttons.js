define(["exports", "./../emby-button/paper-icon-button-light.js"], function (_exports, _paperIconButtonLight) {
  Object.defineProperty(_exports, "__esModule", {
    value: true
  });
  _exports.default = void 0;
  /* jshint module: true */

  require(['css!modules/emby-elements/emby-scrollbuttons/emby-scrollbuttons.css']);
  function getScrollButtonContainerHtml(direction) {
    var html = '';
    var hide = direction === 'backwards' ? ' hide' : '';
    html += '<div class="scrollbuttoncontainer scrollbuttoncontainer-' + direction + hide + '">';
    var icon = direction === 'backwards' ? '&#xe5CB;' : '&#xe5CC;';
    html += '<button tabindex="-1" type="button" is="paper-icon-button-light" data-direction="' + direction + '" class="emby-scrollbuttons-scrollbutton"><i class="md-icon autortl">';
    html += icon;
    html += '</i></button>';
    html += '</div>';
    return html;
  }
  function getScrollPosition(parent, scrollType) {
    if (scrollType === 'x') {
      if (parent.getScrollLeft) {
        return parent.getScrollLeft();
      }
    } else {
      if (parent.getScrollTop) {
        return parent.getScrollTop();
      }
    }
    return 0;
  }
  function getScrolledContentSize(parent, scrollType) {
    if (scrollType === 'x') {
      if (parent.getScrollWidth) {
        return parent.getScrollWidth();
      }
    } else {
      if (parent.getScrollHeight) {
        return parent.getScrollHeight();
      }
    }
    return 0;
  }
  function onScrolledToPosition(scroller, scrollButtons, pos, scrollContentSize) {
    // use math.abs to account for rtl
    pos = Math.abs(pos);
    if (pos > 0) {
      scrollButtons.scrollButtonsBackwards.classList.remove('hide');
    } else {
      scrollButtons.scrollButtonsBackwards.classList.add('hide');
    }
    if (scrollContentSize > 0) {
      pos += scrollButtons.offsetWidth;

      //console.log('pos: ' + pos + ', scrollContentSize: ' + scrollContentSize);

      // the -1 is needed for rtl for some reason
      if (pos >= scrollContentSize - 1) {
        scrollButtons.scrollButtonsForwards.classList.add('hide');
      } else {
        scrollButtons.scrollButtonsForwards.classList.remove('hide');
      }
    }
  }
  function onScroll(e) {
    var scrollButtons = this;
    var scroller = this.scroller;
    var scrollType = this.scrollType;
    var pos = getScrollPosition(scroller, scrollType);
    var scrollContentSize = getScrolledContentSize(scroller, scrollType);
    onScrolledToPosition(scroller, scrollButtons, pos, scrollContentSize);
  }
  function getStyleValue(style, name) {
    var value = style.getPropertyValue(name);
    if (!value) {
      return 0;
    }
    value = value.replace('px', '');
    if (!value) {
      return 0;
    }
    value = parseInt(value);
    if (isNaN(value)) {
      return 0;
    }
    return value;
  }
  var paddingInlineStartProp = CSS.supports('padding-inline-start', '0') ? 'padding-inline-start' : CSS.supports('-webkit-padding-start', '0') ? '-webkit-padding-start' : 'padding-left';
  var paddingInlineEndProp = CSS.supports('padding-inline-end', '0') ? 'padding-inline-end' : CSS.supports('-webkit-padding-end', '0') ? '-webkit-padding-end' : 'padding-right';
  function getScrollContainerSize(elem, scrollType) {
    var scrollSize = elem.getScrollContainerBoundingClientRect().width;
    console.log('scrollbuttons scrollSize: ' + scrollSize);
    var style = window.getComputedStyle(elem, null);
    var paddingBackwardsProperty = scrollType === 'x' ? paddingInlineStartProp : 'padding-top';
    var paddingForwardsProperty = scrollType === 'x' ? paddingInlineEndProp : 'padding-bottom';
    var paddingBackwards = getStyleValue(style, paddingBackwardsProperty);
    if (paddingBackwards) {
      scrollSize -= paddingBackwards;
    }
    var paddingForwards = getStyleValue(style, paddingForwardsProperty);
    if (paddingForwards) {
      scrollSize -= paddingForwards;
    }
    var slider = elem.getScrollSlider();
    style = window.getComputedStyle(slider, null);
    paddingBackwards = getStyleValue(style, paddingBackwardsProperty);
    if (paddingBackwards) {
      scrollSize += paddingBackwards;
    }
    paddingForwards = getStyleValue(style, paddingForwardsProperty);
    if (paddingForwards) {
      scrollSize += paddingForwards;
    }
    return scrollSize;
  }
  function onScrollButtonClick(e) {
    var scrollButtonsParent = this.closest('[is=emby-scrollbuttons]');
    var scrollType = scrollButtonsParent.scrollType;
    var scroller = scrollButtonsParent.getScroller();
    var buttonDirection = this.getAttribute('data-direction');
    var scrollContainerSize = getScrollContainerSize(scroller, scrollType);
    if (scroller.getScrollButtonPageSize) {
      scrollContainerSize = scroller.getScrollButtonPageSize(scrollContainerSize, scrollType);
    }
    var pos = getScrollPosition(scroller, scrollType);
    var newPos;
    var multiplier = scrollType === 'x' ? scroller.getScrollLeftMultiplier() : scroller.getScrollTopMultiplier();
    if (buttonDirection === 'backwards') {
      newPos = pos - scrollContainerSize * multiplier;
    } else {
      newPos = pos + scrollContainerSize * multiplier;
    }
    if (scrollType === 'x') {
      scroller.scrollToPosition({
        left: newPos
      });
    } else {
      scroller.scrollToPosition({
        top: newPos
      });
    }
  }
  function onInit() {
    var parentNode = this.parentNode;
    if (!parentNode) {
      // not attached yet
      return;
    }
    var elem = this;
    if (elem.hasInit) {
      return;
    }
    elem.hasInit = true;
    this.classList.add('emby-scrollbuttons');
    var scroller = this.getScroller();
    parentNode.classList.add('emby-scrollbuttons-scroller');
    if (scroller.isNativeScroll()) {
      var slider = scroller.querySelector('.scrollSlider');
      if (slider) {
        slider.classList.add('emby-scrollbuttons-scrollSlider');
      }
    }
    this.scrollType = 'x';
    this.innerHTML = getScrollButtonContainerHtml('backwards') + getScrollButtonContainerHtml('forwards');
    var scrollHandler = onScroll.bind(this);
    this.scrollHandler = scrollHandler;
    var buttons = this.querySelectorAll('.emby-scrollbuttons-scrollbutton');
    buttons[0].addEventListener('click', onScrollButtonClick);
    buttons[1].addEventListener('click', onScrollButtonClick);
    buttons = this.querySelectorAll('.scrollbuttoncontainer');
    this.scrollButtonsBackwards = buttons[0];
    this.scrollButtonsForwards = buttons[1];
    scroller.addScrollEventListener(scrollHandler, {
      passive: true
    });
    scroller.addResizeObserver(scrollHandler);
  }
  var EmbyScrollButtons = /*#__PURE__*/function (_HTMLDivElement) {
    function EmbyScrollButtons() {
      var _this;
      // address the upgraded instance and use it
      var self = _this = _HTMLDivElement.call(this) || this;
      onInit.call(self);
      return babelHelpers.possibleConstructorReturn(_this, self);
    }
    babelHelpers.inherits(EmbyScrollButtons, _HTMLDivElement);
    return babelHelpers.createClass(EmbyScrollButtons, [{
      key: "connectedCallback",
      value: function connectedCallback() {
        onInit.call(this);
      }
    }, {
      key: "getScroller",
      value: function getScroller() {
        var scroller = this.scroller;
        if (!scroller) {
          scroller = this.closest('[is=emby-scroller]');
          var parentNode = this.parentNode;
          if (!scroller || parentNode !== scroller && !parentNode.contains(scroller)) {
            scroller = parentNode.querySelector('[is=emby-scroller]');
          }
          this.scroller = scroller;
        }
        return scroller;
      }
    }, {
      key: "disconnectedCallback",
      value: function disconnectedCallback() {
        var scroller = this.scroller;
        this.scroller = null;
        var scrollHandler = this.scrollHandler;
        if (scroller && scrollHandler) {
          scroller.removeResizeObserver(scrollHandler);
          scroller.removeScrollEventListener(scrollHandler, {
            passive: true
          });
        }
        this.scrollHandler = null;
        this.scrollButtonsBackwards = null;
        this.scrollButtonsForwards = null;
      }
    }]);
  }(/*#__PURE__*/babelHelpers.wrapNativeSuper(HTMLDivElement));
  customElements.define('emby-scrollbuttons', EmbyScrollButtons, {
    extends: 'div'
  });
  var _default = _exports.default = EmbyScrollButtons;
});
