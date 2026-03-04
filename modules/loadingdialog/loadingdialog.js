define(["exports", "./../dialoghelper/dialoghelper.js", "./../layoutmanager.js", "./../common/globalize.js", "./../loading/loading.js", "./../emby-elements/emby-button/emby-button.js", "./../emby-elements/emby-button/paper-icon-button-light.js", "./../emby-elements/emby-scroller/emby-scroller.js"], function (_exports, _dialoghelper, _layoutmanager, _globalize, _loading, _embyButton, _paperIconButtonLight, _embyScroller) {
  Object.defineProperty(_exports, "__esModule", {
    value: true
  });
  _exports.default = void 0;
  /* jshint module: true */

  require(['material-icons', 'formDialogStyle', 'flexStyles']);
  function showDialog(instance, options, template) {
    var dialogOptions = {
      removeOnClose: true,
      scrollY: false
    };
    var enableTvLayout = _layoutmanager.default.tv;
    if (enableTvLayout) {
      dialogOptions.size = 'fullscreen';
    }
    var dlg = _dialoghelper.default.createDialog(dialogOptions);
    dlg.classList.add('formDialog');
    dlg.innerHTML = _globalize.default.translateHtml(template, 'sharedcomponents');
    dlg.classList.add('align-items-center');
    dlg.classList.add('justify-items-center');
    var formDialogContent = dlg.querySelector('.formDialogContent');
    formDialogContent.style['flex-grow'] = 'initial';
    formDialogContent.style['max-width'] = '50%';
    formDialogContent.style['max-height'] = '60%';
    if (enableTvLayout) {
      dlg.querySelector('.formDialogHeader').style.marginTop = '15%';
    }

    //dlg.querySelector('.btnCancel').addEventListener('click', function (e) {
    //    dialogHelper.close(dlg);
    //});

    dlg.querySelector('.formDialogHeaderTitle').innerHTML = options.title;
    dlg.querySelector('.dialogContentInner').innerHTML = options.text;
    instance.dlg = dlg;
    return _dialoghelper.default.open(dlg).then(function () {
      _loading.default.hide();
    });
  }
  function LoadingDialog(options) {
    this.options = options;
  }
  LoadingDialog.prototype.show = function () {
    var instance = this;
    _loading.default.show();
    return require(['dialogTemplateHtml']).then(function (responses) {
      return showDialog(instance, instance.options, responses[0]);
    });
  };
  LoadingDialog.prototype.setTitle = function (title) {};
  LoadingDialog.prototype.setText = function (text) {};
  LoadingDialog.prototype.hide = function () {
    if (this.dlg) {
      _dialoghelper.default.close(this.dlg);
      this.dlg = null;
    }
  };
  LoadingDialog.prototype.destroy = function () {
    this.dlg = null;
    this.options = null;
  };
  var _default = _exports.default = LoadingDialog;
});
