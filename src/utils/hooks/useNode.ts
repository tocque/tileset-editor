import { useState } from "react";

export const useNode = <T>() => {
  const [node, setNode] = useState<T | null>(null);

  const mount = (val: T | null) => {
    setNode(val);
  }

  return [
    node,
    mount,
  ] as const;
};
