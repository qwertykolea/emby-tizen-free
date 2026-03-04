define(["exports", "./globalize.js"], function (_exports, _globalize) {
  Object.defineProperty(_exports, "__esModule", {
    value: true
  });
  _exports.default = void 0;
  /* jshint module: true */

  var units = [['year', 31536000000], ['month', 2592000000], ['week', 604800000], ['day', 86400000], ['hour', 3600000], ['minute', 60000], ['second', 1000]];
  function humane_date(date, isPastEvent) {
    if (typeof date === 'string') {
      date = new Date(Date.parse(date));
    }
    var elapsedMs = date.getTime() - Date.now();
    var elapsedMsAbs = Math.abs(elapsedMs);
    var unit;
    for (var i = 0, length = units.length; i < length; i++) {
      unit = units[i];
      if (elapsedMsAbs >= unit[1]) {
        break;
      }
    }
    var elapsedInUnit = Math.round(elapsedMs / unit[1]);
    if (isPastEvent !== false) {
      // in case local device time is head of the server
      elapsedInUnit = Math.min(elapsedInUnit, 1);
      if (elapsedInUnit > -1) {
        elapsedInUnit = -1;
        unit = units[units.length - 1];
      }
    }
    return new Intl.RelativeTimeFormat(_globalize.default.getCurrentLocales(), {
      numeric: 'always',
      style: 'long'
    }).format(elapsedInUnit, unit[0]);
  }
  function numberToString(value, maximumFractionDigits) {
    try {
      return new Intl.NumberFormat(_globalize.default.getCurrentLocales(), {
        style: 'decimal',
        // for framerates, bitrates, etc
        maximumFractionDigits: maximumFractionDigits == null ? 1 : maximumFractionDigits
      }).format(value);
    } catch (err) {
      console.error('Error in NumberFormat: ', err);
      return value;
    }
  }
  function sizeToString(size) {
    var gb = 1024 * 1024 * 1024;
    if (size >= gb) {
      return numberToString(size / gb, 1) + ' GB';
    }
    return numberToString(size / (1024 * 1024), 1) + ' MB';
  }
  function bitrateToString(value) {
    value /= 1000;
    if (value > 1000) {
      value /= 1000;
      return numberToString(value, 0) + ' mbps';
    }
    return numberToString(parseInt(value)) + ' kbps';
  }
  function getRawResolutionText(item) {
    return item.Width && item.Height ? item.Width + 'x' + item.Height : null;
  }
  function getVideoStream(item) {
    var _;
    var mediaStreams = ((_ = (item.MediaSources || [])[0]) == null ? void 0 : _.MediaStreams) || item.MediaStreams || [];
    for (var i = 0, length = mediaStreams.length; i < length; i++) {
      var mediaStream = mediaStreams[i];
      if (mediaStream.Type === 'Video') {
        return mediaStream;
      }
    }
    return null;
  }
  function getResolutionText(item) {
    if (item.MediaType !== 'Video') {
      return getRawResolutionText(item);
    }
    var videoStream = getVideoStream(item);
    if (!videoStream) {
      return getRawResolutionText(item);
    }
    var width = videoStream.Width;
    var height = videoStream.Height;
    if (width && height) {
      if (width >= 3800 || height >= 2000) {
        return '4K';
      }
      if (width >= 2500 || height >= 1400) {
        if (videoStream.IsInterlaced) {
          return '1440i';
        }
        return '1440p';
      }
      if (width >= 1800 || height >= 1000) {
        if (videoStream.IsInterlaced) {
          return '1080i';
        }
        return '1080p';
      }
      if (width >= 1200 || height >= 700) {
        if (videoStream.IsInterlaced) {
          return '720i';
        }
        return '720p';
      }
      if (width >= 700 || height >= 400) {
        if (videoStream.IsInterlaced) {
          return '480i';
        }
        return '480p';
      }
      return 'SD';
    }
    return null;
  }
  var _default = _exports.default = {
    formatRelativeTime: humane_date,
    bitrateToString: bitrateToString,
    sizeToString: sizeToString,
    numberToString: numberToString,
    getResolutionText: getResolutionText
  };
});
