define(["exports", "./../../emby-apiclient/events.js", "./../../emby-apiclient/connectionmanager.js", "./../textencoding.js", "./../playback/playbackmanager.js", "./../servicelocator.js", "./../../approuter.js", "./../inputmanager.js", "./../../focusmanager.js"], function (_exports, _events, _connectionmanager, _textencoding, _playbackmanager, _servicelocator, _approuter, _inputmanager, _focusmanager) {
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
  function showToast(options) {
    return Emby.importModule('./modules/toast/toast.js').then(function (toast) {
      return toast(options);
    });
  }
  var serverNotifications = {};
  function notifyApp() {
    _inputmanager.default.notify();
  }
  function encodeForDisplay(text) {
    return _textencoding.default.htmlEncode(text);
  }
  function displayMessage(cmd) {
    var args = cmd.Arguments;
    if (args.Header) {
      args.Header = encodeForDisplay(args.Header);
    }
    if (args.Text) {
      args.Text = encodeForDisplay(args.Text);
    }
    var timeoutMs = args.TimeoutMs ? parseInt(args.TimeoutMs) : 0;
    if (timeoutMs) {
      showToast({
        title: args.Header,
        text: args.Text,
        timeoutMs: timeoutMs
      });
    } else {
      showAlert({
        title: args.Header,
        text: args.Text
      });
    }
  }
  function displayContent(cmd, apiClient) {
    if (!_playbackmanager.default.isPlayingLocally(['Video', 'Book', 'Game'])) {
      _approuter.default.showItem(cmd.Arguments.ItemId, apiClient.serverId());
    }
  }
  function playTrailers(apiClient, itemId) {
    apiClient.getItem(apiClient.getCurrentUserId(), itemId, {
      ExcludeFields: 'Chapters,MediaSources,MediaStreams,People,Overview'
    }).then(function (item) {
      _playbackmanager.default.playTrailers(item);
    });
  }
  function processGeneralCommand(cmd, apiClient) {
    // Full list
    // https://github.com/MediaBrowser/MediaBrowser/blob/master/MediaBrowser.Model/Session/GeneralCommand.cs#L23
    //console.log('Received command: ' + cmd.Name);

    switch (cmd.Name) {
      case 'Select':
        _inputmanager.default.trigger('select');
        return;
      case 'Back':
        _inputmanager.default.trigger('back');
        return;
      case 'MoveUp':
        _inputmanager.default.trigger('up');
        return;
      case 'MoveDown':
        _inputmanager.default.trigger('down');
        return;
      case 'MoveLeft':
        _inputmanager.default.trigger('left');
        return;
      case 'MoveRight':
        _inputmanager.default.trigger('right');
        return;
      case 'PageUp':
        _inputmanager.default.trigger('pageup');
        return;
      case 'PageDown':
        _inputmanager.default.trigger('pagedown');
        return;
      case 'PlayTrailers':
        playTrailers(apiClient, cmd.Arguments.ItemId);
        break;
      case 'SetRepeatMode':
        _playbackmanager.default.setRepeatMode(cmd.Arguments.RepeatMode);
        break;
      case 'SetSleepTimer':
        _playbackmanager.default.setSleepTimer(cmd.Arguments || {});
        break;
      case 'TriggerTranscodingFallback':
        _playbackmanager.default.triggerTranscodingFallback();
        break;
      case 'SetShuffle':
        var shuffle = cmd.Arguments.Shuffle;
        _playbackmanager.default.setShuffle(shuffle === true || (shuffle || '').toString().toLowerCase() === 'true');
        break;
      case 'SetSubtitleOffset':
        _playbackmanager.default.setSubtitleOffset(parseFloat(cmd.Arguments.SubtitleOffset));
        break;
      case 'IncrementSubtitleOffset':
        _playbackmanager.default.incrementSubtitleOffset(parseFloat(cmd.Arguments.Increment));
        break;
      case 'SetPlaybackRate':
        _playbackmanager.default.setPlaybackRate(parseFloat(cmd.Arguments.PlaybackRate));
        break;
      case 'VolumeUp':
        _inputmanager.default.trigger('volumeup');
        return;
      case 'VolumeDown':
        _inputmanager.default.trigger('volumedown');
        return;
      case 'ChannelUp':
        _inputmanager.default.trigger('channelup');
        return;
      case 'ChannelDown':
        _inputmanager.default.trigger('channeldown');
        return;
      case 'Mute':
        _inputmanager.default.trigger('mute');
        return;
      case 'Unmute':
        _inputmanager.default.trigger('unmute');
        return;
      case 'ToggleMute':
        _inputmanager.default.trigger('togglemute');
        return;
      case 'SetVolume':
        notifyApp();
        _playbackmanager.default.setVolume(cmd.Arguments.Volume);
        break;
      case 'SetAudioStreamIndex':
        notifyApp();
        _playbackmanager.default.setAudioStreamIndex(parseInt(cmd.Arguments.Index));
        break;
      case 'SetSubtitleStreamIndex':
        notifyApp();
        _playbackmanager.default.setSubtitleStreamIndex(parseInt(cmd.Arguments.Index), null, cmd.Arguments.RefreshMediaSource === 'true');
        break;
      case 'SetCurrentPlaylistItem':
        notifyApp();
        _playbackmanager.default.setCurrentPlaylistItem(cmd.Arguments.PlaylistItemId);
        break;
      case 'MovePlaylistItem':
        notifyApp();
        _playbackmanager.default.movePlaylistItem(cmd.Arguments.PlaylistItemId, parseInt(cmd.Arguments.NewIndex));
        break;
      case 'RemoveFromPlaylist':
        notifyApp();
        _playbackmanager.default.removeFromPlaylist(cmd.Arguments.PlaylistItemIds.split(','));
        break;
      case 'ToggleFullscreen':
        _inputmanager.default.trigger('togglefullscreen');
        return;
      case 'GoHome':
        _inputmanager.default.trigger('home');
        return;
      case 'GoToSettings':
        _inputmanager.default.trigger('settings');
        return;
      case 'DisplayContent':
        displayContent(cmd, apiClient);
        break;
      case 'GoToSearch':
        _inputmanager.default.trigger('search');
        return;
      case 'DisplayMessage':
        displayMessage(cmd);
        break;
      case 'ToggleOsd':
        // todo
        break;
      case 'ToggleContextMenu':
        // todo
        break;
      case 'TakeScreenShot':
        // todo
        break;
      case 'SendKey':
        // todo
        break;
      case 'SendString':
        // todo
        _focusmanager.default.sendText(cmd.Arguments.String);
        break;
      default:
        console.log('processGeneralCommand does not recognize: ' + cmd.Name);
        break;
    }
    notifyApp();
  }
  var AppSupportsSync = _servicelocator.appHost.supports('sync');
  function onMessageReceived(e, msg) {
    var apiClient = this;
    var messageType = msg.MessageType;
    switch (messageType) {
      case 'Play':
        {
          // notify the app so that if the screensaver is showing it will be hidden
          notifyApp();
          var serverId = apiClient.serverId();
          if (msg.Data.PlayCommand === "PlayNext") {
            _playbackmanager.default.queueNext({
              ids: msg.Data.ItemIds,
              serverId: serverId
            });
          } else if (msg.Data.PlayCommand === "PlayLast") {
            _playbackmanager.default.queue({
              ids: msg.Data.ItemIds,
              serverId: serverId
            });
          } else {
            _playbackmanager.default.play({
              ids: msg.Data.ItemIds,
              startPositionTicks: msg.Data.StartPositionTicks,
              mediaSourceId: msg.Data.MediaSourceId,
              audioStreamIndex: msg.Data.AudioStreamIndex,
              subtitleStreamIndex: msg.Data.SubtitleStreamIndex,
              startIndex: msg.Data.StartIndex,
              serverId: serverId,
              shuffle: msg.Data.PlayCommand === "PlayShuffle"
            });
          }
          break;
        }
      case 'Playstate':
        {
          // notify the app so that if the screensaver is showing it will be hidden
          notifyApp();
          if (msg.Data.Command === 'Stop') {
            _inputmanager.default.trigger('stop');
          } else if (msg.Data.Command === 'Pause') {
            _inputmanager.default.trigger('pause');
          } else if (msg.Data.Command === 'Unpause') {
            _inputmanager.default.trigger('play');
          } else if (msg.Data.Command === 'PlayPause') {
            _inputmanager.default.trigger('playpause');
          } else if (msg.Data.Command === 'Seek') {
            _playbackmanager.default.seek(msg.Data.SeekPositionTicks);
          } else if (msg.Data.Command === 'SeekRelative') {
            _playbackmanager.default.seekRelative(msg.Data.SeekPositionTicks);
          } else if (msg.Data.Command === 'NextTrack') {
            _inputmanager.default.trigger('next');
          } else if (msg.Data.Command === 'PreviousTrack') {
            _inputmanager.default.trigger('previous');
          }
          break;
        }
      case 'GeneralCommand':
        {
          var cmd = msg.Data;
          processGeneralCommand(cmd, apiClient);
          break;
        }
      case 'UserDataChanged':
        {
          if (msg.Data.UserId === apiClient.getCurrentUserId()) {
            var userDataList = msg.Data.UserDataList;
            for (var i = 0, length = userDataList.length; i < length; i++) {
              _events.default.trigger(serverNotifications, 'UserDataChanged', [apiClient, userDataList[i], msg.Data]);
            }
          }
          break;
        }
      case 'SyncJobItemReady':
      case 'SyncJobItemsReady':
        {
          syncNow();
          break;
        }
      case 'SyncJobCancelled':
      case 'SyncJobItemCancelled':
        {
          syncNow();
          _events.default.trigger(serverNotifications, messageType, [apiClient, msg.Data]);
          break;
        }
      case 'ServerShuttingDown':
      case 'ServerRestarting':
        {
          if (_servicelocator.appHost.supports('remotecontrol')) {
            _playbackmanager.default.setDefaultPlayerActive();
          }
          _events.default.trigger(serverNotifications, messageType, [apiClient, msg.Data]);
          break;
        }
      default:
        _events.default.trigger(serverNotifications, messageType, [apiClient, msg.Data]);
        break;
    }
  }
  function syncNow() {
    if (!AppSupportsSync) {
      return;
    }
    Emby.importModule('./modules/common/servicelocator.js').then(function (serviceLocator) {
      serviceLocator.localSync.sync();
    });
  }
  function bindEvents(apiClient) {
    _events.default.off(apiClient, "message", onMessageReceived);
    _events.default.on(apiClient, "message", onMessageReceived);
  }
  _connectionmanager.default.getApiClients().forEach(bindEvents);
  _events.default.on(_connectionmanager.default, 'apiclientcreated', function (e, newApiClient) {
    bindEvents(newApiClient);
  });
  var _default = _exports.default = serverNotifications;
});
