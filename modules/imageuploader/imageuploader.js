define(["exports", "./../emby-apiclient/connectionmanager.js", "./../common/globalize.js", "./../layoutmanager.js", "./../loading/loading.js", "./../dialoghelper/dialoghelper.js", "./../common/textencoding.js", "./../emby-elements/emby-button/emby-button.js", "./../emby-elements/emby-select/emby-select.js", "./../emby-elements/emby-scroller/emby-scroller.js", "./../emby-elements/emby-file-input/emby-file-input.js", "./../emby-elements/emby-dialogclosebutton/emby-dialogclosebutton.js"], function (_exports, _connectionmanager, _globalize, _layoutmanager, _loading, _dialoghelper, _textencoding, _embyButton, _embySelect, _embyScroller, _embyFileInput, _embyDialogclosebutton) {
  Object.defineProperty(_exports, "__esModule", {
    value: true
  });
  _exports.default = void 0;
  /* jshint module: true */

  require(['formDialogStyle', 'css!modules/imageuploader/style.css']);
  var currentItem;
  var currentFile;
  var hasChanges = false;
  function showAlert(options) {
    return Emby.importModule('./modules/common/dialogs/alert.js').then(function (alert) {
      return alert(options);
    });
  }
  function onFileReaderError(evt) {
    _loading.default.hide();
    switch (evt.target.error.code) {
      case evt.target.error.NOT_FOUND_ERR:
        showAlert(_globalize.default.translate('MessageFileReadError'));
        break;
      case evt.target.error.ABORT_ERR:
        break;
      // noop
      default:
        showAlert(_globalize.default.translate('MessageFileReadError'));
        break;
    }
  }
  function setFiles(page, files) {
    files = filterFilesForSupportedTypes(files);
    var file = files[0];
    if (!file || !file.type.match('image.*')) {
      page.querySelector('.imageOutput').innerHTML = '';
      page.querySelector('.fldUpload').classList.add('hide');
      currentFile = null;
      return;
    }
    currentFile = file;
    var reader = new FileReader();
    reader.onerror = onFileReaderError;
    reader.onloadstart = function () {
      page.querySelector('.fldUpload').classList.add('hide');
    };
    reader.onabort = function () {
      _loading.default.hide();
      console.log('File read cancelled');
    };

    // Closure to capture the file information.
    reader.onload = function (theFile) {
      return function (e) {
        // Render thumbnail.
        var html = ['<img style="max-width:100%;max-height:100%;" src="', e.target.result, '" title="', _textencoding.default.htmlEncode(theFile.name), '"/>'].join('');
        page.querySelector('.imageOutput').innerHTML = html;
        page.querySelector('.fldUpload').classList.remove('hide');
      };
    }(file);

    // Read in the image file as a data URL.
    reader.readAsDataURL(file);
  }
  function filterFilesForSupportedTypes(files) {
    var list = [];
    for (var i = 0, length = files.length; i < length; i++) {
      if (validateImage(files[i], false)) {
        list.push(files[i]);
      }
    }
    return list;
  }
  var supportedImageTypes = ['image/png', 'image/jpg', 'image/jpeg', 'image/webp', 'image/gif'];
  function validateImage(file) {
    if (!supportedImageTypes.includes(file.type)) {
      return false;
    }
    return true;
  }
  function onSubmit(e) {
    e.preventDefault();
    var file = currentFile;
    if (!file) {
      return false;
    }
    if (!validateImage(file, false)) {
      return false;
    }
    _loading.default.show();
    var dlg = this.closest('.dialog');
    var imageType = dlg.querySelector('.selectImageType').value;
    var imageIndex = dlg.imageIndex;
    _connectionmanager.default.getApiClient(currentItem).uploadItemImage(currentItem.Id, imageType, imageIndex, file).then(function () {
      dlg.querySelector('.uploadImage').value = '';
      _loading.default.hide();
      hasChanges = true;
      _dialoghelper.default.close(dlg);
    });
    return false;
  }
  function initEditor(page) {
    page.querySelector('form').addEventListener('submit', onSubmit);
    page.querySelector('.uploadImage').addEventListener("change", function () {
      setFiles(page, this.files);
    });
    page.querySelector('.btnBrowse').addEventListener("click", function () {
      var uploadInput = page.querySelector('.uploadImage');
      uploadInput.focus();
      uploadInput.click();
    });
  }
  function removeImageType(dlg, type) {
    var opt = dlg.querySelector('option[value="' + type + '"]');
    if (opt) {
      opt.parentNode.removeChild(opt);
    }
  }
  function showEditor(options, resolve, reject) {
    if (!options) {
      options = {};
    }
    require(['text!modules/imageuploader/imageuploader.template.html'], function (template) {
      currentItem = options.item;
      var dialogOptions = {
        removeOnClose: true
      };
      if (_layoutmanager.default.tv) {
        dialogOptions.size = 'fullscreen';
      } else {
        dialogOptions.size = 'fullscreen-border';
      }
      var dlg = _dialoghelper.default.createDialog(dialogOptions);
      dlg.classList.add('formDialog');
      dlg.imageIndex = options.imageIndex;
      dlg.innerHTML = _globalize.default.translateDocument(template, 'sharedcomponents');
      dlg.querySelector('.uploadImage').setAttribute('accept', supportedImageTypes.join(','));
      if (currentItem.Type !== 'TvChannel') {
        removeImageType(dlg, 'LogoLight');
        removeImageType(dlg, 'LogoLightColor');
      }

      // Has to be assigned a z-index after the call to .open() 
      dlg.addEventListener('close', function () {
        _loading.default.hide();
        resolve(hasChanges);
      });
      if (!options.imageType) {
        dlg.querySelector('.fldSelectImageType').classList.remove('hide');
      }
      _dialoghelper.default.open(dlg);
      initEditor(dlg);
      dlg.querySelector('.selectImageType').value = options.imageType || 'Primary';
    });
  }
  var _default = _exports.default = {
    show: function (options) {
      return new Promise(function (resolve, reject) {
        hasChanges = false;
        showEditor(options, resolve, reject);
      });
    }
  };
});
