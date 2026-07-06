-- ═══ САЙМАН v13: координаты доставки (метка на карте) ═══
alter table orders add column if not exists geo text;
