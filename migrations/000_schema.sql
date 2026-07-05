-- ═══ САЙМАН: полная идемпотентная схема базы (безопасно запускать повторно) ═══


-- ──────── v1 — базовая схема ────────
-- ═══ МАГАЗИН «САЙМАН» — настройка базы данных ═══
-- Вставьте весь этот текст в Supabase → SQL Editor → Run

create table if not exists products (
  id text primary key,
  section text not null,
  cat text, name text, unit text,
  price int not null,
  old_price int,
  hit boolean default false,
  img text,
  emoji text,
  pos serial
);

create table if not exists orders (
  id bigserial primary key,
  num text, name text, phone text, type text, address text, pay text, comment text,
  items jsonb, total int, status text default 'new',
  created_at timestamptz default now()
);

create table if not exists admin_config (id int primary key default 1, pin text not null);
insert into admin_config (id, pin) values (1, '2026') on conflict (id) do nothing;

alter table products enable row level security;
alter table orders enable row level security;
alter table admin_config enable row level security;

drop policy if exists "public read products" on products;
create policy "public read products" on products for select using (true);
drop policy if exists "public create orders" on orders;
create policy "public create orders" on orders for insert with check (true);

create or replace function check_pin(_pin text) returns boolean
language sql security definer set search_path = public as
$$ select exists(select 1 from admin_config where pin = _pin); $$;

create or replace function admin_get_orders(_pin text) returns setof orders
language plpgsql security definer set search_path = public as $$
begin
  if not check_pin(_pin) then raise exception 'Неверный PIN'; end if;
  return query select * from orders order by created_at desc limit 200;
end $$;

create or replace function admin_set_status(_pin text, _id bigint, _status text) returns void
language plpgsql security definer set search_path = public as $$
begin
  if not check_pin(_pin) then raise exception 'Неверный PIN'; end if;
  update orders set status = _status where id = _id;
end $$;

create or replace function admin_upsert_product(_pin text, _p jsonb) returns void
language plpgsql security definer set search_path = public as $$
begin
  if not check_pin(_pin) then raise exception 'Неверный PIN'; end if;
  insert into products (id, section, cat, name, unit, price, old_price, hit, img, emoji)
  values (
    _p->>'id', _p->>'section', _p->>'cat', _p->>'name', _p->>'unit',
    (_p->>'price')::int, nullif(_p->>'old_price','')::int,
    coalesce((_p->>'hit')::boolean, false), _p->>'img', _p->>'emoji'
  )
  on conflict (id) do update set
    cat = excluded.cat, name = excluded.name, unit = excluded.unit,
    price = excluded.price, old_price = excluded.old_price,
    hit = excluded.hit, img = excluded.img, emoji = excluded.emoji;
end $$;

create or replace function admin_delete_product(_pin text, _id text) returns void
language plpgsql security definer set search_path = public as $$
begin
  if not check_pin(_pin) then raise exception 'Неверный PIN'; end if;
  delete from products where id = _id;
end $$;

grant execute on function check_pin(text) to anon;
grant execute on function admin_get_orders(text) to anon;
grant execute on function admin_set_status(text, bigint, text) to anon;
grant execute on function admin_upsert_product(text, jsonb) to anon;
grant execute on function admin_delete_product(text, text) to anon;

