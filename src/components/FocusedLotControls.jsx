/**
 * The interactive layer on top of the spotlighted lot: lot label (top-left),
 * star toggle (top-right), and Next/Previous chevrons sitting just outside
 * the card edges.
 *
 * Positioned at dead-center of the PDF stage's viewport (not in canvas
 * scroll-space) — since PdfStage always scrolls so the cutout is centered,
 * anchoring this overlay to "center of the visible area" instead of to raw
 * canvas coordinates keeps it correctly placed regardless of scroll timing.
 */
export default function FocusedLotControls({
  lot,
  cutout,
  isStarred,
  onToggleStar,
  onPrev,
  onNext,
  hasPrev,
  hasNext,
}) {
  if (!lot || !cutout) return null;

  return (
    <div
      className="focused-lot-overlay"
      style={{ width: cutout.width, height: cutout.height }}
    >
      <div className="focused-lot-card-chrome">
        <span className="lot-label">Lot {lot.lot_number}</span>

        <button
          type="button"
          className={`star-toggle${isStarred ? ' is-starred' : ''}`}
          aria-pressed={isStarred}
          aria-label={isStarred ? 'Remove from watchlist' : 'Add to watchlist'}
          onClick={onToggleStar}
        >
          <StarIcon filled={isStarred} />
        </button>
      </div>

      <button
        type="button"
        className="lot-chevron lot-chevron--prev"
        onClick={onPrev}
        disabled={!hasPrev}
        aria-label="Previous lot"
      >
        <ChevronIcon direction="left" />
      </button>

      <button
        type="button"
        className="lot-chevron lot-chevron--next"
        onClick={onNext}
        disabled={!hasNext}
        aria-label="Next lot"
      >
        <ChevronIcon direction="right" />
      </button>
    </div>
  );
}

// Placeholder icon — swap for the Figma-exported star asset per the spec
// (outline library star, filled when active).
function StarIcon({ filled }) {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M12 2.5l2.9 6.6 7.1.7-5.4 4.8 1.6 7-6.2-3.7-6.2 3.7 1.6-7L2 9.8l7.1-.7L12 2.5z"
        fill={filled ? '#3D6D95' : 'none'}
        stroke="#3D6D95"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function ChevronIcon({ direction }) {
  const points = direction === 'left' ? '15 4 7 12 15 20' : '9 4 17 12 9 20';
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
      <polyline
        points={points}
        fill="none"
        stroke="currentColor"
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
