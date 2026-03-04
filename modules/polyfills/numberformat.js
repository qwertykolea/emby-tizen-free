/* jshint module: true */

if (!globalThis.Intl) {
  globalThis.Intl = {};
}
if (!Intl.NumberFormat) {
  Intl.NumberFormat = function (locales, options) {
    this.options = options || {};
    this.locales = Array.isArray(locales) ? locales : [locales];
  };
  Intl.NumberFormat.prototype.format = function (value) {
    var options = this.options;
    if (options.maximumFractionDigits) {
      value = parseFloat(value.toFixed(options.maximumFractionDigits)).toString();
    } else {
      value = value.toString();
    }
    if (options.style === 'percent') {
      value += '%';
    }
    return value;
  };
}
