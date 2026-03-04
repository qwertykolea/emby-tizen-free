define(["exports"], function (_exports) {
  Object.defineProperty(_exports, "__esModule", {
    value: true
  });
  _exports.default = void 0;
  /* jshint module: true */

  require(['css!modules/emby-elements/emby-progressring/emby-progressring.css']);
  function getInnerHtml() {
    return "<div class=\"progressring-bg\">\n    <div class=\"progressring-text\"></div>\n</div>\n<div class=\"spiner-holder-one animate-0-25-a\">\n    <div class=\"spiner-holder-two animate-0-25-b\">\n        <div class=\"progressring-spiner\"></div>\n    </div>\n</div>\n<div class=\"spiner-holder-one animate-25-50-a\">\n    <div class=\"spiner-holder-two animate-25-50-b\">\n        <div class=\"progressring-spiner\"></div>\n    </div>\n</div>\n<div class=\"spiner-holder-one animate-50-75-a\">\n    <div class=\"spiner-holder-two animate-50-75-b\">\n        <div class=\"progressring-spiner\"></div>\n    </div>\n</div>\n<div class=\"spiner-holder-one animate-75-100-a\">\n    <div class=\"spiner-holder-two animate-75-100-b\">\n        <div class=\"progressring-spiner\"></div>\n    </div>\n</div>";
  }
  function onInit() {
    var elem = this;
    if (elem.hasInit) {
      return;
    }
    elem.hasInit = true;
    this.classList.add('progressring');
    var instance = this;
    instance.innerHTML = getInnerHtml();

    //if (window.MutationObserver) {
    //    // create an observer instance
    //    let observer = new MutationObserver(function (mutations) {
    //        mutations.forEach(function (mutation) {

    //            instance.setProgress(parseFloat(instance.getAttribute('data-progress') || '0'));
    //        });
    //    });

    //    // configuration of the observer:
    //    let config = { attributes: true, childList: false, characterData: false };

    //    // pass in the target node, as well as the observer options
    //    observer.observe(instance, config);

    //    instance.observer = observer;
    //}

    instance.setProgress(parseFloat(instance.getAttribute('data-progress') || '0'));
  }
  var EmbyProgressRing = /*#__PURE__*/function (_HTMLDivElement) {
    function EmbyProgressRing() {
      var _this;
      // address the upgraded instance and use it
      var self = _this = _HTMLDivElement.call(this) || this;
      onInit.call(self);
      return babelHelpers.possibleConstructorReturn(_this, self);
    }
    babelHelpers.inherits(EmbyProgressRing, _HTMLDivElement);
    return babelHelpers.createClass(EmbyProgressRing, [{
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
    }, {
      key: "setProgress",
      value: function setProgress(progress) {
        progress = Math.floor(progress);
        var angle;
        if (progress < 25) {
          angle = -90 + progress / 100 * 360;
          this.querySelector('.animate-0-25-b').style.transform = 'rotate(' + angle + 'deg)';
          this.querySelector('.animate-25-50-b').style.transform = 'rotate(-90deg)';
          this.querySelector('.animate-50-75-b').style.transform = 'rotate(-90deg)';
          this.querySelector('.animate-75-100-b').style.transform = 'rotate(-90deg)';
        } else if (progress >= 25 && progress < 50) {
          angle = -90 + (progress - 25) / 100 * 360;
          this.querySelector('.animate-0-25-b').style.transform = 'none';
          this.querySelector('.animate-25-50-b').style.transform = 'rotate(' + angle + 'deg)';
          this.querySelector('.animate-50-75-b').style.transform = 'rotate(-90deg)';
          this.querySelector('.animate-75-100-b').style.transform = 'rotate(-90deg)';
        } else if (progress >= 50 && progress < 75) {
          angle = -90 + (progress - 50) / 100 * 360;
          this.querySelector('.animate-0-25-b').style.transform = 'none';
          this.querySelector('.animate-25-50-b').style.transform = 'none';
          this.querySelector('.animate-50-75-b').style.transform = 'rotate(' + angle + 'deg)';
          this.querySelector('.animate-75-100-b').style.transform = 'rotate(-90deg)';
        } else if (progress >= 75 && progress <= 100) {
          angle = -90 + (progress - 75) / 100 * 360;
          this.querySelector('.animate-0-25-b').style.transform = 'none';
          this.querySelector('.animate-25-50-b').style.transform = 'none';
          this.querySelector('.animate-50-75-b').style.transform = 'none';
          this.querySelector('.animate-75-100-b').style.transform = 'rotate(' + angle + 'deg)';
        }
        this.querySelector('.progressring-text').innerHTML = progress + '%';
      }
    }]);
  }(/*#__PURE__*/babelHelpers.wrapNativeSuper(HTMLDivElement));
  customElements.define('emby-progressring', EmbyProgressRing, {
    extends: 'div'
  });
  var _default = _exports.default = EmbyProgressRing;
});
