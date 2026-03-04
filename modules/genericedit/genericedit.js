define(["exports", "./../common/globalize.js", "./../layoutmanager.js", "./../focusmanager.js", "./../emby-elements/emby-input/emby-input.js", "./../emby-elements/emby-textarea/emby-textarea.js", "./../emby-elements/emby-button/emby-button.js", "./../emby-elements/emby-select/emby-select.js", "./../emby-elements/emby-multilineselect/emby-multilineselect.js", "./../emby-elements/emby-radio/emby-radio.js", "./../emby-elements/emby-toggle/emby-toggle.js", "./../emby-elements/emby-premierecontainer/emby-premierecontainer.js", "./../emby-elements/emby-button/paper-icon-button-light.js", "./../listview/listview.js"], function (_exports, _globalize, _layoutmanager, _focusmanager, _embyInput, _embyTextarea, _embyButton, _embySelect, _embyMultilineselect, _embyRadio, _embyToggle, _embyPremierecontainer, _paperIconButtonLight, _listview) {
  Object.defineProperty(_exports, "__esModule", {
    value: true
  });
  _exports.default = void 0;
  /* jshint module: true */

  require(['formDialogStyle', 'flexStyles', 'material-icons', 'css!legacy/dashboard.css', 'css!modules/genericedit/genericedit.css']);
  var statusColorNone = 'transparent';
  var statusColorOk = '#8bc34a';
  var statusColorWarning = '#ffc107';
  var statusColorError = '#f44336';
  var statusColorDisabled = '#919191';
  var statusColorGhosted = '#dcdcdc';
  function showActionSheet(options) {
    return Emby.importModule('./modules/actionsheet/actionsheet.js').then(function (ActionSheet) {
      return ActionSheet.show(options);
    });
  }
  var genericEditDx = null;
  function checkGetDx(editorRoot) {
    if (genericEditDx || !isDxRequired(editorRoot)) {
      return Promise.resolve();
    }

    // For local work
    ////return require(['modules/genericedit/genericedit_dx.js'], function (result) {
    ////    genericEditDx = result;
    ////    return Promise.resolve();
    ////});

    return require(['https://mediabrowser.github.io/genericedit_dx/genericedit_dx.js'], function (result) {
      genericEditDx = result;
      return Promise.resolve();
    });
  }
  var customEditors = {};
  function getEditor(type) {
    return customEditors[type];
  }
  function registerEditor(type, editor) {
    customEditors[type] = editor;
  }
  var commandProcessors = {};
  function getCommandProcessor(commandId) {
    return commandProcessors[commandId];
  }
  function registerCommandProcessor(commandId, processor) {
    commandProcessors[commandId] = processor;
  }
  function runCommand(commandId, element, itemId) {
    var processor = getCommandProcessor(commandId);
    if (processor) {
      processor(element, itemId);
      return true;
    }
    return false;
  }
  function actionSheetHandler(e) {
    var innerListItem = e.target.closest('.listItem-inner');
    if (innerListItem && !innerListItem.classList.contains('focusable')) {
      if (!document.activeElement || !innerListItem.contains(document.activeElement) || innerListItem === document.activeElement) {
        _focusmanager.default.autoFocus(innerListItem, {
          findAutoFocusElement: false
        });
      }
    }
    if (e.Data1) {
      return true;
    }
    var button = e.target.closest('BUTTON');
    if (button && button.type === 'button' && button.subMenuButtons) {
      var menuButtons = button.subMenuButtons;
      var menuItems = [];
      var hasItemIcon = false;
      for (var p = 0; p < menuButtons.length; p++) {
        var buttonAttribs = ' data-data1="' + menuButtons[p].Data1 + '" data-data2="' + menuButtons[p].Data2 + '" ';
        var escapedAttribs = 'item' + p + '" ' + buttonAttribs + ' x="';
        if (menuButtons[p].Icon) {
          hasItemIcon = true;
        }
        menuItems.push({
          name: menuButtons[p].Caption,
          icon: menuButtons[p].Icon,
          escapedAttribs: escapedAttribs,
          id: 'item' + p
        });
      }
      var container = this;
      container.classList.add('actionsheet-open');
      showActionSheet({
        items: menuItems,
        positionTo: button,
        title: '',
        hasItemIcon: hasItemIcon
      }).then(function (id) {
        container.classList.remove('actionsheet-open');
        var event = new MouseEvent('click', {
          view: window,
          bubbles: true,
          cancelable: false
        });
        for (var q = 0; q < menuButtons.length; q++) {
          if (id === 'item' + q) {
            event.Data1 = menuButtons[q].Data1;
            event.Data2 = menuButtons[q].Data2;
            event.ConfirmationPrompt = menuButtons[q].ConfirmationPrompt;
            event.Caption = menuButtons[q].Caption;
          }
        }
        button.dispatchEvent(event);
      }, function () {
        container.classList.remove('actionsheet-open');
      });
      e.cancelBubble = true;
      return true;
    }
    return false;
  }
  function isDxRequired(item) {
    switch (item.EditorType) {
      case 'DxDataGrid':
      case 'DxPivotGrid':
      case 'DataGrid':
      case 'PivotGrid':
        return true;
    }
    if (item.EditorItems) {
      for (var i = 0; i < item.EditorItems.length; i++) {
        var subItem = item.EditorItems[i];
        if (isDxRequired(subItem)) {
          return true;
        }
      }
    }
    return false;
  }
  function renderForm(editObjectContainer, container) {
    if (!editObjectContainer || !editObjectContainer.EditorRoot) {
      return Promise.resolve();
    }
    container.classList.add('ge-container');
    return checkGetDx(editObjectContainer.EditorRoot).then(function () {
      var root = editObjectContainer.EditorRoot;
      var sectionStyle = '';
      if (container.style.height) {
        ////sectionStyle = 'height: ' + container.style.height + '; position: relative;';
        sectionStyle = 'height: ' + container.style.height + ';';
      }
      container.innerHTML = DIV(null, 'verticalSection', sectionStyle, function (children) {
        if (root.DisplayName || root.Description) {
          children.push(DIV(null, 'sectionTitleContainer', null, function (c2) {
            if (root.DisplayName) {
              c2.push(H1(null, 'sectionTitle', null, root.DisplayName));
            }
            if (root.Description) {
              c2.push(P(null, 'ge-section-description', null, formatDescription(root.Description)));
            }
            if (root.FeatureRequiresPremiere) {
              var innerHTML = _globalize.default.translate('FeatureRequiresEmbyPremiere', '<a href="https://emby.media/premiere" data-preset="premiereinfo" is="emby-linkbutton" type="button" class="button-link">', '</a>');
              c2.push(DIV(null, null, 'margin:1em 0;', innerHTML, 'emby-premierecontainer'));
            }
          }));
          children.push(DIV(null, 'sectionContent', null, function () {
            return root.EditorItems.map(renderSingleItem).join('');
          }));
        } else {
          children.push(root.EditorItems.map(renderSingleItem).join(''));
        }
      });
      container.PostbackActions = root.PostbackActions;
      registerFilePickerEvents(container);
      var valueObject = editObjectContainer.Object;
      function onChangeHandler(e) {
        if (e.target.type === 'number' || e.target.type === 'text' && !e.target.classList.contains('ge-picker')) {
          if (e.type === 'change') {
            return;
          }
        } else {
          if (e.type === 'input') {
            return;
          }
        }
        var targetValue = e.target.value;
        if (e.target.type === 'checkbox') {
          targetValue = e.target.checked;
        }
        var targetId = e.target.id;
        if (e.target.type === 'radio') {
          targetId = e.target.name;
        }
        applyPropertyConditions(root, container, targetValue, targetId);
        if (container.PostbackActions) {
          var action = null;
          for (var i = 0; i < container.PostbackActions.length; i++) {
            if (container.PostbackActions[i].TargetEditorId === targetId) {
              action = container.PostbackActions[i];
              break;
            }
          }
          if (action) {
            var timerId = setTimeout(function () {
              clearTimeout(timerId);
              var event = new MouseEvent('click', {
                view: window,
                bubbles: true,
                cancelable: true
              });
              event.Data1 = action.PostbackCommandId;
              event.Data2 = getValue(valueObject, action.CommandParameterPropertyId);
              container.dispatchEvent(event);
            }, 50);
          }
        }
      }
      if (container.lastChangeHandler) {
        container.removeEventListener('change', container.lastChangeHandler);
      }
      if (container.lastInputHandler) {
        container.removeEventListener('input', container.lastInputHandler);
      }
      container.lastChangeHandler = onChangeHandler;
      container.lastInputHandler = onChangeHandler;
      container.addEventListener('change', container.lastChangeHandler);
      container.addEventListener('input', container.lastChangeHandler);
      container.removeEventListener('click', actionSheetHandler);
      container.addEventListener('click', actionSheetHandler);
      return Promise.resolve();
    });
  }
  function applyPropertyConditions(root, container, targetValue, targetId) {
    for (var i = 0; i < root.PropertyConditions.length; i++) {
      var condition = root.PropertyConditions[i];
      if (condition.TargetPropertyId === targetId) {
        var affectedElement = container.querySelector('#' + condition.AffectedPropertyId.split('.').join('\\.'));
        if (affectedElement) {
          var conditionResult = false;
          switch (condition.SimpleCondition) {
            case 'IsTrue':
              conditionResult = targetValue === true;
              break;
            case 'IsFalse':
              conditionResult = targetValue === false;
              break;
            case 'IsNull':
              conditionResult = targetValue === null || targetValue === undefined;
              break;
            case 'IsNotNullOrEmpty':
              conditionResult = !(targetValue === null || targetValue === undefined || targetValue === '');
              break;
          }
          switch (condition.ValueCondition) {
            case 'IsEqual':
              conditionResult = targetValue === condition.Value;
              break;
            case 'IsNotEqual':
              conditionResult = targetValue !== condition.Value;
              break;
            case 'IsGreater':
              conditionResult = targetValue > condition.Value;
              break;
            case 'IsGreaterOrEqual':
              conditionResult = targetValue >= condition.Value;
              break;
            case 'IsLess':
              conditionResult = targetValue < condition.Value;
              break;
            case 'IsLessOrEqual':
              conditionResult = targetValue <= condition.Value;
              break;
          }
          switch (condition.ConditionType) {
            case 'Visible':
              {
                var viewElement = affectedElement;
                if (viewElement.type === 'checkbox') {
                  viewElement = viewElement.parentElement.parentElement;
                }
                var isInput = viewElement.className === 'radioGroup' || viewElement.tagName === 'INPUT' || viewElement.tagName === 'TEXTAREA';
                if (isInput && viewElement.parentElement.classList.contains('inputContainer')) {
                  viewElement = viewElement.parentElement;
                } else if (isInput && viewElement.parentElement.parentElement.classList.contains('inputContainer')) {
                  viewElement = viewElement.parentElement.parentElement;
                } else if (isInput && viewElement.parentElement.parentElement.parentElement.classList.contains('inputContainer')) {
                  viewElement = viewElement.parentElement.parentElement.parentElement;
                }
                var isSelect = viewElement.tagName === 'SELECT';
                if (isSelect && viewElement.parentElement.classList.contains('selectContainer')) {
                  viewElement = viewElement.parentElement;
                } else if (isSelect && viewElement.parentElement.parentElement.classList.contains('selectContainer')) {
                  viewElement = viewElement.parentElement.parentElement;
                } else if (isSelect && viewElement.parentElement.parentElement.parentElement.classList.contains('selectContainer')) {
                  viewElement = viewElement.parentElement.parentElement.parentElement;
                }
                if (conditionResult) {
                  viewElement.classList.remove('hide');
                } else {
                  viewElement.classList.add('hide');
                }
              }
              break;
            case 'Enabled':
              affectedElement.disabled = !conditionResult;
              break;
          }
        }
      }
    }
  }
  function onFilePickerButtonClick() {
    var context = this;
    Emby.importModule('./modules/directorybrowser/directorybrowser.js').then(function (DirectoryBrowser) {
      var picker = new DirectoryBrowser();
      var isFolderPicker = context.getAttribute('isFolderPicker') === 'true';
      var inputId = '#' + context.getAttribute('inputId');
      inputId = inputId.split('.').join('\\.');
      var container = context.closest('.filePickerContainer');
      picker.show({
        includeFiles: !isFolderPicker,
        includeDirectories: true,
        path: container.querySelector(inputId).value,
        callback: function (path) {
          if (path) {
            var element = container.querySelector(inputId);
            element.value = path;
            element.dispatchEvent(new Event('change', {
              'bubbles': true
            }));
          }
          picker.close();
        },
        header: context.getAttribute('fieldName')
      });
    });
  }
  function registerFilePickerEvents(container) {
    container.classList.add('filePickerContainer');
    var buttons = container.querySelectorAll('.filePickerButton');
    for (var i = 0; i < buttons.length; ++i) {
      buttons[i].removeEventListener('click', onFilePickerButtonClick);
      buttons[i].addEventListener('click', onFilePickerButtonClick);
    }
  }
  function renderSingleItem(item) {
    item.extraClasses = '';
    if (item.IsAdvanced) {
      item.extraClasses += ' advanced';
    }
    switch (item.EditorType) {
      case 'Group':
        return renderItemGroup(item);
      case 'Text':
        return renderText(item);
      case 'Numeric':
        return renderNumeric(item);
      case 'Boolean':
        return renderCheckBox(item);
      case 'SelectSingle':
        return renderSelect(item, false);
      case 'SelectMultiple':
        return renderSelect(item, true);
      case 'Date':
        return renderDate(item);
      case 'FilePath':
        return renderFilePicker(item, false);
      case 'FolderPath':
        return renderFilePicker(item, true);
      case 'StatusItem':
        return renderStatusItem(item);
      case 'ProgressItem':
        return renderProgressItem(item);
      case 'ButtonItem':
        return renderButtonItem(item);
      case 'ButtonGroup':
        return renderButtonGroup(item);
      case 'CaptionItem':
        return renderCaptionItem(item);
      case 'LabelItem':
        return renderLabelItem(item);
      case 'SpacerItem':
        return renderSpacerItem(item);
      case 'ItemList':
        return renderItemList(item);
      case 'RadioGroup':
        return renderRadioGroup(item);
      case 'DxDataGrid':
      case 'DataGrid':
        return genericEditDx.renderDataGridElement(item);
      case 'DxPivotGrid':
      case 'PivotGrid':
        return genericEditDx.renderPivotGridElement(item);
      default:
        {
          var editor = getEditor(item.EditorType);
          if (editor) {
            return editor.renderSingleItem(item);
          }
          return '<div>Unknown cofig element type: ' + item.ElementType + '</div>';
        }
    }
  }
  function renderCheckBox(item) {
    var map = new Map();
    if (item.IsReadOnly) {
      map.set('readonly', 'readonly');
      map.set('disabled', 'disabled');
    }
    return DIV(null, 'toggleContainer' + item.extraClasses, null, function (children) {
      children.push(LABEL(null, null, null, function () {
        return INPUT(item.Id, 'checkbox', 'emby-toggle', null, null, map, function () {
          return SPAN(null, null, null, item.DisplayName);
        });
      }));
      if (item.Description) {
        children.push(DIV(null, 'fieldDescription toggleFieldDescription', null, item.Description));
      }
    });
  }
  function renderSelect(item, multiselect) {
    if (item.ShowAsRadio) {
      return renderRadio(item, false);
    }
    var html = '';
    var containerClass = 'selectContainer';
    var elementName = 'emby-select';
    var map = new Map();
    if (!item.AllowEmpty) {
      map.set('required', 'required');
    }
    if (item.IsReadOnly) {
      map.set('disabled', 'disabled');
    }
    if (multiselect) {
      map.set('multiple', 'multiple');
    }
    map.set('allselected-labeltext', _globalize.default.translate('All'));
    map.set('data-empty-is-all', 'false');
    map.set('itemssourceid', item.ItemsSourceId);
    map.set('staticitemssourceid', item.StaticItemsSourceId);
    map.set('label', item.DisplayName);
    if (item.MultiLine && item.LineCount > 1) {
      elementName = 'emby-multilineselect';
      var lineCount = _layoutmanager.default.tv ? Math.ceil(item.LineCount / 2) : item.LineCount;
      map.set('size', lineCount);
      html += '<style>.multilineSelectContainer .selectArrowContainer { display: none; }</style>';
      containerClass += ' multilineSelectContainer';
    }
    html += DIV(null, containerClass + item.extraClasses, null, function (children) {
      children.push(SELECT(item.Id, elementName, null, null, map, function () {
        return item.SelectOptions.map(renderSelectOption).join('');
      }));
      children.push(DIV(null, 'fieldDescription', null, item.Description));
    });
    return html;
  }
  function renderSelectOption(option) {
    var disabled = option.IsEnabled ? '' : 'disabled';
    return '<option value="' + option.Value + '" Id="' + option.Value + '" Name="' + option.Name + '" title="' + (option.DisplayHint || '') + '" ' + disabled + ' >' + option.Name + '</option>';
  }
  function renderText(item) {
    var element = item.MultiLine ? 'textarea' : 'input';
    var elementIs = 'emby-' + element;
    var elemType = 'text';
    var style = '';
    if (item.IsPassword) {
      elemType = 'password';
    }
    var map = new Map();
    if (item.MultiLine && item.LineCount && item.LineCount > 1) {
      map.set('rows', item.LineCount);
      style = 'overflow: auto; resize: none;';
    }
    if (!item.AllowEmpty) {
      map.set('required', 'required');
    }
    if (item.IsReadOnly) {
      map.set('readonly', 'readonly');
      map.set('disabled', 'disabled');
    }
    if (_layoutmanager.default.tv) {
      map.set('autocomplete', 'off');
    }
    map.set('maxlength', item.MaxLength);
    map.set('label', item.DisplayName);
    return DIV(null, 'inputContainer' + item.extraClasses, null, function (children) {
      if (item.MultiLine) {
        children.push(LABEL(null, null, null, function (children2) {
          children2.push(EL(element, item.Id, null, style, elementIs, elemType, map));
        }));
      } else {
        children.push(EL(element, item.Id, null, style, elementIs, elemType, map));
      }
      children.push(DIV(null, 'fieldDescription', null, item.Description));
    });
  }
  function renderFilePicker(item, isFolderPicker) {
    var map = new Map();
    if (!item.AllowEmpty) {
      map.set('required', 'required');
    }
    if (item.IsReadOnly) {
      map.set('readonly', 'readonly');
      map.set('disabled', 'disabled');
    }
    map.set('label', item.DisplayName);
    if (_layoutmanager.default.tv) {
      map.set('autocomplete', 'off');
    }
    var buttonMap = new Map();
    buttonMap.set('title', _globalize.default.translate('ButtonSelectDirectory'));
    buttonMap.set('inputId', item.Id);
    buttonMap.set('fieldName', item.DisplayName);
    buttonMap.set('isFolderPicker', isFolderPicker);
    return DIV(null, 'inputContainer' + item.extraClasses, null, function (children) {
      children.push(DIV(null, 'flex align-items-center', null, function (c2) {
        c2.push(DIV(null, 'flex-grow', null, function () {
          return INPUT(item.Id, 'text', 'emby-input', 'ge-picker', null, map);
        }));
        c2.push(EL('button', null, 'filePickerButton emby-input-iconbutton', null, 'paper-icon-button-light', 'button', buttonMap, function () {
          return ICON(null, 'md-icon', null, 'search');
        }));
      }));
      children.push(DIV(null, 'fieldDescription', null, item.Description));
    });
  }
  function renderStatusItem(item) {
    var bannerClass = 'infoBanner';
    if (item.Status === 'Warning') {
      bannerClass += ' warningBanner';
    }
    var html = '<div Id="' + item.Id + '" class="' + bannerClass + ' statusItem' + item.extraClasses + '" style="margin-top:1em;">';
    html += '<div class="infoBannerIconContainer">';
    html += '<i class="statusIcon infoBannerIcon md-icon">check_circle_outline</i>';
    html += '<div class="mdl-spinner statusSpinner" style="position: initial;margin-top: 0.2em; margin-left: 0.2em; vertical-align: top;height: 2.6em;width: 2.6em;z-index: auto;top: initial;left: initial;"><div class="mdl-spinner__layer mdl-spinner__layer-1"><div class="mdl-spinner__circle-clipper mdl-spinner__left"><div class="mdl-spinner__circle mdl-spinner__circleLeft"></div></div><div class="mdl-spinner__circle-clipper mdl-spinner__right"><div class="mdl-spinner__circle mdl-spinner__circleRight"></div></div></div></div>';
    html += '</div>';
    html += '<div class="flex flex-direction-column">';
    var primary = '<div class="infoBanner-primaryText">&nbsp;</div>';
    var secondary = '<div class="infoBanner-secondaryText">&nbsp;</div>';
    html += primary + secondary;
    html += '</div>';
    html += '</div>';
    return html;
  }
  function renderProgressItem(item) {
    var attributes = [];
    attributes.push('id="' + item.Id + '"');
    attributes.push('min="0"');
    attributes.push('max="0"');
    attributes.push('style="width: 100%; height: 2em;"');
    attributes.push('label="' + item.DisplayName + '"');
    var html = '<div class="inputContainer' + item.extraClasses + '">';
    html += '<progress ' + attributes.join(' ') + ' />';
    html += '<div class="fieldDescription">' + item.Description + '</div>';
    html += '</div>';
    return html;
  }
  function renderButtonItemCore(item) {
    var attributes = [];
    attributes.push('is="emby-button"');
    attributes.push('id="' + item.Id + '"');
    attributes.push('type="button"');
    attributes.push('class="raised raised-mini btnButtonItem emby-button' + item.extraClasses + '"');
    attributes.push('style="margin-left:0;"');
    var html = '<button ' + attributes.join(' ') + '>';
    html += '<i class="buttonIcon md-icon button-icon button-icon-left"></i><span class="buttonText"></span>';
    html += '</button>';
    return html;
  }
  function renderTitleButtonItem(item) {
    var attributes = [];
    attributes.push('is="emby-button"');
    attributes.push('id="' + item.Id + '"');
    attributes.push('type="button"');
    attributes.push('class="fab btnButtonItem submit sectionTitleButton' + item.extraClasses + '"');
    attributes.push('style="margin-left:0.9em !important; opacity: 0.6;font-size: 0.9em;"');
    var html = '<button ' + attributes.join(' ') + '>';
    html += '<i class="buttonIcon md-icon button-icon"></i><span class="buttonText"></span>';
    html += '</button>';
    return html;
  }
  function renderButtonItem(item) {
    return DIV(null, 'verticalSection', 'margin-top: 1.2em;', function () {
      return DIV(null, 'horizontalSection allSection', null, function () {
        return renderButtonItemCore(item);
      });
    });
  }
  function renderButtonGroup(item) {
    if (item.IsBottomPanel) {
      return renderBottomButtonGroup(item);
    }
    return DIV(null, 'verticalSection', 'margin-top: 1.2em;', function () {
      return DIV(null, 'horizontalSection allSection', null, function () {
        return item.EditorItems.map(renderButtonItemCore).join('');
      });
    });
  }
  function renderBottomButtonGroup(item) {
    return DIV(null, 'verticalSection', 'position: absolute; bottom: 0.5em; left: 0.8em; z-index: 100000;', function () {
      return DIV(null, 'horizontalSection allSection', null, function () {
        return item.EditorItems.map(renderButtonItemCore).join('');
      });
    });
  }
  function renderCaptionItem(item) {
    return DIV(item.Id, 'verticalSection' + item.extraClasses, 'margin-top: 1em;', function () {
      return DIV(null, 'sectionTitleContainer', null, function () {
        return H3(null, 'sectionTitle captionText');
      });
    });
  }
  function renderLabelItem(item) {
    return DIV(item.Id, 'verticalSection' + item.extraClasses, 'margin-top: 0.5em;', function () {
      return '<p><a target="_blank" class="labelText"></a></p>';
    });
  }
  function renderSpacerItem(item) {
    return DIV(item.Id, 'verticalSection' + item.extraClasses);
  }
  function renderItemList(item) {
    return DIV(null, item.extraClasses, null, function (children) {
      children.push(DIV(item.Id, 'paperList visualCardBox vertical-list ge-itemlist'));
      children.push(DIV(null, 'fieldDescription', null, item.Description));
    });
  }
  function renderRadio(item) {
    var map = new Map();
    map.set('itemssourceid', item.ItemsSourceId);
    map.set('staticitemssourceid', item.StaticItemsSourceId);
    return DIV(null, 'radioContainer' + item.extraClasses, null, function (children) {
      if (item.DisplayName) {
        children.push(LABEL('radioLabel', null, item.Id, item.DisplayName));
      }
      children.push(EL('div', item.Id, 'radioGroup', null, null, null, map, function () {
        return item.SelectOptions.map(renderRadioItem, item).join('');
      }));
    });
  }
  function renderRadioItem(item, x, y) {
    var disabled = item.IsEnabled ? '' : 'disabled="disabled"';
    var html = '<label class="radio-label-block">' + '<input type="radio" is="emby-radio" name="' + this.Id + '" value="' + item.Value + '" ' + disabled + ' />' + '<span><span class="radio-label-block-primarytext">' + item.Name + '</span>';
    html += '</span></label>';
    return html;
  }
  function renderRadioGroup(item) {
    var map = new Map();
    map.set('itemssourceid', item.ItemsSourceId);
    return DIV(null, 'radioContainer' + item.extraClasses, null, function (children) {
      if (item.DisplayName) {
        children.push(LABEL('radioLabel', null, item.Id, item.DisplayName));
      }
      children.push(EL('div', item.Id, 'radioGroup', null, null, null, map));
    });
  }
  function renderRadioGroupItems(listElement, items) {
    var hash = objHash(items);
    if (listElement.getAttribute('hash') === hash) {
      return;
    }
    var html = items.map(renderRadioGroupItem, listElement).join('');
    listElement.setAttribute('hash', hash);
    listElement.innerHTML = html;
  }
  function renderRadioGroupItem(item, x, y) {
    var disabled = item.IsEnabled ? '' : 'disabled="disabled"';
    var html = '<label class="emby-radio-label">' + '<input type="radio" is="emby-radio" name="' + this.id + '"  id="' + this.id + '___' + item.Value + '" value="' + item.Value + '" ' + disabled + ' />' + '<span class="radioButtonLabel">' + item.PrimaryText + '</span>';
    html += '</label>';
    if (item.SecondaryText) {
      html += '<div class="fieldDescription radioFieldDescription">' + item.SecondaryText + '</div>';
    }
    return html;
  }
  function objHash(obj) {
    var objStr = JSON.stringify(obj);
    var hash = 0;
    for (var i = 0; i < objStr.length; i++) {
      hash = (hash << 5) - hash + objStr.charCodeAt(i);
      hash |= 0; // Convert to int32
    }
    return '' + hash;
  }
  function renderItemListItems(listElement, items) {
    var hash = objHash(items);
    if (listElement.getAttribute('hash') === hash) {
      return;
    }
    if (listElement.childElementCount === 0) {
      var itemElements = items.map(createItemListItem, listElement.id);
      listElement.replaceChildren.apply(listElement, babelHelpers.toConsumableArray(itemElements));
    } else {
      for (; listElement.childElementCount > items.length;) {
        listElement.lastElementChild.remove();
      }
      for (var i = 0; i < items.length; i++) {
        var item = items[i];
        var itemHash = objHash(item);
        if (i < listElement.childElementCount) {
          var itemElement = listElement.children[i];
          if (itemElement.getAttribute('hash') !== itemHash) {
            var newElement = createItemListItem(item, i, items, listElement.id, itemElement);
            newElement.setAttribute('hash', itemHash);
          }
        } else {
          var _newElement = createItemListItem(item, i, items, listElement.id, null);
          _newElement.setAttribute('hash', itemHash);
          listElement.appendChild(_newElement);
        }
      }
    }
    listElement.setAttribute('hash', hash);
  }
  function addRemoveClass(element, cls, condition) {
    if (condition) {
      element.classList.add(cls);
    } else {
      element.classList.remove(cls);
    }
  }
  function getItemIcon(item) {
    var standardIcon = item.StandardIcon;
    if (standardIcon) {
      switch (standardIcon) {
        case 'Loading':
          return standardIcon;
        case 'Add':
          return 'add';
        case 'Edit':
          return 'edit';
        case 'Refresh':
          return 'refresh';
        case 'Remove':
          return 'remove_circle_outline';
        case 'Delete':
          return 'delete';
        case 'ContextMenu':
          return 'more_horiz';
        case 'Download':
          return 'download';
        case 'AddToList':
          return '&#xe03b;';
        default:
          break;
      }
    }
    return item.Icon;
  }
  function createItemListItem(item, index, itemArray, listId, existingElement) {
    var listElementId = listId || this;
    var listItemId = listElementId + '.listitem' + index;
    var listElem = null;
    if (existingElement) {
      if (existingElement.tagName === 'A' && item.HyperLink || existingElement.tagName === 'DIV') {
        listElem = existingElement;
      }
    }
    var contentElem;
    if (item.HyperLink) {
      listElem = listElem || document.createElement('a', {
        is: 'emby-linkbutton'
      });
      listElem.href = item.HyperLink;
    } else {
      listElem = listElem || document.createElement('div');
    }
    if (listElem.firstElementChild && listElem.firstElementChild.tagName === 'DIV') {
      contentElem = listElem.firstElementChild;
    } else {
      contentElem = document.createElement('div');
      contentElem.classList.add('ge-itemlist-listitem-listitemcontent', 'listItem-inner');
      listElem.appendChild(contentElem);
    }
    if (!item.Button1 && !item.Button2 && !item.Toggle) {
      contentElem.classList.add('focusable');
      contentElem.classList.remove('focuscontainer-x');
      contentElem.setAttribute('tabindex', '0');
    } else {
      contentElem.classList.remove('focusable');
      contentElem.classList.add('focuscontainer-x');
      contentElem.tabIndex = null;
      contentElem.removeAttribute('tabindex');
    }
    if (existingElement && existingElement !== listElem) {
      existingElement.replaceWith(listElem);
    }
    listElem.id = listItemId;
    listElem.setAttribute('hash', objHash(item));
    listElem.classList.add('listItem', 'listItem-border', 'ge-itemlist-listitem');
    if (!item.HyperLink) {
      listElem.classList.add('listItem-touchzoom', 'listItem-touchzoom-transition');
    }
    if (item.IsSubItem) {
      listElem.classList.add('ge-sublistitem');
    }
    var existingImageContainer = contentElem.querySelector('.ge-itemlist-listitem-imagecontainer') || contentElem.querySelector('.ge-sublistitem-imagecontainer');
    var itemIconValue = getItemIcon(item);
    if (itemIconValue && item.IconMode !== 'NoIcons') {
      var imageContainer = existingImageContainer || document.createElement('div');
      if (!item.IsSubItem) {
        imageContainer.classList.add('listItemImageContainer', 'ge-itemlist-listitem-imagecontainer');
      } else {
        imageContainer.classList.add('ge-sublistitem-imagecontainer');
      }
      if (item.SecondaryText) {
        imageContainer.classList.remove('ge-listitemicon-singlerow');
      } else {
        imageContainer.classList.add('ge-listitemicon-singlerow');
      }
      var iconModeClasses = ['ge-icon-largeincircle', 'ge-icon-largeregular', 'ge-icon-smallincircle', 'ge-icon-smallregular'];
      var mode = (item.IconMode || 'xxx').toLowerCase();
      for (var i = 0; i < iconModeClasses.length; i++) {
        if (iconModeClasses[i].indexOf(mode) > 0) {
          imageContainer.classList.add(iconModeClasses[i]);
        } else {
          imageContainer.classList.remove(iconModeClasses[i]);
        }
      }
      var existingSpinner = imageContainer.querySelector('.statusSpinner');
      var existingIcon = imageContainer.querySelector('i');
      if (itemIconValue === 'Loading' || item.Status === 'InProgress') {
        if (!existingSpinner) {
          var itemSpinner = document.createElement('div');
          itemSpinner.classList.add('mdl-spinner', 'statusSpinner');
          var spinnerLlayer = document.createElement('div');
          spinnerLlayer.classList.add('mdl-spinner__layer', 'mdl-spinner__layer-1');
          var spinnerLleft = document.createElement('div');
          spinnerLleft.classList.add('mdl-spinner__circle-clipper', 'mdl-spinner__left');
          var circleLeft = document.createElement('div');
          circleLeft.classList.add('mdl-spinner__circle', 'mdl-spinner__circleLef');
          var spinnerRight = document.createElement('div');
          spinnerRight.classList.add('mdl-spinner__circle-clipper', 'mdl-spinner__right');
          var circleRight = document.createElement('div');
          circleRight.classList.add('mdl-spinner__circle', 'mdl-spinner__circleRight');
          spinnerLleft.appendChild(circleLeft);
          spinnerRight.appendChild(circleRight);
          spinnerLlayer.append(spinnerLleft, spinnerRight);
          itemSpinner.appendChild(spinnerLlayer);
          imageContainer.appendChild(itemSpinner);
        }
        imageContainer.style.backgroundColor = null;
        if (existingIcon) {
          existingIcon.remove();
        }
      } else {
        var itemIcon = existingIcon || document.createElement('i');
        itemIcon.innerText = itemIconValue;
        itemIcon.classList.add('md-icon');
        if (item.IconMode === 'LargeInCircle' || item.IconMode === 'SmallInCircle') {
          itemIcon.style.color = item.Status === 'None' ? 'transparent' : '#ffffffee';
          imageContainer.style.backgroundColor = getStatusColor(item.Status);
        } else {
          itemIcon.style.color = getStatusColor(item.Status);
          imageContainer.style.backgroundColor = null;
        }
        if (existingSpinner) {
          existingSpinner.remove();
        }
        if (!existingIcon) {
          imageContainer.appendChild(itemIcon);
        }
      }
      if (!existingImageContainer) {
        contentElem.appendChild(imageContainer);
      }
    } else if (existingImageContainer) {
      existingImageContainer.remove();
    }
    var existingBody = contentElem.querySelector('.listItemBody');
    var itemBody = existingBody || document.createElement('div');
    itemBody.classList.add('listItemBody', 'ge-listitembody');
    if (item.SecondaryText) {
      itemBody.classList.remove('ge-listitembody-singlerow');
    } else {
      itemBody.classList.add('ge-listitembody-singlerow');
    }
    if (item.IconMode === 'LargeRegular' || item.IconMode === 'LargeInCircle' || item.Button1 || item.Button2 || item.Toggle || item.PrimaryText && item.SecondaryText) {
      itemBody.classList.remove('ge-listitembody-smallheight');
    } else {
      itemBody.classList.add('ge-listitembody-smallheight');
    }
    var existingBodyPrimary = itemBody.querySelector('.listItemBodyText-primary');
    var bodyPrimary = existingBodyPrimary || document.createElement('div');
    bodyPrimary.classList.add('listItemBodyText', 'listItemBodyText-primary', 'listItemBodyText-nowrap');
    bodyPrimary.style.fontWeight = item.Tag ? '500' : null;
    if (bodyPrimary.cachedText !== item.PrimaryText) {
      bodyPrimary.innerHTML = item.PrimaryText;
      bodyPrimary.cachedText = item.PrimaryText;
    }
    var existingTag = bodyPrimary.querySelector('.ge-listitem-tag');
    if (item.Tag) {
      var tagElem = existingTag || document.createElement('span');
      tagElem.classList.add('ge-listitem-tag');
      tagElem.innerText = item.Tag.Text;
      if (!existingTag) {
        bodyPrimary.append(tagElem, ' ');
      }
    } else if (existingTag) {
      existingTag.remove();
    }
    if (!existingBodyPrimary) {
      itemBody.appendChild(bodyPrimary);
    }
    var existingBodySecondary = itemBody.querySelector('.listItemBodyText-secondary');
    if (item.SecondaryText) {
      var bodySecondary = existingBodySecondary || document.createElement('div');
      bodySecondary.classList.add('listItemBodyText', 'listItemBodyText-secondary', 'listItemBodyText-nowrap');
      if (bodySecondary.cachedText !== item.SecondaryText) {
        bodySecondary.innerText = item.SecondaryText;
        bodySecondary.cachedText = item.SecondaryText;
      }
      if (!existingBodySecondary) {
        if (item.ShowSecondaryFirst) {
          itemBody.insertAdjacentElement('afterbegin', bodySecondary);
        } else {
          itemBody.appendChild(bodySecondary);
        }
      } else {
        if (item.ShowSecondaryFirst && itemBody.children[0] !== existingBodySecondary) {
          itemBody.insertAdjacentElement('afterbegin', existingBodySecondary);
        } else if (!item.ShowSecondaryFirst && itemBody.children[0] === existingBodySecondary) {
          itemBody.insertAdjacentElement('beforeend', existingBodySecondary);
        }
      }
    } else if (existingBodySecondary) {
      existingBodySecondary.remove();
    }
    var existingProgress = itemBody.querySelector('.ge-progress');
    if (item.HasPercentage) {
      var progressInner;
      var progressSpan;
      if (!existingProgress) {
        var progress = document.createElement('div');
        progress.classList.add('ge-progress', 'flex', 'align-items-center');
        var progressOuter = document.createElement('div');
        progressOuter.className = 'itemProgressBar itemProgressBarRound flex-grow';
        progressInner = document.createElement('div');
        progressInner.className = 'itemProgressBarForeground itemProgressBarForegroundRound';
        progressSpan = document.createElement('span');
        progressSpan.classList.add('itemProgressBarText');
        progressOuter.appendChild(progressInner);
        progress.append(progressOuter, progressSpan);
        itemBody.appendChild(progress);
      } else {
        progressInner = itemBody.querySelector('.itemProgressBarForeground');
        progressSpan = itemBody.querySelector('.itemProgressBarText');
      }
      var percentComplete = item.PercentComplete;
      if (progressInner) {
        progressInner.style.width = percentComplete + '%';
      }
      if (progressSpan) {
        progressSpan.innerText = percentComplete + '%';
      }
    } else if (existingProgress) {
      existingProgress.remove();
    }
    if (!existingBody) {
      contentElem.appendChild(itemBody);
    }
    createListButton(contentElem, item.Button1, listItemId, 'button1');
    createListButton(contentElem, item.Button2, listItemId, 'button2');
    createListToggle(contentElem, item.Toggle, listItemId + '.toggle');
    var existingSubList = listElem.querySelector('.paperlist');
    if (!item.HyperLink && item.SubItems) {
      item.SubItems.forEach(function (si) {
        si.IsSubItem = true;
      });
      var subList = existingSubList || document.createElement('div');
      subList.id = listItemId + '.SubList';
      subList.classList.add('paperlist', 'ge-itemlist', 'ge-subitemlist');
      if (itemIconValue && (item.IconMode === 'LargeRegular' || item.IconMode === 'LargeInCircle')) {
        subList.classList.add('ge-subitemlist-largeindent');
        subList.classList.remove('ge-subitemlist-smallindent');
      } else if (itemIconValue && item.IconMode !== 'NoIcons') {
        subList.classList.remove('ge-subitemlist-largeindent');
        subList.classList.add('ge-subitemlist-smallindent');
      } else {
        subList.classList.remove('ge-subitemlist-largeindent');
        subList.classList.remove('ge-subitemlist-smallindent');
      }
      renderItemListItems(subList, item.SubItems);
      if (!existingSubList) {
        listElem.appendChild(subList);
      }
    } else if (existingSubList) {
      existingSubList.remove();
    }
    return listElem;
  }
  function createListButton(contentElem, button, buttonId, cls) {
    var existingButton = contentElem.querySelector('.' + cls);
    if (!button) {
      if (existingButton) {
        existingButton.remove();
      }
      return;
    }
    var buttonElem = existingButton || document.createElement('button', {
      is: 'emby-button'
    });
    buttonElem.type = 'button';
    if (button.Caption) {
      buttonElem.classList.add('raised', 'raised-mini');
    } else {
      buttonElem.classList.add('paper-icon-button-light');
    }
    buttonElem.classList.add('emby-button');
    buttonElem.classList.add(cls);
    buttonElem.id = buttonId + '.' + cls;
    buttonElem.setAttribute('data-data1', button.Data1 || '');
    buttonElem.setAttribute('data-data2', button.Data2 || '');
    buttonElem.setAttribute('data-prompt', button.ConfirmationPrompt || '');
    buttonElem.title = button.Caption || '';
    var existingIcon = buttonElem.querySelector('.md-icon');
    var buttonIconValue = getItemIcon(button);
    if (buttonIconValue) {
      var buttonIcon = existingIcon || document.createElement('i');
      buttonIcon.innerText = buttonIconValue;
      buttonIcon.classList.add('md-icon');
      buttonIcon.classList.add('button-icon');
      addRemoveClass(buttonIcon, 'button-icon-left', button.Caption);
      if (!existingIcon) {
        buttonElem.insertAdjacentElement('afterbegin', buttonIcon);
      }
    } else if (existingIcon) {
      existingIcon.remove();
    }
    var existingCaption = buttonElem.querySelector('span');
    if (button.Caption) {
      var buttonCaption = existingCaption || document.createElement('span');
      buttonCaption.innerText = button.Caption;
      if (!existingCaption) {
        buttonElem.insertAdjacentElement('beforeend', buttonCaption);
        buttonElem.appendChild(buttonCaption);
      }
    } else {
      if (existingCaption) {
        existingCaption.remove();
      }
    }
    buttonElem.disabled = !button.IsEnabled;
    buttonElem.subMenuButtons = button.SubMenuButtons;
    if (!existingButton) {
      contentElem.appendChild(buttonElem);
    }
    if (cls === 'button2' && contentElem.lastElementChild !== buttonElem) {
      contentElem.insertAdjacentElement('beforeend', buttonElem);
    }
  }
  function createListToggle(contentElem, toggle, toggleId) {
    var existingContainer = contentElem.querySelector('.ge-itemlist-listitem-togglecontainer');
    if (!toggle) {
      if (existingContainer) {
        existingContainer.remove();
      }
      return;
    }
    var toggleContainer = existingContainer || document.createElement('div');
    var toggleInput;
    var toggleDiv;
    if (!existingContainer) {
      toggleContainer.classList.add('checkboxContainer', 'ge-itemlist-listitem-togglecontainer');
      var toggleLabel = document.createElement('label');
      toggleInput = document.createElement('input', {
        is: 'emby-toggle'
      });
      toggleInput.id = toggleId;
      toggleInput.type = 'checkbox';
      toggleInput.classList.add('noautofocus');
      toggleDiv = document.createElement('div');
      toggleDiv.classList.add('ge-togglelabel');
      var toggleSpan = document.createElement('span');
      toggleSpan.innerHTML = '&nbsp;';
      toggleLabel.append(toggleInput, toggleSpan, toggleDiv);
      toggleContainer.appendChild(toggleLabel);
    } else {
      toggleInput = toggleContainer.querySelector('INPUT');
      toggleDiv = toggleContainer.querySelector('DIV');
    }
    toggleInput.readOnly = !toggle.IsEnabled;
    toggleInput.disabled = !toggle.IsEnabled;
    toggleInput.checked = !!toggle.IsChecked;
    toggleInput.setAttribute('data-data1', toggle.Data1 || '');
    toggleInput.setAttribute('data-data2', toggle.Data2 || '');
    toggleInput.setAttribute('data-prompt', toggle.ConfirmationPrompt || '');
    toggleDiv.innerText = toggle.Caption;
    toggleContainer.title = toggle.Caption || '';
    if (!existingContainer) {
      contentElem.insertAdjacentElement('beforeend', toggleContainer);
    }
  }
  function renderDate(item) {
    var attributes = [];
    attributes.push('is="emby-input"');
    attributes.push('type="date"');
    attributes.push('id="' + item.Id + '"');
    if (!item.AllowEmpty) {
      attributes.push('required="required"');
    }
    if (item.IsReadOnly) {
      attributes.push('readonly="readonly"');
      attributes.push('disabled="disabled"');
    }
    attributes.push('label="' + item.DisplayName + '"');
    var html = '<div class="inputContainer' + item.extraClasses + '">';
    html += '<input ' + attributes.join(' ') + ' />';
    html += '<div class="fieldDescription">' + item.Description + '</div>';
    html += '</div>';
    return html;
  }
  function renderNumeric(item) {
    var attributes = [];
    attributes.push('is="emby-input"');
    attributes.push('type="number"');
    attributes.push('id="' + item.Id + '"');
    if (!item.AllowEmpty) {
      attributes.push('required="required"');
    }
    if (item.IsReadOnly) {
      attributes.push('readonly="readonly"');
      attributes.push('disabled="disabled"');
    }
    if (_layoutmanager.default.tv) {
      attributes.push('autocomplete="off"');
    }
    if (item.MinValue !== null && item.MinValue !== undefined) {
      attributes.push('min="' + item.MinValue + '"');
    }
    if (item.MaxValue !== null && item.MaxValue !== undefined) {
      attributes.push('max="' + item.MaxValue + '"');
    }
    if (item.DecimalPlaces && item.DecimalPlaces > 0) {
      var zeros = Array(item.DecimalPlaces).join('0');
      attributes.push('step="0.' + zeros + '1"');

      // needed for iOS to display the number keypad
      attributes.push('inputmode="decimal"');
    } else {
      // needed for iOS to display the number keypad
      attributes.push('inputmode="numeric"');
    }
    attributes.push('label="' + item.DisplayName + '"');
    var html = '<div class="inputContainer' + item.extraClasses + '">';
    html += '<input ' + attributes.join(' ') + ' />';
    html += '<div class="fieldDescription">' + item.Description + '</div>';
    html += '</div>';
    return html;
  }
  function renderItemGroup(item) {
    var itemcount = item.EditorItems.length;

    //console.log('renderItemGroup itemcount: ' + itemcount, item);

    var html = '<div class="verticalSection' + item.extraClasses + '" style="margin-top: 0.5em;" id="' + item.Id + '" itemcount="' + itemcount + '">';
    if (item.DisplayName || item.Description) {
      html = '<div class="verticalSection' + item.extraClasses + '" style="margin-top: 2em;" id="' + item.Id + '" itemcount="' + itemcount + '">';
      html += '<div class="sectionTitleContainer">';
      if (item.DisplayName) {
        html += '<h2 class="sectionTitle">' + item.DisplayName + '</h2>';
      }
      var desccriptionClass = 'ge-section-description';
      if (item.TitleButton) {
        html += renderTitleButtonItem(item.TitleButton);
        desccriptionClass += ' ge-section-withtitlebutton-description';
      }
      html += '</div>';
      if (item.Description) {
        html += '<p class="' + desccriptionClass + '">' + formatDescription(item.Description) + '</p>';
      }
    }
    html += '<div class="sectionContent">';
    html += item.EditorItems.map(renderSingleItem).join('');
    html += '</div></div>';
    return html;
  }
  function formatDescription(description) {
    if (!description || description.length === 0) {
      return null;
    }
    description = description.split('\n').join('<br />');
    return description;
  }
  function getAllItems(editorRoot) {
    var allItems = [];
    if (!editorRoot || !editorRoot.EditorItems) {
      return allItems;
    }
    collectItems(editorRoot, allItems);
    return allItems;
  }
  function collectItems(item, allItems) {
    if (item.TitleButton) {
      allItems.push(item.TitleButton);
    }
    if (item.EditorItems) {
      for (var i = 0; i < item.EditorItems.length; i++) {
        collectItems(item.EditorItems[i], allItems);
      }
    } else {
      allItems.push(item);
    }
  }
  function collectGroupItems(item, allItems) {
    if (item.EditorType === 'Group') {
      allItems.push(item);
    }
    if (item.EditorItems) {
      for (var i = 0; i < item.EditorItems.length; i++) {
        collectGroupItems(item.EditorItems[i], allItems);
      }
    }
  }
  function setFormValues(editObjectContainer, container) {
    if (!editObjectContainer) {
      return;
    }
    var i, s;
    var valueObject = editObjectContainer.Object;
    var defaultValueObject = editObjectContainer.DefaultObject;
    var allItems = getAllItems(editObjectContainer.EditorRoot);
    var groupItems = [];
    collectGroupItems(editObjectContainer.EditorRoot, groupItems);
    container.PostbackActions = editObjectContainer.EditorRoot.PostbackActions;
    var hasGroupChange = false;
    for (s = 0; s < groupItems.length; s++) {
      var groupItem = groupItems[s];
      var elementId = groupItem.Id.split('.').join('\\.');
      var element = container.querySelector('#' + elementId);
      if (element) {
        var itemcount = groupItem.EditorItems.length;
        if (element.getAttribute('itemcount') !== '' + itemcount) {
          element.outerHTML = renderItemGroup(groupItem);
          hasGroupChange = true;
        }
      }
    }
    if (hasGroupChange) {
      registerFilePickerEvents(container);
    }
    for (s = 0; s < allItems.length; s++) {
      var item = allItems[s];
      var _elementId = item.Id.split('.').join('\\.');
      var _element = container.querySelector('#' + _elementId);
      if (_element) {
        if (_element.type === 'select-one' || _element.type === 'select-multiple' || _element.className === 'radioGroup') {
          var staticitemssourceid = _element.attributes.getNamedItem('staticitemssourceid');
          if (staticitemssourceid) {
            var sourceItems = getValue(valueObject, staticitemssourceid.value);
            if (sourceItems) {
              var childCount = _element.options.length;
              for (var n = childCount - 1; n >= 0; n--) {
                var node = _element.options[n];
                if (node.value && node.value.length > 0) {
                  if (sourceItems.indexOf(node.value) === -1) {
                    _element.remove(n);
                  }
                }
              }
            }
          }
          var itemssourceid = _element.attributes.getNamedItem('itemssourceid');
          if (itemssourceid) {
            var sourceItems2 = getValue(valueObject, itemssourceid.value);
            if (sourceItems2) {
              if (_element.className === 'radioGroup') {
                renderRadioGroupItems(_element, sourceItems2);
              } else {
                _element.innerHTML = '';
                for (var n2 = 0; n2 < sourceItems2.length; n2++) {
                  var item2 = sourceItems2[n2];
                  var opt = document.createElement('option');
                  opt.value = item2.Value;
                  opt.text = item2.Name;
                  opt.disabled = !item2.IsEnabled;
                  _element.add(opt);
                }
              }
            }
          }
        }
        if (item.EditorType === 'StatusItem') {
          var statusValue = getValue(valueObject, item.Id);
          if (statusValue) {
            var primaryText = _element.querySelector('.infoBanner-primaryText');
            primaryText.innerText = statusValue.Caption;
            var secondaryText = _element.querySelector('.infoBanner-secondaryText');
            var statusText = statusValue.StatusText || '';
            secondaryText.innerText = statusText;
            var icon = _element.querySelector('.statusIcon');
            var spinner = _element.querySelector('.statusSpinner');
            switch (statusValue.Status) {
              case 'InProgress':
                icon.classList.add('hide');
                spinner.classList.remove('hide');
                break;
              default:
                icon.classList.remove('hide');
                spinner.classList.add('hide');
                break;
            }
            icon.style.color = getStatusColor(statusValue.Status, true);
            switch (statusValue.Status) {
              case 'None':
                icon.innerText = '';
                icon.classList.add('autortl');
                break;
              case 'Succeeded':
                icon.innerText = 'check_circle_outline';
                icon.classList.remove('autortl');
                break;
              case 'Failed':
                icon.innerText = 'error_outline';
                icon.classList.add('autortl');
                break;
              case 'Warning':
                icon.innerText = 'help_outline';
                icon.classList.add('autortl');
                _element.classList.add('warningBanner');
                break;
              case 'Unavailable':
                icon.innerText = 'remove_circle_outline';
                icon.classList.add('autortl');
                break;
            }
          }
        } else if (item.EditorType === 'ButtonItem') {
          var buttonValue = getValue(valueObject, item.Id);
          if (buttonValue) {
            var buttonText = _element.querySelector('.buttonText');
            buttonText.innerText = buttonValue.Caption || '';
            _element.setAttribute('data-caption', buttonText.innerText);
            var buttonIcon = _element.querySelector('.buttonIcon');
            var buttonValueIcon = getItemIcon(buttonValue);
            if (buttonValueIcon) {
              buttonIcon.innerText = buttonValueIcon;
              buttonIcon.classList.remove('hide');
            } else {
              buttonIcon.innerText = '';
              buttonIcon.classList.add('hide');
            }
            _element.disabled = !buttonValue.IsEnabled;
            if (buttonValue.IsVisible) {
              _element.classList.remove('hide');
            } else {
              _element.classList.add('hide');
            }
            if (buttonValue.SubMenuButtons) {
              _element.subMenuButtons = buttonValue.SubMenuButtons;
            }
            if (buttonValue.Data1) {
              _element.setAttribute('data-data1', buttonValue.Data1);
            }
            if (buttonValue.Data2) {
              _element.setAttribute('data-data2', buttonValue.Data2);
            }
            if (buttonValue.ConfirmationPrompt) {
              _element.setAttribute('data-prompt', buttonValue.ConfirmationPrompt);
            } else {
              _element.removeAttribute('data-prompt');
            }
          }
        } else if (item.EditorType === 'CaptionItem') {
          var captionValue = getValue(valueObject, item.Id);
          if (captionValue) {
            var captionText = _element.querySelector('.captionText');
            captionText.innerText = captionValue.Caption || '';
            if (captionValue.IsVisible) {
              _element.classList.remove('hide');
            } else {
              _element.classList.add('hide');
            }
          }
        } else if (item.EditorType === 'LabelItem') {
          var labelValue = getValue(valueObject, item.Id);
          if (labelValue) {
            var labelElement = _element.querySelector('.labelText');
            labelElement.innerText = labelValue.Text || '';
            if (labelValue.HyperLink) {
              labelElement.setAttribute('href', labelValue.HyperLink);
            } else {
              labelElement.removeAttribute('href');
            }
            if (labelValue.IsVisible) {
              _element.classList.remove('hide');
            } else {
              _element.classList.add('hide');
            }
          }
        } else if (item.EditorType === 'SpacerItem') {
          var spacerValue = getValue(valueObject, item.Id);
          if (spacerValue) {
            switch (spacerValue.Size || 'Small') {
              case 'Small':
                _element.style.height = '1em';
                break;
              case 'Medium':
                _element.style.height = '2em';
                break;
              case 'Large':
                _element.style.height = '4em';
                break;
              case 'XLarge':
                _element.style.height = '8em';
                break;
            }
          }
        } else if (item.EditorType === 'ProgressItem') {
          var progressValue = getValue(valueObject, item.Id);
          if (progressValue) {
            if (progressValue.CurrentValue) {
              _element.value = progressValue.CurrentValue;
            }
            if (progressValue.MaxValue) {
              _element.max = progressValue.MaxValue;
            }
            if (progressValue.ProgressText) {
              _element.innerText = progressValue.ProgressText;
            }
          }
        } else if (item.EditorType === 'ItemList') {
          var listValue = getValue(valueObject, item.Id);
          if (listValue) {
            renderItemListItems(_element, listValue);
          }
        } else if (item.EditorType === 'RadioGroup' || item.EditorType === 'SelectSingle' && item.ShowAsRadio) {
          ////let radioValue = getValue(valueObject, item.Id);
          ////if (radioValue) {

          ////    renderRadioGroupItems(element, radioValue);
          ////}

          var radios = _element.querySelectorAll('INPUT');
          for (i = 0; i < radios.length; i++) {
            radios[i].checked = radios[i].value === getValue(valueObject, item.Id);
          }
        } else if (item.EditorType === 'DataGrid' || item.EditorType === 'DxDataGrid') {
          genericEditDx.setDataGridValues(valueObject, item, _element, container, _elementId);
        } else if (item.EditorType === 'PivotGrid' || item.EditorType === 'DxPivotGrid') {
          genericEditDx.setPivotGridValues(valueObject, item, _element);
        } else if (item.EditorType === 'Date') {
          try {
            var dateValue = getValue(valueObject, item.Id);
            _element.valueAsNumberUtc = Date.parse(dateValue);
          } catch (e) {
            _element.value = '';
          }
        } else if (getEditor(item.EditorType)) {
          var editor = getEditor(item.EditorType);
          editor.setValues(valueObject, item, _element, container, _elementId);
        } else if (hasValue(valueObject, item.Id)) {
          if (_element.type === 'checkbox') {
            _element.checked = getValue(valueObject, item.Id);
          } else if (_element.type === 'select-multiple') {
            var selectedValues2 = getValue(valueObject, item.Id).split(',');
            if (selectedValues2.length === 1 && selectedValues2[0].length === 0) {
              selectedValues2 = [];
            }
            _element.values = selectedValues2;
            if (_element.options) {
              for (i = 0; i < _element.options.length; i++) {
                var option = _element.options[i];
                var isSelected = selectedValues2.indexOf(_element.options[i].value) >= 0;
                option.selected = isSelected;
              }
            }
          } else if (_element.classList.contains('radioGroup')) {
            var _radios = _element.querySelectorAll('INPUT');
            for (i = 0; i < _radios.length; i++) {
              _radios[i].checked = _radios[i].value === getValue(valueObject, item.Id);
            }
          } else {
            _element.value = getValue(valueObject, item.Id);
          }
        } else if (hasValue(defaultValueObject, item.Id)) {
          if (_element.type === 'checkbox') {
            _element.checked = getValue(defaultValueObject, item.Id);
          } else if (_element.type === 'select-multiple') {
            var selectedValues3 = getValue(defaultValueObject, item.Id).split(',');
            _element.values = selectedValues3;

            ////    for (i = 0; i < element.options.length; i++) {
            ////        element.options[i].selected = selectedValues3.indexOf(element.options[i].value) >= 0;
            ////    }
          } else if (_element.classList.contains('radioGroup')) {
            var radios2 = _element.querySelectorAll('INPUT');
            for (i = 0; i < radios2.length; i++) {
              radios2[i].checked = radios2[i].value === getValue(defaultValueObject, item.Id);
            }
            ////} else {
            ////    element.value = getValue(defaultValueObject, item.Id);
          }
        } else {
          if (_element.type === 'select-one' || _element.type === 'select-multiple') {
            _element.value = '';
          }
        }
      }
    }
    var root = editObjectContainer.EditorRoot;
    for (var t = 0; t < root.PropertyConditions.length; t++) {
      var condition = root.PropertyConditions[t];
      var targetValue = getValue(valueObject, condition.TargetPropertyId);
      applyPropertyConditions(root, container, targetValue, condition.TargetPropertyId);
    }
  }
  function getItemValues(editObjectContainer, container) {
    if (!editObjectContainer) {
      return;
    }
    editObjectContainer.isDataValid = true;
    var valueObject = editObjectContainer.Object;
    var allItems = getAllItems(editObjectContainer.EditorRoot);
    for (var s = 0; s < allItems.length; s++) {
      var item = allItems[s];
      if (item.EditorType === 'StatusItem' || item.EditorType === 'ProgressItem' || item.EditorType === 'ButtonItem' || item.EditorType === 'CaptionItem' || item.EditorType === 'ItemList') {
        continue;
      }
      var elementId = item.Id.split('.').join('\\.');
      var element = container.querySelector('#' + elementId);
      if (element) {
        if (valueObject) {
          if (element.type === 'checkbox') {
            setValue(valueObject, item.Id, element.checked);
          } else if (element.type === 'select-multiple') {
            var selectedValues = element.values ? element.values.join(',') : Array.from(element.selectedOptions).map(function (option) {
              return option.value;
            }).join(',');
            setValue(valueObject, item.Id, selectedValues);
          } else if (element.classList.contains('radioGroup')) {
            var radios = element.querySelectorAll('INPUT');
            for (var i = 0; i < radios.length; i++) {
              if (radios[i].checked) {
                setValue(valueObject, item.Id, radios[i].value);
                break;
              }
            }
          } else if (item.EditorType === 'DataGrid' || item.EditorType === 'DxDataGrid') {
            genericEditDx.getDataGridValues(element, editObjectContainer, valueObject);
          } else if (item.EditorType === 'Date') {
            var _element$valueAsDateU;
            var isoString = (_element$valueAsDateU = element.valueAsDateUtc) == null ? void 0 : _element$valueAsDateU.toISOString();
            setValue(valueObject, item.Id, isoString);
          } else {
            var editor = getEditor(item.EditorType);
            if (editor) {
              editor.setValue(element, editObjectContainer, valueObject, item);
            } else {
              setValue(valueObject, item.Id, element.value);
            }
          }
        }
      }
    }
  }
  function hasValue(sourceObject, propertyPath) {
    if (sourceObject === null) {
      return false;
    }
    var subObject = sourceObject;
    var pathElements = propertyPath.split('.');
    for (var i = 0; i < pathElements.length; i++) {
      var pathElement = pathElements[i].replace('colitem', '');
      if (!subObject || !Object.hasOwn(subObject, pathElement)) {
        return false;
      }
      subObject = subObject[pathElement];
    }
    return true;
  }
  function getValue(sourceObject, propertyPath) {
    var subObject = sourceObject;
    var pathElements = propertyPath.split('.');
    for (var i = 0; i < pathElements.length; i++) {
      var pathElement = pathElements[i].replace('colitem', '');
      if (!Object.hasOwn(subObject, pathElement)) {
        return null;
      }
      subObject = subObject[pathElement];
    }
    return subObject;
  }
  function setValue(sourceObject, propertyPath, value) {
    var subObject = sourceObject;
    var pathElements = propertyPath.split('.');
    for (var i = 0; i < pathElements.length - 1; i++) {
      var pathElement = pathElements[i].replace('colitem', '');
      if (!Object.hasOwn(subObject, pathElement)) {
        return;
      }
      subObject = subObject[pathElement];
    }
    var lastPathElement = pathElements[pathElements.length - 1];
    subObject[lastPathElement] = value;
  }
  function resetToDefaults(editObjectContainer, container) {
    var editors = editObjectContainer.EditorRoot.EditorItems;
    for (var n = 0; n < editors.length; n++) {
      var editor = editors[n];
      var defval = getValue(editObjectContainer.DefaultObject, editor.Id);
      setValue(editObjectContainer.Object, editor.Id, defval);
    }
  }
  function EL(elementType, id, elemClass, style, is, type, attribs, contentFunc) {
    var map = new Map();
    map.set('id', id);
    map.set('class', elemClass);
    map.set('style', style);
    map.set('is', is);
    map.set('type', type);
    if (attribs) {
      attribs.forEach(function (value, key) {
        map.set(key, value);
      });
    }
    var attributes = [];
    map.forEach(function (value, key) {
      if (value !== null && value !== undefined) {
        attributes.push('' + key + '="' + value + '"');
      }
    });
    var html = '<' + elementType + ' ' + attributes.join(' ') + '>';
    if (contentFunc) {
      if (typeof contentFunc === 'function') {
        var children = [];
        var res = contentFunc(children);
        html += children.join(' ');
        html += res || '';
      } else {
        html += contentFunc;
      }
    }
    html += '</' + elementType + '>';
    return html;
  }
  function getStatusColor(status, isStatusItem) {
    switch (status) {
      case 'None':
        return statusColorNone;
      case 'Succeeded':
        return statusColorOk;
      case 'Failed':
        return statusColorError;
      case 'Warning':
        return isStatusItem ? null : statusColorWarning;
      case 'Unknown':
        return statusColorGhosted;
      case 'Unavailable':
      default:
        return statusColorDisabled;
    }
  }
  function P(id, cls, style, contentFunc, is) {
    return EL('p', id, cls, style, is, null, null, contentFunc);
  }
  function DIV(id, cls, style, contentFunc, is) {
    return EL('div', id, cls, style, is, null, null, contentFunc);
  }
  function H1(id, cls, style, contentFunc) {
    return EL('h1', id, cls, style, null, null, null, contentFunc);
  }
  function H3(id, cls, style, contentFunc) {
    return EL('h3', id, cls, style, null, null, null, contentFunc);
  }
  function SPAN(id, cls, style, contentFunc) {
    return EL('span', id, cls, style, null, null, null, contentFunc);
  }
  function ICON(id, cls, style, contentFunc) {
    return EL('i', id, cls, style, null, null, null, contentFunc);
  }
  function LABEL(cls, style, for1, contentFunc) {
    var map = new Map();
    if (for1 && for1.length > 0) {
      map.set('for', for1);
    }
    return EL('label', null, cls, style, null, null, map, contentFunc);
  }
  function INPUT(id, type, is, cls, style, attribs, contentFunc) {
    return EL('input', id, cls, style, is, type, attribs, contentFunc);
  }
  function SELECT(id, is, cls, style, attribs, contentFunc) {
    return EL('select', id, cls, style, is, null, attribs, contentFunc);
  }
  function runGridCommand(container, commandParam) {
    return genericEditDx.runGridCommand(container, commandParam);
  }
  var _default = _exports.default = {
    renderForm: renderForm,
    getItemValues: getItemValues,
    runGridCommand: runGridCommand,
    setFormValues: setFormValues,
    resetToDefaults: resetToDefaults,
    registerEditor: registerEditor,
    runCommand: runCommand,
    registerCommandProcessor: registerCommandProcessor
  };
});
