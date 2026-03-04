define(["exports", "./../globalize.js", "./playbackmanager.js", "./../../emby-apiclient/connectionmanager.js", "./../../actionsheet/actionsheet.js", "./../qualityoptions.js", "./../dataformatter.js"], function (_exports, _globalize, _playbackmanager, _connectionmanager, _actionsheet, _qualityoptions, _dataformatter) {
  Object.defineProperty(_exports, "__esModule", {
    value: true
  });
  _exports.default = void 0;
  /* jshint module: true */

  function showQualityMenu(player, options) {
    var videoStream = _playbackmanager.default.currentMediaSource(player).MediaStreams.filter(function (stream) {
      return stream.Type === "Video";
    })[0];
    var videoWidth = videoStream ? videoStream.Width : null;
    var availableQualityOptions = _qualityoptions.default.getVideoQualityOptions({
      currentMaxBitrate: _playbackmanager.default.getMaxStreamingBitrate(player),
      isAutomaticBitrateEnabled: _playbackmanager.default.enableAutomaticBitrateDetection(player),
      videoWidth: videoWidth,
      enableAuto: true
    });
    var menuItems = availableQualityOptions.map(function (o) {
      var opt = {
        name: o.name,
        id: o.bitrate,
        asideText: o.secondaryText
      };
      if (o.selected) {
        opt.selected = true;
      }
      return opt;
    });
    var selectedId = availableQualityOptions.filter(function (o) {
      return o.selected;
    });
    selectedId = selectedId.length ? selectedId[0].bitrate : null;
    return _actionsheet.default.show({
      items: menuItems,
      positionTo: options.positionTo,
      positionX: options.positionX,
      positionY: options.positionY,
      transformOrigin: options.transformOrigin,
      noTextWrap: options.noTextWrap,
      title: _globalize.default.translate('Quality'),
      hasItemSelectionState: true
    }).then(function (id) {
      var bitrate = parseInt(id);
      if (bitrate !== selectedId) {
        _playbackmanager.default.setMaxStreamingBitrate({
          enableAutomaticBitrateDetection: bitrate ? false : true,
          maxBitrate: bitrate
        }, player);
      }
    });
  }
  function showSpeedMenu(options) {
    var menuItems = [];
    var player = options.player;
    var currentValue = _playbackmanager.default.getPlaybackRate(player);
    var values = [0.25, 0.5, 0.75, 1, 1.25, 1.5, 1.75, 2];
    for (var i = 0, length = values.length; i < length; i++) {
      var value = values[i];
      menuItems.push({
        name: value === 1 ? _globalize.default.translate('Normal') : numberToString(value) + 'x',
        id: value.toString(),
        selected: currentValue === value
      });
    }
    return _actionsheet.default.show({
      items: menuItems,
      positionTo: options.positionTo,
      positionX: options.positionX,
      positionY: options.positionY,
      transformOrigin: options.transformOrigin,
      noTextWrap: options.noTextWrap,
      title: _globalize.default.translate('PlaybackSpeed'),
      hasItemSelectionState: true
    }).then(function (result) {
      if (result) {
        _playbackmanager.default.setPlaybackRate(result, player);
      }
    });
  }
  function showRepeatModeMenu(player, options) {
    var menuItems = [];
    var currentValue = _playbackmanager.default.getRepeatMode(player);
    menuItems.push({
      name: _globalize.default.translate('RepeatAll'),
      id: 'RepeatAll',
      selected: currentValue === 'RepeatAll',
      asideIcon: '&#xe040;'
    });
    menuItems.push({
      name: _globalize.default.translate('RepeatOne'),
      id: 'RepeatOne',
      selected: currentValue === 'RepeatOne',
      asideIcon: '&#xe041;'
    });
    menuItems.push({
      name: _globalize.default.translate('None'),
      id: 'RepeatNone',
      selected: currentValue === 'RepeatNone'
    });
    return _actionsheet.default.show({
      items: menuItems,
      positionTo: options.positionTo,
      positionX: options.positionX,
      positionY: options.positionY,
      transformOrigin: options.transformOrigin,
      noTextWrap: options.noTextWrap,
      title: _globalize.default.translate('HeaderRepeatMode'),
      hasItemSelectionState: true,
      hasItemAsideIcon: true
    }).then(function (mode) {
      if (mode) {
        _playbackmanager.default.setRepeatMode(mode, player);
      }
    });
  }
  function getQualitySecondaryText(player) {
    var videoStream = _playbackmanager.default.currentMediaSource(player).MediaStreams.filter(function (stream) {
      return stream.Type === "Video";
    })[0];
    var videoWidth = videoStream ? videoStream.Width : null;
    var options = _qualityoptions.default.getVideoQualityOptions({
      currentMaxBitrate: _playbackmanager.default.getMaxStreamingBitrate(player),
      isAutomaticBitrateEnabled: _playbackmanager.default.enableAutomaticBitrateDetection(player),
      videoWidth: videoWidth,
      enableAuto: true
    });
    var selectedOption = options.filter(function (o) {
      return o.selected;
    });
    if (!selectedOption.length) {
      return null;
    }
    selectedOption = selectedOption[0];
    var text = selectedOption.name;
    if (selectedOption.autoText) {
      var state = _playbackmanager.default.getPlayerState(player);
      if (state.PlayState && state.PlayState.PlayMethod !== 'Transcode') {
        text += ' - Direct';
      } else {
        text += ' ' + selectedOption.autoText;
      }
    }
    return text;
  }
  function showAspectRatioMenu(player, options) {
    // Each has name/id
    var currentId = _playbackmanager.default.getAspectRatio(player);
    var menuItems = _playbackmanager.default.getSupportedAspectRatios(player).map(function (i) {
      return {
        id: i.id,
        name: i.name,
        selected: i.id === currentId
      };
    });
    return _actionsheet.default.show({
      items: menuItems,
      positionTo: options.positionTo,
      positionX: options.positionX,
      positionY: options.positionY,
      transformOrigin: options.transformOrigin,
      noTextWrap: options.noTextWrap,
      title: _globalize.default.translate('HeaderAspectRatio'),
      hasItemSelectionState: true
    }).then(function (id) {
      if (id) {
        _playbackmanager.default.setAspectRatio(id, player);
        return Promise.resolve();
      }
      return Promise.reject();
    });
  }
  function numberToString(value) {
    try {
      return new Intl.NumberFormat(_globalize.default.getCurrentLocales(), {
        style: 'decimal'
      }).format(value);
    } catch (err) {
      console.error('Error in NumberFormat: ', err);
      return value;
    }
  }
  function showWithUser(options, player, user) {
    var supportedCommands = _playbackmanager.default.getSupportedCommands(player);
    var menuItems = [];
    if (options.mediaType === 'Video' && supportedCommands.indexOf('SetAspectRatio') !== -1) {
      var currentAspectRatioId = _playbackmanager.default.getAspectRatio(player);
      var currentAspectRatio = _playbackmanager.default.getSupportedAspectRatios(player).filter(function (i) {
        return i.id === currentAspectRatioId;
      })[0];
      menuItems.push({
        name: _globalize.default.translate('HeaderAspectRatio'),
        id: 'aspectratio',
        asideText: currentAspectRatio ? currentAspectRatio.name : null
      });
    }
    var currentMediaSource = _playbackmanager.default.currentMediaSource(player);
    if (options.mediaType === 'Video' && user && user.Policy.EnableVideoPlaybackTranscoding && currentMediaSource && currentMediaSource.SupportsTranscoding && supportedCommands.indexOf('SetMaxStreamingBitrate') !== -1) {
      var secondaryQualityText = getQualitySecondaryText(player);
      menuItems.push({
        name: _globalize.default.translate('Quality'),
        id: 'quality',
        asideText: secondaryQualityText
      });
    }
    if (options.mediaType === 'Video' && supportedCommands.indexOf('SetRepeatMode') !== -1 && currentMediaSource.RunTimeTicks) {
      var repeatMode = _playbackmanager.default.getRepeatMode(player);
      menuItems.push({
        name: _globalize.default.translate('HeaderRepeatMode'),
        id: 'repeatmode',
        asideText: repeatMode === 'RepeatNone' ? _globalize.default.translate('None') : _globalize.default.translate('' + repeatMode)
      });
    }
    if (supportedCommands.indexOf('SetPlaybackRate') !== -1 && currentMediaSource.RunTimeTicks && options.speed !== false) {
      var rate = _playbackmanager.default.getPlaybackRate(player);
      menuItems.push({
        name: _globalize.default.translate('PlaybackSpeed'),
        id: 'speed',
        asideText: rate === 1 ? _globalize.default.translate('Normal') : numberToString(rate)
      });
    }
    if (options.mediaType === 'Audio' && supportedCommands.indexOf('SetSleepTimer') !== -1) {
      var mode = _playbackmanager.default.getSleepTimerMode(player);
      var asideText;
      switch (mode) {
        case 'AtTime':
          asideText = _dataformatter.default.formatRelativeTime(_playbackmanager.default.getSleepTimerEndTime(player), false);
          break;
        case 'AfterItem':
          asideText = _globalize.default.translate('AfterCurrentItem');
          break;
      }
      menuItems.push({
        name: _globalize.default.translate('HeaderSleepTimer'),
        id: 'sleeptimer',
        asideText: asideText
      });
    }
    if (options.mediaType === 'Video' && supportedCommands.indexOf('TriggerTranscodingFallback') !== -1 && _playbackmanager.default.canTriggerTranscodingFallback(player)) {
      menuItems.push({
        name: _globalize.default.translate('HeaderPlaybackCorrection'),
        id: 'triggertranscodingfallback',
        asideText: null
      });
    }
    if (player.isLocalPlayer && options.stats !== false) {
      menuItems.push({
        name: _globalize.default.translate('StatsForNerds'),
        id: 'stats',
        asideText: null
      });
    }
    if (_playbackmanager.default.getCurrentPlaylistLength(player) > 1) {
      menuItems.push({
        name: _globalize.default.translate('HeaderSavePlayQueueToPlaylist'),
        id: 'saveplayqueue',
        asideText: null
      });
    }
    if (options.more) {
      menuItems.push({
        name: _globalize.default.translate('More'),
        id: 'more',
        asideText: null
      });
    }
    return _actionsheet.default.show({
      items: menuItems,
      positionTo: options.positionTo,
      positionX: options.positionX,
      positionY: options.positionY,
      transformOrigin: options.transformOrigin,
      noTextWrap: options.noTextWrap,
      hasItemAsideText: true
    }).then(function (id) {
      return handleSelectedOption(id, options, player);
    });
  }
  function isValidForPlaylist(i) {
    return i.Id && i.ServerId;
  }
  function savePlayQueue(player) {
    return Emby.importModule('./modules/addtolist/addtolist.js').then(function (AddToList) {
      _playbackmanager.default.getPlaylist(player).then(function (result) {
        var items = result.Items.filter(isValidForPlaylist);
        if (!items.length) {
          // alert can't save
          return;
        }
        new AddToList().show({
          items: items,
          enableAddToPlayQueue: false,
          defaultValue: 'new',
          type: 'Playlist'
        });
      });
    });
  }
  function show(options) {
    var player = options.player;
    var currentItem = _playbackmanager.default.currentItem(player);
    if (!currentItem || !currentItem.ServerId) {
      return showWithUser(options, player, null);
    }
    var apiClient = _connectionmanager.default.getApiClient(currentItem.ServerId);
    return apiClient.getCurrentUser().then(function (user) {
      return showWithUser(options, player, user);
    });
  }
  function showSleepTimerMenu(options) {
    return Emby.importModule('./modules/common/playback/sleeptimermenu.js').then(function (SleepTimerMenu) {
      return SleepTimerMenu.show(options);
    });
  }
  function handleSelectedOption(id, options, player) {
    switch (id) {
      case 'quality':
        return showQualityMenu(player, options);
      case 'aspectratio':
        return showAspectRatioMenu(player, options);
      case 'repeatmode':
        return showRepeatModeMenu(player, options);
      case 'speed':
        return showSpeedMenu(options);
      case 'saveplayqueue':
        return savePlayQueue(player);
      case 'sleeptimer':
        return showSleepTimerMenu(options);
      default:
        if (options.onOption) {
          options.onOption(id);
        }
        return Promise.resolve();
    }
  }
  var _default = _exports.default = {
    show: show,
    showSpeedMenu: showSpeedMenu,
    showSubMenu: handleSelectedOption
  };
});
