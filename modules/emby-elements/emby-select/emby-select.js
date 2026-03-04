define(["exports", "./../../common/globalize.js", "./../../layoutmanager.js", "./../../focusmanager.js", "./../../dom.js", "./../../input/keyboard.js", "./../../common/textencoding.js", "./../../skinviewmanager.js", "./../../customelementupgrade.js"], function (_exports, _globalize, _layoutmanager, _focusmanager, _dom, _keyboard, _textencoding, _skinviewmanager, _customelementupgrade) {
  Object.defineProperty(_exports, "__esModule", {
    value: true
  });
  _exports.default = void 0;
  /* jshint module: true */

  var EnableFocusTransfrom = _dom.default.allowFocusScaling();
  require(['css!modules/emby-elements/emby-select/emby-select.css', 'css!tv|modules/emby-elements/emby-select/emby-select_2_tv.css', 'css!!tv|modules/emby-elements/emby-select/emby-select_3_nontv.css', 'css!modules/emby-elements/emby-select/emby-select_4.css', 'css!!tv|modules/emby-elements/emby-select/emby-select_5_nontv.css', 'css!modules/emby-elements/emby-select/emby-select_6.css']);
  var ActionSheet;
  function loadAndShowActionSheet(options) {
    return Emby.importModule('./modules/actionsheet/actionsheet.js').then(function (response) {
      ActionSheet = response;
      return ActionSheet.show(options);
    });
  }
  function showActionSheet(options) {
    if (ActionSheet) {
      return ActionSheet.show(options);
    }
    return loadAndShowActionSheet(options);
  }
  function enableNativeMenu(elem) {
    if (_layoutmanager.default.tv) {
      return false;
    }
    if (elem.getItems) {
      return false;
    }
    if (elem.hasAttribute('multiple')) {
      return false;
    }
    if (_skinviewmanager.default.getSkinOptions().dontUseNativeDropDowns) {
      return false;
    }
    return elem.getAttribute('data-menu') !== 'custom';
  }
  function triggerChange(select) {
    var evt = document.createEvent("HTMLEvents");
    evt.initEvent("change", true, true);
    select.dispatchEvent(evt);
  }
  function checkAllWhenEmpty(select, virtualScroll) {
    if (emptyValueSetEqualsAll(select)) {
      if (!virtualScroll) {
        //return true;
      }
      return false;
    }
    return false;
  }
  function emptyValueSetEqualsAll(select) {
    return select.getAttribute('data-empty-is-all') !== 'false';
  }
  function showActionSheetFlyout(select) {
    //const labelElem = select.closest('label').querySelector('.selectLabelText');
    //const title = labelElem ? (labelElem.textContent || labelElem.innerText) : null;

    var fields = [];
    fields.push('Name');
    if (select.getAttribute('data-showtype') === 'true') {
      fields.push('Type');
    }
    if (select.getAttribute('data-overview') === 'true') {
      fields.push('Overview');
    }
    if (select.getItemSecondaryText || select.getAttribute('data-itemsecondarytext') === 'true') {
      fields.push('ShortOverview');
    }
    if (!fields.includes('ShortOverview')) {
      var items = getItemsFromSelectElement(select);
      for (var i = 0, length = items.length; i < length; i++) {
        if (items[i].secondaryText) {
          fields.push('ShortOverview');
          break;
        }
      }
    }
    var multiple = select.hasAttribute('multiple');
    var virtualScroll = select.getItems != null && select.getAttribute('data-virtualscroll') !== 'false';
    var options = {
      getItems: select.getItems || getItemsBound.bind(select),
      enableVirtualScroller: virtualScroll,
      // avoid the dialog sometimes getting moved on top of the select element
      autoRepositionY: virtualScroll || _layoutmanager.default.tv,
      selectedValues: select.getValues(),
      positionTo: select,
      emptyValueSetEqualsAll: checkAllWhenEmpty(select, virtualScroll),
      selectAllOnSelectNone: emptyValueSetEqualsAll(select),
      //title: title,
      resolveWithSelectedItem: true,
      nameProperty: select.getAttribute('data-name-property') || null,
      highlight: false,
      dialogClass: select.getAttribute('data-dialogclass') || null,
      hasItemImage: select.getAttribute('data-hasitemimage') === 'true',
      refreshItemsOnChange: select.getAttribute('data-refreshitemsonchange') === 'true',
      fields: fields,
      hideTitleWhenNotFullscreen: true,
      border: false,
      listItemContentWrapperClass: select.getAttribute('data-listitemcontentclass') || null,
      getItemSecondaryText: select.getItemSecondaryText,
      getItemId: getItemId.bind(select),
      multiple: multiple,
      enableDefaultIcon: select.getAttribute('data-hasitemimage') === 'true'
    };
    if (_layoutmanager.default.tv && (multiple || select.getAttribute('data-autofullscreen') !== 'false')) {
      options.dialogSize = 'fullscreen';
    }
    if (options.dialogSize !== 'fullscreen') {
      options.positionY = 'bottom';
      options.positionX = 'left';
      options.transformOrigin = 'center top';
      options.minWidthToElement = true;
      options.setDialogSize = _skinviewmanager.default.getSkinOptions().dontUseNativeDropDowns;
    }
    if (multiple) {
      options.onChange = function (value) {
        setValuesFromActionsheet(select, value);
      };
      options.enableReordering = select.getAttribute('data-reordering') === 'true';
    }
    options.hasItemSelectionState = !multiple;
    options.hasItemIcon = select.getAttribute('data-hasitemicon') === 'true';
    return showActionSheet(options).then(function (value) {
      if (!multiple) {
        if (value) {
          var selectedValues = value ? [getItemId.call(select, value)] : [];
          var selectedItems = value ? [value] : [];
          select.setValues(selectedValues, true, selectedItems);
          return Promise.resolve();
        } else {
          return setValuesFromActionsheet(select, value);
        }
      }
      return Promise.resolve();
    }, function () {});
  }
  var SupportsTouchEvent = 'ontouchstart' in document.documentElement;
  var SupportsPointerType = typeof PointerEvent !== 'undefined' && 'pointerType' in PointerEvent.prototype;
  var DefaultPointerType = SupportsPointerType ? null : SupportsTouchEvent ? 'touch' : 'mouse';
  function onPointerDown(e) {
    var pointerType = e.pointerType || DefaultPointerType;

    // e.button=0 for primary (left) mouse button click
    if (!e.button && !enableNativeMenu(this)) {
      e.preventDefault();
      if (!this.disabled) {
        if (pointerType === 'mouse') {
          showActionSheetFlyout(this);
        }
      }
    }
  }
  function onLabelClick(e) {
    // clicking the label is causing the native ui to appear in iOS safari
    if (!e.button) {
      var select = this.querySelector('select');
      if (select) {
        if (!enableNativeMenu(select)) {
          e.preventDefault();
          if (!select.disabled) {
            // TODO: we may not need the layoutManager condition here, but it needs testing
            if (_layoutmanager.default.tv && document.activeElement !== document.body) {
              _focusmanager.default.focus(select);
            }
            showActionSheetFlyout(select);
          }
        }
      }
    }
  }
  function onKeyDown(e) {
    var key = _keyboard.default.normalizeKeyFromEvent(e);
    switch (key) {
      case 'Enter':
        // keyCode 195 is GamePadA. Those events do not open the native dropdown, so we need to show our own
        if (enableNativeMenu(this) && e.keyCode !== 195) {
          var target = e.target;
          if (target.showPicker) {
            target.showPicker();
          }
        } else {
          e.preventDefault();
          // needed to prevent the dialog from immediately closing
          e.stopPropagation();
          if (!e.repeat) {
            showActionSheetFlyout(this);
          }
        }
        return;
      case ' ':
        if (!enableNativeMenu(this)) {
          e.preventDefault();
          if (!e.repeat) {
            showActionSheetFlyout(this);
          }
        }
        return;
      case 'ArrowLeft':
      case 'ArrowRight':
      case 'ArrowUp':
      case 'ArrowDown':
        if (!enableNativeMenu(this) && !e.altKey && !e.shiftKey) {
          e.preventDefault();
        }
        return;
      default:
        break;
    }
  }
  function onClick(e) {
    if (!enableNativeMenu(this)) {
      e.stopPropagation();
      e.preventDefault();
      if (!this.disabled) {
        showActionSheetFlyout(this);
      }
    }
  }
  var inputId = 0;
  function onInit() {
    var elem = this;
    if (elem.hasInit) {
      return;
    }
    elem.hasInit = true;
    this._multipleValues = [];
    if (!this.id) {
      this.id = 'embyselect' + inputId;
      inputId++;
    }
    if (this.hasAttribute('multiple') && !this.getItems) {
      this.getItems = genericElemGetItems;
    }
    if (_dom.default.allowBackdropFilter()) {
      this.classList.add('emby-select-backdropfilter');
    }
    if (EnableFocusTransfrom) {
      this.classList.add('emby-select-focusscale');
    }
    this.removeEventListener(window.PointerEvent ? 'pointerdown' : 'mousedown', onPointerDown);
    this.addEventListener(window.PointerEvent ? 'pointerdown' : 'mousedown', onPointerDown);
    this.removeEventListener('keydown', onKeyDown);
    this.addEventListener('keydown', onKeyDown);
    this.removeEventListener('click', onClick);
    this.addEventListener('click', onClick);
  }
  function getItemDisplayHtml(item) {
    var select = this;
    var nameProp = select.getAttribute('data-name-property') || 'Name';
    var name = item[nameProp];
    if (select.getSelectedItemDisplayHtml) {
      return select.getSelectedItemDisplayHtml(item, name);
    }
    return name;
  }
  function getAllSelectedLabel(select) {
    return select.getAttribute('allselected-labeltext') || _globalize.default.translate('Any');
  }
  function enableAutoRevertToAnyUsingTotalRecordCount(select) {
    return select.getAttribute('data-autoallany') !== 'false';
  }
  function getTotalRecordCount(select) {
    var totalRecordCount = select._totalRecordCount;
    if (totalRecordCount != null) {
      return Promise.resolve(totalRecordCount);
    }
    return getItems(select, {
      Limit: 0
    }).then(function (result) {
      select._totalRecordCount = result.TotalRecordCount;
      return result.TotalRecordCount;
    });
  }
  function hasAnyItems(select) {
    var totalRecordCount = select._totalRecordCount;
    if (totalRecordCount != null) {
      return Promise.resolve(totalRecordCount > 0);
    }
    return getItems(select, {
      Limit: 1,
      EnableTotalRecordCount: false
    }).then(function (result) {
      return result.Items.length > 0;
    });
  }
  function setLabelWhenNoValuesSelected(select) {
    if (select.hasAttribute('multiple')) {
      var emptyEqualsAll = emptyValueSetEqualsAll(select);
      ensureSelectNameLabel(select).innerHTML = emptyEqualsAll ? getAllSelectedLabel(select) : _globalize.default.translate('');
    } else {
      ensureSelectNameLabel(select).innerHTML = '';
    }
  }
  var labelLimit = 8;
  function setLabelFromItems(select, items) {
    var suffix = '';
    if (items.length > labelLimit) {
      suffix = '...';
      items = items.slice(0, labelLimit);
    }
    ensureSelectNameLabel(select).innerHTML = items.map(getItemDisplayHtml.bind(select)).join(' / ') + suffix;
  }
  function getItemId(item) {
    var select = this;
    if (select.getItemId) {
      return select.getItemId(item);
    }
    var idProp = select.getAttribute('data-id-property');
    if (idProp) {
      return item[idProp];
    }
    if (item.Id != null) {
      return item.Id;
    }
    if (item.id != null && item.id !== '') {
      return item.id;
    }
    if (item.value != null) {
      return item.value;
    }
    return item.Name || item.name;
  }
  function setLabelFromNamesOfValues(select, values) {
    var suffix = '';
    if (values.length > labelLimit) {
      suffix = '...';
      values = values.slice(0, labelLimit);
    }
    return getItems(select, {
      Ids: values
    }).then(function (result) {
      var items = result.Items;
      if (items.length > values.length) {
        items = items.filter(function (i) {
          var itemId = getItemId.call(select, i);
          return itemId != null && values.includes(itemId);
        });
      }
      ensureSelectNameLabel(select).innerHTML = items.map(getItemDisplayHtml.bind(select)).join(' / ') + suffix;
    });
  }
  function setLabelFromSelectedItems(select, selectedItems) {
    if (!selectedItems.length && !select.parentContainer) {
      setLabelWhenNoValuesSelected(select);
      return;
    }

    // it's much faster to just check for one item than to get the total record count, so optimize when possible
    var hasAnyPromise = selectedItems.length ? Promise.resolve(true) : hasAnyItems(select);
    return hasAnyPromise.then(function (any) {
      if (select.parentContainer) {
        if (any) {
          select.parentContainer.classList.remove('hide');
        } else {
          select.parentContainer.classList.add('hide');
        }
      }
      if (!selectedItems.length) {
        setLabelWhenNoValuesSelected(select);
        return;
      }
      if (!select.hasAttribute('multiple')) {
        return setLabelFromItems(select, selectedItems);
      }
      var emptyEqualsAll = emptyValueSetEqualsAll(select);
      if (!emptyEqualsAll) {
        return setLabelFromItems(select, selectedItems);
      }
      if (!enableAutoRevertToAnyUsingTotalRecordCount(select)) {
        return setLabelFromItems(select, selectedItems);
      }
      return getTotalRecordCount(select).then(function (totalRecordCount) {
        if (selectedItems.length === totalRecordCount) {
          ensureSelectNameLabel(select).innerHTML = getAllSelectedLabel(select);
          return;
        }
        return setLabelFromItems(select, selectedItems);
      });
    });
  }
  function setLabelFromValues(select, values) {
    if (!values.length && !select.parentContainer) {
      setLabelWhenNoValuesSelected(select);
      return;
    }

    // it's much faster to just check for one item than to get the total record count, so optimize when possible
    var hasAnyPromise = values.length ? Promise.resolve(true) : hasAnyItems(select);
    return hasAnyPromise.then(function (any) {
      if (select.parentContainer) {
        if (any) {
          select.parentContainer.classList.remove('hide');
        } else {
          select.parentContainer.classList.add('hide');
        }
      }
      if (!values.length) {
        setLabelWhenNoValuesSelected(select);
        return;
      }
      if (!select.hasAttribute('multiple')) {
        return setLabelFromNamesOfValues(select, values);
      }
      var emptyEqualsAll = emptyValueSetEqualsAll(select);
      if (!emptyEqualsAll) {
        return setLabelFromNamesOfValues(select, values);
      }
      if (!enableAutoRevertToAnyUsingTotalRecordCount(select)) {
        return setLabelFromNamesOfValues(select, values);
      }
      return getTotalRecordCount(select).then(function (totalRecordCount) {
        if (values.length === totalRecordCount) {
          ensureSelectNameLabel(select).innerHTML = getAllSelectedLabel(select);
          return;
        }
        return setLabelFromNamesOfValues(select, values);
      });
    });
  }
  function getItemsBound(query) {
    return getItems(this, query);
  }
  function getItemsFromSelectElement(elem) {
    var selectOptions = elem.options;
    var items = [];
    for (var i = 0, length = selectOptions.length; i < length; i++) {
      var option = selectOptions[i];
      var item = {
        Name: option.textContent || option.innerText,
        Selected: option.selected,
        secondaryText: option.getAttribute('data-description') || option.title,
        icon: option.getAttribute('data-icon') || null
      };
      if (option.id != null && option.id !== '') {
        item.Id = option.id;
      } else if (option.value != null) {
        item.Id = option.value;
      } else {
        item.Id = option.Name || option.name;
      }
      items.push(item);
    }
    return items;
  }
  function genericElemGetItems(query) {
    var items = [];
    var options = this.options || this.positionTo.options;
    var valuesFilter = query && query.Ids ? query.Ids : null;
    for (var i = 0, length = options.length; i < length; i++) {
      var option = options[i];
      var item = {
        Id: option.value,
        Name: option.text
      };
      if (valuesFilter) {
        if (valuesFilter.includes(item.Id)) {
          items.push(item);
        }
      } else {
        items.push(item);
      }
    }
    return Promise.resolve({
      Items: items,
      TotalRecordCount: items.length
    });
  }
  function getItems(elem, query) {
    if (elem.hasAttribute('multiple') || elem.getItems) {
      return elem.getItems(query || {});
    } else {
      var items = getItemsFromSelectElement(elem);
      return Promise.resolve({
        Items: items,
        TotalRecordCount: items.length
      });
    }
  }
  function ensureWrapper(select) {
    var wrapper = select.closest('.emby-select-wrapper');
    if (!wrapper) {
      var label = document.createElement('label');
      label.classList.add('selectLabel');
      wrapper = document.createElement('div');
      wrapper.classList.add('emby-select-wrapper');
      if (select.classList.contains('emby-select-inline')) {
        wrapper.classList.add('emby-select-wrapper-inline');
      }
      label.appendChild(wrapper);
      select.parentNode.replaceChild(label, select);
      wrapper.appendChild(select);
    }
    return wrapper;
  }
  function ensureSelectNameLabel(select) {
    var nameLabel = select.nameLabel;
    if (!nameLabel) {
      var wrapper = ensureWrapper(select);
      var className = 'emby-select-selectedNameContainer';
      if (select.classList.contains('emby-select-inline')) {
        className += ' emby-select-selectedNameContainer-inline';
      }
      wrapper.insertAdjacentHTML('beforeend', '<div class="' + className + '"><div class="emby-select-selectedName"></div></div>');
      select.nameLabel = nameLabel = wrapper.querySelector('.emby-select-selectedName');
    }
    return nameLabel;
  }
  function setValuesFromActionsheet(select, values) {
    if (!values.length || !emptyValueSetEqualsAll(select) || !select.hasAttribute('multiple')) {
      select.setValues(values, true);
      return Promise.resolve();
    }
    if (!enableAutoRevertToAnyUsingTotalRecordCount(select)) {
      select.setValues(values, true);
      return Promise.resolve();
    }
    return getTotalRecordCount(select).then(function (totalRecordCount) {
      if (values.length >= totalRecordCount) {
        values = [];
      }
      select.setValues(values, true);
    });
  }
  function setDynamicFieldDescription(select) {
    var _select$closest;
    if (!select.classList.contains('emby-select-dynamicfielddescription')) {
      return;
    }
    var fieldDescription = (_select$closest = select.closest('.selectContainer')) == null ? void 0 : _select$closest.querySelector('.dynamicFieldDescription');
    if (!fieldDescription) {
      return;
    }
    var selectedOption = getItemsFromSelectElement(select).filter(function (s) {
      return s.Selected;
    })[0];
    var description = (selectedOption == null ? void 0 : selectedOption.secondaryText) || '';
    fieldDescription.innerHTML = _textencoding.default.htmlEncode(description);
    if (description) {
      fieldDescription.classList.remove('hide');
    } else {
      fieldDescription.classList.add('hide');
    }
  }
  var EmbySelect = /*#__PURE__*/function (_HTMLSelectElement) {
    function EmbySelect() {
      var _this;
      // address the upgraded instance and use it
      var self = _this = _HTMLSelectElement.call(this) || this;
      onInit.call(self);
      return babelHelpers.possibleConstructorReturn(_this, self);
    }
    babelHelpers.inherits(EmbySelect, _HTMLSelectElement);
    return babelHelpers.createClass(EmbySelect, [{
      key: "getValues",
      value: function getValues() {
        return this._multipleValues;
      }
    }, {
      key: "setValues",
      value: function setValues(values, triggerChangeEvent, selectedItems) {
        if (this.hasAttribute('multiple') || this.getItems) {
          this._multipleValues = values;
          if (this.getItems && this.getItems !== genericElemGetItems) {
            // needed to fool html form validation
            this.innerHTML = '<option selected value="' + (values[0] || '') + '"></option>';
          }
          if (selectedItems) {
            setLabelFromSelectedItems(this, selectedItems);
          } else {
            setLabelFromValues(this, values);
          }
        } else {
          this.value = Array.isArray(values) ? values[0] || '' : values || '';
        }
        if (triggerChangeEvent) {
          triggerChange(this);
        }
        setDynamicFieldDescription(this);
      }
    }, {
      key: "values",
      get: function () {
        return this.getValues();
      }

      // for some reason this is available in older browser sooner than the setValues method
      ,
      set: function (values) {
        this.setValues(values);
      }
    }, {
      key: "singleValue",
      get: function () {
        //console.log('embyselect getvalue: ' + this.className);

        if (this.getItems) {
          return this._multipleValues[0] || '';
        }
        return this.value;
      },
      set: function (val) {
        //console.log('embyselect setvalue: ' + this.className);

        if (this.getItems) {
          var newValues = val != null && val !== '' ? [val] : [];
          setLabelFromValues(this, newValues);
          this._multipleValues = newValues;
          if (this.getItems !== genericElemGetItems) {
            // needed to fool html form validation
            this.innerHTML = '<option value="' + val + '"></option>';
          }
        } else {
          this.value = val;
        }
        setDynamicFieldDescription(this);
      }
    }, {
      key: "connectedCallback",
      value: function connectedCallback() {
        onInit.call(this);
        if (this.classList.contains('emby-select')) {
          return;
        }
        var wrapper = this.closest('.emby-select-wrapper');
        if (!wrapper) {
          wrapper = ensureWrapper(this);
          return;
        }
        var label = this.closest('label');
        var multiple = this.hasAttribute('multiple');
        if (multiple) {
          this.size = 1;

          // prevent safari from showing the scrollbar
          this.classList.add('hiddenScrollY');
        }
        this.classList.add('emby-select');
        var labelText = this.getAttribute('label') || '';
        var labelFormatArgs = this.getAttribute('data-labelformatargs');
        if (labelFormatArgs) {
          labelFormatArgs = labelFormatArgs.split('|');
          labelFormatArgs.unshift(labelText);
          labelText = _globalize.default.translate.apply(this, labelFormatArgs);
        }
        var labelTextClass = 'selectLabelText';
        var arrowContainerClass = 'selectArrowContainer';
        if (this.classList.contains('emby-select-inline')) {
          label.classList.add('selectLabel-inline');
          labelTextClass += ' selectLabelText-inline';
          if (this.getAttribute('data-hidelabeltext') === 'true') {
            labelTextClass += ' hide';
          }
          arrowContainerClass += ' selectArrowContainer-inline';
        }
        label.classList.add('selectLabel');
        label.insertAdjacentHTML('afterbegin', '<div class="' + labelTextClass + '">' + labelText + '</div>');
        label.removeEventListener('click', onLabelClick);
        label.addEventListener('click', onLabelClick);
        if (multiple || this.getItems) {
          ensureSelectNameLabel(this);
        }
        wrapper.insertAdjacentHTML('beforeend', '<div class="' + arrowContainerClass + '"><i class="selectArrow md-icon">&#xe313;</i></div>');
        if (!enableNativeMenu(this)) {
          this.classList.add('emby-select-nopointer');
        }
        this.__upgraded = true;
        this.dispatchEvent(new CustomEvent('upgraded', {
          cancelable: false
        }));
      }
    }, {
      key: "disconnectedCallback",
      value: function disconnectedCallback() {}
    }, {
      key: "setLabel",
      value: function setLabel(text) {
        var container = this.closest('label');
        var label = container.querySelector('.selectLabelText');
        label.innerHTML = text;
      }
    }]);
  }(/*#__PURE__*/babelHelpers.wrapNativeSuper(HTMLSelectElement));
  customElements.define('emby-select', EmbySelect, {
    extends: 'select'
  });
  var _default = _exports.default = EmbySelect;
});
