import { Atom, PrimitiveAtom, atom, getDefaultStore, useAtomValue } from "jotai";
import { isFunction } from "lodash-es";

type StoreData = Record<string, any>;

export type Setter<T> = T | ((old: T) => T);
export type Updater<T extends StoreData> = Partial<T> | ((old: T) => Partial<T>);

export const execSetter = <T>(setter: Setter<T>, old: T): T => {
  return isFunction(setter) ? setter(old) : setter;
};

export const execUpdater = <T extends StoreData>(updater: Updater<T>, old: T): T => {
  const patch = execSetter(updater as Setter<Partial<T>>, old);
  return { ...old, ...patch };
}

const defaultStore = getDefaultStore();

export const getAtomValue = <S>(atom: Atom<S>) => defaultStore.get(atom);

export const setAtom = <S>(atom: PrimitiveAtom<S>, setter: Setter<S>): S => {
  const old = getAtomValue(atom);
  defaultStore.set(atom, execSetter(setter, old));
  return old;
};

type AtomUpdater<S extends StoreData> = (updater: Updater<S>) => S;
export const updateAtom = <S extends StoreData>(atom: PrimitiveAtom<S>, updater: Updater<S>): S => {
  const old = getAtomValue(atom);
  defaultStore.set(atom, execUpdater(updater, old));
  return old;
};

interface Store<S extends StoreData, G extends StoreData> {
  use: () => Awaited<S> & Readonly<Awaited<G>>;
  readonly current: Awaited<S> & Readonly<Awaited<G>>;
  set: (setter: Setter<S>) => S;
  update: (updater: Updater<S>) => S;
}

export function defineStore<S extends StoreData>(value: S): Store<S, Record<string, never>>;
export function defineStore<S extends StoreData, G extends StoreData>(value: S, read: (state: S) => G): Store<S, G>;
export function defineStore<S extends StoreData, G extends StoreData>(value: S, read?: (state: S) => G) {
  const stateAtom = atom(value);
  if (!read) {
    const useStore = () => useAtomValue(stateAtom);
    return {
      use: useStore,
      get current() {
        return getAtomValue(stateAtom)
      },
      set: (setter: Setter<S>) => setAtom(stateAtom, setter),
      update: (updater: Updater<S>) => updateAtom(stateAtom, updater),
    };
  }
  const getterAtom = atom((get) => {
    const state = get(stateAtom);
    const getters = read(state);
    return {
      ...state,
      ...getters,
    };
  });
  const useStore = () => useAtomValue(getterAtom);
  return {
    use: useStore,
    get current() {
      return getAtomValue(getterAtom)
    },
    set: (setter: Setter<S>) => setAtom(stateAtom, setter),
    update: (updater: Updater<S>) => updateAtom(stateAtom, updater),
  };
}

export const defineGetter = <G>(read: Atom<G>['read']) => {
  const rawAtom = atom(read);
  const useGetter = () => useAtomValue(rawAtom);
  return {
    use: useGetter,
    get current() {
      return getAtomValue(rawAtom)
    },
  }
}
