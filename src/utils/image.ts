import { readDataURLFromLocalFile, saveFileToLocal } from "./file";
import { withResolvers } from "./polyfill";

export const createImageFromDataURL = (dataURL: string) => {
  const { promise, resolve, reject } = withResolvers<HTMLImageElement>();
  const image = document.createElement("img");
  image.addEventListener('load', () => {
    resolve(image);
  });
  image.src = dataURL;
  return promise;
}

interface LocalImage {
  source: HTMLImageElement;
  name: string;
}

export const openLocalImage = async () => {
  const { promise, resolve, reject } = withResolvers<LocalImage | undefined>();
  const input = document.createElement("input");
  input.type = "file";
  input.accept = "image/png";
  input.addEventListener('change', async () => {
    if (!input.files) {
      resolve(void 0);
      return;
    }
    const [file] = input.files;
    const dataURL = await readDataURLFromLocalFile(file);
    const image = await createImageFromDataURL(dataURL);
    resolve({
      source: image,
      name: file.name,
    });
  });
  input.click();
  return promise;
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
  const dataURL = await readDataURLFromLocalFile(file);
  const image = await createImageFromDataURL(dataURL);
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
          "image/*": [".png"],
        },
      },
    ],
    excludeAcceptAllOption: true,
    suggestedName,
  });
  saveFileToLocal(fileHandle, file);
}
