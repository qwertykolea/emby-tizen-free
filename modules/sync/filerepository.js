define(["exports"], function (_exports) {
  Object.defineProperty(_exports, "__esModule", {
    value: true
  });
  _exports.default = void 0;
  /* jshint module: true */

  var PathSeparator = '/';
  function getValidFileName(path) {
    return path;
  }
  function getFullLocalPath(pathArray) {
    return pathArray.join(PathSeparator);
  }
  function getFullMetadataPath(pathArray) {
    return pathArray.join(PathSeparator);
  }
  function getParentPath(path) {
    var pathArray = path.split(PathSeparator);
    if (pathArray.length === 0) {
      return null;
    }
    pathArray = pathArray.slice(0, pathArray.length - 1);
    return pathArray.join(PathSeparator);
  }
  function combinePath(path1, path2) {
    if (path1.endsWith(PathSeparator)) {
      path1 = path1.substr(0, path1.length - 1);
    }
    if (path2.startsWith(PathSeparator)) {
      path2 = path2.substr(1);
    }
    return path1 + PathSeparator + path2;
  }
  function deleteFile(path) {
    return Promise.resolve();
  }
  function deleteDirectory(path) {
    return Promise.resolve();
  }
  function fileExists(path) {
    return Promise.resolve();
  }
  function getItemFileSize(path) {
    return Promise.resolve(0);
  }
  function getImageUrl(pathParts) {
    return pathParts.join(PathSeparator);
  }
  var _default = _exports.default = {
    getValidFileName: getValidFileName,
    getFullLocalPath: getFullLocalPath,
    getFullMetadataPath: getFullMetadataPath,
    getParentPath: getParentPath,
    combinePath: combinePath,
    deleteFile: deleteFile,
    deleteDirectory: deleteDirectory,
    fileExists: fileExists,
    getItemFileSize: getItemFileSize,
    getImageUrl: getImageUrl
  };
});
