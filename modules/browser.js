define(["exports"], function (_exports) {
  Object.defineProperty(_exports, "__esModule", {
    value: true
  });
  _exports.default = void 0;
  var _navigator$platform;
  /* jshint module: true */

  function isTv(userAgent) {
    // This is going to be really difficult to get right
    userAgent = userAgent.toLowerCase();
    if (userAgent.includes('tv')) {
      return true;
    }
    if (userAgent.includes('viera')) {
      return true;
    }
    if (userAgent.includes('web0s')) {
      return true;
    }
    if (userAgent.includes('zidoo')) {
      return true;
    }
    return false;
  }
  function tizenVersion() {
    if (typeof tizen !== 'undefined' && tizen.systeminfo) {
      var v = tizen.systeminfo.getCapability('http://tizen.org/feature/platform.version');
      return parseFloat(v);
    }
  }
  function isXbox(userAgentLower) {
    if (userAgentLower.includes('xbox')) {
      return true;
    }
    return false;
  }
  function isMobile(userAgent) {
    var lower = userAgent.toLowerCase();
    if (lower.includes('android tv')) {
      return false;
    }
    var terms = ['mobi', 'ipad', 'iphone', 'ipod', 'silk', 'kindle fire', 'opera mini'];
    for (var i = 0, length = terms.length; i < length; i++) {
      if (lower.includes(terms[i])) {
        return true;
      }
    }

    // assume coarse input if touch events are supported
    return typeof document !== 'undefined' && 'ontouchstart' in document.documentElement;
  }
  function polyfillBrands(userAgentData, browser) {
    var brands = userAgentData.brands;
    if (!brands) {
      brands = [];
      userAgentData.brands = brands;
    }
    if (brands.length) {
      return;
    }
    var deviceName;
    if (browser.edg) {
      deviceName = "Edge";
    } else if (browser.opera) {
      deviceName = "Opera";
    } else if (browser.chrome) {
      deviceName = "Chrome";
    } else if (browser.firefox) {
      deviceName = "Firefox";
    } else if (browser.safari) {
      deviceName = "Safari";
    } else {
      deviceName = "Web Browser";
    }
    try {
      brands.push({
        brand: deviceName
      });
    } catch (err) {
      console.error('error adding brands: ', err);
    }
    if (browser.chrome) {
      try {
        brands.push({
          brand: 'Chromium'
        });
      } catch (err) {
        console.error('error adding brands: ', err);
      }
    }
  }
  function getHighEntropyValues() {
    var browser = this;
    var info = {};
    if (browser.android) {
      info.platform = 'Android';
    } else if (browser.iOS) {
      info.platform = 'iOS';
    } else if (browser.ipad) {
      info.platform = 'iPadOS';
    } else if (browser.osx) {
      info.platform = 'macOS';
    } else if (browser.xboxOne) {
      info.platform = 'Xbox One';
    } else if (browser.windows) {
      info.platform = 'Windows';
    } else if (browser.playstation) {
      info.platform = 'PlayStation';
    } else if (browser.netcast) {
      info.platform = 'LG TV';
    } else if (browser.tizen) {
      info.platform = 'Samsung TV';
    } else if (browser.operaTv) {
      info.platform = 'Opera TV';
    }
    return Promise.resolve(info);
  }
  function polyfilUserAgentData(browser, userAgent) {
    var userAgentData = navigator.userAgentData;
    if (!userAgentData) {
      userAgentData = {};
      navigator.userAgentData = userAgentData;
    }
    if (userAgentData.mobile == null) {
      try {
        userAgentData.mobile = isMobile(userAgent);
      } catch (err) {
        console.error('error setting userAgentData.mobile: ', err);
      }
    }
    polyfillBrands(userAgentData, browser);
    if (!userAgentData.getHighEntropyValues) {
      userAgentData.getHighEntropyValues = getHighEntropyValues.bind(browser);
    }
  }
  var userAgent = navigator.userAgent;
  var browser = {};
  var userAgentLower = userAgent.toLowerCase();
  if (/(edg)[ \/]([\w.]+)/.exec(userAgentLower)) {
    browser.edg = true;
  } else if (/(opera)[ \/]([\w.]+)/.exec(userAgentLower) || /(opr)[ \/]([\w.]+)/.exec(userAgentLower)) {
    browser.opera = true;
  } else if (/(firefox)[ \/]([\w.]+)/.exec(userAgentLower)) {
    browser.firefox = true;
  }
  if (!browser.firefox) {
    if (/(chrome)[ \/]([\w.]+)/.exec(userAgentLower)) {
      browser.chrome = true;
    } else if (/(safari)[ \/]([\w.]+)/.exec(userAgentLower) || userAgentLower.includes("webkit")) {
      browser.safari = true;
    }
  }
  if (userAgentLower.includes("playstation")) {
    browser.playstation = true;
    browser.tv = true;
    if (userAgentLower.includes("playstation 4")) {
      browser.ps4 = true;
    }
  }
  browser.xboxOne = isXbox(userAgentLower);
  browser.tizen = userAgentLower.includes('tizen') || globalThis.tizen != null;
  browser.netcast = userAgentLower.includes('netcast') || userAgentLower.includes('Web0S'.toLowerCase());
  browser.electron = userAgentLower.includes('electron');
  browser.windows = userAgentLower.includes('windows');
  browser.android = userAgentLower.includes('android');
  if (browser.tizen) {
    browser.sdkVersion = tizenVersion();
  }
  browser.tv = isTv(userAgent);
  if (browser.tv && userAgentLower.includes('opr/') || globalThis.location && (globalThis.location.href || '').toString().toLowerCase().includes('operatv')) {
    browser.tv = true;
    browser.operaTv = true;
  }

  // smarthub is for orsay
  if (browser.xboxOne || browser.playstation || browser.tizen || browser.netcast || browser.operaTv || userAgentLower.includes('smarthub') || userAgentLower.includes('smarttv') || userAgentLower.includes('tv/')) {
    browser.tv = true;
  }
  var platform = ((_navigator$platform = navigator.platform) == null ? void 0 : _navigator$platform.toLowerCase()) || '';
  browser.iOS = userAgentLower.includes('ipad') || userAgentLower.includes('iphone') || userAgentLower.includes('ipod touch') || platform === "iphone" || platform.startsWith('mac') && navigator.maxTouchPoints > 1;
  if (!browser.iOS) {
    // need the mac in there to avoid false detections, e.g. chrome os: cr os x64
    browser.osx = userAgentLower.includes('mac os x') || platform.startsWith('mac');
  }
  browser.chromecast = browser.chrome && userAgentLower.includes('crkey');
  polyfilUserAgentData(browser, userAgent);
  var _default = _exports.default = browser;
});
