import { Atom, PrimitiveAtom, atom, getDefaultStore, useAtomValue } from "jotai";
import { isFunction } from "lodash-es";

type Store = Record<string, any>;

export type Setter<T> = T | ((old: T) => T);
export type Updater<T extends Store> = Partial<T> | ((old: T) => Partial<T>);

export const execSetter = <T>(setter: Setter<T>, old: T): T => {
  return isFunction(setter) ? setter(old) : setter;
};

export const execUpdater = <T extends Store>(updater: Updater<T>, old: T): T => {
  const patch = execSetter(updater as Setter<Partial<T>>, old);
  return { ...old, ...patch };
}

const defaultStore = getDefaultStore();

export const getValue = <S>(atom: Atom<S>) => defaultStore.get(atom);

export const setAtom = <S>(atom: PrimitiveAtom<S>, setter: Setter<S>): S => {
  const old = getValue(atom);
  defaultStore.set(atom, execSetter(setter, old));
  return old;
};

type AtomUpdater<S extends Store> = (updater: Updater<S>) => S;
export const updateAtom = <S extends Store>(atom: PrimitiveAtom<S>, updater: Updater<S>): S => {
  const old = getValue(atom);
  defaultStore.set(atom, execUpdater(updater, old));
  return old;
};

export function defineStore<S extends Store>(value: S): [() => Awaited<S>, AtomUpdater<S>, PrimitiveAtom<S> & { init: S }];
export function defineStore<S extends Store, G extends Store>(value: S, read: (state: S) => G): [() => Awaited<S & G>, AtomUpdater<S>, Atom<S & G>, PrimitiveAtom<S> & { init: S }];
export function defineStore<S extends Store, G extends Store>(value: S, read?: (state: S) => G) {
  const stateAtom = atom(value);
  if (!read) {
    return [
      () => useAtomValue(stateAtom),
      (updater: Updater<S>) => updateAtom(stateAtom, updater),
      stateAtom,
    ];
  }
  const getterAtom = atom((get) => {
    const state = get(stateAtom);
    const getters = read(state);
    return {
      ...state,
      ...getters,
    };
  });
  return [
    () => useAtomValue(getterAtom),
    (updater: Updater<S>) => updateAtom(stateAtom, updater),
    getterAtom,
    stateAtom,
  ] as const;
}

export const defineGetter = <G>(read: (get: <T>(atom: Atom<T>) => T) => G) => {
  const rawAtom = atom(read);
  return () => useAtomValue(rawAtom);
}
