define(["exports", "./../globalize.js", "./../../dialog/dialog.js", "./playbackmanager.js"], function (_exports, _globalize, _dialog, _playbackmanager) {
  Object.defineProperty(_exports, "__esModule", {
    value: true
  });
  _exports.default = void 0;
  /* jshint module: true */

  function PlayQueueConfirmation() {
    this.name = 'Play Queue Confirmation';
    this.type = 'preplayintercept';
    this.id = 'playqueueconfirmation';
  }
  function keepPlayQueue(options, player) {
    var currentPlaylistIndex = _playbackmanager.default.getCurrentPlaylistIndex(player);

    // Unexpected, so just play normally
    if (currentPlaylistIndex === -1) {
      return Promise.resolve();
    }
    return _playbackmanager.default.getPlaylist({
      StartIndex: currentPlaylistIndex
    }, player).then(function (result) {
      var items = options.items;
      var previousItems = result.Items;

      // Unexpected, so just play normally
      if (!previousItems.length) {
        return Promise.resolve();
      }
      items.push.apply(items, babelHelpers.toConsumableArray(previousItems));
    });
  }
  function showConfirmation(playOptions, currentPlaylistLength) {
    var player = _playbackmanager.default.getCurrentPlayer();
    var options = {
      text: _globalize.default.translate('AfterThisPlaysConfirmation')
    };
    var items = [];
    items.push({
      name: _globalize.default.translate('Keep'),
      id: 'keep',
      type: 'submit'
    });
    items.push({
      name: _globalize.default.translate('Clear'),
      id: 'clear'
    });
    items.push({
      name: _globalize.default.translate('Cancel'),
      id: 'cancel',
      type: 'cancel'
    });
    options.buttons = items;
    return (0, _dialog.default)(options).then(function (result) {
      if (result === 'cancel') {
        return Promise.reject();
      }
      if (result === 'keep') {
        return keepPlayQueue(playOptions, player);
      }
      return Promise.resolve();
    });
  }
  PlayQueueConfirmation.prototype.intercept = function (options) {
    var item = options.item;
    if (!item) {
      return Promise.resolve();
    }
    if (options.command === 'play' && options.mediaType === 'Audio' && _playbackmanager.default.isPlayingAudio() && options.fullscreen) {
      var currentPlaylistLength = _playbackmanager.default.getCurrentPlaylistLength();
      if (currentPlaylistLength > 1) {
        return showConfirmation(options, currentPlaylistLength);
      }
    }
    return Promise.resolve();
  };
  var _default = _exports.default = PlayQueueConfirmation;
});
