define(['userSettings', 'globalize', 'browser', 'pluginManager', 'events', 'playbackManager', 'appRouter', 'subtitleAppearanceHelper', 'connectionManager'], function (userSettings, globalize, browser, pluginManager, events, playbackManager, appRouter, subtitleAppearanceHelper, connectionManager) {
    "use strict";

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

    return function () {

        var self = this;

        self.name = 'Tizen AV Player';
        self.type = 'mediaplayer';
        self.id = 'tizenavplayer';

        // Let any players created by plugins take priority
        self.priority = 1;

        var videoDialog;
        var currentSrc;
        var lastProfile;
        var started = false;
        var avPlayStreamInfos;
        var videoSubtitlesContainer;
        var currentTrackEvents;
        var currentPlayOptions;
        var playResolve;
        var playReject;
        var initialTracksSet;
        var currentTextTrackIndex = -1;
        var currentClock;
        var currentAssRenderer;
        var loadingDelayTimer = null;
        var subtitleDurationTimer;
        var currentAspectRatio = null;
        var currentSubtitleOffset = 0;
        var WebVTT;
        var webVTTStyleOptions = {};

        var audioDebug1 = [];
        var audioDebug2 = [];
        var audioDebug3 = '';

        var subtitleDebug1 = [];
        var subtitleDebug2 = [];
        var subtitleDebug3 = '';

        // Save this for when playback stops, because querying the time at that point might return 0
        var _currentTime;

        self.canPlayMediaType = function (mediaType) {

            switch (mediaType) {

                case 'Video':
                    return true;
                default:
                    return false;
            }
        };

        self.getDeviceProfile = function (item, options) {

            options = options || {};

            return require(['browserdeviceprofile']).then(function (responses) {

                var profileBuilder = responses[0];

                return profileBuilder({

                    item: item

                }).then(function (profile) {

                    profile.SubtitleProfiles = [];

                    profile.SubtitleProfiles.push({
                        Format: 'vtt',
                        Method: 'Hls'
                    });

                    // Not supported in 2021 models - avPlayStreamInfos has no TEXT tracks
                    if (browser.tizen && browser.sdkVersion && browser.sdkVersion !== 6.0) {
                        profile.SubtitleProfiles.push({
                            Format: 'subrip',
                            Method: 'Embed',
                            Container: 'mkv'
                        });

                        profile.SubtitleProfiles.push({
                            Format: 'srt',
                            Method: 'Embed',
                            Container: 'mkv'
                        });
                    }

                    if (!options.isRetry) {
                        profile.SubtitleProfiles.push({
                            Format: 'ass',
                            Method: 'External'
                        });
                        profile.SubtitleProfiles.push({
                            Format: 'ssa',
                            Method: 'External'
                        });
                    }
                    profile.SubtitleProfiles.push({
                        Format: 'vtt',
                        Method: 'External'
                    });

                    lastProfile = profile;

                    return profile;
                });
            });
        };

        self.currentSrc = function () {
            return currentSrc;
        };

        /**
         * open function
         *
         * You should do this code sequence before you play video.
         * open -> setListener -> prepare -> setDisplayRect -> play
         */

        self.play = function (options, signal) {

            started = false;
            _currentTime = null;

            return createMediaElement(options).then(function (elem) {

                return setCurrentSrc(elem, options, signal);
            });
        };

        function getCrossOriginValue(mediaSource) {

            return 'anonymous';
        }

        function renderCues(cues) {

            var subtitleTextElement = self.videoSubtitlesElem;
            if (subtitleTextElement && WebVTT) {

                WebVTT.processCues(window, cues, subtitleTextElement, webVTTStyleOptions);
            }
        }

        function updateSubtitleText(timeMs, text, cueAttribs) {

            // libjass
            var clock = currentClock;
            if (clock) {
                try {
                    clock.seek(timeMs / 1000);
                } catch (err) {
                    console.log('Error in libjass: ' + err);
                }
                return;
            }

            // subtitlesOctopus
            var subtitlesOctopus = self.currentSubtitlesOctopus;
            if (subtitlesOctopus) {
                try {
                    subtitlesOctopus.setCurrentTime(timeMs / 1000);
                } catch (err) {
                    console.log('Error in subtitlesOctopus: ' + err);
                }
                return;
            }

            var trackEvents = currentTrackEvents;
            var activeCues = [];

            // webVTT subs track
            if (trackEvents) {
                var seconds = timeMs / 1000;
                for (var i = 0; i < trackEvents.length; i++) {

                    var currentTrackEvent = trackEvents[i];
                    if (currentTrackEvent.startTime <= seconds && currentTrackEvent.endTime >= seconds) {
                        activeCues.push(currentTrackEvent);
                        break;
                    }
                }
                renderCues(activeCues);

                return;
            }

            // avplayer subtitle events
            if (timeMs > 0 && text && text.length > 0) {
                var cue = {
                    startTime: 0,
                    endTime: 0,
                    text: text
                };

                if (cueAttribs) {

                    for (var i = 0; i < cueAttribs.length; i++) {

                        var attrib = cueAttribs[i].attr_type.split(':');

                        switch (attrib[0]) {
                            case 'ATTRI_WEBVTTCUE_ALIGN':
                                switch (attrib[1]) {
                                    case '0':
                                        cue.align = 'start';
                                        break;
                                    case '1':
                                        cue.align = 'center';
                                        break;
                                    case '2':
                                        cue.align = 'end';
                                        break;
                                }
                                break;
                            case 'ATTRI_WEBVTTCUE_LINE':
                                cue.line = parseFloat(attrib[1]);
                                cue.snapToLines = false;
                                break;
                            case 'ATTRI_WEBVTTCUE_LINE_NUM':
                                cue.line = parseInt(attrib[1]);
                                cue.snapToLines = true;
                                break;
                            case 'ATTRI_WEBVTTCUE_POSITION':
                                cue.position = parseInt(attrib[1]);
                                break;
                        }

                    }

                }

                activeCues.push(cue);
                renderCues(activeCues);

                if (subtitleDurationTimer) {
                    clearTimeout(subtitleDurationTimer);
                }

                subtitleDurationTimer = setTimeout(function () {
                    subtitleDurationTimer = null;
                    renderCues([]);
                }, timeMs);

                return;
            }

            // Clear subs
            if (timeMs <= 0) {
                renderCues([]);
            }
        }

        function setSubtitleAppearance(enablePositionFromSettings) {

            var appearanceSettings = userSettings.getSubtitleAppearanceSettings();
            var subtitleStyles = subtitleAppearanceHelper.getStyleObjects(appearanceSettings);

            var positionTop = enablePositionFromSettings ? appearanceSettings.positionTop : '0';

            if (positionTop != null) {
                try {
                    document.documentElement.style.setProperty('--subtitles-window-top', positionTop + '%');
                }
                catch (err) {
                    console.log('error setting --subtitles-window-top css variable');
                }
            }

            var positionBottom = enablePositionFromSettings ? appearanceSettings.positionBottom : '0';
            if (positionBottom != null) {
                try {
                    document.documentElement.style.setProperty('--subtitles-window-bottom', positionBottom + '%');
                }
                catch (err) {
                    console.log('error setting --subtitles-window-bottom css variable');
                }
            }

            webVTTStyleOptions = {
                textStyle: subtitleStyles.text,
                windowStyle: subtitleStyles.window
            };
        }

        function hideLoading() {

            if (loadingDelayTimer) {
                clearTimeout(loadingDelayTimer);
                loadingDelayTimer = null;
            }

            onPlaying();
        }

        function replaceAll(originalString, strReplace, strWith) {
            var reg = new RegExp(strReplace, 'ig');
            return originalString.replace(reg, strWith);
        }

        function checkPlaybackStarted() {
            if (!started) {
                //sendToast('checkPlaybackStarted : forcing startPlayback() success');
                //console.warn('checkPlaybackStarted : forcing startPlayback() success');
                startPlayback();
            }
        }

        function checkInitialTracksSet() {
            if (!initialTracksSet) {
                setTimeout(function () {
                    if (!initialTracksSet) {
                        setInitialTracks();
                    }
                }, 1000);
            }
        }

        /**
         * This object is used in order to obtain the Buffering,
         * Playback Time, Playback mode, DRM mode information etc. *
         */

        var listener = {
            onbufferingstart: function () {
                console.log("Buffering start.");

                if (started) {

                    // Reset timer if already running
                    hideLoading();

                    // Delay to prevent spinner from flickering while normal buffering during playback
                    loadingDelayTimer = setTimeout(onWaiting, 4000);
                }
            },
            onbufferingprogress: function (percent) {
                console.log("Buffering progress data : " + percent);
                // Sometimes buffering Complete is never triggered.
                if (percent > 95) {
                    if (started) {
                        hideLoading();
                        checkInitialTracksSet();
                    } else {
                        checkPlaybackStarted();
                    }
                }
            },
            onbufferingcomplete: function () {
                console.log("Buffering complete.");
                if (started) {
                    hideLoading();
                    checkInitialTracksSet();
                } else {
                    checkPlaybackStarted();
                }
            },
            oncurrentplaytime: function (currentTime) {
                //console.log("Current Playtime : " + currentTime);
                onTimeUpdate(currentTime);
                checkInitialTracksSet();
            },
            onevent: function (eventType, eventData) {
                console.log("event type : " + eventType + ", data: " + eventData);
            },
            onerror: function (eventType) {


                var state;

                try {
                    state = webapis.avplay.getState();
                }
                catch (err) {
                    console.log('error getting state in onerror: ' + err);
                    state = 'NONE';
                }

                if (state === "NONE") {
                    console.log('Got error while in state NONE : ' + eventType);
                    return;
                }

                console.log("error type : " + eventType);

                if (playReject) {
                    sendToast('Media player error code: ' + eventType + ', player state: ' + state);

                    console.log("onerror : rejecting player");
                    playReject();
                    playReject = null;
                } else {
                    onError(eventType);
                }
            },
            onsubtitlechange: function (duration, text, data3, data4) {

                // Remove garbage on 2016 devices when playing subrips via vtt in HLS
                // <br/>WEBVTT<br/>X-TIMESTAMP-MAP=MPEGTS:900000,LOCAL:00:00:00.000
                var index = text.toLocaleLowerCase().indexOf('<br/>webvtt');
                if (index >= 0) {
                    text = text.substring(0, index);
                }

                // avplayer converts newlines to '<br>', we need to convert them back
                text = replaceAll(text, '<br>', '\n');
                text = replaceAll(text, '<br/>', '\n');

                if (!isNaN(duration)) {
                    var mSec = parseInt(duration);

                    // Ignore duration 0 tracks
                    if (mSec > 0) {

                        subtitleDebug3 = [duration, text, data3, data4].join(' | ');

                        // data4 contains vtt attrib data
                        updateSubtitleText(mSec, text, data4);
                    }
                }
            },
            ondrmevent: function (drmEvent, drmData) {
                console.log("DRM callback: " + drmEvent + ", data: " + drmData);
            },
            onstreamcompleted: function () {
                console.log("Stream Completed");
                //You should write stop code in onstreamcompleted.
                webapis.avplay.pause();
                onEnded();
            }
        };

        function check4kMode() {
            var videoStream = (currentPlayOptions.mediaSource.MediaStreams || []).filter(function (i) {
                return i.Type === 'Video';
            })[0] || {};

            var isTizenUhd = webapis.productinfo.isUdPanelSupported();

            if (isTizenUhd && (videoStream.Width > 1920 || videoStream.Height > 1080)) {
                webapis.avplay.setStreamingProperty("SET_MODE_4K", "TRUE");
                console.log("4K mode enabled");
            } else {
                webapis.avplay.setStreamingProperty("SET_MODE_4K", "FALSE");
            }
        }

        function setDisplaySize(val) {

            var aspect = val || 'auto';
            var rect = { left: 0, top: 0, width: screen.width, height: screen.height };

            var videoStream = (currentPlayOptions.mediaSource.MediaStreams || []).filter(function (i) {
                return i.Type === 'Video';
            })[0] || {};

            var ratioParts;

            if (videoStream.Width && videoStream.Height) {

                var shouldRotateAspectRatio = !!videoStream.AspectRatio && !!videoStream.Rotation && (Math.abs(videoStream.Rotation % 180) === 90);

                var videoElement = self._mediaElement;
                if (shouldRotateAspectRatio) {
                    videoElement.videoHeight = videoStream.Width;
                    videoElement.videoWidth = videoStream.Height;
                    ratioParts = videoStream.AspectRatio.split(':').reverse();
                } else {
                    videoElement.videoHeight = videoStream.Height;
                    videoElement.videoWidth = videoStream.Width;
                    ratioParts = videoStream.AspectRatio ? videoStream.AspectRatio.split(':') : [videoStream.Width, videoStream.Height];
                }

            } else {
                ratioParts = videoStream.AspectRatio ? videoStream.AspectRatio.split(':') : [16, 9];
            }

            if (ratioParts.length === 2) {

                var DAR = ratioParts[0] / ratioParts[1];
                var SAR = rect.width / rect.height;
                var PAR = DAR / SAR;

                if (PAR === 1 || aspect === 'fill') {

                    webapis.avplay.setDisplayRect(rect.left, rect.top, rect.width, rect.height);
                    webapis.avplay.setDisplayMethod("PLAYER_DISPLAY_MODE_FULL_SCREEN");

                } else {

                    var newResolutionX = rect.width;
                    var newResolutionY = rect.height;
                    var newLeft = rect.left;
                    var newTop = rect.top;

                    if (PAR > 1) {

                        newResolutionY = Math.round(rect.height * 1 / PAR);
                        newTop = Math.round((rect.height - newResolutionY) / 2);

                    } else {

                        newResolutionX = Math.round(rect.width * PAR);
                        newLeft = Math.round((rect.width - newResolutionX) / 2);

                    }

                    webapis.avplay.setDisplayRect(parseInt(newLeft), parseInt(newTop), parseInt(newResolutionX), parseInt(newResolutionY));
                }
            }
        }

        function logPlayerState() {

            // calling getState can sometimes throw an exception depending on the current status of the player, so enable this as needed but don't have it always active
            //    try {
            //        console.log("Current state:", webapis.avplay.getState());
            //    } catch (e) {
            //        console.log('error determining player state: ' + e)
            //    }
        }

        function setCurrentSrc(elem, options, signal) {

            var promise = options.fullscreen ? Emby.Page.showVideoOsd() : Promise.resolve();

            return promise.then(function () {

                var val = options.url;

                console.log('playing url: ' + val);

                currentPlayOptions = options;

                // This is needed in setCurrentTrackElement
                currentSrc = val;

                initialTracksSet = false;

                // open phase
                try {
                    logPlayerState();
                    //can only call open() in idle state
                    webapis.avplay.stop();
                    console.log("open start");
                    //open API gets target URL. URL validation is done in prepare API.
                    webapis.avplay.open(val);
                    //setListener should be done before prepare API. Do setListener after open immediately.
                    webapis.avplay.setListener(listener);
                    logPlayerState();
                    console.log("open complete");

                    check4kMode();   //after open, before prepare
                    logPlayerState();
                    console.log("prepareAsync Start");

                    // Before prepareAsync
                    logPlayerState();

                } catch (e) {
                    logPlayerState();
                    console.log("Exception: " + e.name);
                    throw e;
                }

                return new Promise(function (resolve, reject) {
                    try {

                        playResolve = resolve;
                        playReject = reject;

                        //prepare API should be done after open API.
                        webapis.avplay.prepareAsync(function () {
                            logPlayerState();
                            console.log("prepareAsync Success");

                            if (signal.aborted) {
                                playResolve = null;
                                playReject = null;
                                self.stop(false, false);
                                reject(getSignalRejectReason(signal));
                                return;
                            }

                            setDisplaySize();

                            seekBeforePlaybackStart(function () {
                                console.log('seekBeforePlaybackStart() succeeded');

                                if (signal.aborted) {
                                    playResolve = null;
                                    playReject = null;
                                    self.stop(false, false);
                                    reject(getSignalRejectReason(signal));
                                    return;
                                }

                                startPlayback();
                            }, function () {
                                console.log('seekBeforePlaybackStart() failed');
                                playResolve = null;
                                playReject = null;
                                reject();
                            });

                        }, function (e) {
                            logPlayerState();
                            console.log("prepareAsync Fail");
                            console.log(e);
                            playResolve = null;
                            playReject = null;
                            reject();
                        });
                    } catch (e) {
                        logPlayerState();
                        console.log("setCurrentSrc rejecting()");
                        console.log(e);
                        playResolve = null;
                        playReject = null;
                        reject();
                    }
                });
            });
        }

        function startPlayback() {
            if (!started && playResolve) {
                webapis.avplay.setSilentSubtitle(true);
                webapis.avplay.play();

                playReject = null;
                playResolve();
                playResolve = null;
                onPlaying();
            }
        }

        var SupportAttachmentFonts = true;

        function isSupportedFontType(codec) {

            switch ((codec || '').toLowerCase() || '') {

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

                var obj = {};
                obj[(i.title || '').toLowerCase() || 'unknown'] = i.url;
                return obj;
            })
        }

        function getFontUrls(apiClient, mediaSource, subtitleStream) {

            return getAttachmentFonts(apiClient, mediaSource, subtitleStream).map(function (i) {

                return i.url;
            })
        }

        function renderWithSubtitlesOctopus(videoElement, track, item, mediaSource) {

            var textTrackUrl = getTextTrackUrl(track, item, mediaSource);

            // this is purely for the videoSubtitles css
            loadWebVTT().then(function () {

                Promise.all([
                    getFallbackFontUrls(track),
                    Emby.importModule('./bower_components/javascriptsubtitlesoctopus/dist/subtitles-octopus.js')
                ]).then(function (responses) {

                    var fonts = responses[0];

                    ensureCustomSubtitlesElement(videoElement, false);

                    var canvasParent = self.videoSubtitlesElem;
                    canvasParent.classList.add('tizenvideo-subtitles-canvas-parent', 'flex', 'align-items-flex-start', 'justify-content-center');

                    var canvas = canvasParent.querySelector('canvas');
                    if (!canvas) {
                        canvas = document.createElement('canvas');
                        canvas.classList.add('tizenvideo-subtitles-canvas');

                        canvasParent.appendChild(canvas);
                    }

                    var apiClient = connectionManager.getApiClient(item);

                    var SubtitlesOctopus = responses[1];

                    var useAvailableFonts = false;
                    var availableFonts = useAvailableFonts ? getAvailableFonts(apiClient, mediaSource, track) : null;
                    var fontUrls = useAvailableFonts ? null : getFontUrls(apiClient, mediaSource, track);

                    console.log('available fonts: ' + JSON.stringify(useAvailableFonts || getAvailableFonts(apiClient, mediaSource, track)));

                    self.currentSubtitlesOctopus = new SubtitlesOctopus({
                        video: videoElement,
                        subUrl: textTrackUrl,
                        workerUrl: appRouter.baseUrl() + '/bower_components/javascriptsubtitlesoctopus/dist/subtitles-octopus-worker.js',
                        legacyWorkerUrl: appRouter.baseUrl() + '/bower_components/javascriptsubtitlesoctopus/dist/subtitles-octopus-worker-legacy.js',
                        supportsWebAssembly: browser.supportsWebAssembly,
                        fallbackFont: fonts[0],
                        fonts: fontUrls,
                        availableFonts: availableFonts,
                        onError: function () {
                            onErrorInternal(self, 'mediadecodeerror');
                        },
                        lossyRender: window.createImageBitmap != null,
                        detectAlphaBug: false,
                        canvas: canvas,
                        canvasParent: canvasParent,
                        onReady: function () {
                            console.log('SubtitlesOctopus : ready');
                            resetVideoRendererSize();
                        }
                    });

                    if (!self._resizeObserver) {
                        self._resizeObserver = new ResizeObserver(onVideoResize, {});
                        self._resizeObserver.observe(videoElement);
                    }
                });
            });
        }

        function getTextTrackUrl(track, item, mediaSource) {

            return playbackManager.getSubtitleUrl(track, item.ServerId);
        }

        function loadWebVTT() {
            return require(['webvtt']).then(function (responses) {

                WebVTT = responses[0];
                return WebVTT;
            });
        }

        function fetchVttSubtitles(track, item, mediaSource) {

            subtitleDebug2 = [];
            subtitleDebug2.push(track.Index);

            var promises = [
                loadWebVTT()
            ];

            return Promise.all(promises).then(function (responses) {

                var url = getTextTrackUrl(track, item, mediaSource);
                var WebVTT = responses[0];

                subtitleDebug2.push(url);

                return new Promise(function (resolve, reject) {

                    var xhr = new XMLHttpRequest();

                    xhr.open('GET', url, true);

                    xhr.onload = function (e) {

                        var parser = new WebVTT.Parser(window, WebVTT.StringDecoder(), { usePlainObjects: true });

                        var cues = [];

                        parser.oncue = function (cue) {
                            cues.push(cue);
                        };

                        parser.onflush = function () {
                            resolve(cues);
                        };

                        var vtt = this.response;

                        parser.parse(vtt);
                        parser.flush();
                    };

                    xhr.onerror = reject;

                    xhr.send();
                });
            });

        }

        function onVideoResize() {
            resetVideoRendererSize();
        }

        function resetVideoRendererSize() {

            var subtitlesOctopus = self.currentSubtitlesOctopus;
            if (subtitlesOctopus) {
                subtitlesOctopus.resize();
            }

            var renderer = currentAssRenderer;
            if (renderer) {
                var videoElement = self._mediaElement;
                var width = videoElement.offsetWidth;
                var height = videoElement.offsetHeight;
                console.log('videoElement resized: ' + width + 'x' + height);
                renderer.resize(width, height, 0, 0);
            }
        }

        function ensureCustomSubtitlesElement(videoElement, enableAutomaticPositioning) {
            if (!self.videoSubtitlesElem) {
                var subtitlesContainer = document.createElement('div');
                subtitlesContainer.classList.add('videoSubtitles', 'videoSubtitles-tv');
                if (enableAutomaticPositioning) {
                    subtitlesContainer.classList.add('videoSubtitles-autoposition');
                }
                self.videoSubtitlesElem = subtitlesContainer;
                setSubtitleAppearance(enableAutomaticPositioning);
                videoElement.parentNode.appendChild(subtitlesContainer);
            }
        }

        function renderSubtitlesWithCustomElement(videoElement, track, item, mediaSource) {

            fetchVttSubtitles(track, item, mediaSource).then(function (cues) {
                ensureCustomSubtitlesElement(videoElement, true);
                currentTrackEvents = cues;
            });
        }

        function renderEmbeddedSubtitles(videoElement, index) {

            loadWebVTT().then(function () {
                ensureCustomSubtitlesElement(videoElement, true);
                setEmbeddedSubtitleStreamIndex(index);
            });
        }

        function renderWithLibjass(videoElement, track, item, mediaSource) {

            var rendererSettings = {};

            // safer to just disable
            rendererSettings.enableSvg = false;

            Emby.importModule('./modules/libjass/libjass.js').then(function (libjass) {

                var textTrackUrl = getTextTrackUrl(track, item, mediaSource);

                libjass.ASS.fromUrl(textTrackUrl).then(function (ass) {

                    var clock = new libjass.renderers.ManualClock();
                    currentClock = clock;

                    // Create a DefaultRenderer using the video element and the ASS object
                    var renderer = new libjass.renderers.WebRenderer(ass, clock, videoElement.parentNode, rendererSettings);

                    currentAssRenderer = renderer;

                    renderer.addEventListener("ready", function () {
                        try {
                            renderer.resize(screen.width, screen.height, 0, 0);

                            if (!self._resizeObserver) {
                                self._resizeObserver = new ResizeObserver(onVideoResize, {});
                                self._resizeObserver.observe(videoElement);
                            }
                        } catch (ex) {
                        }
                    });
                }, function () {
                    onErrorInternal('mediadecodeerror');
                });
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

            var langsNotNeedingFont = [

                'dut',
                'nld',
                'nl',

                'eng',
                'en',
                'en-us',
                'en-gb',

                'fin',
                'fi',

                'fre',
                'fra',
                'fr',

                'ger',
                'deu',
                'de',

                'heb',
                'he',

                'hun',
                'hu',

                'ita',
                'it',

                'nor',
                'no',

                'pol',
                'pl',

                'por',
                'pt',
                'pob',
                'pt-br',

                'rus',
                'ru',

                'spa',
                'es',
                'es-mx',
                'es-419',

                'swe',
                'sv'
            ];

            return !langsNotNeedingFont.includes(language) && !langsNotNeedingFont.includes(language.split('-')[0]);
        }

        function getFallbackFontUrls(track) {

            return new Promise(function (resolve, reject) {
                var fonts = [];

                var fontPath = requiresExternalFontDownload(track)
                    ? '/modules/fonts/GoNotoKurrent.woff2'
                    : '/bower_components/javascriptsubtitlesoctopus/dist/default.woff2';

                tizen.filesystem.resolve("wgt-package", function (e) {
                    var wgtURI = e.toURI().substring(7); //ex: /opt/usr/home/owner/apps_rw/vYmY3AFREE/res/wgt
                    fonts.push('file://' + wgtURI + fontPath);
                    resolve(fonts);
                }, function (e) {
                    console.log(e);
                    resolve(fonts);
                }, "r");
            });
        }

        function renderAssSsa(videoElement, track, item, mediaSource) {

            if (browser.tizen && browser.sdkVersion && browser.sdkVersion < 3.0) {
                renderWithLibjass(videoElement, track, item, mediaSource);
                return;
            }

            if (isWebWorkerSupported() && isCanvasSupported()) {
                renderWithSubtitlesOctopus(videoElement, track, item, mediaSource);
                return;
            }

            renderWithLibjass(videoElement, track, item, mediaSource);
        }

        function setEmbeddedSubtitleStreamIndex(index) {

            subtitleDebug2 = [];
            subtitleDebug2.push(index);

            if (avPlayStreamInfos == null) {
                console.log('No streams found');
                return;
            }

            var streams = currentPlayOptions.mediaSource.MediaStreams || [];

            var subtitleIndex = -1;
            var i, length, stream;

            for (i = 0, length = streams.length; i < length; i++) {
                stream = streams[i];
                if (stream.Type === 'Subtitle' && (stream.DeliveryMethod === 'Embed' || stream.DeliveryMethod === 'Hls')) {
                    subtitleIndex++;

                    if (stream.Index === index) {

                        subtitleDebug2.push('Sub:' + subtitleIndex);
                        subtitleDebug2.push('SI:' + stream.Index);
                        subtitleDebug2.push(stream.DeliveryMethod.substring(0, 3));
                        subtitleDebug2.push(stream.DisplayTitle);

                        break;
                    }
                }
            }

            var textTrackIndex = -1;
            var avStreamIndex = -1;
            var realStreamIndex = -1;
            for (i = 0, length = avPlayStreamInfos.length; i < length; i++) {
                realStreamIndex++;
                if ((avPlayStreamInfos[i].type || '').toLowerCase() === 'text') {
                    textTrackIndex++;
                    if (textTrackIndex === subtitleIndex) {
                        avStreamIndex = parseInt(avPlayStreamInfos[i].index);
                        subtitleDebug2.push('SI:' + avStreamIndex);
                        subtitleDebug2.push('RI:' + realStreamIndex);
                        // Some models restart indexing at 0 for each stream type, use the realIndex instead.
                        if (stream.DeliveryMethod === 'Hls') {
                            avStreamIndex = realStreamIndex;
                            subtitleDebug2.push('RI');
                        } else {
                            subtitleDebug2.push('SI');
                        }
                        break;
                    }
                }
            }

            subtitleDebug3 = '';

            if (avStreamIndex >= 0) {

                try {
                    webapis.avplay.setSelectTrack("TEXT", avStreamIndex);
                } catch (e) {
                    subtitleDebug3 = e.name;
                    console.log('error caught setEmbeddedSubtitleStreamIndex() : ' + e.name);
                }
            }
        }

        self.setSubtitleStreamIndex = function (index) {

            subtitleDebug1 = [];
            subtitleDebug2 = [];
            subtitleDebug1.push(index);

            console.log('Setting new text track index to: ' + index);

            currentTextTrackIndex = index;

            try {
                webapis.avplay.setSilentSubtitle(index === -1);
            } catch (err) {
                console.log('error setting setSilentSubtitle: ' + err);
            }

            self.setSubtitleOffset(0);

            destroyCustomTrack();

            if (index === -1) {
                return;
            }

            var videoElement = self._mediaElement;
            var mediaSource = currentPlayOptions.mediaSource;
            var item = currentPlayOptions.item;

            // See if we have an external text track
            var track = index === -1 ? null : (mediaSource.MediaStreams || []).filter(function (t) {
                return t.Type === 'Subtitle' && t.Index === index;
            })[0];

            if (!track) {
                console.log('Error: track with index ' + index + ' not found');
                return;
            }

            subtitleDebug1.push(track.Index);
            subtitleDebug1.push(track.DeliveryMethod.substring(0, 3));
            subtitleDebug1.push(track.DisplayTitle);

            if (track.DeliveryMethod === 'External') {

                webapis.avplay.setSilentSubtitle(true);

                var format = (track.Codec || '').toLowerCase();

                if (format === 'ssa' || format === 'ass') {
                    renderAssSsa(videoElement, track, item, mediaSource);
                } else {
                    renderSubtitlesWithCustomElement(videoElement, track, item, mediaSource);
                }
            }
            else if (track.DeliveryMethod === 'Embed' || track.DeliveryMethod === 'Hls') {
                renderEmbeddedSubtitles(videoElement, index);
            }
        };

        function setInitialAudioTrack() {

            var options = currentPlayOptions;

            if (options.playMethod === 'Transcode') {
                return;
            }

            var mediaSource = options.mediaSource;

            var currentTrackIndex = -1;

            if (mediaSource.DefaultAudioStreamIndex != null) {
                var mediaStreams = options.mediaSource.MediaStreams || [];
                for (var i = 0, length = mediaStreams.length; i < length; i++) {
                    if (mediaStreams[i].Type === 'Audio') {
                        if (mediaSource.DefaultAudioStreamIndex === -1 || mediaStreams[i].Index === mediaSource.DefaultAudioStreamIndex) {
                            currentTrackIndex = mediaStreams[i].Index;
                            break;
                        }
                    }
                }
            }

            self.setAudioStreamIndex(currentTrackIndex);
        }

        function setInitialSubtitles() {

            var options = currentPlayOptions;
            var mediaSource = options.mediaSource;

            var currentTrackIndex = -1;

            if (mediaSource.DefaultSubtitleStreamIndex != null) {
                var mediaStreams = options.mediaSource.MediaStreams || [];
                for (var i = 0, length = mediaStreams.length; i < length; i++) {
                    if (mediaStreams[i].Type === 'Subtitle' && mediaStreams[i].Index === mediaSource.DefaultSubtitleStreamIndex) {
                        currentTrackIndex = mediaStreams[i].Index;
                        break;
                    }
                }
            }

            self.setSubtitleStreamIndex(currentTrackIndex);
        }

        self.canSetAudioStreamIndex = function () {
            return true;
        };

        function getMediaStreamAudioTracks(mediaSource) {

            return mediaSource.MediaStreams.filter(function (s) {
                return s.Type === 'Audio';
            });
        }

        function getSupportedAudioStreams() {

            var profile = lastProfile;
            var mediaSource = currentPlayOptions.mediaSource;

            return getMediaStreamAudioTracks(mediaSource).filter(function (stream) {
                return playbackManager.isAudioStreamSupported(stream, mediaSource, profile);
            });
        }

        self.setAudioStreamIndex = function (index) {

            audioDebug2 = [];
            audioDebug2.push(index);

            console.log('Setting new audio track index to: ' + index);

            if (avPlayStreamInfos == null) {
                console.log('No streams found');
                return;
            }

            // https://www.samsungdforum.com/TizenApiGuide/tizen3001/index.html
            var streams = getSupportedAudioStreams();

            if (streams.length < 2) {
                // If there's only one supported stream then trust that the player will handle it on it's own
                return;
            }

            var audioIndex = -1;
            var i, length, stream;

            for (i = 0, length = streams.length; i < length; i++) {
                stream = streams[i];

                audioIndex++;

                if (stream.Index === index) {

                    audioDebug2.push('Audio:' + audioIndex);
                    audioDebug2.push('AI:' + stream.Index);
                    audioDebug2.push(stream.DisplayTitle);

                    break;
                }
            }

            if (audioIndex === -1) {
                return;
            }

            var audioTrackIndex = -1;
            var avStreamIndex = -1;
            var realStreamIndex = -1;
            for (i = 0, length = avPlayStreamInfos.length; i < length; i++) {
                realStreamIndex++;
                if ((avPlayStreamInfos[i].type || '').toLowerCase() === 'audio') {
                    audioTrackIndex++;
                    if (audioTrackIndex === audioIndex) {
                        avStreamIndex = parseInt(avPlayStreamInfos[i].index);
                        audioDebug2.push('AI:' + avStreamIndex);
                        audioDebug2.push('RI:' + realStreamIndex);
                        break;
                    }
                }
            }

            audioDebug3 = '';
            if (avStreamIndex >= 0) {

                try {
                    webapis.avplay.setSelectTrack("AUDIO", avStreamIndex);
                } catch (e) {
                    audioDebug3 = e.name;
                    console.log('error caught setAudioStreamIndex() : ' + e.name);

                    // Retry
                    setTimeout(function() {
                        try {
                            webapis.avplay.setSelectTrack("AUDIO", avStreamIndex);
                        } catch (e) {
                            audioDebug3 = e.name;
                            console.log('error caught retrying setAudioStreamIndex() : ' + e.name);
                        }
                    }, 1000);
                }
            }
        };

        var supportedFeatures;
        function getSupportedFeatures() {

            var list = [];

            list.push('SetAspectRatio');
            list.push('SetSubtitleOffset');
            list.push('Mute');
            list.push('Unmute');
            list.push('ToggleMute');

            return list;
        }

        self.supports = function (feature) {

            if (!supportedFeatures) {
                supportedFeatures = getSupportedFeatures();
            }

            return supportedFeatures.indexOf(feature) !== -1;
        };

        self.setAspectRatio = function (val) {

            if (self._mediaElement) {
                setDisplaySize(val);
            }

            currentAspectRatio = val;
        };

        self.getAspectRatio = function () {

            return currentAspectRatio || 'auto';
        };

        self.getSupportedAspectRatios = function () {

            return [
                { name: globalize.translate('Auto'), id: 'auto' },
                { name: globalize.translate('Fill'), id: 'fill' }
            ];
        };

        self.getSubtitleOffset = function () {

            return currentSubtitleOffset;
        };

        function setSubtitleOffset(elem, val) {

            var isHls = currentPlayOptions.url.toLowerCase().indexOf('.m3u8') !== -1;

            if (isHls && currentTextTrackIndex >= 0) {
                try {
                    webapis.avplay.setSubtitlePosition(val);
                } catch (e) {
                }
            }
        }

        self.setSubtitleOffset = function (val) {

            var elem = this._mediaElement;
            if (elem) {
                currentSubtitleOffset = val;
                setSubtitleOffset(elem, val);
            }
        };

        self.incrementSubtitleOffset = function (val) {

            var elem = this._mediaElement;
            if (elem) {
                var newVal = currentSubtitleOffset + val;
                currentSubtitleOffset = newVal;
                setSubtitleOffset(elem, newVal);
            }
        };

        self.currentTime = function (val) {

            if (self._mediaElement) {
                if (val != null) {
                    self.seek(val * 10000);     //To Ticks
                    return;
                }

                if (_currentTime) {
                    return _currentTime;
                }

                var curTime;

                try {
                    curTime = webapis.avplay.getCurrentTime();
                } catch (e) {
                }

                return curTime || 0;
            }
        };

        self.duration = function (val) {

            if (self._mediaElement) {

                try {
                    var isLive = (webapis.avplay.getStreamingProperty("IS_LIVE") === "1");
                    var StartTime = webapis.avplay.getStreamingProperty("GET_LIVE_DURATION").split('|')[0];
                    var EndTime = webapis.avplay.getStreamingProperty("GET_LIVE_DURATION").split('|')[1];

                    // return null instead of 0
                    return isLive ? EndTime : (webapis.avplay.getDuration() || null);
                } catch (e) {
                    return webapis.avplay.getDuration() || null;
                }
            }

            return null;
        };

        self.suspend = function () {
            if (self._mediaElement) {

                var state;

                state = webapis.avplay.getState();
                console.log("Current state: " + state);

                if (state === 'PLAYING' || state === 'PAUSED') {
                    console.log("suspending");
                    webapis.avplay.suspend(); //Mandatory. You should call it, if you use avplay.
                } else {
                    console.log("stopping");
                    self.stop(true);
                    hideLoading();
                }
            }
        };

        self.restore = function () {
            if (self._mediaElement) {
                var gatewayStatus = webapis.network.isConnectedToGateway();
                if (gatewayStatus) {
                    //console.log("Current state: " + webapis.avplay.getState());
                    console.log("restoring avplay");
                    webapis.avplay.restore(); //video is played from last played url and time.
                }

            }
        };

        self.stop = function (destroyPlayer, reportEnded) {

            var elem = self._mediaElement;
            var src = currentSrc;

            if (elem) {

                try {

                    if (src) {
                        webapis.avplay.stop();
                    }

                    logPlayerState();

                } catch (e) {
                    logPlayerState();
                    console.log(e);
                }

                onEndedInternal(reportEnded);

                if (destroyPlayer) {
                    self.destroy();
                }
            }

            destroyCustomTrack();

            return Promise.resolve();
        };

        function tryRemoveElement(elem) {
            try {
                elem.remove();
            } catch (err) {
                console.log('Error removing dialog element: ' + err);
            }
        }

        function destroyCustomTrack() {

            if (self.videoSubtitlesElem) {
                tryRemoveElement(self.videoSubtitlesElem);
                self.videoSubtitlesElem = null;
            }

            currentTrackEvents = null;

            var videoElement = self._mediaElement;

            currentClock = null;

            var subtitlesOctopus = self.currentSubtitlesOctopus;
            if (subtitlesOctopus) {
                subtitlesOctopus.dispose();
                self.currentSubtitlesOctopus = null;
            }

            var renderer = currentAssRenderer;
            if (renderer) {

                renderer.setEnabled(false);

                var node;

                node = videoElement.parentNode.querySelector('.libjass-subs');
                if (node) {
                    tryRemoveElement(node);
                }

                node = videoElement.parentNode.querySelector('.libjass-font-measure');
                if (node) {
                    tryRemoveElement(node);
                }

            }
            currentAssRenderer = null;
        }

        self.destroy = function () {

            var videoElement = self._mediaElement;

            if (videoElement) {

                try {
                    webapis.avplay.close();
                    logPlayerState();
                } catch (e) {
                    logPlayerState();
                    console.log(e);
                }

                destroyCustomTrack();

                self._mediaElement = null;

                videoElement.remove();
            }

            var dlg = videoDialog;
            if (dlg) {

                videoDialog = null;

                dlg.remove();
            }
        };

        self.playPause = function () {

            // TODO: Is there a native playPause ?
            if (self.paused()) {
                self.unpause();
            } else {
                self.pause();
            }
        };

        self.pause = function () {
            if (self._mediaElement) {
                webapis.avplay.pause();
                onPause();
            }
        };

        // This is a retry after error
        self.resume = function () {
            if (self._mediaElement) {
                webapis.avplay.play();
            }
        };

        self.unpause = function () {
            if (self._mediaElement) {
                webapis.avplay.play();
                onUnpause();
            }
        };

        self.seekRelative = function (offsetMs) {
            if (self._mediaElement) {
                onWaiting();

                try {
                    if (offsetMs > 0) {
                        console.log('jumpForward() by ' + offsetMs + 'mSec');

                        // Don't seek past the end - Samsung requirement
                        if (_currentTime + offsetMs < self.duration() - 10000) {
                            webapis.avplay.jumpForward(offsetMs);
                        } else {
                            hideLoading();
                        }
                    } else {
                        console.log('jumpBackward() by ' + offsetMs + 'mSec');
                        webapis.avplay.jumpBackward(offsetMs * -1);
                    }

                    updateTime();

                } catch (err) {
                    // error might be thrown if seeking too fast
                    hideLoading();
                }
            }
        };

        function updateTime() {

            try {
                var curTime = webapis.avplay.getCurrentTime();
                onTimeUpdate(curTime);
            } catch (e) {
            }
        }

        self.seek = function (ticks) {

            var duration = self.duration();

            if (!duration || duration === 0) {
                return;
            }

            if (self._mediaElement) {
                onWaiting();
                try {
                    webapis.avplay.seekTo(parseInt(ticks / 10000));
                    updateTime();
                } catch (err) {
                    // error might be thrown if seeking too fast
                }
            }
        };

        self.paused = function () {

            if (self._mediaElement) {

                try {
                    return webapis.avplay.getState() === "PAUSED";
                }
                catch (err) {
                    console.log('error in paused method: ' + err);
                }
            }

            return false;
        };

        self.volume = function (val) {
            if (val != null) {
                return self.setVolume(val);
            }

            return self.getVolume();
        };

        self.getVolume = function () {
            return 100;
        };

        self.setVolume = function (val) {
            // 0-100
        };

        self.setMute = function (mute) {

            tizen.tvaudiocontrol.setMute(mute);
        };

        self.isMuted = function () {
            return tizen.tvaudiocontrol.isMute();
        };

        function addStreamsDebug(categories) {

            var enableAudioDebug = false;
            var enableSubtitleDebug = true;
            var enableStreamsDebug = false;

            if (!browser.tizenSideload) {
                return;
            }

            if (enableAudioDebug) {

                var audioDebugCategory = {
                    name: 'Audio Debug',
                    stats: [],
                    type: 'debug'
                };

                categories.push(audioDebugCategory);

                audioDebugCategory.stats.push({
                    label: '1:',
                    value: audioDebug1.join('/')
                });

                audioDebugCategory.stats.push({
                    label: '2:',
                    value: audioDebug2.join('/')
                });

                audioDebugCategory.stats.push({
                    label: '3:',
                    value: audioDebug3
                });
            }

            if (enableSubtitleDebug) {

                var subsDebugCategory = {
                    name: 'Subtitle Debug',
                    stats: [],
                    type: 'debug'
                };

                categories.push(subsDebugCategory);

                subsDebugCategory.stats.push({
                    label: '1:',
                    value: subtitleDebug1.join('/')
                });

                subsDebugCategory.stats.push({
                    label: '2:',
                    value: subtitleDebug2.join('/')
                });

                subsDebugCategory.stats.push({
                    label: '3:',
                    value: subtitleDebug3
                });
            }

            if (enableStreamsDebug) {

                var streamsDebugCategory = {
                    name: 'Streams Debug',
                    stats: [],
                    type: 'debug'
                };

                //categories.length = 0;
                categories.push(streamsDebugCategory);

                if (avPlayStreamInfos) {
                    for (var i = 0, length = avPlayStreamInfos.length; i < length; i++) {
                        streamsDebugCategory.stats.push({
                            label: avPlayStreamInfos[i].index + ':',
                            value: avPlayStreamInfos[i].type + '/' + avPlayStreamInfos[i].extra_info
                        });
                    }
                }
            }
        }

        self.getStats = function () {

            var mediaElement = self._mediaElement;

            var categories = [];

            if (!mediaElement) {
                return Promise.resolve({
                    categories: categories
                });
            }

            var videoCategory = {
                type: 'video',
                stats: []
            };

            categories.push(videoCategory);

            var height = mediaElement.videoHeight;
            var width = mediaElement.videoWidth;

            if (width && height) {
                videoCategory.stats.push({
                    label: 'Video Resolution',
                    value: width + 'x' + height
                });
            }

            var audioCategory = {
                type: 'audio',
                stats: []
            };

            categories.push(audioCategory);

            addStreamsDebug(categories);

            return Promise.resolve({
                categories: categories
            });
        };

        function onEnded() {

            destroyCustomTrack();
            onEndedInternal(true);
        }

        function onEndedInternal(triggerEnded) {

            avPlayStreamInfos = null;

            if (loadingDelayTimer) {
                clearTimeout(loadingDelayTimer);
                loadingDelayTimer = null;
            }

            if (!currentSrc) {
                triggerEnded = false;
            }

            if (triggerEnded !== false) {

                var stopInfo = {
                    src: currentSrc
                };

                events.trigger(self, 'stopped', [stopInfo]);

                _currentTime = null;
            }

            currentSrc = null;
        }

        function onTimeUpdate(timeMs) {

            // Get the player position + the transcoding offset
            _currentTime = timeMs;

            var subtitlesOctopus = self.currentSubtitlesOctopus;
            if (currentClock || subtitlesOctopus || currentTrackEvents) {
                timeMs -= currentSubtitleOffset;
                updateSubtitleText(timeMs);
            }

            events.trigger(self, 'timeupdate');
        }

        function onVolumeChange() {

            events.trigger(self, 'volumechange');
        }

        function setInitialTracks() {

            console.log('Setting initial tracks..');

            getPlayStreamInfos();

            if (avPlayStreamInfos == null) {
                console.log("Couldn't set initial tracks - avPlayStreamInfos == null");
                return;
            }

            if (avPlayStreamInfos.length === 0) {
                // Should never be 0, but it can be if we read too quick
                // Retry on next timeupdate
                console.log("Couldn't set initial tracks - avPlayStreamInfos.length === 0");
                return;
            }

            try {
                setInitialAudioTrack();
                setInitialSubtitles();
                initialTracksSet = true;
            } catch (err) {
                console.log('error in setInitialTracks: ' + err);
            }
        }

        function onWaiting(e) {

            events.trigger(self, 'waiting');
        }

        function onPlaying(e) {

            if (!started) {
                started = true;
            }
            events.trigger(self, 'playing');
        }

        function getPlayStreamInfos() {
            try {
                avPlayStreamInfos = webapis.avplay.getTotalTrackInfo();
            } catch (err) {
                console.log('error in getTotalTrackInfo: ' + err);
                avPlayStreamInfos = null;
            }
        }

        function seekBeforePlaybackStart(successCallback, errorCallback) {

            var duration = self.duration();

            if (!duration || duration === 0) {
                successCallback();
                return;
            }

            var seekTo = (currentPlayOptions.playerStartPositionTicks || 0);
            var timeMs = parseInt(seekTo) / 10000;

            if (Math.abs((self.currentTime() || 0) - timeMs) >= 5000) {
                webapis.avplay.seekTo(timeMs, successCallback, errorCallback);
            } else {
                successCallback();
            }
        }

        function onClick() {
            events.trigger(self, 'click');
        }

        function onDblClick() {
            events.trigger(self, 'dblclick');
        }

        function onPause() {
            events.trigger(self, 'pause');
        }

        function onUnpause() {
            events.trigger(self, 'unpause');
        }

        function sendToast(options) {

            require(['toast'], function (toast) {
                toast(options);
            });
        }

        function onError(eventType) {

            avPlayStreamInfos = null;
            var errorCode = eventType;
            console.log('Media element error code: ' + errorCode);

            var type;

            switch (errorCode) {
                case 'PLAYER_ERROR_CONNECTION_FAILED':
                    return; 	// ignore this as it should be handled gracefully by networkerror.js
                case 'UNKNOWN_ERROR_EVENT_FROM_PLAYER':
                    type = 'mediadecodeerror';        //Lots of generic render errors, try recode
                    break;
                default:
                    break;
            }

            sendToast('Media player error code: ' + errorCode);

            onErrorInternal(type);
        }

        function onErrorInternal(type) {

            destroyCustomTrack();

            events.trigger(self, 'error', [
                {
                    type: type
                }]);
        }

        function createMediaElement(options) {

            return new Promise(function (resolve, reject) {

                var dlg = document.querySelector('.tizenVideoPlayerContainer');

                if (!dlg) {

                    require(['css!' + pluginManager.mapPath(self, 'style.css')], function () {

                        var dlg = document.createElement('div');

                        dlg.classList.add('tizenVideoPlayerContainer');

                        var html = '';
                        html += '<object id="av-player" type="application/avplayer"></object>';

                        dlg.innerHTML = html;
                        var videoElement = dlg.querySelector('#av-player');

                        document.body.insertBefore(dlg, document.body.firstChild);
                        videoDialog = dlg;

                        videoElement.style.width = screen.width + 'px';
                        videoElement.style.height = screen.height + 'px';

                        self._mediaElement = videoElement;

                        resolve(videoElement);
                    });

                } else {

                    resolve(dlg.querySelector('#av-player'));
                }
            });
        }
    };
});