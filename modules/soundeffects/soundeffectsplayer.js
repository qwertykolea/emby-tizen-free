define(["exports", "./../howlerjs/howler.core.js"], function (_exports, _howlerCore) {
  Object.defineProperty(_exports, "__esModule", {
    value: true
  });
  _exports.default = void 0;
  /* jshint module: true */

  var sounds = {};
  var _default = _exports.default = {
    play: function (options) {
      var path = options.path;
      var sound = sounds[path];
      if (!sound) {
        var volume = options.volume || 0.3;
        sound = new _howlerCore.default({
          src: [path],
          volume: volume
        });
        sounds[path] = sound;
      }
      sound.play();
    }
  };
});
