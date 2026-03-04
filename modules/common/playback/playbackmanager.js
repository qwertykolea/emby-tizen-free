define(["exports", "./../../emby-apiclient/events.js", "./../appsettings.js", "./../datetime.js", "./../../emby-apiclient/apiclient.js", "./../pluginmanager.js", "./playqueuemanager.js", "./../usersettings/usersettings.js", "./../globalize.js", "./../../emby-apiclient/connectionmanager.js", "./../servicelocator.js", "./../../loading/loading.js", "./../methodtimer.js", "./../qualityoptions.js"], function (_exports, _events, _appsettings, _datetime, _apiclient, _pluginmanager, _playqueuemanager, _usersettings, _globalize, _connectionmanager, _servicelocator, _loading, _methodtimer, _qualityoptions) {
  Object.defineProperty(_exports, "__esModule", {
    value: true
  });
  _exports.default = void 0;
  /* jshint module: true */

  var QueueQueryLimit = 5000;
  var PlaybackItemFields = "ProductionYear,PremiereDate,Container";
  function requireFileSystem(dep) {
    return new Promise(function (resolve, reject) {
      require(['filesystem'], resolve);
    });
  }
  function enableLocalPlaylistManagement(player) {
    if (player.getPlaylist) {
      return false;
    }
    if (player.isLocalPlayer) {
      return true;
    }
    return false;
  }
  function bindToFullscreenChange(player) {
    _events.default.on(_servicelocator.fullscreenManager, 'fullscreenchange', function () {
      _events.default.trigger(player, 'fullscreenchange');
    });
  }
  function triggerPlayerChange(playbackManagerInstance, newPlayer, newTarget, previousPlayer, previousTargetInfo) {
    if (!newPlayer && !previousPlayer) {
      return;
    }
    if (newTarget && previousTargetInfo) {
      if (newTarget.id === previousTargetInfo.id) {
        return;
      }
    }
    _events.default.trigger(playbackManagerInstance, 'playerchange', [newPlayer, newTarget, previousPlayer]);
  }
  function returnResolve(err) {
    console.error(err);
    return Promise.resolve();
  }
  function addPlaylistItemsToPlaybackReport(info, playlist, serverId) {
    var list = [];
    for (var i = 0, length = playlist.length; i < length; i++) {
      var playlistItem = playlist[i];
      var itemInfo = {
        Id: playlistItem.Id,
        PlaylistItemId: playlistItem.PlaylistItemId
      };
      if (playlistItem.ServerId !== serverId) {
        itemInfo.ServerId = playlistItem.ServerId;
      }
      list.push(itemInfo);
    }
    info.NowPlayingQueue = list;
  }
  function addPlaylistToPlaybackReport(playbackManagerInstance, info, player, serverId) {
    return playbackManagerInstance.getPlaylist().then(function (playlistResult) {
      addPlaylistItemsToPlaybackReport(info, playlistResult.Items, serverId);
    });
  }
  function reportPlayback(playbackManagerInstance, state, player, reportPlaylist, serverId, method, progressEventName, additionalData, isAutomated) {
    if (!serverId) {
      // Not a server item
      // We can expand on this later and possibly report them
      return Promise.resolve();
    }
    var info = Object.assign({}, state.PlayState);
    if (additionalData) {
      info = Object.assign(info, additionalData);
    }
    info.ItemId = state.NowPlayingItem.Id;
    if (!info.ItemId) {
      // Not a server item
      // We can expand on this later and possibly report them
      return Promise.resolve();
    }
    if (progressEventName) {
      info.EventName = progressEventName;
    }
    info.PlaylistIndex = state.PlaylistIndex;
    info.PlaylistLength = state.PlaylistLength;
    info.NextMediaType = state.NextMediaType;
    var apiClient = _connectionmanager.default.getApiClient(serverId);

    // the newer server doesn't need continuous reporting when paused
    if (isAutomated && info.IsPaused && apiClient.isMinServerVersion('4.8.0.56')) {
      return Promise.resolve();
    }
    if (!reportPlaylist) {
      return apiClient[method](info).catch(returnResolve);
    }
    if (method === 'reportPlaybackStopped') {
      // needs to be synchronous in order for onAppClose to work
      addPlaylistItemsToPlaybackReport(info, playbackManagerInstance._playQueueManager.getPlaylistResult({}).Items, serverId);
      return apiClient[method](info).catch(returnResolve);
    }

    //console.log(method + '-' + JSON.stringify(info));
    return addPlaylistToPlaybackReport(playbackManagerInstance, info, player, serverId, method).then(function () {
      return apiClient[method](info).catch(returnResolve);
    });
  }
  function normalizeName(t) {
    return t.toLowerCase().replace(' ', '');
  }
  function getItemsFromAudioBookForPlayback(item, signal) {
    var apiClient = _connectionmanager.default.getApiClient(item);
    return apiClient.getResumableItemsFromAudioBook({
      AlbumId: item.Id,
      UserId: apiClient.getCurrentUserId(),
      EnableTotalRecordCount: false,
      ExcludeLocationTypes: 'Virtual',
      Fields: PlaybackItemFields
    }, signal).then(function (result) {
      if (!result.Items.length) {
        return getItemsForPlayback(item.ServerId, {
          ParentId: item.Id,
          Filters: "IsNotFolder",
          Recursive: true
        }, signal);
      }
      return result;
    });
  }
  function getItemsFromSeriesForPlayback(item, signal) {
    var apiClient = _connectionmanager.default.getApiClient(item);
    return apiClient.getResumableItemsFromSeries({
      SeriesId: item.Id,
      UserId: apiClient.getCurrentUserId(),
      EnableTotalRecordCount: false,
      ExcludeLocationTypes: 'Virtual',
      Fields: PlaybackItemFields
    }, signal).then(function (result) {
      if (!result.Items.length) {
        return getItemsForPlayback(item.ServerId, {
          ParentId: item.Id,
          Filters: "IsNotFolder",
          Recursive: true,
          IsStandaloneSpecial: false
        }, signal);
      }
      return result;
    });
  }
  function getItemsForPlayback(serverId, query, signal) {
    var apiClient = _connectionmanager.default.getApiClient(serverId);
    if (query.Ids && query.Ids.split(',').length === 1) {
      var itemId = query.Ids.split(',');
      return apiClient.getItem(apiClient.getCurrentUserId(), itemId, {
        ExcludeFields: 'VideoChapters,VideoMediaSources,MediaStreams,People,Overview'
      }, signal).then(function (item) {
        return {
          Items: [item],
          TotalRecordCount: 1
        };
      });
    } else {
      query.Fields = PlaybackItemFields;
      query.ExcludeLocationTypes = "Virtual";
      query.EnableTotalRecordCount = false;
      query.CollapseBoxSetItems = false;
      return apiClient.getItems(apiClient.getCurrentUserId(), query, signal);
    }
  }
  function createStreamInfoFromUrlItem(item) {
    // Check item.Path for games
    return {
      url: item.Url || item.Path,
      playMethod: 'DirectPlay',
      item: item,
      textTracks: [],
      mediaType: item.MediaType
    };
  }
  function mergePlaybackQueries(obj1, obj2) {
    var query = Object.assign(obj1, obj2);
    var filters = query.Filters ? query.Filters.split(',') : [];
    if (!filters.includes('IsNotFolder')) {
      filters.push('IsNotFolder');
    }
    query.Filters = filters.join(',');
    return query;
  }
  function getMimeType(type, container) {
    container = (container || '').toLowerCase();
    if (type === 'Audio') {
      if (container === 'opus') {
        return 'audio/ogg';
      }
      if (container === 'webma') {
        return 'audio/webm';
      }
      if (container === 'm4a') {
        return 'audio/mp4';
      }
    } else if (type === 'Video') {
      if (container === 'mkv') {
        return 'video/x-matroska';
      }
      if (container === 'm4v') {
        return 'video/mp4';
      }
      if (container === 'mov') {
        return 'video/quicktime';
      }
      if (container === 'mpg') {
        return 'video/mpeg';
      }
      if (container === 'flv') {
        return 'video/x-flv';
      }
    } else if (type === 'Photo') {
      return 'image/' + container;
    }
    return 'application/' + container;
  }
  function isAutomaticPlayer(player) {
    if (player.isLocalPlayer) {
      return true;
    }
    return false;
  }
  function getAutomaticPlayers(instance, forceLocalPlayer) {
    if (!forceLocalPlayer) {
      var player = instance._currentPlayer;
      if (player && !isAutomaticPlayer(player)) {
        return [player];
      }
    }
    return instance.getPlayers().filter(isAutomaticPlayer);
  }
  function isServerItem(item) {
    if (!item.Id) {
      return false;
    }
    return true;
  }
  function enableIntros(item) {
    if (item.MediaType !== 'Video') {
      return false;
    }
    if (item.Type === 'TvChannel') {
      return false;
    }
    // disable for in-progress recordings
    if (item.Status === 'InProgress') {
      return false;
    }
    return isServerItem(item);
  }
  function getDefaultIntros() {
    return Promise.resolve({
      Items: []
    });
  }
  function getIntros(firstItem, apiClient, options, signal) {
    if (options.shuffle || options.startPositionTicks || options.fullscreen === false || !enableIntros(firstItem) || !_appsettings.default.enableCinemaMode()) {
      return getDefaultIntros();
    }
    _loading.default.show();
    var introsOptions = {};
    if (!_servicelocator.appHost.supports('youtube_embedded')) {
      introsOptions.ExcludeSources = ['youtube'];
    }
    return apiClient.getIntros(firstItem.Id, introsOptions, signal).catch(getDefaultIntros);
  }
  function getAudioMaxValues(deviceProfile) {
    // TODO - this could vary per codec and should be done on the server using the entire profile
    var maxAudioSampleRate = null;
    var maxAudioBitDepth = null;
    var maxAudioBitrate = null;
    deviceProfile.CodecProfiles.forEach(function (codecProfile) {
      if (codecProfile.Type === 'Audio') {
        (codecProfile.Conditions || []).forEach(function (condition) {
          if (condition.Condition === 'LessThanEqual' && condition.Property === 'AudioBitDepth') {
            maxAudioBitDepth = condition.Value;
          }
          if (condition.Condition === 'LessThanEqual' && condition.Property === 'AudioSampleRate') {
            maxAudioSampleRate = condition.Value;
          }
          if (condition.Condition === 'LessThanEqual' && condition.Property === 'AudioBitrate') {
            maxAudioBitrate = condition.Value;
          }
        });
      }
    });
    return {
      maxAudioSampleRate: maxAudioSampleRate,
      maxAudioBitDepth: maxAudioBitDepth,
      maxAudioBitrate: maxAudioBitrate
    };
  }
  function getAudioStreamUrlFromDeviceProfile(item, deviceProfile, maxBitrate, apiClient, startPosition) {
    var transcodingProfile = deviceProfile.TranscodingProfiles.filter(function (p) {
      return p.Type === 'Audio' && p.Context === 'Streaming';
    })[0];
    var directPlayContainers = [];
    for (var directPlayProfileIndex = 0, directPlayProfilesLength = deviceProfile.DirectPlayProfiles.length; directPlayProfileIndex < directPlayProfilesLength; directPlayProfileIndex++) {
      var p = deviceProfile.DirectPlayProfiles[directPlayProfileIndex];
      if (p.Type !== 'Audio') {
        continue;
      }
      var audioCodecs = p.AudioCodec ? p.AudioCodec.split(',') : [];
      if (!audioCodecs.length) {
        directPlayContainers.push(p.Container);
        continue;
      }
      for (var j = 0, length2 = audioCodecs.length; j < length2; j++) {
        directPlayContainers.push(p.Container + '|' + audioCodecs[j]);
      }
    }
    directPlayContainers = directPlayContainers.join(',');
    var maxValues = getAudioMaxValues(deviceProfile);
    return apiClient.getAudioStreamUrl(item, transcodingProfile, directPlayContainers, maxValues.maxAudioBitrate || maxBitrate, maxValues.maxAudioSampleRate, maxValues.maxAudioBitDepth, startPosition, false);
  }
  function getStreamUrls(items, deviceProfile, maxBitrate, apiClient, startPosition) {
    var audioTranscodingProfile = deviceProfile.TranscodingProfiles.filter(function (p) {
      return p.Type === 'Audio' && p.Context === 'Streaming';
    })[0];
    var audioDirectPlayContainers = '';
    deviceProfile.DirectPlayProfiles.forEach(function (p) {
      if (p.Type === 'Audio') {
        if (audioDirectPlayContainers) {
          audioDirectPlayContainers += ',' + p.Container;
        } else {
          audioDirectPlayContainers = p.Container;
        }
        if (p.AudioCodec) {
          audioDirectPlayContainers += '|' + p.AudioCodec;
        }
      }
    });
    var maxValues = getAudioMaxValues(deviceProfile);
    return apiClient.getAudioStreamUrls(items, audioTranscodingProfile, audioDirectPlayContainers, maxValues.maxAudioBitrate || maxBitrate, maxValues.maxAudioSampleRate, maxValues.maxAudioBitDepth, startPosition, false);
  }
  function setStreamUrlIntoAllMediaSources(mediaSources, streamUrl) {
    for (var i = 0, length = mediaSources.length; i < length; i++) {
      mediaSources[i].StreamUrl = streamUrl;
    }
  }
  function createAudioMediaSourceFromItem(item) {
    return {
      Id: item.Id,
      MediaStreams: [],
      RunTimeTicks: item.RunTimeTicks,
      Container: item.Container,
      Bitrate: item.Bitrate
    };
  }
  function setStreamUrls(items, deviceProfile, maxBitrate, apiClient, startPosition) {
    return getStreamUrls(items, deviceProfile, maxBitrate, apiClient, startPosition).then(function (streamUrls) {
      for (var i = 0, length = items.length; i < length; i++) {
        var item = items[i];
        var streamUrl = streamUrls[i];
        if (streamUrl) {
          if (!item.MediaSources) {
            item.MediaSources = [];
          }
          if (!item.MediaSources.length) {
            item.MediaSources.push(createAudioMediaSourceFromItem(item));
          }
          setStreamUrlIntoAllMediaSources(item.MediaSources, streamUrl);
        }
      }
    });
  }
  function getParam(name, url) {
    name = name.replace(/[\[]/, "\\\[").replace(/[\]]/, "\\\]");
    var regexS = "[\\?&]" + name + "=([^&#]*)";
    var regex = new RegExp(regexS, "i");
    var results = regex.exec(url);
    if (results == null) {
      return "";
    } else {
      return decodeURIComponent(results[1].replace(/\+/g, " "));
    }
  }
  function addResolutionCondition(conditions, name, value) {
    for (var i = 0, length = conditions.length; i < length; i++) {
      var condition = conditions[i];
      if (condition.Property === name) {
        var currentValue = parseInt(condition.Value);
        condition.Value = Math.min(currentValue, value).toString();
        return;
      }
    }
    conditions.push({
      Condition: 'LessThanEqual',
      Property: name,
      Value: value.toString(),
      IsRequired: false
    });
  }
  function getPlaybackInfo(player, apiClient, item, deviceProfile, maxBitrate, enableAutomaticQuality, startPosition, isPlayback, mediaSourceId, audioStreamIndex, subtitleStreamIndex, currentPlaySessionId, liveStreamId, enableDirectPlay, enableDirectStream, allowVideoStreamCopy, allowAudioStreamCopy, signal) {
    if (item.MediaType === 'Audio') {
      var mediaSource = createAudioMediaSourceFromItem(item);
      mediaSource.StreamUrl = getAudioStreamUrlFromDeviceProfile(item, deviceProfile, maxBitrate, apiClient, startPosition);
      return Promise.resolve({
        MediaSources: [mediaSource],
        PlaySessionId: getParam('playSessionId', mediaSource.StreamUrl)
      });
    }
    if (item.MediaSources && item.MediaSources.length && item.MediaSources[0].StreamUrl) {
      return Promise.resolve({
        MediaSources: item.MediaSources,
        PlaySessionId: getParam('playSessionId', item.MediaSources[0].StreamUrl)
      });
    }
    var itemId = item.Id;
    var query = {
      UserId: apiClient.getCurrentUserId(),
      StartTimeTicks: startPosition || 0
    };
    if (isPlayback) {
      query.IsPlayback = true;
      query.AutoOpenLiveStream = true;
    } else {
      query.IsPlayback = false;
      query.AutoOpenLiveStream = false;
    }
    if (audioStreamIndex != null) {
      query.AudioStreamIndex = audioStreamIndex;
    }
    if (subtitleStreamIndex != null) {
      query.SubtitleStreamIndex = subtitleStreamIndex;
    }
    if (enableDirectPlay != null) {
      query.EnableDirectPlay = enableDirectPlay;
    }
    if (enableDirectStream != null) {
      query.EnableDirectStream = enableDirectStream;
    }
    if (allowVideoStreamCopy != null) {
      query.AllowVideoStreamCopy = allowVideoStreamCopy;
    }
    if (allowAudioStreamCopy != null) {
      query.AllowAudioStreamCopy = allowAudioStreamCopy;
    }
    if (mediaSourceId) {
      query.MediaSourceId = mediaSourceId;
    }
    if (liveStreamId) {
      query.LiveStreamId = liveStreamId;
    }
    if (maxBitrate) {
      query.MaxStreamingBitrate = maxBitrate;
    }
    if (currentPlaySessionId) {
      query.CurrentPlaySessionId = currentPlaySessionId;
    }

    // todo: this should be moved to a helper that wraps player.getDeviceProfile, to ensure that it is always applied
    // if the user has selected a specific quality, then apply the corresponding resolution limit
    if (maxBitrate && !enableAutomaticQuality) {
      var qualities = _qualityoptions.default.getVideoQualityOptions({
        currentMaxBitrate: maxBitrate,
        isAutomaticBitrateEnabled: true,
        enableAuto: false
      });

      //let maxHeight;
      var maxWidth;
      for (var i = 0, length = qualities.length; i < length; i++) {
        if (qualities[i].bitrate === maxBitrate) {
          //maxHeight = qualities[i].maxHeight;
          maxWidth = qualities[i].maxWidth;
          break;
        }
      }
      if (maxWidth) {
        deviceProfile.CodecProfiles = deviceProfile.CodecProfiles || [];
        var foundGlobalCodecProfile;
        for (var _i = 0, _length = deviceProfile.CodecProfiles.length; _i < _length; _i++) {
          var codecProfile = deviceProfile.CodecProfiles[_i];
          if (codecProfile.Type === 'Video') {
            codecProfile.Conditions = codecProfile.Conditions || [];
            addResolutionCondition(codecProfile.Conditions, 'Width', maxWidth);
            if (!codecProfile.Codec) {
              foundGlobalCodecProfile = true;
            }
          }
        }
        if (!foundGlobalCodecProfile) {
          var globalCodecProfile = {
            Type: 'Video',
            Conditions: []
          };
          addResolutionCondition(globalCodecProfile.Conditions, 'Width', maxWidth);
          deviceProfile.CodecProfiles.push(globalCodecProfile);
        }
      }
    }
    var promise = apiClient.getPlaybackInfo(itemId, query, deviceProfile, signal);
    if (player.isLocalPlayer) {
      return promise;
    }
    return promise.then(sortMediaSourcesForRemotePlayer);
  }
  function sortByIsServerContent(a, b) {
    var isALocal = _apiclient.default.isLocalItem(a);
    if (isALocal === _apiclient.default.isLocalItem(b)) {
      return 0;
    }
    if (isALocal) {
      return 1;
    }
    return -1;
  }
  function sortMediaSourcesForRemotePlayer(playbackInfoResult) {
    playbackInfoResult.MediaSources.sort(sortByIsServerContent);
    return playbackInfoResult;
  }
  function getOptimalMediaSource(apiClient, item, versions, signal) {
    var promises = versions.map(function (v) {
      return supportsDirectPlay(apiClient, item, v, signal);
    });
    if (!promises.length) {
      return Promise.reject();
    }
    return Promise.all(promises).then(function (results) {
      for (var i = 0, length = versions.length; i < length; i++) {
        versions[i].enableDirectPlay = results[i] || false;
      }
      var optimalVersion = versions.filter(function (v) {
        return v.enableDirectPlay;
      })[0];
      if (!optimalVersion) {
        optimalVersion = versions.filter(function (v) {
          return v.SupportsDirectStream;
        })[0];
      }
      optimalVersion = optimalVersion || versions.filter(function (s) {
        return s.SupportsTranscoding;
      })[0];
      return optimalVersion || versions[0];
    });
  }
  function getLiveStream(apiClient, item, playSessionId, deviceProfile, maxBitrate, startPosition, mediaSource, audioStreamIndex, subtitleStreamIndex, signal) {
    var postData = {
      DeviceProfile: deviceProfile,
      OpenToken: mediaSource.OpenToken
    };
    var query = {
      UserId: apiClient.getCurrentUserId(),
      StartTimeTicks: startPosition || 0,
      ItemId: item.Id,
      PlaySessionId: playSessionId
    };
    if (maxBitrate) {
      query.MaxStreamingBitrate = maxBitrate;
    }
    if (audioStreamIndex != null) {
      query.AudioStreamIndex = audioStreamIndex;
    }
    if (subtitleStreamIndex != null) {
      query.SubtitleStreamIndex = subtitleStreamIndex;
    }
    return apiClient.ajax({
      url: apiClient.getUrl('LiveStreams/Open', query),
      type: 'POST',
      data: JSON.stringify(postData),
      contentType: "application/json",
      dataType: "json",
      signal: signal
    });
  }
  function isHostReachable(mediaSource, apiClient, signal) {
    if (mediaSource.IsRemote) {
      return Promise.resolve(true);
    }
    return apiClient.getEndpointInfo(signal).then(function (endpointInfo) {
      if (endpointInfo.IsInNetwork) {
        if (!endpointInfo.IsLocal) {
          var path = (mediaSource.Path || '').toLowerCase();
          if (path.includes('localhost') || path.includes('127.0.0.1')) {
            // This will only work if the app is on the same machine as the server
            return Promise.resolve(false);
          }
        }
        return Promise.resolve(true);
      }

      // media source is in network, but connection is out of network
      return Promise.resolve(false);
    });
  }
  function supportsDirectPlay(apiClient, item, mediaSource, signal) {
    if (_apiclient.default.isLocalItem(mediaSource)) {
      return Promise.resolve(true);
    }

    // folder rip hacks due to not yet being supported by the stream building engine
    var isFolderRip = mediaSource.Container === 'bluray' || mediaSource.Container === 'dvd';
    if (mediaSource.SupportsDirectPlay || isFolderRip) {
      if (mediaSource.IsRemote) {
        return Promise.resolve(false);
      }
      if (mediaSource.Protocol === 'Http' && !mediaSource.RequiredHttpHeaders.length) {
        // If this is the only way it can be played, then allow it
        if (!mediaSource.SupportsDirectStream && !mediaSource.SupportsTranscoding) {
          return Promise.resolve(true);
        } else {
          return isHostReachable(mediaSource, apiClient, signal);
        }
      } else if (mediaSource.Protocol === 'File') {
        // Determine if the file can be accessed directly
        return requireFileSystem().then(function (filesystem) {
          var method = isFolderRip ? 'directoryExists' : 'fileExists';
          return filesystem[method](mediaSource.Path).then(function () {
            return true;
          }, function () {
            return false;
          });
        });
      }
    }
    return Promise.resolve(false);
  }
  function afterPlaybackErrorMessage(instance, errorCode, playNextTrack) {
    if (errorCode === 'RateLimitExceeded') {
      instance.stop();
    } else if (playNextTrack) {
      instance.nextTrack();
    }
  }
  function processErrorResponseWithResponseHelper(response) {
    return Emby.importModule('./modules/common/responsehelper.js').then(function (responseHelper) {
      return responseHelper.handleErrorResponse(response);
    });
  }
  function showPlaybackErrorMessage(instance, errorResponse, errorCode, fullscreen, playNextTrack) {
    if (fullscreen === false || errorCode === 'Aborted') {
      return afterPlaybackErrorMessage(instance, errorCode, playNextTrack);
    }
    function onAlertDismissed() {
      return afterPlaybackErrorMessage(instance, errorCode, playNextTrack);
    }
    _loading.default.hide();
    console.error('Playback error: ', errorResponse);
    if (!errorResponse) {
      errorResponse = {
        errorCode: errorCode
      };
    }
    if (typeof errorResponse === 'string') {
      errorResponse = {
        errorCode: errorResponse
      };
    }
    errorResponse.errorTitle = _globalize.default.translate('HeaderPlaybackError');
    processErrorResponseWithResponseHelper(errorResponse).then(onAlertDismissed, onAlertDismissed);
  }
  function normalizePlayOptions(playOptions) {
    playOptions.fullscreen = playOptions.fullscreen !== false;
  }
  function truncatePlayOptions(playOptions) {
    return {
      // this is for the photoplayer
      autoplay: playOptions.autoplay,
      fullscreen: playOptions.fullscreen,
      mediaSourceId: playOptions.mediaSourceId,
      audioStreamIndex: playOptions.audioStreamIndex,
      subtitleStreamIndex: playOptions.subtitleStreamIndex,
      startPositionTicks: playOptions.startPositionTicks,
      shuffle: playOptions.shuffle
    };
  }
  function copyPlayOptionsForNextItem(playOptions) {
    return {
      fullscreen: playOptions.fullscreen
    };
  }
  function getNowPlayingItemForReporting(player, item, mediaSource) {
    var nowPlayingItem = Object.assign({}, item);
    nowPlayingItem.playOptions = null;
    delete nowPlayingItem.playOptions;
    if (mediaSource) {
      nowPlayingItem.RunTimeTicks = mediaSource.RunTimeTicks;
      nowPlayingItem.MediaStreams = mediaSource.MediaStreams;
      nowPlayingItem.Chapters = mediaSource.Chapters || item.Chapters;
      nowPlayingItem.Container = mediaSource.Container;
      nowPlayingItem.Bitrate = mediaSource.Bitrate;

      // not needed
      nowPlayingItem.MediaSources = null;
      delete nowPlayingItem.MediaSources;
    }
    if (!nowPlayingItem.RunTimeTicks) {
      var duration = player.duration();
      if (duration) {
        nowPlayingItem.RunTimeTicks = duration * 10000;
      }
    }
    return nowPlayingItem;
  }
  function displayPlayerIndividually(player) {
    return !player.isLocalPlayer;
  }
  function createTarget(instance, player) {
    var allMediaTypes = ['Audio', 'Video', 'Game', 'Photo', 'Book'];
    var mediaTypes = [];
    for (var i = 0, length = allMediaTypes.length; i < length; i++) {
      var mediaType = allMediaTypes[i];
      if (canPlayerPlayMediaType(player, mediaType)) {
        mediaTypes.push(mediaType);
      }
    }
    return {
      name: player.name,
      id: player.id,
      playerName: player.name,
      playableMediaTypes: mediaTypes,
      isLocalPlayer: player.isLocalPlayer,
      supportedCommands: instance.getSupportedCommands(player)
    };
  }
  function getPlayerTargets(player) {
    if (player.getTargets) {
      return player.getTargets();
    }
    return Promise.resolve([createTarget(player)]);
  }
  function sortPlayerTargets(a, b) {
    var aVal = a.isLocalPlayer ? 0 : 1;
    var bVal = b.isLocalPlayer ? 0 : 1;
    aVal = aVal.toString() + a.name;
    bVal = bVal.toString() + b.name;
    return aVal.localeCompare(bVal);
  }
  function getDefaultPlayOptions() {
    return {
      fullscreen: true
    };
  }
  var playerStates = {};
  function getPlayerData(player) {
    if (!player) {
      throw new Error('player cannot be null');
    }
    if (!player.name) {
      throw new Error('player name cannot be null');
    }
    var state = playerStates[player.name];
    if (!state) {
      playerStates[player.name] = {};
      state = playerStates[player.name];
    }
    return player;
  }
  function canPlayerPlayMediaType(player, mediaType) {
    if (!mediaType) {
      return false;
    }
    if (player.mediaType && player.mediaType === mediaType) {
      return true;
    }
    if (player.mediaTypes) {
      return player.mediaTypes.includes(mediaType);
    }
    return player.canPlayMediaType(mediaType);
  }
  function randomIntFromInterval(min, max) {
    // min and max included 
    return Math.floor(Math.random() * (max - min + 1) + min);
  }
  function setNextEpisodeAutoPlayOnItemsResult(result, options, signal) {
    var firstItem = result.Items[0];
    if (!firstItem || firstItem.Type !== 'Episode') {
      return Promise.resolve(result);
    }
    if (options.shuffle) {
      result.AutoPlay = true;
      return Promise.resolve(result);
    }
    var apiClient = _connectionmanager.default.getApiClient(firstItem);
    return apiClient.getCurrentUser({
      signal: signal
    }).then(function (user) {
      result.AutoPlay = user.Configuration.EnableNextEpisodeAutoPlay;
      return result;
    });
  }
  function getSubtitleStream(instance, player, index) {
    return instance.subtitleTracks(player).filter(function (s) {
      return s.Type === 'Subtitle' && s.Index === index;
    })[0];
  }
  function isAudioStreamIndexSupported(instance, mediaSource, index, deviceProfile) {
    var mediaStream;
    var i, length;
    var mediaStreams = mediaSource.MediaStreams;
    for (i = 0, length = mediaStreams.length; i < length; i++) {
      if (mediaStreams[i].Type === 'Audio' && mediaStreams[i].Index === index) {
        mediaStream = mediaStreams[i];
        break;
      }
    }
    if (!mediaStream) {
      return false;
    }
    return instance.isAudioStreamSupported(mediaStream, mediaSource, deviceProfile);
  }
  function formatIncludesValue(format, value) {
    // example: -truehd,ac4. this is an opt-out list
    if (format.startsWith('-')) {
      format = format.substring(1);
      if (format.toLowerCase().split(',').includes(value)) {
        return false;
      }
    } else {
      // example: -truehd,ac4. this is an opt-in list
      if (!format.toLowerCase().split(',').includes(value)) {
        return false;
      }
    }
    return true;
  }
  function getSavedMaxStreamingBitrate(apiClient, mediaType) {
    if (!apiClient) {
      // This should hopefully never happen
      apiClient = _connectionmanager.default.currentApiClient();
    }
    var endpointInfo = apiClient.getSavedEndpointInfo() || {};
    return _appsettings.default.maxStreamingBitrate(endpointInfo.NetworkType, mediaType);
  }
  function getDeliveryMethod(subtitleStream) {
    // This will be null for internal subs for local items
    if (subtitleStream.DeliveryMethod) {
      return subtitleStream.DeliveryMethod;
    }
    return subtitleStream.IsExternal ? 'External' : 'Embed';
  }

  // Returns true if the player can seek using native client-side seeking functions
  function canPlayerSeek(instance, player) {
    if (!player) {
      throw new Error('player cannot be null');
    }
    var playerData = getPlayerData(player);
    var streamInfo = playerData.streamInfo;
    if (streamInfo) {
      var currentSrc = (streamInfo.url || '').toLowerCase();
      if (currentSrc.includes('.m3u8')) {
        return true;
      }
    }
    if (player.seekable) {
      return player.seekable();
    }
    var isPlayMethodTranscode = instance.playMethod(player) === 'Transcode';
    if (isPlayMethodTranscode) {
      return false;
    }
    return player.duration();
  }
  function onUnhandledPlaybackFailure(instance, err, fullscreen, signal) {
    err = err || {};
    _loading.default.hide();
    var errorCode = err.errorCode || (err && typeof err === 'string' ? err : 'NoCompatibleStream');

    // no message if intercepted. the interceptor who rejected is expected to show one
    if (errorCode !== 'intercept-cancel' && !signal.aborted) {
      showPlaybackErrorMessage(instance, err, errorCode, fullscreen, err.skipToNextItem);
    }
    _events.default.trigger(instance, 'playbackcancelled');
    return Promise.reject(err);
  }
  function onInterceptorRejection() {
    return Promise.reject({
      errorCode: 'intercept-cancel'
    });
  }
  function destroyPlayer(player) {
    player.destroy();
  }
  function enablePlaybackRetryWithTranscoding(streamInfo, errorType, currentlyPreventsVideoStreamCopy, currentlyPreventsAudioStreamCopy) {
    // mediadecodeerror, medianotsupported, network, servererror

    if (streamInfo.mediaSource.SupportsTranscoding && (!currentlyPreventsVideoStreamCopy || !currentlyPreventsAudioStreamCopy)) {
      return true;
    }
    return false;
  }
  function initLegacyVolumeMethods(player) {
    player.getVolume = function () {
      return player.volume();
    };
    player.setVolume = function (val) {
      return player.volume(val);
    };
  }
  function stopPlaybackProgressTimer(player) {
    if (player._progressInterval) {
      player._progressInterval.destroy();
      player._progressInterval = null;
    }
  }
  function runInterceptors(item, playOptions, signal) {
    return new Promise(function (resolve, reject) {
      var interceptors = _pluginmanager.default.ofType('preplayintercept');
      interceptors.sort(function (a, b) {
        return (a.order || 0) - (b.order || 0);
      });
      if (!interceptors.length) {
        resolve();
        return;
      }
      _loading.default.hide();
      var options = Object.assign({}, playOptions);
      options.mediaType = item.MediaType;
      options.item = item;
      runNextPrePlay(interceptors, 0, options, resolve, reject);
    });
  }
  function runNextPrePlay(interceptors, index, options, resolve, reject) {
    if (index >= interceptors.length) {
      resolve();
      return;
    }
    var interceptor = interceptors[index];
    interceptor.intercept(options).then(function () {
      runNextPrePlay(interceptors, index + 1, options, resolve, reject);
    }, reject);
  }
  function updateResultSetStartingPoint(result, firstItem, options, isQueueing) {
    var startIndex = -1;
    for (var i = 0, length = result.Items.length; i < length; i++) {
      var currentItem = result.Items[i];
      if (currentItem.Id === firstItem.Id) {
        startIndex = i;
        break;
      }
      if (firstItem.PresentationUniqueKey && currentItem.PresentationUniqueKey === firstItem.PresentationUniqueKey) {
        startIndex = i;
        break;
      }
    }
    if (startIndex !== -1) {
      if (isQueueing) {
        result.Items = result.Items.slice(startIndex);
        result.TotalRecordCount = result.Items.length;
      } else {
        options.startIndex = startIndex;
      }
    } else {
      result = {
        TotalRecordCount: 1,
        Items: [firstItem]
      };
    }
    return result;
  }
  function mapToId(i) {
    return i.Id;
  }
  function containsFolder(items) {
    for (var i = 0, length = items.length; i < length; i++) {
      var item = items[i];
      if (item.PlaylistItemId) {
        return false;
      }
      if (item.IsFolder) {
        return true;
      }
      var type = item.Type;
      switch (type) {
        case 'MusicAlbum':
        case 'MusicArtist':
        case 'Genre':
        case 'MusicGenre':
        case 'GameGenre':
        case 'Studio':
        case 'Person':
          return true;
        default:
          break;
      }
    }
    return false;
  }
  function getBoxSetItems(item, options, signal) {
    var serverId = item.ServerId;
    var itemId = item.Id;
    var sortBy = _usersettings.default.itemSortBy(itemId) || 'default';
    if (sortBy === 'default') {
      sortBy = 'DisplayOrder';
    }
    if (!_connectionmanager.default.getApiClient(item).isMinServerVersion('4.8.0.16')) {
      sortBy = null;
    }
    var sortOrder = sortBy ? _usersettings.default.itemSortOrder(itemId) : null;
    return getItemsForPlayback(serverId, {
      ParentId: itemId,
      SortBy: sortBy,
      SortOrder: sortOrder,
      ProjectToMedia: true
    }, signal);
  }
  function getPlaylistItems(item, options, signal) {
    var serverId = item.ServerId;
    var itemId = item.Id;
    var sortBy = _usersettings.default.itemSortBy(itemId) || 'default';
    if (sortBy === 'default') {
      sortBy = 'ListItemOrder';
    }
    var sortOrder = sortBy ? _usersettings.default.itemSortOrder(itemId) : null;
    return getItemsForPlayback(serverId, {
      ParentId: itemId,
      SortBy: sortBy,
      SortOrder: sortOrder
    }, signal);
  }
  function getAudioOrMusicVideosForPlayback(firstItem, query, signal) {
    var serverId = firstItem.ServerId;
    var originalRequestedMediaTypes = query.MediaTypes;
    if (!originalRequestedMediaTypes) {
      query.MediaTypes = 'Audio';
    }
    return getItemsForPlayback(serverId, query, signal).then(function (result) {
      if (result.TotalRecordCount || result.Items.length || originalRequestedMediaTypes) {
        return result;
      }
      query.MediaTypes = 'Video';
      return getItemsForPlayback(serverId, query, signal);
    });
  }
  function areAllItemsOfType(items, types) {
    for (var i = 0, length = items.length; i < length; i++) {
      if (!types.includes(items[i].Type)) {
        return false;
      }
    }
    return true;
  }
  function mapProperty(items, prop) {
    return items.map(function (i) {
      return i[prop];
    });
  }
  function translateItemsForPlayback(items, options, showLoading, isQueueing, signal) {
    var firstItem = items[options.startIndex || 0];
    var promise;
    var serverId = firstItem.ServerId;
    var queryOptions = options.queryOptions || {};
    if (firstItem.Type === 'Program') {
      promise = getItemsForPlayback(serverId, {
        Ids: firstItem.ChannelId
      }, signal);
    } else if (firstItem.Type === 'Chapter') {
      options.mediaSourceId = firstItem.MediaSourceId;
      options.serverId = firstItem.ServerId;
      promise = getItemsForPlayback(serverId, {
        Ids: firstItem.ItemId
      }, signal);
    } else if (areAllItemsOfType(items, ['MusicArtist'])) {
      promise = getAudioOrMusicVideosForPlayback(firstItem, {
        ArtistIds: mapProperty(items, 'Id'),
        Filters: "IsNotFolder",
        Recursive: true,
        ParentId: options.parentId,
        SortBy: 'Album,ParentIndexNumber,IndexNumber'
      }, signal);
    } else if (areAllItemsOfType(items, ['MusicGenre'])) {
      promise = getAudioOrMusicVideosForPlayback(firstItem, {
        GenreIds: mapProperty(items, 'Id'),
        Filters: "IsNotFolder",
        Recursive: true,
        SortBy: 'Album,ParentIndexNumber,IndexNumber',
        ParentId: options.parentId,
        ProjectToMedia: true
      }, signal);
    } else if (areAllItemsOfType(items, ['Genre'])) {
      promise = getItemsForPlayback(serverId, {
        GenreIds: mapProperty(items, 'Id'),
        Filters: "IsNotFolder",
        Recursive: true,
        SortBy: 'SortName',
        MediaTypes: "Video",
        ParentId: options.parentId,
        ProjectToMedia: true
      }, signal);
    } else if (areAllItemsOfType(items, ['Tag'])) {
      promise = getItemsForPlayback(serverId, {
        TagIds: mapProperty(items, 'Id'),
        Filters: "IsNotFolder",
        Recursive: true,
        SortBy: 'SortName',
        ParentId: options.parentId,
        ProjectToMedia: true
      }, signal);
    } else if (areAllItemsOfType(items, ['Studio'])) {
      promise = getItemsForPlayback(serverId, {
        StudioIds: mapProperty(items, 'Id'),
        Filters: "IsNotFolder",
        Recursive: true,
        SortBy: 'SortName',
        ParentId: options.parentId,
        ProjectToMedia: true
      }, signal);
    } else if (areAllItemsOfType(items, ['GameGenre'])) {
      promise = getItemsForPlayback(serverId, {
        GenreIds: mapProperty(items, 'Id'),
        Filters: "IsNotFolder",
        Recursive: true,
        SortBy: 'SortName',
        MediaTypes: "Game",
        ParentId: options.parentId,
        ProjectToMedia: true
      }, signal);
    } else if (areAllItemsOfType(items, ['Person'])) {
      promise = getItemsForPlayback(serverId, {
        PersonIds: mapProperty(items, 'Id'),
        Filters: "IsNotFolder",
        Recursive: true,
        SortBy: 'SortName',
        ParentId: options.parentId,
        ProjectToMedia: true
      }, signal);
    } else if (items.length > 1 && areAllItemsOfType(items, ['MusicAlbum'])) {
      promise = getItemsForPlayback(serverId, {
        AlbumIds: mapProperty(items, 'Id'),
        Filters: "IsNotFolder",
        Recursive: true,
        SortBy: 'SortName',
        IsFolder: false,
        ParentId: options.parentId
      }, signal);
    } else if (items.length > 1 && containsFolder(items) && _connectionmanager.default.getApiClient(firstItem).isMinServerVersion('4.8.0.30')) {
      promise = getItemsForPlayback(serverId, {
        Ids: items.map(mapToId).join(','),
        ProjectToMedia: true
      }, signal);
    } else if (firstItem.Type === "Playlist") {
      promise = getPlaylistItems(firstItem, options, signal);
    } else if (firstItem.Type === "BoxSet") {
      promise = getBoxSetItems(firstItem, options, signal);
    } else if (firstItem.MediaType === "Photo" && items.length === 1 && firstItem.ParentId) {
      promise = getItemsForPlayback(serverId, {
        ParentId: firstItem.ParentId,
        Filters: "IsNotFolder",
        // Setting this to true may cause some incorrect sorting
        Recursive: false,
        SortBy: 'SortName',
        MediaTypes: "Photo,Video"
      }, signal).then(function (result) {
        var items = result.Items;
        var index = items.map(function (i) {
          return i.Id;
        }).indexOf(firstItem.Id);
        if (index === -1) {
          index = 0;
        }
        options.startIndex = index;
        return Promise.resolve(result);
      });
    } else if (firstItem.Type === 'PhotoAlbum') {
      promise = getItemsForPlayback(serverId, {
        ParentId: firstItem.Id,
        Filters: "IsNotFolder",
        // Setting this to true may cause some incorrect sorting
        Recursive: false,
        SortBy: 'SortName',
        MediaTypes: "Photo,Video"
      }, signal);
      options.autoplay = true;
    } else if (firstItem.Type === 'MusicAlbum' && firstItem.SupportsResume && !options.shuffle && options.startPositionTicks !== 0 && !(queryOptions != null && queryOptions.Filters)) {
      promise = getItemsFromAudioBookForPlayback(firstItem, signal);
    } else if (firstItem.Type === 'MusicAlbum') {
      promise = getItemsForPlayback(serverId, mergePlaybackQueries({
        ParentId: firstItem.Id,
        Filters: "IsNotFolder",
        Recursive: true
      }, queryOptions), signal);
    } else if (firstItem.Type === 'Series' && !options.shuffle && options.startPositionTicks !== 0 && !(queryOptions != null && queryOptions.Filters)) {
      promise = getItemsFromSeriesForPlayback(firstItem, signal).then(function (result) {
        return setNextEpisodeAutoPlayOnItemsResult(result, options, signal);
      });
    } else if (firstItem.IsFolder) {
      promise = getItemsForPlayback(serverId, mergePlaybackQueries({
        ParentId: firstItem.Id,
        Filters: "IsNotFolder",
        Recursive: true,
        IsStandaloneSpecial: firstItem.Type === 'Series' || firstItem.Type === 'Season' && firstItem.IndexNumber !== 0 ? false : null
      }, queryOptions), signal).then(function (result) {
        if (firstItem.Type === 'Series') {
          return setNextEpisodeAutoPlayOnItemsResult(result, options, signal);
        }
        return result;
      });
    } else if (firstItem.Type === "Audio" && firstItem.AlbumId && firstItem.SupportsResume && items.length === 1 && !isQueueing) {
      var apiClient = _connectionmanager.default.getApiClient(firstItem.ServerId);
      promise = apiClient.getItems(apiClient.getCurrentUserId(), {
        Fields: PlaybackItemFields,
        ParentId: firstItem.AlbumId,
        Recursive: true,
        IncludeItemTypes: 'Audio'
      }, signal).then(function (episodesResult) {
        return updateResultSetStartingPoint(episodesResult, firstItem, options, isQueueing);
      });
    } else if (firstItem.Type === 'Episode' && firstItem.SeriesId && items.length === 1 && !isQueueing) {
      var _apiClient = _connectionmanager.default.getApiClient(firstItem);
      promise = _apiClient.getEpisodes(firstItem.SeriesId, {
        IsVirtualUnaired: false,
        IsMissing: false,
        UserId: _apiClient.getCurrentUserId(),
        Fields: PlaybackItemFields + ',PresentationUniqueKey'
      }, signal).then(function (episodesResult) {
        episodesResult = updateResultSetStartingPoint(episodesResult, firstItem, options, isQueueing);
        return setNextEpisodeAutoPlayOnItemsResult(episodesResult, options, signal);
      });
    }
    if (promise) {
      if (options.fullscreen && showLoading) {
        _loading.default.show();
      }
      return promise.then(function (result) {
        return result && result.Items ? result : {
          Items: items
        };
      });
    } else {
      return Promise.resolve({
        Items: items
      });
    }
  }

  // Set playlist state. Using a method allows for overloading in derived player implementations
  function setPlaylistState(instance, playlistItemId, index) {
    if (!isNaN(index)) {
      instance._playQueueManager.setPlaylistState(playlistItemId, index);
    }
  }
  function detectBitrate(apiClient, mediaType, signal) {
    if (!['Video', 'Audio'].includes(mediaType || '')) {
      return Promise.resolve({
        bitrate: getSavedMaxStreamingBitrate(apiClient, mediaType),
        enableAutomaticQuality: true
      });
    }
    return apiClient.getEndpointInfo(signal).then(function (endpointInfo) {
      if (_appsettings.default.enableAutomaticBitrateDetection(endpointInfo.NetworkType, mediaType)) {
        return apiClient.detectBitrate(signal).then(function (bitrate) {
          _appsettings.default.maxStreamingBitrate(endpointInfo.NetworkType, mediaType, bitrate);
          return Promise.resolve({
            bitrate: bitrate,
            enableAutomaticQuality: true
          });
        });
      } else {
        return Promise.resolve({
          bitrate: getSavedMaxStreamingBitrate(apiClient, mediaType),
          enableAutomaticQuality: false
        });
      }
    }, function () {
      return Promise.resolve({
        bitrate: getSavedMaxStreamingBitrate(apiClient, mediaType),
        enableAutomaticQuality: false
      });
    });
  }
  function createStreamInfo(apiClient, type, item, mediaSource, playSessionId, startPosition) {
    if (item && !isServerItem(item)) {
      return createStreamInfoFromUrlItem(item);
    }
    var mediaUrl;
    var contentType;
    var transcodingOffsetTicks = 0;
    var playerStartPositionTicks = startPosition;
    var originalMediaSource = mediaSource;
    if (!mediaSource) {
      mediaSource = {
        MediaStreams: []
      };
    }
    var liveStreamId = mediaSource.LiveStreamId;
    var playMethod = 'Transcode';
    var mediaSourceContainer = (mediaSource.Container || '').toLowerCase();
    if (type === 'Video' || type === 'Audio') {
      contentType = getMimeType(type, mediaSourceContainer);
      if (mediaSource.enableDirectPlay) {
        mediaUrl = mediaSource.Path;
        playMethod = 'DirectPlay';
      } else if (mediaSource.StreamUrl) {
        // Only used for audio
        playMethod = 'Transcode';
        mediaUrl = mediaSource.StreamUrl;
      } else if (mediaSource.SupportsDirectStream) {
        if (mediaSource.DirectStreamUrl) {
          mediaUrl = apiClient.getUrl(mediaSource.DirectStreamUrl);
        } else {
          var directOptions = {
            Static: true,
            mediaSourceId: mediaSource.Id,
            deviceId: apiClient.deviceId(),
            api_key: apiClient.accessToken()
          };
          if (mediaSource.ETag) {
            directOptions.Tag = mediaSource.ETag;
          }
          if (mediaSource.LiveStreamId) {
            directOptions.LiveStreamId = mediaSource.LiveStreamId;
          }
          var prefix = type === 'Video' ? 'Videos' : 'Audio';
          var directStreamContainer = mediaSourceContainer.toLowerCase().replace('m4v', 'mp4');
          mediaUrl = apiClient.getUrl(prefix + '/' + item.Id + '/stream.' + directStreamContainer, directOptions);
        }
        playMethod = 'DirectStream';
      } else if (mediaSource.SupportsTranscoding) {
        mediaUrl = apiClient.getUrl(mediaSource.TranscodingUrl);
        if (mediaSource.TranscodingSubProtocol === 'hls') {
          contentType = 'application/x-mpegURL';
        } else {
          playerStartPositionTicks = null;
          contentType = getMimeType(type, mediaSource.TranscodingContainer);
          if (!mediaUrl.toLowerCase().includes('copytimestamps=true')) {
            transcodingOffsetTicks = startPosition || 0;
          }
        }
      }
    } else {
      // All other media types
      mediaUrl = mediaSource.Path;
      playMethod = 'DirectPlay';
    }

    // Fallback (used for offline items)
    if (!mediaUrl && mediaSource.SupportsDirectPlay) {
      mediaUrl = mediaSource.Path;
      playMethod = 'DirectPlay';
    }
    var resultInfo = {
      url: mediaUrl,
      mimeType: contentType,
      transcodingOffsetTicks: transcodingOffsetTicks,
      playMethod: playMethod,
      playerStartPositionTicks: playerStartPositionTicks,
      item: item,
      mediaSource: originalMediaSource,
      textTracks: getTextTracks(apiClient, item, mediaSource),
      // TODO: Deprecate
      tracks: getTextTracks(apiClient, item, mediaSource),
      mediaType: type,
      liveStreamId: liveStreamId,
      playSessionId: playSessionId
    };
    return resultInfo;
  }
  function getTextTracks(apiClient, item, mediaSource) {
    var subtitleStreams = mediaSource.MediaStreams.filter(function (s) {
      return s.Type === 'Subtitle';
    });
    var textStreams = subtitleStreams.filter(function (s) {
      return s.DeliveryMethod === 'External';
    });
    var tracks = [];
    for (var i = 0, length = textStreams.length; i < length; i++) {
      var textStream = textStreams[i];
      var textStreamUrl = void 0;
      if (_apiclient.default.isLocalItem(item) || mediaSource.IsLocal) {
        textStreamUrl = textStream.Path;
      } else {
        textStreamUrl = !textStream.IsExternalUrl ? apiClient.getUrl(textStream.DeliveryUrl) : textStream.DeliveryUrl;
      }
      tracks.push({
        url: textStreamUrl,
        language: textStream.Language,
        isDefault: textStream.Index === mediaSource.DefaultSubtitleStreamIndex,
        index: textStream.Index,
        format: textStream.Codec
      });
    }
    return tracks;
  }
  function getPlayer(instance, item, playOptions, forceLocalPlayers) {
    var serverItem = isServerItem(item);
    return getAutomaticPlayers(instance, forceLocalPlayers).filter(function (p) {
      if (canPlayerPlayMediaType(p, item.MediaType)) {
        if (serverItem) {
          if (p.canPlayItem) {
            return p.canPlayItem(item, playOptions);
          }
          return true;
        } else if (item.Url && p.canPlayUrl) {
          return p.canPlayUrl(item.Url);
        }
      }
      return false;
    })[0];
  }
  function getPlaybackMediaSource(player, apiClient, deviceProfile, maxBitrate, enableAutomaticQuality, item, startPosition, mediaSourceId, audioStreamIndex, subtitleStreamIndex, signal) {
    return getPlaybackInfo(player, apiClient, item, deviceProfile, maxBitrate, enableAutomaticQuality, startPosition, true, mediaSourceId, audioStreamIndex, subtitleStreamIndex, null, null, null, null, null, null, signal).then(function (playbackInfoResult) {
      if (playbackInfoResult.ErrorCode) {
        return Promise.reject({
          errorCode: playbackInfoResult.ErrorCode
        });
      }
      return getOptimalMediaSource(apiClient, item, playbackInfoResult.MediaSources, signal).then(function (mediaSource) {
        if (mediaSource) {
          if (mediaSource.RequiresOpening && !mediaSource.LiveStreamId) {
            return getLiveStream(apiClient, item, playbackInfoResult.PlaySessionId, deviceProfile, maxBitrate, startPosition, mediaSource, null, null, signal).then(function (openLiveStreamResult) {
              return supportsDirectPlay(apiClient, item, openLiveStreamResult.MediaSource, signal).then(function (result) {
                openLiveStreamResult.MediaSource.enableDirectPlay = result;
                return {
                  mediaSource: openLiveStreamResult.MediaSource,
                  playSessionId: playbackInfoResult.PlaySessionId
                };
              });
            });
          } else {
            return {
              mediaSource: mediaSource,
              playSessionId: playbackInfoResult.PlaySessionId
            };
          }
        } else {
          return Promise.reject({
            errorCode: 'NoCompatibleStream'
          });
        }
      });
    });
  }
  function queue(instance, options, mode, player) {
    if (!player) {
      player = instance._currentPlayer;
    }
    if (!player) {
      return instance.play(options);
    }
    var signal = new AbortController().signal;
    if (options.items) {
      return translateItemsForPlayback(options.items, options, null, true, signal).then(function (translatedResult) {
        // TODO: Handle options.startIndex for photos
        return queueAll(instance, translatedResult.Items, mode, player);
      });
    } else {
      if (!options.serverId) {
        throw new Error('serverId required!');
      }
      return getItemsForPlayback(options.serverId, {
        Ids: options.ids.join(','),
        ProjectToMedia: true
      }, signal).then(function (result) {
        return translateItemsForPlayback(result.Items, options, null, true, signal).then(function (translatedResult) {
          // TODO: Handle options.startIndex for photos
          return queueAll(instance, translatedResult.Items, mode, player);
        });
      });
    }
  }
  function getDeviceProfile(player, item, options) {
    return player.getDeviceProfile(item, options).then(function (profile) {
      var runtimeTicks = item == null ? void 0 : item.RunTimeTicks;
      if (!_appsettings.default.allowDirectStreamLiveTV() && !runtimeTicks && ((item == null ? void 0 : item.Type) === 'TvChannel' || (item == null ? void 0 : item.Type) === 'Recording')) {
        profile.DirectPlayProfiles = [];
      }
      return profile;
    });
  }
  function queueAll(instance, items, mode, player) {
    if (!items.length) {
      return Promise.resolve();
    }
    if (!player.isLocalPlayer) {
      if (mode === 'next') {
        return player.queueNext({
          items: items
        });
      } else {
        return player.queue({
          items: items
        });
      }
    }
    var queueDirectToPlayer = player && !enableLocalPlaylistManagement(player);
    if (queueDirectToPlayer) {
      var apiClient = _connectionmanager.default.getApiClient(items[0]);
      return getDeviceProfile(player, items[0]).then(function (profile) {
        return setStreamUrls(items, profile, instance.getMaxStreamingBitrate(player), apiClient, 0).then(function () {
          if (mode === 'next') {
            return player.queueNext(items);
          } else {
            return player.queue(items);
          }
        });
      });
    }
    if (mode === 'next') {
      instance._playQueueManager.autoplay = true;
      instance._playQueueManager.queueNext(items);
    } else {
      instance._playQueueManager.queue(items);
    }
    _events.default.trigger(player, 'playlistitemadd');
    return Promise.resolve();
  }
  function getCurrentTicks(player) {
    if (!player) {
      throw new Error('player cannot be null');
    }
    var playerTime;
    if (player.isLocalPlayer) {
      playerTime = Math.floor(10000 * (player.currentTime() || 0));
    } else {
      playerTime = Math.floor(player.currentTime() || 0);
    }
    var streamInfo = getPlayerData(player).streamInfo;
    if (streamInfo) {
      playerTime += streamInfo.transcodingOffsetTicks || 0;
    }
    return playerTime;
  }
  function sendProgressUpdate(instance, player, progressEventName, reportPlaylist, additionalData, isAutomated) {
    if (!player) {
      throw new Error('player cannot be null');
    }
    var playerData = getPlayerData(player);
    var item;

    // this is an optimization to avoid constantly querying the player for it's full state
    if (progressEventName === 'timeupdate') {
      var _item;
      item = instance.currentItem(player);
      if ((_item = item) != null && _item.ServerId) {
        var apiClient = _connectionmanager.default.getApiClient(item);
        if (apiClient) {
          var ticks = getCurrentTicks(player);
          if (apiClient.shouldSkipProgressReport(progressEventName, ticks)) {
            return;
          }
        }
      }
    }
    var state = instance.getPlayerState(player, item);
    if (state.NowPlayingItem) {
      var _state$PlayState;
      var serverId = state.NowPlayingItem.ServerId;
      var streamInfo = playerData.streamInfo;
      if (streamInfo && streamInfo.started || !enableLocalPlaylistManagement(player)) {
        reportPlayback(instance, state, player, reportPlaylist, serverId, 'reportPlaybackProgress', progressEventName, additionalData, isAutomated);
      }
      var sleepTimerMode = (_state$PlayState = state.PlayState) == null ? void 0 : _state$PlayState.SleepTimerMode;
      if (sleepTimerMode === 'AtTime') {
        var _state$PlayState2;
        var sleepTimerEndTime = (_state$PlayState2 = state.PlayState) == null ? void 0 : _state$PlayState2.SleepTimerEndTime;
        if (sleepTimerEndTime && Date.now() >= sleepTimerEndTime.getTime()) {
          instance.onSleepTimerFired(player);
        }
      }
    }
  }
  function PlaybackManager() {
    var self = this;
    var players = [];
    var currentTargetInfo;
    var currentPairingId = null;
    this._playQueueManager = new _playqueuemanager.default();
    self.getPlayerInfo = function (player) {
      if (!player) {
        player = self._currentPlayer;
      }
      if (!player) {
        return null;
      }
      var target = currentTargetInfo || {};
      return {
        name: player.name,
        isLocalPlayer: player.isLocalPlayer,
        id: target.id,
        playerName: target.playerName,
        deviceName: target.deviceName,
        playableMediaTypes: target.playableMediaTypes,
        supportedCommands: target.supportedCommands
      };
    };
    self.setActivePlayer = function (player, targetInfo) {
      if (player === 'localplayer' || player.name === 'localplayer') {
        if (self._currentPlayer && self._currentPlayer.isLocalPlayer) {
          return;
        }
        setCurrentPlayerInternal(null, null);
        return;
      }
      if (typeof player === 'string') {
        player = players.filter(function (p) {
          return p.name === player;
        })[0];
      }
      if (!player) {
        throw new Error('null player');
      }
      setCurrentPlayerInternal(player, targetInfo);
    };
    self.trySetActivePlayer = function (player, targetInfo) {
      if (player === 'localplayer' || player.name === 'localplayer') {
        if (self._currentPlayer && self._currentPlayer.isLocalPlayer) {
          self._isPairing = false;
          return;
        }
        self._isPairing = false;
        return;
      }
      if (typeof player === 'string') {
        player = players.filter(function (p) {
          return p.name === player;
        })[0];
      }
      if (!player) {
        throw new Error('null player');
      }
      if (currentPairingId === targetInfo.id) {
        self._isPairing = false;
        return;
      }
      currentPairingId = targetInfo.id;
      var promise = player.tryPair ? player.tryPair(targetInfo) : Promise.resolve();
      self._isPairing = true;
      _events.default.trigger(self, 'pairing');
      promise.then(function () {
        self._isPairing = false;
        _events.default.trigger(self, 'paired');
        setCurrentPlayerInternal(player, targetInfo);
      }, function () {
        self._isPairing = false;
        _events.default.trigger(self, 'pairerror');
        if (currentPairingId === targetInfo.id) {
          currentPairingId = null;
        }
      });
    };
    self.getTargets = function () {
      var promises = players.filter(displayPlayerIndividually).map(getPlayerTargets);
      return Promise.all(promises).then(function (responses) {
        var targets = [];
        for (var i = 0; i < responses.length; i++) {
          var subTargets = responses[i];
          for (var j = 0; j < subTargets.length; j++) {
            targets.push(subTargets[j]);
          }
        }
        targets = targets.sort(sortPlayerTargets);
        return targets;
      });
    };
    function removeCurrentPlayer(player) {
      var previousPlayer = self._currentPlayer;
      if (!previousPlayer || player.id === previousPlayer.id) {
        setCurrentPlayerInternal(null);
      }
    }
    function setCurrentPlayerInternal(player, targetInfo) {
      //console.log('setCurrentPlayerInternal: playerId: ' + player?.id + ', ' + new Error().stack);

      var previousPlayer = self._currentPlayer;
      var previousTargetInfo = currentTargetInfo;
      if (player && !targetInfo && player.isLocalPlayer) {
        targetInfo = createTarget(self, player);
      }
      if (player && !targetInfo) {
        throw new Error('targetInfo cannot be null');
      }
      currentPairingId = null;
      self._currentPlayer = player;
      currentTargetInfo = targetInfo;
      if (targetInfo && targetInfo.Id !== (previousTargetInfo == null ? void 0 : previousTargetInfo.Id)) {
        console.log('Active player: ' + JSON.stringify(targetInfo));
      }
      if (previousPlayer) {
        self.endPlayerUpdates(previousPlayer);
      }
      if (player) {
        self.beginPlayerUpdates(player);
      }
      triggerPlayerChange(self, player, targetInfo, previousPlayer, previousTargetInfo);
    }
    self.getPlayers = function () {
      return players;
    };
    self.setAudioStreamIndex = function (index, player) {
      if (!player) {
        player = self._currentPlayer;
      }
      if (player && !player.isLocalPlayer) {
        return player.setAudioStreamIndex(index);
      }
      if (self.playMethod(player) === 'Transcode' || !player.canSetAudioStreamIndex()) {
        return changeStream(player, getCurrentTicks(player), {
          AudioStreamIndex: index
        }, 'audiotrackchange');
      } else {
        // See if the player supports the track without transcoding
        return getDeviceProfile(player, self.currentItem(player)).then(function (profile) {
          if (isAudioStreamIndexSupported(self, self.currentMediaSource(player), index, profile)) {
            player.setAudioStreamIndex(index);
            getPlayerData(player).audioStreamIndex = index;
            _events.default.trigger(player, 'audiotrackchange');
          } else {
            return changeStream(player, getCurrentTicks(player), {
              AudioStreamIndex: index
            }, 'audiotrackchange');
          }
        });
      }
    };
    self.setMaxStreamingBitrate = function (options, player) {
      if (!player) {
        player = self._currentPlayer;
      }
      if (player && player.setMaxStreamingBitrate) {
        return player.setMaxStreamingBitrate(options);
      }
      var apiClient = _connectionmanager.default.getApiClient(self.currentItem(player));
      return apiClient.getEndpointInfo().then(function (endpointInfo) {
        var playerData = getPlayerData(player);
        var mediaType = playerData.streamInfo ? playerData.streamInfo.mediaType : null;
        var promise;
        if (options.enableAutomaticBitrateDetection) {
          _appsettings.default.enableAutomaticBitrateDetection(endpointInfo.NetworkType, mediaType, true);
          promise = apiClient.detectBitrate();
        } else {
          _appsettings.default.enableAutomaticBitrateDetection(endpointInfo.NetworkType, mediaType, false);
          promise = Promise.resolve(options.maxBitrate);
        }
        return promise.then(function (bitrate) {
          _appsettings.default.maxStreamingBitrate(endpointInfo.NetworkType, mediaType, bitrate);
          return changeStream(player, getCurrentTicks(player), {
            MaxStreamingBitrate: bitrate
          }, 'qualitychange');
        });
      });
    };
    self.setSubtitleStreamIndex = function (index, player, refreshMediaSource) {
      if (!player) {
        player = self._currentPlayer;
      }
      if (player && !player.isLocalPlayer) {
        return player.setSubtitleStreamIndex(index, refreshMediaSource);
      }
      var currentStream = self.getSubtitleStream(player);
      var newStream = getSubtitleStream(self, player, index);
      if (!currentStream && !newStream && !refreshMediaSource) {
        return;
      }
      var selectedTrackElementIndex = -1;
      var currentPlayMethod = self.playMethod(player);
      if (refreshMediaSource) {
        return changeStream(player, getCurrentTicks(player), {
          SubtitleStreamIndex: index
        }, 'subtitletrackchange');
      } else if (currentStream && !newStream) {
        if (getDeliveryMethod(currentStream) === 'Encode' || getDeliveryMethod(currentStream) === 'Embed' && currentPlayMethod === 'Transcode') {
          // Need to change the transcoded stream to remove subs
          return changeStream(player, getCurrentTicks(player), {
            SubtitleStreamIndex: -1
          }, 'subtitletrackchange');
        }
      } else if (!currentStream && newStream) {
        if (getDeliveryMethod(newStream) === 'External' || getDeliveryMethod(newStream) === 'Hls') {
          selectedTrackElementIndex = index;
        } else if (getDeliveryMethod(newStream) === 'VideoSideData') {
          selectedTrackElementIndex = index;
        } else if (getDeliveryMethod(newStream) === 'Embed' && currentPlayMethod !== 'Transcode') {
          selectedTrackElementIndex = index;
        } else {
          // Need to change the transcoded stream to add subs
          return changeStream(player, getCurrentTicks(player), {
            SubtitleStreamIndex: index
          }, 'subtitletrackchange');
        }
      } else if (currentStream && newStream) {
        // Switching tracks
        // We can handle this clientside if the new track is external or the new track is embedded and we're not transcoding
        if (getDeliveryMethod(newStream) === 'External' || getDeliveryMethod(newStream) === 'Hls' || getDeliveryMethod(newStream) === 'VideoSideData' || getDeliveryMethod(newStream) === 'Embed' && currentPlayMethod !== 'Transcode') {
          selectedTrackElementIndex = index;

          // But in order to handle this client side, if the previous track is being added via transcoding, we'll have to remove it
          if (getDeliveryMethod(currentStream) !== 'External' && getDeliveryMethod(currentStream) !== 'Hls' && getDeliveryMethod(currentStream) !== 'Embed' && getDeliveryMethod(currentStream) !== 'VideoSideData') {
            return changeStream(player, getCurrentTicks(player), {
              SubtitleStreamIndex: -1
            }, 'subtitletrackchange');
          }
        } else {
          // Need to change the transcoded stream to add subs
          return changeStream(player, getCurrentTicks(player), {
            SubtitleStreamIndex: index
          }, 'subtitletrackchange');
        }
      }
      var promise = player.setSubtitleStreamIndex(selectedTrackElementIndex);
      getPlayerData(player).subtitleStreamIndex = index;
      _events.default.trigger(player, 'subtitletrackchange');
      return promise;
    };
    self.seek = function (ticks, player) {
      ticks = Math.max(0, ticks);
      if (!player) {
        player = self._currentPlayer;
      }
      if (player && !enableLocalPlaylistManagement(player)) {
        if (player.isLocalPlayer) {
          return player.seek((ticks || 0) / 10000);
        } else {
          return player.seek(ticks);
        }
      }
      return changeStream(player, ticks);
    };
    function changeStream(player, ticks, params, progressEventName) {
      if (canPlayerSeek(self, player) && params == null) {
        player.currentTime(parseInt(ticks / 10000));
        return Promise.resolve();
      }
      var signal = new AbortController().signal;
      params = params || {};
      var liveStreamId = getPlayerData(player).streamInfo.liveStreamId;
      var lastMediaInfoQuery = getPlayerData(player).streamInfo.lastMediaInfoQuery;
      var playSessionId = self.playSessionId(player);
      var currentItem = self.currentItem(player);
      return getDeviceProfile(player, currentItem, {
        isRetry: params.EnableDirectPlay === false
      }).then(function (deviceProfile) {
        var audioStreamIndex = params.AudioStreamIndex == null ? getPlayerData(player).audioStreamIndex : params.AudioStreamIndex;
        var subtitleStreamIndex = params.SubtitleStreamIndex == null ? getPlayerData(player).subtitleStreamIndex : params.SubtitleStreamIndex;
        var currentMediaSource = self.currentMediaSource(player);
        var apiClient = _connectionmanager.default.getApiClient(currentItem);
        if (ticks) {
          ticks = parseInt(ticks);
        }
        var maxBitrate = params.MaxStreamingBitrate || self.getMaxStreamingBitrate(player);
        var currentPlayOptions = currentItem.playOptions || {};
        var enableAutomaticQuality = self.enableAutomaticBitrateDetection(player);
        return getPlaybackInfo(player, apiClient, currentItem, deviceProfile, maxBitrate, enableAutomaticQuality, ticks, true, currentMediaSource.Id, audioStreamIndex, subtitleStreamIndex, playSessionId, liveStreamId, params.EnableDirectPlay, params.EnableDirectStream, params.AllowVideoStreamCopy, params.AllowAudioStreamCopy, signal).then(function (result) {
          if (result.ErrorCode) {
            return Promise.reject({
              errorCode: result.ErrorCode
            });
          }
          currentMediaSource = result.MediaSources[0];
          var streamInfo = createStreamInfo(apiClient, currentItem.MediaType, currentItem, currentMediaSource, result.PlaySessionId, ticks);
          streamInfo.fullscreen = currentPlayOptions.fullscreen;
          streamInfo.lastMediaInfoQuery = lastMediaInfoQuery;
          if (!streamInfo.url) {
            return Promise.reject({
              errorCode: 'NoCompatibleStream',
              skipToNextItem: true
            });
          }
          getPlayerData(player).subtitleStreamIndex = subtitleStreamIndex;
          getPlayerData(player).audioStreamIndex = audioStreamIndex;
          getPlayerData(player).maxStreamingBitrate = maxBitrate;
          return changeStreamToUrl(apiClient, player, playSessionId, streamInfo, progressEventName, signal);
        });
      });
    }
    function changeStreamToUrl(apiClient, player, playSessionId, streamInfo, progressEventName, signal) {
      var playerData = getPlayerData(player);
      if (playerData.streamInfo && playSessionId) {
        return apiClient.stopActiveEncodings(playSessionId).then(function () {
          return setSrcIntoPlayer(apiClient, player, streamInfo, progressEventName, playSessionId, signal);
        });
      } else {
        return setSrcIntoPlayer(apiClient, player, streamInfo, progressEventName, null, signal);
      }
    }
    function setSrcIntoPlayer(apiClient, player, streamInfo, progressEventName, previousPlaySessionId, signal) {
      normalizePlayOptions(streamInfo);

      // do this earlier so that if the user presses stop during loading, the new playSessionId will be used to report stop
      getPlayerData(player).streamInfo = streamInfo;
      return player.play(streamInfo, signal).then(function () {
        streamInfo.started = true;
        if (progressEventName === 'subtitletrackchange' || progressEventName === 'audiotrackchange') {
          // these events will trigger a server progress update, so no need to explicitly do it here
          _events.default.trigger(player, progressEventName);
        } else {
          sendProgressUpdate(self, player, progressEventName || 'timeupdate');
        }

        // Even after trying to stop it, the player may still send requests to the original url
        if (previousPlaySessionId) {
          apiClient.stopActiveEncodings(previousPlaySessionId);
        }
      }, function (err) {
        console.error('player.play error: ' + err);

        // Even after trying to stop it, the player may still send requests to the original url
        if (previousPlaySessionId) {
          apiClient.stopActiveEncodings(previousPlaySessionId);
        }
        streamInfo.started = false;
        return onPlaybackError.call(player, err, {
          type: err && err.name ? err.name : 'mediadecodeerror',
          streamInfo: streamInfo,
          returnPromise: true
        });
      });
    }
    function playFromFetchedItems(options, items, showLoading, signal) {
      return translateItemsForPlayback(items, options, showLoading, null, signal).then(function (translatedResult) {
        return playWithIntros(translatedResult.Items, options, translatedResult.AutoPlay, signal).catch(function (err) {
          onUnhandledPlaybackFailure(self, err, options.fullscreen, signal);
        });
      });
    }
    self.play = function (options) {
      normalizePlayOptions(options);
      if (self._currentPlayer) {
        if (options.enableRemotePlayers === false && !self._currentPlayer.isLocalPlayer) {
          return Promise.reject();
        }
        if (!self._currentPlayer.isLocalPlayer) {
          var _options$items;
          if ((_options$items = options.items) != null && _options$items.length && options.items[0].Type === 'Chapter') {
            var firstItem = options.items[0];
            options.mediaSourceId = firstItem.MediaSourceId;
            options.serverId = firstItem.ServerId;
            options.ids = [firstItem.ItemId];
            options.items = null;
          }
          var signal = this.newAbortSignal();
          return self._currentPlayer.play(options, signal);
        }
      }
      if (options.items) {
        var _signal = this.newAbortSignal();
        return playFromFetchedItems(options, options.items, true, _signal);
      } else {
        if (!options.serverId) {
          throw new Error('serverId required!');
        }
        var _signal2 = this.newAbortSignal();
        if (options.fullscreen) {
          _loading.default.show();
        }
        return getItemsForPlayback(options.serverId, {
          Ids: options.ids.join(','),
          ProjectToMedia: true
        }, _signal2).then(function (result) {
          return playFromFetchedItems(options, result.Items, false, _signal2);
        });
      }
    };
    function playPhotos(options, setAsCurrentPlayer, signal) {
      var playStartIndex = options.startIndex || 0;
      var startItem = options.items[playStartIndex];
      var player = getPlayer(self, startItem, options);
      _loading.default.hide();
      return player.play(options, signal).then(function () {
        onPlaybackStarted(player, options, {
          item: startItem
        }, null, false, setAsCurrentPlayer);
      });
    }
    function getGenericPlayOptions(item) {
      return {
        item: item,
        mediaType: item.MediaType,
        mimeType: getMimeType(item.Type, item.Container),
        url: _connectionmanager.default.getApiClient(item).getItemOriginalFileUrl(item.Id)
      };
    }
    function playBooks(options, setAsCurrentPlayer, signal) {
      var playStartIndex = options.startIndex || 0;
      var startItem = options.items[playStartIndex];
      var player = getPlayer(self, startItem, options);
      _loading.default.hide();
      var playOptions = getGenericPlayOptions(startItem);
      return player.play(playOptions, signal).then(function () {
        onPlaybackStarted(player, options, playOptions, null, false, setAsCurrentPlayer);
      });
    }
    function playGames(options, signal) {
      var playStartIndex = options.startIndex || 0;
      var startItem = options.items[playStartIndex];
      var player = getPlayer(self, startItem, options);
      _loading.default.hide();
      var playOptions = getGenericPlayOptions(startItem);
      return player.play(playOptions, signal).then(function () {
        onPlaybackStarted(player, options, playOptions, null, false);
      });
    }
    function playWithIntrosInternal(items, firstItem, firstItemApiClient, playStartIndex, options, autoplay, signal) {
      return getIntros(firstItem, firstItemApiClient, options, signal).then(function (introsResult) {
        var introItems = introsResult.Items;

        // todo: improve this for episodes so that we can play the intros and still respect the start index
        // maybe a drop intros from queue option after playing?
        if (introItems.length && playStartIndex) {
          items = items.slice(playStartIndex);
          playStartIndex = 0;
        }
        var introPlayOptions;
        firstItem.playOptions = truncatePlayOptions(options);
        if (introItems.length) {
          introPlayOptions = {
            fullscreen: firstItem.playOptions.fullscreen
          };
        } else {
          introPlayOptions = firstItem.playOptions;
        }
        self._isBackgroundPlaybackHack = introPlayOptions.fullscreen === false;
        items = introItems.concat(items);
        for (var i = 0, length = items.length; i < length; i++) {
          if (!items[i].playOptions) {
            items[i].playOptions = copyPlayOptionsForNextItem(options);
          }
        }

        // Needed by players that manage their own playlist
        introPlayOptions.items = items;
        introPlayOptions.startIndex = playStartIndex;
        introPlayOptions.command = 'play';
        var itemToPlay = items[playStartIndex];
        return playInternal(itemToPlay, introPlayOptions, function () {
          self._playQueueManager.setPlaylist(items);
          self._playQueueManager.autoplay = autoplay !== false;
          setPlaylistState(self, itemToPlay.PlaylistItemId, playStartIndex);
          if (options.shuffle) {
            self._playQueueManager.setShuffle(true);
          }
        }, signal);
      });
    }
    function playWithIntros(items, options, autoplay, signal) {
      var playStartIndex = options.startIndex;
      if (playStartIndex == null) {
        if (options.shuffle && items.length) {
          playStartIndex = randomIntFromInterval(0, items.length);
        } else {
          playStartIndex = 0;
        }
      }
      var firstItem = items[playStartIndex];

      // If index was bad, reset it
      if (!firstItem) {
        playStartIndex = 0;
        firstItem = items[playStartIndex];
      }

      // If it's still null then there's nothing to play
      if (!firstItem) {
        return Promise.reject('NoPlayableItems');
      }
      var firstItemApiClient = _connectionmanager.default.getApiClient(firstItem);
      return firstItemApiClient.getCurrentUser({
        signal: signal
      }).then(function (user) {
        if (options.startPositionTicks == null) {
          options.startPositionTicks = firstItem.UserData ? firstItem.UserData.PlaybackPositionTicks || 0 : 0;
          if (options.startPositionTicks) {
            var resumeRewindTicks = (user.Configuration.ResumeRewindSeconds || 0) * 10000000;
            options.startPositionTicks = Math.max(0, options.startPositionTicks - resumeRewindTicks);
          }
        }
        return playWithIntrosInternal(items, firstItem, firstItemApiClient, playStartIndex, options, autoplay, signal);
      });
    }
    function playInternal(item, playOptions, onPlaybackStartedFn, signal) {
      // Normalize defaults to simplfy checks throughout the process
      normalizePlayOptions(playOptions);
      return runInterceptors(item, playOptions, signal).then(function () {
        if (playOptions.fullscreen) {
          _loading.default.show();
        }

        // TODO: This should be the media type requested, not the original media type
        var mediaType = item.MediaType;
        if (!isServerItem(item) || _apiclient.default.isLocalItem(item)) {
          return playAfterBitrateDetect(getSavedMaxStreamingBitrate(_connectionmanager.default.getApiClient(item), mediaType), true, item, playOptions, onPlaybackStartedFn, signal);
        }
        var apiClient = _connectionmanager.default.getApiClient(item);
        return detectBitrate(apiClient, mediaType, signal).then(function (qualityDetectionResult) {
          return playAfterBitrateDetect(qualityDetectionResult.bitrate, qualityDetectionResult.enableAutomaticQuality, item, playOptions, onPlaybackStartedFn, signal);
        });
      }, onInterceptorRejection);
    }
    self.setCurrentPlaylistItemAndIndex = function (newItem, newItemIndex, player) {
      if (newItem) {
        var newItemPlayOptions = newItem.playOptions || {};
        // when moving in the play queue, start from the beginning
        newItemPlayOptions.startPositionTicks = 0;
        newItemPlayOptions.command = 'setCurrentPlaylistItem';
        var signal = this.newAbortSignal();
        return playInternal(newItem, newItemPlayOptions, function () {
          setPlaylistState(self, newItem.PlaylistItemId, newItemIndex);
        }, signal).catch(function (err) {
          onUnhandledPlaybackFailure(self, err, true, signal);
        });
      }
      return Promise.reject();
    };
    function sendPlaybackListToPlayer(player, items, deviceProfile, maxBitrate, apiClient, startPositionTicks, mediaSourceId, audioStreamIndex, subtitleStreamIndex, startIndex, shuffle, fullscreen) {
      if (shuffle) {
        startIndex = 0;
        startPositionTicks = null;
        mediaSourceId = null;
        audioStreamIndex = null;
        subtitleStreamIndex = null;
      }
      return setStreamUrls(items, deviceProfile, maxBitrate, apiClient, startPositionTicks).then(function () {
        _loading.default.hide();
        return player.play({
          items: items,
          startPositionTicks: startPositionTicks || 0,
          mediaSourceId: mediaSourceId,
          audioStreamIndex: audioStreamIndex,
          subtitleStreamIndex: subtitleStreamIndex,
          startIndex: startIndex,
          fullscreen: fullscreen,
          shuffle: shuffle
        }).then(function () {
          onPlayQueueStartedFromSelfManagingPlayer.call(player, {});
        });
      });
    }
    function playNonServerItem(player, playOptions, streamInfo, onPlaybackStartedFn, signal) {
      onPlaybackRequested(player, playOptions, streamInfo);

      // do this earlier to make the queue available to the UI sooner
      onPlaybackStartedFn();
      return player.play(streamInfo, signal).then(function () {
        _loading.default.hide();
        onPlaybackStarted(player, playOptions, streamInfo);
      }, function (err) {
        // TODO: show error message
        _loading.default.hide();
        self.stop(player);
        throw err;
      });
    }
    function reDeterminePlayer(instance, mediaSource, existingPlayer) {
      // we shouldn't be checking for a specific domain here
      // this is just temporary while this is new
      if (existingPlayer != null && existingPlayer.isLocalPlayer) {
        var _mediaSource$Path, _mediaSource$Protocol;
        if ((_mediaSource$Path = mediaSource.Path) != null && _mediaSource$Path.toLowerCase().includes('youtube.com') && ((_mediaSource$Protocol = mediaSource.Protocol) == null ? void 0 : _mediaSource$Protocol.toLowerCase()) === 'http') {
          var _players = getAutomaticPlayers(instance, true);
          for (var i = 0, length = _players.length; i < length; i++) {
            var player = _players[i];
            if (player.canPlayUrl) {
              if (player.canPlayUrl(mediaSource.Path)) {
                return player;
              }
            }
          }
        }
      }
      return existingPlayer;
    }
    function playAfterBitrateDetect(maxBitrate, enableAutomaticQuality, item, playOptions, onPlaybackStartedFn, signal) {
      var activePlayer = self._currentPlayer;
      if (item.MediaType === "Photo" && activePlayer) {
        return playPhotos(playOptions, false, signal);
      }
      if (item.MediaType === "Book" && activePlayer) {
        return playBooks(playOptions, false, signal);
      }
      var startPosition = playOptions.startPositionTicks;
      var player = getPlayer(self, item, playOptions);
      var apiClient = isServerItem(item) ? _connectionmanager.default.getApiClient(item) : null;
      var streamInfo = createStreamInfo(apiClient, item.MediaType, item, null, null, startPosition);
      streamInfo.fullscreen = playOptions.fullscreen;
      var promise;
      if (activePlayer) {
        promise = onPlaybackChanging(activePlayer, player, item);
      } else {
        promise = Promise.resolve();
      }
      if (!isServerItem(item)) {
        return promise.then(function () {
          return playNonServerItem(player, playOptions, streamInfo, onPlaybackStartedFn, signal);
        });
      }
      if (item.MediaType === "Photo") {
        return playPhotos(playOptions, activePlayer == null, signal);
      }
      if (item.MediaType === 'Book') {
        return playBooks(playOptions, activePlayer == null, signal);
      }
      if (item.MediaType === 'Game') {
        return playGames(playOptions, signal);
      }
      return Promise.all([promise, getDeviceProfile(player, item)]).then(function (responses) {
        if (player && player.isLocalPlayer && enableLocalPlaylistManagement(player)) {
          onPlaybackRequested(player, playOptions, streamInfo);
        }
        var deviceProfile = responses[1];
        var mediaSourceId = playOptions.mediaSourceId;
        var audioStreamIndex = playOptions.audioStreamIndex;
        var subtitleStreamIndex = playOptions.subtitleStreamIndex;
        if (player && !enableLocalPlaylistManagement(player)) {
          var fullscreen = streamInfo.fullscreen;
          return sendPlaybackListToPlayer(player, playOptions.items, deviceProfile, maxBitrate, apiClient, startPosition, mediaSourceId, audioStreamIndex, subtitleStreamIndex, playOptions.startIndex, playOptions.shuffle, fullscreen);
        }

        // this reference was only needed by sendPlaybackListToPlayer
        playOptions.items = null;
        return getPlaybackMediaSource(player, apiClient, deviceProfile, maxBitrate, enableAutomaticQuality, item, startPosition, mediaSourceId, audioStreamIndex, subtitleStreamIndex, signal).then(function (mediaSourceInfo) {
          var mediaSource = mediaSourceInfo.mediaSource;
          player = reDeterminePlayer(self, mediaSource, player);
          if (mediaSource.Container === 'disc') {
            _loading.default.hide();
            return Promise.reject({
              errorCode: 'PlaceHolder',
              skipToNextItem: true
            });
          }
          Object.assign(streamInfo, createStreamInfo(apiClient, item.MediaType, item, mediaSource, mediaSourceInfo.playSessionId, startPosition));
          var playerData = getPlayerData(player);
          playerData.maxStreamingBitrate = maxBitrate;

          // do this earlier to make the queue available to the UI sooner
          onPlaybackStartedFn();
          console.log('playing with ' + player.id);
          return player.play(streamInfo, signal).then(function () {
            // the osd will handle this for video
            if (item.MediaType === 'Audio' || !playOptions.fullscreen || player.isExternalPlayer) {
              _loading.default.hide();
            }
            onPlaybackStarted(player, playOptions, streamInfo, mediaSource);
          }, function (err) {
            console.log('player.play error: ' + err);

            // TODO: Improve this because it will report playback start on a failure
            return onPlaybackStarted(player, playOptions, streamInfo, mediaSource).finally(function () {
              if (signal.aborted) {
                return onPlaybackStopped.call(player, err, {
                  errorCode: 'Aborted',
                  playNext: false,
                  reportNext: true,
                  // this needs awareness from the UI about whether all playback is being cancelled or not
                  resetPlayQueue: false
                });
              }
              return onPlaybackError.call(player, err, {
                type: err && err.name ? err.name : 'mediadecodeerror',
                streamInfo: streamInfo,
                returnPromise: true,
                // this needs awareness from the UI about whether all playback is being cancelled or not
                resetPlayQueue: false
              });
            });
          });
        });
      });
    }
    function onPlayerProgressInterval() {
      var player = this;
      sendProgressUpdate(self, player, 'timeupdate', null, null, true);
    }
    function startPlaybackProgressTimer(player) {
      stopPlaybackProgressTimer(player);
      player._progressInterval = new _methodtimer.default({
        onInterval: onPlayerProgressInterval.bind(player),
        timeoutMs: 10000,
        type: 'interval'
      });
    }
    function onPlaybackRequested(player, playOptions, streamInfo, mediaSource, setCurrentPlayer) {
      if (!player) {
        throw new Error('player cannot be null');
      }

      //console.log('onPlaybackRequested: ' + streamInfo?.item?.Id);

      if (setCurrentPlayer !== false) {
        setCurrentPlayerInternal(player);
      }
      var playerData = getPlayerData(player);
      streamInfo.isInitialRequest = true;
      streamInfo.playbackStartTimeTicks = Date.now() * 10000;
      playerData.streamInfo = streamInfo;
      if (mediaSource) {
        playerData.audioStreamIndex = mediaSource.DefaultAudioStreamIndex;
        playerData.subtitleStreamIndex = mediaSource.DefaultSubtitleStreamIndex;
        if (playerData.subtitleStreamIndex == null) {
          playerData.subtitleStreamIndex = -1;
        }
      } else {
        playerData.audioStreamIndex = null;
        playerData.subtitleStreamIndex = null;
      }
      var isFirstItem = playOptions.command === 'play';
      var state = self.getPlayerState(player, streamInfo.item, streamInfo.mediaSource);
      if (isFirstItem) {
        //events.trigger(self, 'playqueuestart', [player, state]);
      }
      _events.default.trigger(player, 'playbackrequest', [state]);
      _events.default.trigger(self, 'playbackrequest', [player, state]);
    }
    function onPlaybackStarted(player, playOptions, streamInfo, mediaSource, enableProgressTimer, setCurrentPlayer) {
      var _state$PlayState3;
      if (!player) {
        throw new Error('player cannot be null');
      }
      if (setCurrentPlayer !== false) {
        setCurrentPlayerInternal(player);
      }
      var playerData = getPlayerData(player);
      streamInfo.isInitialRequest = null;
      playerData.streamInfo = streamInfo;
      streamInfo.playbackStartTimeTicks = Date.now() * 10000;
      if (mediaSource) {
        playerData.audioStreamIndex = mediaSource.DefaultAudioStreamIndex;
        playerData.subtitleStreamIndex = mediaSource.DefaultSubtitleStreamIndex;
        if (playerData.subtitleStreamIndex == null) {
          playerData.subtitleStreamIndex = -1;
        }
      } else {
        playerData.audioStreamIndex = null;
        playerData.subtitleStreamIndex = null;
      }
      var isFirstItem = playOptions.command === 'play';
      var state = self.getPlayerState(player, streamInfo.item, streamInfo.mediaSource);
      var promise;
      if (enableProgressTimer !== false) {
        // TODO: Maybe reporting can later be enabled for photos, games, and books

        promise = reportPlayback(self, state, player, isFirstItem, state.NowPlayingItem.ServerId, 'reportPlaybackStart');
      }
      if (isFirstItem) {
        _events.default.trigger(self, 'playqueuestart', [player, state]);
      }
      _events.default.trigger(player, 'playbackstart', [state]);
      _events.default.trigger(self, 'playbackstart', [player, state]);

      // only used internally as a safeguard to avoid reporting other events to the server before playback start
      streamInfo.started = true;
      if (enableProgressTimer !== false) {
        startPlaybackProgressTimer(player);
      }
      var sleepTimerMode = (_state$PlayState3 = state.PlayState) == null ? void 0 : _state$PlayState3.SleepTimerMode;
      if (sleepTimerMode === 'AfterItem') {
        self.onSleepTimerFired(player);
      }
      return promise || Promise.resolve();
    }
    function onPlayQueueStartedFromSelfManagingPlayer(e, item, mediaSource) {
      var player = this;
      var state = self.getPlayerState(player, item, mediaSource);
      _events.default.trigger(self, 'playqueuestart', [player, state]);
    }
    function onSleepTimerFiredFromSelfManagingPlayer(e) {
      var player = this;
      self.onSleepTimerFired(player);
    }
    function onPlaybackStartedFromSelfManagingPlayer(e, item, mediaSource) {
      var player = this;
      setCurrentPlayerInternal(player);
      var state = self.getPlayerState(player, item, mediaSource);
      _events.default.trigger(player, 'playbackstart', [state]);
      _events.default.trigger(self, 'playbackstart', [player, state]);
    }
    function onPlaybackStoppedFromSelfManagingPlayer(e, playerStopInfo) {
      var player = this;
      stopPlaybackProgressTimer(player);
      var state = self.getPlayerState(player, playerStopInfo.item, playerStopInfo.mediaSource);
      var nextMediaType = playerStopInfo.nextMediaType;
      var playbackStopInfo = {
        player: player,
        state: state,
        nextMediaType: nextMediaType
      };
      state.NextMediaType = nextMediaType;
      getPlayerData(player).streamInfo = null;
      if (isServerItem(playerStopInfo.item)) {
        state.PlayState.PositionTicks = (playerStopInfo.positionMs || 0) * 10000;
      }
      _events.default.trigger(player, 'playbackstop', [state]);
      _events.default.trigger(self, 'playbackstop', [playbackStopInfo]);
      if (!nextMediaType) {
        destroyPlayer(player);
        removeCurrentPlayer(player);
      }
    }
    function onPlaybackError(e, error) {
      var player = this;

      // network
      // mediadecodeerror
      // medianotsupported
      var errorType = error.type;
      console.log('playbackmanager playback error type: ' + (errorType || ''));
      var streamInfo = error.streamInfo || getPlayerData(player).streamInfo;
      if (streamInfo) {
        var transcodingFallbackOptions = self.getTranscodingFallbackOptions(player, error);

        // Auto switch to transcoding
        if (transcodingFallbackOptions.canTrigger) {
          var startTime = getCurrentTicks(player) || streamInfo.playerStartPositionTicks;
          return changeStream(player, startTime, {
            // force transcoding
            EnableDirectPlay: false,
            EnableDirectStream: false,
            AllowVideoStreamCopy: streamInfo.playMethod === 'Transcode' ? false : null,
            AllowAudioStreamCopy: transcodingFallbackOptions.currentlyPreventsAudioStreamCopy || transcodingFallbackOptions.currentlyPreventsVideoStreamCopy ? false : null
          });
        }
      }
      return onPlaybackStopped.call(player, e, {
        errorCode: 'NoCompatibleStream',
        returnPromise: error.returnPromise
      });
    }
    function onPlaybackStopped(e, playerStopInfo) {
      var player = this;
      console.log('onPlaybackStopped');
      var playerData = getPlayerData(player);
      stopPlaybackProgressTimer(player);
      if (!playerStopInfo) {
        playerStopInfo = {};
      }

      // User clicked stop or content ended
      var state = playerStopInfo.playerState || self.getPlayerState(player);
      var streamInfo = playerStopInfo.streamInfo || playerData.streamInfo;
      playerData.streamInfo = null;
      var isCurrentPlayer = player === self.getCurrentPlayer();
      var nextItemToReport = isCurrentPlayer && (playerStopInfo.playNext !== false || playerStopInfo.reportNext) ? self._playQueueManager.getNextItemInfo() : null;
      var nextItem = isCurrentPlayer && playerStopInfo.playNext !== false ? self._playQueueManager.getNextItemInfo() : null;
      var playNextItem = true;
      var currentItem = streamInfo == null ? void 0 : streamInfo.item;
      if (currentItem && isServerItem(currentItem)) {
        if (player.supportsProgress === false && state.PlayState && !state.PlayState.PositionTicks) {
          state.PlayState.PositionTicks = currentItem.RunTimeTicks;
          nextItemToReport = null;
          nextItem = null;
        }
      }
      if (player.supportsProgress === false || player.isExternalPlayer) {
        nextItemToReport = null;
        nextItem = null;
      }
      if (self._playQueueManager.autoplay === false && (currentItem == null ? void 0 : currentItem.Type) === 'Episode') {
        playNextItem = false;
        if (!_usersettings.default.enableNextVideoInfoOverlay()) {
          // need to keep the play queue
          nextItemToReport = null;
          nextItem = null;
        }
      }
      var nextMediaType = nextItemToReport ? nextItemToReport.item.MediaType : null;
      var playbackStopInfo = {
        player: player,
        state: state,
        nextMediaType: nextMediaType
      };
      state.NextMediaType = nextMediaType;
      console.log('nextMediaType: ' + nextMediaType);
      if (playerStopInfo.resetPlayQueue !== false) {
        if (!nextItem && isCurrentPlayer) {
          self._playQueueManager.reset();
        }
      }
      var reportPlaybackPromise;
      if (currentItem && isServerItem(currentItem)) {
        reportPlaybackPromise = reportPlayback(self, state, player, !nextItemToReport, currentItem.ServerId, 'reportPlaybackStopped');
      }
      _events.default.trigger(player, 'playbackstop', [state]);
      _events.default.trigger(self, 'playbackstop', [playbackStopInfo]);
      var nextItemPlayOptions = nextItemToReport ? nextItemToReport.item.playOptions || getDefaultPlayOptions() : getDefaultPlayOptions();
      var newPlayer = nextItemToReport ? getPlayer(self, nextItemToReport.item, nextItemPlayOptions) : null;
      if (newPlayer !== player) {
        destroyPlayer(player);
        removeCurrentPlayer(player);
      }
      return (reportPlaybackPromise || Promise.resolve()).finally(function () {
        if (!isCurrentPlayer) {
          // photo player reporting stop during audio playback
          return;
        }
        if (!playNextItem) {
          nextItem = null;
        }
        if (playerStopInfo.errorCode) {
          // This is at the time of attempting to play
          if (playerStopInfo.returnPromise) {
            return Promise.reject(playerStopInfo);
          }

          // This is a failure in the middle of playback
          showPlaybackErrorMessage(self, null, playerStopInfo.errorCode, streamInfo ? streamInfo.fullscreen : true, nextItem);
          return;
        }
        if (nextItem) {
          self.nextTrack();
          return;
        }

        // restart the live tv channel if it ended due to EOF
        if (streamInfo && isServerItem(currentItem) && currentItem.Type === 'TvChannel') {
          var runtimeTicks = (streamInfo.mediaSource || {}).RunTimeTicks;
          console.log('channel runtimeTicks: ' + runtimeTicks);

          // do the comparison in ms in case the player reported a smaller value
          if (runtimeTicks) {
            var _state$PlayState4;
            var positionTicks = (_state$PlayState4 = state.PlayState) == null ? void 0 : _state$PlayState4.PositionTicks;
            console.log('channel positionTicks: ' + positionTicks);

            // add 5 seconds to the position just in case the ending time of the player is slightly less than the runtime
            if (Math.ceil(positionTicks || 0) / 10000 + 5000 >= Math.floor(runtimeTicks / 10000)) {
              console.log('restarting live channel');
              self.play({
                items: [currentItem]
              });
            }
          }
        }
      });
    }
    function onPlaybackChanging(activePlayer, newPlayer, newItem) {
      var state = self.getPlayerState(activePlayer);

      // User started playing something new while existing content is playing
      var promise;
      stopPlaybackProgressTimer(activePlayer);
      unbindStopped(activePlayer);
      if (activePlayer === newPlayer) {
        // If we're staying with the same player, stop it
        promise = activePlayer.stop(false);
      } else {
        // If we're switching players, tear down the current one
        promise = activePlayer.stop(true);
      }
      console.log('onPlaybackChanging');
      return promise.then(function () {
        var streamInfo = getPlayerData(activePlayer).streamInfo;
        getPlayerData(activePlayer).streamInfo = null;
        bindStopped(activePlayer);
        var nextMediaType = newItem.MediaType;
        state.NextMediaType = nextMediaType;
        return onPlaybackStopped.call(activePlayer, {}, {
          errorCode: 'Aborted',
          playNext: false,
          reportNext: true,
          // this needs awareness from the UI about whether all playback is being cancelled or not
          resetPlayQueue: false,
          playerState: state,
          streamInfo: streamInfo
        });
      });
    }
    function bindStopped(player) {
      if (enableLocalPlaylistManagement(player)) {
        _events.default.off(player, 'stopped', onPlaybackStopped);
        _events.default.on(player, 'stopped', onPlaybackStopped);
      }
    }
    function onPlaybackTimeUpdate(e) {
      var player = this;
      sendProgressUpdate(self, player, 'timeupdate');
    }
    function onAudioTrackChange(e) {
      var player = this;
      sendProgressUpdate(self, player, 'audiotrackchange');
    }
    function onSubtitleTrackChange(e) {
      var player = this;
      sendProgressUpdate(self, player, 'subtitletrackchange');
    }
    function onPlaybackPause(e) {
      var player = this;
      if (enableLocalPlaylistManagement(player)) {
        sendProgressUpdate(self, player, 'pause');
      }
      _events.default.trigger(self, 'pause', [player]);
    }
    function onPlaybackUnpause(e) {
      var player = this;
      if (enableLocalPlaylistManagement(player)) {
        sendProgressUpdate(self, player, 'unpause');
      }
      _events.default.trigger(self, 'unpause', [player]);
    }
    function onPlaybackVolumeChange(e) {
      var player = this;
      sendProgressUpdate(self, player, 'volumechange');
    }
    function onRepeatModeChange(e) {
      var player = this;
      sendProgressUpdate(self, player, 'repeatmodechange');
    }
    function onSleepTimerChange(e) {
      var player = this;
      sendProgressUpdate(self, player, 'sleeptimerchange');
    }
    function onShuffleChange(e) {
      var player = this;
      sendProgressUpdate(self, player, 'shufflechange');
      _events.default.trigger(player, 'playlistitemmove', []);
    }
    function onSubtitleOffsetChange(e) {
      var player = this;
      sendProgressUpdate(self, player, 'subtitleoffsetchange');
    }
    function onPlaybackRateChange(e) {
      var player = this;
      sendProgressUpdate(self, player, 'playbackratechange');
    }
    function onPlaylistItemMove(e) {
      var player = this;
      sendProgressUpdate(self, player, 'playlistitemmove', true);
    }
    function onPlaylistItemRemove(e, info) {
      var player = this;
      sendProgressUpdate(self, player, 'playlistitemremove', true, {
        PlaylistItemIds: info ? info.PlaylistItemIds : null
      });
    }
    function onPlaylistItemAdd(e) {
      var player = this;
      sendProgressUpdate(self, player, 'playlistitemadd', true);
    }
    function onPlayerShutdown(e) {
      var player = this;
      removeCurrentPlayer(player);
    }
    function unbindStopped(player) {
      _events.default.off(player, 'stopped', onPlaybackStopped);
    }
    function initMediaPlayer(player) {
      players.push(player);
      players.sort(function (a, b) {
        return (a.priority || 0) - (b.priority || 0);
      });
      if (player.isLocalPlayer !== false) {
        player.isLocalPlayer = true;
      }
      player.currentState = {};
      if (!player.getVolume || !player.setVolume) {
        initLegacyVolumeMethods(player);
      }
      if (enableLocalPlaylistManagement(player)) {
        _events.default.on(player, 'error', onPlaybackError);
        _events.default.on(player, 'timeupdate', onPlaybackTimeUpdate);
        _events.default.on(player, 'audiotrackchange', onAudioTrackChange);
        _events.default.on(player, 'subtitletrackchange', onSubtitleTrackChange);
        _events.default.on(player, 'pause', onPlaybackPause);
        _events.default.on(player, 'unpause', onPlaybackUnpause);
        _events.default.on(player, 'volumechange', onPlaybackVolumeChange);
        _events.default.on(player, 'repeatmodechange', onRepeatModeChange);
        _events.default.on(player, 'sleeptimerchange', onSleepTimerChange);
        _events.default.on(player, 'shufflechange', onShuffleChange);
        _events.default.on(player, 'subtitleoffsetchange', onSubtitleOffsetChange);
        _events.default.on(player, 'playbackratechange', onPlaybackRateChange);
        _events.default.on(player, 'playlistitemmove', onPlaylistItemMove);
        _events.default.on(player, 'playlistitemremove', onPlaylistItemRemove);
        _events.default.on(player, 'playlistitemadd', onPlaylistItemAdd);
      } else if (player.isLocalPlayer) {
        _events.default.on(player, 'pause', onPlaybackPause);
        _events.default.on(player, 'unpause', onPlaybackUnpause);
        _events.default.on(player, 'itemstarted', onPlaybackStartedFromSelfManagingPlayer);
        _events.default.on(player, 'itemstopped', onPlaybackStoppedFromSelfManagingPlayer);
        _events.default.on(player, 'playqueuestarted', onPlayQueueStartedFromSelfManagingPlayer);
        _events.default.on(player, 'sleeptimerfired', onSleepTimerFiredFromSelfManagingPlayer);
        _events.default.on(player, 'audiotrackchange', onAudioTrackChange);
        _events.default.on(player, 'subtitletrackchange', onSubtitleTrackChange);
        _events.default.on(player, 'subtitleoffsetchange', onSubtitleOffsetChange);
        _events.default.on(player, 'playbackratechange', onPlaybackRateChange);
        _events.default.on(player, 'playlistitemmove', onPlaylistItemMove);
        _events.default.on(player, 'playlistitemremove', onPlaylistItemRemove);
        _events.default.on(player, 'playlistitemadd', onPlaylistItemAdd);
        _events.default.on(player, 'shutdown', onPlayerShutdown);
      }
      if (player.isLocalPlayer) {
        bindToFullscreenChange(player);
      }
      bindStopped(player);
    }
    _events.default.on(_pluginmanager.default, 'registered', function (e, plugin) {
      if (plugin.type === 'mediaplayer') {
        initMediaPlayer(plugin);
      }
    });
    _pluginmanager.default.ofType('mediaplayer').map(initMediaPlayer);
    self.onAppClose = function () {
      var player = this._currentPlayer;

      // Try to report playback stopped before the app closes
      if (player && player.isLocalPlayer && enableLocalPlaylistManagement(player) && this.isPlaying(player)) {
        this._playQueueManager.reset();
        onPlaybackStopped.call(player);
      }
    };
    self.triggerTranscodingFallback = function (player) {
      if (!player) {
        player = this._currentPlayer;
      }
      if (player && !enableLocalPlaylistManagement(player)) {
        return player.triggerTranscodingFallback();
      }
      var err = new Error('Playback Correction');
      return onPlaybackError.call(player, err, {
        type: 'mediadecodeerror',
        returnPromise: true,
        // this needs awareness from the UI about whether all playback is being cancelled or not
        resetPlayQueue: false
      });
    };
  }
  PlaybackManager.prototype.getTranscodingFallbackOptions = function (player, error) {
    if (!player) {
      player = this._currentPlayer;
    }

    // network
    // mediadecodeerror
    // medianotsupported
    var errorType = error.type;
    var streamInfo = error.streamInfo || getPlayerData(player).streamInfo;
    if (streamInfo) {
      var currentlyPreventsVideoStreamCopy = streamInfo.url.toLowerCase().includes('allowvideostreamcopy=false');
      var currentlyPreventsAudioStreamCopy = streamInfo.url.toLowerCase().includes('allowaudiostreamcopy=false');
      var item = streamInfo.item;

      // Auto switch to transcoding
      if (item && !_apiclient.default.isLocalItem(item) && enablePlaybackRetryWithTranscoding(streamInfo, errorType, currentlyPreventsVideoStreamCopy, currentlyPreventsAudioStreamCopy)) {
        var apiClient = _connectionmanager.default.getApiClient(item);
        var user = apiClient.getCurrentUserCached();
        if (user != null && user.Policy.EnablePlaybackRemuxing) {
          return {
            canTrigger: true,
            currentlyPreventsVideoStreamCopy: currentlyPreventsVideoStreamCopy,
            currentlyPreventsAudioStreamCopy: currentlyPreventsAudioStreamCopy
          };
        }
      }
    }
    return {
      canTrigger: false
    };
  };
  PlaybackManager.prototype.canTriggerTranscodingFallback = function (player) {
    return this.getTranscodingFallbackOptions(player, {
      type: 'transcodingfallback'
    }).canTrigger;
  };
  PlaybackManager.prototype.currentItem = function (player) {
    if (!player) {
      player = this._currentPlayer;
    }
    if (!player) {
      return null;
    }
    if (player.currentItem) {
      return player.currentItem();
    }
    var data = getPlayerData(player);
    return data.streamInfo ? data.streamInfo.item : null;
  };
  PlaybackManager.prototype.currentMediaSource = function (player) {
    if (!player) {
      throw new Error('player cannot be null');
    }
    if (player.currentMediaSource) {
      return player.currentMediaSource();
    }
    var data = getPlayerData(player);
    return data.streamInfo ? data.streamInfo.mediaSource : null;
  };
  PlaybackManager.prototype.playMethod = function (player) {
    if (!player) {
      throw new Error('player cannot be null');
    }
    if (player.playMethod) {
      return player.playMethod();
    }
    var data = getPlayerData(player);
    return data.streamInfo ? data.streamInfo.playMethod : null;
  };
  PlaybackManager.prototype.playSessionId = function (player) {
    if (!player) {
      throw new Error('player cannot be null');
    }
    if (player.playSessionId) {
      return player.playSessionId();
    }
    var data = getPlayerData(player);
    return data.streamInfo ? data.streamInfo.playSessionId : null;
  };
  PlaybackManager.prototype.isPairing = function () {
    return this._isPairing;
  };
  PlaybackManager.prototype.getPlaylist = function (options, player) {
    if (!player) {
      player = this._currentPlayer;
    }
    if (player && !enableLocalPlaylistManagement(player)) {
      return player.getPlaylist(options);
    }
    return Promise.resolve(this._playQueueManager.getPlaylistResult(options));
  };
  PlaybackManager.prototype.isPlaying = function (player) {
    if (!player) {
      player = this._currentPlayer;
    }
    if (player) {
      if (player.isPlaying) {
        return player.isPlaying();
      }
    }
    if (player && enableLocalPlaylistManagement(player)) {
      return getPlayerData(player).streamInfo != null;
    }

    // for backwards compatibility, but ideally we should never get here anymore
    return player != null && player.currentSrc() != null;
  };
  PlaybackManager.prototype.isPlayingMediaType = function (mediaTypes, player) {
    if (!player) {
      player = this._currentPlayer;
    }
    if (!Array.isArray(mediaTypes)) {
      mediaTypes = [mediaTypes];
    }
    if (player) {
      if (player.isPlaying) {
        return mediaTypes.filter(function (mediaType) {
          return player.isPlaying(mediaType);
        }).length > 0;
      }
    }
    if (this.isPlaying(player)) {
      var playerData = getPlayerData(player);
      var streamInfo = playerData.streamInfo;
      var currentMediaType = streamInfo ? streamInfo.mediaType : null;
      return currentMediaType && mediaTypes.includes(currentMediaType);
    }
    return false;
  };
  PlaybackManager.prototype.isPlayingLocally = function (mediaTypes, player) {
    if (!player) {
      player = this._currentPlayer;
    }
    if (!player || !player.isLocalPlayer) {
      return false;
    }
    return this.isPlayingMediaType(mediaTypes, player);
  };
  PlaybackManager.prototype.isPlayingVideo = function (player) {
    return this.isPlayingMediaType(['Video'], player);
  };
  PlaybackManager.prototype.isPlayingAudio = function (player) {
    return this.isPlayingMediaType(['Audio'], player);
  };
  PlaybackManager.prototype.canPlay = function (item) {
    var itemType = item.Type;
    switch (itemType) {
      // fast track these to avoid constantly going through the player logic
      case 'PhotoAlbum':
      case 'MusicGenre':
      case 'Genre':
      case 'Season':
      case 'Series':
      case 'BoxSet':
      case 'MusicAlbum':
      case 'MusicArtist':
      case 'Playlist':
      case 'Movie':
      case 'MusicVideo':
      case 'Trailer':
      case 'Video':
      case 'TvChannel':
      case 'Audio':
      case 'Tag':
      case 'Studio':
      case 'Folder':
      case 'Photo':
        return true;
      // fast track these to avoid constantly going through the player logic
      case 'Episode':
        return item.LocationType !== "Virtual";
      // fast track these to avoid constantly going through the player logic
      case 'GameSystem':
      case 'Person':
      case 'GameGenre':
        return false;
      case 'Program':
        if (!item.EndDate || !item.StartDate) {
          return false;
        }
        if (Date.now() > Date.parse(item.EndDate) || Date.now() < Date.parse(item.StartDate)) {
          return false;
        }
        // fast track these to avoid constantly going through the player logic
        return true;
      case 'CollectionFolder':
        if (item.CollectionType === 'boxsets') {
          return false;
        }
        if (item.CollectionType === 'playlists') {
          return false;
        }
        break;
      default:
        if (item.LocationType === "Virtual") {
          return false;
        }
        break;
    }
    //alert(item.Type);
    //const mediaType = item.MediaType;
    return getPlayer(this, item, getDefaultPlayOptions()) != null;
  };
  PlaybackManager.prototype.changeAudioStream = function (player) {
    if (!player) {
      player = this._currentPlayer;
    }
    if (player && !enableLocalPlaylistManagement(player)) {
      return player.changeAudioStream();
    }
    if (!player) {
      return Promise.resolve();
    }
    var currentMediaSource = this.currentMediaSource(player);
    var mediaStreams = [];
    var i, length;
    for (i = 0, length = currentMediaSource.MediaStreams.length; i < length; i++) {
      if (currentMediaSource.MediaStreams[i].Type === 'Audio') {
        mediaStreams.push(currentMediaSource.MediaStreams[i]);
      }
    }

    // Nothing to change
    if (mediaStreams.length <= 1) {
      return Promise.resolve();
    }
    var currentStreamIndex = this.getAudioStreamIndex(player);
    var indexInList = -1;
    for (i = 0, length = mediaStreams.length; i < length; i++) {
      if (mediaStreams[i].Index === currentStreamIndex) {
        indexInList = i;
        break;
      }
    }
    var nextIndex = indexInList + 1;
    if (nextIndex >= mediaStreams.length) {
      nextIndex = 0;
    }
    nextIndex = nextIndex === -1 ? -1 : mediaStreams[nextIndex].Index;
    return this.setAudioStreamIndex(nextIndex, player);
  };
  PlaybackManager.prototype.changeSubtitleStream = function (player) {
    if (!player) {
      player = this._currentPlayer;
    }
    if (!player) {
      return Promise.resolve();
    }
    var currentMediaSource = this.currentMediaSource(player);
    var mediaStreams = [];
    var i, length;
    for (i = 0, length = currentMediaSource.MediaStreams.length; i < length; i++) {
      if (currentMediaSource.MediaStreams[i].Type === 'Subtitle') {
        mediaStreams.push(currentMediaSource.MediaStreams[i]);
      }
    }

    // No known streams, nothing to change
    if (!mediaStreams.length) {
      return Promise.resolve();
    }
    var currentStreamIndex = this.getSubtitleStreamIndex(player);
    var indexInList = -1;
    for (i = 0, length = mediaStreams.length; i < length; i++) {
      if (mediaStreams[i].Index === currentStreamIndex) {
        indexInList = i;
        break;
      }
    }
    var nextIndex = indexInList + 1;
    if (nextIndex >= mediaStreams.length) {
      nextIndex = -1;
    }
    nextIndex = nextIndex === -1 ? -1 : mediaStreams[nextIndex].Index;
    return this.setSubtitleStreamIndex(nextIndex, player);
  };
  PlaybackManager.prototype.getAudioStreamIndex = function (player) {
    if (!player) {
      player = this._currentPlayer;
    }
    if (player && !enableLocalPlaylistManagement(player)) {
      return player.getAudioStreamIndex();
    }
    return getPlayerData(player).audioStreamIndex;
  };
  PlaybackManager.prototype.isAudioStreamSupported = function (stream, mediaSource, deviceProfile) {
    var audioCodec = (stream.Codec || '').toLowerCase();
    var container = (mediaSource.Container || '').toLowerCase();
    if (!deviceProfile) {
      // This should never happen
      return true;
    }
    var profiles = deviceProfile.DirectPlayProfiles || [];
    return profiles.filter(function (p) {
      if (p.Type === 'Video') {
        if (p.Container) {
          if (!formatIncludesValue(p.Container, container)) {
            return false;
          }
        }
        if (p.AudioCodec) {
          if (!formatIncludesValue(p.AudioCodec, audioCodec)) {
            return false;
          }
        }
        return true;
      }
      return false;
    }).length > 0;
  };
  PlaybackManager.prototype.getMaxStreamingBitrate = function (player) {
    if (!player) {
      player = this._currentPlayer;
    }
    if (player && player.getMaxStreamingBitrate) {
      return player.getMaxStreamingBitrate();
    }
    var playerData = getPlayerData(player);
    if (playerData.maxStreamingBitrate) {
      return playerData.maxStreamingBitrate;
    }
    var mediaType = playerData.streamInfo ? playerData.streamInfo.mediaType : null;
    var currentItem = this.currentItem(player);
    var apiClient = currentItem ? _connectionmanager.default.getApiClient(currentItem) : _connectionmanager.default.currentApiClient();
    return getSavedMaxStreamingBitrate(apiClient, mediaType);
  };
  PlaybackManager.prototype.enableAutomaticBitrateDetection = function (player) {
    if (!player) {
      player = this._currentPlayer;
    }
    if (player && player.enableAutomaticBitrateDetection) {
      return player.enableAutomaticBitrateDetection();
    }
    var playerData = getPlayerData(player);
    var mediaType = playerData.streamInfo ? playerData.streamInfo.mediaType : null;
    var currentItem = this.currentItem(player);
    var apiClient = currentItem ? _connectionmanager.default.getApiClient(currentItem) : _connectionmanager.default.currentApiClient();
    var endpointInfo = apiClient.getSavedEndpointInfo() || {};
    return _appsettings.default.enableAutomaticBitrateDetection(endpointInfo.NetworkType, mediaType);
  };
  PlaybackManager.prototype.isFullscreen = function (player) {
    if (!player) {
      player = this._currentPlayer;
    }
    if (!player.isLocalPlayer || player.isFullscreen) {
      return player.isFullscreen();
    }
    return _servicelocator.fullscreenManager.isFullScreen();
  };
  PlaybackManager.prototype.toggleFullscreen = function (player) {
    if (!player) {
      player = this._currentPlayer;
    }
    if (player && (!player.isLocalPlayer || player.toggleFullscreen)) {
      return player.toggleFullscreen();
    }
    if (_servicelocator.fullscreenManager.isFullScreen()) {
      return _servicelocator.fullscreenManager.exitFullscreen();
    } else {
      return _servicelocator.fullscreenManager.requestFullscreen();
    }
  };
  PlaybackManager.prototype.togglePictureInPicture = function (player) {
    if (!player) {
      player = this._currentPlayer;
    }
    return player.togglePictureInPicture();
  };
  PlaybackManager.prototype.isPictureInPictureEnabled = function (player) {
    if (!player) {
      player = this._currentPlayer;
    }
    if (!player.isPictureInPictureEnabled) {
      return false;
    }
    return player.isPictureInPictureEnabled();
  };
  PlaybackManager.prototype.getSubtitleStreamIndex = function (player) {
    if (!player) {
      player = this._currentPlayer;
    }
    if (player && !enableLocalPlaylistManagement(player)) {
      return player.getSubtitleStreamIndex();
    }
    if (!player) {
      throw new Error('player cannot be null');
    }
    return getPlayerData(player).subtitleStreamIndex;
  };
  PlaybackManager.prototype.getSubtitleStream = function (player) {
    if (!player) {
      player = this._currentPlayer;
    }
    var index = this.getSubtitleStreamIndex(player);
    if (index == null || index === -1) {
      return null;
    }
    return getSubtitleStream(this, player, index);
  };
  PlaybackManager.prototype.seekRelative = function (offsetTicks, player) {
    if (!player) {
      player = this._currentPlayer;
    }
    if (player && player.seekRelative) {
      if (!enableLocalPlaylistManagement(player) || player.isLocalPlayer && canPlayerSeek(this, player)) {
        if (player.isLocalPlayer) {
          return player.seekRelative((offsetTicks || 0) / 10000);
        } else {
          return player.seekRelative(offsetTicks);
        }
      }
    }
    var ticks = getCurrentTicks(player) + offsetTicks;
    return this.seek(ticks, player);
  };
  PlaybackManager.prototype.isBackgroundPlayback = function (player) {
    if (!player) {
      player = this._currentPlayer;
    }
    return player.isLocalPlayer && this._isBackgroundPlaybackHack;
  };
  PlaybackManager.prototype.getPlayerState = function (player, item, mediaSource) {
    var _mediaSource;
    if (!player) {
      player = this._currentPlayer;
    }
    if (!player) {
      throw new Error('player cannot be null');
    }
    if (!enableLocalPlaylistManagement(player) && player.getPlayerState) {
      return player.getPlayerState();
    }
    if (!item) {
      item = this.currentItem(player);
    }
    if (!mediaSource) {
      mediaSource = this.currentMediaSource(player);
    }
    var state = {
      PlayState: {}
    };
    var currentPlayOptions = item ? item.playOptions : null;
    if (currentPlayOptions) {
      state.IsBackgroundPlayback = currentPlayOptions.fullscreen === false;
    } else {
      state.IsBackgroundPlayback = this._isBackgroundPlaybackHack;
    }
    if (player.isLocalPlayer) {
      var streamInfo = getPlayerData(player).streamInfo;
      if (streamInfo) {
        state.IsInitialRequest = streamInfo.isInitialRequest;
      }
    }
    if (player) {
      state.PlayState.VolumeLevel = player.getVolume();
      state.PlayState.IsMuted = player.isMuted();
      state.PlayState.IsBackgroundPlayback = state.IsBackgroundPlayback;
      state.PlayState.IsPaused = player.paused();
      state.PlayState.RepeatMode = this.getRepeatMode(player);
      state.PlayState.SleepTimerMode = this.getSleepTimerMode(player);
      state.PlayState.SleepTimerEndTime = this.getSleepTimerEndTime(player);
      state.PlayState.Shuffle = this.getShuffle(player);
      state.PlayState.SubtitleOffset = this.getSubtitleOffset(player);
      state.PlayState.PlaybackRate = this.getPlaybackRate(player);
      state.PlayState.MaxStreamingBitrate = this.getMaxStreamingBitrate(player);
      state.PlayState.PositionTicks = getCurrentTicks(player);
      state.PlayState.PlaybackStartTimeTicks = this.playbackStartTime(player);
      state.PlayState.SubtitleStreamIndex = this.getSubtitleStreamIndex(player);
      state.PlayState.AudioStreamIndex = this.getAudioStreamIndex(player);
      state.PlayState.BufferedRanges = this.getBufferedRanges(player);
      state.PlayState.SeekableRanges = this.getSeekableRanges(player);
      state.PlayState.PlayMethod = this.playMethod(player);
      if (mediaSource) {
        state.PlayState.LiveStreamId = mediaSource.LiveStreamId;
      }
      state.PlayState.PlaySessionId = this.playSessionId(player);
      state.PlaylistItemId = this.getCurrentPlaylistItemId(player);
      state.PlaylistIndex = this.getCurrentPlaylistIndex(player);
      state.PlaylistLength = this.getCurrentPlaylistLength(player);
    }
    if (mediaSource) {
      state.PlayState.MediaSourceId = mediaSource.Id;
      state.NowPlayingItem = {
        RunTimeTicks: mediaSource.RunTimeTicks,
        Container: mediaSource.Container,
        Bitrate: mediaSource.Bitrate
      };
    }
    state.PlayState.CanSeek = (((_mediaSource = mediaSource) == null ? void 0 : _mediaSource.RunTimeTicks) || 0) > 0 || canPlayerSeek(this, player);
    if (item) {
      state.NowPlayingItem = getNowPlayingItemForReporting(player, item, mediaSource);
    }
    state.MediaSource = mediaSource;
    return state;
  };
  PlaybackManager.prototype.duration = function (player) {
    if (!player) {
      player = this._currentPlayer;
    }
    if (player && !enableLocalPlaylistManagement(player) && !player.isLocalPlayer) {
      return player.duration();
    }
    if (!player) {
      throw new Error('player cannot be null');
    }
    var mediaSource = this.currentMediaSource(player);
    if (mediaSource && mediaSource.RunTimeTicks) {
      return mediaSource.RunTimeTicks;
    }
    var playerDuration = player.duration();
    if (playerDuration) {
      playerDuration *= 10000;
    }
    return playerDuration;
  };

  // Only used internally
  PlaybackManager.prototype.getCurrentTicks = getCurrentTicks;
  PlaybackManager.prototype.setCurrentPlaylistItem = function (playlistItemId, player) {
    if (!player) {
      player = this._currentPlayer;
    }
    if (player && !enableLocalPlaylistManagement(player)) {
      return player.setCurrentPlaylistItem(playlistItemId);
    }
    var newItem;
    var newItemIndex;
    var playlist = this._playQueueManager.getPlaylist();
    for (var i = 0, length = playlist.length; i < length; i++) {
      if (playlist[i].PlaylistItemId === playlistItemId) {
        newItem = playlist[i];
        newItemIndex = i;
        break;
      }
    }
    if (newItem) {
      return this.setCurrentPlaylistItemAndIndex(newItem, newItemIndex, player);
    }
    return Promise.reject();
  };
  PlaybackManager.prototype.removeFromPlaylist = function (playlistItemIds, player) {
    if (!playlistItemIds) {
      throw new Error('Invalid playlistItemIds');
    }
    if (!player) {
      player = this._currentPlayer;
    }
    if (player && !enableLocalPlaylistManagement(player)) {
      return player.removeFromPlaylist(playlistItemIds);
    }
    var removeResult = this._playQueueManager.removeFromPlaylist(playlistItemIds);
    if (removeResult.result === 'empty') {
      return this.stop(player);
    }
    var isCurrentIndex = removeResult.isCurrentIndex;
    _events.default.trigger(player, 'playlistitemremove', [{
      PlaylistItemIds: playlistItemIds
    }]);
    if (isCurrentIndex) {
      return this.setCurrentPlaylistItem(this._playQueueManager.getPlaylist()[0].PlaylistItemId, player);
    }
    return Promise.resolve();
  };
  PlaybackManager.prototype.movePlaylistItem = function (playlistItemId, newIndex, player) {
    if (!player) {
      player = this._currentPlayer;
    }
    if (player && !enableLocalPlaylistManagement(player)) {
      return player.movePlaylistItem(playlistItemId, newIndex);
    }
    var moveResult = this._playQueueManager.movePlaylistItem(playlistItemId, newIndex);
    if (moveResult.result === 'noop') {
      return Promise.resolve();
    }
    _events.default.trigger(player, 'playlistitemmove', [{
      playlistItemId: moveResult.playlistItemId,
      newIndex: moveResult.newIndex
    }]);
    return Promise.resolve();
  };
  PlaybackManager.prototype.getCurrentPlaylistIndex = function (player) {
    if (!player) {
      player = this._currentPlayer;
    }
    if (player && !enableLocalPlaylistManagement(player)) {
      return player.getCurrentPlaylistIndex();
    }
    return this._playQueueManager.getCurrentPlaylistIndex();
  };
  PlaybackManager.prototype.getCurrentPlaylistLength = function (player) {
    if (!player) {
      player = this._currentPlayer;
    }
    if (player && !enableLocalPlaylistManagement(player)) {
      return player.getCurrentPlaylistLength();
    }
    return this._playQueueManager.getCurrentPlaylistLength();
  };
  PlaybackManager.prototype.getCurrentPlaylistItemId = function (player) {
    if (!player) {
      player = this._currentPlayer;
    }
    if (player && !enableLocalPlaylistManagement(player)) {
      return player.getCurrentPlaylistItemId();
    }
    return this._playQueueManager.getCurrentPlaylistItemId();
  };
  PlaybackManager.prototype.channelUp = function (player) {
    if (!player) {
      player = this._currentPlayer;
    }
    return this.nextTrack(player);
  };
  PlaybackManager.prototype.channelDown = function (player) {
    if (!player) {
      player = this._currentPlayer;
    }
    return this.previousTrack(player);
  };
  PlaybackManager.prototype.nextTrack = function (player) {
    if (!player) {
      player = this._currentPlayer;
    }
    if (player && !enableLocalPlaylistManagement(player)) {
      return player.nextTrack();
    }
    var newItemInfo = this._playQueueManager.getNextItemInfo();
    if (newItemInfo) {
      console.log('playing next track');
      return this.setCurrentPlaylistItemAndIndex(newItemInfo.item, newItemInfo.index, player);
    }
    return Promise.resolve();
  };
  PlaybackManager.prototype.previousTrack = function (player) {
    if (!player) {
      player = this._currentPlayer;
    }
    if (player && !enableLocalPlaylistManagement(player)) {
      return player.previousTrack();
    }
    var newIndex = this.getCurrentPlaylistIndex(player) - 1;
    if (newIndex >= 0) {
      var playlist = this._playQueueManager.getPlaylist();
      var newItem = playlist[newIndex];
      if (newItem) {
        return this.setCurrentPlaylistItemAndIndex(newItem, newIndex, player);
      }
    }
    return Promise.resolve();
  };
  PlaybackManager.prototype.queue = function (options, player) {
    return queue(this, options, '', player);
  };
  PlaybackManager.prototype.queueNext = function (options, player) {
    return queue(this, options, 'next', player);
  };
  PlaybackManager.prototype.onControllingAppConnected = function () {
    var player = this._currentPlayer;
    if (player && this.isPlaying(player)) {
      // this is essentially just to force a progress update so that the controlling app gets the current play queue
      sendProgressUpdate(this, player, 'controllerconnected', true);
    }
  };
  PlaybackManager.prototype.getPlaybackMediaSources = function (item, options) {
    if (!options) {
      options = {};
    }
    var startPosition = options.startPositionTicks || 0;
    var mediaType = options.mediaType || item.MediaType;
    // TODO: Remove the true forceLocalPlayer hack
    var player = getPlayer(this, item, options, true);
    var apiClient = _connectionmanager.default.getApiClient(item);

    // Call getEndpointInfo just to ensure the value is recorded, it is needed with getSavedMaxStreamingBitrate
    var endpointInfoPromise = _apiclient.default.isLocalItem(item) ? Promise.resolve({
      NetworkType: 'lan'
    }) : apiClient.getEndpointInfo();
    return Promise.all([endpointInfoPromise, getDeviceProfile(player, item)]).then(function (responses) {
      var endpointInfo = responses[0];
      var deviceProfile = responses[1];
      var maxBitrate = getSavedMaxStreamingBitrate(_connectionmanager.default.getApiClient(item), mediaType);
      var enableAutomaticQuality = _appsettings.default.enableAutomaticBitrateDetection(endpointInfo.NetworkType, mediaType);
      return getPlaybackInfo(player, apiClient, item, deviceProfile, maxBitrate, enableAutomaticQuality, startPosition, false, null, null, null, null, null).then(function (playbackInfoResult) {
        return playbackInfoResult.MediaSources;
      });
    });
  };
  PlaybackManager.prototype.playbackStartTime = function (player) {
    if (!player) {
      player = this._currentPlayer;
    }
    if (player && !enableLocalPlaylistManagement(player)) {
      if (player.playbackStartTime) {
        return player.playbackStartTime();
      }
      return null;
    }
    var streamInfo = getPlayerData(player).streamInfo;
    return streamInfo ? streamInfo.playbackStartTimeTicks : null;
  };
  PlaybackManager.prototype.toggleAspectRatio = function (player) {
    if (!player) {
      player = this._currentPlayer;
    }
    if (player) {
      var current = this.getAspectRatio(player);
      var supported = this.getSupportedAspectRatios(player);
      var index = -1;
      for (var i = 0, length = supported.length; i < length; i++) {
        if (supported[i].id === current) {
          index = i;
          break;
        }
      }
      index++;
      if (index >= supported.length) {
        index = 0;
      }
      this.setAspectRatio(supported[index].id, player);
    }
  };
  PlaybackManager.prototype.setAspectRatio = function (val, player) {
    if (!player) {
      player = this._currentPlayer;
    }
    if (player && player.setAspectRatio) {
      player.setAspectRatio(val);
    }
  };
  PlaybackManager.prototype.getSupportedAspectRatios = function (player) {
    if (!player) {
      player = this._currentPlayer;
    }
    if (player && player.getSupportedAspectRatios) {
      return player.getSupportedAspectRatios();
    }
    return [];
  };
  PlaybackManager.prototype.getAspectRatio = function (player) {
    if (!player) {
      player = this._currentPlayer;
    }
    if (player && player.getAspectRatio) {
      return player.getAspectRatio();
    }
  };
  PlaybackManager.prototype.setBrightness = function (val, player) {
    if (!player) {
      player = this._currentPlayer;
    }
    if (player) {
      player.setBrightness(val);
    }
  };
  PlaybackManager.prototype.getBrightness = function (player) {
    if (!player) {
      player = this._currentPlayer;
    }
    if (player) {
      return player.getBrightness();
    }
  };
  PlaybackManager.prototype.setVolume = function (val, player) {
    if (!player) {
      player = this._currentPlayer;
    }
    if (player) {
      player.setVolume(val);
    }
  };
  PlaybackManager.prototype.getVolume = function (player) {
    if (!player) {
      player = this._currentPlayer;
    }
    if (player) {
      return player.getVolume();
    }
  };
  PlaybackManager.prototype.volumeUp = function (player) {
    if (!player) {
      player = this._currentPlayer;
    }
    if (player) {
      player.volumeUp();
    }
  };
  PlaybackManager.prototype.volumeDown = function (player) {
    if (!player) {
      player = this._currentPlayer;
    }
    if (player) {
      player.volumeDown();
    }
  };
  PlaybackManager.prototype.sendAbortSignal = function () {
    var controller = this._abortController;
    if (controller) {
      this._abortController = null;
      controller.abort();
    }
  };
  PlaybackManager.prototype.newAbortSignal = function () {
    this.sendAbortSignal();
    var controller = new AbortController();
    this._abortController = controller;
    return controller.signal;
  };
  PlaybackManager.prototype.getCurrentPlayer = function () {
    return this._currentPlayer;
  };
  PlaybackManager.prototype.currentTime = function (player) {
    if (!player) {
      player = this._currentPlayer;
    }
    if (player && !enableLocalPlaylistManagement(player) && !player.isLocalPlayer) {
      return player.currentTime();
    }
    return this.getCurrentTicks(player);
  };
  PlaybackManager.prototype.nextItem = function (player) {
    if (!player) {
      player = this._currentPlayer;
    }
    if (player && !enableLocalPlaylistManagement(player)) {
      return player.nextItem();
    }
    var nextItem = this._playQueueManager.getNextItemInfo();
    if (!nextItem || !nextItem.item) {
      return Promise.reject();
    }
    var apiClient = _connectionmanager.default.getApiClient(nextItem.item);
    return apiClient.getItem(apiClient.getCurrentUserId(), nextItem.item.Id, {
      ExcludeFields: 'VideoChapters,VideoMediaSources,MediaStreams,People,Overview'
    });
  };
  PlaybackManager.prototype.canQueue = function (item) {
    if (this._currentPlayer) {
      var itemType = item.Type;
      switch (itemType) {
        case 'Program':
        case 'TvChannel':
          return false;
        case 'MusicAlbum':
        case 'MusicArtist':
          return this.canPlay(item) && this.canQueueMediaType('Audio');
        default:
          return this.canPlay(item) && canPlayerPlayMediaType(this._currentPlayer, item.MediaType);
      }
    }
    return false;
  };
  PlaybackManager.prototype.canQueueMediaType = function (mediaType) {
    if (this._currentPlayer) {
      return canPlayerPlayMediaType(this._currentPlayer, mediaType);
    }
    return false;
  };
  PlaybackManager.prototype.isMuted = function (player) {
    if (!player) {
      player = this._currentPlayer;
    }
    if (player) {
      return player.isMuted();
    }
    return false;
  };
  PlaybackManager.prototype.setMute = function (mute, player) {
    if (!player) {
      player = this._currentPlayer;
    }
    if (player) {
      player.setMute(mute);
    }
  };
  PlaybackManager.prototype.toggleMute = function (mute, player) {
    if (!player) {
      player = this._currentPlayer;
    }
    if (player) {
      if (player.toggleMute) {
        player.toggleMute();
      } else {
        player.setMute(!player.isMuted());
      }
    }
  };
  PlaybackManager.prototype.nextChapter = function (player) {
    if (!player) {
      player = this._currentPlayer;
    }
    var ticks = this.getCurrentTicks(player);
    var chapters = this.currentMediaSource(player).Chapters || this.currentItem(player).Chapters || [];
    var nextChapter = chapters.filter(function (i) {
      return i.StartPositionTicks > ticks;
    })[0];
    if (nextChapter) {
      this.seek(nextChapter.StartPositionTicks, player);
    } else {
      this.nextTrack(player);
    }
  };
  PlaybackManager.prototype.previousChapter = function (player) {
    if (!player) {
      player = this._currentPlayer;
    }
    var ticks = this.getCurrentTicks(player);

    // Go back 10 seconds
    ticks -= 100000000;

    // If there's no previous track, then at least rewind to beginning
    if (this.getCurrentPlaylistIndex(player) === 0) {
      ticks = Math.max(ticks, 0);
    }
    var chapters = this.currentMediaSource(player).Chapters || this.currentItem(player).Chapters || [];
    var previousChapters = chapters.filter(function (i) {
      return i.StartPositionTicks <= ticks;
    });
    if (previousChapters.length) {
      this.seek(previousChapters[previousChapters.length - 1].StartPositionTicks, player);
    } else {
      this.previousTrack(player);
    }
  };
  PlaybackManager.prototype.fastForward = function (player) {
    if (!player) {
      player = this._currentPlayer;
    }

    // Go back 15 seconds
    var offsetTicks = _usersettings.default.skipForwardLength() * 10000;
    this.seekRelative(offsetTicks, player);
  };
  PlaybackManager.prototype.rewind = function (player) {
    if (!player) {
      player = this._currentPlayer;
    }

    // Go back 15 seconds
    var offsetTicks = 0 - _usersettings.default.skipBackLength() * 10000;
    this.seekRelative(offsetTicks, player);
  };
  function getFrameTicks(streamInfo) {
    var _streamInfo$mediaSour;
    var streams = streamInfo == null || (_streamInfo$mediaSour = streamInfo.mediaSource) == null ? void 0 : _streamInfo$mediaSour.MediaStreams;
    if (streams) {
      var videoStream = streams.find(function (e) {
        return e.Type === 'Video';
      });
      var frameRate = (videoStream == null ? void 0 : videoStream.RealFrameRate) || (videoStream == null ? void 0 : videoStream.AverageFrameRate);
      if (frameRate) {
        var ticks = 1 / frameRate * 1000 * 10000;
        return ticks;
      }
    }
    return null;
  }
  PlaybackManager.prototype.frameStepForward = function (player) {
    if (!player) {
      player = this._currentPlayer;
    }

    // Go back 15 seconds
    var offsetTicks = getFrameTicks(player.streamInfo);
    if (offsetTicks) {
      // Add 1ms to be sure to get past any rounding inaccuracies
      offsetTicks += 1 * 10000;
      this.seekRelative(offsetTicks, player);
    }
  };
  PlaybackManager.prototype.frameStepBack = function (player) {
    if (!player) {
      player = this._currentPlayer;
    }

    // Go back 15 seconds
    var offsetTicks = getFrameTicks(player.streamInfo);
    if (offsetTicks) {
      // Add 1ms to be sure to get past any rounding inaccuracies
      offsetTicks += 1 * 10000;
      this.seekRelative(-1 * offsetTicks, player);
    }
  };
  PlaybackManager.prototype.seekPercent = function (percent, player) {
    if (!player) {
      player = this._currentPlayer;
    }
    console.log('seeking to ' + percent + '%');
    var ticks = this.duration(player) || 0;
    percent /= 100;
    ticks *= percent;
    ticks = parseInt(ticks);
    console.log('seeking to ' + ticks + ' ticks');
    this.seek(ticks, player);
  };
  PlaybackManager.prototype.playTrailers = function (item) {
    var player = this._currentPlayer;
    if (player && player.playTrailers) {
      return player.playTrailers(item);
    }
    var apiClient = _connectionmanager.default.getApiClient(item);
    var instance = this;
    return apiClient.getAllTrailers({
      LocalTrailers: (item.LocalTrailerCount || 0) > 0,
      RemoteTrailers: (item.LocalTrailerCount || 0) === 0
    }, item).then(function (result) {
      return instance.play({
        items: result.Items
      });
    });
  };
  PlaybackManager.prototype.getSubtitleUrl = function (textStream, serverId) {
    var apiClient = _connectionmanager.default.getApiClient(serverId);
    var textStreamUrl = !textStream.IsExternalUrl ? apiClient.getUrl(textStream.DeliveryUrl) : textStream.DeliveryUrl;
    return textStreamUrl;
  };
  PlaybackManager.prototype.stop = function (player) {
    if (!player) {
      player = this._currentPlayer;
    }
    this.sendAbortSignal();
    if (player) {
      if (enableLocalPlaylistManagement(player)) {
        this._playQueueManager.reset();
      }
      return player.stop(true);
    }
    return Promise.resolve();
  };
  PlaybackManager.prototype.getBufferedRanges = function (player) {
    if (!player) {
      player = this._currentPlayer;
    }
    if (player) {
      if (player.getBufferedRanges) {
        return player.getBufferedRanges();
      }
    }
    return [];
  };
  PlaybackManager.prototype.getSeekableRanges = function (player) {
    if (!player) {
      player = this._currentPlayer;
    }
    if (player) {
      if (player.getSeekableRanges) {
        return player.getSeekableRanges();
      }
    }
    return [];
  };
  PlaybackManager.prototype.playPause = function (player) {
    if (!player) {
      player = this._currentPlayer;
    }
    if (player) {
      if (player.playPause) {
        return player.playPause();
      }
      if (player.paused()) {
        return this.unpause(player);
      } else {
        return this.pause(player);
      }
    }
  };
  PlaybackManager.prototype.paused = function (player) {
    if (!player) {
      player = this._currentPlayer;
    }
    if (player) {
      return player.paused();
    }
  };
  PlaybackManager.prototype.pause = function (player) {
    if (!player) {
      player = this._currentPlayer;
    }
    if (player) {
      player.pause();
    }
  };
  PlaybackManager.prototype.unpause = function (player) {
    if (!player) {
      player = this._currentPlayer;
    }
    if (player) {
      player.unpause();
    }
  };
  PlaybackManager.prototype.instantMix = function (item, player) {
    if (!player) {
      player = this._currentPlayer;
    }
    if (player && player.instantMix) {
      return player.instantMix(item);
    }
    var apiClient = _connectionmanager.default.getApiClient(item);
    var options = {};
    options.UserId = apiClient.getCurrentUserId();
    options.Limit = QueueQueryLimit;
    var instance = this;
    return apiClient.getInstantMixFromItem(item.Id, options).then(function (result) {
      return instance.play({
        items: result.Items
      });
    });
  };
  PlaybackManager.prototype.shuffle = function (shuffleItem, player, queryOptions) {
    if (!player) {
      player = this._currentPlayer;
    }
    if (player && player.shuffle) {
      return player.shuffle(shuffleItem);
    }
    queryOptions = queryOptions || {};
    queryOptions.items = [shuffleItem];
    queryOptions.shuffle = true;
    return this.play(queryOptions);
  };
  PlaybackManager.prototype.audioTracks = function (player) {
    if (!player) {
      player = this._currentPlayer;
    }
    if (player.audioTracks) {
      var result = player.audioTracks();
      if (result) {
        return result;
      }
    }
    var mediaSource = this.currentMediaSource(player);
    var mediaStreams = (mediaSource == null ? void 0 : mediaSource.MediaStreams) || [];
    return mediaStreams.filter(function (s) {
      return s.Type === 'Audio';
    });
  };
  PlaybackManager.prototype.subtitleTracks = function (player) {
    if (!player) {
      player = this._currentPlayer;
    }
    if (player.subtitleTracks) {
      var result = player.subtitleTracks();
      if (result) {
        return result;
      }
    }
    var mediaSource = this.currentMediaSource(player);
    var mediaStreams = (mediaSource == null ? void 0 : mediaSource.MediaStreams) || [];
    return mediaStreams.filter(function (s) {
      return s.Type === 'Subtitle';
    });
  };
  PlaybackManager.prototype.getSupportedCommands = function (player) {
    if (!player) {
      player = this._currentPlayer;
    }
    if (!player || player.isLocalPlayer) {
      var _player;
      // Full list
      // https://github.com/MediaBrowser/MediaBrowser/blob/master/MediaBrowser.Model/Session/GeneralCommand.cs
      var list = ['GoHome', 'GoToSettings', 'SetAudioStreamIndex', 'SetSubtitleStreamIndex', 'RefreshMediaSource', 'SetMaxStreamingBitrate', 'DisplayContent', 'GoToSearch', 'DisplayMessage', 'TriggerTranscodingFallback', 'SetRepeatMode', 'SetShuffle', 'PlayMediaSource', 'PlayTrailers'];
      if (_servicelocator.appHost.supports('fullscreenchange')) {
        list.push('ToggleFullscreen');
      }
      if (_servicelocator.appHost.supports('sleeptimer')) {
        list.push('SetSleepTimer');
      }
      if ((_player = player) != null && _player.supports) {
        var _player2;
        // for the electron app
        var forceSupportVolume = ((_player2 = player) == null ? void 0 : _player2.id) === 'libmpvmediaplayer';
        if (player.supports('VolumeUp') || forceSupportVolume) {
          list.push('VolumeUp');
        }
        if (player.supports('VolumeDown') || forceSupportVolume) {
          list.push('VolumeDown');
        }
        if (player.supports('Mute') || forceSupportVolume) {
          list.push('Mute');
        }
        if (player.supports('Unmute') || forceSupportVolume) {
          list.push('Unmute');
        }
        if (player.supports('ToggleMute') || forceSupportVolume) {
          list.push('ToggleMute');
        }
        if (player.supports('SetVolume') || forceSupportVolume) {
          list.push('SetVolume');
        }
        if (player.supports('PictureInPicture')) {
          list.push('PictureInPicture');
        }
        if (player.supports('AutoPictureInPicture')) {
          list.push('AutoPictureInPicture');
        }
        if (player.supports('SetBrightness')) {
          list.push('SetBrightness');
        }
        if (player.supports('SetAspectRatio')) {
          list.push('SetAspectRatio');
        }
        if (player.supports('SetSubtitleOffset')) {
          list.push('SetSubtitleOffset');
        }
        if (player.supports('SetSubtitleAppearance')) {
          list.push('SetSubtitleAppearance');
        }
        if (player.supports('SetPlaybackRate')) {
          list.push('SetPlaybackRate');
        }
      }
      return list;
    }
    var info = this.getPlayerInfo(player);
    return info ? info.supportedCommands : [];
  };
  PlaybackManager.prototype.toggleRepeatMode = function (player) {
    if (!player) {
      player = this._currentPlayer;
    }
    switch (this.getRepeatMode(player)) {
      case 'RepeatNone':
        this.setRepeatMode('RepeatAll', player);
        break;
      case 'RepeatAll':
        this.setRepeatMode('RepeatOne', player);
        break;
      case 'RepeatOne':
        this.setRepeatMode('RepeatNone', player);
        break;
    }
  };
  PlaybackManager.prototype.setRepeatMode = function (value, player) {
    if (!player) {
      player = this._currentPlayer;
    }
    if (player && !enableLocalPlaylistManagement(player)) {
      return player.setRepeatMode(value);
    }
    this._playQueueManager.setRepeatMode(value);
    _events.default.trigger(player, 'repeatmodechange');
  };
  PlaybackManager.prototype.getRepeatMode = function (player) {
    if (!player) {
      player = this._currentPlayer;
    }
    if (player && !enableLocalPlaylistManagement(player)) {
      return player.getRepeatMode();
    }
    return this._playQueueManager.getRepeatMode();
  };
  PlaybackManager.prototype.setSleepTimer = function (options, player) {
    if (!player) {
      player = this._currentPlayer;
    }
    if (player && !enableLocalPlaylistManagement(player)) {
      return player.setSleepTimer(options);
    }
    var playerData = getPlayerData(player);
    playerData.sleepTimerMode = options.sleepTimerMode || 'None';
    var sleepTimerEndTime = options.sleepTimerEndTime;
    if (sleepTimerEndTime && typeof sleepTimerEndTime === 'string') {
      sleepTimerEndTime = _datetime.default.parseISO8601Date(sleepTimerEndTime);
    }
    playerData.sleepTimerEndTime = sleepTimerEndTime;
    _events.default.trigger(player, 'sleeptimerchange');
    return Promise.resolve();
  };
  PlaybackManager.prototype.onSleepTimerFired = function (player) {
    if (!player) {
      player = this._currentPlayer;
    }
    this.setSleepTimer({
      sleepTimerMode: 'None'
    }, player);
    this.pause(player);
  };
  PlaybackManager.prototype.getSleepTimerMode = function (player) {
    if (!player) {
      player = this._currentPlayer;
    }
    if (player && !enableLocalPlaylistManagement(player)) {
      return player.getSleepTimerMode();
    }
    return getPlayerData(player).sleepTimerMode || 'None';
  };
  PlaybackManager.prototype.getSleepTimerEndTime = function (player) {
    if (!player) {
      player = this._currentPlayer;
    }
    if (player && !enableLocalPlaylistManagement(player)) {
      return player.getSleepTimerEndTime();
    }
    return getPlayerData(player).sleepTimerEndTime;
  };
  PlaybackManager.prototype.toggleShuffle = function (player) {
    if (!player) {
      player = this._currentPlayer;
    }
    this.setShuffle(!this.getShuffle(player), player);
  };
  PlaybackManager.prototype.setShuffle = function (value, player) {
    if (!player) {
      player = this._currentPlayer;
    }
    if (player && !enableLocalPlaylistManagement(player)) {
      return player.setShuffle(value);
    }
    this._playQueueManager.setShuffle(value);
    _events.default.trigger(player, 'shufflechange');
  };
  PlaybackManager.prototype.getShuffle = function (player) {
    if (!player) {
      player = this._currentPlayer;
    }
    if (player && !enableLocalPlaylistManagement(player)) {
      return player.getShuffle();
    }
    return this._playQueueManager.getShuffle();
  };
  PlaybackManager.prototype.setSubtitleOffset = function (value, player) {
    if (!player) {
      player = this._currentPlayer;
    }
    if (player.setSubtitleOffset) {
      player.setSubtitleOffset(value);
      _events.default.trigger(player, 'subtitleoffsetchange');
    }
  };
  PlaybackManager.prototype.incrementSubtitleOffset = function (value, player) {
    if (!player) {
      player = this._currentPlayer;
    }
    if (player.incrementSubtitleOffset) {
      player.incrementSubtitleOffset(value);
      _events.default.trigger(player, 'subtitleoffsetchange');
    }
  };
  PlaybackManager.prototype.getSubtitleOffset = function (player) {
    if (!player) {
      player = this._currentPlayer;
    }
    return player.getSubtitleOffset ? player.getSubtitleOffset() : 0;
  };
  PlaybackManager.prototype.getPlaybackRate = function (player) {
    if (!player) {
      player = this._currentPlayer;
    }
    return player.getPlaybackRate ? player.getPlaybackRate() : 1;
  };
  PlaybackManager.prototype.setPlaybackRate = function (value, player) {
    if (!player) {
      player = this._currentPlayer;
    }
    if (player.setPlaybackRate) {
      player.setPlaybackRate(value);
    }
  };
  PlaybackManager.prototype.trySetActiveDeviceName = function (name) {
    name = normalizeName(name);
    var instance = this;
    instance.getTargets().then(function (result) {
      var target = result.filter(function (p) {
        return normalizeName(p.name) === name;
      })[0];
      if (target) {
        instance.trySetActivePlayer(target.playerName, target);
      }
    });
  };
  PlaybackManager.prototype.displayContent = function (options, player) {
    if (!player) {
      player = this._currentPlayer;
    }
    if (player && player.displayContent) {
      player.displayContent(options);
    }
  };
  PlaybackManager.prototype.beginPlayerUpdates = function (player) {
    if (player.beginPlayerUpdates) {
      player.beginPlayerUpdates();
    }
  };
  PlaybackManager.prototype.endPlayerUpdates = function (player) {
    if (player.endPlayerUpdates) {
      player.endPlayerUpdates();
    }
  };
  PlaybackManager.prototype.setDefaultPlayerActive = function () {
    this.setActivePlayer('localplayer');
  };
  PlaybackManager.prototype.removeActivePlayer = function (name) {
    var playerInfo = this.getPlayerInfo();
    if (playerInfo) {
      if (playerInfo.playerName === name) {
        this.setDefaultPlayerActive();
      }
    }
  };
  PlaybackManager.prototype.removeActiveTarget = function (id) {
    var playerInfo = this.getPlayerInfo();
    if (playerInfo) {
      if (playerInfo.id === id) {
        this.setDefaultPlayerActive();
      }
    }
  };
  PlaybackManager.prototype.sendCommand = function (cmd, player) {
    // Full list
    // https://github.com/MediaBrowser/MediaBrowser/blob/master/MediaBrowser.Model/Session/GeneralCommand.cs#L23
    console.log('MediaController received command: ' + cmd.Name);
    switch (cmd.Name) {
      case 'SetPlaybackRate':
        this.setPlaybackRate(parseFloat(cmd.Arguments.PlaybackRate), player);
        break;
      case 'SetSubtitleOffset':
        this.setSubtitleOffset(parseFloat(cmd.Arguments.SubtitleOffset), player);
        break;
      case 'IncrementSubtitleOffset':
        this.incrementSubtitleOffset(parseFloat(cmd.Arguments.Increment), player);
        break;
      case 'TriggerTranscodingFallback':
        this.triggerTranscodingFallback(player);
        break;
      case 'SetRepeatMode':
        this.setRepeatMode(cmd.Arguments.RepeatMode, player);
        break;
      case 'SetSleepTimer':
        this.setSleepTimer(cmd.Arguments || {}, player);
        break;
      case 'SetShuffle':
        var shuffle = cmd.Arguments.Shuffle;
        this.setShuffle(shuffle === true || (shuffle || '').toString().toLowerCase() === 'true', player);
        break;
      case 'VolumeUp':
        this.volumeUp(player);
        break;
      case 'VolumeDown':
        this.volumeDown(player);
        break;
      case 'Mute':
        this.setMute(true, player);
        break;
      case 'Unmute':
        this.setMute(false, player);
        break;
      case 'ToggleMute':
        this.toggleMute(player);
        break;
      case 'SetVolume':
        this.setVolume(cmd.Arguments.Volume, player);
        break;
      case 'SetAspectRatio':
        this.setAspectRatio(cmd.Arguments.AspectRatio, player);
        break;
      case 'SetBrightness':
        this.setBrightness(cmd.Arguments.Brightness, player);
        break;
      case 'SetAudioStreamIndex':
        this.setAudioStreamIndex(parseInt(cmd.Arguments.Index), player);
        break;
      case 'SetSubtitleStreamIndex':
        this.setSubtitleStreamIndex(parseInt(cmd.Arguments.Index), player, cmd.Arguments.RefreshMediaSource);
        break;
      case 'SetMaxStreamingBitrate':
        // todo
        //this.setMaxStreamingBitrate(parseInt(cmd.Arguments.Bitrate), player);
        break;
      case 'ToggleFullscreen':
        this.toggleFullscreen(player);
        break;
      default:
        {
          if (player.sendCommand) {
            player.sendCommand(cmd);
          }
          break;
        }
    }
  };
  var _default = _exports.default = new PlaybackManager();
});
