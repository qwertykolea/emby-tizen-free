define(["exports"], function (_exports) {
  Object.defineProperty(_exports, "__esModule", {
    value: true
  });
  _exports.iapManager = _exports.fullscreenManager = _exports.fileRepository = _exports.cameraUpload = _exports.appStorage = _exports.appLogger = _exports.appHost = _exports.apiClientFactory = void 0;
  _exports.initialize = initialize;
  _exports.wakeOnLan = _exports.userActionRepository = _exports.transferManager = _exports.shell = _exports.serverDiscovery = _exports.localSync = _exports.itemRepository = void 0;
  /* jshint module: true */

  var appStorage;
  var appHost;
  var fullscreenManager;
  var shell;
  var iapManager;
  var wakeOnLan;
  var serverDiscovery;
  var fileRepository;
  var itemRepository;
  var transferManager;
  var userActionRepository;
  var localSync;
  var cameraUpload;
  var appLogger;
  var apiClientFactory;
  function initialize(services) {
    if (services.appStorage) {
      _exports.appStorage = appStorage = services.appStorage;
    }
    if (services.appHost) {
      _exports.appHost = appHost = services.appHost;
    }
    if (services.fullscreenManager) {
      _exports.fullscreenManager = fullscreenManager = services.fullscreenManager;
    }
    if (services.shell) {
      _exports.shell = shell = services.shell;
    }
    if (services.iapManager) {
      _exports.iapManager = iapManager = services.iapManager;
    }
    if (services.wakeOnLan) {
      _exports.wakeOnLan = wakeOnLan = services.wakeOnLan;
    }
    if (services.serverDiscovery) {
      _exports.serverDiscovery = serverDiscovery = services.serverDiscovery;
    }
    if (services.fileRepository) {
      _exports.fileRepository = fileRepository = services.fileRepository;
    }
    if (services.itemRepository) {
      _exports.itemRepository = itemRepository = services.itemRepository;
    }
    if (services.transferManager) {
      _exports.transferManager = transferManager = services.transferManager;
    }
    if (services.userActionRepository) {
      _exports.userActionRepository = userActionRepository = services.userActionRepository;
    }
    if (services.localSync) {
      _exports.localSync = localSync = services.localSync;
    }
    if (services.cameraUpload) {
      _exports.cameraUpload = cameraUpload = services.cameraUpload;
    }
    if (services.apiClientFactory) {
      _exports.apiClientFactory = apiClientFactory = services.apiClientFactory;
    }
    if (services.appLogger) {
      _exports.appLogger = appLogger = services.appLogger;
    }
  }
});
