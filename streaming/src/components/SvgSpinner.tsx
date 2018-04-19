import * as React from "react";

interface SvgSpinnerProps  {
  color: string;
  cx: number;
  cy: number;
  radius: number;
}

function helper(begin: string, cx: number, cy: number, radius: number) {
    return (
      <circle cx={cx} cy={cy} r="1">
        <animate attributeName="r"
            begin={begin} dur="1.8s"
            values={`1; ${radius}`}
            calcMode="spline"
            keyTimes="0; 1"
            keySplines="0.165, 0.84, 0.44, 1"
            repeatCount="indefinite" />
        <animate attributeName="stroke-opacity"
            begin="0s" dur="1.8s"
            values="1; 0"
            calcMode="spline"
            keyTimes="0; 1"
            keySplines="0.3, 0.61, 0.355, 1"
            repeatCount="indefinite" />
      </circle>
    );
}

export const SvgSpinner = (props: SvgSpinnerProps) => {
  return (
      <g fill="none" stroke={props.color} fill-rule="evenodd" stroke-width="2">
        {helper("0s", props.cx, props.cy, props.radius)}
        {helper("-0.9s", props.cx, props.cy, props.radius)}
      </g>
  );
};