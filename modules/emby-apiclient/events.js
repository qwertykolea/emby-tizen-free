define(["exports"], function (_exports) {
  Object.defineProperty(_exports, "__esModule", {
    value: true
  });
  _exports.default = void 0;
  /* jshint module: true */

  function getCallbacks(obj, name) {
    if (!obj) {
      throw new Error("obj cannot be null!");
    }
    var allCallbacks = obj._callbacks;
    if (!allCallbacks) {
      allCallbacks = {};
      obj._callbacks = allCallbacks;
    }
    var list = allCallbacks[name];
    if (!list) {
      allCallbacks[name] = [];
      list = allCallbacks[name];
    }
    return list;
  }
  var _default = _exports.default = {
    on: function (obj, eventName, fn) {
      var list = getCallbacks(obj, eventName);
      list.push(fn);
    },
    off: function (obj, eventName, fn) {
      var list = getCallbacks(obj, eventName);
      var i = list.indexOf(fn);
      if (i !== -1) {
        list.splice(i, 1);
      }
    },
    trigger: function (obj, eventName) {
      var eventObject = {
        type: eventName
      };
      var additionalArgs = arguments[2] || [];
      var eventArgs = [eventObject].concat(babelHelpers.toConsumableArray(additionalArgs));
      var callbacks = getCallbacks(obj, eventName).slice(0);
      for (var i = 0, length = callbacks.length; i < length; i++) {
        try {
          callbacks[i].apply(obj, eventArgs);
        } catch (err) {
          console.error("Error during callback execution for event '" + eventName + "':", err);
        }
      }
    }
  };
});
