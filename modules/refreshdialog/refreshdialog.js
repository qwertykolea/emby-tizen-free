define(["exports", "./../dialoghelper/dialoghelper.js", "./../layoutmanager.js", "./../common/globalize.js", "./../loading/loading.js", "./../emby-apiclient/connectionmanager.js", "./../emby-elements/emby-toggle/emby-toggle.js", "./../emby-elements/emby-select/emby-select.js", "./../emby-elements/emby-button/emby-button.js", "./../emby-elements/emby-button/paper-icon-button-light.js", "./../emby-elements/emby-scroller/emby-scroller.js", "./../emby-elements/emby-dialogclosebutton/emby-dialogclosebutton.js"], function (_exports, _dialoghelper, _layoutmanager, _globalize, _loading, _connectionmanager, _embyToggle, _embySelect, _embyButton, _paperIconButtonLight, _embyScroller, _embyDialogclosebutton) {
  Object.defineProperty(_exports, "__esModule", {
    value: true
  });
  _exports.default = void 0;
  /* jshint module: true */

  require(['material-icons', 'formDialogStyle', 'flexStyles']);
  function showToast(options) {
    return Emby.importModule('./modules/toast/toast.js').then(function (toast) {
      return toast(options);
    });
  }
  function getEditorHtml() {
    var html = '';
    html += '<div is="emby-scroller" data-horizontal="false" data-focusscroll="true" class="formDialogContent">';
    html += '<div class="scrollSlider">';
    html += '<form class="dialogContentInner dialog-content-centered padded-left padded-right">';
    html += '<div class="fldSelectPlaylist selectContainer">';
    html += '<select is="emby-select" class="selectMetadataRefreshMode" label="' + _globalize.default.translate('LabelRefreshMode') + '">';
    html += '<option value="missing">' + _globalize.default.translate('SearchForMissingMetadata') + '</option>';
    html += '<option value="all" selected>' + _globalize.default.translate('ReplaceAllMetadata') + '</option>';
    html += '</select>';
    html += '<div class="fieldDescription">';
    html += _globalize.default.translate('RefreshDialogHelp');
    html += '</div>';
    html += '</div>';
    html += '<div class="toggleContainer hide fldReplaceExistingImages">';
    html += '<label>';
    html += '<input type="checkbox" is="emby-toggle" class="chkReplaceImages" />';
    html += '<span>' + _globalize.default.translate('ReplaceExistingImages') + '</span>';
    html += '</label>';
    html += '<div class="toggleFieldDescription fieldDescription">';
    html += _globalize.default.translate('ReplaceExistingImagesHelp');
    html += '</div>';
    html += '</div>';
    html += '<div class="toggleContainer hide fldReplaceExistingThumbnailImages">';
    html += '<label>';
    html += '<input type="checkbox" is="emby-toggle" class="chkReplaceThumbnailImages" />';
    html += '<span>' + _globalize.default.translate('ReplaceExistingThumbnailImages') + '</span>';
    html += '</label>';
    html += '<div class="toggleFieldDescription fieldDescription">';
    html += _globalize.default.translate('ReplaceExistingThumbnailImagesHelp');
    html += '</div>';
    html += '</div>';
    html += '<br />';
    html += '<div class="formDialogFooter">';
    html += '<button is="emby-button" type="submit" class="raised btnSubmit block formDialogFooterItem button-submit">' + _globalize.default.translate('Refresh') + '</button>';
    html += '</div>';
    html += '</form>';
    html += '</div>';
    html += '</div>';
    return html;
  }
  function onSubmit(e) {
    _loading.default.show();
    var instance = this;
    var dlg = e.target.closest('.dialog');
    var options = instance.options;
    var replaceAllMetadata = dlg.querySelector('.selectMetadataRefreshMode').value === 'all';
    var mode = 'FullRefresh';
    var replaceAllImages = mode === 'FullRefresh' && dlg.querySelector('.chkReplaceImages').checked;
    var replaceThumbnailImages = mode === 'FullRefresh' && dlg.querySelector('.chkReplaceThumbnailImages').checked;
    var items = options.items;
    var apiClient = _connectionmanager.default.getApiClient(items[0]);
    apiClient.refreshItems(items, {
      Recursive: true,
      ImageRefreshMode: mode,
      MetadataRefreshMode: mode,
      ReplaceAllImages: replaceAllImages,
      ReplaceThumbnailImages: replaceThumbnailImages,
      ReplaceAllMetadata: replaceAllMetadata
    });
    _dialoghelper.default.close(dlg);
    showToast(_globalize.default.translate('RefreshingMetadataDots'));
    _loading.default.hide();
    e.preventDefault();
    return false;
  }
  function RefreshDialog(options) {
    this.options = options;
  }
  RefreshDialog.prototype.show = function () {
    var dialogOptions = {
      removeOnClose: true,
      scrollY: false
    };
    if (_layoutmanager.default.tv) {
      dialogOptions.size = 'fullscreen';
    } else {
      dialogOptions.size = 'small';
    }
    var dlg = _dialoghelper.default.createDialog(dialogOptions);
    dlg.classList.add('formDialog');
    var html = '';
    var title = _globalize.default.translate('HeaderRefreshMetadata');
    html += '<div class="formDialogHeader">';
    html += '<button type="button" is="emby-dialogclosebutton"></button>';
    html += '<h3 class="formDialogHeaderTitle">';
    html += title;
    html += '</h3>';
    html += '</div>';
    html += getEditorHtml();
    dlg.innerHTML = html;
    dlg.querySelector('form').addEventListener('submit', onSubmit.bind(this));
    var instance = this;
    dlg.querySelector('.selectMetadataRefreshMode').addEventListener('change', function () {
      dlg.querySelector('.fldReplaceExistingImages').classList.remove('hide');
      var apiClient = _connectionmanager.default.getApiClient(instance.options.items[0]);
      if (apiClient.isMinServerVersion('4.9.1.1')) {
        dlg.querySelector('.fldReplaceExistingThumbnailImages').classList.remove('hide');
      }
    });
    if (this.options.mode) {
      dlg.querySelector('.selectMetadataRefreshMode').value = this.options.mode;
    }
    dlg.querySelector('.selectMetadataRefreshMode').dispatchEvent(new CustomEvent('change'));
    return new Promise(function (resolve, reject) {
      dlg.addEventListener('close', resolve);
      _dialoghelper.default.open(dlg);
    });
  };
  var _default = _exports.default = RefreshDialog;
});
