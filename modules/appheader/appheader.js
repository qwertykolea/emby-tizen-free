define(["exports", "./../dom.js", "./../common/inputmanager.js", "./../common/usersettings/usersettings.js", "./../common/globalize.js", "./../common/datetime.js", "./../common/appsettings.js", "./../common/playback/playbackmanager.js", "./../emby-apiclient/events.js", "./../emby-apiclient/connectionmanager.js", "./../layoutmanager.js", "./../approuter.js", "./../maintabsmanager.js", "./../viewmanager/viewmanager.js", "./../backdrop/backdrop.js", "./../common/servicelocator.js", "./../navdrawer/navdrawer.js", "./../navdrawer/navdrawercontent.js", "./../common/input/api.js", "./../emby-elements/emby-button/paper-icon-button-light.js", "./../emby-elements/emby-button/emby-button.js", "./../common/methodtimer.js", "./appheadercontent.js", "./../common/textencoding.js"], function (_exports, _dom, _inputmanager, _usersettings, _globalize, _datetime, _appsettings, _playbackmanager, _events, _connectionmanager, _layoutmanager, _approuter, _maintabsmanager, _viewmanager, _backdrop, _servicelocator, _navdrawer, _navdrawercontent, _api, _paperIconButtonLight, _embyButton, _methodtimer, _appheadercontent, _textencoding) {
  Object.defineProperty(_exports, "__esModule", {
    value: true
  });
  _exports.default = void 0;
  /* jshint module: true */

  require(['material-icons', 'css!modules/appheader/appheader.css', 'css!!tv|modules/appheader/appheader_nontv.css', 'css!tv|modules/appheader/appheader_tv.css']);
  var skinHeaderElement = document.querySelector('.skinHeader');
  var hasPhysicalBackButton = _servicelocator.appHost.supports('physicalbackbutton');
  var supportsFullscreenMediaQueries = _servicelocator.appHost.supports('fullscreenmediaqueries');
  var backgroundContainer = document.querySelector('.backgroundContainer');
  var supportsAsyncDecodedImages = _dom.default.supportsAsyncDecodedImages();
  var decodingAttribute = supportsAsyncDecodedImages ? ' decoding="async"' : '';
  var SupportsTranslateProperty = CSS.supports('translate', '40px 100px');
  var TranslateProperty = SupportsTranslateProperty ? 'translate' : CSS.supports('transform', 'scale(1)') ? 'transform' : '-webkit-transform';
  var docElem = document.documentElement;
  var userSignedIn = false;
  var headerLeft;
  var headerHomeButton;
  var headerMenuButton;
  var headerBackButton;
  var headerCastButton;
  var headerHelpButton;
  var headerSearchButton;
  var headerSettingsButton;
  var headerUserButton;
  var selectedPlayerText;
  var headerRight;
  var currentServerId;
  var isUserAdmin;
  var headerMiddle;
  var currentDrawerState;
  var appFooter;
  var SupportsExternalLinks = _servicelocator.appHost.supports('externallinks') && _servicelocator.appHost.supports('targetblank');
  function updateClock() {
    var clock = this.clockElement;
    if (clock) {
      clock.innerHTML = _datetime.default.getDisplayTime(new Date()).toLowerCase();
    }
  }
  function onLocalUserSignedOut(e) {
    userSignedIn = false;
    headerSearchButton.classList.add('hide');
    updateUserInHeader(null);
    setRemoteControlVisibility();
  }
  function getUserImageUrl(user, apiClient, options) {
    if (!options) {
      options = {};
    }
    options.type = "Primary";
    if (user.PrimaryImageTag) {
      options.tag = user.PrimaryImageTag;
      return apiClient.getUserImageUrl(user.Id, options);
    }
    return null;
  }
  function ensureHeaderMiddle() {
    if (!headerMiddle) {
      headerMiddle = document.querySelector('.headerMiddle');
    }
  }
  function ensureHeaderSettingsButton() {
    if (!headerUserButton) {
      headerUserButton = document.querySelector('.headerUserButton');
    }
    if (!headerSettingsButton) {
      headerSettingsButton = document.querySelector('.headerSettingsButton');
    }
  }
  function updateUserInHeader(user) {
    ensureHeaderSettingsButton();
    var userImageUrl;
    if (user) {
      if (user.PrimaryImageTag) {
        var apiClient = _connectionmanager.default.getApiClient(user.ServerId);
        var height = Math.round(skinHeaderElement.offsetHeight * 0.56);
        userImageUrl = getUserImageUrl(user, apiClient, {
          height: height
        });
      }
    }
    if (userImageUrl) {
      headerUserButton.innerHTML = '<img draggable="false"' + decodingAttribute + ' class="headerUserButtonImage paper-icon-button-img" src="' + userImageUrl + '" />';
    } else {
      headerUserButton.innerHTML = '<i class="md-icon">&#xe7FD;</i>';
    }
    if (user) {
      headerUserButton.classList.remove('hide');
      if (!_layoutmanager.default.tv) {
        headerSettingsButton.classList.remove('hide');
      } else {
        headerSettingsButton.classList.add('hide');
      }
      isUserAdmin = user.Policy.IsAdministrator;
    } else {
      headerUserButton.classList.add('hide');
      headerSettingsButton.classList.add('hide');
      isUserAdmin = false;
    }
  }
  function onUserUpdated(e, apiClient, data) {
    if (apiClient.getCurrentUserId() === data.Id && apiClient.serverId() === currentServerId) {
      updateUserInHeader(data);
    }
  }
  function resetPremiereButton() {
    if (!_servicelocator.appHost.supports('premiereinheader')) {
      return;
    }

    // On the local server we may not have the serverId yet
    if (!_connectionmanager.default.currentApiClient() || !_connectionmanager.default.currentApiClient().serverId()) {
      return;
    }
    if (!userSignedIn) {
      return;
    }
    Emby.importModule('./modules/registrationservices/registrationservices.js').then(function (registrationServices) {
      registrationServices.validateFeature('themes', {
        viewOnly: true,
        showDialog: false
      }).then(removePremiereButton, addPremiereButton);
    });
  }
  function onPremiereButtonClick() {
    Emby.importModule('./modules/registrationservices/registrationservices.js').then(function (registrationServices) {
      registrationServices.validateFeature('themes', {
        viewOnly: true
      }).then(resetPremiereButton);
    });
  }
  function addPremiereButton() {
    var html = '<button is="emby-button" class="raised raised-mini button-submit btnHeaderPremiere headerButton headerSectionItem" style="padding-top:.5em;padding-bottom:.5em;">' + _globalize.default.translate('HeaderBecomeProjectSupporter') + '</button>';
    if (document.querySelector('.btnHeaderPremiere')) {
      return;
    }
    document.querySelector('.headerRight').insertAdjacentHTML('afterbegin', html);
    document.querySelector('.btnHeaderPremiere').addEventListener('click', onPremiereButtonClick);
  }
  function removePremiereButton() {
    var btn = document.querySelector('.btnHeaderPremiere');
    if (btn) {
      btn.remove();
    }
  }
  function onLocalUserSignedIn(e, serverId, userId) {
    currentServerId = serverId;
    userSignedIn = true;
    var apiClient = _connectionmanager.default.getApiClient(serverId);
    apiClient.getUser(userId).then(updateUserInHeader);
    resetPremiereButton();
    setRemoteControlVisibility();
    setSearchVisibility({});
  }
  function onHeaderMenuButtonClick() {
    _navdrawer.default.open();
  }
  function onHomeClick() {
    _approuter.default.goHome();
  }
  function onBackClick(e) {
    // pass in current view as source element so that views can more easily override
    _inputmanager.default.trigger('back', {
      sourceElement: _viewmanager.default.currentView(),
      originalEvent: e
    });
  }
  function onSearchClick(e) {
    // pass in current view as source element so that views can more easily override
    _inputmanager.default.trigger('search', {
      sourceElement: _viewmanager.default.currentView(),
      originalEvent: e
    });
  }
  function onUserButtonClick() {
    _approuter.default.showUserMenu({
      positionTo: this,
      positionY: 'bottom',
      positionX: 'right',
      transformOrigin: 'right top'
    });
  }
  function onSettingsButtonClick() {
    var manageServerRouteUrl = _approuter.default.getRouteUrl('manageserver');
    if (!isUserAdmin || !_approuter.default.getRouteInfo(manageServerRouteUrl)) {
      return onUserButtonClick.call(this);
    }
    _approuter.default.show(manageServerRouteUrl);
  }
  function onCastButtonClick() {
    var btn = this;
    Emby.importModule('./modules/playback/playerselection.js').then(function (playerSelectionMenu) {
      playerSelectionMenu.show(btn);
    });
  }
  var bottomTabsLoaded;
  function loadBottomTabs() {
    if (bottomTabsLoaded) {
      return;
    }
    bottomTabsLoaded = true;
    Emby.importModule('./modules/dockedtabs/dockedtabs.js');
  }
  function updateFontSize() {
    var fontSize = parseInt(_appsettings.default.fontSize() || '0');
    if (!fontSize || !_layoutmanager.default.tv) {
      document.documentElement.style.removeProperty('font-size');
      return;
    }
    var value = 2.5 + 0.2 * fontSize;
    document.documentElement.style.fontSize = value + 'vh';
  }
  var currentViewEvent;
  function onLayoutModeChange() {
    updateFontSize();
    if (!_layoutmanager.default.tv && _dom.default.allowBackdropFilter()) {
      skinHeaderElement.classList.add('skinHeader-withbackdropfilter');
    } else {
      skinHeaderElement.classList.remove('skinHeader-withbackdropfilter');
    }
    ensureHeaderSettingsButton();
    if (_layoutmanager.default.tv || headerUserButton.classList.contains('hide')) {
      headerSettingsButton.classList.add('hide');
    } else {
      headerSettingsButton.classList.remove('hide');
    }
    if (_layoutmanager.default.tv) {
      headerRight.classList.add('secondaryText');
    } else {
      headerRight.classList.remove('secondaryText');
      loadBottomTabs();
    }
    ensureHeaderMiddle();
    this.destroyClock();
    this.loadClock();
    setRemoteControlVisibility();
    if (currentViewEvent) {
      var detail = currentViewEvent.detail;
      var drawerAllowed = allowDrawer(detail);
      updateDrawerLayout(detail, drawerAllowed);
      _navdrawer.default.onViewShow(currentViewEvent);
    }
  }
  function updateCastIcon() {
    var btnCast = headerCastButton;
    if (!btnCast) {
      return;
    }
    var info = _playbackmanager.default.getPlayerInfo();
    if (info && !info.isLocalPlayer) {
      btnCast.innerHTML = '&#xe308;';
      selectedPlayerText.innerHTML = info.deviceName || info.name;
    } else {
      btnCast.innerHTML = '&#xe307;';
      selectedPlayerText.innerHTML = '';
    }
  }
  function enableAudioNavigate(state) {
    return _layoutmanager.default.tv && state.NowPlayingItem && state.NowPlayingItem.MediaType === 'Audio';
  }
  function onNewPlayQueueStart(e, player, state) {
    if (enableAudioNavigate(state) && !state.IsBackgroundPlayback) {
      _approuter.default.showNowPlaying();
    }
  }
  function setRemoteControlVisibility() {
    if (_servicelocator.appHost.supports('remotecontrol') && userSignedIn && (!_layoutmanager.default.tv || _appsettings.default.enableRemoteControlInTVMode())) {
      headerCastButton.classList.remove('hide');
      selectedPlayerText.classList.remove('hide');
    } else {
      headerCastButton.classList.add('hide');
      selectedPlayerText.classList.add('hide');
    }
  }
  function onAppSettingsChange(e, name) {
    switch (name) {
      case 'enableRemoteControlInTVMode':
        setRemoteControlVisibility();
        break;
      case 'fontSize':
        updateFontSize();
        break;
      default:
        break;
    }
  }
  function updateHelpButton(detail) {
    var helpUrl = detail.helpUrl;
    if (helpUrl && SupportsExternalLinks) {
      headerHelpButton.href = helpUrl;
      headerHelpButton.classList.remove('hide');
    } else {
      headerHelpButton.classList.add('hide');
    }
  }
  function setSearchVisibility(viewDetail) {
    var _viewDetail$params;
    if (currentDrawerState == null) {
      return;
    }

    // todo: this should be a bit more modular than checking params.type
    if (userSignedIn && viewDetail.searchButton !== false && ((_viewDetail$params = viewDetail.params) == null ? void 0 : _viewDetail$params.type) !== 'search' && (_layoutmanager.default.tv || ![1, 2, 3].includes(currentDrawerState))) {
      headerSearchButton.classList.remove('hide');
    } else {
      headerSearchButton.classList.add('hide');
    }
  }
  function updateHomeButton(detail) {
    if (userSignedIn && detail.homeButton !== false) {
      headerHomeButton.classList.remove('hide');
    } else {
      headerHomeButton.classList.add('hide');
    }
  }
  function allowDrawer(detail) {
    if (detail.drawer === false) {
      return false;
    }
    if (!userSignedIn) {
      return false;
    }
    if (detail.hideDrawerWithOtherUserIdParam) {
      var params = detail.params;
      if (params) {
        if (params.userId && params.serverId) {
          var apiClient = _connectionmanager.default.getApiClient(params.serverId);
          if (apiClient && apiClient.getCurrentUserId() !== params.userId) {
            return false;
          }
        }
      }
    }
    return true;
  }
  function updateMenuButton(detail, drawerAllowed) {
    if (!_layoutmanager.default.tv && userSignedIn && drawerAllowed) {
      headerMenuButton.classList.remove('hide');
    } else {
      headerMenuButton.classList.add('hide');
    }
  }
  function updateBackButton(detail) {
    var backButtonConfig = detail.backButton;
    if (backButtonConfig == null && detail.headerTabs) {
      backButtonConfig = false;
    }
    if (backButtonConfig !== false && _approuter.default.canGoBack()) {
      // No need to hide the back button in tv mode because it will hide when the mouse idles anyway
      if (hasPhysicalBackButton && backButtonConfig !== true && !_layoutmanager.default.tv) {
        headerBackButton.classList.add('hide');
      } else {
        if (!supportsFullscreenMediaQueries || backButtonConfig === true || _layoutmanager.default.tv) {
          headerBackButton.classList.remove('headerBackButton-showfullscreen', 'hide');
        } else {
          headerBackButton.classList.add('headerBackButton-showfullscreen');
          headerBackButton.classList.remove('hide');
        }
      }
    } else {
      headerBackButton.classList.add('hide');
    }
  }
  function updateTitle(header, detail, view) {
    if (detail.defaultTitle) {
      header.setDefaultTitle();
      return;
    }
    var title = detail.title;
    if (title != null) {
      header.setTitle(_globalize.default.translate(title));
    }
  }
  function updateRightHeader(header, detail, view) {
    if (detail.secondaryHeaderFeatures === false) {
      headerRight.classList.add('hide');
    } else {
      headerRight.classList.remove('hide');
    }
  }
  (document.scrollingElement || document.documentElement).classList.add('noScrollY');
  function adjustHeaderForEmbeddedScroll(detail) {
    if (!_layoutmanager.default.tv && detail.adjustHeaderForEmbeddedScroll) {
      skinHeaderElement.classList.add('adjustHeaderForEmbeddedScroll');
    } else {
      skinHeaderElement.classList.remove('adjustHeaderForEmbeddedScroll');
    }
  }
  function onNavDrawerStateChange(e, drawerState) {
    currentDrawerState = drawerState;
    if (!appFooter) {
      appFooter = document.querySelector('.appfooter');
    }
    if (drawerState === 3) {
      // docked mini
      headerHomeButton.classList.add('headerHomeButton-withdockeddrawer');
      headerMenuButton.classList.add('headerMenuButton-withdockeddrawer');
      backgroundContainer.classList.add('backgroundContainer-withdockeddrawer');
      _viewmanager.default.addViewClass('page-withMiniDrawer', 'page-withDockedDrawer');
      _viewmanager.default.removeViewClass('page-withFullDrawer');
      docElem.classList.remove('withFullDrawer');
      skinHeaderElement.classList.remove('skinHeader-withfulldrawer');
      skinHeaderElement.classList.add('skinHeader-withminidrawer');
      headerLeft.classList.add('headerLeft-withdockeddrawer');
      if (appFooter) {
        appFooter.classList.add('appfooter-withMiniDrawer');
        appFooter.classList.remove('appfooter-withFullDrawer');
      }
    } else if (drawerState === 2) {
      // docked full
      headerHomeButton.classList.add('headerHomeButton-withdockeddrawer');
      headerMenuButton.classList.add('headerMenuButton-withdockeddrawer');
      backgroundContainer.classList.add('backgroundContainer-withdockeddrawer');
      docElem.classList.add('withFullDrawer');
      _viewmanager.default.addViewClass('page-withFullDrawer', 'page-withDockedDrawer');
      _viewmanager.default.removeViewClass('page-withMiniDrawer');
      skinHeaderElement.classList.add('skinHeader-withfulldrawer');
      headerLeft.classList.add('headerLeft-withdockeddrawer');
      skinHeaderElement.classList.remove('skinHeader-withminidrawer');
      if (appFooter) {
        appFooter.classList.add('appfooter-withFullDrawer');
        appFooter.classList.remove('appfooter-withMiniDrawer');
      }
    } else if (drawerState === 1) {
      // overlay
      if (_navdrawer.default.closeState === 3) {
        headerHomeButton.classList.add('headerHomeButton-withdockeddrawer');
        headerMenuButton.classList.add('headerMenuButton-withdockeddrawer');
        backgroundContainer.classList.add('backgroundContainer-withdockeddrawer');
        docElem.classList.remove('withFullDrawer');
        skinHeaderElement.classList.remove('skinHeader-withfulldrawer');
        _viewmanager.default.removeViewClass('page-withFullDrawer');
        _viewmanager.default.addViewClass('page-withMiniDrawer', 'page-withDockedDrawer');
        skinHeaderElement.classList.add('skinHeader-withminidrawer');
        headerLeft.classList.add('headerLeft-withdockeddrawer');
        if (appFooter) {
          appFooter.classList.remove('appfooter-withFullDrawer');
          appFooter.classList.add('appfooter-withMiniDrawer');
        }
      } else {
        headerHomeButton.classList.remove('headerHomeButton-withdockeddrawer');
        headerMenuButton.classList.remove('headerMenuButton-withdockeddrawer');
        backgroundContainer.classList.remove('backgroundContainer-withdockeddrawer');
        docElem.classList.remove('withFullDrawer');
        _viewmanager.default.removeViewClass('page-withMiniDrawer', 'page-withDockedDrawer', 'page-withFullDrawer');
        skinHeaderElement.classList.remove('skinHeader-withfulldrawer', 'skinHeader-withminidrawer');
        headerLeft.classList.remove('headerLeft-withdockeddrawer');
        if (appFooter) {
          appFooter.classList.remove('appfooter-withMiniDrawer', 'appfooter-withFullDrawer');
        }
      }
    } else {
      // closed
      docElem.classList.remove('withFullDrawer');
      _viewmanager.default.removeViewClass('page-withMiniDrawer', 'page-withDockedDrawer', 'page-withFullDrawer');
      skinHeaderElement.classList.remove('skinHeader-withfulldrawer', 'skinHeader-withminidrawer');
      headerLeft.classList.remove('headerLeft-withdockeddrawer');
      backgroundContainer.classList.remove('backgroundContainer-withdockeddrawer');
      headerHomeButton.classList.remove('headerHomeButton-withdockeddrawer');
      headerMenuButton.classList.remove('headerMenuButton-withdockeddrawer');
      if (appFooter) {
        appFooter.classList.remove('appfooter-withMiniDrawer', 'appfooter-withFullDrawer');
      }
    }
    var currentViewInfo = _viewmanager.default.currentViewInfo();
    if (currentViewInfo) {
      setSearchVisibility(currentViewInfo);
    }
  }
  function updateDrawerLayout(detail, drawerAllowed) {
    if (!drawerAllowed) {
      _navdrawer.default.closeState = null;
      _navdrawer.default.close();
      return;
    }
    if (_layoutmanager.default.tv) {
      _navdrawer.default.closeState = null;
      _navdrawer.default.close();
      return;
    }
    var drawerStyle = detail.settingsTheme ? 'docked' : _usersettings.default.drawerStyle();
    if (drawerStyle === 'docked' || drawerStyle === 'docked-mini') {
      if (_layoutmanager.default.tv) {
        drawerStyle = 'docked-mini';
      }
      detail.drawerInline = true;
      _navdrawer.default.open(true, drawerStyle === 'docked-mini');
    } else {
      _navdrawer.default.closeState = null;
      _navdrawer.default.close();
    }
  }
  function updateTitleMargin(instance) {
    var elem = instance.pageTitleElement;
    if (!elem) {
      return;
    }
    if (_layoutmanager.default.tv) {
      elem.classList.add('pageTitle-marginstart');
    } else {
      elem.classList.remove('pageTitle-marginstart');
    }
  }
  function onViewShow(e) {
    var _detail$params;
    currentViewEvent = e;
    var detail = e.detail;
    if (((_detail$params = detail.params) == null ? void 0 : _detail$params.asDialog) === 'true') {
      return;
    }
    if (detail.clearBackdrop) {
      _backdrop.default.clear();
    }
    var drawerAllowed = allowDrawer(detail);
    updateDrawerLayout(detail, drawerAllowed);
    updateBackButton(detail);
    updateHomeButton(detail);
    setSearchVisibility(detail);
    updateMenuButton(detail, drawerAllowed);
    updateHelpButton(detail);
    adjustHeaderForEmbeddedScroll(detail);
    updateRightHeader(this, detail, e.target);
    updateTitle(this, detail, e.target);
    updateTitleMargin(this);
    _navdrawer.default.onViewShow(e);
  }
  function clearTabs() {
    _maintabsmanager.default.setTabs(null);
  }
  function removeTransformFromHeader() {
    skinHeaderElement.style[TranslateProperty] = 'none';
  }
  function onViewBeforeShow(e) {
    var _detail$params2;
    var detail = e.detail;
    if (((_detail$params2 = detail.params) == null ? void 0 : _detail$params2.asDialog) === 'true') {
      return;
    }
    if (!detail.headerTabs) {
      clearTabs();
    }
    if (detail.headerBackground === false) {
      skinHeaderElement.classList.remove('skinHeader-withBackground');
    } else {
      skinHeaderElement.classList.add('skinHeader-withBackground');
    }
    if (!detail.adjustHeaderForEmbeddedScroll) {
      removeTransformFromHeader();
    }
    this.setTransparent(detail.transparentHeader);
  }
  function shouldShowLeftNav(e) {
    var _viewManager$currentV, _e$detail;
    if (((_viewManager$currentV = _viewmanager.default.currentViewInfo()) == null ? void 0 : _viewManager$currentV.drawer) === false) {
      return false;
    }
    if ((_e$detail = e.detail) != null && (_e$detail = _e$detail.originalEvent) != null && _e$detail.repeat) {
      return false;
    }
    return true;
  }
  function onHeaderCommand(e) {
    switch (e.detail.command) {
      case 'moveleftedge':
        if (document.dir !== 'rtl' && shouldShowLeftNav(e)) {
          _navdrawer.default.openIfClosed();
          e.preventDefault();
        }
        break;
      case 'moverightedge':
        if (document.dir === 'rtl' && shouldShowLeftNav(e)) {
          _navdrawer.default.openIfClosed();
          e.preventDefault();
        }
        break;
      default:
        break;
    }
  }
  var boundLayoutModeChangeFn;
  function bindEvents(instance) {
    var parent = instance.element;
    headerBackButton = parent.querySelector('.headerBackButton');
    headerHomeButton = parent.querySelector('.headerHomeButton');
    headerMenuButton = parent.querySelector('.headerMenuButton');
    headerCastButton = parent.querySelector('.headerCastButton');
    headerHelpButton = parent.querySelector('.headerHelpButton');
    headerSearchButton = parent.querySelector('.headerSearchButton');
    selectedPlayerText = parent.querySelector('.headerSelectedPlayer');
    headerRight = parent.querySelector('.headerRight');
    headerBackButton.addEventListener('click', onBackClick);
    headerHomeButton.addEventListener('click', onHomeClick);
    headerSearchButton.addEventListener('click', onSearchClick);
    headerCastButton.addEventListener('click', onCastButtonClick);
    parent.querySelector('.headerUserButton').addEventListener('click', onUserButtonClick);
    parent.querySelector('.headerSettingsButton').addEventListener('click', onSettingsButtonClick);
    headerMenuButton.addEventListener('click', onHeaderMenuButtonClick);
    boundLayoutModeChangeFn = onLayoutModeChange.bind(instance);
    _events.default.on(_layoutmanager.default, 'modechange', boundLayoutModeChangeFn);
    _events.default.on(_playbackmanager.default, 'playerchange', updateCastIcon);
    _events.default.on(_playbackmanager.default, 'playqueuestart', onNewPlayQueueStart);
    _events.default.on(_connectionmanager.default, 'localusersignedin', onLocalUserSignedIn);
    _events.default.on(_connectionmanager.default, 'localusersignedout', onLocalUserSignedOut);
    _events.default.on(_api.default, 'UserUpdated', onUserUpdated);
    document.addEventListener('viewbeforeshow', onViewBeforeShow.bind(instance));
    document.addEventListener('viewshow', onViewShow.bind(instance));
    _inputmanager.default.on(skinHeaderElement, onHeaderCommand);
    instance.pageTitleElement = parent.querySelector('.pageTitle');
    resetPremiereButton();
    _events.default.on(_connectionmanager.default, 'resetregistrationinfo', resetPremiereButton);
    _events.default.on(_appsettings.default, 'change', onAppSettingsChange);
  }
  function unbindEvents(instance) {
    var parent = instance.element;
    if (parent) {
      parent.querySelector('.headerBackButton').removeEventListener('click', onBackClick);
      parent.querySelector('.headerHomeButton').removeEventListener('click', onHomeClick);
      parent.querySelector('.headerSearchButton').removeEventListener('click', onSearchClick);
      parent.querySelector('.headerCastButton').removeEventListener('click', onCastButtonClick);
      parent.querySelector('.headerUserButton').removeEventListener('click', onUserButtonClick);
      parent.querySelector('.headerSettingsButton').removeEventListener('click', onSettingsButtonClick);
      parent.querySelector('.headerMenuButton').removeEventListener('click', onHeaderMenuButtonClick);
    }
    _events.default.off(_layoutmanager.default, 'modechange', boundLayoutModeChangeFn);
    _events.default.off(_playbackmanager.default, 'playerchange', updateCastIcon);
    _events.default.off(_playbackmanager.default, 'playqueuestart', onNewPlayQueueStart);
    _events.default.off(_connectionmanager.default, 'localusersignedin', onLocalUserSignedIn);
    _events.default.off(_connectionmanager.default, 'localusersignedout', onLocalUserSignedOut);
    _events.default.off(_api.default, 'UserUpdated', onUserUpdated);
    _events.default.off(_connectionmanager.default, 'resetregistrationinfo', resetPremiereButton);
    document.removeEventListener('viewbeforeshow', onViewBeforeShow);
    document.removeEventListener('viewshow', onViewShow);
  }
  function onDynamicTitleFromNavDrawer(e, title) {
    this.setTitle(title);
  }
  function render(instance) {
    instance.element = skinHeaderElement;
    addHeaderLeftContent();
    addHeaderRightContent();
    bindEvents(instance);
    setRemoteControlVisibility();
    onLayoutModeChange.call(instance);
    _events.default.on(_navdrawer.default, 'drawer-state-change', onNavDrawerStateChange);
    _events.default.on(_navdrawercontent.default, 'dynamic-title', onDynamicTitleFromNavDrawer.bind(instance));
  }
  function addHeaderLeftContent() {
    headerLeft = skinHeaderElement.querySelector('.headerLeft');
    var Menu = _globalize.default.translate('Menu');
    var Home = _globalize.default.translate('Home');
    var Back = _globalize.default.translate('Back');
    var Help = _globalize.default.translate('Help');
    headerLeft.innerHTML = "\n            <button type=\"button\" is=\"paper-icon-button-light\" class=\"headerBackButton headerButton headerSectionItem hide-mouse-idle-tv hide\" tabindex=\"-1\" title=\"" + Back + "\" aria-label=\"" + Back + "\">\n                <i class=\"md-icon autortl\">&#xe2ea;</i>\n            </button>\n            <button type=\"button\" is=\"paper-icon-button-light\" class=\"headerHomeButton headerButton headerSectionItem hide-mouse-idle-tv hide md-icon md-icon-fill\" tabindex=\"-1\" title=\"" + Home + "\" aria-label=\"" + Home + "\">\n                &#xe88a;\n            </button>\n            <button type=\"button\" is=\"paper-icon-button-light\" class=\"headerMenuButton headerButton headerSectionItem hide md-icon\" title=\"" + Menu + "\" aria-label=\"" + Menu + "\">\n                &#xe5D2;\n            </button>\n            <h2 class=\"pageTitle headerSectionItem\">&nbsp;</h2>\n\n            <a type=\"button\" is=\"emby-linkbutton\" class=\"paper-icon-button-light headerHelpButton dialogHeaderButton button-help headerButton headerSectionItem hide secondaryText\" title=\"" + Help + "\" aria-label=\"" + Help + "\" target=\"_blank\" href=\"#\">\n                <i class=\"md-icon autortl-arabic\">&#xe887;</i>\n            </a>\n        ";
  }
  function addHeaderRightContent() {
    var ManageEmbyServer = _globalize.default.translate('ManageEmbyServer');
    var Settings = _globalize.default.translate('Settings');
    var Search = _globalize.default.translate('Search');
    var PlayOnAnotherDevice = _globalize.default.translate('PlayOnAnotherDevice');
    skinHeaderElement.querySelector('.headerRight').innerHTML = "\n            <div class=\"headerSelectedPlayer headerSectionItem hide\">\n\n            </div>\n            <button type=\"button\" is=\"paper-icon-button-light\" class=\"headerCastButton headerButton hide headerSectionItem md-icon hide\" title=\"" + PlayOnAnotherDevice + "\" aria-label=\"" + PlayOnAnotherDevice + "\">\n                &#xe307;\n            </button>\n            <button type=\"button\" is=\"paper-icon-button-light\" class=\"headerSearchButton headerButton hide headerSectionItem md-icon hide\" title=\"" + Search + "\" aria-label=\"" + Search + "\">\n                &#xe8B6;\n            </button>\n            <button type=\"button\" is=\"paper-icon-button-light\" class=\"headerUserButton headerButton headerSectionItem hide\" title=\"" + Settings + "\" aria-label=\"" + Settings + "\">\n                <i class=\"md-icon largeIcon\">&#xe7FD;</i>\n            </button>\n            <button type=\"button\" is=\"paper-icon-button-light\" class=\"headerSettingsButton headerButton headerSectionItem md-icon hide\" title=\"" + ManageEmbyServer + "\" aria-label=\"" + ManageEmbyServer + "\">\n                &#xe8B8;\n            </button>\n            <div class=\"headerClock headerSectionItem hide\"></div>\n        ";
  }
  function AppHeader() {}
  AppHeader.prototype.init = function () {
    return render(this);
  };
  AppHeader.prototype.stopClockInterval = function () {
    var interval = this.clockInterval;
    if (interval) {
      interval.destroy();
      this.clockInterval = null;
    }
  };
  AppHeader.prototype.startClockInterval = function () {
    this.clockInterval = new _methodtimer.default({
      onInterval: updateClock.bind(this),
      timeoutMs: 50000,
      type: 'interval'
    });
  };
  AppHeader.prototype.loadClock = function () {
    if (!_layoutmanager.default.tv) {
      this.destroyClock();
      return;
    }
    var elem = document.querySelector('.headerClock');
    elem.classList.remove('hide');
    this.clockElement = elem;
    this.stopClockInterval();
    this.startClockInterval();
    updateClock.call(this);
  };
  var defaultDocumentTitle = document.title || 'Emby';
  function getDefaultDocumentTitle() {
    return defaultDocumentTitle;
  }
  AppHeader.prototype.setDefaultTitle = function () {
    var pageTitleElement = this.pageTitleElement;
    if (pageTitleElement) {
      pageTitleElement.classList.add('pageTitleWithLogo', 'pageTitleWithDefaultLogo');
      pageTitleElement.style.backgroundImage = null;
      pageTitleElement.innerHTML = '';
    }
    document.title = getDefaultDocumentTitle();
  };
  function getTitleHtml(title) {
    if (!title) {
      return '';
    }
    if (typeof title === 'string') {
      return _textencoding.default.htmlEncode(title);
    }
    var item = title;
    title = item.Name || '';
    return _textencoding.default.htmlEncode(title);
  }
  AppHeader.prototype.setTitle = function (title, documentTitle) {
    if (title == null) {
      this.setDefaultTitle();
      return;
    }

    // hack alert
    if (title === '-') {
      title = '';
    }
    var html = getTitleHtml(title);
    var pageTitleElement = this.pageTitleElement;
    if (pageTitleElement) {
      pageTitleElement.classList.remove('pageTitleWithLogo', 'pageTitleWithDefaultLogo');
      pageTitleElement.style.backgroundImage = null;
      pageTitleElement.innerHTML = html || '';
    }
    if (!title) {
      document.title = documentTitle || getDefaultDocumentTitle();
    } else if (typeof title === 'string') {
      document.title = documentTitle || title;
    } else {
      document.title = documentTitle || title.Name || getDefaultDocumentTitle();
    }
  };
  AppHeader.prototype.setLogoTitle = function (options) {
    var url = options.url;
    if (!url) {
      var items = options.items;
      for (var i = 0, length = items.length; i < length; i++) {
        var item = items[i];
        url = _connectionmanager.default.getApiClient(item).getLogoImageUrl(item, {
          maxHeight: _appheadercontent.default.getHeight() || 100
        }, options.preferredLogoImageTypes);
        if (url) {
          break;
        }
      }
    }
    if (url) {
      document.title = options.titleText || getDefaultDocumentTitle();
      var pageTitleElement = this.pageTitleElement;
      pageTitleElement.style.backgroundImage = "url('" + url + "')";
      pageTitleElement.classList.add('pageTitleWithLogo');
      pageTitleElement.classList.remove('pageTitleWithDefaultLogo');
      pageTitleElement.innerHTML = '';
    } else {
      this.setTitle(options.titleText);
    }
  };
  AppHeader.prototype.setTransparent = function (transparent) {
    if (transparent) {
      skinHeaderElement.classList.add('semiTransparent', 'darkContentContainer');
    } else {
      skinHeaderElement.classList.remove('semiTransparent', 'darkContentContainer');
    }
  };
  AppHeader.prototype.hasFocus = function () {
    var activeElement = document.activeElement;
    if (activeElement) {
      return this.element.contains(activeElement);
    }
    return false;
  };
  AppHeader.prototype.ensureVisible = function () {
    removeTransformFromHeader();
  };
  AppHeader.prototype.destroyClock = function () {
    this.stopClockInterval();
    var elem = this.clockElement;
    if (elem) {
      elem.classList.add('hide');
    }
    this.clockElement = null;
  };
  AppHeader.prototype.destroy = function () {
    var self = this;
    this.destroyClock();
    unbindEvents(this);
    self.element = null;
  };
  var _default = _exports.default = new AppHeader();
});
