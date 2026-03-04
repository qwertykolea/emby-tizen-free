define(["exports", "./../list/list.js", "./../modules/common/globalize.js", "./../modules/emby-elements/emby-button/emby-button.js", "./../modules/emby-elements/emby-button/paper-icon-button-light.js", "./../modules/emby-elements/emby-scroller/emby-scroller.js", "./../modules/approuter.js", "./../modules/layoutmanager.js", "./../modules/common/servicelocator.js", "./notificationeditor.js", "./../modules/common/pluginmanager.js", "./usernotificationcontroller.js"], function (_exports, _list, _globalize, _embyButton, _paperIconButtonLight, _embyScroller, _approuter, _layoutmanager, _servicelocator, _notificationeditor, _pluginmanager, _usernotificationcontroller) {
  Object.defineProperty(_exports, "__esModule", {
    value: true
  });
  _exports.default = void 0;
  /* jshint module: true */

  require(['flexStyles']);
  function showActionSheet(options) {
    return Emby.importModule('./modules/actionsheet/actionsheet.js').then(function (ActionSheet) {
      return ActionSheet.show(options);
    });
  }
  function getConfiguredNotifications(instance) {
    var apiClient = instance.getApiClient();
    return apiClient.getJSON(apiClient.getUrl('Notifications/Services/Configured', {
      UserId: instance.getUserId()
    }));
  }
  function getEventTypes(instance) {
    return instance.getApiClient().getNotificationTypes({
      userId: instance.getUserId()
    });
  }
  function mapService(service) {
    if (!service.Icon) {
      service.Icon = 'notifications';
    }
    return service;
  }
  function getService(services, id) {
    return services.filter(function (i) {
      return i.Id === id;
    })[0];
  }
  function getSetupModuleUrl(url, apiClient) {
    return _pluginmanager.default.getConfigurationResourceUrl(url);
  }
  function getDefaultEntry(instance, service) {
    var apiClient = instance.getApiClient();
    return apiClient.getJSON(apiClient.getUrl('Notifications/Services/Defaults', {
      UserId: instance.getUserId(),
      NotifierKey: service.Id
    }));
  }
  function addEntryWithService(instance, service) {
    getEventTypes(instance).then(function (allEventTypes) {
      getDefaultEntry(instance, service).then(function (entry) {
        var apiClient = instance.getApiClient();
        require([getSetupModuleUrl(entry.SetupModuleUrl, apiClient)], function (EntryFormEditor) {
          var entryFormEditor = EntryFormEditor.setFormValues ? EntryFormEditor : new EntryFormEditor({
            apiClient: apiClient
          });
          new _notificationeditor.default().show({
            entry: entry,
            apiClient: apiClient,
            eventTypes: allEventTypes,
            entryFormEditor: entryFormEditor,
            userId: instance.getUserId()
          });
        });
      });
    });
  }
  function showNewItemDialog(e) {
    var instance = this;
    var apiClient = instance.getApiClient();
    return apiClient.getJSON(apiClient.getUrl('Notifications/Services', {
      UserId: instance.getUserId()
    })).then(function (services) {
      return apiClient.getCurrentUser().then(function (currentUser) {
        var bottomText = currentUser.Policy.IsAdministrator && _servicelocator.appHost.supports('serversetup') ? _globalize.default.translate('ForAdditionalNotificationOptions', '<a href="' + _approuter.default.getRouteUrl('PluginCatalog') + '" is="emby-linkbutton" class="button-link">', '</a>') : _globalize.default.translate('ForAdditionalNotificationOptions', '', '');
        return showActionSheet({
          positionTo: e.target.closest('button'),
          positionY: 'bottom',
          items: services.map(mapService),
          title: _globalize.default.translate('AddNotification'),
          bottomText: bottomText,
          hasItemIcon: true
        }).then(function (id) {
          var service = getService(services, id);
          addEntryWithService(instance, service);
        });
      });
    });
  }
  function UserNotificationsView(view, params) {
    this.enableAlphaNumericShortcuts = false;
    this.enableTotalRecordCountDisplay = false;
    this.hasOtherViewButtons = true;
    this.supportsViewSettings = false;
    _list.default.apply(this, arguments);
    addNewItemButton(this, view);
    view.querySelector('.btnAddItem').addEventListener('click', showNewItemDialog.bind(this));
    this.itemsContainer.setAttribute('data-monitor', 'UserNotifications');
  }
  Object.assign(UserNotificationsView.prototype, _list.default.prototype);
  UserNotificationsView.prototype.supportsAlphaPicker = function () {
    return false;
  };
  UserNotificationsView.prototype.getEmptyListMessage = function () {
    return Promise.resolve('');
  };
  function addNewItemButton(instance, view) {
    var container = view.querySelector('.itemsViewSettingsContainer');
    container.classList.add('itemsViewSettingsContainer-align-start', 'readOnlyContent');
    var sibling = view.querySelector('.listTotalRecordCount');
    sibling.insertAdjacentHTML('afterend', '<div><p style="margin-top:0;">' + _globalize.default.translate('NotificationsDescription') + '</p><button is="emby-button" type="button" class="itemsViewSettingsContainer-button raised raised-mini btnAddItem submit" title="' + _globalize.default.translate('AddNotification') + '" aria-label="' + _globalize.default.translate('AddNotification') + '"><i class="md-icon button-icon button-icon-left">&#xe145;</i><span class="emby-button-text">' + _globalize.default.translate('AddNotification') + '</span></button></div>');
    instance.itemsContainer.classList.add('readOnlyContent');
  }
  UserNotificationsView.prototype.setTitle = function () {

    // handled by appheader
  };
  function normalizeItem(instance, item, allEventTypes) {
    item.Type = 'UserNotification';
    item.ServerId = instance.getApiClient().serverId();
    var eventIds = item.EventIds || [];
    var events = allEventTypes.filter(function (eventInfo) {
      var subEvents = eventInfo.Events.filter(function (subEvent) {
        return eventIds.includes(subEvent.Id);
      });
      if (!subEvents.length) {
        return false;
      }
      return true;
    });
    item.EventNames = events.map(function (eventInfo) {
      return eventInfo.Name;
    }).join(', ');
  }
  function normalizeItems(instance, items, allEventTypes) {
    for (var i = 0, length = items.length; i < length; i++) {
      var item = items[i];
      normalizeItem(instance, item, allEventTypes);
    }
  }
  UserNotificationsView.prototype.getItemTypes = function () {
    return ['UserNotification'];
  };
  UserNotificationsView.prototype.getItems = function (query) {
    var instance = this;
    return getConfiguredNotifications(instance).then(function (notifications) {
      return getEventTypes(instance).then(function (allEventTypes) {
        normalizeItems(instance, notifications, allEventTypes);
        return Promise.resolve({
          Items: notifications,
          TotalRecordCount: notifications.length
        });
      });
    });
  };
  UserNotificationsView.prototype.getSettingsKey = function () {
    return 'usernotifications';
  };
  UserNotificationsView.prototype.getBaseListRendererOptions = function () {
    var options = _list.default.prototype.getBaseListRendererOptions.apply(this, arguments);

    // disable to allow selecting and copying the text
    options.draggable = false;
    options.draggableXActions = true;
    options.action = _layoutmanager.default.tv ? 'menu' : 'edit';
    return options;
  };
  UserNotificationsView.prototype.getCardOptions = function (items, settings) {
    var options = _list.default.prototype.getCardOptions.apply(this, arguments);
    options.fields.push('Name', 'EventNames');
    return options;
  };
  UserNotificationsView.prototype.getListViewOptions = function (items, settings) {
    var options = _list.default.prototype.getListViewOptions.apply(this, arguments);
    options.enableDefaultIcon = true;
    options.defaultBackground = false;
    options.deleteButton = true;
    options.moreButton = false;
    options.largeHeading = true;
    options.buttonCommands = ['edit', 'delete'];
    options.fields.push('ServiceName', 'FriendlyName', 'EventNames');
    var index = options.fields.indexOf('Name');
    if (index > -1) {
      options.fields.splice(index, 1);
    }
    return options;
  };
  UserNotificationsView.prototype.getUserId = function () {
    return this.params.userId || this.getApiClient().getCurrentUserId();
  };
  UserNotificationsView.prototype.getViewSettingDefaults = function () {
    var viewSettings = _list.default.prototype.getViewSettingDefaults.apply(this, arguments);
    viewSettings.imageType = 'list';
    return viewSettings;
  };
  var _default = _exports.default = UserNotificationsView;
});
