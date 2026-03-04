define(["exports"], function (_exports) {
  Object.defineProperty(_exports, "__esModule", {
    value: true
  });
  _exports.default = void 0;
  var fetch = globalThis.fetch,
    _globalThis$Request = globalThis.Request,
    NativeRequest = _globalThis$Request === void 0 ? fetch.Request : _globalThis$Request;

  // Note that the "unfetch" minimal fetch polyfill defines fetch() without
  // defining window.Request, and this polyfill need to work on top of unfetch
  // hence we only patch it if it's available. Also we don't patch it if signal
  // is already available on the Request prototype because in this case support
  // is present and the patching below can cause a crash since it assigns to
  // request.signal which is technically a read-only property. This latter error
  // happens when you run the main5.js node-fetch example in the repo
  // "abortcontroller-polyfill-examples". The exact error is:
  //   request.signal = init.signal;
  //   ^
  // TypeError: Cannot set property signal of #<Request> which has only a getter
  Request = function Request(input, init) {
    var signal;
    if (init && init.signal) {
      signal = init.signal;
      // Never pass init.signal to the native Request implementation when the polyfill has
      // been installed because if we're running on top of a browser with a
      // working native AbortController (i.e. the polyfill was installed due to
      // __FORCE_INSTALL_ABORTCONTROLLER_POLYFILL being set), then passing our
      // fake AbortSignal to the native fetch will trigger:
      // TypeError: Failed to construct 'Request': member signal is not of type AbortSignal.
      delete init.signal;
    }
    var request = new NativeRequest(input, init);
    if (signal) {
      Object.defineProperty(request, 'signal', {
        writable: false,
        enumerable: false,
        configurable: true,
        value: signal
      });
    }
    return request;
  };
  Request.prototype = NativeRequest.prototype;
  var realFetch = fetch;
  var abortableFetch = function (input, init) {
    // eslint-disable-next-line
    var signal = Request && Request.prototype.isPrototypeOf(input) ? input.signal : init ? init.signal : undefined;
    if (signal) {
      var abortError;
      try {
        abortError = new DOMException('Aborted', 'AbortError');
      } catch (err) {
        // IE 11 does not support calling the DOMException constructor, use a
        // regular error object on it instead.
        abortError = new Error('Aborted');
        abortError.name = 'AbortError';
      }

      // Return early if already aborted, thus avoiding making an HTTP request
      if (signal.aborted) {
        return Promise.reject(abortError);
      }

      // Turn an event into a promise, reject it once `abort` is dispatched
      var cancellation = new Promise(function (_, reject) {
        signal.addEventListener('abort', function () {
          return reject(abortError);
        }, {
          once: true
        });
      });
      if (init && init.signal) {
        // Never pass .signal to the native implementation when the polyfill has
        // been installed because if we're running on top of a browser with a
        // working native AbortController (i.e. the polyfill was installed due to
        // __FORCE_INSTALL_ABORTCONTROLLER_POLYFILL being set), then passing our
        // fake AbortSignal to the native fetch will trigger:
        // TypeError: Failed to execute 'fetch' on 'Window': member signal is not of type AbortSignal.
        delete init.signal;
      }
      // Return the fastest promise (don't need to wait for request to finish)
      return Promise.race([cancellation, realFetch(input, init)]);
    }
    return realFetch(input, init);
  };
  globalThis.fetch = abortableFetch;
  globalThis.Request = Request;

  // this will ensure the babel output is wrapped in a closure
  var _default = _exports.default = abortableFetch;
});
