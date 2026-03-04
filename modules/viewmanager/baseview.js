define(["exports", "./../layoutmanager.js", "./../focusmanager.js", "./../maintabsmanager.js", "./../common/inputmanager.js", "./../navdrawer/navdrawer.js", "./viewmanager.js", "./../approuter.js", "./../emby-apiclient/connectionmanager.js", "./../common/appsettings.js", "./../dialoghelper/dialoghelper.js", "./../backdrop/backdrop.js", "./../common/servicelocator.js"], function (_exports, _layoutmanager, _focusmanager, _maintabsmanager, _inputmanager, _navdrawer, _viewmanager, _approuter, _connectionmanager, _appsettings, _dialoghelper, _backdrop, _servicelocator) {
  Object.defineProperty(_exports, "__esModule", {
    value: true
  });
  _exports.default = void 0;
  /* jshint module: true */

  var EnableNativeTransitions = document.startViewTransition && CSS.supports('view-transition-class', 'test');
  var appHeader = document.querySelector('.skinHeader');
  function allowAnimation() {
    if (!EnableNativeTransitions) {
      return false;
    }
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
  var EnableTransitions = EnableNativeTransitions && allowAnimation();
  if (EnableTransitions) {
    require(['css!modules/viewmanager/transitions.css']);
  }
  function onFinished(result) {
    //docElem.classList.remove('back-transition');
    return Promise.resolve(result);
  }
  var nameIndex = 1;
  function transitionWithStartViewTransition(detail, newView, oldView, isBack) {
    if (oldView === newView) {
      return Promise.resolve();
    }
    var newViewClassList = newView.classList;
    var oldViewClassList = oldView == null ? void 0 : oldView.classList;
    if (!EnableTransitions || !_layoutmanager.default.tv) {
      if (oldViewClassList) {
        oldViewClassList.add('hide');
        oldViewClassList.remove('animatedView');
      }
      newViewClassList.remove('hide', 'animatedView');
      return Promise.resolve();
    }
    if (detail.transition) {
      newViewClassList.add('animatedView');
      newView.style.viewTransitionName = 'animatedview' + nameIndex;

      //const elem = document.activeElement.closest('.card');
      //if (elem) {
      //    elem.style.viewTransitionName = 'animatedview' + nameIndex;
      //}
      nameIndex++;
    }
    var transitionType = _layoutmanager.default.tv ? 'scale' : 'slide';
    function onStarted() {
      if (oldView) {
        oldViewClassList.add('hide');
        if (isBack) {
          newViewClassList.remove('hide');
        }
      }
    }
    if (newViewClassList.contains('animatedView') || isBack && oldViewClassList.contains('animatedView')) {
      //if (isBack) {
      //    docClassList.add('back-transition');
      //}

      // Determine direction
      var direction = 'unknown';
      if (isBack) {
        direction = 'backwards';
      } else /*if (currentPageIndex < destinationPageIndex)*/{
          direction = 'forwards';
        }
      var result;
      try {
        result = document.startViewTransition({
          update: onStarted,
          types: [transitionType + '-' + direction]
        });
      } catch (e) {
        result = document.startViewTransition(onStarted);
      }
      return result.finished.then(onFinished);
    } else {
      //docClassList.remove('back-transition');
      onStarted();
      return Promise.resolve();
    }
  }
  function getTransitionPromise(instance, e) {
    var _detail$params;
    var detail = e.detail;
    if (instance.getTransitionPromise) {
      return instance.getTransitionPromise(detail);
    }
    var previousViewInfo = detail.previousViewInfo;
    if (!previousViewInfo) {
      return Promise.resolve();
    }
    var newView = instance.view;
    if (((_detail$params = detail.params) == null ? void 0 : _detail$params.asDialog) === 'true') {
      var viewInfo = detail;
      if (detail.navigationType === 'traverse') {
        return Promise.resolve();
      }
      _dialoghelper.default.createDialog({
        dialog: newView,
        autoFocus: false,
        size: _layoutmanager.default.tv ? 'fullscreen-border-force' : 'medium-tall',
        blockInputCommandNavigation: false
      });
      return new Promise(function (resolve, reject) {
        newView.addEventListener('opened', resolve);
        newView.addEventListener('closing', function () {
          var isNavigating = newView._closedForNavigation;
          if (!isNavigating) {
            _viewmanager.default.dispatchViewBeforeHide(viewInfo, previousViewInfo);
            _viewmanager.default.dispatchViewBeforeShow(previousViewInfo, true, 'traverse', true, viewInfo);
          }
        });
        _dialoghelper.default.open(newView).then(function () {
          var isNavigating = newView._closedForNavigation;
          if (!isNavigating) {
            _viewmanager.default.onViewChange(viewInfo, previousViewInfo, true, 'traverse', true);
          }
        });
      });
    }
    if (previousViewInfo.params.asDialog === 'true') {
      return Promise.resolve();
    }
    return transitionWithStartViewTransition(detail, newView, previousViewInfo.view, detail.isBack);
  }
  function getResumeOptions(e) {
    var _e$detail$abortContro;
    return {
      refresh: !e.detail.isRestored,
      previousViewInfo: e.detail.previousViewInfo,
      signal: (_e$detail$abortContro = e.detail.abortController) == null ? void 0 : _e$detail$abortContro.signal
    };
  }
  function onViewBeforeShow(e) {
    var instance = this;
    var resumeOptions = getResumeOptions(e);
    instance.transitionPromise = (this.onBeginResume(resumeOptions) || Promise.resolve()).then(function () {
      return getTransitionPromise(instance, e);
    });
  }
  function getScrollerNavOutDestination(direction) {
    if (direction === _focusmanager.default.directions.up) {
      return appHeader;
    }
    return null;
  }
  function BaseView(view, params) {
    this.view = view;
    this.params = params;
    var requestedItemFields = ['BasicSyncInfo', 'CanDelete'];
    if (_servicelocator.appHost.supports('filedownload')) {
      requestedItemFields.push('CanDownload');
    }

    // for now, this must be kept in sync with baseview/basetab
    this.requestedItemFields = requestedItemFields.join(',');
    this.scroller = view.getAttribute('is') === 'emby-scroller' ? view : view.querySelector('.viewScroller');
    view.addEventListener('viewbeforeshow', onViewBeforeShow.bind(this));
    this.view.classList.add('focuscontainer-x');
    var focusContainerElem = this.getFocusContainerElement();
    if (focusContainerElem) {
      if (params.asDialog === 'true') {
        focusContainerElem.classList.add('focuscontainer-y');
      } else {
        focusContainerElem.classList.add('focuscontainer-y', 'navout-up');
      }
      focusContainerElem.getNavOutDestination = getScrollerNavOutDestination;
    }
    this.onInputCommandFn = this.onInputCommand.bind(this);
    var onInputCommandFn = this.onInputCommandFn;
    if (onInputCommandFn) {
      _inputmanager.default.on(view, onInputCommandFn);
    }
  }
  function onBackCommand(e) {
    if (_layoutmanager.default.tv && this.enableBackMenu && !e.defaultPrevented) {
      e.preventDefault();
      _approuter.default.showBackMenu();
    }
  }
  BaseView.prototype.scrollDirection = function () {
    var _this$options;
    return ((_this$options = this.options) == null ? void 0 : _this$options.scrollDirection) || 'y';
  };
  BaseView.prototype.onWindowInputCommand = function (e) {
    switch (e.detail.command) {
      case 'back':
        {
          onBackCommand.call(this, e);
          break;
        }
      default:
        break;
    }
  };
  function shouldShowLeftNav(e, instance) {
    var _viewManager$currentV, _e$detail;
    if (((_viewManager$currentV = _viewmanager.default.currentViewInfo()) == null ? void 0 : _viewManager$currentV.drawer) === false) {
      return false;
    }
    if ((_e$detail = e.detail) != null && (_e$detail = _e$detail.originalEvent) != null && _e$detail.repeat) {
      return false;
    }
    if (e.target.closest('.itemsViewSettingsContainer')) {
      return false;
    }
    return true;
  }
  BaseView.prototype.onInputCommand = function (e) {
    switch (e.detail.command) {
      case 'moveleftedge':
        if (document.dir !== 'rtl' && shouldShowLeftNav(e, this)) {
          _navdrawer.default.openIfClosed();
          e.preventDefault();
        }
        break;
      case 'moverightedge':
        if (document.dir === 'rtl' && shouldShowLeftNav(e, this)) {
          _navdrawer.default.openIfClosed();
          e.preventDefault();
        }
        break;
      case 'back':
        {
          onBackCommand.call(this, e);
          break;
        }
      default:
        break;
    }
  };
  BaseView.prototype.getFocusContainerElement = function () {
    var scroller = this.scroller;
    if (this.view === scroller) {
      var elem = scroller.querySelector('.scrollSlider');
      if (elem) {
        return elem;
      }
    }
    return scroller;
  };
  BaseView.prototype.enablePushDownFocusPreview = function () {
    return false;
  };
  BaseView.prototype.enableFocusPreview = function () {
    if (!_layoutmanager.default.tv) {
      return false;
    }
    var scrollDirection = this.scrollDirection();
    if (scrollDirection === 'y') {
      return this.enablePushDownFocusPreview();
    }
    return true;
  };
  BaseView.prototype.getRequestedImageTypes = function () {
    var fields = 'Primary,Backdrop,Thumb';
    if (this.enableFocusPreview()) {
      fields += ',Logo';
    }
    return fields;
  };
  BaseView.prototype.getApiClient = function () {
    var serverId = this.params.serverId;
    return serverId ? _connectionmanager.default.getApiClient(serverId) : _connectionmanager.default.currentApiClient();
  };
  BaseView.prototype.serverId = function () {
    var _connectionManager$cu;
    return this.params.serverId || ((_connectionManager$cu = _connectionmanager.default.currentApiClient()) == null ? void 0 : _connectionManager$cu.serverId());
  };
  BaseView.prototype.getRequestedItemFields = function () {
    var fields = this.requestedItemFields;
    return fields;
  };
  BaseView.prototype.autoFocus = function (options) {
    options = Object.assign({
      skipIfNotEnabled: true
    }, options);
    var elem;
    var view = this.view;
    if (view) {
      elem = _focusmanager.default.autoFocus(view, options);
      if (elem) {
        return elem;
      }
    }
    if (options.skipIfNotEnabled && !_focusmanager.default.isAutoFocusEnabled()) {
      return null;
    }
    elem = _maintabsmanager.default.focus();
    if (elem) {
      return elem;
    }
    return null;
  };
  BaseView.prototype.enableTransitions = function () {
    return false;
  };
  BaseView.prototype.enableWindowInputCommands = function () {
    return this.enableBackMenu;
  };
  BaseView.prototype.onBeginResume = function (options) {
    var scroller = this.scroller;
    if (scroller && scroller.beginResume) {
      scroller.beginResume();
    }
  };
  function destroyWindowInputCommand(instance) {
    var onWindowInputCommandFn = instance.onWindowInputCommandFn;
    if (onWindowInputCommandFn) {
      _inputmanager.default.off(window, onWindowInputCommandFn);
    }
    instance.onWindowInputCommandFn = null;
  }
  function getBackdropItems(apiClient, types, parentId, signal) {
    var options = {
      SortBy: "Random",
      Limit: 20,
      Recursive: true,
      IncludeItemTypes: types,
      ImageTypes: "Backdrop",
      ParentId: parentId,
      EnableTotalRecordCount: false,
      ImageTypeLimit: 1,
      EnableImageTypes: 'Backdrop'
    };
    return apiClient.getItems(apiClient.getCurrentUserId(), options, signal);
  }
  function showBackdrop(instance, type, parentId, signal) {
    var apiClient = instance.getApiClient();
    if (!apiClient) {
      return;
    }
    if (instance.backdropItems) {
      _backdrop.default.setBackdrops(instance.backdropItems);
      return;
    }
    getBackdropItems(apiClient, type, parentId, signal).then(function (result) {
      if (result.Items.length) {
        var items = result.Items;
        instance.backdropItems = items;
        _backdrop.default.setBackdrops(items);
      } else {
        _backdrop.default.clear();
      }
    });
  }
  function showAutoBackdropIfNeeded(instance, signal) {
    if (instance.params.asDialog === 'true') {
      return;
    }
    if (_layoutmanager.default.tv) {
      return;
    }
    var backdropItemTypes = instance.getAutoBackdropItemTypes();
    if (backdropItemTypes.length) {
      if (_appsettings.default.enableBackdrops()) {
        var params = instance.params;
        var parentId = params ? params.parentId : null;
        showBackdrop(instance, backdropItemTypes, parentId, signal);
      }
    }
  }
  BaseView.prototype.getAutoBackdropItemTypes = function () {
    return [];
  };
  BaseView.prototype.onResume = function (options) {
    this.paused = false;
    if (!this.onWindowInputCommandFn && this.enableWindowInputCommands()) {
      this.onWindowInputCommandFn = this.onWindowInputCommand.bind(this);
      var onWindowInputCommandFn = this.onWindowInputCommandFn;
      if (onWindowInputCommandFn) {
        _inputmanager.default.on(window, onWindowInputCommandFn);
      }
    }
    var scroller = this.scroller;
    if (scroller && scroller.resume) {
      scroller.resume();
    }
    showAutoBackdropIfNeeded(this, options == null ? void 0 : options.signal);
  };
  BaseView.prototype.onPause = function (options) {
    this.paused = true;
    destroyWindowInputCommand(this);
    var scroller = this.scroller;
    if (scroller && scroller.pause) {
      scroller.pause();
    }
  };
  BaseView.prototype.isDestroyed = function () {
    return this.view == null;
  };
  BaseView.prototype.destroy = function () {
    var view = this.view;
    var onInputCommandFn = this.onInputCommandFn;
    if (onInputCommandFn && view) {
      _inputmanager.default.off(view, onInputCommandFn);
    }
    this.onInputCommandFn = null;
    this.animationSourceElement = null;
    this.scroller = null;
    this.view = null;
    this.params = null;
    this.paused = null;

    // not used here but many views are
    this.apiClient = null;
    this.backdropItems = null;
  };
  var _default = _exports.default = BaseView;
});
