define(["exports", "./../modules/viewmanager/baseview.js", "./../modules/loading/loading.js", "./../modules/common/globalize.js", "./../modules/emby-elements/emby-input/emby-input.js", "./../modules/emby-elements/emby-button/emby-button.js", "./../modules/focusmanager.js", "./../modules/emby-apiclient/connectionmanager.js", "./../modules/approuter.js", "./../modules/common/appsettings.js", "./../modules/common/servicelocator.js", "./../modules/layoutmanager.js"], function (_exports, _baseview, _loading, _globalize, _embyInput, _embyButton, _focusmanager, _connectionmanager, _approuter, _appsettings, _servicelocator, _layoutmanager) {
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
  function stopPolling(instance) {
    if (instance.currentInterval) {
      clearInterval(instance.currentInterval);
      instance.currentInterval = null;
    }
  }
  function showPinErrorMessage(instance, key) {
    var pinMessage = instance.view.querySelector('.pinMessage');
    pinMessage.classList.remove('hide');
    pinMessage.innerHTML = _globalize.default.translate('' + key);
  }
  function onPinConfirmed(instance) {
    _loading.default.show();
    _appsettings.default.autoLogin('lastuser');
    _connectionmanager.default.exchangePin(instance.currentPinInfo).then(function () {
      _connectionmanager.default.connect().then(function (result) {
        _loading.default.hide();
        if (result.State === 'ConnectSignIn') {
          _approuter.default.showItem({
            Type: 'AddServer'
          });
        } else {
          _approuter.default.showSelectServer();
        }
      });
    });
  }
  function pollPinStatus() {
    var instance = this;
    if (!instance.currentPinInfo) {
      // This should never happen, but seeing a crash in edge uwp
      return;
    }
    _connectionmanager.default.getPinStatus(instance.currentPinInfo).then(function (pinStatus) {
      if (pinStatus.IsConfirmed) {
        stopPolling(instance);
        onPinConfirmed(instance);
      } else if (pinStatus.IsExpired) {
        stopPolling(instance);
        showPinErrorMessage(instance, 'PinExpiredMessage');
      }
    });
  }
  function startPolling(instance) {
    instance.currentInterval = setInterval(pollPinStatus.bind(instance), 3000);
  }
  function createPin(instance) {
    instance.currentPinInfo = null;
    _loading.default.show();
    var view = instance.view;
    view.querySelector('.pinMessage').classList.add('hide');
    view.querySelector('.pinCodeValue').innerHTML = '&nbsp;';
    stopPolling(instance);
    _connectionmanager.default.createPin(instance).then(function (result) {
      instance.currentPinInfo = result;
      view.querySelector('.pinCodeValue').innerHTML = result.Pin;
      startPolling(instance);
      _loading.default.hide();
    }, function () {
      instance.currentPinInfo = null;
      _loading.default.hide();
      showPinErrorMessage(instance, 'CreatePinErrorMessage');
    });
  }
  function createLinks(instance, view) {
    if (_servicelocator.appHost.supports('externallinks')) {
      view.querySelector('.terms').innerHTML = _globalize.default.translate('EmbyLoginTerms', '<a is="emby-linkbutton" class="lnkTerms button-link" href="https://emby.media/terms" target="_blank">', '</a>');
      view.querySelector('.pinCodeHeader').innerHTML = _globalize.default.translate('ConnectPinCodeHeader', '<a is="emby-linkbutton" class="lnkPinSignIn button-link" href="https://emby.media/pin" target="_blank">https://emby.media/pin</a>');
    } else if (_servicelocator.appHost.supports('externallinkdisplay')) {
      view.querySelector('.terms').innerHTML = _globalize.default.translate('EmbyLoginTerms', '', '');
      view.querySelector('.pinCodeHeader').innerHTML = _globalize.default.translate('ConnectPinCodeHeader', 'https://emby.media/pin');
    } else {
      view.querySelector('.terms').innerHTML = _globalize.default.translate('EmbyLoginTerms', '', '');
      view.querySelector('.pinCodeHeader').innerHTML = _globalize.default.translate('ConnectPinCodeHeader', '');
    }
    if (instance.enablePinLogin) {
      view.querySelector('.pinLogin').classList.remove('hide');
      view.querySelector('.newUsers').classList.add('hide');
      view.querySelector('.manualLoginForm').classList.add('hide');
      createPin(instance);
    } else {
      view.querySelector('.pinLogin').classList.add('hide');
      view.querySelector('.newUsers').classList.remove('hide');
      view.querySelector('.manualLoginForm').classList.remove('hide');
    }
  }
  function ConnectLoginView(view, params) {
    _baseview.default.apply(this, arguments);
    var self = this;

    // We can only use the pin login if external links are allowed
    this.enablePinLogin = _layoutmanager.default.tv && (_servicelocator.appHost.supports('externallinks') || _servicelocator.appHost.supports('externallinkdisplay'));
    view.querySelector('.btnSkipConnect').addEventListener('click', function (e) {
      _loading.default.show();
      _connectionmanager.default.connect({}).then(function (result) {
        _loading.default.hide();
        if (result.State === 'ConnectSignIn') {
          _approuter.default.showItem({
            Type: 'AddServer'
          });
        } else {
          _approuter.default.handleConnectionResult(result);
        }
      });
    });
    view.querySelector('.btnSignup').addEventListener('click', function (e) {
      if (_servicelocator.appHost.supports('connectsignup')) {
        _approuter.default.show('/startup/connectsignup.html');
        e.preventDefault();
        e.stopPropagation();
      }
    });
    view.querySelector('.btnNewPin').addEventListener('click', function () {
      createPin(self);
    });
    view.querySelector('.manualLoginForm').addEventListener('submit', function (e) {
      _loading.default.show();
      _connectionmanager.default.loginToConnect(view.querySelector('.txtUser').value, view.querySelector('.txtPassword').value).then(function () {
        _loading.default.hide();
        _approuter.default.showSelectServer();
      }, function () {
        _loading.default.hide();
        showAlert({
          text: _globalize.default.translate('MessageInvalidUser'),
          title: _globalize.default.translate('HeaderSignInError')
        });
        view.querySelector('.txtUser').value = '';
      });
      e.preventDefault();
      e.stopPropagation();
      return false;
    });
    createLinks(this, this.view);
  }
  Object.assign(ConnectLoginView.prototype, _baseview.default.prototype);
  ConnectLoginView.prototype.onPause = function () {
    _baseview.default.prototype.onPause.apply(this, arguments);
    stopPolling(this);
  };
  ConnectLoginView.prototype.onResume = function (options) {
    _baseview.default.prototype.onResume.apply(this, arguments);
    if (options.refresh) {
      var view = this.view;
      if (this.enablePinLogin) {
        _focusmanager.default.focus(view.querySelector('.btnNewPin'));
      } else {
        this.autoFocus();
      }
    }
  };
  ConnectLoginView.prototype.destroy = function () {
    _baseview.default.prototype.destroy.apply(this, arguments);
    stopPolling(this);
    this.currentPinInfo = null;
  };
  var _default = _exports.default = ConnectLoginView;
});
