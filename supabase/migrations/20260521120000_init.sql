-- =========================================================
-- GreenPlate v2 — initial schema
-- Project: qbslqlmmslaetylafxup
-- All tables: created_at, updated_at, RLS enabled.
-- =========================================================

create extension if not exists "pgcrypto" with schema extensions;
create extension if not exists "citext" with schema extensions;
create extension if not exists "unaccent" with schema extensions;
create extension if not exists "pg_trgm" with schema extensions;

-- Ensure extension types/opclasses (citext, gin_trgm_ops) resolve without
-- schema qualification throughout this migration.
set local search_path = public, extensions;

-- ----------------------------- enums -----------------------------

create type account_type as enum ('individual', 'organization');

create type org_type as enum (
  'restaurant', 'cafe', 'cloud_kitchen', 'bakery', 'caterer', 'other'
);

create type emission_category as enum (
  'electricity', 'lpg', 'png', 'petrol', 'diesel', 'cng',
  'transport_road', 'transport_rail', 'transport_air',
  'water', 'waste', 'refrigerant', 'packaging'
);

create type data_quality as enum ('high', 'medium', 'low');

create type calc_type as enum (
  'individual_monthly', 'individual_annual',
  'org_monthly', 'org_annual', 'menu_item'
);

-- ---------------------- updated_at trigger ----------------------

create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at := now();
  return new;
end $$;

-- ----------------------------- profiles -----------------------------

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  account_type account_type not null,
  full_name text,
  country text not null default 'IN',
  state text,
  city text,
  household_size int check (household_size is null or household_size between 1 and 30),
  onboarded_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger trg_profiles_updated before update on public.profiles
  for each row execute procedure public.set_updated_at();

-- --------------------------- organizations ---------------------------

create table public.organizations (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles(id) on delete cascade,
  name text not null,
  slug text not null unique,
  org_type org_type not null,
  employees int check (employees is null or employees >= 0),
  seats int check (seats is null or seats >= 0),
  address text,
  city text,
  state text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index idx_orgs_owner on public.organizations(owner_id);
create trigger trg_orgs_updated before update on public.organizations
  for each row execute procedure public.set_updated_at();

-- ----------------------- emission_factors (non-food) -----------------------

create table public.emission_factors (
  id uuid primary key default gen_random_uuid(),
  category emission_category not null,
  subcategory text not null,
  name text not null,
  unit text not null,
  kgco2e_per_unit numeric(12,4) not null check (kgco2e_per_unit >= 0),
  region text not null default 'IN',
  source text not null,
  source_url text,
  year int check (year is null or year between 1990 and 2100),
  confidence data_quality not null default 'medium',
  active boolean not null default true,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (category, subcategory, region, source, year)
);
create index idx_factors_category on public.emission_factors(category) where active;
create index idx_factors_region on public.emission_factors(region) where active;
create trigger trg_factors_updated before update on public.emission_factors
  for each row execute procedure public.set_updated_at();

-- ------------------------------ food_items ------------------------------

create table public.food_items (
  id uuid primary key default gen_random_uuid(),
  canonical_name citext not null,
  display_name text not null,
  name_local text,
  category text not null,
  subcategory text,
  kgco2e_per_kg numeric(12,4) not null check (kgco2e_per_kg >= 0),
  std_dev numeric(12,4),
  lca_boundary text,
  geographic_scope text,
  data_source text not null,
  source_url text,
  data_quality data_quality not null default 'medium',
  is_indian boolean not null default false,
  alt_sources jsonb not null default '[]'::jsonb,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (canonical_name, data_source)
);
create index idx_food_canonical on public.food_items(canonical_name);
create index idx_food_category on public.food_items(category);
create index idx_food_is_indian on public.food_items(is_indian) where active;
create index idx_food_name_trgm on public.food_items
  using gin (lower(display_name) extensions.gin_trgm_ops);

create trigger trg_food_updated before update on public.food_items
  for each row execute procedure public.set_updated_at();

-- ----------------------- food_items_staging (raw ingest) -----------------------

create table public.food_items_staging (
  id uuid primary key default gen_random_uuid(),
  raw_name text not null,
  canonical_name text not null,
  category text,
  subcategory text,
  kgco2e_per_kg numeric(12,4),
  std_dev numeric(12,4),
  lca_boundary text,
  geographic_scope text,
  data_source text not null,
  source_url text,
  data_quality data_quality,
  is_indian boolean default false,
  raw_payload jsonb,
  ingested_at timestamptz not null default now()
);
create index idx_staging_canonical on public.food_items_staging(canonical_name);
create index idx_staging_source on public.food_items_staging(data_source);

-- -------------------- reference_menu_items (for autocomplete) --------------------

create table public.reference_menu_items (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  category text,
  city text,
  region text,
  state text,
  price_range_inr text,
  carbon_kg_per_kg numeric(12,4),
  usage text,
  source text,
  created_at timestamptz not null default now()
);
create index idx_refmenu_name on public.reference_menu_items
  using gin (lower(name) extensions.gin_trgm_ops);

-- ----------------------------- calculations -----------------------------

create table public.calculations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  org_id uuid references public.organizations(id) on delete cascade,
  calc_type calc_type not null,
  period_start date,
  period_end date,
  inputs jsonb not null,
  breakdown jsonb not null default '{}'::jsonb,
  total_kgco2e numeric(14,4) not null check (total_kgco2e >= 0),
  scope1_kgco2e numeric(14,4),
  scope2_kgco2e numeric(14,4),
  scope3_kgco2e numeric(14,4),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index idx_calcs_user on public.calculations(user_id, created_at desc);
create index idx_calcs_org on public.calculations(org_id, created_at desc) where org_id is not null;
create trigger trg_calcs_updated before update on public.calculations
  for each row execute procedure public.set_updated_at();

-- ------------------------------ menu_items ------------------------------

create table public.menu_items (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations(id) on delete cascade,
  name text not null,
  category text,
  serving_size_g int check (serving_size_g is null or serving_size_g > 0),
  ingredients jsonb not null default '[]'::jsonb,
  monthly_servings int check (monthly_servings is null or monthly_servings >= 0),
  kgco2e_per_serving numeric(12,4),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index idx_menu_org on public.menu_items(org_id);
create trigger trg_menu_updated before update on public.menu_items
  for each row execute procedure public.set_updated_at();

-- --------------------------- contact_submissions ---------------------------

create table public.contact_submissions (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  email citext not null,
  subject text,
  message text not null,
  source_url text,
  user_agent text,
  created_at timestamptz not null default now()
);
