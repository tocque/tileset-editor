import { produce } from "immer";
import { uniqueId } from "lodash-es";

type PrimitiveType = number | string | boolean;

export interface Command<T extends any[], R> {
  /**
   * 执行命令
   * @param args 命令的参数，该参数会反复使用，因此不允许更改
   * @returns 供撤销使用的信息，该参数会反复使用，因此不允许更改
   */
  exec: (...args: Readonly<T>) => R extends PrimitiveType ? R : Readonly<R>;
  /**
   * 撤销命令
   * @param record 执行该命令时生成的撤销信息
   */
  discard: (record: R extends PrimitiveType ? R : Readonly<R>) => void;
  /**
   * 是否可合并
   * 目前仅支持简单合并，即 merge([undo1, redo1], [undo2, redo2]) => [undo1, redo2]
   */
  mergeable?: boolean;
}

export const defineCommand = <T extends any[], R>(command: Command<T, R>) => command;

export type EditStackPOD = Readonly<{
  stack: Readonly<[undo: () => void, redo: () => void, id: string][]>;
  /** 当前应用的指令的数量 */
  current: number;
  capacity: number;
}>;

export class EditStack {

  /** 编辑栈内指令的数量 */
  static size(editStack: EditStackPOD) {
    return editStack.stack.length;
  }

  /** 是否能undo，等价于 current > 0 */
  static canUndo(editStack: EditStackPOD) {
    return editStack.current > 0;
  }

  /** 是否能redo，等价于 size > current */
  static canRedo(editStack: EditStackPOD) {
    const size = EditStack.size(editStack);
    return editStack.current < size;
  }

  static create(capacity: number): EditStackPOD {
    return {
      stack: [],
      current: 0,
      capacity,
    };
  }

  static registerCommand<T extends any[], R>(command: Command<T, R>): (editStack: EditStackPOD, ...args: T) => EditStackPOD {
    const id = uniqueId("command");
    return (editStack: EditStackPOD, ...args: T) => {
      const record = command.exec(...args);
      return produce(editStack, (draft) => {
        const { capacity } = draft;
        if (draft.current < draft.stack.length) {
          draft.stack = draft.stack.slice(0, draft.current);
        }
        const stack = draft.stack;
        if (command.mergeable && stack.length > 0 && stack.at(-1)![2] === id) {
          const [undo] = stack.pop()!;
          stack.push([
            undo,
            () => command.exec(...args),
            id,
          ]);
        } else {
          stack.push([
            () => command.discard(record),
            () => command.exec(...args),
            id,
          ]);
          if (stack.length > capacity) {
            stack.shift();
          } else {
            draft.current++;
          }
        }
      });
    };
  }

  static undo(editStack: EditStackPOD): EditStackPOD {
    const { stack, current } = editStack; 
    const canUndo = EditStack.canUndo(editStack);
    if (!canUndo) {
      throw Error("editStack undo failed");
    }
    const [undo] = stack[current-1];
    undo();
    return {
      ...editStack,
      current: current - 1,
    };
  }

  static redo(editStack: EditStackPOD): EditStackPOD {
    const { stack, current } = editStack; 
    const canRedo = EditStack.canRedo(editStack);
    if (!canRedo) {
      throw Error("editStack redo failed");
    }
    const [_, redo] = stack[current];
    redo();
    return {
      ...editStack,
      current: current + 1,
    };
  }
}
