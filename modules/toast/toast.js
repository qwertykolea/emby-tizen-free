define(["exports", "./../layoutmanager.js", "./../dom.js", "./../dialoghelper/dialoghelper.js"], function (_exports, _layoutmanager, _dom, _dialoghelper) {
  Object.defineProperty(_exports, "__esModule", {
    value: true
  });
  _exports.default = void 0;
  /* jshint module: true */

  // only needed for styles

  require(['css!modules/toast/toast.css']);
  var fillFromTop = _layoutmanager.default.tv;
  var sectionElement = createSectionElement();
  function createSectionElement() {
    var section = document.createElement("section");
    section.classList.add("toast-group");
    if (fillFromTop) {
      section.classList.add('toast-group-top');
    }
    document.body.appendChild(section);
    return section;
  }
  function createToastElement(options, position) {
    var toast = document.createElement("output");
    var html = '';
    if (options.icon) {
      var iconClass = 'toast-icon flex-shrink-zero';
      if (position === 'center') {
        iconClass += ' toast-icon-center';
      }
      if (options.iconStrikeThrough) {
        iconClass += ' icon_circle_strike';
      }
      html += '<i class="md-icon autortl ' + iconClass + '">';
      html += options.icon;
      html += '</i>';
    }
    html += '<div class="flex flex-direction-column">';
    if (position === 'center') {
      html += '<h3 class="toast-primarytext">';
      html += options.text;
      html += '</h3>';
    } else {
      html += '<div class="toast-primarytext">';
      html += options.text;
      html += '</div>';
    }
    if (options.secondaryText) {
      html += '<div class="secondaryText toast-secondaryText">';
      html += options.secondaryText;
      html += '</div>';
    }
    html += '</div>';

    //let center = options.icon;
    //if (center) {

    //    if (layoutManager.tv) {
    //        elem.classList.add('toast', 'toast-large', 'toast-large-tv');

    //        setCenterToastInnerHtml(elem, options, true);
    //    } else {
    //        elem.classList.add('toast', 'toast-large');

    //        setCenterToastInnerHtml(elem, options);
    //    }

    //} else {
    //    toast.innerText = options.text;
    //}

    //toast.innerText = options.text;

    toast.classList.add("toast");
    toast.classList.add("dialog");
    if (_dom.default.allowBackdropFilter()) {
      toast.classList.add("dialog-blur");
    }
    if (position) {
      toast.classList.add('toast-' + position);
    }
    if (position === 'center') {
      toast.classList.add('toast-large');
    }
    toast.setAttribute("role", "status");
    toast.innerHTML = html;
    return toast;
  }
  function animateAndAppend(element, position) {
    if (position === 'center') {
      sectionElement.appendChild(element);
      return;
    }
    var t = sectionElement.offsetHeight;
    sectionElement.appendChild(element);
    var s = sectionElement.offsetHeight - t;
    if (position === 'top') {
      s *= -1;
    }
    var o = sectionElement.animate([{
      transform: "translateY(" + s + "px)"
    }, {
      transform: "translateY(0)"
    }], {
      duration: 150,
      easing: "ease-out"
    });
    var timeline = document.timeline;
    if (timeline) {
      o.startTime = timeline.currentTime;
    }
  }
  var nativeAnimationSupported = document.documentElement.animate;
  function appendToastElement(element, position) {
    if (nativeAnimationSupported && sectionElement.children.length) {
      if (window.matchMedia("(prefers-reduced-motion: no-preference)").matches) {
        animateAndAppend(element, position);
        return;
      }
    }
    sectionElement.appendChild(element);
  }
  function setTimeoutPromise(delay) {
    return new Promise(function (resolve, reject) {
      setTimeout(resolve, delay);
    });
  }
  function getAnimationPromise(elem) {
    if (elem.getAnimations) {
      return Promise.allSettled(elem.getAnimations().map(function (o) {
        return o.finished;
      }));
    }
    return setTimeoutPromise(3300);
  }
  function sendToast(options) {
    if (typeof options === 'string') {
      options = {
        text: options
      };
    }
    return require(['css!modules/toast/toast.css']).then(function () {
      var isTop = fillFromTop;
      var position = isTop ? 'top' : null;
      var toast = createToastElement(options, position);
      appendToastElement(toast, position);
      return getAnimationPromise(toast).then(function () {
        sectionElement.removeChild(toast);
      });
    });
  }
  var _default = _exports.default = sendToast;
});
