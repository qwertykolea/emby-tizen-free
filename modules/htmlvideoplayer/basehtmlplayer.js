define(["exports", "./../emby-apiclient/connectionmanager.js", "./../browser.js", "./../common/appsettings.js", "./../emby-apiclient/events.js"], function (_exports, _connectionmanager, _browser, _appsettings, _events) {
  Object.defineProperty(_exports, "__esModule", {
    value: true
  });
  _exports.default = void 0;
  /* jshint module: true */

  var isNativeLG = globalThis.appMode === 'webos';
  function BaseHtmlPlayer() {
    this.type = 'mediaplayer';
    this.boundOnVolumeChange = onVolumeChange.bind(this);
    this.boundOnWaiting = onWaiting.bind(this);
    this.boundOnRateChange = onRateChange.bind(this);
    this.boundOnPlay = onPlay.bind(this);
    this.boundOnPause = onPause.bind(this);
    this.boundOnEnded = onEnded.bind(this);
    this.boundOnError = onError.bind(this);
    this.boundOnTimeUpdate = onTimeUpdate.bind(this);
    this.boundOnPlaying = onPlaying.bind(this);
  }
  BaseHtmlPlayer.prototype.canPlayMediaType = function (mediaType) {
    return (mediaType || '').toLowerCase() === this.mediaType;
  };
  BaseHtmlPlayer.prototype.currentSrc = function () {
    return this._currentSrc;
  };
  function getDeviceProfileInternal(item, options) {
    if (!options) {
      options = {};
    }
    return Emby.importModule('./modules/browserdeviceprofile.js').then(function (profileBuilder) {
      return profileBuilder({
        item: item
      });
    });
  }
  BaseHtmlPlayer.prototype.getDeviceProfile = function (item, options) {
    var instance = this;
    return getDeviceProfileInternal(item, options).then(function (profile) {
      instance._lastProfile = profile;
      return profile;
    });
  };

  // Save this for when playback stops, because querying the time at that point might return 0
  BaseHtmlPlayer.prototype.currentTime = function (val) {
    var mediaElement = this._mediaElement;
    if (mediaElement) {
      if (val != null) {
        mediaElement.currentTime = val / 1000;
        return;
      }
      var currentTime = this._currentTime;
      if (currentTime) {
        return currentTime * 1000;
      }

      // avoid wiping out resume position by starting and stopping immediately
      if (!this._timeUpdated) {
        var _this$_currentPlayOpt;
        var ticks = (_this$_currentPlayOpt = this._currentPlayOptions) == null ? void 0 : _this$_currentPlayOpt.playerStartPositionTicks;
        if (ticks != null) {
          return ticks / 10000;
        }
      }
      return (mediaElement.currentTime || 0) * 1000;
    }
  };
  function isValidDuration(duration) {
    if (duration && !isNaN(duration) && duration !== Number.POSITIVE_INFINITY && duration !== Number.NEGATIVE_INFINITY) {
      return true;
    }
    return false;
  }
  BaseHtmlPlayer.prototype.duration = function (val) {
    var mediaElement = this._mediaElement;
    if (mediaElement) {
      var duration = mediaElement.duration;
      if (isValidDuration(duration)) {
        return duration * 1000;
      }
    }
    return null;
  };
  function getRanges(instance, elem, timeRanges) {
    var ranges = [];
    var offset;
    var currentPlayOptions = instance._currentPlayOptions;
    if (currentPlayOptions) {
      offset = currentPlayOptions.transcodingOffsetTicks;
    }
    offset = offset || 0;
    for (var i = 0, length = timeRanges.length; i < length; i++) {
      var start = timeRanges.start(i);
      var end = timeRanges.end(i);
      if (!isValidDuration(start)) {
        start = 0;
      }
      if (!isValidDuration(end)) {
        end = 0;
        continue;
      }
      ranges.push({
        start: start * 10000000 + offset,
        end: end * 10000000 + offset
      });
    }
    return ranges;
  }
  BaseHtmlPlayer.prototype.getBufferedRanges = function () {
    var mediaElement = this._mediaElement;
    if (mediaElement) {
      return getRanges(this, mediaElement, mediaElement.buffered || []);
    }
    return [];
  };
  BaseHtmlPlayer.prototype.getSeekableRanges = function () {
    var mediaElement = this._mediaElement;
    if (mediaElement) {
      return getRanges(this, mediaElement, mediaElement.seekable || []);
    }
    return [];
  };
  BaseHtmlPlayer.prototype.pause = function () {
    var mediaElement = this._mediaElement;
    if (mediaElement) {
      mediaElement.pause();
    }
  };

  // This is a retry after error
  BaseHtmlPlayer.prototype.resume = function () {
    var mediaElement = this._mediaElement;
    if (mediaElement) {
      mediaElement.play();
    }
  };
  BaseHtmlPlayer.prototype.unpause = function () {
    var mediaElement = this._mediaElement;
    if (mediaElement) {
      mediaElement.play();
    }
  };
  BaseHtmlPlayer.prototype.paused = function () {
    var mediaElement = this._mediaElement;
    if (mediaElement) {
      return mediaElement.paused;
    }
    return false;
  };
  BaseHtmlPlayer.prototype.useElementVolume = function (val) {
    if (_browser.default.chromecast) {
      return false;
    }
    return true;
  };
  BaseHtmlPlayer.prototype.setVolume = function (val) {
    if (_browser.default.chromecast) {
      cast.framework.CastReceiverContext.getInstance().setSystemVolumeLevel(val / 100);
    } else {
      var mediaElement = this._mediaElement;
      if (mediaElement) {
        mediaElement.volume = val / 100;
      }
    }
  };
  BaseHtmlPlayer.prototype.getVolume = function () {
    if (_browser.default.chromecast) {
      return cast.framework.CastReceiverContext.getInstance().getSystemVolume().level * 100;
    } else {
      var mediaElement = this._mediaElement;
      if (mediaElement) {
        return Math.min(Math.round(mediaElement.volume * 100), 100);
      }
    }
  };
  BaseHtmlPlayer.prototype.setPlaybackRate = function (val) {
    var mediaElement = this._mediaElement;
    if (mediaElement) {
      mediaElement.playbackRate = val;
    }
  };
  BaseHtmlPlayer.prototype.getPlaybackRate = function () {
    var mediaElement = this._mediaElement;
    if (mediaElement) {
      return mediaElement.playbackRate;
    }
  };
  BaseHtmlPlayer.prototype.volumeUp = function () {
    if (isNativeLG) {
      webOS.service.request('luna://com.webos.audio', {
        method: 'volumeUp'
      });
    } else {
      this.setVolume(Math.min(this.getVolume() + 2, 100));
    }
  };
  BaseHtmlPlayer.prototype.volumeDown = function () {
    if (isNativeLG) {
      webOS.service.request('luna://com.webos.audio', {
        method: 'volumeDown'
      });
    } else {
      this.setVolume(Math.max(this.getVolume() - 2, 0));
    }
  };
  BaseHtmlPlayer.prototype.setMute = function (mute) {
    var mediaElement = this._mediaElement;
    if (mediaElement) {
      mediaElement.muted = mute;
    }
  };
  BaseHtmlPlayer.prototype.isMuted = function () {
    var mediaElement = this._mediaElement;
    if (mediaElement) {
      return mediaElement.muted;
    }
    return false;
  };
  BaseHtmlPlayer.prototype.seekable = function () {
    var mediaElement = this._mediaElement;
    if (mediaElement) {
      var seekable = mediaElement.seekable;
      if (seekable && seekable.length) {
        var start = seekable.start(0);
        var end = seekable.end(0);
        if (!isValidDuration(start)) {
          start = 0;
        }
        if (!isValidDuration(end)) {
          end = 0;
        }
        return end - start > 0;
      }
      return false;
    }
  };
  function seriesImageUrl(item, options) {
    if (!item) {
      throw new Error('item cannot be null!');
    }
    if (item.Type !== 'Episode') {
      return null;
    }
    if (!options) {
      options = {};
    }
    options.type = options.type || "Primary";
    if (options.type === 'Primary') {
      if (item.SeriesPrimaryImageTag) {
        options.tag = item.SeriesPrimaryImageTag;
        return _connectionmanager.default.getApiClient(item).getImageUrl(item.SeriesId, options);
      }
    }
    if (options.type === 'Thumb') {
      if (item.ParentThumbImageTag) {
        options.tag = item.ParentThumbImageTag;
        return _connectionmanager.default.getApiClient(item).getImageUrl(item.ParentThumbItemId, options);
      }
    }
    return null;
  }
  function imageUrl(item, options) {
    if (!item) {
      throw new Error('item cannot be null!');
    }
    if (!options) {
      options = {};
    }
    options.type = options.type || "Primary";
    var imageTags = item.ImageTags || {};
    options.tag = item.PrimaryImageTag || imageTags[options.type];
    if (options.tag) {
      return _connectionmanager.default.getApiClient(item).getImageUrl(item.PrimaryImageItemId || item.Id || item.ItemId, options);
    }
    if (item.AlbumId && item.AlbumPrimaryImageTag) {
      options.tag = item.AlbumPrimaryImageTag;
      return _connectionmanager.default.getApiClient(item).getImageUrl(item.AlbumId, options);
    }
    return null;
  }
  function getPosterUrl(item) {
    var imageOptions = {};
    return seriesImageUrl(item, imageOptions) || imageUrl(item, imageOptions);
  }
  BaseHtmlPlayer.prototype.setCurrentSrcChromecast = function (elem, options, url, hasHlsTextTracks, tracksHtml) {
    elem.autoplay = true;
    var lrd = new cast.framework.messages.LoadRequestData();
    lrd.currentTime = (options.playerStartPositionTicks || 0) / 10000000;
    lrd.autoplay = true;
    lrd.media = new cast.framework.messages.MediaInformation();
    lrd.media.contentId = url;
    lrd.media.contentUrl = url;
    lrd.media.contentType = options.mimeType;
    if ((options.mimeType || '').toLowerCase() === 'application/x-mpegurl' || (options.mimeType || '').toLowerCase() === 'application/vnd.apple.mpegurl') {
      lrd.media.streamType = cast.framework.messages.StreamType.LIVE;
    } else {
      lrd.media.streamType = cast.framework.messages.StreamType.BUFFERED;
    }
    lrd.media.customData = {
      'options': options,
      'hasHlsTextTracks': hasHlsTextTracks,
      'tracksHtml': tracksHtml
    };
    var item = options.item;
    var supportImages = true;
    if (item.MediaType === 'Audio') {
      lrd.media.metadata = new cast.framework.messages.MusicTrackMediaMetadata();
      lrd.media.mediaCategory = cast.framework.messages.MediaCategory.AUDIO;
      if (item.Album) {
        lrd.media.metadata.albumName = item.Album;
      }
      if (item.IndexNumber != null) {
        lrd.media.metadata.trackNumber = item.IndexNumber;
      }
      if (item.ParentIndexNumber != null) {
        lrd.media.metadata.discNumber = item.ParentIndexNumber;
      }
      if (item.AlbumArtists && item.AlbumArtists.length) {
        lrd.media.metadata.albumArtist = item.AlbumArtists[0].Name;
      }
      if (item.ArtistItems && item.ArtistItems.length) {
        lrd.media.metadata.artist = item.ArtistItems[0].Name;
      }
      lrd.media.metadata.songTitle = item.Name;
    } else if (item.MediaType === 'Photo') {
      lrd.media.metadata = new cast.framework.messages.PhotoMediaMetadata();
      lrd.media.mediaCategory = cast.framework.messages.MediaCategory.IMAGE;
      supportImages = false;
    } else if (item.Type === 'Episode') {
      lrd.media.metadata = new cast.framework.messages.TvShowMediaMetadata();
      lrd.media.mediaCategory = cast.framework.messages.MediaCategory.VIDEO;
      if (item.SeriesName) {
        lrd.media.metadata.seriesTitle = item.SeriesName;
      }
      if (item.IndexNumber != null) {
        lrd.media.metadata.episode = item.IndexNumber;
      }
      if (item.ParentIndexNumber != null) {
        lrd.media.metadata.season = item.ParentIndexNumber;
      }
    } else if (item.Type === 'Movie' || item.Type === 'Trailer') {
      lrd.media.metadata = new cast.framework.messages.MovieMediaMetadata();
      lrd.media.mediaCategory = cast.framework.messages.MediaCategory.VIDEO;
    } else {
      lrd.media.metadata = new cast.framework.messages.GenericMediaMetadata();
      lrd.media.mediaCategory = cast.framework.messages.MediaCategory.VIDEO;
    }
    if (item.OfficialRating) {
      lrd.media.metadata.contentRating = item.OfficialRating;
    }
    lrd.media.metadata.title = item.Name;
    if (item.Studios && item.Studios.length) {
      lrd.media.metadata.studio = item.Studios[0].Name;
    }
    lrd.media.userActionStates = [cast.framework.messages.UserActionState.LIKE, cast.framework.messages.UserActionState.DISLIKE];
    if (supportImages) {
      var posterUrl = getPosterUrl(item);
      var images = [];
      if (posterUrl) {
        lrd.media.metadata.posterUrl = posterUrl;
        images.push(new cast.framework.messages.Image(lrd.media.metadata.posterUrl));
      }
      lrd.media.metadata.images = images;
    }
    function waitForLoadedDataEvent(element) {
      var eventName = 'loadeddata';
      return new Promise(function (resolve) {
        var eventListener = function (event) {
          element.removeEventListener(eventName, eventListener);
          resolve();
        };
        element.addEventListener(eventName, eventListener);
      });
    }
    console.log('loading media url into mediaManager');
    var promises = [];
    promises.push(cast.framework.CastReceiverContext.getInstance().getPlayerManager().load(lrd));

    // This is a hack for hlsjs as playerManager.Load() doesn't detect when the element is loaded. 
    if (url.indexOf('.m3u8') !== -1) {
      promises.push(waitForLoadedDataEvent(elem));
    }
    return Promise.any(promises).then(function (result) {
      return result;
    });
  };
  function requireHlsPlayer() {
    return Emby.importModule('./modules/hlsjs/hls.js').then(function (hls) {
      window.Hls = hls;
      return hls;
    });
  }
  BaseHtmlPlayer.prototype.setSrcWithHlsJs = function (elem, options, url) {
    var instance = this;
    return requireHlsPlayer().then(function (Hls) {
      var hlsOptions = {
        manifestLoadingTimeOut: 20000,
        debug: false,
        testBandwidth: false,
        emeEnabled: false
        //renderTextTracksNatively: false
        //appendErrorMaxRetry: 6
      };

      // had to exclude chromecast from this to prevent failures with 192khz flac
      if (options.mediaType === 'Audio' && !_browser.default.chromecast) {
        hlsOptions.maxMaxBufferLength = 120;
      }
      var hls = new Hls(hlsOptions);
      hls.subtitleDisplay = false;
      hls.loadSource(url);
      hls.attachMedia(elem);
      return new Promise(function (resolve, reject) {
        bindEventsToHlsPlayer(instance, hls, elem, resolve, reject);
        instance._hlsPlayer = hls;

        // This is needed in setCurrentTrackElement
        instance._currentSrc = url;
      });
    });
  };
  function setCurrentTimeIfNeeded(element, seconds, allowance) {
    if (Math.abs((element.currentTime || 0) - seconds) >= allowance) {
      element.currentTime = seconds;
    }
  }
  function setCurrentTimeIfNeededOnDelay(element, seconds, allowance) {
    setTimeout(function () {
      setCurrentTimeIfNeeded(element, seconds, allowance);
    }, 2500);
  }
  BaseHtmlPlayer.prototype.seekOnPlaybackStart = function (element, ticks) {
    var seconds = (ticks || 0) / 10000000;
    if (seconds) {
      // Appending #t=xxx to the query string doesn't seem to work with HLS
      // For plain video files, not all browsers support it either
      setCurrentTimeIfNeeded(element, seconds, 5);
      if (Math.abs((element.currentTime || 0) - seconds) >= 5) {
        setCurrentTimeIfNeededOnDelay(element, seconds, 10);
      }
    }
  };
  function onMediaManagerLoadMedia(data) {
    var media = data.media;
    var customData = media.customData;
    var val = media.contentId;
    var options = customData.options;
    var elem = this._mediaElement;
    return this.loadIntoPlayer(elem, options, val, media, data, customData).then(function () {
      return data;
    });
  }
  BaseHtmlPlayer.prototype.bindMediaManagerEvents = function () {
    cast.framework.CastReceiverContext.getInstance().getPlayerManager().setMessageInterceptor(cast.framework.messages.MessageType.LOAD, onMediaManagerLoadMedia.bind(this));

    //if (!mediaManager.defaultOnError) {
    //  mediaManager.defaultOnError = mediaManager.onError.bind(mediaManager);
    //  mediaManager.onError = onMediaManagerError.bind(this);
    //}
  };
  BaseHtmlPlayer.prototype.unBindMediaManagerEvents = function () {
    cast.framework.CastReceiverContext.getInstance().getPlayerManager().setMessageInterceptor(cast.framework.messages.MessageType.LOAD, null);

    //if (mediaManager.defaultOnError) {
    //  mediaManager.onError = mediaManager.defaultOnError.bind(mediaManager);
    //  mediaManager.defaultOnError = null;
    //}
  };
  BaseHtmlPlayer.prototype.getCrossOriginValue = function (mediaSource, playMethod) {
    if (mediaSource.IsRemote && playMethod === 'DirectPlay') {
      return null;
    }
    return 'anonymous';
  };
  function onRateChange() {
    var instance = this;
    _events.default.trigger(instance, 'playbackratechange');
  }
  function onWaiting(e) {
    var instance = this;
    _events.default.trigger(instance, 'waiting');
  }
  function onVolumeChange(e) {
    var instance = this;
    var elem = e.target;
    if (!instance._isFadingOut) {
      var _instance$_currentPla;
      if ((_instance$_currentPla = instance._currentPlayOptions) != null && _instance$_currentPla.fullscreen) {
        if (instance.useElementVolume()) {
          _appsettings.default.volume(elem.volume * 100);
        }
      }
      _events.default.trigger(instance, 'volumechange');
    }
  }
  function onPlaying(e) {
    var instance = this;
    var elem = e.target;
    if (!instance._started) {
      instance._started = true;
      instance.onStartedPlaying(elem);
    }
    _events.default.trigger(instance, 'playing');
  }
  function onPlay(e) {
    var instance = this;
    _events.default.trigger(instance, 'unpause');
  }
  function onPause() {
    var instance = this;
    _events.default.trigger(instance, 'pause');
  }
  function onTimeUpdate(e) {
    var instance = this;
    var elem = e.target;
    if (instance._started && !instance._isFadingOut) {
      // Get the player position + the transcoding offset
      var time = elem.currentTime;
      if (time && !instance._timeUpdated) {
        instance._timeUpdated = true;
        instance.onTimeUpdate(elem, time, true);
      }
      instance._currentTime = time;
      instance.onTimeUpdate(elem, time);
      _events.default.trigger(instance, 'timeupdate');
    }
  }
  function onEnded(e) {
    var instance = this;
    instance.onEnded(e.target);
  }
  function rejectWithError(reject, errorCode) {
    var e = new Error('Playback failure');
    if (errorCode) {
      e.name = errorCode;
    }
    reject(e);
  }
  function bindEventsToHlsPlayer(instance, hls, elem, resolve, reject) {
    hls.on(Hls.Events.MANIFEST_PARSED, function () {
      instance.playWithPromise(elem).then(function (result) {
        reject = null;
        resolve(result);
      }, function () {
        if (reject) {
          reject();
          reject = null;
        }
      });
    });

    //hls.on(Hls.Events.NON_NATIVE_TEXT_TRACKS_FOUND, function (event, data) {

    //    console.log('HLS NON_NATIVE_TEXT_TRACKS_FOUND: Type: ' + data.type + ' data: ' + (JSON.stringify(data) || ''));

    //});

    //hls.on(Hls.Events.CUES_PARSED, function (event, data) {

    //    console.log('HLS CUES_PARSED: Type: ' + data.type + ' Details: ' + (JSON.stringify(data)));

    //});

    hls.on(Hls.Events.ERROR, function (event, data) {
      console.log('HLS Error: Type: ' + data.type + ' Details: ' + (data.details || '') + ' Fatal: ' + (data.fatal || false) + ' Reason: ' + (data.reason || ''));
      switch (data.type) {
        case Hls.ErrorTypes.NETWORK_ERROR:
          // try to recover network error
          if (data.response && data.response.code && data.response.code >= 400) {
            console.log('hls.js response error code: ' + data.response.code);

            // Trigger failure differently depending on whether this is prior to start of playback, or after
            hls.destroy();
            if (reject) {
              rejectWithError(reject, 'servererror');
              reject = null;
            } else {
              instance.onError('servererror');
            }
            return;
          }
          break;
        default:
          break;
      }
      if (data.fatal || reject) {
        switch (data.type) {
          case Hls.ErrorTypes.NETWORK_ERROR:
            if (reject || data.response && data.response.code === 0) {
              // This could be a CORS error related to access control response headers

              if (data.response) {
                console.log('hls.js response error code: ' + data.response.code);
              }

              // Trigger failure differently depending on whether this is prior to start of playback, or after
              hls.destroy();
              if (reject) {
                rejectWithError(reject, 'network');
                reject = null;
              } else {
                instance.onError('network');
              }
            } else {
              console.log("fatal network error encountered, try to recover");
              hls.startLoad();
            }
            break;
          case Hls.ErrorTypes.MEDIA_ERROR:
            console.log("media error encountered, try to recover");
            var currentReject = reject;
            reject = null;
            if (currentReject) {
              rejectWithError(currentReject, 'mediadecodeerror');
            } else {
              handleHlsJsMediaError(instance, currentReject);
            }
            break;
          default:
            console.log('Cannot recover from hls error - destroy and trigger error');
            // cannot recover
            // Trigger failure differently depending on whether this is prior to start of playback, or after
            hls.destroy();
            if (reject) {
              rejectWithError(reject, 'mediadecodeerror');
              reject = null;
            } else {
              instance.onError('mediadecodeerror');
            }
            break;
        }
      }
    });
  }
  var recoverDecodingErrorDate, recoverSwapAudioCodecDate;
  function handleHlsJsMediaError(instance, reject) {
    var hlsPlayer = instance._hlsPlayer;
    if (!hlsPlayer) {
      return;
    }
    var now = Date.now();
    if (window.performance && window.performance.now) {
      now = performance.now();
    }
    if (!recoverDecodingErrorDate || now - recoverDecodingErrorDate > 3000) {
      recoverDecodingErrorDate = now;
      console.log('try to recover media Error ...');
      hlsPlayer.recoverMediaError();
    } else {
      if (!recoverSwapAudioCodecDate || now - recoverSwapAudioCodecDate > 3000) {
        recoverSwapAudioCodecDate = now;
        console.log('try to swap Audio Codec and recover media Error ...');
        hlsPlayer.swapAudioCodec();
        hlsPlayer.recoverMediaError();
      } else {
        console.error('cannot recover, last media error recovery failed ...');
        if (reject) {
          rejectWithError(reject, 'mediadecodeerror');
        } else {
          instance.onError('mediadecodeerror');
        }
      }
    }
  }
  function onError(e) {
    var instance = this;
    var elem = e.target;
    var error = elem.error;
    var errorCode = (error == null ? void 0 : error.code) || 0;
    var errorMessage = (error == null ? void 0 : error.message) || '';
    console.log('Media element error: ' + errorCode.toString() + ' ' + errorMessage);
    var type;
    switch (errorCode) {
      case 1:
        // MEDIA_ERR_ABORTED
        // This will trigger when changing media while something is playing
        return;
      case 2:
        // MEDIA_ERR_NETWORK
        type = 'network';
        break;
      case 3:
        // MEDIA_ERR_DECODE
        if (instance._hlsPlayer) {
          handleHlsJsMediaError(instance);
          return;
        } else {
          type = 'mediadecodeerror';
        }
        break;
      case 4:
        // MEDIA_ERR_SRC_NOT_SUPPORTED
        type = 'medianotsupported';
        break;
      default:
        // seeing cases where Edge is firing error events with no error code
        // example is start playing something, then immediately change src to something else
        return;
    }
    instance.onError(type);
  }
  BaseHtmlPlayer.prototype.onEnded = function (elem, triggerStopEvent) {
    var _cast$framework;
    var instance = this;
    instance.removeErrorEventListener(elem);
    elem.src = '';
    elem.innerHTML = '';
    elem.removeAttribute("src");
    if (typeof cast !== 'undefined' && (_cast$framework = cast.framework) != null && _cast$framework.CastReceiverContext) {
      instance.stopOnEnded = true;
      cast.framework.CastReceiverContext.getInstance().getPlayerManager().stop();
    }
    instance.destroyHlsPlayer();
    instance.destroyCastPlayer();
    var currentSrc = instance._currentSrc;
    var stopInfo = {
      src: currentSrc
    };
    if (!currentSrc) {
      triggerStopEvent = false;
    }
    if (triggerStopEvent !== false) {
      _events.default.trigger(instance, 'stopped', [stopInfo]);
    }
    instance._currentTime = null;
    instance._currentSrc = null;
    instance._currentPlayOptions = null;
  };
  BaseHtmlPlayer.prototype.addEventListeners = function (elem) {
    this.removeEventListeners(elem);
    elem.addEventListener('volumechange', this.boundOnVolumeChange);
    elem.addEventListener('ratechange', this.boundOnRateChange);
    elem.addEventListener('waiting', this.boundOnWaiting);
    elem.addEventListener('play', this.boundOnPlay);
    elem.addEventListener('pause', this.boundOnPause);
    elem.addEventListener('ended', this.boundOnEnded);
    elem.addEventListener('timeupdate', this.boundOnTimeUpdate);
    elem.addEventListener('seeked', this.boundOnTimeUpdate);
    elem.addEventListener('playing', this.boundOnPlaying);
  };
  BaseHtmlPlayer.prototype.removeErrorEventListener = function (elem) {
    elem.removeEventListener('error', this.boundOnError);
  };
  BaseHtmlPlayer.prototype.removeEventListeners = function (elem) {
    elem.removeEventListener('volumechange', this.boundOnVolumeChange);
    elem.removeEventListener('ratechange', this.boundOnRateChange);
    elem.removeEventListener('waiting', this.boundOnWaiting);
    elem.removeEventListener('play', this.boundOnPlay);
    elem.removeEventListener('pause', this.boundOnPause);
    elem.removeEventListener('ended', this.boundOnEnded);
    elem.removeEventListener('timeupdate', this.boundOnTimeUpdate);
    elem.removeEventListener('seeked', this.boundOnTimeUpdate);
    elem.removeEventListener('playing', this.boundOnPlaying);
  };
  BaseHtmlPlayer.prototype.destroyCastPlayer = function () {
    var instance = this;
    var player = instance._castPlayer;
    if (player) {
      try {
        player.unload();
      } catch (err) {
        console.log(err);
      }
      instance._castPlayer = null;
    }
  };
  BaseHtmlPlayer.prototype.destroyHlsPlayer = function () {
    var instance = this;
    var player = instance._hlsPlayer;
    if (player) {
      try {
        console.log('destroying hls player');
        player.destroy();
      } catch (err) {
        console.log(err);
      }
      instance._hlsPlayer = null;
    }
  };
  BaseHtmlPlayer.prototype.onError = function (errorType) {
    _events.default.trigger(this, 'error', [{
      type: errorType
    }]);
  };
  function onSuccessfulPlay(instance, elem) {
    instance.removeErrorEventListener(elem);
    elem.addEventListener('error', this.boundOnError);
  }
  function onPlayPromiseResolved(e) {
    return Promise.resolve({
      autoplayed: true
    });
  }
  BaseHtmlPlayer.prototype.playWithPromise = function (elem) {
    var instance = this;
    try {
      var promise = elem.play();
      if (promise && promise.then) {
        // Chrome now returns a promise
        return promise.then(onPlayPromiseResolved.bind(elem), function (e) {
          var errorName = (e.name || '').toLowerCase();

          // normalize this. saw this in chrome with audio
          if (errorName === 'notsupportederror') {
            errorName = 'medianotsupported';
          }

          // safari uses aborterror
          if (errorName === 'notallowederror' || errorName === 'aborterror') {
            // swallow this error because the user can still click the play button on the video element
            onSuccessfulPlay(instance, elem);
            return Promise.resolve({
              autoplayed: false
            });
          }
          return Promise.reject({
            name: errorName || 'notallowederror'
          });
        });
      } else {
        onSuccessfulPlay(instance, elem);
        return Promise.resolve({
          autoplayed: _browser.default.tv || _browser.default.chromecast
        });
      }
    } catch (err) {
      console.error('error calling video.play: ', err);
      return Promise.reject();
    }
  };
  BaseHtmlPlayer.prototype.onTimeUpdate = function (elem, time, isFirstTimeUpdate) {};
  BaseHtmlPlayer.prototype.onStartedPlaying = function (elem) {
    this.seekOnPlaybackStart(elem, this._currentPlayOptions.playerStartPositionTicks);
  };
  var _default = _exports.default = BaseHtmlPlayer;
});
