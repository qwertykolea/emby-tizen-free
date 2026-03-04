define(["exports", "./../common/globalize.js", "./../loading/loading.js", "./../common/dialogs/alert.js", "./../common/servicelocator.js", "./../common/responsehelper.js"], function (_exports, _globalize, _loading, _alert, _servicelocator, _responsehelper) {
  Object.defineProperty(_exports, "__esModule", {
    value: true
  });
  _exports.default = void 0;
  /* jshint module: true */

  function resolvePromise() {
    return Promise.resolve();
  }
  function rejectPromise() {
    return Promise.reject();
  }
  function showConnectServerUnreachableErrorMessage() {
    var text = _globalize.default.translate('ErrorConnectServerUnreachable', 'https://connect.emby.media');
    return (0, _alert.default)({
      text: text
    });
  }
  function showLinkUserErrorMessage(response, username, statusCode) {
    if (statusCode === 502) {
      return showConnectServerUnreachableErrorMessage();
    }
    if (statusCode === 409) {
      return (0, _alert.default)({
        text: _globalize.default.translate('EmbyConnectUserAlreadyLinked')
      });
    }
    if (username) {
      var html;
      var text;
      if (_servicelocator.appHost.supports('externallinks')) {
        html = _globalize.default.translate('ErrorAddingEmbyConnectAccount1', '<a is="emby-linkbutton" class="button-link" href="https://emby.media/connect" target="_blank">https://emby.media/connect</a>');
        html += '<br/><br/>' + _globalize.default.translate('ErrorAddingEmbyConnectAccount2', 'support@emby.media');
      }
      text = _globalize.default.translate('ErrorAddingEmbyConnectAccount1', 'https://emby.media/connect');
      text += '\n\n' + _globalize.default.translate('ErrorAddingEmbyConnectAccount2', 'support@emby.media');
      return (0, _alert.default)({
        text: text,
        html: html
      });
    }
    return _responsehelper.default.handleErrorResponse(response);
  }
  function updateUserLink(apiClient, user, newConnectUsername) {
    var currentConnectUsername = user.ConnectUserName || '';
    var enteredConnectUsername = newConnectUsername;
    if (currentConnectUsername && !enteredConnectUsername) {
      // Remove connect info
      // Add/Update connect info
      return apiClient.removeEmbyConnectLink(user.Id).then(function () {
        _loading.default.hide();
        return (0, _alert.default)({
          text: _globalize.default.translate('MessageEmbyAccontRemoved'),
          title: _globalize.default.translate('HeaderEmbyAccountRemoved')
        }).catch(resolvePromise);
      }, function (response) {
        _loading.default.hide();
        var statusCode = response ? response.status : 0;
        if (statusCode === 502) {
          return showConnectServerUnreachableErrorMessage().then(rejectPromise);
        }
        return (0, _alert.default)({
          text: _globalize.default.translate('ErrorRemovingEmbyConnectAccount')
        }).then(rejectPromise);
      });
    } else if (currentConnectUsername !== enteredConnectUsername) {
      var linkUrl = apiClient.getUrl('Users/' + user.Id + '/Connect/Link');

      // Add/Update connect info
      return apiClient.ajax({
        type: "POST",
        url: linkUrl,
        data: {
          ConnectUsername: enteredConnectUsername
        },
        dataType: 'json'
      }).then(function (result) {
        var msgKey = result.IsPending ? 'MessagePendingEmbyAccountAdded' : 'MessageEmbyAccountAdded';
        _loading.default.hide();
        return (0, _alert.default)({
          text: _globalize.default.translate(msgKey),
          title: _globalize.default.translate('HeaderEmbyAccountAdded')
        }).catch(resolvePromise);
      }, function (response) {
        _loading.default.hide();
        return showLinkUserErrorMessage(response, '.', response == null ? void 0 : response.status).then(rejectPromise);
      });
    } else {
      return Promise.reject();
    }
  }
  var _default = _exports.default = {
    updateUserLink: updateUserLink
  };
});
