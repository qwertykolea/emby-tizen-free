define(["exports", "./../dom.js", "./../layoutmanager.js", "./../backdrop/backdrop.js", "./../shortcuts.js", "./../common/usersettings/usersettings.js", "./../common/itemmanager/itemmanager.js", "./../mediainfo/mediainfo.js", "./../cardbuilder/cardbuilder.js", "./../skinmanager.js", "./../emby-apiclient/connectionmanager.js", "./../common/globalize.js", "./../common/appsettings.js", "./../focusmanager.js", "./../maintabsmanager.js", "./../common/servicelocator.js"], function (_exports, _dom, _layoutmanager, _backdrop, _shortcuts, _usersettings, _itemmanager, _mediainfo, _cardbuilder, _skinmanager, _connectionmanager, _globalize, _appsettings, _focusmanager, _maintabsmanager, _servicelocator) {
  Object.defineProperty(_exports, "__esModule", {
    value: true
  });
  _exports.default = void 0;
  /* jshint module: true */

  var supportsAsyncDecodedImages = _dom.default.supportsAsyncDecodedImages();
  var decodingAttribute = supportsAsyncDecodedImages ? ' decoding="async"' : '';
  function findScroller(instance) {
    if (instance.scroller) {
      return;
    }
    var view = instance.view;
    instance.scroller = view.classList.contains('scrollFrameY') ? view : view.querySelector('.scrollFrameY');
  }
  function BaseTab(view, params, options) {
    this.view = view;
    this.params = params;
    this.options = options;
    findScroller(this);
    var requestedItemFields = ['BasicSyncInfo', 'CanDelete'];
    if (_servicelocator.appHost.supports('filedownload')) {
      requestedItemFields.push('CanDownload');
    }

    // for now, this must be kept in sync with baseview/basetab
    this.requestedItemFields = requestedItemFields.join(',');
  }
  function onFocusPreviewItemFetched(instance, item, itemElement) {
    var enableFocusPreview = instance.enableFocusPreview();
    if (enableFocusPreview) {
      instance.showFocusPreview(item, itemElement);
    }
    if (!item || !item.ServerId) {
      _backdrop.default.clear();
      return;
    }
    if (!enableFocusPreview && instance._enableBackdrops) {
      _backdrop.default.setBackdrop(item.CurrentProgram || item);
    }
  }
  function fetchAndShowFocusPreview(instance, focused) {
    var item = instance.getFocusPreviewItem(focused);
    if (!item || !instance.refetchItemForFocusPreview() || !instance.enableFocusPreview()) {
      onFocusPreviewItemFetched(instance, item, focused);
      return;
    }
    var apiClient = _connectionmanager.default.getApiClient(item);
    return apiClient.getItem(apiClient.getCurrentUserId(), item.Id).then(function (item) {
      onFocusPreviewItemFetched(instance, item, focused);
    });
  }
  function onSelectedInfoTimeout() {
    if (this.paused) {
      return;
    }
    var focused = this._focusedElement;
    if (focused) {
      fetchAndShowFocusPreview(this, focused);
    } else {
      onFocusPreviewItemFetched(this, null);
    }
  }
  function clearSelectedInfoTimer(instance) {
    var selectedItemInfoTimeout = instance.selectedItemInfoTimeout;
    if (selectedItemInfoTimeout) {
      clearTimeout(selectedItemInfoTimeout);
      instance.selectedItemInfoTimeout = null;
    }
  }
  function startSelectedInfoTimer(instance) {
    clearSelectedInfoTimer(instance);
    instance.selectedItemInfoTimeout = setTimeout(onSelectedInfoTimeout.bind(instance), 600);
  }
  function onItemsContainerFocusIn(e) {
    var focused = e.target;
    this.onFocusIn(focused);
  }
  function onItemsContainerFocusOut(e) {
    this.onFocusOut();
  }
  var backgroundContainer = document.querySelector('.backgroundContainer');
  var backdropContainer = document.querySelector('.backdropContainer');
  var appHeader = document.querySelector('.skinHeader');
  BaseTab.prototype.scrollDirection = function () {
    var _this$options;
    return ((_this$options = this.options) == null ? void 0 : _this$options.scrollDirection) || 'y';
  };
  BaseTab.prototype.enablePushDownFocusPreview = function () {
    return false;
  };
  BaseTab.prototype.enableFocusPreview = function () {
    if (!_layoutmanager.default.tv) {
      return false;
    }
    var scrollDirection = this.scrollDirection();
    if (scrollDirection === 'x') {
      return true;
    }
    return this.enablePushDownFocusPreview();
  };
  BaseTab.prototype.createFocusPreviewElement = function () {
    var cssClass = 'focusPreviewContainer';
    if (this.scrollDirection() === 'x') {
      cssClass += ' focusPreviewContainer-horizontal';
    } else {
      cssClass += ' padded-left padded-right padded-top-page ';
    }
    var html = '<div class="hide ' + cssClass + '"></div>';
    this.view.insertAdjacentHTML('afterbegin', html);
    var elem = this.view.querySelector('.focusPreviewContainer');
    this.fillFocusPreviewContainer(elem);
    return elem;
  };
  BaseTab.prototype.getFocusPreviewElement = function () {
    var elem = this._focusPreviewElement;
    if (elem) {
      return elem;
    }
    this._focusPreviewElement = elem = this.createFocusPreviewElement();
    return elem;
  };
  function getFocusPreviewImageItems() {
    var instance = this;
    var item = instance._focusPreviewImageItem;
    var items = [];
    if (item) {
      items.push(item);
    }
    return Promise.resolve({
      Items: items,
      TotalRecordCount: items.length
    });
  }
  function getFocusPreviewImageOptions() {
    var instance = this;
    return {
      renderer: _cardbuilder.default,
      options: {
        shape: 'auto',
        overlayText: true,
        fields: [],
        action: 'none',
        imageClass: "focusPreviewImageContainer",
        //imageWidthTestClass: imageContainerClassName,
        multiSelect: false,
        contextMenu: false,
        ratingButton: false,
        playedButton: false,
        cardClass: 'focusPreviewImageCard',
        cardBoxClass: 'focusPreviewImageCardBox',
        defaultIcon: false,
        defaultBackground: false,
        typeIndicator: false,
        playedIndicator: false,
        syncIndicator: false,
        downloadButton: false,
        timerIndicator: false,
        randomDefaultBackground: false,
        staticElement: true,
        progress: false,
        enableUserData: false,
        draggable: false,
        // prevents touchzoom
        moreButton: false,
        programIndicators: false,
        keepImageAnimation: true,
        preferLogo: instance.scrollDirection() === 'x',
        paddedImage: false,
        playQueueIndicator: false
      },
      virtualScrollLayout: 'vertical-grid'
    };
  }
  BaseTab.prototype.fillFocusPreviewContainer = function (elem) {
    var scrollDirection = this.scrollDirection();
    var cssClass = ' focusPreviewContainer-inner';
    var readOnlyContentStyle = this.enablePushDownFocusPreview() ? ' style="padding:0 .75em;box-sizing-border-box;"' : '"';
    var imgClass = '';
    var overviewClass = scrollDirection === 'x' ? ' focusPreviewOverview-horizontal' : '';
    var titleTag = 'h3';
    var secondaryTitleTag = 'div';
    elem.innerHTML = "<div class=\"flex flex-direction-row align-items-center " + cssClass + "\"><div is=\"emby-itemscontainer\" class=\"itemsContainer focusPreviewImageElement align-items-center hide " + imgClass + "\"></div><div class=\"focusPreviewTextContainer readOnlyContent verticalFieldItems verticalFieldItems-condensed\"" + readOnlyContentStyle + ">\n            <" + titleTag + " style=\"margin:0;\" class=\"focusPreviewTitle verticalFieldItem-condensed\"></" + titleTag + ">\n            <" + secondaryTitleTag + " class=\"focusPreviewSecondaryTitle hide verticalFieldItem-condensed\"></" + secondaryTitleTag + ">\n            <div class=\"secondaryText focusPreviewMediaInfo mediaInfoItems verticalFieldItem-condensed\" style=\"font-size:92%;\"></div>\n            <div class=\"secondaryText focusPreviewOverview verticalFieldItem-condensed " + overviewClass + "\"></div>\n        </div></div>";
    var itemsContainer = elem.querySelector('.itemsContainer');
    itemsContainer.fetchData = getFocusPreviewImageItems.bind(this);
    itemsContainer.parentContainer = itemsContainer;
    itemsContainer.getListOptions = getFocusPreviewImageOptions.bind(this);
    itemsContainer.waitForCustomElementUpgrade().then(function () {
      itemsContainer.resume({});
    });
  };
  function getLogoPlacement(item) {
    if (item.Type === 'TvChannel') {
      return null;
    }
    if (item.Type === 'MusicAlbum' || item.Type === 'Audio' || item.Type === 'MusicVideo') {
      if (!item.ImageTags || !item.ImageTags.Logo) {
        return 'float';
      }
    }
    if (_usersettings.default.getEnableLogoAsTitle(_globalize.default.getCurrentLocale())) {
      return 'title';
    }
    return 'float';
  }
  function fillFocusPreview(instance, elem, item, itemElement) {
    var _item$UserData;
    item = item.CurrentProgram || item;
    _backdrop.default.setBackdrop(item);
    var focusPreviewTitle = elem.querySelector('.focusPreviewTitle');
    var focusPreviewSecondaryTitle = elem.querySelector('.focusPreviewSecondaryTitle');
    var names = [];
    var scrollDirection = instance.scrollDirection();
    var apiClient = _connectionmanager.default.getApiClient(item);
    var itemForTitle = item.Type === 'Timer' ? item.ProgramInfo || item : item;
    var logoImage;
    if (apiClient) {
      logoImage = scrollDirection === 'x' || getLogoPlacement(itemForTitle) !== 'title' ? null : apiClient.getLogoImageUrl(itemForTitle, {
        maxHeight: 120
      }, _skinmanager.default.getPreferredLogoImageTypes());
    }
    if (item.SeriesName) {
      var name = item.SeriesName;
      if (logoImage) {
        name = '<img draggable="false" loading="lazy"' + decodingAttribute + ' class="focusPreviewTitleImg" alt="' + name + '" src="' + logoImage + '" />';
        logoImage = null;
      }
      names.push(name);
    }
    if (item.Name && (item.EpisodeTitle || item.IsSeries)) {
      var _name = item.Name;
      if (logoImage) {
        _name = '<img draggable="false" loading="lazy"' + decodingAttribute + ' class="focusPreviewTitleImg" alt="' + _name + '" src="' + logoImage + '" />';
        logoImage = null;
      }
      names.push(_name);
    }
    if (item.Name) {
      var _name2 = _itemmanager.default.getDisplayName(item, {});
      if (logoImage) {
        _name2 = '<img draggable="false" loading="lazy"' + decodingAttribute + ' class="focusPreviewTitleImg" alt="' + _name2 + '" src="' + logoImage + '" />';
        logoImage = null;
      }
      names.push(_name2);
    }
    focusPreviewTitle.innerHTML = names[0] || '';
    if (names.length > 1) {
      focusPreviewSecondaryTitle.innerHTML = names[1] || '';
      focusPreviewSecondaryTitle.classList.remove('hide');
    } else {
      focusPreviewSecondaryTitle.classList.add('hide');
    }
    var focusPreviewMediaInfo = elem.querySelector('.focusPreviewMediaInfo');
    var mediaInfoHtml = item.Type === 'Program' ? _mediainfo.default.getSecondaryMediaInfoHtml(item, {
      timerIndicator: true,
      channelName: false,
      officialRating: true,
      programIndicator: true
    }) : _mediainfo.default.getPrimaryMediaInfoHtml(item);
    focusPreviewMediaInfo.innerHTML = mediaInfoHtml;
    var overview = scrollDirection === 'x' ? null : item.Overview;
    if (_usersettings.default.hideEpisodeSpoilerInfo() && item.Type === 'Episode' && ((_item$UserData = item.UserData) == null ? void 0 : _item$UserData.Played) === false) {
      overview = null;
    }
    elem.querySelector('.focusPreviewOverview').innerHTML = _dom.default.stripScripts(overview || '');
    if (overview) {
      elem.classList.remove('hide');
    } else {
      elem.classList.add('hide');
    }
    if (instance.enableFocusPreviewImage()) {
      var focusPreviewImageElement = elem.querySelector('.focusPreviewImageElement');
      instance._focusPreviewImageItem = itemForTitle;
      focusPreviewImageElement.waitForCustomElementUpgrade().then(function () {
        focusPreviewImageElement.refreshItems();
      });
    }
    elem.classList.remove('hide');
    if (itemElement && scrollDirection === 'x') {
      var rect = itemElement.getBoundingClientRect();
      var windowWidth = _dom.default.getWindowSize().innerWidth;
      var style = elem.style;
      if (rect.left <= windowWidth * .7) {
        style.left = Math.min(rect.left, windowWidth * 0.6) + 'px';
        style.right = null;
      } else {
        style.right = '3%';
        style.left = 'initial';
      }
    }
    if (_backdrop.default.hasBackdrop()) {
      elem.querySelector('.focusPreviewTextContainer').classList.add('focusPreviewContainer-clip');
    } else {
      elem.querySelector('.focusPreviewTextContainer').classList.remove('focusPreviewContainer-clip');
    }

    //instance.onFocusPreviewChanged(item, true);
  }
  BaseTab.prototype.autoFocus = function (options) {
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
  function getBackdropItems(instance, apiClient, types, parentId) {
    var options = {
      SortBy: "Random",
      Limit: 1,
      Recursive: true,
      IncludeItemTypes: types,
      ImageTypes: "Backdrop",
      ParentId: parentId,
      EnableTotalRecordCount: false,
      ImageTypeLimit: 1,
      Fields: instance.getRequestedItemFields(),
      EnableImageTypes: instance.getRequestedImageTypes() + ',Backdrop'
    };
    return apiClient.getItems(apiClient.getCurrentUserId(), options);
  }
  function fillBackdropWithRandomItem(instance, elem, item, itemElement) {
    switch (item.Type) {
      case 'CollectionFolder':
      case 'Channel':
        break;
      default:
        return;
    }
    var apiClient = _connectionmanager.default.getApiClient(item);
    var itemTypes = 'Movie,Series,Game,MusicAlbum,MusicArtist,Trailer';
    switch (item.CollectionType) {
      case 'movies':
        itemTypes = 'Movie';
        break;
      case 'tvshows':
        itemTypes = 'Series';
        break;
      case 'games':
        itemTypes = 'Game';
        break;
      case 'musicvideos':
        itemTypes = 'MusicVideo';
        break;
      case 'homevideos':
        itemTypes = 'Video';
        break;
      case 'music':
      case 'audiobooks':
        itemTypes = 'MusicAlbum,MusicArtist';
        break;
      default:
        break;
    }
    getBackdropItems(instance, apiClient, itemTypes, item.Id).then(function (result) {
      _backdrop.default.setBackdrop(result.Items[0] || item);
    });
  }
  BaseTab.prototype.showFocusPreview = function (item, itemElement) {
    var elem = this.getFocusPreviewElement(item);
    if (!item || item.Type === 'AppCategory') {
      fillFocusPreview(this, elem, {});
      if (this.hideFocusPreviewElementUsingDisplay()) {
        elem.classList.add('hide');
      }
      //this.onFocusPreviewChanged(item, false);

      return;
    }
    fillFocusPreview(this, elem, item, itemElement);
    if (!_backdrop.default.hasBackdrop()) {
      fillBackdropWithRandomItem(this, elem, item, itemElement);
    }
  };
  BaseTab.prototype.hideFocusPreviewElementUsingDisplay = function () {
    return true;
  };
  BaseTab.prototype.refetchItemForFocusPreview = function () {
    return false;
  };
  BaseTab.prototype.getFocusPreviewItem = function (element) {
    return _shortcuts.default.getItemFromChildNode(element, true);
  };
  BaseTab.prototype.enableFocusPreviewImage = function () {
    return this.scrollDirection() === 'x';
  };
  BaseTab.prototype.onFocusIn = function (elem) {
    this._focusedElement = elem;
    startSelectedInfoTimer(this);
  };
  BaseTab.prototype.onFocusOut = function () {
    if (!_focusmanager.default.hasExclusiveFocusScope()) {
      this._focusedElement = null;
      startSelectedInfoTimer(this);
    }
  };
  BaseTab.prototype.fillFocusPreviewIfNeeded = function () {
    if (!this.enableFocusPreview() && !this.enableBackdropsOnFocus()) {
      return;
    }
    var elem = document.activeElement || document.body;
    if (this.view.contains(elem)) {
      var itemsContainer = elem.closest('.itemsContainer');
      if (itemsContainer && elem.matches(itemsContainer.getItemSelector())) {
        return;
      }
    }
    elem = this.view.querySelector('.card');
    if (elem) {
      var _itemsContainer = elem.closest('.itemsContainer');
      if (_itemsContainer) {
        fetchAndShowFocusPreview(this, elem);
      }
    }
  };
  BaseTab.prototype.getRequestedItemFields = function () {
    var fields = this.requestedItemFields;
    if (this.enableFocusPreview()) {
      fields += ',Overview,CommunityRating,CriticRating,OfficialRating,PremiereDate,ProductionYear,Container';
    }
    return fields;
  };
  BaseTab.prototype.getRequestedImageTypes = function () {
    var fields = 'Primary,Backdrop,Thumb';
    if (this.enableFocusPreview()) {
      fields += ',Logo';
    }
    return fields;
  };
  BaseTab.prototype.enableBackdropsOnFocus = function () {
    if (this.enableFocusPreview()) {
      return true;
    }
    return _appsettings.default.enableBackdrops();
  };
  BaseTab.prototype.addFocusBehavior = function (element) {
    this._enableBackdrops = _layoutmanager.default.tv && this.enableBackdropsOnFocus();
    if (this._enableBackdrops || this.enableFocusPreview()) {
      if (!this.boundonItemsContainerFocusIn) {
        this.boundonItemsContainerFocusIn = onItemsContainerFocusIn.bind(this);
      }
      if (!this.boundonItemsContainerFocusOut) {
        this.boundonItemsContainerFocusOut = onItemsContainerFocusOut.bind(this);
      }
      _dom.default.addEventListener(element, 'focus', this.boundonItemsContainerFocusIn, {
        capture: true,
        passive: true
      });
      _dom.default.addEventListener(element, 'focusout', this.boundonItemsContainerFocusOut, {
        passive: true
      });
    }
  };
  BaseTab.prototype.hasFocus = function () {
    var activeElement = document.activeElement;
    var view = this.view;
    return activeElement && view && view.contains(activeElement);
  };
  BaseTab.prototype.scrollToBeginning = function () {
    var scroller = this.scroller;
    if (scroller) {
      scroller.scrollToBeginning();
    }
  };
  BaseTab.prototype.loadTemplate = function () {
    return Promise.resolve();
  };
  function getScrollerNavOutDestination(direction) {
    if (direction === _focusmanager.default.directions.up) {
      return appHeader;
    }
    return null;
  }
  BaseTab.prototype.onTemplateLoaded = function () {
    findScroller(this);
    this.view.classList.add('focuscontainer-x');
    var focusContainerElem = this.getFocusContainerElement();
    if (focusContainerElem) {
      if (this.scrollDirection() !== 'x') {
        focusContainerElem.classList.add('focuscontainer-y', 'navout-up');
      }
      focusContainerElem.getNavOutDestination = getScrollerNavOutDestination;
    }
  };
  BaseTab.prototype.getFocusContainerElement = function () {
    return this.scroller;
  };
  BaseTab.prototype.getApiClient = function () {
    var _this$options2;
    if (this.apiClient) {
      return this.apiClient;
    }
    var serverId = this.params.serverId || ((_this$options2 = this.options) == null ? void 0 : _this$options2.serverId);
    return serverId ? _connectionmanager.default.getApiClient(serverId) : _connectionmanager.default.currentApiClient();
  };
  BaseTab.prototype.serverId = function () {
    var _this$apiClient, _this$options3, _connectionManager$cu;
    return ((_this$apiClient = this.apiClient) == null ? void 0 : _this$apiClient.serverId()) || this.params.serverId || ((_this$options3 = this.options) == null ? void 0 : _this$options3.serverId) || ((_connectionManager$cu = _connectionmanager.default.currentApiClient()) == null ? void 0 : _connectionManager$cu.serverId());
  };
  BaseTab.prototype.onBeginResume = function (options) {
    this.paused = false;
    var scroller = this.scroller;
    if (scroller && scroller.beginResume) {
      scroller.beginResume(options);
    }
  };
  BaseTab.prototype.onResume = function (options) {
    this.paused = false;
    var scroller = this.scroller;
    if (scroller && scroller.resume) {
      scroller.resume(options);
    }
    var enableFocusPreview = this.enableFocusPreview();
    if (enableFocusPreview || this._focusPreviewElement) {
      if (this.enablePushDownFocusPreview()) {
        this.scroller.setHeaderBindingEnabled(!enableFocusPreview);
        this.scroller.getScrollSlider().classList.remove('scrollSliderX-withfocusPreview');
        var paddedTopPage = this.scroller.querySelector('.scrollSlider.padded-top-page') || this.scroller.querySelector('.padded-top-page');
        if (enableFocusPreview) {
          this.scroller.classList.add('tab-scroller-withfocuspreview');
          if (paddedTopPage) {
            paddedTopPage.classList.add('tab-scroller-withfocuspreview-padded-top-page');
          }
          backgroundContainer.classList.add('backgroundContainer-withfocuspreview');
          backdropContainer.classList.add('backdropContainer-withfocuspreview');
          if (document.dir === 'rtl') {
            backdropContainer.classList.add('backdropContainer-withfocuspreview-rtl');
          } else {
            backdropContainer.classList.remove('backdropContainer-withfocuspreview-rtl');
          }
          appHeader.classList.add('appHeader-withfocuspreview');

          // adaptive doesn't work well with this
          this.scroller.setFocusScroll('center');
        } else {
          this.scroller.classList.remove('tab-scroller-withfocuspreview');
          if (paddedTopPage) {
            paddedTopPage.classList.remove('tab-scroller-withfocuspreview-padded-top-page');
          }
          backgroundContainer.classList.remove('backgroundContainer-withfocuspreview');
          backdropContainer.classList.remove('backdropContainer-withfocuspreview', 'backdropContainer-withfocuspreview-rtl');
          appHeader.classList.remove('appHeader-withfocuspreview');
        }
      } else if (enableFocusPreview) {
        if (this.scrollDirection() === 'x') {
          var _this$scroller;
          (_this$scroller = this.scroller) == null || _this$scroller.getScrollSlider().classList.add('scrollSliderX-withfocusPreview');
        } else {
          var _this$scroller2;
          (_this$scroller2 = this.scroller) == null || _this$scroller2.getScrollSlider().classList.remove('scrollSliderX-withfocusPreview');
        }
      }
      if (!enableFocusPreview && this._focusPreviewElement) {
        this.showFocusPreview(null);
      }
    }
  };
  BaseTab.prototype.onPause = function () {
    this.paused = true;
    var scroller = this.scroller;
    if (scroller && scroller.pause) {
      scroller.pause();
    }
    clearSelectedInfoTimer(this);
    var enableFocusPreview = this.enableFocusPreview();
    if (enableFocusPreview || this._focusPreviewElement) {
      if (this._focusPreviewElement) {
        this.showFocusPreview(null);
      }
      if (this.enablePushDownFocusPreview()) {
        backgroundContainer.classList.remove('backgroundContainer-withfocuspreview');
        backdropContainer.classList.remove('backdropContainer-withfocuspreview', 'backdropContainer-withfocuspreview-rtl');
        appHeader.classList.remove('appHeader-withfocuspreview');
      }
    }
  };
  BaseTab.prototype.destroy = function () {
    this.paused = null;
    this.scroller = null;
    this.view = null;
    this.params = null;
    this.options = null;

    // not used here but many tabs are
    this.apiClient = null;
    this._focusedElement = null;
    this._enableBackdrops = null;
    this._focusPreviewElement = null;
    clearSelectedInfoTimer(this);
  };
  var _default = _exports.default = BaseTab;
});
