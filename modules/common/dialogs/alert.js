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
    if (options.confirmButton !== false) {
      items.push({
        name: options.confirmText || _globalize.default.translate('ButtonGotIt'),
        id: 'ok',
        //type: 'submit',
        href: options.confirmHref
      });
    }
    options.buttons = items;
    options.dialogType = 'alert';
    return (0, _dialog.default)(options).then(function (result) {
      if (result === 'ok') {
        return Promise.resolve();
      }
      return Promise.reject();
    });
  }
});
