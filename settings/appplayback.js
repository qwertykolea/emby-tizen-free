define(["exports", "./../modules/viewmanager/basesettingsview.js", "./../modules/emby-apiclient/connectionmanager.js", "./../modules/common/servicelocator.js", "./../modules/emby-elements/emby-scroller/emby-scroller.js", "./../modules/emby-elements/emby-select/emby-select.js", "./../modules/emby-elements/emby-button/emby-button.js", "./../modules/emby-elements/emby-input/emby-input.js", "./../modules/emby-elements/emby-toggle/emby-toggle.js", "./../modules/layoutmanager.js", "./../modules/common/appsettings.js", "./../modules/common/qualityoptions.js", "./../modules/browser.js", "./../modules/common/qualitydetection.js"], function (_exports, _basesettingsview, _connectionmanager, _servicelocator, _embyScroller, _embySelect, _embyButton, _embyInput, _embyToggle, _layoutmanager, _appsettings, _qualityoptions, _browser, _qualitydetection) {
  Object.defineProperty(_exports, "__esModule", {
    value: true
  });
  _exports.default = void 0;
  /* jshint module: true */

  function setMaxBitrateIntoField(select, networkType, mediatype) {
    var options = mediatype === 'Audio' ? _qualityoptions.default.getAudioQualityOptions({
      currentMaxBitrate: _appsettings.default.maxStreamingBitrate(networkType, mediatype),
      isAutomaticBitrateEnabled: _appsettings.default.enableAutomaticBitrateDetection(networkType, mediatype),
      enableAuto: true
    }) : _qualityoptions.default.getVideoQualityOptions({
      currentMaxBitrate: _appsettings.default.maxStreamingBitrate(networkType, mediatype),
      isAutomaticBitrateEnabled: _appsettings.default.enableAutomaticBitrateDetection(networkType, mediatype),
      enableAuto: true
    });
    select.innerHTML = options.map(function (i) {
      // render empty string instead of 0 for the auto option
      return '<option value="' + (i.bitrate || '') + '">' + i.name + '</option>';
    }).join('');
    if (_appsettings.default.enableAutomaticBitrateDetection(networkType, mediatype)) {
      select.value = '';
    } else {
      select.value = _appsettings.default.maxStreamingBitrate(networkType, mediatype);
    }
  }
  function fillChromecastQuality(select) {
    var options = _qualityoptions.default.getVideoQualityOptions({
      currentMaxBitrate: _appsettings.default.maxChromecastBitrate(),
      isAutomaticBitrateEnabled: !_appsettings.default.maxChromecastBitrate(),
      enableAuto: true
    });
    select.innerHTML = options.map(function (i) {
      // render empty string instead of 0 for the auto option
      return '<option value="' + (i.bitrate || '') + '">' + i.name + '</option>';
    }).join('');
  }
  function setMaxBitrateFromField(select, networkType, mediatype) {
    if (select.value) {
      _appsettings.default.maxStreamingBitrate(networkType, mediatype, select.value);
      _appsettings.default.enableAutomaticBitrateDetection(networkType, mediatype, false);
    } else {
      _appsettings.default.enableAutomaticBitrateDetection(networkType, mediatype, true);
    }
  }
  function supportsCellularQuality() {
    return _qualitydetection.default.supportsConnectionTypeDetection();
  }
  function showHideAudioSection(context) {
    var section = context.querySelector('.audioSection');
    if (section.querySelector('.fieldset-field:not(.hide)')) {
      section.classList.remove('hide');
    } else {
      section.classList.add('hide');
    }
  }
  function showHideFields(context) {
    var _screen$orientation;
    if (!_layoutmanager.default.tv && !_browser.default.tv && (_screen$orientation = screen.orientation) != null && _screen$orientation.lock) {
      context.querySelector('.fldOrientationLock').classList.remove('hide');
    } else {
      context.querySelector('.fldOrientationLock').classList.add('hide');
    }
    if (supportsCellularQuality()) {
      context.querySelector('.fldVideoCellularQuality').classList.remove('hide');
      context.querySelector('.musicCellularQualitySection').classList.remove('hide');
    } else {
      context.querySelector('.fldVideoCellularQuality').classList.add('hide');
      context.querySelector('.musicCellularQualitySection').classList.add('hide');
    }
    if (_servicelocator.appHost.supports('multiserver')) {
      context.querySelector('.fldVideoInNetworkQuality').classList.remove('hide');
      context.querySelector('.fldVideoInternetQuality').classList.remove('hide');
      if (supportsCellularQuality()) {
        context.querySelector('.fldVideoCellularQuality').classList.remove('hide');
      } else {
        context.querySelector('.fldVideoCellularQuality').classList.add('hide');
      }
      context.querySelector('.fldAudioInternetQuality').classList.remove('hide');
      if (supportsCellularQuality()) {
        context.querySelector('.musicCellularQualitySection').classList.remove('hide');
      } else {
        context.querySelector('.musicCellularQualitySection').classList.add('hide');
      }
      showHideAudioSection(context);
      return;
    }
    _connectionmanager.default.currentApiClient().getEndpointInfo().then(function (endpointInfo) {
      if (endpointInfo.IsInNetwork) {
        context.querySelector('.fldVideoInNetworkQuality').classList.remove('hide');
        context.querySelector('.fldVideoInternetQuality').classList.add('hide');
        context.querySelector('.fldVideoCellularQuality').classList.add('hide');
        context.querySelector('.fldAudioInternetQuality').classList.add('hide');
        context.querySelector('.musicCellularQualitySection').classList.add('hide');
      } else {
        context.querySelector('.fldVideoInNetworkQuality').classList.add('hide');
        context.querySelector('.fldVideoInternetQuality').classList.remove('hide');
        if (supportsCellularQuality()) {
          context.querySelector('.fldVideoCellularQuality').classList.remove('hide');
        } else {
          context.querySelector('.fldVideoCellularQuality').classList.add('hide');
        }
        context.querySelector('.fldAudioInternetQuality').classList.remove('hide');
        if (supportsCellularQuality()) {
          context.querySelector('.musicCellularQualitySection').classList.remove('hide');
        } else {
          context.querySelector('.musicCellularQualitySection').classList.add('hide');
        }
      }
      showHideAudioSection(context);
    });
  }
  function onSubmit(e) {
    // Disable default form submission
    e.preventDefault();
    return false;
  }
  function loadData(options) {
    var context = options.element;
    showHideFields(context);
    fillChromecastQuality(context.querySelector('.selectChromecastVideoQuality'));
    return Promise.resolve();
  }
  function View(view, params) {
    _basesettingsview.default.apply(this, arguments);
    var options = {
      element: view.querySelector('.settingsContainer')
    };
    this.settingsOptions = options;
    options.element.querySelector('form').addEventListener('submit', onSubmit.bind(options));
  }
  Object.assign(View.prototype, _basesettingsview.default.prototype);
  View.prototype.loadSettingsInternal = function () {
    var instance = this;
    return loadData(instance.settingsOptions).then(function () {
      return instance.loadAutoSettings();
    });
  };
  View.prototype.loadAutoSetting = function (elem) {
    if (elem.classList.contains('selectVideoInNetworkQuality')) {
      setMaxBitrateIntoField(elem, 'lan', 'Video');
      return;
    }
    if (elem.classList.contains('selectVideoInternetQuality')) {
      setMaxBitrateIntoField(elem, 'wan', 'Video');
      return;
    }
    if (elem.classList.contains('selectVideoCellularQuality')) {
      setMaxBitrateIntoField(elem, 'cellular', 'Video');
      return;
    }
    if (elem.classList.contains('selectMusicInternetQuality')) {
      setMaxBitrateIntoField(elem, 'wan', 'Audio');
      return;
    }
    if (elem.classList.contains('selectMusicCellularQuality')) {
      setMaxBitrateIntoField(elem, 'cellular', 'Audio');
      return;
    }
    return _basesettingsview.default.prototype.loadAutoSetting.apply(this, arguments);
  };
  View.prototype.getSettingValueFromOwner = function (elem, owner, memberInfo) {
    switch (memberInfo.member) {
      case 'enableVideoUnderUI':
        return _basesettingsview.default.prototype.getSettingValueFromOwner.apply(this, arguments) ? 'play' : 'stop';
      default:
        return _basesettingsview.default.prototype.getSettingValueFromOwner.apply(this, arguments);
    }
  };
  View.prototype.saveAutoSettingIntoOwner = function (elem, owner, memberInfo, value) {
    if (memberInfo.member === 'enableVideoUnderUI') {
      value = value === 'play';
      return _basesettingsview.default.prototype.saveAutoSettingIntoOwner.call(this, elem, owner, memberInfo, value);
    }
    if (memberInfo.member === 'selectVideoInNetworkQuality') {
      setMaxBitrateFromField(elem, 'lan', 'Video');
      return Promise.resolve();
    }
    if (memberInfo.member === 'selectVideoInternetQuality') {
      setMaxBitrateFromField(elem, 'wan', 'Video');
      return Promise.resolve();
    }
    if (memberInfo.member === 'selectVideoCellularQuality') {
      setMaxBitrateFromField(elem, 'cellular', 'Video');
      return Promise.resolve();
    }
    if (memberInfo.member === 'selectMusicInternetQuality') {
      setMaxBitrateFromField(elem, 'wan', 'Audio');
      return Promise.resolve();
    }
    if (memberInfo.member === 'selectMusicCellularQuality') {
      setMaxBitrateFromField(elem, 'cellular', 'Audio');
      return Promise.resolve();
    }
    return _basesettingsview.default.prototype.saveAutoSettingIntoOwner.apply(this, arguments);
  };
  View.prototype.destroy = function () {
    _basesettingsview.default.prototype.destroy.apply(this, arguments);
    this.settingsOptions = null;
  };
  var _default = _exports.default = View;
});
