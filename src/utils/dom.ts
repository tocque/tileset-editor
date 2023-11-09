import { once } from 'lodash-es';
import { withResolvers } from './polyfill';

export type DOMListener<T extends keyof HTMLElementEventMap> = (e: HTMLElementEventMap[T]) => void;

export const listenOnce = async <T extends keyof HTMLElementEventMap>(elm: HTMLElement, type: T, emit: () => void) => {
  const { promise, resolve } = withResolvers<HTMLElementEventMap[T]>();
  const listener = (e: HTMLElementEventMap[T]) => {
    resolve(e);
    elm.removeEventListener(type, listener);
  };
  elm.addEventListener(type, listener);
  emit();
  return promise;
};

export const getMouseUplistenerSet = once(() => {
  const listenerSet = new Set<DOMListener<'mouseup'>>();
  window.addEventListener('mouseup', (e) => {
    listenerSet.forEach((listener) => {
      listener(e);
    });
  });
  return listenerSet;
});
