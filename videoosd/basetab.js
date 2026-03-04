define(["exports", "./../modules/emby-apiclient/connectionmanager.js", "./../modules/emby-apiclient/events.js"], function (_exports, _connectionmanager, _events) {
  Object.defineProperty(_exports, "__esModule", {
    value: true
  });
  _exports.default = void 0;
  /* jshint module: true */

  function BaseTab(view) {
    this.view = view;
  }
  BaseTab.prototype.loadTemplate = function () {
    return Promise.resolve();
  };
  BaseTab.prototype.onResume = function (options) {
    if (!options.refresh) {
      var currentOptions = this.currentOptions;
      if (currentOptions) {
        if (options.displayItem !== currentOptions.displayItem || options.item !== currentOptions.item) {
          options.refresh = true;
        }
      }
    }
    if (this.needsRefresh) {
      options.refresh = true;
    }
    this.currentOptions = options;
    this.apiClient = _connectionmanager.default.getApiClient(options.item);
    this.paused = false;
    if (this.templateLoaded) {
      return Promise.resolve();
    }
    var instance = this;
    return this.loadTemplate().then(function () {
      instance.templateLoaded = true;
    });
  };
  BaseTab.prototype.onPause = function () {
    this.paused = true;
  };
  BaseTab.prototype.onTimeUpdate = function (positionTicks, runtimeTicks) {
    this.positionTicks = positionTicks;
  };
  BaseTab.prototype.onItemUpdated = function (options) {
    this.currentOptions = options;
    if (this.paused) {
      this.needsRefresh = true;
      return;
    }
    this.refreshItem();
  };
  BaseTab.prototype.refreshItem = function () {
    this.needsRefresh = false;
  };
  BaseTab.prototype.closeTab = function () {
    _events.default.trigger(this, 'closerequested');
  };
  BaseTab.prototype.destroy = function () {
    this.paused = null;
    this.view = null;
    this.currentOptions = null;
    this.apiClient = null;
    this.templateLoaded = null;
    this.positionTicks = null;
  };
  var _default = _exports.default = BaseTab;
});
