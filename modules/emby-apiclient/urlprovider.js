define(["exports", "./../emby-apiclient/connectionmanager.js"], function (_exports, _connectionmanager) {
  Object.defineProperty(_exports, "__esModule", {
    value: true
  });
  _exports.default = void 0;
  /* jshint module: true */

  // Provides url generation for images

  function UrlProvider() {
    this.getImageUrl = function (serverId, itemId, options) {
      var item = {
        ServerId: serverId
      };
      return _connectionmanager.default.getApiClient(item).getImageUrl(itemId, options);
    };
    this.getSeriesImageUrl = function (item, options) {
      var _this$getSeriesImageU;
      return (_this$getSeriesImageU = this.getSeriesImageUrlInfo(item, options)) == null ? void 0 : _this$getSeriesImageU.url;
    };
    this.getSeriesImageUrlInfo = function (item, options) {
      if (!item) {
        throw new Error('item cannot be null!');
      }
      if (item.Type !== 'Episode') {
        return null;
      }
      if (!options) {
        options = {};
      }
      options.type = options.type || "Primary";
      if (options.type === 'Primary') {
        if (item.SeriesPrimaryImageTag) {
          options.tag = item.SeriesPrimaryImageTag;
          return {
            url: _connectionmanager.default.getApiClient(item).getImageUrl(item.SeriesId, options),
            aspect: '2/3'
          };
        }
      }
      if (options.type === 'Thumb') {
        if (item.ParentThumbImageTag) {
          options.tag = item.ParentThumbImageTag;
          return {
            url: _connectionmanager.default.getApiClient(item).getImageUrl(item.ParentThumbItemId, options),
            aspect: '16/9'
          };
        }
      }
      return null;
    };
    this.getImageUrl = function (item, options) {
      var _this$getImageUrlInfo;
      return (_this$getImageUrlInfo = this.getImageUrlInfo(item, options)) == null ? void 0 : _this$getImageUrlInfo.url;
    };
    this.getImageUrlInfo = function (item, options) {
      if (!item) {
        throw new Error('item cannot be null!');
      }
      if (!options) {
        options = {};
      }
      options.type = options.type || "Primary";
      if (item.ImageTags && item.ImageTags[options.type]) {
        options.tag = item.ImageTags[options.type];
        return {
          url: _connectionmanager.default.getApiClient(item).getImageUrl(item.PrimaryImageItemId || item.Id, options),
          aspect: item.PrimaryImageAspectRatio ? item.PrimaryImageAspectRatio.toString() : '1'
        };
      }
      if (item.AlbumId && item.AlbumPrimaryImageTag) {
        options.tag = item.AlbumPrimaryImageTag;
        return {
          url: _connectionmanager.default.getApiClient(item).getImageUrl(item.AlbumId, options),
          aspect: '1'
        };
      }
      return null;
    };
  }
  var _default = _exports.default = new UrlProvider();
});
