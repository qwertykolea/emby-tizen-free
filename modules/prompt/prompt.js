define(["exports", "./../layoutmanager.js", "./../common/globalize.js", "./../dialoghelper/dialoghelper.js", "./../emby-elements/emby-button/emby-button.js", "./../emby-elements/emby-input/emby-input.js", "./../emby-elements/emby-scroller/emby-scroller.js", "./../emby-elements/emby-button/paper-icon-button-light.js", "./../emby-elements/emby-dialogclosebutton/emby-dialogclosebutton.js"], function (_exports, _layoutmanager, _globalize, _dialoghelper, _embyButton, _embyInput, _embyScroller, _paperIconButtonLight, _embyDialogclosebutton) {
  Object.defineProperty(_exports, "__esModule", {
    value: true
  });
  _exports.default = _default;
  /* jshint module: true */

  require(['formDialogStyle', 'material-icons']);
  function setInputProperties(dlg, options) {
    var txtInput = dlg.querySelector('.txtInput');
    _embyInput.default.setLabel(txtInput, options.label || '');
    txtInput.value = options.value || '';
  }
  function showDialog(options, template) {
    var dialogOptions = {
      removeOnClose: true,
      scrollY: false,
      autoFocus: true
    };
    if (_layoutmanager.default.tv) {
      dialogOptions.size = 'fullscreen';
    }
    var dlg = _dialoghelper.default.createDialog(dialogOptions);
    dlg.classList.add('formDialog');
    dlg.innerHTML = _globalize.default.translateHtml(template, 'sharedcomponents');
    dlg.querySelector('.formDialogHeaderTitle').innerHTML = options.title || '';
    if (options.description) {
      dlg.querySelector('.fieldDescription').innerHTML = options.description;
    } else {
      dlg.querySelector('.fieldDescription').classList.add('hide');
    }
    setInputProperties(dlg, options);
    var submitValue;
    dlg.querySelector('form').addEventListener('submit', function (e) {
      submitValue = dlg.querySelector('.txtInput').value;
      e.preventDefault();
      e.stopPropagation();

      // Important, don't close the dialog until after the form has completed submitting, or it will cause an error in Chrome
      setTimeout(function () {
        _dialoghelper.default.close(dlg);
      }, 300);
      return false;
    });
    dlg.querySelector('.submitText').innerHTML = options.confirmText || _globalize.default.translate('Submit');
    return _dialoghelper.default.open(dlg).then(function () {
      var value = submitValue;
      if (value) {
        return value;
      } else {
        return Promise.reject();
      }
    });
  }
  function _default(options) {
    return require(['text!modules/prompt/prompt.template.html']).then(function (responses) {
      var template = responses[0];
      if (typeof options === 'string') {
        options = {
          title: '',
          label: options
        };
      }
      return showDialog(options, template);
    });
  }
});
