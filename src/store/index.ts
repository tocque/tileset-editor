import { GridPOD, Loc, LocPOD, Rect, RectPOD } from "@/utils/coordinate";
import { Command, EditStack, EditStackPOD } from "@/utils/editStack";
import { StoreApi, create } from "zustand";
import { combine } from "zustand/middleware";
import { produce, Draft } from "immer";
import { Tile, TileHelper } from "@/utils/tile";
import { copyCanvas, createEmptyCanvas, hueRotate, resizeWithContent } from "@/utils/canvas";
import { useMemo } from "react";

interface DrawingBoard {
  context: CanvasRenderingContext2D;
  version: number;
  fileHandle?: FileSystemFileHandle;
}

export interface Reference {
  id: string;
  name: string;
  source: HTMLImageElement;
  opacity: number;
  hue: number;
  selection?: RectPOD;
}

interface ReferenceList {
  references: Reference[];
  currentId?: string;
}

interface GlobalSetting {
  pixelGrid: GridPOD;
}

interface TilesetEditorState {
  globalSetting: GlobalSetting;
  drawingBoard: DrawingBoard;
  references: ReferenceList;
  editStack: EditStackPOD;
}

type TilesetEditorStore = StoreApi<TilesetEditorState>;

let set!: TilesetEditorStore['setState'];
let get!: TilesetEditorStore['getState'];

const defaultGrid = Loc.create(32, 32);

export const useTilesetEditorStore = create(
  combine({
    drawingBoard: {
      context: createEmptyCanvas(defaultGrid),
      version: 0,
      fileHandle: void 0,
    },
    references: {
      references: [],
      currentId: void 0,
    },
    globalSetting: {
      pixelGrid: defaultGrid
    },
    editStack: EditStack.create(60),
  } as TilesetEditorState, (_set, _get) => {
    set = _set;
    get = _get;
    return {};
  })
);

export const useGlobalSetting = () => useTilesetEditorStore(({ globalSetting }) => globalSetting);
export const useDrawingBoard = () => useTilesetEditorStore(({ drawingBoard }) => drawingBoard);
export const useReferences = () => useTilesetEditorStore(({ references }) => references);
export const useEditStack = () => useTilesetEditorStore(({ editStack }) => editStack);

export const useCurrentReference = () => {
  const { references, currentId } = useReferences();

  const currentReference = useMemo(() => {
    if (!currentId) return void 0;
    return references.find((e) => e.id === currentId);
  }, [references, currentId]);

  return currentReference;
}

const registerCommand = <T extends any[], R>(command: Command<T, R>) => {
  const executor = EditStack.registerCommand(command);

  return (...args: T) => {
    set(({ editStack }) => ({
      editStack: executor(editStack, ...args)
    }));
  };
}

const modifyGlobalSetting = (action: (state: GlobalSetting) => void) => {
  const { globalSetting } = get();
  set({
    globalSetting: produce(globalSetting, (globalSetting) => {
      action(globalSetting);
    })
  });
  return globalSetting;
}

export const resizePixelGrid = registerCommand({
  exec: (pixelGrid: GridPOD) => {
    const old = modifyGlobalSetting((draft) => {
      draft.pixelGrid = pixelGrid;
    });
    return old.pixelGrid;
  },
  discard: (pixelGrid) => {
    modifyGlobalSetting((draft) => {
      draft.pixelGrid = pixelGrid;
    });
  },
  mergeable: true,
});

export const setFileHandle = (fileHandle?: FileSystemFileHandle) => {
  set((state) => ({
    drawingBoard: {
      ...state.drawingBoard,
      fileHandle
    }
  }));
};

const updateVersion = (version: number) => {
  const { drawingBoard } = get();
  set({
    drawingBoard: {
      ...drawingBoard,
      version,
    }
  });
  return drawingBoard.version;
}

const putTile = registerCommand({
  exec: (tile: Tile, loc: LocPOD): [Tile, LocPOD] => {
    const { drawingBoard } = get();
    const { context, version } = drawingBoard;
    const oldTile = TileHelper.takeTile(context, loc, [tile.width, tile.height]);
    TileHelper.putTile(context, tile, loc);
    updateVersion(version + 1);
    return [oldTile, loc];
  },
  discard: ([tile, loc]) => {
    const { drawingBoard } = get();
    const { context, version } = drawingBoard;
    updateVersion(version - 1);
    TileHelper.putTile(context, tile, loc);
  }
});

