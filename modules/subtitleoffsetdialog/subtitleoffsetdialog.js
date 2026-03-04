define(["exports", "./../dialoghelper/dialoghelper.js", "./../common/globalize.js", "./../emby-apiclient/events.js", "./../dom.js", "./../layoutmanager.js", "./../common/playback/playbackmanager.js", "./../emby-elements/emby-button/emby-button.js", "./../emby-elements/emby-button/paper-icon-button-light.js", "./../emby-elements/emby-dialogclosebutton/emby-dialogclosebutton.js", "./../emby-elements/emby-slider/emby-slider.js"], function (_exports, _dialoghelper, _globalize, _events, _dom, _layoutmanager, _playbackmanager, _embyButton, _paperIconButtonLight, _embyDialogclosebutton, _embySlider) {
  Object.defineProperty(_exports, "__esModule", {
    value: true
  });
  _exports.default = void 0;
  /* jshint module: true */

  require(['material-icons', 'formDialogStyle']);
  function SubtitleOffsetDialog(options) {
    this.options = options;
  }
  var IncrementStepMs = 100;
  function onStepUpClick() {
    _playbackmanager.default.incrementSubtitleOffset(IncrementStepMs, this.options.player);
  }
  function onStepDownClick() {
    _playbackmanager.default.incrementSubtitleOffset(IncrementStepMs * -1, this.options.player);
  }
  function getEditorHtml() {
    var html = '';
    html += '<div class="formDialogContent">';
    html += '<div style="padding-top:.5em;" class="verticalFieldItems dialogContentInner dialogContentInner-normalbottompadding dialog-content-centered dialog-content-centered-mini padded-left padded-right">';
    html += '<h3 class="subtitleOverlayOffsetText verticalFieldItem secondaryText" style="margin:0; text-align:center;"><span class="offsetValue"></span></h3>';
    html += '<div class="flex align-items-center verticalFieldItem buttonItems focuscontainer-x" style="margin:1.25em 0;">';
    var buttonClass = _layoutmanager.default.tv ? ' hide' : '';
    html += '<button is="paper-icon-button-light" type="button" class="buttonItems-item flex-shrink-zero btnStepDown' + buttonClass + '" title="' + _globalize.default.translate('Down') + '" aria-label="' + _globalize.default.translate('Down') + '"><i class="md-icon autortl md-icon-fill">&#xe020;</i></button>';
    html += '<div class="buttonItems-item subtitleOffsetSliderContainer sliderContainer flex-grow">';
    html += '<input type="range" is="emby-slider" step="' + IncrementStepMs + '" min="-120000" max="120000" value="0" class="autofocus subtitleOffsetSlider" data-bubble="false" />';
    html += '</div>';
    html += '<button is="paper-icon-button-light" type="button" class="buttonItems-item flex-shrink-zero btnStepUp' + buttonClass + '" title="' + _globalize.default.translate('Up') + '" aria-label="' + _globalize.default.translate('Up') + '"><i class="md-icon autortl md-icon-fill">&#xe01f;</i></button>';
    html += '</div>';
    html += '<div class="buttonItems verticalFieldItem flex align-items-center justify-content-center" style="margin-bottom:.75em;">';
    html += '<button is="emby-button" type="button" class="flex-shrink-zero btnReset raised raised-mini nobackdropfilter" title="' + _globalize.default.translate('Reset') + '" aria-label="' + _globalize.default.translate('Reset') + '">' + _globalize.default.translate('Reset') + '</button>';
    html += '</div>';

    // formDialogContent
    html += '</div>';
    html += '</div>';
    return html;
  }
  function onDialogClosed() {
    unbindEvents(this, this.options.player);
    return Promise.resolve();
  }
  function onResetButtonClick(e) {
    _playbackmanager.default.setSubtitleOffset(0, this.options.player);
  }
  function onSliderChange(e) {
    var slider = e.target;
    var value = parseInt(slider.value);
    console.log('slider value: ' + value + ' - ' + typeof value);
    _playbackmanager.default.setSubtitleOffset(value, this.options.player);
  }
  function renderData(instance, offsetValue) {
    instance.dlg.querySelector('.offsetValue').innerHTML = getBubbleText(offsetValue);
    setSliderValue(instance.dlg.querySelector('.subtitleOffsetSlider'), offsetValue);
  }
  function refreshData(instance, player) {
    renderData(instance, _playbackmanager.default.getSubtitleOffset(player));
  }
  function bindEvents(instance, player) {
    var localOnSubtitleOffsetChange = function (e) {
      refreshData(instance, player);
    };
    instance.localOnSubtitleOffsetChange = localOnSubtitleOffsetChange;
    _events.default.on(player, 'subtitleoffsetchange', localOnSubtitleOffsetChange);
  }
  function unbindEvents(instance, player) {
    var localOnSubtitleOffsetChange = instance.localOnSubtitleOffsetChange;
    if (localOnSubtitleOffsetChange) {
      _events.default.off(player, 'subtitleoffsetchange', localOnSubtitleOffsetChange);
    }
  }
  function setSliderValue(slider, value) {
    if (slider.dragging) {
      return;
    }
    if (slider.setValue) {
      slider.setValue(value);
      return;
    }
    slider.waitForCustomElementUpgrade().then(function () {
      slider.setValue(value);
    });
  }
  function getTimeInSeconds(ms) {
    if (Math.abs(ms) >= 1000) {
      ms = ms / 1000;
      return ms.toFixed(1) + ' seconds';
    }
    return ms + ' ms';
  }
  function getBubbleText(value) {
    return getTimeInSeconds(value);
  }
  SubtitleOffsetDialog.prototype.show = function () {
    if (!this.dlg) {
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
        autoCenter: false
      };
      var dlg = _dialoghelper.default.createDialog(dialogOptions);
      dlg.classList.add('formDialog', 'subtitleOffsetDialog');
      if (_dom.default.allowBackdropFilter()) {
        dlg.classList.add('dialog-blur');
      }
      var html = '';
      var title = _globalize.default.translate('HeaderSubtitleOffset');
      html += '<div class="formDialogHeader">';
      html += '<button type="button" is="emby-dialogclosebutton" closetype="done"></button>';
      html += '<h3 class="formDialogHeaderTitle">';
      html += title;
      html += '</h3>';
      html += '</div>';
      html += getEditorHtml();
      dlg.innerHTML = html;
      dlg.style.minWidth = 'initial';
      this.dlg = dlg;
      var subtitleOffsetSlider = dlg.querySelector('.subtitleOffsetSlider');
      var boundOnSliderChange = onSliderChange.bind(this);
      subtitleOffsetSlider.addEventListener('change', boundOnSliderChange);
      subtitleOffsetSlider.addEventListener('input', boundOnSliderChange);
      dlg.querySelector('.btnStepDown').addEventListener('click', onStepDownClick.bind(this));
      dlg.querySelector('.btnStepUp').addEventListener('click', onStepUpClick.bind(this));
      subtitleOffsetSlider.getBubbleText = getBubbleText;
      dlg.querySelector('.btnReset').addEventListener('click', onResetButtonClick.bind(this));
    }
    bindEvents(this, this.options.player);
    refreshData(this, this.options.player);
    var dlgClosedFn = onDialogClosed.bind(this);
    return _dialoghelper.default.open(this.dlg).then(dlgClosedFn, dlgClosedFn);
  };
  SubtitleOffsetDialog.prototype.close = function () {
    var dlg = this.dlg;
    if (dlg) {
      _dialoghelper.default.close(dlg);
    }
  };
  SubtitleOffsetDialog.prototype.destroy = function () {
    this.close();
    this.options = null;
    this.dlg = null;
  };
  var _default = _exports.default = SubtitleOffsetDialog;
});
