import { readDataURLFromLocalFile, saveFileToLocal } from "./file";
import { withResolvers } from "./polyfill";

interface LocalImage {
  source: HTMLImageElement;
  fileHandle: FileSystemFileHandle;
}

export const openLocalImage = async () => {
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
  const file = await fileHandle.getFile();
  const dataURL = await readDataURLFromLocalFile(file);
  const image = document.createElement("img");
  {
    const { promise, resolve, reject } = withResolvers<LocalImage>();
    image.addEventListener('load', () => {
      resolve({
        source: image,
        fileHandle,
      });
    });
    image.src = dataURL;
    return promise;
  }
}

export const saveImageToLocal = async (file: FileSystemWriteChunkType, suggestedName?: string) => {
  saveFileToLocal(file, {
    types: [
      {
        description: "Images",
        accept: {
          "image/*": [".png"],
        },
      },
    ],
    suggestedName,
  });
}
