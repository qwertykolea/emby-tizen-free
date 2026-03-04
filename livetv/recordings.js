define(["exports", "./../modules/tabbedview/basetab.js", "./../modules/common/globalize.js", "./../modules/emby-elements/emby-itemscontainer/emby-itemscontainer.js", "./../modules/emby-elements/emby-button/emby-button.js", "./../modules/emby-elements/emby-scroller/emby-scroller.js", "./../modules/tabbedview/sectionscontroller.js"], function (_exports, _basetab, _globalize, _embyItemscontainer, _embyButton, _embyScroller, _sectionscontroller) {
  Object.defineProperty(_exports, "__esModule", {
    value: true
  });
  _exports.default = void 0;
  /* jshint module: true */

  function LiveTvSuggestionsTab(view, params) {
    _basetab.default.apply(this, arguments);
    _sectionscontroller.default.apply(this, arguments);
    this.view = view;
    this.params = params;
  }
  Object.assign(LiveTvSuggestionsTab.prototype, _basetab.default.prototype);
  Object.assign(LiveTvSuggestionsTab.prototype, _sectionscontroller.default.prototype);
  function onAddRecordingClick(e) {
    var instance = this;
    return Emby.importModule('./modules/recordingcreator/channelrecordingcreator.js').then(function (channelRecordingCreator) {
      return channelRecordingCreator.createRecordingForChannel(null, {
        serverId: instance.getApiClient().serverId(),
        positionTo: e.target.closest('button')
      });
    });
  }
  function getListOptions(options) {
    return Object.assign({
      preferThumb: 'auto',
      inheritThumb: false,
      shape: 'autooverflow',
      centerText: true,
      programsAsSeries: true
    }, options);
  }
  LiveTvSuggestionsTab.prototype.fetchSections = function () {
    var sections = [];
    var serverId = this.serverId();
    var refreshInterval = 300000;
    var enableFocusPreview = this.enableFocusPreview();
    var supportsGrouping = this.getApiClient().isMinServerVersion('4.9.1.32');
    sections.push({
      Id: 'Buttons',
      CollectionType: 'livetv',
      ViewType: 'content',
      Monitor: [],
      ContentButtons: [{
        Name: _globalize.default.translate('HeaderAddRecording'),
        Icon: 'add',
        OnClick: onAddRecordingClick.bind(this)
      }],
      CenterContentButtons: true
    });
    sections.push({
      Id: 'LatestRecordings',
      Name: _globalize.default.translate('HeaderLatestRecordings'),
      CollectionType: 'livetv',
      SectionType: 'recordings',
      Monitor: [],
      RefreshInterval: refreshInterval,
      ListOptions: getListOptions({
        fields: enableFocusPreview ? [] : ['Name', 'ParentName', 'ChannelName', 'AirTime'],
        preferThumb: 'auto',
        showAirEndTime: true
      }),
      QueryOptions: {
        GroupItems: false,
        SortBy: 'DateCreated',
        SortOrder: 'Descending'
      },
      CommandOptions: {}
      //    HeaderButtons: [
      //        {
      //            Name: globalize.translate('HeaderAddRecording'),
      //            Icon: 'add',
      //            OnClick: onAddRecordingClick.bind(this)
      //        }
      //    ]
    });
    if (supportsGrouping) {
      sections.push({
        Id: 'AllRecordings',
        Name: _globalize.default.translate('HeaderAllRecordings'),
        CollectionType: 'livetv',
        SectionType: 'recordings',
        Monitor: [],
        ListOptions: getListOptions({
          fields: enableFocusPreview ? [] : ['ParentName', 'Name', 'ProductionYear', 'ChannelName', 'AirTime']
        }),
        QueryOptions: {
          GroupItems: true,
          SortBy: 'DateLastContentAdded,SortName',
          SortOrder: 'Descending'
        },
        Href: 'list/list.html?type=Recordings&GroupItems=true' + '&serverId=' + serverId
      });
    }
    return Promise.resolve(sections);
  };
  function initElements(instance) {
    var view = instance.view;
    var btnCreateRecordings = view.querySelectorAll('.btnCreateRecording');
    var boundOnAddRecordingClick = onAddRecordingClick.bind(instance);
    for (var i = 0, length = btnCreateRecordings.length; i < length; i++) {
      btnCreateRecordings[i].addEventListener('click', boundOnAddRecordingClick);
    }
  }
  LiveTvSuggestionsTab.prototype.onTemplateLoaded1 = function () {
    var instance = this;
    _basetab.default.prototype.onTemplateLoaded.apply(this, arguments);
    var elem = instance.view.querySelector('.listTotalRecordCount');
    var html = '';
    html += '<button is="emby-button" class="itemsViewSettingsContainer-button btnCreateRecording raised raised-mini listTextButton-autohide hide">';
    html += '<i class="md-icon button-icon button-icon-left">&#xe145;</i>';
    html += '<span>' + _globalize.default.translate('HeaderAddRecording') + '</span>';
    html += '</button>';
    html += '<button title="' + _globalize.default.translate('HeaderAddRecording') + '" is="paper-icon-button-light" class="itemsViewSettingsContainer-button btnCreateRecording listIconButton-autohide hide">';
    html += '<i class="md-icon autortl">&#xe145;</i>';
    html += '</button>';
    elem.insertAdjacentHTML('afterend', html);
    initElements(instance);
    this.itemsContainer.setAttribute('data-monitor', 'RecordingStarted,RecordingEnded');
    this.getApiClient().getCurrentUser().then(function (user) {
      var btnCreateRecordings = elem.parentNode.querySelectorAll('.btnCreateRecording');
      for (var i = 0, length = btnCreateRecordings.length; i < length; i++) {
        if (user.Policy.EnableLiveTvManagement) {
          btnCreateRecordings[i].classList.remove('hide');
        } else {
          btnCreateRecordings[i].classList.add('hide');
        }
      }
    });
  };
  LiveTvSuggestionsTab.prototype.onResume = function (options) {
    _basetab.default.prototype.onResume.apply(this, arguments);
    return _sectionscontroller.default.prototype.onResume.apply(this, arguments);
  };
  LiveTvSuggestionsTab.prototype.onPause = function () {
    _basetab.default.prototype.onPause.apply(this, arguments);
    _sectionscontroller.default.prototype.onPause.apply(this, arguments);
  };
  LiveTvSuggestionsTab.prototype.destroy = function () {
    _basetab.default.prototype.destroy.apply(this, arguments);
    _sectionscontroller.default.prototype.destroy.apply(this, arguments);
  };
  var _default = _exports.default = LiveTvSuggestionsTab;
});
