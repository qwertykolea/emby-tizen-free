define(["exports", "./../modules/viewmanager/baseview.js", "./../modules/common/globalize.js", "./../modules/emby-elements/emby-input/emby-input.js", "./../modules/emby-elements/emby-button/emby-button.js", "./../modules/emby-elements/emby-scroller/emby-scroller.js", "./../modules/emby-apiclient/connectionmanager.js", "./../modules/approuter.js", "./../modules/common/servicelocator.js", "./../modules/loading/loading.js"], function (_exports, _baseview, _globalize, _embyInput, _embyButton, _embyScroller, _connectionmanager, _approuter, _servicelocator, _loading) {
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
  function processForgotPasswordResult(result) {
    _loading.default.hide();
    if (result.Action === 'ContactAdmin') {
      showAlert({
        text: _globalize.default.translate('ContactAdminToResetPassword'),
        title: _globalize.default.translate('HeaderForgotPassword')
      });
      return;
    }
    if (result.Action === 'InNetworkRequired') {
      showAlert({
        text: _globalize.default.translate('ForgotPasswordInNetworkRequired'),
        title: _globalize.default.translate('HeaderForgotPassword')
      });
      return;
    }
    if (result.Action === 'PinCode') {
      var msg = _globalize.default.translate('ForgotPasswordFileCreated');
      msg += '<p>';
      msg += result.PinFile;
      msg += '</p>';
      var supportsLinks = _servicelocator.appHost.supports('targetblank') && _servicelocator.appHost.supports('externallinks');
      if (supportsLinks) {
        msg += '<p>';
        msg += '<a href="https://emby.media/support/articles/Server-Data-Folder.html" target="_blank" is="emby-linkbutton" class="button-link">';
        msg += _globalize.default.translate('Help');
        msg += '</a>';
        msg += '</p>';
      }
      showAlert({
        html: msg,
        title: _globalize.default.translate('HeaderForgotPassword'),
        centerText: false
      });
      return;
    }
  }
  function View(view, params) {
    _baseview.default.apply(this, arguments);
    function onSubmit(e) {
      var apiClient = _connectionmanager.default.getApiClient(params.serverId);
      _loading.default.show();
      apiClient.ajax({
        type: 'POST',
        url: apiClient.getUrl('Users/ForgotPassword'),
        dataType: 'json',
        data: {
          EnteredUsername: view.querySelector('.txtName').value
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
