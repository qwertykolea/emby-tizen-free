define(["exports"], function (_exports) {
  Object.defineProperty(_exports, "__esModule", {
    value: true
  });
  _exports.default = void 0;
  // https://github.com/mo/abortcontroller-polyfill

  function AbortControllerPolyFill() {
    Object.defineProperty(this, 'signal', {
      value: new AbortSignal(),
      writable: true,
      configurable: true
    });
  }
  AbortControllerPolyFill.prototype.abort = function (reason) {
    var event;
    try {
      event = new Event('abort');
    } catch (e) {
      if (typeof document !== 'undefined') {
        if (!document.createEvent) {
          // For Internet Explorer 8:
          event = document.createEventObject();
          event.type = 'abort';
        } else {
          // For Internet Explorer 11:
          event = document.createEvent('Event');
          event.initEvent('abort', false, false);
        }
      } else {
        // Fallback where document isn't available:
        event = {
          type: 'abort',
          bubbles: false,
          cancelable: false
        };
      }
    }
    var signalReason = reason;
    if (signalReason === undefined) {
      if (typeof document === 'undefined') {
        signalReason = new Error('This operation was aborted');
        signalReason.name = 'AbortError';
      } else {
        try {
          signalReason = new DOMException('signal is aborted without reason');
        } catch (err) {
          // IE 11 does not support calling the DOMException constructor, use a
          // regular error object on it instead.
          signalReason = new Error('This operation was aborted');
          signalReason.name = 'AbortError';
        }
      }
    }
    this.signal.reason = signalReason;
    this.signal.dispatchEvent(event);
  };
  AbortControllerPolyFill.prototype.toString = function () {
    return '[object AbortController]';
  };

  // Note that the "unfetch" minimal fetch polyfill defines fetch() without
  // defining window.Request, and this polyfill need to work on top of unfetch
  // so the below feature detection needs the !globalThis.AbortController part.
  // The Request.prototype check is also needed because Safari versions 11.1.2
  // up to and including 12.1.x has a window.AbortController present but still
  // does NOT correctly implement abortable fetch:
  // https://bugs.webkit.org/show_bug.cgi?id=174980#c2
  var isMissingRequestSignalSupport = typeof globalThis.Request === 'function' && !Object.prototype.hasOwnProperty.call(globalThis.Request.prototype, 'signal');
  if (typeof AbortController === 'undefined' || isMissingRequestSignalSupport) {
    console.log('assigning AbortController to globalThis');
    Object.defineProperty(globalThis, 'AbortController', {
      writable: true,
      enumerable: false,
      configurable: true,
      value: AbortControllerPolyFill
    });
  }
  console.log('done loading AbortControllerPolyFill');

  // this will ensure the babel output is wrapped in a closure
  var _default = _exports.default = AbortControllerPolyFill;
});
