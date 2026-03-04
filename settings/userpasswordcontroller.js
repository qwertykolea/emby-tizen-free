define(["exports", "./../modules/common/globalize.js", "./../modules/loading/loading.js", "./../modules/focusmanager.js", "./../modules/common/responsehelper.js", "./../modules/emby-elements/emby-button/emby-button.js", "./../modules/emby-elements/emby-button/paper-icon-button-light.js", "./../modules/emby-elements/emby-select/emby-select.js", "./../modules/emby-elements/emby-scroller/emby-scroller.js", "./../modules/emby-elements/emby-itemscontainer/emby-itemscontainer.js"], function (_exports, _globalize, _loading, _focusmanager, _responsehelper, _embyButton, _paperIconButtonLight, _embySelect, _embyScroller, _embyItemscontainer) {
  Object.defineProperty(_exports, "__esModule", {
    value: true
  });
  _exports.default = void 0;
  /* jshint module: true */

  function showAlert(options) {
    return Emby.importModule('./modules/common/dialogs/alert.js').then(function (alert) {
      return alert(options);
    });
  }
  function showConfirm(options) {
    return Emby.importModule('./modules/common/dialogs/confirm.js').then(function (confirm) {
      return confirm(options);
    });
  }
  function showToast(options) {
    return Emby.importModule('./modules/toast/toast.js').then(function (toast) {
      return toast(options);
    });
  }
  function loadUser(page, params, apiClient, autoFocus) {
    var userid = params.userId;
    apiClient.getUser(userid, false).then(function (user) {
      apiClient.getCurrentUser().then(function (loggedInUser) {
        var btnResetPassword = page.querySelector('.btnResetPassword');
        var showPasswordSection = true;
        var showLocalAccessSection = false;
        if (user.HasConfiguredPassword) {
          if (user.Policy.IsAdministrator || apiClient.isMinServerVersion('4.8.0.38')) {
            if (btnResetPassword) {
              btnResetPassword.classList.add('hide');
            }
          } else {
            if (btnResetPassword) {
              btnResetPassword.classList.remove('hide');
            }
          }
          if (apiClient.isMinServerVersion('4.8.0.38')) {
            page.querySelector('.fldCurrentPassword').classList.add('hide');
          } else {
            page.querySelector('.fldCurrentPassword').classList.remove('hide');
          }
          showLocalAccessSection = !apiClient.isMinServerVersion('4.8.0.40');
        } else {
          if (btnResetPassword) {
            btnResetPassword.classList.add('hide');
          }
          page.querySelector('.fldCurrentPassword').classList.add('hide');
        }
        if (user.Policy.IsAdministrator && apiClient.isMinServerVersion('4.8.0.38')) {
          page.querySelector('.txtNewPassword').setAttribute('required', 'required');
          page.querySelector('.txtNewPasswordConfirm').setAttribute('required', 'required');
        } else {
          page.querySelector('.txtNewPassword').removeAttribute('required');
          page.querySelector('.txtNewPasswordConfirm').removeAttribute('required');
        }
        if (showPasswordSection && (loggedInUser.Policy.IsAdministrator || user.Policy.EnableUserPreferenceAccess)) {
          page.querySelector('.passwordSection').classList.remove('hide');
          if (user.HasConfiguredPassword && apiClient.isMinServerVersion('4.8.0.48')) {
            page.querySelector('.profilePinForm').classList.remove('hide');
          } else {
            page.querySelector('.profilePinForm').classList.add('hide');
          }
        } else {
          page.querySelector('.passwordSection').classList.add('hide');
          page.querySelector('.profilePinForm').classList.add('hide');
        }
        if (showLocalAccessSection && (loggedInUser.Policy.IsAdministrator || user.Policy.EnableUserPreferenceAccess)) {
          page.querySelector('.localAccessSection').classList.remove('hide');
        } else {
          page.querySelector('.localAccessSection').classList.add('hide');
        }
        var txtEasyPassword = page.querySelector('.txtInNetworkPassword');
        txtEasyPassword.value = '';
        page.querySelector('.txtProfilePin').value = user.Configuration.ProfilePin || '';
        if (user.Configuration.EnableLocalPassword) {
          if (user.HasConfiguredEasyPassword) {
            page.querySelector('.selectInNetworkPasswordMode').value = 'pin';
          } else {
            page.querySelector('.selectInNetworkPasswordMode').value = 'nopassword';
          }
        } else {
          page.querySelector('.selectInNetworkPasswordMode').value = 'password';
        }
        onInNetworkPasswordModeChange.call(page.querySelector('.selectInNetworkPasswordMode'));
        if (autoFocus) {
          _focusmanager.default.autoFocus(page, {
            skipIfNotEnabled: true
          });
        }
      });
    });
    page.querySelector('.txtCurrentPassword').value = '';
    page.querySelector('.txtNewPassword').value = '';
    page.querySelector('.txtNewPasswordConfirm').value = '';
  }
  function onInNetworkPasswordModeChange(e) {
    var form = this.closest('FORM');
    var txtEasyPassword = form.querySelector('.txtInNetworkPassword');
    if (this.value === 'pin') {
      form.querySelector('.fldInNetworkPassword').classList.remove('hide');
      txtEasyPassword.setAttribute('required', 'required');
    } else {
      form.querySelector('.fldInNetworkPassword').classList.add('hide');
      txtEasyPassword.removeAttribute('required');
    }
  }
  function saveProfilePin(instance) {
    var view = instance.view;
    var params = instance.params;
    var apiClient = instance.apiClient;
    var userId = params.userId;
    apiClient.getUser(userId, false).then(function (user) {
      var pin = view.querySelector('.txtProfilePin').value;
      apiClient.updateProfilePin(userId, pin).then(function (response) {
        _loading.default.hide();
        _responsehelper.default.handleConfigurationSavedResponse(response);
        loadUser(view, params, apiClient);
      }, function (err) {
        _loading.default.hide();
        _responsehelper.default.handleErrorResponse(err);
      });
    });
  }
  function savePassword(instance) {
    var view = instance.view;
    var params = instance.params;
    var apiClient = instance.apiClient;
    var userId = params.userId;
    apiClient.getUser(userId, false).then(function (user) {
      var currentPassword = '';

      // Only grab the current password from the field if there is a current password
      // This will prevent grabbing something that might have been incorrectly filled by a password manager
      if (user.HasConfiguredPassword) {
        currentPassword = view.querySelector('.txtCurrentPassword').value;
      }
      var newPassword = view.querySelector('.txtNewPassword').value;
      apiClient.updateUserPassword(userId, currentPassword, newPassword).then(function () {
        _loading.default.hide();
        showToast(_globalize.default.translate('PasswordSaved'));
        loadUser(view, params, apiClient);
      }, function () {
        _loading.default.hide();
        showAlert({
          title: _globalize.default.translate('HeaderSignInError'),
          text: _globalize.default.translate('MessageInvalidUser')
        });
      });
    });
  }
  function onProfilePinFormSubmit(e) {
    var instance = this;
    _loading.default.show();
    saveProfilePin(instance);

    // Disable default form submission
    e.preventDefault();
    return false;
  }
  function onSubmit(e) {
    var form = e.target.closest('form');
    var instance = this;
    if (form.querySelector('.txtNewPassword').value !== form.querySelector('.txtNewPasswordConfirm').value) {
      showAlert(_globalize.default.translate('ErrorMessagePasswordNotMatchConfirm'));
    } else {
      _loading.default.show();
      savePassword(instance);
    }

    // Disable default form submission
    e.preventDefault();
    return false;
  }
  function onLocalAccessSaved(instance) {
    var view = instance.view;
    var params = instance.params;
    var apiClient = instance.apiClient;
    _loading.default.hide();
    _responsehelper.default.handleConfigurationSavedResponse();
    loadUser(view, params, apiClient);
  }
  function onLocalAccessSubmit(e) {
    var instance = this;
    var view = instance.view;
    var params = instance.params;
    var apiClient = instance.apiClient;
    _loading.default.show();
    var userId = params.userId;
    var mode = view.querySelector('.selectInNetworkPasswordMode').value;
    apiClient.getUser(userId, false).then(function (user) {
      user.Configuration.EnableLocalPassword = mode !== 'password';
      apiClient.updateUserConfiguration(user.Id, user.Configuration).then(function () {
        if (mode === 'password') {
          onLocalAccessSaved(instance);
        } else {
          var easyPw = mode === 'nopassword' ? '' : view.querySelector('.txtInNetworkPassword').value;
          apiClient.updateEasyPassword(userId, easyPw).then(function () {
            onLocalAccessSaved(instance);
          });
        }
      });
    });

    // Disable default form submission
    e.preventDefault();
    return false;
  }
  function resetPassword() {
    var instance = this;
    var view = instance.view;
    var params = instance.params;
    var apiClient = instance.apiClient;
    showConfirm(_globalize.default.translate('PasswordResetConfirmation'), _globalize.default.translate('HeaderResetPassword')).then(function () {
      var userId = params.userId;
      _loading.default.show();
      apiClient.resetUserPassword(userId).then(function () {
        _loading.default.hide();
        showAlert({
          text: _globalize.default.translate('PasswordResetComplete'),
          title: _globalize.default.translate('HeaderPasswordReset')
        });
        loadUser(view, params, apiClient);
      });
    });
  }
  function UserPasswordController(view, params, apiClient) {
    this.view = view;
    this.params = params;
    this.apiClient = apiClient;
    view.querySelector('.updatePasswordForm').addEventListener('submit', onSubmit.bind(this));
    view.querySelector('.localAccessForm').addEventListener('submit', onLocalAccessSubmit.bind(this));
    view.querySelector('.selectInNetworkPasswordMode').addEventListener('change', onInNetworkPasswordModeChange);
    view.querySelector('.profilePinForm').addEventListener('submit', onProfilePinFormSubmit.bind(this));
    var btnResetPassword = view.querySelector('.btnResetPassword');
    if (btnResetPassword) {
      btnResetPassword.addEventListener('click', resetPassword.bind(this));
    }
    var btns = view.querySelectorAll('.userEditTabButton');
    for (var i = 0, length = btns.length; i < length; i++) {
      btns[i].href = btns[i].getAttribute('data-href') + '?userId=' + params.userId;
    }
    view.querySelector('.pinFieldDescription').innerHTML = _globalize.default.translate('YourPinMustBe', 4);
  }
  UserPasswordController.prototype.resume = function (options) {
    var view = this.view;
    var params = this.params;
    var apiClient = this.apiClient;
    loadUser(view, params, apiClient, options == null ? void 0 : options.autoFocus);
  };
  UserPasswordController.prototype.pause = function () {};
  UserPasswordController.prototype.destroy = function () {
    this.view = null;
    this.params = null;
    this.apiClient = null;
  };
  var _default = _exports.default = UserPasswordController;
});
