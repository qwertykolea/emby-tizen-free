define(["exports", "./../common/globalize.js", "./../common/playback/playbackmanager.js", "./../loading/loading.js", "./../emby-apiclient/events.js", "./../common/servicelocator.js", "./../browser.js", "./../layoutmanager.js"], function (_exports, _globalize, _playbackmanager, _loading, _events, _servicelocator, _browser, _layoutmanager) {
  Object.defineProperty(_exports, "__esModule", {
    value: true
  });
  _exports.default = void 0;
  /* jshint module: true */

  var currentItem;
  function showDialog(options) {
    return Emby.importModule('./modules/dialog/dialog.js').then(function (dialog) {
      return dialog(options);
    });
  }
  function showActionSheet(options) {
    return Emby.importModule('./modules/actionsheet/actionsheet.js').then(function (ActionSheet) {
      return ActionSheet.show(options);
    });
  }
  function mirrorIfEnabled(item) {
    if (item) {
      currentItem = item;
    } else {
      item = currentItem;
    }
    if (item) {
      if (item.IsFolder && item.Type !== 'Series' && item.Type !== 'MusicAlbum' && item.Type !== 'MusicArtist') {
        return;
      }
      var currentPlayer = _playbackmanager.default.getCurrentPlayer();
      if (currentPlayer && !currentPlayer.isLocalPlayer && currentPlayer.id === 'chromecast') {
        _playbackmanager.default.displayContent({
          ItemName: item.Name,
          ItemId: item.Id,
          ItemType: item.Type
        }, currentPlayer);
      }
    }
  }
  function emptyCallback() {
    // avoid console logs about uncaught promises
  }
  function getTargetSecondaryText(target) {
    if (target.user) {
      return target.user.Name;
    }
    return null;
  }
  function getIcon(deviceType) {
    switch (deviceType) {
      case 'smartphone':
        return '&#xe32C;';
      case 'tablet':
        return '&#xe32F;';
      case 'tv':
        return '&#xe333;';
      case 'cast':
        return '&#xe307;';
      case 'desktop':
        return '&#xe30A;';
      default:
        return '&#xe333;';
    }
  }
  function getLocalIcon(target) {
    if (_browser.default.tv || _layoutmanager.default.tv) {
      return getIcon('tv');
    }
    return 'ontouchstart' in document ? getIcon('smartphone') : getIcon('desktop');
  }
  function isChromium() {
    var _navigator$userAgentD;
    var brands = ((_navigator$userAgentD = navigator.userAgentData) == null ? void 0 : _navigator$userAgentD.brands) || [];
    for (var i = 0, length = brands.length; i < length; i++) {
      if ((brands[i].brand || '').toLowerCase() === 'chromium') {
        return true;
      }
    }
    return false;
  }
  var LocalPlayerId = 'local';
  function switchToPlayer(id, target) {
    if (id === LocalPlayerId) {
      _playbackmanager.default.setDefaultPlayerActive();
    } else {
      _playbackmanager.default.trySetActivePlayer(target.playerName, target);
      mirrorIfEnabled();
    }
  }
  function switchToPlayerWithConfirmation(currentPlayerId, id, target, currentDeviceName) {
    if (_playbackmanager.default.getSupportedCommands().indexOf('EndSession') !== -1 && id !== currentPlayerId) {
      var menuItems = [];
      menuItems.push({
        name: _globalize.default.translate('Yes'),
        id: 'yes'
      });
      menuItems.push({
        name: _globalize.default.translate('No'),
        id: 'no'
      });
      showDialog({
        buttons: menuItems,
        //positionTo: positionTo,
        text: _globalize.default.translate('ConfirmEndPlayerSession', currentDeviceName)
      }).then(function (dialogResult) {
        switch (dialogResult) {
          case 'yes':
            _playbackmanager.default.getCurrentPlayer().endSession();
            switchToPlayer(id, target);
            break;
          case 'no':
            switchToPlayer(id, target);
            break;
          default:
            break;
        }
      }, emptyCallback);
    } else {
      switchToPlayer(id, target);
    }
  }
  function sortTargets(a, b) {
    if (a.selected) {
      return -1;
    }
    if (a.selected) {
      return 1;
    }
    return 0;
  }
  function showPlayerSelection(button) {
    var _currentPlayerInfo;
    var currentPlayerInfo = _playbackmanager.default.getPlayerInfo();
    var currentPlayerId = (_currentPlayerInfo = currentPlayerInfo) == null ? void 0 : _currentPlayerInfo.id;
    _loading.default.show();
    return _playbackmanager.default.getTargets().then(function (targets) {
      var menuItems = targets.map(function (t) {
        return {
          name: t.name,
          nameSubtitle: t.appName,
          id: t.id,
          selected: currentPlayerId === t.id,
          secondaryText: getTargetSecondaryText(t),
          icon: getIcon(t.deviceType)
        };
      });
      menuItems.unshift({
        name: _globalize.default.translate('HeaderThisDevice'),
        nameSubtitle: _servicelocator.appHost.appName(),
        id: LocalPlayerId,
        selected: !currentPlayerInfo || currentPlayerInfo.isLocalPlayer,
        icon: getLocalIcon()
      });
      menuItems.sort(sortTargets);
      _loading.default.hide();
      var menuOptions = {
        title: _globalize.default.translate('HeaderPlayOn'),
        items: menuItems,
        positionTo: button,
        positionY: 'bottom',
        positionX: 'right',
        transformOrigin: 'right top',
        resolveOnClick: true,
        hasItemIcon: true,
        fields: ['Name', 'NameSubtitle', 'ShortOverview'],
        hasItemSelectionState: true
      };

      // Unfortunately we can't allow the url to change or chromecast will throw a security error
      // Might be able to solve this in the future by moving the dialogs to hashbangs
      if (!(_servicelocator.appHost.supports('castmenuhashchange') && !isChromium())) {
        menuOptions.enableHistory = false;
      }
      return showActionSheet(menuOptions).then(function (id) {
        var _currentPlayerInfo2, _currentPlayerInfo3, _currentPlayerInfo4;
        currentPlayerInfo = _playbackmanager.default.getPlayerInfo();
        currentPlayerId = (_currentPlayerInfo2 = currentPlayerInfo) == null ? void 0 : _currentPlayerInfo2.id;
        var target = targets.filter(function (t) {
          return t.id === id;
        })[0];
        var currentDeviceName = ((_currentPlayerInfo3 = currentPlayerInfo) == null ? void 0 : _currentPlayerInfo3.deviceName) || ((_currentPlayerInfo4 = currentPlayerInfo) == null ? void 0 : _currentPlayerInfo4.name);
        switchToPlayerWithConfirmation(currentPlayerId, id, target, currentDeviceName);
      }, emptyCallback);
    });
  }
  document.addEventListener('itemshow', function (e) {
    var item = e.detail.item;
    if (item && item.ServerId) {
      mirrorIfEnabled(item);
      return;
    }
  });
  _events.default.on(_playbackmanager.default, 'pairing', function (e) {
    _loading.default.show();
  });
  _events.default.on(_playbackmanager.default, 'paired', function (e) {
    _loading.default.hide();
  });
  _events.default.on(_playbackmanager.default, 'pairerror', function (e) {
    _loading.default.hide();
  });
  var _default = _exports.default = {
    show: showPlayerSelection
  };
});
