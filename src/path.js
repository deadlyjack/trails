import Vector from './vector';

/**
 *
 * @param {Array<Array<{x: number, y: number}>>} vertices
 */
export default function Path(vertices) {
  this.vertices = vertices;
  this.max = Vector(0, 0);
  this.min = Vector(Infinity, Infinity);
  this.dim = {
    h: 0,
    w: 0,
  };

  vertices.map((points) => {
    points.map((vertex) => {
      const x = parseInt(vertex.x, 10);
      const y = parseInt(vertex.y, 10);
      genMeta.call(this, x, y);
      return vertex;
    });
    return points;
  });

  this.translate = (x, y) => {
    const min = JSON.parse(JSON.stringify(this.min));

    resetMeta.call(this);
    this.vertices.map((points, i1) => {
      points.map((vertex, i2) => {
        const x1 = parseInt(vertex.x - min.x + x, 10);
        const y1 = parseInt(vertex.y - min.y + y, 10);

        genMeta.call(this, x1, y1);

        this.vertices[i1][i2] = Vector(x1, y1);
        return vertex;
      });
      return points;
    });
  };

  this.scale = (x, y = x) => {
    resetMeta.call(this);
    this.vertices.map((points, i1) => {
      points.map((vector, i2) => {
        const newX = parseInt(vector.x * x, 10);
        const newY = parseInt(vector.y * y, 10);

        genMeta.call(this, newX, newY);

        this.vertices[i1][i2] = Vector(newX, newY);
        return vector;
      });
      return points;
    });
  };

  this.resize = (w, h) => {
    if (!h && !w) throw Error('There must be atleast one value');
    const height = this.max.y - this.min.y;
    const width = this.max.x - this.min.x;
    let hratio = h / height;
    let wratio = w / width;

    if (!h) hratio = wratio;
    if (!w) wratio = hratio;

    resetMeta.call(this);
    this.vertices.map((points, i1) => {
      points.map((vector, i2) => {
        const newX = parseInt(vector.x * wratio, 10);
        const newY = parseInt(vector.y * hratio, 10);

        genMeta.call(this, newX, newY);

        this.vertices[i1][i2] = Vector(newX, newY);
        return vector;
      });
      return points;
    });
  };

  function resetMeta() {
    this.max = Vector(0, 0);
    this.min = Vector(Infinity, Infinity);
  }

  function genMeta(x, y) {
    if (x > this.max.x) this.max.x = x;
    if (y > this.max.y) this.max.y = y;
    if (x < this.min.x) this.min.x = x;
    if (y < this.min.y) this.min.y = y;

    this.dim.w = this.max.x - this.min.x;
    this.dim.h = this.max.y - this.min.y;
  }
}