-- Наполнение каталога (66 товаров с фото)
insert into products (id, section, cat, name, unit, price, old_price, hit, img, emoji) values
('f1', 'food', 'Хлеб и выпечка', 'Хлеб формовой', 'шт', 180, null, true, 'https://images.pexels.com/photos/4267969/pexels-photo-4267969.jpeg?auto=compress&cs=tinysrgb&w=400', '🍞'),
('f2', 'food', 'Хлеб и выпечка', 'Лепёшка тандырная', 'шт', 250, null, true, null, '🫓'),
('f3', 'food', 'Хлеб и выпечка', 'Батон нарезной', 'шт', 220, null, false, 'https://images.pexels.com/photos/7541727/pexels-photo-7541727.jpeg?auto=compress&cs=tinysrgb&w=400', '🥖'),
('f4', 'food', 'Хлеб и выпечка', 'Баурсаки (10 шт)', 'уп', 500, null, false, null, '🥯'),
('f5', 'food', 'Молочные', 'Молоко 2,5% 1 л', 'шт', 450, 490, false, 'https://images.pexels.com/photos/6341410/pexels-photo-6341410.jpeg?auto=compress&cs=tinysrgb&w=400', '🥛'),
('f6', 'food', 'Молочные', 'Кефир 1 л', 'шт', 520, null, false, null, '🥛'),
('f7', 'food', 'Молочные', 'Сметана 20% 400 г', 'шт', 780, null, false, null, '🥣'),
('f8', 'food', 'Молочные', 'Творог 5% 500 г', 'шт', 1100, null, false, null, '🧀'),
('f9', 'food', 'Молочные', 'Сыр «Голландский» 300 г', 'шт', 1650, null, false, 'https://images.pexels.com/photos/18823977/pexels-photo-18823977.jpeg?auto=compress&cs=tinysrgb&w=400', '🧀'),
('f10', 'food', 'Молочные', 'Масло сливочное 72,5% 200 г', 'шт', 1250, null, false, null, '🧈'),
('f11', 'food', 'Молочные', 'Айран 1 л', 'шт', 480, null, false, null, '🥛'),
('f12', 'food', 'Бакалея', 'Рис «Лазер» 1 кг', 'кг', 950, null, false, 'https://images.pexels.com/photos/18328392/pexels-photo-18328392.jpeg?auto=compress&cs=tinysrgb&w=400', '🍚'),
('f13', 'food', 'Бакалея', 'Гречка 800 г', 'уп', 780, null, false, null, '🌾'),
('f14', 'food', 'Бакалея', 'Макароны «Корона» 400 г', 'уп', 380, null, false, 'https://images.pexels.com/photos/6287344/pexels-photo-6287344.jpeg?auto=compress&cs=tinysrgb&w=400', '🍝'),
('f15', 'food', 'Бакалея', 'Мука в/с 2 кг', 'уп', 1100, null, false, 'https://images.pexels.com/photos/6287581/pexels-photo-6287581.jpeg?auto=compress&cs=tinysrgb&w=400', '🌾'),
('f16', 'food', 'Бакалея', 'Сахар 1 кг', 'кг', 520, null, false, null, '🧂'),
('f17', 'food', 'Бакалея', 'Соль 1 кг', 'уп', 150, null, false, null, '🧂'),
('f18', 'food', 'Бакалея', 'Масло подсолнечное 1 л', 'шт', 890, 990, false, null, '🌻'),
('f19', 'food', 'Бакалея', 'Чай «Пиала» гранул. 250 г', 'уп', 1290, 1450, true, null, '🍵'),
('f20', 'food', 'Бакалея', 'Кофе растворимый 95 г', 'шт', 1850, null, false, null, '☕'),
('f21', 'food', 'Бакалея', 'Яйца С1, 10 шт', 'уп', 850, null, false, 'https://images.pexels.com/photos/8556246/pexels-photo-8556246.jpeg?auto=compress&cs=tinysrgb&w=400', '🥚'),
('f22', 'food', 'Овощи и фрукты', 'Картофель', 'кг', 320, null, false, 'https://images.pexels.com/photos/2286776/pexels-photo-2286776.jpeg?auto=compress&cs=tinysrgb&w=400', '🥔'),
('f23', 'food', 'Овощи и фрукты', 'Лук репчатый', 'кг', 250, null, false, 'https://images.pexels.com/photos/25037071/pexels-photo-25037071.jpeg?auto=compress&cs=tinysrgb&w=400', '🧅'),
('f24', 'food', 'Овощи и фрукты', 'Морковь', 'кг', 280, null, false, 'https://images.pexels.com/photos/10487659/pexels-photo-10487659.jpeg?auto=compress&cs=tinysrgb&w=400', '🥕'),
('f25', 'food', 'Овощи и фрукты', 'Помидоры', 'кг', 850, null, false, 'https://images.pexels.com/photos/533280/pexels-photo-533280.jpeg?auto=compress&cs=tinysrgb&w=400', '🍅'),
('f26', 'food', 'Овощи и фрукты', 'Огурцы', 'кг', 750, null, false, 'https://images.pexels.com/photos/2329440/pexels-photo-2329440.jpeg?auto=compress&cs=tinysrgb&w=400', '🥒'),
('f27', 'food', 'Овощи и фрукты', 'Яблоки апорт', 'кг', 780, null, false, 'https://images.pexels.com/photos/209439/pexels-photo-209439.jpeg?auto=compress&cs=tinysrgb&w=400', '🍎'),
('f28', 'food', 'Овощи и фрукты', 'Бананы', 'кг', 990, null, false, 'https://images.pexels.com/photos/2116020/pexels-photo-2116020.jpeg?auto=compress&cs=tinysrgb&w=400', '🍌'),
('f29', 'food', 'Овощи и фрукты', 'Лимоны', 'кг', 1200, null, false, 'https://images.pexels.com/photos/1414122/pexels-photo-1414122.jpeg?auto=compress&cs=tinysrgb&w=400', '🍋'),
('f30', 'food', 'Мясо и колбасы', 'Говядина (мякоть)', 'кг', 3400, null, false, 'https://images.pexels.com/photos/8477071/pexels-photo-8477071.jpeg?auto=compress&cs=tinysrgb&w=400', '🥩'),
('f31', 'food', 'Мясо и колбасы', 'Курица (тушка)', 'кг', 1650, null, false, 'https://images.pexels.com/photos/10842246/pexels-photo-10842246.jpeg?auto=compress&cs=tinysrgb&w=400', '🍗'),
('f32', 'food', 'Мясо и колбасы', 'Фарш говяжий', 'кг', 3200, null, false, null, '🥩'),
('f33', 'food', 'Мясо и колбасы', 'Колбаса «Сервелат» 350 г', 'шт', 1890, null, false, null, '🌭'),
('f34', 'food', 'Мясо и колбасы', 'Сосиски молочные 1 кг', 'кг', 2400, null, false, null, '🌭'),
('f35', 'food', 'Заморозка', 'Пельмени «Домашние» 900 г', 'уп', 1950, null, true, 'https://images.pexels.com/photos/7225122/pexels-photo-7225122.jpeg?auto=compress&cs=tinysrgb&w=400', '🥟'),
('f36', 'food', 'Заморозка', 'Мороженое пломбир 400 г', 'шт', 990, null, false, null, '🍨'),
('f37', 'food', 'Консервы', 'Тушёнка говяжья 325 г', 'банка', 1450, null, false, null, '🥫'),
('f38', 'food', 'Консервы', 'Томатная паста 270 г', 'банка', 520, null, false, null, '🥫'),
('f39', 'food', 'Консервы', 'Горошек зелёный 400 г', 'банка', 480, null, false, null, '🥫'),
('f40', 'food', 'Напитки', 'Вода «Асем-Ай» 5 л', 'шт', 550, null, false, null, '💧'),
('f41', 'food', 'Напитки', 'Coca-Cola 1,5 л', 'шт', 750, null, false, null, '🥤'),
('f42', 'food', 'Напитки', 'Сок «Gracio» 1 л', 'шт', 890, null, false, null, '🧃'),
('f43', 'food', 'Сладости и снеки', 'Печенье «Юбилейное» 300 г', 'уп', 650, null, false, null, '🍪'),
('f44', 'food', 'Сладости и снеки', 'Шоколад «Казахстан» 100 г', 'шт', 780, 850, true, null, '🍫'),
('f45', 'food', 'Сладости и снеки', 'Конфеты «Рахат» ассорти', 'кг', 3200, null, false, null, '🍬'),
('f46', 'food', 'Сладости и снеки', 'Чипсы Lay''s 140 г', 'уп', 890, null, false, null, '🍟'),
('f47', 'food', 'Бытовая химия', 'Порошок стиральный 3 кг', 'уп', 2900, null, false, null, '🧺'),
('f48', 'food', 'Бытовая химия', 'Средство для посуды 500 мл', 'шт', 650, null, false, null, '🧴'),
('f49', 'food', 'Бытовая химия', 'Туалетная бумага (4 рул.)', 'уп', 780, null, false, null, '🧻'),
('f50', 'food', 'Бытовая химия', 'Мыло хозяйственное', 'шт', 250, null, false, null, '🧼'),
('b1', 'build', 'Сухие смеси', 'Цемент М400, 50 кг', 'мешок', 2450, 2600, true, null, '🏗️'),
('b2', 'build', 'Сухие смеси', 'Шпаклёвка финишная 25 кг', 'мешок', 3200, null, false, null, '🪣'),
('b3', 'build', 'Сухие смеси', 'Клей плиточный 25 кг', 'мешок', 2100, null, true, null, '🧱'),
('b4', 'build', 'Стеновые материалы', 'Кирпич красный М100', 'шт', 95, null, false, 'https://images.pexels.com/photos/33160441/pexels-photo-33160441.jpeg?auto=compress&cs=tinysrgb&w=400', '🧱'),
('b5', 'build', 'Стеновые материалы', 'Гипсокартон 12,5 мм 1,2×2,5', 'лист', 2700, 2900, false, null, '⬜'),
('b6', 'build', 'Кровля и металл', 'Профлист С8 оцинк. 2 м', 'лист', 4800, null, false, null, '🏠'),
('b7', 'build', 'Кровля и металл', 'Арматура Ø12, 11,7 м', 'шт', 3900, null, false, null, '➖'),
('b8', 'build', 'Краски и отделка', 'Эмаль ПФ-115 белая 2,7 кг', 'банка', 3400, null, false, 'https://images.pexels.com/photos/6474309/pexels-photo-6474309.jpeg?auto=compress&cs=tinysrgb&w=400', '🎨'),
('b9', 'build', 'Краски и отделка', 'Грунтовка глубокого проникн. 10 л', 'шт', 4200, null, false, 'https://images.pexels.com/photos/1887946/pexels-photo-1887946.jpeg?auto=compress&cs=tinysrgb&w=400', '🪣'),
('b10', 'build', 'Крепёж', 'Саморезы по ГКЛ 3,5×25 (1 кг)', 'уп', 1600, null, false, null, '🔩'),
('b11', 'build', 'Крепёж', 'Дюбель-гвоздь 6×40 (100 шт)', 'уп', 900, null, false, null, '🔩'),
('b12', 'build', 'Электрика', 'Кабель ВВГнг 3×2,5 (за метр)', 'м', 620, null, false, null, '🔌'),
('b13', 'build', 'Электрика', 'Розетка накладная двойная', 'шт', 1100, null, false, null, '🔌'),
('b14', 'build', 'Инструмент', 'Шпатель 250 мм', 'шт', 1300, null, false, null, '🛠️'),
('b15', 'build', 'Инструмент', 'Перчатки рабочие', 'пара', 350, null, false, null, '🧤'),
('b16', 'build', 'Сантехника', 'Труба ППР Ø25 (за метр)', 'м', 480, null, false, null, '🚿')
on conflict (id) do nothing;


