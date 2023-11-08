import { withResolvers } from "./polyfill";

export const SUPPORT_FS = !!window.showOpenFilePicker;

export const readDataURLFromLocalFile = async (file: Blob) => {
  const { promise, resolve, reject } = withResolvers<string>();
  const fileReader = new FileReader();
  fileReader.addEventListener('load', () => {
    resolve(fileReader.result as string);
  });
  fileReader.readAsDataURL(file);
  return promise;
}

export const downloadFile = (file: Blob, name?: string) => {
  const a = document.createElement("a");
  a.href = URL.createObjectURL(file);
  if (name) {
    a.download = name;
  }
  a.click();
  URL.revokeObjectURL(a.href)
}

export const writeLocalFSFile = async (fileHandle: FileSystemFileHandle, file: FileSystemWriteChunkType) => {
  const stream = await fileHandle.createWritable();
  await stream.write(file);
  await stream.close();
}
