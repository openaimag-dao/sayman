-- ═══ САЙМАН v11: редактирование состава регулярной доставки ═══
-- Вставьте весь текст в Supabase → SQL Editor → Run

create or replace function client_update_sub_items(_cid text, _id bigint, _items jsonb) returns void
language plpgsql security definer set search_path = public as $$
begin
  if _cid is null or length(_cid) < 10 then raise exception 'bad id'; end if;
  update subscriptions set items = _items
  where id = _id and client_id = _cid;
end $$;

grant execute on function client_update_sub_items(text, bigint, jsonb) to anon;
