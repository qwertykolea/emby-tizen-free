define(["exports", "./../../dom.js", "./emby-button.js"], function (_exports, _dom, _embyButton) {
  Object.defineProperty(_exports, "__esModule", {
    value: true
  });
  _exports.default = void 0;
  /* jshint module: true */

  var EnableFocusTransfrom = _dom.default.allowFocusScaling();
  function onInit() {
    var elem = this;
    if (elem.hasInit) {
      return;
    }
    elem.hasInit = true;
    var classList = elem.classList;
    classList.add('paper-icon-button-light');
    if (EnableFocusTransfrom && this.getAttribute('data-focusscale') !== 'false') {
      classList.add('emby-button-focusscale');
    }
  }
  var PaperIconButtonLight = /*#__PURE__*/function (_HTMLButtonElement) {
    function PaperIconButtonLight() {
      var _this;
      // address the upgraded instance and use it
      var self = _this = _HTMLButtonElement.call(this) || this;
      onInit.call(self);
      return babelHelpers.possibleConstructorReturn(_this, self);
    }
    babelHelpers.inherits(PaperIconButtonLight, _HTMLButtonElement);
    return babelHelpers.createClass(PaperIconButtonLight, [{
      key: "connectedCallback",
      value: function connectedCallback() {
        onInit.call(this);
      }
    }]);
  }(/*#__PURE__*/babelHelpers.wrapNativeSuper(HTMLButtonElement));
  customElements.define('paper-icon-button-light', PaperIconButtonLight, {
    extends: 'button'
  });
  var _default = _exports.default = PaperIconButtonLight;
});
