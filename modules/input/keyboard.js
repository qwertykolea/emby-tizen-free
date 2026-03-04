define(["exports", "./../common/inputmanager.js", "./../browser.js", "./../dom.js"], function (_exports, _inputmanager, _browser, _dom) {
  Object.defineProperty(_exports, "__esModule", {
    value: true
  });
  _exports.default = void 0;
  /* jshint module: true */

  function notifyApp(e) {
    _inputmanager.default.notify(null, e);
  }
  var keyDownTarget;
  function onGamePadAOrEnterKeyDown(e, key, target, checkEditable, checkTagName) {
    if (checkEditable) {
      if (!isEditable(target)) {
        e.preventDefault();
      }
    }
    if (target !== keyDownTarget) {
      if (target.classList.contains('dynamicKeyDownTarget')) {
        keyDownTarget = target;
      } else {
        e.preventDefault();
        return;
      }
    }
    var targetSupportsLongPress = target.classList.contains('longpress');
    var supportSelect = true;
    if (checkTagName) {
      // don't trigger inputManager for checkboxes otherwise it will respond to two events rather than one
      // many places are already hanlding gamepadA via normalizeKeyFromEvent
      // calling inputManager might only be needed for buttons to trigger click events
      // prevent default because can stop the onscreen keyboard from appearing
      switch (target.tagName) {
        case 'INPUT':
          supportSelect = false;
          if (!targetSupportsLongPress) {
            return;
          }
          break;
        case 'SELECT':
        case 'TEXTAREA':
          return;
        default:
          break;
      }
    }
    if (target.classList.contains('longpress')) {
      if (checkForLongPress(e, key, 'menu')) {
        return;
      }
      e.preventDefault();
      return;
    }
    if (checkTagName) {
      if (!supportSelect) {
        return;
      }

      // not strictly necessary, but can help prevent multiple clicks from being fired
      if (e.repeat) {
        return;
      }
    } else if (target.closest('button,a,select,input:not([type="range"]),textarea')) {
      // don't trigger select because the native click event will fire
      return;
    }

    //console.log('triggering select command on keydown');
    sendCommandFromEvent('select', e);
  }
  function onGamePadAOrEnterKeyUp(e, target, wasLongPressed, checkEditable) {
    if (checkEditable) {
      if (!isEditable(target)) {
        e.preventDefault();
      }
    }
    if (target.classList.contains('longpress')) {
      if (!wasLongPressed) {
        //console.log('not long pressed, triggering select');
        sendCommandFromEvent('select', e);
      }
      e.preventDefault();
    }
  }
  function sendCommandFromEvent(name, e) {
    var options = {
      sourceElement: e.target,
      repeat: e.repeat || e.repeatHack,
      originalEvent: e
    };
    if (_inputmanager.default.trigger(name, options)) {
      e.preventDefault();
    }
  }
  function isEditable(elem) {
    var readOnly = elem.readOnly;
    if (readOnly) {
      return false;
    }
    if (readOnly === false) {
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
  var handleMultiMediaKeys = !_browser.default.electron;
  var goBackOnBackspace = _browser.default.electron || _browser.default.tv || globalThis.appMode === 'embyclient';
  var appMode = globalThis.appMode;
  var IsBrowser = !_browser.default.electron && (appMode || 'standalone') === 'standalone';
  var isNativeTizen = globalThis.appMode === 'tizen';
  var isNativeLG = globalThis.appMode === 'webos';
  var repeatingKey;
  var repeatKeyFirstInputTime = 0;
  var lastRepeatingKeyTime = 0;
  var repeatKeyCount = 0;
  var repeatKeyLongPressed = false;
  var EnableRepeatWorkaround = isNativeTizen || isNativeLG || _browser.default.playstation || appMode === 'android';
  var EnableRepeatHack = isNativeTizen || isNativeLG;
  var LongPressTimeout = 500;
  function setEventRepeatProperty(e) {
    try {
      Object.defineProperty(e, 'repeat', {
        value: true
        //writable: false
      });
    } catch (err) {
      //console.error('error setting repeat via defineProperty: ' , err);
    }

    // https://github.com/MediaBrowser/issues/issues/15
    // probably only needed for older chromium webviews
    if (EnableRepeatHack) {
      e.repeatHack = true;
    }
  }
  function throttleRepeatingKey(key, e) {
    var timestamp = e.timeStamp;
    var isRepeat = e.repeat;

    // dirty hack here
    if (EnableRepeatWorkaround && !isRepeat && key === repeatingKey) {
      isRepeat = true;
      setEventRepeatProperty(e);
    }
    if (isRepeat && key === repeatingKey) {
      var timeSinceLastInput = timestamp - lastRepeatingKeyTime;
      // on android, bluetooth remotes are sending keys extremely fast, so a higher throttle is needed
      // ideally I'd prefer to handle this in native android code given that this is platform specific, but on that side getRepeatCount is not always accurate for some reason

      //    toast('timeSinceLastInput: ' + timeSinceLastInput + ', throttle: ' + throttle);
      var delay = repeatKeyCount ? 80 : 200;
      if (timeSinceLastInput < delay) {
        //console.log('repeat key throttled: ' + timeSinceLastInput);
        e.preventDefault();
        return true;
      }
      repeatKeyCount++;
      //console.log('repeat key allowed: ' + timeSinceLastInput);
    } else {
      repeatingKey = key;
      repeatKeyCount = 0;
      repeatKeyFirstInputTime = timestamp;
      repeatKeyLongPressed = false;
    }
    lastRepeatingKeyTime = timestamp;
    return false;
  }
  function isLongPress(e, key) {
    // this is simply to set the repeat properties
    throttleRepeatingKey(key, e);
    if (e.repeat && !repeatKeyLongPressed) {
      var timeStamp = e.timeStamp;
      var timeSinceFirstPress = timeStamp - repeatKeyFirstInputTime;
      if (timeSinceFirstPress >= LongPressTimeout) {
        repeatKeyLongPressed = true;
        return true;
      }
    }
    return false;
  }
  function checkForLongPress(e, key, command) {
    //console.log('checkForLongPress: ' + command);

    if (isLongPress(e, key)) {
      console.log('executing ' + command + ' command following long press of ' + key);
      sendCommandFromEvent(command, e);
      return true;
    }
  }
  function getKeyFromKeyCode(keyCode) {
    // tizen: https://developer.samsung.com/smarttv/develop/guides/user-interaction/remote-control.html

    switch (keyCode) {
      // LG - older models
      case 13:
        return 'Enter';

      // tizen, lg, possibly others
      case 19:
        return 'Pause';

      // on orsay this is mute
      case 27:
        return 'Back';
      case 32:
        return ' ';
      case 33:
        return 'PageUp';
      case 34:
        return 'PageDown';
      case 37:
        return 'ArrowLeft';
      case 39:
        return 'ArrowRight';
      case 38:
        // UpArrow
        return 'ArrowUp';
      case 40:
        // DownArrow
        return 'ArrowDown';

      // from https://learn.microsoft.com/en-us/dotnet/api/microsoft.toolkit.win32.ui.controls.interop.winrt.virtualkey
      case 195:
        return 'GamepadA';
      case 196:
        return 'GamepadB';
      case 197:
        return 'GamepadX';
      case 198:
        return 'GamepadY';
      case 199:
        return 'GamepadRightShoulder';
      case 200:
        return 'GamepadLeftShoulder';
      case 201:
        return 'GamepadLeftTrigger';
      case 202:
        return 'GamepadRightTrigger';
      case 203:
        return 'GamepadDPadUp';
      case 204:
        return 'GamepadDPadDown';
      case 205:
        return 'GamepadDPadLeft';
      case 206:
        return 'GamepadDPadRight';
      case 207:
        return 'GamepadMenu';
      case 208:
        return 'GamepadView';
      case 209:
        return 'GamepadLeftThumbstickButton';
      case 210:
        return 'GamepadRightThumbstickButton';
      case 211:
        return 'GamepadLeftThumbStickUp';
      case 212:
        return 'GamepadLeftThumbStickDown';
      case 213:
        return 'GamepadLeftThumbStickRight';
      case 214:
        return 'GamepadLeftThumbStickLeft';

      // tizen
      case 403:
        return 'ColorF0Red';

      // tizen
      case 404:
        return 'ColorF1Green';

      // tizen
      case 405:
        return 'ColorF2Yellow';

      // tizen
      case 406:
        return 'ColorF3Blue';

      // tizen, lg, possibly others
      case 412:
        return 'MediaRewind';

      // tizen, lg, possibly others
      case 413:
        return 'Stop';

      // tizen, lg, possibly others
      case 415:
        return 'Play';

      // tizen, lg, possibly others
      case 416:
        return 'MediaRecord';

      // tizen, lg, possibly others
      case 417:
        return 'MediaFastForward';

      // tizen
      case 427:
        return 'ChannelUp';

      // tizen
      case 428:
        return 'ChannelDown';

      // tizen
      case 447:
        return 'VolumeUp';

      // tizen
      case 448:
        return 'VolumeDown';

      // tizen
      case 449:
        return 'VolumeMute';

      // tizen, lg, possibly others
      case 457:
      case 1056:
        return 'Info';

      // tizen
      case 458:
        return 'Guide';

      // tizen, lg, possibly others
      case 459:
      case 460:
        return 'Subtitle';
      case 461:
        // https://webostv.developer.lge.com/develop/app-developer-guide/back-button/
        return 'Back';

      // tizen
      case 10009:
        return 'Back';

      // tizen
      case 10073:
        return 'ChannelList';

      // tizen
      case 10135:
        return 'Tools';

      // tizen
      case 10140:
        return 'PictureSize';

      // tizen
      case 10200:
        return 'Teletext';

      // tizen
      case 10221:
        return 'Caption';

      // tizen
      case 10225:
        return 'Search';

      // tizen
      case 10232:
        return 'MediaTrackPrevious';

      // tizen
      case 10233:
        return 'MediaTrackNext';

      // tizen
      case 10252:
        return 'MediaPlayPause';
      default:
        break;
    }
    if (keyCode == null) {
      return null;
    }

    // legacy opera tv
    switch (keyCode) {
      case globalThis.VK_BACK_SPACE:
        return 'Back';
      case globalThis.VK_LEFT:
        return 'Left';
      case globalThis.VK_UP:
        return 'Up';
      case globalThis.VK_RIGHT:
        return 'Right';
      case globalThis.VK_DOWN:
        return 'Down';
      case globalThis.VK_MENU:
        return 'ContextMenu';
      case globalThis.VK_TRACK_NEXT:
        return 'MediaTrackNext';
      case globalThis.VK_TRACK_PREV:
        return 'MediaTrackPrevious';
      case globalThis.VK_INFO:
        return 'Info';
      case globalThis.VK_STOP:
        return 'MediaStop';
      case globalThis.VK_PLAY:
        return 'MediaPlay';
      case globalThis.VK_PAUSE:
        return 'MediaPause';
      case globalThis.VK_FAST_FWD:
        return 'MediaFastForward';
      case globalThis.VK_REWIND:
        return 'MediaRewind';
      default:
        return null;
    }
  }

  // Some input fields are set to ReadOnly to prevent the Samsung and webOS IME keyboard from being displayed (ie: search box)
  // We still want to allow input from a physical keyboard for these fields
  function handleAlphaNumInput(e) {
    var value = e.keyCode;

    // Detect backspace, space, 0-9 or A-Z
    if (value === 8 || value === 32 || value >= 48 && value <= 57 || value >= 65 && value <= 90) {
      var elem = e.target;
      if (elem.tagName === "INPUT" && elem.readOnly) {
        var txtInput = elem;

        // check for backspace
        if (value === 8) {
          var val = txtInput.value;
          txtInput.value = val.length ? val.substring(0, val.length - 1) : '';
        } else {
          if (txtInput.maxLength === -1 || txtInput.value.length < txtInput.maxLength) {
            txtInput.value += String.fromCharCode(value);
          }
        }
        txtInput.dispatchEvent(new CustomEvent('input', {
          bubbles: true
        }));
      }
    }
  }
  var EnableReadOnlyInputWorkaround = isNativeTizen || isNativeLG;
  var EnableSingleCharacterKeyWorkaround = isNativeLG;
  function onKeyDown(e) {
    var key = e.resultKey || e.key;

    // legacy handling
    // Unidentified is seen on at least WebOS 5.0, and possibly other versions
    // Also on webOS, pause is keycode 19 with key being ascii code 133, a single non-printable character
    if (!key) {
      key = getKeyFromKeyCode(e.keyCode);
    }
    var target = e.target;

    //console.log('onKeyDown: ' + e.key + ' - ' + e.keyCode + ', repeat: ' + e.repeat + ', timestamp: ' + e.timeStamp + ', target: ' + target.className);
    //    toast('onKeyDown: ' + evt.key + ' - ' + evt.keyCode + ', repeat: ' + evt.repeat + ', timestamp: ' + evt.timeStamp);

    if (!keyDownTarget) {
      keyDownTarget = target;
    }

    // https://developer.mozilla.org/en-US/docs/Web/API/KeyboardEvent/key/Key_Values
    // https://docs.microsoft.com/en-us/uwp/api/Windows.System.VirtualKey
    switch (key) {
      // Navigation keys
      case 'ArrowUp':
      case 'Up':
      case 'NavigationUp':
      case 'GamepadDPadUp':
      case 'GamepadLeftThumbstickUp':
      case 'GamepadLeftThumbStickUp':
        if (isNativeTizen && key === 'Up') {
          // don't interfere with onscreen keyboard
          return;
        }
        if (throttleRepeatingKey(key, e)) {
          return;
        }
        sendCommandFromEvent('up', e);
        return;
      case 'ArrowDown':
      case 'Down':
      case 'NavigationDown':
      case 'GamepadDPadDown':
      case 'GamepadLeftThumbstickDown':
      case 'GamepadLeftThumbStickDown':
        if (isNativeTizen && key === 'Down') {
          // don't interfere with onscreen keyboard
          return;
        }
        if (throttleRepeatingKey(key, e)) {
          return;
        }
        sendCommandFromEvent('down', e);
        return;
      case 'ArrowLeft':
      case 'Left':
      case 'NavigationLeft':
      case 'GamepadDPadLeft':
      case 'GamepadLeftThumbStickLeft':
      case 'GamepadLeftThumbstickLeft':
        {
          if (isNativeTizen && key === 'Left') {
            // don't interfere with onscreen keyboard
            return;
          }
          if (e.altKey) {
            // alt-left
            // control
            e.preventDefault();
            checkForLongPress(e, key, 'home');
            return;
          }
          if (e.shiftKey && !isEditable(target)) {
            sendCommandFromEvent('rewind', e);
            return;
          }
          if (throttleRepeatingKey(key, e)) {
            return;
          }
          sendCommandFromEvent('left', e);
          return;
        }
      case 'ArrowRight':
      case 'Right':
      case 'NavigationRight':
      case 'GamepadDPadRight':
      case 'GamepadLeftThumbStickRight':
      case 'GamepadLeftThumbstickRight':
        {
          if (isNativeTizen && key === 'Right') {
            // don't interfere with onscreen keyboard
            return;
          }
          if (e.altKey) {
            // alt-right
            // control
            sendCommandFromEvent('forward', e);
            return;
          }
          if (e.shiftKey && !isEditable(target)) {
            sendCommandFromEvent('fastforward', e);
            return;
          }
          if (throttleRepeatingKey(key, e)) {
            return;
          }
          sendCommandFromEvent('right', e);
          return;
        }
      case 'End':
        if (!isEditable(target)) {
          sendCommandFromEvent('end', e);
        }
        return;
      case 'Home':
        if (!isEditable(target)) {
          sendCommandFromEvent('home', e);
        }
        return;
      case 'PageUp':
        sendCommandFromEvent('pageup', e);
        return;
      case 'PageDown':
        sendCommandFromEvent('pagedown', e);
        return;

      // Editing keys
      case 'Backspace':
        if (goBackOnBackspace && !isEditable(target)) {
          e.preventDefault();
          checkForLongPress(e, key, 'home');
          return;
        }
        break;
      case 'Delete':
      case 'Del':
        if (!isEditable(target)) {
          sendCommandFromEvent('delete', e);
          return;
        }
        break;
      case 'GamepadA':
      case 'GamePadA':
        onGamePadAOrEnterKeyDown(e, key, target, true, true);
        return;

      // UI keys
      case 'Accept':
      case 'NavigationAccept':
      case 'NavigateIn':
      case 'Open':
      case 'Select':
      case 'Execute':
      case 'Link':
        sendCommandFromEvent('select', e);
        return;
      case 'Enter':
        onGamePadAOrEnterKeyDown(e, key, target);
        return;
      case 'Escape':
      case 'Esc':
        if (!e.shiftKey && !e.altKey && !e.ctrlKey) {
          e.preventDefault();
          checkForLongPress(e, key, 'home');
        }
        return;
      case 'Cancel':
      case 'NavigationCancel':
      case 'GamepadB':
      case 'GamePadB':
      case 'Exit':
      case 'NavigateOut':
      case 'Back':
      case 'RCUBack': // lg
      case 'GoBack': // lg
      case 'XF86Back':
        // tizen
        e.preventDefault();
        checkForLongPress(e, key, 'home');
        return;
      case 'ContextMenu':
      case 'NavigationMenu':
        sendCommandFromEvent('menu', e);
        return;
      case 'Menu':
        if (handleMultiMediaKeys) {
          sendCommandFromEvent('menu', e);
          return;
        }
        break;
      case 'GamepadMenu':
        sendCommandFromEvent('menu', e);
        break;
      case 'Help':
        break;
      case 'Finish':
        break;
      case 'Find':
      case 'Search':
      case 'XF86Search':
        // tizen
        if (handleMultiMediaKeys) {
          sendCommandFromEvent('search', e);
          return;
        }
        break;
      case 'ZoomIn':
        sendCommandFromEvent('changezoom', e);
        return;
      case 'ZoomOut':
        sendCommandFromEvent('changezoom', e);
        return;

      // Function keys
      case 'F8':
        if (!IsBrowser) {
          sendCommandFromEvent('togglemute', e);
        }
        return;
      case 'F9':
        if (!IsBrowser) {
          sendCommandFromEvent('volumedown', e);
        }
        return;
      case 'F10':
        if (!IsBrowser) {
          sendCommandFromEvent('volumeup', e);
        }
        return;
      case 'F11':
        if (!IsBrowser) {
          sendCommandFromEvent('togglefullscreen', e);
        }
        return;

      // Multimedia keys
      case '+':
        if (!isEditable(target)) {
          sendCommandFromEvent('channelup', e);
          return;
        }
        break;
      case 'ChannelUp':
      case 'GamepadY':
      case 'RaiseChannel': // tizen
      case 'XF86RaiseChannel':
        // tizen
        if (handleMultiMediaKeys) {
          sendCommandFromEvent('channelup', e);
          return;
        }
        break;
      case '-':
        if (!isEditable(target)) {
          sendCommandFromEvent('channeldown', e);
          return;
        }
        break;
      case 'ChannelDown':
      case 'GamepadX':
      case 'LowerChannel': // tizen
      case 'XF86LowerChannel':
        // tizen
        if (handleMultiMediaKeys) {
          sendCommandFromEvent('channeldown', e);
          return;
        }
        break;
      case 'MediaStepForward':
      case 'MediaFastForward':
      case 'FastFwd':
      case 'GamepadRightTrigger':
      case 'AudioNext': // tizen
      case 'XF86AudioNext':
        // tizen
        if (handleMultiMediaKeys) {
          sendCommandFromEvent('fastforward', e);
          return;
        }
        break;
      case 'Pause':
      case 'MediaPause':
      case 'AudioPause': // tizen
      case 'XF86AudioPause':
        // tizen
        if (handleMultiMediaKeys) {
          sendCommandFromEvent('pause', e);
          return;
        }
        break;
      case 'Play':
      case 'MediaPlay':
      case 'AudioPlay': // tizen
      case 'XF86AudioPlay':
        // tizen
        if (handleMultiMediaKeys) {
          sendCommandFromEvent('play', e);
          return;
        }
        break;
      case 'MediaPlayPause':
      case 'PlayBack': // tizen
      case 'XF86PlayBack':
        // tizen
        if (handleMultiMediaKeys) {
          sendCommandFromEvent('playpause', e);
          return;
        }
        break;
      case 'MediaRecord':
      case 'AudioRecord': // tizen
      case 'XF86AudioRecord':
        // tizen
        if (handleMultiMediaKeys) {
          sendCommandFromEvent('record', e);
          return;
        }
        break;
      case 'MediaStepBackward':
      case 'MediaRewind':
      case 'GamepadLeftTrigger':
      case 'AudioRewind': // tizen
      case 'XF86AudioRewind':
        // tizen
        if (handleMultiMediaKeys) {
          sendCommandFromEvent('rewind', e);
          return;
        }
        break;
      case 'Stop':
      case 'MediaStop':
      case 'AudioStop': // tizen
      case 'XF86AudioStop': // tizen
      case 'XF86Stop':
        if (handleMultiMediaKeys) {
          sendCommandFromEvent('stop', e);
          return;
        }
        break;
      case 'MediaTrackNext':
      case 'MediaNextTrack':
      case 'GamepadRightShoulder':
        if (handleMultiMediaKeys) {
          sendCommandFromEvent('next', e);
          return;
        }
        break;
      case 'MediaTrackPrevious':
      case 'MediaPreviousTrack':
      case 'GamepadLeftShoulder':
        if (handleMultiMediaKeys) {
          sendCommandFromEvent('previous', e);
          return;
        }
        break;

      // Audio control keys
      case 'AudioVolumeDown':
      case 'VolumeDown':
      case 'GamepadRightThumbStickLeft':
      case 'GamepadRightThumbstickLeft':
        if (!IsBrowser) {
          sendCommandFromEvent('volumedown', e);
        }
        return;
      case 'AudioVolumeUp':
      case 'VolumeUp':
      case 'GamepadRightThumbStickRight':
      case 'GamepadRightThumbstickRight':
        if (!IsBrowser) {
          sendCommandFromEvent('volumeup', e);
        }
        return;
      case 'AudioVolumeMute':
      case 'VolumeMute':
      case 'GamepadRightThumbStickButton':
      case 'GamepadRightThumbstickButton':
        if (!IsBrowser) {
          sendCommandFromEvent('togglemute', e);
        }
        return;

      // Media controller keys
      case 'Red':
      case 'XF86Red': // tizen
      case 'ColorF0Red':
        sendCommandFromEvent('red', e);
        return;
      case 'Green':
      case 'XF86Green': // tizen
      case 'ColorF1Green':
        sendCommandFromEvent('green', e);
        return;
      case 'Yellow':
      case 'XF86Yellow': // tizen
      case 'ColorF2Yellow':
        sendCommandFromEvent('yellow', e);
        return;
      case 'Blue':
      case 'XF86Blue': // tizen
      case 'ColorF3Blue':
        sendCommandFromEvent('blue', e);
        return;
      case 'ColorF4Grey':
        sendCommandFromEvent('grey', e);
        return;
      case 'ColorF5Brown':
        sendCommandFromEvent('brown', e);
        return;
      case 'Caption':
      case 'XF86Caption': // tizen
      case 'ClosedCaptionToggle':
        sendCommandFromEvent('changesubtitletrack', e);
        return;
      case 'Dimmer':
        sendCommandFromEvent('changebrightness', e);
        return;
      case 'DVR':
        sendCommandFromEvent('guide', e);
        return;
      case 'ChannelList':
      case 'Guide':
      case 'ChannelGuide': // tizen
      case 'XF86ChannelGuide':
        // tizen
        sendCommandFromEvent('guide', e);
        return;
      case 'GuideNextDay':
        sendCommandFromEvent('guide', e);
        return;
      case 'GuidePreviousDay':
        sendCommandFromEvent('guide', e);
        return;
      case 'Info':
      case 'XF86Info':
        // tizen
        if (handleMultiMediaKeys) {
          sendCommandFromEvent('info', e);
          return;
        }
        break;
      case 'InstantReplay':
        sendCommandFromEvent('rewind', e);
        return;
      case 'LiveContent':
        sendCommandFromEvent('livetv', e);
        return;
      case 'MediaAudioTrack':
        sendCommandFromEvent('changeaudiotrack', e);
        return;
      case 'MediaLast':
        break;
      case 'MediaSkipBackward':
        if (handleMultiMediaKeys) {
          sendCommandFromEvent('previouschapter', e);
          return;
        }
        break;
      case 'MediaSkipForward':
        if (handleMultiMediaKeys) {
          sendCommandFromEvent('nextchapter', e);
          return;
        }
        break;
      case 'MediaTopMenu':
      case 'GamepadView':
        sendCommandFromEvent('home', e);
        return;
      case 'NavigateNext':
        sendCommandFromEvent('next', e);
        return;
      case 'NavigatePrevious':
        sendCommandFromEvent('previous', e);
        return;
      case 'NextFavoriteChannel':
        sendCommandFromEvent('next', e);
        return;
      case 'Settings':
      case 'Tools':
      case 'SimpleMenu': // tizen
      case 'XF86SimpleMenu':
        // tizen
        sendCommandFromEvent('settings', e);
        return;
      case 'Teletext':
      case 'Subtitle':
        sendCommandFromEvent('changesubtitletrack', e);
        return;
      case 'ZoomToggle':
      case 'Zoom':
      case 'PictureSize':
      case 'XF86PictureSize':
        // tizen
        sendCommandFromEvent('changezoom', e);
        return;

      // Document keys
      case 'New':
        break;
      case 'Save':
        sendCommandFromEvent('save', e);
        return;

      // Application selector keys
      case 'LaunchMusicPlayer':
        sendCommandFromEvent('music', e);
        return;
      case 'LaunchScreenSaver':
        sendCommandFromEvent('screensaver', e);
        return;

      // Browser control keys
      case 'BrowserBack':
        if (handleMultiMediaKeys) {
          e.preventDefault();
          checkForLongPress(e, key, 'home');
          return;
        }
        break;
      case 'BrowserFavorites':
        sendCommandFromEvent('favorites', e);
        return;
      case 'BrowserForward':
        if (handleMultiMediaKeys) {
          sendCommandFromEvent('forward', e);
          return;
        }
        break;
      case 'BrowserHome':
        if (handleMultiMediaKeys) {
          sendCommandFromEvent('home', e);
          return;
        }
        break;
      case 'BrowserRefresh':
        if (handleMultiMediaKeys) {
          sendCommandFromEvent('refresh', e);
          return;
        }
        break;
      case 'BrowserSearch':
        if (handleMultiMediaKeys) {
          sendCommandFromEvent('search', e);
          return;
        }
        break;
      case 'BrowserStop':
        if (handleMultiMediaKeys) {
          sendCommandFromEvent('stop', e);
          return;
        }
        break;
      case 'j':
        // j
        if (e.ctrlKey) {
          sendCommandFromEvent('togglestats', e);
          return;
        }
        break;
      case 'g':
        // g
        if (e.ctrlKey) {
          sendCommandFromEvent('guide', e);
          return;
        }
        break;

      // Numeric keypad keys
      case 'Add':
        break;
      case 'Subtract':
        break;
      case 'a':
      case 'A':
        if (e.ctrlKey) {
          if (e.shiftKey) {
            // control-shift-a
            sendCommandFromEvent('changeaudiotrack', e);
            return;
          }
        }
        break;
      case 'b':
      case 'B':
        if (e.altKey && !e.ctrlKey) {
          e.preventDefault();
          checkForLongPress(e, key, 'home');
          return;
        }
        break;
      case 'd':
      case 'D':
        if (e.ctrlKey) {
          sendCommandFromEvent('menu', e);
          return;
        }
        break;
      case 'o':
      case 'O':
        if (e.ctrlKey && !IsBrowser) {
          sendCommandFromEvent('recordedtv', e);
          return;
        }
        break;
      case 'p':
      case 'P':
        if (e.ctrlKey) {
          if (e.shiftKey) {
            // control-shift-p
            sendCommandFromEvent('play', e);
            return;
          } else {
            // control-p
            sendCommandFromEvent('playpause', e);
            return;
          }
        }
        break;
      case 'r':
      case 'R':
        if (!IsBrowser) {
          if (e.ctrlKey) {
            sendCommandFromEvent('record', e);
            return;
          }
        }
        break;
      case 's':
      case 'S':
        if (e.ctrlKey) {
          if (e.shiftKey) {
            // control-shift-s
            sendCommandFromEvent('stop', e);
            return;
          }
          sendCommandFromEvent('search', e);
          return;
        }
        break;
      case 't':
      case 'T':
        // don't do this in a browser because it will override the new tab shortcut
        if (!IsBrowser) {
          if (e.ctrlKey) {
            sendCommandFromEvent('livetv', e);
            return;
          }
        }
        break;
      case 'u':
      case 'U':
        if (e.ctrlKey) {
          sendCommandFromEvent('changesubtitletrack', e);
          return;
        }
        break;
      case 'z':
      case 'Z':
        if (e.ctrlKey) {
          if (e.shiftKey) {
            // control-shift-z
            sendCommandFromEvent('changezoom', e);
            return;
          }
        }
        break;
      // seeing this on webOS, but looks like it can happen on other platforms too https://developer.mozilla.org/en-US/docs/Web/API/KeyboardEvent/key
      case 'Unidentified':
        e.resultKey = getKeyFromKeyCode(e.keyCode);
        if (e.resultKey) {
          return onKeyDown(e);
        }
        break;
      default:
        // on WebOS, key is a non-printable character
        if (EnableSingleCharacterKeyWorkaround && key && key.length === 1 && key.charCodeAt(0) > 127) {
          e.resultKey = getKeyFromKeyCode(e.keyCode);
          if (e.resultKey) {
            return onKeyDown(e);
          }
        }

        // Allow input from a physical keyboard on read-only input fields
        if (EnableReadOnlyInputWorkaround) {
          handleAlphaNumInput(e);
        }
        break;
    }

    // No command will be executed, but notify the app that input was received
    notifyApp(e);
  }
  function onKeyUp(e) {
    if (EnableRepeatWorkaround) {
      repeatingKey = null;
      repeatKeyCount = 0;
      lastRepeatingKeyTime = 0;
    }
    var wasLongPressed = repeatKeyLongPressed;
    repeatKeyLongPressed = false;
    repeatKeyFirstInputTime = 0;
    var target = e.target;
    var lastKeyDownTarget = keyDownTarget;
    keyDownTarget = null;
    if (target !== lastKeyDownTarget) {
      if (target.classList.contains('dynamicKeyDownTarget')) {
        //
      } else {
        //console.log('keyup target doesnt match: ' + lastKeyDownTarget?.tagName + '--' + target.tagName);
        return;
      }
    }

    //console.log('onKeyUp: ' + e.key + ' - ' + e.keyCode + ', repeat: ' + e.repeat + ', timestamp: ' + e.timeStamp + ', wasLongPressed: ' + wasLongPressed);

    var key = e.resultKey || e.key;

    // legacy handling
    // Unidentified is seen on at least WebOS 5.0, and possibly other versions
    // Also on webOS, pause is keycode 19 with key being ascii code 133, a single non-printable character
    if (!key) {
      key = getKeyFromKeyCode(e.keyCode);
    }
    switch (key) {
      case 'ArrowLeft':
      case 'Left':
      case 'NavigationLeft':
      case 'GamepadDPadLeft':
      case 'GamepadLeftThumbStickLeft':
      case 'GamepadLeftThumbstickLeft':
        {
          if (isNativeTizen && key === 'Left') {
            // don't interfere with onscreen keyboard
            return;
          }
          if (e.altKey) {
            // alt-left
            // control
            e.preventDefault();
            if (!wasLongPressed) {
              sendCommandFromEvent('back', e);
            }
            return;
          }
          break;
        }
      case 'Backspace':
        if (goBackOnBackspace && !isEditable(target)) {
          e.preventDefault();
          if (!wasLongPressed) {
            sendCommandFromEvent('back', e);
          }
          return;
        }
        break;
      case 'Escape':
      case 'Esc':
        if (!e.shiftKey && !e.altKey && !e.ctrlKey) {
          if (!wasLongPressed) {
            sendCommandFromEvent('back', e);
          } else {
            e.preventDefault();
          }
        }
        return;
      case 'Cancel':
      case 'NavigationCancel':
      case 'GamepadB':
      case 'GamePadB':
      case 'Exit':
      case 'NavigateOut':
      case 'Back':
      case 'RCUBack': // lg
      case 'GoBack': // lg
      case 'XF86Back':
        // tizen
        if (!wasLongPressed) {
          sendCommandFromEvent('back', e);
        } else {
          e.preventDefault();
        }
        return;
      case 'GamepadA':
      case 'GamePadA':
        onGamePadAOrEnterKeyUp(e, target, wasLongPressed, true);
        return;
      case 'Enter':
        onGamePadAOrEnterKeyUp(e, target, wasLongPressed, false);
        return;
      case 'BrowserBack':
        if (handleMultiMediaKeys) {
          if (!wasLongPressed) {
            sendCommandFromEvent('back', e);
          } else {
            e.preventDefault();
          }
          return;
        }
        break;
      case 'b':
      case 'B':
        if (e.altKey && !e.ctrlKey) {
          if (!wasLongPressed) {
            sendCommandFromEvent('back', e);
          } else {
            e.preventDefault();
          }
          return;
        }
        break;
      // seeing this on webOS, but looks like it can happen on other platforms too https://developer.mozilla.org/en-US/docs/Web/API/KeyboardEvent/key
      case 'Unidentified':
        e.resultKey = getKeyFromKeyCode(e.keyCode);
        if (e.resultKey) {
          keyDownTarget = lastKeyDownTarget;
          return onKeyUp(e);
        }
        break;
      default:
        // on WebOS, key is a non-printable character
        if (EnableSingleCharacterKeyWorkaround && key && key.length === 1 && key.charCodeAt(0) > 127) {
          e.resultKey = getKeyFromKeyCode(e.keyCode);
          if (e.resultKey) {
            keyDownTarget = lastKeyDownTarget;
            return onKeyUp(e);
          }
        }
        break;
    }
  }
  function normalizeKeyFromEvent(e) {
    var key = e.key;

    // legacy handling
    // Unidentified is seen on at least WebOS 5.0, and possibly other versions
    // Also on webOS, pause is keycode 19 with key being ascii code 133, a single non-printable character
    if (!key) {
      key = getKeyFromKeyCode(e.keyCode);
    }
    switch (key) {
      case 'ArrowUp':
      case 'Up':
      case 'NavigationUp':
      case 'GamepadDPadUp':
      case 'GamepadLeftThumbstickUp':
      case 'GamepadLeftThumbStickUp':
        return 'ArrowUp';
      case 'ArrowDown':
      case 'Down':
      case 'NavigationDown':
      case 'GamepadDPadDown':
      case 'GamepadLeftThumbstickDown':
      case 'GamepadLeftThumbStickDown':
        return 'ArrowDown';
      case 'ArrowLeft':
      case 'Left':
      case 'NavigationLeft':
      case 'GamepadDPadLeft':
      case 'GamepadLeftThumbStickLeft':
      case 'GamepadLeftThumbstickLeft':
        {
          if (e.shiftKey && !isEditable(e.target)) {
            return 'MediaRewind';
          }
          return 'ArrowLeft';
        }
      case 'ArrowRight':
      case 'Right':
      case 'NavigationRight':
      case 'GamepadDPadRight':
      case 'GamepadLeftThumbStickRight':
      case 'GamepadLeftThumbstickRight':
        {
          if (e.shiftKey && !isEditable(e.target)) {
            return 'MediaFastForward';
          }
          return 'ArrowRight';
        }
      case 'Accept':
      case 'NavigationAccept':
      case 'NavigateIn':
      case 'GamepadA':
      case 'GamePadA':
      case 'Open':
      case 'Select':
      case 'Execute':
      case 'Link':
      case 'Enter':
        return 'Enter';
      case 'BrowserBack':
      case 'Close':
      case 'Escape':
      case 'Esc':
      case 'Cancel':
      case 'NavigationCancel':
      case 'GamepadB':
      case 'GamePadB':
      case 'Exit':
      case 'NavigateOut':
      case 'Back':
      case 'RCUBack': // lg
      case 'GoBack': // lg
      case 'XF86Back':
        // tizen
        return 'Back';
      case 'MediaStepBackward':
      case 'MediaRewind':
      case 'GamepadLeftTrigger':
      case 'AudioRewind': // tizen
      case 'XF86AudioRewind':
        // tizen

        // should we check handleMultiMediaKeys here?
        return 'MediaRewind';
      case 'InstantReplay':
        return 'MediaRewind';
      case 'MediaStepForward':
      case 'MediaFastForward':
      case 'FastFwd':
      case 'GamepadRightTrigger':
      case 'AudioNext': // tizen
      case 'XF86AudioNext':
        // tizen
        // should we check handleMultiMediaKeys here?
        return 'MediaFastForward';
      case 'Unidentified':
        {
          var keyResult = getKeyFromKeyCode(e.keyCode);
          if (keyResult) {
            return normalizeKeyFromEvent({
              key: keyResult
            });
          }
          break;
        }
      default:
        {
          if (key && key.length === 1 && key.charCodeAt(0) > 127) {
            var _keyResult = getKeyFromKeyCode(e.keyCode);
            if (_keyResult) {
              return normalizeKeyFromEvent({
                key: _keyResult
              });
            }
          }
        }
    }
    return key;
  }
  _dom.default.addEventListener(window, 'keydown', onKeyDown, {
    passive: false
  });
  _dom.default.addEventListener(window, 'keyup', onKeyUp, {
    passive: false
  });
  var _default = _exports.default = {
    normalizeKeyFromEvent: normalizeKeyFromEvent
  };
});