-- ──────── v2 — роли и конвейер ────────
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


-- ──────── v3 — личный кабинет ────────
-- ═══ САЙМАН v3: личный кабинет клиента ═══
-- Вставьте весь текст в Supabase → SQL Editor → Run

alter table orders add column if not exists client_id text;

-- Клиент видит только свои заказы (по секретному ключу устройства)
create or replace function client_get_orders(_cid text) returns setof orders
language plpgsql security definer set search_path = public as $$
begin
  if _cid is null or length(_cid) < 10 then raise exception 'bad id'; end if;
  return query select * from orders where client_id = _cid order by created_at desc limit 50;
end $$;

grant execute on function client_get_orders(text) to anon;


-- ──────── v4 — настройки ────────
-- ═══ САЙМАН v4: настройки магазина, смена PIN ═══
-- Вставьте весь текст в Supabase → SQL Editor → Run

create table if not exists shop_settings (
  id int primary key default 1,
  delivery_fee int not null default 700,
  free_from int not null default 10000,
  min_order int not null default 0,
  hours text not null default '08:00 – 22:00',
  shop_open boolean not null default true
);
insert into shop_settings (id) values (1) on conflict (id) do nothing;

alter table shop_settings enable row level security;
drop policy if exists "public read settings" on shop_settings;
create policy "public read settings" on shop_settings for select using (true);

