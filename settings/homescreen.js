define(["exports", "./../modules/viewmanager/basesettingsview.js", "./../modules/loading/loading.js", "./../modules/common/globalize.js", "./../modules/emby-elements/emby-input/emby-input.js", "./../modules/emby-elements/emby-button/emby-button.js", "./../modules/emby-elements/emby-toggle/emby-toggle.js", "./../modules/emby-elements/emby-select/emby-select.js", "./../modules/emby-elements/emby-scroller/emby-scroller.js", "./../modules/emby-elements/emby-itemscontainer/emby-itemscontainer.js", "./../modules/layoutmanager.js", "./../modules/listview/listview.js", "./../modules/common/itemmanager/itemmanager.js", "./../modules/common/itemmanager/genericitemcontroller.js", "./sectioneditor.js"], function (_exports, _basesettingsview, _loading, _globalize, _embyInput, _embyButton, _embyToggle, _embySelect, _embyScroller, _embyItemscontainer, _layoutmanager, _listview, _itemmanager, _genericitemcontroller, _sectioneditor) {
  Object.defineProperty(_exports, "__esModule", {
    value: true
  });
  _exports.default = void 0;
  /* jshint module: true */

  function getLandingScreenOptions(type) {
    var list = [];
    if (type === 'movies') {
      list.push({
        name: _globalize.default.translate('Movies'),
        value: 'movies',
        isDefault: true
      });
      list.push({
        name: _globalize.default.translate('Suggestions'),
        value: 'suggestions'
      });
      list.push({
        name: _globalize.default.translate('Favorites'),
        value: 'favorites'
      });
      list.push({
        name: _globalize.default.translate('Genres'),
        value: 'genres'
      });
      list.push({
        name: _globalize.default.translate('Collections'),
        value: 'collections'
      });
      list.push({
        name: _globalize.default.translate('Tags'),
        value: 'tags'
      });
      list.push({
        name: _globalize.default.translate('Folders'),
        value: 'folders'
      });
    } else if (type === 'musicvideos') {
      list.push({
        name: _globalize.default.translate('Videos'),
        value: 'videos',
        isDefault: true
      });
      list.push({
        name: _globalize.default.translate('Artists'),
        value: 'artists'
      });
      list.push({
        name: _globalize.default.translate('Genres'),
        value: 'genres'
      });
      list.push({
        name: _globalize.default.translate('Tags'),
        value: 'tags'
      });
      list.push({
        name: _globalize.default.translate('Folders'),
        value: 'folders'
      });
    } else if (type === 'tvshows') {
      list.push({
        name: _globalize.default.translate('Shows'),
        value: 'shows',
        isDefault: true
      });
      list.push({
        name: _globalize.default.translate('Suggestions'),
        value: 'suggestions'
      });
      list.push({
        name: _globalize.default.translate('Favorites'),
        value: 'favorites'
      });
      list.push({
        name: _globalize.default.translate('Collections'),
        value: 'collections'
      });
      list.push({
        name: _globalize.default.translate('Genres'),
        value: 'genres'
      });
      list.push({
        name: _globalize.default.translate('Tags'),
        value: 'tags'
      });
      list.push({
        name: _globalize.default.translate('Networks'),
        value: 'studios'
      });
      list.push({
        name: _globalize.default.translate('Folders'),
        value: 'folders'
      });
    } else if (type === 'music') {
      list.push({
        name: _globalize.default.translate('Suggestions'),
        value: 'suggestions',
        isDefault: true
      });
      list.push({
        name: _globalize.default.translate('Albums'),
        value: 'albums'
      });
      list.push({
        name: _globalize.default.translate('HeaderAlbumArtists'),
        value: 'albumartists'
      });
      list.push({
        name: _globalize.default.translate('Artists'),
        value: 'artists'
      });
      list.push({
        name: _globalize.default.translate('Composers'),
        value: 'composers'
      });
      list.push({
        name: _globalize.default.translate('Playlists'),
        value: 'playlists'
      });
      list.push({
        name: _globalize.default.translate('Genres'),
        value: 'genres'
      });
      list.push({
        name: _globalize.default.translate('Tags'),
        value: 'tags'
      });
      list.push({
        name: _globalize.default.translate('Songs'),
        value: 'songs'
      });
      list.push({
        name: _globalize.default.translate('Folders'),
        value: 'folders'
      });
    } else if (type === 'audiobooks') {
      list.push({
        name: _globalize.default.translate('Suggestions'),
        value: 'suggestions',
        isDefault: true
      });
      list.push({
        name: _globalize.default.translate('HeaderAudioBooks'),
        value: 'albums'
      });
      list.push({
        name: _globalize.default.translate('Authors'),
        value: 'artists'
      });
      list.push({
        name: _globalize.default.translate('Playlists'),
        value: 'playlists'
      });
      list.push({
        name: _globalize.default.translate('Genres'),
        value: 'genres'
      });
      list.push({
        name: _globalize.default.translate('Tags'),
        value: 'tags'
      });
      list.push({
        name: _globalize.default.translate('Folders'),
        value: 'folders'
      });
    } else if (type === 'livetv') {
      list.push({
        name: _globalize.default.translate('Suggestions'),
        value: 'suggestions',
        isDefault: true
      });
      list.push({
        name: _globalize.default.translate('Guide'),
        value: 'guide'
      });
      list.push({
        name: _globalize.default.translate('Channels'),
        value: 'channels'
      });
      list.push({
        name: _globalize.default.translate('Tags'),
        value: 'tags'
      });
      list.push({
        name: _globalize.default.translate('Recordings'),
        value: 'recordings'
      });
      list.push({
        name: _globalize.default.translate('Schedule'),
        value: 'schedule'
      });
      list.push({
        name: _globalize.default.translate('Series'),
        value: 'series'
      });
    } else if (type === 'homevideos') {
      list.push({
        name: _globalize.default.translate('Videos'),
        value: 'videos'
      });
      list.push({
        name: _globalize.default.translate('Photos'),
        value: 'photos'
      });
      list.push({
        name: _globalize.default.translate('Tags'),
        value: 'tags'
      });
      list.push({
        name: _globalize.default.translate('Folders'),
        value: 'folders'
      });
    } else if (type === 'books') {
      list.push({
        name: _globalize.default.translate('Books'),
        value: 'books'
      });
      list.push({
        name: _globalize.default.translate('Folders'),
        value: 'folders'
      });
    } else if (!type) {
      list.push({
        name: _globalize.default.translate('Shows'),
        value: 'shows'
      });
      list.push({
        name: _globalize.default.translate('Movies'),
        value: 'movies'
      });
      list.push({
        name: _globalize.default.translate('Collections'),
        value: 'collections'
      });
      list.push({
        name: _globalize.default.translate('Genres'),
        value: 'genres'
      });
      list.push({
        name: _globalize.default.translate('Tags'),
        value: 'tags'
      });
      list.push({
        name: _globalize.default.translate('Folders'),
        value: 'folders'
      });
    }
    return list;
  }
  function getLandingScreenOptionsHtml(type) {
    return getLandingScreenOptions(type).map(function (o) {
      var selectedHtml = '';
      var optionValue = o.isDefault ? '' : o.value;
      return '<option value="' + optionValue + '"' + selectedHtml + '>' + o.name + '</option>';
    }).join('');
  }
  function getPerLibrarySettingsHtml(item, apiClient, user) {
    var html = '';
    var isChecked;
    var folderId = item.Guid || item.Id;
    if (item.Type === 'Channel' || item.CollectionType === 'boxsets' || item.CollectionType === 'playlists') {
      isChecked = (user.Configuration.MyMediaExcludes || []).indexOf(folderId) === -1;
      html += '<label class="toggleContainer toggleContainer-listItem fieldset-field">';
      html += '<input type="checkbox" is="emby-toggle" class="chkIncludeInMyMedia" data-folderid="' + folderId + '"' + (isChecked ? ' checked="checked"' : '') + '/>';
      html += '<span>' + _globalize.default.translate('DisplayInMyMedia') + '</span>';
      html += '</label>';
    }
    if (!apiClient.supportsServerHomeSections()) {
      if (!['playlists', 'livetv', 'boxsets', 'channels'].includes(item.CollectionType || '')) {
        isChecked = user.Configuration.LatestItemsExcludes.indexOf(folderId) === -1;
        html += '<label class="fldIncludeInLatest toggleContainer toggleContainer-listItem fieldset-field">';
        html += '<input type="checkbox" is="emby-toggle" class="chkIncludeInLatest" data-folderid="' + folderId + '"' + (isChecked ? ' checked="checked"' : '') + '/>';
        html += '<span>' + _globalize.default.translate('DisplayInOtherHomeScreenSections') + '</span>';
        html += '</label>';
      }
    }
    if (html) {
      html = '<div class="fieldset-field fieldset-fields fieldset-fields-listitems">' + html + '</div>';
    }
    if (item.CollectionType === 'movies' || item.CollectionType === 'tvshows' || item.CollectionType === 'musicvideos' || item.CollectionType === 'music' || item.CollectionType === 'audiobooks' || item.CollectionType === 'books' || item.CollectionType === 'livetv' || item.CollectionType === 'homevideos' || !item.CollectionType && item.Type !== 'Channel') {
      var idForLanding = item.CollectionType === 'livetv' ? item.CollectionType : folderId;
      html += '<div class="selectContainer fieldset-field">';
      var userSettingsField = 'landing-' + idForLanding;
      html += '<select is="emby-select" class="selectLanding autoSetting autoSave" data-folderid="' + idForLanding + '" label="' + _globalize.default.translate('LabelDefaultScreen') + '" data-usersettingsfield="' + userSettingsField + '" data-settingowner="usersettings">';
      html += getLandingScreenOptionsHtml(item.CollectionType);
      html += '</select>';
      html += '</div>';
    }
    if (html) {
      var prefix = '';
      prefix += '<fieldset>';
      prefix += '<legend>';
      prefix += item.Name;
      prefix += '</legend>';
      prefix += '<div class="fieldset-fields">';
      html = prefix + html;
      prefix += '</div>';
      html += '</fieldset>';
    }
    return html;
  }
  function renderPerLibrarySettings(context, apiClient, user, userViews) {
    var elem = context.querySelector('.perLibrarySettings');
    var html = '';
    for (var i = 0, length = userViews.length; i < length; i++) {
      html += getPerLibrarySettingsHtml(userViews[i], apiClient, user);
    }
    elem.innerHTML = html;
  }
  function loadForm(context, user, apiClient) {
    return Promise.all([apiClient.getUserViews({
      IncludeHidden: true,
      AllowDynamicChildren: false
    }, user.Id)]).then(function (responses) {
      renderPerLibrarySettings(context, apiClient, user, responses[0].Items);
      _loading.default.hide();
    });
  }
  function getCheckboxItems(selector, context, isChecked) {
    var inputs = context.querySelectorAll(selector);
    var list = [];
    for (var i = 0, length = inputs.length; i < length; i++) {
      if (inputs[i].checked === isChecked) {
        list.push(inputs[i]);
      }
    }
    return list;
  }
  function onSubmit(e) {
    // Disable default form submission
    if (e) {
      e.preventDefault();
    }
    return false;
  }
  function onChange(e) {
    var instance = this;
    var apiClient = instance.getApiClient();
    var userId = instance.getUserConfigurationUserId();
    var context = e.target.closest('form');
    var chkIncludeInMyMedia = e.target.closest('.chkIncludeInMyMedia');
    if (chkIncludeInMyMedia) {
      var section = chkIncludeInMyMedia.closest('fieldset');
      var fldIncludeInLatest = section.querySelector('.fldIncludeInLatest');
      if (fldIncludeInLatest) {
        if (chkIncludeInMyMedia.checked) {
          fldIncludeInLatest.classList.remove('hide');
        } else {
          fldIncludeInLatest.classList.add('hide');
        }
      }
      var obj = {};
      obj.MyMediaExcludes = getCheckboxItems(".chkIncludeInMyMedia", context, false).map(function (i) {
        return i.getAttribute('data-folderid');
      });
      apiClient.updatePartialUserConfiguration(userId, obj);
      return;
    }
    var chkIncludeInLatest = e.target.closest('.chkIncludeInLatest');
    if (chkIncludeInLatest) {
      var _obj = {};
      _obj.LatestItemsExcludes = getCheckboxItems(".chkIncludeInLatest", context, false).map(function (i) {
        return i.getAttribute('data-folderid');
      });
      apiClient.updatePartialUserConfiguration(userId, _obj);
      return;
    }
  }
  function setLegacyNextUpOptionsIfNeeded(context, apiClient) {
    var elems = context.querySelectorAll('option[value="nextup"]');
    for (var i = 0, length = elems.length; i < length; i++) {
      var elem = elems[i];
      elem.innerHTML = _globalize.default.translate('HeaderNextUp') + ' (Legacy)';
    }
  }
  function mapToHomeScreenSectionItem(i, index, array) {
    return {
      ServerId: i.ServerId,
      Name: i.Name,
      Id: i.Id,
      Type: 'GenericListItem',
      Icon: _itemmanager.default.getDefaultIcon(i),
      CanMoveUp: index > 0,
      CanMoveDown: index < 10,
      CanReorder: true,
      CanDelete: true,
      CanEdit: true,
      DeleteType: 'remove',
      OriginalItem: i
    };
  }
  function getHomescreenSectionListItems(query) {
    var instance = this;
    var apiClient = instance.getApiClient();
    var userId = instance.getUserConfigurationUserId();
    return apiClient.getUser(userId).then(function (user) {
      return apiClient.getHomeScreenSections({
        isEditMode: true,
        user: user
      }).then(function (result) {
        return result.map(mapToHomeScreenSectionItem);
      });
    });
  }
  function editHomeScreenSection(items, options) {
    var instance = this;
    var apiClient = instance.getApiClient();
    var userId = instance.getUserConfigurationUserId();
    return new _sectioneditor.default().show({
      items: items,
      positionTo: options.positionTo,
      userId: userId,
      apiClient: apiClient
    });
  }
  function mapToId(i) {
    return i.Id;
  }
  function deleteHomeScreenSections(options) {
    var instance = this;
    var items = options.items;
    options.deleteMessages = {
      single: {
        text: _globalize.default.translate('MessageConfirmRemoveSection'),
        title: _globalize.default.translate('HeaderRemoveSection'),
        confirmText: _globalize.default.translate('Remove')
      },
      plural: {
        text: _globalize.default.translate('MessageConfirmRemoveSections'),
        title: _globalize.default.translate('HeaderRemoveSections'),
        confirmText: _globalize.default.translate('Remove')
      }
    };
    return _itemmanager.default.showDeleteConfirmation(options).then(function () {
      var apiClient = instance.getApiClient();
      var userId = instance.getUserConfigurationUserId();
      return apiClient.deleteHomeScreenSections({
        ids: items.map(mapToId),
        userId: userId
      });
    });
  }
  function getHomescreenSectionListOptions(items) {
    var instance = this;
    return {
      renderer: _listview.default,
      options: {
        defaultBackground: false,
        enableUserDataButtons: false,
        moreButton: false,
        mediaInfo: false,
        action: _layoutmanager.default.tv ? 'menu' : 'none',
        hoverPlayButton: false,
        multiSelect: true,
        imagePlayButton: false,
        dragReorder: true,
        roundImage: true,
        draggable: true,
        contextMenu: true,
        iconSpacing: false,
        itemMarginY: false,
        fields: ['Name'],
        playQueueIndicator: false,
        image: false,
        buttonCommands: ['edit', 'delete'],
        commandActions: {
          deleteItems: deleteHomeScreenSections.bind(instance),
          edit: editHomeScreenSection.bind(instance),
          moveInOrder: onHomeScreenSectionsMoved.bind(instance)
        }
      }
    };
  }
  function mapUserViewToLibraryOrderItem(i, index, array) {
    return {
      ServerId: i.ServerId,
      Name: i.Name,
      Id: i.Guid || i.Id,
      Type: 'GenericListItem',
      Icon: _itemmanager.default.getDefaultIcon(i),
      CanMoveUp: index > 0,
      CanMoveDown: index < 10,
      CanReorder: true
    };
  }
  function getViewOrderItems(query) {
    var instance = this;
    var apiClient = instance.getApiClient();
    return apiClient.getUserViews(Object.assign({
      IncludeHidden: true,
      AllowDynamicChildren: false
    }, query), this.getUserConfigurationUserId()).then(function (result) {
      result.Items = result.Items.map(mapUserViewToLibraryOrderItem);
      return result;
    });
  }
  function arraymove(arr, fromIndex, toIndex) {
    var element = arr[fromIndex];
    arr.splice(fromIndex, 1);
    arr.splice(toIndex, 0, element);
  }
  function onUserViewsMovedToNewIndex(instance, movedItems, options) {
    console.log('onUserViewsMovedToNewIndex');
    var fromIndex = options.currentIndex;
    var newIndex = options.newIndex;
    console.log('onUserViewsMovedToNewIndex, fromIndex: ' + fromIndex + ', newIndex: ' + newIndex);
    if (fromIndex === newIndex) {
      console.log('fromIndex and newIndex are the same. something probably went wrong');
      return Promise.resolve();
    }
    var obj = {};
    obj.OrderedViews = options.itemsContainer.getItems().map(function (i) {
      return i.Id;
    });
    arraymove(obj.OrderedViews, fromIndex, newIndex);
    var apiClient = instance.getApiClient();
    var userId = instance.getUserConfigurationUserId();
    return apiClient.updatePartialUserConfiguration(userId, obj);
  }
  function onUserViewsMoved(items, options) {
    var instance = this;
    return onUserViewsMovedToNewIndex(instance, items, options);
  }
  function onHomeScreenSectionsMovedToNewIndex(instance, movedItems, options) {
    console.log('onHomeScreenSectionsMovedToNewIndex');
    var fromIndex = options.currentIndex;
    var newIndex = options.newIndex;
    console.log('onHomeScreenSectionsMovedToNewIndex, fromIndex: ' + fromIndex + ', newIndex: ' + newIndex);
    if (fromIndex === newIndex) {
      console.log('fromIndex and newIndex are the same. something probably went wrong');
      return Promise.resolve();
    }
    var apiClient = instance.getApiClient();
    var userId = instance.getUserConfigurationUserId();
    return apiClient.moveHomeScreenSections({
      ids: movedItems.map(mapToId),
      userId: userId,
      newIndex: newIndex
    });
  }
  function onHomeScreenSectionsMoved(items, options) {
    var instance = this;
    return onHomeScreenSectionsMovedToNewIndex(instance, items, options);
  }
  function getViewOrderListOptions(items) {
    var instance = this;
    return {
      renderer: _listview.default,
      options: {
        defaultBackground: false,
        enableUserDataButtons: false,
        moreButton: false,
        mediaInfo: false,
        action: _layoutmanager.default.tv ? 'menu' : 'none',
        hoverPlayButton: false,
        multiSelect: false,
        imagePlayButton: false,
        dragReorder: true,
        roundImage: true,
        draggable: true,
        contextMenu: true,
        iconSpacing: false,
        itemMarginY: false,
        fields: ['Name'],
        playQueueIndicator: false,
        commandActions: {
          moveInOrder: onUserViewsMoved.bind(instance)
        }
      }
    };
  }
  function onAddHomeSectionClick(e) {
    var instance = this;
    var button = e.target;
    var item = {
      OriginalItem: {}
    };
    var options = {
      positionTo: button
    };
    editHomeScreenSection.call(instance, [item], options).then(function () {
      instance.view.querySelector('.homescreenSectionList').notifyRefreshNeeded(true);
    });
  }
  function View(view, params) {
    _basesettingsview.default.apply(this, arguments);
    view.querySelector('form').addEventListener('submit', onSubmit.bind(this));
    view.addEventListener('change', onChange.bind(this));
    var viewOrderList = view.querySelector('.viewOrderList');
    viewOrderList.fetchData = getViewOrderItems.bind(this);
    viewOrderList.getListOptions = getViewOrderListOptions.bind(this);
    var homescreenSectionList = view.querySelector('.homescreenSectionList');
    homescreenSectionList.fetchData = getHomescreenSectionListItems.bind(this);
    homescreenSectionList.getListOptions = getHomescreenSectionListOptions.bind(this);
    view.querySelector('.btnAddHomeSection').addEventListener('click', onAddHomeSectionClick.bind(this));
  }
  Object.assign(View.prototype, _basesettingsview.default.prototype);
  View.prototype.loadData = function () {
    var instance = this;
    var context = instance.view;
    _loading.default.show();
    var userId = instance.getUserConfigurationUserId();
    var apiClient = instance.getApiClient();
    setLegacyNextUpOptionsIfNeeded(context, apiClient);
    return apiClient.getUser(userId).then(function (user) {
      return loadForm(context, user, apiClient);
    });
  };
  View.prototype.loadSettingsInternal = function () {
    var instance = this;
    return this.loadData().then(function () {
      return instance.loadAutoSettings();
    });
  };
  View.prototype.getUserConfigurationUserId = function () {
    return this.params.userId || this.getApiClient().getCurrentUserId();
  };
  View.prototype.onResume = function (options) {
    var result = _basesettingsview.default.prototype.onResume.apply(this, arguments);
    var viewOrderList = this.view.querySelector('.viewOrderList');
    viewOrderList == null || viewOrderList.resume(options);
    var homescreenSectionList = this.view.querySelector('.homescreenSectionList');
    homescreenSectionList == null || homescreenSectionList.resume(options);
    return result;
  };
  View.prototype.onPause = function () {
    _basesettingsview.default.prototype.onPause.apply(this, arguments);
    var viewOrderList = this.view.querySelector('.viewOrderList');
    viewOrderList == null || viewOrderList.pause();
    var homescreenSectionList = this.view.querySelector('.homescreenSectionList');
    homescreenSectionList == null || homescreenSectionList.pause();
  };
  var _default = _exports.default = View;
});
