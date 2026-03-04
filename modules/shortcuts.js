define(["exports", "./commandprocessor.js", "./common/inputmanager.js", "./emby-apiclient/connectionmanager.js", "./common/playback/playbackmanager.js", "./common/itemmanager/itemmanager.js", "./layoutmanager.js"], function (_exports, _commandprocessor, _inputmanager, _connectionmanager, _playbackmanager, _itemmanager, _layoutmanager) {
  Object.defineProperty(_exports, "__esModule", {
    value: true
  });
  _exports.default = void 0;
  /* jshint module: true */

  function getVirtualFolder(apiClient, id) {
    return apiClient.getVirtualFolders().then(function (result) {
      return result.Items.filter(function (u) {
        return u.ItemId === id;
      })[0];
    });
  }
  function getItemFromChildNode(child, isMainElement, itemsContainer) {
    var element = getItemElementFromChildNode(child, isMainElement, itemsContainer);
    if (!element) {
      return null;
    }
    return getItemFromElement(element, itemsContainer);
  }
  function getItemElementFromChildNode(child, isMainElement, itemsContainer) {
    var itemSelector = itemsContainer == null ? void 0 : itemsContainer.getItemSelector();
    if (!itemSelector) {
      //throw new Error('itemsContainer required!');
      itemSelector = '.card,.listItem,.epgRow,.dataGridItem';
    }
    if (isMainElement) {
      return child.closest(itemSelector);
    }
    return child.closest('[data-type],' + itemSelector);
  }
  function getItemFromElement(element, itemsContainer) {
    var item;
    if (!itemsContainer) {
      itemsContainer = element.closest('.itemsContainer');
    }
    if (itemsContainer) {
      item = itemsContainer.getItemFromElement(element);
      if (item) {
        return item;
      }
    }
    item = {
      Type: element.getAttribute('data-type'),
      Id: element.getAttribute('data-id'),
      ServerId: element.getAttribute('data-serverid'),
      IsFolder: element.getAttribute('data-isfolder') === 'true',
      Status: element.getAttribute('data-status') || null,
      MediaType: element.getAttribute('data-mediatype') || null,
      ChannelId: element.getAttribute('data-channelid') || null,
      TimerId: element.getAttribute('data-timerid') || null,
      SeriesTimerId: element.getAttribute('data-seriestimerid') || null
    };
    return item;
  }
  function getItem(button, itemsContainer) {
    button = getItemElementFromChildNode(button, null, itemsContainer);
    var itemFromElement = getItemFromElement(button, itemsContainer);
    var type = itemFromElement.Type;
    if (!_itemmanager.default.getItemController(type).isSingleItemFetchRequired(type)) {
      return Promise.resolve(itemFromElement);
    }
    var id = itemFromElement.Id;

    // AddServer
    if (!id) {
      return Promise.resolve(itemFromElement);
    }
    var apiClient = _connectionmanager.default.getApiClient(itemFromElement);
    switch (type) {
      case 'VirtualFolder':
        return getVirtualFolder(apiClient, id);
      case 'User':
        return apiClient.getUser(id);
      case 'Timer':
        return apiClient.getLiveTvTimer(id);
      case 'SeriesTimer':
        return apiClient.getLiveTvSeriesTimer(id);
      default:
        break;
    }
    var fields = ['ShareLevel'];
    fields.push('SyncStatus');
    fields.push('ContainerSyncStatus');
    return apiClient.getItem(apiClient.getCurrentUserId(), id, {
      fields: fields.join(','),
      ExcludeFields: 'Chapters,Overview,People,MediaStreams,Subviews'
    }).then(function (fullItem) {
      fullItem.PlaylistItemId = itemFromElement.PlaylistItemId;
      fullItem.CollectionId = itemFromElement.CollectionId;
      fullItem.PlaylistId = itemFromElement.PlaylistId;
      fullItem.ItemIdInList = itemFromElement.ItemIdInList;
      return fullItem;
    });
  }
  function getUser(item) {
    var apiClient = _connectionmanager.default.getApiClient(item);
    if (!(apiClient != null && apiClient.getCurrentUserId())) {
      return Promise.resolve(null);
    }
    return apiClient.getCurrentUser();
  }
  function showContextMenu(itemElement, options) {
    if (!options.itemsContainer) {
      options.itemsContainer = itemElement.closest('.itemsContainer');
    }
    var itemsContainer = options.itemsContainer;
    return Promise.all([getItem(itemElement, itemsContainer), Emby.importModule('./modules/itemcontextmenu.js')]).then(function (responses) {
      var item = responses[0];
      return getUser(item).then(function (user) {
        if (options.positionTo && !options.itemElement) {
          options.itemElement = itemElement;
        }
        var commandOptions = Object.assign({}, itemsContainer.getCommandOptions(item));

        // pause this so that the itemsContainer will not refresh while dialogs are open
        // this is primarily to make sure that after editing metadata and clicking save, item element has regained focus before the list refreshes
        // this will allow scroll and focus position to be retained
        itemsContainer.pause();
        return responses[1].show(Object.assign(commandOptions, {
          items: [item],
          play: true,
          queue: true,
          playAllFromHere: !item.IsFolder,
          queueAllFromHere: !item.IsFolder,
          user: user,
          multiSelect: ((itemsContainer.currentListOptions || {}).options || {}).multiSelect,
          programInfo: true
        }, options)).then(function (res) {
          itemsContainer.resume({});
          return Promise.resolve(res);
        }, function (err) {
          itemsContainer.resume({});
          return Promise.reject(err);
        });
      });
    });
  }
  function notifyItemsContainerOfCommandResult(itemsContainer, result) {
    itemsContainer.onCommandResult(result);
  }
  function getResolverWithAction(command, itemsContainer) {
    return function (result) {
      if (itemsContainer) {
        notifyItemsContainerOfCommandResult(itemsContainer, {
          command: command,
          result: result
        });
      }
      return Promise.resolve(result);
    };
  }
  function getResolver(itemsContainer) {
    return function (result) {
      if (itemsContainer) {
        notifyItemsContainerOfCommandResult(itemsContainer, result);
      }
      return Promise.resolve(result);
    };
  }
  function executeAction(originalEvent, itemElement, itemsContainer, target, action) {
    if (!target) {
      target = itemElement;
    }
    itemElement = getItemElementFromChildNode(itemElement, null, itemsContainer);

    // this really shouldn't happen because it's the elements of an item that trigger an action in the first place
    // todo: remove at some point later
    if (!itemElement) {
      return Promise.resolve();
    }
    var item = getItemFromElement(itemElement, itemsContainer);
    switch (action) {
      case 'custom':
        {
          itemElement.dispatchEvent(new CustomEvent('action-null', {
            detail: {
              item: item,
              originalEvent: originalEvent
            },
            cancelable: false,
            bubbles: true
          }));
        }
        break;
      default:
        {
          var options = {
            positionTo: target,
            itemElement: itemElement,
            itemsContainer: itemsContainer,
            eventType: originalEvent.type,
            eventTarget: originalEvent.target
          };
          switch (action) {
            case 'togglecheckbox':
              {
                if (originalEvent != null && originalEvent.target.closest('.dragHandle')) {
                  return;
                }
              }
              break;
            case 'menu':
            case 'info':
              if (originalEvent && originalEvent.type === 'click') {
                options.positionY = _layoutmanager.default.tv ? 'top' : 'bottom';
                options.positionX = _layoutmanager.default.tv ? 'right' : 'after';
              } else {
                var _originalEvent$detail;
                if ((_originalEvent$detail = originalEvent.detail) != null && _originalEvent$detail.originalEvent) {
                  options.positionY = _layoutmanager.default.tv ? 'top' : 'bottom';
                  options.positionX = 'after';
                  options.positionClientX = originalEvent.detail.originalEvent.clientX;
                  options.positionClientY = originalEvent.detail.originalEvent.clientY;
                }
              }
              var _resolver = getResolver(itemsContainer);
              showContextMenu(itemElement, options).then(_resolver);
              return Promise.resolve();
            case 'link':
              if (itemsContainer) {
                options.context = ((itemsContainer.currentListOptions || {}).options || {}).context;
              }
              break;
            default:
              break;
          }
          var resolver = getResolverWithAction(action, itemsContainer);
          return _commandprocessor.default.executeCommand(action, [item], options).then(resolver);
        }
    }
    return Promise.resolve();
  }
  function onClick(e) {
    var target = e.target;
    var itemElement = target.closest('.itemAction');
    if (itemElement) {
      var actionElement = itemElement;
      var action = actionElement.getAttribute('data-action');
      if (!action) {
        actionElement = actionElement.closest('[data-action]');
        if (actionElement) {
          action = actionElement.getAttribute('data-action');
        }
      }
      if (action) {
        var itemsContainer = target.closest('.itemsContainer');
        switch (action) {
          case 'openlink':
          case 'default':
          case 'none':
            break;
          default:
            executeAction(e, itemElement, itemsContainer, actionElement, action);
            break;
        }
        switch (action) {
          case 'multiselect':
          case 'openlink':
          case 'toggleitemchecked':
            break;
          default:
            {
              if (action !== 'default') {
                e.preventDefault();
              }
              e.stopPropagation();
              return false;
            }
        }
      }
    }
  }
  function onCommand(e) {
    var cmd = e.detail.command;
    var target;
    var itemsContainer;
    var scroller;
    var itemElement;
    switch (cmd) {
      case 'play':
      case 'playpause':
        {
          target = e.target;
          itemsContainer = target.closest('.itemsContainer');
          itemElement = getItemElementFromChildNode(target, null, itemsContainer);
          if (itemElement) {
            var _itemsContainer;
            if (((_itemsContainer = itemsContainer) == null ? void 0 : _itemsContainer.getAttribute('data-skipplaycommands')) !== 'true') {
              if (!_playbackmanager.default.isPlayingMediaType(['Audio', 'Video']) || _playbackmanager.default.isBackgroundPlayback()) {
                e.preventDefault();
                e.stopPropagation();
                executeAction(e, itemElement, itemsContainer, itemElement, cmd);
              }
            }
          }
          break;
        }
      case 'resume':
      case 'record':
      case 'menu':
      case 'info':
        {
          target = e.target;
          itemsContainer = target.closest('.itemsContainer');
          itemElement = getItemElementFromChildNode(target, null, itemsContainer);
          if (itemElement) {
            e.preventDefault();
            e.stopPropagation();
            executeAction(e, itemElement, itemsContainer, itemElement, cmd);
          }
          break;
        }
      case 'pageup':
        {
          target = e.target;
          itemsContainer = target.closest('.itemsContainer');
          if (itemsContainer) {
            scroller = itemsContainer.closest('[is=emby-scroller]');
            if (scroller && scroller.getAttribute('data-horizontal') === 'false') {
              itemsContainer.pageUp(target);
              e.preventDefault();
              e.stopPropagation();
            }
          }
          break;
        }
      case 'pagedown':
        {
          target = e.target;
          itemsContainer = target.closest('.itemsContainer');
          if (itemsContainer) {
            scroller = itemsContainer.closest('[is=emby-scroller]');
            if (scroller && scroller.getAttribute('data-horizontal') === 'false') {
              itemsContainer.pageDown(target);
              e.preventDefault();
              e.stopPropagation();
            }
          }
          break;
        }
      case 'end':
        {
          target = e.target;
          itemsContainer = target.closest('.itemsContainer');
          if (itemsContainer) {
            scroller = itemsContainer.closest('[is=emby-scroller]');
            if (scroller && scroller.getAttribute('data-horizontal') === 'false') {
              itemsContainer.focusLast();
              e.preventDefault();
              e.stopPropagation();
            }
          }
          break;
        }
      case 'select':
        {
          // handle the enter key on non-button elements
          target = e.target;
          if (target.tagName === 'DIV') {
            if (!target.closest('a,button,.itemAction')) {
              itemsContainer = target.closest('.itemsContainer');
              itemElement = getItemElementFromChildNode(target, null, itemsContainer);
              if (itemElement) {
                (itemElement.querySelector('.itemAction') || itemElement).click();
                e.preventDefault();
                e.stopPropagation();
              }
            }
          }
          break;
        }
      default:
        break;
    }
  }
  function on(context, options) {
    if (!options) {
      options = {};
    }
    if (options.click !== false) {
      context.addEventListener('click', onClick);
    }
    if (options.command !== false) {
      _inputmanager.default.on(context, onCommand);
    }
  }
  function off(context, options) {
    if (!options) {
      options = {};
    }
    context.removeEventListener('click', onClick);
    if (options.command !== false) {
      _inputmanager.default.off(context, onCommand);
    }
  }
  function getShortcutAttributes(item, options) {
    var dataAttributes = [];
    if (!options.isBoundListItem) {
      var type = item.Type;
      if (type) {
        dataAttributes.push({
          name: 'data-type',
          value: type
        });
      }
      var serverId = item.ServerId || options.serverId;
      if (serverId) {
        dataAttributes.push({
          name: 'data-serverid',
          value: serverId
        });
      }
      var mediaType = item.MediaType;
      if (mediaType) {
        dataAttributes.push({
          name: 'data-mediatype',
          value: mediaType
        });
      }
      var channelId = item.ChannelId;
      if (channelId) {
        dataAttributes.push({
          name: 'data-channelid',
          value: channelId
        });
      }
    }
    if (!options.isVirtualList) {
      var itemId = item.Id || item.ItemId;
      if (itemId) {
        dataAttributes.push({
          name: 'data-id',
          value: itemId
        });
      }
    }
    return dataAttributes;
  }
  function getShortcutAttributesHtml(item, options) {
    var dataAttributes = '';
    if (!options.isBoundListItem) {
      var type = item.Type;
      if (type) {
        dataAttributes += ' data-type="' + type + '"';
      }
      var serverId = item.ServerId || options.serverId;
      if (serverId) {
        dataAttributes += ' data-serverid="' + serverId + '"';
      }
      var mediaType = item.MediaType;
      if (mediaType) {
        dataAttributes += ' data-mediatype="' + mediaType + '"';
      }
      var channelId = item.ChannelId;
      if (channelId) {
        dataAttributes += ' data-channelid="' + channelId + '"';
      }
    }
    if (!options.isVirtualList) {
      var itemId = item.Id || item.ItemId;
      if (itemId) {
        dataAttributes += ' data-id="' + itemId + '"';
      }
    }
    return dataAttributes;
  }
  var _default = _exports.default = {
    on: on,
    off: off,
    onClick: onClick,
    getShortcutAttributesHtml: getShortcutAttributesHtml,
    getShortcutAttributes: getShortcutAttributes,
    getItemElementFromChildNode: getItemElementFromChildNode,
    getItemFromChildNode: getItemFromChildNode,
    getItemFromElement: getItemFromElement
  };
});
