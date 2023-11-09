import { withResolvers } from './polyfill';

export const sleep = async (time: number) => {
  const { promise, resolve } = withResolvers<void>();
  setTimeout(resolve, time);
  return promise;
};
