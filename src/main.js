import 'pathseg';
import 'html-tag-js/dist/polyfill';
import * as opentype from 'opentype.js';
import Irid from 'irid';
import tag from 'html-tag-js';
import Path from './path';
import pathToVertices from './pathToVertices';
import Trace from './trace';

// TODO: add option for width of the line

/**
 * @param {SVGPathElement} SVGPath
 * @param {HTMLCanvasElement} canvas
 */
// eslint-disable-next-line import/prefer-default-export
export function Trails(SVGPath, canvas) {
  if (!canvas) throw new Error('Canvas required');
  let ctx = canvas.getContext('2d');
  let { height, width } = canvas;
  let dpr = window.devicePixelRatio || 1;
  let path;
  let traces;
  let imageHeight = 0;
  let imageWidth = 0.8;
  let stepFactor = 4;
  let speed = 8;
  let scale = 1;
  let irid = Irid('#fff');
  let vertices = extractVertices(SVGPath);
  let fill = 'transparent';

  reloadOptions();
  resize();

  function reloadOptions() {
    const data = canvas.getAttribute('data-options');
    if (data) {
      const separator = /,(?=(?:(?:[^']*'){2})*[^')]*$)/;
      data.split(separator).forEach((option) => {
        const [attr, val] = option.split('=').map((el) => el.trim());
        switch (attr) {
          case 'image-height':
            imageHeight = +val;
            break;
          case 'image-width':
            imageWidth = +val;
            break;
          case 'speed':
            speed = +val > 10 ? 10 : +val;
            break;
          case 'step-factor':
            stepFactor = +val;
            break;
          case 'scale':
            scale = +val;
            break;
          case 'fill':
            fill = val;
            break;
          case 'color':
            if (/,/.test(val)) {
              irid = val
                .replace(/'/g, '')
                .split(',')
                .map((value) => {
                  value = value.trim();
                  return Irid(value);
                });
            } else {
              irid = Irid(val);
            }
            break;
          default:
            break;
        }
      });
    }
  }

  function positionToCenter() {
    if (dpr !== 1) path.scale(dpr, dpr);
    path.translate(
      (width * dpr) / 2 - path.dim.w / 2,
      (height * dpr) / 2 - path.dim.h / 2,
    );
    vertices = path.vertices;
    traces = Trace(vertices, stepFactor / dpr, speed);
  }

  function resize() {
    ({ height, width } = canvas.getBoundingClientRect());
    dpr = window.devicePixelRatio;
    canvas.height = height * dpr;
    canvas.width = width * dpr;
    path = new Path(vertices);
    path.scale(scale);
    path.resize(width * imageWidth, height * imageHeight);
    positionToCenter();
  }

  function drawLine(x1, y1, x2, y2, lineColor) {
    line(x1, y1, x2, y2, setPixel);
    function setPixel(x, y) {
      ctx.fillStyle = lineColor;
      ctx.fillRect(x, y, 1, 1);
    }
  }

  function clearLine(x1, y1, x2, y2) {
    line(x1, y1, x2, y2, setPixel);
    function setPixel(x, y) {
      ctx.clearRect(x, y, 1, 1);
    }
  }

  function line(x0, y0, x1, y1, callback) {
    if (!x0 || !y0) return;
    if (!x1) x1 = x0;
    if (!y1) y1 = y0;
    const dx = Math.abs(x1 - x0);
    const dy = Math.abs(y1 - y0);
    const sx = x0 < x1 ? 1 : -1;
    const sy = y0 < y1 ? 1 : -1;
    let err = dx - dy;
    const TRUE = true;

    while (TRUE) {
      callback(x0, y0);

      if (x0 === x1 && y0 === y1) break;
      const e2 = 2 * err;
      if (e2 > -dy) {
        err -= dy;
        x0 += sx;
      }
      if (e2 < dx) {
        err += dx;
        y0 += sy;
      }
    }
  }

  function update() {
    const tracesLength = traces.length;

    for (let i = 0; i < tracesLength; i++) {
      const trace = traces[i];
      if (trace.index === undefined) trace.index = 0;
      updateTrace(trace);
    }

    function updateTrace(trace) {
      const { coords } = trace;
      const vector = coords[trace.index];
      trace.index += speed;
      if (trace.index >= coords.length - 1) {
        trace.index = 0;
      }
      trace.tails.add({ ...vector, oldX: trace.oldX, oldY: trace.oldY });
      const tailsLen = trace.tails.length;
      if (tailsLen) {
        const { tails } = trace;
        const tlen = tails.length;

        for (let i = 0; i < tlen; ++i) {
          const tail = tails[i];
          const randomIndex = Math.round(Math.random() * (irid.length - 1));
          let opacity = 1 - i / tailsLen;
          opacity = opacity < 0.5 ? 0.5 : opacity;
          let color = Array.isArray(irid) ? irid[randomIndex] : irid;
          color = color.opacity(opacity).toRGBString();
          clearLine(tail.x, tail.y, tail.oldX, tail.oldY);
          drawLine(tail.x, tail.y, tail.oldX, tail.oldY, color);
        }
      }
      trace.oldX = vector.x;
      trace.oldY = vector.y;
    }
  }

  function destroy() {
    ctx.clearRect(0, 0, width, height);
    ctx = null;
    traces = null;
    path = null;
  }

  return {
    destroy,
    update,
    positionToCenter,
    resize,
  };
}

Trails.fromText = function fromText(text, fontSrc, $canvas) {
  return new Promise((resolve, reject) => {
    opentype.load(fontSrc, (err, font) => {
      if (err) reject(err instanceof Error ? err : new Error(err));
      const trails = drawLetter(font, text, 48, $canvas);
      resolve(trails);
    });
  });
};

Trails.fromSVG = function fromSVG(svg, canvas) {
  if (!svg || !canvas) throw new Error('Missing arguments.');
  const $svgPath = getPath(svg);
  const trails = Trails($svgPath, canvas);
  window.addEventListener('resize', () => {
    trails.resize();
  });
  return trails;
};

/**
 *
 * @param {string|SVGPathElement} points
 */
function extractVertices(points) {
  if (points instanceof SVGPathElement) {
    return extract(points.getAttribute('d'));
  }
  return extract(points);

  /**
   *
   * @param {string} extractPoints
   */
  function extract(extractPoints) {
    const pointsAr = extractPoints.split(/[Zz]/g);
    const verticesAr = [];

    const len = pointsAr.length;
    for (let i = 0; i < len; ++i) {
      const pointAr = pointsAr[i];
      if (pointAr) {
        verticesAr.push(pathToVertices(pathToNode(`${pointAr}Z`)));
      }
    }

    return verticesAr;
  }
}

function pathToNode(path) {
  return tag
    .parse(`<div><svg><path d="${path}"></svg></div>`)
    .querySelector('path');
}

function drawLetter(font, text, fontSize, canvas) {
  const textPath = font.getPath(text, 0, 0, fontSize).toSVG();
  const $path = tag
    .parse(`<div><svg>${textPath}</svg></div>`)
    .querySelector('path');
  const trails = Trails($path, canvas);

  return trails;
}

/**
 * @param {string} svg
 */
function getPath(svg) {
  /**
   * @type {SVGElement}
   */
  const $svg = tag('div', {
    innerHTML: svg,
  }).querySelector('svg');
  return $svg.querySelectorAll('path')[0];
}
