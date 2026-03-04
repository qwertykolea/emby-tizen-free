define(["exports", "./../emby-apiclient/connectionmanager.js", "./../common/globalize.js", "./../layoutmanager.js", "./../loading/loading.js", "./../dialoghelper/dialoghelper.js", "./../cardbuilder/cardbuilder.js", "./../focusmanager.js", "./../mediainfo/mediainfo.js", "./../emby-elements/emby-button/emby-button.js", "./../emby-elements/emby-select/emby-select.js", "./../emby-elements/emby-scroller/emby-scroller.js", "./../emby-elements/emby-toggle/emby-toggle.js", "./../emby-elements/emby-itemscontainer/emby-itemscontainer.js", "./../emby-elements/emby-button/paper-icon-button-light.js", "./../emby-elements/emby-dialogclosebutton/emby-dialogclosebutton.js"], function (_exports, _connectionmanager, _globalize, _layoutmanager, _loading, _dialoghelper, _cardbuilder, _focusmanager, _mediainfo, _embyButton, _embySelect, _embyScroller, _embyToggle, _embyItemscontainer, _paperIconButtonLight, _embyDialogclosebutton) {
  Object.defineProperty(_exports, "__esModule", {
    value: true
  });
  _exports.default = void 0;
  /* jshint module: true */

  // for button-item styles

  require(['formDialogStyle', 'material-icons']);
  function ImageDownloader() {}
  function getEditorHtml(options) {
    var html = '';
    html += '<div class="formDialogContent flex flex-direction-column" style="overflow:hidden;">';
    html += '<div is="emby-scroller" data-horizontal="false" data-forcescrollbar="true" data-focusscroll="true" class="flex flex-grow virtualScrollerScrollContainer">';
    html += '<div class="scrollSlider padded-left padded-right flex-grow">';
    html += '<div class=" padded-bottom flex align-items-center justify-content-center flex-wrap-wrap focuscontainer-x fieldItems">';
    html += '<div class="selectContainer selectContainer-inline fieldItems-item">';
    html += '<select is="emby-select" label="' + _globalize.default.translate('LabelSource') + '" class="selectImageProvider emby-select-inline">';
    html += '<option value="">' + _globalize.default.translate('All') + '</option>';
    html += '</select>';
    html += '</div>';
    html += '<div class="selectContainer selectContainer-inline fieldItems-item fldSelectImageType hide">';
    html += '<select is="emby-select" label="' + _globalize.default.translate('LabelType') + '" class="selectBrowsableImageType emby-select-inline">';
    html += '<option value="Primary">' + _globalize.default.translate('Primary') + '</option>';
    html += '<option value="Art">' + _globalize.default.translate('Art') + '</option>';
    html += '<option value="Backdrop">' + _globalize.default.translate('Backdrop') + '</option>';
    html += '<option value="Banner">' + _globalize.default.translate('Banner') + '</option>';
    html += '<option value="Disc">' + _globalize.default.translate('Disc') + '</option>';
    html += '<option value="Logo">' + _globalize.default.translate('Logo') + '</option>';
    //html += '<option value="LogoLight">' + globalize.translate('LogoLight') + '</option>';
    //html += '<option value="LogoLightColor">' + globalize.translate('LogoLightColor') + '</option>';
    html += '<option value="Thumb">' + _globalize.default.translate('Thumb') + '</option>';
    html += '</select>';
    html += '</div>';
    html += '<label class="toggleContainer fieldItems-item" style="width:auto;margin-bottom:0;">';
    html += '<input class="chkAllLanguages" type="checkbox" is="emby-toggle" label="' + _globalize.default.translate('HeaderAllLanguages') + '" />';
    html += '</label>';
    var fldShowSeriesImagesClass = 'fldShowSeriesImages';
    var item = options.item;
    var apiClient = _connectionmanager.default.getApiClient(item);
    switch (item.Type) {
      case 'Season':
        if (!apiClient.isMinServerVersion('4.9.1.90')) {
          fldShowSeriesImagesClass += ' hide';
        }
        break;
      default:
        fldShowSeriesImagesClass += ' hide';
        break;
    }
    html += '<label class="toggleContainer fieldItems-item ' + fldShowSeriesImagesClass + '" style="width:auto;margin-bottom:0;">';
    html += '<input class="chkSeriesImages" type="checkbox" is="emby-toggle" label="' + _globalize.default.translate('HeaderShowSeriesImages') + '" />';
    html += '</label>';
    html += '</div>';
    html += '<div is="emby-itemscontainer" data-virtualscrolllayout="vertical-grid" class="itemsContainer vertical-wrap padded-bottom-page">';

    // itemsContainer
    html += '</div>';

    // scrollSlider
    html += '</div>';

    // emby-scroller
    html += '</div>';

    // formDialogContent
    html += '</div>';
    return html;
  }
  function autoFocus() {
    var dlg = this.dlg;
    _loading.default.hide();
    _focusmanager.default.autoFocus(dlg, {
      skipIfNotEnabled: true
    });
  }
  function onDialogClosed() {
    var result = this.result;
    this.cleanup();
    _loading.default.hide();
    if (!result) {
      return Promise.reject();
    }
    return Promise.resolve();
  }
  function onCardAction(e) {
    var options = this.options;
    var item = e.detail.item;
    var mediaItem = options.item;
    var downloadOptions = {
      itemId: mediaItem.Id
    };
    downloadOptions.Type = item.Type;
    if (options.imageIndex != null) {
      downloadOptions.ImageIndex = options.imageIndex;
    }
    downloadOptions.ImageUrl = item.Url;
    downloadOptions.ProviderName = item.ProviderName;
    _loading.default.show();
    var apiClient = _connectionmanager.default.getApiClient(mediaItem);
    var instance = this;
    apiClient.downloadRemoteImage(downloadOptions).then(function () {
      instance.result = true;
      instance.closeDialog();
    });
  }
  function getDisplayUrl(url, apiClient) {
    return apiClient.getUrl("Images/Remote", {
      api_key: apiClient.accessToken(),
      imageUrl: url
    });
  }
  function normalizeImage(image) {
    var options = this.options;
    var apiClient = _connectionmanager.default.getApiClient(options.item);
    image.Name = image.ProviderName;

    // for cardBuilder
    image.ImageUrl = getDisplayUrl(image.ThumbnailUrl || image.Url, apiClient);
    image.OriginalImageUrl = getDisplayUrl(image.Url, apiClient);
    return image;
  }
  function normalizeResult(result) {
    var providersHtml = result.Providers.map(function (p) {
      return '<option value="' + p + '">' + p + '</option>';
    });
    var selectImageProvider = this.dlg.querySelector('.selectImageProvider');
    selectImageProvider.innerHTML = '<option value="">' + _globalize.default.translate('All') + '</option>' + providersHtml;
    selectImageProvider.value = this.options.imageProvider || '';
    result.Items = result.Images;
    result.Images = null;
    result.Items.forEach(normalizeImage.bind(this));
    return result;
  }
  ImageDownloader.prototype.getItems = function (query) {
    var options = this.options;
    var item = options.item;
    var apiClient = _connectionmanager.default.getApiClient(item);
    return apiClient.getAvailableRemoteImages(Object.assign({
      Type: options.imageType || 'Primary',
      IncludeAllLanguages: options.allLanguages,
      EnableSeriesImages: options.seriesImages,
      ProviderName: options.imageProvider,
      itemId: item.Id
    }, query)).then(normalizeResult.bind(this));
  };
  ImageDownloader.prototype.getCardOptions = function (items) {
    var options = this.options;
    var imageType = options.imageType;
    var currentItemType = options.item.Type;
    var currentMediaType = options.item.MediaType;
    var shape = 'auto';
    if (imageType === "Backdrop" || imageType === "Thumb") {
      shape = 'backdrop';
    } else if (imageType === "Art" || imageType === "Logo" || imageType === "LogoLight" || imageType === "LogoLightColor") {
      shape = 'backdrop';
    } else if (imageType === "Banner") {
      shape = 'banner';
    } else if (imageType === "Disc") {
      shape = 'square';
    } else {
      if (currentItemType === "Episode") {
        shape = 'backdrop';
      } else if (currentItemType === "MusicAlbum" || currentItemType === "MusicArtist" || currentMediaType === "Audio") {
        shape = 'square';
      } else {
        shape = 'portrait';
      }
    }
    return {
      shape: shape,
      fields: ['Name', 'DownloadableImageInfo'],
      coverImage: imageType !== "Logo",
      multiSelect: false,
      contextMenu: false,
      hoverDownloadButton: true,
      action: 'custom',
      textLinks: false,
      lazy: 2,
      previewImageButton: true,
      draggable: false,
      playQueueIndicator: false
    };
  };
  ImageDownloader.prototype.getListOptions = function (items) {
    return {
      renderer: _cardbuilder.default,
      options: this.getCardOptions(items),
      virtualScrollLayout: 'vertical-grid'
    };
  };
  function onItemsContainerUpgraded() {
    _loading.default.show();
    this.itemsContainer.resume({
      refresh: true
    }).then(autoFocus.bind(this));
  }
  function onOpened() {
    var instance = this;
    var itemsContainer = this.itemsContainer;
    itemsContainer.waitForCustomElementUpgrade().then(function () {
      onItemsContainerUpgraded.call(instance);
    });
  }
  function onImageTypeChange(e) {
    this.options.imageType = e.target.value;
    this.options.imageProvider = null;
    _loading.default.show();
    this.itemsContainer.refreshItems().then(_loading.default.hide.bind(_loading.default));
  }
  function onImageProviderChange(e) {
    this.options.imageProvider = e.target.value;
    _loading.default.show();
    this.itemsContainer.refreshItems().then(_loading.default.hide.bind(_loading.default));
  }
  function onAllLanguagesChange(e) {
    this.options.allLanguages = e.target.checked;
    _loading.default.show();
    this.itemsContainer.refreshItems().then(_loading.default.hide.bind(_loading.default));
  }
  function onSeriesImagesChanged(e) {
    this.options.seriesImages = e.target.checked;
    _loading.default.show();
    this.itemsContainer.refreshItems().then(_loading.default.hide.bind(_loading.default));
  }
  ImageDownloader.prototype.show = function (options) {
    var dialogOptions = {
      removeOnClose: true,
      scrollY: false,
      autoFocus: false
    };
    if (_layoutmanager.default.tv) {
      dialogOptions.size = 'fullscreen';
    } else {
      dialogOptions.size = 'fullscreen-border';
    }
    var dlg = _dialoghelper.default.createDialog(dialogOptions);
    dlg.classList.add('formDialog');
    var html = '';
    html += '<div class="formDialogHeader">';
    html += '<button type="button" is="emby-dialogclosebutton"></button>';
    html += '<h3 class="formDialogHeaderTitle">';
    html += _globalize.default.translate('HeaderSearchForImages');
    html += '</h3>';
    html += '</div>';
    html += getEditorHtml(options);
    dlg.innerHTML = html;
    if (!options.imageType) {
      dlg.querySelector('.fldSelectImageType').classList.remove('hide');
    }
    this.dlg = dlg;
    this.options = options;
    var selectImageType = dlg.querySelector('.selectBrowsableImageType');
    selectImageType.value = options.imageType || 'Primary';
    selectImageType.addEventListener('change', onImageTypeChange.bind(this));
    dlg.querySelector('.selectImageProvider').addEventListener('change', onImageProviderChange.bind(this));
    dlg.querySelector('.chkAllLanguages').addEventListener('change', onAllLanguagesChange.bind(this));
    dlg.querySelector('.chkSeriesImages').addEventListener('change', onSeriesImagesChanged.bind(this));
    var itemsContainer = dlg.querySelector('.itemsContainer');
    itemsContainer.addEventListener('action-null', onCardAction.bind(this));
    itemsContainer.fetchData = this.getItems.bind(this);
    itemsContainer.getListOptions = this.getListOptions.bind(this);
    this.itemsContainer = itemsContainer;
    dlg.addEventListener('opened', onOpened.bind(this));
    var dlgClosedFn = onDialogClosed.bind(this);
    return _dialoghelper.default.open(dlg).then(dlgClosedFn, dlgClosedFn);
  };
  ImageDownloader.prototype.closeDialog = function () {
    var dlg = this.dlg;
    if (dlg) {
      _dialoghelper.default.close(dlg);
    }
  };
  ImageDownloader.prototype.cleanup = function () {
    this.options = null;
    this.dlg = null;
    this.itemsContainer = null;
  };
  var _default = _exports.default = ImageDownloader;
});
