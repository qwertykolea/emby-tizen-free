define(["exports"], function (_exports) {
  Object.defineProperty(_exports, "__esModule", {
    value: true
  });
  _exports.default = void 0;
  /* jshint module: true */

  function MyStore() {
    this.localData = {};
  }
  MyStore.prototype.setItem = function (name, value) {
    this.localData[name] = value;
  };
  MyStore.prototype.getItem = function (name) {
    return this.localData[name];
  };
  MyStore.prototype.removeItem = function (name) {
    this.localData[name] = null;
  };
  var _default = _exports.default = new MyStore();
});
