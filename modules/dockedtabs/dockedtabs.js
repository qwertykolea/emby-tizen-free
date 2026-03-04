define(["exports", "./../emby-apiclient/connectionmanager.js", "./../emby-apiclient/events.js", "./../common/globalize.js", "./../approuter.js", "./../emby-elements/emby-tabs/emby-tabs.js", "./../layoutmanager.js", "./../common/itemmanager/itemmanager.js", "./../common/servicelocator.js", "./../appfooter/appfooter.js", "./../viewmanager/viewmanager.js", "./../common/inputmanager.js"], function (_exports, _connectionmanager, _events, _globalize, _approuter, _embyTabs, _layoutmanager, _itemmanager, _servicelocator, _appfooter, _viewmanager, _inputmanager) {
  Object.defineProperty(_exports, "__esModule", {
    value: true
  });
  _exports.default = void 0;
  /* jshint module: true */

  // Make sure this is pulled in after button and tab css
  require(['css!modules/dockedtabs/dockedtabs.css']);
  var instance;
  var hiddenMode = 0;
  var libraryMode = 2;
  var currentMode = hiddenMode;
  var headerHomeButton;
  var headerSearchButton;
  var headerMenuButton;
  var userSignedIn = false;
  var currentServerId;
  var currentTabsList = [];
  function onLocalUserSignedIn(e, serverId, userId) {
    // reset this in case the server has changed
    currentMode = hiddenMode;
    currentServerId = serverId;
    userSignedIn = true;
  }
  function onLocalUserSignedOut(e) {
    userSignedIn = false;
  }
  function updateHomeButton(tabsEnabled) {
    if (!tabsEnabled && !headerHomeButton) {
      return;
    }
    if (!headerHomeButton) {
      headerHomeButton = document.querySelector('.headerHomeButton');
    }
    if (tabsEnabled) {
      headerHomeButton.classList.add('hiddenWhenBottomNavVisible');
    } else {
      headerHomeButton.classList.remove('hiddenWhenBottomNavVisible');
    }
  }
  function updateSearchButton(tabsEnabled) {
    if (!tabsEnabled && !headerSearchButton) {
      return;
    }
    if (!headerSearchButton) {
      headerSearchButton = document.querySelector('.headerSearchButton');
    }
    if (tabsEnabled) {
      headerSearchButton.classList.add('hiddenWhenBottomNavVisible');
    } else {
      headerSearchButton.classList.remove('hiddenWhenBottomNavVisible');
    }
  }
  function updateMenuButton(tabsEnabled) {
    if (!tabsEnabled && !headerMenuButton) {
      return;
    }
    if (!headerMenuButton) {
      headerMenuButton = document.querySelector('.headerMenuButton');
    }
  }
  function setMode(e, mode) {
    if (mode === currentMode) {
      if (mode !== hiddenMode) {
        setSelected(e);
      }
      return;
    }
    var tabs = instance;
    if (!tabs) {
      return;
    }
    currentMode = mode;
    if (mode === libraryMode) {
      setLibraryTabs(e, getElement(tabs));
    }
    if (mode === hiddenMode) {
      tabs.hide();
      updateHomeButton(false);
      updateSearchButton(false);
      updateMenuButton(false);
    } else {
      tabs.show();
      updateHomeButton(true);
      updateSearchButton(true);
      updateMenuButton(true);
    }
  }
  function setLibraryTabs(e, parentElement) {
    var tabs = [];
    _connectionmanager.default.getApiClient(currentServerId).getUserViews().then(function (result) {
      var _e$detail$url;
      tabs.push({
        name: _globalize.default.translate('Home'),
        icon: '&#xe88a;',
        href: _approuter.default.getRouteUrl('home'),
        fillIcon: true
      });
      tabs.push({
        name: _globalize.default.translate('Search'),
        icon: '&#xe8B6;',
        href: '#',
        onclick: 'search',
        navMenuId: 'search'
      });
      if (_servicelocator.appHost.supports('sync')) {
        tabs.push({
          name: _globalize.default.translate('Downloads'),
          icon: '&#xf090;',
          href: _approuter.default.getRouteUrl('downloads')
        });
      }
      for (var i = 0, length = result.Items.length; i < length; i++) {
        if (tabs.length >= 5) {
          break;
        }
        tabs.push({
          name: result.Items[i].Name,
          icon: _itemmanager.default.getDefaultIcon(result.Items[i]),
          href: _approuter.default.getRouteUrl(result.Items[i])
        });
      }
      var foundActive = false;
      var navMenuId = e.detail.navMenuId;
      var url = (_e$detail$url = e.detail.url) == null ? void 0 : _e$detail$url.toLowerCase();
      if (navMenuId) {
        for (var _i = 0, _length = tabs.length; _i < _length; _i++) {
          var tab = tabs[_i];
          if (navMenuId === tab.navMenuId) {
            tab.active = true;
            foundActive = true;
            break;
          }
          if (tab.href && url.endsWith(tab.href.toLowerCase())) {
            tab.active = true;
            foundActive = true;
            break;
          }
        }
      }
      if (!foundActive) {
        tabs[0].active = true;
      }
      setTabs(tabs, parentElement);
    });
  }
  function setTabs(tabs, parentElement) {
    currentTabsList = tabs;
    if (!tabs.length) {
      parentElement.innerHTML = '';
      parentElement.onTabsChanged();
      return;
    }
    var html = tabs.map(function (tab, index) {
      var active = tab.active ? ' emby-tab-button-active' : '';
      var iconClass = tab.fillIcon ? ' md-icon-fill' : '';
      return '<a is="emby-linkbutton" href="' + tab.href + '" tabindex="-1" class="dockedtabs-tab-button secondaryText emby-tab-button' + active + '" data-index="' + index + '" data-navmenuid="' + (tab.navMenuId || '') + '">\
                <i class="dockedtabs-tab-button-icon md-icon' + iconClass + '">' + tab.icon + '</i><div>' + tab.name + '</div></a>';
    }).join('');
    parentElement.innerHTML = html;
    parentElement.onTabsChanged();
  }
  function setSelected(e) {
    var _e$detail$url2;
    var navMenuId = e.detail.navMenuId;
    if (!navMenuId) {
      return;
    }
    var tabs = instance;
    var element = tabs.element;
    if (!element) {
      return;
    }
    var url = (_e$detail$url2 = e.detail.url) == null ? void 0 : _e$detail$url2.toLowerCase();
    for (var i = 0, length = currentTabsList.length; i < length; i++) {
      var tab = currentTabsList[i];
      if (navMenuId === tab.navMenuId) {
        element.selectedIndex(i, false);
        break;
      }
      if (tab.href && url.endsWith(tab.href.toLowerCase())) {
        element.selectedIndex(i, false);
        break;
      }
    }
  }
  function onViewShow(e) {
    var _detail$params;
    var detail = e.detail;
    if (((_detail$params = detail.params) == null ? void 0 : _detail$params.asDialog) === 'true') {
      return;
    }
    if (_layoutmanager.default.tv || detail.dockedTabs === false || !userSignedIn) {
      setMode(e, hiddenMode);
    } else {
      setMode(e, libraryMode);
    }
  }
  function render() {
    _appfooter.default.add('<div is="emby-tabs" class="dockedtabs-tabs dockedtabs hide focuscontainer-x"></div>');
    return _appfooter.default.element.querySelector('.dockedtabs');
  }
  function onTabsClick(e) {
    var button = e.target.closest('.dockedtabs-tab-button');
    if (!button) {
      return;
    }
    var navMenuId = button.getAttribute('data-navmenuid');
    if (!navMenuId) {
      return;
    }
    if (navMenuId === 'search') {
      // pass in current view as source element so that views can more easily override
      _inputmanager.default.trigger('search', {
        sourceElement: _viewmanager.default.currentView(),
        originalEvent: e
      });
      e.preventDefault();
      return;
    }
  }
  function getElement(instance) {
    var element = instance.element;
    if (!element) {
      element = instance.element = render();
      element.addEventListener('click', onTabsClick);
    }
    return element;
  }
  function DockedTabs() {
    instance = this;
    _events.default.on(_connectionmanager.default, 'localusersignedin', onLocalUserSignedIn);
    _events.default.on(_connectionmanager.default, 'localusersignedout', onLocalUserSignedOut);
    document.addEventListener('viewshow', onViewShow);
    var apiClient = _connectionmanager.default.currentApiClient();
    if (apiClient != null && apiClient.isLoggedIn()) {
      onLocalUserSignedIn({}, apiClient.serverId(), apiClient.getCurrentUserId());
    }
  }
  DockedTabs.prototype.destroy = function () {
    document.removeEventListener('viewshow', onViewShow);
    var self = this;
    self.element = null;
  };
  DockedTabs.prototype.show = function () {
    getElement(this).classList.remove('hide');
    _appfooter.default.setWithContent50w(true);
  };
  DockedTabs.prototype.hide = function () {
    var element = this.element;
    if (element) {
      element.classList.add('hide');

      // this is necessary to make them go away or vivaldi will end up sending click events to them even when not focused. e.g., space bar in video player
      element.innerHTML = '';
      _appfooter.default.setWithContent50w(false);
    }
  };
  var _default = _exports.default = new DockedTabs();
});
