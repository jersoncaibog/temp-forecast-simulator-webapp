declare module 'regression' {
  type Point = [number, number];
  type Options = {
    order?: number;
    precision?: number;
  };
  
  interface Result {
    equation: number[];
    r2: number;
    points: Point[];
    predict(x: number): Point;
  }

  function polynomial(points: Point[], options?: Options): Result;

  export { polynomial };
  export default { polynomial };
} 