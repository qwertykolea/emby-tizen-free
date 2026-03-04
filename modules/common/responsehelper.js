define(["exports", "./../loading/loading.js", "./globalize.js"], function (_exports, _loading, _globalize) {
  Object.defineProperty(_exports, "__esModule", {
    value: true
  });
  _exports.default = void 0;
  /* jshint module: true */

  function ResponseHelper() {}
  function showAlert(options) {
    return Emby.importModule('./modules/common/dialogs/alert.js').then(function (alert) {
      return alert(options);
    });
  }
  function showAlertAndReject(options, response) {
    var onDone = function () {
      return Promise.reject(response);
    };
    return showAlert(options).then(onDone, onDone);
  }
  function showToast(options) {
    return Emby.importModule('./modules/toast/toast.js').then(function (toast) {
      toast(options);
    });
  }
  ResponseHelper.prototype.handleConfigurationSavedResponse = function (response) {
    _loading.default.hide();
    showToast(_globalize.default.translate('SettingsSaved'));
    return Promise.resolve(response);
  };
  function getErrorObject(response, msg, errorTitle, options) {
    if (!errorTitle) {
      if ((options == null ? void 0 : options.enableDefaultTitle) !== false) {
        errorTitle = _globalize.default.translate('Error');
      }
    }

    // internal error within UI
    if (typeof response === 'string') {
      msg.push(response);
    }
    return {
      title: errorTitle,
      text: msg.join('\n\n') || _globalize.default.translate('DefaultErrorMessage'),
      html: msg.join('<br/><br/>') || _globalize.default.translate('DefaultErrorMessage'),
      response: response,
      centerText: msg.length < 2
    };
  }
  function getErrorInfo(response, options) {
    var _response$headers;
    var errorCode = response.errorCode || response;
    var errorTitle = response.errorTitle;
    switch (errorCode) {
      case 'noitems':
        return Promise.resolve({
          text: _globalize.default.translate('NoSelectedItemsSupportOperation'),
          response: response
        });
      case 'nocommands':
        return Promise.resolve({
          text: _globalize.default.translate('NoOperationsForSelectedItems'),
          response: response
        });
      case 'RateLimitExceeded':
        return Promise.resolve({
          title: errorTitle || _globalize.default.translate('HeaderPlaybackError'),
          text: _globalize.default.translate('RateLimitExceeded'),
          response: response
        });
      case 'NoPlayableItems':
        return Promise.resolve({
          title: errorTitle || _globalize.default.translate('HeaderPlaybackError'),
          text: _globalize.default.translate('PlaybackError' + errorCode),
          response: response
        });
      case 'NoCompatibleStream':
        return Promise.resolve({
          title: errorTitle || _globalize.default.translate('HeaderPlaybackError'),
          text: _globalize.default.translate('PlaybackError' + errorCode),
          response: response
        });
      case 'PlaceHolder':
        return Promise.resolve({
          title: errorTitle || _globalize.default.translate('HeaderPlaybackError'),
          text: _globalize.default.translate('PlaybackError' + errorCode),
          response: response
        });
      default:
        break;
    }
    if (!errorTitle) {
      var status = response.status;
      switch (status) {
        case 401:
          errorTitle = _globalize.default.translate('HeaderSignInError');
          break;
        default:
          break;
      }
    }
    var msg = [];
    if (response.json && ((_response$headers = response.headers) == null ? void 0 : _response$headers.get('Content-Type')) === 'application/json') {
      return response.json().then(function (responseInfo) {
        if (responseInfo.Message) {
          msg.push(responseInfo.Message);
        }
        if (responseInfo.Title) {
          errorTitle = responseInfo.Title;
        }
        return getErrorObject(response, msg, errorTitle, options);
      });
    } else if (response.text) {
      return response.text().then(function (responseText) {
        if (responseText) {
          msg.push(responseText);
        }
        return getErrorObject(response, msg, errorTitle, options);
      });
    } else {
      return Promise.resolve(getErrorObject(response, msg, errorTitle, options));
    }
  }
  ResponseHelper.prototype.getErrorInfo = getErrorInfo;
  ResponseHelper.prototype.handleErrorResponse = function (response) {
    _loading.default.hide();
    console.error(response || 'Error', new Error());
    return getErrorInfo(response).then(function (errorInfo) {
      return showAlertAndReject(errorInfo);
    });
  };
  var _default = _exports.default = new ResponseHelper();
});
