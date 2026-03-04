define(["exports", "./../../input/keyboard.js"], function (_exports, _keyboard) {
  Object.defineProperty(_exports, "__esModule", {
    value: true
  });
  _exports.default = void 0;
  /* jshint module: true */

  require(['css!modules/emby-elements/emby-checkbox/emby-checkbox.css', 'css!tv|modules/emby-elements/emby-checkbox/emby-checkbox_tv.css']);
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
  var EmbyCheckbox = /*#__PURE__*/function (_HTMLInputElement) {
    function EmbyCheckbox() {
      var _this;
      // address the upgraded instance and use it
      var self = _this = _HTMLInputElement.call(this) || this;
      return babelHelpers.possibleConstructorReturn(_this, self);
    }
    babelHelpers.inherits(EmbyCheckbox, _HTMLInputElement);
    return babelHelpers.createClass(EmbyCheckbox, [{
      key: "connectedCallback",
      value: function connectedCallback() {
        // cardbuilder presets these
        if (!this.hasAttribute('data-classes')) {
          this.classList.add('emby-checkbox');
          var labelElement = this.parentNode;
          labelElement.classList.add('emby-checkbox-label');
          var labelTextElement = labelElement.querySelector('span');
          if (labelTextElement) {
            labelTextElement.classList.add('checkboxLabel');
            labelTextElement.insertAdjacentHTML('afterend', '<div class="emby-checkbox-focusoutline"></div>');
          }
        }

        // this is just an optimization to avoid adding this listener for some checkboxes in lists
        if (this.tabIndex !== -1) {
          this.addEventListener('keydown', onKeyDown);
        }
      }
    }, {
      key: "disconnectedCallback",
      value: function disconnectedCallback() {
        this.removeEventListener('keydown', onKeyDown);
      }
    }]);
  }(/*#__PURE__*/babelHelpers.wrapNativeSuper(HTMLInputElement));
  customElements.define('emby-checkbox', EmbyCheckbox, {
    extends: 'input'
  });
  var _default = _exports.default = EmbyCheckbox;
});
