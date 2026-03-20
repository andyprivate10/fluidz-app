-- Allow users to delete their own files in avatars bucket
do $$ begin
  create policy "Users can delete own files"
    on storage.objects for delete
    to authenticated
    using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);
exception when duplicate_object then null;
end $$;
