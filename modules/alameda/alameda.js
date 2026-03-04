/* jshint module: true */

/**
 * @license alameda 1.4.0 Copyright jQuery Foundation and other contributors.
 * Released under MIT license, https://github.com/requirejs/alameda/blob/master/LICENSE
 */

var undef;
var queue = [];
var urlRegExp = /^\/|\:|\?|\.js$/;

/**
 * Trims the . and .. from an array of path segments.
 * It will keep a leading path segment if a .. will become
 * the first path segment, to help with module name lookups,
 * which act like paths, but can be remapped. But the end result,
 * all paths that use this function should look normalized.
 * NOTE: this method MODIFIES the input array.
 * @param {Array} ary the array of path segments.
 */
function trimDots(ary) {
  var i, part;
  var length = ary.length;
  for (i = 0; i < length; i++) {
    part = ary[i];
    if (part === '.') {
      ary.splice(i, 1);
      i -= 1;
    } else if (part === '..') {
      // If at the start, or previous value is still ..,
      // keep them so that when converted to a path it may
      // still work when converted to a path, even though
      // as an ID it is less than ideal. In larger point
      // releases, may be better to just kick out an error.
      if (i === 0 || i === 1 && ary[2] === '..' || ary[i - 1] === '..') {
        continue;
      } else if (i > 0) {
        ary.splice(i - 1, 2);
        i -= 2;
      }
    }
  }
}
function reject(d, err) {
  d.rejected = true;
  d.reject(err);
}

// Turns a plugin!resource to [plugin, resource]
// with the plugin being undefined if the name
// did not have a plugin prefix.
function splitPrefix(name) {
  var prefix;
  var index = name ? name.indexOf('!') : -1;
  if (index > -1) {
    prefix = name.substring(0, index);
    name = name.substring(index + 1, name.length);
  }
  return [prefix, name];
}
function makeErrback(d, name) {
  return function (err) {
    if (!d.rejected) {
      reject(d, err);
    }
  };
}
var defined = Object.create(null);
var waiting = Object.create(null);
var config = {
  // Defaults. Do not set a default for map
  // config to speed up normalize(), which
  // will run faster if there is no default.
  baseUrl: './'
};
var mapCache = Object.create(null);
var deferreds = Object.create(null);
var calledDefine = Object.create(null);
var calledPlugin = Object.create(null);
var urlFetched = Object.create(null);
function addUrlArgs(url) {
  var args = config.urlArgs;
  if (!args) {
    return url;
  }
  return url + (url.indexOf('?') === -1 ? '?' : '&') + args;
}
function getXmlHttpRequestPromise(url) {
  return new Promise(function (resolve, reject) {
    var xhr = new XMLHttpRequest();
    xhr.open('GET', url, true);
    xhr.onload = function (e) {
      resolve(this.response);
    };
    xhr.onerror = reject;
    xhr.send();
  });
}
var CSSLoader;
var plugins = {
  css: {
    load: function (url) {
      if (config.noRequireCss) {
        return Promise.resolve();
      }
      if (!url.endsWith('.css')) {
        console.log('require CSS url not ending with .css: ' + url);
        url += '.css';
      }
      var urlParts = url.split('|');
      var optionsFromUrl = urlParts.length === 2 ? urlParts[0] : null;
      url = urlParts[urlParts.length - 1];
      optionsFromUrl = optionsFromUrl ? optionsFromUrl.split(',') : [];
      var cssLoadOptions = {};
      for (var i = 0, length = optionsFromUrl.length; i < length; i++) {
        var option = optionsFromUrl[i];
        var value = true;
        if (option.startsWith('!')) {
          option = option.substring(1);
          value = false;
        }
        cssLoadOptions[option] = value;
      }
      return new CSSLoader(url, cssLoadOptions).enableIfNeeded();
    }
  },
  text: {
    load: function (url) {
      if (!url.includes('://')) {
        url = config.baseUrl + url;
      }
      url = addUrlArgs(url);
      console.log('loading text: ' + url);
      return getXmlHttpRequestPromise(url);
    }
  }
};

