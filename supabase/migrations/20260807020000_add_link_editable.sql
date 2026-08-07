-- shared-link edit access: owner can let logged-in visitors edit trip content
-- Design rationale lives in the approved plan (see project memory: db-schema-decisions).

alter table trips add column link_editable boolean not null default false;

-- Content tables writable by a logged-in (non-anonymous) visitor when the
-- trip owner has turned link_editable on. Scope is content only — trips'
-- own metadata/delete stays owner-only (no new policy on trips itself).
create policy "places writable by link editor" on places
  for all using (
    exists (select 1 from trips t where t.id = trip_id
            and t.is_public = true and t.link_editable = true)
    and coalesce((auth.jwt() ->> 'is_anonymous')::boolean, true) = false
  )
  with check (
    exists (select 1 from trips t where t.id = trip_id
            and t.is_public = true and t.link_editable = true)
    and coalesce((auth.jwt() ->> 'is_anonymous')::boolean, true) = false
  );

create policy "items writable by link editor" on itinerary_items
  for all using (
    exists (select 1 from trips t where t.id = trip_id
            and t.is_public = true and t.link_editable = true)
    and coalesce((auth.jwt() ->> 'is_anonymous')::boolean, true) = false
  )
  with check (
    exists (select 1 from trips t where t.id = trip_id
            and t.is_public = true and t.link_editable = true)
    and coalesce((auth.jwt() ->> 'is_anonymous')::boolean, true) = false
  );

create policy "trip members writable by link editor" on trip_members
  for all using (
    exists (select 1 from trips t where t.id = trip_id
            and t.is_public = true and t.link_editable = true)
    and coalesce((auth.jwt() ->> 'is_anonymous')::boolean, true) = false
  )
  with check (
    exists (select 1 from trips t where t.id = trip_id
            and t.is_public = true and t.link_editable = true)
    and coalesce((auth.jwt() ->> 'is_anonymous')::boolean, true) = false
  );

create policy "budget categories writable by link editor" on trip_budget_categories
  for all using (
    exists (select 1 from trips t where t.id = trip_id
            and t.is_public = true and t.link_editable = true)
    and coalesce((auth.jwt() ->> 'is_anonymous')::boolean, true) = false
  )
  with check (
    exists (select 1 from trips t where t.id = trip_id
            and t.is_public = true and t.link_editable = true)
    and coalesce((auth.jwt() ->> 'is_anonymous')::boolean, true) = false
  );

create policy "expenses writable by link editor" on expenses
  for all using (
    exists (select 1 from trips t where t.id = trip_id
            and t.is_public = true and t.link_editable = true)
    and coalesce((auth.jwt() ->> 'is_anonymous')::boolean, true) = false
  )
  with check (
    exists (select 1 from trips t where t.id = trip_id
            and t.is_public = true and t.link_editable = true)
    and coalesce((auth.jwt() ->> 'is_anonymous')::boolean, true) = false
  );
