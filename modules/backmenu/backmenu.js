define(["exports", "./../emby-apiclient/connectionmanager.js", "./../common/servicelocator.js", "./../layoutmanager.js", "./../common/globalize.js", "./../approuter.js", "./../actionsheet/actionsheet.js", "./../common/itemmanager/itemmanager.js"], function (_exports, _connectionmanager, _servicelocator, _layoutmanager, _globalize, _approuter, _actionsheet, _itemmanager) {
  Object.defineProperty(_exports, "__esModule", {
    value: true
  });
  _exports.default = void 0;
  /* jshint module: true */

  function getItems(options, apiClient, user, signedInUsers) {
    var items = [];
    var showExit = _layoutmanager.default.tv && _servicelocator.appHost.supports('exit');
    var exitFirst = options.exitFirst;
    if (showExit && exitFirst) {
      items.push({
        name: _globalize.default.translate('Exit'),
        id: 'exit',
        icon: '&#xe879;'
      });
    }
    if (options.settings !== false) {
      items.push({
        name: _globalize.default.translate('HeaderAppSettings'),
        id: 'settings',
        icon: '&#xe8B8;',
        secondaryText: _servicelocator.appHost.appName() + ' ' + _servicelocator.appHost.appVersion()
      });
      if (user && user.Policy.IsAdministrator) {
        if (_approuter.default.getRouteInfo(_approuter.default.getRouteUrl('manageserver'))) {
          items.push({
            name: _globalize.default.translate('ManageEmbyServer'),
            id: 'manageserver',
            icon: 'dashboard'
          });
        }
      }
    }
    if (_servicelocator.appHost.supports('multiserver')) {
      items.push({
        name: _globalize.default.translate('HeaderChangeServer'),
        id: 'selectserver',
        icon: _itemmanager.default.getDefaultIcon({
          Type: 'Server'
        })
      });
    }
    var userIcon = _itemmanager.default.getDefaultIcon(user);
    if (apiClient && !_connectionmanager.default.isLoggedIntoConnect()) {
      for (var i = 0, length = signedInUsers.length; i < length; i++) {
        var signedInUser = signedInUsers[i];
        if (signedInUser.Id === user.Id) {
          continue;
        }
        items.push({
          name: signedInUser.Name,
          id: 'user-' + signedInUser.Id,
          ImageUrl: signedInUser.PrimaryImageTag ? apiClient.getUserImageUrl(signedInUser.Id, {
            maxWidth: 80,
            type: 'Primary',
            tag: signedInUser.PrimaryImageTag
          }) : null,
          icon: userIcon
        });
      }
      items.push({
        name: _globalize.default.translate('HeaderChangeUser'),
        id: 'changeuser',
        icon: _itemmanager.default.getDefaultIcon({
          Type: 'User'
        })
      });
    }
    items.push({
      name: _globalize.default.translate('HeaderSignOut'),
      id: 'logout',
      icon: '&#xe879;'
    });
    if (showExit && !exitFirst) {
      items.push({
        name: _globalize.default.translate('Exit'),
        id: 'exit',
        icon: '&#xe879;'
      });
    }
    if (_servicelocator.appHost.supports('sleep')) {
      items.push({
        name: _globalize.default.translate('Sleep'),
        id: 'sleep',
        icon: '&#xe426;'
      });
    }
    if (_servicelocator.appHost.supports('shutdown')) {
      items.push({
        name: _globalize.default.translate('Shutdown'),
        id: 'shutdown',
        icon: '&#xe8AC;'
      });
    }
    if (_servicelocator.appHost.supports('restart')) {
      items.push({
        name: _globalize.default.translate('Restart'),
        id: 'restart',
        icon: '&#xe5D5;'
      });
    }
    return items;
  }
  function getCurrentUser(apiClient) {
    if (!apiClient) {
      return Promise.resolve(null);
    }
    return apiClient.getCurrentUser();
  }
  function getSignedInUsers(apiClient) {
    if (!apiClient) {
      return Promise.resolve([]);
    }
    return _connectionmanager.default.getSignedInUsers(apiClient);
  }
  function changeToUser(apiClient, userId) {
    return _approuter.default.changeToUser({
      apiClient: apiClient,
      userId: userId
    }).catch(function (err) {
      var errorName = ((err == null ? void 0 : err.name) || '').toLowerCase();
      switch (errorName) {
        case 'aborterror':
          break;
        default:
          console.error('error changing to user: ', err);
          break;
      }
    });
  }
  function show(options) {
    var apiClient = _connectionmanager.default.currentApiClient();
    return getSignedInUsers(apiClient).then(function (signedInUsers) {
      return getCurrentUser(apiClient).then(function (user) {
        return _actionsheet.default.show({
          items: getItems(options, apiClient, user, signedInUsers),
          positionTo: options.positionTo,
          positionY: options.positionY,
          positionX: options.positionX,
          transformOrigin: options.transformOrigin,
          item: options.showUserInfo === false ? null : user,
          showServerName: true,
          hasItemIcon: true,
          hasItemImage: true,
          roundImage: true,
          fields: ['Name', 'ShortOverview'],
          text: options.text,
          dialogSize: options.positionTo || !_layoutmanager.default.tv ? null : 'fullscreen'
        }).then(function (id) {
          switch (id) {
            case 'logout':
              _approuter.default.logout(apiClient);
              break;
            case 'changeuser':
              _approuter.default.showServerLogin({
                apiClient: apiClient
              });
              break;
            case 'home':
              _approuter.default.goHome();
              break;
            case 'exit':
              _servicelocator.appHost.exit();
              break;
            case 'sleep':
              _servicelocator.appHost.sleep();
              break;
            case 'shutdown':
              _servicelocator.appHost.shutdown();
              break;
            case 'restart':
              _servicelocator.appHost.restart();
              break;
            case 'settings':
              _approuter.default.showSettings();
              break;
            case 'manageserver':
              if (_layoutmanager.default.tv) {
                _approuter.default.showSettings({
                  start: 'server'
                });
              } else {
                _approuter.default.show(_approuter.default.getRouteUrl('manageserver'));
              }
              break;
            case 'selectserver':
              _approuter.default.showSelectServer();
              break;
            default:
              if ((id || '').startsWith('user-')) {
                var userId = id.substring(5);
                changeToUser(apiClient, userId);
              } else {
                return Promise.reject();
              }
              break;
          }
          return Promise.resolve();
        });
      });
    });
  }
  var _default = _exports.default = show;
});
