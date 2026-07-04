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
