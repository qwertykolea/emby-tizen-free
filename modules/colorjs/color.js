define(["exports"], function (_exports) {
  Object.defineProperty(_exports, "__esModule", {
    value: true
  });
  _exports.default = void 0;
  /**
   * Calculate the color distance or difference between 2 colors
   *
   * further explanation of this topic
   * can be found here -> https://en.wikipedia.org/wiki/Euclidean_distance
   * note: this method is not accuarate for better results use Delta-E distance metric.
   */
  var calculateColorDifference = function (color1, color2) {
    var rDifference = Math.pow(color2.r - color1.r, 2);
    var gDifference = Math.pow(color2.g - color1.g, 2);
    var bDifference = Math.pow(color2.b - color1.b, 2);
    return rDifference + gDifference + bDifference;
  };

  /**
   * Using relative luminance we order the brightness of the colors
   * the fixed values and further explanation about this topic
   * can be found here -> https://en.wikipedia.org/wiki/Luma_(video)
   */
  var orderByLuminance = function (rgbValues) {
    var calculateLuminance = function (p) {
      return 0.2126 * p.r + 0.7152 * p.g + 0.0722 * p.b;
    };
    return rgbValues.sort(function (p1, p2) {
      return calculateLuminance(p2) - calculateLuminance(p1);
    });
  };
  function getRelativeLuminance(color) {
    // Convert hex to RGB
    var r = color.r;
    var g = color.g;
    var b = color.b;

    // Normalize RGB values to 0-1
    var r_srgb = r / 255;
    var g_srgb = g / 255;
    var b_srgb = b / 255;

    // Apply the sRGB transfer function
    var r_linear = r_srgb <= 0.03928 ? r_srgb / 12.92 : Math.pow((r_srgb + 0.055) / 1.055, 2.4);
    var g_linear = g_srgb <= 0.03928 ? g_srgb / 12.92 : Math.pow((g_srgb + 0.055) / 1.055, 2.4);
    var b_linear = b_srgb <= 0.03928 ? b_srgb / 12.92 : Math.pow((b_srgb + 0.055) / 1.055, 2.4);

    // Calculate relative luminance
    return 0.2126 * r_linear + 0.7152 * g_linear + 0.0722 * b_linear;
  }
  var buildPalette = function (colorsList) {
    var orderedByColor = orderByLuminance(colorsList);
    var colors = [];
    for (var i = 0; i < orderedByColor.length; i++) {
      var color = orderedByColor[i];
      if (i > 0) {
        var difference = calculateColorDifference(color, orderedByColor[i - 1]);

        // if the distance is less than 120 we ommit that color
        if (difference < 120) {
          continue;
        }
      }
      var rgb = 'rgb(' + color.r + ', ' + color.g + ', ' + color.b + ')';
      colors.push({
        css: rgb,
        color: color,
        relativeLuminance: getRelativeLuminance(color)
      });
    }
    return colors;
  };
  var buildRgb = function (imageData) {
    var rgbValues = [];
    // note that we are loopin every 4!
    // for every Red, Green, Blue and Alpha
    for (var i = 0; i < imageData.length; i += 4) {
      var rgb = {
        r: imageData[i],
        g: imageData[i + 1],
        b: imageData[i + 2]
      };
      rgbValues.push(rgb);
    }
    return rgbValues;
  };

  // returns what color channel has the biggest difference
  var findBiggestColorRange = function (rgbValues) {
    /**
     * Min is initialized to the maximum value posible
     * from there we procced to find the minimum value for that color channel
     *
     * Max is initialized to the minimum value posible
     * from there we procced to fin the maximum value for that color channel
     */
    var rMin = Number.MAX_VALUE;
    var gMin = Number.MAX_VALUE;
    var bMin = Number.MAX_VALUE;
    var rMax = Number.MIN_VALUE;
    var gMax = Number.MIN_VALUE;
    var bMax = Number.MIN_VALUE;
    rgbValues.forEach(function (pixel) {
      rMin = Math.min(rMin, pixel.r);
      gMin = Math.min(gMin, pixel.g);
      bMin = Math.min(bMin, pixel.b);
      rMax = Math.max(rMax, pixel.r);
      gMax = Math.max(gMax, pixel.g);
      bMax = Math.max(bMax, pixel.b);
    });
    var rRange = rMax - rMin;
    var gRange = gMax - gMin;
    var bRange = bMax - bMin;

    // determine which color has the biggest difference
    var biggestRange = Math.max(rRange, gRange, bRange);
    if (biggestRange === rRange) {
      return "r";
    } else if (biggestRange === gRange) {
      return "g";
    } else {
      return "b";
    }
  };

  /**
   * Median cut implementation
   * can be found here -> https://en.wikipedia.org/wiki/Median_cut
   */
  var quantization = function (rgbValues, depth) {
    var MAX_DEPTH = 4;

    // Base case
    if (depth === MAX_DEPTH || rgbValues.length === 0) {
      var color = rgbValues.reduce(function (prev, curr) {
        prev.r += curr.r;
        prev.g += curr.g;
        prev.b += curr.b;
        return prev;
      }, {
        r: 0,
        g: 0,
        b: 0
      });
      color.r = Math.round(color.r / rgbValues.length);
      color.g = Math.round(color.g / rgbValues.length);
      color.b = Math.round(color.b / rgbValues.length);
      return [color];
    }

    /**
     *  Recursively do the following:
     *  1. Find the pixel channel (red,green or blue) with biggest difference/range
     *  2. Order by this channel
     *  3. Divide in half the rgb colors list
     *  4. Repeat process again, until desired depth or base case
     */
    var componentToSortBy = findBiggestColorRange(rgbValues);
    rgbValues.sort(function (p1, p2) {
      return p1[componentToSortBy] - p2[componentToSortBy];
    });
    var mid = rgbValues.length / 2;
    return [].concat(babelHelpers.toConsumableArray(quantization(rgbValues.slice(0, mid), depth + 1)), babelHelpers.toConsumableArray(quantization(rgbValues.slice(mid + 1), depth + 1)));
  };
  function getPalette(url) {
    return new Promise(function (resolve, reject) {
      var image = new Image();
      image.crossOrigin = "Anonymous";
      image.onload = function () {
        // Set the canvas size to be the same as of the uploaded image
        var canvas = document.createElement("canvas");
        canvas.width = image.width;
        canvas.height = image.height;
        var ctx = canvas.getContext("2d");
        ctx.drawImage(image, 0, 0);

        /**
         * getImageData returns an array full of RGBA values
         * each pixel consists of four values: the red value of the colour, the green, the blue and the alpha
         * (transparency). For array value consistency reasons,
         * the alpha is not from 0 to 1 like it is in the RGBA of CSS, but from 0 to 255.
         */
        var imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

        // Convert the image data to RGB values so its much simpler
        var rgbArray = buildRgb(imageData.data);

        /**
         * Color quantization
         * A process that reduces the number of colors used in an image
         * while trying to visually maintin the original image as much as possible
         */
        var quantColors = quantization(rgbArray, 0);

        // Create the HTML structure to show the color palette
        resolve(buildPalette(quantColors));
      };
      image.onerror = reject;
      image.src = url;
    });
  }
  var _default = _exports.default = {
    getPalette: getPalette
  };
});
