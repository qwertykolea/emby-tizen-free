define(["exports", "./../backdrop/backdrop.js", "./../common/globalize.js", "./../layoutmanager.js", "./../maintabsmanager.js", "./../appheader/appheader.js", "./../common/usersettings/usersettings.js", "./../emby-apiclient/connectionmanager.js", "./../viewmanager/baseview.js", "./../emby-elements/emby-tabs/emby-tabs.js", "./../approuter.js", "./../common/querystring.js", "./../common/appsettings.js", "./../loading/loading.js", "../focusmanager.js", "./../common/textencoding.js"], function (_exports, _backdrop, _globalize, _layoutmanager, _maintabsmanager, _appheader, _usersettings, _connectionmanager, _baseview, _embyTabs, _approuter, _querystring, _appsettings, _loading, _focusmanager, _textencoding) {
  Object.defineProperty(_exports, "__esModule", {
    value: true
  });
  _exports.default = void 0;
  /* jshint module: true */

  function getResponseHelper() {
    return Emby.importModule('./modules/common/responsehelper.js');
  }
  function allowTabAnimation() {
    var cores = navigator.hardwareConcurrency || 4;
    if (cores < 4) {
      return false;
    }
    if ((screen.width || screen.availWidth || 0) >= 2400 || (screen.height || screen.availHeight || 0) >= 1400) {
      if (cores < 6) {
        return false;
      }
    }
    var deviceMemory = navigator.deviceMemory || 2;
    if (deviceMemory < 2) {
      return false;
    }
    var platform = (navigator.platform || '').toLowerCase();
    var isAndroid = globalThis.appMode === 'android';
    var lowProfileDevice = isAndroid && (cores < 4 || deviceMemory < 2 || platform.includes('armv7'));
    if (lowProfileDevice) {
      return false;
    }
    return true;
  }
  var enableTabAnimation = allowTabAnimation();
  var fadeSize = '1.5%';
  var fadeDuration = 300;
  function fadeInLeft(elem) {
    var keyframes = [{
      opacity: '0',
      transform: 'translate3d(-' + fadeSize + ', 0, 0)',
      offset: 0
    }, {
      opacity: '1',
      transform: 'none',
      offset: 1
    }];
    var timing = {
      duration: fadeDuration,
      iterations: 1,
      easing: 'ease-out'
    };
    elem.animate(keyframes, timing);
  }
  function fadeInRight(elem) {
    var keyframes = [{
      opacity: '0',
      transform: 'translate3d(' + fadeSize + ', 0, 0)',
      offset: 0
    }, {
      opacity: '1',
      transform: 'none',
      offset: 1
    }];
    var timing = {
      duration: fadeDuration,
      iterations: 1,
      easing: 'ease-out'
    };
    elem.animate(keyframes, timing);
  }
  function onDataFetchError(instance, controller, response, signal) {
    _loading.default.hide();
    getResponseHelper().then(function (responseHelper) {
      return responseHelper.getErrorInfo(response, {
        enableDefaultTitle: false
      }).then(function (errorInfo) {
        var errorOwner = controller || instance;
        var errorElement = errorOwner._errorElement;
        if (!errorElement) {
          var _errorOwner$scroller;
          errorElement = document.createElement('div');
          errorElement.classList.add('padded-left', 'padded-left-page', 'padded-right', 'padded-top');
          if (errorOwner === instance) {
            errorElement.classList.add('padded-top-page');
          }
          var html = '';
          html += '<div class="errorBanner" style="margin:0;padding-top:1.35em;padding-bottom:1.35em;">';
          html += '<div class="infoBannerContent">';
          html += '<h3 class="errorTitle" style="margin-top:0;"></h3>';
          html += '<p class="errorMessage" style="margin-bottom: 2em;"></p>';
          html += '<button type="button" is="emby-button" class="raised raised-mini btnRetryData" style="margin:0;">';
          html += '<i class="md-icon button-icon button-icon-left">&#xe5d5;</i>';
          html += '<span>';
          html += _globalize.default.translate('Retry');
          html += '</span>';
          html += '</button>';
          html += '</div>';
          html += '</div>';
          errorElement.innerHTML = html;
          var parent = ((_errorOwner$scroller = errorOwner.scroller) == null ? void 0 : _errorOwner$scroller.getScrollSlider()) || errorOwner.view;
          parent.insertBefore(errorElement, parent.firstChild);
          errorOwner._errorElement = errorElement;
          errorElement.querySelector('.btnRetryData').addEventListener('click', retryControllerResume.bind(instance));
        }
        var errorTitle = errorInfo.title || errorInfo.html;
        var errorMessage = errorInfo.title ? errorInfo.html : null;
        var errorTitleElement = errorElement.querySelector('.errorTitle');
        errorTitleElement.innerHTML = _textencoding.default.htmlEncode(errorTitle || '');
        if (errorTitle) {
          errorTitleElement.classList.remove('hide');
        } else {
          errorTitleElement.classList.add('hide');
        }
        var errorMessageElement = errorElement.querySelector('.errorMessage');
        errorMessageElement.innerHTML = errorMessage || '';
        if (errorMessage) {
          errorMessageElement.classList.remove('hide');
        } else {
          errorMessageElement.classList.add('hide');
        }
        signal == null || signal.throwIfAborted();
        errorElement.classList.remove('hide');
        _focusmanager.default.focus(errorElement.querySelector('.btnRetryData'));

        // todo:
        // - have a way to retry
        return Promise.reject(response);
      });
    });
  }
  function resumeController(instance, controller, options, showError) {
    if (controller._errorElement) {
      if (!controller._errorElement.classList.contains('hide')) {
        controller._errorElement.classList.add('hide');
        if (!options) {
          options = {};
        }
        options.refresh = true;
      }
    }
    return (controller.onResume(options) || Promise.resolve()).catch(function (errorResponse) {
      var _options$signal;
      (_options$signal = options.signal) == null || _options$signal.throwIfAborted();
      if (showError) {
        return onDataFetchError(instance, controller, errorResponse, options.signal);
      }
      return Promise.reject(errorResponse);
    });
  }
  function retryControllerResume() {
    var instance = this;
    var currentTabController = instance.currentTabController;
    _loading.default.show();
    var resumeOptions = {
      refresh: true,
      autoFocus: true
    };
    if (currentTabController) {
      resumeController(instance, currentTabController, resumeOptions, true);
    } else {
      if (instance._errorElement) {
        instance._errorElement.classList.add('hide');
      }
      instance.onBeginResume(resumeOptions);
      instance.onResume(resumeOptions);
    }
  }
  function loadTab(instance, index, previousIndex, previousTabController) {
    instance.getTabController(index).then(function (controller) {
      var autoFocus = previousIndex == null;

      // i don't remember the reason for this condition, but limit it to tv mode because it can cause scrolling to jump around on tab changes
      // this is most easily observed on a mobile device rotated in landscape mode
      if (!autoFocus && _layoutmanager.default.tv) {
        if (previousTabController && previousTabController.view && !_appheader.default.hasFocus()) {
          autoFocus = true;
        }
      }
      resumeController(instance, controller, {
        autoFocus: autoFocus,
        refresh: !controller.refreshed
      }, true);
      controller.refreshed = true;

      // Only enable the fade if native WebAnimations are supported
      if (previousIndex != null && _layoutmanager.default.tv && enableTabAnimation && controller.view && controller.view.animate) {
        if (previousIndex > index) {
          fadeInLeft(controller.view);
        } else if (previousIndex < index) {
          fadeInRight(controller.view);
        }
      }
      instance.currentTabIndex = index;
      instance.currentTabController = controller;
    });
  }
  function onTabChange(e) {
    var newIndex = parseInt(e.detail.selectedTabIndex);
    var previousIndex = e.detail.previousIndex;
    var previousTabController = previousIndex == null ? null : this.tabControllers[previousIndex];
    if (previousTabController && previousTabController.onPause) {
      previousTabController.onPause();
    }
    if (previousTabController != null) {
      var path = _approuter.default.currentViewPath();
      if (path) {
        // replace routing state so that the tab is preserved if the user does a browser refresh
        var tabInfo = this.getLoadedTabs()[newIndex];
        var params = Object.assign({}, this.params);
        params.tab = tabInfo.id;
        if (!path.includes('?')) {
          path += '?';
        }
        path += _querystring.default.paramsToString(params);
        _approuter.default.replaceState(path, false);
      }
    }
    if (previousTabController) {
      this.onTabChange(previousTabController);
    }
    loadTab(this, newIndex, previousIndex, previousTabController);
  }
  function getTabContainers() {
    return this.view.querySelectorAll('.tabContent');
  }
  function TabbedView(view, params) {
    _baseview.default.apply(this, arguments);
    this.getTabContainersFn = getTabContainers.bind(this);
    this.onTabChangeFn = onTabChange.bind(this);
    this.getLoadedTabsFn = this.getLoadedTabs.bind(this);
    this.tabControllers = [];
  }
  Object.assign(TabbedView.prototype, _baseview.default.prototype);
  TabbedView.prototype.onInputCommand = function (e) {
    switch (e.detail.command) {
      case 'back':
        {
          var currentTabController = this.currentTabController;
          if (_layoutmanager.default.tv && currentTabController) {
            if (currentTabController.hasFocus()) {
              if (_maintabsmanager.default.focus()) {
                currentTabController.scrollToBeginning();
                e.preventDefault();
                // don't let back handlers higher up the chain run (in this case, don't allow the handler in BaseView to run)
                e.stopPropagation();
                return;
              }
            }
          }
          break;
        }
      case 'refresh':
        {
          var _currentTabController = this.currentTabController;
          if (_currentTabController && _currentTabController.refresh) {
            _currentTabController.refresh({
              refresh: true
            });
          }
          e.preventDefault();
          return;
        }
      default:
        break;
    }
    _baseview.default.prototype.onInputCommand.apply(this, arguments);
  };
  TabbedView.prototype.onTabChange = function (previousTabController) {};
  TabbedView.prototype.fetchItem = function (signal) {
    var params = this.params;
    if (!params.parentId) {
      return Promise.resolve(null);
    }
    var apiClient = _connectionmanager.default.getApiClient(params.serverId);
    return apiClient.getItem(apiClient.getCurrentUserId(), params.parentId, {}, signal);
  };
  function refreshItem(instance, signal) {
    if (instance.item) {
      return Promise.resolve(instance.item);
    }
    return instance.fetchItem(signal);
  }
  function onItemRefreshed(item) {
    var _info$options$signal;
    var info = this;
    var instance = info.instance;
    if (instance.isDestroyed()) {
      return Promise.resolve();
    }
    instance.item = item;
    (_info$options$signal = info.options.signal) == null || _info$options$signal.throwIfAborted();
    instance.setTitle();
    instance.setTabs();
    return Promise.resolve();
  }
  TabbedView.prototype.getLoadedTabs = function () {
    var tabs = this._tabs;
    if (!tabs) {
      tabs = this.getTabs();
      this._tabs = tabs;
    }
    return tabs;
  };
  TabbedView.prototype.getDefaultTabUserSettingsValue = function (folderId) {
    return _usersettings.default.get('landing-' + folderId);
  };
  TabbedView.prototype.getDefaultTabIndex = function (folderId) {
    var defaultTab = (folderId ? this.getDefaultTabUserSettingsValue(folderId) : null) || this.getDefaultTabId();
    var tabs = this.getLoadedTabs();
    var index = this.getTabIndex(defaultTab, tabs);
    if (index != null) {
      return index;
    }
    for (var i = 0, length = tabs.length; i < length; i++) {
      var tab = tabs[i];
      if (tab.enabled !== false) {
        return i;
      }
    }
  };
  TabbedView.prototype.getDefaultTabId = function () {
    return null;
  };
  TabbedView.prototype.getTabControllerOptions = function (id) {
    var options = {
      item: this.item
    };
    if (id === 'albumartists') {
      options.mode = 'albumartists';
    } else if (id === 'composers') {
      options.mode = 'composers';
    } else if (id === 'genres') {
      // match the list screen once they click a genre
      options.queryIncludeItemTypes = [];
    }
    options.scrollDirection = this.tabScrollDirection();
    return options;
  };
  function initTabController(controller, templateAlreadyLoaded) {
    if (templateAlreadyLoaded) {
      controller.onTemplateLoaded();
      return Promise.resolve(controller);
    }
    return controller.loadTemplate().then(function (responses) {
      if (responses && responses.length) {
        controller.view.innerHTML = _globalize.default.translateDocument(responses[0]);
      }
      controller.onTemplateLoaded();
      return controller;
    });
  }
  function returnFirstDependencyDefault(obj) {
    if (Array.isArray(obj)) {
      obj = obj[0];
    }
    return obj.default || obj;
  }
  function convertTemplateToHorizontal(html) {
    return Emby.importModule('./modules/tabbedview/viewhelper.js').then(function (viewHelper) {
      return viewHelper.convertTemplateToHorizontal(html);
    });
  }
  TabbedView.prototype.supportsHorizontalTabScroll = function () {
    return false;
  };
  TabbedView.prototype.tabScrollDirection = function () {
    if (this.supportsHorizontalTabScroll()) {
      if (_layoutmanager.default.tv && _usersettings.default.tvScrollDirection() === 'horizontal') {
        return 'x';
      }
    }
    return 'y';
  };
  function getTemplateHtml(instance, templateToLoad) {
    return require(['text!' + templateToLoad]).then(function (responses) {
      var html = responses[0];
      if (instance.tabScrollDirection() === 'x') {
        return convertTemplateToHorizontal(html);
      }
      return html;
    });
  }
  function replaceTabContentIfNeeded(instance, tabContent) {
    var swapNode = tabContent.getAttribute('data-swapnode');
    var templateToLoad;
    switch (swapNode) {
      case 'itemstab':
        templateToLoad = 'modules/tabbedview/itemstab.template.html';
        break;
      case 'sectionstab':
        templateToLoad = 'modules/tabbedview/sectionstab.template.html';
        break;
      default:
        break;
    }
    if (!templateToLoad) {
      return Promise.resolve({
        tabContent: tabContent,
        contentLoaded: false
      });
    }
    return getTemplateHtml(instance, templateToLoad).then(function (html) {
      tabContent.insertAdjacentHTML('afterend', _globalize.default.translateHtml(html));
      var newTabContent = tabContent.nextElementSibling;
      newTabContent.setAttribute('data-index', tabContent.getAttribute('data-index'));
      newTabContent.className += ' ' + tabContent.className;
      tabContent.remove();
      return Promise.resolve({
        tabContent: newTabContent,
        contentLoaded: true
      });
    });
  }
  TabbedView.prototype.getTabController = function (index) {
    var controller = this.tabControllers[index];
    if (controller) {
      return Promise.resolve(controller);
    }
    var tabInfo = this.getLoadedTabs()[index];
    var instance = this;
    return this.loadTabController(tabInfo.id).then(function (responses) {
      var controllerFactory = returnFirstDependencyDefault(responses);
      var controller = instance.tabControllers[index];
      if (!controller) {
        var tabContent = instance.view.querySelector('.tabContent[data-index=\'' + index + '\']');
        return replaceTabContentIfNeeded(instance, tabContent).then(function (tabContentInfo) {
          tabContent = tabContentInfo.tabContent;
          var tabContentAlreadyLoaded = tabContentInfo.contentLoaded;
          controller = new controllerFactory(tabContent, instance.getTabControllerParams(tabInfo.id), instance.getTabControllerOptions(tabInfo.id));
          instance.tabControllers[index] = controller;
          instance.onTabControllerCreated(controller);
          return initTabController(controller, tabContentAlreadyLoaded);
        });
      }
      return controller;
    });
  };
  TabbedView.prototype.onTabControllerCreated = function (controller) {};
  TabbedView.prototype.getTabControllerParams = function (id) {
    return Object.assign({}, this.params);
  };
  TabbedView.prototype.getTabIndex = function (id, tabs) {
    if (!tabs) {
      tabs = this.getLoadedTabs();
    }
    var i, length, tab;
    for (i = 0, length = tabs.length; i < length; i++) {
      tab = tabs[i];
      if (tab.enabled !== false && tab.id === id) {
        return i;
      }
    }
    return null;
  };
  TabbedView.prototype.setTabs = function (options) {
    if (this.currentTabIndex == null) {
      var params = this.params;
      if (params.tab) {
        this.currentTabIndex = this.getTabIndex(params.tab);
      }
      if (this.currentTabIndex == null) {
        var _this$item;
        this.currentTabIndex = this.getDefaultTabIndex(((_this$item = this.item) == null ? void 0 : _this$item.Guid) || params.parentId);
      }
      this.initialTabIndex = this.currentTabIndex;
    }
    var currentTabController = this.currentTabController;
    _maintabsmanager.default.setTabs(this.view, this.currentTabIndex, this.getLoadedTabsFn, this.getTabContainersFn, this.onTabChangeFn, currentTabController == null);
  };
  TabbedView.prototype.autoFocus = function (options) {
    var currentTabController = this.currentTabController;
    if (currentTabController != null && currentTabController.autoFocus) {
      return currentTabController.autoFocus(options);
    }
    return _baseview.default.prototype.autoFocus.apply(this, arguments);
  };
  TabbedView.prototype.onBeginResume = function (options) {
    _baseview.default.prototype.onBeginResume.apply(this, arguments);

    // do this earlier in beginresume so that it happens before any view transitions and doesn't become part of it
    if (!_appsettings.default.enableBackdrops()) {
      _backdrop.default.clear();
    }
    this.refreshItemPromise = refreshItem(this, options.signal);
    var currentTabController = this.currentTabController;
    if (currentTabController && currentTabController.onBeginResume) {
      currentTabController.onBeginResume(options);
    }
  };
  function onItemRefreshFail(err) {
    var instance = this;
    instance.refreshItemPromise = null;
    return Promise.reject(err);
  }
  TabbedView.prototype.onResume = function (options) {
    _baseview.default.prototype.onResume.apply(this, arguments);
    var instance = this;
    var promise = this.refreshItemPromise;
    if (promise) {
      promise = promise.then(onItemRefreshed.bind({
        instance: this,
        options: options
      }), onItemRefreshFail.bind(this));
    }
    if (!promise) {
      promise = Promise.resolve();
    }
    promise.then(function () {
      var currentTabController = instance.currentTabController;
      if (currentTabController && currentTabController.onResume) {
        return resumeController(instance, currentTabController, options, false);
      }
    }).catch(function (errorResponse) {
      var _options$signal2;
      // not sure yet if we should resolve here or reject
      (_options$signal2 = options.signal) == null || _options$signal2.throwIfAborted();
      var currentTabController = instance.currentTabController;
      return onDataFetchError(instance, currentTabController, errorResponse, options.signal);
    });
  };
  TabbedView.prototype.onPause = function () {
    _baseview.default.prototype.onPause.apply(this, arguments);
    var currentTabController = this.currentTabController;
    if (currentTabController && currentTabController.onPause) {
      currentTabController.onPause();
    }
  };
  TabbedView.prototype.setTitle = function () {
    _appheader.default.setTitle(this.getTitle());
  };
  TabbedView.prototype.getTitle = function () {
    if (_layoutmanager.default.tv) {
      return '';
    }
    return this.item || '';
  };
  TabbedView.prototype.destroy = function () {
    _baseview.default.prototype.destroy.apply(this, arguments);
    var tabControllers = this.tabControllers;
    if (tabControllers) {
      for (var i = 0, length = tabControllers.length; i < length; i++) {
        var tabController = tabControllers[i];
        if (!tabController) {
          continue;
        }
        if (tabController.onPause) {
          tabController.onPause();
        }
        if (tabController.destroy) {
          tabController.destroy();
        }
      }
      this.tabControllers = null;
    }
    this.currentTabController = null;
    this.initialTabIndex = null;
    this.item = null;
    this.refreshItemPromise = null;
    this._errorElement = null;
  };
  var _default = _exports.default = TabbedView;
});
