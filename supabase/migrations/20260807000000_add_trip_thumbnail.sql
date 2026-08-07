-- trip thumbnail upload: thumbnail_url column + Storage bucket/policies
-- Design rationale lives in the approved plan (see project memory: db-schema-decisions).

alter table trips add column thumbnail_url text;

insert into storage.buckets (id, name, public)
values ('trip-thumbnails', 'trip-thumbnails', true)
on conflict (id) do nothing;

-- anyone can view thumbnails (bucket is public, same trust level as public trips)
create policy "trip thumbnails are publicly readable" on storage.objects
  for select using (bucket_id = 'trip-thumbnails');

-- path is "{tripId}/thumbnail" — only the trip's owner may write/replace/delete it
create policy "trip owner can upload thumbnail" on storage.objects
  for insert with check (
    bucket_id = 'trip-thumbnails'
    and exists (
      select 1 from trips t
      where t.id::text = (storage.foldername(name))[1] and t.owner_id = auth.uid()
    )
  );

create policy "trip owner can replace thumbnail" on storage.objects
  for update using (
    bucket_id = 'trip-thumbnails'
    and exists (
      select 1 from trips t
      where t.id::text = (storage.foldername(name))[1] and t.owner_id = auth.uid()
    )
  );

create policy "trip owner can delete thumbnail" on storage.objects
  for delete using (
    bucket_id = 'trip-thumbnails'
    and exists (
      select 1 from trips t
      where t.id::text = (storage.foldername(name))[1] and t.owner_id = auth.uid()
    )
  );
