define(["exports", "./../dialoghelper/dialoghelper.js", "./../layoutmanager.js", "./../common/globalize.js", "./../common/responsehelper.js", "./../focusmanager.js", "./../emby-elements/emby-dialogclosebutton/emby-dialogclosebutton.js", "./../emby-elements/emby-select/emby-select.js", "./../emby-elements/emby-button/emby-button.js", "./../emby-elements/emby-toggle/emby-toggle.js"], function (_exports, _dialoghelper, _layoutmanager, _globalize, _responsehelper, _focusmanager, _embyDialogclosebutton, _embySelect, _embyButton, _embyToggle) {
  Object.defineProperty(_exports, "__esModule", {
    value: true
  });
  _exports.default = void 0;
  /* jshint module: true */

  require(['flexStyles', 'formDialogStyle', 'material-icons']);
  function CopyUserDataDialog() {}
  function onSubmit(e) {
    e.preventDefault();
    var instance = this;
    var userCopyOptions = [];
    var form = e.target;
    if (form.querySelector('.chkCopyUserPolicy').checked) {
      userCopyOptions.push('UserPolicy');
    }
    if (form.querySelector('.chkCopyUserConfiguration').checked) {
      userCopyOptions.push('UserConfiguration');
    }
    if (form.querySelector('.chkCopyUserData').checked) {
      userCopyOptions.push('UserData');
    }
    return instance.options.apiClient.copyUserDataToUsers({
      userId: instance.options.item.Id,
      ToUserIds: form.querySelector('.selectUsers').getValues(),
      CopyOptions: userCopyOptions
    }).then(function () {
      instance.closeDialog();
    }, _responsehelper.default.handleErrorResponse);
  }
  function onOpened() {
    _focusmanager.default.autoFocus(this, {
      skipIfNotEnabled: true
    });
  }
  function fetchUsers(query) {
    var instance = this;
    query = Object.assign({}, query);
    return instance.options.apiClient.getUsersQueryResult(query);
  }
  CopyUserDataDialog.prototype.show = function (options) {
    this.options = options;
    var instance = this;
    return require(['text!./modules/copyuserdatadialog/copyuserdatadialog.template.html']).then(function (responses) {
      var template = responses[0];
      var dialogOptions = {
        removeOnClose: true,
        scrollY: false,
        autoFocus: false
      };
      if (_layoutmanager.default.tv) {
        dialogOptions.size = 'fullscreen';
      } else {
        dialogOptions.size = 'medium-tall';
      }
      var dlg = _dialoghelper.default.createDialog(dialogOptions);
      instance.context = dlg;
      dlg.classList.add('formDialog');
      dlg.innerHTML = _globalize.default.translateDocument(template, 'sharedcomponents');
      var form = dlg.querySelector('form');
      form.addEventListener('submit', onSubmit.bind(instance));
      dlg.querySelector('.selectUsers').getItems = fetchUsers.bind(instance);
      dlg.addEventListener('opened', onOpened);
      return _dialoghelper.default.open(dlg).catch(function () {
        return Promise.resolve();
      });
    });
  };
  CopyUserDataDialog.prototype.closeDialog = function () {
    _dialoghelper.default.close(this.context);
  };
  CopyUserDataDialog.prototype.pause = function () {};
  CopyUserDataDialog.prototype.destroy = function () {
    this.pause();
    this.options = null;
    this.context = null;
  };
  var _default = _exports.default = CopyUserDataDialog;
});
