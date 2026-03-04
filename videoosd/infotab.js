define(["exports", "./basetab.js", "./../modules/common/itemmanager/itemmanager.js", "./../modules/mediainfo/mediainfo.js", "./../modules/cardbuilder/cardbuilder.js", "./../modules/dom.js", "./../modules/common/playback/playbackmanager.js", "./../modules/common/globalize.js", "./../modules/layoutmanager.js"], function (_exports, _basetab, _itemmanager, _mediainfo, _cardbuilder, _dom, _playbackmanager, _globalize, _layoutmanager) {
  Object.defineProperty(_exports, "__esModule", {
    value: true
  });
  _exports.default = void 0;
  /* jshint module: true */

  var BackdropFilterSupported = CSS.supports('backdrop-filter', 'blur(1em)') || CSS.supports('-webkit-backdrop-filter', 'blur(1em)');
  function showAlert(options) {
    return Emby.importModule('./modules/common/dialogs/alert.js').then(function (alert) {
      return alert(options);
    });
  }
  function getDetailImageItems() {
    var item = this.currentOptions.displayItem;
    var items = [];
    if (item) {
      if (item.SeriesPrimaryImageTag) {
        item = {
          Id: item.SeriesId,
          Name: item.SeriesName,
          ServerId: item.ServerId,
          ImageTags: {
            Primary: item.SeriesPrimaryImageTag
          },
          IsFolder: true,
          PrimaryImageAspectRatio: 2 / 3
        };
      }
      items.push(item);
    }
    return Promise.resolve({
      Items: items,
      TotalRecordCount: items.length
    });
  }
  function getDetailImageListOptions(items) {
    return {
      renderer: _cardbuilder.default,
      options: {
        overlayText: true,
        fields: [],
        action: 'none',
        //imageClass: "osdInfoImageCard",
        //imageWidthTestClass: imageContainerClassName,
        multiSelect: false,
        ratingButton: false,
        playedButton: false,
        cardClass: 'osdInfoImageCard',
        cardBoxClass: 'osdInfoImageCardBox',
        cardContentClass: 'legacyLazyLoadImmediate',
        defaultIcon: true,
        typeIndicator: false,
        playedIndicator: false,
        syncIndicator: false,
        timerIndicator: false,
        randomDefaultBackground: false,
        staticElement: true,
        progress: false,
        hoverPlayButton: false,
        downloadButton: false,
        // prevents touchzoom
        moreButton: false,
        enableUserData: false,
        playQueueIndicator: false
      },
      virtualScrollLayout: 'vertical-grid'
    };
  }
  function initDetailImage(instance, view) {
    var itemsContainer = view.querySelector('.videoosd-poster');
    itemsContainer.fetchData = getDetailImageItems.bind(instance);
    itemsContainer.getListOptions = getDetailImageListOptions;
    instance.imageItemsContainer = itemsContainer;
  }
  function InfoTab(view) {
    _basetab.default.apply(this, arguments);
    this.enableSecondaryText = false;
    if (BackdropFilterSupported && _dom.default.allowBackdropFilter()) {
      if (BackdropFilterSupported) {
        this.enableSecondaryText = true;
        view.classList.add('dialog-blur');
        view.classList.remove('videoosd-tabBackground');
      }
    } else {
      view.classList.add('videoosd-tabBackground');
    }
  }
  function onReadMoreClick(e) {
    var btn = e.currentTarget;
    var overviewTextElem = btn.closest('.videoosd-info-overview').querySelector('.osdinfo-overview-text');
    var item = this.currentOptions.displayItem;
    showAlert({
      preFormattedText: overviewTextElem.innerHTML,
      confirmButton: false,
      // handle episodes without a title
      title: _itemmanager.default.getDisplayName(item) || item.Name,
      centerText: false,
      item: item
    });
  }
  function onPlayFromBeginningClick(e) {
    _playbackmanager.default.seek(0);
  }
  Object.assign(InfoTab.prototype, _basetab.default.prototype);
  InfoTab.prototype.loadTemplate = function () {
    var view = this.view;
    var secondaryTextClass = this.enableSecondaryText ? ' secondaryText' : '';
    view.innerHTML = "<div is=\"emby-itemscontainer\" class=\"videoosd-poster flex flex-direction-column justify-content-center flex-shrink-zero\">\n                    </div>\n                    <div class=\"videoosd-info flex flex-direction-column justify-content-flex-start flex-grow verticalFieldItems verticalFieldItems-condensed-medium\">\n                        <h2 class=\"videoosd-info-title\" style=\"margin:0;\">\n                        </h2>\n                        <div class=\"videoosd-info-title2 flex flex-direction-row flex-wrap-wrap hide\">\n                        </div>\n                        <div class=\"flex flex-direction-row flex-wrap-wrap" + secondaryTextClass + "\">\n                            <div class=\"videoosd-info-mediainfo mediaInfoItems flex flex-direction-row flex-wrap-wrap\">\n                            </div>\n                        </div>\n                        <div class=\"videoosd-info-mediainfo2" + secondaryTextClass + " mediaInfoItems flex flex-direction-row flex-wrap-wrap\">\n                        </div>\n                        <div class=\"videoosd-info-mediasourceInfo" + secondaryTextClass + " mediaInfoItems flex flex-direction-row flex-wrap-wrap\">\n                        </div>\n\n                        <div class=\"videoosd-info-overview" + secondaryTextClass + " hide flex flex-direction-row align-items-flex-end focuscontainer-x\">\n\n                            <button disabled type=\"button\" is=\"emby-button\" data-focusscale=\"false\" class=\"button-link button-link-color-inherit btnInfoTabOverviewText text-align-start\" style=\"opacity:initial;\">\n                                <div class=\"osdinfo-overview-text\"></div>\n                            </button>\n                            <a href=\"#\" is=\"emby-linkbutton\" class=\"button-link btnInfoTabReadMore hide flex-shrink-zero" + secondaryTextClass + "\">" + _globalize.default.translate('HeaderReadMore') + "</a>\n                        </div>\n                     </div>\n                     <div class=\"flex-shrink-zero infoTabButtonsContainer hide\">\n                        <button is=\"emby-button\" type=\"button\" class=\"btnPlayFromBeginning raised\">\n                            <i class=\"md-icon md-icon-fill button-icon button-icon-left autortl\">&#xe037;</i>\n                            <span class=\"btnPlayFromBeginningText\"></span>\n                        </button>\n                     </div>\n                        ";
    view.querySelector('.btnPlayFromBeginningText').innerHTML = _globalize.default.translate('FromBeginning');
    view.querySelector('.btnInfoTabOverviewText').addEventListener('click', onReadMoreClick.bind(this));
    view.querySelector('.btnInfoTabReadMore').addEventListener('click', onReadMoreClick.bind(this));
    view.querySelector('.btnPlayFromBeginning').addEventListener('click', onPlayFromBeginningClick.bind(this));
    this.infoTabButtonsContainer = view.querySelector('.infoTabButtonsContainer');
    if (!_layoutmanager.default.tv) {
      this.infoTabButtonsContainer.classList.add('infoTabButtonsContainer-autohide');
    }
    initDetailImage(this, view);
    return Promise.resolve();
  };
  function fillMediaSourceInfo(instance, mediaSource, currentPlayer) {
    var elem = instance.view.querySelector('.videoosd-info-mediasourceInfo');
    if (!mediaSource) {
      elem.classList.add('hide');
      return;
    }
    var mediaStreams = mediaSource.MediaStreams || [];
    var infos = [];
    var videoStream = mediaStreams.filter(function (m) {
      return m.Type === 'Video';
    })[0];
    if (videoStream) {
      infos.push('<div class="mediaInfoItem">' + videoStream.DisplayTitle + '</div>');
    }
    var audioTracks = _playbackmanager.default.audioTracks(currentPlayer);
    var currentIndex = _playbackmanager.default.getAudioStreamIndex(currentPlayer);
    var audioStream = audioTracks.filter(function (m) {
      return m.Index === currentIndex;
    })[0];
    if (audioStream) {
      infos.push('<div class="mediaInfoItem">' + audioStream.DisplayTitle + '</div>');
    }
    elem.innerHTML = infos.join('');
    if (infos.length) {
      elem.classList.remove('hide');
    } else {
      elem.classList.add('hide');
    }
  }
  function fillOverview(elem, overview) {
    var textElement = elem.querySelector('.osdinfo-overview-text');
    var btnReadMore = elem.querySelector('.btnInfoTabReadMore');
    btnReadMore.innerHTML = _globalize.default.translate('More');
    if (_layoutmanager.default.tv) {
      elem.classList.remove('videoosd-info-overview-scroll');
      textElement.classList.add('osdinfo-overview-text-readmore');
    } else {
      elem.classList.add('videoosd-info-overview-scroll');
      textElement.classList.remove('osdinfo-overview-text-readmore');
    }
    if (!overview) {
      elem.classList.add('hide');
      textElement.innerHTML = '';
      return;
    }
    textElement.innerHTML = overview;
    elem.classList.remove('hide');
    var textButton = textElement.closest('button');
    if (_layoutmanager.default.tv) {
      textButton.removeAttribute('disabled');
      btnReadMore.classList.add('hide');
    } else {
      textButton.setAttribute('disabled', 'disabled');
      btnReadMore.classList.add('hide');
    }
  }
  InfoTab.prototype.refreshItem = function (options) {
    _basetab.default.prototype.refreshItem.apply(this, arguments);
    this.imageItemsContainer.refreshItems(options);
    var currentOptions = this.currentOptions;
    var item = currentOptions.displayItem;
    var mediaSource = currentOptions.mediaSource;
    var currentPlayer = currentOptions.currentPlayer;
    var titleElem = this.view.querySelector('.videoosd-info-title');
    var title2Elem = this.view.querySelector('.videoosd-info-title2');
    var seriesName = item.SeriesName || (item.IsSeries || item.EpisodeTitle ? item.Name : null);
    if (seriesName) {
      titleElem.innerHTML = seriesName;
      if (item.Type === 'Program') {
        title2Elem.classList.add('hide');
      } else {
        title2Elem.innerHTML = _itemmanager.default.getDisplayName(item, {});
        title2Elem.classList.remove('hide');
      }
    } else {
      titleElem.innerHTML = _itemmanager.default.getDisplayName(item, {});
      title2Elem.classList.add('hide');
    }
    var overview = item.Overview;
    //overview += ' ' + overview + ' ' + overview + ' ' + overview + ' ' + overview + ' ' + overview + ' ' + overview + ' ' + overview + ' ' + overview + ' ' + overview + ' ' + overview + ' ' + overview + ' ' + overview + ' ' + overview + ' ' + overview + ' ' + overview + ' ' + overview + ' ' + overview + ' ' + overview + ' ' + overview + ' ' + overview + ' ' + overview + ' ' + overview + ' ' + overview + ' ' + overview + ' ' + overview + ' ' + overview;
    var overviewContent = overview ? _dom.default.stripScripts(overview) : '';
    fillOverview(this.view.querySelector('.videoosd-info-overview'), overviewContent);
    _mediainfo.default.fillPrimaryMediaInfo(this.view.querySelector('.videoosd-info-mediainfo'), item, {
      endsAt: false,
      bitrate: item.MediaType === 'Audio',
      mediaSource: mediaSource
    });
    _mediainfo.default.fillSecondaryMediaInfo(this.view.querySelector('.videoosd-info-mediainfo2'), item, {
      mediaSource: mediaSource
    });
    fillMediaSourceInfo(this, mediaSource, currentPlayer);
    if (mediaSource.RunTimeTicks) {
      this.infoTabButtonsContainer.classList.remove('hide');
    } else {
      this.infoTabButtonsContainer.classList.add('hide');
    }
  };
  InfoTab.prototype.onResume = function (options) {
    var instance = this;
    return _basetab.default.prototype.onResume.apply(this, arguments).then(function () {
      var optionsWithoutRefresh = Object.assign(Object.assign({}, options), {
        refresh: false
      });
      return instance.imageItemsContainer.resume(optionsWithoutRefresh).then(function () {
        if (options.refresh) {
          instance.refreshItem(options);
        }
      });
    });
  };
  InfoTab.prototype.onPause = function () {
    _basetab.default.prototype.onPause.apply(this, arguments);
    this.imageItemsContainer.pause();
  };
  InfoTab.prototype.destroy = function () {
    _basetab.default.prototype.destroy.apply(this, arguments);
    this.endsAtElem = null;
    this.imageItemsContainer = null;
    this.infoTabButtonsContainer = null;
  };
  var _default = _exports.default = InfoTab;
});
