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
