define(["exports"], function (_exports) {
  Object.defineProperty(_exports, "__esModule", {
    value: true
  });
  _exports.default = void 0;
  /* jshint module: true */

  function hexToRgbA(hex, alpha) {
    if (hex === 'transparent') {
      return hex;
    }
    var c;
    if (/^#([A-Fa-f0-9]{3}){1,2}$/.test(hex)) {
      c = hex.substring(1).split('');
      if (c.length === 3) {
        c = [c[0], c[0], c[1], c[1], c[2], c[2]];
      }
      c = '0x' + c.join('');
      alpha = Math.min(1, alpha);
      alpha = Math.max(0, alpha);
      return 'rgba(' + [c >> 16 & 255, c >> 8 & 255, c & 255].join(',') + ',' + alpha + ')';
    }
    throw new Error('Bad Hex');
  }
  function getTextStyles(settings, options) {
    var list = [];
    var multipliers = {
      smaller: 0.5,
      small: 0.7,
      medium: 1,
      large: 1.3,
      larger: 1.72,
      extralarge: 2
    };
    var multiplier = multipliers[settings.textSize || 'medium'];
    list.push({
      name: 'font-size',
      value: multiplier + 'em'
    });
    var positionBottom = settings.positionBottom || '10';
    list.push({
      name: 'positionBottom',
      value: positionBottom
    });
    var positionTop = settings.positionTop || '5';
    list.push({
      name: 'positionTop',
      value: positionTop
    });
    switch (settings.dropShadow || '') {
      case 'raised':
        list.push({
          name: 'text-shadow',
          value: '-1px -1px white, 0px -1px white, -1px 0px white, 1px 1px black, 0px 1px black, 1px 0px black'
        });
        break;
      case 'depressed':
        list.push({
          name: 'text-shadow',
          value: '1px 1px white, 0px 1px white, 1px 0px white, -1px -1px black, 0px -1px black, -1px 0px black'
        });
        break;
      case 'uniform':
        list.push({
          name: 'text-shadow',
          value: '-1px 0px #000000, 0px 1px #000000, 1px 0px #000000, 0px -1px #000000'
        });
        break;
      case 'none':
        list.push({
          name: 'text-shadow',
          value: 'none'
        });
        break;
      default:
      case 'dropshadow':
        list.push({
          name: 'text-shadow',
          value: '#000000 0 0 .25em'
        });
        break;
    }
    var background = hexToRgbA(settings.textBackground, parseFloat(settings.textBackgroundOpacity));
    // Workaround Chrome 74+ putting subtitles at the top

    if (background) {
      list.push({
        name: 'background-color',
        value: background
      });
    }
    var textColor = settings.textColor || '#ffffff';
    if (textColor) {
      list.push({
        name: 'color',
        value: textColor
      });
    }
    list.push({
      name: 'font-family',
      value: 'inherit'
    });
    return list;
  }
  function getWindowStyles(settings) {
    return [];
  }
  function getStyleObjectName(name) {
    switch (name) {
      case 'background-color':
        return 'backgroundColor';
      case 'text-shadow':
        return 'textShadow';
      case 'font-family':
        return 'fontFamily';
      case 'font-size':
        return 'fontSize';
      default:
        return name;
    }
  }
  function convertStyleListToObject(list) {
    var obj = {};
    for (var i = 0, length = list.length; i < length; i++) {
      obj[getStyleObjectName(list[i].name)] = list[i].value;
    }
    return obj;
  }
  function getStyles(settings, options) {
    if (!options) {
      options = {};
    }
    return {
      text: getTextStyles(settings, options),
      window: getWindowStyles(settings)
    };
  }
  function getStyleObjects(settings, options) {
    var styles = getStyles(settings, options);
    return {
      text: convertStyleListToObject(styles.text),
      window: convertStyleListToObject(styles.window)
    };
  }
  function applyStyleList(styles, elem) {
    for (var i = 0, length = styles.length; i < length; i++) {
      var style = styles[i];
      elem.style[style.name] = style.value;
    }
  }
  function applyStyles(elements, appearanceSettings, options) {
    var styles = getStyles(appearanceSettings, options);
    if (elements.text) {
      applyStyleList(styles.text, elements.text);
    }
    if (elements.window) {
      applyStyleList(styles.window, elements.window);
    }
  }
  var _default = _exports.default = {
    getStyles: getStyles,
    applyStyles: applyStyles,
    getStyleObjects: getStyleObjects
  };
});
