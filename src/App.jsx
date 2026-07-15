import { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import PdfStage from './components/PdfStage';
import BottomNav from './components/BottomNav';
import JumpModal from './components/JumpModal';
import WatchlistModal from './components/WatchlistModal';
import MoreCarousel from './components/MoreCarousel';
import { useSaleLots } from './hooks/useSaleLots';
import { useProfile } from './hooks/useProfile';
import { useWatchlist } from './hooks/useWatchlist';
import { logEvent, fetchGeoIp, createLotTimer } from './lib/analytics';

const HOME_URL = 'https://qcow.us/sales.html';

function getSaleIdFromUrl() {
  const params = new URLSearchParams(window.location.search);
  return params.get('sale_id') || import.meta.env.VITE_DEFAULT_SALE_ID || null;
}

export default function App() {
  const saleId = useMemo(getSaleIdFromUrl, []);
  const { lots, loading, error } = useSaleLots(saleId);
  const { profileId } = useProfile();
  const { isStarred, toggleStar, starredIds, persisted } = useWatchlist(profileId, saleId);

  const [focusedLotId, setFocusedLotId] = useState(null);
  const [activeModal, setActiveModal] = useState(null); // 'jump' | 'watchlist' | 'more' | null
  const [geoIp, setGeoIp] = useState(null);

  const lotTimer = useRef(createLotTimer());

  const pdfUrl = import.meta.env.VITE_CATALOG_PDF_URL || lots[0]?.catalog_link || null;
  const focusedIndex = lots.findIndex((l) => l.lot_id === focusedLotId);
  const focusedLot = focusedIndex >= 0 ? lots[focusedIndex] : null;

  // Capture geo IP once per session on load.
  useEffect(() => {
    fetchGeoIp().then(setGeoIp);
  }, []);

  useEffect(() => {
    if (saleId) logEvent({ profileId, saleId, eventType: 'session_start', geoIp });
    // Intentionally only fires once geoIp resolves (or immediately if it's null).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [saleId, geoIp]);

  // Time-on-lot tracking: flush the previous lot's duration whenever the
  // focused lot changes, and start a new timer for the incoming one.
  useEffect(() => {
    const timer = lotTimer.current;
    const finished = timer.stop();
    if (finished && finished.lotId) {
      logEvent({
        profileId,
        saleId,
        lotId: finished.lotId,
        eventType: 'lot_time_spent',
        eventPayload: { ms: Math.round(finished.elapsedMs) },
        geoIp,
      });
    }
    if (focusedLotId) timer.start(focusedLotId);
  }, [focusedLotId, profileId, saleId, geoIp]);

  // Flush the in-progress timer if the tab is hidden or closed.
  useEffect(() => {
    const flush = () => {
      const finished = lotTimer.current.stop();
      if (finished?.lotId) {
        logEvent({
          profileId,
          saleId,
          lotId: finished.lotId,
          eventType: 'lot_time_spent',
          eventPayload: { ms: Math.round(finished.elapsedMs) },
          geoIp,
        });
      }
    };
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'hidden') flush();
    });
    window.addEventListener('pagehide', flush);
    return () => {
      window.removeEventListener('pagehide', flush);
    };
  }, [profileId, saleId, geoIp]);

  const trackClick = useCallback(
    (buttonName, extra = {}) => {
      logEvent({
        profileId,
        saleId,
        lotId: focusedLotId,
        eventType: 'button_click',
        eventPayload: { button: buttonName, ...extra },
        geoIp,
      });
    },
    [profileId, saleId, focusedLotId, geoIp]
  );

  const focusLot = useCallback(
    (lot, sourceButton) => {
      setFocusedLotId(lot.lot_id);
      setActiveModal(null);
      trackClick(sourceButton, { lot_id: lot.lot_id, lot_number: lot.lot_number });
    },
    [trackClick]
  );

  const handleHome = () => {
    trackClick('home');
    window.location.href = HOME_URL;
  };

  const handleNext = () => {
    if (focusedIndex < 0 || focusedIndex >= lots.length - 1) return;
    focusLot(lots[focusedIndex + 1], 'next');
  };

  const handlePrev = () => {
    if (focusedIndex <= 0) return;
    focusLot(lots[focusedIndex - 1], 'previous');
  };

  const handleToggleStar = () => {
    if (!focusedLot) return;
    trackClick('star', { lot_id: focusedLot.lot_id, now_starred: !isStarred(focusedLot.lot_id) });
    toggleStar(focusedLot.lot_id);
  };

  const handleOpenModal = (name) => {
    trackClick(name);
    setActiveModal((current) => (current === name ? null : name));
  };

  const watchlistLots = lots.filter((l) => starredIds.has(l.lot_id));

  if (loading) return <div className="app-status">Loading catalog…</div>;
  if (error) return <div className="app-status">Couldn't load this sale. Please try again.</div>;
  if (!saleId) return <div className="app-status">No sale selected.</div>;

  return (
    <div className="app-shell">
      <PdfStage
        pdfUrl={pdfUrl}
        focusedLot={focusedLot}
        isStarred={focusedLot ? isStarred(focusedLot.lot_id) : false}
        onToggleStar={handleToggleStar}
        onPrev={handlePrev}
        onNext={handleNext}
        hasPrev={focusedIndex > 0}
        hasNext={focusedIndex >= 0 && focusedIndex < lots.length - 1}
      />

      <BottomNav
        active={activeModal}
        hasFocusedLot={Boolean(focusedLot)}
        onHome={handleHome}
        onMore={() => focusedLot && handleOpenModal('more')}
        onWatchlist={() => handleOpenModal('watchlist')}
        onJump={() => handleOpenModal('jump')}
      />

      {activeModal === 'jump' && (
        <JumpModal lots={lots} onClose={() => setActiveModal(null)} onSelect={(lot) => focusLot(lot, 'jump')} />
      )}

      {activeModal === 'watchlist' && (
        <WatchlistModal
          lots={watchlistLots}
          persisted={persisted}
          onClose={() => setActiveModal(null)}
          onSelect={(lot) => focusLot(lot, 'watchlist')}
        />
      )}

      {activeModal === 'more' && focusedLot && (
        <MoreCarousel
          lot={focusedLot}
          onClose={() => setActiveModal(null)}
          onView={(item, i) =>
            trackClick('media_view', { lot_id: focusedLot.lot_id, media_type: item.type, media_url: item.url, index: i })
          }
        />
      )}
    </div>
  );
}
