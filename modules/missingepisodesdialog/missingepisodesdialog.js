define(["exports", "./../emby-apiclient/connectionmanager.js", "./../emby-elements/emby-button/emby-button.js", "./../emby-elements/emby-scroller/emby-scroller.js", "./../emby-elements/emby-toggle/emby-toggle.js", "./../emby-elements/emby-itemscontainer/emby-itemscontainer.js", "./../dialoghelper/dialoghelper.js", "./../layoutmanager.js", "./../dom.js", "./../common/globalize.js", "./../loading/loading.js", "./../focusmanager.js", "./../listview/listview.js", "./../emby-elements/emby-dialogclosebutton/emby-dialogclosebutton.js"], function (_exports, _connectionmanager, _embyButton, _embyScroller, _embyToggle, _embyItemscontainer, _dialoghelper, _layoutmanager, _dom, _globalize, _loading, _focusmanager, _listview, _embyDialogclosebutton) {
  Object.defineProperty(_exports, "__esModule", {
    value: true
  });
  _exports.default = void 0;
  /* jshint module: true */

  require(['material-icons', 'formDialogStyle']);
  function MissingEpisodesDialog() {}
  function getEditorHtml(options) {
    var html = '';
    html += '<div class="formDialogContent flex flex-direction-column align-items-center" style="overflow:hidden;">';
    var scrollerStyle = "width:100%;";
    if (_layoutmanager.default.tv) {
      scrollerStyle += "max-width:90ch;";
    }
    html += '<div is="emby-scroller" data-horizontal="false" data-forcescrollbar="true" data-focusscroll="true" class="flex flex-grow virtualScrollerScrollContainer" style="' + scrollerStyle + '">';
    html += '<div class="scrollSlider dialog-content-centered padded-left padded-right flex-grow">';
    var apiClient = _connectionmanager.default.getApiClient(options.items[0]);
    var fieldContainerClass = apiClient.isMinServerVersion('4.8.0.59') ? '' : ' hide';
    if (_layoutmanager.default.tv) {
      // to avoid focus borders being cut off due to overflow:hidden
      fieldContainerClass += ' padded-top';
    }
    html += '<div style="margin-bottom:.5em;" class="flex align-items-center justify-content-flex-end fieldItems' + fieldContainerClass + ' focuscontainer-x">';
    html += '<div class="toggleContainer fieldItems-item" style="margin-bottom:0;">';
    html += '<label style="width:auto;">';
    html += '<input is="emby-toggle" type="checkbox" class="chkSpecials" label="' + _globalize.default.translate('Specials') + '" />';
    html += '</label>';
    html += '</div>';
    html += '<div class="toggleContainer fieldItems-item" style="margin-bottom:0;">';
    html += '<label style="width:auto;">';
    html += '<input is="emby-toggle" type="checkbox" class="chkUnaired" label="' + _globalize.default.translate('Upcoming') + '" />';
    html += '</label>';
    html += '</div>';
    html += '</div>';
    html += '<div is="emby-itemscontainer" data-virtualscrolllayout="vertical-grid" class="itemsContainer allItemsContainer itemsContainer-defaultCardSize vertical-wrap padded-bottom-page">';

    // itemsContainer
    html += '</div>';

    // scrollSlider
    html += '</div>';

    // emby-scroller
    html += '</div>';

    // formDialogContent
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
    this.cleanup();
    return Promise.resolve();
  }
  MissingEpisodesDialog.prototype.getItems = function (query) {
    var instance = this;
    var options = instance.options;
    var apiClient = _connectionmanager.default.getApiClient(options.items[0]);
    return apiClient.getMissingEpisodes(Object.assign({
      UserId: apiClient.getCurrentUserId(),
      ImageTypeLimit: 1,
      EnableImageTypes: "Primary,Backdrop,Thumb",
      Fields: 'Overview',
      ParentId: options.items[0].Id,
      IncludeSpecials: instance.dlg.querySelector('.chkSpecials').checked,
      IncludeUnaired: instance.dlg.querySelector('.chkUnaired').checked
    }, query));
  };
  MissingEpisodesDialog.prototype.getListOptions = function (items) {
    return {
      renderer: _listview.default,
      options: {
        enableDefaultIcon: true,
        action: 'overview',
        fields: ['Name', 'MediaInfo', 'Overview'],
        draggable: false,
        draggableXActions: false,
        multiSelect: false,
        contextMenu: false,
        hoverPlayButton: false,
        imageSize: 'medium',
        enableUserDataButtons: false,
        mediaInfo: false,
        enableBottomOverview: false,
        playQueueIndicator: false
      },
      virtualScrollLayout: 'vertical-list'
    };
  };
  function afterRefresh(result) {
    if (!result.TotalRecordCount) {
      this.itemsContainer.innerHTML = '<p>' + _globalize.default.translate('NoItemsFound') + '</p>';
    }
    _loading.default.hide();
  }
  function onAllItemsContainerUpgraded() {
    this.itemsContainer.resume({
      refresh: true
    }).then(autoFocus.bind(this));
  }
  function onOpened() {
    _loading.default.show();
    var itemsContainer = this.itemsContainer;
    if (itemsContainer.resume) {
      onAllItemsContainerUpgraded.call(this);
    } else {
      _dom.default.addEventListener(itemsContainer, 'upgraded', onAllItemsContainerUpgraded.bind(this), {
        once: true
      });
    }
  }
  MissingEpisodesDialog.prototype.show = function (options) {
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
    html += _globalize.default.translate('HeaderMissingEpisodes');
    html += '</h3>';

    //let item = options.items[0];
    //html += '<div class="secondaryText">';
    //if (item.SeriesName) {
    //    html += item.SeriesName + ' ';
    //}
    //html += item.Name;
    //html += '</div>';

    html += '</div>';
    html += getEditorHtml(options);
    dlg.innerHTML = html;
    this.dlg = dlg;
    this.options = options;
    var itemsContainer = dlg.querySelector('.allItemsContainer');
    itemsContainer.fetchData = this.getItems.bind(this);
    itemsContainer.getListOptions = this.getListOptions.bind(this);
    itemsContainer.afterRefresh = afterRefresh.bind(this);
    this.itemsContainer = itemsContainer;
    dlg.querySelector('.fieldItems').addEventListener('change', function () {
      itemsContainer.refreshItems();
    });
    dlg.addEventListener('opened', onOpened.bind(this));
    var dlgClosedFn = onDialogClosed.bind(this);
    return _dialoghelper.default.open(dlg).then(dlgClosedFn, dlgClosedFn);
  };
  MissingEpisodesDialog.prototype.closeDialog = function () {
    var dlg = this.dlg;
    if (dlg) {
      _dialoghelper.default.close(dlg);
    }
  };
  MissingEpisodesDialog.prototype.cleanup = function () {
    this.listName = null;
    this.options = null;
    this.dlg = null;
    this.itemsContainer = null;
    this.recentItemsContainer = null;
  };
  var _default = _exports.default = MissingEpisodesDialog;
});
