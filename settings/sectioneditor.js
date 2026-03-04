define(["exports", "./../modules/dialoghelper/dialoghelper.js", "./../modules/layoutmanager.js", "./../modules/common/globalize.js", "./../modules/focusmanager.js", "./../modules/common/responsehelper.js", "./../modules/common/textencoding.js", "./../modules/common/itemmanager/itemmanager.js", "./../modules/emby-elements/emby-dialogclosebutton/emby-dialogclosebutton.js", "./../modules/emby-elements/emby-select/emby-select.js", "./../modules/emby-elements/emby-button/emby-button.js", "./../modules/emby-elements/emby-toggle/emby-toggle.js", "./../modules/filtermenu/filtermenu.js"], function (_exports, _dialoghelper, _layoutmanager, _globalize, _focusmanager, _responsehelper, _textencoding, _itemmanager, _embyDialogclosebutton, _embySelect, _embyButton, _embyToggle, _filtermenu) {
  Object.defineProperty(_exports, "__esModule", {
    value: true
  });
  _exports.default = void 0;
  /* jshint module: true */

  require(['flexStyles', 'formDialogStyle', 'material-icons']);
  function SectionEditor() {}
  function updateSectionFromForm(instance, context, section, options) {
    var _context$querySelecto, _context$querySelecto2, _context$querySelecto3, _context$querySelecto4, _context$querySelecto5, _context$querySelecto6, _context$querySelecto7, _context$querySelecto8, _context$querySelecto9;
    section.SectionType = context.querySelector('.selectSectionType').value;
    section.CustomName = context.querySelector('.txtCustomName').value || null;
    section.Subtitle = context.querySelector('.txtSubtitle').value || null;
    section.ViewType = ((_context$querySelecto = context.querySelector('.selectContainer:not(.hide) .selectViewType')) == null ? void 0 : _context$querySelecto.value) || null;
    section.ScrollDirection = ((_context$querySelecto2 = context.querySelector('.selectContainer:not(.hide) .selectScrollDirection')) == null ? void 0 : _context$querySelecto2.value) || null;
    section.ImageType = ((_context$querySelecto3 = context.querySelector('.selectContainer:not(.hide) .selectImageType')) == null ? void 0 : _context$querySelecto3.value) || null;
    section.ParentId = ((_context$querySelecto4 = context.querySelector('.selectContainer:not(.hide) .selectContainerItem')) == null ? void 0 : _context$querySelecto4.singleValue) || null;
    section.SortBy = ((_context$querySelecto5 = context.querySelector('.selectContainer:not(.hide) .selectSortBy')) == null ? void 0 : _context$querySelecto5.value) || null;
    section.SortOrder = ((_context$querySelecto6 = context.querySelector('.selectContainer:not(.hide) .selectSortOrder')) == null ? void 0 : _context$querySelecto6.value) || null;
    var itemTypes = (_context$querySelecto7 = context.querySelector('.selectContainer:not(.hide) .selectItemTypes')) == null ? void 0 : _context$querySelecto7.value;
    if (itemTypes) {
      itemTypes = itemTypes.split(',');
    } else {
      itemTypes = [];
    }
    section.ItemTypes = itemTypes;
    var includeNextUpInResume = (_context$querySelecto8 = context.querySelector('.toggleContainer:not(.hide) .chkIncludeNextUpInResume')) == null ? void 0 : _context$querySelecto8.checked;
    if (includeNextUpInResume == null) {
      includeNextUpInResume = true;
    }
    section.IncludeNextUpInResume = includeNextUpInResume;
    if (!section.CustomName) {
      section.Name = null;
    }
    var selectedFolderValues = ((_context$querySelecto9 = context.querySelector('.selectContainer:not(.hide) .selectLibraries')) == null ? void 0 : _context$querySelecto9.getValues()) || [];
    if (!selectedFolderValues.length) {
      section.ExcludedFolders = [];
    } else {
      section.ExcludedFolders = options.userviews.Items.filter(function (i) {
        return !selectedFolderValues.includes(i.Id) && !selectedFolderValues.includes(i.Guid || i.Id);
      }).map(function (i) {
        return i.Id;
      });
    }
    section.Query = instance.currentFilterQuery;
  }
  function getAvailableFieldIdMap(fields) {
    var result = {};
    for (var i = 0, length = fields.length; i < length; i++) {
      var field = fields[i];
      result[field.id] = field;
    }
    return result;
  }
  function fillSortBy(form, sectionType, isUserChange, options) {
    var itemType;
    switch (sectionType) {
      case 'playlist':
        itemType = 'PlaylistItem';
        break;
      case 'boxset':
        itemType = 'BoxSetItem';
        break;
      default:
        break;
    }
    var apiClient = options.apiClient;
    var availableFields = _itemmanager.default.getAvailableFields({
      itemType: itemType,
      apiClient: apiClient
    });
    var sortOptions = _itemmanager.default.getSortMenuOptions({
      itemType: itemType,
      apiClient: apiClient,
      availableFieldIds: getAvailableFieldIdMap(availableFields)
    });
    var selectSortBy = form.querySelector('.selectSortBy');
    selectSortBy.innerHTML = sortOptions.map(function (o) {
      return '<option value="' + o.value + '">' + _textencoding.default.htmlEncode(o.name) + '</option>';
    });
    if (isUserChange) {
      selectSortBy.value = '';
      form.querySelector('.selectSortOrder').value = '';
    }
  }
  function fillViewType(form, sectionType, isUserChange, options) {
    var items = [];
    switch (sectionType) {
      case 'userviews':
        items.push({
          name: _globalize.default.translate('Cards'),
          value: ''
        });
        items.push({
          name: _globalize.default.translate('Buttons'),
          value: 'buttons'
        });
        break;
      //case 'latestmoviereleases':
      //    items.push({
      //        name: globalize.translate('Cards'),
      //        value: ''
      //    });
      //    items.push({
      //        name: globalize.translate('Spotlight'),
      //        value: 'spotlight'
      //    });
      //    break;
      default:
        break;
    }
    var selectViewType = form.querySelector('.selectViewType');
    selectViewType.innerHTML = items.map(function (o) {
      return '<option value="' + o.value + '">' + _textencoding.default.htmlEncode(o.name) + '</option>';
    });
    if (isUserChange) {
      selectViewType.value = '';
    }
  }
  function updateContainerLabel(form, sectionType) {
    var label;
    switch (sectionType) {
      case 'playlist':
        label = _globalize.default.translate('Playlist');
        break;
      case 'boxset':
        label = _globalize.default.translate('Collection');
        break;
      case 'studio':
        label = _globalize.default.translate('Studio');
        break;
      case 'tag':
        label = _globalize.default.translate('Tag');
        break;
      default:
        label = _globalize.default.translate('Genre');
        break;
    }
    if (!label) {
      return;
    }
    form.querySelector('.selectContainerItem').setLabel(label);
  }
  function onSectionTypeChange(instance, selectSectionType, isUserChange, options) {
    var form = selectSectionType.closest('form');
    var sectionType = selectSectionType.value;
    updateContainerLabel(form, sectionType);
    switch (sectionType) {
      case 'items':
        form.querySelector('.fldItemTypes').classList.remove('hide');
        form.querySelector('.selectItemTypes').setAttribute('required', 'required');
        break;
      default:
        form.querySelector('.fldItemTypes').classList.add('hide');
        form.querySelector('.selectItemTypes').removeAttribute('required');
        break;
    }
    switch (sectionType) {
      case 'container':
      case 'playlist':
      case 'boxset':
      case 'tag':
      case 'genre':
      case 'studio':
      case 'playlists':
      case 'collections':
      case 'items':
        form.querySelector('.fldSortBy').classList.remove('hide');
        form.querySelector('.fldSortOrder').classList.remove('hide');
        break;
      default:
        form.querySelector('.fldSortBy').classList.add('hide');
        form.querySelector('.fldSortOrder').classList.add('hide');
        break;
    }
    switch (sectionType) {
      case 'resume':
        form.querySelector('.fldIncludeNextUpInResume').classList.remove('hide');
        break;
      default:
        form.querySelector('.fldIncludeNextUpInResume').classList.add('hide');
        break;
    }
    switch (sectionType) {
      case 'container':
      case 'playlist':
      case 'boxset':
      case 'tag':
      case 'genre':
      case 'studio':
        form.querySelector('.fldContainer').classList.remove('hide');
        form.querySelector('.selectContainerItem').setAttribute('required', 'required');
        break;
      default:
        form.querySelector('.fldContainer').classList.add('hide');
        form.querySelector('.selectContainerItem').removeAttribute('required');
        break;
    }
    switch (sectionType) {
      case 'userviews':
        //case 'latestmoviereleases':
        form.querySelector('.fldViewType').classList.remove('hide');
        break;
      default:
        form.querySelector('.fldViewType').classList.add('hide');
        break;
    }
    switch (sectionType) {
      case 'latestmediablock':
      case 'resume':
      case 'resumeaudio':
      case 'nextup':
      case 'latestmoviereleases':
      case 'latestepisodereleases':
      case 'container':
      case 'playlist':
      case 'boxset':
      case 'tag':
      case 'genre':
      case 'studio':
      case 'userviews':
      case 'items':
        form.querySelector('.fldLibraries').classList.remove('hide');
        break;
      default:
        form.querySelector('.fldLibraries').classList.add('hide');
        break;
    }
    switch (sectionType) {
      case 'latestmediablock':
        form.querySelector('.fldCustomName').classList.add('hide');
        form.querySelector('.fldSubtitle').classList.add('hide');
        break;
      default:
        form.querySelector('.fldCustomName').classList.remove('hide');
        form.querySelector('.fldSubtitle').classList.add('hide');
        break;
    }
    switch (sectionType) {
      case 'resume':
      case 'nextup':
      case 'activerecordings':
      case 'latestmoviereleases':
      case 'latestepisodereleases':
      case 'collections':
      case 'container':
      case 'playlist':
      case 'boxset':
      case 'tag':
      case 'genre':
      case 'studio':
      case 'items':
        form.querySelector('.fldImageType').classList.remove('hide');
        break;
      default:
        form.querySelector('.fldImageType').classList.add('hide');
        break;
    }
    switch (sectionType) {
      case 'items':
        break;
      default:
        instance.context.querySelector('.filters').classList.add('hide');
        instance.destroyFilterMenu();
        break;
    }
    fillSortBy(form, sectionType, isUserChange, options);
    fillViewType(form, sectionType, isUserChange, options);
    if (!isUserChange) {
      return;
    }
    form.querySelector('.selectScrollDirection').value = '';
    form.querySelector('.selectImageType').value = '';
    form.querySelector('.selectItemTypes').value = '';
    form.querySelector('.txtCustomName').value = '';
    form.querySelector('.txtSubtitle').value = '';
    form.querySelector('.chkIncludeNextUpInResume').checked = true;
    form.querySelector('.selectLibraries').values = options.userviews.Items.map(function (i) {
      return i.Id;
    });
    form.querySelector('.selectContainerItem').singleValue = '';
  }
  function onItemTypeChange(instance, selectItemTypes, isUserChange, options) {
    var itemTypes = selectItemTypes.value;
    var selectSectionType = instance.context.querySelector('.selectSectionType');
    var sectionType = selectSectionType.value;
    switch (sectionType) {
      case 'items':
        {
          if (itemTypes) {
            instance.resetFilterMenu(isUserChange);
            return;
          }
          break;
        }
      default:
        break;
    }
    instance.context.querySelector('.filters').classList.add('hide');
    instance.destroyFilterMenu();
  }
  function onItemTypeChangeEvent(e) {
    var instance = this;
    var options = instance.options;
    var selectItemTypes = e.target;
    onItemTypeChange(instance, selectItemTypes, true, options);
  }
  function onSectionTypeChangeEvent(e) {
    var instance = this;
    var options = instance.options;
    var selectSectionType = e.target;
    onSectionTypeChange(instance, selectSectionType, true, options);
  }
  function updateFormFromSection(instance, context, section, options) {
    context.querySelector('.selectSectionType').value = section.SectionType;
    onSectionTypeChange(instance, context.querySelector('.selectSectionType'), false, options);
    context.querySelector('.selectSortBy').value = section.SortBy || '';
    context.querySelector('.selectSortOrder').value = section.SortOrder || '';
    context.querySelector('.txtCustomName').value = section.CustomName || '';
    context.querySelector('.txtSubtitle').value = section.Subtitle || '';
    context.querySelector('.selectViewType').value = section.ViewType || '';
    context.querySelector('.selectScrollDirection').value = section.ScrollDirection || '';
    context.querySelector('.selectImageType').value = section.ImageType || '';
    context.querySelector('.selectItemTypes').value = (section.ItemTypes || []).join(',');
    onItemTypeChange(instance, context.querySelector('.selectItemTypes'), false, options);
    context.querySelector('.chkIncludeNextUpInResume').checked = section.IncludeNextUpInResume;
    var sectionExcludedFolders = section.ExcludedFolders || [];
    context.querySelector('.selectLibraries').values = options.userviews.Items.filter(function (i) {
      return !sectionExcludedFolders.includes(i.Id) && !sectionExcludedFolders.includes(i.Guid || i.Id);
    }).map(function (i) {
      return i.Id;
    });
    context.querySelector('.selectContainerItem').singleValue = section.ParentId || '';
  }
  function onSubmit(e) {
    e.preventDefault();
    var instance = this;
    var options = instance.options;
    var section = options.items[0].OriginalItem;
    updateSectionFromForm(instance, instance.context, section, options);
    var apiClient = options.apiClient;
    apiClient.saveHomeScreenSection(options.userId, section).then(function () {
      instance.closeDialog();
    }, _responsehelper.default.handleErrorResponse);
  }
  function onOpened() {
    var instance = this;
    var dlg = instance.context;

    // need to waitForCustomElementUpgrade in order to use setLabel
    return dlg.querySelector('.selectContainerItem').waitForCustomElementUpgrade().then(function () {
      var options = instance.options;
      var section = options.items[0].OriginalItem;
      updateFormFromSection(instance, dlg, section, options);
      _focusmanager.default.autoFocus(dlg, {
        skipIfNotEnabled: true
      });
    });
  }
  function fetchContainers(query) {
    var instance = this;
    var options = instance.options;
    var apiClient = options.apiClient;
    return apiClient.getItems(options.userId, Object.assign({
      Recursive: true,
      IncludeItemTypes: instance.getItemTypes().join(',') || null,
      SortBy: 'SortName',
      Fields: 'PrimaryImageAspectRatio'
    }, query));
  }
  function fetchLibraries(query) {
    var instance = this;
    var items = instance.options.userviews.Items;
    var total = items.length;
    if (query) {
      if (query.StartIndex) {
        items = items.slice(query.StartIndex);
      }
      if (query.Limit) {
        items.length = Math.min(query.Limit, items.length);
      }
    }
    return Promise.resolve({
      Items: items,
      TotalRecordCount: total
    });
  }
  SectionEditor.prototype.getFilters = function () {
    return {
      IsPlayed: false,
      IsUnplayed: false,
      IsFavorite: false,
      GenreIds: '',
      StudioIds: '',
      TagIds: ''
    };
  };
  SectionEditor.prototype.getItemTypes = function () {
    var instance = this;
    var sectionType = instance.context.querySelector('.selectSectionType').value;
    switch (sectionType) {
      case 'studio':
        return ['Studio'];
      case 'tag':
        return ['Tag'];
      case 'playlist':
        return ['Playlist'];
      case 'boxset':
        return ['BoxSet'];
      case 'items':
        {
          var itemTypes = instance.context.querySelector('.selectItemTypes').value;
          if (!itemTypes) {
            return [];
          }
          return itemTypes.split(',');
        }
      default:
        {
          return [];
        }
    }
  };
  SectionEditor.prototype.getVisibleFilters = function () {
    var list = [];

    //const itemType = this.getItemTypes()[0];

    //list.push('IsUnplayed');
    //list.push('IsPlayed');

    //switch (itemType) {

    //    case '':
    //    case 'Movie':
    //    case 'Episode':
    //    case 'Trailer':
    //    case 'Audio':
    //    case 'MusicVideo':
    //    case 'Video':
    //        list.push('IsResumable');
    //        break;
    //    default:
    //        break;
    //}

    list.push('IsFavorite');
    list.push('Genres');
    list.push('Studios');
    list.push('Tags');
    return list;
  };
  SectionEditor.prototype.show = function (options) {
    this.options = options;
    var instance = this;
    return require(['text!./settings/sectioneditor.template.html']).then(function (responses) {
      return options.apiClient.getUserViews({
        IncludeHidden: true,
        AllowDynamicChildren: false
      }, options.userId).then(function (userviews) {
        options.userviews = userviews;
        var template = responses[0];
        instance.hasChanges = false;
        instance.newStreamIndex = null;
        var dialogOptions = {
          removeOnClose: true,
          scrollY: false,
          autoFocus: false
        };
        if (_layoutmanager.default.tv) {
          dialogOptions.size = 'fullscreen';
        } else {
          dialogOptions.size = 'medium-tall';
        }
        var dlg = _dialoghelper.default.createDialog(dialogOptions);
        instance.context = dlg;
        var section = options.items[0].OriginalItem;
        dlg.classList.add('formDialog');
        dlg.innerHTML = _globalize.default.translateDocument(template, 'sharedcomponents');
        if (section.Id) {
          dlg.querySelector('.formDialogHeaderTitle').innerHTML = _globalize.default.translate('HeaderEditSection');
        } else {
          dlg.querySelector('.formDialogHeaderTitle').innerHTML = _globalize.default.translate('HeaderAddSection');
        }
        dlg.querySelector('.selectSectionType').addEventListener('change', onSectionTypeChangeEvent.bind(instance));
        dlg.querySelector('.selectItemTypes').addEventListener('change', onItemTypeChangeEvent.bind(instance));
        dlg.querySelector('.selectLibraries').getItems = fetchLibraries.bind(instance);
        dlg.querySelector('.selectContainerItem').getItems = fetchContainers.bind(instance);
        var form = dlg.querySelector('form');
        form.addEventListener('submit', onSubmit.bind(instance));
        dlg.addEventListener('opened', onOpened.bind(instance));
        return _dialoghelper.default.open(dlg).catch(function () {
          return Promise.resolve();
        });
      });
    });
  };
  SectionEditor.prototype.closeDialog = function () {
    _dialoghelper.default.close(this.context);
  };
  SectionEditor.prototype.resetFilterMenu = function (isUserChange) {
    this.destroyFilterMenu();
    var instance = this;

    // TODO: This is some duplicated code from the querying method
    var query = {};
    var onChange = function (changes) {
      var keys = Object.keys(changes);
      for (var i = 0, length = keys.length; i < length; i++) {
        var key = keys[i];
        instance.currentFilterQuery[key] = changes[key];
      }
    };
    var filtersElem = instance.context.querySelector('.filters');
    var filterMenu = new _filtermenu.default();
    if (isUserChange) {
      instance.currentFilterQuery = {};
    } else {
      instance.currentFilterQuery = Object.assign({}, instance.options.items[0].OriginalItem.Query);
    }
    filterMenu.embed(filtersElem, Object.assign(query, {
      settings: instance.currentFilterQuery,
      visibleSettings: instance.getVisibleFilters(),
      onChange: onChange,
      parentId: null,
      itemTypes: instance.getItemTypes(),
      serverId: instance.options.apiClient.serverId(),
      filterMenuOptions: {},
      showHeader: true,
      multiSelectAsArray: true
    }));
    instance.filterMenu = filterMenu;
    instance.context.querySelector('.filters').classList.remove('hide');
  };
  SectionEditor.prototype.destroyFilterMenu = function () {
    var _this$filterMenu;
    (_this$filterMenu = this.filterMenu) == null || _this$filterMenu.destroy();
    this.filterMenu = null;
    this.currentFilterQuery = null;
  };
  SectionEditor.prototype.pause = function () {};
  SectionEditor.prototype.destroy = function () {
    this.pause();
    this.destroyFilterMenu();
    this.options = null;
    this.context = null;
  };
  var _default = _exports.default = SectionEditor;
});
