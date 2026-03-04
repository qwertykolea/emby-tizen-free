define(["exports", "./../modules/common/globalize.js", "./../modules/common/subtitleappearancehelper.js", "./../modules/emby-apiclient/events.js", "./../modules/emby-elements/emby-select/emby-select.js", "./../modules/emby-elements/emby-button/emby-button.js", "./../modules/emby-elements/emby-input/emby-input.js", "./../modules/emby-elements/emby-toggle/emby-toggle.js"], function (_exports, _globalize, _subtitleappearancehelper, _events, _embySelect, _embyButton, _embyInput, _embyToggle) {
  Object.defineProperty(_exports, "__esModule", {
    value: true
  });
  _exports.default = void 0;
  require(['css!settings/subtitles.css']);
  function numberToPercentString(value) {
    try {
      return new Intl.NumberFormat(_globalize.default.getCurrentLocales(), {
        style: 'percent'
      }).format(value / 100);
    } catch (err) {
      console.error('Error in NumberFormat: ', err);
      return value + '%';
    }
  }
  function populateVerticalPosition(select) {
    var options = [{
      name: numberToPercentString(90),
      value: 90
    }, {
      name: numberToPercentString(80),
      value: 80
    }, {
      name: numberToPercentString(70),
      value: 70
    }, {
      name: numberToPercentString(60),
      value: 60
    }, {
      name: numberToPercentString(50),
      value: 50
    }, {
      name: numberToPercentString(40),
      value: 40
    }, {
      name: numberToPercentString(30),
      value: 30
    }, {
      name: numberToPercentString(20),
      value: 20
    }, {
      name: numberToPercentString(10),
      value: 10
    }, {
      name: _globalize.default.translate('Bottom'),
      value: 0
    }];
    options.reverse();
    select.innerHTML = options.map(function (o) {
      return '<option value="' + o.value + '">' + o.name + '</option>';
    }).join('');
  }
  function onUserSettingsChange(e, name) {
    if (name !== 'localplayersubtitleappearance3') {
      return;
    }
    var instance = this;
    var form = instance.view;
    var elements = {
      window: form.querySelector('.subtitleappearance-preview-window'),
      text: form.querySelector('.subtitleappearance-preview-text')
    };
    var appearanceSettings = instance.options.settingsContainer.getNamedSettingsOwner('usersettings').getSubtitleAppearanceSettings();
    _subtitleappearancehelper.default.applyStyles(elements, appearanceSettings);
  }
  function onAppearanceFieldChange(e) {
    onUserSettingsChange.call(this, {}, 'localplayersubtitleappearance3');
    var form = e.target.closest('.fieldsetSubtitleAppearance');
    var selectBackgroundColor = e.target.closest('.selectBackgroundColor');
    if (selectBackgroundColor) {
      if (selectBackgroundColor.value === 'transparent') {
        form.querySelector('.fldBackgroundOpacity').classList.add('hide');
      } else {
        form.querySelector('.fldBackgroundOpacity').classList.remove('hide');
      }
    }
  }
  function SubtitleAppearanceEditor(options) {
    this.options = options;
  }
  SubtitleAppearanceEditor.prototype.embed = function (context, position) {
    var instance = this;
    return require(['text!./settings/subtitleappearanceeditor.template.html']).then(function (responses) {
      context.insertAdjacentHTML(position, _globalize.default.translateDocument(responses[0]));
      context = context.parentNode.querySelector('.fieldsetSubtitleAppearance');
      instance.view = context;
      var selectVerticalPosition = context.querySelector('.selectVerticalPosition');
      populateVerticalPosition(selectVerticalPosition);
      context.addEventListener('change', onAppearanceFieldChange.bind(instance));
      if (instance.options.preview !== false) {
        context.querySelector('.previewContainer').classList.remove('hide');
      }
      if (instance.options.title !== false) {
        context.querySelector('.appearanceTitle').classList.remove('hide');
      }
    });
  };
  SubtitleAppearanceEditor.prototype.bindEvents = function () {
    var instance = this;
    if (!this.boundOnUserSettingsChange) {
      this.boundOnUserSettingsChange = onUserSettingsChange.bind(instance);
      _events.default.on(instance.options.settingsContainer.getNamedSettingsOwner('usersettings'), 'change', this.boundOnUserSettingsChange);
    }
  };
  SubtitleAppearanceEditor.prototype.destroy = function () {
    var boundOnUserSettingsChange = this.boundOnUserSettingsChange;
    if (boundOnUserSettingsChange) {
      _events.default.off(this.options.settingsContainer.getNamedSettingsOwner('usersettings'), 'change', boundOnUserSettingsChange);
      this.boundOnUserSettingsChange = null;
    }
    this.options = null;
    this.view = null;
  };
  var _default = _exports.default = SubtitleAppearanceEditor;
});
