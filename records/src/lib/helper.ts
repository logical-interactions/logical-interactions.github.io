// bind default value
export function bindDefault(o: any, d: any) {
  Object.keys(d).forEach(k => {
    if (!(k in o)) {
      o[k] = d[k];
    }
  });
  return o;
}