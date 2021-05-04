# TRAILS.js

Create trails like effect for text and svg image using JavaScript canvas.

## Usage

### How to import?

```js
import Trails from 'trails';
```

### How to use it for text

```js
const $canvas = document.getElementById('canvas');
(async ()=>{
  const trails = await Trails.fromText(
    'foxdebug',
    './Lobster/Lobster-Regular.ttf',
    $canvas
  );
  animation();
})();

window.addEventListener('resize', trails.resize);

function animation() {
  trails.update();
  requestAnimationFrame(animation);
}
```

## Docs

### Methods

**fromText**: Use this method to render text on canvas

- **text** ([String][1]) : Text you want to render
- **font** ([String][1]) : Link to font file
- **canvas** ([HTMLCanvasElement][2]) : Canvas reference

**fromSVG**: Use this method to render svg file on canvas

- **svg** ([String][1]) : SVG file text content
- **canvas** ([HTMLCanvasElement][2]) : Canvas reference

[1]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String
[2]: https://developer.mozilla.org/en-US/docs/Web/API/HTMLCanvasElement
