define(["exports", "./../approuter.js", "./../dom.js", "./../common/globalize.js", "./../common/datetime.js", "./../emby-apiclient/connectionmanager.js", "./../layoutmanager.js", "./../dialoghelper/dialoghelper.js", "./../emby-elements/emby-button/emby-button.js", "./../emby-elements/emby-input/emby-input.js", "./../emby-elements/emby-select/emby-select.js", "./../emby-elements/emby-dialogclosebutton/emby-dialogclosebutton.js", "./../common/usersettings/usersettings.js", "./../common/methodtimer.js", "./../registrationservices/registrationservices.js", "./../loading/loading.js", "./../emby-elements/emby-itemscontainer/emby-itemscontainer.js", "./../listview/listview.js"], function (_exports, _approuter, _dom, _globalize, _datetime, _connectionmanager, _layoutmanager, _dialoghelper, _embyButton, _embyInput, _embySelect, _embyDialogclosebutton, _usersettings, _methodtimer, _registrationservices, _loading, _embyItemscontainer, _listview) {
  Object.defineProperty(_exports, "__esModule", {
    value: true
  });
  _exports.default = void 0;
  /* jshint module: true */

  require(['formDialogStyle']);
  function showActionSheet(options) {
    return Emby.importModule('./modules/actionsheet/actionsheet.js').then(function (ActionSheet) {
      return ActionSheet.show(options);
    });
  }
  function showToast(options) {
    return Emby.importModule('./modules/toast/toast.js').then(function (toast) {
      return toast(options);
    });
  }
  function getChannelsItems(query) {
    var apiClient = this;
    query = Object.assign({
      UserId: apiClient.getCurrentUserId(),
      EnableUserData: false
    }, query);
    _usersettings.default.addLiveTvChannelSortingToQuery(query, _globalize.default);
    return apiClient.getLiveTvChannels(query);
  }
  function updateTimerFromForm(form, timerInfo) {
    var _form$querySelector$v, _form$querySelector$v2;
    var dlg = form.closest('.recordingDialog');
    timerInfo.Name = form.querySelector('.txtName').value;
    timerInfo.StartDate = (_form$querySelector$v = form.querySelector('.txtStartTime').valueAsDateUtc) == null ? void 0 : _form$querySelector$v.toISOString();
    timerInfo.EndDate = (_form$querySelector$v2 = form.querySelector('.txtEndTime').valueAsDateUtc) == null ? void 0 : _form$querySelector$v2.toISOString();
    var recurring = form.querySelector('.selectFrequency').value === 'recurring';
    var creatingSeries = recurring || dlg.timerType === 'Keyword';
    if (creatingSeries) {
      timerInfo.Days = form.querySelector('.selectAirDays').getValues();
      timerInfo.ChannelIds = form.querySelector('.selectChannel').getValues();
    } else {
      timerInfo.ChannelId = form.querySelector('.selectChannel').singleValue;
    }
    if (dlg.timerType === 'Keyword') {
      var keywords = [];
      var keywordValue = form.querySelector('.txtKeyword').value;
      if (keywordValue) {
        keywords.push({
          KeywordType: form.querySelector('.selectKeywordType').value,
          Keyword: form.querySelector('.txtKeyword').value
        });
      }
      timerInfo.Keywords = keywords;
      timerInfo.RecordAnyTime = true;
      timerInfo.Recurring = recurring;
      timerInfo.RecordNewOnly = false;
    }
    return creatingSeries;
  }
  function onFormSubmit(e) {
    e.preventDefault();
    var form = this;
    _loading.default.show();
    var dlg = form.closest('.recordingDialog');
    var apiClient = dlg.item ? _connectionmanager.default.getApiClient(dlg.item) : _connectionmanager.default.getApiClient(dlg.options.serverId);
    apiClient.getNewLiveTvTimerDefaults({}).then(function (defaults) {
      var timerInfo = Object.assign(defaults, {});
      var creatingSeries = updateTimerFromForm(form, timerInfo);
      var promise = creatingSeries ? apiClient.createLiveTvSeriesTimer(timerInfo) : apiClient.createLiveTvTimer(timerInfo);
      promise.then(function () {
        _loading.default.hide();
        showToast(_globalize.default.translate('RecordingScheduled'));
        _dialoghelper.default.close(dlg);
      });
    });

    // Disable default form submission
    return false;
  }
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
  function getAirDaysItems(query) {
    var date = new Date();
    while (date.getDay() > 0) {
      date.setDate(date.getDate() - 1);
    }
    var days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    var items = [];
    for (var i = 0, length = days.length; i < length; i++) {
      items.push({
        Id: days[i],
        Name: _datetime.default.toLocaleDateString(date, {
          weekday: 'long'
        })
      });
      date.setDate(date.getDate() + 1);
    }
    if (query.Ids) {
      items = items.filter(function (item) {
        return query.Ids.includes(item.Id);
      });
    }
    var totalRecordCount = items.length;
    items = items.slice(query.StartIndex || 0);
    if (query.StartIndex && items.length > query.StartIndex) {
      items.length = query.StartIndex;
    }
    return Promise.resolve({
      TotalRecordCount: totalRecordCount,
      Items: items
    });
  }
  function onFrequencyChange(e) {
    var dlg = this.closest('.recordingDialog');
    var fldAirDays = dlg.querySelector('.fldAirDays');
    if (this.value === 'recurring' || dlg.timerType === 'Keyword') {
      fldAirDays.classList.remove('hide');
    } else {
      fldAirDays.classList.add('hide');
    }
  }
  function getPreviewListOptions() {
    return {
      renderer: _listview.default,
      options: {
        enableUserDataButtons: false,
        image: true,
        mediaInfo: false,
        imageSize: 'smaller',
        moreButton: false,
        recordButton: false,
        draggable: false,
        draggableXActions: false,
        multiSelect: false,
        hoverPlayButton: false,
        fields: ['ParentName', 'Name', 'StartToEndDateTime', 'ChannelName'],
        action: 'none',
        playQueueIndicator: false
      }
    };
  }
  var PreviewLimit = 20;
  function getPreviewItems(query) {
    var info = this;
    var context = info.context;
    var apiClient = info.apiClient;
    var dlg = context;
    if (dlg.timerType !== 'Keyword') {
      return Promise.resolve({
        Items: [],
        TotalRecordCount: 0
      });
    }
    if (!apiClient.isMinServerVersion('4.8.0.11')) {
      return Promise.resolve({
        Items: [],
        TotalRecordCount: 0
      });
    }
    var timerInfo = {};
    updateTimerFromForm(dlg, timerInfo);
    var keywords = timerInfo.Keywords;
    if (!keywords.length) {
      return Promise.resolve({
        Items: [],
        TotalRecordCount: 0
      });
    }
    var channelIds = timerInfo.ChannelIds || (timerInfo.ChannelId ? [timerInfo.ChannelId] : []);
    return apiClient.getLiveTvPrograms(Object.assign({
      ChannelIds: channelIds.join(','),
      UserId: apiClient.getCurrentUserId(),
      HasAired: false,
      SortBy: "StartDate",
      ImageTypeLimit: 1,
      EnableUserData: false,
      Fields: 'PrimaryImageAspectRatio',
      Limit: PreviewLimit,
      AirDays: timerInfo.Days && timerInfo.Days.length ? timerInfo.Days : null,
      RecordingKeyword: keywords[0].Keyword,
      RecordingKeywordType: keywords[0].KeywordType
    }, query));
  }
  function afterRefresh(result) {
    this.querySelector('.previewCountText').innerHTML = _globalize.default.translate('ResultsRangeValue', 1, result.Items.length, result.TotalRecordCount);
  }
  function initDialog(context, apiClient, item, timerType) {
    var selectChannel = context.querySelector('.selectChannel');
    selectChannel.getItems = getChannelsItems.bind(apiClient);
    context.querySelector('.selectAirDays').getItems = getAirDaysItems;
    var selectFrequency = context.querySelector('.selectFrequency');
    if (timerType === 'DateTime') {
      context.querySelector('.fldChannel').classList.remove('hide');
      context.querySelector('.fldStartTime').classList.remove('hide');
      context.querySelector('.fldEndTime').classList.remove('hide');
      selectChannel.setAttribute('required', 'required');
      selectChannel.removeAttribute('multiple');
      selectChannel.setAttribute('label', _globalize.default.translate('Channel'));
      var txtStartTime = context.querySelector('.txtStartTime');
      txtStartTime.setAttribute('required', 'required');
      txtStartTime.addEventListener('change', onStartTimeChanged);
      var txtEndTime = context.querySelector('.txtEndTime');
      txtEndTime.setAttribute('required', 'required');
      startMinStartTimeTimer(context);
      onMinStartTimeTimer.call(context);
      selectChannel.singleValue = (item == null ? void 0 : item.Id) || '';
    } else if (timerType === 'Keyword') {
      context.querySelector('.fldChannel').classList.remove('hide');
      context.querySelector('.fldKeyword').classList.remove('hide');
      context.querySelector('.txtKeyword').setAttribute('required', 'required');
      context.querySelector('.fldKeywordType').classList.remove('hide');
      context.querySelector('.selectKeywordType').setAttribute('required', 'required');
      context.querySelector('.txtKeyword').setAttribute('required', 'required');
      selectFrequency.value = 'recurring';
      if (item) {
        selectChannel.values = [item.Id];
      } else {
        selectChannel.values = [];
      }
    }
    var itemsContainer = context.querySelector('.previewitemsContainer');
    itemsContainer.fetchData = getPreviewItems.bind({
      timerType: timerType,
      apiClient: apiClient,
      context: context
    });
    itemsContainer.getListOptions = getPreviewListOptions;
    itemsContainer.parentContainer = itemsContainer.closest('.previewContainer');
    itemsContainer.afterRefresh = afterRefresh.bind(context);
    selectFrequency.addEventListener('change', onFrequencyChange);
    context.querySelector('.selectAirDays').values = [];
    context.querySelector('form').addEventListener('submit', onFormSubmit);
    onFrequencyChange.call(selectFrequency);
  }
  function onItemsContainerUpgraded() {
    this.resume({
      refresh: true
    });
  }
  function onValueChange(e) {
    var target = e.target;
    if (target.classList.contains('txtName')) {
      return;
    }
    var itemsContainer = this.querySelector('.itemsContainer');
    itemsContainer.notifyRefreshNeeded(true);
  }
  function onOpened() {
    var itemsContainer = this.querySelector('.itemsContainer');
    if (itemsContainer.resume) {
      onItemsContainerUpgraded.call(itemsContainer);
    } else {
      _dom.default.addEventListener(itemsContainer, 'upgraded', onItemsContainerUpgraded, {
        once: true
      });
    }
  }
  function showRecordingDialog(item, options, timerType) {
    return require(['text!modules/recordingcreator/channelrecording.template.html']).then(function (responses) {
      var dialogOptions = {
        removeOnClose: true
      };
      if (_layoutmanager.default.tv) {
        dialogOptions.size = 'fullscreen';
      } else {
        dialogOptions.size = 'small';
      }
      var dlg = _dialoghelper.default.createDialog(dialogOptions);
      dlg.classList.add('formDialog');
      dlg.classList.add('recordingDialog');
      dlg.timerType = timerType;
      dlg.item = item;
      dlg.options = options;
      dlg.innerHTML = _globalize.default.translateDocument(responses[0], 'sharedcomponents');
      var apiClient = item ? _connectionmanager.default.getApiClient(item) : _connectionmanager.default.getApiClient(options.serverId);
      initDialog(dlg, apiClient, item, timerType);
      dlg.addEventListener('opened', onOpened);
      dlg.addEventListener('change', onValueChange);
      return _dialoghelper.default.open(dlg).then(function () {
        stopMinStartTimeTimer(dlg);
        dlg.item = null;
        dlg.options = null;
        dlg.timerType = null;
      });
    });
  }
  function createManualRecordingFromChannel(item, options) {
    return showRecordingDialog(item, options, 'DateTime');
  }
  function createManualRecordingFromKeyword(item, options) {
    return showRecordingDialog(item, options, 'Keyword');
  }
  function createRecordingForChannelInternal(item, options) {
    // https://what-when-how.com/windows-vista/windows-media-center-record-tv/
    var items = [];
    items.push({
      name: _globalize.default.translate('Guide'),
      id: 'guide',
      icon: 'dvr'
    });
    items.push({
      name: _globalize.default.translate('Search'),
      id: 'search',
      icon: 'search'
    });
    items.push({
      name: _globalize.default.translate('HeaderChannelAndTime'),
      id: 'time',
      icon: 'live_tv'
    });
    items.push({
      name: _globalize.default.translate('Keyword'),
      id: 'keyword',
      icon: 'text_fields'
    });
    return showActionSheet({
      items: items,
      title: _globalize.default.translate('HeaderCreateRecording'),
      text: _globalize.default.translate('LabelRecordProgramOrSeriesFrom'),
      positionTo: options.positionTo,
      positionY: 'bottom',
      positionX: 'after',
      hasItemIcon: true
    }).then(function (typeId) {
      if (typeId === 'guide') {
        _approuter.default.showGuide();
      } else if (typeId === 'search') {
        _approuter.default.showSearch();
      } else if (typeId === 'time') {
        return createManualRecordingFromChannel(item, options);
      } else if (typeId === 'keyword') {
        return createManualRecordingFromKeyword(item, options);
      }
    });
  }
  function createRecordingForChannel(item, options) {
    return _registrationservices.default.validateFeature('dvr', {
      viewOnly: true
    }).then(function () {
      return createRecordingForChannelInternal(item, options);
    });
  }
  var _default = _exports.default = {
    createRecordingForChannel: createRecordingForChannel
  };
});
