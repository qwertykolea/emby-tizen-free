define(["exports", "./baseitemcontroller.js", "./../globalize.js"], function (_exports, _baseitemcontroller, _globalize) {
  Object.defineProperty(_exports, "__esModule", {
    value: true
  });
  _exports.default = void 0;
  /* jshint module: true */

  function GenericItemController() {
    _baseitemcontroller.default.apply(this, arguments);
  }
  Object.assign(GenericItemController.prototype, _baseitemcontroller.default.prototype);
  GenericItemController.prototype.getTypeNames = function () {
    return ['GenericListItem'];
  };
  GenericItemController.prototype.getDisplayName = function (item, options) {
    return item.Name;
  };
  GenericItemController.prototype.isSingleItemFetchRequired = function (typeName) {
    return false;
  };
  GenericItemController.prototype.getDefaultIcon = function (item) {
    return item.Icon || 'folder';
  };
  GenericItemController.prototype.canDelete = function (item, user) {
    return item.CanDelete === true;
  };
  GenericItemController.prototype.getDeleteCommand = function (items) {
    var cmd = _baseitemcontroller.default.prototype.getDeleteCommand.apply(this, arguments);
    var item = items[0];
    if ((item == null ? void 0 : item.DeleteType) === 'remove') {
      cmd.name = _globalize.default.translate('Remove');
      cmd.icon = 'remove_circle';
    }
    return cmd;
  };
  GenericItemController.prototype.enableLibraryItemDeleteConfirmation = function () {
    return false;
  };
  GenericItemController.prototype.canRefreshMetadata = function (item, user) {
    return false;
  };
  GenericItemController.prototype.getNameSortOption = function (itemType) {
    return null;
  };
  GenericItemController.prototype.canAddToPlaylist = function (item) {
    return false;
  };
  GenericItemController.prototype.canAddToCollection = function (item, user) {
    return false;
  };
  GenericItemController.prototype.canConvert = function (item, user) {
    return false;
  };
  GenericItemController.prototype.canEdit = function (items, user) {
    return items.length === 1 && items[0].CanEdit === true;
  };
  GenericItemController.prototype.canRate = function (item) {
    return false;
  };
  GenericItemController.prototype.canMarkPlayed = function (item) {
    return false;
  };
  GenericItemController.prototype.canEditImages = function (item, user) {
    return false;
  };
  GenericItemController.prototype.canEditSubtitles = function (item, user) {
    return false;
  };
  GenericItemController.prototype.editItems = function (items, options) {
    return Promise.reject('nocommands');
  };
  GenericItemController.prototype.enableDeleteConfirmation = function (options) {
    if (!this.getDeleteMessages(options.items[0])) {
      return false;
    }
    return true;
  };
  GenericItemController.prototype.showDeleteConfirmation = function (options) {
    if (!this.enableDeleteConfirmation(options)) {
      return Promise.resolve();
    }
    return _baseitemcontroller.default.prototype.showDeleteConfirmation.apply(this, arguments);
  };
  GenericItemController.prototype.isDeletePrimaryCommand = function (itemType) {
    // allows display in multi-select, if enabled
    return true;
  };
  GenericItemController.prototype.getDeleteMessages = function (item) {
    if (item.DeleteType === 'remove') {
      return {
        single: {
          text: _globalize.default.translate('ConfirmRemoveItem'),
          title: _globalize.default.translate('Remove'),
          confirmText: _globalize.default.translate('Remove')
        },
        plural: {
          text: _globalize.default.translate('ConfirmRemoveItem'),
          title: _globalize.default.translate('Remove'),
          confirmText: _globalize.default.translate('Remove')
        }
      };
    }
    return {
      single: {
        text: _globalize.default.translate('DeleteDeviceConfirmation'),
        title: _globalize.default.translate('HeaderDeleteItem')
      },
      plural: {
        text: _globalize.default.translate('DeleteDeviceConfirmation'),
        title: _globalize.default.translate('HeaderDeleteItems')
      }
    };
  };
  GenericItemController.prototype.deleteItemsInternal = function (options) {
    return Promise.reject('nocommands');
  };
  GenericItemController.prototype.getCommands = function (options) {
    var commands = _baseitemcontroller.default.prototype.getCommands.apply(this, arguments);
    return commands;
  };
  GenericItemController.prototype.executeCommand = function (command, items, options) {
    switch (command) {
      default:
        return _baseitemcontroller.default.prototype.executeCommand.apply(this, arguments);
    }
  };
  GenericItemController.prototype.resolveField = function (item, field) {
    switch (field) {
      default:
        return _baseitemcontroller.default.prototype.resolveField.apply(this, arguments);
    }
  };
  GenericItemController.prototype.canReorder = function (item, user) {
    return item.CanReorder;
  };
  GenericItemController.prototype.canMoveUp = function (item, user) {
    if (!this.canReorder(item, user)) {
      return false;
    }
    return item.CanMoveUp;
  };
  GenericItemController.prototype.canMoveDown = function (item, user) {
    if (!this.canReorder(item, user)) {
      return false;
    }
    return item.CanMoveDown;
  };
  GenericItemController.prototype.moveInOrder = function (items, options) {
    // subclass should implement
    return Promise.reject();
  };
  var _default = _exports.default = GenericItemController;
});
