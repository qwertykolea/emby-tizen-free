define(["exports", "./../emby-apiclient/events.js"], function (_exports, _events) {
  Object.defineProperty(_exports, "__esModule", {
    value: true
  });
  _exports.default = void 0;
  /* jshint module: true */

  require(['css!modules/loading/loading.css']);
  var loadingElem;
  var isHidden;
  var loading = {
    show: function () {
      var elem = loadingElem;
      if (!elem) {
        elem = document.createElement("div");
        loadingElem = elem;
        elem.classList.add('mdl-spinner');
        elem.innerHTML = '<div class="mdl-spinner__layer mdl-spinner__layer-1"><div class="mdl-spinner__circle-clipper mdl-spinner__left"><div class="mdl-spinner__circle mdl-spinner__circleLeft"></div></div><div class="mdl-spinner__circle-clipper mdl-spinner__right"><div class="mdl-spinner__circle mdl-spinner__circleRight"></div></div></div>';
        document.body.appendChild(elem);
      }
      if (isHidden) {
        isHidden = false;
        _events.default.trigger(loading, 'loading-state-change', [true]);
        elem.classList.remove('hide');
      }
    },
    hide: function () {
      var elem = loadingElem;
      if (elem && !isHidden) {
        isHidden = true;

        //console.log('loading being hidden: ' + new Error().stack);

        _events.default.trigger(loading, 'loading-state-change', [false]);
        elem.classList.add('hide');
      }
    }
  };
  var _default = _exports.default = loading;
});
