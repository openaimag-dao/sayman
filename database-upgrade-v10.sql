-- ═══ САЙМАН v10: регулярные доставки по расписанию ═══
-- Вставьте весь текст в Supabase → SQL Editor → Run

create table if not exists subscriptions (
  id bigserial primary key,
  client_id text not null,
  name text, phone text, address text, zone text, slot text, pay text default 'kaspi',
  items jsonb not null,
  days int[] not null,               -- 1=Пн ... 7=Вс
  active boolean not null default true,
  last_date date,
  created_at timestamptz default now()
);
alter table subscriptions enable row level security;

-- Клиент: создать/изменить своё расписание
create or replace function client_upsert_sub(_cid text, _s jsonb) returns void
language plpgsql security definer set search_path = public as $$
begin
  if _cid is null or length(_cid) < 10 then raise exception 'bad id'; end if;
  if (_s->>'id') is not null and (_s->>'id') <> '' then
    update subscriptions set
      address = _s->>'address', zone = _s->>'zone', slot = _s->>'slot',
      days = (select array_agg(v::int) from jsonb_array_elements_text(_s->'days') v),
      active = coalesce((_s->>'active')::boolean, active)
    where id = (_s->>'id')::bigint and client_id = _cid;
  else
    insert into subscriptions (client_id, name, phone, address, zone, slot, pay, items, days)
    values (_cid, _s->>'name', _s->>'phone', _s->>'address', _s->>'zone', _s->>'slot',
            coalesce(_s->>'pay','kaspi'), _s->'items',
            (select array_agg(v::int) from jsonb_array_elements_text(_s->'days') v));
  end if;
end $$;

create or replace function client_get_subs(_cid text) returns setof subscriptions
language plpgsql security definer set search_path = public as $$
begin
  if _cid is null or length(_cid) < 10 then raise exception 'bad id'; end if;
  return query select * from subscriptions where client_id = _cid order by created_at desc;
end $$;

create or replace function client_delete_sub(_cid text, _id bigint) returns void
language plpgsql security definer set search_path = public as $$
begin
  delete from subscriptions where id = _id and client_id = _cid;
end $$;

-- Админ: все расписания
create or replace function admin_get_subs(_pin text) returns setof subscriptions
language plpgsql security definer set search_path = public as $$
begin
  if not check_pin(_pin) then raise exception 'Неверный PIN'; end if;
  return query select * from subscriptions order by active desc, created_at desc;
end $$;

create or replace function admin_set_sub(_pin text, _id bigint, _active boolean) returns void
language plpgsql security definer set search_path = public as $$
begin
  if not check_pin(_pin) then raise exception 'Неверный PIN'; end if;
  update subscriptions set active = _active where id = _id;
end $$;

-- Генерация заказов из расписаний (запускается кроном каждое утро)
create or replace function process_subscriptions() returns int
language plpgsql security definer set search_path = public as $$
declare
  s record; it jsonb; new_items jsonb; goods int; qty int; pr_price int; pr_name text; pr_unit text; pr_emoji text;
  st record; zfee int; tot int; created int := 0;
  today_dow int := extract(isodow from (now() at time zone 'Asia/Almaty'))::int;
  today_d date := (now() at time zone 'Asia/Almaty')::date;
begin
  select * into st from shop_settings where id = 1;
  for s in select * from subscriptions
           where active and days @> array[today_dow]
             and (last_date is null or last_date < today_d) loop
    new_items := '[]'::jsonb; goods := 0;
    for it in select * from jsonb_array_elements(s.items) loop
      qty := coalesce((it->>'qty')::int, 1);
      select price, name, unit, emoji into pr_price, pr_name, pr_unit, pr_emoji
      from products where id = it->>'id';
      pr_price := coalesce(pr_price, (it->>'price')::int, 0);
      new_items := new_items || jsonb_build_array(jsonb_build_object(
        'id', it->>'id', 'name', coalesce(pr_name, it->>'name'), 'qty', qty,
        'price', pr_price, 'unit', coalesce(pr_unit, it->>'unit'), 'emoji', coalesce(pr_emoji, it->>'emoji')));
      goods := goods + qty * pr_price;
    end loop;
    zfee := coalesce((select (z->>'fee')::int from jsonb_array_elements(st.zones) z
                      where z->>'name' = s.zone limit 1), st.delivery_fee);
    tot := goods + case when goods >= st.free_from then 0 else zfee end;
    insert into orders (num, name, phone, type, address, pay, comment, slot, zone, items, total, client_id, status)
    values ('SM-R' || to_char(now(),'MMDD') || s.id, s.name, s.phone, 'delivery', s.address, s.pay,
            '🔁 Регулярная доставка', s.slot, s.zone, new_items, tot, s.client_id, 'new');
    update subscriptions set last_date = today_d where id = s.id;
    created := created + 1;
  end loop;
  return created;
end $$;

-- Крон: каждое утро в 08:00 по Шымкенту (03:00 UTC)
create extension if not exists pg_cron;
do $$
begin
  perform cron.unschedule('sayman-subscriptions');
exception when others then null;
end $$;
select cron.schedule('sayman-subscriptions', '0 3 * * *', 'select process_subscriptions()');

grant execute on function client_upsert_sub(text, jsonb) to anon;
grant execute on function client_get_subs(text) to anon;
grant execute on function client_delete_sub(text, bigint) to anon;
grant execute on function admin_get_subs(text) to anon;
grant execute on function admin_set_sub(text, bigint, boolean) to anon;
