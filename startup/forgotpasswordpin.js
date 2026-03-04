define(["exports", "./../modules/viewmanager/baseview.js", "./../modules/common/globalize.js", "./../modules/emby-elements/emby-input/emby-input.js", "./../modules/emby-elements/emby-button/emby-button.js", "./../modules/emby-elements/emby-select/emby-select.js", "./../modules/emby-elements/emby-scroller/emby-scroller.js", "./../modules/emby-apiclient/connectionmanager.js", "./../modules/approuter.js"], function (_exports, _baseview, _globalize, _embyInput, _embyButton, _embySelect, _embyScroller, _connectionmanager, _approuter) {
  Object.defineProperty(_exports, "__esModule", {
    value: true
  });
  _exports.default = void 0;
  /* jshint module: true */

  function onBackClick() {
    _approuter.default.back();
  }
  function showAlert(options) {
    return Emby.importModule('./modules/common/dialogs/alert.js').then(function (alert) {
      return alert(options);
    });
  }
  function onPasswordReset() {
    _approuter.default.beginConnectionWizard();
  }
  function processForgotPasswordResult(result) {
    if (!result.UsersReset.length) {
      showAlert({
        text: _globalize.default.translate('ForgotPasswordNoUserFound'),
        title: _globalize.default.translate('HeaderPasswordReset')
      });
      return;
    }
    if (result.Success) {
      var msg = _globalize.default.translate('PasswordResetForUsers');
      msg += '<br/>';
      msg += '<br/>';
      msg += result.UsersReset.join('<br/>');
      showAlert({
        html: msg,
        title: _globalize.default.translate('HeaderPasswordReset')
      }).then(onPasswordReset);
      return;
    }
    showAlert({
      text: _globalize.default.translate('InvalidForgotPasswordPin'),
      title: _globalize.default.translate('HeaderPasswordReset')
    });
    return;
  }
  function View(view, params) {
    _baseview.default.apply(this, arguments);
    function onSubmit(e) {
      var apiClient = _connectionmanager.default.currentApiClient();
      apiClient.ajax({
        type: 'POST',
        url: apiClient.getUrl('Users/ForgotPassword/Pin'),
        dataType: 'json',
        data: {
          Pin: view.querySelector('.txtPin').value
        }
      }).then(processForgotPasswordResult);
      e.preventDefault();
      return false;
    }
    view.querySelector('.btnCancel').addEventListener("click", onBackClick);
    view.querySelector('form').addEventListener('submit', onSubmit);
  }
  Object.assign(View.prototype, _baseview.default.prototype);
  var _default = _exports.default = View;
});
