define(["./common/globalize.js", "./emby-apiclient/events.js", "./common/input/api.js"], function (_globalize, _events, _api) {
  /* jshint module: true */

  function showToast(options) {
    return Emby.importModule('./modules/toast/toast.js').then(function (toast) {
      return toast(options);
    });
  }
  function showToastFromNotification(notification) {
    return showToast(notification.title);
  }
  function showNotification(notification, apiClient) {
    if (typeof Notification === 'undefined' || !navigator.serviceWorker || !Emby.serviceWorkerEnabled) {
      return showToastFromNotification(notification);
    }
    notification.timestamp = Date.now();
    notification.renotify = true;
    notification.tag += apiClient.serverId();
    if (!notification.data && notification.actions) {
      notification.data = apiClient.serverId();
    }
    var onFailure = function () {
      return showToastFromNotification(notification);
    };
    return navigator.serviceWorker.getRegistration().then(function (reg) {
      return Notification.requestPermission().then(function (permission) {
        if (permission !== 'granted') {
          return showToastFromNotification(notification);
        } else {
          return reg.showNotification(notification.title, notification).catch(onFailure);
        }
      });
    }, onFailure);
  }
  function showPackageInstallNotification(apiClient, installation, status) {
    apiClient.getCurrentUser().then(function (user) {
      if (!user.Policy.IsAdministrator) {
        return;
      }
      var notification = {
        tag: status
      };
      if (status === 'PackageInstallationCompleted') {
        notification.title = _globalize.default.translate('PackageInstallCompleted').replace('{0}', installation.Name + ' ' + installation.Version);
        notification.actions = [{
          action: 'restartserver',
          title: _globalize.default.translate('RestartServer')
        }];
      } else if (status === 'PackageInstallationCancelled') {
        notification.title = _globalize.default.translate('PackageInstallCancelled').replace('{0}', installation.Name + ' ' + installation.Version);
      } else if (status === 'PackageInstallationFailed') {
        notification.title = _globalize.default.translate('PackageInstallFailed').replace('{0}', installation.Name + ' ' + installation.Version);
      } else if (status === 'PackageInstalling') {
        notification.title = _globalize.default.translate('InstallingPackage').replace('{0}', installation.Name + ' ' + installation.Version);
        if (installation.PercentComplete) {
          notification.body = installation.PercentComplete + '%';
        }
      }
      if (notification.title) {
        showNotification(notification, apiClient);
      }
    });
  }
  _events.default.on(_api.default, 'PackageInstallationCompleted', function (e, apiClient, data) {
    showPackageInstallNotification(apiClient, data, "PackageInstallationCompleted");
  });
  _events.default.on(_api.default, 'PackageInstallationFailed', function (e, apiClient, data) {
    showPackageInstallNotification(apiClient, data, "PackageInstallationFailed");
  });
  _events.default.on(_api.default, 'PackageInstallationCancelled', function (e, apiClient, data) {
    showPackageInstallNotification(apiClient, data, "PackageInstallationCancelled");
  });
  _events.default.on(_api.default, 'PackageInstalling', function (e, apiClient, data) {
    showPackageInstallNotification(apiClient, data, "PackageInstalling");
  });
  _events.default.on(_api.default, 'ServerShuttingDown', function (e, apiClient, data) {
    showNotification({
      title: _globalize.default.translate('ServerNameIsShuttingDown', apiClient.serverName()),
      tag: 'ServerShuttingDown'
    }, apiClient);
  });
  _events.default.on(_api.default, 'ServerRestarting', function (e, apiClient, data) {
    showNotification({
      title: _globalize.default.translate('ServerNameIsRestarting', apiClient.serverName()),
      tag: 'ServerRestarting'
    }, apiClient);
  });
  _events.default.on(_api.default, 'RestartRequired', function (e, apiClient) {
    showNotification({
      title: _globalize.default.translate('PleaseRestartServerName', apiClient.serverName()),
      tag: 'RestartRequired',
      actions: [{
        action: 'restartserver',
        title: _globalize.default.translate('RestartServer')
      }]
    }, apiClient);
  });
});
