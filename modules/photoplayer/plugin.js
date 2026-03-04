define(["exports", "./../emby-apiclient/events.js", "./../common/appsettings.js"], function (_exports, _events, _appsettings) {
  Object.defineProperty(_exports, "__esModule", {
    value: true
  });
  _exports.default = void 0;
  /* jshint module: true */

  function PhotoPlayer() {
    this.name = 'Photo Player';
    this.type = 'mediaplayer';
    this.id = 'photoplayer';

    // Let any players created by plugins take priority
    this.priority = 1;
  }
  PhotoPlayer.prototype.play = function (options) {
    var self = this;
    return Emby.importModule('./modules/slideshow/slideshow.js').then(function (slideshow) {
      var _options$items$;
      var index = options.startIndex || 0;
      var newSlideShow = new slideshow({
        cardFields: [],
        cover: false,
        getItems: options.getItems,
        items: options.items,
        startIndex: index,
        interval: _appsettings.default.slideshowIntervalMs(),
        interactive: true,
        autoplay: options.autoplay,
        serverId: options.serverId || ((_options$items$ = options.items[0]) == null ? void 0 : _options$items$.ServerId)
      });
      newSlideShow.show();
      _events.default.on(newSlideShow, 'closed', self.onSlideShowClosed.bind(self));
      self.slideshow = newSlideShow;
    });
  };
  PhotoPlayer.prototype.onSlideShowClosed = function () {
    _events.default.trigger(this, 'stopped');
  };
  PhotoPlayer.prototype.stop = function (options) {
    if (this.slideshow) {
      this.slideshow.hide();
      this.slideshow = null;
      return new Promise(function (resolve, reject) {
        setTimeout(resolve, 500);
      });
    }
    return Promise.resolve();
  };
  PhotoPlayer.prototype.destroy = function (options) {
    this.stop();
  };
  PhotoPlayer.prototype.isPlaying = function (mediaType) {
    if (mediaType && mediaType !== 'Photo') {
      return false;
    }
    return this.slideshow != null;
  };
  PhotoPlayer.prototype.pause = function () {};
  PhotoPlayer.prototype.unpause = function () {};
  PhotoPlayer.prototype.paused = function () {
    return false;
  };
  PhotoPlayer.prototype.getVolume = function () {
    return 100;
  };
  PhotoPlayer.prototype.setVolume = function () {};
  PhotoPlayer.prototype.volumeUp = function () {};
  PhotoPlayer.prototype.volumeDown = function () {};
  PhotoPlayer.prototype.setMute = function (mute) {};
  PhotoPlayer.prototype.currentTime = function () {};
  PhotoPlayer.prototype.duration = function () {};
  PhotoPlayer.prototype.isMuted = function () {
    return false;
  };
  PhotoPlayer.prototype.canPlayMediaType = function (mediaType) {
    switch (mediaType) {
      case 'Photo':
        return true;
      default:
        return false;
    }
  };
  var _default = _exports.default = PhotoPlayer;
});
