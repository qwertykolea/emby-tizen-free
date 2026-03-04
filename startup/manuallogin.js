define(["exports", "./../modules/viewmanager/baseview.js", "./../modules/loading/loading.js", "./../modules/emby-elements/emby-input/emby-input.js", "./../modules/emby-elements/emby-button/emby-button.js", "./../modules/emby-elements/emby-toggle/emby-toggle.js", "./../modules/emby-elements/emby-scroller/emby-scroller.js", "./../modules/emby-apiclient/connectionmanager.js", "./../modules/approuter.js", "./../modules/focusmanager.js", "./../modules/common/servicelocator.js", "./../modules/common/textencoding.js", "../modules/common/globalize.js"], function (_exports, _baseview, _loading, _embyInput, _embyButton, _embyToggle, _embyScroller, _connectionmanager, _approuter, _focusmanager, _servicelocator, _textencoding, _globalize) {
  Object.defineProperty(_exports, "__esModule", {
    value: true
  });
  _exports.default = void 0;
  /* jshint module: true */

  require(['material-icons']);
  function setDisclaimer(view, apiClient) {
    if (_servicelocator.appHost.supports('multiserver')) {
      return;
    }
    apiClient.getJSON(apiClient.getUrl('Branding/Configuration')).then(function (options) {
      var elem = view.querySelector('.disclaimer');
      if (options.LoginDisclaimer) {
        elem.classList.remove('hide');
      }
      elem.textContent = options.LoginDisclaimer || '';
    });
  }
  function setTitle(instance) {
    var view = instance.view;
    var apiClient = instance.getApiClient();
    var serverName = apiClient.serverName() || '';
    if (_servicelocator.appHost.supports('maskembynameonlogin')) {
      // https://emby.media/community/index.php?/topic/96439-my-emby-server-has-been-flagged-as-a-deceptive-site/page/8/#comment-1365081
      serverName = serverName.replace(/(emby)/ig, 'Media Server').replace(/(Media Server Media Server)/ig, 'Media Server').replace(/(Media Server MediaServer)/ig, 'MediaServer');
    }
    view.querySelector('.viewTitle').innerHTML = serverName ? _globalize.default.translate('SignIntoServerName', _textencoding.default.htmlEncode(serverName)) : _globalize.default.translate('HeaderPleaseSignIn');
  }
  function View(view, params) {
    _baseview.default.apply(this, arguments);
    view.querySelector('.buttonCancel').addEventListener('click', function (e) {
      _approuter.default.back();
    });
    view.querySelector('.btnForgotPassword').addEventListener('click', function (e) {
      _approuter.default.showItem({
        Type: 'ForgotPassword',
        ServerId: params.serverId
      });
    });
    view.querySelector('.btnSelectServer').addEventListener('click', function (e) {
      _approuter.default.showSelectServer();
    });
    view.querySelector('form').addEventListener('submit', function (e) {
      var username = this.querySelector('.txtUserName').value;
      var password = this.querySelector('.txtPassword').value;
      _loading.default.show();
      var serverId = params.serverId;
      _approuter.default.authenticateUser({
        username: username,
        password: password,
        serverId: serverId
      });
      e.preventDefault();
      return false;
    });
    if (_servicelocator.appHost.supports('multiserver')) {
      view.querySelector('.btnSelectServer').classList.remove('hide');
    }
    var apiClient = _connectionmanager.default.getApiClient(params.serverId);
    setDisclaimer(view, apiClient);
    setTitle(this);
  }
  Object.assign(View.prototype, _baseview.default.prototype);
  View.prototype.onResume = function (options) {
    _baseview.default.prototype.onResume.apply(this, arguments);
    setTitle(this);
    var view = this.view;
    var params = this.params;
    _loading.default.hide();
    var txtUserName = view.querySelector('.txtUserName');
    txtUserName.value = params.user || '';
    var txtPassword = view.querySelector('.txtPassword');
    txtPassword.value = '';
    if (params.user) {
      _focusmanager.default.focus(txtPassword);
    } else {
      _focusmanager.default.focus(txtUserName);
    }
  };
  var _default = _exports.default = View;
});
