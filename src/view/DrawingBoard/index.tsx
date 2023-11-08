import { FC, MouseEventHandler, useEffect, useMemo, useRef } from "react";
import { drawReference, useDrawingBoard, useGlobalSetting, useReferenceList } from "@/store";
import styles from "./index.module.less";
import { resizeAsSource, fillWithTransparentMosaic } from "@/utils/canvas";
import { Grid } from "@/utils/coordinate";
import { useNode } from "@/utils/hooks/useNode";

const DrawingBoard: FC = () => {
  const { pixelGrid } = useGlobalSetting();
  const { context, version, fileHandle } = useDrawingBoard();
  const { currentReference } = useReferenceList();
  
  const [canvas, mountCanvas] = useNode<HTMLCanvasElement>();

  const canvasCtx = useMemo(() => canvas?.getContext("2d"), [canvas]);

  useEffect(() => {
    if (canvasCtx) {
      resizeAsSource(canvasCtx, context.canvas);
      fillWithTransparentMosaic(canvasCtx);
      canvasCtx.drawImage(context.canvas, 0, 0);
    }
  }, [context, version, canvasCtx]);

  const handleClick: MouseEventHandler = (e) => {
    if (!currentReference || !currentReference.selection) return;
    const { offsetX, offsetY } = e.nativeEvent;
    const loc = Grid.normalizeLoc([offsetX, offsetY], pixelGrid);
    drawReference(currentReference.id, Grid.mapRect(currentReference.selection, pixelGrid), loc);
  }

  return (
    <div className={styles.drawingBoard}>
      <div className="semi-tabs-tab semi-tabs-tab-card semi-tabs-tab-top semi-tabs-tab-single semi-tabs-tab-active">
        {fileHandle?.name ?? "新文件"}
      </div>
      <div className={styles.canvasContainer}>
        <canvas
          ref={mountCanvas}
          onClick={handleClick}
        ></canvas>
      </div>
    </div>
  );
}

export default DrawingBoard;
