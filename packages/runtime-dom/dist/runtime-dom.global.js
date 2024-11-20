var VueRuntimeDOM = (() => {
  var __defProp = Object.defineProperty;
  var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
  var __getOwnPropNames = Object.getOwnPropertyNames;
  var __hasOwnProp = Object.prototype.hasOwnProperty;
  var __export = (target, all) => {
    for (var name in all)
      __defProp(target, name, { get: all[name], enumerable: true });
  };
  var __copyProps = (to, from, except, desc) => {
    if (from && typeof from === "object" || typeof from === "function") {
      for (let key of __getOwnPropNames(from))
        if (!__hasOwnProp.call(to, key) && key !== except)
          __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
    }
    return to;
  };
  var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

  // packages/runtime-dom/src/index.ts
  var src_exports = {};
  __export(src_exports, {
    Fragment: () => Fragment,
    Text: () => Text,
    createRenderer: () => createRenderer,
    createVnode: () => createVnode,
    h: () => h,
    isSameVNode: () => isSameVNode,
    isVnode: () => isVnode,
    normalizeVNode: () => normalizeVNode,
    render: () => render
  });

  // packages/shared/src/shapeFlag.ts
  var manager = 1 << 1;
  var user = 1 << 2;
  var order = 1 << 3;
  var admin = manager | user;

  // packages/shared/src/index.ts
  var isObject = (value) => typeof value == "object" && value !== null;
  var extend = Object.assign;
  var isArray = Array.isArray;
  var isString = (value) => typeof value === "string";

  // packages/runtime-core/src/vnode.ts
  var createVnode = (type, props, children = null) => {
    const shapeFlag = isString(type) ? 1 /* ELEMENT */ : isObject(type) ? 4 /* STATEFUL_COMPONENT */ : 0;
    const vnode = {
      __v_isVnode: true,
      type,
      props,
      children,
      component: null,
      el: null,
      key: props && props.key,
      shapeFlag
    };
    normalizeChildren(vnode, children);
    return vnode;
  };
  function normalizeChildren(vnode, children) {
    let type = 0;
    if (children == null) {
    } else if (isArray(children)) {
      type = 16 /* ARRAY_CHILDREN */;
    } else {
      type = 8 /* TEXT_CHILDREN */;
    }
    vnode.shapeFlag |= type;
  }
  function isVnode(vnode) {
    return vnode.__v_isVnode;
  }
  var Text = Symbol("Text");
  var Fragment = Symbol("Fragment");
  function normalizeVNode(children, i) {
    if (isString(children[i])) {
      let vnode = createVnode(Text, null, children[i]);
      children[i] = vnode;
    }
    return children[i];
  }
  var isSameVNode = (n1, n2) => {
    return n1.type === n2.type && n1.key === n2.key;
  };

  // packages/runtime-core/src/renderer.ts
  function createRenderer(renderOptions2) {
    const {
      insert: hostInsert,
      remove: hostRemove,
      patchProp: hostPatchProp,
      createElement: hostCreateElement,
      createText: hostCreateText,
      createComment: hostCreateComment,
      setText: hostSetText,
      setElementText: hostSetElementText,
      nextSibling: hostNextSibling,
      parentNode: hostParentNode
    } = renderOptions2;
    const mountChildren = (children, container) => {
      for (let i = 0; i < children.length; i++) {
        const child = normalizeVNode(children, i);
        patch(null, child, container);
      }
    };
    const mountElement = (vnode, container, anchor) => {
      const { props, shapeFlag, type, children } = vnode;
      let el = vnode.el = hostCreateElement(type);
      if (props) {
        for (let key in props) {
          hostPatchProp(el, key, null, props[key]);
        }
      }
      if (shapeFlag & 8 /* TEXT_CHILDREN */) {
        hostSetElementText(el, children);
      } else if (shapeFlag & 16 /* ARRAY_CHILDREN */) {
        mountChildren(children, el);
      }
      hostInsert(el, container, anchor);
    };
    const processText = (n1, n2, container) => {
      if (n1 == null) {
        hostInsert(n2.el = hostCreateText(n2.children), container);
      } else {
        const el = n2.el = n1.el;
        if (n1.children !== n2.children) {
          hostSetText(el, n2.children);
        }
      }
    };
    const patchProps = (oldProps, newProps, el) => {
      if (oldProps !== newProps) {
        for (let key in newProps) {
          const prev = oldProps[key];
          const next = newProps[key];
          if (prev !== next) {
            hostPatchProp(el, key, prev, next);
          }
        }
        for (const key in oldProps) {
          if (!(key in newProps)) {
            hostPatchProp(el, key, oldProps[key], null);
          }
        }
      }
    };
    function getSequence(arr) {
      const len = arr.length;
      const result = [0];
      const p = new Array(len).fill(0);
      let start;
      let end;
      let middle;
      let resultLastIndex;
      for (let i2 = 0; i2 < len; i2++) {
        let arrI = arr[i2];
        if (arrI !== 0) {
          resultLastIndex = result[result.length - 1];
          if (arr[resultLastIndex] < arrI) {
            result.push(i2);
            p[i2] = resultLastIndex;
            continue;
          }
          start = 0;
          end = result.length - 1;
          while (start < end) {
            middle = (start + end) / 2 | 0;
            if (arr[result[middle]] < arrI) {
              start = middle + 1;
            } else {
              end = middle;
            }
          }
          if (arr[result[end]] > arrI) {
            result[end] = i2;
            p[i2] = result[end - 1];
          }
        }
      }
      let i = result.length;
      let last = result[i - 1];
      while (i-- > 0) {
        result[i] = last;
        last = p[last];
      }
      return result;
    }
    const patchKeyedChildren = (c1, c2, el) => {
      let i = 0;
      let e1 = c1.length - 1;
      let e2 = c2.length - 1;
      while (i <= e1 && i <= e2) {
        const n1 = c1[i];
        const n2 = c2[i];
        if (isSameVNode(n1, n2)) {
          patch(n1, n2, el);
        } else {
          break;
        }
        i++;
      }
      while (i <= e1 && i <= e2) {
        const n1 = c1[e1];
        const n2 = c2[e2];
        if (isSameVNode(n1, n2)) {
          patch(n1, n2, el);
        } else {
          break;
        }
        e1--;
        e2--;
      }
      if (i > e1) {
        if (i <= e2) {
          while (i <= e2) {
            const nextPos = e2 + 1;
            const anchor = nextPos < c2.length ? c2[nextPos].el : null;
            patch(null, c2[i], el, anchor);
            i++;
          }
        }
      } else if (i > e2) {
        while (i <= e1) {
          unmount(c1[i]);
          i++;
        }
      } else {
        let s1 = i;
        let s2 = i;
        const keyToNewIndexMap = /* @__PURE__ */ new Map();
        for (let i2 = s2; i2 <= e2; i2++) {
          keyToNewIndexMap.set(c2[i2].key, i2);
        }
        const toBePatched = e2 - s2 + 1;
        const newIndexToOldIndexMap = new Array(toBePatched).fill(0);
        for (let i2 = s1; i2 <= e1; i2++) {
          const oldChild = c1[i2];
          let newIndex = keyToNewIndexMap.get(oldChild.key);
          if (newIndex == void 0) {
            unmount(oldChild);
          } else {
            newIndexToOldIndexMap[newIndex - s2] = i2 + 1;
            patch(oldChild, c2[newIndex], el);
          }
        }
        let increasingNewIndexSequence = getSequence(newIndexToOldIndexMap);
        let j = increasingNewIndexSequence.length - 1;
        for (let i2 = toBePatched - 1; i2 >= 0; i2--) {
          let index = i2 + s2;
          let current = c2[index];
          let anchor = index + 1 < c2.length ? c2[index + 1].el : null;
          if (newIndexToOldIndexMap[i2] === 0) {
            patch(null, current, el, anchor);
          } else {
            if (i2 !== increasingNewIndexSequence[j]) {
              hostInsert(current.el, el, anchor);
            } else {
              j--;
            }
          }
        }
      }
    };
    const unmountChildren = (children) => {
      for (let i = 0; i < children.length; i++) {
        unmount(children[i]);
      }
    };
    const patchChildren = (n1, n2, el) => {
      const c1 = n1.children;
      const c2 = n2.children;
      const prevShapeFlag = n1.shapeFlag;
      const shapeFlag = n2.shapeFlag;
      if (shapeFlag & 8 /* TEXT_CHILDREN */) {
        if (prevShapeFlag & 16 /* ARRAY_CHILDREN */) {
          unmountChildren(c1);
        }
        if (c1 !== c2) {
          hostSetElementText(el, c2);
        }
      } else {
        if (prevShapeFlag & 16 /* ARRAY_CHILDREN */) {
          if (shapeFlag & 16 /* ARRAY_CHILDREN */) {
            patchKeyedChildren(c1, c2, el);
          } else {
            unmountChildren(el);
          }
        } else {
          if (prevShapeFlag & 8 /* TEXT_CHILDREN */) {
            hostSetElementText(el, "");
          }
          if (shapeFlag & 16 /* ARRAY_CHILDREN */) {
            mountChildren(c2, el);
          }
        }
      }
    };
    const patchElement = (n1, n2) => {
      let el = n2.el = n1.el;
      let oldProps = n1.props || {};
      let newProps = n2.props || {};
      patchProps(oldProps, newProps, el);
      patchChildren(n1, n2, el);
    };
    const processElement = (n1, n2, container, anchor) => {
      if (n1 == null) {
        mountElement(n2, container, anchor);
      } else {
        patchElement(n1, n2);
      }
    };
    const processFragment = (n1, n2, container, anchor) => {
      if (n1 == null) {
        mountChildren(n2.children, container);
      } else {
        patchChildren(n1, n2, container);
      }
    };
    const patch = (n1, n2, container, anchor = null) => {
      if (n1 === n2) {
        return;
      }
      if (n1 && !isSameVNode(n1, n2)) {
        unmount(n1);
        n1 = null;
      }
      const { shapeFlag, type } = n2;
      switch (type) {
        case Text:
          processText(n1, n2, container);
          break;
        case Fragment:
          processFragment(n1, n2, container, anchor);
          break;
        default:
          if (shapeFlag & 1 /* ELEMENT */) {
            processElement(n1, n2, container, anchor);
          } else if (shapeFlag & 4 /* STATEFUL_COMPONENT */) {
          }
      }
    };
    const unmount = (vnode) => {
      hostRemove(vnode.el);
    };
    const render2 = (vnode, container) => {
      if (vnode == null) {
        if (container._vnode) {
          unmount(container._vnode);
        }
      } else {
        patch(container._vnode || null, vnode, container);
      }
      container._vnode = vnode;
    };
    return { render: render2 };
  }

  // packages/runtime-core/src/h.ts
  function h(type, propsOrChildren, children) {
    const l = arguments.length;
    if (l == 2) {
      if (isObject(propsOrChildren) && !isArray(propsOrChildren)) {
        if (isVnode(propsOrChildren)) {
          return createVnode(type, null, [propsOrChildren]);
        }
        return createVnode(type, propsOrChildren);
      } else {
        return createVnode(type, null, propsOrChildren);
      }
    } else {
      if (l > 3) {
        children = Array.from(arguments).slice(2);
      } else if (l === 3 && isVnode(children)) {
        children = [children];
      }
      return createVnode(type, propsOrChildren, children);
    }
  }

  // packages/runtime-dom/src/nodeOps.ts
  var nodeOps = {
    createElement: (tagName) => document.createElement(tagName),
    remove: (child) => {
      const parent = child.parentNode;
      if (parent) {
        parent.removeChild(child);
      }
    },
    insert: (child, parent, anchor = null) => {
      parent.insertBefore(child, anchor);
    },
    querySelector: (selector) => document.querySelector(selector),
    setElementText: (el, text) => el.textContent = text,
    createText: (text) => document.createTextNode(text),
    setText: (node, text) => node.nodeValue = text,
    nextSibling: (node) => node.nextSibling,
    parentNode: (node) => node.parentNode
  };

  // packages/runtime-dom/src/patchProp.ts
  var patchClass = (el, value) => {
    if (value == null) {
      value = "";
    }
    el.className = value;
  };
  var patchStyle = (el, prev, next) => {
    const style = el.style;
    if (next == null) {
      el.removeAttribute("style");
    } else {
      if (prev) {
        for (let key in prev) {
          if (next[key] == null) {
            style[key] = "";
          }
        }
      }
      for (let key in next) {
        style[key] = next[key];
      }
    }
  };
  var patchEvent = (el, key, value) => {
    const invokers = el._vei || (el._vei = {});
    const exists = invokers[key];
    if (value && exists) {
      exists.value = value;
    } else {
      const eventName = key.slice(2).toLowerCase();
      if (value) {
        let invoker = invokers[key] = createInvoker(value);
        el.addEventListener(eventName, invoker);
      } else {
        el.removeEventListener(eventName, exists);
        invokers[key] = void 0;
      }
    }
  };
  function createInvoker(value) {
    const invoker = (e) => {
      invoker.value(e);
    };
    invoker.value = value;
    return invoker;
  }
  var patchAttr = (el, key, value) => {
    if (value = null) {
      el.removeAttribute(key);
    } else {
      el.setAttribute(key, value);
    }
  };
  var patchProp = (el, key, prevValue, nextValue) => {
    switch (key) {
      case "class":
        patchClass(el, nextValue);
        break;
      case "style":
        patchStyle(el, prevValue, nextValue);
        break;
      default:
        if (/^on[^a-z]/.test(key)) {
          patchEvent(el, key, nextValue);
        } else {
          patchAttr(el, key, nextValue);
        }
        break;
    }
  };

  // packages/runtime-dom/src/index.ts
  var renderOptions = extend({ patchProp }, nodeOps);
  function render(vnode, container) {
    createRenderer(renderOptions).render(vnode, container);
  }
  return __toCommonJS(src_exports);
})();
//# sourceMappingURL=runtime-dom.global.js.map
