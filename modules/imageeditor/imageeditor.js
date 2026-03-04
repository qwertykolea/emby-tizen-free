define(["exports", "./../emby-apiclient/connectionmanager.js", "./../dom.js", "./../common/globalize.js", "./../layoutmanager.js", "./../loading/loading.js", "./../dialoghelper/dialoghelper.js", "./../cardbuilder/cardbuilder.js", "./../focusmanager.js", "./../common/servicelocator.js", "./../emby-elements/emby-button/emby-button.js", "./../emby-elements/emby-scroller/emby-scroller.js", "./../emby-elements/emby-button/paper-icon-button-light.js", "./../emby-elements/emby-dialogclosebutton/emby-dialogclosebutton.js"], function (_exports, _connectionmanager, _dom, _globalize, _layoutmanager, _loading, _dialoghelper, _cardbuilder, _focusmanager, _servicelocator, _embyButton, _embyScroller, _paperIconButtonLight, _embyDialogclosebutton) {
  Object.defineProperty(_exports, "__esModule", {
    value: true
  });
  _exports.default = void 0;
  /* jshint module: true */

  require(['formDialogStyle', 'css!modules/imageeditor/imageeditor.css']);
  var currentItemId;
  var currentServerId;
  var hasChanges = false;
  function getItemInfo() {
    _loading.default.show();
    var apiClient = _connectionmanager.default.getApiClient(currentServerId);
    return apiClient.getItem(apiClient.getCurrentUserId(), currentItemId, {
      ExcludeFields: 'Chapters,MediaSources,MediaStreams,People,Overview,Subviews'
    }).then(function (item) {
      return apiClient.getItemImageInfos(currentItemId).then(function (imageInfos) {
        return apiClient.getRemoteImageProviders({
          itemId: currentItemId
        }).then(function (providers) {
          var itemInfo = {
            item: item,
            imageInfos: imageInfos,
            providers: providers
          };
          _loading.default.hide();
          return itemInfo;
        });
      });
    });
  }
  function addListeners(container, className, eventName, fn) {
    container.addEventListener(eventName, function (e) {
      var elem = e.target.closest('.' + className);
      if (elem) {
        fn.call(elem, e);
      }
    });
  }
  function getImageUrl(item, apiClient, type, index, options) {
    if (!options) {
      options = {};
    }
    options.type = type;
    options.index = index;
    var itemId;
    if (type === 'Backdrop') {
      options.tag = item.BackdropImageTags[index];
      itemId = item.Id || item.ItemId;
    } else if (type === 'Primary') {
      options.tag = item.PrimaryImageTag || item.ImageTags[type];
      itemId = item.PrimaryImageItemId || item.Id || item.ItemId;
    } else {
      options.tag = item.ImageTags[type];
      itemId = item.Id || item.ItemId;
    }
    if (!options.tag) {
      return null;
    }

    // For search hints
    return apiClient.getImageUrl(itemId, options);
  }
  function setImageProperties(image, itemInfo, apiClient) {
    var item = itemInfo.item;
    image.Type = 'ItemImage';
    image.ServerId = item.ServerId;
    image.Id = item.Id + '_' + 'ItemImage' + '_' + image.imageType + '_' + (image.ImageIndex || 0);
    image.ItemId = item.Id;
    image.OwnerItem = item;
    image.Providers = itemInfo.providers;
    image.Name = _globalize.default.translate(image.ImageType);
    if (image.ImageType === 'Backdrop') {
      image.ImageUrl = getImageUrl(item, apiClient, image.ImageType, image.ImageIndex);
    } else {
      image.ImageTags = {};
      image.ImageTags[image.ImageType] = item.ImageTags ? item.ImageTags[image.ImageType] : null;
      if (image.ImageType === 'Primary' && !image.ImageTags[image.ImageType]) {
        image.PrimaryImageTag = item.PrimaryImageTag;
        image.PrimaryImageItemId = item.PrimaryImageItemId;
      } else {
        if (image.ImageTags[image.ImageType]) {
          image.ImageUrl = getImageUrl(item, apiClient, image.ImageType);
        }
      }
      image.ImageTag = image.ImageTags[image.ImageType];
      if (image.ImageType === 'Primary' && itemInfo.item.Type === 'TvChannel') {
        image.Name = _globalize.default.translate('LogoDark');
      }
    }
  }
  function getImage(images, type) {
    for (var i = 0, length = images.length; i < length; i++) {
      var image = images[i];
      if (image.ImageType === type) {
        return image;
      }
    }
    return null;
  }
  function getStandardImages() {
    return getItemInfo().then(function (itemInfo) {
      var item = itemInfo.item;
      var imageInfos = itemInfo.imageInfos;
      var types = ['Primary'];

      // For channels don't show the Logo type as it's redundant to Primary, unless there happens to be an image assigned
      if (item.Type !== 'TvChannel' || item.ImageTags && item.ImageTags.Logo) {
        types.push('Logo');
      }
      var apiClient = _connectionmanager.default.getApiClient(item);
      if (item.Type === 'TvChannel') {
        types.push('LogoLight');
        types.push('LogoLightColor');
      }
      types.push('Thumb');
      types.push('Banner');
      types.push('Disc');
      types.push('Art');
      if (item.Type === 'Game') {
        types.push('Box');
      }
      var result = [];
      for (var i = 0, length = types.length; i < length; i++) {
        var imageInfo = getImage(imageInfos, types[i]) || {
          ImageType: types[i]
        };
        setImageProperties(imageInfo, itemInfo, apiClient);
        result.push(imageInfo);
      }
      return {
        Items: result,
        TotalRecordCount: result.length
      };
    });
  }
  function getBackdropImages() {
    return getItemInfo().then(function (itemInfo) {
      var item = itemInfo.item;
      var imageInfos = itemInfo.imageInfos.filter(function (t) {
        return t.ImageType === 'Backdrop';
      });
      var result = [];
      var backdropImageTags = item.BackdropImageTags || [];
      var apiClient = _connectionmanager.default.getApiClient(item);
      for (var i = 0, length = imageInfos.length; i < length; i++) {
        var imageInfo = imageInfos[i];
        imageInfo.ImageTag = backdropImageTags[i];
        imageInfo.ImageIndex = i;
        imageInfo.TotalImages = imageInfos.length;
        setImageProperties(imageInfo, itemInfo, apiClient);
        result.push(imageInfo);
      }
      return {
        Items: result,
        TotalRecordCount: result.length
      };
    });
  }
  function getStandardImagesListOptions() {
    var fields = ['ItemImageName'];
    fields.push('Resolution');
    if (!_layoutmanager.default.tv) {
      fields.push('ImageEditorStandardButtons');
    }
    return {
      renderer: _cardbuilder.default,
      options: {
        fields: fields,
        shape: 'backdrop',
        multiSelect: false,
        defaultBackground: true,
        cardLayout: true,
        cardClass: 'imageEditorCard',
        cardDefaultTextClass: 'imageEditorCardDefaultText',
        action: _layoutmanager.default.tv ? 'menu' : 'none',
        addImageSizeToUrl: true,
        textLinks: false,
        cardFooterAside: false,
        draggable: false,
        playQueueIndicator: false
      },
      virtualScrollLayout: 'vertical-grid',
      playQueueIndicator: false
    };
  }
  function getBackdropImagesListOptions(items) {
    var fields = [];
    fields.push('FilenameOrName');
    fields.push('Resolution');
    if (!_layoutmanager.default.tv) {
      fields.push('ImageEditorBackdropButtons');
    }
    var enableDragReorder = items.length > 1;
    return {
      renderer: _cardbuilder.default,
      options: {
        fields: fields,
        shape: 'backdrop',
        multiSelect: false,
        cardClass: 'imageEditorCard',
        cardDefaultTextClass: 'imageEditorCardDefaultText',
        defaultBackground: true,
        cardLayout: true,
        imageFallback: false,
        action: _layoutmanager.default.tv ? 'menu' : 'none',
        addImageSizeToUrl: true,
        textLinks: false,
        cardFooterAside: false,
        dragReorder: enableDragReorder,
        draggable: enableDragReorder,
        playQueueIndicator: false
      },
      virtualScrollLayout: 'vertical-grid'
    };
  }
  function refreshItemContainers(context) {
    var standardImagesItemsContainer = context.querySelector('.images');
    var backdropImagesItemsContainer = context.querySelector('.backdrops');
    var promises = [];
    promises.push(standardImagesItemsContainer.resume({
      refresh: true
    }));
    promises.push(backdropImagesItemsContainer.resume({
      refresh: true
    }));
    return Promise.all(promises).then(function () {
      _focusmanager.default.autoFocus(context, {
        skipIfNotEnabled: true
      });
    });
  }
  function onItemChanged(context) {
    refreshItemContainers(context);
  }
  function showImageDownloader(context, imageType) {
    Emby.importModule('./modules/imagedownloader/imagedownloader.js').then(function (ImageDownloader) {
      getItemInfo().then(function (itemInfo) {
        new ImageDownloader().show({
          item: itemInfo.item,
          imageType: imageType
        }).then(function () {
          hasChanges = true;
          onItemChanged(context);
        });
      });
    });
  }
  function onAddButtonClick(e) {
    var imageType = this.getAttribute('data-imagetype');
    Emby.importModule('./modules/imageuploader/imageuploader.js').then(function (imageUploader) {
      getItemInfo().then(function (itemInfo) {
        imageUploader.show({
          imageType: imageType,
          item: itemInfo.item
        }).then(function (hasChanged) {
          if (hasChanged) {
            hasChanges = true;
            onItemChanged(e.target.closest('.formDialog'));
          }
        });
      });
    });
  }
  function initEditor(context, options, itemInfo) {
    addListeners(context, 'btnBrowseAllImages', 'click', function () {
      showImageDownloader(context, this.getAttribute('data-imagetype'));
    });
    addListeners(context, 'btnAddImage', 'click', onAddButtonClick);
    var standardImagesItemsContainer = context.querySelector('.images');
    standardImagesItemsContainer.fetchData = getStandardImages;
    standardImagesItemsContainer.getListOptions = getStandardImagesListOptions;
    standardImagesItemsContainer.monitorItems = [itemInfo.item.Id];
    standardImagesItemsContainer.setAttribute('data-monitorids', itemInfo.item.Id);
    var backdropImagesItemsContainer = context.querySelector('.backdrops');
    backdropImagesItemsContainer.fetchData = getBackdropImages;
    backdropImagesItemsContainer.getListOptions = getBackdropImagesListOptions;
    backdropImagesItemsContainer.setAttribute('data-monitorids', itemInfo.item.Id);
    if (_servicelocator.appHost.supports('fileinput')) {
      context.querySelector('.btnAddImage').classList.remove('hide');
    } else {
      context.querySelector('.btnAddImage').classList.add('hide');
    }
    if (itemInfo.providers.length) {
      context.querySelector('.btnBrowseAllImages').classList.remove('hide');
    } else {
      context.querySelector('.btnBrowseAllImages').classList.add('hide');
    }
    if (itemInfo.item.Type === 'TvChannel') {
      context.querySelector('.tvChannelHelp').classList.remove('hide');
    } else {
      context.querySelector('.tvChannelHelp').classList.add('hide');
    }
  }
  function onItemsContainerUpgraded() {
    refreshItemContainers(this);
  }
  function onOpened() {
    var standardImagesItemsContainer = this.querySelector('.images');
    if (standardImagesItemsContainer.resume) {
      refreshItemContainers(this);
    } else {
      _dom.default.addEventListener(standardImagesItemsContainer, 'upgraded', onItemsContainerUpgraded, {
        once: true
      });
    }
  }
  function showEditor(options, resolve, reject) {
    currentItemId = options.itemId;
    currentServerId = options.serverId;
    _loading.default.show();
    return Promise.all([require(['text!modules/imageeditor/imageeditor.template.html']),
    // preload this now to prevent double loading by the itemsContainers
    getItemInfo()]).then(function (responses) {
      var template = responses[0][0];
      var itemInfo = responses[1];
      var dialogOptions = {
        removeOnClose: true,
        scrollY: false
      };
      if (_layoutmanager.default.tv) {
        dialogOptions.size = 'fullscreen';
      } else {
        dialogOptions.size = 'fullscreen-border';
      }
      var dlg = _dialoghelper.default.createDialog(dialogOptions);
      dlg.classList.add('formDialog');
      dlg.innerHTML = _globalize.default.translateDocument(template, 'sharedcomponents');
      initEditor(dlg, options, itemInfo);
      dlg.addEventListener('opened', onOpened);
      return _dialoghelper.default.open(dlg).then(function () {
        currentItemId = null;
        currentServerId = null;
        _loading.default.hide();
        if (hasChanges) {
          return Promise.resolve();
        } else {
          return Promise.reject();
        }
      });
    });
  }
  var _default = _exports.default = {
    show: function (options) {
      hasChanges = false;
      return showEditor(options);
    }
  };
});
