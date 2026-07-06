-- ═══ САЙМАН v12: роль Оператора (диспетчер) ═══
-- Вставьте весь текст в Supabase → SQL Editor → Run

-- Разрешаю роль 'operator' в таблице команды
alter table staff drop constraint if exists staff_role_check;
alter table staff add constraint staff_role_check check (role in ('picker','courier','operator'));

-- Оператор при входе получает все заказы и команду (для координации)
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
    ), '[]'::jsonb),
    'staff', case when r in ('admin','operator') then coalesce((
      select jsonb_agg(to_jsonb(s.*) order by s.role, s.name) from staff s
    ), '[]'::jsonb) else '[]'::jsonb end
  );
end $$;

-- Оператор может назначать заказ конкретному сборщику/курьеру
create or replace function staff_assign(_pin text, _id bigint, _who text, _kind text) returns void
language plpgsql security definer set search_path = public as $$
begin
  if staff_role(_pin) not in ('admin','operator') then raise exception 'Нет прав'; end if;
  if _kind = 'picker' then update orders set picker = _who where id = _id;
  elsif _kind = 'courier' then update orders set courier = _who where id = _id;
  end if;
end $$;

-- Оператор видит команду (для панели управления)
create or replace function staff_team(_pin text) returns setof staff
language plpgsql security definer set search_path = public as $$
begin
  if staff_role(_pin) not in ('admin','operator') then raise exception 'Нет прав'; end if;
  return query select * from staff where active order by role, name;
end $$;

grant execute on function staff_login(text) to anon;
grant execute on function staff_assign(text, bigint, text, text) to anon;
grant execute on function staff_team(text) to anon;
