define(["exports", "./../../emby-apiclient/connectionmanager.js", "./../../dom.js", "./../../layoutmanager.js", "./../../common/servicelocator.js", "./../../approuter.js"], function (_exports, _connectionmanager, _dom, _layoutmanager, _servicelocator, _approuter) {
  Object.defineProperty(_exports, "__esModule", {
    value: true
  });
  _exports.default = void 0;
  /* jshint module: true */

  require(['css!modules/emby-elements/emby-button/emby-button.css', 'css!!tv|modules/emby-elements/emby-button/emby-button_nontv.css', 'css!tv|modules/emby-elements/emby-button/emby-button_tv.css']);
  var EnableFocusTransfrom = _dom.default.allowFocusScaling();
  function openPremiumInfo() {
    Emby.importModule('./modules/registrationservices/registrationservices.js').then(function (registrationServices) {
      registrationServices.showPremiereInfo();
    });
  }
  function showPremiereInfo() {
    Emby.importModule('./modules/registrationservices/registrationservices.js').then(function (registrationServices) {
      registrationServices.validateFeature('themes', {
        viewOnly: true,
        showDialog: true
      }).then(showPremiereInfoToPremiereUser);
    });
  }
  function showPremiereInfoToPremiereUser() {
    _connectionmanager.default.currentApiClient().getCurrentUser().then(function (user) {
      if (user.Policy.IsAdministrator && _approuter.default.getRouteInfo('/embypremiere')) {
        _approuter.default.show('embypremiere');
      } else {
        openPremiumInfo();
      }
    });
  }
  function openUrlWithShell(url) {
    _servicelocator.shell.openUrl(url);
  }
  function onAnchorClick(e) {
    var href = this.getAttribute('href') || '';
    if (href === '#') {
      e.preventDefault();
      if (this.getAttribute('data-preset') === 'premiereinfo') {
        showPremiereInfo();
      }
    } else {
      if (this.getAttribute('target')) {
        if (href.indexOf('emby.media/premiere') !== -1 && !_servicelocator.appHost.supports('externalpremium')) {
          e.preventDefault();
          openPremiumInfo();
        } else if (!_servicelocator.appHost.supports('targetblank') || _servicelocator.appHost.supports('shellopenurl')) {
          e.preventDefault();
          openUrlWithShell(href);
        }
      } else {
        _approuter.default.handleAnchorClick(e);
      }
    }
  }
  function onInit() {
    var elem = this;
    if (elem.hasInit) {
      return;
    }
    elem.hasInit = true;
    var classList = this.classList;
    classList.add('emby-button');
    if (_dom.default.allowBackdropFilter() && !classList.contains('nobackdropfilter')) {
      if (classList.contains('raised')) {
        classList.add('raised-backdropfilter');
      } else if (classList.contains('fab')) {
        classList.add('fab-backdropfilter');
      }
    }
    if (EnableFocusTransfrom && this.getAttribute('data-focusscale') !== 'false') {
      classList.add('emby-button-focusscale');

      // todo: make this check more generic with a data attribute
    }
  }
  var EmbyButton = /*#__PURE__*/function (_HTMLButtonElement) {
    function EmbyButton() {
      var _this;
      // address the upgraded instance and use it
      var self = _this = _HTMLButtonElement.call(this) || this;
      onInit.call(self);
      return babelHelpers.possibleConstructorReturn(_this, self);
    }
    babelHelpers.inherits(EmbyButton, _HTMLButtonElement);
    return babelHelpers.createClass(EmbyButton, [{
      key: "connectedCallback",
      value: function connectedCallback() {
        onInit.call(this);
      }
    }, {
      key: "disconnectedCallback",
      value: function disconnectedCallback() {}
    }]);
  }(/*#__PURE__*/babelHelpers.wrapNativeSuper(HTMLButtonElement));
  customElements.define('emby-button', EmbyButton, {
    extends: 'button'
  });
  var EmbyAnchor = /*#__PURE__*/function (_HTMLAnchorElement) {
    function EmbyAnchor() {
      var _this2;
      // address the upgraded instance and use it
      var self = _this2 = _HTMLAnchorElement.call(this) || this;
      onInit.call(self);
      return babelHelpers.possibleConstructorReturn(_this2, self);
    }
    babelHelpers.inherits(EmbyAnchor, _HTMLAnchorElement);
    return babelHelpers.createClass(EmbyAnchor, [{
      key: "connectedCallback",
      value: function connectedCallback() {
        onInit.call(this);
        _dom.default.removeEventListener(this, 'click', onAnchorClick, {});
        _dom.default.addEventListener(this, 'click', onAnchorClick, {});
        if (this.getAttribute('data-autohide') === 'true') {
          if (_servicelocator.appHost.supports('externallinks') && (_servicelocator.appHost.supports('externalappinfo') || this.getAttribute('data-externalappinfo') !== 'true')) {
            this.classList.remove('hide');
          } else {
            this.classList.add('hide');
          }
        }
      }
    }, {
      key: "disconnectedCallback",
      value: function disconnectedCallback() {
        _dom.default.removeEventListener(this, 'click', onAnchorClick, {});
      }
    }]);
  }(/*#__PURE__*/babelHelpers.wrapNativeSuper(HTMLAnchorElement));
  customElements.define('emby-linkbutton', EmbyAnchor, {
    extends: 'a'
  });
  var EmbySectionTitle = /*#__PURE__*/function (_EmbyAnchor) {
    function EmbySectionTitle() {
      var _this3;
      // address the upgraded instance and use it
      var self = _this3 = _EmbyAnchor.call(this) || this;
      return babelHelpers.possibleConstructorReturn(_this3, self);
    }
    babelHelpers.inherits(EmbySectionTitle, _EmbyAnchor);
    return babelHelpers.createClass(EmbySectionTitle, [{
      key: "addSeeAllButton",
      value: function addSeeAllButton() {
        var _this$querySelector;
        if (_layoutmanager.default.tv) {
          return;
        }
        if (this.querySelector('.sectionTitleMoreIcon')) {
          return;
        }
        var elem = document.createElement('i');
        elem.classList.add('md-icon', 'sectionTitleMoreIcon', 'secondaryText');
        elem.innerHTML = '&#xe5e1;';
        this.appendChild(elem);
        (_this$querySelector = this.querySelector('.sectionTitle')) == null || _this$querySelector.classList.add('sectionTitleText-withseeall');
      }
    }, {
      key: "connectedCallback",
      value: function connectedCallback() {
        EmbyAnchor.prototype.connectedCallback.call(this);
        this.addSeeAllButton();
      }
    }, {
      key: "disconnectedCallback",
      value: function disconnectedCallback() {
        EmbyAnchor.prototype.disconnectedCallback.call(this);
      }
    }]);
  }(EmbyAnchor);
  customElements.define('emby-sectiontitle', EmbySectionTitle, {
    extends: 'a'
  });
  var _default = _exports.default = EmbyButton;
});
