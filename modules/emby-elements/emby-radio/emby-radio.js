define(["exports", "./../../input/keyboard.js"], function (_exports, _keyboard) {
  Object.defineProperty(_exports, "__esModule", {
    value: true
  });
  _exports.default = void 0;
  /* jshint module: true */

  require(['css!modules/emby-elements/emby-radio/emby-radio.css', 'css!tv|modules/emby-elements/emby-radio/emby-radio_tv.css']);
  function onKeyDown(e) {
    var key = _keyboard.default.normalizeKeyFromEvent(e);
    switch (key) {
      case 'Enter':
        {
          // Don't submit form on enter
          e.preventDefault();

          //console.log('keydown, key: ' + e.key + ', repeat: ' + e.repeat + '--' + new Error().stack);

          if (e.repeat) {
            return;
          }
          this.checked = !this.checked;
          this.dispatchEvent(new CustomEvent('change', {
            bubbles: true
          }));
          return false;
        }
      default:
        return;
    }
  }
  var inputId = 0;
  function onInit() {
    var elem = this;
    if (elem.hasInit) {
      return;
    }
    elem.hasInit = true;
    if (!this.id) {
      this.id = 'embyradio' + inputId;
      inputId++;
    }
    this.addEventListener('keydown', onKeyDown);
  }
  function _connectedCallback() {
    if (this.classList.contains('emby-radio')) {
      return;
    }
    this.classList.add('emby-radio');
    var labelElement = this.parentNode;
    labelElement.classList.add('emby-radio-label');
    var labelTextElement = labelElement.querySelector('span');
    labelTextElement.classList.add('radioButtonLabel');
    labelElement.insertAdjacentHTML('beforeend', '<span class="emby-radio-focusoutline"></span><span class="emby-radio-outer-circle"></span><span class="emby-radio-inner-circle"></span>');
  }
  var EmbyRadio = /*#__PURE__*/function (_HTMLInputElement) {
    function EmbyRadio() {
      var _this;
      // address the upgraded instance and use it
      var self = _this = _HTMLInputElement.call(this) || this;
      onInit.call(self);
      return babelHelpers.possibleConstructorReturn(_this, self);
    }
    babelHelpers.inherits(EmbyRadio, _HTMLInputElement);
    return babelHelpers.createClass(EmbyRadio, [{
      key: "connectedCallback",
      value: function connectedCallback() {
        onInit.call(this);
        _connectedCallback.call(this);
      }
    }, {
      key: "disconnectedCallback",
      value: function disconnectedCallback() {
        this.removeEventListener('keydown', onKeyDown);
      }
    }]);
  }(/*#__PURE__*/babelHelpers.wrapNativeSuper(HTMLInputElement));
  customElements.define('emby-radio', EmbyRadio, {
    extends: 'input'
  });
  var _default = _exports.default = EmbyRadio;
});
