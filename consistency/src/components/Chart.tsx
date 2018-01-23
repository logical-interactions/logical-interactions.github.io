import { Slider } from "antd";

export default class Chart extends React.Component<ChartProps, undefined> {
  static defaultProps = {
    colorOverride: false,
    height: 300,
    marginBottom: 40,
    marginLeft: 45,
    marginRight: 20,
    marginTop: 20,
    width: 400,
    showLabel: false,
    showAxesLabels: true,
  };
