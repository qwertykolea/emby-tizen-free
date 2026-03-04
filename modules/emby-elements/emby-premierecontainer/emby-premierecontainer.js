define(["exports", "./../../registrationservices/registrationservices.js", "./../../common/servicelocator.js"], function (_exports, _registrationservices, _servicelocator) {
  Object.defineProperty(_exports, "__esModule", {
    value: true
  });
  _exports.default = void 0;
  require(['css!modules/emby-elements/emby-premierecontainer/emby-premierecontainer.css']);
  function onInit() {
    var elem = this;
    if (elem.hasInit) {
      return;
    }
    elem.hasInit = true;
    this.classList.add('premirecontainer-forcehide');
  }
  function showElementIfUnlocked(elem, unlocks, index) {
    var unlock = unlocks[index];
    if (!unlock) {
      elem.classList.remove('premirecontainer-forcehide');
      return;
    }
    var feature = unlock;
    var inverse = false;
    if (unlock.startsWith('!')) {
      feature = feature.substring(1);
      inverse = true;
    }
    _servicelocator.iapManager.isUnlockedByDefault(feature).then(function () {
      if (inverse) {
        // condition failed
        elem.classList.add('premirecontainer-forcehide');
      } else {
        // condition passed
        showElementIfUnlocked(elem, unlocks, index + 1);
      }
    }, function () {
      if (inverse) {
        // condition passed
        showElementIfUnlocked(elem, unlocks, index + 1);
      } else {
        // condition failed
        elem.classList.add('premirecontainer-forcehide');
      }
    });
  }
  function checkShowIfUnlocked(elem) {
    var showIfUnlocked = elem.getAttribute('data-showifunlocked');
    if (!showIfUnlocked) {
      showElementIfUnlocked(elem, [], 0);
      return;
    }
    var unlocks = showIfUnlocked.split(',');
    showElementIfUnlocked(elem, unlocks, 0);
  }
  function checkStatus(elem) {
    return _registrationservices.default.validateFeature('dvr', {
      showDialog: false,
      viewOnly: true
    }).then(function () {
      elem.classList.add('premirecontainer-forcehide');
    }, function () {
      checkShowIfUnlocked(elem);
    });
  }
  var EmbyPremiereContainer = /*#__PURE__*/function (_HTMLDivElement) {
    function EmbyPremiereContainer() {
      var _this;
      // address the upgraded instance and use it
      var self = _this = _HTMLDivElement.call(this) || this;
      onInit.call(self);
      return babelHelpers.possibleConstructorReturn(_this, self);
    }
    babelHelpers.inherits(EmbyPremiereContainer, _HTMLDivElement);
    return babelHelpers.createClass(EmbyPremiereContainer, [{
      key: "connectedCallback",
      value: function connectedCallback() {
        checkStatus(this);
      }
    }, {
      key: "disconnectedCallback",
      value: function disconnectedCallback() {}
    }]);
  }(/*#__PURE__*/babelHelpers.wrapNativeSuper(HTMLDivElement));
  customElements.define('emby-premierecontainer', EmbyPremiereContainer, {
    extends: 'div'
  });
  var _default = _exports.default = EmbyPremiereContainer;
});
