define(["exports", "./commandprocessor.js", "./common/itemmanager/itemmanager.js"], function (_exports, _commandprocessor, _itemmanager) {
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
  function getResolveFn(id, changed) {
    return function (result) {
      return Promise.resolve({
        command: id,
        updated: changed,
        result: result
      });
    };
  }
  function executeCommand(items, id, options) {
    switch (id) {
      case 'multiselect':
      case 'connecttoserver':
      case 'scan':
      case 'refresh':
        {
          // don't wait
          _commandprocessor.default.executeCommand(id, items, options);
          return getResolveFn(id)();
        }
      default:
        return _commandprocessor.default.executeCommand(id, items, options).then(getResolveFn(id));
    }
  }
  function show(options) {
    var commands = _itemmanager.default.getCommands(options);
    var items = options.items;
    return showActionSheet({
      items: commands,
      positionTo: options.positionTo,
      positionY: options.positionY,
      positionX: options.positionX,
      positionClientY: options.positionClientY,
      positionClientX: options.positionClientX,
      transformOrigin: options.transformOrigin,
      item: items.length === 1 ? items[0] : null,
      blurBackground: true,
      noTextWrap: true,
      hasItemIcon: true,
      linkToItem: options.play !== false,
      lowerLowResThreshold: true
    }).then(function (id) {
      return executeCommand(items, id, options);
    }).then(function (result) {
      return Promise.resolve(result);
    }, function (err) {
      return Promise.reject(err);
    });
  }
  var _default = _exports.default = {
    show: show,
    executeCommand: executeCommand
  };
});
