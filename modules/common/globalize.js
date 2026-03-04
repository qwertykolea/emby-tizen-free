define(["exports", "./../emby-apiclient/events.js", "./../emby-apiclient/connectionmanager.js", "./appsettings.js"], function (_exports, _events, _connectionmanager, _appsettings) {
  Object.defineProperty(_exports, "__esModule", {
    value: true
  });
  _exports.default = void 0;
  /* jshint module: true */

  var allTranslations = {};
  var currentCulture;
  var currentDateTimeCulture;
  var currentLocales;
  var allStrings = {};
  var rtlLocales = [
  //'en-us',
  'ar', 'he', 'fa', 'ur', 'ug'];
  var arabicLocales = ['ar', 'fa', 'ur', 'ug'];
  function getCurrentLocale() {
    return currentCulture;
  }
  function getCurrentDateTimeLocale() {
    return currentDateTimeCulture;
  }
  function getCurrentLocales() {
    return currentLocales;
  }
  function normalizeNavigatorLanguage(lang) {
    if (lang) {
      // seeing en-us@posix on a chromecast receiver

      lang = lang.split('@')[0];
    }
    return lang;
  }
  function getDefaultLanguage() {
    var culture = typeof document === 'undefined' ? null : document.documentElement.getAttribute('data-culture');
    if (culture) {
      return culture;
    }
    if (navigator.language) {
      return normalizeNavigatorLanguage(navigator.language);
    }
    if (navigator.userLanguage) {
      return normalizeNavigatorLanguage(navigator.userLanguage);
    }
    if (navigator.languages && navigator.languages.length) {
      return normalizeNavigatorLanguage(navigator.languages[0]);
    }
    return 'en-us';
  }
  function updateCurrentCulture() {
    var culture = _appsettings.default.language() || getDefaultLanguage();
    if (typeof document !== 'undefined') {
      if (CSS.supports('text-align', 'start') && CSS.supports('inset-inline-start', '0')) {
        var dir = rtlLocales.includes((culture || '').toLowerCase()) ? 'rtl' : 'ltr';
        document.dir = dir;
        if (dir === 'rtl') {
          document.documentElement.classList.add('rtl');
        } else {
          document.documentElement.classList.remove('rtl');
        }
        if (arabicLocales.includes((culture || '').toLowerCase())) {
          document.documentElement.classList.add('rtl-arabic');
        } else {
          document.documentElement.classList.remove('rtl-arabic');
        }
      }
    }
    currentCulture = normalizeLocaleName(culture);
    currentLocales = [currentCulture];
    var dateTimeCulture;
    try {
      dateTimeCulture = _appsettings.default.dateTimeLocale();
    } catch (err) {}
    if (dateTimeCulture) {
      currentDateTimeCulture = normalizeLocaleName(dateTimeCulture);
    } else {
      currentDateTimeCulture = currentCulture;
    }
    ensureTranslations(currentCulture);
    _connectionmanager.default.setCurrentLocale(currentCulture);
  }
  function ensureTranslations(culture) {
    for (var i in allTranslations) {
      ensureTranslation(allTranslations[i], culture);
    }
  }
  function ensureTranslation(translationInfo, culture) {
    if (translationInfo.dictionaries[culture]) {
      return Promise.resolve();
    }
    return loadTranslation(translationInfo.translations, culture).then(function (dictionary) {
      translationInfo.dictionaries[culture] = true;
      if (dictionary) {
        if (allStrings[culture]) {
          allStrings[culture] = Object.assign(dictionary, allStrings[culture] || {});
        } else {
          allStrings[culture] = dictionary;
        }
      }
    });
  }
  function normalizeLocaleName(culture) {
    culture = culture.replace('_', '-');

    // If it's de-DE, convert to just de
    var parts = culture.split('-');
    if (parts.length === 2) {
      if (parts[0].toLowerCase() === parts[1].toLowerCase()) {
        culture = parts[0].toLowerCase();
      }
    }
    var lower = culture.toLowerCase();
    if (lower === 'ca-es') {
      return 'ca';
    }

    // normalize Swedish
    if (lower === 'sv-se') {
      return 'sv';
    }
    return lower;
  }
  function getDictionary() {
    return allStrings[getCurrentLocale()];
  }
  function register(options) {
    allTranslations[options.name] = {
      translations: options.strings || options.translations,
      dictionaries: {}
    };
  }
  function loadStrings(options) {
    var locale = getCurrentLocale();
    if (typeof options === 'string') {
      return ensureTranslation(allTranslations[options], locale);
    } else {
      register(options);
      return ensureTranslation(allTranslations[options.name], locale);
    }
  }
  var cacheParam;
  function setCacheParam(value) {
    cacheParam = value;
  }
  function loadJsonFromUrlWithFetch(url) {
    return fetch(url).then(function (response) {
      return response.json();
    });
  }
  function loadJsonFromUrlWithXmlHttpRequest(url) {
    return new Promise(function (resolve, reject) {
      var xhr = new XMLHttpRequest();
      xhr.open('GET', url, true);
      xhr.onload = function (e) {
        if (this.status < 400) {
          resolve(JSON.parse(this.response));
        } else {
          resolve();
        }
      };
      xhr.onerror = function () {
        resolve();
      };
      xhr.send();
    });
  }
  function loadTranslation(translations, lang) {
    lang = normalizeLocaleName(lang);
    var filtered = translations.filter(function (t) {
      return normalizeLocaleName(t.lang) === lang;
    });
    if (!filtered.length) {
      filtered = translations.filter(function (t) {
        return normalizeLocaleName(t.lang) === 'en-us';
      });
    }
    if (!filtered.length) {
      return Promise.resolve();
    }
    var url = filtered[0].path;
    if (cacheParam) {
      url += url.indexOf('?') === -1 ? '?' : '&';
      url += cacheParam;
    }
    if (typeof XMLHttpRequest !== 'undefined') {
      return loadJsonFromUrlWithXmlHttpRequest(url);
    }
    return loadJsonFromUrlWithFetch(url);
  }
  function translateKey(key) {
    var dictionary = getDictionary();
    if (dictionary) {
      var result = dictionary[key];
      if (result) {
        return result;
      }
    }
    return key;
  }
  function translate(key) {
    var val = translateKey(key);
    for (var i = 1; i < arguments.length; i++) {
      val = val.replaceAll('{' + (i - 1) + '}', arguments[i]);
    }
    return val;
  }
  function translateHtml(html) {
    var startIndex = html.indexOf('${');
    if (startIndex === -1) {
      return html;
    }
    startIndex += 2;
    var endIndex = html.indexOf('}', startIndex);
    if (endIndex === -1) {
      return html;
    }
    var key = html.substring(startIndex, endIndex);
    var val = translateKey(key);
    html = html.replace('${' + key + '}', val);
    return translateHtml(html);
  }
  updateCurrentCulture();
  _events.default.on(_connectionmanager.default, 'localusersignedin', updateCurrentCulture);
  _events.default.on(_appsettings.default, 'change', function (e, name) {
    switch (name) {
      case 'language':
      case 'datetimelocale':
        updateCurrentCulture();
        break;
      default:
        break;
    }
  });
  var _default = _exports.default = {
    getString: translate,
    translate: translate,
    translateDocument: translateHtml,
    translateHtml: translateHtml,
    loadStrings: loadStrings,
    getCurrentLocale: getCurrentLocale,
    getCurrentDateTimeLocale: getCurrentDateTimeLocale,
    getCurrentLocales: getCurrentLocales,
    register: register,
    setCacheParam: setCacheParam
  };
});
