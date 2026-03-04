define(["exports", "./../emby-apiclient/connectionmanager.js", "./../common/globalize.js", "./../layoutmanager.js", "./../loading/loading.js", "./../dialoghelper/dialoghelper.js", "./../emby-elements/emby-button/paper-icon-button-light.js", "./../emby-elements/emby-button/emby-button.js", "./../emby-elements/emby-scroller/emby-scroller.js", "./../emby-elements/emby-itemscontainer/emby-itemscontainer.js", "./../emby-elements/emby-dialogclosebutton/emby-dialogclosebutton.js", "./../common/input/api.js", "./../emby-apiclient/events.js", "./../common/servicelocator.js", "./../listview/listview.js", "./../dom.js"], function (_exports, _connectionmanager, _globalize, _layoutmanager, _loading, _dialoghelper, _paperIconButtonLight, _embyButton, _embyScroller, _embyItemscontainer, _embyDialogclosebutton, _api, _events, _servicelocator, _listview, _dom) {
  Object.defineProperty(_exports, "__esModule", {
    value: true
  });
  _exports.default = void 0;
  /* jshint module: true */

  function syncNow() {
    require(['localsync'], function (localSync) {
      localSync.sync();
    });
  }
  function renderJob(context, apiClient, job, dialogOptions, originalOptions) {
    Emby.importModule('./modules/sync/sync.js').then(function (syncDialog) {
      syncDialog.renderForm({
        elem: context.querySelector('.syncJobFormContent'),
        dialogOptions: dialogOptions,
        dialogOptionsFn: getTargetDialogOptionsFn(dialogOptions),
        readOnlySyncTarget: true,
        mode: originalOptions.mode,
        apiClient: apiClient
      }).then(function () {
        fillJobValues(context, job, dialogOptions);
      });
    });
  }
  function getTargetDialogOptionsFn(dialogOptions) {
    return function (targetId) {
      return Promise.resolve(dialogOptions);
    };
  }
  function triggerChange(select) {
    select.dispatchEvent(new CustomEvent('change', {
      bubbles: true
    }));
  }
  function fillJobValues(context, job, editOptions) {
    var selectProfile = context.querySelector('.selectProfile');
    if (selectProfile) {
      selectProfile.value = job.Profile || '';
      triggerChange(selectProfile);
    }
    var selectQuality = context.querySelector('.selectQuality');
    if (selectQuality) {
      selectQuality.value = job.Quality || '';
      triggerChange(selectQuality);
    }
    var selectContainer = context.querySelector('.selectJobContainer');
    if (selectContainer) {
      selectContainer.value = job.Container || '';
      triggerChange(selectContainer);
    }
    var selectVideoCodec = context.querySelector('.selectVideoCodec');
    if (selectVideoCodec) {
      selectVideoCodec.value = job.VideoCodec || '';
      triggerChange(selectVideoCodec);
    }
    var selectAudioCodec = context.querySelector('.selectAudioCodec');
    if (selectAudioCodec) {
      selectAudioCodec.value = job.AudioCodec || '';
      triggerChange(selectAudioCodec);
    }
    var chkUnwatchedOnly = context.querySelector('.chkUnwatchedOnly');
    if (chkUnwatchedOnly) {
      chkUnwatchedOnly.checked = job.UnwatchedOnly;
    }
    var chkSyncNewContent = context.querySelector('.chkSyncNewContent');
    if (chkSyncNewContent) {
      chkSyncNewContent.checked = job.SyncNewContent;
    }
    var txtItemLimit = context.querySelector('.txtItemLimit');
    if (txtItemLimit) {
      txtItemLimit.value = job.ItemLimit;
    }
    var txtBitrate = context.querySelector('.txtBitrate');
    if (job.Bitrate) {
      txtBitrate.value = job.Bitrate / 1000000;
    } else {
      txtBitrate.value = '';
    }
    var target = editOptions.Targets.filter(function (t) {
      return t.Id === job.TargetId;
    })[0];
    var targetName = target ? target.Name : '';
    var selectSyncTarget = context.querySelector('.selectSyncTarget');
    if (selectSyncTarget) {
      selectSyncTarget.value = targetName;
    }
  }
  function loadJob(context, id, apiClient, originalOptions) {
    _loading.default.show();
    apiClient.getJSON(apiClient.getUrl('Sync/Jobs/' + id)).then(function (job) {
      return apiClient.getJSON(apiClient.getUrl('Sync/Options', {
        UserId: job.UserId,
        ItemIds: job.RequestedItemIds && job.RequestedItemIds.length ? job.RequestedItemIds.join('') : null,
        ParentId: job.ParentId,
        Category: job.Category,
        TargetId: job.TargetId
      })).then(function (options) {
        renderJob(context, apiClient, job, options, originalOptions);
        _loading.default.hide();
      });
    }, function (error) {
      // typically this happens when the job no longer exists
      _loading.default.hide();
      _dialoghelper.default.close(context);
    });
  }
  function saveJob(context, id, apiClient) {
    _loading.default.show();
    apiClient.getJSON(apiClient.getUrl('Sync/Jobs/' + id)).then(function (job) {
      Emby.importModule('./modules/sync/sync.js').then(function (syncDialog) {
        syncDialog.setJobValues(job, context);
        apiClient.ajax({
          url: apiClient.getUrl('Sync/Jobs/' + id),
          type: 'POST',
          data: JSON.stringify(job),
          contentType: "application/json"
        }).then(function () {
          // TODO this should check editor options.mode === 'download'
          if (_servicelocator.appHost.supports('sync')) {
            syncNow();
          }
          _loading.default.hide();
          _dialoghelper.default.close(context);
        });
      });
    }, function (error) {
      // typically this happens when the job no longer exists
      _loading.default.hide();
      _dialoghelper.default.close(context);
    });
  }
  function onItemsContainerUpgraded() {
    this.resume({
      refresh: true
    });
  }
  function onOpened() {
    var itemsContainer = this.querySelector('.jobItems');
    if (itemsContainer.resume) {
      onItemsContainerUpgraded.call(itemsContainer);
    } else {
      _dom.default.addEventListener(itemsContainer, 'upgraded', onItemsContainerUpgraded.bind(this), {
        once: true
      });
    }
  }
  function getListViewOptions(items) {
    var fields = ['Name', 'SyncJobItemStatus'];
    var options = {
      enableDefaultIcon: true,
      action: 'none',
      fields: fields,
      draggable: false,
      multiSelect: false,
      contextMenu: true,
      hoverPlayButton: false,
      draggableXActions: false,
      imageSize: 'small',
      enableUserDataButtons: false,
      mediaInfo: false,
      playQueueIndicator: false
    };
    return options;
  }
  function getListOptions(items) {
    return {
      renderer: _listview.default,
      options: getListViewOptions(items),
      virtualScrollLayout: 'vertical-list'
    };
  }
  function getItems(query) {
    var options = this;
    var id = options.id;
    var apiClient = options.apiClient;
    var serverId = apiClient.serverId();
    var mode = options.mode;
    return apiClient.getJSON(apiClient.getUrl('Sync/JobItems', Object.assign(query, {
      JobId: id,
      AddMetadata: true
    }))).then(function (result) {
      var items = result.Items;
      for (var i = 0, length = items.length; i < length; i++) {
        var item = items[i];
        item.Type = 'SyncJobItem';
        item.ServerId = serverId;
        if (mode === 'convert') {
          item.SyncJobType = 'Convert';
        }
      }
      return result;
    });
  }
  function showEditor(options) {
    var apiClient = _connectionmanager.default.getApiClient(options.serverId);
    var id = options.jobId;
    var dlgElementOptions = {
      removeOnClose: true,
      scrollY: false,
      autoFocus: false
    };
    if (_layoutmanager.default.tv) {
      dlgElementOptions.size = 'fullscreen';
    } else {
      dlgElementOptions.size = 'medium';
    }
    var dlg = _dialoghelper.default.createDialog(dlgElementOptions);
    dlg.classList.add('formDialog');
    var html = '';
    html += '<div class="formDialogHeader">';
    html += '<button type="button" is="emby-dialogclosebutton"></button>';
    html += '<h3 class="formDialogHeaderTitle">';
    html += options.mode === 'convert' ? _globalize.default.translate('Convert') : _globalize.default.translate('Download');
    html += '</h3>';
    if (_servicelocator.appHost.supports('externallinks')) {
      html += '<a href="https://support.emby.media/support/solutions/articles/44001162174-sync" target="_blank" is="emby-linkbutton" class="paper-icon-button-light noautofocus btnHelp flex align-items-center dialogHeaderButton button-help"><i class="md-icon">&#xe887;</i></a>';
    }
    html += '</div>';
    html += '<div is="emby-scroller" data-horizontal="false" data-forcescrollbar="true" data-focusscroll="true" class="formDialogContent">';
    html += '<div class="scrollSlider">';
    html += '<form class="dialogContentInner dialog-content-centered syncJobForm padded-left padded-right">';
    html += '<div class="syncJobFormContent"></div>';
    html += '<div class="jobItems" is="emby-itemscontainer" data-monitor="SyncJobItems" data-virtualscrolllayout="vertical-grid"></div>';
    html += '<div class="formDialogFooter">';
    html += '<button is="emby-button" type="submit" class="raised button-submit block formDialogFooterItem"><span>' + _globalize.default.translate('Save') + '</span></button>';
    html += '</div>';
    html += '</form>';
    html += '</div>';
    html += '</div>';
    dlg.innerHTML = html;
    var submitted = false;
    dlg.querySelector('form').addEventListener('submit', function (e) {
      saveJob(dlg, id, apiClient);
      e.preventDefault();
      return false;
    });
    var itemsContainer = dlg.querySelector('.jobItems');
    //itemsContainer.addEventListener('action-null', onItemAction.bind(this));
    itemsContainer.fetchData = getItems.bind({
      apiClient: apiClient,
      id: id,
      mode: options.mode
    });
    itemsContainer.getListOptions = getListOptions.bind(this);
    function onSyncJobMessage(e, apiClient, job) {
      if (String(job.Id) === id) {
        itemsContainer.refreshItems();
      }
    }
    loadJob(dlg, id, apiClient, options);
    dlg.addEventListener('opened', onOpened);
    var promise = _dialoghelper.default.open(dlg);

    ////startListening(apiClient, id);
    _events.default.on(_api.default, 'SyncJobUpdated', onSyncJobMessage);
    return promise.then(function () {
      ////stopListening(apiClient);
      _events.default.off(_api.default, 'SyncJobUpdated', onSyncJobMessage);
      if (submitted) {
        return Promise.resolve();
      }
      return Promise.reject();
    });
  }
  var _default = _exports.default = {
    show: showEditor
  };
});
