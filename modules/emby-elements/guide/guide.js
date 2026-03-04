define(["exports", "./../../browser.js", "./../../shortcuts.js", "./../../emby-apiclient/connectionmanager.js", "./../../common/input/api.js", "./../../emby-apiclient/events.js", "./../../common/globalize.js", "./../../dom.js", "./../../layoutmanager.js", "./../../common/datetime.js", "./../../focusmanager.js", "./../../loading/loading.js", "./../../input/mouse.js", "./../../common/usersettings/usersettings.js", "./gridrowrenderer.js", "./../emby-button/emby-button.js", "./../emby-scroller/emby-scroller.js", "./../emby-button/paper-icon-button-light.js", "./../../common/methodtimer.js", "./../emby-itemscontainer/emby-itemscontainer.js", "./../../common/inputmanager.js", "./../../common/playback/playbackmanager.js"], function (_exports, _browser, _shortcuts, _connectionmanager, _api, _events, _globalize, _dom, _layoutmanager, _datetime, _focusmanager, _loading, _mouse, _usersettings, _gridrowrenderer, _embyButton, _embyScroller, _paperIconButtonLight, _methodtimer, _embyItemscontainer, _inputmanager, _playbackmanager) {
  Object.defineProperty(_exports, "__esModule", {
    value: true
  });
  _exports.default = void 0;
  /* jshint module: true */

  require(['css!modules/emby-elements/guide/guide.css', 'css!!tv|modules/emby-elements/guide/guide_nontv.css', 'css!tv|modules/emby-elements/guide/guide_tv.css', 'css!modules/emby-elements/guide/guide_post.css', 'css!firefox|modules/emby-elements/guide/guide_firefox.css', 'programStyles', 'material-icons', 'flexStyles']);
  var virtualChunkSize = 25;
  var cellCurationMinutes = 30;
  var cellDurationMs = cellCurationMinutes * 60 * 1000;
  var msPerMinute = 60000;
  var msPerHour = 3600000;
  var msPerDay = 86400000;
  var msPerPage = msPerHour * 8;
  var startId = Date.now();
  function showActionSheet(options) {
    return Emby.importModule('./modules/actionsheet/actionsheet.js').then(function (ActionSheet) {
      return ActionSheet.show(options);
    });
  }
  function normalizeDateToTimeslot(value, roundUp) {
    var delta = value % cellDurationMs;
    if (roundUp && delta) {
      value += cellDurationMs;
    }
    value -= delta;
    return value;
  }
  function onSettingsButtonClick(e) {
    var instance = this;
    Emby.importModule('./modules/emby-elements/guide/guide-settings.js').then(function (guideSettingsDialog) {
      guideSettingsDialog.show({
        categoryOptions: instance.categoryOptions,
        positionTo: e.target,
        positionY: 'bottom',
        positionX: 'after'
      }, _connectionmanager.default.getApiClient(instance.options.serverId)).then(function () {
        instance.refresh();
      });
    });
  }
  function getDateMenuOptions(instance) {
    var items = [];
    var start = new Date(instance._startDateMs);
    var end = new Date(instance._endDateMs);
    var today = new Date();
    var nowHours = today.getHours();
    var nowMinutes = today.getMinutes() >= 30 ? 30 : 0;
    start.setHours(nowHours, nowMinutes, 0, 0);
    end.setHours(0, 0, 0, 0);
    if (start.getTime() >= end.getTime()) {
      end.setDate(start.getDate() + 1);
    }
    start = new Date(Math.max(today, start));
    var scroller = instance.scroller;
    var scrollWidth = instance.scroller.getScrollWidth();
    var channelCellWidth = getChannelCellWidth(instance);
    scrollWidth -= channelCellWidth;
    var startDate = instance._startDateMs;
    var endDate = instance._endDateMs;
    // use math.abs to account for rtl
    var currentPositionMs = Math.abs(scroller.getScrollLeft()) / scrollWidth * (endDate - startDate);
    currentPositionMs += startDate;
    var date = new Date(currentPositionMs);

    // eslint-disable-next-line
    while (start <= end) {
      items.push({
        name: _datetime.default.toLocaleDateString(start, {
          weekday: 'long',
          month: 'short',
          day: 'numeric'
        }),
        value: start.getTime().toString(),
        selected: date.getDate() === start.getDate() && date.getMonth() === start.getMonth() && date.getFullYear() === start.getFullYear()
      });
      start.setDate(start.getDate() + 1);
      start.setHours(0, 0, 0, 0);
    }
    return items;
  }
  function onDateButtonClick(e) {
    var instance = this;
    var options = getDateMenuOptions(instance);
    showActionSheet({
      items: options,
      positionTo: e.target,
      title: _globalize.default.translate('Date'),
      positionY: 'bottom',
      hasItemSelectionState: true
    }).then(onSelectedDateValue.bind(instance));
  }
  function scrollToTimeMs(instance, value, exactTime, autoFocus) {
    value = parseInt(value);
    var date = new Date();
    date.setTime(value);
    var scroller = instance.scroller;
    var scrollWidth = instance.scroller.getScrollWidth();
    if (!scrollWidth) {
      return;
    }
    var channelCellWidth = getChannelCellWidth(instance);
    scrollWidth -= channelCellWidth;
    var startDate = instance._startDateMs;
    var endDate = instance._endDateMs;
    if (!exactTime) {
      // use math.abs to account for rtl
      var currentPositionMs = Math.abs(scroller.getScrollLeft()) / scrollWidth * (endDate - startDate);
      currentPositionMs += startDate;
      var currentPositionDate = new Date(currentPositionMs);

      // add 1 because the date object is 0 based, but our % calculations are not
      date.setHours(currentPositionDate.getHours(), currentPositionDate.getMinutes() + 1, 0, 0);
    }
    date.setTime(normalizeDateToTimeslot(date.getTime()));
    var pct = Math.max(date.getTime() - startDate, 0) / (endDate - startDate);
    var scrollPos = pct * scrollWidth;
    scroller.scrollToPosition({
      left: scrollPos * scroller.getScrollLeftMultiplier(),
      behavior: 'instant'
    });
    onScroll.call(instance, {
      currentTarget: instance.scroller,
      target: instance.scroller,
      autoFocus: autoFocus
    });
  }
  function onSelectedDateValue(value) {
    scrollToTimeMs(this, value, false, true);
  }
  function onTimerCreated(e, apiClient, data) {
    var programId = data.ProgramId;
    // This could be null, not supported by all tv providers
    var newTimerId = data.Id;
    var options = this.options;

    // find guide cells by program id, ensure timer icon
    var cells = options.element.querySelectorAll('.programCell[data-id="' + programId + '"]');
    for (var i = 0, length = cells.length; i < length; i++) {
      var cell = cells[i];
      var icon = cell.querySelector('.timerIcon');
      if (!icon) {
        var programCellInner = cell.querySelector('.programCellInner');
        if (data.SeriesTimerId) {
          programCellInner.insertAdjacentHTML('beforeend', '<i class="timerIcon md-icon md-icon-fill programIcon">&#xe062;</i>');
        } else {
          programCellInner.insertAdjacentHTML('beforeend', '<i class="timerIcon md-icon md-icon-fill programIcon">&#xe061;</i>');
        }
      }
      if (newTimerId) {
        cell.setAttribute('data-timerid', newTimerId);
      }
    }
  }
  function onSeriesTimerCreated(e, apiClient, data) {}
  function onTimerCancelled(e, apiClient, data) {
    var options = this.options;
    var id = data.Id;
    // find guide cells by timer id, remove timer icon
    var cells = options.element.querySelectorAll('.programCell[data-timerid="' + id + '"]');
    for (var i = 0, length = cells.length; i < length; i++) {
      var cell = cells[i];
      var icon = cell.querySelector('.timerIcon');
      if (icon) {
        icon.parentNode.removeChild(icon);
      }
      cell.removeAttribute('data-timerid');
    }
  }
  function onSeriesTimerCancelled(e, apiClient, data) {
    var options = this.options;
    var id = data.Id;
    // find guide cells by timer id, remove timer icon
    var cells = options.element.querySelectorAll('.programCell[data-seriestimerid="' + id + '"]');
    for (var i = 0, length = cells.length; i < length; i++) {
      var cell = cells[i];
      var icon = cell.querySelector('.seriesTimerIcon');
      if (icon) {
        icon.parentNode.removeChild(icon);
      }
      cell.removeAttribute('data-seriestimerid');
    }
  }
  var InsetInlineStartProp = CSS.supports('inset-inline-start', '0') ? 'insetInlineStart' : 'left';
  var BorderInlineStartWidthProp = CSS.supports('border-inline-start-width', '0') ? 'borderInlineStartWidth' : 'borderLeftWidth';
  function setPaddingInlineStart(elem, value) {
    if ((elem._paddingInlineStart || '0') !== value) {
      elem._paddingInlineStart = value;
      elem.style[InsetInlineStartProp] = value;
    }
  }
  function updateProgramCellOnScroll(cell, scrollPct, borderPct, hidden) {
    var pctOffsetStart;
    var showLeftCaret;
    if (!hidden) {
      var left = cell.posLeft;
      if (!left) {
        left = parseFloat(cell.style[InsetInlineStartProp].replace('%', ''));
        cell.posLeft = left;
      }
      var width = cell.posWidth;
      if (!width) {
        width = parseFloat(cell.style.width.replace('%', ''));
        cell.posWidth = width;
      }
      if (left < scrollPct) {
        var offsetStart = scrollPct - left;
        pctOffsetStart = offsetStart / (width - borderPct) * 100;
      }

      // add some tolerance just in case the scroll offsets are not perfect
      showLeftCaret = pctOffsetStart && pctOffsetStart < 100 && pctOffsetStart > 0.1;
    }

    //console.log(pctOffsetStart);
    var programCellInner = cell.programCellInner;
    if (!programCellInner && pctOffsetStart) {
      programCellInner = cell.firstChild;
      cell.programCellInner = programCellInner;
    }
    var caret = cell.caret;
    if (!caret && pctOffsetStart) {
      caret = programCellInner.firstChild;
      cell.caret = caret;
    }
    if (programCellInner) {
      if (showLeftCaret) {
        setPaddingInlineStart(programCellInner, pctOffsetStart + '%');
        if (caret) {
          if (caret._hidden !== false) {
            caret._hidden = false;
            caret.classList.remove('hide');
          }
        }
        return true;
      } else {
        if (pctOffsetStart) {
          setPaddingInlineStart(programCellInner, pctOffsetStart + '%');
        } else {
          setPaddingInlineStart(programCellInner, '0');
        }
        if (caret) {
          if (caret._hidden === false) {
            caret._hidden = true;
            caret.classList.add('hide');
          }
        }
      }
    }
    return false;
  }
  function getChannelCellWidth(instance) {
    var channelCellWidth = instance.channelCellWidth;
    if (!channelCellWidth) {
      channelCellWidth = instance.firstChannelCell.offsetWidth;
      instance.channelCellWidth = channelCellWidth;
      var scroller = instance.scroller;
      if (scroller.setFocusScrollOffsetLeft) {
        var focusScrollOffsetLeft = (0 - channelCellWidth) * scroller.getScrollLeftMultiplier();
        scroller.setFocusScrollOffsetLeft(focusScrollOffsetLeft);
        var headerScroller = instance.headerScroller;
        var elem = headerScroller.querySelector('.timeslotHeader');
        if (elem) {
          scroller.scroller.options.scrollSnapSizeX = elem.getBoundingClientRect().width;
        }
      }
    }
    return channelCellWidth;
  }
  function getTimeBlockStart(instance, scrollLeft, scrollWidth) {
    var startDate = instance._startDateMs;
    var endDate = instance._endDateMs;
    var currentPositionMs = scrollWidth ? scrollLeft / scrollWidth * (endDate - startDate) : 0;
    currentPositionMs = Math.floor(currentPositionMs);
    currentPositionMs -= currentPositionMs % msPerPage;
    currentPositionMs += startDate;
    return currentPositionMs;
  }
  function getProgramFieldsProperty() {
    var programFields = [];
    if (_usersettings.default.get(_usersettings.default.get('guide-indicator-4k') !== 'false' || 'guide-indicator-hd') === 'true') {
      programFields.push('IsHD');
      programFields.push('Width');
    }
    return programFields.length ? programFields.join(',') : null;
  }
  function loadPrograms(instance, epgRowMap, channelIds, timeBlockStart, signal) {
    var apiClient = _connectionmanager.default.getApiClient(instance.options.serverId);
    var cacheKeys = [apiClient.getCurrentUserId(), timeBlockStart.toString(), channelIds.join(',')];
    var cacheKey = cacheKeys.join('|');
    var promise;
    if (!instance.programCache) {
      instance.programCache = {};
    }
    var cachedResult = instance.programCache[cacheKey];
    if (cachedResult) {
      promise = Promise.resolve(cachedResult);
      //console.log('found cached program result');
    }
    if (!promise) {
      // guard against pulling back programs that are just ending
      var offset = timeBlockStart === getTimeBlockStart(instance, 0, 0) ? 1000 : 0;
      var programQuery = {
        UserId: apiClient.getCurrentUserId(),
        MaxStartDate: new Date(timeBlockStart + msPerPage).toISOString(),
        MinEndDate: new Date(timeBlockStart + offset).toISOString(),
        channelIds: channelIds.join(','),
        ImageTypeLimit: 1,
        SortBy: "StartDate",
        EnableTotalRecordCount: false,
        EnableUserData: false,
        Fields: getProgramFieldsProperty(),
        EnableImages: false
      };

      //console.log('loadProgramsForTimeBlock ' + new Date(timeBlockStart) + ', ' + channelIds);

      promise = apiClient.getLiveTvPrograms(programQuery, signal);
    }
    return promise.then(function (result) {
      if (!instance.programCache) {
        instance.programCache = {};
      }
      instance.programCache[cacheKey] = result;
      return insertLazyLoadedPrograms(instance, epgRowMap, result.Items);
    });
  }
  function getInsertIndex(programs, programStartTime) {
    var numPrograms = programs.length;
    var insertAtIndex = numPrograms;
    for (var i = 0, length = numPrograms; i < length; i++) {
      if (programStartTime <= programs[i].StartDateLocalMs) {
        insertAtIndex = i;
        break;
      }
    }
    return insertAtIndex;
  }
  var ChannelProgramsChildIndex = 1;
  function addProgramToList(instance, epgItem, program) {
    _gridrowrenderer.default.parseDates(program);
    var item = epgItem;
    var programs = item.Programs;
    var programMap = item.ProgramMap;
    var programId = program.Id;
    var insertAtIndex;
    if (!programMap[programId]) {
      programMap[programId] = program;
      insertAtIndex = getInsertIndex(programs, program.StartDateLocalMs);
      programs.splice(insertAtIndex, 0, program);
    }

    // insert program into UI

    var channelRow = epgItem.RowElement;
    if (channelRow) {
      var channelProgramsElement = channelRow.children[ChannelProgramsChildIndex];
      if (channelProgramsElement) {
        programMap = channelRow.ProgramMap;
        if (programMap) {
          if (!programMap[programId]) {
            programMap[programId] = program;
            programs = channelRow.Programs;
            insertAtIndex = getInsertIndex(programs, program.StartDateLocalMs);
            programs.splice(insertAtIndex, 0, program);
            var options = instance.itemsContainer.currentListOptions.options;
            var totalGridMs = options.endMs - options.startMs;
            var html = _gridrowrenderer.default.getProgramHtml(program, options, totalGridMs);
            var insertBeforeChild = channelProgramsElement.children[insertAtIndex];
            if (insertBeforeChild) {
              insertBeforeChild.insertAdjacentHTML('beforebegin', html);
            } else {
              channelProgramsElement.insertAdjacentHTML('beforeend', html);
            }
          }
        } else {
          //console.log('no programMap: ' + epgItem.Channel.Name);
        }
      } else {
        //console.log('no channelProgramsElement');
      }
    } else {
      //console.log('no channel row');
    }
  }
  function insertLazyLoadedPrograms(instance, epgRowMap, programs) {
    for (var i = 0, length = programs.length; i < length; i++) {
      var program = programs[i];
      var epgItem = epgRowMap[program.ChannelId];
      if (!epgItem) {
        continue;
      }
      addProgramToList(instance, epgItem, program);
    }
    updateCellTexts(instance);
  }
  function loadProgramsIfNeeded() {
    var _instance$getPrograms;
    this._dataLoadSection = null;
    var instance = this;
    var itemsContainer = this.itemsContainer;
    var activeItems = itemsContainer.virtualScroller.getActiveItems();
    var channelIdsNeedingData = [];
    var epgRowMap = {};
    for (var i = activeItems.firstIndex, last = activeItems.lastIndex; i <= last; i++) {
      var itemIndex = i;
      var item = itemsContainer.getItem(itemIndex);
      if (!item) {
        continue;
      }

      //console.log('channel needs data: ' + item.Channel.Name + ', time block: ' + timeBlockStartString);
      var channelId = item.Channel.Id;
      epgRowMap[channelId] = item;
      channelIdsNeedingData.push(channelId);
    }
    if (!channelIdsNeedingData.length) {
      return;
    }
    var loadDataInfo = instance._loadDataInfo;
    var scrollLeft = loadDataInfo.scrollLeft;

    //console.log('loadProgramsIfNeeded: ' + scrollLeft);

    var channelCellWidth = getChannelCellWidth(instance);
    var scrollWidth = instance.scroller.getScrollWidth();
    scrollWidth -= channelCellWidth;

    //let offsetWidth = getScrollerOffsetWidth(instance);
    var offsetWidth = instance.scroller.getScrollContainerBoundingClientRect().width; //getScrollerOffsetWidth(instance);

    var timeBlockStart;
    var originalScrollLeft = scrollLeft;
    var timeblocks = [];
    var promises = [];
    var signal = (_instance$getPrograms = instance.getProgramsAbortController) == null ? void 0 : _instance$getPrograms.signal;
    scrollLeft = originalScrollLeft;
    scrollLeft = Math.min(scrollLeft, scrollWidth);
    scrollLeft = Math.max(scrollLeft, 0);
    timeBlockStart = getTimeBlockStart(instance, scrollLeft, scrollWidth);
    if (timeblocks.indexOf(timeBlockStart) === -1) {
      promises.push(loadPrograms(instance, epgRowMap, channelIdsNeedingData, timeBlockStart, signal));
      timeblocks.push(timeBlockStart);
    }
    scrollLeft = originalScrollLeft;
    scrollLeft -= offsetWidth;
    scrollLeft = Math.min(scrollLeft, scrollWidth);
    scrollLeft = Math.max(scrollLeft, 0);
    timeBlockStart = getTimeBlockStart(instance, scrollLeft, scrollWidth);
    if (timeblocks.indexOf(timeBlockStart) === -1) {
      promises.push(loadPrograms(instance, epgRowMap, channelIdsNeedingData, timeBlockStart, signal));
      timeblocks.push(timeBlockStart);
    }
    scrollLeft = originalScrollLeft;
    scrollLeft += offsetWidth;
    scrollLeft = Math.min(scrollLeft, scrollWidth);
    scrollLeft = Math.max(scrollLeft, 0);
    timeBlockStart = getTimeBlockStart(instance, scrollLeft, scrollWidth);
    if (timeblocks.indexOf(timeBlockStart) === -1) {
      promises.push(loadPrograms(instance, epgRowMap, channelIdsNeedingData, timeBlockStart, signal));
      timeblocks.push(timeBlockStart);
    }
    if (loadDataInfo.autoFocus) {
      Promise.all(promises).then(function () {
        var activeElement = document.activeElement;
        var row = activeElement.closest('.epgRow');
        if (row) {
          _focusmanager.default.focus(row, {
            ignoreFocusedProgram: loadDataInfo.ignoreFocusedProgram
          });
          return;
        }

        //focusManager.autoFocus(instance.itemsContainer);
      });
    }
  }
  function onScroll(e) {
    var currentTarget = e.currentTarget || e.target;
    var scrollLeft = currentTarget.getScrollLeft();
    var lastScrollLeft = this.lastScrollLeft;

    // firefox hack to prevent logos from getting hidden on scroll
    var scrollXChanged = lastScrollLeft !== scrollLeft || _browser.default.firefox;
    if (scrollXChanged) {
      this.headerScroller.scrollToPosition({
        left: scrollLeft,
        behavior: 'instant'
      });
    }

    // just in case the scroll event fires before the initial load has completed
    if (!this._startDateMs || !this._endDateMs) {
      return;
    }

    //console.log('guide onScroll scrollLeft: ' + scrollLeft + ', lastScrollLeft:' + lastScrollLeft);

    if (scrollXChanged || e.forceHorizontalChange || e.autoFocus) {
      if (scrollLeft) {
        this.firstChannelCell.classList.add('firstChannelCell-withscroll');
      } else {
        this.firstChannelCell.classList.remove('firstChannelCell-withscroll');
      }
      var channelCellWidth = getChannelCellWidth(this);
      var scrollWidth = this.scroller.getScrollWidth();
      if (!scrollWidth) {
        return;
      }
      scrollWidth -= channelCellWidth;

      // use math.abs to account for rtl
      var absScrollLeft = scrollLeft ? Math.abs(scrollLeft) : 0;
      var scrollPct = scrollLeft ? absScrollLeft / scrollWidth * 100 : 0;
      //console.log('guide scrollPct: ' + scrollPct + ', channelCellWidth: ' + channelCellWidth + ', scrollWidth: ' + scrollWidth + ', actual scroll width: ' + document.querySelector('.epgVirtualScrollerScrollContainer-both').scrollWidth);
      this.lastHorizontalScrollPct = scrollPct;
      this.startDataLoadTimer(absScrollLeft, scrollWidth, e.autoFocus, e.autoFocus);
      this.lastScrollLeft = scrollLeft;
      updateCellTexts(this, scrollPct, e.updateProgramTextRow, channelCellWidth, scrollWidth);
      if (scrollXChanged) {
        this.updateDateButtonText(null, absScrollLeft, scrollWidth);
      }
    }
  }
  function onHeaderScroll(e) {

    //    let scrollLeft = this.headerScroller.getScrollLeft();

    //    this.scroller.scrollToPosition({
    //        left: scrollLeft,
    //        behavior: 'instant'
    //    });
  }
  function updateCellTexts(instance, scrollPct, rowToUpdate, channelCellWidth, scrollWidth) {
    if (channelCellWidth == null) {
      channelCellWidth = getChannelCellWidth(instance);
    }
    if (scrollWidth == null) {
      scrollWidth = instance.scroller.getScrollWidth();
      scrollWidth -= channelCellWidth;
    }
    if (scrollPct == null) {
      // use math.abs to account for rtl
      var scrollLeft = Math.abs(instance.scroller.getScrollLeft());
      scrollPct = scrollLeft ? scrollLeft / scrollWidth * 100 : 0;
    }
    var pixelPct = scrollWidth ? 1 / scrollWidth * 100 : 0;
    if (rowToUpdate) {
      updateProgramCellTextsForRow(instance, rowToUpdate, scrollPct, pixelPct);
      return;
    }
    var activeItems = instance.itemsContainer.virtualScroller.getActiveItems();
    var activeItemElements = activeItems.elements;
    for (var i = 0, length = activeItemElements.length; i < length; i++) {
      updateProgramCellTextsForRow(instance, activeItemElements[i], scrollPct, pixelPct);
    }
  }
  function onChannelCellResize(entries) {
    var entry = entries[0];
    if (entry) {
      // We want offsetWidth, not the width reported here
      this.channelCellWidth = null;
      this.programBorderInlineStartWidth = null;
    }
  }
  function updateProgramCellTextsForRow(instance, row, scrollPct, pixelPct) {
    var channelPrograms = row.children[ChannelProgramsChildIndex];
    if (!channelPrograms) {
      return;
    }
    var programCells = channelPrograms.children;
    var borderPct = 0;
    var caretFound;
    for (var i = 0, length = programCells.length; i < length; i++) {
      if (i === 0) {
        var borderWidth = instance.programBorderInlineStartWidth;
        if (borderWidth == null) {
          var style = getComputedStyle(programCells[i]);
          borderWidth = parseFloat(style[BorderInlineStartWidthProp].replace('px', ''));
          instance.programBorderInlineStartWidth = borderWidth;
        }
        borderPct = borderWidth * pixelPct;
      }
      if (updateProgramCellOnScroll(programCells[i], scrollPct, borderPct, caretFound)) {
        caretFound = true;
      }
    }
  }
  function getFocusableElementsInRow(newRowToFocus, activeElement, direction, focusOptions) {
    var isRTL = document.dir === 'rtl';
    var scrollToChannelId = this.scrollToChannelId;
    if (scrollToChannelId) {
      var index = this.itemsContainer.indexOfItemId(scrollToChannelId);
      if (index !== -1) {
        var row = this.itemsContainer.getElement(index);
        if (row) {
          newRowToFocus = row;
        }
      }
      this.scrollToChannelId = null;
    }
    var focusedChannelCell = activeElement.closest('.channelCell');
    var isGoingBackHorizontally = isRTL ? direction === 1 : direction === 0;
    if (focusedChannelCell) {
      // if newRowToFocus is defined, we're moving up or down between rows
      if (newRowToFocus) {
        var _elems = newRowToFocus.querySelectorAll('.channelCell');
        if (_elems.length) {
          return _elems;
        }
        return null;
      }
      if (isGoingBackHorizontally) {
        return null;
      }
    }
    if (!newRowToFocus) {
      newRowToFocus = activeElement.closest('.epgRow');
    }
    var elems;
    var focusedProgramCell = activeElement.closest('.programCell');

    // if we're going left from the channel cell, or horizontally from a program cell
    if (isGoingBackHorizontally || focusedProgramCell && direction != null && direction < 2) {
      var _elems2 = newRowToFocus.querySelectorAll('.programCell,.channelCell');
      var selectedIndex = Array.prototype.indexOf.call(_elems2, activeElement);
      if (selectedIndex !== -1) {
        var offset = direction === 0 || direction === 2 ? -1 : 1;
        if (direction < 2 && isRTL) {
          offset *= -1;
        }
        var newIndex = selectedIndex + offset;
        newIndex = Math.min(Math.max(0, newIndex), _elems2.length - 1);
        _elems2 = Array.prototype.slice.call(_elems2, newIndex, newIndex + 1);
        if (_elems2.length) {
          return _elems2;
        }
      }
      return null;
    }
    elems = newRowToFocus.querySelectorAll('.programCell');
    var isGoingForwardHorizontally = isRTL ? direction === 0 : direction === 1;
    if (direction == null || direction >= 2 || focusedChannelCell && isGoingForwardHorizontally) {
      var currentPositionOfGuide = this.currentPositionMs + msPerMinute;
      var currentPositionMs;
      //console.log('direction: ' + direction);
      if (focusedProgramCell && (direction == null || direction >= 2) && !(focusOptions != null && focusOptions.ignoreFocusedProgram)) {
        //console.log(getProgramFromProgramCell(focusedProgramCell).Name);
        currentPositionMs = getProgramFromProgramCell(focusedProgramCell).StartDateLocalMs;
        currentPositionMs = Math.max(currentPositionMs, currentPositionOfGuide);
        //console.log('currentPositionMs from program: ' + new Date(currentPositionMs));
      } else {
        currentPositionMs = currentPositionOfGuide;
        //console.log('currentPositionMs from guide: ' + new Date(currentPositionMs));
      }
      var now = Date.now();
      if (now >= currentPositionMs && currentPositionMs + cellDurationMs > now) {
        currentPositionMs = now;
      }
      var programs = newRowToFocus.Programs || [];
      //console.log('currentPositionMs: ' + new Date(currentPositionMs));
      var startIndex = 0;

      // exclude all programs that are before the current time position
      for (var i = 0, length = programs.length; i < length; i++) {
        var program = programs[i];
        //console.log('program.EndDateLocalMs: ' + new Date(program.EndDateLocalMs) + ', ' + program.Name);
        if (program.EndDateLocalMs <= currentPositionMs) {
          startIndex = i;
          if (startIndex < length - 1) {
            startIndex++;
          }
        } else {
          break;
        }
      }

      //console.log('startIndex: ' + startIndex);
      //console.log('first focusable program is: ' + elems[0]?.innerHTML);
      if (startIndex > 0) {
        elems = Array.prototype.slice.call(elems, startIndex);
      }
      if (elems.length) {
        elems = Array.prototype.slice.call(elems, 0, 1);
        //console.log('only focusable program is: ' + elems[0]?.innerHTML);
      }
    }
    if (elems.length) {
      return elems;
    }
    if (direction == null) {
      elems = newRowToFocus.querySelectorAll('.channelCell');
      if (elems.length) {
        return elems;
      }
    }

    // return null to use focusManager's default behavior
    return null;
  }
  function updateVirtualElement(row, item, index) {
    var focusedId;
    if (row) {
      var activeElement = document.activeElement;
      if (row.contains(activeElement)) {
        var focused = activeElement.closest('button');
        if (focused) {
          focusedId = focused.getAttribute('data-id');
        }
      }
    }
    _embyItemscontainer.default.prototype.updateVirtualElement.apply(this.itemsContainer, arguments);
    item.RowElement = row;

    //console.log('onUpdateElement: ' + item.Channel.Name);

    row.Programs = item.Programs.slice(0);
    row.ProgramMap = getProgramMap(row);
    row.getFocusableElements = this.boundFocusableElements;

    //console.log('program count for updated row: ' + item.Programs.length + ', programCell count: ' + row.children[1].children.length);

    // regenerate this the next time so that any dynamically added programs are incorporated
    this.itemsContainer.itemParts[index] = null;
    onScroll.call(this, {
      target: this.scroller,
      currentTarget: this.scroller,
      updateProgramTextRow: row,
      forceHorizontalChange: true
    });
    if (focusedId) {
      var elem = row.querySelector('button[data-id="' + focusedId + '"]');
      if (elem) {
        _focusmanager.default.focus(elem);
      } else {
        _focusmanager.default.autoFocus(row);
      }
    }
  }
  function onRecycleElement(row, index) {
    //console.log('onRecycleElement: ' + index);

    row.ProgramMap = null;
    row.Programs = null;
    var item = this.itemsContainer.getItem(index);
    if (item) {
      item.RowElement = null;
    }
  }
  function fillTagsHtml(instance, items) {
    var html = '';
    var selectedTagIds = _usersettings.default.get('guide-tagids') || null;
    selectedTagIds = selectedTagIds ? selectedTagIds.split(',') : [];
    for (var i = 0, length = items.length; i < length; i++) {
      var item = items[i];
      html += '<button type="button" is="emby-button" class="raised raised-mini raised-outline guide-filter-button btnGuideTag" data-id="' + item.Id + '">' + item.Name + '</button>';
    }
    var parent = instance.options.element.querySelector('.tagFilters');
    parent.innerHTML = html;
    for (var _i = 0, _length = selectedTagIds.length; _i < _length; _i++) {
      var id = selectedTagIds[_i];
      var btn = parent.querySelector('button[data-id="' + id + '"]');
      if (btn) {
        addSelectedClass(btn);
      }
    }
  }
  function refreshTagFilters(instance) {
    if (!_layoutmanager.default.tv && !instance.options.condensed) {
      instance.filterScroller.classList.remove('hide');
      instance.settingsButtons[1].classList.add('hide');
    } else {
      instance.filterScroller.classList.add('hide');
      instance.settingsButtons[1].classList.remove('hide');
    }
    var apiClient = _connectionmanager.default.getApiClient(instance.options.serverId);
    apiClient.getLiveTvChannelTags({
      SortBy: 'SortName',
      SortOrder: 'Ascending',
      EnableImages: false,
      EnableUserData: false
    }).then(function (result) {
      fillTagsHtml(instance, result.Items);
      selectAllButtonIfNeeded(instance);
    });
  }
  function afterRefresh() {
    var _this$itemsContainer$;
    var firstChannelCell = this.firstChannelCell;
    var settingsChannelCell = this.settingsChannelCell;
    var listOptions = ((_this$itemsContainer$ = this.itemsContainer.currentListOptions) == null ? void 0 : _this$itemsContainer$.options) || {};
    var cssClass = 'guide-currentTimeIndicatorDot guideEpg-currentTimeIndicatorDot hide';
    this.currentTimeIndicatorDots = this.options.element.querySelectorAll('.guide-currentTimeIndicatorDot');
    if (this.currentTimeIndicatorDots.length < 2) {
      this.itemsContainer.virtualScroller.insertAdjacentHTML('afterbegin', '<div class="' + cssClass + '"></div>');
      this.currentTimeIndicatorDots = this.options.element.querySelectorAll('.guide-currentTimeIndicatorDot');
    }
    var elem = this.options.element.querySelector('.guideEpg-currentTimeIndicatorDot');
    var channelCellClass = listOptions.channelCellClass || '';
    if (channelCellClass.includes('channelCell-wide2')) {
      firstChannelCell.classList.add('channelCell-wide2');
      firstChannelCell.classList.remove('channelCell-wide');
      settingsChannelCell.classList.add('channelCell-wide2');
      settingsChannelCell.classList.remove('channelCell-wide');
      elem.classList.add('guideEpg-currentTimeIndicatorDot-wide2');
      elem.classList.remove('guideEpg-currentTimeIndicatorDot-wide');
    } else if (channelCellClass.includes('channelCell-wide')) {
      firstChannelCell.classList.add('channelCell-wide');
      firstChannelCell.classList.remove('channelCell-wide2');
      settingsChannelCell.classList.add('channelCell-wide');
      settingsChannelCell.classList.remove('channelCell-wide2');
      elem.classList.add('guideEpg-currentTimeIndicatorDot-wide');
      elem.classList.remove('guideEpg-currentTimeIndicatorDot-wide2');
    } else {
      firstChannelCell.classList.remove('channelCell-wide', 'channelCell-wide2');
      settingsChannelCell.classList.remove('channelCell-wide', 'channelCell-wide2');
      elem.classList.remove('guideEpg-currentTimeIndicatorDot-wide', 'guideEpg-currentTimeIndicatorDot-wide2');
    }
    this.startCurrentTimeUpdateInterval();
  }
  function onLiveButtonClick(e) {
    this.scrollToNow();
  }
  function removeSelectedClass(elems) {
    for (var i = 0, length = elems.length; i < length; i++) {
      var _elem$querySelector;
      var elem = elems[i];
      elem.classList.remove('emby-tab-button-active');
      (_elem$querySelector = elem.querySelector('i')) == null || _elem$querySelector.remove();
    }
  }
  function removeItemOnce(arr, value) {
    var index = arr.indexOf(value);
    if (index > -1) {
      arr.splice(index, 1);
    }
    return arr;
  }
  function addSelectedClass(elem) {
    elem.classList.add('emby-tab-button-active');
    if (elem.querySelector('i')) {
      return;
    }
    elem.insertAdjacentHTML('afterbegin', '<i class="md-icon button-icon button-icon-left md-icon-fill guide-filters-active-icon">check_circle</i>');
  }
  function selectAllButtonIfNeeded(instance) {
    if (!instance.options.element.querySelectorAll('.emby-tab-button-active:not(.btnGuideCategory-all)').length) {
      addSelectedClass(instance.options.element.querySelector('.btnGuideCategory-all'));
    }
  }
  function onFilterScrollerClick(e) {
    var instance = this;
    var needsRefresh;
    var btnGuideCategory = e.target.closest('.btnGuideCategory');
    if (btnGuideCategory) {
      var type = btnGuideCategory.getAttribute('data-type');
      if (type) {
        if (btnGuideCategory.classList.contains('emby-tab-button-active')) {
          removeSelectedClass([btnGuideCategory]);
          removeItemOnce(instance.categoryOptions.categories, type);
          selectAllButtonIfNeeded(instance);
        } else {
          removeSelectedClass(instance.options.element.querySelectorAll('.btnGuideCategory-all'));
          addSelectedClass(btnGuideCategory);
          instance.categoryOptions.categories.push(type);
        }
      } else {
        instance.categoryOptions.categories = [];
        _usersettings.default.set('guide-tagids', '');
        removeSelectedClass(instance.options.element.querySelectorAll('.emby-tab-button-active:not(.btnGuideCategory-all)'));
        addSelectedClass(btnGuideCategory);
      }
      needsRefresh = true;
    }
    var btnGuideTag = e.target.closest('.btnGuideTag');
    if (btnGuideTag) {
      var selectedTagIds = _usersettings.default.get('guide-tagids') || null;
      selectedTagIds = selectedTagIds ? selectedTagIds.split(',') : [];
      var id = btnGuideTag.getAttribute('data-id');
      if (btnGuideTag.classList.contains('emby-tab-button-active')) {
        removeSelectedClass([btnGuideTag]);
        removeItemOnce(selectedTagIds, id);
        selectAllButtonIfNeeded(instance);
      } else {
        removeSelectedClass(instance.options.element.querySelectorAll('.btnGuideCategory-all'));
        addSelectedClass(btnGuideTag);
        selectedTagIds.push(id);
      }
      _usersettings.default.set('guide-tagids', selectedTagIds.join(','));
      needsRefresh = true;
    }
    if (needsRefresh) {
      instance.refresh();
    }
  }
  function onFocusInScroller(e) {
    var target = e.target;
    var classList = target.classList;
    if (classList.contains('programCell')) {
      var programCell = target;
      var item = getProgramFromProgramCell(programCell);
      if (item) {
        _events.default.trigger(this, 'focus', [{
          item: item,
          element: programCell
        }]);
      }
    }
    //else if (classList.contains('channelCell')) {

    //    const channelCell = target;

    //    const row = channelCell.closest('.epgRow');
    //    const item = this.itemsContainer.getItemFromElement(row);

    //    if (item) {
    //        events.trigger(this, 'focus', [
    //            {
    //                item: item,
    //                element: channelCell
    //            }]);
    //    }
    //}
  }
  function bindScrollEventOnUpgrade(instance) {
    instance.scroller.waitForCustomElementUpgrade().then(function () {
      instance.scroller.addScrollEventListener(onScroll.bind(instance), {
        passive: true
      });
    });
    instance.headerScroller.waitForCustomElementUpgrade().then(function () {
      instance.headerScroller.addScrollEventListener(onHeaderScroll.bind(instance), {
        passive: true
      });
    });
  }
  function getContextMenuElementFromChildNode(child) {
    return _shortcuts.default.getItemElementFromChildNode(child, false, this);
  }
  function getScrollButtonPageSize(scrollContainerSize, scrollType) {
    scrollContainerSize -= getChannelCellWidth(this);

    // account for the vertical scrollbar width
    scrollContainerSize -= 20;
    return Math.max(scrollContainerSize, 0);
  }
  function initialRender(instance) {
    if (instance.rendered) {
      return Promise.resolve();
    }
    instance.rendered = true;
    return require(['text!modules/emby-elements/guide/tvguide.template.html']).then(function (responses) {
      var context = instance.options.element;
      context.classList.add('tvguide');
      context.insertAdjacentHTML('beforeend', _globalize.default.translateDocument(responses[0], 'sharedcomponents'));
      instance.firstChannelCell = context.querySelector('.firstChannelCell');
      instance.settingsChannelCell = context.querySelector('.settingsChannelCell');
      instance.onTimerCreatedFn = onTimerCreated.bind(instance);
      _events.default.on(_api.default, 'TimerCreated', instance.onTimerCreatedFn);
      instance.onSeriesTimerCreatedFn = onSeriesTimerCreated.bind(instance);
      _events.default.on(_api.default, 'SeriesTimerCreated', instance.onSeriesTimerCreatedFn);
      instance.onTimerCancelledFn = onTimerCancelled.bind(instance);
      _events.default.on(_api.default, 'TimerCancelled', instance.onTimerCancelledFn);
      instance.onSeriesTimerCancelledFn = onSeriesTimerCancelled.bind(instance);
      _events.default.on(_api.default, 'SeriesTimerCancelled', instance.onSeriesTimerCancelledFn);
      instance.scroller = instance.options.element.querySelector('.virtualScrollerScrollContainer');
      instance.scroller.getScrollButtonPageSize = getScrollButtonPageSize.bind(instance);
      instance.headerScroller = instance.options.element.querySelector('.headerScroller');
      instance.uniqueId = startId;
      instance.scrollSliderUniqueClass = 'epgScrollSlider' + startId;
      instance.scroller.classList.add('epgVirtualScrollerScrollContainer-both');
      bindScrollEventOnUpgrade(instance);
      var itemsContainer = context.querySelector('.itemsContainer');
      itemsContainer.fetchData = instance.getItems.bind(instance);
      itemsContainer.afterRefresh = afterRefresh.bind(instance);
      itemsContainer.virtualChunkSize = virtualChunkSize;
      itemsContainer.getListOptions = instance.getListOptions.bind(instance);
      instance.itemsContainer = itemsContainer;
      instance.boundFocusableElements = getFocusableElementsInRow.bind(instance);
      itemsContainer.updateVirtualElement = updateVirtualElement.bind(instance);
      itemsContainer.onRecycleElement = onRecycleElement.bind(instance);
      itemsContainer.getContextMenuElementFromChildNode = getContextMenuElementFromChildNode.bind(itemsContainer);
      instance.channelCellResizeObserver = new ResizeObserver(onChannelCellResize.bind(instance), {});
      instance.channelCellResizeObserver.observe(instance.firstChannelCell);
      instance.channelCellResizeObserver.observe(instance.scroller);
      var i, length;
      var settingsButtons = context.querySelectorAll('.btnGuideViewSettings');
      instance.settingsButtons = settingsButtons;
      for (i = 0, length = settingsButtons.length; i < length; i++) {
        settingsButtons[i].addEventListener('click', onSettingsButtonClick.bind(instance));
      }
      instance.dateButtons = context.querySelectorAll('.btnSelectDate');
      for (i = 0, length = instance.dateButtons.length; i < length; i++) {
        instance.dateButtons[i].addEventListener('click', onDateButtonClick.bind(instance));
      }
      _dom.default.addEventListener(instance.scroller, 'focus', onFocusInScroller.bind(instance), {
        capture: true,
        passive: true
      });
      instance.btnLiveGuide = instance.options.element.querySelector('.btnLiveGuide');
      _dom.default.addEventListener(instance.btnLiveGuide, 'click', onLiveButtonClick.bind(instance), {
        capture: true,
        passive: true
      });
      instance.filterScroller = context.querySelector('.filterScroller');
      _dom.default.addEventListener(instance.filterScroller, 'click', onFilterScrollerClick.bind(instance), {});
      instance.styleElementUniqueClass = 'guideStyle' + startId;
      var scrollSliders = context.querySelectorAll('.epgScrollSlider');
      scrollSliders[0].classList.add(instance.scrollSliderUniqueClass);
      scrollSliders[1].classList.add(instance.scrollSliderUniqueClass);
      if (_layoutmanager.default.tv) {
        scrollSliders[0].classList.add(instance.scrollSliderUniqueClass + '-tv');
        scrollSliders[1].classList.add(instance.scrollSliderUniqueClass + '-tv');
      } else {
        scrollSliders[0].classList.remove(instance.scrollSliderUniqueClass + '-tv');
        scrollSliders[1].classList.remove(instance.scrollSliderUniqueClass + '-tv');
      }
      startId++;
    });
  }
  function getProgramFromProgramCell(programCell, rowElement) {
    var programId = programCell.getAttribute('data-id');

    //console.log('getProgramFromProgramCell: ' + programId);

    if (!rowElement) {
      rowElement = programCell.parentNode.parentNode;
    }

    //let rowItem = itemShortcuts.getItemFromChildNode(rowElement, true);
    var map = rowElement.ProgramMap;
    if (map) {
      var result = map[programId];
      if (result) {
        return result;
      }
    }

    // this null check shouldn't be needed, but saw it in a uwp crash report
    var programs = rowElement.Programs || [];
    for (var i = 0, length = programs.length; i < length; i++) {
      var program = programs[i];
      //console.log('program.EndDateLocalMs: ' + program.EndDateLocalMs);
      if (program.Id === programId) {
        return program;
      }
    }
  }
  function handleBack(e, instance) {
    var firstRow = instance.itemsContainer.getElement(0);
    var activeElement = document.activeElement;
    if (firstRow && activeElement) {
      if (firstRow.contains(activeElement)) {
        if (activeElement.closest('.channelCell')) {
          return;
        }
        var programCell = activeElement.closest('.programCell');
        if (!programCell) {
          return;
        }
        var program = getProgramFromProgramCell(programCell, firstRow);
        if (program) {
          if (program.StartDateLocalMs <= Date.now()) {
            return;
          }
          if (program.EndDateLocalMs <= Date.now()) {
            return;
          }

          // prevent default app back
          e.preventDefault();

          // prevent tabbedview from catching it
          e.stopPropagation();
          instance.scrollToNow();
          return;
        }
      }
    }
    instance.itemsContainer.scrollToIndex(0, {}, true);

    // prevent default app back
    e.preventDefault();

    // prevent tabbedview from catching it
    e.stopPropagation();
  }
  function onInputCommand(e) {
    var instance = this;
    switch (e.detail.command) {
      case 'pageup':
        // currently we'll never make it here due to shortcuts.js, but that's ok for now
        instance.moveChannelPages(-1);
        e.preventDefault();
        break;
      case 'pagedown':
        // currently we'll never make it here due to shortcuts.js, but that's ok for now
        instance.moveChannelPages(1);
        e.preventDefault();
        break;
      case 'channelup':
        instance.moveChannelPages(1);
        e.preventDefault();
        break;
      case 'channeldown':
        instance.moveChannelPages(-1);
        e.preventDefault();
        break;
      case 'fastforward':
        if (!_playbackmanager.default.isPlayingMediaType(['Audio', 'Video'])) {
          if (e.target.closest('.channelCell')) {
            instance.moveChannelPages(1);
          } else {
            instance.moveDays(1);
          }
          e.preventDefault();
        }
        break;
      case 'rewind':
        if (!_playbackmanager.default.isPlayingMediaType(['Audio', 'Video'])) {
          if (e.target.closest('.channelCell')) {
            instance.moveChannelPages(-1);
          } else {
            instance.moveDays(-1);
          }
          e.preventDefault();
        }
        break;
      case 'nexttrack':
      case 'nextchapter':
      case 'next':
        if (!_playbackmanager.default.isPlayingMediaType(['Audio', 'Video'])) {
          instance.moveDays(1);
          e.preventDefault();
        }
        break;
      case 'previoustrack':
      case 'previouschapter':
      case 'previous':
        if (!_playbackmanager.default.isPlayingMediaType(['Audio', 'Video'])) {
          instance.moveDays(-1);
          e.preventDefault();
        }
        break;
      case 'back':
        handleBack(e, instance);
        break;
      default:
        break;
    }
  }
  function Guide(options) {
    this.options = options;
    options.showEpisodeTitle = !options.condensed;
    this.categoryOptions = {
      categories: []
    };
    this.boundLoadPrograms = loadProgramsIfNeeded.bind(this);
    this.lastScrollTop = 0;
    this.lastScrollLeft = 0;
    _inputmanager.default.on(options.element, onInputCommand.bind(this));
  }
  function getDisplayTime(date) {
    if ((typeof date).toString().toLowerCase() === 'string') {
      try {
        date = new Date(Date.parse(date));
      } catch (err) {
        return date;
      }
    }
    return _datetime.default.getDisplayTime(date);
  }
  function getTimeslotHeadersHtml(originalStartDateMs, endDateTimeMs) {
    // clone
    var startDate = new Date(originalStartDateMs);
    var numSlots = 0;
    while (startDate.getTime() < endDateTimeMs) {
      numSlots++;
      // Add 30 mins
      startDate.setTime(startDate.getTime() + cellDurationMs);
    }
    var width = 100 / numSlots;

    // clone
    startDate = new Date(originalStartDateMs);
    var html = '';
    html += '<div class="guide-currentTimeIndicatorDot guideHeader-currentTimeIndicatorDot"></div>';
    while (startDate.getTime() < endDateTimeMs) {
      html += '<div class="timeslotHeader" style="width:' + width + '%;">';
      html += getDisplayTime(startDate);
      html += '</div>';

      // Add 30 mins
      startDate.setTime(startDate.getTime() + cellDurationMs);
    }
    return html;
  }
  function renderWidthCss(instance) {
    var numCells = Math.ceil((instance._endDateMs - instance._startDateMs) / cellDurationMs);
    var html = "\n.epgScrollSlider {\n        width: " + numCells * 32 + "ch;\n}\n\n@media all and (min-width: 80em) {\n\n    .epgScrollSlider {\n        width: " + numCells * 40 + "ch;\n    }\n}\n\n@media all and (min-width: 120em) {\n\n    .epgScrollSlider {\n        width: " + numCells * 50 + "ch;\n    }\n}\n\n@media all and (orientation: portrait) {\n\n    .epgScrollSlider {\n        width: calc(" + numCells + " * min(50ch, 34vw));\n    }\n}\n    .epgScrollSlider-tv {\n        width: " + numCells * 19 + "vw;\n    }\n";
    console.log('rendering guide width css');
    html = html.replaceAll('epgScrollSlider', instance.scrollSliderUniqueClass);
    var elem = document.querySelector('.' + instance.styleElementUniqueClass);
    if (!elem) {
      elem = document.createElement('style');
      elem.innerHTML = html;
      document.head.appendChild(elem);
    } else {
      elem.innerHTML = html;
    }
  }
  function onGetGuideInfo(guideInfo) {
    var _this$itemsContainer$2;
    var end = Date.parse(guideInfo.EndDate);
    _loading.default.show();
    var startDate = this._startDateMs = normalizeDateToTimeslot(Date.now());
    var endDate = this._endDateMs = normalizeDateToTimeslot(end, true);
    var instance = this;
    renderWidthCss(instance);

    // ResizeObserver is not firing after this change
    instance.scroller.notifyResized();
    this.options.element.querySelector('.timeslotHeaders').innerHTML = getTimeslotHeadersHtml(startDate, endDate);

    // use math.abs to account for rtl
    var currentPositionToDisplay = this.currentPositionMs ? null : startDate;
    this.updateDateButtonText(currentPositionToDisplay, Math.abs(this.scroller.getScrollLeft()));
    refreshTagFilters(this);

    // due to state being applied to the elements, this is necessary
    (_this$itemsContainer$2 = this.itemsContainer.virtualScroller) == null || _this$itemsContainer$2.resetAll();
    return this.itemsContainer.resume({
      refresh: true
    }).then(function () {
      _loading.default.hide();
    });
  }
  var dateLocalOptions = {
    weekday: 'short',
    month: 'short',
    day: 'numeric'
  };
  function hideOrShow(elem, hide) {
    var showing = elem._showing;
    if (showing === true) {
      if (hide) {
        elem.classList.add('hide');
        elem._showing = false;
      }
    } else {
      if (!hide) {
        elem.classList.remove('hide');
        elem._showing = true;
      }
    }
  }
  function isInCurrentFocusScope(instance) {
    return !_focusmanager.default.hasExclusiveFocusScope();
  }
  Guide.prototype.updateCurrentPositionIfNeeded = function () {
    var currentPositionMs = this.currentPositionMs;
    if (!currentPositionMs) {
      return;
    }
    console.log('currentPositionMs: ' + currentPositionMs);
    currentPositionMs = normalizeDateToTimeslot(currentPositionMs);
    console.log('currentPositionMs normalized: ' + currentPositionMs);
    var now = Date.now();
    console.log('now: ' + now);
    if (now >= currentPositionMs && now < currentPositionMs + cellDurationMs) {
      console.log('scrollToNow not needed');
      return;
    }
    if (!isInCurrentFocusScope(this)) {
      return;
    }
    this.scrollToNow();
  };
  Guide.prototype.scrollToNow = function () {
    //console.log('guide scrollToNow');

    var autoFocus = _layoutmanager.default.tv && isInCurrentFocusScope(this);
    scrollToTimeMs(this, Date.now(), true, autoFocus);
  };
  Guide.prototype.updateDateButtonText = function (currentPositionMs, scrollLeft, scrollWidth) {
    if (!currentPositionMs) {
      var startDate = this._startDateMs;
      var endDate = this._endDateMs;
      if (!startDate || !endDate) {
        return;
      }
      if (scrollWidth === 0) {
        return;
      }
      if (scrollWidth == null) {
        var channelCellWidth = getChannelCellWidth(this);
        if (!channelCellWidth) {
          return;
        }
        scrollWidth = this.scroller.getScrollWidth();
        if (!scrollWidth) {
          return;
        }
        scrollWidth -= channelCellWidth;
      }
      if (scrollWidth <= 0) {
        return;
      }
      currentPositionMs = scrollLeft / scrollWidth * (endDate - startDate);
      currentPositionMs = Math.floor(currentPositionMs);
      currentPositionMs += startDate;
    }
    this.currentPositionMs = currentPositionMs;
    var date = new Date(currentPositionMs);
    var btnDateText = this.btnDateText || (this.btnDateText = this.options.element.querySelector('.btnDateText'));
    btnDateText.innerHTML = _datetime.default.toLocaleDateString(date, dateLocalOptions);
    var btnLiveGuide = this.btnLiveGuide;
    if (!_layoutmanager.default.tv && Math.abs(currentPositionMs - Date.now()) > cellDurationMs) {
      hideOrShow(btnLiveGuide, false);
    } else {
      hideOrShow(btnLiveGuide, true);
    }
    var guideChannelStyle = _usersettings.default.guideChannelStyle();
    var options = {};
    options.showChannelImage = guideChannelStyle !== 'name';
    options.showChannelName = guideChannelStyle !== 'image';
    options.showChannelNumber = _usersettings.default.showChannelNumberInGuide();
    if (this.options.dateButton === false) {
      this.dateButtons[0].classList.add('hide');
    } else {
      this.dateButtons[0].classList.remove('hide');
    }
  };
  var minIdleTime = 60000;
  function onCurrentTimeUpdate() {
    var dots = this.currentTimeIndicatorDots;
    var startDateMs = this._startDateMs;
    var endDate = this._endDateMs;
    var pct;
    var now = Date.now();
    if (!startDateMs || !endDate) {
      pct = -100;
    } else {
      pct = (now - startDateMs) / (endDate - startDateMs) * 100;
    }
    var showIndicator = pct >= 0 && pct <= 100;
    pct = pct.toFixed(2) + '%';
    var displayTime = getDisplayTime(new Date(now));
    for (var i = 0, length = dots.length; i < length; i++) {
      var dot = dots[i];
      dot.style[InsetInlineStartProp] = pct;
      dot.setAttribute('aria-label', displayTime);
      dot.title = displayTime;
      if (showIndicator) {
        dot.classList.remove('hide');
      } else {
        dot.classList.add('hide');
      }
    }
    if (_inputmanager.default.idleTime() < minIdleTime) {
      return;
    }
    if (now - _mouse.default.lastMouseInputTime() < minIdleTime) {
      return;
    }
    this.updateCurrentPositionIfNeeded();
  }
  Guide.prototype.stopCurrentTimeUpdateInterval = function () {
    var interval = this.currentTimeUpdateInterval;
    if (interval) {
      interval.destroy();
      this.currentTimeUpdateInterval = null;
    }
  };
  Guide.prototype.startCurrentTimeUpdateInterval = function () {
    var interval = this.currentTimeUpdateInterval;
    var fn = onCurrentTimeUpdate.bind(this);
    if (!interval) {
      this.currentTimeUpdateInterval = new _methodtimer.default({
        onInterval: fn,
        timeoutMs: 40000,
        type: 'interval'
      });
    }
    setTimeout(fn, 200);
  };
  Guide.prototype.pause = function () {
    this.stopCurrentTimeUpdateInterval();
    var itemsContainer = this.itemsContainer;
    if (itemsContainer) {
      itemsContainer.pause();
    }
    _mouse.default.releaseMouseListening("guide");
  };
  function scrollToIndex(instance, index, focus, scrollBehavior) {
    if (focus) {
      instance.scroller.setFocusScroll('start');
    }
    instance.itemsContainer.scrollToIndex(index, {
      behavior: scrollBehavior
    }, focus);
    if (focus) {
      instance.scroller.setFocusScroll(null);
    }
  }
  function scrollToChannel(instance, itemId, focus, scrollBehavior) {
    if (!focus) {
      instance.scrollToChannelId = itemId;
    }
    var index = instance.itemsContainer.indexOfItemId(itemId);
    if (index !== -1) {
      scrollToIndex(instance, index, focus, scrollBehavior);
      return;
    }
    instance.itemsContainer.fetchData({
      Limit: 0
    }).then(function (totalResult) {
      // save an unnecessary request
      if (totalResult.TotalRecordCount <= 1) {
        scrollToIndex(instance, 0, focus, scrollBehavior);
        return;
      }
      instance.itemsContainer.fetchData({
        StartItemId: itemId,
        Limit: 0
      }).then(function (result) {
        var newIndex = result.TotalRecordCount ? Math.max(totalResult.TotalRecordCount - result.TotalRecordCount, 0) : 0;
        scrollToIndex(instance, newIndex, focus, scrollBehavior);
      });
    });
  }
  function getAfterRefreshFn(instance, options) {
    return function () {
      if (options && (options.autoFocus || options.scrollToChannelId)) {
        // TODO: This is due to activity happening in virtual-scroller
        setTimeout(function () {
          if (options.scrollToChannelId) {
            scrollToChannel(instance, options.scrollToChannelId, options.focusOnScroll, options.scrollBehavior);
          } else {
            _focusmanager.default.autoFocus(instance.itemsContainer);
          }
        }, _layoutmanager.default.tv ? 200 : 100);
      }
    };
  }
  Guide.prototype.resume = function (options) {
    var instance = this;
    _mouse.default.requestMouseListening("guide");
    return initialRender(instance).then(function () {
      if (options != null && options.refresh) {
        return instance.refresh().then(getAfterRefreshFn(instance, options));
      }
      var itemsContainer = instance.itemsContainer;
      if (itemsContainer) {
        return itemsContainer.resume(options).then(function () {
          if (options && options.scrollToChannelId) {
            scrollToChannel(instance, options.scrollToChannelId, options.focusOnScroll, options.scrollBehavior);
          }
          instance.startCurrentTimeUpdateInterval();
          if (options != null && options.resetScroll) {
            instance.updateCurrentPositionIfNeeded();
          }
        });
      }
      return Promise.resolve();
    });
  };
  Guide.prototype.refresh = function () {
    this.cancelDataLoadTimer();
    var apiClient = _connectionmanager.default.getApiClient(this.options.serverId);
    var instance = this;
    this.programCache = null;
    return apiClient.getLiveTvGuideInfo().then(onGetGuideInfo.bind(instance));
  };
  Guide.prototype.getItems = function (query, signal) {
    var options = this.options;
    var apiClient = _connectionmanager.default.getApiClient(options.serverId);
    var endDate = this._startDateMs + msPerPage;
    // Subtract to avoid getting programs that are starting when the grid ends
    var maxEndDate = this._endDateMs - 2000;
    endDate = Math.min(endDate, maxEndDate);
    var epgQuery = Object.assign({
      Fields: 'PrimaryImageAspectRatio',
      Limit: virtualChunkSize,
      MaxStartDate: new Date(endDate).toISOString(),
      // Add one second to avoid getting programs that are just ending
      MinEndDate: new Date(this._startDateMs + 1000).toISOString(),
      ProgramFields: getProgramFieldsProperty(),
      TagIds: _usersettings.default.get('guide-tagids') || null
    }, query || {});
    var categories = this.categoryOptions.categories || [];
    var displayMovieContent = !categories.length || categories.indexOf('movies') !== -1;
    var displaySportsContent = !categories.length || categories.indexOf('sports') !== -1;
    var displayNewsContent = !categories.length || categories.indexOf('news') !== -1;
    var displayKidsContent = !categories.length || categories.indexOf('kids') !== -1;
    var displaySeriesContent = !categories.length || categories.indexOf('series') !== -1;
    if (displayMovieContent && displaySportsContent && displayNewsContent && displayKidsContent) {
      epgQuery.IsMovie = null;
      epgQuery.IsSports = null;
      epgQuery.IsKids = null;
      epgQuery.IsNews = null;
      epgQuery.IsSeries = null;
    } else {
      if (displayNewsContent) {
        epgQuery.IsNews = true;
      }
      if (displaySportsContent) {
        epgQuery.IsSports = true;
      }
      if (displayKidsContent) {
        epgQuery.IsKids = true;
      }
      if (displayMovieContent) {
        epgQuery.IsMovie = true;
      }
      if (displaySeriesContent) {
        epgQuery.IsSeries = true;
      }
    }
    _usersettings.default.addLiveTvChannelSortingToQuery(epgQuery, _globalize.default);
    return apiClient.getEpg(epgQuery, signal).then(normalizeEpgResult.bind(this));
  };
  function getProgramMap(epgItem) {
    var programMap = {};
    var items = epgItem.Programs;
    for (var i = 0, length = items.length; i < length; i++) {
      var item = items[i];
      programMap[item.Id] = item;
    }
    return programMap;
  }
  function normalizeEpgResult(result) {
    var items = result.Items;
    for (var i = 0, length = items.length; i < length; i++) {
      var item = items[i];

      // this is to fill a data attribute so that we can query by channel id
      item.ChannelId = item.Channel.Id;
      item.ProgramMap = getProgramMap(item);
    }
    return result;
  }
  Guide.prototype.moveChannelPages = function (offset) {
    var rowsPerPage = _layoutmanager.default.tv ? 5 : 12;
    if (offset > 0) {
      this.itemsContainer.pageDown(document.activeElement, rowsPerPage);
    } else {
      this.itemsContainer.pageUp(document.activeElement, rowsPerPage);
    }
  };
  Guide.prototype.moveDays = function (offset) {
    var newMs = this.currentPositionMs + msPerDay * offset;
    scrollToTimeMs(this, newMs, false, true);
  };
  Guide.prototype.startDataLoadTimer = function (scrollLeft, scrollWidth, autoFocus, ignoreFocusedProgram) {
    var loadDataInfo = {
      scrollLeft: scrollLeft,
      autoFocus: autoFocus,
      ignoreFocusedProgram: ignoreFocusedProgram
    };
    this._loadDataInfo = loadDataInfo;
    var timeBlockStart = getTimeBlockStart(this, scrollLeft, scrollWidth);
    var dataLoadSection = timeBlockStart;
    if (dataLoadSection === this._dataLoadSection) {
      return;
    }
    this.cancelDataLoadTimer();
    this._loadDataInfo = loadDataInfo;
    this._dataLoadSection = dataLoadSection;
    //console.log('startDataLoadTimer: ' + timeBlockStart);

    this.getProgramsAbortController = new AbortController();
    this.getProgramsTimeout = setTimeout(this.boundLoadPrograms, 100);
  };
  Guide.prototype.cancelDataLoadTimer = function () {
    var _this$getProgramsAbor;
    var timeout = this.getProgramsTimeout;
    if (timeout) {
      clearTimeout(timeout);
      //console.log('cancelDataLoadTimer');
      this.getProgramsTimeout = null;
      this._loadDataInfo = null;
      this._dataLoadSection = null;
    }
    (_this$getProgramsAbor = this.getProgramsAbortController) == null || _this$getProgramsAbor.abort();
    this.getProgramsAbortController = null;
  };
  Guide.prototype.getListOptions = function (items) {
    var renderer = new _gridrowrenderer.default({});
    return {
      renderer: renderer,
      options: {
        categories: this.categoryOptions.categories,
        startDateMs: this._startDateMs,
        endDateMs: this._endDateMs,
        channelAction: this.options.channelAction || 'linkdialog',
        showEpisodeTitle: this.options.showEpisodeTitle
      },
      virtualScrollLayout: 'vertical-grid'
    };
  };
  Guide.prototype.destroy = function () {
    this.cancelDataLoadTimer();
    var options = this.options;
    this.stopCurrentTimeUpdateInterval();
    if (!options) {
      return;
    }
    var onTimerCreatedFn = this.onTimerCreatedFn;
    if (onTimerCreatedFn) {
      _events.default.off(_api.default, 'TimerCreated', onTimerCreatedFn);
      this.onTimerCreatedFn = null;
    }
    var onSeriesTimerCreatedFn = this.onSeriesTimerCreatedFn;
    if (onSeriesTimerCreatedFn) {
      _events.default.off(_api.default, 'SeriesTimerCreated', onSeriesTimerCreatedFn);
      this.onSeriesTimerCreatedFn = null;
    }
    var onTimerCancelledFn = this.onTimerCancelledFn;
    if (onTimerCancelledFn) {
      _events.default.off(_api.default, 'TimerCancelled', onTimerCancelledFn);
      this.onTimerCancelledFn = null;
    }
    var onSeriesTimerCancelledFn = this.onSeriesTimerCancelledFn;
    if (onSeriesTimerCancelledFn) {
      _events.default.off(_api.default, 'SeriesTimerCancelled', onSeriesTimerCancelledFn);
      this.onSeriesTimerCancelledFn = null;
    }
    var channelCellResizeObserver = this.channelCellResizeObserver;
    if (channelCellResizeObserver) {
      channelCellResizeObserver.disconnect();
      this.channelCellResizeObserver = null;
    }
    this.itemsContainer = null;
    this.currentTimeIndicatorDot = null;
    this.scroller = null;
    this.headerScroller = null;
    this.firstChannelCell = null;
    this.settingsChannelCell = null;
    this.options = null;
    this._endDateMs = null;
    this._startDateMs = null;
    this.channelCellWidth = null;
    this.programCache = null;
    this.btnDateText = null;
    this.btnLiveGuide = null;
    this.programBorderInlineStartWidth = null;
    this.dateButtons = null;
    this.settingsButtons = null;
    this.filterScroller = null;
  };
  var _default = _exports.default = Guide;
});
