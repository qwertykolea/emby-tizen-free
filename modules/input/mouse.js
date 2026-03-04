define(["exports", "./../dom.js", "./../layoutmanager.js", "./../common/inputmanager.js", "./../emby-apiclient/events.js", "./../common/methodtimer.js", "./../focusmanager.js"], function (_exports, _dom, _layoutmanager, _inputmanager, _events, _methodtimer, _focusmanager) {
  Object.defineProperty(_exports, "__esModule", {
    value: true
  });
  _exports.default = void 0;
  /* jshint module: true */

  var mouseManager = {};
  var lastMouseInputTime = 0;
  var isMouseIdle;
  function mouseIdleTime() {
    return Date.now() - lastMouseInputTime;
  }
  var TopElement = document.body;
  function removeIdleClasses() {
    isMouseIdle = false;
    var classList = TopElement.classList;
    classList.remove('mouseIdle');
    _events.default.trigger(mouseManager, 'mouseidlestop');
  }
  function addIdleClasses() {
    isMouseIdle = true;
    var classList = TopElement.classList;
    classList.add('mouseIdle');
    _events.default.trigger(mouseManager, 'mouseidlestart');
  }
  var lastPointerMoveData;
  function onPointerMove(e) {
    var eventX = e.screenX;
    var eventY = e.screenY;

    // if coord don't exist how could it move
    if (typeof eventX === 'undefined' && typeof eventY === 'undefined') {
      return;
    }
    var obj = lastPointerMoveData;
    if (!obj) {
      lastPointerMoveData = {
        x: eventX,
        y: eventY
      };
      return;
    }

    // if coord are same, it didn't move
    if (Math.abs(eventX - obj.x) < 10 && Math.abs(eventY - obj.y) < 10) {
      return;
    }
    obj.x = eventX;
    obj.y = eventY;
    lastMouseInputTime = Date.now();
    if (isMouseIdle) {
      removeIdleClasses();
    }
  }
  var SupportsTouchEvent = 'ontouchstart' in document.documentElement;
  var SupportsPointerType = typeof PointerEvent !== 'undefined' && 'pointerType' in PointerEvent.prototype;
  var DefaultPointerType = SupportsPointerType ? null : SupportsTouchEvent ? 'touch' : 'mouse';
  function onPointerEnter(e) {
    var pointerType = e.pointerType || DefaultPointerType;
    if (pointerType !== 'mouse') {
      return;
    }
    if (!isMouseIdle) {
      var target = e.target;
      if (target.closest && !target.closest('.nohoverfocus')) {
        // pass in false to not scroll based on focusable groupings (e.g. clicking in a blank spot within a focusable area
        var parent = _focusmanager.default.focusableParent(target, false);
        if (parent) {
          _focusmanager.default.focus(parent);
        }
      }
    }
  }
  function enableFocusWithMouse() {
    if (!_layoutmanager.default.tv) {
      return false;
    }
    return false;
  }
  function onMouseInterval() {
    if (!isMouseIdle && mouseIdleTime() >= 5000) {
      addIdleClasses();
    }
  }
  var mouseInterval;
  function startMouseInterval() {
    if (!mouseInterval) {
      mouseInterval = new _methodtimer.default({
        onInterval: onMouseInterval,
        timeoutMs: 5000,
        type: 'interval'
      });
      _events.default.trigger(mouseManager, 'mouselisteningstart');
    }
  }
  function stopMouseInterval() {
    var interval = mouseInterval;
    if (interval) {
      interval.destroy();
      mouseInterval = null;
      _events.default.trigger(mouseManager, 'mouselisteningstop');
    }
  }
  function stopMouseListening() {
    stopMouseInterval();
    removeIdleClasses();
    _dom.default.removeEventListener(document, 'pointermove', onPointerMove, {
      passive: true
    });
    _dom.default.removeEventListener(document, 'mousemove', onPointerMove, {
      passive: true
    });
  }
  function startMouseListening() {
    if (_layoutmanager.default.tv) {
      addIdleClasses();
    } else {
      removeIdleClasses();
    }
    startMouseInterval();
    if (window.PointerEvent) {
      _dom.default.addEventListener(document, 'pointermove', onPointerMove, {
        passive: true
      });
    } else {
      _dom.default.addEventListener(document, 'mousemove', onPointerMove, {
        passive: true
      });
    }
  }
  var listeners = [];
  function requestMouseListening(listener) {
    if (listeners.includes(listener)) {
      return;
    }
    if (listeners.length === 0) {
      startMouseListening();
    }
    listeners.push(listener);
  }
  function releaseMouseListening(listener) {
    var index = listeners.indexOf(listener);
    if (index !== -1) {
      listeners.splice(index, 1);
    }
    if (!listeners.length) {
      stopMouseListening();
    }
  }
  function initMouse() {
    if (_layoutmanager.default.tv) {
      requestMouseListening("tv");
    } else {
      releaseMouseListening("tv");
    }
    _dom.default.removeEventListener(document, window.PointerEvent ? 'pointerenter' : 'mouseenter', onPointerEnter, {
      capture: true,
      passive: true
    });
    if (enableFocusWithMouse()) {
      _dom.default.addEventListener(document, window.PointerEvent ? 'pointerenter' : 'mouseenter', onPointerEnter, {
        capture: true,
        passive: true
      });
    }
  }
  function sendCommandFromEvent(name, e) {
    _inputmanager.default.trigger(name, {
      sourceElement: e.target,
      originalEvent: e
    });
  }
  window.addEventListener('mouseup', function (e) {
    var button = e.button;

    //console.log('mouseup: button: ' + button);

    switch (button) {
      case 3:
        e.stopPropagation();
        e.preventDefault();
        sendCommandFromEvent('back', e);
        break;
      case 4:
        e.stopPropagation();
        e.preventDefault();
        sendCommandFromEvent('forward', e);
        break;
      default:
        break;
    }
  });
  initMouse();
  mouseManager.requestMouseListening = requestMouseListening;
  mouseManager.releaseMouseListening = releaseMouseListening;
  mouseManager.lastMouseInputTime = function () {
    return lastMouseInputTime;
  };
  mouseManager.isListening = function () {
    return mouseInterval != null;
  };
  mouseManager.init = function () {
    require(['css!mouselistening|modules/input/mouse.css', 'css!tv,mouselistening|modules/input/mouse_tv.css']);
    initMouse();
  };
  _events.default.on(_layoutmanager.default, 'modechange', initMouse);
  var _default = _exports.default = mouseManager;
});
