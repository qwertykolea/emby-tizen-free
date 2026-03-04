define(["exports"], function (_exports) {
  Object.defineProperty(_exports, "__esModule", {
    value: true
  });
  _exports.default = void 0;
  /* jshint module: true */

  function updateCache(instance, localData) {
    instance.cache.put('data', new Response(JSON.stringify(localData)));
  }
  function MyStore() {}
  MyStore.prototype.init = function () {
    var instance = this;
    return caches.open('embydata').then(function (cache) {
      instance.cache = cache;
      return cache.match('data').then(function (response) {
        if (!response) {
          instance.localData = {};
          return Promise.resolve();
        }
        return response.text().then(function (text) {
          instance.localData = JSON.parse(text);
        });
      }, function () {
        instance.localData = {};
      });
    });
  };
  MyStore.prototype.setItem = function (name, value) {
    var localData = this.localData;
    if (localData) {
      var changed = localData[name] !== value;
      if (changed) {
        localData[name] = value;
        updateCache(this, localData);
      }
    }
  };
  MyStore.prototype.getItem = function (name) {
    var localData = this.localData;
    if (localData) {
      return localData[name];
    }
  };
  MyStore.prototype.removeItem = function (name) {
    var localData = this.localData;
    if (localData) {
      localData[name] = null;
      delete localData[name];
      updateCache(this, localData);
    }
  };
  var _default = _exports.default = new MyStore();
});
