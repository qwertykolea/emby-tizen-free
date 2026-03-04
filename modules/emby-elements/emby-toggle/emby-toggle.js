define(["exports", "./../../input/keyboard.js"], function (_exports, _keyboard) {
  Object.defineProperty(_exports, "__esModule", {
    value: true
  });
  _exports.default = void 0;
  /* jshint module: true */

  require(['css!modules/emby-elements/emby-toggle/emby-toggle.css', 'css!!tv|modules/emby-elements/emby-toggle/emby-toggle_nontv.css', 'css!tv|modules/emby-elements/emby-toggle/emby-toggle_tv.css']);
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
  function onFocus() {
    var _this$closest;
    (_this$closest = this.closest('.emby-toggle-label')) == null || _this$closest.classList.add('emby-toggle-label-focus');
  }
  function onBlur() {
    var _this$closest2;
    (_this$closest2 = this.closest('.emby-toggle-label')) == null || _this$closest2.classList.remove('emby-toggle-label-focus');
  }
  function _connectedCallback() {
    this.setAttribute('role', 'switch');

    // cardbuilder presets these
    this.classList.add('emby-toggle');
    var labelElement = this.parentNode;
    labelElement.classList.add('emby-toggle-label');
    var labelTextElement = labelElement.querySelector('.toggleLabel');
    if (!labelTextElement) {
      labelTextElement = document.createElement('span');
      labelTextElement.innerHTML = this.getAttribute('label') || '';
      labelElement.appendChild(labelTextElement);
    }
    labelTextElement.classList.add('toggleLabel');
    if (!this.classList.contains('toggle-inline')) {
      labelTextElement.classList.add('flex-grow');
    }
    var toggle = labelElement.querySelector('.toggleSwitch');
    if (!toggle) {
      toggle = document.createElement('div');
      toggle.classList.add('toggleSwitch');
      labelElement.appendChild(toggle);
    }
    this.addEventListener('keydown', onKeyDown);
    this.removeEventListener('focus', onFocus);
    this.addEventListener('focus', onFocus);
    this.removeEventListener('blur', onBlur);
    this.addEventListener('blur', onBlur);
  }
  function _disconnectedCallback() {
    this.removeEventListener('keydown', onKeyDown);
  }
  var EmbyToggle = /*#__PURE__*/function (_HTMLInputElement) {
    function EmbyToggle() {
      var _this;
      // address the upgraded instance and use it
      var self = _this = _HTMLInputElement.call(this) || this;
      return babelHelpers.possibleConstructorReturn(_this, self);
    }
    babelHelpers.inherits(EmbyToggle, _HTMLInputElement);
    return babelHelpers.createClass(EmbyToggle, [{
      key: "connectedCallback",
      value: function connectedCallback() {
        _connectedCallback.call(this);
      }
    }, {
      key: "disconnectedCallback",
      value: function disconnectedCallback() {
        _disconnectedCallback.call(this);
      }
    }]);
  }(/*#__PURE__*/babelHelpers.wrapNativeSuper(HTMLInputElement));
  customElements.define('emby-toggle', EmbyToggle, {
    extends: 'input'
  });
  var _default = _exports.default = EmbyToggle;
});