export const drawReference = (id: string, rect: RectPOD, dest: LocPOD) => {
  const { references } = get();
  const reference = references.references.find((e) => e.id === id);
  if (!reference) {
    throw `unknown reference ${id}`;
  }
  const size = Rect.size(rect);
  const [w, h] = size;
  const ctx = createEmptyCanvas(size);
  const [lb] = rect;
  const [sx, sy] = lb;
  ctx.globalAlpha = reference.opacity / 255;
  ctx.drawImage(reference.source, sx, sy, w, h, 0, 0, w, h);
  if (reference.hue) {
    hueRotate(ctx, reference.hue);
  }
  const tile = TileHelper.takeTile(ctx, Loc.ZERO, size);
  putTile(tile, dest);
}

export const enlargeCanvas = registerCommand({
  exec: ([dx, dy]: LocPOD): LocPOD => {
    const { drawingBoard } = get();
    const { context, version } = drawingBoard;
    const { width, height } = context.canvas;
    resizeWithContent(context, [width + dx, height + dy]);
    updateVersion(version + 1);
    return [dx, dy];
  },
  discard: ([dx, dy]) => {
    const { drawingBoard } = get();
    const { context, version } = drawingBoard;
    const { width, height } = context.canvas;
    resizeWithContent(context, [width - dx, height - dy]);
    updateVersion(version - 1);
  }
});

export const shrinkCanvasWidth = registerCommand({
  exec: (delta: number): [number, Tile] => {
    const { drawingBoard } = get();
    const { context, version } = drawingBoard;
    const { width, height } = context.canvas;
    const tile = TileHelper.takeTile(context, [width, 0], [delta, height]);
    resizeWithContent(context, [width - delta, height]);
    updateVersion(version + 1);
    return [delta, tile];
  },
  discard: ([delta, tile]) => {
    const { drawingBoard } = get();
    const { context, version } = drawingBoard;
    const { width, height } = context.canvas;
    resizeWithContent(context, [width + delta, height]);
    TileHelper.putTile(context, tile, [width, 0]);
    updateVersion(version - 1);
  }
});

export const shrinkCanvasHeight = registerCommand({
  exec: (delta: number): [number, Tile] => {
    const { drawingBoard } = get();
    const { context, version } = drawingBoard;
    const { width, height } = context.canvas;
    const tile = TileHelper.takeTile(context, [0, height], [width, delta]);
    resizeWithContent(context, [width, height - delta]);
    updateVersion(version + 1);
    return [delta, tile];
  },
  discard: ([delta, tile]) => {
    const { drawingBoard } = get();
    const { context, version } = drawingBoard;
    const { width, height } = context.canvas;
    resizeWithContent(context, [width, height + delta]);
    TileHelper.putTile(context, tile, [0, height]);
    updateVersion(version - 1);
  }
});

export const setCurrentReferenceId = (id?: string) => {
  const state = get();
  set(produce(state, ({ references }) => { references.currentId = id }));
  // return state.references.currentId;
}

const updateReferenceArray = (action: (state: Reference[]) => Reference[]) => {
  set(({ references }) => ({
    references: {
      ...references,
      references: action(references.references)
    }
  }));
};

const modifyReference = (id: string, action: (state: Draft<Reference>) => void) => {
  updateReferenceArray((references) => {
    const referenceId = references.findIndex((e) => e.id === id);
    if (referenceId === -1) {
      throw new Error(("try to update unknown reference"));
    }
    return produce(references, (draft) => {
      action(draft[referenceId]);
    });
  });
};

export const openReference = (reference: Reference) => {
  updateReferenceArray((references) => references.concat([reference]));
}

export const closeReference = (id: string) => {
  updateReferenceArray((references) => references.filter(((e) => e.id !== id)));
};

export const setReferenceOpacity = (id: string, opacity: number) => {
  modifyReference(id, (reference) => {
    reference.opacity = opacity;
  });
};

export const setReferenceHue = (id: string, hue: number) => {
  modifyReference(id, (reference) => {
    reference.hue = hue;
  });
};

export const setReferenceSelection = (id: string, selection?: RectPOD) => {
  modifyReference(id, (reference) => {
    reference.selection = selection as Draft<RectPOD>;
  });
}

const updateEditStack = (action: (editStack: EditStackPOD) => EditStackPOD) => {
  set((state) => ({
    editStack: action(state.editStack)
  }));
}

export const redo = () => {
  updateEditStack((editStack) => EditStack.redo(editStack));
}

export const undo = () => {
  updateEditStack((editStack) => EditStack.undo(editStack));
}

export const clearStack = () => {
  updateEditStack((editStack) => EditStack.create(editStack.capacity));
};

export const changeImage = (image: HTMLImageElement, fileHandle: FileSystemFileHandle) => {
  clearStack();
  const context = createEmptyCanvas();
  copyCanvas(context, image);
  context.drawImage(image, 0, 0);
  set(({ drawingBoard }) => ({
    drawingBoard: {
      ...drawingBoard,
      context,
      fileHandle,
      version: 0,
    }
  }));
}
