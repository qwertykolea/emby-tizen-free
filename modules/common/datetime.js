define(["exports", "./globalize.js"], function (_exports, _globalize) {
  Object.defineProperty(_exports, "__esModule", {
    value: true
  });
  _exports.default = void 0;
  /* jshint module: true */

  function parseISO8601Date(s) {
    return new Date(Date.parse(s));
  }
  function getDisplayRunningTime(ticks) {
    var ticksPerHour = 36000000000;
    var ticksPerMinute = 600000000;
    var ticksPerSecond = 10000000;
    var duration = {};
    var hours = ticks / ticksPerHour;
    hours = Math.floor(hours);
    if (hours) {
      duration.hours = hours;
    }
    ticks -= hours * ticksPerHour;
    var minutes = ticks / ticksPerMinute;
    minutes = Math.floor(minutes);
    ticks -= minutes * ticksPerMinute;
    duration.minutes = minutes;
    var seconds = ticks / ticksPerSecond;
    seconds = Math.floor(seconds);
    duration.seconds = seconds;
    var currentLocale = _globalize.default.getCurrentLocale();
    var result = getDurationFormatter(currentLocale, {
      style: 'digital',
      fractionalDigits: 0,
      hoursDisplay: 'auto',
      minutesDisplay: 'always',
      secondsDisplay: 'always',
      millisecondsDisplay: 'auto',
      microsecondsDisplay: 'auto',
      nanosecondsDisplay: 'auto'
    }).format(duration);
    if (result.startsWith('0')) {
      result = result.substring(1);
    }
    return result;
  }
  var toLocaleTimeStringSupportsLocales = function () {
    try {
      new Date().toLocaleTimeString('i');
    } catch (e) {
      return e.name === 'RangeError';
    }
    return false;
  }();
  var dateTimeFormatters = {};
  function getDateTimeFormatter(locale, options) {
    // cache the DateTimeFormat to resolve performance issues in older versions of webOS
    // see the notes on performance here: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Date/toLocaleDateString

    var key = locale || 'und';
    key += options.weekday || 'null';
    key += options.year || 'null';
    key += options.month || 'null';
    key += options.day || 'null';
    key += options.hour || 'null';
    key += options.minute || 'null';
    key += options.second || 'null';
    key += options.dateStyle || 'null';
    key += options.timeStyle || 'null';
    var formatter = dateTimeFormatters[key];
    if (!formatter) {
      console.log('creating DateTimeFormat for ' + locale + ', with options: ' + JSON.stringify(options));
      formatter = new Intl.DateTimeFormat(locale, options);
      dateTimeFormatters[key] = formatter;
    }
    return formatter;
  }
  var durationFormatters = {};
  function getDurationFormatter(locale, options) {
    var key = locale || 'und';
    key += options.style || 'style';
    key += options.fractionalDigits || 'fractionalDigits';
    key += options.hoursDisplay || 'hoursDisplay';
    key += options.minutesDisplay || 'minutesDisplay';
    key += options.secondsDisplay || 'secondsDisplay';
    key += options.millisecondsDisplay || 'millisecondsDisplay';
    key += options.microsecondsDisplay || 'microsecondsDisplay';
    key += options.nanosecondsDisplay || 'nanosecondsDisplay';
    var formatter = durationFormatters[key];
    if (!formatter) {
      console.log('creating DurationFormat for ' + locale + ', with options: ' + JSON.stringify(options));
      formatter = new Intl.DurationFormat(locale, options);
      durationFormatters[key] = formatter;
    }
    return formatter;
  }
  function toLocaleString(date, options) {
    if (!date) {
      throw new Error('date cannot be null');
    }
    if (!options) {
      options = {
        dateStyle: 'short',
        timeStyle: 'short'
      };
    }
    var currentLocale = _globalize.default.getCurrentDateTimeLocale();
    return getDateTimeFormatter(currentLocale, options).format(date);
  }
  function toLocaleDateString(date, options) {
    if (!date) {
      throw new Error('date cannot be null');
    }
    if (!options) {
      options = {};
    }
    var currentLocale = _globalize.default.getCurrentDateTimeLocale();
    return getDateTimeFormatter(currentLocale, options).format(date);
  }
  function toLocaleTimeString(date, options) {
    if (!date) {
      throw new Error('date cannot be null');
    }
    if (!options) {
      options = {};
    }
    var currentLocale = _globalize.default.getCurrentDateTimeLocale();
    return getDateTimeFormatter(currentLocale, options).format(date);
  }
  function getDisplayTime(date) {
    if (!date) {
      throw new Error('date cannot be null');
    }
    if ((typeof date).toString().toLowerCase() === 'string') {
      try {
        date = new Date(Date.parse(date));
      } catch (err) {
        return date;
      }
    }
    if (toLocaleTimeStringSupportsLocales) {
      return toLocaleTimeString(date, {
        hour: 'numeric',
        minute: '2-digit'
      });
    }
    var time = toLocaleTimeString(date);
    var timeLower = time.toLowerCase();
    if (timeLower.includes('am') || timeLower.includes('pm')) {
      time = timeLower;
      var hour = date.getHours() % 12;
      var suffix = date.getHours() > 11 ? 'pm' : 'am';
      if (!hour) {
        hour = 12;
      }
      var minutes = date.getMinutes();
      if (minutes < 10) {
        minutes = '0' + minutes;
      }
      minutes = ':' + minutes;
      time = hour + minutes + suffix;
    } else {
      var timeParts = time.split(':');

      // Trim off seconds
      if (timeParts.length > 2) {
        // setting to 2 also handles '21:00:28 GMT+9:30'
        timeParts.length = 2;
        time = timeParts.join(':');
      }
    }
    return time;
  }
  function isRelativeDay(date, offsetInDays) {
    if (!date) {
      throw new Error('date cannot be null');
    }
    var yesterday = new Date();
    var day = yesterday.getDate() + offsetInDays;
    yesterday.setDate(day); // automatically adjusts month/year appropriately

    return date.getFullYear() === yesterday.getFullYear() && date.getMonth() === yesterday.getMonth() && date.getDate() === day;
  }
  function getHumanReadableRuntime(ticks) {
    var days = Math.trunc(ticks / 864000000000);
    var hours = Math.trunc(ticks % 864000000000 / 36000000000);
    var minutes = Math.trunc(ticks % 36000000000 / 600000000);
    var duration = {};
    var hasValue = false;
    if (days) {
      duration.days = days;
      hasValue = true;
    }
    if (hours) {
      duration.hours = hours;
      hasValue = true;
    }
    if (minutes) {
      duration.minutes = minutes;
      hasValue = true;
    }
    if (!hasValue) {
      return getDisplayRunningTime(ticks);
    }
    var currentLocale = _globalize.default.getCurrentLocale();
    return getDurationFormatter(currentLocale, {
      style: 'narrow'
    }).format(duration);
  }
  var _default = _exports.default = {
    parseISO8601Date: parseISO8601Date,
    getDisplayRunningTime: getDisplayRunningTime,
    toLocaleDateString: toLocaleDateString,
    toLocaleString: toLocaleString,
    getDisplayTime: getDisplayTime,
    isRelativeDay: isRelativeDay,
    toLocaleTimeString: toLocaleTimeString,
    supportsLocalization: function () {
      return toLocaleTimeStringSupportsLocales;
    },
    getHumanReadableRuntime: getHumanReadableRuntime
  };
});
