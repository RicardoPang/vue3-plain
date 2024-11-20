import { createRenderer } from '@vue/runtime-core';
import { extend } from '@vue/shared';
import { nodeOps } from './nodeOps';
import { patchProp } from './patchProp';

// 准备好所有渲染时所需要的的属性 (domAPI 属性api)
const renderOptions = extend({ patchProp }, nodeOps);

export function render(vnode, container) {
  createRenderer(renderOptions).render(vnode, container);
}

export * from '@vue/runtime-core';
