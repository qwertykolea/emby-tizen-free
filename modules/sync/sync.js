define(["exports", "./../emby-apiclient/connectionmanager.js", "./../common/globalize.js", "./../layoutmanager.js", "./../dialoghelper/dialoghelper.js", "./../emby-elements/emby-scroller/emby-scroller.js", "./../emby-elements/emby-select/emby-select.js", "./../emby-elements/emby-input/emby-input.js", "./../emby-elements/emby-toggle/emby-toggle.js", "./../emby-elements/emby-button/paper-icon-button-light.js", "./../emby-elements/emby-dialogclosebutton/emby-dialogclosebutton.js", "./../common/servicelocator.js", "./../focusmanager.js", "./../common/appsettings.js", "./../registrationservices/registrationservices.js", "./../approuter.js"], function (_exports, _connectionmanager, _globalize, _layoutmanager, _dialoghelper, _embyScroller, _embySelect, _embyInput, _embyToggle, _paperIconButtonLight, _embyDialogclosebutton, _servicelocator, _focusmanager, _appsettings, _registrationservices, _approuter) {
  Object.defineProperty(_exports, "__esModule", {
    value: true
  });
  _exports.default = void 0;
  /* jshint module: true */

  require(['formDialogStyle']);
  function showDialog(options) {
    return Emby.importModule('./modules/dialog/dialog.js').then(function (dialog) {
      return dialog(options);
    });
  }
  var currentDialogOptions;
  function showToast(options) {
    return Emby.importModule('./modules/toast/toast.js').then(function (toast) {
      return toast(options);
    });
  }
  function showAlert(options) {
    return Emby.importModule('./modules/common/dialogs/alert.js').then(function (alert) {
      return alert(options);
    });
  }
  function submitJob(dlg, apiClient, userId, syncOptions, form) {
    if (!userId) {
      throw new Error('userId cannot be null');
    }
    if (!syncOptions) {
      throw new Error('syncOptions cannot be null');
    }
    if (!form) {
      throw new Error('form cannot be null');
    }
    var selectSyncTarget = form.querySelector('.selectSyncTarget');
    var target = selectSyncTarget == null ? void 0 : selectSyncTarget.value;
    if (!target) {
      showAlert(_globalize.default.translate('PleaseSelectDeviceToSyncTo'));
      return false;
    }
    var mode = syncOptions.mode;
    if (mode !== 'download') {
      _appsettings.default.set('lastsync_' + mode + '_targetid', target);
    }
    var selectedIndex = selectSyncTarget.selectedIndex;
    if (selectedIndex !== -1) {
      var _selectSyncTarget$opt;
      var targetName = (_selectSyncTarget$opt = selectSyncTarget.options[selectedIndex]) == null ? void 0 : _selectSyncTarget$opt.innerHTML;
      if (targetName != null && targetName.toLowerCase().includes('windows') && !apiClient.isMinServerVersion('4.8.4')) {
        showAlert('To use the download feature, please update Emby Server to at least 4.8.4 or greater.');
        return true;
      }
    }
    var options = {
      userId: userId,
      TargetId: target,
      ParentId: syncOptions.ParentId,
      Category: syncOptions.Category
    };
    setJobValues(options, form);
    if (syncOptions.items && syncOptions.items.length) {
      options.ItemIds = (syncOptions.items || []).map(function (i) {
        return i.Id || i;
      }).join(',');
    }
    apiClient.createSyncJob(options).then(function () {
      _dialoghelper.default.close(dlg);
      showSubmissionToast(mode, target, apiClient);
      if (mode === 'download') {
        syncNow();
      }
    });
    return true;
  }
  function showSubmissionToast(mode, targetId, apiClient) {
    var msg = mode === 'convert' ? _globalize.default.translate('ConvertingDots') : _globalize.default.translate('DownloadingDots');
    showToast(msg);
  }
  function syncNow() {
    require(['localsync'], function (localSync) {
      localSync.sync();
    });
  }
  function submitQuickSyncJob(apiClient, userId, targetId, syncOptions) {
    if (!userId) {
      throw new Error('userId cannot be null');
    }
    if (!syncOptions) {
      throw new Error('syncOptions cannot be null');
    }
    if (!targetId) {
      throw new Error('targetId cannot be null');
    }
    var options = {
      userId: userId,
      TargetId: targetId,
      ParentId: syncOptions.ParentId,
      Category: syncOptions.Category,
      Quality: syncOptions.Quality,
      Bitrate: syncOptions.Bitrate
    };
    if (syncOptions.items && syncOptions.items.length) {
      options.ItemIds = (syncOptions.items || []).map(function (i) {
        return i.Id || i;
      }).join(',');
    }
    return apiClient.createSyncJob(options).then(function () {
      showSubmissionToast(syncOptions.mode, targetId, apiClient);
      if (syncOptions.mode === 'download') {
        syncNow();
      }
    });
  }
  function setJobValues(job, form) {
    var txtBitrate = form.querySelector('.txtBitrate');
    var bitrate = txtBitrate ? txtBitrate.value : null;
    if (bitrate) {
      bitrate = parseFloat(bitrate) * 1000000;
    }
    job.Bitrate = bitrate;
    var selectQuality = form.querySelector('.selectQuality');
    if (selectQuality) {
      job.Quality = selectQuality.value;
      _appsettings.default.set('sync-lastquality', job.Quality || '');
    }
    var selectProfile = form.querySelector('.selectProfile');
    if (selectProfile) {
      job.Profile = selectProfile.value;
    }
    var selectContainer = form.querySelector('.selectJobContainer');
    if (selectContainer) {
      job.Container = selectContainer.value;
    }
    var selectVideoCodec = form.querySelector('.selectVideoCodec');
    if (selectVideoCodec) {
      job.VideoCodec = selectVideoCodec.value;
    }
    var selectAudioCodec = form.querySelector('.selectAudioCodec');
    if (selectAudioCodec) {
      job.AudioCodec = selectAudioCodec.value;
    }
    var txtItemLimit = form.querySelector('.txtItemLimit');
    if (txtItemLimit) {
      job.ItemLimit = txtItemLimit.value || null;
    }
    var chkSyncNewContent = form.querySelector('.chkSyncNewContent');
    if (chkSyncNewContent) {
      job.SyncNewContent = chkSyncNewContent.checked;
    }
    var chkUnwatchedOnly = form.querySelector('.chkUnwatchedOnly');
    if (chkUnwatchedOnly) {
      job.UnwatchedOnly = chkUnwatchedOnly.checked;
    }
  }
  function renderForm(options) {
    return new Promise(function (resolve, reject) {
      renderFormInternal(options, _connectionmanager.default.deviceId(), resolve);
    });
  }
  function renderFormInternal(options, defaultTargetId, resolve) {
    var elem = options.elem;
    var dialogOptions = options.dialogOptions;
    //const apiClient = options.apiClient;

    var targets = dialogOptions.Targets;
    var html = '';
    var mode = options.mode;
    var targetContainerClass = mode === 'download' ? ' hide' : '';
    var syncTargetLabel = mode === 'convert' ? _globalize.default.translate('LabelConvertTo') : _globalize.default.translate('LabelDownloadTo');

    // if we're downloading, remove all possibility of the wrong device being set in the hidden select box
    if (mode === 'download') {
      targets = targets.filter(function (t) {
        return defaultTargetId === t.Id;
      });
    } else if (mode) {
      defaultTargetId = _appsettings.default.get('lastsync_' + mode + '_targetid');
    }
    if (options.readOnlySyncTarget) {
      html += '<div class="inputContainer' + targetContainerClass + '">';
      html += '<input is="emby-input" type="text" class="selectSyncTarget" readonly label="' + syncTargetLabel + '"/>';
      html += '</div>';
    } else {
      html += '<div class="selectContainer' + targetContainerClass + '">';

      // with this attribute we can't set the selected value in safari for some reason
      var requiredAttribute = targets.length ? '' : ' required';
      html += '<select is="emby-select" class="selectSyncTarget"' + requiredAttribute + ' label="' + syncTargetLabel + '">';
      html += targets.map(function (t) {
        var isSelected = defaultTargetId === t.Id;
        var selectedHtml = isSelected ? ' selected' : '';
        return '<option' + selectedHtml + ' value="' + t.Id + '">' + t.Name + '</option>';
      }).join('');
      html += '</select>';
      if (!targets.length) {
        html += '<div class="fieldDescription">' + _globalize.default.translate('LabelSyncNoTargetsHelp') + '</div>';
      }
      if (_servicelocator.appHost.supports('externallinks')) {
        var helpUrl = mode === 'convert' ? 'https://support.emby.media/support/solutions/articles/44001849018-convert-media' : 'https://support.emby.media/support/solutions/articles/44001162174-sync';
        html += '<div class="fieldDescription"><a is="emby-linkbutton" class="button-link lnkLearnMore" href="' + helpUrl + '" target="_blank">' + _globalize.default.translate('LearnMore') + '</a></div>';
      }
      html += '</div>';
    }
    var settingsDisabled = false;
    if (options.readOnlySyncTarget && dialogOptions.Options.indexOf('UnwatchedOnly') === -1 && dialogOptions.Options.indexOf('SyncNewContent') === -1 && dialogOptions.Options.indexOf('ItemLimit') === -1) {
      // for non-dynamic sync-jobs and non-new it doesn't make any sense to allow modifying any settings
      settingsDisabled = true;
    }
    var isMultiItemJob = true;
    html += '<div class="fldProfile selectContainer hide">';
    html += '<select is="emby-select" class="selectProfile" ' + (settingsDisabled ? 'disabled' : '') + '  label="' + _globalize.default.translate('Profile') + '">';
    html += '</select>';
    html += '<div class="fieldDescription profileDescription"></div>';
    html += '</div>';
    html += '<div class="customProfileOptions hide">';
    html += '<div class="selectContainer">';
    html += '<select is="emby-select" class="selectJobContainer" required ' + (settingsDisabled ? 'disabled' : '') + '  label="' + _globalize.default.translate('Container') + '">';
    html += '<option value="mkv">mkv</option>';
    html += '<option value="mp4">mp4</option>';
    html += '<option value="ts">ts</option>';
    html += '</select>';
    html += '<div class="fieldDescription containerDescription"></div>';
    html += '</div>';
    html += '<div class="selectContainer">';
    html += '<select is="emby-select" class="selectVideoCodec" required ' + (settingsDisabled ? 'disabled' : '') + '  label="' + _globalize.default.translate('LabelVideoCodec') + '">';
    html += '<option value="h264">h264</option>';
    html += '<option value="hevc">hevc</option>';
    if (isMultiItemJob) {
      html += '<option value="h264,hevc">h264, hevc</option>';
      html += '<option value="hevc,h264">hevc, h264</option>';
    }
    html += '</select>';
    html += '<div class="fieldDescription videoCodecDescription"></div>';
    html += '</div>';
    html += '<div class="selectContainer">';
    html += '<select is="emby-select" class="selectAudioCodec" required ' + (settingsDisabled ? 'disabled' : '') + '  label="' + _globalize.default.translate('LabelAudioCodec') + '">';
    html += '<option value="aac">aac</option>';
    html += '<option value="mp3">mp3</option>';
    if (isMultiItemJob) {
      html += '<option value="aac,mp3">aac, mp3</option>';
      html += '<option value="aac,mp3,ac3">aac, mp3, ac3</option>';
    }

    //if (apiClient.isMinServerVersion('4.9.0.38')) {
    //    html += '<option value="copy">' + globalize.translate('CopyStream') + '</option>';
    //}

    html += '</select>';
    html += '<div class="fieldDescription audioCodecDescription"></div>';
    html += '</div>';
    html += '</div>';
    html += '<div class="fldQuality selectContainer hide">';
    html += '<select is="emby-select" class="selectQuality" required ' + (settingsDisabled ? 'disabled' : '') + '  label="' + _globalize.default.translate('Quality') + '">';
    html += '</select>';
    html += '<div class="fieldDescription qualityDescription"></div>';
    html += '</div>';
    html += '<div class="fldBitrate inputContainer hide">';
    html += '<input is="emby-input" type="number" inputmode="decimal" step=".1" min=".1" ' + (settingsDisabled ? 'readonly' : '') + ' class="txtBitrate" label="' + _globalize.default.translate('LabelBitrateMbps') + '"/>';
    html += '</div>';
    var unwatchedOnlyContainerClass = '';
    if (!dialogOptions.Options.includes('UnwatchedOnly')) {
      unwatchedOnlyContainerClass += ' hide';
    }
    html += '<div class="toggleContainer unwatchedOnlyToggleContainer' + unwatchedOnlyContainerClass + '">';
    html += '<label>';
    html += '<input is="emby-toggle" type="checkbox" class="chkUnwatchedOnly"/>';
    if (mode === 'convert') {
      html += '<span>' + _globalize.default.translate('ConvertUnwatchedVideosOnly') + '</span>';
    } else {
      html += '<span>' + _globalize.default.translate('SyncUnwatchedVideosOnly') + '</span>';
    }
    html += '</label>';
    if (mode === 'convert') {
      html += '<div class="fieldDescription toggleFieldDescription">' + _globalize.default.translate('ConvertUnwatchedVideosOnlyHelp') + '</div>';
    } else {
      html += '<div class="fieldDescription toggleFieldDescription">' + _globalize.default.translate('SyncUnwatchedVideosOnlyHelp') + '</div>';
    }
    html += '</div>';
    if (dialogOptions.Options.indexOf('SyncNewContent') !== -1) {
      html += '<div class="toggleContainer">';
      html += '<label>';
      html += '<input is="emby-toggle" type="checkbox" class="chkSyncNewContent"/>';
      if (mode === 'convert') {
        html += '<span>' + _globalize.default.translate('AutomaticallyConvertNewContent') + '</span>';
      } else {
        html += '<span>' + _globalize.default.translate('AutomaticallySyncNewContent') + '</span>';
      }
      html += '</label>';
      if (mode === 'convert') {
        html += '<div class="fieldDescription toggleFieldDescription">' + _globalize.default.translate('AutomaticallyConvertNewContentHelp') + '</div>';
      } else {
        html += '<div class="fieldDescription toggleFieldDescription">' + _globalize.default.translate('AutomaticallySyncNewContentHelp') + '</div>';
      }
      html += '</div>';
    }
    if (dialogOptions.Options.indexOf('ItemLimit') !== -1) {
      html += '<div class="inputContainer">';
      html += '<input is="emby-input" type="number" inputmode="numeric" step="1" min="1" class="txtItemLimit" label="' + _globalize.default.translate('LabelItemLimit') + '"/>';
      if (mode === 'convert') {
        html += '<div class="fieldDescription">' + _globalize.default.translate('ConvertItemLimitHelp') + '</div>';
      } else {
        html += '<div class="fieldDescription">' + _globalize.default.translate('DownloadItemLimitHelp') + '</div>';
      }
      html += '</div>';
    }

    //html += '</div>';
    //html += '</div>';

    elem.innerHTML = html;
    var selectSyncTarget = elem.querySelector('.selectSyncTarget');
    if (selectSyncTarget) {
      selectSyncTarget.addEventListener('change', function () {
        loadQualityOptions(elem, this.value, options.dialogOptionsFn).then(resolve);
      });
      selectSyncTarget.dispatchEvent(new CustomEvent('change', {
        bubbles: true
      }));
    }
    var selectProfile = elem.querySelector('.selectProfile');
    if (selectProfile) {
      selectProfile.addEventListener('change', function () {
        onProfileChange(elem, this.value);
      });
      if (dialogOptions.ProfileOptions.length) {
        selectProfile.dispatchEvent(new CustomEvent('change', {
          bubbles: true
        }));
      }
    }
    var selectQuality = elem.querySelector('.selectQuality');
    if (selectQuality) {
      selectQuality.addEventListener('change', function () {
        onQualityChange(elem, this.value);
      });
      selectQuality.dispatchEvent(new CustomEvent('change', {
        bubbles: true
      }));
    }
    var selectContainer = elem.querySelector('.selectJobContainer');
    if (selectContainer) {
      selectContainer.addEventListener('change', onContainerChange);
      selectContainer.dispatchEvent(new CustomEvent('change', {
        bubbles: true
      }));
    }
    var selectVideoCodec = elem.querySelector('.selectVideoCodec');
    if (selectVideoCodec) {
      selectVideoCodec.addEventListener('change', onVideoCodecChange);
      selectVideoCodec.dispatchEvent(new CustomEvent('change', {
        bubbles: true
      }));
    }
    var selectAudioCodec = elem.querySelector('.selectAudioCodec');
    if (selectAudioCodec) {
      selectAudioCodec.addEventListener('change', onAudioCodecChange);
      selectAudioCodec.dispatchEvent(new CustomEvent('change', {
        bubbles: true
      }));
    }

    // This isn't ideal, but allow time for the change handlers above to run
    setTimeout(function () {
      _focusmanager.default.autoFocus(elem);
    }, 100);
  }
  function showWifiMessage() {
    var options = {
      title: _globalize.default.translate('HeaderWaitingForWifi'),
      text: _globalize.default.translate('WifiRequiredToDownload')
    };
    var items = [];
    items.push({
      name: options.confirmText || _globalize.default.translate('ButtonOk'),
      id: 'ok',
      type: 'submit'
    });
    items.push({
      name: options.cancelText || _globalize.default.translate('HeaderDownloadSettings'),
      id: 'downloadsettings',
      type: 'cancel'
    });
    options.buttons = items;
    showDialog(options).then(function (result) {
      if (result === 'ok') {
        return Promise.resolve();
      }
      if (result === 'downloadsettings') {
        _approuter.default.show(_approuter.default.getRouteUrl('downloadsettings'));
        return Promise.resolve();
      }
      return Promise.reject();
    });
  }
  function validateNetwork() {
    var network = navigator.connection ? navigator.connection.type : null;
    switch (network) {
      case 'cellular':
      case 'bluetooth':
        showWifiMessage();
        return false;
      default:
        return true;
    }
  }
  function showSyncMenu(options) {
    if (options.mode === 'download' && _appsettings.default.syncOnlyOnWifi() && !validateNetwork()) {
      return Promise.reject();
    }
    return _registrationservices.default.validateFeature('sync').then(function () {
      return showSyncMenuInternal(options);
    });
  }
  function enableAutoSync(options) {
    if (options.mode !== 'download') {
      return false;
    }
    var firstItem = (options.items || [])[0] || {};
    if (firstItem.Type === 'Audio') {
      return true;
    }
    if (firstItem.Type === 'Photo') {
      return true;
    }
    if (firstItem.Type === 'MusicAlbum') {
      return true;
    }
    if (firstItem.Type === 'MusicArtist') {
      return true;
    }
    if (firstItem.Type === 'MusicGenre') {
      return true;
    }
    if (firstItem.Type === 'Playlist' && firstItem.MediaType === 'Audio') {
      return true;
    }
    return false;
  }
  function showSyncMenuInternal(options) {
    var apiClient = _connectionmanager.default.getApiClient(options.items[0]);
    var userId = apiClient.getCurrentUserId();
    if (enableAutoSync(options)) {
      return submitQuickSyncJob(apiClient, userId, apiClient.deviceId(), {
        items: options.items,
        Quality: 'custom',
        Bitrate: _appsettings.default.maxStaticMusicBitrate()
      });
    }
    var dialogOptionsFn = getTargetDialogOptionsFn(apiClient, {
      UserId: userId,
      ItemIds: (options.items || []).map(function (i) {
        return i.Id || i;
      }).join(','),
      ParentId: options.ParentId,
      Category: options.Category,
      IncludeProviders: options.mode === 'convert' ? 'ConvertSyncProvider' : null,
      ExcludeProviders: options.mode === 'convert' ? null : 'ConvertSyncProvider'
    });
    return dialogOptionsFn().then(function (dialogOptions) {
      currentDialogOptions = dialogOptions;
      var dlgElementOptions = {
        removeOnClose: true,
        scrollY: false,
        autoFocus: false
      };
      if (_layoutmanager.default.tv) {
        dlgElementOptions.size = 'fullscreen';
      } else {
        dlgElementOptions.size = 'small';
      }
      var dlg = _dialoghelper.default.createDialog(dlgElementOptions);
      dlg.classList.add('formDialog');
      var html = '';
      html += '<div class="formDialogHeader">';
      html += '<button type="button" is="emby-dialogclosebutton"></button>';
      html += '<h3 class="formDialogHeaderTitle">';
      var syncButtonLabel = options.mode === 'convert' ? _globalize.default.translate('Convert') : _globalize.default.translate('Download');
      html += syncButtonLabel;
      html += '</h3>';
      if (_servicelocator.appHost.supports('externallinks')) {
        var helpUrl = options.mode === 'convert' ? 'https://support.emby.media/support/solutions/articles/44001849018-convert-media' : 'https://support.emby.media/support/solutions/articles/44001162174-sync';
        html += '<a is="emby-linkbutton" href="' + helpUrl + '" target="_blank" class="paper-icon-button-light noautofocus btnHelp flex align-items-center dialogHeaderButton button-help"><i class="md-icon">&#xe887;</i></a>';
      }
      html += '</div>';
      html += '<div is="emby-scroller" data-horizontal="false" data-forcescrollbar="true" data-focusscroll="true" class="formDialogContent">';
      html += '<div class="scrollSlider">';
      html += '<form class="dialogContentInner dialog-content-centered formSubmitSyncRequest padded-left padded-right">';
      html += '<div class="formFields"></div>';
      html += '<div class="formDialogFooter">';
      html += '<button is="emby-button" type="submit" class="raised button-submit block formDialogFooterItem"><span>' + syncButtonLabel + '</span></button>';
      html += '</div>';
      html += '</form>';
      html += '</div>';
      html += '</div>';
      dlg.innerHTML = html;
      var submitted = false;
      dlg.querySelector('form').addEventListener('submit', function (e) {
        submitted = submitJob(dlg, apiClient, userId, options, this);
        e.preventDefault();
        return false;
      });
      var promise = _dialoghelper.default.open(dlg);
      renderForm({
        elem: dlg.querySelector('.formFields'),
        dialogOptions: dialogOptions,
        dialogOptionsFn: dialogOptionsFn,
        mode: options.mode,
        apiClient: apiClient
      });
      return promise.then(function () {
        if (submitted) {
          return Promise.resolve();
        }
        return Promise.reject();
      });
    });
  }
  function getTargetDialogOptionsFn(apiClient, query) {
    return function (targetId) {
      query.TargetId = targetId;

      //if (!targetId) {
      //    query.ExcludeTargetIds = apiClient.deviceId();
      //}

      return apiClient.getJSON(apiClient.getUrl('Sync/Options', query));
    };
  }
  function setQualityFieldVisible(form, visible) {
    var fldQuality = form.querySelector('.fldQuality');
    var selectQuality = form.querySelector('.selectQuality');
    if (visible) {
      if (fldQuality) {
        fldQuality.classList.remove('hide');
      }
      if (selectQuality) {
        //selectQuality.setAttribute('required', 'required');

        // This is a hack due to what appears to be a edge bug but it shoudln't matter as the list always has selectable items
        selectQuality.removeAttribute('required');
        onQualityChange(form, selectQuality.value);
      }
    } else {
      if (fldQuality) {
        fldQuality.classList.add('hide');
      }
      if (selectQuality) {
        selectQuality.removeAttribute('required');
      }
      onQualityChange(form, '');
    }
  }
  function onContainerChange() {
    var description = this.closest('.selectContainer').querySelector('.fieldDescription');
    description.innerHTML = _globalize.default.translate('VideoFilesWillBeConvertedTo', this.value);
  }
  function onVideoCodecChange() {
    var description = this.closest('.selectContainer').querySelector('.fieldDescription');
    var value = this.value;
    var values = value.split(',');
    if (values.length > 1) {
      description.innerHTML = _globalize.default.translate('VideoWillBeConvertedToOrCopied', values[0], value);
    } else {
      description.innerHTML = _globalize.default.translate('VideoWillBeConvertedTo', value);
    }
  }
  function onAudioCodecChange() {
    var description = this.closest('.selectContainer').querySelector('.fieldDescription');
    var value = this.value;
    var values = value.split(',');
    if (values.length > 1) {
      description.innerHTML = _globalize.default.translate('AudioWillBeConvertedToOrCopied', values[0], value);
    } else {
      description.innerHTML = _globalize.default.translate('AudioWillBeConvertedTo', value);
    }
  }
  function onProfileChange(form, profileId) {
    var options = currentDialogOptions || {};
    var profileOptions = options.ProfileOptions || [];
    var option = profileOptions.filter(function (o) {
      return o.Id === profileId;
    })[0];
    var qualityOptions = options.QualityOptions || [];
    if (option) {
      form.querySelector('.profileDescription').innerHTML = option.Description || '';
      setQualityFieldVisible(form, qualityOptions.length > 0 && option.EnableQualityOptions && options.Options.indexOf('Quality') !== -1);
    } else {
      form.querySelector('.profileDescription').innerHTML = '';
      setQualityFieldVisible(form, qualityOptions.length > 0 && options.Options.indexOf('Quality') !== -1);
    }
    var customProfileOptions = form.querySelector('.customProfileOptions');
    var customProfileSelects = customProfileOptions.querySelectorAll('select');
    var customProfileSelectsRequired = false;
    if (profileId === 'custom') {
      customProfileOptions.classList.remove('hide');
      customProfileSelectsRequired = true;
    } else {
      customProfileOptions.classList.add('hide');
    }
    for (var i = 0, length = customProfileSelects.length; i < length; i++) {
      if (customProfileSelectsRequired) {
        customProfileSelects[i].setAttribute('required', 'required');
      } else {
        customProfileSelects[i].removeAttribute('required');
      }
    }
  }
  function onQualityChange(form, qualityId) {
    var options = currentDialogOptions || {};
    var option = (options.QualityOptions || []).filter(function (o) {
      return o.Id === qualityId;
    })[0];
    var qualityDescription = form.querySelector('.qualityDescription');
    if (option) {
      qualityDescription.innerHTML = option.Description || '';
    } else {
      qualityDescription.innerHTML = '';
    }
    var fldBitrate = form.querySelector('.fldBitrate');
    var txtBitrate = form.querySelector('.txtBitrate');
    if (qualityId === 'custom') {
      if (fldBitrate) {
        fldBitrate.classList.remove('hide');
      }
      if (txtBitrate) {
        txtBitrate.setAttribute('required', 'required');
      }
    } else {
      if (fldBitrate) {
        fldBitrate.classList.add('hide');
      }
      if (txtBitrate) {
        txtBitrate.removeAttribute('required');
      }
    }
  }
  function renderTargetDialogOptions(form, options) {
    currentDialogOptions = options;
    var fldProfile = form.querySelector('.fldProfile');
    var selectProfile = form.querySelector('.selectProfile');
    var unwatchedOnlyToggleContainer = form.querySelector('.unwatchedOnlyToggleContainer');
    if (options.Options.includes('UnwatchedOnly')) {
      unwatchedOnlyToggleContainer == null || unwatchedOnlyToggleContainer.classList.remove('hide');
    } else {
      unwatchedOnlyToggleContainer == null || unwatchedOnlyToggleContainer.classList.add('hide');
    }
    if (options.ProfileOptions.length && options.Options.indexOf('Profile') !== -1) {
      if (fldProfile) {
        fldProfile.classList.remove('hide');
      }
      if (selectProfile) {
        selectProfile.setAttribute('required', 'required');
      }
    } else {
      if (fldProfile) {
        fldProfile.classList.add('hide');
      }
      if (selectProfile) {
        selectProfile.removeAttribute('required');
      }
    }
    setQualityFieldVisible(form, options.QualityOptions.length > 0);
    if (selectProfile) {
      selectProfile.innerHTML = options.ProfileOptions.map(function (o) {
        var selectedAttribute = o.IsDefault ? ' selected' : '';
        return '<option value="' + o.Id + '"' + selectedAttribute + '>' + o.Name + '</option>';
      }).join('');
      selectProfile.dispatchEvent(new CustomEvent('change', {
        bubbles: true
      }));
    }
    var selectQuality = form.querySelector('.selectQuality');
    if (selectQuality) {
      selectQuality.innerHTML = options.QualityOptions.map(function (o) {
        var selectedAttribute = o.IsDefault ? ' selected' : '';
        return '<option value="' + o.Id + '"' + selectedAttribute + '>' + o.Name + '</option>';
      }).join('');
      var lastQuality = _appsettings.default.get('sync-lastquality');
      if (lastQuality && options.QualityOptions.filter(function (i) {
        return i.Id === lastQuality;
      }).length) {
        selectQuality.value = lastQuality;
      }
      selectQuality.dispatchEvent(new CustomEvent('change', {
        bubbles: true
      }));
    }
  }
  function loadQualityOptions(form, targetId, dialogOptionsFn) {
    return dialogOptionsFn(targetId).then(function (options) {
      return renderTargetDialogOptions(form, options);
    });
  }
  var _default = _exports.default = {
    showMenu: showSyncMenu,
    renderForm: renderForm,
    setJobValues: setJobValues
  };
});
