import { GridPOD, Loc, LocPOD, Rect, RectPOD } from '@/utils/coordinate';
import { Command, EditStack } from '@/utils/editStack';
import { Tile, TileHelper } from '@/utils/tile';
import { createEmptyCanvas, hueRotate, resizeWithContent } from '@/utils/canvas';
import { Setter, Updater, defineStore, execSetter, execUpdater } from './helper';
import { MemoTable, createShortMemoValue } from '@/utils/memo';

interface DrawingBoard {
  context: CanvasRenderingContext2D;
  version: number;
  name: string;
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

const defaultGrid = Loc.create(32, 32);

const editStackStore = defineStore(EditStack.create(60), (editStack) => ({
  canUndo: EditStack.canUndo(editStack),
  canRedo: EditStack.canRedo(editStack),
}));

export const useEditStack = editStackStore.use;

export const redo = () => {
  editStackStore.set((editStack) => EditStack.redo(editStack));
};

export const undo = () => {
  editStackStore.set((editStack) => EditStack.undo(editStack));
};

export const clearStack = () => {
  editStackStore.set((editStack) => EditStack.create(editStack.capacity));
};

const registerCommand = <T extends any[], R>(command: Command<T, R>) => {
  const executor = EditStack.registerCommand(command);

  return (...args: T) => {
    editStackStore.set((editStack) => executor(editStack, ...args));
  };
};

const globalSettingStore = defineStore<GlobalSetting>({
  pixelGrid: defaultGrid,
});

export const useGlobalSetting = globalSettingStore.use;

const setPixelGrid = (pixelGrid: GridPOD) => {
  const old = globalSettingStore.update({ pixelGrid });
  return old.pixelGrid;
};

export const resizePixelGrid = registerCommand({
  exec: (pixelGrid: GridPOD) => {
    return setPixelGrid(pixelGrid);
  },
  discard: (pixelGrid) => {
    setPixelGrid(pixelGrid);
  },
  mergeable: true,
});

const drawingBoardStore = defineStore<DrawingBoard>({
  context: createEmptyCanvas(defaultGrid),
  version: 0,
  name: '新文件',
  fileHandle: void 0,
});

export const useDrawingBoard = drawingBoardStore.use;

export const setFileHandle = (fileHandle?: FileSystemFileHandle) => {
  drawingBoardStore.update({ fileHandle });
};

export const changeImage = (image: HTMLImageElement, name: string, fileHandle?: FileSystemFileHandle) => {
  clearStack();
  const context = createEmptyCanvas([image.width, image.height]);
  context.drawImage(image, 0, 0);
  drawingBoardStore.update({
    context,
    name,
    fileHandle,
    version: 0,
  });
};

const setVersion = (version: number) => {
  drawingBoardStore.update({ version });
};

const putTile = registerCommand({
  exec: (tile: Tile, loc: LocPOD): [Tile, LocPOD] => {
    const { context, version } = drawingBoardStore.current;
    const oldTile = TileHelper.takeTile(context, loc, [tile.width, tile.height]);
    TileHelper.putTile(context, tile, loc);
    setVersion(version + 1);
    return [oldTile, loc];
  },
  discard: ([tile, loc]) => {
    const { context, version } = drawingBoardStore.current;
    setVersion(version - 1);
    TileHelper.putTile(context, tile, loc);
  },
});

export const enlargeCanvas = registerCommand({
  exec: ([dx, dy]: LocPOD): LocPOD => {
    const { context, version } = drawingBoardStore.current;
    const { width, height } = context.canvas;
    resizeWithContent(context, [width + dx, height + dy]);
    setVersion(version + 1);
    return [dx, dy];
  },
  discard: ([dx, dy]) => {
    const { context, version } = drawingBoardStore.current;
    const { width, height } = context.canvas;
    resizeWithContent(context, [width - dx, height - dy]);
    setVersion(version - 1);
  },
});

export const shrinkCanvasWidth = registerCommand({
  exec: (delta: number): [number, Tile] => {
    const { context, version } = drawingBoardStore.current;
    const { width, height } = context.canvas;
    const tile = TileHelper.takeTile(context, [width, 0], [delta, height]);
    resizeWithContent(context, [width - delta, height]);
    setVersion(version + 1);
    return [delta, tile];
  },
  discard: ([delta, tile]) => {
    const { context, version } = drawingBoardStore.current;
    const { width, height } = context.canvas;
    resizeWithContent(context, [width + delta, height]);
    TileHelper.putTile(context, tile, [width, 0]);
    setVersion(version - 1);
  },
});

export const shrinkCanvasHeight = registerCommand({
  exec: (delta: number): [number, Tile] => {
    const { context, version } = drawingBoardStore.current;
    const { width, height } = context.canvas;
    const tile = TileHelper.takeTile(context, [0, height], [width, delta]);
    resizeWithContent(context, [width, height - delta]);
    setVersion(version + 1);
    return [delta, tile];
  },
  discard: ([delta, tile]) => {
    const { context, version } = drawingBoardStore.current;
    const { width, height } = context.canvas;
    resizeWithContent(context, [width, height + delta]);
    TileHelper.putTile(context, tile, [0, height]);
    setVersion(version - 1);
  },
});

export const referenceListStore = defineStore(
  {
    references: [],
    currentId: void 0,
  } as ReferenceList,
  ({ references, currentId }) => {
    const currentReference = (() => {
      if (!currentId) return void 0;
      return references.find((e) => e.id === currentId);
    })();

    return {
      currentReference,
    };
  },
);

export const useReferenceList = referenceListStore.use;

export const setCurrentReferenceId = (id?: string) => {
  referenceListStore.update({ currentId: id });
};

const updateReferenceArray = (setter: Setter<Reference[]>) => {
  return referenceListStore.update(({ references }) => ({ references: execSetter(setter, references) }));
};

export const openReference = (reference: Reference) => {
  referenceListStore.update(({ references }) => ({ references }));
  updateReferenceArray((references) => references.concat([reference]));
};

const closeReferenceInner = (id: string) => {
  updateReferenceArray((references) => references.filter((e) => e.id !== id));
};

export const closeReference = (id: string) => {
  const { references, currentId } = referenceListStore.current;
  if (id === currentId) {
    const index = references.findIndex((e) => e.id === id);
    const nextIndex = index === 0 ? 1 : index - 1;
    const next = references[nextIndex];
    if (next) {
      setCurrentReferenceId(next.id);
    } else {
      setCurrentReferenceId();
    }
  }
  closeReferenceInner(id);
};

const updateReference = (id: string, updater: Updater<Reference>) => {
  updateReferenceArray((references) => {
    const referenceId = references.findIndex((e) => e.id === id);
    if (referenceId === -1) {
      throw new Error('try to update unknown reference');
    }
    return references.with(referenceId, execUpdater(updater, references[referenceId]));
  });
};

export const setReferenceOpacity = (id: string, opacity: number) => {
  updateReference(id, { opacity });
};

export const setReferenceHue = (id: string, hue: number) => {
  updateReference(id, { hue });
};

export const setReferenceSelection = (id: string, selection?: RectPOD) => {
  updateReference(id, { selection });
};

const contextMemoTable = new MemoTable<string, (hue: number) => HTMLCanvasElement>();
export const getReferenceTextureWithHue = (reference: Reference) => {
  const { id, source, hue } = reference;
  const getTexture = contextMemoTable.get(id, () => {
    const { width, height } = source;
    const context = createEmptyCanvas([width, height]);
    return createShortMemoValue((hue: number) => {
      context.drawImage(source, 0, 0);
      if (hue > 0) {
        hueRotate(context, hue);
      }
      return context.canvas;
    });
  });
  return getTexture(hue);
};

export const drawReference = (id: string, rect: RectPOD, dest: LocPOD) => {
  const { references } = referenceListStore.current;
  const reference = references.find((e) => e.id === id);
  if (!reference) {
    throw `unknown reference ${id}`;
  }
  const size = Rect.size(rect);
  const [w, h] = size;
  const ctx = createEmptyCanvas(size);
  const [lb] = rect;
  const [sx, sy] = lb;
  const referenceTexture = getReferenceTextureWithHue(reference);
  ctx.globalAlpha = reference.opacity / 255;
  ctx.drawImage(referenceTexture, sx, sy, w, h, 0, 0, w, h);
  const tile = TileHelper.takeTile(ctx, Loc.ZERO, size);
  putTile(tile, dest);
};
