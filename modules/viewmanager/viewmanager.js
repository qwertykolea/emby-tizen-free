define(["exports", "./../layoutmanager.js", "./../focusmanager.js", "./../common/pluginmanager.js", "./../common/usersettings/usersettings.js", "./../emby-apiclient/events.js", "./../common/appsettings.js", "./../emby-elements/emby-scroller/emby-scroller.js"], function (_exports, _layoutmanager, _focusmanager, _pluginmanager, _usersettings, _events, _appsettings, _embyScroller) {
  Object.defineProperty(_exports, "__esModule", {
    value: true
  });
  _exports.default = void 0;
  /* jshint module: true */

  var mainAnimatedPages;
  var pageContainerCount = 3;
  var ViewClasses = [];
  var CurrentViewStack = [];
  function extractPath(urlOrPath) {
    try {
      // Attempt to parse as a full URL
      var urlObj = new URL(urlOrPath);
      var pathname = urlObj.pathname;
      // check the output because old webkit based environments may not support this and we're not currently polyfilling it
      if (pathname) {
        return pathname;
      }
    } catch (e) {}
    // If parsing fails, assume it's already a path and return as is
    return urlOrPath;
  }
  function removeItemOnce(arr, value) {
    var index = arr.indexOf(value);
    if (index > -1) {
      arr.splice(index, 1);
    }
    return arr;
  }
  function removeViewInfoFromCurrentViews(viewInfo) {
    removeItemOnce(CurrentViewStack, viewInfo);
  }
  function findOldestViewToRemove(ignoreViewInfo) {
    var candidates = [];
    var views = CurrentViewStack;
    for (var i = 0, length = views.length; i < length; i++) {
      var viewInfo = views[i];
      if (viewInfo.params.asDialog === 'true') {
        continue;
      }
      candidates.push(viewInfo);
    }
    if (candidates.length >= pageContainerCount) {
      for (var _i = 0, _length = candidates.length; _i < _length; _i++) {
        var _viewInfo = candidates[_i];
        if (_viewInfo === ignoreViewInfo) {
          continue;
        }
        return _viewInfo;
      }
    }
    return null;
  }
  function disableRestoreOnCurrentViews() {
    var views = CurrentViewStack;
    for (var i = 0, length = views.length; i < length; i++) {
      var viewInfo = views[i];
      if (viewInfo.params.asDialog === 'true') {
        continue;
      }
      var view = viewInfo.view;
      if (view) {
        view.allowRestore = false;
      }
    }
  }
  function getViewInfoByUrl(url) {
    var views = CurrentViewStack;
    for (var i = 0, length = views.length; i < length; i++) {
      var viewInfo = views[i];
      if (viewInfo.url === url) {
        return viewInfo;
      }
    }
    return null;
  }
  _events.default.on(_layoutmanager.default, 'modechange', disableRestoreOnCurrentViews);
  _events.default.on(_usersettings.default, 'change', function (e, name) {
    switch (name) {
      case 'tvhome':
      case 'enableHomescreenFocusPreviews':
        disableRestoreOnCurrentViews();
        break;
      default:
        break;
    }
  });
  _events.default.on(_appsettings.default, 'change', function (e, name) {
    switch (name) {
      case 'name':
      case 'datetimelocale':
      case 'language':
        disableRestoreOnCurrentViews();
        break;
      default:
        break;
    }
  });
  function GetExtendedPluginController(OriginalController, BaseView) {
    function NewPrototype() {
      BaseView.apply(this, arguments);
      OriginalController.apply(this, arguments);
    }
    Object.assign(NewPrototype.prototype, BaseView.prototype);
    Object.assign(NewPrototype.prototype, OriginalController.prototype);
    return NewPrototype;
  }
  function addMethodsToPluginControllerFactory(options) {
    var prototype = options.controllerFactory.prototype;
    if (prototype.onResume && prototype.onPause) {
      return Promise.resolve();
    }
    return Emby.importModule('./modules/viewmanager/baseview.js').then(function (BaseView) {
      options.controllerFactory = GetExtendedPluginController(options.controllerFactory, BaseView);
    });
  }
  function setControllerClass(view, options) {
    if (options.controllerFactory) {
      return Promise.resolve();
    }
    var controllerUrl = view.getAttribute('data-controller');
    if (!controllerUrl) {
      return Promise.resolve();
    }
    if (controllerUrl.startsWith('__plugin/')) {
      controllerUrl = controllerUrl.substring('__plugin/'.length);
    }
    controllerUrl = _pluginmanager.default.getConfigurationResourceUrl(controllerUrl);
    return require([controllerUrl]).then(function (deps) {
      options.controllerFactory = deps[0];
      return addMethodsToPluginControllerFactory(options);
    });
  }
  function parseHtml(html, hasScript) {
    if (hasScript) {
      html = html.replaceAll('<!--<script', '<script');
      html = html.replaceAll('</script>-->', '</script>');
    }
    var wrapper = document.createElement('div');
    wrapper.innerHTML = html;
    return wrapper.querySelector('.view,div[data-role="page"]');
  }
  function normalizeNewView(options, isPluginpage) {
    var _options$params;
    var viewHtml = options.view;
    if (((_options$params = options.params) == null ? void 0 : _options$params.asDialog) === 'true') {
      viewHtml = viewHtml.replace('data-bindheader="true"', 'data-bindheader="false"');
    }
    var hasScript = isPluginpage ? viewHtml.includes('<script') : false;
    var elem = parseHtml(viewHtml, hasScript);
    options.view = elem;
  }
  function getViewHideEventInfo(previousViewInfo, newViewInfo) {
    var detail = Object.assign({}, previousViewInfo);
    detail.newViewInfo = newViewInfo;
    return {
      detail: detail,
      bubbles: true,
      cancelable: false
    };
  }
  function dispatchViewBeforeHide(instance, view, eventInfo, dispatchLegacyPageEvent) {
    var _view$controller, _eventInfo$detail;
    (_view$controller = view.controller) == null || _view$controller.onPause({
      event: eventInfo,
      newViewInfo: (_eventInfo$detail = eventInfo.detail) == null ? void 0 : _eventInfo$detail.newViewInfo
    });

    // used by approuter
    if (instance.onBeforeHide) {
      instance.onBeforeHide(eventInfo);
    }
    dispatchViewEvent(view, eventInfo, 'viewbeforehide', dispatchLegacyPageEvent);
  }
  function onBeforeChange(instance, previousViewInfo, newViewInfo, isRestored, navigationType, isBack) {
    if (previousViewInfo) {
      dispatchViewBeforeHide(instance, previousViewInfo.view, getViewHideEventInfo(previousViewInfo, newViewInfo), true);
    }

    //console.log('viewManager.onBeforeChange - processing path: navigationType: ' + navigationType);

    var newView = newViewInfo.view;
    var eventDetail = getViewEventDetail(newViewInfo, isRestored, navigationType, isBack, previousViewInfo);
    var navMenuId = eventDetail.detail.navMenuId;
    if (!navMenuId) {
      var _eventDetail$detail$p;
      if (((_eventDetail$detail$p = eventDetail.detail.params) == null ? void 0 : _eventDetail$detail$p.type) === 'search') {
        navMenuId = 'search';
      }
    }
    if (!navMenuId) {
      navMenuId = window.location.href.toString();
      navMenuId = navMenuId.substring(navMenuId.indexOf('#!') + 2);
    }
    eventDetail.detail.navMenuId = navMenuId;
    if (newViewInfo.controllerFactory && !newView.controller) {
      // Use controller method
      newView.controller = new newViewInfo.controllerFactory(newView, eventDetail.detail.params);
    }
    if (newViewInfo.controller && newView.controller) {
      var controllerPath = extractPath(newViewInfo.controller);
      newView.controller.name = controllerPath.replaceAll('.js', '').replaceAll('.', '').replaceAll('/', '-');
      newView.classList.add('view-' + newView.controller.name);
    }
    dispatchViewEvent(newView, eventDetail, 'viewbeforeshow', true);
  }
  function onViewChange(previousViewInfo, newViewInfo, isRestored, navigationType, isBack) {
    var _newView$controller;
    if (previousViewInfo) {
      dispatchViewEvent(previousViewInfo.view, getViewHideEventInfo(previousViewInfo, newViewInfo), 'viewhide', true);
    }
    if (isRestored) {
      removeViewInfoFromCurrentViews(newViewInfo);
    }
    CurrentViewStack.push(newViewInfo);
    var newView = newViewInfo.view;
    var transitionPromise = ((_newView$controller = newView.controller) == null ? void 0 : _newView$controller.transitionPromise) || Promise.resolve();
    return transitionPromise.then(function () {
      onNewViewDisplayed(newViewInfo, isRestored, navigationType, isBack, previousViewInfo);
      return newView;
    });
  }
  function autoFocusView(view, options) {
    var controller = view.controller;
    if (controller) {
      if (controller.autoFocus) {
        return controller.autoFocus(options);
      }
    }
    return _focusmanager.default.autoFocus(view, options);
  }
  function getResumeOptions(e) {
    var _e$detail$abortContro;
    return {
      refresh: !e.detail.isRestored,
      previousViewInfo: e.detail.previousViewInfo,
      signal: (_e$detail$abortContro = e.detail.abortController) == null ? void 0 : _e$detail$abortContro.signal
    };
  }
  function onNewViewDisplayed(viewInfo, isRestored, navigationType, isBack, previousViewInfo) {
    var _viewInfo$params, _newView$controller2;
    removeSplash();
    var newView = viewInfo.view;
    var eventDetail = getViewEventDetail(viewInfo, isRestored, navigationType, isBack, previousViewInfo);
    if ((previousViewInfo == null ? void 0 : previousViewInfo.params.asDialog) === 'true' && (((_viewInfo$params = viewInfo.params) == null ? void 0 : _viewInfo$params.asDialog) !== 'true' || isBack)) {
      removeAndDestroy(previousViewInfo);
    }
    if (isRestored) {
      var activeElement = viewInfo.activeElement;
      if (activeElement && document.body.contains(activeElement) && _focusmanager.default.isCurrentlyFocusable(activeElement)) {
        _focusmanager.default.focus(activeElement);
      } else {
        autoFocusView(newView, {
          skipIfNotEnabled: true
        });
      }
    } else {
      if (viewInfo.autoFocus !== false) {
        autoFocusView(newView, {
          skipIfNotEnabled: true
        });
      }
    }
    var resumeOptions = getResumeOptions(eventDetail);
    resumeOptions.autoFocus = !eventDetail.detail.isRestored;
    (_newView$controller2 = newView.controller) == null || _newView$controller2.onResume(resumeOptions);
    newView.dispatchEvent(new CustomEvent('viewshow', eventDetail));
    if (newView.classList.contains('needsPageEvents')) {
      newView.dispatchEvent(new CustomEvent('pageshow', eventDetail));
    }
  }
  function dispatchViewEvent(view, eventInfo, eventName, dispatchLegacyPageEvent) {
    var eventResult = view.dispatchEvent(new CustomEvent(eventName, eventInfo));
    if (dispatchLegacyPageEvent && view.classList.contains('needsPageEvents')) {
      try {
        // https://emby.media/community/index.php?/topic/136897-emby-in-browser-say-there-was-an-error-executing-the-request-please-try-again-later
        view.dispatchEvent(new CustomEvent(eventName.replace('view', 'page'), eventInfo));
      } catch (err) {
        console.error('error dispatching page event: ', err);
      }
    }
    return eventResult;
  }
  function getViewEventDetail(viewInfo, isRestored, navigationType, isBack, previousViewInfo) {
    var view = viewInfo.view;
    viewInfo.isRestored = isRestored;
    viewInfo.isBack = isBack;
    viewInfo.navigationType = navigationType;
    viewInfo.previousViewInfo = previousViewInfo;
    if (viewInfo.title == null) {
      viewInfo.title = view.getAttribute('data-title') || null;
    }
    if (!viewInfo.helpUrl) {
      viewInfo.helpUrl = view.getAttribute('data-helpurl') || null;
    }
    return {
      detail: viewInfo,
      bubbles: true,
      cancelable: false
    };
  }
  function triggerDestroy(viewInfo) {
    var _viewInfo$abortContro;
    // these were set here
    viewInfo.activeElement = null;
    (_viewInfo$abortContro = viewInfo.abortController) == null || _viewInfo$abortContro.abort();
    var view = viewInfo.view;
    var controller = view.controller;
    if (controller != null && controller.destroy) {
      controller.destroy();
    }
    view.controller = null;
  }
  function removeAndDestroy(viewInfoToRemove, newViewToReplaceWith) {
    removeViewInfoFromCurrentViews(viewInfoToRemove);
    var viewToRemove = viewInfoToRemove.view;
    triggerDestroy(viewInfoToRemove);
    if (viewInfoToRemove.params.asDialog !== 'true') {
      if (newViewToReplaceWith) {
        mainAnimatedPages.replaceChild(newViewToReplaceWith, viewToRemove);
      } else {
        viewToRemove.remove();
      }
    }
  }
  function ViewManager() {}
  function animateRemoveSplash(elem) {
    //elem.classList.remove('app-splash-expanded');
    elem.remove();
  }
  var splashRemoved;
  function removeSplash() {
    if (splashRemoved) {
      return;
    }
    splashRemoved = true;
    var splash = document.querySelector('.app-splash-container') || document.querySelector('.app-splash');
    if (splash) {
      animateRemoveSplash(splash);
      return;
    }
  }
  function updateOldPluginPage(view) {
    // try to inject an emby-scroller
    var scroller = view.querySelector('[is="emby-scroller"]');
    if (scroller || view.closest('[is="emby-scroller"]')) {
      return;
    }
    var scrollSlider;
    var content = view.querySelector(':scope > [data-role="content"], :scope > .content-primary');
    if (content) {
      scroller = view;
      scrollSlider = content;
    }
    if (!scroller || !scrollSlider) {
      var _scroller;
      scroller = view.querySelector('[data-role="content"]');
      scrollSlider = (_scroller = scroller) == null ? void 0 : _scroller.querySelector(':scope > .content-primary');
    }
    if (!scroller || !scrollSlider) {
      var _view$querySelector;
      // best we can do
      (_view$querySelector = view.querySelector('.content-primary')) == null || _view$querySelector.classList.add('padded-top-page', 'padded-bottom-page', 'padded-left', 'padded-right', 'padded-left-page');
      return;
    }

    // do a fake upgrade
    scroller.classList.add('scrollFrameY');
    scroller.setAttribute('data-horizontal', 'false');
    scroller.setAttribute('data-forcescrollbar', 'true');
    scroller.setAttribute('data-bindheader', 'true');
    scroller.setAttribute('is', 'emby-scroller');
    scroller.is = 'emby-scroller';
    scrollSlider.classList.add('scrollSlider', 'padded-top-page', 'padded-bottom-page', 'padded-left', 'padded-right', 'padded-left-page');
    _embyScroller.default.upgradeElement(scroller);
  }
  ViewManager.prototype.loadView = function (options, signal) {
    var _options$params2;
    var instance = this;
    var previousViewInfo = this.currentViewInfo();

    // Record the element that has focus
    if (previousViewInfo) {
      previousViewInfo.activeElement = document.activeElement;
    }
    var isPluginpage = options.isPluginPage;
    normalizeNewView(options, isPluginpage);
    var view = options.view;
    var dependencies = view.getAttribute('data-require');
    dependencies = dependencies ? dependencies.split(',') : [];
    var dependencyPromises = [];
    if (dependencies.length) {
      dependencyPromises.push(require(dependencies));
    }
    if (isPluginpage && !((_options$params2 = options.params) != null && _options$params2.userId)) {
      dependencyPromises.push(Emby.importModule('./legacy/dashboard.js'));
      dependencyPromises.push(require(['css!legacy/dashboard.css']));
    }
    signal == null || signal.throwIfAborted();
    return Promise.all(dependencyPromises).then(function () {
      var _options$params3;
      var viewClassList = view.classList;
      viewClassList.add('page');
      if (isPluginpage) {
        viewClassList.add('needsPageEvents');
        updateOldPluginPage(view);
      }
      viewClassList.add.apply(viewClassList, ViewClasses);
      if (!mainAnimatedPages) {
        mainAnimatedPages = document.querySelector('.mainAnimatedPages');
      }
      signal == null || signal.throwIfAborted();
      if (((_options$params3 = options.params) == null ? void 0 : _options$params3.asDialog) !== 'true') {
        var viewInfoToRemove = findOldestViewToRemove(previousViewInfo);
        if (viewInfoToRemove) {
          removeAndDestroy(viewInfoToRemove, view);
        } else {
          mainAnimatedPages.appendChild(view);
        }
      }
      return setControllerClass(view, options).then(function () {
        var viewInfo = options;
        onBeforeChange(instance, previousViewInfo, viewInfo, false, options.navigationType, options.isBack);
        if (previousViewInfo) {
          var _options$params4;
          // make sure all views are hidden, because if we're navigating from inside a dialog, you could end up with two views visible
          // example: live tv guide -> click program cell -> click channel link

          if (previousViewInfo.params.asDialog === 'true' && ((_options$params4 = options.params) == null ? void 0 : _options$params4.asDialog) !== 'true') {
            var views = CurrentViewStack;
            for (var i = 0, length = views.length; i < length; i++) {
              var _viewInfo2$params;
              var _viewInfo2 = views[i];
              if (((_viewInfo2$params = _viewInfo2.params) == null ? void 0 : _viewInfo2$params.asDialog) !== 'true') {
                _viewInfo2.view.classList.add('hide');
              }
            }
          }
        }
        options.view = view;
        return onViewChange(previousViewInfo, viewInfo, false, options.navigationType, options.isBack);
      });
    });
  };
  ViewManager.prototype.tryRestoreView = function (options, signal) {
    // Record the element that has focus
    var previousViewInfo = this.currentViewInfo();
    if (previousViewInfo) {
      previousViewInfo.activeElement = document.activeElement;
    }
    var url = options.url;
    var isBack = options.isBack;
    var navigationType = options.navigationType;
    var viewInfo = getViewInfoByUrl(url);
    var instance = this;
    if (viewInfo) {
      var view = viewInfo == null ? void 0 : viewInfo.view;
      if (view && view.allowRestore !== false) {
        //console.log('viewManager.tryRestoreView - processing path: navigationType: ' + navigationType);

        // use all of the previous view state, but take the new abortController from the new request
        // this is so that the view and navdrawer don't receive an abortController that is already aborted
        viewInfo.abortController = options.abortController;
        onBeforeChange(instance, previousViewInfo, viewInfo, true, navigationType, isBack);
        return onViewChange(previousViewInfo, viewInfo, true, navigationType, isBack);
      }
    }
    return Promise.reject();
  };
  ViewManager.prototype.canRestoreCurrentView = function () {
    var _this$currentView;
    return ((_this$currentView = this.currentView()) == null ? void 0 : _this$currentView.allowRestore) !== false;
  };
  ViewManager.prototype.replaceCurrentUrl = function (url) {
    var viewInfo = this.currentViewInfo();
    if (viewInfo) {
      viewInfo.url = url;
    }
  };
  ViewManager.prototype.onViewChange = onViewChange;
  ViewManager.prototype.currentView = function () {
    var _this$currentViewInfo;
    return (_this$currentViewInfo = this.currentViewInfo()) == null ? void 0 : _this$currentViewInfo.view;
  };
  ViewManager.prototype.currentViewController = function () {
    var _this$currentView2;
    return (_this$currentView2 = this.currentView()) == null ? void 0 : _this$currentView2.controller;
  };
  ViewManager.prototype.currentViewInfo = function () {
    var views = CurrentViewStack;
    var length = views.length;
    return length ? views[length - 1] : null;
  };
  function removeItemAll(arr, value) {
    var i = 0;
    while (i < arr.length) {
      if (arr[i] === value) {
        arr.splice(i, 1);
      } else {
        ++i;
      }
    }
    return arr;
  }
  ViewManager.prototype.addViewClass = function (classes) {
    var args = arguments;
    for (var i = 0, length = args.length; i < length; i++) {
      var cls = args[i];
      if (!ViewClasses.includes(cls)) {
        ViewClasses.push(cls);
      }
    }
    var views = CurrentViewStack;
    for (var _i2 = 0, _length2 = views.length; _i2 < _length2; _i2++) {
      var viewInfo = views[_i2];
      var view = viewInfo.view;
      if (viewInfo.params.asDialog === 'true') {
        continue;
      }
      if (view) {
        var classList = view.classList;
        classList.add.apply(classList, arguments);
      }
    }
  };
  ViewManager.prototype.removeViewClass = function (classes) {
    var args = arguments;
    for (var i = 0, length = args.length; i < length; i++) {
      var cls = args[i];
      removeItemAll(ViewClasses, cls);
    }
    var views = CurrentViewStack;
    for (var _i3 = 0, _length3 = views.length; _i3 < _length3; _i3++) {
      var viewInfo = views[_i3];
      if (viewInfo.params.asDialog === 'true') {
        continue;
      }
      var view = viewInfo.view;
      if (view) {
        var classList = view.classList;
        classList.remove.apply(classList, arguments);
      }
    }
  };
  ViewManager.prototype.disableRestoreOnCurrentViews = disableRestoreOnCurrentViews;
  ViewManager.prototype.autoFocusCurrentView = function (options) {
    var view = this.currentView();
    if (!view) {
      return null;
    }
    return autoFocusView(view, options);
  };
  ViewManager.prototype.dispatchViewBeforeShow = function (viewInfo, isRestored, navigationType, isBack, previousViewInfo) {
    var eventDetail = getViewEventDetail(viewInfo, isRestored, navigationType, isBack, previousViewInfo);
    dispatchViewEvent(viewInfo.view, eventDetail, 'viewbeforeshow');
  };
  ViewManager.prototype.dispatchViewBeforeHide = function (viewInfo, newViewInfo) {
    return dispatchViewBeforeHide(this, viewInfo.view, getViewHideEventInfo(viewInfo, newViewInfo));
  };
  var _default = _exports.default = new ViewManager();
});
