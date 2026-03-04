define(["exports", "./../../shortcuts.js", "./../../emby-apiclient/connectionmanager.js", "./../../emby-apiclient/events.js", "./../../common/globalize.js", "./../../common/input/api.js", "./../emby-button/emby-button.js"], function (_exports, _shortcuts, _connectionmanager, _events, _globalize, _api, _embyButton) {
  Object.defineProperty(_exports, "__esModule", {
    value: true
  });
  _exports.default = void 0;
  /* jshint module: true */

  function showToast(options) {
    return Emby.importModule('./modules/toast/toast.js').then(function (toast) {
      return toast(options);
    });
  }
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
  function showPicker(button, apiClient, itemId, isFavorite) {
    var newValue = !isFavorite;
    return apiClient.updateFavoriteStatus(apiClient.getCurrentUserId(), [itemId], newValue).then(function () {
      if (newValue) {
        showToast({
          text: _globalize.default.translate('Favorited'),
          icon: '&#xe87D;'
        });
      } else {
        showToast({
          text: _globalize.default.translate('Unfavorited'),
          icon: '&#xe87D;',
          iconStrikeThrough: true
        });
      }
    });
  }
  function onClick(e) {
    e.preventDefault();
    var button = this;
    var itemInfo = getItemInfo(button);
    var id = itemInfo.Id;
    var serverId = itemInfo.ServerId;
    if (!id || !serverId) {
      return;
    }
    var apiClient = _connectionmanager.default.getApiClient(serverId);
    var isFavorite = this.getAttribute('data-isfavorite') === 'true';
    showPicker(button, apiClient, id, isFavorite);
  }
  function onUserDataChanged(e, apiClient, userData) {
    var button = this;
    if (userData.ItemId === button.getAttribute('data-id')) {
      setState(button, userData.IsFavorite);
    }
  }
  function setState(button, isFavorite, updateAttribute) {
    setTitle(button, isFavorite);
    var icon = button.querySelector('i') || button;
    if (isFavorite) {
      if (icon) {
        icon.innerHTML = '&#xe87D;';
        icon.classList.add('ratingbutton-icon-withrating', 'md-icon-fill');
      }
    } else {
      if (icon) {
        icon.innerHTML = '&#xe87D;';
        icon.classList.remove('ratingbutton-icon-withrating', 'md-icon-fill');
        //icon.innerHTML = '&#xe8DD;';
      }
    }
    if (updateAttribute !== false) {
      button.setAttribute('data-isfavorite', isFavorite);
    }
  }
  function setTitle(button, isFavorite) {
    var title = isFavorite ? _globalize.default.translate('HeaderRemoveFromFavorites') : _globalize.default.translate('HeaderAddToFavorites');
    button.title = title;
    button.setAttribute('aria-label', title);
    var text = button.querySelector('.button-text');
    if (text) {
      text.innerHTML = _globalize.default.translate('Favorite');
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
  var EmbyRatingButton = /*#__PURE__*/function (_EmbyButton) {
    function EmbyRatingButton() {
      var _this;
      // address the upgraded instance and use it
      var self = _this = _EmbyButton.call(this) || this;
      return babelHelpers.possibleConstructorReturn(_this, self);
    }
    babelHelpers.inherits(EmbyRatingButton, _EmbyButton);
    return babelHelpers.createClass(EmbyRatingButton, [{
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
          var userData = item.UserData || {};
          setState(this, userData.IsFavorite);
        } else {
          this.removeAttribute('data-id');
          this.removeAttribute('data-serverid');
          this.removeAttribute('data-isfavorite');
        }
      }
    }]);
  }(_embyButton.default);
  EmbyRatingButton.getHtml = function (isFavorite, buttonClass, iconClass, buttonType) {
    if (!iconClass) {
      iconClass = '';
    }
    if (isFavorite) {
      iconClass += ' ratingbutton-icon-withrating md-icon-fill';
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
    var title = isFavorite ? _globalize.default.translate('HeaderRemoveFromFavorites') : _globalize.default.translate('HeaderAddToFavorites');
    return '<button title="' + title + '" aria-label="' + title + '" tabindex="-1" is="emby-ratingbutton" data-owned="true" type="button" data-action="none" class="' + buttonClass + '" data-isfavorite="' + isFavorite + '">&#xe87D;</button>';
  };
  customElements.define('emby-ratingbutton', EmbyRatingButton, {
    extends: 'button'
  });
  var _default = _exports.default = EmbyRatingButton;
});
