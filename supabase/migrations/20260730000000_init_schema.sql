-- trip-planner initial schema: trips, places, itinerary_items
-- Design rationale lives in the approved plan (see project memory: db-schema-decisions).

-- ============================================================
-- trips
-- ============================================================
create table trips (
  id           uuid primary key default gen_random_uuid(),
  owner_id     uuid references auth.users(id) on delete set null,
  title        text not null,
  country      text not null,
  city         text not null,
  start_date   date not null,
  end_date     date not null,
  description  text,
  is_public    boolean not null default true,
  share_slug   text not null unique default substr(md5(random()::text), 1, 10),
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  constraint valid_date_range check (end_date >= start_date)
);

create index idx_trips_owner on trips(owner_id);

create or replace function set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger trips_set_updated_at
  before update on trips
  for each row execute function set_updated_at();

-- ============================================================
-- places
-- ============================================================
create table places (
  id          uuid primary key default gen_random_uuid(),
  trip_id     uuid not null references trips(id) on delete cascade,
  name        text not null,
  address     text,
  lat         double precision not null,
  lng         double precision not null,
  category    text not null check (category in ('관광','식사','카페','쇼핑','숙소','교통','기타')),
  memo        text,
  created_at  timestamptz not null default now()
);

create index idx_places_trip on places(trip_id);

-- ============================================================
-- itinerary_items
-- ============================================================
create table itinerary_items (
  id          uuid primary key default gen_random_uuid(),
  trip_id     uuid not null references trips(id) on delete cascade,
  place_id    uuid not null references places(id) on delete cascade,
  date        date not null,
  time        time,
  memo        text,
  sort_order  integer not null default 0,
  created_at  timestamptz not null default now()
);

create index idx_items_trip_date on itinerary_items(trip_id, date, sort_order);
create index idx_items_place on itinerary_items(place_id);

-- ============================================================
-- Row Level Security
-- ============================================================
alter table trips enable row level security;
alter table places enable row level security;
alter table itinerary_items enable row level security;

-- trips: owner has full CRUD, anyone can read public trips
create policy "public trips are readable" on trips
  for select using (is_public = true or owner_id = auth.uid());
create policy "owner can insert" on trips
  for insert with check (owner_id = auth.uid());
create policy "owner can update" on trips
  for update using (owner_id = auth.uid());
create policy "owner can delete" on trips
  for delete using (owner_id = auth.uid());

-- places: readable if parent trip is readable, writable only by trip owner
create policy "places readable via trip" on places
  for select using (
    exists (select 1 from trips t where t.id = trip_id
            and (t.is_public = true or t.owner_id = auth.uid())));
create policy "places writable by trip owner" on places
  for all using (
    exists (select 1 from trips t where t.id = trip_id and t.owner_id = auth.uid()))
  with check (
    exists (select 1 from trips t where t.id = trip_id and t.owner_id = auth.uid()));

-- itinerary_items: same pattern as places
create policy "items readable via trip" on itinerary_items
  for select using (
    exists (select 1 from trips t where t.id = trip_id
            and (t.is_public = true or t.owner_id = auth.uid())));
create policy "items writable by trip owner" on itinerary_items
  for all using (
    exists (select 1 from trips t where t.id = trip_id and t.owner_id = auth.uid()))
  with check (
    exists (select 1 from trips t where t.id = trip_id and t.owner_id = auth.uid()));
