-- Per-lot watchlist, keyed to an individual lot (not a whole sale), so a
-- signed-in user's starred lots persist across sessions and devices.

--CREATE TABLE public.watchlist (
  watchlist_id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  profile_id uuid NOT NULL,
  lot_id text NOT NULL,
  CONSTRAINT watchlist_pkey PRIMARY KEY (watchlist_id),
  CONSTRAINT watchlist_profile_id_fkey FOREIGN KEY (profile_id) REFERENCES public.profile(profile_id),
  CONSTRAINT watchlist_lot_id_fkey FOREIGN KEY (lot_id) REFERENCES public.lots(lot_id),
  CONSTRAINT watchlist_unique UNIQUE (profile_id, lot_id)
--);

--ALTER TABLE public.watchlist ENABLE ROW LEVEL SECURITY;

-- Each user can only see and manage their own starred lots.
--CREATE POLICY "Users can view their own watchlist"
 -- ON public.watchlist FOR SELECT
  --USING (auth.uid() = profile_id);

--CREATE POLICY "Users can add to their own watchlist"
  --ON public.watchlist FOR INSERT
 -- WITH CHECK (auth.uid() = profile_id);

--CREATE POLICY "Users can remove from their own watchlist"
 -- ON public.watchlist FOR DELETE
 -- USING (auth.uid() = profile_id);
