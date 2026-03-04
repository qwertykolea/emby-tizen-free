/* global define */
/* jshint module: true */
(function () {"use strict";

var appMode = globalThis.appMode;
var isNativeTizen = globalThis.appMode === 'tizen';
var isNativeLG = globalThis.appMode === 'webos';
var customPaths;
function returnFirstDependency(obj) {
  return obj;
}
function returnFirstDependencyDefault(obj) {
  var _obj;
  if (Array.isArray(obj)) {
    obj = obj[0];
  }

  // this ? check is needed for importing modules without exports and babel-transpiled code to requirejs
  return ((_obj = obj) == null ? void 0 : _obj.default) || obj;
}
function loadSharedComponentsDictionary(globalize) {
  var baseUrl = 'modules/common/strings/';
  var languages = ['ar', 'bg', 'ca', 'cs', 'da', 'de', 'el', 'en-GB', 'en-US', 'es', 'es-AR', 'es-MX', 'es-US', 'et', 'fa', 'fi', 'fr', 'fr-CA', 'he', 'hi', 'hr', 'hu', 'id', 'is', 'it', 'ja', 'kk', 'ko', 'lt', 'lv', 'mk', 'ms', 'nb', 'nl', 'pl', 'pt-BR', 'pt-PT', 'ro', 'ru', 'sk', 'sl', 'sq', 'sv', 'th', 'tr', 'uk', 'vi', 'zh-CN', 'zh-HK', 'zh-TW'];
  var translations = languages.map(function (i) {
    return {
      lang: i,
      path: baseUrl + i + '.json'
    };
  });
  return globalize.loadStrings({
    name: 'sharedcomponents',
    translations: translations
  });
}
function isGamepadSupported() {
  return 'ongamepadconnected' in window || navigator.getGamepads || navigator.webkitGetGamepads;
}
function enableNativeGamepadKeyMapping() {
  // On Windows UWP, this will tell the platform to make the gamepad emit normal keyboard events
  if (window.navigator && typeof window.navigator.gamepadInputEmulation === "string") {
    // We want the gamepad to provide gamepad VK keyboard events rather than moving a
    // mouse like cursor. Set to "keyboard", the gamepad will provide such keyboard events
    // and provide input to the DOM navigator.getGamepads API.
    window.navigator.gamepadInputEmulation = "keyboard";
    return true;
  }
  return false;
}
function loadPlugin(url) {
  return Promise.all([importFromPath('./modules/common/pluginmanager.js')]).then(function (responses) {
    var pluginManager = responses[0];
    if (url.startsWith('./') && url.endsWith('.js')) {
      console.log('Loading plugin module: ' + url);
      return getDynamicImport(url)().then(function (f) {
        return pluginManager.loadPlugin(f, url);
      });
    }
    return pluginManager.loadPluginFromUrl(url);
  });
}
function getAvailablePluginsAppStore() {
  var promises = [this._getAvailablePlugins(), importFromPath('./modules/common/pluginmanager.js')];
  return Promise.all(promises).then(function (responses) {
    var plugins = responses[0];
    var pluginManager = responses[1];
    return plugins.filter(function (p) {
      return pluginManager.allowPluginPages(p.guid);
    });
  });
}
function returnFalse() {
  return false;
}
function onApiClientCreated(e, apiClient) {
  if (appMode === 'ios' || appMode === 'android') {
    apiClient._getAvailablePlugins = apiClient.getAvailablePlugins;
    apiClient.getAvailablePlugins = getAvailablePluginsAppStore.bind(apiClient);
  }
  Promise.all([importFromPath('./modules/browser.js')]).then(function (responses) {
    var browser = responses[0];

    // replace this, not reliable
    if (browser.operaTv) {
      apiClient.isWebSocketSupported = returnFalse;
    }
  });
}
function getServerAddressFromWindowUrl() {
  // Try to get the server address from the browser url
  // This will preserve protocol, hostname, port and subdirectory
  var urlLower = window.location.href.toLowerCase();
  var index = urlLower.lastIndexOf('/web');
  if (index !== -1) {
    return urlLower.substring(0, index);
  }

  // If the above failed, just piece it together manually
  var loc = window.location;
  var address = loc.protocol + '//' + loc.hostname;
  if (loc.port) {
    address += ':' + loc.port;
  }
  return address;
}
function createConnectionManager() {
  return Promise.all([importFromPath('./modules/emby-apiclient/connectionmanager.js'), importFromPath('./modules/emby-apiclient/events.js'), importFromPath('./modules/common/servicelocator.js')]).then(function (outerResponses) {
    var connectionManager = outerResponses[0];
    var events = outerResponses[1];
    var serviceLocator = outerResponses[2];
    var appHost = serviceLocator.appHost;

    // TODO: This needs to go. Shouldn't be needed globally anymore
    globalThis.Events = events;
    connectionManager.globalScopeApiClient = true;
    connectionManager.devicePixelRatio = globalThis.devicePixelRatio;

    // This is solely for the native apps to call connectionManager methods from native code
    // client-side code in js files should not use the global scope object
    globalThis.ConnectionManager = connectionManager;
    events.on(connectionManager, 'apiclientcreated', onApiClientCreated);
    if (!appHost.supports('multiserver')) {
      connectionManager.enableServerAddressValidation = false;
      var accessToken;
      var userId;
      var windowSearch = window.location.search;
      if (windowSearch) {
        var params = new URLSearchParams(window.location.search);
        accessToken = params.get('accessToken');
        userId = params.get('userId');
        if (!accessToken || !userId || params.get('e') !== '1') {
          accessToken = null;
          userId = null;
        }
      }
      console.log('creating ApiClient singleton');
      connectionManager.validateServerIds = false;
      var serverAddress = getServerAddressFromWindowUrl();
      var apiClient = connectionManager.getApiClientFromServerInfo({
        ManualAddress: serverAddress,
        ManualAddressOnly: true,
        IsLocalServer: true,
        AccessToken: accessToken,
        UserId: userId
      }, serverAddress);
      if (accessToken && userId) {
        window.location = 'index.html';
      }
      apiClient.enableAutomaticNetworking = false;
      console.log('loaded ApiClient singleton');
    }
  });
}
function getPluginPageContentPath() {
  return globalThis.ApiClient ? globalThis.ApiClient.getUrl('web/ConfigurationPage') : null;
}
function defineCoreRoutes(appRouter, appHost, browser) {
  console.log('Defining core routes');
  appRouter.addRoute({
    path: '/startup/connectlogin.html',
    controller: 'startup/connectlogin.js',
    controllerType: 'module',
    anonymous: true,
    startup: true,
    defaultTitle: true,
    clearBackdrop: true,
    autoFocus: false,
    adjustHeaderForEmbeddedScroll: true,
    drawer: false
  });
  appRouter.addRoute({
    path: '/startup/connectsignup.html',
    controller: 'startup/connectsignup.js',
    controllerType: 'module',
    anonymous: true,
    startup: true,
    defaultTitle: true,
    clearBackdrop: true,
    adjustHeaderForEmbeddedScroll: true,
    drawer: false
  });
  appRouter.addRoute({
    path: '/startup/welcome.html',
    controller: 'startup/welcome.js',
    controllerType: 'module',
    anonymous: true,
    startup: true,
    defaultTitle: true,
    clearBackdrop: true,
    adjustHeaderForEmbeddedScroll: true,
    drawer: false
  });
  appRouter.addRoute({
    path: '/startup/welcome_settings.html',
    controller: 'startup/welcome_settings.js',
    controllerType: 'module',
    anonymous: true,
    startup: true,
    defaultTitle: true,
    clearBackdrop: true,
    adjustHeaderForEmbeddedScroll: true,
    drawer: false
  });
  appRouter.addRoute({
    path: '/startup/forgotpassword.html',
    controller: 'startup/forgotpassword.js',
    controllerType: 'module',
    anonymous: true,
    startup: true,
    defaultTitle: true,
    clearBackdrop: true,
    adjustHeaderForEmbeddedScroll: true,
    drawer: false
  });
  appRouter.addRoute({
    path: '/startup/forgotpasswordpin.html',
    controller: 'startup/forgotpasswordpin.js',
    controllerType: 'module',
    anonymous: true,
    startup: true,
    defaultTitle: true,
    clearBackdrop: true,
    adjustHeaderForEmbeddedScroll: true,
    drawer: false
  });
  appRouter.addRoute({
    path: '/home',
    contentPath: '/home/home.html',
    type: 'home',
    defaultTitle: true,
    controller: 'home/home.js',
    controllerType: 'module',
    autoFocus: false,
    homeButton: false,
    headerTabs: true,
    adjustHeaderForEmbeddedScroll: true,
    enableMediaControlTV: true,
    title: 'Home',
    icon: '&#xe88a;'
  });

  // legacy
  appRouter.addRoute({
    path: '/home/home.html',
    contentPath: '/home/home.html',
    type: 'home',
    defaultTitle: true,
    controller: 'home/home.js',
    controllerType: 'module',
    autoFocus: false,
    homeButton: false,
    headerTabs: true,
    adjustHeaderForEmbeddedScroll: true,
    enableMediaControlTV: true,
    title: 'Home',
    icon: '&#xe88a;'
  });

  // legacy
  appRouter.addRoute({
    path: '/home.html',
    contentPath: '/home/home.html',
    type: 'home',
    defaultTitle: true,
    controller: 'home/home.js',
    controllerType: 'module',
    autoFocus: false,
    homeButton: false,
    headerTabs: true,
    adjustHeaderForEmbeddedScroll: true,
    enableMediaControlTV: true,
    title: 'Home',
    icon: '&#xe88a;'
  });
  appRouter.addRoute({
    path: '/home_horiz/home.html',
    type: 'home',
    defaultTitle: true,
    controller: 'home_horiz/home.js',
    controllerType: 'module',
    headerTabs: true,
    autoFocus: false,
    homeButton: false,
    headerBackground: false,
    clearBackdrop: true,
    enableMediaControlTV: true,
    title: 'Home',
    icon: '&#xe88a;'
  });
  appRouter.addRoute({
    path: '/list/list.html',
    controller: 'list/list.js',
    controllerType: 'module',
    autoFocus: false,
    canRefresh: true,
    adjustHeaderForEmbeddedScroll: true,
    supportsThemeMedia: true
  });
  appRouter.addRoute({
    contentPath: '/item/item.html',
    path: '/item',
    autoFocus: false,
    controller: 'item/item.js',
    controllerType: 'module',
    //transparentHeader: true,
    adjustHeaderForEmbeddedScroll: true,
    supportsThemeMedia: true,
    transition: true
  });

  // legacy
  appRouter.addRoute({
    contentPath: '/item/item.html',
    path: '/item/item.html',
    controller: 'item/item.js',
    controllerType: 'module',
    autoFocus: false,
    //transparentHeader: true,
    adjustHeaderForEmbeddedScroll: true,
    supportsThemeMedia: true,
    transition: true
  });
  appRouter.addRoute({
    contentPath: '/livetv/livetv.html',
    path: '/livetv',
    controller: 'livetv/livetv.js',
    title: 'LiveTV',
    controllerType: 'module',
    autoFocus: false,
    headerTabs: true,
    adjustHeaderForEmbeddedScroll: true,
    enableMediaControlTV: true
  });
  appRouter.addRoute({
    path: '/startup/login.html',
    contentPath: '/list/list.html',
    controller: 'startup/login.js',
    controllerType: 'module',
    anonymous: true,
    autoFocus: false,
    startup: true,
    defaultTitle: true,
    clearBackdrop: true,
    adjustHeaderForEmbeddedScroll: true,
    drawer: false
  });
  appRouter.addRoute({
    path: '/startup/manuallogin.html',
    controller: 'startup/manuallogin.js',
    controllerType: 'module',
    anonymous: true,
    startup: true,
    defaultTitle: true,
    autoFocus: false,
    clearBackdrop: true,
    adjustHeaderForEmbeddedScroll: true,
    drawer: false
  });
  appRouter.addRoute({
    contentPath: '/books/books.html',
    path: '/books',
    controller: 'books/books.js',
    controllerType: 'module',
    autoFocus: false,
    headerTabs: true,
    adjustHeaderForEmbeddedScroll: true
  });
  appRouter.addRoute({
    contentPath: '/games/games.html',
    path: '/games',
    controller: 'games/games.js',
    controllerType: 'module',
    autoFocus: false,
    headerTabs: true,
    adjustHeaderForEmbeddedScroll: true
  });
  appRouter.addRoute({
    contentPath: '/videos/videos.html',
    path: '/videos',
    controller: 'videos/videos.js',
    controllerType: 'module',
    autoFocus: false,
    headerTabs: true,
    adjustHeaderForEmbeddedScroll: true
  });
  appRouter.addRoute({
    contentPath: '/music/music.html',
    path: '/music',
    controller: 'music/music.js',
    controllerType: 'module',
    autoFocus: false,
    headerTabs: true,
    adjustHeaderForEmbeddedScroll: true,
    enableMediaControlTV: true
  });
  appRouter.addRoute({
    path: '/videoosd/videoosd.html',
    controller: 'videoosd/videoosd.js',
    controllerType: 'module',
    type: 'video-osd',
    supportsThemeMedia: true,
    // the page has it's own
    enableMediaControl: false,
    autoFocus: false,
    headerBackground: false,
    homeButton: false,
    drawer: false,
    dockedTabs: false,
    backButton: true,
    transparentHeader: true,
    // for offline playback
    anonymous: true
  });
  appRouter.addRoute({
    contentPath: '/settings/settings.html',
    path: '/settings',
    controller: 'settings/settings.js',
    controllerType: 'module',
    title: 'Settings',
    autoFocus: false,
    clearBackdrop: true,
    settingsTheme: true,
    drawer: false,
    adjustHeaderForEmbeddedScroll: true
  });
  if (appHost.supports('keyboardsettings')) {
    appRouter.addRoute({
      path: '/settings/keyboard.html',
      controller: 'settings/keyboard.js',
      controllerType: 'module',
      type: 'settings',
      title: 'HeaderKeyboardAndRemote',
      thumbImage: '',
      order: 2,
      icon: '&#xe312;',
      clearBackdrop: true,
      settingsTheme: true,
      adjustHeaderForEmbeddedScroll: true,
      autoFocus: false
    });
  }
  if (appHost.supports('applogger')) {
    appRouter.addRoute({
      path: '/applogs',
      contentPath: '/logs/logs.html',
      controller: 'logs/logs.js',
      autoFocus: false,
      controllerType: 'module',
      type: 'settings',
      icon: 'folder_open',
      clearBackdrop: true,
      settingsTheme: true,
      adjustHeaderForEmbeddedScroll: true,
      navMenuId: 'applogs',
      title: 'Logs'
    });
    appRouter.addRoute({
      path: '/applog',
      contentPath: '/list/list.html',
      autoFocus: false,
      controller: 'logs/log.js',
      controllerType: 'module',
      settingsTheme: true,
      clearBackdrop: true,
      adjustHeaderForEmbeddedScroll: true,
      canRefresh: true,
      navMenuId: 'applogs',
      title: 'Logs'
    });
  }
  appRouter.addRoute({
    path: '/settings/notifications.html',
    contentPath: '/list/list.html',
    controller: 'settings/notifications.js',
    controllerType: 'module',
    type: 'settings',
    title: 'Notifications',
    category: 'Playback',
    thumbImage: '',
    order: 1001,
    icon: '&#xe7f4;',
    clearBackdrop: true,
    settingsTheme: true,
    settingsType: 'user',
    adjustHeaderForEmbeddedScroll: true,
    hideDrawerWithOtherUserIdParam: true,
    featureId: 'notifications',
    minServerVersion: '4.8.0.20'
  });
  appRouter.addRoute({
    path: '/settings/playback.html',
    controller: 'settings/playback.js',
    controllerType: 'module',
    type: 'settings',
    title: 'Playback',
    category: 'Playback',
    thumbImage: '',
    order: 2,
    icon: '&#xe038;',
    clearBackdrop: true,
    settingsTheme: true,
    settingsType: 'user',
    adjustHeaderForEmbeddedScroll: true,
    hideDrawerWithOtherUserIdParam: true
  });
  appRouter.addRoute({
    path: '/settings/appgeneral.html',
    controller: 'settings/appgeneral.js',
    controllerType: 'module',
    type: 'settings',
    title: 'General',
    category: 'General',
    thumbImage: '',
    order: 1,
    icon: '&#xe8b8;',
    clearBackdrop: true,
    settingsTheme: true,
    adjustHeaderForEmbeddedScroll: true,
    hideDrawerWithOtherUserIdParam: true
  });
  appRouter.addRoute({
    path: '/settings/appplayback.html',
    controller: 'settings/appplayback.js',
    controllerType: 'module',
    type: 'settings',
    title: 'Playback',
    category: 'Playback',
    thumbImage: '',
    order: 1,
    icon: '&#xe038;',
    clearBackdrop: true,
    settingsTheme: true,
    adjustHeaderForEmbeddedScroll: true,
    hideDrawerWithOtherUserIdParam: true
  });
  appRouter.addRoute({
    path: '/settings/subtitles.html',
    controller: 'settings/subtitles.js',
    controllerType: 'module',
    type: 'settings',
    title: 'Subtitles',
    category: 'Playback',
    thumbImage: '',
    order: 3,
    icon: '&#xe01c;',
    clearBackdrop: true,
    settingsTheme: true,
    settingsType: 'user',
    adjustHeaderForEmbeddedScroll: true,
    hideDrawerWithOtherUserIdParam: true
  });
  appRouter.addRoute({
    path: '/settings/display.html',
    controller: 'settings/display.js',
    controllerType: 'module',
    type: 'settings',
    title: 'Display',
    category: 'General',
    thumbImage: '',
    order: 0,
    icon: '&#xe333;',
    clearBackdrop: true,
    settingsTheme: true,
    settingsType: 'user',
    adjustHeaderForEmbeddedScroll: true,
    hideDrawerWithOtherUserIdParam: true
  });
  appRouter.addRoute({
    path: '/settings/homescreen.html',
    controller: 'settings/homescreen.js',
    controllerType: 'module',
    type: 'settings',
    title: 'HeaderHomeScreen',
    category: 'General',
    thumbImage: '',
    order: 1,
    icon: '&#xe88a;',
    clearBackdrop: true,
    settingsTheme: true,
    settingsType: 'user',
    adjustHeaderForEmbeddedScroll: true,
    hideDrawerWithOtherUserIdParam: true
  });
  appRouter.addRoute({
    path: '/settings/profile.html',
    controller: 'settings/profile.js',
    controllerType: 'module',
    type: 'settings',
    title: 'Profile',
    icon: 'person',
    clearBackdrop: true,
    roles: 'EnableUserPreferenceAccess',
    settingsTheme: true,
    settingsType: 'user',
    adjustHeaderForEmbeddedScroll: true,
    hideDrawerWithOtherUserIdParam: true
  });
  if (appHost.supports('cameraupload')) {
    appRouter.addRoute({
      path: '/settings/cameraupload.html',
      autoFocus: false,
      controller: 'settings/cameraupload.js',
      controllerType: 'module',
      type: 'settings',
      title: 'HeaderCameraUpload',
      clearBackdrop: true,
      settingsTheme: true,
      adjustHeaderForEmbeddedScroll: true,
      icon: 'photo_camera'
    });
  }
  if (appHost.supports('sync')) {
    appRouter.addRoute({
      path: '/settings/download',
      contentPath: '/settings/download/download.html',
      controller: 'settings/download/download.js',
      controllerType: 'module',
      type: 'settings',
      icon: '&#xe5db;',
      title: 'Downloads',
      clearBackdrop: true,
      settingsTheme: true,
      headerTabs: true,
      adjustHeaderForEmbeddedScroll: true
    });
  }
  appRouter.addRoute({
    path: '/search',
    contentPath: '/search/search.html',
    controller: 'search/search.js',
    controllerType: 'module',
    title: '',
    autoFocus: false,
    clearBackdrop: true,
    searchButton: false,
    adjustHeaderForEmbeddedScroll: true,
    navMenuId: 'search'
  });
  appRouter.addRoute({
    path: '/startup/manualserver.html',
    controller: 'startup/manualserver.js',
    controllerType: 'module',
    anonymous: true,
    startup: true,
    defaultTitle: true,
    clearBackdrop: true,
    adjustHeaderForEmbeddedScroll: true,
    drawer: false
  });
  appRouter.addRoute({
    path: '/startup/selectserver.html',
    contentPath: '/list/list.html',
    autoFocus: false,
    anonymous: true,
    startup: true,
    controller: 'startup/selectserver.js',
    controllerType: 'module',
    title: 'HeaderSelectServer',
    clearBackdrop: true,
    adjustHeaderForEmbeddedScroll: true,
    drawer: false,
    helpUrl: 'https://support.emby.media/support/solutions/articles/44001160340-emby-connect'
  });
  appRouter.addRoute({
    contentPath: '/tv/tv.html',
    path: '/tv',
    controller: 'tv/tv.js',
    controllerType: 'module',
    autoFocus: false,
    headerTabs: true,
    adjustHeaderForEmbeddedScroll: true
  });
  if (appHost.supports('serversetup')) {
    appRouter.addRoute({
      contentPath: '/plugins/addplugin.html',
      path: '/plugins/install',
      autoFocus: false,
      roles: 'admin',
      controller: 'plugins/addpluginpage.js',
      controllerType: 'module',
      settingsTheme: true,
      adjustHeaderForEmbeddedScroll: true,
      clearBackdrop: true,
      helpUrl: 'https://support.emby.media/support/solutions/articles/44001159720-plugins',
      title: 'Plugins',
      icon: 'add_shopping_cart'
    });
    appRouter.addRoute({
      path: '/database',
      contentPath: '/server/database/database.html',
      roles: 'admin',
      controller: 'server/database/database.js',
      controllerType: 'module',
      settingsTheme: true,
      adjustHeaderForEmbeddedScroll: true,
      clearBackdrop: true,
      title: 'Database',
      autoFocus: false,
      icon: 'storage'
    });
    appRouter.addRoute({
      path: '/dashboard',
      contentPath: '/dashboard/dashboard.html',
      autoFocus: false,
      roles: 'admin',
      controller: 'dashboard/dashboard.js',
      controllerType: 'module',
      settingsTheme: true,
      adjustHeaderForEmbeddedScroll: true,
      clearBackdrop: true,
      title: 'Dashboard',
      icon: 'dashboard'
    });

    // legacy
    appRouter.addRoute({
      path: '/dashboard.html',
      contentPath: '/dashboard/dashboard.html',
      autoFocus: false,
      roles: 'admin',
      controller: 'dashboard/dashboard.js',
      controllerType: 'module',
      settingsTheme: true,
      adjustHeaderForEmbeddedScroll: true,
      clearBackdrop: true,
      title: 'Dashboard',
      icon: 'dashboard'
    });
    appRouter.addRoute({
      path: '/dashboard/settings',
      contentPath: '/dashboard/settings.html',
      controller: 'dashboard/settings.js',
      controllerType: 'module',
      autoFocus: false,
      roles: 'admin',
      settingsTheme: true,
      clearBackdrop: true,
      helpUrl: 'https://support.emby.media/support/solutions/articles/44001159322-server-settings',
      title: 'General',
      adjustHeaderForEmbeddedScroll: true,
      icon: 'settings'
    });
    appRouter.addRoute({
      contentPath: '/list/list.html',
      path: '/devices',
      autoFocus: false,
      roles: 'admin',
      controller: 'devices/devices.js',
      controllerType: 'module',
      settingsTheme: true,
      clearBackdrop: true,
      helpUrl: 'https://support.emby.media/support/solutions/articles/44001159497-devices',
      title: 'Devices',
      adjustHeaderForEmbeddedScroll: true,
      canRefresh: true,
      icon: 'devices'
    });
    appRouter.addRoute({
      contentPath: '/network/network.html',
      path: '/network',
      autoFocus: false,
      roles: 'admin',
      controller: 'network/network.js',
      controllerType: 'module',
      title: 'Network',
      settingsTheme: true,
      clearBackdrop: true,
      helpUrl: 'https://support.emby.media/support/articles/Hosting-Settings.html',
      adjustHeaderForEmbeddedScroll: true,
      icon: 'wifi'
    });
    appRouter.addRoute({
      path: '/devices/device.html',
      autoFocus: false,
      roles: 'admin',
      controller: 'devices/device.js',
      controllerType: 'module',
      settingsTheme: true,
      clearBackdrop: true,
      helpUrl: 'https://support.emby.media/support/solutions/articles/44001159497-devices',
      title: 'Devices',
      navMenuId: 'devices',
      adjustHeaderForEmbeddedScroll: true,
      icon: 'devices'
    });
    appRouter.addRoute({
      path: '/devices/cameraupload.html',
      autoFocus: false,
      roles: 'admin',
      controller: 'devices/cameraupload.js',
      controllerType: 'module',
      settingsTheme: true,
      title: 'HeaderCameraUpload',
      clearBackdrop: true,
      helpUrl: 'https://support.emby.media/support/solutions/articles/44001159382-camera-upload',
      adjustHeaderForEmbeddedScroll: true,
      icon: 'photo_camera'
    });
    appRouter.addRoute({
      contentPath: '/metadatamanager/metadatamanager.html',
      path: '/metadatamanager',
      controller: 'metadatamanager/metadatamanager.js',
      controllerType: 'module',
      autoFocus: false,
      adjustHeaderForEmbeddedScroll: true,
      clearBackdrop: true,
      title: 'MetadataManager',
      icon: 'edit'
    });
    appRouter.addRoute({
      contentPath: '/transcoding/transcoding.html',
      path: '/transcoding',
      autoFocus: false,
      roles: 'admin',
      controller: 'transcoding/transcoding.js',
      controllerType: 'module',
      title: 'Transcoding',
      settingsTheme: true,
      headerTabs: true,
      clearBackdrop: true,
      helpUrl: 'https://support.emby.media/support/solutions/articles/44001159897-transcoding',
      adjustHeaderForEmbeddedScroll: true,
      icon: 'transform'
    });
    appRouter.addRoute({
      path: '/librarysetup',
      contentPath: '/librarysetup/librarysetup.html',
      controller: 'librarysetup/librarysetup.js',
      controllerType: 'module',
      autoFocus: false,
      roles: 'admin',
      settingsTheme: true,
      adjustHeaderForEmbeddedScroll: true,
      clearBackdrop: true,
      headerTabs: true,
      title: 'Library',
      helpUrl: 'https://support.emby.media/support/solutions/articles/44001159319-library-setup',
      navMenuId: 'librarysetup',
      icon: 'folder'
    });
    appRouter.addRoute({
      path: '/livetvsetup',
      contentPath: '/livetvsetup/livetvsetup.html',
      controller: 'livetvsetup/livetvsetup.js',
      controllerType: 'module',
      autoFocus: false,
      roles: 'admin',
      settingsTheme: true,
      adjustHeaderForEmbeddedScroll: true,
      clearBackdrop: true,
      headerTabs: true,
      title: 'LiveTV',
      helpUrl: 'https://support.emby.media/support/solutions/articles/44001160415-live-tv-setup',
      navMenuId: 'livetvsetup',
      icon: 'dvr'
    });
    appRouter.addRoute({
      path: '/livetvsetup/guideprovider.html',
      autoFocus: false,
      roles: 'admin',
      controller: 'livetvsetup/guideprovider.js',
      controllerType: 'module',
      settingsTheme: true,
      adjustHeaderForEmbeddedScroll: true,
      clearBackdrop: true,
      helpUrl: 'https://support.emby.media/support/solutions/articles/44001160415-live-tv-setup',
      title: 'LiveTV',
      navMenuId: 'livetvsetup',
      icon: 'dvr'
    });
    appRouter.addRoute({
      path: '/livetvsetup/livetvtuner.html',
      autoFocus: false,
      roles: 'admin',
      controller: 'livetvsetup/livetvtuner.js',
      controllerType: 'module',
      settingsTheme: true,
      adjustHeaderForEmbeddedScroll: true,
      clearBackdrop: true,
      helpUrl: 'https://support.emby.media/support/solutions/articles/44001160415-live-tv-setup',
      title: 'HeaderTVSourceSetup',
      navMenuId: 'livetvsetup',
      icon: 'dvr'
    });
    appRouter.addRoute({
      path: '/logs',
      contentPath: '/logs/logs.html',
      controller: 'logs/logs.js',
      autoFocus: false,
      roles: 'admin',
      controllerType: 'module',
      settingsTheme: true,
      clearBackdrop: true,
      adjustHeaderForEmbeddedScroll: true,
      canRefresh: true,
      title: 'Logs',
      icon: 'folder_open'
    });
    appRouter.addRoute({
      path: '/log',
      contentPath: '/list/list.html',
      autoFocus: false,
      roles: 'admin',
      controller: 'logs/log.js',
      controllerType: 'module',
      settingsTheme: true,
      clearBackdrop: true,
      adjustHeaderForEmbeddedScroll: true,
      canRefresh: true,
      navMenuId: 'logs',
      title: 'Logs',
      icon: 'folder_open'
    });
    appRouter.addRoute({
      path: '/plugins',
      contentPath: '/plugins/plugins.html',
      controller: 'plugins/plugins.js',
      controllerType: 'module',
      autoFocus: false,
      roles: 'admin',
      settingsTheme: true,
      adjustHeaderForEmbeddedScroll: true,
      clearBackdrop: true,
      headerTabs: true,
      title: 'Plugins',
      helpUrl: 'https://support.emby.media/support/solutions/articles/44001159720-plugins',
      navMenuId: 'plugins',
      icon: 'add_shopping_cart'
    });
    appRouter.addRoute({
      path: '/dashboard/releasenotes.html',
      autoFocus: false,
      roles: 'admin',
      controller: 'dashboard/releasenotes.js',
      controllerType: 'module',
      settingsTheme: true,
      clearBackdrop: true,
      adjustHeaderForEmbeddedScroll: true
    });
    appRouter.addRoute({
      path: '/scheduledtasks',
      contentPath: '/scheduledtasks/scheduledtasks.html',
      roles: 'admin',
      autoFocus: false,
      controller: 'scheduledtasks/scheduledtasks.js',
      controllerType: 'module',
      title: 'HeaderScheduledTasks',
      clearBackdrop: true,
      settingsTheme: true,
      helpUrl: 'https://support.emby.media/support/solutions/articles/44001159751-scheduled-tasks',
      navMenuId: 'scheduledtasks',
      adjustHeaderForEmbeddedScroll: true,
      icon: 'schedule'
    });
    appRouter.addRoute({
      path: '/scheduledtask',
      contentPath: '/list/list.html',
      autoFocus: false,
      roles: 'admin',
      controller: 'scheduledtasks/scheduledtask.js',
      controllerType: 'module',
      settingsTheme: true,
      clearBackdrop: true,
      helpUrl: 'https://support.emby.media/support/solutions/articles/44001159751-scheduled-tasks',
      title: 'HeaderScheduledTasks',
      navMenuId: 'scheduledtasks',
      adjustHeaderForEmbeddedScroll: true,
      icon: 'schedule'
    });
    appRouter.addRoute({
      path: '/serveractivity',
      contentPath: '/list/list.html',
      autoFocus: false,
      roles: 'admin',
      controller: 'dashboard/serveractivity.js',
      controllerType: 'module',
      settingsTheme: true,
      clearBackdrop: true,
      adjustHeaderForEmbeddedScroll: true,
      canRefresh: true,
      navMenuId: 'dashboard'
    });
    appRouter.addRoute({
      path: '/apikeys',
      contentPath: '/list/list.html',
      autoFocus: false,
      roles: 'admin',
      controller: 'apikeys/apikeys.js',
      controllerType: 'module',
      settingsTheme: true,
      clearBackdrop: true,
      adjustHeaderForEmbeddedScroll: true,
      canRefresh: true,
      title: 'HeaderApiKeys',
      icon: 'vpn_key'
    });
    appRouter.addRoute({
      contentPath: '/embypremiere/embypremiere.html',
      path: '/embypremiere',
      controller: 'embypremiere/embypremiere.js',
      controllerType: 'module',
      autoFocus: false,
      roles: 'admin',
      settingsTheme: true,
      clearBackdrop: true,
      helpUrl: 'https://emby.media/premiere',
      title: 'Emby Premiere',
      adjustHeaderForEmbeddedScroll: true,
      icon: 'star'
    });
    appRouter.addRoute({
      path: '/serverdownloads',
      contentPath: 'server/sync/sync.html',
      autoFocus: false,
      controller: 'server/sync/sync.js',
      controllerType: 'module',
      settingsTheme: true,
      adjustHeaderForEmbeddedScroll: true,
      headerTabs: true,
      clearBackdrop: true,
      title: 'Downloads',
      icon: '&#xe5db;'
    });
    appRouter.addRoute({
      path: '/conversions',
      contentPath: 'server/sync/sync.html',
      autoFocus: false,
      controller: 'server/sync/sync.js',
      controllerType: 'module',
      settingsTheme: true,
      headerTabs: true,
      adjustHeaderForEmbeddedScroll: true,
      clearBackdrop: true,
      title: 'Conversions',
      icon: 'sync'
    });
    appRouter.addRoute({
      path: '/users/user',
      contentPath: '/users/user.html',
      controller: 'users/user.js',
      controllerType: 'module',
      autoFocus: false,
      roles: 'admin',
      settingsTheme: true,
      adjustHeaderForEmbeddedScroll: true,
      clearBackdrop: true,
      headerTabs: true,
      helpUrl: 'https://support.emby.media/support/solutions/articles/44001160237-users',
      navMenuId: 'users'
    });
    appRouter.addRoute({
      path: '/users/new',
      contentPath: '/users/usernew.html',
      controller: 'users/usernew.js',
      controllerType: 'module',
      autoFocus: false,
      roles: 'admin',
      settingsTheme: true,
      adjustHeaderForEmbeddedScroll: true,
      clearBackdrop: true,
      helpUrl: 'https://support.emby.media/support/solutions/articles/44001160237-users',
      navMenuId: 'users',
      title: 'HeaderNewUser'
    });
    appRouter.addRoute({
      path: '/users',
      contentPath: '/list/list.html',
      autoFocus: false,
      roles: 'admin',
      controller: 'users/users.js',
      controllerType: 'module',
      settingsTheme: true,
      clearBackdrop: true,
      helpUrl: 'https://support.emby.media/support/solutions/articles/44001160237-users',
      adjustHeaderForEmbeddedScroll: true,
      canRefresh: true,
      title: 'Users',
      icon: 'people'
    });
    appRouter.addRoute({
      path: '/wizard/wizardagreement.html',
      anonymous: true,
      controller: 'wizard/wizardagreement.js',
      controllerType: 'module',
      homeButton: false,
      secondaryHeaderFeatures: false,
      defaultTitle: true,
      drawer: false,
      dockedTabs: false,
      settingsTheme: true,
      adjustHeaderForEmbeddedScroll: true,
      clearBackdrop: true
    });
    appRouter.addRoute({
      path: '/wizard/wizardremoteaccess.html',
      anonymous: true,
      controller: 'wizard/wizardremoteaccess.js',
      controllerType: 'module',
      homeButton: false,
      secondaryHeaderFeatures: false,
      defaultTitle: true,
      drawer: false,
      dockedTabs: false,
      settingsTheme: true,
      adjustHeaderForEmbeddedScroll: true,
      clearBackdrop: true
    });
    appRouter.addRoute({
      path: '/wizard/wizardfinish.html',
      anonymous: true,
      controller: 'wizard/wizardfinishpage.js',
      controllerType: 'module',
      homeButton: false,
      secondaryHeaderFeatures: false,
      defaultTitle: true,
      drawer: false,
      dockedTabs: false,
      settingsTheme: true,
      adjustHeaderForEmbeddedScroll: true,
      clearBackdrop: true
    });
    appRouter.addRoute({
      path: '/wizard/wizardlibrary.html',
      controller: 'wizard/wizardlibrary.js',
      controllerType: 'module',
      anonymous: true,
      homeButton: false,
      secondaryHeaderFeatures: false,
      defaultTitle: true,
      drawer: false,
      dockedTabs: false,
      settingsTheme: true,
      adjustHeaderForEmbeddedScroll: true,
      clearBackdrop: true,
      helpUrl: 'https://support.emby.media/support/solutions/articles/44001159319-library-setup'
    });
    appRouter.addRoute({
      path: '/wizard/wizardstart.html',
      anonymous: true,
      controller: 'wizard/wizardstart.js',
      controllerType: 'module',
      homeButton: false,
      secondaryHeaderFeatures: false,
      defaultTitle: true,
      drawer: false,
      dockedTabs: false,
      settingsTheme: true,
      adjustHeaderForEmbeddedScroll: true,
      clearBackdrop: true
    });
    appRouter.addRoute({
      path: '/wizard/wizarduser.html',
      controller: 'wizard/wizarduserpage.js',
      controllerType: 'module',
      autoFocus: false,
      anonymous: true,
      homeButton: false,
      secondaryHeaderFeatures: false,
      defaultTitle: true,
      drawer: false,
      dockedTabs: false,
      settingsTheme: true,
      adjustHeaderForEmbeddedScroll: true,
      clearBackdrop: true
    });
  }
  appRouter.addRoute({
    path: '/configurationpage',
    autoFocus: false,
    enableCache: false,
    enableContentQueryString: true,
    roles: 'admin',
    contentPath: appHost.supports('multiserver') ? getPluginPageContentPath : null,
    settingsTheme: true,
    adjustHeaderForEmbeddedScroll: true,
    // used by navdrawercontent, but this should be cleaned up and removed
    requiresDynamicTitle: true
  });
  appRouter.addRoute({
    path: '/genericui',
    contentPath: 'modules/genericui/genericui.html',
    autoFocus: false,
    controller: 'modules/genericui/genericui.js',
    controllerType: 'module',
    enableContentQueryString: true,
    settingsTheme: true,
    adjustHeaderForEmbeddedScroll: true,
    clearBackdrop: true
  });
  appRouter.addRoute({
    path: '/index.html',
    isDefaultRoute: true,
    clearBackdrop: true,
    autoFocus: false
  });
  appRouter.addRoute({
    path: '/',
    isDefaultRoute: true,
    clearBackdrop: true
  });
}
function getDynamicImportWithoutExport(path) {
  return function () {
    return require(["" + path]);
  };
}
function getDynamicImport(path) {
  return function () {
    return require(["" + path]).then(returnFirstDependencyDefault);
  };
}
function importFromPath(path) {
  return getDynamicImport(path)();
}
function importFromPathWithoutExport(path) {
  return getDynamicImportWithoutExport(path)();
}
function getNativeImport(objectName) {
  var nativeObject = globalThis[objectName];
  return Promise.resolve(nativeObject);
}
function loadAppStorage() {
  var promise;
  try {
    localStorage.setItem('_test', '0');
    localStorage.removeItem('_test');
    promise = importFromPath('./modules/emby-apiclient/appstorage-localstorage.js');
  } catch (e) {
    promise = importFromPath('./modules/emby-apiclient/appstorage-memory.js');
  }
  return promise.then(function (appStorage) {
    return (appStorage.init ? appStorage.init() : Promise.resolve()).then(function () {
      return appStorage;
    });
  });
}
function loadApiClientInternal() {
  return loadAppHost().then(function (appHost) {
    if (appHost.supports('sync')) {
      return getDynamicImport('./modules/emby-apiclient/apiclientex.js')();
    }
    return getDynamicImport('./modules/emby-apiclient/apiclient.js')();
  });
}
function loadApiClient() {
  console.log('loadApiClient');
  return getDynamicImport('./modules/common/servicelocator.js')().then(function (serviceLocator) {
    return loadApiClientInternal().then(function (apiClientFactory) {
      serviceLocator.initialize({
        apiClientFactory: apiClientFactory
      });
      return apiClientFactory;
    });
  });
}
function supportsTizenNaclSockets() {
  if (globalThis.tizen && globalThis.tizen.systeminfo) {
    var v = globalThis.tizen.systeminfo.getCapability('http://tizen.org/feature/platform.version');

    // Don't load sockets for 2015 models, wasm supported from 2020 models
    // wasm is supported in 2020, but udp socket() creation fails in the 5.5 emulator so stick with nacl
    return !supportsTizenWasmSockets() && v && parseFloat(v) >= parseFloat('2.4');
  }
  return false;
}
function supportsTizenWasmSockets() {
  if (globalThis.tizen && globalThis.tizen.systeminfo) {
    var v = globalThis.tizen.systeminfo.getCapability('http://tizen.org/feature/platform.version');

    // Don't load sockets for 2015 models, wasm supported from 2020 models
    // wasm is supported in 2020, but udp socket() creation fails in the 5.5 emulator so stick with nacl
    return v && parseFloat(v) >= parseFloat('6.0');
  }
  return false;
}
function supportsCssVariables() {
  return CSS.supports('color', 'var(--fake-var)');
}
function loadServerDiscovery() {
  if (customPaths.serverdiscovery) {
    return getRequirePromise(addJsExtIfNeeded(customPaths.serverdiscovery));
  }
  if (isNativeTizen && (supportsTizenNaclSockets() || supportsTizenWasmSockets())) {
    return getRequirePromise("native/tizen/serverdiscovery");
  }
  if (appMode === 'android') {
    return getRequirePromise("native/android/serverdiscovery");
  }
  if (appMode === 'ios') {
    return getRequirePromise("native/ios/serverdiscovery");
  }
  return getDynamicImport('./modules/emby-apiclient/serverdiscovery.js')();
}
function loadShell() {
  if (customPaths.shell) {
    return getRequirePromise(addJsExtIfNeeded(customPaths.shell));
  }
  if (appMode === 'android') {
    return getRequirePromise("native/android/shell");
  }
  return getDynamicImport('./modules/shell.js')();
}
function loadWakeOnLan() {
  if (customPaths.wakeonlan) {
    return getRequirePromise(addJsExtIfNeeded(customPaths.wakeonlan));
  }
  if (isNativeTizen && (supportsTizenNaclSockets() || supportsTizenWasmSockets())) {
    return getRequirePromise("native/tizen/wakeonlan");
  }
  if (appMode === 'ios') {
    return getRequirePromise("native/ios/wakeonlan");
  }
  if (appMode === 'android') {
    return getRequirePromise("native/android/wakeonlan");
  }
  return getDynamicImport('./modules/emby-apiclient/wakeonlan.js')();
}
function loadFullscreenManager() {
  return getDynamicImport('./modules/common/servicelocator.js')().then(function (serviceLocator) {
    var promise;
    if (customPaths.fullscreenmanager) {
      promise = getRequirePromise(customPaths.fullscreenmanager);
    } else {
      promise = getDynamicImport('./modules/fullscreen/fullscreenmanager.js')();
    }
    return promise.then(function (fullscreenManager) {
      serviceLocator.initialize({
        fullscreenManager: fullscreenManager
      });
      return fullscreenManager;
    });
  });
}
function bindOnBeforeWindowUnload() {
  getDynamicImport('./modules/common/playback/playbackmanager.js')().then(function (playbackManager) {
    window.addEventListener("beforeunload", function (e) {
      try {
        playbackManager.onAppClose();
      } catch (err) {
        console.error('error in onAppClose: ', err);
      }
    });
  });
}
function loadIap() {
  console.log('loadIap');
  var promise;
  if (appMode === 'android') {
    promise = getRequirePromise("native/android/iap");
  } else if (appMode === 'ios') {
    promise = getRequirePromise("native/ios/iap");
  } else {
    promise = getDynamicImport('./modules/iap.js')();
  }
  return promise.then(function (iapManager) {
    return getDynamicImport('./modules/common/servicelocator.js')().then(function (serviceLocator) {
      serviceLocator.initialize({
        iapManager: iapManager
      });
    });
  });
}
function loadServiceLocator() {
  console.log('loadServiceLocator');
  return Promise.all([loadAppStorage(), loadAppHost(), loadShell(),
  // this needs to be in place before anything tries to load playbackManager
  loadFullscreenManager(), loadWakeOnLan(), loadServerDiscovery()]).then(function (responses) {
    console.log('loadServiceLocator - inner load 1');
    var appStorage = responses[0];
    var appHost = responses[1];
    var shell = responses[2];
    var wakeOnLan = responses[4];
    var serverDiscovery = responses[5];
    var promises = [getDynamicImport('./modules/common/servicelocator.js')()];
    if (appHost.supports('sync')) {
      promises.push(require(['filerepository']));
      promises.push(require(['itemrepository']));
      promises.push(require(['transfermanager']));
      promises.push(require(['useractionrepository']));
      promises.push(require(['localsync']));
    }
    if (appHost.supports('cameraupload')) {
      promises.push(loadCameraUpload());
    }
    if (appHost.supports('applogger')) {
      promises.push(loadAppLogger());
    }
    return Promise.all(promises).then(function (responsesInner) {
      console.log('loadServiceLocator - inner load 2');
      var index = 0;
      var serviceLocator = responsesInner[index];
      index++;
      var fileRepository;
      var itemRepository;
      var transferManager;
      var userActionRepository;
      var localSync;
      var cameraUpload;
      var appLogger;
      if (appHost.supports('sync')) {
        fileRepository = responsesInner[index][0];
        index++;
        itemRepository = responsesInner[index][0];
        index++;
        transferManager = responsesInner[index][0];
        index++;
        userActionRepository = responsesInner[index][0];
        index++;
        localSync = responsesInner[index][0];
        index++;
      }
      if (appHost.supports('cameraupload')) {
        cameraUpload = responsesInner[index];
        index++;
      }
      if (appHost.supports('applogger')) {
        appLogger = responsesInner[index];
        index++;
      }
      console.log('loadServiceLocator - calling serviceLocator.initialize');
      serviceLocator.initialize({
        appStorage: appStorage,
        appHost: appHost,
        shell: shell,
        wakeOnLan: wakeOnLan,
        serverDiscovery: serverDiscovery,
        fileRepository: fileRepository,
        itemRepository: itemRepository,
        transferManager: transferManager,
        userActionRepository: userActionRepository,
        cameraUpload: cameraUpload,
        appLogger: appLogger,
        localSync: localSync
      });
      console.log('loadServiceLocator - calling appHost.init');
      return appHost.init().then(loadApiClient).then(loadIap);
    });
  });
}
function addJsExtIfNeeded(path) {
  if (!path.endsWith('.js')) {
    path += '.js';
  }
  return path;
}
function getRequirePromise(dep) {
  return new Promise(function (resolve, reject) {
    require([dep], resolve);
  });
}
function loadAppLogger() {
  if (appMode === 'android') {
    return getRequirePromise("native/android/applogger");
  }
  return Promise.resolve(getDummyAppLogger());
}
function getDummyAppLogger() {
  return {
    getLogFiles: function (query) {
      var items = [];
      items.push({
        Name: 'currentlog.txt',
        Id: 'currentlog.txt',
        DateCreated: new Date().toISOString(),
        DateModified: new Date().toISOString(),
        Type: 'Log',
        CanDownload: true,
        CanShare: true
      });
      var total = items.length;
      if (query.StartIndex) {
        items = items.slice(query.StartIndex);
      }
      if (query.Limit) {
        items.length = Math.min(query.Limit, items.length);
      }
      return Promise.resolve({
        Items: items,
        TotalRecordCount: total
      });
    },
    getLogLines: function (query) {
      var items = [];
      for (var i = 0, length = 10000; i < length; i++) {
        items.push('line ' + i);
      }
      var total = items.length;
      if (query.StartIndex) {
        items = items.slice(query.StartIndex);
      }
      if (query.Limit) {
        items.length = Math.min(query.Limit, items.length);
      }
      return Promise.resolve({
        Items: items,
        TotalRecordCount: total
      });
    },
    downloadLog: function (name) {
      console.log('downloading dummy log file: ' + name);
      return Promise.resolve();
    },
    shareLog: function (name) {
      console.log('sharing dummy log file: ' + name);
      return Promise.resolve();
    }
  };
}
function loadCameraUpload() {
  if (appMode === 'ios') {
    return getRequirePromise("native/ios/cameraupload");
  }
  if (appMode === 'android') {
    return getRequirePromise("native/android/cameraupload");
  }
  return Promise.resolve(getDummyCameraUpload());
}
function getDummyCameraUpload() {
  return {
    start: function () {},
    setProgressUpdatesEnabled: function () {},
    getAvailableFolders: function () {
      return Promise.resolve([{
        Id: '541C6607-9C45-4875-A292-5F89F742B2B3/L0/040',
        Name: 'TestFolder1'
      }, {
        Id: '773DFE72-F38F-4220-8F2F-C4A472DBBA75/L0/040',
        Name: 'TestFolder2'
      }]);
    }
  };
}
function loadAppHost() {
  if (customPaths.apphost) {
    return getRequirePromise(addJsExtIfNeeded(customPaths.apphost));
  }
  if (appMode === 'ios') {
    return getRequirePromise("native/ios/apphost");
  }
  if (appMode === 'android') {
    return getRequirePromise("native/android/apphost");
  }
  return importFromPath('./modules/apphost.js');
}
function getImportMap() {
  var elem = document.querySelector('script[type="importmap"]');
  if (elem) {
    var html = elem.innerHTML;
    if (html) {
      try {
        var obj = JSON.parse(html);
        if (obj) {
          var imports = obj.imports;
          if (imports) {
            return imports;
          }
        }
      } catch (err) {
        console.error('error parsing import map: ', err);
      }
    }
  }
  return {};
}

/**
 * Object.entries() polyfill
 * https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/entries
 */
// this has to be here due to initRequire using it before polyfills start getting loaded
if (!Object.entries) {
  Object.entries = function (obj) {
    var ownProps = Object.keys(obj);
    var i = ownProps.length;
    var resArray = new Array(i); // preallocate the Array

    while (i--) {
      resArray[i] = [ownProps[i], obj[ownProps[i]]];
    }
    return resArray;
  };
}
function initRequire() {
  var importMap = getImportMap();
  var entries = Object.entries(importMap);
  for (var i = 0, length = entries.length; i < length; i++) {
    var entry = entries[i];
    var key = entry[0];
    var url = entry[1];
    console.log('defining from importMap: ' + key + ': ' + url);
    define(key, [], getDynamicImport(url));
  }

  // HTML DONE

  define("embyProgressBarStyle", [], returnFirstDependency);

  // alias
  define("inputmanager", ['inputManager'], returnFirstDependency);
  define("fullscreenManager", loadFullscreenManager);
  define("shell", [], loadShell);
  if (customPaths.filesystem) {
    define("filesystem", [addJsExtIfNeeded(customPaths.filesystem)], returnFirstDependency);
  } else {
    define("filesystem", [], getDynamicImport('./modules/common/filesystem.js'));
  }

  // alias
  define('connectionManagerResolver', ['connectionManager'], returnFirstDependency);
  define("cardStyle", ['css!!aspectratio|modules/cardbuilder/cardpadder_legacy.css', 'css!modules/cardbuilder/card.css', 'css!!tv|modules/cardbuilder/card_nontv.css', 'css!!varcalcmax,!containerqueries,!cssvars|modules/cardbuilder/card_sizes_base.css', 'css!!varcalcmax,!containerqueries,cssvars|modules/cardbuilder/card_sizes_var.css', 'css!varcalcmax,cssvars|modules/cardbuilder/card_sizes_varcalcmax.css',
  //'css!containerqueries|modules/cardbuilder/card_sizes_container.css',
  'css!!cssvars,!varcalcmax,!containerqueries|modules/cardbuilder/card_sizes_horizontal_base.css', 'css!cssvars,!varcalcmax,!containerqueries|modules/cardbuilder/card_sizes_horizontal_var.css', 'css!cssvars,varcalcmax,!containerqueries|modules/cardbuilder/card_sizes_horizontal_varcalcmax.css', 'css!cssvars,containerqueries,positiontry|modules/cardbuilder/card_sizes_horizontal_container.css', 'css!modules/cardbuilder/card_sizes_horizontal_all.css', 'css!!tv|modules/cardbuilder/card_nontv2.css', 'css!tv|modules/cardbuilder/card_tv2.css', 'css!modules/cardbuilder/card_post.css'], returnFirstDependency);
  define("flexStyles", ["css!modules/flexstyles.css"], returnFirstDependency);
  define("programStyles", ['css!modules/emby-elements/guide/programs.css'], returnFirstDependency);
  define("apphost", [], loadAppHost);
  define("cameraUpload", [], loadCameraUpload);
  define("appLogger", [], loadAppLogger);
  define("serverdiscovery", [], loadServerDiscovery);
  define("wakeOnLan", [], loadWakeOnLan);
  define("appStorage", [], loadAppStorage);
  define("clearButtonStyle", [], returnFirstDependency);
  define("listViewStyle", ['css!' + "modules/listview/listview.css"], returnFirstDependency);
  define("formDialogStyle", ['css!modules/formdialog/formdialog.css', 'css!!tv|modules/formdialog/formdialog_nontv.css', 'css!tv|modules/formdialog/formdialog_tv.css'], returnFirstDependency);
  define("sectionsStyle", ['css!modules/sections/sections.css', 'css!!tv|modules/sections/sections_nontv.css', 'css!tv|modules/sections/sections_tv.css', 'css!modules/sections/sections_post.css'], returnFirstDependency);
  define("mediasync", ["modules/sync/mediasync"], returnFirstDependency);
  define("scrollStyles", ['css!!tv|modules/scroller/scroller_nontv.css', 'css!modules/scroller/scroller.css'], returnFirstDependency);

  // alias
  define("appsettings", ['appSettings'], returnFirstDependency);
  define("material-icons", ['css!modules/fonts/material-icons/style.css'], returnFirstDependency);
  define("systemFontsCss", ['css!modules/fonts/fonts.css', 'css!!tv,osx|modules/fonts/fonts_osx.css', 'css!tv|modules/fonts/fonts_tv.css'], returnFirstDependency);
  define("dialogTemplateHtml", ["text!modules/dialog/dialog.template.html"], returnFirstDependency);
  define("jQuery", ['https://code.jquery.com/jquery-3.7.0.slim.min.js'], function () {
    if (globalThis.ApiClient) {
      globalThis.jQuery.ajax = globalThis.ApiClient.ajax;
    }
    return globalThis.jQuery;
  });
  define("apiInput", ['serverNotifications'], returnFirstDependency);
  define('apiClientResolver', ['connectionManager'], function (connectionManager) {
    return function () {
      return connectionManager.currentApiClient();
    };
  });
  define("embyRouter", ['appRouter'], returnFirstDependency);
  define("webActionSheet", ["actionsheet"], returnFirstDependency);
  if (isNativeTizen && supportsTizenNaclSockets()) {
    define('sockets', ['native/tizen/naclSockets/sockets'], returnFirstDependency);
  }
  if (isNativeTizen && supportsTizenWasmSockets()) {
    define('sockets', ['native/tizen/wasmSockets/sockets'], returnFirstDependency);
  }
  define("iapManager", [], loadIap);
  define("detailtablecss", [], returnFirstDependency);
  define("apiclient", [], loadApiClient);
}
function loadCoreDictionary(globalize) {
  var baseUrl = 'strings/';
  var languages = ['ar', 'bg', 'ca', 'cs', 'da', 'de', 'el', 'en-GB', 'en-US', 'es', 'es-AR', 'es-MX', 'es-US', 'et', 'fa', 'fi', 'fr', 'fr-CA', 'he', 'hi', 'hr', 'hu', 'id', 'is', 'it', 'ja', 'kk', 'ko', 'lt', 'lv', 'mk', 'ms', 'nb', 'nl', 'pl', 'pt-BR', 'pt-PT', 'ro', 'ru', 'sk', 'sl', 'sq', 'sv', 'th', 'tr', 'uk', 'vi', 'zh-CN', 'zh-HK', 'zh-TW'];
  var translations = languages.map(function (i) {
    return {
      lang: i,
      path: baseUrl + i + '.json'
    };
  });
  return globalize.loadStrings({
    name: 'core',
    translations: translations
  });
}
function replaceConsoleLogger() {
  // We should probably have a logging abstraction to avoid replacing console.log
  console.log = function () {};
}
function loadHeader() {
  console.log('loadHeader');
  return Promise.all([importFromPath('./modules/appheader/appheader.js')]).then(function (responses) {
    return responses[0].init();
  });
}
function initMouse() {
  Promise.all([importFromPath('./modules/cssloader.js'), importFromPath('./modules/input/mouse.js')]).then(function (responses) {
    var cssLoader = responses[0];
    var mouseManager = responses[1];
    cssLoader.init({
      mouseManager: mouseManager
    });
    mouseManager.init();
  });
}
function onAppReady() {
  if ("virtualKeyboard" in navigator) {
    navigator.virtualKeyboard.overlaysContent = true;
  }
  console.log('onAppReady');
  var promises = [importFromPath('./modules/common/servicelocator.js'), importFromPath('./modules/approuter.js'), importFromPath('./modules/browser.js')];
  if (appMode === 'ios' || appMode === 'android') {
    promises.push(importFromPath('./modules/registrationservices/registrationservices.js'));
  }
  if (appMode === 'android') {
    promises.push(getRequirePromise('native/android/appshortcuts'));
    promises.push(getRequirePromise('native/android/nativecredentials'));
    promises.push(getRequirePromise('native/android/nativesettings'));
  } else if (appMode === 'ios') {
    promises.push(getRequirePromise('native/ios/appshortcuts'));
    promises.push(getRequirePromise('native/ios/nativecredentials'));
    promises.push(getRequirePromise('native/ios/nativesettings'));
  }
  return Promise.all(promises).then(function (responses) {
    var serviceLocator = responses[0];
    var appHost = serviceLocator.appHost;
    var appRouter = responses[1];
    var browser = responses[2];
    promises = [];
    console.log('Loaded dependencies in onAppReady');
    defineCoreRoutes(appRouter, appHost, browser);
    appRouter.start();
    document.dispatchEvent(new CustomEvent("appready", {}));
    if (appHost.supports('soundeffects')) {
      importFromPath('./modules/soundeffects/soundeffectsmanager.js');
    }
    importFromPathWithoutExport('./modules/thememediaplayer.js');
    importFromPathWithoutExport('./modules/transparencymanagement.js');
    if (!appHost.supports('nativegamepadkeymapping') && !enableNativeGamepadKeyMapping() && isGamepadSupported()) {
      console.log('loading gamepadtokey');
      importFromPathWithoutExport('./modules/input/gamepadtokey.js');
    }
    if (appHost.supports('webhidautoauth')) {
      importFromPath('./modules/input/hidinput.js').then(function (hidInput) {
        if (hidInput.shouldTryConnect()) {
          window.addEventListener('keydown', function () {
            hidInput.tryConnect();
          }, {
            capture: true,
            passive: true,
            once: true
          });
        }
      });
    }
    if (appHost.supports('windowstate') && appHost.supports('webcontrolbox')) {
      importFromPathWithoutExport('./modules/controlbox.js');
    }
    if (appMode === 'android') {
      require(['native/android/mediasession', 'native/android/chromecast']);
    } else if (appMode === 'ios') {
      require(['native/ios/mediasession', 'native/ios/backgroundfetch', 'native/ios/nativeplayerbridge', 'native/ios/mouse']);
    }

    // We need these but it's ok to let the UI load first
    else if (isNativeTizen) {
      require(['native/tizen/input']);
      require(['native/tizen/networkerror']);
      if (browser.sdkVersion && browser.sdkVersion >= 2.4) {
        require(['native/tizen/preview']);
      }
      require(['native/tizen/screensavermanager']);

      // itemContextMenu is also checking this to allow all options when sideloading
      browser.tizenSideload = false;
      if (browser.tizenSideload) {
        require(['native/tizen/expiration']);
      }
    }
    if (!browser.tv) {
      importFromPathWithoutExport('./modules/notifications.js');
    }
    importFromPathWithoutExport('./modules/nowplayingbar/nowplayingbar.js');
    if (appHost.supports('remotecontrol')) {
      // For now this is needed because it also performs the mirroring function
      importFromPathWithoutExport('./modules/playback/remotecontrolautoplay.js');
    }
    if (navigator.mediaSession && !appHost.supports('nativemediasession')) {
      importFromPathWithoutExport('./modules/playback/mediasession.js');
    }
    initMouse();
    importFromPath('./modules/input/keyboard.js');
    importFromPath('./modules/common/input/api.js');
    if (appHost.supports('screensaver')) {
      importFromPath('./modules/screensavermanager.js');
    }
    if (appHost.supports('fullscreenchange')) {
      importFromPathWithoutExport('./modules/fullscreen/fullscreen-dc.js');
    }
    if (!appHost.supports('multiserver')) {
      if (globalThis.ApiClient) {
        require(['css!' + globalThis.ApiClient.getUrl('Branding/Css')]);
      }
    }

    // load this early so that css is already available and the first dialog isn't loaded awkwardly
    // this will no longer be needed once we start using import assertions
    importFromPath('./modules/actionsheet/actionsheet.js');
    require(['formDialogStyle']);
    bindOnBeforeWindowUnload();
    return Promise.all(promises);
  });
}
function loadExternalScripts() {
  console.log('loadExternalScripts');
  var startInfo = this;
  var scripts = startInfo.scripts;
  if (scripts) {
    return require(scripts);
  }
  return Promise.resolve();
}
function replaceElectronAppHostSupports(appHost) {
  var baseMethod = appHost.supports;
  appHost.supports = function (feature) {
    switch (feature) {
      case 'youtube':
      case 'youtube_embedded':
      case 'ebookplayer':
      case 'pdfplayer':
      case 'windowdragregion':
      case 'webcontrolbox':
        return true;
      default:
        return baseMethod(feature);
    }
  };
}
function addAppHostOptionalExit(appHost) {
  appHost.exitWithOptionalMenu = function (forceMenuDisplay) {
    return Promise.all([importFromPath('./modules/common/globalize.js')]).then(function (responses) {
      var globalize = responses[0];
      return Emby.importModule('./modules/backmenu/backmenu.js').then(function (backMenu) {
        return backMenu({
          showUserInfo: false,
          text: globalize.translate('AppExitConfirmation'),
          settings: false,
          exitFirst: true
        });
      });
    });
  };
}
function loadPlugins() {
  console.log('loadPlugins');
  var startInfo = this;
  return Promise.all([importFromPath('./modules/common/servicelocator.js'), importFromPath('./modules/browser.js'), importFromPath('./modules/approuter.js')]).then(function (responses) {
    var appHost = responses[0].appHost;
    var browser = responses[1];
    addAppHostOptionalExit(appHost);
    if (browser.electron && appMode !== 'embyclient') {
      replaceElectronAppHostSupports(appHost);
    }

    // Doesn't really belong here but this is the earliest apphost is loaded
    if (appHost.supports('windowstate') && appHost.supports('windowdragregion')) {
      document.querySelector('.skinHeader').insertAdjacentHTML('beforeend', '<div class="windowDragRegion hide-mouse-idle-tv"></div>');
      require(['css!modules/windowdrag.css']);
    }
    var externalPlugins = startInfo.plugins || [];
    console.log('Loading installed plugins');

    // Load installed plugins

    if (customPaths.pluginloader) {
      var forcedPlugins = ['./modules/common/playback/playbackvalidation.js', './modules/common/playback/playaccessvalidation.js', './modules/common/playback/experimentalwarnings.js', './modules/htmlaudioplayer/plugin.js', './modules/photoplayer/plugin.js', './modules/confirmstillplaying/plugin.js'
      //'./modules/common/playback/playqueueconfirmation.js'
      ];
      return getRequirePromise(addJsExtIfNeeded(customPaths.pluginloader)).then(function (pluginloader) {
        return pluginloader.loadPlugins(forcedPlugins);
      });
    }
    var list = ['./modules/common/playback/playbackvalidation.js', './modules/common/playback/playaccessvalidation.js', './modules/common/playback/experimentalwarnings.js'];

    //list.push('./modules/common/playback/playqueueconfirmation.js');

    if (appHost.supports('soundeffects')) {
      list.push('./modules/soundeffects/defaultsoundeffects/plugin.js');
    }
    if (appHost.supports('screensaver')) {
      list.push('./modules/logoscreensaver/plugin.js');
      list.push('./modules/backdropscreensaver/plugin.js');
      list.push('./modules/photoscreensaver/plugin.js');
    }
    if (appMode === 'android') {
      list.push('native/android/mpvvideoplayer');
      list.push('native/android/mpvaudioplayer');
    } else if (appMode === 'ios') {
      list.push('native/ios/mpvaudioplayer');
      list.push('native/ios/mpvvideoplayer');
    }
    if (appMode !== 'android' && appMode !== 'ios') {
      list.push('./modules/htmlaudioplayer/plugin.js');
    }
    if (appMode === 'ios') {
      list.push('native/ios/chromecast');
    }
    if (appMode === 'android') {
      list.push('native/android/chromecast');
    }
    if (globalThis.webapis && webapis.avplay) {
      list.push('native/tizen/tizenavplayer/plugin');
    } else {
      if (appMode !== 'android' && appMode !== 'ios') {
        list.push('./modules/htmlvideoplayer/plugin.js');
      }
    }
    if (appHost.supports('ebookplayer')) {
      list.push('./modules/ebookplayer/plugin.js');
    }
    list.push('./modules/photoplayer/plugin.js');
    if (appHost.supports('pdfplayer') && supportsCssVariables()) {
      list.push('./modules/pdfplayer/plugin.js');
    }
    if (appHost.supports('remotecontrol')) {
      list.push('./modules/sessionplayer.js');

      // test for globalThis.chrome to detect other chromium based browsers as well as shims such as this: https://github.com/hensm/fx_cast
      // exclude old edge due to seeing the chrome global in uwp
      if (globalThis.chrome && !browser.electron && appMode !== 'android') {
        list.push('./modules/chromecast/chromecastplayer.js');
      }
    }
    if (appHost.supports('youtube')) {
      switch (appMode) {
        case 'android':
        case 'tizen':
        case 'webos':
          list.push('./modules/youtubeplayer/plugin_webview.js');
          break;
        default:
          list.push('./modules/youtubeplayer/plugin.js');
          break;
      }
    }
    for (var i = 0, length = externalPlugins.length; i < length; i++) {
      list.push(externalPlugins[i]);
    }
    if (browser.electron) {
      list.push('./modules/externalplayer/plugin.js');
    } else if (appHost.supports('launchintent')) {
      list.push('./modules/externalplayer/externalplayer_intent.js');
    }
    list.push('./modules/confirmstillplaying/plugin.js');
    return Promise.all(list.map(loadPlugin));
  });
}
function loadFirstLevelPresentationDependencies() {
  console.log('loadFirstLevelPresentationDependencies');
  return Promise.all([importFromPath('./modules/browser.js'), importFromPath('./modules/cssloader.js')]).then(function (responses) {
    var browser = responses[0];
    if (!console.error) {
      console.error = console.log;
    }

    // This is a tizen performance guideline to remove all logging from released applications
    // do this as late as possible to make it easier to debug startup problems
    if (appMode || browser.tv) {
      // handle this in the app's apphost
      if (appMode !== 'android') {
        replaceConsoleLogger();
      }
    }
    require.setCssLoader(responses[1]);
    var promises = [];
    promises.push(require(['systemFontsCss', 'flexStyles', 'css!modules/layout/layout.css', 'css!!tv|modules/layout/layout_nontv.css', 'css!tv|modules/layout/layout_tv.css', 'css!!cssvars|modules/layout/layout_nocssvars.css', 'sectionsStyle']));
    return Promise.all(promises);
  });
}
function loadGlobalization() {
  return Promise.all([importFromPath('./modules/common/globalize.js'), importFromPath('./modules/common/servicelocator.js')]).then(function (responses) {
    var globalize = responses[0];
    var serviceLocator = responses[1];
    var appHost = serviceLocator.appHost;
    if (globalThis.urlCacheParam) {
      globalize.setCacheParam(globalThis.urlCacheParam);
    }
    var stringPromises = [];
    if (appHost.supports('serversetup')) {
      stringPromises.push(loadCoreDictionary(globalize));
    }
    stringPromises.push(loadSharedComponentsDictionary(globalize));
    return Promise.all(stringPromises);
  });
}
function loadPolyfills() {
  console.log('loadPolyfills');
  return Promise.all([importFromPath('./modules/polyfills/polyfillloader.js')]).then(function (responses) {
    var loader = responses[0];
    return loader.load();
  });
}
function loadPlatformDependencies() {
  var _globalThis$NativeApp;
  console.log('loadPlatformDependencies');
  if (appMode === 'embyclient' && (_globalThis$NativeApp = globalThis.NativeAppHost) != null && _globalThis$NativeApp.supports('sync')) {
    define("transfermanager", [], getNativeImport('NativeTransferManager'));
    define("filerepository", [], getNativeImport('NativeFileRepository'));
    define("localsync", [], getNativeImport('NativeLocalSync'));
    define('itemrepository', [], getNativeImport('NativeItemRepository'));
    define('useractionrepository', [], getNativeImport('NativeUserActionRepository'));
  } else if (appMode === 'ios') {
    define("filerepository", ["native/ios/filerepository"], returnFirstDependency);
    define("transfermanager", ["filerepository"], returnFirstDependency);
    define("localsync", ["native/ios/localsync"], returnFirstDependency);
    define('itemrepository', ['native/ios/itemrepository'], returnFirstDependency);
    define('useractionrepository', ['native/ios/useractionrepository'], returnFirstDependency);
  } else if (appMode === 'android' && AndroidAppHost.supportsSync()) {
    define("transfermanager", [], getDynamicImport('./modules/sync/transfermanager.js'));
    define("filerepository", ["native/android/filerepository"], returnFirstDependency);
    define("localsync", ["native/android/localsync"], returnFirstDependency);
    define('itemrepository', ['native/android/itemrepository'], returnFirstDependency);
    define('useractionrepository', ['native/android/useractionrepository'], returnFirstDependency);
  } else {
    define("transfermanager", [], getDynamicImport('./modules/sync/transfermanager.js'));
    define("filerepository", [], getDynamicImport('./modules/sync/filerepository.js'));
    define("localsync", [], getDynamicImport('./modules/sync/localsync.js'));
    define("itemrepository", [], getDynamicImport('./modules/localdatabase/itemrepository.js'));
    define("useractionrepository", [], getDynamicImport('./modules/localdatabase/useractionrepository.js'));
  }
  var promises = [];
  if (isNativeTizen) {
    promises.push(require(['native/tizen/tizeninfo']));
  }
  if (isNativeLG) {
    promises.push(require(['native/webos/webosinfo']));
  }
  return Promise.all(promises);
}
function start(startInfo) {
  enableNativeGamepadKeyMapping();
  if (typeof Windows !== 'undefined' && Windows.UI) {
    try {
      Windows.UI.ViewManagement.ApplicationViewScaling.trySetDisableLayoutScaling(true);
    } catch (err) {}
    try {
      Windows.UI.ViewManagement.ApplicationView.getForCurrentView().setDesiredBoundsMode(Windows.UI.ViewManagement.ApplicationViewBoundsMode.useCoreWindow);
    } catch (err) {}
  }
  startInfo = startInfo || globalThis.appStartInfo || {};
  customPaths = startInfo.paths || {};
  initRequire();
  return loadPolyfills().then(loadPlatformDependencies, loadPlatformDependencies).then(loadServiceLocator).then(createConnectionManager).then(loadGlobalization).then(loadFirstLevelPresentationDependencies).then(loadPlugins.bind(startInfo)).then(loadExternalScripts.bind(startInfo)).then(loadHeader).then(onAppReady);
}
if (!globalThis.Emby) {
  globalThis.Emby = {};
}
Emby.importModule = importFromPath;
Emby.App = {
  start: start
};
if (globalThis.location.href.toString().toLowerCase().indexOf('autostart=false') === -1) {
  start();
}
})();
