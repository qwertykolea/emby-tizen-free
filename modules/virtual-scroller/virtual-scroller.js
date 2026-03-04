define(["exports", "./../dom.js", "./../layoutmanager.js", "./../focusmanager.js"], function (_exports, _dom, _layoutmanager, _focusmanager) {
  Object.defineProperty(_exports, "__esModule", {
    value: true
  });
  _exports.default = void 0;
  /* jshint module: true */

  require(['css!modules/virtual-scroller/virtual-scroller.css']);
  var useSetTimeout = false;
  var rAF = useSetTimeout ? setTimeout : requestAnimationFrame;
  var cAF = useSetTimeout ? clearTimeout : cancelAnimationFrame;

  // in newer chrome versions the elements have a width with zero height. previously they used to have both zero width and height,
  // which is needed to prevent them from being focusable. so for now this is disabled
  var supportsContentVisibility = CSS.supports('content-visibility', 'hidden');
  var displayProp = supportsContentVisibility ? 'contentVisibility' : 'display';
  var displayHiddenValue = supportsContentVisibility ? 'hidden' : 'none';
  var supportsInsetShorthand = CSS.supports('inset', '0 0 0 0');
  var supportsTransform = CSS.supports('transform', 'scale(1)');
  var supportsTranslate = CSS.supports('translate', '40px 100px');
  function Layout1dBase(config) {
    this._physicalMin = 0;
    this._physicalMax = 0;
    this._first = -1;
    this._last = -1;
    this._itemSize = {
      width: 0,
      height: 0
    };
    this._scrollPosition = 0;
    this._viewportSize = {
      width: 0,
      height: 0
    };
    this._totalItems = 0;
    this._scrollSize = 1;
    this._pendingReflow = false;
    Object.assign(this, config);
  }

  // public properties

  Layout1dBase.prototype.setTotalItems = function (num) {
    if (num !== this._totalItems) {
      this._totalItems = num;
      this._scheduleReflow();
    }
  };
  Layout1dBase.prototype.getDirection = function () {
    return this._direction;
  };
  Layout1dBase.prototype.setDirection = function (dir) {
    // Force it to be either horizontal or vertical.
    dir = dir === 'horizontal' ? dir : 'vertical';
    if (dir !== this._direction) {
      this._direction = dir;
      this.isVertical = dir === 'vertical';
      var minOverhang = 150;
      var overhangScaleFactor = _layoutmanager.default.tv ? 1 : this.isVertical ? 0.25 : 0.2;

      // ensure the overhang is large enough so that the next item to select via keyboard nav is always available
      // when it's too small, keyboard nav can get stuck in non-tv mode due to the small overhang
      if (this.isVertical) {
        this._overhang = Math.max(minOverhang, Math.round(_dom.default.getWindowSize().innerHeight * overhangScaleFactor));
      } else {
        this._overhang = Math.max(minOverhang, Math.round(_dom.default.getWindowSize().innerWidth * overhangScaleFactor));
      }

      //console.log('virtual scroller overhang: ' + this._overhang);

      this._sizeDim = dir === 'horizontal' ? 'width' : 'height';
      this._secondarySizeDim = dir === 'horizontal' ? 'height' : 'width';
      this._positionDim = dir === 'horizontal' ? 'left' : 'top';
      this._secondaryPositionDim = dir === 'horizontal' ? 'top' : 'left';
      this._scheduleReflow();
    }
  };
  Layout1dBase.prototype.setItemSize = function (dims) {
    var _itemDim1 = this._itemDim1();
    var _itemDim2 = this._itemDim2();
    var itemSize = this._itemSize;

    // floor these because a partial pixel value could lead to an incorrect calculation of the number of rolumns
    itemSize.width = Math.floor(dims.width);
    itemSize.height = Math.floor(dims.height);
    if (_itemDim1 !== this._itemDim1() || _itemDim2 !== this._itemDim2()) {
      if (_itemDim2 !== this._itemDim2()) {
        this._itemDim2Changed();
      } else {
        this._scheduleReflow();
      }
      return true;
    }
    return false;
  };
  Layout1dBase.prototype.setViewportSize = function (dims) {
    var _viewDim1 = this._viewDim1();
    var _viewDim2 = this._viewDim2();
    this._viewportSize = dims;
    if (_viewDim2 !== this._viewDim2()) {
      this._viewDim2Changed();
    } else if (_viewDim1 !== this._viewDim1()) {
      this._checkThresholds();
    } else if (dims.offset !== this._viewportSize.offset) {
      this._checkThresholds();
    }
  };
  Layout1dBase.prototype.setViewportScroll = function (newScrollPosition) {
    //console.log('setViewportScroll newScrollPosition: ' + newScrollPosition + ', current: ' + this._scrollPosition);

    this._scrollPosition = newScrollPosition;
    this._checkThresholds();
  };

  // private properties

  Layout1dBase.prototype._itemDim1 = function () {
    return this._itemSize[this._sizeDim];
  };
  Layout1dBase.prototype._itemDim2 = function () {
    return this._itemSize[this._secondarySizeDim];
  };
  Layout1dBase.prototype._viewDim1 = function () {
    return this._viewportSize[this._sizeDim];
  };
  Layout1dBase.prototype._viewDim2 = function () {
    return this._viewportSize[this._secondarySizeDim];
  };
  Layout1dBase.prototype._num = function () {
    var first = this._first;
    var last = this._last;
    if (first === -1 || last === -1) {
      return 0;
    }
    return last - first + 1;
  };

  // public methods

  Layout1dBase.prototype.reflowIfNeeded = function (forceEmitChildPositions) {
    if (this._pendingReflow) {
      this._pendingReflow = false;
      this._reflow(forceEmitChildPositions);
    }
  };

  ///

  Layout1dBase.prototype._scheduleReflow = function () {
    this._pendingReflow = true;
  };
  Layout1dBase.prototype._reflow = function (forceEmitChildPositions) {
    var _first = this._first,
      _last = this._last,
      _scrollSize = this._scrollSize;
    this._updateScrollSize();
    this._getActiveItems();
    if (this._scrollSize !== _scrollSize) {
      this._emitScrollSize();
    }
    var first = this._first;
    var last = this._last;
    var hasEmittedChildPositions = false;
    if (first === -1 && last === -1) {
      this._emitRange();
    } else if (first !== _first || last !== _last) {
      this._emitRange();
      this._emitChildPositions();
      hasEmittedChildPositions = true;
    }
    if (!hasEmittedChildPositions && forceEmitChildPositions) {
      this._emitChildPositions();
    }
  };
  Layout1dBase.prototype._updateScrollSize = function () {
    // Ensure we have at least 1px - this allows getting at least 1 item to be
    // rendered.

    var itemDim1 = this._itemDim1();
    if (itemDim1) {
      this._scrollSize = Math.max(1, this._totalItems * itemDim1);
    }
  };
  Layout1dBase.prototype._checkThresholds = function () {
    var _viewDim1 = this._viewDim1();
    if (_viewDim1 === 0 && this._num() > 0) {
      this._scheduleReflow();
    } else {
      var overhang = this._overhang;
      // use math.abs to account for rtl
      var scrollPosition = Math.abs(this._scrollPosition);
      var min = Math.max(0, scrollPosition - overhang - this._viewportSize.offset);
      var max = Math.min(this._scrollSize, scrollPosition + _viewDim1 + overhang);

      //console.log('_checkThresholds overhang: ' + overhang + ', scrollPosition: ' + scrollPosition + ', min: ' + min + ', max: ' + max);

      if (this._physicalMin > min || this._physicalMax < max) {
        this._scheduleReflow();
      }
    }
  };
  Layout1dBase.prototype._emitRange = function () {
    var fn = this.onRangeChange;
    if (fn) {
      fn({
        first: this._first,
        num: this._num()
      });
    }
  };
  Layout1dBase.prototype._emitScrollSize = function () {
    var fn = this.onScrollSizeChange;
    if (fn) {
      fn(this._scrollSize);
    }
  };
  Layout1dBase.prototype._emitChildPositions = function () {
    var fn = this.onItemPositionChange;
    if (fn) {
      fn({
        first: this._first,
        length: this._last + 1
      });
    }
  };
  Layout1dBase.prototype._itemDim2Changed = function () {
    // Override
  };
  Layout1dBase.prototype._viewDim2Changed = function () {
    // Override
  };
  Layout1dBase.prototype._getActiveItems = function () {
    // Override
  };
  Layout1dBase.prototype._getItemPosition = function (idx, rolumns, itemDim1, itemDim2) {
    // Override.
  };
  function Layout1dGrid(config) {
    Layout1dBase.call(this, config);
    this._rolumns = 1;
  }
  Object.assign(Layout1dGrid.prototype, Layout1dBase.prototype);
  Layout1dGrid.prototype.updateItemSizes = function (sizes) {
    if (sizes) {
      return this.setItemSize(sizes);
    }
    return false;
  };
  Layout1dGrid.prototype._viewDim2Changed = function () {
    this._defineGrid();
  };
  Layout1dGrid.prototype._itemDim2Changed = function () {
    this._defineGrid();
  };
  Layout1dGrid.prototype._getActiveItems = function () {
    var overhang = this._overhang;
    // use math.abs to account for rtl
    var scrollPosition = Math.abs(this._scrollPosition);
    var min = Math.max(0, scrollPosition - overhang - this._viewportSize.offset);
    var max = Math.min(this._scrollSize, scrollPosition + this._viewDim1() + overhang);

    //console.log('_getActiveItems overhang: ' + overhang + ', scrollPosition: ' + scrollPosition + ', min: ' + min);

    // there's a chicken and egg problem in this rendering that needs to be corrected
    // the calculation of both the scroll size and item size seem to depend on each other
    // this creates the need for the initial dummy item size of 1000, and then a reflow will be triggered and the actual size determined
    // ultimately, in order to remove this dummy value, we will need the item size to be calculated before we even get into here
    var _itemDim1 = this._itemDim1();
    if (_itemDim1) {
      var firstCow = Math.floor(min / _itemDim1);
      var lastCow = Math.ceil(max / _itemDim1) - 1;
      var rolumns = this._rolumns;

      //console.log('_getActiveItems firstCow: ' + firstCow + ', rolumns: ' + rolumns + ', min: ' + min);

      this._first = firstCow * rolumns;
      this._last = Math.min((lastCow + 1) * rolumns - 1, this._totalItems);
      this._physicalMin = _itemDim1 * firstCow;
      this._physicalMax = _itemDim1 * (lastCow + 1);
    } else {
      this._first = 0;
      this._last = Math.min(1, this._totalItems);
    }
  };
  Layout1dGrid.prototype._getItemPosition = function (idx, rolumns, itemDim1, itemDim2, secondaryPositionOffset) {
    //console.log('rolumns: ' + this._rolumns);

    //console.log('_getItemPosition: idx: ' + idx + ', ' + JSON.stringify(result));

    // this is the preferred way, but the babel output is ugly
    //return {
    //    [this._positionDim]: Math.floor(idx / rolumns) * itemDim1,
    //    [this._secondaryPositionDim]: ((idx % rolumns) * itemDim2) + secondaryPositionOffset
    //};

    var result = {};
    result[this._positionDim] = Math.floor(idx / rolumns) * itemDim1;
    result[this._secondaryPositionDim] = idx % rolumns * itemDim2 + secondaryPositionOffset;
    return result;
  };
  Layout1dGrid.prototype._defineGrid = function () {
    //console.log('_viewDim2: ' + this._viewDim2());
    //console.log('_itemDim2: ' + this._itemDim2());
    //console.log('_viewDim2/_itemDim2: ' + Math.floor(this._viewDim2() / this._itemDim2()));

    var itemDim2 = this._itemDim2();
    if (itemDim2) {
      this._rolumns = Math.max(1, Math.floor(this._viewDim2() / itemDim2));
    }
    this._scheduleReflow();
  };
  Layout1dGrid.prototype._updateScrollSize = function () {
    var itemDim1 = this._itemDim1();
    if (!itemDim1) {
      return;
    }
    this._scrollSize = Math.max(1, Math.ceil(this._totalItems / this._rolumns) * itemDim1);
  };
  function VirtualScroller(config) {
    this._inlineMultiplier = document.dir === 'rtl' ? -1 : 1;
    this._totalItems = 0;
    // Consider renaming this. count? visibleElements?
    this._num = Infinity;

    // Consider renaming this. firstVisibleIndex?
    this._first = 0;
    this._last = 0;
    this._prevFirst = 0;
    this._prevLast = 0;
    this._needsReset = false;
    this._needsRemeasure = false;
    this._pendingRender = null;
    this._container = null;

    // Contains child nodes in the rendered order.
    this._ordered = [];
    // Both used for recycling purposes.
    this._keyToChild = [];
    // Used to keep track of measures by index.
    this._indexToMeasure = {};
    this.requestAnimationFrameCallbackFn = this.requestAnimationFrameCallback.bind(this);
    this._num = 0;
    this._first = -1;
    this._last = -1;
    this._prevFirst = -1;
    this._prevLast = -1;
    this._needsUpdateViewSize = false;
    this._needsUpdateViewScrollPosition = false;
    this._layout = null;
    this._scrollTarget = null;
    // Layout provides these values, we set them on _render().
    this._scrollSize = null;
    this._childrenPos = null;
    this._container = null;
    this._containerSize = null;
    this._containerRO = new ResizeObserver(this._containerSizeChanged.bind(this));
    this.boundOnScrollTargetResize = this._scrollTargetSizeChanged.bind(this);
    this._skipNextChildrenSizeChanged = false;
    this.sameSizeChildren = config.sameSizeChildren;
    if (!this.sameSizeChildren) {
      this._childrenRO = new ResizeObserver(this._childrenSizeChanged.bind(this));
    }
    this.boundHandleScroll = this.handleScroll.bind(this);
    this.setContainer(config.container);
    this.setScrollTarget(config.scrollTarget);
  }
  VirtualScroller.prototype.getContainer = function () {
    return this._container;
  };
  VirtualScroller.prototype.setContainer = function (container) {
    this._container = container;
    this.requestReset(true);
    this._containerRO.disconnect();
    this._containerSize = null;
    this._needsUpdateViewSize = true;
    this._needsUpdateViewScrollPosition = true;
    this._scheduleRender();
    this._containerRO.observe(container);
  };
  VirtualScroller.prototype.getLayout = function () {
    return this._layout;
  };
  VirtualScroller.prototype.setLayout = function (layout) {
    this._layout = layout;
    if (typeof this._layout.updateItemSizes === 'function') {
      this.requestRemeasure();
    }
    this._layout.onScrollSizeChange = this.onScrollSizeChange.bind(this);
    this._layout.onItemPositionChange = this.onItemPositionChange.bind(this);
    this._layout.onRangeChange = this.onRangeChange.bind(this);
    this._needsUpdateViewSize = true;
    this._needsUpdateViewScrollPosition = true;
    this._scheduleRender();
  };

  /**
           * The element that generates scroll events and defines the container
           * viewport. The value `null` (default) corresponds to `window` as scroll
           * target.
           * @type {Element|null}
           */
  VirtualScroller.prototype.getScrollTarget = function () {
    return this._scrollTarget;
  };
  function getNewIndex(instance, currentIndex, direction) {
    var layout = instance._layout;
    var isVertical = layout.isVertical;
    var rolumns = layout._rolumns;
    var totalItems = layout._totalItems;
    var dim1Index = Math.floor(currentIndex / rolumns);
    var dim2Index = currentIndex % rolumns;
    var rowIndex = isVertical ? dim1Index : dim2Index;
    var colIndex = isVertical ? dim2Index : dim1Index;
    var rowCount = isVertical ? rolumns ? Math.ceil(totalItems / rolumns) : Number.MAX_SAFE_INTEGER : rolumns;
    var colCount = isVertical ? rolumns : rolumns ? Math.ceil(totalItems / rolumns) : Number.MAX_SAFE_INTEGER;

    //console.log('getNewIndex rowCount: ' + rowCount);

    var newRowIndex = rowIndex;
    var newColIndex = colIndex;
    switch (direction) {
      case 0:
        if (document.dir === 'rtl') {
          newColIndex++;
        } else {
          newColIndex--;
        }
        break;
      case 1:
        if (document.dir === 'rtl') {
          newColIndex--;
        } else {
          newColIndex++;
        }
        break;
      case 2:
        newRowIndex--;
        break;
      case 3:
        newRowIndex++;
        break;
      default:
        throw new Error('Invalid dir param');
    }
    if (newRowIndex < 0 || newColIndex < 0) {
      return -1;
    }
    if (newRowIndex >= rowCount || newColIndex >= colCount) {
      return -1;
    }
    var newIndex = isVertical ? newRowIndex * colCount + newColIndex : newColIndex * rowCount + newRowIndex;

    // handle partial row at the bottom when going down
    if (newIndex > currentIndex) {
      newIndex = Math.min(newIndex, totalItems - 1);
    }
    if (newIndex === currentIndex) {
      return -1;
    }
    return newIndex;
  }
  function getFocusableElements(newItemToFocus, activeElement, direction) {
    if (newItemToFocus) {
      // focus is moving into the container, so use default handling
      return null;
    }
    var currentIndex = activeElement._dataItemIndex;
    var newIndex = getNewIndex(this, currentIndex, direction);

    //console.log(currentIndex + ' to ' + newIndex);

    if (newIndex == null) {
      // not handled here. focusManager should handle it normally
      return null;
    }
    if (newIndex < 0) {
      return [];
    }
    var result = this._container.getElement(newIndex);
    return result ? [result] : [];
  }

  /**
   * @param {Element|null} target
   */
  VirtualScroller.prototype.setScrollTarget = function (target) {
    this._scrollTarget = target;
    target.addResizeObserver(this.boundOnScrollTargetResize);
    if (target.addScrollEventListener) {
      target.addScrollEventListener(this.boundHandleScroll, {
        passive: true
      });
    } else {
      _dom.default.addEventListener(target, 'scroll', this.boundHandleScroll, {
        passive: true
      });
    }
    var container = this._container;
    var containerClassList = container.classList;
    if (containerClassList.contains('focuscontainer') || containerClassList.contains('focuscontainer-x') || containerClassList.contains('focuscontainer-y')) {
      container.getFocusableElements = getFocusableElements.bind(this);
    }
  };
  VirtualScroller.prototype.getFirst = function () {
    return this._first;
  };
  VirtualScroller.prototype.setFirst = function (idx) {
    var newFirst = Math.max(0, Math.min(idx, this._totalItems - this._num));
    if (newFirst !== this._first) {
      //console.log('setFirst idx: ' + idx + ', newFirst: ' + newFirst + ', current first: ' + this._first);

      this._first = newFirst;
      this._scheduleRender();
      return true;
    }
    return false;
  };
  VirtualScroller.prototype.setTotalItems = function (num, forceReset) {
    var changed = false;

    // TODO(valdrin) should we check if it is a finite number?
    // Technically, Infinity would break Layout, not VirtualRepeater.
    if (num !== this._totalItems) {
      this._totalItems = num;
      this._keyToChild.length = num;
      this.setFirst(this._first);
      changed = true;
    }
    this._layout.setTotalItems(num);
    if (changed || forceReset) {
      this.requestReset(true);
    }
  };
  VirtualScroller.prototype.requestReset = function (requestRemeasure) {
    //console.log('virtualscroller.requestReset requestRemeasure: ' + requestRemeasure);

    if (requestRemeasure) {
      this._needsRemeasure = true;
      this._childSize = null;
    }
    this._needsReset = true;
    this._scheduleRender();
  };
  VirtualScroller.prototype.requestRemeasure = function () {
    //console.log('virtualscroller.requestRemeasure');

    this._needsRemeasure = true;
    this._childSize = null;
    this._scheduleRender();
  };

  // Core functionality

  /**
   * @protected
   */
  VirtualScroller.prototype._shouldRender = function () {
    // NOTE: we're about to render, but the ResizeObserver didn't execute yet.
    // Since we want to keep rAF timing, we compute _containerSize now. Would
    // be nice to have a way to flush ResizeObservers.

    var _containerSize = this._containerSize;
    if (!_containerSize) {
      var container = this._container;
      if (container) {
        this._containerSize = _containerSize = container.getBoundingClientRect();
      } else {
        // this shouldn't happen, but saw it in a windows store crash report
        return false;
      }
    }
    return _containerSize.width > 0 || _containerSize.height > 0;
  };
  VirtualScroller.prototype.requestAnimationFrameCallback = function () {
    this._pendingRender = null;
    if (this._shouldRender()) {
      this._render();
    }
  };

  /**
   * @private
   */
  VirtualScroller.prototype._scheduleRender = function () {
    if (!this._pendingRender) {
      this._pendingRender = rAF(this.requestAnimationFrameCallbackFn);
    }
  };

  /**
   * Returns those children that are about to be displayed and that require to
   * be positioned. If reset or remeasure has been triggered, all children are
   * returned.
   * @return {{indices: Array<number>, children: Array<Element>}}
   * @private
   */
  VirtualScroller.prototype.get_toMeasure = function () {
    var _this = this;
    // optimize for same size
    if (this.sameSizeChildren) {
      var kids = this._ordered;
      var first = this._first;
      if (this._needsRemeasure || first < this._prevFirst || first + kids.length - 1 > this._prevLast) {
        return {
          indices: [first],
          children: kids
        };
      }
      return {
        indices: [],
        children: []
      };
    }
    return this._ordered.reduce(function (toMeasure, c, i) {
      var idx = _this._first + i;
      if (_this._needsRemeasure || idx < _this._prevFirst || idx > _this._prevLast) {
        toMeasure.indices.push(idx);
        toMeasure.children.push(c);
      }
      return toMeasure;
    }, {
      indices: [],
      children: []
    });
  };

  /**
   * Measures each child bounds and builds a map of index/bounds to be passed
   * @private
   */
  VirtualScroller.prototype._measureChildren = function (_ref) {
    var _this2 = this;
    var indices = _ref.indices,
      children = _ref.children;
    // optimize for same size
    if (this.sameSizeChildren) {
      var child = children[0];
      if (child) {
        return this._layout.updateItemSizes(this._measureChild(child, true));
      }
      return false;
    }
    var pm = children.map(function (c, i) {
      return _this2._indexToMeasure[indices[i]] || _this2._measureChild(c);
    });
    var mm = /** @type {{number: {width: number, height: number}}} */
    pm.reduce(function (out, cur, i) {
      out[indices[i]] = _this2._indexToMeasure[indices[i]] = cur;
      return out;
    }, {});
    return this._layout.updateItemSizes(mm[0]);
  };

  /**
   * @protected
   */
  VirtualScroller.prototype._baseRender = function () {
    var _first = this._first;
    var rangeChanged = _first !== this._prevFirst || this._num !== this._prevNum;
    var needsReset = this._needsReset;

    //console.log('virtualscroller._baseRender _first: ' + _first + ', rangeChanged: ' + rangeChanged + ', needsReset: ' + needsReset);

    // Create/update/recycle DOM.
    if (rangeChanged || needsReset) {
      this._last = _first + Math.min(this._num, this._totalItems - _first) - 1;
      if (this._num || this._prevNum) {
        var o = this._ordered;
        var _prevFirst = this._prevFirst;
        var elemsToHide = [o.length];
        var elemToHideIndex = -1;

        // discard head
        for (var idx = _prevFirst; o.length && idx < _first; idx++) {
          var elem = o.shift();
          elemToHideIndex++;
          elemsToHide[elemToHideIndex] = elem;
          this._unassignChild(idx, elem);
        }
        var _last = this._last;
        var _prevLast = this._prevLast;

        // discard tail
        for (var _idx = _prevLast; o.length && _idx > _last; _idx--) {
          var _elem = o.pop();
          elemToHideIndex++;
          elemsToHide[elemToHideIndex] = _elem;
          this._unassignChild(_idx, _elem);
        }
        if (needsReset) {
          this._reset(_first, _last);
        } else {
          var chunksChecked = {};
          this._addHead(chunksChecked);
          this._addTail(chunksChecked);
        }
        var prop = displayProp;
        var propValue = displayHiddenValue;
        for (var i = 0; i <= elemToHideIndex; i++) {
          var _elem2 = elemsToHide[i];
          if (_elem2._unassigned) {
            _elem2._unassigned = null;
            var style = _elem2.style;
            if (style) {
              //console.log('hide child');
              style[prop] = propValue;
            }
          }
        }
      }
    }
    if (this._needsRemeasure) {
      this._indexToMeasure = {};
    }
    // Retrieve DOM to be measured.
    // Do it right before cleanup and reset of properties.
    var shouldMeasure = this._num > 0 && (rangeChanged || this._needsRemeasure);
    //console.log('virtualscroller._baseRender shouldMeasure: ' + shouldMeasure);

    var toMeasure = shouldMeasure ? this.get_toMeasure() : null;

    // Reset internal properties.
    this._prevFirst = this._first;
    this._prevLast = this._last;
    this._prevNum = this._num;
    this._needsReset = false;
    this._needsRemeasure = false;

    // Notify render completed.
    var childrenPos = this._childrenPos;
    if (childrenPos) {
      if (supportsInsetShorthand) {
        if (document.dir === 'rtl') {
          positionChildrenInsetsRtl(this, childrenPos);
        } else {
          positionChildrenInsets(this, childrenPos);
        }
      } else if (supportsTranslate) {
        positionChildrenTranslate(this, childrenPos);
      } else if (supportsTransform) {
        positionChildrenTransforms(this, childrenPos);
      } else {
        positionChildrenAbsolute(this, childrenPos);
      }
      this._childrenPos = null;
    }

    // Measure DOM.
    if (toMeasure) {
      return this._measureChildren(toMeasure);
    }

    // no changes
    return false;
  };

  /**
   * @protected
   */
  VirtualScroller.prototype._render = function () {
    var childrenRO = this._childrenRO;
    if (childrenRO) {
      childrenRO.disconnect();
    }

    // Update layout properties before rendering to have correct first, num,
    // scroll size, children positions.
    if (this._needsUpdateViewSize) {
      this._needsUpdateViewSize = false;
      this._updateViewSize();
    }
    if (this._needsUpdateViewScrollPosition) {
      this._needsUpdateViewScrollPosition = false;
      this._layout.setViewportScroll(this._scrollTarget.getScrollPosition());
    }
    this._layout.reflowIfNeeded();
    // Keep rendering until there is no more scheduled renders.

    while (true) {
      if (this._pendingRender) {
        cAF(this._pendingRender);
        this._pendingRender = null;
      }
      // Update scroll size and correct scroll error before rendering.
      this._sizeContainer(this._scrollSize);
      // Position children (_didRender()), and provide their measures to layout.
      var hasChanges = this._baseRender();
      //console.log('virtualscroller._render hasChanges: ' + hasChanges + ', this._pendingRender: ' + this._pendingRender);
      this._layout.reflowIfNeeded(hasChanges);
      // If layout reflow did not provoke another render, we're done.
      if (!this._pendingRender) {
        break;
      }
    }
    if (childrenRO) {
      // We want to skip the first ResizeObserver callback call as we already
      // measured the children.
      this._skipNextChildrenSizeChanged = true;
      var kids = this._ordered;
      for (var i = 0, length = kids.length; i < length; i++) {
        childrenRO.observe(kids[i]);
      }
    }
  };

  /**
   * @private
   */
  VirtualScroller.prototype._addHead = function (chunksChecked) {
    var start = this._first;
    var end = Math.min(this._last, this._prevFirst - 1);
    var updateElement = this.updateElement;
    var ordered = this._ordered;

    //console.log('virtualscroller._addHead start: ' + start + ', end: ' + end);

    for (var idx = end; idx >= start; idx--) {
      // Maintain dom order.
      var child = this._assignChild(idx, ordered[0], true);
      updateElement(child, idx, null, true, chunksChecked);
      ordered.unshift(child);
    }
  };

  /**
   * @private
   */
  VirtualScroller.prototype._addTail = function (chunksChecked) {
    var start = Math.max(this._first, this._prevLast + 1);
    var end = this._last;
    var updateElement = this.updateElement;
    var ordered = this._ordered;

    //console.log('virtualscroller._addTail start: ' + start + ', end: ' + end);

    for (var idx = start; idx <= end; idx++) {
      var child = this._assignChild(idx, null, true);
      // Maintain dom order.
      updateElement(child, idx, null, true, chunksChecked);
      ordered.push(child);
    }
  };

  /**
   * @param {number} first
   * @param {number} last
   * @private
   */
  VirtualScroller.prototype._reset = function (first, last) {
    var ordered = this._ordered;
    var currentMarker = ordered[0];
    ordered.length = 0;
    var updateElement = this.updateElement;
    var chunksChecked = {};

    //console.log('virtualscroller._reset _first: ' + first + ', _last: ' + last);

    for (var i = first; i <= last; i++) {
      var child = this._assignChild(i, currentMarker);
      ordered.push(child);

      //if (currentMarker) {
      //    if (currentMarker === child) {
      //        currentMarker = child.nextElementSibling;
      //    } else {
      //        container.insertBefore(child, currentMarker);
      //    }
      //}

      updateElement(child, i, null, true, chunksChecked);
    }
  };

  /**
   * @param {number} idx
   * @private
   */
  VirtualScroller.prototype.updateExistingElement = function (index, item) {
    var child = this._keyToChild[index];
    if (child) {
      this.updateElement(child, index, item);
    }
  };

  /**
   * @param {number} idx
   * @private
   */
  VirtualScroller.prototype._assignChild = function (idx, insertBefore, insertElement) {
    var keyToChild = this._keyToChild;
    var child = keyToChild[idx];
    if (child) {
      var container = this._container;
      if (insertElement) {
        container.insertBefore(child, insertBefore);
      }
      child._dataItemIndex = idx;
    } else {
      child = this.createElement(insertBefore);
      child._dataItemIndex = idx;
      keyToChild[idx] = child;
    }
    child._unassigned = null;
    return child;
  };

  /**
   * @param {*} child
   * @param {number} idx
   * @private
   */
  VirtualScroller.prototype._unassignChild = function (idx, child) {
    child._unassigned = true;
    child._dataItemIndex = null;
    this._keyToChild[idx] = null;
    this.recycleElement(child, idx);
  };

  /**
   * @param {!Element} child
   * @return {{
   *   width: number,
   *   height: number,
   *   marginTop: number,
   *   marginRight: number,
   *   marginBottom: number,
   *   marginLeft: number,
   * }} childMeasures
   * @protected
   */
  VirtualScroller.prototype._measureChild = function (child, sameSizeChildren) {
    var childSize = this._childSize;
    if (sameSizeChildren && childSize) {
      return childSize;
    }

    // offsetWidth doesn't take transforms in consideration, so we use
    // getBoundingClientRect which does.
    this._childSize = childSize = child.getBoundingClientRect();
    //console.log('_childSize: ' + JSON.stringify(childSize));
    return childSize;
  };

  /**
   * @private
   */
  VirtualScroller.prototype._containerSizeChanged = function (entries) {
    if (this.paused) {
      return;
    }
    this._containerSize = entries[0].contentRect;
    //console.log('_containerSizeChanged: ' + JSON.stringify(this._containerSize));
    this._needsUpdateViewSize = true;
    this._needsUpdateViewScrollPosition = true;
    this.requestRemeasure();
  };

  /**
   * @private
   */
  VirtualScroller.prototype._scrollTargetSizeChanged = function (entries) {
    if (this.paused) {
      return;
    }

    //console.log('_scrollTargetSizeChanged: ' + JSON.stringify(entries[0].contentRect));

    this._needsUpdateViewSize = true;
    this._needsUpdateViewScrollPosition = true;
    this.requestRemeasure();
  };

  /**
   * @private
   */
  VirtualScroller.prototype._childrenSizeChanged = function () {
    if (this.paused) {
      return;
    }

    //console.log('virtualscroller._childrenSizeChanged');

    if (this._skipNextChildrenSizeChanged) {
      this._skipNextChildrenSizeChanged = false;
    } else {
      this.requestRemeasure();
    }
  };
  VirtualScroller.prototype.onRangeChange = function (range) {
    var num = range.num;
    if (num !== this._num) {
      //console.log('virtualscroller on num change range.num: ' + range.num + ', range.first: ' + range.first);

      this._num = num;
      if (!this.setFirst(range.first)) {
        this._scheduleRender();
      }
    } else {
      this.setFirst(range.first);
    }
  };
  VirtualScroller.prototype.onItemPositionChange = function (event) {
    //console.log('virtualscroller.onItemPositionChange');

    this._childrenPos = event;
    this._scheduleRender();
  };
  VirtualScroller.prototype.onScrollSizeChange = function (size) {
    //console.log('virtualscroller.onScrollSizeChange: ' + size);

    this._scrollSize = size;
    this._scheduleRender();
  };

  /**
   * @param {!Event} event
   * @private
   */
  VirtualScroller.prototype.handleScroll = function (event) {
    //if (!this._scrollTarget || event.target === this._scrollTarget) {
    if (!this.paused) {
      //console.log('virtualscroller.handleScroll');

      //this._needsUpdateViewSize = true;
      this._needsUpdateViewScrollPosition = true;
      this._scheduleRender();
    }
    //}
  };

  /**
   * @private
   */
  VirtualScroller.prototype._updateViewSize = function () {
    var containerElement = this._container;
    var layout = this._layout;
    var containerBounds = containerElement.getBoundingClientRect();
    //console.log('scrollbounds equals: ' + (JSON.stringify(this._scrollTarget.getBoundingClientRect()) === JSON.stringify(this._scrollTarget.getScrollContainerBoundingClientRect())));
    var scrollBounds = this._scrollTarget.getScrollContainerBoundingClientRect();
    //const scrollBounds = this._scrollTarget.getBoundingClientRect();
    //console.log('containerBounds: ' + JSON.stringify(containerBounds));
    //console.log('scrollBounds: ' + JSON.stringify(scrollBounds));
    var scrollerWidth = scrollBounds.width;
    var scrollerHeight = scrollBounds.height;
    var xMin = Math.max(0, Math.min(scrollerWidth, containerBounds.left - scrollBounds.left));
    var yMin = Math.max(0, Math.min(scrollerHeight, containerBounds.top - scrollBounds.top));
    var directionIsVertical = layout.isVertical;
    var xMax = directionIsVertical ? Math.max(0, Math.min(scrollerWidth, containerBounds.right - scrollBounds.left)) : scrollerWidth;
    var yMax = directionIsVertical ? scrollerHeight : Math.max(0, Math.min(scrollerHeight, containerBounds.bottom - scrollBounds.top));

    // all of a sudden in chrome 125 the values are slightly below where they need to be and this impacts the number rolumns in the sidefooter layout. Rounding up resolves that.
    var width = Math.ceil(xMax - xMin);
    var height = Math.ceil(yMax - yMin);

    //const left = Math.max(0, -(containerBounds.left - scrollBounds.left));
    //const top = Math.max(0, -(containerBounds.top - scrollBounds.top));

    //console.log('_updateViewSize width: ' + width);
    //console.log('_updateViewSize height: ' + height);

    var offset = directionIsVertical ? Math.max(0, containerBounds.top - scrollBounds.top) : Math.max(0, containerBounds.left - scrollBounds.left);
    layout.setViewportSize({
      width: width,
      height: height,
      offset: offset
    });
    //layout.setViewportScroll({ top, left });
  };

  /**
   * @private
   */
  VirtualScroller.prototype._sizeContainer = function (size) {
    var containerElem = this._container;
    var styleValue = size ? size + 'px' : null;
    var layout = this._layout;

    // use a fixed height
    // needed in order to use container-type: size on a parent
    // this may be problematic if we ever decide to revisit virtual-scrolling of items with mixed sizes

    if (layout.isVertical) {
      if (containerElem.lastHeight !== styleValue) {
        containerElem.style.height = styleValue;
        containerElem.lastHeight = styleValue;
      }
    } else {
      if (containerElem.lastMinWidth !== styleValue) {
        var containerElemStyle = containerElem.style;
        containerElemStyle.minWidth = styleValue;
        containerElem.lastMinWidth = styleValue;
        var itemHeight = layout._itemDim2();
        var rolumns = layout._rolumns;
        if (itemHeight) {
          containerElemStyle.height = itemHeight * rolumns + 'px';
        }
      }
    }
  };
  function positionChildrenInsets(instance, pos) {
    var layout = instance._layout;
    var rolumns = layout._rolumns;
    var itemDim1 = layout._itemDim1();
    var itemDim2 = layout._itemDim2();
    if (!itemDim1 || !itemDim2) {
      return;
    }
    var kids = instance._ordered;
    var first = instance._first;
    var secondaryPositionOffset = 0;
    if (layout.isVertical && rolumns > 1) {
      var totalItems = layout._totalItems;
      if (totalItems < rolumns) {
        // when there's only one row of items, try to center them horizontally
        var spaceUsed = itemDim2 * totalItems;
        if (spaceUsed) {
          secondaryPositionOffset = Math.floor((layout._viewDim2() - spaceUsed) / 2);
        }
      }
    }
    var childPosition = {
      top: 0,
      left: 0
    };
    var _positionDim = layout._positionDim;
    var _secondaryPositionDim = layout._secondaryPositionDim;
    for (var i = pos.first, length = pos.length; i < length; i++) {
      var child = kids[i - first];
      if (child) {
        childPosition[_positionDim] = Math.floor(i / rolumns) * itemDim1;
        childPosition[_secondaryPositionDim] = i % rolumns * itemDim2 + secondaryPositionOffset;
        var inset = childPosition.top + 'px auto auto ' + childPosition.left + 'px';
        if (inset !== child._lastInset) {
          child.style.inset = inset;
          child._lastInset = inset;
        }
      }
    }
  }
  function positionChildrenInsetsRtl(instance, pos) {
    var layout = instance._layout;
    var rolumns = layout._rolumns;
    var itemDim1 = layout._itemDim1();
    var itemDim2 = layout._itemDim2();
    if (!itemDim1 || !itemDim2) {
      return;
    }
    var kids = instance._ordered;
    var first = instance._first;
    var secondaryPositionOffset = 0;
    if (layout.isVertical && rolumns > 1) {
      var totalItems = layout._totalItems;
      if (totalItems < rolumns) {
        // when there's only one row of items, try to center them horizontally
        var spaceUsed = itemDim2 * totalItems;
        if (spaceUsed) {
          secondaryPositionOffset = Math.floor((layout._viewDim2() - spaceUsed) / 2);
        }
      }
    }
    var childPosition = {
      top: 0,
      left: 0
    };
    var _positionDim = layout._positionDim;
    var _secondaryPositionDim = layout._secondaryPositionDim;
    for (var i = pos.first, length = pos.length; i < length; i++) {
      var child = kids[i - first];
      if (child) {
        childPosition[_positionDim] = Math.floor(i / rolumns) * itemDim1;
        childPosition[_secondaryPositionDim] = i % rolumns * itemDim2 + secondaryPositionOffset;
        var inset = childPosition.top + 'px ' + childPosition.left + 'px auto auto';
        if (inset !== child._lastInset) {
          child.style.inset = inset;
          child._lastInset = inset;
        }
      }
    }
  }
  function positionChildrenAbsolute(instance, pos) {
    var layout = instance._layout;
    var rolumns = layout._rolumns;
    var itemDim1 = layout._itemDim1();
    var itemDim2 = layout._itemDim2();
    if (!itemDim1 || !itemDim2) {
      return;
    }
    var kids = instance._ordered;
    var first = instance._first;
    var secondaryPositionOffset = 0;
    if (layout.isVertical && rolumns > 1) {
      var totalItems = layout._totalItems;
      if (totalItems < rolumns) {
        // when there's only one row of items, try to center them horizontally
        var spaceUsed = itemDim2 * totalItems;
        if (spaceUsed) {
          secondaryPositionOffset = Math.floor((layout._viewDim2() - spaceUsed) / 2);
        }
      }
    }
    for (var i = pos.first, length = pos.length; i < length; i++) {
      var child = kids[i - first];
      if (child) {
        var childPosition = layout._getItemPosition(i, rolumns, itemDim1, itemDim2, secondaryPositionOffset);
        var childStyle = child.style;
        var left = childPosition.left + 'px';
        if (left !== child._lastLeft) {
          childStyle.left = left;
          child._lastLeft = left;
        } else {
          console.log('no change');
        }
        var top = childPosition.top + 'px';
        if (top !== child._lastTop) {
          childStyle.top = top;
          child._lastTop = top;
        }
      }
    }
  }
  function positionChildrenTranslate(instance, pos) {
    var layout = instance._layout;
    var rolumns = layout._rolumns;
    var itemDim1 = layout._itemDim1();
    var itemDim2 = layout._itemDim2();
    if (!itemDim1 || !itemDim2) {
      return;
    }
    var kids = instance._ordered;
    var first = instance._first;
    var inlineMultiplier = instance._inlineMultiplier;
    var secondaryPositionOffset = 0;
    if (layout.isVertical && rolumns > 1) {
      var totalItems = layout._totalItems;
      if (totalItems < rolumns) {
        // when there's only one row of items, try to center them horizontally
        var spaceUsed = itemDim2 * totalItems;
        if (spaceUsed) {
          secondaryPositionOffset = Math.floor((layout._viewDim2() - spaceUsed) / 2);
        }
      }
    }
    var childPosition = {
      top: 0,
      left: 0
    };
    var _positionDim = layout._positionDim;
    var _secondaryPositionDim = layout._secondaryPositionDim;
    for (var i = pos.first, length = pos.length; i < length; i++) {
      var child = kids[i - first];
      if (child) {
        childPosition[_positionDim] = Math.floor(i / rolumns) * itemDim1;
        childPosition[_secondaryPositionDim] = i % rolumns * itemDim2 + secondaryPositionOffset;
        var translate = childPosition.left * inlineMultiplier + 'px ' + childPosition.top + 'px';
        if (translate !== child._lastTranslate) {
          child.style.translate = translate;
          child._lastTranslate = translate;
        }
      }
    }
  }
  function positionChildrenTransforms(instance, pos) {
    var layout = instance._layout;
    var rolumns = layout._rolumns;
    var itemDim1 = layout._itemDim1();
    var itemDim2 = layout._itemDim2();
    if (!itemDim1 || !itemDim2) {
      return;
    }
    var kids = instance._ordered;
    var first = instance._first;
    var inlineMultiplier = instance._inlineMultiplier;
    var secondaryPositionOffset = 0;
    if (layout.isVertical && rolumns > 1) {
      var totalItems = layout._totalItems;
      if (totalItems < rolumns) {
        // when there's only one row of items, try to center them horizontally
        var spaceUsed = itemDim2 * totalItems;
        if (spaceUsed) {
          secondaryPositionOffset = Math.floor((layout._viewDim2() - spaceUsed) / 2);
        }
      }
    }
    for (var i = pos.first, length = pos.length; i < length; i++) {
      var child = kids[i - first];
      if (child) {
        var childPosition = layout._getItemPosition(i, rolumns, itemDim1, itemDim2, secondaryPositionOffset);
        var transform = 'translate(' + childPosition.left * inlineMultiplier + 'px, ' + childPosition.top + 'px)';
        if (transform !== child._lastTransform) {
          child.style.transform = transform;
          child._lastTransform = transform;
        }
      }
    }
  }

  /**
   * @param {Element|null} target
   */
  VirtualScroller.prototype.destroy = function () {
    var ro = this._containerRO;
    if (ro) {
      ro.disconnect();
      this._containerRO = null;
    }
    ro = this._childrenRO;
    if (ro) {
      ro.disconnect();
      this._childrenRO = null;
    }
    var scrollTarget = this._scrollTarget;
    if (scrollTarget && this.boundOnScrollTargetResize) {
      if (scrollTarget.removeResizeObserver) {
        scrollTarget.removeResizeObserver(this.boundOnScrollTargetResize);
      }
    }
    if (scrollTarget && this.boundHandleScroll) {
      if (scrollTarget.removeScrollEventListener) {
        scrollTarget.removeScrollEventListener(this.boundHandleScroll, {
          passive: true
        });
      } else {
        _dom.default.removeEventListener(scrollTarget, 'scroll', this.boundHandleScroll, {
          passive: true
        });
      }
    }
    this.requestAnimationFrameCallbackFn = null;
    this.boundHandleScroll = null;
    this.boundOnScrollTargetResize = null;
    this._container = null;
    this._containerSize = null;
  };
  function onDataLoaderTimeout() {
    var instance = this;
    var scroller = this.scroller;
    var abortController = new AbortController();
    this.abortController = abortController;
    scroller.loadItems(instance.startIndex, abortController.signal);
  }
  function DataLoader(scroller, startIndex) {
    this.scroller = scroller;

    //console.log('creating DataLoader with index: ' + startIndex);

    this.startIndex = startIndex;
    this.dataLoadTimeout = setTimeout(onDataLoaderTimeout.bind(this), 140);
  }
  function removeItemOnce(arr, value) {
    var index = arr.indexOf(value);
    if (index > -1) {
      arr.splice(index, 1);
    }
    return arr;
  }
  function destroyHiddenDataLoaderFromStartIndex(scrollerElement, startIndex) {
    var loaders = scrollerElement.dataLoaders.slice(0);
    for (var i = 0, length = loaders.length; i < length; i++) {
      var loader = loaders[i];
      if (loader.startIndex === startIndex) {
        //console.log('destroy dataloader: ' + startIndex);
        removeItemOnce(scrollerElement.dataLoaders, loader);
        loader.destroy();
      }
    }
  }
  function destroyHiddenDataLoaders(scrollerElement, chunkSize) {
    var loaders = scrollerElement.dataLoaders.slice(0);
    var scroller = scrollerElement.scroller;
    var first = scroller._first;
    var last = scroller._last;

    //console.log('destroyHiddenDataLoaders first: ' + first + ', last: ' + last);

    for (var i = 0, length = loaders.length; i < length; i++) {
      var loader = loaders[i];
      var startIndex = loader.startIndex;
      if (startIndex + chunkSize < first || startIndex > last) {
        //console.log('destroy dataloader: ' + startIndex);
        removeItemOnce(scrollerElement.dataLoaders, loader);
        loader.destroy();
      }
    }
  }
  DataLoader.prototype.destroy = function () {
    var timeout = this.dataLoadTimeout;
    if (timeout) {
      clearTimeout(timeout);
      this.dataLoadTimeout = null;
    }
    var abortController = this.abortController;
    if (abortController) {
      //console.log('aborting fetch request');
      abortController.abort();
    }
    this.abortController = null;
    this.scroller = null;
  };
  function getDataLoader(scroller, startIndex) {
    var loaders = scroller.dataLoaders;
    for (var i = 0, length = loaders.length; i < length; i++) {
      var loader = loaders[i];
      if (loader.startIndex === startIndex) {
        return loader;
      }
    }
    return null;
  }
  function cancelDataLoading(scroller) {
    var loaders = scroller.dataLoaders.slice(0);
    scroller.dataLoaders = [];
    for (var i = 0, length = loaders.length; i < length; i++) {
      loaders[i].destroy();
    }
  }
  function onInit() {
    var elem = this;
    if (elem.hasVirtualScrollerInit) {
      return;
    }
    elem.hasVirtualScrollerInit = true;
    this.scroller = null;
    // Default create/update/recycleElement.
    this.nodePool = [];
    this.dataLoaders = [];
    this.childTemplate = null;
    this.setItemSourceInternal(null);
  }
  function focusAfterTimeout(element) {
    setTimeout(function () {
      _focusmanager.default.focus(element);
    }, 0);
  }
  function updateElementOuter(element, index, item, showElement, chunksChecked) {
    if (!item) {
      item = this._itemSource[index];
    }
    if (item) {
      //let rect = element.getBoundingClientRect();
      //const height = rect.height;
      //const width = rect.width;

      this.updateElement(element, item, index);

      //rect = element.getBoundingClientRect();
      //const newHeight = rect.height;
      //const newWidth = rect.width;

      //if (height !== newHeight) {
      //    console.log(item.Name + ': ' + 'height: ' + height + '---new height: ' + newHeight + '---' + this.templateInnerHTML);
      //}
      //if (width !== newWidth) {
      //    console.log(item.Name + ': ' + 'width: ' + width + '---new width: ' + newWidth + '---' + this.templateInnerHTML);
      //}

      if (showElement) {
        var style = element.style;
        if (style) {
          style[displayProp] = null;
        }
      }
      if (index === this._focusIndex) {
        this._focusIndex = null;
        // seeing issues where trying to focus at the end of a horizontal causing content to disappear
        focusAfterTimeout(element);
      }
    } else {
      element.innerHTML = this.templateInnerHTML;
      element.lastInnerHTML = null;
      var chunkSize = this.virtualChunkSize;
      var chunkStart = index - index % chunkSize;
      if (chunksChecked) {
        if (!chunksChecked[chunkStart]) {
          chunksChecked[chunkStart] = true;

          //console.log('need to load data for index: ' + index + ', chunkstart: ' + chunkStart);

          destroyHiddenDataLoaders(this, chunkSize);
          if (!getDataLoader(this, chunkStart)) {
            this.dataLoaders.push(new DataLoader(this, chunkStart));
          }
        }
      }
      if (showElement) {
        var _style = element.style;
        if (_style) {
          _style[displayProp] = null;
        }
      }
    }
  }
  function recycleElement(element, index) {
    this.nodePool.push(element);
    var fn = this.onRecycleElement;
    if (fn) {
      fn(element, index);
    }
  }
  function _createElement(insertBefore) {
    var scroller = this.scroller;
    var nodePool = this.nodePool;
    var result = nodePool.pop();
    if (result) {
      scroller._container.insertBefore(result, insertBefore);
      return result;
    }
    var template = this.childTemplate;
    if (!template) {
      var fragment = document.createElement('div');
      fragment.innerHTML = this.templateHTML;
      template = this.childTemplate = fragment.firstChild.cloneNode(true);
      fragment.innerHTML = '';
    }
    var newElement = template.cloneNode(true);
    scroller._container.insertBefore(newElement, insertBefore);
    return newElement;
  }
  var VirtualScrollerElement = /*#__PURE__*/function (_HTMLDivElement) {
    function VirtualScrollerElement() {
      var _this3;
      // address the upgraded instance and use it
      var self = _this3 = _HTMLDivElement.call(this) || this;
      onInit.call(self);
      return babelHelpers.possibleConstructorReturn(_this3, self);
    }
    babelHelpers.inherits(VirtualScrollerElement, _HTMLDivElement);
    return babelHelpers.createClass(VirtualScrollerElement, [{
      key: "addClasses",
      value: function addClasses() {
        this.classList.add('virtual-scroller');
      }
    }, {
      key: "connectedCallback",
      value: function connectedCallback() {
        onInit.call(this);
      }
    }, {
      key: "disconnectedCallback",
      value: function disconnectedCallback() {
        this.abortRequests();
        this.hasVirtualScrollerInit = null;
        var scroller = this.scroller;
        this.scroller = null;
        if (scroller) {
          scroller.destroy();
        }
        this.nodePool = null;
        this.childTemplate = null;
        this.setItemSourceInternal(null);
        this.classList.remove('virtual-scroller');
      }
    }, {
      key: "setItemSourceInternal",
      value: function setItemSourceInternal(items) {
        this._itemSource = items;
        if (!items) {
          this._itemSourceMap = null;
          return;
        }
        var map = {};
        for (var i = 0, length = items.length; i < length; i++) {
          var item = items[i];
          if (!item) {
            break;
          }
          var id = item.Id;
          if (id) {
            map[id] = i;
          }
        }
        this._itemSourceMap = map;
      }
    }, {
      key: "setItemSource",
      value: function setItemSource(itemSource, totalItems) {
        this.abortRequests();
        if (totalItems) {
          itemSource.length = totalItems;
        }
        this.setItemSourceInternal(itemSource);
        var scroller = this.scroller;
        if (!scroller) {
          var layoutAttr = this.getAttribute('layout');
          scroller = this.scroller = new VirtualScroller({
            container: this,
            scrollTarget: this.closest('.emby-scroller'),
            sameSizeChildren: true
          });
          scroller.updateElement = updateElementOuter.bind(this);
          scroller.createElement = _createElement.bind(this);
          scroller.recycleElement = recycleElement.bind(this);
          var direction = layoutAttr.indexOf('horizontal') === 0 ? 'horizontal' : 'vertical';
          var layout = new Layout1dGrid({
            minOverhang: parseInt(this.getAttribute('data-minoverhang') || '0')
          });
          layout.setDirection(direction);
          scroller.setLayout(layout);
        }

        // Request reset because items might have changed.
        scroller.setTotalItems(itemSource.length, true);
      }
    }, {
      key: "loadItems",
      value: function loadItems(index, signal) {
        //console.log('loadItems from index: ' + index);

        var chunkSize = this.virtualChunkSize;
        var chunkStart = index;
        var instance = this;
        this.fetchItems({
          StartIndex: chunkStart,
          Limit: chunkSize,
          EnableTotalRecordCount: false
        }, signal).then(function (result) {
          var items = result.Items || result;
          var itemSource = instance._itemSource;
          if (!itemSource) {
            // scroller may have been disposed
            return;
          }

          //console.log('load completed for index: ' + chunkStart);

          var itemSourceMap = instance._itemSourceMap;
          for (var i = 0, length = items.length; i < length; i++) {
            var itemIndex = chunkStart + i;
            if (!itemSource[itemIndex]) {
              var item = items[i];
              var id = item.Id;
              if (id) {
                itemSourceMap[id] = itemIndex;
              }
              itemSource[itemIndex] = item;
              instance.scroller.updateExistingElement(itemIndex, item);
            }
          }
        }, function (error) {
          //console.log('load cancelled for index: ' + chunkStart);

          //instance.chunksLoaded[chunkStart] = null;
          destroyHiddenDataLoaderFromStartIndex(instance, chunkStart);

          //if (error?.name === 'AbortError') {
          //    console.log('virtualScroller getItems request aborted.');
          //} else {
          //    console.log('virtualScroller getItems error: ' + error);
          //}
        });
      }
    }, {
      key: "scrollToIndex",
      value: function scrollToIndex(index, scrollOptions, setFocus) {
        index = Math.min(index, this._itemSource.length - 1);

        //console.log('scrollToIndex: ' + index);

        if (setFocus) {
          var item = this.scroller._keyToChild[index];
          if (item) {
            _focusmanager.default.focus(item);
            return;
          }
        }
        var scroller = this.scroller;
        var layout = scroller.getLayout();
        var rolumns = layout._rolumns;
        var cow = Math.floor(index / rolumns);
        var itemDim1 = layout._itemDim1();
        var pos = cow * itemDim1;
        var instance = this;
        if (setFocus) {
          instance._focusIndex = index;
        }
        var posOptions = {};
        if (!scrollOptions) {
          scrollOptions = {};
        }
        if (scrollOptions.behavior) {
          posOptions.behavior = scrollOptions.behavior;
        } else if (setFocus) {
          if (scrollOptions.forceInstantScroll !== false) {
            posOptions.behavior = 'instant';
          }
        }
        var isVertical = layout.isVertical;
        if (isVertical) {
          posOptions.top = pos;
          posOptions.offsetTop = scrollOptions.offsetTop;
          posOptions.skipWhenVisibleY = scrollOptions.skipWhenVisibleY;
          posOptions.skipWhenAnyVisibleY = scrollOptions.skipWhenVisibleY && setFocus && scroller.options.focusScroll;
          posOptions.itemSize = itemDim1;
        } else {
          posOptions.left = pos;
          posOptions.offsetLeft = scrollOptions.offsetLeft;
          posOptions.skipWhenVisibleX = scrollOptions.skipWhenVisibleX;
          posOptions.skipWhenAnyVisibleX = scrollOptions.skipWhenVisibleX && setFocus && scroller.options.focusScroll;
          posOptions.itemSize = itemDim1;
        }
        var promise = scroller._scrollTarget.scrollToPosition(posOptions);
        if (setFocus) {
          this._focusIndexInternal(promise, index);
        }
        return promise;
      }
    }, {
      key: "_focusIndexInternal",
      value: function _focusIndexInternal(promise, index) {
        var instance = this;
        return promise.then(function () {
          var newFocusIndex = instance._focusIndex;
          if (newFocusIndex != null && newFocusIndex !== index) {
            return;
          }
          var item = instance.scroller._keyToChild[index];
          if (item) {
            _focusmanager.default.focus(item);
          } else {
            instance._focusIndex = index;
          }
        });
      }
    }, {
      key: "pause",
      value: function pause() {
        var scroller = this.scroller;
        if (scroller) {
          scroller.paused = true;
        }
      }
    }, {
      key: "resume",
      value: function resume() {
        var scroller = this.scroller;
        if (scroller) {
          var paused = scroller.paused;
          if (paused) {
            scroller.paused = false;
            scroller.requestReset(true);
          }
        }
      }

      // Call this when the scroller or virtual container is resized in a way that can't be detected via ResizeObserver
      // Css animation or transform is an example of that, so call this after animation is complete
    }, {
      key: "onResized",
      value: function onResized() {
        var scroller = this.scroller;
        if (scroller) {
          var paused = scroller.paused;
          if (!paused) {
            scroller.requestReset(true);
          }
        }
      }
    }, {
      key: "abortRequests",
      value: function abortRequests() {
        cancelDataLoading(this);
      }
    }, {
      key: "resetAll",
      value: function resetAll() {
        this.abortRequests();
        this.innerHTML = '';
        var scroller = this.scroller;
        if (scroller) {
          scroller.paused = true;
          scroller.destroy();
        }
        this.hasVirtualScrollerInit = false;
        onInit.call(this);
      }
    }, {
      key: "indexOfItemId",
      value: function indexOfItemId(id) {
        var map = this._itemSourceMap;
        if (!map) {
          return -1;
        }
        var index = map[id];
        if (index == null) {
          return -1;
        }
        return index;
      }
    }, {
      key: "getElement",
      value: function getElement(index) {
        // This method will only be able to get what is currently rendererd
        return this.scroller._keyToChild[index];
      }
    }, {
      key: "getItem",
      value: function getItem(index) {
        return this._itemSource[index];
      }
    }, {
      key: "getItemFromElement",
      value: function getItemFromElement(element) {
        var index = this.indexOfElement(element);
        if (index >= 0) {
          var elem = this.getItem(index);
          if (elem) {
            return elem;
          }
        }
        return null;
      }
    }, {
      key: "indexOfElement",
      value: function indexOfElement(element) {
        var index = element._dataItemIndex;
        if (index == null) {
          return -1;
        }
        return index;
      }
    }, {
      key: "onItemUpdated",
      value: function onItemUpdated(index, item) {
        this._itemSource[index] = item;
        this._itemSourceMap[item.Id] = index;
        this.scroller.updateExistingElement(index, item);
      }
    }, {
      key: "getActiveItems",
      value: function getActiveItems() {
        var scroller = this.scroller;
        var first = scroller._first;
        var last = scroller._last;

        //console.log('_first:' + first);
        //console.log('_last:' + last);

        return {
          elements: scroller._ordered.slice(0),
          firstIndex: first,
          lastIndex: last
        };
      }
    }]);
  }(/*#__PURE__*/babelHelpers.wrapNativeSuper(HTMLDivElement));
  customElements.define('virtual-scroller', VirtualScrollerElement, {
    extends: 'div'
  });
  var _default = _exports.default = VirtualScrollerElement;
});
