define(["exports", "./../../dom.js", "./../../layoutmanager.js", "./../../actionsheet/actionsheet.js", "./../../focusmanager.js"], function (_exports, _dom, _layoutmanager, _actionsheet, _focusmanager) {
  Object.defineProperty(_exports, "__esModule", {
    value: true
  });
  _exports.default = void 0;
  function _superPropSet(t, e, o, r, p, f) { return babelHelpers.set(babelHelpers.getPrototypeOf(f ? t.prototype : t), e, o, r, p); }
  function _superPropGet(t, o, e, r) { var p = babelHelpers.get(babelHelpers.getPrototypeOf(1 & r ? t.prototype : t), o, e); return 2 & r && "function" == typeof p ? function (t) { return p.apply(e, t); } : p; } /* jshint module: true */
  var ActionSheet = _actionsheet.default.constructor;
  require(['css!modules/emby-elements/emby-input/emby-input.css', 'css!tv|modules/emby-elements/emby-input/emby-input_2_tv.css', 'css!!tv|modules/emby-elements/emby-input/emby-input_3_nontv.css']);
  function onFocus() {
    var _this$labelElement;
    // For Samsung orsay devices
    if (document.attachIME) {
      document.attachIME(this);
    }
    (_this$labelElement = this.labelElement) == null || _this$labelElement.classList.add('inputLabelFocused');
  }
  function onBlur() {
    var _this$labelElement2;
    (_this$labelElement2 = this.labelElement) == null || _this$labelElement2.classList.remove('inputLabelFocused');
  }
  function destroyActionSheet(elem) {
    clearInputTimer(elem);
    var actionsheet = elem.actionsheet;
    if (actionsheet) {
      if (actionsheet.isShowing()) {
        actionsheet.close();
      }
      actionsheet.destroy();
      elem.actionsheet = null;
    }
  }
  function onInputTimeout() {
    var elem = this;
    var value = elem.value.trim();
    console.log('onInputTimeout: ' + value);
    if (!value) {
      destroyActionSheet(elem);
      return;
    }
    if (elem.actionsheet) {
      // refresh items
      elem.actionsheet.refreshItems();
      return;
    }
    var actionsheet = new ActionSheet();
    elem.actionsheet = actionsheet;
    var options = {
      getItems: elem.getItems,
      enableVirtualScroller: false,
      positionTo: elem,
      resolveWithSelectedItem: true,
      hasItemIcon: true,
      iconRight: false,
      fields: ['Name', 'Type', 'ParentName'],
      dialogClass: 'emby-input-actionsheet',
      offsetTop: 2,
      refocus: false,
      artist: false,
      enableDefaultIcon: true,
      imageSize: 'small',
      hasItemImage: true,
      setCurrentFocusScope: false
    };
    if (!_layoutmanager.default.tv) {
      options.positionY = 'bottom';
      options.positionX = 'left';
      options.transformOrigin = 'center top';
      options.minWidthToElement = true;
    }
    var refocus = elem.getAttribute('data-refocus') !== 'false';
    elem.dispatchEvent(new CustomEvent('selectionopen', {
      bubbles: false,
      cancelable: false,
      detail: {}
    }));
    return actionsheet.show(options).then(function (item) {
      elem.value = item.Name;
      elem.dispatchEvent(new CustomEvent('itemselected', {
        bubbles: false,
        cancelable: false,
        detail: {
          item: item
        }
      }));
      if (refocus) {
        _focusmanager.default.focus(elem);
      }
      elem.dispatchEvent(new CustomEvent('selectionclose', {
        bubbles: false,
        cancelable: false,
        detail: {}
      }));
      destroyActionSheet(elem);
    }, function () {
      elem.dispatchEvent(new CustomEvent('selectioncancel', {
        bubbles: false,
        cancelable: false,
        detail: {}
      }));
      if (refocus) {
        _focusmanager.default.focus(elem);
      }
      elem.dispatchEvent(new CustomEvent('selectionclose', {
        bubbles: false,
        cancelable: false,
        detail: {}
      }));
      destroyActionSheet(elem);
    });
  }
  function clearInputTimer(elem) {
    if (elem.inputTimeout) {
      clearTimeout(elem.inputTimeout);
    }
  }
  function onInput() {
    var elem = this;
    clearInputTimer(elem);
    var value = elem.value.trim();
    if (!value) {
      destroyActionSheet(elem);
      return;
    }
    elem.inputTimeout = setTimeout(onInputTimeout.bind(elem), 400);
  }
  function isDecimal(val) {
    return !Number.isInteger(parseFloat(val));
  }
  function setInputMode(elem) {
    // needed for iOS to display the number keypad
    var type = elem.type;
    switch (type) {
      case 'number':
        {
          var isDecimalInput = isDecimal(elem.getAttribute('step')) || isDecimal(elem.getAttribute('min')) || isDecimal(elem.getAttribute('max'));
          elem.setAttribute('inputmode', isDecimalInput ? 'decimal' : 'numeric');
          break;
        }
      default:
        break;
    }
  }
  var inputId = 0;
  function onInit() {
    var parentNode = this.parentNode;
    if (!parentNode) {
      // not attached yet
      return;
    }
    var elem = this;
    if (elem.hasInit) {
      if (this.labelElement) {
        this.labelElement.htmlFor = this.id;
      }
      return;
    }
    elem.hasInit = true;
    if (!this.id) {
      this.id = 'embyinput' + inputId;
      inputId++;
    }
    if (this.classList.contains('emby-input')) {
      if (this.labelElement) {
        this.labelElement.htmlFor = this.id;
      }
      return;
    }
    this.classList.add('emby-input');
    if (this.type === 'number') {
      this.classList.add('emby-input-hide-spin-button');
    }
    var document = this.ownerDocument;
    var label = document.createElement('label');
    label.innerHTML = this.getAttribute('label') || '';
    label.classList.add('inputLabel');
    var labelClass = this.getAttribute('labelclass');
    if (labelClass) {
      label.classList.add(labelClass);
    }
    label.htmlFor = this.id;
    parentNode.insertBefore(label, this);
    this.labelElement = label;
    _dom.default.addEventListener(this, 'focus', onFocus, {
      passive: true
    });
    _dom.default.addEventListener(this, 'blur', onBlur, {
      passive: true
    });
    if (this.getAttribute('data-autocompleteitems') === 'true') {
      _dom.default.addEventListener(this, 'input', onInput, {
        passive: true
      });
    }
    setInputMode(this);
  }
  function roundMsToStep(ms, step) {
    step = step || 1;
    step *= 1000;
    step = Math.floor(step);

    // avoid showing fractions of seconds
    return ms - ms % step;
  }
  var supportsValueAsNumber = typeof document.createElement('input').valueAsNumber !== 'undefined';
  var supportsValueAsDate = typeof document.createElement('input').valueAsDate !== 'undefined';
  function pad(num, size) {
    var s = num + "";
    while (s.length < size) {
      s = "0" + s;
    }
    return s;
  }
  function toLocalIsoString(date) {
    return date.getFullYear() + '-' + pad(date.getMonth() + 1, 2) + '-' + pad(date.getDate(), 2);
  }
  var EmbyInput = /*#__PURE__*/function (_HTMLInputElement) {
    function EmbyInput() {
      var _this;
      // address the upgraded instance and use it
      var self = _this = _HTMLInputElement.call(this) || this;
      onInit.call(self);
      return babelHelpers.possibleConstructorReturn(_this, self);
    }
    babelHelpers.inherits(EmbyInput, _HTMLInputElement);
    return babelHelpers.createClass(EmbyInput, [{
      key: "connectedCallback",
      value: function connectedCallback() {
        onInit.call(this);
      }
    }, {
      key: "disconnectedCallback",
      value: function disconnectedCallback() {
        destroyActionSheet(this);
      }
    }, {
      key: "isSelectionDialogOpen",
      value: function isSelectionDialogOpen() {
        var actionsheet = this.actionsheet;
        return (actionsheet == null ? void 0 : actionsheet.isShowing()) || false;
      }
    }, {
      key: "focusSelectionDialog",
      value: function focusSelectionDialog() {
        var actionsheet = this.actionsheet;
        if (actionsheet) {
          if (actionsheet.isShowing()) {
            actionsheet.autoFocus();
          }
        }
      }
    }, {
      key: "closeSelectionDialog",
      value: function closeSelectionDialog() {
        destroyActionSheet(this);
      }
    }, {
      key: "label",
      value: function label(text) {
        this.labelElement.innerHTML = text;
      }
    }, {
      key: "valueAsNumber",
      get: function () {
        if (supportsValueAsNumber) {
          return _superPropGet(EmbyInput, "valueAsNumber", this, 1);
        }
        var value = this.value;
        if (value) {
          try {
            return Date.parse(value);
          } catch (err) {}
        }
        return NaN;
      },
      set: function (val) {
        if (!val || isNaN(val)) {
          this.value = '';
          return;
        }
        val = roundMsToStep(val, this.step);
        if (supportsValueAsNumber) {
          _superPropSet(EmbyInput, "valueAsNumber", val, this, 1, 1);
        } else {
          _superPropSet(EmbyInput, "value", val ? toLocalIsoString(new Date(val)) : '', this, 1, 1);
        }
      }
    }, {
      key: "valueAsDate",
      get: function () {
        if (supportsValueAsDate) {
          return _superPropGet(EmbyInput, "valueAsDate", this, 1);
        }
        var value = this.valueAsNumber;
        if (value && !isNaN(value)) {
          return new Date(value);
        }
        return null;
      },
      set: function (val) {
        if (supportsValueAsDate) {
          _superPropSet(EmbyInput, "valueAsDate", val, this, 1, 1);
        } else {
          _superPropSet(EmbyInput, "value", val ? toLocalIsoString(val.getTime()) : '', this, 1, 1);
        }
      }
    }, {
      key: "valueAsDateUtc",
      get: function () {
        var val = this.valueAsNumber;
        if (val && !isNaN(val)) {
          var offsetMs = new Date(val).getTimezoneOffset() * 60 * 1000;
          return new Date(val + offsetMs);
        }
        return null;
      },
      set: function (date) {
        if (date) {
          var offsetMs = date.getTimezoneOffset() * 60 * 1000;
          this.valueAsNumber = date.getTime() - offsetMs;
        } else {
          this.value = '';
        }
      }
    }, {
      key: "valueAsNumberUtc",
      get: function () {
        var val = this.valueAsNumber;
        if (!val || isNaN(val)) {
          return val;
        }
        var offsetMs = new Date().getTimezoneOffset(val) * 60 * 1000;
        return val + offsetMs;
      },
      set: function (val) {
        if (!val || isNaN(val)) {
          this.value = '';
          return;
        }
        var offsetMs = new Date(val).getTimezoneOffset() * 60 * 1000;
        this.valueAsNumber = val - offsetMs;
      }
    }, {
      key: "minDateTimeLocal",
      get: function () {
        // this only exists for jshint
        return null;
      },
      set: function (valueAsNumber) {
        var offsetMs = new Date(valueAsNumber).getTimezoneOffset() * 60 * 1000;
        valueAsNumber -= offsetMs;
        valueAsNumber = roundMsToStep(valueAsNumber, this.step);
        this.setAttribute('min', new Date(valueAsNumber).toISOString().replace('Z', ''));
      }
    }]);
  }(/*#__PURE__*/babelHelpers.wrapNativeSuper(HTMLInputElement));
  customElements.define('emby-input', EmbyInput, {
    extends: 'input'
  });
  EmbyInput.setLabel = function (elem, label) {
    if (elem.label && elem.labelElement) {
      elem.label(label || '');
    } else {
      elem.setAttribute('label', label || '');
    }
  };
  var _default = _exports.default = EmbyInput;
});
