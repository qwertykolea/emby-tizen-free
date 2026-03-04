define(["exports", "./../emby-apiclient/events.js", "./playback/playbackmanager.js", "./input/api.js", "./../emby-apiclient/connectionmanager.js"], function (_exports, _events, _playbackmanager, _api, _connectionmanager) {
  Object.defineProperty(_exports, "__esModule", {
    value: true
  });
  _exports.default = void 0;
  /* jshint module: true */

  function onChannelManagementInfoUpdated(e, apiClient, data) {
    var instance = this;
    var item = data.Channel;
    if (item) {
      var id = data.Id;
      var options = instance.options;
      if (options) {
        var itemsContainer = options.itemsContainer;
        var index = itemsContainer.indexOfItemId(id);
        if (index !== -1) {
          itemsContainer.onItemUpdated(index, item);
        }
      }
    } else if (getEventsToMonitor(instance).includes('ChannelManagementInfoUpdated')) {
      instance.notifyRefreshNeeded(data.IsLocalEvent);
    }
  }
  function onUserDataChanged(e, apiClient, userData, data) {
    var instance = this;
    var options = instance.options;
    if (options) {
      if (!options.enableUserData) {
        return;
      }
      var itemsContainer = options.itemsContainer;
      var index = itemsContainer.indexOfItemId(userData.ItemId);
      if (index !== -1) {
        var item = itemsContainer.getItem(index);
        if (item) {
          item.UserData = userData;
          itemsContainer.onItemUpdated(index, item);
        }
      }
    }
    var eventsToMonitor = getEventsToMonitor(instance);

    // TODO: Check user data change reason?
    if (eventsToMonitor.includes('markfavorite')) {
      instance.notifyRefreshNeeded(data.IsLocalEvent);
    } else if (eventsToMonitor.includes('markplayed')) {
      instance.notifyRefreshNeeded(data.IsLocalEvent);
    }
  }
  function getEventsToMonitor(instance) {
    var options = instance.options;
    if (options) {
      var itemsContainer = options.itemsContainer;
      if (itemsContainer) {
        if (itemsContainer.getEventsToMonitor) {
          return itemsContainer.getEventsToMonitor();
        }
      }
      var monitor = options.monitorEvents;
      if (monitor) {
        return monitor.split(',');
      }
    }
    return [];
  }
  function onTimerCreated(e, apiClient, data) {
    var instance = this;
    var programId = data.ProgramId;
    // This could be null, not supported by all tv providers
    var newTimerId = data.Id;
    if (newTimerId) {
      var options = instance.options;
      if (options) {
        var itemsContainer = options.itemsContainer;
        var index = itemsContainer.indexOfItemId(programId);
        if (index !== -1) {
          var item = itemsContainer.getItem(index);
          if (item) {
            item.TimerId = newTimerId;
            itemsContainer.onItemUpdated(index, item);
          }
        }
      }
    }
    if (getEventsToMonitor(instance).includes('Timers')) {
      instance.notifyRefreshNeeded(data.IsLocalEvent);
    }
  }
  function onPluginsUninstalled(e, apiClient, data) {
    var instance = this;
    if (getEventsToMonitor(instance).includes('Plugins')) {
      instance.notifyRefreshNeeded(data.IsLocalEvent);
      return;
    }
  }
  function onUserNotificationsSaved(e, apiClient, data) {
    var instance = this;
    if (getEventsToMonitor(instance).includes('UserNotifications')) {
      instance.notifyRefreshNeeded(data.IsLocalEvent);
      return;
    }
  }
  function onUserNotificationsDeleted(e, apiClient, data) {
    var instance = this;
    if (getEventsToMonitor(instance).includes('UserNotifications')) {
      instance.notifyRefreshNeeded(data.IsLocalEvent);
      return;
    }
  }
  function onSyncJobCreated(e, apiClient, data) {
    var instance = this;
    if (getEventsToMonitor(instance).includes('SyncJobs')) {
      instance.notifyRefreshNeeded(data.IsLocalEvent);
      return;
    }
  }
  function onSyncJobItemCancelled(e, apiClient, data) {
    var instance = this;
    if (getEventsToMonitor(instance).includes('SyncJobItems')) {
      instance.notifyRefreshNeeded(data.IsLocalEvent);
      return;
    }
  }
  function onSyncJobItemUpdated(e, apiClient, data) {
    var instance = this;
    if (getEventsToMonitor(instance).includes('SyncJobItems')) {
      var options = instance.options;
      if (options) {
        var itemsContainer = options.itemsContainer;
        var index = itemsContainer.indexOfItemId(data.Id);
        if (index !== -1) {
          var item = itemsContainer.getItem(index);
          if (item) {
            Object.assign(item, data);
            itemsContainer.onItemUpdated(index, item);
          }
        }
      }
    }
  }
  function onSyncJobCancelled(e, apiClient, data) {
    var instance = this;
    if (getEventsToMonitor(instance).includes('SyncJobs')) {
      instance.notifyRefreshNeeded(data.IsLocalEvent);
      return;
    }
  }
  function onSyncJobUpdated(e, apiClient, data) {
    var instance = this;
    if (getEventsToMonitor(instance).includes('SyncJobs')) {
      var options = instance.options;
      if (options) {
        var itemsContainer = options.itemsContainer;
        var index = itemsContainer.indexOfItemId(data.Id);
        if (index !== -1) {
          var item = itemsContainer.getItem(index);
          if (item) {
            Object.assign(item, data);
            itemsContainer.onItemUpdated(index, item);
          }
        }
      }
    }
  }
  function onUsersDeleted(e, apiClient, data) {
    var instance = this;
    if (getEventsToMonitor(instance).includes('Users')) {
      instance.notifyRefreshNeeded(data.IsLocalEvent);
      return;
    }
  }
  function onScheduledTaskTriggersUpdated(e, apiClient, data) {
    var instance = this;
    if (getEventsToMonitor(instance).includes('ScheduledTaskTriggers')) {
      instance.notifyRefreshNeeded(data.IsLocalEvent);
      return;
    }
  }
  function onCredentialsUpdated() {
    var instance = this;
    if (getEventsToMonitor(instance).includes('Servers')) {
      instance.notifyRefreshNeeded(true);
      return;
    }
  }
  function onApiKeyCreated(e, apiClient, data) {
    var instance = this;
    if (getEventsToMonitor(instance).includes('ApiKeys')) {
      instance.notifyRefreshNeeded(data.IsLocalEvent);
      return;
    }
  }
  function onApiKeysDeleted(e, apiClient, data) {
    var instance = this;
    if (getEventsToMonitor(instance).includes('ApiKeys')) {
      instance.notifyRefreshNeeded(data.IsLocalEvent);
      return;
    }
  }
  function onDevicesDeleted(e, apiClient, data) {
    var instance = this;
    if (getEventsToMonitor(instance).includes('Devices')) {
      instance.notifyRefreshNeeded(data.IsLocalEvent);
      return;
    }
  }
  function onLiveTVGuideSourcesDeleted(e, apiClient, data) {
    var instance = this;
    if (getEventsToMonitor(instance).includes('LiveTVGuideSources')) {
      instance.notifyRefreshNeeded(data.IsLocalEvent);
      return;
    }
  }
  function onLiveTVTunerDevicesDeleted(e, apiClient, data) {
    var instance = this;
    if (getEventsToMonitor(instance).includes('LiveTVTunerDevices')) {
      instance.notifyRefreshNeeded(data.IsLocalEvent);
      return;
    }
  }
  function onTimerCancelled(e, apiClient, data) {
    var instance = this;
    var programId = data.ProgramId;
    if (programId) {
      var options = instance.options;
      if (options) {
        var itemsContainer = options.itemsContainer;
        var index = itemsContainer.indexOfItemId(programId);
        if (index !== -1) {
          var item = itemsContainer.getItem(index);
          if (item) {
            item.TimerId = null;
            itemsContainer.onItemUpdated(index, item);
          }
        }
      }
    }
    if (getEventsToMonitor(instance).includes('Timers')) {
      instance.notifyRefreshNeeded(data.IsLocalEvent);
      return;
    }
  }
  function onSeriesTimerUpdated(e, apiClient, data) {
    var instance = this;
    if (getEventsToMonitor(instance).includes('SeriesTimers')) {
      instance.notifyRefreshNeeded(data.IsLocalEvent);
      return;
    }
  }
  function onSeriesTimerCreated(e, apiClient, data) {
    var instance = this;
    if (getEventsToMonitor(instance).includes('SeriesTimers')) {
      instance.notifyRefreshNeeded(data.IsLocalEvent);
      return;
    }
  }
  function onSeriesTimerCancelled(e, apiClient, data) {
    var instance = this;
    if (getEventsToMonitor(instance).includes('SeriesTimers')) {
      instance.notifyRefreshNeeded(data.IsLocalEvent);
      return;
    }
  }
  function onItemsRemovedFromCollection(e, apiClient, data) {
    var _instance$options;
    var instance = this;
    if ((_instance$options = instance.options) != null && _instance$options.itemIds.includes(data.CollectionId || -1) && getEventsToMonitor(instance).includes('CollectionItems')) {
      instance.notifyRefreshNeeded(data.IsLocalEvent);
      return;
    }
  }
  function onItemsRemovedFromPlaylist(e, apiClient, data) {
    var _instance$options2;
    var instance = this;
    if ((_instance$options2 = instance.options) != null && _instance$options2.itemIds.includes(data.PlaylistId || -1) && getEventsToMonitor(instance).includes('PlaylistItems')) {
      instance.notifyRefreshNeeded(data.IsLocalEvent);
      return;
    }
  }
  function onRecordingStarted(e, apiClient, data) {
    var instance = this;
    if (getEventsToMonitor(instance).includes('RecordingStarted')) {
      instance.notifyRefreshNeeded(true);
      return;
    }
  }
  function onRecordingEnded(e, apiClient, data) {
    var instance = this;
    if (getEventsToMonitor(instance).includes('RecordingEnded')) {
      instance.notifyRefreshNeeded(true);
      return;
    }
  }
  function includesAny(array1, array2) {
    return array1.some(function (r) {
      return array2.includes(r);
    });
  }
  function onItemsMerged(e, apiClient, data) {
    var instance = this;
    var itemsUpdated = data.Items || [];
    var options = instance.options;
    if (!options) {
      return;
    }
    var itemsContainer = options.itemsContainer;
    var itemIds = options.itemIds;
    if (itemIds && includesAny(itemsUpdated, itemIds)) {
      instance.notifyRefreshNeeded(data.IsLocalEvent);
      return;
    }
    for (var i = 0, length = itemsUpdated.length; i < length; i++) {
      var updateditemId = itemsUpdated[i];
      if (itemsContainer.indexOfItemId(updateditemId) !== -1) {
        instance.notifyRefreshNeeded(data.IsLocalEvent);
        return;
      }
    }
  }
  function onLibraryChanged(e, apiClient, data) {
    var instance = this;
    var eventsToMonitor = getEventsToMonitor(instance);
    if (eventsToMonitor.includes('SeriesTimers') || eventsToMonitor.includes('Timers')) {
      // yes this is an assumption that if the container is subscribed to these events, then it doesn't care about the library
      return;
    }
    var itemsAdded = data.ItemsAdded || [];
    var itemsRemoved = data.ItemsRemoved || [];
    var itemsUpdated = data.ItemsUpdated || [];
    var options = instance.options;
    if (options) {
      var itemsContainer = options.itemsContainer;
      var itemIds = options.itemIds;
      if (itemIds && includesAny(itemsUpdated, itemIds)) {
        instance.notifyRefreshNeeded(data.IsLocalEvent);
        return;
      }

      // eventually when we can indicate what changed, we should check that instead of IsLocalEvent
      if ((options.refreshOnItemUpdated || data.IsLocalEvent) && options.refreshOnItemUpdated !== false) {
        for (var i = 0, length = itemsUpdated.length; i < length; i++) {
          var updateditemId = itemsUpdated[i];
          if (itemsContainer.indexOfItemId(updateditemId) !== -1) {
            instance.notifyRefreshNeeded(data.IsLocalEvent);
            return;
          }
        }
      }
    }
    if (!itemsAdded.length && !itemsRemoved.length) {
      return;
    }
    if (options) {
      var _itemsContainer = options.itemsContainer;
      for (var _i = 0, _length = itemsRemoved.length; _i < _length; _i++) {
        var removedItemId = itemsRemoved[_i];
        if (_itemsContainer.indexOfItemId(removedItemId) !== -1) {
          instance.notifyRefreshNeeded(data.IsLocalEvent);
          return;
        }
      }
      var parentId = options.parentId;
      if (parentId) {
        var foldersAddedTo = data.FoldersAddedTo || [];
        var foldersRemovedFrom = data.FoldersRemovedFrom || [];
        var collectionFolders = data.CollectionFolders || [];
        if (!foldersAddedTo.includes(parentId) && !foldersRemovedFrom.includes(parentId) && !collectionFolders.includes(parentId)) {
          return;
        }
      }
    }
    instance.notifyRefreshNeeded(data.IsLocalEvent);
  }
  function onPlaybackStopped(e, stopInfo) {
    var instance = this;
    var state = stopInfo.state;
    var eventsToMonitor = getEventsToMonitor(instance);
    if (state.NowPlayingItem && state.NowPlayingItem.MediaType === 'Video') {
      if (eventsToMonitor.includes('videoplayback')) {
        instance.notifyRefreshNeeded(true);
        return;
      }
    } else if (state.NowPlayingItem && state.NowPlayingItem.MediaType === 'Audio') {
      if (eventsToMonitor.includes('audioplayback')) {
        instance.notifyRefreshNeeded(true);
        return;
      }
    }
  }
  function onPlayerChanged() {
    var instance = this;
    var eventsToMonitor = getEventsToMonitor(instance);
    if (eventsToMonitor.includes('nowplaying')) {
      instance.notifyRefreshNeeded(true);
      return;
    }
  }
  function addNotificationEvent(instance, name, handler, owner) {
    var localHandler = handler.bind(instance);
    owner = owner || _api.default;
    _events.default.on(owner, name, localHandler);
    instance['event_' + name] = localHandler;
  }
  function removeNotificationEvent(instance, name, handler, owner) {
    var localHandler = instance['event_' + name];
    if (localHandler) {
      owner = owner || _api.default;
      _events.default.off(owner, name, localHandler);
      instance['event_' + name] = null;
    }
  }
  function ItemsRefresher(options) {
    this.options = options || {};
    addNotificationEvent(this, 'UserDataChanged', onUserDataChanged);
    addNotificationEvent(this, 'TimerCreated', onTimerCreated);
    addNotificationEvent(this, 'SeriesTimerCreated', onSeriesTimerCreated);
    addNotificationEvent(this, 'SeriesTimerUpdated', onSeriesTimerUpdated);
    addNotificationEvent(this, 'TimerCancelled', onTimerCancelled);
    addNotificationEvent(this, 'DevicesDeleted', onDevicesDeleted);
    addNotificationEvent(this, 'ApiKeyCreated', onApiKeyCreated);
    addNotificationEvent(this, 'ApiKeysDeleted', onApiKeysDeleted);
    addNotificationEvent(this, 'LiveTVGuideSourcesDeleted', onLiveTVGuideSourcesDeleted);
    addNotificationEvent(this, 'LiveTVTunerDevicesDeleted', onLiveTVTunerDevicesDeleted);
    addNotificationEvent(this, 'UserNotificationsSaved', onUserNotificationsSaved);
    addNotificationEvent(this, 'UserNotificationsDeleted', onUserNotificationsDeleted);
    addNotificationEvent(this, 'SyncJobCreated', onSyncJobCreated);
    addNotificationEvent(this, 'SyncJobCancelled', onSyncJobCancelled);
    addNotificationEvent(this, 'SyncJobUpdated', onSyncJobUpdated);
    addNotificationEvent(this, 'SyncJobItemCancelled', onSyncJobItemCancelled);
    addNotificationEvent(this, 'SyncJobItemUpdated', onSyncJobItemUpdated);
    addNotificationEvent(this, 'SyncJobItemReady', onSyncJobItemUpdated);
    addNotificationEvent(this, 'UsersDeleted', onUsersDeleted);
    addNotificationEvent(this, 'ScheduledTaskTriggersUpdated', onScheduledTaskTriggersUpdated);
    addNotificationEvent(this, 'PluginsUninstalled', onPluginsUninstalled);
    addNotificationEvent(this, 'SeriesTimerCancelled', onSeriesTimerCancelled);
    addNotificationEvent(this, 'LibraryChanged', onLibraryChanged);
    addNotificationEvent(this, 'ItemsMerged', onItemsMerged);
    addNotificationEvent(this, 'ItemsSplit', onItemsMerged);
    addNotificationEvent(this, 'ItemsRemovedFromCollection', onItemsRemovedFromCollection);
    addNotificationEvent(this, 'ItemsRemovedFromPlaylist', onItemsRemovedFromPlaylist);
    addNotificationEvent(this, 'ItemsMovedInPlaylist', onItemsRemovedFromPlaylist);
    addNotificationEvent(this, 'RecordingStarted', onRecordingStarted);
    addNotificationEvent(this, 'RecordingEnded', onRecordingEnded);
    addNotificationEvent(this, 'ChannelManagementInfoUpdated', onChannelManagementInfoUpdated);
    addNotificationEvent(this, 'playbackstop', onPlaybackStopped, _playbackmanager.default);
    addNotificationEvent(this, 'playerchange', onPlayerChanged, _playbackmanager.default);
    addNotificationEvent(this, 'credentialsupdated', onCredentialsUpdated, _connectionmanager.default);
  }
  ItemsRefresher.prototype.pause = function () {
    clearRefreshInterval(this, true);
    this.paused = true;
  };
  ItemsRefresher.prototype.resume = function (options) {
    this.paused = false;
    var refreshIntervalEndTime = this.refreshIntervalEndTime;
    if (refreshIntervalEndTime) {
      var remainingMs = refreshIntervalEndTime - Date.now();
      if (remainingMs > 0 && !this.needsRefresh) {
        resetRefreshInterval(this, remainingMs);
      } else {
        this.needsRefresh = true;
        this.refreshIntervalEndTime = null;
      }
    }
    if (this.needsRefresh || options && options.refresh) {
      return this.refreshItems(options);
    }
    return Promise.resolve();
  };
  ItemsRefresher.prototype.resetRefreshInterval = function () {
    resetRefreshInterval(this);
  };
  ItemsRefresher.prototype.refreshItems = function (options) {
    var _this$options;
    if (this.paused) {
      this.needsRefresh = true;
      return Promise.resolve();
    }
    this.needsRefresh = false;
    if (!this.bound_onDataFetched) {
      this.bound_onDataFetched = onDataFetched.bind(this);
    }
    var itemsContainer = (_this$options = this.options) == null ? void 0 : _this$options.itemsContainer;
    if (itemsContainer) {
      return itemsContainer.refreshItemsInternal(options).then(this.bound_onDataFetched);
    }
    return Promise.resolve();
  };
  ItemsRefresher.prototype.mergeOptions = function (options) {
    Object.assign(this.options, options);
    resetRefreshInterval(this);
  };
  ItemsRefresher.prototype.notifyIsRefreshing = function () {
    this.needsRefresh = false;
  };
  function onRefreshTimeout() {
    this.refreshItems();
  }
  function clearRefreshTimeout(instance) {
    var timeout = instance.refreshTimeout;
    if (timeout) {
      clearTimeout(timeout);
    }
  }
  ItemsRefresher.prototype.notifyRefreshNeeded = function (isInForeground) {
    var _this$options2;
    clearRefreshTimeout(this);
    if (this.paused) {
      this.needsRefresh = true;
      return;
    }
    if (((_this$options2 = this.options) == null ? void 0 : _this$options2.immediateUpdate) === false) {
      isInForeground = false;
    }
    if (isInForeground === true) {
      this.refreshItems();
    } else {
      if (!this.bound_onRefreshTimeout) {
        this.bound_onRefreshTimeout = onRefreshTimeout.bind(this);
      }
      this.refreshTimeout = setTimeout(this.bound_onRefreshTimeout, 3000);
    }
  };
  function clearRefreshInterval(instance, isPausing) {
    if (instance.refreshInterval) {
      clearTimeout(instance.refreshInterval);
      instance.refreshInterval = null;
      if (!isPausing) {
        instance.refreshIntervalEndTime = null;
      }
    }
  }
  function onRefreshInterval() {
    this.notifyRefreshNeeded(true);
  }
  function resetRefreshInterval(instance, intervalMs) {
    clearRefreshInterval(instance);
    if (!intervalMs) {
      var _instance$options3;
      intervalMs = (_instance$options3 = instance.options) == null ? void 0 : _instance$options3.refreshIntervalMs;
    }
    if (intervalMs) {
      if (!instance.bound_onRefreshInterval) {
        instance.bound_onRefreshInterval = onRefreshInterval.bind(instance);
      }
      instance.refreshInterval = setTimeout(instance.bound_onRefreshInterval, intervalMs);
      instance.refreshIntervalEndTime = Date.now() + intervalMs;
    }
  }
  function onDataFetched(result) {
    resetRefreshInterval(this);
    if (this.afterRefresh) {
      this.afterRefresh(result);
    }
  }
  ItemsRefresher.prototype.destroy = function () {
    clearRefreshInterval(this);
    clearRefreshTimeout(this);
    removeNotificationEvent(this, 'UserDataChanged', onUserDataChanged);
    removeNotificationEvent(this, 'TimerCreated', onTimerCreated);
    removeNotificationEvent(this, 'SeriesTimerCreated', onSeriesTimerCreated);
    removeNotificationEvent(this, 'SeriesTimerUpdated', onSeriesTimerUpdated);
    removeNotificationEvent(this, 'TimerCancelled', onTimerCancelled);
    removeNotificationEvent(this, 'DevicesDeleted', onDevicesDeleted);
    removeNotificationEvent(this, 'ApiKeyCreated', onApiKeyCreated);
    removeNotificationEvent(this, 'ApiKeysDeleted', onApiKeysDeleted);
    removeNotificationEvent(this, 'LiveTVGuideSourcesDeleted', onLiveTVGuideSourcesDeleted);
    removeNotificationEvent(this, 'LiveTVTunerDevicesDeleted', onLiveTVTunerDevicesDeleted);
    removeNotificationEvent(this, 'UserNotificationsSaved', onUserNotificationsSaved);
    removeNotificationEvent(this, 'UserNotificationsDeleted', onUserNotificationsDeleted);
    removeNotificationEvent(this, 'SyncJobCreated', onSyncJobCreated);
    removeNotificationEvent(this, 'SyncJobCancelled', onSyncJobCancelled);
    removeNotificationEvent(this, 'SyncJobUpdated', onSyncJobUpdated);
    removeNotificationEvent(this, 'SyncJobItemCancelled', onSyncJobItemCancelled);
    removeNotificationEvent(this, 'SyncJobItemUpdated', onSyncJobItemUpdated);
    removeNotificationEvent(this, 'SyncJobItemReady', onSyncJobItemUpdated);
    removeNotificationEvent(this, 'UsersDeleted', onUsersDeleted);
    removeNotificationEvent(this, 'ScheduledTaskTriggersUpdated', onScheduledTaskTriggersUpdated);
    removeNotificationEvent(this, 'PluginsUninstalled', onPluginsUninstalled);
    removeNotificationEvent(this, 'SeriesTimerCancelled', onSeriesTimerCancelled);
    removeNotificationEvent(this, 'LibraryChanged', onLibraryChanged);
    removeNotificationEvent(this, 'ItemsMerged', onItemsMerged);
    removeNotificationEvent(this, 'ItemsSplit', onItemsMerged);
    removeNotificationEvent(this, 'ItemsRemovedFromCollection', onItemsRemovedFromCollection);
    removeNotificationEvent(this, 'ItemsRemovedFromPlaylist', onItemsRemovedFromPlaylist);
    removeNotificationEvent(this, 'ItemsMovedInPlaylist', onItemsRemovedFromPlaylist);
    removeNotificationEvent(this, 'RecordingStarted', onRecordingStarted);
    removeNotificationEvent(this, 'RecordingEnded', onRecordingEnded);
    removeNotificationEvent(this, 'ChannelManagementInfoUpdated', onChannelManagementInfoUpdated);
    removeNotificationEvent(this, 'playbackstop', onPlaybackStopped, _playbackmanager.default);
    removeNotificationEvent(this, 'playerchange', onPlayerChanged, _playbackmanager.default);
    removeNotificationEvent(this, 'credentialsupdated', onCredentialsUpdated, _connectionmanager.default);
    this.fetchData = null;
    this.options = null;
    this.bound_onRefreshTimeout = null;
    this.bound_onRefreshInterval = null;
    this.bound_onDataFetched = null;
  };
  var _default = _exports.default = ItemsRefresher;
});
