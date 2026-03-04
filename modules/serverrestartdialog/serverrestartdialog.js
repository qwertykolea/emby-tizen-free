define(["exports", "./../dialoghelper/dialoghelper.js", "./../layoutmanager.js", "./../common/globalize.js", "./../loading/loading.js", "./../common/servicelocator.js", "./../emby-elements/emby-button/emby-button.js", "./../emby-elements/emby-button/paper-icon-button-light.js", "./../emby-elements/emby-scroller/emby-scroller.js"], function (_exports, _dialoghelper, _layoutmanager, _globalize, _loading, _servicelocator, _embyButton, _paperIconButtonLight, _embyScroller) {
  Object.defineProperty(_exports, "__esModule", {
    value: true
  });
  _exports.default = void 0;
  /* jshint module: true */

  require(['material-icons', 'formDialogStyle', 'flexStyles']);
  function reloadPageWhenServerAvailable(instance) {
    var apiClient = instance.apiClient;
    if (!apiClient) {
      return;
    }

    // Don't use apiclient method because we don't want it reporting authentication under the old version
    apiClient.getJSON(apiClient.getUrl("System/Info")).then(function (info) {
      // If this is back to false, the restart completed
      if (!info.IsShuttingDown) {
        instance.restarted = true;
        _dialoghelper.default.close(instance.dlg);
      } else {
        retryReload(instance);
      }
    }, function () {
      retryReload(instance);
    });
  }
  var MaxWaitMinutes = 5;
  function retryReload(instance) {
    setTimeout(function () {
      if (Date.now() < instance.waitStartTime + MaxWaitMinutes * 60 * 1000) {
        reloadPageWhenServerAvailable(instance);
      }
    }, 500);
  }
  function startRestart(instance, apiClient, dlg) {
    instance.apiClient = apiClient;
    instance.dlg = dlg;
    apiClient.restartServer().then(function () {
      instance.waitStartTime = Date.now();
      retryReload(instance);
    });
  }
  function showDialog(instance, options, template) {
    var dialogOptions = {
      removeOnClose: true,
      scrollY: false
    };
    var enableTvLayout = _layoutmanager.default.tv;
    if (enableTvLayout) {
      dialogOptions.size = 'fullscreen';
    }
    var dlg = _dialoghelper.default.createDialog(dialogOptions);
    var configuredButtons = [];
    dlg.classList.add('formDialog');
    dlg.innerHTML = _globalize.default.translateHtml(template, 'sharedcomponents');
    dlg.classList.add('align-items-center');
    dlg.classList.add('justify-items-center');
    var formDialogContent = dlg.querySelector('.formDialogContent');
    formDialogContent.style['flex-grow'] = 'initial';
    if (enableTvLayout) {
      formDialogContent.style['max-width'] = '50%';
      formDialogContent.style['max-height'] = '60%';
    } else {
      dlg.style.maxWidth = '25em';
    }

    //dlg.querySelector('.btnCancel').addEventListener('click', function (e) {
    //    dialogHelper.close(dlg);
    //});

    dlg.querySelector('.formDialogHeaderTitle').innerHTML = _globalize.default.translate('HeaderRestartingEmbyServer');
    dlg.querySelector('.dialogContentInner').innerHTML = _globalize.default.translate('RestartPleaseWaitMessage');
    var i, length;
    var html = '';
    for (i = 0, length = configuredButtons.length; i < length; i++) {
      var item = configuredButtons[i];
      var buttonClass = 'btnOption raised formDialogFooterItem formDialogFooterItem-autosize';
      if (item.type) {
        buttonClass += ' button-' + item.type;
      }
      html += '<button is="emby-button" type="button" class="' + buttonClass + '" data-id="' + item.id + '">' + item.name + '</button>';
    }
    dlg.querySelector('.formDialogFooter').innerHTML = html;
    function onButtonClick() {
      _dialoghelper.default.close(dlg);
    }
    var buttons = dlg.querySelectorAll('.btnOption');
    for (i = 0, length = buttons.length; i < length; i++) {
      buttons[i].addEventListener('click', onButtonClick);
    }
    var dlgPromise = _dialoghelper.default.open(dlg);
    startRestart(instance, options.apiClient, dlg);
    return dlgPromise.then(function () {
      instance.destroy();
      _loading.default.hide();
      if (instance.restarted) {
        if (_servicelocator.appHost.supports('multiserver')) {
          options.apiClient.ensureWebSocket();
        } else {
          window.location.reload(true);
        }
      }
    });
  }
  function ServerRestartDialog(options) {
    this.options = options;
  }
  ServerRestartDialog.prototype.show = function () {
    var instance = this;
    _loading.default.show();
    return new Promise(function (resolve, reject) {
      require(['dialogTemplateHtml'], function (template) {
        showDialog(instance, instance.options, template).then(resolve, reject);
      });
    });
  };
  ServerRestartDialog.prototype.destroy = function () {
    this.options = null;
  };
  var _default = _exports.default = ServerRestartDialog;
});
