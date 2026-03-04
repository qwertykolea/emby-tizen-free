define(["exports", "./../common/datetime.js", "./../common/globalize.js", "./../common/textencoding.js", "./../common/itemmanager/itemmanager.js", "./../approuter.js", "./../emby-elements/emby-button/emby-button.js", "./../common/dataformatter.js", "./../browser.js"], function (_exports, _datetime, _globalize, _textencoding, _itemmanager, _approuter, _embyButton, _dataformatter, _browser) {
  Object.defineProperty(_exports, "__esModule", {
    value: true
  });
  _exports.default = void 0;
  /* jshint module: true */

  require(['material-icons', 'css!modules/mediainfo/mediainfo.css', 'programStyles']);
  var IconSvg = {};

  //require([
  //    'text!modules/mediainfo/dtshdma.svg',
  //    'text!modules/mediainfo/dts.svg']
  //).then(function (responses) {
  //    IconSvg['dtshdma'] = responses[0];
  //    IconSvg['dts'] = responses[1];
  //});

  function getTimerIndicator(item) {
    var status;
    var itemType = item.Type;
    if (itemType === 'SeriesTimer') {
      return '<i class="md-icon md-icon-fill mediaInfoItem mediaInfoIconItem mediaInfoTimerIcon">&#xe062;</i>';
    } else if (item.TimerId || item.SeriesTimerId) {
      status = item.Status || 'Cancelled';
    } else if (itemType === 'Timer') {
      status = item.Status;
    } else {
      return '';
    }
    if (item.SeriesTimerId) {
      if (status !== 'Cancelled') {
        return '<i class="md-icon md-icon-fill mediaInfoItem mediaInfoIconItem mediaInfoTimerIcon">&#xe062;</i>';
      }
      return '<i class="md-icon md-icon-fill mediaInfoItem mediaInfoIconItem">&#xe062;</i>';
    }
    return '<i class="md-icon md-icon-fill mediaInfoItem mediaInfoIconItem mediaInfoTimerIcon">&#xe061;</i>';
  }
  function getAirTimeText(item, showAirDateTime, showAirEndTime) {
    var airTimeText = '';
    if (item.StartDate) {
      var date = new Date(Date.parse(item.StartDate) + (item.PrePaddingSeconds || 0));
      if (showAirDateTime) {
        airTimeText += _datetime.default.toLocaleDateString(date, {
          weekday: 'short',
          month: 'short',
          day: 'numeric'
        }) + ' ';
      }
      airTimeText += _datetime.default.getDisplayTime(date);
      if (item.EndDate && showAirEndTime) {
        date = new Date(Date.parse(item.EndDate) + (item.PostPaddingSeconds || 0));
        airTimeText += ' &ndash; ' + _datetime.default.getDisplayTime(date);
      }
    }
    return airTimeText;
  }
  function getProgramInfoHtml(item, options) {
    var html = '';
    var miscInfo = [];
    if (options.programIndicator) {
      if (item.IsLive) {
        miscInfo.push(getShadedMediaInfoItem(_globalize.default.translate('Live'), 'mediaInfoProgramAttribute liveTvProgram'));
      } else if (item.IsPremiere) {
        miscInfo.push(getShadedMediaInfoItem(_globalize.default.translate('Premiere'), 'mediaInfoProgramAttribute premiereTvProgram'));
      } else if (item.IsNew) {
        miscInfo.push(getShadedMediaInfoItem(_globalize.default.translate('AttributeNew'), 'mediaInfoProgramAttribute newTvProgram'));
      } else if (item.IsRepeat) {
        miscInfo.push(getShadedMediaInfoItem(_globalize.default.translate('Repeat'), 'mediaInfoProgramAttribute repeatTvProgram'));
      }
    }
    if (item.StartDate && options.programTime !== false) {
      try {
        miscInfo.push(getAirTimeText(item, true, true));
      } catch (e) {
        console.error("Error parsing date: " + item.StartDate, e);
      }
    }
    if (item.ChannelName && options.channelName !== false) {
      var dummyChannel = {
        ServerId: item.ServerId,
        Type: 'TvChannel',
        Name: item.ChannelName,
        Id: item.ChannelId,
        Number: item.Number,
        ChannelNumber: item.ChannelNumber
      };
      var name = _itemmanager.default.getDisplayName(dummyChannel, {});
      if (options.interactive && item.ChannelId) {
        miscInfo.push({
          html: '<a is="emby-linkbutton" style="font-weight:inherit;" class="button-link button-link-color-inherit mediaInfoItem" href="' + _approuter.default.getRouteUrl(dummyChannel) + '">' + name + '</a>'
        });
      } else {
        miscInfo.push(name);
      }
    }
    if (item.OfficialRating && options.officialRating) {
      miscInfo.push(getBorderMediaInfoItem(item.OfficialRating));
    }
    if (options.timerIndicator) {
      var timerHtml = getTimerIndicator(item);
      if (timerHtml) {
        miscInfo.push({
          html: timerHtml
        });
      }
    }
    html += miscInfo.map(getMediaInfoItem).join('');
    return html;
  }
  function getGenresHtml(item, options) {
    var context = options.context;
    var genres = (item.GenreItems || []).slice(0);
    var genreLimit = options.genreLimit;
    if (genreLimit == null) {
      genreLimit = 1;
    }
    if (genreLimit != null) {
      if (genres.length > genreLimit) {
        genres.length = genreLimit;
      }
    }
    var type;
    switch (context) {
      case 'games':
        type = 'GameGenre';
        break;
      case 'music':
        type = 'MusicGenre';
        break;
      default:
        type = 'Genre';
        break;
    }
    var genreConcat = options.genreConcat || ', ';
    var html = genres.map(function (p) {
      return '<a class="button-link button-link-color-inherit" is="emby-linkbutton" style="font-weight:inherit;" href="' + _approuter.default.getRouteUrl({
        Name: p.Name,
        Type: type,
        ServerId: item.ServerId,
        Id: p.Id
      }, {
        context: context
      }) + '">' + _textencoding.default.htmlEncode(p.Name) + '</a>';
    }).join(genreConcat);
    if (html) {
      html = '<div class="mediaInfoItem" style="white-space:normal;">' + html + '</div>';
    }
    return html;
  }
  function getShadedMediaInfoItem(text, itemClass) {
    var mainElementClass = ('mediaInfoItem-shaded ' + (itemClass || '')).trim();

    // this will break vertical centering on android, but is needed for other platforms
    if (!_browser.default.android) {
      mainElementClass += ' flex align-items-center';
    }
    return {
      html: '<div class="mediaInfoItem ' + mainElementClass + '"><span class="mediaInfoItem-shaded-text">' + text + '</span></div>'
    };
  }
  function getBorderMediaInfoItem(text, itemClass) {
    var mainElementClass = ('mediaInfoItem-border ' + (itemClass || '')).trim();
    return {
      html: '<div class="mediaInfoItem ' + mainElementClass + '"><span class="">' + text + '</span></div>'
    };
  }
  function addAudioIcon(mediaStreams, icons) {
    for (var i = 0, length = mediaStreams.length; i < length; i++) {
      var stream = mediaStreams[i];
      if (stream.Type !== 'Audio') {
        continue;
      }
      switch ((stream.Codec || '').toLowerCase()) {
        case 'dts':
          switch ((stream.Profile || '').toLowerCase()) {
            case 'dts-hd ma':
              if (IconSvg.dtshdma) {
                icons.push(IconSvg.dtshdma);
                return;
              }
              break;
            default:
              if (IconSvg.dts) {
                icons.push(IconSvg.dts);
                return;
              }
              break;
          }
          break;
        default:
          break;
      }
    }
  }
  function addMediaIcons(item, options, miscInfo) {
    var _options$mediaSource;
    var mediaStreams = ((_options$mediaSource = options.mediaSource) == null ? void 0 : _options$mediaSource.MediaStreams) || item.MediaStreams || [];
    var icons = [];
    if (options.mediaInfoIcons !== false) {
      for (var i = 0, length = mediaStreams.length; i < length; i++) {
        var stream = mediaStreams[i];
        if (stream.Type !== 'Video') {
          continue;
        }
        //if (stream.ExtendedVideoType === 'DolbyVision') {
        //    icons.push('<svg class="mediaInfoItem mediaInfoItem_svg" viewBox="0 0 52 22" xmlns="http://www.w3.org/2000/svg"><path d="M9.72 14.87l1.927 5.454h.04l1.946-5.453h1.344l-2.806 7.084h-1.077l-2.767-7.084zm7.839 0v7.085h-1.245v-7.084zm9.369 0v7.085h-1.245v-7.084zm5.227 0c.52 0 1 .083 1.438.248.439.165.818.4 1.138.705.32.305.569.675.748 1.11.178.434.268.922.268 1.46 0 .528-.09 1.009-.268 1.444-.18.435-.428.809-.748 1.123-.32.314-.7.559-1.138.733a3.86 3.86 0 01-1.438.262c-.515 0-.99-.087-1.425-.262a3.346 3.346 0 01-1.128-.733 3.36 3.36 0 01-.743-1.123 3.762 3.762 0 01-.268-1.443c0-.54.09-1.027.268-1.462.178-.434.426-.804.743-1.109.316-.305.692-.54 1.128-.705.435-.165.91-.247 1.425-.247zm6.985 0l3.25 5.304h.02v-5.303h1.245v7.084h-1.58l-3.32-5.473h-.02v5.473h-1.246v-7.084zm-17.28.002c.337 0 .68.06 1.026.18.278.097.526.232.746.405l.159.137-.769.854a1.442 1.442 0 00-.53-.413 1.567 1.567 0 00-1.1-.114 1.253 1.253 0 00-.376.162.886.886 0 00-.276.284.791.791 0 00-.108.423c0 .152.031.281.094.389.062.108.148.2.257.275.11.076.242.143.399.2.156.057.328.113.515.17.213.07.433.15.661.238.228.089.438.205.628.351s.347.33.469.55c.122.222.183.497.183.826 0 .361-.066.676-.197.945-.131.27-.306.492-.525.67a2.23 2.23 0 01-.769.398 3.199 3.199 0 01-.928.133c-.431 0-.853-.08-1.265-.242a2.488 2.488 0 01-.875-.565l-.138-.152.844-.797c.162.228.38.408.652.54.271.134.539.2.801.2.137 0 .278-.017.422-.052.144-.035.273-.093.389-.176a.979.979 0 00.281-.308.903.903 0 00.108-.46.758.758 0 00-.122-.442 1.097 1.097 0 00-.328-.304c-.138-.085-.3-.16-.488-.223l-.59-.2c-.2-.062-.4-.138-.6-.227-.2-.089-.38-.206-.54-.351a1.692 1.692 0 01-.388-.537c-.1-.212-.15-.476-.15-.792 0-.342.07-.636.21-.883.141-.247.326-.451.554-.612.228-.162.487-.282.778-.361.29-.08.586-.119.886-.119zm10.304 1.15c-.332 0-.632.061-.9.183-.268.123-.499.29-.692.504a2.28 2.28 0 00-.447.751 2.688 2.688 0 00-.159.934c0 .348.053.668.159.957.105.29.256.542.452.756.196.214.428.38.696.5s.566.178.891.178c.326 0 .624-.06.895-.179s.505-.285.701-.499c.196-.214.347-.466.453-.756.105-.29.158-.609.158-.957a2.69 2.69 0 00-.158-.934 2.29 2.29 0 00-.448-.75 2.075 2.075 0 00-.697-.505 2.179 2.179 0 00-.904-.183zM46.325 3.15l1.993 4.536 1.993-4.536h1.671l-3.962 8.966a1.975 1.975 0 01-2.47 1.075l-.142-.058-.53-.24h-.003l.19-.431.428-.973.219.1a.812.812 0 001.025-.32l.052-.1.004-.01.613-1.402.02-.044.057-.125-2.829-6.438zM39.21.002v3.784a3.446 3.446 0 012-.638c1.928 0 3.496 1.588 3.496 3.541 0 1.953-1.568 3.54-3.496 3.54a3.446 3.446 0 01-2-.638v.64h-1.532V.002zm-2.818 0v10.23h-1.53V.002zm-6.016 3.146c1.928 0 3.496 1.588 3.496 3.54 0 1.953-1.568 3.541-3.496 3.541-1.929 0-3.497-1.588-3.497-3.54 0-1.953 1.568-3.541 3.497-3.541zM21.057 0c2.782 0 5.046 2.292 5.046 5.11s-2.264 5.11-5.046 5.11h-3.645V0zm-6.7 0v10.22h-1.49c-2.78 0-5.045-2.295-5.045-5.11 0-2.743 2.151-4.992 4.833-5.105L12.868 0zM1.488 0c2.78 0 5.046 2.295 5.046 5.11 0 2.743-2.152 4.991-4.833 5.105l-.213.004h-1.49V0zm39.72 4.541c-.926 0-1.719.61-1.999 1.461a2.152 2.152 0 000 1.346 2.11 2.11 0 002 1.463c1.157 0 2.108-.95 2.108-2.135 0-1.172-.951-2.135-2.108-2.135zm-10.833 0c-1.157 0-2.109.95-2.109 2.134 0 1.172.939 2.135 2.109 2.135 1.157 0 2.108-.95 2.108-2.135 0-1.171-.951-2.135-2.108-2.135zm-9.32-2.992h-2.114V8.67h2.115c1.937 0 3.516-1.599 3.516-3.56s-1.58-3.56-3.516-3.56z" fill="currentColor"/></svg>');
        //    break;
        //}
      }
    }
    if (item.Video3DFormat) {
      icons.push(getBorderMediaInfoItem(_globalize.default.translate('3D')).html);
    }
    if (options.mediaInfoIcons !== false) {
      addAudioIcon(mediaStreams, icons);
    }
    if (options.subtitles !== false) {
      var hasSubtitles = item.HasSubtitles;
      var hasSDHSubtitles;
      for (var _i = 0, _length = mediaStreams.length; _i < _length; _i++) {
        var _stream = mediaStreams[_i];
        if (_stream.Type === 'Subtitle') {
          hasSubtitles = true;
          if (_stream.IsHearingImpaired) {
            hasSDHSubtitles = true;
            break;
          }
        }
      }
      if (hasSubtitles) {
        icons.push(getBorderMediaInfoItem('CC').html);
      }
      if (hasSDHSubtitles) {
        icons.push(getBorderMediaInfoItem('SDH').html);
      }
    }
    if (icons.length) {
      miscInfo.push({
        html: '<div class="mediaInfoItems mediaInfoItems-condensed align-self-center">' + icons.join('') + '</div>'
      });
    }
  }
  function getMediaInfoHtml(item, options) {
    var _options$mediaSource2;
    var miscInfo = [];
    if (!options) {
      options = {};
    }
    var text, date;
    var itemType = item.Type;
    var showFolderRuntime;
    switch (itemType) {
      case 'MusicAlbum':
      case 'MusicArtist':
      case 'Playlist':
      case 'MusicGenre':
      case 'BoxSet':
        showFolderRuntime = true;
        break;
      default:
        break;
    }
    if (options.CommunityRating !== false && item.CommunityRating && item.Type !== 'RemoteSubtitle') {
      var starHtml = getStarIconsHtml(item);
      if (starHtml) {
        miscInfo.push({
          html: starHtml
        });
      }
    }
    if (item.CriticRating && options.criticRating !== false) {
      var _starHtml = getCriticRating(item);
      if (_starHtml) {
        miscInfo.push({
          html: _starHtml
        });
      }
    }
    if ((itemType === "Episode" || itemType === "Recording" && item.SeriesId || item.MediaType === 'Photo') && options.originalAirDate !== false) {
      if (item.PremiereDate) {
        try {
          date = new Date(Date.parse(item.PremiereDate));
          text = _datetime.default.toLocaleDateString(date, {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
          });
          miscInfo.push(text);
        } catch (e) {
          console.error("Error parsing date: " + item.PremiereDate, e);
        }
      }
    }
    if (itemType === 'SeriesTimer') {
      var _item$ChannelIds;
      if (item.RecordAnyTime) {
        miscInfo.push(_globalize.default.translate('Anytime'));
      } else if (item.StartDate) {
        miscInfo.push(_datetime.default.getDisplayTime(item.StartDate));
      }
      if (item.RecordAnyChannel || !((_item$ChannelIds = item.ChannelIds) != null && _item$ChannelIds.length)) {
        miscInfo.push(_globalize.default.translate('AllChannels'));
      } else {
        miscInfo.push(item.ChannelName || _globalize.default.translate('OneChannel'));
      }
    }

    //if (item.StartDate && itemType !== 'Program' && itemType !== 'SeriesTimer' && itemType !== 'Timer') {

    //    try {
    //        date = new Date(Date.parse(item.StartDate));

    //        text = datetime.toLocaleDateString(date, { month: 'short', day: 'numeric', year: 'numeric' });
    //        miscInfo.push(text);

    //        if (itemType !== "Recording") {
    //            text = datetime.getDisplayTime(date);
    //            miscInfo.push(text);
    //        }
    //    }
    //    catch (e) {
    //        console.error("Error parsing date: " + item.StartDate, e);
    //    }
    //}

    if (options.year !== false && item.ProductionYear && itemType === "Series") {
      if (item.Status === "Continuing") {
        miscInfo.push(_globalize.default.translate('SeriesYearToPresent', item.ProductionYear));
      } else if (item.ProductionYear) {
        text = item.ProductionYear;
        if (item.EndDate) {
          try {
            var endYear = new Date(Date.parse(item.EndDate)).getFullYear();
            if (endYear !== item.ProductionYear) {
              text += " &ndash; " + endYear;
            }
          } catch (e) {
            console.error("Error parsing date: " + item.EndDate, e);
          }
        }
        miscInfo.push(text);
      }
    }
    if (itemType === 'Series') {
      var studioHtml = '';
      if (item.Studios && item.Studios.length) {
        var studio = item.Studios[0];
        if (studioHtml) {
          studioHtml += ' on ';
        }
        studioHtml += '<a style="font-weight:inherit;" class="button-link button-link-color-inherit" is="emby-linkbutton" href="' + _approuter.default.getRouteUrl({
          Name: studio.Name,
          Type: 'Studio',
          ServerId: item.ServerId,
          Id: studio.Id
        }) + '">' + studio.Name + '</a>';
      }
      if (studioHtml) {
        miscInfo.push(studioHtml);
      }
    }
    if (options.programIndicator !== false) {
      if (item.IsLive) {
        miscInfo.push(getShadedMediaInfoItem(_globalize.default.translate('Live'), 'mediaInfoProgramAttribute liveTvProgram'));
      } else if (item.IsPremiere) {
        miscInfo.push(getShadedMediaInfoItem(_globalize.default.translate('Premiere'), 'mediaInfoProgramAttribute premiereTvProgram'));
      } else if (item.IsNew) {
        miscInfo.push(getShadedMediaInfoItem(_globalize.default.translate('AttributeNew'), 'mediaInfoProgramAttribute newTvProgram'));
      } else if (item.IsRepeat) {
        miscInfo.push(getShadedMediaInfoItem(_globalize.default.translate('Repeat'), 'mediaInfoProgramAttribute repeatTvProgram'));
      }
    }
    if (itemType === 'Program') {
      if ((item.IsSeries || item.EpisodeTitle) && options.episodeTitle !== false) {
        text = _itemmanager.default.getDisplayName(item, {
          includeIndexNumber: options.episodeTitleIndexNumber
        });
        if (text) {
          miscInfo.push(text);
        }
      } else if (item.IsMovie && item.ProductionYear && options.originalAirDate !== false) {
        miscInfo.push(item.ProductionYear);
      } else if (item.PremiereDate && options.originalAirDate !== false) {
        try {
          date = new Date(Date.parse(item.PremiereDate));
          text = _globalize.default.translate('OriginalAirDateValue', _datetime.default.toLocaleDateString(date, {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
          }));
          miscInfo.push(text);
        } catch (e) {
          console.error("Error parsing date: " + item.PremiereDate, e);
        }
      } else if (item.ProductionYear) {
        miscInfo.push(item.ProductionYear);
      }
    }
    if (options.year !== false) {
      if (itemType !== "Series" && (itemType !== "Episode" || !item.PremiereDate) && itemType !== "Person" && item.MediaType !== 'Photo' && itemType !== 'Program' && itemType !== 'Season') {
        if (item.ProductionYear) {
          miscInfo.push(item.ProductionYear);
        } else if (item.PremiereDate) {
          try {
            text = new Date(Date.parse(item.PremiereDate)).getFullYear();
            miscInfo.push(text);
          } catch (e) {
            console.error("Error parsing date: " + item.PremiereDate, e);
          }
        }
      }
    }
    var runtimeTicks = ((_options$mediaSource2 = options.mediaSource) == null ? void 0 : _options$mediaSource2.RunTimeTicks) || item.RunTimeTicks;
    if (itemType !== "Series" && itemType !== 'Program' && !showFolderRuntime && options.runtime !== false) {
      if (runtimeTicks) {
        if (itemType === "Audio") {
          miscInfo.push(_datetime.default.getDisplayRunningTime(runtimeTicks));
        } else {
          miscInfo.push(_datetime.default.getHumanReadableRuntime(runtimeTicks));
        }
      }
    }
    if (showFolderRuntime) {
      var count = item.SongCount || item.ChildCount;
      if (count) {
        if (itemType === 'BoxSet') {
          if (count === 1) {
            miscInfo.push(_globalize.default.translate('ValueOneItem'));
          } else {
            miscInfo.push(_globalize.default.translate('ItemCount', count));
          }
        } else {
          if (count === 1) {
            miscInfo.push(_globalize.default.translate('OneTrack'));
          } else {
            miscInfo.push(_globalize.default.translate('TrackCount', count));
          }
        }
      }
      if (runtimeTicks) {
        if (itemType === 'Playlist') {
          miscInfo.push(_datetime.default.getHumanReadableRuntime(runtimeTicks));
        }
      }
    }
    if (itemType === 'Series') {
      var seasonCount = item.ChildCount;
      if (seasonCount) {
        if (seasonCount === 1) {
          miscInfo.push(_globalize.default.translate('OneSeason'));
        } else {
          miscInfo.push(_globalize.default.translate('NumberSeasonsValue', seasonCount));
        }
      }
    }
    if (item.MediaType === 'Photo' && item.Width && item.Height) {
      miscInfo.push(item.Width + "x" + item.Height);
    }
    if (options.container && item.Container) {
      miscInfo.push(item.Container.toUpperCase());
    }
    var bitrate = item.Bitrate || item.BitRate;
    if (options.bitrate && bitrate) {
      miscInfo.push(_dataformatter.default.bitrateToString(bitrate));
    }
    if (itemType === 'RemoteSubtitle') {
      if (item.IsHashMatch) {
        miscInfo.push(getShadedMediaInfoItem(_globalize.default.translate('HashMatch')));
      }
      if (item.IsForced) {
        miscInfo.push(getShadedMediaInfoItem(_globalize.default.translate('Forced')));
      }
      if (item.IsHearingImpaired) {
        miscInfo.push(getShadedMediaInfoItem('SDH'));
      }
      if (item.DownloadCount != null) {
        miscInfo.push(_globalize.default.translate('DownloadsValue', item.DownloadCount));
      }
    }
    if (item.OfficialRating && options.officialRating !== false) {
      miscInfo.push(getBorderMediaInfoItem(item.OfficialRating));
    }
    if (options.genres) {
      var genreHtml = getGenresHtml(item, options);
      if (genreHtml) {
        miscInfo.push({
          html: genreHtml
        });
      }
    }
    addMediaIcons(item, options, miscInfo);
    var html = miscInfo.map(getMediaInfoItem).join('');
    if (options.dateAdded && _itemmanager.default.enableDateAddedDisplay(item)) {
      var dateCreated = new Date(Date.parse(item.DateCreated));
      html += getMediaInfoItem(_globalize.default.translate('AddedOnValue', _datetime.default.toLocaleDateString(dateCreated, {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      })));
    }
    if (options.endsAt !== false) {
      var endsAt = getEndsAt(item, options.mediaSource);
      if (endsAt) {
        html += getMediaInfoItem(endsAt, ('endsAt ' + (options.endsAtClass || '')).trim());
      }
    }
    return html;
  }
  function getEndsAt(item, mediaSource) {
    mediaSource = mediaSource || item;
    if (item.MediaType === 'Video' && mediaSource.RunTimeTicks) {
      if (!item.StartDate && item.Type !== 'Program') {
        var positionTicks = item.UserData ? item.UserData.PlaybackPositionTicks || 0 : 0;
        return getEndsAtFromPosition(mediaSource.RunTimeTicks, positionTicks);
      }
    }
    return null;
  }
  function getEndsAtFromPosition(runtimeTicks, positionTicks, includeText) {
    var endDate = Date.now() + (runtimeTicks - (positionTicks || 0)) / 10000;
    endDate = new Date(endDate);
    var displayTime = _datetime.default.getDisplayTime(endDate);
    if (includeText === false) {
      return displayTime;
    }
    return _globalize.default.translate('EndsAtValue', displayTime);
  }
  function getMediaInfoItem(m, cssClass) {
    cssClass = typeof cssClass === 'string' ? cssClass + ' mediaInfoItem' : 'mediaInfoItem';
    var mediaInfoText = m;
    if (typeof m !== 'string' && typeof m !== 'number') {
      if (m.html) {
        return m.html;
      }
      mediaInfoText = m.text;
      cssClass += ' ' + m.cssClass;
    }
    return '<div class="' + cssClass + '">' + mediaInfoText + '</div>';
  }
  function getCriticRating(item, options) {
    var outerClass = 'mediaInfoItem mediaInfoCriticRating';
    if (options) {
      if (options.outerClass) {
        outerClass += ' ' + options.outerClass;
      }
    }
    var imageClass;
    if (item.CriticRating >= 60) {
      imageClass = 'mediaInfoCriticRatingFresh';
    } else {
      imageClass = 'mediaInfoCriticRatingRotten';
    }
    return '<div class="' + outerClass + '"><div class="mediaInfoCriticRatingImage ' + imageClass + '"></div>' + item.CriticRating + '%</div>';
  }
  function getStarIconsHtml(item, options) {
    var html = '';
    var rating = item.CommunityRating;
    if (rating) {
      var outerClass = 'starRatingContainer mediaInfoItem';
      if (options) {
        if (options.outerClass) {
          outerClass += ' ' + options.outerClass;
        }
      }
      html += '<div class="' + outerClass + '">';
      html += '<i class="md-icon md-icon-fill starIcon">&#xe838;</i>';
      html += _dataformatter.default.numberToString(rating, 1);
      html += '</div>';
    }
    return html;
  }
  function dynamicEndTime(elem, item, mediaSource) {
    var interval = setInterval(function () {
      if (!document.body.contains(elem)) {
        clearInterval(interval);
        return;
      }
      elem.innerHTML = getEndsAt(item, mediaSource);
    }, 60000);
  }
  function fillPrimaryMediaInfo(elem, item, options) {
    var html = getPrimaryMediaInfoHtml(item, options);
    elem.innerHTML = html;
    if (html) {
      elem.classList.remove('hide');
    } else {
      elem.classList.add('hide');
    }
    afterFill(elem, item, options);
  }
  function fillSecondaryMediaInfo(elem, item, options) {
    var html = getSecondaryMediaInfoHtml(item, options);
    elem.innerHTML = html;
    if (html) {
      elem.classList.remove('hide');
    } else {
      elem.classList.add('hide');
    }
    afterFill(elem, item, options);
  }
  function afterFill(elem, item, options) {
    if (options.endsAt !== false) {
      var endsAtElem = elem.querySelector('.endsAt');
      if (endsAtElem) {
        dynamicEndTime(endsAtElem, item, options.mediaSource);
      }
    }
  }
  function getPrimaryMediaInfoHtml(item, options) {
    if (!options) {
      options = {};
    }
    if (options.interactive == null) {
      options.interactive = false;
    }
    return getMediaInfoHtml(item, options);
  }
  function getSecondaryMediaInfoHtml(item, options) {
    if (!options) {
      options = {};
    }
    if (options.interactive == null) {
      options.interactive = false;
    }
    var itemType = item.Type;
    if (itemType === 'Program' || itemType === 'Timer' || itemType === 'Recording') {
      return getProgramInfoHtml(item, options);
    }
    return '';
  }
  function createAttribute(label, value, className) {
    className = className ? className + ' ' : '';
    className += ' flex';
    className += ' mediaStreamAttribute';
    return '<div class="' + className + '"><span class="mediaInfoAttributeLabel">' + label + '</span><span class="mediaInfoAttributeValue secondaryText">' + value + '</span></div>';
  }
  function getFileName(stream) {
    var parts = stream.Path.split('/').join('\\').split('\\');
    return parts[parts.length - 1];
  }
  function pushMediaStreamLines(stream, options, lines, icon) {
    var streamType = stream.StreamType;
    var streamTypeLocalizationKey = streamType === 'EmbeddedImage' ? 'Image' : streamType;
    if (stream.SubtitleType === 'Lyrics') {
      streamTypeLocalizationKey = 'Lyrics';
    }
    var displayType = _globalize.default.translate(streamTypeLocalizationKey);
    if (icon) {
      displayType = '<i class="md-icon autortl mediaStreamTypeIcon">' + icon + '</i>' + displayType;
    }
    lines.push('<h3 style="margin: .6em 0 .8em;" class="flex align-items-center">' + displayType + '</h3>');
    if (stream.DisplayTitle) {
      lines.push(createAttribute(_globalize.default.translate('Title'), stream.DisplayTitle));
    }
    if (stream.Title && stream.Title !== stream.DisplayTitle) {
      lines.push(createAttribute(_globalize.default.translate('HeaderEmbeddedTitle'), stream.Title));
    }
    if ((stream.DisplayLanguage || stream.Language) && streamType !== "Video") {
      lines.push(createAttribute(_globalize.default.translate('Language'), stream.DisplayLanguage || stream.Language));
    }
    if (stream.Codec) {
      lines.push(createAttribute(_globalize.default.translate('Codec'), stream.Codec.toUpperCase()));
    }
    switch (stream.ExtendedVideoType) {
      case 'DolbyVision':
        {
          if (stream.ExtendedVideoSubTypeDescription) {
            lines.push(createAttribute(_globalize.default.translate('DolbyProfile'), stream.ExtendedVideoSubTypeDescription));
          }
          break;
        }
      default:
        break;
    }
    if (stream.CodecTag) {
      lines.push(createAttribute(_globalize.default.translate('HeaderCodecTag'), stream.CodecTag));
    }
    if (stream.Profile) {
      lines.push(createAttribute(_globalize.default.translate('Profile'), stream.Profile));
    }
    if (stream.Level) {
      lines.push(createAttribute(_globalize.default.translate('Level'), stream.Level));
    }
    if (stream.Width || stream.Height) {
      lines.push(createAttribute(_globalize.default.translate('Resolution'), stream.Width + 'x' + stream.Height));
    }
    if (stream.AspectRatio && stream.Codec !== "mjpeg") {
      lines.push(createAttribute(_globalize.default.translate('HeaderAspectRatio'), stream.AspectRatio));
    }
    if (streamType === "Video") {
      //if (stream.IsAnamorphic != null) {
      //    lines.push(createAttribute(globalize.translate('Anamorphic'), (stream.IsAnamorphic ? globalize.translate('Yes') : globalize.translate('No'))));
      //}

      lines.push(createAttribute(_globalize.default.translate('Interlaced'), stream.IsInterlaced ? _globalize.default.translate('Yes') : _globalize.default.translate('No')));
    }
    if (stream.AverageFrameRate || stream.RealFrameRate) {
      lines.push(createAttribute(_globalize.default.translate('Framerate'), _dataformatter.default.numberToString(stream.AverageFrameRate || stream.RealFrameRate, 3)));
    }
    if (stream.ChannelLayout) {
      lines.push(createAttribute(_globalize.default.translate('Layout'), stream.ChannelLayout));
    }
    if (stream.Channels) {
      lines.push(createAttribute(_globalize.default.translate('Channels'), stream.Channels + ' ch'));
    }
    if (stream.BitRate && stream.Codec !== "mjpeg") {
      lines.push(createAttribute(_globalize.default.translate('Bitrate'), _dataformatter.default.bitrateToString(stream.BitRate)));
    }
    if (stream.SampleRate) {
      lines.push(createAttribute(_globalize.default.translate('HeaderSampleRate'), _dataformatter.default.numberToString(stream.SampleRate) + ' Hz'));
    }
    if (stream.VideoRange && stream.VideoRange !== 'SDR') {
      lines.push(createAttribute(_globalize.default.translate('HeaderVideoRange'), stream.VideoRange));
    }
    if (stream.ColorPrimaries) {
      lines.push(createAttribute(_globalize.default.translate('HeaderColorPrimaries'), stream.ColorPrimaries));
    }
    if (stream.ColorSpace) {
      lines.push(createAttribute(_globalize.default.translate('HeaderColorSpace'), stream.ColorSpace));
    }
    if (stream.ColorTransfer) {
      lines.push(createAttribute(_globalize.default.translate('HeaderColorTransfer'), stream.ColorTransfer));
    }
    if (stream.BitDepth) {
      lines.push(createAttribute(_globalize.default.translate('HeaderBitDepth'), stream.BitDepth + ' bit'));
    }
    if (stream.PixelFormat) {
      lines.push(createAttribute(_globalize.default.translate('HeaderPixelFormat'), stream.PixelFormat));
    }
    if (stream.RefFrames) {
      lines.push(createAttribute(_globalize.default.translate('HeaderReferenceFrames'), stream.RefFrames));
    }
    if (stream.Rotation) {
      lines.push(createAttribute(_globalize.default.translate('Rotation'), stream.Rotation));
    }

    //if (stream.NalLengthSize) {
    //    lines.push(createAttribute('NAL', stream.NalLengthSize));
    //}

    if (streamType !== "Video" && streamType !== 'Attachment' && streamType !== 'Data') {
      lines.push(createAttribute(_globalize.default.translate('Default'), stream.IsDefault ? _globalize.default.translate('Yes') : _globalize.default.translate('No')));
    }
    if (streamType === "Subtitle") {
      if (stream.SubtitleType !== 'Lyrics') {
        lines.push(createAttribute(_globalize.default.translate('Forced'), stream.IsForced ? _globalize.default.translate('Yes') : _globalize.default.translate('No')));
        if (stream.IsHearingImpaired != null) {
          lines.push(createAttribute(_globalize.default.translate('HearingImpaired'), stream.IsHearingImpaired ? _globalize.default.translate('Yes') : _globalize.default.translate('No')));
        }
      }
    }
    if (stream.IsExternal || streamType === "Subtitle") {
      lines.push(createAttribute(_globalize.default.translate('External'), stream.IsExternal ? _globalize.default.translate('Yes') : _globalize.default.translate('No')));
    }

    // hiding due to lyrics size
    //if (stream.Extradata) {
    //    lines.push(createAttribute(globalize.translate('HeaderExtradata'), stream.Extradata));
    //}

    if (streamType === 'Attachment') {
      lines.push(createAttribute(_globalize.default.translate('External'), stream.IsExternal ? _globalize.default.translate('Yes') : _globalize.default.translate('No')));
    }
    if ((stream.IsExternal || streamType === 'Attachment') && stream.Path) {
      lines.push(createAttribute(_globalize.default.translate('File'), getFileName(stream)));
    }
  }
  var _default = _exports.default = {
    getMediaInfoHtml: getPrimaryMediaInfoHtml,
    fill: fillPrimaryMediaInfo,
    getEndsAt: getEndsAt,
    getEndsAtFromPosition: getEndsAtFromPosition,
    getPrimaryMediaInfoHtml: getPrimaryMediaInfoHtml,
    getSecondaryMediaInfoHtml: getSecondaryMediaInfoHtml,
    fillPrimaryMediaInfo: fillPrimaryMediaInfo,
    fillSecondaryMediaInfo: fillSecondaryMediaInfo,
    getResolutionText: _dataformatter.default.getResolutionText,
    pushMediaStreamLines: pushMediaStreamLines,
    getCommunityRating: getStarIconsHtml,
    getCriticRating: getCriticRating,
    bitrateToString: _dataformatter.default.bitrateToString,
    sizeToString: _dataformatter.default.sizeToString,
    getAirTimeText: getAirTimeText
  };
});
