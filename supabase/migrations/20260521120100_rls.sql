-- =========================================================
-- Row-Level Security policies
-- Rule of thumb: factor + food data is public-read; everything tied to a user
-- is scoped to that user.
-- =========================================================

alter table public.profiles               enable row level security;
alter table public.organizations          enable row level security;
alter table public.emission_factors       enable row level security;
alter table public.food_items             enable row level security;
alter table public.food_items_staging     enable row level security;
alter table public.reference_menu_items   enable row level security;
alter table public.calculations           enable row level security;
alter table public.menu_items             enable row level security;
alter table public.contact_submissions    enable row level security;

-- profiles: self-access only
create policy "profiles: self read"   on public.profiles
  for select using (auth.uid() = id);
create policy "profiles: self insert" on public.profiles
  for insert with check (auth.uid() = id);
create policy "profiles: self update" on public.profiles
  for update using (auth.uid() = id) with check (auth.uid() = id);
create policy "profiles: self delete" on public.profiles
  for delete using (auth.uid() = id);

-- organizations: owner only
create policy "orgs: owner read"   on public.organizations
  for select using (auth.uid() = owner_id);
create policy "orgs: owner insert" on public.organizations
  for insert with check (auth.uid() = owner_id);
create policy "orgs: owner update" on public.organizations
  for update using (auth.uid() = owner_id) with check (auth.uid() = owner_id);
create policy "orgs: owner delete" on public.organizations
  for delete using (auth.uid() = owner_id);

-- emission_factors + food_items + reference_menu_items: public read, no writes from clients
create policy "factors: public read" on public.emission_factors
  for select using (active);
create policy "food: public read" on public.food_items
  for select using (active);
create policy "refmenu: public read" on public.reference_menu_items
  for select using (true);

-- food_items_staging: no client access (service role only)
-- (no policies = denied; service role bypasses RLS)

-- calculations: scoped by user (and via org_id if present)
create policy "calcs: owner read" on public.calculations
  for select using (
    auth.uid() = user_id
    or (org_id is not null and exists (
      select 1 from public.organizations o
      where o.id = calculations.org_id and o.owner_id = auth.uid()
    ))
  );
create policy "calcs: owner insert" on public.calculations
  for insert with check (auth.uid() = user_id);
create policy "calcs: owner update" on public.calculations
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "calcs: owner delete" on public.calculations
  for delete using (auth.uid() = user_id);

-- menu_items: scoped to org owner
create policy "menu: owner read" on public.menu_items
  for select using (exists (
    select 1 from public.organizations o
    where o.id = menu_items.org_id and o.owner_id = auth.uid()
  ));
create policy "menu: owner insert" on public.menu_items
  for insert with check (exists (
    select 1 from public.organizations o
    where o.id = menu_items.org_id and o.owner_id = auth.uid()
  ));
create policy "menu: owner update" on public.menu_items
  for update using (exists (
    select 1 from public.organizations o
    where o.id = menu_items.org_id and o.owner_id = auth.uid()
  )) with check (exists (
    select 1 from public.organizations o
    where o.id = menu_items.org_id and o.owner_id = auth.uid()
  ));
create policy "menu: owner delete" on public.menu_items
  for delete using (exists (
    select 1 from public.organizations o
    where o.id = menu_items.org_id and o.owner_id = auth.uid()
  ));

-- contact_submissions: public insert (form), no read for clients
create policy "contact: public insert" on public.contact_submissions
  for insert with check (true);
