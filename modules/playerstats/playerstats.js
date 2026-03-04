define(["exports", "./../emby-apiclient/connectionmanager.js", "./../common/playback/playbackmanager.js", "./../common/globalize.js", "./../emby-apiclient/events.js", "./../emby-elements/emby-button/paper-icon-button-light.js", "./../common/dataformatter.js", "./../layoutmanager.js"], function (_exports, _connectionmanager, _playbackmanager, _globalize, _events, _paperIconButtonLight, _dataformatter, _layoutmanager) {
  Object.defineProperty(_exports, "__esModule", {
    value: true
  });
  _exports.default = void 0;
  /* jshint module: true */

  require(['css!modules/playerstats/playerstats.css']);
  function init(instance, container) {
    var parent = document.createElement('div');
    parent.classList.add('playerStats', 'hide');
    if (!_layoutmanager.default.tv) {
      parent.classList.add('scrollY', 'hiddenScrollY');
    } else {
      parent.style.overflow = 'hidden';
    }
    parent.innerHTML = '<div class="playerStats-content"><button type="button" is="paper-icon-button-light" class="playerStats-closeButton hide-mouse-idle-tv"><i class="md-icon">&#xe5cd;</i></button><div class="playerStats-stats"></div></div>';
    var button = parent.querySelector('.playerStats-closeButton');
    if (button) {
      button.addEventListener('click', onCloseButtonClick.bind(instance));
    }
    container.appendChild(parent);
    instance.element = parent;
  }
  function onCloseButtonClick() {
    this.enabled(false);
    _events.default.trigger(this, 'close');
  }
  function renderStats(elem, categories) {
    elem.querySelector('.playerStats-stats').innerHTML = categories.map(function (category) {
      var categoryHtml = '';
      var stats = category.stats;
      if (stats.length && category.name) {
        categoryHtml += '<div class="playerStats-stat playerStats-stat-header">';
        categoryHtml += '<div class="playerStats-stat-label">';
        categoryHtml += category.name;
        categoryHtml += '</div>';
        categoryHtml += '<div class="playerStats-stat-value">';
        categoryHtml += category.subText || '';
        categoryHtml += '</div>';
        categoryHtml += '</div>';
      }
      for (var i = 0, length = stats.length; i < length; i++) {
        categoryHtml += '<div class="playerStats-stat">';
        var stat = stats[i];
        if (stat.label != null) {
          categoryHtml += '<div class="playerStats-stat-label">';
          categoryHtml += stat.label;
          categoryHtml += '</div>';
        }
        if (stat.value != null) {
          categoryHtml += '<div class="playerStats-stat-value">';
          categoryHtml += stat.value;
          categoryHtml += '</div>';
        }
        categoryHtml += '</div>';
      }
      return categoryHtml;
    }).join('');
  }
  function getSession(instance, player) {
    var now = Date.now();
    if (now - (instance.lastSessionTime || 0) < 10000) {
      return Promise.resolve(instance.lastSession);
    }
    var apiClient = _connectionmanager.default.getApiClient(_playbackmanager.default.currentItem(player).ServerId);
    return apiClient.getSessions({
      deviceId: apiClient.deviceId()
    }).then(function (sessions) {
      instance.lastSession = sessions[0] || {};
      instance.lastSessionTime = Date.now();
      return Promise.resolve(instance.lastSession);
    }, function () {
      return Promise.resolve({});
    });
  }
  function getStreamStats(session) {
    var stats = [];
    var playstate = session.PlayState || {};
    var nowplayingItem = session.NowPlayingItem || {};
    var transcodingInfo = session.TranscodingInfo || {};
    if (nowplayingItem.Container) {
      var containerInfo = nowplayingItem.Container.toUpperCase();
      if (nowplayingItem.Bitrate) {
        containerInfo += ' (' + _dataformatter.default.bitrateToString(nowplayingItem.Bitrate) + ')';
      }
      stats.push({
        label: containerInfo
      });
    }
    var playMethod = '<i class="md-icon playerStatsIcon autortl">&#xe941;</i>';
    if (playstate.PlayMethod === 'Transcode') {
      var transcodingInfoParts = [];
      if (transcodingInfo.SubProtocol && transcodingInfo.SubProtocol !== 'progressive') {
        transcodingInfoParts.push(transcodingInfo.SubProtocol.toUpperCase());
      } else if (transcodingInfo.Container) {
        transcodingInfoParts.push(transcodingInfo.Container.toUpperCase());
      }
      if (transcodingInfo.Bitrate) {
        var bitrateInfo = '(';
        if (transcodingInfo.Bitrate) {
          bitrateInfo += _dataformatter.default.bitrateToString(transcodingInfo.Bitrate);
        }
        if (transcodingInfo.Framerate) {
          bitrateInfo += ' ' + transcodingInfo.Framerate + ' fps';
        }
        bitrateInfo += ')';
        transcodingInfoParts.push(bitrateInfo);
      }
      if (transcodingInfo.CurrentThrottle) {
        transcodingInfoParts.push('<span class="secondaryText">Throttling</span>');
      }
      playMethod += transcodingInfoParts.join(' ');
    } else {
      playMethod += _globalize.default.translate('HeaderDirectPlay');
    }
    stats.push({
      value: playMethod
    });
    var transcodeReasons = transcodingInfo.TranscodeReasons || [];
    for (var i = 0, length = transcodeReasons.length; i < length; i++) {
      stats.push({
        value: _globalize.default.translate(transcodeReasons[i])
      });
    }
    return stats;
  }
  function getVideoStats(session) {
    var stats = [];
    var playstate = session.PlayState || {};
    var nowplayingItem = session.NowPlayingItem || {};
    var mediaStreams = nowplayingItem.MediaStreams || [];
    var videoStreamIndex = playstate.VideoStreamIndex;
    var transcodingInfo = session.TranscodingInfo || {};
    var mediaStream;
    for (var i = 0, length = mediaStreams.length; i < length; i++) {
      if (mediaStreams[i].Type === 'Video') {
        if (videoStreamIndex == null || videoStreamIndex === mediaStreams[i].Index) {
          mediaStream = mediaStreams[i];
          break;
        }
      }
    }
    if (!mediaStream) {
      return stats;
    }
    var title = mediaStream.DisplayTitle || _globalize.default.translate('Video');
    if (transcodingInfo.VideoDecoderHwAccel) {
      title += '<i class="md-icon playerStatsIcon playerStats-hwaccelIcon" title="' + _globalize.default.translate('HeaderHardwareAcceleratedDecoding') + ' (' + (transcodingInfo.VideoDecoderHwAccel || _globalize.default.translate('Software')) + ')">&#xe30d;</i>';
    }
    stats.push({
      label: title
    });
    var secondaryTexts = [];
    if (mediaStream.Profile) {
      secondaryTexts.push(mediaStream.Profile);
    }
    if (mediaStream.Level) {
      secondaryTexts.push(mediaStream.Level);
    }
    if (mediaStream.BitRate) {
      secondaryTexts.push(_dataformatter.default.bitrateToString(mediaStream.BitRate));
    }
    var framerate = mediaStream.AverageFrameRate || mediaStream.RealFrameRate;
    if (framerate) {
      secondaryTexts.push(_dataformatter.default.numberToString(framerate, 3) + ' fps');
    }
    if (secondaryTexts.length) {
      stats.push({
        label: secondaryTexts.join(' ')
      });
    }
    var playMethod = '<i class="md-icon playerStatsIcon autortl">&#xe941;</i>';
    if (transcodingInfo.IsVideoDirect === false) {
      playMethod += _globalize.default.translate('Transcode');
      playMethod += ' (';
      playMethod += (transcodingInfo.VideoCodec || '').toUpperCase() + ' ';
      if (transcodingInfo.VideoBitrate) {
        playMethod += _dataformatter.default.bitrateToString(transcodingInfo.VideoBitrate);
      }
      playMethod += ')';
      if (transcodingInfo.VideoEncoderHwAccel) {
        playMethod += '<i class="md-icon playerStatsIcon playerStats-hwaccelIcon" title="' + _globalize.default.translate('HeaderHardwareAcceleratedEncoding') + ' (' + (transcodingInfo.VideoEncoderHwAccel || _globalize.default.translate('Software')) + ')">&#xe30d;</i>';
      }
    } else {
      playMethod += _globalize.default.translate('HeaderDirectPlay');
    }
    stats.push({
      value: playMethod
    });
    if (transcodingInfo.IsVideoDirect === false) {
      var pipeline = transcodingInfo.VideoPipelineInfo || [];
      for (var _i = 0, _length = pipeline.length; _i < _length; _i++) {
        var step = pipeline[_i];
        if (step.StepType === 'ToneMapping' || step.StepType === 'Deinterlace' || step.StepType === 'SubTitleBurnIn' || step.StepType === 'SubtitleOverlay') {
          var html = '';
          html += '<i class="md-icon playerStatsIcon autortl">&#xe941;</i>';
          if (step.StepType === 'ToneMapping') {
            html += _globalize.default.translate('HeaderToneMapping');
          } else if (step.StepType === 'Deinterlace') {
            html += _globalize.default.translate('Deinterlacing');
          } else if (step.StepType === 'SubTitleBurnIn' || step.StepType === 'SubtitleOverlay') {
            html += _globalize.default.translate('HeaderBurningInSubtitles');
          }
          var extra = [];
          if (step.ParamShort) {
            extra.push(step.ParamShort);
          } else if (step.Param) {
            if (step.Param !== 'Subtitles') {
              extra.push(step.Param);
            }
          } else if (step.FfmpegOptions) {
            extra.push(step.FfmpegOptions);
          }
          if (extra.length) {
            html += ' <span class="secondaryText">(' + extra.join(' ') + ')</span>';
          }
          stats.push({
            value: html
          });
        }
      }
    }
    return stats;
  }
  function getAudioStats(session) {
    var stats = [];
    var playstate = session.PlayState || {};
    var nowplayingItem = session.NowPlayingItem || {};
    var mediaStreams = nowplayingItem.MediaStreams || [];
    var audioStreamIndex = playstate.AudioStreamIndex;
    var transcodingInfo = session.TranscodingInfo || {};
    var mediaStream;
    for (var i = 0, length = mediaStreams.length; i < length; i++) {
      if (mediaStreams[i].Type === 'Audio') {
        if (audioStreamIndex == null || audioStreamIndex === mediaStreams[i].Index) {
          mediaStream = mediaStreams[i];
          break;
        }
      }
    }
    if (!mediaStream) {
      return stats;
    }
    stats.push({
      label: mediaStream.DisplayTitle
    });
    var secondaryTexts = [];
    if (mediaStream.BitRate) {
      secondaryTexts.push(_dataformatter.default.bitrateToString(mediaStream.BitRate));
    }
    if (mediaStream.SampleRate) {
      secondaryTexts.push(mediaStream.SampleRate + ' Hz');
    }
    if (secondaryTexts.length) {
      stats.push({
        label: secondaryTexts.join(' ')
      });
    }
    var playMethod = '<i class="md-icon playerStatsIcon autortl">&#xe941;</i>';
    if (transcodingInfo.IsAudioDirect === false) {
      playMethod += _globalize.default.translate('Transcode');
      playMethod += ' (';
      playMethod += (transcodingInfo.AudioCodec || '').toUpperCase() + ' ';
      if (transcodingInfo.AudioBitrate) {
        playMethod += _dataformatter.default.bitrateToString(transcodingInfo.AudioBitrate);
      }
      playMethod += ')';
    } else {
      playMethod += _globalize.default.translate('HeaderDirectPlay');
    }
    stats.push({
      value: playMethod
    });
    return stats;
  }
  function getCategory(categories, type, name) {
    for (var i = 0, length = categories.length; i < length; i++) {
      var _category = categories[i];
      if (_category.type === type) {
        return _category;
      }
    }
    var category = {
      stats: [],
      name: name,
      type: type
    };
    categories.push(category);
    return category;
  }
  function getStats(instance, player) {
    var statsPromise = player.getStats ? player.getStats() : Promise.resolve({});
    var sessionPromise = getSession(instance, player);
    return Promise.all([statsPromise, sessionPromise]).then(function (responses) {
      var playerStatsResult = responses[0];
      var playerStats = playerStatsResult.categories || [];
      var session = responses[1];
      var baseCategory = {
        stats: getStreamStats(session),
        name: _globalize.default.translate('Stream')
      };
      var categories = [];
      categories.push(baseCategory);
      for (var i = 0, length = playerStats.length; i < length; i++) {
        var category = playerStats[i];
        if (category.type === 'audio') {
          category.name = _globalize.default.translate('Audio');
        } else if (category.type === 'video') {
          category.name = _globalize.default.translate('Video');
        }
        categories.push(category);
      }
      var videoCategory = getCategory(categories, 'video', _globalize.default.translate('Video'));
      Array.prototype.splice.apply(videoCategory.stats, [0, 0].concat(getVideoStats(session)));
      var audioCategory = getCategory(categories, 'audio', _globalize.default.translate('Audio'));
      Array.prototype.splice.apply(audioCategory.stats, [0, 0].concat(getAudioStats(session)));
      return categories;
    });
  }
  function renderPlayerStats(instance, player) {
    var now = Date.now();
    if (now - (instance.lastRender || 0) < 700) {
      return;
    }
    instance.lastRender = now;
    getStats(instance, player).then(function (stats) {
      var elem = instance.element;
      if (!elem) {
        return;
      }
      renderStats(elem, stats);
    });
  }
  function onTimeUpdate() {
    var options = this.options;
    if (options) {
      renderPlayerStats(this, options.player);
    }
  }
  function bindEvents(instance, player) {
    var onTimeUpdate = instance.onTimeUpdate;
    if (onTimeUpdate) {
      _events.default.on(player, 'timeupdate', onTimeUpdate);
    }
  }
  function unbindEvents(instance, player) {
    var onTimeUpdate = instance.onTimeUpdate;
    if (onTimeUpdate) {
      _events.default.off(player, 'timeupdate', onTimeUpdate);
    }
  }
  function PlayerStats(options) {
    this.options = options;
    this.onTimeUpdate = onTimeUpdate.bind(this);
    init(this, options.view);
    this.enabled(true);
  }
  PlayerStats.prototype.enabled = function (enabled) {
    if (enabled == null) {
      return this._enabled;
    }
    var options = this.options;
    if (!options) {
      return;
    }
    this._enabled = enabled;
    if (enabled) {
      this.element.classList.remove('hide');
      bindEvents(this, options.player);
    } else {
      this.element.classList.add('hide');
      unbindEvents(this, options.player);
    }
  };
  PlayerStats.prototype.toggle = function () {
    this.enabled(!this.enabled());
  };
  PlayerStats.prototype.destroy = function () {
    var options = this.options;
    if (options) {
      this.options = null;
      unbindEvents(this, options.player);
    }
    var elem = this.element;
    if (elem) {
      elem.remove();
      this.element = null;
    }
    this.onTimeUpdate = null;
  };
  var _default = _exports.default = PlayerStats;
});
