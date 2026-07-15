-- CREATE TABLE public.analytics_events (
--   event_id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
--   created_at timestamp with time zone NOT NULL DEFAULT now(),
--   profile_id uuid,           -- null for anonymous/signed-out visitors
--   session_id text,           -- set when profile_id is null, groups anon activity
--   sale_id text,
--   lot_id text,
--   event_type text NOT NULL,  -- 'session_start' | 'button_click' | 'lot_time_spent' | ...
--   event_payload jsonb NOT NULL DEFAULT '{}'::jsonb,
--   geo_ip jsonb,
--   CONSTRAINT analytics_events_pkey PRIMARY KEY (event_id),
--   CONSTRAINT analytics_events_profile_id_fkey FOREIGN KEY (profile_id) REFERENCES public.profile(profile_id),
--   CONSTRAINT analytics_events_sale_id_fkey FOREIGN KEY (sale_id) REFERENCES public.sales(sales_id),
--   CONSTRAINT analytics_events_lot_id_fkey FOREIGN KEY (lot_id) REFERENCES public.lots(lot_id)
-- );

-- CREATE INDEX analytics_events_sale_id_idx ON public.analytics_events (sale_id);
-- CREATE INDEX analytics_events_lot_id_idx ON public.analytics_events (lot_id);
-- CREATE INDEX analytics_events_event_type_idx ON public.analytics_events (event_type);

-- ALTER TABLE public.analytics_events ENABLE ROW LEVEL SECURITY;

-- -- Any visitor (signed in or anonymous) can write analytics events, but
-- -- nobody can read them back through the client API — reporting/dashboards
-- -- should query this table with the service role key instead.
-- CREATE POLICY "Anyone can insert analytics events"
--   ON public.analytics_events FOR INSERT
--   WITH CHECK (true);
