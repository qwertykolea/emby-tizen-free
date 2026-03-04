define(["exports", "./../emby-apiclient/connectionmanager.js", "./../dom.js", "./../common/playback/playbackmanager.js", "./../common/methodtimer.js"], function (_exports, _connectionmanager, _dom, _playbackmanager, _methodtimer) {
  Object.defineProperty(_exports, "__esModule", {
    value: true
  });
  _exports.default = void 0;
  /* jshint module: true */

  var uiDependencies = ['css!modules/backdrop/style.css'];
  var supportsAsyncDecodedImages = _dom.default.supportsAsyncDecodedImages();
  var supportsObjectFit = CSS.supports('object-fit', 'contain');
  var supportsImgSrcSet = 'srcset' in HTMLImageElement.prototype;
  var RotationIntervalMs = 24000;
  function loadDependencies() {
    var deps = uiDependencies;
    if (deps.length) {
      require(deps);
    }
  }

  // this will have to be this way until a better option is identified
  loadDependencies();
  var supportsCssAnimations = CSS.supports('animation-name', 'a');
  function enableAnimation() {
    return supportsCssAnimations && _dom.default.supportsEventListenerOnce();
  }
  function enableRotation() {
    if (!enableAnimation()) {
      // without animation the change will be too abrupt and won't look good
      return false;
    }
    return true;
  }
  function Backdrop() {}
  function mapImageSourceToUrl(source) {
    return source.url;
  }
  function getImageInfoId(imageInfo) {
    var id = imageInfo.id;
    if (id) {
      return id;
    }
    id = imageInfo.id = imageInfo.sources.map(mapImageSourceToUrl).join('|');
    return id;
  }
  function getFallbackImageSource(imageInfo) {
    return imageInfo.sources[imageInfo.sources.length - 1];
  }
  function mapSourceToString(source) {
    return source.url + ' ' + source.width + 'w';
  }
  function setSrcSetIntoImg(img, sources) {
    sources = sources.slice(0);
    sources.pop();
    img.sizes = '100vw';
    img.srcset = sources.map(mapSourceToString).join(',');
  }
  Backdrop.prototype.load = function (imageInfo, animate, parent, existingBackdropImage) {
    var img = new Image();
    img.setAttribute('data-id', getImageInfoId(imageInfo));
    img.setAttribute('draggable', 'false');
    img.setAttribute('fetchpriority', 'low');
    if (supportsObjectFit) {
      if (supportsAsyncDecodedImages) {
        img.setAttribute('decoding', 'async');
      }
      img.setAttribute('loading', 'lazy');
    }
    img.classList.add('backdropImage');
    if (imageInfo.coverImage === false) {
      img.classList.add('backdropImage-contain');
    }
    var self = this;
    this.previousBackdropImage = existingBackdropImage;
    var onload = function () {
      if (self.isDestroyed) {
        self.removePreviousBackdropImage();
        return;
      }
      var backdropImage = supportsObjectFit ? img : document.createElement('div');
      if (!supportsObjectFit) {
        backdropImage.style.backgroundImage = "url('" + getFallbackImageSource(imageInfo).url + "')";
      }
      backdropImage.classList.add('backdropImage', 'displayingBackdropImage');
      if (imageInfo.coverImage === false) {
        backdropImage.classList.add('backdropImage-contain');
      }
      self.elem = backdropImage;
      internalBackdrop(true);
      if (animate && enableAnimation()) {
        backdropImage.classList.add('backdropImageFadeIn');
      }
      if (!supportsObjectFit) {
        parent.appendChild(backdropImage);
      }
      img.style.visibility = null;
      if (!enableAnimation()) {
        self.removePreviousBackdropImage();
        return;
      }
      var onAnimationComplete = function () {
        _dom.default.removeEventListener(backdropImage, _dom.default.whichAnimationEvent(), onAnimationComplete, {
          once: true
        });
        _dom.default.removeEventListener(backdropImage, _dom.default.whichAnimationCancelEvent(), onAnimationComplete, {
          once: true
        });
        self.removePreviousBackdropImage();
      };
      _dom.default.addEventListener(backdropImage, _dom.default.whichAnimationEvent(), onAnimationComplete, {
        once: true
      });
      _dom.default.addEventListener(backdropImage, _dom.default.whichAnimationCancelEvent(), onAnimationComplete, {
        once: true
      });
    };
    img.onload = onload;
    if (supportsObjectFit) {
      img.style.visibility = 'hidden';
    }
    img.src = getFallbackImageSource(imageInfo).url;
    if (supportsImgSrcSet && supportsObjectFit && imageInfo.sources.length > 1) {
      setSrcSetIntoImg(img, imageInfo.sources);
    }
    if (supportsObjectFit) {
      parent.appendChild(img);
    }
    this.imageInfo = imageInfo;
  };
  Backdrop.prototype.removePreviousBackdropImage = function () {
    var existingBackdropImage = this.previousBackdropImage;
    if (existingBackdropImage) {
      this.previousBackdropImage = null;
      existingBackdropImage.remove();
    }
  };
  Backdrop.prototype.cancelAnimation = function () {
    var elem = this.elem;
    if (elem) {
      elem.classList.remove('backdropImageFadeIn');
      this.elem = null;
    }
  };
  Backdrop.prototype.destroy = function () {
    this.isDestroyed = true;
    this.cancelAnimation();
    this.removePreviousBackdropImage();
  };
  var backdropContainer;
  var backgroundContainer = document.querySelector('.backgroundContainer');
  function getBackdropContainer() {
    if (!backdropContainer) {
      backdropContainer = document.querySelector('.backdropContainer');
    }
    if (!backdropContainer) {
      backdropContainer = document.createElement('div');
      backdropContainer.classList.add('backdropContainer');
      document.body.insertBefore(backdropContainer, document.body.firstChild);
    }
    return backdropContainer;
  }
  var hasExternalBackdrop;
  var currentLoadingBackdrop;
  function clearBackdrop(clearAll) {
    clearRotation();
    if (currentLoadingBackdrop) {
      currentLoadingBackdrop.destroy();
      currentLoadingBackdrop = null;
    }
    var elem = getBackdropContainer();
    elem.innerHTML = '';
    if (clearAll) {
      hasExternalBackdrop = false;
    }
    internalBackdrop(false);
  }
  var hasInternalBackdrop;
  function setBackgroundContainerBackgroundEnabled() {
    if (hasInternalBackdrop || hasExternalBackdrop) {
      backgroundContainer.classList.add('withBackdrop');
      getBackdropContainer().classList.add('withBackdrop');
    } else {
      backgroundContainer.classList.remove('withBackdrop');
      getBackdropContainer().classList.remove('withBackdrop');
    }
  }
  function internalBackdrop(enabled) {
    hasInternalBackdrop = enabled;
    setBackgroundContainerBackgroundEnabled();
  }
  function externalBackdrop(enabled) {
    hasExternalBackdrop = enabled;
    setBackgroundContainerBackgroundEnabled();
  }
  function setBackdropImage(imageInfo, animate) {
    var elem = getBackdropContainer();
    var existingBackdropImage = elem.querySelector('.displayingBackdropImage');
    if (currentLoadingBackdrop) {
      if (getImageInfoId(currentLoadingBackdrop.imageInfo) === getImageInfoId(imageInfo)) {
        return;
      }
    }
    if (existingBackdropImage) {
      if (existingBackdropImage.getAttribute('data-id') === getImageInfoId(imageInfo)) {
        return;
      }
      existingBackdropImage.classList.remove('displayingBackdropImage');
    }
    if (currentLoadingBackdrop) {
      currentLoadingBackdrop.destroy();
      currentLoadingBackdrop = null;
    }
    var instance = new Backdrop();
    instance.load(imageInfo, animate, elem, existingBackdropImage);
    currentLoadingBackdrop = instance;
  }
  function getBackdropMaxWidth(widths) {
    var width = _dom.default.getWindowSize().innerWidth;
    if (widths.includes(width)) {
      return width;
    }
    var roundScreenTo = 100;
    width = Math.floor(width / roundScreenTo) * roundScreenTo;
    return Math.min(width, 1920);
  }
  function getImageSources(apiClient, itemId, imageOptions) {
    var widths = apiClient.getDefaultImageSizes();
    widths.push(getBackdropMaxWidth(widths));
    return apiClient.getImageUrls(itemId, imageOptions, {
      widths: widths
    });
  }
  function getPrimaryImageInfos(item, imageOptions, apiClient) {
    var _item$ImageTags;
    if ((_item$ImageTags = item.ImageTags) != null && _item$ImageTags.Primary || item.PrimaryImageTag) {
      var _item$ImageTags2;
      return [{
        sources: getImageSources(apiClient, item.PrimaryImageItemId || item.Id || item.ItemId, Object.assign(imageOptions, {
          type: 'Primary',
          tag: ((_item$ImageTags2 = item.ImageTags) == null ? void 0 : _item$ImageTags2.Primary) || item.PrimaryImageTag,
          EnableImageEnhancers: false
        })),
        coverImage: item.PrimaryImageAspectRatio && item.PrimaryImageAspectRatio >= 1.4
      }];
    }
    return [];
  }
  function getItemImageInfos(item, imageOptions, enablePrimaryImageBeforeInherited, allowPrimaryImage) {
    item = item.ProgramInfo || item;
    imageOptions = imageOptions || {};
    var apiClient = _connectionmanager.default.getApiClient(item);
    if (item.BackdropImageTags && item.BackdropImageTags.length > 0) {
      return item.BackdropImageTags.map(function (imgTag, index) {
        return {
          sources: getImageSources(apiClient, item.BackdropItemId || item.Id, Object.assign(imageOptions, {
            type: "Backdrop",
            tag: imgTag,
            index: index
          })),
          coverImage: true
        };
      });
    }
    if (enablePrimaryImageBeforeInherited) {
      var primaryImageUrls = getPrimaryImageInfos(item, imageOptions, apiClient);
      if (primaryImageUrls.length) {
        return primaryImageUrls;
      }
    }
    if (item.ParentBackdropItemId && item.ParentBackdropImageTags && item.ParentBackdropImageTags.length) {
      return item.ParentBackdropImageTags.map(function (imgTag, index) {
        return {
          sources: getImageSources(apiClient, item.ParentBackdropItemId, Object.assign(imageOptions, {
            type: "Backdrop",
            tag: imgTag,
            index: index
          })),
          coverImage: true
        };
      });
    }
    if (allowPrimaryImage) {
      var _primaryImageUrls = getPrimaryImageInfos(item, imageOptions, apiClient);
      if (_primaryImageUrls.length) {
        return _primaryImageUrls;
      }
      if (item.ParentPrimaryImageTag) {
        return [{
          sources: getImageSources(apiClient, item.ParentPrimaryImageItemId, Object.assign(imageOptions, {
            type: 'Primary',
            tag: item.ParentPrimaryImageTag,
            EnableImageEnhancers: false
          })),
          coverImage: false
        }];
      }
    }
    return [];
  }
  function getImageInfos(items, imageOptions, enablePrimaryImageBeforeInherited, allowPrimaryImage) {
    var list = [];
    for (var i = 0, length = items.length; i < length; i++) {
      var itemImages = getItemImageInfos(items[i], imageOptions, enablePrimaryImageBeforeInherited, allowPrimaryImage);
      list.push.apply(list, babelHelpers.toConsumableArray(itemImages));
    }
    return list;
  }
  function arraysEqual(a, b) {
    if (a === b) {
      return true;
    }
    if (a == null || b == null) {
      return false;
    }
    if (a.length !== b.length) {
      return false;
    }

    // If you don't care about the order of the elements inside
    // the array, you should sort both arrays here.

    for (var i = 0; i < a.length; ++i) {
      if (a[i] !== b[i]) {
        return false;
      }
    }
    return true;
  }
  var rotationInterval;
  var currentRotatingImages = [];
  var currentRotationIndex = -1;
  var animationEnabledByCaller;
  function getBackdropsFromOptions(items, options) {
    if (!options) {
      options = {};
    }
    return getImageInfos(items, options.imageOptions, options.enablePrimaryImageBeforeInherited, options.allowPrimaryImage);
  }
  function setBackdrops(items, options) {
    if (!options) {
      options = {};
    }
    var images = getImageInfos(items, options.imageOptions, options.enablePrimaryImageBeforeInherited, options.allowPrimaryImage);
    if (images.length) {
      startRotation(images, options.enableImageRotation, options.enableAnimation);
    } else {
      clearBackdrop();
    }
  }
  function startRotation(images, enableImageRotation, enableAnimation) {
    if (arraysEqual(images, currentRotatingImages)) {
      return;
    }
    clearRotation();
    currentRotatingImages = images;
    currentRotationIndex = -1;
    animationEnabledByCaller = enableAnimation !== false;
    if (images.length > 1 && enableImageRotation !== false && enableRotation()) {
      rotationInterval = new _methodtimer.default({
        onInterval: onRotationInterval,
        timeoutMs: RotationIntervalMs,
        type: 'interval'
      });
    }
    onRotationInterval(true);
  }
  function onRotationInterval(force) {
    // This is mainly for external players so that the UI is not animating in the background
    if (force !== true && _playbackmanager.default.isPlayingLocally(['Video', 'Game', 'Book'])) {
      return;
    }
    var newIndex = currentRotationIndex + 1;
    if (newIndex >= currentRotatingImages.length) {
      newIndex = 0;
    }
    currentRotationIndex = newIndex;
    setBackdropImage(currentRotatingImages[newIndex], animationEnabledByCaller);
    animationEnabledByCaller = true;
  }
  function clearRotation() {
    var interval = rotationInterval;
    if (interval) {
      interval.destroy();
    }
    rotationInterval = null;
    currentRotatingImages = [];
    currentRotationIndex = -1;
  }
  function setBackdrop(item, imageOptions) {
    var imageInfo;
    if (item) {
      if (typeof item === 'string') {
        imageInfo = {
          sources: [{
            url: item
          }],
          coverImage: true
        };
      } else {
        imageInfo = getImageInfos([item], imageOptions)[0];
      }
    }
    if (imageInfo) {
      clearRotation();
      setBackdropImage(imageInfo, true);
    } else {
      clearBackdrop();
    }
  }
  function hasBackdrop() {
    return currentLoadingBackdrop != null;
  }
  function getCurrentImageInfo() {
    var backdrop = currentLoadingBackdrop;
    return backdrop ? backdrop.imageInfo : null;
  }
  var _default = _exports.default = {
    getBackdropsFromOptions: getBackdropsFromOptions,
    setBackdrops: setBackdrops,
    setBackdrop: setBackdrop,
    clear: clearBackdrop,
    externalBackdrop: externalBackdrop,
    hasBackdrop: hasBackdrop,
    getCurrentImageInfo: getCurrentImageInfo
  };
});
