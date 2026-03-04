define(["exports", "./../modules/viewmanager/basesettingsview.js", "./../modules/loading/loading.js", "./../modules/common/globalize.js", "./../modules/emby-elements/emby-scroller/emby-scroller.js", "./../modules/emby-elements/emby-select/emby-select.js", "./../modules/emby-elements/emby-button/emby-button.js", "./../modules/emby-elements/emby-input/emby-input.js", "./../modules/emby-elements/emby-toggle/emby-toggle.js", "./subtitleappearanceeditor.js"], function (_exports, _basesettingsview, _loading, _globalize, _embyScroller, _embySelect, _embyButton, _embyInput, _embyToggle, _subtitleappearanceeditor) {
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
  function loadForm(instance) {
    var context = instance.view;
    var subtitleAppearanceEditor = new _subtitleappearanceeditor.default({
      settingsContainer: instance
    });
    instance.subtitleAppearanceEditor = subtitleAppearanceEditor;
    return subtitleAppearanceEditor.embed(context.querySelector('.fieldsetSubtitles'), 'afterend').then(function () {
      _loading.default.hide();
    });
  }
  function onSubmit(e) {
    // Disable default form submission
    e.preventDefault();
    return false;
  }
  function onTrackSelectionsCleared() {
    _loading.default.hide();
  }
  function onClearSavedTrackSelectionsClick(e) {
    var instance = this;
    var btn = e.target.closest('button');
    var mode = btn.getAttribute('data-mode');
    return showConfirm({
      title: _globalize.default.translate('HeaderClearTrackSelections'),
      text: _globalize.default.translate('QuestionClearSavedTracks'),
      confirmText: _globalize.default.translate('HeaderClearTrackSelections'),
      primary: 'cancel'
    }).then(function () {
      _loading.default.show();
      var userId = instance.getUserConfigurationUserId();
      return instance.getApiClient().clearUserTrackSelections(userId, mode).then(onTrackSelectionsCleared, onTrackSelectionsCleared);
    });
  }
  function getSubtitleLanguages(query) {
    var instance = this;
    var apiClient = this.getApiClient();
    return apiClient.getCultures().then(function (cultures) {
      var selectedValues = instance.view.querySelector('.selectSubtitleLanguage').values;
      if (!Array.isArray(selectedValues)) {
        var _selectedValues;
        if ((_selectedValues = selectedValues) != null && _selectedValues.split) {
          selectedValues = selectedValues.split(',');
        } else {
          selectedValues = [];
        }
      }
      var items = cultures.map(function (c) {
        return {
          Name: c.DisplayName,
          Id: c.TwoLetterISOLanguageName,
          Type: 'GenericListItem',
          CanReorder: selectedValues.indexOf(c.TwoLetterISOLanguageName) !== -1 && selectedValues.length > 1
        };
      });
      items.sort(function (a, b) {
        var aIndex = selectedValues.indexOf(a.Id);
        var bIndex = selectedValues.indexOf(b.Id);
        if (aIndex < 0) {
          aIndex = items.length;
        }
        if (bIndex < 0) {
          bIndex = items.length;
        }
        if (aIndex === bIndex) {
          return 0;
        }
        return aIndex < bIndex ? -1 : 1;
      });
      var total = items.length;
      items = items.slice(query.StartIndex || 0);
      if (query.Limit != null && items.length > query.Limit) {
        items.length = Math.min(items.length, query.Limit);
      }
      return {
        TotalRecordCount: total,
        Items: items
      };
    });
  }
  function fillSubtitleModeSelection(view, apiClient) {
    var html = '';
    html += '<option value="Default" data-description="' + _globalize.default.translate('DefaultSubtitlesHelp') + '">' + _globalize.default.translate('Default') + '</option>';
    html += '<option value="Smart" data-description="' + _globalize.default.translate('SmartSubtitlesHelp') + '">' + _globalize.default.translate('Smart') + '</option>';
    html += '<option value="OnlyForced" data-description="' + _globalize.default.translate('OnlyForcedSubtitlesHelp') + '">' + _globalize.default.translate('OnlyForcedSubtitles') + '</option>';
    if (apiClient.isMinServerVersion('4.8.0.67')) {
      html += '<option value="HearingImpaired" data-description="' + _globalize.default.translate('AutoSelectHearingImpairedHelp') + '">' + _globalize.default.translate('HearingImpaired') + '</option>';
    }
    html += '<option value="Always" data-description="' + _globalize.default.translate('AlwaysPlaySubtitlesHelp') + '">' + _globalize.default.translate('AlwaysPlaySubtitles') + '</option>';
    html += '<option value="None" data-description="' + _globalize.default.translate('NoSubtitlesHelp') + '">' + _globalize.default.translate('NoSubtitles') + '</option>';
    view.querySelector('.selectSubtitlePlaybackMode').innerHTML = html;
  }
  function View(view, params) {
    _basesettingsview.default.apply(this, arguments);
    fillSubtitleModeSelection(view, this.getApiClient());
    view.querySelector('form').addEventListener('submit', onSubmit.bind(this));
    view.querySelector('.btnClearTrackSelections').addEventListener('click', onClearSavedTrackSelectionsClick.bind(this));
    var selectSubtitleLanguage = view.querySelector('.selectSubtitleLanguage');
    selectSubtitleLanguage.getItems = getSubtitleLanguages.bind(this);
  }
  Object.assign(View.prototype, _basesettingsview.default.prototype);
  View.prototype.loadSettingsInternal = function () {
    var instance = this;
    return loadForm(instance).then(function () {
      return instance.loadAutoSettings().then(function () {
        instance.subtitleAppearanceEditor.bindEvents();
      });
    });
  };
  View.prototype.getUserConfigurationUserId = function () {
    return this.params.userId || this.getApiClient().getCurrentUserId();
  };
  View.prototype.destroy = function () {
    _basesettingsview.default.prototype.destroy.apply(this, arguments);
    var subtitleAppearanceEditor = this.subtitleAppearanceEditor;
    if (subtitleAppearanceEditor) {
      subtitleAppearanceEditor.destroy();
      this.subtitleAppearanceEditor = null;
    }
  };
  var _default = _exports.default = View;
});
