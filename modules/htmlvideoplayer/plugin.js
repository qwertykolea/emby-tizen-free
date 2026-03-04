define(["exports", "./../htmlvideoplayer/htmlmediahelper.js", "./../htmlvideoplayer/basehtmlplayer.js", "./../emby-apiclient/events.js", "./../emby-apiclient/connectionmanager.js", "./../approuter.js", "./../browser.js", "./../common/globalize.js", "./../common/usersettings/usersettings.js", "./../common/subtitleappearancehelper.js", "./../common/playback/playbackmanager.js", "./../common/appsettings.js", "./../common/servicelocator.js"], function (_exports, _htmlmediahelper, _basehtmlplayer, _events, _connectionmanager, _approuter, _browser, _globalize, _usersettings, _subtitleappearancehelper, _playbackmanager, _appsettings, _servicelocator) {
  Object.defineProperty(_exports, "__esModule", {
    value: true
  });
  _exports.default = void 0;
  /* jshint module: true */

  require(['css!modules/htmlvideoplayer/style.css']);
  var isNativeLG = globalThis.appMode === 'webos';
  var WebVTT;
  function tryRemoveElement(elem) {
    // Seeing crashes in edge webview
    try {
      elem.remove();
    } catch (err) {
      console.error('Error removing dialog element: ', err);
    }
  }
  function enableChunkedResponse(track) {
    if (typeof TextDecoder === 'undefined') {
      return false;
    }
    if (typeof ReadableStream === 'undefined') {
      return false;
    }
    if (track.DeliveryMethod === 'External' && track.IsChunkedResponse) {
      return true;
    }
    return false;
  }
  function enableNativeTrackSupport(currentSrc, track) {
    if (track) {
      if (track.DeliveryMethod === 'Embed') {
        return true;
      }
      if (track.DeliveryMethod === 'Hls') {
        return true;
      }
      if (track.DeliveryMethod === 'VideoSideData') {
        return true;
      }
      if (enableChunkedResponse(track)) {
        return false;
      }
      var format = (track.Codec || '').toLowerCase();
      if (format === 'ssa' || format === 'ass') {
        // custom renderer needed here
        return false;
      }
    }

    // subs getting blocked due to CORS
    if (_browser.default.chromecast) {
      if ((currentSrc || '').toLowerCase().indexOf('.m3u8') !== -1) {
        return false;
      }
    }
    if (isNativeLG && _browser.default.sdkVersion && _browser.default.sdkVersion < 3.0) {
      return false;
    }
    return true;
  }
  function getMediaStreamTracks(mediaSource, type) {
    return mediaSource.MediaStreams.filter(function (s) {
      return s.Type === type;
    });
  }
  function getMediaStreamSubtitleTracks(mediaSource) {
    return mediaSource.MediaStreams.filter(function (s) {
      return s.Type === 'Subtitle';
    });
  }
  function setTracks(elem, tracksHtml) {
    elem.innerHTML = tracksHtml;
  }
  function getTextTrackUrl(track, item, mediaSource) {
    if (mediaSource.IsLocal && track.Path) {
      return track.Path;
    }
    return _playbackmanager.default.getSubtitleUrl(track, item.ServerId);
  }
  function getTracksHtml(tracks, item, mediaSource) {
    return tracks.map(function (t) {
      if (t.DeliveryMethod !== 'External') {
        return '';
      }
      if (t.Codec === 'ass' || t.Codec === 'ssa') {
        return '';
      }
      var textTrackUrl = getTextTrackUrl(t, item, mediaSource);
      // don't mark the track as default initially because a long subtitle extraction will still the video player
      // instead, select the track after playback starts
      var defaultAttribute = /*mediaSource.DefaultSubtitleStreamIndex === t.Index ? ' default' :*/'';
      var language = t.Language || 'und';
      var label = t.Language || 'und';
      return '<track id="textTrack' + t.Index + '" label="' + label + '" kind="subtitles" src="' + textTrackUrl + '" srclang="' + language + '"' + defaultAttribute + ' />\n';
    }).join('');
  }
  function containsHlsTextTracks(tracks) {
    return tracks.filter(function (t) {
      return t.DeliveryMethod === 'Hls';
    }).length > 0;
  }
  function getSupportedAudioStreams(instance) {
    var currentPlayOptions = instance._currentPlayOptions;
    if (!currentPlayOptions) {
      return [];
    }
    var mediaSource = currentPlayOptions.mediaSource;
    var profile = instance._lastProfile;
    return getMediaStreamTracks(mediaSource, 'Audio').filter(function (stream) {
      return _playbackmanager.default.isAudioStreamSupported(stream, mediaSource, profile);
    });
  }
  function renderCues(instance, cues, hasBeenReset) {
    var subtitleTextElement = instance.videoSubtitlesElem;
    if (subtitleTextElement && WebVTT) {
      WebVTT.processCues(window, cues, subtitleTextElement, instance.webVTTStyleOptions, hasBeenReset);
    } else {
      console.log('renderCues: nothing to do');
    }
  }
  function rejectOnAbort(signal) {
    var reason = signal.reason;
    if (!reason) {
      reason = new Error('Aborted');
      reason.name = 'AbortError';
    }
    return Promise.reject(reason);
  }
  function setSubtitleAppearance(instance) {
    var enablePositionFromSettings = instance.enableSubtitlePositionFromSettings;
    var appearanceSettings = _usersettings.default.getSubtitleAppearanceSettings();
    var subtitleStyles = _subtitleappearancehelper.default.getStyleObjects(appearanceSettings);
    var positionTop = enablePositionFromSettings ? appearanceSettings.positionTop : '0';
    if (positionTop != null) {
      try {
        document.documentElement.style.setProperty('--subtitles-window-top', positionTop + '%');
      } catch (err) {
        console.error('error setting --subtitles-window-top css variable', err);
      }
    }
    var positionBottom = enablePositionFromSettings ? appearanceSettings.positionBottom : '0';
    if (positionBottom != null) {
      try {
        document.documentElement.style.setProperty('--subtitles-window-bottom', positionBottom + '%');
      } catch (err) {
        console.error('error setting --subtitles-window-bottom css variable', err);
      }
    }
    instance.webVTTStyleOptions = {
      textStyle: subtitleStyles.text,
      windowStyle: subtitleStyles.window
    };
  }
  function onUserSettingsChange(e, name) {
    var _instance$_mediaEleme;
    var instance = this;
    switch (name) {
      case 'localplayersubtitleappearance3':
        setSubtitleAppearance(instance);
        var textTracks = ((_instance$_mediaEleme = instance._mediaElement) == null ? void 0 : _instance$_mediaEleme.textTracks) || [];
        for (var i = 0, length = textTracks.length; i < length; i++) {
          var track = textTracks[i];
          var trackMode = track.mode;
          if (trackMode !== 'showing' && trackMode !== 'hidden') {
            continue;
          }
          var cues = track.cues;
          if (cues) {
            // use try catch to prevent occasional crashing seen on edge-uwp
            try {
              renderCues(instance, track.activeCues, true);
            } catch (err) {
              console.error('error in renderCues: ', err);
            }
          }
        }
        break;
      default:
        break;
    }
  }
  function destroyCustomTrack(instance, videoElement) {
    if (instance._resizeObserver) {
      instance._resizeObserver.disconnect();
      instance._resizeObserver = null;
    }
    if (instance.videoSubtitlesElem) {
      tryRemoveElement(instance.videoSubtitlesElem);
      instance.videoSubtitlesElem = null;
    }
    instance.currentTrackEvents = null;
    if (videoElement) {
      var allTracks = videoElement.textTracks || []; // get list of tracks
      for (var i = 0; i < allTracks.length; i++) {
        var currentTrack = allTracks[i];
        if (currentTrack.label.indexOf('manualTrack') !== -1) {
          currentTrack.mode = 'disabled';
        }
      }
    }
    instance.customTrackIndex = -1;
    instance.currentClock = null;
    instance._currentSubtitleOffset = 0;
    var subtitlesOctopus = instance.currentSubtitlesOctopus;
    if (subtitlesOctopus) {
      subtitlesOctopus.dispose();
      instance.currentSubtitlesOctopus = null;
    }
    var renderer = instance.currentAssRenderer;
    if (renderer) {
      renderer.setEnabled(false);
    }
    instance.currentAssRenderer = null;
  }
  function getCueCss(appearance, selector) {
    var html = selector + '::cue {';
    html += appearance.text.map(function (s) {
      return s.name + ':' + s.value + ' !important;';
    }).join('');
    html += '}';
    for (var i = 0, length = appearance.text.length; i < length; i++) {
      var prop = appearance.text[i];
      if (prop.name === 'background-color') {
        // this is for safari, although it won't work on all devices
        html += ' ' + selector + '::-webkit-media-text-track-display-backdrop {background-color: ' + prop.value + '!important;}';
      }
    }
    return html;
  }
  function setCueAppearance(instance) {
    var elementId = instance.id + '-cuestyle';
    var styleElem = document.querySelector('#' + elementId);
    if (!styleElem) {
      styleElem = document.createElement('style');
      styleElem.id = elementId;
      styleElem.type = 'text/css';
      document.getElementsByTagName('head')[0].appendChild(styleElem);
    }
    var appearanceSettings = _usersettings.default.getSubtitleAppearanceSettings();
    styleElem.innerHTML = getCueCss(_subtitleappearancehelper.default.getStyles(appearanceSettings, {
      isCue: true
    }), '.htmlvideoplayer');
  }
  function filterElementTextTracks(tracks, kind) {
    var list = [];
    for (var i = 0, length = tracks.length; i < length; i++) {
      var track = tracks[i];
      if (track.kind === kind) {
        list.push(track);
      }
    }
    return list;
  }
  function getNormalizedIndex(track) {
    var index = track.Index || 0;
    if (track.DeliveryMethod === 'VideoSideData') {
      index += 1000;
    }
    return index;
  }
  function sortMediaStreamTextTracks(trackA, trackB) {
    var aIndex = getNormalizedIndex(trackA);
    var bIndex = getNormalizedIndex(trackB);
    if (aIndex < bIndex) {
      return -1;
    }
    if (aIndex > bIndex) {
      return 1;
    }
    return 0;
  }
  function requiresCustomSubtitlesElement(track) {
    if (isNativeLG && _browser.default.sdkVersion && _browser.default.sdkVersion < 3.0) {
      return true;
    }
    if (enableChunkedResponse(track)) {
      return true;
    }
    return false;
  }
  function loadWebVTT() {
    return Emby.importModule('./modules/webvtt/vtt.js').then(function (response) {
      WebVTT = response;
      return WebVTT;
    });
  }
  function readChunks(reader, decoder, currentPartialChunk, onChunk, signal) {
    return reader.read().then(function (result) {
      if (result.done) {
        if (currentPartialChunk) {
          onChunk(currentPartialChunk);
        }
        return Promise.resolve();
      }
      if (signal != null && signal.aborted) {
        return rejectOnAbort(signal);
      }
      var value = result.value;
      var chunkText = decoder.decode(value, {
        stream: true
      }); // { stream: true } indicates more data might be coming

      if (!chunkText.trim().length) {
        if (currentPartialChunk) {
          onChunk(currentPartialChunk);
        }
        currentPartialChunk = '';
      } else if (chunkText) {
        currentPartialChunk += chunkText;
      }
      return readChunks(reader, decoder, currentPartialChunk, onChunk, signal);
    });
  }
  function fetchSubtitleContent(url, returnNullIfSecureContext, chunked, onChunk, signal) {
    // Chromecast is only allowing the worker to fetch content from https addresses, so we have to prefetch it here
    if (returnNullIfSecureContext) {
      if (url.toLowerCase().startsWith('https://') || url.toLowerCase().startsWith('http://localhost') || url.toLowerCase().startsWith('http://127.0.0.1')) {
        return Promise.resolve(null);
      }
    }
    var fetchRequest = {
      method: 'GET',
      credentials: 'same-origin'
    };
    if (signal) {
      fetchRequest.signal = signal;
    }
    return fetch(url, fetchRequest).then(function (response) {
      if (chunked) {
        var body = response.body;
        if (body != null && body.getReader) {
          var reader = body.getReader();
          var decoder = new TextDecoder("utf8");
          return readChunks(reader, decoder, '', onChunk, signal);
        }
        return response.text().then(onChunk);
      }
      return response.text();
    });
  }
  function fetchVttSubtitles(track, item, mediaSource, onCue, signal) {
    var promises = [loadWebVTT()];
    return Promise.all(promises).then(function (responses) {
      var url = getTextTrackUrl(track, item, mediaSource);
      var WebVTT = responses[0];
      var parser = new WebVTT.Parser(window, WebVTT.StringDecoder());
      parser.oncue = onCue;
      function onChunk(vtt) {
        console.log('onchunk: ' + vtt);
        parser.parse(vtt);
        parser.flush();
      }
      if (enableChunkedResponse(track)) {
        return fetchSubtitleContent(url, false, true, onChunk, signal);
      } else {
        return fetchSubtitleContent(url, false, false, null, signal).then(onChunk);
      }
    });
  }
  function isCanvasSupported() {
    var elem = document.createElement('canvas');
    return !!(elem.getContext && elem.getContext('2d'));
  }
  function isWebWorkerSupported() {
    return !!window.Worker;
  }
  function requiresExternalFontDownload(track) {
    var language = (track.Language || '').toLowerCase();
    if (!language) {
      return true;
    }
    var langsNotNeedingFont = ['dut', 'nld', 'nl', 'eng', 'en', 'en-us', 'en-gb', 'fin', 'fi', 'fre', 'fra', 'fr', 'ger', 'deu', 'de', 'heb', 'he', 'hun', 'hu', 'ita', 'it', 'nor', 'no', 'pol', 'pl', 'por', 'pt', 'pob', 'pt-br', 'rus', 'ru', 'spa', 'es', 'es-mx', 'es-419', 'swe', 'sv'];
    return !langsNotNeedingFont.includes(language) && !langsNotNeedingFont.includes(language.split('-')[0]);
  }
  var SupportAttachmentFonts = !_browser.default.chromecast;
  function isSupportedFontType(codec) {
    switch ((codec == null ? void 0 : codec.toLowerCase()) || '') {
      case 'otf':
      case 'ttf':
      case '':
        return true;
      default:
        return false;
    }
  }
  function getAttachmentFonts(apiClient, mediaSource, subtitleStream) {
    if (!SupportAttachmentFonts || subtitleStream.IsExternal) {
      return [];
    }
    return mediaSource.MediaStreams.filter(function (i) {
      if (i.Type === 'Attachment') {
        if (i.DeliveryUrl && isSupportedFontType(i.Codec)) {
          return true;
        }
      }
      return false;
    }).map(function (i) {
      return {
        title: i.DisplayTitle,
        codec: i.Codec,
        url: apiClient.serverAddress() + i.DeliveryUrl
      };
    });
  }
  function getAvailableFonts(apiClient, mediaSource, subtitleStream) {
    return getAttachmentFonts(apiClient, mediaSource, subtitleStream).map(function (i) {
      var _i$title;
      var obj = {};
      obj[((_i$title = i.title) == null ? void 0 : _i$title.toLowerCase()) || 'unknown'] = i.url;
      return obj;
    });
  }
  function getFontUrls(apiClient, mediaSource, subtitleStream) {
    return getAttachmentFonts(apiClient, mediaSource, subtitleStream).map(function (i) {
      return i.url;
    });
  }
  function fetchAsBlobUrl(url) {
    return new Promise(function (resolve, reject) {
      var xhr = new XMLHttpRequest();
      xhr.open('GET', url, true);
      xhr.responseType = 'blob';
      xhr.onload = function (e) {
        resolve(URL.createObjectURL(this.response));
      };
      xhr.onerror = reject;
      xhr.send();
    });
  }
  function getFallbackFontUrl(track) {
    // on some platforms the worker can't download the included font directly
    // needed for older LG models
    var useBlobUrl = isNativeLG && _browser.default.sdkVersion && _browser.default.sdkVersion < 5.0;
    if (useBlobUrl) {
      return fetchAsBlobUrl(_approuter.default.baseUrl() + '/bower_components/javascriptsubtitlesoctopus/dist/default.woff2');
    }
    if (requiresExternalFontDownload(track)) {
      return Promise.resolve(_approuter.default.baseUrl() + '/modules/fonts/GoNotoKurrent.woff2');
    }
    return Promise.resolve(null);
  }
  function onVideoResize() {
    var instance = this;
    if (_browser.default.iOS || _browser.default.osx) {
      // with wkwebview, the new sizes will be delayed for about 500ms
      setTimeout(instance.boundresetVideoRendererSize, 500);
    } else {
      resetVideoRendererSize(instance);
    }
  }
  function resetVideoRendererSize(instance) {
    var subtitlesOctopus = instance.currentSubtitlesOctopus;
    if (subtitlesOctopus) {
      subtitlesOctopus.resize();
    }
    var renderer = instance.currentAssRenderer;
    if (renderer) {
      var videoElement = instance._mediaElement;
      var width = videoElement.offsetWidth;
      var height = videoElement.offsetHeight;
      console.log('videoElement resized: ' + width + 'x' + height);
      renderer.resize(width, height, 0, 0);
    }
  }
  function ensureCustomSubtitlesElement(instance, videoElement, enableAutomaticPositioning) {
    if (!instance.videoSubtitlesElem) {
      var subtitlesContainer = document.createElement('div');
      subtitlesContainer.classList.add('videoSubtitles');
      if (enableAutomaticPositioning) {
        subtitlesContainer.classList.add('videoSubtitles-autoposition');
      }
      instance.videoSubtitlesElem = subtitlesContainer;
      instance.enableSubtitlePositionFromSettings = enableAutomaticPositioning;
      setSubtitleAppearance(instance);
      videoElement.parentNode.appendChild(subtitlesContainer);
    }
  }
  function renderSubtitlesWithCustomElement(instance, videoElement, track, item, mediaSource) {
    ensureCustomSubtitlesElement(instance, videoElement, true);
    instance.currentTrackEvents = [];
    fetchVttSubtitles(track, item, mediaSource, function (cue) {
      var _instance$currentTrac;
      // in case it got nulled out during playback stop
      (_instance$currentTrac = instance.currentTrackEvents) == null || _instance$currentTrac.push(cue);
    });
  }
  function onCueChange(e) {
    var instance = this;
    var cues = e.target.activeCues;
    renderCues(instance, cues);
  }
  function removeCueEvents(instance, track) {
    track.removeEventListener('cuechange', instance.boundOnCueChange);
  }
  function addCueEvents(instance, videoElement, track) {
    loadWebVTT();
    ensureCustomSubtitlesElement(instance, videoElement, true);
    removeCueEvents(instance, track);
    track.addEventListener('cuechange', instance.boundOnCueChange);
  }
  function renderWithSubtitlesOctopus(instance, videoElement, track, item, mediaSource) {
    // this is purely for the videoSubtitles css. do this first so that styles are loaded
    loadWebVTT().then(function () {
      var textTrackUrl = getTextTrackUrl(track, item, mediaSource);
      Promise.all([fetchSubtitleContent(textTrackUrl, true, false), Emby.importModule('./bower_components/javascriptsubtitlesoctopus/dist/subtitles-octopus.js'), getFallbackFontUrl(track)]).then(function (responses) {
        var subContent = responses[0];
        ensureCustomSubtitlesElement(instance, videoElement, false);
        var canvasParent = instance.videoSubtitlesElem;
        canvasParent.classList.add('htmlvideo-subtitles-canvas-parent', 'flex', 'align-items-flex-start', 'justify-content-center');
        var canvas = canvasParent.querySelector('canvas');
        if (!canvas) {
          canvas = document.createElement('canvas');
          canvas.classList.add('htmlvideo-subtitles-canvas');
          canvasParent.appendChild(canvas);
        }
        var apiClient = _connectionmanager.default.getApiClient(item);
        var SubtitlesOctopus = responses[1];
        var useAvailableFonts = false;
        var availableFonts = useAvailableFonts ? getAvailableFonts(apiClient, mediaSource, track) : null;
        var fontUrls = useAvailableFonts ? null : getFontUrls(apiClient, mediaSource, track);
        console.log('available fonts: ' + JSON.stringify(useAvailableFonts || getAvailableFonts(apiClient, mediaSource, track)));
        instance.currentSubtitlesOctopus = new SubtitlesOctopus({
          video: videoElement,
          subUrl: subContent ? null : textTrackUrl,
          subContent: subContent,
          workerUrl: _approuter.default.baseUrl() + '/bower_components/javascriptsubtitlesoctopus/dist/subtitles-octopus-worker.js',
          legacyWorkerUrl: _approuter.default.baseUrl() + '/bower_components/javascriptsubtitlesoctopus/dist/subtitles-octopus-worker-legacy.js',
          fallbackFont: responses[2],
          fonts: fontUrls,
          availableFonts: availableFonts,
          onError: function () {
            instance.onError('mediadecodeerror');
          },
          lossyRender: window.createImageBitmap != null,
          renderMode: window.createImageBitmap != null ? 'lossy' : 'wasm-blend',
          detectAlphaBug: _browser.default.chromecast ? false : true,
          canvas: canvas,
          canvasParent: canvasParent
          //lazyFileLoading: true
        });
        if (!instance._resizeObserver) {
          instance._resizeObserver = new ResizeObserver(instance.boundOnVideoResize, {});
          instance._resizeObserver.observe(videoElement);
        }
      });
    });
  }
  function renderWithLibjass(instance, videoElement, track, item, mediaSource) {
    var rendererSettings = {};

    // Safer to just disable this everywhere
    rendererSettings.enableSvg = false;
    Emby.importModule('./modules/libjass/libjass.js').then(function (libjass) {
      var textTrackUrl = getTextTrackUrl(track, item, mediaSource);
      libjass.ASS.fromUrl(textTrackUrl).then(function (ass) {
        var clock = new libjass.renderers.ManualClock();
        instance.currentClock = clock;

        // Create a DefaultRenderer using the video element and the ASS object
        var renderer = new libjass.renderers.WebRenderer(ass, clock, videoElement.parentNode, rendererSettings);
        instance.currentAssRenderer = renderer;
        renderer.addEventListener("ready", function () {
          try {
            renderer.resize(videoElement.offsetWidth, videoElement.offsetHeight, 0, 0);
            if (!instance._resizeObserver) {
              instance._resizeObserver = new ResizeObserver(instance.boundOnVideoResize, {});
              instance._resizeObserver.observe(videoElement);
            }
            //clock.pause();
          } catch (ex) {
            //alert(ex);
          }
        });
      }, function (e) {
        instance.onError('mediadecodeerror');
      });
    });
  }
  function renderAssSsa(instance, videoElement, track, item, mediaSource) {
    // exclude web0s before 2022 because it's causing app crashes and we don't know why
    var supportedOnNativeLG = isNativeLG && _browser.default.sdkVersion && _browser.default.sdkVersion >= 5.0;
    if (isWebWorkerSupported() && isCanvasSupported() && (!isNativeLG || supportedOnNativeLG)) {
      renderWithSubtitlesOctopus(instance, videoElement, track, item, mediaSource);
      return;
    }
    renderWithLibjass(instance, videoElement, track, item, mediaSource);
  }
  function renderTracksEvents(instance, videoElement, track, item, mediaSource) {
    if (!mediaSource.IsLocal || track.DeliveryMethod === 'External') {
      var format = (track.Codec || '').toLowerCase();
      if (format === 'ssa' || format === 'ass') {
        // libjass is needed here
        renderAssSsa(instance, videoElement, track, item, mediaSource);
        return;
      }
    }
    if (requiresCustomSubtitlesElement(track)) {
      renderSubtitlesWithCustomElement(instance, videoElement, track, item, mediaSource);
      return;
    }
    var trackElement = null;
    var expectedId = 'manualTrack' + track.Index;
    var allTracks = videoElement.textTracks; // get list of tracks

    for (var i = 0; i < allTracks.length; i++) {
      var currentTrack = allTracks[i];
      if (currentTrack.label === expectedId) {
        trackElement = currentTrack;
        break;
      } else {
        currentTrack.mode = 'disabled';
        removeCueEvents(instance, currentTrack);
      }
    }
    if (!trackElement) {
      trackElement = videoElement.addTextTrack('subtitles', 'manualTrack' + track.Index, track.Language || 'und');
      trackElement.mode = 'hidden';
      addCueEvents(instance, videoElement, trackElement);

      // download the track json
      fetchVttSubtitles(track, item, mediaSource, function (trackEvent) {
        var trackCueObject = window.VTTCue || window.TextTrackCue;
        var cue = new trackCueObject(trackEvent.startTime, trackEvent.endTime, trackEvent.text);
        trackElement.addCue(cue);
      });
    } else {
      trackElement.mode = 'hidden';
      addCueEvents(instance, videoElement, trackElement);
    }
  }
  function setTrackForCustomDisplay(instance, videoElement, track) {
    if (!track) {
      destroyCustomTrack(instance, videoElement);
      return;
    }

    // if already playing thids track, skip
    if (instance.customTrackIndex === track.Index) {
      return;
    }
    var currentPlayOptions = instance._currentPlayOptions;
    var item = currentPlayOptions.item;
    var mediaSource = currentPlayOptions.mediaSource;
    destroyCustomTrack(instance, videoElement);
    instance.customTrackIndex = track.Index;
    renderTracksEvents(instance, videoElement, track, item, mediaSource);
  }
  function setCurrentTrackElement(instance, mediaElement, streamIndex, currentPlayOptions) {
    var _track;
    // reset this
    instance.setSubtitleOffset(0);
    if (!currentPlayOptions) {
      return;
    }
    var mediaSource = currentPlayOptions.mediaSource;
    if (isNativeLG && _browser.default.sdkVersion && _browser.default.sdkVersion < 3.0) {
      var playMethod = currentPlayOptions.playMethod;
      if (playMethod === 'DirectStream' || playMethod === 'DirectPlay') {
        if (mediaSource.Container === 'mkv') {
          streamIndex = -1;
        }
      }
    }
    console.log('setCurrentTrackElement Setting new text track index to: ' + streamIndex);
    var mediaStreamTextTracks = getMediaStreamSubtitleTracks(mediaSource);
    var track = streamIndex === -1 ? null : mediaStreamTextTracks.filter(function (t) {
      return t.Index === streamIndex;
    })[0];
    if (enableNativeTrackSupport(instance._currentSrc, track)) {
      setTrackForCustomDisplay(instance, mediaElement, null);
      if (streamIndex !== -1) {
        setCueAppearance(instance);
      }
    } else {
      setTrackForCustomDisplay(instance, mediaElement, track);

      // null these out to disable the player's native display (handled below)
      streamIndex = -1;
      track = null;
    }
    var targetIndex = -1;
    var expectedId = 'textTrack' + streamIndex;
    if (!mediaElement) {
      return;
    }
    var elemTextTracks = mediaElement.textTracks;
    var elemTextTrackslength = elemTextTracks.length;

    // Hide all first
    for (var i = 0; i < elemTextTrackslength; i++) {
      var tt = elemTextTracks[i];
      var textTrackId = tt.id;
      console.log('comparing textTrackId ' + textTrackId + ' to ' + expectedId);
      if (textTrackId === expectedId) {
        targetIndex = i;
      }
      tt.mode = 'disabled';
      removeCueEvents(instance, tt);
    }
    if (targetIndex < 0) {
      mediaStreamTextTracks = mediaStreamTextTracks.filter(function (s) {
        return s.IsTextSubtitleStream && (s.DeliveryMethod === 'Hls' || s.DeliveryMethod === 'VideoSideData');
      });
      console.log('mediaStreamTextTracks: ' + mediaStreamTextTracks.length);
      mediaStreamTextTracks.sort(sortMediaStreamTextTracks);
      if (track && (track.DeliveryMethod === 'Hls' || track.DeliveryMethod === 'VideoSideData')) {
        targetIndex = mediaStreamTextTracks.indexOf(track);
      }
    }
    console.log('setCurrentTrackElement targetIndex: ' + targetIndex + ', track language: ' + ((_track = track) == null ? void 0 : _track.Language));
    var found;
    if (targetIndex >= 0 && targetIndex < elemTextTrackslength) {
      for (var _i = 0, length = elemTextTracks.length; _i < length; _i++) {
        var _textTrack = elemTextTracks[_i];
        console.log('element has text track: ' + _textTrack.id + ', language: ' + _textTrack.language + ', kind: ' + _textTrack.kind + ', label: ' + _textTrack.label);
      }
      var filteredTextTracks = elemTextTracks;

      // try to locate a track with kind captions, if possible
      if (track.DeliveryMethod === 'VideoSideData') {
        filteredTextTracks = filterElementTextTracks(elemTextTracks, 'captions');
      }

      // but if this shortens the list too much, then just go back to the original list
      if (targetIndex >= filteredTextTracks.length) {
        filteredTextTracks = elemTextTracks;
      }
      var textTrack = filteredTextTracks[targetIndex];
      console.log('marking track hidden: ' + textTrack.id + ', language: ' + textTrack.language + ', kind: ' + textTrack.kind + ', label: ' + textTrack.label);
      textTrack.mode = 'hidden';
      found = true;
      addCueEvents(instance, mediaElement, textTrack);
    }
    if (!found && targetIndex !== -1) {
      console.log('could not find text track for selection. ' + elemTextTrackslength + ' total tracks');
    }
  }
  var subtitleTrackIndexToSetOnPlaying;
  var audioTrackIndexToSetOnPlaying;
  var initialSubtitleTrackTimeout;
  var initialAudioTrackTimeout;
  function onInitialSubtitleTrackTimeout() {
    var instance = this;
    var index = subtitleTrackIndexToSetOnPlaying;
    if (index != null) {
      console.log('setInitialSubtitleTrack');
      setCurrentTrackElement(instance, instance._mediaElement, index, instance._currentPlayOptions);
    }
  }
  function stopInitialSubtitleTrackTimeout() {
    if (initialSubtitleTrackTimeout) {
      clearTimeout(initialSubtitleTrackTimeout);
      initialSubtitleTrackTimeout = null;
    }
  }
  function startInitialSubtitleTrackTimeout(instance) {
    stopInitialSubtitleTrackTimeout();
    if (subtitleTrackIndexToSetOnPlaying != null) {
      initialSubtitleTrackTimeout = setTimeout(instance.boundonInitialSubtitleTrackTimeout, 400);
    }
  }
  function onInitialAudioTrackTimeout() {
    var instance = this;
    var index = audioTrackIndexToSetOnPlaying;
    if (index != null && instance.canSetAudioStreamIndex()) {
      instance.setAudioStreamIndex(index);
    }
  }
  function stopInitialAudioTrackTimeout() {
    if (initialAudioTrackTimeout) {
      clearTimeout(initialAudioTrackTimeout);
      initialAudioTrackTimeout = null;
    }
  }
  function startInitialAudioTrackTimeout(instance) {
    stopInitialAudioTrackTimeout();
    if (audioTrackIndexToSetOnPlaying != null) {
      initialAudioTrackTimeout = setTimeout(instance.boundonInitialAudioTrackTimeout, 300);
    }
  }
  function HtmlVideoPlayer() {
    _basehtmlplayer.default.call(this);
    this.name = 'Video Player';
    this.id = 'htmlvideoplayer';
    this.mediaType = 'video';

    // Let any players created by plugins take priority
    this.priority = 1;
    var videoDialog;
    this.customTrackIndex = -1;
    var self = this;
    this.webVTTStyleOptions = {};
    this.boundonUserSettingsChange = onUserSettingsChange.bind(this);
    this.boundonInitialAudioTrackTimeout = onInitialAudioTrackTimeout.bind(this);
    this.boundonInitialSubtitleTrackTimeout = onInitialSubtitleTrackTimeout.bind(this);
    this.boundOnCueChange = onCueChange.bind(this);
    this.boundOnVideoResize = onVideoResize.bind(this);
    this.boundresetVideoRendererSize = resetVideoRendererSize.bind(this);
    self.play = function (options, signal) {
      if (signal.aborted) {
        return rejectOnAbort(signal);
      }
      var promise = options.fullscreen ? _approuter.default.showVideoOsd() : Promise.resolve();
      self._started = false;
      self._timeUpdated = false;
      self._currentTime = null;
      if (self._hlsPlayer) {
        self.stopInternal(true, false, false);
      }
      var elem = createMediaElement(options);
      return promise.then(function () {
        if (signal.aborted) {
          return rejectOnAbort(signal);
        }
        return setCurrentSrc(elem, options).then(function (result) {
          if (signal.aborted) {
            self.stopInternal(false, false);
            return rejectOnAbort(signal);
          }
          return Promise.resolve(result);
        });
      });
    };
    self.loadIntoPlayer = function (elem, options, val, media, data, customData) {
      var hasHlsTextTracks = customData.hasHlsTextTracks;
      var tracksHtml = customData.tracksHtml;
      if (val.indexOf('.m3u8') !== -1) {
        if (_htmlmediahelper.default.enableHlsJsPlayer(options.mediaSource.RunTimeTicks, 'Video') && val.indexOf('.m3u8') !== -1) {
          if (!hasHlsTextTracks) {
            setTracks(elem, tracksHtml);
          }
          return self.setSrcWithHlsJs(elem, options, val);
        }
      }
      elem.autoplay = true;
      elem.src = val;
      self._currentSrc = val;
      setTracks(elem, tracksHtml);
      return self.playWithPromise(elem);
    };
    function getMediaStreamByIndex(mediaStreams, index) {
      for (var i = 0, length = mediaStreams.length; i < length; i++) {
        if (mediaStreams[i].Index === index) {
          return mediaStreams[i];
        }
      }
      return null;
    }
    function setCurrentSrc(elem, options) {
      self.removeErrorEventListener(elem);
      var url = options.url;
      // Convert to seconds
      // ps4 is adding this to the url that gets sent to the server: https://emby.media/community/index.php?/topic/99615-ps4-web-app-subtitles
      if (!_browser.default.ps4) {
        var seconds = (options.playerStartPositionTicks || 0) / 10000000;
        if (seconds) {
          url += '#t=' + seconds;
        }
      }
      console.log('playing url: ' + url);

      // in case we're changing the video url, remove all textTracks from the video element because in some cases they get left behind (e.g. in chrome changing quality from direct play to transcoding)
      setCurrentTrackElement(self, elem, -1, options);
      elem.innerHTML = '';
      self.destroyHlsPlayer();
      self.destroyCastPlayer();
      var tracks = getMediaStreamSubtitleTracks(options.mediaSource);
      subtitleTrackIndexToSetOnPlaying = options.mediaSource.DefaultSubtitleStreamIndex == null ? -1 : options.mediaSource.DefaultSubtitleStreamIndex;
      if (subtitleTrackIndexToSetOnPlaying != null && subtitleTrackIndexToSetOnPlaying >= 0) {
        var initialSubtitleStream = getMediaStreamByIndex(options.mediaSource.MediaStreams, subtitleTrackIndexToSetOnPlaying);
        if (!initialSubtitleStream || initialSubtitleStream.DeliveryMethod === 'Encode') {
          subtitleTrackIndexToSetOnPlaying = -1;
        }
      }
      audioTrackIndexToSetOnPlaying = options.playMethod === 'Transcode' ? null : options.mediaSource.DefaultAudioStreamIndex;
      self._currentPlayOptions = options;
      var crossOrigin = self.getCrossOriginValue(options.mediaSource, options.playMethod);
      if (crossOrigin) {
        elem.crossOrigin = crossOrigin;
      }
      tracks = tracks.filter(function (s) {
        return s.IsTextSubtitleStream;
      });
      var hasHlsTextTracks = containsHlsTextTracks(tracks);
      var tracksHtml = getTracksHtml(tracks, options.item, options.mediaSource, hasHlsTextTracks);
      if (_browser.default.chromecast) {
        return self.setCurrentSrcChromecast(elem, options, url, hasHlsTextTracks, tracksHtml);
      } else if (_htmlmediahelper.default.enableHlsJsPlayer(options.mediaSource.RunTimeTicks, 'Video') && url.indexOf('.m3u8') !== -1) {
        if (!hasHlsTextTracks) {
          setTracks(elem, tracksHtml);
        }
        return self.setSrcWithHlsJs(elem, options, url);
      } else {
        elem.autoplay = true;
        elem.src = url;
        self._currentSrc = url;
        setTracks(elem, tracksHtml);
        return self.playWithPromise(elem);
      }
    }
    self.setSubtitleStreamIndex = function (index) {
      setCurrentTrackElement(self, self._mediaElement, index, self._currentPlayOptions);
    };
    function sortDefaultTracksFirst(trackA, trackB) {
      if (trackA.IsDefault === trackB.IsDefault) {
        return 0;
      }
      if (trackA.IsDefault) {
        return -1;
      }
      if (trackB.IsDefault) {
        return 1;
      }
      return 0;
    }
    self.setAudioStreamIndex = function (index) {
      var streams = getSupportedAudioStreams(self);
      if (streams.length < 2) {
        // If there's only one supported stream then trust that the player will handle it on it's own
        return;
      }
      if (isNativeLG && _browser.default.sdkVersion && _browser.default.sdkVersion >= 4) {
        var currentPlayOptions = self._currentPlayOptions;
        var playMethod = currentPlayOptions.playMethod;
        if (playMethod === 'DirectStream' || playMethod === 'DirectPlay') {
          var mediaSource = currentPlayOptions.mediaSource;
          if (mediaSource.Container === 'mkv') {
            streams.sort(sortDefaultTracksFirst);
          }
        }
      }
      var audioIndex = -1;
      var i, length, stream;
      for (i = 0, length = streams.length; i < length; i++) {
        stream = streams[i];
        audioIndex++;
        if (stream.Index === index) {
          break;
        }
      }
      if (audioIndex === -1) {
        return;
      }
      var elem = self._mediaElement;
      if (!elem) {
        return;
      }

      // https://msdn.microsoft.com/en-us/library/hh772507(v=vs.85).aspx

      var elemAudioTracks = elem.audioTracks || [];
      if (elemAudioTracks.length < 2) {
        // The element only has a single track, so there's nothing to change here
        return;
      }
      console.log('found ' + elemAudioTracks.length + ' audio tracks');
      for (i = 0, length = elemAudioTracks.length; i < length; i++) {
        if (audioIndex === i) {
          console.log('setting audio track ' + i + ' to enabled');
          elemAudioTracks[i].enabled = true;
        } else {
          console.log('setting audio track ' + i + ' to disabled');
          elemAudioTracks[i].enabled = false;
        }
      }
      setTimeout(function () {
        // eslint-disable-next-line
        elem.currentTime = elem.currentTime;
      }, 100);
    };
    self.stopInternal = function (destroyPlayer, triggerStopEvent, destroyInterface) {
      var elem = self._mediaElement;
      var src = self._currentSrc;
      if (elem) {
        if (src) {
          elem.pause();
        }
        self.onEnded(elem, triggerStopEvent);
        if (destroyPlayer) {
          self.destroyInternal(destroyInterface);
        }
      }
      destroyCustomTrack(self, elem);
      return Promise.resolve();
    };
    self.stop = function (destroyPlayer) {
      return this.stopInternal(destroyPlayer, null, true);
    };
    self.destroyInternal = function (destroyInterface) {
      self.destroyHlsPlayer();
      var videoElement = self._mediaElement;
      if (videoElement) {
        self._mediaElement = null;
        self._currentAspectRatio = null;
        destroyCustomTrack(self, videoElement);
        if (_browser.default.chromecast) {
          self.unBindMediaManagerEvents();
        }
        self.removeEventListeners(videoElement);
        videoElement.removeEventListener('click', onClick);
        videoElement.removeEventListener('dblclick', onDblClick);
        _events.default.off(_usersettings.default, 'change', self.boundonUserSettingsChange);
        videoElement.remove();
      }
      if (destroyInterface) {
        var dlg = videoDialog;
        if (dlg) {
          videoDialog = null;
          dlg.remove();
        }
      }
    };
    self.destroy = function () {
      return self.destroyInternal(true);
    };
    function onAddTrack(e) {
      var track = e.track;
      console.log('onAddTrack: ' + track.id + ', language: ' + track.language + ', kind: ' + track.kind + ', label: ' + track.label);
      startInitialSubtitleTrackTimeout(self);
    }
    function onRemoveTrack(e) {
      var track = e.track;
      console.log('onRemoveTrack: ' + track.id + ', language: ' + track.language + ', kind: ' + track.kind + ', label: ' + track.label);
    }
    function onClick() {
      _events.default.trigger(self, 'click');
    }
    function onDblClick() {
      _events.default.trigger(self, 'dblclick');
    }
    function createMediaElement(options) {
      var dlg = document.querySelector('.htmlVideoPlayerContainer');
      if (!dlg) {
        dlg = document.createElement('div');
        dlg.classList.add('htmlVideoPlayerContainer');
        document.body.insertBefore(dlg, document.body.firstChild);
        videoDialog = dlg;
      }
      var videoElement = dlg.querySelector('video');
      if (!videoElement) {
        dlg.insertAdjacentHTML('beforeend', '<video class="htmlvideoplayer" preload="metadata" autoplay="autoplay" webkit-playsinline playsinline></video>');
        videoElement = dlg.querySelector('video');

        // playsinline new for iOS 10
        // https://developer.apple.com/library/content/releasenotes/General/WhatsNewInSafari/Articles/Safari_10_0.html

        self.addEventListeners(videoElement);
        _events.default.off(_usersettings.default, 'change', self.boundonUserSettingsChange);
        _events.default.on(_usersettings.default, 'change', self.boundonUserSettingsChange);
        if (videoElement.textTracks && videoElement.textTracks.addEventListener) {
          videoElement.textTracks.addEventListener('addtrack', onAddTrack);
          videoElement.textTracks.addEventListener('removetrack', onRemoveTrack);
        }
        videoElement.addEventListener('click', onClick);
        videoElement.addEventListener('dblclick', onDblClick);
        if (!_browser.default.chromecast) {
          videoElement.classList.add('moveUpSubtitles');
        }
        self._mediaElement = videoElement;
        if (_browser.default.chromecast) {
          cast.framework.CastReceiverContext.getInstance().getPlayerManager().setMediaElement(videoElement);
          self.bindMediaManagerEvents();
        }
      }
      if (self.useElementVolume()) {
        videoElement.volume = _appsettings.default.volume() / 100;
      }
      return videoElement;
    }
  }
  Object.assign(HtmlVideoPlayer.prototype, _basehtmlplayer.default.prototype);
  var supportedFeatures;
  function getSupportedFeatures() {
    var list = ['Mute', 'Unmute', 'ToggleMute'];
    if (_servicelocator.appHost.supports('htmlmedia_setvolume')) {
      list.push('SetVolume');
      list.push('VolumeDown');
      list.push('VolumeUp');
    }

    // lg rejected over this button
    if (!isNativeLG) {
      var video = document.createElement('video');
      if (video.webkitSupportsPresentationMode && typeof video.webkitSetPresentationMode === "function") {
        list.push('PictureInPicture');
      }
      if (document.pictureInPictureEnabled) {
        list.push('PictureInPicture');
      }
    }

    //list.push('SetBrightness');

    // not having any effect in uwp
    if (CSS.supports('object-fit', 'cover')) {
      list.push('SetAspectRatio');
    }
    list.push('SetSubtitleOffset');
    list.push('SetSubtitleAppearance');

    // LG rejected a submission due to playback speed causing loss of audio
    if (!isNativeLG) {
      list.push('SetPlaybackRate');
    }
    return list;
  }
  HtmlVideoPlayer.prototype.supports = function (feature) {
    if (!supportedFeatures) {
      supportedFeatures = getSupportedFeatures();
    }
    return supportedFeatures.indexOf(feature) !== -1;
  };
  HtmlVideoPlayer.prototype.canSetAudioStreamIndex = function (index) {
    if (typeof AudioTrack === 'undefined') {
      return false;
    }
    var video = this._mediaElement;
    if (video) {
      if (video.audioTracks) {
        return true;
      }
    }
    return false;
  };
  function onPictureInPictureError(err) {
    console.log('Picture in picture error: ' + err.toString());
  }
  HtmlVideoPlayer.prototype.setPictureInPictureEnabled = function (isEnabled) {
    var video = this._mediaElement;
    if (document.pictureInPictureEnabled) {
      if (video) {
        if (isEnabled) {
          video.requestPictureInPicture().catch(onPictureInPictureError);
        } else {
          document.exitPictureInPicture().catch(onPictureInPictureError);
        }
      }
    } else {
      if (video) {
        if (video.webkitSupportsPresentationMode && typeof video.webkitSetPresentationMode === "function") {
          video.webkitSetPresentationMode(isEnabled ? "picture-in-picture" : "inline");
        }
      }
    }
  };
  HtmlVideoPlayer.prototype.isPictureInPictureEnabled = function () {
    if (document.pictureInPictureEnabled) {
      return document.pictureInPictureElement ? true : false;
    } else if (window.Windows) {
      return this.isPip || false;
    } else {
      var video = this._mediaElement;
      if (video) {
        return video.webkitPresentationMode === "picture-in-picture";
      }
    }
    return false;
  };
  HtmlVideoPlayer.prototype.setBrightness = function (val) {
    var elem = this._mediaElement;
    if (elem) {
      val = Math.max(0, val);
      val = Math.min(100, val);
      var rawValue = val;
      rawValue = Math.max(20, rawValue);
      var cssValue = rawValue >= 100 ? 'none' : rawValue / 100;
      elem.style['filter'] = 'brightness(' + cssValue + ');';
      elem.style.filter = 'brightness(' + cssValue + ')';
      elem.brightnessValue = val;
      _events.default.trigger(this, 'brightnesschange');
    }
  };
  HtmlVideoPlayer.prototype.getBrightness = function () {
    var elem = this._mediaElement;
    if (elem) {
      var val = elem.brightnessValue;
      return val == null ? 100 : val;
    }
  };
  HtmlVideoPlayer.prototype.setAspectRatio = function (val) {
    var mediaElement = this._mediaElement;
    if (mediaElement) {
      switch (val) {
        case 'fill':
        case 'cover':
          mediaElement.style.objectFit = val;
          break;
        default:
          mediaElement.style.objectFit = null;
          break;
      }
    }
    this._currentAspectRatio = val;
  };
  HtmlVideoPlayer.prototype.getAspectRatio = function () {
    return this._currentAspectRatio || 'auto';
  };
  HtmlVideoPlayer.prototype.getSupportedAspectRatios = function () {
    return [{
      name: _globalize.default.translate('Auto'),
      id: 'auto'
    }, {
      name: _globalize.default.translate('Cover'),
      id: 'cover'
    }, {
      name: _globalize.default.translate('Fill'),
      id: 'fill'
    }];
  };
  HtmlVideoPlayer.prototype.getSubtitleOffset = function (val) {
    return this._currentSubtitleOffset;
  };
  function setSubtitleOffsetIntoCues(cues, val) {
    val /= 1000;
    for (var i = 0, length = cues.length; i < length; i++) {
      var cue = cues[i];
      if (cue.originalStartTime == null) {
        cue.originalStartTime = cue.startTime;
      }
      if (cue.originalEndTime == null) {
        cue.originalEndTime = cue.endTime;
      }
      cue.startTime = cue.originalStartTime + val;
      cue.endTime = cue.originalEndTime + val;
    }
  }
  function setSubtitleOffset(instance, elem, val) {
    var subtitlesOctopus = instance.currentSubtitlesOctopus;
    if (subtitlesOctopus) {
      subtitlesOctopus.timeOffset = -(val / 1000);
    }
    var textTracks = elem.textTracks || [];
    for (var i = 0, length = textTracks.length; i < length; i++) {
      var track = textTracks[i];
      var trackMode = track.mode;
      if (trackMode !== 'showing' && trackMode !== 'hidden') {
        continue;
      }
      var cues = track.cues;
      if (cues) {
        // use try catch to prevent occasional crashing seen on edge-uwp
        try {
          setSubtitleOffsetIntoCues(cues, val);
          renderCues(instance, track.activeCues);
        } catch (err) {
          console.error('error in setSubtitleOffsetIntoCues: ', err);
        }
      }
    }
  }
  HtmlVideoPlayer.prototype.setSubtitleOffset = function (val) {
    var elem = this._mediaElement;
    if (elem) {
      this._currentSubtitleOffset = val;
      setSubtitleOffset(this, elem, val);
    }
  };
  HtmlVideoPlayer.prototype.incrementSubtitleOffset = function (val) {
    var elem = this._mediaElement;
    if (elem) {
      var currentSubtitleOffset = this._currentSubtitleOffset;
      var newVal = currentSubtitleOffset + val;
      console.log('incrementSubtitleOffset: ' + val + ', currentSubtitleOffset: ' + currentSubtitleOffset + ', newValue: ' + newVal);
      this._currentSubtitleOffset = newVal;
      setSubtitleOffset(this, elem, newVal);
    }
  };
  HtmlVideoPlayer.prototype.togglePictureInPicture = function () {
    return this.setPictureInPictureEnabled(!this.isPictureInPictureEnabled());
  };
  HtmlVideoPlayer.prototype.getStats = function () {
    var mediaElement = this._mediaElement;
    var categories = [];
    if (!mediaElement) {
      return Promise.resolve({
        categories: categories
      });
    }
    var videoCategory = {
      stats: [],
      type: 'video'
    };
    categories.push(videoCategory);
    if (mediaElement.getVideoPlaybackQuality) {
      var playbackQuality = mediaElement.getVideoPlaybackQuality();
      var droppedVideoFrames = playbackQuality.droppedVideoFrames || 0;
      videoCategory.stats.push({
        label: 'Dropped Frames',
        value: droppedVideoFrames
      });
    }
    return Promise.resolve({
      categories: categories
    });
  };
  function ensureValidVideo(instance, elem) {
    if (elem !== instance._mediaElement) {
      return;
    }
    if (elem.videoWidth === 0 && elem.videoHeight === 0) {
      var mediaSource = (instance._currentPlayOptions || {}).mediaSource;
      if (!mediaSource) {
        instance.onError('mediadecodeerror');
        return;
      }

      // Only trigger this if there is media info
      // Avoid triggering in situations where it might not actually have a video stream (audio only live tv channel)
      if (getMediaStreamTracks(mediaSource, 'Video').length) {
        instance.onError('mediadecodeerror');
        return;
      }
    }

    //if (elem.audioTracks && !elem.audioTracks.length) {
    //    instance.onError('mediadecodeerror');
    //}
  }
  function updateSubtitleText(instance, timeMs) {
    var clock = instance.currentClock;
    if (clock) {
      try {
        clock.seek(timeMs / 1000);
      } catch (err) {
        console.error('Error in libjass: ', err);
      }
      return;
    }
    var trackEvents = instance.currentTrackEvents;
    if (trackEvents) {
      var seconds = timeMs / 1000;
      var activeCues = [];
      for (var i = 0; i < trackEvents.length; i++) {
        var currentTrackEvent = trackEvents[i];
        if (currentTrackEvent.startTime <= seconds && currentTrackEvent.endTime >= seconds) {
          activeCues.push(currentTrackEvent);
          break;
        }
      }
      renderCues(instance, activeCues);
    }
  }
  HtmlVideoPlayer.prototype.onStartedPlaying = function (elem) {
    _basehtmlplayer.default.prototype.onStartedPlaying.apply(this, arguments);

    // If this causes a failure during navigation we end up in an awkward UI state
    // that's why we better call it outside of the event handling
    startInitialSubtitleTrackTimeout(this);
    startInitialAudioTrackTimeout(this);
  };
  HtmlVideoPlayer.prototype.onTimeUpdate = function (elem, time, isFirstTimeUpdate) {
    var _this$currentSubtitle;
    _basehtmlplayer.default.prototype.onTimeUpdate.apply(this, arguments);
    if (isFirstTimeUpdate) {
      ensureValidVideo(this, elem);
    }
    (_this$currentSubtitle = this.currentSubtitlesOctopus) == null || _this$currentSubtitle.onTimeUpdate(time);
    var currentPlayOptions = this._currentPlayOptions;
    // Not sure yet how this is coming up null since we never null it out, but it is causing app crashes
    if (currentPlayOptions) {
      var timeMs = time * 1000 - this._currentSubtitleOffset;
      timeMs += (currentPlayOptions.transcodingOffsetTicks || 0) / 10000;
      updateSubtitleText(this, timeMs);
    }
  };
  HtmlVideoPlayer.prototype.onEnded = function (elem, triggerStopEvent) {
    _basehtmlplayer.default.prototype.onEnded.apply(this, arguments);
    destroyCustomTrack(this, elem);
  };
  HtmlVideoPlayer.prototype.onError = function (errorType) {
    destroyCustomTrack(this, this._mediaElement);
    _basehtmlplayer.default.prototype.onError.apply(this, arguments);
  };
  var _default = _exports.default = HtmlVideoPlayer;
});
