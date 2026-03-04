define(["exports", "./../emby-apiclient/connectionmanager.js", "./../common/globalize.js", "./../approuter.js", "./../layoutmanager.js", "./../emby-apiclient/events.js", "./../common/servicelocator.js", "./../common/pluginmanager.js", "./../listview/listview.js", "./../emby-elements/emby-button/paper-icon-button-light.js", "./../emby-elements/emby-itemscontainer/emby-itemscontainer.js", "./../viewmanager/viewmanager.js", "./../common/inputmanager.js", "./../focusmanager.js", "./../cardbuilder/cardbuilder.js", "./../common/itemmanager/itemmanager.js", "./../skinviewmanager.js", "./../common/textencoding.js"], function (_exports, _connectionmanager, _globalize, _approuter, _layoutmanager, _events, _servicelocator, _pluginmanager, _listview, _paperIconButtonLight, _embyItemscontainer, _viewmanager, _inputmanager, _focusmanager, _cardbuilder, _itemmanager, _skinviewmanager, _textencoding) {
  Object.defineProperty(_exports, "__esModule", {
    value: true
  });
  _exports.default = void 0;
  /* jshint module: true */

  // todo: navDrawer doesn't need this, but it should be loaded before themes for correct style precedence. this should be moved to a better place.

  var currentDrawerType = 0;
  var navDrawerContentElement;
  var navDrawerScroller = document.querySelector('.mainDrawer');
  var currentServerId;
  var enableLazyLoadingDrawerContents = false;
  function showAlert(options) {
    return Emby.importModule('./modules/common/dialogs/alert.js').then(function (alert) {
      return alert(options);
    });
  }
  function loadEmbyInput() {
    return Emby.importModule('./modules/emby-elements/emby-input/emby-input.js');
  }
  function getNavDrawerContentElement() {
    if (!navDrawerContentElement) {
      navDrawerContentElement = document.querySelector('.mainDrawerScrollSlider');
    }
    return navDrawerContentElement;
  }
  function getDrawerType(e) {
    var detail = e.detail;
    if (!currentServerId || detail.drawer === false) {
      return 0;
    }
    if (detail.settingsTheme) {
      return 2;
    }
    return 1;
  }
  function getNavOption(options) {
    var route = _approuter.default.getRouteInfo(options.href);
    if (route) {
      if (route.title) {
        options.Name = _globalize.default.translate(route.title);
      }
      if (route.icon) {
        options.Icon = route.icon;
      }
    }
    return options;
  }
  function createSettingsMenuList(pluginItems, apiClient) {
    var serverVersion = apiClient == null ? void 0 : apiClient.serverVersion();
    var links = [{
      Name: _globalize.default.translate('EmbyServer'),
      section: 'server',
      SecondaryText: serverVersion ? _globalize.default.translate('VersionNumber', serverVersion) : null
    }, getNavOption({
      href: _approuter.default.getRouteUrl('manageserver')
    }), getNavOption({
      href: "/dashboard/settings"
    }), getNavOption({
      href: "/users"
    }), getNavOption({
      href: "/embypremiere"
    }), getNavOption({
      href: "/librarysetup"
    })];
    links.push(getNavOption({
      href: "/livetvsetup"
    }));
    links.push(getNavOption({
      href: "/network"
    }));
    links.push(getNavOption({
      href: "/transcoding"
    }));
    links.push(getNavOption({
      href: "/database"
    }));
    links.push(getNavOption({
      href: "/conversions?mode=convert"
    }));
    links.push(getNavOption({
      href: "/scheduledtasks"
    }));
    links.push(getNavOption({
      href: "/logs"
    }));
    addPluginPagesToMainMenu(links, pluginItems, 'server');
    links.push({
      divider: true,
      Name: _globalize.default.translate('Devices')
    });
    links.push(getNavOption({
      href: "/devices"
    }));
    links.push(getNavOption({
      href: "/serverdownloads"
    }));
    links.push(getNavOption({
      href: "/devices/cameraupload.html"
    }));
    addPluginPagesToMainMenu(links, pluginItems, 'devices');
    links.push({
      divider: true,
      Name: _globalize.default.translate('Advanced')
    });
    addPluginPagesToMainMenu(links, pluginItems, 'advanced');
    links.push(getNavOption({
      href: "/plugins"
    }));
    links.push(getNavOption({
      href: "/apikeys"
    }));
    if (!_layoutmanager.default.tv) {
      links.push(getNavOption({
        href: "/metadatamanager"
      }));
    }
    addPluginPagesToMainMenu(links, pluginItems);
    return links;
  }
  function addPluginPagesToMainMenu(links, pluginItems, section, user) {
    for (var i = 0, length = pluginItems.length; i < length; i++) {
      var pluginItem = pluginItems[i];
      if (!_pluginmanager.default.allowPluginPages(pluginItem.PluginId)) {
        continue;
      }
      if (user) {
        if (!pluginItem.EnableInUserMenu) {
          continue;
        }
      } else {
        if (!pluginItem.EnableInMainMenu) {
          continue;
        }
      }
      if (!user && pluginItem.MenuSection !== section) {
        continue;
      }
      var href = pluginItem.Href || _pluginmanager.default.getConfigurationPageUrl(pluginItem.Name);
      if (user) {
        href += '&userId=' + user.Id;
      }
      links.push({
        Name: pluginItem.DisplayName,
        Icon: pluginItem.MenuIcon || 'folder',
        href: href,
        navMenuId: pluginItem.NavMenuId || '/' + href
      });
    }
  }
  function getAdminMenuItems(apiClient, user, signal) {
    if (!_approuter.default.getRouteInfo(_approuter.default.getRouteUrl('manageserver'))) {
      return Promise.resolve([]);
    }
    if (!user.Policy.IsAdministrator) {
      return Promise.resolve([]);
    }
    return apiClient.getConfigurationPages({
      EnableInMainMenu: true,
      UserId: user.Id
    }, signal).then(function (items) {
      return createSettingsMenuList(items, apiClient);
    }, function (err) {
      return [];
    });
  }
  function sortRoutes(a, b) {
    var aOrder = a.order == null ? 1000 : a.order;
    var bOrder = b.order == null ? 1000 : b.order;
    if (aOrder > bOrder) {
      return 1;
    }
    if (bOrder > aOrder) {
      return -1;
    }
    var aName = a.title;
    if (aName) {
      aName = _globalize.default.translate(aName);
    }
    var bName = b.title;
    if (bName) {
      bName = _globalize.default.translate(bName);
    }
    if (aName > bName) {
      return 1;
    }
    if (bName > aName) {
      return -1;
    }
    return 0;
  }
  function getUserSettingsRoutes(user, apiClient, loggedInUser) {
    var routes = _approuter.default.getRoutes().filter(function (r) {
      return enableRouteForUser(r, user, loggedInUser);
    });
    var restrictedFeatures = user.Policy.RestrictedFeatures || [];
    routes = routes.filter(function (r) {
      if (r.featureId) {
        if (restrictedFeatures.includes(r.featureId)) {
          return false;
        }
      }
      if (r.minServerVersion) {
        if (!apiClient.isMinServerVersion(r.minServerVersion)) {
          return false;
        }
      }
      return true;
    });
    routes = routes.sort(sortRoutes);
    return routes;
  }
  function getAppSetingsRoutes() {
    var routes = _approuter.default.getRoutes().filter(function (r) {
      return r.type === 'settings' && r.settingsType !== 'user';
    });
    routes = routes.sort(sortRoutes);
    return routes;
  }
  function enableRouteForUser(route, user, loggedInUser) {
    if (route.type !== 'settings') {
      return false;
    }
    if (route.settingsType !== 'user') {
      return false;
    }
    return _approuter.default.validateUserAccessToRoute(route, user, loggedInUser);
  }
  function mapRouteToMenuItem(route, user) {
    var path = route.path;
    if (path && route.type === 'settings' && route.settingsType === 'user') {
      path += '?userId=' + user.Id;
      path += '&serverId=' + user.ServerId;
    }
    return {
      Name: _globalize.default.translate(route.title),
      href: path,
      Icon: route.icon
    };
  }
  function getAppSettingsMenuItems(options) {
    var items = [];
    var user = options.user;
    if (options.home !== false) {
      items.push(getNavOption({
        ItemClass: 'drawer-home',
        href: _approuter.default.getRouteUrl('home')
      }));
    }
    if (options.search !== false) {
      items.push({
        Name: _globalize.default.translate('Search'),
        Icon: '&#xe8b6;',
        href: '#',
        onclick: 'search',
        ItemClass: 'drawer-search'
      });
    }
    var routes = getAppSetingsRoutes();
    if (routes.length && options.user.Id === options.loggedInUser.Id) {
      var headerText = _skinviewmanager.default.getSkinOptions().shortSettingsHeaders ? _servicelocator.appHost.appName() : _globalize.default.translate('NSettings', _servicelocator.appHost.appName());
      items.push({
        Name: headerText,
        SecondaryText: _globalize.default.translate('VersionNumber', _servicelocator.appHost.appVersion()),
        section: 'app'
      });
      for (var i = 0, length = routes.length; i < length; i++) {
        items.push(mapRouteToMenuItem(routes[i], user));
      }
    }
    var userHeaderText = _skinviewmanager.default.getSkinOptions().shortSettingsHeaders ? user.Name : _textencoding.default.htmlEncode(_globalize.default.translate('NPreferences', user.Name));
    items.push({
      Name: userHeaderText,
      section: 'user'
    });
    return Promise.resolve(items);
  }
  function getSettingsMenuItems(options) {
    var apiClient = options.apiClient;
    var user = options.user;
    var signal = options.signal;
    var promises = [];
    if (options.appSettings !== false) {
      promises.push(getAppSettingsMenuItems(options));
    }
    if (options.serverSettings !== false) {
      promises.push(getAdminMenuItems(apiClient, user, signal));
    }
    return Promise.all(promises).then(function (responses) {
      signal == null || signal.throwIfAborted();
      var items = responses[0];
      if (responses.length > 0) {
        items = items.concat(responses[1]);
      }
      return items;
    });
  }

  // this is simply to avoid loading the resources in tv display mode, when it's not needed
  var embyCollapseLoaded;
  function loadEmbyCollapse() {
    if (embyCollapseLoaded) {
      return Promise.resolve();
    }
    embyCollapseLoaded = true;
    return Emby.importModule('./modules/emby-elements/emby-collapse/emby-collapse.js');
  }
  function getItemsSection(options, title, expanded, listType) {
    var html = '';
    var headerClass = 'navMenuHeader secondaryText';
    if (options.itemClass) {
      headerClass += ' navMenuHeader-' + options.itemClass;
    }
    if (options.headerClass) {
      headerClass += ' ' + options.headerClass;
    }
    html += '<div is="emby-collapse" title="' + title + '" data-expanded="' + expanded + '" class="navDrawerCollapseSection focuscontainer-x navDrawerItemsSection" data-headerclass="' + headerClass + '" data-buttonclass="navDrawerCollapseButton noautofocus" data-iconclass="navDrawerCollapseIcon">';
    html += '<div is="emby-itemscontainer" class="navDrawerItemsContainer itemsContainer vertical-list collapseContent navDrawerCollapseContent" data-fromserver="true" data-listtype="' + listType + '">';
    html += '</div></div>';
    return html;
  }
  var currentListItems;
  function getItemsHtml(items, options) {
    var _options$user;
    // only set this for the global list
    if (options.isGlobalList) {
      currentListItems = items;
    } else {
      options.listItems = items;
    }
    var menuHtml = '';
    if (options.header !== false && !_layoutmanager.default.tv) {
      if (_layoutmanager.default.tv) {
        menuHtml += '<div class="navDrawerHeader flex flex-direction-row align-items-center">';
        menuHtml += '<div class="flex-grow">';
        menuHtml += '<h2 class="navDrawerLogo pageTitleWithLogo pageTitleWithDefaultLogo flex-grow"></h2>';
      } else {
        menuHtml += '<div class="navDrawerHeader flex flex-direction-row align-items-center focusable" data-focusabletype="autofocus">';
        if (options.drawerOptions !== false) {
          menuHtml += '<button type="button" is="paper-icon-button-light" class="btnToggleNavDrawer hidetouch noautofocus" title="" style="font-size:80%;margin-inline-end:0;"><i class="md-icon">menu</i></button>';
        }
        menuHtml += '<a is="emby-linkbutton" class="btnNavDrawerLogo flex-grow" href="' + _approuter.default.getRouteUrl('home') + '" title="' + _globalize.default.translate('Home') + '" aria-label="' + _globalize.default.translate('Home') + '">';
        menuHtml += '<h2 class="navDrawerLogo pageTitleWithLogo pageTitleWithDefaultLogo flex-grow"></h2>';
      }
      if (_layoutmanager.default.tv) {
        menuHtml += '</div>';
      } else {
        menuHtml += '</a>';
      }
      if (!_layoutmanager.default.tv) {
        var icon;
        var title;
        var buttonClass;

        // This is a little bit of a hack to correlate these two things together
        if (enableLazyLoadingDrawerContents) {
          icon = 'view_sidebar';
          title = _globalize.default.translate('HeaderPinSidebar');
          buttonClass = ' btnPinNavDrawer-iconpin';
        } else {
          icon = 'close';
          title = _globalize.default.translate('Close');
          buttonClass = ' btnPinNavDrawer-hovershow';
        }
        if (options.drawerOptions !== false) {
          menuHtml += '<button type="button" is="paper-icon-button-light" class="btnPinNavDrawer noautofocus secondaryText' + buttonClass + '" title="' + title + '" aria-label="' + title + '"><i class="md-icon btnPinNavDrawerIcon autortl">' + icon + '</i></button>';
        } else {
          // this is only to have it consume the same amount of space so that things don't jump around when hiding/showing the icon
          menuHtml += '<div style="visibility:hidden;" class="btnPinNavDrawer secondaryText paper-icon-button-light' + buttonClass + '"><i class="md-icon btnPinNavDrawerIcon autortl">' + icon + '</i></div>';
        }
      }
      menuHtml += '</div>';
      menuHtml += '</div>';
    }
    var collapsible = options.collapsible !== false && !_layoutmanager.default.tv;
    var sectionClose = collapsible ? '</div></div>' : '</div>';
    var isSectionOpen = false;
    var serverId = options.serverId;
    var userId = (_options$user = options.user) == null ? void 0 : _options$user.Id;
    var defaultItemsContainerClass = ('navDrawerItemsContainer ' + (options.itemsContainerClass || '')).trim();
    var sectionsContainerAdded = false;

    //const isCurrentViewServer = viewManager.currentViewInfo().roles === 'admin';

    for (var i = 0, length = items.length; i < length; i++) {
      var item = items[i];
      if (item.section) {
        if (isSectionOpen) {
          isSectionOpen = false;
          menuHtml += sectionClose;
        }
      }
      if (item.section === 'playlists') {
        menuHtml += getItemsSection(options, _globalize.default.translate('Playlists'), true, 'playlists');
      } else if (item.section === 'collections') {
        menuHtml += getItemsSection(options, _globalize.default.translate('Collections'), false, 'collections');
      } else if (item.href) {
        //menuHtml += getNavMenuLinkHtml(item, options);
        if (!isSectionOpen) {
          isSectionOpen = true;
          menuHtml += '<div is="emby-itemscontainer" class="' + defaultItemsContainerClass + ' itemsContainer vertical-list" data-listindex="' + i + '"></div>';
        }
      } else if (item.Name) {
        if (isSectionOpen) {
          isSectionOpen = false;
          menuHtml += sectionClose;
        }
        if (!sectionsContainerAdded) {
          menuHtml += '<div is="emby-scroller" class="navdrawerSectionsContainer padded-left-focusscale padded-right-focusscale emby-scroller scrollY scrollY-mini scrollFrameY hiddenScrollY-hover" data-mousewheel="true" data-horizontal="false" data-focusscroll="true"><div class="navdrawerSectionsSlider scrollSlider mainDrawerScrollSlider scrollSliderY mainDrawerScrollSlider-autofont"> ';
          sectionsContainerAdded = true;
        }
        var headerClass = 'navMenuHeader secondaryText';
        if (options.itemClass) {
          headerClass += ' navMenuHeader-' + options.itemClass;
        }
        if (options.headerClass) {
          headerClass += ' ' + options.headerClass;
        }
        if (i === 0) {
          headerClass += ' navMenuHeader-first';
        }
        var itemsContainerClass = defaultItemsContainerClass + ' itemsContainer vertical-list';
        if (collapsible) {
          loadEmbyCollapse();
          var expanded = true; // !isCurrentViewServer || (item.section !== 'app' && item.section !== 'user') || layoutManager.tv;

          menuHtml += '<div is="emby-collapse" title="' + item.Name + '" data-expanded="' + expanded + '" class="navDrawerCollapseSection focuscontainer-x" data-headerclass="' + headerClass + '" data-buttonclass="navDrawerCollapseButton noautofocus" data-iconclass="navDrawerCollapseIcon">';
          itemsContainerClass += ' collapseContent navDrawerCollapseContent';
        } else {
          headerClass += ' flex align-items-center';
          menuHtml += '<div class="' + headerClass + '">';
          menuHtml += '<h3 class="flex-shrink-zero" style="margin:0;">';
          if (item.imageUrl) {
            menuHtml += '<img src="' + item.imageUrl + '" class="navMenuHeaderImage" />';
          }
          menuHtml += item.Name;
          menuHtml += '</h3>';
          if (item.SecondaryText && !_layoutmanager.default.tv) {
            menuHtml += '<div style="margin-inline-start:auto;padding-inline-end:.35em;font-size:92%;">' + item.SecondaryText + '</div>';
          }
          menuHtml += '</div>';
          itemsContainerClass += ' focuscontainer-x';
        }
        menuHtml += '<div is="emby-itemscontainer" class="' + itemsContainerClass + '" data-listindex="' + (i + 1) + '"';
        if (serverId) {
          menuHtml += ' data-serverid="' + serverId + '"';
        }
        if (userId) {
          menuHtml += ' data-userid="' + userId + '"';
        }
        if (item.section) {
          menuHtml += ' data-section="' + item.section + '"';
        }
        menuHtml += '>';
        isSectionOpen = true;
      }
    }
    if (isSectionOpen) {
      isSectionOpen = false;
      menuHtml += sectionClose;
    }
    if (sectionsContainerAdded) {
      menuHtml += '</div></div>';
    }
    return menuHtml;
  }
  function getSettingsDrawerHtmlWithoutUser(apiClient, signal) {
    return apiClient.getCurrentUser({
      signal: signal
    }).then(function (user) {
      return getSettingsDrawerHtml({
        apiClient: apiClient,
        user: user,
        loggedInUser: user,
        signal: signal,
        isGlobalList: true
      });
    });
  }
  function getSettingsDrawerHtml(options) {
    return getSettingsMenuItems(options).then(function (items) {
      options.drawerOptions = false;
      return getItemsHtml(items, options);
    });
  }
  function getUserViews(apiClient, signal) {
    return apiClient.getUserViews({}, apiClient.getCurrentUserId(), signal).then(function (result) {
      var items = result.Items;
      var list = [];
      for (var i = 0, length = items.length; i < length; i++) {
        var view = items[i];
        list.push(view);
      }
      return list;
    }, function (err) {
      console.error('error getting user views: ', err);
      return [];
    });
  }
  function getUserImageUrl(user, apiClient, options) {
    if (!options) {
      options = {};
    }
    options.type = "Primary";
    if (user.PrimaryImageTag) {
      options.tag = user.PrimaryImageTag;
      return apiClient.getUserImageUrl(user.Id, options);
    }
    return null;
  }
  function getLibraryDrawerHtml(apiClient, signal) {
    return apiClient.getCurrentUser({
      signal: signal
    }).then(function (user) {
      return getUserViews(apiClient, signal).then(function (result) {
        var items = result;
        var menuItems = [];
        if (!_layoutmanager.default.tv) {
          menuItems.push({
            Name: _globalize.default.translate('Expand'),
            Icon: '&#xe5d2;',
            href: '#',
            onclick: 'menu',
            Id: 'btnExpandMiniDrawer'
          });
        }
        if (_layoutmanager.default.tv) {
          menuItems.push({
            Name: user.Name,
            Icon: _itemmanager.default.getDefaultIcon({
              Type: 'User'
            }),
            href: '#',
            onclick: 'changeuser',
            //ShortOverview: globalize.translate('HeaderChangeUser'),
            ImageUrl: getUserImageUrl(user, apiClient)
          });
          if (_servicelocator.appHost.supports('multiserver')) {
            menuItems.push({
              Name: apiClient.serverName(),
              Icon: _itemmanager.default.getDefaultIcon({
                Type: 'Server'
              }),
              href: '#',
              onclick: 'selectserver'
              //ShortOverview: globalize.translate('HeaderChangeServer')
            });
          }
        }
        if (!_layoutmanager.default.tv) {
          menuItems.push(getNavOption({
            ItemClass: 'drawer-home',
            href: _approuter.default.getRouteUrl('home')
          }));
        }
        menuItems.push({
          Name: _globalize.default.translate('Search'),
          Icon: '&#xe8b6;',
          href: '#',
          onclick: 'search',
          ItemClass: 'drawer-search',
          navMenuId: 'search'
        });
        if (_layoutmanager.default.tv) {
          menuItems.push(getNavOption({
            ItemClass: 'drawer-home',
            href: _approuter.default.getRouteUrl('home')
          }));
        }
        if (_layoutmanager.default.tv) {
          menuItems.push({
            Name: _globalize.default.translate('Settings'),
            Icon: '&#xe8B8;',
            href: '#',
            onclick: 'settings'
          });
        }

        //if (!layoutManager.tv) {
        menuItems.push({
          Name: _globalize.default.translate('HeaderMyMedia')
        });
        //}

        if (user.Policy.EnableContentDownloading && _servicelocator.appHost.supports('sync')) {
          menuItems.push(getNavOption({
            href: _approuter.default.getRouteUrl('downloads'),
            Name: _globalize.default.translate('Downloads')
          }));
        }
        for (var i = 0, length = items.length; i < length; i++) {
          var item = items[i];
          var url = _approuter.default.getRouteUrl(item);
          item.href = url;
          menuItems.push(item);
        }
        if (user.Policy.IsAdministrator) {
          if (_approuter.default.getRouteInfo(_approuter.default.getRouteUrl('manageserver'))) {
            if (!_layoutmanager.default.tv) {
              menuItems.push(getNavOption({
                href: '/metadatamanager'
              }));
            }
          }
        }
        if (!_layoutmanager.default.tv) {
          menuItems.push({
            section: 'playlists'
          });
          menuItems.push({
            section: 'collections'
          });
        }
        return getItemsHtml(menuItems, {
          isGlobalList: true
        });
      });
    });
  }
  function getDrawerHtml(type, signal) {
    var apiClient = currentServerId ? _connectionmanager.default.getApiClient(currentServerId) : _connectionmanager.default.currentApiClient();
    if (type === 1 && currentServerId) {
      return getLibraryDrawerHtml(apiClient, signal);
    }
    if (type === 2) {
      return getSettingsDrawerHtmlWithoutUser(apiClient, signal);
    }
    return Promise.resolve('');
  }
  function getPlaylistsFetchFn(serverId) {
    return function () {
      var apiClient = _connectionmanager.default.getApiClient(serverId);
      return apiClient.getItems(apiClient.getCurrentUserId(), {
        Fields: 'PrimaryImageAspectRatio',
        Recursive: true,
        IncludeItemTypes: 'Playlist'
      });
    };
  }
  function getCollectionsFetchFn(serverId) {
    return function () {
      var apiClient = _connectionmanager.default.getApiClient(serverId);
      return apiClient.getItems(apiClient.getCurrentUserId(), {
        Fields: 'PrimaryImageAspectRatio',
        Recursive: true,
        IncludeItemTypes: 'BoxSet'
      });
    };
  }
  function getListOptions(items) {
    var _options$itemClass;
    var options = this;
    var isSettings = (_options$itemClass = options.itemClass) == null ? void 0 : _options$itemClass.includes('settings');
    return {
      renderer: _listview.default,
      options: {
        action: 'link',
        image: true,
        fields: ['Name'],
        enableUserDataButtons: false,
        moreButton: false,
        highlight: false,
        mediaInfo: false,
        dropTarget: true,
        itemClass: ('navMenuOption navDrawerListItem ' + (options.itemClass || '')).trim(),
        contentWrapperClass: _layoutmanager.default.tv && !isSettings ? 'navMenuOption-listItem-content-reduceleftpadding' : 'navMenuOption-listItem-content',
        listItemBodyClassName: ('navDrawerListItemBody ' + (options.listItemBodyClass || '')).trim(),
        imageContainerClass: 'navDrawerListItemImageContainer navDrawerListItemImageContainer-transparent',
        hoverPlayButton: false,
        multiSelect: false,
        draggable: false,
        draggableXActions: false,
        iconClass: isSettings ? 'navDrawerListItemIcon' : 'navDrawerListItemIcon navDrawerListItemIcon-drawer',
        imagePlayButton: false,
        largeFont: false,
        enableSideMediaInfo: false,
        iconSpacing: true,
        noTextWrap: true,
        allowBorderXOffset: false,
        playQueueIndicator: false
      },
      virtualScrollLayout: 'vertical-list'
    };
  }
  function getMenuItemsFromListIndex(index, allListItems) {
    var items = allListItems.slice(index);
    for (var i = 0, length = items.length; i < length; i++) {
      if (!items[i].href) {
        items.length = i;
        return items;
      }
    }
    return items;
  }
  function getUserMenuItemsFromServer(apiClient, user, signal) {
    return apiClient.getConfigurationPages({
      EnableInUserMenu: true,
      UserId: user.Id
    }, signal).then(function (items) {
      var links = [];
      addPluginPagesToMainMenu(links, items, null, user);
      return links;
    }, function (err) {
      return [];
    });
  }
  function getUserMenuItems(serverId, userId, includeFromServer, signal) {
    var apiClient = _connectionmanager.default.getApiClient(serverId);
    return apiClient.getUser(userId, null, signal).then(function (user) {
      return apiClient.getCurrentUser({
        signal: signal
      }).then(function (loggedInUser) {
        var serverItemPromise = includeFromServer ? getUserMenuItemsFromServer(apiClient, user, signal) : Promise.resolve([]);
        return serverItemPromise.then(function (serverItems) {
          var routes = getUserSettingsRoutes(user, apiClient, loggedInUser);
          var items = routes.map(function (i) {
            return mapRouteToMenuItem(i, user);
          });
          items = items.concat(serverItems);
          if (_connectionmanager.default.isLoggedIntoConnect() && _servicelocator.appHost.supports('deleteembyconnectaccount')) {
            items.push({
              Name: _globalize.default.translate('DeleteEmbyConnectAccount'),
              href: '#',
              Icon: '&#xef66;',
              onclick: 'deleteembyconnectaccount'
            });
          }
          return items;
        });
      });
    });
  }
  function getNavMenuItemsResult(query, signal) {
    var data = this;
    var allListItems = data.listItems;
    var itemsContainer = data.itemsContainer;
    var signalFromView = data.signal;
    if (signalFromView) {
      signal = AbortSignal.any([signal, signalFromView]);
    }
    var section = itemsContainer.getAttribute('data-section');
    var itemPromise;
    if (section === 'user') {
      var serverId = itemsContainer.getAttribute('data-serverid') || _connectionmanager.default.currentApiClient().serverId();
      var userId = itemsContainer.getAttribute('data-userid') || _connectionmanager.default.getApiClient(serverId).getCurrentUserId();
      itemPromise = getUserMenuItems(serverId, userId, itemsContainer.getAttribute('data-fromserver') === 'true', signal);
    } else {
      itemPromise = Promise.resolve(getMenuItemsFromListIndex(parseInt(itemsContainer.getAttribute('data-listindex')), allListItems));
    }
    return itemPromise.then(function (items) {
      return {
        Items: items,
        TotalRecordCount: items.length
      };
    });
  }
  function getNavMenuListOptionsInternal(items, options, enableOverview) {
    var _items$, _options$itemClass2;
    var fields = ['Name'];
    if (enableOverview) {
      fields.push('ShortOverview');
    }
    if (options.asideIcon) {
      for (var i = 0, length = items.length; i < length; i++) {
        items[i].asideIcon = '&#xe5cc;';
      }
    }
    var apiClient = (_items$ = items[0]) != null && _items$.ServerId ? _connectionmanager.default.getApiClient(items[0]) : null;
    var user = apiClient == null ? void 0 : apiClient.getCurrentUserCached();
    if (items.length && user) {
      //alert(itemManager.getCommands({ items: [items[0]], user: user })[0].id);
    }
    var isSettings = (_options$itemClass2 = options.itemClass) == null ? void 0 : _options$itemClass2.includes('settings');
    return {
      renderer: _listview.default,
      options: {
        action: 'custom',
        fields: fields,
        enableUserDataButtons: false,
        moreButton: false,
        highlight: options.highlight == null ? false : options.highlight,
        border: options.border,
        mediaInfo: false,
        dropTarget: false,
        itemClass: ('navMenuOption navDrawerListItem ' + (options.itemClass || '')).trim(),
        contentWrapperClass: _layoutmanager.default.tv && !isSettings ? 'navMenuOption-listItem-content-reduceleftpadding' : 'navMenuOption-listItem-content',
        listItemBodyClassName: ('navDrawerListItemBody ' + (options.listItemBodyClass || '')).trim(),
        imageContainerClass: 'navDrawerListItemImageContainer' + (enableOverview ? ' navDrawerListItemImageContainer-padded' : ''),
        hoverPlayButton: false,
        multiSelect: false,
        contextMenu: items.length > 0 && user != null && _itemmanager.default.getCommands({
          items: [items[0]],
          user: user
        }).length > 0,
        draggable: false,
        draggableXActions: false,
        iconClass: isSettings ? 'navDrawerListItemIcon' : 'navDrawerListItemIcon navDrawerListItemIcon-drawer',
        imagePlayButton: false,
        // only needed for now until listItem markup is reworked
        tooltip: true,
        preferIcon: !enableOverview,
        addImageSizeToUrl: true,
        enableSideMediaInfo: false,
        iconSpacing: true,
        noTextWrap: true,
        allowBorderXOffset: options.allowBorderXOffset === true,
        itemBackground: options.itemBackground,
        playQueueIndicator: false
      },
      virtualScrollLayout: 'vertical-list'
    };
  }
  function getFirstNavMenuListOptions(items) {
    var options = this;
    return getNavMenuListOptionsInternal.call(this, items, options, _layoutmanager.default.tv);
  }
  function getNavMenuListOptions(items) {
    var options = this;
    return getNavMenuListOptionsInternal.call(this, items, options);
  }
  function onItemsContainerUpgrade() {
    return this.resume({
      refresh: true
    });
  }
  function waitForUpgrade(itemsContainer) {
    return itemsContainer.waitForCustomElementUpgrade().then(onItemsContainerUpgrade.bind(itemsContainer));
  }
  function initItemsContainers(elem, options) {
    var apiClient = currentServerId ? _connectionmanager.default.getApiClient(currentServerId) : _connectionmanager.default.currentApiClient();
    var itemsContainers = elem.querySelectorAll('.itemsContainer');
    var promises = [];
    if (!options) {
      options = {};
    }
    if (!_layoutmanager.default.tv) {
      promises.push(loadEmbyInput());
    }
    for (var i = 0, length = itemsContainers.length; i < length; i++) {
      var itemsContainer = itemsContainers[i];
      var type = itemsContainer.getAttribute('data-listtype');
      if (type === 'playlists') {
        itemsContainer.fetchData = getPlaylistsFetchFn(apiClient.serverId());
        itemsContainer.getListOptions = getListOptions.bind(options);
        itemsContainer.parentContainer = itemsContainer.closest('.navDrawerCollapseSection');
      } else if (type === 'collections') {
        itemsContainer.fetchData = getCollectionsFetchFn(apiClient.serverId());
        itemsContainer.getListOptions = getListOptions.bind(options);
        itemsContainer.parentContainer = itemsContainer.closest('.navDrawerCollapseSection');
      } else if (itemsContainer.hasAttribute('data-listindex') || itemsContainer.hasAttribute('data-section')) {
        itemsContainer.fetchData = getNavMenuItemsResult.bind({
          itemsContainer: itemsContainer,
          listItems: options.listItems || currentListItems,
          signal: options.signal
        });
        if (itemsContainer.getAttribute('data-listindex') === '0') {
          itemsContainer.getListOptions = options.getNavMenuListOptions || getFirstNavMenuListOptions.bind(options);
        } else {
          itemsContainer.getListOptions = options.getNavMenuListOptions || getNavMenuListOptions.bind(options);
        }
        itemsContainer.addEventListener('action-null', onItemAction);
      } else {
        continue;
      }
      itemsContainer.afterRefresh = afterItemsContainerRefresh;
      promises.push(waitForUpgrade(itemsContainer));
    }
    elem.itemsContainers = itemsContainers;
    return Promise.all(promises);
  }
  function triggerSearch(e, txtNavDrawerSearch) {
    var value = txtNavDrawerSearch.value;
    _inputmanager.default.trigger('search', {
      sourceElement: _viewmanager.default.currentView(),
      originalEvent: e,
      value: value
    });
  }
  function onTxtSearchInput(e) {
    switch (e.detail.command) {
      case 'select':
        {
          triggerSearch(e, this);
          break;
        }
      case 'down':
        {
          if (this.isSelectionDialogOpen()) {
            this.focusSelectionDialog();
            e.preventDefault();
          }
          break;
        }
      default:
        break;
    }
  }
  function onNavDrawerSearchFormSubmit(e) {
    console.log('onNavDrawerSearchFormSubmit');
    e.preventDefault();
    var txtNavDrawerSearch = this.querySelector('.txtNavDrawerSearch');
    txtNavDrawerSearch.closeSelectionDialog();
    triggerSearch(e, txtNavDrawerSearch);
  }
  function onTextSearchFocus(e) {
    if (!this._selectionOpen && this.value) {
      triggerSearch(e, this);
    }
  }
  function onTextSearchInput(e) {

    // stop doing this because it unexpectedly navigates to search
    //if (!this.value) {
    //    triggerSearch(e, this);
    //}
  }
  function onTextSearchItemSelected(e) {
    _approuter.default.showItem(e.detail.item);
  }
  function onTextSearchItemSelectionOpen(e) {
    this._selectionOpen = true;
  }
  function onTextSearchItemSelectionClose(e) {
    this._selectionOpen = false;
  }
  function onTextSearchItemSelectionCancelled(e) {
    _focusmanager.default.focus(this);
  }
  var currentViewEvent;
  function getSearchItems(query) {
    var _instance$currentSear, _currentViewEvent;
    var instance = this;
    (_instance$currentSear = instance.currentSearchAbortController) == null || _instance$currentSear.abort();
    var abortController = new AbortController();
    instance.currentSearchAbortController = abortController;
    var txtNavDrawerSearch = instance;
    var apiClient = currentServerId ? _connectionmanager.default.getApiClient(currentServerId) : _connectionmanager.default.currentApiClient();
    query = Object.assign({
      SearchTerm: txtNavDrawerSearch.value,
      Recursive: true,
      Fields: 'PrimaryImageAspectRatio,PremiereDate,ProductionYear',
      EnableUserData: false,
      GroupProgramsBySeries: true
    }, query);
    query.Limit = 30;
    var querySignal = abortController.signal;
    var currentViewEventSignal = (_currentViewEvent = currentViewEvent) == null || (_currentViewEvent = _currentViewEvent.detail) == null || (_currentViewEvent = _currentViewEvent.abortController) == null ? void 0 : _currentViewEvent.signal;
    if (currentViewEventSignal) {
      querySignal = AbortSignal.any([querySignal, currentViewEventSignal]);
    }
    return apiClient.getItems(apiClient.getCurrentUserId(), query, querySignal);
  }
  function afterItemsContainerRefresh() {
    if (currentViewEvent) {
      updateSelectedItemForItemsContainer(this, currentViewEvent);
    }
    if (this.getAttribute('data-fromserver') !== 'true') {
      this.setAttribute('data-fromserver', 'true');
      return this.refreshItems();
    }
    var homeItem = this.querySelector('.drawer-home');
    if (homeItem) {
      if (!_layoutmanager.default.tv) {
        var searchTextHtml = '<form class="navDrawerSearchForm hidetouch" style="margin:0;padding:0;"><div class="inputContainer navDrawerSearchFieldContainer">';
        searchTextHtml += '<i class="md-icon navDrawerSearchIcon secondaryText">search</i>';
        searchTextHtml += '<input is="emby-input" type="search" labelclass="navDrawerSearchFieldContainer-label" label="" placeholder="' + _globalize.default.translate('Search') + '" title="' + _globalize.default.translate('Search') + '" data-autocompleteitems="true" autocomplete="off" class="txtNavDrawerSearch" data-refocus="false" />';
        searchTextHtml += '</div>';
        searchTextHtml += '</form>';
        this.insertAdjacentHTML('afterbegin', searchTextHtml);
        var txtNavDrawerSearch = this.querySelector('.txtNavDrawerSearch');
        var navDrawerSearchForm = this.querySelector('.navDrawerSearchForm');
        _inputmanager.default.on(txtNavDrawerSearch, onTxtSearchInput);
        txtNavDrawerSearch.addEventListener('focus', onTextSearchFocus);
        txtNavDrawerSearch.addEventListener('input', onTextSearchInput);
        txtNavDrawerSearch.addEventListener('itemselected', onTextSearchItemSelected);
        txtNavDrawerSearch.addEventListener('selectionopen', onTextSearchItemSelectionOpen);
        txtNavDrawerSearch.addEventListener('selectionclose', onTextSearchItemSelectionClose);
        txtNavDrawerSearch.addEventListener('selectioncancel', onTextSearchItemSelectionCancelled);
        navDrawerSearchForm.addEventListener('submit', onNavDrawerSearchFormSubmit);
        txtNavDrawerSearch.getItems = getSearchItems.bind(txtNavDrawerSearch);
      }
    }
  }
  function onSetInnerHtmlCallback(html, signal) {
    if (html == null) {
      return;
    }
    if (!html) {
      currentDrawerType = 0;
    }
    var elem = getNavDrawerContentElement();
    elem.innerHTML = html;
    initItemsContainers(elem, {
      signal: signal
    });
    elem.scrollTop = 0;
  }
  function onRequestError(e) {
    // could be due to signal abortion
    console.error('error filling drawer: ', e);
  }
  function updateDrawerContents(e, type, signal, autoFocusAfterLoad) {
    var promises = [getDrawerHtml(type, signal), _layoutmanager.default.tv ? Promise.resolve() : loadEmbyCollapse(), _layoutmanager.default.tv ? Promise.resolve() : loadEmbyInput()];
    Promise.all(promises).then(function (responses) {
      var html = responses[0];

      //console.log('navdrawercontent.updateDrawerContents: drawerType: ' + type + ', aborted: ' + signal?.aborted);

      if (!(signal != null && signal.aborted)) {
        // this can't be set until after the abortSignal has been checked
        currentDrawerType = type;
        onSetInnerHtmlCallback(html, signal);
        if (autoFocusAfterLoad) {
          setTimeout(autoFocus, 100);
        }
      }
    }, onRequestError);
  }
  function getItemIndexFromNavMenuId(itemsContainer, currentNavMenuId) {
    currentNavMenuId = (currentNavMenuId || '').toLowerCase();
    var items = itemsContainer.items || [];
    for (var i = 0, length = items.length; i < length; i++) {
      var item = items[i];
      var navMenuId = item.navMenuId;
      if (!navMenuId && item.href) {
        var routeInfo = _approuter.default.getRouteInfo(item.href);
        navMenuId = routeInfo ? routeInfo.navMenuId || item.href : item.href;
      }
      if (currentNavMenuId === (navMenuId || '').toLowerCase()) {
        return i;
      }
    }
    return -1;
  }
  function updateSelectedItemForItemsContainer(itemsContainer, e) {
    var currentNavMenuId = e.detail.navMenuId;
    var navDrawerElement = getNavDrawerContentElement();
    var newSelectedOption = currentNavMenuId ? navDrawerElement.querySelector('.navMenuOption[data-navmenuid="' + currentNavMenuId + '"]') : null;
    if (itemsContainer.hasAttribute('data-listindex')) {
      var itemIndexFromNavMenuId = getItemIndexFromNavMenuId(itemsContainer, currentNavMenuId);
      if (itemIndexFromNavMenuId !== -1) {
        newSelectedOption = itemsContainer.getElement(itemIndexFromNavMenuId);
      }
    }
    if (!newSelectedOption) {
      if (e.detail.params && e.detail.params.id && e.detail.params.serverId) {
        var indexOfItem = itemsContainer.indexOfItemId(e.detail.params.id);
        if (indexOfItem !== -1) {
          var itemFromNavOption = itemsContainer.getItem(indexOfItem);
          if (itemFromNavOption && itemFromNavOption.ServerId === e.detail.params.serverId) {
            newSelectedOption = itemsContainer.getElement(indexOfItem);
          }
        }
      }
    }
    if (newSelectedOption && newSelectedOption.classList.contains('navMenuOption-selected')) {
      return true;
    }
    if (newSelectedOption) {
      var currentSelectedOption = navDrawerElement.querySelector('.navMenuOption-selected');
      if (currentSelectedOption) {
        currentSelectedOption.classList.remove('navMenuOption-selected');
      }
      newSelectedOption.classList.add('navMenuOption-selected');
      if (e.detail.requiresDynamicTitle) {
        setTitleFromSelectedOption(newSelectedOption);
      }
      navDrawerScroller.scrollToElement(newSelectedOption, {
        behavior: 'instant'
      });
      return true;
    }
  }
  function updateSelectedItem(e) {
    var navDrawerElement = getNavDrawerContentElement();
    var itemsContainers = navDrawerElement.itemsContainers || [];
    for (var i = 0, length = itemsContainers.length; i < length; i++) {
      if (updateSelectedItemForItemsContainer(itemsContainers[i], e)) {
        break;
      }
    }
  }
  function onViewShow(e) {
    currentViewEvent = e;
    enableLazyLoadingDrawerContents = !e.detail.drawerInline;
    onViewShowInternal(e, !enableLazyLoadingDrawerContents);
  }
  function onViewShowInternal(e, loadContent, autoFocusAfterLoad) {
    var drawerType = getDrawerType(e);

    //console.log('navdrawercontent.onViewShowInternal: drawerType: ' + drawerType + ', loadContent: ' + loadContent + ', path:' + e.detail.path + '--' + new Error().stack);

    if (drawerType !== currentDrawerType) {
      var _e$detail;
      var signal = (_e$detail = e.detail) == null || (_e$detail = _e$detail.abortController) == null ? void 0 : _e$detail.signal;
      if (loadContent) {
        var _e$detail2;
        updateDrawerContents(e, drawerType, (_e$detail2 = e.detail) == null || (_e$detail2 = _e$detail2.abortController) == null ? void 0 : _e$detail2.signal, autoFocusAfterLoad);
      } else {
        onSetInnerHtmlCallback('', signal);
        if (autoFocusAfterLoad) {
          autoFocus();
        }
      }
    } else if (currentDrawerType) {
      if (loadContent) {
        updateSelectedItem(e);
      }
      if (autoFocusAfterLoad) {
        setTimeout(autoFocus, 100);
      }
    }
  }
  function onLocalUserSignedIn(e, serverId, userId) {
    currentServerId = serverId;
    currentDrawerType = 0;
  }
  function onLocalUserSignedOut() {
    currentServerId = null;
  }
  _events.default.on(_connectionmanager.default, 'localusersignedin', onLocalUserSignedIn);
  _events.default.on(_connectionmanager.default, 'localusersignedout', onLocalUserSignedOut);
  function onBeforeOpen(autoFocusAfterLoad) {
    if (enableLazyLoadingDrawerContents) {
      onViewShowInternal(currentViewEvent, true, autoFocusAfterLoad);
    }
  }
  function autoFocus(options) {
    var navDrawerElement = getNavDrawerContentElement();
    var elem = navDrawerElement.querySelector('.navMenuOption-selected');
    if (elem) {
      if (_focusmanager.default.isCurrentlyFocusable(elem)) {
        _focusmanager.default.focus(elem, {
          instantScroll: true
        });
        return elem;
      }
    }
    if (!options) {
      options = {};
    }
    options.instantScroll = true;
    return _focusmanager.default.autoFocus(navDrawerElement, options);
  }
  var navDrawerContent = {
    onViewShow: onViewShow,
    onBeforeOpen: onBeforeOpen,
    autoFocus: autoFocus,
    getSettingsDrawerHtml: getSettingsDrawerHtml,
    getAppSettingsMenuItems: getAppSettingsMenuItems,
    getItemsHtml: getItemsHtml,
    initItemsContainers: initItemsContainers
  };
  function setTitleFromSelectedOption(newSelectedOption) {
    var link = newSelectedOption.querySelector('.listItemBodyText') || newSelectedOption;
    var title = (link.innerText || link.textContent).trim();
    _events.default.trigger(navDrawerContent, 'dynamic-title', [title]);
  }
  function deleteEmbyConnectAccount() {
    var prefix = _servicelocator.appHost.supports('externallinks') && _servicelocator.appHost.supports('targetblank') ? '<a is="emby-linkbutton" href="https://emby.media/community" target="_blank" class="button-link">' : '';
    var suffix = _servicelocator.appHost.supports('externallinks') && _servicelocator.appHost.supports('targetblank') ? '</a>' : '';
    var html = _globalize.default.translate('DeleteEmbyConnectAccountHelp', prefix, suffix, prefix + 'https://emby.media/community' + suffix);
    showAlert({
      html: html,
      title: _globalize.default.translate('DeleteEmbyConnectAccount')
    });
  }
  function onNavigated() {
    _events.default.trigger(navDrawerContent, 'navigated');
  }
  function onItemAction(e) {
    var item = e.detail.item;
    var onclick = item.onclick;
    if (onclick === 'logout') {
      var apiClient = currentServerId ? _connectionmanager.default.getApiClient(currentServerId) : _connectionmanager.default.currentApiClient();
      _approuter.default.logout(apiClient);
      return;
    } else if (onclick === 'exit') {
      _servicelocator.appHost.exit();
      return;
    } else if (onclick === 'sleep') {
      _servicelocator.appHost.sleep();
      return;
    } else if (onclick === 'shutdown') {
      _servicelocator.appHost.shutdown();
      return;
    } else if (onclick === 'restart') {
      _servicelocator.appHost.restart();
      return;
    } else if (onclick === 'settings') {
      _approuter.default.showSettings();
      return;
    } else if (onclick === 'selectserver') {
      _approuter.default.showSelectServer();
      return;
    } else if (onclick === 'changeuser') {
      var _apiClient = currentServerId ? _connectionmanager.default.getApiClient(currentServerId) : _connectionmanager.default.currentApiClient();
      _approuter.default.showServerLogin({
        apiClient: _apiClient
      });
      return;
    } else if (onclick === 'search') {
      // pass in current view as source element so that views can more easily override
      _inputmanager.default.trigger('search', {
        sourceElement: _viewmanager.default.currentView(),
        originalEvent: e
      });
      return;
    } else if (onclick === 'menu') {
      _events.default.trigger(navDrawerContent, 'open-requested');
      return;
    } else if (onclick === 'deleteembyconnectaccount') {
      deleteEmbyConnectAccount();
      return;
    }
    var href = item.href;
    if (href) {
      _approuter.default.show(href).then(onNavigated);
    }
  }
  var _default = _exports.default = navDrawerContent;
});
