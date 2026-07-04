-- ═══ САЙМАН v2: роли, конвейер заказов, наличие товара ═══
-- Вставьте весь текст в Supabase → SQL Editor → Run

alter table products add column if not exists available boolean default true;
alter table admin_config add column if not exists picker_pin text not null default '1111';
alter table admin_config add column if not exists courier_pin text not null default '2222';
alter table orders add column if not exists status_log jsonb default '{}'::jsonb;

-- Роль по PIN-коду
create or replace function staff_role(_pin text) returns text
language sql security definer set search_path = public as $$
  select case
    when exists(select 1 from admin_config where pin = _pin) then 'admin'
    when exists(select 1 from admin_config where picker_pin = _pin) then 'picker'
    when exists(select 1 from admin_config where courier_pin = _pin) then 'courier'
  end;
$$;

-- Вход персонала: возвращает роль и заказы
create or replace function staff_login(_pin text) returns jsonb
language plpgsql security definer set search_path = public as $$
declare r text;
begin
  r := staff_role(_pin);
  if r is null then raise exception 'Неверный PIN'; end if;
  return jsonb_build_object(
    'role', r,
    'orders', coalesce((
      select jsonb_agg(to_jsonb(o.*) order by o.created_at desc)
      from (select * from orders order by created_at desc limit 200) o
    ), '[]'::jsonb)
  );
end $$;

-- Смена статуса заказа (любая роль персонала), с журналом времени
create or replace function staff_set_status(_pin text, _id bigint, _status text) returns void
language plpgsql security definer set search_path = public as $$
begin
  if staff_role(_pin) is null then raise exception 'Неверный PIN'; end if;
  update orders
  set status = _status,
      status_log = coalesce(status_log, '{}'::jsonb) || jsonb_build_object(_status, to_char(now(), 'YYYY-MM-DD HH24:MI'))
  where id = _id;
end $$;

-- Сборщик: обновление состава (нет в наличии) и суммы
create or replace function staff_update_items(_pin text, _id bigint, _items jsonb, _total int) returns void
language plpgsql security definer set search_path = public as $$
begin
  if staff_role(_pin) is null then raise exception 'Неверный PIN'; end if;
  update orders set items = _items, total = _total where id = _id;
end $$;

-- Обновляю функцию товара: поле available
create or replace function admin_upsert_product(_pin text, _p jsonb) returns void
language plpgsql security definer set search_path = public as $$
begin
  if not check_pin(_pin) then raise exception 'Неверный PIN'; end if;
  insert into products (id, section, cat, name, unit, price, old_price, hit, img, emoji, available)
  values (
    _p->>'id', _p->>'section', _p->>'cat', _p->>'name', _p->>'unit',
    (_p->>'price')::int, nullif(_p->>'old_price','')::int,
    coalesce((_p->>'hit')::boolean, false), _p->>'img', _p->>'emoji',
    coalesce((_p->>'available')::boolean, true)
  )
  on conflict (id) do update set
    cat = excluded.cat, name = excluded.name, unit = excluded.unit,
    price = excluded.price, old_price = excluded.old_price,
    hit = excluded.hit, img = excluded.img, emoji = excluded.emoji,
    available = excluded.available;
end $$;

grant execute on function staff_role(text) to anon;
grant execute on function staff_login(text) to anon;
grant execute on function staff_set_status(text, bigint, text) to anon;
grant execute on function staff_update_items(text, bigint, jsonb, int) to anon;
grant execute on function admin_upsert_product(text, jsonb) to anon;

-- PIN-коды по умолчанию: админ 2026, сборщик 1111, курьер 2222
-- Сменить: update admin_config set pin='XXXX', picker_pin='YYYY', courier_pin='ZZZZ' where id=1;
