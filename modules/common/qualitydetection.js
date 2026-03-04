define(["exports"], function (_exports) {
  Object.defineProperty(_exports, "__esModule", {
    value: true
  });
  _exports.default = void 0;
  /* jshint module: true */
  function supportsConnectionTypeDetection() {
    if (typeof navigator !== 'undefined') {
      var connection = navigator.connection;
      if (connection) {
        var connectionType = connection.type;

        // if connection.type is supported
        if (connectionType || typeof connectionType !== 'undefined') {
          return true;
        }
        var effectiveType = connection.effectiveType;
        if (effectiveType === 'slow-2g' || effectiveType === '2g' || effectiveType === '3g') {
          return true;
        }
      }
    }
    return false;
  }
  function getNavigatorMaxBandwidth() {
    if (typeof navigator === 'undefined') {
      return null;
    }
    var connection = navigator.connection;
    if (connection) {
      var downlink = connection.downlink;
      if (downlink && downlink > 0 && downlink < Number.POSITIVE_INFINITY) {
        downlink *= 1000000;
        downlink *= 0.7;
        downlink = parseInt(downlink);
        return downlink;
      }
      downlink = connection.downlinkMax;
      if (downlink && downlink > 0 && downlink < Number.POSITIVE_INFINITY) {
        downlink *= 1000000;
        downlink *= 0.7;
        downlink = parseInt(downlink);
        return downlink;
      }
    }
    return null;
  }
  function getDefaultQuality(networkType) {
    switch (networkType) {
      case 'wan':
        return getNavigatorMaxBandwidth() || (supportsConnectionTypeDetection() ? 12000000 : 4000002);
      case 'cellular':
        // the one is for 720p
        return 1000001;
      default:
        return 200000000;
    }
  }
  var _default = _exports.default = {
    supportsConnectionTypeDetection: supportsConnectionTypeDetection,
    getDefaultQuality: getDefaultQuality
  };
});