/**
 * Given a relative module name, like ./something, normalize it to
 * a real name that can be mapped to a path.
 * @param {String} name the relative name
 * @param {String} baseName a real name that the name arg is relative
 * to.
 * @returns {String} normalized name
 */
function normalize(name, baseName) {
  //Adjust any relative paths.
  if (name) {
    name = name.split('/');

    // Starts with a '.' so need the baseName
    if (name[0].charAt(0) === '.') {
      var baseParts = baseName == null ? void 0 : baseName.split('/');
      var normalizedBaseParts = baseParts;
      if (baseParts) {
        //Convert baseName to array, and lop off the last part,
        //so that . matches that 'directory' and not name of the baseName's
        //module. For instance, baseName of 'one/two/three', maps to
        //'one/two/three.js', but we want the directory, 'one/two' for
        //this normalization.
        normalizedBaseParts = baseParts.slice(0, baseParts.length - 1);
        name = normalizedBaseParts.concat(name);
      }
    }
    trimDots(name);
    name = name.join('/');
  }
  return name;
}
function takeQueue(anonId) {
  var i, id, args;
  for (i = 0; i < queue.length; i += 1) {
    // Peek to see if anon
    if (typeof queue[i][0] !== 'string') {
      if (anonId) {
        queue[i].unshift(anonId);
        anonId = undef;
      } else {
        // Not our anon module, stop.
        break;
      }
    }
    args = queue.shift();
    id = args[0];
    i -= 1;
    if (!(id in defined) && !(id in waiting)) {
      if (id in deferreds) {
        main.apply(undef, args);
      } else {
        waiting[id] = args;
      }
    }
  }

  // if get to the end and still have anonId, then could be
  // a shimmed dependency.
  if (anonId) {
    main(anonId, []);
  }
}
function defaultCallback() {
  // In case used later as a promise then value, return the
  // arguments as an array.
  return Array.prototype.slice.call(arguments, 0);
}
function nameToUrl(moduleName) {
  var url = moduleName;

  // If a colon is in the URL, it indicates a protocol is used and it is
  // just an URL to a file, or if it starts with a slash, contains a query
  // arg (i.e. ?) or ends with .js, then assume the user meant to use an
  // url and not a module id. The slash is important for protocol-less
  // URLs as well as full paths.
  if (!urlRegExp.test(moduleName)) {
    url += '.js';
    url = (url.charAt(0) === '/' || url.match(/^[\w\+\.\-]+:/) ? '' : config.baseUrl) + url;
  }
  if (config.renameJsExtension) {
    url = url.replace('.js', config.renameJsExtension);
  }
  return addUrlArgs(url);
}
function makeRequire(relName) {
  return function (deps, callback) {
    // Support require(['a'])
    callback = callback || defaultCallback;

    // Grab any modules that were defined after a require call.
    takeQueue();
    return main(undef, deps || [], callback, relName);
  };
}
function resolve(name, d, value) {
  if (name) {
    defined[name] = value;
  }
  d.resolve(value);
}
function defineModule(d) {
  var ret;
  var name = d.map.id;
  try {
    ret = d.factory.apply(defined[name], d.values);
  } catch (err) {
    return reject(d, err);
  }
  if (name) {
    // Favor return value over exports. If node/cjs in play,
    // then will not have a return value anyway. Favor
    // module.exports assignment over exports object.
    if (ret === undef) {
      if (d.usingExports) {
        ret = defined[name];
      }
    }
  }
  resolve(name, d, ret);
}
function Defer(name) {
  var d = this;
  d.promise = new Promise(function (resolve, reject) {
    d.resolve = resolve;
    d.reject = reject;
  });
  d.map = name ? makeMap(name) : {};
  d.depCount = 0;
  d.depMax = 0;
  d.values = [];
  d.depDefined = [];
}
function getDefer(name) {
  var d;
  if (name) {
    d = deferreds[name];
    if (!d) {
      d = deferreds[name] = new Defer(name);
    }
  } else {
    d = new Defer();
  }
  return d;
}
function waitForDep(depMap, relName, d, i) {
  d.depMax += 1;

  // Do the fail at the end to catch errors
  // in the then callback execution.

  callDep(depMap, relName).then(function (val) {
    if (!d.rejected && !d.depDefined[i]) {
      d.depDefined[i] = true;
      d.depCount += 1;
      d.values[i] = val;
      if (!d.depending && d.depCount === d.depMax) {
        defineModule(d);
      }
    }
  }, makeErrback(d, depMap.id)).catch(makeErrback(d, d.map.id));
}
function importScriptsHack(url) {
  var urls = [];

  // emby - hack alert for uwp appworker
  if (url.indexOf('://') === -1) {
    urls.push(config.baseUrl + url);
    urls.push(config.baseUrl + 'modules/emby-apiclient/' + url);
    urls.push(config.baseUrl + 'modules/sync/' + url);
    urls.push(config.baseUrl + 'modules/localdatabase/' + url);
    urls.push(config.baseUrl + 'modules/common/' + url);
    urls.push(config.baseUrl + 'modules/' + url);
  } else {
    urls.push(url);
  }
  for (var i = 0, length = urls.length; i < length; i++) {
    console.log('importScripts: ' + urls[i]);
    try {
      importScripts(urls[i]);
      return;
    } catch (err) {
      console.log('importScripts error: ' + urls[i] + ', err: ' + err.toString());
    }
  }
  throw new Error('importScripts failed for: ' + url);
}
function loadUsingImportScripts(url, id) {
  // Ask for the deferred so loading is triggered.
  // Do this before loading, since loading is sync.
  getDefer(id);
  importScriptsHack(url);
  takeQueue(id);
}
function loadUsingScriptElement(url, id) {
  var script = document.createElement('script');
  script.type = 'text/javascript';
  script.charset = 'utf-8';
  script.async = true;
  script.addEventListener('load', function () {
    takeQueue(id);
  }, false);
  script.addEventListener('error', function () {
    var err = new Error('Load failed: ' + id + ': ' + script.src);
    reject(getDefer(id), err);
  }, false);
  script.src = url;
  document.head.appendChild(script);
}
var load = typeof importScripts === 'function' ? loadUsingImportScripts : loadUsingScriptElement;
function callDep(map, relName) {
  var args;
  var name = map.id;
  if (name in waiting) {
    args = waiting[name];
    delete waiting[name];
    main.apply(undef, args);
  } else if (!(name in deferreds)) {
    var newId = map.id;
    var pr = map.pr;
    if (pr) {
      //console.log('loading with plugin: ' + pr);
      var plugin = plugins[pr];

      // Make sure to only call load once per resource. Many
      // calls could have been queued waiting for plugin to load.

      if (!(newId in calledPlugin)) {
        calledPlugin[newId] = true;
        plugin.load(map.n).then(function (response) {
          resolve(newId, getDefer(newId), response);
        });
      }
      return getDefer(newId).promise;
    } else {
      var url = map.url;
      if (!urlFetched[url]) {
        urlFetched[url] = true;
        load(url, newId);
      }
    }
  }
  return getDefer(name).promise;
}

