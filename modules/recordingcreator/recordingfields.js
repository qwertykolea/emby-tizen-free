define(["exports", "./../emby-apiclient/connectionmanager.js", "./../common/globalize.js", "./../loading/loading.js", "./../emby-apiclient/events.js", "./../emby-elements/emby-button/emby-button.js", "./../emby-elements/emby-button/paper-icon-button-light.js", "./../common/recordinghelper.js", "./../common/input/api.js"], function (_exports, _connectionmanager, _globalize, _loading, _events, _embyButton, _paperIconButtonLight, _recordinghelper, _api) {
  Object.defineProperty(_exports, "__esModule", {
    value: true
  });
  _exports.default = void 0;
  /* jshint module: true */

  require(['flexStyles']);
  function showToast(options) {
    return Emby.importModule('./modules/toast/toast.js').then(function (toast) {
      return toast(options);
    });
  }
  function loadData(parent, program) {
    if (program.IsSeries) {
      parent.querySelector('.seriesRecordingButton').classList.remove('hide');
      parent.querySelector('.btnManageSeriesRecording').classList.remove('hide');
    } else {
      parent.querySelector('.seriesRecordingButton').classList.add('hide');
      parent.querySelector('.btnManageSeriesRecording').classList.add('hide');
    }
    var btnManageSeriesRecording = parent.querySelector('.btnManageSeriesRecording');
    if (program.SeriesTimerId) {
      if (btnManageSeriesRecording) {
        btnManageSeriesRecording.classList.remove('hide');
      }
      parent.querySelector('.seriesRecordingButton .recordingIcon').classList.add('recordingIcon-active');
      parent.querySelector('.seriesRecordingButtonText').innerHTML = _globalize.default.translate('HeaderCancelSeries');
    } else {
      if (btnManageSeriesRecording) {
        btnManageSeriesRecording.classList.add('hide');
      }
      parent.querySelector('.seriesRecordingButton .recordingIcon').classList.remove('recordingIcon-active');
      parent.querySelector('.seriesRecordingButtonText').innerHTML = _globalize.default.translate('HeaderRecordSeries');
    }
    if (program.TimerId && program.Status !== 'Cancelled') {
      parent.querySelector('.btnManageRecording').classList.remove('hide');
      parent.querySelector('.singleRecordingButton .recordingIcon').classList.add('recordingIcon-active');
      if (program.Status === 'InProgress') {
        parent.querySelector('.singleRecordingButtonText').innerHTML = _globalize.default.translate('HeaderStopRecording');
      } else {
        parent.querySelector('.singleRecordingButtonText').innerHTML = _globalize.default.translate('HeaderDoNotRecord');
      }
    } else {
      parent.querySelector('.btnManageRecording').classList.add('hide');
      parent.querySelector('.singleRecordingButton .recordingIcon').classList.remove('recordingIcon-active');
      parent.querySelector('.singleRecordingButtonText').innerHTML = _globalize.default.translate('Record');
    }
  }
  function onDataFetched(item) {
    var options = this.options;
    options.program = item;
    loadData(options.parent, item);
  }
  function onTimerChangedExternally(e, apiClient, data) {
    var options = this.options;
    var refresh = false;
    if (data.Id) {
      if (options.program.TimerId === data.Id) {
        refresh = true;
      }
    }
    if (data.ProgramId && options) {
      if (options.program.Id === data.ProgramId) {
        refresh = true;
      }
    }
    if (refresh) {
      _events.default.trigger(this, 'recordingchanged');
    }
  }
  function onSeriesTimerChangedExternally(e, apiClient, data) {
    var options = this.options;
    var refresh = false;
    if (data.Id) {
      if (options.program.SeriesTimerId === data.Id) {
        refresh = true;
      }
    }
    if (data.ProgramId && options) {
      if (options.program.Id === data.ProgramId) {
        refresh = true;
      }
    }
    if (refresh) {
      _events.default.trigger(this, 'recordingchanged');
    }
  }
  function RecordingEditor(options) {
    this.options = options;
    this.embed();
    var timerChangedHandler = onTimerChangedExternally.bind(this);
    this.timerChangedHandler = timerChangedHandler;
    _events.default.on(_api.default, 'TimerCreated', timerChangedHandler);
    _events.default.on(_api.default, 'TimerCancelled', timerChangedHandler);
    var seriesTimerChangedHandler = onSeriesTimerChangedExternally.bind(this);
    this.seriesTimerChangedHandler = seriesTimerChangedHandler;
    _events.default.on(_api.default, 'SeriesTimerCreated', seriesTimerChangedHandler);
    _events.default.on(_api.default, 'SeriesTimerCancelled', seriesTimerChangedHandler);
  }
  function onRecordChange(e) {
    this.changed = true;
    var self = this;
    var options = this.options;
    var apiClient = _connectionmanager.default.getApiClient(options.program);
    var button = e.target.closest('BUTTON');
    var isChecked = !button.querySelector('i').classList.contains('recordingIcon-active');
    var hasEnabledTimer = options.program.TimerId && options.program.Status !== 'Cancelled';
    if (isChecked) {
      if (!hasEnabledTimer) {
        _loading.default.show();
        _recordinghelper.default.createRecording(apiClient, options.program.Id, false).then(function () {
          _events.default.trigger(self, 'recordingchanged');
        });
      }
    } else {
      if (hasEnabledTimer) {
        _recordinghelper.default.cancelTimer(apiClient, options.program.TimerId, true).then(function () {
          _events.default.trigger(self, 'recordingchanged');
        });
      }
    }
  }
  function onRecordSeriesChange(e) {
    this.changed = true;
    var self = this;
    var options = this.options;
    var apiClient = _connectionmanager.default.getApiClient(options.program);
    var button = e.target.closest('BUTTON');
    var isChecked = !button.querySelector('i').classList.contains('recordingIcon-active');
    if (isChecked) {
      options.parent.querySelector('.seriesRecordingButton').classList.remove('hide');
      options.parent.querySelector('.btnManageSeriesRecording').classList.remove('hide');
      if (!options.program.SeriesTimerId) {
        var promise = options.program.TimerId ? _recordinghelper.default.changeRecordingToSeries(apiClient, options.program.TimerId, options.program.Id) : _recordinghelper.default.createRecording(apiClient, options.program.Id, true);
        _loading.default.show();
        promise.then(function () {
          _events.default.trigger(self, 'seriesrecordingchanged');
        });
      }
    } else {
      if (options.program.SeriesTimerId) {
        _loading.default.show();
        apiClient.cancelLiveTvSeriesTimer(options.program.SeriesTimerId).then(function () {
          showToast(_globalize.default.translate('RecordingCancelled'));
          _events.default.trigger(self, 'seriesrecordingchanged');
        });
      }
    }
  }
  RecordingEditor.prototype.embed = function () {
    var self = this;
    var options = self.options;
    var context = options.parent;
    var singleRecordingButton = context.querySelector('.singleRecordingButton');
    if (!options.program.AsSeries) {
      singleRecordingButton.classList.remove('hide');
    }
    singleRecordingButton.addEventListener('click', onRecordChange.bind(self));
    context.querySelector('.seriesRecordingButton').addEventListener('click', onRecordSeriesChange.bind(self));
    onDataFetched.call(self, options.program);
  };
  RecordingEditor.prototype.hasChanged = function () {
    return this.changed;
  };
  RecordingEditor.prototype.refresh = function (item) {
    onDataFetched.call(this, item);
  };
  RecordingEditor.prototype.getProgram = function () {
    return this.options.program;
  };
  RecordingEditor.prototype.destroy = function () {
    var timerChangedHandler = this.timerChangedHandler;
    this.timerChangedHandler = null;
    _events.default.off(_api.default, 'TimerCreated', timerChangedHandler);
    _events.default.off(_api.default, 'TimerCancelled', timerChangedHandler);
    var seriesTimerChangedHandler = this.seriesTimerChangedHandler;
    this.seriesTimerChangedHandler = null;
    _events.default.off(_api.default, 'SeriesTimerCreated', seriesTimerChangedHandler);
    _events.default.off(_api.default, 'SeriesTimerCancelled', seriesTimerChangedHandler);
  };
  var _default = _exports.default = RecordingEditor;
});
