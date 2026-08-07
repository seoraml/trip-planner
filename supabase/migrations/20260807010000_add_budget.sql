-- budget/expense tracking: trip_members, trip_budget_categories, expenses
-- Design rationale lives in the approved plan (see project memory: db-schema-decisions).

-- ============================================================
-- trip_members — lightweight named participants, not real accounts
-- ============================================================
create table trip_members (
  id          uuid primary key default gen_random_uuid(),
  trip_id     uuid not null references trips(id) on delete cascade,
  name        text not null,
  created_at  timestamptz not null default now()
);

create index idx_trip_members_trip on trip_members(trip_id);

-- ============================================================
-- trip_budget_categories — planned amount per category
-- ============================================================
create table trip_budget_categories (
  trip_id         uuid not null references trips(id) on delete cascade,
  category        text not null check (category in ('관광','식사','카페','쇼핑','숙소','교통','기타')),
  planned_amount  numeric(12,0) not null check (planned_amount >= 0),
  primary key (trip_id, category)
);

-- ============================================================
-- expenses — equal-split among split_member_ids (v1: no uneven splits)
-- ============================================================
create table expenses (
  id                 uuid primary key default gen_random_uuid(),
  trip_id            uuid not null references trips(id) on delete cascade,
  category           text not null check (category in ('관광','식사','카페','쇼핑','숙소','교통','기타')),
  amount             numeric(12,0) not null check (amount > 0),
  memo               text,
  paid_by            uuid references trip_members(id) on delete set null,
  split_member_ids   uuid[] not null default '{}',
  expense_date       date,
  created_at         timestamptz not null default now()
);

create index idx_expenses_trip on expenses(trip_id);

-- ============================================================
-- Row Level Security — same pattern as places/itinerary_items:
-- readable via trip visibility, writable only by trip owner
-- ============================================================
alter table trip_members enable row level security;
alter table trip_budget_categories enable row level security;
alter table expenses enable row level security;

create policy "trip members readable via trip" on trip_members
  for select using (
    exists (select 1 from trips t where t.id = trip_id
            and (t.is_public = true or t.owner_id = auth.uid())));
create policy "trip members writable by trip owner" on trip_members
  for all using (
    exists (select 1 from trips t where t.id = trip_id and t.owner_id = auth.uid()))
  with check (
    exists (select 1 from trips t where t.id = trip_id and t.owner_id = auth.uid()));

create policy "budget categories readable via trip" on trip_budget_categories
  for select using (
    exists (select 1 from trips t where t.id = trip_id
            and (t.is_public = true or t.owner_id = auth.uid())));
create policy "budget categories writable by trip owner" on trip_budget_categories
  for all using (
    exists (select 1 from trips t where t.id = trip_id and t.owner_id = auth.uid()))
  with check (
    exists (select 1 from trips t where t.id = trip_id and t.owner_id = auth.uid()));

create policy "expenses readable via trip" on expenses
  for select using (
    exists (select 1 from trips t where t.id = trip_id
            and (t.is_public = true or t.owner_id = auth.uid())));
create policy "expenses writable by trip owner" on expenses
  for all using (
    exists (select 1 from trips t where t.id = trip_id and t.owner_id = auth.uid()))
  with check (
    exists (select 1 from trips t where t.id = trip_id and t.owner_id = auth.uid()));
