import Vector from './vector';

/**
 *
 * @param {Array<Array<{x: number, y: number}>>} vertices
 * @param {number} stepFactor
 * @param {number} speed
 * @returns {Array<{coords: Array<{x: number, y: number}>, dim: Tails>}
 */
export default function Trace(vertices, stepFactor = 1, speed) {
  let tracesAr = [];
  const tracesLength = vertices.length;
  for (let i = 0; i < tracesLength; i++) {
    let points = vertices[i];
    if (points) {
      const traces = [];
      const traceLength = points.length;
      for (let i = 0; i < traceLength; i++) {
        const vector = points[i];
        const nextVector = i + 1 === traceLength ? points[0] : points[i + 1];

        let { x } = vector;
        let { y } = vector;
        const dx = x - nextVector.x;
        const dy = y - nextVector.y;

        const steps =
          stepFactor *
          (Math.abs(dx) > Math.abs(dy) ? Math.abs(dx) : Math.abs(dy));

        const ix = -(dx / steps);
        const iy = -(dy / steps);

        for (let i2 = 0; i2 < steps; ++i2) {
          x += ix;
          y += iy;
          traces.push(Vector(parseInt(x, 10), parseInt(y, 10)));
        }
      }
      // const tailsLength = 10;
      const tailsLength = parseInt(traces.length * (1 / speed), 10);

      tracesAr.push({
        coords: traces,
        tails: Tails(tailsLength < 10 ? 10 : tailsLength),
      });
    }
  }

  return tracesAr.filter((traces) => !!traces.coords.length);
}

/**
 * @typedef {Array<{x:number,y:number,oldX:number,oldY:number}>} Tails
 * @property {Function(any):void} add
 */

/**
 *
 * @param {number} maxLen
 * @returns {Tails}
 */
function Tails(maxLen) {
  const tails = [];
  tails.add = (obj) => {
    tails.unshift(obj);
    if (tails.length > maxLen) tails.pop();
  };

  return tails;
}
