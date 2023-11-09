import { FC } from 'react';
import { InputNumber, Slider } from '@douyinfe/semi-ui';
import { SliderProps } from '@douyinfe/semi-ui/lib/es/slider';

type SliderInputProps = SliderProps & { value: number };

const SliderInput: FC<SliderInputProps> = (props) => {
  const { value, onChange, min, max } = props;

  return (
    <>
      <Slider {...props} />
      <InputNumber
        style={{ width: 80 }}
        value={value}
        // @ts-ignore
        onChange={onChange}
        min={min}
        max={max}
      />
    </>
  );
};

export default SliderInput;
