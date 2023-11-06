import { withResolvers } from "./polyfill";

export const readDataURLFromLocalFile = async (file: Blob) => {
  const { promise, resolve, reject } = withResolvers<string>();
  const fileReader = new FileReader();
  fileReader.addEventListener('load', () => {
    resolve(fileReader.result as string);
  });
  fileReader.readAsDataURL(file);
  return promise;
}

export const downloadFile = async (file: Blob, name?: string) => {
  const a = document.createElement("a");
  a.href = URL.createObjectURL(file);
  if (name) {
    a.download = name;
  }
  a.click();
  URL.revokeObjectURL(a.href)
}

interface ISaveFileOptions {
  types?: FilePickerAcceptType[];
  suggestedName?: string;
}

export const saveFileToLocal = async (file: FileSystemWriteChunkType, { types, suggestedName }: ISaveFileOptions = {}) => {
  const fileHandle = await window.showSaveFilePicker({
    types,
    excludeAcceptAllOption: true,
    suggestedName,
  });
  const stream = await fileHandle.createWritable();
  await stream.write(file);
  await stream.close();
}
