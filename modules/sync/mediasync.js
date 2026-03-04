define(["exports", "./../common/servicelocator.js", "./../localdatabase/localassetmanager.js"], function (_exports, _servicelocator, _localassetmanager) {
  Object.defineProperty(_exports, "__esModule", {
    value: true
  });
  _exports.default = void 0;
  /* jshint module: true */

  var MaxBackdrops = 1;
  function processDownloadStatus(apiClient, options) {
    console.log('[mediasync] Begin processDownloadStatus');
    return _localassetmanager.default.resyncTransfers().then(function () {
      var searchStati = ['transferring', 'queued'];
      return _servicelocator.itemRepository.getLibraryItemsBySyncStatus(apiClient.serverId(), searchStati).then(function (items) {
        console.log('[mediasync] Begin processDownloadStatus getLibraryItemsBySyncStatus completed');
        var p = Promise.resolve();
        var cnt = 0;
        items.forEach(function (item) {
          p = p.then(function () {
            return reportTransfer(apiClient, item);
          });
          cnt++;
        });
        return p.then(function () {
          console.log('[mediasync] Exit processDownloadStatus. Items reported: ' + cnt.toString());
          return Promise.resolve();
        });
      });
    });
  }
  function reportTransfer(apiClient, item) {
    return _localassetmanager.default.getItemFileSize(item.LocalPath).then(function (size) {
      // The background transfer service on Windows leaves the file empty (size = 0) until it 
      // has been downloaded completely
      if (size > 0) {
        return apiClient.reportSyncJobItemTransferred(item.SyncJobItemId).then(function () {
          item.SyncStatus = 'synced';
          console.log('[mediasync] reportSyncJobItemTransferred called for ' + item.LocalPath);
          return _servicelocator.itemRepository.updateLibraryItem(item.ServerId, item.Id, item).then(function () {
            return downloadParentItems(apiClient, item.Item);
          });
        }, function (error) {
          console.error('[mediasync] Mediasync error on reportSyncJobItemTransferred', error);
          item.SyncStatus = 'error';
          return _servicelocator.itemRepository.updateLibraryItem(item.ServerId, item.Id, item);
        });
      } else {
        return _localassetmanager.default.isDownloadFileInQueue(item.LocalPath).then(function (result) {
          if (result) {
            // just wait for completion
            return Promise.resolve();
          }
          console.log('[mediasync] reportTransfer: Size is 0 and download no longer in queue. Setting item as failed.');
          item.SyncStatus = 'error';
          return _servicelocator.itemRepository.updateLibraryItem(item.ServerId, item.Id, item);
        });
      }
    }, function (error) {
      console.error('[mediasync] reportTransfer: error on getItemFileSize. Deleting item.', error);
      return _localassetmanager.default.removeLocalItem(item).then(function () {
        console.log('[mediasync] reportTransfer: Item deleted.');
        return Promise.resolve();
      }, function (err2) {
        console.log('[mediasync] reportTransfer: Failed to delete item.', err2);
        return Promise.resolve();
      });
    });
  }
  function mapToId(userAction) {
    return userAction.Id;
  }
  function reportOfflineActions(apiClient) {
    console.log('[mediasync] Begin reportOfflineActions');
    return _servicelocator.userActionRepository.getByServerId(apiClient.serverId()).then(function (actions) {
      if (!actions.length) {
        console.log('[mediasync] Exit reportOfflineActions (no actions)');
        return Promise.resolve();
      }
      return apiClient.reportOfflineActions(actions).then(function () {
        return _servicelocator.userActionRepository.deleteUserActions(actions.map(mapToId)).then(function () {
          console.log('[mediasync] Exit reportOfflineActions (actions reported and deleted.)');
          return Promise.resolve();
        });
      }, function (err) {
        // delete those actions even on failure, because if the error is caused by 
        // the action data itself, this could otherwise lead to a situation that 
        // never gets resolved
        console.error('[mediasync] error on apiClient.reportOfflineActions: ' + err.toString());
        return _servicelocator.userActionRepository.deleteUserActions(actions.map(mapToId));
      });
    });
  }
  function syncData(apiClient) {
    console.log('[mediasync] Begin syncData');
    var searchStati = ['synced', 'error'];
    return _servicelocator.itemRepository.getLibraryItemsBySyncStatus(apiClient.serverId(), searchStati).then(function (items) {
      var request = {
        TargetId: apiClient.deviceId(),
        LocalItemIds: items.map(function (xitem) {
          return xitem.ItemId;
        })
      };
      return apiClient.syncData(request).then(function (result) {
        return afterSyncData(apiClient, result).then(function () {
          console.log('[mediasync] Exit syncData');
          return Promise.resolve();
        }, function (err) {
          console.error('[mediasync] Error in syncData: ' + err.toString());
          return Promise.resolve();
        });
      });
    });
  }
  function filterDistinct(value, index, self) {
    return self.indexOf(value) === index;
  }
  function removeObsoleteContainerItems(serverId) {
    return _servicelocator.itemRepository.getAllLibraryItems(serverId).then(function (items) {
      var seriesItems = items.filter(function (item) {
        var type = (item.Item.Type || '').toLowerCase();
        return type === 'series';
      });
      var seasonItems = items.filter(function (item) {
        var type = (item.Item.Type || '').toLowerCase();
        return type === 'season';
      });
      var albumItems = items.filter(function (item) {
        var type = (item.Item.Type || '').toLowerCase();
        return type === 'musicalbum' || type === 'photoalbum';
      });
      var requiredSeriesIds = items.filter(function (item) {
        var type = (item.Item.Type || '').toLowerCase();
        return type === 'episode';
      }).map(function (item2) {
        return item2.Item.SeriesId;
      }).filter(filterDistinct);
      var requiredSeasonIds = items.filter(function (item) {
        var type = (item.Item.Type || '').toLowerCase();
        return type === 'episode';
      }).map(function (item2) {
        return item2.Item.SeasonId;
      }).filter(filterDistinct);
      var requiredAlbumIds = items.filter(function (item) {
        var type = (item.Item.Type || '').toLowerCase();
        return type === 'audio' || type === 'photo';
      }).map(function (item2) {
        return item2.Item.AlbumId;
      }).filter(filterDistinct);
      var obsoleteItems = [];
      seriesItems.forEach(function (item) {
        if (requiredSeriesIds.indexOf(item.Item.Id) < 0) {
          obsoleteItems.push(item);
        }
      });
      seasonItems.forEach(function (item) {
        if (requiredSeasonIds.indexOf(item.Item.Id) < 0) {
          obsoleteItems.push(item);
        }
      });
      albumItems.forEach(function (item) {
        if (requiredAlbumIds.indexOf(item.Item.Id) < 0) {
          obsoleteItems.push(item);
        }
      });
      var p = Promise.resolve();
      obsoleteItems.forEach(function (item) {
        p = p.then(function () {
          return _servicelocator.itemRepository.deleteLibraryItem(item.ServerId, item.ItemId);
        });
      });
      return p;
    });
  }
  function afterSyncData(apiClient, syncDataResult) {
    console.log('[mediasync] Begin afterSyncData');
    var p = Promise.resolve();
    if (syncDataResult.ItemIdsToRemove && syncDataResult.ItemIdsToRemove.length > 0) {
      syncDataResult.ItemIdsToRemove.forEach(function (itemId) {
        p = p.then(function () {
          return removeLocalItem(itemId, apiClient.serverId());
        });
      });
    }
    p = p.then(function () {
      console.log('[mediasync] Begin removeObsoleteContainerItems');
      return removeObsoleteContainerItems(apiClient.serverId());
    });
    return p.then(function () {
      console.log('[mediasync] Exit afterSyncData');
      return Promise.resolve();
    });
  }
  function removeLocalItem(itemId, serverId) {
    console.log('[mediasync] Begin removeLocalItem');
    return _servicelocator.itemRepository.getLibraryItem(serverId, itemId).then(function (item) {
      if (item) {
        return _localassetmanager.default.removeLocalItem(item);
      }
      return Promise.resolve();
    }, function (err2) {
      console.error('[mediasync] removeLocalItem: Failed: ', err2);
      return Promise.resolve();
    });
  }
  function getNewMedia(apiClient, downloadCount) {
    console.log('[mediasync] Begin getNewMedia');
    return apiClient.getReadySyncItems(apiClient.deviceId()).then(function (jobItems) {
      console.log('[mediasync] getReadySyncItems returned ' + jobItems.length + ' items');
      var p = Promise.resolve();
      var maxDownloads = 10;
      var currentCount = downloadCount;
      jobItems.forEach(function (jobItem) {
        if (currentCount++ <= maxDownloads) {
          p = p.then(function () {
            return getNewItem(jobItem, apiClient);
          });
        }
      });
      return p.then(function () {
        console.log('[mediasync] Exit getNewMedia');
        return Promise.resolve();
      });
    }, function (err) {
      console.error('[mediasync] getReadySyncItems: Failed: ', err);
      return Promise.resolve();
    });
  }
  function afterMediaDownloaded(apiClient, jobItem, localItem) {
    console.log('[mediasync] Begin afterMediaDownloaded');
    return getImages(apiClient, jobItem, localItem).then(function () {
      return getSubtitles(apiClient, jobItem, localItem);
    });
  }
  function createLocalItem(libraryItem, jobItem) {
    console.log('[mediasync] Begin createLocalItem');
    var item = {
      Item: libraryItem,
      ItemId: libraryItem.Id,
      ServerId: libraryItem.ServerId,
      Id: libraryItem.Id
    };
    if (jobItem) {
      item.SyncJobItemId = jobItem.SyncJobItemId;
    }
    console.log('[mediasync] End createLocalItem');
    return item;
  }
  function getNewItem(jobItem, apiClient) {
    console.log('[mediasync] Begin getNewItem');
    var libraryItem = jobItem.Item;
    return _servicelocator.itemRepository.getLibraryItem(libraryItem.ServerId, libraryItem.Id).then(function (existingItem) {
      if (existingItem) {
        if (existingItem.SyncStatus === 'queued' || existingItem.SyncStatus === 'transferring' || existingItem.SyncStatus === 'synced') {
          console.log('[mediasync] getNewItem: getLibraryItem found existing item');
          if (_localassetmanager.default.enableBackgroundCompletion()) {
            return Promise.resolve();
          }
        }
      }
      libraryItem.CanDelete = true;
      libraryItem.CanDownload = false;
      libraryItem.SupportsSync = false;
      libraryItem.People = [];
      clearChapterImages(libraryItem);
      libraryItem.Studios = [];
      libraryItem.SpecialFeatureCount = null;
      libraryItem.LocalTrailerCount = null;
      libraryItem.RemoteTrailers = [];
      var localItem = createLocalItem(libraryItem, jobItem);
      localItem.SyncStatus = 'queued';
      return _servicelocator.itemRepository.updateLibraryItem(localItem.ServerId, localItem.Id, localItem).then(function () {
        return downloadMedia(apiClient, jobItem, localItem);
      });
    });
  }
  function downloadParentItems(apiClient, libraryItem) {
    var p = Promise.resolve();
    if (libraryItem.SeriesId) {
      p = p.then(function () {
        return downloadItem(apiClient, libraryItem.SeriesId);
      });
    }
    if (libraryItem.SeasonId) {
      p = p.then(function () {
        return downloadItem(apiClient, libraryItem.SeasonId);
      });
    }
    if (libraryItem.AlbumId) {
      p = p.then(function () {
        return downloadItem(apiClient, libraryItem.AlbumId);
      });
      if (libraryItem.AlbumId !== libraryItem.ParentId) {
        p = p.then(function () {
          return downloadItem(apiClient, libraryItem.ParentId);
        });
      }
    }
    return p;
  }
  function downloadItem(apiClient, itemId) {
    return apiClient.getItem(apiClient.getCurrentUserId(), itemId).then(function (downloadedItem) {
      var _downloadedItem$Backd;
      downloadedItem.CanDelete = true;
      downloadedItem.CanDownload = false;
      downloadedItem.SupportsSync = false;
      downloadedItem.People = [];
      downloadedItem.SpecialFeatureCount = null;
      if (((_downloadedItem$Backd = downloadedItem.BackdropImageTags) == null ? void 0 : _downloadedItem$Backd.length) > MaxBackdrops) {
        downloadedItem.BackdropImageTags.length = MaxBackdrops;
      }
      downloadedItem.ParentBackdropImageTags = null;
      downloadedItem.ParentArtImageTag = null;
      downloadedItem.ParentLogoImageTag = null;
      var localItem = createLocalItem(downloadedItem, null);
      return _servicelocator.itemRepository.updateLibraryItem(localItem.ServerId, localItem.Id, localItem).then(function () {
        return Promise.resolve(localItem);
      }, function (err) {
        console.error('[mediasync] downloadItem failed: ' + err.toString());
        return Promise.resolve(null);
      });
    });
  }
  function ensureLocalPathParts(localItem, jobItem) {
    if (localItem.LocalPathParts) {
      return;
    }
    var libraryItem = localItem.Item;
    var parts = _localassetmanager.default.getDirectoryPath(libraryItem);
    parts.push(_localassetmanager.default.getLocalFileName(libraryItem, jobItem.OriginalFileName));
    localItem.LocalPathParts = parts;
  }
  function clearChapterImages(obj) {
    if (!obj.Chapters) {
      return;
    }
    for (var i = 0, length = obj.Chapters.length; i < length; i++) {
      obj.Chapters[i].ImageTag = null;
    }
  }
  function downloadMedia(apiClient, jobItem, localItem) {
    console.log('[mediasync] downloadMedia: start.');
    var url = apiClient.getUrl('Sync/JobItems/' + jobItem.SyncJobItemId + '/File', {
      api_key: apiClient.accessToken()
    });
    ensureLocalPathParts(localItem, jobItem);
    return _localassetmanager.default.downloadFile(url, localItem).then(function (result) {
      console.log('[mediasync] downloadMedia-downloadFile returned path: ' + result.path);

      // result.path
      // result.isComplete

      var localPath = result.path;
      var libraryItem = localItem.Item;
      if (localPath) {
        if (libraryItem.MediaSources) {
          for (var i = 0; i < libraryItem.MediaSources.length; i++) {
            var mediaSource = libraryItem.MediaSources[i];
            mediaSource.Path = localPath;
            mediaSource.Protocol = 'File';
            clearChapterImages(mediaSource);

            // For embedded subtitle streams we must set the DeliveryMethod to 'Embed'
            // to avoid any attempts to load them from elsewhere during playback
            // This could also be done on the server
            mediaSource.MediaStreams.forEach(function (stream) {
              if (stream.Type === 'Subtitle' && !stream.IsExternal) {
                stream.DeliveryMethod = 'Embed';
              }
            });
          }
        }
      }
      localItem.LocalPath = localPath;
      localItem.SyncStatus = 'transferring';
      return _servicelocator.itemRepository.updateLibraryItem(localItem.ServerId, localItem.Id, localItem).then(function () {
        return afterMediaDownloaded(apiClient, jobItem, localItem).then(function () {
          if (result.isComplete) {
            localItem.SyncStatus = 'synced';
            return reportTransfer(apiClient, localItem);
          }
          return Promise.resolve();
        }, function (err) {
          console.log('[mediasync] downloadMedia: afterMediaDownloaded failed: ' + err);
          return Promise.reject(err);
        });
      }, function (err) {
        console.log('[mediasync] downloadMedia: updateLibraryItem failed: ' + err);
        return Promise.reject(err);
      });
    }, function (err) {
      console.log('[mediasync] downloadMedia: LocalAssetManager.downloadFile failed: ' + err);
      return Promise.reject(err);
    });
  }
  function getImages(apiClient, jobItem, localItem) {
    console.log('[mediasync] Begin getImages');
    var p = Promise.resolve();
    var libraryItem = localItem.Item;
    var serverId = libraryItem.ServerId;

    // case 0
    var mainImageTag = (libraryItem.ImageTags || {}).Primary || libraryItem.PrimaryImageTag;
    var primaryImageItemId = libraryItem.PrimaryImageItemId || libraryItem.Id;
    if (primaryImageItemId && mainImageTag) {
      p = p.then(function () {
        return downloadImage(localItem, apiClient, serverId, primaryImageItemId, libraryItem.Id, mainImageTag, 'Primary').then(function (result) {
          // null these out after downloading so that the UI doesn't try to use them
          localItem.PrimaryImageItemId = null;
          return Promise.resolve(result);
        });
      });
    }

    // case 0a
    var logoImageTag = (libraryItem.ImageTags || {}).Logo;
    if (libraryItem.Id && logoImageTag) {
      p = p.then(function () {
        return downloadImage(localItem, apiClient, serverId, libraryItem.Id, libraryItem.Id, logoImageTag, 'Logo');
      });
    }

    // case 0b
    var artImageTag = (libraryItem.ImageTags || {}).Art;
    if (libraryItem.Id && artImageTag) {
      p = p.then(function () {
        return downloadImage(localItem, apiClient, serverId, libraryItem.Id, libraryItem.Id, artImageTag, 'Art');
      });
    }

    // case 0c
    var bannerImageTag = (libraryItem.ImageTags || {}).Banner;
    if (libraryItem.Id && bannerImageTag) {
      p = p.then(function () {
        return downloadImage(localItem, apiClient, serverId, libraryItem.Id, libraryItem.Id, bannerImageTag, 'Banner');
      });
    }

    // case 0d
    var thumbImageTag = (libraryItem.ImageTags || {}).Thumb;
    if (libraryItem.Id && thumbImageTag) {
      p = p.then(function () {
        return downloadImage(localItem, apiClient, serverId, libraryItem.Id, libraryItem.Id, thumbImageTag, 'Thumb');
      });
    }

    // Backdrops
    if (libraryItem.Id && libraryItem.BackdropImageTags) {
      var numBackdrops = Math.min(libraryItem.BackdropImageTags.length, MaxBackdrops);
      var _loop = function () {
        var index = i;
        var backdropImageTag = libraryItem.BackdropImageTags[i];

        // use self-invoking function to simulate block-level variable scope
        p = p.then(function () {
          return downloadImage(localItem, apiClient, serverId, libraryItem.Id, libraryItem.Id, backdropImageTag, 'backdrop', index);
        });
      };
      for (var i = 0; i < numBackdrops; i++) {
        _loop();
      }
    }

    // case 1/2:
    if (libraryItem.SeriesId && libraryItem.SeriesPrimaryImageTag) {
      p = p.then(function () {
        return downloadImage(localItem, apiClient, serverId, libraryItem.SeriesId, libraryItem.SeriesId, libraryItem.SeriesPrimaryImageTag, 'Primary');
      });
    }
    if (libraryItem.SeasonId) {
      if (!libraryItem.SeasonPrimaryImageTag) {
        p = p.then(function () {
          return apiClient.getItem(apiClient.getCurrentUserId(), libraryItem.SeasonId).then(function (seasonItem) {
            libraryItem.SeasonPrimaryImageTag = (seasonItem.ImageTags || {}).Primary;
            return Promise.resolve();
          });
        });
      }
      p = p.then(function () {
        return downloadImage(localItem, apiClient, serverId, libraryItem.SeasonId, libraryItem.SeasonId, libraryItem.SeasonPrimaryImageTag, 'Primary');
      });
    }

    // case 3:
    if (libraryItem.AlbumId && libraryItem.AlbumPrimaryImageTag) {
      p = p.then(function () {
        return downloadImage(localItem, apiClient, serverId, libraryItem.AlbumId, libraryItem.AlbumId, libraryItem.AlbumPrimaryImageTag, 'Primary');
      });
    }
    if (libraryItem.ParentThumbItemId && libraryItem.ParentThumbImageTag) {
      p = p.then(function () {
        return downloadImage(localItem, apiClient, serverId, libraryItem.ParentThumbItemId, libraryItem.ParentThumbItemId, libraryItem.ParentThumbImageTag, 'Thumb');
      });
    }
    if (libraryItem.ParentPrimaryImageItemId && libraryItem.ParentPrimaryImageTag) {
      p = p.then(function () {
        return downloadImage(localItem, apiClient, serverId, libraryItem.ParentPrimaryImageItemId, libraryItem.ParentPrimaryImageItemId, libraryItem.ParentPrimaryImageTag, 'Primary');
      });
    }
    return p.then(function () {
      console.log('[mediasync] Finished getImages');
      return _servicelocator.itemRepository.updateLibraryItem(localItem.ServerId, localItem.Id, localItem);
    }, function (err) {
      console.log('[mediasync] Error getImages: ' + err.toString());
      return Promise.resolve();
    });
  }
  function downloadImage(localItem, apiClient, serverId, downloadFromItemId, downloadToItemId, imageTag, imageType, index) {
    index = index || 0;
    return _localassetmanager.default.hasImage(serverId, downloadToItemId, imageType, index).then(function (hasImage) {
      if (hasImage) {
        console.log('[mediasync] downloadImage - skip existing: ' + downloadToItemId + ' ' + imageType + '_' + index.toString());
        return Promise.resolve();
      }
      var maxWidth = 400;
      if (imageType === 'backdrop') {
        maxWidth = null;
      }
      var imageUrl = apiClient.getImageUrl(downloadFromItemId, {
        tag: imageTag,
        type: imageType,
        maxWidth: maxWidth
      });
      console.log('[mediasync] downloadImage ' + downloadToItemId + ' ' + imageType + '_' + index.toString());
      return _localassetmanager.default.downloadImage(localItem, imageUrl, serverId, downloadToItemId, imageType, index).then(function (result) {
        return Promise.resolve(result);
      }, function (err) {
        console.log('[mediasync] Error downloadImage: ' + err.toString());
        return Promise.resolve();
      });
    }, function (err) {
      console.log('[mediasync] Error downloadImage: ' + err.toString());
      return Promise.resolve();
    });
  }
  function getSubtitles(apiClient, jobItem, localItem) {
    console.log('[mediasync] Begin getSubtitles');
    if (!jobItem.Item.MediaSources.length) {
      console.log('[mediasync] Cannot download subtitles because video has no media source info.');
      return Promise.resolve();
    }
    var files = jobItem.AdditionalFiles.filter(function (f) {
      return f.Type === 'Subtitles';
    });
    var mediaSource = jobItem.Item.MediaSources[0];
    var p = Promise.resolve();
    files.forEach(function (file) {
      p = p.then(function () {
        return getItemSubtitle(file, apiClient, jobItem, localItem, mediaSource);
      });
    });
    return p.then(function () {
      console.log('[mediasync] Exit getSubtitles');
      return Promise.resolve();
    });
  }
  function getItemSubtitle(file, apiClient, jobItem, localItem, mediaSource) {
    console.log('[mediasync] Begin getItemSubtitle');
    var subtitleStream = mediaSource.MediaStreams.filter(function (m) {
      return m.Type === 'Subtitle' && m.Index === file.Index;
    })[0];
    if (!subtitleStream) {
      // We shouldn't get in here, but let's just be safe anyway
      console.log('[mediasync] Cannot download subtitles because matching stream info was not found.');
      return Promise.resolve();
    }
    var fileName = _localassetmanager.default.getSubtitleSaveFileName(localItem, jobItem.OriginalFileName, subtitleStream.Language, subtitleStream.IsForced, subtitleStream.IsHearingImpaired, subtitleStream.Codec);
    return _localassetmanager.default.getItemFileSize(fileName).then(function (size) {
      if (size > 0) {
        // Don't download subtitle file if it already exists
        return Promise.resolve();
      }
      var url = apiClient.getUrl('Sync/JobItems/' + jobItem.SyncJobItemId + '/AdditionalFiles', {
        Name: file.Name,
        api_key: apiClient.accessToken()
      });
      return _localassetmanager.default.downloadSubtitles(url, fileName).then(function (subtitleResult) {
        if (localItem.AdditionalFiles) {
          localItem.AdditionalFiles.forEach(function (item) {
            if (item.Name === file.Name) {
              item.Path = subtitleResult.path;
            }
          });
        }
        subtitleStream.Path = subtitleResult.path;
        subtitleStream.DeliveryMethod = 'External';
        return _servicelocator.itemRepository.updateLibraryItem(localItem.ServerId, localItem.Id, localItem);
      });
    });
  }
  function checkLocalFileExistence(apiClient, options) {
    if (options.checkFileExistence) {
      console.log('[mediasync] Begin checkLocalFileExistence');
      var searchStati = ['synced', 'error'];
      return _servicelocator.itemRepository.getLibraryItemsBySyncStatus(apiClient.serverId(), searchStati).then(function (items) {
        var p = Promise.resolve();
        items.forEach(function (completedItem) {
          p = p.then(function () {
            return _localassetmanager.default.fileExists(completedItem.LocalPath).then(function (exists) {
              if (!exists) {
                return _localassetmanager.default.removeLocalItem(completedItem).then(function () {
                  return Promise.resolve();
                }, function () {
                  return Promise.resolve();
                });
              }
              return Promise.resolve();
            });
          });
        });
        return p;
      });
    }
    return Promise.resolve();
  }
  function MediaSync() {
    var self = this;

    // when downloading asynchronously, syncdata must be the last opration
    self.sync = function (apiClient, options) {
      console.log('[mediasync]************************************* Start sync (uwp/androidownloadmanager)');
      console.log('[mediasync] options.syncCheckProgressOnly = ' + (options.syncCheckProgressOnly || 'false'));
      return checkLocalFileExistence(apiClient, options).then(function () {
        return processDownloadStatus(apiClient, options).then(function () {
          return _localassetmanager.default.getDownloadItemCount().then(function (downloadCount) {
            if (options.syncCheckProgressOnly === true && downloadCount > 2) {
              console.log('[mediasync] exit due to syncCheckProgressOnly with downloadcount = ' + downloadCount);
              console.log('[mediasync]************************************* Exit sync');
              return Promise.resolve();
            }
            return reportOfflineActions(apiClient).then(function () {
              // Download new content
              return getNewMedia(apiClient, downloadCount).then(function () {
                // Do the second data sync
                return syncData(apiClient).then(function () {
                  console.log('[mediasync]************************************* Exit sync');
                  return Promise.resolve();
                });
              });
              //});
            });
          });
        });
      }, function (err) {
        console.error(err.toString());
      });
    };
  }
  var _default = _exports.default = MediaSync;
});
