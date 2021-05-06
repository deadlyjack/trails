interface TrailsObject{
  /**
   * Destroys the object
   */
  destroy():void;
  /**
   * Update the animation, HINT: use this method for requestAnimation
   */
  update():void;
  /**
   * Positions the image in center
   */
  positionToCenter(): void;
  /**
   * Resizes the image
   */
  resize():void;
}

declare const Trails: {
  /**
   * Creates trails for given SVG path.
   * @param SVGPath SVGPathElement of the SVG element
   * @param canvas Canvas element to draw the SVG image.
   */
  (SVGPath: SVGPathElement, canvas: HTMLCanvasElement):TrailsObject;
  /**
   * Creates trails like effect for a given text.
   * @param text The text which is to be drawn.
   * @param fontSrc Font source, this font will to applied to the given text.
   * @param canvas Canvas element to draw the text.
   */
  fromText(text:String, fontSrc: String, canvas: HTMLCanvasElement):TrailsObject;
  /**
   * Creates trails like effect for a given SVG image. SVG image should contain single path.
   * @param svg Content of the SVG file.
   * @param canvas Canvas element to draw the SVG image.
   */
  fromSVG(svg: String, canvas: HTMLCanvasElement):TrailsObject;
}

declare module '@deadlyjack/trails' {
  export = Trails;
}