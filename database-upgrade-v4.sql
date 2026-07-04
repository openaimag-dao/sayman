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
