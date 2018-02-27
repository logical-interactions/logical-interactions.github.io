import * as React from "react";
// this takes the db
// inserts a bunch of stuff
// and renders their results in tsx
// hypothsis is that local async is not noticeable.
import { db } from "../records/setup";

interface StressTestState {
  counter: number;
  a: number;
  b: number;
}

export default class StressTest extends React.Component<undefined, StressTestState> {
  constructor(props: undefined) {
    super(props);
    this.setCounter = this.setCounter.bind(this);
    this.handleClick = this.handleClick.bind(this);
    this.setA = this.setA.bind(this);
    this.setB = this.setB.bind(this);
    db.exec("CREATE TABLE counter (val INTEGER);");
    db.exec(`
      CREATE TABLE dummy (val INTEGER);
      CREATE TABLE foo (val INTEGER);
      INSERT INTO dummy VALUES (0);
      INSERT INTO foo VALUES (2);
    `);
    db.create_function("setCounter", this.setCounter);
    db.create_function("setA", this.setA);
    db.create_function("setB", this.setB);
    db.create_function("transact", this.transact);
    db.exec(`
    CREATE TRIGGER addCounter AFTER INSERT ON counter
      BEGIN
        SELECT setCounter(NEW.val);
        UPDATE dummy SET val = (SELECT val + 2 FROM dummy);
        UPDATE foo SET val = (SELECT val + 4 FROM dummy);
      END;
    `);
    // db.exec(`
    // CREATE TRIGGER transactionTest AFTER INSERT ON counter
    //   BEGIN
    //     SELECT transact();
    //   END;
    // `);
    this.state = {
      counter: 0,
      a: 0,
      b: 0,
    };
  }
  transact() {
    db.exec(`
      BEGIN TRANSACTION;
      SELECT setA(val) FROM dummy;
      SELECT setB(val) FROM foo;
      COMMIT;
    `);
  }
  setA(a: number) {
    this.setState({
      a
    });
  }
  setB(b: number) {
    this.setState({
      b
    });

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
      <h2>{this.state.a}</h2>
      <h2>{this.state.b}</h2>
      <button onClick={this.handleClick}>add</button>
      <button onClick={this.transact}>transact</button>
    </>;
  }
}