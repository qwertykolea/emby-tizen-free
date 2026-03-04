define(["exports", "./../appsettings.js", "./../../emby-apiclient/events.js"], function (_exports, _appsettings, _events) {
  Object.defineProperty(_exports, "__esModule", {
    value: true
  });
  _exports.default = void 0;
  /* jshint module: true */

  function onSaveTimeout() {
    var self = this;
    self.saveTimeout = null;
    self.currentApiClient.updateDisplayPreferences(self.displayPrefs, self.currentUserId);
  }
  function saveServerPreferences(instance, name, value) {
    if (instance.supportsPartialSave) {
      var obj = {};
      obj[name] = value;
      instance.currentApiClient.updatePartialDisplayPreferences(obj, instance.currentUserId);
      return;
    }
    if (instance.saveTimeout) {
      clearTimeout(instance.saveTimeout);
    }
    instance.saveTimeout = setTimeout(onSaveTimeout.bind(instance), 50);
  }
  function UserSettings() {}
  UserSettings.prototype.setUserInfo = function (userId, apiClient) {
    if (this.saveTimeout) {
      clearTimeout(this.saveTimeout);
    }
    this.currentUserId = userId;
    this.currentApiClient = apiClient;
    this.supportsPartialSave = apiClient == null ? void 0 : apiClient.isMinServerVersion('4.9.0.23');
    if (!userId) {
      this.displayPrefs = null;
      return Promise.resolve();
    }
    var self = this;
    return apiClient.getDisplayPreferences(userId).then(function (result) {
      self.displayPrefs = result;
      _events.default.trigger(self, 'load');
    });
  };
  UserSettings.prototype.getData = function () {
    return this.displayPrefs;
  };
  UserSettings.prototype.importFrom = function (instance) {
    this.displayPrefs = instance.getData();
  };
  UserSettings.prototype.set = function (name, value, enableOnServer) {
    var userId = this.currentUserId;
    if (!userId) {
      throw new Error('userId cannot be null');
    }
    var currentValue = this.get(name, enableOnServer);

    // normalize between null and undefined to avoid values being saved as the string 'undefined'
    if (value == null) {
      value = null;
    }
    var result = _appsettings.default.set(name, value, userId);
    if (enableOnServer !== false && this.displayPrefs) {
      var savedValue = value == null ? value : value.toString();
      this.displayPrefs[name] = savedValue;
      //console.log('save usersettings: ' + name);
      saveServerPreferences(this, name, savedValue);
    }
    if (currentValue !== value) {
      _events.default.trigger(this, 'change', [name, value]);
    }
    return result;
  };
  UserSettings.prototype.remove = function (name, enableOnServer) {
    return this.set(name, null, enableOnServer);
  };
  UserSettings.prototype.get = function (name, enableOnServer) {
    var userId = this.currentUserId;
    if (!userId) {
      // TODO: I'd like to continue to throw this exception but it causes issues with offline use
      // Revisit in the future and restore it
      return null;
      //throw new Error('userId cannot be null');
    }
    if (enableOnServer !== false) {
      if (this.displayPrefs) {
        return this.displayPrefs[name];
      }
    }
    return _appsettings.default.get(name, userId);
  };
  UserSettings.prototype.serverConfig = function (config) {
    var apiClient = this.currentApiClient;
    if (config) {
      return apiClient.updateUserConfiguration(this.currentUserId, config);
    } else {
      return apiClient.getUser(this.currentUserId).then(function (user) {
        return user.Configuration;
      });
    }
  };
  UserSettings.prototype.enableNextVideoInfoOverlay = function (val) {
    if (val != null) {
      return this.set('enableNextVideoInfoOverlay', val.toString());
    }
    val = this.get('enableNextVideoInfoOverlay');
    return val !== 'false';
  };
  UserSettings.prototype.getEnableLogoAsTitle = function (displayLanguage) {
    var val = this.get('enableLogoAsTitle');
    if (val) {
      return val === 'true';
    }
    return displayLanguage && displayLanguage.toLowerCase().startsWith('en');
  };
  UserSettings.prototype.hideEpisodeSpoilerInfo = function (val) {
    if (val != null) {
      return this.set('hideEpisodeSpoilerInfo', val.toString(), true);
    }
    val = this.get('hideEpisodeSpoilerInfo', true);
    return val === 'true';
  };
  UserSettings.prototype.setEnableLogoAsTitle = function (val) {
    return this.set('enableLogoAsTitle', val.toString());
  };
  UserSettings.prototype.groupCollectionItems = function (val) {
    if (val != null) {
      return this.set('groupCollectionItems', val.toString(), true);
    }
    val = this.get('groupCollectionItems', true);
    return val !== 'false';
  };
  UserSettings.prototype.enableAutoFolderJumpThrough = function (val) {
    if (val != null) {
      return this.set('enableAutoFolderJumpThrough', val.toString(), true);
    }
    val = this.get('enableAutoFolderJumpThrough', true);
    return val !== 'false';
  };
  UserSettings.prototype.enableHomescreenFocusPreviews = function (val) {
    if (val != null) {
      return this.set('enableHomescreenFocusPreviews', val.toString(), true);
    }
    val = this.get('enableHomescreenFocusPreviews', true);
    return val === 'true';
  };
  UserSettings.prototype.genreLimitForListsOnDetails = function (val) {
    if (val != null) {
      return this.set('genreLimitForListsOnDetails', val.toString(), true);
    }
    return parseInt(this.get('genreLimitForListsOnDetails', true) || '3');
  };
  UserSettings.prototype.genreLimitOnDetails = function (val) {
    if (val != null) {
      return this.set('genreLimitOnDetails', val.toString(), true);
    }
    return parseInt(this.get('genreLimitOnDetails', true) || '1');
  };
  UserSettings.prototype.showDetailPoster = function (isTvLayout, val) {
    var key = 'showDetailPoster' + (isTvLayout ? 'tv' : '');
    if (val != null) {
      return this.set(key, val.toString(), true);
    }
    val = this.get(key, true);
    switch (val) {
      case 'true':
        return true;
      case 'false':
        return false;
      default:
        return isTvLayout ? false : true;
    }
  };
  UserSettings.prototype.showEndsAtOnDetails = function (val) {
    if (val != null) {
      return this.set('showEndsAtOnDetails', val.toString(), true);
    }
    val = this.get('showEndsAtOnDetails', true);
    return val !== 'false';
  };
  UserSettings.prototype.enableRatingInfoOnPlaybackStart = function (val) {
    if (val != null) {
      return this.set('enableRatingInfoOnPlaybackStart', val.toString(), true);
    }
    val = this.get('enableRatingInfoOnPlaybackStart', true);
    return val !== 'false';
  };
  UserSettings.prototype.skipBackLength = function (val) {
    if (val != null) {
      return this.set('skipBackLength', val.toString());
    }
    return parseInt(this.get('skipBackLength') || '10000');
  };
  UserSettings.prototype.skipForwardLength = function (val) {
    if (val != null) {
      return this.set('skipForwardLength', val.toString());
    }
    return parseInt(this.get('skipForwardLength') || '10000');
  };
  UserSettings.prototype.settingsTheme = function (val) {
    if (val != null) {
      return this.set('settingsTheme', val, false);
    }
    return this.get('settingsTheme', false);
  };
  UserSettings.prototype.theme = function (val) {
    if (val != null) {
      return this.set('appTheme', val, false);
    }
    return this.get('appTheme', false) || null;
  };
  UserSettings.prototype.accentColor = function (val) {
    if (val != null) {
      return this.set('accentColor', val, true);
    }
    return this.get('accentColor', true) || 'emby';
  };
  UserSettings.prototype.useSystemAccentColor = function (val) {
    if (val != null) {
      return this.set('useSystemAccentColor', val.toString(), false);
    }
    return this.get('useSystemAccentColor', false) === 'true';
  };
  UserSettings.prototype.osdContentSection = function (type, val) {
    if (val != null) {
      return this.set('osdcontentsection-' + type, val, false);
    }
    return this.get('osdcontentsection-' + type, false);
  };
  UserSettings.prototype.drawerStyle = function (val) {
    if (val != null) {
      return this.set('drawerstyle', val, false);
    }
    return this.get('drawerstyle', false) || 'docked';
  };
  UserSettings.prototype.settingsDrawerStyle = function (val) {
    if (val != null) {
      return this.set('settingsdrawerstyle', val, false);
    }
    return this.get('settingsdrawerstyle', false) || 'docked';
  };
  UserSettings.prototype.videoScreenUpAction = function (val) {
    if (val != null) {
      return this.set('videoScreenUpAction', val, true);
    }
    return this.get('videoScreenUpAction', true);
  };
  UserSettings.prototype.nowPlayingAudioBackgroundStyle = function (val) {
    if (val != null) {
      return this.set('nowPlayingAudioBackgroundStyle', val, true);
    }
    return this.get('nowPlayingAudioBackgroundStyle', true) || 'blur';
  };
  UserSettings.prototype.nowPlayingVideoBackgroundStyle = function (val) {
    if (val != null) {
      return this.set('nowPlayingVideoBackgroundStyle', val, true);
    }
    return this.get('nowPlayingVideoBackgroundStyle', true) || 'backdrop';
  };
  UserSettings.prototype.stillWatchingTimeMs = function (val) {
    if (val != null) {
      return this.set('stillwatchingms', val, true);
    }
    return parseInt(this.get('stillwatchingms', true) || "14400000");
  };
  UserSettings.prototype.tvHome = function (val) {
    if (val != null) {
      return this.set('tvhome', val, true);
    }
    return this.get('tvhome', true) || 'vertical';
  };
  UserSettings.prototype.tvScrollDirection = function (val) {
    if (val != null) {
      return this.set('tvScrollDirection', val, true);
    }
    return this.get('tvScrollDirection', true) || 'vertical';
  };
  UserSettings.prototype.itemSortBy = function (itemId, val) {
    var key = 'sortitems-' + itemId + '-by';
    if (val != null) {
      return this.set(key, val, false);
    }
    return this.get(key, false) || '';
  };
  UserSettings.prototype.itemSortOrder = function (itemId, val) {
    var key = 'sortitems-' + itemId + '-order';
    if (val != null) {
      return this.set(key, val, false);
    }
    return this.get(key, false) || 'Ascending';
  };
  UserSettings.prototype.enableStillWatching = function (val) {
    if (val != null) {
      return this.stillWatchingTimeMs(val ? 14400000 : 0);
    }
    return this.stillWatchingTimeMs() > 0;
  };
  UserSettings.prototype.getSubtitleAppearanceSettings = function (key) {
    key = key || 'localplayersubtitleappearance3';
    var obj = JSON.parse(this.get(key, false) || '{}');
    if (!obj.dropShadow) {
      obj.dropShadow = 'dropshadow';
    }
    if (!obj.textBackground) {
      obj.textBackground = 'transparent';
    }
    if (!obj.textBackgroundOpacity) {
      obj.textBackgroundOpacity = '1';
    }
    if (!obj.textColor) {
      obj.textColor = '#ffffff';
    }
    if (obj.positionBottom == null) {
      obj.positionBottom = '10';
    }
    if (obj.positionTop == null) {
      obj.positionTop = '5';
    }
    return obj;
  };
  UserSettings.prototype.setSubtitleAppearanceSettings = function (value, key) {
    key = key || 'localplayersubtitleappearance3';
    return this.set(key, JSON.stringify(value), false);
  };
  UserSettings.prototype.setFilter = function (key, value, enableOnServer) {
    return this.set(key, value, enableOnServer === true);
  };
  UserSettings.prototype.getFilter = function (key, enableOnServer) {
    var value = this.get(key, enableOnServer === true);
    if (value === 'null' || value === '') {
      return null;
    }
    return value;
  };
  UserSettings.prototype.getDefaultHomeScreenSection = function (index) {
    switch (index) {
      case 0:
        return 'smalllibrarytiles';
      case 1:
        return 'resume';
      case 2:
        return 'resumeaudio';
      case 3:
        return 'livetv';
      case 4:
        return 'none';
      case 5:
        return 'latestmedia';
      default:
        return 'none';
    }
  };
  function getHomeSection(instance, index) {
    var section = instance.get('homesection' + index) || instance.getDefaultHomeScreenSection(index);
    if (section === 'librarytiles' || section === 'smalllibrarytiles-automobile' || section === 'librarytiles-automobile') {
      section = 'smalllibrarytiles';
    }
    return section;
  }
  UserSettings.prototype.homeSection0 = function (val) {
    if (val != null) {
      return this.set('homesection0', val.toString(), true);
    }
    return getHomeSection(this, 0);
  };
  UserSettings.prototype.homeSection1 = function (val) {
    if (val != null) {
      return this.set('homesection1', val.toString(), true);
    }
    return getHomeSection(this, 1);
  };
  UserSettings.prototype.homeSection2 = function (val) {
    if (val != null) {
      return this.set('homesection2', val.toString(), true);
    }
    return getHomeSection(this, 2);
  };
  UserSettings.prototype.homeSection3 = function (val) {
    if (val != null) {
      return this.set('homesection3', val.toString(), true);
    }
    return getHomeSection(this, 3);
  };
  UserSettings.prototype.homeSection4 = function (val) {
    if (val != null) {
      return this.set('homesection4', val.toString(), true);
    }
    return getHomeSection(this, 4);
  };
  UserSettings.prototype.homeSection5 = function (val) {
    if (val != null) {
      return this.set('homesection5', val.toString(), true);
    }
    return getHomeSection(this, 5);
  };
  UserSettings.prototype.homeSection6 = function (val) {
    if (val != null) {
      return this.set('homesection6', val.toString(), true);
    }
    return getHomeSection(this, 6);
  };
  UserSettings.prototype.getHomeScreenSections = function () {
    var sections = [];
    var sectionCount = 7;
    for (var i = 0, length = sectionCount; i < length; i++) {
      var section = getHomeSection(this, i);
      if (section !== 'none') {
        sections.push(section);
      }
    }
    return sections;
  };
  UserSettings.prototype.guideChannelStyle = function (val) {
    if (val != null) {
      return this.set('guideChannelStyle', val.toString(), true);
    }
    return this.get('guideChannelStyle', true) || 'image';
  };
  UserSettings.prototype.showChannelNumberInGuide = function (val) {
    if (val != null) {
      return this.set('showChannelNumberInGuide', val.toString(), true);
    }
    return this.get('showChannelNumberInGuide', true) !== 'false';
  };
  UserSettings.prototype.showFullMediaInfoOnDetailScreen = function (val) {
    if (val != null) {
      return this.set('showFullMediaInfoOnDetailScreen', val.toString(), true);
    }
    return this.get('showFullMediaInfoOnDetailScreen', true) !== 'false';
  };
  UserSettings.prototype.seriesDisplay = function (val) {
    if (val != null) {
      return this.set('seriesDisplay', val.toString(), true);
    }
    return this.get('seriesDisplay', true) || 'episodes';
  };
  UserSettings.prototype.getLiveTvChannelSortSettingsKey = function () {
    return 'livetv-channelorder';
  };
  UserSettings.prototype.getLiveTvChannelSortOrders = function (globalize) {
    var sortBy = [];
    sortBy.push({
      name: globalize.translate('HeaderDefaultChannelOrder'),
      value: 'DefaultChannelOrder',
      defaultSortOrder: 'Ascending',
      menuSortKey: '0'
    });
    sortBy.push({
      name: globalize.translate('ChannelNumber'),
      value: 'ChannelNumber,SortName',
      defaultSortOrder: 'Ascending'
    });
    sortBy.push({
      name: globalize.translate('DatePlayed'),
      value: 'DatePlayed,ChannelNumber,SortName',
      defaultSortOrder: 'Descending'
    });
    sortBy.push({
      name: globalize.translate('Title'),
      value: 'SortName',
      defaultSortOrder: 'Ascending'
    });
    sortBy.push({
      name: globalize.translate('HeaderFavoritesThenByDefault'),
      value: 'IsFavorite,DefaultChannelOrder',
      defaultSortOrder: 'Ascending'
    });
    sortBy.push({
      name: globalize.translate('HeaderFavoritesThenByChannelNumber'),
      value: 'IsFavorite,ChannelNumber,SortName',
      defaultSortOrder: 'Ascending'
    });
    sortBy.push({
      name: globalize.translate('HeaderFavoritesThenByTitle'),
      value: 'IsFavorite,SortName',
      defaultSortOrder: 'Ascending'
    });
    var currentOrder = this.getFilter(this.getLiveTvChannelSortSettingsKey(), true);
    var selectedOrder;
    for (var i = 0, length = sortBy.length; i < length; i++) {
      var order = sortBy[i];
      if (order.value === currentOrder) {
        selectedOrder = order;
        break;
      }
    }
    if (!selectedOrder) {
      selectedOrder = sortBy[0];
    }
    selectedOrder.selected = true;
    return sortBy;
  };
  UserSettings.prototype.addLiveTvChannelSortingToQuery = function (query, globalize) {
    var orders = this.getLiveTvChannelSortOrders(globalize);
    var selectedOrder;
    for (var i = 0, length = orders.length; i < length; i++) {
      var order = orders[i];
      if (order.selected) {
        selectedOrder = order;
        break;
      }
    }
    query.SortBy = selectedOrder.value;
    query.SortOrder = selectedOrder.defaultSortOrder;
  };
  var _default = _exports.default = UserSettings;
});
