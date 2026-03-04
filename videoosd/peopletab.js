define(["exports", "./basetab.js", "./../modules/cardbuilder/cardbuilder.js", "./../modules/emby-apiclient/connectionmanager.js", "./../modules/common/itemmanager/itemmanager.js", "./../modules/common/globalize.js", "./../modules/common/appsettings.js"], function (_exports, _basetab, _cardbuilder, _connectionmanager, _itemmanager, _globalize, _appsettings) {
  Object.defineProperty(_exports, "__esModule", {
    value: true
  });
  _exports.default = void 0;
  /* jshint module: true */

  function showAlert(options) {
    return Emby.importModule('./modules/common/dialogs/alert.js').then(function (alert) {
      return alert(options);
    });
  }
  function fetchItems(query) {
    var item = this.currentOptions.displayItem;
    var serverId = item.ServerId;
    var people = (item.People || []).map(function (p) {
      p = Object.assign({}, p);
      p.ServerId = serverId;
      if (p.Type !== 'Person') {
        p.PersonType = p.Type;
        p.Type = 'Person';
      }
      return p;
    });
    var totalRecordCount = people.length;
    if (query) {
      people = people.slice(query.StartIndex || 0);
      if (query.Limit && people.length > query.Limit) {
        people.length = query.Limit;
      }
    }
    return Promise.resolve({
      Items: people,
      TotalRecordCount: totalRecordCount
    });
  }
  function getListOptions(items) {
    var cardClass = 'videoOsd-itemstab-card videoOsd-itemstab-card-twoline';
    var cardLayout = false;
    return {
      renderer: _cardbuilder.default,
      options: {
        shape: 'portrait',
        cardLayout: cardLayout,
        centerText: !cardLayout,
        sideFooter: cardLayout,
        fields: ['Name', 'PersonRole'],
        cardFooterAside: false,
        showPersonRoleOrType: true,
        multiSelect: false,
        coverImage: true,
        draggable: false,
        contextMenu: false,
        playedButton: false,
        ratingButton: false,
        cardClass: cardClass,
        action: _appsettings.default.enableVideoUnderUI() ? null : 'custom',
        enableUserData: false,
        allowBottomPadding: false,
        textLinks: false,
        imageClass: cardLayout ? 'videoOsd-cardImageContainer-sideFooter' : null,
        enableFocusScaling: false,
        playQueueIndicator: false
      },
      virtualScrollLayout: 'horizontal-grid'
    };
  }
  function onCardAction(e) {
    var item = e.detail.item;
    var apiClient = _connectionmanager.default.getApiClient(item);
    apiClient.getItem(apiClient.getCurrentUserId(), item.Id).then(function (item) {
      return showAlert({
        preFormattedText: item.Overview || '',
        confirmButton: false,
        title: _itemmanager.default.getDisplayName(item),
        centerText: false,
        confirmText: _globalize.default.translate('Close'),
        item: item
      });
    });
  }
  function PeopleTab(view) {
    _basetab.default.apply(this, arguments);
  }
  Object.assign(PeopleTab.prototype, _basetab.default.prototype);
  PeopleTab.prototype.loadTemplate = function () {
    var view = this.view;
    view.innerHTML = "\n                    <div is=\"emby-scroller\" data-mousewheel=\"false\" data-focusscroll=\"true\" class=\"padded-top-focusscale padded-bottom-focusscale\">\n                        <div is=\"emby-itemscontainer\" data-focusabletype=\"nearest\" class=\"focusable focuscontainer-x scrollSlider itemsContainer videoosd-padded-left videoosd-padded-right\" data-virtualscrolllayout=\"horizontal-grid\"></div>\n                    </div>\n";
    this.itemsContainer = view.querySelector('.itemsContainer');
    this.itemsContainer.fetchData = fetchItems.bind(this);
    this.itemsContainer.getListOptions = getListOptions.bind(this);
    this.itemsContainer.addEventListener('action-null', onCardAction.bind(this));
    return Promise.resolve();
  };
  PeopleTab.prototype.onResume = function (options) {
    var instance = this;
    return _basetab.default.prototype.onResume.apply(this, arguments).then(function () {
      var optionsWithoutRefresh = Object.assign(Object.assign({}, options), {
        refresh: false
      });
      return instance.itemsContainer.resume(optionsWithoutRefresh).then(function () {
        if (options.refresh) {
          instance.refreshItem(options);
        }
      });
    });
  };
  PeopleTab.prototype.refreshItem = function (options) {
    _basetab.default.prototype.refreshItem.apply(this, arguments);
    this.itemsContainer.refreshItems(options);
  };
  PeopleTab.prototype.onPause = function () {
    _basetab.default.prototype.onPause.apply(this, arguments);
    this.itemsContainer.pause();
  };
  PeopleTab.prototype.destroy = function () {
    _basetab.default.prototype.destroy.apply(this, arguments);
    this.itemsContainer = null;
  };
  var _default = _exports.default = PeopleTab;
});
