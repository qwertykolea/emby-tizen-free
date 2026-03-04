define(["exports", "./../loading/loading.js", "./../dialoghelper/dialoghelper.js", "./../layoutmanager.js", "./../focusmanager.js", "./../common/servicelocator.js", "./../common/globalize.js", "./../common/itemmanager/itemmanager.js", "./../common/usersettings/usersettings.js", "./../emby-apiclient/connectionmanager.js", "./../emby-apiclient/events.js", "./../emby-elements/emby-select/emby-select.js", "./../emby-elements/emby-button/emby-button.js", "./../emby-elements/emby-toggle/emby-toggle.js", "./../emby-elements/emby-button/paper-icon-button-light.js", "./../emby-elements/emby-scroller/emby-scroller.js", "./../emby-elements/emby-itemscontainer/emby-itemscontainer.js", "./../emby-elements/emby-dialogclosebutton/emby-dialogclosebutton.js", "./../listview/listview.js", "./../common/itemhelper.js", "./../common/input/api.js"], function (_exports, _loading, _dialoghelper, _layoutmanager, _focusmanager, _servicelocator, _globalize, _itemmanager, _usersettings, _connectionmanager, _events, _embySelect, _embyButton, _embyToggle, _paperIconButtonLight, _embyScroller, _embyItemscontainer, _embyDialogclosebutton, _listview, _itemhelper, _api) {
  Object.defineProperty(_exports, "__esModule", {
    value: true
  });
  _exports.default = void 0;
  /* jshint module: true */

  require(['flexStyles', 'formDialogStyle', 'material-icons']);
  function fillLanguages(context, apiClient, languages) {
    var selectLanguage = context.querySelector('.selectLanguage');
    selectLanguage.innerHTML = languages.map(function (l) {
      return '<option value="' + l.TwoLetterISOLanguageName + '">' + l.DisplayName + '</option>';
    });
    var lastLanguage = _usersettings.default.get('subtitleeditor-language');
    if (lastLanguage) {
      selectLanguage.value = lastLanguage;
    } else {
      apiClient.getCurrentUser().then(function (user) {
        var lang = user.Configuration.SubtitleLanguagePreference;
        if (lang) {
          selectLanguage.value = lang;
        }
      });
    }
  }
  function getSubtitleSearchResults() {
    var instance = this;
    var context = instance.context;
    var apiClient = _connectionmanager.default.getApiClient(instance.currentItem);
    var language = context.querySelector('.selectLanguage').value;
    var itemId = instance.currentItem.Id;
    var mediaSourceId = instance.currentMediaSource.Id;
    var url = apiClient.getUrl('Items/' + itemId + '/RemoteSearch/Subtitles/' + language, {
      //IsPerfectMatch: context.querySelector('.chkRequireHashMatch').checked,
      IsForced: context.querySelector('.chkForcedOnly').checked || null,
      MediaSourceId: mediaSourceId
    });
    var serverId = apiClient.serverId();
    return apiClient.getJSON(url).then(function (items) {
      for (var i = 0, length = items.length; i < length; i++) {
        var item = items[i];
        item.Type = 'RemoteSubtitle';
        item.ServerId = serverId;
        item.ItemId = itemId;
        item.MediaSourceId = mediaSourceId;
        item.CanDownload = true;
      }
      return {
        Items: items,
        TotalRecordCount: items.length
      };
    });
  }
  function updateMode(instance) {
    var context = instance.context;
    var mode = instance.mode;
    if (mode === 'lyrics') {
      context.querySelector('.formDialogHeaderTitle').innerHTML = _globalize.default.translate('Lyrics');
      context.querySelector('.subtitleSearchHeaderText').innerHTML = _globalize.default.translate('SearchForLyrics');
      context.querySelector('.fldForcedOnly').classList.add('hide');
    } else {
      context.querySelector('.formDialogHeaderTitle').innerHTML = _globalize.default.translate('Subtitles');
      context.querySelector('.subtitleSearchHeaderText').innerHTML = _globalize.default.translate('SearchForSubtitles');
      context.querySelector('.fldForcedOnly').classList.remove('hide');
    }
  }
  function onLibraryChanged(e, apiClient, data) {
    var _data$ItemsUpdated;
    var instance = this;
    var currentItem = instance.currentItem;
    var item = currentItem;
    if (!item) {
      return;
    }
    if ((_data$ItemsUpdated = data.ItemsUpdated) != null && _data$ItemsUpdated.includes(item.Id)) {
      if (instance.paused) {
        // this shouldn't happen
      } else {
        reload(instance, apiClient, instance.currentItem.Id, instance.currentMediaSource.Id);
      }
    }
  }
  function onGetItem(instance, item, mediaSource, apiClient, autoSearch) {
    var context = instance.context;
    instance.currentItem = item;
    instance.mode = item.MediaType === 'Audio' ? 'lyrics' : 'subtitles';
    updateMode(instance);
    instance.currentMediaSource = mediaSource;
    apiClient.getCurrentUser().then(function (user) {
      if (_itemmanager.default.canDownloadSubtitles(item, user)) {
        context.querySelector('.subtitleSearchContainer').classList.remove('hide');
      } else {
        context.querySelector('.subtitleSearchContainer').classList.add('hide');
      }
      instance.subtitleList.resume({
        refresh: true
      }).then(function () {
        if (!autoSearch) {
          _loading.default.hide();
          instance.autoFocus();
        }
      });
      var file = instance.currentMediaSource.Path || '';
      var index = Math.max(file.lastIndexOf('/'), file.lastIndexOf('\\'));
      if (index > -1) {
        file = file.substring(index + 1);
      }
      if (file) {
        context.querySelector('.originalFile').innerHTML = file;
        context.querySelector('.originalFile').classList.remove('hide');
      } else {
        context.querySelector('.originalFile').innerHTML = '';
        context.querySelector('.originalFile').classList.add('hide');
      }
      if (autoSearch) {
        // quick hack for now. need to make sure the opening animation has finished.
        setTimeout(function () {
          var form = context.querySelector('.subtitleSearchForm');
          form.requestSubmit(context.querySelector('.btnSubmit'));
        }, 300);
      }
    });
  }
  function afterSubtitlesResultsRefreshed(result) {
    var instance = this;
    var context = instance.context;
    if (result.TotalRecordCount) {
      context.querySelector('.noSearchResults').classList.add('hide');
    } else {
      context.querySelector('.noSearchResults').classList.remove('hide');
    }
    _loading.default.hide();
  }
  function onRemoteSubtitlesCommandResult(result) {
    var instance = this;
    if (result.command === 'download') {
      var downloadResult = result.result;
      if (downloadResult) {
        instance.hasChanges = true;
        instance.newStreamIndex = downloadResult.NewIndex;
        if (instance.options.closeOnDownload) {
          var context = instance.context;
          _dialoghelper.default.close(context);
        }
      }
    }
  }
  function reload(instance, apiClient, itemId, mediaSource, autoSearch) {
    if (typeof itemId === 'string') {
      apiClient.getItem(apiClient.getCurrentUserId(), itemId, {
        ExcludeFields: 'Chapters,Overview,People,MediaStreams'
      }).then(function (item) {
        var mediaSourceId = mediaSource;
        for (var i = 0, length = item.MediaSources.length; i < length; i++) {
          if (mediaSourceId === item.MediaSources[i].Id) {
            mediaSource = item.MediaSources[i];
            break;
          }
        }
        if (!mediaSource) {
          mediaSource = item.MediaSources[0];
        }
        onGetItem(instance, item, mediaSource, apiClient, autoSearch);
      });
    } else {
      onGetItem(instance, itemId, mediaSource, apiClient, autoSearch);
    }
  }
  function onSearchSubmit(e) {
    var instance = this;
    var form = e.target.closest('form');
    var lang = form.querySelector('.selectLanguage').value;
    _usersettings.default.set('subtitleeditor-language', lang);
    _loading.default.show();
    instance.subtitleResults.resume({
      refresh: true
    }).then(function () {
      instance.autoFocus();
    });
    e.preventDefault();
    return false;
  }
  function getExistingSubtitles(query) {
    var _instance$options;
    var instance = this;
    var mediaSource = instance.currentMediaSource;
    var item = instance.currentItem;
    if (!item || !mediaSource || ((_instance$options = instance.options) == null ? void 0 : _instance$options.showCurrentSubtitles) === false) {
      return Promise.resolve({
        Items: [],
        TotalRecordCount: 0
      });
    }
    var items = mediaSource.MediaStreams.filter(function (s) {
      return s.Type === 'Subtitle';
    }).map(function (s) {
      return _itemhelper.default.normalizeMediaStreamForDisplay(item, mediaSource, s);
    });
    var totalRecordCount = items.length;
    return Promise.resolve({
      Items: items,
      TotalRecordCount: totalRecordCount
    });
  }
  function getExistingSubtitlesListViewOptions() {
    var fields = ['Name'];
    fields.push('PathOrTitle');
    var options = {
      enableDefaultIcon: true,
      action: _layoutmanager.default.tv ? 'menu' : 'none',
      fields: fields,
      draggable: false,
      multiSelect: false,
      hoverPlayButton: false,
      enableUserDataButtons: false,
      mediaInfo: false,
      roundImage: true,
      imageSize: 'smaller',
      forceBorder: true,
      playQueueIndicator: false
    };
    return options;
  }
  function getExistingSubtitlesListOptions() {
    return {
      renderer: _listview.default,
      options: getExistingSubtitlesListViewOptions(),
      virtualScrollLayout: 'vertical-list'
    };
  }
  function getRemoteSubtitlesListViewOptions() {
    var fields = ['Name'];
    fields.push('ProviderName');
    fields.push('MediaInfo');
    var options = {
      enableDefaultIcon: true,
      action: _layoutmanager.default.tv ? 'menu' : 'none',
      fields: fields,
      draggable: false,
      multiSelect: false,
      hoverPlayButton: false,
      enableUserDataButtons: false,
      mediaInfo: false,
      enableSideMediaInfo: false,
      // don't do icons here because on mobile it takes up too much space and takes away from the title of the download
      image: _layoutmanager.default.tv ? true : false,
      imageSize: 'smaller',
      forceBorder: true,
      downloadButton: true,
      moreButton: false,
      roundImage: true,
      playQueueIndicator: false,
      buttonCommands: ['download', 'preview']
    };
    return options;
  }
  function getRemoteSubtitlesListOptions() {
    return {
      renderer: _listview.default,
      options: getRemoteSubtitlesListViewOptions(),
      virtualScrollLayout: 'vertical-list'
    };
  }
  function SubtitleEditor() {
    this.onLibraryChangedFn = onLibraryChanged.bind(this);
  }
  SubtitleEditor.prototype.show = function (options) {
    this.options = options;
    var instance = this;
    return require(['text!./modules/subtitleeditor/subtitleeditor.template.html']).then(function (responses) {
      var template = responses[0];
      instance.hasChanges = false;
      instance.newStreamIndex = null;
      var item = options.item;
      var mediaSource = options.mediaSource;
      var apiClient = _connectionmanager.default.getApiClient(item);
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
      dlg.classList.add('formDialog');
      dlg.classList.add('subtitleEditorDialog');
      dlg.innerHTML = _globalize.default.translateDocument(template, 'sharedcomponents');
      dlg.querySelector('.subtitleSearchForm').addEventListener('submit', onSearchSubmit.bind(instance));
      var editorContent = dlg.querySelector('.formDialogContent');
      apiClient.getCultures().then(function (languages) {
        fillLanguages(editorContent, apiClient, languages);
      });
      var noResultsMsg = 'NoSubtitleSearchResultsFound';
      var noResultsHelpUrl = 'https://support.emby.media/support/solutions/articles/44001848856-manual-subtitle-downloads';
      if (instance.mode === 'lyrics') {
        noResultsMsg = 'NoLyricsSearchResultsFound';
      }
      if (_servicelocator.appHost.supports('externallinks')) {
        dlg.querySelector('.noSearchResults').innerHTML = _globalize.default.translate(noResultsMsg, '<a is="emby-linkbutton" href="' + noResultsHelpUrl + '" target="_blank" class="button-link">', '</a>');
      } else {
        dlg.querySelector('.noSearchResults').innerHTML = _globalize.default.translate(noResultsMsg, '', '');
      }
      var subtitleList = dlg.querySelector('.subtitleList');
      subtitleList.fetchData = getExistingSubtitles.bind(instance);
      subtitleList.getListOptions = getExistingSubtitlesListOptions.bind(instance);
      subtitleList.parentContainer = subtitleList;
      instance.subtitleList = subtitleList;
      var subtitleResults = dlg.querySelector('.subtitleResults');
      subtitleResults.fetchData = getSubtitleSearchResults.bind(instance);
      subtitleResults.getListOptions = getRemoteSubtitlesListOptions.bind(instance);
      subtitleResults.afterRefresh = afterSubtitlesResultsRefreshed.bind(instance);
      subtitleResults.onCommandResultInternal = onRemoteSubtitlesCommandResult.bind(instance);
      instance.subtitleResults = subtitleResults;
      var onLibraryChangedFn = instance.onLibraryChangedFn;
      if (onLibraryChangedFn) {
        _events.default.on(_api.default, 'LibraryChanged', onLibraryChangedFn);
      }
      return new Promise(function (resolve, reject) {
        dlg.addEventListener('close', function () {
          if (instance.hasChanges) {
            resolve({
              NewIndex: instance.newStreamIndex
            });
          } else {
            reject();
          }
        });
        dlg.addEventListener('open', function () {
          reload(instance, apiClient, item, mediaSource, options.autoSearch);
        });
        _dialoghelper.default.open(dlg);
      });
    });
  };
  SubtitleEditor.prototype.autoFocus = function () {
    var subtitleResults = this.context.querySelector('.subtitleResults');
    var elem = _focusmanager.default.autoFocus(subtitleResults, {
      skipIfNotEnabled: true
    });
    if (elem) {
      return;
    }
    _focusmanager.default.autoFocus(this.context, {
      skipIfNotEnabled: true
    });
  };
  SubtitleEditor.prototype.pause = function () {
    var _this$subtitleList, _this$subtitleResults;
    (_this$subtitleList = this.subtitleList) == null || _this$subtitleList.pause();
    (_this$subtitleResults = this.subtitleResults) == null || _this$subtitleResults.pause();
  };
  SubtitleEditor.prototype.destroy = function () {
    this.pause();
    var onLibraryChangedFn = this.onLibraryChangedFn;
    if (onLibraryChangedFn) {
      _events.default.off(_api.default, 'LibraryChanged', onLibraryChangedFn);
    }
    this.onLibraryChangedFn = null;
    this.subtitleList = null;
    this.subtitleResults = null;
    this.mode = null;
    this.options = null;
    this.hasChanges = null;
    this.currentItem = null;
    this.currentMediaSource = null;
  };
  function showEditor(options) {
    _loading.default.show();
    var editor = new SubtitleEditor();
    return editor.show(options).then(function (result) {
      editor.destroy();
      return Promise.resolve(result);
    });
  }
  var _default = _exports.default = {
    show: showEditor
  };
});
