define(["exports"], function (_exports) {
  Object.defineProperty(_exports, "__esModule", {
    value: true
  });
  _exports.default = void 0;
  /* jshint module: true */

  function onCachePutFail(e) {
    console.log(e);
  }
  function updateCache(instance) {
    var cache = instance.cache;
    if (cache) {
      cache.put('data', new Response(JSON.stringify(instance.localData))).catch(onCachePutFail);
    }
  }
  function onCacheOpened(result) {
    this.cache = result;
    this.localData = {};
  }
  function onCacheOpenFailed(err) {
    console.log("Error opening cache: " + err);
    this.localData = {};
    return Promise.resolve();
  }
  function MyStore() {}
  MyStore.prototype.init = function () {
    try {
      if (typeof caches !== 'undefined') {
        caches.open('embydata').then(onCacheOpened.bind(this), onCacheOpenFailed.bind(this));
      }
    } catch (err) {
      console.log("Error opening cache: " + err);
    }
    return Promise.resolve();
  };
  MyStore.prototype.setItem = function (name, value) {
    localStorage.setItem(name, value);
    var localData = this.localData;
    if (localData) {
      var changed = localData[name] !== value;
      if (changed) {
        localData[name] = value;
        updateCache(this);
      }
    }
  };
  MyStore.prototype.getItem = function (name) {
    return localStorage.getItem(name);
  };
  MyStore.prototype.removeItem = function (name) {
    localStorage.removeItem(name);
    var localData = this.localData;
    if (localData) {
      localData[name] = null;
      delete localData[name];
      updateCache(this);
    }
  };
  var _default = _exports.default = new MyStore();
});
