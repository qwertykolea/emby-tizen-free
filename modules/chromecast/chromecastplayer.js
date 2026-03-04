define(["exports", "./../common/globalize.js", "./../emby-apiclient/connectionmanager.js", "./../emby-apiclient/events.js", "./../common/playback/playbackmanager.js", "./../common/appsettings.js", "./../common/usersettings/usersettings.js"], function (_exports, _globalize, _connectionmanager, _events, _playbackmanager, _appsettings, _usersettings) {
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
  function getCastSenderApiLoader() {
    return new Promise(function (resolve, reject) {
      var fileref = document.createElement('script');
      fileref.setAttribute("type", "text/javascript");
      fileref.onload = resolve;
      fileref.setAttribute("src", "https://www.gstatic.com/cv/js/sender/v1/cast_sender.js");
      document.querySelector('head').appendChild(fileref);
    });
  }

  // Based on https://github.com/googlecast/CastVideos-chrome/blob/master/CastVideos.js
  var currentResolve;
  var currentReject;
  var PlayerName = 'Chromecast';
  function sendConnectionResult(isOk) {
    var resolve = currentResolve;
    var reject = currentReject;
    currentResolve = null;
    currentReject = null;
    if (isOk) {
      if (resolve) {
        resolve();
      }
    } else {
      if (reject) {
        reject();
      } else {
        _playbackmanager.default.removeActivePlayer(PlayerName);
      }
    }
  }

  /**
   * Constants of states for Chromecast device 
   **/
  var DEVICE_STATE = {
    'IDLE': 0,
    'ACTIVE': 1,
    'WARNING': 2,
    'ERROR': 3
  };

  /**
   * Constants of states for CastPlayer 
   **/
  var PLAYER_STATE = {
    'IDLE': 'IDLE',
    'LOADING': 'LOADING',
    'LOADED': 'LOADED',
    'PLAYING': 'PLAYING',
    'PAUSED': 'PAUSED',
    'STOPPED': 'STOPPED',
    'SEEKING': 'SEEKING',
    'ERROR': 'ERROR'
  };
  var UseBeta = false;
  var applicationID = UseBeta ? '27C4EB5B' : '2D4B1DA3';

  // This is the beta version used for testing new changes

  var messageNamespace = 'urn:x-cast:com.connectsdk';
  var CastPlayer = function () {
    /* device variables */
    // @type {DEVICE_STATE} A state for device
    this.deviceState = DEVICE_STATE.IDLE;

    /* Cast player variables */
    // @type {Object} a chrome.cast.media.Media object
    this.currentMediaSession = null;

    // @type {string} a chrome.cast.Session object
    this.session = null;
    // @type {PLAYER_STATE} A state for Cast media player
    this.castPlayerState = PLAYER_STATE.IDLE;
    this.hasReceivers = false;

    // bind once - commit 2ebffc2271da0bc5e8b13821586aee2a2e3c7753
    this.errorHandler = this.onError.bind(this);
    this.mediaStatusUpdateHandler = this.onMediaStatusUpdate.bind(this);
    this.currentVolume = 1;
    this.initializeCastPlayer();
  };

  /**
   * Initialize Cast media player 
   * Initializes the API. Note that either successCallback and errorCallback will be
   * invoked once the API has finished initialization. The sessionListener and 
   * receiverListener may be invoked at any time afterwards, and possibly more than once. 
   */
  CastPlayer.prototype.initializeCastPlayer = function () {
    var chrome = window.chrome;
    if (!chrome) {
      return;
    }
    if (!chrome.cast || !chrome.cast.isAvailable) {
      setTimeout(this.initializeCastPlayer.bind(this), 1000);
      return;
    }

    // request session
    var sessionRequest = new chrome.cast.SessionRequest(applicationID);
    var apiConfig = new chrome.cast.ApiConfig(sessionRequest, this.sessionListener.bind(this), this.receiverListener.bind(this), "origin_scoped");
    console.log('chromecast.initialize');
    chrome.cast.initialize(apiConfig, this.onInitSuccess.bind(this), this.errorHandler);
  };

  /**
   * Callback function for init success 
   */
  CastPlayer.prototype.onInitSuccess = function () {
    this.isInitialized = true;
    console.log("chromecast init success");
  };

  /**
   * Generic error callback function 
   */
  CastPlayer.prototype.onError = function (e) {
    console.log("chromecast error. code: " + (e.code || '') + ", details: " + (e.details || ''));
  };

  /**
   * @param {!Object} e A new session
   * This handles auto-join when a page is reloaded
   * When active session is detected, playback will automatically
   * join existing session and occur in Cast mode and media
   * status gets synced up with current media of the session 
   */
  CastPlayer.prototype.sessionListener = function (e) {
    this.session = e;
    if (this.session) {
      //console.log('sessionListener ' + JSON.stringify(e));

      if (this.session.media[0]) {
        this.onMediaDiscovered('activeSession', this.session.media[0]);
      }
      this.onSessionConnected(e);
    }
  };
  CastPlayer.prototype.messageListener = function (namespace, message) {
    if (typeof message === 'string') {
      message = JSON.parse(message);
    }
    if (message.type === 'playbackerror') {
      var errorCode = message.data;
      setTimeout(function () {
        showAlert(_globalize.default.translate('MessagePlaybackError' + errorCode), _globalize.default.translate('HeaderPlaybackError'));
      }, 300);
    } else if (message.type === 'connectionerror') {
      setTimeout(function () {
        showAlert(_globalize.default.translate('MessageChromecastConnectionError'), _globalize.default.translate('Error'));
      }, 300);
    } else if (message.type) {
      _events.default.trigger(this, message.type, [message.data]);
    }
  };

  /**
   * @param {string} e Receiver availability
   * This indicates availability of receivers but
   * does not provide a list of device IDs
   */
  CastPlayer.prototype.receiverListener = function (e) {
    if (e === 'available') {
      //console.log("chromecast receiver found");
      this.hasReceivers = true;
    } else {
      //console.log("chromecast receiver list empty");
      this.hasReceivers = false;
    }
  };

  /**
   * session update listener
   */
  CastPlayer.prototype.sessionUpdateListener = function (isAlive) {
    //console.log('sessionUpdateListener alive: ' + isAlive);

    if (!isAlive) {
      this.session = null;
      this.deviceState = DEVICE_STATE.IDLE;
      this.castPlayerState = PLAYER_STATE.IDLE;

      //console.log('sessionUpdateListener: setting currentMediaSession to null');
      this.currentMediaSession = null;
      sendConnectionResult(false);
    }
  };

  /**
   * Requests that a receiver application session be created or joined. By default, the SessionRequest
   * passed to the API at initialization time is used; this may be overridden by passing a different
   * session request in opt_sessionRequest. 
   */
  CastPlayer.prototype.launchApp = function () {
    //console.log("chromecast launching app...");
    chrome.cast.requestSession(this.onRequestSessionSuccess.bind(this), this.onLaunchError.bind(this));
  };

  /**
   * Callback function for request session success 
   * @param {Object} e A chrome.cast.Session object
   */
  CastPlayer.prototype.onRequestSessionSuccess = function (e) {
    //console.log("chromecast session success: " + e.sessionId);
    this.onSessionConnected(e);
  };
  CastPlayer.prototype.onSessionConnected = function (session) {
    this.session = session;
    this.currentVolume = this.session.receiver.volume.level;
    this.deviceState = DEVICE_STATE.ACTIVE;
    this.session.addMessageListener(messageNamespace, this.messageListener.bind(this));
    this.session.addMediaListener(this.sessionMediaListener.bind(this));
    this.session.addUpdateListener(this.sessionUpdateListener.bind(this));
    _events.default.trigger(this, 'connect');
    this.sendMessage({
      options: {},
      command: 'Identify'
    });
  };

  /**
   * session update listener
   */
  CastPlayer.prototype.sessionMediaListener = function (e) {
    //console.log('sessionMediaListener');
    this.currentMediaSession = e;
    this.currentMediaSession.addUpdateListener(this.mediaStatusUpdateHandler);
  };

  /**
   * Callback function for launch error
   */
  CastPlayer.prototype.onLaunchError = function () {
    //console.log("chromecast launch error");
    this.deviceState = DEVICE_STATE.ERROR;
    sendConnectionResult(false);
  };

  /**
   * Stops the running receiver application associated with the session.
   */
  CastPlayer.prototype.stopApp = function () {
    if (this.session) {
      this.session.stop(this.onStopAppSuccess.bind(this, 'Session stopped'), this.errorHandler);
    }
  };

  /**
   * Callback function for stop app success 
   */
  CastPlayer.prototype.onStopAppSuccess = function (message) {
    //console.log(message);
    this.deviceState = DEVICE_STATE.IDLE;
    this.castPlayerState = PLAYER_STATE.IDLE;

    //console.log('onStopAppSuccess: setting currentMediaSession to null');
    this.currentMediaSession = null;
  };
  function mapItemForLoadMedia(i) {
    return {
      Id: i.Id,
      ServerId: i.ServerId,
      Name: i.Name,
      Type: i.Type,
      MediaType: i.MediaType,
      IsFolder: i.IsFolder,
      ChannelId: i.ChannelId
    };
  }

  /**
   * Loads media into a running receiver application
   * @param {Number} mediaIndex An index number to indicate current media content
   */
  CastPlayer.prototype.loadMedia = function (options, command) {
    if (!this.session) {
      //console.log("no session");
      return Promise.reject();
    }

    // Convert the items to smaller stubs to send the minimal amount of information
    options.items = options.items.map(mapItemForLoadMedia);
    return this.sendMessage({
      options: options,
      command: command
    });
  };
  CastPlayer.prototype.sendMessage = function (message) {
    var player = this;
    var receiverName = null;
    var session = player.session;
    if (session && session.receiver && session.receiver.friendlyName) {
      receiverName = session.receiver.friendlyName;
    }
    var apiClient;
    if (message.options && message.options.ServerId) {
      apiClient = _connectionmanager.default.getApiClient(message.options.ServerId);
    } else if (message.options && message.options.items && message.options.items.length) {
      apiClient = _connectionmanager.default.getApiClient(message.options.items[0]);
    } else {
      apiClient = _connectionmanager.default.currentApiClient();
    }
    message = Object.assign(message, {
      userId: apiClient.getCurrentUserId(),
      deviceId: apiClient.deviceId(),
      accessToken: apiClient.accessToken(),
      serverAddress: apiClient.serverAddress(),
      serverId: apiClient.serverId(),
      serverVersion: apiClient.serverVersion(),
      receiverName: receiverName
    });
    var bitrateSetting = _appsettings.default.maxChromecastBitrate();
    if (bitrateSetting) {
      message.maxBitrate = bitrateSetting;
    }
    if (message.options && message.options.items) {
      message.subtitleAppearance = _usersettings.default.getSubtitleAppearanceSettings();
    }
    return Emby.importModule('./modules/chromecast/chromecasthelpers.js').then(function (chromecastHelper) {
      return chromecastHelper.getServerAddress(apiClient).then(function (serverAddress) {
        message.serverAddress = serverAddress;
        return player.sendMessageInternal(message);
      });
    });
  };
  CastPlayer.prototype.sendMessageInternal = function (message) {
    message = JSON.stringify(message);
    //console.log(message);

    this.session.sendMessage(messageNamespace, message, this.onPlayCommandSuccess.bind(this), this.errorHandler);
    return Promise.resolve();
  };
  CastPlayer.prototype.onPlayCommandSuccess = function () {
    //console.log('Message was sent to receiver ok.');
  };

  /**
   * Callback function for loadMedia success
   * @param {Object} mediaSession A new media object.
   */
  CastPlayer.prototype.onMediaDiscovered = function (how, mediaSession) {
    //console.log("chromecast new media session ID:" + mediaSession.mediaSessionId + ' (' + how + ')');
    this.currentMediaSession = mediaSession;
    if (how === 'loadMedia') {
      this.castPlayerState = PLAYER_STATE.PLAYING;
    }
    if (how === 'activeSession') {
      this.castPlayerState = mediaSession.playerState;
    }
    this.currentMediaSession.addUpdateListener(this.mediaStatusUpdateHandler);
  };

  /**
   * Callback function for media status update from receiver
   * @param {!Boolean} e true/false
   */
  CastPlayer.prototype.onMediaStatusUpdate = function (e) {
    if (e === false) {
      this.castPlayerState = PLAYER_STATE.IDLE;
    }
    //console.log("chromecast updating media: " + e);
  };

  /**
   * Set media volume in Cast mode
   * @param {Boolean} mute A boolean  
   */
  CastPlayer.prototype.setReceiverVolume = function (mute, vol) {
    if (!this.currentMediaSession) {
      //console.log('this.currentMediaSession is null');
      //return;
    }
    if (!mute) {
      var newVolume = vol;
      this.currentVolume = newVolume;
      this.session.setReceiverVolumeLevel(newVolume, this.mediaCommandSuccessCallback.bind(this), this.errorHandler);
    } else {
      this.session.setReceiverMuted(true, this.mediaCommandSuccessCallback.bind(this), this.errorHandler);
    }
  };

  /**
   * Mute CC
   */
  CastPlayer.prototype.mute = function () {
    this.setReceiverVolume(true);
  };

  /**
   * Mute CC
   */
  CastPlayer.prototype.unMute = function () {
    var newVolume = this.currentVolume || 1;
    this.setReceiverVolume(false, newVolume);
  };

  /**
   * Callback function for media command success 
   */
  CastPlayer.prototype.mediaCommandSuccessCallback = function (info, e) {
    //console.log(info);
  };
  function normalizeImages(state) {
    if (state && state.NowPlayingItem) {
      var item = state.NowPlayingItem;
      if (!item.ImageTags || !item.ImageTags.Primary) {
        if (item.PrimaryImageTag) {
          item.ImageTags = item.ImageTags || {};
          item.ImageTags.Primary = item.PrimaryImageTag;
        }
      }
      if (item.BackdropImageTag && item.BackdropItemId === item.Id) {
        item.BackdropImageTags = [item.BackdropImageTag];
      }
      if (item.BackdropImageTag && item.BackdropItemId !== item.Id) {
        item.ParentBackdropImageTags = [item.BackdropImageTag];
        item.ParentBackdropItemId = item.BackdropItemId;
      }
    }
  }
  function getItemsForPlayback(apiClient, query) {
    var userId = apiClient.getCurrentUserId();
    if (query.Ids && query.Ids.split(',').length === 1) {
      return apiClient.getItem(userId, query.Ids.split(',')).then(function (item) {
        return {
          Items: [item],
          TotalRecordCount: 1
        };
      });
    } else {
      query.Limit = query.Limit || 100;
      query.ExcludeLocationTypes = "Virtual";
      query.EnableTotalRecordCount = false;
      return apiClient.getItems(userId, query);
    }
  }
  function bindEventForRelay(instance, eventName) {
    _events.default.on(instance._castPlayer, eventName, function (e, data) {
      //console.log('cc: ' + eventName);

      if (eventName === 'playlistitemremove') {
        _events.default.trigger(instance, eventName, [data]);
        return;
      }
      var state = instance.getPlayerStateInternal(data);
      _events.default.trigger(instance, eventName, [state]);
    });
  }
  function initializeChromecast() {
    var instance = this;
    instance._castPlayer = new CastPlayer();

    // To allow the native android app to override
    document.dispatchEvent(new CustomEvent("chromecastloaded", {
      detail: {
        player: instance
      }
    }));
    _events.default.on(instance._castPlayer, "connect", function (e) {
      if (currentResolve) {
        sendConnectionResult(true);
      } else {
        _playbackmanager.default.setActivePlayer(PlayerName, instance.getCurrentTargetInfo());
      }
      console.log('cc: connect');
      // Reset this so that statechange will fire
      instance.lastPlayerData = null;
    });
    _events.default.on(instance._castPlayer, "playbackstart", function (e, data) {
      console.log('cc: playbackstart');
      instance._castPlayer.initializeCastPlayer();
      var state = instance.getPlayerStateInternal(data);
      _events.default.trigger(instance, "playbackstart", [state]);
    });
    _events.default.on(instance._castPlayer, "playbackstop", function (e, data) {
      console.log('cc: playbackstop');
      var state = instance.getPlayerStateInternal(data);
      _events.default.trigger(instance, "playbackstop", [state]);

      // Reset this so the next query doesn't make it appear like content is playing.
      instance.resetLastPlayerData();
    });
    _events.default.on(instance._castPlayer, "playbackprogress", function (e, data) {
      //console.log('cc: positionchange');
      var state = instance.getPlayerStateInternal(data);
      _events.default.trigger(instance, "timeupdate", [state]);
    });
    bindEventForRelay(instance, 'timeupdate');
    bindEventForRelay(instance, 'pause');
    bindEventForRelay(instance, 'unpause');
    bindEventForRelay(instance, 'volumechange');
    bindEventForRelay(instance, 'repeatmodechange');
    bindEventForRelay(instance, 'sleeptimerchange');
    bindEventForRelay(instance, 'shufflechange');
    bindEventForRelay(instance, 'subtitleoffsetchange');
    bindEventForRelay(instance, 'playbackratechange');
    bindEventForRelay(instance, 'audiotrackchange');
    bindEventForRelay(instance, 'subtitletrackchange');
    bindEventForRelay(instance, 'qualitychange');
    bindEventForRelay(instance, 'playlistitemmove');
    bindEventForRelay(instance, 'playlistitemremove');
    bindEventForRelay(instance, 'playlistitemadd');
  }
  function ChromecastPlayer() {
    // playbackManager needs this
    this.name = PlayerName;
    this.type = 'mediaplayer';
    this.id = 'chromecast';
    this.isLocalPlayer = false;
    this.resetLastPlayerData();
    getCastSenderApiLoader().then(initializeChromecast.bind(this));
  }
  ChromecastPlayer.prototype.tryPair = function (target) {
    var castPlayer = this._castPlayer;
    if (castPlayer.deviceState !== DEVICE_STATE.ACTIVE && castPlayer.isInitialized) {
      return new Promise(function (resolve, reject) {
        currentResolve = resolve;
        currentReject = reject;
        castPlayer.launchApp();
      });
    } else {
      currentResolve = null;
      currentReject = null;
      return Promise.reject();
    }
  };
  ChromecastPlayer.prototype.resetLastPlayerData = function () {
    var newData = {};
    var lastPlayerData = this.lastPlayerData;
    if (lastPlayerData && lastPlayerData.NowPlayingQueue) {
      newData.NowPlayingQueue = lastPlayerData.NowPlayingQueue;
    }
    this.lastPlayerData = newData;
  };
  ChromecastPlayer.prototype.getTargets = function () {
    var targets = [];
    if (this._castPlayer && this._castPlayer.hasReceivers) {
      targets.push(this.getCurrentTargetInfo());
    }
    return Promise.resolve(targets);
  };

  // This is a privately used method
  ChromecastPlayer.prototype.getCurrentTargetInfo = function () {
    var appName = null;
    var castPlayer = this._castPlayer;
    if (castPlayer.session && castPlayer.session.receiver && castPlayer.session.receiver.friendlyName) {
      appName = castPlayer.session.receiver.friendlyName;
    }
    return {
      name: PlayerName,
      id: PlayerName,
      playerName: PlayerName,
      playableMediaTypes: ['Audio', 'Video'],
      isLocalPlayer: false,
      appName: PlayerName,
      deviceName: appName,
      supportedCommands: ['VolumeUp', 'VolumeDown', 'Mute', 'Unmute', 'ToggleMute', 'SetVolume', 'SetAudioStreamIndex', 'SetSubtitleStreamIndex', 'RefreshMediaSource', 'DisplayContent', 'TriggerTranscodingFallback', 'SetRepeatMode', 'SetSleepTimer', 'SetShuffle', 'SetSubtitleOffset', 'SetPlaybackRate', 'EndSession', 'PlayMediaSource', 'PlayTrailers']
    };
  };
  ChromecastPlayer.prototype.getPlayerStateInternal = function (data) {
    var lastPlayerData = this.lastPlayerData;
    var triggerStateChange = false;
    if (data) {
      if (!data.NowPlayingQueue && lastPlayerData) {
        data.NowPlayingQueue = lastPlayerData.NowPlayingQueue;
      }
      if (!lastPlayerData) {
        triggerStateChange = true;
      }
    }
    data = data || lastPlayerData;
    if (data) {
      data.VolumeLevel = this._castPlayer.currentVolume * 100;
    }
    this.lastPlayerData = data;
    normalizeImages(data);

    //console.log(JSON.stringify(data));

    if (triggerStateChange) {
      _events.default.trigger(this, "statechange", [data]);
    }
    return data;
  };
  ChromecastPlayer.prototype.playWithCommand = function (options, command) {
    if (!options.items) {
      var apiClient = _connectionmanager.default.getApiClient(options.serverId);
      var instance = this;
      return apiClient.getItem(apiClient.getCurrentUserId(), options.ids[0]).then(function (item) {
        options.items = [item];
        return instance.playWithCommand(options, command);
      });
    }
    return this._castPlayer.loadMedia(options, command);
  };
  ChromecastPlayer.prototype.seek = function (position) {
    position = parseInt(position);
    position = position / 10000000;
    return this._castPlayer.sendMessage({
      options: {
        position: position
      },
      command: 'Seek'
    });
  };
  ChromecastPlayer.prototype.seekRelative = function (offsetTicks) {
    offsetTicks = parseInt(offsetTicks);
    return this._castPlayer.sendMessage({
      options: {
        offset: offsetTicks
      },
      command: 'SeekRelative'
    });
  };
  ChromecastPlayer.prototype.setAudioStreamIndex = function (index) {
    return this._castPlayer.sendMessage({
      options: {
        index: index
      },
      command: 'SetAudioStreamIndex'
    });
  };
  ChromecastPlayer.prototype.setSubtitleStreamIndex = function (index, refreshMediaSource) {
    return this._castPlayer.sendMessage({
      options: {
        index: index,
        RefreshMediaSource: refreshMediaSource
      },
      command: 'SetSubtitleStreamIndex'
    });
  };
  ChromecastPlayer.prototype.setMaxStreamingBitrate = function (options) {
    return this._castPlayer.sendMessage({
      options: options,
      command: 'SetMaxStreamingBitrate'
    });
  };
  ChromecastPlayer.prototype.isFullscreen = function () {
    var _this$lastPlayerData;
    return (_this$lastPlayerData = this.lastPlayerData) == null || (_this$lastPlayerData = _this$lastPlayerData.PlayState) == null ? void 0 : _this$lastPlayerData.IsFullscreen;
  };
  ChromecastPlayer.prototype.nextTrack = function () {
    return this._castPlayer.sendMessage({
      options: {},
      command: 'NextTrack'
    });
  };
  ChromecastPlayer.prototype.previousTrack = function () {
    return this._castPlayer.sendMessage({
      options: {},
      command: 'PreviousTrack'
    });
  };
  ChromecastPlayer.prototype.volumeDown = function () {
    var volume = this._castPlayer.currentVolume - 0.02;
    this.setVolume(volume * 100);
  };
  ChromecastPlayer.prototype.endSession = function () {
    var instance = this;
    this.stop().then(function () {
      setTimeout(function () {
        instance._castPlayer.stopApp();
      }, 1000);
    });
  };
  ChromecastPlayer.prototype.volumeUp = function () {
    var volume = this._castPlayer.currentVolume + 0.02;
    this.setVolume(volume * 100);
  };
  ChromecastPlayer.prototype.setVolume = function (vol) {
    vol = Math.min(vol, 100);
    vol = Math.max(vol, 0);
    this._castPlayer.setReceiverVolume(false, vol / 100);
  };
  ChromecastPlayer.prototype.unpause = function () {
    return this._castPlayer.sendMessage({
      options: {},
      command: 'Unpause'
    });
  };
  ChromecastPlayer.prototype.playPause = function () {
    return this._castPlayer.sendMessage({
      options: {},
      command: 'PlayPause'
    });
  };
  ChromecastPlayer.prototype.pause = function () {
    return this._castPlayer.sendMessage({
      options: {},
      command: 'Pause'
    });
  };
  ChromecastPlayer.prototype.stop = function () {
    return this._castPlayer.sendMessage({
      options: {},
      command: 'Stop'
    });
  };
  ChromecastPlayer.prototype.displayContent = function (options) {
    return this._castPlayer.sendMessage({
      options: options,
      command: 'DisplayContent'
    });
  };
  ChromecastPlayer.prototype.setMute = function (isMuted) {
    if (isMuted) {
      this._castPlayer.mute();
    } else {
      this._castPlayer.unMute();
    }
  };
  ChromecastPlayer.prototype.getRepeatMode = function () {
    var _this$lastPlayerData2;
    return (_this$lastPlayerData2 = this.lastPlayerData) == null || (_this$lastPlayerData2 = _this$lastPlayerData2.PlayState) == null ? void 0 : _this$lastPlayerData2.RepeatMode;
  };
  ChromecastPlayer.prototype.getSleepTimerMode = function () {
    var _this$lastPlayerData3;
    return (_this$lastPlayerData3 = this.lastPlayerData) == null || (_this$lastPlayerData3 = _this$lastPlayerData3.PlayState) == null ? void 0 : _this$lastPlayerData3.SleepTimerMode;
  };
  ChromecastPlayer.prototype.getSleepTimerEndTime = function () {
    var _this$lastPlayerData4;
    return (_this$lastPlayerData4 = this.lastPlayerData) == null || (_this$lastPlayerData4 = _this$lastPlayerData4.PlayState) == null ? void 0 : _this$lastPlayerData4.SleepTimerEndTime;
  };
  ChromecastPlayer.prototype.getShuffle = function () {
    var _this$lastPlayerData5;
    return (_this$lastPlayerData5 = this.lastPlayerData) == null || (_this$lastPlayerData5 = _this$lastPlayerData5.PlayState) == null ? void 0 : _this$lastPlayerData5.Shuffle;
  };
  ChromecastPlayer.prototype.getSubtitleOffset = function () {
    var _this$lastPlayerData6;
    return (_this$lastPlayerData6 = this.lastPlayerData) == null || (_this$lastPlayerData6 = _this$lastPlayerData6.PlayState) == null ? void 0 : _this$lastPlayerData6.SubtitleOffset;
  };
  ChromecastPlayer.prototype.playTrailers = function (item) {
    return this._castPlayer.sendMessage({
      options: {
        ItemId: item.Id,
        ServerId: item.ServerId
      },
      command: 'PlayTrailers'
    });
  };
  ChromecastPlayer.prototype.triggerTranscodingFallback = function () {
    return this._castPlayer.sendMessage({
      options: {},
      command: 'TriggerTranscodingFallback'
    });
  };
  ChromecastPlayer.prototype.setRepeatMode = function (mode) {
    return this._castPlayer.sendMessage({
      options: {
        RepeatMode: mode
      },
      command: 'SetRepeatMode'
    });
  };
  ChromecastPlayer.prototype.setSleepTimer = function (options) {
    return this._castPlayer.sendMessage({
      options: options,
      command: 'SetSleepTimer'
    });
  };
  ChromecastPlayer.prototype.setShuffle = function (mode) {
    return this._castPlayer.sendMessage({
      options: {
        Shuffle: mode
      },
      command: 'SetShuffle'
    });
  };
  ChromecastPlayer.prototype.setSubtitleOffset = function (value) {
    return this._castPlayer.sendMessage({
      options: {
        SubtitleOffset: value
      },
      command: 'SetSubtitleOffset'
    });
  };
  ChromecastPlayer.prototype.incrementSubtitleOffset = function (value) {
    return this._castPlayer.sendMessage({
      options: {
        Increment: value
      },
      command: 'IncrementSubtitleOffset'
    });
  };
  ChromecastPlayer.prototype.getPlaybackRate = function () {
    var _this$lastPlayerData7;
    return (_this$lastPlayerData7 = this.lastPlayerData) == null || (_this$lastPlayerData7 = _this$lastPlayerData7.PlayState) == null ? void 0 : _this$lastPlayerData7.PlaybackRate;
  };
  ChromecastPlayer.prototype.setPlaybackRate = function (value) {
    return this._castPlayer.sendMessage({
      options: {
        PlaybackRate: value
      },
      command: 'SetPlaybackRate'
    });
  };
  ChromecastPlayer.prototype.toggleMute = function () {
    return this._castPlayer.sendMessage({
      options: {},
      command: 'ToggleMute'
    });
  };
  ChromecastPlayer.prototype.getAudioStreamIndex = function () {
    var _this$lastPlayerData8;
    return (_this$lastPlayerData8 = this.lastPlayerData) == null || (_this$lastPlayerData8 = _this$lastPlayerData8.PlayState) == null ? void 0 : _this$lastPlayerData8.AudioStreamIndex;
  };
  ChromecastPlayer.prototype.getSubtitleStreamIndex = function () {
    var _this$lastPlayerData9;
    return (_this$lastPlayerData9 = this.lastPlayerData) == null || (_this$lastPlayerData9 = _this$lastPlayerData9.PlayState) == null ? void 0 : _this$lastPlayerData9.SubtitleStreamIndex;
  };
  ChromecastPlayer.prototype.getMaxStreamingBitrate = function () {
    var _this$lastPlayerData0;
    return (_this$lastPlayerData0 = this.lastPlayerData) == null || (_this$lastPlayerData0 = _this$lastPlayerData0.PlayState) == null ? void 0 : _this$lastPlayerData0.MaxStreamingBitrate;
  };
  ChromecastPlayer.prototype.getVolume = function () {
    var _this$lastPlayerData1;
    var volumeLevel = (_this$lastPlayerData1 = this.lastPlayerData) == null || (_this$lastPlayerData1 = _this$lastPlayerData1.PlayState) == null ? void 0 : _this$lastPlayerData1.VolumeLevel;
    return volumeLevel == null ? 100 : volumeLevel;
  };
  ChromecastPlayer.prototype.isPlaying = function (mediaType) {
    var _this$lastPlayerData10;
    var nowPlayingItem = (_this$lastPlayerData10 = this.lastPlayerData) == null ? void 0 : _this$lastPlayerData10.NowPlayingItem;
    return nowPlayingItem && (!mediaType || nowPlayingItem.MediaType === mediaType);
  };
  ChromecastPlayer.prototype.currentMediaSource = function () {
    var _this$lastPlayerData11;
    return (_this$lastPlayerData11 = this.lastPlayerData) == null ? void 0 : _this$lastPlayerData11.MediaSource;
  };
  ChromecastPlayer.prototype.currentTime = function (val) {
    var _this$lastPlayerData12;
    if (val != null) {
      return this.seek(val);
    }
    return (_this$lastPlayerData12 = this.lastPlayerData) == null || (_this$lastPlayerData12 = _this$lastPlayerData12.PlayState) == null ? void 0 : _this$lastPlayerData12.PositionTicks;
  };
  ChromecastPlayer.prototype.playbackStartTime = function () {
    var _this$lastPlayerData13;
    return (_this$lastPlayerData13 = this.lastPlayerData) == null || (_this$lastPlayerData13 = _this$lastPlayerData13.PlayState) == null ? void 0 : _this$lastPlayerData13.PlaybackStartTimeTicks;
  };
  ChromecastPlayer.prototype.duration = function () {
    var _this$lastPlayerData14;
    return (_this$lastPlayerData14 = this.lastPlayerData) == null || (_this$lastPlayerData14 = _this$lastPlayerData14.MediaSource) == null ? void 0 : _this$lastPlayerData14.RunTimeTicks;
  };
  ChromecastPlayer.prototype.getBufferedRanges = function () {
    var _this$lastPlayerData15;
    return ((_this$lastPlayerData15 = this.lastPlayerData) == null || (_this$lastPlayerData15 = _this$lastPlayerData15.PlayState) == null ? void 0 : _this$lastPlayerData15.BufferedRanges) || [];
  };
  ChromecastPlayer.prototype.getSeekableRanges = function () {
    var _this$lastPlayerData16;
    return ((_this$lastPlayerData16 = this.lastPlayerData) == null || (_this$lastPlayerData16 = _this$lastPlayerData16.PlayState) == null ? void 0 : _this$lastPlayerData16.SeekableRanges) || [];
  };
  ChromecastPlayer.prototype.paused = function () {
    var _this$lastPlayerData17;
    return (_this$lastPlayerData17 = this.lastPlayerData) == null || (_this$lastPlayerData17 = _this$lastPlayerData17.PlayState) == null ? void 0 : _this$lastPlayerData17.IsPaused;
  };
  ChromecastPlayer.prototype.isMuted = function () {
    var _this$lastPlayerData18;
    return (_this$lastPlayerData18 = this.lastPlayerData) == null || (_this$lastPlayerData18 = _this$lastPlayerData18.PlayState) == null ? void 0 : _this$lastPlayerData18.IsMuted;
  };
  ChromecastPlayer.prototype.shuffle = function (item) {
    var apiClient = _connectionmanager.default.getApiClient(item);
    var userId = apiClient.getCurrentUserId();
    var instance = this;
    return apiClient.getItem(userId, item.Id).then(function (item) {
      return instance.playWithCommand({
        items: [item]
      }, 'Shuffle');
    });
  };
  ChromecastPlayer.prototype.instantMix = function (item) {
    var apiClient = _connectionmanager.default.getApiClient(item);
    var userId = apiClient.getCurrentUserId();
    var instance = this;
    return apiClient.getItem(userId, item.Id).then(function (item) {
      return instance.playWithCommand({
        items: [item]
      }, 'InstantMix');
    });
  };
  ChromecastPlayer.prototype.canPlayMediaType = function (mediaType) {
    switch (mediaType) {
      case 'Audio':
      case 'Video':
        return true;
      default:
        return false;
    }
  };
  ChromecastPlayer.prototype.queue = function (options) {
    return this.playWithCommand(options, 'PlayLast');
  };
  ChromecastPlayer.prototype.queueNext = function (options) {
    return this.playWithCommand(options, 'PlayNext');
  };
  ChromecastPlayer.prototype.play = function (options) {
    if (options.shuffle) {
      var _options$items, _options$ids;
      if ((_options$items = options.items) != null && _options$items.length) {
        return this.shuffle(options.items[0]);
      }
      if ((_options$ids = options.ids) != null && _options$ids.length) {
        return this.shuffle({
          Id: options.ids[0]
        });
      }
    }
    if (options.items) {
      return this.playWithCommand(options, 'PlayNow');
    } else {
      if (!options.serverId) {
        throw new Error('serverId required!');
      }
      var instance = this;
      var apiClient = _connectionmanager.default.getApiClient(options.serverId);
      return getItemsForPlayback(apiClient, {
        Ids: options.ids.join(',')
      }).then(function (result) {
        options.items = result.Items;
        return instance.playWithCommand(options, 'PlayNow');
      });
    }
  };
  ChromecastPlayer.prototype.toggleFullscreen = function () {
    // not supported
    return Promise.reject();
  };
  ChromecastPlayer.prototype.beginPlayerUpdates = function () {
    // Setup polling here
  };
  ChromecastPlayer.prototype.endPlayerUpdates = function () {
    // Stop polling here
  };
  ChromecastPlayer.prototype.getPlaylist = function () {
    var _this$lastPlayerData19;
    var items = ((_this$lastPlayerData19 = this.lastPlayerData) == null ? void 0 : _this$lastPlayerData19.NowPlayingQueue) || [];
    return Promise.resolve({
      Items: items,
      TotalRecordCount: items.length
    });
  };
  ChromecastPlayer.prototype.getCurrentPlaylistItemId = function () {
    var _this$lastPlayerData20;
    return (_this$lastPlayerData20 = this.lastPlayerData) == null ? void 0 : _this$lastPlayerData20.PlaylistItemId;
  };
  ChromecastPlayer.prototype.getCurrentPlaylistIndex = function () {
    var _this$lastPlayerData21;
    return (_this$lastPlayerData21 = this.lastPlayerData) == null ? void 0 : _this$lastPlayerData21.PlaylistIndex;
  };
  ChromecastPlayer.prototype.getCurrentPlaylistLength = function () {
    var _this$lastPlayerData22;
    return (_this$lastPlayerData22 = this.lastPlayerData) == null ? void 0 : _this$lastPlayerData22.PlaylistLength;
  };
  ChromecastPlayer.prototype.setCurrentPlaylistItem = function (playlistItemId) {
    return this._castPlayer.sendMessage({
      options: {
        PlaylistItemId: playlistItemId
      },
      command: 'SetCurrentPlaylistItem'
    });
  };
  ChromecastPlayer.prototype.movePlaylistItem = function (playlistItemId, newIndex) {
    return this._castPlayer.sendMessage({
      options: {
        PlaylistItemId: playlistItemId,
        NewIndex: newIndex
      },
      command: 'MovePlaylistItem'
    });
  };
  ChromecastPlayer.prototype.removeFromPlaylist = function (playlistItemIds) {
    return this._castPlayer.sendMessage({
      options: {
        PlaylistItemIds: playlistItemIds.join(',')
      },
      command: 'RemoveFromPlaylist'
    });
  };
  ChromecastPlayer.prototype.getPlayerState = function () {
    return this.getPlayerStateInternal() || {};
  };
  var _default = _exports.default = ChromecastPlayer;
});
