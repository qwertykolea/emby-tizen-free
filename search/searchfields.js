define(["exports", "./../modules/emby-apiclient/connectionmanager.js", "./../modules/emby-apiclient/events.js", "./../modules/common/globalize.js", "./../modules/alphapicker/alphapicker.js", "./../modules/layoutmanager.js", "./../modules/emby-elements/emby-input/emby-input.js", "./../modules/emby-elements/emby-button/emby-button.js", "./../modules/common/servicelocator.js", "./../modules/approuter.js", "./../modules/focusmanager.js", "./../modules/dom.js"], function (_exports, _connectionmanager, _events, _globalize, _alphapicker, _layoutmanager, _embyInput, _embyButton, _servicelocator, _approuter, _focusmanager, _dom) {
  Object.defineProperty(_exports, "__esModule", {
    value: true
  });
  _exports.default = void 0;
  /* jshint module: true */

  require(['flexStyles', 'material-icons', 'css!search/searchfields.css', 'css!tv|search/searchfields_tv.css']);
  function loadSuggestions(instance, context, apiClient) {
    var options = {
      SortBy: "IsFavoriteOrLiked,Random",
      IncludeItemTypes: "Movie,Series,MusicArtist",
      Limit: 20,
      Recursive: true,
      ImageTypeLimit: 0,
      EnableImages: false,
      ParentId: instance.options.parentId,
      EnableTotalRecordCount: false
    };
    apiClient.getItems(apiClient.getCurrentUserId(), options).then(function (result) {
      if (instance.mode !== 'suggestions') {
        result.Items = [];
      }
      var html = result.Items.map(function (i) {
        var href = _approuter.default.getRouteUrl(i);
        var itemHtml = '<a is="emby-linkbutton" class="button-link block" style="padding:.25em 1em;" href="' + href + '">';
        itemHtml += i.Name;
        itemHtml += '</a>';
        return itemHtml;
      }).join('');
      var searchSuggestions = context.querySelector('.searchSuggestions');
      searchSuggestions.querySelector('.searchSuggestionsList').innerHTML = html;
      if (result.Items.length) {
        searchSuggestions.classList.remove('hide');
      } else {
        searchSuggestions.classList.add('hide');
      }
    });
  }
  function onSearchTimeout() {
    var instance = this;
    var value = instance.nextSearchValue;
    value = (value || '').trim();
    _events.default.trigger(instance, 'search', [value]);
    var context = instance.options.element;
    if (value || _layoutmanager.default.tv) {
      instance.mode = 'search';
      var searchSuggestions = context.querySelector('.searchSuggestions');
      if (searchSuggestions) {
        searchSuggestions.classList.add('hide');
      }
    } else {
      instance.mode = 'suggestions';
      var apiClient = _connectionmanager.default.getApiClient(instance.options.serverId);
      loadSuggestions(instance, context, apiClient);
    }
  }
  function triggerSearch(instance, value, immediate) {
    if (instance.searchTimeout) {
      clearTimeout(instance.searchTimeout);
    }
    instance.nextSearchValue = value;
    var delay = immediate ? 0 : 700;
    instance.searchTimeout = setTimeout(onSearchTimeout.bind(instance), delay);
  }
  function onAlphaValueClicked(e) {
    var value = e.detail.value;
    var searchFieldsInstance = this;
    var txtSearch = searchFieldsInstance.options.element.querySelector('.searchfields-txtSearch');
    if (value === 'backspace') {
      var val = txtSearch.value;
      txtSearch.value = val.length ? val.substring(0, val.length - 1) : '';
    } else {
      if (txtSearch.maxLength === -1 || txtSearch.value.length < txtSearch.maxLength) {
        txtSearch.value += value;
      }
    }
    txtSearch.dispatchEvent(new CustomEvent('input', {
      bubbles: true
    }));
  }
  function initAlphaPicker(alphaPickerElement, instance) {
    instance.alphaPicker = new _alphapicker.default({
      element: alphaPickerElement,
      mode: 'keyboard'
    });
    alphaPickerElement.addEventListener('alphavalueclicked', onAlphaValueClicked.bind(instance));
  }
  function onSearchInput(e) {
    var value = e.target.value;
    var searchFieldsInstance = this;
    triggerSearch(searchFieldsInstance, value);
  }
  function createSpeechRecognition(instance) {
    var recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.onresult = function (event) {
      var current = event.resultIndex || 0;
      var transcript = event.results[current][0].transcript;
      var txtSearch = instance.options.element.querySelector('.searchfields-txtSearch');
      txtSearch.value = transcript;
      triggerSearch(instance, transcript);
    };

    //recognition.onerror = function (err) {

    //    alert('onerror: ' + err.error);
    //};

    instance.speechRecognition = recognition;
    return recognition;
  }
  function onVoiceInputRequest(e) {
    var instance = this;
    _servicelocator.appHost.requestSpeechRecognitionPermission().then(function () {
      var recognition = instance.speechRecognition;
      if (recognition) {
        //recognition.abort();
      } else {
        try {
          recognition = createSpeechRecognition(instance);
        } catch (err) {
          console.error('error creating SpeechRecognition: ', err);
        }
      }
      try {
        recognition.start();
      } catch (err) {
        console.error('error starting SpeechRecognition: ', err);
      }
    }, function () {});
  }
  function alphanumeric(value) {
    var input = document.createElement('input');
    input.type = 'text';
    input.value = value;
    return input.value;
  }
  function onKeyDown(e) {
    var _this$options;
    if (e.ctrlKey) {
      return;
    }
    if (e.altKey) {
      return;
    }
    var key = e.key;
    if (e.shiftKey) {
      if (key === 'Shift') {
        return;
      }
    }
    var txtSearch = (_this$options = this.options) == null || (_this$options = _this$options.element) == null ? void 0 : _this$options.querySelector('.searchfields-txtSearch');
    if (!txtSearch) {
      return;
    }
    if (txtSearch.getAttribute('inputmode') !== 'none') {
      return;
    }
    if (key === 'Backspace') {
      txtSearch.value = txtSearch.value.substring(0, Math.max(0, txtSearch.value.length - 1));
      onSearchInput.call(this, {
        target: txtSearch,
        currentTarget: txtSearch
      });
      return;
    }
    var chr = key ? alphanumeric(key) : null;
    if (chr) {
      chr = chr.toString();
      if (chr.length === 1) {
        txtSearch.value += chr;
        onSearchInput.call(this, {
          target: txtSearch,
          currentTarget: txtSearch
        });
      }
    }
  }
  function embed(elem, instance, options) {
    return require(['text!search/searchfields.template.html']).then(function (responses) {
      elem.classList.add('searchFields');
      elem.innerHTML = _globalize.default.translateDocument(responses[0]);
      var txtSearch = elem.querySelector('.searchfields-txtSearch');
      var currentLanguage = (_globalize.default.getCurrentLocale() || '').toLowerCase();
      var useNativeKeyboard = !currentLanguage.startsWith('en') || _servicelocator.appHost.supports('searchwithnativekeyboard');
      if (!useNativeKeyboard) {
        if (_layoutmanager.default.tv) {
          // try to prevent tv devices from showing their native keyboards
          // do this everywhere because the text field doesn't have any focus style
          //if (browser.tv) {
          txtSearch.setAttribute('readonly', 'readonly');
          txtSearch.setAttribute('tabindex', '-1');
          //}

          txtSearch.setAttribute('virtualkeyboardpolicy', 'manual');
          txtSearch.setAttribute('inputmode', 'none');
        }
      }
      if (_layoutmanager.default.tv) {
        elem.querySelector('.searchFieldsSearchIcon').classList.remove('hide');
      }
      if (_layoutmanager.default.tv && !useNativeKeyboard) {
        var alphaPickerElement = elem.querySelector('.alphaPicker');
        elem.querySelector('.alphaPicker').classList.remove('hide');
        initAlphaPicker(alphaPickerElement, instance);
      }
      txtSearch.addEventListener('input', onSearchInput.bind(instance));
      if (options.value) {
        txtSearch.value = options.value;
        if (instance.firstLoad) {
          triggerSearch(instance, options.value, true);
        }
      }
      var btnVoiceInput = elem.querySelector('.btnVoiceInput');
      if (typeof SpeechRecognition !== 'undefined' && _servicelocator.appHost.supports('speechrecognition')) {
        btnVoiceInput.classList.remove('hide');
      }
      btnVoiceInput.addEventListener('click', onVoiceInputRequest.bind(instance));
      if (options.autoFocus !== false) {
        instance.focus();
      }
    });
  }
  function SearchFields(options) {
    this.keyDownHandler = onKeyDown.bind(this);
    this.options = options;
    embed(options.element, this, options);
  }
  SearchFields.prototype.getSearchTerm = function () {
    var txt = this.options.element.querySelector('.searchfields-txtSearch');
    if (!txt) {
      return null;
    }
    return txt.value || null;
  };
  SearchFields.prototype.setSearchTerm = function (value) {
    var txt = this.options.element.querySelector('.searchfields-txtSearch');
    if (!txt) {
      return;
    }
    if (value !== txt.value) {
      txt.value = value;
      triggerSearch(this, value, true);
    }
  };
  SearchFields.prototype.pause = function () {
    this.destroyVoiceInput();
    var keyDownHandler = this.keyDownHandler;
    if (keyDownHandler) {
      _dom.default.removeEventListener(window, 'keydown', keyDownHandler, {
        passive: true
      });
    }
  };
  SearchFields.prototype.resume = function (options) {
    var keyDownHandler = this.keyDownHandler;
    if (keyDownHandler) {
      _dom.default.addEventListener(window, 'keydown', keyDownHandler, {
        passive: true
      });
    }
    if (!this.firstLoad || options != null && options.refresh) {
      this.firstLoad = true;
      triggerSearch(this, this.getSearchTerm(), true);
    }
  };
  SearchFields.prototype.focus = function () {
    var txtSearch = this.options.element.querySelector('.searchfields-txtSearch');
    if (txtSearch.getAttribute('tabindex') === '-1') {
      _focusmanager.default.autoFocus(this.options.element.querySelector('.alphaPicker') || this.options.element);
    } else {
      _focusmanager.default.focus(txtSearch);
    }
  };
  SearchFields.prototype.destroyVoiceInput = function () {
    var recognition = this.speechRecognition;
    if (recognition) {
      this.speechRecognition = null;
      recognition.onresult = null;
      try {
        recognition.abort();
      } catch (err) {
        console.error('error aborting SpeechRecognition: ', err);
      }
    }
  };
  SearchFields.prototype.destroy = function () {
    this.destroyVoiceInput();
    var options = this.options;
    if (options) {
      options.element.classList.remove('searchFields');
    }
    this.options = null;
    var alphaPicker = this.alphaPicker;
    if (alphaPicker) {
      alphaPicker.destroy();
    }
    this.alphaPicker = null;
    var searchTimeout = this.searchTimeout;
    if (searchTimeout) {
      clearTimeout(searchTimeout);
    }
    this.searchTimeout = null;
    this.nextSearchValue = null;
    this.keyDownHandler = null;
  };
  var _default = _exports.default = SearchFields;
});
