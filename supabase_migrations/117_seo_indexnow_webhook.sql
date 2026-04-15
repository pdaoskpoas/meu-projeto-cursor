-- SEO: dispara webhook IndexNow quando entidade pública é publicada/alterada.
-- Usa tabela private.seo_settings (Supabase managed não permite ALTER DATABASE SET).
-- Segurança: /api/indexnow valida Authorization: Bearer <secret>.

create extension if not exists pg_net;

create schema if not exists private;

create table if not exists private.seo_settings (
  key   text primary key,
  value text not null
);

revoke all on schema private from public, anon, authenticated;
revoke all on private.seo_settings from public, anon, authenticated;

-- Preenchimento inicial. Troque os valores (ou rode upsert depois).
insert into private.seo_settings(key, value) values
  ('site_url', 'https://www.vitrinedocavalo.com.br'),
  ('indexnow_secret', '5FrwDVzlS31jvyPZZjgXD6JoDPQg5kFz')
on conflict (key) do update set value = excluded.value;

create or replace function public.seo_ping_indexnow()
returns trigger
language plpgsql
security definer
set search_path = private, public
as $$
declare
  v_table text := tg_table_name;
  v_url   text;
  v_sec   text;
  v_path  text;
  v_should boolean := false;
begin
  select value into v_url from private.seo_settings where key = 'site_url';
  select value into v_sec from private.seo_settings where key = 'indexnow_secret';

  if v_url is null or v_sec is null then
    return new;
  end if;

  if v_table = 'animals' then
    v_path := '/animal/' || new.id::text;
    v_should := (tg_op = 'INSERT' and coalesce(new.ad_status, 'active') not in ('suspended','deleted'))
             or (tg_op = 'UPDATE' and (
                  coalesce(old.ad_status,'') is distinct from coalesce(new.ad_status,'')
                  or coalesce(old.published_at::text,'') is distinct from coalesce(new.published_at::text,'')
                  or coalesce(old.name,'') is distinct from coalesce(new.name,'')
                  or coalesce(old.description,'') is distinct from coalesce(new.description,'')
                ));
  elsif v_table = 'articles' then
    v_path := '/noticias/' || new.id::text;
    v_should := (tg_op = 'INSERT' and coalesce(new.is_published, false) = true)
             or (tg_op = 'UPDATE' and (
                  coalesce(old.is_published, false) is distinct from coalesce(new.is_published, false)
                  or (coalesce(new.is_published, false) = true and (
                        coalesce(old.title,'')   is distinct from coalesce(new.title,'')
                     or coalesce(old.content,'') is distinct from coalesce(new.content,'')
                  ))
                ));
  elsif v_table = 'events' then
    v_path := '/eventos/' || new.id::text;
    v_should := (tg_op = 'INSERT' and coalesce(new.ad_status,'active') not in ('suspended','deleted'))
             or (tg_op = 'UPDATE' and (
                  coalesce(old.ad_status,'') is distinct from coalesce(new.ad_status,'')
                  or coalesce(old.title,'') is distinct from coalesce(new.title,'')
                  or coalesce(old.start_date::text,'') is distinct from coalesce(new.start_date::text,'')
                ));
  elsif v_table = 'profiles' then
    v_path := '/haras/' || new.id::text;
    v_should := (coalesce(new.is_active,true) = true and coalesce(new.is_suspended,false) = false)
            and (tg_op = 'INSERT'
                 or coalesce(old.is_suspended,false) is distinct from coalesce(new.is_suspended,false)
                 or coalesce(old.is_active,true)     is distinct from coalesce(new.is_active,true)
                 or coalesce(old.property_name,'')   is distinct from coalesce(new.property_name,'')
                 or coalesce(old.name,'')            is distinct from coalesce(new.name,''));
  end if;

  if v_should then
    perform net.http_post(
      url := v_url || '/api/indexnow',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || v_sec
      ),
      body := jsonb_build_object(
        'table', v_table,
        'op', tg_op,
        'urls', jsonb_build_array(v_path)
      ),
      timeout_milliseconds := 5000
    );
  end if;

  return new;
end;
$$;

drop trigger if exists trg_seo_indexnow_animals on public.animals;
create trigger trg_seo_indexnow_animals
after insert or update on public.animals
for each row execute function public.seo_ping_indexnow();

drop trigger if exists trg_seo_indexnow_articles on public.articles;
create trigger trg_seo_indexnow_articles
after insert or update on public.articles
for each row execute function public.seo_ping_indexnow();

drop trigger if exists trg_seo_indexnow_events on public.events;
create trigger trg_seo_indexnow_events
after insert or update on public.events
for each row execute function public.seo_ping_indexnow();

drop trigger if exists trg_seo_indexnow_profiles on public.profiles;
create trigger trg_seo_indexnow_profiles
after insert or update on public.profiles
for each row execute function public.seo_ping_indexnow();
