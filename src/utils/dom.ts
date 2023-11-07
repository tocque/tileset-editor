import { withResolvers } from "./polyfill";

export const listenOnce = async <T extends keyof HTMLElementEventMap>(elm: HTMLElement, type: T, emit: () => void) => {
  const { promise, resolve } = withResolvers<HTMLElementEventMap[T]>();
  const listener = (e: HTMLElementEventMap[T]) => {
    resolve(e);
    elm.removeEventListener(type, listener);
  };
  elm.addEventListener(type, listener);
  emit();
  return promise;
}