/**
 * Makes a name map, normalizing the name, and using a plugin
 * for normalization if necessary. Grabs a ref to plugin
 * too, as an optimization.
 */
function makeMap(name, relName) {
  if (typeof name !== 'string') {
    return name;
  }
  var plugin, url, parts, prefix;
  var cacheKey = name + ' & ' + (relName || '');
  parts = splitPrefix(name);
  prefix = parts[0];
  name = parts[1];
  if (prefix) {
    plugin = plugins[prefix];
    if (plugin) {
      name = normalize(name, relName);
    }
  } else {
    var cachedMap = mapCache[cacheKey];
    if (cachedMap) {
      return cachedMap;
    }
    name = normalize(name, relName);
    parts = splitPrefix(name);
    prefix = parts[0];
    name = parts[1];
    url = nameToUrl(name);
  }

  // Using ridiculous property names for space reasons
  var result = {
    id: prefix ? prefix + '!' + name : name,
    // fullName
    n: name,
    pr: prefix,
    url: url
  };
  if (!prefix) {
    mapCache[cacheKey] = result;
  }
  return result;
}
var handlers = {
  require: makeRequire,
  exports: function (name) {
    var e = defined[name];
    if (typeof e !== 'undefined') {
      return e;
    } else {
      return defined[name] = {};
    }
  }
};
function main(name, deps, factory, relName) {
  if (name) {
    // Only allow main calling once per module.
    if (name in calledDefine) {
      return;
    }
    calledDefine[name] = true;
  }
  var d = getDefer(name);

  // This module may not have dependencies
  if (deps && !Array.isArray(deps)) {
    // deps is not an array, so probably means
    // an object literal or factory function for
    // the value. Adjust args.
    factory = deps;
    deps = [];
  }

  // Create fresh array instead of modifying passed in value.
  deps = deps ? Array.prototype.slice.call(deps, 0) : null;

  // Use name if no relName
  if (!relName) {
    relName = name;
  }

  // Call the factory to define the module, if necessary.
  if (typeof factory === 'function') {
    if (!deps.length && factory.length) {
      // May be a CommonJS thing even without require calls, but still
      // could use exports, and module. Avoid doing exports and module
      // work though if it just needs require.
      // REQUIRES the function to expect the CommonJS variables in the
      // order listed below.
      deps = (factory.length === 1 ? ['require'] : ['require', 'exports', 'module']).concat(deps);
    }

    // Save info for use later.
    d.factory = factory;
    d.deps = deps;
    d.depending = true;
    for (var i = 0, length = deps.length; i < length; i++) {
      var depName = deps[i];
      var depMap = void 0;
      deps[i] = depMap = makeMap(depName, relName);
      depName = depMap.id;

      // Fast path CommonJS standard dependencies.
      if (depName === "require") {
        d.values[i] = handlers.require(name);
      } else if (depName === "exports") {
        // CommonJS module spec 1.1
        d.values[i] = handlers.exports(name);
        d.usingExports = true;
      } else if (depName === undefined) {
        d.values[i] = undefined;
      } else {
        waitForDep(depMap, relName, d, i);
      }
    }
    d.depending = false;

    // Some modules just depend on the require, exports, modules, so
    // trigger their definition here if so.
    if (d.depCount === d.depMax) {
      defineModule(d);
    }
  } else if (name) {
    // May just be an object definition for the module. Only
    // worry about defining if have a module name.
    resolve(name, d, factory);
  }
  return d.promise;
}
var req = makeRequire();

/*
 * Just drops the config on the floor, but returns req in case
 * the config return value is used.
 */
req.config = function (cfg) {
  // Make sure the baseUrl ends in a slash.
  if (cfg.baseUrl) {
    if (cfg.baseUrl.charAt(cfg.baseUrl.length - 1) !== '/') {
      cfg.baseUrl += '/';
    }
  }

  // can't use object.assign here
  if (cfg.urlArgs) {
    config.urlArgs = cfg.urlArgs;
  }
  if (cfg.baseUrl) {
    config.baseUrl = cfg.baseUrl;
  }
  if (cfg.renameJsExtension) {
    config.renameJsExtension = cfg.renameJsExtension;
  }
  config.noRequireCss = cfg.noRequireCss;
};
var define = function () {
  queue.push(Array.prototype.slice.call(arguments, 0));
};
globalThis.define = define;
globalThis.require = req;
req.setCssLoader = function (cssLoader) {
  CSSLoader = cssLoader;
  cssLoader.urlArgs = config.urlArgs;
  cssLoader.baseUrl = config.baseUrl;
};

// needed by hlsjs
define.amd = {};
