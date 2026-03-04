define(["exports", "./playbackmanager.js", "./../globalize.js", "./../../emby-apiclient/connectionmanager.js"], function (_exports, _playbackmanager, _globalize, _connectionmanager) {
  Object.defineProperty(_exports, "__esModule", {
    value: true
  });
  _exports.default = void 0;
  /* jshint module: true */

  function showActionSheet(options) {
    return Emby.importModule('./modules/actionsheet/actionsheet.js').then(function (ActionSheet) {
      return ActionSheet.show(options);
    });
  }
  function playFromRecordingStart(timer, options) {
    var apiClient = _connectionmanager.default.getApiClient(timer);
    return apiClient.getLiveTvRecordings({
      TimerId: timer.Id,
      IsInProgress: true
    }).then(function (result) {
      var recordingItem = result.Items.filter(function (i) {
        return i.TimerId === timer.Id;
      })[0];
      if (recordingItem) {
        return _playbackmanager.default.play({
          items: [recordingItem]
        });
      }
      return _playbackmanager.default.play(options);
    });
  }
  function promptUserToPlayActiveRecording(timer, displayItem, options) {
    var items = [];
    items.push({
      name: _globalize.default.translate('PlayFromLivePosition'),
      id: 'playlive',
      icon: '&#xe037;'
    });
    items.push({
      name: _globalize.default.translate('PlayFromStartOfRecording'),
      id: 'playrecording',
      icon: '&#xe037;'
    });

    //items.push({
    //    name: globalize.translate('Cancel'),
    //    id: 'cancel',
    //    type: 'cancel',
    //    icon: 'cancel'
    //});

    return showActionSheet({
      items: items,
      item: displayItem,
      text: _globalize.default.translate('ThisChannelIsActivelyRecording'),
      hasItemIcon: true,
      longPreview: true
    }).then(function (result) {
      if (result === 'playrecording') {
        return playFromRecordingStart(timer, options);
      }
      if (result === 'playlive') {
        return _playbackmanager.default.play(options);
      }

      // this should be blank or it should be an AbortError.
      // Anything else and consumers won't know it was cancelled and may treat it like an error
      if (options.cancelResult) {
        return Promise.reject(options.cancelResult);
      } else {
        return Promise.reject();
      }
    });
  }
  function playChannelWithActiveRecording(timer, displayItem, options) {
    var now = Date.now();
    if (now >= Date.parse(timer.StartDate) && now < Date.parse(timer.EndDate)) {
      return promptUserToPlayActiveRecording(timer, displayItem, options);
    }
    return _playbackmanager.default.play(options);
  }
  function playChannelWithTimerId(displayItem, timerId, options) {
    var apiClient = _connectionmanager.default.getApiClient(displayItem);
    return apiClient.getLiveTvTimer(timerId).then(function (timer) {
      return playChannelWithActiveRecording(timer, displayItem, options);
    });
  }
  function playProgram(item, options) {
    var timerId = item.TimerId;
    if (!timerId) {
      return _playbackmanager.default.play(options);
    }
    return playChannelWithTimerId(item, timerId, options);
  }
  function playChannel(item, options) {
    var _item$CurrentProgram;
    // todo: need a way to get the current recording if it's manual and not based on a program
    var timerId = (_item$CurrentProgram = item.CurrentProgram) == null ? void 0 : _item$CurrentProgram.TimerId;
    if (!timerId) {
      return _playbackmanager.default.play(options);
    }
    return playChannelWithTimerId(item.CurrentProgram || item, timerId, options);
  }
  function play(options) {
    var _options$items;
    if (((_options$items = options.items) == null ? void 0 : _options$items.length) === 1) {
      var item = options.items[0];
      switch (item.Type) {
        case 'TvChannel':
          return playChannel(item, options);
        case 'Program':
          return playProgram(item, options);
        default:
          break;
      }
    }
    return _playbackmanager.default.play(options);
  }
  var _default = _exports.default = {
    play: play
  };
});
