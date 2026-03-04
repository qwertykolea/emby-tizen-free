define(["exports", "./../emby-apiclient/connectionmanager.js", "./../emby-apiclient/events.js", "./../common/textencoding.js", "./../common/globalize.js", "./../common/datetime.js", "./../common/itemmanager/itemmanager.js", "./../common/playback/playbackmanager.js", "./../common/appsettings.js", "./../dom.js", "./../browser.js", "./../focusmanager.js", "./../layoutmanager.js", "./../mediainfo/mediainfo.js", "./../common/dataformatter.js", "./../indicators/indicators.js", "./../shortcuts.js", "./../common/servicelocator.js", "./../common/imagehelper.js", "./../lazyloader/lazyimageloader.js", "./../emby-elements/userdatabuttons/emby-playstatebutton.js", "./../emby-elements/userdatabuttons/emby-ratingbutton.js", "./../emby-elements/sync/emby-downloadbutton.js", "./../emby-elements/emby-button/paper-icon-button-light.js", "./../common/usersettings/usersettings.js"], function (_exports, _connectionmanager, _events, _textencoding, _globalize, _datetime, _itemmanager, _playbackmanager, _appsettings, _dom, _browser, _focusmanager, _layoutmanager, _mediainfo, _dataformatter, _indicators, _shortcuts, _servicelocator, _imagehelper, _lazyimageloader, _embyPlaystatebutton, _embyRatingbutton, _embyDownloadbutton, _paperIconButtonLight, _usersettings) {
  Object.defineProperty(_exports, "__esModule", {
    value: true
  });
  _exports.default = void 0;
  /* jshint module: true */

  var SupportsCssAspectRatio = CSS.supports('aspect-ratio', '16 / 9');
  require(['cardStyle', 'programStyles']);
  var supportsAsyncDecodedImages = _dom.default.supportsAsyncDecodedImages();
  var decodingAttribute = supportsAsyncDecodedImages ? ' decoding="async"' : '';
  // in edge, cascading object-fit values are not overriding previous ones
  var supportsObjectFit = CSS.supports('object-fit', 'contain');
  var supportsCssVariables = CSS.supports('color', 'var(--fake-var)');
  var supportsCalc = CSS.supports('width', 'min(45.2%,calc(100% - .65em))');
  var supportsMin = CSS.supports('width', 'min(10em, 5vw)');
  var EnableFocusTransfrom = _dom.default.allowFocusScaling();
  var supportsNativeLazyLoading = 'loading' in HTMLImageElement.prototype;
  var SupportsContainerQueries = typeof CSS !== 'undefined' && CSS.supports('width', '1cqw');

  // cardbuilder doens't actually use position-try. It is only here to limit this to even newer environments.
  // earlier versions of Chrome that supported containery syntax had numerous rendering issues.
  var SupportsPositionTry = typeof CSS !== 'undefined' && CSS.supports('position-try-fallbacks: top');
  // limit to chrome. not rendering right in safari. columns are overlapping
  var SupportsHorizontalRenderingWithoutCardColumns = SupportsContainerQueries && SupportsPositionTry && _browser.default.chrome;
  var CurrentPlayingItemId;
  function onPlaybackStart(e, player, state) {
    var item = state.NowPlayingItem;
    var mediaType = item == null ? void 0 : item.MediaType;
    var itemId = mediaType === 'Audio' ? item.Id : null;
    CurrentPlayingItemId = itemId;
  }
  _events.default.on(_playbackmanager.default, 'playbackstart', onPlaybackStart);
  _events.default.on(_playbackmanager.default, 'statechange', onPlaybackStart);
  _events.default.on(_playbackmanager.default, 'playbackstop', function () {
    CurrentPlayingItemId = null;
  });
  var refreshIndicatorLoaded;
  function loadRefreshIndicator() {
    if (!refreshIndicatorLoaded) {
      refreshIndicatorLoaded = true;
      Emby.importModule('./modules/emby-elements/emby-itemrefreshindicator/emby-itemrefreshindicator.js');
    }
  }
  var embyCheckboxLoaded;
  function loadEmbyCheckbox() {
    if (!embyCheckboxLoaded) {
      embyCheckboxLoaded = true;
      Emby.importModule('./modules/emby-elements/emby-checkbox/emby-checkbox.js');
    }
  }
  function getItemsHtml(items, options) {
    if (arguments.length === 1) {
      options = arguments[0];
      items = options.items;
    }
    return buildCardsHtmlInternal(items, options);
  }
  var cachedWidths = {};
  function getImageWidth(shape, cardClass, cardBoxClass, cardContentClass, options, screenWidth) {
    // just to ensure the key is unique with this
    if (options.sideFooter) {
      cardClass += ' withsidefooter';
    }
    if (options.imageWidthTestClass) {
      cardClass += ' ' + options.imageWidthTestClass;
    }
    var cardSize = options.cardSize;
    var key = cardClass + screenWidth + cardSize;
    switch (cardSize) {
      case '':
      case 'normal':
      case 'default':
        break;
      default:
        key += '-' + cardSize;
        break;
    }
    var isTVLayout = _layoutmanager.default.tv;
    if (isTVLayout) {
      key += '-tv';
    }
    var width = cachedWidths[key];
    if (width) {
      return width;
    }
    console.log('getImageWidth: ' + key);
    var card = document.createElement('div');
    card.className = cardClass + ' imageSizeTestCard';
    if (options.sideFooter) {
      card.innerHTML = '<div class="' + cardBoxClass + '"><div class="' + cardContentClass + '"></div></div>';
    } else {
      card.innerHTML = '<div class="' + cardBoxClass + ' cardScalable"></div>';
    }
    var elemToRemove;
    if (options.useItemsContainerForImageSize && options.itemsContainer) {
      card.style.position = 'absolute';
      card.style.visibility = 'hidden';
      options.itemsContainer.appendChild(card);
      elemToRemove = card;

      //console.log(card.outerHTML);
    } else {
      var tempDiv = document.createElement('div');
      var itemsContainerClass = 'itemsContainer padded-left padded-right';
      tempDiv.className = itemsContainerClass;
      if (options.cardSize) {
        setUserPreferredSize(tempDiv, options.cardSize);
      }
      tempDiv.style.visibility = 'hidden';
      tempDiv.appendChild(card);
      elemToRemove = tempDiv;
      document.body.appendChild(tempDiv);
    }
    if (options.sideFooter) {
      width = cachedWidths[key] = card.querySelector('.cardImageContainer').offsetWidth || 400;
    } else {
      width = cachedWidths[key] = card.querySelector('.cardScalable').offsetWidth || 400;
    }
    elemToRemove.remove();
    console.log('card width: ' + width + ' - ' + key);
    return width;
  }
  function isResizable(windowWidth) {
    var screen = window.screen;
    if (screen) {
      var screenWidth = screen.availWidth;
      if (screenWidth - windowWidth > 20) {
        return true;
      }
    }
    return false;
  }
  function getTemplateLines(options) {
    var fieldMap = options.fieldMap;
    var lines = [];
    if (fieldMap.Name) {
      lines.push('');
    }
    if (fieldMap.ParentNameOrName) {
      lines.push('');
    }
    if (fieldMap.ProductionYear || fieldMap.OfficialRating || fieldMap.Runtime) {
      lines.push('');
    }
    if (fieldMap.CommunityRating || fieldMap.CriticRating) {
      // use visibility: hidden so that the tomato icon doesn't show for the template items
      lines.push('<div class="mediaInfoItems cardMediaInfoItems"><div class="mediaInfoItem mediaInfoCriticRating cardMediaInfoItem"><div class="mediaInfoCriticRatingImage mediaInfoCriticRatingFresh" style="visibility:hidden;"></div>91%</div></div>');
    }
    if (fieldMap.PersonRole) {
      lines.push('');
    }
    if (fieldMap.ChapterTime) {
      lines.push('');
    }
    if (fieldMap.ChapterWatching) {
      lines.push('');
    }
    if (fieldMap.ChannelName) {
      lines.push('');
    }
    if (fieldMap.LastServerAddress) {
      lines.push('');
    }
    if (fieldMap.Tagline) {
      lines.push(getTaglineText(''));
    }
    if (fieldMap.Overview) {
      lines.push(getOverviewText(''));
    }
    if (fieldMap.MediaInfo) {
      lines.push('');
    }
    if (fieldMap.Album) {
      lines.push('');
    }
    if (fieldMap.Director) {
      lines.push('');
    }
    if (fieldMap.Type) {
      lines.push('');
    }
    if (fieldMap.LastActivityDateRelative) {
      lines.push('');
    }
    if (fieldMap.DateCreated) {
      lines.push('');
    }
    if (fieldMap.DateModified) {
      lines.push('');
    }
    if (fieldMap.DatePlayed) {
      lines.push('');
    }
    if (fieldMap.Version) {
      lines.push('');
    }
    if (fieldMap.Url) {
      lines.push('');
    }
    if (fieldMap.InstalledVersion) {
      lines.push('');
    }
    if (fieldMap.ItemImageName) {
      lines.push('');
    }
    if (fieldMap.Filename) {
      lines.push('');
    }
    if (fieldMap.FilenameOrName) {
      lines.push('');
    }
    if (fieldMap.Size || fieldMap.Container || fieldMap.Bitrate) {
      lines.push('');
    }
    if (fieldMap.VideoCodec) {
      lines.push('');
    }
    if (fieldMap.AudioCodec) {
      lines.push('');
    }
    if (fieldMap.Resolution || fieldMap.Framerate) {
      lines.push('');
    }
    if (fieldMap.ParentName) {
      lines.push('');
    }
    if (fieldMap.CollectionType) {
      lines.push('');
    }
    if (fieldMap.LibraryFolders) {
      lines.push('');
    }
    if (fieldMap.AppNameVersion) {
      lines.push('');
    }
    if (fieldMap.AppName) {
      lines.push('');
    }
    if (fieldMap.DeviceUserInfo) {
      lines.push('');
    }
    if (fieldMap.CurrentProgramTime) {
      lines.push('');
    }
    if (fieldMap.CurrentProgramParentName) {
      lines.push('');
    }
    if (fieldMap.CurrentProgramParentNameOrName) {
      lines.push('');
    }
    if (fieldMap.CurrentProgramName) {
      lines.push('');
    }
    if (fieldMap.SeriesTimerChannel) {
      lines.push('');
    }
    if (fieldMap.SeriesTimerTime) {
      lines.push('');
    }
    if (fieldMap.ImageEditorStandardButtons) {
      lines.push('');
    }
    if (fieldMap.ImageEditorBackdropButtons) {
      lines.push('');
    }
    if (fieldMap.IpAddress) {
      lines.push('');
    }
    if (fieldMap.TunerName) {
      lines.push('');
    }
    if (fieldMap.Genres) {
      lines.push('');
    }
    if (fieldMap.Tags) {
      lines.push('');
    }
    if (fieldMap.Studios) {
      lines.push('');
    }
    if (fieldMap.SessionNowPlayingInfo) {
      lines.push('');
      lines.push('');
      lines.push('');
    }
    if (fieldMap.AirTime) {
      lines.push('');
    }
    if (fieldMap.AccessToken) {
      lines.push('');
    }
    if (fieldMap.DownloadableImageInfo) {
      lines.push('');
      lines.push('');
    }
    return lines;
  }
  function getPlayAction(item, options) {
    if (item.IsFolder) {
      return 'resume';
    }
    if (item.MediaType === 'Photo') {
      return 'playallfromhere';
    }
    return options.playAction;
  }
  function setListOptions(items, options) {
    if (options.isBoundListItem == null) {
      options.isBoundListItem = true;
    }
    if (options.hideEpisodeSpoilerInfo == null) {
      options.hideEpisodeSpoilerInfo = _usersettings.default.hideEpisodeSpoilerInfo();
    }
    options.rtl = document.dir === 'rtl';
    options.loadingLazyAttribute = ' loading="lazy"';
    if (!options.cardSize || options.cardSize === 'default') {
      options.cardSize = _appsettings.default.cardSize();
    }
    options.itemSelector = '.card';
    if (!options.playAction) {
      options.playAction = options.action === 'playallfromhere' ? 'playallfromhere' : 'play';
    }
    options.imageFallback = options.imageFallback !== false;
    var shape = options.shape || "auto";
    if (options.sideFooter) {
      shape = 'banner';
      options.textLinks = false;
    }
    if (!options.fields) {
      options.fields = [];
    }
    var fieldMap = {};
    var i, length;
    for (i = 0, length = options.fields.length; i < length; i++) {
      fieldMap[options.fields[i]] = true;
    }
    options.fieldMap = fieldMap;
    options.fieldMapWithForceName = Object.assign(Object.assign({}, fieldMap), {
      ParentNameOrName: true
    });
    var templateLines = getTemplateLines(options);
    if (!options.lines && !options.overlayText) {
      options.lines = templateLines.length;
    }
    var autoShape = shape === 'auto' || shape === 'autooverflow';
    if (autoShape) {
      shape = _imagehelper.default.getShape(items, options);
    }
    var imageShape = shape;
    if (options.sideFooter) {
      imageShape = 'square';
    }
    if (options.preferThumb === 'auto') {
      if (imageShape === 'square') {
        options.preferThumb = null;
      } else {
        options.preferThumb = imageShape === 'backdrop' || imageShape === 'fourThree';
      }
    }
    if (options.preferThumb === true && autoShape) {
      imageShape = 'backdrop';
      if (!options.sideFooter) {
        shape = 'backdrop';
      }
    }
    if (options.preferLogo === true && autoShape) {
      imageShape = 'backdrop';
      if (!options.sideFooter) {
        shape = 'backdrop';
      }
    }
    options.uiAspect = _imagehelper.default.getAspectFromShape(imageShape, options).aspect;
    if (!options.width && options.widths) {
      options.width = options.widths[imageShape];
    }
    if (options.horizontalGrid && !SupportsHorizontalRenderingWithoutCardColumns) {
      // not used with virtual scrolling
      options.rows = {
        portrait: 2,
        square: 3,
        backdrop: 3,
        fourThree: 3,
        banner: 3
      };
    }
    if (options.rows && typeof options.rowCount !== 'number') {
      if (options.smallSideFooter) {
        options.rowCount = 5;
      } else {
        options.rowCount = options.rows[imageShape];
      }
    }
    var className = 'card';
    if (shape) {
      className += ' ' + shape + 'Card';
    }
    if (options.horizontal) {
      className += ' card-horiz ' + shape + 'Card-horiz';
    }
    if (options.horizontalGrid) {
      className += ' ' + shape + 'Card-xGrid';
      if (!options.isVirtualList) {
        className += ' staticCard-xGrid';
      }
    }
    if (options.cardClass) {
      className += " " + options.cardClass;
    }
    if (options.autoWidth) {
      className += ' autoWidthCard';
    }
    var isLayoutTV = _layoutmanager.default.tv;
    if (!isLayoutTV) {
      className += ' card-hoverable';
    }
    options.enableFocusScaling = options.enableFocusScaling !== false && isLayoutTV && EnableFocusTransfrom;

    // to use this in non-tv mode, we'll need to work out touchzoom and the overlay position
    // when we're not rendering with a virtual list, the aspect ratio is wrong
    options.enableCardBox = options.enableFocusScaling || options.cardLayout || options.sideFooter || !isLayoutTV || !options.isVirtualList;
    options.hoverMenu = !_layoutmanager.default.tv && options.hoverMenu !== false;
    var isSingleClickElement = isLayoutTV && !options.staticElement || options.hoverMenu === false && options.action !== 'none';
    if (options.enableFocusScaling) {
      className += ' card-focustransform';
    }
    if (options.sideFooter) {
      className += ' sideFooterCard';
      if (options.horizontal) {
        className += ' sideFooterCard-horiz';
      }
    }
    if (options.smallSideFooter) {
      className += ' smallSideFooterCard';
      if (options.horizontal) {
        className += ' smallSideFooterCard-horiz';
      }
    }
    options.contextMenu = options.contextMenu !== false;
    var tagName;
    if (isSingleClickElement) {
      tagName = 'button';
      className += " itemAction card-itemAction";
      if (options.contextMenu) {
        className += " longpress";
      }
    } else {
      tagName = 'div';
      if (!options.staticElement) {
        //className += " focusable";
        options.addTabIndex = true;
      }
    }
    if (options.reOrder == null) {
      options.reOrder = options.dragReorder && options.draggable;
    }
    if (isLayoutTV) {
      options.draggable = false;
      options.anyDraggable = options.draggable;
      options.dropTarget = false;
      options.dragReorder = false;
    } else {
      options.draggable = options.draggable !== false;
      options.anyDraggable = options.draggable;
      if (options.dragReorder && options.draggable) {
        className += ' drop-target ordered-drop-target-x';
      } else if (options.dropTarget) {
        className += ' drop-target full-drop-target';
      }
    }
    var lineContents = [];
    if (options.lines) {
      lineContents.length = options.lines;
    }
    for (i = 0, length = lineContents.length; i < length; i++) {
      lineContents[i] = templateLines[i] || '&nbsp;';
    }
    var cardBoxClass = ((options.cardBoxClass || '') + ' cardBox').trim();
    var cardContentClass = ((options.cardContentClass || '') + ' cardContent cardImageContainer').trim();
    var cardImageClass = ((options.cardImageClass || '') + ' cardImage').trim();
    if (options.sideFooter) {
      cardBoxClass += ' cardBox-sideFooter';
      if (isLayoutTV) {
        cardBoxClass += ' cardBox-sideFooter-f';
        cardContentClass += ' cardContent-sideFooter-f';
      }
      if (options.centerText !== true) {
        options.centerText = false;
      }
    }
    if (options.autoWidth) {
      cardBoxClass += ' autoWidthCardBox';
    }
    if (options.horizontalGrid) {
      cardBoxClass += ' cardBox-horizontalgrid';
    }
    if (options.centerText == null) {
      options.centerText = !options.overlayText /*&& !options.fields.includes('Genres') && !options.fields.includes('Tags') && !options.fields.includes('Studios')*/;
    }
    options.cardTextCssClass = ((options.cardTextCssClass || '') + ' cardText').trim();
    if (!options.centerText) {
      options.cardTextCssClass += ' text-align-start';
    }
    var cardTextFirstClass = 'cardText-first';
    if (!options.sideFooter) {
      cardTextFirstClass += ' cardText-first-padded';
    }
    options.cardTextFirstClass = cardTextFirstClass;
    var lines = lineContents.length ? getCardTextLines({}, lineContents, options.cardTextCssClass, !options.overlayText, true, lineContents.length, options) : '';
    var cardDefaultTextClass = ((options.cardDefaultTextClass || '') + ' cardText cardDefaultText').trim();
    options.cardDefaultTextClass = cardDefaultTextClass;
    if (options.cardLayout || options.sideFooter) {
      cardBoxClass += ' visualCardBox';
      cardContentClass += ' cardContent-nobr';
      if (options.vibrant) {
        cardBoxClass += ' visualCardBox-vibrant';
        if (options.vibrantMode === 'large') {
          cardBoxClass += ' visualCardBox-vibrant-lg';
        }
      }
    }
    if (isLayoutTV) {
      if (options.enableFocusScaling) {
        cardBoxClass += ' cardBox-focustransform';
        if (options.focusTransformTitleAdjust) {
          if (shape === 'portrait' || shape === 'square' || shape === 'fourThree') {
            cardBoxClass += ' cardBox-focustransform-titleadjust';
          }
        }
      }
    }
    if (!isSingleClickElement) {
      if (options.moreButton !== false && !options.staticElement) {
        cardBoxClass += ' cardBox-touchzoom';
        if (!_browser.default.iOS && !_browser.default.osx) {
          className += ' card-autoactive';
        }
      }
    }
    if (lineContents.length && !options.overlayText && !options.cardLayout && !options.sideFooter && options.allowBottomPadding !== false && !options.horizontal) {
      if (options.enableCardBox) {
        cardBoxClass += ' cardBox-bottompadded';
      } else {
        className += ' card-bottompadded';
      }
    }
    if (!options.enableCardBox) {
      className += ' card-padded';
    }
    var cardPadderClass = [];
    if (!options.sideFooter) {
      cardPadderClass.push('cardPadder-' + shape);
    }

    // TODO: handle dupes
    if (options.cardPadderClass) {
      cardPadderClass.push(options.cardPadderClass);
    }
    var innerCardFooterClass = ['innerCardFooter'];

    // TODO: handle dupes
    if (options.innerCardFooterClass) {
      innerCardFooterClass.push(options.innerCardFooterClass);
    }
    options.round = options.round && shape === 'square';
    if (!options.cardLayout && !options.sideFooter) {
      cardContentClass += ' cardContent-background';
      if (options.background === 'black') {
        cardContentClass += ' cardContent-bg-black';
      }
    }
    if (options.preferLogo && options.paddedImage == null) {
      options.paddedImage = true;
    }
    if (options.paddedImage) {
      cardContentClass += ' paddedImage';
    }
    if (options.defaultBackground && !options.cardLayout) {
      cardContentClass += ' defaultCardBackground';
    }
    if (options.imageClass) {
      cardContentClass += ' ' + options.imageClass;
    }
    if (options.sideFooter) {
      cardContentClass += ' cardImageContainer-sideFooter';
      if (options.smallSideFooter) {
        cardContentClass += ' cardImageContainer-smallSideFooter';
      }
    }
    if (options.round) {
      cardContentClass += ' cardContent-round';
    }
    if (!options.enableFocusScaling && !options.sideFooter) {
      if (isSingleClickElement || options.action === 'none') {
        // cardContent is a div
        if (isLayoutTV) {
          if (options.cardLayout) {
            cardBoxClass += ' cardContent-bxsborder';
          } else {
            cardContentClass += ' cardContent-bxsborder';
          }
          cardImageClass += ' cardImage-bxsborder';
        } else {
          cardContentClass += ' cardContent-bxsborder-fv';
          cardImageClass += ' cardImage-bxsborder-fv';
        }
      } else {
        // cardContent is a button

        if (isLayoutTV) {
          if (options.cardLayout) {
            cardBoxClass += ' cardContent-bxsborder';
          } else {
            cardContentClass += ' cardContent-bxsborder';
          }
          cardImageClass += ' cardImage-bxsborder';
        } else {
          cardContentClass += ' cardContent-bxsborder-fv';
          cardImageClass += ' cardImage-bxsborder-fv';
        }
      }
    }
    options.cardImageClass = cardImageClass;
    if (!options.width) {
      var screenWidth = _dom.default.getWindowSize().innerWidth;
      options.width = getImageWidth(imageShape, className, cardBoxClass, cardContentClass, options, screenWidth);
      if (isResizable(screenWidth)) {
        var roundTo = 50;
        options.width = Math.ceil(options.width / roundTo) * roundTo;
      }
    }
    var innerHTML = options.enableCardBox ? '<div class="' + cardBoxClass + '">' : '';
    cardPadderClass = cardPadderClass.join(' ');
    innerCardFooterClass = innerCardFooterClass.join(' ');
    if (isSingleClickElement || options.action === 'none') {
      innerHTML += '<div class="' + cardContentClass + ' ' + cardPadderClass + '"></div>';
    } else {
      innerHTML += '<button type="button" tabindex="-1" class="cardContent-button ' + cardContentClass + ' ' + cardPadderClass + '"></button>';
    }
    var outerFooterClass = 'cardFooter';
    if (options.vibrant) {
      outerFooterClass += ' cardFooter-vibrant';
    }
    options.outerFooterClass = outerFooterClass;
    if (options.cardLayout) {
      innerHTML += '<div class="' + outerFooterClass + '">';
    }
    innerHTML += lines;
    if (options.cardLayout) {
      innerHTML += '</div>';
    }
    if (options.enableCardBox) {
      innerHTML += '</div>';
    }
    if (options.defaultIcon == null) {
      if (options.sideFooter || options.lines || fieldMap.Name) {
        options.defaultIcon = true;
      } else {
        options.defaultIcon = false;
      }
    }
    options.moreTitle = _globalize.default.translate('More');
    options.multiSelectTitle = _globalize.default.translate('MultiSelect');
    options.multiSelect = options.multiSelect !== false && !isLayoutTV;
    if (options.multiSelect) {
      loadEmbyCheckbox();
    }
    options.enableUserData = options.enableUserData !== false;
    var fixedAttributes = '';
    if (options.addTabIndex) {
      fixedAttributes += ' tabindex="0"';
    }
    if (options.anyDraggable) {
      fixedAttributes += ' draggable="true"';
    }
    if (tagName === 'button') {
      fixedAttributes += ' type="button"';
    }
    options.fixedAttributes = fixedAttributes.trim();
    options.templateInnerHTML = innerHTML;
    options.cardPadderClass = cardPadderClass;
    options.innerCardFooterClass = innerCardFooterClass;
    options.tagName = tagName;
    options.shape = shape;
    options.imageShape = imageShape;
    options.className = className;
    options.isSingleClickElement = isSingleClickElement;
    options.cardContentClass = cardContentClass;
    options.cardBoxClass = cardBoxClass;
  }
  function buildCardsHtmlInternal(items, options) {
    setListOptions(items, options);
    var html = '';
    var itemsInRow = 0;
    var hasOpenRow;
    var rows = options.rowCount;
    for (var i = 0, length = items.length; i < length; i++) {
      var item = items[i];
      if (rows && itemsInRow === 0) {
        if (hasOpenRow) {
          html += '</div>';
          hasOpenRow = false;
        }
        html += '<div class="cardColumn">';
        hasOpenRow = true;
      }
      html += getCardHtml(item, i, options);
      itemsInRow++;
      if (rows && itemsInRow >= rows) {
        html += '</div>';
        hasOpenRow = false;
        itemsInRow = 0;
      }
    }
    if (hasOpenRow) {
      html += '</div>';
    }
    return html;
  }
  function getCardTextLines(item, lines, cssClass, forceLines, isOuterFooter, maxLines, options) {
    var html = '';
    var valid = 0;
    var i, length;
    if (!isOuterFooter) {
      cssClass += ' innerFooter-cardText';
    }
    var currentCssClass = cssClass;
    for (i = 0, length = lines.length; i < length; i++) {
      currentCssClass = cssClass;
      var text = lines[i];
      if (text && text.html) {
        valid++;
        html += text.html;
        continue;
      }
      if (valid > 0 && isOuterFooter) {
        currentCssClass += ' cardText-secondary';
      } else if (valid === 0 && isOuterFooter) {
        currentCssClass += ' ' + options.cardTextFirstClass;
        if (options.playQueueIndicator !== false) {
          var currentPlayingItemId = CurrentPlayingItemId;
          if (currentPlayingItemId) {
            if (currentPlayingItemId === item.PlaylistItemId || currentPlayingItemId === item.Id) {
              if (_layoutmanager.default.tv && !_playbackmanager.default.paused()) {
                currentCssClass += ' itemelement-nowplaying cardText-nowplaying';
              }
            }
          }
        }
      }
      if (text) {
        html += '<div class="' + currentCssClass + '">';
        html += text;
        html += "</div>";
        valid++;
        if (maxLines && valid >= maxLines) {
          break;
        }
      }
    }
    if (forceLines) {
      length = maxLines || Math.min(lines.length, maxLines || lines.length);
      while (valid < length) {
        currentCssClass = cssClass;
        if (valid > 0 && isOuterFooter) {
          currentCssClass += ' cardText-secondary';
        } else if (valid === 0 && isOuterFooter) {
          currentCssClass += ' ' + options.cardTextFirstClass;
        }
        html += '<div class="' + currentCssClass + '">&nbsp;</div>';
        valid++;
      }
    }
    return html;
  }
  function isUsingLiveTvNaming(itemType) {
    return itemType === 'Program' || itemType === 'Timer' || itemType === 'Recording';
  }
  function getImageDownloadInfoFirstLine(item) {
    var text = '';
    var lang = item.DisplayLanguage || item.Language;
    if (item.Width && item.Height) {
      text += item.Width + 'x' + item.Height;
      if (lang) {
        text += ' - ' + lang;
      }
    } else {
      if (lang) {
        text += lang;
      }
    }
    return text;
  }
  function getImageDownloadInfoSecondLine(item) {
    var text;
    if (item.RatingType === "Likes") {
      text = item.CommunityRating === 1 ? _globalize.default.translate('OneLike') : _globalize.default.translate('LikeCountValue', item.CommunityRating);
    } else {
      if (item.CommunityRating) {
        text = _dataformatter.default.numberToString(item.CommunityRating, 1);
        if (item.VoteCount) {
          text += ' - ' + (item.VoteCount === 1 ? _globalize.default.translate('OneVote') : _globalize.default.translate('VoteCountValue', item.VoteCount));
        }
      } else {
        text = _globalize.default.translate('Unrated');
      }
    }
    return text;
  }
  function getImageEditorButtons(item, options) {
    var html = '';
    if (item.Providers.length) {
      var searchText = item.ImageTag ? _globalize.default.translate('HeaderSearchNewImage') : _globalize.default.translate('HeaderSearchForAnImage');
      html += '<button type="button" is="paper-icon-button-light" class="itemAction" data-action="searchimageproviders" title="' + searchText + '" aria-label="' + searchText + '"><i class="md-icon autortl">search</i></button>';
    }
    if (!item.ImageTag) {
      if (_servicelocator.appHost.supports('fileinput')) {
        html += '<button type="button" is="paper-icon-button-light" class="itemAction" data-action="addimage" title="' + _globalize.default.translate('HeaderSelectImageFile') + '" aria-label="' + _globalize.default.translate('HeaderSelectImageFile') + '"><i class="md-icon autortl">add_circle_outline</i></button>';
      }
    }
    if (item.ImageTag) {
      html += '<button type="button" is="paper-icon-button-light" class="itemAction" data-action="delete" title="' + _globalize.default.translate('Delete') + '" aria-label="' + _globalize.default.translate('Delete') + '"><i class="md-icon autortl">delete</i></button>';
    }
    return html;
  }
  function getImageEditorBackdropButtons(item, options) {
    var html = '';
    html += '<button type="button" is="paper-icon-button-light" class="itemAction" data-action="delete" title="' + _globalize.default.translate('Delete') + '" aria-label="' + _globalize.default.translate('Delete') + '"><i class="md-icon autortl">delete</i></button>';
    return html;
  }
  function addSessionNowPlayingInfo(lines, item) {
    var playstate = item.PlayState;
    var nowplayingItem = item.NowPlayingItem || {};
    lines.push(nowplayingItem.SeriesName || nowplayingItem.Name);
    if (nowplayingItem.Type === 'Episode') {
      lines.push(_itemmanager.default.getDisplayName(nowplayingItem, {
        includeParentInfo: true
      }));
    } else if (nowplayingItem.ArtistItems && nowplayingItem.ArtistItems.length) {
      lines.push(nowplayingItem.ArtistItems[0].Name);
    } else if (nowplayingItem.ProductionYear) {
      lines.push(nowplayingItem.ProductionYear);
    }
    if (nowplayingItem.RunTimeTicks) {
      lines.push(_datetime.default.getDisplayRunningTime(playstate.PositionTicks || 0) + ' / ' + _datetime.default.getDisplayRunningTime(nowplayingItem.RunTimeTicks));
    }
  }
  function getTaglineText(text) {
    var html = '<div class="cardText cardText-secondary cardText-tagline"><div class="cardText-tagline-text">';
    html += _textencoding.default.htmlEncode(text || '');
    html += '</div></div>';
    return {
      html: html
    };
  }
  function getOverviewText(text) {
    var html = '<div class="cardText cardText-secondary cardText-overview"><div class="cardText-overview-text">';
    html += _textencoding.default.htmlEncode(text || '');
    html += '</div></div>';
    return {
      html: html
    };
  }
  function getTextLinksLine(options, item, linkItems, linkItemType, limit) {
    linkItems = linkItems || [];
    var html = '';
    limit = Math.min(linkItems.length, limit);
    for (var i = 0, length = limit; i < length; i++) {
      var linkItem = linkItems[i];
      var text = linkItem.Name;
      if (i < limit - 1) {
        text += ',';
      }
      html += getTextActionButton(options, {
        Id: linkItem.Id,
        Name: linkItem.Name,
        ServerId: item.ServerId,
        Type: linkItemType
      }, text, item.ServerId, null, false);
    }
    return '<div class="cardTextLinksLine">' + html + '</div>';
  }
  function getPeopleTextLinksLine(options, item, people, personType, limit) {
    people = people.filter(function (i) {
      return i.Type === personType;
    });
    return getTextLinksLine(options, item, people, 'Person', limit);
  }
  function getCardFooterText(item, itemController, options, fieldMap, imgUrl, footerClass, progressHtml, logoUrl, isOuterFooter) {
    var itemType = item.Type;
    var html = '';
    if (logoUrl) {
      html += '<div class="lazy cardFooterLogo" loading="lazy" style="background-image:url(' + logoUrl + ');"></div>';
    }
    var lines = [];
    var parentTitleUnderneath;
    switch (itemType) {
      case 'MusicAlbum':
      case 'Audio':
      case 'MusicVideo':
      case 'Game':
      case 'Photo':
        parentTitleUnderneath = true;
        break;
      default:
        break;
    }
    var titleAdded;
    var serverId = item.ServerId || options.serverId;
    if (fieldMap.Album && options.albumFirst) {
      if (isOuterFooter && item.AlbumId && item.Album) {
        lines.push(getTextActionButton(options, {
          Id: item.AlbumId,
          ServerId: serverId,
          Name: item.Album,
          Type: 'MusicAlbum',
          IsFolder: true
        }));
      } else {
        lines.push(item.Album || '');
      }
    }
    if ((fieldMap.ParentName || fieldMap.ParentNameOrName) && !parentTitleUnderneath) {
      if (isOuterFooter && itemType === 'Episode' && item.SeriesName) {
        if (item.SeriesId) {
          lines.push(getTextActionButton(options, {
            Id: item.SeriesId,
            ServerId: serverId,
            Name: item.SeriesName,
            Type: 'Series',
            IsFolder: true
          }));
        } else {
          lines.push(_textencoding.default.htmlEncode(item.SeriesName));
        }
      } else {
        if (isUsingLiveTvNaming(itemType)) {
          var _item$ProgramInfo, _item$CurrentProgram;
          lines.push(_textencoding.default.htmlEncode(item.Name));
          var episodeTitle = item.EpisodeTitle || ((_item$ProgramInfo = item.ProgramInfo) == null ? void 0 : _item$ProgramInfo.EpisodeTitle) || ((_item$CurrentProgram = item.CurrentProgram) == null ? void 0 : _item$CurrentProgram.EpisodeTitle);
          if (!episodeTitle) {
            titleAdded = true;
          }
        } else {
          // for identify results, AlbumArtist is an object
          var parentTitle = item.SeriesName || item.Series || item.Album || (item.AlbumArtist ? item.AlbumArtist.Name || item.AlbumArtist : null) || item.GameSystem || "";
          if (parentTitle || fieldMap.Name) {
            lines.push(_textencoding.default.htmlEncode(parentTitle));
          }
        }
      }
    }
    var showMediaTitle = fieldMap.Name && !titleAdded || fieldMap.ParentNameOrName && !lines.length;
    if (!showMediaTitle && !titleAdded && fieldMap.Name) {
      showMediaTitle = true;
    }
    if (showMediaTitle) {
      var name = itemController.getDisplayName(item, {
        includeParentInfo: options.includeParentInfoInTitle,
        channelNumberFirst: options.channelNumberFirst,
        enableSpecialEpisodePrefix: options.enableSpecialEpisodePrefix,
        includeIndexNumber: options.includeIndexNumber,
        hideEpisodeSpoilerInfo: options.hideEpisodeSpoilerInfo
      });
      if (name) {
        if (isOuterFooter) {
          lines.push(getTextActionButton(options, item, name, serverId, options.parentId, true));
        } else {
          lines.push(_textencoding.default.htmlEncode(name));
        }
      }
    }
    if (fieldMap.Type) {
      lines.push(itemController.getItemTypeName(item));
    }
    if (fieldMap.ParentName && parentTitleUnderneath) {
      if (isOuterFooter && item.AlbumArtists && item.AlbumArtists.length && itemType === 'MusicAlbum') {
        item.AlbumArtists[0].Type = 'MusicArtist';
        item.AlbumArtists[0].IsFolder = true;
        lines.push(getTextActionButton(options, item.AlbumArtists[0], null, serverId));
      } else if (isOuterFooter && item.ArtistItems && item.ArtistItems.length) {
        item.ArtistItems[0].Type = 'MusicArtist';
        item.ArtistItems[0].IsFolder = true;
        lines.push(getTextActionButton(options, item.ArtistItems[0], null, serverId));
      } else if (isOuterFooter && item.AlbumArtists && item.AlbumArtists.length) {
        item.AlbumArtists[0].Type = 'MusicArtist';
        item.AlbumArtists[0].IsFolder = true;
        lines.push(getTextActionButton(options, item.AlbumArtists[0], null, serverId));
      } else if (isOuterFooter && item.GameSystem && item.GameSystemId) {
        lines.push(getTextActionButton(options, {
          Id: item.GameSystemId,
          ServerId: serverId,
          Name: item.GameSystem,
          Type: 'GameSystem',
          IsFolder: true
        }));
      } else {
        // for identify results, AlbumArtist is an object
        lines.push(_textencoding.default.htmlEncode(isUsingLiveTvNaming(itemType) ? item.Name : item.SeriesName || item.Series || item.Album || (item.AlbumArtist ? item.AlbumArtist.Name || item.AlbumArtist : null) || item.GameSystem || ""));
      }
    }
    if (options.textLines) {
      var additionalLines = options.textLines(item);
      for (var i = 0, length = additionalLines.length; i < length; i++) {
        lines.push(additionalLines[i]);
      }
    }
    if (fieldMap.ItemImageName) {
      if (item.ImageTag) {
        lines.push(item.Name);
      } else {
        lines.push('&nbsp;');
      }
    }
    if (fieldMap.Filename) {
      lines.push(item.FileName || item.Filename);
    }
    if (fieldMap.FilenameOrName) {
      lines.push(_textencoding.default.htmlEncode(item.FileName || item.Filename || item.Name || ''));
    }
    if (fieldMap.Album && !options.albumFirst) {
      if (isOuterFooter && item.AlbumId && item.Album) {
        lines.push(getTextActionButton(options, {
          Id: item.AlbumId,
          ServerId: serverId,
          Name: item.Album,
          Type: 'MusicAlbum',
          IsFolder: true
        }));
      } else {
        lines.push(item.Album || '');
      }
    }
    var showCommunityRating = fieldMap.CommunityRating;
    var showCriticRating = fieldMap.CriticRating;
    var emptyLines = [];
    if (showCommunityRating || showCriticRating) {
      var lineParts = [];
      if (showCommunityRating && item.CommunityRating) {
        lineParts.push(_mediainfo.default.getCommunityRating(item, {
          outerClass: 'cardMediaInfoItem'
        }));
      }
      if (showCriticRating && item.CriticRating) {
        lineParts.push(_mediainfo.default.getCriticRating(item, {
          outerClass: 'cardMediaInfoItem'
        }));
      }
      if (lineParts.length) {
        lines.push('<div class="mediaInfoItems cardMediaInfoItems">' + lineParts.join('') + '</div>');
      } else {
        // this is to ensure the same amount of vertical space isn't used so that the virtual scroller doens't get thrown off
        lineParts.push('&nbsp;');
        emptyLines.push('<div class="mediaInfoItems cardMediaInfoItems">' + lineParts.join('') + '</div>');
      }
    }
    var showYear = fieldMap.ProductionYear;
    var showParentalRating = fieldMap.OfficialRating;
    var showRuntime = fieldMap.Runtime;
    if (showYear || showParentalRating || showRuntime) {
      var _lineParts = [];
      if (showYear) {
        if (itemType === 'Series') {
          if (item.Status === "Continuing") {
            if (item.ProductionYear) {
              _lineParts.push(_globalize.default.translate('SeriesYearToPresent', item.ProductionYear || ''));
            }
          } else {
            var endYear = item.EndDate ? new Date(Date.parse(item.EndDate)).getFullYear() : null;
            if (endYear && item.ProductionYear && endYear !== item.ProductionYear) {
              _lineParts.push(item.ProductionYear + ' &ndash; ' + endYear);
            } else if (item.ProductionYear) {
              _lineParts.push(item.ProductionYear);
            }
          }
        } else if (item.ProductionYear) {
          _lineParts.push(item.ProductionYear);
        }
      }
      if (showRuntime) {
        if (item.RunTimeTicks) {
          _lineParts.push(_datetime.default.getHumanReadableRuntime(item.RunTimeTicks));
        }
      }
      if (showParentalRating && item.OfficialRating) {
        _lineParts.push(item.OfficialRating);
      }
      lines.push(_lineParts.join('&nbsp; '));
    }
    if (fieldMap.Director) {
      lines.push(getPeopleTextLinksLine(options, item, item.People || [], 'Director', 2));
    }
    if (fieldMap.Genres) {
      var _item$GenreItems;
      if ((_item$GenreItems = item.GenreItems) != null && _item$GenreItems.length) {
        var genreType;
        switch (itemType) {
          case 'Audio':
          case 'MusicAlbum':
          case 'MusicArtist':
          case 'MusicVideo':
            genreType = 'MusiGenre';
            break;
          case 'Game':
          case 'GameSystem':
            genreType = 'GameGenre';
            break;
          default:
            genreType = 'Genre';
            break;
        }
        lines.push(getTextLinksLine(options, item, item.GenreItems, genreType, 2));
      } else {
        // this is to ensure the same amount of vertical space isn't used so that the virtual scroller doens't get thrown off
        emptyLines.push('<div class="mediaInfoItems cardMediaInfoItems">&nbsp;</div>');
      }
    }
    if (fieldMap.Studios) {
      var _item$Studios;
      if ((_item$Studios = item.Studios) != null && _item$Studios.length) {
        lines.push(getTextLinksLine(options, item, item.Studios, 'Studio', 1));
      } else {
        // this is to ensure the same amount of vertical space isn't used so that the virtual scroller doens't get thrown off
        emptyLines.push('<div class="mediaInfoItems cardMediaInfoItems">&nbsp;</div>');
      }
    }
    if (fieldMap.Tags) {
      var _item$TagItems;
      if ((_item$TagItems = item.TagItems) != null && _item$TagItems.length) {
        lines.push(getTextLinksLine(options, item, item.TagItems, 'Tag', 2));
      } else {
        // this is to ensure the same amount of vertical space isn't used so that the virtual scroller doens't get thrown off
        emptyLines.push('<div class="mediaInfoItems cardMediaInfoItems">&nbsp;</div>');
      }
    }
    if (fieldMap.AirTime) {
      lines.push(_mediainfo.default.getAirTimeText(item, options.showAirDateTime, options.showAirEndTime) || '');
    }
    if (fieldMap.ChannelName) {
      if (item.ChannelId) {
        lines.push(getTextActionButton(options, {
          Id: item.ChannelId,
          ServerId: serverId,
          Name: item.ChannelName,
          ChannelNumber: item.ChannelNumber,
          Type: 'TvChannel',
          MediaType: item.MediaType,
          IsFolder: false
        }));
      } else {
        lines.push(item.ChannelName || '&nbsp;');
      }
    }
    if (fieldMap.CurrentProgramParentName) {
      var _item$CurrentProgram2;
      lines.push(((_item$CurrentProgram2 = item.CurrentProgram) == null ? void 0 : _item$CurrentProgram2.Name) || '');
    }
    if (fieldMap.CurrentProgramParentNameOrName) {
      var _item$CurrentProgram3;
      var _name = ((_item$CurrentProgram3 = item.CurrentProgram) == null ? void 0 : _item$CurrentProgram3.Name) || itemController.getDisplayName(item, {
        includeParentInfo: options.includeParentInfoInTitle,
        channelNumberFirst: options.channelNumberFirst,
        enableSpecialEpisodePrefix: options.enableSpecialEpisodePrefix,
        includeIndexNumber: options.includeIndexNumber
      });
      lines.push(_textencoding.default.htmlEncode(_name || ''));
    }
    if (fieldMap.CurrentProgramName) {
      var _item$CurrentProgram4;
      var _episodeTitle = item.EpisodeTitle || ((_item$CurrentProgram4 = item.CurrentProgram) == null ? void 0 : _item$CurrentProgram4.EpisodeTitle);
      lines.push(_episodeTitle || '');
    }
    if (fieldMap.CurrentProgramTime) {
      if (item.CurrentProgram) {
        lines.push(_mediainfo.default.getAirTimeText(item.CurrentProgram, false, true) || '');
      } else {
        lines.push('');
      }
    }
    if (fieldMap.SeriesTimerTime) {
      if (item.RecordAnyTime) {
        lines.push(_globalize.default.translate('Anytime'));
      } else if (item.StartDate) {
        lines.push(_datetime.default.getDisplayTime(item.StartDate));
      } else {
        lines.push('');
      }
    }
    if (fieldMap.SeriesTimerChannel) {
      var _item$ChannelIds, _item$ChannelIds2;
      if (item.RecordAnyChannel || !((_item$ChannelIds = item.ChannelIds) != null && _item$ChannelIds.length)) {
        lines.push(_globalize.default.translate('AllChannels'));
      } else if (((_item$ChannelIds2 = item.ChannelIds) == null ? void 0 : _item$ChannelIds2.length) > 1) {
        var _item$ChannelIds3;
        lines.push(_globalize.default.translate('NumberChannelsValue', (_item$ChannelIds3 = item.ChannelIds) == null ? void 0 : _item$ChannelIds3.length));
      } else {
        if (item.ChannelName) {
          lines.push(_itemmanager.default.getDisplayName({
            Id: item.ChannelId,
            ServerId: serverId,
            Name: item.ChannelName,
            ChannelNumber: item.ChannelNumber,
            Type: 'TvChannel',
            MediaType: item.MediaType,
            IsFolder: false
          }, {}));
        } else {
          lines.push(_globalize.default.translate('OneChannel'));
        }
      }
    }
    if (fieldMap.PersonRole) {
      if (item.Role) {
        // look for a translation in case the Role is something like Director https://emby.media/community/index.php?/topic/143511-issue-with-49-crew-scraping-and-localizations/
        lines.push(_globalize.default.translate(item.Role));
      } else if (item.PersonType) {
        lines.push(_globalize.default.translate(item.PersonType));
      } else {
        lines.push('');
      }
    }
    if (fieldMap.ChapterTime) {
      if (item.StartPositionTicks != null) {
        lines.push(_datetime.default.getDisplayRunningTime(item.StartPositionTicks));
      } else {
        lines.push('');
      }
    }
    if (fieldMap.ChapterWatching) {
      var currentTime = _playbackmanager.default.currentTime();
      var isWatching = currentTime >= item.StartPositionTicks && currentTime <= item.StartPositionTicks + (item.DurationTicks || 0);
      var cssClass = isWatching ? 'cardText-watching cardText-currentwatching' : 'cardText-watching';
      lines.push({
        html: '<div class="cardText cardText-secondary ' + cssClass + '">' + _globalize.default.translate('Watching') + '</div>'
      });
    }
    if (fieldMap.LastActivityDateRelative) {
      lines.push(itemController.resolveField(item, 'LastActivityDateRelative'));
    }
    if (fieldMap.AppName) {
      lines.push(itemController.resolveField(item, 'AppName'));
    }
    if (fieldMap.AccessToken) {
      lines.push(itemController.resolveField(item, 'AccessToken'));
    }
    if (fieldMap.DateCreated) {
      var val = item.DateCreated;
      var dateText = val ? _datetime.default.toLocaleDateString(new Date(Date.parse(val))) : null;
      switch (itemType) {
        case 'User':
        case 'ApiKey':
          lines.push(dateText ? _globalize.default.translate('CreatedOnValue', dateText) : '');
          break;
        default:
          lines.push(dateText ? _globalize.default.translate('AddedOnValue', dateText) : '');
          break;
      }
    }
    if (fieldMap.DatePlayed) {
      var _item$UserData;
      var _val = (_item$UserData = item.UserData) == null ? void 0 : _item$UserData.LastPlayedDate;
      var _dateText = _val ? _datetime.default.toLocaleDateString(new Date(Date.parse(_val))) : null;
      lines.push(_dateText ? _globalize.default.translate('PlayedOnValue', _dateText) : '');
    }
    if (fieldMap.Url) {
      lines.push(item.Url || '');
    }
    if (fieldMap.Version) {
      lines.push(_textencoding.default.htmlEncode(item.Version || ''));
    }
    if (fieldMap.CollectionType) {
      if (!item.Id) {
        // AddVirtualFolder
        lines.push('');
      } else {
        lines.push(_itemmanager.default.getContentTypeName(item.CollectionType));
      }
    }
    if (fieldMap.LibraryFolders) {
      if (!item.Locations || item.CollectionType === 'boxsets') {
        lines.push('');
      } else if (item.Locations.length === 1) {
        lines.push(item.Locations[0]);
      } else {
        lines.push(_globalize.default.translate('NumLocationsValue', item.Locations.length));
      }
    }
    if (fieldMap.AppNameVersion) {
      lines.push(itemController.resolveField(item, 'AppNameVersion'));
    }
    if (fieldMap.InstalledVersion) {
      if (item.InstalledVersion) {
        lines.push(_globalize.default.translate('LabelVersionInstalled', item.InstalledVersion));
      } else {
        lines.push('');
      }
    }
    if (fieldMap.InstalledVersion) {
      lines.push(_textencoding.default.htmlEncode(item.Version || ''));
    }
    if (fieldMap.MediaInfo) {
      lines.push({
        html: '<div class="cardText cardText-secondary mediaInfoItems cardText-mediaInfo">' + _mediainfo.default.getPrimaryMediaInfoHtml(item, {
          episodeTitle: false,
          subtitles: false,
          endsAt: false
        }) + '</div>'
      });
    }
    if (fieldMap.Tagline) {
      lines.push(getTaglineText(item.Taglines ? item.Taglines[0] : null));
    }
    if (fieldMap.Overview) {
      var _item$UserData2;
      if (options.hideEpisodeSpoilerInfo && itemType === 'Episode' && ((_item$UserData2 = item.UserData) == null ? void 0 : _item$UserData2.Played) === false) {
        lines.push(getOverviewText(null));
      } else {
        lines.push(getOverviewText(item.Overview));
      }
    }
    if (fieldMap.Container || fieldMap.Size || fieldMap.Bitrate) {
      var containerInfo = [];
      if (fieldMap.Container && item.Container) {
        containerInfo.push(item.Container.toUpperCase());
      }
      if (fieldMap.Size && item.Size) {
        var size = _dataformatter.default.sizeToString(item.Size);
        if (size) {
          containerInfo.push(size);
        }
      }
      if (fieldMap.Bitrate && item.Bitrate) {
        containerInfo.push(_dataformatter.default.bitrateToString(item.Bitrate));
      }
      lines.push(containerInfo.join('&nbsp; ') || '&nbsp;');
    }
    if (fieldMap.VideoCodec) {
      var _item$VideoCodec;
      lines.push(((_item$VideoCodec = item.VideoCodec) == null ? void 0 : _item$VideoCodec.toUpperCase()) || '&nbsp;');
    }
    if (fieldMap.Resolution || fieldMap.Framerate) {
      var _containerInfo = [];
      if (fieldMap.Resolution && item.Width && item.Height) {
        var text = _dataformatter.default.getResolutionText(item);
        if (text) {
          _containerInfo.push(text);
        }
      }
      if (fieldMap.Framerate) {
        var framerate = item.AverageFrameRate || item.RealFrameRate;
        if (framerate) {
          var _text = _dataformatter.default.numberToString(framerate, 3);
          if (_text) {
            _containerInfo.push(_text + 'fps');
          }
        }
      }
      lines.push(_containerInfo.join('&nbsp; ') || '&nbsp;');
    }
    if (fieldMap.AudioCodec) {
      var _item$AudioCodec;
      lines.push(((_item$AudioCodec = item.AudioCodec) == null ? void 0 : _item$AudioCodec.toUpperCase()) || '&nbsp;');
    }
    if (fieldMap.DownloadableImageInfo) {
      lines.push(getImageDownloadInfoFirstLine(item) || '');
      lines.push(getImageDownloadInfoSecondLine(item) || '');
    }
    if (fieldMap.DateModified) {
      var _val2 = item.DateModified;
      var _dateText2;
      switch (itemType) {
        case 'Log':
          _dateText2 = _val2 ? _datetime.default.toLocaleString(new Date(Date.parse(_val2))) : null;
          break;
        default:
          _dateText2 = _val2 ? _datetime.default.toLocaleDateString(new Date(Date.parse(_val2))) : null;
          break;
      }
      lines.push(_dateText2 ? _globalize.default.translate('UpdatedOnValue', _dateText2) : '');
    }
    if (fieldMap.DeviceUserInfo) {
      var deviceHtml = '';
      if (item.LastUserName) {
        if (item.LastUserId) {
          deviceHtml += getTextActionButton(options, {
            Id: item.LastUserId,
            Name: item.LastUserName,
            ServerId: serverId,
            Type: 'User'
          }, item.LastUserName + ', ' + _dataformatter.default.formatRelativeTime(item.DateLastActivity), null, null);
        } else if (item.LastUserName) {
          deviceHtml += item.LastUserName + ', ' + _dataformatter.default.formatRelativeTime(item.DateLastActivity);
        }
      }
      lines.push(deviceHtml);
    }
    if (fieldMap.IpAddress) {
      lines.push(item.IpAddress || '');
    }
    if (fieldMap.TunerName) {
      lines.push(item.TunerName || '');
    }
    if (fieldMap.MediaStreamInfo) {
      _mediainfo.default.pushMediaStreamLines(item, options, lines, itemController.getDefaultIcon(item));
    }
    if (fieldMap.ImageEditorStandardButtons) {
      lines.push(getImageEditorButtons(item, options));
    }
    if (fieldMap.ImageEditorBackdropButtons) {
      lines.push(getImageEditorBackdropButtons(item, options));
    }
    if (fieldMap.SessionNowPlayingInfo) {
      addSessionNowPlayingInfo(lines, item);
    }
    if (fieldMap.LastServerAddress) {
      if (item.Type === 'Server') {
        var apiClient = _connectionmanager.default.getApiClient(item);
        var lastAddress = (apiClient == null ? void 0 : apiClient.serverAddress()) || '';
        if (lastAddress) {
          lines.push(_globalize.default.translate('LastUsedAddressValue', lastAddress));
        } else {
          lines.push('');
        }
      } else {
        lines.push('');
      }
    }
    lines = lines.concat(emptyLines);
    html += getCardTextLines(item, lines, options.cardTextCssClass, isOuterFooter, isOuterFooter, options.lines, options);
    if (progressHtml) {
      html += progressHtml;
    }
    if (html) {
      if (!isOuterFooter || logoUrl || options.cardLayout) {
        html = '<div class="' + footerClass + '">' + html;

        //cardFooter
        html += "</div>";
      }
    }
    return html;
  }
  function getTextActionButton(options, item, text, serverId, parentId, isSameItemAsCard) {
    if (!text) {
      text = _itemmanager.default.getDisplayName(item, {
        hideEpisodeSpoilerInfo: options.hideEpisodeSpoilerInfo
      });
    }
    if (_layoutmanager.default.tv) {
      return _textencoding.default.htmlEncode(text);
    }

    // check Id for virtual items
    if (options.textLinks === false || !item.Id) {
      return _textencoding.default.htmlEncode(text);
    }
    text = _textencoding.default.htmlEncode(text);
    var dataAttributes;
    var action;
    if (isSameItemAsCard) {
      dataAttributes = '';
      action = options.linkButtonAction || options.action || 'link';
    } else {
      dataAttributes = _shortcuts.default.getShortcutAttributesHtml(item, {
        serverId: serverId,
        parentId: parentId,
        isBoundListItem: options.isBoundListItem && isSameItemAsCard
      });
      action = 'link';
    }
    var draggable = !options.anyDraggable || isSameItemAsCard ? '' : ' draggable="true"';
    var html = '<button tabindex="-1" title="' + text + '" ' + dataAttributes + ' type="button"' + draggable + ' class="cardMediaInfoItem itemAction textActionButton cardTextActionButton emby-button button-link" data-action="' + action + '">';
    html += text;
    html += '</button>';
    return html;
  }
  function getActiveSessionUserSectionHtml(item, apiClient) {
    var html = '';
    if (!item.UserId) {
      return html;
    }
    html += '<div class="cardSideFooter-bottomsection activeSession-bottomsection activeSession-usersection align-items-center justify-content-center itemAction" data-action="link" ' + _shortcuts.default.getShortcutAttributesHtml({
      Type: 'User',
      ServerId: item.ServerId,
      Id: item.UserId
    }, {}) + '>';
    var names = [];
    if (item.UserId) {
      names.push(item.UserName);
    }
    for (var i = 0, length = item.AdditionalUsers.length; i < length; i++) {
      names.push(item.AdditionalUsers[i].UserName);
    }
    var userImage = item.UserId && item.UserPrimaryImageTag ? apiClient.getUserImageUrl(item.UserId, {
      tag: item.UserPrimaryImageTag,
      height: 24,
      type: 'Primary'
    }) : null;
    if (userImage) {
      html += '<img draggable="false" loading="lazy"' + decodingAttribute + ' class="activeSessionUserImage" src="' + userImage + '" />';
    }
    html += '<div>' + names.join(', ') + '</div>';
    html += '</div>';
    return html;
  }
  function getActiveSessionVideoInfoHtml(item) {
    var html = '';
    var playstate = item.PlayState || {};
    var nowplayingItem = item.NowPlayingItem || {};
    var mediaStreams = nowplayingItem.MediaStreams || [];
    var videoStreamIndex = playstate.VideoStreamIndex;
    var transcodingInfo = item.TranscodingInfo || {};
    var mediaStream;
    for (var i = 0, length = mediaStreams.length; i < length; i++) {
      if (mediaStreams[i].Type === 'Video') {
        if (videoStreamIndex == null || videoStreamIndex === mediaStreams[i].Index) {
          mediaStream = mediaStreams[i];
          break;
        }
      }
    }
    if (!mediaStream) {
      return html;
    }
    html += '<div class="cardSideFooter-bottomsection activeSession-bottomsection">';
    html += '<div class="secondaryText activeSession-bottomsection-title">';
    html += _globalize.default.translate('Video');
    html += '</div>';
    html += '<div>';
    if (mediaStream.DisplayTitle) {
      html += '<div class="flex align-items-center flex-wrap-wrap">';
      html += _textencoding.default.htmlEncode(mediaStream.DisplayTitle);
      if (transcodingInfo.VideoDecoderHwAccel) {
        html += '<i class="md-icon activeSession-hwaccelIcon autortl" title="' + _globalize.default.translate('HeaderHardwareAcceleratedDecoding') + ' (' + (transcodingInfo.VideoDecoderHwAccel || _globalize.default.translate('Software')) + ')">&#xe30d;</i>';
      }
      html += '</div>';
    }
    html += '<div class="flex align-items-center flex-wrap-wrap">';
    html += '<i class="md-icon activeSessionStreamIcon autortl">&#xe941;</i>';
    if (transcodingInfo.IsVideoDirect === false) {
      html += _globalize.default.translate('Transcode');
      html += ' (';
      html += (transcodingInfo.VideoCodec || '').toUpperCase() + ' ';
      if (transcodingInfo.VideoBitrate) {
        html += _dataformatter.default.bitrateToString(transcodingInfo.VideoBitrate);
      }
      html += ')';
      if (transcodingInfo.VideoEncoderHwAccel) {
        html += '<i class="md-icon activeSession-hwaccelIcon autortl" title="' + _globalize.default.translate('HeaderHardwareAcceleratedEncoding') + ' (' + (transcodingInfo.VideoEncoderHwAccel || _globalize.default.translate('Software')) + ')">&#xe30d;</i>';
      }
    } else {
      html += _globalize.default.translate('HeaderDirectPlay');
    }
    html += '</div>';
    if (transcodingInfo.IsVideoDirect === false) {
      var pipeline = transcodingInfo.VideoPipelineInfo || [];
      for (var _i = 0, _length = pipeline.length; _i < _length; _i++) {
        var step = pipeline[_i];
        if (step.StepType === 'ToneMapping' || step.StepType === 'Deinterlace' || step.StepType === 'SubTitleBurnIn' || step.StepType === 'SubtitleOverlay') {
          html += '<div>';
          html += '<i class="md-icon activeSessionStreamIcon autortl">&#xe941;</i>';
          if (step.StepType === 'ToneMapping') {
            html += _globalize.default.translate('HeaderToneMapping');
          } else if (step.StepType === 'Deinterlace') {
            html += _globalize.default.translate('Deinterlacing');
          } else if (step.StepType === 'SubTitleBurnIn' || step.StepType === 'SubtitleOverlay') {
            html += _globalize.default.translate('HeaderBurningInSubtitles');
          }
          var extra = [];
          if (step.ParamShort) {
            extra.push(step.ParamShort);
          } else if (step.Param) {
            if (step.Param !== 'Subtitles') {
              extra.push(step.Param);
            }
          } else if (step.FfmpegOptions) {
            extra.push(step.FfmpegOptions);
          }
          if (extra.length) {
            html += ' <span class="secondaryText">(' + extra.join(' ') + ')</span>';
          }
          html += '</div>';
        }
      }
    }
    html += '</div>';
    html += '</div>';
    return html;
  }
  function getActiveSessionAudioInfoHtml(item) {
    var html = '';
    var playstate = item.PlayState || {};
    var nowplayingItem = item.NowPlayingItem || {};
    var mediaStreams = nowplayingItem.MediaStreams || [];
    var audioStreamIndex = playstate.AudioStreamIndex;
    var transcodingInfo = item.TranscodingInfo || {};
    var mediaStream;
    for (var i = 0, length = mediaStreams.length; i < length; i++) {
      if (mediaStreams[i].Type === 'Audio') {
        if (audioStreamIndex == null || audioStreamIndex === mediaStreams[i].Index) {
          mediaStream = mediaStreams[i];
          break;
        }
      }
    }
    if (!mediaStream) {
      return html;
    }
    html += '<div class="cardSideFooter-bottomsection activeSession-bottomsection">';
    html += '<div class="secondaryText activeSession-bottomsection-title">';
    html += _globalize.default.translate('Audio');
    html += '</div>';
    html += '<div>';
    if (mediaStream.DisplayTitle) {
      html += '<div>';
      html += _textencoding.default.htmlEncode(mediaStream.DisplayTitle);
      html += '</div>';
    }
    html += '<div>';
    html += '<i class="md-icon activeSessionStreamIcon autortl">&#xe941;</i>';
    if (transcodingInfo.IsAudioDirect === false) {
      html += _globalize.default.translate('Transcode');
      html += ' (';
      html += (transcodingInfo.AudioCodec || '').toUpperCase() + ' ';
      if (transcodingInfo.AudioBitrate) {
        html += _dataformatter.default.bitrateToString(transcodingInfo.AudioBitrate);
      }
      html += ')';
    } else {
      html += _globalize.default.translate('HeaderDirectPlay');
    }
    html += '</div>';
    html += '</div>';
    html += '</div>';
    return html;
  }
  function getActiveSessionStreamInfoHtml(item) {
    var html = '';
    var playstate = item.PlayState || {};
    var nowplayingItem = item.NowPlayingItem || {};
    var transcodingInfo = item.TranscodingInfo || {};
    html += '<div class="cardSideFooter-bottomsection activeSession-bottomsection">';
    html += '<div class="secondaryText activeSession-bottomsection-title">';
    html += _globalize.default.translate('Stream');
    html += '</div>';
    html += '<div>';
    if (nowplayingItem.Container) {
      html += '<div>';
      html += nowplayingItem.Container.toUpperCase();
      if (nowplayingItem.Bitrate) {
        html += ' (' + _dataformatter.default.bitrateToString(nowplayingItem.Bitrate) + ')';
      }
      html += '</div>';
    }
    html += '<div>';
    html += '<i class="md-icon activeSessionStreamIcon autortl">&#xe941;</i>';
    if (playstate.PlayMethod === 'Transcode') {
      var transcodingInfoParts = [];
      if (transcodingInfo.SubProtocol && transcodingInfo.SubProtocol !== 'progressive') {
        transcodingInfoParts.push(transcodingInfo.SubProtocol.toUpperCase());
      } else if (transcodingInfo.Container) {
        transcodingInfoParts.push(transcodingInfo.Container.toUpperCase());
      }
      if (transcodingInfo.Bitrate) {
        var bitrateInfo = '(';
        if (transcodingInfo.Bitrate) {
          bitrateInfo += _dataformatter.default.bitrateToString(transcodingInfo.Bitrate);
        }
        if (transcodingInfo.Framerate) {
          bitrateInfo += ' ' + _dataformatter.default.numberToString(transcodingInfo.Framerate, 3) + ' fps';
        }
        bitrateInfo += ')';
        transcodingInfoParts.push(bitrateInfo);
      }
      if (transcodingInfo.CurrentThrottle) {
        transcodingInfoParts.push('<span class="secondaryText">Throttling</span>');
      }
      html += transcodingInfoParts.join(' ');
    } else {
      html += _globalize.default.translate('HeaderDirectPlay');
    }
    html += '</div>';
    var transcodeReasons = transcodingInfo.TranscodeReasons || [];
    for (var i = 0, length = transcodeReasons.length; i < length; i++) {
      html += '<div>';
      html += _globalize.default.translate(transcodeReasons[i]);
      html += '</div>';
    }
    html += '</div>';
    html += '</div>';
    return html;
  }
  function getActiveSessionDeviceInfoHtml(item, apiClient) {
    var html = '';
    var nowplayingItem = item.NowPlayingItem;
    if (!nowplayingItem) {
      return html;
    }
    html += '<div class="cardSideFooter-bottomsection activeSession-bottomsection activeSession-deviceSection itemAction" data-action="link" ' + _shortcuts.default.getShortcutAttributesHtml({
      Type: 'Device',
      ServerId: item.ServerId,
      Id: item.DeviceId
    }, {}) + '>';
    var imageUrl = item.AppIconUrl;
    var imgClass = 'secondaryText activeSession-deviceimage';
    if (imageUrl) {
      imgClass += ' activeSession-deviceimage-bg';
      var imageAspect = 1;
      var shape = _imagehelper.default.getShapeFromAspect(imageAspect);
      imgClass += ' activeSession-deviceimage-bg-' + shape;
      html += '<div class="' + imgClass + '" style="aspect-ratio:' + imageAspect + ';background-image:url(' + imageUrl + ');">';
      html += '</div>';
    } else {
      html += '<div class="' + imgClass + '">';
      html += '<i class="activeSession-deviceimage-icon md-icon autortl">';
      html += _itemmanager.default.getDefaultIcon(item);
      html += '</i>';
      html += '</div>';
    }
    html += '<div>';
    if (item.Client) {
      html += '<div>';
      html += _textencoding.default.htmlEncode(item.Client + ' ' + item.ApplicationVersion);
      html += '</div>';
    }
    if (item.DeviceName) {
      html += '<div class="secondaryText">';
      html += _textencoding.default.htmlEncode(item.DeviceName);
      html += '</div>';
    }
    if (item.RemoteEndPoint) {
      html += '<div class="secondaryText flex align-items-center">';
      html += item.RemoteEndPoint;
      var protocol = (item.Protocol || '').toLowerCase();
      if (protocol) {
        html += ' ' + protocol;
      }
      if (protocol.includes('https')) {
        html += '<i class="md-icon button-icon button-icon-right autortl" style="font-size:inherit;" title="HTTPS">https</i>';
      }
      html += '</div>';
    }
    html += '</div>';
    html += '</div>';
    return html;
  }
  function getActiveSessionCommandsSectionHtml(options, item) {
    var html = '';

    // check isSingleClickElement - can't put buttons inside of buttons
    if (options.isSingleClickElement || item.DeviceId === _connectionmanager.default.deviceId()) {
      return html;
    }
    if (item.ServerId && item.NowPlayingItem && item.SupportsRemoteControl) {
      var playPauseIcon = item.PlayState && item.PlayState.IsPaused ? '&#xe037;' : '&#xe034;';
      html += '<button is="paper-icon-button-light" class="sessionCardButton btnSessionPlayPause paper-icon-button-light md-icon md-icon-fill autortl itemAction" data-action="session_playpause">' + playPauseIcon + '</button>';
      html += '<button is="paper-icon-button-light" class="sessionCardButton btnSessionStop paper-icon-button-light md-icon md-icon-fill autortl itemAction" data-action="session_stop" title="' + _globalize.default.translate('Stop') + '" aria-label="' + _globalize.default.translate('Stop') + '">&#xe047;</button>';
    }
    if (item.ServerId && item.SupportedCommands.includes('DisplayMessage') && item.DeviceId !== _connectionmanager.default.deviceId()) {
      html += '<button is="paper-icon-button-light" class="sessionCardButton btnSessionSendMessage paper-icon-button-light md-icon autortl itemAction" data-action="session_sendmessage" title="' + _globalize.default.translate('SendMessage') + '" aria-label="' + _globalize.default.translate('SendMessage') + '">&#xe0b7;</button>';
    }
    if (html) {
      html = '<div class="cardSideFooter-bottomsection activeSession-bottomsection activeSession-commandsection align-items-center">' + html;
      html += '</div>';
    }
    return html;
  }
  function getActiveSessionFooterHtml(options, item, apiClient) {
    var html = '';
    html += '<div class="cardSideFooter-bottomsections activeSession-bottomsections">';
    html += getActiveSessionDeviceInfoHtml(item, apiClient);
    html += getActiveSessionStreamInfoHtml(item);
    html += getActiveSessionVideoInfoHtml(item);
    html += getActiveSessionAudioInfoHtml(item);
    //html += getActiveSessionSubtitleInfoHtml(item);
    html += getActiveSessionUserSectionHtml(item, apiClient);
    html += getActiveSessionCommandsSectionHtml(options, item);
    html += '</div>';
    return html;
  }
  function getProgramIndicators(item) {
    item = item.CurrentProgram || item;
    var html = '';
    if (item.IsLive) {
      html += '<div class="cardProgramIndicator liveTvProgram">' + _globalize.default.translate('Live') + '</div>';
    } else if (item.IsPremiere) {
      html += '<div class="cardProgramIndicator premiereTvProgram">' + _globalize.default.translate('Premiere') + '</div>';
    } else if (item.IsNew) {
      html += '<div class="cardProgramIndicator newTvProgram">' + _globalize.default.translate('New') + '</div>';
    }
    return html;
  }
  function getInnerFooterFieldMap(options, fieldMap, overlayText, forceName) {
    if (overlayText) {
      if (!forceName || fieldMap.Name || fieldMap.ParentNameOrName || fieldMap.ParentName) {
        return fieldMap;
      }
      return options.fieldMapWithForceName;
    }
    if (!forceName || fieldMap.Name || fieldMap.ParentNameOrName || fieldMap.ParentName) {
      return {};
    }
    return {
      ParentNameOrName: true
    };
  }
  function getAction(itemType, isFolder, options) {
    var action = options.action || 'link';
    switch (action) {
      case 'play':
        if (isFolder) {
          action = 'playallfromhere';
        }
        break;
      case 'none':
        break;
      default:
        {
          switch (itemType) {
            case 'Photo':
              action = 'playallfromhere';
              break;
            case 'AddServer':
            case 'EmbyConnect':
            case 'Downloads':
              action = 'link';
              break;
            default:
              break;
          }
          break;
        }
    }
    return action;
  }
  function getCardHtml(item, index, options) {
    var _item$Policy;
    var itemType = item.Type;
    var isPhoto = item.MediaType === 'Photo';
    var action = getAction(itemType, item.IsFolder, options);
    var shape = options.shape;
    var imageShape = options.imageShape;
    var isSingleClickElement = options.isSingleClickElement;
    var serverId = item.ServerId || options.serverId;
    var apiClient = serverId ? _connectionmanager.default.getApiClient(serverId) : null;
    var imageItem;
    if (options.showCurrentProgramImage) {
      imageItem = item.CurrentProgram || item;
    } else {
      if (itemType === 'ActiveSession') {
        imageItem = item.NowPlayingItem;
      } else {
        imageItem = item.ProgramInfo || item;
      }
    }
    var imgInfo;
    var vibrantImgInfo;
    if (options.image === false || !imageItem) {
      imgInfo = {};
    } else {
      imgInfo = _imagehelper.default.getImageUrl(imageItem, apiClient, options, imageShape);
      var blurImageOptions = options.vibrantMode === 'large' ? {
        width: 12,
        blur: 2,
        adjustForPixelRatio: false
      } : {
        width: 1,
        adjustForPixelRatio: false
      };
      vibrantImgInfo = options.vibrant ? _imagehelper.default.getImageUrl(imageItem, apiClient, blurImageOptions, imageShape) : null;
      if (!imgInfo.imgUrl && imageItem !== item) {
        imageItem = item;
        imgInfo = _imagehelper.default.getImageUrl(imageItem, apiClient, options, imageShape);
        vibrantImgInfo = options.vibrant ? _imagehelper.default.getImageUrl(imageItem, apiClient, blurImageOptions, imageShape) : null;
      }
    }
    var imgUrl = imgInfo.imgUrl;
    var vibrantImgUrl = vibrantImgInfo ? vibrantImgInfo.imgUrl : imgInfo.imgUrl;
    var forceName = imgInfo.forceName && !isPhoto;
    var overlayText = options.overlayText;
    var fieldMap = options.fieldMap;
    var cardContentClass = options.cardContentClass;
    var cardImageClass = options.cardImageClass;
    var coveredImageClass = options.coverImage === false ? null : _imagehelper.default.getCoveredImageClass(imageItem, apiClient, imgInfo, options.uiAspect, options.coverImage);

    // slideshow
    if (isPhoto && options.ignoreUIAspect) {
      coveredImageClass = ' coveredImage coveredImage-contain';
    }
    if (coveredImageClass) {
      cardContentClass += coveredImageClass;
      cardImageClass += coveredImageClass;
    }
    if (options.paddedImage) {
      cardImageClass += ' cardImage-padded';
    }
    if (item.Policy && item.Policy.IsDisabled) {
      cardContentClass += ' grayscaleImage';
    }
    if (!options.defaultBackground && !imgUrl && !options.cardLayout) {
      cardContentClass += ' defaultCardBackground';
    }
    var roundEligible = itemType === 'MusicArtist' && shape === 'square';
    var addRoundClasses = !options.round && roundEligible;
    if (addRoundClasses) {
      cardContentClass += ' cardContent-round';
    }
    if (options.playQueueIndicator !== false) {
      var currentPlayingItemId = CurrentPlayingItemId;
      if (currentPlayingItemId) {
        if (currentPlayingItemId === item.PlaylistItemId || currentPlayingItemId === item.Id) {
          if (!_layoutmanager.default.tv && !_playbackmanager.default.paused()) {
            cardContentClass += ' itemelement-nowplaying cardImageContainer-nowplaying';
          }
        }
      }
    }
    var cardBoxClass = options.cardBoxClass;
    if (options.playQueueIndicator && item.PlaylistItemId) {
      if ((_playbackmanager.default.currentItem() || {}).PlaylistItemId === item.PlaylistItemId) {
        cardBoxClass += ' activePlaylistCardBox';
      }
    }
    var footerCssClass;
    var progressHtml = options.progress === false ? null : _indicators.default.getProgressBarHtml(item, {
      containerClass: 'cardProgressBarContainer',
      animated: false //options.animateProgressBar
    });
    var innerCardFooter = '';
    var logoUrl;
    var logoHeight = 40;
    if (options.showChannelLogo && item.ChannelPrimaryImageTag) {
      logoUrl = apiClient.getImageUrl(item.ChannelId, {
        type: "Primary",
        height: logoHeight,
        tag: item.ChannelPrimaryImageTag
      });
    }
    if (options.programIndicators !== false) {
      if (itemType === 'Program' || itemType === 'Timer' || itemType === 'TvChannel') {
        progressHtml = getProgramIndicators(item) + (progressHtml || '');
      }
    }
    var itemController = _itemmanager.default.getItemController(itemType);
    if (overlayText || forceName) {
      logoUrl = null;
      footerCssClass = options.innerCardFooterClass;
      var innerFieldMap = getInnerFooterFieldMap(options, fieldMap, overlayText, forceName);
      innerCardFooter += getCardFooterText(item, itemController, options, innerFieldMap, imgUrl, footerCssClass, progressHtml, logoUrl, false);
      progressHtml = '';
    } else if (progressHtml) {
      innerCardFooter += '<div class="' + options.innerCardFooterClass + '">';
      innerCardFooter += progressHtml;
      innerCardFooter += '</div>';
      progressHtml = '';
    }
    var outerCardFooter = '';
    if (!overlayText) {
      footerCssClass = options.cardLayout ? options.outerFooterClass : 'cardFooter cardFooter-transparent';
      if (options.sideFooter) {
        footerCssClass += ' cardFooter-side';
      }
      if (logoUrl) {
        footerCssClass += ' cardFooter-withlogo';
      }
      if (options.vibrant && vibrantImgUrl) {
        if (options.vibrantMode !== 'large') {
          footerCssClass += ' darkContentContainer';
        }
      }
      if (!options.cardLayout) {
        logoUrl = null;
      }
      outerCardFooter = getCardFooterText(item, itemController, options, fieldMap, imgUrl, footerCssClass, progressHtml, logoUrl, true);
      if (options.sideFooter) {
        var cardFooterContentClass = 'cardFooterContent';
        if (!options.centerText) {
          cardFooterContentClass += ' cardFooterContent-start';
        }
        outerCardFooter = '<div class="' + cardFooterContentClass + ' itemAction" data-action="' + action + '">' + outerCardFooter + '</div>';
        if (itemType === 'ActiveSession') {
          outerCardFooter += getActiveSessionFooterHtml(options, item, apiClient);
        }
      }
    }

    // cardBox can be it's own separate element if an outer footer is ever needed
    var cardImageContainerOpen;
    var cardImageContainerClose = '';
    if (!options.sideFooter) {
      cardContentClass += ' ' + options.cardPadderClass;
    }

    // Don't use the IMG tag with safari because it puts a white border around it

    if (isSingleClickElement) {
      // Don't use the IMG tag with safari because it puts a white border around it
      if (imgUrl) {
        if (options.lazy === 2) {
          if (supportsObjectFit) {
            cardImageContainerOpen = '<div class="' + cardContentClass + '"><img draggable="false" alt=" " class="' + cardImageClass + '"' + options.loadingLazyAttribute + decodingAttribute + ' src="' + imgUrl + '" />';
          } else {
            cardImageContainerOpen = '<div class="' + cardContentClass + '" style="background-image:url(' + imgUrl + ');">';
          }
        } else if (supportsNativeLazyLoading) {
          cardImageContainerOpen = '<div class="' + cardContentClass + '"><img draggable="false" alt=" " class="' + cardImageClass + '" loading="lazy"' + decodingAttribute + ' src="' + imgUrl + '" />';
        } else {
          cardImageContainerOpen = '<div class="' + cardContentClass + ' lazy" style="background-image:url(' + imgUrl + ');">';
        }
      } else {
        cardImageContainerOpen = '<div class="' + cardContentClass + '">';
      }
      cardImageContainerClose = '</div>';
    } else {
      if (action === 'none') {
        if (imgUrl) {
          if (options.lazy === 2) {
            if (supportsObjectFit) {
              cardImageContainerOpen = '<div data-action="' + action + '" class="itemAction ' + cardContentClass + '"><img draggable="false" alt=" " class="' + cardImageClass + '"' + options.loadingLazyAttribute + decodingAttribute + ' src="' + imgUrl + '" />';
            } else {
              cardImageContainerOpen = '<div data-action="' + action + '" class="itemAction ' + cardContentClass + '" style="background-image:url(' + imgUrl + ');">';
            }
          } else if (supportsNativeLazyLoading) {
            cardImageContainerOpen = '<div data-action="' + action + '" class="itemAction ' + cardContentClass + '"><img draggable="false" alt=" " class="' + cardImageClass + '" loading="lazy"' + decodingAttribute + ' src="' + imgUrl + '" />';
          } else {
            cardImageContainerOpen = '<div data-action="' + action + '" class="itemAction lazy ' + cardContentClass + '" style="background-image:url(' + imgUrl + ');">';
          }
        } else {
          cardImageContainerOpen = '<div data-action="' + action + '" class="' + cardContentClass + ' itemAction">';
        }
        cardImageContainerClose = '</div>';
      } else {
        if (imgUrl) {
          if (options.lazy === 2) {
            if (supportsObjectFit) {
              cardImageContainerOpen = '<button type="button" data-action="' + action + '" tabindex="-1" class="itemAction cardContent-button ' + cardContentClass + '"><img draggable="false" alt=" " class="' + cardImageClass + '"' + options.loadingLazyAttribute + decodingAttribute + ' src="' + imgUrl + '" />';
            } else {
              cardImageContainerOpen = '<button type="button" data-action="' + action + '" tabindex="-1" class="itemAction cardContent-button ' + cardContentClass + '" style="background-image:url(' + imgUrl + ');">';
            }
          } else if (supportsNativeLazyLoading) {
            cardImageContainerOpen = '<button type="button" data-action="' + action + '" tabindex="-1" class="itemAction cardContent-button ' + cardContentClass + '"><img draggable="false" alt=" " class="' + cardImageClass + '" loading="lazy"' + decodingAttribute + ' src="' + imgUrl + '" />';
          } else {
            cardImageContainerOpen = '<button type="button" data-action="' + action + '" tabindex="-1" class="itemAction cardContent-button lazy ' + cardContentClass + '" style="background-image:url(' + imgUrl + ');">';
          }
        } else {
          cardImageContainerOpen = '<button type="button" data-action="' + action + '" tabindex="-1" class="cardContent-button ' + cardContentClass + ' itemAction">';
        }
        cardImageContainerClose = '</button>';
      }
    }
    if (options.image === false && options.imageContainer === false) {
      cardImageContainerClose = '';
      cardImageContainerOpen = '';
    }
    if (options.vibrant && vibrantImgUrl) {
      if (options.vibrantMode === 'large') {
        cardBoxClass += ' darkContentContainer';
      }
      cardImageContainerOpen = '<div style="background-image:url(' + vibrantImgUrl + ');" class="' + cardBoxClass + '">' + cardImageContainerOpen;
    } else {
      if (options.enableCardBox) {
        cardImageContainerOpen = '<div class="' + cardBoxClass + '">' + cardImageContainerOpen;
      }
    }
    if (options.typeIndicator) {
      var defaultIcon = _itemmanager.default.getDefaultIcon(item, options);
      if (defaultIcon) {
        cardImageContainerOpen += '<i class="md-icon autortl cardIndicator cardIndicatorIcon">' + defaultIcon + '</i>';
      }
    }
    if (options.playedIndicator !== false) {
      cardImageContainerOpen += _indicators.default.getPlayedIndicatorHtml(item, 'cardIndicator card');
    }
    if (options.timerIndicator !== false) {
      cardImageContainerOpen += _indicators.default.getTimerIndicator(item, 'cardIndicator card');
    }
    if ((_item$Policy = item.Policy) != null && _item$Policy.IsDisabled) {
      cardImageContainerOpen += '<i class="md-icon cardIndicator cardUserDisabledIcon indicatorIcon" title="' + _globalize.default.translate('Disabled') + '">person_off</i>';
    }
    if (itemType === 'CollectionFolder' || item.CollectionType) {
      var refreshClass = item.RefreshProgress ? '' : 'hide';
      if (options.sideFooter) {
        refreshClass += ' cardRefreshIndicator-sideFooter';
      }

      // optimization for slower tv devices
      if (!_layoutmanager.default.tv) {
        cardImageContainerOpen += '<div is="emby-itemrefreshindicator" class="' + refreshClass.trim() + '" data-progress="' + (item.RefreshProgress || 0) + '"></div>';
        loadRefreshIndicator();
      }
    } else if (itemType === 'User' && item.ConnectLinkType) {
      cardImageContainerOpen += '<i class="md-icon cardPlayedIndicator cardIndicator playedIndicator" title="' + _globalize.default.translate('LinkedToEmbyConnect') + '">cloud</i>';
    }
    if (!imgUrl && options.imageFallback) {
      cardImageContainerOpen += getCardDefaultText(item, options);
    }
    var additionalCardContent;
    if (!_layoutmanager.default.tv && options.hoverMenu !== false) {
      additionalCardContent = getHoverMenuHtml(item, itemController, action, options, options.cardPadderClass);
    } else {
      additionalCardContent = '';
    }
    if (options.dragReorder) {
      additionalCardContent += '<i title="' + _globalize.default.translate('DragDropToReorder') + '" class="md-icon cardIndicator cardIndicatorIcon cardIndicatorIcon-dragHandle dragHandle">&#xe25D;</i>';
    }
    if (options.cardParts) {
      var attributes = _shortcuts.default.getShortcutAttributes(item, options);
      if (options.isSingleClickElement) {
        attributes.push({
          name: 'data-action',
          value: action
        });
      }
      if (!options.isVirtualList) {
        attributes.push({
          name: 'data-index',
          value: index
        });
      }
      if (options.sideFooter) {
        cardImageContainerClose += innerCardFooter;
      } else {
        cardImageContainerClose = innerCardFooter + cardImageContainerClose;
      }
      var innerHTML = cardImageContainerOpen + cardImageContainerClose + additionalCardContent + outerCardFooter;
      if (options.enableCardBox) {
        innerHTML += '</div>';
      }
      return {
        attributes: attributes,
        html: innerHTML
      };
    }
    var dataAttributes = _shortcuts.default.getShortcutAttributesHtml(item, options);
    if (options.isSingleClickElement) {
      dataAttributes += ' data-action="' + action + '"';
    }
    if (!options.isVirtualList) {
      dataAttributes += ' data-index="' + index + '"';
    }
    var tagName = options.tagName;
    if (options.sideFooter) {
      cardImageContainerClose += innerCardFooter;
    } else {
      cardImageContainerClose = innerCardFooter + cardImageContainerClose;
    }
    var fixedAttributes = options.fixedAttributes;
    if (fixedAttributes) {
      dataAttributes += ' ' + fixedAttributes;
    }
    var outerHTML = '<' + tagName + dataAttributes + ' class="' + options.className + '">' + cardImageContainerOpen + cardImageContainerClose + additionalCardContent + outerCardFooter;
    if (options.enableCardBox) {
      outerHTML += '</div>';
    }
    return outerHTML + '</' + tagName + '>';
  }
  function getItemParts(item, index, options) {
    options.cardParts = true;
    return getCardHtml(item, index, options);
  }
  var supportsTargetBlank = _servicelocator.appHost.supports('targetblank');
  var supportsSync = _servicelocator.appHost.supports('sync');
  function getHoverMenuHtml(item, itemController, action, options, menuClass) {
    var html = '';
    var hasContent = false;
    var marginClass = SupportsCssAspectRatio ? '' : '';
    html += '<div class="cardOverlayContainer itemAction ' + menuClass + marginClass + '" data-action="' + action + '">';
    var btnBaseCssClass = 'itemAction';
    var btnFabClass = 'fab cardOverlayButton-fab buttonItems-item ' + btnBaseCssClass;
    var itemType = item.Type;
    if (options.multiSelect) {
      hasContent = true;
      html += '<label tabindex="-1" title="' + options.multiSelectTitle + '" aria-label="' + options.multiSelectTitle + '" data-action="multiselect" class="chkItemSelectContainer chkCardSelectContainer cardOverlayButton itemAction emby-checkbox-label"><input tabindex="-1" class="chkItemSelect chkCardSelect emby-checkbox  emby-checkbox-notext" is="emby-checkbox" type="checkbox" data-classes="true" /><span class="checkboxLabel chkCardSelect-checkboxLabel"></span></label>';
    }
    var overlayFabClass = btnFabClass + ' cardOverlayFab-primary button-hoveraccent';
    if (options.hoverPlayButton !== false && _playbackmanager.default.canPlay(item)) {
      hasContent = true;
      var playButtonAction = getPlayAction(item, options);
      html += '<button tabindex="-1" type="button" is="emby-button" class="' + overlayFabClass + ' md-icon md-icon-fill autortl" data-action="' + playButtonAction + '">&#xe037;</button>';
    }
    if (options.hoverDownloadButton) {
      hasContent = true;
      html += '<button tabindex="-1" type="button" is="emby-button" class="' + overlayFabClass + '" data-action="custom"><i class="md-icon">&#xf090;</i></button>';
    }
    html += '<div class="cardOverlayButton-br buttonItems">';
    var userData = item.UserData || {};
    if (supportsSync && options.downloadButton !== false && _itemmanager.default.canSync(item)) {
      hasContent = true;
      html += _embyDownloadbutton.default.getHtml(item, btnFabClass, null, 'fab');
    }
    if (options.playedButton !== false && _itemmanager.default.canMarkPlayed(item) && itemType !== 'CollectionFolder') {
      hasContent = true;
      html += _embyPlaystatebutton.default.getHtml(userData.Played, btnFabClass, null, 'fab');
    }
    if (options.ratingButton !== false && _itemmanager.default.canRate(item)) {
      //let likes = userData.Likes == null ? '' : userData.Likes;

      hasContent = true;
      html += _embyRatingbutton.default.getHtml(userData.IsFavorite, btnFabClass, null, 'fab');
    }

    // Checking item.Id for Type == AddServer
    if (options.contextMenu && itemController.supportsContextMenu(item)) {
      hasContent = true;
      html += '<button type="button" title="' + options.moreTitle + '" aria-label="' + options.moreTitle + '" is="emby-button" class="md-icon ' + btnFabClass + '" data-action="menu">&#xe5D3;</button>';
    }
    if (options.previewImageButton && supportsTargetBlank) {
      hasContent = true;
      html += '<a href="' + item.OriginalImageUrl + '" target="_blank" tabindex="-1" type="button" title="' + _globalize.default.translate('HeaderOpenInNewWindow') + '" aria-label="' + _globalize.default.translate('HeaderOpenInNewWindow') + '" is="emby-linkbutton" class="md-icon ' + btnFabClass + '" data-action="openlink">&#xe89e;</a>';
    }
    if (!hasContent) {
      return '';
    }
    html += '</div>';
    html += '</div>';
    return html;
  }
  function getItemImageDefaultText(item, options) {
    return '<h2 class="' + options.cardDefaultTextClass + ' secondaryText">' + item.Name + '</h2>';
  }
  function getCardDefaultText(item, options) {
    if (options.defaultTextContent != null) {
      return '<div class="' + options.cardDefaultTextClass + '">' + options.defaultTextContent + '</div>';
    }
    if (item.Type === 'ItemImage') {
      return getItemImageDefaultText(item, options);
    }
    var icon = item.Icon || (options.defaultIcon === false ? null : _itemmanager.default.getDefaultIcon(item, options));
    if (icon) {
      if (options.smallSideFooter) {
        return '<i class="cardImageIcon cardImageIcon-sideFooter cardImageIcon-smallSideFooter md-icon autortl">' + icon + '</i>';
      } else if (options.sideFooter) {
        return '<i class="cardImageIcon cardImageIcon-sideFooter md-icon autortl">' + icon + '</i>';
      }
      return '<i class="cardImageIcon cardImageIcon-center md-icon autortl">' + icon + '</i>';
    }
    var defaultName = isUsingLiveTvNaming(item.Type) ? item.Name : _itemmanager.default.getDisplayName(item, {
      includeParentInfo: options.includeParentInfoInTitle,
      channelNumberFirst: options.channelNumberFirst,
      enableSpecialEpisodePrefix: options.enableSpecialEpisodePrefix,
      includeIndexNumber: options.includeIndexNumber,
      hideEpisodeSpoilerInfo: options.hideEpisodeSpoilerInfo
    });
    return '<div class="' + options.cardDefaultTextClass + '">' + defaultName + '</div>';
  }
  function buildCards(items, options) {
    // Abort if the container has been disposed
    var itemsContainer = options.itemsContainer;
    if (!document.body.contains(itemsContainer)) {
      return;
    }
    var parentContainer = options.parentContainer;
    if (parentContainer) {
      if (items.length) {
        parentContainer.classList.remove('hide');
      } else {
        parentContainer.classList.add('hide');
        return;
      }
    }
    var html = buildCardsHtmlInternal(items, options);
    itemsContainer.innerHTML = html;
    itemsContainer.items = items;
    if (options.multiSelect) {
      if (itemsContainer.enableMultiSelect) {
        itemsContainer.enableMultiSelect(true);
      } else {
        // custom element not upgraded yet. set this, and emby-itemscontainer will handle it
        itemsContainer.setAttribute('data-multiselect', 'true');
      }
    }
    if (options.contextMenu) {
      if (itemsContainer.enableContextMenu) {
        itemsContainer.enableContextMenu(true);
      } else {
        // custom element not upgraded yet. set this, and emby-itemscontainer will handle it
        itemsContainer.setAttribute('data-contextmenu', 'true');
      }
    }
    if (html) {
      _lazyimageloader.default.lazyChildren(itemsContainer);
    }
    if (options.autoFocus) {
      _focusmanager.default.autoFocus(itemsContainer);
    }
  }
  function setListClasses(elem, listOptions) {
    var _listOptions$options, _listOptions$options2, _listOptions$options3, _listOptions$options4;
    var classList = elem.classList;
    if ((_listOptions$options = listOptions.options) != null && _listOptions$options.horizontalGrid) {
      classList.add('itemsContainer-horizontalgrid');
    } else {
      classList.remove('itemsContainer-horizontalgrid');
    }
    if (listOptions.options && (_listOptions$options2 = listOptions.options) != null && _listOptions$options2.horizontalGrid && !listOptions.virtualScrollLayout) {
      listOptions.options.itemsContainer = elem;
      listOptions.options.useItemsContainerForImageSize = true;
    }
    if ((_listOptions$options3 = listOptions.options) != null && _listOptions$options3.horizontalGrid && !SupportsHorizontalRenderingWithoutCardColumns) {
      classList.add('itemsContainer-horizontalgrid-withcolumns');
    } else {
      classList.remove('itemsContainer-horizontalgrid-withcolumns');
    }
    if ((_listOptions$options4 = listOptions.options) != null && _listOptions$options4.horizontalGrid || (listOptions.virtualScrollLayout || '').includes('horizontal')) {
      classList.remove('vertical-wrap');
    } else {
      classList.add('vertical-wrap');
    }
    classList.remove('vertical-list');
  }
  function setUserPreferredSize(element, cardSize) {
    if (!supportsCalc || !supportsMin || !supportsCssVariables) {
      return;
    }
    var offset = 0;
    if (element) {
      offset = parseInt(element.getAttribute('data-cardsizeoffset') || '0');
    }
    var value;
    if (element) {
      value = cardSize;
    }
    if (value == null && (!element || offset)) {
      value = _appsettings.default.cardSize();
    }
    switch (value) {
      case 'extrasmall':
        value = 3;
        break;
      case 'smaller':
        value = 2;
        break;
      case 'small':
        value = 1;
        break;
      case 'large':
        value = -1;
        break;
      case 'larger':
        value = -2;
        break;
      case 'extralarge':
        value = -3;
        break;
      case 'normal':
        value = 0;
        break;
      case 'default':
      default:
        value = element && !offset ? 'null' : 0;
        break;
    }
    if (typeof value === 'number') {
      if (offset) {
        value += offset * -1;
        value = Math.min(3, value);
        value = Math.max(-3, value);
      }
      value = value.toString();
    }
    try {
      if (element && value === 'null') {
        element.style.removeProperty('--user-cards-size-adjust');
      } else {
        (element || document.documentElement).style.setProperty('--user-cards-size-adjust', value);
      }
    } catch (err) {
      console.error('error in setUserPreferredSize: ', err);
    }
  }
  function onUserSettingsChange(e, name, value) {
    if (name === 'cardSize') {
      setUserPreferredSize();
    }
  }
  function removeNowPlayingIndicator(indicator) {
    indicator.classList.remove('itemelement-nowplaying', 'cardImageContainer-nowplaying', 'cardText-nowplaying');
  }
  function addNowPlayingIndicator(itemElement) {
    if (_layoutmanager.default.tv) {
      var cardText = itemElement.querySelector('.cardText-first');
      if (cardText) {
        cardText.classList.add('itemelement-nowplaying', 'cardText-nowplaying');
        return;
      }
      return;
    } else {
      var listItemImageContainer = itemElement.querySelector('.cardImageContainer');
      if (listItemImageContainer) {
        listItemImageContainer.classList.add('itemelement-nowplaying', 'cardImageContainer-nowplaying');
        return;
      }
    }
  }
  _events.default.on(_connectionmanager.default, 'localusersignedin', function () {
    setUserPreferredSize();
  });
  _events.default.on(_usersettings.default, 'change', onUserSettingsChange);
  var _default = _exports.default = {
    setListOptions: setListOptions,
    getItemsHtml: getItemsHtml,
    getItemParts: getItemParts,
    buildCards: buildCards,
    virtualChunkSize: 50,
    setListClasses: setListClasses,
    setUserPreferredSize: setUserPreferredSize,
    removeNowPlayingIndicator: removeNowPlayingIndicator,
    addNowPlayingIndicator: addNowPlayingIndicator
  };
});
