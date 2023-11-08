import { FC, MouseEventHandler, useEffect, useMemo, useRef } from "react";
import styles from "./index.module.less";
import { setReferenceSelection, setReferenceOpacity, setReferenceHue, Reference, useGlobalSetting, getReferenceTextureWithHue } from "@/store";
import { resizeAsSource, fillWithTransparentMosaic, hueRotate, strokeByRect } from "@/utils/canvas";
import { Grid, Loc, LocPOD, Rect } from "@/utils/coordinate";
import { useNode } from "@/utils/hooks/useNode";
import SliderInput from "./SilderInput";

interface IReferenceProps {
  reference: Reference;
}

const ReferenceView: FC<IReferenceProps> = (props) => {
  const { reference } = props;

  const { pixelGrid } = useGlobalSetting();
  
  const [canvas, mountCanvas] = useNode<HTMLCanvasElement>();

  const canvasCtx = useMemo(() => canvas?.getContext("2d"), [canvas]);

  const texture = getReferenceTextureWithHue(reference);

  useEffect(() => {
    if (canvasCtx) {
      resizeAsSource(canvasCtx, texture);
      fillWithTransparentMosaic(canvasCtx);
      canvasCtx.globalAlpha = reference.opacity / 255;
      canvasCtx.drawImage(texture, 0, 0);
      if (reference.selection) {
        canvasCtx.globalAlpha = 1;
        const [lb, rt] = Grid.mapRect(reference.selection, pixelGrid);
        const BORDER_COLOR = "#000000";
        const BORDER_WIDTH = 1;
        const LINE_COLOR = "#FFFFFF";
        const LINE_WIDTH = 2;
        strokeByRect(canvasCtx, [lb, rt], BORDER_WIDTH * 2 + LINE_WIDTH, BORDER_COLOR);
        strokeByRect(canvasCtx, [Loc.add(lb, [BORDER_WIDTH, BORDER_WIDTH]), Loc.add(rt, [-BORDER_WIDTH, -BORDER_WIDTH])], LINE_WIDTH, LINE_COLOR);
      }
    }
  }, [texture, reference, canvasCtx, pixelGrid]);

  const mousePressSession = useRef<LocPOD>();

  const handleMouseDown: MouseEventHandler = (e) => {
    const { offsetX, offsetY } = e.nativeEvent;
    const loc = Grid.unmapLoc([offsetX, offsetY], pixelGrid);
    mousePressSession.current = loc;
    setReferenceSelection(reference.id, [loc, Loc.add(loc, [1, 1])]);
  }

  const handleMouseMove: MouseEventHandler = (e) => {
    if (!mousePressSession.current) return;
    const { offsetX, offsetY } = e.nativeEvent;
    const loc = Grid.unmapLoc([offsetX, offsetY], pixelGrid);
    const start = mousePressSession.current;
    const rect = Rect.fromLocs([loc, Loc.add(loc, [1, 1]), start, Loc.add(start, [1, 1])]);
    setReferenceSelection(reference.id, rect);
  }

  const handleMouseUp: MouseEventHandler = (e) => {
    if (!mousePressSession.current) return;
    const { offsetX, offsetY } = e.nativeEvent;
    const loc = Grid.unmapLoc([offsetX, offsetY], pixelGrid);
    const start = mousePressSession.current;
    const rect = Rect.fromLocs([loc, Loc.add(loc, [1, 1]), start, Loc.add(start, [1, 1])]);
    setReferenceSelection(reference.id, rect);
    mousePressSession.current = void 0;
  }

  return (
    <>
      <div className={styles.canvasContainer}>
        <canvas
          ref={mountCanvas}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
        ></canvas>
      </div>
      <div className={styles.canvasItem}>
        <label>不透明度:</label>
        <SliderInput
          min={0}
          max={255}
          value={reference.opacity}
          onChange={(val) => setReferenceOpacity(reference.id, val as number)}
        />
      </div>
      <div className={styles.canvasItem}>
        <label>色相:</label>
        <SliderInput
          value={reference.hue}
          min={0}
          max={330}
          step={30}
          onChange={(val) => setReferenceHue(reference.id, val as number)}
        />
      </div>
    </>
  );
}

export default ReferenceView;