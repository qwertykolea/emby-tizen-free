define(["exports", "./../common/servicelocator.js"], function (_exports, _servicelocator) {
  Object.defineProperty(_exports, "__esModule", {
    value: true
  });
  _exports.default = void 0;
  /* jshint module: true */

  function removeLocalItem(localItem) {
    return _servicelocator.itemRepository.getLibraryItem(localItem.ServerId, localItem.ItemId).then(function (item) {
      var onFileDeletedSuccessOrFail = function () {
        return _servicelocator.itemRepository.deleteLibraryItem(localItem.ServerId, localItem.ItemId);
      };
      var p = Promise.resolve();
      if (item.LocalPath) {
        p = p.then(function () {
          return _servicelocator.fileRepository.deleteFile(item.LocalPath);
        });
      }
      if (item) {
        if (item.Item && item.Item.MediaSources) {
          item.Item.MediaSources.forEach(function (mediaSource) {
            if (mediaSource.MediaStreams && mediaSource.MediaStreams.length > 0) {
              mediaSource.MediaStreams.forEach(function (mediaStream) {
                if (mediaStream.Path) {
                  p = p.then(function () {
                    return _servicelocator.fileRepository.deleteFile(mediaStream.Path);
                  });
                }
              });
            }
          });
        }
      }
      return p.then(onFileDeletedSuccessOrFail, onFileDeletedSuccessOrFail);
    }, function () {
      return Promise.resolve();
    });
  }
  function getSubtitleSaveFileName(localItem, mediaPath, language, isForced, isHearingImpaired, format) {
    var name = getNameWithoutExtension(mediaPath);
    name = _servicelocator.fileRepository.getValidFileName(name);
    if (language) {
      name += "." + language.toLowerCase();
    }
    if (isForced) {
      name += ".forced";
    }
    if (isHearingImpaired) {
      name += ".sdh";
    }
    name = name + "." + format.toLowerCase();
    var mediaFolder = _servicelocator.fileRepository.getParentPath(localItem.LocalPath);
    var subtitleFileName = _servicelocator.fileRepository.combinePath(mediaFolder, name);
    return subtitleFileName;
  }
  function getItemFileSize(path) {
    return _servicelocator.fileRepository.getItemFileSize(path);
  }
  function getNameWithoutExtension(path) {
    var fileName = path;
    var pos = fileName.lastIndexOf(".");
    if (pos > 0) {
      fileName = fileName.substring(0, pos);
    }
    return fileName;
  }
  function downloadFile(url, localItem) {
    var imageUrl = getImageUrl(localItem.Item.ServerId, localItem.Item.Id, {
      type: 'Primary',
      index: 0
    });
    return _servicelocator.transferManager.downloadFile(url, localItem, imageUrl);
  }
  function downloadSubtitles(url, fileName) {
    return _servicelocator.transferManager.downloadSubtitles(url, fileName);
  }
  function getImageUrl(serverId, itemId, imageOptions) {
    var imageType = imageOptions.type;
    var index = imageOptions.index;
    var pathArray = getImagePath(serverId, itemId, imageType, index);
    return _servicelocator.fileRepository.getImageUrl(pathArray);
  }
  function hasImage(serverId, itemId, imageType, index) {
    var pathArray = getImagePath(serverId, itemId, imageType, index);
    var localFilePath = _servicelocator.fileRepository.getFullMetadataPath(pathArray);
    return _servicelocator.fileRepository.fileExists(localFilePath).then(function (exists) {
      // TODO: Maybe check for broken download when file size is 0 and item is not queued
      ////if (exists) {
      ////    if (!transferManager.isDownloadFileInQueue(localFilePath)) {
      ////        // If file exists but
      ////        exists = false;
      ////    }
      ////}

      return Promise.resolve(exists);
    }, function () {
      return Promise.resolve(false);
    });
  }
  function fileExists(localFilePath) {
    return _servicelocator.fileRepository.fileExists(localFilePath);
  }
  function downloadImage(localItem, url, serverId, itemId, imageType, index) {
    var localPathParts = getImagePath(serverId, itemId, imageType, index);
    return _servicelocator.transferManager.downloadImage(url, localPathParts);
  }
  function isDownloadFileInQueue(path) {
    return _servicelocator.transferManager.isDownloadFileInQueue(path);
  }
  function getDownloadItemCount() {
    return _servicelocator.transferManager.getDownloadItemCount();
  }

  // Helpers ***********************************************************

  function getDirectoryPath(item) {
    var parts = [];
    var itemtype = item.Type.toLowerCase();
    var mediaType = (item.MediaType || '').toLowerCase();
    if (itemtype === 'episode' || itemtype === 'series' || itemtype === 'season') {
      parts.push("TV");
    } else if (itemtype === 'trailer') {
      parts.push("Trailers");
    } else if (mediaType === 'video') {
      parts.push("Videos");
    } else if (itemtype === 'audio' || itemtype === 'musicalbum' || itemtype === 'musicartist') {
      parts.push("Music");
    } else if (itemtype === 'photo' || itemtype === 'photoalbum') {
      parts.push("Photos");
    } else if (itemtype === 'game' || itemtype === 'gamesystem') {
      parts.push("Games");
    }
    var albumArtist = item.AlbumArtist;
    if (albumArtist) {
      parts.push(albumArtist);
    }
    var seriesName = item.SeriesName;
    if (seriesName) {
      parts.push(seriesName);
    }
    var seasonName = item.SeasonName;
    if (seasonName) {
      parts.push(seasonName);
    }
    if (item.Album) {
      parts.push(item.Album);
    }
    if (item.GameSystem) {
      parts.push(item.GameSystem);
    }
    if (mediaType === 'video' && itemtype !== 'episode' || itemtype === 'game' || item.IsFolder) {
      parts.push(item.Name);
    }
    var finalParts = [];
    for (var i = 0; i < parts.length; i++) {
      finalParts.push(_servicelocator.fileRepository.getValidFileName(parts[i]));
    }
    return finalParts;
  }
  function getImagePath(serverId, itemId, imageType, index) {
    var parts = [];
    parts.push('images');
    index = index || 0;
    // Store without extension. This allows mixed image types since the browser will
    // detect the type from the content
    parts.push(itemId + '_' + imageType + '_' + index.toString()); // + '.jpg');

    var finalParts = [];
    for (var i = 0; i < parts.length; i++) {
      finalParts.push(parts[i]);
    }
    return finalParts;
  }
  function getLocalFileName(item, originalFileName) {
    var filename = originalFileName || item.Name;
    return _servicelocator.fileRepository.getValidFileName(filename);
  }
  function resyncTransfers() {
    return _servicelocator.transferManager.resyncTransfers();
  }
  function enableBackgroundCompletion() {
    return _servicelocator.transferManager.enableBackgroundCompletion;
  }
  var _default = _exports.default = {
    getDirectoryPath: getDirectoryPath,
    getLocalFileName: getLocalFileName,
    removeLocalItem: removeLocalItem,
    downloadFile: downloadFile,
    downloadSubtitles: downloadSubtitles,
    hasImage: hasImage,
    downloadImage: downloadImage,
    getImageUrl: getImageUrl,
    getSubtitleSaveFileName: getSubtitleSaveFileName,
    getItemFileSize: getItemFileSize,
    isDownloadFileInQueue: isDownloadFileInQueue,
    getDownloadItemCount: getDownloadItemCount,
    resyncTransfers: resyncTransfers,
    fileExists: fileExists,
    enableBackgroundCompletion: enableBackgroundCompletion
  };
});
