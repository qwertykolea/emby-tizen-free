define(["exports", "./../modules/common/itemmanager/itemmanager.js", "./../modules/common/itemmanager/genericitemcontroller.js", "./../modules/emby-apiclient/connectionmanager.js", "./../modules/common/globalize.js", "./notificationeditor.js", "./../modules/common/pluginmanager.js"], function (_exports, _itemmanager, _genericitemcontroller, _connectionmanager, _globalize, _notificationeditor, _pluginmanager) {
  Object.defineProperty(_exports, "__esModule", {
    value: true
  });
  _exports.default = void 0;
  /* jshint module: true */

  function getSetupModuleUrl(url, apiClient) {
    return _pluginmanager.default.getConfigurationResourceUrl(url);
  }
  function UserNotificationController() {
    _genericitemcontroller.default.apply(this, arguments);
  }
  Object.assign(UserNotificationController.prototype, _genericitemcontroller.default.prototype);
  UserNotificationController.prototype.getTypeNames = function () {
    return ['UserNotification'];
  };
  UserNotificationController.prototype.getDisplayName = function (item, options) {
    return item.FriendlyName || item.ServiceName;
  };
  UserNotificationController.prototype.getDefaultIcon = function (item) {
    return '&#xe7f4;';
  };
  UserNotificationController.prototype.canDelete = function (item, user) {
    return true;
  };
  UserNotificationController.prototype.canEdit = function (items, user) {
    return items.length === 1;
  };
  UserNotificationController.prototype.isDeletePrimaryCommand = function (itemType) {
    return true;
  };
  UserNotificationController.prototype.getDeleteMessages = function () {
    return {
      single: {
        text: 'DeleteNotificationConfirmation',
        title: _globalize.default.translate('DeleteNotification'),
        confirmText: _globalize.default.translate('Delete')
      },
      plural: {
        text: 'DeleteNotificationConfirmation',
        title: _globalize.default.translate('DeleteNotification'),
        confirmText: _globalize.default.translate('Delete')
      }
    };
  };
  UserNotificationController.prototype.deleteItemsInternal = function (options) {
    var item = options.items[0];
    var apiClient = _connectionmanager.default.getApiClient(item);
    return apiClient.deleteUserNotifications(options.items);
  };
  UserNotificationController.prototype.editItems = function (items, options) {
    var item = items[0];
    var apiClient = _connectionmanager.default.getApiClient(item);
    return apiClient.getNotificationTypes({
      userId: item.UserId
    }).then(function (allEventTypes) {
      return require([getSetupModuleUrl(item.SetupModuleUrl, apiClient)]).then(function (responses) {
        var EntryFormEditor = responses[0];
        var entryFormEditor = EntryFormEditor.setFormValues ? EntryFormEditor : new EntryFormEditor({
          apiClient: apiClient
        });
        return new _notificationeditor.default().show({
          entry: item,
          apiClient: apiClient,
          eventTypes: allEventTypes,
          entryFormEditor: entryFormEditor,
          userId: item.UserId
        });
      });
    });
  };
  var instance = new UserNotificationController();
  _itemmanager.default.registerItemController(instance);
  var _default = _exports.default = instance;
});
