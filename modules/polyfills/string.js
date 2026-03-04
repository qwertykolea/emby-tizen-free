/* jshint module: true */

if (!String.prototype.includes) {
  String.prototype.includes = function (search, start) {
    if (search instanceof RegExp) {
      throw TypeError('first argument must not be a RegExp');
    }
    if (start === undefined) {
      start = 0;
    }
    return this.indexOf(search, start) !== -1;
  };
}
if (!String.prototype.startsWith) {
  Object.defineProperty(String.prototype, 'startsWith', {
    value: function (search, rawPos) {
      var pos = rawPos > 0 ? rawPos | 0 : 0;
      return this.substring(pos, pos + search.length) === search;
    }
  });
}
if (!String.prototype.endsWith) {
  String.prototype.endsWith = function (search, this_len) {
    if (this_len === undefined || this_len > this.length) {
      this_len = this.length;
    }
    return this.substring(this_len - search.length, this_len) === search;
  };
}
if (!String.prototype.replaceAll) {
  String.prototype.replaceAll = function (find, replace) {
    var s = '',
      index,
      next;
    while (~(next = this.indexOf(find, index))) {
      s += this.substring(index, next) + replace;
      index = next + find.length;
    }
    return s + this.substring(index);
  };
}
