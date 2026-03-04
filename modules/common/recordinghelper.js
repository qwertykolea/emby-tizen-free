define(["exports", "./../emby-apiclient/connectionmanager.js", "./../loading/loading.js", "./globalize.js", "./itemmanager/itemmanager.js"], function (_exports, _connectionmanager, _loading, _globalize, _itemmanager) {
  Object.defineProperty(_exports, "__esModule", {
    value: true
  });
  _exports.default = void 0;
  /* jshint module: true */

  function showDialog(options) {
    return Emby.importModule('./modules/dialog/dialog.js').then(function (dialog) {
      return dialog(options);
    });
  }
  function showToast(options) {
    return Emby.importModule('./modules/toast/toast.js').then(function (toast) {
      return toast(options);
    });
  }
  function changeRecordingToSeries(apiClient, timerId, programId, confirmTimerCancellation) {
    _loading.default.show();
    return apiClient.getItem(apiClient.getCurrentUserId(), programId).then(function (item) {
      if (item.IsSeries) {
        // create series
        return apiClient.getNewLiveTvTimerDefaults({
          programId: programId
        }).then(function (timerDefaults) {
          return apiClient.createLiveTvSeriesTimer(timerDefaults).then(function () {
            _loading.default.hide();
            showToast(_globalize.default.translate('SeriesRecordingScheduled'));
          });
        });
      } else {
        // cancel 
        return cancelTimer(apiClient, timerId, confirmTimerCancellation).then(function (result) {
          _loading.default.hide();
          return Promise.resolve(result);
        });
      }
    });
  }
  function cancelTimer(apiClient, timerId, confirm) {
    return _itemmanager.default.deleteItems({
      items: [{
        Id: timerId,
        ServerId: apiClient.serverId(),
        Type: 'Timer'
      }],
      confirm: confirm === true,
      navigate: false
    });
  }
  function createRecording(apiClient, programId, isSeries) {
    _loading.default.show();
    return apiClient.getNewLiveTvTimerDefaults({
      programId: programId
    }).then(function (item) {
      var promise = isSeries ? apiClient.createLiveTvSeriesTimer(item) : apiClient.createLiveTvTimer(item);
      return promise.then(function () {
        _loading.default.hide();
        showToast(_globalize.default.translate('RecordingScheduled'));
      });
    });
  }
  function showMultiCancellationPrompt(serverId, programId, timerId, timerStatus, seriesTimerId) {
    var items = [];
    items.push({
      name: _globalize.default.translate('HeaderKeepRecording'),
      id: 'cancel',
      type: 'submit'
    });
    if (timerStatus === 'InProgress') {
      items.push({
        name: _globalize.default.translate('HeaderStopRecording'),
        id: 'canceltimer',
        type: 'cancel'
      });
    } else {
      items.push({
        name: _globalize.default.translate('HeaderCancelRecording'),
        id: 'canceltimer',
        type: 'cancel'
      });
    }
    items.push({
      name: _globalize.default.translate('HeaderCancelSeries'),
      id: 'cancelseriestimer',
      type: 'cancel'
    });
    return showDialog({
      text: _globalize.default.translate('MessageConfirmRecordingCancellation'),
      buttons: items
    }).then(function (result) {
      var apiClient = _connectionmanager.default.getApiClient(serverId);
      if (result === 'canceltimer') {
        _loading.default.show();
        return cancelTimer(apiClient, timerId, true);
      } else if (result === 'cancelseriestimer') {
        _loading.default.show();
        return apiClient.cancelLiveTvSeriesTimer(seriesTimerId).then(function () {
          showToast(_globalize.default.translate('SeriesCancelled'));
          _loading.default.hide();
        });
      } else {
        return Promise.resolve();
      }
    });
  }
  function toggleRecording(serverId, programId, timerId, timerStatus, seriesTimerId) {
    var apiClient = _connectionmanager.default.getApiClient(serverId);
    var hasTimer = timerId && timerStatus !== 'Cancelled';
    if (seriesTimerId && hasTimer) {
      // cancel 
      return showMultiCancellationPrompt(serverId, programId, timerId, timerStatus, seriesTimerId);
    } else if (hasTimer && programId) {
      // change to series recording, if possible
      // otherwise cancel individual recording
      return changeRecordingToSeries(apiClient, timerId, programId, true);
    } else if (programId) {
      // schedule recording
      return createRecording(apiClient, programId);
    } else {
      return Promise.reject();
    }
  }
  var _default = _exports.default = {
    cancelTimer: cancelTimer,
    createRecording: createRecording,
    changeRecordingToSeries: changeRecordingToSeries,
    toggleRecording: toggleRecording
  };
});
