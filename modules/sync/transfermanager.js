define(["exports"], function (_exports) {
  Object.defineProperty(_exports, "__esModule", {
    value: true
  });
  _exports.default = void 0;
  /* jshint module: true */

  function downloadFile(url, folder, localItem, imageUrl) {
    return Promise.reject();
  }
  function downloadSubtitles(url, folder, fileName) {
    return Promise.reject();
  }
  function downloadImage(url, folder, fileName) {
    return Promise.reject();
  }
  function resyncTransfers() {
    return Promise.resolve();
  }
  function getDownloadItemCount() {
    return Promise.resolve(0);
  }
  function isDownloadFileInQueue(filePath) {
    return Promise.resolve(false);
  }
  var _default = _exports.default = {
    downloadFile: downloadFile,
    downloadSubtitles: downloadSubtitles,
    downloadImage: downloadImage,
    resyncTransfers: resyncTransfers,
    getDownloadItemCount: getDownloadItemCount,
    isDownloadFileInQueue: isDownloadFileInQueue,
    enableBackgroundCompletion: true
  };
});
