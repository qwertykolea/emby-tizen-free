define(["exports"], function (_exports) {
  Object.defineProperty(_exports, "__esModule", {
    value: true
  });
  _exports.default = void 0;
  // https://github.com/mo/abortcontroller-polyfill

  function AbortSignalPolyfill() {
    Object.defineProperty(this, 'listeners', {
      value: {},
      writable: true,
      configurable: true
    });

    // Compared to assignment, Object.defineProperty makes properties non-enumerable by default and
    // we want Object.keys(new AbortController().signal) to be [] for compat with the native impl
    Object.defineProperty(this, 'aborted', {
      value: false,
      writable: true,
      configurable: true
    });
    Object.defineProperty(this, 'onabort', {
      value: null,
      writable: true,
      configurable: true
    });
    Object.defineProperty(this, 'reason', {
      value: undefined,
      writable: true,
      configurable: true
    });
  }
  AbortSignalPolyfill.prototype.addEventListener = function (type, callback, options) {
    if (!(type in this.listeners)) {
      this.listeners[type] = [];
    }
    this.listeners[type].push({
      callback: callback,
      options: options
    });
  };
  AbortSignalPolyfill.prototype.removeEventListener = function (type, callback) {
    if (!(type in this.listeners)) {
      return;
    }
    var stack = this.listeners[type];
    for (var i = 0, l = stack.length; i < l; i++) {
      if (stack[i].callback === callback) {
        stack.splice(i, 1);
        return;
      }
    }
  };
  AbortSignalPolyfill.prototype.toString = function () {
    return '[object AbortSignal]';
  };
  AbortSignalPolyfill.prototype.dispatchEvent = function (event) {
    var _this = this;
    if (event.type === 'abort') {
      this.aborted = true;
      if (typeof this.onabort === 'function') {
        this.onabort.call(this, event);
      }
    }
    if (!(event.type in this.listeners)) {
      return;
    }
    var stack = this.listeners[event.type];
    var stackToCall = stack.slice();
    var _loop = function () {
      var listener = stackToCall[i];
      try {
        listener.callback.call(_this, event);
      } catch (e) {
        Promise.resolve().then(function () {
          throw e;
        });
      }
      if (listener.options && listener.options.once) {
        _this.removeEventListener(event.type, listener.callback);
      }
    };
    for (var i = 0, l = stackToCall.length; i < l; i++) {
      _loop();
    }
    return !event.defaultPrevented;
  };
  var isMissingRequestSignalSupport = typeof globalThis.Request === 'function' && !Object.prototype.hasOwnProperty.call(globalThis.Request.prototype, 'signal');
  if (typeof AbortSignal === 'undefined' || isMissingRequestSignalSupport) {
    console.log('assigning AbortSignal to globalThis');
    Object.defineProperty(globalThis, 'AbortSignal', {
      writable: true,
      enumerable: false,
      configurable: true,
      value: AbortSignalPolyfill
    });
  }
  if (!AbortSignal.timeout) {
    AbortSignal.timeout = function (duration) {
      var controller = new AbortController();
      setTimeout(function () {
        controller.abort();
      }, duration);
      return controller.signal;
    };
  }
  if (!AbortSignal.any) {
    AbortSignal.any = function (signals) {
      var controller = new AbortController();
      for (var i = 0, length = signals.length; i < length; i++) {
        var signal = signals[i];
        if (signal.aborted) {
          controller.abort(signal.reason);
          return controller.signal;
        }
      }
      function abort() {
        controller.abort(this.reason);
      }
      for (var _i = 0, _length = signals.length; _i < _length; _i++) {
        var _signal = signals[_i];
        _signal.addEventListener("abort", abort);
      }
      return controller.signal;
    };
  }
  if (!AbortSignal.prototype.throwIfAborted) {
    AbortSignal.prototype.throwIfAborted = function () {
      if (this.aborted) {
        var reason = this.reason;
        if (!reason) {
          reason = new Error('Aborted');
          reason.name = 'AbortError';
        }
        throw reason;
      }
    };
  }
  console.log('done loading AbortSignalPolyfill');

  // this will ensure the babel output is wrapped in a closure
  var _default = _exports.default = AbortSignalPolyfill;
});
