/*! (c) Andrea Giammarchi - ISC */
var self = globalThis;
try {
  (function (URLSearchParams, plus) {
    if (new URLSearchParams('q=%2B').get('q') !== plus || new URLSearchParams({
      q: plus
    }).get('q') !== plus || new URLSearchParams([['q', plus]]).get('q') !== plus || new URLSearchParams('q=\n').toString() !== 'q=%0A' || new URLSearchParams({
      q: ' &'
    }).toString() !== 'q=+%26' || new URLSearchParams({
      q: '%zx'
    }).toString() !== 'q=%25zx') {
      throw URLSearchParams;
    }
    self.URLSearchParams = URLSearchParams;
  })(URLSearchParams, '+');
} catch (URLSearchParams) {
  (function (Object, String, isArray) {
    'use strict';

    var create = Object.create;
    var defineProperty = Object.defineProperty;
    var find = /[!'\(\)~]|%20|%00/g;
    var findPercentSign = /%(?![0-9a-fA-F]{2})/g;
    var plus = /\+/g;
    var replace = {
      '!': '%21',
      "'": '%27',
      '(': '%28',
      ')': '%29',
      '~': '%7E',
      '%20': '+',
      '%00': '\x00'
    };
    var proto = {
      append: function (key, value) {
        appendTo(this._ungap, key, value);
      },
      delete: function (key) {
        delete this._ungap[key];
      },
      get: function (key) {
        return this.has(key) ? this._ungap[key][0] : null;
      },
      getAll: function (key) {
        return this.has(key) ? this._ungap[key].slice(0) : [];
      },
      has: function (key) {
        return key in this._ungap;
      },
      set: function (key, value) {
        this._ungap[key] = [String(value)];
      },
      forEach: function (callback, thisArg) {
        var self = this;
        var _loop = function (key) {
          if (Object.prototype.hasOwnProperty.call(self._ungap, key)) {
            var invoke = function (value) {
              callback.call(thisArg, value, String(key), self);
            };
            self._ungap[key].forEach(invoke, key);
          }
        };
        for (var key in self._ungap) {
          _loop(key);
        }
      },
      toJSON: function () {
        return {};
      },
      toString: function () {
        var query = [];
        for (var key in this._ungap) {
          if (Object.prototype.hasOwnProperty.call(this._ungap, key)) {
            var encoded = encode(key);
            var value = this._ungap[key];
            for (var i = 0; i < value.length; i++) {
              query.push(encoded + '=' + encode(value[i]));
            }
          }
        }
        return query.join('&');
      }
    };
    for (var key in proto) {
      if (Object.prototype.hasOwnProperty.call(proto, key)) {
        defineProperty(URLSearchParams.prototype, key, {
          configurable: true,
          writable: true,
          value: proto[key]
        });
      }
    }
    self.URLSearchParams = URLSearchParams;
    function URLSearchParams(query) {
      var dict = create(null);
      defineProperty(this, '_ungap', {
        value: dict
      });
      if (!query) {
        // No-op
      } else if (typeof query === 'string') {
        if (query.charAt(0) === '?') {
          query = query.slice(1);
        }
        var pairs = query.split('&');
        for (var i = 0; i < pairs.length; i++) {
          var value = pairs[i];
          var index = value.indexOf('=');
          if (index > -1) {
            appendTo(dict, decode(value.slice(0, index)), decode(value.slice(index + 1)));
          } else if (value.length) {
            appendTo(dict, decode(value), '');
          }
        }
      } else if (isArray(query)) {
        for (var _i = 0; _i < query.length; _i++) {
          var _value = query[_i];
          appendTo(dict, _value[0], _value[1]);
        }
      } else if ('forEach' in query) {
        query.forEach(addEach, dict);
      } else {
        for (var _key in query) {
          if (Object.prototype.hasOwnProperty.call(query, _key)) {
            appendTo(dict, _key, query[_key]);
          }
        }
      }
    }
    function addEach(value, key) {
      appendTo(this, key, value);
    }
    function appendTo(dict, key, value) {
      var res = isArray(value) ? value.join(',') : value;
      if (key in dict) {
        dict[key].push(res);
      } else {
        dict[key] = [res];
      }
    }
    function decode(str) {
      return decodeURIComponent(str.replace(findPercentSign, '%25').replace(plus, ' '));
    }
    function encode(str) {
      return encodeURIComponent(str).replace(find, replacer);
    }
    function replacer(match) {
      return replace[match];
    }
  })(Object, String, Array.isArray);
}
(function (URLSearchParamsProto) {
  var iterable = false;
  try {
    iterable = !!Symbol.iterator;
  } catch (o_O) {/* ignore */}

  /* istanbul ignore else */
  if (!('forEach' in URLSearchParamsProto)) {
    URLSearchParamsProto.forEach = function forEach(callback, thisArg) {
      var self = this;
      var names = Object.create(null);
      this.toString().replace(/=[\s\S]*?(?:&|$)/g, '=').split('=').forEach(function (name) {
        if (!name.length || name in names) {
          return;
        }
        (names[name] = self.getAll(name)).forEach(function (value) {
          callback.call(thisArg, value, name, self);
        });
      });
    };
  }

  /* istanbul ignore else */
  if (!('keys' in URLSearchParamsProto)) {
    URLSearchParamsProto.keys = function keys() {
      return iterator(this, function (value, key) {
        this.push(key);
      });
    };
  }

  /* istanbul ignore else */
  if (!('values' in URLSearchParamsProto)) {
    URLSearchParamsProto.values = function values() {
      return iterator(this, function (value, key) {
        this.push(value);
      });
    };
  }

  /* istanbul ignore else */
  if (!('entries' in URLSearchParamsProto)) {
    URLSearchParamsProto.entries = function entries() {
      return iterator(this, function (value, key) {
        this.push([key, value]);
      });
    };
  }

  /* istanbul ignore else */
  if (iterable && !(Symbol.iterator in URLSearchParamsProto)) {
    URLSearchParamsProto[Symbol.iterator] = URLSearchParamsProto.entries;
  }

  /* istanbul ignore else */
  if (!('sort' in URLSearchParamsProto)) {
    URLSearchParamsProto.sort = function sort() {
      var entries = this.entries();
      var entry = entries.next();
      var done = entry.done;
      var keys = [];
      var values = Object.create(null);
      var i;
      var key;
      var value;
      while (!done) {
        value = entry.value;
        key = value[0];
        keys.push(key);
        if (!(key in values)) {
          values[key] = [];
        }
        values[key].push(value[1]);
        entry = entries.next();
        done = entry.done;
      }
      // not the champion in efficiency
      // but these two bits just do the job
      keys.sort();
      for (i = 0; i < keys.length; i++) {
        this.delete(keys[i]);
      }
      for (i = 0; i < keys.length; i++) {
        key = keys[i];
        // The original code uses a potentially unsafe shift() operation.
        // It's safer to ensure a value exists before appending.
        if (values[key] && values[key].length > 0) {
          this.append(key, values[key].shift());
        }
      }
    };
  }
  function iterator(self, callback) {
    var items = [];
    self.forEach(callback, items);
    /* istanbul ignore next */
    return iterable ? items[Symbol.iterator]() : {
      next: function () {
        var value = items.shift();
        return {
          done: value === void 0,
          value: value
        };
      }
    };
  }

  /* istanbul ignore next */
  (function (Object) {
    var dP = Object.defineProperty;
    var gOPD = Object.getOwnPropertyDescriptor;
    var createSearchParamsPollute = function (search) {
      function append(name, value) {
        URLSearchParamsProto.append.call(this, name, value);
        name = this.toString();
        search.set.call(this._usp, name ? '?' + name : '');
      }
      function del(name) {
        URLSearchParamsProto.delete.call(this, name);
        name = this.toString();
        search.set.call(this._usp, name ? '?' + name : '');
      }
      function set(name, value) {
        URLSearchParamsProto.set.call(this, name, value);
        name = this.toString();
        search.set.call(this._usp, name ? '?' + name : '');
      }
      return function (sp, value) {
        sp.append = append;
        sp.delete = del;
        sp.set = set;
        return dP(sp, '_usp', {
          configurable: true,
          writable: true,
          value: value
        });
      };
    };
    var createSearchParamsCreate = function (polluteSearchParams) {
      return function (obj, sp) {
        dP(obj, '_searchParams', {
          configurable: true,
          writable: true,
          value: polluteSearchParams(sp, obj)
        });
        return sp;
      };
    };
    var updateSearchParams = function (sp) {
      var append = sp.append;
      sp.append = URLSearchParamsProto.append;
      URLSearchParams.call(sp, sp._usp.search.slice(1));
      sp.append = append;
    };
    var verifySearchParams = function (obj, Class) {
      if (!(obj instanceof Class)) {
        throw new TypeError("'searchParams' accessed on an object that " + "does not implement interface " + Class.name);
      }
    };
    var upgradeClass = function (Class) {
      var ClassProto = Class.prototype;
      var searchParams = gOPD(ClassProto, 'searchParams');
      var href = gOPD(ClassProto, 'href');
      var search = gOPD(ClassProto, 'search');
      var createSearchParams;
      if (!searchParams && search && search.set) {
        createSearchParams = createSearchParamsCreate(createSearchParamsPollute(search));
        Object.defineProperties(ClassProto, {
          href: {
            get: function () {
              return href.get.call(this);
            },
            set: function (value) {
              var sp = this._searchParams;
              href.set.call(this, value);
              if (sp) {
                updateSearchParams(sp);
              }
            }
          },
          search: {
            get: function () {
              return search.get.call(this);
            },
            set: function (value) {
              var sp = this._searchParams;
              search.set.call(this, value);
              if (sp) {
                updateSearchParams(sp);
              }
            }
          },
          searchParams: {
            get: function () {
              verifySearchParams(this, Class);
              return this._searchParams || createSearchParams(this, new URLSearchParams(this.search.slice(1)));
            },
            set: function (sp) {
              verifySearchParams(this, Class);
              createSearchParams(this, sp);
            }
          }
        });
      }
    };
    try {
      upgradeClass(HTMLAnchorElement);
      if (/^function|object$/.test(typeof URL) && URL.prototype) {
        upgradeClass(URL);
      }
    } catch (meh) {/* ignore */}
  })(Object);
})(self.URLSearchParams.prototype, Object);
