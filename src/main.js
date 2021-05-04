/* eslint-disable import/prefer-default-export */
import 'pathseg';
import * as opentype from 'opentype.js';
import Irid from 'irid';
import tag from 'html-tag-js';
import Path from './path';
import pathToVertices from './pathToVertices';
import Trace from './trace';

/**
 *
 * @param {SVGPathElement} points
 * @param {object} options
 * @param {HTMLCanvasElement} canvas
 */
export function Trails(points, canvas) {
  if (!canvas) throw new Error('Canvas required');
  const ctx = canvas.getContext('2d');
  let { height, width } = canvas;
  let dpr = window.devicePixelRatio || 1;
  let path;
  let traces;
  let imageHeight = 0;
  let imageWidth = 0.8;
  let stepFactor = 4;
  let speed = 8;
  let scale = 1;
  // let lineWidth = 1;
  let irid = Irid('#fff');
  let vertices = extractVertices(points);

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
          // case 'line-width':
          //   lineWidth = +val;
          //   break;
          case 'color':
            if (/,/.test(val)) {
              irid = val.replace(/'/g, '').split(',').map((value) => {
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

  function positionCenter() {
    if (dpr !== 1) path.scale(dpr, dpr);
    path.translate((width * dpr) / 2 - path.dim.w / 2, (height * dpr) / 2 - path.dim.h / 2);
    vertices = path.vertices;
    traces = Trace(vertices, stepFactor / dpr, speed);
  }

  function resize() {
    ({ height, width } = canvas.getBoundingClientRect());
    dpr = window.devicePixelRatio;
    canvas.height = height * dpr;
    canvas.width = width * dpr;
    // lineWidth *= dpr;
    path = new Path(vertices);
    path.scale(scale);
    path.resize(width * imageWidth, height * imageHeight);
    positionCenter();
  }

  // function drawLine(x1, y1, x2, y2, lineColor) {
  //   ctx.beginPath();
  //   ctx.strokeStyle = lineColor || color;
  //   ctx.lineWidth = lineWidth;
  //   ctx.lineCap = 'round';
  //   ctx.lineJoin = 'round';
  //   ctx.moveTo(x2 || x1, y2 || y1);
  //   ctx.lineTo(x1, y1);
  //   ctx.stroke();
  //   ctx.closePath();
  // }

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
    const sx = (x0 < x1) ? 1 : -1;
    const sy = (y0 < y1) ? 1 : -1;
    let err = dx - dy;
    const TRUE = true;

    while (TRUE) {
      callback(x0, y0);

      if ((x0 === x1) && (y0 === y1)) break;
      const e2 = 2 * err;
      if (e2 > -dy) { err -= dy; x0 += sx; }
      if (e2 < dx) { err += dx; y0 += sy; }
    }
  }

  function update() {
    if (!traces.length) return;
    traces.map((trace) => {
      if (trace.index === undefined) trace.index = 0;
      updateTrace(trace);
      return trace;
    });

    function updateTrace(trace) {
      const {
        coords,
      } = trace;
      const vector = coords[trace.index];
      trace.index += speed;
      if (trace.index >= coords.length - 1) {
        trace.index = 0;
      }
      trace.tails.add({ ...vector, oldX: trace.oldX, oldY: trace.oldY });
      const tailsLen = trace.tails.length;
      if (tailsLen) {
        trace.tails.map((tail, i) => {
          let opacity = 1 - (i / tailsLen);
          opacity = opacity < 0.5 ? 0.5 : opacity;
          let color = Array.isArray(irid)
            ? irid[parseInt(Math.random() * irid.length, 10)]
            : irid;
          color = color.opacity(opacity).toRGBString();
          clearLine(tail.x, tail.y, tail.oldX, tail.oldY);
          drawLine(
            tail.x, tail.y, tail.oldX, tail.oldY,
            color,
          );
          return tail;
        });
      }
      trace.oldX = vector.x;
      trace.oldY = vector.y;
    }
  }

  function destroy() {
    ctx.clearRect(0, 0, width, height);
    // ctx = null;
    traces = null;
    path = null;
  }

  return {
    destroy,
    update,
    positionCenter,
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
    pointsAr.map((pointAr) => {
      if (!pointAr) return null;
      const path = `${pointAr}Z`;
      verticesAr.push(pathToVertices(pathToNode(path)));
      return pointAr;
    });

    return verticesAr;
  }
}

function pathToNode(path) {
  return tag.parse(`<div><svg><path d="${path}"></svg></div>`).querySelector('path');
}

function drawLetter(font, text, fontSize, canvas) {
  const textPath = font.getPath(text, 0, 0, fontSize).toSVG();
  const $path = tag.parse(`<div><svg>${textPath}</svg></div>`).querySelector('path');
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
