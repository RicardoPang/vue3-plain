export let activeEffect = undefined;

function cleanupEffect(effect) {
  const { deps } = effect; // deps里面装的是name对应的effect
  for (let i = 0; i < deps.length; i++) {
    deps[i].delete(effect); // 解除effect 重新依赖收集
  }
  effect.deps.length = 0;
}

export class ReactiveEffect {
  public parent = null;
  public deps = [];
  public active = true; // 这个effect默认是激活状态
  constructor(public fn, public scheduler) {}
  run() {
    // run就是执行effect
    if (!this.active) {
      this.fn(); // 这里表示如果是非激活情况 只需要执行函数 不需要进行依赖收集
    }

    // 这里就要依赖收集了 核心就是将当前的effect和稍后渲染的属性关联在一起
    try {
      this.parent = activeEffect;
      activeEffect = this;

      // 这里我们需要再执行用户函数之前收集的内容清空 activeEffect.deps = [(Set),(Set)]
      cleanupEffect(this);

      return this.fn(); // 当稍后调用取值操作的时候 就可以获取到这个全局的activeEffect
    } finally {
      activeEffect = this.parent;
    }
  }
  stop() {
    if (this.active) {
      this.active = false;
      cleanupEffect(this); // 停止effect的收集
    }
  }
}

export function effect(fn, options: any = {}) {
  // 这里fn可以根据状态变化 重新执行 effect可以嵌套着写
  const _effect = new ReactiveEffect(fn, options.scheduler); // 创建响应式的effect
  _effect.run(); // 默认先执行一次

  const runner = _effect.run.bind(_effect); // 绑定this执行
  runner.effect = _effect; // 将effect挂载到runner函数上
  return runner;
}

// 一个effect对应多个属性 一个属性对应多个effect 多对多
const targetMap = new WeakMap(); // WeakMap = {对象: Map{name: Set(effect)}}
export function track(target, type, key) {
  if (!activeEffect) return;
  let depsMap = targetMap.get(target); // 第一次没有
  if (!depsMap) {
    targetMap.set(target, (depsMap = new Map()));
  }
  let dep = depsMap.get(key);
  if (!dep) {
    depsMap.set(key, (dep = new Set()));
  }
  trackEffects(dep);
}

export function trackEffects(dep) {
  if (activeEffect) {
    let shouldTrack = !dep.has(activeEffect);
    if (shouldTrack) {
      dep.add(activeEffect);
      activeEffect.deps.push(dep); // 让effect记录住对应的dep 稍后清理的时候会用到
    }
  }
}

export function trigger(target, type, key, value, oldValue) {
  const depsMap = targetMap.get(target);
  if (!depsMap) {
    // 触发的值不在模板中使用
    return;
  }
  let effects = depsMap.get(key); // 找到了属性对应的effect

  // 永远在执行之前 先拷贝一份来执行 不要关联引用
  if (effects) {
    triggerEffects(effects);
  }
}

export function triggerEffects(effects) {
  effects = new Set(effects);
  effects.forEach((effect) => {
    // 我们在执行effect的时候 又要执行自己 那我们需要屏蔽掉 不要无限调用
    if (effect !== activeEffect) {
      if (effect.scheduler) {
        effect.scheduler(); // 如果用户传入了调度函数 则用用户的
      } else {
        effect.run(); // 否则默认刷新视图
      }
    }
  });
}

// 1.我们先搞了一个响应式对象 new Proxy
// 2.effect 默认数据变化要能更新 我们先将正在执行的effect作为全局变量 渲染(取值) 我们在get方法中进行依赖收集
// 3.weakmap 对象: map(属性: set(effect))
// 4.稍后用户发生数据变化 会通过对象属性来查找对应的effect集合 找到effect全部执行
