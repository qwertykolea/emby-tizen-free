define(["exports", "./../skinmanager.js"], function (_exports, _skinmanager) {
  Object.defineProperty(_exports, "__esModule", {
    value: true
  });
  _exports.default = void 0;
  /* jshint module: true */

  // find the most frequently appearing value in the list
  function mode(array) {
    if (!array.length) {
      return null;
    }
    var modeMap = {};
    var maxEl = array[0],
      maxCount = 1;
    for (var i = 0; i < array.length; i++) {
      var el = array[i];
      var newValue = void 0;
      if (modeMap[el] == null) {
        modeMap[el] = newValue = 1;
      } else {
        newValue = modeMap[el] + 1;
        modeMap[el] = newValue;
      }
      if (newValue > maxCount) {
        maxEl = el;
        maxCount = newValue;
      }
    }
    return maxEl;
  }
  function normalizeAspect(result) {
    var aspect16x9 = 16 / 9;
    if (result >= 1.555555) {
      return aspect16x9;
    }
    var aspectFourThree = 4 / 3;
    if (result >= 1.133333) {
      return aspectFourThree;
    }
    if (result >= 0.8333333) {
      return 1;
    }
    var aspect2x3 = 2 / 3;
    return aspect2x3;
  }
  function getPrimaryImageAspectRatio(items, options) {
    var values = [];
    var showProgramImage = options == null ? void 0 : options.showCurrentProgramImage;
    var preferSeriesImage = options == null ? void 0 : options.preferSeriesImage;
    for (var i = 0, length = items.length; i < length; i++) {
      var item = items[i];
      var imageItem = void 0;
      if (showProgramImage) {
        imageItem = item.CurrentProgram || item;
      } else {
        imageItem = item.ProgramInfo || item;
      }
      var ratio = void 0;
      if (preferSeriesImage && imageItem.SeriesPrimaryImageTag) {
        ratio = 2 / 3;
      } else {
        ratio = imageItem.PrimaryImageAspectRatio || 0;
      }
      if (!ratio) {
        continue;
      }
      values[values.length] = normalizeAspect(ratio);
    }
    if (!values.length) {
      return null;
    }

    //return values[Math.floor(values.length / 2)];
    return mode(values);
  }
  function getDefaultShape(items) {
    var firstItem = items[0];
    if (firstItem) {
      var firstItemType = firstItem.Type;
      switch (firstItemType) {
        case 'Movie':
        case 'SeriesTimer':
        case 'Timer':
          return 'portrait';
        case 'Episode':
        case 'Program':
        case 'Video':
          return 'backdrop';
        default:
          break;
      }
    }
    return 'square';
  }
  function getShapeFromAspect(primaryImageAspectRatio) {
    if (primaryImageAspectRatio) {
      if (primaryImageAspectRatio >= 3) {
        return 'banner';
      } else if (primaryImageAspectRatio >= 1.4) {
        return 'backdrop';
      } else if (primaryImageAspectRatio > 1.2) {
        return 'fourThree';
      } else if (primaryImageAspectRatio > 0.73) {
        return 'square';
      } else {
        return 'portrait';
      }
    }
    return null;
  }
  function getShape(items, options) {
    var shape = null;
    var primaryImageAspectRatio = getPrimaryImageAspectRatio(items, options);
    shape = getShapeFromAspect(primaryImageAspectRatio);
    if (!shape) {
      shape = options.defaultShape || getDefaultShape(items);
    }
    return shape;
  }
  function getAspectFromShape(shape, options) {
    switch (shape) {
      case 'portrait':
        return {
          aspect: 2 / 3,
          aspectCss: '2/3'
        };
      case 'backdrop':
        return {
          aspect: 16 / 9,
          aspectCss: '16/9'
        };
      case 'square':
        return {
          aspect: 1,
          aspectCss: '1'
        };
      case 'fourThree':
        return {
          aspect: 4 / 3,
          aspectCss: '4/3'
        };
      case 'banner':
        if (options.sideFooter) {
          return {
            aspect: 1,
            aspectCss: '1'
          };
        }
        return {
          aspect: 1000 / 185,
          aspectCss: '1000/185'
        };
      default:
        console.error('Unrecognized shape: ' + shape + '--' + new Error());
        return {};
    }
  }
  function getImageUrl(item, apiClient, options, shape) {
    var _item$UserData;
    var width = options.width;
    var adjustForPixelRatio = options.adjustForPixelRatio;
    var imgUrl;
    var imageType;
    if (item.ImageUrl) {
      imgUrl = item.ImageUrl;
      if (options.addImageSizeToUrl && options.width) {
        imgUrl += "&maxWidth=" + width;
      }
      return {
        imgUrl: imgUrl,
        aspect: item.PrimaryImageAspectRatio
      };
    }
    var height = null;
    var primaryImageAspectRatio = item.PrimaryImageAspectRatio;
    var forceName = false;
    var imageAspect;
    var ignorePrimaryImage;
    var ignoreChapterImage;
    if (options.hideEpisodeSpoilerInfo && ((_item$UserData = item.UserData) == null ? void 0 : _item$UserData.Played) === false) {
      switch (item.Type) {
        case 'Chapter':
          switch (item.ItemType) {
            case 'Episode':
              ignorePrimaryImage = true;
              ignoreChapterImage = true;
              break;
            default:
              break;
          }
          break;
        case 'Episode':
          ignorePrimaryImage = true;
          ignoreChapterImage = true;
          break;
        default:
          break;
      }
    }
    var imageTags = item.ImageTags;
    var uiAspect = options.uiAspect;
    var keepAnimation = options.keepImageAnimation || null;
    var preferThumb = options.preferThumb || ignoreChapterImage;
    if (preferThumb && imageTags && imageTags.Thumb) {
      imgUrl = apiClient.getImageUrl(item.Id, {
        type: "Thumb",
        maxWidth: width,
        tag: imageTags.Thumb,
        adjustForPixelRatio: adjustForPixelRatio,
        keepAnimation: keepAnimation
      });
      imageAspect = 16 / 9;
      imageType = 'Thumb';
    } else if ((options.preferBanner || shape === 'banner') && imageTags && imageTags.Banner) {
      imgUrl = apiClient.getImageUrl(item.Id, {
        type: "Banner",
        maxWidth: width,
        tag: imageTags.Banner,
        adjustForPixelRatio: adjustForPixelRatio,
        keepAnimation: keepAnimation
      });
      imageAspect = 1000 / 185;
    } else if (options.preferDisc && imageTags && imageTags.Disc) {
      imgUrl = apiClient.getImageUrl(item.Id, {
        type: "Disc",
        maxWidth: width,
        tag: imageTags.Disc,
        adjustForPixelRatio: adjustForPixelRatio,
        keepAnimation: keepAnimation
      });
      imageAspect = 1;
    } else if (options.preferLogo && imageTags && imageTags.Logo) {
      imgUrl = apiClient.getImageUrl(item.Id, {
        type: 'Logo',
        maxWidth: width,
        tag: imageTags.Logo,
        adjustForPixelRatio: adjustForPixelRatio,
        keepAnimation: keepAnimation
      });
      imageAspect = 16 / 9;
      imageType = 'Logo';
    } else if (options.preferLogo && item.ParentLogoImageTag && item.ParentLogoItemId) {
      imgUrl = apiClient.getImageUrl(item.ParentLogoItemId, {
        type: 'Logo',
        maxWidth: width,
        tag: item.ParentLogoImageTag,
        adjustForPixelRatio: adjustForPixelRatio,
        keepAnimation: keepAnimation
      });
      imageAspect = 16 / 9;
      imageType = 'Logo';
    } else if (options.showChannelLogo && item.ChannelPrimaryImageTag && item.ChannelId) {
      imgUrl = apiClient.getImageUrl(item.ChannelId, {
        type: "Primary",
        maxWidth: width,
        tag: item.ChannelPrimaryImageTag,
        adjustForPixelRatio: adjustForPixelRatio,
        keepAnimation: keepAnimation
      });
      imageAspect = 16 / 9;
    } else if (preferThumb && item.ParentThumbItemId && options.inheritThumb !== false && item.MediaType !== 'Photo') {
      imgUrl = apiClient.getImageUrl(item.ParentThumbItemId, {
        type: "Thumb",
        maxWidth: width,
        tag: item.ParentThumbImageTag,
        adjustForPixelRatio: adjustForPixelRatio,
        keepAnimation: keepAnimation
      });
      imageAspect = 16 / 9;
      imageType = 'Thumb';
    } else if (preferThumb && item.BackdropImageTags && item.BackdropImageTags.length) {
      imgUrl = apiClient.getImageUrl(item.Id, {
        type: "Backdrop",
        maxWidth: width,
        tag: item.BackdropImageTags[0],
        adjustForPixelRatio: adjustForPixelRatio,
        keepAnimation: keepAnimation
      });
      forceName = true;
      imageAspect = 16 / 9;
      imageType = 'Backdrop';
    } else if (preferThumb && item.ParentBackdropImageTags && item.ParentBackdropImageTags.length && options.inheritThumb !== false && item.Type === 'Episode') {
      imgUrl = apiClient.getImageUrl(item.ParentBackdropItemId, {
        type: "Backdrop",
        maxWidth: width,
        tag: item.ParentBackdropImageTags[0],
        adjustForPixelRatio: adjustForPixelRatio,
        keepAnimation: keepAnimation
      });
      if (preferThumb) {
        forceName = true;
      }
      imageAspect = 16 / 9;
      imageType = 'Backdrop';
    } else if (item.SeriesPrimaryImageTag && options.preferSeriesImage) {
      imgUrl = apiClient.getImageUrl(item.SeriesId, {
        type: "Primary",
        maxWidth: width,
        tag: item.SeriesPrimaryImageTag,
        adjustForPixelRatio: adjustForPixelRatio,
        keepAnimation: keepAnimation
      });

      // TODO: this is just a guess
      imageAspect = 2 / 3;
    } else if (imageTags && imageTags.Primary && !ignorePrimaryImage) {
      if (!options.ignoreUIAspect) {
        height = width && uiAspect ? Math.round(width / uiAspect) : null;
      }
      if (item.Type === 'TvChannel' || item.Type === 'ChannelManagementInfo') {
        imgUrl = apiClient.getLogoImageUrl(item, {
          maxHeight: height,
          maxWidth: width,
          blur: options.blur,
          adjustForPixelRatio: adjustForPixelRatio,
          keepAnimation: keepAnimation
        }, _skinmanager.default.getPreferredLogoImageTypes());
      } else {
        imgUrl = apiClient.getImageUrl(item.Id, {
          type: "Primary",
          maxHeight: height,
          maxWidth: width,
          tag: imageTags.Primary,
          blur: options.blur,
          adjustForPixelRatio: adjustForPixelRatio,
          keepAnimation: keepAnimation
        });
        if (preferThumb) {
          forceName = true;
        }
      }
      imageAspect = primaryImageAspectRatio;
    } else if (options.backdropAsSecondary && item.ParentBackdropImageTags && item.ParentBackdropImageTags.length) {
      imgUrl = apiClient.getImageUrl(item.ParentBackdropItemId, {
        type: "Backdrop",
        maxWidth: width,
        tag: item.ParentBackdropImageTags[0],
        adjustForPixelRatio: adjustForPixelRatio,
        keepAnimation: keepAnimation
      });
      if (options.preferBackdrop) {
        forceName = true;
      }
      imageAspect = 16 / 9;
      imageType = 'Backdrop';
    } else if (item.ImageTag && item.Type === 'Plugin') {
      imgUrl = apiClient.getUrl('Plugins/' + item.Id + '/Thumb', {
        maxHeight: height,
        maxWidth: width,
        tag: item.ImageTag,
        keepAnimation: keepAnimation
      });
      imageAspect = 16 / 9;
    } else if (item.ImageTag && item.ChapterIndex != null && !ignoreChapterImage) {
      imgUrl = apiClient.getImageUrl(item.ItemId || item.Id, {
        maxWidth: width,
        tag: item.ImageTag,
        type: "Chapter",
        index: item.ChapterIndex,
        adjustForPixelRatio: adjustForPixelRatio,
        keepAnimation: keepAnimation,
        mediaSourceId: item.MediaSourceId
      });
      imageAspect = primaryImageAspectRatio;
    } else if (item.PrimaryImageTag && !ignorePrimaryImage) {
      if (!options.ignoreUIAspect) {
        height = width && uiAspect ? Math.round(width / uiAspect) : null;
      }
      if (item.Type === 'User') {
        imgUrl = apiClient.getUserImageUrl(item.Id, {
          maxHeight: height,
          maxWidth: width,
          tag: item.PrimaryImageTag,
          type: "Primary",
          adjustForPixelRatio: adjustForPixelRatio,
          keepAnimation: keepAnimation
        });
      } else {
        imgUrl = apiClient.getImageUrl(item.PrimaryImageItemId || item.Id || item.ItemId, {
          type: "Primary",
          maxHeight: height,
          maxWidth: width,
          tag: item.PrimaryImageTag,
          adjustForPixelRatio: adjustForPixelRatio,
          keepAnimation: keepAnimation
        });
        if (preferThumb) {
          forceName = true;
        }
      }
      imageAspect = primaryImageAspectRatio;
    } else if (item.AlbumId && item.AlbumPrimaryImageTag) {
      if (!options.ignoreUIAspect) {
        height = width && uiAspect ? Math.round(width / uiAspect) : null;
      }
      imgUrl = apiClient.getImageUrl(item.AlbumId, {
        type: "Primary",
        maxHeight: height,
        maxWidth: width,
        tag: item.AlbumPrimaryImageTag,
        blur: options.blur,
        adjustForPixelRatio: adjustForPixelRatio,
        keepAnimation: keepAnimation
      });
      imageAspect = 1;
    } else if (item.ParentThumbItemId && options.inheritThumb !== false && uiAspect && uiAspect >= 1.4 && item.MediaType !== 'Photo') {
      imgUrl = apiClient.getImageUrl(item.ParentThumbItemId, {
        type: "Thumb",
        maxWidth: width,
        tag: item.ParentThumbImageTag,
        adjustForPixelRatio: adjustForPixelRatio,
        keepAnimation: keepAnimation
      });
      imageAspect = 16 / 9;
      imageType = 'Thumb';
    } else if (item.ParentPrimaryImageTag) {
      imgUrl = apiClient.getImageUrl(item.ParentPrimaryImageItemId, {
        type: "Primary",
        maxWidth: width,
        tag: item.ParentPrimaryImageTag,
        adjustForPixelRatio: adjustForPixelRatio,
        keepAnimation: keepAnimation
      });

      // TODO: this is just a guess
      if (item.Type === 'Episode') {
        imageAspect = 2 / 3;
      } else {
        imageAspect = 1;
      }
    } else if (item.SeriesPrimaryImageTag) {
      imgUrl = apiClient.getImageUrl(item.SeriesId, {
        type: "Primary",
        maxWidth: width,
        tag: item.SeriesPrimaryImageTag,
        adjustForPixelRatio: adjustForPixelRatio,
        keepAnimation: keepAnimation
      });

      // TODO: this is just a guess
      imageAspect = 2 / 3;
    } else if (item.Type === 'Season' && imageTags && imageTags.Thumb) {
      imgUrl = apiClient.getImageUrl(item.Id, {
        type: "Thumb",
        maxWidth: width,
        tag: imageTags.Thumb,
        adjustForPixelRatio: adjustForPixelRatio,
        keepAnimation: keepAnimation
      });
      imageAspect = 16 / 9;
      imageType = 'Thumb';
    } else if (item.ChannelPrimaryImageTag && item.ChannelId) {
      imgUrl = apiClient.getImageUrl(item.ChannelId, {
        type: "Primary",
        maxWidth: width,
        tag: item.ChannelPrimaryImageTag,
        adjustForPixelRatio: adjustForPixelRatio,
        keepAnimation: keepAnimation
      });
      imageAspect = 16 / 9;
    } else if (item.BackdropImageTags && item.BackdropImageTags.length) {
      imgUrl = apiClient.getImageUrl(item.Id, {
        type: "Backdrop",
        maxWidth: width,
        tag: item.BackdropImageTags[0],
        adjustForPixelRatio: adjustForPixelRatio,
        keepAnimation: keepAnimation
      });
      imageAspect = 16 / 9;
      imageType = 'Backdrop';
    } else if (imageTags && imageTags.Thumb) {
      imgUrl = apiClient.getImageUrl(item.Id, {
        type: "Thumb",
        maxWidth: width,
        tag: imageTags.Thumb,
        adjustForPixelRatio: adjustForPixelRatio,
        keepAnimation: keepAnimation
      });
      imageAspect = 16 / 9;
      imageType = 'Thumb';
    } else if (item.ParentThumbItemId && options.inheritThumb !== false) {
      imgUrl = apiClient.getImageUrl(item.ParentThumbItemId, {
        type: "Thumb",
        maxWidth: width,
        tag: item.ParentThumbImageTag,
        adjustForPixelRatio: adjustForPixelRatio,
        keepAnimation: keepAnimation
      });
      imageAspect = 16 / 9;
      imageType = 'Thumb';
    } else if (item.ParentBackdropImageTags && item.ParentBackdropImageTags.length && options.inheritThumb !== false) {
      imgUrl = apiClient.getImageUrl(item.ParentBackdropItemId, {
        type: "Backdrop",
        maxWidth: width,
        tag: item.ParentBackdropImageTags[0],
        adjustForPixelRatio: adjustForPixelRatio,
        keepAnimation: keepAnimation
      });
      imageAspect = 16 / 9;
      imageType = 'Backdrop';
    } else if (item.PrimaryImageItemId) {
      // VirtualFolder
      // legacy as of 4.9.0.20 now that PrimaryImageTag is being returned
      imgUrl = apiClient.getImageUrl(item.PrimaryImageItemId, {
        type: "Primary",
        maxHeight: height,
        maxWidth: width,
        adjustForPixelRatio: adjustForPixelRatio
      });
      imageAspect = primaryImageAspectRatio;
    }
    // Activity log
    else if (item.UserPrimaryImageTag && item.Type !== 'ActiveSession') {
      imgUrl = apiClient.getUserImageUrl(item.UserId, {
        maxHeight: height,
        maxWidth: width,
        tag: item.UserPrimaryImageTag,
        type: "Primary",
        adjustForPixelRatio: adjustForPixelRatio,
        keepAnimation: keepAnimation
      });
      imageAspect = 1;
    }
    return {
      imgUrl: imgUrl,
      forceName: forceName,
      aspect: imageAspect,
      imageType: imageType
    };
  }
  var coverImageTolerance = 0.28;
  function getCoveredImageFit(item, apiClient, imgUrlInfo, uiAspect, force) {
    var imageType = imgUrlInfo.imageType;
    switch (imageType) {
      case 'Logo':
        return 'contain';
      default:
        break;
    }
    var itemAspect = imgUrlInfo.aspect;

    //console.log('itemAspect: ' + itemAspect + '---- uiAspect: ' + uiAspect);
    var coverImage = force || Math.abs(itemAspect - uiAspect) <= coverImageTolerance;
    if (coverImage) {
      var itemType = item.Type;
      switch (itemType) {
        case 'Chapter':
          return null;
        case 'TvChannel':
        case 'ChannelManagementInfo':
          switch (imageType) {
            case 'Backdrop':
              return 'cover';
            default:
              return 'contain';
          }

        // todo: it would be better to always use cover, but that won't look good with cover art
        case 'Movie':
        case 'Series':
        case 'Episode':
        case 'Season':
        case 'MusicAlbum':
          switch (imageType) {
            case 'Backdrop':
              return 'cover';
            default:
              if (!apiClient || apiClient.hasImageEnhancers === false) {
                return 'cover';
              }
              return 'fill';
          }
        case 'BoxSet':
          switch (imageType) {
            case 'Backdrop':
              return 'cover';
            default:
              if (!apiClient || apiClient.hasImageEnhancers === false) {
                return 'cover';
              }
              // best guess for now
              // https://github.com/MediaBrowser/Emby.tvOS.Javascript/issues/596
              return 'contain';
          }
        default:
          return 'cover';
      }
    }
    return null;
  }
  function getCoveredImageClass(item, apiClient, imgUrlInfo, uiAspect, force) {
    var objectFit = getCoveredImageFit(item, apiClient, imgUrlInfo, uiAspect, force);
    if (objectFit) {
      switch (objectFit) {
        case 'contain':
          return ' coveredImage coveredImage-contain';
        case 'fill':
          return ' coveredImage';
        default:
          return ' coveredImage coveredImage-noScale';
      }
    }
    return null;
  }
  var _default = _exports.default = {
    getPrimaryImageAspectRatio: getPrimaryImageAspectRatio,
    getShape: getShape,
    getAspectFromShape: getAspectFromShape,
    getShapeFromAspect: getShapeFromAspect,
    getImageUrl: getImageUrl,
    getCoveredImageFit: getCoveredImageFit,
    getCoveredImageClass: getCoveredImageClass
  };
});
