define(["exports", "./../emby-apiclient/connectionmanager.js", "./../viewmanager/basesettingsview.js", "./../emby-elements/emby-button/emby-button.js", "./../emby-elements/emby-dialogclosebutton/emby-dialogclosebutton.js", "./../appheader/appheader.js", "./../common/globalize.js", "./../layoutmanager.js", "./../genericedit/genericedit.js", "./../loading/loading.js", "./../dialoghelper/dialoghelper.js", "./../emby-apiclient/events.js", "./../common/input/api.js", "./../common/responsehelper.js", "./../maintabsmanager.js", "./../emby-elements/emby-scroller/emby-scroller.js", "./../focusmanager.js"], function (_exports, _connectionmanager, _basesettingsview, _embyButton, _embyDialogclosebutton, _appheader, _globalize, _layoutmanager, _genericedit, _loading, _dialoghelper, _events, _api, _responsehelper, _maintabsmanager, _embyScroller, _focusmanager) {
  Object.defineProperty(_exports, "__esModule", {
    value: true
  });
  _exports.default = void 0;
  /* jshint module: true */

  require(['css!modules/genericui/genericui.css']);
  var infoChangedEventName = 'UIPageInfoChanged';
  var currentViewData;
  var currentPage;
  var currentDlg;
  var isDataValid;
  function showConfirm(options) {
    return Emby.importModule('./modules/common/dialogs/confirm.js').then(function (confirm) {
      return confirm(options);
    });
  }
  function dashboardConfirm(message, title, callback) {
    showConfirm(message, title).then(function () {
      callback(true);
    }, function () {
      callback(false);
    });
  }
  function postCommand(pageId, commandId, data, itemId) {
    var apiClient = _connectionmanager.default.currentApiClient();
    var url = apiClient.getUrl('UI/Command');
    return apiClient.ajax({
      type: "POST",
      url: url,
      data: JSON.stringify({
        PageId: pageId,
        CommandId: commandId,
        Data: data,
        ItemId: itemId,
        ClientLocale: _globalize.default.getCurrentLocale()
      }),
      contentType: 'application/json',
      dataType: "json"
    });
  }
  function onServerEvent(e, apiClient, updatedData) {
    if (e.type !== infoChangedEventName || !currentViewData || !updatedData || updatedData.PageId !== currentViewData.PageId) {
      return;
    }
    if (updatedData.ViewId === currentViewData.ViewId) {
      if (updatedData.IsPageChangeInfo) {
        return;
      }
      currentViewData = updatedData;
      var containerElement = currentDlg || currentPage;
      var mainContent = containerElement.querySelector('.mainContent');
      updatePageData(updatedData, containerElement, updatedData.EditObjectContainer, mainContent, currentViewData.EditObjectContainer.Object, currentViewData.EditObjectContainer.DefaultObject);
    } else if (updatedData.IsPageChangeInfo) {
      showStage(updatedData, currentPage);
    }
  }
  function onInvalid(e) {
    if (e.target.offsetParent === null) {
      return;
    }
    isDataValid = false;
  }
  function onButtonClick(e) {
    var button = e.target.closest('BUTTON');
    if (!button) {
      button = e.target.closest('INPUT');
      if (button) {
        var test = button.getAttribute('data-data1');
        if (!test) {
          button = null;
        }
      }
    }
    if (!e.Data1 && (!button || button.hasAttribute('disabled'))) {
      return;
    }
    e.preventDefault();
    var commandId = e.Data1 || (button ? button.getAttribute('data-data1') : null);
    var itemId = e.Data2 || (button ? button.getAttribute('data-data2') : null);
    var confirmationPrompt = e.ConfirmationPrompt || (button ? button.getAttribute('data-prompt') : null);
    var caption = e.Caption || (button ? button.getAttribute('data-caption') : '');
    if (!commandId) {
      return;
    }
    e.stopPropagation();
    var data = null;
    if (_genericedit.default.runCommand(commandId, (currentDlg || currentPage).querySelector('.mainContent'), itemId)) {
      return;
    }
    if (currentViewData.EditObjectContainer) {
      var containerElement = currentDlg || currentPage;
      var mainContent = containerElement.querySelector('.mainContent');
      _genericedit.default.getItemValues(currentViewData.EditObjectContainer, mainContent);
      data = JSON.stringify(currentViewData.EditObjectContainer.Object);
      if (commandId === 'WizardNext' || commandId === 'WizardFinish' || commandId === 'DialogOk' || commandId === 'PageSave') {
        var form = mainContent.closest('FORM');
        if (form) {
          isDataValid = true;
          form.reportValidity();
          if (!isDataValid || currentViewData.EditObjectContainer.isDataValid === false) {
            return;
          }
        }
      }
    }
    function wrapRunCommand(run) {
      if (run) {
        runUiCommand(currentViewData.PageId, currentViewData.ViewType, commandId, data, itemId).then(function () {}, _responsehelper.default.handleErrorResponse);
      }
    }
    if (confirmationPrompt) {
      dashboardConfirm(confirmationPrompt, caption, wrapRunCommand);
    } else {
      wrapRunCommand(true);
    }
  }
  function formatDescription(description) {
    if (!description || description.length === 0) {
      return null;
    }
    description = description.split('\n').join('<br />');
    return description;
  }
  function updatePageData(stage, page, container, htmlElement) {
    _genericedit.default.setFormValues(container, htmlElement);
    var mainTitle = page.querySelector('.mainTitle');
    if (mainTitle) {
      mainTitle.innerHTML = stage.Caption;
    }
    var mainSubTitle = page.querySelector('.mainSubTitle');
    if (mainSubTitle && stage.SubCaption) {
      mainSubTitle.innerHTML = formatDescription(stage.SubCaption);
    }
    var buttons = (page.closest('.dialog') || page).querySelectorAll('.btnButtonItem, .wizardbutton, .pagebutton, .dialogHeaderButton');
    for (var n = 0; n < buttons.length; n++) {
      var btn = buttons[n];
      var btnCommand = btn.getAttribute('data-data1');
      for (var i = 0; i < stage.Commands.length; i++) {
        var cmd = stage.Commands[i];
        if (btnCommand === cmd.CommandType) {
          if (cmd.IsVisible) {
            btn.classList.remove('genericeditbutton-hide');
            if (btn.parentElement.classList.contains('formDialogFooterItem')) {
              btn.parentElement.classList.remove('hide');
            }
          } else {
            btn.classList.add('genericeditbutton-hide');
            if (btn.parentElement.classList.contains('formDialogFooterItem')) {
              btn.parentElement.classList.add('hide');
            }
          }
          if (cmd.IsEnabled && (btn.classList.contains('btnOk') || btn.classList.contains('btnSave'))) {
            btn.classList.add('button-submit');
          } else {
            btn.classList.remove('button-submit');
          }
          if (btnCommand === 'WizardNext' && cmd.IsEnabled && btn.disabled) {
            var nextBtn = btn;
            _focusmanager.default.focus(nextBtn);
          } else if (btnCommand === 'WizardNext' && cmd.IsEnabled && cmd.SetFocus && !btn.hasAttribute('focusSet')) {
            btn.setAttribute('focusSet', 'true');
            var _nextBtn = btn;
            _focusmanager.default.focus(_nextBtn);
          }
          if (btnCommand === 'WizardFinish' && cmd.IsEnabled && cmd.SetFocus && !btn.hasAttribute('focusSet')) {
            btn.setAttribute('focusSet', 'true');
            var finshBtn = btn;
            _focusmanager.default.focus(finshBtn);
          }
          btn.disabled = !cmd.IsEnabled;
          if (cmd.Caption) {
            // avoid doing this for icon buttons
            if (btn.classList.contains('raised')) {
              btn.innerText = cmd.Caption;
            }
          }
        }
      }
    }
  }
  function onDialogQueryClose(dlg, forceClose) {
    var btnDialogCancel = dlg.querySelector('.btnDialogCancel:not(.genericeditbutton-hide)');
    if (btnDialogCancel) {
      btnDialogCancel.click();
      return false;
    }
    function onCloseConfirm() {
      _dialoghelper.default.close(dlg);
      if (currentDlg && currentDlg !== dlg) {
        _dialoghelper.default.close(currentDlg);
      }
      currentDlg = null;
    }
    if (forceClose) {
      onCloseConfirm();
      return false;
    }
    dashboardConfirm('Do you want to hide the dialog?\n' + 'It will remain active and you can return through the buttons at the right or bottom.\n' + 'Press "Cancel" and use the dialog buttons to close.', 'Hide Dialog Only?', function (pressedOk) {
      if (pressedOk) {
        onCloseConfirm();
      }
    });
    return false;
  }
  function showWizardPageInternal(setupStage, editObjectContainer, template, genericeditor) {
    var dialogOptions = {
      removeOnClose: true,
      scrollY: true,
      size: _layoutmanager.default.tv ? 'fullscreen' : 'small',
      enableHistory: false,
      autoFocus: true,
      queryCloseHandler: onDialogQueryClose
    };
    if (setupStage.ShowDialogFullScreen) {
      dialogOptions.scrollY = false;
      dialogOptions.size = 'fullscreen';
    }
    var dlg = _dialoghelper.default.createDialog(dialogOptions);
    dlg.classList.add('formDialog');
    dlg.innerHTML = _globalize.default.translateDocument(template[0]);
    var isFullScreenGrid = setupStage.ShowDialogFullScreen;
    var mainContent = dlg.querySelector('.mainContent');
    if (isFullScreenGrid) {
      mainContent.style.height = '100%';
      var dialogForm = dlg.querySelector('.dialogForm');
      dialogForm.style.maxWidth = 'none';
      dialogForm.style.height = '100%';
      var dialogContentInner = dlg.querySelector('.dialogContentInner');
      dialogContentInner.classList.remove('dialog-content-centered', 'padded-left', 'padded-right');
      dialogContentInner.style.paddingTop = '0';
      dialogContentInner.style.paddingBottom = '0';
      dialogContentInner.style.height = '100%';
      dialogContentInner.parentNode.style.height = '100%';
      dlg.querySelector('.formDialogContent').style.overflow = 'hidden';
    }
    if (setupStage.ViewType === "Wizard") {
      var btnOk = dlg.querySelector('.btnOk');
      btnOk.parentNode.removeChild(btnOk);
      dlg.querySelector('.formDialogFooter').classList.add('formDialogFooter-wizard');
    }
    var wizardButtons = dlg.querySelectorAll('.wizardbutton');
    for (var n = 0; n < wizardButtons.length; n++) {
      var btn = wizardButtons.item(n);
      btn.setAttribute('data-data2', setupStage.PluginId);
      btn.addEventListener('click', onButtonClick);
    }
    mainContent.removeEventListener('click', onButtonClick);
    mainContent.removeEventListener('invalid', onInvalid);
    return genericeditor.renderForm(editObjectContainer, mainContent).then(function () {
      mainContent.addEventListener('click', onButtonClick);
      mainContent.addEventListener('invalid', onInvalid, {
        capture: true
      });

      ////let data = null;
      ////if (editObjectContainer && editObjectContainer.Value && editObjectContainer.Value.length > 0) {
      ////    data = JSON.parse(editObjectContainer.Value);
      ////}

      ////let defaultData = null;
      ////if (editObjectContainer && editObjectContainer.DefaultValue && editObjectContainer.DefaultValue.length > 0) {
      ////    defaultData = JSON.parse(editObjectContainer.DefaultValue);
      ////}

      updatePageData(setupStage, dlg, editObjectContainer, mainContent);
      _loading.default.hide();
      checkCloseDialog();
      currentDlg = dlg;
      _dialoghelper.default.open(dlg);
      return Promise.resolve();
    });
  }
  function checkCloseDialog() {
    if (currentDlg) {
      _dialoghelper.default.close(currentDlg);
      currentDlg = null;
    }
  }
  function isPageBackEnabled(stage) {
    for (var i = 0; i < stage.Commands.length; i++) {
      var cmd = stage.Commands[i];
      if (cmd.CommandType === 'PageBack') {
        return cmd.IsVisible === true;
      }
    }
    return false;
  }
  function runUiCommand(pageId, viewType, commandId, data, itemId) {
    _loading.default.show();
    return postCommand(pageId, commandId, data, itemId).then(function (setupStage) {
      if (commandId === 'PageSave') {
        _responsehelper.default.handleConfigurationSavedResponse();
      }
      if (setupStage.RedirectViewUrl) {
        checkCloseDialog(false);
        var url = setupStage.RedirectViewUrl;
        Emby.importModule('./modules/approuter.js').then(function (appRouter) {
          appRouter.show(url);
        });
      } else if (setupStage.PageId !== pageId || setupStage.ViewId !== currentViewData.ViewId) {
        return showStage(setupStage, currentPage);
      }
      _loading.default.hide();
      currentViewData = setupStage;
      var containerElement = currentDlg || currentPage;
      var mainContent = containerElement.querySelector('.mainContent');
      updatePageData(setupStage, containerElement, setupStage.EditObjectContainer, mainContent, currentViewData.EditObjectContainer.Object, currentViewData.EditObjectContainer.DefaultObject);
      return Promise.resolve();
    });
  }
  function setTitle(view, title) {
    var elem = view.querySelector(".mainTitle");
    if (elem) {
      elem.innerText = title;
    }
  }
  function setTabs(viewData, view) {
    if (viewData.TabPageInfos && viewData.TabPageInfos.length > 1) {
      view.classList.add('withTabs');
      var tabs = viewData.TabPageInfos;
      var currentIndex = 0;
      for (var i = 0; i < tabs.length; i++) {
        tabs[i].name = tabs[i].DisplayName;
        tabs[i].href = tabs[i].Href;
        tabs[i].navMenuId = tabs[i].NavKey;
        tabs[i].index = i;
        if (tabs[i].PageId === viewData.PageId) {
          currentIndex = i;
          ////e.detail.navMenuId = '/' + tabs[0].href;
          setTitle(view, tabs[i].name);
        }
      }
      _maintabsmanager.default.setTabs(view, currentIndex, function () {
        return tabs;
      });
    } else {
      view.classList.remove('withTabs');
    }
  }
  function showStageInPlace(viewData, page) {
    setTabs(viewData, page);
    _appheader.default.setTitle(viewData.Caption || '');
    var mainContentParent = page.querySelector('.mainContentParent');
    var mainContent = page.querySelector('.mainContent');
    var editObjectContainer = viewData.EditObjectContainer;
    var pageButtons = mainContentParent.querySelectorAll('.pagebutton');
    for (var n = 0; n < pageButtons.length; n++) {
      var btn = pageButtons.item(n);
      btn.setAttribute('data-data2', viewData.PluginId);
      btn.addEventListener('click', onButtonClick);
    }
    mainContent.removeEventListener('click', onButtonClick);
    mainContent.removeEventListener('invalid', onInvalid);
    editObjectContainer.EditorRoot.DisplayName = null;
    editObjectContainer.EditorRoot.Description = null;
    return _genericedit.default.renderForm(editObjectContainer, mainContent).then(function () {
      mainContent.addEventListener('click', onButtonClick);
      mainContent.addEventListener('invalid', onInvalid, {
        capture: true
      });
      updatePageData(viewData, page, editObjectContainer, mainContent);
      _loading.default.hide();
      return Promise.resolve();
    });
  }
  function showStageWizard(setupStage) {
    return new Promise(function (resolve, reject) {
      require(['text!modules/genericui/wizardpage.template.html']).then(function (template) {
        showWizardPageInternal(setupStage, setupStage.EditObjectContainer, template, _genericedit.default).then(resolve, reject);
      });
    });
  }
  function showStage(viewData, page) {
    currentPage = page || currentPage;
    currentViewData = viewData;
    if (viewData.ViewType === 'Wizard' || viewData.ViewType === 'Dialog') {
      return showStageWizard(viewData);
    }
    checkCloseDialog(false);
    return showStageInPlace(viewData, currentPage);
  }
  function getPageView(pageId) {
    var apiClient = _connectionmanager.default.currentApiClient();
    var url = apiClient.getUrl('UI/View', {
      PageId: pageId,
      ClientLocale: _globalize.default.getCurrentLocale()
    });
    return apiClient.getJSON(url);
  }

  // **********************************************************************************************************

  function View(view, params) {
    _basesettingsview.default.apply(this, arguments);
    var pageId = (params ? params.PageId : null) || '';
    if (!pageId.length) {
      var err = {
        message: 'No page id was specified. Cannot load page!'
      };
      _responsehelper.default.handleErrorResponse(err);
      return;
    }
    getPageView(pageId).then(function (viewData) {
      showStage(viewData, view);
    }, _responsehelper.default.handleErrorResponse);
    _events.default.on(_api.default, infoChangedEventName, onServerEvent);
  }
  Object.assign(View.prototype, _basesettingsview.default.prototype);
  View.prototype.onInputCommand = function (e) {
    var command = e.detail.command;
    switch (command) {
      case 'back':
        if (isPageBackEnabled(currentViewData)) {
          runUiCommand(currentViewData.PageId, currentViewData.ViewType, 'PageBack', null, null).then(function () {}, _responsehelper.default.handleErrorResponse);
          e.preventDefault();
          return;
        }
        break;
      default:
        break;
    }
    _basesettingsview.default.prototype.onInputCommand.apply(this, arguments);
  };
  View.prototype.onResume = function (options) {
    _basesettingsview.default.prototype.onResume.apply(this, arguments);
    _events.default.on(_api.default, infoChangedEventName, onServerEvent);
  };
  View.prototype.onPause = function () {
    _events.default.off(_api.default, infoChangedEventName, onServerEvent);
    _basesettingsview.default.prototype.onPause.apply(this, arguments);
  };
  View.prototype.destroy = function () {
    _basesettingsview.default.prototype.destroy.apply(this, arguments);
    _events.default.off(_api.default, infoChangedEventName, onServerEvent);
  };
  var _default = _exports.default = View;
});
