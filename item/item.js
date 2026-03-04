define(["exports", "./../modules/loading/loading.js", "./../modules/emby-apiclient/connectionmanager.js", "./../modules/emby-apiclient/apiclient.js", "./../modules/emby-apiclient/events.js", "./../modules/common/globalize.js", "./../modules/common/playback/playbackmanager.js", "./../modules/common/playback/playbackactions.js", "./../modules/appheader/appheader.js", "./../modules/backdrop/backdrop.js", "./../modules/common/itemhelper.js", "./../modules/common/appsettings.js", "./../modules/common/dataformatter.js", "./../modules/common/itemmanager/itemmanager.js", "./../modules/layoutmanager.js", "./../modules/common/usersettings/usersettings.js", "./../modules/viewmanager/baseview.js", "./../modules/emby-elements/emby-scroller/emby-scroller.js", "./../modules/emby-elements/emby-tabs/emby-tabs.js", "./../modules/emby-elements/emby-itemscontainer/emby-itemscontainer.js", "./../modules/emby-elements/emby-button/emby-button.js", "./../modules/emby-elements/sync/emby-downloadbutton.js", "./../modules/emby-elements/emby-select/emby-select.js", "./../modules/emby-elements/emby-dialogclosebutton/emby-dialogclosebutton.js", "./../modules/listview/listview.js", "./../modules/cardbuilder/cardbuilder.js", "./../modules/itemcontextmenu.js", "./../modules/indicators/indicators.js", "./../modules/navdrawer/navdrawer.js", "./../modules/common/textencoding.js", "./../modules/dom.js", "./../modules/approuter.js", "./../modules/common/datetime.js", "./../modules/mediainfo/mediainfo.js", "./../modules/common/servicelocator.js", "./../modules/focusmanager.js", "./../modules/common/imagehelper.js", "./../modules/skinmanager.js", "./../modules/common/input/api.js", "./linkeditems.js"], function (_exports, _loading, _connectionmanager, _apiclient, _events, _globalize, _playbackmanager, _playbackactions, _appheader, _backdrop, _itemhelper, _appsettings, _dataformatter, _itemmanager, _layoutmanager, _usersettings, _baseview, _embyScroller, _embyTabs, _embyItemscontainer, _embyButton, _embyDownloadbutton, _embySelect, _embyDialogclosebutton, _listview, _cardbuilder, _itemcontextmenu, _indicators, _navdrawer, _textencoding, _dom, _approuter, _datetime, _mediainfo, _servicelocator, _focusmanager, _imagehelper, _skinmanager, _api, _linkeditems) {
  Object.defineProperty(_exports, "__esModule", {
    value: true
  });
  _exports.default = void 0;
  /* jshint module: true */

  require(['flexStyles', 'css!item/item.css', 'css!tv|item/item_2_tv.css']);
  var backdropContainer = document.querySelector('.backdropContainer');
  var backgroundContainer = document.querySelector('.backgroundContainer');
  var skinHeader = document.querySelector('.skinHeader');
  var supportsAsyncDecodedImages = _dom.default.supportsAsyncDecodedImages();
  var decodingAttribute = supportsAsyncDecodedImages ? ' decoding="async"' : '';
  function getResponseHelper() {
    return Emby.importModule('./modules/common/responsehelper.js');
  }
  function showActionSheet(options) {
    return Emby.importModule('./modules/actionsheet/actionsheet.js').then(function (ActionSheet) {
      return ActionSheet.show(options);
    });
  }
  function showConfirm(options) {
    return Emby.importModule('./modules/common/dialogs/confirm.js').then(function (confirm) {
      return confirm(options);
    });
  }
  function showAlert(options) {
    return Emby.importModule('./modules/common/dialogs/alert.js').then(function (alert) {
      return alert(options);
    });
  }
  function loadMultiSelect() {
    if (_layoutmanager.default.tv) {
      return Promise.resolve(null);
    }
    return Emby.importModule('./modules/multiselect/multiselect.js');
  }
  function renderTrackSelectionsWithoutUser(page, instance, item, forceReload) {
    var apiClient = _connectionmanager.default.getApiClient(item.ServerId);
    apiClient.getCurrentUser().then(function (user) {
      renderTrackSelections(page, instance, item, user, forceReload);
    });
  }
  function isMediaStreamDisplayed(stream) {
    if (stream.Type === "Data") {
      return false;
    }
    return true;
  }
  function isMediaSourceDisplayed(version, renderAdminFields) {
    for (var i = 0, length = version.MediaStreams.length; i < length; i++) {
      var stream = version.MediaStreams[i];
      if (isMediaStreamDisplayed(stream)) {
        return true;
      }
    }
    if (version.Container) {
      return true;
    }
    if (version.Formats && version.Formats.length) {
      return true;
    }
    if (version.Path && renderAdminFields) {
      return true;
    }
    if (version.Size) {
      return true;
    }
    return false;
  }
  function renderMediaSource(parentElem, renderAdminFields, item, mediaSource, scrollX) {
    var elem = document.createElement('div');
    elem.classList.add('mediaSource');
    var html = '';
    if (scrollX) {
      html += '<div class="sectionTitle sectionTitle-cards secondaryText" style="display:block;padding: 0 0 .5em;margin-top:0;">';
    } else {
      html += '<div style="display:block;">';
    }
    if (mediaSource.Path && renderAdminFields) {
      html += '<div>' + mediaSource.Path + '</div>';
    }
    html += '<div class="mediaInfoItems">';
    if (mediaSource.Container) {
      html += mediaSource.Container.toUpperCase();
    }
    if (mediaSource.Size) {
      html += '<span class="mediaInfoItem">' + _dataformatter.default.sizeToString(mediaSource.Size) + '</span>';
    }
    var dateCreated = new Date(Date.parse(item.DateCreated));
    html += '<span class="mediaInfoItem">' + _globalize.default.translate('AddedOnValue', _datetime.default.toLocaleString(dateCreated)) + '</span>';
    html += '</div>';
    html += '</div>';
    if (html) {
      html = '<div class="padded-left padded-left-page padded-right">' + html + '</div>';
    }
    elem.innerHTML = html;
    var sectionHtml;
    if (scrollX) {
      sectionHtml = '<div is="emby-scroller" class="emby-scroller padded-top-focusscale padded-bottom-focusscale padded-left padded-left-page padded-right" data-mousewheel="false" data-focusscroll="true" data-horizontal="true"><div is="emby-itemscontainer" class="detailMediaStreamsItemsContainer itemsContainer-defaultCardSize scrollSlider itemsContainer focusable focuscontainer-x" data-focusabletype="nearest"></div></div>';
    } else {
      sectionHtml = '<div is="emby-itemscontainer" class="vertical-list itemsContainer padded-left padded-left-page padded-right itemsContainer-defaultCardSize"></div>';
    }
    elem.insertAdjacentHTML('beforeend', sectionHtml);
    parentElem.appendChild(elem);

    // avoid altering properties on the original objects
    var mediaStreams = mediaSource.MediaStreams.filter(isMediaStreamDisplayed).map(function (s) {
      return _itemhelper.default.normalizeMediaStreamForDisplay(item, mediaSource, s);
    });
    if (scrollX) {
      _cardbuilder.default.buildCards(mediaStreams, {
        shape: 'backdrop',
        overlayText: true,
        fields: ['MediaStreamInfo'],
        itemsContainer: elem.querySelector('.itemsContainer'),
        action: 'none',
        multiSelect: false,
        ratingButton: false,
        playedButton: false,
        defaultIcon: false,
        typeIndicator: false,
        playedIndicator: false,
        syncIndicator: false,
        downloadButton: false,
        timerIndicator: false,
        randomDefaultBackground: false,
        imageFallback: false,
        cardPadderClass: _layoutmanager.default.tv ? 'mediaStreamPadder-tv' : 'mediaStreamPadder',
        innerCardFooterClass: 'mediaStreamInnerCardFooter',
        cardTextCssClass: 'mediaStreamInnerCardFooter-cardText',
        enableUserData: false,
        draggable: false,
        enableFocusScaling: false,
        // to make the size consistent with virtual scroll lists
        horizontal: true
      });
    } else {
      _listview.default.buildItems(mediaStreams, {
        image: false,
        fields: ['MediaStreamInfo'],
        itemsContainer: elem.querySelector('.itemsContainer'),
        action: 'none',
        multiSelect: false,
        ratingButton: false,
        playedButton: false,
        defaultIcon: false,
        typeIndicator: false,
        playedIndicator: false,
        syncIndicator: false,
        downloadButton: false,
        timerIndicator: false,
        randomDefaultBackground: false,
        imageFallback: false,
        innerCardFooterClass: 'mediaStreamInnerCardFooter',
        enableUserDataButtons: false,
        draggable: false,
        draggableXActions: false
      });
    }
  }
  function renderMediaSources(page, renderAdminFields, item, mediaSources) {
    var groupedVersions = mediaSources.filter(function (g) {
      return g.Type === "Grouping";
    });
    if (renderAdminFields && groupedVersions.length) {
      page.querySelector('.splitVersionContainer').classList.remove('hide');
    } else {
      page.querySelector('.splitVersionContainer').classList.add('hide');
    }
    var parentElem = page.querySelector('.mediaSources');
    parentElem.innerHTML = '';
    var anyDisplayed = false;
    var scrollX = true;
    var mediaInfoHeader = page.querySelector('.mediaInfoHeader');
    if (!scrollX) {
      mediaInfoHeader.classList.remove('sectionTitle');
      mediaInfoHeader.classList.remove('sectionTitle-cards');
      mediaInfoHeader.style.marginTop = '.5em';
    }
    var hasMediaStreams = false;
    for (var i = 0, length = mediaSources.length; i < length; i++) {
      var mediaSource = mediaSources[i];
      if (isMediaSourceDisplayed(mediaSource, renderAdminFields)) {
        var _mediaSource$MediaStr;
        anyDisplayed = true;
        if ((_mediaSource$MediaStr = mediaSource.MediaStreams) != null && _mediaSource$MediaStr.filter(isMediaStreamDisplayed).length) {
          hasMediaStreams = true;
        }
      }
    }

    // to allow the bottom to be focusable
    if (_layoutmanager.default.tv && !hasMediaStreams) {
      mediaInfoHeader.innerHTML = '<a href="#" is="emby-linkbutton" class="button-link button-link-color-inherit">' + _globalize.default.translate('HeaderMediaInfo') + '</a>';
    } else {
      mediaInfoHeader.innerHTML = _globalize.default.translate('HeaderMediaInfo');
    }
    for (var _i = 0, _length = mediaSources.length; _i < _length; _i++) {
      var _mediaSource = mediaSources[_i];
      if (isMediaSourceDisplayed(_mediaSource, renderAdminFields)) {
        anyDisplayed = true;
        renderMediaSource(parentElem, renderAdminFields, item, _mediaSource, scrollX);
      }
    }
    if (anyDisplayed && _usersettings.default.showFullMediaInfoOnDetailScreen()) {
      page.querySelector('.audioVideoMediaInfo').classList.remove('hide');
    } else {
      page.querySelector('.audioVideoMediaInfo').classList.add('hide');
    }
  }
  function isRenderingTrackSelections(item) {
    if (!_itemhelper.default.supportsMediaSourceSelection(item) || _playbackmanager.default.getSupportedCommands().indexOf('PlayMediaSource') === -1 || !_playbackmanager.default.canPlay(item)) {
      return false;
    }
    return true;
  }
  function setTrackSelectionFieldDisabled(elem, disabled) {
    if (disabled) {
      elem.setAttribute('disabled', 'disabled');
    } else {
      elem.removeAttribute('disabled');
    }
    var parent = elem.closest('.selectContainer');
    if (parent) {
      parent = parent.querySelector('.emby-select-wrapper-inline');
      if (!parent) {
        return;
      }
      if (disabled) {
        parent.classList.add('emby-select-wrapper-inline-disabled');
      } else {
        parent.classList.remove('emby-select-wrapper-inline-disabled');
      }
    }
  }
  function refreshChapters(view) {
    var elem = view.querySelector('.chaptersItemsContainer');
    elem.waitForCustomElementUpgrade().then(function () {
      elem.refreshItems();
    });
  }
  function resumeChaptersItemsContainer(view) {
    var elem = view.querySelector('.chaptersItemsContainer');
    elem.waitForCustomElementUpgrade().then(function () {
      elem.resume({});
    });
  }
  function renderTrackSelections(view, instance, item, user, forceReload, mediaSources) {
    var select = view.querySelector('.selectSource');
    var apiClient = _connectionmanager.default.getApiClient(item);
    if (!isRenderingTrackSelections(item)) {
      renderMediaInfo(instance, view, item, item.MediaSources || [], apiClient);
      renderMediaSources(view, user.Policy.IsAdministrator, item, item.MediaSources || []);
      instance._currentPlaybackMediaSources = [];
      instance.trackSelectionsContainer.classList.add('hide');
      select.innerHTML = '';
      view.querySelector('.selectVideo').innerHTML = '';
      view.querySelector('.selectAudio').innerHTML = '';
      view.querySelector('.selectSubtitles').innerHTML = '';
      setTrackSelectionFieldDisabled(select, true);
      updateTrackSelectionsVisibilityAndFocus(instance, view);
      refreshChapters(view);
      refreshAdditionalParts(view);
      return;
    }
    (mediaSources ? Promise.resolve(mediaSources) : _playbackmanager.default.getPlaybackMediaSources(item)).then(function (mediaSources) {
      var renderAdminFields = user.Policy.IsAdministrator;
      renderMediaSources(view, renderAdminFields, item, mediaSources);
      instance._currentPlaybackMediaSources = mediaSources;
      var currentValue = select.value;
      var selectedId = currentValue || mediaSources[0].Id;
      select.innerHTML = mediaSources.map(function (v) {
        var selected = v.Id === selectedId ? ' selected' : '';
        return '<option value="' + v.Id + '"' + selected + '>' + _textencoding.default.htmlEncode(v.Name) + '</option>';
      }).join('');
      if (mediaSources.length > 1) {
        setTrackSelectionFieldDisabled(select, false);
        view.querySelector('.selectSourceContainer').classList.remove('hide');
      } else {
        view.querySelector('.selectSourceContainer').classList.add('hide');
        setTrackSelectionFieldDisabled(select, true);
      }
      var refresh = select.value !== currentValue || forceReload;
      if (refresh) {
        renderMediaInfo(instance, view, item, mediaSources, apiClient);
        renderVideoSelections(view, mediaSources);
        renderAudioSelections(view, mediaSources);
        renderSubtitleSelections(view, mediaSources);
      }
      updateTrackSelectionsVisibilityAndFocus(instance, view);
      if (refresh) {
        refreshChapters(view);
        refreshAdditionalParts(view);
      }
    });
  }
  function renderVideoSelections(page, mediaSources) {
    var mediaSourceId = page.querySelector('.selectSource').value;
    var mediaSource = mediaSources.filter(function (m) {
      return m.Id === mediaSourceId;
    })[0];
    var tracks = mediaSource.MediaStreams.filter(function (m) {
      return m.Type === 'Video' && (m.Index !== -1 || m.DisplayTitle != null || m.Codec != null);
    });
    var select = page.querySelector('.selectVideo');
    var selectedId = tracks.length ? tracks[0].Index : -1;
    select.innerHTML = tracks.map(function (v) {
      var _v$Codec;
      var selected = v.Index === selectedId ? ' selected' : '';
      return '<option value="' + v.Index + '" ' + selected + '>' + _textencoding.default.htmlEncode(v.DisplayTitle || ((_v$Codec = v.Codec) == null ? void 0 : _v$Codec.toUpperCase()) || '') + '</option>';
    }).join('');
    setTrackSelectionFieldDisabled(select, true);
    if (tracks.length) {
      page.querySelector('.selectVideoContainer').classList.remove('hide');
    } else {
      page.querySelector('.selectVideoContainer').classList.add('hide');
    }
  }
  function renderAudioSelections(page, mediaSources) {
    var mediaSourceId = page.querySelector('.selectSource').value;
    var mediaSource = mediaSources.filter(function (m) {
      return m.Id === mediaSourceId;
    })[0];
    var tracks = mediaSource.MediaStreams.filter(function (m) {
      return m.Type === 'Audio' && (m.Index !== -1 || m.DisplayTitle != null || m.Codec != null);
    });
    var select = page.querySelector('.selectAudio');
    var selectedId = mediaSource.DefaultAudioStreamIndex;
    select.innerHTML = tracks.map(function (v) {
      var _v$Codec2;
      var selected = v.Index === selectedId ? ' selected' : '';
      var embeddedTitle = v.Title && !(v.DisplayTitle || '').includes(v.Title) ? v.Title : null;
      var titleAttribute = embeddedTitle ? ' title="' + embeddedTitle + '"' : '';
      return '<option' + titleAttribute + ' value="' + v.Index + '" ' + selected + '>' + _textencoding.default.htmlEncode(v.DisplayTitle || ((_v$Codec2 = v.Codec) == null ? void 0 : _v$Codec2.toUpperCase()) || '') + '</option>';
    }).join('');
    if (tracks.length > 1) {
      setTrackSelectionFieldDisabled(select, false);
    } else {
      setTrackSelectionFieldDisabled(select, true);
    }
    if (tracks.length) {
      page.querySelector('.selectAudioContainer').classList.remove('hide');
    } else {
      page.querySelector('.selectAudioContainer').classList.add('hide');
    }
  }
  function renderSubtitleSelections(page, mediaSources) {
    var mediaSourceId = page.querySelector('.selectSource').value;
    var mediaSource = mediaSources.filter(function (m) {
      return m.Id === mediaSourceId;
    })[0];
    var tracks = mediaSource.MediaStreams.filter(function (m) {
      return m.Type === 'Subtitle';
    });
    var select = page.querySelector('.selectSubtitles');
    var selectedId = mediaSource.DefaultSubtitleStreamIndex == null ? -1 : mediaSource.DefaultSubtitleStreamIndex;
    if (tracks.length) {
      var selected = selectedId === -1 ? ' selected' : '';
      select.innerHTML = '<option value="-1">' + _globalize.default.translate('Off') + '</option>' + tracks.map(function (v) {
        selected = v.Index === selectedId ? ' selected' : '';
        var embeddedTitle = v.Title && !(v.DisplayTitle || '').includes(v.Title) ? v.Title : null;
        var titleAttribute = embeddedTitle ? ' title="' + embeddedTitle + '"' : '';
        return '<option' + titleAttribute + ' value="' + v.Index + '" ' + selected + '>' + _textencoding.default.htmlEncode(v.DisplayTitle) + '</option>';
      }).join('');
      page.querySelector('.selectSubtitlesContainer').classList.remove('hide');
    } else {
      select.innerHTML = '';
      page.querySelector('.selectSubtitlesContainer').classList.add('hide');
    }
  }
  function setButtonText(page, query, html) {
    var elems = page.querySelectorAll(query);
    for (var i = 0, length = elems.length; i < length; i++) {
      elems[i].innerHTML = html;
      var btn = elems[i].closest('button');
      if (btn) {
        btn.title = html;
        btn.setAttribute('aria-label', html);
      }
    }
  }
  function setResumeProgress(resumeInfoElement, item) {
    var resumeProgress = resumeInfoElement.querySelector('.resumeProgress');
    if (item.UserData && item.UserData.PlaybackPositionTicks > 0 && item.RunTimeTicks) {
      var ticksLeft = item.RunTimeTicks - item.UserData.PlaybackPositionTicks;
      var remainingValue = _globalize.default.translate('TimeRemainingValue', _datetime.default.getHumanReadableRuntime(ticksLeft));
      var minRemaining = '<div class="resumeTimeRemaining secondaryText">' + remainingValue + '</div>';
      resumeProgress.innerHTML = _indicators.default.getProgressBarHtml(item, {
        containerClass: 'resumeInfoProgressBar',
        animated: true
      }) + minRemaining;
      resumeProgress.classList.remove('hide');
    } else {
      resumeProgress.classList.add('hide');
    }
  }
  function setNextUpButtonText(instance, page) {
    return getNextUpItems.call(instance, {
      Limit: 1,
      EnableTotalRecordCount: false,
      EnableImages: false
    }).then(function (result) {
      var item = result.Items[0];
      var resumeInfo = page.querySelector('.detailResumeInfo');
      if (item) {
        var resumeNameElement = resumeInfo.querySelector('.resumeName');
        var resumeName = _itemmanager.default.getDisplayName(item, {
          hideEpisodeSpoilerInfo: _usersettings.default.hideEpisodeSpoilerInfo(),
          autoBlankName: false
        });
        if (!_layoutmanager.default.tv) {
          var href = _approuter.default.getRouteUrl(item, {});
          resumeName = '<a is="emby-linkbutton" class="button-link button-link-color-inherit" href="' + href + '">' + resumeName + '</a>';
        }
        resumeNameElement.innerHTML = resumeName;
        resumeNameElement.classList.remove('hide');
        setResumeProgress(resumeInfo, item);
        if (item.UserData && item.UserData.PlaybackPositionTicks > 0) {
          setButtonText(page, '.resumeButtonText', _globalize.default.translate('Resume'));
        } else {
          setButtonText(page, '.resumeButtonText', _globalize.default.translate('Play'));
        }
        resumeInfo.classList.remove('hide');
      } else {
        setButtonText(page, '.resumeButtonText', _globalize.default.translate('Play'));
        resumeInfo.classList.add('hide');
      }
    });
  }
  function reloadPlayButtons(instance, page, item, isUserDataChangeEvent) {
    var canPlay = false;
    var playButtons = page.querySelectorAll('.btnPlay');
    if (item.Type === 'Program') {
      var now = new Date();
      if (now >= new Date(Date.parse(item.StartDate)) && now < new Date(Date.parse(item.EndDate))) {
        hideAll(page, playButtons, true);
        canPlay = true;
      } else {
        hideAll(page, playButtons);
      }
      hideAll(page, 'btnResume');
      hideAll(page, 'detailResumeInfo');
      hideAll(page, 'btnShuffle');
      hideAll(page, 'btnQueue');
      setButtonText(page, '.playButtonText', _globalize.default.translate('Play'));
    } else if (_playbackmanager.default.canPlay(item)) {
      hideAll(page, 'btnPlay', true);
      var enableShuffle = item.IsFolder || ['MusicAlbum', 'MusicGenre', 'MusicArtist'].indexOf(item.Type) !== -1;
      if (item.Type === 'MusicAlbum' && item.SupportsResume) {
        enableShuffle = false;
      }
      if (item.Type === 'Season' || item.Type === 'Series') {
        enableShuffle = false;
      }
      hideAll(page, 'btnShuffle', enableShuffle);
      canPlay = true;
      var activeElement = document.activeElement;
      var isPlayFocused = activeElement && activeElement.classList && (activeElement.classList.contains('btnResume') || activeElement.classList.contains('btnMainPlay'));
      var btnPlay = page.querySelector('.btnPlay');
      var btnResume = page.querySelector('.btnResume');
      var btnPlayTrailer = page.querySelector('.btnPlayTrailer-main');
      btnPlayTrailer.querySelector('i').innerHTML = _itemmanager.default.getDefaultIcon({
        Type: 'Trailer',
        MediaType: 'Video'
      });
      var btnShuffle = page.querySelector('.btnShuffle');
      if (item.Type === 'Series' || item.Type === 'MusicAlbum' && item.SupportsResume) {
        btnResume.classList.add('detailButton-primary');
        btnPlay.classList.remove('detailButton-primary', 'detailButton-highres3');
        setNextUpButtonText(instance, page);
        setButtonText(page, '.playButtonText', _globalize.default.translate('FromBeginning'));
        btnPlay.classList.remove('detailButton-stacked');
        btnShuffle.classList.remove('detailButton-stacked');
        if (isTrailerButtonVisible(item)) {
          btnPlayTrailer.classList.add('detailButton-stacked');
          btnResume.classList.add('detailButton-stacked');
        } else {
          btnPlayTrailer.classList.remove('detailButton-stacked');
          btnResume.classList.remove('detailButton-stacked');
        }
        hideAll(page, 'detailResumeInfo', true);
        hideAll(page, 'btnResume', true);
        hideAll(page, 'btnPlay', enableShuffle);
      } else {
        var canResume = item.UserData && item.UserData.PlaybackPositionTicks > 0;
        if (canResume) {
          btnResume.classList.add('detailButton-primary', 'detailButton-stacked');
          btnPlay.classList.remove('detailButton-primary', 'detailButton-stacked');
          if (_layoutmanager.default.tv) {
            btnPlay.classList.remove('detailButton-highres3');
          } else {
            btnPlay.classList.add('detailButton-highres3');
          }
          btnPlayTrailer.classList.add('detailButton-stacked');
          btnShuffle.classList.remove('detailButton-stacked');

          //setButtonText(page, '.resumeButtonText.detailButton-lowres', resumeText);
          setButtonText(page, '.playButtonText', _globalize.default.translate('FromBeginning'));
          hideAll(page, 'detailResumeInfo', true);
          hideAll(page, 'resumeName');
          setResumeProgress(page.querySelector('.detailResumeInfo'), item);
        } else {
          btnPlay.classList.add('detailButton-primary');
          btnPlay.classList.remove('detailButton-highres3');
          if (enableShuffle) {
            btnPlayTrailer.classList.remove('detailButton-stacked');
            btnResume.classList.remove('detailButton-stacked');
            btnShuffle.classList.add('detailButton-stacked');
            btnPlay.classList.add('detailButton-stacked');
          } else if (isTrailerButtonVisible(item)) {
            btnPlay.classList.add('detailButton-stacked');
            btnResume.classList.remove('detailButton-stacked');
            btnPlayTrailer.classList.add('detailButton-stacked');
            btnShuffle.classList.remove('detailButton-stacked');
          } else {
            btnPlay.classList.remove('detailButton-stacked');
            btnResume.classList.remove('detailButton-stacked');
            btnPlayTrailer.classList.remove('detailButton-stacked');
            btnShuffle.classList.remove('detailButton-stacked');
          }
          setButtonText(page, '.playButtonText', _globalize.default.translate('Play'));
        }
        hideAll(page, 'detailResumeInfo', canResume);
        hideAll(page, 'btnResume', canResume);
      }

      // this can cause the queue button to show briefly on playback stopping, creating a flash
      if (!isUserDataChangeEvent) {
        hideAll(page, 'btnQueue', _playbackmanager.default.canQueue(item));
      }
      if (isPlayFocused) {
        instance.autoFocusMainSection();
      }
    } else {
      hideAll(page, playButtons);
      hideAll(page, 'btnQueue');
      hideAll(page, 'btnResume');
      hideAll(page, 'detailResumeInfo');
      hideAll(page, 'btnShuffle');
    }
    return canPlay;
  }
  function reloadUserDataButtons(page, item) {
    var i, length;
    var btnPlaystates = page.querySelectorAll('.btnPlaystate');
    for (i = 0, length = btnPlaystates.length; i < length; i++) {
      var btnPlaystate = btnPlaystates[i];
      if (_itemmanager.default.canMarkPlayed(item)) {
        btnPlaystate.classList.remove('hide');
        btnPlaystate.setItem(item);
      } else {
        btnPlaystate.classList.add('hide');
        btnPlaystate.setItem(null);
      }
    }
    var btnUserRatings = page.querySelectorAll('.btnUserRating');
    for (i = 0, length = btnUserRatings.length; i < length; i++) {
      var btnUserRating = btnUserRatings[i];
      if (_itemmanager.default.canRate(item)) {
        btnUserRating.classList.remove('hide');
        btnUserRating.setItem(item);
      } else {
        btnUserRating.classList.add('hide');
        btnUserRating.setItem(null);
      }
    }
  }
  function updateMainDetailButtonsFocusState(elem) {
    var btns = elem.querySelectorAll('.detailButton');
    for (var i = 0, length = btns.length; i < length; i++) {
      var btn = btns[i];
      if (_focusmanager.default.isCurrentlyFocusable(btn)) {
        setScopedFocus(null, elem, true, 'autofocus');
        return;
      }
    }
    setScopedFocus(null, elem, false, 'autofocus');
  }
  function setTitle(item, apiClient, enableLogo) {
    if (item.Type === 'TvChannel') {
      enableLogo = false;
    }
    if (enableLogo) {
      _appheader.default.setLogoTitle({
        items: [item],
        titleText: '',
        preferredLogoImageTypes: _skinmanager.default.getPreferredLogoImageTypes()
      });
    } else {
      _appheader.default.setTitle('', item == null ? void 0 : item.Name);
    }
  }
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
  function getArtistLinksHtml(artists, serverId) {
    var html = [];
    for (var i = 0, length = artists.length; i < length; i++) {
      var artist = artists[i];
      var href = _approuter.default.getRouteUrl(artist, {
        itemType: 'MusicArtist',
        serverId: serverId
      });
      html.push('<a style="font-weight:inherit;" class="button-link" is="emby-linkbutton" href="' + href + '">' + _textencoding.default.htmlEncode(artist.Name) + '</a>');
    }
    html = html.join(' / ');
    return html;
  }
  function inferContext(item) {
    switch (item.Type) {
      case 'Series':
      case 'Season':
      case 'Episode':
        return 'tvshows';
      case 'Movie':
        return 'movies';
      case 'Game':
      case 'GameSystem':
        return 'games';
      case 'MusicArtist':
      case 'MusicAlbum':
      case 'Audio':
      case 'AudioBook':
      case 'MusicVideo':
      case 'MusicGenre':
        return 'music';
      case 'Program':
      case 'TvChannel':
      case 'Timer':
      case 'SeriesTimer':
        return 'livetv';
      default:
        return null;
    }
  }
  function renderName(instance, item, apiClient, user, containers) {
    var itemForTitle = item.Type === 'Timer' ? item.ProgramInfo || item : item;
    var context = inferContext(itemForTitle);
    var parentNameHtml = [];

    // Parent name
    var parentRoute;
    var parentNameLast = false;
    var hasFocusableButton = false;
    var fontSize = parseFloat(window.getComputedStyle(document.body, null).getPropertyValue('font-size'));
    // multiply by 2 for h1 font size, then 2.4 for the height of the image parent (in css), then add .2 for line height
    var logoHeight = Math.round(fontSize * 2 * 2.4) + Math.round(0.2 * fontSize);
    var logoImage = getLogoPlacement(itemForTitle) !== 'title' ? null : apiClient.getLogoImageUrl(itemForTitle, {
      maxHeight: Math.max(logoHeight, 260)
    }, _skinmanager.default.getPreferredLogoImageTypes());
    var logoAsTitleClass = 'itemLogoAsTitle';
    var itemNamePrimaryClass = 'itemName-primary';
    var itemPrimaryNameContainerClass = 'itemPrimaryNameContainer';
    if (itemForTitle.AlbumArtists && itemForTitle.AlbumArtists.length) {
      parentNameHtml.push(getArtistLinksHtml(itemForTitle.AlbumArtists, itemForTitle.ServerId, context));
      parentNameLast = true;
    } else if (itemForTitle.ArtistItems && itemForTitle.ArtistItems.length && itemForTitle.Type === 'MusicVideo') {
      parentNameHtml.push(getArtistLinksHtml(itemForTitle.ArtistItems, itemForTitle.ServerId, context));
      parentNameLast = true;
    } else if (itemForTitle.GameSystem && itemForTitle.GameSystemId) {
      parentNameLast = true;
      parentRoute = _approuter.default.getRouteUrl({
        Id: itemForTitle.GameSystemId,
        Name: itemForTitle.GameSystem,
        Type: 'GameSystem',
        IsFolder: true,
        ServerId: itemForTitle.ServerId
      }, {
        context: context
      });
      hasFocusableButton = true;
      parentNameHtml.push('<a style="font-weight:inherit;" class="button-link button-link-color-inherit" is="emby-linkbutton" href="' + parentRoute + '">' + _textencoding.default.htmlEncode(itemForTitle.GameSystem) + '</a>');
    } else if (itemForTitle.SeriesName && itemForTitle.SeriesId) {
      parentRoute = _approuter.default.getRouteUrl({
        Id: itemForTitle.SeriesId,
        Name: itemForTitle.SeriesName,
        Type: 'Series',
        IsFolder: true,
        ServerId: itemForTitle.ServerId
      }, {
        context: context
      });
      var seriesName = _textencoding.default.htmlEncode(itemForTitle.SeriesName);
      if (logoImage) {
        seriesName = '<img draggable="false" loading="lazy"' + decodingAttribute + ' class="' + logoAsTitleClass + '" alt="' + seriesName + '" src="' + logoImage + '" />';
        itemNamePrimaryClass += ' itemName-primary-logo';
        if (_layoutmanager.default.tv) {
          itemNamePrimaryClass += ' itemName-primary-logo-tv';
        }
        itemPrimaryNameContainerClass += ' itemPrimaryNameContainer-logo';

        // don't make this focusable in tv mode
        var tabIndex = '';
        hasFocusableButton = true;
        parentNameHtml.push('<a' + tabIndex + ' style="font-weight:inherit;height:100%;width:100%;" class="button-link button-link-color-inherit" is="emby-linkbutton" href="' + parentRoute + '">' + seriesName + '</a>');
      } else {
        hasFocusableButton = true;
        parentNameHtml.push('<a style="font-weight:inherit;" class="button-link button-link-color-inherit" is="emby-linkbutton" href="' + parentRoute + '">' + seriesName + '</a>');
      }
    } else if (itemForTitle.SeriesName) {
      parentNameHtml.push(_textencoding.default.htmlEncode(itemForTitle.SeriesName));
    } else if (itemForTitle.IsSeries || itemForTitle.EpisodeTitle) {
      parentNameHtml.push(_textencoding.default.htmlEncode(itemForTitle.Name));
    }
    if (itemForTitle.Album && itemForTitle.AlbumId && (itemForTitle.Type === 'MusicVideo' || itemForTitle.Type === "Audio")) {
      parentRoute = _approuter.default.getRouteUrl({
        Id: itemForTitle.AlbumId,
        Name: itemForTitle.Album,
        Type: 'MusicAlbum',
        IsFolder: true,
        ServerId: itemForTitle.ServerId
      }, {
        context: context
      });
      hasFocusableButton = true;
      parentNameHtml.push('<a style="font-weight:inherit;" class="button-link button-link-color-inherit" is="emby-linkbutton" href="' + parentRoute + '">' + _textencoding.default.htmlEncode(itemForTitle.Album) + '</a>');
    } else if (itemForTitle.Album) {
      parentNameHtml.push(_textencoding.default.htmlEncode(itemForTitle.Album));
    }
    var html = '';
    var editorButtonsHtml = '';
    if (!_layoutmanager.default.tv) {
      if (_itemmanager.default.canEdit([item], user)) {
        hasFocusableButton = true;
        editorButtonsHtml += '<button is="paper-icon-button-light" class="btnDetailEdit btnEditMetadata secondaryText flex-shrink-zero" title="' + _globalize.default.translate('HeaderEditMetadata') + '" aria-label="' + _globalize.default.translate('HeaderEditMetadata') + '"><i class="md-icon autortl">&#xe3c9;</i></button>';
      }
      if (_itemmanager.default.canEditImages(item, user)) {
        hasFocusableButton = true;
        editorButtonsHtml += '<button is="paper-icon-button-light" class="btnDetailEdit btnEditImages secondaryText flex-shrink-zero" title="' + _globalize.default.translate('HeaderEditImages') + '" aria-label="' + _globalize.default.translate('HeaderEditImages') + '"><i class="md-icon">photo</i></button>';
      }
    }
    if (!enableItemBackdropAsTopImage(itemForTitle)) {
      itemPrimaryNameContainerClass += ' itemPrimaryNameContainer-centered';
    }
    if (parentNameHtml.length) {
      if (parentNameLast) {
        html = '<div class="verticalFieldItem itemSecondaryNameContainer"><h3 class="itemName-secondary itemSecondaryNameContainer-condense">' + parentNameHtml.join(' - ') + '</h3></div>';
      } else {
        html = '<div class="verticalFieldItem ' + itemPrimaryNameContainerClass + '"><h1 class="' + itemNamePrimaryClass + '">' + parentNameHtml.join(' - ') + '</h1></div>';
      }
    }
    var name = _itemmanager.default.getDisplayName(itemForTitle, {
      includeParentInfo: true,
      hideEpisodeSpoilerInfo: _usersettings.default.hideEpisodeSpoilerInfo(),
      autoBlankName: false
    });
    if (name) {
      name = _textencoding.default.htmlEncode(name);
    }

    // name could be null for program episodes without an episode title yet, or when AsSeries is true
    if (html && name && !parentNameLast) {
      html += '<div class="verticalFieldItem flex align-items-center flex-wrap-wrap itemSecondaryNameContainer"><h3 class="itemName-secondary">' + name + '</h3>' + editorButtonsHtml + '</div>';
    } else {
      if (logoImage) {
        name = '<img draggable="false" loading="lazy"' + decodingAttribute + ' class="' + logoAsTitleClass + '" alt="' + name + '" src="' + logoImage + '" />';
        itemNamePrimaryClass += ' itemName-primary-logo';
        itemPrimaryNameContainerClass += ' itemPrimaryNameContainer-logo';
        if (_layoutmanager.default.tv) {
          itemNamePrimaryClass += ' itemName-primary-logo-tv';
        }
      }

      // live tv episode title could be null
      if (name || editorButtonsHtml) {
        html = '<div class="verticalFieldItem flex align-items-center flex-wrap-wrap ' + itemPrimaryNameContainerClass + '"><h1 class="' + itemNamePrimaryClass + '">' + name + '</h1>' + editorButtonsHtml + '</div>' + html;
      }
    }
    for (var i = 0, length = containers.length; i < length; i++) {
      var container = containers[i];
      if (enableItemBackdropAsTopImage(itemForTitle)) {
        container.classList.remove('detailNameContainer-centered');
      } else {
        container.classList.add('detailNameContainer-centered');
      }
      container.innerHTML = html;
      setScopedFocus(null, container, hasFocusableButton);
      if (html.length) {
        container.classList.remove('hide');
      } else {
        container.classList.add('hide');
      }
      var btnEditMetadata = container.querySelector('.btnEditMetadata');
      if (btnEditMetadata) {
        btnEditMetadata.addEventListener('click', onEditMetadataClick.bind(instance));
      }
      var btnEditImages = container.querySelector('.btnEditImages');
      if (btnEditImages) {
        btnEditImages.addEventListener('click', onEditImagesClick.bind(instance));
      }
    }
  }
  function isTrailerButtonVisible(item) {
    if (_playbackmanager.default.getSupportedCommands().includes('PlayTrailers')) {
      if (item.LocalTrailerCount) {
        return true;
      }
      if (item.RemoteTrailers && item.RemoteTrailers.length) {
        return true;
      }
    }
    return false;
  }
  function setTrailerButtonVisibility(page, item) {
    if (isTrailerButtonVisible(item)) {
      hideAll(page, 'btnPlayTrailer', true);
    } else {
      hideAll(page, 'btnPlayTrailer');
    }
  }
  function renderDetailPageBackdrop(view, item, apiClient) {
    var _item$UserData;
    var screenWidth = screen.availWidth;
    var imgUrl;
    var itemBackdropContainerElement = view.querySelector('.itemBackdropContainer');
    var itemBackdropElement = itemBackdropContainerElement.querySelector('.itemBackdrop');
    if (enableItemBackdropAsTopImage(item)) {
      itemBackdropContainerElement.classList.remove('hide');
    } else {
      itemBackdropContainerElement.classList.add('hide');
      return;
    }
    var ignorePrimaryImage;
    if (_usersettings.default.hideEpisodeSpoilerInfo() && item.Type === 'Episode' && ((_item$UserData = item.UserData) == null ? void 0 : _item$UserData.Played) === false) {
      ignorePrimaryImage = true;
    }
    var usePrimaryImage = !ignorePrimaryImage && item.MediaType === 'Video' && item.Type !== 'Movie' && item.Type !== 'Trailer' || item.MediaType && item.MediaType !== 'Video' || item.Type === 'MusicAlbum' || item.Type === 'Playlist';

    //usePrimaryImage = false;
    var useThumbImage = item.Type === 'Program';
    if (useThumbImage && item.ImageTags && item.ImageTags.Thumb) {
      imgUrl = apiClient.getImageUrl(item.Id, {
        type: "Thumb",
        index: 0,
        maxWidth: screenWidth,
        tag: item.ImageTags.Thumb,
        EnableImageEnhancers: false
      });
    } else if (usePrimaryImage && item.ImageTags && item.ImageTags.Primary) {
      imgUrl = apiClient.getImageUrl(item.Id, {
        type: "Primary",
        index: 0,
        maxWidth: screenWidth,
        tag: item.ImageTags.Primary,
        EnableImageEnhancers: false
      });
    } else if (item.BackdropImageTags && item.BackdropImageTags.length) {
      imgUrl = apiClient.getImageUrl(item.Id, {
        type: "Backdrop",
        index: 0,
        maxWidth: screenWidth,
        tag: item.BackdropImageTags[0]
      });
    } else if (item.ParentBackdropItemId && item.ParentBackdropImageTags && item.ParentBackdropImageTags.length) {
      imgUrl = apiClient.getImageUrl(item.ParentBackdropItemId, {
        type: 'Backdrop',
        index: 0,
        tag: item.ParentBackdropImageTags[0],
        maxWidth: screenWidth
      });
    } else if (item.ImageTags && item.ImageTags.Thumb) {
      imgUrl = apiClient.getImageUrl(item.Id, {
        type: "Thumb",
        index: 0,
        maxWidth: screenWidth,
        tag: item.ImageTags.Thumb,
        EnableImageEnhancers: false
      });
    } else if (item.ImageTags && item.ImageTags.Primary) {
      imgUrl = apiClient.getImageUrl(item.Id, {
        type: "Primary",
        index: 0,
        maxWidth: screenWidth,
        tag: item.ImageTags.Primary,
        EnableImageEnhancers: false
      });
    }
    if (item.Type === 'TvChannel') {
      itemBackdropContainerElement.classList.add('itemBackdropContainer-small');
    }
    var itemMainScrollSlider = view.querySelector('.itemMainScrollSlider');
    if (_layoutmanager.default.tv) {
      itemMainScrollSlider.classList.remove('itemMainScrollSlider-moveup', 'itemMainScrollSlider-nopaddingtop');
    } else {
      if (item.Type !== 'TvChannel' && enableItemBackdropAsTopImage(item)) {
        itemMainScrollSlider.classList.add('itemMainScrollSlider-nopaddingtop');
      }
    }
    if (item.Type === 'TvChannel' || item.Type === 'Person') {
      itemBackdropElement.classList.add('itemBackdrop-contain');
    }
    if (imgUrl) {
      itemBackdropElement.style.backgroundImage = "url('" + imgUrl + "')";
    } else {
      itemBackdropElement.style.backgroundImage = '';
    }
  }
  function getDetailImageContainer(view, item) {
    var sideImageContainer = view.querySelector('.detailImageContainer-side');
    var mainImageContainer = view.querySelector('.detailImageContainer-main');
    if (enableTrackList(item)) {
      mainImageContainer.classList.add('hide');
      sideImageContainer.classList.remove('hide');
      return sideImageContainer;
    } else {
      mainImageContainer.classList.remove('hide');
      sideImageContainer.classList.add('hide');
      return mainImageContainer;
    }
  }
  function enableTrackList(item) {
    if (_layoutmanager.default.tv) {
      return item.Type === 'Playlist' || item.Type === "MusicAlbum" && !item.SupportsResume;
    }
    return false;
  }
  function enableItemBackdropAsTopImage(item) {
    return item.Type !== 'Playlist' && item.Type !== "MusicAlbum" && item.Type !== "TvChannel" && item.Type !== "Audio";
  }
  function renderDirector(view, item, apiClient, isStatic) {
    var directors = (item.People || []).filter(function (p) {
      return p.Type === 'Director';
    });
    if (_layoutmanager.default.tv) {
      directors = [];
    }
    var html = directors.map(function (p) {
      if (_layoutmanager.default.tv) {
        return '<span>' + _textencoding.default.htmlEncode(p.Name) + '</span>';
      }
      return '<a class="button-link button-link-color-inherit" is="emby-linkbutton" href="' + _approuter.default.getRouteUrl({
        Name: p.Name,
        Type: 'Person',
        ServerId: item.ServerId,
        Id: p.Id
      }, {}) + '">' + _textencoding.default.htmlEncode(p.Name) + '</a>';
    }).join(', ');
    var elem = view.querySelector('.directors');
    elem.innerHTML = directors.length > 1 ? _globalize.default.translate('DirectorsValue', html) : _globalize.default.translate('DirectorValue', html);
    setScopedFocus(view, elem, directors.length && !_layoutmanager.default.tv);
    if (directors.length) {
      elem.classList.remove('hide');
    } else {
      elem.classList.add('hide');
    }
  }
  function hideAll(page, className, show) {
    var i, length;
    var elems = typeof className === 'string' ? page.querySelectorAll('.' + className) : className;
    for (i = 0, length = elems.length; i < length; i++) {
      if (show) {
        elems[i].classList.remove('hide');
      } else {
        elems[i].classList.add('hide');
      }
    }
  }
  function getCommandOptions(instance, item, user, button) {
    var view = instance.view;
    var selectSource = view.querySelector('.selectSource');
    var isDialog = instance.params.asDialog === 'true';
    var options = {
      items: [item],
      open: false,
      play: false,
      playFromBeginning: true,
      playAllFromHere: false,
      positionTo: button,
      cancelTimer: false,
      record: false,
      deleteItem: true,
      shuffle: true,
      instantMix: true,
      user: user,
      share: true,
      mediaSourceId: (selectSource == null ? void 0 : selectSource.value) || null,
      positionY: 'center',
      positionX: 'after',
      transformOrigin: 'left top',
      navigateOnDelete: 'back',
      showSeries: _layoutmanager.default.tv ? true : false,
      showSeason: true,
      // try to decrease the likelihood of seeing a 3-dot menu when the view is a dialog
      createRecording: !isDialog,
      edit: !isDialog,
      editImages: !isDialog,
      favorites: !isDialog
    };
    if (_servicelocator.appHost.supports('sync') && !_layoutmanager.default.tv) {
      // Will be displayed via button
      options.syncLocal = false;
    }
    return options;
  }
  function fillOverview(elem, overview) {
    var textElement = elem.querySelector('.overview-text');
    var btnReadMore = elem.querySelector('.btnReadMore');
    btnReadMore.innerHTML = _globalize.default.translate('More');
    if (!overview) {
      elem.classList.add('hide');
      textElement.innerHTML = '';
      return;
    }
    textElement.innerHTML = overview;
    elem.classList.remove('hide');
    var offsetHeight = textElement.offsetHeight;
    var scrollHeight = textElement.scrollHeight;
    var textButton = textElement.closest('button');
    console.log('overview offsetHeight: ' + offsetHeight + ', scrollHeight: ' + scrollHeight);
    if (offsetHeight && scrollHeight && offsetHeight < scrollHeight) {
      if (_layoutmanager.default.tv) {
        textButton.removeAttribute('disabled');
        btnReadMore.classList.add('hide');
        setScopedFocus(null, elem, true);
      } else {
        textButton.setAttribute('disabled', 'disabled');
        btnReadMore.classList.remove('hide');
        setScopedFocus(null, elem, true);
      }
    } else {
      textButton.setAttribute('disabled', 'disabled');
      btnReadMore.classList.add('hide');
      setScopedFocus(null, elem, false);
    }
  }
  function renderMediaInfo(instance, view, item, mediaSources, apiClient) {
    var mediaSourceId = view.querySelector('.selectSource').value;
    var itemType = item.Type;
    var mediaSource = mediaSources.filter(function (m) {
      return m.Id === mediaSourceId;
    })[0];
    var mediaInfoElem = view.querySelector('.detail-mediaInfoPrimary');
    if (_layoutmanager.default.tv) {
      mediaInfoElem.classList.add('detail-mediaInfoPrimary-tv');
    } else {
      mediaInfoElem.classList.add('detail-mediaInfoPrimary-autocondense');
    }
    var hasFocusElements;
    if (itemType === 'Season' || itemType === 'SeriesTimer') {
      mediaInfoElem.classList.add('hide');
      mediaInfoElem.classList.remove('focuscontainer-x');
    } else {
      var genreLimit;
      switch (itemType) {
        case 'Playlist':
        case 'BoxSet':
        case 'MusicArtist':
          genreLimit = _usersettings.default.genreLimitForListsOnDetails();
          break;
        default:
          genreLimit = _usersettings.default.genreLimitOnDetails();
          break;
      }
      _mediainfo.default.fillPrimaryMediaInfo(mediaInfoElem, item, {
        interactive: true,
        episodeTitle: false,
        subtitles: false,
        dateAdded: false,
        genres: true,
        genreLimit: genreLimit,
        context: inferContext(item),
        endsAt: _usersettings.default.showEndsAtOnDetails(),
        endsAtClass: 'detailEndsAt',
        bitrate: item.MediaType === 'Audio',
        runtime: itemType !== 'Timer',
        mediaSource: mediaSource,
        mediaInfoIcons: false
      });
      hasFocusElements = mediaInfoElem.querySelector('a,button') != null;
      setScopedFocus(null, mediaInfoElem, hasFocusElements);
      if (hasFocusElements) {
        mediaInfoElem.classList.add('focuscontainer-x');
      } else {
        mediaInfoElem.classList.remove('focuscontainer-x');
      }
    }
    if (enableItemBackdropAsTopImage(item)) {
      mediaInfoElem.classList.remove('mediaInfo-centered', 'secondaryText');
    } else {
      mediaInfoElem.classList.add('mediaInfo-centered', 'secondaryText');
    }
    mediaInfoElem = view.querySelector('.detail-mediaInfoSecondary');
    // use the original item, not itemForDetails, just in case the timer has a different time than the program
    _mediainfo.default.fillSecondaryMediaInfo(mediaInfoElem, item, {
      interactive: true,
      mediaSource: mediaSource
    });
    hasFocusElements = mediaInfoElem.querySelector('a,button') != null;
    setScopedFocus(null, mediaInfoElem, hasFocusElements);
    if (hasFocusElements) {
      mediaInfoElem.classList.add('focuscontainer-x');
    } else {
      mediaInfoElem.classList.remove('focuscontainer-x');
    }
    if (mediaInfoElem.innerHTML.trim()) {
      mediaInfoElem.classList.remove('hide');
    } else {
      mediaInfoElem.classList.add('hide');
    }
  }
  function refreshCreditsItemsContainer(elem) {
    elem.waitForCustomElementUpgrade().then(function () {
      elem.resume({
        refresh: true
      });
    });
  }
  function getCreditsItems(query) {
    var instance = this.instance;
    var creditTypes = instance.currentItemCreditTypes || [];
    var personType = instance.currentCreditsPersonType || 'Actor';
    var items = creditTypes.filter(function (i) {
      return i.PersonType === personType;
    })[0].Items;
    return Promise.resolve(items);
  }
  function fillCreditsList(instance, view, item, apiClient, user, signal) {
    var elems = view.querySelectorAll('.mainCreditsSection .itemsContainer');
    for (var i = 0, length = elems.length; i < length; i++) {
      var itemsContainer = elems[i];
      itemsContainer.fetchData = getCreditsItems.bind({
        instance: instance,
        itemsContainer: itemsContainer
      });
      itemsContainer.getListOptions = getCreditsListOptions;
      refreshCreditsItemsContainer(itemsContainer);
    }
  }
  function getCreditsListOptions(items) {
    var fields = [];
    fields.push('NameAndRole');
    return {
      renderer: _listview.default,
      options: {
        showIndexNumberLeft: false,
        highlight: false,
        action: 'overview',
        dragReorder: false,
        image: false,
        imagePlayButton: false,
        showIndex: false,
        fields: fields,
        index: hasMultipleDiscs(items) ? 'disc' : null,
        playAction: 'none',
        includeParentInfoInTitle: false,
        autoHideMediaInfo: false,
        enableSideMediaInfo: false,
        multiSelect: false,
        draggable: false,
        draggableXActions: false,
        enableUserDataButtons: false,
        moreButton: false,
        mediaInfo: false,
        itemMarginY: false,
        showYearLeft: true,
        hoverPlayButton: false,
        contextMenu: false
      },
      virtualScrollLayout: 'vertical-list',
      commandOptions: {}
    };
  }
  function onCreditTypeChange(e) {
    var instance = this;
    var view = instance.view;
    var btn = e.detail.selectedTabButton;
    if (!btn) {
      return;
    }
    var personType = btn.getAttribute('data-id');
    instance.currentCreditsPersonType = personType;
    refreshCreditsItemsContainer(view.querySelector('.creditsItemsContainer'));
  }
  function sortInts(a, b) {
    return a - b;
  }
  function getLargestCredit(creditTypes) {
    creditTypes = creditTypes.map(function (i) {
      return i.Items.length;
    });
    creditTypes.sort(sortInts);
    return creditTypes[creditTypes.length - 1];
  }
  function renderCredits(instance, view, item, apiClient, user, signal) {
    apiClient.getPersonCredits({
      id: item.Id
    }, signal).then(function (creditTypes) {
      instance.currentItemCreditTypes = creditTypes;
      var html = '';
      html += '<div class="verticalSection verticalSection-cards">';

      // add classes from emby-tabs now to minimize layout shift later
      var tabsClass = 'creditTypesTabs emby-tabs padded-left padded-left-page padded-right padded-bottom-focusscale padded-top-focusscale';
      var tabsSliderClass = 'emby-tabs-slider scrollSliderX';
      html += '<div is="emby-tabs" class="' + tabsClass + '"><div class="' + tabsSliderClass + '">' + creditTypes.map(function (item) {
        // add classes from emby-button now to minimize layout shift later
        var tabClass = 'emby-button emby-tab-button secondaryText creditTypeTab detailCategoryTab';
        var tabHtml = '<button type="button" is="emby-button" class="' + tabClass + '" data-id="' + item.PersonType + '"><div class="creditTypeTab-text">' + _textencoding.default.htmlEncode(item.PersonType) + ' (' + item.Items.length + ')</div></button>';
        return tabHtml;
      }).join('') + '</div></div>';
      html += '<div is="emby-itemscontainer" class="focuscontainer-x sectionTitle-cards itemsContainer creditsItemsContainer vertical-list padded-left padded-left-page padded-right" style="margin-top:.5em;min-height:' + getLargestCredit(creditTypes) * 3 + 'em;"></div>';
      html += '</div>';
      view.querySelector('.creditsSubSections').innerHTML = html;
      view.querySelector('.creditTypesTabs').addEventListener('tabchange', onCreditTypeChange.bind(instance));
      if (creditTypes.length) {
        view.querySelector('.mainCreditsSection').classList.remove('hide');
      } else {
        view.querySelector('.mainCreditsSection').classList.add('hide');
      }
      fillCreditsList(instance, view, item, apiClient, user, signal);
    });
  }
  function renderDetails(instance, view, item, apiClient, user, signal) {
    var _item$UserData2, _item$UserData3;
    var promises = [];
    var overviewElem = view.querySelector('.overview-container');
    var overviewTextElem = overviewElem.querySelector('.overview-text');
    var enableSideTrackList = enableTrackList(item);
    if (enableSideTrackList) {
      overviewTextElem.classList.add('overview-text-tracklist');
    } else {
      overviewTextElem.classList.remove('overview-text-tracklist');
    }
    var itemForDetails = item.Type === 'Timer' ? item.ProgramInfo || item : item;
    var overview = itemForDetails.Overview;
    if (_usersettings.default.hideEpisodeSpoilerInfo() && itemForDetails.Type === 'Episode' && ((_item$UserData2 = item.UserData) == null ? void 0 : _item$UserData2.Played) === false) {
      overview = null;
    }
    if (overview) {
      var overviewContent = overview ? _dom.default.stripScripts(overview) : '';
      if (itemForDetails.Type === 'MusicAlbum' || itemForDetails.Type === 'Playlist') {
        overviewTextElem.classList.add('overview-twoline');
      } else {
        overviewTextElem.classList.remove('overview-twoline');
      }
      fillOverview(overviewElem, overviewContent);
    } else {
      overviewElem.classList.add('hide');
    }
    renderDirector(view, itemForDetails, apiClient, false);
    reloadPlayButtons(instance, view, item);
    reloadUserDataButtons(view, item);
    setTrailerButtonVisibility(view, item);
    if (item.Type === 'TvChannel') {
      hideAll(view, 'btnManualRecording', true);
    } else {
      hideAll(view, 'btnManualRecording');
    }
    if (item.CanDelete && !item.IsFolder && item.Type !== 'MusicArtist') {
      hideAll(view, 'btnDeleteItem', true);
    } else {
      hideAll(view, 'btnDeleteItem');
    }
    promises.push(reloadRecordingFields(instance, view, item, user));
    var commands = _itemmanager.default.getCommands(getCommandOptions(instance, item, user));
    if (commands.length) {
      hideAll(view, 'btnMoreCommands', true);
    } else {
      hideAll(view, 'btnMoreCommands');
    }
    if (getSortMenuOptions(item).length > 0) {
      hideAll(view, 'btnSortItems', true);
    } else {
      hideAll(view, 'btnSortItems');
    }
    if (item.Type === 'BoxSet') {
      hideAll(view, 'btnGroupBy', true);
    } else {
      hideAll(view, 'btnGroupBy');
    }
    var taglineElem = view.querySelector('.tagline');
    if (itemForDetails.Taglines && itemForDetails.Taglines.length) {
      taglineElem.classList.remove('hide');
      taglineElem.innerHTML = _dom.default.stripScripts(itemForDetails.Taglines[0]);
    } else {
      taglineElem.classList.add('hide');
    }
    if (_layoutmanager.default.tv) {
      taglineElem.classList.remove('tagline-margin');
    } else {
      taglineElem.classList.add('tagline-margin');
    }
    if (itemForDetails.Type === 'Person') {
      var birthDateElem = view.querySelector('.birthDate');
      var birthLocationElem = view.querySelector('.birthLocation');
      if (itemForDetails.PremiereDate) {
        if (itemForDetails.ProductionLocations && itemForDetails.ProductionLocations.length) {
          birthLocationElem.innerHTML = itemForDetails.ProductionLocations[0];
          birthLocationElem.classList.remove('hide');
        } else {
          birthLocationElem.classList.add('hide');
        }
        var birthDate = new Date(Date.parse(itemForDetails.PremiereDate));
        var birthDateString = _datetime.default.toLocaleDateString(birthDate, {
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        });
        if (itemForDetails.EndDate) {
          birthDateString = _globalize.default.translate('BornValue', birthDateString);
        } else {
          var age = parseInt((Date.now() - birthDate.getTime()) / (86400000 * 365));
          if (age > 0) {
            birthDateString = _globalize.default.translate('BornValueAge', birthDateString, parseInt(age));
          } else {
            birthDateString = _globalize.default.translate('BornValue', birthDateString);
          }
        }
        birthDateElem.innerHTML = birthDateString;
        birthDateElem.classList.remove('hide');
      } else {
        birthDateElem.classList.add('hide');
        birthLocationElem.classList.add('hide');
      }
      var deathDateElem = view.querySelector('.deathDate');
      if (itemForDetails.EndDate) {
        var deathDateString = _datetime.default.toLocaleDateString(new Date(Date.parse(itemForDetails.EndDate)), {
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        });
        deathDateString = _globalize.default.translate('DiedValue', deathDateString);
        deathDateElem.innerHTML = deathDateString;
        deathDateElem.classList.remove('hide');
      } else {
        deathDateElem.classList.add('hide');
      }
      renderCredits(instance, view, item, apiClient, user, signal);
    }
    renderGenres(view, item, inferContext(item));
    renderTags(view, item);
    renderStudios(view, item);
    renderLinks(view, item);
    var datePlayed = (_item$UserData3 = item.UserData) == null ? void 0 : _item$UserData3.LastPlayedDate;
    if (datePlayed) {
      view.querySelector('.dateLastPlayedText').innerHTML = _datetime.default.toLocaleString(new Date(Date.parse(item.UserData.LastPlayedDate)));
      view.querySelector('.dateLastPlayedSection').classList.remove('hide');
    } else {
      view.querySelector('.dateLastPlayedSection').classList.add('hide');
    }
    var aboutSection = view.querySelector('.aboutSection');
    switch (item.Type) {
      case 'TvChannel':
      case 'Playlist':
      case 'Tag':
      case 'Studio':
      case 'Genre':
      case 'GameGenre':
      case 'MusicGenre':
      case 'Season':
      case 'Timer':
      case 'SeriesTimer':
      case 'Program':
        aboutSection.classList.add('hide');
        break;
      default:
        if (aboutSection.querySelector('a,button:not(.btnSplitVersions)') || isRenderingTrackSelections(item)) {
          aboutSection.classList.remove('hide');
        } else {
          aboutSection.classList.add('hide');
        }
        break;
    }
    return Promise.all(promises);
  }
  function onRecordingChanged() {
    reloadItem(this, true);
  }
  function reloadRecordingFields(instance, page, item, user) {
    if (instance.currentRecordingFields) {
      instance.currentRecordingFields.refresh(item);
      return Promise.resolve();
    }
    if (item.Type !== 'Program' || !user.Policy.EnableLiveTvManagement) {
      return Promise.resolve();
    }
    Emby.importModule('./modules/recordingcreator/recordingfields.js').then(function (RecordingFields) {
      var recordingFieldsElement = page.querySelector('.mainDetailButtons');
      instance.currentRecordingFields = new RecordingFields({
        parent: recordingFieldsElement,
        program: item
      });
      _events.default.on(instance.currentRecordingFields, 'recordingchanged', onRecordingChanged.bind(instance));
      _events.default.on(instance.currentRecordingFields, 'seriesrecordingchanged', onRecordingChanged.bind(instance));
    });
  }
  function onManageRecordingClick(e) {
    var item = this.currentItem;
    if (!item.TimerId) {
      return;
    }
    _approuter.default.showItem({
      Type: 'Timer',
      Id: item.TimerId,
      ServerId: item.ServerId
    });
  }
  function onManageSeriesRecordingClick(e) {
    var item = this.currentItem;
    if (!item.SeriesTimerId) {
      return;
    }
    _approuter.default.showItem({
      Type: 'SeriesTimer',
      Id: item.SeriesTimerId,
      ServerId: item.ServerId
    });
  }
  function renderTimerEditor(instance, view, item, user, apiClient) {
    if (item.Type !== 'Timer' && (item.Type !== 'Recording' || !item.TimerId || item.Status !== 'InProgress') || !user.Policy.EnableLiveTvManagement) {
      hideAll(view, 'btnCancelTimer');
      return;
    }
    hideAll(view, 'btnCancelTimer', true);
    Emby.importModule('./modules/recordingcreator/recordingeditor.js').then(function (RecordingEditor) {
      var recordingEditor = new RecordingEditor();
      instance.recordingEditor = recordingEditor;
      recordingEditor.embed(item, apiClient.serverId(), {
        context: view.querySelector('.recordingEditor')
      });
    });
  }
  function renderSeriesTimerEditor(view, item, user, apiClient) {
    if (item.Type !== 'SeriesTimer') {
      return;
    }
    if (!user.Policy.EnableLiveTvManagement) {
      view.querySelector('.seriesTimerScheduleSection').classList.add('hide');
      view.querySelector('.btnCancelSeriesTimer').classList.add('hide');
      return;
    }
    Emby.importModule('./modules/recordingcreator/seriesrecordingeditor.js').then(function (seriesRecordingEditor) {
      seriesRecordingEditor.embed(item, apiClient.serverId(), {
        context: view.querySelector('.recordingEditor')
      });
    });
    view.querySelector('.seriesTimerScheduleSection').classList.remove('hide');
    view.querySelector('.btnCancelSeriesTimer').classList.remove('hide');
  }
  function renderLinks(page, item) {
    var linksElem = page.querySelector('.linksSection');
    var links = [];
    if (item.ExternalUrls && _servicelocator.appHost.supports('externallinks') && _servicelocator.appHost.supports('targetblank') && !_layoutmanager.default.tv) {
      for (var i = 0, length = item.ExternalUrls.length; i < length; i++) {
        var url = item.ExternalUrls[i];
        var text = _textencoding.default.htmlEncode(url.Name);
        if (i < length - 1) {
          text += ',';
        }
        links.push('<a is="emby-linkbutton" class="button-link button-link-color-inherit button-link-fontweight-inherit" href="' + url.Url + '" target="_blank">' + text + '</a>');
      }
    }
    linksElem.querySelector('.itemLinks').innerHTML = links.join('');
    if (links.length) {
      linksElem.classList.remove('hide');
    } else {
      linksElem.classList.add('hide');
    }
  }
  function renderGenres(page, item, context) {
    var itemGenres = page.querySelector('.itemGenres');
    var genreElements = [];
    var genres = item.GenreItems || [];
    var type;
    switch (context) {
      case 'games':
        type = 'GameGenre';
        break;
      case 'music':
        type = 'MusicGenre';
        break;
      default:
        type = 'Genre';
        break;
    }
    for (var i = 0, length = genres.length; i < length; i++) {
      var href = _approuter.default.getRouteUrl({
        Name: genres[i].Name,
        Type: type,
        ServerId: item.ServerId,
        Id: genres[i].Id
      }, {
        context: context
      });
      var text = _textencoding.default.htmlEncode(genres[i].Name);
      if (i < length - 1) {
        text += ',';
      }
      genreElements.push('<a is="emby-linkbutton" class="button-link button-link-color-inherit button-link-fontweight-inherit" href="' + href + '">' + text + '</a>');
    }
    itemGenres.innerHTML = genreElements.join('');
    if (genreElements.length) {
      page.querySelector('.genresSection').classList.remove('hide');
    } else {
      page.querySelector('.genresSection').classList.add('hide');
    }
  }
  function renderStudios(page, item) {
    var itemStudios = page.querySelector('.itemStudios');
    var studioElements = [];
    var studios = item.Studios || [];
    for (var i = 0, length = studios.length; i < length; i++) {
      var href = _approuter.default.getRouteUrl({
        Name: studios[i].Name,
        Type: 'Studio',
        ServerId: item.ServerId,
        Id: studios[i].Id
      }, {
        itemTypes: item.Type === 'Person' || item.Type === 'MusicArtist' ? item.Type : null
      });
      var text = _textencoding.default.htmlEncode(studios[i].Name);
      if (i < length - 1) {
        text += ',';
      }
      studioElements.push('<a is="emby-linkbutton" class="button-link button-link-color-inherit button-link-fontweight-inherit" href="' + href + '">' + text + '</a>');
    }
    itemStudios.innerHTML = studioElements.join('');
    if (studioElements.length) {
      page.querySelector('.studiosSection').classList.remove('hide');
    } else {
      page.querySelector('.studiosSection').classList.add('hide');
    }
  }
  function renderTags(page, item) {
    var itemTags = page.querySelector('.itemTags');
    var tagElements = [];
    var tags = item.TagItems || [];
    for (var i = 0, length = tags.length; i < length; i++) {
      var href = _approuter.default.getRouteUrl({
        Name: tags[i].Name,
        Type: 'Tag',
        ServerId: item.ServerId,
        Id: tags[i].Id
      }, {
        itemTypes: item.Type === 'Person' || item.Type === 'MusicArtist' ? item.Type : null
      });
      var text = _textencoding.default.htmlEncode(tags[i].Name);
      if (i < length - 1) {
        text += ',';
      }
      tagElements.push('<a is="emby-linkbutton" class="button-link button-link-color-inherit button-link-fontweight-inherit" href="' + href + '">' + text + '</a>');
    }
    itemTags.innerHTML = tagElements.join('');
    if (tagElements.length) {
      page.querySelector('.tagsSection').classList.remove('hide');
    } else {
      page.querySelector('.tagsSection').classList.add('hide');
    }
  }
  function onTrackSelectionsSubmit(e) {
    e.preventDefault();
    return false;
  }
  function bindAll(view, selector, eventName, fn) {
    var elems = view.querySelectorAll(selector);
    var i, length;
    for (i = 0, length = elems.length; i < length; i++) {
      elems[i].addEventListener(eventName, fn);
    }
  }
  function renderSyncLocalContainer(view, user, item) {
    if (!_servicelocator.appHost.supports('sync')) {
      return;
    }
    var canSync = _itemmanager.default.canSync(item, user);
    var buttons = view.querySelectorAll('.btnSyncDownload');
    for (var i = 0, length = buttons.length; i < length; i++) {
      buttons[i].setItem(item);
      if (canSync && !_layoutmanager.default.tv) {
        buttons[i].classList.remove('hide');
      } else {
        buttons[i].classList.add('hide');
      }
    }
  }
  function onLibraryChanged(e, apiClient, data) {
    var _data$ItemsUpdated;
    var currentItem = this.currentItem;
    var item = currentItem;
    if (!item) {
      return;
    }
    if ((_data$ItemsUpdated = data.ItemsUpdated) != null && _data$ItemsUpdated.includes(item.Id)) {
      if (this.paused) {
        this._fullReloadOnResume = true;
      } else {
        reloadItem(this, true);
      }
    }
  }
  function onUserDataChanged(e, apiClient, userData) {
    var currentItem = this.currentItem;
    var view = this.view;
    var item = currentItem;
    if (!item || item.Id !== userData.ItemId) {
      return;
    }
    currentItem.UserData = userData;
    if (this.paused) {
      // there's a minimal reload that always happens, so no need to pay attention to this
    } else {
      reloadPlayButtons(this, view, currentItem, true);
    }
  }
  function onTimerCancelled(e, apiClient, data) {
    var currentItem = this.currentItem;
    var item = currentItem;
    if (!item || item.Id !== data.Id) {
      return;
    }
    if (this.paused) {
      // todo: do we need this event at all anymore?
      // the delete process will trigger the backwards navigation
    } else {
      // todo: When cancelling a timer, will this lead to a double back
      _approuter.default.back();
    }
  }
  function executeCommandWithCommandProcessor(command, item, options) {
    Emby.importModule('./modules/commandprocessor.js').then(function (commandProcessor) {
      return commandProcessor.executeCommand(command, [item], options);
    });
  }
  function getItemPromise(instance, apiClient) {
    var params = instance.params;
    if (params.seriesTimerId) {
      return apiClient.getLiveTvSeriesTimer(params.seriesTimerId);
    }
    if (params.timerId) {
      return apiClient.getLiveTvTimer(params.timerId);
    }
    var options = {};
    var fields = [];
    if (params.asSeries === 'true') {
      options.AsSeries = true;
    } else {
      fields.push('ShareLevel');
    }
    fields.push('SyncStatus');
    fields.push('ContainerSyncStatus');
    if (fields.length) {
      options.fields = fields.join(',');
    }
    options.ExcludeFields = 'VideoChapters,VideoMediaSources,MediaStreams';
    return apiClient.getItem(apiClient.getCurrentUserId(), params.id, options);
  }
  function onDataFetched(responses, signal) {
    var itemInfo = responses[0];
    var item = itemInfo.item;
    var mediaSources = itemInfo.mediaSources;
    var user = responses[1];
    var apiClient = _connectionmanager.default.getApiClient(item.ServerId);
    var view = this.view;
    var currentlyHasBackdrop = _backdrop.default.hasBackdrop();
    var willHaveBackdrop = currentlyHasBackdrop;
    var setNewBackdrop;
    var backdropOptions = {
      enableAnimation: true,
      enablePrimaryImageBeforeInherited: enableTvDetailImageLayout(this, item) && !enableDetailPoster(this, item) && item.Type !== 'Season' && item.Type !== 'Episode',
      allowPrimaryImage: enableTvDetailImageLayout(this, item) && !enableDetailPoster(this, item)
    };
    if (this.params.asDialog !== 'true') {
      var itemHasOwnBackdrops = _backdrop.default.getBackdropsFromOptions([item], backdropOptions).length > 0;

      // If it's a person, leave the backdrop image from wherever we came from
      if (item.Type !== 'Person' || itemHasOwnBackdrops || !currentlyHasBackdrop) {
        willHaveBackdrop = itemHasOwnBackdrops;
        setNewBackdrop = true;
      }
    }
    this.updateDrawerState();
    var itemMainScrollSlider = view.querySelector('.itemMainScrollSlider');
    var detailMainContainerParent = view.querySelector('.detailMainContainerParent');
    var asDialog = this.params.asDialog === 'true';
    var isDarkContentContainer;
    if (willHaveBackdrop && !asDialog) {
      skinHeader.classList.add('darkContentContainer');
      if (enableTvDetailImageLayout(this, item)) {
        if (_layoutmanager.default.tv) {
          itemMainScrollSlider.classList.add('itemMainScrollSlider-fade');
          if (_playbackmanager.default.isPlayingLocally(['Video'])) {
            backgroundContainer.classList.remove('itemBackgroundContainer-transparent');
          } else {
            backgroundContainer.classList.add('itemBackgroundContainer-transparent');
          }
        } else {
          itemMainScrollSlider.classList.remove('itemMainScrollSlider-fade');
          backgroundContainer.classList.remove('itemBackgroundContainer-transparent');
        }
        detailMainContainerParent.classList.add('detailMainContainerParent-fade');
        isDarkContentContainer = true;
      } else {
        itemMainScrollSlider.classList.remove('itemMainScrollSlider-fade');
        detailMainContainerParent.classList.remove('detailMainContainerParent-fade');
        backgroundContainer.classList.remove('itemBackgroundContainer-transparent');
      }
      if (_layoutmanager.default.tv) {
        view.classList.add('darkContentContainer', 'darkContentContainer-item');
      } else {
        view.classList.add('darkContentContainer-item');
        view.classList.remove('darkContentContainer');
      }
      if (enableItemBackdropAsTopImage(item)) {
        backdropContainer.classList.add('backdropContainer-preventbackdrop');
        backgroundContainer.classList.add('itemBackgroundContainer', 'itemBackgroundContainer-preventbackdrop');
      } else {
        backdropContainer.classList.remove('backdropContainer-preventbackdrop');
        backgroundContainer.classList.add('itemBackgroundContainer');
        backgroundContainer.classList.remove('itemBackgroundContainer-preventbackdrop');
      }
    } else {
      view.classList.remove('darkContentContainer-item', 'darkContentContainer');
      itemMainScrollSlider.classList.remove('itemMainScrollSlider-fade');
      detailMainContainerParent.classList.remove('detailMainContainerParent-fade');
      if (!asDialog) {
        skinHeader.classList.remove('darkContentContainer');
        backgroundContainer.classList.remove('itemBackgroundContainer', 'itemBackgroundContainer-transparent', 'itemBackgroundContainer-preventbackdrop');
        backdropContainer.classList.remove('backdropContainer-preventbackdrop');
      }
    }
    if (setNewBackdrop) {
      _backdrop.default.setBackdrops([item], backdropOptions);
      this.updateDrawerState();
    }
    this.currentItem = item;
    insertTextFields(this);
    var promises = [];
    if (!this.sectionsInitialized) {
      this.sectionsInitialized = true;

      //initTrailersSection(this, view, item, apiClient);
      initMoreFromSeasonSection(this, view, item, apiClient);
      initMoreFromArtistSection(this, view, item, apiClient);
      initAlbumsAsComposerSection(this, view, item, apiClient);
      promises.push(initSeriesItemsSection(this, item, apiClient, signal));
      initArtistSongsSection(this, view, item, apiClient);
      initArtistAlbumsSection(this, item, apiClient);
      initTrackList(this, item, apiClient);
      initAppearsOnListSection(this, view, item, apiClient, user);
      initPeopleSection(this, view, item, apiClient);
      initMoreLikeThisSection(this, view, item, apiClient);
      initMoreLikeThisOnLiveTVSection(this, view, item, apiClient);
      initUpcomingOnTVSection(this, view, item, apiClient);
      initSpecialsSection(this, view, item, apiClient);
      initExtrasSection(this, view, item, apiClient);
      initLinkedItemsSection(this, view, item, apiClient);
      initChaptersSection(this, view, item, apiClient);
      initAdditionalPartsSection(this, view, item, apiClient);
      initProgramGuideSection(this, view, item, apiClient);
      initSeriesTimerScheduleSection(this, view, item, apiClient);
      initDetailImage(this, view, item, apiClient);
    }

    // this gets refreshed separately
    resumeAdditionalPartsItemsContainer(this.view);
    resumeChaptersItemsContainer(this.view);
    var additionalContentSection = view.querySelector('.details-additionalContent');
    if (item.Type === 'TvChannel' || item.Type === 'Playlist' || item.Type === 'Season') {
      // the virtual scroller needs to be at the bottom
      additionalContentSection.classList.remove('padded-bottom-page');
    } else {
      additionalContentSection.classList.add('padded-bottom-page');
    }
    var detailMainContainer = this.mainSection;
    if (willHaveBackdrop) {
      additionalContentSection.classList.add('details-additionalContent-withbackdrop');
      detailMainContainer.classList.add('detailMainContainer-withbackdrop');
    } else {
      additionalContentSection.classList.remove('details-additionalContent-withbackdrop');
      detailMainContainer.classList.remove('detailMainContainer-withbackdrop');
    }
    if (enableTrackList(item)) {
      if (item.Type === 'Season') {
        setTitle(item, apiClient);
      } else {
        setTitle(item, apiClient, _layoutmanager.default.tv);
      }
      view.querySelector('.detailTextContainer').classList.add('detailTextContainer-tracklist');
    } else {
      setTitle(item, apiClient, getLogoPlacement(item) === 'float' && item.Type !== 'MusicAlbum');
      view.querySelector('.detailTextContainer').classList.remove('detailTextContainer-tracklist');
    }
    var topDetailsMain = view.querySelector('.topDetailsMain');
    var itemSideContainer = view.querySelector('.item-fixed-side');
    var mainDetailButtons = view.querySelector('.mainDetailButtons');
    if (!_layoutmanager.default.tv) {
      mainDetailButtons.classList.add('detailButtons-margin');
    }
    if (enableTrackList(item)) {
      topDetailsMain.classList.remove('topDetailsMain-graphic', 'topDetailsMain-graphic-tv', 'topDetailsMain-textshadow');
      detailMainContainer.classList.remove('detailMainContainer-withitembackdrop', 'detailMainContainer-vertical');
      itemSideContainer.classList.remove('hide');
      if (_layoutmanager.default.tv && item.Type !== 'Season') {
        topDetailsMain.classList.add('padded-left', 'padded-left-page', 'padded-right');
      } else {
        topDetailsMain.classList.remove('padded-left', 'padded-left-page', 'padded-right');
      }
    } else {
      if (enableItemBackdropAsTopImage(item)) {
        detailMainContainer.classList.add('detailMainContainer-withitembackdrop');
        detailMainContainer.classList.remove('detailMainContainer-vertical');
      } else {
        detailMainContainer.classList.remove('detailMainContainer-withitembackdrop');
        detailMainContainer.classList.add('detailMainContainer-vertical');
      }
      if (enableTvDetailImageLayout(this, item)) {
        if (_layoutmanager.default.tv) {
          topDetailsMain.classList.add('topDetailsMain-graphic', 'topDetailsMain-graphic-tv');
          if (isDarkContentContainer) {
            topDetailsMain.classList.add('topDetailsMain-textshadow');
          }
        } else {
          topDetailsMain.classList.add('topDetailsMain-graphic');
          topDetailsMain.classList.remove('topDetailsMain-graphic-tv', 'topDetailsMain-textshadow');
        }
      } else {
        topDetailsMain.classList.remove('topDetailsMain-graphic', 'topDetailsMain-graphic-tv', 'topDetailsMain-textshadow');
      }
      itemSideContainer.classList.add('hide');
      topDetailsMain.classList.remove('padded-left', 'padded-left-page', 'padded-right');
    }
    renderName(this, item, apiClient, user, view.querySelectorAll('.detailNameContainer'));
    renderDetailPageBackdrop(view, item, apiClient);
    renderTrackSelections(view, this, item, user, true, mediaSources);
    promises.push(renderDetails(this, view, item, apiClient, user, signal));
    renderSyncLocalContainer(view, user, item);
    return Promise.all(promises).then(function () {
      if (!enableTrackList(item)) {
        updateMainDetailButtonsFocusState(mainDetailButtons);
      }
      return [item, user];
    });
  }
  function onItemFetchError(instance, errorResponse, apiClient) {
    return getResponseHelper().then(function (responseHelper) {
      return responseHelper.getErrorInfo(errorResponse, {
        enableDefaultTitle: false
      }).then(function (errorInfo) {
        var view = instance.view;
        view.querySelector('.details-additionalContent').classList.add('hide');
        var html = '';
        html += '<div>';
        if (errorInfo.title) {
          html += '<h2 style="margin-top:0;">';
          html += _textencoding.default.htmlEncode(errorInfo.title);
          html += '</h2>';
        }
        html += '<p style="margin-bottom:2em;">';
        if (!apiClient.isMinServerVersion('4.8.4')) {
          html += 'Content no longer available.';
        } else {
          html += _textencoding.default.htmlEncode(errorInfo.text);
        }
        html += '</p>';
        var href = _approuter.default.getRouteUrl('home', {
          serverId: apiClient.serverId()
        });
        html += '<a href="' + href + '" is="emby-linkbutton" class="raised btnHomeItemNotFound" style="margin:0;">';
        html += _globalize.default.translate('Home');
        html += '</a>';
        html += '</div>';
        view.querySelector('.detailMainContainer').innerHTML = html;
        _focusmanager.default.focus(view.querySelector('.btnHomeItemNotFound'));
        return Promise.reject(errorResponse);
      });
    });
  }
  function getItemWithMediaSource(instance, apiClient) {
    return getItemPromise(instance, apiClient).then(function (item) {
      var playbackMediaSourcesPromise;
      if (isRenderingTrackSelections(item)) {
        playbackMediaSourcesPromise = _playbackmanager.default.getPlaybackMediaSources(item);
      } else {
        playbackMediaSourcesPromise = Promise.resolve([]);
      }
      return playbackMediaSourcesPromise.then(function (mediaSources) {
        return {
          item: item,
          mediaSources: mediaSources
        };
      });
    });
  }
  function startDataLoad(instance, signal) {
    var params = instance.params;
    var apiClient = _connectionmanager.default.getApiClient(params.serverId);
    var promise = Promise.all([getItemWithMediaSource(instance, apiClient), apiClient.getCurrentUser()]).then(function (response) {
      signal == null || signal.throwIfAborted();
      return onDataFetched.call(instance, response, signal);
    }, function (err) {
      console.error('error loading item: ', err);
      signal == null || signal.throwIfAborted();
      return onItemFetchError(instance, err, apiClient);
    });
    instance.dataPromise = promise;
    return promise;
  }
  function onPlaybackStop(e, stopInfo) {
    var state = stopInfo.state || {};
    if (state.NextMediaType || state.IsBackgroundPlayback) {
      return;
    }
    var player = stopInfo.player;
    if (!(player != null && player.isLocalPlayer) || _appsettings.default.enableVideoUnderUI()) {
      return;
    }
    var playedItem = state.NowPlayingItem || {};
    var currentItem = this.currentItem || {};
    if (currentItem.MediaType === playedItem.MediaType && playedItem.MediaType) {
      // this type check shouldn't be needed, but it's here to ensure we don't do this on an intro
      if (playedItem.Type === 'Episode') {
        this.showItemOnResume = playedItem;
      }
    }
  }
  function onPlayerChange() {
    var view = this.view;
    var item = this.currentItem;

    // check in case these are not set yet
    if (!view || !item) {
      return;
    }
    renderTrackSelectionsWithoutUser(view, this, item);
  }
  function getPlayOptions(view, params, startPositionTicks) {
    var audioStreamIndex = view.querySelector('.selectAudio').value || null;
    return {
      startPositionTicks: startPositionTicks,
      mediaSourceId: view.querySelector('.selectSource').value,
      audioStreamIndex: audioStreamIndex,
      subtitleStreamIndex: view.querySelector('.selectSubtitles').value,
      parentId: params.parentId
    };
  }
  function playCurrentItem(instance, mode) {
    return loadMultiSelect().then(function (MultiSelect) {
      if (MultiSelect != null && MultiSelect.canPlay()) {
        if (mode === 'shuffle') {
          MultiSelect.shuffle();
        } else {
          MultiSelect.play();
        }
        return;
      }
      var currentItem = instance.currentItem;
      var view = instance.view;
      var item = currentItem;

      // Pass in null as the start position to get the resume point at the last possible moment
      var startPositionTicks = item.UserData && mode === 'resume' ? null : 0;
      var playOptions = getPlayOptions(view, instance.params, startPositionTicks);
      if (mode === 'shuffle') {
        playOptions.shuffle = true;
      }
      playOptions.items = [item];
      _playbackactions.default.play(playOptions);
    });
  }
  function onPlayClick(e) {
    var button = e.currentTarget;
    var mode = button.getAttribute('data-mode');
    playCurrentItem(this, mode);
  }
  function onShuffleClick() {
    playCurrentItem(this, 'shuffle');
  }
  function onEdited() {
    reloadItem(this, true);
  }
  function onEditCancel() {}
  function onEditMetadataClick() {
    var currentItem = this.currentItem;
    var instance = this;
    Emby.importModule('./modules/metadataeditor/metadataeditor.js').then(function (MetadataEditor) {
      return new MetadataEditor().show(currentItem.Id, currentItem.ServerId).then(onEdited.bind(instance), onEditCancel);
    });
  }
  function onEditImagesClick() {
    var currentItem = this.currentItem;
    var instance = this;
    Emby.importModule('./modules/imageeditor/imageeditor.js').then(function (imageEditor) {
      imageEditor.show({
        itemId: currentItem.Id,
        serverId: currentItem.ServerId
      }).then(onEdited.bind(instance), onEditCancel);
    });
  }
  function onDeleteClick() {
    var currentItem = this.currentItem;
    _itemmanager.default.deleteItems({
      items: [currentItem],
      navigate: 'back'
    });
  }
  function onCancelSeriesTimerClick() {
    onDeleteClick.call(this);
  }
  function onCancelTimerClick() {
    var instance = this;
    var item = this.currentItem;
    var type = item.Type;
    var serverId = item.ServerId;
    var timerId = type === 'Timer' ? item.Id : item.TimerId;
    Emby.importModule('./modules/common/recordinghelper.js').then(function (recordingHelper) {
      recordingHelper.cancelTimer(_connectionmanager.default.getApiClient(serverId), timerId, true).then(function () {
        reloadItem(instance, true);
      });
    });
  }
  function onPlayTrailerClick() {
    var currentItem = this.currentItem;
    _playbackmanager.default.playTrailers(currentItem);
  }
  function onDownloadChange() {
    reloadItem(this, true);
  }
  function splitVersions(instance, page, apiClient, params) {
    showConfirm("Are you sure you wish to split the media sources into separate items?", "Split Media Apart").then(function () {
      _loading.default.show();
      apiClient.ungroupVersions(params.id).then(function () {
        _loading.default.hide();
        reloadItem(instance, true);
      });
    });
  }
  function onReadMoreClick(e) {
    var btn = e.currentTarget;
    var overviewTextElem = btn.closest('.overview-container').querySelector('.overview-text');
    showAlert({
      preFormattedText: overviewTextElem.innerHTML,
      confirmButton: false,
      // handle episodes without a title
      title: _itemmanager.default.getDisplayName(this.currentItem) || this.currentItem.Name,
      centerText: false,
      item: this.currentItem
    });
  }
  function onSplitVersionsClick() {
    var instance = this;
    var params = instance.params;
    var apiClient = _connectionmanager.default.getApiClient(params.serverId);
    splitVersions(instance, instance.view, apiClient, params);
  }
  function onPromiseRejected(e) {
    console.log('itemContextMenu close: ' + e);
  }
  function getSortMenuOptions(item) {
    switch (item.Type) {
      case 'Playlist':
        return _itemmanager.default.getSortMenuOptions({
          apiClient: _connectionmanager.default.getApiClient(item),
          itemType: 'PlaylistItem'
        });
      case 'BoxSet':
        return _itemmanager.default.getSortMenuOptions({
          apiClient: _connectionmanager.default.getApiClient(item),
          itemType: 'BoxSetItem'
        });
      default:
        return [];
    }
  }
  function setSelectedSortOption(options, currentValues) {
    for (var i = 0, length = options.length; i < length; i++) {
      var opt = options[i];
      opt.selected = opt.value === (currentValues.sortBy || 'default');
      if (opt.selected) {
        var icon = currentValues.sortOrder === 'Descending' ? '&#xe5DB;' : '&#xe5D8;';
        opt.asideIcon = icon;
        break;
      }
    }
  }
  function getSortMenuOption(sortMenuOptions, sortBy) {
    for (var i = 0, length = sortMenuOptions.length; i < length; i++) {
      var option = sortMenuOptions[i];
      if (option.value === sortBy) {
        return option;
      }
    }
    return null;
  }
  function getDefaultSortOrder(sortMenuOptions, sortBy) {
    if (sortBy) {
      var option = getSortMenuOption(sortMenuOptions, sortBy);
      if (option && option.value === sortBy) {
        if (option.defaultSortOrder) {
          return option.defaultSortOrder;
        }
      }
    }
    return 'Descending';
  }
  function setSortLabelText() {
    var instance = this;
    var item = instance.currentItem;
    var sortItems = getSortMenuOptions(item);
    var view = instance.view;
    var value = _usersettings.default.itemSortBy(item.Id) || 'default';
    var option = getSortMenuOption(sortItems, value);
    var btn = view.querySelector('.btnSortItems');
    btn.setAttribute('title', _globalize.default.translate('SortByValue', (option == null ? void 0 : option.name) || ''));
    btn.setAttribute('aria-label', _globalize.default.translate('SortByValue', (option == null ? void 0 : option.name) || ''));
    btn.querySelector('.btnSortText').innerHTML = _globalize.default.translate('HeaderSortBy');
  }
  function sortItem(instance, item, options) {
    var currentValues = {
      sortBy: _usersettings.default.itemSortBy(item.Id),
      sortOrder: _usersettings.default.itemSortOrder(item.Id)
    };
    var sortItems = getSortMenuOptions(item);
    setSelectedSortOption(sortItems, currentValues);
    return showActionSheet({
      items: sortItems,
      positionTo: options.positionTo,
      positionY: options.positionY,
      positionX: options.positionX,
      positionClientY: options.positionClientY,
      positionClientX: options.positionClientX,
      transformOrigin: options.transformOrigin,
      title: _globalize.default.translate('HeaderSortBy'),
      // allow a little space between the borders
      offsetTop: 2,
      hasItemAsideIcon: true,
      hasItemSelectionState: true
    }).then(function (value) {
      var sortOrder;
      if (!sortOrder) {
        sortOrder = currentValues.sortOrder;
        if (currentValues.sortBy === value) {
          sortOrder = sortOrder === 'Ascending' ? 'Descending' : 'Ascending';
        } else {
          sortOrder = getDefaultSortOrder(sortItems, value);
        }
      }
      _usersettings.default.itemSortBy(item.Id, value);
      _usersettings.default.itemSortOrder(item.Id, sortOrder);
    });
  }
  function showGroupByMenu(instance, item, options) {
    var currentValue = _usersettings.default.groupCollectionItems();
    var items = [{
      name: _globalize.default.translate('HeaderMediaType'),
      value: 'mediatype',
      Selected: currentValue
    }, {
      name: _globalize.default.translate('None'),
      value: '',
      Selected: !currentValue
    }];
    return showActionSheet({
      items: items,
      positionTo: options.positionTo,
      positionY: options.positionY,
      positionX: options.positionX,
      positionClientY: options.positionClientY,
      positionClientX: options.positionClientX,
      transformOrigin: options.transformOrigin,
      title: _globalize.default.translate('HeaderGroupBy'),
      // allow a little space between the borders
      offsetTop: 2,
      hasItemSelectionState: true
    }).then(function (groupBy) {
      _usersettings.default.groupCollectionItems(groupBy === 'mediatype');
    });
  }
  function onSortItemsClick(e) {
    var button = e.currentTarget;
    var instance = this;
    sortItem(instance, instance.currentItem, {
      positionTo: button,
      positionY: 'bottom'
    }).then(function () {
      reloadItem(instance, true);
    });
  }
  function onGroupByClick(e) {
    var button = e.currentTarget;
    var instance = this;
    showGroupByMenu(instance, instance.currentItem, {
      positionTo: button,
      positionY: 'bottom'
    }).then(function () {
      reloadItem(instance, true);
    });
  }
  function onMoreCommandsClick(e) {
    var button = e.currentTarget;
    var instance = this;
    var params = this.params;
    var apiClient = _connectionmanager.default.getApiClient(params.serverId);
    var currentItem = this.currentItem;

    // needed by the subtitle editor
    currentItem.MediaSources = instance._currentPlaybackMediaSources;
    apiClient.getCurrentUser().then(function (user) {
      _itemcontextmenu.default.show(getCommandOptions(instance, currentItem, user, button)).then(function (result) {
        if (result.command === 'addtoplaylist' || result.command === 'addtocollection') {
          reloadItem(instance, true);
        }
      }, onPromiseRejected);
    });
  }
  function getSeriesChildrenListOptions(items) {
    var fields = ['Name'];
    var includeParentInfoInTitle;
    if (this.renderAllEpisodes && !this.hasMultipleSeasons) {
      includeParentInfoInTitle = false;
    }
    var centerText = true;
    if (this.renderAllEpisodes) {
      fields.push('Overview');
      fields.push('MediaInfo');
      centerText = false;
    }
    return {
      renderer: _cardbuilder.default,
      options: {
        shape: 'auto',
        scalable: true,
        centerText: centerText,
        fields: fields,
        overlayText: false,
        focusTransformTitleAdjust: true,
        includeParentInfoInTitle: includeParentInfoInTitle
      },
      virtualScrollLayout: 'horizontal-grid'
    };
  }
  function getMusicArtistChildrenListOptions(items) {
    var fields = ['Name', 'ProductionYear'];
    return {
      renderer: _cardbuilder.default,
      options: {
        shape: 'auto',
        scalable: true,
        centerText: true,
        fields: fields,
        overlayText: false,
        focusTransformTitleAdjust: true
      },
      virtualScrollLayout: 'horizontal-grid'
    };
  }
  function getSeasons(query, signal) {
    var item = this.currentItem;
    var apiClient = _connectionmanager.default.getApiClient(item);

    // Overview is for the season picker
    var fields = this.getRequestedItemFields() + ',PrimaryImageAspectRatio,Overview';
    return apiClient.getSeasons(item.Id, Object.assign({
      UserId: apiClient.getCurrentUserId(),
      Fields: fields,
      IsSpecialSeason: this.renderAllEpisodes ? false : null
    }, query, signal));
  }
  function getSeriesEpisodes(instance, query) {
    var item = instance.currentItem;
    var apiClient = _connectionmanager.default.getApiClient(item);
    query = Object.assign({
      UserId: apiClient.getCurrentUserId(),
      Recursive: true,
      IsFolder: false,
      ParentId: item.Id
    }, query);
    if (!query.IsStandaloneSpecial && !query.IsSpecialEpisode) {
      query.IsStandaloneSpecial = false;
    }
    if (!apiClient.isMinServerVersion('4.8')) {
      query.IncludeItemTypes = 'Episode';
    }
    return apiClient.getItems(apiClient.getCurrentUserId(), query);
  }
  function getSeriesChildrenItems(query) {
    if (this.renderAllEpisodes) {
      var fields = this.getRequestedItemFields() + ',PrimaryImageAspectRatio';
      fields += ',Overview,PremiereDate,ProductionYear,RunTimeTicks,SpecialEpisodeNumbers';
      query = Object.assign({
        Fields: fields
      }, query);
      return getSeriesEpisodes(this, query);
    }
    return getSeasons.call(this, query);
  }
  function selectFirst(select) {
    select.getItems({
      StartIndex: 0,
      Limit: 1
    }).then(function (result) {
      if (result.Items.length) {
        select.setValues([result.Items[0].Id], false, [result.Items[0]]);
      }
    });
  }
  function afterAllEpisodesRefreshed(totalResult) {
    if (!totalResult.Items.length) {
      return;
    }
    var item = this.currentItem;
    if (!item) {
      return;
    }
    var view = this.view;
    if (!view) {
      return;
    }
    var instance = this;
    var itemsContainer = view.querySelector('.childrenItemsContainer');
    if (!itemsContainer) {
      return;
    }
    return getNextUpItems.call(this, {
      Limit: 1,
      EnableTotalRecordCount: false,
      EnableUserData: false,
      EnableImages: false,
      Fields: null
    }).then(function (nextUpResult) {
      var startItem = nextUpResult.Items[0];
      var detailSelectSeason = view.querySelector('.detailSelectSeason');
      if (!startItem) {
        itemsContainer.scrollToIndex(0, {
          behavior: 'instant',
          offset: '-padding-inline-start'
        }, false);
        if (detailSelectSeason) {
          selectFirst(detailSelectSeason);
        }
        return;
      }
      onSeriesEpisodeFocusedOrScrolled(instance, startItem);
      var index = itemsContainer.indexOfItemId(startItem.Id);
      if (index !== -1) {
        itemsContainer.scrollToIndex(index, {
          behavior: 'instant',
          offset: '-padding-inline-start'
        }, false);
        return;
      }
      var query = {
        Limit: 0,
        StartItemId: startItem.Id
      };
      return getSeriesEpisodes(instance, query).then(function (result) {
        index = Math.max(totalResult.TotalRecordCount - result.TotalRecordCount, 0);
        itemsContainer.scrollToIndex(Math.min(index, totalResult.TotalRecordCount - 1), {
          behavior: 'instant',
          offset: '-padding-inline-start'
        }, false);
      });
    });
  }
  function getMusicArtistChildrenItems(query) {
    var item = this.currentItem;
    if (item.Type !== 'MusicArtist') {
      return Promise.resolve({
        Items: [],
        TotalRecordCount: 0
      });
    }
    var apiClient = _connectionmanager.default.getApiClient(item);
    query = Object.assign({
      IncludeItemTypes: 'MusicAlbum',
      Recursive: true,
      SortBy: 'ProductionYear,PremiereDate,SortName',
      SortOrder: 'Descending,Descending,Ascending',
      ImageTypeLimit: 1,
      Fields: this.getRequestedItemFields() + ',PrimaryImageAspectRatio,ProductionYear'
    }, query);
    query.AlbumArtistIds = item.Id;
    return apiClient.getItems(apiClient.getCurrentUserId(), query);
  }
  function getSeasonItemsFn(instance, serverId, seriesId, seasonId) {
    return function (query) {
      var apiClient = _connectionmanager.default.getApiClient(serverId);
      return apiClient.getEpisodes(seriesId, Object.assign({
        SeasonId: seasonId,
        ImageTypeLimit: 1,
        UserId: apiClient.getCurrentUserId(),
        Fields: 'Overview,PrimaryImageAspectRatio,PremiereDate,ProductionYear,SyncStatus'
      }, query));
    };
  }
  function getMusicAlbumItems(query) {
    var item = this.currentItem;
    var apiClient = _connectionmanager.default.getApiClient(item);
    var includeOverview = item.SupportsResume === true;
    var fields = this.getRequestedItemFields() + ',PrimaryImageAspectRatio,SyncStatus';
    if (includeOverview) {
      fields += ',Overview';
    }
    return apiClient.getItems(apiClient.getCurrentUserId(), Object.assign({
      ParentId: item.Id,
      Fields: fields,
      ImageTypeLimit: 1,
      SortBy: null,
      EnableTotalRecordCount: false
    } /*, query*/));
  }
  function getPlaylistItems(query) {
    var instance = this;
    var currentItem = instance.currentItem;
    var apiClient = _connectionmanager.default.getApiClient(currentItem);
    var itemId = currentItem.Id;
    var sortBy = _usersettings.default.itemSortBy(itemId) || 'default';
    if (sortBy === 'default') {
      sortBy = 'ListItemOrder';
    }
    var sortOrder = sortBy ? _usersettings.default.itemSortOrder(itemId) : null;
    return apiClient.getItems(apiClient.getCurrentUserId(), Object.assign({
      ParentId: itemId,
      Fields: 'PrimaryImageAspectRatio,Overview,PremiereDate,ProductionYear,OfficialRating,CommunityRating,SyncStatus',
      ImageTypeLimit: 1,
      SortBy: sortBy,
      SortOrder: sortOrder
    }, query)).then(function (result) {
      for (var i = 0, length = result.Items.length; i < length; i++) {
        result.Items[i].PlaylistId = itemId;
      }
      return result;
    });
  }
  function anyIsNonMusic(items) {
    for (var i = 0, length = items.length; i < length; i++) {
      var item = items[i];
      if (item.Overview) {
        if (item.SupportsResume) {
          return true;
        }
        if (item.Type !== 'Audio') {
          return true;
        }
      }
    }
    return false;
  }
  function anyHasOverview(items) {
    for (var i = 0, length = items.length; i < length; i++) {
      var item = items[i];
      if (item.MediaType !== 'Audio' || item.SupportsResume) {
        return true;
      }
    }
    return false;
  }
  function getPlaylistListOptionsFn(item) {
    return function (items) {
      var fields = [];
      fields.push('ParentName');
      fields.push('Name');
      var hasNonMusic = anyIsNonMusic(items);
      var enableSideMediaInfo = true;
      if (hasNonMusic) {
        fields.push('Overview');
        enableSideMediaInfo = false;
      }
      var sortBy = _usersettings.default.itemSortBy(item.Id) || 'default';
      if (sortBy === 'default') {
        sortBy = 'ListItemOrder';
      }
      var sortOrder = sortBy ? _usersettings.default.itemSortOrder(item.Id) : null;
      return {
        renderer: _listview.default,
        options: {
          showIndexNumberLeft: item.Type === 'MusicAlbum',
          action: 'playallfromhere',
          dragReorder: item.Type === 'Playlist' && item.CanEditItems !== false && sortBy === 'ListItemOrder' && sortOrder === 'Ascending',
          playlistId: item.Type === 'Playlist' ? item.Id : null,
          image: item.Type === 'Playlist',
          artist: 'auto',
          showIndex: item.Type === 'MusicAlbum',
          autoHideArtist: item.Type === 'MusicAlbum',
          index: 'disc',
          containerAlbumArtists: item.Type === 'MusicAlbum' ? item.AlbumArtists : null,
          fields: fields,
          playAction: 'playallfromhere',
          enableSideMediaInfo: enableSideMediaInfo,
          imageSize: hasNonMusic ? 'medium' : null,
          autoMoveParentName: true
        },
        virtualScrollLayout: 'vertical-list',
        commandOptions: {
          openAlbum: item.Type !== 'MusicAlbum',
          gotoItem: true,
          removeFromPlaylist: item.CanEditItems !== false
        }
      };
    };
  }
  function hasMultipleDiscs(items) {
    var discs = {};
    var numDiscs = 0;
    for (var i = 0, length = items.length; i < length; i++) {
      var item = items[i];
      if (item.ParentIndexNumber != null && !discs[item.ParentIndexNumber]) {
        discs[item.ParentIndexNumber] = true;
        numDiscs++;
      }
    }
    return numDiscs > 1;
  }
  function getAudioBookListOptionsFn(item) {
    return function (items) {
      var fields = [];
      if (anyHasOverview(items)) {
        fields.push('Overview');
      }
      if (item.Type === 'Playlist') {
        fields.push('ParentName');
      }
      fields.push('Name');
      return {
        renderer: _listview.default,
        options: {
          showIndexNumberLeft: false,
          highlight: false,
          action: 'link',
          dragReorder: false,
          image: true,
          imageSize: 'medium',
          showIndexNumber: true,
          artist: 'auto',
          imagePlayButton: !_layoutmanager.default.tv,
          showIndex: item.Type === 'MusicAlbum',
          fields: fields,
          index: hasMultipleDiscs(items) ? 'disc' : null,
          containerAlbumArtists: item.Type === 'MusicAlbum' ? item.AlbumArtists : null,
          playAction: 'playallfromhere',
          includeParentInfoInTitle: false,
          autoHideMediaInfo: false,
          enableSideMediaInfo: true
        },
        virtualScrollLayout: 'vertical-list',
        commandOptions: {
          openAlbum: false
        }
      };
    };
  }
  function getSeasonListOptionsFn(item) {
    return function () {
      return {
        renderer: _listview.default,
        options: {
          showIndexNumber: false,
          imageSize: 'large',
          highlight: false,
          action: 'link',
          imagePlayButton: !_layoutmanager.default.tv,
          includeParentInfoInTitle: false,
          enableSpecialEpisodePrefix: item.IndexNumber !== 0,
          fields: ['Name', 'Overview'],
          autoMoveFavoriteButton: false
        },
        virtualScrollLayout: 'vertical-list'
      };
    };
  }
  function initTrackList(instance, item, apiClient) {
    var trackList = instance.view.querySelector('.trackList');
    var section = trackList.closest('.trackListSection');
    trackList.parentContainer = section;
    if (item.Type === 'Season') {
      trackList.fetchData = getSeasonItemsFn(instance, apiClient.serverId(), item.SeriesId, item.Id);
      trackList.getListOptions = getSeasonListOptionsFn(item);
      trackList.setAttribute('data-virtualscrolllayout', 'vertical-grid');
      trackList.classList.add('padded-bottom-page');
    } else if (item.Type === 'MusicAlbum') {
      trackList.fetchData = getMusicAlbumItems.bind(instance);
      trackList.getListOptions = item.SupportsResume === true ? getAudioBookListOptionsFn(item) : getPlaylistListOptionsFn(item);
      trackList.classList.add('generalItemsContainer');
      if (!_layoutmanager.default.tv) {
        section.classList.add('padded-left-withlist-autocollapse');
      }
    } else if (item.Type === 'Playlist') {
      trackList.fetchData = getPlaylistItems.bind(instance);
      trackList.getListOptions = getPlaylistListOptionsFn(item);
      trackList.setAttribute('data-monitor', 'PlaylistItems');
      trackList.setAttribute('data-monitorids', item.Id);
      trackList.setAttribute('data-virtualscrolllayout', 'vertical-grid');
      trackList.classList.add('padded-bottom-page');
      trackList.afterRefresh = setSortLabelText.bind(instance);
      trackList.classList.add('generalItemsContainer');
      if (!_layoutmanager.default.tv) {
        section.classList.add('padded-left-withlist-autocollapse');
      }
    }
    if (_layoutmanager.default.tv && item.Type === 'Season') {
      trackList.classList.add('tracklist-sidemargin');
    } else {
      trackList.classList.remove('tracklist-sidemargin');
    }
    if (item.Type === 'Season' || item.Type === 'MusicAlbum' && !_layoutmanager.default.tv || item.Type === 'Playlist' && !_layoutmanager.default.tv) {
      trackList.classList.add('trackList-marginleftcards');
    } else {
      trackList.classList.remove('trackList-marginleftcards');
    }
  }
  function scrollEpisodesToSeason(instance, seasonId) {
    var itemsContainer = instance.view.querySelector('.childrenItemsContainer');
    if (!itemsContainer) {
      return;
    }
    var currentItem = instance.currentItem;
    var apiClient = _connectionmanager.default.getApiClient(currentItem);
    var seriesId = currentItem.Id;
    apiClient.getEpisodes(seriesId, {
      SeasonId: seasonId,
      UserId: apiClient.getCurrentUserId(),
      EnableImages: false,
      EnableUserData: false,
      Limit: 1,
      TotalRecordCount: false,
      IsStandaloneSpecial: false
    }).then(function (result) {
      var startItem = result.Items[0];
      if (!startItem) {
        return;
      }
      var index = itemsContainer.indexOfItemId(startItem.Id);
      if (index !== -1) {
        itemsContainer.scrollToIndex(index, {
          offset: '-padding-inline-start'
        }, false);
        return;
      }
      getSeriesEpisodes(instance, {
        EnableTotalRecordCount: false,
        EnableImages: false,
        EnableUserData: false
      }).then(function (totalResult) {
        for (var i = 0, length = totalResult.Items.length; i < length; i++) {
          if (totalResult.Items[i].Id === startItem.Id) {
            itemsContainer.scrollToIndex(i, {
              offset: '-padding-inline-start'
            }, false);
            break;
          }
        }
      });
    });
  }
  function onDetailSelectSeasonChange(e) {
    var instance = this;
    var seasonId = e.target.value;
    if (!seasonId) {
      return;
    }
    scrollEpisodesToSeason(instance, seasonId);
  }
  function getSeasonToSelect(instance, item) {
    var seasons = instance.seasonItems || [];

    // if it's not a special, try to select the tab using the season id because we know that ParentIndexNumber equals SortParentIndexNumber
    if (item.SeasonId && item.ParentIndexNumber !== 0) {
      var season = seasons.filter(function (s) {
        return s.Id === item.SeasonId;
      })[0];
      if (season) {
        return season;
      }
    }
    var seasonNumber = item.SortParentIndexNumber == null ? item.ParentIndexNumber : item.SortParentIndexNumber;

    // if that wasn't found, try by season number
    if (seasonNumber != null) {
      var _season = seasons.filter(function (s) {
        return s.IndexNumber === seasonNumber;
      })[0];
      if (_season) {
        return _season;
      }
    }

    // lastly, try again by season id, no matter the episode type
    if (item.SeasonId) {
      var _season2 = seasons.filter(function (s) {
        return s.Id === item.SeasonId;
      })[0];
      if (_season2) {
        return _season2;
      }
    }
    return null;
  }
  function onSeriesEpisodeFocusedOrScrolled(instance, item) {
    var season = getSeasonToSelect(instance, item);
    if (!season) {
      return;
    }
    var detailSelectSeason = instance.detailSelectSeason;
    if (detailSelectSeason) {
      detailSelectSeason.setValues([season.Id], false, [season]);
    }
    var seasonTabs = instance.seasonTabs;
    if (seasonTabs) {
      var btn = seasonTabs.querySelector('.detailSeasonTab[data-id="' + season.Id + '"]');
      if (btn) {
        seasonTabs.selectedIndex(parseInt(btn.getAttribute('data-index')), false);
      }
    }
  }
  function onSeriesEpisodesHorizontalScroll(e) {
    if (_layoutmanager.default.tv) {
      return;
    }
    var instance = this;
    var scroller = e.currentTarget;
    var padding = scroller.getPadding();
    var scrollLeft = scroller.getScrollLeft() + padding.inlineStart + padding.inlineEnd;
    var scrollSize = scroller.getScrollWidth();
    var scrollPct = Math.min(1, scrollLeft / scrollSize);
    var itemsContainer = scroller.querySelector('.childrenItemsContainer');
    var items = itemsContainer.getItems();
    var index = Math.floor(scrollPct * items.length);

    //console.log('onSeriesEpisodesHorizontalScroll scrollLeft: ' + scrollLeft + ', scrollSize: ' + scrollSize + ', scrollPct: ' + (scrollPct * 100) + ', index: ' + index);

    if (index < items.length) {
      var item = itemsContainer.getItem(index);
      if (item) {
        onSeriesEpisodeFocusedOrScrolled(instance, item);
      }
    }
  }
  function onSeriesEpisodesFocus(e) {
    var instance = this;
    var scroller = e.currentTarget;
    var itemsContainer = scroller.querySelector('.childrenItemsContainer');
    var itemElement = e.target.closest(itemsContainer.getItemSelector());
    var item = itemsContainer.getItemFromElement(itemElement);
    if (item) {
      onSeriesEpisodeFocusedOrScrolled(instance, item);
    }
  }
  function renderSeasonTabs(instance, seasonTabsParent, items) {
    if (!items.length) {
      seasonTabsParent.classList.add('hide');
      seasonTabsParent.innerHTML = '';
      return;
    }
    var index = 0;
    var selectedIndex = -1;
    var indexAttribute = selectedIndex == null ? '' : ' data-index="' + selectedIndex + '"';

    // add classes from emby-tabs now to minimize layout shift later
    var tabsClass = 'emby-tabs seasonTabs-emby-tabs padded-left padded-left-page padded-right';
    var tabsSliderClass = 'emby-tabs-slider scrollSliderX';
    var html = '<div is="emby-tabs"' + indexAttribute + ' class="' + tabsClass + '"><div class="' + tabsSliderClass + '">' + items.map(function (item) {
      // add classes from emby-button now to minimize layout shift later
      var tabClass = 'emby-button emby-tab-button secondaryText detailSeasonTab detailCategoryTab';
      var tabHtml = '<button type="button" is="emby-button" class="' + tabClass + '" data-seasonnumber="' + (item.IndexNumber == null ? 1 : item.IndexNumber) + '" data-id="' + item.Id + '" data-index="' + index + '">' + _textencoding.default.htmlEncode(item.Name) + '</button>';
      index++;
      return tabHtml;
    }).join('') + '</div></div>';
    seasonTabsParent.innerHTML = html;
    seasonTabsParent.classList.remove('hide');
  }
  function onSeasonTabChange(e) {
    var instance = this;
    var seasonTabs = instance.seasonTabs;
    if (!seasonTabs) {
      return;
    }
    var btn = e.detail.selectedTabButton;
    if (!btn) {
      return;
    }
    var id = btn.getAttribute('data-id');
    var seasons = instance.seasonItems || [];
    var season = seasons.filter(function (s) {
      return s.Id === id;
    })[0];
    if (season) {
      scrollEpisodesToSeason(instance, season.Id);
    }
  }
  function initSeriesItemsSection(instance, item, apiClient, signal) {
    var section = instance.view.querySelector('.seriesItemsSection');
    if (item.Type !== "Series") {
      section.classList.add('hide');
      return Promise.resolve();
    }
    return getSeasons.call(instance, {
      EnableUserData: false,
      EnableTotalRecordCount: false,
      EnableImages: false,
      IsSpecialSeason: false
    }, signal).then(function (result) {
      instance.seasonItems = result.Items;
      setScopedFocus(instance.view, section.querySelector('.focusable'), true);
      var itemsContainer = section.querySelector('.itemsContainer');
      itemsContainer.parentContainer = section;
      var seriesDisplay = _usersettings.default.seriesDisplay();
      if (_apiclient.default.isLocalItem(item)) {
        // mainly because the local databases don't support the query options for this
        seriesDisplay = '';
      }
      var hasMultipleSeasons = instance.hasMultipleSeasons = result.Items.length >= 2;
      var renderAllEpisodes = instance.renderAllEpisodes = seriesDisplay === 'episodes' || seriesDisplay === 'episodessingleseason' && !hasMultipleSeasons;
      var renderSeasonsWithTabs = renderAllEpisodes && hasMultipleSeasons && _layoutmanager.default.tv;
      var sectionTitleElement = section.querySelector('.sectionTitle');
      sectionTitleElement.innerHTML = renderAllEpisodes ? result.Items.length === 1 ? result.Items[0].Name : _globalize.default.translate('Episodes') : _globalize.default.translate('Seasons');
      if (renderAllEpisodes && hasMultipleSeasons) {
        sectionTitleElement.classList.add('hide');
      } else {
        sectionTitleElement.classList.remove('hide');
      }
      if (renderAllEpisodes) {
        itemsContainer.setAttribute('data-focusabletype', 'nearest');
      } else {
        itemsContainer.setAttribute('data-focusabletype', 'autofocus');
      }
      var detailSelectSeason = section.querySelector('.detailSelectSeason');
      var detailSelectSeasonContainer = section.querySelector('.detailSelectSeasonContainer');
      if (renderAllEpisodes && hasMultipleSeasons && !renderSeasonsWithTabs) {
        detailSelectSeasonContainer.classList.remove('hide');
      } else {
        detailSelectSeasonContainer.classList.add('hide');
      }
      var seasonTabsParent = section.querySelector('.seasonTabs');
      if (renderAllEpisodes) {
        itemsContainer.classList.add('allEpisodesItemsContainer');
        if (renderSeasonsWithTabs) {
          sectionTitleElement.closest('.sectionTitleContainer').classList.add('hide');
          renderSeasonTabs(instance, seasonTabsParent, result.Items);
          instance.seasonTabs = section.querySelector('.seasonTabs-emby-tabs');
          instance.seasonTabs.addEventListener('tabchange', onSeasonTabChange.bind(instance));
        } else {
          sectionTitleElement.closest('.sectionTitleContainer').classList.remove('hide');
          seasonTabsParent.classList.add('hide');
          seasonTabsParent.innerHTML = '';
          instance.seasonTabs = null;
        }
      } else {
        sectionTitleElement.closest('.sectionTitleContainer').classList.remove('hide');
        seasonTabsParent.innerHTML = '';
        seasonTabsParent.classList.add('hide');
        instance.seasonTabs = null;
      }
      instance.detailSelectSeason = detailSelectSeason;
      if (detailSelectSeason) {
        detailSelectSeason.getItems = getSeasons.bind(instance);
        detailSelectSeason.addEventListener('change', onDetailSelectSeasonChange.bind(instance));
      }
      itemsContainer.fetchData = getSeriesChildrenItems.bind(instance);
      itemsContainer.getListOptions = getSeriesChildrenListOptions.bind(instance);
      if (renderAllEpisodes) {
        itemsContainer.afterRefresh = afterAllEpisodesRefreshed.bind(instance);
        var childrenItemsScroller = instance.view.querySelector('.childrenItemsScroller');
        childrenItemsScroller.addScrollEventListener(onSeriesEpisodesHorizontalScroll.bind(instance), {});
        childrenItemsScroller.addEventListener('focus', onSeriesEpisodesFocus.bind(instance), true);
      }
    });
  }
  function initArtistAlbumsSection(instance, item, apiClient) {
    var section = instance.view.querySelector('.artistAlbumsSection');
    var itemsContainer = section.querySelector('.itemsContainer');
    itemsContainer.parentContainer = section;
    var href = _approuter.default.getRouteUrl('list', {
      serverId: apiClient.serverId(),
      itemTypes: 'MusicAlbum',
      albumArtistId: item.Id
    });
    section.querySelector('.sectionTitleTextButton').href = href;
    itemsContainer.setAttribute('data-virtualscrolllayout', 'horizontal-grid');
    itemsContainer.fetchData = getMusicArtistChildrenItems.bind(instance);
    itemsContainer.getListOptions = getMusicArtistChildrenListOptions;
  }
  function getAppearsOnListsListOptions(items) {
    return {
      renderer: _cardbuilder.default,
      options: {
        shape: 'autooverflow',
        centerText: true,
        fields: ['Name'],
        overlayText: false,
        focusTransformTitleAdjust: true
      },
      virtualScrollLayout: 'horizontal-grid'
    };
  }
  function getAppearsOnListsItems(query) {
    var item = this.currentItem;
    var apiClient = _connectionmanager.default.getApiClient(item);
    query = Object.assign({
      fields: this.getRequestedItemFields() + ',PrimaryImageAspectRatio',
      IncludeItemTypes: 'Playlist,BoxSet',
      Recursive: true,
      SortBy: 'SortName',
      ListItemIds: item.Id
    }, query);
    return apiClient.getItems(apiClient.getCurrentUserId(), query).then(function (result) {
      for (var i = 0, length = result.Items.length; i < length; i++) {
        result.Items[i].ItemIdInList = item.Id;
      }
      return result;
    });
  }
  function getArtistSongsItems(query) {
    var item = this.currentItem;
    var apiClient = _connectionmanager.default.getApiClient(item);
    return apiClient.getItems(apiClient.getCurrentUserId(), Object.assign({
      Recursive: true,
      IncludeItemTypes: 'Audio',
      CollectionTypes: 'music',
      ArtistIds: this.currentItem.Id,
      SortBy: 'PlayCount,SortName',
      SortOrder: 'Descending,Ascending',
      ImageTypeLimit: 1,
      Fields: this.getRequestedItemFields() + ',PrimaryImageAspectRatio'
    }, query));
  }
  function getArtistSongsListOptions(items) {
    if (_layoutmanager.default.tv) {
      return {
        renderer: _cardbuilder.default,
        options: {
          shape: 'auto',
          lines: 2,
          centerText: false,
          fields: ['Name', 'Album'],
          overlayText: false,
          sideFooter: true,
          action: 'play'
        },
        virtualScrollLayout: 'horizontal-grid',
        commandOptions: {
          openArtist: false
        },
        indexOnStartItemId: true
      };
    }
    return {
      renderer: _listview.default,
      options: {
        action: 'playallfromhere',
        verticalWrap: true,
        mediaInfo: false,
        enableSideMediaInfo: false,
        enableUserDataButtons: false,
        fields: ['Name', 'ParentName']
      },
      virtualScrollLayout: 'horizontal-grid',
      commandOptions: {
        openArtist: false
      },
      indexOnStartItemId: true
    };
  }
  function initArtistSongsSection(instance, view, item, apiClient) {
    if (item.Type !== 'MusicArtist') {
      return;
    }
    var headerText = view.querySelector('.artistSongsItemsHeader');
    var href = _approuter.default.getRouteUrl('list', {
      serverId: apiClient.serverId(),
      itemTypes: 'Audio',
      artistId: item.Id
    });
    var headerHtml = '';
    headerHtml = '<a is="emby-sectiontitle" href="' + href + '" class="button-link  button-link-color-inherit sectionTitleTextButton">';
    headerHtml += '<h2 class="sectionTitle sectionTitle-cards">';
    headerHtml += _globalize.default.translate('Songs');
    headerHtml += '</h2>';
    headerHtml += '</a>';
    headerText.innerHTML = headerHtml;
    var artistSongsItemsContainer = view.querySelector('.artistSongsItemsContainer');
    artistSongsItemsContainer.classList.add('generalItemsContainer');
    artistSongsItemsContainer.fetchData = getArtistSongsItems.bind(instance);
    artistSongsItemsContainer.getListOptions = getArtistSongsListOptions;
    artistSongsItemsContainer.parentContainer = artistSongsItemsContainer.closest('.verticalSection');
    if (!_layoutmanager.default.tv) {
      var sectionTitleContainer = artistSongsItemsContainer.parentContainer.querySelector('.sectionTitleContainer');
      sectionTitleContainer.classList.remove('sectionTitleContainer-cards');
      sectionTitleContainer.classList.add('sectionTitleContainer-wrappedlistview');
    }
  }
  function getPeopleListOptions(items) {
    return {
      renderer: _cardbuilder.default,
      options: {
        cardLayout: false,
        centerText: true,
        fields: ['Name', 'PersonRole'],
        cardFooterAside: false,
        showPersonRoleOrType: true,
        multiSelect: false,
        coverImage: true,
        shape: 'portrait',
        draggable: false,
        focusTransformTitleAdjust: true,
        playQueueIndicator: false
      },
      virtualScrollLayout: 'horizontal-grid'
    };
  }
  function getPeopleItemsFn(instance) {
    return function (query) {
      var serverId = instance.currentItem.ServerId;
      var people = (instance.currentItem.People || []).map(function (p) {
        p = Object.assign({}, p);
        p.ServerId = serverId;
        if (p.Type !== 'Person') {
          p.PersonType = p.Type;
          p.Type = 'Person';
        }
        return p;
      });
      var totalRecordCount = people.length;
      if (query) {
        people = people.slice(query.StartIndex || 0);
        if (query.Limit && people.length > query.Limit) {
          people.length = query.Limit;
        }
      }
      return Promise.resolve({
        Items: people,
        TotalRecordCount: totalRecordCount
      });
    };
  }
  function getMoreLikeThisListOptionsFn(instance, item) {
    return function (items) {
      var asDialog = instance.params.asDialog === 'true';
      var fields = ['Name'];
      if (item.Type === "Movie" || item.Type === "Trailer" || item.Type === "Program" || item.Type === "Game" || item.Type === "Series") {
        fields.push('ProductionYear');
      }
      if (item.Type === "MusicAlbum" || item.Type === "Game") {
        fields.push('ParentName');
      }
      if (item.Type === "Program") {
        fields.unshift('ParentName');
      }
      return {
        renderer: _cardbuilder.default,
        options: {
          shape: 'auto',
          lines: item.Type === 'Game' ? 3 : item.Type === "Program" ? 2 : null,
          centerText: true,
          fields: fields,
          overlayText: false,
          multiSelect: item.Type !== 'Program' && item.Type !== 'Timer',
          contextMenu: item.Type !== 'Program' && item.Type !== 'Timer',
          draggable: item.Type !== 'Program' && item.Type !== 'Timer',
          focusTransformTitleAdjust: true,
          action: asDialog ? 'linkdialog' : null
        },
        virtualScrollLayout: 'horizontal-grid'
      };
    };
  }
  function getMoreLikeThisItems() {
    var item = this.currentItem;
    var apiClient = _connectionmanager.default.getApiClient(item);
    var options = {
      Limit: 12,
      UserId: apiClient.getCurrentUserId(),
      ImageTypeLimit: 1,
      Fields: this.getRequestedItemFields() + ',PrimaryImageAspectRatio,ProductionYear,Status,EndDate',
      EnableTotalRecordCount: false
    };
    if (item.Type === 'Program' || item.Type === 'Timer' && item.ProgramId && !item.IsSports) {
      options.GroupProgramsBySeries = true;
    }
    if (item.Type === 'MusicAlbum' && item.AlbumArtists && item.AlbumArtists.length) {
      options.ExcludeArtistIds = item.AlbumArtists[0].Id;
    }
    var itemId = item.Type === 'Timer' ? item.ProgramId : item.Id;
    return apiClient.getSimilarItems(itemId, options);
  }
  function initMoreLikeThisSection(instance, view, item, apiClient) {
    if (!_itemmanager.default.supportsSimilarItems(item)) {
      return;
    }
    var itemsContainer = view.querySelector('.similarItemsContainer');
    itemsContainer.fetchData = getMoreLikeThisItems.bind(instance);
    itemsContainer.parentContainer = itemsContainer.closest('.verticalSection');
    itemsContainer.getListOptions = getMoreLikeThisListOptionsFn(instance, item);
    itemsContainer.classList.add('generalItemsContainer');
  }
  function getMoreLikeThisOnLiveTVListOptions(items) {
    var fields = ['ParentName', 'Name', 'ProductionYear'];
    return {
      renderer: _cardbuilder.default,
      options: {
        shape: 'auto',
        fields: fields,
        centerText: true,
        showDetailsMenu: true,
        overlayText: false,
        lines: 2,
        draggable: false,
        multiSelect: false,
        focusTransformTitleAdjust: true
      },
      virtualScrollLayout: 'horizontal-grid'
    };
  }
  function getMoreLikeThisOnLiveTVItems() {
    var item = this.currentItem;
    var apiClient = _connectionmanager.default.getApiClient(item);
    return apiClient.getSimilarItems(item.Id, {
      userId: apiClient.getCurrentUserId(),
      limit: 12,
      fields: this.getRequestedItemFields() + ',PrimaryImageAspectRatio,ProductionYear',
      IncludeItemTypes: 'Program',
      EnableTotalRecordCount: false,
      GroupProgramsBySeries: true
    });
  }
  function initMoreLikeThisOnLiveTVSection(instance, view, item, apiClient) {
    if (!_itemmanager.default.supportsSimilarItemsOnLiveTV(item, apiClient)) {
      return;
    }
    var itemsContainer = view.querySelector('.similarOnLiveTVItemsContainer');
    itemsContainer.fetchData = getMoreLikeThisOnLiveTVItems.bind(instance);
    itemsContainer.parentContainer = itemsContainer.closest('.verticalSection');
    itemsContainer.getListOptions = getMoreLikeThisOnLiveTVListOptions;
    itemsContainer.classList.add('generalItemsContainer');
  }
  function initPeopleSection(instance, view, item, apiClient) {
    var peopleItemsContainer = view.querySelector('.peopleItemsContainer');
    peopleItemsContainer.fetchData = getPeopleItemsFn(instance);
    peopleItemsContainer.parentContainer = peopleItemsContainer.closest('.verticalSection');
    peopleItemsContainer.getListOptions = getPeopleListOptions;
    peopleItemsContainer.classList.add('generalItemsContainer');
  }
  function initAppearsOnListSection(instance, view, item, apiClient, user) {
    if (!_itemmanager.default.canAddToCollection(item, user) && !_itemmanager.default.canAddToPlaylist(item)) {
      return;
    }
    var itemType = item.Type;
    switch (itemType) {
      case 'Season':
      case 'Person':
      case 'Genre':
      case 'MusicGenre':
      case 'GameGenre':
      case 'BoxSet':
      case 'Playlist':
      case 'Folder':
      case 'CollectionFolder':
      case 'UserView':
      case 'GameSystem':
      case 'Studio':
      case 'PhotoAlbum':
      case 'Program':
      case 'Channel':
      case 'TvChannel':
        return;
      default:
        break;
    }
    var appearsOnListsItemsContainer = view.querySelector('.appearsOnListsItemsContainer');
    appearsOnListsItemsContainer.fetchData = getAppearsOnListsItems.bind(instance);
    appearsOnListsItemsContainer.getListOptions = getAppearsOnListsListOptions;
    appearsOnListsItemsContainer.parentContainer = appearsOnListsItemsContainer.closest('.verticalSection');
    appearsOnListsItemsContainer.classList.add('generalItemsContainer');
  }
  function getUpcomingOnTVItemsFn(query) {
    var item = this.currentItem;
    var apiClient = _connectionmanager.default.getApiClient(item);
    query = Object.assign({
      UserId: apiClient.getCurrentUserId(),
      HasAired: false,
      SortBy: "StartDate",
      ImageTypeLimit: 1,
      EnableImageTypes: "Primary,Thumb,Backdrop",
      EnableUserData: false,
      Fields: 'PrimaryImageAspectRatio,ChannelInfo'
    }, query);
    if (item.Type === 'Program' || item.Type === 'Timer' && item.ProgramId) {
      if (item.AsSeries) {
        query.SeriesFromProgramId = item.Id;
      } else {
        query.ShowingsFromProgramId = item.ProgramId || item.Id;
        query.ExcludeItemIds = item.ProgramId || item.Id;
      }
    } else {
      query.LibrarySeriesId = item.Id;
    }
    return apiClient.getLiveTvPrograms(query);
  }
  function getUpcomingOnTVListOptions(items) {
    var instance = this;
    var fields = ['Name', 'ChannelName', 'AirTime'];
    var asDialog = instance.params.asDialog === 'true';
    return {
      renderer: _cardbuilder.default,
      options: {
        preferThumb: 'auto',
        shape: 'autooverflow',
        fields: fields,
        centerText: true,
        overlayText: false,
        showAirDateTime: true,
        multiSelect: false,
        draggable: false,
        focusTransformTitleAdjust: true,
        action: asDialog ? 'linkdialog' : null,
        playQueueIndicator: false
      },
      virtualScrollLayout: 'horizontal-grid'
    };
  }
  function initUpcomingOnTVSection(instance, view, item, apiClient) {
    if (item.Type !== 'Series' && item.Type !== 'Program' && !(item.Type === 'Timer' && item.ProgramId)) {
      return;
    }
    var itemsContainer = view.querySelector('.seriesScheduleItemsContainer');
    itemsContainer.fetchData = getUpcomingOnTVItemsFn.bind(instance);
    itemsContainer.parentContainer = itemsContainer.closest('.verticalSection');
    itemsContainer.getListOptions = getUpcomingOnTVListOptions.bind(instance);
    itemsContainer.classList.add('generalItemsContainer');
    if (item.Type === 'Program' || item.Type === 'Timer') {
      if (item.AsSeries) {
        itemsContainer.parentContainer.querySelector('.sectionTitle').innerHTML = _globalize.default.translate('Showings');
      } else {
        itemsContainer.parentContainer.querySelector('.sectionTitle').innerHTML = _globalize.default.translate('HeaderOtherShowings');
      }
    }
  }
  function getNextUpItems(query) {
    var item = this.currentItem;
    var apiClient = _connectionmanager.default.getApiClient(item);
    if (item.Type === 'MusicAlbum') {
      return apiClient.getResumableItemsFromAudioBook(Object.assign({
        AlbumId: item.Id,
        Fields: this.getRequestedItemFields() + ',PrimaryImageAspectRatio',
        ImageTypeLimit: 1,
        UserId: apiClient.getCurrentUserId()
      }, query));
    }
    return apiClient.getResumableItemsFromSeries(Object.assign({
      SeriesId: item.Id,
      Fields: this.getRequestedItemFields() + ',PrimaryImageAspectRatio',
      ImageTypeLimit: 1,
      UserId: apiClient.getCurrentUserId()
    }, query));
  }
  function getAdditionalPartsItems() {
    var item = this.currentItem;
    var mediaSourceId = this.view.querySelector('.selectSource').value;
    var mediaSources = this._currentPlaybackMediaSources || [];
    var mediaSource = mediaSources.filter(function (m) {
      return m.Id === mediaSourceId;
    })[0] || {};
    var partCount = mediaSource.PartCount;
    if (partCount == null) {
      partCount = item.PartCount;
    }
    if (!partCount) {
      partCount = 1;
    }
    if (partCount < 2) {
      return Promise.resolve({
        TotalRecordCount: 0,
        Items: []
      });
    }
    var apiClient = _connectionmanager.default.getApiClient(item);
    return apiClient.getAdditionalVideoParts(apiClient.getCurrentUserId(), item.Id, mediaSourceId);
  }
  function getAdditionalPartsListOptions(items) {
    return {
      renderer: _cardbuilder.default,
      options: {
        shape: 'autooverflow',
        scalable: true,
        fields: ['Name', 'Runtime'],
        action: 'playallfromhere',
        centerText: true,
        overlayText: false,
        draggable: false,
        focusTransformTitleAdjust: true
      },
      virtualScrollLayout: 'horizontal-grid'
    };
  }
  function initAdditionalPartsSection(instance, view, item, apiClient) {
    var itemsContainer = view.querySelector('.additionalPartsItemsContainer');
    itemsContainer.fetchData = getAdditionalPartsItems.bind(instance);
    itemsContainer.parentContainer = itemsContainer.closest('.verticalSection');
    itemsContainer.getListOptions = getAdditionalPartsListOptions;
  }
  function refreshAdditionalParts(view) {
    var elem = view.querySelector('.additionalPartsItemsContainer');
    elem.waitForCustomElementUpgrade().then(function () {
      elem.refreshItems();
    });
  }
  function resumeAdditionalPartsItemsContainer(view) {
    var elem = view.querySelector('.additionalPartsItemsContainer');
    elem.waitForCustomElementUpgrade().then(function () {
      elem.resume({});
    });
  }
  function getExtrasItems(query) {
    var item = this.currentItem;
    var apiClient = _connectionmanager.default.getApiClient(item);
    return apiClient.getSpecialFeatures(apiClient.getCurrentUserId(), item.Id, {
      Fields: this.getRequestedItemFields() + ',PrimaryImageAspectRatio'
    }).then(function (items) {
      var totalRecordCount = items.length;
      if (query) {
        items = items.slice(query.StartIndex || 0);
        if (query.Limit && items.length > query.Limit) {
          items.length = query.Limit;
        }
      }
      return {
        Items: items,
        TotalRecordCount: totalRecordCount
      };
    });
  }
  function getExtrasListOptions(items) {
    return {
      renderer: _cardbuilder.default,
      options: {
        shape: 'autooverflow',
        scalable: true,
        fields: ['Name', 'Runtime'],
        centerText: true,
        overlayText: false,
        draggable: false,
        focusTransformTitleAdjust: true
      },
      virtualScrollLayout: 'horizontal-grid'
    };
  }
  function initExtrasSection(instance, view, item, apiClient) {
    if (!_itemhelper.default.supportsExtras(item)) {
      return;
    }
    var itemsContainer = view.querySelector('.extrasItemsContainer');
    itemsContainer.fetchData = getExtrasItems.bind(instance);
    itemsContainer.parentContainer = itemsContainer.closest('.verticalSection');
    itemsContainer.getListOptions = getExtrasListOptions;
    itemsContainer.classList.add('generalItemsContainer');
  }
  function getSpecialsListOptions(items) {
    return {
      renderer: _cardbuilder.default,
      options: {
        shape: 'autooverflow',
        scalable: true,
        fields: ['Name', 'Runtime'],
        centerText: true,
        overlayText: false,
        draggable: false,
        focusTransformTitleAdjust: true,
        enableSpecialEpisodePrefix: false,
        includeIndexNumber: false
      },
      virtualScrollLayout: 'horizontal-grid'
    };
  }
  function getSpecialsItems(query) {
    if (!this.renderAllEpisodes) {
      return Promise.resolve({
        Items: [],
        TotalRecordCount: 0
      });
    }
    return getSeriesEpisodes(this, Object.assign({
      IsSpecialEpisode: true
    }, query));
  }
  function initSpecialsSection(instance, view, item, apiClient) {
    if (item.Type !== 'Series' || !apiClient.isMinServerVersion('4.9.0.39')) {
      return;
    }
    var itemsContainer = view.querySelector('.specialsItemsContainer');
    itemsContainer.fetchData = getSpecialsItems.bind(instance);
    itemsContainer.parentContainer = itemsContainer.closest('.verticalSection');
    itemsContainer.getListOptions = getSpecialsListOptions;
    itemsContainer.classList.add('generalItemsContainer');
  }
  function initLinkedItemsSection(instance, view, item, apiClient) {
    var itemType = item.Type;
    var elem = view.querySelector('.linkedItems');
    switch (itemType) {
      case 'Genre':
      case 'MusicGenre':
      case 'GameGenre':
      case 'Person':
      case 'Studio':
      case 'MusicArtist':
      case 'Tag':
      case 'BoxSet':
      case 'MusicAlbum':
        elem.classList.remove('hide');
        break;
      default:
        elem.classList.remove('add');
        return;
    }
    if (instance._linkedItemsView) {
      return;
    }
    instance._linkedItemsView = new _linkeditems.default(elem, instance.params, {
      item: item,
      apiClient: apiClient,
      requestedItemFields: instance.getRequestedItemFields(),
      requestedImageTypes: instance.getRequestedImageTypes()
    });
  }
  function getProgramGuideItems(query) {
    var item = this.currentItem;
    var apiClient = _connectionmanager.default.getApiClient(item);
    return apiClient.getLiveTvPrograms(Object.assign({
      ChannelIds: item.Id,
      UserId: apiClient.getCurrentUserId(),
      HasAired: false,
      SortBy: "StartDate",
      ImageTypeLimit: 1,
      EnableUserData: false,
      Fields: 'PrimaryImageAspectRatio,Overview'
    }, query));
  }
  function getProgramGuideListOptions(items) {
    var instance = this;
    var asDialog = instance.params.asDialog === 'true';
    var smallerLayout = asDialog && _layoutmanager.default.tv;
    var fields = ['ParentName', 'Name', 'StartToEndDateTime'];
    if (!smallerLayout) {
      fields.push('Overview');
    }
    return {
      renderer: _listview.default,
      options: {
        imageSize: smallerLayout ? 'medium' : 'large',
        enableUserDataButtons: false,
        mediaInfo: false,
        mediaInfoWithTitle: true,
        draggable: false,
        draggableXActions: false,
        multiSelect: false,
        defaultShape: 'portrait',
        fields: fields,
        action: asDialog ? 'linkdialog' : null,
        playQueueIndicator: false
      },
      virtualScrollLayout: 'vertical-grid'
    };
  }
  function initProgramGuideSection(instance, view, item, apiClient) {
    if (item.Type !== 'TvChannel') {
      return;
    }
    var itemsContainer = view.querySelector('.programGuideItemsContainer');
    itemsContainer.fetchData = getProgramGuideItems.bind(instance);
    itemsContainer.parentContainer = itemsContainer.closest('.programGuideSection');
    itemsContainer.getListOptions = getProgramGuideListOptions.bind(instance);
    itemsContainer.classList.add('generalItemsContainer');
  }
  function getSeriesTimerScheduleItems() {
    var item = this.currentItem;
    var apiClient = _connectionmanager.default.getApiClient(item);
    return apiClient.getLiveTvTimers({
      UserId: apiClient.getCurrentUserId(),
      ImageTypeLimit: 1,
      EnableImageTypes: "Primary,Backdrop,Thumb",
      SortBy: "StartDate",
      EnableTotalRecordCount: false,
      EnableUserData: false,
      SeriesTimerId: item.Id,
      Fields: "ChannelInfo,ChannelImage"
    });
  }
  function getSeriesTimerListOptions(items) {
    return {
      renderer: _listview.default,
      options: {
        enableUserDataButtons: false,
        image: true,
        mediaInfo: false,
        imageSize: 'large',
        moreButton: false,
        recordButton: false,
        draggable: false,
        multiSelect: false,
        fields: ['ParentName', 'Name', 'StartToEndDateTime', 'ChannelName', 'Overview'],
        highlight: false,
        playQueueIndicator: false
      },
      virtualScrollLayout: 'vertical-grid'
    };
  }
  function initSeriesTimerScheduleSection(instance, view, item, apiClient) {
    if (item.Type !== 'SeriesTimer') {
      return;
    }
    var itemsContainer = view.querySelector('.seriesTimerScheduleItemsContainer');
    itemsContainer.fetchData = getSeriesTimerScheduleItems.bind(instance);
    itemsContainer.parentContainer = itemsContainer.closest('.verticalSection');
    itemsContainer.getListOptions = getSeriesTimerListOptions;
    itemsContainer.classList.add('generalItemsContainer');
  }
  function enableDetailPoster(instance, item) {
    if (instance.params.asDialog === 'true') {
      return true;
    }
    if (enableTvDetailImageLayout(instance, item)) {
      return _usersettings.default.showDetailPoster(_layoutmanager.default.tv);
    }
    return true;
  }
  function getDetailImageItems() {
    var item = this.currentItem;
    var items = [];
    if (item) {
      if (enableDetailPoster(this, item)) {
        items.push(item);
      }
    }
    return Promise.resolve({
      Items: items,
      TotalRecordCount: items.length
    });
  }
  function getDetailImageListOptionsFn(itemType, cardClass, imageContainerClassName) {
    imageContainerClassName = imageContainerClassName.split(' ').filter(function (c) {
      return c.includes('detailImage');
    }).join(' ');
    var cardBoxClass = 'detailImageContainerCard-cardBox';
    if (imageContainerClassName.includes('detailImageContainer-side')) {
      imageContainerClassName += ' item-fixed-side';
      cardBoxClass += ' detailImageContainerCard-side-cardBox';
    }
    imageContainerClassName += ' imageWidthTest';
    return function (items) {
      return {
        renderer: _cardbuilder.default,
        options: {
          overlayText: true,
          fields: [],
          action: 'none',
          imageClass: "detailImage",
          imageWidthTestClass: imageContainerClassName,
          multiSelect: false,
          contextMenu: false,
          ratingButton: false,
          playedButton: false,
          cardClass: cardClass,
          cardBoxClass: cardBoxClass,
          defaultIcon: true,
          typeIndicator: false,
          playedIndicator: false,
          downloadButton: false,
          syncIndicator: false,
          timerIndicator: false,
          randomDefaultBackground: false,
          staticElement: true,
          progress: itemType === 'Program' || itemType === 'Timer',
          enableUserData: false,
          draggable: false,
          // prevents touchzoom
          moreButton: false,
          programIndicators: false,
          keepImageAnimation: true,
          playQueueIndicator: false
        },
        virtualScrollLayout: 'vertical-grid'
      };
    };
  }
  function enableTvDetailImageLayout(instance, item) {
    if (instance.params.asDialog === 'true') {
      return false;
    }
    switch (item.Type) {
      //case 'Timer':
      //case 'SeriesTimer':
      case 'Series':
      case 'Season':
      case 'Audio':
      case 'Program':
        return true;
      case 'BoxSet':
      case 'TvChannel':
      case 'Playlist':
      case 'MusicAlbum':
      case 'MusicArtist':
      case 'MusicGenre':
        return false;
      default:
        break;
    }
    switch (item.MediaType) {
      case 'Video':
      case 'Photo':
      case 'Game':
      case 'Book':
        return true;
      default:
        break;
    }
    return false;
  }
  function afterDetailImageRefreshed() {
    var detailImageElement = this.querySelector('.detailImage');
    if (!detailImageElement) {
      return;
    }
    if (this.querySelector('.cardImageIcon')) {
      detailImageElement.classList.remove('detailImage-transparent');
    } else {
      detailImageElement.classList.add('detailImage-transparent');
    }
  }
  function initDetailImage(instance, view, item, apiClient) {
    var itemsContainer = getDetailImageContainer(view, item);
    var detailImage = itemsContainer;
    var cardClass = 'detailImageContainerCard';
    var detailImageContainerMain = view.querySelector('.detailImageContainer-main');
    if (!enableTrackList(item)) {
      if (item.Type === 'Person' || item.Type === 'BoxSet' || item.Type === 'Season' || item.Type === 'TvChannel' || item.Type === 'Playlist' || item.Type === 'MusicGenre') {
        detailImage.classList.add('detailImageContainer-small');
      }
    }
    if (_layoutmanager.default.tv) {
      detailImageContainerMain.classList.add('detailImageContainer-main-tv');
    } else {
      detailImageContainerMain.classList.remove('detailImageContainer-main-tv');
    }
    if (enableItemBackdropAsTopImage(item)) {
      detailImageContainerMain.classList.add('detailImageContainer-hidemobile');
    } else {
      detailImageContainerMain.classList.remove('detailImageContainer-hidemobile');
    }
    var shape = _imagehelper.default.getShape([item], {});
    detailImage.classList.remove('detailImageContainer-backdrop', 'detailImageContainer-square', 'detailImageContainer-portrait', 'detailImageContainer-fourThree', 'detailImageContainer-banner');
    if (shape) {
      detailImage.classList.add('detailImageContainer-' + shape);
    }
    itemsContainer.fetchData = getDetailImageItems.bind(instance);
    itemsContainer.parentContainer = itemsContainer;
    itemsContainer.getListOptions = getDetailImageListOptionsFn(item.Type, cardClass, detailImage.className);
    itemsContainer.afterRefresh = afterDetailImageRefreshed;
    itemsContainer.classList.add('generalItemsContainer');

    // do this early to prevent an ugly flash
    if (!enableDetailPoster(instance, item)) {
      itemsContainer.classList.add('hide');
    }
  }
  function getChaptersFromMarkerList(chapters) {
    return chapters;
  }
  function getChaptersForDisplay(chapters) {
    var list = [];
    for (var i = 0, length = chapters.length; i < length; i++) {
      var chapter = chapters[i];
      if (!chapter.MarkerType || chapter.MarkerType === 'Chapter') {
        list.push(chapter);
      }
    }
    return list;
  }
  function getChapterItems(query) {
    var item = this.currentItem;
    var mediaSourceId = this.view.querySelector('.selectSource').value;
    var mediaSources = this._currentPlaybackMediaSources || [];
    var mediaSource = mediaSources.filter(function (m) {
      return m.Id === mediaSourceId;
    })[0] || {};
    var chapters = getChaptersFromMarkerList((mediaSource == null ? void 0 : mediaSource.Chapters) || item.Chapters || []);

    // If there are no chapter images, don't show a bunch of empty tiles
    if (chapters.length && item.MediaType === 'Video' && !chapters[0].ImageTag) {
      chapters = [];
    }
    var mediaStreams = mediaSource.MediaStreams || [];
    var videoStream = mediaStreams.filter(function (i) {
      return i.Type === 'Video';
    })[0] || {};
    var aspect = null;
    if (videoStream.Width && videoStream.Height) {
      aspect = videoStream.Width / videoStream.Height;
    }
    for (var i = 0, length = chapters.length; i < length; i++) {
      var chapter = chapters[i];
      chapter.ServerId = item.ServerId;
      chapter.MediaType = item.MediaType;
      chapter.PrimaryImageAspectRatio = aspect;
      if (chapter.ItemId == null) {
        chapter.ItemId = item.Id;
      }
      chapter.MediaSourceId = mediaSource.Id;
      chapter.Type = 'Chapter';
      chapter.Id = 'chapter_' + chapter.ItemId + '_' + chapter.StartPositionTicks;
      if (chapter.ChapterIndex == null) {
        chapter.ChapterIndex = i;
      }

      // these are for the episode spoiler feature
      chapter.ParentThumbImageTag = item.ParentThumbImageTag;
      chapter.ParentThumbItemId = item.ParentThumbItemId;
      chapter.UserData = item.UserData;
      chapter.ItemType = item.Type;
    }
    chapters = getChaptersForDisplay(chapters);
    var totalItems = chapters.length;
    if (query) {
      chapters = chapters.slice(query.StartIndex || 0);
      if (query.Limit && chapters.length > query.Limit) {
        chapters.length = query.Limit;
      }
    }
    return Promise.resolve({
      Items: chapters,
      TotalRecordCount: totalItems
    });
  }
  function getChaptersCardOptions(items) {
    return {
      renderer: _cardbuilder.default,
      options: {
        shape: 'autooverflow',
        centerText: true,
        overlayText: false,
        fields: ['Name', 'ChapterTime'],
        multiSelect: false,
        contextMenu: false,
        action: 'play',
        draggable: false,
        background: 'black',
        focusTransformTitleAdjust: true,
        hideEpisodeSpoilerInfo: _usersettings.default.hideEpisodeSpoilerInfo()
      },
      virtualScrollLayout: 'horizontal-grid'
    };
  }
  function getChaptersListViewOptions(items) {
    return {
      renderer: _listview.default,
      options: {
        action: 'play',
        multiSelect: false,
        contextMenu: false,
        imagePlayButton: !_layoutmanager.default.tv,
        mediaInfo: false,
        enableSideMediaInfo: false,
        enableUserDataButtons: false,
        fields: ['Name', 'ChapterTime']
      }
    };
  }
  function initChaptersSection(instance, view, item, apiClient) {
    var section = view.querySelector('.chaptersSection');
    var html = '';
    if (item.MediaType === 'Audio') {
      html += '<div is="emby-itemscontainer" class="focuscontainer-x trackList-marginleftcards itemsContainer chaptersItemsContainer vertical-list padded-left padded-left-page padded-right"></div>';
      section.classList.remove('verticalSection-cards');
      section.classList.add('verticalSection-extrabottompadding');
      var sectionTitleContainer = section.querySelector('.sectionTitleContainer');
      sectionTitleContainer.classList.add('trackList-marginleftcards');
      sectionTitleContainer.classList.remove('sectionTitleContainer-cards');
      var sectionTitle = section.querySelector('.sectionTitle');
      sectionTitle.classList.remove('sectionTitle-cards');
    } else {
      html += '<div is="emby-scroller" class="emby-scroller padded-top-focusscale padded-bottom-focusscale padded-left padded-left-page padded-right" data-mousewheel="false" data-focusscroll="true" data-horizontal="true">';
      html += '<div is="emby-itemscontainer" class="scrollSlider focuscontainer-x itemsContainer chaptersItemsContainer focusable" data-focusabletype="nearest" data-virtualscrolllayout="horizontal-grid"></div>';
      html += '</div>';
    }
    section.insertAdjacentHTML('beforeend', html);
    var itemsContainer = view.querySelector('.chaptersItemsContainer');
    itemsContainer.fetchData = getChapterItems.bind(instance);
    itemsContainer.parentContainer = itemsContainer.closest('.verticalSection');
    if (item.MediaType === 'Audio') {
      itemsContainer.getListOptions = getChaptersListViewOptions;
    } else {
      itemsContainer.getListOptions = getChaptersCardOptions;
    }
  }
  function getMoreFromSeasonItems(query) {
    var item = this.currentItem;
    if (!item.SeasonId || !item.SeriesId) {
      return Promise.resolve({
        TotalRecordCount: 0,
        Items: []
      });
    }
    var apiClient = _connectionmanager.default.getApiClient(item);
    query = Object.assign({
      SeasonId: item.SeasonId,
      UserId: apiClient.getCurrentUserId(),
      Fields: this.getRequestedItemFields() + ',PrimaryImageAspectRatio'
    }, query);
    return apiClient.getEpisodes(item.SeriesId, query).then(function (result) {
      if (!query.StartIndex && result.Items.length < 2) {
        return Promise.resolve({
          TotalRecordCount: 0,
          Items: []
        });
      }
      return result;
    });
  }
  function getMoreFromSeasonListOptions(items) {
    return {
      renderer: _cardbuilder.default,
      options: {
        shape: 'auto',
        scalable: true,
        fields: ['Name'],
        overlayText: false,
        centerText: true,
        includeParentInfoInTitle: false,
        focusTransformTitleAdjust: true
      },
      virtualScrollLayout: 'horizontal-grid'
    };
  }
  function afterMoreFromSeasonRefreshed(totalResult) {
    if (!totalResult.Items.length) {
      return;
    }
    var item = this.currentItem;
    if (!item) {
      return;
    }
    var view = this.view;
    if (!view) {
      return;
    }
    var itemsContainer = view.querySelector('.moreFromSeasonItemsContainer');
    if (!itemsContainer) {
      return;
    }
    var index = itemsContainer.indexOfItemId(item.Id);
    if (index !== -1) {
      itemsContainer.scrollToIndex(Math.min(index + 1, totalResult.TotalRecordCount - 1), {
        behavior: 'instant',
        offset: '-padding-inline-start'
      }, false);
      return;
    }
    var apiClient = _connectionmanager.default.getApiClient(item);
    var query = {
      SeasonId: item.SeasonId,
      UserId: apiClient.getCurrentUserId(),
      Fields: this.getRequestedItemFields() + ',PrimaryImageAspectRatio',
      Limit: 0,
      StartItemId: item.Id
    };
    return apiClient.getEpisodes(item.SeriesId, query).then(function (result) {
      index = Math.max(totalResult.TotalRecordCount - result.TotalRecordCount, 0);
      itemsContainer.scrollToIndex(Math.min(index + 1, totalResult.TotalRecordCount - 1), {
        behavior: 'instant',
        offset: '-padding-inline-start'
      }, false);
    });
  }
  function initMoreFromSeasonSection(instance, view, item, apiClient) {
    if (item.Type !== 'Episode') {
      return;
    }
    var itemsContainer = view.querySelector('.moreFromSeasonItemsContainer');
    var section = itemsContainer.closest('.verticalSection');
    section.querySelector('h2').innerHTML = _globalize.default.translate('MoreFromValue', item.SeasonName);
    itemsContainer.fetchData = getMoreFromSeasonItems.bind(instance);
    itemsContainer.parentContainer = section;
    itemsContainer.getListOptions = getMoreFromSeasonListOptions;
    itemsContainer.afterRefresh = afterMoreFromSeasonRefreshed.bind(instance);
    itemsContainer.classList.add('generalItemsContainer');
  }
  function getMoreFromArtistItems(query) {
    var item = this.currentItem;
    if (item.Type === 'MusicAlbum' && !item.AlbumArtists && !item.AlbumArtists.length) {
      return Promise.resolve({
        TotalRecordCount: 0,
        Items: []
      });
    }
    query = Object.assign({
      IncludeItemTypes: "MusicAlbum",
      Recursive: true,
      SortBy: 'ProductionYear,PremiereDate,SortName',
      SortOrder: 'Descending,Descending,Ascending',
      Fields: this.getRequestedItemFields() + ',PrimaryImageAspectRatio,ProductionYear'
    }, query);
    var apiClient = _connectionmanager.default.getApiClient(item);
    if (item.Type === 'MusicArtist') {
      query.ContributingArtistIds = item.Id;
    } else {
      query.AlbumArtistIds = item.AlbumArtists[0].Id;
      query.ExcludeItemIds = item.Id;
    }
    return apiClient.getItems(apiClient.getCurrentUserId(), query);
  }
  function getAlbumsAsComposerItems(query) {
    var item = this.currentItem;
    query = Object.assign({
      IncludeItemTypes: "MusicAlbum",
      Recursive: true,
      SortBy: 'ProductionYear,PremiereDate,SortName',
      SortOrder: 'Descending,Descending,Ascending',
      Fields: this.getRequestedItemFields() + ',PrimaryImageAspectRatio,ProductionYear'
    }, query);
    var apiClient = _connectionmanager.default.getApiClient(item);
    query.ComposerArtistIds = item.Id;
    return apiClient.getItems(apiClient.getCurrentUserId(), query);
  }
  function getMoreFromArtistListOptions(items) {
    var fields = ['Name', 'ProductionYear'];
    return {
      renderer: _cardbuilder.default,
      options: {
        shape: 'auto',
        scalable: true,
        fields: fields,
        centerText: true,
        overlayText: false,
        focusTransformTitleAdjust: true
      },
      virtualScrollLayout: 'horizontal-grid'
    };
  }
  function initMoreFromArtistSection(instance, view, item, apiClient) {
    if (item.Type !== 'MusicArtist' && item.Type !== 'MusicAlbum') {
      return;
    }
    var itemsContainer = view.querySelector('.moreFromArtistItemsContainer');
    var section = itemsContainer.closest('.verticalSection');
    if (item.Type === 'MusicArtist') {
      section.querySelector('.sectionTitle').innerHTML = _globalize.default.translate('HeaderAlbumsAsContributingArtist');
    } else {
      section.querySelector('.sectionTitle').innerHTML = _globalize.default.translate('MoreFromValue', _textencoding.default.htmlEncode(item.AlbumArtists[0].Name));
    }
    itemsContainer.fetchData = getMoreFromArtistItems.bind(instance);
    itemsContainer.parentContainer = section;
    itemsContainer.getListOptions = getMoreFromArtistListOptions;
    itemsContainer.classList.add('generalItemsContainer');
  }
  function initAlbumsAsComposerSection(instance, view, item, apiClient) {
    if (item.Type !== 'MusicArtist') {
      return;
    }
    if (!apiClient.isMinServerVersion('4.9.0.42')) {
      return;
    }
    var itemsContainer = view.querySelector('.albumsAsComposerItemsContainer');
    var section = itemsContainer.closest('.verticalSection');
    itemsContainer.fetchData = getAlbumsAsComposerItems.bind(instance);
    itemsContainer.parentContainer = section;
    itemsContainer.getListOptions = getMoreFromArtistListOptions;
    itemsContainer.classList.add('generalItemsContainer');
  }
  function focusFirstUnWatched(element) {
    var items = element.getItems();
    var focusItem = items.filter(function (i) {
      // Seeing UserData null for downloaded items but need to find out why
      return !i.UserData || !i.UserData.Played;
    })[0];

    // If none then focus the first
    if (!focusItem) {
      focusItem = items[0];
    }
    if (focusItem) {
      var index = element.indexOfItemId(focusItem.Id);
      if (index !== -1) {
        element.scrollToIndex(index, {}, true);
        return true;
      }
    }
    return false;
  }
  function pauseContainers(view) {
    var containers = view.querySelectorAll('.generalItemsContainer');
    for (var i = 0, length = containers.length; i < length; i++) {
      containers[i].pause();
    }
    var chaptersItemsContainer = view.querySelector('.chaptersItemsContainer');
    chaptersItemsContainer == null || chaptersItemsContainer.pause();
  }
  function resumeContainers(view, refreshData) {
    var containers = view.querySelectorAll('.generalItemsContainer');
    for (var i = 0, length = containers.length; i < length; i++) {
      containers[i].resume({
        refresh: refreshData
      });
    }
  }
  function onPromiseFailure() {
    // catch and prevent crash on uwp
  }
  function insertTextFields(instance) {
    if (instance.textFieldsMoved) {
      return;
    }
    instance.textFieldsMoved = true;
    var view = instance.view;
    var elems = view.querySelectorAll('.detailText-moveup');
    var forceMoveUp = _layoutmanager.default.tv;
    for (var i = 0, length = elems.length; i < length; i++) {
      var elem = elems[i];
      if (forceMoveUp) {
        elem.classList.add('detailText-moveup-force');
      }
    }
  }
  function reloadItem(instance, reloadAllData, restartDataLoad, signal) {
    if (reloadAllData) {
      if (!instance.dataPromise || restartDataLoad !== false) {
        startDataLoad(instance, signal);
      }
      // Commenting this out for now because the loading spinner can come up if a refresh occurs during video playback
      //if (!currentItem) {
      //    loading.show();
      //}
    }
    instance.dataPromise.then(function (responses) {
      var item = responses[0];
      var user = responses[1];
      var apiClient = _connectionmanager.default.getApiClient(item.ServerId);
      var view = instance.view;
      signal == null || signal.throwIfAborted();
      resumeContainers(view, reloadAllData);
      if (instance._linkedItemsView) {
        instance._linkedItemsView.resume({
          refresh: reloadAllData,
          refreshSections: reloadAllData,
          item: item,
          signal: signal
        });
      }
      if (item.Type === 'Season') {
        var trackList = view.querySelector('.trackList');
        if (trackList) {
          trackList.resume({
            refresh: reloadAllData
          }).then(function () {
            if (!focusFirstUnWatched(trackList)) {
              instance.autoFocus({
                skipIfNotEnabled: true
              });
            }
          });
        }
      }
      if (reloadAllData) {
        renderSeriesTimerEditor(view, item, user, apiClient);
        renderTimerEditor(instance, view, item, user, apiClient);
        view.querySelector('.audioVideoMediaInfo').classList.remove('mediainfo-forcehide');
        view.querySelector('.details-additionalContent').classList.remove('hide');
        instance.autoFocus();
      }
      if (instance.params.asDialog !== 'true') {
        dispatchItemShowEvent(instance, 'itemshow', item, signal);
      }
      _loading.default.hide();
    }, onPromiseFailure);
  }
  function addClass(elems, className) {
    for (var i = 0, length = elems.length; i < length; i++) {
      elems[i].classList.add(className);
    }
  }
  function setScopedFocus(view, query, enabled, type) {
    var elem = typeof query === 'string' ? view.querySelector(query) : query;
    if (enabled) {
      elem.classList.add('focusable');
      elem.setAttribute('data-focusabletype', type || 'autofocus');
    } else {
      elem.classList.remove('focusable');
      elem.removeAttribute('data-focusabletype');
    }
  }
  function updateTrackSelectionsVisibilityAndFocus(instance, view) {
    var elem = instance.trackSelectionsContainer;
    var isEnabled = elem.querySelector('.selectContainer:not(.hide)');
    if (isEnabled) {
      elem.classList.remove('hide');
    } else {
      elem.classList.add('hide');
    }
    var isFocusable = isEnabled && elem.querySelector('.selectContainer:not(.hide) select:not([disabled])');

    // use nearest because it can wrap
    // https://emby.media/community/index.php?/topic/139113-item-details-screen-button-presses-are-unintuitive-and-inconvenient/
    setScopedFocus(view, elem, isFocusable, 'nearest');
  }
  function onDetailMainContainerFocus(e) {
    if (!_layoutmanager.default.tv) {
      return;
    }
    var target = e.target;
    if (!target.closest('.btnReadMore,.recordingEditor,.btnOverviewText')) {
      this.view.scrollToBeginning();
    }
  }
  function onManualRecordingClicked(e) {
    executeCommandWithCommandProcessor('record', this.currentItem, {
      positionTo: e.target
    });
  }
  var drawerElement = document.querySelector('.mainDrawer');
  function onNavDrawerStateChange(e, drawerState) {
    if (this.params.asDialog !== 'true') {
      if (drawerState >= 2 && _backdrop.default.hasBackdrop()) {
        drawerElement.classList.add('darkContentContainer');
      } else {
        drawerElement.classList.remove('darkContentContainer');
      }
    }
  }
  function ItemPage(view, params) {
    _baseview.default.apply(this, arguments);
    this.params = params;
    this.playerChangeFn = onPlayerChange.bind(this);
    this.playbackStopFn = onPlaybackStop.bind(this);
    this.onNavDrawerStateChangeFn = onNavDrawerStateChange.bind(this);
    this.topDetailsContainer = view.querySelector('.topDetailsContainer');
    this.mainSection = view.querySelector('.detailMainContainer');
    this.trackSelectionsContainer = view.querySelector('.trackSelections');
    if (!_layoutmanager.default.tv) {
      addClass(view.querySelectorAll('.detailTextContainer'), 'details-largefont');
      addClass(view.querySelectorAll('.reduce-font-size-tv'), 'reduce-font-size-mobile');
    } else {
      addClass(view.querySelectorAll('.reduce-font-size-tv'), 'reduce-font-size');
    }
    this.trackSelectionsContainer.addEventListener('submit', onTrackSelectionsSubmit);
    bindAll(view, '.btnPlay', 'click', onPlayClick.bind(this));
    bindAll(view, '.btnResume', 'click', onPlayClick.bind(this));
    bindAll(view, '.btnShuffle', 'click', onShuffleClick.bind(this));
    bindAll(view, '.btnPlayTrailer', 'click', onPlayTrailerClick.bind(this));
    bindAll(view, '.btnCancelSeriesTimer', 'click', onCancelSeriesTimerClick.bind(this));
    bindAll(view, '.btnCancelTimer', 'click', onCancelTimerClick.bind(this));
    bindAll(view, '.btnDeleteItem', 'click', onDeleteClick.bind(this));
    bindAll(view, '.btnSyncDownload', 'download', onDownloadChange.bind(this));
    bindAll(view, '.btnSyncDownload', 'download-cancel', onDownloadChange.bind(this));
    bindAll(view, '.btnMoreCommands', 'click', onMoreCommandsClick.bind(this));
    bindAll(view, '.btnSortItems', 'click', onSortItemsClick.bind(this));
    bindAll(view, '.btnGroupBy', 'click', onGroupByClick.bind(this));
    bindAll(view, '.btnManageSeriesRecording', 'click', onManageSeriesRecordingClick.bind(this));
    bindAll(view, '.btnManageRecording', 'click', onManageRecordingClick.bind(this));
    this.mainSection.addEventListener('focus', onDetailMainContainerFocus.bind(this), true);
    bindAll(view, '.btnSplitVersions', 'click', onSplitVersionsClick.bind(this));
    bindAll(view, '.btnReadMore', 'click', onReadMoreClick.bind(this));
    bindAll(view, '.btnOverviewText', 'click', onReadMoreClick.bind(this));
    var instance = this;
    view.querySelector('.selectSource').addEventListener('change', function () {
      renderMediaInfo(instance, view, instance.currentItem, instance._currentPlaybackMediaSources, _connectionmanager.default.getApiClient(instance.currentItem));
      renderVideoSelections(view, instance._currentPlaybackMediaSources);
      renderAudioSelections(view, instance._currentPlaybackMediaSources);
      renderSubtitleSelections(view, instance._currentPlaybackMediaSources);
      updateTrackSelectionsVisibilityAndFocus(instance, view);
      refreshChapters(view);
      refreshAdditionalParts(view);
    });
    view.querySelector('.btnManualRecording').addEventListener('click', onManualRecordingClicked.bind(this));
    this.onUserDataChangedFn = onUserDataChanged.bind(this);
    this.onLibraryChangedFn = onLibraryChanged.bind(this);
    this.onTimerCancelledFn = onTimerCancelled.bind(this);
    _events.default.on(_navdrawer.default, 'drawer-state-change', this.onNavDrawerStateChangeFn);
    var onLibraryChangedFn = this.onLibraryChangedFn;
    if (onLibraryChangedFn) {
      _events.default.on(_api.default, 'LibraryChanged', onLibraryChangedFn);
    }
    var onUserDataChangedFn = this.onUserDataChangedFn;
    if (onUserDataChangedFn) {
      _events.default.on(_api.default, 'UserDataChanged', onUserDataChangedFn);
    }
    var onTimerCancelledFn = this.onTimerCancelledFn;
    if (onTimerCancelledFn) {
      _events.default.on(_api.default, 'TimerCancelled', onTimerCancelledFn);
    }
    if (params.asDialog === 'true') {
      var paddedTopPageElem = view.querySelector('.padded-top-page');
      paddedTopPageElem.classList.add('padded-top-page-item-dialog');
      var blurAttribute = _layoutmanager.default.tv ? '' : ' data-blur="true"';
      view.querySelector('.scrollSlider').insertAdjacentHTML('afterbegin', '<button type="button"' + blurAttribute + ' is="emby-dialogclosebutton" class="dialogCloseButton-positionstart" style="top:1em;z-index:1;"></button>');
    }
  }
  Object.assign(ItemPage.prototype, _baseview.default.prototype);
  ItemPage.prototype.onInputCommand = function (e) {
    var command = e.detail.command;
    switch (command) {
      case 'play':
        playCurrentItem(this, 'resume');
        e.preventDefault();
        e.stopPropagation();
        return;
      case 'delete':
        onDeleteClick.call(this);
        e.preventDefault();
        e.stopPropagation();
        return;
      case 'record':
        executeCommandWithCommandProcessor(command, this.currentItem, {
          positionTo: e.target
        });
        e.preventDefault();
        e.stopPropagation();
        return;
      default:
        break;
    }
    _baseview.default.prototype.onInputCommand.apply(this, arguments);
  };
  ItemPage.prototype.autoFocusMainSection = function (options) {
    var view = this.view;
    var btns = view.querySelectorAll('.detailButton');
    for (var i = 0, length = btns.length; i < length; i++) {
      var btn = btns[i];
      if (_focusmanager.default.isCurrentlyFocusable(btn)) {
        try {
          _focusmanager.default.focus(btn);
          return btn;
        } catch (err) {}
      }
    }
    return null;
  };
  ItemPage.prototype.autoFocus = function (options) {
    var result = this.autoFocusMainSection(options);
    if (result) {
      return result;
    }
    return _baseview.default.prototype.onBeginResume.apply(this, arguments);
  };
  ItemPage.prototype.onBeginResume = function (options) {
    _baseview.default.prototype.onBeginResume.apply(this, arguments);
    if (this.params.asDialog !== 'true') {
      if (_layoutmanager.default.tv) {
        skinHeader.classList.add('detailHeader-noIcons');
      } else {
        skinHeader.classList.remove('detailHeader-noIcons');
      }
    }
    startDataLoad(this, options.signal);
  };
  function dispatchItemShowEvent(instance, eventName, item, signal) {
    // prevent this from firing on normal data refreshes
    if (instance.itemShowDispatched) {
      return;
    }
    instance.itemShowDispatched = true;
    var view = instance.view;
    view.dispatchEvent(new CustomEvent(eventName, {
      detail: {
        item: item,
        signal: signal
      },
      bubbles: true,
      cancelable: false
    }));
  }
  ItemPage.prototype.onResume = function (options) {
    if (this.showItemOnResume) {
      var newItem = this.showItemOnResume;
      _approuter.default.replaceState(_approuter.default.getRouteUrl(newItem, {}), true);
      this.showItemOnResume = null;
    }
    _baseview.default.prototype.onResume.apply(this, arguments);
    this.itemShowDispatched = null;
    var view = this.view;
    var onPlayerChangeFn = this.playerChangeFn;
    if (onPlayerChangeFn) {
      _events.default.on(_playbackmanager.default, 'playerchange', onPlayerChangeFn);
    }
    var playbackStopFn = this.playbackStopFn;
    if (playbackStopFn) {
      _events.default.on(_playbackmanager.default, 'playbackstop', playbackStopFn);
    }
    var refresh = options.refresh || this._fullReloadOnResume;
    this._fullReloadOnResume = false;
    reloadItem(this, refresh, false, options.signal);
    if (!refresh) {
      var currentItem = this.currentItem;
      renderTrackSelectionsWithoutUser(view, this, currentItem, true);
      setTrailerButtonVisibility(view, currentItem);
    }
    this._fullReloadOnResume = false;
    this.updateDrawerState();
  };
  ItemPage.prototype.updateDrawerState = function () {
    onNavDrawerStateChange.call(this, {}, _navdrawer.default.drawerState);
  };
  ItemPage.prototype.onPause = function (options) {
    _baseview.default.prototype.onPause.apply(this, arguments);
    if (this.params.asDialog !== 'true') {
      var _options$newViewInfo;
      if (!((_options$newViewInfo = options.newViewInfo) != null && _options$newViewInfo.view.classList.contains('itemView'))) {
        backgroundContainer.classList.remove('itemBackgroundContainer', 'itemBackgroundContainer-transparent', 'itemBackgroundContainer-preventbackdrop');
        backdropContainer.classList.remove('backdropContainer-preventbackdrop');
        skinHeader.classList.remove('detailHeader-noIcons');
      }
    }
    var onPlayerChangeFn = this.playerChangeFn;
    if (onPlayerChangeFn) {
      _events.default.off(_playbackmanager.default, 'playerchange', onPlayerChangeFn);
    }
    var playbackStopFn = this.playbackStopFn;
    if (playbackStopFn) {
      _events.default.off(_playbackmanager.default, 'playbackstopped', playbackStopFn);
    }
    var onNavDrawerStateChangeFn = this.onNavDrawerStateChangeFn;
    if (onNavDrawerStateChangeFn) {
      _events.default.off(_navdrawer.default, 'drawer-state-change', this.onNavDrawerStateChangeFn);
    }
    pauseContainers(this.view);
    if (this.params.asDialog !== 'true') {
      var _options$newViewInfo2;
      if (!((_options$newViewInfo2 = options.newViewInfo) != null && _options$newViewInfo2.view.classList.contains('itemView'))) {
        drawerElement.classList.remove('darkContentContainer');
      }
    }
    if (this._linkedItemsView) {
      this._linkedItemsView.pause();
    }
    if (this.recordingEditor) {
      this.recordingEditor.pause();
    }
  };
  ItemPage.prototype.enableTransitions = function () {
    return true;
  };
  ItemPage.prototype.destroy = function () {
    var onLibraryChangedFn = this.onLibraryChangedFn;
    if (onLibraryChangedFn) {
      _events.default.off(_api.default, 'LibraryChanged', onLibraryChangedFn);
    }
    this.onLibraryChangedFn = null;
    var onUserDataChangedFn = this.onUserDataChangedFn;
    if (onUserDataChangedFn) {
      _events.default.off(_api.default, 'UserDataChanged', onUserDataChangedFn);
    }
    this.onUserDataChangedFn = null;
    var onTimerCancelledFn = this.onTimerCancelledFn;
    if (onTimerCancelledFn) {
      _events.default.off(_api.default, 'TimerCancelled', onTimerCancelledFn);
    }
    this.onTimerCancelledFn = null;
    _baseview.default.prototype.destroy.apply(this, arguments);
    this.onNavDrawerStateChangeFn = null;
    this.playerChangeFn = null;
    this.playbackStopFn = null;
    this.currentItem = null;
    this._currentPlaybackMediaSources = null;
    if (this.currentRecordingFields) {
      this.currentRecordingFields.destroy();
      this.currentRecordingFields = null;
    }
    if (this.recordingEditor) {
      this.recordingEditor.destroy();
      this.recordingEditor = null;
    }
    if (this._linkedItemsView) {
      this._linkedItemsView.destroy();
      this._linkedItemsView = null;
    }
    this.topDetailsContainer = null;
    this.mainSection = null;
    this.trackSelectionsContainer = null;
    this.detailSelectSeason = null;
    this.seasonTabs = null;
    this.seasonItems = null;
    this.params = null;
    this.dataPromise = null;
  };
  var _default = _exports.default = ItemPage;
});
