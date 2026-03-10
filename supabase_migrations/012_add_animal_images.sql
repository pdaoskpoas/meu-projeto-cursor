-- Add images column to animals to store uploaded photo URLs
alter table public.animals
  add column if not exists images jsonb not null default '[]'::jsonb;







