define(["exports", "./emby-apiclient/events.js", "./emby-apiclient/connectionmanager.js", "./common/globalize.js", "./common/pluginmanager.js", "./common/querystring.js", "./layoutmanager.js", "./skinmanager.js", "./loading/loading.js", "./common/servicelocator.js", "./common/textencoding.js", "./common/appsettings.js", "./viewmanager/viewmanager.js", "./backdrop/backdrop.js", "./pagejs/page.js", "./emby-apiclient/apiclient.js", "./common/baseapprouter.js"], function (_exports, _events, _connectionmanager, _globalize, _pluginmanager, _querystring, _layoutmanager, _skinmanager, _loading, _servicelocator, _textencoding, _appsettings, _viewmanager, _backdrop, _page, _apiclient, _baseapprouter) {
  Object.defineProperty(_exports, "__esModule", {
    value: true
  });
  _exports.default = void 0;
  /* jshint module: true */

  function showAlert(options) {
    return Emby.importModule('./modules/common/dialogs/alert.js').then(function (alert) {
      return alert(options);
    });
  }
  function loadPlaybackManager() {
    return Emby.importModule('./modules/common/playback/playbackmanager.js');
  }
  function showAlertAndResolve(options) {
    return showAlert(options).catch(function () {
      return Promise.resolve();
    });
  }
  function loadDialogHelper() {
    return Emby.importModule('./modules/dialoghelper/dialoghelper.js');
  }
  function loadAppHeader() {
    return Emby.importModule('./modules/appheader/appheader.js');
  }
  function AppRouter() {
    _baseapprouter.default.apply(this, arguments);
  }
  Object.assign(AppRouter.prototype, _baseapprouter.default.prototype);
  AppRouter.prototype.showProfilePinPrompt = function (options) {
    return Emby.importModule('./modules/profilepinprompt/profilepinprompt.js').then(function (PinPrompt) {
      return new PinPrompt().show(options);
    });
  };
  var AllowSessionStorageUsage = _servicelocator.appHost.supports('sessionstorage');
  AppRouter.prototype.setPinValidated = function (userId) {
    _baseapprouter.default.prototype.setPinValidated.apply(this, arguments);
    if (AllowSessionStorageUsage && typeof sessionStorage !== 'undefined') {
      try {
        if (userId) {
          // eslint-disable-next-line
          sessionStorage.setItem('pinvalidated', userId);
        } else {
          // eslint-disable-next-line
          sessionStorage.removeItem('pinvalidated');
        }
      } catch (err) {
        console.log('error setting sessionStorage');
      }
    }
  };
  AppRouter.prototype.isPinValidated = function (userId) {
    if (AllowSessionStorageUsage && typeof sessionStorage !== 'undefined') {
      try {
        // eslint-disable-next-line
        return sessionStorage.getItem('pinvalidated') === userId;
      } catch (err) {
        console.log('error accessing sessionStorage');
      }
    }
    return _baseapprouter.default.prototype.isPinValidated.apply(this, arguments);
  };
  function getServerLoginRouteUrl(options) {
    if (options.loginType === 'manual' || options.username) {
      var params = {
        serverId: options.apiClient.serverId()
      };
      var url = '/startup/manuallogin.html?';
      if (options.username) {
        params.user = options.username;
      }
      url += _querystring.default.paramsToString(params);
      return url;
    }
    if (options.loginType === 'visual') {
      return '/startup/login.html?serverId=' + options.apiClient.serverId();
    }
  }
  AppRouter.prototype.showServerLogin = function (options) {
    if (options.loginType || options.username) {
      return show(getServerLoginRouteUrl(options));
    }
    return _baseapprouter.default.prototype.showServerLogin.apply(this, arguments);
  };
  Object.assign(AppRouter.prototype, {
    showSelectServer: function () {
      return show(getRouteUrl('selectserver'));
    },
    showWelcome: function () {
      if (_servicelocator.appHost.supports('multiserver')) {
        return show('/startup/welcome.html');
      } else {
        return show('/startup/login.html?serverId=' + _connectionmanager.default.currentApiClient().serverId());
      }
    },
    showConnectLogin: function () {
      return show(getRouteUrl('connectlogin'));
    },
    showSettings: function (options) {
      return show(getRouteUrl('settings', Object.assign({
        serverId: _connectionmanager.default.currentApiClient().serverId()
      }, options || {})));
    },
    showUserMenu: function (options) {
      return Emby.importModule('./modules/backmenu/backmenu.js').then(function (backMenu) {
        return backMenu(options);
      });
    },
    showSearch: function () {
      return show(getRouteUrl('search'));
    },
    showGuide: function () {
      return show(this.getRouteUrl('livetv', {
        serverId: _connectionmanager.default.currentApiClient().serverId(),
        section: 'guide'
      }));
    },
    showLiveTV: function () {
      return show(this.getRouteUrl('livetv', {
        serverId: _connectionmanager.default.currentApiClient().serverId()
      }));
    },
    showRecordedTV: function () {
      return show(this.getRouteUrl('recordedtv', {
        serverId: _connectionmanager.default.currentApiClient().serverId()
      }));
    },
    showFavorites: function () {
      return show(getHomeRoute() + '&tab=favorites');
    },
    showNowPlaying: function () {
      return showVideoOsd();
    }
  });
  AppRouter.prototype.beginConnectionWizard = function () {
    _backdrop.default.clear();
    _loading.default.show();
    var instance = this;
    if (!_servicelocator.appHost.supports('multiserver')) {
      return this.showServerLogin({
        apiClient: _connectionmanager.default.currentApiClient()
      });
    }
    return _connectionmanager.default.connect({}).then(function (result) {
      return instance.handleConnectionResult(result, {
        allowWelcome: true
      });
    });
  };
  AppRouter.prototype.logout = function (apiClient) {
    var instance = this;
    loadPlaybackManager().then(function (playbackManager) {
      _loading.default.show();
      playbackManager.stop();
      _connectionmanager.default.logout(apiClient).then(instance.beginConnectionWizard.bind(instance));
    });
  };
  function addressFormatToHtml(address) {
    return '<a is="emby-linkbutton" class="button-link" href="' + address + '" target="_blank">' + _textencoding.default.htmlEncode(address) + '</a>';
  }
  function addressFormatToText(address) {
    return _textencoding.default.htmlEncode(address);
  }
  function showWebAppConnectionError(server, addresses) {
    var html = [];
    html.push('<p style="margin-top:0;">' + _globalize.default.translate("MessageUnableToConnectToServer") + '</p>');
    var currentProtocol = (window.location.protocol || '').toLowerCase();
    switch (currentProtocol) {
      case 'https:':
        //default:
        if (!containsSecureContext(addresses)) {
          var addressHtml = '<p>' + _globalize.default.translate('IfTryingToConnectToHttp') + '</p>';
          addressHtml += '<ul>';
          var supportsLinks = _servicelocator.appHost.supports('externallinks') && _servicelocator.appHost.supports('targetblank');
          var addressesDisplay = (supportsLinks ? addresses.map(addressFormatToHtml) : addresses.map(addressFormatToText)).join(' or ');
          addressHtml += '<li>Use the web app built into your Emby Server at ' + addressesDisplay + ', depending on your current location.</li>';
          if (supportsLinks) {
            addressHtml += '<li>' + _globalize.default.translate('SetupHttpsForYourServer', '<a is="emby-linkbutton" class="button-link" href="https://emby.media/community/index.php?/topic/81404-ssl-made-easy" target="_blank">', '</a>') + '</li>';
            addressHtml += '<li>Use the HTTP version of this app at <a is="emby-linkbutton" class="button-link" href="http://app.emby.media" target="_blank">http://app.emby.media</a> instead.</li>';
          } else {
            addressHtml += '<li>' + _globalize.default.translate('SetupHttpsForYourServer', '', '') + '</li>';
            addressHtml += '<li>Use the HTTP versionof this app at http://app.emby.media instead.</li>';
          }
          addressHtml += '<li>Use an installed Emby app such as Emby for Windows, Android, Apple, Amazon, Samsung, LG, etc.</li>';
          addressHtml += '</ul>';
          html.push(addressHtml);
        } else {
          return null;
        }
        break;
      default:
        return null;
    }
    return showAlertAndResolve({
      html: html.join(''),
      title: server.Name ? _globalize.default.translate("TitleUnableToReachName", _textencoding.default.htmlEncode(server.Name)) : _globalize.default.translate("TitleUnableToReachServer"),
      centerText: false
    });
  }
  function getServerAddressesFromResult(result) {
    var list = [];
    if (result.Address) {
      list.push(result.Address);
      return list;
    }
    var server = result.Server || {};
    if (server) {
      if (server.ManualAddress && !list.includes(server.ManualAddress)) {
        list.push(server.ManualAddress);
      }
      if (server.LocalAddress && !list.includes(server.LocalAddress)) {
        list.push(server.LocalAddress);
      }
      if (server.RemoteAddress && !list.includes(server.RemoteAddress)) {
        list.push(server.RemoteAddress);
      }
    }
    return list;
  }
  function containsSecureContext(addresses) {
    for (var i = 0, length = addresses.length; i < length; i++) {
      var lower = addresses[i].toLowerCase();
      if (lower.includes('localhost')) {
        return true;
      }
      if (lower.includes('127.0.0.1')) {
        return true;
      }
      if (lower.startsWith('https:')) {
        return true;
      }
    }
    return false;
  }
  AppRouter.prototype.showConnectionErrorAlert = function (result, options) {
    if (_servicelocator.appHost.supports('rejectinsecureaddresses')) {
      var addresses = getServerAddressesFromResult(result);
      if (addresses.length > 0) {
        // this will return null when it wants to just revert to the base class error message
        var server = result.Server || {};
        var promise = showWebAppConnectionError(server, addresses);
        if (promise) {
          return promise;
        }
      }
    }
    return _baseapprouter.default.prototype.showConnectionErrorAlert.apply(this, arguments);
  };
  AppRouter.prototype.handleSignedInResult = function (result, options) {
    switch (result.State) {
      case 'SignedIn':
        {
          _loading.default.hide();
          // in case the user changed (changeToUser method)
          _viewmanager.default.disableRestoreOnCurrentViews();
          loadUserSkinAfterSignIn(result, options);
        }
        break;
      case 'ServerSignIn':
        {
          this.showServerLogin({
            apiClient: result.ApiClient
          });
        }
        break;
      default:
        break;
    }
  };
  AppRouter.prototype.isDisplayingAuthenticatedContent = function () {
    return true;
  };
  var firstConnectionResult;
  AppRouter.prototype.start = function () {
    _baseapprouter.default.prototype.start.apply(this, arguments);
    _loading.default.show();
    _events.default.on(_servicelocator.appHost, 'beforeexit', onBeforeExit);
    var promises = [];
    promises.push(_connectionmanager.default.connect({}));
    promises.push(_skinmanager.default.loadSkin());
    return Promise.all(promises).then(function (responses) {
      firstConnectionResult = responses[0];
      _loading.default.hide();
      _page.default.handleRoute = handleRoute;
      (0, _page.default)();
    });
  };
  var appRouter = new AppRouter();
  function loadUserSkin(options) {
    return _skinmanager.default.loadSkin().then(function () {
      if (!options) {
        options = {};
      }
      if (options.start) {
        appRouter.invokeShortcut(options.start);
      } else if (options.navigate !== false) {
        appRouter.goHome();
      }
    });
  }
  function loadUserSkinAfterSignIn(result, options) {
    if (!options) {
      options = {};
    }
    return loadUserSkin({
      navigate: options.route == null
    }).then(function () {
      if (options.route) {
        return handleRoute(options.ctx, options.route);
      }
    });
  }
  function loadContentUrl(ctx, request, signal) {
    var url;
    var rawQueryString = ctx.rawQueryString;
    if (request.contentPath && typeof request.contentPath === 'function') {
      url = request.contentPath(rawQueryString);
    } else {
      url = request.contentPath || request.path;
    }
    if (!url.includes('://')) {
      // Put a slash at the beginning but make sure to avoid a double slash
      if (!url.startsWith('/')) {
        url = '/' + url;
      }
      url = baseUrl() + url;
    }
    if (rawQueryString && request.enableContentQueryString) {
      url += '?' + rawQueryString;
    }
    var promises = [require(['text!' + url])];
    request.isPluginPage = request.url.toLowerCase().includes('/configurationpage');
    if (request.isPluginPage) {
      promises.push(_pluginmanager.default.loadServerPluginPageTranslations(_connectionmanager.default.currentApiClient(), request.params.name));
    }
    return Promise.all(promises).then(function (responses) {
      var html = responses[0][0];
      request.view = _globalize.default.translateDocument(html);
      return _viewmanager.default.loadView(request, signal);
    });
  }
  function getController(route) {
    if (route.controllerType === 'module') {
      var url = route.controller;
      if (!url.includes('://')) {
        url = './' + url;
      }
      return Emby.importModule(url);
    }
    return require([route.controller]).then(function (deps) {
      return deps[0];
    });
  }
  function getControllerFactory(route) {
    if (route.controller) {
      return getController(route);
    } else {
      return Promise.resolve();
    }
  }
  function tryRestoreView(ctx, currentRequest, signal) {
    return _viewmanager.default.tryRestoreView(currentRequest, signal).catch(function (result) {
      signal == null || signal.throwIfAborted();
      return loadContentUrl(ctx, currentRequest, signal);
    });
  }
  function initRoute(ctx, route, signal) {
    var currentRequest = Object.assign({}, route);
    var navigationType = ctx.navigationType;
    _events.default.trigger(appRouter, 'initrouterequest', [currentRequest]);
    return getControllerFactory(currentRequest).then(function (controllerFactory) {
      var params = ctx.params;
      var path = ctx.path;
      console.log('appRouter.sendRouteToViewManager - processing path: ' + path + ' navigationType: ' + navigationType);
      currentRequest.url = baseUrl() + path;
      currentRequest.controllerFactory = controllerFactory;
      currentRequest.state = ctx.state;
      currentRequest.isBack = ctx.isBack;
      currentRequest.navigationType = navigationType;
      currentRequest.abortController = new AbortController();
      currentRequest.contextPath = path;
      currentRequest.params = params;
      var requestSignal = currentRequest.abortController.signal;
      if (signal) {
        if (requestSignal) {
          signal = AbortSignal.any([signal, requestSignal]);
        }
      } else {
        signal = requestSignal;
      }
      if (navigationType !== 'traverse') {
        return loadContentUrl(ctx, currentRequest, signal);
      }
      return tryRestoreView(ctx, currentRequest, signal);
    });
  }
  function onBeforeExit(e) {
    if (globalThis.appMode === 'webos') {
      _page.default.restorePreviousState();
    }
  }
  var connectionType;
  function onNetworkChanged() {
    var newConnectionType = navigator.connection.type;
    if (newConnectionType !== connectionType) {
      connectionType = newConnectionType;
      _connectionmanager.default.onNetworkChanged();
    }
  }
  if (navigator.connection) {
    connectionType = navigator.connection.type;
    if (_servicelocator.appHost.supports('multiserver') && navigator.connection.addEventListener) {
      navigator.connection.addEventListener('change', onNetworkChanged);
    }
  }
  function isRouteForDownloadedContent(params) {
    var _params$parentId, _params$id;
    return params.parentId === 'downloads' || ((_params$parentId = params.parentId) == null ? void 0 : _params$parentId.startsWith('local')) || ((_params$id = params.id) == null ? void 0 : _params$id.startsWith('local'));
  }
  function handleRoute(ctx, route, signal) {
    var firstResult = firstConnectionResult;
    if (firstResult) {
      firstConnectionResult = null;
      if (!route.anonymous) {
        appRouter.handleConnectionResult(firstResult, {
          allowWelcome: true,
          route: route,
          ctx: ctx,
          enableProfilePin: true
        });
        return Promise.resolve();
      }
    }
    var apiClient = _connectionmanager.default.currentApiClient();
    var pathname = ctx.pathname.toLowerCase();
    var isBack = ctx.isBack;
    var navigationType = ctx.navigationType;
    var params = ctx.params;
    console.log('appRouter - processing path: ' + pathname + ', navigationType: ' + navigationType);
    var currentRouteInfo = getCurrentRouteInfo();
    var isCurrentRouteStartup = currentRouteInfo ? currentRouteInfo.startup : true;
    var shouldExitApp = isBack && route.isDefaultRoute && isCurrentRouteStartup;
    if (shouldExitApp) {
      if (_servicelocator.appHost.supports('exit')) {
        console.log('exiting app - shouldExitApp is true');
        _servicelocator.appHost.exit();
        return Promise.resolve();
      }
      return Promise.resolve();
    }
    var isLoggedIn = apiClient == null ? void 0 : apiClient.isLoggedIn();

    // these are some workarounds for offline access. not ideal but it will hold us for now until we can rework the startup sequence
    if (!isLoggedIn && !route.anonymous && isRouteForDownloadedContent(params)) {
      console.log('appRouter - route does not allow anonymous access, redirecting to login');
      appRouter.beginConnectionWizard();
      return Promise.resolve();
    }
    if (isLoggedIn) {
      console.log('appRouter - user is authenticated');
      if (isBack && (route.isDefaultRoute || route.startup) && !isCurrentRouteStartup) {
        if (route.startup && isRouteForDownloadedContent((currentRouteInfo == null ? void 0 : currentRouteInfo.params) || {})) {
          console.log('appRouter - proceeding to ' + pathname + ' (for downloaded content)');
          return initRoute(ctx, route);
        }
        handleBackToDefault();
        return Promise.resolve();
      } else if (route.isDefaultRoute && !params.appstart) {
        console.log('appRouter - loading skin home page');
        loadUserSkin();
        return Promise.resolve();
      } else if (!(route.isDefaultRoute && !params.appstart || route.anonymous)) {
        return validateAccessToRoute(apiClient, route).then(function () {
          return initRouteAfterPin(ctx, route, apiClient, signal);
        }, appRouter.beginConnectionWizard.bind(appRouter));
      }
    }
    console.log('appRouter - proceeding to ' + pathname);
    return initRoute(ctx, route, signal);
  }
  function initRouteAfterPin(ctx, route, apiClient, signal) {
    return appRouter.promptForProfilePin(apiClient, apiClient.getCurrentUserId()).then(function () {
      var params = ctx.params;
      if (params != null && params.appstart) {
        return goHome().then(function () {
          return appRouter.invokeShortcut(params.appstart);
        });
      }
      return initRoute(ctx, route, signal);
    }, function (err) {
      // so that the url will get changed back
      _viewmanager.default.disableRestoreOnCurrentViews();
      var errorName = ((err == null ? void 0 : err.name) || '').toLowerCase();
      switch (errorName) {
        case 'forgotpin':
          return appRouter.forgotPin({
            apiClient: apiClient,
            userId: apiClient.getCurrentUserId()
          });
        case 'changeuser':
          return appRouter.showServerLogin({
            apiClient: apiClient
          });
        default:
          // the forgot pin dialog was cancelled
          return appRouter.showServerLogin({
            apiClient: apiClient,
            userId: apiClient.getCurrentUserId()
          });
      }
    });
  }
  function validateAccessToRoute(apiClient, route) {
    if (!route.roles) {
      return Promise.resolve();
    }
    return apiClient.getCurrentUser().then(function (user) {
      return validateUserAccessToRoute(route, user);
    });
  }
  function validateUserAccessToRoute(route, user, loggedInUser) {
    var roles = (route.roles || '').split(',');
    if (roles.includes('admin') && !user.Policy.IsAdministrator) {
      return false;
    }
    if (roles.includes('EnableUserPreferenceAccess') && !user.Policy.EnableUserPreferenceAccess) {
      if (!loggedInUser || !loggedInUser.Policy.IsAdministrator) {
        return false;
      }
    }
    return true;
  }
  function handleBackToDefault() {
    console.log('handleBackToDefault');
    if (!_servicelocator.appHost.supports('exit')) {
      loadUserSkin();
      return;
    }

    // This must result in a call to either
    // loadUserSkin();
    // Logout
    // Or exit app

    showBackMenuInternal({});
  }
  function showBackMenuInternal(options) {
    var currentThemeController = _skinmanager.default.getCurrentThemeController();
    if (currentThemeController != null && currentThemeController.showBackMenu) {
      return currentThemeController.showBackMenu();
    }
    if (_servicelocator.appHost.supports('exit')) {
      var backBehavior = _appsettings.default.backBehaviorOnHome();
      if (backBehavior === 'none' || !_layoutmanager.default.tv && 'ontouchstart' in document.documentElement) {
        _servicelocator.appHost.exit();
        return;
      }
      if (backBehavior === 'exit') {
        return _servicelocator.appHost.exitWithOptionalMenu();
      }
    }
    return Emby.importModule('./modules/navdrawer/navdrawer.js').then(function (navdrawer) {
      return navdrawer.openIfClosed({
        exitAppOnBack: _layoutmanager.default.tv ? true : false
      });
    });
  }
  function getRequestFile() {
    console.log('router globalThis.location.pathname: ' + globalThis.location.pathname);
    var path = globalThis.location.pathname || '';
    var index = path.lastIndexOf('/');
    if (index !== -1) {
      path = path.substring(index);
    } else {
      path = '/' + path;
    }
    if (!path || path === '/') {
      path = '/index.html';
    }
    console.log('router getRequestFile() result: ' + path);
    return path;
  }
  console.log('router href: ' + globalThis.location.href);
  var baseRoute = globalThis.location.href.split('?')[0].replace(getRequestFile(), '');
  // support hashbang
  baseRoute = baseRoute.split('#')[0];
  if (baseRoute.endsWith('/') && !baseRoute.endsWith('://')) {
    baseRoute = baseRoute.substring(0, baseRoute.length - 1);
  }
  console.log('router baseUrl: ' + baseRoute);
  function baseUrl() {
    return baseRoute;
  }
  function back() {
    //console.log('approuter.back: ' + new Error().stack);
    _page.default.back();
  }
  function forward() {
    //console.log('approuter.forward: ' + new Error().stack);
    _page.default.forward();
  }
  function canGoBack() {
    var curr = getCurrentRouteInfo();
    if (!curr) {
      return false;
    }
    if (curr.type === 'home') {
      return false;
    }
    return _page.default.canGoBack();
  }
  function show(path, options) {
    if (!path.startsWith('/') && !path.includes('://')) {
      path = '/' + path;
    }
    var baseRoute = baseUrl();
    path = path.replace(baseRoute, '');
    if (path.includes('asDialog=true')) {
      var ctx = _page.default.createContext(path);
      _page.default.dispatch(ctx);
      return Promise.resolve();
    }
    var currentRouteInfo = getCurrentRouteInfo();
    if (currentRouteInfo && currentRouteInfo.contextPath === path && _viewmanager.default.canRestoreCurrentView()) {
      _loading.default.hide();
      return Promise.resolve();
    }

    //console.log('page.show: ' + path + ' ' + new Error().stack);

    return _page.default.show(path, options);
  }
  _viewmanager.default.onBeforeHide = function (e) {
    var _e$detail, _newViewInfo$params;
    var newViewInfo = (_e$detail = e.detail) == null ? void 0 : _e$detail.newViewInfo;
    if ((newViewInfo == null || (_newViewInfo$params = newViewInfo.params) == null ? void 0 : _newViewInfo$params.asDialog) !== 'true') {
      _events.default.trigger(appRouter, 'navigate');
    }
  };
  function getCurrentRouteInfo() {
    return _viewmanager.default.currentViewInfo();
  }
  function currentViewPath() {
    var _viewManager$currentV;
    return (_viewManager$currentV = _viewmanager.default.currentViewInfo()) == null ? void 0 : _viewManager$currentV.path;
  }
  function getHomeRoute() {
    return '/home';
  }
  function goHome() {
    return show(getHomeRoute());
  }
  function getRouteInfo(url) {
    return _page.default.getRoute(url);
  }
  function addParamToUrl(url, name, value) {
    if (url.indexOf('?') === -1) {
      return url + '?' + name + '=' + value;
    }
    return url + '&' + name + '=' + value;
  }
  function getItemUrl(options, originalOptions) {
    if (originalOptions != null && originalOptions.asDialog) {
      options.asDialog = true;
    }
    var urlSearchParams = new URLSearchParams(options);

    // avoid a null on the query string
    if (!options.context) {
      urlSearchParams.delete('context');
    }
    var query = urlSearchParams.toString();
    var url = '/item';
    if (query) {
      url += '?' + query;
    }
    return url;
  }
  function getRouteUrl(item, options) {
    var _options;
    if (item.url) {
      return item.url;
    }
    if (!options) {
      options = {};
    }
    var context = (_options = options) == null ? void 0 : _options.context;

    // Handle search hints
    var id = item.Id || item.ItemId;
    var serverId = item.ServerId || options.serverId;
    if (item === 'home') {
      return getHomeRoute();
    }
    if (item === 'search') {
      if (!_layoutmanager.default.tv) {
        return '/list/list.html?type=search';
      }
      return '/search';
    }
    if (item === 'connectlogin') {
      return '/startup/connectlogin.html';
    }
    if (item === 'selectserver') {
      return '/startup/selectserver.html';
    }
    if (item === 'settings') {
      var url = '/settings';
      if (serverId) {
        var _options2;
        url += '?serverId=' + serverId;
        if ((_options2 = options) != null && _options2.start) {
          return url += '&start=' + options.start;
        }
      }
      return url;
    }
    if (item === 'wizard') {
      return '/wizardstart.html';
    }
    if (item === 'downloads') {
      return '/list/list.html?parentId=downloads';
    }
    if (item === 'downloadsettings') {
      return '/settings/download';
    }
    if (item === 'premiere') {
      return '/embypremiere';
    }
    if (item === 'managedownloads') {
      return '/settings/download?tab=managedownloads';
    }
    if (item === 'manageserver') {
      return '/dashboard';
    }
    if (item === 'recordedtv') {
      return '/livetv?tab=recordings&serverId=' + serverId;
    }
    if (item === 'nextup') {
      return '/list/list.html' + '?type=nextup&serverId=' + serverId;
    }
    if (item === "PluginCatalog") {
      return "/plugins?tab=catalog";
    }
    if (item === "LiveTVSetup") {
      return "/livetvsetup";
    }
    if (item === 'livetv' || item.CollectionType === 'livetv') {
      if (options.section === 'programs') {
        return '/livetv?tab=suggestions&serverId=' + serverId;
      }
      if (options.section === 'guide') {
        return '/livetv?tab=guide&serverId=' + serverId;
      }
      if (options.section === 'movies') {
        return '/list/list.html?type=Program&IsMovie=true&serverId=' + serverId;
      }
      if (options.section === 'shows') {
        return '/list/list.html?type=Program&IsSeries=true&IsMovie=false&IsNews=false&serverId=' + serverId;
      }
      if (options.section === 'newepisodes') {
        return '/list/list.html?type=Program&IsSeries=true&IsMovie=false&IsNews=false&IsNewOrPremiere=true&serverId=' + serverId;
      }
      if (options.section === 'sports') {
        return '/list/list.html?type=Program&IsSports=true&serverId=' + serverId;
      }
      if (options.section === 'kids') {
        return '/list/list.html?type=Program&IsKids=true&serverId=' + serverId;
      }
      if (options.section === 'news') {
        return '/list/list.html?type=Program&IsNews=true&serverId=' + serverId;
      }
      if (options.section === 'onnow') {
        return '/list/list.html' + '?type=OnNow&serverId=' + serverId;
      }
      if (options.section === 'dvrschedule') {
        return '/livetv?tab=schedule&serverId=' + serverId;
      }
      return '/livetv?serverId=' + serverId;
    }
    if (item === 'list') {
      var _url = '/list/list.html?serverId=' + serverId + '&type=' + options.itemTypes;
      if (options.isFavorite) {
        _url += '&IsFavorite=true';
      }
      if (options.artistId) {
        _url += '&artistId=' + options.artistId;
      }
      if (options.albumArtistId) {
        _url += '&albumArtistId=' + options.albumArtistId;
      }
      return _url;
    }
    var itemType = item.Type || (options ? options.itemType : null);
    if (itemType === "ActiveSession") {
      if (item.NowPlayingItem) {
        item = item.NowPlayingItem;
        itemType = item.Type;
        id = item.Id;
      }
    }
    if (itemType === "EmbyConnect") {
      return getRouteUrl('connectlogin');
    }
    if (itemType === "Downloads") {
      return getRouteUrl('downloads');
    }
    if (itemType === "SelectServer") {
      return getRouteUrl('selectserver');
    }
    if (itemType === "ForgotPassword") {
      return '/startup/forgotpassword.html?serverId=' + serverId;
    }
    if (itemType === "ManualLogin") {
      return getServerLoginRouteUrl({
        loginType: 'manual',
        apiClient: _connectionmanager.default.getApiClient(serverId),
        username: item.Username
      });
    }
    if (itemType === "SeriesTimer") {
      return getItemUrl({
        seriesTimerId: id,
        serverId: serverId
      }, options);
    }
    if (itemType === "Timer") {
      if (item.ProgramId) {
        return getItemUrl({
          id: item.ProgramId,
          serverId: serverId
        }, options);
      }
      return getItemUrl({
        timerId: id,
        serverId: serverId
      }, options);
    }
    if (itemType === "Device") {
      return "/devices/device.html?id=" + id;
    }
    if (itemType === "Log") {
      if (item.ServerId) {
        return "/log?name=" + item.Name + '&serverId=' + item.ServerId;
      } else {
        return "/applog?name=" + item.Name;
      }
    }
    if (itemType === "AddServer") {
      return "/startup/manualserver.html";
    }
    if (itemType === "Plugin") {
      if (!_pluginmanager.default.allowPluginPages(item.Id)) {
        return null;
      }
      return '/' + item.ConfigPageUrl;
    }
    if (itemType === "User") {
      return "/users/user?userId=" + id;
    }
    if (itemType === "LiveTVTunerDevice") {
      if (item.SetupUrl) {
        var _url2 = item.SetupUrl;
        if (_url2) {
          if (_url2.includes('?')) {
            _url2 += '&';
          } else {
            _url2 += '?';
          }
          return _url2 + "id=" + id;
        }
      }
      return "/livetvsetup/livetvtuner.html?id=" + id;
    }
    if (itemType === "LiveTVGuideSource") {
      return addParamToUrl(item.SetupUrl, 'id', id);
    }
    if (itemType === 'GameGenre') {
      var _url3 = '/list/list.html?gameGenreId=' + id + '&serverId=' + serverId;
      if (options.parentId) {
        _url3 += '&parentId=' + options.parentId;
      }
      return _url3;
    }
    if (itemType === 'MusicGenre' || itemType === 'Tag' && context !== 'livetv') {
      var _url4 = '/item?id=' + id + '&serverId=' + serverId;
      if (options.parentId) {
        _url4 += '&parentId=' + options.parentId;
      }
      return _url4;
    }
    if (itemType === 'Tag' || itemType === 'Studio' || itemType === 'Genre') {
      var _url5 = '/list/list.html?' + item.Type.toLowerCase() + 'Id=' + id + '&serverId=' + serverId;
      if (context === 'livetv') {
        if (itemType === 'Tag') {
          _url5 += "&type=TvChannel";
        } else {
          _url5 += "&type=Program";
        }
      } else if (context === 'tvshows') {
        // this is needed to make the played filter work for a series
        _url5 += '&type=Series';
      }
      if (options.parentId) {
        _url5 += '&parentId=' + options.parentId;
      }
      if (options.itemTypes) {
        _url5 += '&type=' + options.itemTypes;
      }
      return _url5;
    }
    if (context !== 'folders' && itemType === 'GameSystem') {
      var _url6 = '/list/list.html?type=Game&serverId=' + serverId;
      _url6 += '&parentId=' + id;
      return _url6;
    }
    if (context !== 'folders' && !_apiclient.default.isLocalItem(item)) {
      if (item.CollectionType === 'games') {
        var _url7 = '/games?serverId=' + serverId + '&parentId=' + id;
        return _url7;
      }
      if (item.CollectionType === 'books') {
        var _url8 = '/books?serverId=' + serverId + '&parentId=' + id;
        return _url8;
      }
      if (item.CollectionType === 'musicvideos' || item.CollectionType === 'homevideos' || item.CollectionType === 'movies' || (itemType === 'CollectionFolder' || itemType === 'VirtualFolder') && !item.CollectionType) {
        var _url9 = '/videos?serverId=' + serverId + '&parentId=' + id;
        if (options.section === 'latest' && item.CollectionType === 'movies') {
          _url9 += '&tab=suggestions';
        }
        return _url9;
      }
      if (item.CollectionType === 'tvshows') {
        var _url0 = '/tv?serverId=' + serverId + '&parentId=' + id;
        if (options.section === 'latest') {
          _url0 += '&tab=suggestions';
        }
        return _url0;
      }
      if (item.CollectionType === 'music' || item.CollectionType === 'audiobooks') {
        var _url1 = '/music?serverId=' + serverId + '&parentId=' + id;
        return _url1;
      }
    }
    if (itemType === 'PluginCatalogItem') {
      return "plugins/install?name=" + encodeURIComponent(item.Name) + "&guid=" + item.Id;
    }
    if (itemType === "Playlist" || itemType === "TvChannel" || itemType === "BoxSet" || itemType === "MusicAlbum" || itemType === "MusicGenre" || itemType === "Person" || itemType === "Recording" || itemType === "MusicArtist") {
      return getItemUrl({
        id: id,
        serverId: serverId
      }, options);
    }
    if (itemType === "Program") {
      if (item.AsSeries) {
        return getItemUrl({
          id: id,
          serverId: serverId,
          asSeries: true
        }, options);
      }
      return getItemUrl({
        id: id,
        serverId: serverId
      }, options);
    }
    if (itemType === "Series" || itemType === "Season" || itemType === "Episode") {
      return getItemUrl({
        id: id,
        serverId: serverId,
        context: context
      }, options);
    }
    if (item.IsFolder) {
      if (id) {
        var _url10 = "/list/list.html?parentId=" + id + '&serverId=' + serverId;
        switch (item.CollectionType) {
          case 'playlists':
          case 'boxsets':
            context = item.CollectionType;
            break;
          default:
            break;
        }
        if (context) {
          _url10 += '&context=' + context;
        }
        return _url10;
      }
      return '#';
    }
    if (item.RouteUrl) {
      return item.RouteUrl;
    }
    return getItemUrl({
      id: id,
      serverId: serverId
    }, options);
  }
  function showItem(item, serverId, options) {
    if (typeof item === 'string') {
      var apiClient = serverId ? _connectionmanager.default.getApiClient(serverId) : _connectionmanager.default.currentApiClient();
      return apiClient.getItem(apiClient.getCurrentUserId(), item).then(function (item) {
        return appRouter.showItem(item, options);
      });
    } else {
      if (item.Type === 'Plugin') {
        if (!item.ConfigPageUrl) {
          return showAlertAndResolve(_globalize.default.translate('NoPluginConfigurationMessage'));
        } else if (!_pluginmanager.default.allowPluginPages(item.Id)) {
          return showAlertAndResolve(_globalize.default.translate('MessagePluginConfigurationRequiresLocalAccess'));
        }
      } else if (item.Type === 'ActiveSession') {
        return Promise.reject();
      } else if (item.Type === 'Server') {
        return Promise.reject();
      }
      if (arguments.length === 2) {
        options = arguments[1];
      }
      return show(appRouter.getRouteUrl(item, options));
    }
  }
  function setTitle(title) {
    loadAppHeader().then(function (appHeader) {
      appHeader.setTitle(title);
    });
  }
  function showVideoOsd(options) {
    //console.log('showVideoOsd: ' + new Error().stack);

    var currentRouteInfo = getCurrentRouteInfo();
    if (currentRouteInfo) {
      if (currentRouteInfo.params.asDialog === 'true' && window.location.href.includes('videoosd.html')) {
        return loadDialogHelper().then(function (dialogHelper) {
          dialogHelper.close(currentRouteInfo.view);
        });
      }
    }
    var url = '/videoosd/videoosd.html';
    return show(url);
  }
  function defineRoute(newRoute) {
    var baseRoute = baseUrl();
    var path = newRoute.path;
    path = path.replace(baseRoute, '');
    console.log('Defining route: ' + path);
    addRoute(path, newRoute);
  }
  function addRoute(path, newRoute) {
    if (path && newRoute) {
      (0, _page.default)(path, newRoute);
    } else {
      defineRoute(path);
    }
  }
  function getRoutes() {
    return _page.default.getRoutes();
  }
  var backdropContainer;
  var backgroundContainer;
  var docElem;
  function setTransparency(level) {
    //console.log('appRouter.setTransparency: ' + level + ' ' + new Error().stack);

    if (!backdropContainer) {
      backdropContainer = document.querySelector('.backdropContainer');
    }
    if (!backgroundContainer) {
      backgroundContainer = document.querySelector('.backgroundContainer');
    }
    if (!docElem) {
      docElem = document.documentElement;
    }
    if (level === 'full' || level === 2) {
      _backdrop.default.externalBackdrop(true);
      docElem.classList.add('transparentDocument');
      backgroundContainer.classList.add('backgroundContainer-transparent');
      backdropContainer.classList.add('hide');
    } else if (level === 'backdrop' || level === 1) {
      _backdrop.default.externalBackdrop(true);
      docElem.classList.add('transparentDocument');
      backgroundContainer.classList.remove('backgroundContainer-transparent');
      backdropContainer.classList.add('hide');
    } else {
      _backdrop.default.externalBackdrop(false);
      docElem.classList.remove('transparentDocument');
      backgroundContainer.classList.remove('backgroundContainer-transparent');
      backdropContainer.classList.remove('hide');
    }
  }
  function replaceState(path, dispatch) {
    _page.default.replace(path, {}, dispatch);
    _viewmanager.default.replaceCurrentUrl(baseUrl() + path);
  }
  function pushState(state, title, url) {
    state.navigate = false;
    _page.default.pushState(state, title, url);
  }
  function setBaseRoute() {
    var baseRoute = globalThis.location.pathname.replace(getRequestFile(), '');
    if (baseRoute.lastIndexOf('/') === baseRoute.length - 1) {
      baseRoute = baseRoute.substring(0, baseRoute.length - 1);
    }
    console.log('Setting page base to ' + baseRoute);
    _page.default.base(baseRoute);
  }
  setBaseRoute();
  function invokeShortcut(id) {
    if (id.startsWith('library-')) {
      id = id.replace('library-', '');
      id = id.split('_');
      return showItem(id[0], id[1]);
    } else if (id.startsWith('item-')) {
      id = id.replace('item-', '');
      id = id.split('_');
      var itemId = id[0];
      var serverId = id[1];
      return showItem(itemId, serverId);
    } else if (id.startsWith('play-')) {
      id = id.replace('play-', '');
      id = id.split('_');
      var _itemId = id[0];
      var _serverId = id[1];
      return loadPlaybackManager().then(function (playbackManager) {
        playbackManager.play({
          fullscreen: true,
          ids: [_itemId],
          serverId: _serverId
        });
      });
    } else {
      id = id.split('_');
      return show(appRouter.getRouteUrl(id[0], {
        serverId: id[1]
      }));
    }
  }
  appRouter.showBackMenu = showBackMenuInternal;
  appRouter.addRoute = addRoute;
  appRouter.back = back;
  appRouter.forward = forward;
  appRouter.show = show;
  appRouter.baseUrl = baseUrl;
  appRouter.canGoBack = canGoBack;
  appRouter.currentViewPath = currentViewPath;
  appRouter.goHome = goHome;
  appRouter.showItem = showItem;
  appRouter.setTitle = setTitle;
  appRouter.setTransparency = setTransparency;
  appRouter.getRoutes = getRoutes;
  appRouter.getRouteUrl = getRouteUrl;
  appRouter.getRouteInfo = getRouteInfo;
  appRouter.pushState = pushState;
  appRouter.replaceState = replaceState;
  appRouter.showVideoOsd = showVideoOsd;
  appRouter.handleAnchorClick = _page.default.handleAnchorClick;
  appRouter.TransparencyLevel = {
    None: 0,
    Backdrop: 1,
    Full: 2
  };
  appRouter.invokeShortcut = invokeShortcut;
  appRouter.validateUserAccessToRoute = validateUserAccessToRoute;
  appRouter.getHandleRouteFn = function () {
    return handleRoute;
  };
  globalThis.Emby.Page = appRouter;
  globalThis.Emby.TransparencyLevel = appRouter.TransparencyLevel;
  var _default = _exports.default = appRouter;
});
