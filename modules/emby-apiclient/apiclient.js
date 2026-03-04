define(["exports", "./events.js", "./../common/servicelocator.js", "./../common/querystring.js", "./../common/qualitydetection.js"], function (_exports, _events, _servicelocator, _querystring, _qualitydetection) {
  Object.defineProperty(_exports, "__esModule", {
    value: true
  });
  _exports.default = void 0;
  /* jshint module: true */

  var globalize;
  var userSettings;
  function importGlobalize() {
    return Emby.importModule('./modules/common/globalize.js').then(function (globalizeModule) {
      globalize = globalizeModule;
      return globalizeModule;
    });
  }
  function loadGlobalize() {
    if (globalize) {
      return Promise.resolve(globalize);
    }
    return importGlobalize();
  }
  function importUserSettings() {
    return Emby.importModule('./modules/common/usersettings/usersettings.js').then(function (userSettingsModule) {
      userSettings = userSettingsModule;
      return userSettingsModule;
    });
  }
  function loadUserSettings() {
    if (userSettings) {
      return Promise.resolve(userSettings);
    }
    return importUserSettings();
  }
  var localPrefix = 'local';
  function isLocalId(str) {
    return str && str.startsWith(localPrefix);
  }
  function isNotLocalId(id) {
    return !isLocalId(id);
  }
  function isLocalItem(item) {
    if (item) {
      var id = item.Id;
      if (typeof id === 'string' && isLocalId(id)) {
        return true;
      }
    }
    return false;
  }
  function replaceAll(originalString, strReplace, strWith) {
    var reg = new RegExp(strReplace, 'ig');
    return originalString.replace(reg, strWith);
  }
  function getAbortError() {
    var err = new Error('AbortError');
    err.name = 'AbortError';
    return err;
  }
  function getFetchPromise(instance, request, signal) {
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
    var url = request.url;
    if (contentType === 'application/json') {
      contentType = 'text/plain';
      url += url.includes('?') ? '&' : '?';
      url += 'reqformat=json';
    }
    if (contentType) {
      headers['Content-Type'] = contentType;
    }
    return fetch(url, fetchRequest);
  }
  function setSavedEndpointInfo(instance, info) {
    instance._endPointInfo = info;
  }
  function setServerAddress(instance, address) {
    instance._serverAddress = address;
    _events.default.trigger(instance, 'serveraddresschanged', [{
      apiClient: instance,
      address: address
    }]);
  }
  function onNetworkChanged(instance, resetAddress) {
    if (resetAddress) {
      instance.connected = false;
      var serverInfo = instance.serverInfo();
      var addresses = getAddresses(serverInfo);
      if (addresses.length) {
        setServerAddress(instance, addresses[0].url);
      }
    }
    setSavedEndpointInfo(instance, null);
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
  function getAddresses(serverInfo) {
    var addresses = [];
    var addressesStrings = [];
    if (serverInfo.ManualAddress && isLocalHostAddress(serverInfo.ManualAddress) && !addressesStrings.includes(serverInfo.ManualAddress.toLowerCase())) {
      addresses.push({
        url: serverInfo.ManualAddress
      });
      addressesStrings.push(addresses[addresses.length - 1].url.toLowerCase());
    }
    if (serverInfo.LocalAddress && !addressesStrings.includes(serverInfo.LocalAddress.toLowerCase())) {
      addresses.push({
        url: serverInfo.LocalAddress
      });
      addressesStrings.push(addresses[addresses.length - 1].url.toLowerCase());
    }
    if (serverInfo.ManualAddress && !addressesStrings.includes(serverInfo.ManualAddress.toLowerCase())) {
      addresses.push({
        url: serverInfo.ManualAddress
      });
      addressesStrings.push(addresses[addresses.length - 1].url.toLowerCase());
    }
    if (serverInfo.RemoteAddress && !addressesStrings.includes(serverInfo.RemoteAddress.toLowerCase())) {
      addresses.push({
        url: serverInfo.RemoteAddress
      });
      addressesStrings.push(addresses[addresses.length - 1].url.toLowerCase());
    }
    console.log("getAddresses: " + addressesStrings.join('|'));
    return addresses;
  }
  function tryReconnectToUrl(instance, url, delay, signal) {
    console.log("tryReconnectToUrl: " + url);
    return setTimeoutPromise(delay).then(function () {
      return getFetchPromise(instance, {
        url: instance.getUrl('system/info/public', null, url),
        type: 'GET',
        dataType: 'json',
        timeout: 15000
      }, signal).then(function () {
        return url;
      });
    });
  }
  function setTimeoutPromise(timeout) {
    return new Promise(function (resolve) {
      setTimeout(resolve, timeout);
    });
  }
  function tryReconnectInternal(instance, signal) {
    var serverInfo = instance.serverInfo();
    var addresses = getAddresses(serverInfo);
    if (!addresses.length) {
      return Promise.reject();
    }
    if (addresses.length === 1) {
      return Promise.resolve(addresses[0].url);
    }
    var abortController = new AbortController();
    if (signal) {
      signal = AbortSignal.any([signal, abortController.signal]);
    } else {
      signal = abortController.signal;
    }
    var promises = [];
    for (var i = 0, length = addresses.length; i < length; i++) {
      promises.push(tryReconnectToUrl(instance, addresses[i].url, i * 200, signal));
    }
    return Promise.any(promises).then(function (url) {
      instance.serverAddress(url);
      abortController.abort();
      return Promise.resolve(url);
    });
  }
  function tryReconnect(instance, signal) {
    var retryCount = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : 0;
    var promise = tryReconnectInternal(instance, signal);
    if (retryCount >= 2) {
      return promise;
    }
    return promise.catch(function (err) {
      console.log("error in tryReconnectInternal: " + (err || ''));
      return setTimeoutPromise(500).then(function () {
        return tryReconnect(instance, signal, retryCount + 1);
      });
    });
  }
  function getUserCacheKey(userId, serverId) {
    var key = "user-" + userId + "-" + serverId;
    return key;
  }
  function getCachedUser(instance, userId) {
    var serverId = instance.serverId();
    if (!serverId) {
      return null;
    }
    var json = _servicelocator.appStorage.getItem(getUserCacheKey(userId, serverId));
    if (json) {
      var user = JSON.parse(json);
      if (user) {
        setUserProperties(user, serverId);
      }
      return user;
    }
    return null;
  }
  function isUserLoggedIn(instance, userId) {
    var _instance$_serverInfo;
    if (!instance._userAuthInfo) {
      return false;
    }
    var allUsers = ((_instance$_serverInfo = instance._serverInfo) == null ? void 0 : _instance$_serverInfo.Users) || [];
    for (var i = 0, length = allUsers.length; i < length; i++) {
      if (allUsers[i].UserId === userId) {
        return true;
      }
    }
    return userId === instance.getCurrentUserId();
  }
  function saveUserInCache(instance, user, forceSave) {
    var serverId = instance.serverId();
    setUserProperties(user, serverId);
    if (!forceSave && !isUserLoggedIn(instance, user.Id)) {
      return;
    }
    user.DateLastFetched = Date.now();
    _servicelocator.appStorage.setItem(getUserCacheKey(user.Id, user.ServerId), JSON.stringify(user));
  }
  function removeCachedUser(userId, serverId) {
    _servicelocator.appStorage.removeItem(getUserCacheKey(userId, serverId));
  }
  function updateCachedUser(instance, userId) {
    return instance.getUser(userId, false);
  }
  function updateCachedUserConfig(instance, userId, config) {
    var user = getCachedUser(instance, userId);
    if (!user) {
      return updateCachedUser(instance, userId);
    }
    user.Configuration = Object.assign(user.Configuration, config || {});
    saveUserInCache(instance, user);
    return Promise.resolve();
  }
  function onWebSocketMessage(msg) {
    var instance = this;
    msg = JSON.parse(msg.data);
    onMessageReceivedInternal(instance, msg);
  }
  var messageIdsReceived = {};
  function onMessageReceivedInternal(instance, msg) {
    var messageId = msg.MessageId;
    if (messageId) {
      // message was already received via another protocol
      if (messageIdsReceived[messageId]) {
        return;
      }
      messageIdsReceived[messageId] = true;
    }
    var msgType = msg.MessageType;
    if (msgType === "UserUpdated" || msgType === "UserConfigurationUpdated" || msgType === "UserPolicyUpdated") {
      var user = msg.Data;
      if (user.Id === instance.getCurrentUserId()) {
        saveUserInCache(instance, user);
        instance._userViewsPromise = null;
      }
    } else if (msgType === 'LibraryChanged') {
      // This might be a little aggressive improve this later
      instance._userViewsPromise = null;
    }
    _events.default.trigger(instance, 'message', [msg]);
  }
  function onWebSocketOpen() {
    var instance = this;
    console.log('web socket connection opened');
    _events.default.trigger(instance, 'websocketopen');
    var list = this.messageListeners;
    if (list) {
      list = list.slice(0);
      for (var i = 0, length = list.length; i < length; i++) {
        var listener = list[i];
        this.startMessageListener(listener.name, listener.options);
      }
    }
  }
  function onWebSocketError() {
    var instance = this;
    _events.default.trigger(instance, 'websocketerror');
  }
  function setSocketOnClose(apiClient, socket) {
    socket.onclose = function () {
      console.log('web socket closed');
      if (apiClient._webSocket === socket) {
        console.log('nulling out web socket');
        apiClient._webSocket = null;
      }
      setTimeout(function () {
        _events.default.trigger(apiClient, 'websocketclose');
      }, 0);
    };
  }
  function detectBitrateWithEndpointInfo(instance, endpointInfo) {
    var networkType = endpointInfo.NetworkType;
    if (networkType !== 'lan') {
      var currentUser = instance.getCurrentUserCached();
      if (currentUser != null && currentUser.Policy.AutoRemoteQuality) {
        return Promise.resolve(currentUser.Policy.AutoRemoteQuality);
      }
    }
    return _qualitydetection.default.getDefaultQuality(networkType);
  }
  function getRemoteImagePrefix(instance, options) {
    var urlPrefix = "Items/" + options.itemId;
    delete options.itemId;
    return urlPrefix;
  }
  function modifyEpgRow(result) {
    result.Type = 'EpgChannel';
    result.ServerId = this.serverId();
    result.Id = result.Channel.Id;
  }
  function modifyEpgResponse(result) {
    result.Items.forEach(modifyEpgRow.bind(this));
    return result;
  }
  function mapVirtualFolder(item) {
    item.Type = 'VirtualFolder';
    item.Id = item.ItemId;
    item.IsFolder = true;
  }
  function setSyncJobProperties(item, apiClient) {
    item.Type = 'SyncJob';
    item.ServerId = apiClient.serverId();
  }
  function setUsersProperties(items, serverId) {
    for (var i = 0, length = items.length; i < length; i++) {
      setUserProperties(items[i], serverId);
    }
    return Promise.resolve(items);
  }
  function setUserProperties(user, serverId) {
    user.Type = 'User';
    user.ServerId = serverId;
  }
  function setLogsProperties(instance, items) {
    var serverId = instance.serverId();
    var canDownload = _servicelocator.appHost.supports('filedownload');
    var canShare = false; // appHost.supports('sharing');

    for (var i = 0, length = items.length; i < length; i++) {
      var log = items[i];
      log.ServerId = serverId;
      log.Type = 'Log';
      log.Id = log.Name;
      log.CanDownload = canDownload;
      log.CanShare = canShare;
    }
    return items;
  }
  function setApiKeysProperties(instance, response) {
    var serverId = instance.serverId();
    for (var i = 0, length = response.Items.length; i < length; i++) {
      var log = response.Items[i];
      log.ServerId = serverId;
      log.Type = 'ApiKey';
      log.CanDelete = true;
    }
    return response;
  }
  function normalizeImageOptions(_ref, options) {
    var _devicePixelRatio = _ref._devicePixelRatio;
    if (options.adjustForPixelRatio !== false) {
      var ratio = _devicePixelRatio || 1;
      if (ratio) {
        if (options.width) {
          options.width = Math.round(options.width * ratio);
        }
        if (options.height) {
          options.height = Math.round(options.height * ratio);
        }
        if (options.maxWidth) {
          options.maxWidth = Math.round(options.maxWidth * ratio);
        }
        if (options.maxHeight) {
          options.maxHeight = Math.round(options.maxHeight * ratio);
        }
      }
    }

    // Don't put these on the query string
    delete options.adjustForPixelRatio;
    if (options.keepAnimation === false) {
      delete options.keepAnimation;
    }
    if (!options.quality) {
      // TODO: In low bandwidth situations we could do 60/50
      if (options.type === 'Backdrop') {
        options.quality = 70;
      } else {
        options.quality = 90;
      }
    }
  }
  function fillTagProperties(result) {
    var serverId = this.serverId();
    var items = result.Items || result;
    var type = 'Tag';
    for (var i = 0, length = items.length; i < length; i++) {
      var item = items[i];
      item.ServerId = serverId;
      item.Type = type;
    }
    return result;
  }
  function mapToId(i) {
    return i.Id;
  }
  function mapToAccessToken(i) {
    return i.AccessToken;
  }
  function removeItemAll(arr, value) {
    var i = 0;
    while (i < arr.length) {
      if (arr[i] === value) {
        arr.splice(i, 1);
      } else {
        ++i;
      }
    }
    return arr;
  }
  var startingPlaySession = Date.now();
  function onUserDataUpdated(userData) {
    var obj = this;
    var instance = obj.instance;
    var itemId = obj.itemId;
    var userId = obj.userId;
    userData.ItemId = itemId;
    _events.default.trigger(instance, 'message', [{
      MessageType: 'UserDataChanged',
      Data: {
        UserId: userId,
        UserDataList: [userData],
        IsLocalEvent: true
      }
    }]);
    return userData;
  }
  function onSeriesTimerCreated(result) {
    var obj = this;
    var instance = obj.instance;
    if (!result) {
      result = {};
    }
    _events.default.trigger(instance, 'message', [{
      MessageType: 'SeriesTimerCreated',
      Data: Object.assign({
        IsLocalEvent: true
      }, result)
    }]);
    return result;
  }
  function onSeriesTimerUpdated(result) {
    var obj = this;
    var instance = obj.instance;
    var itemId = obj.itemId;
    _events.default.trigger(instance, 'message', [{
      MessageType: 'SeriesTimerUpdated',
      Data: {
        Id: itemId,
        IsLocalEvent: true
      }
    }]);
    return result;
  }
  function onSeriesTimerCancelled(result) {
    var obj = this;
    var instance = obj.instance;
    var itemId = obj.itemId;
    _events.default.trigger(instance, 'message', [{
      MessageType: 'SeriesTimerCancelled',
      Data: {
        Id: itemId,
        IsLocalEvent: true
      }
    }]);
    return result;
  }
  function onPluginsUninstalled(result) {
    var obj = this;
    var instance = obj.instance;
    _events.default.trigger(instance, 'message', [{
      MessageType: 'PluginsUninstalled',
      Data: {
        Ids: [],
        IsLocalEvent: true
      }
    }]);
    return result;
  }
  function onUsersDeleted(result) {
    var obj = this;
    var instance = obj.instance;
    _events.default.trigger(instance, 'message', [{
      MessageType: 'UsersDeleted',
      Data: {
        Ids: [],
        IsLocalEvent: true
      }
    }]);
    return result;
  }
  function onUserNotificationsSaved(result) {
    var obj = this;
    var instance = obj.instance;
    _events.default.trigger(instance, 'message', [{
      MessageType: 'UserNotificationsSaved',
      Data: {
        Ids: [],
        IsLocalEvent: true
      }
    }]);
    return result;
  }
  function onUserNotificationsDeleted(result) {
    var obj = this;
    var instance = obj.instance;
    _events.default.trigger(instance, 'message', [{
      MessageType: 'UserNotificationsDeleted',
      Data: {
        Ids: [],
        IsLocalEvent: true
      }
    }]);
    return result;
  }
  function onScheduledTaskTriggersUpdated(result) {
    var obj = this;
    var instance = obj.instance;
    _events.default.trigger(instance, 'message', [{
      MessageType: 'ScheduledTaskTriggersUpdated',
      Data: {
        Ids: [],
        IsLocalEvent: true
      }
    }]);
    return result;
  }
  function onDevicesDeleted(result) {
    var obj = this;
    var instance = obj.instance;
    _events.default.trigger(instance, 'message', [{
      MessageType: 'DevicesDeleted',
      Data: {
        Ids: [],
        IsLocalEvent: true
      }
    }]);
    return result;
  }
  function onApiKeyCreated(result) {
    var obj = this;
    var instance = obj.instance;
    _events.default.trigger(instance, 'message', [{
      MessageType: 'ApiKeyCreated',
      Data: {
        Ids: [],
        IsLocalEvent: true
      }
    }]);
    return result;
  }
  function onApiKeysDeleted(result) {
    var obj = this;
    var instance = obj.instance;
    _events.default.trigger(instance, 'message', [{
      MessageType: 'ApiKeysDeleted',
      Data: {
        Ids: [],
        IsLocalEvent: true
      }
    }]);
    return result;
  }
  function onLiveTVGuideSourcesDeleted(result) {
    var obj = this;
    var instance = obj.instance;
    _events.default.trigger(instance, 'message', [{
      MessageType: 'LiveTVGuideSourcesDeleted',
      Data: {
        Ids: [],
        IsLocalEvent: true
      }
    }]);
    return result;
  }
  function onLiveTVTunerDevicesDeleted(result) {
    var obj = this;
    var instance = obj.instance;
    _events.default.trigger(instance, 'message', [{
      MessageType: 'LiveTVTunerDevicesDeleted',
      Data: {
        Ids: [],
        IsLocalEvent: true
      }
    }]);
    return result;
  }
  function onItemsUpdated(result) {
    var obj = this;
    var instance = obj.instance;
    var itemIds = obj.itemIds;
    _events.default.trigger(instance, 'message', [{
      MessageType: 'LibraryChanged',
      Data: {
        ItemsAdded: [],
        ItemsRemoved: [],
        ItemsUpdated: itemIds,
        IsLocalEvent: true
      }
    }]);
    return result;
  }
  function onItemUpdated(result) {
    var obj = this;
    var instance = obj.instance;
    var itemId = obj.itemId;
    _events.default.trigger(instance, 'message', [{
      MessageType: 'LibraryChanged',
      Data: {
        ItemsAdded: [],
        ItemsRemoved: [],
        ItemsUpdated: [itemId],
        IsLocalEvent: true
      }
    }]);
    return result;
  }
  function onSyncJobCreated(result) {
    var obj = this;
    var instance = obj.instance;
    _events.default.trigger(instance, 'message', [{
      MessageType: 'SyncJobCreated',
      Data: {
        IsLocalEvent: true
      }
    }]);
    return result;
  }
  function onSyncJobCancelled(result) {
    var obj = this;
    var instance = obj.instance;
    _events.default.trigger(instance, 'message', [{
      MessageType: 'SyncJobCancelled',
      Data: {
        IsLocalEvent: true
      }
    }]);
    return result;
  }
  function onSyncJobItemCancelled(result) {
    var obj = this;
    var instance = obj.instance;
    _events.default.trigger(instance, 'message', [{
      MessageType: 'SyncJobItemCancelled',
      Data: {
        IsLocalEvent: true
      }
    }]);
    return result;
  }
  function onChannelManagementInfoUpdated(result) {
    var obj = this;
    var instance = obj.instance;
    var id = obj.id;
    _events.default.trigger(instance, 'message', [{
      MessageType: 'ChannelManagementInfoUpdated',
      Data: {
        Channel: result,
        Id: id,
        IsLocalEvent: true
      }
    }]);
    return result;
  }
  function onChannelManagementSortIndexUpdated(result) {
    var obj = this;
    var instance = obj.instance;
    var id = obj.id;
    _events.default.trigger(instance, 'message', [{
      MessageType: 'ChannelManagementInfoUpdated',
      Data: {
        Id: id,
        IsLocalEvent: true
      }
    }]);
    return result;
  }
  function onItemsDeleted(result) {
    var obj = this;
    var instance = obj.instance;
    var items = obj.items;
    var foldersRemovedFrom = [];
    var itemsRemoved = [];
    for (var i = 0, length = items.length; i < length; i++) {
      var item = items[i];
      if (item.ParentId) {
        foldersRemovedFrom.push(item.ParentId);
      }
      itemsRemoved.push(item.Id);
    }
    _events.default.trigger(instance, 'message', [{
      MessageType: 'LibraryChanged',
      Data: {
        ItemsAdded: [],
        ItemsRemoved: itemsRemoved,
        ItemsUpdated: [],
        FoldersRemovedFrom: foldersRemovedFrom,
        IsLocalEvent: true
      }
    }]);
    return result;
  }
  function onItemsMovedInPlaylist(result) {
    var obj = this;
    var instance = obj.instance;
    var playlistItemIds = obj.playlistItemIds;
    var playlistId = obj.playlistId;
    _events.default.trigger(instance, 'message', [{
      MessageType: 'ItemsMovedInPlaylist',
      Data: {
        PlaylistId: playlistId,
        PlaylistItemIds: playlistItemIds,
        IsLocalEvent: true
      }
    }]);
    return result;
  }
  function onItemsRemovedFromPlaylist(result) {
    var obj = this;
    var instance = obj.instance;
    var playlistItemIds = obj.playlistItemIds;
    var playlistId = obj.playlistId;
    _events.default.trigger(instance, 'message', [{
      MessageType: 'ItemsRemovedFromPlaylist',
      Data: {
        PlaylistId: playlistId,
        PlaylistItemIds: playlistItemIds,
        IsLocalEvent: true
      }
    }]);
    return result;
  }
  function onItemsRemovedFromCollections(result) {
    var obj = this;
    var instance = obj.instance;
    var collections = obj.collections;
    for (var i = 0, length = collections.length; i < length; i++) {
      var collection = collections[i];
      _events.default.trigger(instance, 'message', [{
        MessageType: 'ItemsRemovedFromCollection',
        Data: {
          CollectionId: collection.Id,
          ItemIds: collection.ItemIds,
          IsLocalEvent: true
        }
      }]);
    }
    return result;
  }
  function getCachedWakeOnLanInfo(instance) {
    var serverId = instance.serverId();
    var json = _servicelocator.appStorage.getItem("server-" + serverId + "-wakeonlaninfo");
    if (json) {
      return JSON.parse(json);
    }
    return [];
  }
  function onWakeOnLanInfoFetched(instance, info) {
    var serverId = instance.serverId();
    _servicelocator.appStorage.setItem("server-" + serverId + "-wakeonlaninfo", JSON.stringify(info));
  }
  function sendNextWakeOnLan(infos, index) {
    if (index >= infos.length) {
      return Promise.resolve();
    }
    var info = infos[index];
    console.log("sending wakeonlan to " + info.MacAddress);
    function goNext() {
      return sendNextWakeOnLan(infos, index + 1);
    }
    return _servicelocator.wakeOnLan.send(info).then(goNext, goNext);
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
  function setScheduledTaskProperties(item, apiClient) {
    var serverId = apiClient.serverId();
    item.Type = 'ScheduledTask';
    item.ServerId = serverId;
    var triggers = item.Triggers || [];
    for (var i = 0, length = triggers.length; i < length; i++) {
      var trigger = triggers[i];
      trigger.ScheduledTaskId = item.Id;
      trigger.TriggerIndex = i;
      trigger.TriggerType = trigger.Type;
      trigger.Type = 'ScheduledTaskTrigger';
      trigger.ServerId = serverId;
    }
  }
  function setDeviceProperies(item, apiClient) {
    item.Type = 'Device';
    item.ServerId = apiClient.serverId();
    item.PrimaryImageAspectRatio = 1;
    var iconUrl = item.IconUrl;
    if (iconUrl) {
      if (iconUrl.indexOf('://') === -1) {
        iconUrl = apiClient.getUrl(iconUrl);
      }
    }
    item.ImageUrl = iconUrl;
  }
  function updateTagItemsResponse(promise, query) {
    return promise.then(function (result) {
      var outerIds = query.OuterIds ? query.OuterIds.split(',') : [];
      if (outerIds.length) {
        result.Items = result.Items.filter(function (i) {
          return outerIds.includes(i.Id);
        });
      }
      if (!result.TotalRecordCount && query.EnableTotalRecordCount !== false) {
        result.TotalRecordCount = result.Items.length;
      }
      return result;
    });
  }
  function getUrl(name, params, serverAddress) {
    if (!name) {
      throw new Error("Url name cannot be empty");
    }
    var url = serverAddress || this._serverAddress;
    if (!url) {
      throw new Error("serverAddress is yet not set");
    }
    if (url.endsWith('/')) {
      url = url.substring(0, url.length - 1);
    }
    var lowered = url.toLowerCase();
    if (!lowered.endsWith('/emby') && !lowered.endsWith('/mediabrowser')) {
      url += '/emby';
    }
    if (name) {
      if (!name.startsWith('/')) {
        url += '/';
      }
      url += name;
    }
    if (params) {
      params = _querystring.default.paramsToString(params);
      if (params) {
        url += "?" + params;
      }
    }
    return url;
  }
  function getNetworkType(endpointInfo) {
    if (endpointInfo.IsInNetwork) {
      return 'lan';
    } else {
      if (typeof navigator !== 'undefined') {
        var connection = navigator.connection;
        if (connection) {
          if (connection.type === 'cellular') {
            return 'cellular';
          }
          var effectiveType = connection.effectiveType;
          if (effectiveType === 'slow-2g' || effectiveType === '2g' || effectiveType === '3g') {
            return 'cellular';
          }
        }
      }
      return 'wan';
    }
  }
  function normalizeFields(options) {
    if (options != null && options.fields) {
      if (!_servicelocator.appHost.supports('sync')) {
        var fields = options.fields.split(',');
        fields = removeItemAll(fields, 'SyncStatus');
        fields = removeItemAll(fields, 'ContainerSyncStatus');
        options.fields = fields.join(',');
      }
    }
    if (options != null && options.Fields) {
      if (!_servicelocator.appHost.supports('sync')) {
        var _fields = options.Fields.split(',');
        _fields = removeItemAll(_fields, 'SyncStatus');
        _fields = removeItemAll(_fields, 'ContainerSyncStatus');
        options.Fields = _fields.join(',');
      }
    }
  }
  function formatCountryDisplayNames(result) {
    return loadGlobalize().then(function (globalize) {
      var displayNames = new Intl.DisplayNames(globalize.getCurrentLocales(), {
        type: 'region',
        fallback: 'none'
      });
      for (var i = 0, length = result.length; i < length; i++) {
        var country = result[i];
        var code = country.TwoLetterISORegionName;
        if (code) {
          try {
            var displayName = displayNames.of(code);
            if (displayName) {
              country.DisplayName = displayName;
            }
          } catch (err) {
            console.log('error thrown by Intl.DisplayNames: ' + err + '. Code: ' + code);
          }
        }
      }
      return result;
    });
  }
  var StandardWidths = [480, 720, 1280, 1920, 2560, 3840];
  function ApiClient(serverAddress, appName, appVersion, deviceName, deviceId, devicePixelRatio) {
    if (!serverAddress) {
      throw new Error("Must supply a serverAddress");
    }
    if (!appName) {
      throw new Error("Must supply a appName");
    }
    if (!appVersion) {
      throw new Error("Must supply a appVersion");
    }
    if (!deviceName) {
      throw new Error("Must supply a deviceName");
    }
    if (!deviceId) {
      throw new Error("Must supply a deviceId");
    }
    console.log("ApiClient serverAddress: " + serverAddress);
    console.log("ApiClient appName: " + appName);
    console.log("ApiClient appVersion: " + appVersion);
    console.log("ApiClient deviceName: " + deviceName);
    console.log("ApiClient deviceId: " + deviceId);
    this._serverInfo = {};
    this._userAuthInfo = {};
    this._serverAddress = serverAddress;
    this._deviceId = deviceId;
    this._deviceName = deviceName;
    this._appName = appName;
    this._appVersion = appVersion;
    this._devicePixelRatio = devicePixelRatio;
  }
  ApiClient.prototype.appName = function () {
    return this._appName;
  };
  ApiClient.prototype.setAuthorizationInfoIntoRequest = function (request, includeAccessToken) {
    var authValues = {};
    var appName = this._appName;
    if (appName) {
      authValues['X-Emby-Client'] = appName;
    }
    if (this._deviceName) {
      authValues['X-Emby-Device-Name'] = this._deviceName;
    }
    if (this._deviceId) {
      authValues['X-Emby-Device-Id'] = this._deviceId;
    }
    if (this._appVersion) {
      authValues['X-Emby-Client-Version'] = this._appVersion;
    }
    if (includeAccessToken !== false) {
      var accessToken = this.accessToken();
      if (accessToken) {
        authValues['X-Emby-Token'] = accessToken;
      }
    }
    var lang = this.getCurrentLocale();
    if (lang) {
      authValues['X-Emby-Language'] = lang;
    }
    var queryParams = new URLSearchParams(authValues).toString();
    if (queryParams) {
      var url = request.url;
      url += !url.includes('?') ? '?' : '&';
      url += queryParams;
      request.url = url;
    }
  };
  ApiClient.prototype.appVersion = function () {
    return this._appVersion;
  };
  ApiClient.prototype.deviceName = function () {
    return this._deviceName;
  };
  ApiClient.prototype.deviceId = function () {
    return this._deviceId;
  };

  /**
   * Gets the server address.
   */
  ApiClient.prototype.serverAddress = function (val) {
    if (val != null) {
      if (!val.toLowerCase().startsWith('http')) {
        throw new Error("Invalid url: " + val);
      }
      setServerAddress(this, val);
      onNetworkChanged(this);
    }
    return this._serverAddress;
  };
  ApiClient.prototype.onNetworkChanged = function () {
    onNetworkChanged(this, true);
  };
  ApiClient.prototype.fetchWithFailover = function (request, enableReconnection, signal) {
    console.log("apiclient.fetchWithFailover " + request.url);
    request.timeout = 30000;
    var instance = this;
    return getFetchPromise(this, request, signal).then(function (response) {
      instance.connected = true;
      if (response.status < 400) {
        if (request.dataType === 'json' || request.headers.accept === 'application/json') {
          return response.json();
        } else if (request.dataType === 'text' || (response.headers.get('Content-Type') || '').toLowerCase().startsWith('text/')) {
          return response.text();
        } else if (response.status === 204) {
          // Without this, the http connection gets ended via TCP disconnect. This ends the http connection even when keep-alive is set.
          return response.text();
        } else {
          return response;
        }
      } else {
        return Promise.reject(response);
      }
    }, function (error) {
      if (!error) {
        console.log("Request timed out to " + request.url);
      } else if (error.name === 'AbortError') {
        console.log("AbortError: " + request.url);
      } else {
        console.log("Request failed to " + request.url + " " + (error.status || '') + " " + error.toString());
      }
      if ((!error || !error.status) && enableReconnection) {
        console.log("Attempting reconnection");
        var previousServerAddress = instance.serverAddress();
        return tryReconnect(instance, signal, null).then(function (newServerAddress) {
          console.log("Reconnect succeeded to " + newServerAddress);
          instance.connected = true;
          if (instance.enableWebSocketAutoConnect) {
            instance.ensureWebSocket();
          }
          request.url = request.url.replace(previousServerAddress, newServerAddress);
          console.log("Retrying request with new url: " + request.url);
          return instance.fetchWithFailover(request, false, signal);
        });
      } else {
        console.log("Reporting request failure");
        throw error;
      }
    });
  };
  ApiClient.prototype.fetch = function (request, includeAccessToken, signal) {
    if (!request) {
      throw new Error("Request cannot be null");
    }
    request.headers = request.headers || {};
    this.setAuthorizationInfoIntoRequest(request, includeAccessToken);
    if (this.enableAutomaticNetworking === false || request.type !== "GET") {
      return getFetchPromise(this, request, signal).then(function (response) {
        if (response.status < 400) {
          if (request.dataType === 'json' || request.headers.accept === 'application/json') {
            return response.json();
          } else if (request.dataType === 'text' || (response.headers.get('Content-Type') || '').toLowerCase().startsWith('text/')) {
            return response.text();
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
    return this.fetchWithFailover(request, true, signal);
  };
  ApiClient.prototype.setAuthenticationInfo = function (userAuthInfo) {
    if (!userAuthInfo) {
      userAuthInfo = {};
    }
    if (this._userAuthInfo.UserId !== userAuthInfo.UserId) {
      this._userViewsPromise = null;
    }
    this._userAuthInfo = userAuthInfo;
  };
  ApiClient.prototype.serverInfo = function (info) {
    if (info) {
      var currentUserId = this.getCurrentUserId();
      this._serverInfo = info;
      if (currentUserId !== this.getCurrentUserId()) {
        this._userViewsPromise = null;
      }
    }
    return this._serverInfo;
  };

  /**
   * Gets or sets the current user id.
   */
  ApiClient.prototype.getCurrentUserName = function () {
    var userId = this.getCurrentUserId();
    if (!userId) {
      return null;
    }
    var user = getCachedUser(this, userId);
    return user == null ? null : user.Name;
  };

  /**
   * Gets or sets the current user id.
   */
  ApiClient.prototype.getCurrentUserId = function () {
    return this._userAuthInfo.UserId;
  };
  ApiClient.prototype.accessToken = function () {
    return this._userAuthInfo.AccessToken;
  };
  ApiClient.prototype.serverId = function () {
    return this.serverInfo().Id;
  };
  ApiClient.prototype.serverName = function () {
    return this.serverInfo().Name;
  };
  ApiClient.prototype.ajax = function (request, includeAccessToken) {
    if (!request) {
      throw new Error("Request cannot be null");
    }
    return this.fetch(request, includeAccessToken, request.signal);
  };

  /**
   * Gets or sets the current user id.
   */
  ApiClient.prototype.getCurrentUser = function (options) {
    var userId = this.getCurrentUserId();
    if (!userId) {
      return Promise.reject();
    }
    if (!options) {
      options = {};
    }
    return this.getUser(userId, options.enableCache, options.signal);
  };
  ApiClient.prototype.isLoggedIn = function () {
    var info = this._userAuthInfo;
    if (info) {
      if (info.UserId && info.AccessToken) {
        return true;
      }
    }
    return false;
  };
  ApiClient.prototype.logout = function () {
    var _this = this;
    this.closeWebSocket();
    var done = function () {
      _this.clearAuthenticationInfo();
      return Promise.resolve();
    };
    if (this.isLoggedIn()) {
      var url = this.getUrl("Sessions/Logout");
      return this.ajax({
        type: "POST",
        url: url,
        timeout: 10000
      }).then(done, done);
    }
    return done();
  };

  /**
   * Authenticates a user
   * @param {String} name
   * @param {String} password
   */
  ApiClient.prototype.authenticateUserByName = function (name, password) {
    if (!name) {
      return Promise.reject();
    }
    var url = this.getUrl("Users/authenticatebyname");
    var instance = this;
    var postData = {
      Username: name,
      Pw: password || ''
    };
    return instance.ajax({
      type: "POST",
      url: url,
      data: postData,
      dataType: "json"
    }).then(function (result) {
      instance._userViewsPromise = null;
      saveUserInCache(instance, result.User, true);
      var afterOnAuthenticated = function () {
        // to get image enhancer info
        instance.getSystemInfo();
        return result;
      };
      if (instance.onAuthenticated) {
        return instance.onAuthenticated(instance, result).then(afterOnAuthenticated);
      } else {
        afterOnAuthenticated();
        return result;
      }
    });
  };
  ApiClient.prototype.ensureWebSocket = function () {
    if (!this.connected) {
      return;
    }
    if (this.isWebSocketOpenOrConnecting() || !this.isWebSocketSupported()) {
      return;
    }
    try {
      this.openWebSocket();
    } catch (err) {
      console.log("Error opening web socket: " + (err || ''));
    }
  };
  ApiClient.prototype.openWebSocket = function () {
    var accessToken = this.accessToken();
    if (!accessToken) {
      throw new Error("Cannot open web socket without access token.");
    }
    var serverUrl = this._serverAddress || '';
    if (serverUrl.endsWith('/')) {
      serverUrl = serverUrl.substring(0, serverUrl.length - 1);
    }
    var hasSubdirectoryInServerAddress = serverUrl.toLowerCase().endsWith('/emby');
    var url;
    if (hasSubdirectoryInServerAddress) {
      url = this.getUrl("embywebsocket");
    } else {
      url = this.getUrl("socket");
      url = replaceAll(url, 'emby/socket', 'embywebsocket');
    }
    url = replaceAll(url, 'https:', 'wss:');
    url = replaceAll(url, 'http:', 'ws:');
    url += "?api_key=" + accessToken;
    url += "&deviceId=" + this.deviceId();
    console.log("opening web socket with url: " + url);
    var webSocket = new WebSocket(url);
    webSocket.onmessage = onWebSocketMessage.bind(this);
    webSocket.onopen = onWebSocketOpen.bind(this);
    webSocket.onerror = onWebSocketError.bind(this);
    setSocketOnClose(this, webSocket);
    this._webSocket = webSocket;
  };
  ApiClient.prototype.closeWebSocket = function () {
    var socket = this._webSocket;
    if (socket && socket.readyState === WebSocket.OPEN) {
      socket.close();
    }
  };
  ApiClient.prototype.sendWebSocketMessage = function (name, data) {
    console.log("Sending web socket message: " + name);
    var msg = {
      MessageType: name
    };
    if (data) {
      msg.Data = data;
    }
    msg = JSON.stringify(msg);
    this._webSocket.send(msg);
  };
  ApiClient.prototype.startMessageListener = function (name, options) {
    console.log("apiclient starting message listener " + name + " with options " + options);
    this.sendMessage(name + "Start", options);
    var list = this.messageListeners;
    if (!list) {
      this.messageListeners = list = [];
    }
    for (var i = 0, length = list.length; i < length; i++) {
      var listener = list[i];
      if (listener.name === name) {
        return;
      }
    }
    list.push({
      name: name,
      options: options
    });
  };
  ApiClient.prototype.stopMessageListener = function (name) {
    var list = this.messageListeners;
    if (list) {
      this.messageListeners = list.filter(function (n) {
        return n.name !== name;
      });
    }
    console.log("apiclient stopping message listener " + name);
    this.sendMessage(name + "Stop");
  };
  ApiClient.prototype.sendMessage = function (name, data) {
    if (this.isWebSocketOpen()) {
      this.sendWebSocketMessage(name, data);
    }
  };
  ApiClient.prototype.isMessageChannelOpen = function () {
    return this.isWebSocketOpen();
  };
  ApiClient.prototype.isWebSocketOpen = function () {
    var socket = this._webSocket;
    if (socket) {
      return socket.readyState === WebSocket.OPEN;
    }
    return false;
  };
  ApiClient.prototype.isWebSocketOpenOrConnecting = function () {
    var socket = this._webSocket;
    if (socket) {
      return socket.readyState === WebSocket.OPEN || socket.readyState === WebSocket.CONNECTING;
    }
    return false;
  };
  ApiClient.prototype.get = function (url) {
    return this.ajax({
      type: "GET",
      url: url
    });
  };
  ApiClient.prototype.getJSON = function (url, signal) {
    return this.fetch({
      url: url,
      type: 'GET',
      dataType: 'json'
    }, null, signal);
  };
  ApiClient.prototype.getText = function (url, signal) {
    return this.fetch({
      url: url,
      type: 'GET',
      dataType: 'text'
    }, null, signal);
  };
  ApiClient.prototype.updateServerInfo = function (server, serverUrl) {
    if (server == null) {
      throw new Error('server cannot be null');
    }
    this.serverInfo(server);
    if (!serverUrl) {
      throw new Error("serverUrl cannot be null. serverInfo: " + JSON.stringify(server));
    }
    console.log("Setting server address to " + serverUrl);
    this.serverAddress(serverUrl);
  };
  ApiClient.prototype.isWebSocketSupported = function () {
    try {
      return WebSocket != null;
    } catch (err) {
      return false;
    }
  };
  ApiClient.prototype.clearAuthenticationInfo = function () {
    this.setAuthenticationInfo(null);
  };
  ApiClient.prototype.encodeName = function (name) {
    name = name.split('/').join('-');
    name = name.split('&').join('-');
    name = name.split('?').join('-');
    var val = new URLSearchParams({
      name: name
    }).toString();
    return val.substring(val.indexOf('=') + 1).replace("'", '%27');
  };
  ApiClient.prototype.getProductNews = function () {
    var options = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
    var url = this.getUrl("News/Product", options);
    return this.getJSON(url);
  };
  ApiClient.prototype.detectBitrate = function (signal) {
    var instance = this;
    return instance.getEndpointInfo(signal).then(function (info) {
      return detectBitrateWithEndpointInfo(instance, info);
    }, function (err) {
      console.log("error in getEndpointInfo: " + (err || ''));
      return detectBitrateWithEndpointInfo(instance, {});
    });
  };

  /**
   * Gets an item from the server
   * Omit itemId to get the root folder.
   */
  ApiClient.prototype.getItem = function (userId, itemId, options, signal) {
    if (!itemId) {
      throw new Error("null itemId");
    }
    normalizeFields(options);
    var url = userId ? this.getUrl("Users/" + userId + "/Items/" + itemId, options) : this.getUrl("Items/" + itemId, options);
    return this.getJSON(url, signal);
  };

  /**
   * Gets the root folder from the server
   */
  ApiClient.prototype.getRootFolder = function (userId) {
    if (!userId) {
      throw new Error("null userId");
    }
    var url = this.getUrl("Users/" + userId + "/Items/Root");
    return this.getJSON(url);
  };
  ApiClient.prototype.getCurrentLocale = function () {
    return this.currentLocale;
  };
  ApiClient.prototype.setCurrentLocale = function (value) {
    this.currentLocale = value;
  };
  ApiClient.prototype.getNotificationTypes = function (options) {
    if (typeof options === 'string') {
      options = {};
    }
    return this.getJSON(this.getUrl('Notifications/Types', options));
  };
  ApiClient.prototype.sendTestUserNotification = function (options) {
    var url = this.getUrl("Notifications/Services/Test");
    return this.ajax({
      type: "POST",
      url: url,
      data: JSON.stringify(options),
      contentType: "application/json"
    });
  };
  ApiClient.prototype.saveUserNotification = function (options) {
    var url = this.getUrl("Notifications/Services/Configured");
    return this.ajax({
      type: "POST",
      url: url,
      data: JSON.stringify(options),
      contentType: "application/json"
    }).then(onUserNotificationsSaved.bind({
      instance: this,
      items: []
    }));
  };
  ApiClient.prototype.deleteUserNotifications = function (items) {
    var instance = this;
    return Promise.all(items.map(function (item) {
      return instance.ajax({
        url: instance.getUrl('Notifications/Services/Configured', {
          Id: item.Id,
          UserId: item.UserId
        }),
        type: 'DELETE'
      });
    })).then(onUserNotificationsDeleted.bind({
      instance: this,
      items: items
    }), onUserNotificationsDeleted.bind({
      instance: this,
      items: items
    }));
  };
  ApiClient.prototype.getFeatures = function (query) {
    if (!this.isMinServerVersion('4.8.0.20')) {
      return Promise.resolve([]);
    }
    return this.getJSON(this.getUrl('Features', query));
  };
  ApiClient.prototype.getRemoteImageProviders = function (options) {
    if (!options) {
      throw new Error("null options");
    }
    var urlPrefix = getRemoteImagePrefix(this, options);
    var url = this.getUrl(urlPrefix + "/RemoteImages/Providers", options);
    return this.getJSON(url);
  };
  ApiClient.prototype.getAvailableRemoteImages = function (options) {
    if (!options) {
      throw new Error("null options");
    }
    var urlPrefix = getRemoteImagePrefix(this, options);
    var url = this.getUrl(urlPrefix + "/RemoteImages", options);
    return this.getJSON(url);
  };
  ApiClient.prototype.downloadRemoteImage = function (options) {
    if (!options) {
      throw new Error("null options");
    }
    var itemId = options.itemId;
    var urlPrefix = getRemoteImagePrefix(this, options);
    var url = this.getUrl(urlPrefix + "/RemoteImages/Download", options);
    return this.ajax({
      type: "POST",
      url: url
    }).then(onItemUpdated.bind({
      instance: this,
      itemId: itemId
    }));
  };
  ApiClient.prototype.getRecordingFolders = function (userId) {
    var url = this.getUrl("LiveTv/Recordings/Folders", {
      userId: userId
    });
    return this.getJSON(url);
  };
  ApiClient.prototype.getLiveTvInfo = function (options) {
    var url = this.getUrl("LiveTv/Info", options || {});
    return this.getJSON(url);
  };
  ApiClient.prototype.getLiveTvGuideInfo = function (options) {
    var url = this.getUrl("LiveTv/GuideInfo", options || {});
    return this.getJSON(url);
  };
  ApiClient.prototype.getLiveTvChannel = function (id, userId) {
    if (!id) {
      throw new Error("null id");
    }
    var options = {};
    if (userId) {
      options.userId = userId;
    }
    var url = this.getUrl("LiveTv/Channels/" + id, options);
    return this.getJSON(url);
  };
  ApiClient.prototype.getLiveTvChannelsForManagement = function (query, signal) {
    var url = this.getUrl("LiveTv/Manage/Channels", query);
    return this.getJSON(url, signal);
  };
  ApiClient.prototype.setChannelDisabled = function (item, disabled) {
    var id = item.Id;
    var url = this.getUrl("LiveTv/Manage/Channels/" + id + "/Disabled", {
      ManagementId: item.ManagementId,
      Disabled: disabled
    });
    return this.ajax({
      type: "POST",
      url: url,
      contentType: "application/json",
      dataType: "json"
    }).then(onChannelManagementInfoUpdated.bind({
      instance: this,
      id: id
    }));
  };
  ApiClient.prototype.setChannelSortIndex = function (item, newIndex) {
    var id = item.Id;
    var url = this.getUrl("LiveTv/Manage/Channels/" + id + "/SortIndex", {
      ManagementId: item.ManagementId,
      NewIndex: newIndex
    });
    return this.ajax({
      type: "POST",
      url: url
    }).then(onChannelManagementSortIndexUpdated.bind({
      instance: this,
      id: id
    }));
  };
  ApiClient.prototype.getLiveTvChannels = function (options, signal) {
    var url = this.getUrl("LiveTv/Channels", options || {});
    return this.getJSON(url, signal);
  };
  ApiClient.prototype.getLiveTvPrograms = function () {
    var options = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
    var signal = arguments.length > 1 ? arguments[1] : undefined;
    if (options && options.LibrarySeriesId && isLocalId(options.LibrarySeriesId)) {
      return Promise.resolve({
        Items: [],
        TotalRecordCount: 0
      });
    }
    if (options.channelIds && options.channelIds.length > 1800) {
      return this.ajax({
        type: "POST",
        url: this.getUrl("LiveTv/Programs"),
        data: JSON.stringify(options),
        contentType: "application/json",
        dataType: "json",
        signal: signal
      });
    } else {
      return this.getJSON(this.getUrl("LiveTv/Programs", options), signal);
    }
  };
  ApiClient.prototype.getEpg = function () {
    var options = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
    var signal = arguments.length > 1 ? arguments[1] : undefined;
    options.AddCurrentProgram = false;
    options.EnableUserData = false;
    options.EnableImageTypes = "Primary";
    options.UserId = this.getCurrentUserId();

    // earlier server versions will throw an error
    if (options.Limit === 0 && !this.isMinServerVersion('4.8.0.46')) {
      options.Limit = 1;
    }
    return this.getJSON(this.getUrl("LiveTv/EPG", options), signal).then(modifyEpgResponse.bind(this));
  };
  ApiClient.prototype.getLiveTvRecommendedPrograms = function () {
    var options = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
    return this.getJSON(this.getUrl("LiveTv/Programs/Recommended", options));
  };
  ApiClient.prototype.getLiveTvRecordings = function (options, signal) {
    var url = this.getUrl("LiveTv/Recordings", options || {});
    return this.getJSON(url, signal);
  };
  ApiClient.prototype.getLiveTvRecordingSeries = function (options) {
    var url = this.getUrl("LiveTv/Recordings/Series", options || {});
    return this.getJSON(url);
  };
  ApiClient.prototype.getLiveTvRecording = function (id, userId) {
    if (!id) {
      throw new Error("null id");
    }
    var options = {};
    if (userId) {
      options.userId = userId;
    }
    var url = this.getUrl("LiveTv/Recordings/" + id, options);
    return this.getJSON(url);
  };
  ApiClient.prototype.getLiveTvProgram = function (id, userId) {
    if (!id) {
      throw new Error("null id");
    }
    var options = {};
    if (userId) {
      options.userId = userId;
    }
    var url = this.getUrl("LiveTv/Programs/" + id, options);
    return this.getJSON(url);
  };
  ApiClient.prototype.cancelLiveTvTimer = function (id) {
    if (!id) {
      throw new Error("null id");
    }
    var method = 'POST';
    var url = this.getUrl("LiveTv/Timers/" + id + "/Delete");
    return this.ajax({
      type: method,
      url: url
    });
  };
  function setTimerProperties(item) {
    item.Type = 'Timer';
  }
  ApiClient.prototype.getLiveTvTimers = function (options) {
    var url = this.getUrl("LiveTv/Timers", options || {});
    return this.getJSON(url).then(function (result) {
      result.Items.forEach(setTimerProperties);
      return result;
    });
  };
  ApiClient.prototype.getLiveTvTimer = function (id) {
    if (!id) {
      throw new Error("null id");
    }
    var url = this.getUrl("LiveTv/Timers/" + id);
    return this.getJSON(url).then(function (item) {
      setTimerProperties(item);
      return item;
    });
  };
  ApiClient.prototype.getNewLiveTvTimerDefaults = function () {
    var options = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
    var url = this.getUrl("LiveTv/Timers/Defaults", options);
    return this.getJSON(url);
  };
  ApiClient.prototype.createLiveTvTimer = function (item) {
    if (!item) {
      throw new Error("null item");
    }
    var url = this.getUrl("LiveTv/Timers");
    return this.ajax({
      type: "POST",
      url: url,
      data: JSON.stringify(item),
      contentType: "application/json"
    });
  };
  ApiClient.prototype.updateLiveTvTimer = function (item) {
    if (!item) {
      throw new Error("null item");
    }
    var url = this.getUrl("LiveTv/Timers/" + item.Id);
    return this.ajax({
      type: "POST",
      url: url,
      data: JSON.stringify(item),
      contentType: "application/json"
    });
  };
  ApiClient.prototype.resetLiveTvTuner = function (id) {
    if (!id) {
      throw new Error("null id");
    }
    var url = this.getUrl("LiveTv/Tuners/" + id + "/Reset");
    return this.ajax({
      type: "POST",
      url: url
    });
  };
  ApiClient.prototype.getLiveTvSeriesTimers = function (query, signal) {
    return this.getJSON(this.getUrl("LiveTv/SeriesTimers", query), signal);
  };
  ApiClient.prototype.getLiveTvSeriesTimer = function (id) {
    if (!id) {
      throw new Error("null id");
    }
    var url = this.getUrl("LiveTv/SeriesTimers/" + id);
    return this.getJSON(url);
  };
  ApiClient.prototype.cancelLiveTvSeriesTimer = function (id) {
    if (!id) {
      throw new Error("null id");
    }
    var method = 'POST';
    var url = this.getUrl("LiveTv/SeriesTimers/" + id + "/Delete");
    return this.ajax({
      type: method,
      url: url
    }).then(onSeriesTimerCancelled.bind({
      instance: this,
      itemId: id
    }));
  };
  ApiClient.prototype.createLiveTvSeriesTimer = function (item) {
    if (!item) {
      throw new Error("null item");
    }
    var url = this.getUrl("LiveTv/SeriesTimers");
    return this.ajax({
      type: "POST",
      url: url,
      dataType: this.isMinServerVersion('4.9.0.13') ? 'json' : null,
      data: JSON.stringify(item),
      contentType: "application/json"
    }).then(onSeriesTimerCreated.bind({
      instance: this
    }));
  };
  ApiClient.prototype.updateLiveTvSeriesTimer = function (item) {
    if (!item) {
      throw new Error("null item");
    }
    var itemId = item.Id;
    var url = this.getUrl("LiveTv/SeriesTimers/" + itemId);
    return this.ajax({
      type: "POST",
      url: url,
      data: JSON.stringify(item),
      contentType: "application/json"
    }).then(onSeriesTimerUpdated.bind({
      instance: this,
      itemId: itemId
    }));
  };
  ApiClient.prototype.getRegistrationInfo = function (feature) {
    var url = this.getUrl("Registrations/" + feature);
    return this.getJSON(url);
  };

  /**
   * Gets the current server status
   */
  ApiClient.prototype.getSystemInfo = function () {
    var url = this.getUrl("System/Info");
    var instance = this;
    return this.getJSON(url).then(function (info) {
      instance.setSystemInfo(info);
      return Promise.resolve(info);
    });
  };

  /**
   * Gets the current server status
   */
  ApiClient.prototype.getSyncStatus = function (item) {
    if (isLocalId(item.Id)) {
      return Promise.resolve({});
    }
    if (item.SyncStatus || this.isMinServerVersion('4.8.0.53')) {
      return Promise.resolve({
        Status: item.SyncStatus
      });
    }
    var url = this.getUrl("Sync/" + item.Id + "/Status");
    return this.ajax({
      url: url,
      type: 'POST',
      dataType: 'json',
      contentType: "application/json",
      data: JSON.stringify({
        TargetId: this.deviceId()
      })
    });
  };

  /**
   * Gets the current server status
   */
  ApiClient.prototype.getPublicSystemInfo = function () {
    var url = this.getUrl("System/Info/Public");
    var instance = this;
    return this.getJSON(url).then(function (info) {
      instance.setSystemInfo(info);
      return Promise.resolve(info);
    });
  };
  ApiClient.prototype.getInstantMixFromItem = function (itemId, options) {
    if (isLocalId(itemId)) {
      return Promise.resolve({
        Items: [],
        TotalRecordCount: 0
      });
    }
    var url = this.getUrl("Items/" + itemId + "/InstantMix", options);
    return this.getJSON(url);
  };
  ApiClient.prototype.getEpisodes = function (itemId, options, signal) {
    if (!options) {
      options = {};
    }
    var requiresStartItemIdPostProcess = false;
    if (!options.SeasonId && options.StartItemId && !this.isMinServerVersion('4.8.0.29')) {
      options.Limit = null;
      requiresStartItemIdPostProcess = true;
    }
    normalizeFields(options);
    var url = this.getUrl("Shows/" + itemId + "/Episodes", options);
    var promise = this.getJSON(url, signal);
    if (!requiresStartItemIdPostProcess) {
      return promise;
    }
    return promise.then(function (result) {
      var index = -1;
      for (var i = 0, length = result.Items.length; i < length; i++) {
        if (options.StartItemId === result.Items[i].Id) {
          index = i;
          break;
        }
      }
      if (index !== -1) {
        result.Items = result.Items.slice(index);
        if (options.EnableTotalRecordCount !== false) {
          result.TotalRecordCount = result.Items.length;
        }
      }
      return result;
    });
  };
  ApiClient.prototype.getDisplayPreferences = function (userId) {
    var instance = this;
    if (instance.isMinServerVersion('4.9.0.23')) {
      return instance.getJSON(instance.getUrl('usersettings/' + userId));
    }
    return this.getJSON(this.getUrl('DisplayPreferences/usersettings', {
      userId: userId,
      client: 'emby'
    })).then(function (result) {
      instance._displayPreferencesId = result.Id;
      return result.CustomPrefs || {};
    });
  };
  ApiClient.prototype.updatePartialDisplayPreferences = function (obj, userId) {
    var instance = this;
    if (this.isMinServerVersion('4.9.0.23')) {
      return instance.ajax({
        type: "POST",
        url: instance.getUrl('usersettings/' + userId + '/Partial'),
        data: JSON.stringify(obj),
        contentType: "application/json"
      });
    }
    throw new Error('unsupported server version');
  };
  ApiClient.prototype.updateDisplayPreferences = function (obj, userId) {
    var instance = this;
    if (this.isMinServerVersion('4.9.0.23')) {
      return instance.ajax({
        type: "POST",
        url: instance.getUrl('usersettings/' + userId),
        data: obj,
        contentType: "application/json"
      });
    }
    return instance.ajax({
      type: "POST",
      url: instance.getUrl('DisplayPreferences/usersettings', {
        userId: userId,
        client: 'emby'
      }),
      data: JSON.stringify({
        CustomPrefs: obj,
        Client: 'emby',
        // this is becoming legacy, so hardcoding is not the end of the world as it's temporary
        Id: instance._displayPreferencesId || '3ce5b65de116d73165d1efc4a30ec35c'
      }),
      contentType: "application/json"
    });
  };
  ApiClient.prototype.getSeasons = function (itemId, options, signal) {
    var url = this.getUrl("Shows/" + itemId + "/Seasons", options);
    return this.getJSON(url, signal);
  };
  ApiClient.prototype.getSimilarItems = function (itemId, options) {
    if (isLocalId(itemId)) {
      return Promise.resolve({
        Items: [],
        TotalRecordCount: 0
      });
    }
    var url = this.getUrl("Items/" + itemId + "/Similar", options);
    return this.getJSON(url);
  };

  /**
   * Gets all cultures known to the server
   */
  ApiClient.prototype.getCultures = function () {
    var url = this.getUrl("Localization/cultures");
    return this.getJSON(url);
  };

  /**
   * Gets all countries known to the server
   */
  ApiClient.prototype.getCountries = function () {
    var url = this.getUrl("Localization/countries");
    return this.getJSON(url).then(formatCountryDisplayNames);
  };
  ApiClient.prototype.getPlaybackInfo = function (itemId, options, deviceProfile, signal) {
    var postData = {
      DeviceProfile: deviceProfile
    };
    return this.ajax({
      url: this.getUrl("Items/" + itemId + "/PlaybackInfo", options),
      type: 'POST',
      data: JSON.stringify(postData),
      contentType: "application/json",
      dataType: "json",
      signal: signal
    });
  };
  ApiClient.prototype.getLiveStreamMediaInfo = function (liveStreamId) {
    var postData = {
      LiveStreamId: liveStreamId
    };
    return this.ajax({
      url: this.getUrl('LiveStreams/MediaInfo'),
      type: 'POST',
      data: JSON.stringify(postData),
      contentType: "application/json",
      dataType: "json"
    });
  };
  ApiClient.prototype.getIntros = function (itemId, options, signal) {
    if (isLocalId(itemId)) {
      return Promise.resolve({
        Items: [],
        TotalRecordCount: 0
      });
    }
    return this.getJSON(this.getUrl("Users/" + this.getCurrentUserId() + "/Items/" + itemId + "/Intros", options), signal);
  };

  /**
   * Gets the directory contents of a path on the server
   */
  ApiClient.prototype.getDirectoryContents = function (path, options) {
    if (!path) {
      throw new Error("null path");
    }
    if (typeof path !== 'string') {
      throw new Error('invalid path');
    }
    if (!options) {
      options = {};
    }
    options.path = path;
    if (!this.isMinServerVersion('4.8.0.53')) {
      return this.getJSON(this.getUrl("Environment/DirectoryContents", options));
    }
    return this.ajax({
      type: "POST",
      data: JSON.stringify(options),
      contentType: "application/json",
      dataType: "json",
      url: this.getUrl("Environment/DirectoryContents")
    });
  };

  /**
   * Gets shares from a network device
   */
  ApiClient.prototype.getNetworkShares = function (path) {
    if (!path) {
      throw new Error("null path");
    }
    var options = {};
    options.path = path;
    var url = this.getUrl("Environment/NetworkShares", options);
    return this.getJSON(url);
  };

  /**
   * Gets the parent of a given path
   */
  ApiClient.prototype.getParentPath = function (path) {
    if (!path) {
      throw new Error("null path");
    }
    var options = {};
    options.path = path;
    var url = this.getUrl("Environment/ParentPath", options);
    return this.ajax({
      type: "GET",
      url: url,
      dataType: 'text'
    });
  };

  /**
   * Gets a list of physical drives from the server
   */
  ApiClient.prototype.getDrives = function () {
    var url = this.getUrl("Environment/Drives");
    return this.getJSON(url);
  };

  /**
   * Gets a list of network devices from the server
   */
  ApiClient.prototype.getNetworkDevices = function () {
    var url = this.getUrl("Environment/NetworkDevices");
    return this.getJSON(url);
  };
  ApiClient.prototype.getActivityLog = function (options, signal) {
    var url = this.getUrl("System/ActivityLog/Entries", options || {});
    var serverId = this.serverId();
    return this.getJSON(url, signal).then(function (result) {
      var items = result.Items;
      for (var i = 0, length = items.length; i < length; i++) {
        var item = items[i];
        item.Type = 'ActivityLogEntry';
        item.ServerId = serverId;
      }
      return result;
    });
  };

  /**
   * Cancels a package installation
   */
  ApiClient.prototype.cancelPackageInstallation = function (installationId) {
    if (!installationId) {
      throw new Error("null installationId");
    }
    var method = 'POST';
    var url = this.getUrl("Packages/Installing/" + installationId + "/Delete");
    return this.ajax({
      type: method,
      url: url
    });
  };

  /**
   * Refreshes metadata for an item
   */
  ApiClient.prototype.refreshItems = function (items, options) {
    if (!items) {
      throw new Error("null items");
    }
    var instance = this;
    return Promise.all(items.map(function (item) {
      return instance.ajax({
        type: "POST",
        url: instance.getUrl("Items/" + item.Id + "/Refresh", options)
      });
    }));
  };

  /**
   * Installs or updates a new plugin
   */
  ApiClient.prototype.installPlugin = function (name, guid, updateClass, version) {
    if (!name) {
      throw new Error("null name");
    }
    if (!updateClass) {
      throw new Error("null updateClass");
    }
    var options = {
      updateClass: updateClass,
      AssemblyGuid: guid
    };
    if (version) {
      options.version = version;
    }
    var url = this.getUrl("Packages/Installed/" + name, options);
    return this.ajax({
      type: "POST",
      url: url
    });
  };

  /**
   * Instructs the server to perform a restart.
   */
  ApiClient.prototype.restartServer = function () {
    var url = this.getUrl("System/Restart");
    return this.ajax({
      type: "POST",
      url: url
    });
  };

  /**
   * Instructs the server to perform a shutdown.
   */
  ApiClient.prototype.shutdownServer = function () {
    var url = this.getUrl("System/Shutdown");
    return this.ajax({
      type: "POST",
      url: url
    });
  };

  /**
   * Gets information about an installable package
   */
  ApiClient.prototype.getPackageInfo = function (name, guid) {
    if (!name) {
      throw new Error("null name");
    }
    var options = {
      AssemblyGuid: guid
    };
    var url = this.getUrl("Packages/" + name, options);
    return this.getJSON(url);
  };

  /**
   * Gets the latest available application update (if any)
   */
  ApiClient.prototype.getAvailableApplicationUpdate = function () {
    var url = this.getUrl("Packages/Updates", {
      PackageType: "System"
    });
    return this.getJSON(url);
  };

  /**
   * Gets the latest available plugin updates (if any)
   */
  ApiClient.prototype.getAvailablePluginUpdates = function () {
    var url = this.getUrl("Packages/Updates", {
      PackageType: "UserInstalled"
    });
    return this.getJSON(url);
  };

  /**
   * Gets the virtual folder list
   */
  ApiClient.prototype.getVirtualFolders = function (query, signal) {
    var serverId = this.serverId();
    if (typeof query === 'string') {
      query = {
        userId: query
      };
    }
    return this.getJSON(this.getUrl("Library/VirtualFolders/Query", query), signal).then(function (result) {
      for (var i = 0, length = result.Items.length; i < length; i++) {
        var item = result.Items[i];
        mapVirtualFolder(item);
        item.ServerId = serverId;
      }
      return result;
    });
  };

  /**
   * Gets all the paths of the locations in the physical root.
   */
  ApiClient.prototype.getPhysicalPaths = function () {
    var url = this.getUrl("Library/PhysicalPaths");
    return this.getJSON(url);
  };

  /**
   * Gets the current server configuration
   */
  ApiClient.prototype.getServerConfiguration = function () {
    var url = this.getUrl("System/Configuration");
    return this.getJSON(url);
  };

  /**
   * Gets the list of devices
   */
  ApiClient.prototype.getDevices = function (query, signal) {
    var instance = this;
    return this.getJSON(this.getUrl('Devices', query), signal).then(function (result) {
      for (var i = 0, length = result.Items.length; i < length; i++) {
        setDeviceProperies(result.Items[i], instance);
      }
      return result;
    });
  };

  /**
   * Gets the current server configuration
   */
  ApiClient.prototype.getDevicesOptions = function () {
    var url = this.getUrl("System/Configuration/devices");
    return this.getJSON(url);
  };

  /**
   * Gets the current server configuration
   */
  ApiClient.prototype.getContentUploadHistory = function () {
    var url = this.getUrl("Devices/CameraUploads", {
      DeviceId: this.deviceId()
    });
    return this.getJSON(url);
  };
  ApiClient.prototype.getNamedConfiguration = function (name) {
    var url = this.getUrl("System/Configuration/" + name);
    return this.getJSON(url);
  };

  /**
      Gets available hardware accelerations
  */
  ApiClient.prototype.getHardwareAccelerations = function () {
    var url = this.getUrl("Encoding/HardwareAccelerations");
    return this.getJSON(url);
  };

  /**
      Gets available video codecs
  */
  ApiClient.prototype.getVideoCodecInformation = function () {
    var url = this.getUrl("Encoding/CodecInformation/Video");
    return this.getJSON(url);
  };

  /**
   * Gets the server's scheduled tasks
   */
  ApiClient.prototype.getScheduledTasks = function () {
    var options = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
    var url = this.getUrl("ScheduledTasks", options);
    var instance = this;
    return this.getJSON(url).then(function (result) {
      for (var i = 0, length = result.length; i < length; i++) {
        setScheduledTaskProperties(result[i], instance);
      }
      return result;
    });
  };

  /**
  * Starts a scheduled task
  */
  ApiClient.prototype.startScheduledTask = function (id) {
    if (!id) {
      throw new Error("null id");
    }
    var url = this.getUrl("ScheduledTasks/Running/" + id);
    return this.ajax({
      type: "POST",
      url: url
    });
  };

  /**
  * Gets a scheduled task
  */
  ApiClient.prototype.getScheduledTask = function (id) {
    if (!id) {
      throw new Error("null id");
    }
    var instance = this;
    var url = this.getUrl("ScheduledTasks/" + id);
    return this.getJSON(url).then(function (result) {
      setScheduledTaskProperties(result, instance);
      return result;
    });
  };
  ApiClient.prototype.getNextUpAudioBookItems = function (options, signal) {
    if (options.AlbumId) {
      if (isLocalId(options.AlbumId)) {
        return Promise.resolve({
          Items: [],
          TotalRecordCount: 0
        });
      }
    }

    //if (this.isMinServerVersion('4.8.0.25')) {
    //    return this.getResumableItems(this.getCurrentUserId(), Object.assign({

    //        IncludeItemTypes: 'Audio',
    //        ParentId: options?.AlbumId

    //    }, options), signal);
    //}

    var url = this.getUrl("AudioBooks/NextUp", options);
    return this.getJSON(url, signal);
  };
  ApiClient.prototype.getResumableItemsFromAudioBook = function (options, signal) {
    var albumId = options.AlbumId;
    if (isLocalId(albumId)) {
      return Promise.resolve({
        Items: [],
        TotalRecordCount: 0
      });
    }
    if (options.Limit === 1 && this.isMinServerVersion('4.9.1')) {
      options.IncludeItemTypes = 'Audio';
      options.ParentId = albumId;
      options.AlbumId = null;
      return this.getResumableItems(this.getCurrentUserId(), options, signal);
    }
    return this.getNextUpAudioBookItems(options, signal);
  };
  ApiClient.prototype.getNextUpEpisodes = function (options, signal) {
    if (options.SeriesId) {
      if (isLocalId(options.SeriesId)) {
        return Promise.resolve({
          Items: [],
          TotalRecordCount: 0
        });
      }
    }
    var url = this.getUrl("Shows/NextUp", options);
    return this.getJSON(url, signal);
  };
  ApiClient.prototype.getResumableItemsFromSeries = function (options, signal) {
    var seriesId = options.SeriesId;
    if (isLocalId(seriesId)) {
      return Promise.resolve({
        Items: [],
        TotalRecordCount: 0
      });
    }
    if (options.Limit === 1 && this.isMinServerVersion('4.9.1')) {
      options.IncludeItemTypes = 'Episode';
      options.ParentId = seriesId;
      options.SeriesId = null;
      return this.getResumableItems(this.getCurrentUserId(), options, signal);
    }
    return this.getNextUpEpisodes(options, signal);
  };

  /**
  * Stops a scheduled task
  */
  ApiClient.prototype.stopScheduledTask = function (id) {
    if (!id) {
      throw new Error("null id");
    }
    var method = 'POST';
    var url = this.getUrl("ScheduledTasks/Running/" + id + "/Delete");
    return this.ajax({
      type: method,
      url: url
    });
  };

  /**
   * Gets the configuration of a plugin
   * @param {String} Id
   */
  ApiClient.prototype.getPluginConfiguration = function (id) {
    if (!id) {
      throw new Error("null Id");
    }
    var url = this.getUrl("Plugins/" + id + "/Configuration");
    return this.getJSON(url);
  };

  /**
   * Gets a list of plugins that are available to be installed
   */
  ApiClient.prototype.getAvailablePlugins = function () {
    var options = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
    options.PackageType = "UserInstalled";
    var url = this.getUrl("Packages", options);
    return this.getJSON(url);
  };

  /**
   * Uninstalls a plugin
   * @param {String} Id
   */
  ApiClient.prototype.uninstallPlugin = function (id) {
    if (!id) {
      throw new Error("null Id");
    }
    return this.uninstallPlugins([{
      Id: id
    }]);
  };

  /**
   * Uninstalls a plugin
   * @param {String} Id
   */
  ApiClient.prototype.uninstallPluginSingle = function (id) {
    if (!id) {
      throw new Error("null Id");
    }
    var method = 'POST';
    var url = this.getUrl("Plugins/" + id + "/Delete");
    return this.ajax({
      type: method,
      url: url
    });
  };

  /**
   * Uninstalls a plugin
   * @param {String} Id
   */
  ApiClient.prototype.uninstallPlugins = function (items) {
    return Promise.all(items.map(mapToId).map(this.uninstallPluginSingle.bind(this))).then(onPluginsUninstalled.bind({
      instance: this,
      items: items
    }));
  };

  /**
  * Removes a virtual folder
  * @param {String} name
  */
  ApiClient.prototype.removeVirtualFolder = function (virtualFolder, refreshLibrary) {
    if (!virtualFolder) {
      throw new Error("null virtualFolder");
    }
    var instance = this;
    var method = 'POST';
    var url = "Library/VirtualFolders/Delete";
    var id = virtualFolder.Id;
    url = this.getUrl(url, {
      refreshLibrary: refreshLibrary ? true : false,
      id: id,
      name: virtualFolder.Name
    });
    return this.ajax({
      type: method,
      url: url
    }).then(onItemsDeleted.bind({
      instance: this,
      items: [virtualFolder]
    })).then(function () {
      instance._userViewsPromise = null;
    });
  };

  /**
  * Adds a virtual folder
  * @param {String} name
  */
  ApiClient.prototype.addVirtualFolder = function (name, type, refreshLibrary, libraryOptions) {
    if (!name) {
      throw new Error("null name");
    }
    var options = {};
    if (type) {
      options.collectionType = type;
    }
    options.refreshLibrary = refreshLibrary ? true : false;
    options.name = name;
    var url = "Library/VirtualFolders";
    url = this.getUrl(url, options);
    var instance = this;
    return this.ajax({
      type: "POST",
      url: url,
      data: JSON.stringify({
        LibraryOptions: libraryOptions
      }),
      contentType: 'application/json'
    }).then(function () {
      instance._userViewsPromise = null;
    });
  };
  ApiClient.prototype.updateVirtualFolderOptions = function (id, libraryOptions) {
    if (!id) {
      throw new Error("null name");
    }
    var url = "Library/VirtualFolders/LibraryOptions";
    url = this.getUrl(url);
    var instance = this;
    return this.ajax({
      type: "POST",
      url: url,
      data: JSON.stringify({
        Id: id,
        LibraryOptions: libraryOptions
      }),
      contentType: 'application/json'
    }).then(onItemUpdated.bind({
      instance: this,
      itemId: id
    })).then(function () {
      instance._userViewsPromise = null;
    });
  };

  /**
  * Renames a virtual folder
  */
  ApiClient.prototype.renameVirtualFolder = function (virtualFolder, newName, refreshLibrary) {
    if (!virtualFolder) {
      throw new Error("null virtualFolder");
    }
    var url = "Library/VirtualFolders/Name";
    url = this.getUrl(url, {
      refreshLibrary: refreshLibrary ? true : false,
      newName: newName,
      name: virtualFolder.Name,
      Id: virtualFolder.Id
    });
    var instance = this;
    return this.ajax({
      type: "POST",
      url: url
    }).then(onItemUpdated.bind({
      instance: this,
      itemId: virtualFolder.Id
    })).then(function () {
      instance._userViewsPromise = null;
    });
  };

  /**
  * Adds an additional mediaPath to an existing virtual folder
  * @param {String} name
  */
  ApiClient.prototype.addMediaPath = function (virtualFolder, pathInfo, refreshLibrary) {
    if (!virtualFolder) {
      throw new Error("null virtualFolder");
    }
    if (!pathInfo) {
      throw new Error("null pathInfo");
    }
    var url = "Library/VirtualFolders/Paths";
    url = this.getUrl(url, {
      refreshLibrary: refreshLibrary ? true : false
    });
    var instance = this;
    return this.ajax({
      type: "POST",
      url: url,
      data: JSON.stringify({
        Name: virtualFolder.Name,
        PathInfo: pathInfo,
        Id: virtualFolder.Id
      }),
      contentType: 'application/json'
    }).then(function () {
      instance._userViewsPromise = null;
    });
  };
  ApiClient.prototype.updateMediaPath = function (virtualFolder, pathInfo) {
    if (!virtualFolder) {
      throw new Error("null virtualFolder");
    }
    if (!pathInfo) {
      throw new Error("null pathInfo");
    }
    var url = "Library/VirtualFolders/Paths/Update";
    url = this.getUrl(url);
    var instance = this;
    return this.ajax({
      type: "POST",
      url: url,
      data: JSON.stringify({
        Name: virtualFolder.Name,
        PathInfo: pathInfo,
        Id: virtualFolder.Id
      }),
      contentType: 'application/json'
    }).then(function () {
      instance._userViewsPromise = null;
    });
  };

  /**
  * Removes a media path from a virtual folder
  * @param {String} name
  */
  ApiClient.prototype.removeMediaPath = function (virtualFolder, mediaPath, refreshLibrary) {
    if (!virtualFolder) {
      throw new Error("null virtualFolder");
    }
    if (!mediaPath) {
      throw new Error("null mediaPath");
    }
    var instance = this;
    var method = 'POST';
    var url = "Library/VirtualFolders/Paths/Delete";
    url = this.getUrl(url, {
      refreshLibrary: refreshLibrary ? true : false,
      path: mediaPath,
      name: virtualFolder.Name,
      Id: virtualFolder.Id
    });
    return this.ajax({
      type: method,
      url: url
    }).then(function () {
      instance._userViewsPromise = null;
    });
  };
  ApiClient.prototype.deleteUserSingle = function (id) {
    if (!id) {
      throw new Error("null id");
    }
    var serverId = this.serverId();
    var instance = this;
    var method = 'POST';
    var url = this.getUrl("Users/" + id + "/Delete");
    return this.ajax({
      type: method,
      url: url
    }).then(function () {
      removeCachedUser(id, serverId);
      instance._userViewsPromise = null;
    });
  };
  ApiClient.prototype.deleteUsers = function (items) {
    return Promise.all(items.map(mapToId).map(this.deleteUserSingle.bind(this))).then(onUsersDeleted.bind({
      instance: this,
      items: items
    }));
  };

  /**
   * Deletes a user
   * @param {String} id
   */
  ApiClient.prototype.deleteUser = function (id) {
    return this.deleteUser([{
      Id: id
    }]);
  };

  /**
   * Deletes a user image
   * @param {String} userId
   * @param {String} imageType The type of image to delete, based on the server-side ImageType enum.
   */
  ApiClient.prototype.deleteUserImage = function (userId, imageType, imageIndex) {
    if (!userId) {
      throw new Error("null userId");
    }
    if (!imageType) {
      throw new Error("null imageType");
    }
    var url = this.getUrl("Users/" + userId + "/Images/" + imageType);
    if (imageIndex != null) {
      url += "/" + imageIndex;
    }
    var instance = this;
    var method = 'POST';
    url += '/Delete';
    return this.ajax({
      type: method,
      url: url
    }).then(function () {
      return updateCachedUser(instance, userId);
    });
  };
  ApiClient.prototype.deleteItemImage = function (itemId, imageType, imageIndex) {
    if (!imageType) {
      throw new Error("null imageType");
    }
    var url = this.getUrl("Items/" + itemId + "/Images");
    url += "/" + imageType;
    if (imageIndex != null) {
      url += "/" + imageIndex;
    }
    var method = 'POST';
    url += '/Delete';
    return this.ajax({
      type: method,
      url: url
    }).then(onItemUpdated.bind({
      instance: this,
      itemId: itemId
    }));
  };
  ApiClient.prototype.deleteItems = function (items) {
    return this.deleteItemsInternal(items).then(onItemsDeleted.bind({
      instance: this,
      items: items
    }));
  };
  ApiClient.prototype.deleteItemsInternal = function (items) {
    if (!items) {
      throw new Error("null itemId");
    }
    var itemIds = items.map(mapToId).filter(isNotLocalId);
    return this.ajax({
      type: 'POST',
      url: this.getUrl("Items/Delete", {
        Ids: itemIds.join(',')
      })
    });
  };
  ApiClient.prototype.stopActiveEncodings = function (playSessionId) {
    var options = {
      deviceId: this.deviceId()
    };
    if (playSessionId) {
      options.PlaySessionId = playSessionId;
    }
    var method = 'POST';
    var url = this.getUrl("Videos/ActiveEncodings/Delete", options);
    return this.ajax({
      type: method,
      url: url
    });
  };
  ApiClient.prototype.reportCapabilities = function (options) {
    var url = this.getUrl("Sessions/Capabilities/Full");
    return this.ajax({
      type: "POST",
      url: url,
      data: JSON.stringify(options),
      contentType: "application/json"
    });
  };
  ApiClient.prototype.updateItemImageFromUrl = function (itemId, imageType, imageIndex, imageUrl) {
    if (!imageType) {
      throw new Error("null imageType");
    }
    var options = {};
    imageIndex = imageIndex || 0;
    return this.ajax({
      type: "POST",
      url: this.getUrl("Items/" + itemId + "/Images/" + imageType + "/" + imageIndex + "/Url", options),
      data: JSON.stringify({
        Url: imageUrl
      }),
      contentType: "application/json"
    }).then(onItemUpdated.bind({
      instance: this,
      itemId: itemId
    }));
  };
  ApiClient.prototype.updateItemImageIndex = function (itemId, imageType, imageIndex, newIndex) {
    if (!imageType) {
      throw new Error("null imageType");
    }
    var options = {
      newIndex: newIndex
    };
    imageIndex = imageIndex || 0;
    var url = this.getUrl("Items/" + itemId + "/Images/" + imageType + "/" + imageIndex + "/Index", options);
    return this.ajax({
      type: "POST",
      url: url
    }).then(onItemUpdated.bind({
      instance: this,
      itemId: itemId
    }));
  };
  ApiClient.prototype.getItemImageInfos = function (itemId) {
    var url = this.getUrl("Items/" + itemId + "/Images");
    return this.getJSON(url);
  };
  ApiClient.prototype.getCriticReviews = function (itemId, options) {
    if (!itemId) {
      throw new Error("null itemId");
    }
    var url = this.getUrl("Items/" + itemId + "/CriticReviews", options);
    return this.getJSON(url);
  };
  ApiClient.prototype.getItemDownloadUrl = function (itemId, mediaSourceId, serverAddress) {
    if (!itemId) {
      throw new Error("itemId cannot be empty");
    }
    var url = "Items/" + itemId + "/Download";
    return this.getUrl(url, {
      api_key: this.accessToken(),
      mediaSourceId: mediaSourceId
    }, serverAddress);
  };
  ApiClient.prototype.getItemOriginalFileUrl = function (itemId, mediaSourceId, serverAddress) {
    if (!itemId) {
      throw new Error("itemId cannot be empty");
    }
    var url = "Items/" + itemId + "/File";
    return this.getUrl(url, {
      api_key: this.accessToken(),
      mediaSourceId: mediaSourceId
    }, serverAddress);
  };
  ApiClient.prototype.getSessions = function (options) {
    var url = this.getUrl("Sessions", options);
    return this.getJSON(url);
  };

  /**
   * Uploads a user image
   * @param {String} userId
   * @param {String} imageType The type of image to delete, based on the server-side ImageType enum.
   * @param {Object} file The file from the input element
   */
  ApiClient.prototype.uploadUserImage = function (userId, imageType, file) {
    if (!userId) {
      throw new Error("null userId");
    }
    if (!imageType) {
      throw new Error("null imageType");
    }
    if (!file) {
      throw new Error("File must be an image.");
    }
    if (file.type !== "image/png" && file.type !== "image/jpeg" && file.type !== "image/jpeg") {
      throw new Error("File must be an image.");
    }
    var instance = this;
    return new Promise(function (resolve, reject) {
      var reader = new FileReader();
      reader.onerror = function () {
        reject();
      };
      reader.onabort = function () {
        reject();
      };

      // Closure to capture the file information.
      reader.onload = function (_ref2) {
        var target = _ref2.target;
        // Split by a comma to remove the url: prefix
        var data = target.result.split(',')[1];
        var url = instance.getUrl("Users/" + userId + "/Images/" + imageType);
        instance.ajax({
          type: "POST",
          url: url,
          data: data,
          contentType: "image/" + file.name.substring(file.name.lastIndexOf('.') + 1)
        }).then(function () {
          updateCachedUser(instance, userId).then(resolve, reject);
        }, reject);
      };

      // Read in the image file as a data URL.
      reader.readAsDataURL(file);
    });
  };
  ApiClient.prototype.uploadItemImage = function (itemId, imageType, imageIndex, file) {
    if (!itemId) {
      throw new Error("null itemId");
    }
    if (!imageType) {
      throw new Error("null imageType");
    }
    if (!file) {
      throw new Error("File must be an image.");
    }
    if (file.type !== "image/png" && file.type !== "image/jpeg" && file.type !== "image/jpeg") {
      throw new Error("File must be an image.");
    }
    var url = this.getUrl("Items/" + itemId + "/Images");
    url += "/" + imageType;
    var instance = this;
    if (imageIndex != null) {
      url += '?Index=' + imageIndex;
    }
    return new Promise(function (resolve, reject) {
      var reader = new FileReader();
      reader.onerror = function () {
        reject();
      };
      reader.onabort = function () {
        reject();
      };

      // Closure to capture the file information.
      reader.onload = function (_ref3) {
        var target = _ref3.target;
        // Split by a comma to remove the url: prefix
        var data = target.result.split(',')[1];
        instance.ajax({
          type: "POST",
          url: url,
          data: data,
          contentType: "image/" + file.name.substring(file.name.lastIndexOf('.') + 1)
        }).then(function (result) {
          onItemUpdated.call({
            instance: instance,
            itemId: itemId
          });
          resolve(result);
        }, reject);
      };

      // Read in the image file as a data URL.
      reader.readAsDataURL(file);
    });
  };

  /**
   * Gets the list of installed plugins on the server
   */
  ApiClient.prototype.getInstalledPlugins = function () {
    var options = {};
    var url = this.getUrl("Plugins", options);
    return this.getJSON(url);
  };
  ApiClient.prototype.getCurrentUserCached = function () {
    return getCachedUser(this, this.getCurrentUserId());
  };

  /**
   * Gets a user by id
   * @param {String} id
   */
  ApiClient.prototype.getUser = function (id, enableCache, signal) {
    if (!id) {
      throw new Error("Must supply a userId");
    }
    var cachedUser;
    if (enableCache !== false) {
      cachedUser = getCachedUser(this, id);

      // time based cache is not ideal, try to improve in the future
      if (cachedUser && Date.now() - (cachedUser.DateLastFetched || 0) <= 60000) {
        return Promise.resolve(cachedUser);
      }
    }
    var instance = this;
    var url = this.getUrl("Users/" + id);
    var serverPromise = this.getJSON(url, signal).then(function (user) {
      saveUserInCache(instance, user);
      return user;
    }, function (response) {
      if (!signal || !signal.aborted) {
        // if timed out, look for cached value
        if (!response || !response.status) {
          if (instance.isLoggedIn()) {
            var user = getCachedUser(instance, id);
            if (user) {
              return Promise.resolve(user);
            }
          }
        }
      }
      throw response;
    });
    if (enableCache !== false) {
      if (cachedUser) {
        return Promise.resolve(cachedUser);
      }
    }
    return serverPromise;
  };

  /**
   * Gets a studio
   */
  ApiClient.prototype.getStudio = function (name, userId) {
    if (!name) {
      throw new Error("null name");
    }
    var options = {};
    if (userId) {
      options.userId = userId;
    }
    var url = this.getUrl("Studios/" + this.encodeName(name), options);
    return this.getJSON(url);
  };

  /**
   * Gets a genre
   */
  ApiClient.prototype.getGenre = function (name, userId) {
    if (!name) {
      throw new Error("null name");
    }
    var options = {};
    if (userId) {
      options.userId = userId;
    }
    var url = this.getUrl("Genres/" + this.encodeName(name), options);
    return this.getJSON(url);
  };
  ApiClient.prototype.getMusicGenre = function (name, userId) {
    if (!name) {
      throw new Error("null name");
    }
    var options = {};
    if (userId) {
      options.userId = userId;
    }
    var url = this.getUrl("MusicGenres/" + this.encodeName(name), options);
    return this.getJSON(url);
  };
  ApiClient.prototype.getGameGenre = function (name, userId) {
    if (!name) {
      throw new Error("null name");
    }
    var options = {};
    if (userId) {
      options.userId = userId;
    }
    var url = this.getUrl("GameGenres/" + this.encodeName(name), options);
    return this.getJSON(url);
  };

  /**
   * Gets an artist
   */
  ApiClient.prototype.getArtist = function (name, userId) {
    if (!name) {
      throw new Error("null name");
    }
    var options = {};
    if (userId) {
      options.userId = userId;
    }
    var url = this.getUrl("Artists/" + this.encodeName(name), options);
    return this.getJSON(url);
  };

  /**
   * Gets a Person
   */
  ApiClient.prototype.getPerson = function (name, userId) {
    if (!name) {
      throw new Error("null name");
    }
    var options = {};
    if (userId) {
      options.userId = userId;
    }
    var url = this.getUrl("Persons/" + this.encodeName(name), options);
    return this.getJSON(url);
  };
  ApiClient.prototype.getPublicUsersQueryResult = function (query, signal) {
    var serverId = this.serverId();
    var url = this.getUrl("users/public");
    return this.ajax({
      type: "GET",
      url: url,
      dataType: "json",
      signal: signal
    }, false).then(function (users) {
      setUsersProperties(users, serverId);
      return users;
    }).then(function (users) {
      var totalRecordCount = users.length;
      if (query) {
        users = users.slice(query.StartIndex || 0);
        if (query.Limit && users.length > query.Limit) {
          users.length = query.Limit;
        }
      }
      return {
        Items: users,
        TotalRecordCount: totalRecordCount
      };
    });
  };
  ApiClient.prototype.getPublicUsers = function () {
    return this.getPublicUsersQueryResult({}).then(function (result) {
      return result.Items;
    });
  };

  /**
   * Gets all users from the server
   */
  ApiClient.prototype.getUsersQueryResult = function (query, signal) {
    var serverId = this.serverId();
    return this.getJSON(this.getUrl("Users/Query", query), signal).then(function (result) {
      setUsersProperties(result.Items, serverId);
      return result;
    });
  };
  ApiClient.prototype.getUsersForItemAccess = function (query, signal) {
    var serverId = this.serverId();
    return this.getJSON(this.getUrl("Users/ItemAccess", query), signal).then(function (result) {
      setUsersProperties(result.Items, serverId);
      return result;
    });
  };
  ApiClient.prototype.getUsers = function (query, signal) {
    return this.getUsersQueryResult(query, signal).then(function (result) {
      return result.Items;
    });
  };

  /**
   * Gets all users from the server
   */
  ApiClient.prototype.getUserPrefixes = function (query, signal) {
    return this.getJSON(this.getUrl("Users/Prefixes", query), signal);
  };

  /**
   * Gets api keys from the server
   */
  ApiClient.prototype.getApiKeys = function (query, signal) {
    var instance = this;
    return this.getJSON(this.getUrl("Auth/Keys", query), signal).then(function (result) {
      setApiKeysProperties(instance, result);
      return result;
    });
  };

  /**
   * Gets logs from the server
   */
  ApiClient.prototype.getLogs = function (query, signal) {
    var instance = this;
    return this.getJSON(this.getUrl("System/Logs/Query", query), signal).then(function (result) {
      setLogsProperties(instance, result.Items);
      return result;
    });
  };
  ApiClient.prototype.getLogDownloadUrl = function (_ref4) {
    var Name = _ref4.Name,
      Sanitize = _ref4.Sanitize,
      SetFilename = _ref4.SetFilename;
    return this.getUrl("System/Logs/" + Name, {
      Sanitize: Sanitize,
      api_key: this.accessToken(),
      SetFilename: SetFilename
    });
  };

  /**
   * Gets logs from the server
   */
  ApiClient.prototype.getLogLines = function (options, signal) {
    var name = options.name;
    options.name = null;
    var url = this.getUrl("System/Logs/" + name + "/Lines", options || {});
    return this.getJSON(url, signal);
  };

  /**
   * Gets all available parental ratings from the server
   */
  ApiClient.prototype.getParentalRatings = function () {
    var url = this.getUrl("Localization/ParentalRatings");
    return this.getJSON(url);
  };
  ApiClient.prototype.getDefaultImageSizes = function () {
    return StandardWidths.slice(0);
  };
  ApiClient.prototype.getImageUrls = function (itemId, imageOptions, sourceOptions) {
    var sources = [];
    var originalImageOptions = imageOptions;
    var widths = (sourceOptions == null ? void 0 : sourceOptions.widths) || StandardWidths;
    for (var i = 0, length = widths.length; i < length; i++) {
      imageOptions = Object.assign({}, originalImageOptions);
      imageOptions.adjustForPixelRatio = false;
      imageOptions.maxWidth = widths[i];
      sources.push({
        url: this.getImageUrl(itemId, imageOptions),
        width: imageOptions.maxWidth
      });
    }
    return sources;
  };
  ApiClient.prototype.getImageUrl = function (itemId, options) {
    if (!itemId) {
      throw new Error("itemId cannot be empty");
    }
    if (!options) {
      options = {};
    }
    var url = "Items/" + itemId + "/Images/" + options.type;
    if (options.index != null) {
      url += "/" + options.index;
    }
    normalizeImageOptions(this, options);

    // Don't put these on the query string
    delete options.type;
    delete options.index;
    return this.getUrl(url, options);
  };
  ApiClient.prototype.getLogoImageUrl = function (item, options, preferredLogoImageTypes) {
    if (!preferredLogoImageTypes) {
      preferredLogoImageTypes = ['LogoLightColor', 'LogoLight', 'Logo'];
    }
    for (var i = 0, length = preferredLogoImageTypes.length; i < length; i++) {
      var logoType = preferredLogoImageTypes[i];
      if (item.ImageTags && item.ImageTags[logoType]) {
        options.type = logoType;
        options.tag = item.ImageTags[logoType];
        return this.getImageUrl(item.Id, options);
      }
    }
    if (item.ParentLogoImageTag) {
      options.tag = item.ParentLogoImageTag;
      options.type = "Logo";
      return this.getImageUrl(item.ParentLogoItemId, options);
    }
    if (item.Type === 'TvChannel' || item.Type === 'ChannelManagementInfo') {
      if (item.ImageTags && item.ImageTags.Primary) {
        options.tag = item.ImageTags.Primary;
        options.type = "Primary";
        return this.getImageUrl(item.Id, options);
      }
    }
    return null;
  };

  /**
   * Constructs a url for a user image
   * @param {String} userId
   * @param {Object} options
   * Options supports the following properties:
   * width - download the image at a fixed width
   * height - download the image at a fixed height
   * maxWidth - download the image at a maxWidth
   * maxHeight - download the image at a maxHeight
   * quality - A scale of 0-100. This should almost always be omitted as the default will suffice.
   * For best results do not specify both width and height together, as aspect ratio might be altered.
   */
  ApiClient.prototype.getUserImageUrl = function (userId, options) {
    if (!userId) {
      throw new Error("null userId");
    }
    if (!options) {
      options = {};
    }
    var url = "Users/" + userId + "/Images/" + options.type;
    if (options.index != null) {
      url += "/" + options.index;
    }
    normalizeImageOptions(this, options);

    // Don't put these on the query string
    delete options.type;
    delete options.index;
    return this.getUrl(url, options);
  };
  ApiClient.prototype.getThumbImageUrl = function (item, options) {
    if (!item) {
      throw new Error("null item");
    }
    options = options || {};
    options.imageType = "thumb";
    if (item.ImageTags && item.ImageTags.Thumb) {
      options.tag = item.ImageTags.Thumb;
      return this.getImageUrl(item.Id, options);
    } else if (item.ParentThumbItemId) {
      options.tag = item.ImageTags.ParentThumbImageTag;
      return this.getImageUrl(item.ParentThumbItemId, options);
    } else {
      return null;
    }
  };

  /**
   * Updates a user's password
   * @param {String} userId
   * @param {String} currentPassword
   * @param {String} newPassword
   */
  ApiClient.prototype.updateUserPassword = function (userId, currentPassword, newPassword) {
    if (!userId) {
      return Promise.reject();
    }
    var url = this.getUrl("Users/" + userId + "/Password");
    var instance = this;
    return this.ajax({
      type: "POST",
      url: url,
      data: {
        CurrentPw: currentPassword || '',
        NewPw: newPassword
      }
    }).then(function () {
      return updateCachedUser(instance, userId);
    });
  };
  ApiClient.prototype.updateProfilePin = function (userId, pin) {
    var obj = {
      ProfilePin: pin || null
    };
    return this.updatePartialUserConfiguration(userId, obj);
  };

  /**
   * Updates a user's easy password
   * @param {String} userId
   * @param {String} newPassword
   */
  ApiClient.prototype.updateEasyPassword = function (userId, newPassword) {
    var instance = this;
    if (instance.isMinServerVersion('4.8.0.40')) {
      return Promise.reject();
    }
    if (!userId) {
      return Promise.reject();
    }
    var url = this.getUrl("Users/" + userId + "/EasyPassword");
    return this.ajax({
      type: "POST",
      url: url,
      data: {
        NewPw: newPassword
      }
    }).then(function () {
      return updateCachedUser(instance, userId);
    });
  };

  /**
  * Resets a user's password
  * @param {String} userId
  */
  ApiClient.prototype.resetUserPassword = function (userId) {
    if (!userId) {
      throw new Error("null userId");
    }
    var url = this.getUrl("Users/" + userId + "/Password");
    var instance = this;
    var postData = {};
    postData.resetPassword = true;
    return this.ajax({
      type: "POST",
      url: url,
      data: postData
    }).then(function () {
      return updateCachedUser(instance, userId);
    });
  };
  ApiClient.prototype.resetEasyPassword = function (userId) {
    if (!userId) {
      throw new Error("null userId");
    }
    var url = this.getUrl("Users/" + userId + "/EasyPassword");
    var instance = this;
    var postData = {};
    postData.resetPassword = true;
    return this.ajax({
      type: "POST",
      url: url,
      data: postData
    }).then(function () {
      return updateCachedUser(instance, userId);
    });
  };

  /**
   * Updates the server's configuration
   * @param {Object} configuration
   */
  ApiClient.prototype.updateServerConfiguration = function (configuration) {
    if (!configuration) {
      throw new Error("null configuration");
    }
    var url = this.getUrl("System/Configuration");
    return this.ajax({
      type: "POST",
      url: url,
      data: JSON.stringify(configuration),
      contentType: "application/json"
    });
  };
  ApiClient.prototype.updatePartialServerConfiguration = function (configuration) {
    var instance = this;
    if (!instance.isMinServerVersion('4.8.8')) {
      return instance.getServerConfiguration().then(function (serverConfiguration) {
        serverConfiguration = Object.assign(serverConfiguration, configuration);
        return instance.updateServerConfiguration(serverConfiguration);
      });
    }
    if (!configuration) {
      throw new Error("null configuration");
    }
    var url = this.getUrl("System/Configuration/Partial");
    return this.ajax({
      type: "POST",
      url: url,
      data: JSON.stringify(configuration),
      contentType: "application/json"
    });
  };
  ApiClient.prototype.updateNamedConfiguration = function (name, configuration) {
    if (!configuration) {
      throw new Error("null configuration");
    }
    var url = this.getUrl("System/Configuration/" + name);
    return this.ajax({
      type: "POST",
      url: url,
      data: JSON.stringify(configuration),
      contentType: "application/json"
    });
  };
  ApiClient.prototype.getTypedUserSettings = function (userId, key) {
    var url = this.getUrl("Users/" + userId + "/TypedSettings/" + key);
    return this.getJSON(url);
  };
  ApiClient.prototype.updateTypedUserSettings = function (userId, key, configuration) {
    if (!configuration) {
      throw new Error("null configuration");
    }
    var url = this.getUrl("Users/" + userId + "/TypedSettings/" + key);
    return this.ajax({
      type: "POST",
      url: url,
      data: JSON.stringify(configuration),
      contentType: "application/json"
    });
  };
  ApiClient.prototype.getTunerHostConfiguration = function (id) {
    return this.getNamedConfiguration("livetv").then(function (config) {
      return config.TunerHosts.filter(function (i) {
        return i.Id === id;
      })[0];
    });
  };
  ApiClient.prototype.saveTunerHostConfiguration = function (tunerHostInfo) {
    return this.ajax({
      type: "POST",
      url: this.getUrl('LiveTv/TunerHosts'),
      data: JSON.stringify(tunerHostInfo),
      contentType: "application/json",
      dataType: "json"
    });
  };
  ApiClient.prototype.getDefaultTunerHostConfiguration = function (type) {
    return this.getJSON(this.getUrl('LiveTv/TunerHosts/Default/' + type));
  };
  ApiClient.prototype.updateItem = function (item) {
    if (!item) {
      throw new Error("null item");
    }
    var url = this.getUrl("Items/" + item.Id);
    return this.ajax({
      type: "POST",
      url: url,
      data: JSON.stringify(item),
      contentType: "application/json"
    }).then(onItemUpdated.bind({
      instance: this,
      itemId: item.Id
    }));
  };

  /**
   * Updates plugin security info
   */
  ApiClient.prototype.updatePluginSecurityInfo = function (info) {
    var url = this.getUrl("Plugins/SecurityInfo");
    return this.ajax({
      type: "POST",
      url: url,
      data: JSON.stringify(info),
      contentType: "application/json"
    });
  };

  /**
   * Creates a user
   * @param {Object} user
   */
  ApiClient.prototype.createUser = function (options) {
    var url = this.getUrl("Users/New");
    return this.ajax({
      type: "POST",
      url: url,
      data: options,
      dataType: "json"
    });
  };

  /**
   * Updates a user
   * @param {Object} user
   */
  ApiClient.prototype.updateUser = function (user) {
    if (!user) {
      throw new Error("null user");
    }
    var url = this.getUrl("Users/" + user.Id);
    return this.ajax({
      type: "POST",
      url: url,
      data: JSON.stringify(user),
      contentType: "application/json"
    });
  };
  ApiClient.prototype.updateUserPolicy = function (userId, policy) {
    if (!userId) {
      throw new Error("null userId");
    }
    if (!policy) {
      throw new Error("null policy");
    }
    var url = this.getUrl("Users/" + userId + "/Policy");
    var instance = this;
    return this.ajax({
      type: "POST",
      url: url,
      data: JSON.stringify(policy),
      contentType: "application/json"
    }).then(function () {
      if (instance.getCurrentUserId() === userId) {
        instance._userViewsPromise = null;
      }
      return updateCachedUser(instance, userId);
    });
  };
  ApiClient.prototype.updateUserConfiguration = function (userId, configuration) {
    if (!userId) {
      throw new Error("null userId");
    }
    if (!configuration) {
      throw new Error("null configuration");
    }
    var url = this.getUrl("Users/" + userId + "/Configuration");
    var instance = this;
    return this.ajax({
      type: "POST",
      url: url,
      data: JSON.stringify(configuration),
      contentType: "application/json"
    }).then(function () {
      if (instance.getCurrentUserId() === userId) {
        instance._userViewsPromise = null;
      }
      return updateCachedUser(instance, userId);
    });
  };
  ApiClient.prototype.updatePartialUserConfiguration = function (userId, configuration) {
    var instance = this;
    if (!instance.isMinServerVersion('4.8.0.48')) {
      return instance.getUser(userId).then(function (user) {
        user.Configuration = Object.assign(user.Configuration, configuration);
        return instance.updateUserConfiguration(userId, user.Configuration);
      });
    }
    if (!userId) {
      throw new Error("null userId");
    }
    if (!configuration) {
      throw new Error("null configuration");
    }
    var url = this.getUrl("Users/" + userId + "/Configuration/Partial");
    return this.ajax({
      type: "POST",
      url: url,
      data: JSON.stringify(configuration),
      contentType: "application/json"
    }).then(function () {
      if (instance.getCurrentUserId() === userId) {
        instance._userViewsPromise = null;
      }
      return updateCachedUserConfig(instance, userId, configuration);
    });
  };

  /**
   * Updates the Triggers for a ScheduledTask
   * @param {String} id
   * @param {Object} triggers
   */
  ApiClient.prototype.updateScheduledTaskTriggers = function (id, triggers) {
    if (!id) {
      throw new Error("null id");
    }
    if (!triggers) {
      throw new Error("null triggers");
    }

    // clone these because we need to change back trigger type
    triggers = JSON.parse(JSON.stringify(triggers));
    for (var i = 0, length = triggers.length; i < length; i++) {
      var trigger = triggers[i];
      if (trigger.TriggerType) {
        trigger.Type = trigger.TriggerType;
      }
    }
    var url = this.getUrl("ScheduledTasks/" + id + "/Triggers");
    return this.ajax({
      type: "POST",
      url: url,
      data: JSON.stringify(triggers),
      contentType: "application/json"
    }).then(onScheduledTaskTriggersUpdated.bind({
      instance: this,
      items: triggers
    }));
  };

  /**
   * Updates a plugin's configuration
   * @param {String} Id
   * @param {Object} configuration
   */
  ApiClient.prototype.updatePluginConfiguration = function (id, configuration) {
    if (!id) {
      throw new Error("null Id");
    }
    if (!configuration) {
      throw new Error("null configuration");
    }
    var url = this.getUrl("Plugins/" + id + "/Configuration");
    return this.ajax({
      type: "POST",
      url: url,
      data: JSON.stringify(configuration),
      contentType: "application/json"
    });
  };
  ApiClient.prototype.getAncestorItems = function (itemId, userId) {
    if (!itemId) {
      throw new Error("null itemId");
    }
    var options = {};
    if (userId) {
      options.userId = userId;
    }
    var url = this.getUrl("Items/" + itemId + "/Ancestors", options);
    return this.getJSON(url);
  };

  /**
   * Gets items based on a query, typically for children of a folder
   * @param {String} userId
   * @param {Object} options
   * Options accepts the following properties:
   * itemId - Localize the search to a specific folder (root if omitted)
   * startIndex - Use for paging
   * limit - Use to limit results to a certain number of items
   * filter - Specify one or more ItemFilters, comma delimeted (see server-side enum)
   * sortBy - Specify an ItemSortBy (comma-delimeted list see server-side enum)
   * sortOrder - ascending/descending
   * fields - additional fields to include aside from basic info. This is a comma delimited list. See server-side enum ItemFields.
   * index - the name of the dynamic, localized index function
   * dynamicSortBy - the name of the dynamic localized sort function
   * recursive - Whether or not the query should be recursive
   * searchTerm - search term to use as a filter
   */
  ApiClient.prototype.getItems = function (userId, options, signal) {
    if (options) {
      if (options.IsNewOrPremiere != null && !this.isMinServerVersion('4.8.0.48')) {
        return Promise.resolve({
          Items: [],
          TotalRecordCount: 0
        });
      }
    }
    normalizeFields(options);
    var url;
    if ((typeof userId).toString().toLowerCase() === 'string') {
      url = this.getUrl("Users/" + userId + "/Items", options);
    } else {
      url = this.getUrl("Items", options);
    }
    return this.getJSON(url, signal);
  };
  ApiClient.prototype.getLiveTvChannelTags = function (options, signal) {
    if (!options) {
      options = {};
    }
    options.UserId = this.getCurrentUserId();
    var url = this.getUrl("LiveTv/ChannelTags", options);
    return this.getJSON(url, signal);
  };
  ApiClient.prototype.getLiveTvChannelTagPrefixes = function (options, signal) {
    if (!options) {
      options = {};
    }
    options.UserId = this.getCurrentUserId();
    var url = this.getUrl("LiveTv/ChannelTags/Prefixes", options);
    return this.getJSON(url, signal);
  };
  ApiClient.prototype.getResumableItems = function (userId, options, signal) {
    return this.getJSON(this.getUrl("Users/" + userId + "/Items/Resume", options), signal);
  };
  ApiClient.prototype.getMovieRecommendations = function (options, signal) {
    return this.getJSON(this.getUrl('Movies/Recommendations', options), signal);
  };
  ApiClient.prototype.getUpcomingEpisodes = function (options, signal) {
    return this.getJSON(this.getUrl('Shows/Upcoming', options), signal);
  };
  ApiClient.prototype.getMissingEpisodes = function (options, signal) {
    if (!this.isMinServerVersion('4.8.0.59')) {
      return Promise.resolve({
        Items: [],
        TotalRecordCount: 0
      });
    }
    return this.getJSON(this.getUrl('Shows/Missing', options), signal);
  };
  ApiClient.prototype.getPersonCredits = function (options, signal) {
    var id = options.id;
    delete options.id;
    if (isLocalId(id) || !this.isMinServerVersion('4.10.0.1')) {
      return Promise.resolve({
        Items: [],
        TotalRecordCount: 0
      });
    }
    return this.getJSON(this.getUrl('Persons/' + id + '/Credits', options), signal);
  };
  ApiClient.prototype.getUserViews = function (options, userId, signal) {
    var currentUserId = this.getCurrentUserId();
    userId = userId || currentUserId;
    var enableCache = userId === currentUserId && !(options != null && options.IncludeHidden) && (options == null ? void 0 : options.AllowDynamicChildren) !== false;
    if (enableCache && this._userViewsPromise) {
      return this._userViewsPromise;
    }
    var url = this.getUrl("Users/" + userId + "/Views", options);
    var self = this;
    var promise = this.getJSON(url, signal).catch(function (err) {
      self._userViewsPromise = null;
      return Promise.reject(err);
    });
    if (enableCache) {
      this._userViewsPromise = promise;
    }
    return promise;
  };

  /**
      Gets artists from an item
  */
  ApiClient.prototype.getArtists = function (userId, options, signal) {
    if (!userId) {
      throw new Error("null userId");
    }
    if (!options) {
      options = {};
    }
    options.userId = userId;
    if (!options.ArtistType && this.isMinServerVersion('4.9.0.43')) {
      options.ArtistType = 'all';
    }
    var url = this.getUrl("Artists", options);
    return this.getJSON(url, signal);
  };

  /**
      Gets artists from an item
  */
  ApiClient.prototype.getAlbumArtists = function (userId, options, signal) {
    if (!userId) {
      throw new Error("null userId");
    }
    if (!options) {
      options = {};
    }
    options.userId = userId;
    var url = this.getUrl("Artists/AlbumArtists", options);
    return this.getJSON(url, signal);
  };

  /**
      Gets genres from an item
  */
  ApiClient.prototype.getGenres = function (userId, options, signal) {
    if (!userId) {
      throw new Error("null userId");
    }
    if (!options) {
      options = {};
    }
    options.userId = userId;
    var url = this.getUrl("Genres", options);
    return this.getJSON(url, signal);
  };
  ApiClient.prototype.getMusicGenres = function (userId, options, signal) {
    if (!userId) {
      throw new Error("null userId");
    }
    if (!options) {
      options = {};
    }
    options.userId = userId;
    var url = this.getUrl("MusicGenres", options);
    return this.getJSON(url, signal);
  };
  ApiClient.prototype.getGameGenres = function (userId, options, signal) {
    if (!userId) {
      throw new Error("null userId");
    }
    if (!options) {
      options = {};
    }
    options.userId = userId;
    var url = this.getUrl("GameGenres", options);
    return this.getJSON(url, signal);
  };

  /**
      Gets people from an item
  */
  ApiClient.prototype.getPeople = function (userId, options, signal) {
    if (!userId) {
      throw new Error("null userId");
    }
    if (!options) {
      options = {};
    }
    options.userId = userId;
    var url = this.getUrl("Persons", options);
    return this.getJSON(url, signal);
  };

  /**
      Gets thumbnails from an item
  */
  ApiClient.prototype.getThumbnails = function (itemId, options) {
    if (isLocalId(itemId)) {
      return Promise.resolve({
        Thumbnails: []
      });
    }
    var url = this.getUrl("Items/" + itemId + "/ThumbnailSet", options);
    return this.getJSON(url);
  };

  /**
      Gets thumbnails from an item
  */
  ApiClient.prototype.getDeleteInfo = function (itemId, options) {
    if (isLocalId(itemId)) {
      return Promise.resolve({
        Paths: []
      });
    }
    var url = this.getUrl("Items/" + itemId + "/DeleteInfo", options);
    return this.getJSON(url);
  };

  /**
      Gets studios from an item
  */
  ApiClient.prototype.getStudios = function (userId, options) {
    if (!userId) {
      throw new Error("null userId");
    }
    if (!options) {
      options = {};
    }
    options.userId = userId;
    var url = this.getUrl("Studios", options);
    return this.getJSON(url);
  };
  ApiClient.prototype.getOfficialRatings = function (userId, options) {
    if (!userId) {
      throw new Error("null userId");
    }
    if (!options) {
      options = {};
    }
    options.userId = userId;
    var url = this.getUrl("OfficialRatings", options);
    return this.getJSON(url);
  };
  ApiClient.prototype.getYears = function (userId, options) {
    if (!userId) {
      throw new Error("null userId");
    }
    if (!options) {
      options = {};
    }
    options.userId = userId;
    var url = this.getUrl("Years", options);
    return this.getJSON(url);
  };
  ApiClient.prototype.getTags = function (userId, options) {
    if (!userId) {
      throw new Error("null userId");
    }
    if (!options) {
      options = {};
    }
    options.userId = userId;
    var url = this.getUrl("Tags", options);
    var promise = this.getJSON(url);
    var fillTagPropertiesFn = fillTagProperties.bind(this);
    return promise.then(fillTagPropertiesFn);
  };
  ApiClient.prototype.getItemTypes = function (userId, options, signal) {
    if (!userId) {
      throw new Error("null userId");
    }
    if (!options) {
      options = {};
    }
    options.userId = userId;
    var url = this.getUrl("ItemTypes", options);
    return this.getJSON(url, signal);
  };
  ApiClient.prototype.getContainers = function (userId, options) {
    if (!userId) {
      throw new Error("null userId");
    }
    if (!options) {
      options = {};
    }
    options.userId = userId;
    var url = this.getUrl("Containers", options);
    return this.getJSON(url);
  };
  ApiClient.prototype.getAudioCodecs = function (userId, options) {
    if (!userId) {
      throw new Error("null userId");
    }
    if (!options) {
      options = {};
    }
    options.userId = userId;
    var url = this.getUrl("AudioCodecs", options);
    return this.getJSON(url);
  };
  ApiClient.prototype.getAudioLayouts = function (userId, options) {
    if (!userId) {
      throw new Error("null userId");
    }
    if (!options) {
      options = {};
    }
    options.userId = userId;
    var url = this.getUrl("AudioLayouts", options);
    var promise = this.getJSON(url);
    if (this.isMinServerVersion('4.8.0.23')) {
      return promise;
    }
    return updateTagItemsResponse(promise, options);
  };
  ApiClient.prototype.getStreamLanguages = function (userId, options) {
    if (!userId) {
      throw new Error("null userId");
    }
    if (!options) {
      options = {};
    }
    options.userId = userId;
    var url = this.getUrl("StreamLanguages", options);
    return this.getJSON(url);
  };
  ApiClient.prototype.getVideoCodecs = function (userId, options) {
    if (!userId) {
      throw new Error("null userId");
    }
    if (!options) {
      options = {};
    }
    options.userId = userId;
    var url = this.getUrl("VideoCodecs", options);
    return this.getJSON(url);
  };
  ApiClient.prototype.getExtendedVideoTypes = function (userId, options) {
    if (!this.isMinServerVersion('4.8.0.47')) {
      return Promise.resolve({
        Items: [],
        TotalRecordCount: 0
      });
    }
    if (!userId) {
      throw new Error("null userId");
    }
    if (!options) {
      options = {};
    }
    options.userId = userId;
    var url = this.getUrl("ExtendedVideoTypes", options);
    return this.getJSON(url);
  };
  ApiClient.prototype.getSubtitleCodecs = function (userId, options) {
    if (!userId) {
      throw new Error("null userId");
    }
    if (!options) {
      options = {};
    }
    options.userId = userId;
    var url = this.getUrl("SubtitleCodecs", options);
    return this.getJSON(url);
  };
  ApiClient.prototype.getPrefixes = function (userId, options) {
    if (!userId) {
      throw new Error("null userId");
    }
    if (!options) {
      options = {};
    }
    options.userId = userId;
    if (isLocalId(options.ParentId) || isLocalId(options.GenreIds) || isLocalId(options.ArtistIds) || isLocalId(options.StudioIds)) {
      return Promise.resolve([]);
    }
    var url = this.getUrl("Items/Prefixes", options);
    return this.getJSON(url);
  };
  ApiClient.prototype.getArtistPrefixes = function (userId, options) {
    if (!userId) {
      throw new Error("null userId");
    }
    if (!options) {
      options = {};
    }
    options.userId = userId;
    var url = this.getUrl("Artists/Prefixes", options);
    return this.getJSON(url);
  };

  /**
   * Gets local trailers for an item
   */
  ApiClient.prototype.getLocalTrailers = function (userId, itemId) {
    if (!userId) {
      throw new Error("null userId");
    }
    if (!itemId) {
      throw new Error("null itemId");
    }
    var url = this.getUrl("Users/" + userId + "/Items/" + itemId + "/LocalTrailers");
    return this.getJSON(url);
  };
  ApiClient.prototype.getAllTrailers = function (query, item) {
    var localTrailerPromise = item.LocalTrailerCount && query.LocalTrailers !== false ? this.getLocalTrailers(this.getCurrentUserId(), item.Id) : Promise.resolve([]);
    return localTrailerPromise.then(function (localTrailers) {
      var trailers = localTrailers.splice(0);
      if (item.RemoteTrailers && query.RemoteTrailers !== false) {
        for (var i = 0, length = item.RemoteTrailers.length; i < length; i++) {
          trailers.push(item.RemoteTrailers[i]);
        }
      }
      var mediaStreams = ((item.MediaSources || [])[0] || {}).MediaStreams || [];
      var videoStream = mediaStreams.filter(function (i) {
        return i.Type === 'Video';
      })[0] || {};
      var aspect = null;
      if (videoStream.Width && videoStream.Height) {
        aspect = videoStream.Width / videoStream.Height;
      }
      for (var _i = 0, _length = trailers.length; _i < _length; _i++) {
        var trailer = trailers[_i];
        if (!trailer.Name) {
          trailer.Name = 'Trailer: ' + item.Name;
        }
        if (!trailer.Type) {
          trailer.Type = 'Trailer';
        }
        if (!trailer.ServerId) {
          trailer.ServerId = item.ServerId;
        }
        if (!trailer.MediaType) {
          trailer.MediaType = 'Video';
        }
        if (!trailer.PrimaryImageAspectRatio) {
          trailer.PrimaryImageAspectRatio = aspect;
        }
        if (!trailer.ImageTags || !trailer.ImageTags.Thumb) {
          if (item.ImageTags && item.ImageTags.Thumb) {
            trailer.ParentThumbItemId = item.Id;
            trailer.ParentThumbImageTag = item.ImageTags.Thumb;
          } else {
            trailer.ParentThumbItemId = item.ParentThumbItemId;
            trailer.ParentThumbImageTag = item.ParentThumbImageTag;
          }
        }
        if (!trailer.ParentBackdropImageTags || !trailer.ParentBackdropImageTags.length) {
          trailer.ParentBackdropItemId = item.Id;
          trailer.ParentBackdropImageTags = item.BackdropImageTags;
        }
      }
      var totalItems = trailers.length;
      if (query) {
        trailers = trailers.slice(query.StartIndex || 0);
        if (query.Limit && trailers.length > query.Limit) {
          trailers.length = query.Limit;
        }
      }
      return Promise.resolve({
        Items: trailers,
        TotalRecordCount: totalItems
      });
    });
  };
  ApiClient.prototype.getGameSystems = function () {
    var options = {};
    var userId = this.getCurrentUserId();
    if (userId) {
      options.userId = userId;
    }
    var url = this.getUrl("Games/SystemSummaries", options);
    return this.getJSON(url);
  };
  ApiClient.prototype.getAdditionalVideoParts = function (userId, itemId, mediaSourceId) {
    if (!itemId) {
      throw new Error("null itemId");
    }
    if (isLocalId(itemId)) {
      return Promise.resolve([]);
    }
    if (isLocalId(mediaSourceId)) {
      return Promise.resolve([]);
    }
    var options = {};
    if (userId) {
      options.userId = userId;
    }
    if (mediaSourceId) {
      options.mediaSourceId = mediaSourceId;
    }
    var url = this.getUrl("Videos/" + itemId + "/AdditionalParts", options);
    return this.getJSON(url);
  };
  ApiClient.prototype.getThemeMedia = function (itemId, options, signal) {
    if (isLocalId(itemId)) {
      return Promise.resolve({
        ThemeVideosResult: {
          Items: [],
          TotalRecordCount: 0
        },
        ThemeSongsResult: {
          Items: [],
          TotalRecordCount: 0
        }
      });
    }
    var url = this.getUrl("Items/" + itemId + "/ThemeMedia", options);
    return this.getJSON(url, signal);
  };
  ApiClient.prototype.getAudioStreamUrl = function (_ref5, _ref6, directPlayContainers, maxBitrate, maxAudioSampleRate, maxAudioBitDepth, startPosition, enableRemoteMedia) {
    var Id = _ref5.Id;
    var Container = _ref6.Container,
      Protocol = _ref6.Protocol,
      AudioCodec = _ref6.AudioCodec;
    var url = "Audio/" + Id + "/universal";
    startingPlaySession++;
    return this.getUrl(url, {
      UserId: this.getCurrentUserId(),
      DeviceId: this.deviceId(),
      MaxStreamingBitrate: maxBitrate,
      Container: directPlayContainers,
      TranscodingContainer: Container || null,
      TranscodingProtocol: Protocol || null,
      AudioCodec: AudioCodec,
      MaxAudioSampleRate: maxAudioSampleRate,
      MaxAudioBitDepth: maxAudioBitDepth,
      api_key: this.accessToken(),
      PlaySessionId: startingPlaySession,
      StartTimeTicks: startPosition || 0,
      EnableRedirection: true,
      EnableRemoteMedia: enableRemoteMedia
    });
  };
  ApiClient.prototype.getAudioStreamUrls = function (items, transcodingProfile, directPlayContainers, maxBitrate, maxAudioSampleRate, maxAudioBitDepth, startPosition, enableRemoteMedia) {
    var streamUrls = [];
    for (var i = 0, length = items.length; i < length; i++) {
      var item = items[i];
      var streamUrl = void 0;
      if (item.MediaType === 'Audio') {
        streamUrl = this.getAudioStreamUrl(item, transcodingProfile, directPlayContainers, maxBitrate, maxAudioSampleRate, maxAudioBitDepth, startPosition, enableRemoteMedia);
      }
      streamUrls.push(streamUrl || '');
      if (i === 0) {
        startPosition = 0;
      }
    }
    return Promise.resolve(streamUrls);
  };

  /**
   * Gets special features for an item
   */
  ApiClient.prototype.getSpecialFeatures = function (userId, itemId, options) {
    if (!userId) {
      throw new Error("null userId");
    }
    if (!itemId) {
      throw new Error("null itemId");
    }
    if (isLocalId(itemId)) {
      return Promise.resolve([]);
    }
    var url = this.getUrl("Users/" + userId + "/Items/" + itemId + "/SpecialFeatures", options);
    return this.getJSON(url);
  };
  ApiClient.prototype.getDateParamValue = function (date) {
    function formatDigit(i) {
      return i < 10 ? "0" + i : i;
    }
    var d = date;
    return "" + d.getFullYear() + formatDigit(d.getMonth() + 1) + formatDigit(d.getDate()) + formatDigit(d.getHours()) + formatDigit(d.getMinutes()) + formatDigit(d.getSeconds());
  };
  ApiClient.prototype.markPlayed = function (userId, itemIds, date) {
    if (!userId) {
      throw new Error("null userId");
    }
    if (!itemIds) {
      throw new Error("null itemIds");
    }
    var instance = this;
    itemIds = itemIds.filter(isNotLocalId);
    return Promise.all(itemIds.map(function (itemId) {
      var options = {};
      if (date) {
        options.DatePlayed = instance.getDateParamValue(date);
      }
      var url = instance.getUrl("Users/" + userId + "/PlayedItems/" + itemId, options);
      return instance.ajax({
        type: "POST",
        url: url,
        dataType: "json"
      }).then(onUserDataUpdated.bind({
        instance: instance,
        userId: userId,
        itemId: itemId
      }));
    }));
  };
  ApiClient.prototype.markUnplayed = function (userId, itemIds) {
    if (!userId) {
      throw new Error("null userId");
    }
    if (!itemIds) {
      throw new Error("null itemIds");
    }
    var instance = this;
    itemIds = itemIds.filter(isNotLocalId);
    return Promise.all(itemIds.map(function (itemId) {
      var method = 'POST';
      var url = instance.getUrl("Users/" + userId + "/PlayedItems/" + itemId + "/Delete");
      return instance.ajax({
        type: method,
        url: url,
        dataType: "json"
      }).then(onUserDataUpdated.bind({
        instance: instance,
        userId: userId,
        itemId: itemId
      }));
    }));
  };

  /**
   * Updates a user's favorite status for an item.
   * @param {String} userId
   * @param {String} itemId
   * @param {Boolean} isFavorite
   */
  ApiClient.prototype.updateFavoriteStatus = function (userId, itemIds, isFavorite) {
    if (!userId) {
      throw new Error("null userId");
    }
    if (!itemIds) {
      throw new Error("null itemIds");
    }
    var instance = this;
    itemIds = itemIds.filter(isNotLocalId);
    return Promise.all(itemIds.map(function (itemId) {
      var method = 'POST';
      var url;
      if (isFavorite) {
        url = instance.getUrl("Users/" + userId + "/FavoriteItems/" + itemId);
      } else {
        url = instance.getUrl("Users/" + userId + "/FavoriteItems/" + itemId + "/Delete");
      }
      return instance.ajax({
        type: method,
        url: url,
        dataType: "json"
      }).then(onUserDataUpdated.bind({
        instance: instance,
        userId: userId,
        itemId: itemId
      }));
    }));
  };

  /**
   * Updates a user's personal rating for an item
   * @param {String} userId
   * @param {String} itemId
   * @param {Boolean} likes
   */
  ApiClient.prototype.updateUserItemRating = function (userId, itemId, likes) {
    if (!userId) {
      throw new Error("null userId");
    }
    if (!itemId) {
      throw new Error("null itemId");
    }
    var url = this.getUrl("Users/" + userId + "/Items/" + itemId + "/Rating", {
      likes: likes
    });
    return this.ajax({
      type: "POST",
      url: url,
      dataType: "json"
    }).then(onUserDataUpdated.bind({
      instance: this,
      userId: userId,
      itemId: itemId
    }));
  };
  ApiClient.prototype.updateHideFromResume = function (itemIds, hide) {
    if (!itemIds) {
      throw new Error("null itemIds");
    }
    var userId = this.getCurrentUserId();
    var instance = this;
    return Promise.all(itemIds.map(function (itemId) {
      var url = instance.getUrl("Users/" + userId + "/Items/" + itemId + "/HideFromResume", {
        Hide: hide !== false
      });
      return instance.ajax({
        type: "POST",
        url: url,
        dataType: "json"
      }).then(onUserDataUpdated.bind({
        instance: instance,
        userId: userId,
        itemId: itemId
      }));
    }));
  };
  ApiClient.prototype.getItemCounts = function (userId) {
    var options = {};
    if (userId) {
      options.userId = userId;
    }
    var url = this.getUrl("Items/Counts", options);
    return this.getJSON(url);
  };

  /**
   * Clears a user's personal rating for an item
   * @param {String} userId
   * @param {String} itemId
   */
  ApiClient.prototype.clearUserItemRating = function (userId, itemId) {
    if (!userId) {
      throw new Error("null userId");
    }
    if (!itemId) {
      throw new Error("null itemId");
    }
    var method = 'POST';
    var url = this.getUrl("Users/" + userId + "/Items/" + itemId + "/Rating/Delete");
    return this.ajax({
      type: method,
      url: url,
      dataType: "json"
    }).then(onUserDataUpdated.bind({
      instance: this,
      userId: userId,
      itemId: itemId
    }));
  };

  /**
   * Reports the user has started playing something
   * @param {String} userId
   * @param {String} itemId
   */
  ApiClient.prototype.reportPlaybackStart = function (options) {
    if (!options) {
      throw new Error("null options");
    }
    if (isLocalId(options.ItemId)) {
      return Promise.resolve();
    }
    this.lastPlaybackProgressReport = 0;
    this.lastPlaybackProgressReportTicks = null;
    var url = this.getUrl("Sessions/Playing");
    var promise = this.ajax({
      type: "POST",
      data: JSON.stringify(options),
      contentType: "application/json",
      url: url
    });

    // in case user is idling
    if (options.ItemId && !isLocalId(options.ItemId)) {
      this.ensureWebSocket();
    }
    return promise;
  };
  ApiClient.prototype.shouldSkipProgressReport = function (eventName, positionTicks) {
    if ((eventName || 'timeupdate') === 'timeupdate') {
      var now = Date.now();
      var msSinceLastReport = now - (this.lastPlaybackProgressReport || 0);
      if (msSinceLastReport <= 10000) {
        if (!positionTicks) {
          return true;
        }
        var expectedReportTicks = msSinceLastReport * 10000 + (this.lastPlaybackProgressReportTicks || 0);
        if (Math.abs((positionTicks || 0) - expectedReportTicks) < 5000 * 10000) {
          return true;
        }
      }
    }
    return false;
  };

  /**
   * Reports progress viewing an item
   * @param {String} userId
   * @param {String} itemId
   */
  ApiClient.prototype.reportPlaybackProgress = function (options) {
    if (!options) {
      throw new Error("null options");
    }
    var newPositionTicks = options.PositionTicks;
    if ((options.EventName || 'timeupdate') === 'timeupdate') {
      var now = Date.now();
      var msSinceLastReport = now - (this.lastPlaybackProgressReport || 0);
      if (msSinceLastReport <= 10000) {
        if (!newPositionTicks) {
          return Promise.resolve();
        }
        var expectedReportTicks = msSinceLastReport * 10000 + (this.lastPlaybackProgressReportTicks || 0);
        if (Math.abs((newPositionTicks || 0) - expectedReportTicks) < 5000 * 10000) {
          return Promise.resolve();
        }
      }
      this.lastPlaybackProgressReport = now;
    } else {
      // allow the next timeupdate
      this.lastPlaybackProgressReport = 0;
    }
    this.lastPlaybackProgressReportTicks = newPositionTicks;
    var url = this.getUrl("Sessions/Playing/Progress");
    return this.ajax({
      type: "POST",
      data: JSON.stringify(options),
      contentType: "application/json",
      url: url
    });
  };
  ApiClient.prototype.reportOfflineActions = function (actions) {
    if (!actions) {
      throw new Error("null actions");
    }
    var url = this.getUrl("Sync/OfflineActions");
    return this.ajax({
      type: "POST",
      data: JSON.stringify(actions),
      contentType: "application/json",
      url: url
    });
  };
  ApiClient.prototype.syncData = function (data) {
    if (!data) {
      throw new Error("null data");
    }
    var url = this.getUrl("Sync/Data");
    return this.ajax({
      type: "POST",
      data: JSON.stringify(data),
      contentType: "application/json",
      url: url,
      dataType: "json"
    });
  };
  ApiClient.prototype.getReadySyncItems = function (deviceId) {
    if (!deviceId) {
      throw new Error("null deviceId");
    }
    var url = this.getUrl("Sync/Items/Ready", {
      TargetId: deviceId
    });
    return this.getJSON(url);
  };
  ApiClient.prototype.getSyncJobs = function (query) {
    var instance = this;
    var mode = query.mode;
    delete query.mode;
    return instance.getJSON(instance.getUrl('Sync/Jobs', query)).then(function (result) {
      var items = result.Items;
      for (var i = 0, length = items.length; i < length; i++) {
        var item = items[i];
        item.SyncJobType = mode === 'convert' ? 'Convert' : 'Download';
        setSyncJobProperties(item, instance);
      }
      return result;
    });
  };
  ApiClient.prototype.createSyncJob = function (options) {
    return this.ajax({
      type: "POST",
      url: this.getUrl("Sync/Jobs"),
      data: JSON.stringify(options),
      contentType: "application/json",
      dataType: 'json'
    }).then(onSyncJobCreated.bind({
      instance: this
    }));
  };
  ApiClient.prototype.reportSyncJobItemTransferred = function (syncJobItemId) {
    if (!syncJobItemId) {
      throw new Error("null syncJobItemId");
    }
    var url = this.getUrl("Sync/JobItems/" + syncJobItemId + "/Transferred");
    return this.ajax({
      type: "POST",
      url: url
    });
  };
  ApiClient.prototype.cancelSyncItems = function (itemIds, targetId) {
    if (!itemIds) {
      throw new Error("null itemIds");
    }
    var method = 'POST';
    var url = "Sync/" + (targetId || this.deviceId()) + "/Items/Delete";
    return this.ajax({
      type: method,
      url: this.getUrl(url, {
        ItemIds: itemIds.join(',')
      })
    });
  };
  ApiClient.prototype.clearUserTrackSelections = function (userId, type) {
    if (!userId) {
      throw new Error("null userId");
    }
    var instance = this;
    var method = 'POST';
    var url = this.getUrl("Users/" + userId + "/TrackSelections/" + type + "/Delete");
    return this.ajax({
      type: method,
      url: url
    }).then(function () {
      // todo: why do we need to update the cache here?
      return updateCachedUser(instance, userId);
    });
  };

  /**
   * Reports a user has stopped playing an item
   * @param {String} userId
   * @param {String} itemId
   */
  ApiClient.prototype.reportPlaybackStopped = function (options) {
    if (!options) {
      throw new Error("null options");
    }
    this.lastPlaybackProgressReport = 0;
    this.lastPlaybackProgressReportTicks = null;
    var url = this.getUrl("Sessions/Playing/Stopped");
    return this.ajax({
      type: "POST",
      data: JSON.stringify(options),
      contentType: "application/json",
      url: url
    });
  };
  ApiClient.prototype.sendPlayCommand = function (sessionId, options) {
    if (!sessionId) {
      throw new Error("null sessionId");
    }
    if (!options) {
      throw new Error("null options");
    }
    var url = this.getUrl("Sessions/" + sessionId + "/Playing", options);
    return this.ajax({
      type: "POST",
      url: url
    });
  };
  ApiClient.prototype.sendCommand = function (sessionId, command) {
    if (!sessionId) {
      throw new Error("null sessionId");
    }
    if (!command) {
      throw new Error("null command");
    }
    var url = this.getUrl("Sessions/" + sessionId + "/Command");
    var ajaxOptions = {
      type: "POST",
      url: url
    };
    ajaxOptions.data = JSON.stringify(command);
    ajaxOptions.contentType = "application/json";
    return this.ajax(ajaxOptions);
  };
  ApiClient.prototype.sendMessageCommand = function (sessionId, options) {
    if (!sessionId) {
      throw new Error("null sessionId");
    }
    if (!options) {
      throw new Error("null options");
    }
    var url = this.getUrl("Sessions/" + sessionId + "/Message");
    var ajaxOptions = {
      type: "POST",
      url: url
    };
    ajaxOptions.data = JSON.stringify(options);
    ajaxOptions.contentType = "application/json";
    return this.ajax(ajaxOptions);
  };
  ApiClient.prototype.sendPlayStateCommand = function (sessionId, command, options) {
    if (!sessionId) {
      throw new Error("null sessionId");
    }
    if (!command) {
      throw new Error("null command");
    }
    var url = this.getUrl("Sessions/" + sessionId + "/Playing/" + command, options || {});
    return this.ajax({
      type: "POST",
      url: url
    });
  };
  ApiClient.prototype.getSavedEndpointInfo = function () {
    return this._endPointInfo;
  };
  ApiClient.prototype.getEndpointInfo = function (signal) {
    var savedValue = this._endPointInfo;
    if (savedValue) {
      return Promise.resolve(savedValue);
    }
    var instance = this;
    return this.getJSON(this.getUrl('System/Endpoint'), signal).then(function (endPointInfo) {
      endPointInfo.NetworkType = getNetworkType(endPointInfo);
      setSavedEndpointInfo(instance, endPointInfo);
      return endPointInfo;
    });
  };
  ApiClient.prototype.getWakeOnLanInfo = function () {
    return this.getJSON(this.getUrl('System/WakeOnLanInfo'));
  };
  ApiClient.prototype.getLatestItems = function () {
    var options = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
    return this.getJSON(this.getUrl("Users/" + this.getCurrentUserId() + "/Items/Latest", options));
  };
  ApiClient.prototype.getPlayQueue = function (options) {
    return this.getJSON(this.getUrl('Sessions/PlayQueue', options));
  };
  ApiClient.prototype.supportsWakeOnLan = function () {
    if (!_servicelocator.wakeOnLan.isSupported()) {
      return false;
    }
    return getCachedWakeOnLanInfo(this).length > 0;
  };
  ApiClient.prototype.wakeOnLan = function () {
    var infos = getCachedWakeOnLanInfo(this);
    return sendNextWakeOnLan(infos, 0);
  };
  ApiClient.prototype.getAddToPlaylistInfo = function (userId, id, addIds) {
    if (!this.isMinServerVersion('4.8.0.30')) {
      return Promise.resolve({
        ContainsDuplicates: false,
        ItemCount: addIds.length
      });
    }
    var apiName = 'Playlists';
    var url = this.getUrl(apiName + "/" + id + "/AddToPlaylistInfo", {
      Ids: addIds,
      userId: userId
    });
    return this.getJSON(url);
  };

  /**
   *  Add item to Playlist/Collections
   */
  ApiClient.prototype.addToList = function (userId, type, id, addIds, skipDuplicates) {
    var apiName = type === 'BoxSet' || type === 'Collection' ? 'Collections' : 'Playlists';
    var url = this.getUrl(apiName + "/" + id + "/Items");
    var dataType = type === 'Playlist' && this.isMinServerVersion('4.8.0.30') ? 'json' : null;
    var instance = this;
    return this.ajax({
      type: "POST",
      url: url,
      dataType: dataType,
      data: JSON.stringify({
        Ids: addIds.join(','),
        userId: userId,
        SkipDuplicates: type === 'Playlist' ? skipDuplicates : null
      }),
      contentType: "application/json"
    }).then(function (result) {
      if (!result) {
        result = {};
      }
      if (result.ItemAddedCount == null) {
        result.ItemAddedCount = addIds.length;
      }
      return onItemUpdated.call({
        instance: instance,
        itemId: id
      }, result);
    });
  };
  ApiClient.prototype.createList = function (userId, type, name, addIds) {
    var apiName = type === 'BoxSet' || type === 'Collection' ? 'Collections' : 'Playlists';
    var url = this.getUrl(apiName, {
      Name: name,
      Ids: addIds,
      userId: userId
    });
    return this.ajax({
      type: "POST",
      url: url,
      dataType: "json"
    }).then(function (result) {
      if (!result) {
        result = {};
      }
      if (result.ItemAddedCount == null) {
        result.ItemAddedCount = (addIds || []).length;
      }
      return Promise.resolve(result);
    });
  };
  ApiClient.prototype.setSystemInfo = function (systemInfo) {
    if (systemInfo.HasImageEnhancers != null) {
      this.hasImageEnhancers = systemInfo.HasImageEnhancers;
    }
    if (systemInfo.WakeOnLanInfo) {
      onWakeOnLanInfoFetched(this, systemInfo.WakeOnLanInfo);
    }
    this._serverVersion = systemInfo.Version;
  };
  ApiClient.prototype.serverVersion = function () {
    return this._serverVersion;
  };
  ApiClient.prototype.isMinServerVersion = function (version) {
    var serverVersion = this.serverVersion();
    if (serverVersion) {
      return compareVersions(serverVersion, version) >= 0;
    }
    return false;
  };
  ApiClient.prototype.handleMessageReceived = function (msg) {
    onMessageReceivedInternal(this, msg);
  };
  ApiClient.prototype.getSearchResults = function (query, signal) {
    if (!query.SearchTerm || query.SearchTerm.length < 1) {
      return Promise.resolve({
        Items: [],
        TotalRecordCount: 0,
        ItemTypes: []
      });
    }
    var promises = [];
    promises.push(this.getItems(this.getCurrentUserId(), query, signal));
    if (!query.StartIndex && !query.IncludeItemTypes && query.IncludeSearchTypes !== false) {
      promises.push(this.getItemTypes(this.getCurrentUserId(), query, signal));
    }
    return Promise.all(promises).then(function (responses) {
      if (responses.length > 1) {
        responses[0].ItemTypes = responses[1].Items;
      }
      return responses[0];
    });
  };
  ApiClient.prototype.getToneMapOptions = function () {
    var url = this.getUrl("Encoding/ToneMapOptions");
    return this.getJSON(url);
  };
  ApiClient.prototype.moveItemsInPlaylist = function (playlistId, items, newIndex) {
    var playlistItemIds = [];
    for (var i = 0, length = items.length; i < length; i++) {
      if (items[i].PlaylistItemId) {
        playlistItemIds.push(items[i].PlaylistItemId);
      }
    }
    var item = items[0];
    var playlistItemId = item.PlaylistItemId;
    return this.ajax({
      url: this.getUrl('Playlists/' + playlistId + '/Items/' + playlistItemId + '/Move/' + newIndex),
      type: 'POST'
    }).then(onItemsMovedInPlaylist.bind({
      instance: this,
      playlistItemIds: playlistItemIds,
      playlistId: playlistId
    }));
  };
  ApiClient.prototype.removeItemsFromPlaylist = function (playlistId, items) {
    var playlistItemIds = [];
    for (var i = 0, length = items.length; i < length; i++) {
      if (items[i].PlaylistItemId) {
        playlistItemIds.push(items[i].PlaylistItemId);
      }
    }
    var method = 'POST';
    var url = "Playlists/" + playlistId + "/Items/Delete";
    return this.ajax({
      url: this.getUrl(url, {
        EntryIds: playlistItemIds.join(',')
      }),
      type: method
    }).then(onItemsRemovedFromPlaylist.bind({
      instance: this,
      playlistItemIds: playlistItemIds,
      playlistId: playlistId
    }));
  };
  ApiClient.prototype.removeItemsFromCollection = function (collectionId, items) {
    var itemIds = [];
    for (var i = 0, length = items.length; i < length; i++) {
      itemIds.push(items[i].Id);
    }
    var method = 'POST';
    var url = "Collections/" + collectionId + "/Items/Delete";
    return this.ajax({
      url: this.getUrl(url, {
        Ids: itemIds.join(',')
      }),
      type: method
    }).then(onItemsRemovedFromCollections.bind({
      instance: this,
      collections: [{
        Id: collectionId,
        ItemIds: itemIds
      }]
    }));
  };
  ApiClient.prototype.removeItemsFromCollections = function (collections) {
    var instance = this;
    return Promise.all(collections.map(function (collection) {
      return instance.removeItemsFromCollection(collection.Id, collection.ItemIds.map(function (i) {
        return {
          Id: i
        };
      }));
    }));

    //    const method = 'POST';

    //    return this.ajax({

    //        url: this.getUrl('Collections/Items/Delete'),

    //        type: method,
    //        data: JSON.stringify(collections),
    //        contentType: "application/json"

    //    }).then(onItemsRemovedFromCollections.bind({
    //        instance: this,
    //        collections: collections
    //    }));
  };
  ApiClient.prototype.reconnectTest = function (signal) {
    return tryReconnect(this, signal);
  };
  ApiClient.prototype.mergeVersions = function (items) {
    var instance = this;
    return this.ajax({
      type: "POST",
      url: this.getUrl("Videos/MergeVersions", {
        Ids: items.map(mapToId).join(',')
      })
    }).then(function (result) {
      _events.default.trigger(instance, 'message', [{
        MessageType: 'ItemsMerged',
        Data: {
          Items: items.map(mapToId),
          IsLocalEvent: true
        }
      }]);
      return result;
    });
  };
  ApiClient.prototype.ungroupVersions = function (id) {
    var instance = this;
    var method = 'POST';
    var url = "Videos/" + id + "/AlternateSources/Delete";
    return instance.ajax({
      type: method,
      url: instance.getUrl(url)
    }).then(function (result) {
      _events.default.trigger(instance, 'message', [{
        MessageType: 'ItemsSplit',
        Data: {
          Items: [id],
          IsLocalEvent: true
        }
      }]);
      return result;
    });
  };
  ApiClient.prototype.makePublic = function (itemId) {
    var method = 'POST';
    var url = 'Items/' + itemId + '/MakePublic';
    return this.ajax({
      type: method,
      url: this.getUrl(url)
    }).then(onItemUpdated.bind({
      instance: this,
      itemId: itemId
    }));
  };
  ApiClient.prototype.makePrivate = function (itemId) {
    var method = 'POST';
    var url = 'Items/' + itemId + '/MakePrivate';
    return this.ajax({
      type: method,
      url: this.getUrl(url)
    }).then(onItemUpdated.bind({
      instance: this,
      itemId: itemId
    }));
  };
  ApiClient.prototype.updateUserItemAccess = function (options) {
    return this.ajax({
      type: 'POST',
      url: this.getUrl("Items/Access"),
      data: JSON.stringify(options),
      contentType: "application/json"
    });
  };
  ApiClient.prototype.leaveSharedItems = function (options) {
    return this.ajax({
      type: 'POST',
      url: this.getUrl("Items/Shared/Leave"),
      data: JSON.stringify(options),
      contentType: "application/json"
    }).then(onItemsDeleted.bind({
      instance: this,
      items: options.ItemIds.map(function (i) {
        return {
          Id: i
        };
      })
    }));
  };
  ApiClient.prototype.downloadSubtitles = function (itemId, mediaSourceId, id) {
    return this.ajax({
      type: "POST",
      url: this.getUrl('Items/' + itemId + '/RemoteSearch/Subtitles/' + id, {
        MediaSourceId: mediaSourceId
      }),
      dataType: 'json'
    }).then(onItemUpdated.bind({
      instance: this,
      itemId: itemId
    }));
  };
  ApiClient.prototype.resetMetadata = function (options) {
    return this.ajax({
      type: "POST",
      url: this.getUrl('items/metadata/reset'),
      data: JSON.stringify(options),
      contentType: "application/json"
    }).then(onItemsUpdated.bind({
      instance: this,
      itemIds: options.ItemIds.split(',')
    }));
  };
  ApiClient.prototype.applyRemoteSearchResult = function (itemId, searchResult, options) {
    return this.ajax({
      type: "POST",
      url: this.getUrl("Items/RemoteSearch/Apply/" + itemId, options),
      data: JSON.stringify(searchResult),
      contentType: "application/json"
    }).then(onItemUpdated.bind({
      instance: this,
      itemId: itemId
    }));
  };
  ApiClient.prototype.deleteSubtitles = function (itemId, mediaSourceId, subtitleStreamIndex) {
    var method = 'POST';
    var url = 'Videos/' + itemId + '/Subtitles/' + subtitleStreamIndex + '/Delete';
    return this.ajax({
      type: method,
      url: this.getUrl(url, {
        MediaSourceId: mediaSourceId
      })
    }).then(onItemUpdated.bind({
      instance: this,
      itemId: itemId
    }));
  };
  ApiClient.prototype.cancelSyncJobs = function (ids) {
    var instance = this;
    return Promise.all(ids.map(function (id) {
      return instance.ajax({
        url: instance.getUrl('Sync/Jobs/' + id + '/Delete'),
        type: 'POST'
      });
    })).then(onSyncJobCancelled.bind({
      instance: this
    }));
  };
  ApiClient.prototype.cancelSyncJobItems = function (ids) {
    var instance = this;
    return Promise.all(ids.map(function (id) {
      return instance.ajax({
        url: instance.getUrl('Sync/JobItems/' + id + '/Delete'),
        type: 'POST'
      });
    })).then(onSyncJobItemCancelled.bind({
      instance: this
    }));
  };
  ApiClient.prototype.removeEmbyConnectLink = function (userId) {
    var method = 'POST';
    var url = 'Users/' + userId + '/Connect/Link/Delete';
    return this.ajax({
      type: method,
      url: this.getUrl(url)
    });
  };
  ApiClient.prototype.createApiKey = function (options) {
    return this.ajax({
      type: "POST",
      url: this.getUrl('Auth/Keys', options)
    }).then(onApiKeyCreated.bind({
      instance: this
    }));
  };
  ApiClient.prototype.deleteApiKeySingle = function (accessToken) {
    var method = 'POST';
    var url = 'Auth/Keys/' + accessToken + "/Delete";
    return this.ajax({
      type: method,
      url: this.getUrl(url)
    });
  };
  ApiClient.prototype.deleteApiKeys = function (items) {
    return Promise.all(items.map(mapToAccessToken).map(this.deleteApiKeySingle.bind(this))).then(onApiKeysDeleted.bind({
      instance: this,
      items: items
    }));
  };
  ApiClient.prototype.deleteDevice = function (id) {
    return this.deleteDevices([{
      Id: id
    }]);
  };
  ApiClient.prototype.deleteDeviceSingle = function (id) {
    var method = 'POST';
    var url = "Devices/Delete";
    return this.ajax({
      type: method,
      url: this.getUrl(url, {
        Id: id
      })
    });
  };
  ApiClient.prototype.deleteDevices = function (items) {
    return Promise.all(items.map(mapToId).map(this.deleteDeviceSingle.bind(this))).then(onDevicesDeleted.bind({
      instance: this,
      items: items
    }));
  };
  ApiClient.prototype.deleteLiveTVTunerDevice = function (id) {
    var method = 'POST';
    var url = "LiveTv/TunerHosts/Delete";
    return this.ajax({
      type: method,
      url: this.getUrl(url, {
        Id: id
      })
    }).then(onLiveTVTunerDevicesDeleted.bind({
      instance: this
    }));
  };
  ApiClient.prototype.deleteLiveTVGuideSource = function (id) {
    var method = 'POST';
    var url = "LiveTv/ListingProviders/Delete";
    return this.ajax({
      type: method,
      url: this.getUrl(url, {
        Id: id
      })
    }).then(onLiveTVGuideSourcesDeleted.bind({
      instance: this
    }));
  };
  ApiClient.prototype.getConfigurationPages = function (options, signal) {
    if (options != null && options.EnableInUserMenu) {
      if (!this.isMinServerVersion('4.8.0.20')) {
        return Promise.resolve([]);
      }
    }
    return this.getJSON(this.getUrl("web/configurationpages", Object.assign({
      PageType: 'PluginConfiguration',
      UserId: this.getCurrentUserId()
    }, options)), signal);
  };
  ApiClient.prototype.getAvailableRecordingOptions = function () {
    if (!this.isMinServerVersion('4.8.0.58')) {
      return Promise.resolve({
        RecordingFolders: [],
        MovieRecordingFolders: [],
        SeriesRecordingFolders: []
      });
    }
    return this.getJSON(this.getUrl('LiveTV/AvailableRecordingOptions'));
  };
  ApiClient.prototype.copyUserDataToUsers = function (options, signal) {
    var userId = options.userId;
    delete options.userId;
    return this.ajax({
      type: "POST",
      url: this.getUrl("Users/" + userId + "/CopyData", {}),
      data: JSON.stringify(options),
      contentType: "application/json"
    });
  };
  function expandLatestSectionBlock(instance, options) {
    var user = options.user;
    var result = [];
    return instance.getUserViews({}, user.Id).then(function (userViewsResult) {
      var userViews = userViewsResult.Items;
      var excludeViewTypes = ['playlists', 'livetv', 'boxsets', 'channels'];
      for (var i = 0, length = userViews.length; i < length; i++) {
        var item = userViews[i];
        if (user.Configuration.LatestItemsExcludes.includes(item.Id)) {
          continue;
        }
        if (item.Guid && user.Configuration.LatestItemsExcludes.includes(item.Guid)) {
          continue;
        }
        var collectionType = item.CollectionType;
        if (excludeViewTypes.includes(collectionType)) {
          continue;
        }
        var monitor = ['markplayed'];
        if (collectionType !== 'music' && collectionType !== 'audiobooks') {
          monitor.push('videoplayback');
        }
        result.push({
          Id: 'latestmedia_' + item.Id,
          SectionType: 'latestmedia',
          Name: globalize.translate('LatestFromLibrary', item.Name),
          ParentItem: item,
          CollectionType: item.CollectionType,
          Monitor: monitor
        });
      }
      return result;
    });
  }
  function expandOnNowSectionBlock(instance, options) {
    var result = [];
    var user = options.user;
    if (!user.Policy.EnableLiveTvAccess) {
      return Promise.resolve(result);
    }
    result.push({
      Id: 'onnow',
      SectionType: 'onnow',
      Name: globalize.translate('HeaderOnNow'),
      CollectionType: 'livetv',
      PremiumFeature: 'livetv',
      PremiumMessage: globalize.translate('DvrSubscriptionRequired', '', ''),
      RefreshInterval: 300000
    });
    return Promise.resolve(result);
  }
  function expandSectionBlock(instance, section, allSectionIds, options) {
    var result = [];
    var name;
    var collectionType;
    var monitor = [];
    var cardSizeOffset;
    var viewType;
    var sectionType = section;
    var includeNextUp;
    switch (section) {
      case 'latestmedia':
        return expandLatestSectionBlock(instance, options);
      case 'smalllibrarytiles':
        sectionType = 'userviews';
        name = globalize.translate('HeaderMyMedia');
        cardSizeOffset = -1;
        break;
      case 'librarybuttons':
        sectionType = 'userviews';
        name = globalize.translate('HeaderMyMedia');
        viewType = 'buttons';
        break;
      case 'resume':
        name = globalize.translate('HeaderContinueWatching');
        monitor.push('videoplayback');
        monitor.push('markplayed');
        includeNextUp = allSectionIds.includes('nextup') ? false : null;
        break;
      case 'resumeaudio':
        name = globalize.translate('HeaderContinueListening');
        monitor.push('audioplayback');
        monitor.push('markplayed');
        break;
      case 'latestmoviereleases':
        name = globalize.translate('RecentlyReleasedMovies');
        collectionType = 'movies';
        break;
      case 'playlists':
        name = globalize.translate('Playlists');
        collectionType = 'playlists';
        break;
      case 'collections':
        name = globalize.translate('Collections');
        collectionType = 'boxsets';
        break;
      case 'activerecordings':
        name = globalize.translate('HeaderActiveRecordings');
        monitor.push('RecordingStarted');
        monitor.push('RecordingEnded');
        break;
      case 'nextup':
        name = globalize.translate('HeaderNextUp');
        monitor.push('videoplayback');
        monitor.push('markplayed');
        collectionType = 'tvshows';
        break;
      case 'onnow':
      case 'livetv':
        return expandOnNowSectionBlock(instance, options);
      default:
        return Promise.resolve(result);
    }
    result.push({
      Id: section,
      SectionType: sectionType,
      Name: name,
      CollectionType: collectionType,
      Monitor: monitor,
      CardSizeOffset: cardSizeOffset,
      ViewType: viewType,
      IncludeNextUp: includeNextUp
    });
    return Promise.resolve(result);
  }
  function generateHomeScreenSections(instance, options) {
    var finalSections = [];
    var sections = userSettings.getHomeScreenSections();
    var promises = [];
    for (var i = 0, length = sections.length; i < length; i++) {
      promises.push(expandSectionBlock(instance, sections[i], sections, options));
    }
    return Promise.all(promises).then(function (responses) {
      for (var _i2 = 0, _length2 = responses.length; _i2 < _length2; _i2++) {
        finalSections = finalSections.concat(responses[_i2]);
      }
      return finalSections;
    });
  }
  ApiClient.prototype.moveHomeScreenSections = function (options, signal) {
    var userId = options.userId;
    delete options.userId;
    return this.ajax({
      type: "POST",
      url: this.getUrl("Users/" + userId + "/HomeSections/Move", {}),
      data: JSON.stringify(options),
      contentType: "application/json"
    });
  };
  ApiClient.prototype.deleteHomeScreenSections = function (options, signal) {
    var userId = options.userId;
    delete options.userId;
    return this.ajax({
      type: "POST",
      url: this.getUrl("Users/" + userId + "/HomeSections/Delete", {}),
      data: JSON.stringify(options),
      contentType: "application/json"
    });
  };
  ApiClient.prototype.saveHomeScreenSection = function (userId, options, signal) {
    return this.ajax({
      type: "POST",
      url: this.getUrl("Users/" + userId + "/HomeSections", {}),
      data: JSON.stringify(options),
      contentType: "application/json"
    });
  };
  ApiClient.prototype.getHomeScreenSections = function (options, signal) {
    var instance = this;
    return Promise.all([loadGlobalize(), loadUserSettings()]).then(function () {
      if (instance.supportsServerHomeSections()) {
        var userId = options.user.Id;
        var queryParams = {};
        if (options.isEditMode) {
          queryParams.isEditMode = options.isEditMode;
        }
        return instance.getJSON(instance.getUrl("Users/" + userId + "/HomeSections", queryParams), signal);
      }
      return generateHomeScreenSections(instance, options);
    });
  };
  ApiClient.prototype.supportsServerHomeSections = function () {
    //if (this.isMinServerVersion('4.10.0.1')) {
    //    return true;
    //}
    return false;
  };
  ApiClient.prototype.getHomeScreenSectionItems = function (options, signal) {
    var query = options.query;
    var userId = this.getCurrentUserId();
    var section = options.section;
    var sectionType = section.SectionType;
    var sectionId = section.Id;
    if (this.supportsServerHomeSections()) {
      if (!['latestdownloads'].includes(sectionId)) {
        if (!section.RandomSeed) {
          section.RandomSeed = Math.floor(Math.random() * 10000000) + 1;
        }
        if (!query) {
          query = {};
        }
        query.RandomSeed = section.RandomSeed;
        return this.getJSON(this.getUrl("Users/" + userId + "/Sections/" + sectionId + "/Items", query), signal);
      }
    }
    var parentItem = section.ParentItem;
    switch (sectionType) {
      case 'playlists':
        return this.getItems(userId, Object.assign({
          IncludeItemTypes: 'Playlist',
          Recursive: true
        }, query), signal);
      case 'collections':
        return this.getItems(userId, Object.assign({
          IncludeItemTypes: 'BoxSet',
          Recursive: true
        }, query), signal);
      case 'latestmoviereleases':
        var minPremiereDate = new Date(Date.now());
        minPremiereDate.setFullYear(minPremiereDate.getFullYear() - 1);
        return this.getItems(userId, Object.assign({
          IncludeItemTypes: 'Movie',
          Recursive: true,
          SortBy: 'ProductionYear,PremiereDate,SortName',
          SortOrder: 'Descending',
          MinPremiereDate: minPremiereDate.toISOString()
        }, query), signal);
      case 'resume':
        return this.getResumableItems(userId, Object.assign({
          Recursive: true,
          MediaTypes: 'Video',
          IncludeNextUp: section.IncludeNextUp
        }, query), signal);
      case 'resumeaudio':
        return this.getResumableItems(userId, Object.assign({
          Recursive: true,
          MediaTypes: 'Audio'
        }, query), signal);
      case 'nextup':
        return this.getNextUpEpisodes(Object.assign({
          LegacyNextUp: true,
          UserId: userId
        }, query), signal);
      case 'activerecordings':
        return this.getLiveTvRecordings(Object.assign({
          userId: userId,
          IsInProgress: true
        }, query), signal);
      case 'userviews':
        return this.getUserViews(Object.assign({}, query), userId, signal);
      case 'onnow':
        query = Object.assign({
          userId: userId,
          IsAiring: true,
          EnableUserData: false
        }, query);
        userSettings.addLiveTvChannelSortingToQuery(query, globalize);
        return this.getLiveTvChannels(query, signal);
      case 'latestdownloads':
        if (!_servicelocator.appHost.supports('sync')) {
          return Promise.resolve({
            TotalRecordCount: 0,
            Items: []
          });
        }
        return this.getLatestOfflineItems(Object.assign({
          Filters: 'IsNotFolder',
          Limit: 20
        }, query), signal);
      case 'latestmedia':
        return this.getLatestItems(Object.assign({
          ParentId: parentItem == null ? void 0 : parentItem.Id
        }, query), signal);
      default:
        console.log('unexpected section type: ' + console.log(sectionType));
        return Promise.resolve({
          TotalRecordCount: 0,
          Items: []
        });
    }
  };
  ApiClient.prototype.getParties = function () {
    return this.getJSON(this.getUrl("Parties"));
  };
  ApiClient.prototype.leaveParty = function () {
    return this.ajax({
      type: "POST",
      url: this.getUrl("Parties/Leave")
    });
  };
  ApiClient.prototype.joinParty = function (id) {
    var params = {
      Id: id
    };
    return this.ajax({
      type: "POST",
      url: this.getUrl("Parties/Join", params),
      data: JSON.stringify(params),
      contentType: "application/json"
    });
  };
  ApiClient.prototype.createParty = function (name) {
    return this.ajax({
      type: "POST",
      url: this.getUrl("Parties"),
      data: JSON.stringify({
        Name: name
      }),
      contentType: "application/json"
    });
  };
  ApiClient.prototype.getPartyInfo = function () {
    return this.getJSON(this.getUrl("Parties/Info"));
  };
  ApiClient.prototype.getUrl = getUrl;
  ApiClient.getUrl = getUrl;
  ApiClient.prototype.getScaledImageUrl = function (itemId, options) {
    return this.getImageUrl(itemId, options);
  };
  ApiClient.isLocalId = isLocalId;
  ApiClient.isLocalItem = isLocalItem;
  var _default = _exports.default = ApiClient;
});
