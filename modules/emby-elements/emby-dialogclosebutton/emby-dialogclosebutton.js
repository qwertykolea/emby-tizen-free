define(["exports", "./../../layoutmanager.js", "./../../dialoghelper/dialoghelper.js", "./../../common/globalize.js", "./../../dom.js"], function (_exports, _layoutmanager, _dialoghelper, _globalize, _dom) {
  Object.defineProperty(_exports, "__esModule", {
    value: true
  });
  _exports.default = void 0;
  /* jshint module: true */

  require(['css!modules/emby-elements/emby-dialogclosebutton/emby-dialogclosebutton.css', 'css!!tv|modules/emby-elements/emby-dialogclosebutton/emby-dialogclosebutton_nontv.css']);
  function getInnerHtml(instance) {
    var html = '';
    if (_layoutmanager.default.tv || instance.getAttribute('closetype') !== 'done') {
      html += '<i class="md-icon">&#xe5cd;</i>';
      return html;
    }
    html += '<i class="md-icon hidetouch">&#xe5cd;</i>';
    html += '<span class="dialogCloseButton-text color-accent hidepointerfine">' + _globalize.default.translate('Done') + '</span>';
    return html;
  }
  function onInit() {
    var elem = this;
    if (elem.hasInit) {
      return;
    }
    elem.hasInit = true;
    var instance = this;
    this.classList.add('dialogCloseButton', 'hide-mouse-idle-tv', 'dialogHeaderButton', 'paper-icon-button-light');
    this.setAttribute('tabindex', '-1');
    var header = this.closest('.formDialogHeader');
    var headerIsCentered = header == null ? void 0 : header.classList.contains('justify-content-center');
    if (headerIsCentered) {
      this.classList.add('dialogCloseButton-positionstart');
    }
    if (this.getAttribute('closetype') === 'done') {
      this.classList.add('dialogCloseButton-autoright');
    }
    if (this.getAttribute('data-blur') === 'true') {
      this.classList.add('paper-icon-button-light-blur');
      if (_dom.default.allowBackdropFilter()) {
        this.classList.add('paper-icon-button-light-blur-bf');
      }
    }
    this.addEventListener('click', onClick);
    instance.innerHTML = getInnerHtml(instance);
  }
  function onClick() {
    var dlg = this.closest('.dialog');
    if (dlg) {
      _dialoghelper.default.close(dlg);
    }
  }
  var EmbyDialogCloseButton = /*#__PURE__*/function (_HTMLButtonElement) {
    function EmbyDialogCloseButton() {
      var _this;
      // address the upgraded instance and use it
      var self = _this = _HTMLButtonElement.call(this) || this;
      onInit.call(self);
      return babelHelpers.possibleConstructorReturn(_this, self);
    }
    babelHelpers.inherits(EmbyDialogCloseButton, _HTMLButtonElement);
    return babelHelpers.createClass(EmbyDialogCloseButton, [{
      key: "connectedCallback",
      value: function connectedCallback() {
        onInit.call(this);
      }
    }, {
      key: "disconnectedCallback",
      value: function disconnectedCallback() {
        var observer = this.observer;
        if (observer) {
          // later, you can stop observing
          observer.disconnect();
          this.observer = null;
        }
      }
    }]);
  }(/*#__PURE__*/babelHelpers.wrapNativeSuper(HTMLButtonElement));
  customElements.define('emby-dialogclosebutton', EmbyDialogCloseButton, {
    extends: 'button'
  });
  var _default = _exports.default = EmbyDialogCloseButton;
});
