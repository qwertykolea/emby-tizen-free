define(["exports", "./../common/itemmanager/itemmanager.js", "./../emby-apiclient/apiclient.js"], function (_exports, _itemmanager, _apiclient) {
  Object.defineProperty(_exports, "__esModule", {
    value: true
  });
  _exports.default = void 0;
  /* jshint module: true */

  require(['css!modules/indicators/indicators.css', 'material-icons']);
  var progressBarRequired;
  function getProgressHtml(pct, options) {
    if (!progressBarRequired) {
      progressBarRequired = true;
      Emby.importModule('./modules/emby-elements/emby-progressbar/emby-progressbar.js');
    }
    var containerClass = 'itemProgressBar';
    var foregroundClass = 'itemProgressBarForeground';
    if (options) {
      if (options.containerClass) {
        containerClass += ' ' + options.containerClass;
      }
    }
    return '<div class="' + containerClass + '"><div class="' + foregroundClass + '" style="width:' + pct + '%;"></div></div>';
  }
  function getAutoTimeProgressHtml(pct, options, isRecording, start, end) {
    if (!progressBarRequired) {
      progressBarRequired = true;
      Emby.importModule('./modules/emby-elements/emby-progressbar/emby-progressbar.js');
    }
    var containerClass = 'itemProgressBar';
    var foregroundClass = 'itemProgressBarForeground';
    if (options) {
      if (options.containerClass) {
        containerClass += ' ' + options.containerClass;
      }
    }
    if (isRecording) {
      foregroundClass += ' itemProgressBarForeground-recording';
    }
    return '<div is="emby-progressbar" data-automode="time" data-starttime="' + start + '" data-endtime="' + end + '" class="' + containerClass + '"><div class="' + foregroundClass + '" style="width:' + pct + '%;"></div></div>';
  }
  function getProgressBarHtml(item, options) {
    var itemType = item.Type;
    switch (itemType) {
      case 'Program':
      case 'Timer':
      case 'Recording':
      case 'TvChannel':
        item = item.CurrentProgram || item;
        if (item.StartDate && item.EndDate) {
          var startDate = 0;
          var endDate = 1;
          try {
            startDate = Date.parse(item.StartDate);
          } catch (err) {}
          try {
            endDate = Date.parse(item.EndDate);
          } catch (err) {}
          var now = Date.now();
          var total = endDate - startDate;
          var pct = 100 * ((now - startDate) / total);
          if (pct > 0 && pct < 100) {
            var isRecording = itemType === 'Timer' || itemType === 'Recording' || item.TimerId;
            return getAutoTimeProgressHtml(pct, options, isRecording, startDate, endDate);
          }
        }
        break;
      case 'ActiveSession':
        var playstate = item.PlayState;
        var nowplayingItem = item.NowPlayingItem;
        if (playstate && nowplayingItem && nowplayingItem.RunTimeTicks) {
          var position = playstate.PositionTicks || 0;
          var value = 100 * position / nowplayingItem.RunTimeTicks;
          var html = getProgressHtml(value, {});
          if (item.TranscodingInfo && item.TranscodingInfo.CompletionPercentage) {
            html += getProgressHtml(item.TranscodingInfo.CompletionPercentage, {
              containerClass: 'sessionTranscodingProgress'
            });
          }
          return html;
        }
        break;
      case 'Chapter':
        return '';
      default:
        if (!item.IsFolder) {
          var userData = options ? options.userData || item.UserData : item.UserData;
          if (userData) {
            var _pct = userData.PlayedPercentage;
            if (_pct && _pct < 100) {
              return getProgressHtml(_pct, options);
            }
          }
        }
        break;
    }
    return '';
  }
  function getPlayedIndicator(item, classNamePrefix) {
    var userData = item.UserData;
    if (userData) {
      var className;
      if (userData.Played) {
        if (!item.IsFolder || item.Type === 'MusicAlbum') {
          if (_itemmanager.default.canMarkPlayed(item)) {
            className = classNamePrefix ? classNamePrefix + 'PlayedIndicator ' : '';
            return '<i class="' + className + 'playedIndicator md-icon">&#xe5CA;</i>';
          }
        }
        return '';
      }
      if (userData.UnplayedItemCount && !item.TimerId) {
        // don't display counts for downloaded series because the value will fall out of date
        if (_itemmanager.default.canMarkPlayed(item) && !_apiclient.default.isLocalItem(item)) {
          className = classNamePrefix ? classNamePrefix + 'CountIndicator ' : '';
          return '<div class="' + className + 'CountIndicator countIndicator">' + userData.UnplayedItemCount + '</div>';
        }
        return '';
      }
    }
    return '';
  }
  function getTimerIndicator(item, classNamePrefix) {
    var status;
    item = item.CurrentProgram || item;
    var itemType = item.Type;
    var className = classNamePrefix ? classNamePrefix + 'TimerIndicator ' : '';
    if (itemType === 'SeriesTimer') {
      return '<i class="' + className + 'md-icon md-icon-fill timerIndicator seriesTimerIndicator indicatorIcon">&#xe062;</i>';
    } else if (item.TimerId || item.SeriesTimerId) {
      status = item.Status || 'Cancelled';
    } else if (itemType === 'Timer') {
      status = item.Status;
    } else {
      return '';
    }
    if (item.SeriesTimerId) {
      if (status !== 'Cancelled') {
        return '<i class="' + className + 'md-icon md-icon-fill timerIndicator seriesTimerIndicator indicatorIcon">&#xe062;</i>';
      }
      return '<i class="' + className + 'md-icon md-icon-fill timerIndicator seriesTimerIndicator timerIndicator-inactive indicatorIcon">&#xe062;</i>';
    }
    return '<i class="' + className + 'md-icon md-icon-fill timerIndicator indicatorIcon">&#xe061;</i>';
  }
  var _default = _exports.default = {
    getProgressBarHtml: getProgressBarHtml,
    getPlayedIndicatorHtml: getPlayedIndicator,
    getTimerIndicator: getTimerIndicator
  };
});
