export const changeByMove = <T>(list: T[], from: number, to: number) => {
  if (from === to) {
    return list;
  }
  if (from < to) {
    return [...list.slice(0, from), ...list.slice(from + 1, to + 1), list[from], ...list.slice(to + 1)];
  } else {
    return [...list.slice(0, to), list[from], ...list.slice(to, from), ...list.slice(from + 1)];
  }
};

export const useArray = <T>(array: T[], setter: (val: T[]) => void) => {
  const set = (value: T[]) => {
    setter(value);
  };
  const append = (initValue: T) => {
    setter([...array, initValue]);
  };
  const assign = (index: number, newValue: T) => {
    setter(array.with(index, newValue));
  };
  const update = (index: number, newValue: Partial<T>) => {
    setter(array.with(index, { ...array[index], ...newValue }));
  };
  const remove = (index: number) => {
    setter(array.toSpliced(index, 1));
  };
  const move = (from: number, to: number) => {
    setter(changeByMove(array, from, to));
  };
  const withHelper = () => {
    return array.map(
      (e, i) =>
        [
          e,
          {
            assign: (val: T) => assign(i, val),
            update: (val: Partial<T>) => update(i, val),
            remove: () => remove(i),
          },
        ] as const,
    );
  };

  return {
    data: array,
    withHelper,
    set,
    assign,
    update,
    remove,
    append,
    move,
  };
};
