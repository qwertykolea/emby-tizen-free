define(["exports", "./../servicelocator.js", "./../usersettings/usersettings.js"], function (_exports, _servicelocator, _usersettings) {
  Object.defineProperty(_exports, "__esModule", {
    value: true
  });
  _exports.default = void 0;
  /* jshint module: true */

  // https://stackoverflow.com/questions/6117814/get-week-of-year-in-javascript-like-in-php
  function getWeek(date) {
    var d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
    var dayNum = d.getUTCDay() || 7;
    d.setUTCDate(d.getUTCDate() + 4 - dayNum);
    var yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    return Math.ceil(((d - yearStart) / 86400000 + 1) / 7);
  }
  function getResolvedPromise() {
    return Promise.resolve();
  }
  function showAlert(options) {
    return Emby.importModule('./modules/common/dialogs/alert.js').then(function (alert) {
      return alert(options);
    });
  }
  function showMessage(text, userSettingsKey, appHostFeature) {
    if (_servicelocator.appHost.supports(appHostFeature)) {
      return Promise.resolve();
    }
    var now = new Date();
    userSettingsKey += now.getFullYear() + '-w' + getWeek(now);
    if (_usersettings.default.get(userSettingsKey, false) === '1') {
      return Promise.resolve();
    }
    _usersettings.default.set(userSettingsKey, '1', false);
    return showAlert(text).catch(getResolvedPromise);
  }
  function showBlurayMessage() {
    var message = 'Playback of Bluray folders in this app is experimental. Some titles may not work at all. For a better experience, consider converting to mkv video files, or use an Emby app with native Bluray folder support.';
    return showMessage(message, 'blurayexpirementalinfo', 'nativeblurayplayback');
  }
  function showDvdMessage() {
    var message = 'Playback of Dvd folders in this app is experimental. Some titles may not work at all. For a better experience, consider converting to mkv video files, or use an Emby app with native Dvd folder support.';
    return showMessage(message, 'dvdexpirementalinfo', 'nativedvdplayback');
  }
  function showIsoMessage() {
    var message = 'Playback of ISO files in this app is experimental. Some titles may not work at all. For a better experience, consider converting to mkv video files, or use an Emby app with native ISO support.';
    return showMessage(message, 'isoexpirementalinfo', 'nativeisoplayback');
  }
  function ExpirementalPlaybackWarnings() {
    this.name = 'Experimental playback warnings';
    this.type = 'preplayintercept';
    this.id = 'expirementalplaybackwarnings';
  }
  ExpirementalPlaybackWarnings.prototype.intercept = function (options) {
    var item = options.item;
    if (!item) {
      return Promise.resolve();
    }
    if (item.Container === 'iso' || item.Container === 'blurayiso' || item.Container === 'dvdiso') {
      return showIsoMessage();
    }
    if (item.Container === 'bluray') {
      return showBlurayMessage();
    }
    if (item.Container === 'dvd') {
      return showDvdMessage();
    }
    return Promise.resolve();
  };
  var _default = _exports.default = ExpirementalPlaybackWarnings;
});
