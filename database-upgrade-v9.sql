-- ═══ САЙМАН v9: команда сборщиков и курьеров ═══
-- Вставьте весь текст в Supabase → SQL Editor → Run

create table if not exists staff (
  id bigserial primary key,
  name text not null,
  role text not null check (role in ('picker','courier')),
  pin text not null unique,
  active boolean not null default true
);
alter table staff enable row level security;

alter table orders add column if not exists picker text;
alter table orders add column if not exists courier text;

-- Переношу старые PIN-коды сборщика и курьера в команду
insert into staff (name, role, pin)
select 'Сборщик 1', 'picker', picker_pin from admin_config
where not exists (select 1 from staff where pin = (select picker_pin from admin_config limit 1));
insert into staff (name, role, pin)
select 'Курьер 1', 'courier', courier_pin from admin_config
where not exists (select 1 from staff where pin = (select courier_pin from admin_config limit 1));

-- Роль и имя по PIN (админ + команда)
create or replace function staff_role(_pin text) returns text
language sql security definer set search_path = public as $$
  select coalesce(
    (select 'admin' from admin_config where pin = _pin limit 1),
    (select role from staff where pin = _pin and active = true limit 1)
  );
$$;

create or replace function staff_name_of(_pin text) returns text
language sql security definer set search_path = public as $$
  select coalesce(
    (select 'Админ' from admin_config where pin = _pin limit 1),
    (select name from staff where pin = _pin and active = true limit 1)
  );
$$;

create or replace function staff_login(_pin text) returns jsonb
language plpgsql security definer set search_path = public as $$
declare r text; nm text;
begin
  r := staff_role(_pin);
  if r is null then raise exception 'Неверный PIN'; end if;
  nm := staff_name_of(_pin);
  return jsonb_build_object(
    'role', r, 'name', nm,
    'orders', coalesce((
      select jsonb_agg(to_jsonb(o.*) order by o.created_at desc)
      from (select * from orders order by created_at desc limit 200) o
    ), '[]'::jsonb)
  );
end $$;

-- Смена статуса с закреплением заказа за сотрудником
create or replace function staff_set_status(_pin text, _id bigint, _status text) returns void
language plpgsql security definer set search_path = public as $$
declare r text; nm text; cur record;
begin
  r := staff_role(_pin);
  if r is null then raise exception 'Неверный PIN'; end if;
  nm := staff_name_of(_pin);
  select * into cur from orders where id = _id;
  if _status = 'picking' and r = 'picker' then
    if cur.picker is not null and cur.picker <> nm then
      raise exception 'Заказ уже собирает: %', cur.picker;
    end if;
    update orders set status = _status, picker = nm,
      status_log = coalesce(status_log,'{}'::jsonb) || jsonb_build_object(_status, to_char(now(),'YYYY-MM-DD HH24:MI'))
    where id = _id;
    return;
  end if;
  if _status = 'delivering' and r = 'courier' then
    if cur.courier is not null and cur.courier <> nm then
      raise exception 'Заказ уже везёт: %', cur.courier;
    end if;
    update orders set status = _status, courier = nm,
      status_log = coalesce(status_log,'{}'::jsonb) || jsonb_build_object(_status, to_char(now(),'YYYY-MM-DD HH24:MI'))
    where id = _id;
    return;
  end if;
  update orders set status = _status,
    status_log = coalesce(status_log,'{}'::jsonb) || jsonb_build_object(_status, to_char(now(),'YYYY-MM-DD HH24:MI'))
  where id = _id;
end $$;

-- Управление командой (только админ)
create or replace function admin_get_staff(_pin text) returns setof staff
language plpgsql security definer set search_path = public as $$
begin
  if not check_pin(_pin) then raise exception 'Неверный PIN'; end if;
  return query select * from staff order by role, name;
end $$;

create or replace function admin_upsert_staff(_pin text, _s jsonb) returns void
language plpgsql security definer set search_path = public as $$
begin
  if not check_pin(_pin) then raise exception 'Неверный PIN'; end if;
  if (_s->>'id') is not null and (_s->>'id') <> '' then
    update staff set name = _s->>'name', role = _s->>'role', pin = _s->>'pin',
      active = coalesce((_s->>'active')::boolean, true)
    where id = (_s->>'id')::bigint;
  else
    insert into staff (name, role, pin) values (_s->>'name', _s->>'role', _s->>'pin');
  end if;
end $$;

create or replace function admin_delete_staff(_pin text, _id bigint) returns void
language plpgsql security definer set search_path = public as $$
begin
  if not check_pin(_pin) then raise exception 'Неверный PIN'; end if;
  delete from staff where id = _id;
end $$;

grant execute on function staff_role(text) to anon;
grant execute on function staff_name_of(text) to anon;
grant execute on function staff_login(text) to anon;
grant execute on function staff_set_status(text, bigint, text) to anon;
grant execute on function admin_get_staff(text) to anon;
grant execute on function admin_upsert_staff(text, jsonb) to anon;
grant execute on function admin_delete_staff(text, bigint) to anon;
