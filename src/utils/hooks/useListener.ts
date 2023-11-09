import { useEffect } from "react";
import { DOMListener, getMouseUplistenerSet } from "../dom"

export const useMouseUp = (listener: DOMListener<'mouseup'>) => {
  const set = getMouseUplistenerSet();
  useEffect(() => {
    const wrapper: DOMListener<'mouseup'> = (e) => listener(e);
    set.add(wrapper);
    return () => {
      set.delete(wrapper);
    }
  }, []);
}