create or replace function admin_set_settings(_pin text, _s jsonb) returns void
language plpgsql security definer set search_path = public as $$
begin
  if not check_pin(_pin) then raise exception 'Неверный PIN'; end if;
  update shop_settings set
    delivery_fee = coalesce((_s->>'delivery_fee')::int, delivery_fee),
    free_from    = coalesce((_s->>'free_from')::int, free_from),
    min_order    = coalesce((_s->>'min_order')::int, min_order),
    hours        = coalesce(nullif(_s->>'hours',''), hours),
    shop_open    = coalesce((_s->>'shop_open')::boolean, shop_open)
  where id = 1;
end $$;

create or replace function admin_set_pins(_pin text, _admin text, _picker text, _courier text) returns void
language plpgsql security definer set search_path = public as $$
begin
  if not check_pin(_pin) then raise exception 'Неверный PIN'; end if;
  update admin_config set
    pin         = coalesce(nullif(_admin, ''), pin),
    picker_pin  = coalesce(nullif(_picker, ''), picker_pin),
    courier_pin = coalesce(nullif(_courier, ''), courier_pin)
  where id = 1;
end $$;

grant execute on function admin_set_settings(text, jsonb) to anon;
grant execute on function admin_set_pins(text, text, text, text) to anon;


-- ──────── v5 — слоты и зоны ────────
-- ═══ САЙМАН v5: слоты доставки и зоны с тарифами ═══
-- Вставьте весь текст в Supabase → SQL Editor → Run

