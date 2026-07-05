-- ═══ САЙМАН v7: остатки товара, промокоды, автосписание ═══
-- Вставьте весь текст в Supabase → SQL Editor → Run

alter table products add column if not exists stock int;
alter table orders add column if not exists promo text;
alter table orders add column if not exists discount int default 0;

create table if not exists promos (
  code text primary key,
  kind text not null default 'percent',
  value int not null,
  min_total int not null default 0,
  active boolean not null default true,
  uses int not null default 0,
  max_uses int
);
alter table promos enable row level security;

-- Проверка промокода клиентом
create or replace function check_promo(_code text, _total int) returns jsonb
language plpgsql security definer set search_path = public as $$
declare p promos%rowtype; d int;
begin
  select * into p from promos where code = upper(trim(_code)) and active = true;
  if p.code is null then raise exception 'Промокод не найден'; end if;
  if p.max_uses is not null and p.uses >= p.max_uses then raise exception 'Промокод исчерпан'; end if;
  if _total < p.min_total then raise exception 'Минимальная сумма для кода: %', p.min_total; end if;
  d := case when p.kind = 'percent' then (_total * p.value / 100) else p.value end;
  return jsonb_build_object('code', p.code, 'discount', least(d, _total));
end $$;

-- Управление промокодами (админ)
create or replace function admin_get_promos(_pin text) returns setof promos
language plpgsql security definer set search_path = public as $$
begin
  if not check_pin(_pin) then raise exception 'Неверный PIN'; end if;
  return query select * from promos order by code;
end $$;

create or replace function admin_upsert_promo(_pin text, _p jsonb) returns void
language plpgsql security definer set search_path = public as $$
begin
  if not check_pin(_pin) then raise exception 'Неверный PIN'; end if;
  insert into promos (code, kind, value, min_total, active, max_uses)
  values (upper(trim(_p->>'code')), coalesce(_p->>'kind','percent'), (_p->>'value')::int,
          coalesce((_p->>'min_total')::int, 0), coalesce((_p->>'active')::boolean, true),
          nullif(_p->>'max_uses','')::int)
  on conflict (code) do update set
    kind = excluded.kind, value = excluded.value, min_total = excluded.min_total,
    active = excluded.active, max_uses = excluded.max_uses;
end $$;

create or replace function admin_delete_promo(_pin text, _code text) returns void
language plpgsql security definer set search_path = public as $$
begin
  if not check_pin(_pin) then raise exception 'Неверный PIN'; end if;
  delete from promos where code = _code;
end $$;

-- Обновляю функцию товара: поле остатка
create or replace function admin_upsert_product(_pin text, _p jsonb) returns void
language plpgsql security definer set search_path = public as $$
begin
  if not check_pin(_pin) then raise exception 'Неверный PIN'; end if;
  insert into products (id, section, cat, name, unit, price, old_price, hit, img, emoji, available, stock)
  values (
    _p->>'id', _p->>'section', _p->>'cat', _p->>'name', _p->>'unit',
    (_p->>'price')::int, nullif(_p->>'old_price','')::int,
    coalesce((_p->>'hit')::boolean, false), _p->>'img', _p->>'emoji',
    coalesce((_p->>'available')::boolean, true), nullif(_p->>'stock','')::int
  )
  on conflict (id) do update set
    cat = excluded.cat, name = excluded.name, unit = excluded.unit,
    price = excluded.price, old_price = excluded.old_price,
    hit = excluded.hit, img = excluded.img, emoji = excluded.emoji,
    available = excluded.available, stock = excluded.stock;
end $$;

-- Автосписание остатков и учёт использований промокода при новом заказе
create or replace function on_order_created() returns trigger
language plpgsql security definer set search_path = public as $$
declare it jsonb;
begin
  for it in select * from jsonb_array_elements(coalesce(new.items, '[]'::jsonb)) loop
    update products set stock = greatest(stock - coalesce((it->>'qty')::int, 0), 0)
    where id = it->>'id' and stock is not null;
  end loop;
  if new.promo is not null then
    update promos set uses = uses + 1 where code = new.promo;
  end if;
  return new;
end $$;

drop trigger if exists trg_order_created on orders;
create trigger trg_order_created after insert on orders
for each row execute function on_order_created();

grant execute on function check_promo(text, int) to anon;
grant execute on function admin_get_promos(text) to anon;
grant execute on function admin_upsert_promo(text, jsonb) to anon;
grant execute on function admin_delete_promo(text, text) to anon;
grant execute on function admin_upsert_product(text, jsonb) to anon;
