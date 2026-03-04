define(["exports", "./../dom.js", "./../focusmanager.js", "./../dialoghelper/dialoghelper.js"], function (_exports, _dom, _focusmanager, _dialoghelper) {
  Object.defineProperty(_exports, "__esModule", {
    value: true
  });
  _exports.default = void 0;
  /* jshint module: true */

  // only needed for styles

  require(['css!modules/alphanumericshortcuts/alphanumericshortcuts.css']);
  var inputDisplayElement;
  var currentDisplayText = '';
  var currentDisplayTextContainer;
  function alphanumeric(value) {
    var letterNumber = /^[0-9a-zA-Z]+$/;
    return value.match(letterNumber);
  }
  function ensureInputDisplayElement() {
    if (!inputDisplayElement) {
      inputDisplayElement = document.createElement('div');
      inputDisplayElement.classList.add('alphanumeric-shortcut', 'hide', 'dialog');
      if (_dom.default.allowBackdropFilter()) {
        inputDisplayElement.classList.add('dialog-blur');
      }
      document.body.appendChild(inputDisplayElement);
    }
  }
  var alpanumericShortcutTimeout;
  function clearAlphaNumericShortcutTimeout() {
    if (alpanumericShortcutTimeout) {
      clearTimeout(alpanumericShortcutTimeout);
      alpanumericShortcutTimeout = null;
    }
  }
  function resetAlphaNumericShortcutTimeout(instance) {
    clearAlphaNumericShortcutTimeout();
    alpanumericShortcutTimeout = setTimeout(onAlphanumericShortcutTimeout.bind(instance), 2000);
  }
  function onAlphanumericKeyPress(instance, e, chr) {
    if (currentDisplayText.length >= 3) {
      return;
    }
    ensureInputDisplayElement();
    currentDisplayText += chr;
    inputDisplayElement.innerHTML = currentDisplayText;
    inputDisplayElement.classList.remove('hide');
    resetAlphaNumericShortcutTimeout(instance);
  }
  function onAlphanumericShortcutTimeout() {
    var instance = this;
    var value = currentDisplayText;
    var container = currentDisplayTextContainer;
    currentDisplayText = '';
    currentDisplayTextContainer = null;
    inputDisplayElement.innerHTML = '';
    inputDisplayElement.classList.add('hide');
    clearAlphaNumericShortcutTimeout();
    selectByShortcutValue(instance, container, value);
  }
  function selectByShortcutValue(instance, container, value) {
    if (instance.onAlphaNumericValueEntered) {
      if (instance.onAlphaNumericValueEntered(value)) {
        return;
      }
    }
  }
  function AlphaNumericShortcuts(options) {
    this.options = options;
    options.focusScope = _focusmanager.default.getCurrentScope();
    this.keyDownHandler = this.onKeyDown.bind(this);
    this.addEventListeners();
  }
  AlphaNumericShortcuts.prototype.onKeyDown = function (e) {
    if (e.ctrlKey) {
      return;
    }
    if (e.shiftKey) {
      return;
    }
    if (e.altKey) {
      return;
    }
    var options = this.options;

    // Shouldn't happen, but saw uwp crash report
    if (!options) {
      return;
    }

    // a dialog is open
    if (options.focusScope !== _focusmanager.default.getCurrentScope()) {
      return;
    }
    var tagName = e.target.tagName;
    if (tagName === 'INPUT' || tagName === 'TEXTAREA') {
      return;
    }
    var key = e.key;
    var chr = key ? alphanumeric(key) : null;
    if (chr) {
      chr = chr.toString().toUpperCase();
      if (chr.length === 1) {
        currentDisplayTextContainer = options.itemsContainer;
        onAlphanumericKeyPress(this, e, chr);
      }
    }
  };
  AlphaNumericShortcuts.prototype.addEventListeners = function () {
    if (this._eventHandlersBound) {
      return;
    }
    this._eventHandlersBound = true;
    var keyDownHandler = this.keyDownHandler;
    if (keyDownHandler) {
      _dom.default.addEventListener(window, 'keydown', keyDownHandler, {
        passive: true
      });
    }
  };
  AlphaNumericShortcuts.prototype.removeEventListeners = function () {
    this._eventHandlersBound = null;
    var keyDownHandler = this.keyDownHandler;
    if (keyDownHandler) {
      _dom.default.removeEventListener(window, 'keydown', keyDownHandler, {
        passive: true
      });
    }
  };
  AlphaNumericShortcuts.prototype.pause = function () {
    this.removeEventListeners();
  };
  AlphaNumericShortcuts.prototype.resume = function () {
    this.addEventListeners();
  };
  AlphaNumericShortcuts.prototype.destroy = function () {
    this.removeEventListeners();
    this.keyDownHandler = null;
    this.options = null;
  };
  var _default = _exports.default = AlphaNumericShortcuts;
});
