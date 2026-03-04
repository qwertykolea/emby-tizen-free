define(["exports", "./../emby-apiclient/connectionmanager.js", "./../emby-elements/emby-button/emby-button.js", "./../emby-elements/emby-scroller/emby-scroller.js", "./../emby-elements/emby-itemscontainer/emby-itemscontainer.js", "./../loading/loading.js", "./../dialoghelper/dialoghelper.js", "./../layoutmanager.js", "./../dom.js", "./../common/globalize.js", "./../common/usersettings/usersettings.js", "./../focusmanager.js", "./../common/playback/playbackmanager.js", "./../listview/listview.js", "./../common/itemmanager/itemmanager.js", "./../alphapicker/alphapicker.js", "./../shortcuts.js", "./../emby-elements/emby-dialogclosebutton/emby-dialogclosebutton.js"], function (_exports, _connectionmanager, _embyButton, _embyScroller, _embyItemscontainer, _loading, _dialoghelper, _layoutmanager, _dom, _globalize, _usersettings, _focusmanager, _playbackmanager, _listview, _itemmanager, _alphapicker, _shortcuts, _embyDialogclosebutton) {
  Object.defineProperty(_exports, "__esModule", {
    value: true
  });
  _exports.default = void 0;
  /* jshint module: true */

  require(['material-icons', 'formDialogStyle']);
  function showPrompt(options) {
    return Emby.importModule('./modules/prompt/prompt.js').then(function (prompt) {
      return prompt(options);
    });
  }
  function showToast(options) {
    return Emby.importModule('./modules/toast/toast.js').then(function (toast) {
      return toast(options);
    });
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
  function onDataFetched(result) {
    var instance = this;
    _dom.default.removeEventListener(instance.itemsContainer, 'focus', onItemsContainerFocus.bind(instance), {
      capture: true,
      passive: true
    });
    if (_layoutmanager.default.tv) {
      _dom.default.addEventListener(instance.itemsContainer, 'focus', onItemsContainerFocus.bind(instance), {
        capture: true,
        passive: true
      });
    }
    return Promise.resolve(result);
  }
  function AddToList() {}
  function getEditorHtml(options) {
    var html = '';
    html += '<div class="formDialogContent flex flex-direction-column align-items-center" style="overflow:hidden;">';
    var scrollerStyle = "width:100%;";
    if (_layoutmanager.default.tv) {
      scrollerStyle += "max-width:70ch;";
    }
    html += '<div is="emby-scroller" data-horizontal="false" data-forcescrollbar="true" data-focusscroll="true" class="flex flex-grow virtualScrollerScrollContainer" style="' + scrollerStyle + '">';
    html += '<div class="alphaPicker alphaPicker-vertical alphaPicker-fixed alphaPicker-fixed-left focuscontainer-y hide"></div>';
    html += '<div class="scrollSlider dialog-content-centered padded-left padded-right padded-top flex-grow verticalSections" style="padding-top:1.5em;">';
    html += '<div class="recentSection verticalSection verticalSection-extrabottompadding hide">';
    html += '<h3 class="sectionTitle">' + _globalize.default.translate('Recent') + '</h3>';
    html += '<div is="emby-itemscontainer" class="itemsContainer recentItemsContainer itemsContainer-defaultCardSize vertical-wrap">';
    html += '</div>';
    html += '</div>';
    html += '<div class="verticalSection">';
    html += '<h3 class="sectionTitle">';
    var allText = options.type === 'Collection' ? _globalize.default.translate('AllCollections') : _globalize.default.translate('AllPlaylists');
    html += allText;
    html += '</h3>';
    html += '<div is="emby-itemscontainer" data-virtualscrolllayout="vertical-grid" class="itemsContainer allItemsContainer itemsContainer-defaultCardSize vertical-wrap padded-bottom-page">';

    // itemsContainer
    html += '</div>';
    html += '</div>';

    // scrollSlider
    html += '</div>';

    // emby-scroller
    html += '</div>';

    // formDialogContent
    html += '</div>';
    return html;
  }
  function onNewClick() {
    this.result = 'new';
    this.closeDialog();
  }
  function onQueueClick() {
    this.result = 'queue';
    this.closeDialog();
  }
  function autoFocus() {
    var dlg = this.dlg;
    _focusmanager.default.autoFocus(dlg, {
      skipIfNotEnabled: true
    });
  }
  function onDialogClosed() {
    var result = this.result;
    var options = this.options;
    if (!result) {
      this.cleanup();
      return Promise.reject();
    }
    if (result === 'new') {
      return this.newList();
    }
    if (result === 'queue') {
      _playbackmanager.default.queue({
        serverId: _connectionmanager.default.getApiClient(options.items[0]).serverId(),
        ids: this.getItemIds()
      });
      showToast({
        text: _globalize.default.translate('HeaderAddedToPlayQueue'),
        icon: '&#xe03b;'
      });
    }
    this.cleanup();
    return Promise.resolve();
  }
  function onItemAction(e) {
    var item = e.detail.item;
    if (item.Type === 'Playlist' || item.Type === 'BoxSet') {
      if (item.Id === 'new') {
        onNewClick.call(this);
      } else {
        this.addToList(item);
      }
    }
  }
  function updateAlphaPickerState(instance, numItems) {
    var alphaPickerAllowed = true;
    if (alphaPickerAllowed) {
      initAlphaNumericShortcuts(instance);
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
  function onAlphaValueChanged(e) {
    var value = e.detail.value;
    var scroller = this.scroller;
    trySelectValue(this, scroller, this.itemsContainer, value, _layoutmanager.default.tv ? true : false);
  }
  AddToList.prototype.initAlphaPicker = function () {
    if (this.alphaPicker) {
      return;
    }
    this.alphaPickerElement = this.dlg.querySelector('.alphaPicker');
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
  AddToList.prototype.getInlinePaddingElement = function () {
    return this.itemsContainer.closest('.padded-left');
  };
  AddToList.prototype.refreshPrefixes = function () {
    var instance = this;
    this.getPrefixes().then(function (prefixes) {
      instance.alphaPicker.setPrefixes(prefixes);
    });
  };
  AddToList.prototype.onRefreshing = function (result) {
    var items = result.Items || result;
    var totalRecordCount = result.TotalRecordCount || items.length;
    updateAlphaPickerState(this, totalRecordCount);
  };
  function getItemsQuery(options, query) {
    var fields = 'PrimaryImageAspectRatio';
    if (_layoutmanager.default.tv) {
      fields += ',Prefix';
    }
    var itemType = options.type === 'Collection' ? 'Boxset' : options.type;
    return Object.assign({
      Recursive: true,
      IncludeItemTypes: itemType,
      SortBy: 'SortName',
      Fields: fields,
      EnableUserData: false,
      CanEditItems: true
    }, query);
  }
  AddToList.prototype.getRecentItems = function (query) {
    var options = this.options;
    var type = options.type;
    var lastListIds;
    if (type === 'Playlist') {
      lastListIds = _usersettings.default.get('playlisteditor-lastplaylistid');
    } else if (type === 'Collection') {
      lastListIds = _usersettings.default.get('collectioneditor-lastcollectionid');
    }
    lastListIds = lastListIds ? lastListIds.split(',') : [];
    if (!lastListIds.length) {
      return Promise.resolve({
        Items: [],
        TotalRecordCount: 0
      });
    }
    var apiClient = _connectionmanager.default.getApiClient(options.items[0]);
    query = getItemsQuery(options, Object.assign({
      Ids: lastListIds.join(',')
    }, query));
    return apiClient.getItems(apiClient.getCurrentUserId(), query);
  };
  function mapPrefix(i) {
    return i.Name;
  }
  AddToList.prototype.getPrefixes = function () {
    var options = this.options;
    var apiClient = _connectionmanager.default.getApiClient(options.items[0]);
    var query = getItemsQuery(options, {
      EnableUserData: false
    });
    return apiClient.getPrefixes(apiClient.getCurrentUserId(), query).then(function (result) {
      return result.map(mapPrefix);
    });
  };
  AddToList.prototype.getItems = function (query) {
    var options = this.options;
    var apiClient = _connectionmanager.default.getApiClient(options.items[0]);
    var buttonText = options.type === 'Collection' ? _globalize.default.translate('HeaderNewCollection') : _globalize.default.translate('HeaderNewPlaylist');
    query = getItemsQuery(options, query);
    if (query.StartIndex) {
      query.StartIndex--;
    }
    return apiClient.getItems(apiClient.getCurrentUserId(), query).then(function (result) {
      if (!query.StartIndex && query.Limit) {
        result.Items.unshift({
          Name: buttonText,
          Id: 'new',
          Type: 'Playlist',
          ServerId: apiClient.serverId(),
          IsFolder: true,
          Icon: 'add',
          Prefix: '0',
          iconClass: 'accentText'
        });
      }
      if (query.EnableTotalRecordCount !== false) {
        if (!query.NameStartsWithOrGreater || !isNaN(query.NameStartsWithOrGreater[0])) {
          result.TotalRecordCount++;
        }
      }
      return result;
    });
  };
  AddToList.prototype.getCardOptions = function (items) {
    var fields = ['Name'];
    var options = {
      enableDefaultIcon: true,
      action: 'custom',
      fields: fields,
      draggable: false,
      draggableXActions: false,
      multiSelect: false,
      contextMenu: false,
      hoverPlayButton: false,
      imageSize: 'smaller',
      enableUserDataButtons: false,
      mediaInfo: false
    };
    return options;
  };
  AddToList.prototype.getListOptions = function (items) {
    return {
      renderer: _listview.default,
      options: this.getCardOptions(items),
      virtualScrollLayout: 'vertical-list'
    };
  };
  function initAlphaNumericShortcuts(instance) {
    Emby.importModule('./modules/alphanumericshortcuts/alphanumericshortcuts.js').then(function (AlphaNumericShortcuts) {
      instance.alphaNumericShortcuts = new AlphaNumericShortcuts({
        itemsContainer: instance.itemsContainer
      });
      instance.alphaNumericShortcuts.onAlphaNumericValueEntered = onAlphaNumericValueEntered.bind(instance);
    });
  }
  function onAlphaNumericValueEntered(value) {
    trySelectValue(this, this.scroller, this.dlg, value, true);
  }
  function trySelectValue(instance, scroller, view, value, focus) {
    if (!value || value === '#') {
      // scroll to top
      instance.itemsContainer.scrollToIndex(0, {}, focus);
    } else {
      instance.getItems({
        Limit: 0
      }).then(function (totalResult) {
        instance.getItems({
          Limit: 0,
          NameStartsWithOrGreater: value
        }).then(function (result) {
          instance.itemsContainer.scrollToIndex(Math.max(totalResult.TotalRecordCount - result.TotalRecordCount, 0), {}, focus);
        });
      });
    }
  }
  function onRecentItemsContainerUpgraded() {
    this.recentItemsContainer.resume({
      refresh: true
    });
  }
  function onAllItemsContainerUpgraded() {
    this.itemsContainer.resume({
      refresh: true
    }).then(autoFocus.bind(this));
  }
  function onOpened() {
    var recentItemsContainer = this.recentItemsContainer;
    if (recentItemsContainer.resume) {
      onRecentItemsContainerUpgraded.call(this);
    } else {
      _dom.default.addEventListener(recentItemsContainer, 'upgraded', onRecentItemsContainerUpgraded.bind(this), {
        once: true
      });
    }
    var itemsContainer = this.itemsContainer;
    if (itemsContainer.resume) {
      onAllItemsContainerUpgraded.call(this);
    } else {
      _dom.default.addEventListener(itemsContainer, 'upgraded', onAllItemsContainerUpgraded.bind(this), {
        once: true
      });
    }
    this.initAlphaPicker();
  }
  AddToList.prototype.show = function (options) {
    var dialogOptions = {
      removeOnClose: true,
      scrollY: false,
      autoFocus: false
    };
    if (_layoutmanager.default.tv) {
      dialogOptions.size = 'fullscreen';
    } else {
      dialogOptions.size = 'small';
    }
    var dlg = _dialoghelper.default.createDialog(dialogOptions);
    dlg.classList.add('formDialog');
    var html = '';
    var title = options.type === 'Collection' ? _globalize.default.translate('HeaderAddToCollection') : _globalize.default.translate('HeaderAddToPlaylist');
    html += '<div class="formDialogHeader">';
    html += '<button type="button" is="emby-dialogclosebutton"></button>';
    html += '<h3 class="formDialogHeaderTitle">';
    html += title;
    html += '</h3>';
    html += '</div>';
    html += getEditorHtml(options);
    dlg.innerHTML = html;
    this.dlg = dlg;
    this.options = options;
    var btnQueue = dlg.querySelector('.btnQueue');
    if (btnQueue) {
      btnQueue.addEventListener('click', onQueueClick.bind(this));
    }
    var itemsContainer = dlg.querySelector('.allItemsContainer');
    itemsContainer.addEventListener('action-null', onItemAction.bind(this));
    itemsContainer.fetchData = this.getItems.bind(this);
    itemsContainer.getListOptions = this.getListOptions.bind(this);
    itemsContainer.onDataFetched = onDataFetched.bind(this);
    itemsContainer.onRefreshing = this.onRefreshing.bind(this);
    this.itemsContainer = itemsContainer;
    var recentItemsContainer = dlg.querySelector('.recentItemsContainer');
    recentItemsContainer.addEventListener('action-null', onItemAction.bind(this));
    recentItemsContainer.fetchData = this.getRecentItems.bind(this);
    recentItemsContainer.getListOptions = this.getListOptions.bind(this);
    recentItemsContainer.parentContainer = recentItemsContainer.closest('.verticalSection');
    this.recentItemsContainer = recentItemsContainer;
    dlg.addEventListener('opened', onOpened.bind(this));
    var dlgClosedFn = onDialogClosed.bind(this);
    return _dialoghelper.default.open(dlg).then(dlgClosedFn, dlgClosedFn);
  };
  function mapItem(i) {
    return i.Id;
  }
  AddToList.prototype.getItemIds = function () {
    var options = this.options;
    return options.items.map(mapItem);
  };
  AddToList.prototype.addToList = function (list) {
    var itemIds = this.getItemIds();
    var instance = this;
    return _itemmanager.default.addToListHelper(list, itemIds).then(function (result) {
      instance.result = '1';
      instance.closeDialog();
    });
  };
  function onNewPromptClosed(result) {
    var name = result;
    if (!result) {
      this.cleanup();
      return Promise.reject();
    }
    _loading.default.show();
    var options = this.options;
    var apiClient = _connectionmanager.default.getApiClient(options.items[0]);
    this.listName = name;
    return _itemmanager.default.createListHelper(apiClient, options.type, name, this.getItemIds()).then(onListCreated.bind(this));
  }
  AddToList.prototype.newList = function () {
    var instance = this;
    var title = instance.options.type === 'Collection' ? _globalize.default.translate('HeaderNewCollection') : _globalize.default.translate('HeaderNewPlaylist');
    var dlgClosedFn = onNewPromptClosed.bind(instance);
    return showPrompt({
      title: title,
      label: _globalize.default.translate('LabelName'),
      confirmText: _globalize.default.translate('Create')
    }).then(dlgClosedFn, dlgClosedFn);
  };
  function onListCreated(result) {
    this.cleanup();
    return Promise.resolve();
  }
  AddToList.prototype.closeDialog = function () {
    var dlg = this.dlg;
    if (dlg) {
      _dialoghelper.default.close(dlg);
    }
  };
  AddToList.prototype.destroyAlphaNumericShortcuts = function () {
    var alphaNumericShortcuts = this.alphaNumericShortcuts;
    if (alphaNumericShortcuts) {
      alphaNumericShortcuts.destroy();
      this.alphaNumericShortcuts = null;
    }
  };
  AddToList.prototype.cleanup = function () {
    this.listName = null;
    this.options = null;
    this.dlg = null;
    this.itemsContainer = null;
    this.recentItemsContainer = null;
    this.destroyAlphaNumericShortcuts();
    if (this.alphaPicker) {
      this.alphaPicker.destroy();
      this.alphaPicker = null;
    }
  };
  var _default = _exports.default = AddToList;
});