alter table orders add column if not exists slot text;
alter table orders add column if not exists zone text;
alter table shop_settings add column if not exists zones jsonb
  default '[{"name":"Рядом (до 3 км)","fee":500},{"name":"Средняя (3–7 км)","fee":800},{"name":"Дальняя (от 7 км)","fee":1200}]'::jsonb;

update shop_settings set zones = '[{"name":"Рядом (до 3 км)","fee":500},{"name":"Средняя (3–7 км)","fee":800},{"name":"Дальняя (от 7 км)","fee":1200}]'::jsonb
where id = 1 and zones is null;

create or replace function admin_set_settings(_pin text, _s jsonb) returns void
language plpgsql security definer set search_path = public as $$
begin
  if not check_pin(_pin) then raise exception 'Неверный PIN'; end if;
  update shop_settings set
    delivery_fee = coalesce((_s->>'delivery_fee')::int, delivery_fee),
    free_from    = coalesce((_s->>'free_from')::int, free_from),
    min_order    = coalesce((_s->>'min_order')::int, min_order),
    hours        = coalesce(nullif(_s->>'hours',''), hours),
    shop_open    = coalesce((_s->>'shop_open')::boolean, shop_open),
    zones        = coalesce(_s->'zones', zones)
  where id = 1;
end $$;

grant execute on function admin_set_settings(text, jsonb) to anon;


-- ──────── v6 — перенос аккаунта ────────
-- ═══ САЙМАН v6: перенос аккаунта клиента по коду ═══
-- Вставьте весь текст в Supabase → SQL Editor → Run

create table if not exists link_codes (
  code text primary key,
  client_id text not null,
  created_at timestamptz default now()
);
alter table link_codes enable row level security;

-- Получить код переноса (действует 15 минут)
create or replace function client_make_code(_cid text) returns text
language plpgsql security definer set search_path = public as $$
declare c text;
begin
  if _cid is null or length(_cid) < 10 then raise exception 'bad id'; end if;
  delete from link_codes where client_id = _cid or created_at < now() - interval '15 minutes';
  c := lpad(floor(random() * 1000000)::text, 6, '0');
  insert into link_codes (code, client_id) values (c, _cid);
  return c;
end $$;

-- Ввести код на новом устройстве → получить свой аккаунт
create or replace function client_claim_code(_code text) returns text
language plpgsql security definer set search_path = public as $$
declare cid text;
begin
  select client_id into cid from link_codes
  where code = _code and created_at > now() - interval '15 minutes';
  if cid is null then raise exception 'Код не найден или истёк'; end if;
  delete from link_codes where code = _code;
  return cid;
end $$;

grant execute on function client_make_code(text) to anon;
grant execute on function client_claim_code(text) to anon;


-- ──────── v7 — остатки и промокоды ────────
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


-- ──────── v8 — realtime ────────
-- ═══ САЙМАН v8: мгновенные заказы (Realtime) ═══
-- Вставьте весь текст в Supabase → SQL Editor → Run

do $$
begin
  alter publication supabase_realtime add table orders;
exception when duplicate_object then null;
end $$;


-- ──────── v9 — команда ────────
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


-- ──────── v10 — регулярные доставки ────────
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
