define(["exports", "./../common/globalize.js", "./../common/datetime.js", "./../loading/loading.js", "./../emby-apiclient/connectionmanager.js", "./../emby-elements/emby-toggle/emby-toggle.js", "./../emby-elements/emby-button/emby-button.js", "./../emby-elements/emby-input/emby-input.js", "./../emby-elements/emby-select/emby-select.js", "./../common/usersettings/usersettings.js"], function (_exports, _globalize, _datetime, _loading, _connectionmanager, _embyToggle, _embyButton, _embyInput, _embySelect, _usersettings) {
  Object.defineProperty(_exports, "__esModule", {
    value: true
  });
  _exports.default = void 0;
  /* jshint module: true */

  require(['css!modules/recordingcreator/recordingcreator.css', 'material-icons', 'flexStyles']);
  var currentItemId;
  var currentServerId;
  function onSkipEpisodesInLibraryChange() {
    var apiClient = _connectionmanager.default.getApiClient(currentServerId);
    var form = this.closest('form');
    if (this.checked && apiClient != null && apiClient.isMinServerVersion('4.8.4')) {
      form.querySelector('.fldCheckAllLibraries').classList.remove('hide');
    } else {
      form.querySelector('.fldCheckAllLibraries').classList.add('hide');
    }
  }
  function renderTimer(context, item, apiClient) {
    var timerType = item.TimerType || 'Program';
    if (timerType === 'Keyword') {
      context.querySelector('.fldKeyword').classList.remove('hide');
      context.querySelector('.txtKeyword').setAttribute('required', 'required');
      context.querySelector('.fldKeywordType').classList.remove('hide');
      context.querySelector('.selectKeywordType').setAttribute('required', 'required');
      context.querySelector('.txtKeyword').setAttribute('required', 'required');
      var keyword = (item.Keywords || [])[0] || {};
      context.querySelector('.selectKeywordType').value = keyword.KeywordType || 'Name';
      context.querySelector('.txtKeyword').value = keyword.Keyword || '';
    }
    if (timerType === 'Program') {
      context.querySelector('.fldAirTime').classList.remove('hide');
    }
    context.querySelector('.txtPrePaddingMinutes').value = item.PrePaddingSeconds / 60;
    context.querySelector('.txtPostPaddingMinutes').value = item.PostPaddingSeconds / 60;
    context.querySelector('.txtMaxRecordingLength').value = (item.MaxRecordingSeconds || 0) / 60;
    context.querySelector('.selectAirTime').value = item.RecordAnyTime ? 'any' : 'original';
    context.querySelector('.selectShowType').value = item.RecordNewOnly ? 'new' : 'all';
    context.querySelector('.chkSkipEpisodesInLibrary').checked = item.SkipEpisodesInLibrary;
    context.querySelector('.chkCheckAllLibraries').checked = item.MatchExistingItemsWithAnyLibrary || false;
    context.querySelector('.selectKeepUpTo').value = item.KeepUpTo || 0;

    // this shouldn't need to be checked, but seeing an error on 4.8. probably something missing from the backport
    if (item.StartDate) {
      context.querySelector('.optionAroundTime').innerHTML = _globalize.default.translate('AroundTime', _datetime.default.getDisplayTime(new Date(Date.parse(item.StartDate))));
    }
    context.querySelector('.selectAirDays').values = item.Days;
    context.querySelector('.selectChannels').values = item.RecordAnyChannel ? [] : item.ChannelIds || [];
    onSkipEpisodesInLibraryChange.call(context.querySelector('.chkSkipEpisodesInLibrary'));
    _loading.default.hide();
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
  function getChannelsItems(query) {
    var apiClient = this;
    query = Object.assign({
      UserId: apiClient.getCurrentUserId(),
      EnableUserData: false
    }, query);
    _usersettings.default.addLiveTvChannelSortingToQuery(query, _globalize.default);
    return apiClient.getLiveTvChannels(query);
  }
  function onSubmit(e) {
    var form = this;
    var apiClient = _connectionmanager.default.getApiClient(currentServerId);
    apiClient.getLiveTvSeriesTimer(currentItemId).then(function (item) {
      item.PrePaddingSeconds = form.querySelector('.txtPrePaddingMinutes').value * 60;
      item.PostPaddingSeconds = form.querySelector('.txtPostPaddingMinutes').value * 60;
      item.MaxRecordingSeconds = form.querySelector('.txtMaxRecordingLength').value * 60;
      item.RecordAnyTime = form.querySelector('.selectAirTime').value === 'any';
      item.RecordNewOnly = form.querySelector('.selectShowType').value === 'new';
      item.SkipEpisodesInLibrary = form.querySelector('.chkSkipEpisodesInLibrary').checked;
      item.MatchExistingItemsWithAnyLibrary = form.querySelector('.chkCheckAllLibraries').checked;
      item.KeepUpTo = form.querySelector('.selectKeepUpTo').value;
      item.Days = form.querySelector('.selectAirDays').getValues();
      item.RecordAnyChannel = form.querySelector('.selectChannels').getValues().length === 0;
      item.ChannelIds = form.querySelector('.selectChannels').getValues();
      if (item.TimerType) {
        item.ChannelId = null;
      } else {
        // legacy
        item.ChannelId = item.ChannelIds[0] || null;
      }
      if (item.TimerType === 'Keyword') {
        item.Keywords = [{
          KeywordType: form.querySelector('.selectKeywordType').value,
          Keyword: form.querySelector('.txtKeyword').value
        }];
      }
      apiClient.updateLiveTvSeriesTimer(item);
    });
    e.preventDefault();

    // Disable default form submission
    return false;
  }
  function init(context, apiClient) {
    fillKeepUpTo(context);
    context.querySelector('.selectAirDays').getItems = getAirDaysItems;
    context.querySelector('.selectChannels').getItems = getChannelsItems.bind(apiClient);
    context.querySelector('form').addEventListener('submit', onSubmit);
  }
  function reload(context, id) {
    var apiClient = _connectionmanager.default.getApiClient(currentServerId);
    _loading.default.show();
    if (typeof id === 'string') {
      currentItemId = id;
      apiClient.getLiveTvSeriesTimer(id).then(function (result) {
        renderTimer(context, result, apiClient);
        _loading.default.hide();
      });
    } else if (id) {
      currentItemId = id.Id;
      renderTimer(context, id, apiClient);
      _loading.default.hide();
    }
  }
  function fillKeepUpTo(context) {
    var html = '';
    for (var i = 0; i <= 50; i++) {
      var text = void 0;
      if (i === 0) {
        text = _globalize.default.translate('AsManyAsPossible');
      } else if (i === 1) {
        text = _globalize.default.translate('ValueOneEpisode');
      } else {
        text = _globalize.default.translate('ValueEpisodeCount', i);
      }
      html += '<option value="' + i + '">' + text + '</option>';
    }
    context.querySelector('.selectKeepUpTo').innerHTML = html;
  }
  function onFieldChange(e) {
    this.querySelector('.btnSubmit').click();
  }
  function embed(itemId, serverId, options) {
    currentServerId = serverId;
    _loading.default.show();
    if (!options) {
      options = {};
    }
    require(['text!modules/recordingcreator/seriesrecordingeditor.template.html'], function (template) {
      var dlg = options.context;
      dlg.innerHTML = _globalize.default.translateDocument(template, 'sharedcomponents');
      dlg.removeEventListener('change', onFieldChange);
      dlg.addEventListener('change', onFieldChange);
      dlg.classList.remove('hide');
      dlg.querySelector('.chkSkipEpisodesInLibrary').addEventListener('change', onSkipEpisodesInLibraryChange);
      var apiClient = _connectionmanager.default.getApiClient(serverId);
      init(dlg, apiClient);
      reload(dlg, itemId);
    });
  }
  var _default = _exports.default = {
    embed: embed
  };
});
