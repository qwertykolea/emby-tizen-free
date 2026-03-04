define(["exports", "./servicelocator.js", "./../emby-apiclient/events.js"], function (_exports, _servicelocator, _events) {
  Object.defineProperty(_exports, "__esModule", {
    value: true
  });
  _exports.default = void 0;
  /* jshint module: true */

  function onAppResume() {
    var started = this.isStarted();
    this.stopInterval();
    if (started) {
      var lastInterval = this._lastInterval;
      if (lastInterval) {
        var options = this.options;
        if (options) {
          if (lastInterval + options.timeoutMs <= Date.now()) {
            onInterval.call(this);
          }
        }
      }
      this.startInterval();
    }
  }
  function onInterval() {
    this._lastInterval = Date.now();
    var options = this.options;
    if (options) {
      options.onInterval();
    }
  }
  function MethodTimer(options) {
    this.options = options;
    this.boundOnAppResume = onAppResume.bind(this);
    this.boundOnInterval = onInterval.bind(this);
    _events.default.on(_servicelocator.appHost, 'resume', this.boundOnAppResume);
    this.startInterval();
  }
  MethodTimer.prototype.stopInterval = function () {
    if (this._interval) {
      if (this._intervalType === 'interval') {
        clearInterval(this._interval);
      } else {
        clearTimeout(this._interval);
      }
      this._interval = null;
      this._intervalType = null;
    }
  };
  MethodTimer.prototype.startInterval = function () {
    this._lastInterval = Date.now();
    if (this.options.type === 'interval') {
      this._interval = setInterval(this.boundOnInterval, this.options.timeoutMs);
      this._intervalType = 'interval';
    } else {
      this._interval = setTimeout(this.boundOnInterval, this.options.timeoutMs);
    }
  };
  MethodTimer.prototype.isStarted = function () {
    return this._interval != null;
  };
  MethodTimer.prototype.destroy = function () {
    this.options = null;
    if (this.boundOnAppResume) {
      _events.default.off(_servicelocator.appHost, 'resume', this.boundOnAppResume);
      this.boundOnAppResume = null;
    }
    this.stopInterval();
    this.boundOnInterval = null;
    this._lastInterval = null;
  };
  var _default = _exports.default = MethodTimer;
});
