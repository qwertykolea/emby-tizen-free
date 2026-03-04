define(["exports", "./../globalize.js", "./../../actionsheet/actionsheet.js", "./playbackmanager.js", "./../dataformatter.js"], function (_exports, _globalize, _actionsheet, _playbackmanager, _dataformatter) {
  Object.defineProperty(_exports, "__esModule", {
    value: true
  });
  _exports.default = void 0;
  /* jshint module: true */

  function showToast(options) {
    return Emby.importModule('./modules/toast/toast.js').then(function (toast) {
      return toast(options);
    });
  }
  function getMs(minutes) {
    return minutes * 60 * 1000;
  }
  function show(options) {
    var player = options.player;
    var menuItems = [];
    var currentMode = _playbackmanager.default.getSleepTimerMode(player);
    if (currentMode && currentMode !== 'None') {
      menuItems.push({
        name: _globalize.default.translate('TurnOffTimer'),
        id: 'stoptimer'
      });
    }
    menuItems.push({
      name: _globalize.default.translate('AfterCurrentItem'),
      id: 'afteritem'
    });
    var now = Date.now();
    var increments = [
    // for testing
    //getMs(0.25),

    getMs(5), getMs(10), getMs(15), getMs(20), getMs(30), getMs(45), getMs(60),
    //getMs(90),
    getMs(120), getMs(180), getMs(240)];
    for (var i = 0, length = increments.length; i < length; i++) {
      var time = now + increments[i];
      var date = new Date(time);
      menuItems.push({
        name: _dataformatter.default.formatRelativeTime(date, false),
        id: time
      });
    }
    return _actionsheet.default.show({
      items: menuItems,
      positionTo: options.positionTo,
      positionX: options.positionX,
      positionY: options.positionY,
      transformOrigin: options.transformOrigin,
      noTextWrap: options.noTextWrap,
      title: _globalize.default.translate('HeaderStopPlayback'),
      hasItemSelectionState: false
    }).then(function (result) {
      switch (result) {
        case 'afteritem':
          _playbackmanager.default.setSleepTimer({
            sleepTimerMode: 'AfterItem'
          }, player);
          showToast({
            text: _globalize.default.translate('SleepTimerIsSet'),
            icon: '&#xe5ca;'
          });
          break;
        case 'stoptimer':
          _playbackmanager.default.setSleepTimer({
            sleepTimerMode: 'None'
          }, player);
          showToast({
            text: _globalize.default.translate('SleepTimerIsOff'),
            icon: '&#xe426;'
          });
          break;
        default:
          var _time = parseInt(result);
          if (_time && !isNaN(_time)) {
            _playbackmanager.default.setSleepTimer({
              sleepTimerMode: 'AtTime',
              sleepTimerEndTime: new Date(_time)
            }, player);
            showToast({
              text: _globalize.default.translate('SleepTimerIsSet'),
              icon: '&#xe425;'
            });
          }
          break;
      }
    });
  }
  var _default = _exports.default = {
    show: show
  };
});
