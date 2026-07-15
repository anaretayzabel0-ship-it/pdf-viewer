import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';

/**
 * Fetches every lot for a sale in one call (page, x, y, zoom, media, etc.)
 * from the get-lot-for-pdf edge function. Jump / Watchlist / Next-Previous /
 * spotlight focus all read from this single in-memory array — no per-lot
 * network calls while navigating.
 */
export function useSaleLots(saleId) {
  const [lots, setLots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!saleId) {
      setLots([]);
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError(null);

    supabase.functions
      .invoke('get-lot-for-pdf', { body: { sale_id: saleId } })
      .then(({ data, error: fnError }) => {
        if (cancelled) return;
        if (fnError) throw fnError;
        const sorted = [...(data?.lots ?? [])].sort(
          (a, b) => (a.lot_number ?? 0) - (b.lot_number ?? 0)
        );
        setLots(sorted);
      })
      .catch((err) => {
        if (!cancelled) setError(err);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [saleId]);

  return { lots, loading, error };
}
