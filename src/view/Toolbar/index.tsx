import { FC } from "react";
import { enlargeCanvas, shrinkCanvasHeight, shrinkCanvasWidth, useDrawingBoard, useGlobalSetting } from "@/store";
import { Button } from "@douyinfe/semi-ui";
import styles from "./index.module.less";

const Toolbar: FC = () => {

  const { pixelGrid } = useGlobalSetting();
  const { context } = useDrawingBoard();

  const [pw, ph] = pixelGrid;

  return (
    <div className={styles.toolbar}>
      <Button
        onClick={() => {
          enlargeCanvas([0, ph]);
        }}
      >新增一行</Button>
      <Button
        disabled={context.canvas.height <= ph}
        onClick={() => {
          shrinkCanvasHeight(ph);
        }}
      >
        删除一行
      </Button>
      <Button
        onClick={() => {
          enlargeCanvas([pw, 0]);
        }}
      >新增一列</Button>
      <Button
        disabled={context.canvas.width <= pw}
        onClick={() => {
          shrinkCanvasWidth(pw);
        }}
      >
        删除一列
      </Button>
    </div>
  );
}

export default Toolbar;
