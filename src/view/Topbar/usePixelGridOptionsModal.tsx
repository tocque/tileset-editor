import { Grid } from "@/utils/coordinate";
import { useArray } from "@/utils/hooks/useArray";
import { useResolver } from "@/utils/hooks/useResolver";
import { IconDelete, IconPlusCircle } from "@douyinfe/semi-icons";
import { Button, InputNumber, Modal } from "@douyinfe/semi-ui";
import { useState } from "react";

export const usePixelGridOptionsModal = () => {

  const [visible, setVisible] = useState(false);
  const [options, setOptions] = useState<string[]>([]);

  const resolver = useResolver<string[] | undefined>();

  const optionArray = useArray(options, setOptions);

  const open = (options: string[]) => {
    setVisible(true);
    setOptions(options);
    return resolver.start();
  };

  const cancel = () => {
    setVisible(false);
    resolver.resolve(void 0);
  }

  const ok = () => {
    setVisible(false);
    resolver.resolve(options);
  }

  const modal = (
    <Modal
      title="编辑网格选项"
      visible={visible}
      onCancel={cancel}
      onOk={ok}
    >
      {optionArray.withHelper().map(([option, { assign, remove }], i) => {
        const [x, y] = Grid.load(option);

        return (
          <div key={i} style={{ marginBottom: 2 }}>
            <InputNumber
              style={{ width: 80 }}
              min={1}
              value={x}
              onChange={(val) => assign(Grid.dump([val as number, y]))}
            />
            <span> x </span>
            <InputNumber
              style={{ width: 80 }}
              min={1}
              value={y}
              onChange={(val) => assign(Grid.dump([x, val as number]))}
            />
            <Button
              style={{ marginLeft: 5 }}
              type="danger"
              icon={<IconDelete />}
              onClick={remove}
            />
          </div>
        );
      })}
      <Button
        icon={<IconPlusCircle />}
        onClick={() => optionArray.append("32x32")}
      >
        添加
      </Button>
    </Modal>
  );

  return {
    open,
    modal,
  }
};
