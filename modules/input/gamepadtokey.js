/* jshint module: true */

// Specs and References
//
// GamePad Web API: https://w3c.github.io/gamepad/
// Standard GamePad button mapping: https://w3c.github.io/gamepad/#dfn-standard-gamepad
// Microsoft GamePad key to keyCode mapping: https://learn.microsoft.com/en-us/dotnet/api/microsoft.toolkit.win32.ui.controls.interop.winrt.virtualkey?view=win-comm-toolkit-dotnet-6.1#fields
// 

var thumbStickThreshHold = 0.75;
var buttonStates = [{
  padIndex: 0,
  key: 'GamepadA',
  keyCode: 195
}, {
  padIndex: 1,
  key: 'GamepadB',
  keyCode: 196
}, {
  padIndex: 2,
  key: 'GamepadX',
  keyCode: 197
}, {
  padIndex: 3,
  key: 'GamepadY',
  keyCode: 198
}, {
  padIndex: 4,
  key: 'GamepadLeftShoulder',
  keyCode: 200
}, {
  padIndex: 5,
  key: 'GamepadRightShoulder',
  keyCode: 199
}, {
  padIndex: 6,
  key: 'GamepadLeftTrigger',
  keyCode: 201
}, {
  padIndex: 7,
  key: 'GamepadRightTrigger',
  keyCode: 202
}, {
  padIndex: 8,
  key: 'GamepadView',
  keyCode: 208
}, {
  padIndex: 9,
  key: 'GamepadMenu',
  keyCode: 207
}, {
  padIndex: 10,
  key: 'GamepadLeftThumbstickButton',
  keyCode: 209
}, {
  padIndex: 11,
  key: 'GamepadRightThumbstickButton',
  keyCode: 210
}, {
  padIndex: 12,
  key: 'GamepadDPadUp',
  keyCode: 203
}, {
  padIndex: 13,
  key: 'GamepadDPadDown',
  keyCode: 204
}, {
  padIndex: 14,
  key: 'GamepadDPadLeft',
  keyCode: 205
}, {
  padIndex: 15,
  key: 'GamepadDPadRight',
  keyCode: 206
}];
var axisStates = [{
  axis: 0,
  key: 'GamepadLeftThumbstickLeft',
  keyCode: 214
}, {
  axis: 0,
  key: 'GamepadLeftThumbstickRight',
  keyCode: 213
}, {
  axis: 1,
  key: 'GamepadLeftThumbstickUp',
  keyCode: 211
}, {
  axis: 1,
  key: 'GamepadLeftThumbstickDown',
  keyCode: 212
}, {
  axis: 2,
  key: 'GamepadRightThumbstickLeft',
  keyCode: 218
}, {
  axis: 2,
  key: 'GamepadRightThumbstickRight',
  keyCode: 217
}, {
  axis: 3,
  key: 'GamepadRightThumbstickUp',
  keyCode: 215
}, {
  axis: 3,
  key: 'GamepadRightThumbstickDown',
  keyCode: 216
}];
var allControls = [];
var isLooping = false;
var repeatIntervalId = null;
buttonStates.forEach(function (e) {
  return allControls.push(e);
});
axisStates.forEach(function (e) {
  return allControls.push(e);
});
allControls.forEach(function (e) {
  return e.pressed = false;
});
allControls.forEach(function (e) {
  return e.newPressedState = false;
});
allControls.forEach(function (e, index) {
  return e.index = index;
});

