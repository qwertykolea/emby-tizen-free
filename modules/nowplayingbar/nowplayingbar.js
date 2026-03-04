define(["./../common/playback/playbackmanager.js", "./../emby-apiclient/connectionmanager.js", "./../emby-apiclient/events.js", "./../common/globalize.js", "./../layoutmanager.js", "./../dom.js", "./../common/itemmanager/itemmanager.js", "./../shortcuts.js", "./../mediainfo/mediainfo.js", "./../emby-elements/emby-button/paper-icon-button-light.js", "./../emby-elements/userdatabuttons/emby-ratingbutton.js", "./../common/inputmanager.js", "./../focusmanager.js", "./../common/appsettings.js", "./../playback/osdcontroller.js"], function (_playbackmanager, _connectionmanager, _events, _globalize, _layoutmanager, _dom, _itemmanager, _shortcuts, _mediainfo, _paperIconButtonLight, _embyRatingbutton, _inputmanager, _focusmanager, _appsettings, _osdcontroller) {
  /* jshint module: true */

  // this is to use the textItems styles, and ensure they are loaded first

  var currentPlayer;
  var osdController;
  var currentPlayerSupportedCommands = [];
  var nowPlayingImageElement;
  var nowPlayingTextElement;
  var nowPlayingBarTVTextElement;
  var nowPlayingBarFavoriteButton;
  var muteButton;
  var volumeSlider;
  var volumeSliderContainer;
  var playPauseButtons;
  var positionSlider;
  var toggleRepeatButton;
  var toggleShuffleButton;
  var remoteControlButton;
  var stopButtonRight;
  var lastUpdateTime = 0;
  var isEnabled;
  var currentRuntimeTicks = 0;
  var isVisibilityAllowed = true;
  var appFooter;
  var headerElement = document.querySelector('.skinHeader');
  var currentMode;
  function getNowPlayingBarHtml() {
    var html = '';
    var className = '';
    if (currentMode === 'tv') {
      className += ' headerNowPlaying headerSection';
    } else {
      className += ' nowPlayingBar-footer nowPlayingBar-footer-transition';
    }
    html += '<div class="nowPlayingBar focuscontainer-x hide nowPlayingBar-hidden' + className + '">';
    if (currentMode !== 'tv') {
      html += '<div class="nowPlayingBarTop">';
    }
    html += '<div class="nowPlayingBarPositionContainer sliderContainer">';
    html += '<input type="range" is="emby-slider" pin step=".01" min="0" max="100" value="0" class="nowPlayingBarPositionSlider" tabindex="-1" data-defaultinputhandling="false" data-hoverthumb="true" data-thumbclass="nowPlayingBarPositionSliderThumb hidetouch" data-sliderbackgroundclass="nowPlayingBarPositionContainer-background" />';
    html += '</div>';
    html += '<div class="nowPlayingBarInfoContainer">';
    html += '<div class="nowPlayingBarImage" loading="lazy"></div>';
    html += '<div class="nowPlayingBarText nowPlayingBar-hidetv"></div>';
    html += '</div>';
    var tvTextClass = currentMode === 'tv' ? '' : ' hide';
    html += '<button is="emby-button" type="button" class="nowPlayingBarTVText' + tvTextClass + ' button-link button-link-color-inherit" tabindex="-1"></button>';

    // The onclicks are needed due to the return false above
    if (currentMode === 'tv') {
      html += '<div class="nowPlayingBarCenter">';
    } else {
      html += '<div class="nowPlayingBarCenter nowPlayingBarCenter-autohide">';
    }
    html += '<button is="paper-icon-button-light" class="nowPlayingBar-hidetv previousTrackButton mediaButton md-icon md-icon-fill">&#xe045;</button>';
    html += '<button is="paper-icon-button-light" class="nowPlayingBar-hidetv playPauseButton mediaButton md-icon md-icon-fill">&#xe034;</button>';
    html += '<button is="paper-icon-button-light" class="nowPlayingBar-hidetv stopButton mediaButton md-icon md-icon-fill">&#xe047;</button>';
    html += '<button is="paper-icon-button-light" class="nowPlayingBar-hidetv nextTrackButton mediaButton md-icon md-icon-fill">&#xe044;</button>';
    if (currentMode === 'tv') {
      html += '<div class="nowPlayingBarCurrentTime"></div>';
    } else {
      html += '<div class="nowPlayingBarCurrentTime nowPlayingBarCurrentTime-autohide"></div>';
    }
    html += '</div>';
    html += '<div class="nowPlayingBarRight nowPlayingBar-hidetv">';
    html += '<button is="paper-icon-button-light" class="nowPlayingBar-hidetv nowPlayingBarMuteButton hidetouch muteButton mediaButton hide md-icon md-icon-fill">&#xe050;</button>';
    html += '<div class="sliderContainer hidetouch nowPlayingBarVolumeSliderContainer hide" style="width:100px;vertical-align:middle;display:inline-flex;">';
    html += '<input type="range" is="emby-slider" pin step="1" min="0" max="100" value="0" class="nowPlayingBarVolumeSlider" tabindex="-1" data-hoverthumb="true" />';
    html += '</div>';
    var toggleButtonIconClass = 'toggleButtonIcon';
    if (_dom.default.allowBackdropFilter()) {
      toggleButtonIconClass += ' toggleButtonIcon-backdropfilter';
    }
    html += '<button is="paper-icon-button-light" class="nowPlayingBar-hidetv toggleShuffleButton toggleButton mediaButton" style="padding:.24em;" title="' + _globalize.default.translate('Shuffle') + '"><i style="font-size:inherit;padding:.1em;" class="md-icon ' + toggleButtonIconClass + '">&#xe043;</i></button>';
    html += '<button is="paper-icon-button-light" class="nowPlayingBar-hidetv toggleRepeatButton toggleButton mediaButton" style="padding:.24em;" title="' + _globalize.default.translate('HeaderRepeatMode') + '"><i style="font-size:inherit;padding:.1em;" class="md-icon ' + toggleButtonIconClass + '">&#xe040;</i></button>';
    html += '<button is="emby-ratingbutton" type="button" class="nowPlayingBar-hidetv nowPlayingBarFavoriteButton listItemButton paper-icon-button-light md-icon">&#xe87D;</button>';
    html += '<button is="paper-icon-button-light" class="nowPlayingBar-hidetv playPauseButton playPauseButton-right mediaButton md-icon md-icon-fill">&#xe034;</button>';
    html += '<button is="paper-icon-button-light" class="nowPlayingBar-hidetv stopButton stopButton-right mediaButton md-icon md-icon-fill">&#xe047;</button>';
    html += '<button is="paper-icon-button-light" class="nowPlayingBar-hidetv remoteControlButton mediaButton md-icon autortl">&#xe241;</button>';
    html += '</div>';
    html += '</div>';
    if (currentMode !== 'tv') {
      html += '<div class="nowPlayingBarDropOverlay">';
      html += '<h3 style="margin:0;"><i class="md-icon button-icon button-icon-left autortl" style="font-size:150%;">&#xe03b;</i>' + _globalize.default.translate('HeaderAddToPlayQueue') + '</h3>';
      html += '</div>';
      html += '</div>';
    }
    return html;
  }
  function onSlideDownComplete(e) {
    var elem = e.currentTarget;
    if (elem === e.target) {
      if (elem.classList.contains('nowPlayingBar-hidden')) {
        elem.classList.add('hide');
      }
    }
  }
  function slideDown(elem) {
    if (!elem._visible) {
      return;
    }
    elem._visible = false;
    if (currentMode === 'tv') {
      _inputmanager.default.off(headerElement, onInputCommand);
      elem.classList.add('nowPlayingBar-hidden', 'hide');
      headerElement.classList.remove('skinHeader-withnowplaying');
      document.documentElement.classList.remove('withheadernowplaying');
      return;
    }

    // this is unfortunately needed to workaround the transitionend event not firing when hiding/showing multiple times quickly before a transition finishes
    elem.classList.remove('nowPlayingBar-footer-transition');

    // trigger reflow
    void elem.offsetWidth;
    elem.classList.add('nowPlayingBar-footer-transition');

    // trigger reflow
    void elem.offsetWidth;
    elem.classList.add('nowPlayingBar-hidden');
  }
  function onInputCommand(e) {
    switch (e.detail.command) {
      case 'up':
        _focusmanager.default.focus(nowPlayingBarTVTextElement);
        break;
      default:
        break;
    }
  }
  function slideUp(elem) {
    if (elem._visible) {
      return;
    }
    elem._visible = true;
    if (currentMode === 'tv') {
      elem.classList.remove('nowPlayingBar-hidden', 'hide');
      headerElement.classList.add('skinHeader-withnowplaying');
      document.documentElement.classList.add('withheadernowplaying');
      _inputmanager.default.off(headerElement, onInputCommand);
      _inputmanager.default.on(headerElement, onInputCommand);
      return;
    }

    //elem.style.willChange = 'transform';

    elem.classList.remove('hide');

    // trigger reflow
    void elem.offsetWidth;
    elem.classList.remove('nowPlayingBar-hidden');
  }
  function onPlayPauseClick() {
    _playbackmanager.default.playPause(currentPlayer);
  }
  function onStopClick() {
    if (currentPlayer) {
      _playbackmanager.default.stop(currentPlayer);
    }
  }
  var dragCounter = 0;
  function onDragEnter(e) {
    e.dataTransfer.dropEffect = 'copy';
    var data = window.CurrentDragInfo;
    var item = data ? data.item : null;
    if (item && _playbackmanager.default.canQueue(item)) {
      this.classList.add('nowPlayingBar-dragging-over');
      dragCounter++;
    }
  }
  function onDragOver(e) {
    e.dataTransfer.dropEffect = 'copy';
    var data = window.CurrentDragInfo;
    var item = data ? data.item : null;
    if (item && _playbackmanager.default.canQueue(item)) {
      e.preventDefault();
    }
  }
  function onDragLeave(e) {
    var data = window.CurrentDragInfo;
    var item = data ? data.item : null;
    if (item && _playbackmanager.default.canQueue(item)) {
      dragCounter--;
      if (dragCounter === 0) {
        this.classList.remove('nowPlayingBar-dragging-over');
      }
    }
  }
  function onDragEnd(e) {
    this.classList.remove('nowPlayingBar-dragging-over');
  }
  function showToast(options) {
    return Emby.importModule('./modules/toast/toast.js').then(function (toast) {
      return toast(options);
    });
  }
  function onDrop(e) {
    var _window$CurrentDragIn;
    dragCounter = 0;
    e.preventDefault();
    this.classList.remove('nowPlayingBar-dragging-over');
    var items = ((_window$CurrentDragIn = window.CurrentDragInfo) == null ? void 0 : _window$CurrentDragIn.items) || [];
    if (!items.length) {
      return;
    }
    items = items.filter(function (i) {
      return _playbackmanager.default.canQueue(i);
    });
    if (!items.length) {
      return;
    }
    _playbackmanager.default.queue({
      items: items
    });
    showToast({
      text: _globalize.default.translate('HeaderAddedToPlayQueue'),
      icon: '&#xe03b;'
    });
  }
  function bindEvents(elem) {
    _events.default.on(_layoutmanager.default, 'modechange', onLayoutModeChange);
    if (currentMode !== 'tv') {
      _dom.default.addEventListener(elem, _dom.default.whichTransitionEvent(), onSlideDownComplete, {
        passive: true
      });
    }
    nowPlayingImageElement = elem.querySelector('.nowPlayingBarImage');
    nowPlayingTextElement = elem.querySelector('.nowPlayingBarText');
    nowPlayingBarTVTextElement = elem.querySelector('.nowPlayingBarTVText');
    nowPlayingBarFavoriteButton = elem.querySelector('.nowPlayingBarFavoriteButton');
    positionSlider = elem.querySelector('.nowPlayingBarPositionSlider');
    osdController = new _osdcontroller.default({
      nowPlayingPositionSlider: positionSlider,
      positionTextElem: elem.querySelector('.nowPlayingBarCurrentTime'),
      durationTextElem: null,
      enableSeekThumbnails: false,
      parentElement: elem
    });
    _events.default.on(osdController, 'displayitemupdated', onDisplayItemUpdated);
    osdController.bindToPlayer(currentPlayer);
    muteButton = elem.querySelector('.muteButton');
    muteButton.addEventListener('click', function () {
      if (currentPlayer) {
        _playbackmanager.default.toggleMute(currentPlayer);
      }
    });
    stopButtonRight = elem.querySelector('.stopButton-right');
    var stopButtons = elem.querySelectorAll('.stopButton');
    for (var i = 0, length = stopButtons.length; i < length; i++) {
      stopButtons[i].addEventListener('click', onStopClick);
    }
    playPauseButtons = elem.querySelectorAll('.playPauseButton');
    for (var _i = 0, _length = playPauseButtons.length; _i < _length; _i++) {
      playPauseButtons[_i].addEventListener('click', onPlayPauseClick);
    }
    elem.querySelector('.nextTrackButton').addEventListener('click', function () {
      if (currentPlayer) {
        _playbackmanager.default.nextTrack(currentPlayer);
      }
    });
    elem.querySelector('.previousTrackButton').addEventListener('click', function () {
      if (currentPlayer) {
        _playbackmanager.default.previousTrack(currentPlayer);
      }
    });
    remoteControlButton = elem.querySelector('.remoteControlButton');
    remoteControlButton.addEventListener('click', showRemoteControl);
    toggleRepeatButton = elem.querySelector('.toggleRepeatButton');
    toggleRepeatButton.addEventListener('click', function () {
      if (currentPlayer) {
        _playbackmanager.default.toggleRepeatMode(currentPlayer);
      }
    });
    toggleShuffleButton = elem.querySelector('.toggleShuffleButton');
    toggleShuffleButton.addEventListener('click', function () {
      if (currentPlayer) {
        _playbackmanager.default.toggleShuffle(currentPlayer);
      }
    });
    volumeSlider = elem.querySelector('.nowPlayingBarVolumeSlider');
    volumeSliderContainer = elem.querySelector('.nowPlayingBarVolumeSliderContainer');
    volumeSlider.addEventListener('change', function () {
      if (currentPlayer) {
        currentPlayer.setVolume(this.value);
      }
    });
    volumeSlider.addEventListener('input', function () {
      if (currentPlayer) {
        currentPlayer.setVolume(this.value);
      }
    });
    positionSlider.getBubbleHtml = function (value) {
      return osdController.getPositionBubbleHtml(value, currentRuntimeTicks);
    };
    elem.addEventListener('click', function (e) {
      if (!e.target.closest('BUTTON:not(.nowPlayingBarTVText),INPUT,A')) {
        showRemoteControl(0);
      }
    });
    elem.addEventListener('dragover', onDragOver);
    elem.addEventListener('dragend', onDragEnd);
    elem.addEventListener('dragenter', onDragEnter);
    elem.addEventListener('dragleave', onDragLeave);
    elem.addEventListener('drop', onDrop);
  }
  function showRemoteControl() {
    Emby.importModule('./modules/approuter.js').then(function (appRouter) {
      appRouter.showNowPlaying();
    });
  }
  var nowPlayingBarElement;
  function getNowPlayingBar() {
    if (nowPlayingBarElement) {
      return Promise.resolve(nowPlayingBarElement);
    }
    currentMode = _layoutmanager.default.tv ? 'tv' : null;
    var parentModule = currentMode === 'tv' ? './modules/appheader/appheader.js' : './modules/appfooter/appfooter.js';
    return Promise.all([Emby.importModule('./modules/emby-elements/emby-slider/emby-slider.js'), Emby.importModule(parentModule), require(['css!modules/nowplayingbar/nowplayingbar.css', 'css!!tv|modules/nowplayingbar/nontv.css', 'css!tv|modules/nowplayingbar/tv.css'])]).then(function (responses) {
      appFooter = responses[1];
      var parentContainer = currentMode === 'tv' ? headerElement : appFooter.element;
      nowPlayingBarElement = parentContainer.querySelector('.nowPlayingBar');
      if (nowPlayingBarElement) {
        return Promise.resolve(nowPlayingBarElement);
      }
      parentContainer.insertAdjacentHTML('afterbegin', getNowPlayingBarHtml());
      nowPlayingBarElement = parentContainer.querySelector('.nowPlayingBar');
      _shortcuts.default.on(nowPlayingBarElement);
      bindEvents(nowPlayingBarElement);
      return Promise.resolve(nowPlayingBarElement);
    });
  }
  function onLayoutModeChange() {
    var _nowPlayingBarElement;
    (_nowPlayingBarElement = nowPlayingBarElement) == null || _nowPlayingBarElement.remove();
    nowPlayingBarElement = null;
    currentMode = _layoutmanager.default.tv ? 'tv' : null;
    updateVisibilityForView();
  }
  function updatePlayPauseState(isPaused) {
    var _osdController;
    (_osdController = osdController) == null || _osdController.onPlayPauseStateChanged(isPaused);
    var i, length;
    if (playPauseButtons) {
      if (isPaused) {
        for (i = 0, length = playPauseButtons.length; i < length; i++) {
          playPauseButtons[i].innerHTML = '&#xe037;';
        }
      } else {
        for (i = 0, length = playPauseButtons.length; i < length; i++) {
          playPauseButtons[i].innerHTML = '&#xe034;';
        }
      }
    }
  }
  function updatePlayerStateInternal(event, state, player) {
    showNowPlayingBar();
    var playerInfo = _playbackmanager.default.getPlayerInfo(player);
    var playState = state.PlayState || {};
    if (osdController) {
      osdController.disablePositionSlider = currentMode === 'tv';
      osdController.updatePlayerState(event, player, state);
    }
    updatePlayPauseState(playState.IsPaused);
    var supportedCommands = playerInfo.supportedCommands || [];
    currentPlayerSupportedCommands = supportedCommands;
    var nowPlayingItem = state.NowPlayingItem || {};
    if (supportedCommands.includes('SetRepeatMode') && (!player.isLocalPlayer || nowPlayingItem.MediaType !== 'Video')) {
      toggleRepeatButton.classList.remove('hide');
    } else {
      toggleRepeatButton.classList.add('hide');
    }
    if (supportedCommands.includes('SetShuffle') && (!player.isLocalPlayer || nowPlayingItem.MediaType !== 'Video')) {
      toggleShuffleButton.classList.remove('hide');
    } else {
      toggleShuffleButton.classList.add('hide');
    }
    if (player.isLocalPlayer && nowPlayingItem.MediaType === 'Video') {
      remoteControlButton.innerHTML = '&#xe5d0;';
      stopButtonRight.classList.remove('hide');
    } else {
      remoteControlButton.innerHTML = '&#xe241;';
      stopButtonRight.classList.add('hide');
    }
    updateRepeatModeDisplay(playState.RepeatMode);
    updateShuffleDisplay(playState.Shuffle);
    updatePlayerVolumeState(playState.IsMuted, playState.VolumeLevel);
    updateTimeDisplay(playState.PositionTicks, nowPlayingItem.RunTimeTicks, _playbackmanager.default.getSeekableRanges(player));
  }
  function updateRepeatModeDisplay(repeatMode) {
    var icon = toggleRepeatButton.querySelector('i');
    var btnRepeatMode = toggleRepeatButton;
    if (repeatMode === 'RepeatAll') {
      icon.innerHTML = '&#xe040;';
      icon.classList.add('toggleButtonIcon-active');
      btnRepeatMode.classList.add('toggleButton-active');
    } else if (repeatMode === 'RepeatOne') {
      icon.innerHTML = '&#xe041;';
      icon.classList.add('toggleButtonIcon-active');
      btnRepeatMode.classList.add('toggleButton-active');
    } else {
      icon.innerHTML = '&#xe040;';
      icon.classList.remove('toggleButtonIcon-active');
      btnRepeatMode.classList.remove('toggleButton-active');
    }
  }
  function updateShuffleDisplay(shuffle) {
    var icon = toggleShuffleButton.querySelector('i');
    var btn = toggleShuffleButton;
    if (shuffle) {
      icon.classList.add('toggleButtonIcon-active');
      btn.classList.add('toggleButton-active');
    } else {
      icon.classList.remove('toggleButtonIcon-active');
      btn.classList.remove('toggleButton-active');
    }
  }
  function updateTimeDisplay(positionTicks, runtimeTicks, seekableRanges) {
    var _osdController2;
    (_osdController2 = osdController) == null || _osdController2.onPlayerTimeUpdate(positionTicks, runtimeTicks, seekableRanges);
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
  function updatePlayerVolumeState(isMuted, volumeLevel) {
    var supportedCommands = currentPlayerSupportedCommands;
    var showMuteButton = true;
    var showVolumeSlider = true;
    if (supportedCommands.indexOf('ToggleMute') === -1) {
      showMuteButton = false;
    }
    if (muteButton) {
      if (isMuted) {
        muteButton.innerHTML = '&#xe04F;';
      } else {
        muteButton.innerHTML = '&#xe050;';
      }
      if (showMuteButton) {
        muteButton.classList.remove('hide');
      } else {
        muteButton.classList.add('hide');
      }
    }
    if (supportedCommands.indexOf('SetVolume') === -1) {
      showVolumeSlider = false;
    }

    // See bindEvents for why this is necessary
    if (volumeSlider) {
      if (showVolumeSlider) {
        volumeSliderContainer.classList.remove('hide');
      } else {
        volumeSliderContainer.classList.add('hide');
      }
      if (!volumeSlider.dragging) {
        setSliderValue(volumeSlider, isMuted ? 0 : volumeLevel);
      }
    }
  }
  function getTextActionButton(item, text, serverId, enableButton, addComma) {
    if (!text) {
      text = _itemmanager.default.getDisplayName(item) || '';
    }
    if (addComma) {
      text += ', ';
    }
    var html = '';
    if (!enableButton) {
      html += '<div class="textItem">';
      html += text;
      html += '</div>';
      return html;
    }
    var dataAttributes = _shortcuts.default.getShortcutAttributesHtml(item, {
      serverId: serverId
    });
    html = '<button ' + dataAttributes + ' type="button" class="itemAction button-link button-inherit-color hidetouch textItem" data-action="link" is="emby-button">';
    html += text;
    html += '</button>';
    html += '<div class="hidepointerfine textItem">';
    html += text;
    html += '</div>';
    return html;
  }
  function seriesImageUrl(item, options) {
    if (!item) {
      throw new Error('item cannot be null!');
    }
    if (item.Type !== 'Episode') {
      return null;
    }
    if (!options) {
      options = {};
    }
    options.type = options.type || "Primary";
    if (options.type === 'Primary') {
      if (item.SeriesPrimaryImageTag) {
        options.tag = item.SeriesPrimaryImageTag;
        return {
          url: _connectionmanager.default.getApiClient(item).getImageUrl(item.SeriesId, options),
          aspect: '2/3'
        };
      }
    }
    if (options.type === 'Thumb') {
      if (item.ParentThumbImageTag) {
        options.tag = item.ParentThumbImageTag;
        return {
          url: _connectionmanager.default.getApiClient(item).getImageUrl(item.ParentThumbItemId, options),
          aspect: '16/9'
        };
      }
    }
    return null;
  }
  function imageUrl(item, options) {
    if (!item) {
      throw new Error('item cannot be null!');
    }
    if (!options) {
      options = {};
    }
    options.type = options.type || "Primary";
    var imageTags = item.ImageTags || {};
    options.tag = item.PrimaryImageTag || imageTags[options.type];
    if (options.tag) {
      return {
        url: _connectionmanager.default.getApiClient(item).getImageUrl(item.PrimaryImageItemId || item.Id || item.ItemId, options),
        aspect: item.PrimaryImageAspectRatio ? item.PrimaryImageAspectRatio.toString() : '1'
      };
    }
    if (item.AlbumId && item.AlbumPrimaryImageTag) {
      options.tag = item.AlbumPrimaryImageTag;
      return {
        url: _connectionmanager.default.getApiClient(item).getImageUrl(item.AlbumId, options),
        aspect: '1'
      };
    }
    return null;
  }
  function getNowPlayingNames(nowPlayingItem, includeNonNameInfo, enableTextLinks) {
    var topText = nowPlayingItem.Name;
    if (nowPlayingItem.AlbumId && nowPlayingItem.MediaType === 'Audio') {
      topText = getTextActionButton({
        Id: nowPlayingItem.AlbumId,
        Name: nowPlayingItem.Album,
        Type: 'MusicAlbum',
        IsFolder: true,
        ServerId: nowPlayingItem.ServerId
      }, topText, null, enableTextLinks);
    } else {
      topText = _itemmanager.default.getDisplayName(nowPlayingItem, {}) || nowPlayingItem.Name;
    }
    var bottomText = '';
    if (nowPlayingItem.ArtistItems && nowPlayingItem.ArtistItems.length) {
      bottomText = nowPlayingItem.ArtistItems.map(function (a, index) {
        return getTextActionButton({
          Id: a.Id,
          Name: a.Name,
          Type: 'MusicArtist',
          IsFolder: true,
          ServerId: nowPlayingItem.ServerId
        }, null, null, enableTextLinks, index < nowPlayingItem.ArtistItems.length - 1);
      }).join('');
    } else if (nowPlayingItem.SeriesName || nowPlayingItem.Album) {
      bottomText = topText;
      topText = nowPlayingItem.SeriesName || nowPlayingItem.Album;
      if (nowPlayingItem.SeriesId) {
        topText = getTextActionButton({
          Id: nowPlayingItem.SeriesId,
          Name: nowPlayingItem.SeriesName,
          Type: 'Series',
          IsFolder: true,
          ServerId: nowPlayingItem.ServerId
        }, topText, null, enableTextLinks);
      }
    } else if (nowPlayingItem.ProductionYear && includeNonNameInfo !== false) {
      bottomText = nowPlayingItem.ProductionYear;
    }
    var list = [];
    if (enableTextLinks) {
      list.push('<div class="textItems nowplayingbar-textitems">' + topText + '</div>');
      if (bottomText) {
        list.push('<div class="textItems secondaryText nowplayingbar-textitems">' + bottomText + '</div>');
      }
    } else {
      list.push('<div class="textItems nowplayingbar-textitems">' + topText + '</div>');
      if (bottomText) {
        list.push('<div class="textItems nowplayingbar-textitems">' + bottomText + '</div>');
      }
    }
    return list;
  }
  var currentImgUrl;
  function onDisplayItemUpdated(e, item, displayItem, state) {
    var textLines = displayItem ? getNowPlayingNames(displayItem, null, true) : [];
    nowPlayingTextElement.innerHTML = textLines.join('');
    nowPlayingBarTVTextElement.innerHTML = (displayItem ? getNowPlayingNames(displayItem) : []).join('<div style="margin: 0.5em;"> - </div>');
    var imgHeight = 70;
    var urlInfo = displayItem ? seriesImageUrl(displayItem, {
      height: imgHeight
    }) || imageUrl(displayItem, {
      height: imgHeight
    }) : null;
    var url = urlInfo ? urlInfo.url : null;
    if (url !== currentImgUrl) {
      currentImgUrl = url;
      if (url) {
        nowPlayingImageElement.style['aspect-ratio'] = urlInfo.aspect;
        nowPlayingImageElement.style.backgroundImage = "url('" + url + "')";
        nowPlayingImageElement.classList.remove('defaultCardBackground');
        nowPlayingImageElement.innerHTML = '';
      } else {
        nowPlayingImageElement.style.backgroundImage = '';
        nowPlayingImageElement.style['aspect-ratio'] = '1';
        nowPlayingImageElement.classList.add('defaultCardBackground');
        nowPlayingImageElement.innerHTML = '<i class="md-icon nowPlayingBarDefaultItemIcon autortl">' + _itemmanager.default.getDefaultIcon(displayItem) + '</i>';
      }
    }
    if (displayItem && _itemmanager.default.canRate(item)) {
      nowPlayingBarFavoriteButton.setItem(displayItem);
      nowPlayingBarFavoriteButton.classList.remove('hide');
    } else {
      nowPlayingBarFavoriteButton.classList.add('hide');
      nowPlayingBarFavoriteButton.setItem(null);
    }
  }
  function onPlaybackStart(e, state) {
    var _osdController3;
    //console.log('nowplaying event: ' + e.type);

    var player = this;
    (_osdController3 = osdController) == null || _osdController3.onPlaybackStart(e, player, state);
    onStateChanged.call(player, e, state);
  }
  function onShuffleChange(e) {
    if (!isEnabled) {
      return;
    }
    var player = this;
    updateShuffleDisplay(_playbackmanager.default.getShuffle(player));
  }
  function onRepeatModeChange(e) {
    if (!isEnabled) {
      return;
    }
    var player = this;
    updateRepeatModeDisplay(_playbackmanager.default.getRepeatMode(player));
  }
  function showNowPlayingBar() {
    if (!isVisibilityAllowed) {
      hideNowPlayingBar();
      return;
    }
    if (currentMode !== 'tv') {
      if (appFooter) {
        appFooter.setWithContent(true);
      }
    }
    getNowPlayingBar().then(slideUp);
  }
  function hideNowPlayingBar() {
    isEnabled = false;

    // Use a timeout to prevent the bar from hiding and showing quickly
    // in the event of a stop->play command

    // Don't call getNowPlayingBar here because we don't want to end up creating it just to hide it
    var elem = nowPlayingBarElement;
    if (elem) {
      slideDown(elem);
    }
    if (currentMode !== 'tv') {
      if (appFooter) {
        appFooter.setWithContent(false);
      }
    }
  }
  function onPlaybackStopped(e, state) {
    var _osdController4;
    (_osdController4 = osdController) == null || _osdController4.onPlaybackStopped(e, state);

    //console.log('nowplaying event: ' + e.type);
    var player = this;
    if (player.isLocalPlayer) {
      if (state.NextMediaType !== 'Audio' && state.NextMediaType !== 'Video') {
        hideNowPlayingBar();
      }
    } else {
      if (!state.NextMediaType) {
        hideNowPlayingBar();
      }
    }
  }
  function onPlayPauseStateChanged(e) {
    if (!isEnabled) {
      return;
    }
    var player = this;
    updatePlayPauseState(player.paused());
  }
  function onStateChanged(event, state) {
    //console.log('nowplaying event: ' + e.type);
    var player = this;
    if (state.IsBackgroundPlayback) {
      hideNowPlayingBar();
      return;
    }
    if (!state.NowPlayingItem) {
      hideNowPlayingBar();
      return;
    }
    if (player.isLocalPlayer) {
      if (state.NowPlayingItem) {
        if (state.NowPlayingItem.MediaType === 'Video') {
          var enableBackgroundVideo = _appsettings.default.enableVideoUnderUI();
          if (!enableBackgroundVideo) {
            hideNowPlayingBar();
            return;
          }
        }
        if (state.NowPlayingItem.MediaType !== 'Audio' && state.NowPlayingItem.MediaType !== 'Video') {
          hideNowPlayingBar();
          return;
        }
      }
    }
    isEnabled = true;
    if (nowPlayingBarElement) {
      updatePlayerStateInternal(event, state, player);
      return;
    }
    getNowPlayingBar().then(function () {
      updatePlayerStateInternal(event, state, player);
    });
  }
  function onTimeUpdate(e) {
    if (!isEnabled) {
      return;
    }

    // Try to avoid hammering the document with changes
    var now = Date.now();
    if (now - lastUpdateTime < 700) {
      return;
    }
    lastUpdateTime = now;
    var player = this;
    currentRuntimeTicks = _playbackmanager.default.duration(player);
    updateTimeDisplay(_playbackmanager.default.currentTime(player), currentRuntimeTicks, _playbackmanager.default.getSeekableRanges(player));
  }
  function releaseCurrentPlayer() {
    var _osdController5;
    (_osdController5 = osdController) == null || _osdController5.releaseCurrentPlayer();
    var player = currentPlayer;
    if (player) {
      _events.default.off(player, 'playbackstart', onPlaybackStart);
      _events.default.off(player, 'statechange', onPlaybackStart);
      _events.default.off(player, 'repeatmodechange', onRepeatModeChange);
      _events.default.off(player, 'shufflechange', onShuffleChange);
      _events.default.off(player, 'playbackstop', onPlaybackStopped);
      _events.default.off(player, 'volumechange', onVolumeChanged);
      _events.default.off(player, 'pause', onPlayPauseStateChanged);
      _events.default.off(player, 'unpause', onPlayPauseStateChanged);
      _events.default.off(player, 'timeupdate', onTimeUpdate);
      currentPlayer = null;
      hideNowPlayingBar();
    }
  }
  function onVolumeChanged(e) {
    if (!isEnabled) {
      return;
    }
    var player = this;
    updatePlayerVolumeState(player.isMuted(), player.getVolume());
  }
  function refreshFromPlayer(player) {
    var state = _playbackmanager.default.getPlayerState(player);
    onStateChanged.call(player, {
      type: 'init'
    }, state);
  }
  function bindToPlayer(player) {
    var _osdController6;
    (_osdController6 = osdController) == null || _osdController6.bindToPlayer(player);
    if (player === currentPlayer) {
      return;
    }
    releaseCurrentPlayer();
    currentPlayer = player;
    if (!player) {
      return;
    }
    refreshFromPlayer(player);
    _events.default.on(player, 'playbackstart', onPlaybackStart);
    _events.default.on(player, 'statechange', onPlaybackStart);
    _events.default.on(player, 'repeatmodechange', onRepeatModeChange);
    _events.default.on(player, 'shufflechange', onShuffleChange);
    _events.default.on(player, 'playbackstop', onPlaybackStopped);
    _events.default.on(player, 'volumechange', onVolumeChanged);
    _events.default.on(player, 'pause', onPlayPauseStateChanged);
    _events.default.on(player, 'unpause', onPlayPauseStateChanged);
    _events.default.on(player, 'timeupdate', onTimeUpdate);
  }
  _events.default.on(_playbackmanager.default, 'playerchange', function (e, player) {
    bindToPlayer(player);
  });
  bindToPlayer(_playbackmanager.default.getCurrentPlayer());
  var viewMediaControlParameters = {};
  function isEnabledForView() {
    if (viewMediaControlParameters.enableMediaControl === false) {
      return false;
    }
    if (currentMode === 'tv') {
      if (!viewMediaControlParameters.enableMediaControlTV) {
        return false;
      }
    }
    return true;
  }
  function updateVisibilityForView() {
    if (!isEnabledForView()) {
      if (isVisibilityAllowed) {
        isVisibilityAllowed = false;
        hideNowPlayingBar();
      }
    } else if (!isVisibilityAllowed) {
      isVisibilityAllowed = true;
      if (currentPlayer) {
        refreshFromPlayer(currentPlayer);
      } else {
        hideNowPlayingBar();
      }
    }
  }
  document.addEventListener('viewbeforeshow', function (e) {
    var _e$detail$params;
    if (((_e$detail$params = e.detail.params) == null ? void 0 : _e$detail$params.asDialog) === 'true') {
      return;
    }
    var _e$detail = e.detail,
      enableMediaControl = _e$detail.enableMediaControl,
      enableMediaControlTV = _e$detail.enableMediaControlTV;
    viewMediaControlParameters = {
      enableMediaControl: enableMediaControl,
      enableMediaControlTV: enableMediaControlTV
    };
    updateVisibilityForView();
  });
});
