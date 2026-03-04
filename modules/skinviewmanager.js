define(["exports"], function (_exports) {
  Object.defineProperty(_exports, "__esModule", {
    value: true
  });
  _exports.default = void 0;
  /* jshint module: true */

  var customRenderRegistry = {};
  var customModuleRegistry = {};
  var customOperationsRegistry = {};
  var skinOptions = {};
  function registerCustomRenderer(rendererId, renderFn) {
    customRenderRegistry[rendererId] = renderFn;
  }
  function registerCustomModule(path, customPath) {
    customModuleRegistry[path] = customPath;
  }
  function registerCustomOperation(operation, fn) {
    customOperationsRegistry[operation] = fn;
  }
  function renderEmpty() {
    return '';
  }
  function getRenderer(rendererId, defaultRenderFn) {
    if (typeof defaultRenderFn === 'string') {
      var str = defaultRenderFn;
      defaultRenderFn = function () {
        return str;
      };
    }
    return customRenderRegistry[rendererId] || defaultRenderFn || renderEmpty;
  }
  function getCustomModulePath(path) {
    return customModuleRegistry[path] || path;
  }
  function adjustTabControllerOptions(instance, options, id) {
    var fn = customOperationsRegistry.adjustTabControllerOptions;
    if (fn) {
      fn(instance, options, id);
    }
  }
  function adjustListOptions(instance, options, settings) {
    var fn = customOperationsRegistry.adjustListOptions;
    if (fn) {
      fn(instance, options, settings);
    }
  }
  function adjustQuery(instance, query) {
    var fn = customOperationsRegistry.adjustQuery;
    if (fn) {
      fn(instance, query);
    }
  }
  function tabbedViewEvent(event, instance, controller) {
    var fn = customOperationsRegistry.tabbedViewEvent;
    if (fn) {
      fn(event, instance, controller);
    }
  }
  function guideInitialRender(instance) {
    var fn = customOperationsRegistry.guideInitialRender;
    if (fn) {
      fn(instance);
    }
  }
  function setSkinOptions(options) {
    skinOptions = options;
  }
  function getSkinOptions() {
    return skinOptions;
  }
  function clearCustomizations() {
    customRenderRegistry = {};
    customModuleRegistry = {};
    customOperationsRegistry = {};
    skinOptions = {};
  }
  var skinViewManager = {
    // A theme calls these to set up customizations
    registerCustomRenderer: registerCustomRenderer,
    registerCustomModule: registerCustomModule,
    registerCustomOperation: registerCustomOperation,
    setSkinOptions: setSkinOptions,
    // These are used at extension points to achieve custom functionality
    getCustomModulePath: getCustomModulePath,
    adjustTabControllerOptions: adjustTabControllerOptions,
    adjustListOptions: adjustListOptions,
    adjustQuery: adjustQuery,
    tabbedViewEvent: tabbedViewEvent,
    guideInitialRender: guideInitialRender,
    getRenderer: getRenderer,
    getSkinOptions: getSkinOptions,
    // SkinManager calls this to clear all customizations on theme switch
    clearCustomizations: clearCustomizations
  };
  var _default = _exports.default = skinViewManager;
});
