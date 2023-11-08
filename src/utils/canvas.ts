import { once } from "lodash-es";
import { LocPOD, Rect, RectPOD } from "./coordinate";
import Color from "color";

export const createEmptyCanvas = ([x, y]: LocPOD) => {  
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d")!;
  ctx.canvas.width = x;
  ctx.canvas.height = y;
  return ctx;
};

const createTransparentMosaicPattern = once(() => {
  const ctx = createEmptyCanvas([16, 16]);
  ctx.fillStyle = "rgba(203, 203, 203, 0.5)";
  ctx.fillRect(0, 0,  8,  8);
  ctx.fillRect(8, 8, 16, 16);
  return ctx.createPattern(ctx.canvas, "repeat")!;
});

export const fillWithTransparentMosaic = (ctx: CanvasRenderingContext2D) => {
  const pattern = createTransparentMosaicPattern();
  ctx.fillStyle = pattern;
  ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
};

export const strokeByRect = (ctx: CanvasRenderingContext2D, rect: RectPOD, lineWidth: number, style: string) => {
  ctx.strokeStyle = style;
  ctx.lineWidth = lineWidth;
  const [sx, sy, dx, dy] = Rect.toQuadruple(rect);
  const w = dx - sx - lineWidth;
  const h = dy - sy - lineWidth;
  ctx.strokeRect(sx + lineWidth / 2, sy + lineWidth / 2, w, h);
}

export const resizeAsSource = (ctx: CanvasRenderingContext2D, source: HTMLImageElement | HTMLCanvasElement) => {
  ctx.canvas.width = source.width;
  ctx.canvas.height = source.height;
};

export const resizeWithContent = (ctx: CanvasRenderingContext2D, [dw, dh]: LocPOD) => {
  const { width, height } = ctx.canvas;
  const kw = Math.min(width, dw);
  const kh = Math.min(height, dh);
  const keep = ctx.getImageData(0, 0, kw, kh);
  ctx.canvas.width = dw;
  ctx.canvas.height = dh;
  ctx.putImageData(keep, 0, 0);
}

export const hueRotate = (ctx: CanvasRenderingContext2D, degree: number) => {
  const { width, height } = ctx.canvas;
  const imageData = ctx.getImageData(0, 0, width, height);
  const size = imageData.data.length;
  for (let i = 0; i < size; i += 4) {
    const rgb = imageData.data.slice(i, i + 3);
    const [r, g, b] = Color.rgb(rgb).rotate(degree).rgb().array();
    imageData.data[i] = r;
    imageData.data[i+1] = g;
    imageData.data[i+2] = b;
  }
  ctx.putImageData(imageData, 0, 0);
}
