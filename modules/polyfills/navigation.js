/* jshint module: true */

if (typeof navigation === 'undefined') {
  var NavigateEvent = function () {};
  var onPopState = function (e) {
    var newUrl = window.location.href;
    console.log('navigation polyfill: popstate: ' + newUrl);
    var navOptions = e.state;
    var listeners = NavListeners.slice(0);
    var ev = new NavigateEvent();
    ev.canIntercept = true;
    ev.info = navOptions == null ? void 0 : navOptions.info;
    ev.destination = {
      url: newUrl
    };
    ev.navigationType = navigationType;
    ev.abortController = new AbortController();
    ev.signal = ev.abortController.signal;
    for (var i = 0, length = listeners.length; i < length; i++) {
      var listener = listeners[i];
      listener.call(navigation, ev);
    }
    navigationType = 'traverse';
  };
  var getNavResult = function () {
    return {
      committed: Promise.resolve(),
      finished: Promise.resolve()
    };
  };
  NavigateEvent.prototype.intercept = function (obj) {
    if (obj) {
      if (obj.precommitHandler) {
        obj.precommitHandler();
      }
      if (obj.handler) {
        obj.handler();
      }
    }
  };
  var navigationType;
  var NavListeners = [];
  window.addEventListener('popstate', onPopState, false);
  globalThis.navigation = {
    back: function () {
      navigationType = 'traverse';
      history.back();
      return getNavResult();
    },
    forward: function () {
      navigationType = 'traverse';
      history.forward();
      return getNavResult();
    },
    get canGoBack() {
      return history.length > 1;
    },
    addEventListener: function (eventName, fn) {
      NavListeners.push(fn);
    },
    removeEventListener: function (eventName, fn) {
      var index = NavListeners.indexOf(fn);
      if (index > -1) {
        NavListeners.splice(index, 1);
      }
    },
    navigate: function (url, options) {
      var state = options;
      if ((options == null ? void 0 : options.history) === 'replace') {
        console.log('navigation polyfill: replaceState: ' + url);
        navigationType = 'replace';
        history.replaceState(state, "", url);
      } else {
        console.log('navigation polyfill: pushState: ' + url);
        navigationType = 'push';
        history.pushState(state, "", url);
      }
      onPopState.call(window, {
        state: state
      });
      return getNavResult();
    }
  };
}
