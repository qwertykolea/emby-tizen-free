define(["exports", "./events.js", "./apiclient.js", "./credentials.js", "./../common/servicelocator.js", "./../common/querystring.js", "./../common/usersettings/usersettings.js", "./../common/appsettings.js"], function (_exports, _events, _apiclient, _credentials, _servicelocator, _querystring, _usersettings, _appsettings) {
  Object.defineProperty(_exports, "__esModule", {
    value: true
  });
  _exports.default = void 0;
  /* jshint module: true */

  var defaultTimeout = 20000;
  var currentApiClient;
  function setCurrentApiClient(instance, apiClient) {
    // bad. only used by the web app
    if (instance.globalScopeApiClient) {
      globalThis.ApiClient = apiClient;
    }
    currentApiClient = apiClient;
  }
  var ConnectionMode = {
    Local: 0,
    Remote: 1,
    Manual: 2
  };
  function getServerAddress(server, mode) {
    switch (mode) {
      case ConnectionMode.Local:
        return server.LocalAddress;
      case ConnectionMode.Manual:
        return server.ManualAddress;
      case ConnectionMode.Remote:
        return server.RemoteAddress;
      default:
        return server.ManualAddress || server.LocalAddress || server.RemoteAddress;
    }
  }
  function mergeServers(credentialProvider, list1, list2) {
    var changed = false;
    for (var i = 0, length = list2.length; i < length; i++) {
      if (credentialProvider.addOrUpdateServer(list1, list2[i])) {
        changed = true;
      }
    }
    return changed;
  }
  function updateServerInfo(server, systemInfo) {
    if (systemInfo.ServerName) {
      server.Name = systemInfo.ServerName;
    }
    if (systemInfo.Id) {
      server.Id = systemInfo.Id;
    }
    if (systemInfo.LocalAddress) {
      server.LocalAddress = systemInfo.LocalAddress;
    }
    if (systemInfo.WanAddress) {
      server.RemoteAddress = systemInfo.WanAddress;
    }
  }
  function getSupportedCommands() {
    var supportedCommands = ['MoveUp', 'MoveDown', 'MoveLeft', 'MoveRight', 'PageUp', 'PageDown', 'PreviousLetter', 'NextLetter', 'ToggleOsd', 'ToggleContextMenu', 'Select', 'Back',
    //'TakeScreenshot',
    'SendKey', 'SendString', 'GoHome', 'GoToSettings', 'VolumeUp', 'VolumeDown', 'Mute', 'Unmute', 'ToggleMute', 'SetVolume', 'SetAudioStreamIndex', 'SetSubtitleStreamIndex', 'RefreshMediaSource',
    // Can't do this from another device because it requires user gesture
    //'ToggleFullscreen',

    'DisplayContent', 'GoToSearch', 'DisplayMessage', 'TriggerTranscodingFallback', 'SetRepeatMode', 'SetShuffle', 'SetSubtitleOffset', 'SetSubtitleAppearance', 'SetPlaybackRate', 'ChannelUp', 'ChannelDown', 'PlayMediaSource', 'PlayTrailers'];
    if (_servicelocator.appHost.supports('sleeptimer')) {
      supportedCommands.push('SetSleepTimer');
    }
    return supportedCommands;
  }
  function getCapabilities() {
    var supportsSync = _servicelocator.appHost.supports('sync');
    var syncProfilePromise = supportsSync && _servicelocator.appHost.getSyncProfile ? _servicelocator.appHost.getSyncProfile() : Promise.resolve(null);
    return syncProfilePromise.then(function (deviceProfile) {
      var caps = {
        PlayableMediaTypes: ['Audio', 'Video'],
        SupportedCommands: getSupportedCommands(),
        SupportsMediaControl: true
      };
      caps.DeviceProfile = deviceProfile;
      caps.IconUrl = _servicelocator.appHost.deviceIconUrl ? _servicelocator.appHost.deviceIconUrl() : null;
      caps.SupportsSync = supportsSync;
      caps.SupportsContentUploading = _servicelocator.appHost.supports('cameraupload');
      if (_servicelocator.appHost.getPushTokenInfo) {
        caps = Object.assign(caps, _servicelocator.appHost.getPushTokenInfo());
      }
      return caps;
    });
  }
  function getAbortError() {
    var err = new Error('AbortError');
    err.name = 'AbortError';
    return err;
  }
  function getFetchPromise(request, signal) {
    if (signal && signal.aborted) {
      return Promise.reject(getAbortError());
    }
    var headers = request.headers || {};
    if (request.dataType === 'json') {
      headers.accept = 'application/json';
    }
    var fetchRequest = {
      headers: headers,
      method: request.type,
      credentials: 'same-origin'
    };
    if (request.timeout) {
      var timeoutSignal = AbortSignal.timeout(request.timeout);
      if (signal) {
        signal = AbortSignal.any([signal, timeoutSignal]);
      } else {
        signal = timeoutSignal;
      }
    }
    if (signal) {
      fetchRequest.signal = signal;
    }
    var contentType = request.contentType;
    if (request.data) {
      if (typeof request.data === 'string') {
        fetchRequest.body = request.data;
      } else {
        fetchRequest.body = _querystring.default.paramsToString(request.data);
        contentType = contentType || 'application/x-www-form-urlencoded; charset=UTF-8';
      }
    }
    if (contentType) {
      headers['Content-Type'] = contentType;
    }
    return fetch(request.url, fetchRequest);
  }
  function sortServers(a, b) {
    return (b.DateLastAccessed || 0) - (a.DateLastAccessed || 0);
  }
  function setServerProperties(server) {
    // These are convenience properties for the UI
    server.Type = 'Server';
  }
  function ajax(request, signal) {
    if (!request) {
      throw new Error("Request cannot be null");
    }
    if (!request.headers) {
      request.headers = {};
    }
    console.log("ConnectionManager requesting url: " + request.url);
    return getFetchPromise(request, signal).then(function (response) {
      console.log("ConnectionManager response status: " + response.status + ", url: " + request.url);
      if (response.status < 400) {
        if (request.dataType === 'json') {
          return response.json();
        } else if (request.dataType === 'text') {
          return response.text();
        } else if (request.headers.accept === 'application/json') {
          return response.json();
        } else if (response.status === 204) {
          // Without this, the http connection gets ended via TCP disconnect. This ends the http connection even when keep-alive is set.
          return response.text();
        } else {
          return response;
        }
      } else {
        return Promise.reject(response);
      }
    });
  }
  function getConnectUrl(handler) {
    return "https://connect.emby.media/service/" + handler;
  }
  function replaceAll(originalString, strReplace, strWith) {
    var reg = new RegExp(strReplace, 'ig');
    return originalString.replace(reg, strWith);
  }
  function normalizeAddress(address) {
    // attempt to correct bad input
    address = address.trim();
    if (!address.toLowerCase().startsWith('http')) {
      if (address.includes(':443') || address.includes(':8920')) {
        address = "https://" + address;
      } else {
        address = "http://" + address;
      }
    }

    // Seeing failures in iOS when protocol isn't lowercase
    address = replaceAll(address, 'Http:', 'http:');
    address = replaceAll(address, 'Https:', 'https:');
    return address;
  }
  function convertEndpointAddressToAddress(info) {
    if (info.Address && info.EndpointAddress) {
      var address = info.EndpointAddress.split(":")[0];

      // Determine the port, if any
      var parts = info.Address.split(":");
      if (parts.length > 1) {
        var portString = parts[parts.length - 1];
        if (!isNaN(parseInt(portString))) {
          address += ":" + portString;
        }
      }
      return normalizeAddress(address);
    }
    return null;
  }
  function filterServers(servers, connectServers) {
    return servers.filter(function (server) {
      // It's not a connect server, so assume it's still valid
      if (!server.ExchangeToken) {
        return true;
      }
      return connectServers.filter(function (connectServer) {
        return server.Id === connectServer.Id;
      }).length > 0;
    });
  }
  function compareVersions(a, b) {
    // -1 a is smaller
    // 1 a is larger
    // 0 equal
    a = a.split('.');
    b = b.split('.');
    for (var i = 0, length = Math.max(a.length, b.length); i < length; i++) {
      var aVal = parseInt(a[i] || '0');
      var bVal = parseInt(b[i] || '0');
      if (aVal < bVal) {
        return -1;
      }
      if (aVal > bVal) {
        return 1;
      }
    }
    return 0;
  }
  function onCredentialsSaved(e, data) {
    _events.default.trigger(this, 'credentialsupdated', [data]);
  }
  function setTimeoutPromise(timeout) {
    return new Promise(function (resolve) {
      setTimeout(resolve, timeout);
    });
  }
  function addAppInfoToConnectRequest(instance, request) {
    if (!request.headers) {
      request.headers = {};
    }
    request.headers['X-Application'] = instance.appName() + "/" + instance.appVersion();
  }
  function exchangePinInternal(instance, pinInfo) {
    if (!pinInfo) {
      throw new Error('pinInfo cannot be null');
    }
    var request = {
      type: 'POST',
      url: getConnectUrl('pin/authenticate'),
      data: {
        deviceId: pinInfo.DeviceId,
        pin: pinInfo.Pin
      },
      dataType: 'json'
    };
    addAppInfoToConnectRequest(instance, request);
    return ajax(request);
  }
  function getCacheKey(feature, apiClient) {
    var options = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {};
    var cacheKey = "regInfo-" + apiClient.serverId();
    if (options.viewOnly) {
      cacheKey += '-viewonly';
    }
    if (options.allowNonPremiere) {
      cacheKey += '-allowNonPremiere';
    }
    return cacheKey;
  }
  function getConnectUser(instance, userId, accessToken) {
    if (!userId) {
      throw new Error("null userId");
    }
    if (!accessToken) {
      throw new Error("null accessToken");
    }
    var url = "https://connect.emby.media/service/user?id=" + userId;
    return ajax({
      type: "GET",
      url: url,
      dataType: "json",
      headers: {
        "X-Application": instance.appName() + "/" + instance.appVersion(),
        "X-Connect-UserToken": accessToken
      }
    });
  }
  function onConnectUserSignIn(instance, user) {
    instance._connectUser = user;
    _events.default.trigger(instance, 'connectusersignedin', [user]);
  }
  function ensureConnectUser(instance, credentials) {
    var connectUser = instance.connectUser();
    if (connectUser && connectUser.Id === credentials.ConnectUserId) {
      return Promise.resolve();
    } else if (credentials.ConnectUserId && credentials.ConnectAccessToken) {
      instance._connectUser = null;
      return getConnectUser(instance, credentials.ConnectUserId, credentials.ConnectAccessToken).then(function (user) {
        onConnectUserSignIn(instance, user);
        return Promise.resolve();
      }, function () {
        return Promise.resolve();
      });
    } else {
      return Promise.resolve();
    }
  }
  function updateUserAuthenticationInfoOnServer(server, userId, accessToken) {
    if (!accessToken) {
      removeUserFromServer(server, userId);
      return;
    }
    server.UserId = userId;
    server.AccessToken = null;
    delete server.AccessToken;
    var users = (server.Users || []).slice(0);
    for (var i = 0, length = users.length; i < length; i++) {
      var user = users[i];
      if (user.UserId === userId) {
        user.AccessToken = accessToken;
        return;
      }
    }
    users.push({
      UserId: userId,
      AccessToken: accessToken
    });
    server.Users = users;
  }
  function removeUserFromServer(server, userId) {
    if (server.UserId === userId) {
      server.UserId = null;
    }
    server.AccessToken = null;
    delete server.AccessToken;
    if (server.Users) {
      var users = (server.Users || []).slice(0);
      var list = [];
      for (var i = 0, length = users.length; i < length; i++) {
        var user = users[i];
        if (user.UserId !== userId) {
          list.push(user);
        }
      }
      server.Users = list;
    }
  }
  function clearUsersFromServer(server) {
    server.UserId = null;
    server.AccessToken = null;
    delete server.AccessToken;
    if (server.Users) {
      server.Users = [];
    }
  }
  function getUserAuthInfoFromServer(server, userId) {
    if (server.Users) {
      var users = (server.Users || []).slice(0);
      for (var i = 0, length = users.length; i < length; i++) {
        var user = users[i];
        if (user.UserId === userId) {
          return user;
        }
      }
    }
    return null;
  }
  function getLastUserAuthInfoFromServer(server) {
    return server.UserId ? getUserAuthInfoFromServer(server, server.UserId) : null;
  }
  function getUserAuthInfoFromAutoLoginOptions(server, options) {
    var autoLogin = options.autoLogin || _appsettings.default.autoLogin();
    switch (autoLogin) {
      case 'lastuser':
        return getLastUserAuthInfoFromServer(server);
      case 'none':
      case 'showlogin':
        return null;
      default:
        var userInfo = autoLogin.split('|');
        if (userInfo.length === 2) {
          return getUserAuthInfoFromServer(server, userInfo[1]);
        }
    }
  }
  function validateAuthentication(instance, server, userAuthInfo, serverUrl) {
    console.log('connectionManager.validateAuthentication: ' + serverUrl);
    var userId = userAuthInfo.UserId;
    return ajax({
      type: "GET",
      url: instance.getEmbyServerUrl(serverUrl, "System/Info", {
        api_key: userAuthInfo.AccessToken
      }),
      dataType: "json"
    }).then(function (systemInfo) {
      updateServerInfo(server, systemInfo);
      return systemInfo;
    }, function () {
      removeUserFromServer(server, userId);
      return Promise.resolve();
    });
  }
  function findServers() {
    var onFinish = function (foundServers) {
      var servers = foundServers.map(function (foundServer) {
        return {
          Id: foundServer.Id,
          LocalAddress: convertEndpointAddressToAddress(foundServer) || foundServer.Address,
          Name: foundServer.Name,
          LastConnectionMode: ConnectionMode.Local
        };
      });
      return servers;
    };
    return _servicelocator.serverDiscovery.findServers(1000).then(onFinish, function () {
      return onFinish([]);
    });
  }
  function validateServerAddressWithEndpoint(connectionManager, url, endpoint) {
    return ajax({
      url: connectionManager.getEmbyServerUrl(url, endpoint),
      timeout: defaultTimeout,
      type: 'GET',
      dataType: 'text'
    }).then(function (result) {
      var srch = String.fromCharCode(106) + String.fromCharCode(101) + String.fromCharCode(108) + String.fromCharCode(108) + String.fromCharCode(121) + String.fromCharCode(102);
      if ((result || '').toLowerCase().includes(srch)) {
        return Promise.reject('serverversion');
      }
      return Promise.resolve();
    });
  }
  function validateServerAddress(instance, url) {
    if (instance.enableServerAddressValidation === false) {
      return Promise.resolve();
    }
    return Promise.all([validateServerAddressWithEndpoint(instance, url, 'web/manifest.json'), validateServerAddressWithEndpoint(instance, url, 'web/index.html'), validateServerAddressWithEndpoint(instance, url, 'web/strings/en-US.json')]);
  }
  function onAuthenticated(apiClient, result) {
    var options = {};
    var instance = this;
    var credentials = _credentials.default.credentials();
    var servers = credentials.Servers.filter(function (s) {
      return s.Id === result.ServerId;
    });
    var server = servers.length ? servers[0] : apiClient.serverInfo();
    if (options.updateDateLastAccessed !== false) {
      server.DateLastAccessed = Date.now();
    }
    server.Id = result.ServerId;
    updateUserAuthenticationInfoOnServer(server, result.User.Id, result.AccessToken);
    if (_credentials.default.addOrUpdateServer(credentials.Servers, server)) {
      _credentials.default.credentials(credentials);
    }

    // set this now before updating server info, otherwise it won't be set in time
    apiClient.enableAutomaticBitrateDetection = options.enableAutomaticBitrateDetection;
    apiClient.serverInfo(server);
    var userAuthInfo = getUserAuthInfoFromServer(server, result.User.Id);
    apiClient.setAuthenticationInfo(userAuthInfo);
    options.reportCapabilities = true;
    afterConnected(instance, apiClient, server, options);
    return apiClient.getPublicSystemInfo().then(function (systemInfo) {
      updateServerInfo(server, systemInfo);
      if (_credentials.default.addOrUpdateServer(credentials.Servers, server)) {
        _credentials.default.credentials(credentials);
      }

      // Ensure this is created so that listeners of the event can get the apiClient instance
      instance._getOrAddApiClient(server, apiClient.serverAddress(), userAuthInfo);
      return onLocalUserSignIn(instance, server, apiClient, result.User.Id, apiClient.serverAddress());
    });
  }
  function reportCapabilities(instance, apiClient) {
    return instance.reportCapabilities(apiClient);
  }
  function afterConnected(instance, apiClient, server) {
    var options = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : {};
    if (options.reportCapabilities === true || options.reportCapabilities !== false /*&& server.ExchangeToken && instance.isLoggedIntoConnect()*/) {
      reportCapabilities(instance, apiClient);
    }
    apiClient.enableAutomaticBitrateDetection = options.enableAutomaticBitrateDetection;
    apiClient.enableWebSocketAutoConnect = options.enableWebSocket !== false;
    if (apiClient.enableWebSocketAutoConnect) {
      console.log('calling apiClient.ensureWebSocket');
      apiClient.connected = true;
      apiClient.ensureWebSocket();
    }
  }
  function onLocalUserSignIn(instance, server, apiClient, userId, serverUrl) {
    setCurrentApiClient(instance, apiClient);
    return _usersettings.default.setUserInfo(userId, apiClient).then(function () {
      _events.default.trigger(instance, 'localusersignedin', [server.Id, userId, apiClient]);
    });
  }
  function addAuthenticationInfoFromConnect(instance, server, systemInfo, serverUrl, credentials) {
    if (!server.ExchangeToken) {
      throw new Error("server.ExchangeToken cannot be null");
    }
    if (!credentials.ConnectUserId) {
      throw new Error("credentials.ConnectUserId cannot be null");
    }
    var urlParams = {
      format: 'json',
      ConnectUserId: credentials.ConnectUserId
    };
    var appName = instance.appName();
    var appVersion = instance.appVersion();
    var deviceName = instance.deviceName();
    var deviceId = instance.deviceId();
    if (appName) {
      urlParams['X-Emby-Client'] = appName;
    }
    if (deviceId) {
      urlParams['X-Emby-Device-Id'] = deviceId;
    }
    if (appVersion) {
      urlParams['X-Emby-Client-Version'] = appVersion;
    }
    if (deviceName) {
      urlParams['X-Emby-Device-Name'] = deviceName;
    }
    urlParams['X-Emby-Token'] = server.ExchangeToken;
    var url = instance.getEmbyServerUrl(serverUrl, 'Connect/Exchange', urlParams);
    return ajax({
      type: "GET",
      url: url,
      dataType: "json"
    }).then(function (auth) {
      updateUserAuthenticationInfoOnServer(server, auth.LocalUserId, auth.AccessToken);
      return auth;
    }, function () {
      clearUsersFromServer(server);
      return Promise.reject();
    });
  }
  function logoutOfServer(instance, apiClient) {
    var logoutInfo = {
      serverId: apiClient.serverId()
    };
    return apiClient.logout().then(function () {
      _usersettings.default.setUserInfo(null, null);
      _events.default.trigger(instance, 'localusersignedout', [logoutInfo]);
    }, function () {
      _usersettings.default.setUserInfo(null, null);
      _events.default.trigger(instance, 'localusersignedout', [logoutInfo]);
    });
  }
  function handleConnectServersResponse(servers) {
    console.log('Connect servers response: ' + JSON.stringify(servers));
    return servers.map(function (i) {
      return {
        ExchangeToken: i.AccessKey,
        ConnectServerId: i.Id,
        Id: i.SystemId,
        Name: i.Name,
        RemoteAddress: i.Url,
        LocalAddress: i.LocalAddress
      };
    });
  }
  function getConnectServers(instance, credentials) {
    console.log('Begin getConnectServers');
    if (!credentials.ConnectAccessToken || !credentials.ConnectUserId) {
      return Promise.resolve([]);
    }
    var url = "https://connect.emby.media/service/servers?userId=" + credentials.ConnectUserId;
    return ajax({
      type: "GET",
      url: url,
      dataType: "json",
      headers: {
        "X-Application": instance.appName() + "/" + instance.appVersion(),
        "X-Connect-UserToken": credentials.ConnectAccessToken
      }
    }).then(handleConnectServersResponse, function () {
      return credentials.Servers.slice(0).filter(function (s) {
        return s.ExchangeToken;
      });
    });
  }
  function tryReconnectToUrl(instance, url, connectionMode, delay, signal) {
    console.log('tryReconnectToUrl: ' + url);
    return setTimeoutPromise(delay).then(function () {
      return ajax({
        url: instance.getEmbyServerUrl(url, 'system/info/public'),
        timeout: defaultTimeout,
        type: 'GET',
        dataType: 'json'
      }, signal).then(function (result) {
        return {
          url: url,
          connectionMode: connectionMode,
          data: result
        };
      });
    });
  }
  function isLocalHostAddress(address) {
    if (address.includes('://127.0.0.1')) {
      return true;
    }
    if (address.toLowerCase().includes('://localhost')) {
      return true;
    }
    return false;
  }
  function tryReconnect(instance, serverInfo, signal) {
    var addresses = [];
    var addressesStrings = [];

    // the timeouts are a small hack to try and ensure the remote address doesn't resolve first

    // manualAddressOnly is used for the local web app that always connects to a fixed address
    if (serverInfo.ManualAddress && isLocalHostAddress(serverInfo.ManualAddress) && !addressesStrings.includes(serverInfo.ManualAddress.toLowerCase())) {
      addresses.push({
        url: serverInfo.ManualAddress,
        mode: ConnectionMode.Manual
      });
      addressesStrings.push(addresses[addresses.length - 1].url.toLowerCase());
    }
    if (!serverInfo.ManualAddressOnly && serverInfo.LocalAddress && !addressesStrings.includes(serverInfo.LocalAddress.toLowerCase())) {
      addresses.push({
        url: serverInfo.LocalAddress,
        mode: ConnectionMode.Local
      });
      addressesStrings.push(addresses[addresses.length - 1].url.toLowerCase());
    }
    if (serverInfo.ManualAddress && !addressesStrings.includes(serverInfo.ManualAddress.toLowerCase())) {
      addresses.push({
        url: serverInfo.ManualAddress,
        mode: ConnectionMode.Manual
      });
      addressesStrings.push(addresses[addresses.length - 1].url.toLowerCase());
    }
    if (!serverInfo.ManualAddressOnly && serverInfo.RemoteAddress && !addressesStrings.includes(serverInfo.RemoteAddress.toLowerCase())) {
      addresses.push({
        url: serverInfo.RemoteAddress,
        mode: ConnectionMode.Remote
      });
      addressesStrings.push(addresses[addresses.length - 1].url.toLowerCase());
    }
    console.log('tryReconnect: ' + addressesStrings.join('|'));
    if (!addressesStrings.length) {
      return Promise.reject();
    }
    var abortController = new AbortController();
    if (signal) {
      signal = AbortSignal.any([signal, abortController.signal]);
    } else {
      signal = abortController.signal;
    }
    var promises = [];
    for (var i = 0, length = addresses.length; i < length; i++) {
      promises.push(tryReconnectToUrl(instance, addresses[i].url, addresses[i].mode, i * 200, signal));
    }
    return Promise.any(promises).then(function (result) {
      abortController.abort();
      return result;
    });
  }
  function afterConnectValidated(instance, server, credentials, systemInfo, connectionMode, serverUrl, verifyLocalAuthentication, options) {
    console.log('connectionManager.afterConnectValidated: ' + serverUrl);
    if (!options) {
      options = {};
    }
    var userAuthInfo = (options.userId ? getUserAuthInfoFromServer(server, options.userId) : getUserAuthInfoFromAutoLoginOptions(server, options)) || {};
    if (verifyLocalAuthentication && userAuthInfo.UserId && userAuthInfo.AccessToken) {
      return validateAuthentication(instance, server, userAuthInfo, serverUrl).then(function (fullSystemInfo) {
        // don't try to look this up again the next time through
        options.userId = userAuthInfo.UserId;
        return afterConnectValidated(instance, server, credentials, fullSystemInfo || systemInfo, connectionMode, serverUrl, false, options);
      });
    }
    updateServerInfo(server, systemInfo);
    server.LastConnectionMode = connectionMode;
    if (options.updateDateLastAccessed !== false) {
      server.DateLastAccessed = Date.now();
    }
    if (_credentials.default.addOrUpdateServer(credentials.Servers, server)) {
      _credentials.default.credentials(credentials);
    }
    var result = {
      Servers: []
    };
    result.ApiClient = instance._getOrAddApiClient(server, serverUrl, userAuthInfo, true);
    result.ApiClient.setSystemInfo(systemInfo);
    var autoLogin = options.autoLogin || _appsettings.default.autoLogin();
    result.State = userAuthInfo.UserId && userAuthInfo.AccessToken && autoLogin !== 'none' && autoLogin !== 'showlogin' ? 'SignedIn' : 'ServerSignIn';
    result.Servers.push(server);

    // set this now before updating server info, otherwise it won't be set in time
    result.ApiClient.enableAutomaticBitrateDetection = options.enableAutomaticBitrateDetection;
    result.ApiClient.updateServerInfo(server, serverUrl);
    instance.resetRegistrationInfo(result.ApiClient, true);
    var resolveActions = function () {
      _events.default.trigger(instance, 'connected', [result]);
      return Promise.resolve(result);
    };
    console.log('connectionManager.afterConnectValidated result.State: ' + (result.State || ''));
    if (result.State === 'SignedIn') {
      afterConnected(instance, result.ApiClient, server, options);
      return onLocalUserSignIn(instance, server, result.ApiClient, userAuthInfo.UserId, serverUrl).then(resolveActions, resolveActions);
    } else {
      return resolveActions();
    }
  }
  function onSuccessfulConnection(instance, server, systemInfo, connectionMode, serverUrl, options) {
    console.log('connectionManager.onSuccessfulConnection: ' + serverUrl);
    var credentials = _credentials.default.credentials();
    if (!options) {
      options = {};
    }
    var autoLogin = options.autoLogin || _appsettings.default.autoLogin();
    if (credentials.ConnectAccessToken && autoLogin !== 'none') {
      return ensureConnectUser(instance, credentials).then(function () {
        if (server.ExchangeToken) {
          return addAuthenticationInfoFromConnect(instance, server, systemInfo, serverUrl, credentials).then(function () {
            return afterConnectValidated(instance, server, credentials, systemInfo, connectionMode, serverUrl, true, options);
          }, function () {
            return afterConnectValidated(instance, server, credentials, systemInfo, connectionMode, serverUrl, true, options);
          });
        } else {
          return afterConnectValidated(instance, server, credentials, systemInfo, connectionMode, serverUrl, true, options);
        }
      });
    } else {
      return afterConnectValidated(instance, server, credentials, systemInfo, connectionMode, serverUrl, true, options);
    }
  }
  function getServerUnavailableResult(instance, response, server, address) {
    var _response;
    if (response && !response.text && response.errors) {
      response = response.errors[0];
    }
    var promise = (_response = response) != null && _response.text ? response.text() : Promise.resolve();
    return promise.then(function (msg) {
      return {
        State: 'Unavailable',
        ErrorMessage: msg,
        Server: server,
        ConnectUser: instance.connectUser(),
        Address: address
      };
    });
  }
  function resolveIfAvailable(instance, url, server, result, connectionMode, options) {
    console.log('connectionManager.resolveIfAvailable: ' + url);
    var promise = validateServerAddress(instance, url);
    return promise.then(function () {
      return onSuccessfulConnection(instance, server, result, connectionMode, url, options);
    }, function (err) {
      if (err === 'serverversion') {
        console.log('minServerVersion requirement not met. Server version: ' + result.Version);
        return {
          State: 'ServerUpdateNeeded',
          Servers: [server]
        };
      }
      return getServerUnavailableResult(instance, err, server);
    });
  }
  function getUserRecordFromAuthentication(user, server, apiClient) {
    return apiClient.getUser(user.UserId).catch(function (err) {
      var userRemoved;
      var status = err == null ? void 0 : err.status;
      switch (status) {
        case 401:
        case 404:
          {
            var index = server.Users.indexOf(user);
            if (index > -1) {
              // remove the user so that we don't keep trying this
              server.Users.splice(index, 1);
              userRemoved = true;
            }
            break;
          }
        default:
          break;
      }
      console.error('Error in getUserRecordFromAuthentication: ', err);
      return Promise.resolve({
        IsError: true,
        UserRemoved: userRemoved
      });
    });
  }
  function onServerAddressChanged(e, data) {
    var instance = this;

    // rebroadcast for convenience
    _events.default.trigger(instance, 'serveraddresschanged', [data]);
  }
  function ConnectionManager() {
    this._apiClients = [];
    this._apiClientsMap = {};
    console.log('Begin ConnectionManager constructor');
    this._appName = _servicelocator.appHost.appName();
    this._appVersion = _servicelocator.appHost.appVersion();
    this._deviceName = _servicelocator.appHost.deviceName();
    this._deviceId = _servicelocator.appHost.deviceId();
    this._minServerVersion = '4.7.14';
    _events.default.on(_credentials.default, 'credentialsupdated', onCredentialsSaved.bind(this));
  }
  ConnectionManager.prototype.appName = function () {
    return this._appName;
  };
  ConnectionManager.prototype.appVersion = function () {
    return this._appVersion;
  };
  ConnectionManager.prototype.deviceName = function () {
    return this._deviceName;
  };
  ConnectionManager.prototype.deviceId = function () {
    return this._deviceId;
  };
  ConnectionManager.prototype.minServerVersion = function (val) {
    if (val) {
      this._minServerVersion = val;
    }
    return this._minServerVersion;
  };
  ConnectionManager.prototype.connectUser = function () {
    return this._connectUser;
  };
  ConnectionManager.prototype.connectUserId = function () {
    return _credentials.default.credentials().ConnectUserId;
  };
  ConnectionManager.prototype.connectToken = function () {
    return _credentials.default.credentials().ConnectAccessToken;
  };
  ConnectionManager.prototype.getServerInfo = function (id) {
    var servers = _credentials.default.credentials().Servers;
    return servers.filter(function (s) {
      return s.Id === id;
    })[0];
  };
  ConnectionManager.prototype.getLastUsedServer = function () {
    var servers = _credentials.default.credentials().Servers;
    servers.sort(sortServers);
    if (!servers.length) {
      return null;
    }
    return servers[0];
  };
  ConnectionManager.prototype.getApiClientFromServerInfo = function (server, serverUrlToMatch) {
    server.DateLastAccessed = Date.now();
    if (server.LastConnectionMode == null && server.ManualAddress) {
      server.LastConnectionMode = ConnectionMode.Manual;
    }
    var credentials = _credentials.default.credentials();
    if (_credentials.default.addOrUpdateServer(credentials.Servers, server, serverUrlToMatch)) {
      _credentials.default.credentials(credentials);
    }
    var apiClient = this._getOrAddApiClient(server, getServerAddress(server, server.LastConnectionMode));
    setCurrentApiClient(this, apiClient);
    return apiClient;
  };
  ConnectionManager.prototype.clearData = function () {
    console.log('connection manager clearing data');
    this._connectUser = null;
    var credentials = _credentials.default.credentials();
    credentials.ConnectAccessToken = null;
    credentials.ConnectUserId = null;
    credentials.Servers = [];
    _credentials.default.credentials(credentials);
  };

  // this method should only be used when there's no other choice
  // the consumer should always be aware of the serverId that they're working with and get the apiClient based off of that
  ConnectionManager.prototype.currentApiClient = function () {
    if (!currentApiClient) {
      var server = this.getLastUsedServer();
      if (server) {
        currentApiClient = setCurrentApiClient(this, this.getApiClient(server.Id));
      }
    }
    return currentApiClient;
  };
  ConnectionManager.prototype._getOrAddApiClient = function (server, serverUrl, userAuthInfo, forceUpdateApiClientServerInfo) {
    var apiClient = server.Id ? this.getApiClient(server.Id) : null;
    if (!apiClient && server.IsLocalServer) {
      for (var i = 0, length = this._apiClients.length; i < length; i++) {
        var current = this._apiClients[i];
        if (current.serverInfo().IsLocalServer) {
          apiClient = current;
          break;
        }
      }
    }
    if (!apiClient) {
      console.log('creating new apiclient');
      var _ApiClient = _servicelocator.apiClientFactory;
      apiClient = new _ApiClient(serverUrl, this.appName(), this.appVersion(), this.deviceName(), this.deviceId(), this.devicePixelRatio);
      if (!currentApiClient) {
        currentApiClient = apiClient;
      }
      this._apiClients.push(apiClient);
      apiClient.serverInfo(server);
      apiClient.setAuthenticationInfo(userAuthInfo || getLastUserAuthInfoFromServer(server));

      // check for presence of serverId because the local web app may not have this information yet
      if (apiClient.serverId()) {
        this._apiClientsMap[apiClient.serverId()] = apiClient;
      }
      apiClient.setCurrentLocale(this.currentLocale);
      apiClient.onAuthenticated = onAuthenticated.bind(this);
      _events.default.trigger(this, 'apiclientcreated', [apiClient]);
      _events.default.on(apiClient, 'serveraddresschanged', onServerAddressChanged.bind(this));
    } else {
      // check for presence of serverId because the local web app may not have this information yet
      // if available, reset into the map now that we have this info
      if (server.Id) {
        if (!apiClient.serverId() || forceUpdateApiClientServerInfo) {
          apiClient.serverInfo(server);
          apiClient.setAuthenticationInfo(userAuthInfo || getLastUserAuthInfoFromServer(server));
        }
        this._apiClientsMap[server.Id] = apiClient;
      }
    }
    console.log('returning instance from getOrAddApiClient');
    return apiClient;
  };
  ConnectionManager.prototype.setCurrentLocale = function (value) {
    this.currentLocale = value;
    for (var i = 0, length = this._apiClients.length; i < length; i++) {
      this._apiClients[i].setCurrentLocale(value);
    }
  };
  ConnectionManager.prototype.logout = function (apiClient) {
    console.log('begin connectionManager loguot');
    var promises = [];
    var isLoggedIntoConnect = this.isLoggedIntoConnect();
    var apiClients = apiClient && !isLoggedIntoConnect ? [apiClient] : this._apiClients.slice(0);
    var apiClientInfos = [];
    for (var i = 0, length = apiClients.length; i < length; i++) {
      var currApiClient = apiClients[i];
      if (currApiClient.accessToken()) {
        promises.push(logoutOfServer(this, currApiClient));
        apiClientInfos.push({
          userId: currApiClient.getCurrentUserId(),
          serverId: currApiClient.serverId()
        });
      }
    }
    var instance = this;
    return Promise.all(promises).then(function () {
      var credentials = _credentials.default.credentials();
      var servers = credentials.Servers.slice(0);
      var _loop = function () {
        var apiClientInfo = apiClientInfos[_i];
        var currentServerId = apiClientInfo.serverId;
        if (currentServerId) {
          var server = servers.filter(function (s) {
            return s.Id === currentServerId;
          })[0];
          if (server) {
            if (isLoggedIntoConnect) {
              clearUsersFromServer(server);
            } else {
              removeUserFromServer(server, apiClientInfo.userId);
            }
            server.ExchangeToken = null;
          }
        }
      };
      for (var _i = 0, _length = apiClientInfos.length; _i < _length; _i++) {
        _loop();
      }
      credentials.Servers = servers;
      credentials.ConnectAccessToken = null;
      credentials.ConnectUserId = null;
      _credentials.default.credentials(credentials);
      instance._connectUser = null;
    });
  };
  ConnectionManager.prototype.getSavedServers = function () {
    // not initialized yet
    if (!_credentials.default) {
      console.log('A call was made to getSavedServers before connectionManager was initialized.');
      return [];
    }
    var credentials = _credentials.default.credentials();
    var servers = credentials.Servers.slice(0);
    servers.forEach(setServerProperties);
    servers.sort(sortServers);
    return servers;
  };
  ConnectionManager.prototype.getAvailableServers = function () {
    console.log('Begin getAvailableServers');

    // Clone the array
    var credentials = _credentials.default.credentials();
    return Promise.all([getConnectServers(this, credentials), findServers()]).then(function (responses) {
      var connectServers = responses[0];
      var foundServers = responses[1];
      var servers = credentials.Servers.slice(0);
      var changed = false;
      if (mergeServers(_credentials.default, servers, foundServers)) {
        changed = true;
      }
      if (mergeServers(_credentials.default, servers, connectServers)) {
        changed = true;
      }
      servers = filterServers(servers, connectServers);
      servers.forEach(setServerProperties);
      servers.sort(sortServers);
      if (!changed) {
        if (JSON.stringify(servers) !== JSON.stringify(credentials.Servers)) {
          changed = true;
        }
      }
      if (changed) {
        credentials.Servers = servers;
        _credentials.default.credentials(credentials);
      }
      return servers;
    });
  };
  ConnectionManager.prototype.connectToServers = function (servers, options) {
    console.log("Begin connectToServers, with " + servers.length + " servers");
    var firstServer = servers.length ? servers[0] : null;
    // See if we have any saved credentials and can auto sign in
    if (firstServer) {
      return this.connectToServer(firstServer, options).then(function (result) {
        if (result.State === 'Unavailable') {
          result.State = 'ServerSelection';
        }
        console.log('resolving connectToServers with result.State: ' + result.State);
        return result;
      });
    }
    return Promise.resolve({
      Servers: servers,
      State: !servers.length && !this.connectUser() ? 'ConnectSignIn' : 'ServerSelection',
      ConnectUser: this.connectUser()
    });
  };
  ConnectionManager.prototype.connectToServer = function (server, options) {
    console.log('begin connectToServer');
    if (!options) {
      options = {};
    }
    var instance = this;
    return tryReconnect(this, server).then(function (result) {
      var serverUrl = result.url;
      var connectionMode = result.connectionMode;
      result = result.data;
      if (compareVersions(instance.minServerVersion(), result.Version) === 1 || compareVersions(result.Version, '8.0') === 1) {
        console.log('minServerVersion requirement not met. Server version: ' + result.Version);
        return {
          State: 'ServerUpdateNeeded',
          Servers: [server]
        };
      } else {
        if (server.Id && result.Id !== server.Id && instance.validateServerIds !== false) {
          server = {
            Id: result.Id,
            ManualAddress: serverUrl
          };
          updateServerInfo(server, result);
        }
        return resolveIfAvailable(instance, serverUrl, server, result, connectionMode, options);
      }
    }, function (err) {
      return getServerUnavailableResult(instance, err, server);
    });
  };
  ConnectionManager.prototype.connectToAddress = function (address, options) {
    if (!address) {
      return Promise.reject();
    }
    address = normalizeAddress(address);
    var instance = this;
    function onFail(err) {
      console.log("connectToAddress " + address + " failed");
      return getServerUnavailableResult(instance, err, {
        ManualAddress: address
      }, address);
    }
    var server = {
      ManualAddress: address,
      LastConnectionMode: ConnectionMode.Manual
    };
    return this.connectToServer(server, options).catch(onFail);
  };
  ConnectionManager.prototype.loginToConnect = function (username, password) {
    if (!username) {
      return Promise.reject();
    }
    if (!password) {
      return Promise.reject();
    }
    var instance = this;
    return ajax({
      type: "POST",
      url: "https://connect.emby.media/service/user/authenticate",
      data: {
        nameOrEmail: username,
        rawpw: password
      },
      dataType: "json",
      contentType: 'application/x-www-form-urlencoded; charset=UTF-8',
      headers: {
        "X-Application": this.appName() + "/" + this.appVersion()
      }
    }).then(function (result) {
      var credentials = _credentials.default.credentials();
      credentials.ConnectAccessToken = result.AccessToken;
      credentials.ConnectUserId = result.User.Id;
      _credentials.default.credentials(credentials);
      onConnectUserSignIn(instance, result.User);
      return result;
    });
  };
  ConnectionManager.prototype.signupForConnect = function (options) {
    var email = options.email;
    var username = options.username;
    var password = options.password;
    var passwordConfirm = options.passwordConfirm;
    if (!email) {
      return Promise.reject({
        errorCode: 'invalidinput'
      });
    }
    if (!username) {
      return Promise.reject({
        errorCode: 'invalidinput'
      });
    }
    if (!password) {
      return Promise.reject({
        errorCode: 'invalidinput'
      });
    }
    if (!passwordConfirm) {
      return Promise.reject({
        errorCode: 'passwordmatch'
      });
    }
    if (password !== passwordConfirm) {
      return Promise.reject({
        errorCode: 'passwordmatch'
      });
    }
    var data = {
      email: email,
      userName: username,
      rawpw: password
    };
    if (options.grecaptcha) {
      data.grecaptcha = options.grecaptcha;
    }
    return ajax({
      type: "POST",
      url: "https://connect.emby.media/service/register",
      data: data,
      dataType: "json",
      contentType: 'application/x-www-form-urlencoded; charset=UTF-8',
      headers: {
        "X-Application": this.appName() + "/" + this.appVersion(),
        "X-CONNECT-TOKEN": "CONNECT-REGISTER"
      }
    }).catch(function (response) {
      return response.json();
    }).then(function (result) {
      if (result && result.Status) {
        if (result.Status === 'SUCCESS') {
          return Promise.resolve(result);
        }
        return Promise.reject({
          errorCode: result.Status
        });
      } else {
        Promise.reject();
      }
    });
  };
  ConnectionManager.prototype.getUserInvitations = function () {
    var connectToken = this.connectToken();
    if (!connectToken) {
      throw new Error("null connectToken");
    }
    if (!this.connectUserId()) {
      throw new Error("null connectUserId");
    }
    var url = "https://connect.emby.media/service/servers?userId=" + this.connectUserId() + "&status=Waiting";
    return ajax({
      type: "GET",
      url: url,
      dataType: "json",
      headers: {
        "X-Connect-UserToken": connectToken,
        "X-Application": this.appName() + "/" + this.appVersion()
      }
    });
  };
  ConnectionManager.prototype.deleteServer = function (serverId) {
    if (!serverId) {
      throw new Error("null serverId");
    }
    var server = _credentials.default.credentials().Servers.filter(function (s) {
      return s.Id === serverId;
    });
    server = server.length ? server[0] : null;
    function onDone() {
      var credentials = _credentials.default.credentials();
      credentials.Servers = credentials.Servers.filter(function (s) {
        return s.Id !== serverId;
      });
      _credentials.default.credentials(credentials);
      return Promise.resolve();
    }
    if (!server.ConnectServerId) {
      return onDone();
    }
    var connectToken = this.connectToken();
    var connectUserId = this.connectUserId();
    if (!connectToken || !connectUserId) {
      return onDone();
    }
    var url = "https://connect.emby.media/service/serverAuthorizations?serverId=" + server.ConnectServerId + "&userId=" + connectUserId;
    return ajax({
      type: "DELETE",
      url: url,
      headers: {
        "X-Connect-UserToken": connectToken,
        "X-Application": this.appName() + "/" + this.appVersion()
      }
    }).then(onDone, onDone);
  };
  ConnectionManager.prototype.resetRegistrationInfo = function (apiClient, onlyResetIfFailed) {
    var removeAll = false;
    var cacheKey = getCacheKey('themes', apiClient, {
      viewOnly: true
    });
    var regInfo = JSON.parse(_servicelocator.appStorage.getItem(cacheKey) || '{}');
    if (removeAll || !onlyResetIfFailed || regInfo.lastValidDate === -1) {
      _servicelocator.appStorage.removeItem(cacheKey);
      removeAll = true;
    }
    cacheKey = getCacheKey('themes', apiClient, {
      viewOnly: false
    });
    regInfo = JSON.parse(_servicelocator.appStorage.getItem(cacheKey) || '{}');
    if (removeAll || !onlyResetIfFailed || regInfo.lastValidDate === -1) {
      _servicelocator.appStorage.removeItem(cacheKey);
      removeAll = true;
    }
    if (!onlyResetIfFailed) {
      _events.default.trigger(this, 'resetregistrationinfo');
    }
  };
  ConnectionManager.prototype.getRegistrationInfo = function (feature, apiClient, options) {
    var params = {
      serverId: apiClient.serverId(),
      deviceId: this.deviceId(),
      deviceName: this.deviceName(),
      appName: this.appName(),
      appVersion: this.appVersion()
    };
    if (!options) {
      options = {};
    }
    if (options.viewOnly) {
      params.viewOnly = options.viewOnly;
    }
    if (options.allowNonPremiere) {
      params.allowNonPremiere = options.allowNonPremiere;
    }
    var cacheKey = getCacheKey(feature, apiClient, options);
    var regInfo = JSON.parse(_servicelocator.appStorage.getItem(cacheKey) || '{}');
    var timeSinceLastValidation = Date.now() - (regInfo.lastValidDate || 0);

    // Cache for 1 day
    if (timeSinceLastValidation <= 86400000) {
      console.log('getRegistrationInfo returning cached info');
      return Promise.resolve();
    }
    if (options.useCachedFailure) {
      if (regInfo.lastValidDate === -1) {
        return Promise.reject();
      }
    }
    var regCacheValid = timeSinceLastValidation <= (regInfo.cacheExpirationDays || 7) * 86400000;
    var onFailure = function (err) {
      console.log('getRegistrationInfo failed: ' + err);

      // Allow for up to 7 days
      if (regCacheValid) {
        console.log('getRegistrationInfo returning cached info');
        return Promise.resolve();
      }
      throw err;
    };
    if (!params.serverId) {
      return Promise.reject();
    }
    var currentUserId = apiClient.getCurrentUserId();
    if (currentUserId && currentUserId.toLowerCase() === '81f53802ea0247ad80618f55d9b4ec3c' && params.serverId.toLowerCase() === '21585256623b4beeb26d5d3b09dec0ac') {
      return Promise.reject();
    }
    var getRegPromise = ajax({
      url: 'https://crackemby.mb6.top/admin/service/registration/validateDevice?' + new URLSearchParams(params).toString(),
      type: 'POST',
      dataType: 'json'
    }).then(function (response) {
      _servicelocator.appStorage.setItem(cacheKey, JSON.stringify({
        lastValidDate: Date.now(),
        deviceId: params.deviceId,
        cacheExpirationDays: response.cacheExpirationDays,
        lastUpdated: Date.now()
      }));
      return Promise.resolve();
    }, function (response) {
      var status = (response || {}).status;
      console.log('getRegistrationInfo response: ' + status);
      if (status && status < 500) {
        _servicelocator.appStorage.setItem(cacheKey, JSON.stringify({
          lastValidDate: -1,
          deviceId: params.deviceId,
          cacheExpirationDays: 0,
          lastUpdated: Date.now()
        }));
      }
      if (status === 403) {
        if (params.allowNonPremiere) {
          return Promise.reject('overlimit_nonpremiere');
        }
        return Promise.reject('overlimit');
      }
      if (status && status < 500) {
        return Promise.reject();
      }
      return onFailure(response);
    });
    if (regCacheValid) {
      console.log('getRegistrationInfo returning cached info');
      return Promise.resolve();
    }
    return getRegPromise;
  };
  ConnectionManager.prototype.createPin = function () {
    var request = {
      type: 'POST',
      url: getConnectUrl('pin'),
      data: {
        deviceId: this.deviceId()
      },
      dataType: 'json'
    };
    addAppInfoToConnectRequest(this, request);
    return ajax(request);
  };
  ConnectionManager.prototype.getPinStatus = function (pinInfo) {
    if (!pinInfo) {
      throw new Error('pinInfo cannot be null');
    }
    var queryStringData = {
      deviceId: pinInfo.DeviceId,
      pin: pinInfo.Pin
    };
    var request = {
      type: 'GET',
      url: getConnectUrl('pin') + "?" + new URLSearchParams(queryStringData).toString(),
      dataType: 'json'
    };
    addAppInfoToConnectRequest(this, request);
    return ajax(request);
  };
  ConnectionManager.prototype.exchangePin = function (pinInfo) {
    if (!pinInfo) {
      throw new Error('pinInfo cannot be null');
    }
    var instance = this;
    return exchangePinInternal(this, pinInfo).then(function (result) {
      var credentials = _credentials.default.credentials();
      credentials.ConnectAccessToken = result.AccessToken;
      credentials.ConnectUserId = result.UserId;
      _credentials.default.credentials(credentials);
      return ensureConnectUser(instance, credentials);
    });
  };
  ConnectionManager.prototype.connect = function (options) {
    console.log('Begin connect');
    var instance = this;
    return instance.getAvailableServers().then(function (servers) {
      return instance.connectToServers(servers, options);
    });
  };
  ConnectionManager.prototype.handleMessageReceived = function (msg) {
    var serverId = msg.ServerId;
    if (serverId) {
      var apiClient = this.getApiClient(serverId);
      if (apiClient) {
        if (typeof msg.Data === 'string') {
          try {
            msg.Data = JSON.parse(msg.Data);
          } catch (err) {
            console.log("Error in handleMessageReceived JSON.parse: " + err);
          }
        }
        apiClient.handleMessageReceived(msg);
      }
    }
  };
  ConnectionManager.prototype.onNetworkChanged = function () {
    var apiClients = this._apiClients;
    for (var i = 0, length = apiClients.length; i < length; i++) {
      apiClients[i].onNetworkChanged();
    }
  };
  ConnectionManager.prototype.onAppResume = function () {
    var apiClients = this._apiClients;
    for (var i = 0, length = apiClients.length; i < length; i++) {
      apiClients[i].ensureWebSocket();
    }
  };
  ConnectionManager.prototype.isLoggedIntoConnect = function () {
    // Make sure it returns true or false
    if (!this.connectToken() || !this.connectUserId()) {
      return false;
    }
    return true;
  };
  ConnectionManager.prototype.isLoggedIn = function (serverId, userId) {
    var credentials = _credentials.default.credentials();
    var server = credentials.Servers.filter(function (s) {
      return s.Id === serverId;
    })[0];
    if (!server) {
      return false;
    }
    var authInfo = userId ? getUserAuthInfoFromServer(server, userId) : getLastUserAuthInfoFromServer(server);
    return (authInfo == null ? void 0 : authInfo.AccessToken) != null;
  };
  ConnectionManager.prototype.getApiClients = function () {
    var servers = this.getSavedServers();
    for (var i = 0, length = servers.length; i < length; i++) {
      var server = servers[i];
      if (server.Id) {
        var serverUrl = getServerAddress(server, server.LastConnectionMode);
        if (serverUrl) {
          this._getOrAddApiClient(server, serverUrl);
        }
      }
    }
    return this._apiClients;
  };
  ConnectionManager.prototype.getApiClient = function (item) {
    if (!item) {
      throw new Error('item or serverId cannot be null');
    }
    var serverId = item.ServerId;

    // Accept string + object

    if (!serverId) {
      if (item.Id && item.Type === 'Server') {
        serverId = item.Id;
      } else {
        serverId = item;
      }
    }
    var apiClient;
    if (serverId) {
      apiClient = this._apiClientsMap[serverId];
      if (apiClient) {
        return apiClient;
      }
    }
    var apiClients = this._apiClients;
    for (var i = 0, length = apiClients.length; i < length; i++) {
      apiClient = apiClients[i];
      var apiClientServerId = apiClient.serverId();

      // We have to keep this hack in here because of the addApiClient method
      if (!apiClientServerId || apiClientServerId === serverId) {
        return apiClient;
      }
    }
    return null;
  };
  ConnectionManager.prototype.getEmbyServerUrl = function (baseUrl, handler, params) {
    return _apiclient.default.getUrl(handler, params, baseUrl);
  };
  ConnectionManager.prototype.reportCapabilities = function (apiClient) {
    return getCapabilities().then(function (capabilities) {
      return apiClient.reportCapabilities(capabilities);
    });
  };
  ConnectionManager.prototype.getSignedInUsers = function (apiClient) {
    var credentials = _credentials.default.credentials();
    var serverId = apiClient.serverId();
    var servers = credentials.Servers.slice(0);
    var server;
    for (var i = 0, length = servers.length; i < length; i++) {
      if (servers[i].Id === serverId) {
        server = servers[i];
        break;
      }
    }
    if (!server) {
      return Promise.resolve([]);
    }
    var users = (server.Users || []).slice(0);
    var promises = [];
    for (var _i2 = 0, _length2 = users.length; _i2 < _length2; _i2++) {
      promises.push(getUserRecordFromAuthentication(users[_i2], server, apiClient));
    }
    return Promise.all(promises).then(function (responses) {
      var usersResult = [];
      var userRemoved;
      for (var _i3 = 0, _length3 = responses.length; _i3 < _length3; _i3++) {
        if (responses[_i3].IsError) {
          if (responses[_i3].UserRemoved) {
            userRemoved = true;
          }
        } else {
          usersResult.push(responses[_i3]);
        }
      }

      // in case a user was removed
      if (userRemoved) {
        _credentials.default.addOrUpdateServer(credentials.Servers, server);
        _credentials.default.credentials(credentials);
      }
      return usersResult;
    });
  };
  ConnectionManager.prototype.validateCanChangeToUser = function (apiClient, userId) {
    var credentials = _credentials.default.credentials();
    var serverId = apiClient.serverId();
    var servers = credentials.Servers.slice(0);
    var server;
    for (var i = 0, length = servers.length; i < length; i++) {
      if (servers[i].Id === serverId) {
        server = servers[i];
        break;
      }
    }
    if (!server) {
      return Promise.reject();
    }
    var users = (server.Users || []).slice(0);
    var user;
    for (var _i4 = 0, _length4 = users.length; _i4 < _length4; _i4++) {
      if (users[_i4].UserId === userId) {
        user = users[_i4];
        break;
      }
    }
    if (!user) {
      return Promise.reject();
    }
    var instance = this;
    return validateAuthentication(instance, server, user, apiClient.serverAddress()).catch(function (err) {
      if (_credentials.default.addOrUpdateServer(credentials.Servers, server)) {
        _credentials.default.credentials(credentials);
      }
      return Promise.reject(err);
    });
  };
  ConnectionManager.prototype.changeToUser = function (apiClient, userId) {
    var instance = this;
    return this.validateCanChangeToUser(apiClient, userId).then(function () {
      var credentials = _credentials.default.credentials();
      var serverId = apiClient.serverId();
      var servers = credentials.Servers.slice(0);
      var server;
      for (var i = 0, length = servers.length; i < length; i++) {
        if (servers[i].Id === serverId) {
          server = servers[i];
          break;
        }
      }
      if (!server) {
        return Promise.reject();
      }
      var users = (server.Users || []).slice(0);
      var user;
      for (var _i5 = 0, _length5 = users.length; _i5 < _length5; _i5++) {
        if (users[_i5].UserId === userId) {
          user = users[_i5];
          break;
        }
      }
      if (!user) {
        return Promise.reject();
      }
      return apiClient.getUser(user.UserId).then(function (fullUserFromServer) {
        return onAuthenticated.call(instance, apiClient, {
          ServerId: serverId,
          User: fullUserFromServer,
          AccessToken: user.AccessToken
        });
      });
    });
  };
  var _default = _exports.default = new ConnectionManager();
});
