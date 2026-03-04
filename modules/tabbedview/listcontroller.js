define(["exports", "./../dom.js", "./../focusmanager.js", "./../common/globalize.js", "./../common/usersettings/usersettings.js", "./../common/itemmanager/itemmanager.js", "./../layoutmanager.js", "./../cardbuilder/cardbuilder.js", "./../listview/listview.js", "./../loading/loading.js", "./../alphapicker/alphapicker.js", "./../common/playback/playbackmanager.js", "./../emby-apiclient/connectionmanager.js", "./../maintabsmanager.js", "./../shortcuts.js"], function (_exports, _dom, _focusmanager, _globalize, _usersettings, _itemmanager, _layoutmanager, _cardbuilder, _listview, _loading, _alphapicker, _playbackmanager, _connectionmanager, _maintabsmanager, _shortcuts) {
  Object.defineProperty(_exports, "__esModule", {
    value: true
  });
  _exports.default = void 0;
  /* jshint module: true */

  var supportsCssVariables = CSS.supports('color', 'var(--fake-var)');

  // test these separately because tizen and legacy edge will wrongly return true as soon anytime calc is in the expression 
  var supportsCalc = CSS.supports('width', 'min(45.2%,calc(100% - .65em))');
  var supportsMin = CSS.supports('width', 'min(10em, 5vw)');
  var supportsCalcMin = supportsCalc && supportsMin;
  function loadMultiSelect() {
    if (_layoutmanager.default.tv) {
      return Promise.resolve(null);
    }
    return Emby.importModule('./modules/multiselect/multiselect.js');
  }
  var dataGrid;
  function loadDataGrid() {
    if (dataGrid) {
      return Promise.resolve(dataGrid);
    }
    return Emby.importModule('./modules/datagrid/datagrid.js').then(function (response) {
      dataGrid = response;
      return dataGrid;
    });
  }
  function showActionSheet(options) {
    return Emby.importModule('./modules/actionsheet/actionsheet.js').then(function (ActionSheet) {
      return ActionSheet.show(options);
    });
  }
  function getApiClient(instance) {
    if (instance.getApiClient) {
      return instance.getApiClient();
    }
    if (instance.apiClient) {
      return instance.apiClient;
    }
    var serverId = instance.params.serverId;
    return serverId ? _connectionmanager.default.getApiClient(serverId) : _connectionmanager.default.currentApiClient();
  }
  function onAlphaNumericValueEntered(value) {
    trySelectValue(this, this.scroller, this.view, value, true);
  }
  function onAlphaValueChanged(e) {
    var value = e.detail.value;
    var scroller = this.scroller;
    trySelectValue(this, scroller, this.itemsContainer, value, _layoutmanager.default.tv ? true : false);
  }
  function trySelectValue(instance, scroller, view, value, focus) {
    var sortValues = instance.getSortValues();
    if (!value) {
      // scroll to top
      instance.itemsContainer.scrollToIndex(0, {
        forceInstantScroll: false
      }, focus);
      return;
    }
    if (value === '#') {
      if (sortValues.sortOrder === 'Ascending') {
        // scroll to top
        instance.itemsContainer.scrollToIndex(0, {
          forceInstantScroll: false
        }, focus);
        return;
      }
    }
    instance.getItems({
      Limit: 0
    }).then(function (totalResult) {
      // save an unnecessary request
      if (totalResult.TotalRecordCount <= 1) {
        instance.itemsContainer.scrollToIndex(0, {
          forceInstantScroll: false
        }, focus);
        return;
      }
      if (value === '#') {
        if (sortValues.sortOrder === 'Descending') {
          // scroll to bottom
          instance.itemsContainer.scrollToIndex(totalResult.TotalRecordCount - 1, {
            forceInstantScroll: false
          }, focus);
          return;
        }
      }
      var sortBy = sortValues.sortBy || '';
      var query = {
        Limit: 0
      };
      if (sortBy.startsWith('AlbumArtist')) {
        query.AlbumArtistStartsWithOrGreater = value;
      } else if (sortBy.startsWith('Artist')) {
        query.ArtistStartsWithOrGreater = value;
      } else {
        query.NameStartsWithOrGreater = value;
      }
      instance.getItems(query).then(function (result) {
        var newIndex;
        if (sortValues.sortOrder === 'Descending') {
          newIndex = result.TotalRecordCount;
        } else {
          newIndex = Math.max(totalResult.TotalRecordCount - result.TotalRecordCount, 0);
        }
        instance.itemsContainer.scrollToIndex(newIndex, {
          forceInstantScroll: false
        }, focus);
      });
    });
  }
  function refreshAfterSettingsChange(instance) {
    instance.resetRandomSeed();
    instance.itemsContainer.refreshItems();
  }
  function showViewSettingsMenu(e) {
    var instance = this;
    Emby.importModule('./modules/viewsettings/viewsettings.js').then(function (ViewSettings) {
      var isGrid = instance.getViewSettings().imageType === 'datagrid';
      var onChange = function () {
        var viewSettings = instance.getViewSettings();

        // if we're coming out of table view, go back to the default sort order so that the user knows what they're looking at
        if (isGrid && viewSettings.imageType !== 'datagrid') {
          var sorting = instance.getDefaultSorting();
          var defaultSortBy = sorting == null ? void 0 : sorting.sortBy;
          var defaultSortOrder = sorting == null ? void 0 : sorting.sortOrder;
          instance.setSortValueInternal(defaultSortBy, defaultSortOrder);
        }
        isGrid = viewSettings.imageType === 'datagrid';
        refreshAfterSettingsChange(instance);
      };
      var scrollX = instance.scrollDirection() === 'x';
      new ViewSettings().show({
        settingsKey: instance.getSettingsKey(),
        settings: instance.getViewSettings(),
        visibleSettings: instance.getVisibleViewSettings(),
        availableFields: scrollX ? [] : instance.getAvailableFields(),
        viewOptions: instance.getAvailableViewOptions(),
        positionTo: e.target.closest('button'),
        positionY: 'bottom',
        onChange: onChange
      });
    });
  }
  function setSelectedSortOption(instance, options) {
    var currentValues = instance.getSortValues();
    for (var i = 0, length = options.length; i < length; i++) {
      var opt = options[i];
      opt.selected = opt.value === currentValues.sortBy;
      if (opt.selected) {
        var icon = currentValues.sortOrder === 'Descending' ? '&#xe5DB;' : '&#xe5D8;';
        opt.asideIcon = icon;
        break;
      }
    }
  }
  function showSortMenu(e) {
    var instance = this;
    var options = instance.getSortMenuOptions();
    setSelectedSortOption(instance, options);
    showActionSheet({
      items: options,
      positionTo: e.target.closest('button'),
      positionY: 'bottom',
      hideTitleWhenNotFullscreen: true,
      title: _globalize.default.translate('HeaderSortBy'),
      // allow a little space between the borders
      offsetTop: 2,
      hasItemAsideIcon: true,
      hasItemSelectionState: true
    }).then(function (value) {
      instance.setSortValue(value);
    });
  }
  function ListController(view, params) {
    this.view = view;
    this.params = params;
    if (params.serverId) {
      this.apiClient = _connectionmanager.default.getApiClient(params.serverId);
    }
  }
  function setEmptyListMessage(html) {
    html = '<div class="flex padded-top align-items-center justify-content-center flex-grow flex-direction-column">' + html;
    html += '</div>';
    this.itemsContainer.setOtherInnerHTML(html);
    destroyHeader(this);
    var btnClearFilters = this.itemsContainer.querySelector('.btnClearFilters');
    if (btnClearFilters) {
      _dom.default.addEventListener(btnClearFilters, 'click', this.clearFilters.bind(this), {});
    }
  }
  function onMultiSelectActive(e) {
    var _itemsContainer$curre;
    var itemsContainer = this.itemsContainer;
    var renderer = (_itemsContainer$curre = itemsContainer.currentListOptions) == null ? void 0 : _itemsContainer$curre.renderer;
    if (renderer) {
      if (renderer.onMultiSelectActive) {
        renderer.onMultiSelectActive(itemsContainer, this._headerElement);
      }
    }
  }
  function onMultiSelectInactive(e) {
    var _itemsContainer$curre2;
    var itemsContainer = this.itemsContainer;
    var renderer = (_itemsContainer$curre2 = itemsContainer.currentListOptions) == null ? void 0 : _itemsContainer$curre2.renderer;
    if (renderer) {
      if (renderer.onMultiSelectInactive) {
        renderer.onMultiSelectInactive(itemsContainer, this._headerElement);
      }
    }
  }
  function onItemsContainerFocus(e) {
    var alphaPicker = this.alphaPicker;
    if (!alphaPicker) {
      return;
    }
    var item = _shortcuts.default.getItemFromChildNode(e.target, null, this.itemsContainer);
    if (item) {
      alphaPicker.setCurrentFromItem(item);
    }
  }
  function getAbortError() {
    var err = new Error('AbortError');
    err.name = 'AbortError';
    return err;
  }
  function onDataFetched(result) {
    var _instance$getParentIt;
    var instance = this;
    var values = instance.getSortValues();
    var alphaPickerAllowed = instance.enableAlphaPicker(values.sortBy, values.sortOrder);
    _dom.default.removeEventListener(instance.itemsContainer, 'focus', onItemsContainerFocus.bind(instance), {
      capture: true,
      passive: true
    });
    if (_layoutmanager.default.tv && alphaPickerAllowed) {
      _dom.default.addEventListener(instance.itemsContainer, 'focus', onItemsContainerFocus.bind(instance), {
        capture: true,
        passive: true
      });
    }
    var items = result.Items || result;
    var isRefresh = instance._isRefresh;
    var isFirstLoad;
    if (!isRefresh) {
      instance._isRefresh = true;
      isFirstLoad = true;
    }
    var totalRecordCount = result.TotalRecordCount || items.length;
    var firstItem = items[0];
    var context = instance.getContext();
    if (totalRecordCount === 1 && context === 'folders' && ((_instance$getParentIt = instance.getParentItem()) == null ? void 0 : _instance$getParentIt.Type) === 'Folder' && instance.enableAutoFolderJumpThrough(firstItem) && _usersettings.default.enableAutoFolderJumpThrough()) {
      // don't jump through after refreshing due to a filter or settings change because it could result in the user changing filters and then getting unexpectedly navigated
      if (isFirstLoad && !instance.getQueryInfo(true).hasFilters) {
        Emby.Page.replaceState(Emby.Page.getRouteUrl(firstItem, {
          context: context
        }), true);
        return Promise.reject(getAbortError());
      }
    }
    if (instance.getViewSettings(items).imageType !== 'datagrid') {
      return Promise.resolve(result);
    }
    return loadDataGrid().then(function () {
      return Promise.resolve(result);
    });
  }
  ListController.prototype.initItemsContainer = function () {
    var view = this.view;
    this.itemsContainer = view.querySelector('.itemsContainer');
    this.itemsContainer.setListClasses = true;
    this.itemsContainer.fetchData = this.getItems.bind(this);
    this.itemsContainer.onGetItems = this.onGetItems.bind(this);
    this.itemsContainer.virtualChunkSize = this.virtualChunkSize();
    this.itemsContainer.getListOptions = this.getListOptions.bind(this);
    this.itemsContainer.onDataFetched = onDataFetched.bind(this);
    this.itemsContainer.onRefreshing = this.onRefreshing.bind(this);
    this.itemsContainer.afterRefresh = this.afterItemsRefreshed.bind(this);
    this.itemsContainer.onGetItemsFailed = this.onGetItemsFailed.bind(this);
    this.itemsContainer.showColumnSelector = this.showColumnSelector.bind(this);
    this.itemsContainer.addEventListener('multiselectactive', onMultiSelectActive.bind(this));
    this.itemsContainer.addEventListener('multiselectinactive', onMultiSelectInactive.bind(this));
  };
  function bindAll(elems, eventName, fn) {
    for (var i = 0, length = elems.length; i < length; i++) {
      elems[i].addEventListener(eventName, fn);
    }
  }
  ListController.prototype.initButtons = function () {
    var view = this.view;
    var i, length;
    var hasAnyViewSettings;
    var btnViewSettings = view.querySelectorAll('.btnViewSettings');
    var supportsViewSettings = this.supportsViewSettings !== false;
    for (i = 0, length = btnViewSettings.length; i < length; i++) {
      btnViewSettings[i].addEventListener('click', showViewSettingsMenu.bind(this));
      if (supportsViewSettings) {
        hasAnyViewSettings = true;
        btnViewSettings[i].classList.remove('hide');
      }
    }
    var filterButtons = view.querySelectorAll('.btnFilter');
    this.filterButtons = filterButtons;
    var hasVisibleFilters = this.getVisibleFilters().length;
    for (i = 0, length = filterButtons.length; i < length; i++) {
      var btnFilter = filterButtons[i];
      btnFilter.addEventListener('click', this.showFilterMenu.bind(this));
      if (hasVisibleFilters) {
        hasAnyViewSettings = true;
        btnFilter.classList.remove('hide');
      } else {
        btnFilter.classList.add('hide');
      }
    }
    var sortButtons = view.querySelectorAll('.btnSort');
    this.sortButtons = sortButtons;
    var supportsSorting = this.supportsSorting();
    for (i = 0, length = sortButtons.length; i < length; i++) {
      var sortButton = sortButtons[i];
      sortButton.addEventListener('click', showSortMenu.bind(this));
      if (supportsSorting) {
        hasAnyViewSettings = true;
        sortButton.classList.remove('hide');
      } else {
        sortButton.classList.add('hide');
      }
    }
    this.btnSortText = view.querySelector('.btnSortText');
    this.btnSortIcon = view.querySelector('.btnSortIcon');
    if (this.enableAlphaNumericShortcuts == null) {
      this.enableAlphaNumericShortcuts = this.itemsContainer.getAttribute('data-alphanumericshortcuts') === 'true' && this.enableVirtualData();
    }
    var btnPlay = view.querySelectorAll('.btnPlay');
    var btnShuffle = view.querySelectorAll('.btnShuffle');
    var btnQueue = view.querySelectorAll('.btnQueue');
    bindAll(btnPlay, 'click', this.play.bind(this));
    bindAll(btnShuffle, 'click', this.shuffle.bind(this));
    bindAll(btnQueue, 'click', this.queue.bind(this));
    if (this.supportsPlay() && btnPlay.length) {
      hasAnyViewSettings = true;
    }
    if (this.supportsShuffle() && btnShuffle.length) {
      hasAnyViewSettings = true;
    }
    if (this.supportsQueue() && btnQueue.length) {
      hasAnyViewSettings = true;
    }
    var itemsViewSettingsContainer = view.querySelector('.itemsViewSettingsContainer');
    this.itemsViewSettingsContainer = itemsViewSettingsContainer;
    if (itemsViewSettingsContainer) {
      if (hasAnyViewSettings || this.enableTotalRecordCountDisplay !== false || this.hasOtherViewButtons) {
        itemsViewSettingsContainer.classList.remove('hide');
      } else {
        itemsViewSettingsContainer.classList.add('hide');
      }
      if (hasAnyViewSettings || this.hasOtherViewButtons) {
        itemsViewSettingsContainer.classList.add('focusable');
        itemsViewSettingsContainer.setAttribute('data-focusabletype', 'nearest');
      } else {
        itemsViewSettingsContainer.classList.remove('focusable');
        itemsViewSettingsContainer.removeAttribute('data-focusabletype');
      }
    }
  };
  ListController.prototype.saveSortingOnServer = function () {
    return false;
  };
  ListController.prototype.setSortValueInternal = function (value, sortOrder) {
    if (!sortOrder) {
      sortOrder = 'Ascending';
    }
    var settingsKey = this.getSettingsKey();
    var saveSortingOnServer = this.saveSortingOnServer();
    _usersettings.default.setFilter(this.getSortBySettingsKey(), value, saveSortingOnServer);
    _usersettings.default.setFilter(settingsKey + '-sortorder', sortOrder, saveSortingOnServer);
    this.updateSortText();
  };
  ListController.prototype.getDefaultSortingForField = function (fieldId) {
    var field = this.getAvailableField(fieldId);
    if (!field) {
      return null;
    }
    var sortOptions = this.getSortMenuOptions();
    for (var i = 0, length = sortOptions.length; i < length; i++) {
      var sortOption = sortOptions[i];
      if (sortOption.value === field.sortBy) {
        return {
          sortBy: sortOption.value,
          sortOrder: sortOption.defaultSortOrder
        };
      }
    }
  };
  ListController.prototype.setSortValue = function (value) {
    var currentValues = this.getSortValues();
    var sortOrder = currentValues.sortOrder;
    if (currentValues.sortBy === value) {
      sortOrder = sortOrder === 'Ascending' ? 'Descending' : 'Ascending';
    } else {
      var sortOptions = this.getSortMenuOptions();
      for (var i = 0, length = sortOptions.length; i < length; i++) {
        var sortOption = sortOptions[i];
        if (sortOption.value === value) {
          sortOrder = sortOption.defaultSortOrder;
          break;
        }
      }
    }
    this.setSortValueInternal(value, sortOrder);
    refreshAfterSettingsChange(this);
  };
  ListController.prototype.refreshPrefixes = function () {
    var instance = this;
    this.getPrefixes().then(function (prefixes) {
      instance.alphaPicker.setPrefixes(prefixes);
    });
  };
  function mapPrefix(i) {
    return i.Name;
  }
  ListController.prototype.getPrefixes = function () {
    if (this.params.type === 'search') {
      return Promise.resolve([]);
    }
    var queryInfo = this.getQueryInfo(false);
    var apiClient = getApiClient(this);
    var methodName = this.getPrefixesApiClientMethodName();
    var query = queryInfo.query;
    var sortBy = query.SortBy || '';
    if (sortBy.startsWith('AlbumArtist')) {
      methodName = 'getArtistPrefixes';
      query.ArtistType = 'AlbumArtist';
    } else if (sortBy.startsWith('Artist')) {
      methodName = 'getArtistPrefixes';
      query.ArtistType = 'Artist';
    }
    query.SortBy = null;
    query.StartIndex = null;
    query.Limit = null;
    query.Fields = null;
    query.EnableImageTypes = null;
    query.ImageTypeLimit = null;
    query.NameStartsWithOrGreater = null;
    query.ArtistStartsWithOrGreater = null;
    query.AlbumArtistStartsWithOrGreater = null;
    query.IncludeItemTypes = this.getPrefixQueryIncludeItemTypes().join(',') || null;
    var promise;
    switch (this.getDisplayPreset()) {
      case 'User':
        promise = apiClient.getUserPrefixes(queryInfo.query);
        break;
      default:
        promise = methodName === 'getLiveTvChannelTagPrefixes' ? apiClient[methodName](query) : apiClient[methodName](apiClient.getCurrentUserId(), query);
        break;
    }
    return promise.then(function (result) {
      return result.map(mapPrefix);
    });
  };
  ListController.prototype.getCommandOptions = function (item) {
    var _this$itemsContainer;
    return ((_this$itemsContainer = this.itemsContainer) == null ? void 0 : _this$itemsContainer.getCommandOptions(item)) || {};
  };
  ListController.prototype.getDataGridOptions = function (items, availableFields) {
    var options = Object.assign(this.getBaseListRendererOptions(items), {
      columns: availableFields
    });
    if (!_layoutmanager.default.tv) {
      options.action = 'none';
    }
    options.sortValues = this.getSortValues();
    return options;
  };
  ListController.prototype.getAvailableViewOptions = function () {
    var list = [];
    list.push('primary');
    list.push('banner');
    list.push('disc');
    list.push('logo');
    list.push('thumb');
    list.push('list');
    list.push('datagrid');
    return list.filter(this.supportsViewType.bind(this));
  };
  ListController.prototype.supportsViewType = function (viewType) {
    switch (viewType) {
      case 'datagrid':
        var itemType = this.getDisplayPreset() || '';
        switch (itemType) {
          case 'TvChannel':
            // todo: not supporting datagrid right now due to it's custom sorting, but revisit
            return false;
          default:
            return this.scrollDirection() === 'y';
        }
      default:
        return true;
    }
  };
  function isNotName(n) {
    return n !== 'Name';
  }
  function isNotAirTime(n) {
    return n !== 'AirTime';
  }
  function isNotParentName(n) {
    return n !== 'ParentName';
  }
  function adjustListOptionsForGroupingProgramsBySeries(instance, items, options) {
    if (instance.params.type === 'search') {
      return;
    }
    if (!items.length || !items[0].AsSeries) {
      return;
    }
    options.progress = false;
    options.showAirDateTime = false;
    options.fields = options.fields.filter(isNotName).filter(isNotAirTime).filter(isNotParentName);
    options.fields.push('ParentNameOrName');
  }
  function modifyFieldsInListOptions(instance, items, options, settings) {
    var itemType = instance.getDisplayPreset() || '';
    var params = instance.params;
    switch (itemType) {
      case '':
        if (settings.fields.includes('Name')) {
          options.fields.push('ParentName');
        }
        break;
      case 'Game':
      case 'MusicVideo':
      case 'MusicAlbum':
      case 'Audio':
        if (settings.fields.includes('Name')) {
          options.fields.push('ParentName');
        }
        break;
      case 'Episode':
        if (settings.fields.includes('Name')) {
          options.fields.unshift('ParentName');
        }
        break;
      case 'TvChannel':
        if (params.type === 'OnNow') {
          options.programsAsSeries = true;
          options.action = 'programlink';
          options.showCurrentProgramImage = true;
        }
        if (settings.fields.includes('Name')) {
          if (params.type === 'OnNow') {
            options.fields.unshift('CurrentProgramName');
            options.fields.unshift('CurrentProgramParentName');
            options.fields.push('CurrentProgramTime');
          } else {
            options.fields.push('CurrentProgramParentName');
            options.fields.push('CurrentProgramTime');
          }
        }
        break;
      case 'Program':
        options.showAirDateTime = true;
        if (settings.fields.includes('Name')) {
          if (params.IsMovie !== 'true') {
            options.fields.push('ParentName');
          }
          if (params.type !== 'Recordings') {
            options.fields.push('AirTime');
          }
        }
        break;
      default:
        break;
    }
  }
  ListController.prototype.getCardOptions = function (items, settings) {
    var params = this.params;
    var shape;
    var preferThumb;
    var preferDisc;
    var preferLogo;
    var defaultShape;
    var itemType = this.getDisplayPreset() || '';
    if (settings.imageType === 'banner') {
      shape = 'banner';
    } else if (settings.imageType === 'disc') {
      shape = 'square';
      preferDisc = true;
    } else if (settings.imageType === 'logo') {
      shape = 'backdrop';
      preferLogo = true;
    } else if (settings.imageType === 'thumb') {
      shape = 'backdrop';
      preferThumb = true;
    } else {
      switch (itemType) {
        case 'Program':
        case 'TvChannel':
          shape = "auto";
          preferThumb = "auto";
          defaultShape = params.IsMovie === 'true' || params.type === 'OnNow' ? 'portrait' : "backdrop";
          break;
        default:
          if (params.type === 'nextup') {
            shape = 'backdrop';
            if (settings.imageType === 'thumb') {
              preferThumb = true;
            } else {
              preferThumb = false;
            }
          } else {
            shape = 'auto';
          }
          break;
      }
    }
    var options = Object.assign(this.getBaseListRendererOptions(items), {
      shape: shape,
      preferThumb: preferThumb,
      preferDisc: preferDisc,
      preferLogo: preferLogo,
      fields: settings.fields,
      parentId: this.isGlobalQuery() ? null : this.params.parentId,
      cardSize: this.getViewSettings().cardSize,
      defaultShape: defaultShape
    });
    modifyFieldsInListOptions(this, items, options, settings);
    adjustListOptionsForGroupingProgramsBySeries(this, items, options);
    switch (itemType) {
      case 'TvChannel':
        if (!options.preferThumb) {
          options.preferThumb = 'auto';
        }
        options.defaultBackground = true;
        if (!options.showCurrentProgramImage) {
          options.paddedImage = true;
        }
        break;
      case 'Audio':
        options.sideFooter = true;
        break;
      case 'SeriesTimer':
        if (settings.fields.includes('Name')) {
          options.fields.push('SeriesTimerChannel');
          options.fields.push('SeriesTimerTime');
        }
        if (!options.preferThumb) {
          options.preferThumb = 'auto';
        }
        break;
      default:
        break;
    }
    switch (itemType) {
      case 'MusicArtist':
        options.round = true;
        break;
      default:
        break;
    }
    options.overlayText = options.fields.length === 0 || options.fields[0] === 'None';
    options.context = this.getContext();
    options.typeIndicator = options.context === 'folders';
    if (this.scrollDirection() === 'x') {
      //options.overlayText = true;
      options.centerText = false;
      options.horizontalGrid = true;

      // for now
      options.fields = [];
    }
    return options;
  };
  ListController.prototype.getListViewOptions = function (items, settings) {
    var options = this.getBaseListRendererOptions(items);
    options.fields = settings.fields || [];
    var itemType = this.getDisplayPreset() || '';
    modifyFieldsInListOptions(this, items, options, settings);
    adjustListOptionsForGroupingProgramsBySeries(this, items, options);
    switch (itemType) {
      case '':
      case 'SyncJob':
      case 'Playlist':
        options.imageSize = 'small';
        break;
      case 'Audio':
      case 'Log':
        options.imageSize = 'smaller';
        break;
      case 'BoxSet':
      case 'MusicAlbum':
      case 'Trailer':
      case 'Movie':
      case 'Program':
      case 'TvChannel':
      case 'Genre':
      case 'MusicGenre':
      case 'GameGenre':
      case 'Tag':
      case 'Studio':
      case 'MusicArtist':
      case 'Person':
      case 'Video':
      case 'Episode':
      case 'Series':
      case 'Photo':
      case 'PhotoAlbum':
      case 'Game':
      case 'GameSystem':
        options.imageSize = 'medium';
        break;
      default:
        // lists that are icon only
        options.imageSize = 'smallest';
        break;
    }
    return options;
  };
  ListController.prototype.getBaseListRendererOptions = function (items, settings) {
    var multiSelect;
    var draggable = true;
    var itemType = this.getDisplayPreset() || '';
    switch (itemType) {
      case 'Program':
        multiSelect = false;
        draggable = false;
        break;
      case 'TvChannel':
        multiSelect = false;
        break;
      default:
        multiSelect = true;
        break;
    }
    var action;
    var playAction;
    switch (itemType) {
      case 'Photo':
      case 'Audio':
        action = 'playallfromhere';
        playAction = 'playallfromhere';
        break;
      default:
        var isAllAudioOrPhoto = allItemsAudioOrPhoto(items);
        action = isAllAudioOrPhoto ? 'playallfromhere' : null;
        playAction = isAllAudioOrPhoto ? 'playallfromhere' : null;
        break;
    }
    var params = this.params;
    if (params.type === 'search') {
      playAction = null;
      if (action === 'playallfromhere') {
        action = 'play';
      }
    }
    return {
      context: this.getContext(),
      draggable: draggable,
      multiSelect: multiSelect,
      playAction: playAction,
      action: action
    };
  };
  function getEnabledFields(availableFields, enabledFieldIds) {
    var list = [];
    for (var i = 0, length = availableFields.length; i < length; i++) {
      var field = availableFields[i];
      if (enabledFieldIds.includes(field.id)) {
        list.push(field);
      }
    }
    return list;
  }
  ListController.prototype.getListOptions = function (items) {
    var settings = this.getViewSettings(items);
    if (settings.imageType === 'datagrid') {
      return {
        renderer: dataGrid,
        options: this.getDataGridOptions(items, getEnabledFields(this.getAvailableFields(), settings.fields)),
        virtualScrollLayout: 'vertical',
        commandOptions: this.getCommandOptions()
      };
    }
    if (settings.imageType === 'list') {
      return {
        renderer: _listview.default,
        options: this.getListViewOptions(items, settings),
        virtualScrollLayout: 'vertical',
        commandOptions: this.getCommandOptions()
      };
    }
    return {
      renderer: _cardbuilder.default,
      options: this.getCardOptions(items, settings),
      virtualScrollLayout: this.getCardVirtualScrollLayout(),
      commandOptions: this.getCommandOptions()
    };
  };
  ListController.prototype.getCardVirtualScrollLayout = function () {
    if (this.scrollDirection() === 'x') {
      return 'horizontal-grid';
    }
    return 'vertical-grid';
  };
  function getAvailableFieldIdMap(instance) {
    var fields = instance.getAvailableFields();
    var result = {};
    for (var i = 0, length = fields.length; i < length; i++) {
      var field = fields[i];
      result[field.id] = field;
    }
    return result;
  }
  ListController.prototype.getAvailableField = function (id) {
    return this.getAvailableFields()[id];
  };
  ListController.prototype.getAvailableFields = function () {
    var fields = this._availableFields;
    if (!fields) {
      var fieldList = this.getAvailableFieldsInternal();
      for (var i = 0, length = fieldList.length; i < length; i++) {
        var field = fieldList[i];
        fieldList[field.id] = field;
      }
      fields = fieldList;
      this._availableFields = fields;
    }
    return fields;
  };
  ListController.prototype.getAvailableFieldsInternal = function () {
    var params = this.params;
    if (params.parentId === 'downloads') {
      return [];
    }
    if (params.type === 'search') {
      return [];
    }
    var fields = _itemmanager.default.getAvailableFields({
      itemType: this.getDisplayPreset(),
      apiClient: getApiClient(this),
      parentItem: this.getParentItem()
    });

    // need to generalize this. the type Episode supports sorting, but this specific screen is disabling it
    if (params.type === 'missingepisodes') {
      for (var i = 0, length = fields.length; i < length; i++) {
        fields[i].sortBy = null;
      }
    }
    return fields;
  };
  ListController.prototype.getVisibleViewSettings = function () {
    var params = this.params;
    if (params.parentId === 'downloads') {
      return [];
    }
    if (params.type === 'search') {
      return [];
    }
    var viewScrollX = this.scrollDirection() === 'x';
    var settings = [];
    var itemType = this.getDisplayPreset() || '';
    if (!viewScrollX) {
      switch (itemType) {
        case 'Photo':
        case 'Server':
          break;
        default:
          settings.push('imageType');
          break;
      }
    }
    settings.push('imageSize');
    switch (itemType) {
      case '':
      case 'Audio':
      case 'MusicAlbum':
      case 'Game':
      case 'Movie':
      case 'MusicVideo':
      case 'Video':
      case 'Trailer':
      case 'Episode':
      case 'Series':
      case 'Book':
        settings.push('groupItemsIntoCollections');
        break;
      default:
        break;
    }
    switch (itemType) {
      case 'TvChannel':
        settings.push('groupItemsIntoTags');
        break;
      default:
        break;
    }
    return settings;
  };
  ListController.prototype.showColumnSelector = function (originalEvent) {
    var availableFields = this.getAvailableFields().filter(function (a) {
      return !a.viewTypes || (a.viewTypes || '').includes('datagrid');
    });
    var instance = this;
    var options = {
      items: availableFields,
      positionTo: originalEvent.target,
      positionX: 'after',
      positionY: 'bottom',
      positionClientY: originalEvent.clientY,
      positionClientX: originalEvent.clientX,
      // allow a little space between the borders
      offsetTop: 2,
      hasItemSelectionState: false,
      multiple: true,
      emptyValueSetEqualsAll: true,
      selectedValues: instance.getViewSettings([]).fields,
      onChange: function (fields) {
        _usersettings.default.set(instance.getSettingsKey() + '-fields', fields.join(','), false);
        refreshAfterSettingsChange(instance);
      }
    };
    showActionSheet(options);
  };
  function filterFields(availableFieldIds, userConfiguredFields) {
    var list = [];
    for (var i = 0, length = userConfiguredFields.length; i < length; i++) {
      if (availableFieldIds[userConfiguredFields[i]]) {
        list.push(userConfiguredFields[i]);
      }
    }
    return list;
  }
  function allItemsAudioOrPhoto(items) {
    var i, length;
    var matches = 0;
    for (i = 0, length = items.length; i < length; i++) {
      var item = items[i];
      if (!item) {
        continue;
      }
      if (item.IsFolder || item.MediaType !== 'Audio' && item.MediaType !== 'Photo') {
        return false;
      }
      matches++;
    }
    return matches > 0;
  }
  function allItemsAudio(items) {
    var i, length;
    var hasIndexNumber;
    var matches = 0;
    for (i = 0, length = items.length; i < length; i++) {
      var item = items[i];
      if (!item) {
        continue;
      }
      if (item.IsFolder || item.MediaType !== 'Audio') {
        return false;
      }
      matches++;
      if (item.IndexNumber) {
        hasIndexNumber = true;
      }
    }
    return hasIndexNumber && matches > 0;
  }
  function detectDefaultViewType(instance, defaults, items) {
    var viewType = instance._defaultViewType;
    if (viewType) {
      return viewType;
    }
    items = items || instance.itemsContainer.items || [];
    if (items.length) {
      if (allItemsAudio(items)) {
        viewType = instance._defaultViewType = 'list';
      }
    }
    return viewType;
  }
  function enableAutoDefaultToTableView() {
    if (_dom.default.getWindowSize().innerWidth < 1600) {
      return false;
    }
    try {
      return window.matchMedia("(pointer: fine)");
    } catch (err) {
      console.error('error in matchmedia: ', err);
    }
  }
  ListController.prototype.getViewSettingDefaults = function (parentItem, listItems, availableFields) {
    var defaults = {};
    defaults.fields = availableFields.filter(function (a) {
      return a.defaultVisible === '*' || (a.defaultVisible || '').includes('cards');
    }).map(function (a) {
      return a.id;
    });
    if (this.params.defaultView) {
      defaults.imageType = this.params.defaultView;
    } else if (this.getContext() === 'folders') {
      defaults.imageType = detectDefaultViewType(this, defaults, listItems);
    }
    if (!defaults.imageType) {
      var itemType = this.getDisplayPreset() || '';
      switch (itemType) {
        case 'Audio':
        case 'Log':
          if (!_layoutmanager.default.tv && enableAutoDefaultToTableView()) {
            defaults.imageType = 'datagrid';
          } else {
            defaults.imageType = 'list';
          }
          if (!this.supportsViewType(defaults.imageType)) {
            defaults.imageType = 'primary';
          }
          break;
        case 'ApiKey':
        case 'ChannelManagementInfo':
        case 'LogLine':
          defaults.imageType = 'list';
          break;
        default:
          defaults.imageType = 'primary';
          break;
      }
    }
    return defaults;
  };
  ListController.prototype.getViewSettings = function (items) {
    if (!items) {
      items = this.itemsContainer.getItems();
    }
    var basekey = this.getSettingsKey();
    var availableFieldIds = getAvailableFieldIdMap(this);
    var availableFields = this.getAvailableFields();
    var item = this.getParentItem();
    var defaults = this.getViewSettingDefaults(item, items, availableFields);
    var viewType = _usersettings.default.get(basekey + '-imageType', false) || defaults.imageType;
    var cardSize = _usersettings.default.get(basekey + '-cardSize', false) || 'default';
    var userConfiguredFields = _usersettings.default.get(basekey + '-fields', false);
    if (userConfiguredFields === 'None' && (viewType === 'datagrid' || viewType === 'list')) {
      userConfiguredFields = null;
    }
    if (userConfiguredFields) {
      userConfiguredFields = userConfiguredFields.split(',');
      userConfiguredFields = filterFields(availableFieldIds, userConfiguredFields);
    }
    var defaultFields = defaults.fields.slice(0);
    var tableDefaultFields = availableFields.filter(function (a) {
      return a.defaultVisible === '*' || (a.defaultVisible || '').includes('datagrid');
    }).map(function (a) {
      return a.id;
    });
    if (!userConfiguredFields || !userConfiguredFields.length && viewType === 'datagrid') {
      userConfiguredFields = viewType === 'datagrid' ? tableDefaultFields.slice(0) : defaultFields.slice(0);
    }
    return {
      fields: userConfiguredFields,
      groupItemsIntoTags: _usersettings.default.get(basekey + '-groupItemsIntoTags', true) === 'true',
      groupItemsIntoCollections: _usersettings.default.get(basekey + '-groupItemsIntoCollections', true) === 'true',
      imageType: viewType,
      cardSize: cardSize,
      defaultFields: defaultFields,
      tableDefaultFields: tableDefaultFields
    };
  };
  ListController.prototype.autoFocus = function (options) {
    options = Object.assign({
      skipIfNotEnabled: true
    }, options);
    var elem = _focusmanager.default.autoFocus(this.itemsContainer, options);
    if (elem) {
      return elem;
    }
    if (options.skipIfNotEnabled && !_focusmanager.default.isAutoFocusEnabled()) {
      return null;
    }
    var view = this.view;
    if (view) {
      elem = _focusmanager.default.autoFocus(view, options);
      if (elem) {
        return elem;
      }
    }
    elem = _maintabsmanager.default.focus();
    if (elem) {
      return elem;
    }
    return null;
  };
  ListController.prototype.getParentItem = function () {
    var _this$options;
    return this.currentItem || ((_this$options = this.options) == null ? void 0 : _this$options.item);
  };
  ListController.prototype.enableAutoFolderJumpThrough = function (toItem) {
    return false;
  };
  ListController.prototype.play = function () {
    var instance = this;
    return loadMultiSelect().then(function (MultiSelect) {
      if (MultiSelect != null && MultiSelect.canPlay()) {
        MultiSelect.play();
        return;
      }
      var parentItem = instance.getParentItem();
      var params = instance.params;

      // Normally we just tell playbackManager we want to play a certain item
      // But if there are filters selected, it currently does not handle that and we'll have to run the filter here and figure out the resulting items
      if (parentItem && !instance.getQueryInfo(true).hasFilters && !params.type && !_connectionmanager.default.getApiClient(parentItem).isMinServerVersion('4.8.0.30')) {
        var values = instance.getSortValues();
        var sortBy = values.sortBy;
        if (sortBy === 'SortName') {
          return _playbackmanager.default.play({
            items: [parentItem],
            parentId: params.parentId,
            // for photos
            autoplay: true
          });
        }
      }
      return instance.getItems({
        Limit: 300
      }).then(function (result) {
        _playbackmanager.default.play({
          items: result.Items,
          // for photos
          autoplay: true,
          parentId: params.parentId
        });
      });
    });
  };
  ListController.prototype.shuffle = function () {
    var instance = this;
    return loadMultiSelect().then(function (MultiSelect) {
      if (MultiSelect != null && MultiSelect.canPlay()) {
        MultiSelect.shuffle();
        return;
      }
      var parentItem = instance.getParentItem();
      var params = instance.params;
      if (parentItem && !instance.getQueryInfo(true).hasFilters && !_connectionmanager.default.getApiClient(parentItem).isMinServerVersion('4.8.0.30')) {
        _playbackmanager.default.shuffle(parentItem, null, {
          parentId: params.parentId,
          // for photos
          autoplay: true
        });
        return;
      }
      return instance.getItems({
        Limit: 300
      }).then(function (result) {
        _playbackmanager.default.play({
          items: result.Items,
          // for photos
          autoplay: true,
          shuffle: true,
          parentId: params.parentId
        });
      });
    });
  };
  ListController.prototype.queue = function () {
    // Normally we just tell playbackManager we want to queue a certain item
    // But if there are filters selected, it currently does not handle that and we'll have to run the filter here and figure out the resulting items
    // Commenting this out for now because it also doesn't handle sorting
    //if (parentItem && !this.getQueryInfo(true).hasFilters) {
    //    playbackManager.queue({
    //        items: [parentItem],
    //        parentId: params.parentId
    //    });
    //    return;
    //}

    this.getItems({
      Limit: 300
    }).then(function (result) {
      _playbackmanager.default.queue({
        items: result.Items
      });
    });
  };
  ListController.prototype.isGlobalQuery = function () {
    // apply parentId to queries
    return false;
  };
  ListController.prototype.virtualChunkSize = function () {
    return null;
  };
  ListController.prototype.enableVirtualData = function () {
    return this.itemsContainer.hasAttribute('data-virtualscrolllayout');
  };
  ListController.prototype.getItemCountText = function (numItems) {
    if (numItems === 1) {
      return _globalize.default.translate('ValueOneItem');
    } else {
      return _globalize.default.translate('ItemCount', numItems);
    }
  };
  function hideOrShowAll(elems, hide) {
    for (var i = 0, length = elems.length; i < length; i++) {
      if (hide) {
        elems[i].classList.add('hide');
      } else {
        elems[i].classList.remove('hide');
      }
    }
  }
  function updateAlphaPickerState(instance, numItems) {
    var values = instance.getSortValues();
    var alphaPickerAllowed = instance.enableAlphaPicker(values.sortBy, values.sortOrder);
    if (alphaPickerAllowed) {
      instance.initAlphaNumericShortcuts();
    } else {
      instance.destroyAlphaNumericShortcuts();
    }
    if (!instance.alphaPicker) {
      return;
    }
    var alphaPicker = instance.alphaPickerElement;
    if (!alphaPicker) {
      return;
    }
    if (alphaPickerAllowed && numItems > 30) {
      alphaPicker.classList.remove('hide');
      instance.refreshPrefixes();
    } else {
      alphaPicker.classList.add('hide');
      var paddingElement = instance.getInlinePaddingElement();
      if (paddingElement) {
        paddingElement.classList.remove('padded-left-withalphapicker', 'padded-right-withalphapicker');
      }
    }
  }
  ListController.prototype.getPrefixesApiClientMethodName = function () {
    return 'getPrefixes';
  };
  ListController.prototype.getApiClientQueryMethodName = function () {
    return 'getItems';
  };
  ListController.prototype.getPrefixQueryIncludeItemTypes = function () {
    return this.getQueryIncludeItemTypes();
  };
  ListController.prototype.getQueryIncludeItemTypes = function () {
    return this.getItemTypes();
  };
  function allMatch(arr1, arr2) {
    for (var i = 0, length = arr2.length; i < length; i++) {
      if (!arr1.includes(arr2[i])) {
        return false;
      }
    }
    return true;
  }
  ListController.prototype.getContext = function () {
    var types = getDisplayItemTypes(this);
    if (allMatch(types, ['Program', 'TvChannel', 'Timer', 'SeriesTimer', 'Recording'])) {
      return 'livetv';
    }
    if (allMatch(types, ['Series', 'Episode'])) {
      return 'tvshows';
    }
    var parentItem = this.getParentItem();
    return parentItem == null ? void 0 : parentItem.CollectionType;
  };
  ListController.prototype.getSortBySettingsKey = function (sortMenuOptions) {
    var basekey = this.getSettingsKey();
    return basekey + '-sortby';
  };
  ListController.prototype.getSortByValue = function () {
    var saveSortingOnServer = this.saveSortingOnServer();
    return _usersettings.default.getFilter(this.getSortBySettingsKey(), saveSortingOnServer);
  };
  ListController.prototype.getVisibleFilters = function () {
    var list = [];
    var fieldIds = getAvailableFieldIdMap(this);
    var itemType = this.getDisplayPreset();
    if (fieldIds.Played) {
      list.push('IsUnplayed');
      list.push('IsPlayed');
      switch (itemType) {
        case '':
        case 'Movie':
        case 'Episode':
        case 'Trailer':
        case 'Audio':
        case 'MusicVideo':
        case 'Video':
          list.push('IsResumable');
          break;
        default:
          break;
      }
    }
    var params = this.params;
    if (fieldIds.IsFavorite && !params.IsFavorite) {
      list.push('IsFavorite');
    }
    switch (itemType) {
      case 'Movie':
      case 'Episode':
      case 'Trailer':
      case 'MusicVideo':
      case 'Video':
        list.push('AudioCodecs');
        list.push('AudioLayouts');
        list.push('VideoCodecs');
        list.push('ExtendedVideoTypes');
        list.push('SubtitleCodecs');
        list.push('HasSubtitles');
        list.push('VideoType');
        break;
      default:
        break;
    }
    switch (itemType) {
      case 'Movie':
      case 'Episode':
      case 'Video':
      case 'Series':
        var apiClient = getApiClient(this);
        if (apiClient.isMinServerVersion('4.9.0.42')) {
          list.push('IsDuplicate');
        }
        break;
      default:
        break;
    }
    switch (itemType) {
      case 'Audio':
        list.push('HasLyrics');
        break;
      default:
        break;
    }
    switch (itemType) {
      case 'Movie':
      case 'Series':
      case 'Season':
      case 'Episode':
      case 'MusicVideo':
      case 'Video':
      case 'Trailer':
      case 'Person':
        list.push('HasTmdbId');
        break;
      default:
        break;
    }
    switch (itemType) {
      case 'Movie':
      case 'Series':
      case 'Season':
      case 'Episode':
      case 'MusicVideo':
      case 'Video':
      case 'Trailer':
      case 'BoxSet':
      case 'Person':
        list.push('HasImdbId');
        break;
      default:
        break;
    }
    switch (itemType) {
      case 'Movie':
      case 'Series':
      case 'Season':
      case 'Episode':
      case 'MusicVideo':
      case 'Video':
      case 'Trailer':
        list.push('HasTvdbId');
        break;
      default:
        break;
    }
    switch (itemType) {
      case 'Movie':
      case 'Series':
      case 'Season':
      case 'Episode':
      case 'BoxSet':
      case 'MusicVideo':
      case 'Video':
      case 'Game':
        list.push('HasTrailer');
        list.push('HasSpecialFeature');
        list.push('HasThemeSong');
        list.push('HasThemeVideo');
        break;
      default:
        break;
    }
    if (fieldIds.Video3DFormat) {
      list.push('Is3D');
    }
    if (fieldIds.Resolution) {
      list.push('Resolution');
    }
    if (fieldIds.Container) {
      list.push('Containers');
    }
    if (fieldIds.ProductionYear) {
      list.push('Years');
    }
    if (fieldIds.Genres && !params.genreId && !params.musicGenreId && !params.gameGenreId) {
      list.push('Genres');
    }
    if (fieldIds.Studios && !params.studioId) {
      list.push('Studios');
    }
    if (fieldIds.Tags && !params.tagId) {
      list.push('Tags');
    }
    if (fieldIds.OfficialRating) {
      list.push('OfficialRatings');
    }
    switch (itemType) {
      case 'Movie':
      case 'Series':
      case 'Season':
      case 'Episode':
      case 'BoxSet':
      case 'Trailer':
      case 'Audio':
      case 'MusicAlbum':
      case 'MusicArtist':
      case 'Playlist':
      case 'Video':
      case 'Game':
      case 'Book':
      case 'Person':
      case 'GameSystem':
      case 'Photo':
      case 'TvChannel':
        list.push('HasOverview');
        list.push('IsLocked');
        break;
      default:
        break;
    }
    switch (itemType) {
      case 'Series':
        list.push('SeriesStatus');
        break;
      default:
        break;
    }
    return list;
  };
  ListController.prototype.getDefaultSorting = function () {
    if (this.getContext() === 'folders') {
      var _this$getParentItem;
      // detect if we should default to filename sorting for folder view
      // a better way would be to have the consumer pass this in to indicate that we're in folder view,
      // but for now this will produce the right default in the majority of situations
      var parentItemType = (_this$getParentItem = this.getParentItem()) == null ? void 0 : _this$getParentItem.Type;
      switch (parentItemType) {
        case 'CollectionFolder':
        case 'Folder':
          var field = this.getDefaultSortingForField('Filename');
          if (field) {
            return field;
          }
          break;
        default:
          break;
      }
    }
    return _itemmanager.default.getDefaultSorting({
      itemType: this.getDisplayPreset(),
      apiClient: getApiClient(this)
    });
  };
  ListController.prototype.getFilterMenuOptions = function () {
    var params = this.params;
    var query = {
      Recursive: this.getQueryInfo(false).Recursive
    };
    if (params.IsAiring) {
      query.IsAiring = params.IsAiring === 'true';
    }
    if (params.IsMovie) {
      query.IsMovie = params.IsMovie === 'true';
    }
    if (params.IsKids) {
      query.IsKids = params.IsKids === 'true';
    }
    if (params.IsNews) {
      query.IsNews = params.IsNews === 'true';
    }
    if (params.IsSeries) {
      query.IsSeries = params.IsSeries === 'true';
    }
    if (params.IsSports) {
      query.IsSports = params.IsSports === 'true';
    }
    return query;
  };
  ListController.prototype.getItemTypes = function () {
    return [];
  };
  ListController.prototype.supportsPlay = function () {
    var itemType = this.getDisplayPreset() || '';
    switch (itemType) {
      case '':
      case 'Movie':
      case 'Episode':
      case 'Trailer':
      case 'Audio':
      case 'MusicAlbum':
      case 'MusicArtist':
      case 'MusicVideo':
      case 'Video':
      case 'Photo':
        return true;
      default:
        return false;
    }
  };
  ListController.prototype.supportsShuffle = function () {
    return this.supportsPlay();
  };
  ListController.prototype.supportsQueue = function () {
    return this.supportsPlay();
  };
  ListController.prototype.supportsAlphaPicker = function () {
    var itemType = this.getDisplayPreset();
    switch (itemType) {
      case 'Episode':
        if (this.params.type === 'missingepisodes') {
          return false;
        }
        return true;
      case 'Movie':
      case 'Series':
      case 'Trailer':
      case 'Audio':
      case 'MusicAlbum':
      case 'MusicArtist':
      case 'MusicVideo':
      case 'Video':
      case 'Genre':
      case 'MusicGenre':
      case 'GameGenre':
      case 'Book':
      case 'Game':
      case 'BoxSet':
      case 'Playlist':
      case 'Tag':
      case 'TvChannel':
        return true;
      case 'LogLine':
        return false;
      case 'Photo':
        var settings = this.getViewSettings();
        var visibleFields = settings.fields;
        return visibleFields.includes('Name');
      default:
        break;
    }
    if (this.getParentItem()) {
      return true;
    }
    return false;
  };
  ListController.prototype.enableAlphaPicker = function (sortBy, sortOrder) {
    if (!this.supportsAlphaPicker()) {
      return false;
    }
    if (this.scrollDirection() === 'x') {
      // not yet
      return false;
    }
    var params = this.params;
    if (params.type === 'search') {
      return false;
    }
    sortBy = sortBy || '';
    if (sortBy === 'SortName') {
      return true;
    }
    if (sortBy.startsWith('AlbumArtist') || sortBy.startsWith('Artist')) {
      return true;
    }
    return false;
  };
  ListController.prototype.getInlinePaddingElement = function () {
    return this.itemsContainer.closest('.padded-left');
  };
  ListController.prototype.initAlphaPicker = function () {
    if (this.alphaPicker) {
      return;
    }
    this.alphaPickerElement = this.view.querySelector('.alphaPicker');
    var alphaPickerElement = this.alphaPickerElement;
    if (!alphaPickerElement) {
      return;
    }
    var paddingElement = this.getInlinePaddingElement();
    if (_layoutmanager.default.tv) {
      alphaPickerElement.classList.add('alphaPicker-fixed-left');
      alphaPickerElement.classList.remove('alphaPicker-fixed-right');
      if (paddingElement) {
        paddingElement.classList.add('padded-left-withalphapicker');
        paddingElement.classList.remove('padded-right-withalphapicker');
      }
    } else {
      alphaPickerElement.classList.add('alphaPicker-fixed-right');
      alphaPickerElement.classList.remove('alphaPicker-fixed-left');
      if (paddingElement) {
        paddingElement.classList.remove('padded-left-withalphapicker');
        paddingElement.classList.add('padded-right-withalphapicker');
      }
    }
    this.alphaPicker = new _alphapicker.default({
      element: alphaPickerElement,
      itemsContainer: this.itemsContainer,
      prefixes: [],
      setValueOnFocus: true
    });
    this.alphaPicker.on('alphavaluechanged', onAlphaValueChanged.bind(this));
  };
  function onSearchResultsFetched(result) {
    if (result.ItemTypes) {
      this.refreshSearchTabs(result.ItemTypes);
    }
    return result;
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
  ListController.prototype.getBaseQuery = function (item) {
    var params = this.params;
    var parentId = params.parentId;
    var sortValues = this.getSortValues();
    var fields = this.getRequestedItemFields();
    var settings = this.getViewSettings();
    if (settings.imageType === 'primary' || settings.imageType === 'list' || settings.imageType === 'datagrid') {
      fields += ",PrimaryImageAspectRatio";
      if (params.type === 'OnNow') {
        fields += ",ProgramPrimaryImageAspectRatio";
      }
    }
    var visibleFields = settings.fields;
    if (visibleFields.includes('ProductionYear') || settings.imageType === 'list') {
      fields += ",ProductionYear";

      // for Series
      fields += ',Status,EndDate';
    }
    if (visibleFields.includes('CommunityRating') || settings.imageType === 'list') {
      fields += ",CommunityRating";
    }
    if (visibleFields.includes('OfficialRating') || settings.imageType === 'list') {
      fields += ",OfficialRating";
    }
    if (visibleFields.includes('CriticRating') || settings.imageType === 'list') {
      fields += ",CriticRating";
    }
    if (visibleFields.includes('PremiereDate')) {
      fields += ",PremiereDate";
    }
    if (visibleFields.includes('StartDate')) {
      fields += ",StartDate";
    }
    if (visibleFields.includes('DateCreated')) {
      fields += ",DateCreated";
    }
    if (visibleFields.includes('DateModified')) {
      fields += ",DateModified";
    }
    if (visibleFields.includes('Resolution')) {
      fields += ",Width,Height";
    }
    if (visibleFields.includes('Bitrate')) {
      fields += ",Bitrate";
    }
    if (visibleFields.includes('Size')) {
      fields += ",Size";
    }
    if (visibleFields.includes('Container')) {
      fields += ",Container";
    }
    if (visibleFields.includes('Video3DFormat')) {
      fields += ",Video3DFormat";
    }
    if (visibleFields.includes('Genres')) {
      fields += ",Genres";
    }
    if (visibleFields.includes('Studios')) {
      fields += ",Studios";
    }
    if (visibleFields.includes('Tags')) {
      fields += ",Tags";
    }
    if (visibleFields.includes('Filename')) {
      fields += ",Filename";
    }
    if (visibleFields.includes('Path')) {
      fields += ",Path";
    }
    if (visibleFields.includes('Overview')) {
      fields += ",Overview";
    }
    if (visibleFields.includes('OriginalTitle')) {
      fields += ",OriginalTitle";
    }
    if (visibleFields.includes('SortName')) {
      fields += ",SortName";
    }
    if (visibleFields.includes('PlayCount')) {
      fields += ",UserDataPlayCount";
    }
    if (visibleFields.includes('DatePlayed')) {
      fields += ",UserDataLastPlayedDate";
    }
    if (visibleFields.includes('Tagline')) {
      fields += ",Taglines";
    }
    if (visibleFields.includes('AudioCodec')) {
      fields += ",AudioCodec";
    }
    if (visibleFields.includes('VideoCodec')) {
      fields += ",VideoCodec";
    }
    if (visibleFields.includes('Framerate')) {
      fields += ",AverageFramerate,RealFramerate";
    }
    var itemPersonTypes = [];
    if (visibleFields.includes('Director')) {
      fields += ",People";
      itemPersonTypes.push('Director');
    }
    if (this.enableAlphaPicker(sortValues.sortBy, sortValues.sortOrder) && _layoutmanager.default.tv) {
      fields += ",Prefix";
    }
    var imageTypes = this.getRequestedImageTypes();
    if (settings.imageType === 'banner') {
      imageTypes += ',Banner';
    } else if (settings.imageType === 'disc') {
      imageTypes += ',Disc';
    } else if (settings.imageType === 'logo') {
      imageTypes += ',Logo';
    }
    var query = {
      IncludeItemTypes: this.getQueryIncludeItemTypes().join(',') || null,
      Fields: fields,
      StartIndex: 0
    };
    if (itemPersonTypes.length) {
      query.ItemPersonTypes = itemPersonTypes.join(',');
    }
    this.addSortingToQuery(sortValues, query);
    if (params.mediaTypes) {
      query.MediaTypes = params.mediaTypes;
    }
    if (parentId && !this.isGlobalQuery()) {
      query.ParentId = parentId;
    }
    if (settings.imageType === 'datagrid') {
      // grids are showing images now.
      //query.EnableImages = false;
      //query.ImageTypeLimit = 0;
    } else {
      query.EnableImageTypes = imageTypes;
      query.ImageTypeLimit = 1;
    }
    if (params.type === 'OnNow') {
      query.EnableUserData = false;
    }
    if (params.type === 'Program') {
      query.HasAired = false;
    }
    if (params.IsFavorite === 'true') {
      query.IsFavorite = true;
    }
    if (params.IsDuplicate === 'true') {
      query.IsDuplicate = true;
    }
    if (params.IsMovie === 'true') {
      query.IsMovie = true;
    } else if (params.IsMovie === 'false') {
      query.IsMovie = false;
    }
    if (params.IsSeries === 'true') {
      query.IsSeries = true;
    } else if (params.IsSeries === 'false') {
      query.IsSeries = false;
    }
    if (params.IsNewOrPremiere === 'true') {
      query.IsNewOrPremiere = true;
    } else if (params.IsNewOrPremiere === 'false') {
      query.IsNewOrPremiere = false;
    }
    if (params.IsNews === 'true') {
      query.IsNews = true;
    } else if (params.IsNews === 'false') {
      query.IsNews = false;
    }
    if (params.IsSports === 'true') {
      query.IsSports = true;
    } else if (params.IsSports === 'false') {
      query.IsSports = false;
    }
    if (params.IsKids === 'true') {
      query.IsKids = true;
    } else if (params.IsKids === 'false') {
      query.IsKids = false;
    }
    if (params.type === 'OnNow') {
      query.IsAiring = true;
    } else if (params.IsAiring === 'true') {
      query.IsAiring = true;
    } else if (params.IsAiring === 'false') {
      query.IsAiring = false;
    }
    if (params.genreId) {
      query.GenreIds = params.genreId;
    }
    if (item) {
      if (item.Type === 'Studio') {
        query.StudioIds = item.Id;
        query.Recursive = true;
      } else if (item.Type === 'Tag') {
        query.TagIds = item.Id;
        query.Recursive = true;
      } else if (item.Type === 'Genre' || item.Type === 'GameGenre' || item.Type === 'MusicGenre') {
        query.GenreIds = item.Id;
        query.Recursive = true;
      } else if (item.Type === 'Person') {
        query.PersonIds = item.Id;
        query.Recursive = true;
      }
    }
    if (params.artistId) {
      query.ArtistIds = params.artistId;
    }
    if (params.albumArtistId) {
      query.AlbumArtistIds = params.albumArtistId;
    }
    if (this.isRecursiveQuery()) {
      query.Recursive = true;
    }
    if (params.mediaTypes) {
      query.IsFolder = false;
      query.IsVirtualItem = false;
      query.ExcludeItemTypes = 'Program';
    }
    return query;
  };
  ListController.prototype.addSortingToQuery = function (sortValues, query) {
    var sortOrder = sortValues.sortOrder;
    if (sortValues.sortBy && sortOrder) {
      var sortMenuOptions = this.getSortMenuOptions();
      var sortMenuOption = getSortMenuOption(sortMenuOptions, sortValues.sortBy);
      if (sortMenuOption && sortMenuOption['sortOrder' + sortOrder]) {
        sortOrder = sortMenuOption['sortOrder' + sortOrder];
      }
    }
    query.SortBy = sortValues.sortBy;
    query.SortOrder = sortOrder;
  };
  ListController.prototype.isRecursiveQuery = function () {
    var params = this.params;
    return params.type || params.mediaTypes || this.isGlobalQuery();
  };
  ListController.prototype.getQueryInfo = function (enableFilters) {
    var _this$options2;
    var query = this.getBaseQuery(this.getParentItem());
    var queryFilters = [];
    var hasFilters;
    if (((_this$options2 = this.options) == null ? void 0 : _this$options2.mode) === 'favorites') {
      queryFilters.push("IsFavorite");
    }
    if (enableFilters !== false) {
      var filters = this.getFilters();
      if (filters.SeriesStatus) {
        query.SeriesStatus = filters.SeriesStatus;
        hasFilters = true;
      }
      if (filters.IsPlayed) {
        queryFilters.push("IsPlayed");
        hasFilters = true;
      }
      if (filters.IsUnplayed) {
        queryFilters.push("IsUnplayed");
        hasFilters = true;
      }
      if (filters.IsFavorite) {
        queryFilters.push("IsFavorite");
        hasFilters = true;
      }
      if (filters.IsResumable) {
        queryFilters.push("IsResumable");
        hasFilters = true;
      }
      if (filters.IsDuplicate) {
        hasFilters = true;
        query.IsDuplicate = filters.IsDuplicate;
      }
      if (filters.Containers) {
        hasFilters = true;
        query.Containers = filters.Containers;
      }
      if (filters.AudioCodecs) {
        hasFilters = true;
        query.AudioCodecs = filters.AudioCodecs;
      }
      if (filters.AudioLayouts) {
        hasFilters = true;
        query.AudioLayouts = filters.AudioLayouts;
      }
      if (filters.AudioLanguages) {
        hasFilters = true;
        query.AudioLanguages = filters.AudioLanguages;
      }
      if (filters.VideoCodecs) {
        hasFilters = true;
        query.VideoCodecs = filters.VideoCodecs;
      }
      if (filters.ExtendedVideoTypes) {
        hasFilters = true;
        query.ExtendedVideoTypes = filters.ExtendedVideoTypes;
      }
      if (filters.SubtitleCodecs) {
        hasFilters = true;
        query.SubtitleCodecs = filters.SubtitleCodecs;
      }
      if (filters.SubtitleLanguages) {
        hasFilters = true;
        query.SubtitleLanguages = filters.SubtitleLanguages;
      }
      if (filters.GenreIds) {
        hasFilters = true;
        query.GenreIds = filters.GenreIds;
      }
      if (filters.OfficialRatings) {
        hasFilters = true;
        query.OfficialRatings = filters.OfficialRatings;
      }
      if (filters.StudioIds) {
        hasFilters = true;
        query.StudioIds = filters.StudioIds;
      }
      if (filters.TagIds) {
        hasFilters = true;
        query.TagIds = filters.TagIds;
      }
      if (filters.Years) {
        hasFilters = true;
        query.Years = filters.Years;
      }
      if (filters.Is3D) {
        query.Is3D = true;
        hasFilters = true;
      }
      if (filters.Resolution) {
        this.setResolutionIntoQuery(query, filters.Resolution);
        hasFilters = true;
      }
      if (filters.HasSubtitles != null) {
        query.HasSubtitles = filters.HasSubtitles;
        hasFilters = true;
      }
      if (filters.HasLyrics != null) {
        query.HasSubtitles = filters.HasLyrics;
        hasFilters = true;
      }
      if (filters.ChannelMappingStatus != null) {
        query.ChannelMappingStatus = filters.ChannelMappingStatus;
        hasFilters = true;
      }
      if (filters.HasTrailer != null) {
        query.HasTrailer = filters.HasTrailer;
        hasFilters = true;
      }
      if (filters.HasSpecialFeature != null) {
        query.HasSpecialFeature = filters.HasSpecialFeature;
        hasFilters = true;
      }
      if (filters.HasThemeSong != null) {
        query.HasThemeSong = filters.HasThemeSong;
        hasFilters = true;
      }
      if (filters.HasThemeVideo != null) {
        query.HasThemeVideo = filters.HasThemeVideo;
        hasFilters = true;
      }
      if (filters.HasOverview != null) {
        query.HasOverview = filters.HasOverview;
        hasFilters = true;
      }
      if (filters.HasImdbId != null) {
        query.HasImdbId = filters.HasImdbId;
        hasFilters = true;
      }
      if (filters.HasTvdbId != null) {
        query.HasTvdbId = filters.HasTvdbId;
        hasFilters = true;
      }
      if (filters.HasTmdbId != null) {
        query.HasTmdbId = filters.HasTmdbId;
        hasFilters = true;
      }
      if (filters.IsLocked != null) {
        query.IsLocked = filters.IsLocked;
        hasFilters = true;
      }
    }
    query.Filters = queryFilters.length ? queryFilters.join(',') : null;
    var settings = this.getViewSettings();
    if (settings.groupItemsIntoCollections) {
      query.GroupItemsIntoCollections = true;
    } else if (settings.groupItemsIntoTags) {
      query.GroupItemsInto = 'Tags';
    }
    if (this.params.type === 'Recordings') {
      if (this.params.GroupItems) {
        query.GroupItems = this.params.GroupItems === 'true';
      }
    }
    if (this.params.type === 'search') {
      query.SearchTerm = this.lastSearchTerm = this.searchFields.getSearchTerm();
      var activeSearchTab = this.view.querySelector('.emby-searchable-tab-button.emby-tab-button-active');
      if (activeSearchTab) {
        var searchItemType = activeSearchTab.getAttribute('data-searchtype');
        if (searchItemType !== 'all') {
          query.IncludeItemTypes = searchItemType;
        } else {
          query.IncludeItemTypes = null;
        }
      }
    }
    if (query.IncludeItemTypes === 'Program' && !query.IsAiring && !query.IsSports || !query.IncludeItemTypes && this.params.type === 'search') {
      query.GroupProgramsBySeries = true;
    }
    var sortValues = this.getSortValues();
    var sortBy = sortValues.sortBy || '';
    if (sortBy.startsWith('Random')) {
      query.RandomSeed = this.getRandomSeed();
    }
    return {
      query: query,
      hasFilters: hasFilters
    };
  };
  ListController.prototype.getItems = function (initialQuery, signal) {
    var apiClient = getApiClient(this);
    var queryInfo = this.getQueryInfo(true);
    this.setFilterStatus(queryInfo.hasFilters);
    if (initialQuery) {
      queryInfo.query = Object.assign(queryInfo.query, initialQuery);
    }
    switch (this.getDisplayPreset()) {
      case 'User':
        delete queryInfo.query.Fields;
        return apiClient.getUsersQueryResult(queryInfo.query, signal);
      case 'Device':
        delete queryInfo.query.Fields;
        return apiClient.getDevices(queryInfo.query, signal);
      default:
        break;
    }
    var method = this.getApiClientQueryMethodName();
    if (method === 'getActivityLog') {
      queryInfo.query.HasUserId = false;
      return apiClient.getActivityLog(queryInfo.query, signal);
    }
    if (method === 'getUserActivityLog') {
      queryInfo.query.HasUserId = true;
      return apiClient.getActivityLog(queryInfo.query, signal);
    }
    if (method === 'getLogs' || method === 'getLogLines' || method === 'getApiKeys' || method === 'getLiveTvChannelsForManagement') {
      return apiClient[method](queryInfo.query, signal);
    }
    if (method === 'getNextUpEpisodes') {
      queryInfo.query.UserId = apiClient.getCurrentUserId();
      queryInfo.query.EnableTotalRecordCount = false;
      queryInfo.query.LegacyNextUp = true;
      return apiClient[method](queryInfo.query, signal, signal);
    }
    if (method === 'getMissingEpisodes') {
      queryInfo.query.UserId = apiClient.getCurrentUserId();
      return apiClient[method](queryInfo.query, signal, signal);
    }
    if (method === 'getLiveTvChannels') {
      queryInfo.query.UserId = apiClient.getCurrentUserId();
      return apiClient[method](queryInfo.query, signal);
    }
    if (method === 'getLiveTvRecordings' || method === 'getLiveTvChannelTags') {
      queryInfo.query.UserId = apiClient.getCurrentUserId();
      return apiClient[method](queryInfo.query, signal);
    }
    var params = this.params;
    if (params.type === 'search') {
      var activeSearchTab = this.view.querySelector('.emby-searchable-tab-button.emby-tab-button-active');
      if (activeSearchTab) {
        queryInfo.query.IncludeSearchTypes = false;
      }
      return apiClient.getSearchResults(queryInfo.query, signal).then(onSearchResultsFetched.bind(this));
    }
    if (method === 'getItems') {
      return apiClient[method](apiClient.getCurrentUserId(), queryInfo.query, signal);
    }
    return apiClient[method](apiClient.getCurrentUserId(), queryInfo.query, signal);
  };
  function destroyHeader(instance) {
    var elem = instance._headerElement;
    if (elem) {
      try {
        elem.remove();
      } catch (err) {}
      instance._headerElement = null;
    }
  }
  function onHeaderContextMenu(e) {
    e.preventDefault();
    this.showColumnSelector(e);
  }
  function onHeaderClick(e) {
    var btnConfigureGridColumns = e.target.closest('.btnConfigureGridColumns');
    if (btnConfigureGridColumns) {
      this.showColumnSelector(e);
      return;
    }
    var btnGridHeaderColumnSort = e.target.closest('.btnGridHeaderColumnSort');
    if (btnGridHeaderColumnSort) {
      this.setSortValue(btnGridHeaderColumnSort.getAttribute('data-sortvalue'));
      return;
    }
  }
  function ensureHeader(instance) {
    var elem = instance._headerElement;
    if (!elem) {
      instance._headerElement = elem = document.createElement('div');
      elem.className = 'itemsContainer_header';
      var itemsContainer = instance.itemsContainer;
      itemsContainer.parentNode.insertBefore(elem, itemsContainer);
      elem.addEventListener('contextmenu', onHeaderContextMenu.bind(instance));
      elem.addEventListener('click', onHeaderClick.bind(instance));
    }
    return elem;
  }
  ListController.prototype.onRefreshing = function (result) {
    if (!this.alphaPicker) {
      if (this.supportsAlphaPicker()) {
        this.initAlphaPicker();
      }
    }
    var listOptions = this.itemsContainer.currentListOptions;
    if (listOptions.renderer.renderHeader) {
      listOptions.renderer.renderHeader(this, ensureHeader(this), listOptions.options);
    } else {
      destroyHeader(this);
    }
    var viewSettings = this.getViewSettings();
    _cardbuilder.default.setUserPreferredSize(this.itemsContainer, viewSettings.cardSize);
    this.configureScrollingForView();
    var items = result.Items || result;
    var totalRecordCount = result.TotalRecordCount || items.length;
    this.fillDisplayTotalRecordCount(totalRecordCount);
    updateAlphaPickerState(this, totalRecordCount);
    var paddingElement = this.getInlinePaddingElement();
    if (paddingElement) {
      var viewType = viewSettings.imageType;
      if (viewType === 'datagrid' || viewType === 'list') {
        var _listOptions$options;
        if ((_listOptions$options = listOptions.options) != null && _listOptions$options.autoMoveFavoriteButton) {
          paddingElement.classList.add('padded-left-withlist-autocollapse');
        } else {
          paddingElement.classList.remove('padded-left-withlist-autocollapse');
        }
        paddingElement.classList.add('padded-left-withlist', 'padded-right-withlist');
      } else {
        paddingElement.classList.remove('padded-left-withlist', 'padded-right-withlist', 'padded-left-withlist-autocollapse');
      }
    }
    var container = this.itemsViewSettingsContainer || this.view;
    hideOrShowAll(container.querySelectorAll('.btnPlay'), !(totalRecordCount && this.supportsPlay()));
    hideOrShowAll(container.querySelectorAll('.btnShuffle'), !(totalRecordCount && this.supportsShuffle()));
    hideOrShowAll(container.querySelectorAll('.btnQueue'), !(totalRecordCount && this.supportsQueue()));
  };
  ListController.prototype.afterItemsRefreshed = function (result) {
    var items = result.Items || result;
    var totalRecordCount = result.TotalRecordCount || items.length;
    if (!totalRecordCount) {
      this.setEmptyListState();
    }
    _loading.default.hide();
  };
  ListController.prototype.onGetItems = function () {
    _loading.default.show();
  };
  ListController.prototype.onGetItemsFailed = function (result) {
    _loading.default.hide();
  };
  function onScroll(e) {
    var scroller = this.scroller;
    if (!scroller) {
      return;
    }
    var headerElement = this._headerElement;
    if (headerElement) {
      headerElement.scrollLeft = scroller.scrollLeft;
    }
  }
  function removeScrollListener(instance) {
    if (instance.boundOnScroll) {
      var scroller = instance.scroller;
      if (scroller) {
        scroller.removeEventListener('scroll', instance.boundOnScroll);
      }
      instance.boundOnScroll = null;
    }
  }
  function moveSettingsContainer(elem, newParentNode, scrollSlider) {
    if (elem.parentNode === newParentNode) {
      return;
    }
    if (newParentNode === scrollSlider) {
      newParentNode.insertBefore(elem, scrollSlider.firstElementChild);
    } else {
      newParentNode.insertBefore(elem, scrollSlider);
    }
  }
  ListController.prototype.configureScrollingForView = function () {
    var itemsContainer = this.itemsContainer;
    var headerElement = this._headerElement;
    var currentListOptions = itemsContainer.currentListOptions;
    var scrollDirection = this.scrollDirection();

    // the fixed position header is not rendering correctly on iOS for some reason
    var hasFixedPositionListHeader = headerElement != null && (currentListOptions == null ? void 0 : currentListOptions.options.enableFixedPositionHeader) && supportsCssVariables && supportsCalcMin || scrollDirection === 'x';
    if (scrollDirection === 'x') {
      itemsContainer.classList.remove('navout-x', 'focuscontainer-y');
    } else {
      itemsContainer.classList.add('navout-x', 'focuscontainer-y');
    }
    var itemsViewSettingsContainer = this.itemsViewSettingsContainer;
    if (itemsViewSettingsContainer) {
      if (hasFixedPositionListHeader) {
        itemsViewSettingsContainer.classList.add('itemsViewSettingsContainer-fixed', 'viewContent-fixed');
      } else {
        itemsViewSettingsContainer.classList.remove('itemsViewSettingsContainer-fixed', 'viewContent-fixed');
      }
      if (hasFixedPositionListHeader && scrollDirection === 'x') {
        itemsViewSettingsContainer.classList.add('itemsViewSettingsContainer-fixed-scrollx');
      } else {
        itemsViewSettingsContainer.classList.remove('itemsViewSettingsContainer-fixed-scrollx');
      }
    }
    if (headerElement) {
      if (hasFixedPositionListHeader) {
        headerElement.classList.add('itemsContainer_header_fixed', 'viewContent-fixed');
      } else {
        headerElement.classList.remove('itemsContainer_header_fixed', 'viewContent-fixed');
      }
    }
    var scroller = this.scroller;
    if (scroller) {
      scroller.setHeaderBindingEnabled(!hasFixedPositionListHeader);
      var paddedTopPageElem = this.paddedTopPageElem;
      if (!paddedTopPageElem) {
        paddedTopPageElem = this.paddedTopPageElem = itemsContainer.closest('.padded-top-page');
      }
      var scrollSlider = scroller.getScrollSlider();
      var scrollSliderY = scrollDirection === 'y' ? scrollSlider : null;
      if (itemsViewSettingsContainer && scrollSlider) {
        moveSettingsContainer(itemsViewSettingsContainer, scrollDirection === 'x' ? scroller : scrollSlider, scrollSlider);
      }
      if (hasFixedPositionListHeader && scrollDirection === 'y') {
        scroller.classList.add('margin-top-page', 'margin-top-page-listheader', 'dataGrid-mainscroller-scrollX');
        if (scrollSliderY) {
          scrollSliderY.classList.add('dataGrid-mainscroller-scrollX-scrollSliderY');
        }
        if (paddedTopPageElem && paddedTopPageElem !== scroller) {
          paddedTopPageElem.classList.remove('padded-top-page');
        }
        if (!this.boundOnScroll) {
          this.boundOnScroll = onScroll.bind(this);
        }
        scroller.addEventListener('scroll', this.boundOnScroll);
      } else {
        removeScrollListener(this);
        scroller.classList.remove('margin-top-page', 'margin-top-page-listheader', 'dataGrid-mainscroller-scrollX');
        if (scrollSliderY) {
          scrollSliderY.classList.remove('dataGrid-mainscroller-scrollX-scrollSliderY');
        }
        if (paddedTopPageElem && paddedTopPageElem !== scroller) {
          paddedTopPageElem.classList.add('padded-top-page');
        }
      }
      if (scrollSlider) {
        var scrollWidth = currentListOptions == null ? void 0 : currentListOptions.options.scrollXWidth;
        if (scrollWidth) {
          scrollSlider.style.width = scrollWidth;
        } else {
          scrollSlider.style.width = null;
        }
        if (scrollDirection === 'x') {
          scrollSlider.classList.remove('navout-up', 'focuscontainer-y');
        } else {
          scrollSlider.classList.add('navout-up', 'focuscontainer-y');
        }
      }
    }
  };
  ListController.prototype.fillDisplayTotalRecordCount = function (totalRecordCount) {
    var view = this.view;
    var elem = view.querySelector('.listTotalRecordCount');
    if (!elem) {
      return;
    }
    if (this.enableTotalRecordCountDisplay === false) {
      elem.classList.add('hide');
      return;
    }
    elem.innerHTML = this.getItemCountText(totalRecordCount);
  };
  ListController.prototype.getEmptyListMessage = function () {
    if (this.params.type === 'search') {
      if (this.searchFields) {
        var searchTerm = this.lastSearchTerm;
        if (!searchTerm) {
          return Promise.resolve('');
        }
        if (searchTerm.length < 2) {
          return Promise.resolve(_globalize.default.translate('TwoSearchCharsRequired'));
        }
      }
      return Promise.resolve(_globalize.default.translate('NoItemsMatchingFound'));
    }
    if (this.getQueryInfo(true).hasFilters) {
      var html = '<div>' + _globalize.default.translate('NoItemsMatchingFound') + '</div>';
      html += '<button style="margin-top:2em;" type="button" is="emby-button" class="raised btnClearFilters">';
      html += '<i class="md-icon button-icon button-icon-left">&#xe0b8;</i>';
      html += '<span>' + _globalize.default.translate('HeaderClearFilters') + '</span>';
      html += '</button>';
      return Promise.resolve(html);
    }
    return Promise.resolve(_globalize.default.translate('NoItemsFound'));
  };
  ListController.prototype.setEmptyListState = function () {
    this.getEmptyListMessage().then(setEmptyListMessage.bind(this));
  };
  ListController.prototype.initAlphaNumericShortcuts = function () {
    if (!this.enableAlphaNumericShortcuts) {
      return;
    }
    if (this.alphaNumericShortcuts) {
      return;
    }
    var instance = this;
    Emby.importModule('./modules/alphanumericshortcuts/alphanumericshortcuts.js').then(function (AlphaNumericShortcuts) {
      instance.alphaNumericShortcuts = new AlphaNumericShortcuts({
        itemsContainer: instance.itemsContainer
      });
      instance.alphaNumericShortcuts.onAlphaNumericValueEntered = onAlphaNumericValueEntered.bind(instance);
    });
  };
  ListController.prototype.supportsSorting = function () {
    return this.getSortMenuOptions().length > 0;
  };
  ListController.prototype.getSortValues = function () {
    var basekey = this.getSettingsKey();
    var sortBy = this.getSortByValue();
    var sortOrder;
    if (!sortBy) {
      var sorting = this.getDefaultSorting();
      if (sorting) {
        sortBy = sorting.sortBy;
        sortOrder = sorting.sortOrder;
      }
    } else {
      var saveSortingOnServer = this.saveSortingOnServer();
      sortOrder = _usersettings.default.getFilter(basekey + '-sortorder', saveSortingOnServer) === 'Descending' ? 'Descending' : 'Ascending';
    }
    return {
      sortBy: sortBy,
      sortOrder: sortOrder
    };
  };
  ListController.prototype.updateSortText = function () {
    var btnSortText = this.btnSortText;
    if (!btnSortText) {
      return;
    }
    var options = this.getSortMenuOptions();
    var values = this.getSortValues();
    var sortBy = values.sortBy;
    for (var i = 0, length = options.length; i < length; i++) {
      if (sortBy === options[i].value) {
        btnSortText.innerHTML = options[i].name; // globalize.translate('SortByValue', options[i].name);
        break;
      }
    }
    var btnSortIcon = this.btnSortIcon;
    if (!btnSortIcon) {
      return;
    }
    btnSortIcon.innerHTML = values.sortOrder === 'Descending' ? '&#xe5DB;' : '&#xe5D8;';
  };
  ListController.prototype.showFilterMenu = function (e) {
    var instance = this;
    var params = instance.params;

    // TODO: This is some duplicated code from the querying method
    var query = {};
    if (params.genreId) {
      query.GenreIds = params.genreId;
    }
    var item = instance.getParentItem();
    if (item) {
      if (item.Type === 'Studio') {
        query.StudioIds = item.Id;
      } else if (item.Type === 'Tag') {
        query.TagIds = item.Id;
      } else if (item.Type === 'Genre' || item.Type === 'GameGenre' || item.Type === 'MusicGenre') {
        query.GenreIds = item.Id;
      } else if (item.Type === 'Person') {
        query.PersonIds = item.Id;
      }
    }
    if (params.artistId) {
      query.ArtistIds = params.artistId;
    }
    if (params.albumArtistId) {
      query.AlbumArtistIds = params.albumArtistId;
    }
    Emby.importModule('./modules/filtermenu/filtermenu.js').then(function (FilterMenu) {
      var onChange = function (changes) {
        var settingsKey = instance.getSettingsKey();
        var keys = Object.keys(changes);
        for (var i = 0, length = keys.length; i < length; i++) {
          var key = keys[i];
          _usersettings.default.setFilter(settingsKey + '-filter-' + key, changes[key]);
        }
        if (keys.length) {
          refreshAfterSettingsChange(instance);
        }
      };
      new FilterMenu().show(Object.assign(query, {
        positionTo: e.target.closest('button'),
        positionY: 'bottom',
        settings: instance.getFilters(),
        visibleSettings: instance.getVisibleFilters(),
        onChange: onChange,
        parentId: instance.isGlobalQuery() ? null : instance.params.parentId,
        itemTypes: instance.getItemTypes ? instance.getItemTypes() : [],
        serverId: getApiClient(instance).serverId(),
        filterMenuOptions: instance.getFilterMenuOptions()
      }));
    });
  };
  ListController.prototype.setFilterStatus = function (hasFilters) {
    var filterButtons = this.filterButtons;
    if (!filterButtons.length) {
      return;
    }
    for (var i = 0, length = filterButtons.length; i < length; i++) {
      var btnFilter = filterButtons[i];
      if (hasFilters) {
        btnFilter.classList.add('filter-active');
      } else {
        btnFilter.classList.remove('filter-active');
      }
    }
  };
  ListController.prototype.setResolutionIntoQuery = function (query, resolution) {
    if (!resolution) {
      return;
    }
    resolution = resolution.toLowerCase();
    switch (resolution) {
      case '4k':
        query.MinWidth = 3800;
        break;
      case '1080p':
        query.MinWidth = 1800;
        query.MaxWidth = 2200;
        break;
      case '720p':
        query.MinWidth = 1200;
        query.MaxWidth = 1799;
        break;
      case 'hd':
        query.MinWidth = 1200;
        query.MaxWidth = 2200;
        break;
      case 'sd':
        query.MaxWidth = 1199;
        break;
      default:
        break;
    }
  };
  ListController.prototype.getFilters = function () {
    var basekey = this.getSettingsKey();
    return {
      IsPlayed: _usersettings.default.getFilter(basekey + '-filter-IsPlayed') === 'true',
      IsUnplayed: _usersettings.default.getFilter(basekey + '-filter-IsUnplayed') === 'true',
      IsFavorite: _usersettings.default.getFilter(basekey + '-filter-IsFavorite') === 'true',
      IsDuplicate: _usersettings.default.getFilter(basekey + '-filter-IsDuplicate') === 'true',
      IsResumable: _usersettings.default.getFilter(basekey + '-filter-IsResumable') === 'true',
      Is3D: _usersettings.default.getFilter(basekey + '-filter-Is3D') === 'true',
      Resolution: _usersettings.default.getFilter(basekey + '-filter-Resolution'),
      VideoTypes: _usersettings.default.getFilter(basekey + '-filter-VideoTypes'),
      SeriesStatus: _usersettings.default.getFilter(basekey + '-filter-SeriesStatus'),
      HasSubtitles: _usersettings.default.getFilter(basekey + '-filter-HasSubtitles'),
      HasLyrics: _usersettings.default.getFilter(basekey + '-filter-HasLyrics'),
      ChannelMappingStatus: _usersettings.default.getFilter(basekey + '-filter-ChannelMappingStatus'),
      HasTrailer: _usersettings.default.getFilter(basekey + '-filter-HasTrailer'),
      HasSpecialFeature: _usersettings.default.getFilter(basekey + '-filter-HasSpecialFeature'),
      HasThemeSong: _usersettings.default.getFilter(basekey + '-filter-HasThemeSong'),
      HasThemeVideo: _usersettings.default.getFilter(basekey + '-filter-HasThemeVideo'),
      HasOverview: _usersettings.default.getFilter(basekey + '-filter-HasOverview'),
      HasImdbId: _usersettings.default.getFilter(basekey + '-filter-HasImdbId'),
      HasTvdbId: _usersettings.default.getFilter(basekey + '-filter-HasTvdbId'),
      HasTmdbId: _usersettings.default.getFilter(basekey + '-filter-HasTmdbId'),
      IsLocked: _usersettings.default.getFilter(basekey + '-filter-IsLocked'),
      GenreIds: _usersettings.default.getFilter(basekey + '-filter-GenreIds'),
      StudioIds: _usersettings.default.getFilter(basekey + '-filter-StudioIds'),
      TagIds: _usersettings.default.getFilter(basekey + '-filter-TagIds'),
      OfficialRatings: _usersettings.default.getFilter(basekey + '-filter-OfficialRatings'),
      Containers: _usersettings.default.getFilter(basekey + '-filter-Containers'),
      AudioCodecs: _usersettings.default.getFilter(basekey + '-filter-AudioCodecs'),
      AudioLayouts: _usersettings.default.getFilter(basekey + '-filter-AudioLayouts'),
      AudioLanguages: _usersettings.default.getFilter(basekey + '-filter-AudioLanguages'),
      SubtitleLanguages: _usersettings.default.getFilter(basekey + '-filter-SubtitleLanguages'),
      VideoCodecs: _usersettings.default.getFilter(basekey + '-filter-VideoCodecs'),
      ExtendedVideoTypes: _usersettings.default.getFilter(basekey + '-filter-ExtendedVideoTypes'),
      SubtitleCodecs: _usersettings.default.getFilter(basekey + '-filter-SubtitleCodecs'),
      Years: _usersettings.default.getFilter(basekey + '-filter-Years')
    };
  };
  ListController.prototype.getSortMenuOptions = function () {
    return _itemmanager.default.getSortMenuOptions({
      itemType: this.getDisplayPreset(),
      availableFieldIds: getAvailableFieldIdMap(this),
      apiClient: getApiClient(this)
    });
  };
  ListController.prototype.getRandomSeed = function () {
    if (!this.randomSeed) {
      this.resetRandomSeed();
    }
    return this.randomSeed;
  };
  ListController.prototype.resetRandomSeed = function () {
    this.randomSeed = Math.floor(Math.random() * 10000000) + 1;
  };
  function getDisplayItemTypes(instance) {
    var types = instance.getItemTypes();
    if (types.length) {
      return types;
    }
    types = instance.getQueryIncludeItemTypes();
    if (types.length) {
      return types;
    }

    //const parentItem = instance.getParentItem();
    //let parentType = parentItem?.Type;

    //switch (parentType) {

    //    case 'PhotoAlbum':
    //        return 'Photo';
    //    default:
    //        break;
    //}

    return [];
  }
  ListController.prototype.getDisplayPreset = function () {
    var types = getDisplayItemTypes(this);
    if (types.length > 1) {
      return null;
    }
    if (types.length) {
      return types[0];
    }
    var context = this.getContext();
    switch (context) {
      case 'boxsets':
        return 'BoxSet';
      case 'playlists':
        return 'Playlist';
      default:
        break;
    }
    return null;
  };
  ListController.prototype.clearFilters = function () {
    var basekey = this.getSettingsKey();
    _usersettings.default.remove(basekey + '-filter-IsPlayed');
    _usersettings.default.remove(basekey + '-filter-IsUnplayed');
    _usersettings.default.remove(basekey + '-filter-IsFavorite');
    _usersettings.default.remove(basekey + '-filter-IsDuplicate');
    _usersettings.default.remove(basekey + '-filter-IsResumable');
    _usersettings.default.remove(basekey + '-filter-Is4K');
    _usersettings.default.remove(basekey + '-filter-IsHD');
    _usersettings.default.remove(basekey + '-filter-IsSD');
    _usersettings.default.remove(basekey + '-filter-Is3D');
    _usersettings.default.remove(basekey + '-filter-Resolution');
    _usersettings.default.remove(basekey + '-filter-SeriesStatus');
    _usersettings.default.remove(basekey + '-filter-HasSubtitles');
    _usersettings.default.remove(basekey + '-filter-HasLyrics');
    _usersettings.default.remove(basekey + '-filter-ChannelMappingStatus');
    _usersettings.default.remove(basekey + '-filter-HasTrailer');
    _usersettings.default.remove(basekey + '-filter-HasSpecialFeature');
    _usersettings.default.remove(basekey + '-filter-HasThemeSong');
    _usersettings.default.remove(basekey + '-filter-HasThemeVideo');
    _usersettings.default.remove(basekey + '-filter-HasOverview');
    _usersettings.default.remove(basekey + '-filter-HasImdbId');
    _usersettings.default.remove(basekey + '-filter-HasTvdbId');
    _usersettings.default.remove(basekey + '-filter-HasTmdbId');
    _usersettings.default.remove(basekey + '-filter-IsLocked');
    _usersettings.default.remove(basekey + '-filter-GenreIds');
    _usersettings.default.remove(basekey + '-filter-StudioIds');
    _usersettings.default.remove(basekey + '-filter-TagIds');
    _usersettings.default.remove(basekey + '-filter-OfficialRatings');
    _usersettings.default.remove(basekey + '-filter-Containers');
    _usersettings.default.remove(basekey + '-filter-AudioCodecs');
    _usersettings.default.remove(basekey + '-filter-AudioLayouts');
    _usersettings.default.remove(basekey + '-filter-AudioLanguages');
    _usersettings.default.remove(basekey + '-filter-SubtitleLanguages');
    _usersettings.default.remove(basekey + '-filter-VideoCodecs');
    _usersettings.default.remove(basekey + '-filter-ExtendedVideoTypes');
    _usersettings.default.remove(basekey + '-filter-SubtitleCodecs');
    _usersettings.default.remove(basekey + '-filter-Years');
    this.itemsContainer.refreshItems();
  };
  ListController.prototype.destroyAlphaNumericShortcuts = function () {
    var alphaNumericShortcuts = this.alphaNumericShortcuts;
    if (alphaNumericShortcuts) {
      alphaNumericShortcuts.destroy();
      this.alphaNumericShortcuts = null;
    }
  };
  ListController.prototype.resume = function (options) {
    if (!options.refresh) {
      this.configureScrollingForView();
    }
    var alphaNumericShortcuts = this.alphaNumericShortcuts;
    if (alphaNumericShortcuts) {
      alphaNumericShortcuts.resume();
    }
    if (options.refresh) {
      this.updateSortText();
    }
    return this.itemsContainer.resume(options);
  };
  ListController.prototype.pause = function () {
    var itemsContainer = this.itemsContainer;
    if (itemsContainer && itemsContainer.pause) {
      itemsContainer.pause();
    }
    var alphaNumericShortcuts = this.alphaNumericShortcuts;
    if (alphaNumericShortcuts) {
      alphaNumericShortcuts.pause();
    }
  };
  ListController.prototype.destroy = function () {
    this.destroyAlphaNumericShortcuts();
    this.filterButtons = null;
    if (this.alphaPicker) {
      this.alphaPicker.destroy();
      this.alphaPicker = null;
    }
    removeScrollListener(this);
    destroyHeader(this);
    this.sortButtons = null;
    this.btnSortText = null;
    this.btnSortIcon = null;
    this.alphaPickerElement = null;
    this.itemsViewSettingsContainer = null;
    this.paddedTopPageElem = null;
    this.view = null;
    this.itemsContainer = null;
    this.params = null;
    this.apiClient = null;
  };
  var _default = _exports.default = ListController;
});
