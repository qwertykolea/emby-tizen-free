define(["exports"], function (_exports) {
  Object.defineProperty(_exports, "__esModule", {
    value: true
  });
  _exports.default = void 0;
  /* jshint module: true */

  function MyStore() {}
  MyStore.prototype.init = function () {
    return Promise.resolve();
  };
  MyStore.prototype.setItem = function (name, value) {
    localStorage.setItem(name, value);
  };
  MyStore.prototype.getItem = function (name) {
    return localStorage.getItem(name);
  };
  MyStore.prototype.removeItem = function (name) {
    localStorage.removeItem(name);
  };
  var _default = _exports.default = new MyStore();
});
