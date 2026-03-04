define(["exports", "./../dom.js", "./../common/playback/playbackmanager.js", "./../emby-apiclient/connectionmanager.js", "./../common/itemmanager/itemmanager.js", "./../shortcuts.js", "./../commandprocessor.js", "./../common/textencoding.js", "./../input/keyboard.js"], function (_exports, _dom, _playbackmanager, _connectionmanager, _itemmanager, _shortcuts, _commandprocessor, _textencoding, _keyboard) {
  Object.defineProperty(_exports, "__esModule", {
    value: true
  });
  _exports.default = void 0;
  /* jshint module: true */

  require(['css!modules/multiselect/multiselect.css']);
  var rangeSelectionInfo;
  var selectedItems = [];
  var selectedItemsMap = {};
  var currentSelectionCommandsPanel;
  var appHeader = document.querySelector('.skinHeader');
  var currentHeader;
  function getSelectedItemsMap(serverId) {
    if (!serverId) {
      serverId = '0';
    }
    return selectedItemsMap[serverId] || (selectedItemsMap[serverId] = {});
  }
  function hideSelections() {
    _dom.default.removeEventListener(window, 'keydown', onKeyDown, {});
    var selectionCommandsPanel = currentSelectionCommandsPanel;
    if (selectionCommandsPanel) {
      selectionCommandsPanel.remove();
      currentSelectionCommandsPanel = null;
      selectedItems = [];
      selectedItemsMap = {};
      rangeSelectionInfo = null;
      var elems = document.querySelectorAll('.multi-select-active');
      var i, length;
      for (i = 0, length = elems.length; i < length; i++) {
        elems[i].classList.remove('multi-select-active');
        _dom.default.removeEventListener(elems[i], 'pointerenter', onPointerEnter, {
          passive: true,
          capture: true
        });
        elems[i].dispatchEvent(new CustomEvent('multiselectinactive', {
          bubbles: true,
          cancelable: false,
          detail: {}
        }));
      }
      elems = document.querySelectorAll('.chkItemSelect:checked');
      for (i = 0, length = elems.length; i < length; i++) {
        elems[i].checked = false;
        elems[i].classList.remove('chkItemSelect-selecthint');
      }
      elems = document.querySelectorAll('.item-multiselected');
      for (i = 0, length = elems.length; i < length; i++) {
        elems[i].classList.remove('item-multiselected');
      }
    }
    if (currentHeader) {
      currentHeader.classList.remove('headroomDisabled');
      currentHeader = null;
    }
  }
  function getSelectedItemsContainer() {
    var _rangeSelectionInfo;
    return ((_rangeSelectionInfo = rangeSelectionInfo) == null ? void 0 : _rangeSelectionInfo.itemsContainer) || document.querySelector('.multi-select-active');
  }
  function executeCommand(command, hideSelectionsEarly) {
    var items = selectedItems;
    var itemsContainer = getSelectedItemsContainer();
    if (hideSelectionsEarly) {
      hideSelections();
    }
    return _commandprocessor.default.executeCommand(command, items, {
      itemsContainer: itemsContainer
    }).then(hideSelections);
  }
  function onCommandButtonClick(e) {
    var btn = e.target.closest('button');
    if (!btn) {
      return;
    }
    executeCommand(btn.getAttribute('data-command'));
  }
  function showSelectionCommands(chkItemSelect) {
    var selectionCommandsPanel = currentSelectionCommandsPanel;
    if (!selectionCommandsPanel) {
      selectionCommandsPanel = document.createElement('div');
      selectionCommandsPanel.classList.add('selectionCommandsPanel');
      var dialog = chkItemSelect.closest('.dialog');
      var header = (dialog == null ? void 0 : dialog.querySelector('.formDialogHeader')) || appHeader;
      currentHeader = header;
      header.appendChild(selectionCommandsPanel);
      header.classList.add('headroomDisabled');
      if (dialog) {
        dialog.removeEventListener('close', hideSelections);
        dialog.addEventListener('close', hideSelections);
      }
      currentSelectionCommandsPanel = selectionCommandsPanel;
      var html = '';
      html += '<button is="paper-icon-button-light" class="btnCloseSelectionPanel"><i class="md-icon">close</i></button>';
      html += '<h1 class="itemSelectionCount"></h1>';
      html += '<div class="multiSelectActionsContainer flex align-items-center">';
      html += '<div class="multiSelectPrimaryButtons flex align-items-center">';
      html += '</div>';
      html += '<button is="paper-icon-button-light" class="btnSelectionPanelOptions md-icon">&#xe5D3;</button>';
      html += '</div>';
      selectionCommandsPanel.innerHTML = html;
      selectionCommandsPanel.querySelector('.btnCloseSelectionPanel').addEventListener('click', hideSelections);
      selectionCommandsPanel.querySelector('.multiSelectPrimaryButtons').addEventListener('click', onCommandButtonClick);
      var btnSelectionPanelOptions = selectionCommandsPanel.querySelector('.btnSelectionPanelOptions');
      _dom.default.addEventListener(btnSelectionPanelOptions, 'click', showMenuForSelectedItems, {
        passive: true
      });
    }
  }
  function mapApiClientArrayToObject(responses) {
    var map = {};
    for (var i = 0, length = responses.length; i < length; i++) {
      var user = responses[i];
      map[user.ServerId] = user;
    }
    return map;
  }
  function getUsersFromServersForSelectedItems(items) {
    var promises = [];
    var servers = {};
    for (var i = 0, length = items.length; i < length; i++) {
      var item = items[i];
      var serverId = item.ServerId;
      if (!serverId || servers[serverId]) {
        continue;
      }
      servers[serverId] = true;
      promises.push(_connectionmanager.default.getApiClient(item).getCurrentUser());
    }
    return Promise.all(promises).then(mapApiClientArrayToObject);
  }
  function showMenuForSelectedItems(e) {
    var items = selectedItems;
    var button = e.target.closest('button');
    return getUsersFromServersForSelectedItems(items).then(function (users) {
      return Emby.importModule('./modules/itemcontextmenu.js').then(function (itemContextMenu) {
        var itemsContainer = getSelectedItemsContainer();
        return itemContextMenu.show({
          items: items,
          hasItemIcon: true,
          positionTo: button,
          users: users,
          multiSelect: false,
          positionY: 'bottom',
          itemsContainer: itemsContainer
        }).then(hideSelections);
      });
    });
  }
  function getSelectedItemIdentifier(item) {
    // defaulting to item allows multi-select to be used even when items don't have an id
    return item.PlaylistItemId || item.Id || item;
  }
  function isPrimaryCommand(command) {
    return command.primaryCommand === true;
  }
  function showHideQuickButtons() {
    var _connectionManager$ge;
    var panel = currentSelectionCommandsPanel;
    if (!panel) {
      return;
    }
    var multiSelectPrimaryButtons = panel.querySelector('.multiSelectPrimaryButtons');
    var items = selectedItems;
    if (!items.length) {
      multiSelectPrimaryButtons.innerHTML = '';
      return;
    }
    var user = (_connectionManager$ge = _connectionmanager.default.getApiClient(items[0])) == null ? void 0 : _connectionManager$ge.getCurrentUserCached();
    var commands = _itemmanager.default.getCommands({
      items: items,
      user: user
    }).filter(isPrimaryCommand);
    var html = '';
    var buttonCount = 0;
    for (var i = 0, length = commands.length; i < length && buttonCount < 3; i++) {
      var command = commands[i];
      var name = _textencoding.default.htmlEncode(command.name);
      var icon = command.icon;
      var iconClass = 'md-icon autortl';

      // todo: this code is duplicated in listview/multiselect
      switch (icon) {
        case '&#xe88a;':
        case '&#xe034;':
        case '&#xe037;':
        case '&#xe042;':
        case '&#xe044;':
        case '&#xe045;':
        case '&#xe047;':
        case '&#xe061;':
        case '&#xe062;':
          iconClass += ' md-icon-fill';
          break;
        default:
          break;
      }
      html += '<button is="paper-icon-button-light" data-command="' + command.id + '" class="' + iconClass + '" title="' + name + '" aria-label="' + name + '">' + icon + '</button>';
      buttonCount++;
    }
    multiSelectPrimaryButtons.innerHTML = html;
  }
  function addOrRemoveSelectedItem(item, itemElement, add) {
    var serverId = item.ServerId;
    var id = getSelectedItemIdentifier(item);
    if (add) {
      if (itemElement) {
        itemElement.classList.add('item-multiselected');
      }
      var current = selectedItems.filter(function (i) {
        return getSelectedItemIdentifier(i) === id && i.ServerId === serverId;
      });
      if (!current.length) {
        selectedItems.push(item);
        getSelectedItemsMap(serverId)[id] = true;
      }
    } else {
      if (itemElement) {
        itemElement.classList.remove('item-multiselected');
      }
      selectedItems = selectedItems.filter(function (i) {
        return getSelectedItemIdentifier(i) !== id || i.ServerId !== serverId;
      });
      getSelectedItemsMap(serverId)[id] = null;
    }
  }
  function onPointerEnter(e) {
    var rangeInfo = rangeSelectionInfo;
    if (!rangeInfo) {
      return;
    }
    var target = e.target;
    var itemsContainer = this;
    if (!target.matches(itemsContainer.getItemSelector())) {
      return;
    }
    setRangeSelectionInfo(e, itemsContainer, target, true);
  }
  function showSelections(chkItemSelect, selected) {
    if (!chkItemSelect.classList.contains('chkItemSelect')) {
      chkItemSelect = chkItemSelect.querySelector('.chkItemSelect');
    }
    if (selected == null) {
      selected = chkItemSelect.checked;
    } else {
      chkItemSelect.checked = selected;
    }
    var itemsContainer = chkItemSelect.closest('[is=emby-itemscontainer]');
    var itemElement = _shortcuts.default.getItemElementFromChildNode(chkItemSelect, true, itemsContainer);
    var item = _shortcuts.default.getItemFromChildNode(itemElement, null, itemsContainer);
    addOrRemoveSelectedItem(item, itemElement, selected);
    if (selectedItems.length) {
      _dom.default.removeEventListener(window, 'keydown', onKeyDown, {});
      _dom.default.addEventListener(window, 'keydown', onKeyDown, {});
      if (!itemsContainer.classList.contains('multi-select-active')) {
        _dom.default.addEventListener(itemsContainer, 'pointerenter', onPointerEnter, {
          passive: true,
          capture: true
        });
      }
      itemsContainer.classList.add('multi-select-active');
      itemsContainer.dispatchEvent(new CustomEvent('multiselectactive', {
        bubbles: true,
        cancelable: false,
        detail: {}
      }));
      showSelectionCommands(chkItemSelect);
      var itemSelectionCount = document.querySelector('.itemSelectionCount');
      if (itemSelectionCount) {
        itemSelectionCount.innerHTML = selectedItems.length;
      }
    } else {
      hideSelections();
    }
    showHideQuickButtons();
  }
  function onChange(e) {
    var target = e.target;
    var chkItemSelect = target.closest('.chkItemSelect');
    if (chkItemSelect) {
      var itemsContainer = this;
      var itemElement = _shortcuts.default.getItemElementFromChildNode(target, true, itemsContainer);
      if (itemElement) {
        showSelections(chkItemSelect, chkItemSelect.checked);
        e.preventDefault();
        e.stopPropagation();
        return false;
      }
    }
  }
  function changeSelectionRange(rangeInfo, endIndex, isHintOnly) {
    var previousEndIndex = rangeInfo.endIndex;
    if (!isHintOnly) {
      rangeInfo.endIndex = endIndex;
    }
    var startIndex = rangeInfo.startIndex;
    var newRangeMin = Math.min(startIndex, endIndex);
    var newRangeMax = Math.max(startIndex, endIndex);
    var minIndexForUpdates = previousEndIndex == null ? newRangeMin : Math.min(startIndex, Math.min(endIndex, previousEndIndex));
    var maxIndexForUpdates = previousEndIndex == null ? newRangeMax : Math.max(startIndex, Math.max(endIndex, previousEndIndex));
    var itemsContainer = rangeInfo.itemsContainer;
    console.log('changeSelectionRange: minIndexForUpdates: ' + minIndexForUpdates + ', maxIndexForUpdates: ' + maxIndexForUpdates + ', newRangeMin: ' + newRangeMin + ', newRangeMax: ' + newRangeMax);
    var hinted = [];
    for (var i = minIndexForUpdates; i <= maxIndexForUpdates; i++) {
      var item = itemsContainer.getItem(i);
      if (!item) {
        continue;
      }
      var itemElement = itemsContainer.getElement(i);
      var chkItemSelect = itemElement == null ? void 0 : itemElement.querySelector('.chkItemSelect');
      var isChecked = chkItemSelect ? chkItemSelect.checked : isSelected(item);
      var newChecked = i >= newRangeMin && i <= newRangeMax;
      if (isHintOnly) {
        if (chkItemSelect) {
          if (newChecked && !isChecked) {
            chkItemSelect.classList.add('chkItemSelect-selecthint');
            hinted.push(chkItemSelect);
          } else {
            chkItemSelect.classList.remove('chkItemSelect-selecthint');
          }
        }
        continue;
      }
      if (isChecked !== newChecked) {
        if (chkItemSelect) {
          chkItemSelect.checked = newChecked;
          chkItemSelect.dispatchEvent(new CustomEvent('change', {
            bubbles: true,
            cancelable: false
          }));
        } else {
          addOrRemoveSelectedItem(item, null, newChecked);
        }
      }
    }
    if (isHintOnly) {
      var hintedElems = itemsContainer.querySelectorAll('.chkItemSelect-selecthint');
      for (var _i = 0, length = hintedElems.length; _i < length; _i++) {
        var elem = hintedElems[_i];
        if (!hinted.includes(elem)) {
          elem.classList.remove('chkItemSelect-selecthint');
        }
      }
    }
    showHideQuickButtons();
  }
  var supportsTouchEvent = 'ontouchstart' in document.documentElement;
  function removeAllHints() {
    var elems = document.querySelectorAll('.chkItemSelect-selecthint');
    for (var i = 0, length = elems.length; i < length; i++) {
      elems[i].classList.remove('chkItemSelect-selecthint');
    }
  }
  function setRangeSelectionInfo(e, itemsContainer, target, isHintOnly) {
    var pointerType = e.pointerType;
    if (!pointerType) {
      // pointer events not supported, let's take a guess
      pointerType = supportsTouchEvent ? 'touch' : 'mouse';
    }
    if (pointerType === 'touch') {
      return;
    }
    var itemElement = _shortcuts.default.getItemElementFromChildNode(target, true, itemsContainer);
    if (!itemElement) {
      return;
    }
    var indexOfElement = itemsContainer.indexOfElement(itemElement);
    var rangeInfo = rangeSelectionInfo;
    var hasShiftKey = e.shiftKey;
    if (!hasShiftKey || !rangeInfo) {
      if (isHintOnly) {
        removeAllHints();
        return;
      }
      rangeSelectionInfo = rangeInfo = {
        itemsContainer: itemsContainer,
        startIndex: indexOfElement
      };
      //console.log('new rangeInfo: ' + indexOfElement);
      return;
    }
    if (rangeInfo.itemsContainer !== itemsContainer) {
      return;
    }
    changeSelectionRange(rangeInfo, indexOfElement, isHintOnly);
  }
  function onKeyDown(e) {
    // emby-itemscontainer doesn't have an always-active keydown handler, otherwise we could just use that
    // in the event that it ever does, we could just call this from the outside similar to onContainerClick

    var key = _keyboard.default.normalizeKeyFromEvent(e);
    switch (key) {
      case ' ':
        {
          var target = e.target;
          if (target.closest('button,a')) {
            return;
          }
          var itemsContainer = target.closest('.itemsContainer');
          if (itemsContainer) {
            e.preventDefault();
            onContainerClick.call(itemsContainer, e);
          }
        }
        break;
      default:
        return;
    }
  }
  function onContainerClick(e) {
    var target = e.target;
    var chkItemSelectContainer = target.closest('.chkItemSelectContainer');
    var itemsContainer = this;
    if (chkItemSelectContainer) {
      setRangeSelectionInfo(e, itemsContainer, target);
      return false;
    }
    if (selectedItems.length) {
      var itemElement = _shortcuts.default.getItemElementFromChildNode(target, true, itemsContainer);
      if (itemElement) {
        if (!chkItemSelectContainer) {
          var chkItemSelect = itemElement.querySelector('.chkItemSelect');
          showSelections(chkItemSelect, !chkItemSelect.checked);
          setRangeSelectionInfo(e, itemsContainer, target);
          e.preventDefault();
          e.stopPropagation();
          return false;
        }
      }
    }
  }
  document.addEventListener('viewbeforehide', hideSelections);
  function MultiSelect(options) {
    options.container.addEventListener('change', onChange);
  }
  MultiSelect.prototype.showSelections = showSelections;
  MultiSelect.prototype.onContainerClick = onContainerClick;
  function isSelected(item) {
    var id = getSelectedItemIdentifier(item);
    if (!id) {
      return false;
    }
    return getSelectedItemsMap(item.ServerId)[id];
  }
  MultiSelect.isSelected = isSelected;
  MultiSelect.canPlay = function () {
    var items = selectedItems;
    for (var i = 0, length = items.length; i < length; i++) {
      if (_playbackmanager.default.canPlay(items[i])) {
        return true;
      }
    }
    return false;
  };
  MultiSelect.getSelectedItems = function () {
    return selectedItems;
  };
  MultiSelect.play = function () {
    return executeCommand('play', true);
  };
  MultiSelect.shuffle = function () {
    return executeCommand('shuffle', true);
  };
  var _default = _exports.default = MultiSelect;
});
