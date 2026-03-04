define(["exports", "./../emby-apiclient/connectionmanager.js"], function (_exports, _connectionmanager) {
  Object.defineProperty(_exports, "__esModule", {
    value: true
  });
  _exports.default = void 0;
  /* jshint module: true */

  function PhotoScreenSaver() {
    this.name = 'Photo Screen Saver';
    this.type = 'screensaver';
    this.id = 'photoscreensaver';
    this.supportsAnonymous = false;
  }
  function getItems(query) {
    query = Object.assign({
      ImageTypes: "Primary",
      IncludeItemTypes: "Photo",
      SortBy: "Random",
      Recursive: true,
      ImageTypeLimit: 1
    }, query);
    var apiClient = _connectionmanager.default.currentApiClient();
    return apiClient.getItems(apiClient.getCurrentUserId(), query);
  }
  PhotoScreenSaver.prototype.show = function () {
    if (this.currentSlideshow) {
      return;
    }
    var instance = this;
    Emby.importModule('./modules/slideshow/slideshow.js').then(function (slideshow) {
      if (instance.currentSlideshow) {
        return;
      }
      var newSlideShow = new slideshow({
        showTitle: true,
        cover: true,
        getItems: getItems,
        cardFields: ['Name'],
        interactive: false,
        autoplay: true
      });
      newSlideShow.show();
      instance.currentSlideshow = newSlideShow;
    });
  };
  PhotoScreenSaver.prototype.hide = function () {
    var currentSlideshow = this.currentSlideshow;
    if (currentSlideshow) {
      currentSlideshow.hide();
      this.currentSlideshow = null;
    }
  };
  var _default = _exports.default = PhotoScreenSaver;
});
