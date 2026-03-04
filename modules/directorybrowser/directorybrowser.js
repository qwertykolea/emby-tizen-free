define(["exports", "./../emby-apiclient/connectionmanager.js", "./../common/globalize.js", "./../layoutmanager.js", "./../focusmanager.js", "./../loading/loading.js", "./../emby-elements/emby-scroller/emby-scroller.js", "./../emby-elements/emby-input/emby-input.js", "./../listview/listview.js", "./../emby-elements/emby-button/paper-icon-button-light.js", "./../emby-elements/emby-button/emby-button.js", "./../emby-elements/emby-dialogclosebutton/emby-dialogclosebutton.js", "./../dialoghelper/dialoghelper.js", "./../dom.js", "./../common/responsehelper.js"], function (_exports, _connectionmanager, _globalize, _layoutmanager, _focusmanager, _loading, _embyScroller, _embyInput, _listview, _paperIconButtonLight, _embyButton, _embyDialogclosebutton, _dialoghelper, _dom, _responsehelper) {
  Object.defineProperty(_exports, "__esModule", {
    value: true
  });
  _exports.default = void 0;
  /* jshint module: true */

  require(['formDialogStyle']);
  function onDialogClosed() {
    _loading.default.hide();
    this.destroy();
  }
  function getEditorHtml(options, apiClient, systemInfo) {
    var html = '';
    html += '<div is="emby-scroller" data-horizontal="false" data-forcescrollbar="true" data-focusscroll="true" class="formDialogContent">';
    html += '<div class="scrollSlider dialogContentInner dialog-content-centered padded-left padded-right flex flex-direction-column">';
    if (!options.pathReadOnly) {
      var instruction = options.instruction ? options.instruction + '<br/><br/>' : '';
      html += '<div class="infoBanner">';
      html += '<div class="infoBannerContent">';
      html += instruction;
      html += _globalize.default.translate('MessageDirectoryPickerInstruction').replace('{0}', '<b>\\\\server</b>').replace('{1}', '<b>\\\\192.168.1.101</b>');
      if ((systemInfo.PackageName || '').toLowerCase() === 'synology') {
        html += '<br/>';
        html += '<br/>';
        html += '<a is="emby-linkbutton" class="button-link" href="https://github.com/MediaBrowser/Wiki/wiki/Synology-:-Setting-Up-Your-Media-Library-Share" target="_blank">' + _globalize.default.translate('LearnHowToCreateSynologyShares') + '</a>';
      } else if (systemInfo.OperatingSystem.toLowerCase() === 'bsd') {
        html += '<br/>';
        html += '<br/>';
        html += _globalize.default.translate('MessageDirectoryPickerBSDInstruction');
        html += '<br/>';
        html += '<a is="emby-linkbutton" class="button-link" href="http://doc.freenas.org/9.3/freenas_jails.html#add-storage" target="_blank">' + _globalize.default.translate('LearnMore') + '</a>';
      } else if (systemInfo.OperatingSystem.toLowerCase() === 'linux') {
        html += '<br/>';
        html += '<br/>';
        html += _globalize.default.translate('MessageDirectoryPickerLinuxInstruction');
        html += '<br/>';
      }
      html += '</div>';
      html += '</div>';
    }
    html += '<form style="margin:0;" class="flex-grow">';
    html += '<div class="inputContainer flex align-items-center">';
    html += '<div class="flex-grow">';
    var labelKey = options.includeFiles !== true ? 'Folder' : 'LabelPath';
    var readOnlyAttribute = options.pathReadOnly ? ' readonly' : '';
    var autoCompleteAttribute = ' autocomplete="off" ';
    html += '<input is="emby-input" class="txtDirectoryPickerPath" type="text" required="required" ' + readOnlyAttribute + autoCompleteAttribute + ' label="' + _globalize.default.translate(labelKey) + '"/>';
    html += '</div>';
    if (!readOnlyAttribute) {
      html += '<button type="button" is="paper-icon-button-light" class="btnRefreshDirectories emby-input-iconbutton" title="' + _globalize.default.translate('Refresh') + '" aria-label="' + _globalize.default.translate('Refresh') + '"><i class="md-icon">refresh</i></button>';
    }
    html += '</div>';
    if (options.enableLoginCredentials && systemInfo.OperatingSystem.toLowerCase() !== 'windows' && apiClient.isMinServerVersion('4.8.0.40')) {
      html += '<div class="inputContainer fldUsername hide">';
      html += '<input is="emby-input" class="txtUsername" type="text" label="' + _globalize.default.translate('LabelUsername') + '"/>';
      html += '<div class="fieldDescription">';
      html += _globalize.default.translate('UsernameForFolderHelp');
      html += '</div>';
      html += '</div>';
      html += '<div class="inputContainer fldPassword hide">';
      html += '<input is="emby-input" class="txtPassword" type="password" label="' + _globalize.default.translate('LabelPassword') + '"/>';
      html += '<div class="fieldDescription">';
      html += _globalize.default.translate('PasswordForFolderHelp');
      html += '</div>';
      html += '</div>';
    }
    if (!readOnlyAttribute) {
      html += '<div is="emby-scroller" class="flex flex-direction-column listItems-border scrollFrameY flex-grow result-scroller flex-grow" style="max-height: 20em;margin:2em 0;" data-mousewheel="true" data-horizontal="false" data-focusscroll="adaptive" data-adaptivestartthreshold="30">' + '<div is="emby-itemscontainer" class="results itemsContainer scrollSlider flex-grow flex-direction-column focuscontainer navout-up navout-down"></div></div>';
    }
    if (options.enableNetworkSharePath) {
      html += '<div class="inputContainer">';
      html += '<input is="emby-input" class="txtNetworkPath" type="text" ' + autoCompleteAttribute + ' label="' + _globalize.default.translate('LabelOptionalNetworkPath') + '"/>';
      html += '<div class="fieldDescription">';
      html += _globalize.default.translate('LabelOptionalNetworkPathHelp');
      html += '</div>';
      html += '</div>';
    }
    html += '<div class="formDialogFooter">';
    html += '<button is="emby-button" type="submit" class="raised button-submit block formDialogFooterItem">' + _globalize.default.translate('ButtonOk') + '</button>';
    html += '</div>';
    html += '</form>';
    html += '</div>';
    html += '</div>';
    html += '</div>';
    return html;
  }
  function validatePath(path, validateWriteable, username, password, apiClient) {
    return apiClient.ajax({
      type: 'POST',
      url: apiClient.getUrl("Environment/ValidatePath"),
      data: {
        ValidateWriteable: validateWriteable,
        Path: path,
        Username: username,
        Password: password
      }
    }).catch(_responsehelper.default.handleErrorResponse);
  }
  function initEditor(instance, content, options, apiClient, fileOptions) {
    var btnRefreshDirectories = content.querySelector('.btnRefreshDirectories');
    if (btnRefreshDirectories) {
      btnRefreshDirectories.addEventListener("click", function (e) {
        var _content$querySelecto, _content$querySelecto2;
        instance.path = content.querySelector('.txtDirectoryPickerPath').value;
        instance.username = (_content$querySelecto = content.querySelector('.txtUsername')) == null ? void 0 : _content$querySelecto.value;
        instance.password = (_content$querySelecto2 = content.querySelector('.txtPassword')) == null ? void 0 : _content$querySelecto2.value;
        instance.itemsContainer.resume({
          refresh: true
        }).catch(_responsehelper.default.handleErrorResponse);
      });
    }
    function onPathTextChange(e) {
      var value = this.value;
      var enableAuth = value && (value.startsWith('\\\\') || value.toLowerCase().startsWith('smb://'));
      var fldUsername = content.querySelector('.fldUsername');
      var fldPassword = content.querySelector('.fldPassword');
      if (enableAuth) {
        if (fldUsername) {
          fldUsername.classList.remove('hide');
        }
        if (fldPassword) {
          fldPassword.classList.remove('hide');
        }
      } else {
        if (fldUsername) {
          fldUsername.classList.add('hide');
        }
        if (fldPassword) {
          fldPassword.classList.add('hide');
        }
      }
    }
    content.querySelector('.txtDirectoryPickerPath').addEventListener("change", onPathTextChange);
    content.querySelector('.txtDirectoryPickerPath').addEventListener("input", onPathTextChange);
    content.querySelector('form').addEventListener('submit', function (e) {
      if (options.callback) {
        var _this$querySelector, _this$querySelector2, _this$querySelector3;
        var path = this.querySelector('.txtDirectoryPickerPath').value;
        var username = ((_this$querySelector = this.querySelector('.txtUsername')) == null ? void 0 : _this$querySelector.value) || null;
        var password = ((_this$querySelector2 = this.querySelector('.txtPassword')) == null ? void 0 : _this$querySelector2.value) || null;
        var networkSharePath = ((_this$querySelector3 = this.querySelector('.txtNetworkPath')) == null ? void 0 : _this$querySelector3.value) || null;
        validatePath(path, options.validateWriteable, username, password, apiClient).then(function () {
          options.callback(path, networkSharePath, username, password);
        });
      }
      e.preventDefault();
      e.stopPropagation();
      return false;
    });
  }
  function getDefaultPath(options, apiClient) {
    if (options.path) {
      return Promise.resolve(options.path);
    }
    return apiClient.getJSON(apiClient.getUrl("Environment/DefaultDirectoryBrowser")).then(function (result) {
      return result.Path || '';
    }, function () {
      return '';
    });
  }
  function onItemAction(e) {
    var instance = this;
    var item = e.detail.item;
    var path = item.Path;
    if (item.FileType === 'File') {
      instance.dlg.querySelector('.txtDirectoryPickerPath').value = path;
      instance.dlg.querySelector('.txtDirectoryPickerPath').dispatchEvent(new CustomEvent('change', {
        bubbles: true
      }));
    } else {
      var _instance$dlg$querySe, _instance$dlg$querySe2;
      instance.path = path;
      instance.username = (_instance$dlg$querySe = instance.dlg.querySelector('.txtUsername')) == null ? void 0 : _instance$dlg$querySe.value;
      instance.password = (_instance$dlg$querySe2 = instance.dlg.querySelector('.txtPassword')) == null ? void 0 : _instance$dlg$querySe2.value;
      instance.itemsContainer.resume({
        refresh: true
      });
    }
  }
  function getItems(query) {
    var path = this.path;
    if (path && typeof path !== 'string') {
      return Promise.resolve({
        Items: [],
        TotalRecordCount: 0
      });
    }
    var instance = this;
    if (instance.options.pathReadOnly) {
      return Promise.resolve({
        Items: [],
        TotalRecordCount: 0
      });
    }
    var apiClient = this.apiClient;
    var fileOptions = this.fileOptions;
    var promises = [];
    if (path === "Network") {
      promises.push(apiClient.getNetworkDevices());
    } else if (path) {
      var options = Object.assign({}, fileOptions);
      options.username = this.username;
      options.password = this.password;
      promises.push(apiClient.getDirectoryContents(path, options));
      promises.push(apiClient.getParentPath(path));
    } else {
      promises.push(apiClient.getDrives());
    }
    return Promise.all(promises).then(function (responses) {
      var folders = responses[0];
      var parentPath = responses[1] || '';
      instance.dlg.querySelector('.txtDirectoryPickerPath').value = path || "";
      var items = [];
      if (path) {
        items.push({
          Path: parentPath,
          Name: '.. [' + _globalize.default.translate('Back') + ']',
          Icon: 'arrow_back'
        });
      }
      items = items.concat(folders.map(function (f) {
        return {
          Path: f.Path,
          Name: f.Name,
          FileType: f.Type,
          Icon: f.Type === 'File' ? 'description' : 'folder'
        };
      }));
      if (!path) {
        items.push({
          Path: "Network",
          Name: _globalize.default.translate('Network'),
          Icon: 'wifi'
        });
      }
      for (var i = 0, length = items.length; i < length; i++) {
        items[i].Type = 'GenericListItem';
        items[i].ServerId = apiClient.serverId();
        switch (items[i].FileType) {
          case 'File':
            break;
          default:
            items[i].asideIcon = '&#xe5cc;';
            break;
        }
      }
      _loading.default.hide();
      return Promise.resolve({
        Items: items,
        TotalRecordCount: items.length
      });
    });
  }
  function getListOptions(items) {
    return {
      renderer: _listview.default,
      options: {
        enableDefaultIcon: true,
        action: 'custom',
        fields: ['Name'],
        draggable: false,
        draggableXActions: false,
        multiSelect: false,
        contextMenu: false,
        hoverPlayButton: false,
        enableUserDataButtons: false,
        mediaInfo: false,
        defaultBackground: false,
        // this won't really work well when the list itself has a border
        enableFocusScaling: false,
        allowBorderXOffset: false,
        playQueueIndicator: false
      },
      virtualScrollLayout: 'vertical-list'
    };
  }
  function autoFocus() {
    var context = this.dlg;
    _focusmanager.default.autoFocus(context, {
      skipIfNotEnabled: true
    });
  }
  function onItemsContainerUpgraded() {
    this.itemsContainer.resume({
      refresh: true
    }).then(autoFocus.bind(this));
  }
  function onOpened() {
    var itemsContainer = this.itemsContainer;
    if (!itemsContainer) {
      return;
    }
    if (itemsContainer.resume) {
      onItemsContainerUpgraded.call(this);
    } else {
      _dom.default.addEventListener(itemsContainer, 'upgraded', onItemsContainerUpgraded.bind(this), {
        once: true
      });
    }
  }
  function afterRefresh() {
    var scroller = this.dlg.querySelector('.result-scroller');
    scroller.scrollToBeginning({
      behavior: 'instant'
    });
  }
  function DirectoryBrowser() {}
  DirectoryBrowser.prototype.show = function (options) {
    if (!options) {
      options = {};
    }
    var fileOptions = {
      includeDirectories: true
    };
    if (options.includeDirectories != null) {
      fileOptions.includeDirectories = options.includeDirectories;
    }
    if (options.includeFiles != null) {
      fileOptions.includeFiles = options.includeFiles;
    }
    var apiClient = _connectionmanager.default.currentApiClient();
    var instance = this;
    instance.fileOptions = fileOptions;
    instance.apiClient = apiClient;
    instance.options = options;
    return Promise.all([apiClient.getSystemInfo(), getDefaultPath(options, apiClient)]).then(function (responses) {
      var systemInfo = responses[0];
      var initialPath = responses[1];
      var dlg = _dialoghelper.default.createDialog({
        size: _layoutmanager.default.tv ? 'fullscreen' : 'medium-tall',
        removeOnClose: true,
        scrollY: false
      });
      instance.dlg = dlg;
      dlg.classList.add('ui-body-a');
      dlg.classList.add('background-theme-a');
      dlg.classList.add('directoryPicker');
      dlg.classList.add('formDialog');
      var html = '';
      html += '<div class="formDialogHeader">';
      html += '<button type="button" is="emby-dialogclosebutton"></button>';
      html += '<h3 class="formDialogHeaderTitle">';
      html += options.header || _globalize.default.translate('HeaderSelectPath');
      html += '</h3>';
      html += '</div>';
      html += getEditorHtml(options, apiClient, systemInfo);
      dlg.innerHTML = html;
      initEditor(instance, dlg, options, apiClient, fileOptions);
      dlg.addEventListener('close', onDialogClosed.bind(instance));
      var itemsContainer = dlg.querySelector('.itemsContainer');
      if (itemsContainer) {
        itemsContainer.addEventListener('action-null', onItemAction.bind(instance));
        itemsContainer.fetchData = getItems.bind(instance);
        itemsContainer.afterRefresh = afterRefresh.bind(instance);
        itemsContainer.getListOptions = getListOptions;
        instance.itemsContainer = itemsContainer;
      }
      var txtCurrentPath = dlg.querySelector('.txtDirectoryPickerPath');
      txtCurrentPath.value = initialPath;
      instance.path = initialPath;
      var txtNetworkPath = dlg.querySelector('.txtNetworkPath');
      if (txtNetworkPath) {
        txtNetworkPath.value = options.networkSharePath || '';
      }
      var txtUsername = dlg.querySelector('.txtUsername');
      if (txtUsername) {
        txtUsername.value = options.username || '';
      }
      instance.username = options.username;
      var txtPassword = dlg.querySelector('.txtPassword');
      if (txtPassword) {
        txtPassword.value = options.password || '';
      }
      instance.password = options.password;
      _dialoghelper.default.open(dlg);
      txtCurrentPath.dispatchEvent(new CustomEvent('change', {
        bubbles: true
      }));
      dlg.addEventListener('opened', onOpened.bind(instance));
    });
  };
  DirectoryBrowser.prototype.close = function () {
    if (this.dlg) {
      _dialoghelper.default.close(this.dlg);
    }
  };
  DirectoryBrowser.prototype.destroy = function () {
    this.itemsContainer = null;
    this.dlg = null;
    this.path = null;
    this.options = null;
    this.fileOptions = null;
    this.apiClient = null;
  };
  var _default = _exports.default = DirectoryBrowser;
});
