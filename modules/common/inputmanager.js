define(["exports", "./../dom.js", "./../approuter.js", "./playback/playbackmanager.js", "./../focusmanager.js", "./servicelocator.js", "./../emby-apiclient/events.js", "./../layoutmanager.js"], function (_exports, _dom, _approuter, _playbackmanager, _focusmanager, _servicelocator, _events, _layoutmanager) {
  Object.defineProperty(_exports, "__esModule", {
    value: true
  });
  _exports.default = void 0;
  /* jshint module: true */

  var lastInputTime = Date.now();
  function notify(triggerCommand, evt) {
    lastInputTime = Date.now();
    if (triggerCommand !== false) {
      // TODO: Why did we do this?
      handleCommand('unknown', {
        originalEvent: evt
      });
    }
  }
  function idleTime() {
    return Date.now() - lastInputTime;
  }
  function onFunctionalEvent() {
    lastInputTime = Date.now();
  }
  _events.default.on(_servicelocator.appHost, 'pause', onFunctionalEvent);
  _events.default.on(_servicelocator.appHost, 'resume', onFunctionalEvent);
  _events.default.on(_approuter.default, 'navigate', onFunctionalEvent);
  function select(sourceElement) {
    sourceElement.click();
  }
  function on(scope, fn, options) {
    if (!options) {
      options = {};
    }
    _dom.default.addEventListener(scope, 'command', fn, options);
  }
  function off(scope, fn, options) {
    if (!options) {
      options = {};
    }
    _dom.default.removeEventListener(scope, 'command', fn, options);
  }
  var commandTimes = {};
  function checkCommandTime(command) {
    var last = commandTimes[command] || 0;
    var now = Date.now();
    if (now - last < 1000) {
      return false;
    }
    commandTimes[command] = now;
    return true;
  }
  function normalizeSourceElement(sourceElement) {
    var focusScope = _focusmanager.default.getCurrentScope();
    if (sourceElement) {
      if (!focusScope.contains(sourceElement)) {
        // try to limit when we're doing this because it creates inflexibility, e.g., dialog open but we still want the command triggered on an element outside of it (search)
        // tried to limit this to when sourceElement is only html or body, but this creates an issue in android: tap hold poster to open dialog, no autofocusing has occurred,
        // therefore the poster still has focus and focusScope never gets rerouted to the dialog
        // the better fix would be to always ensure that the dialog has focus even if we don't want to visually display focus, but how to do that..
        // if that ever happens, then this normalization can be removed when an explicit sourceElement is passed in
        sourceElement = focusScope;
      }
    } else {
      sourceElement = focusScope;
    }
    return sourceElement;
  }
  function isTextEditable(elem) {
    var readOnly = elem.readOnly;
    if (readOnly) {
      return false;
    }
    if (readOnly === false) {
      if (elem.tagName === 'TEXTAREA') {
        return true;
      }
      var type = elem.type;
      switch (type) {
        case 'checkbox':
        case 'radio':
        case 'file':
        case 'hidden':
        case 'range':
          return false;
        default:
          return true;
      }
    }
    return false;
  }
  function allowNavAtStart(elem) {
    return elem.selectionStart === 0;
  }
  function allowNavAtEnd(elem) {
    var text = elem.value || '';
    return elem.selectionEnd >= text.length;
  }
  function allowNavInSelectionRange(elem, command) {
    if (command === 'left') {
      if (document.dir === 'rtl') {
        return allowNavAtEnd(elem);
      }
      return allowNavAtStart(elem);
    }
    if (document.dir === 'rtl') {
      return allowNavAtStart(elem);
    }
    return allowNavAtEnd(elem);
  }
  function allowLeftOrRightNav(elem, command) {
    if (!isTextEditable(elem)) {
      return true;
    }
    var tagName = elem.tagName;
    switch (tagName) {
      case 'TEXTAREA':
        return allowNavInSelectionRange(elem, command);
      /* jshint ignore:start */
      case 'INPUT':
        var type = elem.type;
        switch (type) {
          // https://html.spec.whatwg.org/multipage/input.html#do-not-apply
          case 'text':
          case 'tel':
          case 'url':
          case 'password':
          case 'search':
            return allowNavInSelectionRange(elem, command);
          // returning true breaks left and right in the native osk on the xbox
          case 'number':
            return false;
          default:
            return _layoutmanager.default.tv ? true : false;
        }
      /* jshint ignore:end */
      default:
        return true;
    }
  }
  function showChannelChanger(currentItem, offset) {
    return Emby.importModule('./modules/channelchanger/channelchanger.js').then(function (ChannelChanger) {
      return ChannelChanger.onChannelChangeRequest({
        currentItem: currentItem,
        offset: offset
      });
    });
  }
  function handleChannelChangeCommand(offset) {
    if (_playbackmanager.default.isPlayingVideo()) {
      var item = _playbackmanager.default.currentItem();
      if (item) {
        if (item.Type === 'TvChannel') {
          showChannelChanger(item, offset);
          return;
        } else {
          //showChannelChanger({ Id: '161193', Type: 'TvChannel', ServerId: item.ServerId }, offset);
          //return;
        }
      }
    }
    if (offset > 0) {
      _playbackmanager.default.channelUp();
    } else {
      _playbackmanager.default.channelDown();
    }
  }
  function handleCommand(name, options) {
    lastInputTime = Date.now();
    var sourceElement = options ? options.sourceElement : null;
    if (!sourceElement) {
      sourceElement = document.activeElement;
    }

    //console.log('handleCommand: ' + sourceElement?.className);

    sourceElement = normalizeSourceElement(sourceElement);
    var eventInfo = {
      detail: {
        command: name
      },
      bubbles: true,
      cancelable: true
    };
    if (options) {
      eventInfo.detail.repeat = options.repeat;
      eventInfo.detail.originalEvent = options.originalEvent;
      eventInfo.detail.commandOptions = options;
    }
    var eventResult = sourceElement.dispatchEvent(new CustomEvent("command", eventInfo));
    if (!eventResult) {
      // event cancelled
      return true;
    }
    switch (name) {
      case 'up':
        // in case focus changed during the event handler
        sourceElement = document.activeElement || sourceElement;
        sourceElement = normalizeSourceElement(sourceElement);
        _focusmanager.default.moveUp(sourceElement);
        return true;
      case 'down':
        // in case focus changed during the event handler
        sourceElement = document.activeElement || sourceElement;
        sourceElement = normalizeSourceElement(sourceElement);
        _focusmanager.default.moveDown(sourceElement);
        return true;
      case 'left':
        // in case focus changed during the event handler
        sourceElement = document.activeElement || sourceElement;
        sourceElement = normalizeSourceElement(sourceElement);
        if (allowLeftOrRightNav(sourceElement, name)) {
          var _options$originalEven;
          if (_focusmanager.default.moveLeft(sourceElement)) {
            return true;
          }
          if (options != null && (_options$originalEven = options.originalEvent) != null && _options$originalEven.repeat) {
            return true;
          }

          // this is for the left nav to pop open. it's quirky to do it this way, but gets the job done
          handleCommand('moveleftedge', {
            sourceElement: sourceElement,
            originalEvent: eventInfo.detail.originalEvent
          });
          return true;
        }
        return false;
      case 'right':
        // in case focus changed during the event handler
        sourceElement = document.activeElement || sourceElement;
        sourceElement = normalizeSourceElement(sourceElement);
        if (allowLeftOrRightNav(sourceElement, name)) {
          var _options$originalEven2;
          if (_focusmanager.default.moveRight(sourceElement)) {
            return true;
          }
          if (options != null && (_options$originalEven2 = options.originalEvent) != null && _options$originalEven2.repeat) {
            return true;
          }

          // this is for the left nav to pop open. it's quirky to do it this way, but gets the job done
          handleCommand('moverightedge', {
            sourceElement: sourceElement,
            originalEvent: eventInfo.detail.originalEvent
          });
          return true;
        }
        return false;
      case 'home':
        _approuter.default.goHome();
        return true;
      case 'settings':
        _approuter.default.showSettings();
        return true;
      case 'back':
        _approuter.default.back();
        return true;
      case 'forward':
        _approuter.default.forward();
        return true;
      case 'select':
        // in case focus changed during the event handler
        sourceElement = document.activeElement || sourceElement;
        sourceElement = normalizeSourceElement(sourceElement);
        select(sourceElement);
        return true;
      case 'menu':
      case 'info':
        return true;
      case 'nextchapter':
        _playbackmanager.default.nextChapter();
        return true;
      case 'next':
      case 'nexttrack':
        _playbackmanager.default.nextTrack();
        return true;
      case 'previous':
      case 'previoustrack':
        _playbackmanager.default.previousTrack();
        return true;
      case 'previouschapter':
        _playbackmanager.default.previousChapter();
        return true;
      case 'guide':
        _approuter.default.showGuide();
        return true;
      case 'recordedtv':
        _approuter.default.showRecordedTV();
        return true;
      case 'record':
        return true;
      case 'livetv':
        _approuter.default.showLiveTV();
        return true;
      case 'mute':
        _playbackmanager.default.setMute(true);
        return true;
      case 'unmute':
        _playbackmanager.default.setMute(false);
        return true;
      case 'togglemute':
        _playbackmanager.default.toggleMute();
        return true;
      case 'channelup':
        handleChannelChangeCommand(1);
        return true;
      case 'channeldown':
        handleChannelChangeCommand(-1);
        return true;
      case 'volumedown':
        _playbackmanager.default.volumeDown();
        return true;
      case 'volumeup':
        _playbackmanager.default.volumeUp();
        return true;
      case 'play':
        _playbackmanager.default.unpause();
        return true;
      case 'pause':
        _playbackmanager.default.pause();
        return true;
      case 'playpause':
        _playbackmanager.default.playPause();
        return true;
      case 'stop':
        if (checkCommandTime('stop')) {
          _playbackmanager.default.stop();
        }
        return true;
      case 'changezoom':
        _playbackmanager.default.toggleAspectRatio();
        return true;
      case 'changeaudiotrack':
        _playbackmanager.default.changeAudioStream();
        return true;
      case 'changesubtitletrack':
        _playbackmanager.default.changeSubtitleStream();
        return true;
      case 'search':
        _approuter.default.showSearch();
        return true;
      case 'favorites':
        _approuter.default.showFavorites();
        return true;
      case 'fastforward':
        _playbackmanager.default.fastForward();
        return true;
      case 'rewind':
        _playbackmanager.default.rewind();
        return true;
      case 'triggertranscodingfallback':
        _playbackmanager.default.triggerTranscodingFallback();
        return true;
      case 'togglefullscreen':
        _playbackmanager.default.toggleFullscreen();
        return true;
      case 'disabledisplaymirror':
        _playbackmanager.default.enableDisplayMirroring(false);
        return true;
      case 'enabledisplaymirror':
        _playbackmanager.default.enableDisplayMirroring(true);
        return true;
      case 'toggledisplaymirror':
        _playbackmanager.default.toggleDisplayMirroring();
        return true;
      case 'togglestats':
        //playbackManager.toggleStats();
        return true;
      case 'movies':
        // TODO
        _approuter.default.goHome();
        return true;
      case 'music':
        // TODO
        _approuter.default.goHome();
        return true;
      case 'tv':
        // TODO
        _approuter.default.goHome();
        return true;
      case 'nowplaying':
        _approuter.default.showNowPlaying();
        return true;
      case 'save':
        return true;
      case 'screensaver':
        // TODO
        return true;
      case 'refresh':
        // TODO
        return true;
      case 'changebrightness':
        // TODO
        return true;
      case 'red':
        // TODO
        return true;
      case 'green':
        // TODO
        return true;
      case 'yellow':
        // TODO
        return true;
      case 'blue':
        // TODO
        return true;
      case 'grey':
        // TODO
        return true;
      case 'brown':
        // TODO
        return true;
      case 'repeatnone':
        _playbackmanager.default.setRepeatMode('RepeatNone');
        return true;
      case 'repeatall':
        _playbackmanager.default.setRepeatMode('RepeatAll');
        return true;
      case 'repeatone':
        _playbackmanager.default.setRepeatMode('RepeatOne');
        return true;
      default:
        return false;
    }
  }
  var InputManager = {
    trigger: handleCommand,
    handle: handleCommand,
    notify: notify,
    idleTime: idleTime,
    on: on,
    off: off,
    allowLeftOrRightNav: allowLeftOrRightNav
  };

  // expose for easy access from native apps
  if (globalThis.Emby) {
    Emby.InputManager = InputManager;
  }
  var _default = _exports.default = InputManager;
});
