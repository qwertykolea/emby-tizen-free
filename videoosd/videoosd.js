define(["exports", "./../modules/common/playback/playbackmanager.js", "./../modules/focusmanager.js", "./../modules/cardbuilder/cardbuilder.js", "./../modules/common/imagehelper.js", "./../modules/dom.js", "./../modules/browser.js", "./../modules/common/globalize.js", "./../modules/common/datetime.js", "./../modules/layoutmanager.js", "./../modules/common/itemmanager/itemmanager.js", "./../modules/loading/loading.js", "./../modules/emby-apiclient/events.js", "./../modules/emby-apiclient/connectionmanager.js", "./../modules/appheader/appheader.js", "./../modules/mediainfo/mediainfo.js", "./../modules/backdrop/backdrop.js", "./playqueue.js", "./tvplayqueue.js", "./lyrics.js", "./chapters.js", "./../modules/approuter.js", "./../modules/itemcontextmenu.js", "./../modules/shortcuts.js", "./../modules/common/inputmanager.js", "./../modules/common/usersettings/usersettings.js", "./../modules/input/mouse.js", "./../modules/emby-elements/emby-scroller/emby-scroller.js", "./../modules/emby-elements/emby-button/paper-icon-button-light.js", "./../modules/emby-elements/emby-tabs/emby-tabs.js", "./../modules/emby-elements/emby-slider/emby-slider.js", "./../modules/common/appsettings.js", "./../modules/common/servicelocator.js", "./../modules/input/keyboard.js", "./../modules/viewmanager/baseview.js", "./../modules/playback/osdcontroller.js", "./../modules/common/playback/playersettingsmenu.js", "./specialicons.js", "./../modules/gesture/gesture.js", "./../modules/colorjs/color.js"], function (_exports, _playbackmanager, _focusmanager, _cardbuilder, _imagehelper, _dom, _browser, _globalize, _datetime, _layoutmanager, _itemmanager, _loading, _events, _connectionmanager, _appheader, _mediainfo, _backdrop, _playqueue, _tvplayqueue, _lyrics, _chapters, _approuter, _itemcontextmenu, _shortcuts, _inputmanager, _usersettings, _mouse, _embyScroller, _paperIconButtonLight, _embyTabs, _embySlider, _appsettings, _servicelocator, _keyboard, _baseview, _osdcontroller, _playersettingsmenu, _specialicons, _gesture, _color) {
  Object.defineProperty(_exports, "__esModule", {
    value: true
  });
  _exports.default = void 0;
  /* jshint module: true */

  require(['css!videoosd/videoosd.css', 'css!!tv|videoosd/videoosd_nontv.css', 'css!tv|videoosd/videoosd_tv.css']);
  var headerElement = document.querySelector('.skinHeader');
  var backgroundContainer = document.querySelector('.backgroundContainer');
  var headerRight = document.querySelector('.headerRight');
  function showActionSheet(options) {
    return Emby.importModule('./modules/actionsheet/actionsheet.js').then(function (ActionSheet) {
      return ActionSheet.show(options);
    });
  }
  function showConfirm(options) {
    return Emby.importModule('./modules/common/dialogs/confirm.js').then(function (confirm) {
      return confirm(options);
    });
  }
  var SupportsRadialGradient = CSS.supports('background-image', 'linear-gradient(to bottom,rgba(200, 194, 177, 1) 0%, rgba(122, 92, 92, 1) 100%)');
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
  function isPlaying(player, mediaType) {
    if (player && player.isLocalPlayer) {
      if (mediaType) {
        return true;
      }
      return _playbackmanager.default.isPlaying(player);
    }
    return false;
  }
  function isDisplayingLocalVideo(player, mediaType) {
    if (mediaType === 'Video') {
      return true;
    }
    if (mediaType) {
      return false;
    }
    if (player) {
      return _playbackmanager.default.isPlayingMediaType(['Video'], player);
    }
    return false;
  }
  function getRewindIconLTR() {
    switch (_usersettings.default.skipBackLength()) {
      case 5000:
        return '&#xe05b;';
      case 10000:
        return '&#xe059;';
      case 30000:
        return '&#xe05a;';
      default:
        return '&#xe042;';
    }
  }
  function getForwardIconLTR() {
    switch (_usersettings.default.skipForwardLength()) {
      case 5000:
        return '&#xe058;';
      case 10000:
        return '&#xe056;';
      case 30000:
        return '&#xe057;';
      default:
        return '&#xf6f4;';
    }
  }
  function setForwardIcon(btnFastForward) {
    var icon = btnFastForward.querySelector('i');
    icon.innerHTML = document.dir === 'rtl' ? getRewindIconLTR() : getForwardIconLTR();
  }
  function setRewindIcon(btnRewind) {
    var icon = btnRewind.querySelector('i');
    icon.innerHTML = document.dir === 'rtl' ? getForwardIconLTR() : getRewindIconLTR();
  }
  function getBaseActionSheetOptions(positionTo, isLocalVideo) {
    var popFromRightBottom = _layoutmanager.default.tv && isLocalVideo ? true : false;
    return {
      positionTo: positionTo,
      positionX: popFromRightBottom ? 'right' : null,
      positionY: 'above',
      transformOrigin: popFromRightBottom ? 'right bottom' : 'center bottom',
      noTextWrap: true,
      removeFromPlayQueue: false
    };
  }
  function getCommandOptions(item, user, button, isLocalVideo) {
    return Object.assign(getBaseActionSheetOptions(button, isLocalVideo), {
      items: [item],
      open: false,
      play: false,
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
  function showMoreMenu(item, button, isLocalVideo) {
    var apiClient = _connectionmanager.default.getApiClient(item.ServerId);
    return apiClient.getCurrentUser().then(function (user) {
      return _itemcontextmenu.default.show(getCommandOptions(item, user, button, isLocalVideo));
    });
  }
  function focusMainOsdControls(instance) {
    console.log('focusMainOsdControls');
    var elem = instance.nowPlayingPositionSlider;
    if (elem.disabled) {
      _focusmanager.default.autoFocus(instance.videoOsdBottomMaincontrols);
    } else {
      _focusmanager.default.focus(elem);
    }
  }
  function hideOrShowAll(instance, elems, hide, focusedElement) {
    var wasFocused;
    for (var i = 0, length = elems.length; i < length; i++) {
      var elem = elems[i];
      if (hide) {
        if (focusedElement && focusedElement === elem) {
          wasFocused = true;
        }
        elem.classList.add('hide');
      } else {
        elem.classList.remove('hide');
      }
    }
    if (wasFocused) {
      focusMainOsdControls(instance);
    }
  }
  function getTextActionButton(item, text, serverId) {
    if (!text) {
      text = _itemmanager.default.getDisplayName(item, {});
    }
    if (_layoutmanager.default.tv) {
      return text;
    }
    var dataAttributes = _shortcuts.default.getShortcutAttributesHtml(item, {});
    var html = '<button ' + dataAttributes + ' type="button" class="itemAction button-link osdTextActionButton" is="emby-button" data-action="link">';
    html += text;
    html += '</button>';
    return html;
  }
  function getSecondaryName(item, enableLinkButton) {
    // Don't use this for live tv programs because this is contained in mediaInfo.getPrimaryMediaInfoHtml
    var title = _itemmanager.default.getDisplayName(item, {
      includeParentInfo: item.Type !== 'Program',
      includeIndexNumber: item.Type !== 'Program'
    });
    if (!enableLinkButton) {
      return title;
    }
    return getTextActionButton(item, title);
  }
  function getAllArtistsHtml(displayItem) {
    var html = [];
    var artistItems = displayItem.ArtistItems;
    if (!artistItems) {
      return html;
    }
    for (var i = 0, length = artistItems.length; i < length; i++) {
      html.push(getTextActionButton({
        Id: artistItems[i].Id,
        ServerId: displayItem.ServerId,
        Name: artistItems[i].Name,
        Type: 'MusicArtist',
        IsFolder: true
      }));
    }
    return html;
  }
  function blurElementFromPreviousView(view) {
    var activeElement = document.activeElement;
    if (activeElement && !view.contains(activeElement)) {
      try {
        activeElement.blur();
      } catch (err) {
        console.error('Error blurring element from previous view: ', err);
      }
    }
  }
  function getDefaultOsdContentSection() {
    if (_layoutmanager.default.tv) {
      return 'playqueue';
    }
    var windowSize = _dom.default.getWindowSize();
    if (windowSize.innerWidth >= 1056) {
      return 'playqueue';
    }
    return null;
  }
  function destroyPlayQueue(instance) {
    var playQueue = instance.playQueue;
    if (playQueue) {
      playQueue.destroy();
      instance.playQueue = null;
    }
  }
  function destroyLyricsRenderer(instance) {
    var lyricsRenderer = instance.lyricsRenderer;
    if (lyricsRenderer) {
      lyricsRenderer.destroy();
      instance.lyricsRenderer = null;
    }
  }
  function destroyChaptersRenderer(instance) {
    var chaptersRenderer = instance.chaptersRenderer;
    if (chaptersRenderer) {
      chaptersRenderer.destroy();
      instance.chaptersRenderer = null;
    }
  }
  function destroyStats(instance) {
    var statsOverlay = instance.statsOverlay;
    if (statsOverlay) {
      statsOverlay.destroy();
      instance.statsOverlay = null;
    }
  }
  function destroySubtitleAppearanceDialog(instance) {
    var subtitleAppearanceDialog = instance.subtitleAppearanceDialog;
    if (subtitleAppearanceDialog) {
      subtitleAppearanceDialog.destroy();
      instance.subtitleAppearanceDialog = null;
    }
  }
  function destroySubtitleOffsetDialog(instance) {
    var subtitleOffsetDialog = instance.subtitleOffsetDialog;
    if (subtitleOffsetDialog) {
      subtitleOffsetDialog.destroy();
      instance.subtitleOffsetDialog = null;
    }
  }
  function closeOsdDialogs(instance) {
    // todo
  }
  function clearBlurFromDocumentElement(instance) {
    if (backgroundContainer) {
      backgroundContainer.style.backgroundImage = null;
      backgroundContainer.style.backgroundColor = null;
    }
  }
  function shouldOsdBeShown(instance) {
    if (!_layoutmanager.default.tv) {
      return true;
    }

    // if it's already showing, keep it up
    if (instance.currentVisibleMenu) {
      return true;
    }
    var player = instance.currentPlayer;
    return !player || isDisplayingLocalVideo(player);
  }
  function onMuteButtonClick() {
    _playbackmanager.default.toggleMute(this.currentPlayer);
  }
  function onTopMuteButtonClickDelay() {
    var instance = this;
    if (instance.isTopVolumeTransitioning) {
      return;
    }
    _playbackmanager.default.toggleMute(instance.currentPlayer);
  }
  function onTopMuteButtonClick(e) {
    if (!_layoutmanager.default.tv) {
      var top = e.target.closest('.videoOsdVolumeControls-top').querySelector('.videoOsdVolumeSliderWrapper-top');
      var style = window.getComputedStyle(top, null);
      if (style.getPropertyValue('--volumehideenabled') === '1') {
        setTimeout(onTopMuteButtonClickDelay.bind(this), 20);
        return;
      }
    }
    _playbackmanager.default.toggleMute(this.currentPlayer);
  }
  function onOsdBottomScroll() {
    var instance = this;
    instance.showOsd();
  }
  function onVolumeSliderInputOrChange(e) {
    var instance = this;
    var slider = e.target;
    _playbackmanager.default.setVolume(parseFloat(slider.value), instance.currentPlayer);
    instance.showOsd();
  }
  var SupportsTouchEvent = 'ontouchstart' in document.documentElement;
  var SupportsPointerType = typeof PointerEvent !== 'undefined' && 'pointerType' in PointerEvent.prototype;
  var DefaultPointerType = SupportsPointerType ? null : SupportsTouchEvent ? 'touch' : 'mouse';
  function onPointerMove(e) {
    var instance = this;
    var pointerType = e.pointerType || DefaultPointerType;
    if (pointerType === 'touch') {
      return;
    }
    var eventX = e.screenX || 0;
    var eventY = e.screenY || 0;
    var obj = instance.lastPointerMoveData;
    if (!obj) {
      instance.lastPointerMoveData = {
        x: eventX,
        y: eventY
      };
      instance.showOsd();
      return;
    }

    // if coord are same, it didn't move
    if (Math.abs(eventX - obj.x) < 10 && Math.abs(eventY - obj.y) < 10) {
      return;
    }
    obj.x = eventX;
    obj.y = eventY;
    instance.showOsd();
  }
  function onPointerEnter(e) {
    var instance = this;
    var pointerType = e.pointerType || DefaultPointerType;
    if (pointerType === 'touch') {
      return;
    }

    //console.log('mouse enter: ' + e.target.className);
    instance.mouseOverButton = e.target.closest('button,input,a') != null;
  }
  function onPointerLeave(e) {
    var instance = this;
    instance.mouseOverButton = null;
  }
  function rewind(instance, animate) {
    var player = instance.currentPlayer;
    if (animate) {
      var elem = instance.view.querySelector('.osd-rew-animationtext');
      elem.innerHTML = '-' + parseInt(_usersettings.default.skipBackLength() / 1000);
      fadeInAndOut(elem);
    }
    _playbackmanager.default.rewind(player);
  }
  function fadeInAndOut(elem) {
    if (elem.animate) {
      var keyframes = [{
        opacity: '1',
        offset: 0.5
      }, {
        opacity: '0',
        transform: 'none',
        offset: 1
      }];
      var timing = {
        duration: 600,
        iterations: 1,
        easing: 'ease-out'
      };
      try {
        elem.animate(keyframes, timing);
      } catch (err) {
        // partial keyframes may not be supported in some environments
        console.error('error animating element: ', err);
      }
    }
  }
  function fastForward(instance, animate) {
    var player = instance.currentPlayer;
    if (animate) {
      var elem = instance.view.querySelector('.osd-ff-animationtext');
      elem.innerHTML = '+' + parseInt(_usersettings.default.skipForwardLength() / 1000);
      fadeInAndOut(elem);
    }
    _playbackmanager.default.fastForward(player);
  }
  function getTimeInSeconds(ms) {
    if (Math.abs(ms) >= 1000) {
      ms = ms / 1000;
      return ms.toFixed(1) + ' seconds';
    }
    return ms + ' ms';
  }
  function onWindowKeyDown(e) {
    var instance = this;
    var key = _keyboard.default.normalizeKeyFromEvent(e);
    var target = e.target;
    //console.log('key: ' + key + ', target: ' + target.className);

    switch (key) {
      case ' ':
        {
          // check if something else has focus
          if (_focusmanager.default.hasExclusiveFocusScope()) {
            return;
          }
          if (instance.currentVisibleMenu && !target.closest('.videoOsdPositionSlider')) {
            instance.showOsd();
          }
          if (!target.closest('BUTTON') && !e.repeat && !instance.nowPlayingPositionSlider.dragging) {
            // check for parent button to avoid acting on keypress while stats is open
            console.log('videoosd - playPause from onWindowKeyDown');
            _playbackmanager.default.playPause(instance.currentPlayer);

            // Use a timeout, otherwise this click event will end up clicking the focused button (pause)
            if (shouldOsdBeShown(instance)) {
              setTimeout(instance.boundShowOsdDefaultParams, 100);
            }
          }
          return;
        }
      case 'b':
      case 'B':
        // check if something else has focus
        if (_focusmanager.default.hasExclusiveFocusScope()) {
          return;
        }
        if (e.ctrlKey) {
          if (e.shiftKey) {
            // control-shift
            e.preventDefault();
            rewind(instance);
            return;
          } else {
            // control
            e.preventDefault();
            _playbackmanager.default.previousChapter(instance.currentPlayer);
            return;
          }
        }
        break;
      case 'f':
      case 'F':
        // check if something else has focus
        if (_focusmanager.default.hasExclusiveFocusScope()) {
          return;
        }
        if (e.ctrlKey) {
          if (e.shiftKey) {
            // control-shift
            e.preventDefault();
            fastForward(instance);
            return;
          } else {
            // control
            e.preventDefault();
            _playbackmanager.default.nextChapter(instance.currentPlayer);
            return;
          }
        } else {
          _playbackmanager.default.toggleFullscreen(instance.currentPlayer);
        }
        break;
      case 'm':
      case 'M':
        // check if something else has focus
        if (_focusmanager.default.hasExclusiveFocusScope()) {
          return;
        }
        _playbackmanager.default.toggleMute(instance.currentPlayer);
        break;
      default:
        break;
    }
  }
  function onRecordingCommand(instance) {
    var btnRecord = instance.btnRecord;
    if (!btnRecord.classList.contains('hide')) {
      btnRecord.click();
    }
  }
  function onOsdClick(e, instance, elementToFocusIfShowing, showOsdIfNoEvent) {
    var target = e.target;
    if (target.closest('.videoOsdBottom')) {
      if (showOsdIfNoEvent) {
        instance.showOsd();
      }
      return false;
    }
    if (target.closest('button,.videoosd-tabsslider')) {
      return false;
    }
    var player = instance.currentPlayer;
    if (!e.button && player && isDisplayingLocalVideo(player)) {
      instance.showOsd(null, elementToFocusIfShowing);
      if (instance.bottomTabs.selectedIndex() >= 0) {
        instance.bottomTabs.selectedIndex(-1);
      } else {
        console.log('videoosd - playPause from onOsdClick');
        _playbackmanager.default.playPause(player);
      }
    } else {
      if (showOsdIfNoEvent) {
        instance.showOsd();
      }
    }
    return true;
  }
  function onStatsClosed() {
    var instance = this;
    if (instance.currentVisibleMenu) {
      if (!instance.upNextContainer._visible) {
        _focusmanager.default.focus(instance.btnVideoOsdSettingsRight);
      }
    }
  }
  function toggleStats(instance) {
    Emby.importModule('./modules/playerstats/playerstats.js').then(function (PlayerStats) {
      var player = instance.currentPlayer;
      if (!player) {
        return;
      }
      if (instance.statsOverlay) {
        instance.statsOverlay.toggle();
      } else {
        instance.statsOverlay = new PlayerStats({
          player: player,
          view: instance.view
        });
        _events.default.on(instance.statsOverlay, 'close', onStatsClosed.bind(instance));
      }
    });
  }
  function canSetBottomTabIndex(instance, index) {
    if (index === -1) {
      return true;
    }
    var bottomTabButtons = instance.bottomTabButtons;
    return !bottomTabButtons[index].classList.contains('hide');
  }
  function setBottomTabIndex(instance, index) {
    var bottomTabs = instance.bottomTabs;
    if (index === -1) {
      document.documentElement.classList.remove('osd-tab-guide');
      bottomTabs.selectedIndex(index);
      return;
    }
    var bottomTabButtons = instance.bottomTabButtons;
    if (bottomTabButtons[index].classList.contains('hide')) {
      return;
    }
    instance.showOsd(null, bottomTabButtons[index]);
    bottomTabs.selectedIndex(index);
    _focusmanager.default.focus(bottomTabButtons[index]);
  }
  function onRewindInputCommand(e, instance) {
    var isOsdVisible = instance.currentVisibleMenu;
    if (shouldOsdBeShown(instance)) {
      instance.showOsd();
      // return because if we're showing the osd, then the range input will receive the event
      return;
    }
    if (!isOsdVisible) {
      if (!e.detail.repeat) {
        rewind(instance);
        e.preventDefault();
      }
    }
  }
  function onFastForwardInputCommand(e, instance) {
    if (shouldOsdBeShown(instance)) {
      instance.showOsd();
      // return because if we're showing the osd, then the range input will receive the event
      return;
    }
    var isOsdVisible = instance.currentVisibleMenu;
    if (!isOsdVisible) {
      if (!e.detail.repeat) {
        fastForward(instance);
        e.preventDefault();
      }
    }
  }
  function onOsdHideTimeout() {
    var instance = this;
    if (_focusmanager.default.hasExclusiveFocusScope()) {
      startOsdHideTimer(instance);
      return;
    }
    if (instance.bottomTabs.selectedIndex() >= 0) {
      if (!_layoutmanager.default.tv || instance.tabContainersElem.contains(document.activeElement)) {
        startOsdHideTimer(instance);
        return;
      }
    }
    if (!instance.mouseOverButton && !instance.nowPlayingPositionSlider.dragging && !instance.nowPlayingVolumeSlider.dragging) {
      instance.hideOsd();
    }
  }
  function startOsdHideTimer(instance, timeoutMs) {
    stopOsdHideTimer(instance);
    if (instance.paused) {
      return;
    }
    var currentPlayer = instance.currentPlayer;
    var isLocalVideo = isDisplayingLocalVideo(currentPlayer);
    if (!isLocalVideo || !(currentPlayer != null && currentPlayer.isLocalPlayer)) {
      return;
    }
    if (timeoutMs !== 0) {
      if (_focusmanager.default.hasExclusiveFocusScope()) {
        return;
      }
      instance.osdHideTimeout = setTimeout(instance.boundOnOsdHideTimeout, timeoutMs || (isLocalVideo ? 4000 : 10000));
    }
  }
  function stopOsdHideTimer(instance) {
    var osdHideTimeout = instance.osdHideTimeout;
    if (osdHideTimeout) {
      clearTimeout(osdHideTimeout);
      instance.osdHideTimeout = null;
    }
  }
  function showOsdDefaultParams() {
    this.showOsd();
  }
  var orientationLocked = false;
  function onOrientationChangeSuccess() {
    orientationLocked = true;
  }
  function onOrientationChangeError(err) {
    orientationLocked = true;
    console.warn('error locking orientation: ', err);
  }
  function getOrientationLockPromise(orientation) {
    var promise;
    console.log('attempting to lock orientation to: ' + orientation);
    try {
      if (screen.orientation && screen.orientation.lock) {
        promise = screen.orientation.lock(orientation);
      }
      if (promise && promise.then) {
        return promise;
      }
      return Promise.resolve();
    } catch (err) {
      return Promise.reject(err);
    }
  }
  var systemUIHidden;
  function setSystemUIHidden(hidden) {
    if (systemUIHidden === hidden) {
      return;
    }
    systemUIHidden = hidden;
    if (_servicelocator.appHost.setSystemUIHidden) {
      try {
        _servicelocator.appHost.setSystemUIHidden(hidden);
      } catch (err) {
        console.error('Error in setSystemUIHidden: ', err);
      }
    }
  }
  var enableOrientationLock = !_browser.default.tv;
  function lockOrientation(type) {
    var _screen$orientation;
    if (!enableOrientationLock) {
      return;
    }
    type = type || ((_screen$orientation = screen.orientation) == null ? void 0 : _screen$orientation.type) || 'landscape';
    getOrientationLockPromise(type).then(onOrientationChangeSuccess, onOrientationChangeError);
  }
  function unlockOrientation() {
    if (!enableOrientationLock) {
      return;
    }
    if (orientationLocked && screen.orientation && screen.orientation.unlock) {
      console.log('unlocking orientation');
      try {
        screen.orientation.unlock();
      } catch (err) {
        console.error('error unlocking orientation: ', err);
      }
      orientationLocked = false;
    }
  }
  function getTabOnItemUpdatedData(instance) {
    return {
      item: instance.osdController.currentItem,
      displayItem: instance.osdController.currentDisplayItem,
      mediaSource: instance.osdController.currentMediaSource,
      currentPlayer: instance.currentPlayer,
      currentChapters: instance.osdController.currentChapters,
      currentDisplayChapters: instance.osdController.currentDisplayChapters
    };
  }
  function confirmPlaybackCorrection(instance) {
    if (_usersettings.default.get('confirmplaybackcorrection', false)) {
      return Promise.resolve();
    }
    var player = instance.currentPlayer;
    var wasPaused = _playbackmanager.default.paused(player);
    if (!wasPaused) {
      _playbackmanager.default.pause(player);
    }
    return showConfirm({
      title: _globalize.default.translate('HeaderPlaybackCorrection'),
      text: _globalize.default.translate('PlaybackCorrectionConfirm') + '\n\n' + _globalize.default.translate('PlaybackCorrectionDescription') + '\n\n' + _globalize.default.translate('PlaybackCorrectionDescription2'),
      confirmText: _globalize.default.translate('HeaderAttemptPlaybackCorrection'),
      primary: 'cancel'
      //centerText: false
    }).then(function () {
      //userSettings.set('confirmplaybackcorrection', 'true', false);
      return Promise.resolve();
    }, function () {
      if (!wasPaused) {
        _playbackmanager.default.unpause(player);
      }
      return Promise.reject();
    });
  }
  function triggerTranscodingFallback(instance, player) {
    confirmPlaybackCorrection(instance).then(function () {
      _playbackmanager.default.triggerTranscodingFallback(player);
    });
  }
  function showSubtitleOffset(instance) {
    Emby.importModule('./modules/subtitleoffsetdialog/subtitleoffsetdialog.js').then(function (SubtitleOffsetDialog) {
      var player = instance.currentPlayer;
      if (!player) {
        return;
      }
      if (instance.subtitleOffsetDialog) {
        return;
      }
      var positionTo = instance.btnSubtitles;
      instance.subtitleOffsetDialog = new SubtitleOffsetDialog(Object.assign(getBaseActionSheetOptions(positionTo, true), {
        player: player
      }));
      var onClosed = function () {
        destroySubtitleOffsetDialog(instance);
      };
      instance.subtitleOffsetDialog.show().then(onClosed, onClosed);
    });
  }
  function showSubtitleAppearance(instance) {
    Emby.importModule('./modules/subtitleappearancedialog/subtitleappearancedialog.js').then(function (SubtitleAppearanceDialog) {
      var player = instance.currentPlayer;
      if (!player) {
        return;
      }
      if (instance.subtitleAppearanceDialog) {
        return;
      }
      var positionTo = instance.btnSubtitles;
      var dlg = new SubtitleAppearanceDialog(Object.assign(getBaseActionSheetOptions(positionTo, true), {
        player: player,
        apiClient: _connectionmanager.default.getApiClient(instance.osdController.currentItem)
      }));
      var onClosed = function () {
        destroySubtitleAppearanceDialog(instance);
      };
      instance.subtitleAppearanceDialog = dlg;
      dlg.show().then(onClosed, onClosed);
    });
  }
  function onMoreClick(e) {
    var instance = this;
    var button = e.target;
    showMoreMenu(instance.osdController.currentItem, button, isDisplayingLocalVideo(instance.currentPlayer));
  }
  function onSettingsOption(selectedOption) {
    var info = this;
    var instance = info.instance;
    var button = info.button;
    var player = instance.currentPlayer;
    if (selectedOption === 'stats') {
      toggleStats(instance);
    } else if (selectedOption === 'subtitleoffset') {
      showSubtitleOffset(instance);
    } else if (selectedOption === 'subtitleappearance') {
      showSubtitleAppearance(instance);
    } else if (selectedOption === 'more') {
      onMoreClick.call(instance, {
        target: button
      });
    } else if (selectedOption === 'triggertranscodingfallback') {
      triggerTranscodingFallback(instance, player);
    }
  }
  function onSettingsButtonClick(e) {
    var instance = this;
    var button = e.target;
    var player = instance.currentPlayer;
    if (!player) {
      return;
    }

    // don't open if a dialog is already open. important because this dialog doesn't auto-focus due to not having a selected item
    if (_focusmanager.default.hasExclusiveFocusScope()) {
      return;
    }
    var mediaType = instance.osdController.currentItem.MediaType;
    var isLocalVideo = isDisplayingLocalVideo(player, mediaType);
    _playersettingsmenu.default.show(Object.assign(getBaseActionSheetOptions(button, isLocalVideo), {
      player: player,
      stats: true,
      onOption: onSettingsOption.bind({
        instance: instance,
        button: button
      }),
      mediaType: mediaType,
      speed: mediaType !== 'Video' || _layoutmanager.default.tv,
      more: isLocalVideo
    })).then(instance.boundShowOsdDefaultParams, instance.boundShowOsdDefaultParams);
  }
  function showAudioTrackSelection(e) {
    var instance = this;
    var button = e.target;
    var player = instance.currentPlayer;
    if (!player) {
      return;
    }
    var audioTracks = _playbackmanager.default.audioTracks(player);
    var currentIndex = _playbackmanager.default.getAudioStreamIndex(player);
    var menuItems = audioTracks.map(function (stream) {
      var opt = {
        name: stream.DisplayTitle,
        secondaryText: stream.Title && !(stream.DisplayTitle || '').toLowerCase().includes((stream.Title || '').toLowerCase()) ? stream.Title : null,
        id: stream.Index
      };
      if (stream.Index === currentIndex) {
        opt.selected = true;
      }
      return opt;
    });
    var positionTo = button;
    instance.showOsd();
    showActionSheet(Object.assign(getBaseActionSheetOptions(positionTo, true), {
      items: menuItems,
      title: _globalize.default.translate('Audio'),
      hasItemSelectionState: true,
      fields: ['Name', 'ShortOverview'],
      // in case there are any really long titles. avoid getting them clipped
      noTextWrap: false
    })).then(function (id) {
      instance.showOsd();
      var index = parseInt(id);
      if (index !== currentIndex) {
        _playbackmanager.default.setAudioStreamIndex(index, player);
      }
    }, instance.boundShowOsdDefaultParams);
  }
  function supportsSubtitleDownloading(instance, apiClient) {
    return instance.currentPlayerSupportedCommands.includes('RefreshMediaSource');
  }
  function searchForSubtitles(instance, item, mediaSource) {
    return Promise.all([Emby.importModule('./modules/registrationservices/registrationservices.js'), Emby.importModule('./modules/subtitleeditor/subtitleeditor.js')]).then(function (responses) {
      var registrationServices = responses[0];
      return registrationServices.validateFeature('sync').then(function () {
        var subtitleEditor = responses[1];
        return subtitleEditor.show({
          item: item,
          mediaSource: mediaSource,
          showCurrentSubtitles: false,
          autoSearch: true,
          closeOnDownload: true
        }).then(function (result) {
          instance.showOsd();
          _playbackmanager.default.setSubtitleStreamIndex(result.NewIndex, instance.currentPlayer, true);
        }, instance.boundShowOsdDefaultParams);
      });
    });
  }
  function showSubtitleTrackSelection(e) {
    var instance = this;
    var button = e.target;
    var player = instance.currentPlayer;
    var streams = _playbackmanager.default.subtitleTracks(player);
    var currentIndex = _playbackmanager.default.getSubtitleStreamIndex(player);
    if (currentIndex == null) {
      currentIndex = -1;
    }
    streams.unshift({
      Index: -1,
      DisplayTitle: _globalize.default.translate('Off')
    });
    var subtitleIcon = _itemmanager.default.getDefaultIcon({
      Type: 'MediaStream',
      StreamType: 'Subtitle'
    });
    var menuItems = streams.map(function (stream) {
      var opt = {
        name: stream.DisplayTitle,
        secondaryText: stream.Title && !(stream.DisplayTitle || '').toLowerCase().includes((stream.Title || '').toLowerCase()) ? stream.Title : null,
        id: stream.Index,
        icon: subtitleIcon
      };
      if (stream.Index === currentIndex) {
        opt.selected = true;
      }
      return opt;
    });
    var positionTo = button;
    var currentItem = instance.osdController.currentItem;
    var apiClient = _connectionmanager.default.getApiClient(currentItem);
    apiClient.getCurrentUser().then(function (user) {
      if (supportsSubtitleDownloading(instance, apiClient) && _itemmanager.default.canDownloadSubtitles(currentItem, user)) {
        menuItems.push({
          name: _globalize.default.translate('SearchForSubtitles'),
          id: 'search',
          icon: '&#xe8B6;'
        });
      }
      var settingsItems = [];
      var supportedCommands = _playbackmanager.default.getSupportedCommands(player);
      if (supportedCommands.includes('SetSubtitleAppearance') && player.isLocalPlayer) {
        var currentSubtitleStream = _playbackmanager.default.getSubtitleStream(player);
        var format = ((currentSubtitleStream == null ? void 0 : currentSubtitleStream.Codec) || '').toLowerCase();
        if (currentSubtitleStream != null && currentSubtitleStream.IsTextSubtitleStream && ['Hls', 'External', 'Embed'].includes(currentSubtitleStream.DeliveryMethod || '') && !['ass', 'ssa'].includes(format)) {
          settingsItems.push({
            name: _globalize.default.translate('HeaderSubtitleAppearance'),
            id: 'subtitleappearance',
            icon: '&#xe262;'
          });
        }
      }
      if (supportedCommands.includes('SetSubtitleOffset')) {
        var _currentSubtitleStream = _playbackmanager.default.getSubtitleStream(player);
        if (_currentSubtitleStream && (_currentSubtitleStream.DeliveryMethod === 'External' || _currentSubtitleStream.DeliveryMethod === 'Hls')) {
          settingsItems.push({
            name: _globalize.default.translate('HeaderSubtitleOffset'),
            id: 'subtitleoffset',
            secondaryText: getTimeInSeconds(_playbackmanager.default.getSubtitleOffset(player)),
            icon: '&#xe01b;'
          });
        }
      }
      if (settingsItems.length > 0) {
        settingsItems[settingsItems.length - 1].dividerAfter = true;
        menuItems.unshift.apply(menuItems, settingsItems);
      }
      instance.showOsd();
      showActionSheet(Object.assign(getBaseActionSheetOptions(positionTo, true), {
        title: _globalize.default.translate('Subtitles'),
        items: menuItems,
        hasItemSelectionState: true,
        hasItemIcon: true,
        fields: ['Name', 'ShortOverview'],
        // in case there are any really long titles. avoid getting them clipped
        noTextWrap: false
      })).then(function (id) {
        instance.showOsd();
        if (id === 'search') {
          searchForSubtitles(instance, currentItem, instance.osdController.currentMediaSource);
          return;
        }
        if (id === 'subtitleoffset') {
          showSubtitleOffset(instance);
          return;
        }
        if (id === 'subtitleappearance') {
          showSubtitleAppearance(instance);
          return;
        }
        var index = parseInt(id);
        if (index !== currentIndex) {
          _playbackmanager.default.setSubtitleStreamIndex(index, player);
        }
      }, instance.boundShowOsdDefaultParams);
    });
  }
  function onSpeedClick(e) {
    var instance = this;
    var btn = e.target;
    var player = instance.currentPlayer;
    if (!player) {
      return;
    }
    var mediaType = instance.osdController.currentItem.MediaType;
    var isLocalVideo = isDisplayingLocalVideo(player, mediaType);
    _playersettingsmenu.default.showSpeedMenu(Object.assign(getBaseActionSheetOptions(btn, isLocalVideo), {
      player: player,
      mediaType: mediaType
    })).then(instance.boundShowOsdDefaultParams, instance.boundShowOsdDefaultParams);
  }
  var focusOnTabChange = false;
  var PinchThreshold = 0.25;
  function setAspectRatio(instance, ratio) {
    var player = instance.currentPlayer;
    if (!(player != null && player.isLocalPlayer)) {
      return;
    }
    if (!isDisplayingLocalVideo(player)) {
      return;
    }
    _playbackmanager.default.setAspectRatio(ratio, player);
  }
  function addPinchGesture(instance) {
    if (instance.gesture) {
      return;
    }
    if (_layoutmanager.default.tv) {
      return;
    }
    if (globalThis.appMode !== 'android' && globalThis.appMode !== 'ios') {
      return;
    }
    var gesture = new _gesture.default(instance.view);
    instance.gesture = gesture;
    gesture.on('pinch', function (event) {
      var scale = gesture.scale;
      if (scale >= 1 + PinchThreshold) {
        setAspectRatio(instance, 'cover');
      } else if (scale < 1 - PinchThreshold) {
        setAspectRatio(instance, 'auto');
      }
    });
  }
  function destroyPinchGesture(instance) {
    if (instance.gesture) {
      instance.gesture.destroy();
      instance.gesture = null;
    }
  }
  function VideoOsd(view, params) {
    _baseview.default.apply(this, arguments);
    var self = this;
    this.currentPlayerSupportedCommands = [];
    var currentRuntimeTicks = 0;
    var comingUpNextDisplayed;
    var lastUpdateTime = 0;
    var isEnabled;
    var currentIntroInfo;
    var currentCreditsInfo;
    var ratingTextNeedsUpdate = true;
    this.currentLockState = 0;
    var skipIntroValidated;
    var brightnessSlider = view.querySelector('.videoOsdBrightnessSlider');
    var brightnessSliderContainer = view.querySelector('.brightnessSliderContainer');
    this.nowPlayingPositionSlider = view.querySelector('.videoOsdPositionSlider');
    if (_layoutmanager.default.tv && _appsettings.default.videoPlayerLongPressAction()) {
      this.nowPlayingPositionSlider.classList.add('longpress', 'dynamicKeyDownTarget');
    }
    this.nowPlayingVolumeSlider = view.querySelector('.videoOsdVolumeSlider');
    var videoOsdPositionText = view.querySelector('.videoOsdPositionText');
    var videoOsdDurationText = view.querySelector('.videoOsdDurationText');
    var floatPositionText = /*layoutManager.tv ? true :*/false;
    if (floatPositionText) {
      videoOsdPositionText.classList.add('videoOsdPositionText-floating');
    }
    this.videoOsdBottomMaincontrols = view.querySelector('.videoOsdBottom-maincontrols');
    this.osdController = new _osdcontroller.default({
      nowPlayingPositionSlider: this.nowPlayingPositionSlider,
      positionTextElem: videoOsdPositionText,
      durationTextElem: videoOsdDurationText,
      enableSeekThumbnails: true,
      parentElement: this.videoOsdBottomMaincontrols,
      setPositionSliderPosition: floatPositionText
    });
    _events.default.on(this.osdController, 'displayitemupdated', onDisplayItemUpdated);
    var rewindButtons = view.querySelectorAll('.btnRewind');
    var fastForwardButtons = view.querySelectorAll('.btnOsdFastForward');
    this.btnPause = view.querySelector('.videoOsd-btnPause');
    var stopButtons = view.querySelectorAll('.btnVideoOsd-stop');
    var btnRepeatModeTopRight = view.querySelector('.btnOsdRepeatMode-topright');
    var btnRepeatModeBottom = view.querySelector('.btnOsdRepeatMode-bottom');
    var btnShuffleTopRight = view.querySelector('.btnOsdShuffle-topright');
    var btnShuffleBottom = view.querySelector('.btnOsdShuffle-bottom');
    this.btnPlaybackSpeed = view.querySelector('.btnPlaybackSpeed');
    var btnOsdMoreBottom = view.querySelector('.btnOsdMore-bottom');
    var btnOsdMoreTitle = view.querySelector('.btnOsdMore-title');
    var transitionEndEventName = _dom.default.whichTransitionEvent();
    this.osdBottomElement = view.querySelector('.videoOsdBottom');
    var belowTransportButtonsContainer = view.querySelector('.videoOsd-belowtransportbuttons');
    var btnPreviousTrack = view.querySelector('.btnPreviousTrack');
    var btnNextTrack = view.querySelector('.btnNextTrack');
    var btnNextTrackTopRight = view.querySelector('.btnNextTrackTopRight');
    var buttonMute = view.querySelector('.buttonMute');
    this.btnSubtitles = view.querySelector('.btnSubtitles');
    this.btnAudio = view.querySelector('.btnAudio');
    var btnFullscreen = view.querySelector('.btnFullscreen');
    var videoOsdSecondaryText = view.querySelector('.videoOsdSecondaryText');
    this.videoOsdText = view.querySelector('.videoOsdText');
    var videoOsdBottomButtons = view.querySelector('.videoOsdBottom-buttons');
    var mainTransportButtons = view.querySelector('.videoOsd-maintransportbuttons');
    var videoOsdPositionContainer = view.querySelector('.videoOsdPositionContainer');
    var osdTitle = view.querySelector('.videoOsdTitle');
    var videoOsdThirdTitle = view.querySelector('.videoOsdThirdTitle');
    var videoOsdParentTitle = view.querySelector('.videoOsdParentTitle-small');
    var videoOsdParentTitleLarge = view.querySelector('.videoOsdParentTitle-large');
    var osdPosterContainer = view.querySelector('.osdPosterContainer');
    var videoOsdSecondaryMediaInfo = view.querySelector('.videoOsdSecondaryMediaInfo');
    var videoOsdAudioInfo = view.querySelector('.videoOsd-audioInfo');
    var mainLockButton = view.querySelector('.videoOsd-btnLock');
    this.bottomTabs = view.querySelector('.videoOsdBottom-tabs');
    this.bottomTabButtons = view.querySelectorAll('.videoosd-tab-button');
    var tabContainers = view.querySelectorAll('.videoosd-tab');
    this.bottomTabControllers = [];
    this.bottomTabControllers.length = tabContainers.length;
    this.tabContainersElem = view.querySelector('.videoosd-tabcontainers');
    var videoOsdBottomContentbuttons = view.querySelector('.videoOsdBottom-contentbuttons');
    this.upNextContainer = view.querySelector('.upNextContainer');
    var videoOsdVolumeControlsBottom = view.querySelector('.videoOsdVolumeControls-bottom');
    var videoOsdButtomButtonsTopRight = view.querySelector('.videoOsdBottom-buttons-topright');
    var ratingInfoContainer = view.querySelector('.videoOsd-ratingInfo');
    var ratingTextElement = view.querySelector('.videoOsd-ratingText');
    var btnSkipIntro = view.querySelector('.btnSkipIntro');
    var skipIntroContainer = view.querySelector('.skipIntroContainer');
    var btnLyrics = view.querySelector('.btnLyrics');
    var btnChapters = view.querySelector('.btnChapters');
    this.btnRecord = view.querySelector('.btnRecord');
    this.btnVideoOsdSettingsRight = view.querySelector('.btnVideoOsdSettings-right');
    var btnVideoOsdSettingsTransportButton = view.querySelector('.btnVideoOsdSettings-transport');
    var btnPlayNextFromUpNextProgress = view.querySelector('.btnPlayNextFromUpNext-progress');
    var btnHideUpNext = view.querySelector('.btnHideUpNext');
    var enableSkipIntro = true;
    var enableAutoSkipIntro;
    var lastPointerUpType;
    if (!_layoutmanager.default.tv) {
      videoOsdPositionText.classList.add('videoOsd-customFont-x0');
      videoOsdDurationText.classList.add('videoOsd-customFont-x0');
      ratingTextElement.classList.add('videoOsd-customFont-x2');
      videoOsdBottomButtons.classList.add('videoOsd-customFont-x2');
      videoOsdButtomButtonsTopRight.classList.add('videoOsd-customFont-x2');
      skipIntroContainer.classList.add('videoOsd-customFont-x2');
      this.upNextContainer.classList.add('videoOsd-customFont-x2');
      this.osdBottomElement.classList.add('videoOsd-nobuttonmargin');
    } else {
      videoOsdBottomButtons.classList.add('videoOsdBottom-buttons-tv');
    }
    var subtitleIcon = _itemmanager.default.getDefaultIcon({
      Type: 'MediaStream',
      StreamType: 'Subtitle'
    });
    var subtitleIconElement = view.querySelector('.subtitleIcon');
    if (subtitleIcon === '&#xe8cd;') {
      subtitleIconElement.classList.add('md-icon-pushdown-bubble');
    }
    subtitleIconElement.innerHTML = subtitleIcon;
    view.querySelector('.audioIcon').innerHTML = _itemmanager.default.getDefaultIcon({
      Type: 'MediaStream',
      StreamType: 'Audio'
    });
    view.querySelector('.lyricsIcon').innerHTML = _itemmanager.default.getDefaultIcon({
      Type: 'MediaStream',
      StreamType: 'Lyrics'
    });
    view.querySelector('.chaptersIcon').innerHTML = _itemmanager.default.getDefaultIcon({
      Type: 'Chapter',
      MediaType: 'Audio'
    });
    var currentOsdContentSectionName;
    for (var i = 0, length = fastForwardButtons.length; i < length; i++) {
      setForwardIcon(fastForwardButtons[i]);
    }
    for (var _i = 0, _length = rewindButtons.length; _i < _length; _i++) {
      setRewindIcon(rewindButtons[_i]);
    }
    var showOsdDefaultParamsTimeout;
    function clearTimeoutShowOsdDefaultParams() {
      if (showOsdDefaultParamsTimeout) {
        clearTimeout(showOsdDefaultParamsTimeout);
      }
    }
    function startTimeoutShowOsdDefaultParams() {
      clearTimeoutShowOsdDefaultParams();
      showOsdDefaultParamsTimeout = setTimeout(self.boundShowOsdDefaultParams, 150);
    }
    function onDoubleClick(e) {
      if (e.target.closest('BUTTON,input')) {
        return;
      }
      switch (lastPointerUpType) {
        case 'mouse':
          _playbackmanager.default.toggleFullscreen(self.currentPlayer);
          return;
        case 'touch':
          {
            var clientX = e.clientX;
            if (clientX != null) {
              var windowSize = _dom.default.getWindowSize();
              if (clientX <= windowSize.innerWidth * 0.3) {
                rewind(self, true);
                clearTimeoutShowOsdDefaultParams();
              } else if (clientX >= windowSize.innerWidth * 0.7) {
                fastForward(self, true);
                clearTimeoutShowOsdDefaultParams();
              }
              e.preventDefault();
              e.stopPropagation();
            }
          }
          break;
        default:
          break;
      }
    }
    function updateRecordingButton(item, user) {
      if (!item || item.Type !== 'Program') {
        var recordingButtonManager = self.recordingButtonManager;
        if (recordingButtonManager) {
          recordingButtonManager.destroy();
          self.recordingButtonManager = null;
        }
        self.btnRecord.classList.add('hide');
        return;
      }
      if (!user.Policy.EnableLiveTvManagement) {
        return;
      }
      Emby.importModule('./modules/recordingcreator/recordingbutton.js').then(function (RecordingButton) {
        var recordingButtonManager = self.recordingButtonManager;
        if (recordingButtonManager) {
          recordingButtonManager.refreshItem(item);
          return;
        }
        recordingButtonManager = self.recordingButtonManager = new RecordingButton({
          item: item,
          button: self.btnRecord
        });
        self.btnRecord.classList.remove('hide');
      });
    }
    function hasLiveTV(userViews) {
      for (var _i2 = 0, _length2 = userViews.length; _i2 < _length2; _i2++) {
        if (userViews[_i2].CollectionType === 'livetv') {
          return true;
        }
      }
      return false;
    }
    function updateButtomTabsVisibility(item, displayItem) {
      if (!item) {
        setBottomTabIndex(self, -1);
        self.tabContainersElem.classList.add('hide');
        self.bottomTabs.classList.add('hide');
        return;
      }
      var apiClient = _connectionmanager.default.getApiClient(item);
      var getUserViewsPromise = item.MediaType === 'Video' ? apiClient.getUserViews({}, apiClient.getCurrentUserId()) : Promise.resolve({
        Items: []
      });
      getUserViewsPromise.then(function (result) {
        var _self$osdController$c;
        var bottomTabButtons = self.bottomTabButtons;
        if (item.MediaType === 'Video') {
          bottomTabButtons[0].classList.remove('hide');
        } else {
          bottomTabButtons[0].classList.add('hide');
        }
        if ((_self$osdController$c = self.osdController.currentDisplayChapters) != null && _self$osdController$c.length) {
          bottomTabButtons[1].classList.remove('hide');
        } else {
          bottomTabButtons[1].classList.add('hide');
        }
        if (displayItem.People && displayItem.People.length) {
          bottomTabButtons[2].classList.remove('hide');
        } else {
          bottomTabButtons[2].classList.add('hide');
        }
        if (item.MediaType === 'Video' && _playbackmanager.default.getCurrentPlaylistLength(self.currentPlayer) > 1) {
          bottomTabButtons[3].classList.remove('hide');
        } else {
          bottomTabButtons[3].classList.add('hide');
        }

        // we should always show On Now if the user has live tv
        if (hasLiveTV(result.Items)) {
          bottomTabButtons[4].classList.remove('hide');
          bottomTabButtons[5].classList.remove('hide');
        } else {
          bottomTabButtons[4].classList.add('hide');
          bottomTabButtons[5].classList.add('hide');
        }
        var bottomTabs = self.bottomTabs;
        if (view.querySelector('.videoosd-tab-button:not(.hide)')) {
          self.tabContainersElem.classList.remove('hide');
          bottomTabs.classList.remove('hide');
        } else {
          self.tabContainersElem.classList.add('hide');
          bottomTabs.classList.add('hide');
        }
        var selectedIndex = bottomTabs.selectedIndex();
        if (selectedIndex >= 0) {
          if (bottomTabButtons[selectedIndex].classList.contains('hide')) {
            setBottomTabIndex(self, -1);
          }
        }
      });
    }
    function findStart(palette) {
      //const suggested = 0.179;

      for (var _i3 = 0, _length3 = palette.length; _i3 < _length3; _i3++) {
        console.log('relativeLuminance: ' + palette[_i3].relativeLuminance);
        if (palette[_i3].relativeLuminance < 0.19) {
          return _i3;
        }
      }
      return palette.length - 1;
    }
    function toCss(palette) {
      return palette.css;
    }
    function setBackgroundFromPalette(palette) {
      var start = findStart(palette);
      if (start < 0) {
        clearBlurFromDocumentElement();
        return;
      }
      palette = palette.slice(start);
      if (palette.length === 1) {
        backgroundContainer.style.backgroundColor = palette.map(toCss).join(',');
        backgroundContainer.style.backgroundImage = null;
        return;
      }
      var end = palette.length - 1;
      var useAll = false;
      if (!useAll) {
        palette = [palette[0], palette[end]];
      }
      backgroundContainer.style.backgroundImage = 'linear-gradient(to bottom, ' + palette.map(toCss).join(',') + ')';
      backgroundContainer.style.backgroundColor = null;
    }
    function updateBackdrop(displayItem, item, displayingLocalVideo, mediaType) {
      var backdropItems = [displayItem];
      if (item.Id !== displayItem.Id) {
        backdropItems.push(item);
      }
      if (displayingLocalVideo) {
        _backdrop.default.setBackdrops(backdropItems);
        view.classList.add('darkContentContainer', 'graphicContentContainer');
        // this is just to force the header to add the same styling (background) as when scrolling
        headerElement.classList.add('headroom-scrolling');
        clearBlurFromDocumentElement(self);
        return;
      }
      var nowPlayingBackgroundMethod = mediaType === 'Video' ? 'nowPlayingVideoBackgroundStyle' : 'nowPlayingAudioBackgroundStyle';
      if (SupportsRadialGradient && _usersettings.default[nowPlayingBackgroundMethod]() === 'blur') {
        item = getDetailImageItemsSync().Items[0];
        backdropItems = [];
        if (item) {
          var imageUrl = _imagehelper.default.getImageUrl(item, _connectionmanager.default.getApiClient(item), {
            width: 100,
            adjustForPixelRatio: false
          }).imgUrl;
          if (imageUrl) {
            _backdrop.default.setBackdrops(backdropItems);
            view.classList.add('darkContentContainer');
            view.classList.remove('graphicContentContainer');
            headerElement.classList.remove('headroom-scrolling');
            return _color.default.getPalette(imageUrl).then(setBackgroundFromPalette);
          }
        }
      }
      _backdrop.default.setBackdrops(backdropItems);
      clearBlurFromDocumentElement(self);
      headerElement.classList.remove('headroom-scrolling');
      if (_backdrop.default.hasBackdrop()) {
        view.classList.add('darkContentContainer', 'graphicContentContainer');
      } else {
        view.classList.remove('darkContentContainer', 'graphicContentContainer');
      }
    }
    function updateChaptersButton(item, displayItem, chapters) {
      if (chapters.length && !_layoutmanager.default.tv && (displayItem == null ? void 0 : displayItem.MediaType) === 'Audio') {
        btnChapters.classList.remove('hide');
        if (currentOsdContentSectionName) {
          var osdContentSectionType = item != null && item.SupportsResume ? 'audiobooks' : 'music';
          var userContentSection = _usersettings.default.osdContentSection(osdContentSectionType);
          if (userContentSection === 'chapters') {
            setContentSection(userContentSection, false);
          }
        }
      } else {
        btnChapters.classList.add('hide');
        if (currentOsdContentSectionName === 'chapters') {
          setContentSection(getDefaultOsdContentSection(), false);
        }
      }
    }
    function updateLyricsButton(item, displayItem) {
      if (displayItem && displayItem.MediaType !== 'Audio') {
        displayItem = null;
      }
      var mediaSources = (displayItem || {}).MediaSources || [];
      var mediaStreams = (mediaSources[0] || {}).MediaStreams || [];
      for (var _i4 = 0, _length4 = mediaStreams.length; _i4 < _length4; _i4++) {
        if (mediaStreams[_i4].Type === 'Subtitle') {
          btnLyrics.classList.remove('hide');
          if (currentOsdContentSectionName) {
            var osdContentSectionType = item != null && item.SupportsResume ? 'audiobooks' : 'music';
            var userContentSection = _usersettings.default.osdContentSection(osdContentSectionType);
            if (userContentSection === 'lyrics') {
              setContentSection(userContentSection, false);
            }
          }
          return;
        }
      }
      btnLyrics.classList.add('hide');
      if (currentOsdContentSectionName === 'lyrics') {
        setContentSection(getDefaultOsdContentSection(), false);
      }
    }
    function updateDisplayItem(state, item, displayItem, user, player, displayingLocalVideo) {
      updateRecordingButton(displayItem, user);
      updateButtomTabsVisibility(item, displayItem);
      var primaryNameText;
      var primaryNameHtml;
      if (displayItem.EpisodeTitle || displayItem.IsSeries) {
        primaryNameText = displayItem.Name;
      } else if (displayItem.SeriesName) {
        primaryNameText = displayItem.SeriesName;
        if (displayItem.SeriesId && !displayingLocalVideo) {
          primaryNameHtml = getTextActionButton({
            Id: displayItem.SeriesId,
            Type: 'Series',
            IsFolder: true,
            ServerId: displayItem.ServerId,
            Name: displayItem.SeriesName,
            ParentId: displayItem.ParentId
          });
        }
      } else if (displayItem.ArtistItems && displayItem.ArtistItems.length) {
        primaryNameText = displayItem.Name;
        primaryNameHtml = getAllArtistsHtml(displayItem).join(', ');
      }
      if (!primaryNameHtml) {
        primaryNameHtml = primaryNameText;
      }
      if (!state.IsInitialRequest) {
        setTitle(displayItem, item, primaryNameText);
        updateBackdrop(displayItem, item, displayingLocalVideo, item.MediaType);
      }
      if (displayingLocalVideo && player.isLocalPlayer) {
        setPoster(null);
        if (!state.IsInitialRequest) {
          addPinchGesture(self);
        }
      } else {
        if (!state.IsInitialRequest) {
          setPoster(displayItem, item);
        }
        destroyPinchGesture(self);
      }
      var titleElement = osdTitle;
      var secondaryName;
      if (item.MediaType === 'Audio') {
        secondaryName = getSecondaryName(displayItem, false);
        var temp = primaryNameHtml;
        primaryNameHtml = secondaryName;
        secondaryName = temp;
      } else {
        secondaryName = getSecondaryName(displayItem, !displayingLocalVideo);
      }
      if (!primaryNameHtml) {
        primaryNameHtml = secondaryName;
        secondaryName = null;
      }
      videoOsdParentTitle.innerHTML = primaryNameHtml;
      videoOsdParentTitleLarge.innerHTML = primaryNameHtml;
      if (primaryNameHtml) {
        videoOsdSecondaryText.classList.add('videoOsdSecondaryText-withparentname');
      } else {
        videoOsdSecondaryText.classList.remove('videoOsdSecondaryText-withparentname');
      }

      // Use the series name if there is no episode info
      if (!secondaryName && displayItem.Type === 'Program') {
        //displayName = displayItem.Name;
      }
      titleElement.innerHTML = secondaryName;
      if (secondaryName) {
        titleElement.classList.remove('hide');
      } else {
        titleElement.classList.add('hide');
      }
      var secondaryMediaInfo = videoOsdSecondaryMediaInfo;
      var secondaryMediaInfoHtml;
      if (displayItem.MediaType === 'Audio' || displayItem.Type !== 'Program' && !secondaryName) {
        secondaryMediaInfoHtml = _mediainfo.default.getMediaInfoHtml(displayItem, {
          runtime: false,
          endsAt: false,
          container: displayItem.MediaType === 'Audio',
          year: displayItem.MediaType !== 'Audio',
          CommunityRating: false,
          criticRating: false,
          subtitles: false,
          officialRating: false,
          mediaInfoIcons: false
        });
      } else if (displayItem.Type !== 'Program' && displayItem.Type !== 'Recording') {
        secondaryMediaInfoHtml = _mediainfo.default.getSecondaryMediaInfoHtml(displayItem, {
          startDate: false,
          programTime: false
        });
      }
      if (displayItem.MediaType === 'Audio' && displayItem.Album && displayItem.AlbumId) {
        videoOsdThirdTitle.innerHTML = getTextActionButton({
          Type: 'MusicAlbum',
          Id: displayItem.AlbumId,
          ServerId: displayItem.ServerId,
          Name: displayItem.Album
        });
        videoOsdThirdTitle.classList.remove('hide');
      } else {
        videoOsdThirdTitle.classList.add('hide');
      }
      var chapters = self.osdController.currentChapters;
      updateLyricsButton(item, displayItem);
      updateChaptersButton(item, displayItem, chapters);
      secondaryMediaInfo.innerHTML = secondaryMediaInfoHtml;
      videoOsdAudioInfo.innerHTML = secondaryMediaInfoHtml;
      if (secondaryMediaInfoHtml) {
        if (displayItem.MediaType === 'Audio') {
          secondaryMediaInfo.classList.add('hide');
          if (floatPositionText) {
            videoOsdAudioInfo.classList.add('hide');
          } else {
            videoOsdAudioInfo.classList.remove('hide');
          }
        } else {
          secondaryMediaInfo.classList.remove('hide');
          videoOsdAudioInfo.classList.add('hide');
        }
      } else {
        secondaryMediaInfo.classList.add('hide');
        videoOsdAudioInfo.classList.add('hide');
      }
      var lyricsRenderer = self.lyricsRenderer;
      if (lyricsRenderer) {
        lyricsRenderer.updateItem(displayItem);
      }
      var chaptersRenderer = self.chaptersRenderer;
      if (chaptersRenderer) {
        chaptersRenderer.updateItem(displayItem, chapters);
      }
      var introStart;
      var introEnd;
      var creditsStart;
      for (var _i5 = 0, _length5 = chapters.length; _i5 < _length5; _i5++) {
        var chapter = chapters[_i5];
        if (chapter.MarkerType === 'IntroStart') {
          introStart = chapter.StartPositionTicks;

          // Start with the next chapter as the intro end
          // Update later if we find an actual IntroEnd marker
          if (_i5 < chapters.length - 1) {
            introEnd = chapters[_i5 + 1].StartPositionTicks;
          }
        } else if (chapter.MarkerType === 'IntroEnd') {
          introEnd = chapter.StartPositionTicks;
        } else if (chapter.MarkerType === 'CreditsStart') {
          creditsStart = chapter.StartPositionTicks;
        }
      }
      if (creditsStart) {
        var introTimeForValidation = introEnd || introStart;
        if (introTimeForValidation && introTimeForValidation >= creditsStart) {
          // guard against possible bad data
          creditsStart = null;
        }
      }

      //introStart = (5 * 1000) * 10000;
      //introEnd = (20 * 1000) * 10000;

      currentIntroInfo = introStart != null && introEnd ? {
        start: introStart,
        end: introEnd
      } : null;
      currentCreditsInfo = creditsStart != null ? {
        start: creditsStart
      } : null;
      var bottomTabControllers = self.bottomTabControllers;
      for (var _i6 = 0, _length6 = bottomTabControllers.length; _i6 < _length6; _i6++) {
        if (bottomTabControllers[_i6]) {
          bottomTabControllers[_i6].onItemUpdated(getTabOnItemUpdatedData(self));
        }
      }
      var nowPlayingPositionSliderIcon = _specialicons.default.getNowPlayingPositionSliderIcon(displayItem);
      self.nowPlayingPositionSlider.setThumbIcon(nowPlayingPositionSliderIcon);

      // for testing
      //currentIntroInfo = {

      //    start: 30 * 1000 * 10000,
      //    end: 60 * 1000 * 10000
      //};
    }
    function updateNowPlayingInfo(event, player, state, displayingLocalVideo) {
      var item = state.NowPlayingItem;
      if (!item) {
        currentIntroInfo = null;
        currentCreditsInfo = null;
        ratingTextNeedsUpdate = true;
        setPoster(null);
        updateRecordingButton(null);
        _appheader.default.setTitle('');
        setElementDisabled(self.nowPlayingVolumeSlider, true);
        for (var _i7 = 0, _length7 = fastForwardButtons.length; _i7 < _length7; _i7++) {
          fastForwardButtons[_i7].classList.add('hide');
        }
        for (var _i8 = 0, _length8 = rewindButtons.length; _i8 < _length8; _i8++) {
          rewindButtons[_i8].classList.add('hide');
        }
        self.btnSubtitles.classList.add('hide');
        self.btnAudio.classList.add('hide');
        ratingInfoContainer.classList.add('hide');
        updateButtomTabsVisibility(null, null);
        osdTitle.innerHTML = '';
        view.querySelector('.videoOsdMediaInfo').innerHTML = '';
        return;
      }
    }
    function onDisplayItemUpdated(e, item, displayItem, state) {
      if (!displayItem) {
        return;
      }
      var apiClient = _connectionmanager.default.getApiClient(item);
      var player = self.currentPlayer;
      apiClient.getCurrentUser().then(function (user) {
        var displayingLocalVideo = isDisplayingLocalVideo(player, item.MediaType);
        updateDisplayItem(state, item, displayItem, user, player, displayingLocalVideo);
        setElementDisabled(self.nowPlayingVolumeSlider, false);
        if (item.MediaType === 'Video' || item.SupportsResume) {
          for (var _i9 = 0, _length9 = fastForwardButtons.length; _i9 < _length9; _i9++) {
            fastForwardButtons[_i9].classList.remove('hide');
            setElementDisabled(fastForwardButtons[_i9], state.IsInitialRequest === true);
          }
          for (var _i0 = 0, _length0 = rewindButtons.length; _i0 < _length0; _i0++) {
            rewindButtons[_i0].classList.remove('hide');
            setElementDisabled(rewindButtons[_i0], state.IsInitialRequest === true);
          }
        } else {
          for (var _i1 = 0, _length1 = fastForwardButtons.length; _i1 < _length1; _i1++) {
            fastForwardButtons[_i1].classList.add('hide');
          }
          for (var _i10 = 0, _length10 = rewindButtons.length; _i10 < _length10; _i10++) {
            rewindButtons[_i10].classList.add('hide');
          }
        }
        if (_playbackmanager.default.audioTracks(player).length > 1) {
          self.btnAudio.classList.remove('hide');
        } else {
          self.btnAudio.classList.add('hide');
        }
        enableSkipIntro = user.Configuration.IntroSkipMode !== 'None';
        enableAutoSkipIntro = user.Configuration.IntroSkipMode === 'AutoSkip';
        if (enableSkipIntro) {
          validateSkipIntroFeature({
            showDialog: false
          }, true);
        }

        // don't display this for audio due to lyrics
        if (item.MediaType !== 'Video') {
          self.btnSubtitles.classList.add('hide');
        } else if (_playbackmanager.default.subtitleTracks(player).length || _itemmanager.default.canDownloadSubtitles(item, user) && supportsSubtitleDownloading(self, apiClient)) {
          self.btnSubtitles.classList.remove('hide');
        } else {
          self.btnSubtitles.classList.add('hide');
        }
      });
    }
    function setTitle(item, originalItem, title) {
      _appheader.default.setLogoTitle({
        items: [item, originalItem],
        titleText: '',
        preferredLogoImageTypes: ['LogoLightColor', 'LogoLight', 'Logo']
      });
      var documentTitle = title || (item ? item.Name : null);
      if (documentTitle) {
        document.title = documentTitle;
      }
    }
    function setPoster(item, secondaryItem) {
      //console.trace('setPoster');

      var posterContainer = osdPosterContainer;
      if (item) {
        posterContainer.classList.remove('hide');
        posterContainer.resume({
          refresh: true
        });
      } else {
        posterContainer.classList.add('hide');
        posterContainer.innerHTML = '';
      }
    }
    function onBottomTransitionEnd(e) {
      var elem = e.currentTarget;
      if (elem === e.target) {
        if (elem.classList.contains('videoOsdBottom-hidden')) {
          elem.classList.add('hide');
          headerElement.classList.add('hide');
          setBottomTabIndex(self, -1);

          // just in case the tab transition doesn't happen due to the transition of a parent element
          onTabTransitionEnd.call(self.tabContainersElem, {
            target: self.tabContainersElem,
            currentTarget: self.tabContainersElem
          });
          if (self.currentLockState === 2) {
            self.setLockState(1);
          }
          view.dispatchEvent(new CustomEvent("video-osd-hide", {
            bubbles: true
          }));
        }
      }
    }
    function updateFullscreenIcon() {
      var title;
      if (_playbackmanager.default.isFullscreen(self.currentPlayer)) {
        title = _globalize.default.translate('ExitFullscreen');
        btnFullscreen.querySelector('i').innerHTML = '&#xe5D1;';
      } else {
        title = _globalize.default.translate('Fullscreen');
        btnFullscreen.querySelector('i').innerHTML = '&#xe5D0;';
      }
      btnFullscreen.title = title;
      btnFullscreen.setAttribute('aria-label', title);
    }
    function hideMediaTransportButtons(checkVideoUnderUI) {
      if (checkVideoUnderUI && _appsettings.default.enableVideoUnderUI()) {
        // need a place for the stop button
        return false;
      }
      var val = _appsettings.default.hideMediaTransportButtons();
      if (val === 'true') {
        return true;
      }
      if (val === 'false') {
        return false;
      }
      var lastMouseTime = _mouse.default.lastMouseInputTime();

      // auto
      return !lastMouseTime;
    }
    function onLyricsBackPress() {
      focusMainOsdControls(self);
    }
    function updateTransparency(player, state, mediaType, isLocalVideo) {
      console.log('updateTransparency: isLocalVideo:' + isLocalVideo + ', mediaType:' + mediaType);
      if (_layoutmanager.default.tv) {
        videoOsdSecondaryText.classList.add('videoOsdSecondaryText-tv');
      } else {
        videoOsdSecondaryText.classList.remove('videoOsdSecondaryText-tv');
      }
      var videoOsdText = self.videoOsdText;
      var bottomTabs = self.bottomTabs;
      var osdBottomElement = self.osdBottomElement;
      var hideTransportButtons;
      var item = state.NowPlayingItem;
      if (isLocalVideo) {
        createOsdResizeObserver(self);
        if (player.isLocalPlayer && !player.isExternalPlayer && !state.IsBackgroundPlayback) {
          // TODO: why is this here?
          if (!self.currentVisibleMenu) {
            headerElement.classList.add('videoOsdHeader-hidden', 'hide');
            osdBottomElement.classList.add('hide', 'videoOsdBottom-hidden');
          }
          switch (_appsettings.default.videoOrientation()) {
            case 'device':
              unlockOrientation();
              break;
            case 'landscape':
              lockOrientation('landscape');
              break;
            default:
              lockOrientation('any');
              break;
          }
          setSystemUIHidden(true);
        } else {
          headerElement.classList.remove('videoOsdHeader-hidden', 'hide');
          osdBottomElement.classList.remove('hide', 'videoOsdBottom-hidden');
          unlockOrientation();
          setSystemUIHidden(false);
        }
        osdBottomElement.classList.add('videoOsdBottom-video');
        osdPosterContainer.classList.remove('osdPosterContainer-autoexpand', 'osdPosterContainer-remotecontrol');
        videoOsdSecondaryText.classList.remove('videoOsdSecondaryText-remotecontrol');
        self.videoOsdBottomMaincontrols.classList.remove('videoOsdBottomMaincontrols-autoexpand');
        videoOsdPositionContainer.classList.remove('videoOsdPositionContainer-autosmall');
        videoOsdPositionContainer.classList.add('focuscontainer-x');
        belowTransportButtonsContainer.classList.remove('videoOsd-belowtransportbuttons-vertical');
        if (_layoutmanager.default.tv) {
          if (hideMediaTransportButtons(true)) {
            hideTransportButtons = true;
          }
          mainLockButton.classList.add('hide');
        } else {
          mainLockButton.classList.remove('hide');
        }
        videoOsdButtomButtonsTopRight.classList.remove('videoOsdBottom-buttons-topright-remotecontrol', 'videoOsdBottom-buttons-topright-remotecontrol-tv');
        self.tabContainersElem.classList.remove('videoosd-tabcontainers-autosmall');
        bottomTabs.classList.remove('videoOsdBottom-tabs-remotecontrol');
        videoOsdVolumeControlsBottom.classList.add('hide');
        if (self.topVolumeControls) {
          self.topVolumeControls.classList.remove('hide');
        }
        videoOsdParentTitle.classList.add('hide', 'osdText-nowrap');
        videoOsdParentTitleLarge.classList.add('osdText-nowrap');
        videoOsdParentTitleLarge.classList.remove('hide');

        // Make sure the UI is completely transparent

        if (state.IsInitialRequest || !player.isLocalPlayer) {
          _approuter.default.setTransparency(0);
        } else {
          _approuter.default.setTransparency('full');
        }
        hideOrShowAll(self, stopButtons, player.isLocalPlayer && (!_layoutmanager.default.tv || !_appsettings.default.enableVideoUnderUI()), null);
        videoOsdText.classList.remove('videoOsdText-remotecontrol', 'videoOsdText-autosmall', 'videoOsdText-remotecontrol-tv');
        videoOsdBottomButtons.classList.remove('videoOsdBottom-buttons-remotecontrol', 'videoOsdBottom-buttons-remotecontrol-tv');
        osdBottomElement.classList.remove('videoOsdBottom-remotecontrol', 'videoOsdBottom-safe', 'padded-top-page', 'videoOsdBottom-tvnowplaying');
        view.classList.remove('justify-content-flex-end');
        osdTitle.classList.remove('secondaryText');
        osdTitle.classList.add('osdText-nowrap');
        videoOsdSecondaryMediaInfo.classList.remove('videoOsdSecondaryMediaInfo-remotecontrol');
        videoOsdBottomButtons.classList.remove('videoOsd-customFont-remotecontrol-buttons', 'videoOsd-customFont-remotecontrol-buttons-largeportrait');
        videoOsdBottomContentbuttons.classList.add('hide');
        videoOsdBottomContentbuttons.classList.remove('videoOsdBottom-contentbuttons-tv');
        videoOsdPositionContainer.classList.remove('videoOsdPositionContainer-limitwidth');
        self.enableStopOnBack = player.isLocalPlayer ? true : false;
        self.enableBackOnStop = true;
        btnOsdMoreTitle.classList.add('hide');
        btnOsdMoreBottom.classList.add('hide');
      } else {
        destroyOsdResizeObserver(self);
        unlockOrientation();
        setSystemUIHidden(false);
        osdTitle.classList.add('secondaryText');
        osdTitle.classList.remove('osdText-nowrap');
        osdBottomElement.classList.remove('videoOsdBottom-video', 'videoOsdBottom-hidden', 'hide', 'videoosd-withupnext');
        self.showOsd();
        videoOsdParentTitleLarge.classList.remove('osdText-nowrap');
        videoOsdParentTitleLarge.classList.add('hide');
        videoOsdParentTitle.classList.remove('hide', 'osdText-nowrap');
        videoOsdSecondaryMediaInfo.classList.add('videoOsdSecondaryMediaInfo-remotecontrol');
        mainLockButton.classList.add('hide');
        osdPosterContainer.classList.add('osdPosterContainer-autoexpand', 'osdPosterContainer-remotecontrol');
        if (_layoutmanager.default.tv) {
          osdBottomElement.classList.add('videoOsdBottom-safe', 'padded-top-page', 'videoOsdBottom-tvnowplaying', 'videoOsdBottom-remotecontrol');
          view.classList.remove('justify-content-flex-end');
          belowTransportButtonsContainer.classList.remove('videoOsd-belowtransportbuttons-vertical');
          videoOsdText.classList.add('videoOsdText-remotecontrol', 'videoOsdText-remotecontrol-tv');
          videoOsdText.classList.remove('videoOsdText-autosmall');
          videoOsdSecondaryText.classList.add('videoOsdSecondaryText-remotecontrol');
          videoOsdBottomButtons.classList.remove('videoOsdBottom-buttons-remotecontrol', 'videoOsd-customFont-remotecontrol-buttons', 'videoOsd-customFont-remotecontrol-buttons-largeportrait');
          videoOsdBottomButtons.classList.add('videoOsdBottom-buttons-remotecontrol-tv');
          self.videoOsdBottomMaincontrols.classList.remove('videoOsdBottomMaincontrols-autoexpand');
          videoOsdPositionContainer.classList.add('focuscontainer-x');
          videoOsdPositionContainer.classList.remove('videoOsdPositionContainer-autosmall');
          self.tabContainersElem.classList.remove('videoosd-tabcontainers-autosmall');
          bottomTabs.classList.remove('videoOsdBottom-tabs-remotecontrol');
          videoOsdBottomContentbuttons.classList.add('videoOsdBottom-contentbuttons-tv');
          videoOsdBottomContentbuttons.classList.remove('hide');
          videoOsdVolumeControlsBottom.classList.add('hide');
          if (self.topVolumeControls) {
            self.topVolumeControls.classList.remove('hide');
          }
          videoOsdButtomButtonsTopRight.classList.remove('videoOsdBottom-buttons-topright-remotecontrol');
          videoOsdButtomButtonsTopRight.classList.add('videoOsdBottom-buttons-topright-remotecontrol-tv');
          btnOsdMoreTitle.classList.add('hide');
          btnOsdMoreBottom.classList.remove('hide');
        } else {
          osdBottomElement.classList.add('videoOsdBottom-remotecontrol', 'videoOsdBottom-safe', 'padded-top-page');
          view.classList.remove('justify-content-flex-end');
          belowTransportButtonsContainer.classList.add('videoOsd-belowtransportbuttons-vertical');
          videoOsdText.classList.add('videoOsdText-remotecontrol', 'videoOsdText-autosmall');
          videoOsdText.classList.remove('videoOsdText-remotecontrol-tv');
          self.videoOsdBottomMaincontrols.classList.add('videoOsdBottomMaincontrols-autoexpand');
          videoOsdPositionContainer.classList.add('videoOsdPositionContainer-autosmall');
          videoOsdPositionContainer.classList.remove('focuscontainer-x');
          self.tabContainersElem.classList.add('videoosd-tabcontainers-autosmall');
          bottomTabs.classList.add('videoOsdBottom-tabs-remotecontrol');
          videoOsdSecondaryText.classList.add('videoOsdSecondaryText-remotecontrol');
          videoOsdBottomButtons.classList.add('videoOsdBottom-buttons-remotecontrol');
          videoOsdBottomButtons.classList.remove('videoOsdBottom-buttons-remotecontrol-tv');
          if (!(item != null && item.SupportsResume)) {
            videoOsdBottomButtons.classList.add('videoOsd-customFont-remotecontrol-buttons', 'videoOsd-customFont-remotecontrol-buttons-largeportrait');
          } else {
            videoOsdBottomButtons.classList.add('videoOsd-customFont-remotecontrol-buttons');
            videoOsdBottomButtons.classList.remove('videoOsd-customFont-remotecontrol-buttons-largeportrait');
          }
          videoOsdBottomContentbuttons.classList.remove('hide', 'videoOsdBottom-contentbuttons-tv');
          videoOsdVolumeControlsBottom.classList.remove('hide');
          if (self.topVolumeControls) {
            self.topVolumeControls.classList.add('hide');
          }
          videoOsdButtomButtonsTopRight.classList.add('videoOsdBottom-buttons-topright-remotecontrol');
          videoOsdButtomButtonsTopRight.classList.remove('videoOsdBottom-buttons-topright-remotecontrol-tv');
          videoOsdPositionContainer.classList.add('videoOsdPositionContainer-limitwidth');
          btnOsdMoreTitle.classList.remove('hide');
          btnOsdMoreBottom.classList.add('hide');
        }
        _approuter.default.setTransparency(0);
        hideOrShowAll(self, stopButtons, false, null);
        self.enableStopOnBack = false;
        self.enableBackOnStop = true;
      }
      if (hideTransportButtons) {
        videoOsdBottomButtons.classList.add('hide');
        self.bottomTabs.classList.add('videoOsdTabs-margintop');
      } else {
        videoOsdBottomButtons.classList.remove('hide');
        self.bottomTabs.classList.remove('videoOsdTabs-margintop');
      }
      if (isLocalVideo) {
        destroyPlayQueue(self);
        destroyLyricsRenderer(self);
        destroyChaptersRenderer(self);
      } else {
        if (!self.lyricsRenderer) {
          self.lyricsRenderer = new _lyrics.default({
            parent: view.querySelector('.lyricsSection'),
            onBackPress: onLyricsBackPress
          });
        }
        if (!self.chaptersRenderer && !_layoutmanager.default.tv && (item == null ? void 0 : item.MediaType) === 'Audio') {
          self.chaptersRenderer = new _chapters.default({
            parent: view.querySelector('.videoOsdBottom')
          });
        }
        if (!self.playQueue) {
          var osdContentSectionType = item != null && item.SupportsResume ? 'audiobooks' : 'music';
          var osdContentSection = _usersettings.default.osdContentSection(osdContentSectionType) || getDefaultOsdContentSection();
          if (_layoutmanager.default.tv) {
            self.playQueue = new _tvplayqueue.default({
              parent: view.querySelector('.videoOsdBottom')
            });
            osdContentSection = 'playqueue';
          } else {
            self.playQueue = new _playqueue.default({
              parent: view.querySelector('.videoOsdBottom')
            });
          }

          //if (osdContentSection === 'lyrics') {
          //    osdContentSection = getDefaultOsdContentSection();
          //}

          setContentSection(osdContentSection, false);
        }
      }
      var btnPause = self.btnPause;
      if (isLocalVideo && !_layoutmanager.default.tv) {
        mainTransportButtons.classList.add('videoOsd-centerButtons-autolayout');
        btnPause.classList.add('videoOsd-btnPause-autolayout');
      } else {
        mainTransportButtons.classList.remove('videoOsd-centerButtons-autolayout');
        btnPause.classList.remove('videoOsd-btnPause-autolayout');
      }
    }
    self.updateTransparency = updateTransparency;
    function getDetailImageItemsSync() {
      var item = self.osdController.currentDisplayItem;
      var items = [];
      if (item) {
        if (item.SeriesPrimaryImageTag) {
          item = {
            Id: item.SeriesId,
            Name: item.SeriesName,
            ServerId: item.ServerId,
            ImageTags: {
              Primary: item.SeriesPrimaryImageTag
            },
            IsFolder: true,
            PrimaryImageAspectRatio: 2 / 3
          };
        }
        items.push(item);
      }
      return {
        Items: items,
        TotalRecordCount: items.length
      };
    }
    function getDetailImageItems() {
      return Promise.resolve(getDetailImageItemsSync());
    }
    function getDetailImageListOptions(items) {
      var cardClass = 'osdRemoteControlImageCard';
      if (!_layoutmanager.default.tv && !isDisplayingLocalVideo(self.currentPlayer)) {
        cardClass += ' osdRemoteControlImageCard-automargin';
      }
      return {
        renderer: _cardbuilder.default,
        options: {
          overlayText: true,
          fields: [],
          action: 'none',
          //imageClass: "osdInfoImageCard",
          //imageWidthTestClass: imageContainerClassName,
          multiSelect: false,
          contextMenu: _layoutmanager.default.tv ? false : true,
          ratingButton: _layoutmanager.default.tv ? false : true,
          playedButton: false,
          cardClass: cardClass,
          cardBoxClass: 'osdRemoteControlImageCardBox',
          cardContentClass: 'osdRemoteControlImageCardContent legacyLazyLoadImmediate',
          defaultIcon: true,
          typeIndicator: false,
          playedIndicator: false,
          syncIndicator: false,
          timerIndicator: false,
          randomDefaultBackground: false,
          staticElement: true,
          progress: false,
          hoverPlayButton: false,
          downloadButton: false,
          // prevents touchzoom
          moreButton: false,
          enableUserData: _layoutmanager.default.tv ? false : true,
          shape: 'auto',
          playQueueIndicator: false
        },
        virtualScrollLayout: 'vertical-grid'
      };
    }
    function initPosterContainer(view) {
      var itemsContainer = osdPosterContainer;
      itemsContainer.fetchData = getDetailImageItems;
      itemsContainer.getListOptions = getDetailImageListOptions;
    }
    initPosterContainer(view);
    _dom.default.addEventListener(btnFullscreen, 'click', function () {
      _playbackmanager.default.toggleFullscreen(self.currentPlayer);
    }, {
      passive: true
    });
    self.btnVideoOsdSettingsRight.addEventListener('click', onSettingsButtonClick.bind(self));
    btnVideoOsdSettingsTransportButton.addEventListener('click', onSettingsButtonClick.bind(self));
    function onStateChanged(event, state) {
      //console.log('nowplaying event: ' + event.type + ', item: ' + state.NowPlayingItem?.Id);
      var player = this;
      if (!state.NowPlayingItem) {
        return;
      }
      isEnabled = true;
      updatePlayerStateInternal(event, player, state);
    }
    function onPlayPauseStateChanged(e) {
      if (!isEnabled) {
        return;
      }
      var player = this;
      updatePlayPauseState(player.paused());
    }
    function onVolumeChanged(e) {
      if (!isEnabled) {
        return;
      }
      var player = this;
      updatePlayerVolumeState(player, player.isMuted(), player.getVolume(), self.currentPlayerSupportedCommands);
    }
    function onBrightnessChanged(e) {
      if (!isEnabled) {
        return;
      }
      var player = this;
      updatePlayerBrightnessState(player);
    }
    function onPlaybackStart(e, state) {
      var _state$NowPlayingItem;
      console.log('nowplaying event: ' + e.type);
      var player = this;
      self.osdController.onPlaybackStart(e, player, state);
      onStateChanged.call(player, e, state);
      resetUpNextDialog();
      resetRatingText();
      showHideSkipIntro(false);
      if (((_state$NowPlayingItem = state.NowPlayingItem) == null ? void 0 : _state$NowPlayingItem.MediaType) !== 'Video') {
        setBottomTabIndex(self, -1);
      }
    }
    function onShuffleChange(e) {
      var player = this;
      updateShuffleDisplay(_playbackmanager.default.getShuffle(player));
    }
    function onRepeatModeChange(e) {
      var player = this;
      updateRepeatModeDisplay(_playbackmanager.default.getRepeatMode(player));
    }
    function onSubtitleTrackChange() {
      destroySubtitleOffsetDialog(self);
      destroySubtitleAppearanceDialog(self);
    }
    function onPlaylistItemAdd(e) {
      var player = this;
      var playlistIndex = _playbackmanager.default.getCurrentPlaylistIndex(player);
      var playlistLength = _playbackmanager.default.getCurrentPlaylistLength(player);
      updatePlaylistButtons(playlistIndex, playlistLength, document.activeElement, isDisplayingLocalVideo(player));
      var playQueue = self.playQueue;
      if (playQueue) {
        var playlistItemId = _playbackmanager.default.getCurrentPlaylistItemId(player);
        playQueue.updatePlaylist(player, playlistItemId, playlistIndex, playlistLength);
      }
    }
    function onPlaylistItemMove(e, info) {
      var player = this;
      var playlistIndex = _playbackmanager.default.getCurrentPlaylistIndex(player);
      var playlistLength = _playbackmanager.default.getCurrentPlaylistLength(player);
      updatePlaylistButtons(playlistIndex, playlistLength, document.activeElement, isDisplayingLocalVideo(player));
      var playQueue = self.playQueue;
      if (playQueue) {
        playQueue.onPlaylistItemMoved(player, e, info);
      }
    }
    function onPlaylistItemRemove(e, info) {
      var player = this;
      var playlistIndex = _playbackmanager.default.getCurrentPlaylistIndex(player);
      var playlistLength = _playbackmanager.default.getCurrentPlaylistLength(player);
      updatePlaylistButtons(playlistIndex, playlistLength, document.activeElement, isDisplayingLocalVideo(player));
      var playQueue = self.playQueue;
      if (playQueue) {
        playQueue.onPlaylistItemRemoved(player, e, info);
      }
    }
    function resetUpNextDialog() {
      comingUpNextDisplayed = false;
      showHideUpNext(false);
      btnHideUpNext.classList.remove('hide');
    }
    function onPlaybackStopped(e, state) {
      hideWaiting();
      self.osdController.onPlaybackStopped(e, state);
      currentRuntimeTicks = null;
      resetRatingText();
      var player = this;
      // this check is just being defensive and is probably not needed
      var currentItem = self.osdController.currentItem;
      if (currentItem) {
        showComingUpNextIfNeeded(player, currentItem, 1, 1, true, currentCreditsInfo);
      }
      var hideUpNextHasFocus = btnHideUpNext === document.activeElement;
      btnHideUpNext.classList.add('hide');
      if (hideUpNextHasFocus) {
        _focusmanager.default.autoFocus(self.upNextContainer);
      }
      showHideSkipIntro(false);
      console.log('nowplaying event: ' + e.type);
      if (!state.NextMediaType) {
        var playQueue = self.playQueue;
        if (playQueue) {
          playQueue.onPlaybackStopped();
        }
        var lyricsRenderer = self.lyricsRenderer;
        if (lyricsRenderer) {
          lyricsRenderer.onPlaybackStopped();
        }
        var chaptersRenderer = self.chaptersRenderer;
        if (chaptersRenderer) {
          chaptersRenderer.onPlaybackStopped();
        }
        self.enableStopOnBack = false;
        if (self.enableBackOnStop) {
          self.enableBackOnStop = false;
          self.exit();
        }
      }
    }
    function onMediaStreamsChanged(e) {
      var player = this;
      var state = _playbackmanager.default.getPlayerState(player);
      onStateChanged.call(player, e, state);
    }
    function bindToPlayer(player, forceStateChange) {
      if (player === self.currentPlayer) {
        if (forceStateChange && player) {
          onStateChanged.call(player, {
            type: 'viewresume'
          }, _playbackmanager.default.getPlayerState(player));
        }
        return;
      }
      releaseCurrentPlayer();
      self.currentPlayer = player;
      self.osdController.bindToPlayer(player);
      if (!player) {
        return;
      }
      onStateChanged.call(player, {
        type: 'init'
      }, _playbackmanager.default.getPlayerState(player));
      _events.default.on(player, 'playbackrequest', onPlaybackStart);
      _events.default.on(player, 'playbackstart', onPlaybackStart);
      _events.default.on(player, 'playbackstop', onPlaybackStopped);
      _events.default.on(player, 'volumechange', onVolumeChanged);
      _events.default.on(player, 'brightnesschange', onBrightnessChanged);
      _events.default.on(player, 'pause', onPlayPauseStateChanged);
      _events.default.on(player, 'unpause', onPlayPauseStateChanged);
      _events.default.on(player, 'timeupdate', onTimeUpdate);
      _events.default.on(player, 'waiting', onWaiting);
      _events.default.on(player, 'playing', onPlaying);
      _events.default.on(player, 'fullscreenchange', updateFullscreenIcon);
      _events.default.on(player, 'mediastreamschange', onMediaStreamsChanged);
      _events.default.on(player, 'statechange', onStateChanged);
      _events.default.on(player, 'repeatmodechange', onRepeatModeChange);
      _events.default.on(player, 'shufflechange', onShuffleChange);
      _events.default.on(player, 'subtitletrackchange', onSubtitleTrackChange);
      _events.default.on(player, 'playlistitemadd', onPlaylistItemAdd);
      _events.default.on(player, 'playlistitemmove', onPlaylistItemMove);
      _events.default.on(player, 'playlistitemremove', onPlaylistItemRemove);
      resetUpNextDialog();
      resetRatingText();
      showHideSkipIntro(false);
    }
    self.bindToPlayer = bindToPlayer;
    function releaseCurrentPlayer() {
      var _self$osdController;
      (_self$osdController = self.osdController) == null || _self$osdController.releaseCurrentPlayer();
      destroyStats(self);
      destroySubtitleOffsetDialog(self);
      destroySubtitleAppearanceDialog(self);
      closeOsdDialogs(self);
      resetUpNextDialog();
      resetRatingText();
      showHideSkipIntro(false);
      var player = self.currentPlayer;
      if (player) {
        // only do this if we're actually releasing a player, since this method gets called when the screen first loads
        hideWaiting();
        _events.default.off(player, 'playbackrequest', onPlaybackStart);
        _events.default.off(player, 'playbackstart', onPlaybackStart);
        _events.default.off(player, 'playbackstop', onPlaybackStopped);
        _events.default.off(player, 'volumechange', onVolumeChanged);
        _events.default.off(player, 'brightnesschange', onBrightnessChanged);
        _events.default.off(player, 'pause', onPlayPauseStateChanged);
        _events.default.off(player, 'unpause', onPlayPauseStateChanged);
        _events.default.off(player, 'timeupdate', onTimeUpdate);
        _events.default.off(player, 'waiting', onWaiting);
        _events.default.off(player, 'playing', onPlaying);
        _events.default.off(player, 'fullscreenchange', updateFullscreenIcon);
        _events.default.off(player, 'mediastreamschange', onMediaStreamsChanged);
        _events.default.off(player, 'statechange', onStateChanged);
        _events.default.off(player, 'repeatmodechange', onRepeatModeChange);
        _events.default.off(player, 'shufflechange', onShuffleChange);
        _events.default.off(player, 'subtitletrackchange', onSubtitleTrackChange);
        _events.default.off(player, 'playlistitemadd', onPlaylistItemAdd);
        _events.default.off(player, 'playlistitemmove', onPlaylistItemMove);
        _events.default.off(player, 'playlistitemremove', onPlaylistItemRemove);
        self.currentPlayer = null;
      }
    }
    self.releaseCurrentPlayer = releaseCurrentPlayer;
    function resetRatingText() {
      ratingInfoContainer.classList.add('hide');
      ratingTextNeedsUpdate = true;
    }
    function showRatingText(player) {
      if (!ratingTextNeedsUpdate) {
        return;
      }
      var item = self.osdController.currentDisplayItem;
      if (!item) {
        return;
      }
      ratingTextNeedsUpdate = false;
      if (item.OfficialRating && item.Type !== 'Trailer' && item.MediaType === 'Video' && _usersettings.default.enableRatingInfoOnPlaybackStart()) {
        ratingTextElement.innerHTML = _globalize.default.translate('RatedValue', item.OfficialRating);

        // trigger a reflow to get the animation to play again
        ratingInfoContainer.classList.add('hide');
        void ratingInfoContainer.offsetWidth;
        ratingInfoContainer.classList.remove('hide');
      } else {
        ratingInfoContainer.classList.add('hide');
      }
    }

    // need some tolerance here because some players (lg), when you seek programatically it will not always seek to the exact spot specified.
    // this is even when direct playing. 
    // but the tolerance can't be so much that it causes the button to never show, so hence the approach of letting it vary based on conditions.
    var IntroEndToleranceTicksDefault = 2 * 1000 * 10000;
    var IntroEndToleranceTicksSafe = 5 * 1000 * 10000;
    var IntroEndToleranceTicks = IntroEndToleranceTicksDefault;
    function showHideSkipIntro(show, resetIntroEndTolerance) {
      if (show) {
        if (!skipIntroContainer._visible) {
          skipIntroContainer._visible = true;
          skipIntroContainer.classList.remove('hide');
          if (!self.currentVisibleMenu) {
            _focusmanager.default.focus(btnSkipIntro);
            if (enableAutoSkipIntro) {
              btnSkipIntro.click();
            }
          }
        }
      } else {
        if (skipIntroContainer._visible) {
          skipIntroContainer._visible = false;
          var isFocused = btnSkipIntro === document.activeElement;
          var needToRefocus = self.currentVisibleMenu ? isFocused : false;
          skipIntroContainer.classList.add('hide');
          if (needToRefocus) {
            focusMainOsdControls(self);
          } else if (isFocused) {
            // for some reason edge uwp is still allowing this to be clickable, even with the parent container hidden
            btnSkipIntro.blur();
          }
        }
        if (resetIntroEndTolerance !== false) {
          IntroEndToleranceTicks = IntroEndToleranceTicksDefault;
        }
      }
    }
    function showHideUpNext(show, timeRemainingTicks) {
      var upNextContainer = self.upNextContainer;
      if (show) {
        if (!upNextContainer._visible) {
          // remove any previous state
          btnPlayNextFromUpNextProgress.style.transform = 'scaleX(0)';
          upNextContainer._visible = true;
          upNextContainer._timeRemainingTicks = timeRemainingTicks;
          upNextContainer.classList.remove('hide');
          self.osdBottomElement.classList.add('videoosd-withupnext');
          _focusmanager.default.focus(upNextContainer.querySelector('.btnPlayNextFromUpNext'));
        }
      } else {
        if (upNextContainer._visible) {
          upNextContainer._visible = false;
          upNextContainer._timeRemainingTicks = null;
          var needToRefocus = self.currentVisibleMenu ? upNextContainer.contains(document.activeElement) : false;
          upNextContainer.classList.add('hide');
          self.osdBottomElement.classList.remove('videoosd-withupnext');
          if (needToRefocus) {
            focusMainOsdControls(self);
          }
        }
      }
    }
    function validateSkipIntroFeature(options, incrementAppSettings) {
      return Emby.importModule('./modules/registrationservices/registrationservices.js').then(function (registrationServices) {
        return registrationServices.validateFeature('dvr', Object.assign({
          viewOnly: true
        }, options)).then(function () {
          skipIntroValidated = true;
          _appsettings.default.introSkipDisplayCount(0);
        }, function (err) {
          skipIntroValidated = false;
          if (incrementAppSettings) {
            _appsettings.default.introSkipDisplayCount(_appsettings.default.introSkipDisplayCount() + 1);
          }
          return Promise.reject(err);
        });
      });
    }
    function showSkipIntroIfNeeded(player, currentTime) {
      var introInfo = currentIntroInfo;
      if (introInfo) {
        if (currentTime <= introInfo.start) {
          // set this back to 2 seconds
          IntroEndToleranceTicks = IntroEndToleranceTicksDefault;
        }
        if (enableSkipIntro && currentTime >= introInfo.start && currentTime < introInfo.end - IntroEndToleranceTicks) {
          if (skipIntroValidated !== false || _appsettings.default.introSkipDisplayCount() < 5) {
            if (skipIntroValidated === true) {
              _appsettings.default.introSkipDisplayCount(0);
            }
            showHideSkipIntro(true);
            return;
          }
        }
      }
      showHideSkipIntro(false, false);
    }
    function onWaiting(e) {
      var player = this;
      self.timeWhenWaiting = _playbackmanager.default.currentTime(player);
      _loading.default.show();
    }
    function hideWaiting() {
      self.timeWhenWaiting = null;
      _loading.default.hide();
    }
    function onPlaying(e) {
      hideWaiting();
    }
    function onTimeUpdate(e) {
      if (!isEnabled) {
        return;
      }

      // Try to avoid hammering the document with changes
      var now = Date.now();
      if (now - lastUpdateTime < 200) {
        return;
      }
      var player = this;
      var currentTime = _playbackmanager.default.currentTime(player);
      if (currentTime !== self.timeWhenWaiting) {
        hideWaiting();
      }
      var item = self.osdController.currentItem;
      currentRuntimeTicks = _playbackmanager.default.duration(player);
      showComingUpNextIfNeeded(player, item, currentTime, currentRuntimeTicks, false, currentCreditsInfo);
      if (now - lastUpdateTime < 400) {
        return;
      }
      lastUpdateTime = now;
      showSkipIntroIfNeeded(player, currentTime);
      showRatingText(player);
      updateTimeDisplay(currentTime, currentRuntimeTicks, _playbackmanager.default.getSeekableRanges(player));
      refreshProgramInfoIfNeeded(player, item);
    }
    var fiftyMinuteTicks = 3000 * 1000 * 10000;
    var fortyMinuteTicks = 2400 * 1000 * 10000;
    function getTicksLeftToShowComingUpNext(runtimeTicks, creditsInfo) {
      var creditsStart = (creditsInfo == null ? void 0 : creditsInfo.start) || 0;
      if (creditsStart && creditsStart < runtimeTicks) {
        return creditsStart;
      }
      var showAtSecondsLeft = runtimeTicks >= fiftyMinuteTicks ? 40 : runtimeTicks >= fortyMinuteTicks ? 35 : 30;
      var showAtTicks = runtimeTicks - showAtSecondsLeft * 1000 * 10000;
      return showAtTicks;
    }
    function showComingUpNextIfNeeded(player, currentItem, currentTimeTicks, runtimeTicks, isStopped, creditsInfo) {
      if ((runtimeTicks && currentTimeTicks || isStopped) && currentItem.Type === 'Episode' && self.hasNextTrack) {
        var timeRemainingTicks = runtimeTicks - currentTimeTicks;
        if (!comingUpNextDisplayed || isStopped) {
          var minRuntimeTicks = 300 * 1000 * 10000;
          var showAtTicks = getTicksLeftToShowComingUpNext(runtimeTicks, creditsInfo);
          var minTimeRemainingTicks = 20 * 1000 * 10000;
          if (isStopped || currentTimeTicks >= showAtTicks && runtimeTicks >= minRuntimeTicks && timeRemainingTicks >= minTimeRemainingTicks && _usersettings.default.enableNextVideoInfoOverlay()) {
            if (isStopped) {
              btnHideUpNext.classList.add('hide');
            }
            comingUpNextDisplayed = true;
            showHideUpNext(true, timeRemainingTicks);
          }
        }
        if (self.upNextContainer._visible) {
          var showAtTicksLeft = self.upNextContainer._timeRemainingTicks;
          if (showAtTicksLeft) {
            var pct = isStopped ? 1 : (showAtTicksLeft - timeRemainingTicks + 1.5 * 1000 * 10000) / showAtTicksLeft;
            pct *= 100;
            pct = Math.min(pct, 100);
            pct = pct.toFixed(2);
            btnPlayNextFromUpNextProgress.style.transform = 'scaleX(' + pct + '%)';
          }
        }
      }
    }
    function refreshProgramInfoIfNeeded(player, item) {
      if (item.Type !== 'TvChannel') {
        return;
      }
      var program = item.CurrentProgram;
      if (!program || !program.EndDate) {
        return;
      }
      try {
        var endDate = _datetime.default.parseISO8601Date(program.EndDate);

        // program has changed and needs to be refreshed
        if (Date.now() >= endDate.getTime()) {
          console.log('program info needs to be refreshed');
          var state = _playbackmanager.default.getPlayerState(player);
          onStateChanged.call(player, {
            type: 'updatemetadata'
          }, state);
        }
      } catch (e) {
        console.error("Error parsing date: " + program.EndDate, e);
      }
    }
    function updatePlayPauseState(isPaused, isInitialRequest) {
      self.osdController.onPlayPauseStateChanged(isPaused);
      var title;
      var btnPause = self.btnPause;
      if (isPaused) {
        btnPause.querySelector('i').innerHTML = '&#xe037;';
        title = _globalize.default.translate('Play');
      } else {
        btnPause.querySelector('i').innerHTML = '&#xe034;';
        title = _globalize.default.translate('Pause');
      }
      btnPause.title = title;
      btnPause.setAttribute('aria-label', title);
      setElementDisabled(btnPause, isInitialRequest === true);
    }
    function hideButton(btn, focusedElement) {
      var isFocused = btn === focusedElement;
      btn.classList.add('hide');
      if (isFocused) {
        focusMainOsdControls(self);
      }
    }
    function setElementDisabled(btn, disabled) {
      var isFocused = btn === document.activeElement;
      btn.disabled = disabled;
      if (disabled && isFocused) {
        focusMainOsdControls(self);
      }
    }
    function updatePlayerStateInternal(event, player, state) {
      var _self$headerRightButt;
      self.lastPlayerState = state;
      var playState = state.PlayState || {};
      updatePlayPauseState(playState.IsPaused, state.IsInitialRequest);
      var supportedCommands = _playbackmanager.default.getSupportedCommands(player);
      self.currentPlayerSupportedCommands = supportedCommands;
      updatePlayerVolumeState(player, playState.IsMuted, playState.VolumeLevel, supportedCommands);
      updatePlayerBrightnessState(player);
      self.osdController.updatePlayerState(event, player, state);
      for (var _i11 = 0, _length11 = fastForwardButtons.length; _i11 < _length11; _i11++) {
        setElementDisabled(fastForwardButtons[_i11], !playState.CanSeek);
      }
      for (var _i12 = 0, _length12 = rewindButtons.length; _i12 < _length12; _i12++) {
        setElementDisabled(rewindButtons[_i12], !playState.CanSeek);
      }
      var nowPlayingItem = state.NowPlayingItem || {};
      var displayingLocalVideo = isDisplayingLocalVideo(player, nowPlayingItem.MediaType);
      updateTransparency(player, state, nowPlayingItem.MediaType, displayingLocalVideo);
      updateTimeDisplay(playState.PositionTicks, nowPlayingItem.RunTimeTicks, playState.SeekableRanges || []);
      updateNowPlayingInfo(event, player, state, displayingLocalVideo);
      var focusedElement = document.activeElement;
      if (state.MediaSource && !state.IsInitialRequest) {
        if (displayingLocalVideo || _layoutmanager.default.tv) {
          hideButton(btnVideoOsdSettingsTransportButton, focusedElement);
          self.btnVideoOsdSettingsRight.classList.remove('hide');
        } else {
          btnVideoOsdSettingsTransportButton.classList.remove('hide');
          hideButton(self.btnVideoOsdSettingsRight, focusedElement);
        }
      } else {
        hideButton(self.btnVideoOsdSettingsRight, focusedElement);
        hideButton(btnVideoOsdSettingsTransportButton, focusedElement);
      }
      if (supportedCommands.includes('ToggleFullscreen') && displayingLocalVideo && !(player.isLocalPlayer && _layoutmanager.default.tv && _playbackmanager.default.isFullscreen(player))) {
        btnFullscreen.classList.remove('hide');
      } else {
        hideButton(btnFullscreen, focusedElement);
      }
      var btnPip = (_self$headerRightButt = self.headerRightButtonContainer) == null ? void 0 : _self$headerRightButt.querySelector('.btnPip');
      if (btnPip) {
        if (state.IsInitialRequest || !supportedCommands.includes('PictureInPicture') || _layoutmanager.default.tv) {
          hideButton(btnPip, focusedElement);
        } else {
          if (supportedCommands.includes('AutoPictureInPicture')) {
            btnPip.classList.add('hidetouch');
            btnPip.classList.remove('hide');
          } else {
            btnPip.classList.remove('hide', 'hidetouch');
          }
        }
      }
      updateRepeatModeDisplay(playState.RepeatMode);
      if (!supportedCommands.includes('SetRepeatMode') || nowPlayingItem.MediaType === 'Video') {
        hideButton(btnRepeatModeBottom, focusedElement);
        hideButton(btnRepeatModeTopRight, focusedElement);
      } else {
        if (_layoutmanager.default.tv) {
          btnRepeatModeTopRight.classList.remove('hide');
          hideButton(btnRepeatModeBottom, focusedElement);
        } else {
          btnRepeatModeBottom.classList.remove('hide');
          hideButton(btnRepeatModeTopRight, focusedElement);
        }
      }
      updateShuffleDisplay(playState.Shuffle);
      if (!supportedCommands.includes('SetShuffle') || nowPlayingItem.MediaType === 'Video') {
        hideButton(btnShuffleBottom, focusedElement);
        hideButton(btnShuffleTopRight, focusedElement);
      } else {
        if (_layoutmanager.default.tv) {
          btnShuffleTopRight.classList.remove('hide');
          hideButton(btnShuffleBottom, focusedElement);
        } else {
          btnShuffleBottom.classList.remove('hide');
          hideButton(btnShuffleTopRight, focusedElement);
        }
      }
      if (!supportedCommands.includes('SetPlaybackRate') || nowPlayingItem.MediaType !== 'Video' || _layoutmanager.default.tv || !nowPlayingItem.RunTimeTicks) {
        hideButton(self.btnPlaybackSpeed, focusedElement);
      } else {
        self.btnPlaybackSpeed.classList.remove('hide');
      }
      updateFullscreenIcon();
      var playlistIndex = state.PlaylistIndex;
      var playlistLength = state.PlaylistLength;
      updatePlaylistButtons(playlistIndex, playlistLength, focusedElement, displayingLocalVideo);
      if (!state.IsInitialRequest) {
        var playQueue = self.playQueue;
        if (playQueue) {
          var playlistItemId = state.PlaylistItemId;
          playQueue.updatePlaylist(player, playlistItemId, playlistIndex, playlistLength);
        }
      }
    }
    function updatePlaylistButtons(playlistIndex, playlistLength, focusedElement, isLocalVideo) {
      var showButtons = !isLocalVideo || !_layoutmanager.default.tv || _layoutmanager.default.tv && hideMediaTransportButtons() === false;
      var autoHideButtons = !_layoutmanager.default.tv && isLocalVideo;
      if (autoHideButtons) {
        btnPreviousTrack.classList.add('hidetouch');
        btnNextTrack.classList.add('hidetouch');
      } else {
        btnPreviousTrack.classList.remove('hidetouch');
        btnNextTrack.classList.remove('hidetouch');
      }
      if (playlistIndex && showButtons) {
        btnPreviousTrack.classList.remove('hide');
      } else {
        hideButton(btnPreviousTrack, focusedElement);
      }
      //console.log('updatePlaylistButtons: playlistIndex: ' + playlistIndex + ', playlistLength: ' + playlistLength);

      if (playlistIndex != null && playlistLength && playlistIndex < playlistLength - 1) {
        self.hasNextTrack = true;
        if (showButtons) {
          btnNextTrack.classList.remove('hide');
          if (_layoutmanager.default.tv) {
            hideButton(btnNextTrackTopRight, focusedElement);
          } else {
            if (isLocalVideo) {
              btnNextTrackTopRight.classList.remove('hide');
            } else {
              hideButton(btnNextTrackTopRight, focusedElement);
            }
          }
        } else {
          hideButton(btnNextTrack, focusedElement);
          hideButton(btnNextTrackTopRight, focusedElement);
        }
      } else {
        self.hasNextTrack = false;
        hideButton(btnNextTrack, focusedElement);
        hideButton(btnNextTrackTopRight, focusedElement);
      }
    }
    function updateRepeatModeDisplayForButton(button, repeatMode) {
      var icon = button.querySelector('i');
      if (repeatMode === 'RepeatAll') {
        icon.innerHTML = '&#xe040;';
        icon.classList.add('toggleButtonIcon-active');
        button.classList.add('toggleButton-active');
      } else if (repeatMode === 'RepeatOne') {
        icon.innerHTML = '&#xe041;';
        icon.classList.add('toggleButtonIcon-active');
        button.classList.add('toggleButton-active');
      } else {
        icon.innerHTML = '&#xe040;';
        icon.classList.remove('toggleButtonIcon-active');
        button.classList.remove('toggleButton-active');
      }
    }
    function updateRepeatModeDisplay(repeatMode) {
      updateRepeatModeDisplayForButton(btnRepeatModeTopRight, repeatMode);
      updateRepeatModeDisplayForButton(btnRepeatModeBottom, repeatMode);
    }
    function updateShuffleDisplayForButton(button, shuffle) {
      var icon = button.querySelector('i');
      if (shuffle) {
        icon.classList.add('toggleButtonIcon-active');
        button.classList.add('toggleButton-active');
      } else {
        icon.classList.remove('toggleButtonIcon-active');
        button.classList.remove('toggleButton-active');
      }
    }
    function updateShuffleDisplay(shuffle) {
      updateShuffleDisplayForButton(btnShuffleTopRight, shuffle);
      updateShuffleDisplayForButton(btnShuffleBottom, shuffle);
    }
    function updateTimeDisplay(positionTicks, runtimeTicks, seekableRanges) {
      self.osdController.onPlayerTimeUpdate(positionTicks, runtimeTicks, seekableRanges);
      var bottomTabControllers = self.bottomTabControllers;
      for (var _i13 = 0, _length13 = bottomTabControllers.length; _i13 < _length13; _i13++) {
        if (bottomTabControllers[_i13]) {
          bottomTabControllers[_i13].onTimeUpdate(positionTicks, runtimeTicks);
        }
      }
      var lyricsRenderer = self.lyricsRenderer;
      if (lyricsRenderer) {
        lyricsRenderer.onTimeUpdate(positionTicks, currentRuntimeTicks);
      }
      var chaptersRenderer = self.chaptersRenderer;
      if (chaptersRenderer) {
        chaptersRenderer.onTimeUpdate(positionTicks, currentRuntimeTicks);
      }
    }
    function setSliderValueAfterUpgrade(slider, value) {
      slider.waitForCustomElementUpgrade().then(function () {
        slider.setValue(value);
      });
    }
    function setSliderValue(slider, value) {
      if (slider.setValue) {
        slider.setValue(value);
        return;
      }
      setSliderValueAfterUpgrade(slider, value);
    }
    function updatePlayerBrightnessState(player) {
      var showSlider = !_layoutmanager.default.tv && self.currentPlayerSupportedCommands.includes('SetBrightness');

      // See bindEvents for why this is necessary
      if (brightnessSlider) {
        if (showSlider) {
          brightnessSliderContainer.classList.remove('hide');
          if (!brightnessSlider.dragging) {
            setSliderValue(brightnessSlider, _playbackmanager.default.getBrightness(player));
          }
        } else {
          brightnessSliderContainer.classList.add('hide');
        }
      }
    }
    function setMuteButtonStatus(button, isMuted, showMuteButton) {
      if (isMuted) {
        button.setAttribute('title', _globalize.default.translate('Unmute'));
        button.querySelector('i').innerHTML = '&#xe04F;';
      } else {
        button.setAttribute('title', _globalize.default.translate('Mute'));
        button.querySelector('i').innerHTML = '&#xe050;';
      }
      if (showMuteButton) {
        button.classList.remove('hide');
      } else {
        button.classList.add('hide');
      }
    }
    function setVolumeContainerVisibility(container, slider, showVolumeSlider, volumeLevel, isMuted) {
      if (_layoutmanager.default.tv && _servicelocator.appHost.supports('physicalvolumecontrol')) {
        showVolumeSlider = false;
      }
      if (showVolumeSlider) {
        container.classList.remove('osdForceHide');
      } else {
        container.classList.add('osdForceHide');
      }
      if (!slider.dragging) {
        setSliderValue(slider, isMuted ? 0 : volumeLevel);
      }
    }
    function updatePlayerVolumeState(player, isMuted, volumeLevel, supportedCommands) {
      var showMuteButton = true;
      var showVolumeSlider = true;
      if (!supportedCommands.includes('Mute')) {
        showMuteButton = false;
      }
      if (!supportedCommands.includes('SetVolume')) {
        showVolumeSlider = false;
      }
      setMuteButtonStatus(buttonMute, isMuted, showMuteButton);
      if (self.topMuteButton) {
        setMuteButtonStatus(self.topMuteButton, isMuted, showMuteButton);
      }
      var nowPlayingVolumeSlider = self.nowPlayingVolumeSlider;

      // See bindEvents for why this is necessary
      if (nowPlayingVolumeSlider) {
        setVolumeContainerVisibility(videoOsdVolumeControlsBottom, nowPlayingVolumeSlider, showVolumeSlider, volumeLevel, isMuted);
      }
      if (self.topVolumeControls) {
        setVolumeContainerVisibility(self.topVolumeControls, self.topVolumeSlider, showVolumeSlider, volumeLevel, isMuted);
      }
    }
    var lastPointerEvent = 0;
    _dom.default.addEventListener(view, window.PointerEvent && !_dom.default.supportsPointerTypeInClickEvent() ? 'pointerup' : 'click', function (e) {
      //console.log('on osd ' + e.type);

      var pointerType = e.pointerType || DefaultPointerType;
      lastPointerUpType = pointerType;
      switch (pointerType) {
        case 'touch':
          if (e.target.closest('BUTTON,INPUT,.videoosd-tabcontainers,.videoosd-tabsslider')) {
            // do this on a timeout. otherwise if skip intro was tapped, something else might end up receiving the click event when the osd shows
            startTimeoutShowOsdDefaultParams();
            return;
          }
          var now = Date.now();
          var isEnoughTimeSinceLastTap = now - lastPointerEvent > 300;
          if (isEnoughTimeSinceLastTap || e.type === 'click') {
            lastPointerEvent = now;
            // toggle osd
            if (self.currentVisibleMenu) {
              setTimeout(self.boundHideOsd, 10);
            } else if (!self.currentVisibleMenu) {
              if (isEnoughTimeSinceLastTap) {
                startTimeoutShowOsdDefaultParams();
              }
            }
          }
          break;
        default:
          onOsdClick(e, self, null, true);
          break;
      }
    }, {
      passive: true
    });
    _dom.default.addEventListener(view, 'dblclick', onDoubleClick, {
      passive: true
    });
    _dom.default.addEventListener(buttonMute, 'click', onMuteButtonClick.bind(self), {
      passive: true
    });
    _dom.default.addEventListener(self.osdBottomElement, 'scroll', onOsdBottomScroll.bind(self), {
      passive: true,
      capture: true
    });
    _dom.default.addEventListener(self.osdBottomElement, 'scrollanimate', onOsdBottomScroll.bind(self), {
      passive: true,
      capture: true
    });
    _dom.default.addEventListener(brightnessSlider, 'change', function () {
      _playbackmanager.default.setBrightness(parseFloat(this.value), self.currentPlayer);
      self.showOsd();
    }, {
      passive: true
    });
    _dom.default.addEventListener(brightnessSlider, 'input', function () {
      _playbackmanager.default.setBrightness(parseFloat(this.value), self.currentPlayer);
      self.showOsd();
    }, {
      passive: true
    });
    _dom.default.addEventListener(self.nowPlayingVolumeSlider, 'change', onVolumeSliderInputOrChange.bind(self), {
      passive: true
    });
    _dom.default.addEventListener(self.nowPlayingVolumeSlider, 'input', onVolumeSliderInputOrChange.bind(self), {
      passive: true
    });
    self.nowPlayingPositionSlider.getBubbleHtml = function (value) {
      self.showOsd();
      return self.osdController.getPositionBubbleHtml(value, currentRuntimeTicks);
    };
    _dom.default.addEventListener(self.osdBottomElement, transitionEndEventName, onBottomTransitionEnd, {
      passive: true
    });
    _dom.default.addEventListener(btnPreviousTrack, 'click', function () {
      _playbackmanager.default.previousTrack(self.currentPlayer);
    }, {
      passive: true
    });
    function onStop() {
      _playbackmanager.default.stop(self.currentPlayer);
    }
    for (var _i14 = 0, _length14 = stopButtons.length; _i14 < _length14; _i14++) {
      stopButtons[_i14].addEventListener('click', onStop);
    }
    _dom.default.addEventListener(self.btnPause, 'click', function () {
      console.log('videoosd - playPause from click event');
      _playbackmanager.default.playPause(self.currentPlayer);
    }, {
      passive: true
    });
    function onNextTrackClick() {
      _playbackmanager.default.nextTrack(self.currentPlayer);
    }
    _dom.default.addEventListener(btnNextTrack, 'click', onNextTrackClick, {
      passive: true
    });
    _dom.default.addEventListener(btnNextTrackTopRight, 'click', onNextTrackClick, {
      passive: true
    });
    function onRewindButtonClick() {
      rewind(self, true);
    }
    for (var _i15 = 0, _length15 = rewindButtons.length; _i15 < _length15; _i15++) {
      _dom.default.addEventListener(rewindButtons[_i15], 'click', onRewindButtonClick, {
        passive: true
      });
    }
    function onFastForwardButtonClick() {
      fastForward(self, true);
    }
    for (var _i16 = 0, _length16 = fastForwardButtons.length; _i16 < _length16; _i16++) {
      _dom.default.addEventListener(fastForwardButtons[_i16], 'click', onFastForwardButtonClick, {
        passive: true
      });
    }
    _dom.default.addEventListener(self.btnPlaybackSpeed, 'click', onSpeedClick.bind(self), {
      passive: true
    });
    function onRepeatModeClick() {
      toggleRepeat(self.currentPlayer);
    }
    _dom.default.addEventListener(btnRepeatModeTopRight, 'click', onRepeatModeClick, {
      passive: true
    });
    _dom.default.addEventListener(btnRepeatModeBottom, 'click', onRepeatModeClick, {
      passive: true
    });
    function toggleShuffle(player) {
      if (player) {
        _playbackmanager.default.toggleShuffle(player);
      }
    }
    function onShuffleClick() {
      toggleShuffle(self.currentPlayer);
    }
    _dom.default.addEventListener(btnShuffleTopRight, 'click', onShuffleClick, {
      passive: true
    });
    _dom.default.addEventListener(btnShuffleBottom, 'click', onShuffleClick, {
      passive: true
    });
    _dom.default.addEventListener(btnOsdMoreBottom, 'click', onMoreClick.bind(self), {
      passive: true
    });
    _dom.default.addEventListener(btnOsdMoreTitle, 'click', onMoreClick.bind(self), {
      passive: true
    });
    function toggleRepeat(player) {
      if (player) {
        _playbackmanager.default.toggleRepeatMode(player);
      }
    }
    _dom.default.addEventListener(self.btnAudio, 'click', showAudioTrackSelection.bind(self), {
      passive: true
    });
    _dom.default.addEventListener(self.btnSubtitles, 'click', showSubtitleTrackSelection.bind(self), {
      passive: true
    });
    self.bottomTabs.getFocusableElements = videoOsdBottomButtons.getFocusableElements = function (parent, activeElement, direction, options) {
      switch (direction) {
        case 0:
        case 1:
        case 2:
        case 3:
          return null;
        default:
          if (canSetBottomTabIndex(self, 0)) {
            var elem = self.bottomTabs.querySelector('.videoosd-tab-button-info');
            return [elem];
          }
          return null;
      }
    };
    function onCloseRequestedFromTab() {
      setBottomTabIndex(self, -1);
    }
    function loadBottomTabController(index, forceRefresh) {
      var tabResumeOptions = getTabOnItemUpdatedData(self);
      tabResumeOptions.refresh = forceRefresh;
      tabResumeOptions.autoFocus = focusOnTabChange;
      focusOnTabChange = false;
      if (index === 5) {
        document.documentElement.classList.add('osd-tab-guide');
      } else {
        document.documentElement.classList.remove('osd-tab-guide');
      }
      var bottomTabControllers = self.bottomTabControllers;
      if (bottomTabControllers[index]) {
        return bottomTabControllers[index].onResume(tabResumeOptions);
      }
      var paths = ['./videoosd/infotab.js', './videoosd/chapterstab.js', './videoosd/peopletab.js', './videoosd/playqueuetab.js', './videoosd/onnowtab.js', './videoosd/guidetab.js'];
      return Emby.importModule(paths[index]).then(function (ControllerFactory) {
        var controller = new ControllerFactory(tabContainers[index]);
        bottomTabControllers[index] = controller;
        tabResumeOptions.refresh = true;
        _events.default.on(controller, 'closerequested', onCloseRequestedFromTab);
        return controller.onResume(tabResumeOptions);
      });
    }
    self.bottomTabs.addEventListener('beforetabchange', function (e) {
      var index = e.detail.selectedTabIndex;
      var previousIndex = e.detail.previousIndex;
      var newPanel = tabContainers[index];
      if (previousIndex != null) {
        var previousPanel = tabContainers[previousIndex];
        if (previousPanel) {
          if (newPanel) {
            previousPanel.classList.remove('videoosd-activetab');
          }
        }
        var bottomTabControllers = self.bottomTabControllers;
        var previousController = bottomTabControllers[previousIndex];
        if (previousController) {
          previousController.onPause();
        }
      }
      if (newPanel) {
        loadBottomTabController(index);
        newPanel.classList.add('videoosd-activetab');
        self.tabContainersElem.classList.remove('hide');
        void self.tabContainersElem.offsetWidth;
        self.tabContainersElem.classList.remove('videoosd-tabcontainers-hidden');
        self.osdBottomElement.classList.add('videoosd-bottom-with-opentab');
        if (previousIndex != null && enableTabAnimation && newPanel.animate && index !== 5 && previousIndex !== 5) {
          if (previousIndex > index) {
            fadeInLeft(newPanel);
          } else if (previousIndex < index) {
            fadeInRight(newPanel);
          }
        }
      } else {
        self.tabContainersElem.classList.add('videoosd-tabcontainers-hidden');
      }
    });
    self.bottomTabs.addEventListener('activetabclick', function (e) {
      self.bottomTabs.selectedIndex(-1);
    });
    function onTabTransitionEnd(e) {
      var elem = e.currentTarget;
      if (elem !== e.target) {
        return;
      }
      if (elem.classList.contains('videoosd-tabcontainers-hidden')) {
        elem.classList.add('hide');
        self.osdBottomElement.classList.remove('videoosd-bottom-with-opentab');
        var activeTab = elem.querySelector('.videoosd-activetab');
        if (activeTab) {
          activeTab.classList.remove('videoosd-activetab');
        }
        focusMainOsdControls(self);
      }
    }
    _dom.default.addEventListener(self.tabContainersElem, transitionEndEventName, onTabTransitionEnd, {
      passive: true
    });
    _inputmanager.default.on(self.bottomTabs, function (e) {
      switch (e.detail.command) {
        case 'up':
          if (self.bottomTabs.selectedIndex() !== -1) {
            setBottomTabIndex(self, -1);
            e.preventDefault();
            e.stopPropagation();
            self.showOsd();
          }
          break;
        case 'down':
          if (self.bottomTabs.selectedIndex() === -1) {
            var btn = e.target.closest('.videoosd-tab-button');
            if (btn) {
              setBottomTabIndex(self, parseInt(btn.getAttribute('data-index')));
            } else {
              setBottomTabIndex(self, -1);
            }
          }
          break;
        default:
          break;
      }
    });
    function setContentSection(sectionName, saveToUserSettings) {
      currentOsdContentSectionName = sectionName;
      var sections = view.querySelectorAll('.osdContentSection');
      for (var _i17 = 0, _length17 = sections.length; _i17 < _length17; _i17++) {
        var section = sections[_i17];
        if (section.getAttribute('data-contentsection') === sectionName) {
          section.classList.remove('hide');
        } else {
          section.classList.add('hide');
        }
      }
      var buttons = view.querySelectorAll('.osdContentSectionToggleButton');
      for (var _i18 = 0, _length18 = buttons.length; _i18 < _length18; _i18++) {
        var button = buttons[_i18];
        var icon = button.querySelector('i');
        if (button.getAttribute('data-contentsection') === sectionName) {
          button.classList.add('toggleButton-active');
          icon.classList.add('toggleButtonIcon-active');
        } else {
          button.classList.remove('toggleButton-active');
          icon.classList.remove('toggleButtonIcon-active');
        }
      }
      var playQueue = self.playQueue;
      if (sectionName === 'playqueue') {
        if (playQueue) {
          playQueue.resume({});
        }
      } else {
        if (playQueue) {
          playQueue.pause();
        }
      }
      var lyricsRenderer = self.lyricsRenderer;
      if (sectionName === 'lyrics') {
        if (lyricsRenderer) {
          lyricsRenderer.resume({});
        }
      } else {
        if (lyricsRenderer) {
          lyricsRenderer.pause();
        }
      }
      var chaptersRenderer = self.chaptersRenderer;
      if (sectionName === 'chapters') {
        if (chaptersRenderer) {
          chaptersRenderer.resume({});
        }
      } else {
        if (chaptersRenderer) {
          chaptersRenderer.pause();
        }
      }
      var osdBottomElement = self.osdBottomElement;
      if (_layoutmanager.default.tv) {
        if (sectionName && sectionName !== 'playqueue' && sectionName !== 'art') {
          osdBottomElement.classList.add('videoOsdBottom-split');
        } else {
          osdBottomElement.classList.remove('videoOsdBottom-split');
        }
        if (sectionName && sectionName !== 'lyrics' && sectionName !== 'art') {
          osdBottomElement.classList.remove('videoOsdBottom-art');
        } else {
          osdBottomElement.classList.add('videoOsdBottom-art');
        }
      } else {
        if (sectionName && sectionName !== 'art') {
          osdBottomElement.classList.add('videoOsdBottom-split');
          osdBottomElement.classList.remove('videoOsdBottom-art');
        } else {
          osdBottomElement.classList.remove('videoOsdBottom-split');
          osdBottomElement.classList.add('videoOsdBottom-art');
        }
      }
      if (saveToUserSettings !== false) {
        var item = self.osdController.currentItem;
        var osdContentSectionType = item != null && item.SupportsResume ? 'audiobooks' : 'music';
        _usersettings.default.osdContentSection(osdContentSectionType, sectionName);
      }
    }
    function initContentSections() {
      var sections = view.querySelectorAll('.osdContentSection');
      for (var _i19 = 0, _length19 = sections.length; _i19 < _length19; _i19++) {
        var section = sections[_i19];
        if (!_layoutmanager.default.tv || section.getAttribute('data-contentsection') === 'lyrics') {
          section.classList.add('osdContentSection-split');
        }
        if (_layoutmanager.default.tv && section.getAttribute('data-contentsection') === 'lyrics') {
          section.classList.add('osdContentSection-tv-split');
        }
      }
    }
    function onContentSectionToggleButtonClick(e) {
      if (this.classList.contains('toggleButton-active')) {
        setContentSection('art');
      } else {
        setContentSection(this.getAttribute('data-contentsection'));
      }
    }
    function onSkipIntroClickInternal() {
      var info = currentIntroInfo;
      var player = self.currentPlayer;
      if (info && player) {
        IntroEndToleranceTicks = IntroEndToleranceTicksSafe;
        _playbackmanager.default.seek(info.end, player);
        showHideSkipIntro(false, false);
        self.hideOsd();
      }
    }
    function onSkipIntroClick() {
      if (skipIntroValidated) {
        onSkipIntroClickInternal();
      } else {
        return validateSkipIntroFeature().then(onSkipIntroClickInternal);
      }
    }
    function onLockClick() {
      var instance = self;
      var lockState = instance.currentLockState;
      switch (lockState) {
        case 0:
        case 1:
          lockState++;
          break;
        default:
          lockState = 0;
          break;
      }
      self.setLockState(lockState);
    }
    var lockButtons = view.querySelectorAll('.videoOsd-btnToggleLock');
    for (var _i20 = 0, _length20 = lockButtons.length; _i20 < _length20; _i20++) {
      _dom.default.addEventListener(lockButtons[_i20], 'click', onLockClick, {
        passive: true
      });
    }
    function onHideUpNextClick() {
      showHideUpNext(false);
    }
    _dom.default.addEventListener(btnHideUpNext, 'click', onHideUpNextClick, {
      passive: true
    });
    _dom.default.addEventListener(view.querySelector('.btnPlayNextFromUpNext'), 'click', onNextTrackClick, {
      passive: true
    });
    if (_layoutmanager.default.tv) {
      view.querySelector('.btnPlayNextFromUpNext').classList.add('btnPlayNextFromUpNext-tv');
    }
    _dom.default.addEventListener(btnSkipIntro, 'click', onSkipIntroClick, {
      passive: true
    });
    _dom.default.addEventListener(view.querySelector('.btnPlayQueue'), 'click', onContentSectionToggleButtonClick, {
      passive: true
    });
    _dom.default.addEventListener(btnLyrics, 'click', onContentSectionToggleButtonClick, {
      passive: true
    });
    _dom.default.addEventListener(btnChapters, 'click', onContentSectionToggleButtonClick, {
      passive: true
    });
    if (_dom.default.allowBackdropFilter()) {
      var toggleButtonIcons = view.querySelectorAll('.toggleButtonIcon');
      for (var _i21 = 0, _length21 = toggleButtonIcons.length; _i21 < _length21; _i21++) {
        toggleButtonIcons[_i21].classList.add('toggleButtonIcon-backdropfilter');
      }
    }
    initContentSections();
    _shortcuts.default.on(this.videoOsdText);
    this.boundHideOsd = this.hideOsd.bind(this);
    this.boundShowOsdDefaultParams = showOsdDefaultParams.bind(this);
    this.boundOnOsdHideTimeout = onOsdHideTimeout.bind(this);
  }
  Object.assign(VideoOsd.prototype, _baseview.default.prototype);
  function showMainOsdControls(instance, elementToFocus) {
    if (instance.currentVisibleMenu) {
      return;
    }
    var elem = instance.osdBottomElement;
    instance.currentVisibleMenu = 'osd';
    elem.classList.remove('hide');

    // trigger a reflow to force it to animate again
    void elem.offsetWidth;
    elem.classList.remove('videoOsdBottom-hidden');
    if (!_focusmanager.default.hasExclusiveFocusScope()) {
      if (elementToFocus) {
        console.log('showMainOsdControls - focus elementToFocus');
        _focusmanager.default.focus(elementToFocus);
      } else {
        focusMainOsdControls(instance);
      }
    }
    //console.log('showMainOsdControls activeElement: ' + document.activeElement.className);
    var view = instance.view;
    view.dispatchEvent(new CustomEvent("video-osd-show", {
      bubbles: true
    }));
  }
  VideoOsd.prototype.enableWindowInputCommands = function () {
    return true;
  };
  function onUpCommand(instance, e) {
    if (!instance.currentVisibleMenu && !instance.upNextContainer._visible) {
      var videoScreenUpAction = _usersettings.default.videoScreenUpAction();
      if (videoScreenUpAction === 'chapters' && !e.target.closest('.view')) {
        if (canSetBottomTabIndex(instance, 1)) {
          focusOnTabChange = true;
          setBottomTabIndex(instance, 1);
          e.preventDefault();
          return;
        } else if (canSetBottomTabIndex(instance, 5)) {
          focusOnTabChange = true;
          setBottomTabIndex(instance, 5);
          e.preventDefault();
          return;
        }
      }
    }
    if (shouldOsdBeShown(instance)) {
      instance.showOsd();
    }
  }
  VideoOsd.prototype.onWindowInputCommand = function (e) {
    var instance = this;
    switch (e.detail.command) {
      case 'back':
        var upNextContainer = e.target.closest('.upNextContainer');
        if (upNextContainer) {
          e.preventDefault();
          upNextContainer.querySelector('.btnHideUpNext').click();
          return;
        }
        if (_layoutmanager.default.tv && !_focusmanager.default.hasExclusiveFocusScope()) {
          var _e$detail$originalEve;
          var originalTarget = (_e$detail$originalEve = e.detail.originalEvent) == null ? void 0 : _e$detail$originalEve.target;
          // don't do anything special with the header back button
          if (!originalTarget || !headerElement.contains(originalTarget)) {
            if (isDisplayingLocalVideo(instance.currentPlayer)) {
              if (instance.currentVisibleMenu && !instance.upNextContainer._visible) {
                if (!instance.currentPlayer.isLocalPlayer) {
                  if (instance.bottomTabs.selectedIndex() !== -1) {
                    setBottomTabIndex(instance, -1);
                    e.preventDefault();
                  }
                  return;
                }
                e.preventDefault();
                instance.hideOsd();
              }
            } else {
              if (!instance.currentVisibleMenu && isPlaying(instance.currentPlayer)) {
                e.preventDefault();
                instance.showOsd();
              }
            }
          }
        }
        return;
      case 'left':
        if (e.target.closest('.skipIntroContainer,.upNextContainer')) {
          return;
        }
        if (document.dir === 'rtl') {
          onFastForwardInputCommand(e, instance);
        } else {
          onRewindInputCommand(e, instance);
        }
        return;
      case 'rewind':
        e.preventDefault();
        onRewindInputCommand(e, instance);
        return;
      case 'right':
        if (e.target.closest('.skipIntroContainer,.upNextContainer')) {
          return;
        }
        if (document.dir === 'rtl') {
          onRewindInputCommand(e, instance);
        } else {
          onFastForwardInputCommand(e, instance);
        }
        return;
      case 'fastforward':
        e.preventDefault();
        onFastForwardInputCommand(e, instance);
        return;
      case 'pageup':
        if (!e.target.closest('.card')) {
          instance.osdController.onPageUp(e);
        }
        return;
      case 'pagedown':
        if (!e.target.closest('.card')) {
          instance.osdController.onPageDown(e);
        }
        return;
      case 'channelup':
        instance.osdController.onChannelUp(e);
        return;
      case 'channeldown':
        instance.osdController.onChannelDown(e);
        return;
      case 'playpause':
        {
          var _instance$currentPlay;
          // prevent commandProcessor from overriding this and playing the focused item
          e.preventDefault();
          e.stopPropagation();
          var isPaused = (_instance$currentPlay = instance.currentPlayer) == null ? void 0 : _instance$currentPlay.paused();
          console.log('videoosd - playPause from playpause command');
          _playbackmanager.default.playPause(instance.currentPlayer);
          if (instance.currentVisibleMenu || shouldOsdBeShown(instance) && !isPaused) {
            instance.showOsd();
          }
          return;
        }
      case 'play':
        {
          var _instance$currentPlay2;
          // prevent commandProcessor from overriding this and playing the focused item
          e.preventDefault();
          e.stopPropagation();
          var _isPaused = (_instance$currentPlay2 = instance.currentPlayer) == null ? void 0 : _instance$currentPlay2.paused();
          _playbackmanager.default.unpause(instance.currentPlayer);
          if (instance.currentVisibleMenu || shouldOsdBeShown(instance) && !_isPaused) {
            instance.showOsd();
          }
          return;
        }
      case 'select':
        if (onOsdClick(e, instance, null, shouldOsdBeShown(instance))) {
          e.preventDefault();
        }
        return;
      case 'up':
        onUpCommand(instance, e);
        return;
      case 'down':
        if (!instance.currentVisibleMenu && _usersettings.default.videoScreenUpAction()) {
          e.preventDefault();
        }
        if (shouldOsdBeShown(instance)) {
          instance.showOsd();
        }
        return;
      case 'menu':
        if (e.detail.repeat && !instance.nowPlayingPositionSlider.dragging && _layoutmanager.default.tv) {
          switch (_appsettings.default.videoPlayerLongPressAction()) {
            case 'togglestats':
              toggleStats(instance);
              return;
            case 'settings':
              if (shouldOsdBeShown(instance)) {
                instance.showOsd();
              }
              onSettingsButtonClick.call(instance, {
                target: instance.btnVideoOsdSettingsRight
              });
              return;
            case 'audio':
              if (shouldOsdBeShown(instance)) {
                instance.showOsd();
              }
              if (!instance.btnAudio.classList.contains('hide')) {
                showAudioTrackSelection.call(instance, {
                  target: instance.btnAudio
                });
              }
              return;
            case 'playbackspeed':
              if (shouldOsdBeShown(instance)) {
                instance.showOsd();
              }
              if (!instance.btnPlaybackSpeed.classList.contains('hide')) {
                onSpeedClick.call(instance, {
                  target: instance.btnPlaybackSpeed
                });
              }
              return;
            case 'subtitles':
              if (shouldOsdBeShown(instance)) {
                instance.showOsd();
              }
              if (!instance.btnSubtitles.classList.contains('hide')) {
                showSubtitleTrackSelection.call(instance, {
                  target: instance.btnSubtitles
                });
              }
              return;
            default:
              break;
          }
        }
        if (shouldOsdBeShown(instance)) {
          instance.showOsd();
        }
        return;
      case 'pause':
      case 'nowplaying':
        if (shouldOsdBeShown(instance)) {
          instance.showOsd();
        }
        return;
      case 'record':
        if (shouldOsdBeShown(instance)) {
          instance.showOsd();
        }
        onRecordingCommand(instance);
        return;
      case 'togglestats':
        toggleStats(instance);
        return;
      case 'movies':
      case 'music':
      case 'tv':
      case 'settings':
      case 'search':
      case 'favorites':
        // prevent navigation
        e.preventDefault();
        return;
      case 'info':
        setBottomTabIndex(instance, 0);
        // prevent navigation
        e.preventDefault();
        return;
      case 'livetv':
        // show the guide if that tab is currently available
        setBottomTabIndex(instance, 4);

        // prevent navigation
        e.preventDefault();
        return;
      case 'guide':
        setBottomTabIndex(instance, 5);

        // prevent navigation
        e.preventDefault();
        return;
      default:
        break;
    }
    _baseview.default.prototype.onWindowInputCommand.apply(this, arguments);
  };
  VideoOsd.prototype.setLockState = function (lockState) {
    var instance = this;
    instance.currentLockState = lockState;
    if (lockState) {
      headerElement.classList.add('videoOsdHeader-locked');
      instance.osdBottomElement.classList.add('videoosd-bottom-locked');
      instance.view.querySelector('.videoOsdUnlockControls').classList.remove('hide');
      if (lockState === 1) {
        instance.view.querySelector('.videoOsd-btnUnlock1').classList.remove('hide');
        instance.view.querySelector('.videoOsd-btnUnlock2').classList.add('hide');
      } else {
        instance.view.querySelector('.videoOsd-btnUnlock1').classList.add('hide');
        instance.view.querySelector('.videoOsd-btnUnlock2').classList.remove('hide');
      }
      lockOrientation();
    } else {
      headerElement.classList.remove('videoOsdHeader-locked');
      instance.osdBottomElement.classList.remove('videoosd-bottom-locked');
      instance.view.querySelector('.videoOsdUnlockControls').classList.add('hide');
      instance.view.querySelector('.videoOsd-btnUnlock1').classList.add('hide');
      instance.view.querySelector('.videoOsd-btnUnlock2').classList.add('hide');
      unlockOrientation();
    }
  };
  VideoOsd.prototype.showOsd = function (timeoutMs, elementToFocus) {
    if (this.paused) {
      return;
    }

    //console.log('showOsd: ' + new Error().stack);

    headerElement.classList.remove('hide');

    // trigger a reflow to force it to animate again
    void headerElement.offsetWidth;
    headerElement.classList.remove('videoOsdHeader-hidden');
    showMainOsdControls(this, elementToFocus);
    startOsdHideTimer(this, timeoutMs);
  };
  function hideMainOsdControls(instance) {
    if (!instance.currentVisibleMenu) {
      return;
    }
    var elem = instance.osdBottomElement;

    // trigger a reflow to force it to animate again
    void elem.offsetWidth;
    elem.classList.add('videoOsdBottom-hidden');
    instance.currentVisibleMenu = null;
  }
  VideoOsd.prototype.hideOsd = function () {
    // osd is always visible when playing audio or remote controlling
    var currentPlayer = this.currentPlayer;
    if (!isDisplayingLocalVideo(currentPlayer) || !(currentPlayer != null && currentPlayer.isLocalPlayer)) {
      return;
    }
    headerElement.classList.add('videoOsdHeader-hidden');
    hideMainOsdControls(this);
    var lyricsRenderer = this.lyricsRenderer;
    if (lyricsRenderer && !lyricsRenderer.paused && _layoutmanager.default.tv) {
      lyricsRenderer.focus();
    }
  };
  VideoOsd.prototype.exit = function () {
    if (!this.paused) {
      console.log('navigating back from videoosd');
      _approuter.default.back();
    }
  };
  function onPlayerChange(e, player) {
    var instance = this;
    instance.bindToPlayer(player);
    setBottomTabIndex(instance, -1);
  }
  function onOsdResized(entries) {
    var instance = this;
    for (var i = 0, length = entries.length; i < length; i++) {
      var entry = entries[i];
      if (!entry) {
        continue;
      }

      //const newRect = entry.contentRect;

      // using offsetHeight sort of defeats the purpose of ResizeObserver, performance-wise
      // but we need the vertical padding included in this
      var height = instance.osdBottomElement.offsetHeight;
      try {
        document.documentElement.style.setProperty('--osd-height', Math.ceil(height) + 'px');
      } catch (err) {
        console.error('error setting --osd-height css variable', err);
      }
    }
  }
  function createOsdResizeObserver(instance) {
    if (instance._resizeObserver) {
      return;
    }
    instance._resizeObserver = new ResizeObserver(onOsdResized.bind(instance), {});
    instance._resizeObserver.observe(instance.osdBottomElement);
  }
  function destroyOsdResizeObserver(instance) {
    if (instance._resizeObserver) {
      instance._resizeObserver.disconnect();
      instance._resizeObserver = null;
    }
  }
  function fillHeaderRightVolumeContent(instance) {
    var elem = instance.headerRightVolumeContainer;
    if (!elem) {
      instance.headerRightVolumeContainer = elem = document.createElement('div');
      elem.className = 'hide headerSectionItem';
      elem.innerHTML = '';
      headerRight.insertBefore(elem, headerRight.firstElementChild);
      elem.innerHTML = "\n                <div class=\"videoOsdVolumeControls videoOsdVolumeControls-top hide osdForceHide videoOsd-hideWhenLocked flex flex-direction-row align-items-center hide-mouse-idle-tv\">\n\n                    <div class=\"videoOsdVolumeSliderWrapper videoOsdVolumeSliderWrapper-top flex-grow\">\n                        <div class=\"sliderContainer flex-grow\">\n                            <input is=\"emby-slider\" data-bubble=\"false\" type=\"range\" step=\"1\" min=\"0\" max=\"100\" value=\"0\" class=\"videoOsdVolumeSlider\" tabindex=\"-1\" data-hoverthumb=\"true\" />\n                        </div>\n                    </div>\n\n                    <button is=\"paper-icon-button-light\" tabindex=\"-1\" class=\"osdIconButton buttonMute flex-shrink-zero\" title=\"Mute\" aria-label=\"Mute\" style=\"margin:0;\">\n                        <i class=\"md-icon md-icon-fill osdIconButton-icon\">&#xe050;</i>\n                    </button>\n                </div>\n    ";
      instance.topVolumeControls = elem.querySelector('.videoOsdVolumeControls');
      instance.topVolumeSlider = elem.querySelector('.videoOsdVolumeSlider');
      instance.topMuteButton = elem.querySelector('.buttonMute');
      instance.topMuteButton.addEventListener('click', onTopMuteButtonClick.bind(instance));
      var videoOsdVolumeSliderWrapper = elem.querySelector('.videoOsdVolumeSliderWrapper');
      videoOsdVolumeSliderWrapper.addEventListener('transitionrun', function (e) {
        if (e.target === e.currentTarget) {
          instance.isTopVolumeTransitioning = true;
        }
      });
      videoOsdVolumeSliderWrapper.addEventListener('transitionend', function (e) {
        if (e.target === e.currentTarget) {
          instance.isTopVolumeTransitioning = false;
        }
      });
      videoOsdVolumeSliderWrapper.addEventListener('transitioncancel', function (e) {
        if (e.target === e.currentTarget) {
          instance.isTopVolumeTransitioning = false;
        }
      });
      _dom.default.addEventListener(instance.topVolumeSlider, 'change', onVolumeSliderInputOrChange.bind(instance), {
        passive: true
      });
      _dom.default.addEventListener(instance.topVolumeSlider, 'input', onVolumeSliderInputOrChange.bind(instance), {
        passive: true
      });
    }
    elem.classList.remove('hide');
  }
  function fillHeaderRightButtonContent(instance) {
    var elem = instance.headerRightButtonContainer;
    if (!elem) {
      instance.headerRightButtonContainer = elem = document.createElement('div');
      elem.className = 'hide headerSectionItem';
      elem.innerHTML = '';
      headerRight.appendChild(elem);
      var PictureInPictureTitle = _globalize.default.translate('PictureInPicture');
      elem.innerHTML = "\n                    <button is=\"paper-icon-button-light\" tabindex=\"-1\" class=\"osdIconButton btnPip videoOsd-hideWhenLocked flex-shrink-zero\" title=\"" + PictureInPictureTitle + "\" aria-label=\"" + PictureInPictureTitle + "\" style=\"margin:0;\">\n                        <i class=\"md-icon osdIconButton-icon\">&#xe911;</i>\n                    </button>\n    ";
      elem.querySelector('.btnPip').addEventListener('click', function () {
        _playbackmanager.default.togglePictureInPicture(instance.currentPlayer);
      });
    }
    elem.classList.remove('hide');
  }
  function destroyHeaderRightContent(instance) {
    var _instance$headerRight, _instance$headerRight2;
    (_instance$headerRight = instance.headerRightVolumeContainer) == null || _instance$headerRight.remove();
    instance.headerRightVolumeContainer = null;
    (_instance$headerRight2 = instance.headerRightButtonContainer) == null || _instance$headerRight2.remove();
    instance.headerRightButtonContainer = null;
    instance.topVolumeControls = null;
    instance.topVolumeSlider = null;
    instance.topMuteButton = null;
  }
  VideoOsd.prototype.onResume = function (options) {
    _baseview.default.prototype.onResume.apply(this, arguments);
    headerElement.classList.add('videoOsdHeader');
    if (this.nowPlayingPositionSlider.classList.contains('longpress')) {
      document.body.classList.add('longpress');
    }
    fillHeaderRightVolumeContent(this);
    fillHeaderRightButtonContent(this);
    var boundOnPlayerChange = this.boundOnPlayerChange;
    if (!boundOnPlayerChange) {
      boundOnPlayerChange = this.boundOnPlayerChange = onPlayerChange.bind(this);
    }
    _events.default.on(_playbackmanager.default, 'playerchange', boundOnPlayerChange);
    this.bindToPlayer(_playbackmanager.default.getCurrentPlayer(), true);
    var player = this.currentPlayer;
    if (player && !options.refresh) {
      var _this$osdController$c;
      var mediaType = (_this$osdController$c = this.osdController.currentItem) == null ? void 0 : _this$osdController$c.MediaType;
      var isLocalVideo = isDisplayingLocalVideo(player, mediaType);
      this.updateTransparency(player, this.lastPlayerState || {}, mediaType, isLocalVideo);
    }
    var view = this.view;
    var boundPointerMove = this.boundPointerMove;
    if (!boundPointerMove) {
      boundPointerMove = this.boundPointerMove = onPointerMove.bind(this);
    }
    _dom.default.addEventListener(document, window.PointerEvent ? 'pointermove' : 'mousemove', boundPointerMove, {
      passive: true
    });
    var boundPointerEnter = this.boundPointerEnter;
    if (!boundPointerEnter) {
      boundPointerEnter = this.boundPointerEnter = onPointerEnter.bind(this);
    }
    _dom.default.addEventListener(view, window.PointerEvent ? 'pointerenter' : 'mouseenter', boundPointerEnter, {
      passive: true,
      capture: true
    });
    var boundPointerLeave = this.boundPointerLeave;
    if (!boundPointerLeave) {
      boundPointerLeave = this.boundPointerLeave = onPointerLeave.bind(this);
    }
    _dom.default.addEventListener(view, window.PointerEvent ? 'pointerleave' : 'mouseleave', boundPointerLeave, {
      passive: true,
      capture: true
    });
    blurElementFromPreviousView(view);
    var boundWindowKeyDown = this.boundWindowKeyDown;
    if (!boundWindowKeyDown) {
      boundWindowKeyDown = this.boundWindowKeyDown = onWindowKeyDown.bind(this);
    }
    _dom.default.addEventListener(window, 'keydown', boundWindowKeyDown, {});
    _mouse.default.requestMouseListening("videoosd");
  };
  VideoOsd.prototype.onPause = function (options) {
    var _options$newViewInfo;
    _baseview.default.prototype.onPause.apply(this, arguments);
    document.body.classList.remove('longpress');
    destroyOsdResizeObserver(this);
    var statsOverlay = this.statsOverlay;
    if (statsOverlay) {
      statsOverlay.enabled(false);
    }
    destroySubtitleOffsetDialog(this);
    destroySubtitleAppearanceDialog(this);
    closeOsdDialogs(this);
    var boundWindowKeyDown = this.boundWindowKeyDown;
    if (boundWindowKeyDown) {
      _dom.default.removeEventListener(window, 'keydown', boundWindowKeyDown, {});
    }
    destroyHeaderRightContent(this);
    headerElement.classList.remove('videoOsdHeader', 'videoOsdHeader-hidden', 'videoOsdHeader-locked', 'hide');
    clearBlurFromDocumentElement(this);
    var boundPointerMove = this.boundPointerMove;
    if (boundPointerMove) {
      _dom.default.removeEventListener(document, window.PointerEvent ? 'pointermove' : 'mousemove', boundPointerMove, {
        passive: true
      });
    }
    var boundOnPlayerChange = this.boundOnPlayerChange;
    if (boundOnPlayerChange) {
      _events.default.off(_playbackmanager.default, 'playerchange', boundOnPlayerChange);
    }
    var bottomTabControllers = this.bottomTabControllers;
    for (var i = 0, length = bottomTabControllers.length; i < length; i++) {
      var controller = bottomTabControllers[i];
      if (controller) {
        controller.onPause();
      }
    }
    this.enableBackOnStop = false;
    if (this.enableStopOnBack && ((_options$newViewInfo = options.newViewInfo) == null || (_options$newViewInfo = _options$newViewInfo.params) == null ? void 0 : _options$newViewInfo.asDialog) !== 'true') {
      document.documentElement.classList.remove('osd-tab-guide');
      this.enableStopOnBack = false;
      this.enableBackOnStop = false;
      var player = this.currentPlayer;
      this.releaseCurrentPlayer();
      if (player != null && player.isLocalPlayer && _appsettings.default.enableVideoUnderUI()) {
        _approuter.default.setTransparency('backdrop');
      } else {
        _playbackmanager.default.stop(player);
      }
    } else {
      this.releaseCurrentPlayer();
    }
    _mouse.default.releaseMouseListening("videoosd");
    stopOsdHideTimer(this);
    _backdrop.default.clear();
    this.setLockState(0);
    unlockOrientation();
    setSystemUIHidden(false);
  };
  VideoOsd.prototype.destroy = function () {
    _baseview.default.prototype.destroy.apply(this, arguments);
    var videoOsdText = this.videoOsdText;
    if (videoOsdText) {
      _shortcuts.default.off(videoOsdText);
      this.videoOsdText = null;
    }
    destroyPlayQueue(this);
    destroyLyricsRenderer(this);
    destroyChaptersRenderer(this);
    var recordingButtonManager = this.recordingButtonManager;
    if (recordingButtonManager) {
      recordingButtonManager.destroy();
      this.recordingButtonManager = null;
    }
    destroyStats(this);
    destroySubtitleOffsetDialog(this);
    destroySubtitleAppearanceDialog(this);
    closeOsdDialogs(this);
    destroyPinchGesture(this);
    if (this.osdController) {
      this.osdController.destroy();
      this.osdController = null;
    }
    var bottomTabControllers = this.bottomTabControllers;
    if (bottomTabControllers) {
      for (var i = 0, length = bottomTabControllers.length; i < length; i++) {
        if (bottomTabControllers[i]) {
          bottomTabControllers[i].destroy();
        }
      }
      this.bottomTabControllers = null;
    }
    this.boundPointerMove = null;
    this.boundWindowKeyDown = null;
    this.boundInputCommand = null;
    this.boundHideOsd = null;
    this.boundShowOsdDefaultParams = null;
    this.boundOnOsdHideTimeout = null;
    this.boundOnPlayerChange = null;
    this.upNextContainer = null;
    this.lastPlayerState = null;
    this.videoOsdBottomMaincontrols = null;
    this.tabContainersElem = null;
    this.btnAudio = null;
    this.btnSubtitles = null;
    this.btnPlaybackSpeed = null;
    this.currentPlayerSupportedCommands = null;
  };
  var _default = _exports.default = VideoOsd;
});
