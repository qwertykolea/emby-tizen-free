define(["exports", "./../modules/common/globalize.js", "./../modules/emby-elements/emby-input/emby-input.js", "./../modules/emby-elements/emby-button/emby-button.js", "./../modules/emby-elements/emby-checkbox/emby-checkbox.js", "./../modules/emby-elements/emby-select/emby-select.js", "./../modules/emby-elements/emby-scroller/emby-scroller.js", "./../modules/emby-elements/emby-dialogclosebutton/emby-dialogclosebutton.js", "./../modules/layoutmanager.js", "./../modules/loading/loading.js", "./../modules/dialoghelper/dialoghelper.js", "./../modules/common/pluginmanager.js", "./../modules/common/responsehelper.js"], function (_exports, _globalize, _embyInput, _embyButton, _embyCheckbox, _embySelect, _embyScroller, _embyDialogclosebutton, _layoutmanager, _loading, _dialoghelper, _pluginmanager, _responsehelper) {
  Object.defineProperty(_exports, "__esModule", {
    value: true
  });
  _exports.default = void 0;
  /* jshint module: true */

  function onSubmit(e) {
    _loading.default.show();
    var apiClient = this.options.apiClient;
    apiClient.saveUserNotification(getEntry(this)).then(onSubmitted.bind(this));
    e.preventDefault();
    return false;
  }
  function showToast(options) {
    return Emby.importModule('./modules/toast/toast.js').then(function (toast) {
      return toast(options);
    });
  }
  function onTestSuccess() {
    _loading.default.hide();
    showToast(_globalize.default.translate('NotificationSent'));
  }
  function onTestFail(response) {
    _loading.default.hide();
    _responsehelper.default.handleErrorResponse(response);
  }
  function sendEntryTest() {
    var instance = this;
    var apiClient = instance.options.apiClient;
    _loading.default.show();
    apiClient.sendTestUserNotification(getEntry(instance)).then(onTestSuccess, onTestFail);
  }
  function getEntry(instance) {
    var entry = Object.assign({}, instance.options.entry);
    var dlg = instance.dlg;
    instance.options.entryFormEditor.setObjectValues(dlg, entry);
    entry.GroupItems = dlg.querySelector('.chkGroupItems').checked;
    entry.UserIds = dlg.querySelector('.selectUser').getValues();
    entry.LibraryIds = dlg.querySelector('.selectLibrary').getValues();
    entry.DeviceIds = dlg.querySelector('.selectDevices').getValues();
    entry.EventIds = Array.prototype.map.call(dlg.querySelectorAll('.chkSubEvent:checked'), function (c) {
      return c.getAttribute('data-id');
    });
    return entry;
  }
  function onSubmitted() {
    _loading.default.hide();
    this.submitted = true;
    _dialoghelper.default.close(this.dlg);
  }
  function getEventHtml(info, entry) {
    var html = '';
    html += '<div class="checkboxList">';
    html += '<div style="margin-bottom:1em;">';
    html += '<label>';
    var isTopEventEnabled;
    var events = info.Events;
    var categoryId = info.Id;
    for (var i = 0, length = events.length; i < length; i++) {
      var currentEvent = events[i];
      var eventId = currentEvent.Id;
      if (entry.EventIds.includes(eventId)) {
        isTopEventEnabled = true;
        break;
      }
    }
    var isChecked = isTopEventEnabled;
    var checkedAttribute = isChecked ? ' checked="checked"' : '';
    html += '<input type="checkbox" is="emby-checkbox" class="chkEvent" data-id="' + categoryId + '"' + checkedAttribute + ' />';
    html += '<span>' + info.Name + '</span>';
    html += '</label>';
    for (var _i = 0, _length = events.length; _i < _length; _i++) {
      var _currentEvent = events[_i];
      var _eventId = _currentEvent.Id;
      isChecked = entry.EventIds.includes(_eventId);
      checkedAttribute = isChecked ? ' checked="checked"' : '';
      html += '<label style="margin: .35em 2.5em;"><input type="checkbox" is="emby-checkbox" class="chkSubEvent" data-categoryid="' + categoryId + '" data-id="' + _eventId + '" ' + checkedAttribute + ' />';
      html += '<span class="flex" style="white-space:nowrap;">';
      html += '<div>';
      html += _currentEvent.Name;
      html += '</div>';
      html += '</span>';
      html += '</label>';
    }
    if (categoryId === 'library') {
      html += "\n            <div class=\"checkboxContainer fldGroupItems hide\" style=\"margin: 1em 2.5em 2em;\">\n                <label>\n                    <input type=\"checkbox\" is=\"emby-checkbox\" class=\"chkGroupItems\" />\n                    <span>" + _globalize.default.translate('GroupNotificationsBySeriesOrAlbum') + "</span>\n                </label>\n            </div>\n        ";
    }
    html += '</div>';
    html += '</div>';
    return html;
  }
  function setSubEventsChecked(page, eventId, checked) {
    var elems = page.querySelectorAll('.chkSubEvent[data-categoryid="' + eventId + '"]');
    for (var i = 0, length = elems.length; i < length; i++) {
      elems[i].checked = checked;
    }
  }
  function setEventCheckedIfNeeded(page, eventId) {
    var elem = page.querySelector('.chkEvent[data-id="' + eventId + '"]');
    if (!elem) {
      return;
    }
    var elems = page.querySelectorAll('.chkSubEvent[data-categoryid="' + eventId + '"]');
    if (!elems.length) {
      return;
    }
    var numChecked = 0;
    var numUnchecked = 0;
    for (var i = 0, length = elems.length; i < length; i++) {
      if (elems[i].checked) {
        numChecked++;
      } else {
        numUnchecked++;
      }
    }
    if (numChecked || numChecked === elems.length) {
      elem.checked = true;
    } else if (numUnchecked === elems.length) {
      elem.checked = false;
    }
  }
  function onEventChange(e) {
    var target = e.target;
    var view = this.dlg;
    if (target.classList.contains('chkEvent')) {
      setSubEventsChecked(view, target.getAttribute('data-id'), target.checked);
    } else if (target.classList.contains('chkSubEvent')) {
      setEventCheckedIfNeeded(view, target.getAttribute('data-categoryid'));
    }
  }
  function EntryEditor() {}
  function onClosed() {
    var _this$options;
    if ((_this$options = this.options) != null && (_this$options = _this$options.entryFormEditor) != null && _this$options.destroy) {
      this.options.entryFormEditor.destroy();
    }
    this.options = null;
    this.dlg = null;
    if (this.submitted) {
      return Promise.resolve();
    }
    return Promise.reject();
  }
  function fillData(instance, entry, dlg, apiClient) {
    instance.options.entryFormEditor.setFormValues(dlg, entry);
    dlg.querySelector('.chkGroupItems').checked = entry.GroupItems || false;
    fillUserSelect(entry, dlg, apiClient);
    fillSelectLibrary(entry, dlg, apiClient);
    fillSelectDevices(entry, dlg, apiClient);
  }
  function getUsers(query) {
    var apiClient = this;
    query = Object.assign({
      SortBy: 'SortName',
      SortOrder: 'Ascending',
      EnableImages: false
    }, query);
    return apiClient.getUsersQueryResult(query);
  }
  function fillUserSelect(entry, dlg, apiClient) {
    var selectUser = dlg.querySelector('.selectUser');
    selectUser.getItems = getUsers.bind(apiClient);
    selectUser.values = entry.UserIds || [];
  }
  function getDevices(query) {
    var apiClient = this;
    query = Object.assign({}, query);
    return apiClient.getDevices(query);
  }
  function getLibraries(query) {
    var apiClient = this;
    query = Object.assign({
      SortBy: 'SortName',
      SortOrder: 'Ascending',
      EnableImages: false
    }, query);
    return apiClient.getVirtualFolders(query);
  }
  function fillSelectDevices(entry, dlg, apiClient) {
    var selectDevices = dlg.querySelector('.selectDevices');
    selectDevices.getItems = getDevices.bind(apiClient);
    selectDevices.values = entry.DeviceIds || [];
  }
  function fillSelectLibrary(entry, dlg, apiClient) {
    var selectLibrary = dlg.querySelector('.selectLibrary');
    selectLibrary.getItems = getLibraries.bind(apiClient);
    selectLibrary.setAttribute('data-id-property', 'Guid');
    selectLibrary.values = entry.LibraryIds || [];
  }
  function initDialogContent(instance, dlg, options, isNew) {
    dlg.querySelector('.eventList').innerHTML = options.eventTypes.map(function (i) {
      return getEventHtml(i, options.entry);
    }).join('');
    var onEventChangeHandler = onEventChange.bind(instance);
    var selectEventList = dlg.querySelector('.eventList');
    selectEventList.addEventListener('change', onEventChangeHandler);
    dlg.querySelector('.btnSubmit').innerHTML = isNew ? _globalize.default.translate('AddNotification') : _globalize.default.translate('Save');
    fillData(instance, options.entry, dlg, options.apiClient);
    onEventChangeHandler({
      target: selectEventList
    });
    dlg.querySelector('form').addEventListener('submit', onSubmit.bind(instance));
    dlg.querySelector('.btnSendTest').addEventListener('click', sendEntryTest.bind(instance));
    if (options.apiClient.isMinServerVersion('4.8.0.45')) {
      dlg.querySelector('.fldDevices').classList.remove('hide');
    }
    if (options.apiClient.isMinServerVersion('4.8.4')) {
      dlg.querySelector('.fldGroupItems').classList.remove('hide');
    }
    options.apiClient.getUser(options.userId).then(function (user) {
      if (user.Policy.IsAdministrator) {
        dlg.querySelector('.fldSelectUser').classList.remove('hide');
      } else {
        dlg.querySelector('.fldSelectUser').classList.add('hide');
      }
    });
  }
  EntryEditor.prototype.show = function (options) {
    var dialogOptions = {
      removeOnClose: true,
      scrollY: false
    };
    if (_layoutmanager.default.tv) {
      dialogOptions.size = 'fullscreen';
    } else {
      dialogOptions.size = 'small';
    }
    var dlg = _dialoghelper.default.createDialog(dialogOptions);
    dlg.classList.add('formDialog');
    this.options = options;
    this.dlg = dlg;
    var instance = this;
    return require(['text!settings/notificationeditor.template.html']).then(function (responses) {
      var isNew = options.entry.Id == null;
      var template = responses[0];
      dlg.innerHTML = _globalize.default.translateDocument(template);
      dlg.querySelector('.formDialogHeaderTitle').innerHTML = isNew ? _globalize.default.translate('AddNotification') : _globalize.default.translate('EditNotification');
      var stringsPromise = options.entry.PluginId ? _pluginmanager.default.loadServerPluginTranslations(options.apiClient, options.entry.PluginId) : Promise.resolve();
      return stringsPromise.then(function () {
        return options.entryFormEditor.loadTemplate(dlg.querySelector('.entryFormElements')).then(function () {
          initDialogContent(instance, dlg, options, isNew);
          return _dialoghelper.default.open(dlg).then(onClosed.bind(instance));
        });
      });
    });
  };
  var _default = _exports.default = EntryEditor;
});
