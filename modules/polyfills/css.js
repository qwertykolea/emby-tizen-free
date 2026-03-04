/* jshint module: true */

if (!globalThis.CSS) {
  globalThis.CSS = {};
}
if (!CSS.supports) {
  CSS.supports = function (prop, value) {
    if (typeof window === 'undefined') {
      return false;
    }

    // If no value is supplied, use "inherit"
    value = arguments.length === 2 ? value : 'inherit';

    // skip the test for css variables since we know they're not supported
    if (prop.includes('--')) {
      return false;
    }
    if (value) {
      if (value.includes('--')) {
        return false;
      }
    }

    // Check Opera's native method
    if ('supportsCSS' in window) {
      return window.supportsCSS(prop, value);
    }

    // need try/catch because it's failing on tizen

    try {
      // Convert to camel-case for DOM interactions
      var camel = prop.replace(/-([a-z]|[0-9])/ig, function (all, letter) {
        return (letter + '').toUpperCase();
      });
      // Create test element
      var el = document.createElement('div');
      // Check if the property is supported
      var support = camel in el.style;
      if (support) {
        // Assign the property and value to invoke
        // the CSS interpreter
        el.style.cssText = prop + ':' + value;
        // Ensure both the property and value are
        // supported and return
        return el.style[camel] !== '';
      }
    } catch (err) {}
    return false;
  };
}
