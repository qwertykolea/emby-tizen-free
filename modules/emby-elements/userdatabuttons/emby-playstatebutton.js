define(["exports", "./../../shortcuts.js", "./../../emby-apiclient/connectionmanager.js", "./../../emby-apiclient/events.js", "./../../common/globalize.js", "./../../common/input/api.js", "./../emby-button/emby-button.js"], function (_exports, _shortcuts, _connectionmanager, _events, _globalize, _api, _embyButton) {
  Object.defineProperty(_exports, "__esModule", {
    value: true
  });
  _exports.default = void 0;
  /* jshint module: true */

  function addNotificationEvent(instance, name, handler) {
    var localHandler = handler.bind(instance);
    _events.default.on(_api.default, name, localHandler);
    instance[name] = localHandler;
  }
  function removeNotificationEvent(instance, name) {
    var handler = instance[name];
    if (handler) {
      _events.default.off(_api.default, name, handler);
      instance[name] = null;
    }
  }
  function onClick(e) {
    e.preventDefault();
    var button = this;
    var itemInfo = getItemInfo(button);
    var apiClient = _connectionmanager.default.getApiClient(itemInfo);
    if (button.getAttribute('data-played') !== 'true') {
      apiClient.markPlayed(apiClient.getCurrentUserId(), [itemInfo.Id]);
      setState(button, true);
    } else {
      apiClient.markUnplayed(apiClient.getCurrentUserId(), [itemInfo.Id]);
      setState(button, false);
    }
  }
  function onUserDataChanged(e, apiClient, userData) {
    var button = this;
    if (userData.ItemId === button.getAttribute('data-id')) {
      setState(button, userData.Played);
    }
  }
  function setState(button, played, updateAttribute) {
    setTitle(button, played);
    var icon = button.querySelector('i') || button;
    if (played) {
      if (icon) {
        icon.classList.add('playstatebutton-icon', 'playstatebutton-icon-played');
      }
    } else {
      if (icon) {
        icon.classList.add('playstatebutton-icon');
        icon.classList.remove('playstatebutton-icon-played');
      }
    }
    if (updateAttribute !== false) {
      button.setAttribute('data-played', played);
    }
  }
  function setTitle(button, played) {
    var title = played ? _globalize.default.translate('HeaderMarkUnplayed') : _globalize.default.translate('HeaderMarkPlayed');
    button.title = title;
    button.setAttribute('aria-label', title);
    var text = button.querySelector('.button-text');
    if (text) {
      text.innerHTML = _globalize.default.translate('Played');
    }
  }
  function clearEvents(button) {
    button.removeEventListener('click', onClick);
    removeNotificationEvent(button, 'UserDataChanged');
  }
  function bindEvents(button) {
    button.addEventListener('click', onClick);
    if (button.hasAttribute('data-owned')) {
      return;
    }
    addNotificationEvent(button, 'UserDataChanged', onUserDataChanged);
  }
  function getItemInfo(button) {
    if (button.hasAttribute('data-owned')) {
      return _shortcuts.default.getItemFromChildNode(button, true);
    }
    var id = button.getAttribute('data-id');
    var serverId = button.getAttribute('data-serverid');
    return {
      Id: id,
      ServerId: serverId
    };
  }
  var EmbyPlaystateButton = /*#__PURE__*/function (_EmbyButton) {
    function EmbyPlaystateButton() {
      var _this;
      // address the upgraded instance and use it
      var self = _this = _EmbyButton.call(this) || this;
      return babelHelpers.possibleConstructorReturn(_this, self);
    }
    babelHelpers.inherits(EmbyPlaystateButton, _EmbyButton);
    return babelHelpers.createClass(EmbyPlaystateButton, [{
      key: "connectedCallback",
      value: function connectedCallback() {
        _embyButton.default.prototype.connectedCallback.call(this);
        bindEvents(this);
      }
    }, {
      key: "disconnectedCallback",
      value: function disconnectedCallback() {
        _embyButton.default.prototype.disconnectedCallback.call(this);
        clearEvents(this);
      }
    }, {
      key: "setItem",
      value: function setItem(item) {
        if (item) {
          this.setAttribute('data-id', item.Id);
          this.setAttribute('data-serverid', item.ServerId);
          var played = item.UserData && item.UserData.Played;
          setState(this, played);
        } else {
          this.removeAttribute('data-id');
          this.removeAttribute('data-serverid');
          this.removeAttribute('data-played');
        }
      }
    }]);
  }(_embyButton.default);
  EmbyPlaystateButton.getHtml = function (played, buttonClass, iconClass, buttonType) {
    if (!iconClass) {
      iconClass = 'playstatebutton-icon';
    } else {
      iconClass += ' playstatebutton-icon';
    }
    if (played) {
      iconClass += ' playstatebutton-icon-played';
    }
    if (!buttonType) {
      buttonType = 'paper-icon-button-light';
    }
    if (buttonClass) {
      buttonClass += ' md-icon ' + buttonType;
    } else {
      buttonClass = 'md-icon ' + buttonType;
    }
    if (iconClass) {
      buttonClass += ' ' + iconClass;
    }
    var title = played ? _globalize.default.translate('HeaderMarkUnplayed') : _globalize.default.translate('HeaderMarkPlayed');
    return '<button title="' + title + '" aria-label="' + title + '" tabindex="-1" is="emby-playstatebutton" data-owned="true" type="button" data-action="none" class="' + buttonClass + '" data-played="' + played + '">&#xe86c;</button>';
  };
  customElements.define('emby-playstatebutton', EmbyPlaystateButton, {
    extends: 'button'
  });
  var _default = _exports.default = EmbyPlaystateButton;
});
