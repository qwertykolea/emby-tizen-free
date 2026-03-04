define(["exports", "./browser.js", "./emby-apiclient/events.js", "./common/appsettings.js", "./common/servicelocator.js"], function (_exports, _browser, _events, _appsettings, _servicelocator) {
  Object.defineProperty(_exports, "__esModule", {
    value: true
  });
  _exports.default = void 0;
  /* jshint module: true */

  var currentLayout;
  function setLayout(instance, layout, selectedLayout) {
    if (layout === selectedLayout) {
      instance[layout] = true;
      if (layout === 'tv') {
        document.documentElement.classList.add('layout-' + layout);
      }
    } else {
      instance[layout] = false;
      if (layout === 'tv') {
        document.documentElement.classList.remove('layout-' + layout);
      }
    }
  }
  function LayoutManager() {
    var saved = this.getSavedLayout();
    if (saved) {
      this.setLayout(saved, false);
    } else {
      this.autoLayout();
    }
  }
  LayoutManager.prototype.setLayout = function (layout, save) {
    if (!layout || layout === 'auto') {
      this.autoLayout();
      if (save !== false) {
        _appsettings.default.set('layout', '');
      }
    } else {
      setLayout(this, 'mobile', layout);
      setLayout(this, 'tv', layout);
      setLayout(this, 'desktop', layout);
      if (save !== false) {
        _appsettings.default.set('layout', layout);
      }
      var changed = currentLayout !== layout;
      currentLayout = layout;
      if (changed) {
        _events.default.trigger(this, 'modechange');
      }
    }
  };
  LayoutManager.prototype.getSavedLayout = function () {
    return _appsettings.default.get('layout');
  };
  LayoutManager.prototype.autoLayout = function () {
    // Take a guess at initial layout. The consuming app can override
    this.setLayout(this.getDefaultLayout(), false);
  };
  LayoutManager.prototype.getDefaultLayout = function () {
    if (_servicelocator.appHost.getDefaultLayout) {
      var result = _servicelocator.appHost.getDefaultLayout();
      if (result) {
        return result;
      }
    }
    if (_browser.default.tv) {
      return 'tv';
    }
    var userAgentData = navigator.userAgentData;
    if (userAgentData) {
      if (userAgentData.mobile) {
        return 'mobile';
      }
    }
    if (window.location.href.toString().toLowerCase().includes('operatv.emby')) {
      return 'tv';
    }
    return 'mobile';
  };

  // used by the settings screen
  LayoutManager.prototype.enableTVDisplayMode = function (enabled) {
    if (enabled != null) {
      this.setLayout(enabled ? 'tv' : 'mobile', true);
      return;
    }
    return this.getSavedLayout() === 'tv';
  };
  var _default = _exports.default = new LayoutManager();
});
