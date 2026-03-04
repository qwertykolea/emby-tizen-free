define(["exports", "./layoutmanager.js", "./emby-apiclient/events.js"], function (_exports, _layoutmanager, _events) {
  Object.defineProperty(_exports, "__esModule", {
    value: true
  });
  _exports.default = void 0;
  /* jshint module: true */

  var defaultScope = document.body;
  var scopes = [];
  var _currentScope = defaultScope;
  function pushScope(elem) {
    if (!scopes.includes(elem)) {
      scopes.push(elem);
      _currentScope = elem;
    }
  }
  function removeItemOnce(arr, value) {
    var index = arr.indexOf(value);
    if (index > -1) {
      arr.splice(index, 1);
    }
    return arr;
  }
  function popScope(elem) {
    removeItemOnce(scopes, elem);
    _currentScope = findCurrentScope();
  }
  function findCurrentScope() {
    var arr = scopes;
    return arr[arr.length - 1] || defaultScope;
  }
  function getCurrentScope() {
    return _currentScope;
  }
  function hasExclusiveFocusScope() {
    return scopes.length;
  }
  function isAutoFocusEnabled(elem) {
    if (_layoutmanager.default.tv) {
      return true;
    }
    if (elem) {
      var tagName = elem.tagName;
      switch (tagName) {
        case 'INPUT':
          var type = elem.type;
          switch (type) {
            case 'checkbox':
            case 'radio':
            case 'file':
            case 'hidden':
            case 'range':
              return false;
            default:
              return true;
          }
        // jshint ignore:line
        case 'TEXTAREA':
          return true;
        default:
          break;
      }
    }
    return false;
  }
  function getElementToAutoFocus(view, options) {
    var element;
    if (!options || options.findAutoFocusElement !== false) {
      element = view.querySelector('.autofocus:not(:disabled)');
      if (element && isCurrentlyFocusableInternal(element, true)) {
        return element;
      }
    }
    return getFocusableElements(view, 1, '.noautofocus', options)[0] || getFocusableElements(view, 1, null, options)[0];
  }
  function autoFocus(view, options) {
    var elem = getElementToAutoFocus(view, options);
    if (elem) {
      return focus(elem, options);
    }
    return elem;
  }
  function focus(element, options) {
    //console.log('focus: ' + element.tagName + ', className: ' + element.className + ', innerHTML: ' + element.innerHTML);
    while (element.classList.contains('focusable')) {
      var autoFocusElement = getElementToAutoFocus(element, options);
      if (autoFocusElement) {
        element = autoFocusElement;
      } else {
        break;
      }
    }
    if (options != null && options.skipIfNotEnabled && !isAutoFocusEnabled(element)) {
      return null;
    }
    focusInternal(element, options);
    return element;
  }
  var lastFocusInfo = {};
  function focusInternal(element, options) {
    //console.log('focusInternal: ' + element.tagName + ', className: ' + element.className + ', innerHTML: ' + element.innerHTML);

    try {
      //console.log('focusing element: ' + element.tagName + ': ' + element.className + ', isCurrentlyFocusable: ' + isCurrentlyFocusable(element) + '--' + new Error().stack);
      //if (!isCurrentlyFocusable(element)) {
      //    console.error('trying to focus an element that is not focusable: ' + element.className);
      //}

      lastFocusInfo = {
        element: element,
        options: options
      };
      element.focus({
        preventScroll: true
      });
    } catch (err) {
      console.error('Error in focusManager.focusInternal: ', err);
    }
  }
  var focusableTagNames = ['INPUT', 'TEXTAREA', 'SELECT', 'BUTTON', 'A', 'DIV[tabindex]'];
  var focusableQuerySelectors = focusableTagNames.map(function (t) {
    if (t === 'A') {
      t = t + '[href]';
    }
    return t + ':not([tabindex="-1"]):not(:disabled)';
  });
  focusableQuerySelectors.push('.focusable');
  var focusableQuery = focusableQuerySelectors.join(',');
  function buildFocusableQuery(excludeSelector) {
    if (!excludeSelector) {
      return focusableQuery;
    }
    var newQuerySelectors = [focusableQuerySelectors.length];
    for (var i = 0, length = focusableQuerySelectors.length; i < length; i++) {
      newQuerySelectors[i] = focusableQuerySelectors[i] + ':not(' + excludeSelector + ')';
    }
    return newQuerySelectors.join(',');
  }
  var focusableTagNameQuery = focusableTagNames.join(',');
  var focusableParentQuery = focusableTagNames.join(',') + ',.focusable';
  function focusableParent(elem, includeGroups) {
    if (includeGroups === false) {
      return elem.closest(focusableTagNameQuery);
    }
    return elem.closest(focusableParentQuery);
  }

  // Determines if a focusable element can be focused at a given point in time 
  function isCurrentlyFocusableInternal(elem, checkOffsetParent) {
    // http://stackoverflow.com/questions/19669786/check-if-element-is-visible-in-dom
    if (checkOffsetParent && elem.offsetParent === null) {
      return false;
    }
    return true;
  }
  function isCurrentlyFocusable(elem) {
    if (!elem.matches(focusableQuery)) {
      //console.log('elem does not match focusable query: ' + elem.className);
      return false;
    }

    // this is what we probably should do as it is more accurate
    // but also inconsistent with isCurrentlyFocusableInternal
    //const style = window.getComputedStyle(elem);
    //if (style.display === 'none') {
    //    console.log('elem or parent has display none');
    //    return false;
    //}
    //if (style.visibility === 'hidden') {
    //    console.log('elem or parent has visibility hidden');
    //    return false;
    //}
    //return isCurrentlyFocusableInternal(elem, false);

    return isCurrentlyFocusableInternal(elem, true);
  }
  function getFocusableElements(parent, limit, excludeSelector, options) {
    if (!parent) {
      parent = _currentScope;
    }

    //console.log('getFocusableElements: ' + parent.className);
    var fn = parent.getFocusableElements;
    var elems;
    if (fn) {
      elems = fn(parent, document.activeElement, null, options);
    }
    if (!elems) {
      elems = parent.querySelectorAll(buildFocusableQuery(excludeSelector));
    }
    var focusableElements = [];
    for (var i = 0, length = elems.length; i < length; i++) {
      var elem = elems[i];
      if (isCurrentlyFocusableInternal(elem, limit)) {
        focusableElements.push(elem);
        if (limit && focusableElements.length >= limit) {
          break;
        }
      }
    }
    return focusableElements;
  }
  var focusContainerQueries = [
  // 0 = left
  '.focuscontainer,.focuscontainer-x',
  // 1 = right
  '.focuscontainer,.focuscontainer-x',
  // 2 = up
  '.focuscontainer,.focuscontainer-y,.focuscontainer-up',
  // 3 = down
  '.focuscontainer,.focuscontainer-y,.focuscontainer-down'];
  function getFocusContainer(elem, direction) {
    var selector = focusContainerQueries[direction];
    var closest = elem.closest(selector);
    if (closest) {
      return closest;
    }
    var currentScope = _currentScope;
    var defaultScopeResult = defaultScope;
    if (currentScope === defaultScopeResult || currentScope.contains(elem)) {
      return currentScope;
    }
    return defaultScopeResult;
  }
  function getNearestElement(activeElement, activeElementRect, direction, focusableElements, enableSingleElementOptimization, focusableContainer) {
    if (enableSingleElementOptimization) {
      var resultElem = focusableElements[0];
      return {
        element: resultElem,
        rect: resultElem == null ? void 0 : resultElem.getBoundingClientRect()
      };
    }
    var nearestElement;
    var nearestElementRect;
    var activeElementTop = activeElementRect.top;
    var activeElementLeft = activeElementRect.left;

    // Get elements and work out x/y points
    var point1x = parseFloat(activeElementLeft) || 0,
      point1y = parseFloat(activeElementTop) || 0,
      point2x = parseFloat(point1x + activeElementRect.width - 1) || point1x,
      point2y = parseFloat(point1y + activeElementRect.height - 1) || point1y;
    var minDistance = Infinity;

    //console.log('getNearestElement: ' + direction + ', ' + focusableElements.length + ' candidates');

    for (var i = 0, length = focusableElements.length; i < length; i++) {
      var curr = focusableElements[i];
      if (curr === activeElement) {
        continue;
      }
      // Don't refocus into the same container
      if (curr === focusableContainer) {
        //console.log('curr === focusableContainer: ' + curr.className);
        continue;
      }
      var elementRect = curr.getBoundingClientRect();
      var elementRectWidth = elementRect.width;
      var elementRectHeight = elementRect.height;

      // not currently visible
      if (!elementRectWidth || !elementRectHeight) {
        //console.log('no size: ' + curr.className);
        continue;
      }
      var elementRectLeft = elementRect.left;
      var elementRectTop = elementRect.top;

      //console.log('evaluating element in getNearestElement: ' + curr.className);

      switch (direction) {
        case 0:
          // left
          if (elementRectLeft >= activeElementLeft) {
            continue;
          }
          if (elementRect.right === activeElementRect.right) {
            continue;
          }
          break;
        case 1:
          // right
          if (elementRect.right <= activeElementRect.right) {
            continue;
          }
          if (elementRectLeft === activeElementLeft) {
            continue;
          }
          break;
        case 2:
          // up
          if (elementRectTop >= activeElementTop) {
            //console.log('getNearestElement elementRectTop is greater (' + elementRectTop + '>=' + activeElementTop + '): ' + curr.className);
            continue;
          }
          if (elementRect.bottom >= activeElementRect.bottom) {
            //console.log('getNearestElement elementRect.bottom is greater (' + elementRect.bottom + '>=' + activeElementRect.bottom + '): ' + curr.className);
            continue;
          }
          break;
        case 3:
          // down
          if (elementRect.bottom <= activeElementRect.bottom) {
            continue;
          }
          if (elementRectTop <= activeElementTop) {
            continue;
          }
          break;
        default:
          break;
      }

      //console.log('evaluating element in getNearestElement: ' + curr.className);

      var x2 = elementRectLeft + elementRectWidth - 1,
        y2 = elementRectTop + elementRectHeight - 1;
      var distX = void 0;
      var distY = void 0;
      switch (direction) {
        case 0:
          {
            // left
            var intersectY = intersection(point1y, point2y, elementRectTop, y2);
            distX = Math.abs(point1x - Math.min(point1x, x2));
            distY = intersectY || 1 + Math.min(Math.abs(point1y - y2), Math.abs(point2y - elementRectTop));
            break;
          }
        case 1:
          {
            // right
            var _intersectY = intersection(point1y, point2y, elementRectTop, y2);
            distX = Math.abs(point2x - Math.max(point2x, elementRectLeft));
            distY = _intersectY || 1 + Math.min(Math.abs(point1y - y2), Math.abs(point2y - elementRectTop));
            break;
          }
        case 2:
          {
            // up
            var intersectX = intersection(point1x, point2x, elementRectLeft, x2);
            distY = Math.abs(point1y - Math.min(point1y, y2));
            distX = intersectX || 1 + Math.min(Math.abs(point1x - x2), Math.abs(point2x - elementRectLeft));
            break;
          }
        case 3:
          {
            // down
            var _intersectX = intersection(point1x, point2x, elementRectLeft, x2);
            distY = Math.abs(point2y - Math.max(point2y, elementRectTop));
            distX = _intersectX || 1 + Math.min(Math.abs(point1x - x2), Math.abs(point2x - elementRectLeft));
            break;
          }
        default:
          break;
      }
      var dist = Math.sqrt(distX * distX + distY * distY);
      //console.log('distX: ' + distX + ', distY: ' + distY + ', dist: ' + dist + ', elem:' + curr.className);

      if (dist < minDistance) {
        nearestElement = curr;
        nearestElementRect = elementRect;
        minDistance = dist;
      }
    }
    return {
      element: nearestElement,
      rect: nearestElementRect
    };
  }
  function nav(activeElement, direction, container) {
    if (!activeElement) {
      activeElement = document.activeElement;
    }
    if (activeElement) {
      var parent = focusableParent(activeElement);
      if (parent) {
        activeElement = parent;
      }
    }

    //console.log('navigating in direction: ' + direction + ', focusContainer: ' + container.tagName + '-' + container.className + ', from: ' + activeElement.tagName + '-' + activeElement.className);

    if (!activeElement) {
      return autoFocus(container, {
        findAutoFocusElement: false,
        preventScroll: false
      });
    }
    var focusableContainer = activeElement.closest('.focusable');
    var nearestElement;
    var activeElementRect;

    //console.log('getting focusable elements from ' + container.tagName + ' ' + container.className);
    var fn = container.getFocusableElements;
    var enableSingleElementOptimization;
    var focusable;
    if (fn) {
      focusable = fn(nearestElement, activeElement, direction);
      if (focusable) {
        enableSingleElementOptimization = focusable.length < 2;
      }
    }
    if (!focusable) {
      focusable = container.querySelectorAll(focusableQuery);
      enableSingleElementOptimization = focusable.length === 0;
    }
    if (!enableSingleElementOptimization) {
      activeElementRect = activeElement.getBoundingClientRect();
    }
    var nearestElementInfo = getNearestElement(activeElement, activeElementRect, direction, focusable, enableSingleElementOptimization, focusableContainer);
    nearestElement = nearestElementInfo.element;
    //console.log('nearest element: ' + nearestElement?.className + ', focusableContainer:' + focusableContainer?.className);

    if (!nearestElement) {
      return;
    }

    // See if there's a focusable container, and if so, send the focus command to that
    if (activeElement) {
      var nearestElementFocusableParent = nearestElement.closest('.focusable');
      if (nearestElementFocusableParent && nearestElementFocusableParent !== nearestElement) {
        if (focusableContainer !== nearestElementFocusableParent) {
          nearestElement = nearestElementFocusableParent;
        }
      }
    }
    var focusableType = nearestElement.getAttribute('data-focusabletype');
    if (focusableType === 'autofocus') {
      return autoFocus(nearestElement, {
        preventScroll: false,
        itemBoundingClientRect: nearestElementInfo.rect
      });
    }
    if (focusableType === 'nearest') {
      var _fn = nearestElement.getFocusableElements;
      var _enableSingleElementOptimization;
      var elems;
      if (_fn) {
        elems = _fn(nearestElement, activeElement, direction);
        if (elems) {
          _enableSingleElementOptimization = elems.length < 2;
        }
      }
      if (!elems) {
        elems = nearestElement.querySelectorAll(focusableQuery);
        _enableSingleElementOptimization = elems.length === 0;
      }
      if (!_enableSingleElementOptimization && !activeElementRect) {
        activeElementRect = activeElement.getBoundingClientRect();
      }
      var nearestElementInfoWithinContainer = getNearestElement(activeElement, activeElementRect, direction, elems, _enableSingleElementOptimization, focusableContainer);
      var nearestWithinContainer = nearestElementInfoWithinContainer.element;
      if (nearestWithinContainer) {
        focusInternal(nearestWithinContainer, {
          preventScroll: false,
          itemBoundingClientRect: nearestElementInfoWithinContainer.rect,
          // attaching this is purely to make it available in lastFocusInfo
          direction: direction
        });
        return nearestWithinContainer;
      } else {
        return autoFocus(nearestElement, {
          preventScroll: false
        });
      }
    }
    focusInternal(nearestElement, {
      preventScroll: false,
      itemBoundingClientRect: nearestElementInfo.rect,
      // attaching this is purely to make it available in lastFocusInfo
      direction: direction
    });
    return nearestElement;
  }
  function intersection(a1, a2, b1, b2) {
    var intersectionStart = Math.max(a1, b1);
    var intersectionEnd = Math.min(a2, b2);
    if (intersectionStart >= intersectionEnd) {
      return null;
    }
    var res = 1 - (intersectionEnd - intersectionStart) / (a2 - a1);
    return res + 0.000000001;
  }
  function sendText(text) {
    var elem = document.activeElement;
    elem.value = text;
  }
  function canNavOut(container, direction) {
    var classList = container.classList;
    switch (direction) {
      case 0:
      case 1:
        return classList.contains('navout-x');
      case 2:
        return classList.contains('navout-up');
      case 3:
        // enable this when we actually need to. it may cause the nowplayingbar to receive focus
        return classList.contains('navout-down');
      default:
        return false;
    }
  }
  function navOuter(sourceElement, direction) {
    var container = sourceElement ? getFocusContainer(sourceElement, direction) : _currentScope;

    // when the sourceElement is the container (e.g. no current active element), then just autoFocus in place of the nav
    // this will make it easier to press a nav key and have it work when nothing is focused, as opposed to just having it do nothing
    if (container === sourceElement) {
      var _container$controller;
      //if (container === defaultScope) {
      //    let currentView = container.querySelector('.view:not(.hide)');
      //    if (currentView) {
      //        container = currentView;
      //    }
      //}

      if ((_container$controller = container.controller) != null && _container$controller.autoFocus) {
        return container.controller.autoFocus({
          skipIfNotEnabled: false,
          preventScroll: false
        });
      }
      return autoFocus(container, {
        preventScroll: false
      });
    }
    var newElement;
    while (container) {
      newElement = nav(sourceElement, direction, container);
      if (newElement) {
        break;
      }
      if (canNavOut(container, direction)) {
        var newContainerParent = (container.getNavOutDestination ? container.getNavOutDestination(direction) : null) || container.parentNode;
        if (!newContainerParent) {
          break;
        }
        container = getFocusContainer(newContainerParent, direction);
      } else {
        break;
      }
    }
    return newElement;
  }
  var Directions = {
    left: 0,
    right: 1,
    up: 2,
    down: 3
  };
  var focusManager = {
    autoFocus: autoFocus,
    focus: focus,
    focusableParent: focusableParent,
    moveLeft: function (sourceElement) {
      var newElement = navOuter(sourceElement, 0);
      if (newElement) {
        _events.default.trigger(focusManager, 'move');
      }
      return newElement;
    },
    moveRight: function (sourceElement) {
      var newElement = navOuter(sourceElement, 1);
      if (newElement) {
        _events.default.trigger(focusManager, 'move');
      }
      return newElement;
    },
    moveUp: function (sourceElement) {
      var newElement = navOuter(sourceElement, 2);
      if (newElement) {
        _events.default.trigger(focusManager, 'move');
      }
      return newElement;
    },
    moveDown: function (sourceElement) {
      var newElement = navOuter(sourceElement, 3);
      if (newElement) {
        _events.default.trigger(focusManager, 'move');
      }
      return newElement;
    },
    sendText: sendText,
    isCurrentlyFocusable: isCurrentlyFocusable,
    pushScope: pushScope,
    popScope: popScope,
    hasExclusiveFocusScope: hasExclusiveFocusScope,
    getCurrentScope: getCurrentScope,
    isAutoFocusEnabled: isAutoFocusEnabled,
    getLastFocusInfo: function () {
      return lastFocusInfo;
    },
    directions: Directions
  };
  var _default = _exports.default = focusManager;
});
