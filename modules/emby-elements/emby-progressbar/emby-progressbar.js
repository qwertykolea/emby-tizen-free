define(["exports"], function (_exports) {
  Object.defineProperty(_exports, "__esModule", {
    value: true
  });
  _exports.default = void 0;
  /* jshint module: true */

  function onAutoTimeProgress() {
    var start = parseInt(this.getAttribute('data-starttime'));
    var end = parseInt(this.getAttribute('data-endtime'));
    var now = Date.now();
    var total = end - start;
    var pct = 100 * ((now - start) / total);
    pct = Math.min(100, pct);
    pct = Math.max(0, pct);
    var itemProgressBarForeground = this.querySelector('.itemProgressBarForeground');
    itemProgressBarForeground.style.width = pct + '%';
  }
  var EmbyProgressBar = /*#__PURE__*/function (_HTMLDivElement) {
    function EmbyProgressBar() {
      var _this;
      // address the upgraded instance and use it
      var self = _this = _HTMLDivElement.call(this) || this;
      return babelHelpers.possibleConstructorReturn(_this, self);
    }
    babelHelpers.inherits(EmbyProgressBar, _HTMLDivElement);
    return babelHelpers.createClass(EmbyProgressBar, [{
      key: "connectedCallback",
      value: function connectedCallback() {
        if (this.timeInterval) {
          clearInterval(this.timeInterval);
        }
        if (this.getAttribute('data-automode') === 'time') {
          this.timeInterval = setInterval(onAutoTimeProgress.bind(this), 60000);
        }
      }
    }, {
      key: "disconnectedCallback",
      value: function disconnectedCallback() {
        if (this.timeInterval) {
          clearInterval(this.timeInterval);
          this.timeInterval = null;
        }
      }
    }]);
  }(/*#__PURE__*/babelHelpers.wrapNativeSuper(HTMLDivElement));
  customElements.define('emby-progressbar', EmbyProgressBar, {
    extends: 'div'
  });
  var _default = _exports.default = EmbyProgressBar;
});
