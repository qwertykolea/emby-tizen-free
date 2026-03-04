define(["exports", "./../approuter.js", "./../emby-apiclient/events.js"], function (_exports, _approuter, _events) {
  Object.defineProperty(_exports, "__esModule", {
    value: true
  });
  _exports.default = void 0;
  /* jshint module: true */

  require(['css!modules/youtubeplayer/style.css']);
  var iframeBaseUrl = 'https://mediabrowser.github.io';
  var iframeUrl = iframeBaseUrl + '/youtube-embed';
  var YT = {
    PlayerState: {
      UNSTARTED: -1,
      ENDED: 0,
      PLAYING: 1,
      PAUSED: 2
    }
  };
  function onWindowMessage(event) {
    var _lastPlayerData, _lastPlayerData2, _lastPlayerData3;
    // Check the origin to ensure the message is from the expected source
    if (event.origin !== iframeBaseUrl) {
      // Replace with the actual origin of your iframe
      return;
    }
    var instance = this;
    var data = event.data;
    var type = data == null ? void 0 : data.type;
    var youtubeData = data == null ? void 0 : data.data;
    var lastPlayerData = instance.playerData;
    if (!lastPlayerData) {
      lastPlayerData = {};
      instance.playerData = lastPlayerData;
    }
    var resolve = (_lastPlayerData = lastPlayerData) == null ? void 0 : _lastPlayerData.resolve;
    var reject = (_lastPlayerData2 = lastPlayerData) == null ? void 0 : _lastPlayerData2.reject;
    var signal = (_lastPlayerData3 = lastPlayerData) == null ? void 0 : _lastPlayerData3.signal;
    switch (type) {
      case 'youtubePlayerReady':
        {
          var _instance$videoDialog;
          if (signal.aborted) {
            stopInternal(instance, true, false);
            reject(getSignalRejectReason(signal));
            return;
          }
          var iframe = (_instance$videoDialog = instance.videoDialog) == null ? void 0 : _instance$videoDialog.querySelector('iframe');
          if (iframe) {
            sendMessage(iframe, 'playVideo');
          }
          break;
        }
      case 'youtubeStateChange':
        {
          console.log('youtubeData: ' + youtubeData);
          lastPlayerData.state = youtubeData;
          if (youtubeData === YT.PlayerState.PLAYING) {
            var rejectFn = reject;
            lastPlayerData.reject = null;
            if (resolve) {
              if (signal.aborted) {
                stopInternal(instance, true, false);
                if (rejectFn) {
                  rejectFn(getSignalRejectReason(signal));
                }
                return;
              }
              resolve();
              lastPlayerData.resolve = null;
            }
          } else if (youtubeData === YT.PlayerState.ENDED) {
            onEndedInternal(instance, true);
          } else if (youtubeData === YT.PlayerState.PAUSED) {
            _events.default.trigger(instance, 'pause');
          }
          break;
        }
      case 'youtubeStatus':
        {
          lastPlayerData.currentTime = data.currentTime;
          lastPlayerData.volume = data.volume;
          lastPlayerData.isMuted = data.isMuted;
          lastPlayerData.duration = data.duration;
          //console.log(JSON.stringify(data));
          _events.default.trigger(instance, 'timeupdate');
          break;
        }
      case 'youtubeError':
        {
          // https://developers.google.com/youtube/iframe_api_reference#Events
          // Treat all errors as failures
          console.log('youtubeplayer, received error code during playback : ' + youtubeData);
          var _rejectFn = reject;
          if (_rejectFn) {
            lastPlayerData.reject = null;
            _rejectFn();
          } else {
            _events.default.trigger(instance, 'error');
          }
          break;
        }
      default:
        break;
    }
  }
  function createMediaElement(instance, options) {
    var dlg = document.querySelector('.youtubePlayerContainer');
    if (!dlg) {
      dlg = document.createElement('div');
      dlg.classList.add('youtubePlayerContainer');
      document.body.insertBefore(dlg, document.body.firstChild);
      instance.videoDialog = dlg;
    }
    window.removeEventListener('message', instance.boundOnWindowMessage);
    window.addEventListener('message', instance.boundOnWindowMessage);
    var videoId = new URLSearchParams(options.url.split('?')[1]).get('v');
    var src = iframeUrl + '?videoId=' + videoId;
    dlg.innerHTML = '<iframe id="player" class="flex-grow" referrerpolicy="strict-origin-when-cross-origin" type="text/html" width="' + dlg.offsetWidth + '" height="' + dlg.offsetHeight + '" src="' + src + '" frameborder="0" allowfullscreen="" allow="autoplay; encrypted-media; gyroscope; clipboard-write; web-share; accelerometer;"></iframe>';
    return dlg.querySelector('#player');
  }
  function onVideoResize() {
    var instance = this;

    // workaround wkwebview resize issues with a timeout
    setTimeout(function () {
      var _instance$videoDialog2;
      var iframe = (_instance$videoDialog2 = instance.videoDialog) == null ? void 0 : _instance$videoDialog2.querySelector('iframe');
      var dlg = instance.videoDialog;
      if (iframe && dlg) {
        sendMessage(iframe, 'setSize', [dlg.offsetWidth, dlg.offsetHeight]);
      }
    }, 100);
  }
  function onEndedInternal(instance, triggerStopped) {
    window.removeEventListener('resize', instance.resizeListener);
    window.removeEventListener('orientationChange', instance.resizeListener);
    window.removeEventListener('message', instance.boundOnWindowMessage);
    instance.playerData = null;
    if (triggerStopped) {
      var stopInfo = {};
      _events.default.trigger(instance, 'stopped', [stopInfo]);
    }
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
  function YoutubePlayer() {
    this.name = 'Youtube Player';
    this.type = 'mediaplayer';
    this.id = 'youtubeplayer';

    // Let any players created by plugins take priority
    this.priority = 1;
    this.boundOnWindowMessage = onWindowMessage.bind(this);
    this.resizeListener = onVideoResize.bind(this);
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
    if (signal.aborted) {
      return rejectOnAbort(signal);
    }
    var instance = this;
    return new Promise(function (resolve, reject) {
      if (signal.aborted) {
        reject(getSignalRejectReason(signal));
        return;
      }
      instance.playerData = {
        resolve: resolve,
        reject: reject,
        signal: signal
      };
      createMediaElement(instance, options);
      if (options.fullscreen) {
        _approuter.default.showVideoOsd();
      }
      window.removeEventListener('resize', instance.resizeListener);
      window.addEventListener('resize', instance.resizeListener);
      window.removeEventListener('orientationChange', instance.resizeListener);
      window.addEventListener('orientationChange', instance.resizeListener);
      console.log('youtube playing: ' + options.url);
    });
  };
  YoutubePlayer.prototype.isPlaying = function () {
    return this.videoDialog != null;
  };
  function stopInternal(instance, destroyPlayer, triggerStopped) {
    var _instance$videoDialog3;
    var iframe = (_instance$videoDialog3 = instance.videoDialog) == null ? void 0 : _instance$videoDialog3.querySelector('iframe');
    if (iframe) {
      sendMessage(iframe, 'stopVideo');

      // This needs a delay before the youtube player will report the correct player state
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
    var instance = this;
    if (val != null) {
      var _instance$videoDialog4;
      var iframe = (_instance$videoDialog4 = instance.videoDialog) == null ? void 0 : _instance$videoDialog4.querySelector('iframe');
      if (iframe) {
        sendMessage(iframe, 'seekTo', [val / 1000, true]);
      }
      return;
    }
    var playerData = this.playerData;
    if ((playerData == null ? void 0 : playerData.currentTime) != null) {
      return playerData.currentTime * 1000;
    }
    return null;
  };
  YoutubePlayer.prototype.duration = function (val) {
    var playerData = this.playerData;
    if ((playerData == null ? void 0 : playerData.duration) != null) {
      return playerData.duration * 1000;
    }
    return null;
  };
  function sendMessage(iframe, name, args) {
    //console.log('sending message: ' + name + ', args: ' + (args || []).join('|'));

    iframe.contentWindow.postMessage({
      type: 'youtubeCommand',
      func: name,
      args: args || []
    }, iframeBaseUrl);
  }
  YoutubePlayer.prototype.pause = function () {
    var _instance$videoDialog5;
    var instance = this;
    var iframe = (_instance$videoDialog5 = instance.videoDialog) == null ? void 0 : _instance$videoDialog5.querySelector('iframe');
    if (iframe) {
      sendMessage(iframe, 'pauseVideo');

      // This needs a delay before the youtube player will report the correct player state
      setTimeout(function () {
        _events.default.trigger(instance, 'pause');
      }, 200);
    }
  };
  YoutubePlayer.prototype.unpause = function () {
    var _instance$videoDialog6;
    var instance = this;
    var iframe = (_instance$videoDialog6 = instance.videoDialog) == null ? void 0 : _instance$videoDialog6.querySelector('iframe');
    if (iframe) {
      sendMessage(iframe, 'playVideo');

      // This needs a delay before the youtube player will report the correct player state
      setTimeout(function () {
        _events.default.trigger(instance, 'unpause');
      }, 200);
    }
  };
  YoutubePlayer.prototype.paused = function () {
    var _this$playerData;
    return ((_this$playerData = this.playerData) == null ? void 0 : _this$playerData.state) === 2;
  };
  YoutubePlayer.prototype.volume = function (val) {
    if (val != null) {
      return this.setVolume(val);
    }
    return this.getVolume();
  };
  YoutubePlayer.prototype.setVolume = function (val) {
    var _instance$videoDialog7;
    var instance = this;
    var iframe = (_instance$videoDialog7 = instance.videoDialog) == null ? void 0 : _instance$videoDialog7.querySelector('iframe');
    if (iframe) {
      sendMessage(iframe, 'setVolume', [val]);
    }
  };
  YoutubePlayer.prototype.getVolume = function () {
    var _this$playerData2;
    return (_this$playerData2 = this.playerData) == null ? void 0 : _this$playerData2.volume;
  };
  function triggerVolumeChangeOnDelay(instance) {
    //  needed because immediately querying muted status right after this it will not be reflected yet
    setTimeout(function () {
      _events.default.trigger(instance, 'volumechange');
    }, 100);
  }
  YoutubePlayer.prototype.setMute = function (mute) {
    var _instance$videoDialog8;
    var instance = this;
    var iframe = (_instance$videoDialog8 = instance.videoDialog) == null ? void 0 : _instance$videoDialog8.querySelector('iframe');
    if (iframe) {
      if (mute) {
        sendMessage(iframe, 'mute');
      } else {
        sendMessage(iframe, 'unMute');
      }
      triggerVolumeChangeOnDelay(this);
    }
  };
  YoutubePlayer.prototype.isMuted = function () {
    var _this$playerData3;
    return ((_this$playerData3 = this.playerData) == null ? void 0 : _this$playerData3.isMuted) === true;
  };
  var _default = _exports.default = YoutubePlayer;
});
