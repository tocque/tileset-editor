import { listenOnce } from "./dom";
import { writeLocalFSFile } from "./file";

export const createImage = async (src: string) => {
  const image = document.createElement("img");
  await listenOnce(image, 'load', () => image.src = src);
  return image;
}

export const createImageFromBlob = async (blob: Blob) => {
  const url = URL.createObjectURL(blob);
  const image = await createImage(url);
  URL.revokeObjectURL(url);
  return image;
}

interface LocalImage {
  source: HTMLImageElement;
  file: File;
}

export const openLocalImage = async (): Promise<LocalImage | undefined> => {
  const input = document.createElement("input");
  input.type = "file";
  input.accept = "image/png";
  /** @todo 想办法检测到关闭事件 */
  await listenOnce(input, 'change', () => input.click());
  if (!input.files) {
    return;
  }
  const [file] = input.files;
  const image = await createImageFromBlob(file);
  return {
    source: image,
    file: file,
  };
}

interface LocalFSImage {
  source: HTMLImageElement;
  fileHandle: FileSystemFileHandle;
}

export const openLocalFSImage = async (): Promise<LocalFSImage | undefined> => {
  const [fileHandle] = await window.showOpenFilePicker({
    types: [
      {
        description: "Images",
        accept: {
          "image/*": [".png"],
        },
      },
    ],
    excludeAcceptAllOption: true,
    multiple: false,
  });
  if (!fileHandle) {
    return;
  }
  const file = await fileHandle.getFile();
  const image = await createImageFromBlob(file);
  return {
    source: image,
    fileHandle,
  }
}

export const saveImageToLocalFS = async (file: FileSystemWriteChunkType, suggestedName?: string) => {
  const fileHandle = await window.showSaveFilePicker({
    types: [
      {
        description: "Images",
        accept: {
          "image/png": [".png"],
        },
      },
    ],
    excludeAcceptAllOption: true,
    suggestedName,
  });
  writeLocalFSFile(fileHandle, file);
}
