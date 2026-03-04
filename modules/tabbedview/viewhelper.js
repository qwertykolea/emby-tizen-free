define(["exports"], function (_exports) {
  Object.defineProperty(_exports, "__esModule", {
    value: true
  });
  _exports.default = void 0;
  function convertTemplateToHorizontal(html) {
    html = html.replace('data-horizontal="false"', 'data-horizontal="true"');
    html = html.replace('data-forcescrollbar="true"', 'data-forcescrollbar="false"');
    html = html.replace('data-bindheader="true"', 'data-bindheader="false"');
    html = html.replace(' padded-bottom-page', '');
    html = html.replace(' vertical-wrap', '');
    html = html.replace('scrollSlider ', 'scrollSlider flex flex-direction-column ');
    html = html.replace('itemsContainer ', 'itemsContainer flex-grow padded-top-focusscale padded-bottom-focusscale ');
    html = html.replace('is="emby-itemscontainer"', 'is="emby-itemscontainer" style="margin-top:4em;"');
    html = html.replace(' data-virtualscrolllayout="vertical-grid"', ' data-virtualscrolllayout="horizontal-grid"');
    return html;
  }
  var _default = _exports.default = {
    convertTemplateToHorizontal: convertTemplateToHorizontal
  };
});
