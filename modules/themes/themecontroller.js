define(["exports", "./../approuter.js", "./../emby-apiclient/events.js", "./../layoutmanager.js", "./../common/usersettings/usersettings.js"], function (_exports, _approuter, _events, _layoutmanager, _usersettings) {
  Object.defineProperty(_exports, "__esModule", {
    value: true
  });
  _exports.default = void 0;
  /* jshint module: true */

  function ThemeController() {}
  function onInitRouteRequest(e, routeRequest) {
    if (routeRequest.path === '/home') {
      if (_layoutmanager.default.tv && _usersettings.default.tvHome() === 'horizontal') {
        routeRequest.controller = 'home_horiz/home.js';
        routeRequest.contentPath = '/home_horiz/home.html';
        routeRequest.adjustHeaderForEmbeddedScroll = false;
      } else {
        routeRequest.controller = 'home/home.js';
        routeRequest.contentPath = '/home/home.html';
        routeRequest.adjustHeaderForEmbeddedScroll = true;
      }
    }
  }
  ThemeController.prototype.load = function () {
    _events.default.on(_approuter.default, 'initrouterequest', onInitRouteRequest);
    return Promise.resolve();
  };
  ThemeController.prototype.hasSettings = function () {
    return false;
  };
  ThemeController.prototype.showSettings = function () {
    return Promise.resolve();
  };

  // themes can implement this if needed
  //ThemeController.prototype.showBackMenu = function () {

  //    return Promise.resolve();
  //};

  // themes can implement this if needed
  //ThemeController.prototype.showBackMenu = function () {

  //    return null;
  //};

  ThemeController.prototype.destroy = function () {
    _events.default.off(_approuter.default, 'initrouterequest', onInitRouteRequest);
  };
  var _default = _exports.default = ThemeController;
});
