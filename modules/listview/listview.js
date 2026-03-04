define(["exports", "./../dom.js", "./../browser.js", "./../layoutmanager.js", "./../common/globalize.js", "./../common/datetime.js", "./../common/textencoding.js", "./../mediainfo/mediainfo.js", "./../indicators/indicators.js", "./../focusmanager.js", "./../common/itemmanager/itemmanager.js", "./../emby-apiclient/connectionmanager.js", "./../emby-apiclient/events.js", "./../common/imagehelper.js", "./../lazyloader/lazyimageloader.js", "./../shortcuts.js", "./../common/playback/playbackmanager.js", "./../emby-elements/userdatabuttons/emby-ratingbutton.js", "./../emby-elements/userdatabuttons/emby-playstatebutton.js", "./../common/dataformatter.js", "./../emby-elements/emby-button/emby-button.js", "./../common/usersettings/usersettings.js"], function (_exports, _dom, _browser, _layoutmanager, _globalize, _datetime, _textencoding, _mediainfo, _indicators, _focusmanager, _itemmanager, _connectionmanager, _events, _imagehelper, _lazyimageloader, _shortcuts, _playbackmanager, _embyRatingbutton, _embyPlaystatebutton, _dataformatter, _embyButton, _usersettings) {
  Object.defineProperty(_exports, "__esModule", {
    value: true
  });
  _exports.default = void 0;
  /* jshint module: true */

  require(['css!modules/listview/listview.css']);
  var supportsNativeLazyLoading = 'loading' in HTMLImageElement.prototype;
  var supportsAsyncDecodedImages = _dom.default.supportsAsyncDecodedImages();
  var decodingAttribute = supportsAsyncDecodedImages ? ' decoding="async"' : '';
  // in edge, cascading object-fit values are not overriding previous ones
  var supportsObjectFit = CSS.supports('object-fit', 'contain');
  var enableFocusTransfrom = _dom.default.allowFocusScaling();
  var supportsCssVariables = CSS.supports('color', 'var(--fake-var)');
  var secondaryTextClass = supportsCssVariables ? 'secondaryText' : '';
  var DownloadIcon = '&#xe5db;';
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
  var embyCheckboxLoaded;
  function loadEmbyCheckbox() {
    if (!embyCheckboxLoaded) {
      embyCheckboxLoaded = true;
      Emby.importModule('./modules/emby-elements/emby-checkbox/emby-checkbox.js');
    }
  }
  function getIndex(item, options) {
    if (options.index === 'disc') {
      var parentIndexNumber = item.ParentIndexNumber;
      return parentIndexNumber == null ? '' : _globalize.default.translate('ValueDiscNumber', parentIndexNumber);
    }
    return '';
  }
  function getTextLinesHtml(textlines, options) {
    var html = '';
    var isFirst = true;
    var listItemBodyTextTagName = options.listItemBodyTextTagName;
    var cssClass = options.listItemBodyTextClass;
    for (var i = 0, length = textlines.length; i < length; i++) {
      var text = textlines[i];
      if (!text) {
        continue;
      }
      if (isFirst) {
        html += '<' + listItemBodyTextTagName + ' class="' + cssClass + '">';
        isFirst = false;
        listItemBodyTextTagName = 'div';
      } else {
        html += '<div class="' + cssClass + ' ' + options.listItemBodyTextSecondaryClass + '">';
      }
      html += text;
      html += '</' + listItemBodyTextTagName + '>';
    }
    return html;
  }
  function getId(item) {
    return item.Id;
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
    if (options.textLinks === false) {
      return _textencoding.default.htmlEncode(text);
    }

    // this if for album identify results but might be too broad
    if (!item.Id && !isSameItemAsCard) {
      return _textencoding.default.htmlEncode(text);
    }
    text = _textencoding.default.htmlEncode(text);
    var dataAttributes;
    if (isSameItemAsCard) {
      dataAttributes = '';
    } else {
      dataAttributes = _shortcuts.default.getShortcutAttributesHtml(item, {
        serverId: serverId,
        parentId: parentId
      });
    }
    var draggable = !options.draggable || isSameItemAsCard ? '' : ' draggable="true"';
    var html = '<button title="' + text + '" title="' + text + '" ' + dataAttributes + ' type="button"' + draggable + ' class="itemAction textActionButton listItem-textActionButton emby-button button-link" data-action="link">';
    html += text;
    html += '</button>';
    return html;
  }
  function isUsingLiveTvNaming(itemType) {
    return itemType === 'Program' || itemType === 'Timer' || itemType === 'Recording';
  }
  function mapArtistsToTextButtons(item, artistItems, options) {
    return artistItems.map(function (a) {
      a.Type = 'MusicArtist';
      a.IsFolder = true;
      return getTextActionButton(options, a, null, item.ServerId);
    }).join(', ');
  }
  function getMdIconClass(icon) {
    // todo: this code is duplicated in listview/multiselect
    switch (icon) {
      case '&#xe88a;':
      case '&#xe034;':
      case '&#xe037;':
      case '&#xe042;':
      case '&#xe044;':
      case '&#xe045;':
      case '&#xe047;':
      case '&#xe061;':
      case '&#xe062;':
        return ' md-icon-fill';
      case '&#xe8cd;':
      case '&#xec0b;':
        return ' md-icon-pushdown-bubble';
      default:
        return '';
    }
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
  function getListItemHtml(item, index, options) {
    var _item$CurrentProgram;
    var enableSideMediaInfo = options.enableSideMediaInfo;
    var tagName = options.tagName;
    var action = options.action;
    var html = '';
    var downloadWidth = options.imageDownloadWidth;
    var hoverPlayButtonRequested = !_layoutmanager.default.tv && options.hoverPlayButton !== false;
    var enableHoverPlayButton = hoverPlayButtonRequested && _playbackmanager.default.canPlay(item);
    var itemType = item.Type;
    var itemController = _itemmanager.default.getItemController(itemType);
    var titleAttribute = options.tooltip ? ' title="' + _textencoding.default.htmlEncode(itemController.getDisplayName(item, {
      hideEpisodeSpoilerInfo: options.hideEpisodeSpoilerInfo
    })) + '"' : '';
    html += '<div' + titleAttribute + ' class="' + options.contentWrapperClass + '">';
    if (options.enableBottomOverview) {
      html += '<div class="listItem-innerwrapper">';
    }
    var serverId = item.ServerId;
    var apiClient = serverId ? _connectionmanager.default.getApiClient(serverId) : null;
    if (options.multiSelect) {
      html += '<label title="' + options.multiSelectTitle + '" data-action="multiselect" class="chkListItemSelectContainer chkItemSelectContainer itemAction emby-checkbox-label"><input tabindex="-1" class="chkListItemSelect chkItemSelect emby-checkbox emby-checkbox-notext" is="emby-checkbox" type="checkbox" data-classes="true" /><span class="checkboxLabel chkListItemSelect-checkboxLabel"></span></label>';
    }
    var fieldMap = options.fieldMap;
    if (fieldMap.ItemCheckbox) {
      var checkbox = options.itemCheckbox;
      var checked;
      if (options.getIsItemChecked) {
        checked = options.getIsItemChecked(item);
      } else {
        checked = item.Selected || item.Disabled === false;
      }

      // support either model
      if (checked) {
        checkbox = checkbox.replace('type="checkbox"', 'type="checkbox" checked');
      }
      html += checkbox;
    }
    if (options.treeButton) {
      if (item.IsFolder) {
        html += options.treeButtonHtml;
      } else {
        html += options.disabledTreeButtonHtml;
      }
    }
    if (options.image !== false) {
      var imageItem;
      if (options.showCurrentProgramImage) {
        imageItem = item.CurrentProgram || item;
      } else {
        imageItem = item.ProgramInfo || item;
      }
      var imgUrlInfo = _imagehelper.default.getImageUrl(imageItem, apiClient, {
        width: downloadWidth,
        showChannelLogo: options.imageSource === 'channel',
        uiAspect: options.aspectInfo.aspect,
        hideEpisodeSpoilerInfo: options.hideEpisodeSpoilerInfo
      });
      var imgUrl = options.preferIcon ? null : imgUrlInfo.imgUrl;
      var imageContainerClass = options.imageContainerClass;
      var imageClass = 'listItemImage';
      if (options.imageSize) {
        imageClass += ' listItemImage-' + options.imageSize;
      }
      if (options.roundImage) {
        imageClass += ' listItemImage-round';
        if (!imgUrl) {
          imageContainerClass += ' listItemImageContainer-round';
        }
      }
      var playOnImageClick = options.imagePlayButton && !_layoutmanager.default.tv;
      if (options.playQueueIndicator !== false) {
        var currentPlayingItemId = CurrentPlayingItemId;
        if (currentPlayingItemId) {
          if (currentPlayingItemId === item.PlaylistItemId || currentPlayingItemId === item.Id) {
            if (!_playbackmanager.default.paused()) {
              imageContainerClass += ' itemelement-nowplaying listviewitemelement-nowplaying';
            }
          }
        }
      }
      var imageAction = playOnImageClick ? 'resume' : action;
      if (!imgUrl && !options.preferIcon && options.defaultBackground !== false || options.defaultBackground) {
        imageContainerClass += ' defaultCardBackground';
      }
      var color = item.Severity === 'Error' || item.Severity === 'Fatal' || item.Severity === 'Warn' ? 'background-color:#cc0000;color:#fff;' : '';
      var styleRules = [];
      if (color) {
        styleRules.push(color);
      }
      styleRules.push('aspect-ratio:' + options.aspectInfo.aspectCss);
      var style = styleRules.length ? ' style="' + styleRules.join(';') + '"' : '';
      html += '<div data-action="' + imageAction + '" class="' + imageContainerClass + '"' + style + '>';
      var progressHtml = _indicators.default.getProgressBarHtml(item, {
        containerClass: 'listItemProgressBar'
      });
      if (imgUrl) {
        var itemShape = imgUrlInfo.aspect ? _imagehelper.default.getShapeFromAspect(imgUrlInfo.aspect) : _imagehelper.default.getShape([item], options) || 'square';
        var aspectInfo = _imagehelper.default.getAspectFromShape(itemShape, options);
        imageClass += ' listItemImage-' + itemShape;
        var coveredImageClass = _imagehelper.default.getCoveredImageClass(imageItem, apiClient, imgUrlInfo, aspectInfo.aspect);
        if (coveredImageClass) {
          imageClass += coveredImageClass;
        }
        var isImg;
        if (options.lazy === 2) {
          if (supportsObjectFit) {
            html += '<img draggable="false" class="' + imageClass + '"' + decodingAttribute + ' style="aspect-ratio:' + aspectInfo.aspectCss + ';" src="' + imgUrl + '" />';
            isImg = true;
          } else {
            html += '<div class="' + imageClass + '" style="aspect-ratio:' + aspectInfo.aspectCss + ';background-image:url(' + imgUrl + ');">';
          }
        } else if (supportsNativeLazyLoading && supportsObjectFit) {
          html += '<img draggable="false" class="' + imageClass + '" loading="lazy"' + decodingAttribute + ' style="aspect-ratio:' + aspectInfo.aspectCss + ';" src="' + imgUrl + '" />';
          isImg = true;
        } else {
          html += '<div class="' + imageClass + ' lazy" style="aspect-ratio:' + aspectInfo.aspectCss + ';background-image:url(' + imgUrl + ');">';
        }
        //if (options.lazy === 2) {
        //    html += '<div class="' + imageClass + '" decoding="async" style="aspect-ratio:' + aspectInfo.aspectCss + ';background-image:url(' + imgUrl + ');">';
        //} else if (supportsNativeLazyLoading) {
        //    html += '<div class="' + imageClass + '" loading="lazy" decoding="async" style="aspect-ratio:' + aspectInfo.aspectCss + ';background-image:url(' + imgUrl + ');">';
        //} else {
        //    html += '<div class="' + imageClass + ' lazy" decoding="async" style="aspect-ratio:' + aspectInfo.aspectCss + ';background-image:url(' + imgUrl + ');">';
        //}

        if (progressHtml) {
          html += progressHtml;
        }
        if (!isImg) {
          html += '</div>';
        }
      } else {
        var icon = item.Icon;
        if (!icon && options.enableDefaultIcon) {
          icon = itemController.getDefaultIcon(item);
        }
        if (icon) {
          var iconClass = options.iconClass;
          if (item.iconClass) {
            iconClass += ' ' + item.iconClass;
          }

          // todo: this code is duplicated in listview/multiselect
          iconClass += getMdIconClass(icon);
          html += '<i class="' + iconClass + '">' + icon + '</i>';
        }
        if (progressHtml) {
          html += progressHtml;
        }
      }

      // avoid indicators in the nav drawer. checking this is hopefully good enough, otherwise will require an explicit option
      if (!options.iconSpacing) {
        var indicatorsHtml = _indicators.default.getPlayedIndicatorHtml(item, options.indicatorClass);
        if (indicatorsHtml) {
          html += indicatorsHtml;
        }
      }
      if (enableHoverPlayButton) {
        var playButtonAction = getPlayAction(item, options);
        html += '<button tabindex="-1" type="button" is="paper-icon-button-light" class="listItemOverlayButton-hover listItemOverlayButton-imagehover itemAction" data-action="' + playButtonAction + '"><i class="md-icon md-icon-fill listItemOverlayButtonIcon autortl">&#xe037;</i></button>';
      }
      if (playOnImageClick) {
        html += '<button tabindex="-1" title="' + _globalize.default.translate('Play') + '"  aria-label="' + _globalize.default.translate('Play') + '"type="button" is="paper-icon-button-light" class="listItemImageButton itemAction" data-action="resume"><i class="md-icon md-icon-fill listItemImageButton-icon autortl">&#xe037;</i></button>';
      }
      html += '</div>';
    }
    if (options.showIndexNumberLeft || options.showChapterTimeLeft || options.showYearLeft) {
      var indexNumberClass = 'listItem-indexnumberleft secondaryText';
      if (hoverPlayButtonRequested) {
        indexNumberClass += ' listItem-indexnumberleft-withhoverbutton';
      }
      var _currentPlayingItemId = CurrentPlayingItemId;
      if (_currentPlayingItemId && options.image === false) {
        if (_currentPlayingItemId === item.PlaylistItemId || _currentPlayingItemId === item.Id) {
          if (!_playbackmanager.default.paused()) {
            indexNumberClass += ' itemelement-nowplaying listviewitemelement-nowplaying listviewitemelement-nowplaying-indexnumber';
            if (document.dir === 'rtl') {
              indexNumberClass += ' listviewitemelement-nowplaying-right';
            } else {
              indexNumberClass += ' listviewitemelement-nowplaying-left';
            }
          }
        }
      }
      if (options.showChapterTimeLeft) {
        html += '<div class="' + indexNumberClass + '" style="width:9ch;">';
        if (item.StartPositionTicks == null) {
          html += '&nbsp;';
        } else {
          html += _datetime.default.getDisplayRunningTime(item.StartPositionTicks);
        }
      } else if (options.showYearLeft) {
        html += '<div class="' + indexNumberClass + '" style="width:5.5ch;">';
        if (item.ProductionYear == null) {
          html += '&nbsp;';
        } else {
          html += item.ProductionYear;
        }
      } else if (options.showIndexNumberLeft) {
        html += '<div class="' + indexNumberClass + '">';
        if (item.IndexNumber == null) {
          html += '&nbsp;';
        } else {
          html += item.IndexNumber;
        }
      }
      if (enableHoverPlayButton) {
        var _playButtonAction = getPlayAction(item, options);
        html += '<button tabindex="-1" type="button" is="paper-icon-button-light" class="listItemOverlayButton-hover itemAction" data-action="' + _playButtonAction + '"><i class="md-icon md-icon-fill listItemOverlayButtonIcon autortl">&#xe037;</i></button>';
      }

      // don't render it again with the image
      enableHoverPlayButton = false;
      html += '</div>';
    }
    html += '<' + options.listItemBodyTagName + ' class="' + options.listItemBodyClassName + '">';
    var listItemBodyTextTagName = options.listItemBodyTextTagName;
    var textCssClass = options.listItemBodyTextClass;
    var listItemBodyTextOpen = '<' + listItemBodyTextTagName + ' class="' + textCssClass + '">';
    var listItemBodyTextClose = '</' + listItemBodyTextTagName + '>';
    var secondaryListItemBodyTextTagName = 'div';
    var secondaryListItemBodyTextOpen = '<div class="' + textCssClass + ' ' + options.listItemBodyTextSecondaryClass + '">';
    var secondaryListItemBodyTextClose = '</div>';
    var itemForTitle = item.ProgramInfo || item;
    var fields;
    switch (itemType) {
      case 'MusicAlbum':
      case 'Audio':
      case 'MusicVideo':
      case 'Game':
        fields = options.fieldsParentNameAfter || options.fields;
        break;
      default:
        fields = options.fields;
        break;
    }
    var displayName = _itemmanager.default.getDisplayName(itemForTitle, {
      includeParentInfo: options.includeParentInfoInTitle,
      includeIndexNumber: options.includeIndexNumberInTitle || (item.SupportsResume && item.Type === 'Audio' ? false : null),
      hideEpisodeSpoilerInfo: options.hideEpisodeSpoilerInfo
    });
    if (options.showIndexNumber && itemForTitle.IndexNumber != null) {
      displayName = itemForTitle.IndexNumber + ". " + displayName;
    }
    for (var i = 0, length = fields.length; i < length; i++) {
      var field = fields[i];
      switch (field) {
        case 'Name':
          if (options.mediaInfoWithTitle) {
            var mediaInfoHtml = _mediainfo.default.getPrimaryMediaInfoHtml(item, {
              episodeTitle: false,
              originalAirDate: false,
              subtitles: false,
              endsAt: false
            });
            if (mediaInfoHtml) {
              html += '<' + listItemBodyTextTagName + ' class="listItemBodyText listItemBodyText-withmediainfo mediaInfoItems listItemBodyText-nowrap ' + options.listItemBodyTextSecondaryClass + ' flex align-items-center flex-direction-row">';
              html += mediaInfoHtml;
            } else {
              html += listItemBodyTextOpen;
            }
            html += _textencoding.default.htmlEncode(displayName);
            html += listItemBodyTextClose;
            listItemBodyTextTagName = secondaryListItemBodyTextTagName;
            listItemBodyTextOpen = secondaryListItemBodyTextOpen;
            listItemBodyTextClose = secondaryListItemBodyTextClose;
          } else if (displayName) {
            html += listItemBodyTextOpen + _textencoding.default.htmlEncode(displayName) + listItemBodyTextClose;
            listItemBodyTextTagName = secondaryListItemBodyTextTagName;
            listItemBodyTextOpen = secondaryListItemBodyTextOpen;
            listItemBodyTextClose = secondaryListItemBodyTextClose;
          }
          break;
        case 'NameAndRole':
          if (displayName) {
            var nameAndRole = _textencoding.default.htmlEncode(displayName);
            if (item.Role) {
              nameAndRole += '<span class="secondaryText"> <span style="margin:0 .15em;">&bull;</span> ' + _globalize.default.translate('ActorAsRole', _textencoding.default.htmlEncode(item.Role)) + '</span>';
            }
            html += listItemBodyTextOpen + nameAndRole + listItemBodyTextClose;
            listItemBodyTextTagName = secondaryListItemBodyTextTagName;
            listItemBodyTextOpen = secondaryListItemBodyTextOpen;
            listItemBodyTextClose = secondaryListItemBodyTextClose;
          }
          break;
        case 'ParentNameOrName':
          if (itemType === 'Episode' && item.SeriesName) {
            if (item.SeriesId) {
              html += listItemBodyTextOpen + getTextActionButton(options, {
                Id: item.SeriesId,
                ServerId: serverId,
                Name: item.SeriesName,
                Type: 'Series',
                IsFolder: true
              }) + listItemBodyTextClose;
              listItemBodyTextTagName = secondaryListItemBodyTextTagName;
              listItemBodyTextOpen = secondaryListItemBodyTextOpen;
              listItemBodyTextClose = secondaryListItemBodyTextClose;
            } else if (item.SeriesName) {
              html += listItemBodyTextOpen + _textencoding.default.htmlEncode(item.SeriesName || '') + listItemBodyTextClose;
              listItemBodyTextTagName = secondaryListItemBodyTextTagName;
              listItemBodyTextOpen = secondaryListItemBodyTextOpen;
              listItemBodyTextClose = secondaryListItemBodyTextClose;
            }
          } else {
            if (isUsingLiveTvNaming(itemType)) {
              html += listItemBodyTextOpen + _textencoding.default.htmlEncode(item.Name || '') + listItemBodyTextClose;
              listItemBodyTextTagName = secondaryListItemBodyTextTagName;
              listItemBodyTextOpen = secondaryListItemBodyTextOpen;
              listItemBodyTextClose = secondaryListItemBodyTextClose;
            } else {
              // for identify results, AlbumArtist is an object
              var parentTitle = item.SeriesName || item.Series || item.Album || (item.AlbumArtist ? item.AlbumArtist.Name || item.AlbumArtist : null) || item.GameSystem || '';
              if (parentTitle) {
                html += listItemBodyTextOpen + _textencoding.default.htmlEncode(parentTitle || '') + listItemBodyTextClose;
                listItemBodyTextTagName = secondaryListItemBodyTextTagName;
                listItemBodyTextOpen = secondaryListItemBodyTextOpen;
                listItemBodyTextClose = secondaryListItemBodyTextClose;
              }
            }
          }
          break;
        case 'ParentName':
          var showArtist = void 0;
          var containerAlbumArtistIds = options.containerAlbumArtistIds;
          var artistItems = item.Type === 'MusicAlbum' ? item.AlbumArtists : item.ArtistItems;
          if (!artistItems || !artistItems.length) {
            showArtist = true;
          } else if (artistItems.length > 1 || !containerAlbumArtistIds || containerAlbumArtistIds.length !== 1 || containerAlbumArtistIds.indexOf(artistItems[0].Id) === -1) {
            showArtist = true;
          }
          if (item.AlbumArtists && item.AlbumArtists.length && itemType === 'MusicAlbum') {
            html += listItemBodyTextOpen + mapArtistsToTextButtons(item, artistItems, options) + listItemBodyTextClose;
          } else if (item.ArtistItems && item.ArtistItems.length) {
            if (showArtist) {
              html += listItemBodyTextOpen + mapArtistsToTextButtons(item, artistItems, options) + listItemBodyTextClose;
            }
          } else if (item.AlbumArtists && item.AlbumArtists.length) {
            if (showArtist) {
              html += listItemBodyTextOpen + mapArtistsToTextButtons(item, artistItems, options) + listItemBodyTextClose;
            }
          } else if (item.GameSystem && item.GameSystemId) {
            html += listItemBodyTextOpen + getTextActionButton(options, {
              Id: item.GameSystemId,
              ServerId: serverId,
              Name: item.GameSystem,
              Type: 'GameSystem',
              IsFolder: true
            }) + listItemBodyTextClose;
          } else {
            // for identify results, AlbumArtist is an object
            html += listItemBodyTextOpen + _textencoding.default.htmlEncode(isUsingLiveTvNaming(itemType) ? item.Name : item.SeriesName || item.Series || item.Album || (item.AlbumArtist ? item.AlbumArtist.Name || item.AlbumArtist : null) || item.GameSystem || '') + listItemBodyTextClose;
          }
          listItemBodyTextTagName = secondaryListItemBodyTextTagName;
          listItemBodyTextOpen = secondaryListItemBodyTextOpen;
          listItemBodyTextClose = secondaryListItemBodyTextClose;
          break;
        case 'ItemCheckbox':
        case 'ProductionYear':
          // part of mediainfo
          break;
        case 'Overview':
          break;
        case 'Type':
          html += listItemBodyTextOpen + itemController.getItemTypeName(item) + listItemBodyTextClose;
          listItemBodyTextTagName = secondaryListItemBodyTextTagName;
          listItemBodyTextOpen = secondaryListItemBodyTextOpen;
          listItemBodyTextClose = secondaryListItemBodyTextClose;
          break;
        case 'StartDateTime':
          html += listItemBodyTextOpen + _datetime.default.toLocaleString(new Date(Date.parse(item.StartDate)), {
            weekday: 'long',
            month: 'short',
            day: 'numeric',
            hour: 'numeric',
            minute: '2-digit'
          }) + listItemBodyTextClose;
          listItemBodyTextTagName = secondaryListItemBodyTextTagName;
          listItemBodyTextOpen = secondaryListItemBodyTextOpen;
          listItemBodyTextClose = secondaryListItemBodyTextClose;
          break;
        case 'StartToEndDateTime':
          html += '<div class="' + textCssClass + ' ' + options.listItemBodyTextSecondaryClass + '">' + _datetime.default.toLocaleString(new Date(Date.parse(item.StartDate)), {
            weekday: 'long',
            month: 'short',
            day: 'numeric',
            hour: 'numeric',
            minute: '2-digit'
          });
          html += " &ndash; " + _datetime.default.toLocaleString(new Date(Date.parse(item.EndDate)), {
            hour: 'numeric',
            minute: '2-digit'
          });
          html += listItemBodyTextClose;
          listItemBodyTextTagName = secondaryListItemBodyTextTagName;
          listItemBodyTextOpen = secondaryListItemBodyTextOpen;
          listItemBodyTextClose = secondaryListItemBodyTextClose;
          break;
        case 'ChannelName':
          html += listItemBodyTextOpen;
          html += '<div class="flex align-items-center">';
          var parts = [];
          if (item.Type === 'TvChannel') {
            parts.push(item.Name);
          } else if (item.ChannelName) {
            parts.push(item.ChannelName);
          } else if (item.ProgramInfo && item.ProgramInfo.ChannelName) {
            parts.push(item.ProgramInfo.ChannelName);
          }
          if (item.ChannelNumber) {
            parts.push(item.ChannelNumber);
          } else if (item.ProgramInfo && item.ProgramInfo.ChannelNumber) {
            parts.push(item.ProgramInfo.ChannelNumber);
          }
          html += _textencoding.default.htmlEncode(parts.join(' ')) + '</div>' + listItemBodyTextClose;
          listItemBodyTextOpen = secondaryListItemBodyTextOpen;
          listItemBodyTextClose = secondaryListItemBodyTextClose;
          break;
        case 'MappedChannelInfo':
          html += listItemBodyTextOpen;
          var mappingInfo = void 0;
          if (item.ListingsChannelName) {
            mappingInfo = item.ListingsChannelName;
            if (item.ListingsChannelNumber) {
              mappingInfo = item.ListingsChannelNumber + ' ' + mappingInfo;
            }
            if (item.AffiliateCallSign) {
              mappingInfo += ' - ' + item.AffiliateCallSign;
            }
            var guideSourceInfo = item.ListingsId || item.ListingsPath;
            if (guideSourceInfo) {
              mappingInfo += ' - ' + _textencoding.default.htmlEncode(guideSourceInfo);
            }
            mappingInfo = _globalize.default.translate('MappedToValue', mappingInfo);
          }
          html += mappingInfo || _globalize.default.translate('NotMappedToGuideData');
          html += listItemBodyTextClose;
          listItemBodyTextTagName = secondaryListItemBodyTextTagName;
          listItemBodyTextOpen = secondaryListItemBodyTextOpen;
          listItemBodyTextClose = secondaryListItemBodyTextClose;
          break;
        case 'CurrentProgramParentName':
          if (item.CurrentProgram) {
            html += listItemBodyTextOpen + _textencoding.default.htmlEncode(item.CurrentProgram.Name || '') + listItemBodyTextClose;
            listItemBodyTextOpen = secondaryListItemBodyTextOpen;
            listItemBodyTextClose = secondaryListItemBodyTextClose;
          }
          break;
        case 'CurrentProgramName':
          if ((_item$CurrentProgram = item.CurrentProgram) != null && _item$CurrentProgram.EpisodeTitle) {
            html += listItemBodyTextOpen + _textencoding.default.htmlEncode(_itemmanager.default.getDisplayName(item.CurrentProgram)) + listItemBodyTextClose;
            listItemBodyTextOpen = secondaryListItemBodyTextOpen;
            listItemBodyTextClose = secondaryListItemBodyTextClose;
          }
          break;
        case 'CurrentProgramTime':
          if (item.CurrentProgram) {
            html += listItemBodyTextOpen + _mediainfo.default.getAirTimeText(item.CurrentProgram, false, true) + listItemBodyTextClose;
            listItemBodyTextOpen = secondaryListItemBodyTextOpen;
            listItemBodyTextClose = secondaryListItemBodyTextClose;
          }
          break;
        case 'LogLine':
          html += listItemBodyTextOpen + _textencoding.default.htmlEncode(item) + listItemBodyTextClose;
          listItemBodyTextTagName = secondaryListItemBodyTextTagName;
          listItemBodyTextOpen = secondaryListItemBodyTextOpen;
          listItemBodyTextClose = secondaryListItemBodyTextClose;
          break;
        case 'DeviceUserInfo':
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
          html += listItemBodyTextOpen + deviceHtml + listItemBodyTextClose;
          listItemBodyTextOpen = secondaryListItemBodyTextOpen;
          listItemBodyTextClose = secondaryListItemBodyTextClose;
          break;
        case 'ChannelNumber':
          if (item.ChannelNumber) {
            html += listItemBodyTextOpen + _textencoding.default.htmlEncode(item.ChannelNumber) + listItemBodyTextClose;
            listItemBodyTextOpen = secondaryListItemBodyTextOpen;
            listItemBodyTextClose = secondaryListItemBodyTextClose;
          }
          break;
        case 'ShortOverview':
          if (item.ShortOverview) {
            html += listItemBodyTextOpen + (item.ShortOverview ? _textencoding.default.htmlEncode(item.ShortOverview) : '&nbsp;') + listItemBodyTextClose;
            listItemBodyTextOpen = secondaryListItemBodyTextOpen;
            listItemBodyTextClose = secondaryListItemBodyTextClose;
          }
          break;
        case 'Date':
          html += listItemBodyTextOpen + _datetime.default.toLocaleString(new Date(Date.parse(item.Date))) + listItemBodyTextClose;
          listItemBodyTextOpen = secondaryListItemBodyTextOpen;
          listItemBodyTextClose = secondaryListItemBodyTextClose;
          break;
        case 'ChapterTime':
          html += listItemBodyTextOpen + (item.StartPositionTicks == null ? '' : _datetime.default.getDisplayRunningTime(item.StartPositionTicks)) + listItemBodyTextClose;
          listItemBodyTextOpen = secondaryListItemBodyTextOpen;
          listItemBodyTextClose = secondaryListItemBodyTextClose;
          break;
        case 'PathOrTitle':
          html += listItemBodyTextOpen + (item.Path || item.Title ? _textencoding.default.htmlEncode(item.Path || item.Title) : '&nbsp;') + listItemBodyTextClose;
          listItemBodyTextOpen = secondaryListItemBodyTextOpen;
          listItemBodyTextClose = secondaryListItemBodyTextClose;
          break;
        case 'Text':
          html += listItemBodyTextOpen + (item.Text ? _textencoding.default.htmlEncode(item.Text) : '&nbsp;') + listItemBodyTextClose;
          listItemBodyTextOpen = secondaryListItemBodyTextOpen;
          listItemBodyTextClose = secondaryListItemBodyTextClose;
          break;
        case 'Path':
          html += listItemBodyTextOpen + (item.Path ? _textencoding.default.htmlEncode(item.Path) : '&nbsp;') + listItemBodyTextClose;
          listItemBodyTextOpen = secondaryListItemBodyTextOpen;
          listItemBodyTextClose = secondaryListItemBodyTextClose;
          break;
        case 'ProviderName':
          html += listItemBodyTextOpen + (item.ProviderName ? _textencoding.default.htmlEncode(item.ProviderName) : '&nbsp;') + listItemBodyTextClose;
          listItemBodyTextOpen = secondaryListItemBodyTextOpen;
          listItemBodyTextClose = secondaryListItemBodyTextClose;
          break;
        case 'MediaInfo':
          {
            var _mediaInfoHtml = _mediainfo.default.getPrimaryMediaInfoHtml(item, {
              episodeTitle: false,
              subtitles: false,
              endsAt: false
            });
            if (_mediaInfoHtml) {
              var mediaInfoClass = 'listItemMediaInfo mediaInfoItems listItemBodyText listItemBodyText-withmediainfo ' + options.listItemBodyTextSecondaryClass + ' listItemBodyText-nowrap';
              html += '<div class="' + mediaInfoClass + '">' + _mediaInfoHtml + '</div>';
            }
            break;
          }
        default:
          var fieldValue = itemController.resolveField(item, field);
          if (fieldValue == null) {
            fieldValue = '';
          }
          html += listItemBodyTextOpen + fieldValue + listItemBodyTextClose;
          listItemBodyTextOpen = secondaryListItemBodyTextOpen;
          listItemBodyTextClose = secondaryListItemBodyTextClose;
          break;
      }
    }
    var textlines = [];
    if (fieldMap.MediaStreamInfo) {
      _mediainfo.default.pushMediaStreamLines(item, options, textlines, itemController.getDefaultIcon(item));
    }
    html += getTextLinesHtml(textlines, options);
    if (options.mediaInfo !== false) {
      if (!enableSideMediaInfo) {
        var _mediaInfoClass = 'listItemMediaInfo mediaInfoItems listItemBodyText ' + options.listItemBodyTextSecondaryClass + ' listItemBodyText-nowrap';
        html += '<div class="' + _mediaInfoClass + '">' + _mediainfo.default.getPrimaryMediaInfoHtml(item, {
          episodeTitle: false,
          subtitles: false,
          endsAt: false
        }) + '</div>';
      }
    }
    if (fieldMap.Overview) {
      var _item$UserData;
      html += '<div class="' + options.topOverviewClassName + '">';
      var overview = item.Overview;
      if (options.hideEpisodeSpoilerInfo && itemType === 'Episode' && ((_item$UserData = item.UserData) == null ? void 0 : _item$UserData.Played) === false) {
        overview = null;
      }
      html += overview ? _dom.default.stripScripts(overview) : '';
      html += '</div>';
    }
    html += '</' + options.listItemBodyTagName + '>';
    if (item.SyncStatus) {
      var syncIconClass = 'listItem-syncStatusIcon';
      if (!_layoutmanager.default.tv) {
        syncIconClass += ' listItem-syncStatusIcon-smallfont';
      }
      html += '<div class="listItemMediaInfo mediaInfoItems secondaryText"><i class="md-icon ' + syncIconClass + '">' + DownloadIcon + '</i></div>';
    }
    if (options.mediaInfo !== false) {
      if (enableSideMediaInfo) {
        var sideMediaInfo = _mediainfo.default.getPrimaryMediaInfoHtml(item, {
          year: false,
          container: false,
          episodeTitle: false,
          criticRating: false,
          endsAt: false
        });
        if (sideMediaInfo) {
          var _mediaInfoClass2 = 'listItemMediaInfo mediaInfoItems secondaryText';
          if (options.autoHideMediaInfo !== false) {
            _mediaInfoClass2 += ' listItemMediaInfo-autohide';
          }
          html += '<div class="' + _mediaInfoClass2 + '">' + sideMediaInfo + '</div>';
        }
      }
    }
    if (!options.recordButton && (itemType === 'Timer' || itemType === 'Program')) {
      html += _indicators.default.getTimerIndicator(item).replace('indicatorIcon', 'indicatorIcon listItemAside');
    }
    if (item.asideText) {
      html += '<div class="listItemAside ' + (options.asideTextClass || '') + ' secondaryText">';
      html += item.asideText;
      html += '</div>';
    }
    if (item.asideIcon) {
      html += '<div class="listItemAside listItemAsideContainer ' + (options.asideIconClass || '') + ' secondaryText"><i class="listItemAsideIcon md-icon autortl">';
      html += item.asideIcon;
      html += '</i></div>';
    }
    if (!options.clickEntireItem) {
      if (options.allowButtonCommands) {
        var _options$buttonComman;
        if (options.overviewButton) {
          var _item$UserData2;
          var _overview = item.Overview;
          if (options.hideEpisodeSpoilerInfo && itemType === 'Episode' && ((_item$UserData2 = item.UserData) == null ? void 0 : _item$UserData2.Played) === false) {
            _overview = null;
          }
          if (_overview) {
            html += '<button title="' + _globalize.default.translate('Overview') + '" aria-label="' + _globalize.default.translate('Overview') + '" type="button" is="paper-icon-button-light" class="listItemButton itemAction md-icon" data-action="overview">&#xe88F;</button>';
          }
        }
        if (options.enableUserDataButtons) {
          var userData = item.UserData || {};
          if (itemController.canRate(item)) {
            //let likes = userData.Likes == null ? '' : userData.Likes;

            var favoriteCssClass = 'listViewFavoriteButton';
            if (options.autoMoveFavoriteButton) {
              favoriteCssClass += ' listViewFavoriteButton-automove';
            } else {
              favoriteCssClass += ' listItemButton-autohide';
            }
            html += _embyRatingbutton.default.getHtml(userData.IsFavorite, favoriteCssClass + ' listItemButton paper-icon-button-light secondaryText itemAction');
          }
          if (itemController.canMarkPlayed(item)) {
            html += _embyPlaystatebutton.default.getHtml(userData.Played, 'listViewPlayedButton listItemButton-autohide listItemButton paper-icon-button-light secondaryText itemAction');
          }
        }
        if (options.contextMenu && options.moreButton && itemController.supportsContextMenu(item)) {
          var contextMenuButtonClass = 'listItemContextMenuButton';
          if (options.hideMoreButtonOnTouch) {
            contextMenuButtonClass += ' hidetouch';
          }
          html += '<button title="' + _globalize.default.translate('More') + '" aria-label="' + _globalize.default.translate('More') + '" type="button" is="paper-icon-button-light" class="listItemButton ' + contextMenuButtonClass + ' itemAction md-icon" data-action="menu">&#xe5D3;</button>';
        }
        if ((_options$buttonComman = options.buttonCommands) != null && _options$buttonComman.length) {
          var commands = itemController.getCommands({
            items: [item],
            user: apiClient == null ? void 0 : apiClient.getCurrentUserCached()
          });
          commands = commands.filter(function (c) {
            return options.buttonCommands.includes(c.id);
          });
          for (var _i = 0, _length = commands.length; _i < _length; _i++) {
            var cmd = commands[_i];
            html += '<button title="' + cmd.name + '" aria-label="' + cmd.name + '" type="button" is="paper-icon-button-light" class="listItemButton itemAction md-icon' + getMdIconClass(cmd.icon) + '" data-action="' + cmd.id + '">' + cmd.icon + '</button>';
          }
        }
        if (options.dragReorder && item.CanReorder !== false) {
          // Firefox and Edge are not allowing the button to be draggable
          html += '<i class="' + options.dragHandleClass + '">&#xe25D;</i>';
        }
      }
      if (options.itemAccessSelection) {
        html += getItemAccessSelectContainer(item);
      }
    } else {
      if (options.itemAccessSelection) {
        html += '<div style="padding-inline-end:.5em;">';
        if (item.UserItemShareLevel === 'Write') {
          html += _globalize.default.translate('Edit');
        } else if (item.UserItemShareLevel === 'Read') {
          html += _globalize.default.translate('View');
        } else {
          html += _globalize.default.translate('None');
        }
        html += '</div>';
        html += getItemAccessSelectContainer(item, true);
      }
    }
    if (options.enableBottomOverview) {
      var _item$UserData3;
      html += '</div>';
      html += '<div class="' + options.bottomOverviewClassName + '">';
      var _overview2 = item.Overview;
      if (options.hideEpisodeSpoilerInfo && itemType === 'Episode' && ((_item$UserData3 = item.UserData) == null ? void 0 : _item$UserData3.Played) === false) {
        _overview2 = null;
      }
      html += _overview2 ? _dom.default.stripScripts(_overview2) : '';
      html += '</div>';
    }
    html += '</div>';
    if (options.listItemParts) {
      var attributes = _shortcuts.default.getShortcutAttributes(item, options);
      if (action) {
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
      return {
        attributes: attributes,
        html: html
      };
    }
    var dataAttributes = _shortcuts.default.getShortcutAttributesHtml(item, options);
    if (action) {
      dataAttributes += ' data-action="' + action + '"';
    }
    if (!options.isVirtualList) {
      dataAttributes += ' data-index="' + index + '"';
    }
    var fixedAttributes = options.fixedAttributes;
    if (fixedAttributes) {
      dataAttributes += ' ' + fixedAttributes;
    }
    var className = options.className;
    if (item.ItemClass) {
      className += ' ' + item.ItemClass;
    }
    return '<' + tagName + ' class="' + className + '"' + dataAttributes + '>' + html + '</' + tagName + '>';
  }
  function getItemAccessSelectContainer(item, hide) {
    var html = '';
    html += '<div class="selectContainer selectContainer-inline' + (hide ? ' hide' : '') + '">';
    html += '<select data-hidelabeltext="true" is="emby-select" class="emby-select-inline selectItemShareLevel" label="' + _globalize.default.translate('Access') + '" title="' + _globalize.default.translate('Access') + '">';
    var itemAccessItem = item.itemAccessItem;
    if (itemAccessItem.CanMakePublic) {
      html += '<option value="None">' + _globalize.default.translate('None') + '</option>';
    }
    html += '<option value="Read"' + (item.UserItemShareLevel === 'Read' ? ' selected' : '') + '>' + _globalize.default.translate('View') + '</option>';
    html += '<option value="Write"' + (item.UserItemShareLevel === 'Write' ? ' selected' : '') + '>' + _globalize.default.translate('Edit') + '</option>';
    html += '</select>';
    html += '</div>';
    return html;
  }
  function getItemParts(item, index, options) {
    options.listItemParts = true;
    return getListItemHtml(item, index, options);
  }
  function setListOptions(items, options) {
    var _options$buttonComman2;
    if (options.iconSpacing == null) {
      if (options.preferIcon || options.code || options.image !== false && options.roundImage) {
        options.iconSpacing = true;
      }
    }
    if (options.hideEpisodeSpoilerInfo == null) {
      options.hideEpisodeSpoilerInfo = _usersettings.default.hideEpisodeSpoilerInfo();
    }
    if (options.isBoundListItem == null) {
      options.isBoundListItem = true;
    }
    options.itemSelector = '.listItem';
    options.enableDefaultIcon = options.enableDefaultIcon !== false;
    var contentWrapperClass = ((options.contentWrapperClass || '') + ' listItem-content').trim();
    options.contentWrapperClass = contentWrapperClass;
    options.containerAlbumArtistIds = (options.containerAlbumArtists || []).map(getId);
    options.contextMenu = options.contextMenu !== false;
    options.enableUserDataButtons = options.enableUserDataButtons !== false;
    options.moreButton = options.contextMenu && options.moreButton !== false;
    if (!options.fields) {
      options.fields = [];
      options.fields.push('Name');
    }
    options.fields = Array.from(new Set(options.fields));
    if (options.autoMoveParentName) {
      options.fieldsParentNameAfter = options.fields.slice(0);
      var parentNameIndex = options.fieldsParentNameAfter.indexOf('ParentName');
      var nameIndex = options.fieldsParentNameAfter.indexOf('Name');
      if (parentNameIndex !== -1 && nameIndex !== -1 && parentNameIndex < nameIndex) {
        options.fieldsParentNameAfter.splice(parentNameIndex, 1);
        options.fieldsParentNameAfter.splice(nameIndex, 0, 'ParentName');
      }
      if (parentNameIndex !== -1 && nameIndex !== -1 && nameIndex < parentNameIndex) {
        options.fields.splice(parentNameIndex, 1);
        options.fields.splice(Math.max(nameIndex - 1, 0), 0, 'ParentName');
      }
    }
    var fieldMap = {};
    for (var i = 0, length = options.fields.length; i < length; i++) {
      fieldMap[options.fields[i]] = true;
    }
    options.fieldMap = fieldMap;
    var isLargeStyle;
    options.mediaInfo = options.mediaInfo !== false;
    if (options.preferIcon) {
      options.shape = 'square';
    } else {
      options.shape = _imagehelper.default.getShape(items, options) || 'square';
    }

    // don't use banner shape in vertical list. the layout isn't really made for a wide image aspect
    if (options.shape === 'banner') {
      options.shape = 'backdrop';
    }
    if (options.imageSize === 'large') {
      options.contentWrapperClass += ' listItem-content-fb';
      options.imageDownloadWidth = 400;
      isLargeStyle = true;
      options.enableSideMediaInfo = false;
      if (!options.iconSpacing && options.itemMarginY !== false) {
        options.contentWrapperClass += ' listItem-content-marginx3';
      }
    } else if (options.imageSize === 'medium') {
      options.contentWrapperClass += ' listItem-content-fb';
      options.imageDownloadWidth = 200;
      options.enableSideMediaInfo = false;
      if (!options.iconSpacing && options.itemMarginY !== false) {
        options.contentWrapperClass += ' listItem-content-marginx2';
      }
    } else {
      if (!options.iconSpacing && options.itemMarginY !== false) {
        if (options.imageSize === 'small') {
          options.contentWrapperClass += ' listItem-content-marginx2';
        } else {
          options.contentWrapperClass += ' listItem-content-margin';
        }
      }
      options.contentWrapperClass += ' listItem-content-bg';
      if (options.itemBackground) {
        options.contentWrapperClass += ' listItem-content-bg-background';
      }
      options.imageDownloadWidth = 80;
      options.enableSideMediaInfo = options.enableSideMediaInfo != null ? options.enableSideMediaInfo : options.shape === 'square';
    }
    if (options.reOrder == null) {
      options.reOrder = options.dragReorder && options.draggable;
    }
    if (!_layoutmanager.default.tv) {
      options.draggable = options.draggable !== false;
      options.draggableXActions = options.draggableXActions !== false && options.verticalWrap !== true && 'ontouchstart' in document;
      options.anyDraggable = options.draggable || options.draggableXActions;
    } else {
      options.draggable = false;
      options.dragReorder = false;
      options.draggableXActions = false;
      options.anyDraggable = false;
    }
    options.allowButtonCommands = _layoutmanager.default.tv ? false : true;
    options.clickEntireItem = _layoutmanager.default.tv ? !fieldMap.ItemCheckbox : !options.mediaInfo && !options.moreButton && !options.enableUserDataButtons && !options.itemAccessSelection && !options.enableSideMediaInfo && !options.imagePlayButton && !fieldMap.ItemCheckbox && !options.treeButton && !options.draggableXActions && !((_options$buttonComman2 = options.buttonCommands) != null && _options$buttonComman2.length);
    if (_layoutmanager.default.tv) {
      options.imageDownloadWidth *= 1.5;
    }
    options.isLargeStyle = isLargeStyle;
    options.action = options.action || 'link';
    if (!options.playAction) {
      options.playAction = options.action === 'playallfromhere' ? 'playallfromhere' : 'play';
    }
    options.tagName = options.clickEntireItem ? 'button' : 'div';
    options.listItemBodyTagName = 'div';
    options.multiSelectTitle = _globalize.default.translate('MultiSelect');
    options.multiSelect = options.multiSelect !== false && !_layoutmanager.default.tv;
    if (options.multiSelect || fieldMap.ItemCheckbox) {
      loadEmbyCheckbox();
    }
    options.enableUserData = options.enableUserData !== false;
    options.largeFont = !_layoutmanager.default.tv && options.largeFont !== false;
    options.listItemBodyTextTagName = options.imageSize === 'large' || options.largeHeading ? 'h3' : 'div';
    var textCssClass = ('listItemBodyText ' + (options.listItemBodyTextClass || '')).trim();
    if (options.isVirtualList || options.noTextWrap) {
      textCssClass += ' listItemBodyText-nowrap';
    }
    if (options.largeFont) {
      textCssClass += ' listItemBodyText-lf';
    }
    options.listItemBodyTextClass = textCssClass;
    if (isLargeStyle) {
      options.indicatorClass = 'listItemIndicator listItem';
    } else {
      options.indicatorClass = 'listItemIndicator listItemIndicator-mini listItem';
    }
    options.listItemBodyTextSecondaryClass = 'listItemBodyText-secondary ' + secondaryTextClass;
    if (options.imageSize === 'large' || options.imageSize === 'medium') {
      options.listItemBodyTextSecondaryClass += ' listItemBodyText-secondary-of';
    }
    var cssClass = "listItem";
    if (!_layoutmanager.default.tv) {
      options.contentWrapperClass += ' listItemContent-touchzoom';
      if (!_browser.default.iOS && !_browser.default.osx) {
        cssClass += ' listItem-autoactive';
      }
    }
    if (options.verticalWrap) {
      cssClass += '  listItem-vertical-wrap';
    }
    var listItemBodyHasleftPadding = options.image !== false;
    if (options.border || options.highlight !== false && (!_layoutmanager.default.tv || options.forceBorder)) {
      options.contentWrapperClass += ' listItem-border';
      if (listItemBodyHasleftPadding && options.allowBorderXOffset !== false) {
        options.contentWrapperClass += ' listItem-border-offset';
      }
      if (options.autoHideBorderOnTouch) {
        options.contentWrapperClass += ' listItem-border-autohide';
      }
    }
    if (options.clickEntireItem || options.action && options.action !== 'none') {
      cssClass += ' itemAction';
    }
    if (options.tagName === 'div') {
      options.addTabIndex = true;
    }
    if (options.action !== 'none' || options.clickEntireItem) {
      cssClass += ' listItemCursor';
    }
    options.enableFocusScaling = _layoutmanager.default.tv && options.enableFocusScaling !== false && enableFocusTransfrom;
    if (_layoutmanager.default.tv) {
      if (options.enableFocusScaling) {
        cssClass += ' listItem-focusscale';
      }
      if (options.expandOutOnFocus) {
        cssClass += ' listItem-expandout';
      }
      cssClass += ' listItem-tv';
    } else {
      cssClass += ' listItem-hoverable';
    }
    if (isLargeStyle) {
      cssClass += " listItem-largeImage";
    }
    if (options.verticalPadding === false) {
      cssClass += ' listItem-noverticalpadding';
    }
    if (options.itemClass) {
      cssClass += ' ' + options.itemClass;
    }
    if (options.contextMenu && options.clickEntireItem) {
      cssClass += " longpress";
    }
    if (options.dragReorder && options.draggable) {
      cssClass += ' drop-target ordered-drop-target-y';
    } else if (options.dropTarget && !_layoutmanager.default.tv) {
      cssClass += ' drop-target full-drop-target';
    }
    if (options.draggableXActions) {
      cssClass += ' draggable-x';
      if (options.draggable) {
        cssClass += ' draggable-xy';
      }
    }
    options.dragHandleClass = ('listViewDragHandle dragHandle md-icon listItemIcon listItemIcon-transparent ' + (options.dragHandleClass || '')).trim();
    options.className = cssClass;
    var innerHTML = '';
    if (options.shape && options.allowBorderXOffset !== false) {
      options.contentWrapperClass += ' listItem-border-offset-' + options.shape;
      if (options.imageSize) {
        options.contentWrapperClass += ' listItem-border-offset-' + options.imageSize;
        options.contentWrapperClass += ' listItem-border-offset-' + options.shape + '-' + options.imageSize;
      }
    }
    if (options.image !== false) {
      options.aspectInfo = _imagehelper.default.getAspectFromShape(options.shape, options);
      if (fieldMap.Overview) {
        if (options.shape !== 'portrait') {
          options.enableBottomOverview = options.enableBottomOverview !== false;
        }
      }
    } else {
      if (fieldMap.Overview) {
        options.enableBottomOverview = options.enableBottomOverview !== false;
      }
    }
    if (_layoutmanager.default.tv) {
      options.enableBottomOverview = false;
    }
    if (!options.autoMoveFavoriteButton && options.autoMoveFavoriteButton !== false && !options.enableBottomOverview && options.enableUserDataButtons && options.allowButtonCommands) {
      if (items.length && _itemmanager.default.getItemController(items[0].Type).canRate(items[0])) {
        options.autoMoveFavoriteButton = true;
      }
    }
    if (options.enableBottomOverview) {
      options.contentWrapperClass += ' listItem-content-withwrap';
    }
    innerHTML += '<div class="' + options.contentWrapperClass + '">';
    if (options.enableBottomOverview) {
      innerHTML += '<div class="listItem-innerwrapper">';
    }
    if (fieldMap.ItemCheckbox) {
      var itemCheckboxLabelClass = 'listItem-checkboxLabel';
      if (options.roundCheckbox) {
        itemCheckboxLabelClass += ' listItem-checkboxLabel-round';
      }
      options.itemCheckbox = '<label data-action="toggleitemchecked" class="itemAction listItem-emby-checkbox-label emby-checkbox-label secondaryText"><input tabindex="-1" class="chkItemCheckbox emby-checkbox emby-checkbox-notext" is="emby-checkbox" type="checkbox" /><span class="checkboxLabel ' + itemCheckboxLabelClass + '"></span></label>';
      innerHTML += options.itemCheckbox;
    }
    if (options.treeButton) {
      options.disabledTreeButtonHtml = '<button disabled style="visibility:hidden;" is="paper-icon-button-light" type="button" data-action="toggletreenode" class="secondaryText itemAction md-icon autortl paper-icon-button-light ' + (options.treeButtonClass || '') + '">&#xe5cc;</button>';
      options.treeButtonHtml = '<button is="paper-icon-button-light" type="button" data-action="toggletreenode" class="secondaryText itemAction md-icon autortl paper-icon-button-light ' + (options.treeButtonClass || '') + '">&#xe5cc;</button>';
      innerHTML += options.treeButtonHtml;
    }
    if (options.image !== false) {
      var imageContainerClass = ((options.imageContainerClass || '') + ' listItemImageContainer').trim();
      if (options.imageSize) {
        imageContainerClass += ' listItemImageContainer-' + options.imageSize;
        if (_layoutmanager.default.tv) {
          imageContainerClass += ' listItemImageContainer-' + options.imageSize + '-tv';
        }
      }
      if (!options.clickEntireItem) {
        imageContainerClass += ' itemAction';
      }
      if (options.iconSpacing) {
        imageContainerClass += ' listItemImageContainer-margin';
      }
      imageContainerClass += ' listItemImageContainer-' + options.shape;
      options.imageContainerClass = imageContainerClass;
      innerHTML += '<div class="' + imageContainerClass + '"></div>';
    }
    var listItemBodyClassName = ((options.listItemBodyClassName || '') + ' listItemBody').trim();
    if (!options.clickEntireItem) {
      listItemBodyClassName += ' itemAction';
    }
    if (!listItemBodyHasleftPadding) {
      listItemBodyClassName += ' listItemBody-noleftpadding';
    }
    if (options.verticalPadding === false) {
      listItemBodyClassName += ' listItemBody-noverticalpadding';
    }
    if (options.code) {
      listItemBodyClassName += ' listItemBody-code';
    }
    if (options.dragReorder) {
      listItemBodyClassName += ' listItemBody-draghandle';
    }
    if (!options.iconSpacing) {
      listItemBodyClassName += ' listItemBody-reduceypadding';
    }
    var baseIconClass = 'listItemIcon md-icon autortl';
    if (options.iconClass) {
      options.iconClass += ' ' + baseIconClass;
    } else {
      options.iconClass = baseIconClass;
    }
    var textlines = [];
    for (var _i2 = 0, _length2 = options.fields.length; _i2 < _length2; _i2++) {
      var field = options.fields[_i2];
      switch (field) {
        case 'ItemCheckbox':
        case 'ProductionYear':
          // part of mediainfo
          break;
        default:
          textlines.push('&nbsp;');
          break;
      }
    }
    if (fieldMap.Overview) {
      if (options.isLargeStyle) {
        options.overviewLines = options.overviewLines || 3;
      } else {
        options.overviewLines = options.overviewLines || 2;
      }
      options.overviewClass = 'listItem-overview-' + options.overviewLines + '-lines';
    }
    var lineCount = textlines.length;
    if (fieldMap.Overview) {
      lineCount += options.overviewLines - 1;
    }
    if (options.mediaInfo && !options.enableSideMediaInfo) {
      lineCount++;
    }

    //if (options.isVirtualList) {
    listItemBodyClassName += ' listItemBody-' + lineCount + '-lines';
    //}

    options.listItemBodyClassName = listItemBodyClassName;
    innerHTML += '<' + options.listItemBodyTagName + ' class="' + options.listItemBodyClassName + '">';
    innerHTML += getTextLinesHtml(textlines, options);
    if (fieldMap.Overview) {
      if (options.mediaInfo) {
        if (!options.enableSideMediaInfo) {
          innerHTML += '<div class="listItemMediaInfo listItemBodyText ' + options.listItemBodyTextSecondaryClass + ' listItemBodyText-nowrap"></div>';
        }
      }
      options.topOverviewClassName = 'listItem-overview listItem-topoverview listItemBodyText ' + options.listItemBodyTextSecondaryClass;
      if (options.enableBottomOverview) {
        options.topOverviewClassName += ' listItem-overview-autohide';
      }
      options.topOverviewClassName += ' ' + options.overviewClass;
      innerHTML += '<div class="' + options.topOverviewClassName + '"></div>';
    }
    innerHTML += '</' + options.listItemBodyTagName + '>';
    if (options.dragReorder) {
      //html += '<button is="paper-icon-button-light" class="listViewDragHandle listItemButton"><i class="md-icon">&#xe25D;</i></button>';
      // Firefox and Edge are not allowing the button to be draggable
      // use visibility:hidden for the template so that we're not seeing it in placeholder items while scrolling
      innerHTML += '<i class="' + options.dragHandleClass + '" style="visibility:hidden;">&#xe25D;</i>';
    }
    if (options.enableBottomOverview) {
      innerHTML += '</div>';
      options.bottomOverviewClassName = 'listItem-bottomoverview secondaryText';
      options.bottomOverviewClassName += ' ' + options.overviewClass;
      innerHTML += '<div class="' + options.bottomOverviewClassName + '">&nbsp;</div>';
    }
    innerHTML += '</div>';
    var fixedAttributes = '';
    if (options.addTabIndex) {
      fixedAttributes += ' tabindex="0"';
    }
    if (options.anyDraggable) {
      fixedAttributes += ' draggable="true"';
    }
    if (options.tagName === 'button') {
      fixedAttributes += ' type="button"';
    }
    if (!options.clickEntireItem) {
      // this is mainly for when item checkboxes are used
      //fixedAttributes += ' data-focusabletype="autofocus"';
    }
    options.fixedAttributes = fixedAttributes.trim();
    options.templateInnerHTML = innerHTML;
  }
  function getItemsHtml(items, options) {
    setListOptions(items, options);
    var groupTitle = '';
    var html = '';
    for (var i = 0, length = items.length; i < length; i++) {
      var item = items[i];
      if (options.showIndex) {
        var itemGroupTitle = getIndex(item, options);
        if (itemGroupTitle !== groupTitle) {
          if (i === 0) {
            html += '<h2 class="listGroupHeader listGroupHeader-first">';
          } else {
            html += '<h2 class="listGroupHeader">';
          }
          html += itemGroupTitle;
          html += '</h2>';
          groupTitle = itemGroupTitle;
        }
      }
      html += getListItemHtml(item, i, options);
    }
    return html;
  }
  function buildItems(items, options) {
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
    var html = getItemsHtml(items, options);
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
  function setListClasses(elem) {
    var classList = elem.classList;
    classList.remove('vertical-wrap', 'itemsContainer-horizontalgrid', 'itemsContainer-horizontalgrid-withcolumns');
    classList.add('vertical-list');
  }
  function removeNowPlayingIndicator(indicator) {
    indicator.classList.remove('itemelement-nowplaying', 'listviewitemelement-nowplaying', 'listviewitemelement-nowplaying-indexnumber', 'listviewitemelement-nowplaying-left', 'listviewitemelement-nowplaying-right');
  }
  function addNowPlayingIndicator(itemElement) {
    var listItemImageContainer = itemElement.querySelector('.listItemImageContainer');
    if (listItemImageContainer) {
      listItemImageContainer.classList.add('itemelement-nowplaying', 'listviewitemelement-nowplaying');
      return;
    }
    var indexNumberElement = itemElement.querySelector('.listItem-indexnumberleft');
    if (indexNumberElement) {
      indexNumberElement.classList.add('itemelement-nowplaying', 'listviewitemelement-nowplaying', 'listviewitemelement-nowplaying-indexnumber');
      if (document.dir === 'rtl') {
        indexNumberElement.classList.add('listviewitemelement-nowplaying-right');
      } else {
        indexNumberElement.classList.add('listviewitemelement-nowplaying-left');
      }
      return;
    }
  }
  var _default = _exports.default = {
    getItemsHtml: getItemsHtml,
    setListOptions: setListOptions,
    getItemParts: getItemParts,
    buildItems: buildItems,
    virtualChunkSize: 30,
    setListClasses: setListClasses,
    removeNowPlayingIndicator: removeNowPlayingIndicator,
    addNowPlayingIndicator: addNowPlayingIndicator
  };
});
