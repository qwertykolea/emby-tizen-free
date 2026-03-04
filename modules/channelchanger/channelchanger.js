define(["exports", "./../dom.js", "./../emby-apiclient/connectionmanager.js", "./../emby-apiclient/events.js", "./../common/usersettings/usersettings.js", "./../common/playback/playbackmanager.js", "./../common/itemmanager/itemmanager.js", "./../common/globalize.js", "./../loading/loading.js", "./../dialoghelper/dialoghelper.js"], function (_exports, _dom, _connectionmanager, _events, _usersettings, _playbackmanager, _itemmanager, _globalize, _loading, _dialoghelper) {
  Object.defineProperty(_exports, "__esModule", {
    value: true
  });
  _exports.default = void 0;
  // only needed for styles

  require(['css!modules/alphanumericshortcuts/alphanumericshortcuts.css']);
  var currentChangeOptions;
  var inputDisplayElement;
  function getAllChannels(apiClient, options) {
    if (options.channelsResult) {
      return Promise.resolve(options.channelsResult);
    }
    var query = {
      UserId: apiClient.getCurrentUserId(),
      IsAiring: true,
      ImageTypeLimit: 1,
      EnableImageTypes: "Primary,Thumb,Backdrop",
      Fields: 'ProgramPrimaryImageAspectRatio,PrimaryImageAspectRatio',
      EnableUserData: false,
      SortBy: "ChannelNumber,SortName",
      AddCurrentProgram: false
    };
    _usersettings.default.addLiveTvChannelSortingToQuery(query, _globalize.default);
    return apiClient.getLiveTvChannels(query).then(function (result) {
      options.channelsResult = result;
      return result;
    });
  }
  function clearState() {
    clearAlphaNumericShortcutTimeout();
    currentChangeOptions = null;
    var elem = inputDisplayElement;
    if (elem) {
      elem.innerHTML = '';
      elem.classList.add('hide');
    }
  }
  function onAlphanumericShortcutTimeout() {
    var options = currentChangeOptions;
    clearState();
    var newItem = options == null ? void 0 : options.newItem;
    if (newItem) {
      _loading.default.show();
      _playbackmanager.default.play({
        items: [newItem]
      });
    }
  }
  function ensureInputDisplayElement() {
    if (!inputDisplayElement) {
      inputDisplayElement = document.createElement('div');
      inputDisplayElement.classList.add('alphanumeric-shortcut', 'hide', 'dialog');
      if (_dom.default.allowBackdropFilter()) {
        inputDisplayElement.classList.add('dialog-blur');
      }
      document.body.appendChild(inputDisplayElement);
    }
  }
  var alpanumericShortcutTimeout;
  function clearAlphaNumericShortcutTimeout() {
    if (alpanumericShortcutTimeout) {
      clearTimeout(alpanumericShortcutTimeout);
      alpanumericShortcutTimeout = null;
    }
  }
  function resetAlphaNumericShortcutTimeout() {
    clearAlphaNumericShortcutTimeout();
    alpanumericShortcutTimeout = setTimeout(onAlphanumericShortcutTimeout, 2000);
  }
  function updateDisplayElementWithItem(item) {
    var elem = inputDisplayElement;
    if (!elem) {
      return;
    }
    var html = '';
    html += _itemmanager.default.getDisplayName(item, {
      channelNumberFirst: true
    });
    elem.innerHTML = html;
    elem.classList.remove('hide');
  }
  function updateDisplayElement(options) {
    var item = options.currentItem;
    var offset = options.offset;
    getAllChannels(_connectionmanager.default.getApiClient(item), options).then(function (result) {
      var index = -1;
      var channels = result.Items;
      for (var i = 0, length = channels.length; i < length; i++) {
        if (channels[i].Id === item.Id) {
          index = i;
          break;
        }
      }
      if (index === -1) {
        index = 0;
        //return;
      }
      index += offset;
      index = Math.min(channels.length - 1, index);
      index = Math.max(index, 0);
      item = channels[index];
      if (!item) {
        return;
      }
      options.numChannels = channels.length;
      options.newItem = item;
      options.newItemIndex = index;
      updateDisplayElementWithItem(item);
    });
  }
  _events.default.on(_playbackmanager.default, 'playbackstop', clearState);
  var _default = _exports.default = {
    onChannelChangeRequest: function (options) {
      ensureInputDisplayElement();
      var currentOptions = currentChangeOptions;
      if (currentOptions) {
        var index = currentOptions.newItemIndex;
        if (index != null) {
          var numChannels = currentOptions.numChannels;
          var maxIndex = numChannels - 1;
          var newIndex = index + options.offset;
          if (newIndex < 0) {
            options.offset += 0 - newIndex;
          } else if (newIndex > maxIndex) {
            //console.log('offset before: ' + options.offset + ', numChannels: ' + numChannels + ', newIndex: ' + newIndex);
            options.offset -= newIndex - maxIndex;
            //console.log('offset after: ' + options.offset + ', numChannels: ' + numChannels);
          }
        }
        currentOptions.offset += options.offset;
        options = currentOptions;
      } else {
        currentChangeOptions = options;
      }
      updateDisplayElement(options);
      resetAlphaNumericShortcutTimeout();
    }
  };
});
