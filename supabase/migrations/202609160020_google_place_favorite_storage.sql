-- V0.172 — Google Places favorites persist only provider/place identity.
-- Provider content is cleared server-side so a client cannot accidentally cache
-- Google display names or categories in the durable favorites table.

alter table public.commander_favorites
  alter column display_name drop not null;

create or replace function public.scrub_google_commander_favorite_content()
returns trigger
language plpgsql
set search_path=public
as $$
begin
  if trim(new.provider)='google-places' then
    new.display_name=null;
    new.categories='{}'::text[];
  elsif new.display_name is null or char_length(trim(new.display_name))=0 then
    raise exception 'COMMANDER_FAVORITE_DISPLAY_NAME_REQUIRED';
  end if;
  return new;
end;
$$;

drop trigger if exists commander_favorites_google_content_guard on public.commander_favorites;
create trigger commander_favorites_google_content_guard
before insert or update on public.commander_favorites
for each row execute function public.scrub_google_commander_favorite_content();
