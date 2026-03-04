/* jshint module: true */

if (!globalThis.Intl) {
  globalThis.Intl = {};
}
var toLocaleTimeStringSupportsLocales = function () {
  try {
    new Date().toLocaleTimeString('i');
  } catch (e) {
    return e.name === 'RangeError';
  }
  return false;
}();
function getOptionList(options) {
  var list = [];
  for (var i in options) {
    list.push({
      name: i,
      value: options[i]
    });
  }
  return list;
}
if (!Intl.DateTimeFormat) {
  Intl.DateTimeFormat = function (locales, options) {
    this.options = options || {};
    this.locales = Array.isArray(locales) ? locales : [locales];
  };
  Intl.DateTimeFormat.prototype.format = function (value) {
    var options = this.options;
    var locale = this.locales[0];
    var renderDate = options.dateStyle || options.month || options.day || options.year;
    if (renderDate && options.timeStyle) {
      if (!toLocaleTimeStringSupportsLocales) {
        return value.toLocaleString();
      }
      return value.toLocaleString(locale, options);
    } else if (renderDate) {
      if (!toLocaleTimeStringSupportsLocales) {
        // This is essentially a hard-coded polyfill
        var optionList = getOptionList(options);
        if (optionList.length === 1 && optionList[0].name === 'weekday') {
          var weekday = [];
          if (optionList[0].value === 'long') {
            weekday[0] = "Sunday";
            weekday[1] = "Monday";
            weekday[2] = "Tuesday";
            weekday[3] = "Wednesday";
            weekday[4] = "Thursday";
            weekday[5] = "Friday";
            weekday[6] = "Saturday";
          } else {
            weekday[0] = "Sun";
            weekday[1] = "Mon";
            weekday[2] = "Tue";
            weekday[3] = "Wed";
            weekday[4] = "Thu";
            weekday[5] = "Fri";
            weekday[6] = "Sat";
          }
          return weekday[value.getDay()];
        }
        return value.toLocaleDateString();
      }
      return value.toLocaleDateString(locale, options);
    } else {
      if (!toLocaleTimeStringSupportsLocales) {
        return value.toLocaleTimeString();
      }
      return value.toLocaleTimeString(locale, options);
    }
  };
}
