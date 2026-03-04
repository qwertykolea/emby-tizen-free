define(["exports", "./../dom.js", "./../common/globalize.js", "./../emby-apiclient/events.js", "./navdrawercontent.js", "./../common/usersettings/usersettings.js", "./../emby-elements/emby-scroller/emby-scroller.js", "./../focusmanager.js", "./../common/inputmanager.js", "./../viewmanager/viewmanager.js", "./../common/servicelocator.js", "./../common/appsettings.js"], function (_exports, _dom, _globalize, _events, _navdrawercontent, _usersettings, _embyScroller, _focusmanager, _inputmanager, _viewmanager, _servicelocator, _appsettings) {
  Object.defineProperty(_exports, "__esModule", {
    value: true
  });
  _exports.default = void 0;
  /* jshint module: true */

  require(['css!modules/navdrawer/navdrawer.css', 'css!!tv|modules/navdrawer/navdrawer_nontv.css', 'css!tv|modules/navdrawer/navdrawer_tv.css']);
  var instance;
  var mask;
  var navDrawerElement = document.querySelector('.mainDrawer');
  var allowBackdropFilter = _dom.default.allowBackdropFilter();
  var DrawerStates = {
    Closed: 0,
    Open: 1,
    Docked: 2,
    DockedMini: 3
  };
  var previousFocusedElement;
  function closeOnNavCommand(instance) {
    switch (instance.drawerState) {
      case DrawerStates.Open:
        instance.close();
        if (previousFocusedElement) {
          _focusmanager.default.focus(previousFocusedElement);
          previousFocusedElement = null;
        } else {
          _viewmanager.default.autoFocusCurrentView({
            skipIfNotEnabled: false
          });
        }
        break;
      case DrawerStates.Docked:
        if (previousFocusedElement) {
          _focusmanager.default.focus(previousFocusedElement);
          previousFocusedElement = null;
        } else {
          _viewmanager.default.autoFocusCurrentView({
            skipIfNotEnabled: false
          });
        }
        break;
      case DrawerStates.DockedMini:
        if (previousFocusedElement) {
          _focusmanager.default.focus(previousFocusedElement);
          previousFocusedElement = null;
        } else {
          _viewmanager.default.autoFocusCurrentView({
            skipIfNotEnabled: false
          });
        }
        break;
      default:
        break;
    }
  }
  function onInputCommand(e) {
    var _viewManager$currentV, _this$_openOptions;
    var command = e.detail.command;
    switch (command) {
      case 'back':
        if ((_viewManager$currentV = _viewmanager.default.currentViewController()) != null && _viewManager$currentV.enableBackMenu && _servicelocator.appHost.supports('exit') && (_this$_openOptions = this._openOptions) != null && _this$_openOptions.exitAppOnBack) {
          _servicelocator.appHost.exitWithOptionalMenu(true);
        } else {
          closeOnNavCommand(this);
        }
        e.preventDefault();
        break;
      case 'left':
        if (document.dir === 'rtl') {
          if (!e.target.closest('input') || _inputmanager.default.allowLeftOrRightNav(e.target, command)) {
            closeOnNavCommand(this);
            e.preventDefault();
          }
        }
        break;
      case 'right':
        if (document.dir !== 'rtl') {
          if (!e.target.closest('input') || _inputmanager.default.allowLeftOrRightNav(e.target, command)) {
            closeOnNavCommand(this);
            e.preventDefault();
          }
        }
        break;
      default:
        break;
    }
  }
  function onMainDrawerClick(e) {
    var btnPinNavDrawer = e.target.closest('.btnPinNavDrawer');
    if (btnPinNavDrawer) {
      if (instance.drawerState === DrawerStates.Open) {
        _usersettings.default.drawerStyle('docked');
        instance.open(true);
      } else {
        instance.closeState = null;
        _usersettings.default.drawerStyle('closed');
        instance.close();
      }
    }
    var btnToggleNavDrawer = e.target.closest('.btnToggleNavDrawer');
    if (btnToggleNavDrawer) {
      if (instance.drawerState === DrawerStates.Docked) {
        _usersettings.default.drawerStyle('docked-mini');
        instance.open(true, true);
      } else if (instance.drawerState === DrawerStates.DockedMini || instance.closeState === DrawerStates.DockedMini) {
        instance.closeState = null;
        _usersettings.default.drawerStyle('closed');
        instance.close();
      }
    }
  }
  function createMask(instance) {
    var mask = document.createElement('div');
    mask.className = 'drawer-backdrop';
    _dom.default.addEventListener(mask, _dom.default.whichAnimationEvent(), onMaskTransitionEnd, {
      passive: true,
      capture: true
    });
    _dom.default.addEventListener(mask, 'click', instance.close.bind(instance), {
      passive: true
    });
    document.body.appendChild(mask);
    return mask;
  }
  function setPinIcon(icon, hidden, hoverShow) {
    var btnPinNavDrawerIcon = navDrawerElement.querySelector('.btnPinNavDrawerIcon');
    if (btnPinNavDrawerIcon) {
      btnPinNavDrawerIcon.innerHTML = icon;
    }
    var btnPinNavDrawer = navDrawerElement.querySelector('.btnPinNavDrawer');
    if (btnPinNavDrawer) {
      var title;
      if (icon === 'close') {
        title = _globalize.default.translate('Close');
        btnPinNavDrawer.classList.remove('btnPinNavDrawer-iconpin');
        btnPinNavDrawer.classList.add('btnPinNavDrawer-hovershow');
      } else {
        title = _globalize.default.translate('HeaderPinSidebar');
        btnPinNavDrawer.classList.add('btnPinNavDrawer-iconpin');
        btnPinNavDrawer.classList.remove('btnPinNavDrawer-hovershow');
      }
      btnPinNavDrawer.title = title;
      btnPinNavDrawer.setAttribute('aria-label', title);
      if (hidden) {
        btnPinNavDrawer.classList.add('hide');
      } else {
        btnPinNavDrawer.classList.remove('hide');
      }
    }
    var btnToggleNavDrawer = navDrawerElement.querySelector('.btnToggleNavDrawer');
    if (btnToggleNavDrawer) {
      if (icon === 'close') {
        btnToggleNavDrawer.classList.remove('hide');
      } else {
        btnToggleNavDrawer.classList.add('hide');
      }
    }
  }
  function onOpenRequested() {
    this.closeState = this.drawerState === DrawerStates.DockedMini ? DrawerStates.DockedMini : null;
    this.open();
  }
  function onNavigated() {
    var instance = this;
    switch (instance.drawerState) {
      case DrawerStates.Open:
        // close without having to wait for view transitions
        closeOnNavCommand(instance);
        break;
      default:
        break;
    }
  }
  function setRtlClasses() {
    if (document.dir === 'rtl') {
      navDrawerElement.classList.add('mainDrawer-rtl');
    } else {
      navDrawerElement.classList.remove('mainDrawer-rtl');
    }
  }
  _events.default.on(_appsettings.default, 'change', function (e, name) {
    switch (name) {
      case 'language':
        setRtlClasses();
        break;
      default:
        break;
    }
  });
  function NavDrawer() {
    instance = this;

    // 1 = x, 2 = y

    _dom.default.addEventListener(navDrawerElement, 'click', onMainDrawerClick, {
      passive: true
    });
    _dom.default.addEventListener(navDrawerElement, _dom.default.whichTransitionEvent(), onNavDrawerTransitionEnd, {
      passive: true,
      capture: true
    });
    _events.default.on(_navdrawercontent.default, 'open-requested', onOpenRequested.bind(this));
    _events.default.on(_navdrawercontent.default, 'navigated', onNavigated.bind(this));
    this.onInputCommandFn = onInputCommand.bind(this);
    var onInputCommandFn = this.onInputCommandFn;
    if (onInputCommandFn) {
      _inputmanager.default.on(navDrawerElement, onInputCommandFn);
    }
    setRtlClasses();
  }
  var _scrollingElement;
  function getScrollingElement() {
    var elem = _scrollingElement;
    if (!elem) {
      elem = document.scrollingElement || document.documentElement;
      _scrollingElement = elem;
    }
    return elem;
  }
  NavDrawer.prototype.openIfClosed = function (options) {
    switch (this.drawerState) {
      case 1:
      case 2:
        // it's already open, just auto-focus
        this.autoFocus({
          skipIfNotEnabled: false
        });
        break;
      case 3:
        this._openOptions = options;
        onOpenRequested.call(this);
        this.autoFocus({
          skipIfNotEnabled: false
        });
        break;
      default:
        this._openOptions = options;
        this.open(false, false, true);
        break;
    }
  };
  function expandAllCollapsibles() {
    var elems = navDrawerElement.querySelectorAll('.navDrawerCollapseSection');
    for (var i = 0, length = elems.length; i < length; i++) {
      var elem = elems[i];
      if (elem.expand) {
        elem.expand();
      }
    }
  }
  NavDrawer.prototype.open = function (isDocked, miniDock, autoFocus) {
    _navdrawercontent.default.onBeforeOpen(autoFocus);
    var newDrawerState = isDocked ? miniDock ? DrawerStates.DockedMini : DrawerStates.Docked : DrawerStates.Open;
    var previousDrawerState = this.drawerState;
    if (newDrawerState === previousDrawerState) {
      return;
    }
    var focused = document.activeElement;
    if (focused && !navDrawerElement.contains(focused)) {
      previousFocusedElement = focused;
    }
    this.drawerState = newDrawerState;
    if (isDocked) {
      _focusmanager.default.popScope(navDrawerElement);
      if (newDrawerState === DrawerStates.DockedMini) {
        navDrawerElement.classList.add('drawer-docked', 'mainDrawer-mini');
        expandAllCollapsibles();
        setPinIcon('close');
      } else {
        navDrawerElement.classList.add('drawer-docked');
        navDrawerElement.classList.remove('mainDrawer-mini');
        setPinIcon('close');
      }
    } else {
      _focusmanager.default.pushScope(navDrawerElement);
      navDrawerElement.classList.remove('drawer-docked', 'mainDrawer-mini');
      navDrawerElement.classList.add('drawer-opening');
      setPinIcon('view_sidebar', null, true);
    }
    navDrawerElement.classList.remove('hide');

    // trigger reflow
    void navDrawerElement.offsetWidth;
    if (allowBackdropFilter) {
      navDrawerElement.classList.add('drawer-open', 'drawer-open-backdropfilter');
    } else {
      navDrawerElement.classList.add('drawer-open');
    }
    navDrawerElement.classList.remove('drawer-opening');
    if (isDocked) {
      this.hideMask();
      getScrollingElement().classList.remove('withDialogOpen');
    } else {
      this.showMask();
      getScrollingElement().classList.add('withDialogOpen');
    }
    if (newDrawerState !== previousDrawerState) {
      _events.default.trigger(this, 'drawer-state-change', [newDrawerState]);
    }
  };
  NavDrawer.prototype.autoFocus = function (options) {
    return _navdrawercontent.default.autoFocus(options);
  };
  NavDrawer.prototype.close = function () {
    this._openOptions = null;
    if (this.closeState === DrawerStates.DockedMini) {
      this.closeState = null;
      this.open(true, true, false);
      return;
    }
    _focusmanager.default.popScope(navDrawerElement);
    var currentDrawerState = this.drawerState;
    var previousDrawerState = this.drawerState;
    var newDrawerState = this.drawerState = DrawerStates.Closed;
    navDrawerElement.classList.remove('drawer-open', 'drawer-opening', 'drawer-open-backdropfilter', 'drawer-docked', 'mainDrawer-mini');
    this.hideMask();
    getScrollingElement().classList.remove('withDialogOpen');
    if (currentDrawerState === DrawerStates.Docked || currentDrawerState === DrawerStates.DockedMini) {
      navDrawerElement.classList.add('hide');
    }
    setPinIcon('view_sidebar', null, false);
    if (newDrawerState !== previousDrawerState) {
      _events.default.trigger(this, 'drawer-state-change', [newDrawerState]);
    }
  };
  NavDrawer.prototype.onViewShow = function (e) {
    _navdrawercontent.default.onViewShow(e);
  };
  NavDrawer.prototype.toggle = function () {
    if (this.drawerState) {
      this.close();
    } else {
      this.open();
    }
  };
  NavDrawer.prototype.togglePinState = function () {
    // userSettingsMethod set by appHeader
    if (this.drawerState === DrawerStates.Open) {
      if (this.closeState === DrawerStates.DockedMini) {
        _usersettings.default.drawerStyle('docked-mini');
        this.open(true, true);
      } else {
        _usersettings.default.drawerStyle('docked-mini');
        this.open(true, true);
      }
    } else if (this.drawerState === DrawerStates.Docked) {
      _usersettings.default.drawerStyle('docked-mini');
      this.open(true, true);
    }
  };
  NavDrawer.prototype.showMask = function () {
    if (!mask) {
      mask = createMask(this);
    }
  };
  function onNavDrawerTransitionEnd(e) {
    if (e.target !== e.currentTarget) {
      return;
    }
    if (!this.classList.contains('drawer-open')) {
      this.classList.add('hide');
    }
  }
  function onMaskTransitionEnd(e) {
    if (e.target !== e.currentTarget) {
      return;
    }
    var maskElement = mask;
    if (!maskElement) {
      return;
    }
    if (maskElement.classList.contains('drawer-backdrop-fadeout')) {
      maskElement.remove();
      mask = null;
    }
  }
  NavDrawer.prototype.hideMask = function () {
    var maskElement = mask;
    if (maskElement) {
      maskElement.classList.add('drawer-backdrop-fadeout');
    }
  };
  NavDrawer.prototype.getDrawerState = function () {
    return this.drawerState;
  };
  var _default = _exports.default = new NavDrawer();
});
