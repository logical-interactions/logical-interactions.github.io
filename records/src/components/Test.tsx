import * as React from "react";

interface TestProps {

}

interface TestState {
  count: number;
}

function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function demo() {
  console.log("Taking a break...");
  await sleep(2000);
  console.log("Two second later");
}


export default class Test extends React.Component<TestProps, TestState> {
  constructor(props: TestProps) {
    super(props);
    this.state = {
      count: 0,
    };
    setTimeout(() => {
      this.setState((prevState) => prevState);
    }, 2000);
  }

  render() {
    console.log("Rendering");
    demo();
    return <>
      hi
    </>;
  }
}