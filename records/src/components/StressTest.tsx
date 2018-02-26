import * as React from "react";
// this takes the db
// inserts a bunch of stuff
// and renders their results in tsx
// hypothsis is that local async is not noticeable.
import { db } from "../records/setup";

interface StressTestState {
  counter: number;
}

export default class StressTest extends React.Component<undefined, StressTestState> {
  constructor(props: undefined) {
    super(props);
    this.setCounter = this.setCounter.bind(this);
    this.handleClick = this.handleClick.bind(this);
    db.exec("CREATE TABLE counter (val INTEGER);");
    db.create_function("setCounter", this.setCounter);
    db.exec(`
    CREATE TRIGGER addCounter AFTER INSERT ON counter
      BEGIN
        SELECT setCounter(NEW.val);
      END;
    `);
    this.state = {
      counter: 0,
    };
  }
  setCounter(counter: number) {
    this.setState({
      counter
    });
  }
  handleClick(events: any) {
    // get the current state
    db.exec(`INSERT INTO counter VALUES (${this.state.counter + 1})`);
  }
  render() {
    return <>
      <h1>{this.state.counter}</h1>
      <button onClick={this.handleClick}>add</button>
    </>;
  }
}