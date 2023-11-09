import { LocPOD, RectPOD } from './coordinate';

export type Tile = ImageData;

export class TileHelper {
  static takeTile(ctx: CanvasRenderingContext2D, [sx, sy]: LocPOD, [sw, sh]: LocPOD) {
    return ctx.getImageData(sx, sy, sw, sh);
  }

  static putTile(ctx: CanvasRenderingContext2D, tile: Tile, [dx, dy]: LocPOD) {
    ctx.putImageData(tile, dx, dy);
  }
}
