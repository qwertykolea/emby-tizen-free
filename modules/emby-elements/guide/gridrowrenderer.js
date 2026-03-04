define(["exports", "./../../common/globalize.js", "./../../common/usersettings/usersettings.js", "./../../shortcuts.js", "./../../emby-apiclient/connectionmanager.js", "./../../indicators/indicators.js", "./../../skinmanager.js", "./../../common/itemmanager/itemmanager.js"], function (_exports, _globalize, _usersettings, _shortcuts, _connectionmanager, _indicators, _skinmanager, _itemmanager) {
  Object.defineProperty(_exports, "__esModule", {
    value: true
  });
  _exports.default = void 0;
  /* jshint module: true */

  var supportsCssVariables = CSS.supports('color', 'var(--fake-var)');
  function getTimerIndicator(item) {
    var status;
    if (item.Type === 'SeriesTimer') {
      return '<i class="md-icon md-icon-fill programIcon seriesTimerIcon mediaInfoItem">&#xe062;</i>';
    } else if (item.TimerId || item.SeriesTimerId) {
      status = item.Status || 'Cancelled';
    } else if (item.Type === 'Timer') {
      status = item.Status;
    } else {
      return '';
    }
    if (item.SeriesTimerId) {
      if (status !== 'Cancelled') {
        return '<i class="md-icon md-icon-fill programIcon seriesTimerIcon mediaInfoItem">&#xe062;</i>';
      }
      return '<i class="md-icon md-icon-fill programIcon seriesTimerIcon seriesTimerIcon-inactive mediaInfoItem">&#xe062;</i>';
    }
    return '<i class="md-icon md-icon-fill programIcon timerIcon mediaInfoItem">&#xe061;</i>';
  }
  function parseDates(program) {
    if (!program.StartDateLocalMs) {
      try {
        program.StartDateLocalMs = Date.parse(program.StartDate);
      } catch (err) {}
    }
    if (!program.EndDateLocalMs) {
      try {
        program.EndDateLocalMs = Date.parse(program.EndDate);
      } catch (err) {}
    }
    return null;
  }
  var insetInlineStartProp = CSS.supports('inset-inline-start', '0') ? 'inset-inline-start' : 'left';
  function getShadedMediaInfoItem(text, itemClass) {
    var mainElementClass = ('mediaInfoItem-shaded ' + (itemClass || '')).trim();
    return '<div class="mediaInfoItem ' + mainElementClass + '"><span class="mediaInfoItem-shaded-text">' + text + '</span></div>';
  }
  function getProgramHtml(program, options, totalGridMs) {
    var html = '';
    var startMs = options.startMs;
    var endMs = options.endMs;
    parseDates(program);
    var startDateLocalMs = program.StartDateLocalMs;
    var endDateLocalMs = program.EndDateLocalMs;
    var renderStartMs = Math.max(startDateLocalMs, startMs);
    var startPercent = (startDateLocalMs - startMs) / totalGridMs;
    startPercent *= 100;
    startPercent = Math.max(startPercent, 0);
    var renderEndMs = Math.min(endDateLocalMs, endMs);
    var endPercent = (renderEndMs - renderStartMs) / totalGridMs;
    endPercent *= 100;
    var cssClass = "programCell itemAction";
    var accentCssClass = null;
    var displayInnerContent = true;
    var displayMovieContent = options.displayMovieContent;
    var displaySportsContent = options.displaySportsContent;
    var displayNewsContent = options.displayNewsContent;
    var displayKidsContent = options.displayKidsContent;
    var displaySeriesContent = options.displaySeriesContent;
    var enableColorCodedBackgrounds = options.enableColorCodedBackgrounds;
    if (program.IsKids) {
      displayInnerContent = displayKidsContent;
      accentCssClass = 'kids';
    } else if (program.IsSports) {
      displayInnerContent = displaySportsContent;
      accentCssClass = 'sports';
    } else if (program.IsNews) {
      displayInnerContent = displayNewsContent;
      accentCssClass = 'news';
    } else if (program.IsMovie) {
      displayInnerContent = displayMovieContent;
      accentCssClass = 'movie';
    } else if (program.IsSeries) {
      displayInnerContent = displaySeriesContent;
    } else {
      displayInnerContent = displayMovieContent && displayNewsContent && displaySportsContent && displayKidsContent && displaySeriesContent;
    }
    var timerAttributes = '';
    if (program.TimerId) {
      timerAttributes += ' data-timerid="' + program.TimerId + '"';
    }
    if (program.Status) {
      timerAttributes += ' data-status="' + program.Status + '"';
    }
    if (program.SeriesTimerId) {
      timerAttributes += ' data-seriestimerid="' + program.SeriesTimerId + '"';
    }
    var isAttribute = endPercent >= 2 ? ' is="emby-programcell"' : '';
    html += '<button' + isAttribute + '  ' + _shortcuts.default.getShortcutAttributesHtml(program, {}) + ' data-action="' + options.clickAction + '"' + timerAttributes + ' class="' + cssClass + '" style="' + insetInlineStartProp + ':' + startPercent + '%;width:' + endPercent + '%;">';
    var programCellInnerClass = 'programCellInner epgCellInner mediaInfoItems programMediaInfoItems';
    if (enableColorCodedBackgrounds && accentCssClass) {
      programCellInnerClass += " programCellInner-" + accentCssClass;
    }
    html += '<div class="' + programCellInnerClass + '">';
    if (displayInnerContent) {
      var showingEpisodeTitle = program.EpisodeTitle && options.showEpisodeTitle && (!options.conditionalEhowTitle || program.IsSports);
      html += '<i class="guideProgramNameCaretIcon secondaryText hide md-icon">&#xe314;</i>';
      if (showingEpisodeTitle) {
        html += '<div><div class="mediaInfoItems programMediaInfoItems">';
      }
      html += '<div class="guideProgramNameText mediaInfoItem">' + program.Name;
      html += '</div>';
      html += getTimerIndicator(program);
      if (program.IsLive && options.showLiveIndicator) {
        html += getShadedMediaInfoItem(_globalize.default.translate('Live'), 'mediaInfoProgramAttribute guideProgramIndicator liveTvProgram');
      } else if (program.IsPremiere && options.showPremiereIndicator) {
        html += getShadedMediaInfoItem(_globalize.default.translate('Premiere'), 'mediaInfoProgramAttribute guideProgramIndicator premiereTvProgram');
      } else if (options.showNewIndicator && program.IsNew) {
        html += getShadedMediaInfoItem(_globalize.default.translate('AttributeNew'), 'mediaInfoProgramAttribute guideProgramIndicator newTvProgram');
      } else if (program.IsRepeat && options.showRepeatIndicator) {
        html += getShadedMediaInfoItem(_globalize.default.translate('Repeat'), 'mediaInfoProgramAttribute guideProgramIndicator repeatTvProgram');
      }
      if ((options.showHdIcon || options.show4kIcon) && program.Width && program.Width >= 1200) {
        var text;
        if (program.Width && program.Width >= 3800) {
          if (options.show4kIcon) {
            text = '4K';
          }
        } else {
          if (options.showHdIcon) {
            text = 'HD';
          }
        }
        html += getShadedMediaInfoItem(text, 'mediaInfoProgramAttribute guideProgramIndicator');
      }
      if (showingEpisodeTitle) {
        html += '</div>';
        html += '<div class="guideProgramSecondaryInfo secondaryText">';
        html += program.EpisodeTitle;
        html += '</div>';
        html += '</div>';
      }
    }
    html += '</div>';
    html += '</button>';
    return html;
  }
  function getEpgRowHtml(instance, item, index, options) {
    var apiClient = _connectionmanager.default.getApiClient(item);
    var html = '';
    var channel = item.Channel;
    var channelImageUrl = options.showChannelImage ? apiClient.getLogoImageUrl(channel, {
      maxHeight: 220
    }, _skinmanager.default.getPreferredLogoImageTypes()) : null;

    //if (channel.Name[0] === 'W') {
    //    channelImageUrl = null;
    //}

    var cssClass = options.channelCellClass;
    var titleText = _itemmanager.default.getDisplayName(channel, {});
    html += '<button type="button" ' + _shortcuts.default.getShortcutAttributesHtml(channel, {}) + ' data-action="' + options.channelAction + '" title="' + titleText + '" aria-label="' + titleText + '" class="' + cssClass + ' itemAction"' + '>';
    var channelCellInnerClass = options.channelCellInnerClass;
    html += '<div class="' + channelCellInnerClass + '">';

    // environments not supporting css vars are not rendering this correctly when it has focus
    var secondaryTextClass = supportsCssVariables ? ' secondaryText' : '';
    var channelTextClass = 'guideChannelText ' + secondaryTextClass;
    var channelTextTagName = 'div';
    var hasText = options.showChannelName || options.showChannelNumber;
    if (channelImageUrl) {
      var guideChannelImageClass = options.guideChannelImageClass;
      if (hasText) {
        guideChannelImageClass += ' guideChannelImage-withtext';
      }
      html += '<div class="' + guideChannelImageClass + '" style="background-image:url(' + channelImageUrl + ');"></div>';
    }
    if (hasText || !channelImageUrl) {
      html += '<' + channelTextTagName + ' class="' + channelTextClass + '">';
      if (options.showChannelNumber && channel.ChannelNumber) {
        html += '<div class="guideChannelNumber">';
        html += channel.ChannelNumber;
        html += '</div>';
      }
      if ((options.showChannelName || !channelImageUrl) && channel.Name) {
        html += '<div class="guideChannelName">';
        html += channel.Name;
        html += '</div>';
      }
      html += '</' + channelTextTagName + '>';
    }
    html += '</div>';
    html += '</button>';
    var programs = item.Programs;
    html += '<div class="channelPrograms flex-grow flex">';

    //console.log('Rendering ' + programs.length + ' programs for ' + channel.Name);

    var totalGridMs = options.endMs - options.startMs;
    for (var i = 0, length = programs.length; i < length; i++) {
      html += getProgramHtml(programs[i], options, totalGridMs);
    }
    html += '</div>';
    if (options.parts) {
      var attributes = _shortcuts.default.getShortcutAttributes(item, options);
      return {
        attributes: attributes,
        html: html
      };
    }
    var dataAttributes = _shortcuts.default.getShortcutAttributesHtml(item, options);
    var tagName = options.tagName;
    var fixedAttributes = options.fixedAttributes;
    if (fixedAttributes) {
      dataAttributes += ' ' + fixedAttributes;
    }
    return '<' + tagName + dataAttributes + ' class="' + options.className + '">' + html + '</' + tagName + '>';
  }
  function GridRowRenderer(options) {
    this.options = options;
  }
  GridRowRenderer.prototype.getItemParts = function (item, index, options) {
    options.parts = true;
    return getEpgRowHtml(this, item, index, options);
  };
  GridRowRenderer.prototype.getItemsHtml = function (items, options) {
    this.setListOptions(items, options);
    var html = '';
    for (var i = 0, length = items.length; i < length; i++) {
      var item = items[i];
      html += getEpgRowHtml(this, item, i, options);
    }
    return html;
  };
  GridRowRenderer.prototype.setListOptions = function (items, options) {
    if (options.isBoundListItem == null) {
      options.isBoundListItem = true;
    }
    options.itemSelector = '.epgRow';
    var guideChannelStyle = _usersettings.default.guideChannelStyle();
    options.showChannelImage = guideChannelStyle !== 'name';
    options.showChannelName = guideChannelStyle !== 'image';
    options.showChannelNumber = _usersettings.default.showChannelNumberInGuide();
    options.tagName = 'div';
    options.className = 'epgRow flex flex-shrink-zero flex-direction-row focuscontainer-x focusable';
    var channelCellInnerClass = 'channelCellInner epgCellInner';
    var guideChannelImageClass = 'guideChannelImage';
    if (document.dir === 'rtl') {
      guideChannelImageClass += ' guideChannelImageClass-rtl';
    }
    options.channelCellClass = 'channelCell';
    if (options.showChannelName && options.showChannelImage) {
      options.className += ' epgRow-twoline';
    }
    if (options.showChannelImage & (options.showChannelName || options.showChannelNumber)) {
      options.className += ' epgRow-portraittwoline';
    }
    if (options.showChannelName && options.showChannelImage || (!options.showChannelName || !options.showChannelImage) && !options.showChannelNumber) {
      channelCellInnerClass += ' channelCellInner-twoline';
      guideChannelImageClass += ' guideChannelImage-twoline';
    }
    if (!options.showChannelImage || options.showChannelNumber && (!options.showChannelImage || !options.showChannelName)) {
      if (options.showChannelName) {
        options.channelCellClass += ' channelCell-wide2';
      } else {
        options.channelCellClass += ' channelCell-wide';
      }
    }
    if (!options.showChannelName && !options.showChannelNumber) {
      channelCellInnerClass += ' channelCellInner-notext';
    }
    options.channelCellInnerClass = channelCellInnerClass;
    options.guideChannelImageClass = guideChannelImageClass;
    var html = '<div class="' + options.channelCellClass + '"></div><div class="channelPrograms flex-grow flex"></div>';
    options.templateInnerHTML = html;
    options.clickAction = /*layoutManager.tv ? 'link' :*/'linkdialog';
    options.startMs = options.startDateMs;
    options.endMs = options.endDateMs;
    var categories = options.categories || [];
    options.displayMovieContent = !categories.length || categories.indexOf('movies') !== -1;
    options.displaySportsContent = !categories.length || categories.indexOf('sports') !== -1;
    options.displayNewsContent = !categories.length || categories.indexOf('news') !== -1;
    options.displayKidsContent = !categories.length || categories.indexOf('kids') !== -1;
    options.displaySeriesContent = !categories.length || categories.indexOf('series') !== -1;
    options.enableColorCodedBackgrounds = _usersettings.default.get('guide-colorcodedbackgrounds') === 'true';
    options.conditionalEhowTitle = true;
    options.showHdIcon = _usersettings.default.get('guide-indicator-hd') === 'true';
    options.show4kIcon = _usersettings.default.get('guide-indicator-4k') !== 'false';
    options.showLiveIndicator = _usersettings.default.get('guide-indicator-live') !== 'false';
    options.showPremiereIndicator = _usersettings.default.get('guide-indicator-premiere') !== 'false';
    options.showNewIndicator = _usersettings.default.get('guide-indicator-new') !== 'false';
    options.showRepeatIndicator = _usersettings.default.get('guide-indicator-repeat') === 'true';
    var fixedAttributes = 'data-focusabletype="nearest"';
    if (options.addTabIndex) {
      fixedAttributes += ' tabindex="0"';
    }
    options.fixedAttributes = fixedAttributes.trim();
    return options;
  };
  GridRowRenderer.prototype.setListClasses = function (elem) {};
  GridRowRenderer.parseDates = parseDates;
  GridRowRenderer.getProgramHtml = getProgramHtml;
  GridRowRenderer.virtualChunkSize = 30;
  var _default = _exports.default = GridRowRenderer;
});
