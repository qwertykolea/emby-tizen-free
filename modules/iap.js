define(["exports", "./common/servicelocator.js", "./layoutmanager.js", "./common/globalize.js", "./browser.js"], function (_exports, _servicelocator, _layoutmanager, _globalize, _browser) {
  Object.defineProperty(_exports, "__esModule", {
    value: true
  });
  _exports.default = void 0;
  /* jshint module: true */

  var isNativeLG = globalThis.appMode === 'webos';
  function showAlert(options) {
    return Emby.importModule('./modules/common/dialogs/alert.js').then(function (alert) {
      return alert(options);
    });
  }
  function getProductInfo(feature) {
    return null;
  }
  var appMode = globalThis.appMode;
  //const isNativeTizen = appMode === 'tizen';
  var isNativeWindows = appMode === 'embyclient';
  function getPremiumInfoUrl() {
    //if (isNativeTizen) {
    //    return 'https://emby.media/premieresamsung';
    //}

    return 'https://emby.media/premiere';
  }
  function beginPurchase(feature, email) {
    if (_servicelocator.appHost.supports('externalpremium')) {
      _servicelocator.shell.openUrl(getPremiumInfoUrl());
    } else {
      showAlert('Please visit ' + getPremiumInfoUrl());
    }
    return Promise.reject();
  }
  function restorePurchase(id) {
    return Promise.reject();
  }
  function getSubscriptionOptions() {
    var options = [];
    options.push({
      id: 'embypremiere',
      title: _globalize.default.translate('HeaderBecomeProjectSupporter'),
      requiresEmail: false
    });
    return Promise.resolve(options);
  }
  function isUnlockedByDefault(feature, options) {
    // playback-tv is only used by the settings screen to determine requirements of playback in tv mode
    if (feature === 'playback' || feature === 'playback-tv') {
      if (_layoutmanager.default.tv || feature === 'playback-tv' || isNativeWindows || _browser.default.electron) {
        if (_browser.default.operaTv || _browser.default.tizen || isNativeLG) {
          return Promise.resolve();
        }
        return Promise.reject();
      }
      return Promise.resolve();
    }
    return Promise.reject();
  }
  function getAdminFeatureName(feature) {
    if (feature === 'playback') {
      if (_layoutmanager.default.tv || isNativeWindows || _browser.default.electron) {
        return 'embytheater-unlock';
      }
    }
    return feature;
  }
  function getRestoreButtonText() {
    return _globalize.default.translate('HeaderAlreadyPaid');
  }
  function getPeriodicMessageIntervalMs(feature) {
    if (feature === 'playback') {
      if (getAdminFeatureName(feature) === 'embytheater-unlock') {
        return 86400000;
      }
    }
    return 0;
  }
  var _default = _exports.default = {
    getProductInfo: getProductInfo,
    beginPurchase: beginPurchase,
    restorePurchase: restorePurchase,
    getSubscriptionOptions: getSubscriptionOptions,
    isUnlockedByDefault: isUnlockedByDefault,
    getAdminFeatureName: getAdminFeatureName,
    getRestoreButtonText: getRestoreButtonText,
    getPeriodicMessageIntervalMs: getPeriodicMessageIntervalMs,
    getPremiumInfoUrl: getPremiumInfoUrl
  };
});
