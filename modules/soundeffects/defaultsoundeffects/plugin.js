define(["exports"], function (_exports) {
  Object.defineProperty(_exports, "__esModule", {
    value: true
  });
  _exports.default = void 0;
  /* jshint module: true */

  function DefaultSoundEffects() {
    var self = this;
    self.name = 'Default Sound Effects';
    self.type = 'soundeffects';
    self.id = 'defaultsoundeffects';
  }
  DefaultSoundEffects.prototype.getEffects = function () {
    return {
      navigation: 'navigation.mp3',
      select: 'select.mp3'
    };
  };
  var _default = _exports.default = DefaultSoundEffects;
});
