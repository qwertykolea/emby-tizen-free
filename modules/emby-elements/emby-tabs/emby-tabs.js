define(["exports", "./../../dom.js", "./../../scroller/smoothscroller.js", "./../../focusmanager.js"], function (_exports, _dom, _smoothscroller, _focusmanager) {
  Object.defineProperty(_exports, "__esModule", {
    value: true
  });
  _exports.default = void 0;
  /* jshint module: true */

  require(['css!modules/emby-elements/emby-tabs/emby-tabs.css']);
  var buttonClass = 'emby-tab-button';
  var activeButtonClass = 'emby-tab-button-active';
  function setActiveTabButton(tabs, newButton, oldButton) {
    if (newButton) {
      newButton.classList.add(activeButtonClass);
    }
  }
  function getFocusCallback(tabs, e) {
    return function () {
      var activeElement = document.activeElement;
      if (activeElement) {
        var target = e.target;
        if (activeElement === target || activeElement.contains(target)) {
          // we may not be able to set the detail object in all environments
          e = {
            type: e.type,
            target: target,
            currentTarget: e.currentTarget
          };
          onClick.call(tabs, e);
        } else {
          // rescroll to the selected index
          // e.g., user moved around, then moved focus out of the tab bar
          var selected = tabs.querySelector('.' + activeButtonClass);
          if (selected && tabs.scroller) {
            tabs.scroller.scrollToElement(selected, {});
          }
        }
      }
    };
  }
  function onFocus(e) {
    this.clearFocusTimeout();
    var tabButton = e.target.closest('.' + buttonClass);
    if (tabButton) {
      var delay = this.selectedIndex() === -1 ? 0 : 700;
      this.focusTimeout = setTimeout(getFocusCallback(this, e), delay);
    }
  }
  function getTabPanel(tabs, index) {
    return null;
  }
  function removeActivePanelClass(tabs, index) {
    var tabPanel = getTabPanel(tabs, index);
    if (tabPanel) {
      tabPanel.classList.remove('is-active');
    }
  }
  function triggerBeforeTabChangeInternal(tabs, index, previousIndex, triggerEvent) {
    if (triggerEvent !== false) {
      tabs.dispatchEvent(new CustomEvent("beforetabchange", {
        detail: {
          selectedTabIndex: index,
          previousIndex: previousIndex
        }
      }));
    }
    if (previousIndex != null && previousIndex !== index) {
      removeActivePanelClass(tabs, previousIndex);
    }
    var newPanel = getTabPanel(tabs, index);
    if (newPanel) {
      newPanel.classList.add('is-active');
    }
  }
  function onClick(e) {
    this.clearFocusTimeout();
    var tabs = this;
    var current = tabs.querySelector('.' + activeButtonClass);
    var tabButton = e.target.closest('.' + buttonClass);
    if (tabButton && tabButton !== current) {
      if (current) {
        current.classList.remove(activeButtonClass);
      }
      var previousIndex = current ? parseInt(current.getAttribute('data-index')) : null;
      setActiveTabButton(tabs, tabButton, current, true);
      var index = parseInt(tabButton.getAttribute('data-index'));
      triggerBeforeTabChangeInternal(tabs, index, previousIndex);
      tabs.selectedTabIndex = index;

      // for now, since some tabbed pages are setting up tabs as distinct pages
      if (e.type !== 'click' && tabButton.href) {
        tabButton.click();
      }
      tabs.dispatchEvent(new CustomEvent("tabchange", {
        detail: {
          selectedTabIndex: index,
          previousIndex: previousIndex,
          selectedTabButton: tabButton
        }
      }));
    } else if (tabButton && tabButton === current) {
      var _index = parseInt(tabButton.getAttribute('data-index'));
      tabs.dispatchEvent(new CustomEvent("activetabclick", {
        detail: {
          selectedTabIndex: _index
        }
      }));
    }
  }
  var DefaultFocusScroll = 'adaptive';
  function initScroller(tabs) {
    if (tabs.scroller) {
      return;
    }
    var focusScroll = tabs.getAttribute('data-focusscroll');

    // application default
    if (focusScroll === 'true') {
      focusScroll = DefaultFocusScroll;
    } else if (focusScroll === 'false') {
      focusScroll = null;
    } else if (!focusScroll) {
      focusScroll = tabs.getAttribute('data-centerfocus') !== 'false' ? DefaultFocusScroll : null;
    }
    var contentScrollSlider = tabs.querySelector('.emby-tabs-slider');
    if (contentScrollSlider) {
      contentScrollSlider.classList.add('nohoverfocus');
      tabs.scroller = new _smoothscroller.default(tabs, {
        horizontal: 1,
        slidee: contentScrollSlider,
        speed: 240,
        dragHandle: 1,
        hiddenScroll: true,
        focusScroll: focusScroll,
        focusScrollOffsetLeft: tabs.getAttribute('data-focusscrolloffsetleft') || tabs.getAttribute('data-focusscrolloffset') || null,
        allowNativeSmoothScroll: true,
        // due to this: https://github.com/MediaBrowser/SamES/issues/110
        //forceNativeScroll: true,
        autoPreventScrollOnFocus: false,
        autoStartEdge: false,
        adaptiveBorderXStart: 0,
        adaptiveBorderXEnd: 0
      });
      tabs.scroller.init();
    }
  }
  function onInit() {
    var elem = this;
    if (elem.hasInit) {
      return;
    }
    elem.hasInit = true;
    this.classList.add('emby-tabs', 'focusable');
  }
  var EmbyTabs = /*#__PURE__*/function (_HTMLDivElement) {
    function EmbyTabs() {
      var _this;
      // address the upgraded instance and use it
      var self = _this = _HTMLDivElement.call(this) || this;
      onInit.call(self);
      return babelHelpers.possibleConstructorReturn(_this, self);
    }
    babelHelpers.inherits(EmbyTabs, _HTMLDivElement);
    return babelHelpers.createClass(EmbyTabs, [{
      key: "connectedCallback",
      value: function connectedCallback() {
        onInit.call(this);
        _dom.default.removeEventListener(this, 'click', onClick, {
          passive: true
        });
        _dom.default.addEventListener(this, 'click', onClick, {
          passive: true
        });
        _dom.default.removeEventListener(this, 'focus', onFocus, {
          passive: true,
          capture: true
        });
        _dom.default.addEventListener(this, 'focus', onFocus, {
          passive: true,
          capture: true
        });
        initScroller(this);
        this.onTabsChanged();
        if (!this.readyFired) {
          this.readyFired = true;
          this.dispatchEvent(new CustomEvent("ready", {}));
        }
      }
    }, {
      key: "onTabsChanged",
      value: function onTabsChanged() {
        var current = this.querySelector('.' + activeButtonClass);
        var currentIndex = current ? parseInt(current.getAttribute('data-index')) : parseInt(this.getAttribute('data-index') || '0');
        this.selectedTabIndex = currentIndex;
        if (currentIndex !== -1) {
          var tabButtons = this.querySelectorAll('.' + buttonClass);
          var newTabButton = tabButtons[currentIndex];
          if (newTabButton) {
            setActiveTabButton(this, newTabButton, current, false);
            if (this.scroller) {
              this.scroller.scrollToElement(newTabButton, {
                behavior: 'instant'
              });
            }
          }
        }
      }
    }, {
      key: "clearFocusTimeout",
      value: function clearFocusTimeout() {
        if (this.focusTimeout) {
          clearTimeout(this.focusTimeout);
        }
      }
    }, {
      key: "detachedCallback",
      value: function detachedCallback() {
        if (this.scroller) {
          this.scroller.destroy();
          this.scroller = null;
        }
        _dom.default.removeEventListener(this, 'click', onClick, {
          passive: true
        });
        _dom.default.removeEventListener(this, 'focus', onFocus, {
          passive: true,
          capture: true
        });
      }
    }, {
      key: "focus",
      value: function focus() {
        var selected = this.querySelector('.' + activeButtonClass);
        if (selected) {
          _focusmanager.default.focus(selected);
        } else {
          _focusmanager.default.autoFocus(this);
        }
      }
    }, {
      key: "selectedIndex",
      value: function selectedIndex(selected, triggerEvent) {
        var tabs = this;
        if (selected == null) {
          return tabs.selectedTabIndex || 0;
        }
        this.clearFocusTimeout();
        var current = tabs.selectedIndex();
        tabs.selectedTabIndex = selected;
        var tabButtons = tabs.querySelectorAll('.' + buttonClass);
        if (current === selected || triggerEvent === false || selected === -1) {
          triggerBeforeTabChangeInternal(tabs, selected, current, triggerEvent);
          if (triggerEvent !== false) {
            tabs.dispatchEvent(new CustomEvent("tabchange", {
              detail: {
                selectedTabIndex: selected
              }
            }));
          }
          var currentTabButton = tabButtons[current];
          setActiveTabButton(tabs, tabButtons[selected], currentTabButton, false);
          if (current !== selected && currentTabButton) {
            currentTabButton.classList.remove(activeButtonClass);
          }
        } else {
          onClick.call(tabs, {
            target: tabButtons[selected]
          });
        }
      }
    }, {
      key: "triggerBeforeTabChange",
      value: function triggerBeforeTabChange(selected) {
        var tabs = this;
        triggerBeforeTabChangeInternal(tabs, tabs.selectedIndex());
      }
    }, {
      key: "triggerTabChange",
      value: function triggerTabChange(selected) {
        var tabs = this;
        tabs.dispatchEvent(new CustomEvent("tabchange", {
          detail: {
            selectedTabIndex: tabs.selectedIndex()
          }
        }));
      }
    }, {
      key: "setTabEnabled",
      value: function setTabEnabled(index, enabled) {
        var btn = this.querySelector('.emby-tab-button[data-index="' + index + '"]');
        if (enabled) {
          btn.classList.remove('hide');
        } else {
          btn.classList.add('hide');
        }
      }
    }]);
  }(/*#__PURE__*/babelHelpers.wrapNativeSuper(HTMLDivElement));
  customElements.define('emby-tabs', EmbyTabs, {
    extends: 'div'
  });
  var _default = _exports.default = EmbyTabs;
});
