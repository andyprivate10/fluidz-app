-- Public bucket for profile avatars
insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do update set public = true;

-- Authenticated users can upload/update their own file: avatars/{user_id}/*
do $$ begin
  create policy "Users can upload own avatar"
    on storage.objects for insert
    to authenticated
    with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);
exception when duplicate_object then null;
end $$;

do $$ begin
  create policy "Users can update own avatar"
    on storage.objects for update
    to authenticated
    using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);
exception when duplicate_object then null;
end $$;

-- Public read for avatars (bucket is public, so objects are readable)
do $$ begin
  create policy "Public read avatars"
    on storage.objects for select
    to public
    using (bucket_id = 'avatars');
exception when duplicate_object then null;
end $$;
