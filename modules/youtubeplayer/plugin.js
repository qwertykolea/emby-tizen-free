define(["exports", "./../approuter.js", "./../emby-apiclient/events.js", "./../common/methodtimer.js"], function (_exports, _approuter, _events, _methodtimer) {
  Object.defineProperty(_exports, "__esModule", {
    value: true
  });
  _exports.default = void 0;
  /* jshint module: true */

  //import { appHost } from './../common/servicelocator.js';

  require(['css!modules/youtubeplayer/style.css']);
  var playerVars = {
    controls: 0,
    enablejsapi: 1,
    modestbranding: 1,
    rel: 0,
    showinfo: 0,
    fs: 0,
    playsinline: 1,
    cc_load_policy: 0,
    iv_load_policy: 3,
    disablekb: 1
  };
  function createMediaElement(instance, options) {
    var dlg = document.querySelector('.youtubePlayerContainer');
    if (!dlg) {
      dlg = document.createElement('div');
      dlg.classList.add('youtubePlayerContainer');
      dlg.innerHTML = '<div id="player"></div>';
      document.body.insertBefore(dlg, document.body.firstChild);
      instance.videoDialog = dlg;
    } else {
      dlg.classList.add('youtubePlayerContainer');
    }
    return dlg.querySelector('#player');
  }
  function onVideoResize() {
    var instance = this;

    // workaround wkwebview resize issues with a timeout
    setTimeout(function () {
      var player = instance.currentYoutubePlayer;
      var dlg = instance.videoDialog;
      if (player && dlg) {
        player.setSize(dlg.offsetWidth, dlg.offsetHeight);
      }
    }, 100);
  }
  function clearTimeUpdateInterval(instance) {
    if (instance.timeUpdateInterval) {
      instance.timeUpdateInterval.destroy();
    }
    instance.timeUpdateInterval = null;
  }
  function onEndedInternal(instance, triggerStopped) {
    clearTimeUpdateInterval(instance);
    var resizeListener = instance.resizeListener;
    if (resizeListener) {
      window.removeEventListener('resize', resizeListener);
      window.removeEventListener('orientationChange', resizeListener);
      instance.resizeListener = null;
    }
    if (triggerStopped) {
      var stopInfo = {};
      _events.default.trigger(instance, 'stopped', [stopInfo]);
    }
    if (instance.currentYoutubePlayer) {
      instance.currentYoutubePlayer.destroy();
    }
    instance.currentYoutubePlayer = null;
  }
  function onTimeUpdate(e) {
    _events.default.trigger(this, 'timeupdate');
  }
  function getSignalRejectReason(signal) {
    var reason = signal.reason;
    if (!reason) {
      reason = new Error('Aborted');
      reason.name = 'AbortError';
    }
    return reason;
  }
  function rejectOnAbort(signal) {
    return Promise.reject(getSignalRejectReason(signal));
  }
  function setCurrentSrc(instance, elem, options, signal) {
    if (signal.aborted) {
      return rejectOnAbort(signal);
    }
    if (options.fullscreen) {
      _approuter.default.showVideoOsd();
    }
    return new Promise(function (resolve, reject) {
      if (signal.aborted) {
        reject(getSignalRejectReason(signal));
        return;
      }
      console.log('youtube playing: ' + options.url);
      var params = new URLSearchParams(options.url.split('?')[1]);
      // 3. This function creates an <iframe> (and YouTube player)
      //    after the API code downloads.

      window.onYouTubeIframeAPIReady = function () {
        if (signal.aborted) {
          reject(getSignalRejectReason(signal));
          return;
        }
        var YT = globalThis.YT;
        instance.currentYoutubePlayer = new YT.Player('player', {
          height: instance.videoDialog.offsetHeight,
          width: instance.videoDialog.offsetWidth,
          videoId: params.get('v'),
          events: {
            'onReady': function (event) {
              if (signal.aborted) {
                stopInternal(instance, true, false);
                reject(getSignalRejectReason(signal));
                return;
              }
              event.target.playVideo();
            },
            'onStateChange': function (event) {
              if (event.data === YT.PlayerState.PLAYING) {
                var rejectFn = reject;
                reject = null;
                if (resolve) {
                  if (signal.aborted) {
                    stopInternal(instance, true, false);
                    if (rejectFn) {
                      rejectFn(getSignalRejectReason(signal));
                    }
                    return;
                  }
                  resolve();
                  resolve = null;
                }
                if (!instance.timeUpdateInterval) {
                  instance.timeUpdateInterval = new _methodtimer.default({
                    onInterval: onTimeUpdate.bind(instance),
                    timeoutMs: 500,
                    type: 'interval'
                  });
                }
              } else if (event.data === YT.PlayerState.ENDED) {
                onEndedInternal(instance, true);
              } else if (event.data === YT.PlayerState.PAUSED) {
                _events.default.trigger(instance, 'pause');
              }
            },
            'onError': function (event) {
              // https://developers.google.com/youtube/iframe_api_reference#Events
              // Treat all errors as failures
              console.log('youtubeplayer, received error code during playback : ' + event.data);
              var rejectFn = reject;
              if (rejectFn) {
                reject = null;
                rejectFn();
              } else {
                _events.default.trigger(instance, 'error');
              }
            }
          },
          playerVars: Object.assign({}, playerVars)
        });
        var resizeListener = instance.resizeListener;
        if (resizeListener) {
          window.removeEventListener('resize', resizeListener);
          window.addEventListener('resize', resizeListener);
        } else {
          resizeListener = instance.resizeListener = onVideoResize.bind(instance);
          window.addEventListener('resize', resizeListener);
        }
        window.removeEventListener('orientationChange', resizeListener);
        window.addEventListener('orientationChange', resizeListener);
      };
      if (!window.YT) {
        var tag = document.createElement('script');
        tag.src = "https://www.youtube.com/iframe_api";
        var firstScriptTag = document.getElementsByTagName('script')[0];
        firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
      } else {
        window.onYouTubeIframeAPIReady();
      }
    });
  }
  function YoutubePlayer() {
    this.name = 'Youtube Player';
    this.type = 'mediaplayer';
    this.id = 'youtubeplayer';

    // Let any players created by plugins take priority
    this.priority = 1;
  }
  var supportedFeatures;
  function getSupportedFeatures() {
    var list = ['VolumeUp', 'VolumeDown', 'Mute', 'Unmute', 'ToggleMute', 'SetVolume'];
    return list;
  }
  YoutubePlayer.prototype.supports = function (feature) {
    if (!supportedFeatures) {
      supportedFeatures = getSupportedFeatures();
    }
    return supportedFeatures.indexOf(feature) !== -1;
  };
  YoutubePlayer.prototype.play = function (options, signal) {
    var instance = this;
    var elem = createMediaElement(this, options);
    return setCurrentSrc(instance, elem, options, signal);
  };
  YoutubePlayer.prototype.isPlaying = function () {
    return this.currentYoutubePlayer != null;
  };
  function stopInternal(instance, destroyPlayer, triggerStopped) {
    var currentYoutubePlayer = instance.currentYoutubePlayer;
    if (currentYoutubePlayer) {
      if (currentYoutubePlayer.stopVideo) {
        currentYoutubePlayer.stopVideo();
      }
      onEndedInternal(instance, triggerStopped);
    }
    if (destroyPlayer) {
      instance.destroy();
    }
  }
  YoutubePlayer.prototype.stop = function (destroyPlayer) {
    stopInternal(this, destroyPlayer, true);
    return Promise.resolve();
  };
  YoutubePlayer.prototype.destroy = function () {
    var dlg = this.videoDialog;
    if (dlg) {
      this.videoDialog = null;
      dlg.parentNode.removeChild(dlg);
    }
  };
  YoutubePlayer.prototype.canPlayMediaType = function (mediaType) {
    switch (mediaType) {
      case 'Audio':
      case 'Video':
        return true;
      default:
        return false;
    }
  };
  YoutubePlayer.prototype.canPlayItem = function (item) {
    // Does not play server items
    return false;
  };
  YoutubePlayer.prototype.canPlayUrl = function (url) {
    return url.toLowerCase().includes('youtube.com');
  };
  YoutubePlayer.prototype.getDeviceProfile = function () {
    return Promise.resolve({});
  };
  YoutubePlayer.prototype.setSubtitleStreamIndex = function (index) {};
  YoutubePlayer.prototype.canSetAudioStreamIndex = function () {
    return false;
  };
  YoutubePlayer.prototype.setAudioStreamIndex = function (index) {};

  // Save this for when playback stops, because querying the time at that point might return 0
  YoutubePlayer.prototype.currentTime = function (val) {
    var currentYoutubePlayer = this.currentYoutubePlayer;
    if (currentYoutubePlayer && currentYoutubePlayer.getCurrentTime) {
      if (val != null) {
        currentYoutubePlayer.seekTo(val / 1000, true);
        return;
      }
      return currentYoutubePlayer.getCurrentTime() * 1000;
    }
  };
  YoutubePlayer.prototype.duration = function (val) {
    var currentYoutubePlayer = this.currentYoutubePlayer;
    if (currentYoutubePlayer && currentYoutubePlayer.getDuration) {
      return currentYoutubePlayer.getDuration() * 1000;
    }
    return null;
  };
  YoutubePlayer.prototype.pause = function () {
    var currentYoutubePlayer = this.currentYoutubePlayer;
    if (currentYoutubePlayer && currentYoutubePlayer.pauseVideo) {
      currentYoutubePlayer.pauseVideo();
      var instance = this;

      // This needs a delay before the youtube player will report the correct player state
      setTimeout(function () {
        _events.default.trigger(instance, 'pause');
      }, 200);
    }
  };
  YoutubePlayer.prototype.unpause = function () {
    var currentYoutubePlayer = this.currentYoutubePlayer;
    if (currentYoutubePlayer && currentYoutubePlayer.playVideo) {
      currentYoutubePlayer.playVideo();
      var instance = this;

      // This needs a delay before the youtube player will report the correct player state
      setTimeout(function () {
        _events.default.trigger(instance, 'unpause');
      }, 200);
    }
  };
  YoutubePlayer.prototype.paused = function () {
    var currentYoutubePlayer = this.currentYoutubePlayer;
    if (currentYoutubePlayer && currentYoutubePlayer.getPlayerState) {
      return currentYoutubePlayer.getPlayerState() === 2;
    }
    return false;
  };
  YoutubePlayer.prototype.volume = function (val) {
    if (val != null) {
      return this.setVolume(val);
    }
    return this.getVolume();
  };
  YoutubePlayer.prototype.setVolume = function (val) {
    var currentYoutubePlayer = this.currentYoutubePlayer;
    if (currentYoutubePlayer) {
      if (val != null) {
        currentYoutubePlayer.setVolume(val);
      }
    }
  };
  YoutubePlayer.prototype.getVolume = function () {
    var currentYoutubePlayer = this.currentYoutubePlayer;
    if (currentYoutubePlayer && currentYoutubePlayer.getVolume) {
      return currentYoutubePlayer.getVolume();
    }
  };
  function triggerVolumeChangeOnDelay(instance) {
    //  needed because immediately querying muted status right after this it will not be reflected yet
    setTimeout(function () {
      _events.default.trigger(instance, 'volumechange');
    }, 100);
  }
  YoutubePlayer.prototype.setMute = function (mute) {
    var currentYoutubePlayer = this.currentYoutubePlayer;
    if (mute) {
      if (currentYoutubePlayer && currentYoutubePlayer.mute) {
        currentYoutubePlayer.mute();
        triggerVolumeChangeOnDelay(this);
      }
    } else {
      if (currentYoutubePlayer && currentYoutubePlayer.unMute) {
        currentYoutubePlayer.unMute();
        triggerVolumeChangeOnDelay(this);
      }
    }
  };
  YoutubePlayer.prototype.isMuted = function () {
    var currentYoutubePlayer = this.currentYoutubePlayer;
    if (currentYoutubePlayer && currentYoutubePlayer.isMuted) {
      return currentYoutubePlayer.isMuted();
    }
  };
  var _default = _exports.default = YoutubePlayer;
});
