define(["exports", "./../dialoghelper/dialoghelper.js", "./../layoutmanager.js", "./../common/globalize.js", "./../emby-elements/emby-input/emby-input.js", "./../emby-elements/emby-select/emby-select.js", "./../emby-elements/emby-button/emby-button.js", "./../emby-elements/emby-button/paper-icon-button-light.js", "./../emby-elements/emby-scroller/emby-scroller.js", "./../emby-elements/emby-dialogclosebutton/emby-dialogclosebutton.js"], function (_exports, _dialoghelper, _layoutmanager, _globalize, _embyInput, _embySelect, _embyButton, _paperIconButtonLight, _embyScroller, _embyDialogclosebutton) {
  Object.defineProperty(_exports, "__esModule", {
    value: true
  });
  _exports.default = void 0;
  /* jshint module: true */

  require(['formDialogStyle']);
  function show(person) {
    return require(['text!modules/metadataeditor/personeditor.template.html']).then(function (responses) {
      var template = responses[0];
      var dialogOptions = {
        removeOnClose: true,
        scrollY: false
      };
      if (_layoutmanager.default.tv) {
        dialogOptions.size = 'fullscreen';
      } else {
        dialogOptions.size = 'medium-tall';
      }
      var dlg = _dialoghelper.default.createDialog(dialogOptions);
      dlg.classList.add('formDialog');
      var html = '';
      var submitted = false;
      html += _globalize.default.translateDocument(template, 'sharedcomponents');
      dlg.innerHTML = html;
      if (person.Name) {
        dlg.querySelector('.formDialogHeaderTitle').innerHTML = _globalize.default.translate('Edit');
      } else {
        dlg.querySelector('.formDialogHeaderTitle').innerHTML = _globalize.default.translate('Add');
      }
      dlg.querySelector('.txtPersonName', dlg).value = person.Name || '';
      dlg.querySelector('.selectPersonType', dlg).value = person.Type || '';
      dlg.querySelector('.txtPersonRole', dlg).value = person.Role || '';
      dlg.querySelector('.selectPersonType').addEventListener('change', function (e) {
        var currentValue = this.value;
        if (currentValue === 'Actor' || currentValue === 'GuestStar') {
          dlg.querySelector('.fldRole').classList.remove('hide');
        } else {
          dlg.querySelector('.fldRole').classList.add('hide');
        }
      });
      dlg.querySelector('form').addEventListener('submit', function (e) {
        submitted = true;
        person.Name = dlg.querySelector('.txtPersonName', dlg).value;
        person.Type = dlg.querySelector('.selectPersonType', dlg).value;
        person.Role = dlg.querySelector('.txtPersonRole', dlg).value || null;
        _dialoghelper.default.close(dlg);
        e.preventDefault();
        return false;
      });
      dlg.querySelector('.selectPersonType').dispatchEvent(new CustomEvent('change', {
        bubbles: true
      }));
      return _dialoghelper.default.open(dlg).then(function () {
        if (submitted) {
          return Promise.resolve(person);
        } else {
          return Promise.reject();
        }
      });
    });
  }
  var _default = _exports.default = {
    show: show
  };
});
