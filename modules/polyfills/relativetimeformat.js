/* jshint module: true */

if (!globalThis.Intl) {
  globalThis.Intl = {};
}
if (!Intl.RelativeTimeFormat) {
  Intl.RelativeTimeFormat = function (locales, options) {
    this.options = options || {};
    this.locales = Array.isArray(locales) ? locales : [locales];
  };
  Intl.RelativeTimeFormat.prototype.format = function (elapsed, unit) {
    var prefix = "";
    var suffix = "";
    if (elapsed < 0) {
      suffix = " ago";
    } else if (elapsed > 0) {
      prefix = "in ";
    }
    elapsed = Math.abs(elapsed);
    if (elapsed > 1) {
      unit += "s";
    }
    return prefix + elapsed + " " + unit + suffix;
  };
}
