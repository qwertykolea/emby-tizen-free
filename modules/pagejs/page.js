define(["exports", "./../dom.js"], function (_exports, _dom) {
  Object.defineProperty(_exports, "__esModule", {
    value: true
  });
  _exports.default = void 0;
  /* jshint module: true */

  /**
   * Base path.
   */

  var base = '';
  var allRoutes = [];

  /**
    * Register `path` with callback `fn()`,
    * or route `path`, or redirection,
    * or `page.start()`.
    *
    *   page(fn);
    *   page('*', fn);
    *   page('/user/:id', load, user);
    *   page('/user/' + user.id, { some: 'thing' });
    *   page('/user/' + user.id);
    *   page('/from', '/to')
    *   page();
    *
    * @param {String|Function} path
    * @param {Function} fn...
    * @api public
    */

  function page(path, routeInfo) {
    // route <path> to <callback ...>
    if (routeInfo) {
      page.callbacks[path.toUpperCase()] = routeInfo;
      allRoutes.push(routeInfo);
    } else {
      page.start(path);
    }
  }
  page.getRoutes = function () {
    return allRoutes;
  };

  /**
   * Callback functions.
   */

  page.callbacks = {};
  function stripBase(path) {
    if (path.indexOf(base) === 0) {
      path = path.substr(base.length);
    }
    return path;
  }

  /**
   * Get or set basepath to `path`.
   *
   * @param {String} path
   * @api public
   */

  page.base = function (path) {
    if (0 === arguments.length) {
      return base;
    }
    base = path;
  };
  var loaded = document.readyState === 'complete';
  function onWindowLoad() {
    setTimeout(function () {
      loaded = true;
    }, 0);
    _dom.default.removeEventListener(window, 'load', onWindowLoad, {
      once: true
    });
  }
  if (!loaded) {
    _dom.default.addEventListener(window, 'load', onWindowLoad, {
      once: true
    });
  }
  function shouldNotIntercept(navigationEvent) {
    return !navigationEvent.canIntercept ||
    // If this is just a hashChange,
    // just let the browser handle scrolling to the content.
    //navigationEvent.hashChange ||
    // If this is a download,
    // let the browser perform the download.
    navigationEvent.downloadRequest ||
    // If this is a form submission,
    // let that go to the server.
    navigationEvent.formData;
  }
  function interceptNoRender() {
    return Promise.resolve();
  }
  function findRouteForPath(path) {
    var callbacks = page.callbacks;
    var qsIndex = path.indexOf('?'),
      routePathName = ~qsIndex ? path.slice(0, qsIndex) : path;
    return callbacks[routePathName.toUpperCase()];
  }
  var previousNavigateState;
  function ignoreNavigate(state) {
    var _previousNavigateStat;
    var ignore = ((_previousNavigateStat = previousNavigateState) == null ? void 0 : _previousNavigateStat.navigate) === false;
    previousNavigateState = state;
    return ignore;
  }
  function normalizeNavEventUrl(navEventUrl) {
    try {
      var _loc$hash;
      var loc = new URL(navEventUrl);
      if ((_loc$hash = loc.hash) != null && _loc$hash.includes('#!')) {
        var url = loc.hash.substr(2);
        var href = loc.href.toString();
        if (href.indexOf('?') >= href.indexOf('#!')) {
          url += loc.search;
        }
        console.log('onNavigate navEventUrl: ' + navEventUrl + ', navigateEvent.destination.url: ' + loc.toString() + ', url:' + url);
        return url;
      } else if (loc.pathname) {
        var _url = loc.pathname + loc.search + loc.hash;
        console.log('onNavigate navEventUrl: ' + navEventUrl + ', navigateEvent.destination.url: ' + loc.toString() + ', url:' + _url);
        return _url;
      }
    } catch (err) {}
    if (navEventUrl.includes('#!')) {
      return navEventUrl.substr(navEventUrl.indexOf('#!') + 2);
    } else {
      return stripBase(navEventUrl);
    }
  }
  function onNavigate(navigateEvent) {
    // Exit early if this navigation shouldn't be intercepted.
    // The properties to look at are discussed later in the article.
    if (shouldNotIntercept(navigateEvent)) {
      return;
    }
    var navEventUrl = navigateEvent.destination.url;
    var url = normalizeNavEventUrl(navEventUrl);
    console.log('onNavigate navEventUrl: ' + navEventUrl + ', url:' + url);
    var info = navigateEvent.info;
    var state = info == null ? void 0 : info.state;
    var ctx = new Context(url, state);
    ctx.navigationType = navigateEvent.navigationType;
    ctx.isBack = ctx.navigationType === 'traverse';
    var route = findRouteForPath(ctx.path);
    if (route) {
      if (ignoreNavigate(state) || (info == null ? void 0 : info.render) === false) {
        navigateEvent.intercept({
          handler: interceptNoRender,
          focusReset: 'manual',
          scroll: 'manual'
        });
        return;
      }
      console.log('navigate handle route: ' + ctx.path);
      navigateEvent.intercept({
        handler: function () {
          var signal = navigateEvent.signal;
          signal.throwIfAborted();
          return page.handleRoute(ctx, route, signal);
        },
        focusReset: 'manual',
        scroll: 'manual'
      });
      return;
    }
  }

  /**
   * Handle "click" events.
   */

  page.start = function () {
    navigation.addEventListener('navigate', onNavigate);
    var url;
    if (~location.hash.indexOf('#!')) {
      url = location.hash.substr(2);
      var href = location.href.toString();
      if (href.indexOf('?') >= href.indexOf('#!')) {
        url += location.search;
      }
    } else {
      url = location.pathname + location.search + location.hash;
    }
    page.replace(url, null, true);
  };

  /**
   * Show `path` with optional `state` object.
   *
   * @param {String} path
   * @param {Object} state
   * @param {Boolean} dispatch
   * @return {Context}
   * @api public
   */

  page.show = function (path, state, dispatch) {
    var url = getNavigateUrl(path);
    return navigation.navigate(url, {
      state: state,
      info: {
        render: dispatch !== false,
        state: state
      }
    }).finished;
  };
  page.restorePreviousState = function () {};
  page.back = function () {
    // Keep it simple and mimic browser function
    return navigation.back();
  };
  page.forward = function () {
    // Keep it simple and mimic browser function
    return navigation.forward();
  };
  page.canGoBack = function () {
    return navigation.canGoBack;
  };
  function getNavigateUrl(path) {
    var ctx = new Context(path);
    return ctx.path !== '/' ? '#!' + ctx.path : ctx.canonicalPath;
  }

  /**
   * Replace `path` with optional `state` object.
   *
   * @param {String} path
   * @param {Object} state
   * @return {Context}
   * @api public
   */

  page.replace = function (path, state, dispatch) {
    var url = getNavigateUrl(path);
    return navigation.navigate(url, {
      history: 'replace',
      state: state,
      info: {
        render: dispatch !== false,
        state: state
      }
    }).finished;
  };
  page.getRoute = function (path) {
    var callbacks = page.callbacks;
    var qsIndex = path.indexOf('?');
    var pathname = ~qsIndex ? path.slice(0, qsIndex) : path;
    return callbacks[pathname.toUpperCase()];
  };
  page.createContext = function (path) {
    return new Context(path);
  };

  /**
   * Dispatch the given `ctx`.
   *
   * @param {Object} ctx
   * @api private
   */

  page.dispatch = function (ctx) {
    var callbacks = page.callbacks;
    var path = ctx.path;
    var qsIndex = path.indexOf('?'),
      pathname = ~qsIndex ? path.slice(0, qsIndex) : path;
    var route = callbacks[pathname.toUpperCase()];
    if (route) {
      return page.handleRoute(ctx, route);
    }
  };

  /**
   * Remove URL encoding from the given `str`.
   * Accommodates whitespace in both x-www-form-urlencoded
   * and regular percent-encoded form.
   *
   * @param {str} URL component to decode
   */
  function decodeURLEncodedURIComponent(val) {
    if (typeof val !== 'string') {
      return val;
    }
    return decodeURIComponent(val.replace(/\+/g, ' '));
  }
  function parseQueryStringToObject(str) {
    var params = {};
    if (typeof str !== 'string') {
      return {};
    }
    var urlSearchParams = new URLSearchParams(str);
    var entries = urlSearchParams.entries();
    var result = entries.next();
    while (!result.done) {
      var pair = result.value;
      params[pair[0]] = pair[1];
      result = entries.next();
    }
    return params;
  }

  /**
   * Initialize a new "request" `Context`
   * with the given `path` and optional initial `state`.
   *
   * @param {String} path
   * @param {Object} state
   * @api public
   */

  function Context(path, state) {
    if ('/' === path[0] && 0 !== path.indexOf(base)) {
      path = base + '#!' + path;
    }
    var i = path.indexOf('?');
    this.canonicalPath = path;
    this.path = stripBase(path) || '/';
    this.path = this.path.replace('#!', '') || '/';
    this.state = state || {};
    this.rawQueryString = ~i ? path.slice(i + 1) : '';
    this.params = this.rawQueryString ? parseQueryStringToObject(this.rawQueryString) : {};
    this.pathname = decodeURLEncodedURIComponent(~i ? path.slice(0, i) : path);

    // fragment
    this.hash = '';
  }

  /**
   * Save the context state.
   *
   * @api public
   */

  page.pushState = function (state, title, url) {
    url = '#!' + url;
    navigation.navigate(url, {
      state: state,
      info: {
        state: state
      }
    });
    previousNavigateState = state;
  };
  function onclick(e) {
    if (1 !== getButtonFromEvent(e)) {
      return;
    }
    if (e.metaKey || e.ctrlKey || e.shiftKey) {
      return;
    }
    if (e.defaultPrevented) {
      return;
    }

    // ensure link
    var el = e.target;
    el = el ? el.closest('A') : el;
    if (!el || 'A' !== el.nodeName) {
      return;
    }

    // Ignore if tag has
    // 1. "download" attribute
    // 2. rel="external" attribute
    if (el.hasAttribute('download') || el.getAttribute('rel') === 'external') {
      return;
    }

    // ensure non-hash for the same path
    var link = el.getAttribute('href');
    if (link === '#') {
      e.preventDefault();
      return;
    }

    // check target
    if (el.target) {
      return;
    }

    // x-origin
    if (!sameOrigin(el.href)) {
      return;
    }

    // rebuild path
    var path = el.pathname + el.search + (el.hash || '');
    if (el.protocol === 'file:' && path.length > 3 && path[2] === ':' && link.startsWith('/')) {
      // strip drive letter from file URL path
      path = path.substr(3);
    }

    // same page
    var orig = path;
    path = stripBase(path);
    path = path.replace('#!', '');
    e.preventDefault();
    page.show(orig);
  }
  page.handleAnchorClick = onclick;

  /**
   * Event button.
   */

  function getButtonFromEvent(e) {
    if (!e) {
      e = window.event;
    }
    var which = e.which;
    if (which == null) {
      which = e.button;
    }
    return which;
  }

  /**
   * Check if `href` is the same origin.
   */

  function sameOrigin(href) {
    var origin = location.protocol + '//' + location.hostname;
    if (location.port) {
      origin += ':' + location.port;
    }
    return href && 0 === href.indexOf(origin);
  }
  var _default = _exports.default = page;
});
