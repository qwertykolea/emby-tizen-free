define(["exports", "./../dom.js", "./../emby-apiclient/connectionmanager.js", "./../emby-apiclient/events.js", "./../common/pluginmanager.js", "./../layoutmanager.js", "./../common/servicelocator.js", "./../common/appsettings.js", "./../common/inputmanager.js", "./../focusmanager.js", "./../input/keyboard.js"], function (_exports, _dom, _connectionmanager, _events, _pluginmanager, _layoutmanager, _servicelocator, _appsettings, _inputmanager, _focusmanager, _keyboard) {
  Object.defineProperty(_exports, "__esModule", {
    value: true
  });
  _exports.default = void 0;
  /* jshint module: true */

  var effects = {};
  function reload() {
    if (!_servicelocator.appHost.supports('soundeffects')) {
      return;
    }
    _inputmanager.default.off(window, onInputCommand, {
      passive: true
    });
    _dom.default.removeEventListener(window, 'keydown', onKeyDown, {
      passive: true
    });
    _dom.default.removeEventListener(window, 'userprompt', onUserPrompt, {
      passive: true
    });
    _events.default.off(_focusmanager.default, 'move', onFocusManagerMove);
    if (!_layoutmanager.default.tv) {
      return;
    }
    _inputmanager.default.on(window, onInputCommand, {
      passive: true
    });
    _dom.default.addEventListener(window, 'keydown', onKeyDown, {
      passive: true
    });
    _dom.default.addEventListener(window, 'userprompt', onUserPrompt, {
      passive: true
    });
    _events.default.on(_focusmanager.default, 'move', onFocusManagerMove);
    var soundeffectPlugin = getCurrentPlugin();
    if (soundeffectPlugin) {
      setEffects(soundeffectPlugin);
    } else {
      effects = {};
    }
  }
  function getDefaultId() {
    return 'defaultsoundeffects';
  }
  function getCurrentPlugin() {
    var soundeffectOption;
    try {
      soundeffectOption = _appsettings.default.soundEffects();
    } catch (err) {}
    var defaultOption = getDefaultId();
    if (!soundeffectOption) {
      soundeffectOption = defaultOption;
    }
    if (soundeffectOption === 'none') {
      return null;
    }
    var soundeffectPlugin = _pluginmanager.default.ofType('soundeffects').filter(function (i) {
      return i.id === soundeffectOption;
    })[0];
    if (!soundeffectPlugin) {
      soundeffectPlugin = _pluginmanager.default.ofType('soundeffects').filter(function (i) {
        return i.id === defaultOption;
      })[0];
    }
    return soundeffectPlugin;
  }
  function setEffects(soundeffectPlugin) {
    var effectDictionary = soundeffectPlugin.getEffects();
    var temp = {};
    for (var i in effectDictionary) {
      temp[i] = _pluginmanager.default.mapPath(soundeffectPlugin, effectDictionary[i]);
    }
    effects = temp;
  }
  function onFocusManagerMove(e) {
    play('navigation');
  }
  function onInputCommand(evt) {
    var command = evt.detail.command;
    var pendingSound;
    var activeElement;
    switch (command) {
      case 'select':
        pendingSound = 'miniselect';
        activeElement = document.activeElement;
        if (activeElement && activeElement.tagName === 'BUTTON' && activeElement.classList.contains('button-submit')) {
          pendingSound = 'select';
        }
        break;
      default:
        break;
    }
    if (pendingSound) {
      if (activeElement) {
        switch (activeElement.type) {
          case 'text':
          case 'textarea':
          case 'tel':
          case 'search':
          case 'password':
          case 'number':
            return;
        }
      }
      play(pendingSound);
    }
  }
  function onKeyDown(evt) {
    var pendingSound;
    var activeElement;
    var key = _keyboard.default.normalizeKeyFromEvent(evt);
    switch (key) {
      case 'Enter':
      case ' ':
        pendingSound = 'miniselect';
        activeElement = document.activeElement;
        if (activeElement) {
          // keyboard.js will trigger inputmanager select
          if (activeElement.classList.contains('longpress')) {
            return;
          }
          if (activeElement.tagName === 'BUTTON' && activeElement.classList.contains('button-submit')) {
            pendingSound = 'select';
          }
        }
        break;
      default:
        break;
    }
    if (pendingSound) {
      if (activeElement) {
        switch (activeElement.type) {
          case 'text':
          case 'textarea':
          case 'tel':
          case 'search':
          case 'password':
          case 'number':
            return;
        }
      }
      play(pendingSound);
    }
  }
  function onUserPrompt(evt) {
    if (evt.detail) {
      switch (evt.detail.promptType) {
        case 'alert':
          play('error');
          break;
        case 'confirm':
          play('question');
          break;
      }
    }
  }
  var soundEffectsPlayer;
  function play(type) {
    var effect = effects[type];
    if (!effect && type === 'miniselect') {
      effect = effects.select;
    }
    if (!effect) {
      return;
    }
    if (soundEffectsPlayer) {
      soundEffectsPlayer.play({
        path: effect
      });
      return;
    }
    require(['soundEffectsPlayer'], function (soundEffectsPlayer_) {
      soundEffectsPlayer = soundEffectsPlayer_;
      soundEffectsPlayer.play({
        path: effect
      });
    });
  }
  reload();
  _events.default.on(_connectionmanager.default, 'localusersignedin', reload);
  _events.default.on(_appsettings.default, 'change', function (e, name) {
    if (name === 'soundeffects') {
      reload();
    }
  });
  var _default = _exports.default = {};
});
