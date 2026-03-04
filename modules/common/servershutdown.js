define(["exports", "./dialogs/confirm.js", "./globalize.js"], function (_exports, _confirm, _globalize) {
  Object.defineProperty(_exports, "__esModule", {
    value: true
  });
  _exports.default = void 0;
  /* jshint module: true */

  function formatTextWithDisruptions(text, disruptions) {
    if (!disruptions.length) {
      return text;
    }
    text += '\n\n';
    text += _globalize.default.translate('FollowingActivityWillBeDisrupted');
    text += '\n\n';
    text += disruptions.map(function (i) {
      return '- ' + i;
    }).join('\n');
    return text;
  }
  function formatHtmlWithDisruptions(text, disruptions) {
    if (!disruptions.length) {
      return null;
    }
    text += '<p>';
    text += _globalize.default.translate('FollowingActivityWillBeDisrupted');
    text += '</p>';
    text += '<ul>';
    text += disruptions.map(function (i) {
      return '<li>' + i + '</li>';
    }).join('');
    text += '</ul>';
    return text;
  }
  function confirmShutDown(disruptions) {
    return (0, _confirm.default)({
      title: _globalize.default.translate('Shutdown'),
      text: formatTextWithDisruptions(_globalize.default.translate('MessageConfirmShutdown'), disruptions),
      html: formatHtmlWithDisruptions(_globalize.default.translate('MessageConfirmShutdown'), disruptions),
      confirmText: _globalize.default.translate('Shutdown'),
      primary: 'cancel',
      centerText: disruptions.length === 0
    });
  }
  function confirmRestart(disruptions) {
    return (0, _confirm.default)({
      title: _globalize.default.translate('Restart'),
      text: formatTextWithDisruptions(_globalize.default.translate('MessageConfirmRestart'), disruptions),
      html: formatHtmlWithDisruptions(_globalize.default.translate('MessageConfirmRestart'), disruptions),
      confirmText: _globalize.default.translate('Restart'),
      primary: 'cancel',
      centerText: disruptions.length === 0
    });
  }
  function getDisruptions(options) {
    var apiClient = options.apiClient;
    var promises = [apiClient.getSessions({
      IsPlaying: true
    }), apiClient.getLiveTvRecordings({
      IsInProgress: true
    })];
    return Promise.all(promises).then(function (responses) {
      var sessions = responses[0];
      var recordings = responses[1].Items;
      var list = [];
      if (sessions.length === 1) {
        list.push(_globalize.default.translate('OneActivePlaybackSession'));
      } else if (sessions.length) {
        list.push(_globalize.default.translate('NumActivePlaybackSessions', sessions.length));
      }
      if (recordings.length === 1) {
        list.push(_globalize.default.translate('OneActiveRecording'));
      } else if (recordings.length) {
        list.push(_globalize.default.translate('NumActiveRecordings', recordings.length));
      }
      return list;
    });
  }
  function confirmRestartOrShutdown(options) {
    return getDisruptions(options).then(function (disruptions) {
      if (options.type === 'shutdown') {
        return confirmShutDown(disruptions);
      }
      return confirmRestart(disruptions);
    });
  }
  var _default = _exports.default = {
    confirmRestartOrShutdown: confirmRestartOrShutdown
  };
});
