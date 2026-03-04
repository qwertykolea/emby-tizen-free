define(["exports", "./../browser.js", "./../htmlvideoplayer/htmlmediahelper.js", "./../htmlvideoplayer/basehtmlplayer.js", "./../common/appsettings.js", "./../common/servicelocator.js"], function (_exports, _browser, _htmlmediahelper, _basehtmlplayer, _appsettings, _servicelocator) {
  Object.defineProperty(_exports, "__esModule", {
    value: true
  });
  _exports.default = void 0;
  /* jshint module: true */

  var fadeTimeout;
  function fade(instance, elem, startingVolume) {
    instance._isFadingOut = true;

    // Need to record the starting volume on each pass rather than querying elem.volume
    // This is due to iOS safari not allowing volume changes and always returning the system volume value

    var newVolume = Math.max(0, startingVolume - 0.15);
    console.log('fading volume to ' + newVolume);
    elem.volume = newVolume;
    if (newVolume <= 0) {
      instance._isFadingOut = false;
      return Promise.resolve();
    }
    return new Promise(function (resolve, reject) {
      cancelFadeTimeout();
      fadeTimeout = setTimeout(function () {
        fade(instance, elem, newVolume).then(resolve, reject);
      }, 100);
    });
  }
  function cancelFadeTimeout() {
    var timeout = fadeTimeout;
    if (timeout) {
      clearTimeout(timeout);
      fadeTimeout = null;
    }
  }
  function supportsFade() {
    if (!_servicelocator.appHost.supports('htmlaudio_fadeout')) {
      // Not working on tizen. 
      // We could possibly enable on other tv's, but all smart tv browsers tend to be pretty primitive
      return false;
    }
    return true;
  }
  function enableHlsPlayer(url, options, mediaSource, mediaType) {
    if (!_htmlmediahelper.default.enableHlsJsPlayer(mediaSource.RunTimeTicks, mediaType)) {
      return false;
    }
    if (url.includes('.m3u8')) {
      return true;
    }
    var mimeTypeLowered = (options.mimeType || '').toLowerCase();
    return mimeTypeLowered === 'application/x-mpegurl' || mimeTypeLowered === 'application/vnd.apple.mpegurl';
  }
  function ensureContentType(url, options, mediaSource, mediaType, signal) {
    if (url.includes('.m3u8')) {
      return Promise.resolve();
    }
    if (!_browser.default.chromecast && !_htmlmediahelper.default.enableHlsJsPlayer(mediaSource.RunTimeTicks, mediaType)) {
      return Promise.resolve();
    }

    // issue head request to get content type

    return fetch(url, {
      method: 'HEAD',
      signal: signal
    }).then(function (response) {
      var originalContentType = response.headers.get('Content-Type') || '';
      var contentType = originalContentType.toLowerCase();
      if (contentType === 'application/x-mpegurl' || contentType === 'application/vnd.apple.mpegurl') {
        options.mimeType = originalContentType;
      }
      return Promise.resolve();
    });
  }
  function stopInternal(instance, destroyPlayer, triggerStopEvent, disableFade) {
    cancelFadeTimeout();
    var elem = instance._mediaElement;
    var src = instance._currentSrc;
    if (elem) {
      if (!destroyPlayer || !supportsFade() || disableFade) {
        if (src) {
          elem.pause();
        }
        instance.onEnded(elem, triggerStopEvent);
        if (destroyPlayer) {
          instance.destroy();
        }
        return Promise.resolve();
      }
      var originalVolume = elem.volume;
      return fade(instance, elem, elem.volume).then(function () {
        elem.pause();
        elem.volume = originalVolume;
        instance.onEnded(elem);
        if (destroyPlayer) {
          instance.destroy();
        }
      });
    }
    return Promise.resolve();
  }
  function bindMediaManager(instance, elem) {
    if (_browser.default.chromecast) {
      cast.framework.CastReceiverContext.getInstance().getPlayerManager().setMediaElement(elem);
      instance.bindMediaManagerEvents();
    }
  }
  function createMediaElement(instance, playOptions) {
    var elem = instance._mediaElement;
    if (elem) {
      bindMediaManager(instance, elem);
      return elem;
    }
    elem = document.querySelector('.mediaPlayerAudio');
    if (!elem) {
      elem = document.createElement('audio');
      elem.classList.add('mediaPlayerAudio');
      elem.classList.add('hide');
      document.body.appendChild(elem);
    }
    if (playOptions.fullscreen) {
      if (instance.useElementVolume()) {
        elem.volume = _appsettings.default.volume() / 100;
      }
    } else {
      elem.volume = _appsettings.default.themeSongVolume() / 100;
    }
    instance._mediaElement = elem;
    bindMediaManager(instance, elem);
    return elem;
  }
  function rejectOnAbort(signal) {
    var reason = signal.reason;
    if (!reason) {
      reason = new Error('Aborted');
      reason.name = 'AbortError';
    }
    return Promise.reject(reason);
  }
  function HtmlAudioPlayer() {
    var self = this;
    _basehtmlplayer.default.call(this);
    this.name = 'Audio Player';
    self.id = 'htmlaudioplayer';
    self.mediaType = 'Audio';

    // Let any players created by plugins take priority
    self.priority = 1;
    self.play = function (options, signal) {
      if (signal.aborted) {
        return rejectOnAbort(signal);
      }
      self._started = false;
      self._timeUpdated = false;
      self._currentTime = null;
      var elem = createMediaElement(self, options);
      return setCurrentSrc(elem, options, signal).then(function (result) {
        if (signal.aborted) {
          stopInternal(self, false, false, true);
          return rejectOnAbort(signal);
        }
        return Promise.resolve(result);
      });
    };
    function setCurrentSrc(elem, options, signal) {
      self.removeErrorEventListener(elem);
      self.addEventListeners(elem);
      var val = options.url;
      console.log('playing url: ' + val);

      // Convert to seconds
      var seconds = (options.playerStartPositionTicks || 0) / 10000000;
      if (seconds) {
        val += '#t=' + seconds;
      }
      self.destroyHlsPlayer();
      self._currentPlayOptions = options;
      var crossOrigin = self.getCrossOriginValue(options.mediaSource, options.playMethod);
      if (crossOrigin) {
        elem.crossOrigin = crossOrigin;
      }
      return ensureContentType(val, options, options.mediaSource, 'Audio', signal).then(function () {
        if (signal.aborted) {
          return rejectOnAbort(signal);
        }
        if (_browser.default.chromecast) {
          return self.setCurrentSrcChromecast(elem, options, val);
        } else {
          return self.loadIntoPlayer(elem, options, val);
        }
      });
    }
    self.stop = function (destroyPlayer) {
      return stopInternal(this, destroyPlayer);
    };
    self.destroy = function () {
      if (_browser.default.chromecast) {
        self.unBindMediaManagerEvents();
      }
      self.removeEventListeners(self._mediaElement);
    };
  }
  Object.assign(HtmlAudioPlayer.prototype, _basehtmlplayer.default.prototype);
  HtmlAudioPlayer.prototype.loadIntoPlayer = function (elem, options, val) {
    if (enableHlsPlayer(val, options, options.mediaSource, 'Audio')) {
      return this.setSrcWithHlsJs(elem, options, val);
    }
    elem.autoplay = true;
    elem.src = val;
    this._currentSrc = val;
    return this.playWithPromise(elem);
  };
  var supportedFeatures;
  function getSupportedFeatures() {
    var list = ['Mute', 'Unmute', 'ToggleMute'];
    if (_servicelocator.appHost.supports('htmlmedia_setvolume')) {
      list.push('SetVolume');
      list.push('VolumeDown');
      list.push('VolumeUp');
    }

    // LG rejected a submission due to playback speed causing loss of audio
    if (_servicelocator.appHost.supports('htmlaudio_setplaybackrate')) {
      list.push('SetPlaybackRate');
    }
    return list;
  }
  HtmlAudioPlayer.prototype.supports = function (feature) {
    if (!supportedFeatures) {
      supportedFeatures = getSupportedFeatures();
    }
    return supportedFeatures.includes(feature);
  };
  HtmlAudioPlayer.prototype.destroy = function () {};
  var _default = _exports.default = HtmlAudioPlayer;
});
