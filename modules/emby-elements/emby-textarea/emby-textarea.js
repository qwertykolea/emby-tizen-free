define(["exports", "./../emby-input/emby-input.js"], function (_exports, _embyInput) {
  Object.defineProperty(_exports, "__esModule", {
    value: true
  });
  _exports.default = void 0;
  /* jshint module: true */

  // for styles

  require(['css!modules/emby-elements/emby-textarea/emby-textarea.css']);
  function _connectedCallback() {
    if (this.classList.contains('emby-textarea')) {
      return;
    }
    if (!this.hasAttribute('rows')) {
      this.rows = 10;
    }
    this.classList.add('emby-textarea');
    var label = this.closest('label');
    if (label) {
      var labelText = this.getAttribute('label') || '';
      label.insertAdjacentHTML('afterbegin', '<div class="emby-textarea-labeltext">' + labelText + '</div>');
      label.classList.add('emby-textarea-label');
    }
  }
  var EmbyTextArea = /*#__PURE__*/function (_HTMLTextAreaElement) {
    function EmbyTextArea() {
      var _this;
      // address the upgraded instance and use it
      var self = _this = _HTMLTextAreaElement.call(this) || this;
      return babelHelpers.possibleConstructorReturn(_this, self);
    }
    babelHelpers.inherits(EmbyTextArea, _HTMLTextAreaElement);
    return babelHelpers.createClass(EmbyTextArea, [{
      key: "connectedCallback",
      value: function connectedCallback() {
        _connectedCallback.call(this);
      }
    }]);
  }(/*#__PURE__*/babelHelpers.wrapNativeSuper(HTMLTextAreaElement));
  customElements.define('emby-textarea', EmbyTextArea, {
    extends: 'textarea'
  });
  var _default = _exports.default = EmbyTextArea;
});
