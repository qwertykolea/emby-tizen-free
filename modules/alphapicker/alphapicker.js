define(["exports", "./../layoutmanager.js", "./../focusmanager.js", "./../emby-elements/emby-button/paper-icon-button-light.js"], function (_exports, _layoutmanager, _focusmanager, _paperIconButtonLight) {
  Object.defineProperty(_exports, "__esModule", {
    value: true
  });
  _exports.default = void 0;
  /* jshint module: true */

  require(['css!modules/alphapicker/alphapicker.css', 'css!!tv|modules/alphapicker/alphapicker_nontv.css', 'css!tv|modules/alphapicker/alphapicker_tv.css', 'material-icons']);
  function focus() {
    var scope = this;
    var selected = scope.querySelector('.alphaPickerButton-current');
    if (selected) {
      _focusmanager.default.focus(selected);
    } else {
      _focusmanager.default.autoFocus(scope);
    }
  }
  function getAlphaPickerButtonClassName(vertical) {
    var alphaPickerButtonClassName = 'alphaPickerButton';
    alphaPickerButtonClassName += ' secondaryText';
    if (vertical) {
      alphaPickerButtonClassName += ' alphaPickerButton-vertical';
    }
    return alphaPickerButtonClassName;
  }
  function getLetterButton(keyInfo, vertical) {
    return '<button type="button" is="emby-button" href="#" data-focusscale="false" data-value="' + keyInfo.value + '" class="button-link ' + getAlphaPickerButtonClassName(vertical) + '">' + keyInfo.name + '</button>';
  }
  function mapKeysToHtml(keys, vertical) {
    return keys.map(function (k) {
      return getLetterButton(k, vertical);
    });
  }
  function mapToKeyInfo(character) {
    return {
      name: character,
      value: character
    };
  }
  function mapLettersToHtml(letters, vertical) {
    return mapKeysToHtml(letters.map(mapToKeyInfo), vertical);
  }
  function render(element, options) {
    element.classList.add('alphaPicker');
    var vertical = element.classList.contains('alphaPicker-vertical');
    if (!vertical) {
      element.classList.add('focuscontainer-x');
    }
    var html = '';
    var alphaPickerButtonClassName = getAlphaPickerButtonClassName(vertical);
    var rowClassName = 'alphaPickerRow';
    if (vertical) {
      rowClassName += ' alphaPickerRow-vertical secondaryText';
      if (_layoutmanager.default.tv) {

        //
      } else {
        // this causes the transform scale to be a little awkward, so don't add this in tv mode
        rowClassName += ' scrollY hiddenScrollY';
      }
    }
    if (options.mode === 'keyboard') {
      // space_bar icon

      var rows = [];
      if (options.type === 'numeric') {
        rows.push({
          keys: ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'].map(mapToKeyInfo)
        });
      } else {
        rows.push({
          keys: ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z'].map(mapToKeyInfo)
        }, {
          keys: ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'].map(mapToKeyInfo)
        });
        rows[0].keys.unshift({
          name: 'SPACE',
          value: ' '
        });
      }
      for (var i = 0, length = rows.length; i < length; i++) {
        var row = rows[i];
        html += '<div class="' + rowClassName + '">';
        html += mapKeysToHtml(row.keys, vertical).join('');
        if (i === 0) {
          // backspace icon
          html += '<button type="button" data-focusscale="false" data-value="backspace" is="paper-icon-button-light" class="' + alphaPickerButtonClassName + '"><i class="md-icon alphaPickerButtonIcon autortl">&#xe14A;</i></button>';
          html += '</div>';
        }
        html += '</div>';
      }
      setInnerHtml(element, html);
    } else {
      html += '<div class="' + rowClassName + '">';
      html += mapLettersToHtml(options.prefixes || [], vertical).join('');
      html += '</div>';
      setInnerHtml(element, html);
    }
  }
  function setInnerHtml(element, html) {
    element.innerHTML = html;
    element.classList.add('focusable');
    element.focus = focus;
  }
  function onAlphaPickerClick(e) {
    clearAlphaFocusTimeout(this);
    var alphaPickerButton = e.target.closest('.alphaPickerButton');
    if (alphaPickerButton) {
      var value = alphaPickerButton.getAttribute('data-value');
      this.value(value, true);
    }
  }
  function onAlphaPickerInKeyboardModeClick(e) {
    var alphaPickerButton = e.target.closest('.alphaPickerButton');
    if (alphaPickerButton) {
      var value = alphaPickerButton.getAttribute('data-value');
      var options = this.options;
      var element = options.element;
      element.dispatchEvent(new CustomEvent("alphavalueclicked", {
        cancelable: false,
        detail: {
          value: value
        }
      }));
    }
  }
  function onAlphaFocusTimeout() {
    this.alphaFocusTimeout = null;
    this.previousActiveElement = null;
    if (document.activeElement === this.alphaFocusedElement) {
      var value = this.alphaFocusedElement.getAttribute('data-value');
      this.value(value, true);
    }
  }
  function clearAlphaFocusTimeout(instance) {
    if (instance.alphaFocusTimeout) {
      clearTimeout(instance.alphaFocusTimeout);
      instance.alphaFocusTimeout = null;
    }
  }
  function onAlphaPickerFocusIn(e) {
    if (this.alphaFocusTimeout) {
      clearTimeout(this.alphaFocusTimeout);
      this.alphaFocusTimeout = null;
    }
    var alphaPickerButton = e.target.closest('.alphaPickerButton');
    var delay = 1500;
    if (!this.previousActiveElement) {
      delay = 3000;
    }
    this.previousActiveElement = alphaPickerButton;
    if (alphaPickerButton) {
      this.alphaFocusedElement = alphaPickerButton;
      this.alphaFocusTimeout = setTimeout(onAlphaFocusTimeout.bind(this), delay);
    }
  }
  function AlphaPicker(options) {
    this.options = options;
    this.bound_onAlphaPickerInKeyboardModeClick = onAlphaPickerInKeyboardModeClick.bind(this);
    this.bound_onAlphaPickerFocusIn = onAlphaPickerFocusIn.bind(this);
    this.bound_onAlphaPickerClick = onAlphaPickerClick.bind(this);
    var element = options.element;
    render(element, options);
    this.enabled(true);
    this.visible(true);
  }
  AlphaPicker.prototype.enabled = function (enabled) {
    var fn;
    var options = this.options;
    var element = options.element;
    if (enabled) {
      if (options.mode === 'keyboard') {
        element.addEventListener('click', this.bound_onAlphaPickerInKeyboardModeClick);
      } else {
        if (_layoutmanager.default.tv) {
          element.addEventListener('focus', this.bound_onAlphaPickerFocusIn, true);
        }
        element.addEventListener('click', this.bound_onAlphaPickerClick);
      }
    } else {
      clearAlphaFocusTimeout(this);
      element.removeEventListener('click', this.bound_onAlphaPickerInKeyboardModeClick, true);
      element.removeEventListener('click', this.bound_onAlphaPickerClick);
      fn = element.onAlphaPickerClickFn;
      if (fn) {
        element.removeEventListener('click', fn);
        element.onAlphaPickerClickFn = null;
      }
    }
  };
  AlphaPicker.prototype.value = function (value, applyValue) {
    var element = this.options.element;
    value = value.toUpperCase();
    if (applyValue) {
      element.dispatchEvent(new CustomEvent("alphavaluechanged", {
        cancelable: false,
        detail: {
          value: value
        }
      }));
    }
  };
  function setCurrentButton(instance, button) {
    var current = instance._currentButton;
    if (current === button) {
      return;
    }
    if (current) {
      current.classList.remove('alphaPickerButton-current');
    }
    instance._currentButton = button;
    if (button) {
      button.classList.add('alphaPickerButton-current');
    }
  }
  function ensureButtonMap(instance) {
    var buttonMap = instance._buttonMap;
    if (buttonMap) {
      return buttonMap;
    }
    buttonMap = {};
    var buttons = instance.options.element.querySelectorAll('.alphaPickerButton[data-value]');
    for (var i = 0, length = buttons.length; i < length; i++) {
      var button = buttons[i];
      buttonMap[button.getAttribute('data-value')] = button;
    }
    instance._buttonMap = buttonMap;
    return buttonMap;
  }
  AlphaPicker.prototype.setCurrentFromItem = function (item) {
    var prefix = item.Prefix;
    if (!prefix) {
      prefix = item.SortName || item.Name;
      if (prefix) {
        prefix = prefix[0];
      }
    }
    if (!prefix) {
      return;
    }
    var buttonMap = ensureButtonMap(this);
    var button = buttonMap[prefix];
    setCurrentButton(this, button);
  };
  AlphaPicker.prototype.on = function (name, fn) {
    var element = this.options.element;
    element.addEventListener(name, fn);
  };
  AlphaPicker.prototype.off = function (name, fn) {
    var element = this.options.element;
    element.removeEventListener(name, fn);
  };
  AlphaPicker.prototype.visible = function (visible) {
    var element = this.options.element;
    element.style.visibility = visible ? 'visible' : 'hidden';
  };
  AlphaPicker.prototype.setPrefixes = function (prefixes) {
    if (prefixes.length > 27) {
      prefixes.length = 27;
    }
    var element = this.options.element;
    var vertical = element.classList.contains('alphaPicker-vertical');
    var html = mapLettersToHtml(prefixes, vertical).join('');
    element.querySelector('.alphaPickerRow').innerHTML = html;
    this._buttonMap = null;
  };
  AlphaPicker.prototype.values = function () {
    var element = this.options.element;
    var elems = element.querySelectorAll('.alphaPickerButton');
    var values = [];
    for (var i = 0, length = elems.length; i < length; i++) {
      values.push(elems[i].getAttribute('data-value'));
    }
    return values;
  };
  AlphaPicker.prototype.focus = function () {
    var element = this.options.element;
    _focusmanager.default.autoFocus(element);
  };
  AlphaPicker.prototype.destroy = function () {
    this.enabled(false);
    this.itemFocusValue = null;
    this.options = null;
    this.valueChangeEvent = null;
    this.bound_onAlphaPickerInKeyboardModeClick = null;
    this.bound_onAlphaPickerFocusIn = null;
    this.bound_onAlphaPickerClick = null;
    this._currentButton = null;
    this._buttonMap = null;
  };
  var _default = _exports.default = AlphaPicker;
});
