define(["exports", "./../dialoghelper/dialoghelper.js", "./../dom.js", "./../cardbuilder/cardbuilder.js", "./../listview/listview.js", "./../loading/loading.js", "./../emby-apiclient/connectionmanager.js", "./../focusmanager.js", "./../common/globalize.js", "./../common/servicelocator.js", "./../common/textencoding.js", "./../layoutmanager.js", "./../emby-elements/emby-input/emby-input.js", "./../emby-elements/emby-button/paper-icon-button-light.js", "./../emby-elements/emby-scroller/emby-scroller.js", "./../emby-elements/emby-toggle/emby-toggle.js", "./../emby-elements/emby-dialogclosebutton/emby-dialogclosebutton.js", "./../common/dialogs/confirm.js"], function (_exports, _dialoghelper, _dom, _cardbuilder, _listview, _loading, _connectionmanager, _focusmanager, _globalize, _servicelocator, _textencoding, _layoutmanager, _embyInput, _paperIconButtonLight, _embyScroller, _embyToggle, _embyDialogclosebutton, _confirm) {
  Object.defineProperty(_exports, "__esModule", {
    value: true
  });
  _exports.default = void 0;
  /* jshint module: true */

  require(['formDialogStyle', 'material-icons']);
  function showToast(options) {
    return Emby.importModule('./modules/toast/toast.js').then(function (toast) {
      return toast(options);
    });
  }
  function showIdentifyOptions(instance, page, identifyResult) {
    var identifyOptionsForm = page.querySelector('.identifyOptionsForm');
    page.querySelector('.popupIdentifyForm').classList.add('hide');
    page.querySelector('.identificationSearchResults').classList.add('hide');
    identifyOptionsForm.classList.remove('hide');
    page.querySelector('.chkIdentifyReplaceImages').checked = true;
    var lines = [];
    lines.push(identifyResult.Name);
    if (identifyResult.ProductionYear) {
      lines.push(identifyResult.ProductionYear);
    }
    if (identifyResult.GameSystem) {
      lines.push(identifyResult.GameSystem);
    }
    var resultHtml = lines.join('<br/>');
    if (identifyResult.ImageUrl) {
      var apiClient = _connectionmanager.default.getApiClient(instance.options.item);
      var displayUrl = getSearchImageDisplayUrl(apiClient, identifyResult.ImageUrl, identifyResult.SearchProviderName);
      resultHtml = '<div class="flex align-items-center"><img src="' + displayUrl + '" style="max-height:240px;" /><div style="margin: 0 1em;">' + resultHtml + '</div>';
    }
    page.querySelector('.selectedSearchResult').innerHTML = resultHtml;
    autoFocus.call(instance);
  }
  function getSearchImageDisplayUrl(apiClient, url, provider) {
    return apiClient.getUrl("Items/RemoteSearch/Image", {
      imageUrl: url,
      ProviderName: provider,
      api_key: apiClient.accessToken()
    });
  }
  function showIdentificationForm(dlg, item) {
    var apiClient = _connectionmanager.default.getApiClient(item);
    apiClient.getJSON(apiClient.getUrl("Items/" + item.Id + "/ExternalIdInfos", {
      IsSupportedAsIdentifier: true
    })).then(function (idList) {
      var html = '';
      for (var i = 0, length = idList.length; i < length; i++) {
        var idInfo = idList[i];
        html += '<div class="inputContainer">';
        var idLabel = _globalize.default.translate('LabelDynamicExternalId').replace('{0}', idInfo.Name);
        html += '<input is="emby-input" class="txtLookupId" data-providerkey="' + idInfo.Key + '" label="' + idLabel + '"/>';
        if (idInfo.Website) {
          html += '<div class="fieldDescription">';
          if (_servicelocator.appHost.supports('targetblank') && _servicelocator.appHost.supports('externallinks')) {
            html += '<a is="emby-linkbutton" class="button-link" href="' + idInfo.Website + '" target="_blank">' + idInfo.Website + '</a>';
          } else {
            html += _textencoding.default.htmlEncode(idInfo.Website);
          }
          html += '</div>';
        }
        html += '</div>';
      }
      dlg.querySelector('.txtLookupName').value = '';
      if (item.Type === "Person" || item.Type === "BoxSet") {
        dlg.querySelector('.fldLookupYear').classList.add('hide');
        dlg.querySelector('.txtLookupYear').value = '';
      } else {
        dlg.querySelector('.fldLookupYear').classList.remove('hide');
        dlg.querySelector('.txtLookupYear').value = '';
      }
      dlg.querySelector('.identifyProviderIds').innerHTML = html;
      dlg.querySelector('.formDialogHeaderTitle').innerHTML = _globalize.default.translate('Identify');
    });
  }
  function onDialogClosed() {
    _loading.default.hide();
    var hasChanges = this.hasChanges;
    this.cleanup();
    if (hasChanges) {
      return Promise.resolve(this.currentSearchResult);
    } else {
      return Promise.reject();
    }
  }
  function showIdentificationFormFindNew(dlg, item) {
    dlg.querySelector('.txtLookupName').value = item.Name || '';
    if (item.Type === "Person" || item.Type === "BoxSet") {
      dlg.querySelector('.fldLookupYear').classList.add('hide');
      dlg.querySelector('.txtLookupYear').value = '';
    } else {
      dlg.querySelector('.fldLookupYear').classList.remove('hide');
      dlg.querySelector('.txtLookupYear').value = item.ProductionYear || '';
    }
    dlg.querySelector('.formDialogHeaderTitle').innerHTML = _globalize.default.translate('Search');
  }
  function onCardAction(e) {
    var item = e.detail.item;
    this.currentSearchResult = item;
    _loading.default.hide();

    // handle find new
    if (!this.options.item.Id) {
      this.hasChanges = true;
      this.closeDialog();
      return;
    }
    var dlg = this.dlg;
    if (dlg) {
      showIdentifyOptions(this, dlg, item);
    }
  }
  function autoFocus() {
    var dlg = this.dlg;
    _loading.default.hide();
    _focusmanager.default.autoFocus(dlg, {
      skipIfNotEnabled: true
    });
  }
  function ItemIdentifier(options) {
    this.options = options;
  }
  ItemIdentifier.prototype.afterRefresh = function (result) {
    if (result.length) {
      this.dlg.querySelector('.noResultsFound').classList.add('hide');
    } else {
      this.dlg.querySelector('.noResultsFound').classList.remove('hide');
    }
  };
  ItemIdentifier.prototype.getItems = function (query) {
    _loading.default.show();
    var dlg = this.dlg;
    if (!dlg) {
      return Promise.resolve([]);
    }
    var options = this.options;
    var item = options.item;
    var apiClient = _connectionmanager.default.getApiClient(item);
    var lookupInfo = {
      ProviderIds: {}
    };
    var i, length;
    var identifyField = dlg.querySelectorAll('.identifyField');
    var value;
    for (i = 0, length = identifyField.length; i < length; i++) {
      value = identifyField[i].value;
      if (value) {
        if (identifyField[i].type === 'number') {
          value = parseInt(value);
        }
        lookupInfo[identifyField[i].getAttribute('data-lookup')] = value;
      }
    }
    var hasId = false;
    var txtLookupId = dlg.querySelectorAll('.txtLookupId');
    for (i = 0, length = txtLookupId.length; i < length; i++) {
      value = txtLookupId[i].value;
      if (value) {
        hasId = true;
        lookupInfo.ProviderIds[txtLookupId[i].getAttribute('data-providerkey')] = value;
      }
    }
    if (!hasId && !lookupInfo.Name) {
      return Promise.resolve([]);
    }
    if (item.GameSystem) {
      lookupInfo.GameSystem = item.GameSystem;
    }
    lookupInfo = {
      SearchInfo: lookupInfo
    };
    if (item.Id) {
      lookupInfo.ItemId = item.Id;
    } else {
      lookupInfo.IncludeDisabledProviders = true;
    }
    var instance = this;
    return apiClient.ajax({
      type: "POST",
      url: apiClient.getUrl("Items/RemoteSearch/" + item.Type),
      data: JSON.stringify(lookupInfo),
      contentType: "application/json",
      dataType: 'json'
    }).then(function (results) {
      results.forEach(normalizeSearchResult.bind(instance));
      return results;
    });
  };
  function normalizeSearchResult(item) {
    var type = this.options.item.Type;

    // for default icons
    item.Type = type;
    item.IsFolder = type === 'Series' || type === 'MusicAlbum';
    if (type === 'Movie' || type === 'Series' || type === 'Trailer' || type === 'BoxSet' || type === 'Person') {
      item.PrimaryImageAspectRatio = 2 / 3;
    } else {
      item.PrimaryImageAspectRatio = 1;
    }
    if (item.AlbumArtist) {
      item.AlbumArtists = [item.AlbumArtist];
    }

    // for listview
    item.ShortOverview = item.DisambiguationComment;
  }
  ItemIdentifier.prototype.getCardOptions = function (items) {
    var type = this.options.item.Type;
    var fields = ['Name'];
    if (type !== 'Person' && type !== 'MusicArtist') {
      fields.push('ProductionYear');
    }
    if (type === 'Game' || type === 'MusicAlbum' || type === 'MusicVideo') {
      fields.push('ParentName');
    }
    var options = {
      shape: 'auto',
      fields: fields,
      multiSelect: false,
      contextMenu: false,
      hoverMenu: false,
      action: 'custom',
      textLinks: false,
      lazy: 2,
      draggable: false,
      playQueueIndicator: false
    };
    return options;
  };
  ItemIdentifier.prototype.getListViewOptions = function (items) {
    var type = this.options.item.Type;
    var fields = ['Name', 'ShortOverview'];
    if (type !== 'Person' && type !== 'MusicArtist') {
      fields.push('ProductionYear');
    }
    if (type === 'Game' || type === 'MusicAlbum' || type === 'MusicVideo') {
      fields.push('ParentName');
    }
    var options = {
      enableDefaultIcon: true,
      action: 'custom',
      fields: fields,
      artist: type === 'MusicAlbum' || type === 'MusicVideo',
      draggable: false,
      draggableXActions: false,
      multiSelect: false,
      contextMenu: false,
      hoverPlayButton: false,
      imageSize: 'medium',
      playQueueIndicator: false
    };
    return options;
  };
  function enableListViewResults(item) {
    return item.Type === 'MusicAlbum';
  }
  ItemIdentifier.prototype.getListOptions = function (items) {
    var item = this.options.item;
    if (enableListViewResults(item)) {
      return {
        renderer: _listview.default,
        options: this.getListViewOptions(items)
      };
    }
    return {
      renderer: _cardbuilder.default,
      options: this.getCardOptions(items),
      virtualScrollLayout: 'vertical-grid'
    };
  };
  function onItemsContainerUpgraded() {
    this.itemsContainer.resume({
      refresh: false
    }).then(autoFocus.bind(this));
  }
  function onOpened() {
    var itemsContainer = this.itemsContainer;
    if (itemsContainer.resume) {
      onItemsContainerUpgraded.call(this);
    } else {
      _dom.default.addEventListener(itemsContainer, 'upgraded', onItemsContainerUpgraded.bind(this), {
        once: true
      });
    }
  }
  ItemIdentifier.prototype.show = function () {
    var item = this.options.item;
    var instance = this;
    return require(['text!modules/itemidentifier/itemidentifier.template.html']).then(function (responses) {
      var template = responses[0];
      var dialogOptions = {
        removeOnClose: true,
        scrollY: false,
        autoFocus: false
      };
      if (_layoutmanager.default.tv) {
        dialogOptions.size = 'fullscreen';
      } else {
        dialogOptions.size = 'fullscreen-border';
      }
      var dlg = _dialoghelper.default.createDialog(dialogOptions);
      instance.dlg = dlg;
      dlg.classList.add('formDialog');
      var html = '';
      html += _globalize.default.translateDocument(template, 'sharedcomponents');
      dlg.innerHTML = html;
      if (item.Path) {
        dlg.querySelector('.itemPathContainer').classList.remove('hide');
      } else {
        dlg.querySelector('.itemPathContainer').classList.add('hide');
      }
      dlg.querySelector('.itemPath').innerHTML = item.Path || '';
      dlg.querySelector('.popupIdentifyForm').addEventListener('submit', instance.onIdentifyFormSubmit.bind(instance));
      dlg.querySelector('.identifyOptionsForm').addEventListener('submit', instance.onResultConfirmed.bind(instance));
      dlg.classList.add('identifyDialog');
      if (item.Id) {
        showIdentificationForm(dlg, item);
      } else {
        showIdentificationFormFindNew(dlg, item);
      }
      var itemsContainer = dlg.querySelector('.itemsContainer');
      if (enableListViewResults(item)) {
        itemsContainer.classList.remove('vertical-wrap');
        itemsContainer.classList.add('vertical-list');
        dlg.querySelector('.sectionTitle-cards').classList.remove('sectionTitle-cards');
      }
      itemsContainer.addEventListener('action-null', onCardAction.bind(instance));
      itemsContainer.fetchData = instance.getItems.bind(instance);
      itemsContainer.afterRefresh = instance.afterRefresh.bind(instance);
      itemsContainer.getListOptions = instance.getListOptions.bind(instance);
      instance.itemsContainer = itemsContainer;
      dlg.addEventListener('opened', onOpened.bind(instance));
      var dlgClosedFn = onDialogClosed.bind(instance);
      return _dialoghelper.default.open(dlg).then(dlgClosedFn, dlgClosedFn);
    });
  };
  ItemIdentifier.prototype.onIdentifyFormSubmit = function (e) {
    e.preventDefault();
    e.stopPropagation();
    var dlg = this.dlg;
    if (dlg) {
      dlg.querySelector('.popupIdentifyForm').classList.add('hide');
      dlg.querySelector('.identificationSearchResults').classList.remove('hide');
      dlg.querySelector('.identifyOptionsForm').classList.add('hide');
    }
    var itemsContainer = this.itemsContainer;
    if (itemsContainer) {
      itemsContainer.refreshItems().then(autoFocus.bind(this));
    }
    return false;
  };
  ItemIdentifier.prototype.onResultConfirmed = function (e) {
    e.preventDefault();
    e.stopPropagation();
    var dlg = this.dlg;
    if (dlg) {
      _loading.default.show();
      var apiClient = _connectionmanager.default.getApiClient(this.options.item);
      var instance = this;
      apiClient.applyRemoteSearchResult(this.options.item.Id, instance.currentSearchResult, {
        ReplaceAllImages: dlg.querySelector('.chkIdentifyReplaceImages').checked
      }).then(function () {
        showToast(_globalize.default.translate('RefreshingMetadataDots'));
        instance.hasChanges = true;
        _loading.default.hide();
        _dialoghelper.default.close(dlg);
      }, function () {
        _loading.default.hide();
      });
    }
    return false;
  };
  ItemIdentifier.prototype.closeDialog = function () {
    var dlg = this.dlg;
    if (dlg) {
      _dialoghelper.default.close(dlg);
    }
  };
  ItemIdentifier.prototype.cleanup = function () {
    this.options = null;
    this.dlg = null;
    this.itemsContainer = null;
  };
  function mapToId(item) {
    return item.Id;
  }
  var _default = _exports.default = {
    show: function (item) {
      return new ItemIdentifier({
        item: item
      }).show();
    },
    showFindNew: function (itemName, itemYear, itemType, serverId) {
      return new ItemIdentifier({
        item: {
          Name: itemName,
          ProductionYear: itemYear,
          Type: itemType,
          ServerId: serverId
        }
      }).show();
    },
    resetMetadata: function (items) {
      (0, _confirm.default)({
        title: _globalize.default.translate('HeaderRemoveIdentification'),
        text: _globalize.default.translate('ResetMetadataConfirmation'),
        confirmText: _globalize.default.translate('HeaderRemoveIdentification'),
        primaryButton: 'cancel'
      }).then(function () {
        var apiClient = _connectionmanager.default.getApiClient(items[0]);
        var options = {
          ItemIds: items.map(mapToId).join(',')
        };
        _loading.default.show();
        return apiClient.resetMetadata(options).then(function (result) {
          _loading.default.hide();
          return Promise.resolve(result);
        }, function (err) {
          _loading.default.hide();
          return Promise.reject(err);
        });
      });
    }
  };
});
