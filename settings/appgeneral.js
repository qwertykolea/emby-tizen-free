define(["exports", "./../modules/emby-apiclient/connectionmanager.js", "./../modules/viewmanager/basesettingsview.js", "./../modules/common/globalize.js", "./../modules/common/servicelocator.js", "./../modules/common/pluginmanager.js", "./../modules/emby-elements/emby-scroller/emby-scroller.js", "./../modules/emby-elements/emby-select/emby-select.js", "./../modules/emby-elements/emby-button/emby-button.js", "./../modules/emby-elements/emby-input/emby-input.js", "./../modules/emby-elements/emby-toggle/emby-toggle.js", "./../modules/emby-elements/emby-slider/emby-slider.js", "./../modules/emby-elements/emby-premierecontainer/emby-premierecontainer.js"], function (_exports, _connectionmanager, _basesettingsview, _globalize, _servicelocator, _pluginmanager, _embyScroller, _embySelect, _embyButton, _embyInput, _embyToggle, _embySlider, _embyPremierecontainer) {
  Object.defineProperty(_exports, "__esModule", {
    value: true
  });
  _exports.default = void 0;
  /* jshint module: true */

  var appMode = globalThis.appMode;
  function fillSlideshowLengths(select) {
    var options = [5, 10, 15, 20, 25, 30];
    var formatter = new Intl.DurationFormat(_globalize.default.getCurrentLocales(), {
      style: 'long'
    });
    select.innerHTML = options.map(function (option) {
      return {
        name: formatter.format({
          seconds: option
        }),
        value: option * 1000
      };
    }).map(function (o) {
      return '<option value="' + o.value + '">' + o.name + '</option>';
    }).join('');
  }
  function fillScreensavers(context) {
    var selectScreensaver = context.querySelector('.selectScreensaver');
    var options = _pluginmanager.default.ofType('screensaver').map(function (plugin) {
      return {
        name: plugin.name,
        value: plugin.id
      };
    });
    options.unshift({
      name: _globalize.default.translate('None'),
      value: 'none'
    });
    selectScreensaver.innerHTML = options.map(function (o) {
      return '<option value="' + o.value + '">' + o.name + '</option>';
    }).join('');
  }
  function fillSoundEffects(context) {
    var selectSoundEffects = context.querySelector('.selectSoundEffects');
    var options = _pluginmanager.default.ofType('soundeffects').map(function (plugin) {
      return {
        name: plugin.name,
        value: plugin.id
      };
    });
    options.unshift({
      name: _globalize.default.translate('None'),
      value: 'none'
    });
    selectSoundEffects.innerHTML = options.map(function (o) {
      return '<option value="' + o.value + '">' + o.name + '</option>';
    }).join('');
  }
  function normalizeCardSize(cardSize) {
    switch (cardSize) {
      case 'normal':
      case 'default':
        return '';
      default:
        return cardSize;
    }
  }
  function onLayoutModeChange(e) {
    var context = e.target.closest('.settingsContainer');
    var selectCardSize = context.querySelector('.selectCardSize');
    this.setFieldValue(selectCardSize, normalizeCardSize('normal'), true);
    var selectFontSize = context.querySelector('.selectFontSize');
    this.setFieldValue(selectFontSize, '', true);
  }
  function showHideFields(context) {}
  function onSubmit(e) {
    // Disable default form submission
    e.preventDefault();
    return false;
  }
  function getSignedInUsers(apiClient) {
    if (!apiClient) {
      return Promise.resolve([]);
    }
    if (!_servicelocator.appHost.supports('multiserver')) {
      return Promise.resolve([]);
    }
    if (_connectionmanager.default.isLoggedIntoConnect()) {
      return Promise.resolve([]);
    }
    return _connectionmanager.default.getSignedInUsers(apiClient);
  }
  function fillStartupBehavior(context) {
    var apiClient = _connectionmanager.default.currentApiClient();
    return getSignedInUsers(apiClient).then(function (signedInUsers) {
      var selectStartupBehavior = context.querySelector('.selectStartupBehavior');
      var html = '';
      html += '<option value="lastuser">' + _globalize.default.translate('RememberLastUser') + '</option>';
      if (apiClient && !_connectionmanager.default.isLoggedIntoConnect()) {
        for (var i = 0, length = signedInUsers.length; i < length; i++) {
          var user = signedInUsers[i];
          var value = apiClient.serverId() + '|' + user.Id;
          html += '<option value="' + value + '">' + _globalize.default.translate('SignInAsValue', user.Name) + '</option>';
        }
      }
      html += '<option value="showlogin">' + _globalize.default.translate('ShowLoginScreen') + '</option>';
      selectStartupBehavior.innerHTML = html;
    });
  }
  function loadData(options) {
    var context = options.element;
    showHideFields(context);
    return fillStartupBehavior(context);
  }
  function setPremiereText(elem, key) {
    if (!_servicelocator.appHost.supports('externallinks') || !_servicelocator.appHost.supports('externalpremium')) {
      elem.innerHTML = _globalize.default.translate(key, '', '');
    } else {
      elem.innerHTML = _globalize.default.translate(key, '<a is="emby-linkbutton" href="https://emby.media/premiere" data-preset="premiereinfo" target="_blank" class="button-link">', '</a>');
    }
  }
  function fillLanguages(select) {
    var options = select.options;
    var displayNames = new Intl.DisplayNames(_globalize.default.getCurrentLocales(), {
      type: 'language',
      fallback: 'none',
      languageDisplay: 'standard'
    });
    for (var i = 0, length = options.length; i < length; i++) {
      var option = options[i];
      var code = option.value;
      if (!code) {
        continue;
      }
      try {
        var displayName = displayNames.of(code);
        if (displayName) {
          option.innerHTML = displayName;
        }
      } catch (err) {
        console.error('error thrown by Intl.DisplayNames. Code: ' + code, err);
      }
    }
  }
  function View(view, params) {
    _basesettingsview.default.apply(this, arguments);
    var options = {
      element: view.querySelector('.settingsContainer')
    };
    this.settingsOptions = options;
    fillSlideshowLengths(view.querySelector('.selectSlidehowInterval'));
    fillScreensavers(view);
    fillSoundEffects(view);
    fillLanguages(view.querySelector('.selectLanguage'));
    fillLanguages(view.querySelector('.selectDateTimeLocale'));
    setPremiereText(view.querySelector('.displayModePremiere'), 'PlaybackTvModeRequiresEmbyPremiere');
    options.element.querySelector('.chkTVDisplayMode').addEventListener('change', onLayoutModeChange.bind(this));
    options.element.querySelector('form').addEventListener('submit', onSubmit.bind(options));
  }
  Object.assign(View.prototype, _basesettingsview.default.prototype);
  View.prototype.loadSettingsInternal = function () {
    var instance = this;
    return loadData(instance.settingsOptions).then(function () {
      return instance.loadAutoSettings().then(function () {
        if (appMode === 'embyclient') {
          instance.settingsOptions.element.querySelector('.fldSoundEffects').classList.remove('hide');
          return Promise.resolve();
        }
      });
    });
  };
  function revertToNoneIfNeeded(elem, value) {
    if (!value) {
      return 'none';
    }
    var option = elem.querySelector('option[value="' + value + '"]');
    if (!option) {
      return 'none';
    }
    return value;
  }
  View.prototype.getSettingValueFromOwner = function (elem, owner, memberInfo) {
    switch (memberInfo.member) {
      case 'soundEffects':
        return revertToNoneIfNeeded(this.view.querySelector('.selectSoundEffects'), _basesettingsview.default.prototype.getSettingValueFromOwner.apply(this, arguments));
      case 'screensaver':
        return revertToNoneIfNeeded(this.view.querySelector('.selectScreensaver'), _basesettingsview.default.prototype.getSettingValueFromOwner.apply(this, arguments));
      case 'cardSize':
        return normalizeCardSize(_basesettingsview.default.prototype.getSettingValueFromOwner.apply(this, arguments));
      default:
        return _basesettingsview.default.prototype.getSettingValueFromOwner.apply(this, arguments);
    }
  };
  View.prototype.destroy = function () {
    _basesettingsview.default.prototype.destroy.apply(this, arguments);
    this.settingsOptions = null;
  };
  var _default = _exports.default = View;
});
