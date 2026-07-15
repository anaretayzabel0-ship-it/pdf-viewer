import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';

/** Current signed-in profile_id (== auth.users.id), or null if signed out. */
export function useProfile() {
  const [profileId, setProfileId] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    supabase.auth.getSession().then(({ data }) => {
      if (!cancelled) {
        setProfileId(data.session?.user?.id ?? null);
        setLoading(false);
      }
    });

    const { data: subscription } = supabase.auth.onAuthStateChange((_event, session) => {
      setProfileId(session?.user?.id ?? null);
    });

    return () => {
      cancelled = true;
      subscription.subscription.unsubscribe();
    };
  }, []);

  return { profileId, loading };
}
