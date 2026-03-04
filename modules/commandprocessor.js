define(["exports", "./dom.js", "./common/globalize.js", "./loading/loading.js", "./approuter.js", "./common/playback/playbackmanager.js", "./common/playback/playbackactions.js", "./emby-apiclient/connectionmanager.js", "./common/itemmanager/itemmanager.js", "./common/imagehelper.js", "./common/datetime.js", "./common/responsehelper.js", "./common/servicelocator.js"], function (_exports, _dom, _globalize, _loading, _approuter, _playbackmanager, _playbackactions, _connectionmanager, _itemmanager, _imagehelper, _datetime, _responsehelper, _servicelocator) {
  Object.defineProperty(_exports, "__esModule", {
    value: true
  });
  _exports.default = void 0;
  /* jshint module: true */

  function showPrompt(options) {
    return Emby.importModule('./modules/prompt/prompt.js').then(function (prompt) {
      return prompt(options);
    });
  }
  function showAlert(options) {
    return Emby.importModule('./modules/common/dialogs/alert.js').then(function (alert) {
      return alert(options);
    });
  }
  function openUrlWithShell(url) {
    _servicelocator.shell.openUrl(url);
    return Promise.resolve();
  }
  function showAlertAndResolve(options) {
    return showAlert(options).catch(function () {
      return Promise.resolve();
    });
  }
  function showConfirm(options) {
    return Emby.importModule('./modules/common/dialogs/confirm.js').then(function (confirm) {
      return confirm(options);
    });
  }
  function downloadFiles(urls) {
    return Emby.importModule('./modules/multidownload.js').then(function (multiDownload) {
      multiDownload(urls);
    });
  }
  function downloadRemoteSubtitle(item, options, apiClient) {
    _loading.default.show();
    return apiClient.downloadSubtitles(item.ItemId, item.MediaSourceId, item.Id).then(function (result) {
      _loading.default.hide();
      showToast(_globalize.default.translate('SubtitlesDownloaded'));
      return result;
    });
  }
  function downloadAppLog(item) {
    return _servicelocator.appLogger.downloadLog(item.Name);
  }
  function downloadItems(items, options) {
    var apiClient = _connectionmanager.default.getApiClient(items[0]);
    if (!options) {
      options = {};
    }
    if (items[0].Type === 'RemoteSubtitle') {
      return downloadRemoteSubtitle(items[0], options, apiClient);
    }
    var downloadUrls = [];
    for (var i = 0, length = items.length; i < length; i++) {
      var item = items[i];
      if (item.Type === 'Log') {
        if (item.ServerId) {
          downloadUrls.push(apiClient.getLogDownloadUrl({
            Name: item.Name,
            Sanitize: options.Sanitize !== false,
            SetFilename: true
          }));
        } else {
          downloadAppLog(item);
        }
        continue;
      }
      if (item.Type === 'MediaStream' && item.StreamType === 'Subtitle') {
        var url = 'Videos/' + item.ItemId + '/' + item.MediaSourceId + '/Subtitles/' + item.Index + '/Stream.' + item.Codec;
        downloadUrls.push(apiClient.getUrl(url, {
          SetFilename: true
        }));
        continue;
      }
      var mediaSourceId = options.mediaSourceId;
      var downloadHref = apiClient.getItemDownloadUrl(item.Id, mediaSourceId);
      downloadUrls.push(downloadHref);
    }
    return downloadFiles(downloadUrls);
  }
  function resetMetadata(items, options) {
    return Emby.importModule('./modules/itemidentifier/itemidentifier.js').then(function (itemIdentifier) {
      //return itemIdentifier.showFindNew(item.Name, item.ProductionYear, item.Type, item.ServerId);
      return itemIdentifier.resetMetadata(items);
    });
  }
  function identifyItem(item) {
    return Emby.importModule('./modules/itemidentifier/itemidentifier.js').then(function (itemIdentifier) {
      //return itemIdentifier.showFindNew(item.Name, item.ProductionYear, item.Type, item.ServerId);
      return itemIdentifier.show(item);
    });
  }
  function previewItem(item) {
    var apiClient = _connectionmanager.default.getApiClient(item);
    var url;
    if (item.Type === 'RemoteSubtitle') {
      url = apiClient.getUrl('Providers/Subtitles/Subtitles/' + item.Id);
    } else if (item.Type === 'ItemImage') {
      var _imageHelper$getImage;
      url = (_imageHelper$getImage = _imagehelper.default.getImageUrl(item, apiClient, {})) == null ? void 0 : _imageHelper$getImage.imgUrl;
      return openUrlWithShell(url);
    } else {
      url = apiClient.getUrl('Videos/' + item.ItemId + '/' + item.MediaSourceId + '/Subtitles/' + item.Index + '/Stream.' + item.Codec);
    }
    return apiClient.getText(url).then(function (result) {
      return showAlertAndResolve({
        preFormattedText: _dom.default.stripScripts(result),
        formatText: false,
        confirmButton: false,
        title: _globalize.default.translate('Subtitles'),
        item: item
      });
    });
  }
  function removeFromResume(items, options, mode) {
    var item = items[0];
    var confirmHeader = item.MediaType === 'Audio' ? _globalize.default.translate('HeaderRemoveFromContinueListening') : _globalize.default.translate('HeaderRemoveFromContinueWatching');
    var apiClient = _connectionmanager.default.getApiClient(item);
    var msg = item.MediaType === 'Audio' ? _globalize.default.translate('RemoveThisTitleFromContinueListening') : _globalize.default.translate('RemoveThisTitleFromContinueWatching');
    return showConfirm({
      title: confirmHeader,
      text: msg,
      confirmText: _globalize.default.translate('Remove'),
      primary: 'cancel'
    }).then(function () {
      return apiClient.updateHideFromResume(items.map(mapToId), true);
    });
  }
  function mapToId(i) {
    return i.Id;
  }
  function markPlayed(items, options) {
    var apiClient = _connectionmanager.default.getApiClient(items[0]);
    return apiClient.markPlayed(apiClient.getCurrentUserId(), items.map(mapToId));
  }
  function markUnplayed(items, options) {
    var apiClient = _connectionmanager.default.getApiClient(items[0]);
    return apiClient.markUnplayed(apiClient.getCurrentUserId(), items.map(mapToId));
  }
  function markFavorite(items, isFavorite) {
    var apiClient = _connectionmanager.default.getApiClient(items[0]);
    return apiClient.updateFavoriteStatus(apiClient.getCurrentUserId(), items.map(mapToId), isFavorite).then(function () {
      if (isFavorite) {
        showToast({
          text: _globalize.default.translate('Favorited'),
          icon: '&#xe87D;'
        });
      } else {
        showToast({
          text: _globalize.default.translate('Unfavorited'),
          icon: '&#xe87D;',
          iconStrikeThrough: true
        });
      }
    });
  }
  function playTrailer(item) {
    var apiClient = _connectionmanager.default.getApiClient(item);
    return apiClient.getLocalTrailers(apiClient.getCurrentUserId(), item.Id).then(function (trailers) {
      _playbackmanager.default.play({
        items: trailers
      });
    });
  }
  function connectToServer(item) {
    if (item.Type === 'AddServer' || item.Type === 'Downloads') {
      return _approuter.default.showItem(item);
    }
    if (item.Type === 'EmbyConnect') {
      return _approuter.default.showConnectLogin();
    }
    _loading.default.show();

    // get the full object
    item = _connectionmanager.default.getServerInfo(item.Id) || item;
    return _connectionmanager.default.connectToServer(item, {}).then(function (result) {
      return _approuter.default.handleConnectionResult(result);
    });
  }
  function showMultiSelect(item, options) {
    var itemsContainer = options.positionTo.closest('.itemsContainer');
    itemsContainer.showMultiSelect(options.positionTo, true);
    return Promise.resolve();
  }
  function afterWakeAttempt() {
    var apiClient = this;
    return setTimeoutPromise(12000).then(function () {
      return apiClient.getPublicSystemInfo();
    });
  }
  function wakeServer(apiClient, item) {
    return Emby.importModule('./modules/loadingdialog/loadingdialog.js').then(function (LoadingDialog) {
      var dlg = new LoadingDialog({
        title: _globalize.default.translate('HeaderWakeServer'),
        text: _globalize.default.translate('AttemptingWakeServer')
      });
      var showDialogPromise = dlg.show();
      var state = {
        dlg: dlg,
        showDialogPromise: showDialogPromise
      };
      var afterWol = afterWakeAttempt.bind(apiClient);
      return apiClient.wakeOnLan().then(afterWol, afterWol).then(onWolSuccess.bind(state), onWolFail.bind(state));
    });
  }
  function setTimeoutPromise(timeMs) {
    return new Promise(function (resolve, reject) {
      setTimeout(resolve, timeMs);
    });
  }
  function onWolSuccess() {
    var state = this;
    var promise = state.showDialogPromise.then(function () {
      return showAlertAndResolve({
        text: _globalize.default.translate('WakeServerSuccess'),
        title: _globalize.default.translate('HeaderWakeServer')
      });
    });
    var dlg = state.dlg;
    dlg.hide();
    dlg.destroy();
    return promise;
  }
  function onWolFail() {
    var state = this;
    var promise = state.showDialogPromise.then(function () {
      return showAlertAndResolve({
        text: _globalize.default.translate('WakeServerError'),
        title: _globalize.default.translate('HeaderWakeServer')
      });
    });
    var dlg = state.dlg;
    dlg.hide();
    dlg.destroy();
    return promise;
  }
  var QueueQueryLimit = 5000;
  function playAllFromHereFoldersContext(item, startIndex, queue, itemsContainer, autoAdvancePhotos) {
    var query = {};
    query.StartItemId = item.Id;
    query.Recursive = true;
    query.IsFolder = false;
    query.Limit = 0;
    return itemsContainer.fetchData(query).then(function (result) {
      if (typeof result.TotalRecordCount === 'undefined') {
        // latest items doesn't support TotalRecordCount
        return playAllFromHereFallback1(itemsContainer, startIndex, queue, autoAdvancePhotos);
      }
      var itemStartIndex = result.TotalRecordCount;
      query.StartIndex = 0;
      query.Limit = QueueQueryLimit + itemStartIndex;
      query.StartItemId = null;
      return itemsContainer.fetchData(query).then(function (result) {
        // check itemStartIndex in case it's at the very end, to avoid playing an empty list
        var startIndex = itemStartIndex ? Math.max(result.TotalRecordCount - itemStartIndex, 0) : 0;
        if (queue) {
          return _playbackmanager.default.queue({
            items: (result.Items || result).slice(startIndex)
          });
        }
        return _playbackactions.default.play({
          items: result.Items || result,
          startIndex: startIndex
        });
      });
    });
  }
  function playAllFromHereFallback1(itemsContainer, startIndex, queue, autoAdvancePhotos) {
    var limit = QueueQueryLimit;
    if (!queue) {
      limit += startIndex || 0;
    }
    var fetchAll = !queue && startIndex < limit;
    var query = fetchAll ? {
      Limit: limit
    } : {
      StartIndex: startIndex,
      Limit: limit
    };
    return itemsContainer.fetchData(query).then(function (result) {
      if (queue) {
        return _playbackmanager.default.queue({
          items: result.Items || result
        });
      } else {
        return _playbackactions.default.play({
          items: result.Items || result,
          startIndex: fetchAll ? startIndex : null,
          autoplay: autoAdvancePhotos
        });
      }
    });
  }
  function playAllFromHereFallback2(itemElement, startIndex, serverId, queue) {
    var parent = itemElement.parentNode;
    var className = itemElement.classList.length ? '.' + itemElement.classList[0] : '';
    var cards = parent.querySelectorAll(className + '[data-id]');
    var ids = [];
    var foundCard = false;
    for (var i = 0, length = cards.length; i < length; i++) {
      if (cards[i] === itemElement) {
        foundCard = true;
        startIndex = i;
      }
      if (foundCard || !queue) {
        ids.push(cards[i].getAttribute('data-id'));
      }
    }
    if (!ids.length) {
      return;
    }
    if (queue) {
      return _playbackmanager.default.queue({
        ids: ids,
        serverId: serverId
      });
    } else {
      return _playbackactions.default.play({
        ids: ids,
        serverId: serverId,
        startIndex: startIndex
      });
    }
  }
  function playAllFromHere(itemElement, serverId, queue, autoAdvancePhotos) {
    var itemsContainer = itemElement.closest('.itemsContainer');
    var startIndex = itemsContainer.indexOfElement(itemElement);
    if (itemsContainer && itemsContainer.fetchData) {
      var monitor = itemsContainer.getAttribute('data-monitor');
      var currentListOptions = itemsContainer.currentListOptions;
      if ((currentListOptions == null ? void 0 : currentListOptions.options.context) === 'folders' || currentListOptions != null && currentListOptions.indexOnStartItemId || // little hack, but these need to sort on StartItemId because the contents of the data on the server could change after they click on it to start playing
      // unfortunately this will only cover fixed lists and not lists where the user could set the sorting to date played
      // perhaps playallfromhere should always use StartItemId instead of StartIndex, but that will need to be researched for side effects
      monitor != null && monitor.includes('playback') || monitor != null && monitor.includes('played')) {
        var _connectionManager$ge;
        var item = itemsContainer.getItemFromElement(itemElement);
        if (item && (_connectionManager$ge = _connectionmanager.default.getApiClient(item)) != null && _connectionManager$ge.isMinServerVersion('4.8.0.59')) {
          return playAllFromHereFoldersContext(item, startIndex, queue, itemsContainer, serverId, autoAdvancePhotos);
        }
      }
      return playAllFromHereFallback1(itemsContainer, startIndex, queue, autoAdvancePhotos);
    }
    return playAllFromHereFallback2(itemElement, startIndex, serverId, queue);
  }
  function showToast(options) {
    return Emby.importModule('./modules/toast/toast.js').then(function (toast) {
      return toast(options);
    });
  }
  function notifyAddedToPlayQueue() {
    showToast({
      text: _globalize.default.translate('HeaderAddedToPlayQueue'),
      icon: '&#xe03b;'
    });
    return Promise.resolve();
  }
  function notifyPlayingNext() {
    showToast({
      text: _globalize.default.translate('HeaderPlayingNext'),
      icon: '&#xe03b;'
    });
    return Promise.resolve();
  }
  function play(items, resume, queue, queueNext, shuffle, parentId) {
    var method = queue ? queueNext ? 'queueNext' : 'queue' : 'play';
    var item = items[0];
    var options = {
      startPositionTicks: resume === false ? 0 : item.StartPositionTicks,
      parentId: parentId
    };
    options.items = items;
    options.autoplay = items.length > 1;
    if (shuffle) {
      options.shuffle = true;
    }
    var promise;
    if (method === 'play') {
      promise = _playbackactions.default[method](options);
    } else {
      promise = _playbackmanager.default[method](options);
    }
    if (queueNext) {
      promise = promise.then(notifyPlayingNext);
    } else if (queue) {
      promise = promise.then(notifyAddedToPlayQueue);
    }
    return promise;
  }
  function sendMessageToSession(item, options) {
    return showPrompt({
      title: _globalize.default.translate('HeaderSendMessage'),
      label: _globalize.default.translate('LabelMessageText'),
      //description: '',
      confirmText: _globalize.default.translate('ButtonSend')
    }).then(function (text) {
      if (text) {
        var apiClient = _connectionmanager.default.getApiClient(item);
        return apiClient.sendMessageCommand(item.Id, {
          Text: text,
          //Header: '',
          TimeoutMs: 5000
        });
      }
      return Promise.reject();
    });
  }
  function seekToPosition(item, options) {
    // handle untimed lyrics
    if (item.Type === 'LyricsLine') {
      if (item.StartPositionTicks == null) {
        return Promise.resolve();
      }
    }
    return _playbackmanager.default.seek(item.StartPositionTicks || 0);
  }
  function showItem(item, options) {
    if (options) {
      if (!options.parentId) {
        if (options.itemElement || options.positionTo) {
          var itemsContainer = options.itemsContainer || (options.itemElement || options.positionTo).closest('.itemsContainer');
          if (itemsContainer) {
            options.parentId = itemsContainer.getAttribute('data-parentid') || null;
          }
        }
      }
    }
    return _approuter.default.showItem(item, options);
  }
  function editItems(items, options) {
    var _options$itemsContain;
    var item = items[0];
    if (item.Type === 'Device' || item.Type === 'User' || item.Type === 'ActiveSession' || item.Type === 'SeriesTimer' || item.Type === 'Timer' || item.Type === 'LiveTVTunerDevice' || item.Type === 'LiveTVGuideSource') {
      return showItem(item, options);
    }
    if ((_options$itemsContain = options.itemsContainer) != null && (_options$itemsContain = _options$itemsContain.currentListOptions) != null && (_options$itemsContain = _options$itemsContain.options.commandActions) != null && _options$itemsContain.edit) {
      return options.itemsContainer.currentListOptions.options.commandActions.edit(items, options).then(function (result) {
        if ((result == null ? void 0 : result.refreshItems) !== false) {
          options.itemsContainer.notifyRefreshNeeded(true);
        }
      });
    }
    return _itemmanager.default.editItems(items, options);
  }
  function searchImageProviders(item, options) {
    return Emby.importModule('./modules/imagedownloader/imagedownloader.js').then(function (ImageDownloader) {
      return new ImageDownloader().show({
        item: item.OwnerItem,
        imageType: item.ImageType,
        imageIndex: item.ImageIndex
      });
    });
  }
  function showImageUploader(item, options) {
    return Emby.importModule('./modules/imageuploader/imageuploader.js').then(function (imageUploader) {
      return imageUploader.show({
        imageType: item.ImageType,
        imageIndex: item.ImageIndex,
        item: item.OwnerItem
      });
    });
  }
  function moveImages(items, options, newIndex) {
    var item = items[0];
    var apiClient = _connectionmanager.default.getApiClient(item);
    return apiClient.updateItemImageIndex(item.ItemId, item.ImageType, item.ImageIndex, newIndex);
  }
  function moveChannels(items, options, newIndex) {
    var item = items[0];
    var apiClient = _connectionmanager.default.getApiClient(item);
    return apiClient.setChannelSortIndex(item, newIndex);
  }
  function movePlaylistItems(items, newIndex, playlistId) {
    var item = items[0];
    var apiClient = _connectionmanager.default.getApiClient(item);
    return apiClient.moveItemsInPlaylist(playlistId, items, newIndex);
  }
  function executeMoveInOrder(items, options, moveOptions) {
    var _options$itemsContain2;
    if ((_options$itemsContain2 = options.itemsContainer) != null && (_options$itemsContain2 = _options$itemsContain2.currentListOptions) != null && (_options$itemsContain2 = _options$itemsContain2.options.commandActions) != null && _options$itemsContain2.moveInOrder) {
      return options.itemsContainer.currentListOptions.options.commandActions.moveInOrder(items, moveOptions).then(function (result) {
        if ((result == null ? void 0 : result.refreshItems) !== false) {
          options.itemsContainer.notifyRefreshNeeded(true);
        }
      });
    }
    return _itemmanager.default.moveInOrder(items, moveOptions);
  }
  function moveInOrder(items, options, newIndex) {
    var item = items[0];
    var itemType = item == null ? void 0 : item.Type;
    switch (itemType) {
      case 'ChannelManagementInfo':
        return moveChannels(items, options, newIndex);
      case 'ItemImage':
        return moveImages(items, options, newIndex);
      default:
        if (item.PlaylistId) {
          return movePlaylistItems(items, newIndex, item.PlaylistId);
        }
        var currentIndex = options.itemsContainer.indexOfItem(item);
        var moveOptions = {
          currentIndex: currentIndex,
          newIndex: newIndex,
          itemsContainer: options.itemsContainer
        };
        return executeMoveInOrder(items, options, moveOptions);
    }
  }
  function moveByOffsetInOrder(items, options, moveOffset) {
    var item = items[0];
    var itemType = item == null ? void 0 : item.Type;
    switch (itemType) {
      case 'ChannelManagementInfo':
        return moveInOrder(items, options, item.SortIndexNumber + moveOffset);
      default:
        var currentIndex = options.itemsContainer.indexOfItem(item);
        return moveInOrder(items, options, currentIndex + moveOffset);
    }
  }
  function addImageFromUrl(item, options) {
    return showPrompt({
      title: _globalize.default.translate(item.ImageTag ? 'HeaderSetImageFromUrl' : 'HeaderAddImageFromUrl'),
      label: _globalize.default.translate('LabelUrl')
    }).then(function (url) {
      var apiClient = _connectionmanager.default.getApiClient(item);
      return apiClient.updateItemImageFromUrl(item.ItemId, item.ImageType, item.ImageIndex, url);
    });
  }
  function createRecordingForChannel(item, options) {
    return Emby.importModule('./modules/recordingcreator/channelrecordingcreator.js').then(function (channelRecordingCreator) {
      return channelRecordingCreator.createRecordingForChannel(item, options);
    });
  }
  function onRecordCommand(item, options) {
    var type = item.Type;
    var id = item.Id;
    var serverId = item.ServerId;
    var timerId = type === 'Timer' ? item.Id : item.TimerId;
    var seriesTimerId = item.SeriesTimerId;
    var programId = type === 'Program' ? id : item.ProgramId;
    var status = item.Status;
    if (programId || timerId || seriesTimerId) {
      return Emby.importModule('./modules/common/recordinghelper.js').then(function (recordingHelper) {
        var programId = type === 'Program' ? id : null;
        return recordingHelper.toggleRecording(serverId, programId, timerId, status, seriesTimerId);
      });
    }
    return Promise.resolve();
  }
  function record(item, options) {
    if (item.Type === 'TvChannel') {
      return createRecordingForChannel(item, options);
    }
    return onRecordCommand(item, options);
  }
  function getMediaSource(mediaSources, mediaSourceId) {
    for (var i = 0, length = mediaSources.length; i < length; i++) {
      if (mediaSources[i].Id === mediaSourceId) {
        return mediaSources[i];
      }
    }
    return mediaSources[0];
  }
  function editSubtitles(item, options) {
    return Emby.importModule('./modules/subtitleeditor/subtitleeditor.js').then(function (SubtitleEditor) {
      return SubtitleEditor.show({
        item: item,
        mediaSource: getMediaSource(item.MediaSources, options.mediaSourceId)
      });
    });
  }
  function shareFileViaWeb(item, options, title, text, url, filename, mimeType) {
    return fetch(url, {
      credentials: 'same-origin'
    }).then(function (r) {
      return r.blob();
    }).then(function (blob) {
      var file = new File([blob], filename, {
        type: mimeType
      });
      return navigator.share({
        files: [file],
        title: title
      });
    });
  }
  function shareItems(items, options) {
    var item = items[0];
    var shareTitle = _itemmanager.default.getDisplayName(item);
    var shareText = shareTitle;
    if (item.Overview) {
      shareText += ' - ' + item.Overview;
    }
    var apiClient = _connectionmanager.default.getApiClient(item);
    var shareUrl;
    if (item.Type === 'Photo') {
      var _item$ImageTags;
      shareUrl = apiClient.getImageUrl(item.Id, {
        type: 'Primary',
        tag: (_item$ImageTags = item.ImageTags) == null ? void 0 : _item$ImageTags.Primary,
        format: 'png'
      });
      if (globalThis.appMode !== 'android' && globalThis.appMode !== 'ios') {
        return shareFileViaWeb(item, options, shareTitle, shareText, shareUrl, 'image.png', 'image/png');
      }
    } else if (item.Type === 'Log') {
      if (item.ServerId) {
        if (globalThis.appMode !== 'android' && globalThis.appMode !== 'ios') {
          shareUrl = apiClient.getLogDownloadUrl({
            Name: item.Name,
            Sanitize: options.Sanitize,
            SetFilename: true
          });
          return shareFileViaWeb(item, options, shareTitle, shareText, shareUrl, item.Name, 'text/plain');
        }
      } else {
        return _servicelocator.appLogger.shareLog(item);
      }
    } else {
      var _apiClient$serverInfo;
      var serverAddress = (_apiClient$serverInfo = apiClient.serverInfo()) == null ? void 0 : _apiClient$serverInfo.RemoteAddress;
      shareUrl = apiClient.getUrl('share', {}, serverAddress).replace('/share', '');
    }
    return navigator.share({
      title: shareTitle,
      text: shareText,
      url: shareUrl
    });
  }
  function convertMedia(items, options) {
    return Emby.importModule('./modules/sync/sync.js').then(function (syncDialog) {
      return syncDialog.showMenu({
        items: items,
        mode: 'convert'
      });
    });
  }
  function downloadToLocalDevice(items, options) {
    return Emby.importModule('./modules/sync/sync.js').then(function (syncDialog) {
      return syncDialog.showMenu({
        items: items,
        mode: 'download'
      });
    });
  }
  function downloadToDevice(items, options) {
    return Emby.importModule('./modules/sync/sync.js').then(function (syncDialog) {
      return syncDialog.showMenu({
        items: items,
        mode: 'sync'
      });
    });
  }
  function editImages(item, options) {
    return Emby.importModule('./modules/imageeditor/imageeditor.js').then(function (ImageEditor) {
      return ImageEditor.show({
        itemId: item.Id,
        serverId: item.ServerId
      });
    });
  }
  function showMissingEpisodesForSeries(items, options) {
    return Emby.importModule('./modules/missingepisodesdialog/missingepisodesdialog.js').then(function (MissingEpisodesDialog) {
      return new MissingEpisodesDialog().show({
        items: items
      });
    });
  }
  function showServerInfo(item, options) {
    var apiClient = _connectionmanager.default.getApiClient(item);
    var html = '';
    html += '<div style="overflow-x:hidden;">';
    if (apiClient) {
      if (apiClient.serverVersion()) {
        html += '<h4 style="margin:0;" class="secondaryText">' + _globalize.default.translate('Version') + '</h4>';
        html += '<div>' + apiClient.serverVersion() + '</div>';
      }
      if (item.LastConnectionMode) {
        html += '<h4 style="margin-bottom:0;" class="secondaryText">' + _globalize.default.translate('HeaderLastConnectedTo') + '</h4>';
      } else {
        html += '<h4 style="margin-bottom:0;" class="secondaryText">' + _globalize.default.translate('HeaderServerAddress') + '</h4>';
      }
      html += '<div>' + apiClient.serverAddress() + '</div>';
    }

    //if (item.LocalAddress && item.LocalAddress === apiClient.serverAddress()) {
    //    html += '<h4 style="margin-bottom:0;" class="secondaryText">' + globalize.translate('LocalLan') + '</h4>';
    //    html += '<div>' + item.LocalAddress + '</div>';
    //}

    if (item.RemoteAddress) {
      html += '<h4 style="margin-bottom:0;" class="secondaryText">' + _globalize.default.translate('RemoteWAN') + '</h4>';
      html += '<div>' + item.RemoteAddress + '</div>';
    }
    html += '</div>';
    return showAlertAndResolve({
      title: item.Name,
      html: html,
      centerText: false
    });
  }
  function copyToClipboard(item, options) {
    return navigator.clipboard.writeText(item.AccessToken);
  }
  function toggleItemChecked(items, options) {
    if (options.eventType !== 'change') {
      return Promise.resolve();
    }
    var checked = options.eventTarget.checked;
    var promise;
    var itemsContainer = options.itemsContainer;
    if (itemsContainer) {
      var _itemsContainer$curre;
      promise = (_itemsContainer$curre = itemsContainer.currentListOptions) == null ? void 0 : _itemsContainer$curre.options.checkboxAction({
        items: items,
        checked: checked
      }).then(function () {
        for (var i = 0, length = items.length; i < length; i++) {
          var item = items[i];
          var index = itemsContainer.indexOfItemId(item.Id);
          if (index !== -1) {
            itemsContainer.onItemUpdated(index, item);
          }
        }
      });
    }
    return promise || Promise.resolve();
  }
  function toggleItemCheckbox(items, options) {
    var checkbox = options.itemElement.querySelector('.chkItemCheckbox');
    checkbox.checked = !checkbox.checked;

    // trigger change so that checkboxaction will fire
    checkbox.dispatchEvent(new CustomEvent('change', {
      cancelable: true,
      bubbles: true
    }));
    return Promise.resolve();
  }
  function changeVirtualFolderContentType(page, virtualFolder) {
    return showAlertAndResolve({
      title: _globalize.default.translate('HeaderChangeFolderType'),
      text: _globalize.default.translate('HeaderChangeFolderTypeHelp')
    });
  }
  function renameVirtualFolder(apiClient, virtualFolder, button) {
    return showPrompt({
      label: _globalize.default.translate('LabelNewName'),
      confirmText: _globalize.default.translate('ButtonRename'),
      value: virtualFolder.Name
    }).then(function (newName) {
      if (newName && newName !== virtualFolder.Name) {
        var _button$closest;
        var refreshAfterChange = ((_button$closest = button.closest('[data-refreshlibrary]')) == null ? void 0 : _button$closest.getAttribute('data-refreshlibrary')) === 'true';
        return apiClient.renameVirtualFolder(virtualFolder, newName, refreshAfterChange);
      }
    });
  }
  function getLyricsStream(item, mediaSource) {
    var stream = mediaSource.MediaStreams.filter(function (s) {
      return s.Type === 'Subtitle' && s.Index === item.DefaultSubtitleStreamIndex;
    })[0];
    if (!stream) {
      stream = mediaSource.MediaStreams.filter(function (s) {
        return s.Type === 'Subtitle';
      })[0];
    }
    return stream;
  }
  function getLyricsTrackEventHtml(item, index) {
    var html;
    html = '<div style="margin:.5em 0;">';
    html += item.Text;
    html += '</div>';
    return html;
  }
  function showLyrics(item, options) {
    var apiClient = _connectionmanager.default.getApiClient(item);
    return apiClient.getItem(apiClient.getCurrentUserId(), item.Id, {
      ExcludeFields: 'Chapters,People,Overview,MediaStreams'
    }).then(function (item) {
      var mediaSource = item.MediaSources[0];
      var stream = getLyricsStream(item, mediaSource);
      return apiClient.getJSON(apiClient.getUrl('Items/' + item.Id + '/' + mediaSource.Id + '/Subtitles/' + stream.Index + '/Stream.js')).then(function (result) {
        return showAlertAndResolve({
          html: result.TrackEvents.map(getLyricsTrackEventHtml).join(''),
          confirmButton: false,
          title: _itemmanager.default.getDisplayName(item),
          centerText: false,
          confirmText: _globalize.default.translate('Close'),
          item: item
        });
      });
    });
  }
  function copyDataToUsers(item, options) {
    return Emby.importModule('./modules/copyuserdatadialog/copyuserdatadialog.js').then(function (CopyUserDataDialog) {
      return new CopyUserDataDialog().show({
        apiClient: _connectionmanager.default.getApiClient(item),
        item: item
      });
    });
  }
  function manageAccess(item, options) {
    return Emby.importModule('./modules/itemaccessdialog/itemaccessdialog.js').then(function (ItemAccessDialog) {
      return new ItemAccessDialog().show({
        item: item
      });
    });
  }
  function getItemsContainerParentId(itemsContainer) {
    return (itemsContainer == null ? void 0 : itemsContainer.getAttribute('data-parentid')) || null;
  }
  function deleteItems(items, options, command) {
    var _options$itemsContain3;
    var deleteOptions = {
      items: items,
      navigate: options.navigateOnDelete || false,
      positionTo: options.positionTo,
      deleteType: command
    };
    if ((_options$itemsContain3 = options.itemsContainer) != null && (_options$itemsContain3 = _options$itemsContain3.currentListOptions) != null && (_options$itemsContain3 = _options$itemsContain3.options.commandActions) != null && _options$itemsContain3.deleteItems) {
      return options.itemsContainer.currentListOptions.options.commandActions.deleteItems(deleteOptions).then(function (result) {
        if ((result == null ? void 0 : result.refreshItems) !== false) {
          options.itemsContainer.notifyRefreshNeeded(true);
        }
      });
    }
    return _itemmanager.default.deleteItems(deleteOptions);
  }
  function removeFromCollections(items, options) {
    items = items.filter(function (i) {
      return i.Type === 'BoxSet' && i.ItemIdInList;
    });
    if (!items.length) {
      return Promise.reject('noitems');
    }
    var apiClient = _connectionmanager.default.getApiClient(items[0]);
    items = items.map(function (i) {
      return {
        Id: i.Id,
        ItemIds: [i.ItemIdInList]
      };
    });
    return apiClient.removeItemsFromCollections(items).then(function (result) {
      var _options$itemsContain4;
      (_options$itemsContain4 = options.itemsContainer) == null || _options$itemsContain4.notifyRefreshNeeded(true);
      return result;
    });
  }
  function executeCommandInternal(command, items, options) {
    // temporary
    var item = items[0];
    if (command === 'open' || command === 'link' || command === 'linkdialog') {
      if (item.MediaType === 'Photo') {
        command = 'play';
      } else {
        if (command === 'linkdialog') {
          if (!options) {
            options = {};
          }
          options.asDialog = true;
        }
        return showItem(item, options);
      }
    }
    if (command === 'download') {
      return downloadItems(items, options);
    }
    if (command === 'identify') {
      return identifyItem(item, options);
    }
    if (command === 'resetmetadata') {
      return resetMetadata(items, options);
    }
    if (command === 'preview') {
      return previewItem(item, options);
    }
    if (command === 'removefromresume') {
      return removeFromResume(items, options);
    }
    if (command === 'removefromnextup') {
      return removeFromResume(items, options, 'nextup');
    }
    if (command === 'playtrailer') {
      return playTrailer(item);
    }
    if (command === 'connecttoserver') {
      return connectToServer(item);
    }
    if (command === 'setplaylistindex') {
      return _playbackmanager.default.setCurrentPlaylistItem(item.PlaylistItemId);
    }
    if (command === 'multiselect') {
      return showMultiSelect(item, options);
    }
    if (command === 'wakeserver') {
      return wakeServer(_connectionmanager.default.getApiClient(item), item);
    }
    switch (command) {
      case 'leaveshareditems':
      case 'delete':
      case 'canceltimer':
      case 'cancelseriestimer':
        return deleteItems(items, options, command);
      case 'edit':
        return editItems(items, options);
      case 'editimages':
        return editImages(item, options);
      case 'instantmix':
        return _playbackmanager.default.instantMix(item);
      case 'shuffle':
        return play(items, false, null, null, true, getItemsContainerParentId(options.itemsContainer));
      case 'playallfromhereautoplay':
        return playAllFromHere(options.itemElement, item.ServerId, null, true);
      case 'playallfromhere':
        return playAllFromHere(options.itemElement, item.ServerId);
      case 'queueallfromhere':
        return playAllFromHere(options.itemElement, item.ServerId, true);
      case 'play':
        return play(items, true, null, null, null, getItemsContainerParentId(options.itemsContainer));
      case 'playfrombeginning':
        return play(items, false, null, null, null, getItemsContainerParentId(options.itemsContainer));
      case 'resume':
      case 'playpause':
        return play(items, true, null, null, null, getItemsContainerParentId(options.itemsContainer));
      case 'queue':
        return play(items, false, true, null, null, getItemsContainerParentId(options.itemsContainer));
      case 'queuenext':
        return play(items, false, true, true, null, getItemsContainerParentId(options.itemsContainer));
      case 'artist':
        _approuter.default.showItem(item.ArtistItems[0].Id, item.ServerId);
        return Promise.resolve();
      case 'album':
        _approuter.default.showItem(item.AlbumId, item.ServerId);
        return Promise.resolve();
      case 'series':
        _approuter.default.showItem(item.SeriesId, item.ServerId);
        return Promise.resolve();
      case 'season':
        _approuter.default.showItem(item.SeasonId, item.ServerId);
        return Promise.resolve();
      case 'overview':
        {
          var overviewParts = [];
          if (item.Date) {
            overviewParts.push('<p class="secondaryText" style="margin-top:0;">' + _datetime.default.toLocaleString(new Date(Date.parse(item.Date))) + '</p>');
          }
          if (item.Overview) {
            overviewParts.push(item.Overview);
          }
          return showAlertAndResolve({
            preFormattedText: overviewParts.join(''),
            confirmButton: false,
            // handle episodes without a title
            title: _itemmanager.default.getDisplayName(item) || item.Name,
            centerText: false,
            item: item
          });
        }
      case 'programlink':
        var program = item.CurrentProgram || item;
        if (!program.ServerId) {
          program.ServerId = item.ServerId;
        }
        return showItem(program, options);
      case 'addtoplaylist':
        return _itemmanager.default.addToPlaylist(items, options);
      case 'addtocollection':
        return _itemmanager.default.addToCollection(items, options);
      case 'markplayed':
        return markPlayed(items, options);
      case 'markunplayed':
        return markUnplayed(items, options);
      case 'favorite':
        return markFavorite(items, true);
      case 'unfavorite':
        return markFavorite(items, false);
      case 'searchimageproviders':
        return searchImageProviders(item, options);
      case 'addimage':
        return showImageUploader(item, options);
      case 'moveinorder':
        return moveInOrder(items, options, options.newIndex);
      case 'moveupinorder':
        return moveByOffsetInOrder(items, options, -1);
      case 'movedowninorder':
        return moveByOffsetInOrder(items, options, 1);
      case 'addimagefromurl':
        return addImageFromUrl(item, options);
      case 'toggleitemchecked':
        return toggleItemChecked(items, options);
      case 'togglecheckbox':
        return toggleItemCheckbox(items, options);
      case 'copytoclipboard':
        return copyToClipboard(item, options);
      case 'share':
        return shareItems(items, options);
      case 'seektoposition':
        return seekToPosition(item, options);
      case 'sync':
        return downloadToDevice(items, options);
      case 'synclocal':
        return downloadToLocalDevice(items, options);
      case 'convert':
        return convertMedia(items, options);
      case 'editsubtitles':
        return editSubtitles(item, options);
      case 'changelibrarycontenttype':
        return changeVirtualFolderContentType(_connectionmanager.default.getApiClient(item), item, options.positionTo);
      case 'renamelibrary':
        return renameVirtualFolder(_connectionmanager.default.getApiClient(item), item, options.positionTo);
      case 'refresh':
        return _itemmanager.default.refreshMetadata(items, options);
      case 'scan':
        return _itemmanager.default.scanLibraryFiles(items, options);
      case 'removefromplayqueue':
        return _itemmanager.default.removeFromPlayQueue(items, options);
      case 'removefromplaylist':
        return _connectionmanager.default.getApiClient(item).removeItemsFromPlaylist(item.PlaylistId, items);
      case 'removefromcollection':
        if (item.Type === 'BoxSet' && item.ItemIdInList) {
          return removeFromCollections(items, options);
        }
        return _connectionmanager.default.getApiClient(item).removeItemsFromCollection(item.CollectionId, items);
      case 'session_stop':
        return _connectionmanager.default.getApiClient(item).sendPlayStateCommand(item.Id, 'Stop');
      case 'session_playpause':
        return _connectionmanager.default.getApiClient(item).sendPlayStateCommand(item.Id, 'PlayPause');
      case 'session_sendmessage':
        return sendMessageToSession(item, options);
      case 'session_shownowplayingitem':
        if (item.NowPlayingItem) {
          return showItem(item.NowPlayingItem, options);
        }
        return Promise.reject();
      case 'serverinfo':
        return showServerInfo(item, options);
      case 'record':
        return record(item, options);
      case 'lyrics':
        return showLyrics(item, options);
      case 'manageaccess':
        return manageAccess(item, options);
      case 'copydatatousers':
        return copyDataToUsers(item, options);
      case 'mergeversions':
        return _itemmanager.default.groupVersions(items, options);
      case 'showmissingepisodes':
        return showMissingEpisodesForSeries(items, options);
      case 'none':
      case 'toggletreenode':
        // TODO: we should try to get rid of these
        return Promise.resolve();
      default:
        return _itemmanager.default.executeCommand(command, items, options);
    }
  }
  function executeCommand(command, items, options) {
    var promise;
    try {
      promise = executeCommandInternal(command, items, options);
    } catch (err) {
      promise = Promise.reject(err);
    }
    if ((options == null ? void 0 : options.showErrorMessage) === false) {
      return promise;
    }
    return promise.catch(function (err) {
      if (err) {
        return _responsehelper.default.handleErrorResponse(err);
      }
      return Promise.reject(err);
    });
  }
  var _default = _exports.default = {
    executeCommand: executeCommand
  };
});
