import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';

/**
 * Starred lot ids for the current sale.
 * - Signed in: backed by the `watchlist` table, keyed on (profile_id, lot_id).
 * - Signed out: in-memory only for the session (does not persist across
 *   devices or reloads — the UI should make that clear, see App.jsx).
 */
export function useWatchlist(profileId, saleId) {
  const [starredIds, setStarredIds] = useState(() => new Set());
  const [loading, setLoading] = useState(true);
  const persisted = Boolean(profileId);

  useEffect(() => {
    if (!profileId || !saleId) {
      setStarredIds(new Set());
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);

    supabase
      .from('watchlist')
      .select('lot_id, lots!inner(sale_id)')
      .eq('profile_id', profileId)
      .eq('lots.sale_id', saleId)
      .then(({ data, error }) => {
        if (cancelled) return;
        if (error) {
          console.error('load watchlist error:', error.message);
          setStarredIds(new Set());
        } else {
          setStarredIds(new Set(data.map((row) => row.lot_id)));
        }
        setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [profileId, saleId]);

  const toggleStar = useCallback(
    async (lotId) => {
      const currentlyStarred = starredIds.has(lotId);

      // Optimistic update first, so the star flips instantly regardless of
      // network latency; roll back if the persisted write fails.
      setStarredIds((prev) => {
        const next = new Set(prev);
        currentlyStarred ? next.delete(lotId) : next.add(lotId);
        return next;
      });

      if (!persisted) return; // anonymous session — in-memory only

      const { error } = currentlyStarred
        ? await supabase.from('watchlist').delete().match({ profile_id: profileId, lot_id: lotId })
        : await supabase.from('watchlist').insert({ profile_id: profileId, lot_id: lotId });

      if (error) {
        console.error('toggleStar persist error:', error.message);
        // Roll back the optimistic change.
        setStarredIds((prev) => {
          const next = new Set(prev);
          currentlyStarred ? next.add(lotId) : next.delete(lotId);
          return next;
        });
      }
    },
    [starredIds, persisted, profileId]
  );

  const isStarred = useCallback((lotId) => starredIds.has(lotId), [starredIds]);

  return { starredIds, isStarred, toggleStar, loading, persisted };
}
