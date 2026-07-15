import Modal from './Modal';

/**
 * Plain row list: lot name left, filled star right, thin divider between
 * rows. No thumbnails, no extra metadata — per spec.
 */
export default function WatchlistModal({ lots, onClose, onSelect, persisted }) {
  return (
    <Modal onClose={onClose} title="Your watchlist" className="watchlist-modal">
      {!persisted && (
        <p className="watchlist-note">
          You're not signed in — this watchlist won't be saved after you leave.
        </p>
      )}

      {lots.length === 0 ? (
        <p className="empty-state">No lots starred yet. Tap the star on any lot to add it here.</p>
      ) : (
        <ul className="watchlist-rows">
          {lots.map((lot) => (
            <li key={lot.lot_id} className="watchlist-row">
              <button type="button" className="watchlist-row-button" onClick={() => onSelect(lot)}>
                <span className="watchlist-row-label">Lot {lot.lot_number}</span>
                <StarFilledIcon />
              </button>
            </li>
          ))}
        </ul>
      )}
    </Modal>
  );
}

function StarFilledIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M12 2.5l2.9 6.6 7.1.7-5.4 4.8 1.6 7-6.2-3.7-6.2 3.7 1.6-7L2 9.8l7.1-.7L12 2.5z"
        fill="#3D6D95"
      />
    </svg>
  );
}
