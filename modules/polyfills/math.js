if (!Math.trunc) {
  Math.trunc = function (v) {
    v = +v;
    if (!isFinite(v)) {
      return v;
    }
    return v - v % 1 || (v < 0 ? -0 : v === 0 ? v : 0);
  };
}
