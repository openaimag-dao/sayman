-- ═══ САЙМАН v8: мгновенные заказы (Realtime) ═══
-- Вставьте весь текст в Supabase → SQL Editor → Run

do $$
begin
  alter publication supabase_realtime add table orders;
exception when duplicate_object then null;
end $$;
