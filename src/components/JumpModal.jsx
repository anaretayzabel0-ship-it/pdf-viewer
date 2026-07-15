import { useRef, useState } from 'react';
import Modal from './Modal';

const ITEM_HEIGHT = 44;

/**
 * Scrollable spinner picker (iOS-style): the centered lot renders large and
 * bold, neighbors render smaller and muted, with divider lines bracketing
 * the centered slot. Tapping "View lot" (or a non-centered row, which
 * re-centers it first) runs the spotlight focus flow.
 */
export default function JumpModal({ lots, onClose, onSelect }) {
  const listRef = useRef(null);
  const [centeredIndex, setCenteredIndex] = useState(0);
  const scrollTimeout = useRef(null);

  const handleScroll = () => {
    const el = listRef.current;
    if (!el) return;

    // Debounce so we settle on the final resting index, not every frame.
    if (scrollTimeout.current) clearTimeout(scrollTimeout.current);
    scrollTimeout.current = setTimeout(() => {
      const index = Math.round(el.scrollTop / ITEM_HEIGHT);
      setCenteredIndex(Math.max(0, Math.min(index, lots.length - 1)));
    }, 60);
  };

  const scrollToIndex = (index) => {
    const el = listRef.current;
    if (!el) return;
    el.scrollTo({ top: index * ITEM_HEIGHT, behavior: 'smooth' });
    setCenteredIndex(index);
  };

  const centeredLot = lots[centeredIndex];

  return (
    <Modal onClose={onClose} title="Jump to a lot" className="spinner-modal">
      <div className="spinner-window">
        <div className="spinner-highlight" style={{ height: ITEM_HEIGHT }} />
        <div className="spinner-list" ref={listRef} onScroll={handleScroll}>
          <div style={{ height: `calc(50% - ${ITEM_HEIGHT / 2}px)` }} />
          {lots.map((lot, i) => (
            <button
              key={lot.lot_id}
              type="button"
              className={`spinner-item${i === centeredIndex ? ' is-centered' : ''}`}
              style={{ height: ITEM_HEIGHT }}
              onClick={() => scrollToIndex(i)}
            >
              {i === centeredIndex ? `LOT ${lot.lot_number}` : `Lot ${lot.lot_number}`}
            </button>
          ))}
          <div style={{ height: `calc(50% - ${ITEM_HEIGHT / 2}px)` }} />
        </div>
      </div>

      <button
        type="button"
        className="primary-button"
        disabled={!centeredLot}
        onClick={() => centeredLot && onSelect(centeredLot)}
      >
        View lot
      </button>
    </Modal>
  );
}
