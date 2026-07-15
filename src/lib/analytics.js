import { supabase } from './supabaseClient';

const SESSION_KEY = 'cattle_viewer_session_id';

/**
 * A stable per-tab session id, used to group anonymous events when there's
 * no signed-in profile_id. Held in memory (not localStorage) per this
 * project's rule against browser storage in the shared artifact environment;
 * outside of that constraint, sessionStorage would also be reasonable here.
 */
let sessionId = null;
export function getSessionId() {
  if (!sessionId) {
    sessionId = `${SESSION_KEY}_${crypto.randomUUID()}`;
  }
  return sessionId;
}

/**
 * Write one analytics event row. Fire-and-forget by design — analytics
 * should never block or break the viewing experience.
 */
export async function logEvent({ profileId, saleId, lotId = null, eventType, eventPayload = {}, geoIp = null }) {
  try {
    const { error } = await supabase.from('analytics_events').insert({
      profile_id: profileId ?? null,
      session_id: profileId ? null : getSessionId(),
      sale_id: saleId ?? null,
      lot_id: lotId,
      event_type: eventType,
      event_payload: eventPayload,
      geo_ip: geoIp,
    });
    if (error) console.error('analytics logEvent error:', error.message);
  } catch (err) {
    console.error('analytics logEvent failed:', err);
  }
}

/**
 * Fetch the visitor's geo IP info once per session. Prefers a same-origin
 * Supabase Edge Function (reads request headers server-side — more reliable
 * and avoids a third-party client-side call); falls back to a configured
 * public endpoint if provided.
 *
 * Geo IP is still on the to-do list (no `get-geo-ip` function deployed yet),
 * so this is a no-op — returning null immediately — until
 * VITE_ENABLE_GEO_IP=true is set. That keeps the rest of analytics (button
 * clicks, time-on-lot) working without console noise from calls to a
 * function that doesn't exist yet.
 */
export async function fetchGeoIp() {
  if (import.meta.env.VITE_ENABLE_GEO_IP !== 'true') return null;

  try {
    const { data, error } = await supabase.functions.invoke('get-geo-ip');
    if (!error && data) return data;
  } catch {
    // fall through to client-side fallback below
  }

  const endpoint = import.meta.env.VITE_GEO_IP_ENDPOINT;
  if (!endpoint) return null;

  try {
    const res = await fetch(endpoint);
    if (!res.ok) return null;
    return await res.json();
  } catch (err) {
    console.error('fetchGeoIp fallback failed:', err);
    return null;
  }
}

/**
 * Simple stopwatch for "time spent on lot" tracking. Call start() when a lot
 * becomes spotlighted, stop() when it's deselected/replaced/navigated away
 * from — stop() returns the elapsed milliseconds and is idempotent-safe.
 */
export function createLotTimer() {
  let startedAt = null;
  let lotId = null;

  return {
    start(id) {
      startedAt = performance.now();
      lotId = id;
    },
    stop() {
      if (startedAt === null) return null;
      const elapsedMs = performance.now() - startedAt;
      const finishedLotId = lotId;
      startedAt = null;
      lotId = null;
      return { lotId: finishedLotId, elapsedMs };
    },
    isRunning() {
      return startedAt !== null;
    },
  };
}
