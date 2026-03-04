define(["exports", "./../list/list.js", "./../modules/common/globalize.js", "./../modules/emby-elements/emby-input/emby-input.js", "./../modules/emby-elements/emby-button/emby-button.js", "./../modules/emby-elements/emby-scroller/emby-scroller.js", "./../modules/emby-apiclient/connectionmanager.js", "./../modules/approuter.js", "./../modules/common/servicelocator.js", "./../modules/common/appsettings.js", "./../modules/common/textencoding.js"], function (_exports, _list, _globalize, _embyInput, _embyButton, _embyScroller, _connectionmanager, _approuter, _servicelocator, _appsettings, _textencoding) {
  Object.defineProperty(_exports, "__esModule", {
    value: true
  });
  _exports.default = void 0;
  /* jshint module: true */

  require(['material-icons']);
  function setItemProperies(server) {}
  function addHeader(instance) {
    var view = instance.view;
    var apiClient = instance.getApiClient();
    var serverName = apiClient.serverName() || '';
    if (_servicelocator.appHost.supports('maskembynameonlogin')) {
      // https://emby.media/community/index.php?/topic/96439-my-emby-server-has-been-flagged-as-a-deceptive-site/page/8/#comment-1365081
      serverName = serverName.replace(/(emby)/ig, 'Media Server').replace(/(Media Server Media Server)/ig, 'Media Server').replace(/(Media Server MediaServer)/ig, 'MediaServer');
    }
    var title = serverName ? _globalize.default.translate('SignIntoServerName', _textencoding.default.htmlEncode(serverName)) : _globalize.default.translate('HeaderPleaseSignIn');
    var scrollSlider = view.querySelector('.scrollSlider');
    scrollSlider.insertAdjacentHTML('afterbegin', '<h1 style="text-align:center;margin: 0 0 .5em;">' + title + '</h1>');
  }
  function setDisclaimer(view, apiClient) {
    if (_servicelocator.appHost.supports('multiserver')) {
      return;
    }
    apiClient.getJSON(apiClient.getUrl('Branding/Configuration')).then(function (options) {
      if (!options.LoginDisclaimer) {
        return;
      }
      var elem = document.createElement('div');
      elem.classList.add('disclaimer');
      elem.textContent = options.LoginDisclaimer || '';
      elem.style.textAlign = 'center';
      elem.classList.add('padded-bottom', 'padded-bottom-page', 'padded-top');
      var scrollSlider = view.querySelector('.scrollSlider');
      scrollSlider.insertAdjacentHTML('afterbegin', '<h1 style="text-align:center;margin-top:0;">' + _globalize.default.translate('HeaderPleaseSignIn') + '</h1>');
      scrollSlider.appendChild(elem);
      view.querySelector('.itemsContainer').classList.remove('padded-bottom-page');
    });
  }
  function addItems(items, serverId) {
    items.push({
      Name: _globalize.default.translate('HeaderManualLogin'),
      Type: 'ManualLogin',
      ServerId: serverId
    });
    items.push({
      Name: _globalize.default.translate('HeaderForgotPassword'),
      Type: 'ForgotPassword',
      ServerId: serverId
    });
    if (_servicelocator.appHost.supports('multiserver')) {
      items.push({
        Name: _globalize.default.translate('HeaderChangeServer'),
        Type: 'SelectServer'
      });

      //items.push({
      //    Name: globalize.translate('HeaderSignInWithConnect'),
      //    Type: 'EmbyConnect'
      //});
    }
  }
  function showUserSignIn(apiClient, user) {
    if (user.HasPassword) {
      _approuter.default.showServerLogin({
        apiClient: apiClient,
        username: user.Name,
        loginType: 'manual'
      });
    } else {
      _approuter.default.authenticateUser({
        serverId: user.ServerId,
        username: user.Name
      });
    }
  }
  function onCardAction(e) {
    var item = e.detail.item;
    if (item.Type !== 'User') {
      _approuter.default.showItem(item);
      return;
    }
    var apiClient = _connectionmanager.default.getApiClient(item);

    // see if we already have saved authentication for this user
    if (_connectionmanager.default.isLoggedIn(item.ServerId, item.Id) && (_appsettings.default.autoLogin() !== 'none' || _appsettings.default.enableProfilePin(item.Id))) {
      return _approuter.default.changeToUser({
        apiClient: apiClient,
        userId: item.Id
      }).catch(function (err) {
        var errorName = ((err == null ? void 0 : err.name) || '').toLowerCase();
        switch (errorName) {
          case 'aborterror':
            break;
          default:
            showUserSignIn(apiClient, item);
            break;
        }
      });
    }
    showUserSignIn(apiClient, item);
  }
  function LoginPage(view, params) {
    this.enableAlphaNumericShortcuts = false;
    this.enableTotalRecordCountDisplay = false;
    this.supportsViewSettings = false;
    _list.default.call(this, view, params);
    view.querySelector('.itemsContainer').addEventListener('action-null', onCardAction.bind(this));
    addHeader(this);
    setDisclaimer(view, _connectionmanager.default.getApiClient(params.serverId));
  }
  Object.assign(LoginPage.prototype, _list.default.prototype);
  LoginPage.prototype.getSortMenuOptions = function () {
    return [];
  };
  LoginPage.prototype.getItemTypes = function () {
    return ['User'];
  };
  LoginPage.prototype.getItems = function (query) {
    var serverId = this.params.serverId;
    var apiClient = _connectionmanager.default.getApiClient(serverId);
    var specialItems = [];
    addItems(specialItems, serverId);
    var numSpecialItems = specialItems.length;
    return apiClient.getPublicUsersQueryResult(query).then(function (result) {
      result.Items.forEach(setItemProperies);
      if (result.Items.length < query.Limit) {
        addItems(result.Items, serverId);
      }
      if (query.EnableTotalRecordCount !== false) {
        result.TotalRecordCount += numSpecialItems;
      }
      return result;
    });
  };
  LoginPage.prototype.setTitle = function () {

    // handled by appheader
  };
  LoginPage.prototype.getBaseListRendererOptions = function () {
    var options = _list.default.prototype.getBaseListRendererOptions.apply(this, arguments);
    options.draggable = false;
    options.draggableXActions = false;
    options.multiSelect = false;
    options.contextMenu = false;
    options.playQueueIndicator = false;
    options.action = 'custom';
    return options;
  };
  LoginPage.prototype.getCardOptions = function (items, settings) {
    var options = _list.default.prototype.getCardOptions.apply(this, arguments);
    options.defaultBackground = true;
    options.fields = ['Name'];
    return options;
  };
  var _default = _exports.default = LoginPage;
});
