-- V0.294 — expose named family meal responses to LIA without changing response writes.
create or replace function public.get_light_meal_summary(p_question_id uuid)
returns jsonb
language plpgsql
security definer
set search_path=public as $$
declare
  v_household_id uuid;v_take_charge_name text;v_total integer;v_yes integer;v_no integer;v_maybe integer;v_take integer;
  v_home integer;v_pizza integer;v_pasta integer;v_sushi integer;v_chinese integer;v_surprise integer;
  v_notes jsonb;v_responses jsonb;
begin
  if auth.uid() is null then raise exception 'AUTHENTICATION_REQUIRED'; end if;
  select household_id into v_household_id from public.light_meal_questions where id=p_question_id;
  if v_household_id is null then raise exception 'QUESTION_NOT_FOUND'; end if;
  if not public.is_household_admin(v_household_id) then raise exception 'ADMIN_REQUIRED'; end if;

  select count(*),count(*) filter(where presence='yes'),count(*) filter(where presence='no'),count(*) filter(where presence='maybe'),count(*) filter(where presence='take_charge'),
         count(*) filter(where desire='home'),count(*) filter(where desire='pizza'),count(*) filter(where desire='pasta'),count(*) filter(where desire='sushi'),count(*) filter(where desire='chinese'),count(*) filter(where desire='surprise')
    into v_total,v_yes,v_no,v_maybe,v_take,v_home,v_pizza,v_pasta,v_sushi,v_chinese,v_surprise
  from public.light_meal_responses where question_id=p_question_id;

  select m.display_name into v_take_charge_name
  from public.light_meal_responses r join public.light_members m on m.id=r.light_member_id
  where r.question_id=p_question_id and r.presence='take_charge'
  order by r.responded_at asc limit 1;

  select coalesce(jsonb_agg(jsonb_build_object('member_name',m.display_name,'note',r.note,'responded_at',r.responded_at) order by r.responded_at desc),'[]'::jsonb)
    into v_notes
  from public.light_meal_responses r join public.light_members m on m.id=r.light_member_id
  where r.question_id=p_question_id and r.note is not null;

  select coalesce(jsonb_agg(jsonb_build_object(
    'member_id',m.id,
    'member_name',m.display_name,
    'presence',r.presence,
    'desire',r.desire,
    'note',r.note,
    'responded_at',r.responded_at
  ) order by r.responded_at asc),'[]'::jsonb)
    into v_responses
  from public.light_meal_responses r join public.light_members m on m.id=r.light_member_id
  where r.question_id=p_question_id;

  return jsonb_build_object(
    'total',v_total,
    'presence',jsonb_build_object('yes',v_yes,'no',v_no,'maybe',v_maybe,'take_charge',v_take),
    'desires',jsonb_build_object('home',v_home,'pizza',v_pizza,'pasta',v_pasta,'sushi',v_sushi,'chinese',v_chinese,'surprise',v_surprise),
    'take_charge_name',v_take_charge_name,
    'notes',v_notes,
    'responses',v_responses
  );
end; $$;

revoke all on function public.get_light_meal_summary(uuid) from public;
grant execute on function public.get_light_meal_summary(uuid) to authenticated;
