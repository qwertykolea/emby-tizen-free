define(["exports", "./../modules/viewmanager/basesettingsview.js", "./../modules/emby-elements/emby-button/emby-button.js"], function (_exports, _basesettingsview, _embyButton) {
  Object.defineProperty(_exports, "__esModule", {
    value: true
  });
  _exports.default = void 0;
  /* jshint module: true */

  function View(view, params) {
    _basesettingsview.default.apply(this, arguments);
  }
  Object.assign(View.prototype, _basesettingsview.default.prototype);
  var _default = _exports.default = View;
});
