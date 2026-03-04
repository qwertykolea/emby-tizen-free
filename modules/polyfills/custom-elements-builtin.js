define(["exports"], function (_exports) {
  Object.defineProperty(_exports, "__esModule", {
    value: true
  });
  _exports.default = void 0;
  var attributesObserver = function (whenDefined, MutationObserver) {
    var attributeChanged = function (records) {
      for (var i = 0, length = records.length; i < length; i++) dispatch(records[i]);
    };
    var dispatch = function (_ref) {
      var target = _ref.target,
        attributeName = _ref.attributeName,
        oldValue = _ref.oldValue;
      target.attributeChangedCallback(attributeName, oldValue, target.getAttribute(attributeName));
    };
    return function (target, is) {
      var attributeFilter = target.constructor.observedAttributes;
      if (attributeFilter) {
        whenDefined(is).then(function () {
          new MutationObserver(attributeChanged).observe(target, {
            attributes: true,
            attributeOldValue: true,
            attributeFilter: attributeFilter
          });
          for (var i = 0, length = attributeFilter.length; i < length; i++) {
            if (target.hasAttribute(attributeFilter[i])) dispatch({
              target: target,
              attributeName: attributeFilter[i],
              oldValue: null
            });
          }
        });
      }
      return target;
    };
  };
  var keys = Object.keys;
  var expando = function (element) {
    var key = keys(element);
    var value = [];
    var ignore = new Set();
    var length = key.length;
    for (var i = 0; i < length; i++) {
      value[i] = element[key[i]];
      try {
        delete element[key[i]];
      } catch (SafariTP) {
        ignore.add(i);
      }
    }
    return function () {
      for (var _i = 0; _i < length; _i++) ignore.has(_i) || (element[key[_i]] = value[_i]);
    };
  };

  /*! (c) Andrea Giammarchi - ISC */
  var TRUE = true,
    FALSE = false,
    QSA$1 = 'querySelectorAll';

  /**
   * Start observing a generic document or root element.
   * @param {(node:Element, connected:boolean) => void} callback triggered per each dis/connected element
   * @param {Document|Element} [root=document] by default, the global document to observe
   * @param {Function} [MO=MutationObserver] by default, the global MutationObserver
   * @param {string[]} [query=['*']] the selectors to use within nodes
   * @returns {MutationObserver}
   */
  var notify = function (callback) {
    var root = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : document;
    var MO = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : MutationObserver;
    var query = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : ['*'];
    var loop = function (nodes, selectors, added, removed, connected, pass) {
      for (var node of nodes) {
        if (pass || QSA$1 in node) {
          if (connected) {
            if (!added.has(node)) {
              added.add(node);
              removed.delete(node);
              callback(node, connected);
            }
          } else if (!removed.has(node)) {
            removed.add(node);
            added.delete(node);
            callback(node, connected);
          }
          if (!pass) loop(node[QSA$1](selectors), selectors, added, removed, connected, TRUE);
        }
      }
    };
    var mo = new MO(function (records) {
      if (query.length) {
        var selectors = query.join(',');
        var added = new Set(),
          removed = new Set();
        for (var _ref3 of records) {
          var addedNodes = _ref3.addedNodes;
          var removedNodes = _ref3.removedNodes;
          loop(removedNodes, selectors, added, removed, FALSE, FALSE);
          loop(addedNodes, selectors, added, removed, TRUE, FALSE);
        }
      }
    });
    var observe = mo.observe;
    (mo.observe = function (node) {
      return observe.call(mo, node, {
        subtree: TRUE,
        childList: TRUE
      });
    })(root);
    return mo;
  };
  var QSA = 'querySelectorAll';
  var _self = self,
    document$2 = _self.document,
    Element$1 = _self.Element,
    MutationObserver$2 = _self.MutationObserver,
    Set$2 = _self.Set,
    WeakMap$1 = _self.WeakMap;
  var elements = function (element) {
    return QSA in element;
  };
  var filter = [].filter;
  var qsaObserver = function (options) {
    var live = new WeakMap$1();
    var drop = function (elements) {
      for (var i = 0, length = elements.length; i < length; i++) live.delete(elements[i]);
    };
    var flush = function () {
      var records = observer.takeRecords();
      for (var i = 0, length = records.length; i < length; i++) {
        parse(filter.call(records[i].removedNodes, elements), false);
        parse(filter.call(records[i].addedNodes, elements), true);
      }
    };
    var matches = function (element) {
      return element.matches || element.webkitMatchesSelector || element.msMatchesSelector;
    };
    var notifier = function (element, connected) {
      var selectors;
      if (connected) {
        for (var q, m = matches(element), i = 0, length = query.length; i < length; i++) {
          if (m.call(element, q = query[i])) {
            if (!live.has(element)) live.set(element, new Set$2());
            selectors = live.get(element);
            if (!selectors.has(q)) {
              selectors.add(q);
              options.handle(element, connected, q);
            }
          }
        }
      } else if (live.has(element)) {
        selectors = live.get(element);
        live.delete(element);
        selectors.forEach(function (q) {
          options.handle(element, connected, q);
        });
      }
    };
    var parse = function (elements) {
      var connected = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : true;
      for (var i = 0, length = elements.length; i < length; i++) notifier(elements[i], connected);
    };
    var query = options.query;
    var root = options.root || document$2;
    var observer = notify(notifier, root, MutationObserver$2, query);
    var attachShadow = Element$1.prototype.attachShadow;
    if (attachShadow) Element$1.prototype.attachShadow = function (init) {
      var shadowRoot = attachShadow.call(this, init);
      observer.observe(shadowRoot);
      return shadowRoot;
    };
    if (query.length) parse(root[QSA](query));
    return {
      drop: drop,
      flush: flush,
      observer: observer,
      parse: parse
    };
  };
  var _self2 = self,
    customElements = _self2.customElements,
    document$1 = _self2.document,
    Element = _self2.Element,
    MutationObserver$1 = _self2.MutationObserver,
    Object$1 = _self2.Object,
    Promise$1 = _self2.Promise,
    Map = _self2.Map,
    Set$1 = _self2.Set,
    WeakMap = _self2.WeakMap,
    Reflect = _self2.Reflect;
  var createElement = document$1.createElement;
  var define = customElements.define,
    get = customElements.get,
    upgrade = customElements.upgrade;
  var _ref2 = Reflect || {
      construct: function (HTMLElement) {
        return HTMLElement.call(this);
      }
    },
    construct = _ref2.construct;
  var defineProperty = Object$1.defineProperty,
    getOwnPropertyNames = Object$1.getOwnPropertyNames,
    setPrototypeOf = Object$1.setPrototypeOf;
  var shadowRoots = new WeakMap();
  var shadows = new Set$1();
  var classes = new Map();
  var defined = new Map();
  var prototypes = new Map();
  var registry = new Map();
  var shadowed = [];
  var query = [];
  var getCE = function (is) {
    return registry.get(is) || get.call(customElements, is);
  };
  var handle = function (element, connected, selector) {
    var proto = prototypes.get(selector);
    if (connected && !proto.isPrototypeOf(element)) {
      var redefine = expando(element);
      override = setPrototypeOf(element, proto);
      try {
        new proto.constructor();
      } finally {
        override = null;
        redefine();
      }
    }
    var method = (connected ? '' : 'dis') + "connectedCallback";
    if (method in proto) element[method]();
  };
  var _qsaObserver = qsaObserver({
      query: query,
      handle: handle
    }),
    parse = _qsaObserver.parse;
  var _qsaObserver2 = qsaObserver({
      query: shadowed,
      handle: function (element, connected) {
        if (shadowRoots.has(element)) {
          if (connected) shadows.add(element);else shadows.delete(element);
          if (query.length) parseShadow.call(query, element);
        }
      }
    }),
    parseShadowed = _qsaObserver2.parse;

  // qsaObserver also patches attachShadow
  // be sure this runs *after* that
  var attachShadow = Element.prototype.attachShadow;
  if (attachShadow) Element.prototype.attachShadow = function (init) {
    var root = attachShadow.call(this, init);
    shadowRoots.set(this, root);
    return root;
  };
  var whenDefined = function (name) {
    if (!defined.has(name)) {
      var _,
        $ = new Promise$1(function ($) {
          _ = $;
        });
      defined.set(name, {
        $: $,
        _: _
      });
    }
    return defined.get(name).$;
  };
  var augment = attributesObserver(whenDefined, MutationObserver$1);
  var override = null;
  getOwnPropertyNames(self).filter(function (k) {
    return /^HTML.*Element$/.test(k);
  }).forEach(function (k) {
    var HTMLElement = self[k];
    function HTMLBuiltIn() {
      var constructor = this.constructor;
      if (!classes.has(constructor)) throw new TypeError('Illegal constructor');
      var _classes$get = classes.get(constructor),
        is = _classes$get.is,
        tag = _classes$get.tag;
      if (is) {
        if (override) return augment(override, is);
        var element = createElement.call(document$1, tag);
        element.setAttribute('is', is);
        return augment(setPrototypeOf(element, constructor.prototype), is);
      } else return construct.call(this, HTMLElement, [], constructor);
    }
    setPrototypeOf(HTMLBuiltIn, HTMLElement);
    defineProperty(HTMLBuiltIn.prototype = HTMLElement.prototype, 'constructor', {
      value: HTMLBuiltIn
    });
    defineProperty(self, k, {
      value: HTMLBuiltIn
    });
  });
  document$1.createElement = function (name, options) {
    var is = options && options.is;
    if (is) {
      var Class = registry.get(is);
      if (Class && classes.get(Class).tag === name) return new Class();
    }
    var element = createElement.call(document$1, name);
    if (is) element.setAttribute('is', is);
    return element;
  };
  customElements.get = getCE;
  customElements.whenDefined = whenDefined;
  customElements.upgrade = function (element) {
    var is = element.getAttribute('is');
    if (is) {
      var constructor = registry.get(is);
      if (constructor) {
        augment(setPrototypeOf(element, constructor.prototype), is);
        // apparently unnecessary because this is handled by qsa observer
        // if (element.isConnected && element.connectedCallback)
        //   element.connectedCallback();
        return;
      }
    }
    upgrade.call(customElements, element);
  };
  customElements.define = function (is, Class, options) {
    if (getCE(is)) throw new Error("'" + is + "' has already been defined as a custom element");
    var selector;
    var tag = options && options.extends;
    classes.set(Class, tag ? {
      is: is,
      tag: tag
    } : {
      is: '',
      tag: is
    });
    if (tag) {
      selector = tag + "[is=\"" + is + "\"]";
      prototypes.set(selector, Class.prototype);
      registry.set(is, Class);
      query.push(selector);
    } else {
      define.apply(customElements, arguments);
      shadowed.push(selector = is);
    }
    whenDefined(is).then(function () {
      if (tag) {
        parse(document$1.querySelectorAll(selector));
        shadows.forEach(parseShadow, [selector]);
      } else parseShadowed(document$1.querySelectorAll(selector));
    });
    defined.get(is)._(Class);
  };
  function parseShadow(element) {
    var root = shadowRoots.get(element);
    parse(root.querySelectorAll(this), element.isConnected);
  }
  var _default = _exports.default = customElements;
});
