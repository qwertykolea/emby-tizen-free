define(["exports", "./../emby-apiclient/events.js", "./../emby-apiclient/connectionmanager.js", "./../common/appsettings.js", "./../focusmanager.js", "./../dialoghelper/dialoghelper.js", "./../loading/loading.js", "./../common/servicelocator.js", "./../layoutmanager.js", "./../common/globalize.js", "./../listview/listview.js", "./../emby-elements/emby-button/emby-button.js", "./../emby-elements/emby-dialogclosebutton/emby-dialogclosebutton.js", "./../emby-elements/emby-itemscontainer/emby-itemscontainer.js"], function (_exports, _events, _connectionmanager, _appsettings, _focusmanager, _dialoghelper, _loading, _servicelocator, _layoutmanager, _globalize, _listview, _embyButton, _embyDialogclosebutton, _embyItemscontainer) {
  Object.defineProperty(_exports, "__esModule", {
    value: true
  });
  _exports.default = void 0;
  /* jshint module: true */

  require(['formDialogStyle']);
  var currentDisplayingProductInfos = [];
  var currentDisplayingResolve = null;
  var currentValidatingFeature = null;
  var isCurrentDialogRejected = null;
  function showAlert(options) {
    return Emby.importModule('./modules/common/dialogs/alert.js').then(function (alert) {
      return alert(options);
    });
  }
  function showPrompt(options) {
    return Emby.importModule('./modules/prompt/prompt.js').then(function (prompt) {
      return prompt(options);
    });
  }
  function showInAppPurchaseInfo(subscriptionOptions, unlockableProductInfo, dialogOptions) {
    return new Promise(function (resolve, reject) {
      showInAppPurchaseElement(subscriptionOptions, unlockableProductInfo, dialogOptions, resolve, reject);
      currentDisplayingResolve = resolve;
    });
  }
  function getBenefitsListOptions(items) {
    return {
      renderer: _listview.default,
      options: {
        defaultBackground: false,
        moreButton: false,
        // settings is currently the only command. if that ever changes, then change the tv action to menu
        action: 'none',
        multiSelect: false,
        roundImage: true,
        fields: ['Name', 'ShortOverview'],
        draggable: false,
        draggableXActions: false,
        contextMenu: false,
        playQueueIndicator: false
      }
    };
  }
  function initSubscriptionBenefitsItemsContainer(context) {
    var itemsContainer = context.querySelector('.benefitsItemsContainer');
    if (!itemsContainer) {
      return;
    }
    itemsContainer.fetchData = getSubscriptionBenefits;
    itemsContainer.getListOptions = getBenefitsListOptions;
    return itemsContainer.waitForCustomElementUpgrade().then(function () {
      return itemsContainer.resume({
        refresh: true
      });
    });
  }
  function showPeriodicMessage(feature, settingsKey) {
    return new Promise(function (resolve, reject) {
      var dlg = _dialoghelper.default.createDialog({
        size: _layoutmanager.default.tv ? 'fullscreen-border' : 'medium-tall',
        removeOnClose: true,
        scrollY: false
      });
      dlg.classList.add('formDialog');
      var html = '';
      html += '<div class="formDialogHeader">';
      html += '<button type="button" is="emby-dialogclosebutton"></button>';
      html += '<h3 class="formDialogHeaderTitle">Emby Premiere';
      html += '</h3>';
      html += '</div>';
      html += '<div is="emby-scroller" data-horizontal="false" data-forcescrollbar="true" data-focusscroll="true" class="formDialogContent">';
      html += '<div class="scrollSlider">';
      html += '<div class="dialogContentInner dialog-content-centered padded-left padded-right">';
      html += '<h1 style="margin-top: 0;">' + _globalize.default.translate('HeaderDiscoverEmbyPremiere') + '</h1>';
      html += '<p>' + _globalize.default.translate('MessageDidYouKnowCinemaMode') + '</p>';
      html += '<p>' + _globalize.default.translate('CinemaModeFeatureDescription') + '</p>';
      html += '<h2>' + _globalize.default.translate('HeaderBenefitsEmbyPremiere') + '</h2>';
      html += '<div is="emby-itemscontainer" class="itemsContainer benefitsItemsContainer vertical-list">';
      html += '</div>';
      html += '<h3 class="secondaryText">' + _globalize.default.translate('AndMuchMoreExclamation') + '</h3>';
      html += '<br/>';
      html += '<div class="formDialogFooter">';
      html += '<button is="emby-button" type="button" class="raised button-submit block btnGetPremiere block formDialogFooterItem autofocus"><span>' + _globalize.default.translate('HeaderBecomeProjectSupporter') + '</span></button>';
      var seconds = 11;
      html += '<div class="continueTimeText formDialogFooterItem" style="margin: 1.5em 0 .5em;">' + _globalize.default.translate('ContinueInSecondsValue', seconds) + '</div>';
      html += '<button is="emby-button" type="button" class="raised button-cancel block btnContinue block formDialogFooterItem hide"><span>' + _globalize.default.translate('Continue') + '</span></button>';
      html += '</div>';
      html += '</div>';
      html += '</div>';
      html += '</div>';
      dlg.innerHTML = html;
      var isRejected = true;
      var timeTextInterval = setInterval(function () {
        seconds -= 1;
        if (seconds <= 0) {
          clearInterval(timeTextInterval);
          dlg.querySelector('.continueTimeText').classList.add('hide');
          var btnContinue = dlg.querySelector('.btnContinue');
          btnContinue.classList.remove('hide');
          _focusmanager.default.focus(btnContinue);
        } else {
          dlg.querySelector('.continueTimeText').innerHTML = _globalize.default.translate('ContinueInSecondsValue', seconds);
        }
      }, 1000);
      var i, length;
      var btnPurchases = dlg.querySelectorAll('.buttonPremiereInfo');
      for (i = 0, length = btnPurchases.length; i < length; i++) {
        btnPurchases[i].addEventListener('click', showExternalPremiereInfo);
      }

      // Has to be assigned a z-index after the call to .open() 
      dlg.addEventListener('close', function (e) {
        clearInterval(timeTextInterval);
        if (isRejected) {
          reject();
        } else {
          _appsettings.default.set(settingsKey, Date.now());
          resolve();
        }
      });
      dlg.querySelector('.btnContinue').addEventListener('click', function () {
        isRejected = false;
        _dialoghelper.default.close(dlg);
      });
      dlg.querySelector('.btnGetPremiere').addEventListener('click', showPremiereInfo);
      dlg.addEventListener('open', function () {
        initSubscriptionBenefitsItemsContainer(dlg);
      });
      _dialoghelper.default.open(dlg);
    });
  }
  function isTestServer(apiClient) {
    var serverId = apiClient == null ? void 0 : apiClient.serverId();
    switch (serverId) {
      case '554ae9ea56b94c1c82cc628f6de52d85':
        return true;
      default:
        return false;
    }
  }
  function showPeriodicMessageIfNeeded(feature) {
    if (feature !== 'playback') {
      return Promise.resolve();
    }
    var intervalMs = _servicelocator.iapManager.getPeriodicMessageIntervalMs(feature);
    if (intervalMs <= 0) {
      return Promise.resolve();
    }
    var settingsKey = 'periodicmessage11-' + feature;
    var lastMessage = parseInt(_appsettings.default.get(settingsKey) || '0');
    if (!lastMessage) {
      // Don't show on the very first playback attempt
      _appsettings.default.set(settingsKey, Date.now());
      return Promise.resolve();
    }
    if (Date.now() - lastMessage > intervalMs) {
      var apiClient = _connectionmanager.default.currentApiClient();
      if (isTestServer(apiClient)) {
        return Promise.resolve();
      }
      var registrationOptions = {
        viewOnly: true
      };

      // Get supporter status
      return _connectionmanager.default.getRegistrationInfo(_servicelocator.iapManager.getAdminFeatureName(feature), apiClient, registrationOptions).catch(function (errorResult) {
        if (errorResult === 'overlimit') {
          _appsettings.default.set(settingsKey, Date.now());
          return Promise.resolve();
        }
        return showPeriodicMessage(feature, settingsKey);
      });
    }
    return Promise.resolve();
  }
  function validateFeature(feature, options) {
    if (!options) {
      options = {};
    }
    console.log('validateFeature: ' + feature);
    return _servicelocator.iapManager.isUnlockedByDefault(feature, options).then(function () {
      return showPeriodicMessageIfNeeded(feature);
    }, function () {
      var unlockableFeatureCacheKey = 'featurepurchased-' + feature;
      if (_appsettings.default.get(unlockableFeatureCacheKey) === '1') {
        return showPeriodicMessageIfNeeded(feature);
      }
      var unlockableProduct = _servicelocator.iapManager.getProductInfo(feature);
      if (unlockableProduct) {
        var unlockableCacheKey = 'productpurchased-' + unlockableProduct.id;
        if (unlockableProduct.owned) {
          // Cache this to eliminate the store as a possible point of failure in the future
          _appsettings.default.set(unlockableFeatureCacheKey, '1');
          _appsettings.default.set(unlockableCacheKey, '1');
          return showPeriodicMessageIfNeeded(feature);
        }
        if (_appsettings.default.get(unlockableCacheKey) === '1') {
          return showPeriodicMessageIfNeeded(feature);
        }
      }
      var unlockableProductInfo = unlockableProduct ? {
        enableAppUnlock: true,
        id: unlockableProduct.id,
        price: unlockableProduct.price,
        feature: feature
      } : null;
      return _servicelocator.iapManager.getSubscriptionOptions().then(function (subscriptionOptions) {
        if (subscriptionOptions.filter(function (p) {
          return p.owned;
        }).length > 0) {
          return Promise.resolve();
        }
        var registrationOptions = {
          viewOnly: options.viewOnly,
          useCachedFailure: options.showDialog === false
        };
        var apiClient = options.serverId ? _connectionmanager.default.getApiClient(options.serverId) : _connectionmanager.default.currentApiClient();
        if (!registrationOptions.viewOnly) {
          if (_servicelocator.iapManager.allowNonPremiere && _servicelocator.iapManager.allowNonPremiere(feature)) {
            registrationOptions.allowNonPremiere = true;
          }
        }

        // Get supporter status
        return _connectionmanager.default.getRegistrationInfo(_servicelocator.iapManager.getAdminFeatureName(feature), apiClient, registrationOptions).catch(function (errorResult) {
          if (options.showDialog === false) {
            return Promise.reject();
          }
          var alertPromise;
          if (errorResult === 'overlimit') {
            alertPromise = showOverLimitAlert();
          }
          if (!alertPromise) {
            alertPromise = Promise.resolve();
          }
          return alertPromise.then(function () {
            var dialogOptions = {
              title: _globalize.default.translate('HeaderUnlockFeature'),
              feature: feature
            };
            currentValidatingFeature = feature;
            return showInAppPurchaseInfo(subscriptionOptions, unlockableProductInfo, dialogOptions);
          });
        });
      });
    });
  }
  function showOverLimitAlert() {
    return showAlert('Your Emby Premiere device limit has been exceeded. Please check with the administrator of your Emby Server and have them contact Emby support at billingsupport@emby.media if necessary.').catch(function () {
      return Promise.resolve();
    });
  }
  function cancelInAppPurchase() {
    var elem = document.querySelector('.inAppPurchaseOverlay');
    if (elem) {
      _dialoghelper.default.close(elem);
    }
  }
  function clearCurrentDisplayingInfo() {
    currentDisplayingProductInfos = [];
    currentDisplayingResolve = null;
    currentValidatingFeature = null;
    isCurrentDialogRejected = null;
  }
  function showExternalPremiereInfo() {
    _servicelocator.shell.openUrl(_servicelocator.iapManager.getPremiumInfoUrl());
  }
  function getPurchaseTermHtml(term) {
    return '<li>' + term + '</li>';
  }
  function getTermsOfPurchaseHtml() {
    var html = '';
    var termsOfPurchase = _servicelocator.iapManager.getTermsOfPurchase ? _servicelocator.iapManager.getTermsOfPurchase() : [];
    if (!termsOfPurchase.length) {
      return html;
    }
    html += '<h1>' + _globalize.default.translate('HeaderTermsOfPurchase') + '</h1>';
    termsOfPurchase.push('<a is="emby-linkbutton" class="button-link" href="https://emby.media/privacy" target="_blank">' + _globalize.default.translate('PrivacyPolicy') + '</a>');
    termsOfPurchase.push('<a is="emby-linkbutton" class="button-link" href="https://emby.media/terms" target="_blank">' + _globalize.default.translate('TermsOfUse') + '</a>');
    html += '<ul>';
    html += termsOfPurchase.map(getPurchaseTermHtml).join('');
    html += '</ul>';
    return html;
  }
  function showInAppPurchaseElement(subscriptionOptions, unlockableProductInfo, dialogOptions, resolve, reject) {
    cancelInAppPurchase();

    // clone
    currentDisplayingProductInfos = subscriptionOptions.slice(0);
    if (unlockableProductInfo) {
      currentDisplayingProductInfos.push(unlockableProductInfo);
    }
    var dlg = _dialoghelper.default.createDialog({
      size: _layoutmanager.default.tv ? 'fullscreen-border' : 'medium-tall',
      removeOnClose: true,
      scrollY: false
    });
    dlg.classList.add('formDialog');
    var html = '';
    html += '<div class="formDialogHeader">';
    html += '<button type="button" is="emby-dialogclosebutton"></button>';
    html += '<h3 class="formDialogHeaderTitle">';
    html += dialogOptions.title || '';
    html += '</h3>';
    html += '</div>';
    html += '<div is="emby-scroller" data-forcescrollbar="true" data-horizontal="false" data-focusscroll="true" class="formDialogContent">';
    html += '<div class="scrollSlider">';
    html += '<form class="dialogContentInner dialog-content-centered padded-left padded-right">';
    html += '<p style="margin-top:0;">';
    if (unlockableProductInfo) {
      html += _globalize.default.translate('MessageUnlockAppWithPurchaseOrSupporter');
    } else {
      html += _globalize.default.translate('MessageUnlockAppWithSupporter');
    }
    html += '</p>';
    html += '<p style="margin-bottom:1.5em;">';
    html += _globalize.default.translate('MessageToValidateSupporter');
    html += '</p>';
    var i, length;
    for (i = 0, length = subscriptionOptions.length; i < length; i++) {
      html += '<p>';
      html += '<button is="emby-button" type="button" class="raised button-submit block btnPurchase" data-email="' + (subscriptionOptions[i].requiresEmail !== false) + '" data-featureid="' + subscriptionOptions[i].id + '"><span>';
      html += subscriptionOptions[i].title;
      html += '</span></button>';
      html += '</p>';
    }
    if (unlockableProductInfo) {
      var unlockText = _globalize.default.translate('ButtonUnlockWithPurchase');
      if (unlockableProductInfo.price) {
        unlockText = _globalize.default.translate('ButtonUnlockPrice', unlockableProductInfo.price);
      }
      html += '<p>';
      html += '<button is="emby-button" type="button" class="raised block btnPurchase" data-featureid="' + unlockableProductInfo.id + '"><span>' + unlockText + '</span></button>';
      html += '</p>';
    }
    html += '<p>';
    html += '<button is="emby-button" type="button" class="raised button-cancel block btnRestorePurchase"><span>' + _servicelocator.iapManager.getRestoreButtonText() + '</span></button>';
    html += '</p>';
    if (subscriptionOptions.length) {
      html += '<h1 style="margin-top:1.5em;">' + _globalize.default.translate('HeaderBenefitsEmbyPremiere') + '</h1>';
      html += '<div is="emby-itemscontainer" class="itemsContainer benefitsItemsContainer vertical-list" style="margin-bottom:1em;">';
      html += '</div>';
      html += '<h3 class="secondaryText">' + _globalize.default.translate('AndMuchMoreExclamation') + '</h3>';
    }
    if (dialogOptions.feature === 'playback') {
      html += '<p>';
      html += '<button is="emby-button" type="button" class="raised button-cancel block btnPlayMinute"><span>' + _globalize.default.translate('ButtonPlayOneMinute') + '</span></button>';
      html += '</p>';
    }
    html += getTermsOfPurchaseHtml();
    html += '</form>';
    html += '</div>';
    html += '</div>';
    dlg.innerHTML = html;
    document.body.appendChild(dlg);
    var btnPurchases = dlg.querySelectorAll('.btnPurchase');
    for (i = 0, length = btnPurchases.length; i < length; i++) {
      btnPurchases[i].addEventListener('click', onPurchaseButtonClick);
    }
    btnPurchases = dlg.querySelectorAll('.buttonPremiereInfo');
    for (i = 0, length = btnPurchases.length; i < length; i++) {
      btnPurchases[i].addEventListener('click', showExternalPremiereInfo);
    }
    isCurrentDialogRejected = true;
    var resolveWithTimeLimit = false;
    var btnPlayMinute = dlg.querySelector('.btnPlayMinute');
    if (btnPlayMinute) {
      btnPlayMinute.addEventListener('click', function () {
        resolveWithTimeLimit = true;
        isCurrentDialogRejected = false;
        _dialoghelper.default.close(dlg);
      });
    }
    dlg.querySelector('.btnRestorePurchase').addEventListener('click', function () {
      restorePurchase(unlockableProductInfo);
    });
    _loading.default.hide();
    dlg.classList.add('inAppPurchaseOverlay');
    dlg.addEventListener('open', function () {
      initSubscriptionBenefitsItemsContainer(dlg);
    });
    _dialoghelper.default.open(dlg).then(function () {
      var rejected = isCurrentDialogRejected;
      clearCurrentDisplayingInfo();
      if (rejected) {
        reject();
      } else if (resolveWithTimeLimit) {
        resolve({
          enableTimeLimit: true
        });
      }
    });
  }
  function getSubscriptionBenefits() {
    var list = [];
    list.push({
      Name: _globalize.default.translate('HeaderFreeApps'),
      Icon: '&#xe5CA;',
      ShortOverview: _globalize.default.translate('FreeAppsFeatureDescription')
    });
    list.push({
      Name: _globalize.default.translate('HeaderOfflineDownloads'),
      Icon: '&#xe5db;',
      ShortOverview: _globalize.default.translate('HeaderOfflineDownloadsDescription')
    });
    list.push({
      Name: _globalize.default.translate('HeaderHardwareAcceleratedTranscoding'),
      Icon: 'transform',
      ShortOverview: _globalize.default.translate('HeaderHardwareAcceleratedTranscodingDescription')
    });
    list.push({
      Name: _globalize.default.translate('LiveTV'),
      Icon: '&#xe639;',
      ShortOverview: _globalize.default.translate('LiveTvFeatureDescription')
    });
    list.push({
      Name: 'Emby DVR',
      Icon: '&#xe1B2;',
      ShortOverview: _globalize.default.translate('DvrFeatureDescription')
    });
    list.push({
      Name: _globalize.default.translate('HeaderCinemaMode'),
      Icon: '&#xe02C;',
      ShortOverview: _globalize.default.translate('CinemaModeFeatureDescription')
    });
    return Promise.resolve({
      Items: list,
      TotalRecordCount: list.length
    });
  }
  function showAskAdminToPurchaseAlert() {
    return showAlert({
      text: _globalize.default.translate('AskAdminToGetPremiere'),
      title: 'Emby Premiere'
    });
  }
  function onPurchaseButtonClick() {
    var featureId = this.getAttribute('data-featureid');
    if (featureId === 'embypremiere' && globalThis.appMode === 'ios') {
      var apiClient = _connectionmanager.default.currentApiClient();
      if (!isTestServer(apiClient)) {
        var _user$Policy;
        var user = apiClient == null ? void 0 : apiClient.getCurrentUserCached();
        if (!(user != null && (_user$Policy = user.Policy) != null && _user$Policy.IsAdministrator)) {
          return showAskAdminToPurchaseAlert();
        }
      }
    }
    if (this.getAttribute('data-email') === 'true') {
      getUserEmail().then(function (email) {
        _servicelocator.iapManager.beginPurchase(featureId, email);
      });
    } else {
      _servicelocator.iapManager.beginPurchase(featureId);
    }
  }
  function restorePurchase(unlockableProductInfo) {
    var dlg = _dialoghelper.default.createDialog({
      size: _layoutmanager.default.tv ? 'fullscreen-border' : 'medium-tall',
      removeOnClose: true,
      scrollY: false
    });
    dlg.classList.add('formDialog');
    var html = '';
    html += '<div class="formDialogHeader">';
    html += '<button type="button" is="emby-dialogclosebutton"></button>';
    html += '<h3 class="formDialogHeaderTitle">';
    html += _servicelocator.iapManager.getRestoreButtonText();
    html += '</h3>';
    html += '</div>';
    html += '<div is="emby-scroller" data-horizontal="false" data-forcescrollbar="true" data-focusscroll="true" class="formDialogContent">';
    html += '<div class="scrollSlider">';
    html += '<div class="dialogContentInner dialog-content-centered padded-left padded-right">';
    html += '<p style="margin:0 0 2em;">';
    html += _globalize.default.translate('HowDidYouPay');
    html += '</p>';
    html += '<p>';
    html += '<button is="emby-button" type="button" class="raised button-cancel block btnRestoreSub"><span>' + _globalize.default.translate('IHaveEmbyPremiere') + '</span></button>';
    html += '</p>';
    if (unlockableProductInfo) {
      html += '<p>';
      html += '<button is="emby-button" type="button" class="raised button-cancel block btnRestoreUnlock"><span>' + _globalize.default.translate('IPurchasedThisApp') + '</span></button>';
      html += '</p>';
    }
    html += '</div>';
    html += '</div>';
    html += '</div>';
    dlg.innerHTML = html;
    document.body.appendChild(dlg);
    _loading.default.hide();
    dlg.querySelector('.btnRestoreSub').addEventListener('click', function () {
      _dialoghelper.default.close(dlg);
      showAlert({
        text: _globalize.default.translate('MessageToValidateSupporter'),
        title: 'Emby Premiere'
      });
    });
    var btnRestoreUnlock = dlg.querySelector('.btnRestoreUnlock');
    if (btnRestoreUnlock) {
      btnRestoreUnlock.addEventListener('click', function () {
        _dialoghelper.default.close(dlg);
        _servicelocator.iapManager.restorePurchase();
      });
    }
    _dialoghelper.default.open(dlg);
  }
  function getUserEmail() {
    if (_connectionmanager.default.isLoggedIntoConnect()) {
      var connectUser = _connectionmanager.default.connectUser();
      if (connectUser && connectUser.Email) {
        return Promise.resolve(connectUser.Email);
      }
    }
    return showPrompt({
      label: _globalize.default.translate('LabelEmail')
    });
  }
  function onProductUpdated(e, product) {
    var resolve = currentDisplayingResolve;
    if (product.owned) {
      if (resolve && currentDisplayingProductInfos.filter(function (p) {
        return product.id === p.id;
      }).length) {
        isCurrentDialogRejected = false;
        cancelInAppPurchase();
        resolve();
        return;
      }
    }
    var feature = currentValidatingFeature;
    if (feature) {
      _servicelocator.iapManager.isUnlockedByDefault(feature).then(function () {
        isCurrentDialogRejected = false;
        cancelInAppPurchase();
        if (resolve) {
          resolve();
        }
      });
    }
  }
  function showPremiereInfo() {
    if (_servicelocator.appHost.supports('externalpremium')) {
      showExternalPremiereInfo();
      return Promise.resolve();
    }
    return _servicelocator.iapManager.getSubscriptionOptions().then(function (subscriptionOptions) {
      var dialogOptions = {
        title: 'Emby Premiere',
        feature: 'sync'
      };
      return showInAppPurchaseInfo(subscriptionOptions, null, dialogOptions);
    });
  }
  _events.default.on(_servicelocator.iapManager, 'productupdated', onProductUpdated);
  var _default = _exports.default = {
    validateFeature: validateFeature,
    showPremiereInfo: showPremiereInfo
  };
});
