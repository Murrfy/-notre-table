-- V0.195 — LIA relational foundation.
-- Adds current relationship status to the organizer profile, makes organizer age optional,
-- and provides a private structured memory for non-transcript relationship facts.

alter table public.profiles add column if not exists relationship_status text;
do $$ begin
  alter table public.profiles add constraint profiles_relationship_status_check
    check (relationship_status is null or relationship_status in ('single','married','divorced','partnered'));
exception when duplicate_object then null; end $$;

create table if not exists public.lia_relationship_facts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  topic text not null check (topic in ('food','family','personal_history','plans','leisure','style','travel')),
  subject_label text not null default '',
  fact_key text not null check (char_length(trim(fact_key)) between 1 and 80),
  fact_value text not null check (char_length(trim(fact_value)) between 1 and 1000),
  sensitivity text not null default 'ordinary' check (sensitivity in ('ordinary','personal','sensitive')),
  household_safe boolean not null default false,
  confirmed boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(user_id,topic,subject_label,fact_key)
);

alter table public.lia_relationship_facts enable row level security;
drop policy if exists lia_relationship_facts_select_own on public.lia_relationship_facts;
create policy lia_relationship_facts_select_own on public.lia_relationship_facts for select to authenticated using (user_id=auth.uid());
drop policy if exists lia_relationship_facts_insert_own on public.lia_relationship_facts;
create policy lia_relationship_facts_insert_own on public.lia_relationship_facts for insert to authenticated with check (user_id=auth.uid());
drop policy if exists lia_relationship_facts_update_own on public.lia_relationship_facts;
create policy lia_relationship_facts_update_own on public.lia_relationship_facts for update to authenticated using (user_id=auth.uid()) with check (user_id=auth.uid());
drop policy if exists lia_relationship_facts_delete_own on public.lia_relationship_facts;
create policy lia_relationship_facts_delete_own on public.lia_relationship_facts for delete to authenticated using (user_id=auth.uid());

create or replace function public.complete_household_family_setup_v2(
  p_household_id uuid,
  p_display_name text,
  p_salutation text,
  p_age integer,
  p_phone_number text,
  p_relationship_status text,
  p_members jsonb
)
returns void
language plpgsql security definer set search_path=public as $$
declare
  v_member jsonb;
  v_relation text;
  v_relation_label text;
  v_salutation text;
  v_name text;
  v_age integer;
  v_phone text;
  v_count integer;
  v_phone_key text;
  v_seen_phones text[] := array[]::text[];
begin
  if auth.uid() is null then raise exception 'AUTHENTICATION_REQUIRED'; end if;
  if not public.is_household_admin(p_household_id) then raise exception 'ADMIN_REQUIRED'; end if;
  if char_length(trim(coalesce(p_display_name,''))) not between 2 and 60 then raise exception 'INVALID_DISPLAY_NAME'; end if;
  if p_salutation not in ('mr','mrs','other') then raise exception 'INVALID_SALUTATION'; end if;
  if p_age is not null and p_age not between 0 and 120 then raise exception 'INVALID_AGE'; end if;
  if p_relationship_status is not null and p_relationship_status not in ('single','married','divorced','partnered') then raise exception 'INVALID_RELATIONSHIP_STATUS'; end if;
  if p_phone_number is not null and trim(p_phone_number)<>'' then
    if char_length(trim(p_phone_number)) not between 6 and 32 then raise exception 'INVALID_PHONE_NUMBER'; end if;
    v_phone_key=regexp_replace(p_phone_number,'[^0-9]','','g');
    if char_length(v_phone_key)<6 then raise exception 'INVALID_PHONE_NUMBER'; end if;
    v_seen_phones=array_append(v_seen_phones,v_phone_key);
  end if;
  if p_members is null or jsonb_typeof(p_members)<>'array' then raise exception 'INVALID_FAMILY_MEMBERS'; end if;
  v_count=jsonb_array_length(p_members);
  if v_count>19 then raise exception 'TOO_MANY_FAMILY_MEMBERS'; end if;

  for v_member in select value from jsonb_array_elements(p_members)
  loop
    v_relation=coalesce(v_member->>'relation','');
    v_relation_label=nullif(trim(coalesce(v_member->>'relation_label','')),'');
    v_salutation=nullif(v_member->>'salutation','');
    v_name=trim(coalesce(v_member->>'display_name',''));
    begin v_age=nullif(v_member->>'age','')::integer; exception when others then raise exception 'INVALID_MEMBER_AGE'; end;
    v_phone=nullif(trim(coalesce(v_member->>'phone_number','')),'');
    if v_relation not in ('spouse','child','other') then raise exception 'INVALID_MEMBER_RELATION'; end if;
    if v_relation='other' and (v_relation_label is null or char_length(v_relation_label) not between 1 and 40) then raise exception 'INVALID_MEMBER_RELATION_LABEL'; end if;
    if v_salutation is not null and v_salutation not in ('mr','mrs','other') then raise exception 'INVALID_MEMBER_SALUTATION'; end if;
    if char_length(v_name) not between 2 and 60 then raise exception 'INVALID_MEMBER_NAME'; end if;
    if v_age is not null and v_age not between 0 and 120 then raise exception 'INVALID_MEMBER_AGE'; end if;
    if v_phone is not null then
      if char_length(v_phone) not between 6 and 32 then raise exception 'INVALID_MEMBER_PHONE_NUMBER'; end if;
      v_phone_key=regexp_replace(v_phone,'[^0-9]','','g');
      if char_length(v_phone_key)<6 then raise exception 'INVALID_MEMBER_PHONE_NUMBER'; end if;
      if v_phone_key=any(v_seen_phones) then raise exception 'DUPLICATE_MEMBER_PHONE_NUMBER'; end if;
      v_seen_phones=array_append(v_seen_phones,v_phone_key);
    end if;
  end loop;

  insert into public.profiles(id,display_name,salutation,age,phone_number,relationship_status)
  values(auth.uid(),trim(p_display_name),p_salutation,p_age,nullif(trim(coalesce(p_phone_number,'')),''),p_relationship_status)
  on conflict (id) do update
    set display_name=excluded.display_name,
        salutation=excluded.salutation,
        age=excluded.age,
        phone_number=excluded.phone_number,
        relationship_status=excluded.relationship_status,
        updated_at=now();

  delete from public.light_members where household_id=p_household_id;
  for v_member in select value from jsonb_array_elements(p_members)
  loop
    v_relation=v_member->>'relation';
    v_relation_label=nullif(trim(coalesce(v_member->>'relation_label','')),'');
    v_salutation=nullif(v_member->>'salutation','');
    v_name=trim(v_member->>'display_name');
    v_age=nullif(v_member->>'age','')::integer;
    v_phone=nullif(trim(coalesce(v_member->>'phone_number','')),'');
    insert into public.light_members(household_id,display_name,phone_number,age,relation,relation_label,salutation,created_by)
    values(p_household_id,v_name,v_phone,v_age,v_relation,v_relation_label,v_salutation,auth.uid());
  end loop;

  update public.households
  set default_party_size=least(20,1+v_count),setup_completed=true,updated_at=now()
  where id=p_household_id;
end; $$;

revoke all on function public.complete_household_family_setup_v2(uuid,text,text,integer,text,text,jsonb) from public;
revoke all on function public.complete_household_family_setup_v2(uuid,text,text,integer,text,text,jsonb) from anon;
grant execute on function public.complete_household_family_setup_v2(uuid,text,text,integer,text,text,jsonb) to authenticated;
