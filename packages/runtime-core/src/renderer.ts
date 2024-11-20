import { ShapeFlags } from 'packages/shared/src/shapeFlag';
import { Fragment, isSameVNode, normalizeVNode, Text } from './vnode';

export function createRenderer(renderOptions) {
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
    parentNode: hostParentNode,
  } = renderOptions;

  const mountChildren = (children, container) => {
    for (let i = 0; i < children.length; i++) {
      // 递归挂载
      const child = normalizeVNode(children, i); // 处理后要进行替换，否则children中存放的已经是字符串
      patch(null, child, container);
    }
  };

  const mountElement = (vnode, container, anchor) => {
    const { props, shapeFlag, type, children } = vnode;
    let el = (vnode.el = hostCreateElement(type)); // 将真实元素挂载到这个虚拟节点上 后续用于复用节点和更新
    if (props) {
      for (let key in props) {
        hostPatchProp(el, key, null, props[key]);
      }
    }
    // 父亲创建完 需要创建儿子
    if (shapeFlag & ShapeFlags.TEXT_CHILDREN) {
      // 文本
      hostSetElementText(el, children);
    } else if (shapeFlag & ShapeFlags.ARRAY_CHILDREN) {
      // 数组
      mountChildren(children, el);
    }
    hostInsert(el, container, anchor);
  };

  const processText = (n1, n2, container) => {
    if (n1 == null) {
      hostInsert((n2.el = hostCreateText(n2.children)), container);
    } else {
      // 文本的内容变化了 我可以复用老的节点
      const el = (n2.el = n1.el);
      if (n1.children !== n2.children) {
        hostSetText(el, n2.children); // 文本的更新
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

  // 求最长递增子序列的个数（贪心算法+二分查找）
  function getSequence(arr) {
    const len = arr.length;
    const result = [0]; // 以默认第0个为基准来做序列
    const p = new Array(len).fill(0); // 最后要标记索引 放的东西不用关心 但是要和数组一样长

    let start;
    let end;
    let middle;
    let resultLastIndex;
    for (let i = 0; i < len; i++) {
      let arrI = arr[i];
      if (arrI !== 0) {
        // 因为vue里面的序列中0意味着需要创建
        resultLastIndex = result[result.length - 1];
        if (arr[resultLastIndex] < arrI) {
          // 比较最后一项和当前项的值，如果比最后一项大，则将当前索引放到结果集中
          result.push(i);
          p[i] = resultLastIndex; //当前放到末尾的要记住它前面的那个人是谁
          continue;
        }
        // 这里我们需要通过二分查找，在结果集中找到比当前值大的，用当前值的索引将其替换掉
        // 递增序列，采用二分查找是最快的
        start = 0;
        end = result.length - 1;
        while (start < end) {
          // start===end的时候就停止了，这个二分查找再找索引
          middle = ((start + end) / 2) | 0;
          if (arr[result[middle]] < arrI) {
            start = middle + 1;
          } else {
            end = middle;
          }
        }
        // 找到中间值之后 我们需要做替换操作 start / end
        if (arr[result[end]] > arrI) {
          // 这里用当前这一项，替换掉已有的比当前大的那一项。更有潜力的我需要
          result[end] = i;
          p[i] = result[end - 1]; // 记住它的前一个人是谁
        }
      }
    }

    // 通过最后一项进行回溯
    let i = result.length;
    let last = result[i - 1]; // 找到最后一项了
    while (i-- > 0) {
      // 倒序追溯
      result[i] = last; // 最后一项是确定的
      last = p[last];
    }

    return result;
  }

  const patchKeyedChildren = (c1, c2, el) => {
    // 比较两个儿子的差异
    let i = 0;
    let e1 = c1.length - 1;
    let e2 = c2.length - 1;

    // sync from start
    while (i <= e1 && i <= e2) {
      // 有任何一方停止循环则直接跳出
      const n1 = c1[i];
      const n2 = c2[i];
      if (isSameVNode(n1, n2)) {
        patch(n1, n2, el); // 这样做就是比较两个节点的属性和子节点
      } else {
        break;
      }
      i++;
    }

    // syan from end
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

    // common sequence + mount
    // i要比e1大说明有新增
    // i和e2之间的是新增的部分
    if (i > e1) {
      if (i <= e2) {
        while (i <= e2) {
          const nextPos = e2 + 1;
          // 根据下一个人的索引来看参照物
          const anchor = nextPos < c2.length ? c2[nextPos].el : null;
          patch(null, c2[i], el, anchor); // 创建新节点 扔到容器中
          i++;
        }
      }
    } else if (i > e2) {
      // common sequence + unmount
      // i比e2大说明有要卸载的
      // i到e1之间的就是要卸载的
      while (i <= e1) {
        unmount(c1[i]);
        i++;
      }
    } else {
      // 乱序比对
      let s1 = i;
      let s2 = i;
      const keyToNewIndexMap = new Map(); // key -> newIndex
      for (let i = s2; i <= e2; i++) {
        keyToNewIndexMap.set(c2[i].key, i);
      }

      // 循环老的元素，看一下新的里面有没有 如果有说明要比较差异，没有要添加到列表中，老的有新的没有要删除
      const toBePatched = e2 - s2 + 1; // 新的总个数
      const newIndexToOldIndexMap = new Array(toBePatched).fill(0); // 一个记录是否对比过的映射表
      for (let i = s1; i <= e1; i++) {
        const oldChild = c1[i]; // 老的孩子
        let newIndex = keyToNewIndexMap.get(oldChild.key); // 用老的孩子去新的里面找
        if (newIndex == undefined) {
          unmount(oldChild); // 多余的删掉
        } else {
          // 新的位置对应老的位置，如果数组里放的值大于0说明已经patch过了
          newIndexToOldIndexMap[newIndex - s2] = i + 1; // 用来标记当前所patch过的结果
          patch(oldChild, c2[newIndex], el);
        }
      } // 到这这是新老属性和儿子的比对，没有移动位置

      // 获取最长递增子序列
      let increasingNewIndexSequence = getSequence(newIndexToOldIndexMap);
      let j = increasingNewIndexSequence.length - 1; // 取出最后一个的索引
      // 需要移动位置
      for (let i = toBePatched - 1; i >= 0; i--) {
        // 3 2 1 0
        let index = i + s2;
        let current = c2[index]; // 找到h
        let anchor = index + 1 < c2.length ? c2[index + 1].el : null;
        if (newIndexToOldIndexMap[i] === 0) {
          // 创建 [5 3 4 0] -> [1 2]
          patch(null, current, el, anchor);
        } else {
          // 不是0，说明已经比对过
          if (i !== increasingNewIndexSequence[j]) {
            hostInsert(current.el, el, anchor); // 目前无论如何都做了一遍倒序插入，其实可以不用的，可以根据刚才的数组来减少次数
          } else {
            j--; // 跳过不需要移动的元素，为了减少移动操作，需要这个最长递增子序列的算法
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
    // 做两个虚拟节点的儿子比较
    const c1 = n1.children;
    const c2 = n2.children;

    // 老的有儿子新的没儿子 新的有儿子老的没儿子 新老都有儿子 新老都是文本
    const prevShapeFlag = n1.shapeFlag; // 之前的
    const shapeFlag = n2.shapeFlag; // 之后的
    if (shapeFlag & ShapeFlags.TEXT_CHILDREN) {
      if (prevShapeFlag & ShapeFlags.ARRAY_CHILDREN) {
        // 删除所有子节点
        unmountChildren(c1); // 文本 数据（删除老儿子，设置文本内容）
      }
      if (c1 !== c2) {
        // 文本 文本（更新文本即可，包括了文本和空）
        hostSetElementText(el, c2);
      }
    } else {
      // 现在为数组或者为空
      if (prevShapeFlag & ShapeFlags.ARRAY_CHILDREN) {
        if (shapeFlag & ShapeFlags.ARRAY_CHILDREN) {
          // 数组 数组（diff算法）
          patchKeyedChildren(c1, c2, el);
        } else {
          // 现在不是数组（文本和空，删除以前的）
          unmountChildren(el); // 空 数组（删除所有儿子）
        }
      } else {
        if (prevShapeFlag & ShapeFlags.TEXT_CHILDREN) {
          hostSetElementText(el, ''); // 数组 文本（清空文本，进行挂载）
        }
        if (shapeFlag & ShapeFlags.ARRAY_CHILDREN) {
          mountChildren(c2, el); // 数组 文本（清空文本，进行挂载）
        }
      }
    }
  };

  const patchElement = (n1, n2) => {
    // 先复用节点 比较熟悉 再比较儿子
    let el = (n2.el = n1.el);

    let oldProps = n1.props || {};
    let newProps = n2.props || {};

    patchProps(oldProps, newProps, el);
    patchChildren(n1, n2, el);
  };

  const processElement = (n1, n2, container, anchor) => {
    if (n1 == null) {
      mountElement(n2, container, anchor);
    } else {
      // 元素更新
      patchElement(n1, n2);
    }
  };

  const processFragment = (n1, n2, container, anchor) => {
    if (n1 == null) {
      mountChildren(n2.children, container);
    } else {
      patchChildren(n1, n2, container); // 走的是diff算法
    }
  };

  const patch = (n1, n2, container, anchor = null) => {
    // 核心的patch方法 (n2可能是一个文本)
    if (n1 === n2) {
      return;
    }
    // debugger;
    if (n1 && !isSameVNode(n1, n2)) {
      // 判断两个元素是否相同 不相同卸载再添加
      unmount(n1); // 删除老的
      n1 = null;
    }
    const { shapeFlag, type } = n2;
    switch (type) {
      case Text:
        processText(n1, n2, container);
        break;
      case Fragment: // 无用的标签
        processFragment(n1, n2, container, anchor);
        break;
      default:
        if (shapeFlag & ShapeFlags.ELEMENT) {
          processElement(n1, n2, container, anchor);
        } else if (shapeFlag & ShapeFlags.STATEFUL_COMPONENT) {
          // processComponent(n1, n2, container);
        }
    }
  };

  const unmount = (vnode) => {
    hostRemove(vnode.el);
  };

  const render = (vnode, container) => {
    // 渲染过程是用你传入的renderOptions来渲染
    if (vnode == null) {
      // 卸载逻辑
      if (container._vnode) {
        unmount(container._vnode); // 之前确实渲染过了 那么就卸载掉dom
      }
    } else {
      // 这里既有初始化的逻辑 又有更新的逻辑
      patch(container._vnode || null, vnode, container);
    }
    container._vnode = vnode;
  };

  return { render };
}

// 文本的处理需要自己增加类型 因为不能通过 document.createElement('文本')
// 我们如果传入null的时候在渲染时 则是卸载逻辑 需要将dom节点删掉
// 更新逻辑思考
//  1.如果前后完全没关系 删除老的 添加新的
//  2.老的和新的一样 复用, 属性可能不一样 在比对属性 更新属性
//  3.比儿子
