define(["exports", "./../emby-apiclient/connectionmanager.js", "./../emby-apiclient/events.js", "./../dialoghelper/dialoghelper.js", "./../layoutmanager.js", "./../common/globalize.js", "./../common/datetime.js", "./../common/textencoding.js", "./../common/itemmanager/itemmanager.js", "./../loading/loading.js", "./../focusmanager.js", "./../common/servicelocator.js", "./../emby-elements/emby-checkbox/emby-checkbox.js", "./../emby-elements/emby-toggle/emby-toggle.js", "./../emby-elements/emby-input/emby-input.js", "./../emby-elements/emby-select/emby-select.js", "./../emby-elements/emby-textarea/emby-textarea.js", "./../emby-elements/emby-button/emby-button.js", "./../emby-elements/emby-button/paper-icon-button-light.js", "./../emby-elements/emby-scroller/emby-scroller.js", "./../emby-elements/emby-dialogclosebutton/emby-dialogclosebutton.js", "./../common/input/api.js", "./../listview/listview.js", "./externalideditor.js"], function (_exports, _connectionmanager, _events, _dialoghelper, _layoutmanager, _globalize, _datetime, _textencoding, _itemmanager, _loading, _focusmanager, _servicelocator, _embyCheckbox, _embyToggle, _embyInput, _embySelect, _embyTextarea, _embyButton, _paperIconButtonLight, _embyScroller, _embyDialogclosebutton, _api, _listview, _externalideditor) {
  Object.defineProperty(_exports, "__esModule", {
    value: true
  });
  _exports.default = void 0;
  /* jshint module: true */

  require(['formDialogStyle', 'flexStyles', 'css!modules/metadataeditor/metadataeditor.css', 'css!!tv|modules/metadataeditor/metadataeditor_nontv.css']);
  function showPrompt(options) {
    return Emby.importModule('./modules/prompt/prompt.js').then(function (prompt) {
      return prompt(options);
    });
  }
  function isDialog(context) {
    return context.classList.contains('dialog');
  }
  function closeDialog(context, isSubmitted) {
    if (isDialog(context)) {
      _dialoghelper.default.close(context);
    }
  }
  function updateChannelMappings(instance, form, item, apiClient) {
    // The below code uses currentItem because it needs the original values to compare to
    item = instance.currentItem;
    if (item.Type !== 'TvChannel') {
      return Promise.resolve();
    }
    var providerId = form.querySelector('.selectGuideDataProvider').value || null;
    var providerChannelId = form.querySelector('.selectGuideChannel').value || null;
    if (providerId === item.ListingsProviderId && providerChannelId === item.ListingsChannelId) {
      // nothing changed
      return Promise.resolve();
    }
    return apiClient.ajax({
      type: 'POST',
      url: apiClient.getUrl('LiveTv/ChannelMappings'),
      data: {
        providerId: providerId,
        tunerChannelId: item.ManagementId,
        providerChannelId: providerChannelId
      },
      dataType: 'json'
    });
  }
  function showToast(options) {
    return Emby.importModule('./modules/toast/toast.js').then(function (toast) {
      return toast(options);
    });
  }
  function submitUpdatedItem(instance, form, item) {
    var apiClient = _connectionmanager.default.getApiClient(instance.currentItem);
    updateChannelMappings(instance, form, item, apiClient).then(function () {
      apiClient.updateItem(item).then(function () {
        instance.hasChanges = true;
        showToast(_globalize.default.translate('MessageItemSaved'));
        _loading.default.hide();
        closeDialog(instance.context, true);
      });
    });
  }
  function getAlbumArtists(form) {
    return form.querySelector('.txtAlbumArtist').value.trim().split(';').filter(function (s) {
      return s.length > 0;
    }).map(function (a) {
      return {
        Name: a
      };
    });
  }
  function getComposers(form) {
    return form.querySelector('.txtComposer').value.trim().split(';').filter(function (s) {
      return s.length > 0;
    }).map(function (a) {
      return {
        Name: a
      };
    });
  }
  function getArtists(form) {
    return form.querySelector('.txtArtist').value.trim().split(';').filter(function (s) {
      return s.length > 0;
    }).map(function (a) {
      return {
        Name: a
      };
    });
  }
  function onSubmit(e) {
    var _form$querySelector$v, _form$querySelector$v2, _form$querySelector$v3;
    _loading.default.show();
    var instance = this;
    var currentItem = instance.currentItem;
    var form = e.target.closest('form');
    var item = Object.assign({}, currentItem);
    item = Object.assign(item, {
      Name: form.querySelector('.txtName').value,
      ChannelNumber: form.querySelector('.txtChannelNumber').value,
      OriginalTitle: form.querySelector('.txtOriginalName').value,
      ForcedSortName: form.querySelector('.txtSortName').value,
      SortName: form.querySelector('.txtSortName').value,
      CommunityRating: form.querySelector('.txtCommunityRating').value,
      CriticRating: form.querySelector('.txtCriticRating').value,
      IndexNumber: form.querySelector('.txtIndexNumber').value || null,
      ParentIndexNumber: form.querySelector('.txtParentIndexNumber').value || null,
      SortParentIndexNumber: form.querySelector('.txtDisplaySeason').value,
      SortIndexNumber: form.querySelector('.txtDisplayEpisode').value,
      Album: form.querySelector('.txtAlbum').value,
      AlbumArtists: getAlbumArtists(form),
      ArtistItems: getArtists(form),
      Composers: getComposers(form),
      Overview: form.querySelector('.txtOverview').value,
      Status: form.querySelector('.selectStatus').value,
      PremiereDate: (_form$querySelector$v = form.querySelector('.txtPremiereDate').valueAsDateUtc) == null ? void 0 : _form$querySelector$v.toISOString(),
      DateCreated: (_form$querySelector$v2 = form.querySelector('.txtDateAdded').valueAsDateUtc) == null ? void 0 : _form$querySelector$v2.toISOString(),
      EndDate: (_form$querySelector$v3 = form.querySelector('.txtEndDate').valueAsDateUtc) == null ? void 0 : _form$querySelector$v3.toISOString(),
      ProductionYear: form.querySelector('.txtProductionYear').value,
      Video3DFormat: form.querySelector('.select3dFormat').value,
      OfficialRating: form.querySelector('.selectOfficialRating').value,
      CustomRating: form.querySelector('.selectCustomRating').value,
      LockData: form.querySelector(".chkLockData").checked,
      LockedFields: Array.prototype.filter.call(form.querySelectorAll('.chkLockedField'), function (c) {
        return c.checked;
      }).map(function (c) {
        return c.getAttribute('data-field');
      })
    });
    if (currentItem.Type === "Series") {
      item.DisplayOrder = form.querySelector('.selectFileOrder').value;
    } else {
      item.DisplayOrder = form.querySelector('.selectDisplayOrder').value;
    }
    item.ProviderIds = Object.assign({}, currentItem.ProviderIds);
    _externalideditor.default.updateObjectFromElements(form, item);
    item.PreferredMetadataLanguage = form.querySelector('.selectLanguage').value || null;
    item.PreferredMetadataCountryCode = form.querySelector('.selectCountry').value || null;
    if (currentItem.Type === "Person") {
      var placeOfBirth = form.querySelector('.txtPlaceOfBirth').value;
      item.ProductionLocations = placeOfBirth ? [placeOfBirth] : [];
    }
    if (currentItem.Type === "Series") {
      // 600000000
      var seriesRuntime = form.querySelector('.txtSeriesRuntime').value;
      item.RunTimeTicks = seriesRuntime ? seriesRuntime * 600000000 : null;
    }
    var tagline = form.querySelector('.txtTagline').value;
    item.Taglines = tagline ? [tagline] : [];
    submitUpdatedItem(instance, form, item);
    e.preventDefault();
    e.stopPropagation();

    // Disable default form submission
    return false;
  }
  function addElementToList(instance, source) {
    showPrompt({
      title: _globalize.default.translate('Add'),
      label: source.getAttribute('data-label'),
      confirmText: _globalize.default.translate('Add')
    }).then(function (text) {
      var container = source.closest('.editableListviewContainer');
      var prop = source.getAttribute('data-field');
      instance.currentItem[prop].push({
        Name: text
      });
      container.querySelector('.itemsContainer').refreshItems();
      var chkLockedField = container.querySelector('.chkLockedField');
      if (chkLockedField) {
        chkLockedField.checked = true;
      }
    });
  }
  function addOrEditPerson(instance, person) {
    var isNew;
    if (!person) {
      person = {};
      isNew = true;
    }
    return Emby.importModule('./modules/metadataeditor/personeditor.js').then(function (personEditor) {
      return personEditor.show(person).then(function (updatedPerson) {
        if (isNew) {
          instance.currentItem.People.push(updatedPerson);
        }
        if (isNew) {
          instance.refreshPeople();
        }
        var chkLockedField = instance.context.querySelector('.chkLockedField[data-field="Cast"]');
        if (chkLockedField) {
          chkLockedField.checked = true;
        }
      });
    });
  }
  function onRejected() {}
  function showMoreMenu(instance, button, user) {
    Emby.importModule('./modules/itemcontextmenu.js').then(function (itemContextMenu) {
      var item = instance.currentItem;
      itemContextMenu.show({
        items: [item],
        positionTo: button,
        edit: false,
        editImages: true,
        editSubtitles: true,
        sync: false,
        share: false,
        play: false,
        queue: false,
        user: user
      }).catch(onRejected);
    });
  }
  function afterDeleted(instance, item) {
    var parentId = item.ParentId || item.SeasonId || item.SeriesId;
    if (parentId) {
      reload(instance, parentId, item.ServerId);
    } else {
      Emby.importModule('./modules/approuter.js').then(function (appRouter) {
        appRouter.goHome();
      });
    }
  }
  function onLibraryChanged(e, apiClient, data) {
    var _data$ItemsUpdated, _data$ItemsRemoved;
    var currentItem = this.currentItem;
    var item = currentItem;
    if (!item) {
      return;
    }
    if ((_data$ItemsUpdated = data.ItemsUpdated) != null && _data$ItemsUpdated.includes(item.Id)) {
      if (this.paused) {
        this._fullReloadOnResume = true;
      } else {
        //reloadItem(this, true);
      }
    }
    if ((_data$ItemsRemoved = data.ItemsRemoved) != null && _data$ItemsRemoved.includes(item.Id)) {
      if (this.paused) {
        this._afterDeletedOnResume = true;
      } else {
        afterDeleted(this, item);
      }
    }
  }
  function onEditorClick(e) {
    var instance = this;
    var btnAddTextItem = e.target.closest('.btnAddTextItem');
    if (btnAddTextItem) {
      addElementToList(instance, btnAddTextItem);
    }
  }
  function onGuideDataProviderChange(e) {
    var instance = this;
    var section = instance.context.querySelector('.channelMappingSection');
    var select = e.target.closest('select');
    var value = select.value;
    if (value && value !== 'none' && value !== 'tuner') {
      section.querySelector('.fldGuideChannelId').classList.remove('hide');
      var apiClient = _connectionmanager.default.getApiClient(instance.currentItem);
      fillChannels(section, instance.currentItem, value, apiClient);
    } else {
      section.querySelector('.fldGuideChannelId').classList.add('hide');
    }
  }
  function onFieldInput(e) {
    var container = this.closest('.inputContainer,.selectContainer').parentNode.closest('.inputContainer');
    if (!container) {
      return;
    }
    container.querySelector('.chkLockedField').checked = true;
  }
  function autoLockFields(context) {
    var elems = context.querySelectorAll('.txtInput-withlockedfield, .select-withlockedfield');
    for (var i = 0, length = elems.length; i < length; i++) {
      var elem = elems[i];
      if (elem.tagName === 'SELECT') {
        elem.addEventListener('change', onFieldInput);
      } else {
        elem.addEventListener('input', onFieldInput);
      }
    }
  }
  function getPeopleItems(query) {
    var instance = this;
    var icon = _itemmanager.default.getDefaultIcon({
      Type: 'Person'
    });
    var serverId = instance.serverId;
    var people = instance.currentItem.People || [];
    var items = people.map(function (i, index) {
      return {
        Type: 'GenericListItem',
        Name: i.Name,
        CanDelete: true,
        CanEdit: true,
        Icon: icon,
        DeleteType: 'remove',
        ShortOverview: i.Role,
        OriginalItem: i,
        CanReorder: true,
        CanMoveUp: index > 0,
        CanMoveDown: index < people.length - 1,
        ServerId: serverId
      };
    });
    return Promise.resolve({
      Items: items,
      TotalRecordCount: items.length
    });
  }
  function getLinkedItems(query) {
    var obj = this;
    var instance = obj.instance;
    var type = obj.type;
    var property = obj.property;
    var icon = _itemmanager.default.getDefaultIcon({
      Type: type
    });
    var serverId = instance.serverId;
    var sourceItems = instance.currentItem[property] || [];
    var items = sourceItems.map(function (i, index) {
      return {
        Type: 'GenericListItem',
        Name: i.Name,
        CanDelete: true,
        CanEdit: false,
        Icon: icon,
        DeleteType: 'remove',
        ShortOverview: i.Role,
        OriginalItem: i,
        CanReorder: true,
        CanMoveUp: index > 0,
        CanMoveDown: index < sourceItems.length - 1,
        ServerId: serverId
      };
    });
    return Promise.resolve({
      Items: items,
      TotalRecordCount: items.length
    });
  }
  function deleteLinkedItems(options) {
    var obj = this;
    var instance = obj.instance;
    var property = obj.property;
    var itemsToRemove = options.items;
    instance.currentItem[property] = instance.currentItem[property].filter(function (t) {
      return itemsToRemove.filter(function (i) {
        return i.OriginalItem === t;
      }).length === 0;
    });
    var chkLockedField = instance.context.querySelector('.btnAddTextItem[data-field="' + property + '"]').closest('.editableListviewContainer').querySelector('.chkLockedField');
    if (chkLockedField) {
      chkLockedField.checked = true;
    }
    return Promise.resolve();
  }
  function moveLinkedItemsInOrder(items, options) {
    var obj = this;
    var instance = obj.instance;
    var property = obj.property;
    console.log('onItemsMovedToNewIndex');
    var fromIndex = options.currentIndex;
    var newIndex = options.newIndex;
    console.log('onItemsMovedToNewIndex, fromIndex: ' + fromIndex + ', newIndex: ' + newIndex);
    if (fromIndex !== newIndex) {
      arraymove(instance.currentItem[property], fromIndex, newIndex);
      var chkLockedField = instance.context.querySelector('.btnAddTextItem[data-field="' + property + '"]').closest('.editableListviewContainer').querySelector('.chkLockedField');
      if (chkLockedField) {
        chkLockedField.checked = true;
      }
    }
    return Promise.resolve();
  }
  function getLinkedItemOptions(items) {
    var obj = this;
    var type = obj.type;
    var enableDragReorder = type !== 'Tag';
    return {
      renderer: _listview.default,
      options: {
        moreButton: false,
        defaultBackground: false,
        // settings is currently the only command. if that ever changes, then change the tv action to menu
        action: _layoutmanager.default.tv ? 'menu' : 'none',
        buttonCommands: ['delete'],
        fields: ['Name'],
        draggable: enableDragReorder,
        dragReorder: enableDragReorder,
        roundImage: true,
        image: false,
        playQueueIndicator: false,
        commandActions: {
          deleteItems: deleteLinkedItems.bind(obj),
          moveInOrder: moveLinkedItemsInOrder.bind(obj)
        }
      }
    };
  }
  function arraymove(arr, fromIndex, toIndex) {
    var element = arr[fromIndex];
    arr.splice(fromIndex, 1);
    arr.splice(toIndex, 0, element);
  }
  function movePeopleInOrder(items, options) {
    var instance = this;
    console.log('onItemsMovedToNewIndex');
    var fromIndex = options.currentIndex;
    var newIndex = options.newIndex;
    console.log('onItemsMovedToNewIndex, fromIndex: ' + fromIndex + ', newIndex: ' + newIndex);
    if (fromIndex !== newIndex) {
      arraymove(instance.currentItem.People, fromIndex, newIndex);
      var chkLockedField = instance.context.querySelector('.chkLockedField[data-field="Cast"]');
      if (chkLockedField) {
        chkLockedField.checked = true;
      }
    }
    return Promise.resolve();
  }
  function getPeopleListOptions(items) {
    var instance = this;
    return {
      renderer: _listview.default,
      options: {
        moreButton: false,
        defaultBackground: false,
        // settings is currently the only command. if that ever changes, then change the tv action to menu
        action: _layoutmanager.default.tv ? 'menu' : 'edit',
        buttonCommands: ['edit', 'delete'],
        fields: ['Name', 'ShortOverview'],
        draggable: true,
        dragReorder: true,
        roundImage: true,
        image: false,
        playQueueIndicator: false,
        commandActions: {
          deleteItems: deletePeople.bind(instance),
          edit: editPeople.bind(instance),
          moveInOrder: movePeopleInOrder.bind(instance)
        }
      }
    };
  }
  function editPeople(items, options) {
    var instance = this;
    var item = items[0];
    return addOrEditPerson(instance, item.OriginalItem);
  }
  function deletePeople(options) {
    var instance = this;
    var itemsToRemove = options.items;
    instance.currentItem.People = instance.currentItem.People.filter(function (t) {
      return itemsToRemove.filter(function (i) {
        return i.OriginalItem === t;
      }).length === 0;
    });
    var chkLockedField = instance.context.querySelector('.chkLockedField[data-field="Cast"]');
    if (chkLockedField) {
      chkLockedField.checked = true;
    }
    return Promise.resolve();
  }
  function init(instance, itemId, context, apiClient) {
    instance.itemId = itemId;
    instance.serverId = apiClient.serverId();
    context.querySelector('.externalIds').addEventListener('click', function (e) {
      var btnOpenExternalId = e.target.closest('.btnOpenExternalId');
      if (btnOpenExternalId) {
        var field = context.querySelector('.' + btnOpenExternalId.getAttribute('data-fieldid'));
        var formatString = field.getAttribute('data-formatstring');
        if (field.value) {
          _servicelocator.shell.openUrl(formatString.replace('{0}', field.value));
        }
      }
    });
    context.querySelector('.btnMore').addEventListener('click', function (e) {
      _connectionmanager.default.getApiClient(instance.currentItem).getCurrentUser().then(function (user) {
        showMoreMenu(instance, e.target, user);
      });
    });
    context.querySelector('.selectGuideDataProvider').addEventListener('change', onGuideDataProviderChange.bind(instance));
    context.querySelector('.btnHeaderSave').addEventListener('click', function (e) {
      context.querySelector('.btnSave').click();
    });
    var form = context.querySelector('form');
    form.addEventListener('click', onEditorClick.bind(instance));
    form.addEventListener('submit', onSubmit.bind(instance));
    context.querySelector(".btnAddPerson").addEventListener('click', function (event, data) {
      addOrEditPerson(instance);
    });
    autoLockFields(context);
    var peopleItemsContainer = context.querySelector('.peopleItemsContainer');
    peopleItemsContainer.fetchData = getPeopleItems.bind(instance);
    peopleItemsContainer.getListOptions = getPeopleListOptions.bind(instance);
    var tagsItemsContainer = context.querySelector('.tagsItemsContainer');
    tagsItemsContainer.fetchData = getLinkedItems.bind({
      instance: instance,
      type: 'Tag',
      property: 'TagItems'
    });
    tagsItemsContainer.getListOptions = getLinkedItemOptions.bind({
      instance: instance,
      type: 'Tag',
      property: 'TagItems'
    });
    var studiosItemsContainer = context.querySelector('.studiosItemsContainer');
    studiosItemsContainer.fetchData = getLinkedItems.bind({
      instance: instance,
      type: 'Studio',
      property: 'Studios'
    });
    studiosItemsContainer.getListOptions = getLinkedItemOptions.bind({
      instance: instance,
      type: 'Studio',
      property: 'Studios'
    });
    var genresItemsContainer = context.querySelector('.genresItemsContainer');
    genresItemsContainer.fetchData = getLinkedItems.bind({
      instance: instance,
      type: 'Genre',
      property: 'GenreItems'
    });
    genresItemsContainer.getListOptions = getLinkedItemOptions.bind({
      instance: instance,
      type: 'Genre',
      property: 'GenreItems'
    });
  }
  function getItem(itemId, serverId) {
    var apiClient = _connectionmanager.default.getApiClient(serverId);
    if (itemId) {
      return apiClient.getItem(apiClient.getCurrentUserId(), itemId, {
        Fields: 'ChannelMappingInfo',
        ExcludeFields: 'Chapters,MediaSources,MediaStreams,Subviews'
      });
    }
    return apiClient.getRootFolder(apiClient.getCurrentUserId());
  }
  function getEditorConfig(itemId, serverId) {
    var apiClient = _connectionmanager.default.getApiClient(serverId);
    if (itemId) {
      return apiClient.getJSON(apiClient.getUrl('Items/' + itemId + '/MetadataEditor'));
    }
    return Promise.resolve({});
  }
  function populateCountries(select, allCountries) {
    var html = "";
    html += "<option value=''></option>";
    for (var i = 0, length = allCountries.length; i < length; i++) {
      var culture = allCountries[i];
      html += "<option value='" + culture.TwoLetterISORegionName + "'>" + culture.DisplayName + "</option>";
    }
    select.innerHTML = html;
  }
  function populateLanguages(select, languages) {
    var html = "";
    html += "<option value=''></option>";
    for (var i = 0, length = languages.length; i < length; i++) {
      var culture = languages[i];
      html += "<option value='" + culture.TwoLetterISOLanguageName + "'>" + culture.DisplayName + "</option>";
    }
    select.innerHTML = html;
  }

  // Function to hide the element by selector or raw element
  // Selector can be an element or a selector string
  // Context is optional and restricts the querySelector to the context
  function hideElement(selector, context, multiple) {
    context = context || document;
    if (typeof selector === 'string') {
      var elements = multiple ? context.querySelectorAll(selector) : [context.querySelector(selector)];
      Array.prototype.forEach.call(elements, function (el) {
        if (el) {
          el.classList.add('hide');
        }
      });
    } else {
      selector.classList.add('hide');
    }
  }

  // Function to show the element by selector or raw element
  // Selector can be an element or a selector string
  // Context is optional and restricts the querySelector to the context
  function showElement(selector, context, multiple) {
    context = context || document;
    if (typeof selector === 'string') {
      var elements = multiple ? context.querySelectorAll(selector) : [context.querySelector(selector)];
      Array.prototype.forEach.call(elements, function (el) {
        if (el) {
          el.classList.remove('hide');
        }
      });
    } else {
      selector.classList.remove('hide');
    }
  }
  function setRequired(elem, required) {
    if (required) {
      elem.setAttribute('required', 'required');
    } else {
      elem.removeAttribute('required');
    }
  }
  function setFieldVisibilities(context, item, apiClient) {
    var itemType = item.Type;
    if (item.Path) {
      showElement('.fldPath', context);
    } else {
      hideElement('.fldPath', context);
    }
    if (item.Type === "Series" || item.Type === "Movie" || item.Type === "Trailer") {
      showElement('.fldOriginalName', context);
    } else {
      hideElement('.fldOriginalName', context);
    }
    if (item.Type === "Audio") {
      hideElement('.fldSortName', context);
      setRequired(context.querySelector('.txtSortName'), false);
    } else {
      showElement('.fldSortName', context);
      setRequired(context.querySelector('.txtSortName'), true);
    }
    if (item.Type === "Series") {
      showElement('.fldSeriesRuntime', context);
    } else {
      hideElement('.fldSeriesRuntime', context);
    }
    if (item.Type === "Series" || item.Type === "Person") {
      showElement('.fldEndDate', context);
    } else {
      hideElement('.fldEndDate', context);
    }
    if (item.Type === "MusicAlbum") {
      showElement('.albumAssociationMessage', context);
    } else {
      hideElement('.albumAssociationMessage', context);
    }
    if (item.Type === "Movie" || item.Type === "Trailer" || item.Type === "Series") {
      showElement('.fldCriticRating', context);
    } else {
      hideElement('.fldCriticRating', context);
    }
    if (item.Type === "Series") {
      showElement('.fldStatus', context);
    } else {
      hideElement('.fldStatus', context);
    }
    if (item.MediaType === "Video" && item.Type !== "TvChannel") {
      showElement('.fld3dFormat', context);
    } else {
      hideElement('.fld3dFormat', context);
    }
    if (item.Type === "Audio") {
      showElement('.fldAlbumArtist', context);
    } else {
      hideElement('.fldAlbumArtist', context);
    }
    if (item.Type === "TvChannel") {
      showElement('.fldChannelNumber', context);
    } else {
      hideElement('.fldChannelNumber', context);
    }
    if (item.Type === "Audio" || item.Type === 'MusicVideo') {
      showElement('.fldArtist', context);
      showElement('.fldAlbum', context);
    } else {
      hideElement('.fldArtist', context);
      hideElement('.fldAlbum', context);
    }
    if (item.Type === "Audio") {
      showElement('.fldComposer', context);
    } else {
      hideElement('.fldComposer', context);
    }
    if (item.Type === "Episode" && item.ParentIndexNumber === 0) {
      showElement('.collapsibleSpecialEpisodeInfo', context);
    } else {
      hideElement('.collapsibleSpecialEpisodeInfo', context);
    }
    if (item.Type === "Person" || item.Type === "Genre" || item.Type === "Studio" || item.Type === "GameGenre" || item.Type === "MusicGenre" || item.Type === "TvChannel" || item.Type === "Book" || item.Type === "MusicArtist" || item.Type === "Channel" || item.Type === "TvChannel" || item.Type === "Folder") {
      hideElement('.peopleCollapsible', context);
    } else {
      showElement('.peopleCollapsible', context);
    }
    if (item.Type === "Person" || item.Type === "Genre" || item.Type === "Studio" || item.Type === "GameGenre" || item.Type === "MusicGenre" || item.Type === "TvChannel" || item.Type === "Folder") {
      hideElement('.fldCommunityRating', context);
      hideElement('.genresCollapsible', context);
      hideElement('.studiosCollapsible', context);
      if (item.Type === "TvChannel") {
        showElement('.fldOfficialRating', context);
      } else {
        hideElement('.fldOfficialRating', context);
      }
      hideElement('.fldCustomRating', context);
    } else {
      showElement('.fldCommunityRating', context);
      showElement('.genresCollapsible', context);
      showElement('.studiosCollapsible', context);
      showElement('.fldOfficialRating', context);
      showElement('.fldCustomRating', context);
    }
    showElement('.tagsCollapsible', context);
    if (item.Type === "TvChannel") {
      hideElement('.metadataSettingsCollapsible', context);
      hideElement('.fldDateAdded', context);
    } else {
      showElement('.metadataSettingsCollapsible', context);
      showElement('.fldDateAdded', context);
    }
    switch (itemType) {
      case 'TvChannel':
      case 'Folder':
      case 'MusicArtist':
        hideElement('.fldPremiereDate', context);
        break;
      default:
        showElement('.fldPremiereDate', context);
        break;
    }
    switch (itemType) {
      case 'Person':
      case 'TvChannel':
      case 'Folder':
      case 'MusicArtist':
        hideElement('.fldYear', context);
        break;
      default:
        showElement('.fldYear', context);
        break;
    }
    if (item.Type === "TvChannel" || item.Type === "Folder") {
      hideElement('.overviewContainer', context);
    } else {
      showElement('.overviewContainer', context);
    }
    if (item.Type === "Person") {
      //todo
      context.querySelector('.txtProductionYear').label(_globalize.default.translate('LabelBirthYear'));
      context.querySelector(".txtPremiereDate").label(_globalize.default.translate('LabelBirthDate'));
      context.querySelector(".txtEndDate").label(_globalize.default.translate('LabelDeathDate'));
      showElement('.fldPlaceOfBirth');
    } else {
      context.querySelector('.txtProductionYear').label(_globalize.default.translate('Year'));
      context.querySelector(".txtPremiereDate").label(_globalize.default.translate('LabelReleaseDate'));
      context.querySelector(".txtEndDate").label(_globalize.default.translate('LabelEndDate'));
      hideElement('.fldPlaceOfBirth');
    }
    if (item.Type === "Audio" || item.Type === "Episode" || item.Type === "Season") {
      showElement('.fldIndexNumber');
      if (item.Type === "Episode") {
        context.querySelector('.txtIndexNumber').label(_globalize.default.translate('LabelEpisodeNumber'));
      } else if (item.Type === "Season") {
        context.querySelector('.txtIndexNumber').label(_globalize.default.translate('LabelSeasonNumber'));
      } else if (item.Type === "Audio") {
        context.querySelector('.txtIndexNumber').label(_globalize.default.translate('LabelTrackNumber'));
      } else {
        context.querySelector('.txtIndexNumber').label(_globalize.default.translate('LabelNumber'));
      }
    } else {
      hideElement('.fldIndexNumber');
    }
    if (item.Type === "Audio" || item.Type === "Episode") {
      showElement('.fldParentIndexNumber');
      if (item.Type === "Episode") {
        context.querySelector('.txtParentIndexNumber').label(_globalize.default.translate('LabelSeasonNumber'));
      } else if (item.Type === "Audio") {
        context.querySelector('.txtParentIndexNumber').label(_globalize.default.translate('LabelDiscNumber'));
      } else {
        context.querySelector('.txtParentIndexNumber').label(_globalize.default.translate('LabelParentNumber'));
      }
    } else {
      hideElement('.fldParentIndexNumber', context);
    }
    if (item.Type === "BoxSet") {
      showElement('.fldDisplayOrder', context);
      hideElement('.fldFileOrder', context);
      context.querySelector('.selectDisplayOrder').innerHTML = '<option value="SortName">' + _globalize.default.translate('SortName') + '</option><option value="PremiereDate">' + _globalize.default.translate('ReleaseDate') + '</option>';
      context.querySelector('.selectFileOrder').innerHTML = '';
    } else if (item.Type === "Series") {
      hideElement('.fldDisplayOrder', context);
      showElement('.fldFileOrder', context);
      context.querySelector('.selectFileOrder').innerHTML = '<option value="aired">' + _globalize.default.translate('Aired') + '</option><option value="absolute">' + _globalize.default.translate('Absolute') + '</option><option value="dvd">Dvd</option>';
      context.querySelector('.selectDisplayOrder').innerHTML = '';
    } else {
      context.querySelector('.selectDisplayOrder').innerHTML = '';
      context.querySelector('.selectFileOrder').innerHTML = '';
      hideElement('.fldDisplayOrder', context);
      hideElement('.fldFileOrder', context);
    }
  }
  function fillItemInfo(context, item, apiClient, parentalRatingOptions) {
    var select = context.querySelector('.selectOfficialRating');
    populateRatings(parentalRatingOptions, select, item.OfficialRating);
    select.value = item.OfficialRating || "";
    select = context.querySelector('.selectCustomRating');
    populateRatings(parentalRatingOptions, select, item.CustomRating);
    select.value = item.CustomRating || "";
    var selectStatus = context.querySelector('.selectStatus');
    populateStatus(selectStatus);
    selectStatus.value = item.Status || "";
    context.querySelector('.select3dFormat', context).value = item.Video3DFormat || "";
    var lockData = item.LockData || false;
    var chkLockData = context.querySelector(".chkLockData");
    chkLockData.checked = lockData;
    context.querySelector('.txtPath').innerHTML = item.Path || '';
    context.querySelector('.txtName').value = item.Name || "";
    context.querySelector('.txtChannelNumber').value = item.ChannelNumber || "";
    context.querySelector('.txtOriginalName').value = item.OriginalTitle || "";
    context.querySelector('.txtOverview').value = item.Overview || '';
    context.querySelector('.txtTagline').value = item.Taglines && item.Taglines.length ? item.Taglines[0] : '';
    context.querySelector('.txtSortName').value = item.SortName || "";
    context.querySelector('.txtCommunityRating').value = item.CommunityRating == null ? '' : item.CommunityRating.toFixed(1);
    context.querySelector('.txtCriticRating').value = item.CriticRating || "";
    context.querySelector('.txtIndexNumber').value = item.IndexNumber == null ? '' : item.IndexNumber;
    context.querySelector('.txtParentIndexNumber').value = item.ParentIndexNumber == null ? '' : item.ParentIndexNumber;
    context.querySelector('.txtDisplaySeason').value = 'SortParentIndexNumber' in item ? item.SortParentIndexNumber : "";
    context.querySelector('.txtDisplayEpisode').value = 'SortIndexNumber' in item ? item.SortIndexNumber : "";
    context.querySelector('.txtAlbum').value = item.Album || "";
    context.querySelector('.txtAlbumArtist').value = (item.AlbumArtists || []).map(function (a) {
      return a.Name;
    }).join(';');
    if (item.Type === 'Series') {
      // TODO: Shouldn't need the toLowerCase() after a while following 4.2
      context.querySelector('.selectFileOrder').value = (item.DisplayOrder || '').toLowerCase();
      context.querySelector('.selectDisplayOrder').value = '';
    } else {
      context.querySelector('.selectDisplayOrder').value = item.DisplayOrder || '';
      context.querySelector('.selectFileOrder').value = '';
    }
    context.querySelector('.txtArtist').value = (item.ArtistItems || []).map(function (a) {
      return a.Name;
    }).join(';');
    context.querySelector('.txtComposer').value = (item.Composers || []).map(function (a) {
      return a.Name;
    }).join(';');
    if (item.DateCreated) {
      try {
        context.querySelector('.txtDateAdded').valueAsNumberUtc = Date.parse(item.DateCreated);
      } catch (e) {
        context.querySelector('.txtDateAdded').value = '';
      }
    } else {
      context.querySelector('.txtDateAdded').value = '';
    }
    if (item.PremiereDate) {
      try {
        context.querySelector('.txtPremiereDate').valueAsNumberUtc = Date.parse(item.PremiereDate);
      } catch (e) {
        context.querySelector('.txtPremiereDate').value = '';
      }
    } else {
      context.querySelector('.txtPremiereDate').value = '';
    }
    if (item.EndDate) {
      try {
        context.querySelector('.txtEndDate').valueAsNumberUtc = Date.parse(item.EndDate);
      } catch (e) {
        context.querySelector('.txtEndDate').value = '';
      }
    } else {
      context.querySelector('.txtEndDate').value = '';
    }
    context.querySelector('.txtProductionYear').value = item.ProductionYear || "";
    var placeofBirth = item.ProductionLocations && item.ProductionLocations.length ? item.ProductionLocations[0] : '';
    context.querySelector('.txtPlaceOfBirth').value = placeofBirth;
    context.querySelector('.selectLanguage').value = item.PreferredMetadataLanguage || "";
    context.querySelector('.selectCountry').value = item.PreferredMetadataCountryCode || "";
    if (item.RunTimeTicks) {
      var minutes = item.RunTimeTicks / 600000000;
      context.querySelector('.txtSeriesRuntime').value = Math.round(minutes);
    } else {
      context.querySelector('.txtSeriesRuntime', context).value = "";
    }
    _loading.default.hide();
    var promises = [];
    var itemsContainers = context.querySelectorAll('.itemsContainer');
    for (var i = 0, length = itemsContainers.length; i < length; i++) {
      promises.push(waitForCustomElementUpgradeAndResume(itemsContainers[i], {
        refresh: true
      }));
    }
    return Promise.all(promises);
  }
  function waitForCustomElementUpgradeAndResume(itemsContainer, options) {
    return itemsContainer.waitForCustomElementUpgrade().then(function () {
      itemsContainer.resume(options);
    });
  }
  function fillGuideDataProviders(instance, context, item, providers) {
    var select = context.querySelector('.selectGuideDataProvider');
    providers.push({
      Name: _globalize.default.translate('None'),
      Id: 'none'
    });
    var options = providers.map(function (i) {
      return '<option value="' + i.Id + '">' + (i.Name + ' ' + _textencoding.default.htmlEncode(i.ListingsId || i.Path || '').trim()) + '</option>';
    }).join('');
    select.innerHTML = options;
    select.value = item.ListingsProviderId;
    onGuideDataProviderChange.call(instance, {
      target: select,
      currentTarget: select
    });
  }
  function fillChannelOptions(context, item, channels) {
    var select = context.querySelector('.selectGuideChannel');
    var options = channels.map(function (i) {
      return '<option value="' + i.Id + '">' + i.Name.trim() + '</option>';
    }).join('');
    select.innerHTML = options;
    select.value = item.ListingsChannelId;
  }
  function fillChannels(context, item, listingsProviderId, apiClient) {
    return apiClient.getJSON(apiClient.getUrl('LiveTv/ChannelMappingOptions', {
      ProviderId: listingsProviderId
    })).then(function (result) {
      fillChannelOptions(context, item, result.ProviderChannels);
    });
  }
  function fillChannelMapping(instance, context, item, apiClient) {
    return apiClient.getJSON(apiClient.getUrl('LiveTv/ListingProviders', {
      ChannelId: item.Id
    })).then(function (result) {
      if (result.length) {
        context.querySelector('.channelMappingSection').classList.remove('hide');
      } else {
        context.querySelector('.channelMappingSection').classList.add('hide');
      }
      fillGuideDataProviders(instance, context, item, result);
    });
  }
  function populateRatings(allParentalRatings, select, currentValue) {
    var html = "";
    html += "<option value=''></option>";
    var ratings = [];
    var i, length, rating;
    var currentValueFound = false;
    for (i = 0, length = allParentalRatings.length; i < length; i++) {
      rating = allParentalRatings[i];
      ratings.push({
        Name: rating.Name,
        Value: rating.Name
      });
      if (rating.Name === currentValue) {
        currentValueFound = true;
      }
    }
    if (currentValue && !currentValueFound) {
      ratings.push({
        Name: currentValue,
        Value: currentValue
      });
    }
    for (i = 0, length = ratings.length; i < length; i++) {
      rating = ratings[i];
      html += "<option value='" + rating.Value + "'>" + rating.Name + "</option>";
    }
    select.innerHTML = html;
  }
  function populateStatus(select) {
    var html = "";
    html += "<option value=''></option>";
    html += "<option value='Continuing'>" + _globalize.default.translate('Continuing') + "</option>";
    html += "<option value='Ended'>" + _globalize.default.translate('Ended') + "</option>";
    select.innerHTML = html;
  }
  function loadLockedFields(context, item) {
    var elems = context.querySelectorAll('.chkLockedField');
    for (var i = 0, length = elems.length; i < length; i++) {
      var elem = elems[i];
      elem.checked = item.LockedFields.includes(elem.getAttribute('data-field'));
    }
  }
  function reload(instance, itemId, serverId) {
    _loading.default.show();
    return Promise.all([getItem(itemId, serverId), getEditorConfig(itemId, serverId)]).then(function (responses) {
      var item = responses[0];
      var metadataEditorInfo = responses[1];
      var context = instance.context;
      instance.currentItem = item;
      instance.hasChanges = false;
      var languages = metadataEditorInfo.Cultures;
      var countries = metadataEditorInfo.Countries;
      _externalideditor.default.embed(context.querySelector('.externalIdsSection'), item, metadataEditorInfo.ExternalIdInfos);
      loadLockedFields(context, item);
      populateLanguages(context.querySelector('.selectLanguage'), languages);
      populateCountries(context.querySelector('.selectCountry'), countries);
      var apiClient = _connectionmanager.default.getApiClient(item);
      setFieldVisibilities(context, item, apiClient);
      if (item.Type === 'TvChannel') {
        fillChannelMapping(instance, context, item, apiClient);
      }
      if (item.MediaType === "Video" && item.Type !== "Episode" && item.Type !== "TvChannel" || item.Type === 'Series' || item.Type === 'Game') {
        showElement('.fldTagline', context);
      } else {
        hideElement('.fldTagline', context);
      }
      return fillItemInfo(context, item, apiClient, metadataEditorInfo.ParentalRatingOptions);
    });
  }
  function fillDayText(context) {
    var elems = context.querySelectorAll('.dayText');
    var date = new Date();
    while (date.getDay() > 0) {
      date.setDate(date.getDate() - 1);
    }
    for (var i = 0, length = elems.length; i < length; i++) {
      elems[i].innerHTML = _datetime.default.toLocaleDateString(date, {
        weekday: 'long'
      });
      date.setDate(date.getDate() + 1);
    }
  }
  function show(instance, itemId, serverId) {
    _loading.default.show();
    return require(['text!modules/metadataeditor/metadataeditor.template.html']).then(function (responses) {
      var template = responses[0];
      var dialogOptions = {
        removeOnClose: true,
        scrollY: false
      };
      if (_layoutmanager.default.tv) {
        dialogOptions.size = 'fullscreen';
      } else {
        dialogOptions.size = 'medium-tall';
      }
      var dlg = _dialoghelper.default.createDialog(dialogOptions);
      dlg.classList.add('formDialog');
      var html = '';
      html += _globalize.default.translateDocument(template, 'sharedcomponents');
      dlg.innerHTML = html;
      fillDayText(dlg);
      dlg.querySelector('.formDialogFooter').classList.remove('hide');
      instance.context = dlg;
      var openPromise = _dialoghelper.default.open(dlg);
      init(instance, itemId, dlg, _connectionmanager.default.getApiClient(serverId));
      instance.resume({
        refresh: true
      });
      return openPromise.then(function () {
        var hasChanges = instance.hasChanges;
        instance.destroy();
        if (hasChanges) {
          return Promise.resolve();
        } else {
          return Promise.reject();
        }
      });
    });
  }
  function MetadataEditor() {
    this.onLibraryChangedFn = onLibraryChanged.bind(this);
    var onLibraryChangedFn = this.onLibraryChangedFn;
    if (onLibraryChangedFn) {
      _events.default.on(_api.default, 'LibraryChanged', onLibraryChangedFn);
    }
  }
  MetadataEditor.prototype.show = function (itemId, serverId) {
    return show(this, itemId, serverId);
  };
  MetadataEditor.prototype.embed = function (elem, itemId, serverId) {
    _loading.default.show();
    var instance = this;
    return require(['text!modules/metadataeditor/metadataeditor.template.html']).then(function (responses) {
      var template = responses[0];
      elem.innerHTML = _globalize.default.translateDocument(template, 'sharedcomponents');
      instance.context = elem;
      elem.querySelector('.btnMore').classList.remove('hide');
      init(instance, itemId, elem, _connectionmanager.default.getApiClient(serverId));
      elem.querySelector('.formDialogFooter').classList.remove('formDialogFooter', 'hide');
      elem.querySelector('.btnHeaderSave').classList.remove('hide');
      var form = elem.querySelector('form');
      form.classList.remove('dialogContentInner', 'dialog-content-centered');
      form.classList.add('padded-bottom-page');
      return instance.resume({
        refresh: true,
        autoFocus: true
      });
    });
  };
  MetadataEditor.prototype.refreshPeople = function () {
    var itemsContainer = this.context.querySelector('.peopleItemsContainer');
    itemsContainer.refreshItems();
  };
  MetadataEditor.prototype.pause = function () {
    this.paused = true;
  };
  MetadataEditor.prototype.resume = function (options) {
    this.paused = null;
    var instance = this;
    var afterRefresh = function () {
      if (options != null && options.autoFocus) {
        _focusmanager.default.autoFocus(instance.context, {
          skipIfNotEnabled: true
        });
      }
    };
    if (this._afterDeletedOnResume) {
      var item = this.currentItem;
      if (item) {
        afterDeleted(this, item);
      }
    } else if (this._fullReloadOnResume) {
      var _item = this.currentItem;
      if (_item) {
        reload(this, _item.Id, _item.ServerId).then(afterRefresh);
      }
    } else if (options != null && options.refresh) {
      reload(this, this.itemId, this.serverId).then(afterRefresh);
    }
    this._afterDeletedOnResume = null;
    this._fullReloadOnResume = null;
  };
  MetadataEditor.prototype.destroy = function () {
    this.pause();
    var onLibraryChangedFn = this.onLibraryChangedFn;
    if (onLibraryChangedFn) {
      _events.default.off(_api.default, 'LibraryChanged', onLibraryChangedFn);
    }
    this.onLibraryChangedFn = null;
    this.hasChanges = null;
    this.context = null;
    this.currentItem = null;
    this.paused = null;
    this._afterDeletedOnResume = null;
    this._fullReloadOnResume = null;
  };
  var _default = _exports.default = MetadataEditor;
});
