/* jshint module: true */

if (typeof Promise.any !== 'function') {
  Promise.any = function (n) {
    return new Promise(function (e, o, t, i) {
      t = [];
      i = n.map(function (n, r) {
        return Promise.resolve(n).then(e, function (n) {
          return t[r] = n, --i || o({
            errors: t
          });
        });
      }).length;
    });
  };
}

// https://github.com/ungap/promise-all-settled
if (typeof Promise.allSettled !== 'function') {
  Promise.allSettled = function (t) {
    var e = this;
    return e.all(t.map(function (t) {
      return e.resolve(t).then(this.$, this._);
    }, {
      $: function (t) {
        return {
          status: "fulfilled",
          value: t
        };
      },
      _: function (t) {
        return {
          status: "rejected",
          reason: t
        };
      }
    }));
  };
}
if (typeof Promise.prototype.finally !== 'function') {
  Promise.prototype.finally = function (callback) {
    if (typeof callback !== 'function') {
      return this.then(callback, callback);
    }
    // get the current promise or a new one
    var P = this.constructor || Promise;

    // return the promise and call the callback function
    // as soon as the promise is rejected or resolved with its value
    return this.then(function (value) {
      return P.resolve(callback()).then(function () {
        return value;
      });
    }, function (err) {
      return P.resolve(callback()).then(function () {
        throw err;
      });
    });
  };
}
