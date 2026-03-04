define(["exports", "./../dialoghelper/dialoghelper.js", "./../layoutmanager.js", "./../common/globalize.js", "./../emby-apiclient/connectionmanager.js", "./../emby-elements/emby-toggle/emby-toggle.js", "./../emby-elements/emby-select/emby-select.js", "./../emby-elements/emby-button/emby-button.js", "./../emby-elements/emby-button/paper-icon-button-light.js", "./../emby-elements/emby-dialogclosebutton/emby-dialogclosebutton.js"], function (_exports, _dialoghelper, _layoutmanager, _globalize, _connectionmanager, _embyToggle, _embySelect, _embyButton, _paperIconButtonLight, _embyDialogclosebutton) {
  Object.defineProperty(_exports, "__esModule", {
    value: true
  });
  _exports.default = void 0;
  /* jshint module: true */

  require(['flexStyles', 'formDialogStyle', 'material-icons', 'css!modules/filtermenu/filtermenu.css']);
  function onSubmit(e) {
    e.preventDefault();
    return false;
  }
  function renderMultiSelectList(container, getItemsFn, options, property, delimiter) {
    var select = container.querySelector('select');
    select.getItems = getItemsFn;
    select.parentContainer = container;
    var values = options.settings[property];
    values = values ? Array.isArray(values) ? values : values.split(delimiter) : [];
    select.values = values;
    afterSelectValueSet(select, values[0]);
  }
  function loadPlayState(context, options) {
    var anySelected = false;
    var menuItems = [];
    if (options.visibleSettings.indexOf('IsPlayed') !== -1) {
      menuItems.push({
        name: _globalize.default.translate('Played'),
        value: 'IsPlayed'
      });
    }
    if (options.visibleSettings.indexOf('IsUnplayed') !== -1) {
      menuItems.push({
        name: _globalize.default.translate('Unplayed'),
        value: 'IsUnplayed'
      });
    }
    if (options.visibleSettings.indexOf('IsResumable') !== -1) {
      menuItems.push({
        name: _globalize.default.translate('ContinuePlaying'),
        value: 'IsResumable'
      });
    }
    var html = menuItems.map(function (m) {
      var optionSelected = !anySelected && (options.settings[m.value] || false);
      var selectedHtml = '';
      if (optionSelected) {
        anySelected = true;
        selectedHtml = ' selected';
      }
      return '<option value="' + m.value + '" ' + selectedHtml + '>' + m.name + '</option>';
    }).join('');
    var allText = _globalize.default.translate('Any');
    var prefix = anySelected ? '<option value="">' + allText + '</option>' : '<option value="" selected>' + allText + '</option>';
    var selectPlaystate = context.querySelector('.selectPlaystate');
    selectPlaystate.innerHTML = prefix + html;
    afterSelectValueSet(selectPlaystate, selectPlaystate.singleValue);
    if (menuItems.length) {
      context.querySelector('.playstateFilters').classList.remove('hide');
    } else {
      context.querySelector('.playstateFilters').classList.add('hide');
    }
  }
  function getBaseFilterMenuOptions(options) {
    // for now this is a good enough clone. If ever needed we can use structuredClone, which will require a polyfill
    return Object.assign({}, options.filterMenuOptions);
  }
  function getGenres(query) {
    var options = this;
    var apiClient = _connectionmanager.default.getApiClient(options.serverId);
    var outerItemIds = query.Ids;
    query.Ids = null;
    query = Object.assign(getBaseFilterMenuOptions(options), {
      SortBy: "SortName",
      SortOrder: "Ascending",
      Recursive: options.Recursive == null ? true : options.Recursive,
      EnableImages: false,
      EnableUserData: false,
      GenreIds: options.GenreIds,
      PersonIds: options.PersonIds,
      StudioIds: options.StudioIds,
      ParentId: options.parentId,
      OuterIds: outerItemIds,
      IncludeItemTypes: options.itemTypes.join(',')
    }, query);
    return apiClient.getGenres(apiClient.getCurrentUserId(), query);
  }
  function loadGenres(context, options) {
    renderMultiSelectList(context.querySelector('.genreFilters'), getGenres.bind(options), options, 'GenreIds', ',');
  }
  function getStudios(query) {
    var options = this;
    var apiClient = _connectionmanager.default.getApiClient(options.serverId);
    var outerItemIds = query.Ids;
    query.Ids = null;
    query = Object.assign(getBaseFilterMenuOptions(options), {
      SortBy: "SortName",
      SortOrder: "Ascending",
      Recursive: options.Recursive == null ? true : options.Recursive,
      EnableImages: false,
      EnableUserData: false,
      GenreIds: options.GenreIds,
      PersonIds: options.PersonIds,
      StudioIds: options.StudioIds,
      ParentId: options.parentId,
      IncludeItemTypes: options.itemTypes.join(','),
      OuterIds: outerItemIds
    }, query);
    return apiClient.getStudios(apiClient.getCurrentUserId(), query);
  }
  function loadStudios(context, options) {
    renderMultiSelectList(context.querySelector('.studioFilters'), getStudios.bind(options), options, 'StudioIds', ',');
  }
  function getOfficialRatings(query) {
    var options = this;
    var apiClient = _connectionmanager.default.getApiClient(options.serverId);
    var outerItemIds = query.Ids;
    query.Ids = null;
    query = Object.assign(getBaseFilterMenuOptions(options), {
      SortBy: "SortName",
      SortOrder: "Ascending",
      Recursive: options.Recursive == null ? true : options.Recursive,
      EnableImages: false,
      EnableUserData: false,
      GenreIds: options.GenreIds,
      PersonIds: options.PersonIds,
      StudioIds: options.StudioIds,
      ParentId: options.parentId,
      IncludeItemTypes: options.itemTypes.join(','),
      OuterIds: outerItemIds
    }, query);
    return apiClient.getOfficialRatings(apiClient.getCurrentUserId(), query);
  }
  function loadOfficialRatings(context, options) {
    renderMultiSelectList(context.querySelector('.officialRatingFilters'), getOfficialRatings.bind(options), options, 'OfficialRatings', '|');
  }
  function getTags(query) {
    var options = this;
    var apiClient = _connectionmanager.default.getApiClient(options.serverId);
    var outerItemIds = query.Ids;
    query.Ids = null;
    query = Object.assign(getBaseFilterMenuOptions(options), {
      SortBy: "SortName",
      SortOrder: "Ascending",
      Recursive: options.Recursive == null ? true : options.Recursive,
      EnableImages: false,
      EnableUserData: false,
      GenreIds: options.GenreIds,
      PersonIds: options.PersonIds,
      StudioIds: options.StudioIds,
      ParentId: options.parentId,
      IncludeItemTypes: options.itemTypes.join(','),
      OuterIds: outerItemIds
    }, query);
    return apiClient.getTags(apiClient.getCurrentUserId(), query);
  }
  function loadTags(context, options) {
    renderMultiSelectList(context.querySelector('.tagFilters'), getTags.bind(options), options, 'TagIds', ',');
  }
  function getYears(query) {
    var options = this;
    var apiClient = _connectionmanager.default.getApiClient(options.serverId);
    var outerItemIds = query.Ids;
    query.Ids = null;
    query = Object.assign(getBaseFilterMenuOptions(options), {
      SortBy: "SortName",
      SortOrder: "Descending",
      Recursive: options.Recursive == null ? true : options.Recursive,
      EnableImages: false,
      EnableUserData: false,
      GenreIds: options.GenreIds,
      PersonIds: options.PersonIds,
      StudioIds: options.StudioIds,
      ParentId: options.parentId,
      IncludeItemTypes: options.itemTypes.join(','),
      OuterIds: outerItemIds
    }, query);
    return apiClient.getYears(apiClient.getCurrentUserId(), query);
  }
  function loadYears(context, options) {
    renderMultiSelectList(context.querySelector('.yearFilters'), getYears.bind(options), options, 'Years', ',');
  }
  function getContainers(query) {
    var options = this;
    var apiClient = _connectionmanager.default.getApiClient(options.serverId);
    var outerItemIds = query.Ids;
    query.Ids = null;
    query = Object.assign(getBaseFilterMenuOptions(options), {
      SortBy: "SortName",
      SortOrder: "Ascending",
      Recursive: options.Recursive == null ? true : options.Recursive,
      EnableImages: false,
      EnableUserData: false,
      GenreIds: options.GenreIds,
      PersonIds: options.PersonIds,
      StudioIds: options.StudioIds,
      ParentId: options.parentId,
      IncludeItemTypes: options.itemTypes.join(','),
      OuterIds: outerItemIds
    }, query);
    return apiClient.getContainers(apiClient.getCurrentUserId(), query);
  }
  function loadContainers(context, options) {
    renderMultiSelectList(context.querySelector('.containerFilters'), getContainers.bind(options), options, 'Containers', ',');
  }
  function getAudioCodecs(query) {
    var options = this;
    var apiClient = _connectionmanager.default.getApiClient(options.serverId);
    var outerItemIds = query.Ids;
    query.Ids = null;
    query = Object.assign(getBaseFilterMenuOptions(options), {
      SortBy: "SortName",
      SortOrder: "Ascending",
      Recursive: options.Recursive == null ? true : options.Recursive,
      EnableImages: false,
      EnableUserData: false,
      GenreIds: options.GenreIds,
      PersonIds: options.PersonIds,
      StudioIds: options.StudioIds,
      ParentId: options.parentId,
      IncludeItemTypes: options.itemTypes.join(','),
      OuterIds: outerItemIds
    }, query);
    return apiClient.getAudioCodecs(apiClient.getCurrentUserId(), query);
  }
  function loadAudioCodecs(context, options) {
    renderMultiSelectList(context.querySelector('.audioCodecFilters'), getAudioCodecs.bind(options), options, 'AudioCodecs', ',');
  }
  function getAudioLayouts(query) {
    var options = this;
    var apiClient = _connectionmanager.default.getApiClient(options.serverId);
    var outerItemIds = query.Ids;
    query.Ids = null;
    query = Object.assign(getBaseFilterMenuOptions(options), {
      SortBy: "SortName",
      SortOrder: "Ascending",
      Recursive: options.Recursive == null ? true : options.Recursive,
      EnableImages: false,
      EnableUserData: false,
      GenreIds: options.GenreIds,
      PersonIds: options.PersonIds,
      StudioIds: options.StudioIds,
      ParentId: options.parentId,
      IncludeItemTypes: options.itemTypes.join(','),
      OuterIds: outerItemIds
    }, query);
    return apiClient.getAudioLayouts(apiClient.getCurrentUserId(), query);
  }
  function loadAudioLayouts(context, options) {
    renderMultiSelectList(context.querySelector('.audioLayoutFilters'), getAudioLayouts.bind(options), options, 'AudioLayouts', ',');
  }
  function getAudioLanguages(query) {
    var options = this;
    var apiClient = _connectionmanager.default.getApiClient(options.serverId);
    var outerItemIds = query.Ids;
    query.Ids = null;
    query = Object.assign(getBaseFilterMenuOptions(options), {
      SortBy: "SortName",
      SortOrder: "Ascending",
      Recursive: options.Recursive == null ? true : options.Recursive,
      EnableImages: false,
      EnableUserData: false,
      GenreIds: options.GenreIds,
      PersonIds: options.PersonIds,
      StudioIds: options.StudioIds,
      ParentId: options.parentId,
      IncludeItemTypes: options.itemTypes.join(','),
      StreamType: 'Audio',
      OuterIds: outerItemIds
    }, query);
    return apiClient.getStreamLanguages(apiClient.getCurrentUserId(), query);
  }
  function loadAudioLanguages(context, options) {
    renderMultiSelectList(context.querySelector('.audioLanguageFilters'), getAudioLanguages.bind(options), options, 'AudioLanguages', ',');
  }
  function getSubtitleLanguages(query) {
    var options = this;
    var apiClient = _connectionmanager.default.getApiClient(options.serverId);
    var outerItemIds = query.Ids;
    query.Ids = null;
    query = Object.assign(getBaseFilterMenuOptions(options), {
      SortBy: "SortName",
      SortOrder: "Ascending",
      Recursive: options.Recursive == null ? true : options.Recursive,
      EnableImages: false,
      EnableUserData: false,
      GenreIds: options.GenreIds,
      PersonIds: options.PersonIds,
      StudioIds: options.StudioIds,
      ParentId: options.parentId,
      IncludeItemTypes: options.itemTypes.join(','),
      StreamType: 'Subtitle',
      OuterIds: outerItemIds
    }, query);
    return apiClient.getStreamLanguages(apiClient.getCurrentUserId(), query);
  }
  function loadSubtitleLanguages(context, options) {
    renderMultiSelectList(context.querySelector('.subtitleLanguageFilters'), getSubtitleLanguages.bind(options), options, 'SubtitleLanguages', ',');
  }
  function getVideoCodecs(query) {
    var options = this;
    var apiClient = _connectionmanager.default.getApiClient(options.serverId);
    var outerItemIds = query.Ids;
    query.Ids = null;
    query = Object.assign(getBaseFilterMenuOptions(options), {
      SortBy: "SortName",
      SortOrder: "Ascending",
      Recursive: options.Recursive == null ? true : options.Recursive,
      EnableImages: false,
      EnableUserData: false,
      GenreIds: options.GenreIds,
      PersonIds: options.PersonIds,
      StudioIds: options.StudioIds,
      ParentId: options.parentId,
      IncludeItemTypes: options.itemTypes.join(','),
      OuterIds: outerItemIds
    }, query);
    return apiClient.getVideoCodecs(apiClient.getCurrentUserId(), query);
  }
  function loadVideoCodecs(context, options) {
    renderMultiSelectList(context.querySelector('.videoCodecFilters'), getVideoCodecs.bind(options), options, 'VideoCodecs', ',');
  }
  function getExtendedVideoTypes(query) {
    var options = this;
    var apiClient = _connectionmanager.default.getApiClient(options.serverId);
    var outerItemIds = query.Ids;
    query.Ids = null;
    query = Object.assign(getBaseFilterMenuOptions(options), {
      SortBy: "SortName",
      SortOrder: "Ascending",
      Recursive: options.Recursive == null ? true : options.Recursive,
      EnableImages: false,
      EnableUserData: false,
      GenreIds: options.GenreIds,
      PersonIds: options.PersonIds,
      StudioIds: options.StudioIds,
      ParentId: options.parentId,
      IncludeItemTypes: options.itemTypes.join(','),
      OuterIds: outerItemIds
    }, query);
    return apiClient.getExtendedVideoTypes(apiClient.getCurrentUserId(), query);
  }
  function loadExtendedVideoTypes(context, options) {
    renderMultiSelectList(context.querySelector('.fldExtendedVideoTypes'), getExtendedVideoTypes.bind(options), options, 'ExtendedVideoTypes', ',');
  }
  function getSubtitleCodecs(query) {
    var options = this;
    var apiClient = _connectionmanager.default.getApiClient(options.serverId);
    var outerItemIds = query.Ids;
    query.Ids = null;
    query = Object.assign(getBaseFilterMenuOptions(options), {
      SortBy: "SortName",
      SortOrder: "Ascending",
      Recursive: options.Recursive == null ? true : options.Recursive,
      EnableImages: false,
      EnableUserData: false,
      GenreIds: options.GenreIds,
      PersonIds: options.PersonIds,
      StudioIds: options.StudioIds,
      ParentId: options.parentId,
      IncludeItemTypes: options.itemTypes.join(','),
      OuterIds: outerItemIds
    }, query);
    return apiClient.getSubtitleCodecs(apiClient.getCurrentUserId(), query);
  }
  function loadSubtitleCodecs(context, options) {
    renderMultiSelectList(context.querySelector('.subtitleCodecFilters'), getSubtitleCodecs.bind(options), options, 'SubtitleCodecs', ',');
  }
  function updateClearButton(context) {
    if (context.querySelector('.filter-active') || context.querySelector('input:checked')) {
      context.querySelector('.filterMenuClearButton').classList.remove('hide');
    } else {
      context.querySelector('.filterMenuClearButton').classList.add('hide');
    }
  }
  function afterSelectValueSet(elem, value, isChangeEvent) {
    var selectContainer = elem.closest('.selectContainer');
    if (selectContainer) {
      var filterIndicator = selectContainer.querySelector('.filterMenu-indicator');
      if (value) {
        if (!filterIndicator) {
          selectContainer.insertAdjacentHTML('afterbegin', '<div class="filterMenu-indicator filter-active"></div>');
        }
      } else {
        if (filterIndicator) {
          filterIndicator.remove();
        }
      }
    }
  }
  function onValueChange() {
    if (this.tagName === 'SELECT') {
      afterSelectValueSet(this, this.singleValue, true);
    }
    var dlg = this.closest('.filterMenuDialog');
    if (dlg) {
      updateClearButton(dlg);
    }
  }
  function initEditor(context, settings) {
    var elems = context.querySelectorAll('.simpleFilter');
    for (var i = 0, length = elems.length; i < length; i++) {
      var val = settings[elems[i].getAttribute('data-settingname')];
      if (elems[i].tagName === 'INPUT') {
        if (elems[i].getAttribute('data-invert') === 'true') {
          elems[i].checked = val === 'false';
        } else {
          elems[i].checked = val || false;
        }
      } else if (elems[i].classList.contains('selectContainer')) {
        var selectElem = elems[i].querySelector('select');
        if (val == null) {
          selectElem.singleValue = '';
          afterSelectValueSet(selectElem, '');
        } else {
          selectElem.singleValue = val.toString();
          afterSelectValueSet(selectElem, val.toString());
        }
      } else {
        elems[i].querySelector('input').checked = val || false;
      }
    }
    var selectSeriesStatus = context.querySelector('.selectSeriesStatus');
    selectSeriesStatus.value = settings.SeriesStatus || '';
    afterSelectValueSet(selectSeriesStatus, settings.SeriesStatus || '');
    elems = context.querySelectorAll('.multiSettingsSection');
    for (var _i = 0, _length = elems.length; _i < _length; _i++) {
      if (elems[_i].querySelector('.viewSetting:not(.hide)') || elems[_i].querySelector('.selectContainer:not(.hide)')) {
        elems[_i].classList.remove('hide');
      } else {
        elems[_i].classList.add('hide');
      }
    }
    elems = context.querySelectorAll('select,input');
    for (var _i2 = 0, _length2 = elems.length; _i2 < _length2; _i2++) {
      elems[_i2].addEventListener('change', onValueChange);
    }
  }
  function getChanges(elem, options) {
    var filters = {};
    var selectPlaystate = elem.closest('.selectPlaystate');
    if (selectPlaystate) {
      var _options = selectPlaystate.options;
      var value = selectPlaystate.singleValue;
      for (var i = 0, length = _options.length; i < length; i++) {
        var optionValue = _options[i].value;
        if (optionValue === value) {
          if (optionValue) {
            filters[optionValue] = true;
          }
        } else {
          if (optionValue) {
            filters[optionValue] = null;
          }
        }
      }
      return filters;
    }
    var simpleFilter = elem.closest('.simpleFilter');
    if (simpleFilter) {
      if (simpleFilter.tagName === 'INPUT') {
        setBasicFilter(filters, simpleFilter.getAttribute('data-settingname'), simpleFilter);
      } else if (simpleFilter.classList.contains('selectContainer')) {
        setBasicFilter(filters, simpleFilter.getAttribute('data-settingname'), simpleFilter.querySelector('select'));
      } else {
        setBasicFilter(filters, simpleFilter.getAttribute('data-settingname'), simpleFilter.querySelector('input'));
      }
      return filters;
    }
    var multiValueElem = elem.closest('select[multiple]');
    if (multiValueElem) {
      var settingName = multiValueElem.getAttribute('data-settingname');
      var delimiter = multiValueElem.getAttribute('data-delimiter') || ',';
      if (options.multiSelectAsArray) {
        filters[settingName] = multiValueElem.getValues();
      } else {
        filters[settingName] = multiValueElem.getValues().join(delimiter) || null;
      }
      return filters;
    }
    var selectSeriesStatusElem = elem.closest('.selectSeriesStatus');
    if (selectSeriesStatusElem) {
      var _settingName = selectSeriesStatusElem.getAttribute('data-settingname');
      filters[_settingName] = selectSeriesStatusElem.value || null;
      return filters;
    }
    return filters;
  }
  function setBasicFilter(filters, key, elem) {
    var value;
    if (elem.tagName === 'SELECT') {
      value = elem.singleValue || null;
    } else {
      if (elem.getAttribute('data-invert') === 'true') {
        value = elem.checked ? false : null;
      } else {
        value = elem.checked;
        value = value ? value : null;
      }
    }
    filters[key] = value;
  }
  function FilterMenu() {
    this.boundOnChange = this.onChange.bind(this);
  }
  function dispatchChange(elem) {
    elem.dispatchEvent(new CustomEvent('change', {
      bubbles: true
    }));
  }
  function onResetClick() {
    var instance = this;
    instance.reset();
    var context = instance.context;
    var dialog = context.closest('.filterMenuDialog');
    _dialoghelper.default.close(dialog);
  }
  FilterMenu.prototype.onChange = function (e) {
    this.options.onChange(getChanges(e.target, this.options));
  };
  FilterMenu.prototype.reset = function () {
    var context = this.context;
    var elems = context.querySelectorAll('select,input');
    for (var i = 0, length = elems.length; i < length; i++) {
      var elem = elems[i];
      switch (elem.tagName) {
        case 'INPUT':
          switch (elem.type) {
            case 'checkbox':
              elem.checked = false;
              dispatchChange(elem);
              break;
            default:
              break;
          }
          break;
        case 'SELECT':
          elem.setValues([], true);
          break;
        default:
          break;
      }
    }
  };
  FilterMenu.prototype.embed = function (context, options) {
    var instance = this;
    instance.options = options;
    instance.context = context;
    return require(['text!./modules/filtermenu/filtermenu.template.html']).then(function (responses) {
      var template = responses[0];
      var html = '';
      html += template;
      context.innerHTML = _globalize.default.translateDocument(html, 'sharedcomponents');
      var settingElements = context.querySelectorAll('.viewSetting');
      for (var i = 0, length = settingElements.length; i < length; i++) {
        if (options.visibleSettings.indexOf(settingElements[i].getAttribute('data-settingname')) === -1) {
          settingElements[i].classList.add('hide');
        } else {
          settingElements[i].classList.remove('hide');
        }
      }
      initEditor(context, options.settings);
      loadPlayState(context, options);
      if (options.visibleSettings.indexOf('Genres') !== -1) {
        loadGenres(context, options);
      }
      if (options.visibleSettings.indexOf('Studios') !== -1) {
        loadStudios(context, options);
      }
      if (options.visibleSettings.indexOf('Tags') !== -1) {
        loadTags(context, options);
      }
      if (options.visibleSettings.indexOf('OfficialRatings') !== -1) {
        loadOfficialRatings(context, options);
      }
      if (options.visibleSettings.indexOf('Containers') !== -1) {
        loadContainers(context, options);
      }
      if (options.visibleSettings.indexOf('Years') !== -1) {
        loadYears(context, options);
      }
      if (options.visibleSettings.indexOf('AudioCodecs') !== -1) {
        loadAudioCodecs(context, options);
        loadAudioLanguages(context, options);
      }
      if (options.visibleSettings.indexOf('AudioLayouts') !== -1) {
        loadAudioLayouts(context, options);
      }
      if (options.visibleSettings.indexOf('VideoCodecs') !== -1) {
        loadVideoCodecs(context, options);
      }
      if (options.visibleSettings.indexOf('ExtendedVideoTypes') !== -1) {
        loadExtendedVideoTypes(context, options);
      }
      if (options.visibleSettings.indexOf('SubtitleCodecs') !== -1) {
        loadSubtitleCodecs(context, options);
        loadSubtitleLanguages(context, options);
      }
      context.addEventListener('change', instance.boundOnChange, true);
      if (options.showHeader) {
        context.querySelector('.mainHeader').classList.remove('hide');
      }
    });
  };
  FilterMenu.prototype.show = function (options) {
    var instance = this;
    var dialogOptions = {
      removeOnClose: true,
      scrollY: false,
      // allow a little space between the borders
      offsetTop: 2,
      positionTo: options.positionTo,
      positionY: options.positionY
    };
    if (_layoutmanager.default.tv) {
      dialogOptions.size = 'fullscreen';
    }
    var dlg = _dialoghelper.default.createDialog(dialogOptions);
    dlg.classList.add('formDialog', 'filterMenuDialog');
    var html = '';
    html += '<div class="formDialogHeader">';
    html += '<button type="button" is="emby-dialogclosebutton"></button>';
    html += '<h3 class="formDialogHeaderTitle">' + _globalize.default.translate('Filters') + '</h3>';
    html += '<button type="button" is="emby-button" class="button-link filterMenuClearButton hide">' + _globalize.default.translate('HeaderClearFilters') + '</button>';
    html += '</div>';
    html += '<div is="emby-scroller" data-horizontal="false" data-forcescrollbar="true" data-focusscroll="true" class="formDialogContent">';
    html += '<div class="scrollSlider">';
    html += '<form class="dialogContentInner dialog-content-centered padded-left padded-right focuscontainer navout-up fieldsets">';
    html += '</form>';
    html += '</div>';
    html += '</div>';
    dlg.innerHTML = _globalize.default.translateDocument(html, 'sharedcomponents');
    options.originalOnChange = options.onChange;
    var submitted;
    options.onChange = function (changes) {
      submitted = true;
      options.originalOnChange(changes);
    };
    return instance.embed(dlg.querySelector('form'), options).then(function () {
      updateClearButton(dlg);
      dlg.querySelector('.filterMenuClearButton').addEventListener('click', onResetClick.bind(instance));
      dlg.querySelector('form').addEventListener('submit', onSubmit);
      return _dialoghelper.default.open(dlg).then(function () {
        instance.destroy();
        if (submitted) {
          return Promise.resolve();
        }
        return Promise.reject();
      });
    });
  };
  FilterMenu.prototype.destroy = function () {
    if (this.context) {
      if (this.boundOnChange) {
        this.context.removeEventListener('change', this.boundOnChange, true);
      }
    }
    this.boundOnChange = null;
    this.context = null;
    this.options = null;
  };
  var _default = _exports.default = FilterMenu;
});
