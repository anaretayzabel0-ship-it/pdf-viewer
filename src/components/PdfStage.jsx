import { useCallback, useEffect, useRef, useState } from 'react';
import { pdfjsLib } from '../lib/pdfjs';
import { getLotViewportRect } from '../lib/geometry';
import SpotlightMask from './SpotlightMask';
import FocusedLotControls from './FocusedLotControls';

const DEFAULT_SCALE = 1.2; // used when no lot is focused (whole-page view)

export default function PdfStage({
  pdfUrl,
  focusedLot,
  isStarred,
  onToggleStar,
  onPrev,
  onNext,
  hasPrev,
  hasNext,
}) {
  const containerRef = useRef(null);
  const canvasRef = useRef(null);
  const renderTaskRef = useRef(null);

  const [pdfDoc, setPdfDoc] = useState(null);
  const [viewport, setViewport] = useState(null);
  const [cutoutRect, setCutoutRect] = useState(null);
  const [error, setError] = useState(null);

  // Load the document once per URL.
  useEffect(() => {
    if (!pdfUrl) return;
    let cancelled = false;
    setError(null);

    pdfjsLib
      .getDocument(pdfUrl)
      .promise.then((doc) => {
        if (!cancelled) setPdfDoc(doc);
      })
      .catch((err) => {
        if (!cancelled) setError(err);
      });

    return () => {
      cancelled = true;
    };
  }, [pdfUrl]);

  const renderPage = useCallback(
    async (pageNumber, scale) => {
      if (!pdfDoc) return;
      const page = await pdfDoc.getPage(pageNumber);
      const vp = page.getViewport({ scale });

      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      const outputScale = window.devicePixelRatio || 1;

      canvas.width = Math.floor(vp.width * outputScale);
      canvas.height = Math.floor(vp.height * outputScale);
      canvas.style.width = `${vp.width}px`;
      canvas.style.height = `${vp.height}px`;

      const transform = outputScale !== 1 ? [outputScale, 0, 0, outputScale, 0, 0] : null;

      // Cancel any in-flight render (rapid Next/Previous taps) before
      // starting a new one — pdf.js throws if you render onto a canvas
      // that's already mid-render.
      if (renderTaskRef.current) {
        renderTaskRef.current.cancel();
      }
      const task = page.render({ canvasContext: ctx, viewport: vp, transform });
      renderTaskRef.current = task;

      try {
        await task.promise;
      } catch (err) {
        if (err?.name === 'RenderingCancelledException') return;
        setError(err);
        return;
      }

      setViewport(vp);
    },
    [pdfDoc]
  );

  // Re-render whenever the focused lot changes (page and/or zoom).
  useEffect(() => {
    if (!pdfDoc) return;
    const pageNumber = focusedLot?.page ?? 1;
    const scale = focusedLot?.zoom ?? DEFAULT_SCALE;
    renderPage(pageNumber, scale);
  }, [pdfDoc, focusedLot, renderPage]);

  // Once the page is rendered at the right viewport, compute the cutout and
  // scroll it to the center of the visible area. Recomputed on every
  // viewport/zoom change per spec, since screen-space coordinates shift.
  useEffect(() => {
    if (!viewport || !focusedLot) {
      setCutoutRect(null);
      return;
    }

    const rect = getLotViewportRect(viewport, focusedLot);
    setCutoutRect(rect);

    const container = containerRef.current;
    if (container) {
      const targetLeft = rect.x + rect.width / 2 - container.clientWidth / 2;
      const targetTop = rect.y + rect.height / 2 - container.clientHeight / 2;
      container.scrollTo({
        left: Math.max(targetLeft, 0),
        top: Math.max(targetTop, 0),
        behavior: 'smooth',
      });
    }
  }, [viewport, focusedLot]);

  if (error) {
    return (
      <div className="pdf-error" role="alert">
        Couldn't load the catalog PDF. Please try again.
      </div>
    );
  }

  return (
    <div className="pdf-stage" ref={containerRef}>
      <div className="pdf-page-wrap">
        <canvas ref={canvasRef} className="pdf-canvas" />
        {viewport && cutoutRect && (
          <SpotlightMask width={viewport.width} height={viewport.height} cutout={cutoutRect} />
        )}
      </div>

      {cutoutRect && (
        <div className="focused-lot-overlay-layer">
          <FocusedLotControls
            lot={focusedLot}
            cutout={cutoutRect}
            isStarred={isStarred}
            onToggleStar={onToggleStar}
            onPrev={onPrev}
            onNext={onNext}
            hasPrev={hasPrev}
            hasNext={hasNext}
          />
        </div>
      )}
    </div>
  );
}
