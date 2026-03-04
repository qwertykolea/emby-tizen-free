define(["exports", "./../layoutmanager.js", "./../common/appsettings.js", "./../common/servicelocator.js", "./../common/usersettings/usersettings.js", "./../common/usersettings/usersettingsbuilder.js", "./../common/datetime.js", "./../common/globalize.js", "./../common/responsehelper.js", "./../emby-apiclient/connectionmanager.js", "./../loading/loading.js"], function (_exports, _layoutmanager, _appsettings, _servicelocator, _usersettings, _usersettingsbuilder, _datetime, _globalize, _responsehelper, _connectionmanager, _loading) {
  Object.defineProperty(_exports, "__esModule", {
    value: true
  });
  _exports.default = void 0;
  /* jshint module: true */

  function BaseSettingsContainer(view) {
    this.view = view;
    this.view.addEventListener('change', onFieldChange.bind(this));
  }
  BaseSettingsContainer.prototype.settingsOnResume = function (options) {
    if (options != null && options.refresh) {
      this.loadSettings(options);
    }
  };
  function onFieldChange(e) {
    var _e$detail;
    if (((_e$detail = e.detail) == null ? void 0 : _e$detail.isUserChange) === false) {
      return;
    }
    var elem = e.target.closest('.autoSetting.autoSave');
    if (!elem) {
      return;
    }
    var instance = this;

    // this is for the display mode option, so that the layout doesn't change in the middle of the dropdown being open
    if (elem.getAttribute('data-changedelay') === 'true') {
      setTimeout(function () {
        instance.saveAutoSetting(elem, {}, true).catch(_responsehelper.default.handleErrorResponse);
      }, 300);
    } else {
      instance.saveAutoSetting(elem, {}, true).catch(_responsehelper.default.handleErrorResponse);
    }
    showHideFieldsFeatureChecksOnContainer(instance, instance.view, false, true);
  }
  BaseSettingsContainer.prototype.loadSettings = function (options) {
    var instance = this;
    return this.loadSettingsInternal().then(function () {
      if (options.autoFocus) {
        instance.autoFocus({
          skipIfNotEnabled: true
        });
      }
    });
  };
  BaseSettingsContainer.prototype.getSettingValueFromOwner = function (elem, owner, memberInfo) {
    switch (memberInfo.member) {
      case 'getEnableLogoAsTitle':
        return owner.getEnableLogoAsTitle(_globalize.default.getCurrentLocale());
      case 'showDetailPoster':
        return owner.showDetailPoster(_layoutmanager.default.tv);
      case 'forceTranscodingForContainer':
        return owner.forceTranscodingForContainer(elem.getAttribute('data-id'));
      case 'forceTranscodingForVideoCodec':
        return owner.forceTranscodingForVideoCodec(elem.getAttribute('data-id'));
      default:
        break;
    }
    switch (memberInfo.type) {
      case 'field':
        return owner[memberInfo.member];
      case 'usersettingsfield':
        return this.getNamedSettingsOwner('usersettings').get(memberInfo.member);
      case 'method':
        return owner[memberInfo.member]();
      default:
        throw new Error('unknown member type: ' + memberInfo.type);
    }
  };
  function getListDelimiter(elem) {
    return elem.getAttribute('data-delimiter') || ',';
  }
  function getListId(elem) {
    return elem.getAttribute('data-id');
  }
  function setCheckboxListValue(elem, value) {
    if (!Array.isArray(value)) {
      value = value.split(getListDelimiter(elem));
    }
    var checkboxes = elem.querySelectorAll('input[type="checkbox"]');
    for (var i = 0, length = checkboxes.length; i < length; i++) {
      var current = checkboxes[i];
      current.checked = value.includes(getListId(current));
    }
  }
  BaseSettingsContainer.prototype.setFieldValue = function (elem, value, triggerChange) {
    if (elem.type === 'checkbox') {
      elem.checked = value === true;
    } else if (elem.classList.contains('checkboxList') || elem.classList.contains('toggleList')) {
      setCheckboxListValue(elem, value);
    } else {
      // theme and settingsTheme at the very least need the coalescing
      if (value == null) {
        value = '';
      }
      switch (elem.tagName) {
        case 'SELECT':
          if (elem.hasAttribute('multiple')) {
            if (typeof value === 'string') {
              if (value) {
                var joinDelimiter = elem.getAttribute('data-joindelimiter');
                if (joinDelimiter) {
                  value = value.split(joinDelimiter);
                }
              } else {
                value = [];
              }
            }
            elem.values = Array.isArray(value) ? value : [value];
          } else {
            elem.singleValue = value.toString();
          }
          break;
        default:
          switch (elem.type) {
            case 'range':
              elem.setValue(value);
              break;
            default:
              elem.value = value;
              break;
          }
          break;
      }
    }
    if (triggerChange) {
      elem.dispatchEvent(new CustomEvent('change', {
        detail: {
          isUserChange: false
        },
        bubbles: true
      }));
    }
  };
  function getSettingMemberInfo(elem, isGet) {
    var field = elem.getAttribute('data-settingfield');
    if (field) {
      return {
        type: 'field',
        member: field
      };
    }
    var method;
    if (isGet) {
      method = elem.getAttribute('data-getsettingmethod');
    }
    if (!method) {
      method = elem.getAttribute('data-settingmethod');
    }
    if (method) {
      return {
        type: 'method',
        member: method
      };
    }
    field = elem.getAttribute('data-usersettingsfield');
    if (field) {
      return {
        type: 'usersettingsfield',
        member: field
      };
    }
    return null;
  }
  BaseSettingsContainer.prototype.loadAutoSetting = function (elem) {
    var owner = this.getSettingsOwner(elem);
    if (!owner) {
      return;
    }
    var memberInfo = getSettingMemberInfo(elem, true);
    if (memberInfo) {
      var value = this.getSettingValueFromOwner(elem, owner, memberInfo);
      this.setFieldValue(elem, value, elem.getAttribute('data-triggerchange') === 'true');
    }
  };
  BaseSettingsContainer.prototype.getSettingsOwner = function (elem) {
    var owner = elem.getAttribute('data-settingowner');
    return this.getNamedSettingsOwner(owner, elem);
  };
  BaseSettingsContainer.prototype.getNamedSettingsOwner = function (owner, elem) {
    switch (owner) {
      case 'layoutmanager':
        return _layoutmanager.default;
      case 'appsettings':
        return _appsettings.default;
      case 'subtitleappearancesettings':
        return this.getNamedSettingsOwner('usersettings', elem).getSubtitleAppearanceSettings();
      default:
        if (owner) {
          var objects = this.autoSettingsObjects;
          return objects ? objects[owner] : null;
        }
        return null;
    }
  };
  function getValueToSave(elem) {
    var value;
    if (elem.type === 'checkbox') {
      value = elem.checked;
    } else if (elem.classList.contains('checkboxList') || elem.classList.contains('toggleList')) {
      value = Array.prototype.map.call(elem.querySelectorAll('input[type="checkbox"]:checked'), getListId);
    } else {
      switch (elem.tagName) {
        case 'SELECT':
          if (elem.hasAttribute('multiple')) {
            value = elem.getValues();
            var joinDelimiter = elem.getAttribute('data-joindelimiter');
            if (joinDelimiter) {
              value = value.join(joinDelimiter);
            }
          } else {
            value = elem.value;
          }
          break;
        default:
          value = elem.value;
          break;
      }
    }
    return value;
  }
  BaseSettingsContainer.prototype.saveAutoSetting = function (elem, ownerObjects, sendUpdates) {
    var owner = this.getSettingsOwner(elem);
    if (!owner) {
      return Promise.resolve();
    }
    var value = getValueToSave(elem);
    var memberInfo = getSettingMemberInfo(elem);
    if (memberInfo) {
      return this.saveAutoSettingIntoOwner(elem, owner, memberInfo, value, ownerObjects, sendUpdates);
    }
    return Promise.resolve();
  };
  BaseSettingsContainer.prototype.getUserConfigurationUserId = function () {
    return this.getApiClient().getCurrentUserId();
  };
  BaseSettingsContainer.prototype.saveAutoSettingIntoOwner = function (elem, owner, memberInfo, value, ownerObjects, sendUpdates) {
    var ownerName = elem.getAttribute('data-settingowner');
    if (ownerName === 'userconfiguration') {
      var apiClient = this.getApiClient();
      var userId = this.getUserConfigurationUserId();
      var ownerObj = ownerObjects[ownerName];
      if (!ownerObj) {
        ownerObj = ownerObjects[ownerName] = {};
      }
      ownerObj[memberInfo.member] = value;
      if (sendUpdates !== false) {
        return apiClient.updatePartialUserConfiguration(userId, ownerObj);
      }
      return Promise.resolve();
    }
    if (ownerName === 'serverconfiguration') {
      var _apiClient = this.getApiClient();
      var _ownerObj = ownerObjects[ownerName];
      if (!_ownerObj) {
        _ownerObj = ownerObjects[ownerName] = {};
      }
      _ownerObj[memberInfo.member] = value;
      if (sendUpdates !== false) {
        return _apiClient.updatePartialServerConfiguration(_ownerObj);
      }
      return Promise.resolve();
    }
    switch (memberInfo.member) {
      case 'showDetailPoster':
        owner.showDetailPoster(_layoutmanager.default.tv, value);
        return Promise.resolve();
      case 'forceTranscodingForContainer':
        owner.forceTranscodingForContainer(elem.getAttribute('data-id'), value);
        return Promise.resolve();
      case 'forceTranscodingForVideoCodec':
        owner.forceTranscodingForVideoCodec(elem.getAttribute('data-id'), value);
        return Promise.resolve();
      default:
        break;
    }
    switch (memberInfo.type) {
      case 'field':
        owner[memberInfo.member] = value;
        break;
      case 'usersettingsfield':
        owner.set(memberInfo.member, value);
        break;
      case 'method':
        owner[memberInfo.member](value);
        break;
      default:
        throw new Error('unknown member type: ' + memberInfo.type);
    }
    if (ownerName === 'subtitleappearancesettings') {
      this.getNamedSettingsOwner('usersettings', elem).setSubtitleAppearanceSettings(owner);
    }
    return Promise.resolve();
  };
  function getUserSettings(instance) {
    var apiClient = instance.getApiClient();
    var userId = instance.getUserConfigurationUserId();
    var userSettings = userId === apiClient.getCurrentUserId() ? _usersettings.default : new _usersettingsbuilder.default();
    var promise = userId === apiClient.getCurrentUserId() ? Promise.resolve() : userSettings.setUserInfo(userId, apiClient);
    return promise.then(function () {
      return {
        key: 'usersettings',
        value: userSettings
      };
    });
  }
  function getUserConfiguration(instance) {
    return instance.getApiClient().getUser(instance.getUserConfigurationUserId()).then(function (user) {
      return {
        key: 'userconfiguration',
        value: user.Configuration
      };
    });
  }
  function getServerConfiguration(instance) {
    return instance.getApiClient().getServerConfiguration().then(function (config) {
      return {
        key: 'serverconfiguration',
        value: config
      };
    });
  }
  BaseSettingsContainer.prototype.getAutoSettingsObjectsPromises = function () {
    var list = [];
    if (this.view.querySelector('[data-settingowner="usersettings"],[data-settingowner="subtitleappearancesettings"]')) {
      list.push(getUserSettings(this));
    }
    if (this.view.querySelector('[data-settingowner="userconfiguration"]')) {
      list.push(getUserConfiguration(this));
    }
    if (this.view.querySelector('[data-settingowner="serverconfiguration"]')) {
      list.push(getServerConfiguration(this));
    }
    return list;
  };
  BaseSettingsContainer.prototype.sendUpdatesFromAutoSettingsObjects = function (ownerObjects) {
    var promises = [];
    var keys = Object.keys(ownerObjects);
    for (var i = 0, length = keys.length; i < length; i++) {
      var key = keys[i];
      var obj = ownerObjects[key];
      switch (key) {
        case 'serverconfiguration':
          promises.push(this.getApiClient().updatePartialServerConfiguration(obj));
          break;
        default:
          throw new Error('unknown key: ' + key);
      }
    }
    return Promise.all(promises);
  };
  BaseSettingsContainer.prototype.loadAutoSettingsObjects = function () {
    var instance = this;
    return Promise.all(this.getAutoSettingsObjectsPromises()).then(function (responses) {
      var objects = {};
      for (var i = 0, length = responses.length; i < length; i++) {
        var response = responses[i];
        if (response.key) {
          objects[response.key] = response.value;
        }
      }
      instance.autoSettingsObjects = objects;
    });
  };
  var SupportsCssVariables = CSS.supports('color', 'var(--fake-var)');
  var SupportsCalc = CSS.supports('width', 'min(45.2%,calc(100% - .65em))');
  var SupportsMin = CSS.supports('width', 'min(10em, 5vw)');
  function isCssFeatureSupported(feature) {
    switch (feature) {
      case 'calc':
        return SupportsCalc;
      case 'min':
        return SupportsMin;
      case 'cssvars':
        return SupportsCssVariables;
      default:
        return false;
    }
  }
  function isAppHostFeatureSupported(feature) {
    return _servicelocator.appHost.supports(feature);
  }
  function showHideFieldsFeatureChecksOnElements(instance, elems) {
    var anyVisible;
    for (var i = 0, length = elems.length; i < length; i++) {
      var elem = elems[i];
      if (instance.isFieldVisible(elem)) {
        elem.classList.remove('hide');
        anyVisible = true;
      } else {
        elem.classList.add('hide');
      }
    }
    return anyVisible;
  }
  function showHideFieldsFeatureChecksOnContainer(instance, container, allFields, fieldsWithMatchRules) {
    var anyVisible1;
    if (allFields) {
      var elems = container.querySelectorAll('.autoSetting-autohide');
      anyVisible1 = showHideFieldsFeatureChecksOnElements(instance, elems);
    }
    var anyVisible2;
    if (fieldsWithMatchRules) {
      var _elems = container.querySelectorAll('.autoSetting-autohide[data-fieldequals]');
      anyVisible2 = showHideFieldsFeatureChecksOnElements(instance, _elems);
    }
    return anyVisible1 || anyVisible2;
  }
  BaseSettingsContainer.prototype.showHideFieldsFeatureChecks = function () {
    var instance = this;
    showHideFieldsFeatureChecksOnContainer(instance, instance.view, true, true);
  };
  function childFieldsVisible(instance, parent) {
    var elems = parent.querySelectorAll('.autoSetting-autohide');
    for (var i = 0, length = elems.length; i < length; i++) {
      var elem = elems[i];
      if (instance.isFieldVisible(elem)) {
        return true;
      }
    }
    return false;
  }
  function passesFieldRule(elem, rule) {
    var parts = rule.split('=');
    var form = elem.closest('form');
    var matchElem = form.querySelector(parts[0]);
    var value = getValueToSave(matchElem);
    return value.toString() === parts[1];
  }
  function passesFieldRules(elem, rules, allowAny) {
    rules = rules.split('|');
    for (var i = 0, length = rules.length; i < length; i++) {
      var passes = passesFieldRule(elem, rules[i]);
      if (passes) {
        if (allowAny) {
          return true;
        }
      } else {
        if (!allowAny) {
          return false;
        }
      }
    }
    return !allowAny;
  }
  BaseSettingsContainer.prototype.isFieldVisible = function (elem) {
    var _layoutMode;
    var instance = this;
    var cssFeatures = elem.getAttribute('data-cssfeatures');
    if (cssFeatures) {
      cssFeatures = cssFeatures.split(',');
      if (cssFeatures.length !== cssFeatures.filter(isCssFeatureSupported).length) {
        return false;
      }
    }
    var minServerVersion = elem.getAttribute('data-minserverversion');
    if (minServerVersion) {
      var apiClient = instance.getApiClient();
      var isNegative = minServerVersion.startsWith('!');
      if (isNegative) {
        minServerVersion = minServerVersion.substring(1);
      }
      if (isNegative) {
        if (!apiClient || apiClient.isMinServerVersion(minServerVersion)) {
          return false;
        }
      } else {
        if (!apiClient || !apiClient.isMinServerVersion(minServerVersion)) {
          return false;
        }
      }
    }
    var notMinServerVersion = elem.getAttribute('data-notminserverversion');
    if (notMinServerVersion) {
      var _apiClient2 = instance.getApiClient();
      if (_apiClient2 && _apiClient2.isMinServerVersion(notMinServerVersion)) {
        return false;
      }
    }
    var supportsServerHomeScreenSettings = elem.getAttribute('data-supportsserverhomesections');
    if (supportsServerHomeScreenSettings) {
      var _apiClient3 = instance.getApiClient();
      var apiClientSupportsServerHomeSections = (_apiClient3 == null ? void 0 : _apiClient3.supportsServerHomeSections()) || false;
      if (apiClientSupportsServerHomeSections.toString().toLowerCase() !== supportsServerHomeScreenSettings) {
        return false;
      }
    }
    var appHostSupports = elem.getAttribute('data-apphostsupports');
    if (appHostSupports) {
      appHostSupports = appHostSupports.split(',');
      if (appHostSupports.length !== appHostSupports.filter(isAppHostFeatureSupported).length) {
        return false;
      }
    }
    if (elem.getAttribute('data-datetimesupportslocalization') === 'true') {
      if (!_datetime.default.supportsLocalization()) {
        return false;
      }
    }
    var loggedIntoConnect = elem.getAttribute('data-loggedintoconnect');
    if (loggedIntoConnect && loggedIntoConnect.toString() !== _connectionmanager.default.isLoggedIntoConnect().toString()) {
      return false;
    }
    var layoutMode = elem.getAttribute('data-layoutmode');
    var layoutExpectedValue = true;
    if ((_layoutMode = layoutMode) != null && _layoutMode.startsWith('!')) {
      layoutMode = layoutMode.substring(1);
      layoutExpectedValue = false;
    }
    switch (layoutMode) {
      case 'tv':
        if (_layoutmanager.default.tv) {
          if (!layoutExpectedValue) {
            return false;
          }
        } else {
          if (layoutExpectedValue) {
            return false;
          }
        }
        break;
      default:
        break;
    }
    var fieldRules = elem.getAttribute('data-fieldequals');
    if (fieldRules && !passesFieldRules(elem, fieldRules, elem.getAttribute('data-anyfield') === 'true')) {
      return false;
    }
    if (elem.getAttribute('data-childfieldsvisible') === 'true') {
      if (!childFieldsVisible(this, elem)) {
        return false;
      }
    }
    return true;
  };
  BaseSettingsContainer.prototype.loadAutoSettings = function () {
    var instance = this;
    this.showHideFieldsFeatureChecks();
    var elems = instance.view.querySelectorAll('.autoSetting');
    return instance.loadAutoSettingsObjects().then(function () {
      for (var i = 0, length = elems.length; i < length; i++) {
        var elem = elems[i];
        instance.loadAutoSetting(elem);
      }
      showHideFieldsFeatureChecksOnContainer(instance, instance.view, false, true);
    });
  };
  BaseSettingsContainer.prototype.saveAutoSettings = function () {
    _loading.default.show();
    var elems = this.view.querySelectorAll('.autoSetting');
    var ownerObjects = {};
    for (var i = 0, length = elems.length; i < length; i++) {
      var elem = elems[i];
      this.saveAutoSetting(elem, ownerObjects, false);
    }
    return this.sendUpdatesFromAutoSettingsObjects(ownerObjects).then(function (r) {
      _loading.default.hide();
      return _responsehelper.default.handleConfigurationSavedResponse(r);
    }, function (r) {
      _loading.default.hide();
      return _responsehelper.default.handleErrorResponse(r);
    });
  };
  BaseSettingsContainer.prototype.loadSettingsInternal = function () {
    return Promise.resolve();
  };
  BaseSettingsContainer.prototype.destroy = function () {
    this.view = null;
  };
  var _default = _exports.default = BaseSettingsContainer;
});
