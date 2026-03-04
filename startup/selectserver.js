define(["exports", "./../list/list.js", "./../modules/common/globalize.js", "./../modules/emby-elements/emby-input/emby-input.js", "./../modules/emby-elements/emby-button/emby-button.js", "./../modules/emby-elements/emby-scroller/emby-scroller.js", "./../modules/emby-apiclient/connectionmanager.js", "./../modules/common/servicelocator.js", "./../modules/layoutmanager.js"], function (_exports, _list, _globalize, _embyInput, _embyButton, _embyScroller, _connectionmanager, _servicelocator, _layoutmanager) {
  Object.defineProperty(_exports, "__esModule", {
    value: true
  });
  _exports.default = void 0;
  /* jshint module: true */

  function addItems(items) {
    items.push({
      Name: _globalize.default.translate('HeaderAddServer'),
      Type: 'AddServer'
    });
    if (!_connectionmanager.default.isLoggedIntoConnect()) {
      items.push({
        Name: _globalize.default.translate('HeaderSignInWithConnect'),
        Type: 'EmbyConnect'
      });
    }
    if (_servicelocator.appHost.supports('sync')) {
      items.push({
        Name: _globalize.default.translate('Downloads'),
        Type: 'Downloads'
      });
    }
  }
  function SelectServerPage(view, params) {
    this.enableAlphaNumericShortcuts = false;
    this.enableTotalRecordCountDisplay = false;
    this.supportsViewSettings = false;
    _list.default.call(this, view, params);
    this.itemsContainer.setAttribute('data-monitor', 'Servers');
    this.itemsContainer.classList.add('itemsContainer-defaultCardSize');
  }
  Object.assign(SelectServerPage.prototype, _list.default.prototype);
  SelectServerPage.prototype.getSortMenuOptions = function () {
    return [];
  };
  SelectServerPage.prototype.getItemTypes = function () {
    return ['Server'];
  };
  SelectServerPage.prototype.getItems = function (query) {
    return _connectionmanager.default.getAvailableServers().then(function (items) {
      items = items.slice(0);
      addItems(items);
      var totalRecordCount = items.length;
      if (query) {
        if (query.StartIndex) {
          items = items.slice(query.StartIndex);
        }
        if (query.Limit != null && query.Limit < items.length) {
          items.length = query.Limit;
        }
      }
      return {
        Items: items,
        TotalRecordCount: totalRecordCount
      };
    });
  };
  SelectServerPage.prototype.setTitle = function () {

    // handled by appheader
  };
  SelectServerPage.prototype.getBaseListRendererOptions = function () {
    var options = _list.default.prototype.getBaseListRendererOptions.apply(this, arguments);
    options.draggable = false;
    options.multiSelect = false;
    options.action = _layoutmanager.default.tv ? 'menu' : 'connecttoserver';
    options.playQueueIndicator = false;
    return options;
  };
  SelectServerPage.prototype.getCardOptions = function (items, settings) {
    var options = _list.default.prototype.getCardOptions.apply(this, arguments);
    options.shape = 'backdrop';
    options.defaultBackground = true;
    options.fields = ['Name', 'LastServerAddress'];
    return options;
  };
  var _default = _exports.default = SelectServerPage;
});
