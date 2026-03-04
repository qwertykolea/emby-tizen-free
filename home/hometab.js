define(["exports", "./../modules/tabbedview/basetab.js", "./../modules/emby-elements/emby-itemscontainer/emby-itemscontainer.js", "./../modules/emby-apiclient/connectionmanager.js", "./../modules/common/usersettings/usersettings.js", "./../modules/layoutmanager.js", "./../modules/appheader/appheader.js", "./../modules/skinviewmanager.js", "./../modules/approuter.js", "./../modules/common/globalize.js", "./../modules/common/appsettings.js", "./../modules/registrationservices/registrationservices.js", "./../modules/common/servicelocator.js", "./../modules/tabbedview/sectionscontroller.js"], function (_exports, _basetab, _embyItemscontainer, _connectionmanager, _usersettings, _layoutmanager, _appheader, _skinviewmanager, _approuter, _globalize, _appsettings, _registrationservices, _servicelocator, _sectionscontroller) {
  Object.defineProperty(_exports, "__esModule", {
    value: true
  });
  _exports.default = void 0;
  /* jshint module: true */

  function HomeTab(view, params) {
    _basetab.default.apply(this, arguments);
    _sectionscontroller.default.apply(this, arguments);
    this.view = view;
    this.params = params;
    this.apiClient = _connectionmanager.default.currentApiClient();
    view.classList.add('homeSectionsContainer');
  }
  Object.assign(HomeTab.prototype, _basetab.default.prototype);
  Object.assign(HomeTab.prototype, _sectionscontroller.default.prototype);
  HomeTab.prototype.enablePushDownFocusPreview = function () {
    return _layoutmanager.default.tv && _usersettings.default.enableHomescreenFocusPreviews() && this.scrollDirection() === 'y';
  };
  HomeTab.prototype.onItemCustomAction = function (options) {
    var _item$Id;
    var item = options.item;
    if ((_item$Id = item.Id) != null && _item$Id.startsWith('PremiereInfo')) {
      _registrationservices.default.showPremiereInfo();
      return;
    }
    return _sectionscontroller.default.prototype.onItemCustomAction.apply(this, arguments);
  };
  function fetchSectionsFromServer(apiClient, user) {
    return apiClient.getHomeScreenSections({
      user: user
    });
  }
  function fetchSections(apiClient, user) {
    return fetchSectionsFromServer(apiClient, user).then(function (sections) {
      sections.splice(Math.min(1, sections.length), 0, {
        Id: 'appinfo',
        SectionType: 'appinfo',
        Name: 'Discover Emby Premiere',
        Subtitle: 'Enjoy Emby DVR, get free access to Emby apps, and more.'
      });
      if (user.Policy.EnableContentDownloading && _servicelocator.appHost.supports('sync')) {
        sections.splice(1, 0, {
          Id: 'latestdownloads',
          SectionType: 'latestdownloads',
          Name: _globalize.default.translate('Downloads')
        });
      }
      return sections;
    });
  }
  function getAppInfoItems(apiClient) {
    var items = [];
    items.push({
      Name: '',
      Id: 'PremiereInfo1',
      ImageUrl: 'https://raw.githubusercontent.com/MediaBrowser/Emby.Resources/master/apps/theater1.png',
      PrimaryImageAspectRatio: 16 / 9,
      ServerId: apiClient.serverId()
    });
    items.push({
      Name: '',
      Id: 'PremiereInfo2',
      ImageUrl: 'https://raw.githubusercontent.com/MediaBrowser/Emby.Resources/master/apps/theater2.png',
      PrimaryImageAspectRatio: 16 / 9,
      ServerId: apiClient.serverId()
    });
    items.push({
      Name: '',
      Id: 'PremiereInfo3',
      ImageUrl: 'https://raw.githubusercontent.com/MediaBrowser/Emby.Resources/master/apps/theater3.png',
      PrimaryImageAspectRatio: 16 / 9,
      ServerId: apiClient.serverId()
    });
    return Promise.resolve({
      Items: items,
      TotalRecordCount: items.length
    });
  }
  function getAppInfo(apiClient) {
    var frequency = 172800000;
    var cacheKey = 'lastappinfopresent5';
    var lastDatePresented = parseInt(_appsettings.default.get(cacheKey) || '0');

    // Don't show the first time, right after installation
    if (!lastDatePresented) {
      _appsettings.default.set(cacheKey, Date.now());
      return Promise.resolve([]);
    }
    if (Date.now() - lastDatePresented < frequency) {
      return Promise.resolve([]);
    }
    return _registrationservices.default.validateFeature('dvr', {
      showDialog: false,
      viewOnly: true
    }).then(function () {
      _appsettings.default.set(cacheKey, Date.now());
      return [];
    }, function () {
      _appsettings.default.set(cacheKey, Date.now());
      return getAppInfoItems(apiClient);
    });
  }
  HomeTab.prototype.fetchSectionItems = function (query) {
    var bindInfo = this;
    var instance = bindInfo.instance;
    var section = bindInfo.section;
    if (section.Items) {
      return _sectionscontroller.default.prototype.fetchSectionItems.apply(this, arguments);
    }
    var viewScrollX = instance.scrollDirection() === 'x';
    var sectionType = section.SectionType;
    var apiClient = instance.getApiClient();
    if (sectionType === 'appinfo') {
      return getAppInfo(apiClient);
    }
    var fields = instance.getRequestedItemFields() + ",PrimaryImageAspectRatio,ProgramPrimaryImageAspectRatio,ProductionYear";
    var sectionScrollX = !viewScrollX && section.ScrollDirection !== 'Vertical';
    switch (section.CollectionType || '') {
      case '':
      case 'tvshows':
        fields += ',Status,EndDate';
        break;
      default:
        break;
    }
    var limit = null;
    if (!sectionScrollX) {
      switch (sectionType) {
        case 'userviews':
          break;
        default:
          limit = 16;
          break;
      }
    }
    if (viewScrollX) {
      switch (sectionType) {
        case 'userviews':
          break;
        default:
          limit = 12;
          break;
      }
    }
    return apiClient.getHomeScreenSectionItems({
      query: Object.assign({
        Fields: fields,
        ImageTypeLimit: 1,
        EnableImageTypes: instance.getRequestedImageTypes(),
        Limit: limit
      }, query),
      section: section
    });
  };
  HomeTab.prototype.fetchSections = function () {
    var instance = this;
    var apiClient = this.getApiClient();
    return apiClient.getCurrentUser().then(function (user) {
      return fetchSections(apiClient, user).then(function (sections) {
        var enableFocusPreview = instance.enableFocusPreview();
        var viewScrollX = instance.scrollDirection() === 'x';
        for (var i = 0, length = sections.length; i < length; i++) {
          var section = sections[i];
          var collectionType = section.CollectionType;
          var sectionType = section.SectionType;
          var viewType = section.ViewType || 'cards';
          var sectionScrollX = !viewScrollX && section.ScrollDirection !== 'Vertical';
          switch (sectionType) {
            case 'userviews':
              if (sectionScrollX && !section.ScrollDirection) {
                section.FinePointerWrap = true;
              }
              break;
            default:
              break;
          }
          section.HeaderButtons = [];
          switch (sectionType) {
            case 'onnow':
              section.Href = _approuter.default.getRouteUrl('livetv', {
                serverId: apiClient.serverId(),
                section: 'onnow'
              });
              section.ShowLiveTVButtons = !viewScrollX;
              break;
            case 'latestdownloads':
              section.Href = _approuter.default.getRouteUrl('downloads');
              section.HeaderButtons.push({
                Name: _globalize.default.translate('HeaderManageDownloads'),
                Href: _approuter.default.getRouteUrl('managedownloads'),
                Icon: '&#xe8B8;'
              });
              break;
            default:
              break;
          }
          if (section.ParentItem) {
            section.Href = _approuter.default.getRouteUrl(section.ParentItem, {
              section: sectionType === 'latestmedia' ? 'latest' : null
            });
          }
          if (_layoutmanager.default.tv) {
            section.Href = null;
          }
          var fields = [];
          var lines = null;
          var sideFooter = viewType === 'buttons' || viewType === 'list' && sectionScrollX;
          var smallSideFooter = viewType === 'buttons';
          if (!enableFocusPreview || sideFooter || sectionType === 'userviews' && !smallSideFooter) {
            switch (sectionType) {
              case 'activerecordings':
                fields.push('ParentName');
                fields.push('Name');
                fields.push('ChannelName');
                fields.push('AirTime');
                break;
              case 'userviews':
                fields.push('Name');
                break;
              case 'onnow':
                fields.push('CurrentProgramName');
                fields.push('CurrentProgramParentNameOrName');
                fields.push('CurrentProgramTime');
                break;
              case 'resume':
              case 'downloads':
              case 'nextup':
                fields.push('Name');
                fields.push('ProductionYear');
                fields.push('ParentName');
                lines = 2;
                break;
              case 'resumeaudio':
                fields.push('Name');
                fields.push('Album');
                fields.push('ParentName');
                break;
              case 'appinfo':
                break;
              default:
                switch ((section.ItemTypes || [])[0]) {
                  case 'Program':
                    fields.push('ParentName');
                    fields.push('Name');
                    fields.push('ChannelName');
                    fields.push('AirTime');
                    break;
                  case 'TvChannel':
                    fields.push('Name');
                    fields.push('CurrentProgramParentName');
                    fields.push('CurrentProgramTime');
                    break;
                  default:
                    if (collectionType !== 'photos') {
                      fields.push('Name');
                    }
                    switch (collectionType) {
                      case 'movies':
                      case 'tvshows':
                      case 'musicvideos':
                      case 'books':
                      case 'trailers':
                      case 'games':
                        fields.push('ProductionYear');
                        break;
                      default:
                        if (!collectionType) {
                          fields.push('ProductionYear');
                        }
                        break;
                    }
                    switch (collectionType) {
                      case 'music':
                      case 'audiobooks':
                      case 'tvshows':
                      case 'musicvideos':
                        fields.push('ParentName');
                        break;
                      default:
                        if (!collectionType) {
                          fields.push('ParentName');
                        }
                        break;
                    }
                    if (fields.length > 1) {
                      lines = collectionType === 'musicvideos' || !collectionType ? 3 : 2;
                    }
                    break;
                }
                break;
            }
          }
          var preferThumb = 'auto';
          var preferSeriesImage = void 0;
          if (['resume', 'nextup', 'activerecordings'].includes(sectionType)) {
            preferThumb = true;
          } else if (collectionType !== 'audiobooks' && collectionType !== 'music' && sectionType !== 'onnow') {
            preferThumb = null;
          }
          switch (section.ImageType) {
            case 'Thumb':
              preferThumb = true;
              break;
            case 'Primary':
              preferThumb = null;
              preferSeriesImage = true;
              break;
            default:
              break;
          }
          if (smallSideFooter && fields.length) {
            lines = 1;
          } else if (sideFooter && fields.length > 2) {
            lines = 2;
          }
          section.ListOptions = {
            shape: preferThumb === true && !preferSeriesImage ? 'backdrop' : 'autooverflow',
            preferThumb: preferThumb,
            inheritThumb: preferThumb === 'auto' && collectionType !== 'audiobooks' && collectionType !== 'music' ? false : null,
            preferSeriesImage: preferSeriesImage,
            showChildCountIndicator: ['latestmedia'].includes(sectionType),
            context: 'home',
            hoverPlayButton: !['userviews'].includes(sectionType),
            image: smallSideFooter ? false : null,
            sideFooter: sideFooter ? true : null,
            smallSideFooter: smallSideFooter ? true : null,
            fields: fields,
            showCurrentProgramImage: sectionType === 'onnow',
            showAirDateTime: sectionType === 'onnow' ? false : true,
            showAirEndTime: sectionType === 'onnow' ? false : true,
            defaultShape: sectionType === 'onnow' ? 'portrait' : null,
            action: sectionType === 'onnow' ? 'programlink' : sectionType === 'appinfo' ? 'custom' : null,
            multiSelect: !['onnow', 'appinfo'].includes(sectionType),
            albumFirst: sectionType === 'resumeaudio',
            lines: lines,
            focusTransformTitleAdjust: true,
            contextMenu: !['appinfo'].includes(sectionType),
            hoverMenu: !['appinfo'].includes(sectionType)
          };
          section.CommandOptions = {
            createRecording: sectionType === 'onnow' ? false : null,
            removeFromResume: ['resume', 'resumeaudio'].includes(sectionType),
            removeFromNextUp: sectionType === 'nextup'
          };
        }
        return sections;
      });
    });
  };
  HomeTab.prototype.onResume = function (options) {
    if (_skinviewmanager.default.getSkinOptions().showTitleOnHomeTab) {
      var apiClient = _connectionmanager.default.currentApiClient();
      var serverName = apiClient.serverName();
      var titleString = _globalize.default.translate('Home') + ' - ' + serverName;
      _appheader.default.setTitle(titleString);
    }
    _basetab.default.prototype.onResume.apply(this, arguments);
    return _sectionscontroller.default.prototype.onResume.apply(this, arguments);
  };
  HomeTab.prototype.onPause = function () {
    _basetab.default.prototype.onPause.apply(this, arguments);
    _sectionscontroller.default.prototype.onPause.apply(this, arguments);
  };
  HomeTab.prototype.destroy = function () {
    _basetab.default.prototype.destroy.apply(this, arguments);
    _sectionscontroller.default.prototype.destroy.apply(this, arguments);
  };
  var _default = _exports.default = HomeTab;
});
