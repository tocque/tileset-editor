import { FC } from "react";
import { enlargeCanvas, shrinkCanvasHeight, shrinkCanvasWidth, useGlobalSetting } from "@/store";
import { Button } from "@douyinfe/semi-ui";
import styles from "./index.module.less";

const Toolbar: FC = () => {

  const { pixelGrid } = useGlobalSetting();

  return (
    <div className={styles.toolbar}>
      <Button
        onClick={() => {
          enlargeCanvas([0, pixelGrid[1]]);
        }}
      >新增一行</Button>
      <Button
        onClick={() => {
          shrinkCanvasHeight(pixelGrid[1]);
        }}
      >
        删除一行
      </Button>
      <Button
        onClick={() => {
          enlargeCanvas([pixelGrid[0], 0]);
        }}
      >新增一列</Button>
      <Button
        onClick={() => {
          shrinkCanvasWidth(pixelGrid[0]);
        }}
      >
        删除一列
      </Button>
    </div>
  );
}

export default Toolbar;
