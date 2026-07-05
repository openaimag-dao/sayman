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
