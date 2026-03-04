define(["exports", "./../emby-apiclient/connectionmanager.js", "./../dom.js", "./../common/globalize.js", "./../layoutmanager.js", "./../common/itemmanager/itemmanager.js", "./../common/imagehelper.js", "./../dialoghelper/dialoghelper.js", "./../emby-elements/emby-button/emby-button.js", "./../emby-elements/emby-scroller/emby-scroller.js", "./../emby-elements/emby-itemscontainer/emby-itemscontainer.js", "./../approuter.js", "./../focusmanager.js", "./../listview/listview.js", "./../shortcuts.js", "./../common/textencoding.js"], function (_exports, _connectionmanager, _dom, _globalize, _layoutmanager, _itemmanager, _imagehelper, _dialoghelper, _embyButton, _embyScroller, _embyItemscontainer, _approuter, _focusmanager, _listview, _shortcuts, _textencoding) {
  Object.defineProperty(_exports, "__esModule", {
    value: true
  });
  _exports.default = void 0;
  /* jshint module: true */

  require(['css!modules/actionsheet/actionsheet.css', 'material-icons']);
  function onCancelClick(e) {
    _dialoghelper.default.close(this.closest('.actionSheet'));
  }
  function getTextLinkButton(item) {
    var href = _approuter.default.getRouteUrl(item);
    return '<a is="emby-linkbutton" class="button-link noautofocus actionsheetPreviewTextItem mediaInfoItem" data-href="' + href + '" href="' + href + '">' + _textencoding.default.htmlEncode(item.Name) + '</a>';
  }
  function getItemPreviewHtml(options, item) {
    var html = '';
    html += '<div class="actionsheetItemPreview flex flex-shrink-zero flex-direction-row">';
    var apiClient = _connectionmanager.default.getApiClient(item);
    var imageUrlInfo = _imagehelper.default.getImageUrl(item, apiClient, {
      height: 60,
      width: 200
    });
    var imageUrl = imageUrlInfo.imgUrl;
    var imgClass = '';
    var round = item.Type === 'MusicArtist';
    if (imageUrl) {
      imgClass += ' actionsheetItemPreviewImage-bg';
      var imageAspect = imageUrlInfo.aspect || 1;
      var shape = _imagehelper.default.getShapeFromAspect(imageAspect);
      imgClass += ' actionsheetItemPreviewImage-bg-' + shape;
      if (round && shape === 'square') {
        imgClass += ' actionsheetItemPreviewImage-round';
      }
      html += '<div class="' + imgClass.trim() + '" style="aspect-ratio:' + imageAspect + ';background-image:url(' + imageUrl + ');">';
      html += '</div>';
    } else {
      imgClass += ' actionsheetItemPreviewImage-iconcontainer';
      if (round) {
        imgClass += ' actionsheetItemPreviewImage-round';
      }
      html += '<div class="' + imgClass.trim() + '">';
      html += '<i class="actionsheetItemPreviewImage-icon md-icon autortl">';
      html += _itemmanager.default.getDefaultIcon(item);
      html += '</i>';
      html += '</div>';
    }
    html += '<div class="actionsheetItemPreviewContent">';
    var lines = [];
    if (item.SeriesName) {
      if (item.SeriesId) {
        lines.push(getTextLinkButton({
          Type: 'Series',
          Id: item.SeriesId,
          Name: item.SeriesName,
          IsFolder: true,
          ServerId: item.ServerId
        }));
      } else {
        lines.push(_textencoding.default.htmlEncode(item.SeriesName || ''));
      }
    } else if (item.Type === 'Program') {
      lines.push(_textencoding.default.htmlEncode(item.Name || ''));
    }
    var displayName = _textencoding.default.htmlEncode(_itemmanager.default.getDisplayName(item, {}) || '');
    var nameHtml = '<div class="actionsheetPreviewTextItem mediaInfoItem">' + displayName + '</div>';
    if (item.MediaType === 'Audio' && !_layoutmanager.default.tv && options.linkToItem !== false) {
      nameHtml += '<a is="emby-linkbutton" title="' + displayName + '" style="font-weight:inherit;" href="' + _approuter.default.getRouteUrl(item) + '" class="flex-shrink-zero actionsheetPreviewTextItem mediaInfoItem button-link button-link-color-inherit"><i class="md-icon" style="font-size:160%;">&#xe88e;</i></a>';
    }
    lines.push(nameHtml);
    if (item.Type === 'Server') {
      if (apiClient && apiClient.serverVersion()) {
        lines.push(apiClient.serverVersion());
      }
    }
    if (item.Type === 'User' && options.showServerName) {
      var serverName = apiClient.serverName();
      if (serverName) {
        lines.push(_textencoding.default.htmlEncode(serverName));
      }
    }
    if (item.IsFolder && item.AlbumArtists && item.AlbumArtists.length) {
      lines.push(getTextLinkButton({
        Type: 'MusicArtist',
        Id: item.AlbumArtists[0].Id,
        Name: item.AlbumArtists[0].Name,
        ServerId: item.ServerId
      }));
    } else if (item.ArtistItems && item.ArtistItems.length) {
      lines.push(getTextLinkButton({
        Type: 'MusicArtist',
        Id: item.ArtistItems[0].Id,
        Name: item.ArtistItems[0].Name,
        ServerId: item.ServerId
      }));
    } else if (item.AlbumArtists && item.AlbumArtists.length) {
      lines.push(getTextLinkButton({
        Type: 'MusicArtist',
        Id: item.AlbumArtists[0].Id,
        Name: item.AlbumArtists[0].Name,
        ServerId: item.ServerId
      }));
    }
    var secondaryTexts = [];
    if (item.Album && item.AlbumId) {
      secondaryTexts.push(getTextLinkButton({
        Type: item.MediaType === 'Photo' ? 'PhotoAlbum' : 'MusicAlbum',
        Id: item.AlbumId,
        Name: item.Album,
        ServerId: item.ServerId
      }));
    } else if (item.Album) {
      secondaryTexts.push('<div class="actionsheetPreviewTextItem mediaInfoItem">' + _textencoding.default.htmlEncode(item.Album) + '</div>');
    }
    if (item.ProductionYear && item.Type !== 'Episode' && item.Type !== 'Audio') {
      secondaryTexts.push('<div class="actionsheetPreviewTextItem mediaInfoItem">' + item.ProductionYear + '</div>');
    }
    if (secondaryTexts.length) {
      lines.push(secondaryTexts.join(''));
    }
    for (var i = 0, length = Math.min(lines.length, 3); i < length; i++) {
      if (i >= 1) {
        html += '<div class="actionsheetItemPreviewText mediaInfoItems secondaryText">';
        html += lines[i];
        html += '</div>';
      } else {
        html += '<div class="actionsheetItemPreviewText mediaInfoItems actionsheetItemPreviewText-main">';
        html += lines[i];
        html += '</div>';
      }
    }
    html += '</div>';
    html += '</div>';

    //html += '<div class="actionsheetDivider"></div>';

    return html;
  }
  function autoFocusInternal(dlg, options) {
    //let dialogOptions = dlg.dialogOptions;

    //if (dialogOptions?.hasItemSelectionState) {

    //}

    var focused = _focusmanager.default.autoFocus(dlg.querySelector('.itemsContainer'), options);
    if (!focused) {
      if (options != null && options.skipIfNotEnabled && !_focusmanager.default.isAutoFocusEnabled()) {
        return;
      }
      focused = _focusmanager.default.autoFocus(dlg, options);
    }
  }
  function autoFocus() {
    var dlg = this;
    if (!dlg.classList.contains('dlg-autofocus')) {
      return;
    }
    var skipIfNotEnabled = !dlg.classList.contains('dlg-autofocus-force');
    autoFocusInternal(dlg, {
      skipIfNotEnabled: skipIfNotEnabled
    });
  }
  function onItemsContainerUpgraded() {
    return this.querySelector('.itemsContainer').resume({
      refresh: true
    });
  }
  function refreshItemsContainerWithEvent(instance, itemsContainer) {
    return new Promise(function (resolve, reject) {
      _dom.default.addEventListener(itemsContainer, 'upgraded', function () {
        onItemsContainerUpgraded.call(instance).then(resolve, reject);
      }, {
        once: true
      });
    });
  }
  function refreshItemsContainer() {
    var itemsContainer = this.querySelector('.itemsContainer');
    if (itemsContainer.resume) {
      return onItemsContainerUpgraded.call(this);
    } else {
      return refreshItemsContainerWithEvent(this, itemsContainer);
    }
  }
  function onUpdateElement(element, item, index, options) {
    if (!element) {
      return;
    }
    var classList = element.classList;
    if (!classList) {
      return;
    }
    if (item && item.Selected) {
      classList.add('autofocus');
    } else {
      classList.remove('autofocus');
    }
    if (!options.borderAll && (options.clearBorder || options.hasDivider)) {
      var contentElem = element.querySelector('.listItem-content');
      if (contentElem) {
        if (!options.clearBorder && item != null && item.hasDivider) {
          contentElem.classList.remove('actionsheet-noborder', 'actionsheet-noborderconditional');
        } else {
          if (_layoutmanager.default.tv || options.clearBorder) {
            contentElem.classList.add('actionsheet-noborder');
          } else {
            contentElem.classList.add('actionsheet-noborder');
          }
        }
      }
    }
  }
  function getListViewItemFromInputItem(option, options) {
    var item = {
      Name: option.Name || option.name || option.textContent || option.innerText,
      ServerId: option.ServerId || null,
      MediaType: option.MediaType || null,
      IsFolder: option.IsFolder,
      // for autocomplete items
      Type: option.Type,
      Overview: option.Overview,
      PrimaryImageAspectRatio: option.PrimaryImageAspectRatio,
      RunTimeTicks: option.RunTimeTicks,
      IndexNumber: option.IndexNumber,
      IndexNumberEnd: option.IndexNumberEnd,
      SupportsResume: option.SupportsResume,
      ParentIndexNumber: option.ParentIndexNumber,
      ProductionYear: option.ProductionYear,
      PremiereDate: option.PremiereDate,
      SeriesName: option.SeriesName,
      NameSubtitle: option.nameSubtitle,
      Artists: option.Artists,
      ArtistItems: option.ArtistItems,
      AlbumArtists: option.AlbumArtists,
      Composers: option.Composers,
      AlbumArtist: option.AlbumArtist,
      Album: option.Album,
      AlbumId: option.AlbumId,
      SeriesId: option.SeriesId,
      SeasonId: option.SeasonId,
      SeasonName: option.SeasonName,
      ImageTags: option.ImageTags,
      BackdropImageTags: option.BackdropImageTags,
      PrimaryImageTag: option.PrimaryImageTag,
      AlbumPrimaryImageTag: option.AlbumPrimaryImageTag,
      SeriesPrimaryImageTag: option.SeriesPrimaryImageTag,
      ParentThumbItemId: option.ParentThumbItemId,
      ParentThumbImageTag: option.ParentThumbImageTag,
      ParentLogoItemId: option.ParentLogoItemId,
      ParentLogoImageTag: option.ParentLogoImageTag,
      ParentBackdropItemId: option.ParentBackdropItemId,
      ParentBackdropImageTags: option.ParentBackdropImageTags,
      ImageUrl: option.ImageUrl,
      hasDivider: option.dividerAfter,
      CanReorder: option.CanReorder
    };
    if (options.nameProperty && option[options.nameProperty] != null) {
      item.Name = option[options.nameProperty];
    }
    if (options.getItemId) {
      item.Id = options.getItemId(option);
    } else if (option.Id != null) {
      item.Id = option.Id;
    } else if (option.id != null && option.id !== '') {
      item.Id = option.id;
    } else if (option.value != null) {
      item.Id = option.value;
    } else {
      item.Id = option.Name || option.name;
    }
    var selectedValuesIncludesId = item.Id != null && options.selectedValuesClone.includes(item.Id);
    if (options.multiple) {
      var isSelected = options.emptyValueSetEqualsAll && !options.selectedValuesClone.length || selectedValuesIncludesId;
      item.Selected = isSelected;
    } else {
      item.Selected = option.selected || option.Selected || selectedValuesIncludesId;
    }
    item.Icon = option.icon || option.Icon || (options.useIconForSelection && item.Selected && options.hasItemSelectionState ? '&#xe5ca;' : null);
    item.iconClass = option.iconClass;
    item.asideText = option.asideText;
    item.asideIcon = option.asideIcon || (options.useAsideIconForSelection && item.Selected && options.hasItemSelectionState ? '&#xe5ca;' : null);
    item.executeActionOnClick = option.executeActionOnClick;

    //if (!item.asideIcon && options.hasItemAsideIcon && options.useIconForSelection) {
    //    item.asideIcon = 'edit';
    //}

    item.ShortOverview = options.getItemSecondaryText ? options.getItemSecondaryText(option) : option.secondaryText || option.title || option.ShortOverview;
    item.originalItem = option;
    return item;
  }
  function getItemsFromOptions(options, query) {
    return options.getItems(query).then(function (result) {
      var items = result.Items.slice(0);
      for (var i = 0, length = items.length; i < length; i++) {
        items[i] = getListViewItemFromInputItem(items[i], options);
      }
      result.Items = items;
      return result;
    });
  }
  function getItemsFn(options) {
    return function (query) {
      if (!query) {
        query = {};
      }
      if (options.getItems) {
        return getItemsFromOptions(options, query);
      }
      var inputItems = options.items || [];
      var items = [];
      for (var i = 0, length = inputItems.length; i < length; i++) {
        var inputItem = inputItems[i];
        var item = getListViewItemFromInputItem(inputItem, options);
        items.push(item);
      }
      var totalRecordCount = items.length;
      items = items.slice(query.StartIndex || 0);
      if (query.Limit != null && items.length > query.Limit) {
        items.length = Math.min(items.length, query.Limit);
      }
      return Promise.resolve({
        Items: items,
        TotalRecordCount: totalRecordCount
      });
    };
  }
  function onItemsChecked(options) {
    var items = options.items;
    var checked = options.checked;
    for (var i = 0, length = items.length; i < length; i++) {
      items[i].Selected = checked;
    }
    return Promise.resolve();
  }
  function getListViewOptions(options) {
    var menuItemClass = 'actionSheetMenuItem';
    if (options.menuItemClass) {
      menuItemClass += ' ' + options.menuItemClass;
    }
    if (options.iconRight) {
      menuItemClass += ' actionSheetMenuItem-iconright';
    }
    var listItemBodyClass;
    var iconClass;
    var listItemBodyTextClass = 'actionSheetItemText';
    var asideTextClass;
    if (options.multiple) {
      listItemBodyClass = 'actionsheetListItemBody-multiple';
    } else {
      if (!options.hasItemIcon && !options.hasItemSelectionState) {
        menuItemClass += ' actionSheetMenuItem-noicon';
      }
      listItemBodyClass = 'actionsheetListItemBody';
      if (options.iconRight) {
        listItemBodyClass += ' actionsheetListItemBody-iconright';
      }
      iconClass = 'actionsheetMenuItemIcon listItemIcon listItemIcon-transparent md-icon';
      asideTextClass = 'actionSheetItemAsideText';
    }
    var fields = options.fields;
    if (!fields) {
      fields = ['Name'];
    }
    if (options.multiple) {
      fields.unshift('ItemCheckbox');
    }
    var noTextWrap = options.noTextWrap || options.hasItemAsideText;
    var listViewOptions = {
      action: options.multiple ? 'togglecheckbox' : 'custom',
      fields: fields,
      draggable: options.enableReordering || false,
      dragReorder: options.enableReordering || false,
      dragHandleClass: 'actionsheet-draghandle',
      draggableXActions: false,
      noTextWrap: noTextWrap,
      multiSelect: false,
      contextMenu: false,
      hoverPlayButton: false,
      itemClass: menuItemClass,
      contentWrapperClass: options.listItemContentWrapperClass,
      listItemBodyClassName: listItemBodyClass,
      iconClass: iconClass,
      listItemBodyTextClass: listItemBodyTextClass,
      fillEmptyTextlines: false,
      enableDefaultIcon: options.enableDefaultIcon === true,
      highlight: options.highlight,
      border: _layoutmanager.default.tv ? options.border : options.border !== false,
      artist: options.artist,
      asideTextClass: asideTextClass,
      asideIconClass: ((asideTextClass || '') + ' actionSheetItemAsideIcon').trim(),
      image: !options.multiple && (options.hasItemIcon === true || options.hasItemImage === true || options.hasItemSelectionState === true),
      checkboxAction: onItemsChecked,
      enableUserDataButtons: false,
      moreButton: false,
      mediaInfo: false,
      textLinks: false,
      enableSideMediaInfo: false,
      overviewLines: options.overviewLines || 2,
      iconSpacing: options.hasItemImage ? false : true,
      imageSize: options.hasItemImage ? 'smallest' : null,
      roundImage: options.roundImage,
      allowBorderXOffset: false,
      expandOutOnFocus: true,
      playQueueIndicator: false
    };
    var imageContainerClass = 'actionSheetItemImageContainer';
    if (!options.useListViewSizing) {
      imageContainerClass += ' actionSheetItemImageContainer-customsize';
      if (options.useCustomImageContainerWidth !== false) {
        imageContainerClass += ' actionSheetItemImageContainer-customwidth';
      }
    }
    if (options.hasItemSelectionState || options.hasItemIcon) {
      imageContainerClass += ' actionSheetItemImageContainer-transparent';
    }
    listViewOptions.imageContainerClass = imageContainerClass;
    return listViewOptions;
  }
  function getListOptions() {
    var options = this;
    return {
      renderer: _listview.default,
      options: getListViewOptions(options),
      virtualScrollLayout: options.useVirtualScroller ? 'vertical-list' : null
    };
  }
  function array_move(arr, old_index, new_index) {
    if (new_index >= arr.length) {
      throw new Error('out of bounds');
    }
    arr.splice(new_index, 0, arr.splice(old_index, 1)[0]);
    return arr;
  }
  function callUpdateElement(itemsContainer, options) {
    var items = itemsContainer.querySelectorAll(itemsContainer.getItemSelector());
    for (var i = 0, length = items.length; i < length; i++) {
      var elem = items[i];
      onUpdateElement(elem, itemsContainer.getItemFromElement(elem), null, options);
    }
  }
  function removeItemOnce(arr, value) {
    var index = arr.indexOf(value);
    if (index > -1) {
      arr.splice(index, 1);
    }
    return arr;
  }
  function ActionSheet() {}
  ActionSheet.prototype.show = function (options) {
    var inputItems = options.items || [];
    for (var i = 0, length = inputItems.length; i < length; i++) {
      var inputItem = inputItems[i];
      if (inputItem.dividerAfter) {
        options.hasDivider = true;
        break;
      }
    }

    // don't do this in tv mode or we'll end up seeing dividers, which don't look that great
    if (!_layoutmanager.default.tv) {
      //options.highlight = false;
      options.clearBorder = !options.hasDivider;
    }

    // items
    // positionTo
    // showCancel
    // title
    var dialogOptions = {
      removeOnClose: true,
      enableHistory: options.enableHistory,
      autoFocus: false,
      refocus: options.refocus,
      autoCenter: false,
      transparentBackground: 'auto',
      positionTo: options.positionTo,
      positionX: options.positionX,
      positionY: options.positionY,
      transformOrigin: options.transformOrigin,
      minWidthToElement: options.minWidthToElement,
      positionClientX: options.positionClientX,
      positionClientY: options.positionClientY,
      offsetLeft: options.offsetLeft,
      offsetTop: options.offsetTop,
      blurBackground: options.blurBackground,
      setCurrentFocusScope: options.setCurrentFocusScope,
      swipeClose: options.swipeClose,
      autoRepositionY: options.autoRepositionY,
      // tell dialogHelper not to do this initially. we'll do it after items have been rendererd
      setDialogSize: options.setDialogSize || false,
      size: options.dialogSize,
      autoLowResLayout: options.autoLowResLayout,
      lowResXMargin: true,
      lowResAutoHeight: true,
      lowerLowResThreshold: options.lowerLowResThreshold
    };
    var useVirtualScroller = options.getItems != null && options.enableVirtualScroller;
    options.useVirtualScroller = useVirtualScroller;
    if (useVirtualScroller) {
      dialogOptions.fixedSize = true;
    }
    var isFullscreen = dialogOptions.size === 'fullscreen';
    var enablePaddingTop;
    var enablePaddingBottom;
    var enablePaddingInline;
    if (options.hasItemImage) {
      options.useListViewSizing = true;
    }
    if (!isFullscreen) {
      enablePaddingTop = true;
      enablePaddingBottom = true;
      enablePaddingInline = true;
    }
    var dlg = _dialoghelper.default.createDialog(dialogOptions);
    var instance = this;
    instance.dlg = dlg;
    dlg.classList.add('actionSheet');
    var enableFocusScale = _layoutmanager.default.tv;
    if (enableFocusScale) {
      dlg.classList.add('actionSheet-focusscale');
    }
    var forceAutoFocus = _layoutmanager.default.tv || options.hasItemSelectionState;
    if (forceAutoFocus || isFullscreen) {
      dlg.classList.add('dlg-autofocus');
      if (forceAutoFocus) {
        dlg.classList.add('dlg-autofocus-force');
      }
    }
    if (!isFullscreen) {
      if (useVirtualScroller) {
        dlg.classList.add('actionSheet-virtualscroll');
      }
      if (!_layoutmanager.default.tv) {
        dlg.classList.add('actionSheet-automobile', 'actionSheet-largefont');
        if (options.multiple) {
          dlg.classList.add('actionSheet-smallfont');
        }
      }
      if (options.blur !== false && _dom.default.allowBackdropFilter()) {
        dlg.classList.add('dialog-blur');
      }
    }
    if (options.dialogClass) {
      dlg.classList.add(options.dialogClass);
    }
    var html = '';
    if (options.hasItemSelectionState) {
      if (options.hasItemIcon) {
        options.iconRight = false;
        options.useAsideIconForSelection = true;
      } else {
        options.iconRight = false;
        options.useIconForSelection = true;
      }
    } else {
      if (options.hasItemIcon && !options.hasItemAsideIcon && !options.hasItemAsideText && options.iconRight !== false) {
        options.iconRight = true;
      }
    }
    if (options.iconRight && !isFullscreen) {
      // the width doesn't matter if it comes after the text
      options.useCustomImageContainerWidth = false;
    }
    if (isFullscreen) {
      html += '<button is="paper-icon-button-light" class="btnCloseActionSheet hide-mouse-idle-tv" tabindex="-1"><i class="md-icon autortl">&#xe5cd;</i></button>';

      // check for useVirtualScroller because that determines if it has the dialog-fullscreen-lowres class
    } else if (useVirtualScroller) {
      html += '<button is="paper-icon-button-light" class="btnCloseActionSheet dialogbutton-hidenotfullscreen hide-mouse-idle-tv" tabindex="-1"><i class="md-icon autortl">&#xe5cd;</i></button>';
    }

    // If any items have an icon, give them all an icon just to make sure they're all lined up evenly
    var center = options.title && !options.hasItemIcon && !options.hasItemImage && !options.hasItemSelectionState;
    if (center || isFullscreen) {
      dlg.classList.add('actionsheet-centered');
    }
    var previewHtml = '';
    if (options.item) {
      previewHtml = getItemPreviewHtml(options, options.item);
    }
    html += previewHtml;
    if (options.title) {
      var headerClass = 'actionSheetTitle';
      if (options.hideTitleWhenNotFullscreen && !isFullscreen) {
        headerClass += ' actionSheetTitle-hideNonFullscreen';
      }
      if (isFullscreen) {
        html += '<h3 class="' + headerClass + '">';
        html += options.title;
        html += '</h3>';
      } else {
        html += '<p class="' + headerClass + ' secondaryText actionSheetTitle-small">';
        html += options.title;
        html += '</p>';
      }
    }
    if (options.text) {
      html += '<p class="actionSheetText">';
      html += options.text;
      html += '</p>';
    }
    var scrollerClassName = 'actionSheetScroller focuscontainer-x';
    var scrollSliderClass = ' actionsheetScrollSlider scrollSlider flex flex-direction-column itemsContainer';
    if (isFullscreen) {
      scrollerClassName += ' actionSheetScroller-fullscreen';
      if (useVirtualScroller) {
        scrollerClassName += ' actionSheetScroller-fullscreen-virtual';
      }
    } else {
      if (useVirtualScroller) {
        scrollerClassName += ' flex-grow';
      }
      if (options.title && !options.hideTitleWhenNotFullscreen) {
        enablePaddingTop = false;
      }
    }
    if (enableFocusScale) {
      scrollerClassName += ' actionSheetScroller-focusscale';
      enablePaddingBottom = true;
      enablePaddingTop = true;
    }
    if (options.title || options.text) {
      scrollerClassName += ' actionSheetScroller-withheader';
    }
    var attr = '';
    if (!isFullscreen && (!options.multiple || useVirtualScroller) && options.highlight === false) {
      enablePaddingBottom = true;
    }
    if (enablePaddingInline) {
      scrollerClassName += ' actionSheetScroller-padding-inline';
    }
    if (enablePaddingTop) {
      scrollSliderClass += ' actionSheetScroller-padding-top';
    }
    if (enablePaddingBottom) {
      scrollSliderClass += ' actionSheetScroller-padding-bottom';
    }
    html += '<div is="emby-scroller" data-miniscrollbar="true" data-horizontal="false" data-focusscroll="true"' + attr + ' class="' + scrollerClassName + '">';
    if (options.multiple) {
      scrollSliderClass += ' actionsheet-scrollSlider-multiple';
    }
    var attributes = '';
    if (useVirtualScroller) {
      attributes += ' data-virtualscrolllayout="vertical-grid"';
    }
    html += '<div is="emby-itemscontainer" class="' + scrollSliderClass + ' vertical-list"' + attributes + '>';
    html += '</div>';
    html += '</div>';
    if (options.bottomText) {
      html += '<div class="actionSheetBottomText fieldDescription">';
      html += options.bottomText;
      html += '</div>';
    }
    if (options.multiple && useVirtualScroller) {
      html += '<div class="flex align-items-center justify-content-flex-start text-align-start" style="width:100%;">';
      html += '<div style="padding:1em .75em 1em .75em;" class="flex flex-grow align-items-center justify-content-center">';
      var selectNoneText;
      var btnActionSheetSelectNoneClass = 'btnActionSheetSelectNone';
      if (options.selectAllOnSelectNone) {
        selectNoneText = _globalize.default.translate('SelectAll');
        btnActionSheetSelectNoneClass += ' dlg-close';
      } else {
        selectNoneText = _globalize.default.translate('SelectNone');
      }
      html += '<button type="button" is="emby-button" class="button-link ' + btnActionSheetSelectNoneClass + '">' + selectNoneText + '</button>';
      html += '</div>';
      html += '</div>';
    }
    dlg.innerHTML = html;
    var btnCloseActionSheets = dlg.querySelectorAll('.btnCloseActionSheet');
    for (var _i = 0, _length = btnCloseActionSheets.length; _i < _length; _i++) {
      btnCloseActionSheets[_i].addEventListener('click', onCancelClick);
    }
    return new Promise(function (resolve, reject) {
      var _dlg$querySelector;
      var selectedItem;
      var isResolved;
      var hasSelectionChanged;
      function getResolveResult() {
        var _selectedItem, _selectedItem2;
        return options.multiple ? hasSelectionChanged ? options.selectedValuesClone : null : options.resolveWithSelectedItem ? ((_selectedItem = selectedItem) == null ? void 0 : _selectedItem.originalItem) || selectedItem : (_selectedItem2 = selectedItem) == null ? void 0 : _selectedItem2.Id;
      }
      function onItemAction(e) {
        var _selectedItem3, _selectedItem4;
        if (options.multiple) {
          return;
        }
        var item = e.detail.item;
        selectedItem = item;
        var originalItem = ((_selectedItem3 = selectedItem) == null ? void 0 : _selectedItem3.originalItem) || selectedItem;
        var resolveResult = options.resolveWithSelectedItem ? originalItem : (_selectedItem4 = selectedItem) == null ? void 0 : _selectedItem4.Id;
        if (originalItem.executeActionOnClick) {
          resolve(resolveResult);
          isResolved = true;
        } else if (options.resolveOnClick) {
          if (options.resolveOnClick.indexOf) {
            var _selectedItem5;
            if (options.resolveOnClick.indexOf((_selectedItem5 = selectedItem) == null ? void 0 : _selectedItem5.Id) !== -1) {
              resolve(resolveResult);
              isResolved = true;
            }
          } else {
            resolve(resolveResult);
            isResolved = true;
          }
        }
        _dialoghelper.default.close(dlg);
      }
      options.selectedValuesClone = (options.selectedValues || []).slice(0);
      var itemsContainer = dlg.querySelector('.itemsContainer');
      itemsContainer.addEventListener('action-null', onItemAction);
      itemsContainer.fetchData = getItemsFn(options);
      itemsContainer.getListOptions = getListOptions.bind(options);
      function onValueChange(refreshItems) {
        hasSelectionChanged = true;
        if (options.onChange) {
          options.onChange(getResolveResult());
        }
        if (options.refreshItemsOnChange && refreshItems !== false) {
          itemsContainer.scrollToIndex(0, {}, itemsContainer.contains(document.activeElement));
          itemsContainer.refreshItems();
        }
      }
      (_dlg$querySelector = dlg.querySelector('.btnActionSheetSelectNone')) == null || _dlg$querySelector.addEventListener('click', function () {
        options.selectedValuesClone = [];
        if (this.classList.contains('dlg-close')) {
          onValueChange(false);
          _dialoghelper.default.close(dlg);
        } else {
          onValueChange();
        }
      });
      itemsContainer.addEventListener('change', function (e) {
        hasSelectionChanged = true;
        var input = e.target.closest('input');
        var item = _shortcuts.default.getItemFromChildNode(input, null, this);
        var itemValue = item.Id;
        removeItemOnce(options.selectedValuesClone, itemValue);
        if (input.checked) {
          options.selectedValuesClone.push(itemValue);
        }
        onValueChange();
      });
      itemsContainer.addEventListener('itemdrop', function (e) {
        e.preventDefault();
        var dropInfo = e.detail;
        var item = dropInfo.items[0];
        var oldIndex = options.selectedValuesClone.indexOf(item.Id);

        // don't reorder if it's not selected
        if (oldIndex === -1) {
          return;
        }
        if (dropInfo.newIndex >= options.selectedValuesClone.length) {
          return;
        }
        options.selectedValuesClone = array_move(options.selectedValuesClone, oldIndex, dropInfo.newIndex);
        onValueChange();
      });
      itemsContainer.afterRefresh = function () {
        if (!itemsContainer.virtualScroller) {
          callUpdateElement(itemsContainer, options);
        }
      };
      var openingPromise = new Promise(function (resolve, reject) {
        dlg.addEventListener('open', resolve);
      });
      var openedPromise = new Promise(function (resolve, reject) {
        dlg.addEventListener('opened', resolve);
      });
      var closePromise = _dialoghelper.default.open(dlg);
      (useVirtualScroller ? Promise.resolve() : refreshItemsContainer.call(dlg)).then(function () {
        // do this again in case it has changed size after being populated with items
        dlg.dialogOptions.setDialogSize = true;
        _dialoghelper.default.positionDialog(dlg);
        var timeout;
        if (options.timeout) {
          timeout = setTimeout(function () {
            _dialoghelper.default.close(dlg);
          }, options.timeout);
        }
        var refreshPromise;
        if (useVirtualScroller) {
          refreshPromise = refreshItemsContainer.call(dlg);
        }
        openingPromise.then(function () {
          _dialoghelper.default.positionDialog(dlg);
        });
        return openedPromise.then(function () {
          (refreshPromise || Promise.resolve()).then(autoFocus.bind(dlg));
          if (itemsContainer.virtualScroller) {
            itemsContainer.virtualScroller.onResized();
          }
          return closePromise.then(function () {
            instance.dlg = null;
            if (timeout) {
              clearTimeout(timeout);
              timeout = null;
            }
            if (!isResolved) {
              var resolveResult = getResolveResult();
              if (resolveResult != null) {
                if (options.callback) {
                  options.callback(resolveResult);
                }
                return resolveResult;
              } else {
                return Promise.reject();
              }
            }
          });
        });
      }).then(resolve, reject);
    });
  };
  ActionSheet.prototype.refreshItems = function () {
    var _this$dlg;
    var itemsContainer = (_this$dlg = this.dlg) == null ? void 0 : _this$dlg.querySelector('.itemsContainer');
    if (itemsContainer) {
      itemsContainer.refreshItems();
    }
  };
  ActionSheet.prototype.isShowing = function () {
    var dlg = this.dlg;
    return dlg != null;
  };
  ActionSheet.prototype.autoFocus = function (options) {
    console.log('focusing actionsheet');
    autoFocusInternal(this.dlg, options);
  };
  ActionSheet.prototype.close = function () {
    var dlg = this.dlg;
    if (dlg) {
      _dialoghelper.default.close(dlg);
    }
  };
  ActionSheet.prototype.destroy = function () {
    var _this$dlg2;
    var itemsContainer = (_this$dlg2 = this.dlg) == null ? void 0 : _this$dlg2.querySelector('.itemsContainer');
    if (itemsContainer) {
      itemsContainer.pause();
    }
    this.dlg = null;
  };
  function show(options) {
    var actionSheet = new ActionSheet();
    return actionSheet.show(options).then(function (result) {
      actionSheet.destroy();
      return Promise.resolve(result);
    }, function (result) {
      actionSheet.destroy();
      return Promise.reject(result);
    });
  }
  var _default = _exports.default = {
    show: show,
    constructor: ActionSheet
  };
});
