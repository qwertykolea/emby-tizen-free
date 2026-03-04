define(["exports", "./common/playback/playbackmanager.js", "./emby-apiclient/connectionmanager.js", "./emby-apiclient/events.js", "./common/input/api.js", "./common/methodtimer.js"], function (_exports, _playbackmanager, _connectionmanager, _events, _api, _methodtimer) {
  Object.defineProperty(_exports, "__esModule", {
    value: true
  });
  _exports.default = void 0;
  /* jshint module: true */

  var PlayerName = 'Remote Control';
  function sendPlayCommand(instance, apiClient, options, playType) {
    var sessionId = instance.currentSessionId;
    var ids = options.ids || options.items.map(function (i) {
      return i.Id;
    });
    var remoteOptions = {
      ItemIds: ids.join(','),
      PlayCommand: playType
    };
    if (options.startPositionTicks != null) {
      remoteOptions.StartPositionTicks = options.startPositionTicks;
    }
    if (options.mediaSourceId) {
      remoteOptions.MediaSourceId = options.mediaSourceId;
    }
    if (options.audioStreamIndex != null) {
      remoteOptions.AudioStreamIndex = options.audioStreamIndex;
    }
    if (options.subtitleStreamIndex != null) {
      remoteOptions.SubtitleStreamIndex = options.subtitleStreamIndex;
    }
    if (options.startIndex != null) {
      remoteOptions.StartIndex = options.startIndex;
    }
    return apiClient.sendPlayCommand(sessionId, remoteOptions);
  }
  function sendPlayStateCommand(instance, apiClient, command, options) {
    var sessionId = instance.currentSessionId;
    return apiClient.sendPlayStateCommand(sessionId, command, options);
  }
  function getCurrentApiClient(instance) {
    var currentServerId = instance.currentServerId;
    if (currentServerId) {
      return _connectionmanager.default.getApiClient(currentServerId);
    }
    return _connectionmanager.default.currentApiClient();
  }
  function sendCommandByName(instance, name, options) {
    var command = {
      Name: name
    };
    if (options) {
      command.Arguments = options;
    }
    return instance.sendCommand(command);
  }
  function clearPollInterval(instance) {
    if (instance.pollInterval) {
      instance.pollInterval.destroy();
      instance.pollInterval = null;
    }
  }
  function unsubscribeFromPlayerUpdates(instance) {
    var apiClient = getCurrentApiClient(instance);
    apiClient.stopMessageListener('SessionEvents');
    clearPollInterval(instance);
  }
  function processUpdatedSessions(instance, sessions, apiClient) {
    var currentTargetId = instance.currentSessionId;
    var session = sessions.filter(function (s) {
      return s.Id === currentTargetId;
    })[0];
    processUpdatedSession(instance, session, apiClient);
  }
  function triggerEvent(instance, eventName, session) {
    if (eventName === 'sessionstarted') {
      eventName = 'statechange';
    }
    if (session) {
      _events.default.trigger(instance, eventName, [session]);
    } else {
      _events.default.trigger(instance, eventName);
    }
  }
  function processSessionEvent(instance, sessionEventInfo, apiClient) {
    var eventName = (sessionEventInfo.EventName || 'statechange').toLowerCase();
    if (eventName === 'sessionended' || eventName === 'remotecontroldisconnected') {
      instance.lastPlayerData = null;
      _playbackmanager.default.removeActivePlayer(PlayerName);
      return;
    }

    //console.log('processSessionEvent: ' + eventName);
    //console.log('processSessionEvent: ' + eventName + '--' + JSON.stringify(sessionEventInfo));

    var session = sessionEventInfo.SessionInfo;
    if (session) {
      normalizeImages(session, apiClient);
      if (session.NowPlayingItem) {
        session.NowPlayingItem.ServerId = apiClient.serverId();
      }

      // the server doesn't provide this (yet), and NowPlayingItem is almost the same thing
      if (!session.MediaSource) {
        session.MediaSource = session.NowPlayingItem;
      }
      session.NextMediaType = sessionEventInfo.NextMediaType;
      instance.lastPlayerData = session;
      triggerEvent(instance, eventName, session);
      return;
    }
    session = instance.lastPlayerData;
    if (!session) {
      return;
    }
    var playState = session.PlayState;
    if (!playState) {
      playState = {};
    }
    var triggerTimeUpdate = false;
    if (sessionEventInfo.PositionTicks != null) {
      playState.PositionTicks = sessionEventInfo.PositionTicks;
      triggerTimeUpdate = true;
    }
    if (sessionEventInfo.PlaylistIndex != null) {
      session.PlaylistIndex = sessionEventInfo.PlaylistIndex;
    }
    if (sessionEventInfo.PlaylistLength != null) {
      session.PlaylistLength = sessionEventInfo.PlaylistLength;
    }
    if (sessionEventInfo.PlaylistItemId != null) {
      session.PlaylistItemId = sessionEventInfo.PlaylistItemId;
    }
    if (sessionEventInfo.IsPaused != null) {
      playState.IsPaused = sessionEventInfo.IsPaused;
    }
    if (sessionEventInfo.VolumeLevel != null) {
      playState.VolumeLevel = sessionEventInfo.VolumeLevel;
    }
    if (sessionEventInfo.IsMuted != null) {
      playState.IsMuted = sessionEventInfo.IsMuted;
    }
    if (sessionEventInfo.RepeatMode != null) {
      playState.RepeatMode = sessionEventInfo.RepeatMode;
    }
    if (sessionEventInfo.SleepTimerMode != null || sessionEventInfo.SleepTimerEndTime != null) {
      playState.SleepTimerMode = sessionEventInfo.SleepTimerMode;
      playState.SleepTimerEndTime = sessionEventInfo.SleepTimerEndTime;
    }
    if (sessionEventInfo.Shuffle != null) {
      playState.Shuffle = sessionEventInfo.Shuffle;
    }
    if (sessionEventInfo.SubtitleOffset != null) {
      playState.SubtitleOffset = sessionEventInfo.SubtitleOffset;
    }
    if (sessionEventInfo.PlaybackRate != null) {
      playState.PlaybackRate = sessionEventInfo.PlaybackRate;
    }
    if (eventName === 'subtitletrackchange') {
      playState.SubtitleStreamIndex = sessionEventInfo.SubtitleStreamIndex;
    } else if (eventName === 'audiotrackchange') {
      playState.AudioStreamIndex = sessionEventInfo.AudioStreamIndex;
    }
    if (eventName === 'playlistitemremove') {
      triggerEvent(instance, eventName, sessionEventInfo);
    } else {
      triggerEvent(instance, eventName);
    }
    if (eventName !== 'timeupdate') {
      if (triggerTimeUpdate) {
        triggerEvent(instance, 'timeupdate');
      }
    }
  }
  function processUpdatedSession(instance, session, apiClient) {
    if (session) {
      var serverId = apiClient.serverId();
      if (session.NowPlayingItem) {
        session.NowPlayingItem.ServerId = serverId;
      }
      normalizeImages(session, apiClient);
      var eventNames = getChangedEvents(instance.lastPlayerData, session);
      instance.lastPlayerData = session;
      for (var i = 0, length = eventNames.length; i < length; i++) {
        _events.default.trigger(instance, eventNames[i], [session]);
      }
    } else {
      instance.lastPlayerData = session;
      _playbackmanager.default.removeActivePlayer(PlayerName);
    }
  }
  function getChangedEvents(state1, state2) {
    var names = [];
    names.push('statechange');
    return names;
  }
  function onPollIntervalFired() {
    var instance = this;
    var apiClient = getCurrentApiClient(instance);
    if (!apiClient.isMessageChannelOpen()) {
      apiClient.getSessions({
        Id: instance.currentSessionId,
        IncludeAllSessionsIfAdmin: false
      }).then(function (sessions) {
        processUpdatedSessions(instance, sessions, apiClient);
      });
    }
  }
  function subscribeToPlayerUpdates(instance) {
    var sessionId = instance.currentSessionId || '';
    var apiClient = getCurrentApiClient(instance);
    var messageListenerName = 'SessionEvents';
    apiClient.startMessageListener(messageListenerName, "100,800," + sessionId);
    clearPollInterval(instance);
    instance.pollInterval = new _methodtimer.default({
      onInterval: onPollIntervalFired.bind(instance),
      timeoutMs: 5000,
      type: 'interval'
    });
  }
  function normalizeImages(state, apiClient) {
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
      if (!item.ServerId) {
        item.ServerId = apiClient.serverId();
      }
    }
  }
  function SessionPlayer() {
    var self = this;
    this.name = PlayerName;
    this.type = 'mediaplayer';
    this.isLocalPlayer = false;
    this.id = 'remoteplayer';
    _events.default.on(_api.default, 'SessionEvents', function (e, apiClient, data) {
      processSessionEvent(self, data, apiClient);
    });
  }
  SessionPlayer.prototype.beginPlayerUpdates = function () {
    this.playerListenerCount = this.playerListenerCount || 0;
    if (this.playerListenerCount <= 0) {
      this.playerListenerCount = 0;
      subscribeToPlayerUpdates(this);
    }
    this.playerListenerCount++;
  };
  SessionPlayer.prototype.endPlayerUpdates = function () {
    this.playerListenerCount = this.playerListenerCount || 0;
    this.playerListenerCount--;
    if (this.playerListenerCount <= 0) {
      unsubscribeFromPlayerUpdates(this);
      this.playerListenerCount = 0;
    }

    //this.currentSessionId = null;
  };
  SessionPlayer.prototype.getPlayerState = function () {
    return this.lastPlayerData || {};
  };
  SessionPlayer.prototype.getTargets = function () {
    var apiClient = getCurrentApiClient(this);
    var sessionQuery = {
      ControllableByUserId: apiClient.getCurrentUserId(),
      IncludeAllSessionsIfAdmin: false
    };
    if (apiClient) {
      var name = this.name;
      return apiClient.getSessions(sessionQuery).then(function (sessions) {
        return sessions.filter(function (s) {
          return s.DeviceId !== apiClient.deviceId();
        }).map(function (s) {
          return {
            name: s.DeviceName,
            deviceName: s.DeviceName,
            deviceType: s.DeviceType,
            id: s.Id,
            playerName: name,
            appName: s.Client,
            playableMediaTypes: s.PlayableMediaTypes,
            isLocalPlayer: false,
            supportedCommands: s.SupportedCommands,
            user: s.UserId ? {
              Id: s.UserId,
              Name: s.UserName,
              PrimaryImageTag: s.UserPrimaryImageTag
            } : null
          };
        });
      });
    } else {
      return Promise.resolve([]);
    }
  };
  SessionPlayer.prototype.sendCommand = function (command) {
    var sessionId = this.currentSessionId;
    var apiClient = getCurrentApiClient(this);
    return apiClient.sendCommand(sessionId, command);
  };
  SessionPlayer.prototype.play = function (options) {
    options = Object.assign({}, options);
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
      options.ids = options.items.map(function (i) {
        return i.Id;
      });
      options.items = null;
    }
    return sendPlayCommand(this, getCurrentApiClient(this), options, 'PlayNow');
  };
  SessionPlayer.prototype.shuffle = function (item) {
    return sendPlayCommand(this, getCurrentApiClient(this), {
      ids: [item.Id]
    }, 'PlayShuffle');
  };
  SessionPlayer.prototype.instantMix = function (item) {
    return sendPlayCommand(this, getCurrentApiClient(this), {
      ids: [item.Id]
    }, 'PlayInstantMix');
  };
  SessionPlayer.prototype.queue = function (options) {
    return sendPlayCommand(this, getCurrentApiClient(this), options, 'PlayLast');
  };
  SessionPlayer.prototype.queueNext = function (options) {
    return sendPlayCommand(this, getCurrentApiClient(this), options, 'PlayNext');
  };
  SessionPlayer.prototype.canPlayMediaType = function (mediaType) {
    switch (mediaType) {
      case 'Audio':
      case 'Video':
        return true;
      default:
        return false;
    }
  };
  SessionPlayer.prototype.stop = function () {
    return sendPlayStateCommand(this, getCurrentApiClient(this), 'stop');
  };
  SessionPlayer.prototype.nextTrack = function () {
    return sendPlayStateCommand(this, getCurrentApiClient(this), 'nextTrack');
  };
  SessionPlayer.prototype.previousTrack = function () {
    return sendPlayStateCommand(this, getCurrentApiClient(this), 'previousTrack');
  };
  SessionPlayer.prototype.seekRelative = function (positionTicks) {
    var apiClient = getCurrentApiClient(this);
    if (!apiClient.isMinServerVersion('4.8.0.35')) {
      return sendPlayStateCommand(this, apiClient, 'seek', {
        SeekPositionTicks: positionTicks + this.currentTime()
      });
    }
    return sendPlayStateCommand(this, apiClient, 'seekrelative', {
      SeekPositionTicks: positionTicks
    });
  };
  SessionPlayer.prototype.seek = function (positionTicks) {
    return sendPlayStateCommand(this, getCurrentApiClient(this), 'seek', {
      SeekPositionTicks: positionTicks
    });
  };
  SessionPlayer.prototype.currentTime = function (val) {
    if (val != null) {
      return this.seek(val);
    }
    var state = this.lastPlayerData || {};
    state = state.PlayState || {};
    return state.PositionTicks;
  };
  SessionPlayer.prototype.playbackStartTime = function () {
    var state = this.lastPlayerData || {};
    state = state.PlayState || {};
    return state.PlaybackStartTimeTicks;
  };
  SessionPlayer.prototype.duration = function () {
    var state = this.lastPlayerData || {};
    state = state.MediaSource || {};
    return state.RunTimeTicks;
  };
  SessionPlayer.prototype.paused = function () {
    var state = this.lastPlayerData || {};
    state = state.PlayState || {};
    return state.IsPaused;
  };
  SessionPlayer.prototype.getVolume = function () {
    var state = this.lastPlayerData || {};
    state = state.PlayState || {};
    return state.VolumeLevel;
  };
  SessionPlayer.prototype.isMuted = function () {
    var state = this.lastPlayerData || {};
    state = state.PlayState || {};
    return state.IsMuted;
  };
  SessionPlayer.prototype.pause = function () {
    return sendPlayStateCommand(this, getCurrentApiClient(this), 'Pause');
  };
  SessionPlayer.prototype.unpause = function () {
    return sendPlayStateCommand(this, getCurrentApiClient(this), 'Unpause');
  };
  SessionPlayer.prototype.playPause = function () {
    return sendPlayStateCommand(this, getCurrentApiClient(this), 'PlayPause');
  };
  SessionPlayer.prototype.setMute = function (isMuted) {
    if (isMuted) {
      return sendCommandByName(this, 'Mute');
    } else {
      return sendCommandByName(this, 'Unmute');
    }
  };
  SessionPlayer.prototype.toggleMute = function () {
    return sendCommandByName(this, 'ToggleMute');
  };
  SessionPlayer.prototype.setVolume = function (vol) {
    return sendCommandByName(this, 'SetVolume', {
      Volume: vol
    });
  };
  SessionPlayer.prototype.volumeUp = function () {
    return sendCommandByName(this, 'VolumeUp');
  };
  SessionPlayer.prototype.volumeDown = function () {
    return sendCommandByName(this, 'VolumeDown');
  };
  SessionPlayer.prototype.getAudioStreamIndex = function () {
    var state = this.lastPlayerData || {};
    state = state.PlayState || {};
    return state.AudioStreamIndex;
  };
  SessionPlayer.prototype.playTrailers = function (item) {
    return sendCommandByName(this, 'PlayTrailers', {
      ItemId: item.Id
    });
  };
  SessionPlayer.prototype.setAudioStreamIndex = function (index) {
    return sendCommandByName(this, 'SetAudioStreamIndex', {
      Index: index
    });
  };
  SessionPlayer.prototype.getSubtitleStreamIndex = function () {
    var state = this.lastPlayerData || {};
    state = state.PlayState || {};
    return state.SubtitleStreamIndex;
  };
  SessionPlayer.prototype.setSubtitleStreamIndex = function (index, refreshMediaSource) {
    return sendCommandByName(this, 'SetSubtitleStreamIndex', {
      Index: index,
      RefreshMediaSource: refreshMediaSource
    });
  };
  SessionPlayer.prototype.getMaxStreamingBitrate = function () {};
  SessionPlayer.prototype.setMaxStreamingBitrate = function (options) {};
  SessionPlayer.prototype.isFullscreen = function () {};
  SessionPlayer.prototype.toggleFullscreen = function () {
    return sendCommandByName(this, 'ToggleFullscreen');
  };
  SessionPlayer.prototype.getRepeatMode = function () {
    var _this$lastPlayerData;
    return (_this$lastPlayerData = this.lastPlayerData) == null || (_this$lastPlayerData = _this$lastPlayerData.PlayState) == null ? void 0 : _this$lastPlayerData.RepeatMode;
  };
  SessionPlayer.prototype.getSleepTimerMode = function () {
    var _this$lastPlayerData2;
    return (_this$lastPlayerData2 = this.lastPlayerData) == null || (_this$lastPlayerData2 = _this$lastPlayerData2.PlayState) == null ? void 0 : _this$lastPlayerData2.SleepTimerMode;
  };
  SessionPlayer.prototype.getSleepTimerEndTime = function () {
    var _this$lastPlayerData3;
    return (_this$lastPlayerData3 = this.lastPlayerData) == null || (_this$lastPlayerData3 = _this$lastPlayerData3.PlayState) == null ? void 0 : _this$lastPlayerData3.SleepTimerEndTime;
  };
  SessionPlayer.prototype.triggerTranscodingFallback = function () {
    return sendCommandByName(this, 'TriggerTranscodingFallback');
  };
  SessionPlayer.prototype.setRepeatMode = function (mode) {
    return sendCommandByName(this, 'SetRepeatMode', {
      RepeatMode: mode
    });
  };
  SessionPlayer.prototype.setSleepTimer = function (options) {
    return sendCommandByName(this, 'SetSleepTimer', options);
  };
  SessionPlayer.prototype.getShuffle = function () {
    var state = this.lastPlayerData || {};
    state = state.PlayState || {};
    return state.Shuffle;
  };
  SessionPlayer.prototype.setShuffle = function (mode) {
    return sendCommandByName(this, 'SetShuffle', {
      Shuffle: mode
    });
  };
  SessionPlayer.prototype.getSubtitleOffset = function () {
    var state = this.lastPlayerData || {};
    state = state.PlayState || {};
    return state.SubtitleOffset;
  };
  SessionPlayer.prototype.setSubtitleOffset = function (value) {
    return sendCommandByName(this, 'SetSubtitleOffset', {
      SubtitleOffset: value
    });
  };
  SessionPlayer.prototype.incrementSubtitleOffset = function (value) {
    return sendCommandByName(this, 'IncrementSubtitleOffset', {
      Increment: value
    });
  };
  SessionPlayer.prototype.getPlaybackRate = function () {
    var state = this.lastPlayerData || {};
    state = state.PlayState || {};
    return state.PlaybackRate;
  };
  SessionPlayer.prototype.setPlaybackRate = function (value) {
    return sendCommandByName(this, 'SetPlaybackRate', {
      PlaybackRate: value
    });
  };
  SessionPlayer.prototype.displayContent = function (options) {
    return sendCommandByName(this, 'DisplayContent', options);
  };
  SessionPlayer.prototype.currentMediaSource = function () {
    var state = this.lastPlayerData || {};
    return state.MediaSource;
  };
  SessionPlayer.prototype.isPlaying = function (mediaType) {
    var _this$lastPlayerData4;
    var nowPlayingItem = (_this$lastPlayerData4 = this.lastPlayerData) == null ? void 0 : _this$lastPlayerData4.NowPlayingItem;
    return nowPlayingItem && (!mediaType || nowPlayingItem.MediaType === mediaType);
  };
  SessionPlayer.prototype.getPlaylist = function () {
    var apiClient = getCurrentApiClient(this);
    return apiClient.getPlayQueue({
      Id: this.currentSessionId
    });
  };
  SessionPlayer.prototype.getCurrentPlaylistItemId = function () {
    var state = this.lastPlayerData || {};
    return state.PlaylistItemId;
  };
  SessionPlayer.prototype.getCurrentPlaylistIndex = function () {
    var state = this.lastPlayerData || {};
    return state.PlaylistIndex;
  };
  SessionPlayer.prototype.getCurrentPlaylistLength = function () {
    var state = this.lastPlayerData || {};
    return state.PlaylistLength;
  };
  SessionPlayer.prototype.setCurrentPlaylistItem = function (playlistItemId) {
    return sendCommandByName(this, 'SetCurrentPlaylistItem', {
      PlaylistItemId: playlistItemId
    });
  };
  SessionPlayer.prototype.movePlaylistItem = function (playlistItemId, newIndex) {
    return sendCommandByName(this, 'MovePlaylistItem', {
      PlaylistItemId: playlistItemId,
      NewIndex: newIndex
    });
  };
  SessionPlayer.prototype.removeFromPlaylist = function (playlistItemIds) {
    return sendCommandByName(this, 'RemoveFromPlaylist', {
      PlaylistItemIds: playlistItemIds.join(',')
    });
  };
  SessionPlayer.prototype.tryPair = function (target) {
    this.currentSessionId = target.id;
    return Promise.resolve();
  };
  var _default = _exports.default = SessionPlayer;
});
