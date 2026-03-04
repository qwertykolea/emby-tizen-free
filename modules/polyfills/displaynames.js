/* jshint module: true */

if (!globalThis.Intl) {
  globalThis.Intl = {};
}
if (!Intl.DisplayNames) {
  Intl.DisplayNames = function (locales, options) {
    this.options = options || {};
    this.locales = Array.isArray(locales) ? locales : [locales];
  };
  Intl.DisplayNames.prototype.of = function (value) {
    var _this$options;
    return ((_this$options = this.options) == null ? void 0 : _this$options.fallback) === 'none' ? null : value;
  };
}
