-- Add optional name column to calculations so users can label their saved runs.
alter table public.calculations
  add column if not exists name text;
