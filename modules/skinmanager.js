define(["exports", "./emby-apiclient/connectionmanager.js", "./common/servicelocator.js", "./common/usersettings/usersettings.js", "./emby-apiclient/events.js", "./common/appsettings.js", "./cssloader.js"], function (_exports, _connectionmanager, _servicelocator, _usersettings, _events, _appsettings, _cssloader) {
  Object.defineProperty(_exports, "__esModule", {
    value: true
  });
  _exports.default = void 0;
  /* jshint module: true */

  var SupportsCSSAccentColor = false; // CSS.supports('color', 'AccentColor');
  var SupportsNativeAccentColor = SupportsCSSAccentColor || _servicelocator.appHost.supports('systemaccentcolor');
  var currentThemeCSSLoaders;
  var currentThemeId;
  var currentThemeInfo;
  var currentThemeController;
  var SupportsCssVariables = CSS.supports('color', 'var(--fake-var)');
  function unloadTheme() {
    var cssLoaders = currentThemeCSSLoaders;
    if (cssLoaders) {
      var _currentThemeControll;
      for (var i = 0, length = cssLoaders.length; i < length; i++) {
        cssLoaders[i].destroy();
      }
      currentThemeId = null;
      currentThemeInfo = null;
      (_currentThemeControll = currentThemeController) == null || _currentThemeControll.destroy();
      currentThemeController = null;
    }
  }
  var defaultSettingsThemeIsMainTheme = !SupportsCssVariables || _servicelocator.appHost.supports('multiserver');
  //defaultSettingsThemeIsMainTheme = true;

  function isConditionSupported(c) {
    switch (c) {
      case 'cssvariables':
        return SupportsCssVariables;
      default:
        return _servicelocator.appHost.supports(c);
    }
  }
  function isThemeSupported(t) {
    var requires = t.requires || [];
    return requires.filter(isConditionSupported).length === requires.length;
  }
  var DefaultController = './modules/themes/themecontroller.js';
  var DefaultTheme = (_servicelocator.appHost.getPreferredTheme && _servicelocator.appHost.getPreferredTheme() === 'windows' ? 'windows' : null) || 'dark';
  function setThemeProperties(t) {
    t.isDefault = t.id === DefaultTheme;
  }
  var DarkContentContainerStylesheets = [{
    path: 'modules/themes/common/darkcontentcontainer_item.css',
    options: {
      tv: false,
      cssvars: true
    }
  }, {
    path: 'modules/themes/common/darkcontentcontainer.css',
    options: {
      cssvars: true
    }
  }, {
    path: 'modules/themes/common/darkcontentcontainer_nontv.css',
    options: {
      tv: false,
      cssvars: true
    }
  }, {
    path: 'modules/themes/common/darkcontentcontainer_tv.css',
    options: {
      cssvars: true,
      tv: true
    }
  }];
  var DarkGradientStylesheets = [{
    path: 'modules/themes/darkgradient/theme.css',
    options: {
      cssvars: true
    }
  }, {
    path: 'modules/themes/darkgradient/theme_nontv.css',
    options: {
      cssvars: true,
      tv: false
    }
  }, {
    path: 'modules/themes/darkgradient/theme_tv.css',
    options: {
      cssvars: true,
      tv: true
    }
  }, {
    path: 'modules/themes/darkgradient/theme_tv_nocssvars.css',
    options: {
      cssvars: false,
      tv: true,
      polyfillcssvars: true
    }
  }].concat(DarkContentContainerStylesheets);
  var AllThemes = [{
    name: 'Apple TV',
    id: 'appletv',
    controller: DefaultController,
    infoPath: 'modules/themes/appletv/theme.json',
    requires: ['cssvariables'],
    stylesheets: [{
      path: 'modules/themes/appletv/theme.css',
      options: {}
    }, {
      path: 'modules/themes/appletv/theme_nontv.css',
      options: {
        tv: false
      }
    }, {
      path: 'modules/themes/appletv/theme_tv.css',
      options: {
        tv: true
      }
    }].concat(DarkContentContainerStylesheets)
  }, {
    name: 'Black',
    id: 'black',
    controller: DefaultController,
    infoPath: 'modules/themes/black/theme.json',
    requires: ['cssvariables'],
    stylesheets: [{
      path: 'modules/themes/black/theme.css',
      options: {}
    }, {
      path: 'modules/themes/black/theme_nontv.css',
      options: {
        tv: false
      }
    }, {
      path: 'modules/themes/black/theme_tv.css',
      options: {
        tv: true
      }
    }].concat(DarkContentContainerStylesheets)
  }, {
    name: 'Blue Radiance',
    id: 'blueradiance',
    controller: DefaultController,
    infoPath: 'modules/themes/darkgradient/theme.json',
    baseThemeId: 'darkgradient',
    stylesheets: DarkGradientStylesheets
  }, {
    name: 'Dark',
    id: 'dark',
    controller: DefaultController,
    infoPath: 'modules/themes/dark/theme.json',
    isDefault: true,
    stylesheets: [{
      path: 'modules/themes/dark/theme.css',
      options: {
        cssvars: true
      }
    }, {
      path: 'modules/themes/dark/theme_nontv.css',
      options: {
        cssvars: true,
        tv: false
      }
    }, {
      path: 'modules/themes/dark/theme_tv.css',
      options: {
        cssvars: true,
        tv: true
      }
    }, {
      path: 'modules/themes/dark/theme_tv_nocssvars.css',
      options: {
        cssvars: false,
        tv: true,
        polyfillcssvars: true
      }
    }].concat(DarkContentContainerStylesheets)
  }, {
    name: 'Light',
    id: 'light',
    controller: DefaultController,
    infoPath: 'modules/themes/light/theme.json',
    requires: ['cssvariables'],
    isSettingsDefault: !defaultSettingsThemeIsMainTheme,
    stylesheets: [{
      path: 'modules/themes/light/theme.css',
      options: {}
    }, {
      path: 'modules/themes/light/theme_nontv.css',
      options: {
        tv: false
      }
    }, {
      path: 'modules/themes/light/theme_tv.css',
      options: {
        tv: true
      }
    }].concat(DarkContentContainerStylesheets)
  }, {
    name: 'Superman',
    id: 'superman',
    controller: DefaultController,
    infoPath: 'modules/themes/darkgradient/theme.json',
    requires: ['cssvariables'],
    baseThemeId: 'darkgradient',
    stylesheets: DarkGradientStylesheets
  }, {
    name: 'Windows',
    id: 'windows',
    controller: './modules/themes/windows/windowsthemecontroller.js',
    infoPath: 'modules/themes/windows/theme.json',
    skipForSettingsthemes: true,
    requires: ['cssvariables', 'windowstheme'],
    stylesheets: [{
      path: 'modules/themes/windows/theme.css',
      options: {}
    }]
  }, {
    name: 'Windows Media Center',
    id: 'wmc',
    controller: DefaultController,
    infoPath: 'modules/themes/darkgradient/theme.json',
    requires: ['cssvariables'],
    baseThemeId: 'darkgradient',
    stylesheets: DarkGradientStylesheets
  }].filter(isThemeSupported);
  AllThemes.forEach(setThemeProperties);
  function getThemes() {
    return AllThemes.slice(0);
  }
  var skinManager = {
    loadSkin: loadSkin,
    getThemes: getThemes,
    getCurrentThemeId: function () {
      return currentThemeId;
    },
    getCurrentThemeInfo: function () {
      return currentThemeInfo;
    },
    getCurrentThemeController: function () {
      return currentThemeController;
    }
  };
  function loadSkin() {
    return skinManager.setTheme(_usersettings.default.theme());
  }
  function onRegistrationSuccess() {
    _appsettings.default.set('appthemesregistered', 'true');
  }
  function onRegistrationFailure() {
    _appsettings.default.set('appthemesregistered', 'false');
  }
  function isRegistered() {
    Emby.importModule('./modules/registrationservices/registrationservices.js').then(function (registrationServices) {
      registrationServices.validateFeature('themes', {
        showDialog: false
      }).then(onRegistrationSuccess, onRegistrationFailure);
    });
    return _appsettings.default.get('appthemesregistered') !== 'false';
  }
  function getThemeLoadInfo(id, isSettings, requiresRegistration) {
    if (!id && !isSettings) {
      var apiClient = _connectionmanager.default.currentApiClient();
      if (!(apiClient != null && apiClient.getCurrentUserId())) {
        id = _appsettings.default.get('lastTheme');
      }
    }
    var themes = skinManager.getThemes();
    var defaultMainTheme;
    var defaultSettingsTheme;
    var selectedTheme;
    for (var i = 0, length = themes.length; i < length; i++) {
      var theme = themes[i];
      if (theme.isDefault) {
        defaultMainTheme = theme;
      } else if (theme.isSettingsDefault) {
        defaultSettingsTheme = theme;
      }
      if (id === theme.id) {
        selectedTheme = theme;
      }
    }
    if (defaultSettingsThemeIsMainTheme) {
      defaultSettingsTheme = defaultMainTheme;
    }
    var defaultTheme = isSettings && id !== 'maintheme' ? defaultSettingsTheme : defaultMainTheme;
    selectedTheme = selectedTheme || defaultTheme;
    if (selectedTheme.id !== defaultTheme.id && requiresRegistration && !isRegistered()) {
      selectedTheme = defaultTheme;
    }
    return {
      themeId: selectedTheme.id,
      controller: selectedTheme.controller,
      theme: selectedTheme
    };
  }
  function getAllAccentColors() {
    var list = [];
    list.push({
      dark: {
        primaryColorHue: '209',
        primaryColorSaturation: '100%',
        primaryColorLightness: '50.2%',
        text: 'hsl(var(--theme-primary-color-hue), var(--theme-primary-color-saturation), var(--theme-primary-color-lightness))'
      },
      light: {
        primaryColorHue: '211',
        primaryColorSaturation: '100%',
        primaryColorLightness: '50%',
        text: 'hsl(var(--theme-primary-color-hue), var(--theme-primary-color-saturation), var(--theme-primary-color-lightness))'
      },
      name: 'blue'
    });
    list.push({
      dark: {
        primaryColorHue: '320',
        primaryColorSaturation: '100%',
        primaryColorLightness: '47.45%',
        text: 'hotpink'
      },
      light: {
        primaryColorHue: '320',
        primaryColorSaturation: '100%',
        primaryColorLightness: '47.45%',
        text: 'hsl(var(--theme-primary-color-hue), var(--theme-primary-color-saturation), var(--theme-primary-color-lightness))'
      },
      name: 'pink'
    });
    list.push({
      dark: {
        primaryColorHue: '262',
        primaryColorSaturation: '51.87%',
        primaryColorLightness: '47.25%',
        text: 'mediumpurple'
      },
      light: {
        primaryColorHue: '262',
        primaryColorSaturation: '51.87%',
        primaryColorLightness: '47.25%',
        text: 'hsl(var(--theme-primary-color-hue), var(--theme-primary-color-saturation), var(--theme-primary-color-lightness))'
      },
      name: 'purple'
    });
    list.push({
      dark: {
        primaryColorHue: '0',
        primaryColorSaturation: '60%',
        primaryColorLightness: '50%',
        text: 'red'
      },
      light: {
        primaryColorHue: '0',
        primaryColorSaturation: '60%',
        primaryColorLightness: '50%',
        text: 'hsl(var(--theme-primary-color-hue), var(--theme-primary-color-saturation), var(--theme-primary-color-lightness))'
      },
      name: 'red'
    });
    list.push({
      dark: {
        primaryColorHue: '16',
        primaryColorSaturation: '100%',
        primaryColorLightness: '50%',
        text: 'orangered'
      },
      light: {
        primaryColorHue: '16',
        primaryColorSaturation: '100%',
        primaryColorLightness: '50%',
        text: 'orangered'
      },
      name: 'orangered'
    });
    list.push({
      dark: {
        primaryColorHue: '116',
        primaryColorSaturation: '41.7%',
        primaryColorLightness: '50.2%',
        text: '#6CCF65',
        // blue - don't make the emby green obnoxious by putting it everywhere
        textAlt: 'hsl(209, 100%, 50.2%)'
      },
      light: {
        primaryColorHue: '116',
        primaryColorSaturation: '41.7%',
        primaryColorLightness: '50.2%',
        text: 'green',
        // blue - don't make the emby green obnoxious by putting it everywhere
        textAlt: 'hsl(211, 100%, 50%)'
      },
      name: 'emby'
    });
    list.push({
      dark: {
        primaryColorHue: '116',
        primaryColorSaturation: '41.7%',
        primaryColorLightness: '50.2%',
        text: '#6CCF65'
      },
      light: {
        primaryColorHue: '116',
        primaryColorSaturation: '41.7%',
        primaryColorLightness: '50.2%',
        text: 'green'
      },
      name: 'green'
    });
    if (SupportsNativeAccentColor) {
      var _getSystemAccent;
      var accent = (_getSystemAccent = getSystemAccent()) == null ? void 0 : _getSystemAccent.accentColor;
      if (accent) {
        list.push({
          dark: {
            primaryColorHue: accent.hue,
            primaryColorSaturation: accent.saturation + '%',
            primaryColorLightness: accent.lightness + '%',
            text: 'hsl(' + accent.hue + ', ' + accent.saturation + '%, ' + accent.lightness + '%)'
          },
          light: {
            primaryColorHue: accent.hue,
            primaryColorSaturation: accent.saturation + '%',
            primaryColorLightness: accent.lightness + '%',
            text: 'hsl(' + accent.hue + ', ' + accent.saturation + '%, ' + accent.lightness + '%)'
          },
          name: 'system'
        });
      }
    }
    return list;
  }
  var RGBToHSL = function (r, g, b) {
    r /= 255;
    g /= 255;
    b /= 255;
    var l = Math.max(r, g, b);
    var s = l - Math.min(r, g, b);
    var h = s ? l === r ? (g - b) / s : l === g ? 2 + (b - r) / s : 4 + (r - g) / s : 0;
    return [60 * h < 0 ? 60 * h + 360 : 60 * h, 100 * (s ? l <= 0.5 ? s / (2 * l - s) : s / (2 - (2 * l - s)) : 0), 100 * (2 * l - s) / 2];
  };
  function getHslFromCSSProp(prop) {
    var div = document.createElement('div');
    div.style.color = prop;
    document.body.appendChild(div);
    var color = getComputedStyle(div).getPropertyValue('color');
    div.remove();
    var hue;
    var saturation;
    var lightness;
    if (color.startsWith('rgb(')) {
      color = color.replace('rgb(', '').replace(')');
      var parts = color.split(',');
      var hsl = RGBToHSL(parseInt(parts[0]), parseInt(parts[1]), parseInt(parts[2]));
      hue = hsl[0];
      saturation = hsl[1];
      lightness = hsl[2];
    }
    return {
      hue: hue,
      saturation: saturation,
      lightness: lightness
    };
  }
  function getSystemAccentFromCSS() {
    var accentColor = getHslFromCSSProp('AccentColor');
    return {
      accentColor: accentColor,
      accentColorText: accentColor
    };
  }
  function getSystemAccent() {
    if (SupportsCSSAccentColor) {
      return getSystemAccentFromCSS();
    }

    // get from somewhere else if applicable (e.g. native api)
    if (_servicelocator.appHost.supports('systemaccentcolor')) {
      return _servicelocator.appHost.getSystemAccentColor();
    }
    return null;
  }
  function createAccentNode() {
    var link = document.createElement('style');
    link.type = 'text/css';
    var list = getAllAccentColors();
    var html = '';
    for (var i = 0, length = list.length; i < length; i++) {
      var accent = list[i];
      html += ' .accent-' + accent.name + ':root {';
      html += '--theme-primary-color-hue: ' + accent.light.primaryColorHue + ';';
      html += '--theme-primary-color-saturation: ' + accent.light.primaryColorSaturation + ';';
      html += '--theme-primary-color-lightness: ' + accent.light.primaryColorLightness + ';';
      html += '--theme-accent-text-color-darkbg: ' + accent.dark.text + ';';
      html += '--theme-accent-text-color-lightbg: ' + accent.light.text + ';';
      html += '--theme-accent-text-color-darkbg-alt: ' + (accent.dark.textAlt || accent.dark.text) + ';';
      html += '--theme-accent-text-color-lightbg-alt: ' + (accent.light.textAlt || accent.light.text) + ';';
      html += '}';
    }
    link.innerHTML = html;
    return link;
  }
  function setThemeOptionClassname(value, prefix) {
    var elem = document.documentElement;
    var classesToRemove = [];
    for (var i = 0, length = elem.classList.length; i < length; i++) {
      var className = elem.classList[i];
      if (className.startsWith(prefix)) {
        classesToRemove.push(className);
      }
    }
    for (var _i = 0, _length = classesToRemove.length; _i < _length; _i++) {
      elem.classList.remove(classesToRemove[_i]);
    }
    elem.classList.add(prefix + value);
  }
  var accentNode;
  function loadAccentColor() {
    if (!accentNode) {
      accentNode = createAccentNode();
      (document.head || document.querySelector('head')).appendChild(accentNode);
    }
    var defaultAccent = 'emby';
    var accent = _usersettings.default.accentColor() || defaultAccent;
    if (_usersettings.default.useSystemAccentColor() && SupportsNativeAccentColor) {
      accent = 'system';
    }
    if (accent !== 'emby') {
      if (!isRegistered()) {
        return;
      }
    }
    var elem = document.documentElement;
    var classesToRemove = [];
    for (var i = 0, length = elem.classList.length; i < length; i++) {
      var className = elem.classList[i];
      if (className.startsWith('accent-')) {
        classesToRemove.push(className);
      }
    }
    for (var _i2 = 0, _length2 = classesToRemove.length; _i2 < _length2; _i2++) {
      elem.classList.remove(classesToRemove[_i2]);
    }
    setThemeOptionClassname(accent, 'accent-');
  }
  function onThemeLoaded(themeLoadInfo, updateLastTheme) {
    if (updateLastTheme) {
      _appsettings.default.set('lastTheme', themeLoadInfo.themeId);
    }
    return Emby.importModule(themeLoadInfo.controller).then(function (ThemeController) {
      currentThemeController = new ThemeController();
      var infoPath = themeLoadInfo.theme.infoPath;
      infoPath = 'text!./' + infoPath;
      return require([infoPath]).then(function (responses) {
        currentThemeInfo = JSON.parse(responses[0]);
        currentThemeInfo.id = themeLoadInfo.themeId;
        try {
          _servicelocator.appHost.setTheme(currentThemeInfo);
        } catch (err) {
          console.error('Error setting theme color: ', err);
        }
        loadAccentColor();
        return currentThemeController.load(currentThemeInfo).then(function () {
          _events.default.trigger(skinManager, 'themeloaded', [{
            themeInfo: currentThemeInfo
          }]);
        });
      });
    });
  }
  function enableIfNeeded(c) {
    return c.enableIfNeeded();
  }
  skinManager.setTheme = function (id, context) {
    var requiresRegistration = true;
    var isSettings = context === 'settings';
    var updateLastTheme = !isSettings;
    if (id === 'auto' && _servicelocator.appHost.getPreferredTheme) {
      id = _servicelocator.appHost.getPreferredTheme() || 'dark';
      requiresRegistration = false;
    }
    if (currentThemeId && currentThemeId === id) {
      return Promise.resolve();
    }
    var themeLoadInfo = getThemeLoadInfo(id, isSettings, requiresRegistration);
    if (currentThemeId && currentThemeId === themeLoadInfo.themeId) {
      loadAccentColor();
      return Promise.resolve();
    }
    var cssLoaders = [];
    var stylesheets = themeLoadInfo.theme.stylesheets;
    for (var i = 0, length = stylesheets.length; i < length; i++) {
      cssLoaders.push(new _cssloader.default(stylesheets[i].path, stylesheets[i].options));
    }
    unloadTheme();
    currentThemeCSSLoaders = cssLoaders;
    return Promise.all(cssLoaders.map(enableIfNeeded)).then(function () {
      var promise = onThemeLoaded(themeLoadInfo, updateLastTheme);
      currentThemeId = themeLoadInfo.themeId;
      setThemeOptionClassname(currentThemeId, 'theme-');
      return promise;
    });
  };
  var defaultLogoImageTypes = ['Logo'];
  skinManager.getPreferredLogoImageTypes = function () {
    var info = currentThemeInfo;
    return info ? info.preferredLogoImageTypes || defaultLogoImageTypes : defaultLogoImageTypes;
  };
  function changeTheme(viewType) {
    var context;
    var mainTheme = _usersettings.default.theme();
    if (viewType === 1) {
      context = 'settings';
      var settingsTheme = _usersettings.default.settingsTheme();
      if (!settingsTheme && defaultSettingsThemeIsMainTheme) {
        settingsTheme = 'maintheme';
      }
      if (settingsTheme === 'maintheme' && mainTheme) {
        settingsTheme = mainTheme;
      }
      skinManager.setTheme(settingsTheme, context);
      return;
    }
    skinManager.setTheme(mainTheme, context);
  }
  var currentThemeType;
  function onThemeSettingChange(e, name) {
    if (name === 'appTheme' || name === 'settingsTheme') {
      changeTheme(currentThemeType);
    } else if (name === 'accentColor') {
      loadAccentColor();
    }
  }
  document.addEventListener('viewbeforeshow', function (e) {
    var _e$detail$params;
    if (((_e$detail$params = e.detail.params) == null ? void 0 : _e$detail$params.asDialog) === 'true') {
      return;
    }

    // secondaryHeaderFeatures is a lazy attempt to detect the startup wizard
    var viewType = e.detail.settingsTheme ? 1 : 0;
    if (viewType !== currentThemeType) {
      currentThemeType = viewType;
      changeTheme(viewType);
    }
  });
  _events.default.on(_usersettings.default, 'change', onThemeSettingChange);
  _events.default.on(_connectionmanager.default, 'localusersignedin', function (e) {
    currentThemeType = null;
  });
  var _default = _exports.default = skinManager;
});
