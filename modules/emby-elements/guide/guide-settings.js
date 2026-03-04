define(["exports", "./../../common/globalize.js", "./../../layoutmanager.js", "./../../common/usersettings/usersettings.js", "./../../dialoghelper/dialoghelper.js", "./../emby-scroller/emby-scroller.js", "./../emby-toggle/emby-toggle.js", "./../emby-select/emby-select.js", "./../emby-dialogclosebutton/emby-dialogclosebutton.js"], function (_exports, _globalize, _layoutmanager, _usersettings, _dialoghelper, _embyScroller, _embyToggle, _embySelect, _embyDialogclosebutton) {
  Object.defineProperty(_exports, "__esModule", {
    value: true
  });
  _exports.default = void 0;
  /* jshint module: true */

  require(['formDialogStyle', 'material-icons']);
  function save(context) {
    var i, length;
    var chkIndicators = context.querySelectorAll('.chkIndicator');
    for (i = 0, length = chkIndicators.length; i < length; i++) {
      var type = chkIndicators[i].getAttribute('data-type');
      _usersettings.default.set('guide-indicator-' + type, chkIndicators[i].checked);
    }
    _usersettings.default.showChannelNumberInGuide(context.querySelector('.chkChannelNumber').checked);
    _usersettings.default.guideChannelStyle(context.querySelector('.selectChannelDisplay').value);
    _usersettings.default.set('guide-colorcodedbackgrounds', context.querySelector('.chkColorCodedBackgrounds').checked);
    _usersettings.default.set(_usersettings.default.getLiveTvChannelSortSettingsKey(), context.querySelector('.selectChannelSort').value);
    _usersettings.default.set('guide-tagids', context.querySelector('.selectTags').getValues().join(','));
  }
  function fillChannelSortOrder(context) {
    var items = _usersettings.default.getLiveTvChannelSortOrders(_globalize.default);
    var value;
    var html = '';
    for (var i = 0, length = items.length; i < length; i++) {
      var item = items[i];
      html += '<option value="' + item.value + '">' + item.name + '</option>';
      if (item.selected) {
        value = item.value;
      }
    }
    var select = context.querySelector('.selectChannelSort');
    select.innerHTML = html;
    select.value = value;
  }
  function load(context) {
    var i, length;
    var chkIndicators = context.querySelectorAll('.chkIndicator');
    for (i = 0, length = chkIndicators.length; i < length; i++) {
      var type = chkIndicators[i].getAttribute('data-type');
      if (chkIndicators[i].getAttribute('data-default') === 'true') {
        chkIndicators[i].checked = _usersettings.default.get('guide-indicator-' + type) !== 'false';
      } else {
        chkIndicators[i].checked = _usersettings.default.get('guide-indicator-' + type) === 'true';
      }
    }
    context.querySelector('.chkColorCodedBackgrounds').checked = _usersettings.default.get('guide-colorcodedbackgrounds') === 'true';
    context.querySelector('.chkChannelNumber').checked = _usersettings.default.showChannelNumberInGuide();
    context.querySelector('.selectChannelDisplay').value = _usersettings.default.guideChannelStyle();
    fillChannelSortOrder(context);
  }
  function getLiveTvChannelTags(query) {
    var apiClient = this;
    var outerItemIds = query.Ids;
    query.Ids = null;
    return apiClient.getLiveTvChannelTags(Object.assign({
      SortBy: 'SortName',
      SortOrder: 'Ascending',
      EnableImages: false,
      EnableUserData: false,
      OuterIds: outerItemIds
    }, query));
  }
  function setSelectedChannelTags(context) {
    var selectTags = context.querySelector('.selectTags');
    var channelTagIds = _usersettings.default.get('guide-tagids');
    channelTagIds = channelTagIds ? channelTagIds.split(',') : [];
    selectTags.values = channelTagIds;
  }
  function loadChannelTags(context, apiClient) {
    var selectTags = context.querySelector('.selectTags');
    selectTags.getItems = getLiveTvChannelTags.bind(apiClient);
    selectTags.parentContainer = context.querySelector('.fldTags');
    setSelectedChannelTags(context);
  }
  function showEditor(options, apiClient) {
    return new Promise(function (resolve, reject) {
      var settingsChanged = false;
      require(['text!modules/emby-elements/guide/guide-settings.template.html'], function (template) {
        var dialogOptions = {
          removeOnClose: true,
          scrollY: false,
          // allow a little space between the borders
          offsetTop: 2,
          positionTo: options.positionTo,
          positionX: options.positionX,
          positionY: options.positionY
        };
        if (_layoutmanager.default.tv) {
          dialogOptions.size = 'fullscreen';
        }
        var dlg = _dialoghelper.default.createDialog(dialogOptions);
        dlg.classList.add('formDialog');
        var html = '';
        html += _globalize.default.translateDocument(template, 'sharedcomponents');
        dlg.innerHTML = html;
        dlg.addEventListener('change', function () {
          settingsChanged = true;
        });
        dlg.addEventListener('close', function () {
          save(dlg);
          if (settingsChanged) {
            resolve();
          } else {
            reject();
          }
        });
        load(dlg);
        loadChannelTags(dlg, apiClient);
        _dialoghelper.default.open(dlg);
      });
    });
  }
  var _default = _exports.default = {
    show: showEditor
  };
});
