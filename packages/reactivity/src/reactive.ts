import { isObject } from '@vue/shared';
import { mutableHandlers, ReactiveFlags } from './baseHandlers';

export function isReactive(value) {
  return !!(value && value[ReactiveFlags.IS_REACTIVE]);
}

// 1.将数据转换成响应式的数据
const receiveMap = new WeakMap(); // key只能是对象
// 实现同一个对象 代理多次 返回同一个代理
// 代理对象被再次代理 可以直接返回
export function reactive(target) {
  if (!isObject(target)) {
    return;
  }
  if (target[ReactiveFlags.IS_REACTIVE]) {
    return target;
  }
  // 并没有重新定义属性 只是代理 在取值的时候会调用get 当赋值值的时候会调用set
  let existingProxy = receiveMap.get(target);
  if (existingProxy) {
    return existingProxy;
  }
  const proxy = new Proxy(target, mutableHandlers);
  receiveMap.set(target, proxy);
  return proxy;
}
