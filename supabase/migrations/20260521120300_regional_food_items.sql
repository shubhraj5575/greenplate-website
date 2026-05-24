-- Allow regional variants of the same food to coexist as separate rows.
-- Previously (canonical_name, data_source) was unique, so Tomato-Haryana and
-- Tomato-Delhi from the same source would conflict. Adding geographic_scope to
-- the key lets them live as distinct production rows.
--
-- NULLS NOT DISTINCT treats NULL geographic_scope as equal, so generic
-- (non-regional) rows for the same food + source still deduplicate correctly.

ALTER TABLE public.food_items
  DROP CONSTRAINT IF EXISTS food_items_canonical_name_data_source_key;

ALTER TABLE public.food_items
  ADD CONSTRAINT food_items_canonical_name_data_source_geo_key
  UNIQUE NULLS NOT DISTINCT (canonical_name, data_source, geographic_scope);
