define(["exports", "./dom.js", "./common/servicelocator.js", "./common/playback/playbackmanager.js", "./emby-apiclient/connectionmanager.js", "./common/inputmanager.js", "./emby-apiclient/events.js", "./common/pluginmanager.js", "./common/appsettings.js", "./common/methodtimer.js", "./input/mouse.js"], function (_exports, _dom, _servicelocator, _playbackmanager, _connectionmanager, _inputmanager, _events, _pluginmanager, _appsettings, _methodtimer, _mouse) {
  Object.defineProperty(_exports, "__esModule", {
    value: true
  });
  _exports.default = void 0;
  /* jshint module: true */

  var isDebug = false;
  var minIdleTime = isDebug ? 3000 : 300000;
  var intervalLength = isDebug ? 3000 : 30000;
  var lastFunctionalEvent = 0;
  var currentPlayer;
  var isPlayingVideo;
  _events.default.on(_playbackmanager.default, 'playbackstart', function (e, player, state) {
    currentPlayer = player;
    isPlayingVideo = player.isLocalPlayer && state.NowPlayingItem && state.NowPlayingItem.MediaType !== 'Audio';
    if (isPlayingVideo) {
      lastFunctionalEvent = Date.now();
    }
  });
  _events.default.on(_playbackmanager.default, 'playbackstop', function (e, stopInfo) {
    if (isPlayingVideo && !stopInfo.nextMediaType) {
      lastFunctionalEvent = Date.now();
      isPlayingVideo = false;
      currentPlayer = null;
    }
  });
  function onLocalUserSignedIn(e) {
    lastFunctionalEvent = Date.now();
    this.resetInterval();
  }
  function onLocalUserSignedOut(e) {
    lastFunctionalEvent = Date.now();
    this.resetInterval();
  }
  function getUserSetting() {
    try {
      return _appsettings.default.screensaver();
    } catch (err) {
      return null;
    }
  }
  function getCurrentPlugin() {
    var option = getUserSetting();
    var plugins = _pluginmanager.default.ofType('screensaver');
    for (var i = 0, length = plugins.length; i < length; i++) {
      var plugin = plugins[i];
      if (plugin.id === option) {
        return plugin;
      }
    }
    return null;
  }
  function onInterval() {
    if (this.isShowing()) {
      return;
    }
    var now = Date.now();
    if (now - lastFunctionalEvent < minIdleTime) {
      return;
    }
    if (isPlayingVideo) {
      if (!_playbackmanager.default.paused(currentPlayer)) {
        return;
      }
    }
    var doc = document;
    if (doc.visibilityState === 'hidden') {
      return;
    }
    if (!doc.hasFocus()) {
      return;
    }
    if (_inputmanager.default.idleTime() < minIdleTime) {
      return;
    }
    if (now - _mouse.default.lastMouseInputTime() < minIdleTime) {
      return;
    }
    this.show();
  }
  function onAppSettingsChange(e, name) {
    if (name === 'screensaver') {
      this.resetInterval();
    }
  }
  function onInput(e) {
    var screenSaverManager = this;
    e.preventDefault();
    screenSaverManager.hide();
  }
  function ScreenSaverManager() {
    this.onInputFn = onInput.bind(this);
    this.hideFn = this.hide.bind(this);
    _events.default.on(_appsettings.default, 'change', onAppSettingsChange.bind(this));
    _events.default.on(_connectionmanager.default, 'localusersignedin', onLocalUserSignedIn.bind(this));
    _events.default.on(_connectionmanager.default, 'localusersignedout', onLocalUserSignedOut.bind(this));
    var apiClient = _connectionmanager.default.currentApiClient();
    if (apiClient && apiClient.getCurrentUserId()) {
      this.resetInterval();
    }
  }
  ScreenSaverManager.prototype.resetInterval = function () {
    if (getCurrentPlugin()) {
      this.setInterval();
    } else {
      this.clearInterval();
    }
  };
  ScreenSaverManager.prototype.setInterval = function () {
    if (this.interval) {
      return;
    }
    if (!_servicelocator.appHost.supports('screensaver')) {
      return;
    }
    this.interval = new _methodtimer.default({
      onInterval: onInterval.bind(this),
      timeoutMs: intervalLength,
      type: 'interval'
    });
  };
  ScreenSaverManager.prototype.clearInterval = function () {
    var interval = this.interval;
    if (interval) {
      this.interval = null;
      interval.destroy();
    }
  };
  ScreenSaverManager.prototype.showScreenSaver = function (screensaver) {
    if (this.activeScreenSaver) {
      return;
    }
    console.log('Showing screensaver ' + screensaver.name);
    screensaver.show();
    this.activeScreenSaver = screensaver;
    this.removeHideEventListeners();
    this.addHideEventListeners();
    var onInputFn = this.onInputFn;
    _inputmanager.default.on(window, onInputFn);
  };
  ScreenSaverManager.prototype.isShowing = function () {
    return this.activeScreenSaver != null;
  };
  function checkRegistration() {
    return Emby.importModule('./modules/registrationservices/registrationservices.js').then(function (registrationServices) {
      return registrationServices.validateFeature('screensaver', {
        showDialog: false
      });
    });
  }
  function onReject() {}
  function showInternal() {
    var screensaver = getCurrentPlugin();
    if (screensaver) {
      this.showScreenSaver(screensaver);
    }
  }
  ScreenSaverManager.prototype.show = function () {
    if (this.isShowing()) {
      return;
    }
    if (!getCurrentPlugin()) {
      return;
    }
    checkRegistration().then(showInternal.bind(this), onReject);
  };
  ScreenSaverManager.prototype.addHideEventListeners = function () {
    var hideFn = this.hideFn;
    _dom.default.addEventListener(window, 'click', hideFn, {
      capture: true,
      passive: true
    });
    _dom.default.addEventListener(window, 'mousemove', hideFn, {
      capture: true,
      passive: true
    });
  };
  ScreenSaverManager.prototype.removeHideEventListeners = function () {
    var hideFn = this.hideFn;
    _dom.default.removeEventListener(window, 'click', hideFn, {
      capture: true,
      passive: true
    });
    _dom.default.removeEventListener(window, 'mousemove', hideFn, {
      capture: true,
      passive: true
    });
  };
  ScreenSaverManager.prototype.hide = function () {
    lastFunctionalEvent = Date.now();
    var screensaver = this.activeScreenSaver;
    if (screensaver) {
      this.activeScreenSaver = null;
      console.log('Hiding screensaver');
      screensaver.hide();
      console.log('unbind ' + Date.now());
      this.removeHideEventListeners();
      var onInputFn = this.onInputFn;
      _inputmanager.default.off(window, onInputFn);
    }
  };
  var _default = _exports.default = new ScreenSaverManager();
});
