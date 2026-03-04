define(["exports"], function (_exports) {
  Object.defineProperty(_exports, "__esModule", {
    value: true
  });
  _exports.default = void 0;
  /* jshint module: true */

  var skinHeaderElement = document.querySelector('.skinHeader');
  function AppHeaderContent() {}
  function onResize() {
    //console.log('header resized');
    this._headerHeight = null;
  }
  AppHeaderContent.prototype.ensureSizeObserver = function () {
    if (this.resizeObserver) {
      return;
    }
    this.resizeObserver = new ResizeObserver(onResize.bind(this), {});
    this.resizeObserver.observe(skinHeaderElement);
  };
  AppHeaderContent.prototype.getHeight = function () {
    var height = this._headerHeight;
    if (height == null) {
      height = skinHeaderElement.offsetHeight;
      //console.log('header height : ' + height);
      if (height) {
        this._headerHeight = height;
      }
      this.ensureSizeObserver();
    }
    return height;
  };
  var _default = _exports.default = new AppHeaderContent();
});
