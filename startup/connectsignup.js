define(["exports", "./../modules/viewmanager/baseview.js", "./../modules/loading/loading.js", "./../modules/emby-elements/emby-input/emby-input.js", "./../modules/emby-elements/emby-button/emby-button.js", "./../modules/emby-elements/emby-select/emby-select.js", "./../modules/emby-elements/emby-scroller/emby-scroller.js", "./../modules/common/globalize.js", "./../modules/emby-apiclient/connectionmanager.js", "./../modules/approuter.js"], function (_exports, _baseview, _loading, _embyInput, _embyButton, _embySelect, _embyScroller, _globalize, _connectionmanager, _approuter) {
  Object.defineProperty(_exports, "__esModule", {
    value: true
  });
  _exports.default = void 0;
  /* jshint module: true */

  require(['material-icons']);
  function showAlert(options) {
    return Emby.importModule('./modules/common/dialogs/alert.js').then(function (alert) {
      return alert(options);
    });
  }
  function submit(view, greResponse) {
    var submitData = {
      email: view.querySelector('.txtSignupEmail', view).value,
      username: view.querySelector('.txtSignupUsername', view).value,
      password: view.querySelector('.txtSignupPassword', view).value,
      passwordConfirm: view.querySelector('.txtSignupPasswordConfirm', view).value
    };
    if (greResponse) {
      submitData.grecaptcha = greResponse;
    }
    _connectionmanager.default.signupForConnect(submitData).then(function (response) {
      _loading.default.hide();
      var msg = response.Validated ? _globalize.default.translate('MessageThankYouForConnectSignUpNoValidation') : _globalize.default.translate('MessageThankYouForConnectSignUp');
      var onAlertDismissed = function () {
        _approuter.default.showConnectLogin();
      };
      showAlert({
        text: msg
      }).then(onAlertDismissed, onAlertDismissed);
    }, function (result) {
      _loading.default.hide();
      if (result.errorCode === 'passwordmatch') {
        showAlert({
          text: _globalize.default.translate('ErrorMessagePasswordNotMatchConfirm')
        });
      } else if (result.errorCode === 'USERNAME_IN_USE') {
        showAlert({
          text: _globalize.default.translate('ErrorMessageUsernameInUse')
        });
      } else if (result.errorCode === 'EMAIL_IN_USE') {
        showAlert({
          text: _globalize.default.translate('ErrorMessageEmailInUse')
        });
      } else {
        showAlert({
          text: _globalize.default.translate('DefaultErrorMessage')
        });
      }
    });
  }
  function enableRecaptcha() {
    return window.location.href.toLowerCase().indexOf('https://') === 0;
  }
  function View(view, params) {
    _baseview.default.apply(this, arguments);
    var greWidgetId;
    function initSignup() {
      if (enableRecaptcha()) {
        require(['https://www.google.com/recaptcha/api.js?render=explicit'], function () {
          setTimeout(function () {
            var recaptchaContainer = view.querySelector('.recaptchaContainer');
            greWidgetId = grecaptcha.render(recaptchaContainer, {
              'sitekey': '6Le2LAgTAAAAAK06Wvttt_yUnbISTy6q3Azqp9po',
              'theme': 'dark'
            });
          }, 100);
        });
      }
    }
    view.querySelector('.btnCancelSignup').addEventListener('click', function () {
      _approuter.default.back();
    });
    view.querySelector('form').addEventListener('submit', function (e) {
      _loading.default.show();
      var greResponse = greWidgetId ? grecaptcha.getResponse(greWidgetId) : null;
      submit(view, greResponse);
      e.preventDefault();
      e.stopPropagation();
      return false;
    });
    initSignup();
  }
  Object.assign(View.prototype, _baseview.default.prototype);
  var _default = _exports.default = View;
});
