define(["exports", "./../modules/viewmanager/basesettingsview.js", "./../modules/loading/loading.js", "./../modules/common/globalize.js", "./../modules/emby-elements/emby-scroller/emby-scroller.js", "./../modules/emby-elements/emby-select/emby-select.js", "./../modules/emby-elements/emby-button/emby-button.js", "./../modules/emby-elements/emby-input/emby-input.js", "./../modules/emby-elements/emby-toggle/emby-toggle.js"], function (_exports, _basesettingsview, _loading, _globalize, _embyScroller, _embySelect, _embyButton, _embyInput, _embyToggle) {
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
  function fillSkipLengths(select) {
    var options = [5, 10, 15, 20, 25, 30];
    var formatter = new Intl.DurationFormat(_globalize.default.getCurrentLocales(), {
      style: 'long'
    });
    select.innerHTML = options.map(function (option) {
      return {
        name: formatter.format({
          seconds: option
        }),
        value: option * 1000
      };
    }).map(function (o) {
      return '<option value="' + o.value + '">' + o.name + '</option>';
    }).join('');
  }
  function fillResumeRewindSeconds(select) {
    var options = [0, 5, 10, 15, 20];
    var formatter = new Intl.DurationFormat(_globalize.default.getCurrentLocales(), {
      style: 'long'
    });
    select.innerHTML = options.map(function (option) {
      return {
        name: formatter.format({
          seconds: option
        }),
        value: option
      };
    }).map(function (o) {
      return '<option value="' + o.value + '">' + o.name + '</option>';
    }).join('');
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
      return instance.getApiClient().clearUserTrackSelections(instance.getUserConfigurationUserId(), mode).then(onTrackSelectionsCleared, onTrackSelectionsCleared);
    });
  }
  function getAudioLanguages(query) {
    var instance = this;
    var apiClient = instance.getApiClient();
    return apiClient.getCultures().then(function (cultures) {
      var selectedValues = instance.view.querySelector('.selectAudioLanguage').values;
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
  function View(view, params) {
    _basesettingsview.default.apply(this, arguments);
    view.querySelector('form').addEventListener('submit', onSubmit.bind(this));
    view.querySelector('.btnClearTrackSelections').addEventListener('click', onClearSavedTrackSelectionsClick.bind(this));
    fillResumeRewindSeconds(view.querySelector('.selectResumeRewind'));
    fillSkipLengths(view.querySelector('.selectSkipForwardLength'));
    fillSkipLengths(view.querySelector('.selectSkipBackLength'));
    var selectAudioLanguage = view.querySelector('.selectAudioLanguage');
    selectAudioLanguage.getItems = getAudioLanguages.bind(this);
  }
  Object.assign(View.prototype, _basesettingsview.default.prototype);
  View.prototype.loadSettingsInternal = function () {
    var instance = this;
    return instance.loadAutoSettings();
  };
  View.prototype.getUserConfigurationUserId = function () {
    return this.params.userId || this.getApiClient().getCurrentUserId();
  };
  var _default = _exports.default = View;
});
