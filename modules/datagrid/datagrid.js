define(["exports", "./../emby-apiclient/events.js", "./../emby-apiclient/connectionmanager.js", "./../layoutmanager.js", "./../common/globalize.js", "./../common/datetime.js", "./../common/textencoding.js", "./../common/dataformatter.js", "./../mediainfo/mediainfo.js", "./../focusmanager.js", "./../common/itemmanager/itemmanager.js", "./../common/imagehelper.js", "./../lazyloader/lazyimageloader.js", "./../shortcuts.js", "./../common/playback/playbackmanager.js", "./../emby-elements/userdatabuttons/emby-ratingbutton.js", "./../emby-elements/userdatabuttons/emby-playstatebutton.js", "./../emby-elements/sync/emby-downloadbutton.js", "./../emby-elements/emby-button/emby-button.js", "./../dom.js", "./../browser.js", "./../common/usersettings/usersettings.js"], function (_exports, _events, _connectionmanager, _layoutmanager, _globalize, _datetime, _textencoding, _dataformatter, _mediainfo, _focusmanager, _itemmanager, _imagehelper, _lazyimageloader, _shortcuts, _playbackmanager, _embyRatingbutton, _embyPlaystatebutton, _embyDownloadbutton, _embyButton, _dom, _browser, _usersettings) {
  Object.defineProperty(_exports, "__esModule", {
    value: true
  });
  _exports.default = void 0;
  /* jshint module: true */

  require(['css!modules/datagrid/datagrid.css']);
  var supportsNativeLazyLoading = 'loading' in HTMLImageElement.prototype;
  var supportsAsyncDecodedImages = _dom.default.supportsAsyncDecodedImages();
  var decodingAttribute = supportsAsyncDecodedImages ? ' decoding="async"' : '';
  // in edge, cascading object-fit values are not overriding previous ones
  var supportsObjectFit = CSS.supports('object-fit', 'contain');
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
  function getTextActionButton(options, item, text, textSuffix, cssClass, serverId, parentId, isSameItemAsCard) {
    if (!text) {
      text = _itemmanager.default.getDisplayName(item, {
        includeIndexNumber: false,
        hideEpisodeSpoilerInfo: options.hideEpisodeSpoilerInfo
      });
    }
    if (textSuffix) {
      text += textSuffix;
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
    var draggable = !options.anyDraggable || isSameItemAsCard ? '' : ' draggable="true"';
    var html = '<button title="' + text + '" title="' + text + '" ' + dataAttributes + ' type="button"' + draggable + ' class="itemAction textActionButton dataGridItem-textActionButton emby-button button-link ' + (cssClass || '') + '" data-action="link">';
    html += text;
    html += '</button>';
    return html;
  }
  function getTextLinks(items, linkedType, item, options) {
    if (!items.length) {
      return '';
    }
    return '<div class="textItems textItems-nowrap">' + items.map(function (i, index) {
      i.Type = linkedType;
      i.IsFolder = true;
      var suffix = index < items.length - 1 ? ',' : '';
      return getTextActionButton(options, i, null, suffix, 'textItem', item.ServerId);
    }).join('') + '</div>';
  }
  function getPeopleTextLinks(items, personType, item, options) {
    items = items.filter(function (i) {
      return i.Type === personType;
    });
    return getTextLinks(items, 'Person', item, options);
  }
  function getEpisodeNumber(item) {
    var number = item.IndexNumber;
    if (number == null) {
      return null;
    }
    if (item.ParentIndexNumber != null) {
      var season = "S" + item.ParentIndexNumber;
      if (item.SeasonId) {
        season = getTextActionButton({}, {
          Id: item.SeasonId,
          Type: 'Season',
          ServerId: item.ServerId,
          Name: season,
          IsFolder: true
        });
      }
      number = season + ":E" + number;
    }
    if (item.IndexNumberEnd != null) {
      number += "-" + item.IndexNumberEnd;
    }
    return number;
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
  function getCellImage(item, options) {
    var imageItem;
    if (options.showCurrentProgramImage) {
      imageItem = item.CurrentProgram || item;
    } else {
      imageItem = item.ProgramInfo || item;
    }
    var apiClient = _connectionmanager.default.getApiClient(item);
    var imgUrlInfo = _imagehelper.default.getImageUrl(imageItem, apiClient, {
      width: 80,
      showChannelLogo: options.imageSource === 'channel',
      uiAspect: options.aspectInfo.aspect
    });
    var imgUrl = options.preferIcon ? null : imgUrlInfo.imgUrl;
    var html = '';
    var hoverPlayButtonRequested = !_layoutmanager.default.tv && options.hoverPlayButton !== false;
    var enableHoverPlayButton = hoverPlayButtonRequested && _playbackmanager.default.canPlay(item);
    if (imgUrl) {
      var imageContainerClass = 'dataGridItemImageContainer dataGridItemImageContainer-' + options.shape;
      var imageClass = 'dataGridItemCell-img';
      var itemShape = imgUrlInfo.aspect ? _imagehelper.default.getShapeFromAspect(imgUrlInfo.aspect) : _imagehelper.default.getShape([item], options) || 'square';
      if (options.shape === 'square') {
        switch (item.Type) {
          case 'MusicArtist':
            imageClass += ' dataGridItemCell-img-round';
            break;
          default:
            break;
        }
      }
      if (options.playQueueIndicator !== false) {
        var currentPlayingItemId = CurrentPlayingItemId;
        if (currentPlayingItemId) {
          if (currentPlayingItemId === item.PlaylistItemId || currentPlayingItemId === item.Id) {
            if (!_playbackmanager.default.paused()) {
              imageContainerClass += ' itemelement-nowplaying dataGridItemImageContainer-nowplaying';
            }
          }
        }
      }
      var styleRules = [];
      styleRules.push('aspect-ratio:' + options.aspectInfo.aspectCss);
      var style = styleRules.length ? ' style="' + styleRules.join(';') + '"' : '';
      html += '<div class="' + imageContainerClass + '"' + style + '>';
      var aspectInfo = _imagehelper.default.getAspectFromShape(itemShape, options);
      imageClass += ' dataGridItemImage-' + itemShape;
      var coveredImageClass = _imagehelper.default.getCoveredImageClass(imageItem, apiClient, imgUrlInfo, aspectInfo.aspect);
      if (coveredImageClass) {
        imageClass += coveredImageClass;
      }
      if (options.lazy === 2) {
        if (supportsObjectFit) {
          html += '<img draggable="false" class="' + imageClass + '"' + decodingAttribute + ' style="aspect-ratio:' + aspectInfo.aspectCss + ';" src="' + imgUrl + '" />';
        } else {
          html += '<div class="' + imageClass + '" style="aspect-ratio:' + aspectInfo.aspectCss + ';background-image:url(' + imgUrl + ');">';
        }
      } else if (supportsNativeLazyLoading && supportsObjectFit) {
        html += '<img draggable="false" class="' + imageClass + '" loading="lazy"' + decodingAttribute + ' style="aspect-ratio:' + aspectInfo.aspectCss + ';" src="' + imgUrl + '" />';
      } else {
        html += '<div class="' + imageClass + ' lazy" style="aspect-ratio:' + aspectInfo.aspectCss + ';background-image:url(' + imgUrl + ');">';
      }
      html += '</div>';
    }
    if (enableHoverPlayButton) {
      var playButtonAction = getPlayAction(item, options);
      html += '<button tabindex="-1" type="button" is="paper-icon-button-light" class="dataGridItemOverlayButton-hover dataGridItemOverlayButton-imagehover itemAction" data-action="' + playButtonAction + '"><i class="md-icon md-icon-fill dataGridItemOverlayButtonIcon autortl">&#xe037;</i></button>';
    }
    return html;
  }
  function getColumnInnerHtml(item, itemController, column, options) {
    var _item$UserData, _item$UserData2, _item$UserData3;
    switch (column.id) {
      case 'Name':
        return getTextActionButton(options, item, null, null, null, null, null, true);
      case 'Number':
        return item.Number || item.IndexNumber;
      case 'ProductionYear':
        return item.ProductionYear;
      case 'Filename':
        var filename = item.FileName || item.Filename;
        if (filename) {
          return getTextActionButton(options, item, filename, null, null, null, null, true);
        }
        return filename;
      case 'Path':
        return item.Path;
      case 'SortName':
        return _textencoding.default.htmlEncode(item.SortName || '');
      case 'OriginalTitle':
        return _textencoding.default.htmlEncode(item.OriginalTitle || '');
      case 'Overview':
        return _textencoding.default.htmlEncode(item.Overview || '');
      case 'Tagline':
        return _textencoding.default.htmlEncode((item.Taglines || [])[0] || '');
      case 'Runtime':
        return item.RunTimeTicks ? _datetime.default.getHumanReadableRuntime(item.RunTimeTicks) : null;
      case 'PremiereDate':
        return item.PremiereDate ? _datetime.default.toLocaleDateString(new Date(Date.parse(item.PremiereDate))) : null;
      case 'StartDate':
        return item.StartDate ? _datetime.default.toLocaleString(new Date(Date.parse(item.StartDate))) : null;
      case 'DatePlayed':
        return (_item$UserData = item.UserData) != null && _item$UserData.LastPlayedDate ? _datetime.default.toLocaleDateString(new Date(Date.parse((_item$UserData2 = item.UserData) == null ? void 0 : _item$UserData2.LastPlayedDate))) : null;
      case 'CommunityRating':
        return item.CommunityRating ? _mediainfo.default.getCommunityRating(item, {
          outerClass: 'dataGridMediaInfoItem'
        }) : null;
      case 'OfficialRating':
        return item.OfficialRating;
      case 'EpisodeNumber':
        return getEpisodeNumber(item);
      case 'SeriesName':
        if (item.SeriesId && item.Type === 'Episode') {
          return getTextActionButton(options, {
            Id: item.SeriesId,
            Type: 'Series',
            ServerId: item.ServerId,
            Name: item.SeriesName,
            IsFolder: true
          });
        }
        return item.SeriesName;
      case 'Album':
        if (item.AlbumId) {
          return getTextActionButton(options, {
            Id: item.AlbumId,
            Type: 'MusicAlbum',
            ServerId: item.ServerId,
            Name: item.Album,
            IsFolder: true
          });
        }
        return item.Album;
      case 'IndexNumber':
        return item.IndexNumber;
      case 'Genres':
        return getTextLinks(item.GenreItems || [], 'Genre', item, options);
      case 'Studios':
        return getTextLinks(item.Studios || [], 'Studio', item, options);
      case 'Tags':
        return getTextLinks(item.TagItems || [], 'Tag', item, options);
      case 'Artist':
        return getTextLinks(item.ArtistItems || [], 'MusicArtist', item, options);
      case 'AlbumArtist':
        return getTextLinks(item.AlbumArtists || [], 'MusicArtist', item, options);
      case 'Director':
        return getPeopleTextLinks(item.People || [], 'Director', item, options);
      case 'Composer':
        return getTextLinks(item.Composers || [], 'MusicArtist', item, options);
      case 'ParentIndexNumber':
        return item.ParentIndexNumber;
      case 'Video3DFormat':
        return item.Video3DFormat ? '<i class="md-icon">&#xe5ca;</i>' : null;
      case 'CriticRating':
        return item.CriticRating ? _mediainfo.default.getCriticRating(item, {
          outerClass: 'dataGridMediaInfoItem'
        }) : null;
      case 'PlayCount':
        return (_item$UserData3 = item.UserData) == null ? void 0 : _item$UserData3.PlayCount;
      case 'Resolution':
        return item.Width && item.Height ? _dataformatter.default.getResolutionText(item) : null;
      case 'IsDisabled':
        {
          var _item$Policy;
          if ((_item$Policy = item.Policy) != null && _item$Policy.IsDisabled) {
            return '<i title="' + _globalize.default.translate('Disabled') + '" class="dataGridItemCell-icon md-icon secondaryText">&#xe510;</i>';
          }
          return '';
        }
      case 'EnableRemoteAccess':
        {
          var _item$Policy2;
          if ((_item$Policy2 = item.Policy) != null && _item$Policy2.EnableRemoteAccess) {
            return '<i title="' + _globalize.default.translate('RemoteAccess') + '" class="dataGridItemCell-icon md-icon secondaryText">&#xe5ca;</i>';
          }
          return '';
        }
      case 'IsAdministrator':
        {
          var _item$Policy3;
          if ((_item$Policy3 = item.Policy) != null && _item$Policy3.IsAdministrator) {
            return '<i title="' + _globalize.default.translate('Admin') + '" class="dataGridItemCell-icon md-icon secondaryText">&#xef3d;</i>';
          }
          return '';
        }
      case 'HasPassword':
        {
          if (item.HasConfiguredPassword) {
            return '<i title="' + _globalize.default.translate('Password') + '" class="dataGridItemCell-icon md-icon secondaryText">&#xe897;</i>';
          }
          return '';
        }
      case 'HasProfilePin':
        {
          var _item$Configuration;
          if ((_item$Configuration = item.Configuration) != null && _item$Configuration.ProfilePin) {
            return '<i title="' + _globalize.default.translate('TitleProfilePin') + '" class="dataGridItemCell-icon md-icon secondaryText">&#xe5ca;</i>';
          }
          return '';
        }
      case 'ColumnSelector':
        {
          return getCellImage(item, options);
        }
      case 'Image':
        {
          return getCellImage(item, options);
        }
      case 'ContextMenu':
        {
          return '<button title="' + _globalize.default.translate('More') + '" aria-label="' + _globalize.default.translate('More') + '" type="button" is="paper-icon-button-light" class="color-accent dataGridItemCell-button dataGridItemContextMenuButton itemAction md-icon" data-action="menu">&#xe5D3;</button>';
        }
      case 'IsFavorite':
        {
          if (_itemmanager.default.canRate(item)) {
            //let likes = userData.Likes == null ? '' : userData.Likes;
            return _embyRatingbutton.default.getHtml(item.UserData.IsFavorite, 'dataGridItemCell-button paper-icon-button-light itemAction');
          }
          return '';
        }
      case 'Played':
        {
          if (_itemmanager.default.canMarkPlayed(item)) {
            //let likes = userData.Likes == null ? '' : userData.Likes;
            return _embyPlaystatebutton.default.getHtml(item.UserData.Played, 'dataGridItemCell-button paper-icon-button-light itemAction');
          }
          return '';
        }
      case 'Download':
        {
          if (_itemmanager.default.canSync(item)) {
            //let likes = userData.Likes == null ? '' : userData.Likes;
            return _embyDownloadbutton.default.getHtml(item, 'dataGridItemCell-button paper-icon-button-light itemAction color-accent');
          }
          return '';
        }
      case 'Play':
        {
          if (_playbackmanager.default.canPlay(item)) {
            return '<button title="' + _globalize.default.translate('Play') + '" aria-label="' + _globalize.default.translate('Play') + '" type="button" is="paper-icon-button-light" class="dataGridItemCell-button itemAction md-icon autortl secondaryText" data-action="playallfromhere">&#xe1c4;</button>';
          }
          return '';
        }
      default:
        return itemController.resolveField(item, column.id);
    }
  }
  var columnSizes = [2, 3, 4, 5, 6, 7, 8, 9, 10, 12, 15, 18, 20, 25, 30, 40, 80];
  function getColumnRenderSize(column, options) {
    var size = column.size;
    if (size) {
      var _options$sortValues;
      var titleSize;
      if (column.gridColumnType === 'button' || column.gridColumnType === 'icon') {
        titleSize = size;
      } else {
        var _column$name;
        titleSize = Math.ceil((((_column$name = column.name) == null ? void 0 : _column$name.length) || 0) * 0.8);
      }
      var sortBy = (_options$sortValues = options.sortValues) == null ? void 0 : _options$sortValues.sortBy;
      if (sortBy) {
        if (column.sortBy === sortBy) {
          titleSize += 2;
        }
      }

      // add 1 because the css is adding 1ch to each column size
      size = Math.max(size, titleSize);
      for (var i = 0, length = columnSizes.length; i < length; i++) {
        var columnSize = columnSizes[i];
        if (size <= columnSize) {
          return columnSize;
        }
      }
    }
    return columnSizes[columnSizes.length - 1];
  }
  function getColumnHtml(item, itemController, column, options, isHeader) {
    var html = '';
    var columnClass = 'dataGridItemCell';
    if (column.center) {
      columnClass += ' dataGridItemCell-centered';
    }
    if (column.center) {
      switch (column.gridColumnType) {
        case 'button':
        case 'icon':
          columnClass += ' dataGridItemCell-nopadding';
          break;
        default:
          break;
      }
    }
    var sortValues = options.sortValues;
    if (column.fillGrid) {
      columnClass += ' dataGridItemCell-fill';
    }
    var interactiveHeader = !_layoutmanager.default.tv;
    columnClass += ' dataGridItemCell-' + column.renderSize;
    html += '<div class="' + columnClass + ' dataGridItemCell-fillheight">';
    var innerHTML;
    if (isHeader) {
      var headerTextClass = 'dataGridHeaderText';
      if (column.center) {
        headerTextClass += ' dataGridHeaderText-centered';
      }
      if (column.sortBy && interactiveHeader) {
        var tooltip = _globalize.default.translate('SortByValue', column.name);
        innerHTML = '<button title="' + tooltip + '" aria-label="' + tooltip + '" type="button" is="emby-linkbutton" class="' + headerTextClass + ' button-link button-inherit-color btnGridHeaderColumnSort" data-sortvalue="' + column.sortBy + '">';
        innerHTML += column.gridDisplayNameHtml || column.gridDisplayNameText || column.name;
        if (column.sortBy === (sortValues == null ? void 0 : sortValues.sortBy)) {
          innerHTML += '<i class="md-icon dataGridSortIndicator">';
          if (sortValues.sortOrder === 'Descending') {
            innerHTML += '&#xe5db;';
          } else {
            innerHTML += '&#xe5d8;';
          }
          innerHTML += '</i>';
        }
        innerHTML += '</button>';
      } else {
        innerHTML = '<div class="' + headerTextClass + '">';
        innerHTML += column.gridDisplayNameHtml || column.gridDisplayNameText || column.name;
        innerHTML += '</div>';
      }
    } else {
      innerHTML = getColumnInnerHtml(item, itemController, column, options);
      if (innerHTML == null) {
        innerHTML = '&nbsp;';
      }
    }
    html += innerHTML;
    html += '</div>';
    return html;
  }
  function getListItemHtml(item, index, options) {
    var tagName = options.tagName;
    var action = options.action;
    var html = '';
    if (options.multiSelect) {
      html += '<label title="' + options.multiSelectTitle + '" data-action="multiselect" class="secondaryText chkDataGridItemSelectContainer chkItemSelectContainer itemAction emby-checkbox-label"><input tabindex="-1" class="chkListItemSelect chkItemSelect emby-checkbox emby-checkbox-notext" is="emby-checkbox" type="checkbox" data-classes="true" /><span class="checkboxLabel chkListItemSelect-checkboxLabel"></span></label>';
    }
    html += '<div class="' + options.contentWrapperClass + '">';
    var itemController = _itemmanager.default.getItemController(item.Type);
    var columns = options.columns;
    for (var i = 0, length = columns.length; i < length; i++) {
      var column = columns[i];
      html += getColumnHtml(item, itemController, column, options, false);
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
    return '<' + tagName + ' class="' + options.className + '"' + dataAttributes + '>' + html + '</' + tagName + '>';
  }
  function getItemParts(item, index, options) {
    options.listItemParts = true;
    return getListItemHtml(item, index, options);
  }
  function findInsertIndexForOptionsColumn(columns) {
    for (var i = 0, length = columns.length; i < length; i++) {
      var column = columns[i];
      switch (column.id) {
        case 'Name':
          return i + 1;
        default:
          break;
      }
    }
    for (var _i = 0, _length = columns.length; _i < _length; _i++) {
      var _column = columns[_i];
      if (!_column.gridColumnType) {
        return _i + 1;
      }
    }
    return 1;
  }
  function setListOptions(items, options) {
    options.shape = _imagehelper.default.getShape(items, options) || 'square';
    options.aspectInfo = _imagehelper.default.getAspectFromShape(options.shape, options);
    if (options.hideEpisodeSpoilerInfo == null) {
      options.hideEpisodeSpoilerInfo = _usersettings.default.hideEpisodeSpoilerInfo();
    }

    // don't use banner shape in vertical list. the layout isn't really made for a wide image aspect
    if (options.shape === 'banner') {
      options.shape = 'backdrop';
    }
    options.columnSelector = !_layoutmanager.default.tv && options.columnSelector !== false;
    if (options.isBoundListItem == null) {
      options.isBoundListItem = true;
    }
    options.itemSelector = '.dataGridItem';
    options.enableScrollX = !_layoutmanager.default.tv;
    options.enableFixedPositionHeader = options.enableScrollX;
    options.dataGridItemContentClass = 'dataGridItem-content';
    options.contextMenu = options.contextMenu !== false;
    options.enableUserDataButtons = options.enableUserDataButtons !== false;
    options.moreButton = options.contextMenu && options.moreButton !== false && !_layoutmanager.default.tv;
    if (options.moreButton) {
      var contextMenuColumn = {
        gridColumnType: 'button',
        name: ' ',
        gridDisplayNameText: ' ',
        id: 'ContextMenu',
        size: 5,
        center: true
      };
      if (options.columns.length >= 2) {
        options.columns.splice(findInsertIndexForOptionsColumn(options.columns), 0, contextMenuColumn);
      } else {
        options.columns.push(contextMenuColumn);
      }
    }
    if (options.columnSelector) {
      options.columns.splice(0, 0, {
        gridColumnType: 'button',
        // this value isn't actually needed
        id: 'ColumnSelector',
        size: 5,
        renderSize: 5,
        name: ' ',
        center: true,
        gridDisplayNameHtml: '<button title="' + _globalize.default.translate('HeaderSelectColumns') + '" aria-label="' + _globalize.default.translate('HeaderSelectColumns') + '" type="button" is="paper-icon-button-light" class="dataGridItemCell-button btnConfigureGridColumns itemAction md-icon secondaryText">&#xf1be;</button>'
      });
    }
    for (var i = 0, length = options.columns.length; i < length; i++) {
      options.columns[i].renderSize = getColumnRenderSize(options.columns[i], options);
    }
    if (options.enableScrollX) {
      var scrollXWidth = 0;
      for (var _i2 = 0, _length2 = options.columns.length; _i2 < _length2; _i2++) {
        scrollXWidth += options.columns[_i2].renderSize + 1;
      }
      if (_layoutmanager.default.tv) {
        options.scrollXWidth = 'calc(' + scrollXWidth + 'ch + 6.8% + env(safe-area-inset-left, 0))';
      } else {
        options.scrollXWidth = 'calc(' + scrollXWidth + 'ch + 6.8% + 20px + env(safe-area-inset-left, 0))';
      }
      if (!scrollXWidth) {
        options.enableScrollX = false;
      }
    } else {
      options.dataGridItemContentClass += ' dataGridItem-content-noscroll';
    }
    options.contentWrapperClass = options.dataGridItemContentClass;
    if (!options.fields) {
      options.fields = [];
    }
    var fieldMap = {};
    for (var _i3 = 0, _length3 = options.fields.length; _i3 < _length3; _i3++) {
      fieldMap[options.fields[_i3]] = true;
    }
    options.fieldMap = fieldMap;
    options.clickEntireItem = _layoutmanager.default.tv ? !fieldMap.ItemCheckbox : !options.mediaInfo && !options.moreButton && !options.enableUserDataButtons && !fieldMap.ItemCheckbox;
    options.action = options.action || 'link';
    if (!options.playAction) {
      options.playAction = options.action === 'playallfromhere' ? 'playallfromhere' : 'play';
    }
    options.tagName = options.clickEntireItem ? 'button' : 'div';
    options.multiSelectTitle = _globalize.default.translate('MultiSelect');
    options.multiSelect = options.multiSelect !== false && !_layoutmanager.default.tv;
    if (options.multiSelect) {
      loadEmbyCheckbox();
    }
    options.enableUserData = options.enableUserData !== false;
    var cssClass = "dataGridItem";
    if (!_layoutmanager.default.tv) {
      options.contentWrapperClass += ' dataGridItem-content-touchzoom';
      if (!_browser.default.iOS && !_browser.default.osx) {
        cssClass += ' dataGridItem-autoactive';
      }
    }
    if (options.clickEntireItem || options.action && options.action !== 'none') {
      cssClass += ' itemAction';
    }
    if (options.tagName === 'div') {
      cssClass += ' focusable';
      options.addTabIndex = true;
    } else if (options.tagName === 'button') {
      cssClass += ' dataGridItem-button';
    }
    if (options.action !== 'none' || options.clickEntireItem) {
      cssClass += ' dataGridItemCursor';
    }
    if (_layoutmanager.default.tv) {
      cssClass += ' dataGridItem-focusscale';
    } else {
      cssClass += ' dataGridItem-hoverable';
    }
    if (!_layoutmanager.default.tv) {
      options.draggable = options.draggable !== false;
      options.anyDraggable = options.draggable;
    } else {
      options.draggable = false;
      options.anyDraggable = options.draggable;
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
    options.className = cssClass;
    var innerHTML = '';
    innerHTML += '<div class="' + options.contentWrapperClass + '">';
    var columns = options.columns;
    var item = {};
    var itemController = _itemmanager.default.getItemController(item.Type);
    for (var _i4 = 0, _length4 = columns.length; _i4 < _length4; _i4++) {
      innerHTML += getColumnHtml(item, itemController, columns[_i4], options);
    }
    innerHTML += '</div>';
    var fixedAttributes = '';
    if (options.addTabIndex) {
      fixedAttributes += ' tabindex="0"';
    }
    if (options.anyDraggable) {
      fixedAttributes += ' draggable="true"';
    }
    if (!options.clickEntireItem) {
      // this is mainly for when item checkboxes are used
      //fixedAttributes += ' data-focusabletype="autofocus"';
    }
    options.fixedAttributes = fixedAttributes.trim();
    //console.log('grid template: ' + innerHTML);
    options.templateInnerHTML = innerHTML;
  }
  function getItemsHtml(items, options) {
    setListOptions(items, options);
    var html = '';
    for (var i = 0, length = items.length; i < length; i++) {
      var item = items[i];
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
  function renderHeader(itemsContainer, headerElement, options) {
    headerElement.classList.add('dataGridHeader');
    if (options.enableScrollX) {
      headerElement.classList.add('scrollX', 'hiddenScrollX');
    }
    var html = '';
    var contentAttr = '';
    if (options.enableScrollX) {
      contentAttr = ' style="width:' + options.scrollXWidth + ';"';
    }
    html += '<div' + contentAttr + ' class="dataGridHeader-content padded-left padded-right ' + options.dataGridItemContentClass + '">';
    html += '<div class="dataGridHeader-content-inner">';
    var columns = options.columns;
    for (var i = 0, length = columns.length; i < length; i++) {
      var column = columns[i];
      html += getColumnHtml(null, null, column, options, true);
    }
    html += '</div>';
    html += '</div>';
    headerElement.innerHTML = html;
  }
  function onMultiSelectActive(itemsContainer, header) {
    if (header) {
      header.classList.add('multi-select-active');
    }
  }
  function onMultiSelectInactive(itemsContainer, header) {
    if (header) {
      header.classList.remove('multi-select-active');
    }
  }
  function removeNowPlayingIndicator(indicator) {
    indicator.classList.remove('itemelement-nowplaying', 'dataGridItemImageContainer-nowplaying');
  }
  function addNowPlayingIndicator(itemElement) {
    var listItemImageContainer = itemElement.querySelector('.dataGridItemImageContainer');
    if (listItemImageContainer) {
      listItemImageContainer.classList.add('itemelement-nowplaying', 'dataGridItemImageContainer-nowplaying');
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
    renderHeader: renderHeader,
    onMultiSelectActive: onMultiSelectActive,
    onMultiSelectInactive: onMultiSelectInactive,
    removeNowPlayingIndicator: removeNowPlayingIndicator,
    addNowPlayingIndicator: addNowPlayingIndicator
  };
});
