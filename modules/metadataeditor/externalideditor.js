define(["exports", "./../common/globalize.js", "./../emby-elements/emby-input/emby-input.js", "./../emby-elements/emby-select/emby-select.js", "./../emby-elements/emby-button/emby-button.js", "./../emby-elements/emby-button/paper-icon-button-light.js", "./../emby-elements/emby-scroller/emby-scroller.js", "./../emby-elements/emby-dialogclosebutton/emby-dialogclosebutton.js"], function (_exports, _globalize, _embyInput, _embySelect, _embyButton, _paperIconButtonLight, _embyScroller, _embyDialogclosebutton) {
  Object.defineProperty(_exports, "__esModule", {
    value: true
  });
  _exports.default = void 0;
  /* jshint module: true */

  require(['formDialogStyle']);
  function findKey(keys, key) {
    var keyLower = key.toLowerCase();
    return keys.filter(function (k) {
      return k.toLowerCase() === keyLower;
    })[0] || key;
  }
  function embed(context, item, externalIds) {
    var html = '';
    var providerIds = item.ProviderIds || {};
    var keys = Object.keys(providerIds);
    for (var i = 0, length = externalIds.length; i < length; i++) {
      var idInfo = externalIds[i];
      var id = "txt1" + idInfo.Key;
      var formatString = idInfo.UrlFormatString || '';
      var labelText = _globalize.default.translate('LabelDynamicExternalId').replace('{0}', idInfo.Name);
      html += '<div class="inputContainer">';
      html += '<div class="flex align-items-center">';
      var value = providerIds[findKey(keys, idInfo.Key)] || '';
      html += '<div class="flex-grow">';
      html += '<input is="emby-input" class="txtExternalId ' + id + '" value="' + value + '" data-providerkey="' + idInfo.Key + '" data-formatstring="' + formatString + '" label="' + labelText + '"/>';
      html += '</div>';
      if (formatString) {
        html += '<button type="button" is="paper-icon-button-light" class="btnOpenExternalId align-self-flex-end md-icon" data-fieldid="' + id + '">open_in_browser</button>';
      }
      html += '</div>';
      html += '</div>';
    }
    var elem = context.querySelector('.externalIds', context);
    elem.innerHTML = html;
    if (externalIds.length) {
      context.classList.remove('hide');
    } else {
      context.classList.add('hide');
    }
  }
  function updateObjectFromElements(context, item) {
    var idElements = context.querySelectorAll('.txtExternalId');
    Array.prototype.map.call(idElements, function (idElem) {
      var providerKey = idElem.getAttribute('data-providerkey');
      item.ProviderIds[providerKey] = idElem.value;
    });
  }
  var _default = _exports.default = {
    embed: embed,
    updateObjectFromElements: updateObjectFromElements
  };
});
