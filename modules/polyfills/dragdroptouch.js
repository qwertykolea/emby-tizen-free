define(["./../dom.js"], function (_dom) {
  /* jshint module: true */

  var kbdProps = 'altKey,ctrlKey,metaKey,shiftKey'.split(',');
  var ptProps = 'pageX,pageY,clientX,clientY,screenX,screenY'.split(',');

  /**
   * Initializes the single instance of the @see:DragDrop class.
   */
  function DragDrop() {
    this._boundPointerMove = this._PointerMove.bind(this);
    this._boundPointerUp = this._PointerUp.bind(this);
    this._boundContextMenu = this._contextMenu.bind(this);
    _dom.default.addEventListener(document, window.PointerEvent ? 'pointerdown' : 'touchstart', this._pointerDown.bind(this), {
      passive: true
    });
  }
  DragDrop.prototype.addAdditionalEventListeners = function () {
    this._devicePixelRatio = window.devicePixelRatio || 1;
    _dom.default.addEventListener(document, 'pointermove', this._boundPointerMove, {
      passive: false,
      capture: false
    });

    // need the preventDefault here in order to prevent scrolling
    _dom.default.addEventListener(document, 'touchmove', this._boundPointerMove, {
      passive: false,
      capture: false
    });
    if (window.PointerEvent) {
      _dom.default.addEventListener(document, 'pointerup', this._boundPointerUp, {
        passive: true
      });
      _dom.default.addEventListener(document, 'pointercancel', this._boundPointerUp, {
        passive: true
      });
    } else {
      _dom.default.addEventListener(document, 'touchend', this._boundPointerUp, {
        passive: true
      });
    }
    _dom.default.addEventListener(document, 'contextmenu', this._boundContextMenu, {
      passive: true
    });
  };
  DragDrop.prototype.removeAdditionalEventListeners = function () {
    _dom.default.removeEventListener(document, 'pointermove', this._boundPointerMove, {
      passive: false,
      capture: false
    });
    _dom.default.removeEventListener(document, 'touchmove', this._boundPointerMove, {
      passive: false,
      capture: false
    });
    _dom.default.removeEventListener(document, 'pointerup', this._boundPointerUp, {
      passive: true
    });
    _dom.default.removeEventListener(document, 'pointercancel', this._boundPointerUp, {
      passive: true
    });
    _dom.default.removeEventListener(document, 'touchend', this._boundPointerUp, {
      passive: true
    });
    _dom.default.removeEventListener(document, 'contextmenu', this._boundContextMenu, {
      passive: true
    });
  };

  // ** event handlers
  DragDrop.prototype._contextMenu = function (e) {
    this.removeAdditionalEventListeners();
    this._destroyImage();
    this._reset();
  };

  // ** event handlers
  DragDrop.prototype._pointerDown = function (e) {
    var pointerType = e.pointerType;
    if (pointerType === 'mouse') {
      if (e.button !== 0) {
        return;
      }
    }
    if (shouldHandle(e)) {
      // clear all variables
      this._reset();
      // get nearest draggable element
      var target = e.target;
      var src = target.closest('[draggable="true"]');
      if (src) {
        this.addAdditionalEventListeners(src);

        // get ready to start dragging
        this._dragSource = src;
        this._dragSourceDraggableX = src.classList.contains('draggable-x');
        this._dragSourceDraggableY = src.classList.contains('draggable-y');
        this._dragSourceDraggableXY = src.classList.contains('draggable-xy') || !this._dragSourceDraggableX && !this._dragSourceDraggableY;
        this._ptDown = getPoint(e);
        this._lastPointerEvent = e;
        //e.preventDefault();

        var delay = target.classList.contains('dragHandle') ? 200 : 400;
        if (!pointerType) {
          if (e.type === 'touchstart') {
            pointerType = 'touch';
          }
        }
        if (pointerType && pointerType !== 'touch') {
          delay = 0;
        }
        this._pointerDownTime = e.timeStamp;
        this._delay = delay;
      }
    }
  };
  DragDrop.prototype._PointerMove = function (e) {
    if (e.pointerType === 'touch' && e.type === 'pointermove') {
      return;
    }
    var dragEnabled = this._isDragEnabled;

    // reset data if user drags without pressing & holding
    var pt = getPoint(e);
    var ptDown = this._ptDown;
    var deltaX = Math.abs(pt.x - ptDown.x);
    var deltaY = Math.abs(pt.y - ptDown.y);
    var PRESSHOLDMARGIN = 10; // pixels that finger might shiver while pressing
    var PRESSHOLDTHRESHOLD = 5; // pixels to move before drag starts

    var dragSource = this._dragSource;
    if (!dragEnabled && dragSource) {
      if (this._dragSourceDraggableX) {
        if (deltaY <= PRESSHOLDMARGIN / 2 && deltaX > PRESSHOLDTHRESHOLD || deltaY <= 3 && deltaX > 0) {
          this._isDragEnabled = dragEnabled = true;
          this._dragY = false;
        }
      }
    }
    if (!dragEnabled) {
      if (e.timeStamp - this._pointerDownTime >= this._delay) {
        if (this._dragSourceDraggableXY) {
          this._dragY = true;
          this._dragX = true;
          this._isDragEnabled = dragEnabled = true;
        }
      }
    }
    var delta = deltaX + deltaY;
    if (!dragEnabled && delta > PRESSHOLDMARGIN) {
      this._reset();
      return;
    }
    if (!dragEnabled) {
      return;
    }
    e.preventDefault(); // prevent scrolling

    var touches = e.touches;
    if (!touches || touches.length) {
      // allow to handle moves that involve many touches for press & hold
      // see if target wants to handle move
      var target = getTarget(pt);

      // start dragging

      if (dragSource && !this._img && delta > PRESSHOLDTHRESHOLD) {
        if (dispatchEvent(this, this._lastPointerEvent, 'dragstart', dragSource, pt)) {
          // target canceled the drag event
          this._dragSource = null;
          this._dragSourceDraggableX = null;
          this._dragSourceDraggableY = null;
          this._dragSourceDraggableXY = null;
          return;
        }
        this._createImage(e);
        dispatchEvent(this, e, 'dragenter', target, pt);
      }
      // continue dragging
      if (this._img) {
        var _target, _target2;
        this._lastPointerEvent = e;
        var lastTarget = this._lastTarget;
        if (target !== lastTarget && (!lastTarget || !((_target = target) != null && _target.contains(lastTarget)))) {
          if (lastTarget) {
            lastTarget.parentNode.style.cursor = null;
            lastTarget.style.pointerEvents = null;
          }
          dispatchEvent(this, this._lastPointerEvent, 'dragleave', lastTarget, pt);
          dispatchEvent(this, e, 'dragenter', target, pt);
          this._lastTarget = target;
        } else if (lastTarget) {
          target = lastTarget;
        }
        this._moveImage(e, pt);
        if ((_target2 = target) != null && _target2.matches('a,button,div[tabindex]')) {
          target.style.pointerEvents = 'none';
        }
        if (dispatchEvent(this, e, 'dragover', target, pt)) {
          this._isDropZone = true;
          var dropEffect = this._dataTransfer.dropEffectEmby;
          switch (dropEffect) {
            case 'copy':
              target.parentNode.style.cursor = 'copy';
              break;
            case 'move':
              target.parentNode.style.cursor = 'move';
              break;
            case 'none':
              target.parentNode.style.cursor = 'no-drop';
              break;
            case 'link':
              target.parentNode.style.cursor = 'alias';
              break;
            default:
              target.parentNode.style.cursor = 'copy';
              break;
          }
        } else {
          this._isDropZone = false;
          if (target) {
            target.parentNode.style.cursor = 'no-drop';
          }
        }
        dispatchEvent(this, e, 'drag', dragSource, pt);
      }
    }
  };
  DragDrop.prototype._PointerUp = function (e) {
    this.removeAdditionalEventListeners();
    this._destroyImage();
    if (shouldHandle(e)) {
      // finish dragging
      if (this._dragSource) {
        var pt = getPoint(this._lastPointerEvent);
        if (e.type.indexOf('cancel') < 0 && this._isDropZone) {
          dispatchEvent(this, this._lastPointerEvent, 'drop', this._lastTarget, pt);
        }
        dispatchEvent(this, this._lastPointerEvent, 'dragend', this._dragSource, pt);
      }
    }
    this._reset();
  };
  function shouldHandle(e) {
    if (e.defaultPrevented) {
      return false;
    }
    var touches = e.touches;
    if (touches && touches.length > 2) {
      return false;
    }
    return true;
  }

  // clear all members
  DragDrop.prototype._reset = function () {
    this.removeAdditionalEventListeners();
    this._destroyImage();
    this._dragSource = null;
    this._dragSourceDraggableX = null;
    this._dragSourceDraggableY = null;
    this._dragSourceDraggableXY = null;
    this._lastPointerEvent = null;
    var lastTarget = this._lastTarget;
    if (lastTarget) {
      lastTarget.parentNode.style.cursor = null;
      lastTarget.style.pointerEvents = null;
    }
    this._lastTarget = null;
    this._ptDown = null;
    this._isDragEnabled = false;
    this._isDropZone = false;
    this._dataTransfer = null;
    this._pointerDownTime = 0;
    this._delay = 0;
    this._dragX = true;
    this._dragY = true;
  };
  function getPoint(e, page) {
    var touches = e.touches;
    if (touches) {
      if (touches.length) {
        e = touches[0];
      }
    }
    return {
      x: page ? e.pageX : e.clientX,
      y: page ? e.pageY : e.clientY
    };
  }
  function getTarget(pt) {
    var el = document.elementFromPoint(pt.x, pt.y);
    if (el) {
      var btn = el.closest('a,button,div[tabindex]');
      if (btn) {
        return btn;
      }
    }
    return el;
  }

  // create drag image from source element
  DragDrop.prototype._createImage = function (e) {
    // just in case...
    if (this._img) {
      this._destroyImage();
    }
    // create drag image from custom element or drag source
    var src = this._dragSource;
    this._img = src.cloneNode(true);
    copyStyle(src, this._img);

    // if creating from drag source, apply offset and opacity
    var rc = src.getBoundingClientRect();
    this._img.style.opacity = '.9';
    this._img.style.position = 'absolute';
    this._img.style.pointerEvents = 'none';
    this._img.style.zIndex = '999999';
    var left = rc.left;
    var top = rc.top;
    this._img.style.left = Math.round(left) + 'px';
    this._img.style.top = Math.round(top) + 'px';
    this._img.classList.add('dragClone');
    document.body.appendChild(this._img);
    void this._img.offsetWidth;
    this._img.classList.add('dragging');
  };
  function removeImage(instance, img, dragSource, lastPointerEvent) {
    img.remove();
    if (dragSource) {
      var pt = getPoint(lastPointerEvent);
      dispatchEvent(instance, lastPointerEvent, 'dragendcomplete', dragSource, pt);
    }
  }
  function animateRemoveImage(instance, img, dragSource, lastPointerEvent) {
    var time = instance._dragY === false ? 400 : 300;
    var opacityTime = instance._dragX && instance._dragY ? time - 20 : time;
    img.style.transition = 'transform ' + time + 'ms ease-out,opacity ' + opacityTime + 'ms ease-out';
    img.classList.remove('dragging');
    img.style.transform = 'none';
    img.style.opacity = '1';
    setTimeout(function () {
      removeImage(instance, img, dragSource, lastPointerEvent);
    }, time);
  }

  // dispose of drag image element
  DragDrop.prototype._destroyImage = function () {
    var img = this._img;
    if (img) {
      this._img = null;
      if (this._isDropZone && this._dragY !== false) {
        removeImage(this, img, this._dragSource, this._lastPointerEvent);
      } else {
        animateRemoveImage(this, img, this._dragSource, this._lastPointerEvent);
      }
    }
  };
  function scrollYIfNeeded(e, pt, ptDown) {
    if (e.pointerType !== 'mouse') {
      return;
    }
    var scroller = e.target.closest('.emby-scroller.scrollFrameY');
    if (!scroller) {
      return;
    }
    var rect = scroller.getScrollContainerBoundingClientRect();

    //console.log('rect: ' + JSON.stringify(rect) + ', pt: ' + JSON.stringify(pt));

    var boundarySize = Math.round(rect.height / 6);
    var scrollBy = 20;
    var topY1 = rect.top;
    var topY2 = topY1 + boundarySize;
    if (pt.y >= topY1 && pt.y < topY2) {
      // make sure they're moving in the upwards direction
      // avoid sudden scroll up just by starting a drag on an element near the top
      // this would be better if compared to previous points instead of the initial one
      if (pt.y < ptDown.y) {
        scroller.scrollBy(0 - scrollBy);
      }
      return;
    }
    var bottomY2 = rect.bottom;
    var bottomY1 = bottomY2 - boundarySize;
    if (pt.y >= bottomY1 && pt.y < bottomY2) {
      // make sure they're moving in the downwards direction
      // avoid sudden scroll down just by starting a drag on an element near the bottom
      // this would be better if compared to previous points instead of the initial one
      if (pt.y > ptDown.y) {
        scroller.scrollBy(scrollBy);
      }
    }
  }

  // move the drag image element
  DragDrop.prototype._moveImage = function (e, pt) {
    var _this = this;
    requestAnimationFrame(function () {
      var img = _this._img;
      if (img) {
        var s = img.style;
        var ptDown = _this._ptDown;
        var deltaX = pt.x - ptDown.x;
        var deltaY = pt.y - ptDown.y;
        if (!_this._dragX) {
          deltaX = 0;
        }
        if (!_this._dragY) {
          deltaY = 0;
        }
        s.transform = 'translate(' + Math.round(deltaX) + 'px, ' + Math.round(deltaY) + 'px)';
        if (_this._dragY) {
          scrollYIfNeeded(e, pt, ptDown);
        }
      }
    });
  };

  // copy properties from an object to another
  function copyProps(dst, src, props) {
    for (var i = 0; i < props.length; i++) {
      var p = props[i];
      dst[p] = src[p];
    }
  }
  function copyStyle(src, dst) {
    // remove potentially troublesome attributes
    // copy canvas content
    if (src instanceof HTMLCanvasElement) {
      var cSrc = src,
        cDst = dst;
      cDst.width = cSrc.width;
      cDst.height = cSrc.height;
      cDst.getContext('2d').drawImage(cSrc, 0, 0);
    }
    // copy style (without transitions)
    var cs = getComputedStyle(src);
    var i;
    for (i = 0; i < cs.length; i++) {
      var key = cs[i];
      if (key.indexOf('transition') < 0) {
        dst.style[key] = cs[key];
      }
    }
    dst.style.pointerEvents = 'none';
    // and repeat for all children
    for (i = 0; i < src.children.length; i++) {
      copyStyle(src.children[i], dst.children[i]);
    }
    dst.style.transform = 'none';
    dst.style.translate = 'none';
    dst.style.scale = 'none';
  }
  function dispatchEvent(instance, e, type, target, pt) {
    if (e && target) {
      var evt = document.createEvent('Event');
      var t = e.touches ? e.touches[0] : e;
      evt.initEvent(type, true, true);
      evt.button = 0;
      evt.which = evt.buttons = 1;
      evt.detail = {
        polyfill: true,
        dragX: instance._dragX,
        dragY: instance._dragY,
        //dragSource: instance._dragSource,
        pt: pt,
        ptDown: instance._ptDown
      };
      copyProps(evt, e, kbdProps);
      copyProps(evt, t, ptProps);
      var dataTransfer = instance._dataTransfer;
      if (!dataTransfer) {
        dataTransfer = instance._dataTransfer = new DataTransfer();
      }
      evt.dataTransfer = dataTransfer;
      target.dispatchEvent(evt);
      return evt.defaultPrevented;
    }
    return false;
  }
  new DragDrop();
});
