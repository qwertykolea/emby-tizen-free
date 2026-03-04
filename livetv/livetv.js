define(["exports", "./../modules/tabbedview/tabbedview.js", "./../modules/common/globalize.js", "./../modules/emby-elements/emby-itemscontainer/emby-itemscontainer.js", "./../modules/emby-elements/emby-button/emby-button.js", "./../modules/emby-elements/emby-scroller/emby-scroller.js", "./../modules/focusmanager.js", "./../modules/registrationservices/registrationservices.js", "./../modules/common/usersettings/usersettings.js", "./../modules/maintabsmanager.js"], function (_exports, _tabbedview, _globalize, _embyItemscontainer, _embyButton, _embyScroller, _focusmanager, _registrationservices, _usersettings, _maintabsmanager) {
  Object.defineProperty(_exports, "__esModule", {
    value: true
  });
  _exports.default = void 0;
  /* jshint module: true */

  function getTabs() {
    var item = this.item;
    var subviews = (item == null ? void 0 : item.Subviews) || [];
    return [{
      name: _globalize.default.translate('Programs'),
      id: 'suggestions'
    }, {
      name: _globalize.default.translate('Guide'),
      id: 'guide'
    }, {
      name: _globalize.default.translate('Channels'),
      id: 'channels'
    }, {
      name: _globalize.default.translate('Tags'),
      id: 'tags',
      enabled: subviews.includes('tags')
    }, {
      name: _globalize.default.translate('Recordings'),
      id: 'recordings'
    }, {
      name: _globalize.default.translate('Schedule'),
      id: 'schedule'
    }, {
      name: _globalize.default.translate('Series'),
      id: 'series'
    }];
  }
  function hideShowAll(view, className, hide) {
    var elems = view.querySelectorAll('.' + className);
    for (var i = 0, length = elems.length; i < length; i++) {
      if (hide) {
        elems[i].classList.add('hide');
      } else {
        elems[i].classList.remove('hide');
      }
    }
  }
  function validateUnlock(view, showDialog) {
    return _registrationservices.default.validateFeature('livetv', {
      showDialog: showDialog,
      viewOnly: true
    }).then(function () {
      hideShowAll(view, 'tabContent', false);
      view.querySelector('.unlockContainer').classList.add('hide');
    }, function () {
      hideShowAll(view, 'tabContent', true);
      view.querySelector('.unlockContainer').classList.remove('hide');
      _focusmanager.default.focus(view.querySelector('.btnUnlock'));
    });
  }
  function validateTabLoad(index) {
    return validateUnlock(this.view, false);
  }
  function LiveTVView(view, params) {
    _tabbedview.default.apply(this, arguments);
    view.querySelector('.unlockText').innerHTML = _globalize.default.translate('DvrSubscriptionRequired', '', '');
    view.querySelector('.btnUnlockText').innerHTML = _globalize.default.translate('HeaderBecomeProjectSupporter');
    validateUnlock(view, false);
    view.querySelector('.btnUnlock').addEventListener('click', function () {
      validateUnlock(view, true);
    });
  }
  Object.assign(LiveTVView.prototype, _tabbedview.default.prototype);
  LiveTVView.prototype.getTabs = getTabs;
  LiveTVView.prototype.validateTabLoad = validateTabLoad;
  LiveTVView.prototype.supportsHorizontalTabScroll = function () {
    return true;
  };
  LiveTVView.prototype.getDefaultTabUserSettingsValue = function (folderId) {
    return _usersettings.default.get('landing-livetv');
  };
  LiveTVView.prototype.loadTabController = function (id) {
    switch (id) {
      case 'collections':
        return Emby.importModule('./modules/tabbedview/collectionstab.js');
      case 'genres':
        return Emby.importModule('./modules/tabbedview/genrestab.js');
      case 'tags':
        return Emby.importModule('./modules/tabbedview/tagstab.js');
      case 'suggestions':
        return Emby.importModule('./livetv/suggestions.js');
      case 'guide':
        return Emby.importModule('./livetv/guide.js');
      case 'channels':
        return Emby.importModule('./livetv/channels.js');
      case 'recordings':
        return Emby.importModule('./livetv/recordings.js');
      case 'schedule':
        return Emby.importModule('./livetv/schedule.js');
      case 'series':
        return Emby.importModule('./livetv/series.js');
      default:
        throw new Error('tab not found: ' + id);
    }
  };
  LiveTVView.prototype.fetchItem = function () {
    var apiClient = this.getApiClient();
    return apiClient.getJSON(apiClient.getUrl('LiveTV/Folder'));
  };
  LiveTVView.prototype.getTabControllerOptions = function (id) {
    var options = _tabbedview.default.prototype.getTabControllerOptions.apply(this, arguments);
    if (id === 'tags') {
      options.tagsApiClientMethod = 'getLiveTvChannelTags';
      options.prefixesApiClientMethod = 'getLiveTvChannelTagPrefixes';
    }
    return options;
  };
  LiveTVView.prototype.enableWindowInputCommands = function () {
    return true;
  };
  LiveTVView.prototype.onWindowInputCommand = function (e) {
    switch (e.detail.command) {
      case 'livetv':
        e.preventDefault();
        return;
      case 'recordedtv':
        _maintabsmanager.default.selectedTabIndex(4);
        e.preventDefault();
        return;
      case 'guide':
        _maintabsmanager.default.selectedTabIndex(1);
        e.preventDefault();
        return;
      default:
        break;
    }
    _tabbedview.default.prototype.onWindowInputCommand.apply(this, arguments);
  };
  var _default = _exports.default = LiveTVView;
});
