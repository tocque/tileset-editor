import { FC, useMemo } from "react";
import { Banner, Button, Select, Toast, Typography } from "@douyinfe/semi-ui";
import Icon, { IconDownload, IconGithubLogo, IconImage, IconPlus, IconRedo, IconSave, IconUndo } from "@douyinfe/semi-icons";
import { changeImage, enlargeCanvas, redo, resizePixelGrid, undo, useDrawingBoard, useEditStack, useGlobalSetting } from "@/store";
import { useKey, useLocalStorage } from "react-use";
import { CONFIG_KEY } from "@/const";
import { Grid } from "@/utils/coordinate";
import { OptionProps } from "@douyinfe/semi-ui/lib/es/select";
import { usePixelGridOptionsModal } from "./usePixelGridOptionsModal";
import { EditStack } from "@/utils/editStack";
import styles from "./index.module.less";
import { openLocalFSImage, openLocalImage, saveImageToLocalFS } from "@/utils/image";
import { useMutation } from "react-query";
import { withResolvers } from "@/utils/polyfill";
import { SUPPORT_FS, downloadFile } from "@/utils/file";
import QQ from "@/assets/qq.svg?react";

const Topbar: FC = () => {

  const { pixelGrid } = useGlobalSetting();
  const { context, fileHandle } = useDrawingBoard();
  const editStack = useEditStack();

  const openImageMutation = useMutation(async () => {
    if (SUPPORT_FS) {
      const result = await openLocalFSImage();
      if (!result) return;
      const { source, fileHandle } = result;
      changeImage(source, fileHandle.name, fileHandle);
    } else {
      const result = await openLocalImage();
      if (!result) return;
      const { source, name } = result;
      changeImage(source, name);
    }
  });

  const [rawPixelGridOptions = ["32x32", "32x48"], setRawPixelGridOptions] = useLocalStorage<string[]>(CONFIG_KEY.PixelGridOptions);

  const pixelGridOptions = useMemo(() => (
    rawPixelGridOptions.map((e): OptionProps => ({ value: e, label: e }))
  ), [rawPixelGridOptions]);

  const pixelGridOptionsModal = usePixelGridOptionsModal();

  const saveImageMutation = useMutation(async () => {
    const { promise, resolve } = withResolvers();
    context.canvas.toBlob(async (blob) => {
      if (blob) {
        await saveImageToLocalFS(blob, fileHandle?.name ?? "新文件.png");
      } else {
        Toast.error("导出失败");
      }
      resolve();
    });
    return promise;
  });

  const downloadImageMutation = useMutation(async () => {
    const { promise, resolve } = withResolvers();
    context.canvas.toBlob(async (blob) => {
      if (blob) {
        await downloadFile(blob, fileHandle?.name ?? "新文件.png");
      } else {
        Toast.error("导出失败");
      }
      resolve();
    });
    return promise;
  });

  const canUndo = EditStack.canUndo(editStack);
  const canRedo = EditStack.canRedo(editStack);

  useKey((e) => (e.ctrlKey || e.metaKey) && e.key === "z", (e) => {
    if (canUndo) {
      undo();
    }
    e.preventDefault();
  });

  useKey((e) => (e.ctrlKey || e.metaKey) && e.key === "y", (e) => {
    if (canRedo) {
      redo();
    }
    e.preventDefault();
  });

  const { width, height } = context.canvas;
  const contextIsNormal = Grid.isNormalLoc([width, height], pixelGrid);

  const fixDrawingBoard = () => {
    const [nw, nh] = Grid.mapLoc(Grid.unmapLoc([width, height], pixelGrid, true), pixelGrid);
    enlargeCanvas([nw - width, nh - height]);
  }
  
  return (
    <>
      <div className={styles.topbar}>
        <Button
          type="primary"
          icon={<IconImage />}
          loading={openImageMutation.isLoading}
          onClick={() => openImageMutation.mutate()}
        >打开图片</Button>
        {SUPPORT_FS ? (
          <Button
            className={styles.item}
            type="primary"
            icon={<IconSave />}
            loading={saveImageMutation.isLoading}
            onClick={() => saveImageMutation.mutate()}
          >另存为</Button>
        ) : (
          <Button
            className={styles.item}
            type="primary"
            icon={<IconDownload />}
            loading={downloadImageMutation.isLoading}
            onClick={() => downloadImageMutation.mutate()}
          >下载</Button>
        )}
        <span className={styles.item}>
          <label>网格尺寸:</label>
          <Select
            style={{ marginLeft: 2, width: 160 }}
            optionList={pixelGridOptions}
            value={Grid.dump(pixelGrid)}
            onChange={(val) => {
              const grid = Grid.load(val as string);
              resizePixelGrid(grid);
            }}
          />
          <Button
            icon={<IconPlus />}
            onClick={() => {
              pixelGridOptionsModal.open(rawPixelGridOptions).then((options) => {
                setRawPixelGridOptions(options);
              });
            }}
          />
          {pixelGridOptionsModal.modal}
        </span>
        <Button
          className={styles.item}
          icon={<IconUndo />}
          disabled={!canUndo}
          onClick={undo}
        />
        <Button
          className={styles.item}
          icon={<IconRedo />}
          disabled={!canRedo}
          onClick={redo}
        />
        <div style={{ marginLeft: 'auto' }}></div>
        <a href="http://qm.qq.com/cgi-bin/qm/qr?_wv=1027&k=IXXBCTPy3DJezMRySI96YjcqANuq84Ib&authKey=t%2FoBuzBqERNop2eKkTL1IJoESSXtxZjVpokreV2IESnNAIlw0JK6OcKQcCjFdD6O&noverify=0&group_code=744714518" target="_blank">
          <Button
            type="tertiary"
            icon={<Icon svg={<QQ style={{ width: 16 }} />} />}
          />
        </a>
        <a className={styles.item} href="https://github.com/tocque/tileset-editor" target="_blank">
          <Button
            type="tertiary"
            icon={<IconGithubLogo />}
          />
        </a>
      </div>
      {!contextIsNormal && (
        <Banner
          type="danger"
          description={(
            <span>当前图片的尺寸为{width}x{height}，与网格尺寸不匹配，可能导致编辑错误，请更换图片或<Typography.Text link onClick={fixDrawingBoard}>进行修复</Typography.Text></span>
          )}
          closeIcon={null}
        />
      )}
    </>
  )
}

export default Topbar;
