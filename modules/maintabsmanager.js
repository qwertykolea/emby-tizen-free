define(["exports", "./layoutmanager.js", "./dom.js", "./emby-elements/emby-button/emby-button.js", "./emby-elements/emby-tabs/emby-tabs.js", "./focusmanager.js"], function (_exports, _layoutmanager, _dom, _embyButton, _embyTabs, _focusmanager) {
  Object.defineProperty(_exports, "__esModule", {
    value: true
  });
  _exports.default = void 0;
  /* jshint module: true */

  var tabOwnerView;
  var headerTabsContainer;
  var tabsElem;
  var headerTop;
  var headerMiddle;
  function ensureElements() {
    if (!headerTabsContainer) {
      headerTabsContainer = document.querySelector('.headerMiddle');
    }
  }
  function onViewTabsReady() {
    this.selectedIndex(this.readySelectedIndex);
    this.readySelectedIndex = null;
  }
  function defaultGetTabContainersFn() {
    return [];
  }
  function setTabs(view, selectedIndex, getTabsFn, getTabContainersFn, onTabChange, setSelectedIndex) {
    if (!view) {
      if (tabOwnerView) {
        if (!headerTabsContainer) {
          headerTabsContainer = document.querySelector('.headerMiddle');
        }
        ensureElements();
        if (headerTop) {
          headerTop.classList.remove('headerTop-withSectionTabs', 'headerTop-withSectionTabs-hideTitle');
        }
        if (headerMiddle) {
          headerMiddle.classList.remove('headerMiddle-withSectionTabs');
        }
        document.documentElement.classList.remove('withHeaderTabs');
        headerTabsContainer.innerHTML = '';
        tabOwnerView = null;
      }
      return {
        tabsContainer: headerTabsContainer,
        replaced: false
      };
    }
    ensureElements();
    var tabsContainerElem = headerTabsContainer;
    if (tabOwnerView !== view) {
      var index = 0;
      var indexAttribute = selectedIndex == null ? '' : ' data-index="' + selectedIndex + '"';

      // add classes from emby-tabs now to minimize layout shift later
      var tabsClass = 'tabs-viewmenubar tabs-viewmenubar-backgroundcontainer emby-tabs padded-left padded-right';
      var tabsSliderClass = 'tabs-viewmenubar-slider emby-tabs-slider';
      if (_dom.default.allowBackdropFilter()) {
        tabsClass += ' tabs-viewmenubar-backgroundcontainer-backdropfilter';
      }
      if (_layoutmanager.default.tv) {
        tabsClass += ' scrollFrameX';
        tabsSliderClass += ' scrollSliderX';
      }
      var tabsHtml = '<div is="emby-tabs"' + indexAttribute + ' class="' + tabsClass + '"><div class="' + tabsSliderClass + '">' + getTabsFn().map(function (t) {
        // add classes from emby-button now to minimize layout shift later
        var tabClass = 'emby-button secondaryText emby-tab-button main-tab-button';
        if (t.enabled === false) {
          tabClass += ' hide';
        }
        var tabHtml;
        if (t.cssClass) {
          tabClass += ' ' + t.cssClass;
        }
        if (t.href) {
          tabHtml = '<a href="' + t.href + '" is="emby-linkbutton" class="' + tabClass + '" data-index="' + index + '">';
        } else {
          tabHtml = '<button type="button" is="emby-button" class="' + tabClass + '" data-index="' + index + '">';
        }
        if (t.name) {
          tabHtml += t.name;
        } else if (t.icon) {
          tabHtml += '<i class="md-icon">' + t.icon + '</i>';
        }
        if (t.href) {
          tabHtml += '</a>';
        } else {
          tabHtml += '</button>';
        }
        index++;
        return tabHtml;
      }).join('') + '</div></div>';
      tabsContainerElem.innerHTML = tabsHtml;
      if (!headerTop) {
        headerTop = document.querySelector('.headerTop');
      }
      if (!headerMiddle) {
        headerMiddle = document.querySelector('.headerMiddle');
      }
      if (_layoutmanager.default.tv) {
        headerTop.classList.add('headerTop-withSectionTabs', 'headerTop-withSectionTabs-hideTitle');
      } else {
        headerTop.classList.add('headerTop-withSectionTabs');
      }
      headerMiddle.classList.add('headerMiddle-withSectionTabs');
      document.documentElement.classList.add('withHeaderTabs');
      tabOwnerView = view;
      tabsElem = tabsContainerElem.querySelector('[is="emby-tabs"]');
      getTabContainersFn = getTabContainersFn || defaultGetTabContainersFn;
      tabsElem.addEventListener('beforetabchange', function (e) {
        var tabContainers = getTabContainersFn();
        if (e.detail.previousIndex != null) {
          var previousPanel = tabContainers[e.detail.previousIndex];
          if (previousPanel) {
            previousPanel.classList.remove('is-active');
          }
        }
        var newPanel = tabContainers[e.detail.selectedTabIndex];
        if (newPanel) {
          newPanel.classList.add('is-active');
        }
      });
      if (onTabChange) {
        tabsElem.addEventListener('tabchange', onTabChange);
      }
      if (setSelectedIndex !== false) {
        if (tabsElem.selectedIndex) {
          tabsElem.selectedIndex(selectedIndex);
        } else {
          tabsElem.readySelectedIndex = selectedIndex;
          tabsElem.addEventListener('ready', onViewTabsReady);
        }
      }
      return {
        tabsContainer: tabsContainerElem,
        replaced: true
      };
    }
    if (!tabsElem) {
      tabsElem = tabsContainerElem.querySelector('[is="emby-tabs"]');
    }

    // don't call selectedIndex here because it will cause tab onResume to fire twice in tabbedView

    tabOwnerView = view;
    return {
      tabsContainer: tabsContainerElem,
      replaced: false
    };
  }
  function focus() {
    if (!headerMiddle) {
      return null;
    }
    var btn = headerMiddle.querySelector('.emby-tab-button-active');
    if (btn) {
      _focusmanager.default.focus(btn);
      return btn;
    }
    return _focusmanager.default.autoFocus(headerMiddle);
  }
  function selectedTabIndex(index) {
    var tabsContainerElem = headerTabsContainer;
    if (!tabsElem) {
      tabsElem = tabsContainerElem.querySelector('[is="emby-tabs"]');
    }
    if (index != null) {
      tabsElem.selectedIndex(index);
    } else {
      tabsElem.triggerTabChange();
    }
  }
  function getTabsElement() {
    var _headerMiddle;
    return (_headerMiddle = headerMiddle) == null ? void 0 : _headerMiddle.querySelector('.tabs-viewmenubar');
  }
  function setTabVisible(index, visible) {
    var tabsElem = getTabsElement();
    if (!tabsElem) {
      return;
    }
    var btn = tabsElem.querySelector('.main-tab-button[data-index="' + index + '"]');
    if (!btn) {
      return;
    }
    if (visible) {
      btn.classList.remove('hide');
    } else {
      var hasFocus = document.activeElement === btn;
      btn.classList.add('hide');
      if (hasFocus) {
        focus();
      }
    }
  }
  var _default = _exports.default = {
    setTabs: setTabs,
    getTabsElement: getTabsElement,
    selectedTabIndex: selectedTabIndex,
    focus: focus,
    setTabVisible: setTabVisible
  };
});
