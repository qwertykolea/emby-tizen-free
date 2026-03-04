define(["exports", "./../../layoutmanager.js"], function (_exports, _layoutmanager) {
  Object.defineProperty(_exports, "__esModule", {
    value: true
  });
  _exports.default = void 0;
  /* jshint module: true */

  require(['css!modules/emby-elements/emby-multilineselect/emby-multilineselect.css', 'css!tv|modules/emby-elements/emby-multilineselect/emby-multilineselect_tv.css']);
  function getLabel(select) {
    var elem = select.parentElement.previousSibling;
    while (elem && elem.tagName !== 'LABEL') {
      elem = elem.previousSibling;
    }
    return elem;
  }
  function onFocus(e) {
    var label = getLabel(this);
    if (label) {
      label.classList.add('selectLabelFocused');
    }
  }
  function onBlur(e) {
    var label = getLabel(this);
    if (label) {
      label.classList.remove('selectLabelFocused');
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
      this.id = 'emby-multilineselect' + inputId;
      inputId++;
    }
    if (_layoutmanager.default.tv) {
      this.classList.add('emby-multilineselect-focusscale');
    }
    this.addEventListener('focus', onFocus);
    this.addEventListener('blur', onBlur);
  }
  function _connectedCallback() {
    if (this.classList.contains('emby-multilineselect')) {
      return;
    }
    if (!this.parentElement.classList.contains('emby-select-wrapper')) {
      var newWrapper = document.createElement('div');
      newWrapper.classList.add('emby-select-wrapper');
      this.parentNode.replaceChild(newWrapper, this);
      newWrapper.appendChild(this);
      return;
    }
    var wrapper = this.parentElement;
    var container = wrapper.parentElement;
    this.classList.add('emby-multilineselect');
    var labelText = this.getAttribute('label') || '';
    var label = this.closest('label');
    var insertLabel;
    if (label) {
      label.insertAdjacentHTML('afterbegin', '<div class="selectLabelText">' + labelText + '</div>');
      label.classList.add('selectLabel');
    } else {
      label = this.ownerDocument.createElement('label');
      label.classList.add('selectLabel', 'selectLabelText');
      label.innerHTML = labelText;
      label.htmlFor = this.id;
      insertLabel = true;
    }
    var arrowContainerClass = 'selectArrowContainer';
    if (this.classList.contains('emby-multilineselect-inline')) {
      label.classList.add('selectLabel2-inline');
      arrowContainerClass += ' selectArrowContainer-inline';
    }
    if (insertLabel) {
      container.insertBefore(label, wrapper);
    }
    if (this.classList.contains('emby-multilineselect-withcolor')) {
      this.parentNode.insertAdjacentHTML('beforeend', '<div class="' + arrowContainerClass + '"><i class="selectArrow md-icon">&#xe313;</i></div>');
    }
  }
  function _setLabel(text) {
    var label = this.parentNode.parentNode.querySelector('label');
    label.innerHTML = text;
  }
  var EmbyMultiLineSelect = /*#__PURE__*/function (_HTMLSelectElement) {
    function EmbyMultiLineSelect() {
      var _this;
      // address the upgraded instance and use it
      var self = _this = _HTMLSelectElement.call(this) || this;
      onInit.call(self);
      return babelHelpers.possibleConstructorReturn(_this, self);
    }
    babelHelpers.inherits(EmbyMultiLineSelect, _HTMLSelectElement);
    return babelHelpers.createClass(EmbyMultiLineSelect, [{
      key: "connectedCallback",
      value: function connectedCallback() {
        onInit.call(this);
        _connectedCallback.call(this);
      }
    }, {
      key: "setLabel",
      value: function setLabel() {
        _setLabel.apply(this, arguments);
      }
    }]);
  }(/*#__PURE__*/babelHelpers.wrapNativeSuper(HTMLSelectElement));
  customElements.define('emby-multilineselect', EmbyMultiLineSelect, {
    extends: 'select'
  });
  var _default = _exports.default = EmbyMultiLineSelect;
});