// Polyfill GamePad API
if (!navigator.getGamepads) {
  if (navigator.webkitGetGamepads) {
    navigator.getGamepads = navigator.webkitGetGamepads;
  } else {
    navigator.getGamepads = function () {
      return null;
    };
  }
}
function allowInput() {
  var doc = document;
  if (doc.visibilityState === 'hidden') {
    return false;
  }
  if (!doc.hasFocus()) {
    return false;
  }
  return true;
}
function stopRepeatInterval() {
  if (repeatIntervalId) {
    clearInterval(repeatIntervalId);
    repeatIntervalId = null;
  }
}
function startRepeatInterval() {
  stopRepeatInterval();
  repeatIntervalId = window.setInterval(onRepeatInterval, 100);
}
function onRepeatInterval() {
  var downButton = allControls.find(function (e) {
    return e.pressed;
  });
  if (downButton && allControls.filter(function (e) {
    return e.pressed;
  }).length > 1) {
    downButton = null;
  }
  if (!allowInput()) {
    stopRepeatInterval();
    clearAll();
    return;
  }
  if (!downButton) {
    stopRepeatInterval();
    return;
  }
  raiseEvent('keydown', downButton.key, downButton.keyCode, true);
}
function raiseEvent(name, key, keyCode, repeat) {
  if (!allowInput() && name !== 'keyup') {
    return;
  }
  var event = document.createEvent('Event');
  event.initEvent(name, true, true);
  event.key = key;
  event.keyCode = keyCode;
  if (repeat != null) {
    event.repeat = repeat;
  }
  var element = document.activeElement || document.body;
  setTimeout(function () {
    return element.dispatchEvent(event);
  });
}
function getGamepads() {
  try {
    // Get the latest gamepad state.
    return navigator.getGamepads() || [];
  } catch (err) {
    // getGamepads will soon be requiring a secure context
    console.error('Error getting gamepads: ', err);
    return [];
  }
}
function fireKeyUpEvents() {
  for (var i = 0; i < allControls.length; i++) {
    var button = allControls[i];
    if (button.pressed && !button.newPressedState) {
      button.pressed = false;
      raiseEvent('keyup', button.key, button.keyCode, false);
    }
  }
}
function fireKeyDownEvents() {
  for (var i = 0; i < allControls.length; i++) {
    var button = allControls[i];
    if (!button.pressed && button.newPressedState) {
      button.pressed = true;
      raiseEvent('keydown', button.key, button.keyCode, false);
    }
  }
}
function processStateChanges() {
  // If we don't have focus, clear any new keydowns and fire keyup for down ones
  if (allControls.some(function (e) {
    return e.pressed || e.newPressedState;
  }) && !allowInput()) {
    clearAll();
    return;
  }

  // Look whether a button key is down
  var newButtonDown = allControls.find(function (e) {
    return !e.pressed && e.newPressedState;
  });
  if (newButtonDown) {
    // Fire keyups first, then keydown and start repeating
    fireKeyUpEvents();
    fireKeyDownEvents();
    startRepeatInterval();
  } else {
    fireKeyUpEvents();
  }
  if (allControls.some(function (e) {
    return e.pressed !== e.newPressedState;
  })) {
    console.error('gamepadtokey.processStateChanges: Logic error!');
  }
}
function clearAll() {
  allControls.forEach(function (e) {
    return e.newPressedState = false;
  });
  fireKeyUpEvents();
}
function runInputLoop() {
  var gamepads = getGamepads();
  var gamepad = null;

  // We can only process a single gamepad
  // otherwise, button states would get corrupted,
  for (var i = 0, length = gamepads.length; i < length; i++) {
    if (gamepads[i]) {
      gamepad = gamepads[i];
      break;
    }
  }
  if (!gamepad) {
    // No gamepad available. Clear states and exit input loop.
    clearAll();
    console.log('exiting gamepad input loop');
    isLooping = false;
    return;
  }
  if (gamepad.timestamp && gamepad._lastTimestamp === gamepad.timestamp) {
    // Schedule the next one
    requestAnimationFrame(runInputLoop);
    return;
  }

  // Firefox doesn't provide the timestamp property, so we need a different way of throttling here
  if (!gamepad.timestamp && gamepad._lastTimestamp && Date.now() - gamepad._lastTimestamp < 100) {
    // Schedule the next one
    requestAnimationFrame(runInputLoop);
    return;
  }
  gamepad._lastTimestamp = gamepad.timestamp || Date.now();

  // Iterate over buttons
  var buttons = gamepad.buttons;
  for (var j = 0; j < buttons.length && j < buttonStates.length; j++) {
    buttonStates[j].newPressedState = buttons[j].pressed;
  }

  // Iterate over axes
  var axes = gamepad.axes;
  for (var _j = 0; _j < axes.length && _j < 4; _j++) {
    axisStates[2 * _j].newPressedState = axes[_j] < -thumbStickThreshHold;
    axisStates[2 * _j + 1].newPressedState = axes[_j] > thumbStickThreshHold;
  }

  // 99.9% of time, there's no change, so check right here before making a function call
  if (allControls.some(function (e) {
    return e.pressed !== e.newPressedState;
  })) {
    processStateChanges();
  }

  // Schedule the next one
  requestAnimationFrame(runInputLoop);
}
window.addEventListener("gamepadconnected", function (e) {
  var gamepad = e.gamepad;

  // seeing this in firefox over http
  if (!gamepad) {
    return;
  }
  var gamepadIndex = gamepad.index;
  console.log('gamepadconnected: ' + gamepadIndex);
  if (!isLooping) {
    isLooping = true;
    runInputLoop();
  }
});
window.addEventListener("gamepaddisconnected", function (e) {
  clearAll();
  var gamepad = e.gamepad;

  // seeing this in firefox over http
  if (!gamepad) {
    return;
  }
  var gamepadIndex = gamepad.index;
  console.log('gamepaddisconnected: ' + gamepadIndex);
});
