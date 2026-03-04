define(["exports", "./../../common/globalize.js", "./../../emby-apiclient/connectionmanager.js", "./../emby-button/emby-button.js"], function (_exports, _globalize, _connectionmanager, _embyButton) {
  Object.defineProperty(_exports, "__esModule", {
    value: true
  });
  _exports.default = void 0;
  /* jshint module: true */

  function showConfirm(options) {
    return Emby.importModule('./modules/common/dialogs/confirm.js').then(function (confirm) {
      return confirm(options);
    });
  }
  function onClick(e) {
    var button = this;
    var id = button.getAttribute('data-id');
    var serverId = button.getAttribute('data-serverid');
    var type = button.getAttribute('data-itemtype');
    var apiClient = _connectionmanager.default.getApiClient(serverId);
    if (!button.classList.contains('downloadbutton-on')) {
      Emby.importModule('./modules/sync/sync.js').then(function (syncDialog) {
        syncDialog.showMenu({
          items: [{
            Id: id,
            Type: type,
            ServerId: serverId
          }],
          mode: 'download',
          serverId: serverId
        }).then(function () {
          button.dispatchEvent(new CustomEvent('download', {
            cancelable: false
          }));
        });
      });
    } else {
      showConfirm({
        text: _globalize.default.translate('ConfirmRemoveDownload'),
        confirmText: _globalize.default.translate('RemoveDownload'),
        cancelText: _globalize.default.translate('KeepDownload'),
        primary: 'cancel'
      }).then(function () {
        apiClient.cancelSyncItems([id]);
        button.dispatchEvent(new CustomEvent('download-cancel', {
          cancelable: false
        }));
      });
    }
  }
  function updateSyncStatus(button, status) {
    var icon = button.iconElement;
    if (!icon) {
      button.iconElement = button.querySelector('i');
      icon = button.iconElement;
    }
    if (status != null) {
      button.classList.add('downloadbutton-on');
      if (icon) {
        icon.classList.add('downloadbutton-icon-on');
      }
    } else {
      button.classList.remove('downloadbutton-on');
      if (icon) {
        icon.classList.remove('downloadbutton-icon-on');
      }
    }
    if (status === 'Synced') {
      button.classList.add('downloadbutton-complete');
      if (icon) {
        icon.classList.add('downloadbutton-icon-complete');
      }
    } else {
      button.classList.remove('downloadbutton-complete');
      if (icon) {
        icon.classList.remove('downloadbutton-icon-complete');
      }
    }
    var text;
    if (status === 'Synced') {
      text = _globalize.default.translate('Downloaded');
    } else if (status != null) {
      text = _globalize.default.translate('Downloading');
    } else {
      text = _globalize.default.translate('Download');
    }
    var textElement = button.querySelector('.button-text');
    if (textElement) {
      textElement.innerHTML = text;
    }
    button.title = text;
    button.setAttribute('aria-label', text);
  }
  function clearEvents(button) {
    button.removeEventListener('click', onClick);
  }
  function bindEvents(button) {
    clearEvents(button);
    button.addEventListener('click', onClick);
  }
  function _connectedCallback() {
    var itemId = this.getAttribute('data-id');
    var serverId = this.getAttribute('data-serverid');
    if (itemId && serverId) {
      bindEvents(this);
    }
  }
  function _disconnectedCallback() {
    clearEvents(this);
    this.iconElement = null;
  }
  function fetchAndUpdate(button, item) {
    _connectionmanager.default.getApiClient(item).getSyncStatus(item).then(function (result) {
      updateSyncStatus(button, result.Status);
    }, function () {});
  }
  function _setItem(item) {
    if (item) {
      this.setAttribute('data-id', item.Id);
      this.setAttribute('data-serverid', item.ServerId);
      this.setAttribute('data-itemtype', item.Type);
      fetchAndUpdate(this, item);
      bindEvents(this);
    } else {
      this.removeAttribute('data-id');
      this.removeAttribute('data-serverid');
      this.removeAttribute('data-itemtype');
      clearEvents(this);
    }
  }
  var EmbyDownloadButton = /*#__PURE__*/function (_EmbyButton) {
    function EmbyDownloadButton() {
      var _this;
      // address the upgraded instance and use it
      var self = _this = _EmbyButton.call(this) || this;
      return babelHelpers.possibleConstructorReturn(_this, self);
    }
    babelHelpers.inherits(EmbyDownloadButton, _EmbyButton);
    return babelHelpers.createClass(EmbyDownloadButton, [{
      key: "connectedCallback",
      value: function connectedCallback() {
        _embyButton.default.prototype.connectedCallback.call(this);
        _connectedCallback.call(this);
      }
    }, {
      key: "disconnectedCallback",
      value: function disconnectedCallback() {
        _embyButton.default.prototype.disconnectedCallback.call(this);
        _disconnectedCallback.call(this);
      }
    }, {
      key: "setItem",
      value: function setItem(item) {
        _setItem.call(this, item);
      }
    }]);
  }(_embyButton.default);
  EmbyDownloadButton.getHtml = function (item, buttonClass, iconClass, buttonType) {
    if (!iconClass) {
      iconClass = '';
    }
    if (!buttonType) {
      buttonType = 'paper-icon-button-light';
    }
    if (buttonClass) {
      buttonClass += ' md-icon ' + buttonType;
    } else {
      buttonClass = 'md-icon ' + buttonType;
    }
    var status = item.SyncStatus;
    if (status != null) {
      buttonClass += ' downloadbutton-on';
      iconClass += ' downloadbutton-icon-on';
    }
    if (status === 'Synced') {
      buttonClass += ' downloadbutton-complete';
      iconClass += ' downloadbutton-icon-complete';
    }
    if (iconClass) {
      buttonClass += ' ' + iconClass;
    }
    var text;
    if (status === 'Synced') {
      text = _globalize.default.translate('Downloaded');
    } else if (status != null) {
      text = _globalize.default.translate('Downloading');
    } else {
      text = _globalize.default.translate('Download');
    }
    return '<button data-id="' + item.Id + '" data-serverid="' + item.ServerId + '" data-itemtype="' + item.Type + '" title="' + text + '" aria-label="' + text + '" tabindex="-1" is="emby-downloadbutton" data-owned="true" type="button" data-action="none" class="' + buttonClass + '">&#xf090;</button>';
  };
  customElements.define('emby-downloadbutton', EmbyDownloadButton, {
    extends: 'button'
  });
  var _default = _exports.default = EmbyDownloadButton;
});
