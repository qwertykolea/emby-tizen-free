define(["exports", "./../modules/viewmanager/basesettingsview.js", "./../modules/common/globalize.js", "./../modules/emby-elements/emby-input/emby-input.js", "./../modules/emby-elements/emby-button/emby-button.js", "./../modules/emby-elements/emby-select/emby-select.js", "./../modules/emby-elements/emby-scroller/emby-scroller.js", "./../modules/emby-elements/emby-slider/emby-slider.js", "./../modules/emby-elements/emby-toggle/emby-toggle.js", "./../modules/emby-elements/emby-premierecontainer/emby-premierecontainer.js", "./../modules/skinmanager.js", "./../modules/common/servicelocator.js", "./../modules/emby-apiclient/events.js"], function (_exports, _basesettingsview, _globalize, _embyInput, _embyButton, _embySelect, _embyScroller, _embySlider, _embyToggle, _embyPremierecontainer, _skinmanager, _servicelocator, _events) {
  Object.defineProperty(_exports, "__esModule", {
    value: true
  });
  _exports.default = void 0;
  /* jshint module: true */

  function fillThemes(select, isSettings) {
    var themes = _skinmanager.default.getThemes();
    var defaultFound = false;
    for (var i = 0, length = themes.length; i < length; i++) {
      var theme = themes[i];
      var value = theme.id;
      if (theme.isDefault && !isSettings) {
        value = '';
        defaultFound = true;
      } else if (theme.isSettingsDefault && isSettings) {
        value = '';
        defaultFound = true;
      }
      theme.value = value;
    }
    if (isSettings) {
      themes = themes.filter(function (e) {
        return !e.skipForSettingsthemes;
      });
      var mainThemeId = 'maintheme';
      var mainThemeValue = mainThemeId;
      if (isSettings && !defaultFound) {
        mainThemeValue = '';
      }
      themes.unshift({
        name: _globalize.default.translate('SameAsMainTheme'),
        id: mainThemeId,
        value: mainThemeValue,
        isSettingsDefault: _servicelocator.appHost.supports('multiserver')
      });
    }
    select.innerHTML = themes.map(function (t) {
      return '<option value="' + t.value + '">' + t.name + '</option>';
    }).join('');
  }
  function showHideThemeSettingsButton(btnThemeSettings) {
    var controller = _skinmanager.default.getCurrentThemeController();
    if (controller != null && controller.hasSettings && controller.hasSettings()) {
      btnThemeSettings.classList.remove('hide');
    } else {
      btnThemeSettings.classList.add('hide');
    }
  }
  function showThemeSettings() {
    var controller = _skinmanager.default.getCurrentThemeController();
    if (controller != null && controller.hasSettings && controller.hasSettings()) {
      controller.showSettings();
    }
  }
  function onThemeLoaded() {
    var btnThemeSettings = this.view.querySelector('.btnThemeSettings');
    showHideThemeSettingsButton(btnThemeSettings);
  }
  function onSubmit(e) {
    // Disable default form submission
    e.preventDefault();
    return false;
  }
  function setPremiereText(elem, key) {
    if (!_servicelocator.appHost.supports('externallinks') || !_servicelocator.appHost.supports('externalpremium')) {
      elem.innerHTML = _globalize.default.translate(key, '', '');
    } else {
      elem.innerHTML = _globalize.default.translate(key, '<a is="emby-linkbutton" href="https://emby.media/premiere" data-preset="premiereinfo" target="_blank" class="button-link">', '</a>');
    }
  }
  function View(view, params) {
    _basesettingsview.default.apply(this, arguments);
    view.querySelector('form').addEventListener('submit', onSubmit.bind(this));
    var featurePremiereInfo = view.querySelectorAll('.featurePremiereInfo');
    for (var i = 0, length = featurePremiereInfo.length; i < length; i++) {
      setPremiereText(featurePremiereInfo[i], 'FeatureRequiresEmbyPremiere');
    }
    var selectTheme = view.querySelector('.selectTheme');
    var selectSettingsTheme = view.querySelector('.selectSettingsTheme');
    var btnThemeSettings = view.querySelector('.btnThemeSettings');
    btnThemeSettings.addEventListener('click', showThemeSettings);
    fillThemes(selectTheme);
    fillThemes(selectSettingsTheme, true);
    showHideThemeSettingsButton(btnThemeSettings);
    this.boundonThemeLoaded = onThemeLoaded.bind(this);
    _events.default.on(_skinmanager.default, 'themeloaded', this.boundonThemeLoaded);
  }
  Object.assign(View.prototype, _basesettingsview.default.prototype);
  View.prototype.loadSettingsInternal = function () {
    return this.loadAutoSettings();
  };
  View.prototype.getUserConfigurationUserId = function () {
    return this.params.userId || this.getApiClient().getCurrentUserId();
  };
  View.prototype.destroy = function () {
    _basesettingsview.default.prototype.destroy.apply(this, arguments);
    if (this.boundonThemeLoaded) {
      _events.default.off(_skinmanager.default, 'themeloaded', this.boundonThemeLoaded);
      this.boundonThemeLoaded = null;
    }
  };
  var _default = _exports.default = View;
});
