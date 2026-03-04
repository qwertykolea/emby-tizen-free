define(["exports", "./../dialoghelper/dialoghelper.js", "./../common/globalize.js", "./../dom.js", "./../common/playback/playbackmanager.js", "./../emby-elements/emby-button/emby-button.js", "./../emby-elements/emby-button/paper-icon-button-light.js", "./../emby-elements/emby-dialogclosebutton/emby-dialogclosebutton.js", "./../emby-elements/emby-slider/emby-slider.js", "./../emby-elements/emby-scroller/emby-scroller.js", "./../viewmanager/basesettingscontainer.js", "./../../settings/subtitleappearanceeditor.js"], function (_exports, _dialoghelper, _globalize, _dom, _playbackmanager, _embyButton, _paperIconButtonLight, _embyDialogclosebutton, _embySlider, _embyScroller, _basesettingscontainer, _subtitleappearanceeditor) {
  Object.defineProperty(_exports, "__esModule", {
    value: true
  });
  _exports.default = void 0;
  /* jshint module: true */

  require(['material-icons', 'formDialogStyle']);
  function SubtitleAppearanceDialog(options) {
    this.options = options;
  }
  Object.assign(SubtitleAppearanceDialog.prototype, _basesettingscontainer.default.prototype);
  function getEditorHtml() {
    var html = '';
    html += '<div is="emby-scroller" data-horizontal="false" data-focusscroll="true" class="formDialogContent">';
    html += '<div class="scrollSlider">';
    html += '<form class="dialogContentInner dialog-content-centered padded-left padded-right fieldsets">';

    // formDialogContent
    html += '</form>';
    html += '</div>';
    html += '</div>';
    return html;
  }
  function onDialogClosed() {
    return Promise.resolve();
  }
  function renderData(instance, offsetValue) {}
  function refreshData(instance, player) {
    renderData(instance, _playbackmanager.default.getSubtitleOffset(player));
  }
  function loadForm(instance) {
    var context = instance.view;
    var subtitleAppearanceEditor = new _subtitleappearanceeditor.default({
      settingsContainer: instance,
      preview: false,
      title: false
    });
    instance.subtitleAppearanceEditor = subtitleAppearanceEditor;
    return subtitleAppearanceEditor.embed(context.querySelector('.fieldsets'), 'afterbegin');
  }
  function onOpened() {
    this.settingsOnResume({
      refresh: true
    });
  }
  SubtitleAppearanceDialog.prototype.show = function () {
    if (!this.view) {
      var dialogOptions = {
        removeOnClose: true,
        scrollY: false,
        transparentBackground: true,
        positionTo: this.options.positionTo,
        positionX: this.options.positionX,
        positionY: this.options.positionY,
        transformOrigin: this.options.transformOrigin,
        lowResAutoHeight: true,
        skipAutoFocusIfNotEnabled: false,
        autoCenter: false,
        size: 'small'
      };
      var dlg = _dialoghelper.default.createDialog(dialogOptions);
      dlg.classList.add('formDialog', 'subtitleAppearanceDialog');
      if (_dom.default.allowBackdropFilter()) {
        dlg.classList.add('dialog-blur');
      }
      var html = '';
      var title = _globalize.default.translate('HeaderSubtitleAppearance');
      html += '<div class="formDialogHeader">';
      html += '<button type="button" is="emby-dialogclosebutton" closetype="done"></button>';
      html += '<h3 class="formDialogHeaderTitle">';
      html += title;
      html += '</h3>';
      html += '</div>';
      html += getEditorHtml();
      dlg.innerHTML = html;
      dlg.style.minWidth = 'initial';
      dlg.addEventListener('opened', onOpened.bind(this));
      this.view = dlg;

      // not exactly ideal or a good pattern to be doing this here, but we did not have the view prior to this
      _basesettingscontainer.default.call(this, dlg);
    }
    refreshData(this, this.options.player);
    var dlgClosedFn = onDialogClosed.bind(this);
    return _dialoghelper.default.open(this.view).then(dlgClosedFn, dlgClosedFn);
  };
  SubtitleAppearanceDialog.prototype.loadSettingsInternal = function () {
    var instance = this;
    return loadForm(instance).then(function () {
      return instance.loadAutoSettings().then(function () {
        instance.subtitleAppearanceEditor.bindEvents();
      });
    });
  };
  SubtitleAppearanceDialog.prototype.close = function () {
    var dlg = this.view;
    if (dlg) {
      _dialoghelper.default.close(dlg);
    }
  };
  SubtitleAppearanceDialog.prototype.getApiClient = function () {
    return this.options.apiClient;
  };
  SubtitleAppearanceDialog.prototype.destroy = function () {
    this.close();
    _basesettingscontainer.default.prototype.destroy.apply(this, arguments);
    var subtitleAppearanceEditor = this.subtitleAppearanceEditor;
    if (subtitleAppearanceEditor) {
      subtitleAppearanceEditor.destroy();
      this.subtitleAppearanceEditor = null;
    }
    this.options = null;
    this.view = null;
  };
  var _default = _exports.default = SubtitleAppearanceDialog;
});
