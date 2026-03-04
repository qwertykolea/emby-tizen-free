define(["exports"], function (_exports) {
  Object.defineProperty(_exports, "__esModule", {
    value: true
  });
  _exports.default = void 0;
  /* jshint module: true */
  var _default = _exports.default = {
    openUrl: function (url) {
      window.open(url, '_blank');
    },
    canExec: false,
    exec: function (options) {
      // options.path
      // options.arguments
      return Promise.reject();
    }
  };
});
