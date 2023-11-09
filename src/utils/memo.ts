export class MemoTable<K, V> {
  private readonly map = new Map<K, V>();

  get(key: K, creator: () => V): V {
    if (this.map.has(key)) {
      return this.map.get(key)!;
    }
    const value = creator();
    this.map.set(key, value);
    return value;
  }
}

const isEqualDeps = (a: any[], b: any[]) => {
  if (a.length !== b.length) return false;
  return a.every((e, i) => e === b[i]);
};

/**
 * 短记忆值，即只记录上一个值，如果当前参数与上一次的参数不同则重新计算
 */
export const createShortMemoValue = <P extends any[], R>(cal: (...args: P) => R): ((...args: P) => R) => {
  let last: [P, R] | undefined = void 0;
  return (...args: P) => {
    if (!last || !isEqualDeps(last[0], args)) {
      const res = cal(...args);
      last = [args, res];
    }
    return last[1];
  };
};
