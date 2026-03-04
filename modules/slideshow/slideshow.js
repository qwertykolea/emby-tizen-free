define(["exports", "./../browser.js", "./../dom.js", "./../layoutmanager.js", "./../focusmanager.js", "./../dialoghelper/dialoghelper.js", "./../common/inputmanager.js", "./../cardbuilder/cardbuilder.js", "./../common/servicelocator.js", "./../emby-apiclient/events.js", "./../emby-apiclient/connectionmanager.js", "./../input/mouse.js", "./../emby-elements/emby-scroller/emby-scroller.js", "./../emby-elements/emby-dialogclosebutton/emby-dialogclosebutton.js", "./../emby-elements/emby-itemscontainer/emby-itemscontainer.js", "./../common/playback/playbackmanager.js"], function (_exports, _browser, _dom, _layoutmanager, _focusmanager, _dialoghelper, _inputmanager, _cardbuilder, _servicelocator, _events, _connectionmanager, _mouse, _embyScroller, _embyDialogclosebutton, _embyItemscontainer, _playbackmanager) {
  Object.defineProperty(_exports, "__esModule", {
    value: true
  });
  _exports.default = _default;
  /* jshint module: true */

  var CSSPromise = require(['css!modules/slideshow/style.css', 'css!tv|modules/slideshow/tv.css']).then(function () {
    CSSPromise = Promise.resolve();
  });
  function getIcon(icon, cssClass, iconClass, canFocus, autoFocus) {
    var tabIndex = canFocus ? '' : ' tabindex="-1"';
    return '<button type="button" is="paper-icon-button-light" class="' + cssClass + '"' + tabIndex + '><i class="md-icon ' + (iconClass || '') + '">' + icon + '</i></button>';
  }
  function showContextMenu(options) {
    return Emby.importModule('./modules/itemcontextmenu.js').then(function (itemContextMenu) {
      return itemContextMenu.show(options);
    });
  }
  function setUserScalable(scalable) {
    try {
      _servicelocator.appHost.setUserScalable(scalable);
    } catch (err) {
      console.error('error in appHost.setUserScalable: ', err);
    }
  }
  function getItems(query) {
    query = query || {};
    var items = this.options.items;
    var totalRecordCount = items.length;
    var limit = query.Limit;
    items = items.slice(query.StartIndex || 0);
    if (limit && items.length > limit) {
      items.length = limit;
    }
    return Promise.resolve({
      Items: items,
      TotalRecordCount: totalRecordCount
    });
  }
  function afterRefresh(result) {
    this.TotalRecordCount = result.TotalRecordCount;
  }
  function getListOptions(items) {
    var fields = this.options.cardFields || ['Name'];
    var windowSize = _dom.default.getWindowSize();
    var cardFooterClass = 'slideshowCardFooter';
    if (this.options.interactive) {
      cardFooterClass += ' slideshowCardFooter-interactive';
    }
    cardFooterClass += ' slideshow-largefont';
    return {
      renderer: _cardbuilder.default,
      options: {
        shape: 'backdrop',
        preferBackdrop: true,
        overlayText: true,
        fields: fields,
        multiSelect: false,
        hoverMenu: false,
        cardClass: 'slideshowCard',
        cardBoxClass: 'slideshowCardBox',
        cardContentClass: 'slideshowCardContent',
        cardImageClass: 'slideshowCardImage',
        innerCardFooterClass: cardFooterClass,
        cardTextClass: 'slideshowCardText',
        centerText: true,
        staticElement: true,
        action: 'none',
        contextMenu: false,
        draggable: false,
        ignoreUIAspect: true,
        playedIndicator: false,
        playQueueIndicator: false
      },
      virtualScrollLayout: 'horizontal-grid',
      minOverhang: Math.max(windowSize.innerHeight, windowSize.innerWidth) * 5
    };
  }
  var isNativeSmoothScrollSupported = 'scrollBehavior' in document.documentElement.style;
  function _default(options) {
    var self = this;
    var dlg;
    var currentTimeout;
    var currentIntervalMs;
    var currentIndex;
    this.options = options;

    // small hack since this is not possible anyway
    if (_browser.default.chromecast) {
      options.interactive = false;
    }
    var supportsTouchEvent = 'ontouchstart' in document.documentElement;
    function updateVirtualElement(elem, item, index) {
      _embyItemscontainer.default.prototype.updateVirtualElement.apply(this, arguments);
      if (!elem) {
        return;
      }
      var classList = elem.classList;
      if (classList) {
        if (index === currentIndex) {
          classList.add('slideshowCard-current');
        } else {
          classList.remove('slideshowCard-current');
        }
      }
    }
    function detectIndex(scrollBehavior) {
      var windowSize = _dom.default.getWindowSize();
      var x = windowSize.innerWidth / 2;
      var y = windowSize.innerHeight / 2;
      var elem = document.elementFromPoint(x, y);
      if (elem) {
        elem = elem.closest('.card');
        if (elem) {
          var index = self.itemsContainer.indexOfElement(elem);
          scrollToIndex(index, scrollBehavior, false);
        }
      }
    }
    function onScrollTimeout() {
      self.scrolling = false;
      var isProgramScroll = self.isProgramScroll;
      self.isProgramScroll = false;
      if (!isProgramScroll) {
        detectIndex('smooth');
      }
      self.dlg.classList.remove('slideshow-scrolling');
      if (self.btnPlayVideo) {
        var _getCurrentItem;
        if (((_getCurrentItem = getCurrentItem()) == null ? void 0 : _getCurrentItem.MediaType) === 'Video') {
          self.btnPlayVideo.classList.remove('hide');
        } else {
          self.btnPlayVideo.classList.add('hide');
        }
      }
    }
    var scrollTimeout;
    function stopScrollTimer() {
      if (scrollTimeout) {
        clearTimeout(scrollTimeout);
      }
    }
    function startScrollTimer() {
      if (scrollTimeout) {
        clearTimeout(scrollTimeout);
      }
      scrollTimeout = setTimeout(onScrollTimeout, 400);
    }
    function onScroll() {
      var isProgramScroll = self.isProgramScroll;
      self.scrolling = true;
      if (!isProgramScroll) {
        restartInterval();
        self.dlg.classList.add('slideshow-scrolling');
      }
      startScrollTimer();
    }
    var resizeTimeout;
    var resizeIndex;
    function onResizeTimeout() {
      scrollToIndex(resizeIndex, 'instant', false);
    }
    function stopResizeTimer() {
      if (resizeTimeout) {
        clearTimeout(resizeTimeout);
      }
    }
    function startResizeTimer() {
      if (resizeTimeout) {
        clearTimeout(resizeTimeout);
      }
      resizeTimeout = setTimeout(onResizeTimeout, 100);
    }
    function onResize() {
      if (!self.scrolling || self.isProgramScroll) {
        console.log('slideshow resize');
        resizeIndex = currentIndex;
        stopResizeTimer();
        startResizeTimer();
      }
    }
    function onItemsContainerUpgraded() {
      var instance = this;

      // the CSS must be loaded or the cards may not be sized correctly
      CSSPromise.then(function () {
        instance.itemsContainer.resume({
          refresh: true
        }).then(function () {
          instance.scroller.addResizeObserver(onResize);
          showNextImage(instance.options.startIndex || 0, 'instant', true);
        });
      });
    }
    function onDialogOpened() {
      // add this now to prevent an ugly flash of content
      this.dlg.classList.add('slideshow-crossfade');
      var itemsContainer = this.itemsContainer;
      if (itemsContainer.resume) {
        onItemsContainerUpgraded.call(this);
      } else {
        _dom.default.addEventListener(itemsContainer, 'upgraded', onItemsContainerUpgraded.bind(this), {
          once: true
        });
      }
      this.scroller.addScrollEventListener(onScroll.bind(this), {});
    }
    function createElements(options) {
      dlg = _dialoghelper.default.createDialog({
        size: 'fullscreen',
        autoFocus: false,
        scrollY: false,
        removeOnClose: true,
        autoLowResLayout: false
      });
      self.dlg = dlg;
      dlg.classList.add('slideshowDialog');
      var html = '';
      html += '<div is="emby-scroller" data-scrollbuttons="false" data-mousewheel="false" data-forcesmoothscroll="' + (options.interactive && !isNativeSmoothScrollSupported).toString() + '" data-horizontal="true" class="padded-top-focusscale padded-bottom-focusscale slideshowScroller darkContentContainer graphicContentContainer">';
      html += '<div is="emby-itemscontainer" class="itemsContainer scrollSlider focuscontainer-x slideshowItemsContainer" data-virtualscrolllayout="horizontal-grid" data-scrollresizeobserver="true">';
      html += '</div>';
      html += '</div>';
      if (options.interactive) {
        html += '<div class="topActionButtons focuscontainer-x flex align-items-center">';
        html += '<button type="button" is="emby-dialogclosebutton" class="slideshowButton btnSlideshowExit" data-blur="true"></button>';
        html += '<div class="slideshow-topActionButtons-right">';
        html += getIcon('more_horiz', 'btnMore slideshowButton hide-mouse-idle-tv', null, false, false);
        html += '</div>';
        html += '</div>';
        if (_layoutmanager.default.tv) {
          html += '<div class="slideshowBottomBar hide">';
        } else {
          html += '<div class="slideshowBottomBar slideshow-largefont hide">';
        }
        html += '<div class="flex align-items-center buttonItems">';
        if (_layoutmanager.default.tv) {
          html += getIcon('&#xe045;', 'btnSlideshowPrevious buttonItems-item slideshowButton', 'md-icon-fill', true, false);
        } else {
          html += getIcon('&#xe045;', 'btnSlideshowPrevious buttonItems-item slideshowButton hidetouch', 'md-icon-fill', true, false);
        }
        html += getIcon('&#xe034;', 'btnSlideshowPause buttonItems-item slideshowButton', 'md-icon-fill', true, true);
        if (_layoutmanager.default.tv) {
          html += getIcon('&#xe044;', 'btnSlideshowNext buttonItems-item slideshowButton', 'md-icon-fill', true, false);
        } else {
          html += getIcon('&#xe044;', 'btnSlideshowNext buttonItems-item slideshowButton hidetouch', 'md-icon-fill', true, false);
        }
        html += '</div>';
        html += '<button type="button" is="emby-button" class="hide slideshow-btnPlayVideo btnPlayVideo raised raised-mini" style="font-size:90%;">';
        //html += '<i class="md-icon md-icon-fill button-icon button-icon-left">&#xe037;</i>';
        html += '<span>Play Video</span></button>';
        html += '</div>';
      }
      dlg.innerHTML = html;
      var itemsContainer = dlg.querySelector('.itemsContainer');
      itemsContainer.fetchData = options.getItems || getItems.bind(self);
      itemsContainer.getListOptions = getListOptions.bind(self);
      itemsContainer.afterRefresh = afterRefresh.bind(self);
      itemsContainer.updateVirtualElement = updateVirtualElement.bind(itemsContainer);
      self.itemsContainer = itemsContainer;
      self.scroller = dlg.querySelector('.slideshowScroller');
      if (options.interactive) {
        dlg.querySelector('.btnSlideshowNext').addEventListener('click', nextImage);
        dlg.querySelector('.btnSlideshowPrevious').addEventListener('click', previousImage);
        var btnPause = dlg.querySelector('.btnSlideshowPause');
        if (btnPause) {
          btnPause.addEventListener('click', self.playPause.bind(self));
        }
        var btnMore = dlg.querySelector('.btnMore');
        if (btnMore) {
          btnMore.addEventListener('click', self.showMoreMenu.bind(self));
          btnMore.classList.add('paper-icon-button-light-blur');
          if (_dom.default.allowBackdropFilter()) {
            btnMore.classList.add('paper-icon-button-light-blur-bf');
          }
        }
        var btnPlayVideo = dlg.querySelector('.btnPlayVideo');
        self.btnPlayVideo = btnPlayVideo;
        if (btnPlayVideo) {
          btnPlayVideo.addEventListener('click', self.playVideo.bind(self));
        }
      }
      setUserScalable(true);
      _mouse.default.requestMouseListening("slideshow");
      dlg.addEventListener('opened', onDialogOpened.bind(self));
      _dialoghelper.default.open(dlg).then(function () {
        _mouse.default.releaseMouseListening("slideshow");
        setUserScalable(false);
        stopInterval();
      });

      // This dialog doesn't focus anything when it opens, so add this to prevent focus from staying on the previous element
      if (document.activeElement) {
        document.activeElement.blur();
      }
      _inputmanager.default.on(dlg, onInputCommand);
      _dom.default.addEventListener(document, window.PointerEvent ? 'pointermove' : 'mousemove', onPointerMove, {
        passive: true
      });
      _dom.default.addEventListener(document, window.PointerEvent ? 'pointerenter' : 'mouseenter', onPointerEnter, {
        passive: true,
        capture: true
      });
      _dom.default.addEventListener(document, window.PointerEvent ? 'pointerleave' : 'mouseleave', onPointerLeave, {
        passive: true,
        capture: true
      });
      dlg.addEventListener('close', onDialogClosed);
    }
    function previousImage() {
      stopInterval();
      showNextImage(currentIndex - 1, false);
    }
    function nextImage() {
      stopInterval();
      showNextImage(currentIndex + 1, false);
    }
    function getCurrentItem() {
      var index = currentIndex;
      if (index != null && index !== -1) {
        return self.itemsContainer.getItem(index);
      }
    }
    function getBaseActionSheetOptions(positionTo) {
      return {
        positionTo: positionTo,
        positionX: 'before',
        positionY: 'bottom',
        transformOrigin: 'right top',
        noTextWrap: true
      };
    }
    function getCommandOptions(item, user, button) {
      return Object.assign(getBaseActionSheetOptions(button), {
        items: [item],
        open: false,
        play: false,
        playSlideshow: false,
        playAllFromHere: false,
        queueAllFromHere: false,
        cancelTimer: false,
        record: false,
        deleteItem: false,
        shuffle: false,
        instantMix: false,
        user: user,
        share: true,
        queue: false,
        editSubtitles: false,
        convert: false,
        refreshMetadata: false,
        identify: false
      });
    }
    function showMoreMenu(item, button) {
      var apiClient = _connectionmanager.default.getApiClient(item.ServerId);
      return apiClient.getCurrentUser().then(function (user) {
        return apiClient.getItem(apiClient.getCurrentUserId(), item.Id, {
          ExcludeFields: 'Chapters,Overview,People,MediaStreams'
        }).then(function (serverItem) {
          return showContextMenu(getCommandOptions(serverItem, user, button));
        });
      });
    }
    self.play = function () {
      var btnSlideshowPause = dlg.querySelector('.btnSlideshowPause i');
      if (btnSlideshowPause) {
        btnSlideshowPause.innerHTML = "&#xe034;";
      }
      self.paused = false;
    };
    self.pause = function () {
      var btnSlideshowPause = dlg.querySelector('.btnSlideshowPause i');
      if (btnSlideshowPause) {
        btnSlideshowPause.innerHTML = "&#xe037;";
      }
      self.paused = true;
    };
    self.playVideo = function () {
      var item = getCurrentItem();
      if (item) {
        hideOsd();
        self.pause();
        _playbackmanager.default.play({
          items: [item]
        });
      }
    };
    self.playPause = function () {
      showOsd();
      var paused = self.paused;
      if (paused) {
        self.play();
      } else {
        self.pause();
      }
    };
    self.showMoreMenu = function (e) {
      showOsd();
      showMoreMenu(getCurrentItem(), e.target);
    };
    function onDialogClosed() {
      _inputmanager.default.off(this, onInputCommand);
      _dom.default.removeEventListener(document, window.PointerEvent ? 'pointermove' : 'mousemove', onPointerMove, {
        passive: true
      });
      _dom.default.removeEventListener(document, window.PointerEvent ? 'pointerenter' : 'mouseenter', onPointerEnter, {
        passive: true,
        capture: true
      });
      _dom.default.removeEventListener(document, window.PointerEvent ? 'pointerleave' : 'mouseleave', onPointerLeave, {
        passive: true,
        capture: true
      });
      _events.default.trigger(self, 'closed');
    }
    function startInterval() {
      stopInterval();
      createElements(self.options);
      currentIntervalMs = self.options.interval || 10000;
      if (self.options.interactive && !_layoutmanager.default.tv && !self.options.autoplay) {
        self.pause();
      } else {
        self.play();
      }
    }
    var _osdOpen = false;
    function isOsdOpen() {
      return _osdOpen;
    }
    function getOsdTop() {
      return dlg.querySelector('.topActionButtons');
    }
    function getOsdBottom() {
      return dlg.querySelector('.slideshowBottomBar');
    }
    function showOsd() {
      var bottom = getOsdBottom();
      if (bottom) {
        slideUpToShow(bottom);
        startHideTimer();
      }
      var top = getOsdTop();
      if (top) {
        slideDownToShow(top);
      }
    }
    var mouseOverButton;
    function hideOsd() {
      if (mouseOverButton) {
        return;
      }
      var bottom = getOsdBottom();
      if (bottom) {
        slideDownToHide(bottom);
      }
      var top = getOsdTop();
      if (top) {
        slideUpToHide(top);
      }
    }
    var hideTimeout;
    function startHideTimer() {
      stopHideTimer();
      hideTimeout = setTimeout(hideOsd, 5000);
    }
    function stopHideTimer() {
      if (hideTimeout) {
        clearTimeout(hideTimeout);
        hideTimeout = null;
      }
    }
    function slideUpToShow(elem) {
      if (!elem.classList.contains('hide')) {
        return;
      }
      _osdOpen = true;
      elem.classList.remove('hide');
      var onFinish = function () {
        _focusmanager.default.focus(elem.querySelector('.btnSlideshowPause'));
      };
      onFinish();
      if (!elem.animate) {
        onFinish();
        return;
      }
      requestAnimationFrame(function () {
        var keyframes = [{
          transform: 'translate3d(0,' + elem.offsetHeight + 'px,0)',
          opacity: '.3',
          offset: 0
        }, {
          transform: 'translate3d(0,0,0)',
          opacity: '1',
          offset: 1
        }];
        var timing = {
          duration: 300,
          iterations: 1,
          easing: 'ease-out'
        };
        elem.animate(keyframes, timing).onfinish = onFinish;
      });
    }
    function slideDownToShow(elem) {
      if (!elem.classList.contains('hide')) {
        return;
      }
      elem.classList.remove('hide');
      var onFinish = function () {};
      if (!elem.animate) {
        onFinish();
        return;
      }
      requestAnimationFrame(function () {
        var keyframes = [{
          transform: 'translate3d(0,-' + elem.offsetHeight + 'px,0)',
          opacity: '.3',
          offset: 0
        }, {
          transform: 'translate3d(0,0,0)',
          opacity: '1',
          offset: 1
        }];
        var timing = {
          duration: 300,
          iterations: 1,
          easing: 'ease-out'
        };
        elem.animate(keyframes, timing).onfinish = onFinish;
      });
    }
    function slideDownToHide(elem) {
      if (elem.classList.contains('hide')) {
        return;
      }
      var onFinish = function () {
        elem.classList.add('hide');
        _osdOpen = false;
      };
      if (!elem.animate) {
        onFinish();
        return;
      }
      requestAnimationFrame(function () {
        var keyframes = [{
          transform: 'translate3d(0,0,0)',
          opacity: '1',
          offset: 0
        }, {
          transform: 'translate3d(0,' + elem.offsetHeight + 'px,0)',
          opacity: '.3',
          offset: 1
        }];
        var timing = {
          duration: 300,
          iterations: 1,
          easing: 'ease-out'
        };
        elem.animate(keyframes, timing).onfinish = onFinish;
      });
    }
    function slideUpToHide(elem) {
      if (elem.classList.contains('hide')) {
        return;
      }
      var onFinish = function () {
        elem.classList.add('hide');
      };
      if (!elem.animate) {
        onFinish();
        return;
      }
      requestAnimationFrame(function () {
        var keyframes = [{
          transform: 'translate3d(0,0,0)',
          opacity: '1',
          offset: 0
        }, {
          transform: 'translate3d(0,-' + elem.offsetHeight + 'px,0)',
          opacity: '.3',
          offset: 1
        }];
        var timing = {
          duration: 300,
          iterations: 1,
          easing: 'ease-out'
        };
        elem.animate(keyframes, timing).onfinish = onFinish;
      });
    }
    function onPointerEnter(e) {
      var pointerType = e.pointerType;
      if (pointerType === 'touch') {
        return;
      }
      if (!pointerType) {
        // pointer events not supported, let's take a guess
        if (supportsTouchEvent) {
          return;
        }
      }

      //console.log('mouse enter: ' + e.target.className);
      var target = e.target;
      mouseOverButton = target.closest && target.closest('button,a') != null;
    }
    function onPointerLeave(e) {
      mouseOverButton = null;
    }
    var lastMouseMoveData;
    function onPointerMove(e) {
      var pointerType = e.pointerType;
      if (!pointerType) {
        // pointer events not supported, let's take a guess
        pointerType = supportsTouchEvent ? 'touch' : 'mouse';
      }

      //if (pointerType === 'mouse') {
      var eventX = e.screenX || 0;
      var eventY = e.screenY || 0;
      var obj = lastMouseMoveData;
      if (!obj) {
        lastMouseMoveData = {
          x: eventX,
          y: eventY
        };
        return;
      }

      // if coord are same, it didn't move
      if (Math.abs(eventX - obj.x) < 10 && Math.abs(eventY - obj.y) < 10) {
        return;
      }
      obj.x = eventX;
      obj.y = eventY;
      showOsd();
      //}
    }
    var lastRepeatingKeyTime = 0;
    function throttleDirectional(e) {
      var timeStamp = e.timeStamp || Date.now();
      if (!timeStamp) {
        return false;
      }
      var timeSinceLastInput = timeStamp - lastRepeatingKeyTime;
      var throttle = timeSinceLastInput < 240;
      if (throttle) {
        e.preventDefault();
        e.stopPropagation();
        return true;
      }
      lastRepeatingKeyTime = timeStamp;
      return false;
    }
    function onInputCommand(e) {
      switch (e.detail.command) {
        case 'back':
          if (isOsdOpen()) {
            e.preventDefault();
            hideOsd();
          }
          break;
        case 'left':
          if (isOsdOpen()) {
            showOsd();
          } else if (!throttleDirectional(e)) {
            e.preventDefault();
            e.stopPropagation();
            if (document.dir === 'rtl') {
              nextImage();
            } else {
              previousImage();
            }
          }
          break;
        case 'right':
          if (isOsdOpen()) {
            showOsd();
          } else if (!throttleDirectional(e)) {
            e.preventDefault();
            e.stopPropagation();
            if (document.dir === 'rtl') {
              previousImage();
            } else {
              nextImage();
            }
          }
          break;
        case 'up':
          if (isOsdOpen()) {
            hideOsd();
          } else {
            showOsd();
          }
          break;
        case 'down':
        case 'select':
        case 'menu':
        case 'info':
          showOsd();
          break;
        case 'play':
          if (self.options.interactive) {
            e.preventDefault();
            self.play();
            showOsd();
          }
          break;
        case 'playpause':
          if (self.options.interactive) {
            e.preventDefault();
            self.playPause();
            showOsd();
          }
          break;
        case 'pause':
          if (self.options.interactive) {
            e.preventDefault();
            self.pause();
            showOsd();
          }
          break;
        case 'next':
          if (self.options.interactive) {
            e.preventDefault();
            nextImage();
          }
          break;
        case 'previous':
          if (self.options.interactive) {
            e.preventDefault();
            previousImage();
          }
          break;
        default:
          showOsd();
          break;
      }
    }
    var currentElement;
    var currentElementTimeout;
    function scrollToIndex(index, behavior, enableCrossfade) {
      currentIndex = index;
      var scrollOptions = {};
      if (behavior) {
        scrollOptions.behavior = behavior;
      }
      if (currentElement) {
        currentElement.classList.remove('slideshowCard-current');
        currentElement = null;
      }

      // user-initiated scroll
      self.isProgramScroll = behavior !== 'smooth';
      if (!enableCrossfade) {
        var elem = self.itemsContainer.getElement(index);
        if (elem) {
          elem.classList.add('slideshowCard-current');
        }
      }
      if (enableCrossfade) {
        self.dlg.classList.add('slideshow-crossfade');
      } else {
        self.dlg.classList.remove('slideshow-crossfade');
      }
      if (self.isProgramScroll) {
        self.dlg.classList.remove('slideshow-scrolling');
      } else {
        self.dlg.classList.add('slideshow-scrolling');
      }
      self.itemsContainer.scrollToIndex(index, scrollOptions, false);
      if (currentElementTimeout) {
        clearTimeout(currentElementTimeout);
      }

      // allow additional time for the virtual scroller to render
      currentElementTimeout = setTimeout(function () {
        var elem = self.itemsContainer.getElement(index);
        if (elem) {
          elem.classList.add('slideshowCard-current');
          currentElement = elem;
        }
      }, 100);
    }
    function showNextImage(index, scrollBehavior, enableCrossfade) {
      stopScrollTimer();
      stopResizeTimer();
      index = Math.max(0, index);
      if (index >= self.TotalRecordCount) {
        index = 0;
      }
      scrollToIndex(index, scrollBehavior, enableCrossfade);
      restartInterval();
    }
    function onInterval() {
      if (self.paused) {
        restartInterval();
      } else {
        showNextImage(currentIndex + 1, 'instant', true);
      }
    }
    function restartInterval() {
      stopInterval();
      currentTimeout = setTimeout(onInterval, currentIntervalMs);
    }
    function stopInterval() {
      if (currentTimeout) {
        clearTimeout(currentTimeout);
        currentTimeout = null;
      }
    }
    self.show = function () {
      startInterval();
    };
    self.hide = function () {
      var dialog = dlg;
      if (dialog) {
        _dialoghelper.default.close(dialog);
      }
    };
  }
});
