define(["exports", "./../emby-apiclient/events.js", "./servicelocator.js", "./qualitydetection.js"], function (_exports, _events, _servicelocator, _qualitydetection) {
  Object.defineProperty(_exports, "__esModule", {
    value: true
  });
  _exports.default = void 0;
  /* jshint module: true */

  function getKey(name, userId) {
    if (userId) {
      name = userId + '-' + name;
    }
    return name;
  }
  function AppSettings() {}
  AppSettings.prototype.autoLogin = function (val) {
    if (val != null) {
      this.set('autoLogin', val.toString());
      return;
    }
    return this.get('autoLogin') || 'lastuser';
  };
  AppSettings.prototype.enableAutomaticBitrateDetection = function (networkType, mediaType, val) {
    if (!networkType) {
      networkType = 'lan';
    }
    var keySuffix = networkType === 'wan' ? 'false' : networkType === 'cellular' ? networkType : 'true';
    var key = 'enableautobitratebitrate-' + mediaType + '-' + keySuffix;
    if (val != null) {
      if (networkType === 'lan' && mediaType === 'Audio') {
        val = true;
      }
      this.set(key, val.toString());
    }
    if (networkType === 'lan' && mediaType === 'Audio') {
      return true;
    } else {
      return this.get(key) !== 'false';
    }
  };
  AppSettings.prototype.maxStreamingBitrate = function (networkType, mediaType, val) {
    if (!networkType) {
      networkType = 'lan';
    }
    var keySuffix = networkType === 'wan' ? 'false' : networkType === 'cellular' ? networkType : 'true';
    var key = 'maxbitrate-' + mediaType + '-' + keySuffix;
    if (val != null) {
      if (networkType === 'lan' && mediaType === 'Audio') {
        //  nothing to do, this is always a max value
      } else {
        this.set(key, val);
      }
    }
    if (networkType === 'lan' && mediaType === 'Audio') {
      // return a huge number so that it always direct plays
      return 200000000;
    } else {
      val = parseInt(this.get(key) || '0');
      if (val) {
        return val;
      }
      return _qualitydetection.default.getDefaultQuality(networkType);
    }
  };
  AppSettings.prototype.slideshowIntervalMs = function (val) {
    if (val !== undefined) {
      this.set('slideshowIntervalMs', val);
    }
    var defaultValue = 10000;
    return parseInt(this.get('slideshowIntervalMs') || defaultValue.toString()) || defaultValue;
  };
  AppSettings.prototype.forceTranscodingForContainer = function (format, val) {
    var key = 'forceTranscoding-' + format;
    if (val != null) {
      return this.set(key, val.toString());
    }
    return this.get(key) === 'true';
  };
  AppSettings.prototype.forceTranscodingForContainers = function () {
    // this method is just here for browserdeviceprofile and the equivalents used by other apps
    var list = [];
    if (this.forceTranscodingForContainer('avi')) {
      list.push('avi');
    }
    if (this.forceTranscodingForContainer('mpeg')) {
      list.push('mpeg');
    }
    if (this.forceTranscodingForContainer('mpegts')) {
      list.push('mpegts');
    }
    if (this.forceTranscodingForContainer('flac')) {
      list.push('flac');
    }
    return list;
  };
  AppSettings.prototype.forceTranscodingForVideoCodec = function (format, val) {
    var key = 'forceTranscoding-' + format;
    if (val != null) {
      return this.set(key, val.toString());
    }
    return this.get(key) === 'true';
  };
  AppSettings.prototype.forceTranscodingForVideoCodecs = function () {
    // this method is just here for browserdeviceprofile and the equivalents used by other apps
    var list = [];
    if (this.forceTranscodingForVideoCodec('av1')) {
      list.push('av1');
    }
    if (this.forceTranscodingForVideoCodec('vc1')) {
      list.push('vc1');
    }
    return list;
  };
  AppSettings.prototype.enableThemeSongs = function (val) {
    if (val != null) {
      return this.set('enableThemeSongs', val.toString());
    }
    val = this.get('enableThemeSongs');
    return val !== 'false';
  };
  AppSettings.prototype.enableThemeVideos = function (val) {
    if (val != null) {
      return this.set('enableThemeVideos', val.toString());
    }
    val = this.get('enableThemeVideos');
    if (val) {
      return val !== 'false';
    }
    return false;
  };
  AppSettings.prototype.repeatThemes = function (val) {
    if (val != null) {
      return this.set('repeatThemes', val.toString());
    }
    val = this.get('repeatThemes');
    return val === 'true';
  };
  AppSettings.prototype.convertUnsupportedSurroundAudio = function (val) {
    if (val != null) {
      return this.set('convertUnsupportedSurroundAudio', val.toString());
    }
    val = this.get('convertUnsupportedSurroundAudio');
    return val === 'true';
  };
  AppSettings.prototype.screensaver = function (val) {
    if (val != null) {
      return this.set('screensaver', val);
    }
    return this.get('screensaver') || null;
  };
  AppSettings.prototype.soundEffects = function (val) {
    if (val != null) {
      return this.set('soundeffects', val);
    }
    return this.get('soundeffects') || null;
  };
  AppSettings.prototype.cardSize = function (val) {
    if (val != null) {
      return this.set('cardSize', val.toString());
    }
    return this.get('cardSize') || 'normal';
  };
  AppSettings.prototype.fontSize = function (val) {
    if (val != null) {
      return this.set('fontSize', val.toString());
    }
    return this.get('fontSize');
  };
  AppSettings.prototype.videoPlayerLongPressAction = function (val) {
    if (val != null) {
      return this.set('videoPlayerLongPressAction', val.toString());
    }
    return this.get('videoPlayerLongPressAction');
  };
  AppSettings.prototype.videoOrientation = function (val) {
    if (val != null) {
      return this.set('videoOrientation', val.toString());
    }
    return this.get('videoOrientation') || 'auto';
  };
  AppSettings.prototype.enableVideoUnderUI = function (val) {
    if (val != null) {
      return this.set('enableVideoUnderUI', val.toString());
    }
    return this.get('enableVideoUnderUI') === 'true';
  };
  AppSettings.prototype.hideMediaTransportButtons = function (val) {
    if (val != null) {
      return this.set('hideMediaTransportButtons', val.toString());
    }
    return this.get('hideMediaTransportButtons') || 'auto';
  };
  AppSettings.prototype.enableCinemaMode = function (val) {
    if (val != null) {
      return this.set('enableCinemaMode', val.toString());
    }
    val = this.get('enableCinemaMode');
    if (val) {
      return val !== 'false';
    }
    return true;
  };
  AppSettings.prototype.maxStaticMusicBitrate = function (val) {
    if (val !== undefined) {
      this.set('maxStaticMusicBitrate', val);
    }
    var defaultValue = 320000;
    return parseInt(this.get('maxStaticMusicBitrate') || defaultValue.toString()) || defaultValue;
  };
  AppSettings.prototype.maxChromecastBitrate = function (val) {
    if (val != null) {
      this.set('chromecastBitrate1', val);
    }
    val = this.get('chromecastBitrate1');
    return val ? parseInt(val) : null;
  };
  AppSettings.prototype.volume = function (val) {
    if (val !== undefined) {
      this.set('mediavolume', val);
    }
    var defaultValue = 100;
    return parseInt(this.get('mediavolume') || defaultValue.toString()) || defaultValue;
  };
  AppSettings.prototype.themeSongVolume = function (val) {
    if (val !== undefined) {
      this.set('themeSongVolume', val);
    }
    var defaultValue = 70;
    var result = parseInt(this.get('themeSongVolume') || defaultValue.toString());
    if (typeof result === 'number') {
      return result;
    }
    return defaultValue;
  };
  AppSettings.prototype.introSkipDisplayCount = function (val) {
    if (val != null) {
      this.set('introSkipDisplayCount', val);
    }
    val = this.get('introSkipDisplayCount');
    return val ? parseInt(val) : 0;
  };
  AppSettings.prototype.enableLogging = function (val) {
    if (val != null) {
      this.set('enableLogging', val.toString());
    }
    return this.get('enableLogging') === 'true';
  };
  AppSettings.prototype.syncOnlyOnWifi = function (val) {
    if (val != null) {
      this.set('syncOnlyOnWifi', val.toString());
    }
    return this.get('syncOnlyOnWifi') !== 'false';
  };
  AppSettings.prototype.allowDirectStreamLiveTV = function (val) {
    if (val != null) {
      this.set('allowDirectStreamLiveTV', val.toString());
    }
    return this.get('allowDirectStreamLiveTV') !== 'false';
  };
  AppSettings.prototype.cameraUploadOnlyOnWifi = function (val) {
    if (val != null) {
      this.set('cameraUploadOnlyOnWifi', val.toString());
    }
    return this.get('cameraUploadOnlyOnWifi') !== 'false';
  };
  AppSettings.prototype.syncWhenRoaming = function (val) {
    if (val != null) {
      this.set('syncWhenRoaming', val.toString());
    }
    return this.get('syncWhenRoaming') !== 'false';
  };
  AppSettings.prototype.enableProfilePin = function (userId, val) {
    if (!userId) {
      throw new Error('userId required');
    }
    if (val != null) {
      this.set('enableProfilePin', val, userId);
    }
    return this.get('enableProfilePin', userId) === 'true';
  };
  AppSettings.prototype.syncPath = function (val) {
    if (val != null) {
      this.set('syncPath', val);
    }
    return this.get('syncPath');
  };
  AppSettings.prototype.cameraUploadFolders = function (val) {
    if (val != null) {
      this.set('cameraUploadFolders', val.join('||'));
    }
    val = this.get('cameraUploadFolders');
    if (val) {
      return val.split('||');
    }
    return [];
  };
  AppSettings.prototype.cameraUploadServers = function (val) {
    if (val != null) {
      this.set('cameraUploadServers', val.join(','));
    }
    val = this.get('cameraUploadServers');
    if (val) {
      return val.split(',');
    }
    return [];
  };
  AppSettings.prototype.runAtStartup = function (val) {
    if (val != null) {
      this.set('runatstartup', val.toString());
    }
    return this.get('runatstartup') === 'true';
  };
  AppSettings.prototype.enableRefreshRateSwitching = function (val) {
    if (val != null) {
      this.set('enableRefreshRateSwitching', val.toString());
    }
    return this.get('enableRefreshRateSwitching') === 'true';
  };
  AppSettings.prototype.enableResolutionSwitching = function (val) {
    if (val != null) {
      this.set('enableResolutionSwitching', val.toString());
    }
    return this.get('enableResolutionSwitching') === 'true';
  };
  AppSettings.prototype.enableRemoteControlInTVMode = function (val) {
    if (val != null) {
      this.set('enableRemoteControlInTVMode', val.toString());
    }
    return this.get('enableRemoteControlInTVMode') === 'true';
  };
  AppSettings.prototype.backgroundVideo = function (val) {
    if (val != null) {
      this.set('backgroundVideo', val);
    }
    return this.get('backgroundVideo');
  };
  AppSettings.prototype.preferredVideoPlayer = function (val) {
    if (val != null) {
      this.set('preferredVideoPlayer', val);
    }
    return this.get('preferredVideoPlayer');
  };
  AppSettings.prototype.set = function (name, value, userId) {
    var currentValue = this.get(name, userId);
    var key = getKey(name, userId);
    //console.log('appsettings set ' + key + ': ' + value);
    _servicelocator.appStorage.setItem(key, value);
    if (currentValue !== value) {
      _events.default.trigger(this, 'change', [name, value]);
    }
  };
  AppSettings.prototype.enableBackdrops = function (val) {
    if (val != null) {
      return this.set('enableBackdrops', val.toString());
    }
    val = this.get('enableBackdrops');
    if (val) {
      return val !== 'false';
    }
    return false;
  };
  AppSettings.prototype.backBehaviorOnHome = function (val) {
    if (val != null) {
      this.set('backBehaviorOnHome', val.toString());
    }
    return this.get('backBehaviorOnHome') || 'exit';
  };
  AppSettings.prototype.language = function (val) {
    if (val != null) {
      return this.set('language', val.toString());
    }
    return this.get('language');
  };
  AppSettings.prototype.dateTimeLocale = function (val) {
    if (val != null) {
      return this.set('datetimelocale', val.toString());
    }
    return this.get('datetimelocale');
  };
  AppSettings.prototype.get = function (name, userId) {
    var key = getKey(name, userId);
    var value = _servicelocator.appStorage.getItem(key);
    //console.log('appsettings get ' + key + ': ' + value);

    return value;
  };
  AppSettings.prototype.enableSystemExternalPlayers = function (val) {
    if (val != null) {
      this.set('enableSystemExternalPlayers', val.toString());
    }
    return this.get('enableSystemExternalPlayers') === 'true';
  };
  var _default = _exports.default = new AppSettings();
});
