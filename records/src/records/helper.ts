export function genSetMapStateTemp() {
  let values: any[] = [];
  function resetMapStateTemp() {
    values = [];
  }
  function setMapStateTemp(itxId: number, long: number, lat: number) {
    // this needs to mutate some global thing
    values.push([long, lat]);
  }
  function getMapStateValue() {
    return values;
  }
  return {resetMapStateTemp, setMapStateTemp, getMapStateValue};
}

export function readFileSync(filename: string): string {
  let request = new XMLHttpRequest();
  request.open("GET", filename, false);  // `false` makes the request synchronous
  request.send(null);
  if (request.status === 200) {
    return request.responseText;
  } else {
    return "";
  }
}

export function readFileAsync(filename: string): Promise<any> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("GET", filename, true);
    xhr.onload = () => resolve(xhr.responseText);
    xhr.onerror = () => reject(xhr.statusText);
    xhr.send();
  });
}