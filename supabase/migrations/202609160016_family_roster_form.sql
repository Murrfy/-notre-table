-- V0.166 — structured family sheet for LIA.
-- Structured facts are entered once in a form; LIA only speaks when validation finds
-- a concrete omission or inconsistency. Existing lightweight family-response rows remain reusable.

alter table public.profiles add column if not exists salutation text;
alter table public.profiles add column if not exists age smallint;
alter table public.profiles add column if not exists phone_number text;

do $$ begin
  alter table public.profiles add constraint profiles_salutation_check check (salutation is null or salutation in ('mr','mrs','other'));
exception when duplicate_object then null; end $$;
do $$ begin
  alter table public.profiles add constraint profiles_age_check check (age is null or age between 0 and 120);
exception when duplicate_object then null; end $$;
do $$ begin
  alter table public.profiles add constraint profiles_phone_check check (phone_number is null or char_length(trim(phone_number)) between 6 and 32);
exception when duplicate_object then null; end $$;

alter table public.light_members alter column phone_number drop not null;
alter table public.light_members add column if not exists age smallint;
alter table public.light_members add column if not exists relation text not null default 'other';
alter table public.light_members add column if not exists relation_label text;
alter table public.light_members add column if not exists salutation text;

do $$ begin
  alter table public.light_members add constraint light_members_age_check check (age is null or age between 0 and 120);
exception when duplicate_object then null; end $$;
do $$ begin
  alter table public.light_members add constraint light_members_relation_check check (relation in ('spouse','child','other'));
exception when duplicate_object then null; end $$;
do $$ begin
  alter table public.light_members add constraint light_members_salutation_check check (salutation is null or salutation in ('mr','mrs','other'));
exception when duplicate_object then null; end $$;
do $$ begin
  alter table public.light_members add constraint light_members_relation_label_check check (relation<>'other' or char_length(trim(coalesce(relation_label,''))) between 1 and 40);
exception when duplicate_object then null; end $$;

create or replace function public.complete_household_family_setup(
  p_household_id uuid,
  p_display_name text,
  p_salutation text,
  p_age integer,
  p_phone_number text,
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
  if p_age is null or p_age not between 0 and 120 then raise exception 'INVALID_AGE'; end if;
  if char_length(trim(coalesce(p_phone_number,''))) not between 6 and 32 then raise exception 'INVALID_PHONE_NUMBER'; end if;
  v_phone_key=regexp_replace(coalesce(p_phone_number,''),'[^0-9]','','g');
  if char_length(v_phone_key)<6 then raise exception 'INVALID_PHONE_NUMBER'; end if;
  v_seen_phones=array_append(v_seen_phones,v_phone_key);
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
    if v_age is null or v_age not between 0 and 120 then raise exception 'INVALID_MEMBER_AGE'; end if;
    if v_relation<>'child' and v_phone is null then raise exception 'INVALID_MEMBER_PHONE_NUMBER'; end if;
    if v_phone is not null then
      if char_length(v_phone) not between 6 and 32 then raise exception 'INVALID_MEMBER_PHONE_NUMBER'; end if;
      v_phone_key=regexp_replace(v_phone,'[^0-9]','','g');
      if char_length(v_phone_key)<6 then raise exception 'INVALID_MEMBER_PHONE_NUMBER'; end if;
      if v_phone_key=any(v_seen_phones) then raise exception 'DUPLICATE_MEMBER_PHONE_NUMBER'; end if;
      v_seen_phones=array_append(v_seen_phones,v_phone_key);
    end if;
  end loop;

  insert into public.profiles(id,display_name,salutation,age,phone_number)
  values(auth.uid(),trim(p_display_name),p_salutation,p_age,trim(p_phone_number))
  on conflict (id) do update
    set display_name=excluded.display_name,
        salutation=excluded.salutation,
        age=excluded.age,
        phone_number=excluded.phone_number,
        updated_at=now();

  -- A brand-new household has no meal-response history yet. Rebuild the lightweight
  -- roster atomically from the family sheet so there is a single source for non-account members.
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
  set default_party_size=least(20,1+v_count),
      setup_completed=true,
      updated_at=now()
  where id=p_household_id;
end; $$;

revoke all on function public.complete_household_family_setup(uuid,text,text,integer,text,jsonb) from public;
revoke all on function public.complete_household_family_setup(uuid,text,text,integer,text,jsonb) from anon;
grant execute on function public.complete_household_family_setup(uuid,text,text,integer,text,jsonb) to authenticated;

-- Family-sheet rows may intentionally have no phone (for example a young child).
create or replace function public.update_light_member(
  p_light_member_id uuid,
  p_display_name text,
  p_phone_number text,
  p_active boolean
)
returns void
language plpgsql
security definer
set search_path=public as $$
declare
  v_household_id uuid;
  v_phone text;
begin
  if auth.uid() is null then raise exception 'AUTHENTICATION_REQUIRED'; end if;
  select household_id into v_household_id from public.light_members where id=p_light_member_id;
  if v_household_id is null then raise exception 'LIGHT_MEMBER_NOT_FOUND'; end if;
  if not public.is_household_admin(v_household_id) then raise exception 'ADMIN_REQUIRED'; end if;
  if not public.family_feature_allowed(v_household_id) then raise exception 'FAMILY_PLAN_REQUIRED'; end if;
  if char_length(trim(coalesce(p_display_name,''))) not between 1 and 60 then raise exception 'INVALID_MEMBER_NAME'; end if;
  v_phone=nullif(trim(coalesce(p_phone_number,'')),'');
  if v_phone is not null and char_length(v_phone) not between 6 and 32 then raise exception 'INVALID_PHONE_NUMBER'; end if;

  update public.light_members
     set display_name=trim(p_display_name),
         phone_number=v_phone,
         active=coalesce(p_active,true),
         updated_at=now()
   where id=p_light_member_id;
end; $$;

revoke all on function public.update_light_member(uuid,text,text,boolean) from public;
grant execute on function public.update_light_member(uuid,text,text,boolean) to authenticated;
