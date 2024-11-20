import { isArray, isObject } from '@vue/shared';
import { reactive } from './reactive';
import { trackEffects, triggerEffects } from './effect';

function toReactive(value) {
  return isObject(value) ? reactive(value) : value;
}

class RefImpl {
  public dep = new Set();
  public _value;
  public __v_isRef = true;
  constructor(public rawValue) {
    this._value = toReactive(rawValue);
  }
  get value() {
    trackEffects(this.dep);
    return this._value;
  }
  set value(newValue) {
    if (newValue !== this.rawValue) {
      this._value = toReactive(newValue);
      this.rawValue = newValue;
      triggerEffects(this.dep);
    }
  }
}

export function ref(value) {
  return new RefImpl(value);
}

class ObjectRefImpl {
  constructor(public target, public key) {}
  get value() {
    // 代理
    return this.target[this.key];
  }
  set value(newValue) {
    this.target[this.key] = newValue;
  }
}

export function toRef(target, key) {
  return new ObjectRefImpl(target, key);
}

export function toRefs(object) {
  const result = isArray(object) ? new Array(object.length) : {};
  for (let key in object) {
    result[key] = toRef(object, key);
  }
  return result;
}

export function proxyRefs(object) {
  return new Proxy(object, {
    get(target, key, receiver) {
      let r = Reflect.get(target, key, receiver);
      return r.__v_isRef ? r.value : r;
    },
    set(target, key, value, receiver) {
      let oldValue = target[key];
      if (oldValue.__v_isRef) {
        oldValue.value = value;
        return true;
      } else {
        return Reflect.set(target, key, value, receiver);
      }
    },
  });
}