import { useRef } from 'react';

export const useResolver = <T>() => {
  const resolverRef = useRef<(val: T) => void>();

  const start = () => {
    if (resolverRef.current) {
      throw new Error('last promise not resolved');
    }
    return new Promise<T>((res) => {
      resolverRef.current = res;
    });
  };

  const resolve = (val: T) => {
    if (!resolverRef.current) {
      throw new Error('resolve before start');
    }
    resolverRef.current(val);
    resolverRef.current = void 0;
  };

  return {
    start,
    resolve,
  };
};
