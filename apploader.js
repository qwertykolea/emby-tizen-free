/* jshint module: true */

// eslint-disable-next-line
if (typeof globalThis === 'undefined') {
  /* jshint ignore:start */
  // eslint-disable-next-line
  var globalThis = self;
  /* jshint ignore:end */
}

(function () {"use strict";
globalThis.Emby = {};

// there's a hole here in that this detects support for modules but not dynamic import of modules
// the main gaps currently affected by that are iOS 10 and Firefox 60-66
var supportsModules = 'noModule' in document.createElement('script');
var usesModules = false;
var usesMultiVersionJs = false;
var scriptsUsingClasses = false;
var usesClasses;
if (usesMultiVersionJs) {
  if (supportsModules) {
    usesClasses = true;
  } else {
    usesClasses = false;
  }
} else {
  usesClasses = scriptsUsingClasses;
}
globalThis.Emby.requiresClassesPolyfill = !usesClasses;
globalThis.Emby.jsExtension = usesMultiVersionJs && !supportsModules ? '.legacyemby.js' : '.js';
function loadScript(src) {
  return new Promise(function (resolve, reject) {
    var doc = document;
    var script = doc.createElement('script');
    if (globalThis.urlCacheParam) {
      src += '?' + globalThis.urlCacheParam;
    }

    // this caused an error on some tizen models
    if (usesModules && supportsModules) {
      script.type = 'module';
    }
    script.onload = resolve;
    script.onerror = reject;
    script.src = src;
    doc.head.appendChild(script);
  });
}
function loadPromise(onDone) {
  // Need to load the polyfill anyway on web0s 1&2
  if (globalThis.Promise && globalThis.Promise.all) {
    onDone();
    return;
  }
  var doc = document;
  var script = doc.createElement('script');
  var src = './modules/polyfills/native-promise-only' + globalThis.Emby.jsExtension;
  if (globalThis.urlCacheParam) {
    src += '?' + globalThis.urlCacheParam;
  }
  script.onload = onDone;
  script.src = src;
  doc.head.appendChild(script);
}
function catchAndResolve(err) {
  console.error('error registering service worker: ', err);
  return Promise.resolve();
}
function registerServiceWorker() {
  switch (globalThis.location.protocol) {
    case 'file:':
      return Promise.resolve();
    default:
      break;
  }
  switch (globalThis.appMode) {
    case 'ios':
    case 'android':
    case 'tizen':
    case 'webos':
    case 'chromecast':
    case 'embyclient':
      return Promise.resolve();
    default:
      break;
  }
  if (typeof caches === 'undefined' || !navigator.serviceWorker) {
    return Promise.resolve();
  }
  return caches.open('embyappinfo').then(function (cache) {
    return cache.put('appversion', new Response(globalThis.dashboardVersion || '')).then(function () {
      try {
        var serviceWorkerOptions = {};
        if (usesModules && supportsModules) {
          serviceWorkerOptions.type = 'module';
        }
        return navigator.serviceWorker.register('serviceworker.js', serviceWorkerOptions).then(function () {
          return navigator.serviceWorker.ready.then(function () {
            if (globalThis.appMode === 'standalone') {
              globalThis.urlCacheParam = null;
            }
            Emby.serviceWorkerEnabled = true;
          });
        }, catchAndResolve).then(function (reg) {
          if (reg && reg.sync) {
            // https://github.com/WICG/BackgroundSync/blob/master/explainer.md
            return reg.sync.register('emby-sync');
          }
          return Promise.resolve();
        });
      } catch (err) {
        console.error('Error registering serviceWorker: ', err);
      }
    }, catchAndResolve);
  }, catchAndResolve);
}
function loadRequire() {
  return loadScript('./modules/alameda/alameda' + globalThis.Emby.jsExtension);
}
function loadApp() {
  var config = {
    urlArgs: globalThis.urlCacheParam,
    renameJsExtension: globalThis.Emby.jsExtension === '.js' ? null : globalThis.Emby.jsExtension
  };
  if (globalThis.appMode !== 'android') {
    var baseRoute = globalThis.location.href.split('?')[0].replace('/index.html', '');
    // support hashbang
    baseRoute = baseRoute.split('#')[0];
    if (baseRoute.lastIndexOf('/') === baseRoute.length - 1) {
      baseRoute = baseRoute.substring(0, baseRoute.length - 1);
    }
    console.log('Setting require baseUrl to ' + baseRoute);
    config.baseUrl = baseRoute;
  }
  require.config(config);
  return loadScript('./app' + globalThis.Emby.jsExtension);
}
function onPromiseLoaded() {
  registerServiceWorker().then(loadRequire, loadRequire).then(loadApp, loadApp);
}
function init() {
  var doc = document;
  var docElem = doc.documentElement;
  var appMode = docElem.getAttribute('data-appmode');
  if (appMode) {
    globalThis.appMode = appMode;
  }
  var appVersion = docElem.getAttribute('data-appversion');
  if (appVersion) {
    globalThis.dashboardVersion = appVersion;
  }
  if (appVersion) {
    globalThis.urlCacheParam = 'v=' + appVersion;
  } else if (!appMode) {
    globalThis.urlCacheParam = 'v=' + Date.now();
  }
  loadPromise(onPromiseLoaded);
}
init();
})();
