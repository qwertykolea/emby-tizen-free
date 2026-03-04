define(["exports", "./../modules/viewmanager/baseview.js", "./../modules/loading/loading.js", "./../modules/common/globalize.js", "./../modules/emby-elements/emby-input/emby-input.js", "./../modules/emby-elements/emby-button/emby-button.js", "./../modules/emby-elements/emby-select/emby-select.js", "./../modules/emby-elements/emby-scroller/emby-scroller.js", "./../modules/emby-elements/emby-file-input/emby-file-input.js", "./../modules/emby-apiclient/connectionmanager.js", "./../modules/common/servicelocator.js", "./../modules/appheader/appheader.js", "./userpasswordcontroller.js", "./../modules/common/textencoding.js"], function (_exports, _baseview, _loading, _globalize, _embyInput, _embyButton, _embySelect, _embyScroller, _embyFileInput, _connectionmanager, _servicelocator, _appheader, _userpasswordcontroller, _textencoding) {
  Object.defineProperty(_exports, "__esModule", {
    value: true
  });
  _exports.default = void 0;
  /* jshint module: true */

  require(['css!settings/profile.css']);
  function showAlert(options) {
    return Emby.importModule('./modules/common/dialogs/alert.js').then(function (alert) {
      return alert(options);
    });
  }
  function showConfirm(options) {
    return Emby.importModule('./modules/common/dialogs/confirm.js').then(function (confirm) {
      return confirm(options);
    });
  }
  var currentFile;
  function reloadUser(page, apiClient, userId) {
    _loading.default.show();
    apiClient.getUser(userId).then(function (user) {
      page.querySelector('.username').innerHTML = _textencoding.default.htmlEncode(user.Name);
      var uploadUserImage = page.querySelector('.uploadUserImage');
      uploadUserImage.value = '';
      uploadUserImage.dispatchEvent(new CustomEvent('change', {
        bubbles: true
      }));
      _appheader.default.setTitle(user.Name);
      var imageUrl;
      var fldImage = page.querySelector('.fldImage');
      if (user.PrimaryImageTag) {
        imageUrl = apiClient.getUserImageUrl(user.Id, {
          height: 200,
          tag: user.PrimaryImageTag,
          type: "Primary"
        });
        fldImage.innerHTML = '<img style="border-radius:.3em;width:7em;margin-right:1em;" src="' + imageUrl + '" />';
      } else {
        fldImage.innerHTML = '<i class="md-icon" style="font-size:6em;margin:0 .25em;">person</i>';
      }
      fldImage.classList.remove('hide');
      var showImageEditing = true;
      apiClient.getCurrentUser().then(function (loggedInUser) {
        if (showImageEditing && _servicelocator.appHost.supports('fileinput') && (loggedInUser.Policy.IsAdministrator || user.Policy.EnableUserPreferenceAccess)) {
          page.querySelector('.newImageForm').classList.remove('hide');
          if (user.PrimaryImageTag) {
            page.querySelector('.btnDeleteImage').classList.remove('hide');
          } else {
            page.querySelector('.btnDeleteImage').classList.add('hide');
          }
        } else {
          page.querySelector('.newImageForm').classList.add('hide');
          page.querySelector('.btnDeleteImage').classList.add('hide');
        }
      });
      _loading.default.hide();
    });
  }
  function displayFileError(text) {
    showAlert(_globalize.default.translate(text));
  }
  function onFileReaderError(evt) {
    _loading.default.hide();
    switch (evt.target.error.code) {
      case evt.target.error.NOT_FOUND_ERR:
        displayFileError('FileNotFound');
        break;
      case evt.target.error.NOT_READABLE_ERR:
        displayFileError('FileReadError');
        break;
      case evt.target.error.ABORT_ERR:
        break;
      // noop
      default:
        {
          displayFileError('FileReadError');
          break;
        }
    }
  }
  function onFileReaderAbort(evt) {
    _loading.default.hide();
    displayFileError('FileReadCancelled');
  }
  function setFiles(page, files) {
    files = filterFilesForSupportedTypes(files);
    var file = files[0];
    if (!file || !file.type.match('image.*')) {
      page.querySelector('.userImageOutput').innerHTML = '';
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
    reader.onabort = onFileReaderAbort;

    // Closure to capture the file information.
    reader.onload = function (e) {
      // Render thumbnail.
      var html = ['<img style="max-width:100%;max-height:100%;" src="', e.target.result, '" title="', _textencoding.default.htmlEncode(file.name || ''), '"/>'].join('');
      page.querySelector('.userImageOutput').innerHTML = html;
      page.querySelector('.fldUpload').classList.remove('hide');
    };

    // Read in the image file as a data URL.
    reader.readAsDataURL(file);
  }
  function onImageDragOver(e) {
    e.preventDefault();
    e.originalEvent.dataTransfer.dropEffect = 'Copy';
    return false;
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
  function View(view, params) {
    _baseview.default.apply(this, arguments);
    var apiClient = _connectionmanager.default.getApiClient(params.serverId);
    var userId = params.userId;
    reloadUser(view, apiClient, userId);
    var userImageDropZone = view.querySelector('.userImageDropZone');
    userImageDropZone.addEventListener('dragOver', onImageDragOver);
    view.querySelector('.uploadUserImage').setAttribute('accept', supportedImageTypes.join(','));
    view.querySelector('.btnDeleteImage').addEventListener('click', function () {
      showConfirm({
        title: _globalize.default.translate('HeaderDeleteImage'),
        text: _globalize.default.translate('ConfirmDeleteImage'),
        confirmText: _globalize.default.translate('Delete'),
        primary: 'cancel'
      }).then(function () {
        _loading.default.show();
        apiClient.deleteUserImage(userId, "primary").then(function () {
          _loading.default.hide();
          reloadUser(view, apiClient, userId);
        });
      });
    });
    view.querySelector('.btnBrowse').addEventListener("click", function () {
      view.querySelector('.uploadUserImage').click();
    });
    view.querySelector('.newImageForm').addEventListener('submit', function (e) {
      e.preventDefault();
      var file = currentFile;
      if (!file) {
        return false;
      }
      if (!validateImage(file, false)) {
        return false;
      }
      _loading.default.show();
      apiClient.uploadUserImage(userId, 'Primary', file).then(function () {
        _loading.default.hide();
        reloadUser(view, apiClient, userId);
      });
      return false;
    });
    view.querySelector('.uploadUserImage').addEventListener('change', function (e) {
      setFiles(view, e.target.files);
    });
    this.userPasswordController = new _userpasswordcontroller.default(view, params, apiClient);
  }
  Object.assign(View.prototype, _baseview.default.prototype);
  View.prototype.onResume = function (options) {
    _baseview.default.prototype.onResume.apply(this, arguments);
    if (this.userPasswordController) {
      this.userPasswordController.resume(options);
    }
  };
  View.prototype.onPause = function () {
    _baseview.default.prototype.onPause.apply(this, arguments);
    if (this.userPasswordController) {
      this.userPasswordController.pause();
    }
  };
  View.prototype.destroy = function () {
    _baseview.default.prototype.destroy.apply(this, arguments);
    this.userPasswordController.destroy();
    this.userPasswordController = null;
  };
  var _default = _exports.default = View;
});
