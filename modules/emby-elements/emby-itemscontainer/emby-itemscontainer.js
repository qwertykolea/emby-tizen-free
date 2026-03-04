define(["exports", "./../../browser.js", "./../../dom.js", "./../../layoutmanager.js", "./../../emby-apiclient/events.js", "./../../emby-apiclient/connectionmanager.js", "./../../lazyloader/lazyimageloader.js", "./../../virtual-scroller/virtual-scroller.js", "./../../shortcuts.js", "./../../common/inputmanager.js", "./../../focusmanager.js", "./../../common/itemsrefresher.js", "./../../common/itemmanager/itemmanager.js", "./../../commandprocessor.js", "./../../common/responsehelper.js", "./../../customelementupgrade.js", "./../../common/playback/playbackmanager.js"], function (_exports, _browser, _dom, _layoutmanager, _events, _connectionmanager, _lazyimageloader, _virtualScroller, _shortcuts, _inputmanager, _focusmanager, _itemsrefresher, _itemmanager, _commandprocessor, _responsehelper, _customelementupgrade, _playbackmanager) {
  Object.defineProperty(_exports, "__esModule", {
    value: true
  });
  _exports.default = void 0;
  function _superPropGet(t, o, e, r) { var p = babelHelpers.get(babelHelpers.getPrototypeOf(1 & r ? t.prototype : t), o, e); return 2 & r && "function" == typeof p ? function (t) { return p.apply(e, t); } : p; } /* jshint module: true */
  require(['css!modules/emby-elements/emby-itemscontainer/emby-itemscontainer.css']);
  function removeItemOnce(arr, value) {
    var index = arr.indexOf(value);
    if (index > -1) {
      arr.splice(index, 1);
    }
    return arr;
  }
  var AllItemsContainers = [];
  function getAllItemsContainers() {
    return AllItemsContainers.slice(0);
  }
  function setIndicator(itemId) {
    var indicators = document.querySelectorAll('.itemelement-nowplaying');
    for (var i = 0, length = indicators.length; i < length; i++) {
      var indicator = indicators[i];
      var itemsContainer = indicator.closest('.itemsContainer');
      if (!itemId) {
        var _itemsContainer$curre;
        (_itemsContainer$curre = itemsContainer.currentListOptions) == null || _itemsContainer$curre.renderer.removeNowPlayingIndicator(indicator);
        continue;
      }
      var item = _shortcuts.default.getItemFromChildNode(indicator, false, itemsContainer);
      if (itemId !== (item == null ? void 0 : item.PlaylistItemId) && itemId !== (item == null ? void 0 : item.Id)) {
        var _itemsContainer$curre2;
        (_itemsContainer$curre2 = itemsContainer.currentListOptions) == null || _itemsContainer$curre2.renderer.removeNowPlayingIndicator(indicator);
      }
    }
    if (!itemId) {
      return;
    }
    var itemsContainers = getAllItemsContainers();
    for (var _i = 0, _length = itemsContainers.length; _i < _length; _i++) {
      var _itemsContainer = itemsContainers[_i];
      var index = _itemsContainer.indexOfItemId(itemId);
      if (index === -1) {
        continue;
      }
      var currentListOptions = _itemsContainer.currentListOptions;
      if (currentListOptions) {
        var _currentListOptions$o;
        if (((_currentListOptions$o = currentListOptions.options) == null ? void 0 : _currentListOptions$o.playQueueIndicator) !== false) {
          var itemElement = _itemsContainer.getElement(index);
          if (itemElement) {
            var renderer = currentListOptions.renderer;
            if (renderer != null && renderer.addNowPlayingIndicator) {
              renderer.addNowPlayingIndicator(itemElement);
            }
          }
        }
      }
    }
  }
  var CurrentPlayingItemId;
  function onPlaybackStart(e, player, state) {
    var item = state.NowPlayingItem;
    var mediaType = item == null ? void 0 : item.MediaType;
    var itemId = mediaType === 'Audio' ? item.Id : null;
    CurrentPlayingItemId = itemId;
    setIndicator(itemId);
  }
  _events.default.on(_playbackmanager.default, 'playbackstart', onPlaybackStart);
  _events.default.on(_playbackmanager.default, 'statechange', onPlaybackStart);
  _events.default.on(_playbackmanager.default, 'playbackstop', function () {
    setIndicator(null);
  });
  _events.default.on(_playbackmanager.default, 'unpause', function () {
    setIndicator(CurrentPlayingItemId);
  });
  _events.default.on(_playbackmanager.default, 'pause', function () {
    setIndicator(null);
  });
  function loadMultiSelect() {
    return Emby.importModule('./modules/multiselect/multiselect.js');
  }
  var RequiresDragEventsPolyfill = true;
  var dragEventsPolyfillLoaded;
  var MultiSelect;
  var nativeContextMenuEventSupported;
  var morphdom;
  var headerElement = document.querySelector('.skinHeader');
  var appFooter;
  function onClick(e) {
    var itemsContainer = this;
    var multiSelect = itemsContainer.multiSelect;
    if (multiSelect) {
      if (multiSelect.onContainerClick.call(itemsContainer, e) === false) {
        return;
      }
    }
    _shortcuts.default.onClick.call(itemsContainer, e);
  }
  function onChange(e) {
    var itemsContainer = this;
    _shortcuts.default.onClick.call(itemsContainer, e);
  }
  function onContextMenu(e) {
    var itemsContainer = this;
    if (itemsContainer._touchEventsBound) {
      var detail = e.detail;
      if (!detail || !detail.customEvent) {
        itemsContainer._touchEventsBound = null;
        nativeContextMenuEventSupported = true;

        // Remove these events, they're not needed if we made it into here
        _dom.default.removeEventListener(itemsContainer, 'touchstart', onTouchStart, {
          passive: true
        });
        _dom.default.removeEventListener(itemsContainer, 'touchend', onTouchEnd, {
          //passive: true
        });
        _dom.default.removeEventListener(itemsContainer, 'touchcancel', onTouchEnd, {
          //passive: true
        });
        _dom.default.removeEventListener(itemsContainer, 'touchmove', onTouchMove, {
          passive: true
        });
      }
    }
    var target = e.target;
    var itemElement = this.getContextMenuElementFromChildNode(target);
    if (itemElement) {
      if (target.closest('.dragHandle')) {
        // need to check this for android webview, although it's not an issue in chrome android
        e.preventDefault();
        return;
      }
      if (!itemsContainer.classList.contains('multi-select-active')) {
        tryVibrate();
        var handled = _inputmanager.default.trigger('menu', {
          sourceElement: itemElement,
          originalEvent: e
        });
        if (handled) {
          e.preventDefault();
          //e.stopPropagation();
          return false;
        }
      }
    }
  }
  function getShortcutOptions() {
    return {
      click: false
    };
  }
  function onInit() {
    var elem = this;
    if (elem.hasInit) {
      return;
    }
    elem.hasInit = true;
    this.classList.add('itemsContainer');
    if (!this.refreshMonitor) {
      this.refreshMonitor = new _itemsrefresher.default({
        itemIds: [],
        itemsContainer: this
      });
    }
  }
  function getTouches(e) {
    return e.changedTouches || e.targetTouches || e.touches;
  }
  function clearTouchStartTimeout(elem) {
    if (elem.touchStartTimeout) {
      clearTimeout(elem.touchStartTimeout);
      elem.touchStartTimeout = null;
      elem.touchStartTimeoutTime = null;
    }
  }
  var touchTarget;
  function clearTouchTarget(container) {
    var target = touchTarget;
    if (!target) {
      return;
    }
    touchTarget = null;
    target.classList.remove('itemElement-activetouch');
    _dom.default.removeEventListener(container, 'touchmove', onTouchMove, {
      passive: true
    });
  }
  var ContextMenuDelay = 650;
  function onTouchStart(e) {
    var touch = getTouches(e)[0];
    clearTouchTarget(this);
    this.touchStartX = 0;
    this.touchStartY = 0;
    if (touch) {
      this.touchStartX = touch.clientX;
      this.touchStartY = touch.clientY;
      var element = touch.target;
      if (element) {
        var itemElement = element.closest(this.getItemSelector());
        if (itemElement) {
          clearTouchStartTimeout(this);
          _dom.default.addEventListener(this, 'touchmove', onTouchMove, {
            passive: true
          });
          touchTarget = itemElement;
          itemElement.classList.add('itemElement-activetouch');
          this.touchStartTimeout = setTimeout(onTouchStartTimerFired, ContextMenuDelay);
          this.touchStartTimeoutTime = Date.now();
        }
      }
    }
  }
  function onTouchMove(e) {
    if (touchTarget) {
      var touch = getTouches(e)[0];
      var deltaX;
      var deltaY;
      if (touch) {
        var touchEndX = touch.clientX || 0;
        var touchEndY = touch.clientY || 0;
        deltaX = Math.abs(touchEndX - (this.touchStartX || 0));
        deltaY = Math.abs(touchEndY - (this.touchStartY || 0));
      } else {
        deltaX = 100;
        deltaY = 100;
      }
      if (deltaX >= 5 || deltaY >= 5) {
        clearTouchStartTimeout(this);
        clearTouchTarget(this);
      }
    }
  }
  function onTouchEnd(e) {
    var touch = getTouches(e)[0];
    if (touch) {
      var time = this.touchStartTimeoutTime;
      if (time) {
        time = Date.now() - time;
        if (time >= ContextMenuDelay - 50) {
          e.preventDefault();
        }
      }
    }
    clearTouchStartTimeout(this);
    clearTouchTarget(this);
  }
  function onTouchStartTimerFired() {
    var itemElement = touchTarget;
    if (itemElement) {
      // this is for iOS, so that when the context menu dialog closes, focus will remain in the same place
      _focusmanager.default.focus(itemElement, {
        preventScroll: true
      });
      itemElement.dispatchEvent(new CustomEvent('contextmenu', {
        bubbles: true,
        cancelable: true,
        detail: {
          customEvent: true
        }
      }));
    }
  }
  function bindContextMenuEvents(element) {
    // mobile safari doesn't allow contextmenu override

    if (element._contextMenuEventsBound) {
      return;
    }
    element._contextMenuEventsBound = true;
    element.addEventListener('contextmenu', onContextMenu, true);
    if (!_layoutmanager.default.tv && !nativeContextMenuEventSupported) {
      if (_browser.default.iOS || _browser.default.osx) {
        element._touchEventsBound = true;
        _dom.default.addEventListener(element, 'touchstart', onTouchStart, {
          passive: true
        });
        _dom.default.addEventListener(element, 'touchend', onTouchEnd, {
          //passive: true
        });
        _dom.default.addEventListener(element, 'touchcancel', onTouchEnd, {
          //passive: true
        });
      }
    }
  }
  function addToList(apiClient, list, ids) {
    return _itemmanager.default.addToListHelper(list, ids);
  }
  function onDroppedOntoFullTarget(itemsContainer, draggedElement, dropTarget, items) {
    var droppedTargetItem = _shortcuts.default.getItemFromChildNode(dropTarget, null, itemsContainer);
    var droppedItemType = droppedTargetItem.Type;
    var droppedItemId = droppedTargetItem.Id;
    var droppedItemServerId = droppedTargetItem.ServerId;
    if (!droppedItemId) {
      return;
    }
    if (!droppedItemServerId) {
      return;
    }
    if (droppedItemType === 'Playlist' || droppedItemType === 'BoxSet') {
      var apiClient = _connectionmanager.default.getApiClient(droppedTargetItem);
      addToList(apiClient, droppedTargetItem, items.map(function (i) {
        return i.Id;
      })).catch(_responsehelper.default.handleErrorResponse);
    }
  }
  function onReorderedTo(itemsContainer, items, draggedElement, currentIndex, dropTarget, directionUp) {
    var newIndex;
    if (draggedElement.classList.contains('virtualScrollItem')) {
      newIndex = itemsContainer.indexOfElement(dropTarget);
      if (!directionUp) {
        newIndex++;
      }
      if (newIndex > currentIndex) {
        newIndex--;
      }
    } else {
      itemsContainer.insertBefore(draggedElement, directionUp ? dropTarget : dropTarget.nextSibling);
      newIndex = Array.prototype.indexOf.call(itemsContainer.children, draggedElement);
    }
    if (newIndex === currentIndex) {
      return;
    }
    var detail = {
      newIndex: newIndex,
      items: items
    };
    var eventResult = draggedElement.dispatchEvent(new CustomEvent('itemdrop', {
      detail: detail,
      bubbles: true,
      cancelable: true
    }));
    if (!eventResult) {
      return;
    }
    _commandprocessor.default.executeCommand('moveinorder', items, {
      newIndex: newIndex,
      itemsContainer: itemsContainer
    });
  }
  function onDroppedForReorderingHorizontally(e, itemsContainer, items, draggedElement, draggedElementIndex, dropTarget) {
    var rect = dropTarget.getBoundingClientRect();
    var maxXForLeft = rect.x + rect.width / 2;
    var directionLeft;
    if (e.clientX <= maxXForLeft) {
      directionLeft = true;
    }
    onReorderedTo(itemsContainer, items, draggedElement, draggedElementIndex, dropTarget, directionLeft);
  }
  function onDroppedForReorderingVertically(e, itemsContainer, items, draggedElement, draggedElementIndex, dropTarget) {
    var rect = dropTarget.getBoundingClientRect();
    var maxYForTop = rect.y + rect.height / 2;
    var directionUp;
    if (e.clientY <= maxYForTop) {
      directionUp = true;
    }
    onReorderedTo(itemsContainer, items, draggedElement, draggedElementIndex, dropTarget, directionUp);
  }
  function abortRequests(instance) {
    var _instance$virtualScro;
    var currentAbortController = instance.currentAbortController;
    if (currentAbortController) {
      currentAbortController.abort();
      instance.currentAbortController = null;
    }
    (_instance$virtualScro = instance.virtualScroller) == null || _instance$virtualScro.abortRequests();
  }
  function onGetItemsFailed(result) {
    var errorName = ((result == null ? void 0 : result.name) || '').toLowerCase();
    switch (errorName) {
      case 'aborterror':
        return;
      default:
        break;
    }
    if (this.onGetItemsFailed) {
      this.onGetItemsFailed(result);
    } else {
      throw result;
    }
  }
  function getDelayedResolvedPromise(delay) {
    return new Promise(function (resolve, reject) {
      setTimeout(resolve, delay);
    });
  }
  function getVirtualChunkSize(elem, listOptions) {
    var size = elem.virtualChunkSize;
    if (size) {
      return size;
    }
    if (!listOptions && elem.getListOptions) {
      listOptions = elem.getListOptions([]);
    }
    var layout = listOptions ? listOptions.virtualScrollLayout : elem.getAttribute('data-virtualscrolllayout');
    if (layout) {
      var windowSize = _dom.default.getWindowSize();
      if (layout.includes('horizontal')) {
        return windowSize.innerWidth >= 2200 ? 16 : 12;
      }
      var renderer = listOptions ? listOptions.renderer : null;
      return (renderer == null ? void 0 : renderer.virtualChunkSize) || 30;
    }
    return null;
  }
  function onDataFetchedInitial(result) {
    var onDataFetchedPromise;
    if (this.onDataFetched) {
      onDataFetchedPromise = this.onDataFetched(result);
    }
    if (!onDataFetchedPromise) {
      onDataFetchedPromise = Promise.resolve(result);
    }
    return onDataFetchedPromise.then(this.bound_onDataFetched, this.bound_onGetItemsFailed);
  }
  function onDataFetched(result) {
    var _listItemOptions$fiel;
    var items = result.Items || result;
    if (result.TotalRecordCount != null && this.maxTotalRecordCount) {
      result.TotalRecordCount = Math.min(result.TotalRecordCount, this.maxTotalRecordCount);
    }
    var parentContainer = this.parentContainer;
    if (parentContainer) {
      if (items.length) {
        parentContainer.classList.remove('hide');
        if (this.parentContainerHadFocusable) {
          parentContainer.classList.add('focusable');
        }
      } else {
        parentContainer.classList.add('hide');
        this.parentContainerHadFocusable = parentContainer.classList.contains('focusable');
        parentContainer.classList.remove('focusable');
      }
    }
    var activeElement = document.activeElement;
    var focusId;
    var focusIndex;
    var hasActiveElement;
    var scrollPosition;

    //console.trace('itemsContainer refresh: activeElement: ' + activeElement.className);

    if (this.contains(activeElement)) {
      hasActiveElement = true;
      var focusIndexElement = _shortcuts.default.getItemElementFromChildNode(activeElement, true, this);
      focusIndex = focusIndexElement ? this.indexOfElement(focusIndexElement) : null;
      if (focusIndex != null) {
        var focusedItem = this.getItem(focusIndex);
        if (focusedItem) {
          focusId = focusedItem.Id;
        }
      }
      if (!focusId) {
        focusId = activeElement.getAttribute('data-id');
      }
      if (!_layoutmanager.default.tv) {
        var scroller = this.virtualScroller ? this.closest('.emby-scroller') : null;
        if (scroller) {
          scrollPosition = scroller.getScrollPosition();
        }
      }
    }
    var delay = 0;
    var listOptions = this.getListOptions ? this.getListOptions(items) : null;
    var listItemOptions = listOptions ? listOptions.options : null;
    listOptions.renderer.setListClasses(this, listOptions || {});
    var itemParts = [];
    itemParts.length = result.TotalRecordCount || items.length;
    this.itemParts = itemParts;
    if ((_listItemOptions$fiel = listItemOptions.fields) != null && _listItemOptions$fiel.includes('ItemCheckbox') && !this._onChangeListenerBound) {
      this._onChangeListenerBound = true;
      this.addEventListener('change', onChange);
    }
    if (listOptions.renderer.setUserPreferredSize && this.hasAttribute('data-cardsizeoffset')) {
      listOptions.renderer.setUserPreferredSize(this);
    }

    //console.trace('render items: ' + this.className);

    if (this.hasAttribute('data-virtualscrolllayout')) {
      // reset innerHTML if switching from non-virtual scroll mode to virtual scroll
      if (this._hasOtherInnerHtml || this.items && !this.virtualScroller) {
        this.innerHTML = '';
        this._hasOtherInnerHtml = null;
      }
      this.classList.add('virtualItemsContainer');
      if (listOptions) {
        if (!listOptions.virtualScrollLayout) {
          listOptions.virtualScrollLayout = this.getAttribute('data-virtualscrolllayout');
        }
        // needed by cardbuilder when horizontal virtual scrolling is used
        if (listOptions.virtualScrollLayout.includes('horizontal')) {
          listOptions.options.horizontal = true;
        }
        listOptions.options.isVirtualList = true;
        if (!listOptions.options.lazy) {
          listOptions.options.lazy = 2;
        }
      }
      var virtualScroller = this.virtualScroller;
      var isNewVirtualScroller = virtualScroller == null;
      this.currentListOptions = listOptions;
      var listOptionsSet = false;
      if (listOptions.options.playQueueIndicator !== false) {
        if (!AllItemsContainers.includes(this)) {
          AllItemsContainers.push(this);
          //console.log('num item containers: ' + AllItemsContainers.length);
        }
      }
      if (!virtualScroller || virtualScroller.templateInnerHTML !== listOptions.options.templateInnerHTML) {
        this.setAttribute('data-minoverhang', listOptions.minOverhang || 1);
        this.setAttribute('layout', listOptions.virtualScrollLayout);
        virtualScroller = this;

        // set these before calling setListOptions to help the image width test produce a more accurate result
        virtualScroller.classList.add('virtual-scroller-overflowvisible');
        virtualScroller.addClasses();
        if (listOptions) {
          listOptions.renderer.setListOptions(items, listOptions.options);
          listOptionsSet = true;
        }
        virtualScroller.virtualChunkSize = getVirtualChunkSize(this, listOptions);
        virtualScroller.templateInnerHTML = listItemOptions.templateInnerHTML;
        virtualScroller.templateHTML = '<' + listItemOptions.tagName + ' class="virtualScrollItem ' + listItemOptions.className + '" ' + listItemOptions.fixedAttributes + '>' + listItemOptions.templateInnerHTML + '</' + listItemOptions.tagName + '>';
        virtualScroller.fetchItems = this.fetchData.bind(this);
        this.virtualScroller = virtualScroller;
        virtualScroller.updateElement = this.updateVirtualElement.bind(this);
        virtualScroller.onRecycleElement = this.onRecycleElement;
        if (!isNewVirtualScroller) {
          virtualScroller.resetAll();
        }
      }
      if (listOptions && !listOptionsSet) {
        listOptions.renderer.setListOptions(items, listOptions.options);
      }
      this.items = null;
      if (this.onRefreshing) {
        this.onRefreshing(result);
      }
      virtualScroller.setItemSource(items, result.TotalRecordCount);
      delay = 50;
    } else {
      this._hasOtherInnerHtml = null;
      this.classList.remove('virtualItemsContainer');
      this.currentListOptions = listOptions;
      if (this.onRefreshing) {
        this.onRefreshing(result);
      }
      if (listOptions) {
        if (!listOptions.options.horizontalGrid) {
          listOptions.options.horizontal = null;
        }
        if (typeof listOptions.options.rowCount === 'number') {
          this.classList.add('itemRows' + listOptions.options.rowCount);
        }
        listOptions.options.isVirtualList = null;
        this.innerHTML = listOptions.renderer.getItemsHtml(items, listOptions.options);
      } else {
        this.innerHTML = this.getItemsHtml(items);
      }
      if (this.virtualScroller) {
        this.virtualScroller.disconnectedCallback();
      }
      this.virtualScroller = null;
      this.items = items;
      if (!listItemOptions || listItemOptions.image !== false) {
        _lazyimageloader.default.lazyChildren(this);
      }
    }
    if (listOptions) {
      if (listOptions.options.dropTarget || listOptions.options.anyDraggable !== false) {
        bindDragEvents(this);
      }
    }
    this.enableContextMenu(listItemOptions && listItemOptions.contextMenu);
    this.enableMultiSelect(listItemOptions && listItemOptions.multiSelect);
    return (delay ? getDelayedResolvedPromise(delay) : Promise.resolve()).then(function () {
      if (hasActiveElement) {
        //console.log('scrolling to: ' + scrollPosition);

        if (scrollPosition != null) {
          this.closest('.emby-scroller').scrollToPosition({
            position: scrollPosition,
            behavior: 'instant'
          });
        } else {
          setFocus(this, focusId, focusIndex);
        }
      }
      var dataItemIds = this.getAttribute('data-monitorids');
      this.mergeRefreshOptions({
        refreshIntervalMs: parseInt(this.getAttribute('data-refreshinterval') || '0'),
        immediateUpdate: this.getAttribute('data-immediateupdate') !== 'false',
        enableUserData: listItemOptions && listItemOptions.enableUserData,
        // library setup
        refreshOnItemUpdated: this.refreshOnItemUpdated,
        parentId: this.getAttribute('data-parentid') || null,
        itemIds: dataItemIds ? dataItemIds.split(',') : []
      });
      if (this.afterRefresh) {
        this.afterRefresh(result);
      }
    }.bind(this));
  }

  // this method exists because sometimes the drag event occurs on a text node (in firefox), and the Node prototype does not have the .closest method
  function getClosest(node, selector) {
    if (node.closest) {
      return node.closest(selector);
    }
    var parent = node.parentNode;
    if (parent) {
      return getClosest(parent, selector);
    }
    return null;
  }
  function onItemDragStart(e) {
    var _e$detail, _MultiSelect;
    if (RequiresDragEventsPolyfill && !((_e$detail = e.detail) != null && _e$detail.polyfill)) {
      // if we're using the polyfill, then ignore native events which sometimes occur in the android webview
      e.preventDefault();
      return;
    }

    //e.dataTransfer.setData("text", 'draggable');
    e.dataTransfer.effectAllowed = 'copy';
    //e.dataTransfer.setData('text/plain', 'draggable');

    // use target to handle both the card as well as text links
    var draggableElement = getClosest(e.target, '[draggable="true"]');
    if (!draggableElement) {
      return;
    }
    var itemsContainer = draggableElement.closest('.itemsContainer');
    var item = _shortcuts.default.getItemFromChildNode(draggableElement, null, itemsContainer);
    var multiSelectedItems = ((_MultiSelect = MultiSelect) == null ? void 0 : _MultiSelect.getSelectedItems()) || [];
    window.CurrentDragInfo = {
      element: draggableElement,
      elementIndex: itemsContainer.indexOfElement(draggableElement),
      item: item,
      items: multiSelectedItems.length ? multiSelectedItems : [item]
    };
    var detail = e.detail;
    headerElement.classList.add('headerElement-drag-reorder-active');
    if (detail.dragY && draggableElement.classList.contains('ordered-drop-target-y')) {
      e.dataTransfer.effectAllowed = 'copyMove';
      if (!appFooter) {
        appFooter = document.querySelector('.appfooter');
      }
      if (appFooter) {
        appFooter.classList.add('appfooter-drag-reorder-active');
      }
    } else if (detail.dragX && draggableElement.classList.contains('ordered-drop-target-x')) {
      e.dataTransfer.effectAllowed = 'move';
    }
  }
  function onItemDrag(e) {
    var target = e.target;
    if (target.classList.contains('dragging-over-x-axis')) {
      var data = window.CurrentDragInfo;
      var item = data ? data.item : null;
      showDragXCommands(e, target, item, this);
    }
  }
  function onItemDragEnd(e) {
    var _e$detail2, _appFooter;
    if (RequiresDragEventsPolyfill && !((_e$detail2 = e.detail) != null && _e$detail2.polyfill)) {
      // if we're using the polyfill, then ignore native events which sometimes occur in the android webview
      e.preventDefault();
      return;
    }
    e.preventDefault();
    var target = e.target;
    var data = window.CurrentDragInfo;
    window.CurrentDragInfo = null;
    headerElement.classList.remove('headerElement-drag-reorder-active');
    (_appFooter = appFooter) == null || _appFooter.classList.remove('appfooter-drag-reorder-active');
    if (data && target.dragCommand) {
      var btn = target.querySelector('.listItem-drag-x-axis-content-' + target.dragCommand + ' button');
      var command = btn == null ? void 0 : btn.getAttribute('data-command');
      if (command) {
        _commandprocessor.default.executeCommand(command, data.items, {
          itemsContainer: this
        });
      }
    }
  }
  function onItemDragEndComplete(e) {
    var target = e.target;
    target.classList.remove('dragging-over', 'dragging-over-x-axis');
    var xAxisContent = target.querySelector('.listItem-drag-x-axis-content');
    if (xAxisContent) {
      xAxisContent.remove();
    }
    target.leftDragSection = null;
    target.rightDragSection = null;
    target.vibratedForXDrag = null;
    target.cachedOffsetWidth = null;
    target.dragCommand = null;
  }
  function supportsAddingToCollection(item) {
    var apiClient = _connectionmanager.default.getApiClient(item);
    var user = apiClient.getCurrentUserCached();
    return user && _itemmanager.default.canAddToCollection(item, user);
  }
  function isXAxisCommand(command) {
    return command.horizontalDragSection != null;
  }
  function getCommandColor(command) {
    var id = (command.id || '').toLowerCase();
    if (id.includes('download')) {
      return '#0285FE';
    }
    if (id.includes('remove') || id.includes('delete')) {
      return '#FF4337';
    }
    return '#FEA00C';
    //return '#5D5CE6';
  }
  function ensureDragXCommands(elem, item, itemsContainer) {
    var _connectionManager$ge;
    var xAxisContent = elem.querySelector('.listItem-drag-x-axis-content');
    if (xAxisContent) {
      return;
    }
    var user = (_connectionManager$ge = _connectionmanager.default.getApiClient(item)) == null ? void 0 : _connectionManager$ge.getCurrentUserCached();
    if (!user) {
      //return;
    }

    // incorporating getCommandOptions is primarily to ensure the removeFromPlaylist option is passed along
    var commandOptions = Object.assign({}, itemsContainer.getCommandOptions(item), {
      items: [item],
      user: user
    });
    var commands = _itemmanager.default.getCommands(commandOptions).filter(isXAxisCommand);
    var content = elem.querySelector('.listItem-content');
    var html = '';
    html += '<div class="listItem-drag-x-axis-content">';
    html += '<div class="listItem-drag-x-axis-content-section listItem-drag-x-axis-content-left">';
    for (var i = 0, length = commands.length; i < length; i++) {
      var command = commands[i];
      if (command.horizontalDragSection === 'left') {
        html += '<button style="background:' + getCommandColor(command) + '" type="button" data-command="' + command.id + '" title="' + command.name + '" is="paper-icon-button-light" class="paper-icon-button-light md-icon listItem-drag-x-axis-button">' + command.icon + '</button>';
        break;
      }
    }
    html += '</div>';
    html += '<div class="listItem-drag-x-axis-content-section listItem-drag-x-axis-content-right">';
    for (var _i2 = 0, _length2 = commands.length; _i2 < _length2; _i2++) {
      var _command = commands[_i2];
      if (_command.horizontalDragSection === 'right') {
        html += '<button style="background:' + getCommandColor(_command) + '" type="button" data-command="' + _command.id + '" title="' + _command.name + '" is="paper-icon-button-light" class="paper-icon-button-light md-icon listItem-drag-x-axis-button">' + _command.icon + '</button>';
        break;
      }
    }
    html += '</div>';
    html += '</div>';
    content.insertAdjacentHTML('afterend', html);
  }
  function tryVibrate() {
    try {
      if (navigator.vibrate) {
        navigator.vibrate(200);
      }
    } catch (err) {
      console.error('error in navigator.vibrate: ', err);
    }
  }
  var MinXDragPct = 62.5;
  function showDragXCommands(e, elem, item, itemsContainer) {
    ensureDragXCommands(elem, item, itemsContainer);
    if (!elem.leftDragSection) {
      elem.leftDragSection = elem.querySelector('.listItem-drag-x-axis-content-left');
    }
    if (!elem.rightDragSection) {
      elem.rightDragSection = elem.querySelector('.listItem-drag-x-axis-content-right');
    }
    var pt = e.detail.pt;
    var ptDown = e.detail.ptDown;
    var deltaX = pt.x - ptDown.x;
    var absDeltaX = Math.abs(deltaX);
    var width = elem.cachedOffsetWidth;
    if (!width) {
      width = elem.offsetWidth;
      elem.cachedOffsetWidth = width;
    }
    var pct = 0;
    if (width) {
      pct = absDeltaX / width * 100;
      if (pct >= MinXDragPct) {
        if (!elem.vibratedForXDrag) {
          tryVibrate();
          elem.vibratedForXDrag = true;
        }
      } else {
        elem.vibratedForXDrag = null;
      }
    } else {
      elem.vibratedForXDrag = null;
    }
    if (deltaX > 0) {
      elem.leftDragSection.style.width = absDeltaX + 'px';
      elem.leftDragSection.classList.remove('hide');
      elem.rightDragSection.classList.add('hide');
      elem.dragCommand = pct >= MinXDragPct ? 'left' : null;
    } else if (deltaX < 0) {
      elem.leftDragSection.classList.add('hide');
      elem.rightDragSection.style.width = absDeltaX + 'px';
      elem.rightDragSection.classList.remove('hide');
      elem.dragCommand = pct >= MinXDragPct ? 'right' : null;
    } else {
      elem.leftDragSection.classList.add('hide');
      elem.rightDragSection.classList.add('hide');
      elem.dragCommand = null;
    }
  }
  function onItemDragOver(e) {
    var data = window.CurrentDragInfo;
    var draggingElement = data ? data.element : null;
    var target = e.target;
    var elem = getClosest(target, '.drop-target');
    var detail = e.detail;
    var dragY = detail.dragY;
    var dragX = detail.dragX;
    if (dragY && dragX && elem != null && elem.classList.contains('full-drop-target')) {
      var item = data ? data.item : null;
      if (item) {
        var list = _shortcuts.default.getItemFromChildNode(elem);
        var listType = list.Type;
        if (listType === 'Playlist' && _itemmanager.default.canAddToPlaylist(item) || listType === 'BoxSet' && supportsAddingToCollection(item)) {
          e.preventDefault();
          e.dataTransfer.dropEffect = e.dataTransfer.dropEffectEmby = 'copy';
          elem.classList.add('dragging-over');
        }
      }
    } else if (dragX && elem != null && elem.classList.contains('ordered-drop-target-x') && draggingElement.classList.contains('ordered-drop-target-x')) {
      e.preventDefault();
      e.dataTransfer.dropEffect = e.dataTransfer.dropEffectEmby = 'move';
      var classList = elem.classList;
      var rect = elem.getBoundingClientRect();
      var maxXForLeft = rect.x + rect.width / 2;
      if (e.clientX <= maxXForLeft) {
        classList.remove('dragging-over-right');
        classList.add('dragging-over', 'dragging-over-left');
      } else {
        classList.remove('dragging-over-left');
        classList.add('dragging-over', 'dragging-over-right');
      }
    } else if (dragY && elem != null && elem.classList.contains('ordered-drop-target-y') && draggingElement.classList.contains('ordered-drop-target-y')) {
      e.preventDefault();
      e.dataTransfer.dropEffect = e.dataTransfer.dropEffectEmby = 'move';
      var _classList = elem.classList;
      var _rect = elem.getBoundingClientRect();
      var maxYForTop = _rect.y + _rect.height / 2;
      if (e.clientY <= maxYForTop) {
        _classList.remove('dragging-over-bottom');
        _classList.add('dragging-over', 'dragging-over-top');
      } else {
        _classList.remove('dragging-over-top');
        _classList.add('dragging-over', 'dragging-over-bottom');
      }
    } else if (dragX && !dragY && (draggingElement === target || draggingElement.contains(target))) {
      e.preventDefault();
      e.dataTransfer.dropEffect = e.dataTransfer.dropEffectEmby = 'move';
      draggingElement.classList.add('dragging-over', 'dragging-over-x-axis');
    }
  }
  function onItemDragLeave(e) {
    var data = window.CurrentDragInfo;
    var item = data ? data.item : null;
    var elem = getClosest(e.target, '.drop-target');
    var detail = e.detail;
    var dragY = detail.dragY;
    var dragX = detail.dragX;
    if (dragY && dragX && elem != null && elem.classList.contains('full-drop-target')) {
      var list = _shortcuts.default.getItemFromChildNode(elem);
      var listType = list.Type;
      if (item) {
        if (listType === 'Playlist' && _itemmanager.default.canAddToPlaylist(item) || listType === 'BoxSet' && supportsAddingToCollection(item)) {
          e.preventDefault();
          elem.classList.remove('dragging-over');
        }
      }
    } else if (dragX && elem != null && elem.classList.contains('ordered-drop-target-x')) {
      e.preventDefault();
      elem.classList.remove('dragging-over', 'dragging-over-left', 'dragging-over-right');
    } else if (dragY && elem != null && elem.classList.contains('ordered-drop-target-y')) {
      e.preventDefault();
      elem.classList.remove('dragging-over', 'dragging-over-top', 'dragging-over-bottom');
    } else if (dragX && !dragY) {
      e.preventDefault();
    }
  }
  function onItemDrop(e) {
    e.preventDefault();
    var dragInfo = window.CurrentDragInfo;
    var draggedElement = dragInfo.element;
    var draggedElementIndex = dragInfo.elementIndex;
    var elem = getClosest(e.target, '.drop-target');
    if (!elem) {
      return;
    }
    var items = dragInfo.items;
    elem.classList.remove('dragging-over', 'dragging-over-top', 'dragging-over-bottom', 'dragging-over-left', 'dragging-over-right');
    var detail = e.detail;
    var dragY = detail.dragY;
    var dragX = detail.dragX;
    if (dragY && dragX && elem.classList.contains('full-drop-target')) {
      onDroppedOntoFullTarget(elem.closest('.itemsContainer'), draggedElement, elem, items);
    } else if (dragX && elem.classList.contains('ordered-drop-target-x')) {
      var itemsContainer = elem.closest('.itemsContainer');
      if (!itemsContainer.contains(draggedElement)) {
        // can't reorder if you're dropping into a different container
        return;
      }
      onDroppedForReorderingHorizontally(e, itemsContainer, items, draggedElement, draggedElementIndex, elem);
    } else if (dragY && elem.classList.contains('ordered-drop-target-y')) {
      var _itemsContainer2 = elem.closest('.itemsContainer');
      if (!_itemsContainer2.contains(draggedElement)) {
        // can't reorder if you're dropping into a different container
        return;
      }
      onDroppedForReorderingVertically(e, _itemsContainer2, items, draggedElement, draggedElementIndex, elem);
    }
  }
  function setFocus(itemsContainer, focusId, focusIndex) {
    console.log('setFocus: focusId: ' + focusId + ', focusIndex: ' + focusIndex);
    if (focusId) {
      var newIndex = itemsContainer.indexOfItemId(focusId);
      if (newIndex !== -1) {
        console.log('setFocus: found item at index ' + newIndex);
        itemsContainer.scrollToIndex(newIndex, {}, true);
        return;
      }
    }
    if (focusIndex != null) {
      // not sure why this is needed
      focusIndex = parseInt(focusIndex);
      focusIndex = Math.min(focusIndex, itemsContainer.getItems().length - 1);
      if (focusIndex >= 0) {
        itemsContainer.scrollToIndex(focusIndex, {}, true);
        return;
      }
    }
    var focusOptions = {
      skipIfNotEnabled: true
    };
    console.log('setFocus: auto-focusing into itemsContainer');
    var newFocusedElem = _focusmanager.default.autoFocus(itemsContainer, focusOptions);
    if (newFocusedElem) {
      return;
    }
    var view = itemsContainer.closest('.view');
    // this is messy. need a better way than just walking up the dom and checking for a controller property
    // it would be cleaner to signal that it's lost focus and then the consumer can decide how to handle, but then that's a lot of consumers that would need updating
    if (view) {
      var _view$controller;
      if ((_view$controller = view.controller) != null && _view$controller.autoFocus) {
        view.controller.autoFocus(focusOptions);
      } else {
        _focusmanager.default.autoFocus(view, focusOptions);
      }
    }
  }
  function loadMorphdom() {
    if (morphdom) {
      return;
    }
    Emby.importModule('./modules/morphdom/morphdom.js').then(function (response) {
      morphdom = response;
    });
  }
  function bindDragEvents(elem) {
    if (_layoutmanager.default.tv) {
      return;
    }
    if (elem._dragEventsBound) {
      return;
    }
    elem._dragEventsBound = true;
    elem.addEventListener('dragstart', onItemDragStart);
    elem.addEventListener('drag', onItemDrag);
    elem.addEventListener('dragend', onItemDragEnd);
    elem.addEventListener('dragendcomplete', onItemDragEndComplete);
    elem.addEventListener('dragenter', onItemDragOver);
    elem.addEventListener('dragover', onItemDragOver);
    elem.addEventListener('dragleave', onItemDragLeave);
    elem.addEventListener('drop', onItemDrop);
  }
  var EmbyItemsContainer = /*#__PURE__*/function (_VirtualScroller) {
    function EmbyItemsContainer() {
      var _this;
      // address the upgraded instance and use it
      var self = _this = _VirtualScroller.call(this) || this;
      onInit.call(self);
      _this.paused = true;
      return babelHelpers.possibleConstructorReturn(_this, self);
    }
    babelHelpers.inherits(EmbyItemsContainer, _VirtualScroller);
    return babelHelpers.createClass(EmbyItemsContainer, [{
      key: "connectedCallback",
      value: function connectedCallback() {
        _virtualScroller.default.prototype.connectedCallback.apply(this, arguments);
        onInit.call(this);
        this.bound_onDataFetched = onDataFetched.bind(this);
        this.bound_onDataFetchedInitial = onDataFetchedInitial.bind(this);
        this.bound_onGetItemsFailed = onGetItemsFailed.bind(this);
        this.addEventListener('click', onClick);
        if (this.hasAttribute('data-domdiff')) {
          this._enableDomDiff = true;
          loadMorphdom();
        }
        _shortcuts.default.on(this, getShortcutOptions());
        if (!_layoutmanager.default.tv && RequiresDragEventsPolyfill && !dragEventsPolyfillLoaded) {
          dragEventsPolyfillLoaded = true;
          Emby.importModule('./modules/polyfills/dragdroptouch.js');
        }
        if (this.hasAttribute('data-contextmenu')) {
          this.enableContextMenu(true);
        }
        if (this.hasAttribute('data-multiselect')) {
          this.enableMultiSelect(true);
        }
        this.__upgraded = true;
        this.dispatchEvent(new CustomEvent('upgraded', {
          cancelable: false
        }));
      }
    }, {
      key: "getEventsToMonitor",
      value: function getEventsToMonitor() {
        var monitor = this.getAttribute('data-monitor');
        if (monitor) {
          return monitor.split(',');
        }
        return [];
      }
    }, {
      key: "disconnectedCallback",
      value: function disconnectedCallback() {
        removeItemOnce(AllItemsContainers, this);
        var refreshMonitor = this.refreshMonitor;
        if (refreshMonitor) {
          refreshMonitor.destroy();
          this.refreshMonitor = null;
        }
        _virtualScroller.default.prototype.disconnectedCallback.apply(this, arguments);
        abortRequests(this);
        this.enableMultiSelect(false);
        this.removeEventListener('click', onClick);
        this.removeEventListener('change', onChange);
        this.removeEventListener('contextmenu', onContextMenu, true);
        _shortcuts.default.off(this, getShortcutOptions());
        this.fetchData = null;
        this.getItemsHtml = null;
        this.parentContainer = null;
        this.virtualScroller = null;
        this.currentListOptions = null;
        this.itemParts = null;
        this.items = null;
        this._touchEventsBound = null;
        this._contextMenuEventsBound = true;
        this.bound_onDataFetched = null;
        this.bound_onDataFetchedInitial = null;
        this.bound_onGetItemsFailed = null;
      }
    }, {
      key: "updateVirtualElement",
      value: function updateVirtualElement(child, item, index) {
        var instance = this;
        var listOptions = instance.currentListOptions;
        var listItemOptions = listOptions.options;
        var renderer = listOptions.renderer;
        var allItemParts = this.itemParts;
        var itemParts = allItemParts[index] || (allItemParts[index] = renderer.getItemParts(item, index, listItemOptions));
        var attributes = itemParts.attributes;
        for (var i = 0, length = attributes.length; i < length; i++) {
          var att = attributes[i];
          child.setAttribute(att.name, att.value);
        }

        //let now = Date.now();
        if (this._enableDomDiff) {
          var childNodes = child.childNodes;
          if (childNodes.length === 1 && morphdom) {
            morphdom(childNodes[0], itemParts.html);
          } else {
            child.innerHTML = itemParts.html;
          }
        } else if (child.lastInnerHTML !== itemParts.html) {
          child.lastInnerHTML = itemParts.html;
          child.innerHTML = itemParts.html;
        }
        var multiSelect = MultiSelect;
        if (multiSelect && multiSelect.isSelected(item)) {
          var chkItemSelect = child.querySelector('.chkItemSelect');
          if (chkItemSelect) {
            chkItemSelect.checked = true;
            child.classList.add('item-multiselected');
          }
        }
      }
    }, {
      key: "pause",
      value: function pause() {
        this.paused = true;
        abortRequests(this);
        var refreshMonitor = this.refreshMonitor;
        if (refreshMonitor) {
          refreshMonitor.pause();
        }
        var virtualScroller = this.virtualScroller;
        if (virtualScroller) {
          _superPropGet(EmbyItemsContainer, "pause", this, 3)([]);
        }
      }
    }, {
      key: "resume",
      value: function resume(options) {
        this.paused = false;
        var virtualScroller = this.virtualScroller;
        if (virtualScroller) {
          _superPropGet(EmbyItemsContainer, "resume", this, 3)([options]);
        }
        var refreshMonitor = this.refreshMonitor;
        if (refreshMonitor) {
          return refreshMonitor.resume(options);
        }
        if (!refreshMonitor && options != null && options.refresh) {
          return this.refreshItems(options);
        }
        return Promise.resolve();
      }
    }, {
      key: "setOtherInnerHTML",
      value: function setOtherInnerHTML(html) {
        if (this.virtualScroller) {
          this.virtualScroller.resetAll();
        }
        this._hasOtherInnerHtml = true;
        this.innerHTML = html;
      }
    }, {
      key: "getItemFromElement",
      value: function getItemFromElement(element) {
        var virtualScroller = this.virtualScroller;
        if (virtualScroller) {
          return _superPropGet(EmbyItemsContainer, "getItemFromElement", this, 3)([element]);
        }

        // workaround for metadata editor sidebar since it has unbound items added to inner html
        if (element.parentNode !== this && element.hasAttribute('data-type')) {
          return null;
        }
        var index = this.indexOfElement(element);
        if (index >= 0) {
          var elem = this.getItem(index);
          if (elem) {
            return elem;
          }
        }
        return null;
      }
    }, {
      key: "getItem",
      value: function getItem(index) {
        var scroller = this.virtualScroller;
        if (scroller) {
          return _superPropGet(EmbyItemsContainer, "getItem", this, 3)([index]);
        }
        var items = this.items;
        return items ? items[index] : null;
      }
    }, {
      key: "refreshItems",
      value: function refreshItems(options) {
        var refreshMonitor = this.refreshMonitor;
        if (refreshMonitor) {
          return refreshMonitor.refreshItems(options);
        }
        return this.refreshItemsInternal(options);
      }
    }, {
      key: "refreshItemsInternal",
      value: function refreshItemsInternal(options) {
        if (!this.fetchData) {
          return Promise.resolve();
        }
        if (this.paused) {
          this.notifyRefreshNeeded(false);
          return Promise.resolve();
        }
        if (this.refreshMonitor) {
          this.refreshMonitor.notifyIsRefreshing();
        }
        abortRequests(this);
        var abortController = new AbortController();
        this.currentAbortController = abortController;
        var query = {};
        var limit = getVirtualChunkSize(this);
        if (limit) {
          query.Limit = limit;
        }
        if (this.onGetItems) {
          this.onGetItems(query);
        }
        var fetchSignal = abortController.signal;
        if (options != null && options.signal) {
          fetchSignal = AbortSignal.any([fetchSignal, options.signal]);
        }
        return this.fetchData(query, fetchSignal).then(this.bound_onDataFetchedInitial, this.bound_onGetItemsFailed);
      }
    }, {
      key: "notifyRefreshNeeded",
      value: function notifyRefreshNeeded(isInForeground) {
        if (this.refreshMonitor) {
          return this.refreshMonitor.notifyRefreshNeeded(isInForeground);
        }
      }
    }, {
      key: "showMultiSelect",
      value: function showMultiSelect(childElement, selected) {
        var itemElement = _shortcuts.default.getItemElementFromChildNode(childElement, true, this);
        this.multiSelect.showSelections(itemElement, selected);
      }
    }, {
      key: "enableMultiSelect",
      value: function enableMultiSelect(enabled) {
        var current = this.multiSelect;
        if (!enabled) {
          if (current) {
            this.multiSelect = null;
          }
          return;
        }
        if (current) {
          return;
        }
        var self = this;
        loadMultiSelect().then(function (multiSelect) {
          MultiSelect = multiSelect;
          self.multiSelect = new MultiSelect({
            container: self
          });
        });
      }
    }, {
      key: "enableContextMenu",
      value: function enableContextMenu(enabled) {
        if (enabled) {
          bindContextMenuEvents(this);
        }
      }
    }, {
      key: "getItemSelector",
      value: function getItemSelector() {
        var listOptions = this.currentListOptions;
        if (listOptions) {
          var listItemOptions = listOptions.options;
          return listItemOptions.itemSelector;
        }

        // this should not be needed, but keep it for now just in case
        return '.card,.listItem,.epgRow,.dataGridItem';
      }
    }, {
      key: "getElement",
      value: function getElement(index) {
        var virtualScroller = this.virtualScroller;
        if (virtualScroller) {
          return _superPropGet(EmbyItemsContainer, "getElement", this, 3)([index]);
        }
        var items = this.querySelectorAll(this.getItemSelector());
        if (!items.length) {
          return;
        }
        return items[index];
      }
    }, {
      key: "scrollToIndex",
      value: function scrollToIndex(index, scrollOptions, focus) {
        var virtualScroller = this.virtualScroller;
        if (virtualScroller) {
          return _superPropGet(EmbyItemsContainer, "scrollToIndex", this, 3)([index, scrollOptions, focus]);
        }
        var items = this.querySelectorAll(this.getItemSelector());
        if (!items.length) {
          return;
        }
        index = Math.min(index, items.length - 1);
        var item = items[index] || items[items.length - 1];
        if (!item) {
          return;
        }
        if (!focus) {
          var scroller = this.closest('[is=emby-scroller]');
          if (scroller) {
            scroller.toStart(item, scrollOptions);
          }
          return;
        }
        _focusmanager.default.focus(item);
      }
    }, {
      key: "pageUp",
      value: function pageUp(activeElement, offset) {
        var items = this.getItems();
        if (items) {
          offset = offset || 12;
          activeElement = _shortcuts.default.getItemElementFromChildNode(activeElement, true, this) || activeElement;
          var currentIndex = this.indexOfElement(activeElement);
          var newIndex = currentIndex === -1 ? 0 : Math.max(0, currentIndex - offset);
          //console.log('pageUp: offset: ' + offset + ', currentIndex: ' + currentIndex + ', newIndex: ' + newIndex);
          this.scrollToIndex(newIndex, {}, true);
        }
      }
    }, {
      key: "pageDown",
      value: function pageDown(activeElement, offset) {
        var items = this.getItems();
        if (items) {
          offset = offset || 12;
          activeElement = _shortcuts.default.getItemElementFromChildNode(activeElement, true, this) || activeElement;
          var currentIndex = this.indexOfElement(activeElement);
          var newIndex = currentIndex === -1 ? 0 : Math.min(items.length - 1, currentIndex + offset);
          //console.log('pageDown: offset: ' + offset + ', currentIndex: ' + currentIndex + ', newIndex: ' + newIndex);
          this.scrollToIndex(newIndex, {}, true);
        }
      }
    }, {
      key: "indexOfElement",
      value: function indexOfElement(element) {
        var virtualScroller = this.virtualScroller;
        if (virtualScroller) {
          return _superPropGet(EmbyItemsContainer, "indexOfElement", this, 3)([element]);
        }
        return parseInt(element.getAttribute('data-index') || '-1');
      }
    }, {
      key: "indexOfItemId",
      value: function indexOfItemId(id) {
        var virtualScroller = this.virtualScroller;
        if (virtualScroller) {
          return _superPropGet(EmbyItemsContainer, "indexOfItemId", this, 3)([id]);
        }
        var elem = this.querySelector('[data-id="' + id + '"]');
        if (elem) {
          return this.indexOfElement(elem);
        }
        return -1;
      }
    }, {
      key: "indexOfItem",
      value: function indexOfItem(item) {
        var virtualScroller = this.virtualScroller;
        if (virtualScroller || item.Id) {
          return this.indexOfItemId(item.Id);
        }
        var items = this.getItems();
        if (items) {
          return items.indexOf(item);
        }
        return -1;
      }
    }, {
      key: "focusLast",
      value: function focusLast() {
        var items = this.getItems();
        if (items) {
          this.scrollToIndex(items.length - 1, {}, true);
        }
      }
    }, {
      key: "getItems",
      value: function getItems() {
        var virtualScroller = this.virtualScroller;
        return virtualScroller ? virtualScroller._itemSource : this.items;
      }
    }, {
      key: "onItemUpdated",
      value: function onItemUpdated(index, item) {
        var itemParts = this.itemParts;
        if (!itemParts) {
          return;
        }
        itemParts[index] = null;
        var virtualScroller = this.virtualScroller;
        if (virtualScroller) {
          return _superPropGet(EmbyItemsContainer, "onItemUpdated", this, 3)([index, item]);
        }
        var items = this.items;
        if (!items) {
          return;
        }
        var any = false;
        var child = this.getElement(index);
        if (child) {
          items[index] = item;
          this.updateVirtualElement(child, item, index);
          any = true;
        }
        if (any) {
          _lazyimageloader.default.lazyChildren(this);
        }
      }
    }, {
      key: "getContextMenuElementFromChildNode",
      value: function getContextMenuElementFromChildNode(child) {
        return _shortcuts.default.getItemElementFromChildNode(child, true, this);
      }
    }, {
      key: "mergeRefreshOptions",
      value: function mergeRefreshOptions(options) {
        var _this$refreshMonitor;
        (_this$refreshMonitor = this.refreshMonitor) == null || _this$refreshMonitor.mergeOptions(options);
      }
    }, {
      key: "getCommandOptions",
      value: function getCommandOptions(item) {
        var _currentListOptions$o2;
        var currentListOptions = this.currentListOptions;
        var commandOptions = Object.assign({}, (currentListOptions == null ? void 0 : currentListOptions.commandOptions) || {});
        if (_layoutmanager.default.tv) {
          var listOptions = currentListOptions == null ? void 0 : currentListOptions.options;
          if (item && listOptions != null && listOptions.fields.includes('ItemCheckbox')) {
            var checked;
            if (listOptions.getIsItemChecked) {
              checked = listOptions.getIsItemChecked(item);
            } else {
              checked = item.Selected || item.Disabled === false;
            }
            commandOptions = Object.assign({
              setChecked: checked === false,
              setUnchecked: checked === true
            }, commandOptions);
          }
        }
        commandOptions.reOrder = currentListOptions == null || (_currentListOptions$o2 = currentListOptions.options) == null ? void 0 : _currentListOptions$o2.reOrder;
        return commandOptions;
      }
    }, {
      key: "onCommandResult",
      value: function onCommandResult(result) {
        if (this.onCommandResultInternal) {
          this.onCommandResultInternal(result);
        }
      }
    }]);
  }(_virtualScroller.default);
  customElements.define('emby-itemscontainer', EmbyItemsContainer, {
    extends: 'div'
  });
  var _default = _exports.default = EmbyItemsContainer;
});
