define(["exports", "./../emby-apiclient/connectionmanager.js", "./../emby-elements/emby-button/emby-button.js", "./../emby-elements/emby-select/emby-select.js", "./../emby-elements/emby-scroller/emby-scroller.js", "./../emby-elements/emby-itemscontainer/emby-itemscontainer.js", "./../emby-elements/emby-dialogclosebutton/emby-dialogclosebutton.js", "./../dialoghelper/dialoghelper.js", "./../layoutmanager.js", "./../dom.js", "./../common/globalize.js", "./../focusmanager.js", "./../listview/listview.js", "./../shortcuts.js", "./../common/responsehelper.js"], function (_exports, _connectionmanager, _embyButton, _embySelect, _embyScroller, _embyItemscontainer, _embyDialogclosebutton, _dialoghelper, _layoutmanager, _dom, _globalize, _focusmanager, _listview, _shortcuts, _responsehelper) {
  Object.defineProperty(_exports, "__esModule", {
    value: true
  });
  _exports.default = void 0;
  /* jshint module: true */

  require(['material-icons', 'formDialogStyle']);
  function ItemAccessDialog() {}
  function getEditorHtml(options) {
    var html = '';
    html += '<div is="emby-scroller" data-horizontal="false" data-forcescrollbar="true" data-focusscroll="true" class="formDialogContent virtualScrollerScrollContainer">';
    html += '<div class="scrollSlider">';
    html += '<form class="dialogContentInner dialog-content-centered padded-left padded-right">';
    var item = options.item;
    html += '<div class="selectContainer flex-shrink-zero">';
    html += '<select is="emby-select" class="selectVisibility emby-select-dynamicfielddescription" required="required" label="' + _globalize.default.translate('Visibility') + '" data-menu="custom">';
    html += '<option value="private" data-description="' + _globalize.default.translate('MakePrivateDescription') + '">' + _globalize.default.translate('Private') + '</option>';
    if (item.Type === 'Playlist') {
      html += '<option value="public" data-description="' + _globalize.default.translate('MakePublicDescription') + '">' + _globalize.default.translate('Collaborative') + '</option>';
    } else {
      html += '<option value="public" data-description="' + _globalize.default.translate('MakePublicDescription') + '">' + _globalize.default.translate('Public') + '</option>';
    }
    html += '</select>';
    html += '<div class="fieldDescription dynamicFieldDescription hide"></div>';
    html += '</div>';
    html += '<div class="userItemAccessContainer hide">';
    html += '<div class="flex secondaryText" style="margin:2em 0 0;">';
    html += '<h3 class="flex-grow" style="margin:0;">' + _globalize.default.translate('User');
    html += '</h3>';
    html += '<h3 style="margin:0;">' + _globalize.default.translate('Access');
    html += '</h3>';
    html += '</div>';
    html += '<div is="emby-itemscontainer" data-virtualscrolllayout="vertical-grid" class="itemsContainer allItemsContainer itemsContainer-defaultCardSize vertical-wrap padded-bottom-page">';

    // itemsContainer
    html += '</div>';
    html += '</div>';
    html += '</form>';

    // scrollSlider
    html += '</div>';

    // emby-scroller
    html += '</div>';
    return html;
  }
  function autoFocus() {
    var dlg = this.dlg;
    _focusmanager.default.autoFocus(dlg, {
      skipIfNotEnabled: true
    });
  }
  function onDialogClosed() {
    var result = this.result;
    if (!result) {
      this.cleanup();
      return Promise.reject();
    }
    this.cleanup();
    return Promise.resolve();
  }
  function onItemAction(e) {
    if (!_layoutmanager.default.tv) {
      return;
    }

    //let instance = this;
    //let user = e.detail.item;
    //let item = instance.options.item;

    // dirty, dirty hack for now to avoid having to duplicate the code from listview.js with all the available select options
    e.target.closest('.listItem').querySelector('select').click();
  }
  ItemAccessDialog.prototype.getItems = function (query) {
    var instance = this;
    var options = instance.options;
    var apiClient = _connectionmanager.default.getApiClient(options.item);
    if (!apiClient.isMinServerVersion('4.8.0.62')) {
      return Promise.resolve({
        Items: [],
        TotalRecordCount: 0
      });
    }
    query = Object.assign({
      ItemId: instance.options.item.Id,
      ExcludeUserIds: apiClient.getCurrentUserId()
    }, query);
    return apiClient.getUsersForItemAccess(query).then(function (result) {
      var itemAccessItem = instance.options.item;
      var items = result.Items;
      for (var i = 0, length = items.length; i < length; i++) {
        items[i].itemAccessItem = itemAccessItem;
      }
      return result;
    });
  };
  ItemAccessDialog.prototype.getCardOptions = function (items) {
    var fields = ['Name'];
    fields.push('ProductionYear');
    fields.push('ParentName');
    var options = {
      enableDefaultIcon: true,
      action: 'custom',
      fields: fields,
      draggable: false,
      draggableXActions: false,
      multiSelect: false,
      contextMenu: false,
      hoverPlayButton: false,
      imageSize: 'small',
      enableUserDataButtons: false,
      mediaInfo: false,
      itemAccessSelection: true,
      playQueueIndicator: false
    };
    return options;
  };
  ItemAccessDialog.prototype.getListOptions = function (items) {
    return {
      renderer: _listview.default,
      options: this.getCardOptions(items),
      virtualScrollLayout: 'vertical-list'
    };
  };
  function onAllItemsContainerUpgraded() {
    this.itemsContainer.resume({
      refresh: true
    }).then(autoFocus.bind(this));
  }
  function onOpened() {
    var itemsContainer = this.itemsContainer;
    if (itemsContainer.resume) {
      onAllItemsContainerUpgraded.call(this);
    } else {
      _dom.default.addEventListener(itemsContainer, 'upgraded', onAllItemsContainerUpgraded.bind(this), {
        once: true
      });
    }
  }
  function onVisibilityChange(e) {
    var instance = this;
    var options = instance.options;
    var item = options.item;
    var apiClient = _connectionmanager.default.getApiClient(item);
    var select = e.target;
    var value = select.value;
    var promise;
    if (value === 'public') {
      promise = apiClient.makePublic(item.Id);
    } else {
      promise = apiClient.makePrivate(item.Id);
    }
    return promise.then(function () {
      return apiClient.getItem(apiClient.getCurrentUserId(), options.item.Id, {
        fields: 'ShareLevel',
        ExcludeFields: 'Chapters,MediaSources,MediaStreams,People,Overview,Subviews'
      }).then(function (item) {
        options.item = item;
        instance.itemsContainer.refreshItems();
      });
    });
  }
  function onUserAccessChange(e) {
    var instance = this;
    var options = instance.options;
    var item = options.item;
    var select = e.target;
    var itemsContainer = instance.itemsContainer;
    var itemElement = _shortcuts.default.getItemElementFromChildNode(select, false, itemsContainer);
    var user = itemsContainer.getItemFromElement(itemElement);
    var itemAccess = select.value;
    var apiClient = _connectionmanager.default.getApiClient(user);
    apiClient.updateUserItemAccess({
      UserIds: [user.Id],
      ItemIds: [item.Id],
      ItemAccess: itemAccess
    }).then(function () {
      itemsContainer.refreshItems();
    }, _responsehelper.default.handleErrorResponse);
  }
  ItemAccessDialog.prototype.show = function (options) {
    var item = options.item;
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
    html += '<div class="formDialogHeader">';
    html += '<button type="button" is="emby-dialogclosebutton" closetype="done"></button>';
    html += '<h3 class="formDialogHeaderTitle">';
    if (item.Type === 'Playlist') {
      html += _globalize.default.translate('HeaderManageCollaboration');
    } else {
      html += _globalize.default.translate('HeaderManageAccess');
    }
    html += '</h3>';
    html += '</div>';
    html += getEditorHtml(options);
    dlg.innerHTML = html;
    var selectVisibility = dlg.querySelector('.selectVisibility');
    selectVisibility.addEventListener('change', onVisibilityChange.bind(this));
    // use this for the dynamic field description
    selectVisibility.singleValue = item.CanMakePublic ? 'private' : 'public';
    this.dlg = dlg;
    this.options = options;
    var itemsContainer = dlg.querySelector('.allItemsContainer');
    itemsContainer.addEventListener('action-null', onItemAction.bind(this));
    itemsContainer.fetchData = this.getItems.bind(this);
    itemsContainer.getListOptions = this.getListOptions.bind(this);
    itemsContainer.addEventListener('change', onUserAccessChange.bind(this));
    itemsContainer.parentContainer = itemsContainer.closest('.userItemAccessContainer');
    this.itemsContainer = itemsContainer;
    dlg.addEventListener('opened', onOpened.bind(this));
    var dlgClosedFn = onDialogClosed.bind(this);
    return _dialoghelper.default.open(dlg).then(dlgClosedFn, dlgClosedFn);
  };
  ItemAccessDialog.prototype.closeDialog = function () {
    var dlg = this.dlg;
    if (dlg) {
      _dialoghelper.default.close(dlg);
    }
  };
  ItemAccessDialog.prototype.cleanup = function () {
    this.listName = null;
    this.options = null;
    this.dlg = null;
    this.itemsContainer = null;
  };
  var _default = _exports.default = ItemAccessDialog;
});
