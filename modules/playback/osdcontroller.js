define(["exports", "./../layoutmanager.js", "./../common/datetime.js", "./../mediainfo/mediainfo.js", "./../common/playback/playbackmanager.js", "./../dom.js", "./../emby-apiclient/connectionmanager.js", "./../common/inputmanager.js", "./../common/usersettings/usersettings.js", "./../input/keyboard.js", "./../emby-apiclient/events.js", "../focusmanager.js"], function (_exports, _layoutmanager, _datetime, _mediainfo, _playbackmanager, _dom, _connectionmanager, _inputmanager, _usersettings, _keyboard, _events, _focusmanager) {
  Object.defineProperty(_exports, "__esModule", {
    value: true
  });
  _exports.default = void 0;
  function updateDurationText(elem, enableProgressByTimeOfDay, durationTicks, displayItem, enableTimeRemaining) {
    if (durationTicks == null) {
      elem.innerHTML = '';
      return;
    }
    if (isNaN(durationTicks)) {
      elem.innerHTML = '';
      return;
    }

    // safeguard against bad data
    if (durationTicks <= 0) {
      elem.innerHTML = '';
      return;
    }
    var html = _datetime.default.getDisplayRunningTime(durationTicks);
    if (enableTimeRemaining) {
      if (durationTicks > 0) {
        html = '-' + html;
        if (!enableProgressByTimeOfDay && (displayItem == null ? void 0 : displayItem.MediaType) === 'Video') {
          html += '<span class="osd-endsat"><span class="osd-endsat-dot">/</span>' + _mediainfo.default.getEndsAtFromPosition(durationTicks, 0, false).toLowerCase() + '</span>';
        }
      }
    }
    elem.innerHTML = html;
  }
  function getDisplayTime(date, showSeconds) {
    if (showSeconds) {
      return _datetime.default.toLocaleTimeString(date, {
        hour: 'numeric',
        minute: '2-digit',
        second: '2-digit'
      }).toLowerCase();
    }
    return _datetime.default.getDisplayTime(date).toLowerCase();
  }
  function getDisplayTimeWithoutAmPm(date, showSeconds) {
    return getDisplayTime(date, showSeconds).replace('am', '').replace('pm', '').trim();
  }
  function setDisplayTime(elem, ms) {
    var html;
    if (ms) {
      html = getDisplayTimeWithoutAmPm(new Date(ms));
    }
    elem.innerHTML = html || '';
  }
  function getDisplayPercentByTimeOfDay(startDateMs, programRuntimeMs, currentTimeMs) {
    return (currentTimeMs - startDateMs) / programRuntimeMs * 100;
  }
  function getStep(runtimeTicks) {
    var stepSeconds = _layoutmanager.default.tv ? 10 : 1;
    var step = stepSeconds * 10000000 / runtimeTicks * 100;
    step = step.toFixed(3);
    step = Math.max(0.01, step);
    step = Math.min(1, step);
    //console.log('step: ' + step);
    return step;
  }
  var insetInlineStartProp = CSS.supports('inset-inline-start', '0') ? 'insetInlineStart' : 'left';
  var SupportsCalc = CSS.supports('width', 'min(45.2%,calc(100% - .65em))');
  var SupportsMin = CSS.supports('width', 'min(10em, 5vw)');
  var SupportsCalcMin = SupportsCalc && SupportsMin;
  function updateTimeText(instance, elem, ticks, pct) {
    var html = '';
    var iconsBefore = '';
    var iconsAfter = '';
    if (ticks != null && !isNaN(ticks)) {
      html = _datetime.default.getDisplayRunningTime(ticks);
    }
    var key = instance.repeatingPositionSliderKey;
    var speed = instance.repeatingPositionSliderKeySpeed;

    //console.log('key: ' + key);

    if (instance.options.setPositionSliderPosition) {
      if (instance.paused) {
        iconsAfter += '<i class="md-icon button-icon-right osdcontroller-pauseicon" style="font-size:108%;">&#xe1a2;</i>';
      } else {
        iconsAfter += '<i class="md-icon button-icon-right osdcontroller-pauseicon hide" style="font-size:108%;">&#xe1a2;</i>';
      }
    }
    var hasIcons = false;
    switch (key) {
      case 'stepdown':
        iconsBefore = '<i class="md-icon md-icon-fill autortl button-icon-left" style="margin-inline-end:.25em;font-size:170%;">&#xe020;</i>';
        if (speed !== 1) {
          iconsBefore = '<div class="button-icon-left" style="margin-inline-end:.2em;">' + speed + '</div>' + iconsBefore;
        }
        hasIcons = true;
        break;
      case 'stepup':
        iconsAfter += '<i class="md-icon md-icon-fill autortl button-icon-right" style="margin-inline-start:.25em;font-size:170%;">&#xe01f;</i>';
        if (speed !== 1) {
          iconsAfter += '<div class="button-icon-right" style="margin-inline-start:.2em;">' + speed + '</div>';
        }
        hasIcons = true;
        break;
      default:
        break;
    }
    if (iconsBefore) {
      html = '<div class="osd-controller-iconsbeforeposition flex align-items-center">' + iconsBefore + '</div>' + html;
    }
    if (iconsAfter) {
      html = html + '<div class="osd-controller-iconsafterposition flex align-items-center">' + iconsAfter + '</div>';
    }
    elem.innerHTML = html;
    if (instance.options.setPositionSliderPosition) {
      if (!pct) {
        pct = 0;
      }
      if (instance.enableProgressByTimeOfDay) {
        pct = 0;
      }
      if (SupportsCalcMin) {
        var offsetWidth = elem.offsetWidth || 0;
        if (!offsetWidth) {
          if (html) {
            offsetWidth = elem._lastOffsetWidth || 0;
          }
        } else {
          elem._lastOffsetWidth = offsetWidth;
        }
        elem.style[insetInlineStartProp] = 'max(calc(' + pct + '% - ' + offsetWidth / 2 + 'px), 0%)';
        var durationTextElem = instance.options.durationTextElem;
        if (durationTextElem) {
          var pctToHideEndTime = hasIcons ? 82 : 84;
          if (pct >= pctToHideEndTime) {
            durationTextElem.style.opacity = 0;
          } else {
            durationTextElem.style.opacity = null;
          }
        }
      }
    }
  }
  var DefaultSpeed = 1;
  function setDefaultSpeed(instance) {
    instance.repeatingPositionSliderKeySpeed = DefaultSpeed;
  }
  function onIntervalPositionSlider() {
    var instance = this;
    var options = instance.options;
    var slider = options.nowPlayingPositionSlider;
    var key = instance.repeatingPositionSliderKey;
    var speed = instance.repeatingPositionSliderKeySpeed;
    var sliderMin = slider.min;
    var sliderMax = slider.max;
    var multipliers = [1, 3, 6, 12, 18];
    var stepMultiplier = multipliers[speed - 1];
    switch (key) {
      case 'stepdown':
        instance.nowPlayingSliderValue = Math.min(Math.max(instance.nowPlayingSliderValue - stepMultiplier * convertMsToNowPlayingSliderStep(instance, 1000), sliderMin), sliderMax);
        break;
      case 'stepup':
        instance.nowPlayingSliderValue = Math.min(Math.max(instance.nowPlayingSliderValue + stepMultiplier * convertMsToNowPlayingSliderStep(instance, 1000), sliderMin), sliderMax);
        break;
      default:
        return;
    }
    console.log('onIntervalPositionSlider, key: ' + key + ', speed: ' + speed);
    if (instance.nowPlayingSliderValue <= sliderMin) {
      instance.nowPlayingSliderValue = sliderMin;
      slider.endEditing(true, sliderMin);
    } else if (instance.nowPlayingSliderValue >= sliderMax) {
      instance.nowPlayingSliderValue = sliderMax;
      slider.endEditing(true, sliderMax);
    } else {
      slider.beginEditing(instance.nowPlayingSliderValue);
      //slider.setValue(instance.nowPlayingSliderValue, true);
    }
  }
  function clearIncrementIntervalForPositionSlider(instance) {
    if (instance.intervalForPositionSlider) {
      clearInterval(instance.intervalForPositionSlider);
      instance.intervalForPositionSlider = null;
    }
  }
  function startIncrementIntervalForPositionSlider(instance) {
    if (!instance.intervalForPositionSlider) {
      setDefaultSpeed(instance);
      instance.intervalForPositionSlider = setInterval(instance.bound_intervalForPositionSlider, 100);
    }
  }
  function convertMsToNowPlayingSliderStep(instance, ms) {
    var runtimeTicks = instance.nowPlayingSliderRunTimeTicks;
    if (runtimeTicks) {
      return ms * 10000 / runtimeTicks * 100;
    }
    var options = instance.options;
    var nowPlayingPositionSlider = options.nowPlayingPositionSlider;
    return parseFloat(nowPlayingPositionSlider.step);
  }
  function cancelPositionSliderEditing(instance) {
    var options = instance.options;
    var nowPlayingPositionSlider = options.nowPlayingPositionSlider;
    nowPlayingPositionSlider.cancelEditing();
  }
  function onPositionSliderBeginEditing(e) {
    //console.log('onPositionSliderBeginEditing');

    var instance = this;
    instance.ignoreStepKeyUp = false;
    startIncrementIntervalForPositionSlider(instance);
  }
  function onPositionSliderEndEditing(e) {
    //console.log('onPositionSliderEndEditing');

    var instance = this;
    instance.repeatingPositionSliderKey = null;
    setDefaultSpeed(instance);
    clearIncrementIntervalForPositionSlider(instance);
  }
  function onPositionSliderKeyUp(e) {
    var instance = this;
    var slider = e.target;
    var key = _keyboard.default.normalizeKeyFromEvent(e);
    var stepUpCommand;
    var stepDownCommand;
    if (document.dir === 'rtl') {
      stepUpCommand = 'ArrowLeft';
      stepDownCommand = 'ArrowRight';
    } else {
      stepUpCommand = 'ArrowRight';
      stepDownCommand = 'ArrowLeft';
    }
    var ignoreStepKeyUp = instance.ignoreStepKeyUp;
    console.log('onPositionSliderKeyUp, repeatingPositionSliderKey: ' + instance.repeatingPositionSliderKey + ', ignoreStepKeyUp: ' + ignoreStepKeyUp);
    var wasRepeating = instance.repeatingPositionSliderKey;
    switch (key) {
      case 'MediaRewind':
      case stepDownCommand:
        if (!wasRepeating && !ignoreStepKeyUp) {
          console.log('OsdController: rewind');
          instance.nowPlayingSliderValue = Math.min(Math.max(instance.nowPlayingSliderValue - convertMsToNowPlayingSliderStep(instance, _usersettings.default.skipBackLength()), slider.min), slider.max);
          if (slider.dragging) {
            slider.endEditing(true, instance.nowPlayingSliderValue);
          } else {
            slider.endEditing(false, instance.nowPlayingSliderValue);
            // this will use seekRelative which in some cases may lead to a better result
            _playbackmanager.default.rewind(instance.currentPlayer);
          }
        }
        instance.ignoreStepKeyUp = false;
        break;
      case 'MediaFastForward':
      case stepUpCommand:
        if (!wasRepeating && !ignoreStepKeyUp) {
          console.log('OsdController: fastForward');
          instance.nowPlayingSliderValue = Math.min(Math.max(instance.nowPlayingSliderValue + convertMsToNowPlayingSliderStep(instance, _usersettings.default.skipForwardLength()), slider.min), slider.max);
          if (slider.dragging) {
            slider.endEditing(true, instance.nowPlayingSliderValue);
          } else {
            slider.endEditing(false, instance.nowPlayingSliderValue);
            // this will use seekRelative which in some cases may lead to a better result
            _playbackmanager.default.fastForward(instance.currentPlayer);
          }
        }
        instance.ignoreStepKeyUp = false;
        break;
      default:
        break;
    }
  }
  function onPositionSliderInput(e) {
    onPositionSliderEndEditing.call(this, e);
  }
  function changeSpeed(instance, slider, direction) {
    if (!slider.dragging) {
      return;
    }
    var currentDirection = instance.repeatingPositionSliderKey;
    if (!currentDirection) {
      return;
    }
    var speedOffset;
    if (currentDirection === direction) {
      speedOffset = 1;
    } else {
      speedOffset = -1;
    }
    var currentSpeed = instance.repeatingPositionSliderKeySpeed;
    var newSpeed = Math.max(0, Math.min(4, currentSpeed + speedOffset));
    if (newSpeed <= DefaultSpeed - 1 && newSpeed !== currentSpeed) {
      instance.ignoreStepKeyUp = true;
      slider.endEditing(true, instance.nowPlayingSliderValue);
      return;
    }
    instance.repeatingPositionSliderKeySpeed = newSpeed;
  }
  function beginOrEndEditing(instance, slider, newValue, positionSliderKey) {
    var sliderMin = slider.min;
    var sliderMax = slider.max;
    if (newValue <= sliderMin) {
      instance.nowPlayingSliderValue = sliderMin;
      slider.endEditing(true, sliderMin);
    } else if (newValue >= sliderMax) {
      instance.nowPlayingSliderValue = sliderMax;
      slider.endEditing(true, sliderMax);
    } else {
      if (instance.repeatingPositionSliderKey !== positionSliderKey) {
        setDefaultSpeed(instance);
      }
      instance.repeatingPositionSliderKey = positionSliderKey;
      slider.beginEditing(instance.nowPlayingSliderValue);
    }
  }
  function onPositionSliderInputCommand(e) {
    var instance = this;
    var slider = e.target;
    var stepUpCommand;
    var stepDownCommand;
    if (document.dir === 'rtl') {
      stepUpCommand = 'left';
      stepDownCommand = 'right';
    } else {
      stepUpCommand = 'right';
      stepDownCommand = 'left';
    }
    switch (e.detail.command) {
      case stepDownCommand:
      case 'rewind':
        e.preventDefault();
        if (e.detail.repeat) {
          var sliderMin = slider.min;
          var sliderMax = slider.max;
          var newValue = Math.min(Math.max(instance.nowPlayingSliderValue - convertMsToNowPlayingSliderStep(instance, 1000), sliderMin), sliderMax);
          beginOrEndEditing(instance, slider, newValue, 'stepdown');
        } else {
          changeSpeed(instance, slider, 'stepdown');
        }
        break;
      case stepUpCommand:
      case 'fastforward':
        e.preventDefault();
        if (e.detail.repeat) {
          var _sliderMin = slider.min;
          var _sliderMax = slider.max;
          var _newValue = Math.min(Math.max(instance.nowPlayingSliderValue + convertMsToNowPlayingSliderStep(instance, 1000), _sliderMin), _sliderMax);
          beginOrEndEditing(instance, slider, _newValue, 'stepup');
        } else {
          changeSpeed(instance, slider, 'stepup');
        }
        break;
      case 'channelup':
        instance.onChannelUp(e);
        break;
      case 'channeldown':
        instance.onChannelDown(e);
        break;
      case 'pageup':
        instance.onPageUp(e);
        break;
      case 'pagedown':
        instance.onPageDown(e);
        break;
      case 'back':
        if (slider.dragging) {
          e.preventDefault();
        }
        cancelPositionSliderEditing(instance);
        break;
      case 'play':
      case 'playpause':
        if (slider.dragging) {
          e.preventDefault();
          e.stopPropagation();
          console.log('osdcontroller - endEditing');
          slider.endEditing(true, instance.nowPlayingSliderValue);
        }
        break;
      case 'select':
        if (slider.dragging) {
          e.preventDefault();
          e.stopPropagation();
          slider.endEditing(true, instance.nowPlayingSliderValue);
        } else {
          if (!instance.intervalForPositionSlider) {
            console.log('osdcontroller - playpause from select command');
            _playbackmanager.default.playPause(instance.currentPlayer);
            e.preventDefault();
          }
        }
        break;
      default:
        break;
    }
  }
  function onPositionSliderChange(e) {
    var slider = e.target;
    var player = this.currentPlayer;
    var newPercent = parseFloat(slider.value);
    if (this.enableProgressByTimeOfDay) {
      var startDateMs = this.visualStartDateMs;
      var newTimeMs = (this.visualEndDateMs - startDateMs) * (newPercent / 100);
      newTimeMs += startDateMs;
      newTimeMs -= this.wallClockStartTimeMs;
      var newTimeTicks = newTimeMs * 10000;
      _playbackmanager.default.seek(newTimeTicks, player);
    } else {
      _playbackmanager.default.seekPercent(newPercent, player);
    }
  }
  function onSliderDisplayValueUpdate(e) {
    var detail = e.detail;
    var value = detail.value;
    var enableProgressByTimeOfDay = this.enableProgressByTimeOfDay;
    if (enableProgressByTimeOfDay) {

      //
    } else {
      var currentRuntimeTicks = this.nowPlayingSliderRunTimeTicks;
      if (!currentRuntimeTicks) {
        return;
      }
      var options = this.options;
      var positionTextElem = options.positionTextElem;
      var draggingPositionTicks = currentRuntimeTicks;
      draggingPositionTicks /= 100;
      draggingPositionTicks *= value;
      updateTimeText(this, positionTextElem, draggingPositionTicks, value);
    }
  }
  function OsdController(options) {
    this.options = options;
    this.visualStartDateMs = 0;
    this.visualEndDateMs = 0;
    this.wallClockStartTimeMs = 0;
    this.nowPlayingSliderValue = 0;
    var nowPlayingPositionSlider = options.nowPlayingPositionSlider;
    _inputmanager.default.on(nowPlayingPositionSlider, onPositionSliderInputCommand.bind(this));
    _dom.default.addEventListener(nowPlayingPositionSlider, 'keyup', onPositionSliderKeyUp.bind(this), {
      passive: true
    });
    _dom.default.addEventListener(nowPlayingPositionSlider, 'input', onPositionSliderInput.bind(this), {
      passive: true
    });
    nowPlayingPositionSlider.addEventListener('beginediting', onPositionSliderBeginEditing.bind(this));
    nowPlayingPositionSlider.addEventListener('endediting', onPositionSliderEndEditing.bind(this));
    nowPlayingPositionSlider.addEventListener('displayvaluechange', onSliderDisplayValueUpdate.bind(this));
    _dom.default.addEventListener(nowPlayingPositionSlider, 'change', onPositionSliderChange.bind(this), {
      passive: true
    });
    this.bound_intervalForPositionSlider = onIntervalPositionSlider.bind(this);
    setDefaultSpeed(this);

    // the height is to prevent layout shift when hiding or showing the ff/rew arrows
    var positionTextElem = options.positionTextElem;
    if (positionTextElem) {
      positionTextElem.style.height = '1.7em';
    }
  }
  function setElementDisabled(instance, btn, disabled) {
    var isFocused = btn === document.activeElement;
    btn.disabled = disabled;
    if (disabled && isFocused) {
      _focusmanager.default.autoFocus(instance.options.parentElement);
    }
  }
  function updatePositionSliderDisabled(instance, state) {
    var options = instance.options;
    var nowPlayingPositionSlider = options.nowPlayingPositionSlider;
    if (!nowPlayingPositionSlider) {
      return;
    }
    if (!nowPlayingPositionSlider.dragging) {
      var playState = state.PlayState || {};
      setElementDisabled(instance, nowPlayingPositionSlider, !playState.CanSeek || instance.disablePositionSlider === true);
    }
  }
  OsdController.prototype.updatePlayerState = function (event, player, state) {
    var _state$MediaSource;
    var options = this.options;
    var nowPlayingPositionSlider = options.nowPlayingPositionSlider;
    updatePositionSliderDisabled(this, state);

    // determines if both forward and backward buffer progress will be visible
    // check IsInfiniteStream so that this will return false for youtube trailers
    var isProgressClear = state.MediaSource && state.MediaSource.RunTimeTicks == null && state.MediaSource.IsInfiniteStream;
    nowPlayingPositionSlider.setIsClear(isProgressClear);
    if ((_state$MediaSource = state.MediaSource) != null && _state$MediaSource.WallClockStart) {
      var wallClockStartDate = _datetime.default.parseISO8601Date(state.MediaSource.WallClockStart);
      console.log('wall clock start: ' + wallClockStartDate);
      this.wallClockStartTimeMs = wallClockStartDate.getTime();
      this.visualStartDateMs = Math.min(this.visualStartDateMs || this.wallClockStartTimeMs, this.wallClockStartTimeMs || this.visualStartDateMs);
    }
    this.updateNowPlayingInfo(event, player, state);
  };
  function shouldEnableProgressByTimeOfDay(item, mediaSource) {
    if (item.Type === 'TvChannel' && item.CurrentProgram && mediaSource && !mediaSource.RunTimeTicks) {
      return true;
    }
    if (item.Type === 'Recording' && item.StartDate && item.EndDate && mediaSource && !mediaSource.RunTimeTicks) {
      return true;
    }
    return false;
  }
  function getDisplayItem(item, currentDisplayItem) {
    if (!item.Id) {
      return Promise.resolve({
        originalItem: item
      });
    }
    if (currentDisplayItem) {
      if (currentDisplayItem.Id === item.Id) {
        return Promise.resolve({
          originalItem: item,
          displayItem: currentDisplayItem.CurrentProgram || currentDisplayItem
        });
      }
    }

    //if (item.Type === 'TvChannel') {

    var apiClient = _connectionmanager.default.getApiClient(item.ServerId);
    return apiClient.getItem(apiClient.getCurrentUserId(), item.Id, {
      ExcludeFields: 'VideoChapters,VideoMediaSources,MediaStreams'
    }).then(function (refreshedItem) {
      return {
        originalItem: item,
        displayItem: refreshedItem.CurrentProgram || refreshedItem
      };
    });
    //}
  }
  OsdController.prototype.updateNowPlayingInfo = function (event, player, state) {
    this.currentItemThumbnailsPromise = null;
    this.currentItemThumbnails = null;
    var item = state.NowPlayingItem;
    this.currentItem = item;
    var options = this.options;
    var nowPlayingPositionSlider = options.nowPlayingPositionSlider;
    if (!item) {
      setElementDisabled(this, nowPlayingPositionSlider, true);
      this.enableProgressByTimeOfDay = false;
      this.currentChapters = null;
      this.currentDisplayChapters = null;
      this.currentDisplayItem = null;
      this.currentMediaSource = null;
      _events.default.trigger(this, 'displayitemupdated', [item, null, state]);
      return;
    }
    this.currentMediaSource = state.MediaSource;
    this.enableProgressByTimeOfDay = shouldEnableProgressByTimeOfDay(item, state.MediaSource);
    nowPlayingPositionSlider.setForceDisplayThumb(this.enableProgressByTimeOfDay);
    if (this.enableProgressByTimeOfDay) {
      nowPlayingPositionSlider.getTrackBackgroundUpper().classList.add('emby-slider-background-upper-accent');
    } else {
      nowPlayingPositionSlider.getTrackBackgroundUpper().classList.remove('emby-slider-background-upper-accent');
    }
    var instance = this;
    getDisplayItem(item, this.currentDisplayItem).then(function (itemInfo) {
      var item = itemInfo.originalItem;
      instance.currentItem = item;
      var displayItem = itemInfo.displayItem || item;
      instance.currentDisplayItem = displayItem;
      _events.default.trigger(instance, 'displayitemupdated', [item, displayItem, state]);
      instance.updateDisplayItem(state, item, displayItem);
    });
  };
  function getChaptersForDisplay(chapters, mediaSource) {
    var list = [];
    for (var i = 0, length = chapters.length; i < length; i++) {
      var chapter = chapters[i];
      if (!chapter.MarkerType || chapter.MarkerType === 'Chapter') {
        var nextChapter = chapters[i + 1];
        var durationTicks = ((nextChapter == null ? void 0 : nextChapter.StartPositionTicks) || (mediaSource == null ? void 0 : mediaSource.RunTimeTicks) || 0) - chapter.StartPositionTicks;
        if (durationTicks >= 0) {
          chapter.DurationTicks = durationTicks;
        }
        list.push(chapter);
      }
    }
    return list;
  }
  function initChapterList(chapters, displayItem, mediaSource) {
    var mediaStreams = (mediaSource || {}).MediaStreams || [];
    var videoStream = mediaStreams.filter(function (i) {
      return i.Type === 'Video';
    })[0] || {};
    var aspect = null;
    if (videoStream.Width && videoStream.Height) {
      aspect = videoStream.Width / videoStream.Height;
    }
    for (var i = 0, length = chapters.length; i < length; i++) {
      var chapter = chapters[i];
      chapter.ServerId = displayItem.ServerId;
      chapter.MediaType = displayItem.MediaType;
      chapter.PrimaryImageAspectRatio = aspect;
      if (chapter.ItemId == null) {
        chapter.ItemId = displayItem.Id;
      }
      chapter.MediaSourceId = mediaSource.Id;
      chapter.Type = 'Chapter';
      chapter.Id = 'chapter_' + chapter.ItemId + '_' + chapter.StartPositionTicks;
      if (chapter.ChapterIndex == null) {
        chapter.ChapterIndex = i;
      }
    }
  }
  OsdController.prototype.updateDisplayItem = function (state, item, displayItem) {
    this.currentChapters = item.Chapters || displayItem.Chapters || [];
    initChapterList(this.currentChapters, this.currentDisplayItem, this.currentMediaSource);
    this.currentDisplayChapters = getChaptersForDisplay(this.currentChapters, state.MediaSource);
    this.currentItemThumbnailsPromise = null;
    this.currentItemThumbnails = null;
    updatePositionSliderDisabled(this, state);
    if (this.enableProgressByTimeOfDay) {
      var programStartDateMs = displayItem.StartDate ? _datetime.default.parseISO8601Date(displayItem.StartDate).getTime() : 0;
      this.visualStartDateMs = Math.min(programStartDateMs || this.wallClockStartTimeMs, this.wallClockStartTimeMs || programStartDateMs);
      this.visualEndDateMs = displayItem.EndDate ? _datetime.default.parseISO8601Date(displayItem.EndDate).getTime() : 0;
    } else {
      this.visualStartDateMs = 0;
      this.visualEndDateMs = 0;
    }
  };
  OsdController.prototype.onPlayPauseStateChanged = function (paused) {
    this.paused = paused;
    var options = this.options;
    var positionTextElem = options.positionTextElem;
    if (paused) {
      var _positionTextElem$que;
      (_positionTextElem$que = positionTextElem.querySelector('.osdcontroller-pauseicon')) == null || _positionTextElem$que.classList.remove('hide');
    } else {
      var _positionTextElem$que2;
      (_positionTextElem$que2 = positionTextElem.querySelector('.osdcontroller-pauseicon')) == null || _positionTextElem$que2.classList.add('hide');
    }
  };
  OsdController.prototype.onPlayerTimeUpdate = function (positionTicks, runtimeTicks, seekableRanges) {
    //console.log('seekable ranges: ' + JSON.stringify(seekableRanges));
    var options = this.options;
    var nowPlayingPositionSlider = options.nowPlayingPositionSlider;
    var enableProgressByTimeOfDay = this.enableProgressByTimeOfDay;
    var positionTextElem = options.positionTextElem;
    var durationTextElem = options.durationTextElem;
    var isPositionSliderDragging = nowPlayingPositionSlider == null ? void 0 : nowPlayingPositionSlider.dragging;
    if (enableProgressByTimeOfDay) {
      if (nowPlayingPositionSlider && !isPositionSliderDragging) {
        var wallClockStartTimeMs = this.wallClockStartTimeMs;
        var visualStartDateMs = this.visualStartDateMs;
        var visualEndDateMs = this.visualEndDateMs;
        var startDateMs = visualStartDateMs;
        if (startDateMs && visualEndDateMs) {
          var currentTimeMs = wallClockStartTimeMs + (positionTicks || 0) / 10000;
          var seekRuntimeMs = visualEndDateMs - startDateMs;
          setDisplayTime(positionTextElem, startDateMs);
          if (durationTextElem) {
            setDisplayTime(durationTextElem, visualEndDateMs);
          }
          this.nowPlayingSliderRunTimeTicks = seekRuntimeMs * 10000;
          nowPlayingPositionSlider.step = getStep(this.nowPlayingSliderRunTimeTicks);
          this.nowPlayingSliderValue = getDisplayPercentByTimeOfDay(startDateMs, seekRuntimeMs, currentTimeMs);
          nowPlayingPositionSlider.setValue(this.nowPlayingSliderValue);
          if (seekableRanges.length) {
            var rangeStart = getDisplayPercentByTimeOfDay(startDateMs, seekRuntimeMs, wallClockStartTimeMs + (seekableRanges[0].start || 0) / 10000);
            var rangeEnd = getDisplayPercentByTimeOfDay(startDateMs, seekRuntimeMs, wallClockStartTimeMs + (seekableRanges[0].end || 0) / 10000);
            nowPlayingPositionSlider.setSeekRanges([{
              start: rangeStart,
              end: rangeEnd
            }]);
          } else {
            nowPlayingPositionSlider.setSeekRanges([]);
          }
        } else {
          nowPlayingPositionSlider.step = 0.01;
          this.nowPlayingSliderRunTimeTicks = null;
          this.nowPlayingSliderValue = 0;
          nowPlayingPositionSlider.setValue(0);
          nowPlayingPositionSlider.setSeekRanges([]);
        }
      }
    } else {
      this.nowPlayingSliderRunTimeTicks = runtimeTicks;
      var pct = 0;
      if (runtimeTicks) {
        pct = positionTicks / runtimeTicks;
        pct *= 100;
      }
      if (nowPlayingPositionSlider && !isPositionSliderDragging) {
        if (runtimeTicks) {
          nowPlayingPositionSlider.step = getStep(runtimeTicks);
          this.nowPlayingSliderValue = pct;
          nowPlayingPositionSlider.setValue(pct);
          if (durationTextElem) {
            var mediaSource = this.currentMediaSource;
            if (!mediaSource || mediaSource.RunTimeTicks) {
              updateDurationText(durationTextElem, enableProgressByTimeOfDay, runtimeTicks - positionTicks, this.currentDisplayItem, true);
            } else {
              updateDurationText(durationTextElem, enableProgressByTimeOfDay, runtimeTicks, this.currentDisplayItem, false);
            }
          }
        } else {
          nowPlayingPositionSlider.step = 0.01;
          this.nowPlayingSliderValue = 0;
          nowPlayingPositionSlider.setValue(0);
          if (durationTextElem) {
            updateDurationText(durationTextElem, enableProgressByTimeOfDay, runtimeTicks, this.currentDisplayItem);
          }
        }
      }
      if (nowPlayingPositionSlider) {
        nowPlayingPositionSlider.setSeekRanges([]);
        //nowPlayingPositionSlider.setSeekRanges(seekableRanges, runtimeTicks, positionTicks);
      }
      if (isPositionSliderDragging && runtimeTicks) {

        //    let draggingPositionTicks = runtimeTicks;
        //    draggingPositionTicks /= 100;
        //    draggingPositionTicks *= this.nowPlayingSliderValue;

        //    updateTimeText(this, positionTextElem, draggingPositionTicks);
      } else {
        updateTimeText(this, positionTextElem, positionTicks, pct);
      }
    }
  };
  function getImgUrl(itemId, mediaSourceId, thumbnail, maxWidth, apiClient) {
    if (thumbnail.ImageTag) {
      return apiClient.getImageUrl(itemId, {
        maxWidth: maxWidth,
        tag: thumbnail.ImageTag,
        type: 'Thumbnail',
        PositionTicks: thumbnail.PositionTicks,
        MediaSourceId: mediaSourceId
      });
    }
    return null;
  }
  function getThumbnailBubbleHtml(nowPlayingPositionSlider, enableProgressByTimeOfDay, apiClient, itemId, mediaSourceId, thumbnailSet, chapters, positionTicks, maxThumbnailWidth) {
    var thumbnail;
    thumbnailSet = thumbnailSet || {};
    var thumbnails = thumbnailSet.Thumbnails || {};
    var bubbleElement = nowPlayingPositionSlider.getBubbleElement();
    if (thumbnails.length) {
      bubbleElement.classList.add('chapterThumbImageContainer');
      if (thumbnailSet.AspectRatio && thumbnailSet.AspectRatio < 1.4) {
        bubbleElement.classList.add('chapterThumbImageContainer-fourthree');
      } else {
        bubbleElement.classList.remove('chapterThumbImageContainer-fourthree');
      }
      bubbleElement.classList.remove('chapterThumbImageContainer-noimg');
    } else {
      bubbleElement.classList.remove('chapterThumbImageContainer', 'chapterThumbImageContainer-fourthree');
      bubbleElement.classList.add('chapterThumbImageContainer-noimg');
    }
    if (_layoutmanager.default.tv) {
      bubbleElement.classList.add('chapterThumbImageContainer-tv');
    } else {
      bubbleElement.classList.remove('chapterThumbImageContainer-tv');
    }
    for (var i = 0, length = thumbnails.length; i < length; i++) {
      var currentThumbnail = thumbnails[i];
      if (positionTicks >= currentThumbnail.PositionTicks) {
        thumbnail = currentThumbnail;
      } else if (thumbnail) {
        break;
      }
    }
    var chapter;
    for (var _i = 0, _length = chapters.length; _i < _length; _i++) {
      var currentChapter = chapters[_i];
      if (positionTicks >= currentChapter.StartPositionTicks) {
        chapter = currentChapter;
      } else if (chapter) {
        break;
      }
    }
    if (!chapter) {
      chapter = {
        Name: ''
      };
    }
    var src = thumbnail ? getImgUrl(itemId, mediaSourceId, thumbnail, maxThumbnailWidth, apiClient) : null;
    var html = '';
    var textContainerClass = 'chapterThumbTextContainer';
    if (!src) {
      textContainerClass += ' chapterThumbTextContainer-noimg';
    }
    nowPlayingPositionSlider.getBubbleElement().style.backgroundImage = src ? "url('" + src + "')" : null;
    var showTime = enableProgressByTimeOfDay || !_layoutmanager.default.tv;
    html += '<div class="' + textContainerClass + '">';
    html += '<div class="chapterThumbText">';
    html += chapter ? _dom.default.htmlEncode(chapter.Name) : '';
    html += '</div>';
    if (showTime) {
      if (src) {
        html += '<div class="chapterThumbText">';
      } else {
        html += '<div class="chapterThumbText secondaryText">';
      }
      html += _datetime.default.getDisplayRunningTime(positionTicks);
      html += '</div>';
    }
    html += '</div>';
    return html;
  }
  function getCurrentItemThumbnailsPromise(instance, itemId, mediaSourceId, apiClient, maxThumbnailWidth) {
    if (instance.currentItemThumbnailsPromise) {
      return instance.currentItemThumbnailsPromise;
    }
    var promise = apiClient.getThumbnails(itemId, {
      MediaSourceId: mediaSourceId,
      Width: maxThumbnailWidth
    }).then(function (result) {
      instance.currentItemThumbnails = result;
      return Promise.resolve(result);
    }, function () {
      instance.currentItemThumbnailsPromise = null;
    });
    instance.currentItemThumbnailsPromise = promise;
    return promise;
  }
  function refreshThumbnailsIfNeeded(instance, item, mediaSourceId, apiClient, maxThumbnailWidth) {
    // not a server item (youtube trailer)
    if (!item.Id) {
      return;
    }
    if (item.MediaType === 'Audio') {
      return;
    }
    if (instance.currentItemThumbnails || instance.currentItemThumbnailsPromise) {
      return;
    }
    getCurrentItemThumbnailsPromise(instance, item.Id, mediaSourceId, apiClient, maxThumbnailWidth);
  }
  OsdController.prototype.getPositionBubbleHtml = function (value, currentRuntimeTicks) {
    var enableProgressByTimeOfDay = this.enableProgressByTimeOfDay;
    if (enableProgressByTimeOfDay) {
      var startDateMs = this.visualStartDateMs;
      if (startDateMs && this.visualEndDateMs) {
        var ms = this.visualEndDateMs - startDateMs;
        ms /= 100;
        ms *= value;
        ms += startDateMs;
        var date = new Date(parseInt(ms));
        return '<h3 class="sliderBubbleText">' + getDisplayTimeWithoutAmPm(date, true) + '</h3>';
      } else {
        return '--:--';
      }
    } else {
      if (!currentRuntimeTicks) {
        return '--:--';
      }
      var draggingPositionTicks = currentRuntimeTicks;
      draggingPositionTicks /= 100;
      draggingPositionTicks *= value;
      var item = this.currentItem;
      if (item && this.options.enableSeekThumbnails) {
        var _this$currentMediaSou;
        var maxThumbnailWidth = 400;
        var apiClient = _connectionmanager.default.getApiClient(item.ServerId);
        var mediaSourceId = (_this$currentMediaSou = this.currentMediaSource) == null ? void 0 : _this$currentMediaSou.Id;
        refreshThumbnailsIfNeeded(this, item, mediaSourceId, apiClient, maxThumbnailWidth);
        var thumbnailSet = this.currentItemThumbnails;
        var chapters = this.currentDisplayChapters || [];
        var options = this.options;
        var nowPlayingPositionSlider = options.nowPlayingPositionSlider;
        var thumbnails = (thumbnailSet == null ? void 0 : thumbnailSet.Thumbnails) || {};
        if (chapters.length || thumbnails.length) {
          var html = getThumbnailBubbleHtml(nowPlayingPositionSlider, enableProgressByTimeOfDay, apiClient, item.Id, mediaSourceId, thumbnailSet, chapters, draggingPositionTicks, maxThumbnailWidth);
          if (html) {
            return html;
          }
        }
      }
      return '<h2 class="sliderBubbleText">' + _datetime.default.getDisplayRunningTime(draggingPositionTicks) + '</h2>';
    }
  };
  OsdController.prototype.onChannelUp = function (e) {};
  OsdController.prototype.onChannelDown = function (e) {};
  function showChannelChanger(currentItem, offset) {
    return Emby.importModule('./modules/channelchanger/channelchanger.js').then(function (ChannelChanger) {
      return ChannelChanger.onChannelChangeRequest({
        currentItem: currentItem,
        offset: offset
      });
    });
  }
  OsdController.prototype.onPageUp = function (e) {
    e.preventDefault();
    var item = this.currentItem;
    if (item) {
      if (item.Type === 'TvChannel') {
        showChannelChanger(item, 1);
        return;
      }
    }
    _playbackmanager.default.nextChapter(this.currentPlayer);
  };
  OsdController.prototype.onPageDown = function (e) {
    e.preventDefault();
    var item = this.currentItem;
    if (item) {
      if (item.Type === 'TvChannel') {
        showChannelChanger(item, -1);
        return;
      }
    }
    _playbackmanager.default.previousChapter(this.currentPlayer);
  };
  OsdController.prototype.onPlaybackStart = function (e, player, state) {
    cancelPositionSliderEditing(this);
  };
  OsdController.prototype.onPlaybackStopped = function (e, state) {
    cancelPositionSliderEditing(this);
  };
  OsdController.prototype.bindToPlayer = function (player) {
    this.currentPlayer = player;
  };
  OsdController.prototype.releaseCurrentPlayer = function () {
    cancelPositionSliderEditing(this);
    this.currentPlayer = null;
  };
  OsdController.prototype.destroy = function () {
    var _this$options;
    this.releaseCurrentPlayer();
    if ((_this$options = this.options) != null && _this$options.positionTextElem) {
      this.options.positionTextElem.innerHTML = '';
    }
    this.currentItemThumbnailsPromise = null;
    this.currentItemThumbnails = null;
    this.currentChapters = null;
    this.currentDisplayChapters = null;
    this.currentItem = null;
    this.currentDisplayItem = null;
    this.currentMediaSource = null;
    this.options = null;
  };
  var _default = _exports.default = OsdController;
});
