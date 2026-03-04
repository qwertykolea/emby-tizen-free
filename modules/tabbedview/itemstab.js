define(["exports", "./basetab.js", "./../emby-apiclient/connectionmanager.js", "./listcontroller.js"], function (_exports, _basetab, _connectionmanager, _listcontroller) {
  Object.defineProperty(_exports, "__esModule", {
    value: true
  });
  _exports.default = void 0;
  /* jshint module: true */

  function ItemsTab(view, params, options) {
    _basetab.default.apply(this, arguments);
    _listcontroller.default.apply(this, arguments);
    this.view = view;
    this.params = params;
    if (params.serverId) {
      this.apiClient = _connectionmanager.default.getApiClient(params.serverId);
    }
  }
  Object.assign(ItemsTab.prototype, _basetab.default.prototype);
  Object.assign(ItemsTab.prototype, _listcontroller.default.prototype);
  ItemsTab.prototype.onTemplateLoaded = function () {
    _basetab.default.prototype.onTemplateLoaded.apply(this, arguments);
    var params = this.params;
    this.initItemsContainer();
    this.addFocusBehavior(this.itemsContainer);
    if (params.parentId && !this.isGlobalQuery()) {
      this.itemsContainer.setAttribute('data-parentid', params.parentId);
    }
    this.initButtons();
  };
  ItemsTab.prototype.getSettingsKey = function () {
    return this.params.parentId + '-1';
  };
  ItemsTab.prototype.isRecursiveQuery = function () {
    return true;
  };
  ItemsTab.prototype.onResume = function (options) {
    _basetab.default.prototype.onResume.apply(this, arguments);
    var instance = this;
    var autoFocus = options.autoFocus;
    return _listcontroller.default.prototype.resume.apply(this, arguments).then(function (result) {
      if (autoFocus) {
        instance.autoFocus();
      }
    });
  };
  function convertTemplateToHorizontal(html) {
    return Emby.importModule('./modules/tabbedview/viewhelper.js').then(function (viewHelper) {
      return viewHelper.convertTemplateToHorizontal(html);
    });
  }
  ItemsTab.prototype.loadItemsTemplate = function () {
    var promise = require(['text!modules/tabbedview/itemstab.template.html']);
    if (this.scrollDirection() === 'y') {
      return promise;
    }
    return promise.then(function (responses) {
      var html = responses[0];
      return convertTemplateToHorizontal(html).then(function (html) {
        responses[0] = html;
        return responses;
      });
    });
  };
  ItemsTab.prototype.getFocusContainerElement = function () {
    var scroller = this.scroller;
    if (scroller === this.view) {
      var elem = scroller == null ? void 0 : scroller.querySelector('.scrollSlider');
      if (elem) {
        return elem;
      }
    }
    return _basetab.default.prototype.getFocusContainerElement.apply(this, arguments);
  };
  ItemsTab.prototype.refresh = function (options) {
    var instance = this;
    var autoFocus = options.autoFocus;
    this.itemsContainer.refreshItems(options).then(function (result) {
      if (autoFocus) {
        instance.autoFocus();
      }
    });
  };
  ItemsTab.prototype.onPause = function () {
    _basetab.default.prototype.onPause.apply(this, arguments);
    _listcontroller.default.prototype.pause.apply(this, arguments);
  };
  ItemsTab.prototype.destroy = function () {
    _basetab.default.prototype.destroy.apply(this, arguments);
    _listcontroller.default.prototype.destroy.apply(this, arguments);
    this.options = null;
  };
  var _default = _exports.default = ItemsTab;
});
