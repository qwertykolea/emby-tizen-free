define(["exports", "./../approuter.js", "./../dom.js", "./../focusmanager.js", "./../common/inputmanager.js", "./../browser.js", "./../emby-apiclient/events.js", "./../layoutmanager.js", "./../gesture/gesture.js"], function (_exports, _approuter, _dom, _focusmanager, _inputmanager, _browser, _events, _layoutmanager, _gesture) {
  Object.defineProperty(_exports, "__esModule", {
    value: true
  });
  _exports.default = void 0;
  /* jshint module: true */

  var uiDependencies = ['css!modules/dialoghelper/dialoghelper.css', 'css!!tv|modules/dialoghelper/dialoghelper_nontv.css', 'css!modules/dialoghelper/dialoghelper2.css', 'css!!tv|modules/dialoghelper/dialoghelper_nontv2.css', 'css!modules/dialoghelper/dialoghelper3.css'];
  var appMode = globalThis.appMode;
  var SupportsTranslate = CSS.supports('translate', '40px 100px');
  var SupportsPositionAnchoring = false; // CSS.supports('position-anchor', '--myanchor');
  var SupportsCssVariables = CSS.supports('color', 'var(--fake-var)');
  // test these separately because tizen and legacy edge will wrongly return true as soon anytime calc is in the expression 
  var SupportsCalcEnv = SupportsCssVariables && CSS.supports('width', 'min(45.2%,calc(100% - .65em))');

  // don't use the history in native apps because we're able to catch and override all possible back inputs
  var allowHistory = _browser.default.tv && (appMode || 'standalone') === 'standalone';
  function loadDependencies() {
    var deps = uiDependencies;
    if (deps.length) {
      require(deps);
    }
  }

  // can't do this on dialoghelper.open unfortunately.
  // this will have to be this way until a better option is identified
  loadDependencies();
  var globalOnOpenCallback;
  var SupportsCssAnimations = CSS.supports('animation-name', 'a');
  var AnimationSupported = SupportsCssAnimations && _dom.default.supportsEventListenerOnce();
  function enableAnimation(dlg) {
    if (!AnimationSupported) {
      return false;
    }
    if (dlg) {
      if (dlg.classList.contains('dialog-noanimation')) {
        return false;
      }
    }
    return true;
  }
  function tryRemoveElement(elem) {
    // Seeing crashes in edge webview
    try {
      elem.remove();
    } catch (err) {
      console.error('Error removing dialog element: ', err);
    }
  }
  function getScrollingElement() {
    return document.scrollingElement || document.documentElement;
  }
  function DialogHashHandler(dlg, hash, resolve) {
    var _dlg$dialogOptions2;
    var originalUrl = window.location.href;
    var activeElement = document.activeElement;
    //console.log('dialoghelper activeElement: ' + activeElement.className);

    var removeScrollLockOnClose = false;
    function onNavigate(e) {
      var newUrl = e.destination.url;
      var isBack = originalUrl === newUrl;
      if (isBack || !isOpened(dlg)) {
        navigation.removeEventListener('navigate', onNavigate);
      }
      if (isBack) {
        hideDialog(dlg);
      }
    }
    function onAppRouterNavigate(e) {
      dlg._closedForNavigation = true;
      close(dlg);
    }
    function onInputCommand(e) {
      var command = e.detail.command;
      console.log('dialogHelper input command: ' + command);
      switch (command) {
        case 'left':
        case 'right':
        case 'up':
        case 'down':
        case 'pageup':
        case 'pagedown':
        case 'channelup':
        case 'channeldown':
        case 'select':
          e.stopPropagation();
          break;
        case 'home':
          if (blockInputCommandNavigation(dlg)) {
            e.preventDefault();
          }
          break;
        case 'end':
        case 'settings':
        case 'guide':
        case 'recordedtv':
        case 'favorites':
          e.preventDefault();
          break;
        case 'back':
          e.preventDefault();
          e.stopPropagation();
          requestClose(dlg);
          break;
        case 'forward':
          e.preventDefault();
          e.stopPropagation();
          break;
        default:
          break;
      }
    }
    function afterClosed() {
      resolve({
        element: dlg
      });
    }
    function onDialogClosed() {
      var _dlg$dialogOptions;
      var elemForEvents = dlg.dialogContainer;
      if (elemForEvents && dlg.boundDocumentMouseDown) {
        _dom.default.removeEventListener(elemForEvents, window.PointerEvent ? 'pointerdown' : 'mousedown', dlg.boundDocumentMouseDown, {
          passive: true
        });
        dlg.boundDocumentMouseDown = null;
      }
      if (elemForEvents && dlg.boundDocumentClick) {
        _dom.default.removeEventListener(elemForEvents, 'click', dlg.boundDocumentClick, {
          passive: true
        });
        dlg.boundDocumentClick = null;
      }
      _inputmanager.default.off(dlg, onInputCommand);
      _events.default.off(_approuter.default, 'navigate', onAppRouterNavigate);
      navigation.removeEventListener('navigate', onNavigate);
      dlg.classList.remove('opened');
      if (removeScrollLockOnClose) {
        getScrollingElement().classList.remove('withDialogOpen');
      }
      if (((_dlg$dialogOptions = dlg.dialogOptions) == null ? void 0 : _dlg$dialogOptions.refocus) !== false) {
        //console.log('dialoghelper refocus to ' + activeElement.className);
        // check isCurrentlyFocusable in case the original element is now hidden or removed
        if (activeElement && _focusmanager.default.isCurrentlyFocusable(activeElement)) {
          //console.log('dialoghelper refocus to ' + activeElement.className);
          _focusmanager.default.focus(activeElement);
          //console.log('dialoghelper focused element ' + document.activeElement.className);
        }
      }
      var dialogContainer = dlg.dialogContainer;
      if (dlg.getAttribute('data-removeonclose') !== 'false') {
        if (dialogContainer) {
          removeBackdrop(dlg);
          dlg.dialogContainer = null;
        } else {
          tryRemoveElement(dlg);
        }
      } else {
        if (dialogContainer) {
          dialogContainer.classList.remove('dialogBackdropOpened');
        }
      }
      if (isHistoryEnabled(dlg)) {
        // if we just called appRouter.back(), then use a timeout to allow the history events to fire first
        setTimeout(afterClosed, 1);
      } else {
        afterClosed();
      }
    }
    _dom.default.addEventListener(dlg, 'preclosing', function () {
      var elemForEvents = dlg.dialogContainer;
      if (elemForEvents && dlg.boundDocumentMouseDown) {
        _dom.default.removeEventListener(elemForEvents, window.PointerEvent ? 'pointerdown' : 'mousedown', dlg.boundDocumentMouseDown, {
          passive: true
        });
        dlg.boundDocumentMouseDown = null;
      }
      if (elemForEvents && dlg.boundDocumentClick) {
        _dom.default.removeEventListener(elemForEvents, 'click', dlg.boundDocumentClick, {
          passive: true
        });
        dlg.boundDocumentClick = null;
      }
      _inputmanager.default.off(dlg, onInputCommand);
      _events.default.off(_approuter.default, 'navigate', onAppRouterNavigate);
      navigation.removeEventListener('navigate', onNavigate);
    }, {
      once: true
    });
    _dom.default.addEventListener(dlg, 'close', onDialogClosed, {
      once: true
    });
    addBackdropOverlay(dlg);
    dlg.classList.remove('hide');
    dlg.classList.add('opened');
    dlg.dispatchEvent(new CustomEvent('open', {
      bubbles: false,
      cancelable: false
    }));
    var scrollingElement = getScrollingElement();
    if (dlg.getAttribute('data-lockscroll') === 'true' && !scrollingElement.classList.contains('withDialogOpen')) {
      scrollingElement.classList.add('withDialogOpen');
      removeScrollLockOnClose = true;
    }
    animateDialogOpen(dlg);
    if (isHistoryEnabled(dlg)) {
      _approuter.default.pushState({
        dialogId: hash
      }, "Dialog", '#' + hash);
      navigation.addEventListener('navigate', onNavigate);
    }
    _inputmanager.default.on(dlg, onInputCommand);
    _events.default.on(_approuter.default, 'navigate', onAppRouterNavigate);
    positionDialog(dlg, ((_dlg$dialogOptions2 = dlg.dialogOptions) == null ? void 0 : _dlg$dialogOptions2.setDialogSize) === false ? true : false);
  }
  function onOpenAnimationFinish(e) {
    if (e.target !== e.currentTarget) {
      return;
    }
    var dlg = this;
    _dom.default.removeEventListener(dlg, 'animationend', onOpenAnimationFinish, {
      passive: true
    });
    if (dlg.getAttribute('data-focusscope') !== 'false') {
      _focusmanager.default.pushScope(dlg);
    }
    dlg.dispatchEvent(new CustomEvent('opened', {
      bubbles: false,
      cancelable: false
    }));
    if (dlg.getAttribute('data-autofocus') === 'true') {
      var _dlg$dialogOptions3;
      _focusmanager.default.autoFocus(dlg, {
        skipIfNotEnabled: ((_dlg$dialogOptions3 = dlg.dialogOptions) == null ? void 0 : _dlg$dialogOptions3.skipAutoFocusIfNotEnabled) !== false
      });
    }
    dlg.classList.add('afterOpened');
  }
  function animateDialogOpen(dlg) {
    if (enableAnimation(dlg)) {
      _dom.default.addEventListener(dlg, 'animationend', onOpenAnimationFinish, {
        passive: true
      });
      return;
    }
    onOpenAnimationFinish.call(dlg, {
      target: dlg,
      currentTarget: dlg
    });
  }
  function onDocumentMouseDown(e) {
    var dlg = this;
    dlg.pointerDownTarget = e.target;
  }
  function onDocumentClick(e) {
    var dlg = this;
    var target = e.target;
    if (!dlg.pointerDownTarget || dlg.pointerDownTarget === dlg.dialogContainer) {
      if (target === dlg.dialogContainer || !dlg.contains(target)) {
        requestClose(dlg);
      }
    }
    dlg.pointerDownTarget = null;
  }
  function bindEvents() {
    var dlg = this;
    if (!dlg.boundDocumentMouseDown) {
      dlg.boundDocumentMouseDown = onDocumentMouseDown.bind(dlg);
    }
    var elemForEvents = dlg.dialogContainer;

    // in case the dialog is hidden before the setTimeout completes
    if (!elemForEvents) {
      return;
    }
    _dom.default.addEventListener(elemForEvents, window.PointerEvent ? 'pointerdown' : 'mousedown', dlg.boundDocumentMouseDown, {
      passive: true
    });
    if (!dlg.boundDocumentClick) {
      dlg.boundDocumentClick = onDocumentClick.bind(dlg);
    }
    _dom.default.addEventListener(elemForEvents, 'click', dlg.boundDocumentClick, {
      passive: true
    });
  }
  function addBackdropOverlay(dlg) {
    var transparentBackground = dlg.getAttribute('data-transparentbackground') || 'false';
    var blurBackground = dlg.getAttribute('data-blurbackground') && _dom.default.allowBackdropFilter();
    if (transparentBackground !== 'true' || blurBackground) {
      dlg.dialogContainer.classList.add('dialogBackdrop');
      if (transparentBackground === 'true') {
        dlg.dialogContainer.classList.add('dialogBackdrop-nomouse');
      }
      if (blurBackground) {
        dlg.dialogContainer.classList.add('dialogBackdrop-blur');
      }
      if (transparentBackground === 'auto') {
        dlg.dialogContainer.classList.add('dialogBackdrop-auto');
      }

      // trigger reflow or the backdrop will not animate
      void dlg.dialogContainer.offsetWidth;
      dlg.dialogContainer.classList.add('dialogBackdropOpened');
    }
    setTimeout(bindEvents.bind(dlg), 100);
  }
  function blockInputCommandNavigation(dlg) {
    return dlg.getAttribute('data-blocknav') !== 'false';
  }
  function isHistoryEnabled(dlg) {
    return dlg.getAttribute('data-history') === 'true';
  }
  function getOffsets(elem, windowSize) {
    var doc = document;
    if (!doc) {
      return null;
    }
    var box = elem.getBoundingClientRect();
    return {
      top: box.top,
      bottom: windowSize.innerHeight - box.bottom,
      left: box.left,
      right: windowSize.innerWidth - box.right,
      width: box.width,
      height: box.height,
      verticalPositionProp: 'top',
      horizontalPositionProp: 'left'
    };
  }
  var UnknownDialogHeight = 300;
  var UnknownDialogWidth = 160;
  function getPosition(options, dlg, isInitialPositioning) {
    var windowSize = _dom.default.getWindowSize();
    var pos = getOffsets(options.positionTo, windowSize);
    var positionX = options.positionX;
    var positionY = options.positionY;
    var isRTL = document.dir === 'rtl';
    if (isRTL) {
      switch (positionX) {
        case 'right':
          positionX = 'left';
          break;
        case 'left':
          positionX = 'right';
          break;
        case 'after':
          positionX = 'before';
          break;
        case 'before':
          positionX = 'after';
          break;
        default:
          break;
      }
    }
    if (options.positionClientY != null) {
      positionY = 'top';
    }
    if (options.positionClientX != null) {
      positionX = 'left';
    }
    switch (positionY) {
      case 'bottom':
        pos.top += pos.height || 0;
        if (pos.height) {
          pos.top += 2;
        }
        break;
      case 'above':
        pos.verticalPositionProp = 'bottom';
        break;
      case 'top':
      case 'match':
        break;
      default:
        // case center
        pos.top += (pos.height || 0) / 2;
        break;
    }
    var dlgHeight;
    var dlgWidth;
    switch (positionX) {
      case 'after':
        if (!isRTL) {
          pos.left += pos.width || 0;
        }
        break;
      case 'right':
        if (!isRTL) {
          pos.horizontalPositionProp = 'right';
        }
        break;
      case 'before':
        if (!isRTL) {
          pos.horizontalPositionProp = 'right';
          pos.right += pos.width || 0;
        }
        break;
      case 'left':
        break;
      case 'match':
        break;
      default:
        if (dlgWidth == null) {
          dlgWidth = dlg.offsetWidth || UnknownDialogWidth;
        }

        // case center
        pos.left += (pos.width || 0) / 2;
        pos.left -= dlgWidth / 2;
        break;
    }
    pos.offsetTop = options.offsetTop || 0;
    pos.offsetLeft = options.offsetLeft || 0;
    if (options.positionClientY != null) {
      pos.offsetTop += options.positionClientY - pos.top;
    }
    if (options.positionClientX != null) {
      pos.offsetLeft += options.positionClientX - pos.left;
    }
    pos.top += pos.offsetTop || 0;
    pos.left += pos.offsetLeft || 0;

    // Account for popup size
    switch (positionY) {
      case 'above':
        pos.bottom += pos.height;
        break;
      case 'bottom':
      case 'center':
      case 'top':
      case 'match':
        break;
      default:
        if (!isInitialPositioning) {
          if (dlgHeight == null) {
            dlgHeight = dlg.offsetHeight || UnknownDialogHeight;
          }
          pos.top -= dlgHeight / 2;
        }
        break;
    }
    if (!isInitialPositioning) {
      //Avoid showing too close to the bottom
      var containerHeight = windowSize.innerHeight;
      var containerWidth = windowSize.innerWidth;

      //add a little extra in case of focus scaling
      var padding = _layoutmanager.default.tv ? 30 : 20;
      if (dlgWidth == null) {
        dlgWidth = dlg.offsetWidth || UnknownDialogWidth;
      }
      var overflowLeft = pos.left + dlgWidth - containerWidth + padding;
      if (overflowLeft > 0) {
        pos.left -= overflowLeft;
      }
      //console.log('dlgWidth: ' + dlgWidth);
      var overflowRight = pos.right + dlgWidth - containerWidth + padding;
      if (overflowRight > 0) {
        pos.right -= overflowRight;
      }
      if (options.autoRepositionY !== false) {
        if (dlgHeight == null) {
          dlgHeight = dlg.offsetHeight || UnknownDialogHeight;
        }
        var overflowTop = pos.top + dlgHeight - containerHeight + padding;
        if (overflowTop > 0) {
          // only move up if it's closer to the bottom of the screen
          if (pos.top > containerHeight / 2) {
            pos.top -= overflowTop;
          }
        }
        var overflowBottom = pos.bottom + dlgHeight - containerHeight + padding;
        if (overflowBottom > 0) {
          // only move if it's closer to the top of the screen
          if (pos.bottom > containerHeight / 2) {
            pos.bottom -= overflowBottom;
          }
        }
      }
    }
    pos.top = Math.max(pos.top, 10);
    pos.bottom = Math.max(pos.bottom, 10);
    pos.left = Math.max(pos.left, 10);
    pos.right = Math.max(pos.right, 10);
    pos.positionY = positionY;
    pos.positionX = positionX;
    return pos;
  }
  function enablePositioning(dialogOptions) {
    return dialogOptions.positionTo && dialogOptions.size !== 'fullscreen';
  }
  var AnchorId = 0;
  function getAnchor(elem) {
    var container = elem.closest('.card,.listItem');
    if (container) {
      var anchor = container.querySelector('.cardFooterContent');
      if (anchor) {
        return anchor;
      }
      anchor = container.querySelector('.cardContent,.listItemContent');
      if (anchor) {
        return anchor;
      }
      return container;
    }
    return elem;
  }
  function positionDialog(dlg, isInitialPositioning) {
    //console.log('positionDialog: ' + new Error().stack);
    var options = dlg.dialogOptions;
    var pos = enablePositioning(options) ? getPosition(options, dlg, isInitialPositioning) : null;
    if (pos) {
      var anchor = options.positionTo && SupportsPositionAnchoring ? getAnchor(options.positionTo) : null;
      dlg.style.position = 'fixed';
      var horizontalPos = pos[pos.horizontalPositionProp];
      var verticalPos = pos[pos.verticalPositionProp];
      var positionYAnchored;
      var positionXAnchored;
      if (anchor) {
        //let positionArea = [];

        switch (pos.positionY) {
          case 'above':
            dlg.style.bottom = 'anchor(top)';
            //positionArea.push('top');
            positionYAnchored = true;
            break;
          case 'bottom':
            dlg.style.top = 'anchor(bottom)';
            //positionArea.push('bottom');
            positionYAnchored = true;
            break;
          case 'center':
            dlg.style.top = 'anchor(center)';
            //positionArea.push('center');
            positionYAnchored = true;
            break;
          case 'top':
            dlg.style.top = 'anchor(top)';
            //positionArea.push('y-start');
            positionYAnchored = true;
            break;
          case 'match':
            break;
          default:
            break;
        }
        switch (pos.positionX) {
          case 'left':
            dlg.style.left = 'anchor(left)';
            //positionArea.push('left');
            positionXAnchored = true;
            break;
          case 'right':
          case 'before':
            dlg.style.right = 'anchor(left)';
            //positionArea.push('left');
            positionXAnchored = true;
            break;
          case 'after':
            dlg.style.left = 'anchor(right)';
            //positionArea.push('right');
            positionXAnchored = true;
            break;
          default:
            break;
        }

        //if (positionArea.length) {
        //    dlg.style.positionArea = positionArea.join(' ');
        //}
      }
      if (positionXAnchored || positionYAnchored) {
        var _dlg$dialogContainer;
        var anchorName;
        anchorName = anchor.style.anchorName;
        if (!anchorName) {
          anchorName = '--dialoganchor' + AnchorId;
          AnchorId++;
          anchor.style.anchorName = anchorName;
        }
        dlg.style.positionAnchor = anchorName;
        (_dlg$dialogContainer = dlg.dialogContainer) == null || _dlg$dialogContainer.classList.add('dialogBackdrop-anchored');
        var positionTryFallbacks = [];
        if (positionYAnchored) {
          positionTryFallbacks.push('flip-block');
        }
        if (positionXAnchored) {
          positionTryFallbacks.push('flip-inline');
        }
        if (positionTryFallbacks.length) {
          dlg.style.positionTryFallbacks = positionTryFallbacks.join(',');
        }
      }
      if (positionXAnchored) {
        dlg.style.marginLeft = pos.offsetLeft + 'px';
      } else {
        dlg.style[pos.horizontalPositionProp] = horizontalPos + 'px';
      }
      if (positionYAnchored) {
        dlg.style.marginTop = pos.offsetTop + 'px';
      } else {
        dlg.style[pos.verticalPositionProp] = verticalPos + 'px';
      }
      if (options.setDialogSize === false) {
        return;
      }
      var envCss = appMode === 'android' ? 'var(--window-inset-bottom, 0)' : 'env(safe-area-inset-bottom, 0)';
      var envSubtraction = SupportsCalcEnv ? ' - ' + envCss : '';
      if (options.fixedSize) {
        if (positionYAnchored) {
          dlg.style.height = 'calc(98% - anchor(bottom)' + envSubtraction + ')';
        } else {
          dlg.style.height = 'calc(98% - ' + verticalPos + 'px' + envSubtraction + ')';
        }
      } else {
        if (!positionYAnchored) {
          dlg.style.maxHeight = 'calc(98% - ' + verticalPos + 'px' + envSubtraction + ')';
        }
      }
      if (options.minWidthToElement && pos.width) {
        if (options.fixedSize) {
          if (positionXAnchored) {
            dlg.style.width = 'anchor-size(width)';
          } else {
            dlg.style.width = pos.width + 'px';
          }
        } else {
          if (positionXAnchored) {
            dlg.style.minWidth = 'anchor-size(width)';
          } else {
            dlg.style.minWidth = pos.width + 'px';
          }
        }
      }
    }
  }
  function addGestures(dlg) {
    var gesture = new _gesture.default(dlg);
    dlg.gesture = gesture;
    gesture.on('panmove', function (event) {
      var target = event.target;
      if (target.closest('.dragHandle,input[type="range"]')) {
        dlg.classList.remove('dialog-dragging');
        gesture.isScrolling = true;
        gesture.isDragging = null;
        return;
      }
      var scroller = target.closest('.emby-scroller.scrollY');
      var diff = gesture.touchMoveY;
      if (scroller) {
        var scrollTop = scroller.getScrollTop();
        if (diff < 0) {
          if (scrollTop <= 0) {
            dlg.classList.remove('dialog-dragging');
            gesture.isScrolling = true;
            gesture.isDragging = null;
            return;
          }
        }
        if (scrollTop !== 0) {
          dlg.classList.remove('dialog-dragging');
          gesture.isScrolling = true;
          gesture.isDragging = null;
          return;
        }
      }
      if (gesture.isScrolling) {
        return;
      }

      // todo: reset this on resizes
      if (gesture.isSliding == null) {
        gesture.isSliding = getComputedStyle(dlg).getPropertyValue('animation-name') === 'slideup';
      }
      gesture.isDragging = gesture.isSliding;
      if (gesture.isDragging) {
        event.preventDefault();
        dlg.classList.add('dialog-draggable', 'dialog-dragging');
        dlg.style.translate = '0 ' + Math.max(Math.floor(diff), 0) + 'px';
      }
    });
    gesture.on('panend', function (event) {
      dlg.classList.remove('dialog-dragging');
      dlg.style.translate = 'none';
      gesture.isScrolling = null;
    });
    gesture.on('swipedown', function () {
      dlg.classList.remove('dialog-dragging');
      dlg.style.translate = 'none';
      if (gesture.isDragging) {
        gesture.isDragging = null;
        requestClose(dlg);
      }
    });
  }
  function open(dlg) {
    if (!_layoutmanager.default.tv && SupportsTranslate && dlg.classList.contains('dialog-swipe-close')) {
      addGestures(dlg);
    }

    // in case we're showing a dialog that was previously closed
    dlg.classList.remove('dialog-close');
    if (globalOnOpenCallback) {
      globalOnOpenCallback(dlg);
    }
    dlg.remove();
    var dialogContainer = document.createElement('div');
    dialogContainer.classList.add('dialogContainer');
    dialogContainer.appendChild(dlg);
    dlg.dialogContainer = dialogContainer;
    document.body.appendChild(dialogContainer);
    return new Promise(function (resolve, reject) {
      new DialogHashHandler(dlg, 'dlg' + Date.now(), resolve);
    });
  }
  function isOpened(dlg) {
    //return dlg.opened;
    return !dlg.classList.contains('hide');
  }
  function requestClose(dlg, forceClose) {
    if (!isOpened(dlg)) {
      return;
    }
    if (dlg.queryCloseHandler && !dlg.queryCloseHandler(dlg, forceClose)) {
      return;
    }
    close(dlg);
  }
  function close(dlg) {
    if (!isOpened(dlg)) {
      return;
    }
    if (isHistoryEnabled(dlg)) {
      _approuter.default.back();
    } else {
      hideDialog(dlg);
    }
  }
  function onCloseAnimationFinish(e) {
    if (e.target !== e.currentTarget) {
      return;
    }
    var dlg = this;
    _dom.default.removeEventListener(dlg, 'animationend', onCloseAnimationFinish, {
      passive: true
    });
    _focusmanager.default.popScope(dlg);
    dlg.classList.add('hide');
    dlg.dispatchEvent(new CustomEvent('close', {
      bubbles: false,
      cancelable: true
    }));
  }
  function hideDialog(dlg) {
    if (dlg.gesture) {
      dlg.gesture.destroy();
      dlg.gesture = null;
    }
    if (dlg.classList.contains('hide')) {
      return;
    }
    dlg.dispatchEvent(new CustomEvent('preclosing', {
      bubbles: false,
      cancelable: false
    }));
    dlg.dispatchEvent(new CustomEvent('closing', {
      bubbles: false,
      cancelable: false
    }));
    dlg.classList.add('dialog-close');
    if (enableAnimation(dlg)) {
      _dom.default.addEventListener(dlg, 'animationend', onCloseAnimationFinish, {
        passive: true
      });
      return;
    }
    onCloseAnimationFinish.call(dlg, {
      target: dlg,
      currentTarget: dlg
    });
  }

  //let supportsOverscrollBehavior = 'overscroll-behavior-y' in document.body.style;
  function shouldLockDocumentScroll(options) {
    //if (supportsOverscrollBehavior) {
    //    return false;
    //}

    return true;
  }
  function removeBackdrop(dlg) {
    var backdrop = dlg.dialogContainer;
    if (!backdrop) {
      return;
    }
    var onAnimationFinish = function () {
      tryRemoveElement(backdrop);
    };
    if (enableAnimation(dlg)) {
      backdrop.classList.remove('dialogBackdropOpened');

      // this is not firing animatonend
      setTimeout(onAnimationFinish, 300);
      return;
    }
    onAnimationFinish();
  }
  function createDialog(options) {
    if (!options) {
      options = {};
    }
    var positionX = options.positionX;
    var transformOrigin = options.transformOrigin;
    if (document.dir === 'rtl') {
      switch (positionX) {
        case 'right':
          positionX = 'left';
          break;
        case 'left':
          positionX = 'right';
          break;
        case 'after':
          positionX = 'before';
          break;
        case 'before':
          positionX = 'after';
          break;
        default:
          break;
      }
      if (transformOrigin === 'right top') {
        transformOrigin = 'left top';
      } else if (transformOrigin === 'left top') {
        transformOrigin = 'right top';
      } else if (transformOrigin === 'left bottom') {
        transformOrigin = 'right bottom';
      } else if (transformOrigin === 'right bottom') {
        transformOrigin = 'left bottom';
      }
    }

    // If there's no native dialog support, use a plain div
    // Also not working well in samsung tizen browser, content inside not clickable
    // Just go ahead and always use a plain div because we're seeing issues overlaying absoltutely positioned content over a modal dialog
    var dlg = options.dialog || document.createElement('div');
    dlg.classList.add('hide', 'focuscontainer');
    if (shouldLockDocumentScroll(options)) {
      dlg.setAttribute('data-lockscroll', 'true');
    }
    if (allowHistory && options.enableHistory !== false) {
      dlg.setAttribute('data-history', 'true');
    }
    if (options.autoFocus !== false) {
      dlg.setAttribute('data-autofocus', 'true');
    }
    dlg.classList.add('dialog', 'dialog-animated');
    if (options.animate === false || !enableAnimation()) {
      dlg.classList.add('dialog-noanimation');
    }
    if (options.blockInputCommandNavigation === false) {
      dlg.setAttribute('data-blocknav', 'false');
    }
    if (options.setCurrentFocusScope === false) {
      dlg.setAttribute('data-focusscope', 'false');
    }
    if (options.removeOnClose) {
      dlg.setAttribute('data-removeonclose', 'true');
    }
    if (options.transparentBackground) {
      dlg.setAttribute('data-transparentbackground', options.transparentBackground);
    }
    if (options.blurBackground && options.size !== 'fullscreen') {
      dlg.setAttribute('data-blurbackground', 'true');
    }
    if (options.size) {
      dlg.classList.add('dialog-fixedSize', 'dialog-' + options.size);
    }
    var autoCenter = options.autoCenter !== false;
    var isFullscreen = options.size === 'fullscreen';
    if (options.autoLowResLayout !== false && !_layoutmanager.default.tv && !isFullscreen) {
      dlg.classList.add('dialog-fullscreen-lowres');
      if (options.lowResXMargin) {
        dlg.classList.add('dialog-fullscreen-lowres-xmargin');
      }
      if (options.lowResAutoHeight) {
        dlg.classList.add('dialog-fullscreen-lowres-autoheight');
      }
      if (options.lowResAutoHeight && !autoCenter && !options.size && options.lowerLowResThreshold) {
        //
      } else {
        dlg.classList.add('dialog-fullscreen-lowres-higherthreshold');
      }
    }
    if (autoCenter && !dlg.classList.contains('dialog-fixedSize')) {
      dlg.classList.add('centeredDialog');
    }
    if (options.swipeClose !== false) {
      dlg.classList.add('dialog-swipe-close');
    }
    if (enablePositioning(options)) {
      if (transformOrigin) {
        if (transformOrigin === 'center top') {
          dlg.classList.add('dialog-transformorigin-top');
        } else if (transformOrigin === 'left top') {
          dlg.classList.add('dialog-transformorigin-lefttop');
        } else if (transformOrigin === 'right top') {
          dlg.classList.add('dialog-transformorigin-righttop');
        } else if (transformOrigin === 'center bottom') {
          dlg.classList.add('dialog-transformorigin-bottom');
        } else if (transformOrigin === 'right bottom') {
          dlg.classList.add('dialog-transformorigin-rightbottom');
        } else if (transformOrigin === 'left bottom') {
          dlg.classList.add('dialog-transformorigin-leftbottom');
        }
      } else if (options.positionY === 'bottom') {
        switch (positionX) {
          case 'right':
          case 'after':
            dlg.classList.add('dialog-transformorigin-lefttop');
            break;
          case 'left':
          case 'before':
            dlg.classList.add('dialog-transformorigin-righttop');
            break;
          default:
            dlg.classList.add('dialog-transformorigin-top');
            break;
        }
      } else if (options.positionY === 'top') {
        switch (positionX) {
          case 'right':
          case 'after':
            dlg.classList.add('dialog-transformorigin-lefttop');
            break;
          case 'left':
          case 'before':
            dlg.classList.add('dialog-transformorigin-righttop');
            break;
          default:
            dlg.classList.add('dialog-transformorigin-bottom');
            break;
        }
      }
    }
    dlg.dialogOptions = options;
    if (options.queryCloseHandler) {
      dlg.queryCloseHandler = options.queryCloseHandler;
    }
    return dlg;
  }
  var _default = _exports.default = {
    open: open,
    close: close,
    createDialog: createDialog,
    setOnOpen: function (val) {
      globalOnOpenCallback = val;
    },
    positionDialog: positionDialog
  };
});
