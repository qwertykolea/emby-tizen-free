define(["exports", "./../modules/viewmanager/basesettingsview.js", "./../modules/common/globalize.js", "./../modules/emby-elements/emby-scroller/emby-scroller.js", "./../modules/emby-elements/emby-select/emby-select.js", "./../modules/emby-elements/emby-button/emby-button.js", "./../modules/emby-elements/emby-button/paper-icon-button-light.js", "./../modules/emby-elements/emby-input/emby-input.js", "./../modules/emby-elements/emby-toggle/emby-toggle.js", "./../modules/emby-elements/emby-premierecontainer/emby-premierecontainer.js", "./../modules/emby-apiclient/events.js", "./../modules/emby-apiclient/connectionmanager.js", "./../modules/common/servicelocator.js", "./../modules/common/textencoding.js"], function (_exports, _basesettingsview, _globalize, _embyScroller, _embySelect, _embyButton, _paperIconButtonLight, _embyInput, _embyToggle, _embyPremierecontainer, _events, _connectionmanager, _servicelocator, _textencoding) {
  Object.defineProperty(_exports, "__esModule", {
    value: true
  });
  _exports.default = void 0;
  /* jshint module: true */

  function populateFolders(page, folders) {
    page.querySelector('.uploadFolderList').innerHTML = folders.map(function (s) {
      var html = '<label class="toggleContainer toggleContainer-listItem"><input type="checkbox" is="emby-toggle" class="chkUploadFolder" data-id="' + s.Id + '"/><span>' + _textencoding.default.htmlEncode(s.Name) + '</span></label>';
      return html;
    }).join('');
  }
  function setUploadFoldersVisibility(page) {
    if (!page.querySelector('.chkUploadServer:checked')) {
      page.querySelector('.fldUploadFolders').classList.add('hide');
      return;
    }
    page.querySelector('.fldUploadFolders').classList.remove('hide');
  }
  function loadForm(page) {
    page.querySelector('.uploadServerList').innerHTML = _connectionmanager.default.getSavedServers().map(function (s) {
      var html = '<label class="toggleContainer toggleContainer-listItem"><input type="checkbox" is="emby-toggle" class="chkUploadServer" data-id="' + s.Id + '"/><span>' + _textencoding.default.htmlEncode(s.Name) + '</span></label>';
      return html;
    }).join('');
    return _servicelocator.cameraUpload.getAvailableFolders().then(function (allFolders) {
      populateFolders(page, allFolders);
    });
  }
  function onUploadProgress(e, progressInfo) {
    var numItems = progressInfo.numItems || 0;
    var numItemsComplete = progressInfo.numItemsComplete || 0;
    var pctComplete = progressInfo.totalPercentComplete || 0;
    this.itemProgressBarForeground.style.width = pctComplete + '%';
    this.progressDescription.innerHTML = _globalize.default.translate('UploadingNumItems', numItemsComplete + 1, numItems);
    if (numItems && pctComplete < 100) {
      this.progressContainer.classList.remove('hide');
    } else {
      this.progressContainer.classList.add('hide');
    }
  }
  function View(view, params) {
    _basesettingsview.default.apply(this, arguments);
    this.progressContainer = view.querySelector('.progressContainer');
    this.itemProgressBarForeground = view.querySelector('.itemProgressBarForeground');
    this.progressDescription = view.querySelector('.progressDescription');
    view.querySelector('.premiereInfo').innerHTML = _globalize.default.translate('FeatureRequiresEmbyPremiere', '<a href="https://emby.media/premiere" data-preset="premiereinfo" is="emby-linkbutton" type="button" class="button-link">', '</a>');
    view.querySelector('.uploadServerList').addEventListener('change', function (e) {
      setUploadFoldersVisibility(view);

      // Disable default form submission
      e.preventDefault();
      return false;
    });
    view.querySelector('form').addEventListener('submit', function (e) {
      // Disable default form submission
      e.preventDefault();
      return false;
    });
    this.boundOnUploadProgress = onUploadProgress.bind(this);
  }
  Object.assign(View.prototype, _basesettingsview.default.prototype);
  View.prototype.onResume = function (options) {
    _basesettingsview.default.prototype.onResume.apply(this, arguments);
    _events.default.on(_servicelocator.cameraUpload, 'progress', this.boundOnUploadProgress);
    _servicelocator.cameraUpload.setProgressUpdatesEnabled(true);
    _servicelocator.cameraUpload.start();
  };
  View.prototype.loadSettingsInternal = function () {
    var instance = this;
    return loadForm(this.view).then(function () {
      instance.loadAutoSettings();
    });
  };
  View.prototype.onPause = function () {
    _basesettingsview.default.prototype.onPause.apply(this, arguments);
    if (this.boundOnUploadProgress) {
      _events.default.off(_servicelocator.cameraUpload, 'progress', this.boundOnUploadProgress);
    }
    _servicelocator.cameraUpload.setProgressUpdatesEnabled(false);
    _servicelocator.cameraUpload.start();
  };
  View.prototype.destroy = function () {
    _basesettingsview.default.prototype.destroy.apply(this, arguments);
    if (this.boundOnUploadProgress) {
      _events.default.off(_servicelocator.cameraUpload, 'progress', this.boundOnUploadProgress);
      this.boundOnUploadProgress = null;
    }
    this.progressContainer = null;
    this.itemProgressBarForeground = null;
    this.progressDescription = null;
  };
  var _default = _exports.default = View;
});
