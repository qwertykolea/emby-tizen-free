define(["exports", "./browser.js", "./common/appsettings.js", "./emby-apiclient/events.js"], function (_exports, _browser, _appsettings, _events) {
  Object.defineProperty(_exports, "__esModule", {
    value: true
  });
  _exports.default = void 0;
  /* jshint module: true */

  var appMode = globalThis.appMode;
  var isNativeTizen = appMode === 'tizen';
  var isNativeLG = appMode === 'webos';
  var isNativeVegaOS = appMode === 'vegaos';
  function generateRandomUUID() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
      var r = Math.random() * 16 | 0,
        v = c === 'x' ? r : r & 0x3 | 0x8;
      return v.toString(16);
    });
  }
  function getDeviceId() {
    var key = '_deviceId2';
    var deviceId = _appsettings.default.get(key);
    if (deviceId) {
      return Promise.resolve(deviceId);
    } else {
      if (globalThis.crypto && crypto.randomUUID) {
        deviceId = crypto.randomUUID();
      } else {
        // this is a hack for older webos and possibly tizen
        // we're loading a polyfill, and yet still for some reason the method is sometimes not available
        deviceId = generateRandomUUID();
      }
      _appsettings.default.set(key, deviceId);
      return Promise.resolve(deviceId);
    }
  }
  function containsGreaseChar(value) {
    return value.includes('\\') || value.includes('/') || value.includes(';') || value.includes('"') || value.toLowerCase().includes('brand');
  }
  function isGenericBrand(value) {
    value = value.toLowerCase();
    if (value.includes('chromium')) {
      return true;
    }
    return false;
  }
  function compareBrands(a, b) {
    var aName = a.brand || '';
    var bName = b.brand || '';
    if (containsGreaseChar(aName) && !containsGreaseChar(bName)) {
      return 1;
    }
    if (!containsGreaseChar(aName) && containsGreaseChar(bName)) {
      return -1;
    }
    if (isGenericBrand(aName) && !isGenericBrand(bName)) {
      return 1;
    }
    if (!isGenericBrand(aName) && isGenericBrand(bName)) {
      return -1;
    }
    if (aName < bName) {
      return -1;
    }
    if (aName > bName) {
      return 1;
    }
    return 0;
  }
  function map(i) {
    return i;
  }
  function getDeviceName() {
    var _navigator$userAgentD;
    if (_browser.default.tizen) {
      var _deviceName = "Samsung Smart TV";
      _deviceName += globalThis.webapis && globalThis.webapis.productinfo ? " (" + globalThis.webapis.productinfo.getRealModel() + ")" : '';
      return Promise.resolve(_deviceName);
    }
    if (isNativeLG) {
      var _deviceName2 = "LG Smart TV";
      var modelName = _browser.default.modelName;
      _deviceName2 += modelName.length > 0 ? ' (' + modelName + ')' : '';
      return Promise.resolve(_deviceName2);
    }
    if (_browser.default.operaTv) {
      return Promise.resolve('Opera TV');
    }
    var deviceName;
    var brandsArray = Array.prototype.map.call(((_navigator$userAgentD = navigator.userAgentData) == null ? void 0 : _navigator$userAgentD.brands) || [], map);
    var brands = brandsArray.sort(compareBrands);
    if (brands.length) {
      deviceName = brands[0].brand;
    }
    if (!deviceName) {
      deviceName = 'Web Browser';
    }
    return navigator.userAgentData.getHighEntropyValues(['platform']).then(function (values) {
      if (values.platform) {
        deviceName += ' ' + values.platform;
      }
      return Promise.resolve(deviceName);
    });
  }
  function supportsFullscreen() {
    if (_browser.default.tv) {
      return false;
    }
    if (typeof document === 'undefined') {
      return false;
    }
    var element = document.documentElement;
    if (element.requestFullscreen || element.mozRequestFullScreen || element.webkitRequestFullscreen || element.msRequestFullscreen) {
      return true;
    }

    // safari
    if (document.createElement('video').webkitEnterFullscreen) {
      return true;
    }
    return false;
  }
  function supportsSoundEffects() {
    // Poor performance
    // Causing lockups on tizen 2016
    if (_browser.default.tizen || _browser.default.operaTv || isNativeLG || isNativeVegaOS || _browser.default.netcast) {
      return false;
    }
    var cores = navigator.hardwareConcurrency || 4;
    if (cores < 4) {
      return false;
    }
    var deviceMemory = navigator.deviceMemory || 2;
    if (deviceMemory < 2) {
      return false;
    }

    // Only enable if WebAudio is supported. Using a fallback is too slow.
    if (globalThis.AudioContext) {
      return document.createElement('audio').canPlayType('audio/mp3').replace(/no/, '');
    }
    return false;
  }
  function supportInAppConnectSignup() {
    if (appMode === 'embyclient') {
      return true;
    }
    if (_browser.default.operaTv || isNativeTizen || isNativeLG || isNativeVegaOS) {
      return true;
    }
    return globalThis.location.href.toLowerCase().startsWith('https');
  }
  function getSyncProfile() {
    return Emby.importModule('./modules/browserdeviceprofile.js').then(function (profileBuilder) {
      return profileBuilder({
        maxStaticMusicBitrate: _appsettings.default.maxStaticMusicBitrate()
      });
    });
  }
  function supportsColorScheme() {
    if (!globalThis.matchMedia) {
      return false;
    }
    try {
      var isDarkMode = window.matchMedia("(prefers-color-scheme: dark)").matches;
      var isLightMode = window.matchMedia("(prefers-color-scheme: light)").matches;
      var isNotSpecified = window.matchMedia("(prefers-color-scheme: no-preference)").matches;
      var hasNoSupport = !isDarkMode && !isLightMode && !isNotSpecified;

      //window.matchMedia("(prefers-color-scheme: dark)").addListener(e => e.matches && activateDarkMode())
      //window.matchMedia("(prefers-color-scheme: light)").addListener(e => e.matches && activateLightMode())
      return !hasNoSupport;
    } catch (err) {
      return false;
    }
  }
  function getPreferredTheme() {
    try {
      var isDarkMode = window.matchMedia("(prefers-color-scheme: dark)").matches;
      if (isDarkMode) {
        return 'dark';
      }
      var isLightMode = window.matchMedia("(prefers-color-scheme: light)").matches;
      if (isLightMode) {
        return 'light';
      }
    } catch (err) {}
    return null;
  }
  function hasPhysicalBackButton() {
    if (_browser.default.tv) {
      return true;
    }
    return false;
  }
  var supportedFeatures = function () {
    var features = {};
    if (navigator.share) {
      features.sharing = true;
    }
    if (!_browser.default.tv) {
      features.filedownload = true;
    }
    if (_browser.default.operaTv || isNativeTizen || isNativeLG || isNativeVegaOS) {
      features.exit = true;
    }
    if (!isNativeLG && !isNativeTizen && !_browser.default.operaTv && !isNativeVegaOS) {
      features.htmlaudio_fadeout = true;
    }
    if (!isNativeLG && !isNativeTizen) {
      features.htmlaudio_setplaybackrate = true;
    }
    if (!_browser.default.iOS && !_browser.default.ipad) {
      features.themesongvolume = true;
      features.htmlmedia_setvolume = true;
    }

    // samsung rejected over this a long time ago, although we could try again at some point
    if (!isNativeLG && !isNativeTizen && !isNativeVegaOS) {
      features.plugins = true;
      features.screensaver = true;
    }

    // the app stores may reject over navigation that pops open the browser
    if (!_browser.default.operaTv && !isNativeTizen && !isNativeLG && !isNativeVegaOS && !_browser.default.playstation) {
      features.externallinks = true;
      features.externalpremium = true;
    }
    features.externallinkdisplay = true;
    features.externalappinfo = true;
    if (!_browser.default.tv) {
      features.displaymode = true;
      features.fullscreenmediaqueries = true;
    }
    if (!isNativeLG && !isNativeTizen && !isNativeVegaOS) {
      features.ebookplayer = true;
      features.pdfplayer = true;
    }
    if (supportsFullscreen()) {
      features.fullscreenchange = true;
    }
    if (supportsSoundEffects()) {
      features.soundeffects = true;
    }
    if (supportInAppConnectSignup()) {
      features.connectsignup = true;
    }
    var isLocalServer = !appMode;
    if (!isLocalServer) {
      features.multiserver = true;

      // With the web app on https, don't allow connection to http server urls
      if ((globalThis.location || {}).protocol === 'https:') {
        features.rejectinsecureaddresses = true;
      }
    } else {
      features.maskembynameonlogin = true;
    }
    if ((appMode || 'standalone') === 'standalone') {
      features.sessionstorage = true;
    }
    if (_browser.default.tv) {
      features.physicalvolumecontrol = true;
      features.nativevolumeosd = true;
    }

    //features.applogger = true;
    features.otherapppromotions = true;
    features.targetblank = true;
    features.subtitleappearancesettings = true;
    if (!_browser.default.tv) {
      features.fileinput = true;
      features.keyboardsettings = true;
    }
    features.remotecontrol = true;
    features.youtube = true;
    features.youtube_embedded = true;
    if (_browser.default.chrome) {
      features.chromecast = true;
    }
    if (supportsColorScheme()) {
      features.preferredtheme = true;
    }
    if (!isNativeTizen && !isNativeLG && !isNativeVegaOS) {
      features.premiereinheader = true;
    }
    if (hasPhysicalBackButton()) {
      features.physicalbackbutton = true;
    }
    if (!isNativeTizen && !isNativeLG && !isNativeVegaOS) {
      features.serversetup = true;
    }
    features.subtitlepositionbottom = true;
    features.subtitlepositiontop = true;
    features.sleeptimer = true;

    // lg rejected when their native keyboard wasn't used
    if (isNativeLG) {
      features.searchwithnativekeyboard = true;
    }

    // chrome blocks this when not secure
    if (globalThis.SpeechRecognition && globalThis.isSecureContext) {
      // api exists but doesn't work on tizen
      // don't know if it works on LG but don't want to deal with a possible rejection over it
      if (!isNativeTizen && !isNativeLG) {
        features.speechrecognition = true;
      }
    }
    if (isNativeTizen || isNativeLG || isNativeVegaOS) {
      features.forcetranscodingforformats = true;
    }
    return features;
  }();
  function getAppVersion() {
    // Tizen
    if (isNativeTizen && tizen.application && tizen.application.getAppInfo) {
      return Promise.resolve(tizen.application.getAppInfo().version);
    }

    // Orsay
    if (globalThis.curWidget && globalThis.curWidget.version) {
      return Promise.resolve(globalThis.curWidget.version);
    }

    // LG
    if (globalThis.webOS && globalThis.webOS.fetchAppInfo) {
      return new Promise(function (resolve) {
        globalThis.webOS.fetchAppInfo(function (info) {
          resolve(info.version);
        });
      });
    }
    return Promise.resolve(globalThis.dashboardVersion || '3.0.0');
  }
  function getAppName() {
    if (isNativeLG) {
      return 'Emby for LG';
    }
    if (isNativeTizen) {
      return 'Emby for Samsung';
    }
    return 'Emby Web';
  }
  function brandsContain(brands, txt) {
    for (var i = 0, length = brands.length; i < length; i++) {
      var brand = brands[i];
      var brandName = (brand.brand || '').toLowerCase();
      if (brandName.includes(txt)) {
        return true;
      }
    }
    return false;
  }
  var deviceId;
  var deviceName;
  var appName = getAppName();
  var appVersion;
  var appHost = {
    getWindowState: function () {
      return document.windowState || 'Normal';
    },
    setWindowState: function (state) {
      throw new Error('setWindowState is not supported and should not be called');
    },
    exit: function () {
      _events.default.trigger(this, 'beforeexit');
      if (window.NetCastExit) {
        try {
          window.NetCastExit();
        } catch (err) {
          console.log('error closing application: ' + err);
        }
        return;
      }
      if (window.webOS) {
        try {
          webOS.platformBack();
        } catch (err) {
          console.log('error closing application: ' + err);
        }
        return;
      }
      if (window.tizen) {
        try {
          tizen.application.getCurrentApplication().exit();
        } catch (err) {
          console.log('error closing application: ' + err);
        }
        return;
      }
      window.close();
    },
    supports: function (command) {
      return supportedFeatures[command];
    },
    moreIcon: 'dots-horiz',
    getSyncProfile: getSyncProfile,
    init: function () {
      return getDeviceId().then(function (generatedDeviceId) {
        deviceId = generatedDeviceId;
        return getDeviceName().then(function (generatedDeviceName) {
          deviceName = generatedDeviceName;
          return getAppVersion().then(function (generatedAppVersion) {
            appVersion = generatedAppVersion;
          });
        });
      });
    },
    deviceName: function () {
      return deviceName;
    },
    deviceId: function () {
      return deviceId;
    },
    appName: function () {
      return appName;
    },
    appVersion: function () {
      return appVersion;
    },
    getPushTokenInfo: function () {
      return {};
    },
    setTheme: function (themeSettings) {
      var metaThemeColor = document.querySelector("meta[name=theme-color]");
      if (metaThemeColor) {
        metaThemeColor.setAttribute("content", themeSettings.themeColor);
      }
    },
    setUserScalable: function (scalable) {
      if (_browser.default.tv) {
        return;
      }
      var att = scalable ? 'viewport-fit=cover, width=device-width, initial-scale=1, minimum-scale=1, user-scalable=yes' : 'viewport-fit=cover, width=device-width, initial-scale=1, minimum-scale=1, maximum-scale=1, user-scalable=no';
      document.querySelector('meta[name=viewport]').setAttribute('content', att);
    },
    deviceIconUrl: function () {
      var _navigator$userAgentD2;
      var brands = ((_navigator$userAgentD2 = navigator.userAgentData) == null ? void 0 : _navigator$userAgentD2.brands) || [];
      if (_browser.default.xboxOne) {
        return 'https://github.com/MediaBrowser/Emby.Resources/raw/master/images/devices/xboxone.png';
      } else if (_browser.default.opera || _browser.default.operaTv) {
        return 'https://github.com/MediaBrowser/Emby.Resources/raw/master/images/devices/opera.png';
      } else if (isNativeTizen) {
        return 'https://github.com/MediaBrowser/Emby.Resources/raw/master/images/devices/samsungtv.png';
      } else if (isNativeLG || _browser.default.netcast) {
        return 'https://github.com/MediaBrowser/Emby.Resources/raw/master/images/devices/lgtv.png';
      } else if (_browser.default.playstation) {
        return 'https://github.com/MediaBrowser/Emby.Resources/raw/master/images/devices/playstation.png';
      } else if (_browser.default.chromecast) {
        return 'https://github.com/MediaBrowser/Emby.Resources/raw/master/images/devices/chromecast.png';
      } else if (brandsContain(brands, 'chrome')) {
        return 'https://github.com/MediaBrowser/Emby.Resources/raw/master/images/devices/chrome.png';
      } else if (brandsContain(brands, 'safari')) {
        return 'https://github.com/MediaBrowser/Emby.Resources/raw/master/images/devices/safari.png';
      } else if (brandsContain(brands, 'firefox')) {
        return 'https://github.com/MediaBrowser/Emby.Resources/raw/master/images/devices/firefox.png';
      } else if (brandsContain(brands, 'edge')) {
        return 'https://github.com/MediaBrowser/Emby.Resources/raw/master/images/devices/edge_chromium.png';
      }
      return 'https://github.com/MediaBrowser/Emby.Resources/raw/master/images/devices/html5.png';
    },
    getPreferredTheme: getPreferredTheme,
    requestSpeechRecognitionPermission: function () {
      return Promise.resolve();
    }
  };
  var doc = globalThis.document;
  var _isHidden = false;
  function onAppVisible() {
    if (_isHidden) {
      _isHidden = false;
      //console.log('triggering app resume event');
      _events.default.trigger(appHost, 'resume');
    }
  }
  function onAppHidden() {
    if (!_isHidden) {
      _isHidden = true;
      //console.log('app is hidden');
      _events.default.trigger(appHost, 'pause');
    }
  }
  if (doc) {
    doc.addEventListener('visibilitychange', function () {
      if (document.hidden) {
        onAppHidden();
      } else {
        onAppVisible();
      }
    });
  }
  if (globalThis.addEventListener && doc) {
    globalThis.addEventListener('focus', onAppVisible);
    globalThis.addEventListener('blur', onAppHidden);
  }
  var _default = _exports.default = appHost;
});
