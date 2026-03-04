define(["exports"], function (_exports) {
  Object.defineProperty(_exports, "__esModule", {
    value: true
  });
  _exports.default = void 0;
  function importFromPath(path) {
    return Emby.importModule(path);
  }
  function importFromPathWithoutExport(path) {
    return Emby.importModule(path);
  }
  function requiresUrlSearchParamsPolyfill() {
    if (typeof URLSearchParams === 'undefined') {
      return true;
    }
    try {
      var plus = '+';

      // test for broken support in iOS 10.3
      // https://github.com/ungap/url-search-params/blob/master/index.js
      // https://github.com/WebReflection/url-search-params#ios-10--other-platforms-bug
      if (new URLSearchParams('q=%2B').get('q') !== plus || new URLSearchParams({
        q: plus
      }).get('q') !== plus || new URLSearchParams([['q', plus]]).get('q') !== plus || new URLSearchParams('q=\n').toString() !== 'q=%0A' || new URLSearchParams({
        q: ' &'
      }).toString() !== 'q=+%26' || new URLSearchParams({
        q: '%zx'
      }).toString() !== 'q=%25zx') {
        return true;
      }
      return false;
    } catch (error) {
      return true;
    }
  }
  function requiresDataTransferPolyfill() {
    if (typeof DataTransfer === 'undefined') {
      return true;
    }
    try {
      new DataTransfer();
      return false;
    } catch (error) {
      return true;
    }
  }
  function loadThirdLevelPolyfills() {
    console.log('loadThirdLevelPolyfills');
    return Promise.all([importFromPath('./modules/browser.js')]).then(function (responses) {
      var browser = responses[0];
      var promises = [];

      // these two have to come last because they depend on others such as Map, Set, WeakMap and MutationObserver
      if (!('customElements' in globalThis)) {
        // tizen 2015 fails with the newer polyfill
        if (globalThis.MutationObserver && globalThis.Reflect) {
          promises.push(require(['modules/polyfills/custom-elements']));
        } else {
          promises.push(require(['modules/polyfills/document-register-element']));
        }
      } else if (!('customElements' in globalThis && !browser.iOS && !browser.safari && customElements.upgrade)) {
        promises.push(importFromPathWithoutExport('./modules/polyfills/custom-elements-builtin.js'));
      }
      return Promise.all(promises);
    });
  }
  function loadSecondLevelPolyfills() {
    var _AbortSignal$prototyp;
    console.log('loadSecondLevelPolyfills');
    var promises = [];
    if (typeof SpeechRecognition === 'undefined') {
      globalThis.SpeechRecognition = globalThis.webkitSpeechRecognition;
    }

    // Note that the "unfetch" minimal fetch polyfill defines fetch() without
    // defining window.Request, and this polyfill need to work on top of unfetch
    // so the below feature detection needs the !globalThis.AbortController part.
    // The Request.prototype check is also needed because Safari versions 11.1.2
    // up to and including 12.1.x has a window.AbortController present but still
    // does NOT correctly implement abortable fetch:
    // https://bugs.webkit.org/show_bug.cgi?id=174980#c2
    var isMissingRequestSignalSupport = typeof globalThis.Request === 'function' && !Object.prototype.hasOwnProperty.call(globalThis.Request.prototype, 'signal');
    if (typeof AbortSignal === 'undefined' || isMissingRequestSignalSupport || !AbortSignal.timeout || !AbortSignal.any || !((_AbortSignal$prototyp = AbortSignal.prototype) != null && _AbortSignal$prototyp.throwIfAborted)) {
      promises.push(importFromPathWithoutExport('./modules/polyfills/abortsignal.js'));
    }
    if (typeof AbortController === 'undefined' || isMissingRequestSignalSupport) {
      promises.push(importFromPathWithoutExport('./modules/polyfills/abortcontroller.js'));
    }
    if (typeof AbortController !== 'undefined' && isMissingRequestSignalSupport) {
      promises.push(importFromPathWithoutExport('./modules/polyfills/abortablefetch.js'));
    }
    if (!Number.isInteger) {
      promises.push(importFromPathWithoutExport('./modules/polyfills/number.js'));
    }
    if (!Math.trunc) {
      promises.push(importFromPathWithoutExport('./modules/polyfills/math.js'));
    }
    if (typeof Intl === 'undefined' || !Intl.NumberFormat) {
      promises.push(importFromPathWithoutExport('./modules/polyfills/numberformat.js'));
    }
    if (typeof Intl === 'undefined' || !Intl.DateTimeFormat) {
      promises.push(importFromPathWithoutExport('./modules/polyfills/datetimeformat.js'));
    }
    if (typeof Intl === 'undefined' || !Intl.RelativeTimeFormat) {
      promises.push(importFromPathWithoutExport('./modules/polyfills/relativetimeformat.js'));
    }
    if (typeof Intl === 'undefined' || !Intl.DurationFormat) {
      promises.push(importFromPathWithoutExport('./modules/polyfills/durationformat.js'));
    }
    if (typeof Intl === 'undefined' || !Intl.DisplayNames) {
      promises.push(importFromPathWithoutExport('./modules/polyfills/displaynames.js'));
    }
    if (typeof Object.assign !== 'function' || typeof Object.create !== 'function' || typeof Object.hasOwn !== 'function') {
      promises.push(importFromPathWithoutExport('./modules/polyfills/object.js'));
    }
    if (typeof Promise.any !== 'function' || typeof Promise.allSettled !== 'function' || typeof Promise.prototype.finally !== 'function') {
      promises.push(importFromPathWithoutExport('./modules/polyfills/promise.js'));
    }
    if (!String.prototype.includes || !String.prototype.startsWith || !String.prototype.endsWith || !String.prototype.replaceAll) {
      promises.push(importFromPathWithoutExport('./modules/polyfills/string.js'));
    }
    if (!Array.prototype.filter || !Array.prototype.includes || !Array.prototype.some || !Array.isArray || !Array.from) {
      promises.push(importFromPathWithoutExport('./modules/polyfills/array.js'));
    }
    if (!Element.prototype.matches || !Element.prototype.closest || !Element.prototype.remove || !Element.prototype.replaceChildren || !Element.prototype.append) {
      promises.push(importFromPathWithoutExport('./modules/polyfills/element.js'));
    }
    if (!HTMLFormElement.prototype.requestSubmit) {
      promises.push(importFromPathWithoutExport('./modules/polyfills/form.js'));
    }
    if (!Function.prototype.bind) {
      promises.push(importFromPathWithoutExport('./modules/polyfills/bind.js'));
    }
    if (typeof Map === 'undefined') {
      promises.push(importFromPathWithoutExport('./modules/polyfills/map.js'));
    }
    if (typeof WeakMap === 'undefined') {
      promises.push(importFromPathWithoutExport('./modules/polyfills/weakmap.js'));
    }
    if (typeof Set === 'undefined' || !Set.prototype.entries) {
      promises.push(importFromPathWithoutExport('./modules/polyfills/set.js'));
    }
    if (typeof crypto === 'undefined' || !crypto.randomUUID) {
      promises.push(importFromPathWithoutExport('./modules/polyfills/crypto.js'));
    }
    if (typeof CSS === 'undefined' || !CSS.supports) {
      promises.push(importFromPathWithoutExport('./modules/polyfills/css.js'));
    }
    return Promise.all(promises);
  }
  function loadFirstLevelPolyfills() {
    var promises = [];
    if (globalThis.Emby.requiresClassesPolyfill) {
      promises.push(importFromPathWithoutExport('./modules/babelhelpers.js'));
    }
    if (typeof ResizeObserver === 'undefined') {
      promises.push(importFromPathWithoutExport('./modules/polyfills/resizeobserver.js'));
    }
    if (typeof IntersectionObserver === 'undefined') {
      promises.push(importFromPathWithoutExport('./modules/polyfills/intersection-observer.js'));
    }

    // technically this should be loaded before the fetch polyfill since fetch.js checks for support for URLSearchParams right at the top
    // but that's only used when assigning a URLSearchParams instance to a request body which we shouldn't use anyway due to inconsistent support for it
    if (requiresUrlSearchParamsPolyfill()) {
      promises.push(importFromPathWithoutExport('./modules/polyfills/urlsearchparams.js'));
    }
    if (requiresDataTransferPolyfill()) {
      promises.push(importFromPathWithoutExport('./modules/polyfills/datatransfer.js'));
    }
    if (typeof fetch === 'undefined') {
      promises.push(importFromPathWithoutExport('./modules/polyfills/fetch.js'));
    }
    if (typeof navigation === 'undefined') {
      promises.push(importFromPathWithoutExport('./modules/polyfills/navigation.js'));
    }
    return Promise.all(promises);
  }
  function load() {
    return loadFirstLevelPolyfills().then(loadSecondLevelPolyfills, loadSecondLevelPolyfills).then(loadThirdLevelPolyfills, loadThirdLevelPolyfills);
  }
  var _default = _exports.default = {
    load: load
  };
});
