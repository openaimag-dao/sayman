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
