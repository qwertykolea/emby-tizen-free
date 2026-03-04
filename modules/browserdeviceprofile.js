define(["exports", "./browser.js", "./common/appsettings.js", "./emby-apiclient/connectionmanager.js", "./htmlvideoplayer/htmlmediahelper.js"], function (_exports, _browser, _appsettings, _connectionmanager, _htmlmediahelper) {
  Object.defineProperty(_exports, "__esModule", {
    value: true
  });
  _exports.default = _default;
  /* jshint module: true */

  var isNativeTizen = globalThis.appMode === 'tizen';
  var isNativeLG = globalThis.appMode === 'webos';
  function canPlayH264() {
    return canPlayVideoType('video/mp4; codecs="avc1.42E01E, mp4a.40.2"');
  }
  var VideoCanPlays = {};
  var AudioCanPlays = {};
  var SupportsAudioTracks = typeof document.createElement('video').audioTracks !== 'undefined';
  function canPlayAudioType(type) {
    var val = AudioCanPlays[type];
    if (val == null) {
      val = document.createElement('audio').canPlayType(type).replace(/no/, '');
      AudioCanPlays[type] = val;
    }
    return val;
  }
  function canPlayVideoType(type) {
    var val = VideoCanPlays[type];
    if (val == null) {
      val = document.createElement('video').canPlayType(type).replace(/no/, '');
      VideoCanPlays[type] = val;
    }
    return val;
  }
  function getSupportedHevcCodecTags(protocol, usefMp4, usingHlsJs) {
    if (isNativeLG && _browser.default.sdkVersion && _browser.default.sdkVersion < 2.0 && _browser.default.isFhd) {
      return [];
    }
    if (_browser.default.ps4) {
      return [];
    }
    if (isNativeTizen) {
      return ['*'];
    }
    var tags = [];

    // the mp2t tests all return false on LG, even though it does work
    if (protocol === 'hls' && !usefMp4 && !usingHlsJs && !isNativeLG) {
      if (canPlayVideoType('video/mp2t; codecs="hvc1.1.L0.0"') || canPlayVideoType('video/mp2t ; codecs="hvc1.1.6.L93.B0"')) {
        tags.push('hvc1');
      }
      if (canPlayVideoType('video/mp2t; codecs="hev1.1.L0.0"') || canPlayVideoType('video/mp2t; codecs="hev1.1.2.L150"')) {
        tags.push('hev1');
      }
      if (canPlayVideoType('video/mp2t; codecs="dvh1.04.07"') || canPlayVideoType('video/mp2t; codecs="dvh1.05.07"') || canPlayVideoType('video/mp2t; codecs="dvh1.08.07"')) {
        tags.push('dvh1');
      }
      if (canPlayVideoType('video/mp2t; codecs="dvhe.04.07"') || canPlayVideoType('video/mp2t; codecs="dvhe.05.07"') || canPlayVideoType('video/mp2t; codecs="dvhe.08.07"')) {
        tags.push('dvhe');
      }
      if (tags.length) {
        tags.push('hevc');
        tags.push('hdmv');
      }
      return tags;
    }

    // http://ott.dolby.com/codec_test/index.html
    if (canPlayVideoType('video/mp4; codecs="hvc1.1.L0.0"') || canPlayVideoType('video/mp4 ; codecs="hvc1.1.6.L93.B0"')) {
      tags.push('hvc1');
    }
    if (canPlayVideoType('video/mp4; codecs="hev1.1.L0.0"') || canPlayVideoType('video/mp4; codecs="hev1.1.2.L150"')) {
      tags.push('hev1');
    }
    if (canPlayVideoType('video/mp4; codecs="dvh1.04.07"') || canPlayVideoType('video/mp4; codecs="dvh1.05.07"') || canPlayVideoType('video/mp4; codecs="dvh1.08.07"')) {
      tags.push('dvh1');
    }
    if (canPlayVideoType('video/mp4; codecs="dvhe.04.07"') || canPlayVideoType('video/mp4; codecs="dvhe.05.07"') || canPlayVideoType('video/mp4; codecs="dvhe.08.07"')) {
      tags.push('dvhe');
    }
    if (tags.length) {
      tags.push('hevc');
      tags.push('hdmv');
    }
    return tags;
  }
  function canPlayHEVC(protocol, usefMp4, usingHlsJs) {
    return getSupportedHevcCodecTags(protocol, usefMp4, usingHlsJs).length > 0;
  }
  function canPlayAV1() {
    if (isNativeTizen && _browser.default.sdkVersion) {
      if (_browser.default.sdkVersion >= 6.0 || _browser.default.sdkVersion >= 5.5 && _browser.default.isTizenUhd) {
        return true;
      } else {
        return false;
      }
    }
    return canPlayVideoType('video/mp4; codecs="av01.0.00M.08"');
  }
  function supportsAc3InHls() {
    if (isNativeTizen || isNativeLG) {
      return true;
    }
    return canPlayVideoType('application/x-mpegurl; codecs="avc1.42E01E, ac-3"') || canPlayVideoType('application/vnd.apple.mpegURL; codecs="avc1.42E01E, ac-3"');
  }
  var _supportsTextTracks;
  function supportsTextTracks() {
    if (isNativeTizen) {
      return true;
    }
    if (_supportsTextTracks == null) {
      _supportsTextTracks = document.createElement('video').textTracks != null;
    }

    // For now, until ready
    return _supportsTextTracks;
  }
  function canPlayNativeHls() {
    if (isNativeTizen) {
      return true;
    }
    if (canPlayVideoType('application/x-mpegURL') || canPlayVideoType('application/vnd.apple.mpegURL')) {
      return true;
    }
    return false;
  }
  function canPlayAudioFormat(format) {
    var typeString;
    if (format === 'flac') {
      if (isNativeTizen || isNativeLG) {
        return true;
      }
    } else if (format === 'wma') {
      if (isNativeTizen) {
        return true;
      }
    } else if (format === 'asf') {
      if (isNativeTizen) {
        return true;
      }
    } else if (format === 'opus') {
      // Too many random issues with Opus on Tizen, and not officially supported on webOS
      if (isNativeTizen || isNativeLG) {
        return false;
      }
      typeString = 'audio/ogg; codecs="opus"';
      if (canPlayAudioType(typeString)) {
        return true;
      }
      return false;
    }
    if (format === 'webma') {
      typeString = 'audio/webm';
    } else if (format === 'mp2') {
      typeString = 'audio/mpeg';
    } else if (format === 'alac') {
      if (_browser.default.firefox) {
        // it's lying. it says maybe here
        return false;
      }
      typeString = 'audio/mp4 codecs="alac"';
    } else if (format === 'ogg' || format === 'oga') {
      // Too many random issues with Opus on Tizen, and not officially supported on webOS
      if (isNativeTizen || isNativeLG) {
        return false;
      }

      // chrome says probably, but seeing failures. let's re-evaluate - the telegraph road sample never starts playing
      typeString = 'audio/' + format;
    } else {
      typeString = 'audio/' + format;
    }
    if (canPlayAudioType(typeString)) {
      return true;
    }
    return false;
  }
  function isChromium() {
    var _navigator$userAgentD;
    var brands = ((_navigator$userAgentD = navigator.userAgentData) == null ? void 0 : _navigator$userAgentD.brands) || [];
    for (var i = 0, length = brands.length; i < length; i++) {
      if ((brands[i].brand || '').toLowerCase() === 'chromium') {
        return true;
      }
    }
    return _browser.default.chrome;
  }
  function testCanPlayMkv() {
    if (isNativeTizen || isNativeLG) {
      return true;
    }
    if (canPlayVideoType('video/x-matroska') || canPlayVideoType('video/mkv')) {
      return true;
    }

    // Not supported on opera tv
    if (_browser.default.operaTv) {
      return false;
    }

    // Unfortunately there's no real way to detect mkv support
    if (isChromium()) {
      return true;
    }
    return false;
  }
  function testCanPlayTs() {
    return isNativeTizen || isNativeLG;
  }
  function supportsMpeg2Video() {
    return isNativeTizen || isNativeLG;
  }
  function supportsVc1(forceTranscodingForVideoCodecs) {
    if (forceTranscodingForVideoCodecs.includes('vc1')) {
      return false;
    }
    return isNativeTizen || isNativeLG;
  }
  function getFlvMseDirectPlayProfile() {
    var videoAudioCodecs = ['aac'];
    videoAudioCodecs.push('mp3');
    return {
      Container: 'flv',
      Type: 'Video',
      VideoCodec: 'h264',
      AudioCodec: videoAudioCodecs.join(',')
    };
  }
  function getDirectPlayProfileForVideoContainer(container, videoAudioCodecs, forceTranscodingForContainers, forceTranscodingForVideoCodecs) {
    var supported = false;
    var profileContainer = container;
    var videoCodecs = [];
    if (forceTranscodingForContainers.includes(container)) {
      return null;
    }
    switch (container) {
      case 'asf':
        supported = isNativeTizen || isNativeLG;
        videoAudioCodecs = [];
        break;
      case 'avi':
        supported = isNativeTizen || isNativeLG;
        break;
      case 'mpg':
      case 'mpeg':
        supported = isNativeTizen || isNativeLG;
        break;
      case 'flv':
        supported = isNativeTizen;
        if (!supported && globalThis.MediaSource != null && canPlayH264()) {
          return getFlvMseDirectPlayProfile();
        }
        break;
      case '3gp':
        if (isNativeTizen || isNativeLG) {
          supported = true;
        } else {
          supported = canPlayVideoType('video/3gpp');
        }
        break;
      case 'mts':
      case 'trp':
      case 'vob':
      case 'vro':
        supported = isNativeTizen;
        break;
      case 'mov':
        // tested firefox, safari on macos, chrome, opera
        // seems to play in everything except the old ms edge
        supported = true;
        videoCodecs.push('h264');
        break;
      case 'm2ts':
        supported = isNativeTizen || isNativeLG;
        videoCodecs.push('h264');
        if (supportsVc1(forceTranscodingForVideoCodecs)) {
          videoCodecs.push('vc1');
        }
        if (supportsMpeg2Video()) {
          videoCodecs.push('mpeg2video');
        }
        break;
      case 'wmv':
        supported = isNativeTizen || isNativeLG;
        videoAudioCodecs = [];
        break;
      case 'ts':
        if (forceTranscodingForContainers.includes('mpegts')) {
          return null;
        }
        supported = testCanPlayTs();
        videoCodecs.push('h264');
        if (canPlayHEVC()) {
          videoCodecs.push('hevc');
        }
        if (supportsVc1(forceTranscodingForVideoCodecs)) {
          videoCodecs.push('vc1');
        }
        if (supportsMpeg2Video()) {
          videoCodecs.push('mpeg2video');
        }
        profileContainer = 'ts,mpegts';
        break;
      case 'rm':
        supported = isNativeTizen || isNativeLG;
        videoAudioCodecs = [];
        break;
      default:
        break;
    }
    if (!supported) {
      return null;
    }
    return {
      Container: profileContainer,
      Type: 'Video',
      VideoCodec: videoCodecs.join(','),
      AudioCodec: videoAudioCodecs.join(',')
    };
  }
  function getGlobalMaxVideoBitrate() {
    if (isNativeTizen) {
      if (_browser.default.isTizenFhd) {
        return 20000000;
      } else {
        return null;
      }
    }
    if (isNativeTizen) {
      return 20000000;
    }
    if (_browser.default.ps4) {
      return 8000000;
    }
    return null;
  }
  function supportsAc3() {
    if (isNativeTizen || isNativeLG) {
      return true;
    }
    return canPlayVideoType('audio/mp4; codecs="ac-3"');
  }
  function supportsAc4() {
    if (isNativeTizen && _browser.default.sdkVersion) {
      if (_browser.default.sdkVersion >= 6.0 || _browser.default.sdkVersion >= 4.0 && _browser.default.isTizenUhd) {
        return true;
      } else {
        return false;
      }
    }
    return canPlayVideoType('audio/mp4; codecs="ac-4"') || canPlayVideoType('video/mp4; codecs="ac-4"');
  }
  function supportsEac3() {
    if (isNativeLG && _browser.default.sdkVersion && _browser.default.sdkVersion >= 3.5) {
      return true;
    }
    if (isNativeTizen) {
      return true;
    }
    return canPlayVideoType('audio/mp4; codecs="ec-3"');
  }
  function getDefaultDecodingInfo() {
    return Promise.resolve({
      supported: true,
      smooth: true,
      isDummyInfo: true
    });
  }
  function getDecodingInfo(mediaConfig) {
    if (globalThis.cast && cast.framework && cast.framework.CastReceiverContext && cast.framework.CastReceiverContext.getInstance().canDisplayType) {
      var mimeType = mediaConfig.video.contentType.split(';')[0];
      var codecs = mediaConfig.video.contentType.split('"');
      codecs = codecs[codecs.length - 2];
      return Promise.resolve({
        supported: cast.framework.CastReceiverContext.getInstance().canDisplayType(mimeType, codecs, mediaConfig.video.width, mediaConfig.video.height, parseInt(mediaConfig.video.framerate)),
        smooth: true
      });
    }
    if (navigator.mediaCapabilities && navigator.mediaCapabilities.decodingInfo) {
      return navigator.mediaCapabilities.decodingInfo(mediaConfig).catch(getDefaultDecodingInfo);
    }
    return getDefaultDecodingInfo();
  }
  function _default(options) {
    if (!options) {
      options = {};
    }
    return Promise.all([getDecodingInfo({
      type: 'file',
      // or 'file'

      // omit audio because no matter what I test with, safari on iOS always says supported false
      video: {
        contentType: 'video/mp4; codecs="avc1.42E01E"',
        width: 3840,
        height: 2160,
        bitrate: 30000000,
        framerate: '24'
      }
    })]).then(function (responses) {
      //alert(JSON.stringify(responses));

      var physicalAudioChannels = _browser.default.tv || _browser.default.chromecast ? 6 : 2;
      var canPlayVp8 = canPlayVideoType('video/webm; codecs="vp8"');
      var canPlayVp9 = canPlayVideoType('video/webm; codecs="vp9"');
      var webmAudioCodecs = ['vorbis'];
      var canPlayMkv = testCanPlayMkv();
      var profile = {};

      // Only setting MaxStaticBitrate for older servers
      profile.MaxStreamingBitrate = profile.MaxStaticBitrate = 200000000;
      if (options.maxStaticMusicBitrate) {
        profile.MaxStaticMusicBitrate = options.maxStaticMusicBitrate;
      }
      profile.MusicStreamingTranscodingBitrate = 192000;
      profile.DirectPlayProfiles = [];
      var videoAudioCodecs = [];
      var hlsVideoAudioCodecs = [];
      var supportsMp3VideoAudio = canPlayVideoType('video/mp4; codecs="avc1.640029, mp4a.69"') || canPlayVideoType('video/mp4; codecs="avc1.640029, mp4a.6B"');

      // Not sure how to test for this
      var supportsMp2VideoAudio = isNativeTizen || isNativeLG;
      var maxVideoWidth = responses[0].supported && responses[0].smooth ? null : 1920;
      var canPlayAacVideoAudio = canPlayVideoType('video/mp4; codecs="avc1.640029, mp4a.40.2"');
      var aacAudioChannelLimit = _browser.default.chromecast ? 2 : _browser.default.xboxOne ? 6 : 0;
      if (canPlayAacVideoAudio && _browser.default.chromecast && physicalAudioChannels <= 2) {
        // prioritize this first
        videoAudioCodecs.push('aac');
      }
      var item = options.item;
      var runtimeTicks = item == null ? void 0 : item.RunTimeTicks;
      var container = item == null ? void 0 : item.Container;
      var mediaType = item == null ? void 0 : item.MediaType;
      var mediaPath = item == null ? void 0 : item.Path;
      var usingHlsJs = false;
      if (item) {
        if (_htmlmediahelper.default.enableHlsJsPlayer(runtimeTicks, mediaType)) {
          usingHlsJs = true;
        }
      }

      // Only put mp3 first if mkv support is there
      // Otherwise with HLS and mp3 audio we're seeing some browsers
      // safari is lying
      if (supportsAc3()) {
        videoAudioCodecs.push('ac3');
        var eAc3 = supportsEac3();
        if (eAc3) {
          videoAudioCodecs.push('eac3');
        }

        // This works in edge desktop, but not mobile
        // TODO: Retest this on mobile
        if (usingHlsJs || supportsAc3InHls()) {
          hlsVideoAudioCodecs.push('ac3');
          // Don't use eac3 in HLS on Tizen as it requires DVB-style descriptors
          // Waiting for server to support selectable ATSC or DVB style descriptors
          if (eAc3 && !usingHlsJs && !isNativeTizen) {
            hlsVideoAudioCodecs.push('eac3');
          }
        }
      }
      if (supportsAc4()) {
        videoAudioCodecs.push('ac4');
      }
      if (canPlayAacVideoAudio && _browser.default.chromecast && !videoAudioCodecs.includes('aac')) {
        // prioritize this first
        videoAudioCodecs.push('aac');
      }
      if (supportsMp3VideoAudio) {
        videoAudioCodecs.push('mp3');

        // PS4 fails to load HLS with mp3 audio
        if (!_browser.default.ps4) {
          // mp3 encoder only supports 2 channels, so only make that preferred if we're only requesting 2 channels
          // Also apply it for chromecast because it no longer supports AAC 5.1
          if (physicalAudioChannels <= 2) {
            hlsVideoAudioCodecs.push('mp3');
          }
        }
      }
      if (canPlayAacVideoAudio) {
        if (!videoAudioCodecs.includes('aac')) {
          videoAudioCodecs.push('aac');
        }
        hlsVideoAudioCodecs.push('aac');
      }
      if (supportsMp3VideoAudio) {
        // PS4 fails to load HLS with mp3 audio
        if (!_browser.default.ps4) {
          if (!hlsVideoAudioCodecs.includes('mp3')) {
            hlsVideoAudioCodecs.push('mp3');
          }
        }
      }
      if (supportsMp2VideoAudio) {
        videoAudioCodecs.push('mp2');
      }
      var supportsDts = isNativeTizen || _browser.default.supportsDts;

      // DTS audio not supported in Samsung 2018 models (Tizen 4.0)
      if (isNativeTizen && _browser.default.sdkVersion && _browser.default.sdkVersion >= 4.0) {
        supportsDts = false;
      }
      if (supportsDts) {
        videoAudioCodecs.push('dca');
        videoAudioCodecs.push('dts');
      }
      if (isNativeTizen || isNativeLG) {
        videoAudioCodecs.push('pcm_u8');
        videoAudioCodecs.push('pcm_s16le');
        videoAudioCodecs.push('pcm_s24le');
      }
      if (isNativeTizen && _browser.default.sdkVersion && _browser.default.sdkVersion < 6.0) {
        videoAudioCodecs.push('aac_latm');
      }
      if (canPlayAudioFormat('opus')) {
        videoAudioCodecs.push('opus');
        if (!usingHlsJs) {
          hlsVideoAudioCodecs.push('opus');
        }
        webmAudioCodecs.push('opus');
      }
      if (canPlayAudioFormat('flac')) {
        // For Tizen, don't DirectPlay flac in video files - https://emby.media/community/index.php?/topic/122400-transcode-flac-audio/
        if (!isNativeTizen) {
          videoAudioCodecs.push('flac');
        }
      }
      var mp4VideoCodecs = [];
      var hlsVideoCodecs = [];
      var enableMkvProgressive = _browser.default.chromecast && item && (container || '').indexOf('ts') === -1 && (mediaPath || '').indexOf('.avi') === -1 && runtimeTicks ? true : false;

      // don't use fmp4 for native web0s
      var usefMp4 = !isNativeTizen && !isNativeLG && !usingHlsJs;
      var apiClient = item ? _connectionmanager.default.getApiClient(item) : null;
      if (canPlayHEVC('hls', usefMp4, usingHlsJs) && usingHlsJs && apiClient != null && apiClient.isMinServerVersion('4.9.0.39')) {
        hlsVideoCodecs.push('hevc');
      }
      if (canPlayH264()) {
        mp4VideoCodecs.push('h264');
        hlsVideoCodecs.push('h264');
      }
      if (canPlayHEVC()) {
        mp4VideoCodecs.push('hevc');
      }
      if (canPlayHEVC('hls', usefMp4, usingHlsJs) && !hlsVideoCodecs.includes('hevc')) {
        hlsVideoCodecs.push('hevc');
      }
      var forceTranscodingForContainers = _appsettings.default.forceTranscodingForContainers();
      var forceTranscodingForVideoCodecs = _appsettings.default.forceTranscodingForVideoCodecs();
      var webmVideoCodecs = [];
      if (canPlayAV1()) {
        mp4VideoCodecs.push('av1');
        webmVideoCodecs.push('av1');
        if (!isNativeTizen && !isNativeLG) {
          hlsVideoCodecs.push('av1');
        }
      }
      if (supportsMpeg2Video()) {
        mp4VideoCodecs.push('mpeg2video');
      }
      if (supportsVc1(forceTranscodingForVideoCodecs)) {
        mp4VideoCodecs.push('vc1');
      }
      if (isNativeTizen) {
        mp4VideoCodecs.push('msmpeg4v2');
        if (_browser.default.sdkVersion && _browser.default.sdkVersion < 6.0) {
          hlsVideoCodecs.push('mpeg2video');
        }
      }
      if (isNativeTizen || isNativeLG) {
        mp4VideoCodecs.push('mpeg4');
      }
      if (canPlayVp8) {
        mp4VideoCodecs.push('vp8');
      }
      if (canPlayVp9) {
        mp4VideoCodecs.push('vp9');
      }
      if (canPlayVp8 || isNativeTizen) {
        videoAudioCodecs.push('vorbis');
      }
      if (mp4VideoCodecs.length) {
        profile.DirectPlayProfiles.push({
          Container: 'mp4,m4v',
          Type: 'Video',
          VideoCodec: mp4VideoCodecs.join(','),
          AudioCodec: videoAudioCodecs.join(',')
        });
      }
      if (canPlayMkv && mp4VideoCodecs.length) {
        profile.DirectPlayProfiles.push({
          Container: 'mkv',
          Type: 'Video',
          VideoCodec: mp4VideoCodecs.join(','),
          AudioCodec: videoAudioCodecs.join(',')
        });
      }

      // These are formats we can't test for but some devices will support
      ['m2ts', 'wmv', 'ts', 'asf', 'avi', 'mpg', 'mpeg', 'flv', '3gp', 'mts', 'trp', 'vob', 'vro', 'mov', 'rm'].map(function (container) {
        return getDirectPlayProfileForVideoContainer(container, videoAudioCodecs, forceTranscodingForContainers, forceTranscodingForVideoCodecs);
      }).filter(function (i) {
        return i != null;
      }).forEach(function (i) {
        profile.DirectPlayProfiles.push(i);
      });
      ['opus', 'mp3', 'mp2', 'aac', 'flac', 'alac', 'webma', 'wma', 'asf', 'wav', 'ogg', 'oga'].filter(canPlayAudioFormat).forEach(function (audioFormat) {
        if (audioFormat === 'mp2') {
          profile.DirectPlayProfiles.push({
            Container: 'mp2,mp3',
            Type: 'Audio',
            AudioCodec: audioFormat
          });
        } else if (audioFormat === 'mp3') {
          profile.DirectPlayProfiles.push({
            Container: audioFormat,
            Type: 'Audio',
            AudioCodec: audioFormat
          });
        } else if (audioFormat === 'wav') {
          profile.DirectPlayProfiles.push({
            Container: audioFormat,
            Type: 'Audio',
            AudioCodec: 'PCM_S16LE,PCM_S24LE'
          });
        } else if (audioFormat === 'aac') {
          // aac container not supported here
          if (!_browser.default.iOS && !_browser.default.osx && !_browser.default.firefox) {
            profile.DirectPlayProfiles.push({
              Container: audioFormat,
              Type: 'Audio',
              AudioCodec: audioFormat
            });
          }

          // aac also appears in the m4a container
          profile.DirectPlayProfiles.push({
            Container: 'm4a',
            AudioCodec: audioFormat,
            Type: 'Audio'
          });

          // aac also appears in the m4b container
          if (!_browser.default.tizen) {
            profile.DirectPlayProfiles.push({
              Container: 'mp4',
              AudioCodec: audioFormat,
              Type: 'Audio'
            });
          }
        } else {
          profile.DirectPlayProfiles.push({
            Container: audioFormat === 'webma' ? 'webma,webm' : audioFormat,
            Type: 'Audio'
          });
        }

        // alac also appears in the m4a container
        if (audioFormat === 'alac') {
          profile.DirectPlayProfiles.push({
            Container: 'm4a',
            AudioCodec: audioFormat,
            Type: 'Audio'
          });
        }
      });
      if (canPlayVp8) {
        webmVideoCodecs.push('VP8');
      }
      if (canPlayVp9) {
        webmVideoCodecs.push('VP9');
      }
      if (webmVideoCodecs.length) {
        profile.DirectPlayProfiles.push({
          Container: 'webm',
          Type: 'Video',
          AudioCodec: webmAudioCodecs.join(','),
          VideoCodec: webmVideoCodecs.join(',')
        });
      }
      profile.TranscodingProfiles = [];
      var hlsBreakOnNonKeyFrames = _browser.default.iOS || _browser.default.osx || !canPlayNativeHls() ? true : false;
      var minHlsSegments = '1';
      var canPlayHls = canPlayNativeHls() || usingHlsJs;
      var supportsVttInHls = usingHlsJs || isNativeTizen;
      if (canPlayHls && options.enableHls !== false) {
        profile.TranscodingProfiles.push({
          // hlsjs, edge, and android all seem to require ts container
          // seeing failures with windows chrome with aac
          Container: !usingHlsJs && isChromium() ? 'ts' : 'aac',
          Type: 'Audio',
          AudioCodec: 'aac',
          Context: 'Streaming',
          Protocol: 'hls',
          MaxAudioChannels: physicalAudioChannels.toString(),
          MinSegments: minHlsSegments,
          BreakOnNonKeyFrames: hlsBreakOnNonKeyFrames
        });
      }

      // For streaming, prioritize opus transcoding after mp3/aac. It is too problematic with random failures
      // But for static (offline sync), it will be just fine.
      // Prioritize aac higher because the encoder can accept more channels than mp3
      ['aac', 'mp3', 'opus', 'wav'].filter(canPlayAudioFormat).forEach(function (audioFormat) {
        profile.TranscodingProfiles.push({
          Container: audioFormat,
          Type: 'Audio',
          AudioCodec: audioFormat,
          Context: 'Streaming',
          Protocol: 'http',
          MaxAudioChannels: physicalAudioChannels.toString()
        });
      });
      ['opus', 'mp3', 'aac', 'wav'].filter(canPlayAudioFormat).forEach(function (audioFormat) {
        profile.TranscodingProfiles.push({
          Container: audioFormat,
          Type: 'Audio',
          AudioCodec: audioFormat,
          Context: 'Static',
          Protocol: 'http',
          MaxAudioChannels: physicalAudioChannels.toString()
        });
      });
      if (canPlayMkv && enableMkvProgressive) {
        profile.TranscodingProfiles.push({
          Container: 'mkv',
          Type: 'Video',
          AudioCodec: videoAudioCodecs.join(','),
          VideoCodec: mp4VideoCodecs.join(','),
          Context: 'Streaming',
          MaxAudioChannels: physicalAudioChannels.toString(),
          CopyTimestamps: true
        });
      }
      if (canPlayMkv) {
        profile.TranscodingProfiles.push({
          Container: 'mkv',
          Type: 'Video',
          AudioCodec: videoAudioCodecs.join(','),
          VideoCodec: mp4VideoCodecs.join(','),
          Context: 'Static',
          MaxAudioChannels: physicalAudioChannels.toString(),
          CopyTimestamps: true
        });
      }
      if (canPlayHls && hlsVideoCodecs.length && options.enableHls !== false) {
        var hlsVideoSegmentContainers = [];
        if (usefMp4) {
          hlsVideoSegmentContainers.push('m4s');
        }
        hlsVideoSegmentContainers.push('ts');
        var hlsVideoTranscodingProfile = {
          Container: hlsVideoSegmentContainers.join(','),
          Type: 'Video',
          AudioCodec: hlsVideoAudioCodecs.join(','),
          VideoCodec: hlsVideoCodecs.join(','),
          Context: 'Streaming',
          Protocol: 'hls',
          MaxAudioChannels: physicalAudioChannels.toString(),
          MinSegments: minHlsSegments,
          BreakOnNonKeyFrames: hlsBreakOnNonKeyFrames,
          ManifestSubtitles: supportsVttInHls ? 'vtt' : null
        };
        if (isNativeTizen) {
          // don't allow this to be null (only set if used)
          hlsVideoTranscodingProfile.MaxManifestSubtitles = 10;

          // https://emby.media/community/index.php?/topic/131083-transcoding-seems-to-fail-on-mpeg-films
          hlsVideoTranscodingProfile.AllowInterlacedVideoStreamCopy = false;
        }
        profile.TranscodingProfiles.push(hlsVideoTranscodingProfile);
      }
      if (canPlayVp8) {
        profile.TranscodingProfiles.push({
          Container: 'webm',
          Type: 'Video',
          AudioCodec: 'vorbis',
          VideoCodec: 'vpx',
          Context: 'Streaming',
          Protocol: 'http',
          // If audio transcoding is needed, limit channels to number of physical audio channels
          // Trying to transcode to 5 channels when there are only 2 speakers generally does not sound good
          MaxAudioChannels: physicalAudioChannels.toString()
        });
      }
      profile.TranscodingProfiles.push({
        Container: 'mp4',
        Type: 'Video',
        AudioCodec: videoAudioCodecs.join(','),
        VideoCodec: 'h264',
        Context: 'Static',
        Protocol: 'http'
      });
      profile.ContainerProfiles = [];
      profile.CodecProfiles = [];
      var supportsSecondaryAudio = isNativeTizen || SupportsAudioTracks && globalThis.AudioTrack;
      var globalVideoAudioConditions = [];
      if (!supportsSecondaryAudio) {
        globalVideoAudioConditions.push({
          Condition: 'Equals',
          Property: 'IsSecondaryAudio',
          Value: 'false',
          IsRequired: 'false'
        });
      }
      if (isNativeTizen) {
        globalVideoAudioConditions.push({
          Condition: 'LessThanEqual',
          Property: 'SampleRate',
          Value: '48000'
        });
      }
      var aacVideoAudioConditions = globalVideoAudioConditions.slice(0);
      if (aacAudioChannelLimit) {
        aacVideoAudioConditions.push({
          Condition: 'LessThanEqual',
          Property: 'AudioChannels',
          Value: aacAudioChannelLimit.toString(),
          IsRequired: true
        });
      }
      if (aacVideoAudioConditions.length) {
        profile.CodecProfiles.push({
          Type: 'VideoAudio',
          Codec: 'aac',
          Conditions: aacVideoAudioConditions
        });
      }
      var flacVideoAudioProfileConditions = globalVideoAudioConditions.slice(0);
      if (isNativeLG && _browser.default.sdkVersion && _browser.default.sdkVersion <= 4.0) {
        flacVideoAudioProfileConditions.push({
          Condition: 'LessThanEqual',
          Property: 'AudioChannels',
          Value: '6'
        });
      }
      if (flacVideoAudioProfileConditions.length) {
        profile.CodecProfiles.push({
          Type: 'VideoAudio',
          Codec: 'flac',
          Conditions: flacVideoAudioProfileConditions
        });
      }
      var vorbisVideoAudioConditions = globalVideoAudioConditions.slice(0);
      if (isNativeLG && _browser.default.sdkVersion && _browser.default.sdkVersion >= 4.0) {
        vorbisVideoAudioConditions.push({
          Condition: 'LessThanEqual',
          Property: 'AudioChannels',
          Value: '2'
        });
      }
      if (vorbisVideoAudioConditions.length) {
        profile.CodecProfiles.push({
          Type: 'VideoAudio',
          Codec: 'vorbis',
          Conditions: vorbisVideoAudioConditions
        });
      }
      if (globalVideoAudioConditions.length) {
        profile.CodecProfiles.push({
          Type: 'VideoAudio',
          Conditions: globalVideoAudioConditions
        });
      }
      var h264Profiles = 'high|main|baseline|constrained baseline';
      var maxH264Level;
      if (_browser.default.netcast || isNativeTizen || isNativeLG) {
        maxH264Level = 51;
        if (isNativeTizen && _browser.default.sdkVersion && _browser.default.sdkVersion >= 6.0) {
          maxH264Level = 52;
        }
      } else if (canPlayVideoType('video/mp4; codecs="avc1.64083e"')) {
        maxH264Level = 62;
      } else if (canPlayVideoType('video/mp4; codecs="avc1.640834"')) {
        maxH264Level = 52;
      } else if (canPlayVideoType('video/mp4; codecs="avc1.640833"')) {
        maxH264Level = 51;
      } else if (canPlayVideoType('video/mp4; codecs="avc1.640832"')) {
        maxH264Level = 50;
      } else {
        maxH264Level = 42;
      }
      if (isNativeTizen || canPlayVideoType('video/mp4; codecs="avc1.6e0033"')) {
        // These tests are passing in safari, but playback is failing
        if (!(_browser.default.osx && !_browser.default.chrome) && !_browser.default.iOS && !_browser.default.netcast && !isNativeLG) {
          h264Profiles += '|high 10';
        }
      }
      if (isNativeTizen) {
        if (_browser.default.isTizenUhd) {
          if (_browser.default.isTizen8K) {
            console.log("8K UHD is supported");
            maxVideoWidth = 7680;
          } else {
            console.log("4K UHD is supported");
            maxVideoWidth = 4096;
          }
        } else {
          console.log("FHD is supported");
          maxVideoWidth = 1920;
        }
      }
      var globalMaxVideoBitrate = (getGlobalMaxVideoBitrate() || '').toString();
      var globalVideoConditions = [];
      if (globalMaxVideoBitrate) {
        globalVideoConditions.push({
          Condition: 'LessThanEqual',
          Property: 'VideoBitrate',
          Value: globalMaxVideoBitrate
        });
      }
      if (maxVideoWidth) {
        globalVideoConditions.push({
          Condition: 'LessThanEqual',
          Property: 'Width',
          Value: maxVideoWidth.toString(),
          IsRequired: false
        });
      }

      // Confirmed required on tizen 2015, 2016, 2021, 2022, 2023
      // Confirmed not required on tizen 2017
      if (isNativeTizen && _browser.default.sdkVersion && (_browser.default.sdkVersion < 3.0 || _browser.default.sdkVersion >= 6.0)) {
        globalVideoConditions.push({
          Condition: 'Equals',
          Property: 'VideoRotation',
          Value: 0,
          IsRequired: false
        });
      }
      var h264Conditions = globalVideoConditions.slice(0);
      h264Conditions.push({
        Condition: 'EqualsAny',
        Property: 'VideoProfile',
        Value: h264Profiles,
        IsRequired: false
      });
      h264Conditions.push({
        Condition: 'LessThanEqual',
        Property: 'VideoLevel',
        Value: maxH264Level.toString(),
        IsRequired: false
      });
      profile.CodecProfiles.push({
        Type: 'Video',
        Codec: 'h264',
        Conditions: h264Conditions
      });
      var hevcConditions = globalVideoConditions.slice(0);
      var hevcTags = getSupportedHevcCodecTags();
      if (hevcTags.length && hevcTags[0] !== '*') {
        hevcConditions.push({
          Condition: 'EqualsAny',
          Property: 'VideoCodecTag',
          Value: hevcTags.join('|'),
          IsRequired: false
        });
      }
      profile.CodecProfiles.push({
        Type: 'Video',
        Codec: 'hevc',
        Conditions: hevcConditions
      });
      if (isNativeTizen && _browser.default.sdkVersion && _browser.default.sdkVersion >= 4.0) {
        globalVideoConditions.push({
          Condition: 'NotEquals',
          Property: 'VideoCodecTag',
          Value: 'xvid',
          IsRequired: false
        });
      }
      if (globalVideoConditions.length) {
        profile.CodecProfiles.push({
          Type: 'Video',
          Conditions: globalVideoConditions
        });
      }

      // Subtitle profiles
      // External vtt or burn in
      profile.SubtitleProfiles = [];
      if (supportsTextTracks()) {
        if (canPlayHls && supportsVttInHls) {
          profile.SubtitleProfiles.push({
            Format: 'vtt',
            Method: 'Hls'
          });
        }

        // this is only supported when hlsjs is used
        if (_htmlmediahelper.default.enableHlsJsPlayer(1, 'Video')) {
          profile.SubtitleProfiles.push({
            Format: 'eia_608',
            Method: 'VideoSideData',
            Protocol: 'hls'
          });
          profile.SubtitleProfiles.push({
            Format: 'eia_708',
            Method: 'VideoSideData',
            Protocol: 'hls'
          });
        }
        profile.SubtitleProfiles.push({
          Format: 'vtt',
          Method: 'External',
          AllowChunkedResponse: true
        });
      }
      profile.SubtitleProfiles.push({
        Format: 'ass',
        Method: 'External'
      });
      profile.SubtitleProfiles.push({
        Format: 'ssa',
        Method: 'External'
      });
      profile.ResponseProfiles = [];
      profile.ResponseProfiles.push({
        Type: 'Video',
        Container: 'm4v',
        MimeType: 'video/mp4'
      });
      return profile;
    });
  }
});
