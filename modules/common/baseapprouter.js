define(["exports", "./../emby-apiclient/connectionmanager.js", "./../emby-apiclient/events.js", "./../loading/loading.js", "./globalize.js", "./textencoding.js", "./responsehelper.js", "./servicelocator.js", "./appsettings.js", "./../layoutmanager.js"], function (_exports, _connectionmanager, _events, _loading, _globalize, _textencoding, _responsehelper, _servicelocator, _appsettings, _layoutmanager) {
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
  function loadPlaybackManager() {
    return Emby.importModule('./modules/common/playback/playbackmanager.js');
  }
  function showAlertAndResolve(options) {
    return showAlert(options).catch(function () {
      return Promise.resolve();
    });
  }
  function showConfirm(options) {
    return Emby.importModule('./modules/common/dialogs/confirm.js').then(function (confirm) {
      return confirm(options);
    });
  }
  function showServerUpdateNeededAlert(instance) {
    var text = _globalize.default.translate('ServerUpdateNeeded', 'https://emby.media');
    var html;
    if (_servicelocator.appHost.supports('externallinks') && _servicelocator.appHost.supports('targetblank') && _servicelocator.appHost.supports('externalappinfo')) {
      html = _globalize.default.translate('ServerUpdateNeeded', '<a is="emby-linkbutton" class="button-link" href="https://emby.media">https://emby.media</a>');
    }
    return showAlertAndResolve({
      html: html,
      text: text
    }).then(function () {
      return instance.showSelectServer();
    });
  }
  function BaseAppRouter() {}
  BaseAppRouter.prototype.setPinValidated = function (userId) {
    this._pinValidated = userId;
  };
  BaseAppRouter.prototype.isPinValidated = function (userId) {
    return this._pinValidated === userId;
  };
  function showServerLoginFromUserId(instance, options) {
    var userId = options.userId;
    if (!userId) {
      return Promise.reject();
    }
    var apiClient = options.apiClient;
    return apiClient.getUser(userId).then(function (user) {
      if (user.HasPassword) {
        return instance.showServerLogin({
          apiClient: apiClient,
          username: user.Name,
          loginType: 'manual'
        });
      } else {
        return instance.authenticateUser({
          serverId: user.ServerId,
          username: user.Name
        });

        //    return instance.showServerLogin({
        //        apiClient: apiClient
        //    });
      }
    });
  }
  BaseAppRouter.prototype.showServerLogin = function (options) {
    var instance = this;
    return showServerLoginFromUserId(this, options).catch(function () {
      var apiClient = options.apiClient;
      console.log('appRouter - showServerLogin: ' + apiClient.serverId());
      return apiClient.getPublicUsersQueryResult({
        Limit: 0
      }).then(function (result) {
        if (result.TotalRecordCount) {
          options.loginType = 'visual';
          return instance.showServerLogin(options);
        } else {
          options.loginType = 'manual';
          return instance.showServerLogin(options);
        }
      });
    });
  };
  BaseAppRouter.prototype.showEnableProfilePinPrompt = function (options) {
    var user = options.user;
    return showConfirm({
      title: _globalize.default.translate('TitleProfilePin'),
      cancelText: _globalize.default.translate('No'),
      confirmText: _globalize.default.translate('Yes'),
      text: _globalize.default.translate('RequireEnteringPinToReturnQuestion')
    }).then(function () {
      _appsettings.default.enableProfilePin(user.Id, true);
    }, function () {
      _appsettings.default.enableProfilePin(user.Id, false);
    });
  };
  function catchToResolve(err) {
    return Promise.resolve();
  }
  BaseAppRouter.prototype.authenticateUser = function (options) {
    _loading.default.show();
    var instance = this;
    var apiClient = _connectionmanager.default.getApiClient(options.serverId);
    return loadPlaybackManagerAndStopPlaying(true).then(function () {
      return apiClient.authenticateUserByName(options.username, options.password).then(function (result) {
        instance.setPinValidated(result.User.Id);
        var profilePinPromise;
        if (_appsettings.default.autoLogin() !== 'none' && result.User.Configuration.ProfilePin) {
          _loading.default.hide();
          profilePinPromise = instance.showEnableProfilePinPrompt({
            apiClient: apiClient,
            user: result.User
          }).catch(catchToResolve);
        } else {
          if (result.User.Configuration.ProfilePin) {
            _appsettings.default.enableProfilePin(result.User.Id, true);
          } else {
            _appsettings.default.enableProfilePin(result.User.Id, false);
          }
          profilePinPromise = Promise.resolve();
        }
        return profilePinPromise.then(function () {
          return instance.handleConnectionResult({
            State: 'SignedIn',
            ApiClient: apiClient
          }, {
            enableProfilePin: false
          });
        });
      }, function (result) {
        if (apiClient.isMinServerVersion('4.8.4')) {
          result.errorTitle = _globalize.default.translate('HeaderSignInError');
          _responsehelper.default.handleErrorResponse(result);
          return;
        }
        _loading.default.hide();
        showAlert({
          text: _globalize.default.translate('MessageInvalidUser'),
          title: _globalize.default.translate('HeaderSignInError')
        });

        //return Promise.reject(result);
      });
    });
  };
  BaseAppRouter.prototype.showConnectionErrorAlert = function (result, options) {
    var _result$Server;
    var serverName = (_result$Server = result.Server) == null ? void 0 : _result$Server.Name;
    return showAlertAndResolve({
      text: result.ErrorMessage || _globalize.default.translate("MessageUnableToConnectToServer"),
      title: serverName ? _globalize.default.translate("TitleUnableToReachName", _textencoding.default.htmlEncode(serverName)) : _globalize.default.translate("TitleUnableToReachServer")
    });
  };
  function enableWelcome(result, options, checkServers) {
    if (!(options != null && options.allowWelcome)) {
      return false;
    }
    if (!_servicelocator.appHost.supports('multiserver')) {
      return false;
    }
    if (checkServers) {
      var _result$Servers;
      if (!((_result$Servers = result.Servers) != null && _result$Servers.length)) {
        return true;
      }
    }
    var welcomeKey = 'welcome_seen';
    if (_appsettings.default.get(welcomeKey) !== '1') {
      _appsettings.default.set(welcomeKey, '1');
      return true;
    }
    return false;
  }
  BaseAppRouter.prototype.handleConnectionResult = function (result, options) {
    var instance = this;
    console.log('handleConnectionResult: ' + (result.State || ''));
    switch (result.State) {
      case 'SignedIn':
        {
          if (!this.isPinValidated(result.ApiClient.getCurrentUserId())) {
            this.setPinValidated(null);
          }
          instance.handleSignedInResult(result, options);
        }
        break;
      case 'ServerSignIn':
        {
          if (enableWelcome(result, options, true)) {
            instance.showWelcome();
          } else {
            instance.showServerLogin({
              apiClient: result.ApiClient
            });
          }
        }
        break;
      case 'ServerSelection':
        {
          if (_servicelocator.appHost.supports('multiserver')) {
            if (enableWelcome(result, options, false)) {
              instance.showWelcome();
            } else {
              instance.showSelectServer();
            }
          } else {
            instance.showServerLogin({
              apiClient: _connectionmanager.default.currentApiClient()
            });
          }
        }
        break;
      case 'ConnectSignIn':
        {
          if ((options == null ? void 0 : options.allowWelcome) === true) {
            instance.showWelcome();
          } else {
            instance.showConnectLogin();
          }
        }
        break;
      case 'ServerUpdateNeeded':
        {
          if ((options == null ? void 0 : options.allowServerUpdateNeedAlert) === false) {
            instance.showSelectServer();
          } else {
            _loading.default.hide();
            showServerUpdateNeededAlert(instance);
          }
        }
        break;
      case 'Unavailable':
        {
          _loading.default.hide();
          instance.showConnectionErrorAlert(result, options);
        }
        break;
      default:
        break;
    }
  };
  function showProfilePinPrompt(instance, apiClient, user) {
    _loading.default.hide();
    return instance.showProfilePinPrompt({
      apiClient: apiClient,
      user: user
    }).then(function (result) {
      instance.setPinValidated(user.Id);
      return Promise.resolve(result);
    });
  }
  BaseAppRouter.prototype.promptForProfilePin = function (apiClient, userId, forceShow) {
    var instance = this;
    if (_connectionmanager.default.isLoggedIntoConnect()) {
      return Promise.resolve();
    }
    if (!_appsettings.default.enableProfilePin(userId)) {
      return Promise.resolve();
    }
    if (this.isPinValidated(userId) && !forceShow) {
      return Promise.resolve();
    }
    return apiClient.getUser(userId).then(function (user) {
      if (!user.Configuration.ProfilePin) {
        return Promise.resolve();
      }
      return showProfilePinPrompt(instance, apiClient, user);
    });
  };
  function onChangeToUserErrorPublic(err) {
    _loading.default.hide();
    return Promise.reject(err);
  }
  function onChangeToUserError(err) {
    _loading.default.hide();
    var errorName = ((err == null ? void 0 : err.name) || '').toLowerCase();
    var info = this;
    var instance = info.instance;
    var options = info.options;
    var apiClient = options.apiClient;
    var userId = options.userId;
    switch (errorName) {
      case 'forgotpin':
        return apiClient.getUser(userId).then(function (user) {
          if (user.HasPassword) {
            instance.showServerLogin({
              apiClient: apiClient,
              username: user.Name,
              loginType: 'manual'
            });
          } else {
            instance.showServerLogin({
              apiClient: apiClient
            });
          }
        });
      default:
        return Promise.reject(err);
    }
  }
  BaseAppRouter.prototype.forgotPin = function (options) {
    return this.showServerLogin(options);
  };
  function stopPlaying(playbackManager, forceStopAll) {
    if (forceStopAll || !playbackManager.isPlayingAudio()) {
      playbackManager.stop();
    }
    return Promise.resolve();
  }
  function loadPlaybackManagerAndStopPlaying(forceStopAll) {
    return loadPlaybackManager().then(function (playbackManager) {
      return stopPlaying(playbackManager, forceStopAll);
    });
  }
  BaseAppRouter.prototype.changeToUser = function (options) {
    var apiClient = options.apiClient;
    var userId = options.userId;
    var serverId = apiClient.serverId();
    _loading.default.show();
    var instance = this;
    var boundOnError = onChangeToUserError.bind({
      instance: instance,
      options: options
    });
    return _connectionmanager.default.validateCanChangeToUser(apiClient, userId).then(function () {
      return instance.promptForProfilePin(apiClient, userId, options.forceShowProfilePinPrompt).then(function () {
        var stopPlayingPromise = apiClient.getCurrentUserId() === userId ? Promise.resolve() : loadPlaybackManagerAndStopPlaying(true);
        return stopPlayingPromise.then(function () {
          return _connectionmanager.default.changeToUser(apiClient, userId).then(function () {
            var server = _connectionmanager.default.getSavedServers().filter(function (s) {
              return s.Id === serverId;
            })[0];
            if (server) {
              return _connectionmanager.default.connectToServer(server, {
                userId: userId,
                autoLogin: 'lastuser'
              }).then(function (result) {
                _loading.default.hide();
                switch (result.State) {
                  case 'SignedIn':
                  case 'ServerUpdateNeeded':
                    {
                      instance.handleConnectionResult(result, {
                        // we've already done this here
                        enableProfilePin: false
                      });
                      return Promise.resolve();
                    }
                  default:
                    return Promise.reject(result);
                }
              });
            }
            return Promise.reject('server not found');
          }, boundOnError);
        }, boundOnError);
      }, boundOnError);
    }, onChangeToUserErrorPublic);
  };
  BaseAppRouter.prototype.isDisplayingAuthenticatedContent = function () {
    return true;
  };
  function showServerLoginOnAppResume(instance, apiClient) {
    return loadPlaybackManager().then(function (playbackManager) {
      if (playbackManager.isPictureInPictureEnabled()) {
        return Promise.resolve();
      }
      return stopPlaying(playbackManager, true).then(function () {
        return instance.showServerLogin({
          apiClient: apiClient
        });
      });
    });
  }
  function changeToUserOnAppResume(instance, apiClient, userId) {
    return loadPlaybackManager().then(function (playbackManager) {
      if (playbackManager.isPictureInPictureEnabled()) {
        return Promise.resolve();
      }
      var stopPlayingPromise = apiClient.getCurrentUserId() === userId ? Promise.resolve() : stopPlaying(true);
      stopPlayingPromise.then(function () {
        instance.showServerLogin({
          apiClient: apiClient
        }).then(function () {
          instance.changeToUser({
            apiClient: apiClient,
            userId: userId,
            forceShowProfilePinPrompt: true
          });
        });
      });
    });
  }
  var dateAppPaused;
  var isDebug = false;
  var minPauseMsForReLogin = isDebug ? 10000 : 10 * (60 * 1000);
  function onAppPause() {
    dateAppPaused = Date.now();
  }
  function onAppResume() {
    _connectionmanager.default.onAppResume();
    var appRouterInstance = this;
    var timeSincePaused = Date.now() - (dateAppPaused || 0);
    if (timeSincePaused >= minPauseMsForReLogin && dateAppPaused && appRouterInstance.isDisplayingAuthenticatedContent()) {
      var autoLoginMode = _appsettings.default.autoLogin();
      var apiClient = _connectionmanager.default.currentApiClient();
      if (apiClient != null && apiClient.isLoggedIn()) {
        if (autoLoginMode === 'none' || autoLoginMode === 'showlogin') {
          console.log('redirecting back to login on app resume');
          // for now limit this to tv mode while in testing
          if (_layoutmanager.default.tv) {
            showServerLoginOnAppResume(appRouterInstance, apiClient);
          }
        } else if (autoLoginMode === 'lastuser') {
          var userId = apiClient.getCurrentUserId();
          // if the pin is enabled, make them do that again
          // for now limit this to tv mode while in testing
          if (_appsettings.default.enableProfilePin(userId) && _layoutmanager.default.tv) {
            changeToUserOnAppResume(appRouterInstance, apiClient, userId);
          }
        } else {
          // specific user selected
          var parts = autoLoginMode.split('|');
          if (parts.length === 2) {
            var serverId = parts[0];
            var serverApiClient = _connectionmanager.default.getApiClient(serverId);
            if (serverApiClient) {
              changeToUserOnAppResume(appRouterInstance, serverApiClient, parts[1]);
            }
          }
        }
      }
    }
  }
  BaseAppRouter.prototype.start = function (options) {
    _events.default.on(_servicelocator.appHost, 'pause', onAppPause);
    _events.default.on(_servicelocator.appHost, 'resume', onAppResume.bind(this));
  };
  var _default = _exports.default = BaseAppRouter;
});
