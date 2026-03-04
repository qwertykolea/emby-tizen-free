define(["exports", "./../common/textencoding.js", "./../common/globalize.js", "./../loading/loading.js", "./../layoutmanager.js", "./../approuter.js", "./../cardbuilder/cardbuilder.js", "./../listview/listview.js", "./../common/usersettings/usersettings.js", "./../registrationservices/registrationservices.js"], function (_exports, _textencoding, _globalize, _loading, _layoutmanager, _approuter, _cardbuilder, _listview, _usersettings, _registrationservices) {
  Object.defineProperty(_exports, "__esModule", {
    value: true
  });
  _exports.default = void 0;
  function getResponseHelper() {
    return Emby.importModule('./modules/common/responsehelper.js');
  }
  function SectionsController(view) {
    this.view = view;
    this.sectionsContainer = this.getSectionsContainer();
  }
  function autoFocus() {
    var state = this;
    var instance = state.instance;
    var elem = instance.autoFocus();
    if (!elem && state.retries < 20) {
      state.retries++;
      setTimeout(autoFocus.bind(state), 100);
    } else {
      state.retries = null;
    }
  }
  function afterResume(instance, options) {
    if (options.autoFocus) {
      var elem = instance.autoFocus();
      if (!elem) {
        var state = {
          retries: 0,
          instance: instance
        };
        setTimeout(autoFocus.bind(state), 100);
      }
    }
    _loading.default.hide();
    if (instance.fillFocusPreviewIfNeeded) {
      instance.fillFocusPreviewIfNeeded();
    }
  }
  SectionsController.prototype.getSectionsContainer = function () {
    return this.view.querySelector('.sections') || this.view;
  };
  SectionsController.prototype.fetchSections = function (options) {
    return Promise.resolve([]);
  };
  SectionsController.prototype.onItemsContainerAction = function (e) {
    var bindInfo = this;
    var target = e.target;
    var itemsContainer = target.closest('.itemsContainer');
    if (itemsContainer) {
      var itemElement = target.closest(itemsContainer.getItemSelector());
      if (itemElement) {
        var instance = bindInfo.instance;
        instance.onItemCustomAction({
          section: bindInfo.section,
          item: itemsContainer.getItemFromElement(itemElement),
          itemElement: itemElement
        });
      }
    }
  };
  SectionsController.prototype.onItemCustomAction = function (options) {};
  SectionsController.prototype.onSpotlightButtonsItemsContainerAction = function (e) {
    var bindInfo = this;
    var target = e.target;
    var itemsContainer = target.closest('.itemsContainer');
    if (itemsContainer) {
      var itemElement = target.closest(itemsContainer.getItemSelector());
      if (itemElement) {
        var instance = bindInfo.instance;
        instance.onSpotlightButtonCustomAction({
          section: bindInfo.section,
          item: itemsContainer.getItemFromElement(itemElement),
          itemElement: itemElement
        });
      }
    }
  };
  SectionsController.prototype.onSpotlightButtonCustomAction = function (options) {};
  SectionsController.prototype.onContentButtonClicked = function (e) {
    var bindInfo = this;
    //const instance = bindInfo.instance;
    var button = e.target.closest('.contentButton');
    var section = bindInfo.section;
    if (!button) {
      return;
    }
    var index = button.getAttribute('data-buttonindex');
    if (!index) {
      return;
    }
    index = parseInt(index);
    var fn = section.ContentButtons[index].OnClick;
    if (fn) {
      fn(e);
    }
  };
  function getHorizontalScrollerStartTag(scrollButtons) {
    var scrollButtonsAttribute = scrollButtons === false ? ' data-scrollbuttons="false"' : '';
    return '<div is="emby-scroller" data-mousewheel="false" data-focusscroll="true"' + scrollButtonsAttribute + ' class="padded-top-focusscale padded-bottom-focusscale padded-left padded-left-page padded-right">';
  }
  function loadOnNowButtons(instance, elem) {
    var html = '';
    var apiClient = instance.getApiClient();
    html += '<div class="verticalSection verticalSection-cards liveTVButtonsSection hide">';
    html += '<div class="sectionTitleContainer sectionTitleContainer-cards sectionTitleContainer padded-left padded-left-page padded-right">';
    html += '<h2 class="sectionTitle sectionTitle-cards">' + _globalize.default.translate('LiveTV') + '</h2>';
    html += '</div>';
    html += getHorizontalScrollerStartTag(false);
    html += '<div style="padding-bottom:1.5em;padding-inline-start:.4em;flex-wrap:nowrap;" data-focusabletype="nearest" class="focusable buttonItems focuscontainer-x scrollSlider padded-top padded-bottom flex align-items-center">';
    html += '<a is="emby-linkbutton" href="' + _approuter.default.getRouteUrl('livetv', {
      serverId: apiClient.serverId(),
      section: 'programs'
    }) + '" class="raised justify-content-center buttonItems-item"><i class="md-icon button-icon button-icon-left">&#xe639;</i><span>' + _globalize.default.translate('Programs') + '</span></a>';
    html += '<a is="emby-linkbutton" href="' + _approuter.default.getRouteUrl('livetv', {
      serverId: apiClient.serverId(),
      section: 'guide'
    }) + '" class="raised justify-content-center buttonItems-item"><i class="md-icon button-icon button-icon-left autortl">&#xe1b2;</i><span>' + _globalize.default.translate('Guide') + '</span></a>';
    html += '<a is="emby-linkbutton" href="' + _approuter.default.getRouteUrl('recordedtv', {
      serverId: apiClient.serverId()
    }) + '" class="raised justify-content-center buttonItems-item"><i class="md-icon button-icon button-icon-left">folder</i><span>' + _globalize.default.translate('Recordings') + '</span></a>';
    html += '<a is="emby-linkbutton" href="' + _approuter.default.getRouteUrl('livetv', {
      serverId: apiClient.serverId(),
      section: 'dvrschedule'
    }) + '" class="raised justify-content-center buttonItems-item"><i class="md-icon button-icon button-icon-left">&#xe916;</i><span>' + _globalize.default.translate('Schedule') + '</span></a>';
    html += '</div>';
    html += '</div>';
    elem.insertAdjacentHTML('beforebegin', html);
  }
  function loadSection(instance, elem, section) {
    var _section$SpotlightBut2, _section$SpotlightBut3;
    var viewScrollX = instance.scrollDirection() === 'x';
    var title = _textencoding.default.htmlEncode(section.Name);
    var viewType = section.ViewType || 'cards';
    if (viewScrollX && viewType === 'buttons') {
      viewType = 'cards';
      section.ViewType = viewType;
      section.ListOptions.fields = [];
      section.ListOptions.lines = null;
      section.ListOptions.centerText = true;
      section.ListOptions.sideFooter = false;
      section.ListOptions.smallSideFooter = false;
      section.CardSizeOffset = -2;
    }
    var sectionScrollX = !viewScrollX && section.ScrollDirection !== 'Vertical';
    if (section.SectionType === 'onnow') {
      loadOnNowButtons(instance, elem);
    }
    var listOptions = section.ListOptions || {};
    var sideFooter = viewType === 'cards' && listOptions.sideFooter && !listOptions.smallSideFooter || viewType === 'list' && sectionScrollX;
    var smallSideFooter = viewType === 'cards' && listOptions.sideFooter && listOptions.smallSideFooter || viewType === 'buttons';
    if (sideFooter || smallSideFooter || listOptions.cardLayout) {
      if (!viewScrollX) {
        elem.classList.add('verticalSection-extrabottompadding');
      }
    }
    var headerButtons = _layoutmanager.default.tv ? [] : section.HeaderButtons || [];
    var sectionTitleContainerClass = 'sectionTitleContainer';
    var isPlainContent = viewType === 'text' || viewType === 'content';
    if (viewType === 'list' && sectionScrollX) {
      sectionTitleContainerClass += ' sectionTitleContainer-wrappedlistview';
    } else {
      sectionTitleContainerClass += ' sectionTitleContainer-cards';
    }
    if (!viewScrollX) {
      if (isPlainContent) {
        elem.classList.add('padded-left', 'padded-left-page', 'padded-right');
      } else {
        sectionTitleContainerClass += ' padded-left padded-left-page padded-right';
      }
    }
    var focusableTypeAttribute = '';
    var sectionHref = section.Href;
    if (sectionHref) {
      if (!viewScrollX && instance.enableFocusPreview && instance.enableFocusPreview()) {
        sectionHref = null;
      }
    }
    if (title && sectionHref || headerButtons.length) {
      if (!viewScrollX) {
        sectionTitleContainerClass += ' focusable';
        focusableTypeAttribute = ' data-focusabletype="nearest"';
      }
    }
    var html = '';
    var sectionTitleClass = 'sectionTitle sectionTitle-cards';
    if (viewScrollX) {
      sectionTitleClass += ' sectionTitle-cards-horizontal';
    }
    if (viewType === 'text') {
      var _section$TextInfo;
      var bannerClass;
      switch ((_section$TextInfo = section.TextInfo) == null ? void 0 : _section$TextInfo.Level) {
        case 'Error':
          bannerClass = 'errorBanner';
          break;
        case 'Warning':
          bannerClass = 'warningBanner';
          break;
        default:
          bannerClass = 'infoBanner';
          break;
      }
      if (_layoutmanager.default.tv) {
        html += '<button type="button" is="emby-button" class="block text-align-start ' + bannerClass + '" style="margin:0;padding:1em 0;"';
      } else {
        html += '<div class="' + bannerClass + '" style="margin:0;padding:1.35em 0;"';
      }
      html += '><div class="infoBannerContent">';
    }
    var enableTitleContainer = title || headerButtons.length;
    if (enableTitleContainer) {
      html += '<div class="' + sectionTitleContainerClass + '"' + focusableTypeAttribute + '>';
    }
    if (title) {
      var titleRendered;
      if (sectionHref) {
        html += '<a is="emby-sectiontitle" href="' + sectionHref + '" class="noautofocus more button-link button-link-color-inherit sectionTitleTextButton">';
        html += '<h2 class="' + sectionTitleClass + '">';
        html += title;
        html += '</h2>';
        html += '</a>';
        titleRendered = true;
      }
      if (!titleRendered) {
        html += '<h2 class="' + sectionTitleClass + '">' + title + '</h2>';
      }
    }
    for (var i = 0, length = headerButtons.length; i < length; i++) {
      var button = headerButtons[i];
      switch (button.ButtonType) {
        case 'raised':
          if (button.Href) {
            html += '<a is="emby-linkbutton" href="' + button.Href + '" class="raised raised-mini sectionTitleButton"><i class="md-icon button-icon button-icon-left">' + button.Icon + '</i><span>' + _textencoding.default.htmlEncode(button.Name || '') + '</span></a>';
          } else {
            html += '<button type="button" is="emby-button" class="raised raised-mini sectionTitleButton"><i class="md-icon button-icon button-icon-left">' + button.Icon + '</i><span>' + _textencoding.default.htmlEncode(button.Name || '') + '</span></button>';
          }
          break;
        default:
          if (button.Href) {
            html += '<a is="emby-linkbutton" href="' + button.Href + '" class="sectionTitleIconButton fab" title="' + _textencoding.default.htmlEncode(button.Name || '') + '"><i class="md-icon">' + button.Icon + '</i></a>';
          } else {
            html += '<button type="button" is="emby-button" class="sectionTitleIconButton fab" title="' + _textencoding.default.htmlEncode(button.Name || '') + '"><i class="md-icon">' + button.Icon + '</i></button>';
          }
          break;
      }
    }
    if (enableTitleContainer) {
      html += '</div>';
    }
    if (section.Subtitle) {
      html += '<p class="sectionTitle-cards padded-left padded-left-page padded-right" style="margin-top:.5em;margin-bottom:.5em;">' + _textencoding.default.htmlEncode(section.Subtitle) + '</p>';
    }
    var hasContentButtons;
    var usesItemsContainer = !isPlainContent;
    if (viewType === 'content') {
      //
    } else if (viewType === 'text') {
      html += '<div class="sectionTitle-cards">';
      if (title) {
        var _section$TextInfo2;
        html += '<div style="margin-top:1em;">';
        html += _textencoding.default.htmlEncode(((_section$TextInfo2 = section.TextInfo) == null ? void 0 : _section$TextInfo2.Text) || '');
        html += '</div>';
      } else {
        var _section$TextInfo3;
        html += '<h3 style="margin:0;">';
        html += _textencoding.default.htmlEncode(((_section$TextInfo3 = section.TextInfo) == null ? void 0 : _section$TextInfo3.Text) || '');
        html += '</h3>';
      }
      if (_layoutmanager.default.tv) {
        html += '</button>';
      } else {
        html += '</div>';
      }
    } else {
      var _section$QueryOptions, _section$SpotlightBut;
      var monitor = section.Monitor || [];
      var monitorIds = section.MonitorIds || [];
      var monitorAttribute = monitor.length ? ' data-monitor="' + monitor.join(',') + '"' : '';
      var monitorIdsAttribute = monitorIds.length ? ' data-monitorids="' + monitorIds.join(',') + '"' : '';
      var refreshIntervalAttribute = section.RefreshInterval ? ' data-refreshinterval="' + section.RefreshInterval + '"' : '';
      var immediateUpdateAttribute = section.ImmediateUpdate != null ? ' data-immediateupdate="' + section.ImmediateUpdate + '"' : '';
      var parentIdAttribute = (_section$QueryOptions = section.QueryOptions) != null && _section$QueryOptions.ParentId ? ' data-parentid="' + section.QueryOptions.ParentId + '"' : '';
      var itemsContainerClass = 'itemsContainer';
      if (!viewScrollX) {
        itemsContainerClass += ' focuscontainer-x';
      }
      if (viewScrollX && section.SectionType === 'spotlight' && (_section$SpotlightBut = section.SpotlightButtons) != null && _section$SpotlightBut.length) {
        itemsContainerClass += ' spotlightItemsContainer';
      }
      var allowVirtualScroll = !listOptions.autoWidth && !viewScrollX;
      if (!listOptions.autoWidth) {
        if (smallSideFooter) {
          itemsContainerClass += ' itemsContainer-sideFooters itemsContainer-smallSideFooters';
        } else if (sideFooter) {
          itemsContainerClass += ' itemsContainer-sideFooters';
        }
      }
      if (sectionScrollX) {
        if (!_layoutmanager.default.tv && section.FinePointerWrap) {
          itemsContainerClass += ' itemsContainer-finepointerwrap';
          allowVirtualScroll = false;
        }
        html += getHorizontalScrollerStartTag() + '<div is="emby-itemscontainer"' + monitorAttribute + monitorIdsAttribute + refreshIntervalAttribute + parentIdAttribute + immediateUpdateAttribute + ' data-focusabletype="nearest" class="scrollSlider focusable ' + itemsContainerClass + '"';
        if (allowVirtualScroll) {
          html += ' data-virtualscrolllayout="horizontal-grid"';
        }
        html += '>';
        html += '</div>';
        html += '</div>';
      } else {
        if (viewScrollX) {
          itemsContainerClass += ' itemsContainer-horizontalgrid itemsContainer-horizontalsection-horizontalgrid flex flex-wrap-wrap flex-direction-column';
        } else {
          itemsContainerClass += ' padded-left padded-left-page padded-right vertical-wrap';
        }
        html += '<div is="emby-itemscontainer"' + monitorAttribute + monitorIdsAttribute + refreshIntervalAttribute + parentIdAttribute + ' class="' + itemsContainerClass + '">';
        html += '</div>';
      }
    }
    if (viewType === 'text') {
      html += '</div>';
      html += '</div>';
    }
    if (viewScrollX && (_section$SpotlightBut2 = section.SpotlightButtons) != null && _section$SpotlightBut2.length) {
      html += '<div class="spotlightButtonsItemsContainer itemsContainer" is="emby-itemscontainer">';
      html += '</div>';
    }
    var contentButtons = section.ContentButtons || [];
    if (contentButtons.length) {
      hasContentButtons = true;
      var style = viewType === 'text' ? ' style="margin-top:1em;"' : '';
      var contentButtonsClass = 'contentButtons';
      if (section.CenterContentButtons) {
        contentButtonsClass += ' justify-content-center';
      }
      html += '<div' + style + ' class="' + contentButtonsClass + ' buttonItems focuscontainer-x">';
      for (var _i = 0, _length = contentButtons.length; _i < _length; _i++) {
        var _button = contentButtons[_i];
        if (_button.Href) {
          html += '<button type="button" is="emby-linkbutton" href="' + _button.Href + '" class="raised raised-mini buttonItems-item contentButton" data-buttonindex="' + _i + '">';
        } else {
          html += '<button type="button" is="emby-button" class="raised raised-mini buttonItems-item contentButton" data-buttonindex="' + _i + '">';
        }
        html += '<i class="md-icon button-icon button-icon-left">' + _button.Icon + '</i>';
        html += '<span>';
        html += _textencoding.default.htmlEncode(_button.Name || '');
        html += '</span>';
        html += '</button>';
      }
      html += '</div>';
    }
    elem.innerHTML = html;
    if (hasContentButtons) {
      elem.querySelector('.contentButtons').addEventListener('click', instance.onContentButtonClicked.bind({
        instance: instance,
        section: section
      }));
    }
    if (viewScrollX && (_section$SpotlightBut3 = section.SpotlightButtons) != null && _section$SpotlightBut3.length) {
      var spotlightButtonsItemsContainer = elem.querySelector('.spotlightButtonsItemsContainer');
      spotlightButtonsItemsContainer.fetchData = fetchSpotlightButtonItems.bind({
        instance: instance,
        section: section
      });
      spotlightButtonsItemsContainer.getListOptions = fetchSpotlightButtonListOptions.bind({
        instance: instance,
        section: section
      });
      spotlightButtonsItemsContainer.parentContainer = spotlightButtonsItemsContainer;
      spotlightButtonsItemsContainer.addEventListener('action-null', instance.onSpotlightButtonsItemsContainerAction.bind({
        instance: instance,
        section: section
      }));
    }
    if (!usesItemsContainer) {
      elem.classList.remove('hide');
      return Promise.resolve();
    } else {
      var itemsContainer = elem.querySelector('.itemsContainer');
      itemsContainer.fetchData = section.fetchData;
      itemsContainer.getListOptions = section.getListOptions;
      itemsContainer.onRefreshing = instance.onSectionRefreshing.bind({
        instance: instance,
        section: section,
        elem: elem
      });
      itemsContainer.afterRefresh = instance.afterSectionRefreshed.bind({
        instance: instance,
        section: section,
        elem: elem
      });
      itemsContainer.parentContainer = elem;
      if (sideFooter || smallSideFooter) {
        itemsContainer.removeAttribute('data-cardsizeoffset');
      } else if (section.CardSizeOffset) {
        itemsContainer.setAttribute('data-cardsizeoffset', section.CardSizeOffset.toString());
      }
      if (instance.addFocusBehavior) {
        instance.addFocusBehavior(itemsContainer);
      }
      if (listOptions.action === 'custom') {
        itemsContainer.addEventListener('action-null', instance.onItemsContainerAction.bind({
          instance: instance,
          section: section
        }));
      }
      return itemsContainer.waitForCustomElementUpgrade();
    }
  }
  function bindUnlockClick(instance, elem, featureCode) {
    var btnUnlock = elem.querySelector('.btnUnlock');
    if (btnUnlock) {
      btnUnlock.addEventListener('click', function (e) {
        _registrationservices.default.validateFeature(featureCode, {
          viewOnly: true
        }).then(function () {
          instance.onResume({
            refresh: true,
            autoFocus: true
          });
        });
      });
    }
  }
  SectionsController.prototype.onSectionRefreshing = function (result) {
    var bindInfo = this;
    var instance = bindInfo.instance;
    var section = bindInfo.section;
    var elem = bindInfo.elem;
    if (!section.PremiumFeature) {
      return;
    }
    var items = result.Items || result;
    if (!items.length) {
      return;
    }
    _registrationservices.default.validateFeature(section.PremiumFeature, {
      viewOnly: true,
      showDialog: false
    }).then(function () {
      var _elem$querySelector;
      (_elem$querySelector = elem.querySelector('.sectionPremiereContainer')) == null || _elem$querySelector.remove();
      elem.querySelector('.itemsContainer').classList.remove('hide');
    }, function () {
      var itemsContainer = elem.querySelector('.itemsContainer');
      itemsContainer.classList.add('hide');
      if (!elem.querySelector('.sectionPremiereContainer')) {
        var html = '';
        html += '<div class="sectionPremiereContainer">';
        html += '<p class="sectionTitle sectionTitle-cards" style="margin-top:1em;margin-bottom:1em;">' + section.PremiumMessage + '</p>';
        html += '<button is="emby-button" type="button" class="raised btnUnlock">';
        html += '<i class="md-icon md-icon-fill button-icon button-icon-left">&#xe838;</i>';
        html += '<span>' + _globalize.default.translate('HeaderBecomeProjectSupporter') + '</span>';
        html += '</button>';
        html += '</div>';
        itemsContainer.insertAdjacentHTML('afterend', html);
        bindUnlockClick(instance, elem, section.PremiumFeature);
      }
    });
  };
  SectionsController.prototype.afterSectionRefreshed = function (result) {
    var bindInfo = this;
    var section = bindInfo.section;
    var elem = bindInfo.elem;
    if (section.SectionType === 'onnow' && section.ShowLiveTVButtons) {
      var liveTVButtonsSection = elem.parentNode.querySelector('.liveTVButtonsSection');
      if (liveTVButtonsSection) {
        if (elem.classList.contains('hide')) {
          liveTVButtonsSection.classList.add('hide');
        } else {
          liveTVButtonsSection.classList.remove('hide');
        }
      }
    }
  };
  function fetchSpotlightButtonItems() {
    var bindInfo = this;
    var section = bindInfo.section;
    return Promise.resolve(section.SpotlightButtons);
  }
  SectionsController.prototype.fetchSectionItems = function (query) {
    var bindInfo = this;
    var instance = bindInfo.instance;
    var section = bindInfo.section;
    if (section.Items) {
      return Promise.resolve(section.Items);
    }
    var listOptions = section.ListOptions;
    var viewScrollX = instance.scrollDirection() === 'x';
    var apiClient = instance.getApiClient();
    var queryOptions = section.QueryOptions;
    var sectionType = section.SectionType;
    var fields = instance.getRequestedItemFields() + ',PrimaryImageAspectRatio';
    if (listOptions.fields.includes('ProductionYear')) {
      fields += ',ProductionYear';
      if (queryOptions.IncludeItemTypes === 'Series') {
        fields += ',Status,EndDate';
      }
    }
    var options = Object.assign({
      SortBy: queryOptions.IncludeItemTypes === 'Episode' ? 'SeriesSortName,ParentIndexNumber,IndexNumber,SortName' : "SortName",
      SortOrder: "Ascending",
      Filters: queryOptions.Filters,
      Fields: fields,
      CollectionTypes: queryOptions.CollectionTypes,
      ImageTypeLimit: 1,
      EnableImageTypes: instance.getRequestedImageTypes()
    }, queryOptions || {}, query || {});
    if (viewScrollX && section.LimitItems !== false) {
      options.Limit = Math.min(options.Limit || 9, 9);
    }
    if (queryOptions.IncludeItemTypes === 'TvChannel') {
      options.SortBy = 'ChannelNumber,SortName';
      options.Fields += ',CurrentProgram';
    }
    var userId = apiClient.getCurrentUserId();
    if (sectionType === 'latestmedia') {
      return apiClient.getLatestItems({
        Limit: options.Limit || 24,
        Fields: fields,
        ImageTypeLimit: 1,
        EnableImageTypes: instance.getRequestedImageTypes(),
        GroupItems: true,
        UserId: userId,
        ParentId: queryOptions == null ? void 0 : queryOptions.ParentId
      });
    }
    if (sectionType === 'resume') {
      return apiClient.getResumableItems(userId, Object.assign({
        Limit: options.Limit,
        IncludeItemTypes: queryOptions.IncludeItemTypes,
        Fields: fields,
        ImageTypeLimit: 1,
        EnableImageTypes: instance.getRequestedImageTypes(),
        MediaTypes: 'Video',
        ParentId: queryOptions.ParentId
      }, query || {}));
    }
    if (sectionType === 'resumeaudio') {
      return apiClient.getResumableItems(userId, Object.assign({
        Limit: options.Limit,
        IncludeItemTypes: queryOptions.IncludeItemTypes,
        Fields: fields,
        ImageTypeLimit: 1,
        EnableImageTypes: instance.getRequestedImageTypes(),
        MediaTypes: 'Audio',
        ParentId: queryOptions.ParentId
      }, query || {}));
    }
    if (sectionType === 'recordings') {
      return apiClient.getLiveTvRecordings(Object.assign({
        Fields: fields,
        ImageTypeLimit: 1,
        EnableImageTypes: instance.getRequestedImageTypes(),
        UserId: userId
      }, queryOptions || {}, query || {}));
    }
    if (sectionType === 'artists') {
      return apiClient.getArtists(userId, options);
    }
    if (sectionType === 'people') {
      return apiClient.getPeople(userId, options);
    }
    if (sectionType === 'onnow') {
      options.Fields += ',ProgramPrimaryImageAspectRatio';
      options.IsAiring = true;
      options.SortBy = 'ChannelNumber,SortName';
      options.EnableUserData = false;
      options.UserId = userId;
      _usersettings.default.addLiveTvChannelSortingToQuery(options, _globalize.default);
      return apiClient.getLiveTvChannels(options);
    }
    if (sectionType === 'livetvtags') {
      options.Fields += ',ChannelImageIfNoImage';
      options.Recursive = true;
      options.SortBy = 'SortName';
      options.UserId = userId;
      return apiClient.getLiveTvChannelTags(options);
    }
    return apiClient.getItems(userId, options);
  };
  function fetchSpotlightButtonListOptions() {
    var bindInfo = this;
    var section = bindInfo.section;
    return {
      renderer: _cardbuilder.default,
      options: Object.assign({
        shape: 'fourThree',
        overlayText: true,
        multiSelect: false,
        fields: ['Name'],
        action: 'custom',
        scalable: true,
        cardClass: 'spotlightButtonCard-horizontal',
        cardContentClass: 'spotlightButtonCardContent-horizontal',
        context: section.CollectionType,
        horizontal: true,
        // to get the same margin
        cardBoxClass: 'cardBox-horizontalgrid'
      }, {}),
      virtualScrollLayout: null
    };
  }
  SectionsController.prototype.getSectionListOptions = function (items) {
    var bindInfo = this;
    var instance = bindInfo.instance;
    var section = bindInfo.section;
    var listOptions = section.ListOptions;
    var viewScrollX = instance.scrollDirection() === 'x';
    var sectionScrollX = !viewScrollX && section.ScrollDirection !== 'Vertical';
    if (section.ViewType === 'list' && sectionScrollX) {
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
        virtualScrollLayout: sectionScrollX ? 'horizontal-grid' : null,
        commandOptions: section.CommandOptions,
        indexOnStartItemId: section.IndexOnStartItemId
      };
    }
    return {
      renderer: _cardbuilder.default,
      options: Object.assign({
        preferThumb: listOptions.preferThumb,
        shape: 'autooverflow',
        sideFooter: section.ViewType === 'sidefooters',
        centerText: listOptions.centerText,
        fields: listOptions.fields,
        scalable: true,
        action: listOptions.action,
        channelNumberFirst: true,
        focusTransformTitleAdjust: true,
        programIndicators: listOptions.programIndicators,
        context: section.CollectionType,
        horizontalGrid: viewScrollX ? true : null
      }, listOptions || {}),
      virtualScrollLayout: sectionScrollX ? 'horizontal-grid' : null,
      commandOptions: section.CommandOptions,
      indexOnStartItemId: section.IndexOnStartItemId
    };
  };
  function fetchSections(instance, options) {
    return instance.fetchSections(options).catch(function (errorResponse) {
      console.error('Error fetching sections: ', errorResponse);
      return getResponseHelper().then(function (responseHelper) {
        return responseHelper.getErrorInfo(errorResponse, {
          enableDefaultTitle: false
        }).then(function (errorInfo) {
          return [{
            Id: 'error',
            Name: errorInfo.title,
            ScrollDirection: 'Vertical',
            ViewType: 'text',
            SectionType: 'text',
            TextInfo: {
              Text: errorInfo.html,
              Level: 'Error'
            },
            ContentButtons: [{
              Name: _globalize.default.translate('Retry'),
              Icon: '&#xe5d5;',
              OnClick: instance.refreshSections.bind(instance)
            }]
          }];
        });
      });
    });
  }
  SectionsController.prototype.refreshSections = function () {
    var instance = this;
    instance.sectionsRendered = false;
    return instance.onResume({
      refresh: true,
      autoFocus: true
    });
  };
  SectionsController.prototype.getBottomHtml = function () {
    var viewScrollX = this.scrollDirection() === 'x';
    if (viewScrollX) {
      return '';
    }
    return '<div class="padded-bottom-page"></div>';
  };
  SectionsController.prototype.loadSections = function (options) {
    var instance = this;
    instance.needsSectionsRefresh = false;
    _loading.default.show();
    return fetchSections(instance, options).then(function (sections) {
      var elem = instance.sectionsContainer;
      var viewScrollX = instance.scrollDirection() === 'x';
      if (viewScrollX) {
        elem.classList.add('flex', 'flex-direction-row', 'horizontalSections');
        elem.classList.remove('flex-direction-column');
        if (instance.enableFocusPreview()) {
          elem.classList.add('scrollSliderX-withfocusPreview');
        }
        elem.parentNode.classList.add('padded-left', 'padded-right', 'padded-left-page');
      } else {
        elem.classList.add('verticalSections');
      }
      var sectionBaseClass = viewScrollX ? 'horizontalSection' : 'verticalSection';
      var sectionClass = viewScrollX ? 'horizontalSection focuscontainer-y navout-up' : 'verticalSection verticalSection-cards';
      var html = '';
      for (var i = 0, length = sections.length; i < length; i++) {
        html += '<div class="' + sectionClass + ' hide"></div>';
      }
      html += instance.getBottomHtml();
      elem.innerHTML = html;
      var sectionElements = elem.querySelectorAll('.' + sectionBaseClass);
      var sectionPromises = [];
      for (var _i2 = 0, _length2 = sections.length; _i2 < _length2; _i2++) {
        var sectionElem = sectionElements[_i2];
        var section = sections[_i2];
        if (!section.fetchData) {
          section.fetchData = instance.fetchSectionItems.bind({
            instance: instance,
            section: section
          });
        }
        if (!section.getListOptions) {
          section.getListOptions = instance.getSectionListOptions.bind({
            instance: instance,
            section: section
          });
        }
        sectionPromises.push(loadSection(instance, sectionElem, section));
      }
      return Promise.all(sectionPromises).then(function () {
        instance.sectionsRendered = true;
      });
    });
  };
  SectionsController.prototype.onResume = function (options) {
    var _options;
    var instance = this;
    var promise;
    if (instance.needsSectionsRefresh) {
      if (!options) {
        options = {};
      }
      options.refreshSections = true;
    }
    if ((_options = options) != null && _options.refreshSections) {
      instance.sectionsRendered = null;
    }
    if (!instance.sectionsRendered) {
      if (!options) {
        options = {};
      }
      options.refresh = true;
      promise = instance.loadSections(options);
    }
    if (!promise) {
      promise = Promise.resolve();
    }
    return promise.then(function () {
      var elems = instance.sectionsContainer.querySelectorAll('.itemsContainer');
      var i, length;
      var promises = [];
      for (i = 0, length = elems.length; i < length; i++) {
        promises.push(elems[i].resume(options));
      }
      return Promise.allSettled(promises).then(function () {
        afterResume(instance, options);
      });
    });
  };
  SectionsController.prototype.onPause = function () {
    var instance = this;
    if (instance.sectionsContainer) {
      var elems = instance.sectionsContainer.querySelectorAll('.itemsContainer');
      var i, length;
      for (i = 0, length = elems.length; i < length; i++) {
        elems[i].pause();
      }
    }
  };
  SectionsController.prototype.destroy = function () {
    if (this.sectionsContainer) {
      var elems = this.sectionsContainer.querySelectorAll('.itemsContainer');
      for (var i = 0, length = elems.length; i < length; i++) {
        elems[i].fetchData = null;
        elems[i].getListOptions = null;
        elems[i].parentContainer = null;
      }
    }
    this.view = null;
    this.sectionsContainer = null;
  };
  var _default = _exports.default = SectionsController;
});
