define(["exports", "./../layoutmanager.js", "./../common/globalize.js", "./../common/textencoding.js", "./../dialoghelper/dialoghelper.js", "./../focusmanager.js", "./../dom.js", "./../alphapicker/alphapicker.js", "./../cardbuilder/cardbuilder.js", "./../input/keyboard.js", "./../emby-elements/emby-button/emby-button.js", "./../emby-elements/emby-input/emby-input.js", "./../emby-elements/emby-scroller/emby-scroller.js", "./../emby-elements/emby-button/paper-icon-button-light.js", "./../emby-elements/emby-dialogclosebutton/emby-dialogclosebutton.js"], function (_exports, _layoutmanager, _globalize, _textencoding, _dialoghelper, _focusmanager, _dom, _alphapicker, _cardbuilder, _keyboard, _embyButton, _embyInput, _embyScroller, _paperIconButtonLight, _embyDialogclosebutton) {
  Object.defineProperty(_exports, "__esModule", {
    value: true
  });
  _exports.default = void 0;
  /* jshint module: true */

  require(['formDialogStyle', 'material-icons', 'css!modules/profilepinprompt/profilepinprompt.css']);
  function getImageItems() {
    var item = this.options.user;
    var items = [];
    if (item) {
      items.push(item);
    }
    return Promise.resolve({
      Items: items,
      TotalRecordCount: items.length
    });
  }
  function getImageContainerListOptionsFn() {
    return function (items) {
      return {
        renderer: _cardbuilder.default,
        options: {
          overlayText: true,
          fields: [],
          action: 'none',
          multiSelect: false,
          contextMenu: false,
          ratingButton: false,
          playedButton: false,
          defaultIcon: true,
          typeIndicator: false,
          playedIndicator: false,
          syncIndicator: false,
          timerIndicator: false,
          randomDefaultBackground: false,
          staticElement: true,
          enableUserData: false,
          draggable: false,
          // prevents touchzoom
          moreButton: false,
          programIndicators: false,
          keepImageAnimation: true,
          cardClass: 'profilePinImageCard',
          cardBoxClass: 'profilePinImageCardBox',
          round: true,
          playQueueIndicator: false
        },
        virtualScrollLayout: 'vertical-grid'
      };
    };
  }
  function initUserImage(instance) {
    var itemsContainer = instance.dlg.querySelector('.profilePinImageContainer');
    itemsContainer.fetchData = getImageItems.bind(instance);
    itemsContainer.getListOptions = getImageContainerListOptionsFn();
  }
  function moveFocusToTextInput(txt) {
    _focusmanager.default.focus(txt, {});
    txt.select();
  }
  function onFormKeyDown(e) {
    var input = e.target.closest('.txtProfilePinInput');
    if (!input) {
      return;
    }
    var key = _keyboard.default.normalizeKeyFromEvent(e);
    if (key === 'Backspace') {
      if (input.value === '') {
        var form = input.closest('form');
        var inputs = form.querySelectorAll('.txtProfilePinInput');
        var index = Array.prototype.indexOf.call(inputs, input);
        if (index > 0) {
          var previousInput = inputs[index - 1];
          moveFocusToTextInput(previousInput);
        }
      }
    }
  }
  function onFormInput(e) {
    var input = e.target.closest('.txtProfilePinInput');
    if (!input) {
      return;
    }
    if (input.value.length > 1) {
      input.value = input.value.slice(0, 1);
    }
    var form = input.closest('form');
    var inputs = form.querySelectorAll('.txtProfilePinInput');
    var index = Array.prototype.indexOf.call(inputs, input);
    if (input.value !== '') {
      if (index < inputs.length - 1) {
        if (!_layoutmanager.default.tv) {
          var nextInput = inputs[index + 1];
          moveFocusToTextInput(nextInput);
        }
      } else {
        form.requestSubmit();
      }
    }
  }
  function onFormSubmit(e) {
    e.preventDefault();
    e.stopPropagation();
    var instance = this;
    var dlg = instance.dlg;

    // Important, don't close the dialog until after the form has completed submitting, or it will cause an error in Chrome
    var pinValidated = this.getCurrentPinValue() === this.options.user.Configuration.ProfilePin;
    var inputContainer = dlg.querySelector('.profilePinPromptInputContainer');
    inputContainer.classList.remove('profilePinPromptInputContainer-invalid');
    void inputContainer.offsetWidth;
    if (pinValidated) {
      this.pinResult = 'validated';
      dlg.querySelector('.invalidHeader').classList.add('hide');
      dlg.querySelector('.mainHeader').classList.remove('hide');
    } else {
      inputContainer.classList.add('profilePinPromptInputContainer-invalid');
      this.pinResult = null;
      dlg.querySelector('.mainHeader').classList.add('hide');
      dlg.querySelector('.invalidHeader').classList.remove('hide');
      return;
    }
    setTimeout(function () {
      _dialoghelper.default.close(dlg);
    }, 100);
  }
  function onDialogClick(e) {
    var instance = this;
    var dlg = instance.dlg;
    var btnCloseWithResult = e.target.closest('.btnCloseWithResult');
    if (btnCloseWithResult && btnCloseWithResult.href && !btnCloseWithResult.getAttribute('target')) {
      e.stopPropagation();
      e.preventDefault();
      instance.pinResult = btnCloseWithResult.getAttribute('data-result');
      _dialoghelper.default.close(dlg);
      return;
    }
  }
  function dispatchInput(txt) {
    txt.dispatchEvent(new CustomEvent('input', {
      bubbles: true
    }));
  }
  function onAlphaValueClicked(e) {
    var value = e.detail.value;
    var instance = this;
    var txtFields = instance.dlg.querySelectorAll('.txtProfilePinInput');
    if (value === 'backspace') {
      for (var i = txtFields.length - 1; i >= 0; i--) {
        if (txtFields[i].value !== '') {
          txtFields[i].value = '';
          dispatchInput(txtFields[i]);
          break;
        }
      }
    } else {
      for (var _i = 0, length = txtFields.length; _i < length; _i++) {
        if (txtFields[_i].value === '') {
          txtFields[_i].value = value;
          dispatchInput(txtFields[_i]);
          break;
        }
      }
    }
  }
  function initAlphaPicker(alphaPickerElement, instance) {
    instance.alphaPicker = new _alphapicker.default({
      element: alphaPickerElement,
      mode: 'keyboard',
      type: 'numeric'
    });
    alphaPickerElement.addEventListener('alphavalueclicked', onAlphaValueClicked.bind(instance));
  }
  function onItemsContainerUpgraded() {
    this.resume({
      refresh: true
    });
  }
  function getError(name, message) {
    var err = new Error(message);
    err.name = name;
    return err;
  }
  function dispatchInputAfterTimeout(field) {
    setTimeout(function () {
      dispatchInput(field);
    }, 10);
  }
  function onDialogKeyDown(e) {
    var target = e.target;
    if (target.closest('input')) {
      return;
    }
    var key = _keyboard.default.normalizeKeyFromEvent(e);
    if (!key) {
      return;
    }
    var value = parseInt(key);
    if (value == null || isNaN(value)) {
      return;
    }
    var form = target.closest('form');
    var txtFields = form.querySelectorAll('.txtProfilePinInput');
    for (var i = 0, length = txtFields.length; i < length; i++) {
      var field = txtFields[i];
      if (!field.value) {
        field.value = value;
        // delay this otherwise the next focused field also ends up getting the value
        dispatchInputAfterTimeout(field);
        break;
      }
    }
  }
  function showDialog(instance, options, template) {
    var dialogOptions = {
      removeOnClose: true,
      scrollY: false,
      autoFocus: true
    };
    if (_layoutmanager.default.tv) {
      dialogOptions.size = 'fullscreen';
    }

    //dialogOptions.size = 'fullscreen';

    var dlg = _dialoghelper.default.createDialog(dialogOptions);
    dlg.classList.add('formDialog');
    dlg.innerHTML = _globalize.default.translateHtml(template);
    dlg.querySelector('.pinMustBe').innerHTML = _globalize.default.translate('YourPinMustBe', 4);
    if (_layoutmanager.default.tv) {
      var txtFields = dlg.querySelectorAll('.txtProfilePinInput');

      // try to prevent tv devices from showing their native keyboards
      for (var i = 0, length = txtFields.length; i < length; i++) {
        txtFields[i].setAttribute('readonly', 'readonly');
      }
      for (var _i2 = 0, _length = txtFields.length; _i2 < _length; _i2++) {
        txtFields[_i2].setAttribute('virtualkeyboardpolicy', 'manual');
        txtFields[_i2].setAttribute('inputmode', 'none');

        // don't let them get autofocused
        txtFields[_i2].setAttribute('tabindex', '-1');
      }
      var alphaPickerElement = dlg.querySelector('.alphaPicker');
      dlg.querySelector('.alphaPicker').classList.remove('hide');
      initAlphaPicker(alphaPickerElement, instance);
    } else {
      dlg.querySelector('.profilePinScroller').classList.add('profilePinScroller-autoabsolute');
    }
    dlg.querySelector('.profilePinPromptInputContainer').addEventListener('input', onFormInput);
    dlg.querySelector('.profilePinPromptInputContainer').addEventListener('keydown', onFormKeyDown);
    _dom.default.addEventListener(dlg, 'click', onDialogClick.bind(instance), {
      capture: true
    });
    dlg.querySelector('form').addEventListener('submit', onFormSubmit.bind(instance));
    instance.dlg = dlg;
    dlg.querySelector('.username').innerHTML = _textencoding.default.htmlEncode(options.user.Name);
    initUserImage(instance);
    var itemsContainer = dlg.querySelector('.profilePinImageContainer');
    itemsContainer.waitForCustomElementUpgrade().then(onItemsContainerUpgraded.bind(itemsContainer));
    dlg.addEventListener('keydown', onDialogKeyDown.bind(instance));
    return _dialoghelper.default.open(dlg).then(function () {
      var pinResult = instance.pinResult;
      instance.destroy();
      if (pinResult === 'validated') {
        return Promise.resolve();
      } else if (pinResult) {
        return Promise.reject(getError(pinResult, 'AbortError'));
      } else {
        return Promise.reject(getError('AbortError', 'AbortError'));
      }
    });
  }
  function PinPrompt() {}
  PinPrompt.prototype.getCurrentPinValue = function () {
    var value = '';
    var txtFields = this.dlg.querySelectorAll('.txtProfilePinInput');
    for (var i = 0, length = txtFields.length; i < length; i++) {
      var val = txtFields[i].value;
      if (val === '') {
        break;
      }
      value += val;
    }
    return value;
  };
  PinPrompt.prototype.show = function (options) {
    var instance = this;
    instance.options = options;
    return require(['text!modules/profilepinprompt/profilepinprompt.template.html']).then(function (responses) {
      var template = responses[0];
      return showDialog(instance, options, template);
    });
  };
  PinPrompt.prototype.destroy = function () {
    var alphaPicker = this.alphaPicker;
    if (alphaPicker) {
      alphaPicker.destroy();
    }
    this.alphaPicker = null;
    this.dlg = null;
    this.pinValidated = null;
    this.options = null;
  };
  var _default = _exports.default = PinPrompt;
});
