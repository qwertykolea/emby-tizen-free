/* jshint module: true */

if (!globalThis.Intl) {
  globalThis.Intl = {};
}
var Styles = {
  long: {
    years: ' years',
    days: ' days',
    hours: ' hours',
    minutes: ' minutes',
    seconds: ' seconds',
    milliseconds: ' milliseconds'
  },
  short: {
    years: ' yr',
    days: ' d',
    hours: ' hr',
    minutes: ' min',
    seconds: ' sec',
    milliseconds: ' ms'
  },
  narrow: {
    years: 'y',
    days: 'd',
    hours: 'h',
    minutes: 'm',
    seconds: 's',
    milliseconds: 'ms'
  },
  digital: {
    years: '',
    days: '',
    hours: '',
    minutes: '',
    seconds: '',
    milliseconds: ''
  }
};
if (!Intl.DurationFormat) {
  Intl.DurationFormat = function (locales, options) {
    this.options = options || {};
    this.locales = Array.isArray(locales) ? locales : [locales];
  };
  Intl.DurationFormat.prototype.format = function (value) {
    var options = this.options;
    var requestedStyle = options.style;
    var style = Styles[requestedStyle || 'narrow'];
    var parts = [];
    if (value.years != null) {
      parts.push(value.years + style.years);
    }
    if (value.days != null) {
      parts.push(value.days + style.days);
    }
    if (value.hours != null) {
      parts.push(value.hours + style.hours);
    }
    var minutes = value.minutes;
    if (minutes != null || options.minutesDisplay === 'always') {
      if (!minutes) {
        minutes = 0;
      }
      if (requestedStyle === 'digital') {
        if (minutes < 10) {
          minutes = '0' + minutes;
        }
      }
      parts.push(minutes + style.minutes);
    }
    var seconds = value.seconds;
    if (seconds != null || options.secondsDisplay === 'always') {
      if (!seconds) {
        seconds = 0;
      }
      if (requestedStyle === 'digital') {
        if (seconds < 10) {
          seconds = '0' + seconds;
        }
      }
      parts.push(seconds + style.seconds);
    }
    if (value.milliseconds) {
      parts.push(value.milliseconds + style.milliseconds);
    }
    switch (requestedStyle) {
      case 'digital':
        return parts.join(':');
      default:
        return parts.join(' ');
    }
  };
}
