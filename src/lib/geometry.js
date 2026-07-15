// Geometry helpers for the spotlight mask.
//
// The `lots` table stores a point (x, y) + a zoom level per lot — not a full
// bounding box. So the cutout is: a fixed-size window in PDF point-space,
// centered on (x, y), rendered at the lot's chosen zoom.
//
// If lot blocks vary a lot in size across the catalog, these constants (or an
// eventual per-lot width/height column) are the place to make that per-lot.

export const CUTOUT_WIDTH_PT = 240;
export const CUTOUT_HEIGHT_PT = 120;

/**
 * Build the PDF-point-space rectangle for a lot's spotlight cutout.
 * (x, y) is treated as the center of the block, per PDF's bottom-left-origin
 * coordinate convention.
 */
export function getCutoutPdfRect(lot, {
  width = CUTOUT_WIDTH_PT,
  height = CUTOUT_HEIGHT_PT,
} = {}) {
  const halfW = width / 2;
  const halfH = height / 2;
  return [lot.x - halfW, lot.y - halfH, lot.x + halfW, lot.y + halfH];
}

/**
 * Convert a PDF-point-space rect into on-screen viewport pixels for the
 * current pdf.js viewport. Always go through pdf.js's own conversion so the
 * Y-flip (PDF origin bottom-left, canvas origin top-left) and current zoom
 * are handled consistently — never hand-roll this math.
 *
 * @param {import('pdfjs-dist').PageViewport} viewport
 * @param {[number, number, number, number]} pdfRect [x1, y1, x2, y2]
 */
export function pdfRectToViewportRect(viewport, pdfRect) {
  const [vx1, vy1, vx2, vy2] = viewport.convertToViewportRectangle(pdfRect);
  return {
    x: Math.min(vx1, vx2),
    y: Math.min(vy1, vy2),
    width: Math.abs(vx2 - vx1),
    height: Math.abs(vy2 - vy1),
  };
}

/**
 * Convenience: go straight from a lot row + viewport to an on-screen cutout
 * rect, in one call.
 */
export function getLotViewportRect(viewport, lot, sizeOverride) {
  const pdfRect = getCutoutPdfRect(lot, sizeOverride);
  return pdfRectToViewportRect(viewport, pdfRect);
}
