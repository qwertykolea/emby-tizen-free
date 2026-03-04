define(["exports", "./../dialoghelper/dialoghelper.js", "./../layoutmanager.js", "./../common/globalize.js", "./../common/usersettings/usersettings.js", "./../emby-elements/emby-toggle/emby-toggle.js", "./../emby-elements/emby-select/emby-select.js", "./../emby-elements/emby-button/emby-button.js", "./../emby-elements/emby-button/paper-icon-button-light.js", "./../emby-elements/emby-dialogclosebutton/emby-dialogclosebutton.js"], function (_exports, _dialoghelper, _layoutmanager, _globalize, _usersettings, _embyToggle, _embySelect, _embyButton, _paperIconButtonLight, _embyDialogclosebutton) {
  Object.defineProperty(_exports, "__esModule", {
    value: true
  });
  _exports.default = void 0;
  /* jshint module: true */

  var supportsCssVariables = CSS.supports('color', 'var(--fake-var)');
  var supportsCalc = CSS.supports('width', 'min(45.2%,calc(100% - .65em))');
  var supportsMin = CSS.supports('width', 'min(10em, 5vw)');
  require(['flexStyles', 'formDialogStyle', 'material-icons']);
  function onSubmit(e) {
    e.preventDefault();
    return false;
  }
  function getViewTypes(column) {
    var allCardTypes = 'primary,banner,disc,logo,thumb';
    var viewTypes = column.viewTypes || 'cards,datagrid';
    return viewTypes.replace('cards', allCardTypes);
  }
  function initEditor(context, options) {
    context.querySelector('form').addEventListener('submit', onSubmit);
    var visibleSettings = options.visibleSettings || [];
    var fieldsSection = context.querySelector('.showFieldsSection');
    var availableFields = options.availableFields || [];
    var html = '';
    for (var i = 0, length = availableFields.length; i < length; i++) {
      var column = availableFields[i];
      html += '<label class="hide viewField toggleContainer toggleContainer-listItem fieldset-field" data-field="' + column.id + '" data-includeviewtype="' + getViewTypes(column) + '">';
      html += '<input is="emby-toggle" type="checkbox" class="chkField" />';
      html += '<span>' + column.name + '</span>';
      html += '</label>';
    }
    fieldsSection.querySelector('.showFieldsList').innerHTML = html;
    var settingElements = context.querySelectorAll('.viewSetting');
    for (var _i = 0, _length = settingElements.length; _i < _length; _i++) {
      if (!visibleSettings.includes(settingElements[_i].getAttribute('data-settingname'))) {
        settingElements[_i].classList.add('hide');
      } else {
        settingElements[_i].classList.remove('hide');
      }
    }
    var selectImageType = context.querySelector('.selectImageType');
    var viewOptionsToRemove = [];
    for (var _i2 = 0, _length2 = selectImageType.options.length; _i2 < _length2; _i2++) {
      if (!options.viewOptions.includes(selectImageType.options[_i2].value)) {
        viewOptionsToRemove.push(selectImageType.options[_i2]);
      }
    }
    for (var _i3 = 0, _length3 = viewOptionsToRemove.length; _i3 < _length3; _i3++) {
      viewOptionsToRemove[_i3].remove();
    }
  }
  function selectEnabledFields(context, settings) {
    var elems = context.querySelectorAll('.chkField');
    var fields = settings.fields || [];
    for (var i = 0, length = elems.length; i < length; i++) {
      elems[i].checked = fields.includes(elems[i].closest('.viewField').getAttribute('data-field'));
    }
  }
  function setCardSizeByName(context, cardSize) {
    switch (cardSize) {
      case 'default':
        cardSize = '';
        break;
      default:
        break;
    }
    var selectCardSize = context.querySelector('.selectCardSize');
    selectCardSize.value = cardSize;
  }
  function setFieldValues(context, settings) {
    var elems = context.querySelectorAll('.viewSetting-toggleContainer');
    for (var i = 0, length = elems.length; i < length; i++) {
      elems[i].querySelector('input').checked = settings[elems[i].getAttribute('data-settingname')] || false;
    }
    context.querySelector('.selectImageType').value = settings.imageType || 'primary';
    setCardSizeByName(context, settings.cardSize || 'default');
    selectEnabledFields(context, settings);
  }
  function saveFields(context, settingsKey) {
    var elems = context.querySelectorAll('.viewField:not(.hide) .chkField:checked');
    var fields = [];
    for (var i = 0, length = elems.length; i < length; i++) {
      fields.push(elems[i].closest('.viewField').getAttribute('data-field'));
    }
    if (!fields.length) {
      fields.push('None');
    }
    _usersettings.default.set(settingsKey + '-fields', fields.join(','), false);
  }
  function saveValues(context, settingsKey) {
    var elems = context.querySelectorAll('.viewSetting-toggleContainer');
    for (var i = 0, length = elems.length; i < length; i++) {
      _usersettings.default.set(settingsKey + '-' + elems[i].getAttribute('data-settingname'), elems[i].querySelector('input').checked);
    }
    _usersettings.default.set(settingsKey + '-imageType', context.querySelector('.selectImageType').value, false);
    _usersettings.default.set(settingsKey + '-cardSize', context.querySelector('.selectCardSize').value, false);
    saveFields(context, settingsKey);
  }
  function mapFieldToId(field) {
    return field.id;
  }
  function showOrHideFieldsIfAllowed(context, availableFields, currentViewType) {
    var fields = context.querySelectorAll('.viewField');
    var anyVisible;
    var availableFieldIds = availableFields.map(mapFieldToId);
    for (var i = 0, length = fields.length; i < length; i++) {
      var field = fields[i];
      var viewTypes = field.getAttribute('data-includeviewtype').split(',');
      var fieldId = field.getAttribute('data-field');
      if (!viewTypes.includes(currentViewType) || !availableFieldIds.includes(fieldId)) {
        field.classList.add('hide');
      } else {
        field.classList.remove('hide');
        anyVisible = true;
      }
    }
    var container = context.querySelector('.showFieldsSection');
    if (anyVisible) {
      container.classList.remove('hide');
    } else {
      container.classList.add('hide');
    }
  }
  function enableDefaultFields(context, defaultFields) {
    var elems = context.querySelectorAll('.viewField:not(.hide) .chkField');
    for (var i = 0, length = elems.length; i < length; i++) {
      elems[i].checked = defaultFields.includes(elems[i].closest('.viewField').getAttribute('data-field'));
    }
  }
  function ViewSettings() {}
  ViewSettings.prototype.show = function (options) {
    return require(['text!./modules/viewsettings/viewsettings.template.html']).then(function (responses) {
      var template = responses[0];
      var dialogOptions = {
        removeOnClose: true,
        scrollY: false,
        // allow a little space between the borders
        offsetTop: 2,
        positionTo: options.positionTo,
        positionY: options.positionY
      };
      if (_layoutmanager.default.tv) {
        dialogOptions.size = 'fullscreen';
      }
      var dlg = _dialoghelper.default.createDialog(dialogOptions);
      dlg.classList.add('formDialog');
      var html = '';
      html += '<div class="formDialogHeader">';
      html += '<button type="button" is="emby-dialogclosebutton" closetype="done"></button>';
      html += '<h3 class="formDialogHeaderTitle">' + _globalize.default.translate('Settings') + '</h3>';
      html += '</div>';
      html += template;
      dlg.innerHTML = _globalize.default.translateDocument(html, 'sharedcomponents');
      initEditor(dlg, options);
      setFieldValues(dlg, options.settings);
      dlg.querySelector('.selectImageType').addEventListener('change', function (e) {
        var _e$detail;
        var visibleSettings = options.visibleSettings || [];
        if (supportsCalc && supportsMin && supportsCssVariables && this.value !== 'datagrid' && this.value !== 'list' && visibleSettings.includes('imageSize')) {
          dlg.querySelector('.fldCardSize').classList.remove('hide');
        } else {
          dlg.querySelector('.fldCardSize').classList.add('hide');
        }
        showOrHideFieldsIfAllowed(dlg, options.availableFields, this.value);
        if (((_e$detail = e.detail) == null ? void 0 : _e$detail.resetFields) !== false) {
          enableDefaultFields(dlg, this.value === 'datagrid' ? options.settings.tableDefaultFields : options.settings.defaultFields);
        }
      });
      var submitted;
      dlg.querySelector('.selectImageType').dispatchEvent(new CustomEvent('change', {
        detail: {
          resetFields: false
        }
      }));
      dlg.querySelector('form').addEventListener('change', function () {
        submitted = true;
        if (options.onChange) {
          saveValues(dlg, options.settingsKey);
          options.onChange();
        }
      });
      return _dialoghelper.default.open(dlg).then(function () {
        if (submitted) {
          return Promise.resolve();
        }
        return Promise.reject();
      });
    });
  };
  var _default = _exports.default = ViewSettings;
});
