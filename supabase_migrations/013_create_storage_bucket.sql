-- Create animal-images storage bucket
insert into storage.buckets (id, name, public)
values ('animal-images', 'animal-images', true);

-- Create policy to allow public access to images
create policy "Public Access" on storage.objects for select using (bucket_id = 'animal-images');

-- Create policy to allow authenticated users to upload images
create policy "Allow authenticated uploads" on storage.objects 
  for insert with check (
    bucket_id = 'animal-images' 
    and auth.role() = 'authenticated'
  );

-- Create policy to allow users to update their own images
create policy "Allow own updates" on storage.objects 
  for update using (
    bucket_id = 'animal-images' 
    and auth.uid()::text = (storage.foldername(name))[1]
  );

-- Create policy to allow users to delete their own images
create policy "Allow own deletes" on storage.objects 
  for delete using (
    bucket_id = 'animal-images' 
    and auth.uid()::text = (storage.foldername(name))[1]
  );





