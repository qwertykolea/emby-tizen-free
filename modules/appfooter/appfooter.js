define(["exports", "./../dom.js", "./../emby-apiclient/events.js", "./../common/appsettings.js"], function (_exports, _dom, _events, _appsettings) {
  Object.defineProperty(_exports, "__esModule", {
    value: true
  });
  _exports.default = void 0;
  /* jshint module: true */

  require(['css!modules/appfooter/appfooter.css']);
  function render() {
    var elem = document.createElement('div');
    elem.classList.add('appfooter');
    if (_dom.default.allowBackdropFilter()) {
      elem.classList.add('appfooter-withbackdropfilter');
    }
    document.body.appendChild(elem);
    return elem;
  }
  function setRtlClasses(instance) {
    if (document.dir === 'rtl') {
      instance.element.classList.add('appFooter-rtl');
    } else {
      instance.element.classList.remove('appFooter-rtl');
    }
  }
  function AppFooter() {
    var _this = this;
    this.element = render();
    setRtlClasses(this);
    _events.default.on(_appsettings.default, 'change', function (e, name) {
      if (name === 'language') {
        setRtlClasses(_this);
      }
    });
  }
  AppFooter.prototype.add = function (elem) {
    if (typeof elem === 'string') {
      this.element.insertAdjacentHTML('beforeend', elem);
    } else {
      this.element.appendChild(elem);
    }
  };
  AppFooter.prototype.insert = function (elem) {
    var thisElement = this.element;
    if (typeof elem === 'string') {
      thisElement.insertAdjacentHTML('afterbegin', elem);
    } else {
      thisElement.insertBefore(elem, thisElement.firstChild);
    }
  };
  AppFooter.prototype.setWithContent = function (withContent) {
    var thisElement = this.element;
    if (withContent) {
      thisElement.classList.add('appfooter-withContent');
    } else {
      thisElement.classList.remove('appfooter-withContent');
    }
  };
  AppFooter.prototype.setWithContent50w = function (withContent) {
    var thisElement = this.element;
    if (withContent) {
      thisElement.classList.add('appfooter-withContent50w');
    } else {
      thisElement.classList.remove('appfooter-withContent50w');
    }
  };
  AppFooter.prototype.destroy = function () {
    var self = this;
    self.element = null;
  };
  var _default = _exports.default = new AppFooter();
});
