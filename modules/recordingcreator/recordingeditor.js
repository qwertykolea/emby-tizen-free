define(["exports", "./../common/globalize.js", "./../loading/loading.js", "./../emby-apiclient/connectionmanager.js", "./../emby-elements/emby-button/emby-button.js", "./../emby-elements/emby-input/emby-input.js", "./../emby-elements/emby-select/emby-select.js", "./../common/methodtimer.js"], function (_exports, _globalize, _loading, _connectionmanager, _embyButton, _embyInput, _embySelect, _methodtimer) {
  Object.defineProperty(_exports, "__esModule", {
    value: true
  });
  _exports.default = void 0;
  /* jshint module: true */

  require(['css!modules/recordingcreator/recordingcreator.css', 'material-icons', 'flexStyles']);
  var currentItemId;
  var currentServerId;
  function setMinMaxDateTimeLocal(field, prop, minTime) {
    field.minDateTimeLocal = minTime;
  }
  function onStartTimeChanged() {
    var form = this.closest('form');
    var txtStartTime = this;
    var txtEndTime = form.querySelector('.txtEndTime');
    var minTime = txtStartTime.valueAsNumberUtc || Date.now();
    minTime += 60000;
    setMinMaxDateTimeLocal(txtEndTime, 'min', minTime);
    var currentEndTime = txtEndTime.valueAsNumberUtc;
    if (!currentEndTime || txtEndTime.valueAsNumberUtc <= minTime) {
      minTime += 60000 * 29;
      txtEndTime.valueAsNumberUtc = Math.max(txtEndTime.valueAsNumberUtc || minTime, minTime);
    }
  }
  function onMinStartTimeTimer() {
    var context = this;
    var minTime = Date.now();
    var txtStartTime = context.querySelector('.txtStartTime');
    if (txtStartTime === document.activeElement) {
      return;
    }
    setMinMaxDateTimeLocal(txtStartTime, 'min', minTime);
    txtStartTime.valueAsNumberUtc = Math.max(txtStartTime.valueAsNumberUtc || minTime, minTime);
    onStartTimeChanged.call(txtStartTime);
  }
  function startMinStartTimeTimer(context) {
    context.minStartTimeTimer = new _methodtimer.default({
      onInterval: onMinStartTimeTimer.bind(context),
      timeoutMs: 30000,
      type: 'interval'
    });
  }
  function stopMinStartTimeTimer(context) {
    if (context.minStartTimeTimer) {
      context.minStartTimeTimer.destroy();
      context.minStartTimeTimer = null;
    }
  }
  function renderTimer(context, item, apiClient) {
    context.querySelector('.txtPrePaddingMinutes').value = item.PrePaddingSeconds / 60;
    context.querySelector('.txtPostPaddingMinutes').value = item.PostPaddingSeconds / 60;
    var txtStartTime = context.querySelector('.txtStartTime');
    var txtEndTime = context.querySelector('.txtEndTime');
    if (item.TimerType === 'DateTime') {
      context.querySelector('.fldStartTime').classList.remove('hide');
      context.querySelector('.fldEndTime').classList.remove('hide');
      txtStartTime.setAttribute('required', 'required');
      txtEndTime.setAttribute('required', 'required');
      txtStartTime.valueAsNumberUtc = Date.parse(item.StartDate);
      txtEndTime.valueAsNumberUtc = Date.parse(item.EndDate);
    } else {
      context.querySelector('.fldStartTime').classList.add('hide');
      context.querySelector('.fldEndTime').classList.add('hide');
      txtStartTime.removeAttribute('required');
      txtEndTime.removeAttribute('required');
    }
    _loading.default.hide();
  }
  function onSubmit(e) {
    var form = this;
    var apiClient = _connectionmanager.default.getApiClient(currentServerId);
    apiClient.getLiveTvTimer(currentItemId).then(function (item) {
      item.PrePaddingSeconds = form.querySelector('.txtPrePaddingMinutes').value * 60;
      item.PostPaddingSeconds = form.querySelector('.txtPostPaddingMinutes').value * 60;
      if (item.TimerType === 'DateTime') {
        var _form$querySelector$v, _form$querySelector$v2;
        item.StartDate = (_form$querySelector$v = form.querySelector('.txtStartTime').valueAsDateUtc) == null ? void 0 : _form$querySelector$v.toISOString();
        item.EndDate = (_form$querySelector$v2 = form.querySelector('.txtEndTime').valueAsDateUtc) == null ? void 0 : _form$querySelector$v2.toISOString();
      }
      apiClient.updateLiveTvTimer(item);
    });
    e.preventDefault();

    // Disable default form submission
    return false;
  }
  function init(context, apiClient) {
    var txtStartTime = context.querySelector('.txtStartTime');
    txtStartTime.addEventListener('change', onStartTimeChanged);
    startMinStartTimeTimer(context);
    onMinStartTimeTimer.call(context);
    context.querySelector('form').addEventListener('submit', onSubmit);
  }
  function reload(context, id) {
    var apiClient = _connectionmanager.default.getApiClient(currentServerId);
    _loading.default.show();
    if (typeof id === 'string') {
      currentItemId = id;
      apiClient.getLiveTvTimer(id).then(function (result) {
        renderTimer(context, result, apiClient);
        _loading.default.hide();
      });
    } else if (id) {
      currentItemId = id.Id;
      renderTimer(context, id, apiClient);
      _loading.default.hide();
    }
  }
  function onFieldChange(e) {
    this.querySelector('.btnSubmit').click();
  }
  function RecordingEditor() {}
  RecordingEditor.prototype.embed = function (itemId, serverId, options) {
    currentServerId = serverId;
    _loading.default.show();
    if (!options) {
      options = {};
    }
    this.options = options;
    require(['text!modules/recordingcreator/recordingeditor.template.html'], function (template) {
      var dlg = options.context;
      dlg.innerHTML = _globalize.default.translateDocument(template, 'sharedcomponents');
      dlg.removeEventListener('change', onFieldChange);
      dlg.addEventListener('change', onFieldChange);
      dlg.classList.remove('hide');
      var apiClient = _connectionmanager.default.getApiClient(serverId);
      init(dlg, apiClient);
      reload(dlg, itemId);
    });
  };
  RecordingEditor.prototype.pause = function () {
    var options = this.options;
    if (options) {
      stopMinStartTimeTimer(options.context);
    }
  };
  RecordingEditor.prototype.destroy = function () {
    this.pause();
  };
  var _default = _exports.default = RecordingEditor;
});
