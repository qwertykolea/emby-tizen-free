/* jshint module: true */

if (!globalThis.crypto) {
  globalThis.crypto = {};
}
if (!crypto.randomUUID) {
  if (crypto.getRandomValues) {
    crypto.randomUUID = function () {
      return ([1e7] + -1e3 + -4e3 + -8e3 + -1e11).replace(/[018]/g, function (c) {
        return (c ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> c / 4).toString(16);
      });
    };
  } else {
    crypto.randomUUID = function () {
      return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
        var r = Math.random() * 16 | 0,
          v = c === 'x' ? r : r & 0x3 | 0x8;
        return v.toString(16);
      });
    };
  }
}
