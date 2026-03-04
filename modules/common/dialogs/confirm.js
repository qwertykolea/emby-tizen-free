define(["exports", "./../globalize.js", "./../../dialog/dialog.js"], function (_exports, _globalize, _dialog) {
  Object.defineProperty(_exports, "__esModule", {
    value: true
  });
  _exports.default = _default;
  /* jshint module: true */

  function _default(text, title) {
    var options;
    if (typeof text === 'string') {
      options = {
        title: title,
        text: text
      };
    } else {
      options = text;
    }
    var items = [];
    items.push({
      name: options.cancelText || _globalize.default.translate('Cancel'),
      id: 'cancel',
      type: options.primary === 'cancel' ? null : 'cancel'
    });
    items.push({
      name: options.confirmText || _globalize.default.translate('ButtonOk'),
      id: 'ok',
      type: options.primary === 'cancel' ? 'cancel' : 'submit'
    });
    if (options.primary !== 'cancel') {
      items.reverse();
    }
    options.buttons = items;
    options.dialogType = 'confirm';
    return (0, _dialog.default)(options).then(function (result) {
      if (result === 'ok') {
        return Promise.resolve();
      }

      // this should be blank or it should be an AbortError.
      // Anything else and consumers won't know it was cancelled and may treat it like an error
      if (options.cancelResult) {
        return Promise.reject(options.cancelResult);
      } else {
        return Promise.reject();
      }
    });
  }
});
