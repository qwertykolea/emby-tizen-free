define(["exports"], function (_exports) {
  Object.defineProperty(_exports, "__esModule", {
    value: true
  });
  _exports.default = void 0;
  /* jshint module: true */
  var _default = _exports.default = {
    paramsToString: function (params) {
      var urlSearchParams = new URLSearchParams();
      for (var key in params) {
        var value = params[key];
        if (value !== null && value !== undefined && value !== '') {
          urlSearchParams.set(key, value);
        }
      }
      return urlSearchParams.toString();
    }
  };
});
