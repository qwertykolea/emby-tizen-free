define(["exports", "./../../dom.js", "./../emby-button/emby-button.js"], function (_exports, _dom, _embyButton) {
  Object.defineProperty(_exports, "__esModule", {
    value: true
  });
  _exports.default = void 0;
  /* jshint module: true */

  require(['css!modules/emby-elements/emby-collapse/emby-collapse.css']);
  function slideDownToShow(button, elem, animate) {
    elem.classList.remove('hide');
    elem.classList.add('expanded');
    elem.style.height = 'auto';
    if (animate) {
      var height = elem.offsetHeight + 'px';
      elem.style.height = '0';

      // trigger reflow
      void elem.offsetHeight;
      elem.style.height = height;
      setTimeout(function () {
        if (elem.classList.contains('expanded')) {
          elem.classList.remove('hide');
        } else {
          elem.classList.add('hide');
        }
        elem.style.height = 'auto';
      }, 400);
    }
    var icon = button.querySelector('i');
    //icon.innerHTML = 'expand_less';
    icon.classList.add('emby-collapse-expandIconExpanded');
    button.classList.remove('emby-collapsible-button-collapsed');
  }
  function slideUpToHide(button, elem) {
    elem.style.height = elem.offsetHeight + 'px';
    // trigger reflow
    void elem.offsetHeight;
    elem.classList.remove('expanded');
    elem.style.height = '0';
    setTimeout(function () {
      button.classList.add('emby-collapsible-button-collapsed');
      if (elem.classList.contains('expanded')) {
        elem.classList.remove('hide');
      } else {
        elem.classList.add('hide');
      }
    }, 400);
    var icon = button.querySelector('i');
    //icon.innerHTML = 'expand_more';
    icon.classList.remove('emby-collapse-expandIconExpanded');
  }
  function setState(button, expanded, animate) {
    var collapseContent = button.parentNode.querySelector('.collapseContent');
    collapseContent.expanded = expanded;
    if (expanded) {
      slideDownToShow(button, collapseContent, animate !== false);
    } else {
      slideUpToHide(button, collapseContent);
    }
  }
  function onButtonClick(e, animate) {
    var button = this;
    var collapseContent = button.parentNode.querySelector('.collapseContent');
    setState(button, collapseContent.expanded !== true, animate);
  }
  function onInit() {
    var elem = this;
    if (elem.hasInit) {
      return;
    }
    elem.hasInit = true;
  }
  function onButtonDragEnter(e) {
    var button = this;
    var collapseContent = button.parentNode.querySelector('.collapseContent');
    if (!collapseContent.expanded) {
      button.click();
    }
  }
  function _connectedCallback() {
    if (this.classList.contains('emby-collapse')) {
      return;
    }
    this.classList.add('emby-collapse');
    var collapseContent = this.querySelector('.collapseContent');
    if (collapseContent) {
      collapseContent.classList.add('hide');
    }
    var title = this.getAttribute('title');
    this.title = '';
    var headerClass = ((this.getAttribute('data-headerclass') || '') + ' emby-collapsible-title').trim();
    var buttonClass = ((this.getAttribute('data-buttonclass') || '') + ' emby-collapsible-button').trim();
    var expandIconClass = 'emby-collapse-expandIcon';
    if (document.dir === 'rtl') {
      expandIconClass += ' emby-collapse-expandIcon-rtl';
    }
    var iconClass = ((this.getAttribute('data-iconclass') || '') + ' md-icon ' + expandIconClass).trim();
    var html = '<button is="emby-button" type="button" on-click="toggleExpand" class="' + buttonClass + '"><h3 class="' + headerClass + '" title="' + title + '" aria-label="' + title + '">' + title + '</h3><i class="' + iconClass + '">expand_more</i></button>';
    this.insertAdjacentHTML('afterbegin', html);
    var button = this.querySelector('.emby-collapsible-button');
    button.addEventListener('click', onButtonClick);
    if (this.getAttribute('data-expanded') === 'true') {
      setState(button, true, false);
    } else {
      button.classList.add('emby-collapsible-button-collapsed');
    }
    _dom.default.addEventListener(button, 'dragenter', onButtonDragEnter, {
      passive: true
    });
  }
  var EmbyCollapse = /*#__PURE__*/function (_HTMLDivElement) {
    function EmbyCollapse() {
      var _this;
      // address the upgraded instance and use it
      var self = _this = _HTMLDivElement.call(this) || this;
      onInit.call(self);
      return babelHelpers.possibleConstructorReturn(_this, self);
    }
    babelHelpers.inherits(EmbyCollapse, _HTMLDivElement);
    return babelHelpers.createClass(EmbyCollapse, [{
      key: "expand",
      value: function expand() {
        var button = this.querySelector('.emby-collapsible-button');
        if (button) {
          setState(button, true, false);
        }
      }
    }, {
      key: "collapse",
      value: function collapse() {
        var button = this.querySelector('.emby-collapsible-button');
        if (button) {
          setState(button, false, false);
        }
      }
    }, {
      key: "connectedCallback",
      value: function connectedCallback() {
        onInit.call(this);
        _connectedCallback.call(this);
      }
    }]);
  }(/*#__PURE__*/babelHelpers.wrapNativeSuper(HTMLDivElement));
  customElements.define('emby-collapse', EmbyCollapse, {
    extends: 'div'
  });
  var _default = _exports.default = EmbyCollapse;
});
