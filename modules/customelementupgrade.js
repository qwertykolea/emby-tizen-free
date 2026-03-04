define(["./dom.js"], function (_dom) {
  function waitForUpgradeWithEvent(elem) {
    return new Promise(function (resolve, reject) {
      if (elem.__upgraded) {
        resolve();
        return;
      }
      _dom.default.addEventListener(elem, 'upgraded', function () {
        elem.__upgraded = true;
        resolve();
      }, {
        once: true
      });
    });
  }
  HTMLElement.prototype.waitForCustomElementUpgrade = function () {
    if (this.__upgraded) {
      return Promise.resolve();
    }
    return waitForUpgradeWithEvent(this);
  };
});
