define(["exports", "./../modules/viewmanager/baseview.js", "./../modules/loading/loading.js", "./../modules/emby-elements/emby-input/emby-input.js", "./../modules/emby-elements/emby-button/emby-button.js", "./../modules/emby-elements/emby-scroller/emby-scroller.js", "./../modules/emby-apiclient/connectionmanager.js", "./../modules/approuter.js"], function (_exports, _baseview, _loading, _embyInput, _embyButton, _embyScroller, _connectionmanager, _approuter) {
  Object.defineProperty(_exports, "__esModule", {
    value: true
  });
  _exports.default = void 0;
  /* jshint module: true */

  require(['material-icons']);
  function trimEnd(string, charToRemove) {
    while (string.charAt(string.length - 1) === charToRemove) {
      string = string.substring(0, string.length - 1);
    }
    return string;
  }
  function onPortChange(e) {
    var currentPort = (this.value || '').trim();
    if (currentPort !== '443' && currentPort !== '8920') {
      return;
    }
    var form = this.closest('form');
    var txtServerHost = form.querySelector('.txtServerHost');
    txtServerHost.value = txtServerHost.value.replace(new RegExp('http:', 'gi'), 'https:');
  }
  function onHostChange(e) {
    var currentHost = (this.value || '').trim().toLowerCase();
    var form = this.closest('form');
    var txtServerPort = form.querySelector('.txtServerPort');
    var currentPort = txtServerPort.value.trim();
    if (currentHost.startsWith('http:') && ['8920', '443'].includes(currentPort)) {
      txtServerPort.value = '8096';
    } else if (currentHost.startsWith('https:') && ['8096'].includes(currentPort)) {
      txtServerPort.value = '8920';
    }
  }
  function addPortToUrl(address, port) {
    if (!port) {
      return address;
    }
    address = trimEnd(address, '/');
    try {
      var url = new URL(address);
      if (url.port) {
        return address;
      }
      url.port = port;
      var urlString = url.toString();
      // check the output because old tizen environments return an object (probably LG too), and we're currently not polyfilling this
      if (typeof urlString === 'string' && urlString && !urlString.toLowerCase().includes('object url')) {
        return trimEnd(urlString, '/');
      }
    } catch (err) {
      console.warn('error parsing url: ', err);
    }
    address += ':' + port;
    return address;
  }
  function View(view, params) {
    _baseview.default.apply(this, arguments);
    view.querySelector('form').addEventListener('submit', function (e) {
      e.preventDefault();
      var address = this.querySelector('.txtServerHost').value;
      var port = this.querySelector('.txtServerPort').value;
      address = addPortToUrl(address, port);
      _loading.default.show();
      _connectionmanager.default.connectToAddress(address, {}).then(function (result) {
        _loading.default.hide();
        _approuter.default.handleConnectionResult(result);
      });
      return false;
    });
    view.querySelector('.txtServerPort').addEventListener('change', onPortChange);
    view.querySelector('.txtServerHost').addEventListener('change', onHostChange);
    view.querySelector('.buttonCancel').addEventListener('click', function (e) {
      _approuter.default.back();
    });
  }
  Object.assign(View.prototype, _baseview.default.prototype);
  View.prototype.onResume = function (options) {
    _baseview.default.prototype.onResume.apply(this, arguments);
    var view = this.view;
    view.querySelector('.txtServerHost').value = '';
    view.querySelector('.txtServerPort').value = '8096';
  };
  var _default = _exports.default = View;
});
