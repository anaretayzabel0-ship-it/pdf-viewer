import { useRef, useState } from 'react';
import Modal from './Modal';

const SWIPE_THRESHOLD_PX = 40;

/**
 * Single large square media placeholder, centered, with left/right chevrons
 * outside the placeholder at the card's edges. Supports tap and swipe.
 */
export default function MoreCarousel({ lot, onClose, onView }) {
  const media = [
    ...(lot.images ?? []).map((m) => ({ type: 'image', url: m.url })),
    ...(lot.videos ?? []).map((m) => ({ type: 'video', url: m.url })),
  ];

  const [index, setIndex] = useState(0);
  const touchStartX = useRef(null);
  const item = media[index];

  const go = (nextIndex) => {
    if (nextIndex < 0 || nextIndex >= media.length) return;
    setIndex(nextIndex);
    onView?.(media[nextIndex], nextIndex);
  };

  const onTouchStart = (e) => {
    touchStartX.current = e.touches[0].clientX;
  };
  const onTouchEnd = (e) => {
    if (touchStartX.current === null) return;
    const delta = e.changedTouches[0].clientX - touchStartX.current;
    if (delta > SWIPE_THRESHOLD_PX) go(index - 1);
    else if (delta < -SWIPE_THRESHOLD_PX) go(index + 1);
    touchStartX.current = null;
  };

  return (
    <Modal onClose={onClose} title={`Lot ${lot.lot_number} media`} className="more-modal">
      <div className="carousel">
        <button
          type="button"
          className="carousel-chevron carousel-chevron--prev"
          onClick={() => go(index - 1)}
          disabled={index === 0}
          aria-label="Previous media"
        >
          <ChevronIcon direction="left" />
        </button>

        <div
          className="carousel-placeholder"
          onTouchStart={onTouchStart}
          onTouchEnd={onTouchEnd}
        >
          {!item && <span className="carousel-empty">No media for this lot yet.</span>}
          {item?.type === 'image' && <img src={item.url} alt={`Lot ${lot.lot_number} media`} />}
          {item?.type === 'video' && (
            <video src={item.url} controls playsInline />
          )}
        </div>

        <button
          type="button"
          className="carousel-chevron carousel-chevron--next"
          onClick={() => go(index + 1)}
          disabled={index >= media.length - 1}
          aria-label="Next media"
        >
          <ChevronIcon direction="right" />
        </button>
      </div>

      {media.length > 0 && (
        <p className="carousel-counter">
          {index + 1} / {media.length}
        </p>
      )}
    </Modal>
  );
}

function ChevronIcon({ direction }) {
  const points = direction === 'left' ? '15 4 7 12 15 20' : '9 4 17 12 9 20';
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true">
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
