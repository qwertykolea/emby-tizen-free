define(["exports", "./../modules/emby-elements/emby-scroller/emby-scroller.js", "./../modules/emby-elements/emby-button/emby-button.js", "./../modules/viewmanager/baseview.js", "./../modules/focusmanager.js", "./../modules/emby-apiclient/connectionmanager.js", "./searchfields.js", "./../modules/emby-apiclient/events.js", "./../modules/common/globalize.js", "./../modules/loading/loading.js", "./../modules/emby-elements/emby-itemscontainer/emby-itemscontainer.js", "./../modules/layoutmanager.js", "./../modules/cardbuilder/cardbuilder.js", "./../modules/common/itemmanager/itemmanager.js"], function (_exports, _embyScroller, _embyButton, _baseview, _focusmanager, _connectionmanager, _searchfields, _events, _globalize, _loading, _embyItemscontainer, _layoutmanager, _cardbuilder, _itemmanager) {
  Object.defineProperty(_exports, "__esModule", {
    value: true
  });
  _exports.default = void 0;
  /* jshint module: true */

  function getCardOptionsForType(type, items) {
    if (type === 'BoxSet' || type === 'Playlist' || type === 'Game' || type === 'Book' || type === 'PhotoAlbum' || type === 'MusicArtist' || type === 'Person') {
      return {
        shape: 'autooverflow',
        fields: ['Name'],
        focusTransformTitleAdjust: true
      };
    }
    if (type === 'Movie' || type === 'Trailer' || type === 'Series') {
      return {
        shape: 'autooverflow',
        fields: ['Name', 'ProductionYear'],
        focusTransformTitleAdjust: true
      };
    }
    if (type === 'Photo') {
      return {
        shape: 'autooverflow',
        fields: ['Name'],
        focusTransformTitleAdjust: true
      };
    }
    if (type === 'Audio') {
      return {
        shape: 'autooverflow',
        preferArtistTitle: true,
        fields: ['ParentName', 'Name'],
        action: 'play',
        sideFooter: true,
        focusTransformTitleAdjust: true
      };
    }
    if (type === 'TvChannel') {
      return {
        shape: 'autooverflow',
        fields: ['Name', 'CurrentProgramParentName', 'CurrentProgramTime'],
        defaultBackground: true,
        focusTransformTitleAdjust: true
      };
    }
    if (type === 'Program') {
      var options = {
        shape: 'autooverflow',
        fields: ['ParentName', 'Name', 'AirTime'],
        showAirDateTime: true,
        focusTransformTitleAdjust: true
      };
      adjustListOptionsForGroupingProgramsBySeries(options, type, items);
      return options;
    }
    if (type === 'Tag') {
      return {
        shape: 'autooverflow',
        fields: ['Name'],
        defaultBackground: true,
        multiSelect: false,
        focusTransformTitleAdjust: true
      };
    }

    // type === 'Episode' || type === 'MusicAlbum' || type === 'MusicVideo' || type === 'Video'
    return {
      shape: 'autooverflow',
      fields: ['ParentName', 'Name'],
      focusTransformTitleAdjust: true
    };
  }
  function isNotName(n) {
    return n !== 'Name';
  }
  function isNotParentName(n) {
    return n !== 'ParentName';
  }
  function isNotAirTime(n) {
    return n !== 'AirTime';
  }
  function adjustListOptionsForGroupingProgramsBySeries(options, type, items) {
    if (type !== 'Program') {
      return;
    }
    if (!items.length || !items[0].AsSeries) {
      return;
    }
    options.progress = false;
    options.showAirDateTime = false;
    options.fields = options.fields.filter(isNotName).filter(isNotParentName).filter(isNotAirTime);
    options.fields.push('ParentNameOrName');
  }
  function renderSearchTypes(instance, apiClient, context, value, types, signal) {
    var searchCategories = context.querySelector('.searchCategories');
    searchCategories.innerHTML = '';
    var promises = [];
    for (var i = 0, length = types.length; i < length; i++) {
      var type = types[i];
      type = type.Name || type;
      var elem = document.createElement('div');
      elem.className = 'hide verticalSection albumResults';
      if (type === 'Audio') {
        elem.classList.add('verticalSection-extrabottompadding');
      }
      var innerHTML = '<h2 class="sectionTitle sectionTitle-cards padded-left padded-right">' + _itemmanager.default.getPluralItemTypeName(type) + '</h2>';
      innerHTML += '<div is="emby-scroller" data-horizontal="true" data-focusscroll="true" data-mousewheel="false" class="padded-top-focusscale padded-bottom-focusscale padded-left padded-right">';
      var itemsContainerClass = 'itemsContainer scrollSlider focusable focuscontainer-x';
      if (type === 'Audio') {
        itemsContainerClass += ' itemsContainer-sideFooters';
      }
      innerHTML += '<div is="emby-itemscontainer" data-focusabletype="nearest" class="' + itemsContainerClass + '"></div>';
      innerHTML += '</div>';
      elem.innerHTML = innerHTML;
      searchCategories.appendChild(elem);
      promises.push(searchType(instance, apiClient, {
        searchTerm: value,
        IncludeItemTypes: type
      }, context, elem, signal));
    }
    return Promise.all(promises);
  }
  function getSearchFields(instance, type) {
    var fields = instance.getRequestedItemFields() + ',PrimaryImageAspectRatio,ProductionYear';
    if (!type || type === 'Series') {
      fields += ',Status,EndDate';
    }
    return fields;
  }
  function getSearchHints(instance, apiClient, query, signal) {
    query.Recursive = true;
    query.EnableTotalRecordCount = false;
    query.ImageTypeLimit = 1;
    query.Fields = getSearchFields(instance, query.IncludeItemTypes);
    if (query.IncludeItemTypes === 'Program') {
      query.GroupProgramsBySeries = true;
    }
    if (query.IncludeItemTypes === 'Program') {
      query.HasAired = false;
    }
    return apiClient.getItems(apiClient.getCurrentUserId(), query, signal);
  }
  function search(instance, apiClient, context, value, signal) {
    if (value || _layoutmanager.default.tv) {
      context.querySelector('.searchSuggestions').classList.add('hide');
    }
    var query = {
      SearchTerm: value,
      Recursive: true,
      EnableTotalRecordCount: false,
      ImageTypeLimit: 1,
      Limit: 16,
      ParentId: instance.params.parentId,
      Fields: getSearchFields(instance),
      GroupProgramsBySeries: true
    };
    return apiClient.getSearchResults(query, signal).then(function (result) {
      var topResultCardOptions = {
        shape: 'autooverflow',
        fields: ['ParentName', 'Name', 'Type', 'CurrentProgramParentName', 'AirTime'],
        showAirDateTime: true,
        lines: 4
      };

      //adjustListOptionsForGroupingProgramsBySeries(topResultCardOptions, null, []);

      populateResults(result, context, context.querySelector('.globalResults'), topResultCardOptions);
      return renderSearchTypes(instance, apiClient, context, value, result.ItemTypes, signal);
    });
  }
  function searchType(instance, apiClient, query, context, section, signal) {
    query.Limit = 16;
    query.ParentId = instance.params.parentId;
    return getSearchHints(instance, apiClient, query, signal).then(function (result) {
      var items = result.Items || result.SearchHints;
      var cardOptions = getCardOptionsForType(query.IncludeItemTypes, items);
      return populateResults(result, context, section, cardOptions);
    });
  }
  function populateResults(result, context, section, cardOptions) {
    var items = result.Items || result.SearchHints;
    section = typeof section === 'string' ? context.querySelector(section) : section;
    var itemsContainer = section.querySelector('.itemsContainer');
    _cardbuilder.default.buildCards(items, Object.assign({
      itemsContainer: itemsContainer,
      parentContainer: section,
      shape: 'autooverflow',
      scalable: true,
      focusTransformTitleAdjust: true,
      horizontal: true
    }, cardOptions || {}));
    section.querySelector('.emby-scroller').scrollToBeginning({
      behavior: 'instant'
    });
    return items;
  }
  function onSearch(e, value) {
    var _instance$currentSear;
    var instance = this;
    (_instance$currentSear = instance.currentSearchAbortController) == null || _instance$currentSear.abort();
    var abortController = new AbortController();
    instance.currentSearchAbortController = abortController;
    instance.search(value, abortController.signal);
  }
  function SearchView(view, params) {
    _baseview.default.apply(this, arguments);
    this.searchFields = new _searchfields.default({
      serverId: params.serverId || _connectionmanager.default.currentApiClient().serverId(),
      element: view.querySelector('.searchFields')
    });
    this.search('');
    _events.default.on(this.searchFields, 'search', onSearch.bind(this));
  }
  Object.assign(SearchView.prototype, _baseview.default.prototype);
  SearchView.prototype.onPause = function () {
    var _this$currentSearchAb;
    _baseview.default.prototype.onPause.apply(this, arguments);
    if (this.searchFields) {
      this.searchFields.pause();
    }
    (_this$currentSearchAb = this.currentSearchAbortController) == null || _this$currentSearchAb.abort();
    this.currentSearchAbortController = null;
  };
  SearchView.prototype.onInputCommand = function (e) {
    switch (e.detail.command) {
      case 'search':
        {
          _focusmanager.default.focus(this.view.querySelector('.searchfields-txtSearch'));
          e.preventDefault();
          return;
        }
      default:
        break;
    }
    _baseview.default.prototype.onInputCommand.apply(this, arguments);
  };
  function afterSearch(itemsResponses) {
    var _itemsResponses$, _itemsResponses;
    _loading.default.hide();
    var searchInfo = this;
    var instance = searchInfo.instance;
    var hasResults;
    var i, length;
    if ((_itemsResponses$ = itemsResponses[0]) != null && _itemsResponses$.length) {
      hasResults = true;
    }
    itemsResponses = itemsResponses[1];
    if ((_itemsResponses = itemsResponses) != null && _itemsResponses.length) {
      for (i = 0, length = itemsResponses.length; i < length; i++) {
        if (itemsResponses[i].length) {
          hasResults = true;
          break;
        }
      }
    }
    var noResultsElem = instance.view.querySelector('.noResults');
    if (hasResults || !searchInfo.searchTerm) {
      noResultsElem.classList.add('hide');
    } else {
      if (searchInfo.searchTerm.length < 1) {
        noResultsElem.innerHTML = _globalize.default.translate('TwoSearchCharsRequired');
      } else {
        noResultsElem.innerHTML = _globalize.default.translate('NoItemsMatchingFound');
      }
      noResultsElem.classList.remove('hide');
    }
  }
  function afterSearchFail() {
    _loading.default.hide();
    this.view.querySelector('.noResults').classList.remove('hide');
  }
  SearchView.prototype.search = function (value, signal) {
    _loading.default.show();
    var apiClient = this.getApiClient();
    var elem = this.view.querySelector('.searchResults');
    elem.querySelector('.noResults').classList.add('hide');
    var searchInfo = {
      instance: this,
      searchTerm: value
    };
    return search(this, apiClient, elem, value, signal).then(afterSearch.bind(searchInfo), afterSearchFail.bind(this));
  };
  SearchView.prototype.onResume = function (options) {
    _baseview.default.prototype.onResume.apply(this, arguments);
    if (this.searchFields) {
      this.searchFields.resume(options);
    }
  };
  SearchView.prototype.destroy = function () {
    _baseview.default.prototype.destroy.apply(this, arguments);
    if (this.searchFields) {
      this.searchFields.destroy();
      this.searchFields = null;
    }
  };
  var _default = _exports.default = SearchView;
});
