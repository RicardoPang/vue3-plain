// h的用法 h('div')

import { isArray, isObject } from '@vue/shared';
import { createVnode, isVnode } from './vnode';

// h('div',{style:{color: 'red'}}, 'hello)
// h('div', 'hello)

// h('div', null, 'hello', 'world')
// h('div', null, h('span'))
// h('div', null, [h('span')])
export function h(type, propsOrChildren, children) {
  // 其余的除了3个之外的肯定是孩子
  const l = arguments.length;
  if (l == 2) {
    // 如果propsOrChildren是数组 直接作为第三个参数
    if (isObject(propsOrChildren) && !isArray(propsOrChildren)) {
      if (isVnode(propsOrChildren)) {
        return createVnode(type, null, [propsOrChildren]); // 虚拟节点包装成数组 因为元素可以循环创建
      }
      return createVnode(type, propsOrChildren); // 属性
    } else {
      // 如果第二个参数 不是对象 那一定是孩子
      return createVnode(type, null, propsOrChildren); // 数组
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
