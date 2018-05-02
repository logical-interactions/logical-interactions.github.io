export const aSeries = ["low", "middle", "high"];
export const bSeries = ["bad", "average", "good"];

function generateData() {

  for (let i = 0; i < total; i ++) {
    // let val = d3.randomNormal(10, 5)();
    let a = aSeries[Math.floor(Math.random() * 3)];
    let b = bSeries[Math.floor(Math.random() * 3)];
    let c = Math.random() * 2;
    let d = c + Math.random();
  
}