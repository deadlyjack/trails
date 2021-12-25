import Vector from './vector';

// eslint-disable-next-line import/prefer-default-export
export default class Path {
  /**
   *
   * @param {Array<Array<{x: number, y: number}>>} vertices
   */
  constructor(vertices) {
    this.vertices = vertices;
    this.max = Vector(0, 0);
    this.min = Vector(Infinity, Infinity);
    this.dim = {
      h: 0,
      w: 0,
    };

    const verticesLength = vertices.length;
    for (let i = 0; i < verticesLength; i++) {
      const points = vertices[i];
      const pointsLength = points.length;
      for (let j = 0; j < pointsLength; j++) {
        const vertex = points[j];
        const x = parseInt(vertex.x, 10);
        const y = parseInt(vertex.y, 10);
        this.#genMeta(x, y);
      }
    }
  }

  #genMeta(x, y) {
    if (x > this.max.x) this.max.x = x;
    if (y > this.max.y) this.max.y = y;
    if (x < this.min.x) this.min.x = x;
    if (y < this.min.y) this.min.y = y;

    this.dim.w = this.max.x - this.min.x;
    this.dim.h = this.max.y - this.min.y;
  }

  #resetMeta() {
    this.max = Vector(0, 0);
    this.min = Vector(Infinity, Infinity);
  }

  #transform(operationX, operationY) {
    this.#resetMeta();
    const verticesLength = this.vertices.length;
    for (let i = 0; i < verticesLength; i++) {
      const points = this.vertices[i];
      const pointsLength = points.length;
      for (let j = 0; j < pointsLength; j++) {
        const vector = points[j];
        const newX = parseInt(operationX(vector.x), 10);
        const newY = parseInt(operationY(vector.y), 10);
        this.#genMeta(newX, newY);
        this.vertices[i][j] = Vector(newX, newY);
      }
    }
  }

  scale(x, y = x) {
    this.#transform(
      (vectorX) => vectorX * x,
      (vectorY) => vectorY * y,
    );
  }

  resize(w, h) {
    if (!h && !w) throw new Error('You must provide a width and height');
    const height = this.max.y - this.min.y;
    const width = this.max.x - this.min.x;
    let hratio = h / height;
    let wratio = w / width;

    if (!h) hratio = wratio;
    if (!w) wratio = hratio;

    this.#transform(
      (vectorX) => vectorX * wratio,
      (vectorY) => vectorY * hratio,
    );
  }

  translate(x, y) {
    // Coping min because it will be modified by the #transform.
    const min = { ...this.min };
    this.#transform(
      (vectorX) => vectorX - min.x + x,
      (vectorY) => vectorY - min.y + y,
    );
  }
}
