import { useState, useMemo, useEffect, useRef } from "react";
import { createClient } from "@supabase/supabase-js";

// ─────────────────────────────────────────────
//  САЙМАН — интернет-магазин (прототип)
//  Два раздела: Продукты / Стройматериалы
// ─────────────────────────────────────────────

// Хранилище браузера (данные сохраняются на устройстве пользователя)
const appStorage = {
  async get(k) { const v = localStorage.getItem(k); if (v == null) throw new Error("no key"); return { key: k, value: v }; },
  async set(k, v) { localStorage.setItem(k, v); return { key: k, value: v }; },
};

const FONTS = `
@import url('https://fonts.googleapis.com/css2?family=Unbounded:wght@500;700;900&family=Manrope:wght@400;500;600;700;800&display=swap');
* { box-sizing: border-box; margin: 0; padding: 0; }
button { font-family: inherit; cursor: pointer; }
input, textarea { font-family: inherit; }
::-webkit-scrollbar { width: 8px; }
::-webkit-scrollbar-thumb { background: #ccc; border-radius: 4px; }
@keyframes slideIn { from { transform: translateX(100%); } to { transform: translateX(0); } }
@keyframes fadeUp { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
`;

// Товары — демо-каталог
// ФОТО: у любого товара можно добавить поле img: "ссылка или /images/файл.jpg"
// Если фото нет или не загрузилось — карточка автоматически покажет эмодзи.
// На реальном хостинге фото будут лежать в папке /images рядом с сайтом.
const DEFAULT_PRODUCTS = {
  food: [
    { id: "f1", img: "https://images.pexels.com/photos/4267969/pexels-photo-4267969.jpeg?auto=compress&cs=tinysrgb&w=400", cat: "Хлеб и выпечка", name: "Хлеб формовой", unit: "шт", price: 180, emoji: "🍞", hit: true },
    { id: "f2", cat: "Хлеб и выпечка", name: "Лепёшка тандырная", unit: "шт", price: 250, emoji: "🫓", hit: true },
    { id: "f3", img: "https://images.pexels.com/photos/7541727/pexels-photo-7541727.jpeg?auto=compress&cs=tinysrgb&w=400", cat: "Хлеб и выпечка", name: "Батон нарезной", unit: "шт", price: 220, emoji: "🥖" },
    { id: "f4", cat: "Хлеб и выпечка", name: "Баурсаки (10 шт)", unit: "уп", price: 500, emoji: "🥯" },
    { id: "f5", img: "https://images.pexels.com/photos/6341410/pexels-photo-6341410.jpeg?auto=compress&cs=tinysrgb&w=400", cat: "Молочные", name: "Молоко 2,5% 1 л", unit: "шт", price: 450, oldPrice: 490, emoji: "🥛" },
    { id: "f6", cat: "Молочные", name: "Кефир 1 л", unit: "шт", price: 520, emoji: "🥛" },
    { id: "f7", cat: "Молочные", name: "Сметана 20% 400 г", unit: "шт", price: 780, emoji: "🥣" },
    { id: "f8", cat: "Молочные", name: "Творог 5% 500 г", unit: "шт", price: 1100, emoji: "🧀" },
    { id: "f9", img: "https://images.pexels.com/photos/18823977/pexels-photo-18823977.jpeg?auto=compress&cs=tinysrgb&w=400", cat: "Молочные", name: "Сыр «Голландский» 300 г", unit: "шт", price: 1650, emoji: "🧀" },
    { id: "f10", cat: "Молочные", name: "Масло сливочное 72,5% 200 г", unit: "шт", price: 1250, emoji: "🧈" },
    { id: "f11", cat: "Молочные", name: "Айран 1 л", unit: "шт", price: 480, emoji: "🥛" },
    { id: "f12", img: "https://images.pexels.com/photos/18328392/pexels-photo-18328392.jpeg?auto=compress&cs=tinysrgb&w=400", cat: "Бакалея", name: "Рис «Лазер» 1 кг", unit: "кг", price: 950, emoji: "🍚" },
    { id: "f13", cat: "Бакалея", name: "Гречка 800 г", unit: "уп", price: 780, emoji: "🌾" },
    { id: "f14", img: "https://images.pexels.com/photos/6287344/pexels-photo-6287344.jpeg?auto=compress&cs=tinysrgb&w=400", cat: "Бакалея", name: "Макароны «Корона» 400 г", unit: "уп", price: 380, emoji: "🍝" },
    { id: "f15", img: "https://images.pexels.com/photos/6287581/pexels-photo-6287581.jpeg?auto=compress&cs=tinysrgb&w=400", cat: "Бакалея", name: "Мука в/с 2 кг", unit: "уп", price: 1100, emoji: "🌾" },
    { id: "f16", cat: "Бакалея", name: "Сахар 1 кг", unit: "кг", price: 520, emoji: "🧂" },
    { id: "f17", cat: "Бакалея", name: "Соль 1 кг", unit: "уп", price: 150, emoji: "🧂" },
    { id: "f18", cat: "Бакалея", name: "Масло подсолнечное 1 л", unit: "шт", price: 890, oldPrice: 990, emoji: "🌻" },
    { id: "f19", cat: "Бакалея", name: "Чай «Пиала» гранул. 250 г", unit: "уп", price: 1290, oldPrice: 1450, emoji: "🍵", hit: true },
    { id: "f20", cat: "Бакалея", name: "Кофе растворимый 95 г", unit: "шт", price: 1850, emoji: "☕" },
    { id: "f21", img: "https://images.pexels.com/photos/8556246/pexels-photo-8556246.jpeg?auto=compress&cs=tinysrgb&w=400", cat: "Бакалея", name: "Яйца С1, 10 шт", unit: "уп", price: 850, emoji: "🥚" },
    { id: "f22", img: "https://images.pexels.com/photos/2286776/pexels-photo-2286776.jpeg?auto=compress&cs=tinysrgb&w=400", cat: "Овощи и фрукты", name: "Картофель", unit: "кг", price: 320, emoji: "🥔" },
    { id: "f23", img: "https://images.pexels.com/photos/25037071/pexels-photo-25037071.jpeg?auto=compress&cs=tinysrgb&w=400", cat: "Овощи и фрукты", name: "Лук репчатый", unit: "кг", price: 250, emoji: "🧅" },
    { id: "f24", img: "https://images.pexels.com/photos/10487659/pexels-photo-10487659.jpeg?auto=compress&cs=tinysrgb&w=400", cat: "Овощи и фрукты", name: "Морковь", unit: "кг", price: 280, emoji: "🥕" },
    { id: "f25", img: "https://images.pexels.com/photos/533280/pexels-photo-533280.jpeg?auto=compress&cs=tinysrgb&w=400", cat: "Овощи и фрукты", name: "Помидоры", unit: "кг", price: 850, emoji: "🍅" },
    { id: "f26", img: "https://images.pexels.com/photos/2329440/pexels-photo-2329440.jpeg?auto=compress&cs=tinysrgb&w=400", cat: "Овощи и фрукты", name: "Огурцы", unit: "кг", price: 750, emoji: "🥒" },
    { id: "f27", img: "https://images.pexels.com/photos/209439/pexels-photo-209439.jpeg?auto=compress&cs=tinysrgb&w=400", cat: "Овощи и фрукты", name: "Яблоки апорт", unit: "кг", price: 780, emoji: "🍎" },
    { id: "f28", img: "https://images.pexels.com/photos/2116020/pexels-photo-2116020.jpeg?auto=compress&cs=tinysrgb&w=400", cat: "Овощи и фрукты", name: "Бананы", unit: "кг", price: 990, emoji: "🍌" },
    { id: "f29", img: "https://images.pexels.com/photos/1414122/pexels-photo-1414122.jpeg?auto=compress&cs=tinysrgb&w=400", cat: "Овощи и фрукты", name: "Лимоны", unit: "кг", price: 1200, emoji: "🍋" },
    { id: "f30", img: "https://images.pexels.com/photos/8477071/pexels-photo-8477071.jpeg?auto=compress&cs=tinysrgb&w=400", cat: "Мясо и колбасы", name: "Говядина (мякоть)", unit: "кг", price: 3400, emoji: "🥩" },
    { id: "f31", img: "https://images.pexels.com/photos/10842246/pexels-photo-10842246.jpeg?auto=compress&cs=tinysrgb&w=400", cat: "Мясо и колбасы", name: "Курица (тушка)", unit: "кг", price: 1650, emoji: "🍗" },
    { id: "f32", cat: "Мясо и колбасы", name: "Фарш говяжий", unit: "кг", price: 3200, emoji: "🥩" },
    { id: "f33", cat: "Мясо и колбасы", name: "Колбаса «Сервелат» 350 г", unit: "шт", price: 1890, emoji: "🌭" },
    { id: "f34", cat: "Мясо и колбасы", name: "Сосиски молочные 1 кг", unit: "кг", price: 2400, emoji: "🌭" },
    { id: "f35", img: "https://images.pexels.com/photos/7225122/pexels-photo-7225122.jpeg?auto=compress&cs=tinysrgb&w=400", cat: "Заморозка", name: "Пельмени «Домашние» 900 г", unit: "уп", price: 1950, emoji: "🥟", hit: true },
    { id: "f36", cat: "Заморозка", name: "Мороженое пломбир 400 г", unit: "шт", price: 990, emoji: "🍨" },
    { id: "f37", cat: "Консервы", name: "Тушёнка говяжья 325 г", unit: "банка", price: 1450, emoji: "🥫" },
    { id: "f38", cat: "Консервы", name: "Томатная паста 270 г", unit: "банка", price: 520, emoji: "🥫" },
    { id: "f39", cat: "Консервы", name: "Горошек зелёный 400 г", unit: "банка", price: 480, emoji: "🥫" },
    { id: "f40", cat: "Напитки", name: "Вода «Асем-Ай» 5 л", unit: "шт", price: 550, emoji: "💧" },
    { id: "f41", cat: "Напитки", name: "Coca-Cola 1,5 л", unit: "шт", price: 750, emoji: "🥤" },
    { id: "f42", cat: "Напитки", name: "Сок «Gracio» 1 л", unit: "шт", price: 890, emoji: "🧃" },
    { id: "f43", cat: "Сладости и снеки", name: "Печенье «Юбилейное» 300 г", unit: "уп", price: 650, emoji: "🍪" },
    { id: "f44", cat: "Сладости и снеки", name: "Шоколад «Казахстан» 100 г", unit: "шт", price: 780, oldPrice: 850, emoji: "🍫", hit: true },
    { id: "f45", cat: "Сладости и снеки", name: "Конфеты «Рахат» ассорти", unit: "кг", price: 3200, emoji: "🍬" },
    { id: "f46", cat: "Сладости и снеки", name: "Чипсы Lay's 140 г", unit: "уп", price: 890, emoji: "🍟" },
    { id: "f47", cat: "Бытовая химия", name: "Порошок стиральный 3 кг", unit: "уп", price: 2900, emoji: "🧺" },
    { id: "f48", cat: "Бытовая химия", name: "Средство для посуды 500 мл", unit: "шт", price: 650, emoji: "🧴" },
    { id: "f49", cat: "Бытовая химия", name: "Туалетная бумага (4 рул.)", unit: "уп", price: 780, emoji: "🧻" },
    { id: "f50", cat: "Бытовая химия", name: "Мыло хозяйственное", unit: "шт", price: 250, emoji: "🧼" },
  ],
  build: [
    { id: "b1", cat: "Сухие смеси", name: "Цемент М400, 50 кг", unit: "мешок", price: 2450, oldPrice: 2600, emoji: "🏗️", hit: true },
    { id: "b2", cat: "Сухие смеси", name: "Шпаклёвка финишная 25 кг", unit: "мешок", price: 3200, emoji: "🪣" },
    { id: "b3", cat: "Сухие смеси", name: "Клей плиточный 25 кг", unit: "мешок", price: 2100, emoji: "🧱", hit: true },
    { id: "b4", img: "https://images.pexels.com/photos/33160441/pexels-photo-33160441.jpeg?auto=compress&cs=tinysrgb&w=400", cat: "Стеновые материалы", name: "Кирпич красный М100", unit: "шт", price: 95, emoji: "🧱" },
    { id: "b5", cat: "Стеновые материалы", name: "Гипсокартон 12,5 мм 1,2×2,5", unit: "лист", price: 2700, oldPrice: 2900, emoji: "⬜" },
    { id: "b6", cat: "Кровля и металл", name: "Профлист С8 оцинк. 2 м", unit: "лист", price: 4800, emoji: "🏠" },
    { id: "b7", cat: "Кровля и металл", name: "Арматура Ø12, 11,7 м", unit: "шт", price: 3900, emoji: "➖" },
    { id: "b8", img: "https://images.pexels.com/photos/6474309/pexels-photo-6474309.jpeg?auto=compress&cs=tinysrgb&w=400", cat: "Краски и отделка", name: "Эмаль ПФ-115 белая 2,7 кг", unit: "банка", price: 3400, emoji: "🎨" },
    { id: "b9", img: "https://images.pexels.com/photos/1887946/pexels-photo-1887946.jpeg?auto=compress&cs=tinysrgb&w=400", cat: "Краски и отделка", name: "Грунтовка глубокого проникн. 10 л", unit: "шт", price: 4200, emoji: "🪣" },
    { id: "b10", cat: "Крепёж", name: "Саморезы по ГКЛ 3,5×25 (1 кг)", unit: "уп", price: 1600, emoji: "🔩" },
    { id: "b11", cat: "Крепёж", name: "Дюбель-гвоздь 6×40 (100 шт)", unit: "уп", price: 900, emoji: "🔩" },
    { id: "b12", cat: "Электрика", name: "Кабель ВВГнг 3×2,5 (за метр)", unit: "м", price: 620, emoji: "🔌" },
    { id: "b13", cat: "Электрика", name: "Розетка накладная двойная", unit: "шт", price: 1100, emoji: "🔌" },
    { id: "b14", cat: "Инструмент", name: "Шпатель 250 мм", unit: "шт", price: 1300, emoji: "🛠️" },
    { id: "b15", cat: "Инструмент", name: "Перчатки рабочие", unit: "пара", price: 350, emoji: "🧤" },
    { id: "b16", cat: "Сантехника", name: "Труба ППР Ø25 (за метр)", unit: "м", price: 480, emoji: "🚿" },
  ],
};

const THEMES = {
  food: {
    accent: "#1E7A46", accentDark: "#155C34", accentSoft: "#E7F4EC",
    label: "Продукты", tagline: "Свежее — каждый день",
  },
  build: {
    accent: "#C77B12", accentDark: "#9A5E0B", accentSoft: "#FBF1E1",
    label: "Стройматериалы", tagline: "Всё для стройки и ремонта",
  },
};

const I18N = {
  ru: {
    sec_food: "Продукты", sec_build: "Стройматериалы",
    tag_food: "Свежее — каждый день", tag_build: "Всё для стройки и ремонта",
    heroA: "Доставка по Шымкенту от 60 минут · бесплатно от ", heroB: "",
    closed1: "🌙 Магазин сейчас закрыт", closed2: "Заказ можно оформить — соберём в рабочее время.",
    searchIn: "Поиск в разделе", all: "Все",
    sort: "Сортировка:", sort_default: "По порядку", sort_promo: "🔥 Акции и хиты", sort_cheap: "Дешевле", sort_exp: "Дороже",
    promoWeek: "🔥 Акции недели", repeatLast: "🔄 Повторить прошлый заказ",
    toCart: "В корзину", notFound: "Ничего не нашлось. Попробуйте изменить запрос или позвоните нам — подберём вручную.",
    checkout: "оформить", cart: "Корзина", cartEmpty: "Пока пусто. Добавьте товары из каталога.",
    toFree: "до бесплатной доставки", total: "Итого", makeOrder: "Оформить заказ",
    coTitle: "Оформление заказа", name: "Ваше имя", phone: "Телефон",
    getType: "Способ получения", delivery: "Доставка", pickup: "Самовывоз",
    address: "Адрес доставки", zoneL: "Район доставки", slotL: "Время доставки",
    asap: "Ближайшее время (60–90 мин)", today: "Сегодня", tomorrow: "Завтра",
    pickupNote: "📍 Магазин «Сайман», г. Шымкент, ул. Байтерекова, 9а. Заказ будет готов через 30–40 минут.",
    pay: "Оплата", cash: "Наличные", kaspi: "Kaspi перевод / QR",
    comment: "Комментарий к заказу", commentPh: "Например: позвонить за 10 минут",
    confirm: "Подтвердить заказ", items: "Товары", free: "бесплатно", freeFrom: "бесплатно от",
    done: "Заказ принят!", yourNum: "Номер вашего заказа",
    doneDelivery: "Курьер свяжется с вами по телефону для уточнения времени доставки.",
    donePickup: "Заказ можно забрать в магазине «Сайман» через 30–40 минут. Мы позвоним, когда всё будет готово.",
    sendWa: "💬 Отправить заказ в WhatsApp магазина",
    waNote: "Нажмите, чтобы продублировать заказ в WhatsApp — так магазин увидит его мгновенно",
    back: "Вернуться в магазин", backShort: "← В магазин", backCatalog: "← Назад в каталог",
    myOrders: "Мои заказы", myNote: "История сохраняется на этом устройстве",
    noOrders: "Заказов с этого устройства пока не было. Оформите первый — и он появится здесь со статусом.",
    repeat: "🔄 Повторить", refreshSt: "⟳ Обновить статусы", myData: "Мои данные",
    myDataNote: "Подставляются автоматически при оформлении", save: "Сохранить",
    saved: "Данные сохранены — при заказе будут подставляться сами",
    footerTag: "Продукты и стройматериалы рядом с домом", daily: "Ежедневно",
    privacy: "Политика конфиденциальности", loading: "Загружаю…",
    st_new: "Новый", st_accepted: "Принят", st_picking: "Сборка", st_picked: "Собран",
    st_delivering: "В пути", st_done: "Доставлен", st_cancelled: "Отменён",
    linkTitle: "Мой аккаунт на другом устройстве", linkNote: "Чтобы видеть свои заказы на новом телефоне или компьютере",
    getCode: "Получить код переноса", codeShown: "Введите этот код на другом устройстве в течение 15 минут:",
    haveCode: "Есть код с другого устройства?", codePh: "6 цифр", applyCode: "Перенести сюда",
    codeOk: "Готово! Ваши заказы и данные перенесены на это устройство.", codeBad: "Код не найден или истёк — получите новый",
    promoL: "Промокод", promoPh: "Есть промокод?", applyP: "Применить", discountL: "Скидка",
    leftN: "Осталось", promoApplied: "Промокод применён!",
  },
  kk: {
    sec_food: "Азық-түлік", sec_build: "Құрылыс материалдары",
    tag_food: "Күн сайын жаңа өнімдер", tag_build: "Құрылыс пен жөндеуге барлығы",
    heroA: "Шымкент бойынша жеткізу 60 минуттан · ", heroB: " бастап тегін",
    closed1: "🌙 Дүкен қазір жабық", closed2: "Тапсырыс беруге болады — жұмыс уақытында жинаймыз.",
    searchIn: "Іздеу бөлімі:", all: "Барлығы",
    sort: "Сұрыптау:", sort_default: "Рет бойынша", sort_promo: "🔥 Акциялар мен хиттер", sort_cheap: "Арзанырақ", sort_exp: "Қымбатырақ",
    promoWeek: "🔥 Апта акциялары", repeatLast: "🔄 Өткен тапсырысты қайталау",
    toCart: "Себетке", notFound: "Ештеңе табылмады. Сұранысты өзгертіп көріңіз немесе бізге қоңырау шалыңыз.",
    checkout: "рәсімдеу", cart: "Себет", cartEmpty: "Себет бос. Каталогтан тауар қосыңыз.",
    toFree: "тегін жеткізуге дейін", total: "Жиыны", makeOrder: "Тапсырыс беру",
    coTitle: "Тапсырысты рәсімдеу", name: "Атыңыз", phone: "Телефон",
    getType: "Алу тәсілі", delivery: "Жеткізу", pickup: "Өзім алып кетем",
    address: "Жеткізу мекенжайы", zoneL: "Жеткізу ауданы", slotL: "Жеткізу уақыты",
    asap: "Мүмкіндігінше тез (60–90 мин)", today: "Бүгін", tomorrow: "Ертең",
    pickupNote: "📍 «Сайман» дүкені, Шымкент қ., Байтереков к-сі, 9а. Тапсырыс 30–40 минутта дайын болады.",
    pay: "Төлем", cash: "Қолма-қол", kaspi: "Kaspi аударым / QR",
    comment: "Тапсырысқа түсініктеме", commentPh: "Мысалы: 10 минут бұрын қоңырау шалу",
    confirm: "Тапсырысты растау", items: "Тауарлар", free: "тегін", freeFrom: "тегін жеткізу:",
    done: "Тапсырыс қабылданды!", yourNum: "Тапсырыс нөміріңіз",
    doneDelivery: "Курьер жеткізу уақытын нақтылау үшін сізге қоңырау шалады.",
    donePickup: "Тапсырысты «Сайман» дүкенінен 30–40 минуттан кейін алуға болады. Дайын болғанда қоңырау шаламыз.",
    sendWa: "💬 Тапсырысты дүкеннің WhatsApp-ына жіберу",
    waNote: "Басыңыз — тапсырыс WhatsApp арқылы да кетеді, дүкен оны бірден көреді",
    back: "Дүкенге оралу", backShort: "← Дүкенге", backCatalog: "← Каталогқа",
    myOrders: "Менің тапсырыстарым", myNote: "Тарих осы құрылғыда сақталады",
    noOrders: "Бұл құрылғыдан әлі тапсырыс болған жоқ. Алғашқысын рәсімдеңіз — ол осында статусымен көрінеді.",
    repeat: "🔄 Қайталау", refreshSt: "⟳ Статустарды жаңарту", myData: "Менің деректерім",
    myDataNote: "Рәсімдеу кезінде автоматты түрде қойылады", save: "Сақтау",
    saved: "Деректер сақталды — тапсырыс кезінде өздігінен қойылады",
    footerTag: "Үйге жақын азық-түлік пен құрылыс материалдары", daily: "Күн сайын",
    privacy: "Құпиялылық саясаты", loading: "Жүктелуде…",
    st_new: "Жаңа", st_accepted: "Қабылданды", st_picking: "Жиналуда", st_picked: "Жиналды",
    st_delivering: "Жолда", st_done: "Жеткізілді", st_cancelled: "Бас тартылды",
    linkTitle: "Аккаунтым басқа құрылғыда", linkNote: "Тапсырыстарыңызды жаңа телефонда немесе компьютерде көру үшін",
    getCode: "Көшіру кодын алу", codeShown: "Осы кодты 15 минут ішінде басқа құрылғыда енгізіңіз:",
    haveCode: "Басқа құрылғыдан код бар ма?", codePh: "6 сан", applyCode: "Осында көшіру",
    codeOk: "Дайын! Тапсырыстарыңыз бен деректеріңіз осы құрылғыға көшірілді.", codeBad: "Код табылмады немесе мерзімі өтті — жаңасын алыңыз",
    promoL: "Промокод", promoPh: "Промокод бар ма?", applyP: "Қолдану", discountL: "Жеңілдік",
    leftN: "Қалды", promoApplied: "Промокод қолданылды!",
  },
};

const DEFAULT_SETTINGS = { delivery_fee: 700, free_from: 10000, min_order: 0, hours: "08:00 – 22:00", shop_open: true };
const beep = () => {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const o = ctx.createOscillator(); const g = ctx.createGain();
    o.connect(g); g.connect(ctx.destination);
    o.frequency.value = 880; g.gain.value = 0.12;
    o.start(); o.stop(ctx.currentTime + 0.3);
  } catch {}
};
const WA_PHONE = "77755683313"; // WhatsApp магазина: +7 775 568 33 13

// ── Общая база данных (Supabase) ──
const SUPA_URL = "https://zbnlbxsoxdmmhvmdargy.supabase.co";
const SUPA_KEY = "sb_publishable_V7hiiZLeL5fEEowwmgSfTQ_NdlTbSrl";
const sHeaders = { apikey: SUPA_KEY, Authorization: "Bearer " + SUPA_KEY, "Content-Type": "application/json" };
const sGet = (path) => fetch(SUPA_URL + "/rest/v1/" + path, { headers: sHeaders }).then((r) => { if (!r.ok) throw new Error("db"); return r.json(); });
const sPost = (path, body, extra) => fetch(SUPA_URL + "/rest/v1/" + path, { method: "POST", headers: { ...sHeaders, ...(extra || {}) }, body: JSON.stringify(body) }).then((r) => { if (!r.ok) return r.text().then((t) => { throw new Error(t); }); return r.text().then((t) => (t ? JSON.parse(t) : null)); });
const rpc = (fn, args) => sPost("rpc/" + fn, args);
const rowToProduct = (r) => ({ id: r.id, cat: r.cat, name: r.name, unit: r.unit, price: r.price, oldPrice: r.old_price || undefined, hit: r.hit || undefined, img: r.img || undefined, emoji: r.emoji || "🛒", available: r.available !== false, stock: r.stock ?? null });
const productToRow = (sec, p) => ({ id: p.id, section: sec, cat: p.cat, name: p.name, unit: p.unit, price: p.price, old_price: p.oldPrice ?? null, hit: !!p.hit, img: p.img ?? null, emoji: p.emoji || "🛒", available: p.available !== false, stock: p.stock ?? null });
const getClientId = () => {
  try {
    let v = localStorage.getItem("sayman-cid");
    if (!v) {
      v = (crypto.randomUUID ? crypto.randomUUID() : Date.now() + "-" + Math.random().toString(36).slice(2) + Math.random().toString(36).slice(2));
      localStorage.setItem("sayman-cid", v);
    }
    return v;
  } catch { return "no-storage"; }
};
const ORDER_FLOW = ["new", "accepted", "picking", "picked", "delivering", "done"];

const supaRT = createClient(SUPA_URL, SUPA_KEY);
const mapOrderRow = (r) => ({ ...r, time: new Date(r.created_at).toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" }), date: new Date(r.created_at).toLocaleDateString("ru-RU") });

const fmt = (n) => n.toLocaleString("ru-RU") + " ₸";

const buildWaMsg = (o) => encodeURIComponent(
  "🛒 НОВЫЙ ЗАКАЗ " + o.num + " — Сайман\n" +
  "Имя: " + o.name + "\n" +
  "Телефон: " + o.phone + "\n" +
  (o.type === "delivery" ? "🚚 Доставка: " + o.address : "🏪 Самовывоз") + "\n" +
  (o.slot ? "🕒 " + o.slot + "\n" : "") +
  (o.zone ? "📍 Район: " + o.zone + "\n" : "") +
  (o.discount ? "🎟 Промокод " + o.promo + ": −" + o.discount.toLocaleString("ru-RU") + " ₸\n" : "") +
  "Оплата: " + (o.pay === "kaspi" ? "Kaspi" : "Наличные") + "\n" +
  (o.comment ? "Комментарий: " + o.comment + "\n" : "") +
  "───────────\n" +
  o.items.map((i) => "• " + i.name + " × " + i.qty + " = " + (i.qty * i.price).toLocaleString("ru-RU") + " ₸").join("\n") +
  "\n───────────\nИТОГО: " + o.total.toLocaleString("ru-RU") + " ₸"
);

const STATUS = {
  new: { label: "Новый", color: "#C7411A" },
  accepted: { label: "Принят", color: "#B3540A" },
  picking: { label: "Сборка", color: "#C77B12" },
  picked: { label: "Собран", color: "#8A7500" },
  delivering: { label: "В пути", color: "#1E5F7A" },
  done: { label: "Доставлен", color: "#1E7A46" },
  cancelled: { label: "Отменён", color: "#888" },
  work: { label: "В работе", color: "#C77B12" },
};
const NEXT_STATUS = { new: "accepted", accepted: "picking", picking: "picked", picked: "delivering", delivering: "done", work: "done" };


export default function SaymanStore() {
  const [mode, setMode] = useState("food");
  const [category, setCategory] = useState("Все");
  const [search, setSearch] = useState("");
  const [cart, setCart] = useState({}); // id -> qty
  const [cartOpen, setCartOpen] = useState(false);
  const [screen, setScreen] = useState("shop"); // shop | checkout | done
  const [order, setOrder] = useState({ name: "", phone: "", type: "delivery", address: "", pay: "kaspi", comment: "", slot: "", zone: "" });
  const [orderNum, setOrderNum] = useState(null);
  const [orders, setOrders] = useState([]);
  const [lastOrder, setLastOrder] = useState(null);
  const [staffAuth, setStaffAuth] = useState(false);
  const [pinInput, setPinInput] = useState("");
  const [sort, setSort] = useState("default");
  const [adminTab, setAdminTab] = useState("orders");
  const [adminSection, setAdminSection] = useState("food");
  const [productsData, setProductsData] = useState(DEFAULT_PRODUCTS);
  const [newProd, setNewProd] = useState(null);
  const [adminOrders, setAdminOrders] = useState([]);
  const [staffPin, setStaffPin] = useState("");
  const [privacyOpen, setPrivacyOpen] = useState(false);
  const [staffRole, setStaffRole] = useState("");
  const [staffName, setStaffName] = useState("");
  const [staffList, setStaffList] = useState([]);
  const [staffDraft, setStaffDraft] = useState({ name: "", role: "picker", pin: "" });
  const [pickState, setPickState] = useState({});
  const [myOrders, setMyOrders] = useState([]);
  const [myLoading, setMyLoading] = useState(false);
  const [linkCode, setLinkCode] = useState("");
  const [claimInput, setClaimInput] = useState("");
  const [promoInput, setPromoInput] = useState("");
  const [promoApplied, setPromoApplied] = useState(null);
  const [promos, setPromos] = useState([]);
  const [promoDraft, setPromoDraft] = useState({ code: "", kind: "percent", value: "", min_total: "" });
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const [orderFilter, setOrderFilter] = useState("all");
  const [orderSearch, setOrderSearch] = useState("");
  const [orderDays, setOrderDays] = useState("all");
  const [prodSearch, setProdSearch] = useState("");
  const [pinsDraft, setPinsDraft] = useState({ a: "", p: "", c: "" });
  const prevNewCount = useRef(0);
  const [lang, setLang] = useState(() => { try { return localStorage.getItem("sayman-lang") || "ru"; } catch { return "ru"; } });
  const t = (k) => (I18N[lang] && I18N[lang][k]) || I18N.ru[k] || k;
  const switchLang = () => { const n = lang === "ru" ? "kk" : "ru"; setLang(n); try { localStorage.setItem("sayman-lang", n); } catch {} };
  const FREE_DELIVERY = settings.free_from;
  const DELIVERY_FEE = settings.delivery_fee;

  // Загрузка сохранённых данных (заказы + данные клиента) при открытии
  useEffect(() => {
    (async () => {
      try {
        const saved = await appStorage.get("sayman-orders");
        if (saved?.value) setOrders(JSON.parse(saved.value));
      } catch {}
      try {
        const st = await sGet("shop_settings?select=*&id=eq.1");
        if (st[0]) setSettings({ ...DEFAULT_SETTINGS, ...st[0] });
      } catch {}
      try {
        const rows = await sGet("products?select=*&order=pos.asc");
        if (rows.length) setProductsData({
          food: rows.filter((r) => r.section === "food").map(rowToProduct),
          build: rows.filter((r) => r.section === "build").map(rowToProduct),
        });
      } catch {}
      try {
        const cust = await appStorage.get("sayman-customer");
        if (cust?.value) {
          const c = JSON.parse(cust.value);
          setOrder((o) => ({ ...o, name: c.name || "", phone: c.phone || "", address: c.address || "", type: c.type || "delivery", pay: c.pay || "kaspi" }));
        }
      } catch {}
    })();
  }, []);

  const persistOrders = async (list) => {
    try { await appStorage.set("sayman-orders", JSON.stringify(list.slice(0, 50))); } catch {}
  };

  useEffect(() => {
    if (!staffAuth || screen !== "admin") return;
    const t = setInterval(() => { loadAdminOrders(staffPin).catch(() => {}); }, 30000);
    const ch = supaRT
      .channel("orders-live")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "orders" }, () => {
        beep();
        loadAdminOrders(staffPin).catch(() => {});
      })
      .subscribe();
    return () => { clearInterval(t); supaRT.removeChannel(ch); };
  }, [staffAuth, screen, staffPin]);
  useEffect(() => {
    if (staffAuth && staffRole === "admin" && adminTab === "settings") {
      rpc("admin_get_promos", { _pin: staffPin }).then(setPromos).catch(() => {});
      rpc("admin_get_staff", { _pin: staffPin }).then(setStaffList).catch(() => {});
    }
  }, [staffAuth, staffRole, adminTab, staffPin]);
  useEffect(() => {
    const n = adminOrders.filter((o) => o.status === "new").length;
    if (staffAuth && n > prevNewCount.current) beep();
    prevNewCount.current = n;
  }, [adminOrders, staffAuth]);

  const dbFail = () => alert("Не удалось сохранить в базе. Проверьте интернет и попробуйте ещё раз.");
  const updateProduct = (sec, id, patch) => setProductsData((prev) => {
    const list = prev[sec].map((p) => (p.id === id ? { ...p, ...patch } : p));
    const prod = list.find((p) => p.id === id);
    rpc("admin_upsert_product", { _pin: staffPin, _p: productToRow(sec, prod) }).catch(dbFail);
    return { ...prev, [sec]: list };
  });
  const deleteProduct = (sec, id) => {
    if (!window.confirm("Удалить товар из каталога?")) return;
    rpc("admin_delete_product", { _pin: staffPin, _id: id }).catch(dbFail);
    setProductsData((prev) => ({ ...prev, [sec]: prev[sec].filter((p) => p.id !== id) }));
  };
  const addProduct = (sec, prod) => {
    const full = { ...prod, id: sec[0] + Date.now() };
    rpc("admin_upsert_product", { _pin: staffPin, _p: productToRow(sec, full) }).catch(dbFail);
    setProductsData((prev) => ({ ...prev, [sec]: [full, ...prev[sec]] }));
  };
  const loadAdminOrders = async (pin) => {
    const res = await rpc("staff_login", { _pin: pin });
    setStaffRole(res.role);
    setStaffName(res.name || "");
    setAdminOrders((res.orders || []).map(mapOrderRow));
    return res.role;
  };
  const tryStaffLogin = async (pin) => {
    try { await loadAdminOrders(pin); setStaffPin(pin); setStaffAuth(true); setPinInput(""); }
    catch { setPinInput(""); alert("Неверный PIN-код (или нет связи с базой)"); }
  };
  const notifyClient = (o) => {
    const phone = String(o.phone || "").replace(/\D/g, "");
    if (phone.length < 10) return alert("У заказа нет корректного номера клиента");
    const texts = {
      new: "Здравствуйте! Ваш заказ " + o.num + " в магазине «Сайман» принят. Сумма: " + fmt(o.total) + ". Скоро начнём сборку!",
      accepted: "Здравствуйте! Ваш заказ " + o.num + " принят в работу. Сумма: " + fmt(o.total) + (o.slot ? ". Доставка: " + o.slot : "") + ".",
      picking: "Ваш заказ " + o.num + " сейчас собирается. Если какой-то позиции не окажется — мы позвоним и предложим замену.",
      picked: o.type === "pickup"
        ? "Ваш заказ " + o.num + " собран и ждёт вас в магазине «Сайман» (Байтерекова, 9а). Сумма: " + fmt(o.total) + "."
        : "Ваш заказ " + o.num + " собран и передаётся курьеру. Сумма: " + fmt(o.total) + ".",
      delivering: "Курьер выехал с вашим заказом " + o.num + "! Сумма к оплате: " + fmt(o.total) + " (" + (o.pay === "kaspi" ? "Kaspi" : "наличные") + ").",
      done: "Заказ " + o.num + " доставлен. Спасибо, что выбрали «Сайман»! Будем рады новому заказу 🙌",
      cancelled: "К сожалению, заказ " + o.num + " отменён. Свяжитесь с нами, если это ошибка: +7 775 568 33 13.",
    };
    window.open("https://wa.me/" + (phone.length === 10 ? "7" + phone : phone) + "?text=" + encodeURIComponent(texts[o.status] || texts.accepted), "_blank");
  };

  const printOrder = (o) => {
    const rows = (o.items || []).map((i) =>
      "<tr><td style='border-bottom:1px solid #ccc;padding:6px 4px;font-size:20px'>☐</td>" +
      "<td style='border-bottom:1px solid #ccc;padding:6px 4px'>" + i.name + (i.missing ? " (НЕТ)" : "") + "</td>" +
      "<td style='border-bottom:1px solid #ccc;padding:6px 4px;text-align:center'><b>× " + i.qty + "</b></td>" +
      "<td style='border-bottom:1px solid #ccc;padding:6px 4px;text-align:right'>" + (i.qty * i.price).toLocaleString("ru-RU") + " ₸</td></tr>"
    ).join("");
    const html = "<html><head><meta charset='utf-8'><title>" + o.num + "</title></head>" +
      "<body style='font-family:Arial;max-width:420px;margin:0 auto;padding:10px'>" +
      "<h2 style='margin:4px 0'>САЙМАН · " + o.num + "</h2>" +
      "<div style='font-size:14px;color:#333'>" + (o.date || "") + " " + (o.time || "") + "<br>" +
      "👤 " + (o.name || "") + " · " + (o.phone || "") + "<br>" +
      (o.type === "delivery" ? "🚚 " + (o.address || "") + (o.zone ? " (" + o.zone + ")" : "") : "🏪 Самовывоз") +
      (o.slot ? "<br>🕒 " + o.slot : "") +
      (o.comment ? "<br>💬 " + o.comment : "") + "</div>" +
      "<table style='width:100%;border-collapse:collapse;margin-top:10px;font-size:14px'>" + rows + "</table>" +
      "<h3 style='text-align:right;margin-top:10px'>ИТОГО: " + (o.total || 0).toLocaleString("ru-RU") + " ₸ · " +
      (o.pay === "kaspi" ? "Kaspi" : "Наличные") + "</h3>" +
      "<script>window.print()</" + "script></body></html>";
    const w = window.open("", "_blank", "width=460,height=640");
    if (w) { w.document.write(html); w.document.close(); }
  };

  const exportCSV = () => {
    const esc = (v) => '"' + String(v == null ? "" : v).replace(/"/g, '""') + '"';
    const rows = [["Номер", "Дата", "Время", "Имя", "Телефон", "Получение", "Адрес", "Оплата", "Статус", "Сумма", "Состав"].join(";")];
    adminOrders.forEach((o) => rows.push([
      o.num, o.date, o.time, o.name, o.phone,
      o.type === "delivery" ? "Доставка" : "Самовывоз", o.address || "",
      o.pay === "kaspi" ? "Kaspi" : "Наличные", STATUS[o.status]?.label || o.status, o.total,
      (o.items || []).map((i) => i.name + " x" + i.qty).join(", "),
    ].map(esc).join(";")));
    const blob = new Blob(["\ufeff" + rows.join("\r\n")], { type: "text/csv;charset=utf-8" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "sayman-заказы-" + new Date().toLocaleDateString("ru-RU") + ".csv";
    a.click();
  };

  const setOrderStatus = (id, status) => {
    rpc("staff_set_status", { _pin: staffPin, _id: id, _status: status }).catch((e) => {
      const m = String(e.message || "");
      alert(m.includes("уже") ? m.replace(/.*message":"([^"]+)".*/, "$1") : "Не удалось сохранить — обновите список");
      loadAdminOrders(staffPin).catch(() => {});
    });
    setAdminOrders((prev) => prev.map((o) => (o.id === id ? {
      ...o, status,
      picker: status === "picking" && staffRole === "picker" ? staffName : o.picker,
      courier: status === "delivering" && staffRole === "courier" ? staffName : o.courier,
    } : o)));
  };
  const cycleAdminStatus = (id, cur) => {
    const next = NEXT_STATUS[cur];
    if (!next) return;
    setOrderStatus(id, next);
  };
  const cancelOrder = (id) => {
    if (!window.confirm("Отменить заказ?")) return;
    setOrderStatus(id, "cancelled");
  };
  const togglePickItem = (oid, idx, kind) => setPickState((prev) => {
    const cur = prev[oid] || { col: {}, miss: {} };
    const next = { col: { ...cur.col }, miss: { ...cur.miss } };
    if (kind === "col") { next.col[idx] = !next.col[idx]; if (next.col[idx]) delete next.miss[idx]; }
    else { next.miss[idx] = !next.miss[idx]; if (next.miss[idx]) delete next.col[idx]; }
    return { ...prev, [oid]: next };
  });
  const finishPick = (o) => {
    const st = pickState[o.id] || { col: {}, miss: {} };
    const items = (o.items || []).map((i, idx) => (st.miss[idx] ? { ...i, missing: true } : i));
    const goodsOld = (o.items || []).reduce((s, i) => s + i.qty * i.price, 0);
    const deliveryPart = Math.max(0, o.total - goodsOld);
    const goodsNew = items.filter((i) => !i.missing).reduce((s, i) => s + i.qty * i.price, 0);
    const total = goodsNew + deliveryPart;
    rpc("staff_update_items", { _pin: staffPin, _id: o.id, _items: items, _total: total }).catch(dbFail);
    rpc("staff_set_status", { _pin: staffPin, _id: o.id, _status: "picked" }).catch(() => {});
    setAdminOrders((prev) => prev.map((x) => (x.id === o.id ? { ...x, items, total, status: "picked" } : x)));
    if (items.some((i) => i.missing)) alert("Есть позиции «нет в наличии» — позвоните клиенту и сообщите новую сумму: " + fmt(total));
  };
  const uploadPhoto = (sec, id, file) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const im = new Image();
      im.onload = () => {
        const c = document.createElement("canvas");
        c.width = 320; c.height = 320;
        const s = Math.min(im.width, im.height);
        c.getContext("2d").drawImage(im, (im.width - s) / 2, (im.height - s) / 2, s, s, 0, 0, 320, 320);
        updateProduct(sec, id, { img: c.toDataURL("image/jpeg", 0.65) });
      };
      im.src = reader.result;
    };
    reader.readAsDataURL(file);
  };

  const theme = THEMES[mode];
  const products = productsData[mode];
  const categories = ["Все", ...new Set(products.map((p) => p.cat))];

  useEffect(() => { setCategory("Все"); setSearch(""); }, [mode]);

  const visible = useMemo(() => {
    const q = search.toLowerCase().trim();
    let list;
    if (q) {
      list = [
        ...productsData.food.map((p) => ({ ...p, _sec: "food" })),
        ...productsData.build.map((p) => ({ ...p, _sec: "build" })),
      ].filter((p) => p.available !== false && (p.stock == null || p.stock > 0) && p.name.toLowerCase().includes(q));
    } else {
      list = products.filter((p) => p.available !== false && (p.stock == null || p.stock > 0) && (category === "Все" || p.cat === category));
    }
    if (sort === "cheap") list = [...list].sort((a, b) => a.price - b.price);
    if (sort === "expensive") list = [...list].sort((a, b) => b.price - a.price);
    if (sort === "promo") list = [...list].sort((a, b) => (b.oldPrice ? 1 : 0) + (b.hit ? 1 : 0) - (a.oldPrice ? 1 : 0) - (a.hit ? 1 : 0));
    return list;
  }, [products, productsData, category, search, sort]);

  const allProducts = [...productsData.food, ...productsData.build];
  const cartItems = Object.entries(cart).filter(([, q]) => q > 0)
    .map(([id, qty]) => ({ ...allProducts.find((p) => p.id === id), qty }));
  const cartCount = cartItems.reduce((s, i) => s + i.qty, 0);
  const cartTotal = cartItems.reduce((s, i) => s + i.qty * i.price, 0);
  const zonesArr = Array.isArray(settings.zones) ? settings.zones : [];
  const curZone = order.zone || (zonesArr[0] && zonesArr[0].name) || "";
  const zoneFee = (zonesArr.find((z) => z.name === curZone) || {}).fee ?? DELIVERY_FEE;
  const deliveryFee = order.type === "delivery" && cartTotal < FREE_DELIVERY ? zoneFee : 0;
  const discount = promoApplied ? Math.min(promoApplied.discount, cartTotal) : 0;
  const grandTotal = Math.max(0, cartTotal + deliveryFee - discount);

  const add = (id, d) => setCart((c) => {
    const q = Math.max(0, (c[id] || 0) + d);
    if (d > 0) {
      const p = allProducts.find((x) => x.id === id);
      if (p && p.stock != null && q > p.stock) { alert((lang === "kk" ? "Қоймада қалғаны: " : "На складе осталось: ") + p.stock); return c; }
    }
    return { ...c, [id]: q };
  });

  const submitOrder = () => {
    if (settings.min_order > 0 && cartTotal < settings.min_order) return alert("Минимальная сумма заказа — " + fmt(settings.min_order));
    if (!order.name.trim() || order.phone.trim().length < 10) return alert("Укажите имя и номер телефона");
    if (order.type === "delivery" && !order.address.trim()) return alert("Укажите адрес доставки");
    const num = "SM-" + Math.floor(1000 + Math.random() * 9000);
    const newOrder = {
      num, ...order, items: cartItems.map(({ img, ...rest }) => rest), total: grandTotal,
      promo: promoApplied ? promoApplied.code : null, discount,
      time: new Date().toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" }),
      date: new Date().toLocaleDateString("ru-RU"), status: "new",
    };
    setOrders((prev) => {
      const next = [newOrder, ...prev];
      persistOrders(next);
      return next;
    });
    sPost("orders", {
      num, name: order.name, phone: order.phone, type: order.type,
      address: order.address, pay: order.pay, comment: order.comment,
      slot: order.type === "delivery" ? (order.slot || "") : null,
      zone: order.type === "delivery" ? curZone : null,
      promo: newOrder.promo, discount: newOrder.discount,
      items: newOrder.items, total: newOrder.total, client_id: getClientId(),
    }, { Prefer: "return=minimal" }).catch(() => {});
    try { appStorage.set("sayman-customer", JSON.stringify({ name: order.name, phone: order.phone, address: order.address, type: order.type, pay: order.pay })); } catch {}
    setLastOrder(newOrder);
    setOrderNum(num);
    setScreen("done");
    setCart({});
    setPromoApplied(null);
    setPromoInput("");
  };

  const cycleStatus = (num) => setOrders((prev) => {
    const next = prev.map((o) => o.num === num ? { ...o, status: NEXT_STATUS[o.status] } : o);
    persistOrders(next);
    return next;
  });

  const loadMyOrders = async () => {
    setMyLoading(true);
    try {
      const rows = await rpc("client_get_orders", { _cid: getClientId() });
      setMyOrders(rows.map(mapOrderRow));
    } catch {}
    setMyLoading(false);
  };
  const repeatFromItems = (items) => {
    const next = {};
    let missing = 0;
    (items || []).forEach((i) => {
      const p = allProducts.find((x) => x.id === i.id);
      if (p && p.available !== false) next[i.id] = i.qty; else missing++;
    });
    setCart(next);
    setScreen("shop");
    setCartOpen(true);
    if (missing) alert("Некоторых товаров из того заказа сейчас нет в каталоге");
  };

  const repeatLastOrder = () => {
    if (!orders.length) return;
    const last = orders[0];
    const next = {};
    let missing = 0;
    last.items.forEach((i) => {
      if (allProducts.find((p) => p.id === i.id)) next[i.id] = i.qty; else missing++;
    });
    setCart(next);
    setCartOpen(true);
    if (missing) alert("Некоторых товаров из прошлого заказа больше нет в каталоге");
  };

  // ── стили ──
  const S = {
    page: { fontFamily: "'Manrope', sans-serif", background: "#F6F5F2", minHeight: "100vh", color: "#1B1B18" },
    wrap: { maxWidth: 1100, margin: "0 auto", padding: "0 16px" },
    btn: (bg, color = "#fff") => ({ background: bg, color, border: "none", borderRadius: 12, padding: "12px 20px", fontWeight: 700, fontSize: 15 }),
  };

  // ── экран подтверждения ──
  if (screen === "done") return (
    <div style={S.page}>
      <style>{FONTS}</style>
      <div style={{ ...S.wrap, maxWidth: 520, paddingTop: 80, textAlign: "center", animation: "fadeUp .4s ease" }}>
        <div style={{ fontSize: 64 }}>✅</div>
        <h1 style={{ fontFamily: "'Unbounded'", fontSize: 26, margin: "16px 0 8px" }}>{t("done")}</h1>
        <p style={{ fontSize: 17, color: "#555" }}>{t("yourNum")}</p>
        <div style={{ fontFamily: "'Unbounded'", fontSize: 34, fontWeight: 900, color: theme.accent, margin: "8px 0 20px" }}>{orderNum}</div>
        <p style={{ color: "#555", lineHeight: 1.6 }}>
          {order.type === "delivery" ? t("doneDelivery") + " (" + order.phone + ")" : t("donePickup")}
        </p>
        {lastOrder && (
          <button style={{ ...S.btn("#25D366"), width: "100%", marginTop: 26, padding: 16, fontSize: 16 }}
            onClick={() => window.open("https://wa.me/" + WA_PHONE + "?text=" + buildWaMsg(lastOrder), "_blank")}>
            {t("sendWa")}
          </button>
        )}
        <p style={{ fontSize: 13, color: "#999", marginTop: 10 }}>{t("waNote")}</p>
        <button style={{ ...S.btn("#f2f1ed", "#1B1B18"), marginTop: 14 }} onClick={() => { setScreen("shop"); setOrder((o) => ({ ...o, comment: "" })); }}>
          {t("back")}
        </button>
      </div>
    </div>
  );

  // ── панель персонала ──
  if (screen === "admin") {
    if (!staffAuth) return (
      <div style={S.page}>
        <style>{FONTS}</style>
        <div style={{ ...S.wrap, maxWidth: 380, paddingTop: 90, textAlign: "center", animation: "fadeUp .3s ease" }}>
          <div style={{ fontSize: 48 }}>🔐</div>
          <h1 style={{ fontFamily: "'Unbounded'", fontSize: 22, margin: "16px 0 8px" }}>Админ-панель</h1>
          <p style={{ color: "#777", fontSize: 14 }}>Введите PIN-код администратора</p>
          <input type="password" inputMode="numeric" value={pinInput} autoFocus
            onChange={(e) => setPinInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") tryStaffLogin(pinInput); }}
            style={{ width: "100%", padding: "16px", borderRadius: 14, border: "1.5px solid #ddd", fontSize: 24, textAlign: "center", letterSpacing: 8, marginTop: 18, background: "#fff" }}
            placeholder="••••" />
          <button style={{ ...S.btn("#1B1B18"), width: "100%", marginTop: 14, padding: 15 }}
            onClick={() => tryStaffLogin(pinInput)}>
            Войти
          </button>
          <button style={{ background: "none", border: "none", color: "#888", fontSize: 14, fontWeight: 700, marginTop: 18 }} onClick={() => setScreen("shop")}>
            ← Вернуться в магазин
          </button>
        </div>
      </div>
    );
    // ── Экран СБОРЩИКА ──
    if (staffRole === "picker") {
      const active = adminOrders
        .filter((o) => ["new", "accepted", "picking"].includes(o.status) && (!o.picker || o.picker === staffName))
        .sort((a, b) => {
          const ua = (a.slot || "").startsWith("Ближайшее") ? 0 : 1;
          const ub = (b.slot || "").startsWith("Ближайшее") ? 0 : 1;
          if (ua !== ub) return ua - ub;
          return new Date(a.created_at) - new Date(b.created_at);
        });
      const catOf = (i) => (allProducts.find((x) => x.id === i.id) || {}).cat || "Прочее";
      const waitMin = (o) => Math.floor((Date.now() - new Date(o.created_at)) / 60000);
      return (
        <div style={S.page}>
          <style>{FONTS}</style>
          <header style={{ background: "#1B1B18", color: "#fff" }}>
            <div style={{ ...S.wrap, display: "flex", alignItems: "center", justifyContent: "space-between", height: 60 }}>
              <div style={{ fontFamily: "'Unbounded'", fontWeight: 900, fontSize: 17 }}>🧺 СБОРКА ЗАКАЗОВ</div>
              <div style={{ display: "flex", gap: 8 }}>
                <button onClick={() => loadAdminOrders(staffPin).catch(() => {})} style={{ ...S.btn("rgba(255,255,255,.15)"), padding: "9px 14px", fontSize: 13 }}>⟳</button>
                <button onClick={() => { setStaffAuth(false); setStaffPin(""); setStaffRole(""); setStaffName(""); setScreen("shop"); }} style={{ ...S.btn("rgba(255,255,255,.15)"), padding: "9px 14px", fontSize: 13 }}>Выйти</button>
              </div>
            </div>
          </header>
          <div style={{ ...S.wrap, maxWidth: 640, paddingTop: 20, paddingBottom: 60 }}>
            <div style={{ fontSize: 13.5, color: "#888", marginBottom: 12 }}>👋 {staffName} · показаны свободные заказы и ваши</div>
            {active.length === 0 && (
              <div style={{ textAlign: "center", padding: 60, color: "#888", background: "#fff", borderRadius: 16 }}>
                <div style={{ fontSize: 40 }}>✅</div>
                <p style={{ marginTop: 10 }}>Все заказы собраны. Новые появятся здесь автоматически.</p>
              </div>
            )}
            {active.map((o) => {
              const st = pickState[o.id] || { col: {}, miss: {} };
              const allTouched = (o.items || []).every((_, idx) => st.col[idx] || st.miss[idx]);
              const urgent = o.status !== "picking" && waitMin(o) > 15;
              const groups = {};
              (o.items || []).forEach((i, idx) => { const c = catOf(i); (groups[c] = groups[c] || []).push([i, idx]); });
              return (
                <div key={o.id} style={{ background: "#fff", borderRadius: 16, padding: 18, marginBottom: 14, border: urgent ? "2px solid #C7411A" : "none" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 8 }}>
                    <div>
                      <span style={{ fontFamily: "'Unbounded'", fontWeight: 700, fontSize: 16 }}>{o.num}</span>
                      <span style={{ background: STATUS[o.status].color, color: "#fff", borderRadius: 99, padding: "4px 12px", fontSize: 12, fontWeight: 800, marginLeft: 10 }}>{STATUS[o.status].label}</span>
                    </div>
                    <span style={{ fontSize: 13, color: "#888" }}>
                      {o.time} · {o.type === "delivery" ? "🚚 " + (o.slot || "Доставка") : "🏪 Самовывоз"}
                      {urgent && <b style={{ color: "#C7411A" }}> · ждёт {waitMin(o)} мин!</b>}
                      {o.status === "picking" && o.status_log && o.status_log.picking && <> · ⏱ в сборке с {String(o.status_log.picking).slice(11)}</>}
                    </span>
                    <button onClick={() => printOrder(o)} title="Печать листа"
                      style={{ background: "#f2f1ed", border: "none", borderRadius: 10, padding: "8px 12px", fontSize: 15 }}>🖨</button>
                  </div>
                  {o.comment && <div style={{ fontSize: 13.5, color: "#7A5200", background: "#FBF1E1", borderRadius: 10, padding: "8px 12px", marginTop: 10 }}>💬 {o.comment}</div>}
                  {o.status !== "picking" ? (
                    <button onClick={() => setOrderStatus(o.id, "picking")} style={{ ...S.btn("#C77B12"), width: "100%", marginTop: 14, padding: 14 }}>
                      ▶️ Взять в сборку ({(o.items || []).length} поз.)
                    </button>
                  ) : (
                    <>
                      <div style={{ marginTop: 12 }}>
                        {Object.entries(groups).map(([g, arr]) => (
                          <div key={g}>
                            <div style={{ fontSize: 12, fontWeight: 800, color: "#999", textTransform: "uppercase", letterSpacing: 0.5, padding: "10px 0 2px" }}>{g}</div>
                            {arr.map(([i, idx]) => (
                          <div key={idx} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 0", borderBottom: "1px solid #f4f3ef", opacity: st.miss[idx] ? 0.5 : 1 }}>
                            {(() => { const pr = allProducts.find((x) => x.id === i.id); return (
                              <div style={{ width: 40, height: 40, borderRadius: 10, background: "#F6F5F2", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, overflow: "hidden", flexShrink: 0 }}>
                                {pr?.img ? <img src={pr.img} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : (pr?.emoji || i.emoji || "🛒")}
                              </div>
                            ); })()}
                            <button onClick={() => togglePickItem(o.id, idx, "col")}
                              style={{ width: 34, height: 34, borderRadius: 10, border: "none", fontSize: 17, background: st.col[idx] ? "#1E7A46" : "#f2f1ed", color: st.col[idx] ? "#fff" : "#999", flexShrink: 0 }}>✓</button>
                            <div style={{ flex: 1, fontSize: 14.5, fontWeight: 700, textDecoration: st.miss[idx] ? "line-through" : "none" }}>
                              {i.name}
                              <span style={{ color: "#C7411A", fontWeight: 800 }}> × {i.qty}</span>
                              <div style={{ fontSize: 12, color: "#999", fontWeight: 500 }}>{fmt(i.price)} / {i.unit || "шт"}</div>
                            </div>
                            <button onClick={() => togglePickItem(o.id, idx, "miss")}
                              style={{ borderRadius: 10, border: "none", fontSize: 12, fontWeight: 800, padding: "9px 10px", background: st.miss[idx] ? "#C7411A" : "#f2f1ed", color: st.miss[idx] ? "#fff" : "#999", flexShrink: 0 }}>нет</button>
                          </div>
                            ))}
                          </div>
                        ))}
                      </div>
                      <div style={{ display: "flex", justifyContent: "space-between", fontWeight: 800, fontSize: 16, marginTop: 12, padding: "10px 0", borderTop: "2px solid #f0efe9" }}>
                        <span>{(o.items || []).length} поз.</span><span>{fmt(o.total)}</span>
                      </div>
                      <button onClick={() => finishPick(o)} disabled={!allTouched}
                        style={{ ...S.btn(allTouched ? "#1E7A46" : "#ccc"), width: "100%", marginTop: 14, padding: 15 }}>
                        {allTouched ? "✅ Заказ собран" : "Отметьте все позиции (✓ или «нет»)"}
                      </button>
                    </>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      );
    }

    // ── Экран КУРЬЕРА ──
    if (staffRole === "courier") {
      const active = adminOrders
        .filter((o) => o.type === "delivery" && (
          (o.status === "picked" && (!o.courier || o.courier === staffName)) ||
          (o.status === "delivering" && o.courier === staffName)
        ))
        .sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
      return (
        <div style={S.page}>
          <style>{FONTS}</style>
          <header style={{ background: "#1B1B18", color: "#fff" }}>
            <div style={{ ...S.wrap, display: "flex", alignItems: "center", justifyContent: "space-between", height: 60 }}>
              <div style={{ fontFamily: "'Unbounded'", fontWeight: 900, fontSize: 17 }}>🛵 ДОСТАВКА</div>
              <div style={{ display: "flex", gap: 8 }}>
                <button onClick={() => loadAdminOrders(staffPin).catch(() => {})} style={{ ...S.btn("rgba(255,255,255,.15)"), padding: "9px 14px", fontSize: 13 }}>⟳</button>
                <button onClick={() => { setStaffAuth(false); setStaffPin(""); setStaffRole(""); setStaffName(""); setScreen("shop"); }} style={{ ...S.btn("rgba(255,255,255,.15)"), padding: "9px 14px", fontSize: 13 }}>Выйти</button>
              </div>
            </div>
          </header>
          <div style={{ ...S.wrap, maxWidth: 560, paddingTop: 20, paddingBottom: 60 }}>
            <div style={{ fontSize: 13.5, color: "#888", marginBottom: 12 }}>👋 {staffName} · свободные доставки и ваши</div>
            {active.length === 0 && (
              <div style={{ textAlign: "center", padding: 60, color: "#888", background: "#fff", borderRadius: 16 }}>
                <div style={{ fontSize: 40 }}>🛵</div>
                <p style={{ marginTop: 10 }}>Доставок нет. Собранные заказы появятся здесь — нажимайте ⟳.</p>
              </div>
            )}
            {active.map((o) => (
              <div key={o.id} style={{ background: "#fff", borderRadius: 16, padding: 18, marginBottom: 14 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontFamily: "'Unbounded'", fontWeight: 700, fontSize: 16 }}>{o.num}</span>
                  <span style={{ background: STATUS[o.status].color, color: "#fff", borderRadius: 99, padding: "4px 12px", fontSize: 12, fontWeight: 800 }}>{STATUS[o.status].label}</span>
                </div>
                <div style={{ fontSize: 15, marginTop: 12, lineHeight: 1.7 }}>
                  <b>📍 {o.address}</b><br />
                  {o.slot && <>🕒 <b>{o.slot}</b><br /></>}
                  👤 {o.name}{o.picker && <span style={{ color: "#999", fontSize: 13 }}> · собрал: {o.picker}</span>}
                </div>
                <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
                  <a href={"tel:+" + String(o.phone || "").replace(/\D/g, "")} style={{ ...S.btn("#1B1B18"), flex: 1, textAlign: "center", textDecoration: "none", padding: 13 }}>📞 Позвонить</a>
                  <a href={"https://2gis.kz/shymkent/search/" + encodeURIComponent(o.address || "")} target="_blank" rel="noreferrer" style={{ ...S.btn("#f2f1ed", "#1B1B18"), flex: 1, textAlign: "center", textDecoration: "none", padding: 13 }}>🗺️ Маршрут</a>
                </div>
                <div style={{ background: "#F6F5F2", borderRadius: 12, padding: "12px 14px", marginTop: 12, display: "flex", justifyContent: "space-between", fontWeight: 800, fontSize: 16 }}>
                  <span>{o.pay === "kaspi" ? "Kaspi перевод" : "💵 Наличные"}</span>
                  <span>{fmt(o.total)}</span>
                </div>
                {o.status === "picked" ? (
                  <button onClick={() => setOrderStatus(o.id, "delivering")} style={{ ...S.btn("#1E5F7A"), width: "100%", marginTop: 12, padding: 15 }}>🛵 Забрал, еду</button>
                ) : (
                  <button onClick={() => setOrderStatus(o.id, "done")} style={{ ...S.btn("#1E7A46"), width: "100%", marginTop: 12, padding: 15 }}>✅ Доставлено</button>
                )}
              </div>
            ))}
          </div>
        </div>
      );
    }

    const adminHeader = (
      <header style={{ background: "#1B1B18", color: "#fff" }}>
        <div style={{ ...S.wrap, display: "flex", alignItems: "center", justifyContent: "space-between", height: 60, flexWrap: "wrap" }}>
          <div style={{ fontFamily: "'Unbounded'", fontWeight: 900, fontSize: 18 }}>САЙМАН · админ</div>
          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={() => { setStaffAuth(false); setStaffPin(""); setStaffRole(""); setStaffName(""); setScreen("shop"); }} style={{ ...S.btn("rgba(255,255,255,.15)"), padding: "9px 14px", fontSize: 13 }}>Выйти</button>
            <button onClick={() => setScreen("shop")} style={{ ...S.btn("rgba(255,255,255,.15)"), padding: "9px 14px", fontSize: 13 }}>← В магазин</button>
          </div>
        </div>
        <div style={{ ...S.wrap, display: "flex", gap: 6, paddingBottom: 12 }}>
          {[["orders", "📦 Заказы"], ["products", "🏷️ Товары"], ["stats", "📊 Аналитика"], ["clients", "👥 Клиенты"], ["settings", "⚙️ Настройки"]].map(([k, label]) => (
            <button key={k} onClick={() => setAdminTab(k)}
              style={{ background: adminTab === k ? "#fff" : "rgba(255,255,255,.12)", color: adminTab === k ? "#1B1B18" : "#fff", border: "none", borderRadius: 10, padding: "9px 16px", fontWeight: 800, fontSize: 13.5 }}>
              {label}
            </button>
          ))}
        </div>
      </header>
    );

    // ── вкладка Клиенты ──
    if (adminTab === "clients") {
      const agg = {};
      adminOrders.forEach((o) => {
        if (!o.phone || o.status === "cancelled") return;
        const k = o.phone;
        agg[k] = agg[k] || { phone: k, name: o.name, n: 0, sum: 0, last: "" };
        agg[k].n++; agg[k].sum += o.total;
        if (!agg[k].last) agg[k].last = o.date + " " + o.time;
        if (o.name) agg[k].name = agg[k].name || o.name;
      });
      const clients = Object.values(agg).sort((a, b) => b.sum - a.sum);
      return (
        <div style={S.page}>
          <style>{FONTS}</style>
          {adminHeader}
          <div style={{ ...S.wrap, maxWidth: 680, paddingTop: 20, paddingBottom: 60 }}>
            <div style={{ fontSize: 13.5, color: "#888", marginBottom: 14 }}>
              База собирается автоматически из заказов. Постоянные клиенты сверху — им можно предложить скидку или сообщить об акции.
            </div>
            {clients.length === 0 && (
              <div style={{ textAlign: "center", padding: 50, color: "#888", background: "#fff", borderRadius: 16 }}>👥 Клиенты появятся после первых заказов</div>
            )}
            {clients.map((c) => (
              <div key={c.phone} style={{ background: "#fff", borderRadius: 14, padding: "14px 16px", marginBottom: 8, display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
                <div style={{ flex: "1 1 150px" }}>
                  <div style={{ fontWeight: 800, fontSize: 15 }}>{c.name || "Без имени"} {c.n > 1 && <span style={{ background: "#E7F4EC", color: "#1E7A46", borderRadius: 99, fontSize: 11, fontWeight: 800, padding: "2px 8px", marginLeft: 6 }}>постоянный</span>}</div>
                  <div style={{ fontSize: 13, color: "#888", marginTop: 2 }}>{c.phone} · последний: {c.last}</div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontWeight: 800 }}>{fmt(c.sum)}</div>
                  <div style={{ fontSize: 12.5, color: "#888" }}>{c.n} заказ(ов)</div>
                </div>
                <a href={"https://wa.me/" + String(c.phone).replace(/\D/g, "")} target="_blank" rel="noreferrer"
                  style={{ background: "#25D366", color: "#fff", borderRadius: 10, padding: "9px 12px", fontSize: 14, textDecoration: "none", fontWeight: 800 }}>💬</a>
              </div>
            ))}
          </div>
        </div>
      );
    }

    // ── вкладка Настройки ──
    if (adminTab === "settings") {
      const inp = { padding: "11px 13px", borderRadius: 12, border: "1.5px solid #ddd", fontSize: 15, background: "#fff", width: "100%", marginTop: 6 };
      const lbl = { fontWeight: 700, fontSize: 13.5, display: "block", marginTop: 14 };
      const saveSettings = () => {
        rpc("admin_set_settings", { _pin: staffPin, _s: settings }).then(() => alert("Настройки сохранены — уже действуют для всех клиентов")).catch(dbFail);
      };
      const savePins = () => {
        if (!pinsDraft.a) return alert("Введите новый PIN админа");
        rpc("admin_set_pins", { _pin: staffPin, _admin: pinsDraft.a, _picker: pinsDraft.p, _courier: pinsDraft.c })
          .then(() => { alert("PIN-коды обновлены. Запишите их! При следующем входе действуют новые."); if (pinsDraft.a) setStaffPin(pinsDraft.a); setPinsDraft({ a: "", p: "", c: "" }); })
          .catch(dbFail);
      };
      return (
        <div style={S.page}>
          <style>{FONTS}</style>
          {adminHeader}
          <div style={{ ...S.wrap, maxWidth: 560, paddingTop: 20, paddingBottom: 60 }}>
            <div style={{ background: "#fff", borderRadius: 16, padding: 18 }}>
              <div style={{ fontWeight: 800, fontSize: 16 }}>Доставка и режим работы</div>
              <label style={lbl}>Стоимость доставки, ₸</label>
              <input style={inp} type="number" value={settings.delivery_fee} onChange={(e) => setSettings({ ...settings, delivery_fee: Number(e.target.value) || 0 })} />
              <label style={lbl}>Бесплатная доставка от, ₸</label>
              <input style={inp} type="number" value={settings.free_from} onChange={(e) => setSettings({ ...settings, free_from: Number(e.target.value) || 0 })} />
              <label style={lbl}>Минимальная сумма заказа, ₸ (0 — без ограничения)</label>
              <input style={inp} type="number" value={settings.min_order} onChange={(e) => setSettings({ ...settings, min_order: Number(e.target.value) || 0 })} />
              <label style={lbl}>Часы работы (текст)</label>
              <input style={inp} value={settings.hours} onChange={(e) => setSettings({ ...settings, hours: e.target.value })} />
              <label style={{ ...lbl, display: "flex", alignItems: "center", gap: 10, cursor: "pointer" }}>
                <input type="checkbox" checked={settings.shop_open} onChange={(e) => setSettings({ ...settings, shop_open: e.target.checked })} style={{ width: 20, height: 20, accentColor: "#1E7A46" }} />
                Магазин открыт (снимите на ночь/выходной — клиенты увидят предупреждение)
              </label>
              <div style={{ fontWeight: 800, fontSize: 15, marginTop: 20 }}>Зоны доставки и тарифы</div>
              <p style={{ fontSize: 12.5, color: "#999", marginTop: 2 }}>Клиент выбирает свой район при оформлении — доставка считается по тарифу зоны (бесплатная от порога действует для всех зон)</p>
              {(Array.isArray(settings.zones) ? settings.zones : []).map((z, i) => (
                <div key={i} style={{ display: "flex", gap: 8, marginTop: 8 }}>
                  <input style={{ ...inp, marginTop: 0, flex: 2 }} value={z.name} placeholder="Название зоны"
                    onChange={(e) => { const zs = [...settings.zones]; zs[i] = { ...zs[i], name: e.target.value }; setSettings({ ...settings, zones: zs }); }} />
                  <input style={{ ...inp, marginTop: 0, width: 110 }} type="number" value={z.fee} placeholder="₸"
                    onChange={(e) => { const zs = [...settings.zones]; zs[i] = { ...zs[i], fee: Number(e.target.value) || 0 }; setSettings({ ...settings, zones: zs }); }} />
                  <button onClick={() => setSettings({ ...settings, zones: settings.zones.filter((_, j) => j !== i) })}
                    style={{ background: "#FBE9E4", color: "#C7411A", border: "none", borderRadius: 10, padding: "0 13px", fontWeight: 800 }}>✕</button>
                </div>
              ))}
              {(!settings.zones || settings.zones.length < 6) && (
                <button onClick={() => setSettings({ ...settings, zones: [...(settings.zones || []), { name: "", fee: 700 }] })}
                  style={{ ...S.btn("#f2f1ed", "#444"), marginTop: 10, padding: "10px 16px", fontSize: 13.5 }}>➕ Добавить зону</button>
              )}
              <button onClick={saveSettings} style={{ ...S.btn("#1E7A46"), width: "100%", marginTop: 16, padding: 14 }}>Сохранить настройки</button>
            </div>

            <div style={{ background: "#fff", borderRadius: 16, padding: 18, marginTop: 16 }}>
              <div style={{ fontWeight: 800, fontSize: 16 }}>PIN админа</div>
              <label style={lbl}>Новый PIN админа (пусто — без изменений)</label>
              <input style={inp} value={pinsDraft.a} onChange={(e) => setPinsDraft({ ...pinsDraft, a: e.target.value.trim() })} placeholder="например 4815" />
              <button onClick={savePins} style={{ ...S.btn("#1B1B18"), width: "100%", marginTop: 16, padding: 14 }}>Сменить PIN админа</button>
            </div>

            <div style={{ background: "#fff", borderRadius: 16, padding: 18, marginTop: 16 }}>
              <div style={{ fontWeight: 800, fontSize: 16 }}>👥 Команда: сборщики и курьеры</div>
              <p style={{ fontSize: 12.5, color: "#999", marginTop: 4 }}>У каждого сотрудника своё имя и PIN. Сборщик видит только свободные заказы и свои; заказ, взятый одним, закрыт для других. В карточке заказа видно, кто собрал и кто доставил.</p>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 12 }}>
                <input style={{ ...inp, marginTop: 0, flex: "2 1 130px" }} placeholder="Имя" value={staffDraft.name}
                  onChange={(e) => setStaffDraft({ ...staffDraft, name: e.target.value })} />
                <select style={{ ...inp, marginTop: 0, width: 130 }} value={staffDraft.role} onChange={(e) => setStaffDraft({ ...staffDraft, role: e.target.value })}>
                  <option value="picker">🧺 Сборщик</option>
                  <option value="courier">🛵 Курьер</option>
                </select>
                <input style={{ ...inp, marginTop: 0, width: 110 }} placeholder="PIN" value={staffDraft.pin}
                  onChange={(e) => setStaffDraft({ ...staffDraft, pin: e.target.value.trim() })} />
                <button style={{ ...S.btn("#1E7A46"), padding: "11px 16px", fontSize: 14 }}
                  onClick={() => {
                    if (!staffDraft.name.trim() || staffDraft.pin.length < 4) return alert("Укажите имя и PIN (минимум 4 цифры)");
                    rpc("admin_upsert_staff", { _pin: staffPin, _s: staffDraft })
                      .then(() => rpc("admin_get_staff", { _pin: staffPin }).then(setStaffList))
                      .then(() => setStaffDraft({ name: "", role: "picker", pin: "" }))
                      .catch(() => alert("Не сохранилось. Возможно, такой PIN уже занят."));
                  }}>Добавить</button>
              </div>
              {staffList.map((s) => (
                <div key={s.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 0", borderBottom: "1px solid #f4f3ef", flexWrap: "wrap", opacity: s.active ? 1 : 0.5 }}>
                  <span style={{ fontSize: 17 }}>{s.role === "picker" ? "🧺" : "🛵"}</span>
                  <b style={{ fontSize: 14.5 }}>{s.name}</b>
                  <span style={{ fontSize: 13, color: "#888" }}>PIN: {s.pin}</span>
                  <label style={{ marginLeft: "auto", fontSize: 12.5, fontWeight: 700, display: "flex", alignItems: "center", gap: 6, cursor: "pointer" }}>
                    <input type="checkbox" checked={s.active}
                      onChange={(e) => rpc("admin_upsert_staff", { _pin: staffPin, _s: { ...s, active: e.target.checked } })
                        .then(() => setStaffList(staffList.map((x) => x.id === s.id ? { ...x, active: e.target.checked } : x)))
                        .catch(dbFail)}
                      style={{ width: 17, height: 17, accentColor: "#1E7A46" }} />
                    работает
                  </label>
                  <button onClick={() => {
                    if (!window.confirm("Удалить " + s.name + " из команды?")) return;
                    rpc("admin_delete_staff", { _pin: staffPin, _id: s.id })
                      .then(() => setStaffList(staffList.filter((x) => x.id !== s.id))).catch(dbFail);
                  }} style={{ background: "#FBE9E4", border: "none", borderRadius: 8, padding: "7px 10px", fontSize: 13 }}>🗑️</button>
                </div>
              ))}
            </div>

            <div style={{ background: "#fff", borderRadius: 16, padding: 18, marginTop: 16 }}>
              <div style={{ fontWeight: 800, fontSize: 16 }}>🎟 Промокоды</div>
              <p style={{ fontSize: 12.5, color: "#999", marginTop: 4 }}>Клиент вводит код при оформлении. Примеры: САЙМАН10 (скидка 10%), ПЕРВЫЙ500 (−500 ₸ на первый заказ, лимит использований).</p>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 12 }}>
                <input style={{ ...inp, marginTop: 0, flex: "1 1 110px", textTransform: "uppercase" }} placeholder="КОД" value={promoDraft.code}
                  onChange={(e) => setPromoDraft({ ...promoDraft, code: e.target.value })} />
                <select style={{ ...inp, marginTop: 0, width: 92 }} value={promoDraft.kind} onChange={(e) => setPromoDraft({ ...promoDraft, kind: e.target.value })}>
                  <option value="percent">%</option>
                  <option value="fixed">₸</option>
                </select>
                <input style={{ ...inp, marginTop: 0, width: 92 }} type="number" placeholder={promoDraft.kind === "percent" ? "10" : "500"} value={promoDraft.value}
                  onChange={(e) => setPromoDraft({ ...promoDraft, value: e.target.value })} />
                <input style={{ ...inp, marginTop: 0, width: 120 }} type="number" placeholder="Мин. сумма" value={promoDraft.min_total}
                  onChange={(e) => setPromoDraft({ ...promoDraft, min_total: e.target.value })} />
                <button style={{ ...S.btn("#1E7A46"), padding: "11px 16px", fontSize: 14 }}
                  onClick={() => {
                    if (!promoDraft.code.trim() || !Number(promoDraft.value)) return alert("Укажите код и размер скидки");
                    const p = { code: promoDraft.code, kind: promoDraft.kind, value: Number(promoDraft.value), min_total: Number(promoDraft.min_total) || 0, active: true };
                    rpc("admin_upsert_promo", { _pin: staffPin, _p: p })
                      .then(() => rpc("admin_get_promos", { _pin: staffPin }).then(setPromos))
                      .then(() => setPromoDraft({ code: "", kind: "percent", value: "", min_total: "" }))
                      .catch(dbFail);
                  }}>Создать</button>
              </div>
              {promos.map((p) => (
                <div key={p.code} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 0", borderBottom: "1px solid #f4f3ef", flexWrap: "wrap" }}>
                  <b style={{ fontSize: 15 }}>{p.code}</b>
                  <span style={{ fontSize: 13, color: "#777" }}>
                    −{p.kind === "percent" ? p.value + "%" : fmt(p.value)}{p.min_total > 0 ? " от " + fmt(p.min_total) : ""} · использован: {p.uses}
                  </span>
                  <label style={{ marginLeft: "auto", fontSize: 12.5, fontWeight: 700, display: "flex", alignItems: "center", gap: 6, cursor: "pointer" }}>
                    <input type="checkbox" checked={p.active}
                      onChange={(e) => {
                        rpc("admin_upsert_promo", { _pin: staffPin, _p: { ...p, active: e.target.checked } })
                          .then(() => setPromos(promos.map((x) => x.code === p.code ? { ...x, active: e.target.checked } : x)))
                          .catch(dbFail);
                      }} style={{ width: 17, height: 17, accentColor: "#1E7A46" }} />
                    активен
                  </label>
                  <button onClick={() => {
                    if (!window.confirm("Удалить промокод " + p.code + "?")) return;
                    rpc("admin_delete_promo", { _pin: staffPin, _code: p.code })
                      .then(() => setPromos(promos.filter((x) => x.code !== p.code))).catch(dbFail);
                  }} style={{ background: "#FBE9E4", border: "none", borderRadius: 8, padding: "7px 10px", fontSize: 13 }}>🗑️</button>
                </div>
              ))}
            </div>
          </div>
        </div>
      );
    }

    // ── вкладка Аналитика ──
    if (adminTab === "stats") {
      const now = new Date();
      const dayKey = (d) => d.toLocaleDateString("ru-RU");
      const days = [...Array(14)].map((_, i) => { const d = new Date(now); d.setDate(d.getDate() - (13 - i)); return dayKey(d); });
      const byDay = Object.fromEntries(days.map((d) => [d, { n: 0, sum: 0 }]));
      const prodAgg = {}; const phoneAgg = {};
      adminOrders.forEach((o) => {
        if (byDay[o.date]) { byDay[o.date].n++; byDay[o.date].sum += o.total; }
        (o.items || []).forEach((i) => { prodAgg[i.name] = prodAgg[i.name] || { qty: 0, sum: 0 }; prodAgg[i.name].qty += i.qty; prodAgg[i.name].sum += i.qty * i.price; });
        if (o.phone) phoneAgg[o.phone] = (phoneAgg[o.phone] || 0) + 1;
      });
      const totalSum = adminOrders.reduce((s, o) => s + o.total, 0);
      const avg = adminOrders.length ? Math.round(totalSum / adminOrders.length) : 0;
      const phones = Object.values(phoneAgg);
      const repeat = phones.length ? Math.round(phones.filter((n) => n > 1).length / phones.length * 100) : 0;
      const top = Object.entries(prodAgg).sort((a, b) => b[1].sum - a[1].sum).slice(0, 10);
      const maxDay = Math.max(1, ...Object.values(byDay).map((d) => d.sum));
      const card = { background: "#fff", borderRadius: 16, padding: 18, marginBottom: 14 };
      return (
        <div style={S.page}>
          <style>{FONTS}</style>
          {adminHeader}
          <div style={{ ...S.wrap, maxWidth: 720, paddingTop: 20, paddingBottom: 60 }}>
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 14 }}>
              {[["Заказов всего", adminOrders.length], ["Выручка всего", fmt(totalSum)], ["Средний чек", fmt(avg)], ["Повторные клиенты", repeat + "%"]].map(([l, v]) => (
                <div key={l} style={{ ...card, flex: "1 1 140px", marginBottom: 0 }}>
                  <div style={{ fontSize: 11.5, color: "#999", fontWeight: 800, textTransform: "uppercase" }}>{l}</div>
                  <div style={{ fontFamily: "'Unbounded'", fontSize: 20, fontWeight: 700, marginTop: 4 }}>{v}</div>
                </div>
              ))}
            </div>
            <div style={card}>
              <div style={{ fontWeight: 800, marginBottom: 12 }}>Выручка за 14 дней</div>
              {days.map((d) => (
                <div key={d} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 5 }}>
                  <span style={{ fontSize: 11.5, color: "#999", width: 66, flexShrink: 0 }}>{d.slice(0, 5)}</span>
                  <div style={{ flex: 1, background: "#f2f1ed", borderRadius: 6, height: 18, overflow: "hidden" }}>
                    <div style={{ width: (byDay[d].sum / maxDay * 100) + "%", background: "#1E7A46", height: "100%", borderRadius: 6, transition: "width .4s" }} />
                  </div>
                  <span style={{ fontSize: 12, fontWeight: 700, width: 100, textAlign: "right", flexShrink: 0 }}>{byDay[d].n ? byDay[d].n + " · " + fmt(byDay[d].sum) : "—"}</span>
                </div>
              ))}
            </div>
            <div style={card}>
              <div style={{ fontWeight: 800, marginBottom: 12 }}>Топ-10 товаров по выручке</div>
              {top.length === 0 && <div style={{ color: "#999", fontSize: 14 }}>Пока нет данных — появятся после первых заказов</div>}
              {top.map(([name, d], i) => (
                <div key={name} style={{ display: "flex", justifyContent: "space-between", padding: "7px 0", borderBottom: "1px solid #f4f3ef", fontSize: 14 }}>
                  <span><b style={{ color: "#999", marginRight: 8 }}>{i + 1}.</b>{name} <span style={{ color: "#999" }}>× {d.qty}</span></span>
                  <b>{fmt(d.sum)}</b>
                </div>
              ))}
            </div>
            <div style={card}>
              <div style={{ fontWeight: 800, marginBottom: 4 }}>Работа команды (для сдельной оплаты)</div>
              <p style={{ fontSize: 12.5, color: "#999", marginBottom: 10 }}>Сколько заказов закрыл каждый сотрудник. Умножьте на ставку — получите сумму к выплате.</p>
              {(() => {
                const pick = {}; const cour = {};
                adminOrders.forEach((o) => {
                  if (o.status === "cancelled") return;
                  if (o.picker && ["picked", "delivering", "done"].includes(o.status)) {
                    pick[o.picker] = pick[o.picker] || { n: 0, sum: 0 };
                    pick[o.picker].n++; pick[o.picker].sum += o.total;
                  }
                  if (o.courier && o.status === "done") {
                    cour[o.courier] = cour[o.courier] || { n: 0, sum: 0 };
                    cour[o.courier].n++; cour[o.courier].sum += o.total;
                  }
                });
                const rows = [
                  ...Object.entries(pick).map(([n, d]) => ["🧺 " + n, d, "собрано"]),
                  ...Object.entries(cour).map(([n, d]) => ["🛵 " + n, d, "доставлено"]),
                ];
                if (!rows.length) return <div style={{ color: "#999", fontSize: 14 }}>Появится, когда команда начнёт закрывать заказы</div>;
                return rows.map(([name, d, verb]) => (
                  <div key={name + verb} style={{ display: "flex", justifyContent: "space-between", padding: "7px 0", borderBottom: "1px solid #f4f3ef", fontSize: 14 }}>
                    <span><b>{name}</b> · {verb}: {d.n}</span>
                    <span style={{ color: "#888" }}>оборот {fmt(d.sum)}</span>
                  </div>
                ));
              })()}
            </div>
            <div style={card}>
              <div style={{ fontWeight: 800, marginBottom: 12 }}>Заказы по районам (доставка)</div>
              {(() => {
                const zi = {};
                adminOrders.forEach((o) => {
                  if (o.type !== "delivery" || o.status === "cancelled") return;
                  const k = o.zone || "Без района";
                  zi[k] = zi[k] || { n: 0, sum: 0 };
                  zi[k].n++; zi[k].sum += o.total;
                });
                const zlist = Object.entries(zi).sort((a, b) => b[1].sum - a[1].sum);
                if (!zlist.length) return <div style={{ color: "#999", fontSize: 14 }}>Появится после первых доставок — покажет, из каких районов идёт спрос</div>;
                const zmax = Math.max(...zlist.map(([, d]) => d.sum), 1);
                return zlist.map(([z, d]) => (
                  <div key={z} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                    <span style={{ fontSize: 13, fontWeight: 700, width: 130, flexShrink: 0 }}>{z}</span>
                    <div style={{ flex: 1, background: "#f2f1ed", borderRadius: 6, height: 18, overflow: "hidden" }}>
                      <div style={{ width: (d.sum / zmax * 100) + "%", background: "#C77B12", height: "100%", borderRadius: 6 }} />
                    </div>
                    <span style={{ fontSize: 12.5, fontWeight: 700, width: 110, textAlign: "right", flexShrink: 0 }}>{d.n} · {fmt(d.sum)}</span>
                  </div>
                ));
              })()}
            </div>
            <button onClick={exportCSV} style={{ ...S.btn("#1B1B18"), width: "100%", padding: 15 }}>
              ⬇️ Выгрузить все заказы в Excel (CSV)
            </button>
            <p style={{ fontSize: 12.5, color: "#999", marginTop: 8, textAlign: "center" }}>Файл откроется в Excel — для учёта, сверки кассы и налогов</p>
          </div>
        </div>
      );
    }

    // ── вкладка Товары и цены (CRM) ──
    if (adminTab === "products") {
      const inp = { padding: "8px 10px", borderRadius: 10, border: "1.5px solid #ddd", fontSize: 14, background: "#fff" };
      const secTheme = THEMES[adminSection];
      const sectionCats = [...new Set(productsData[adminSection].map((p) => p.cat))].filter(Boolean);
      return (
        <div style={S.page}>
          <style>{FONTS}</style>
          {adminHeader}
          <div style={{ ...S.wrap, maxWidth: 760, paddingTop: 20, paddingBottom: 60 }}>
            <div style={{ display: "flex", gap: 8, marginBottom: 14, alignItems: "center", flexWrap: "wrap" }}>
              {[["food", "🥖 Продукты"], ["build", "🧱 Стройматериалы"]].map(([k, label]) => (
                <button key={k} onClick={() => { setAdminSection(k); setNewProd(null); }}
                  style={{ padding: "10px 18px", borderRadius: 12, border: "none", fontWeight: 800, fontSize: 14, background: adminSection === k ? THEMES[k].accent : "#fff", color: adminSection === k ? "#fff" : "#444" }}>
                  {label} ({productsData[k].length})
                </button>
              ))}
              <label style={{ ...S.btn("#f2f1ed", "#444"), padding: "10px 16px", fontSize: 13.5, marginLeft: "auto", cursor: "pointer" }} title="Файл CSV: Название;Категория;Цена;Ед;Эмодзи (первая строка — заголовок)">
                📄 Импорт CSV
                <input type="file" accept=".csv,text/csv" style={{ display: "none" }}
                  onChange={(e) => {
                    const f = e.target.files[0]; if (!f) return;
                    const reader = new FileReader();
                    reader.onload = () => {
                      const text = String(reader.result);
                      const lines = text.split(/\r?\n/).filter((l) => l.trim());
                      const delim = (lines[0] || "").includes(";") ? ";" : ",";
                      let rows = lines.map((l) => l.split(delim).map((c) => c.trim().replace(/^"|"$/g, "")));
                      if (rows[0] && isNaN(Number(rows[0][2]))) rows = rows.slice(1);
                      const good = rows.filter((r) => r[0] && Number(r[2]) > 0);
                      if (!good.length) return alert("Не удалось прочитать файл. Формат: Название;Категория;Цена;Ед;Эмодзи");
                      if (!window.confirm("Добавить " + good.length + " товар(ов) в раздел «" + secTheme.label + "»?")) return;
                      const items = good.map((r, i) => ({ id: adminSection[0] + Date.now() + "i" + i, name: r[0], cat: r[1] || "Разное", price: Number(r[2]), unit: r[3] || "шт", emoji: r[4] || "🛒" }));
                      Promise.all(items.map((p) => rpc("admin_upsert_product", { _pin: staffPin, _p: productToRow(adminSection, p) })))
                        .then(() => { setProductsData((prev) => ({ ...prev, [adminSection]: [...items, ...prev[adminSection]] })); alert("Импортировано: " + items.length); })
                        .catch(() => alert("Часть товаров могла не сохраниться — обновите страницу и проверьте"));
                    };
                    reader.readAsText(f, "utf-8");
                    e.target.value = "";
                  }} />
              </label>
              <button onClick={() => setNewProd({ name: "", cat: "", price: "", unit: "шт", emoji: "🛒" })}
                style={{ ...S.btn("#1B1B18"), padding: "10px 18px", fontSize: 14 }}>
                + Добавить товар
              </button>
            </div>

            {newProd && (
              <div style={{ background: "#fff", borderRadius: 16, padding: 16, marginBottom: 14, border: `2px solid ${secTheme.accent}` }}>
                <div style={{ fontWeight: 800, marginBottom: 10 }}>Новый товар → {secTheme.label}</div>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  <input style={{ ...inp, flex: "2 1 180px" }} placeholder="Название" value={newProd.name} onChange={(e) => setNewProd({ ...newProd, name: e.target.value })} />
                  <select style={{ ...inp, flex: "1 1 150px" }} value={newProd.catNew ? "__new__" : newProd.cat}
                    onChange={(e) => e.target.value === "__new__"
                      ? setNewProd({ ...newProd, cat: "", catNew: true })
                      : setNewProd({ ...newProd, cat: e.target.value, catNew: false })}>
                    <option value="">— выберите отдел —</option>
                    {sectionCats.map((c) => <option key={c} value={c}>{c}</option>)}
                    <option value="__new__">➕ Новая категория…</option>
                  </select>
                  {newProd.catNew && (
                    <input style={{ ...inp, flex: "1 1 150px" }} placeholder="Название новой категории" autoFocus
                      value={newProd.cat} onChange={(e) => setNewProd({ ...newProd, cat: e.target.value })} />
                  )}
                  <input style={{ ...inp, width: 100 }} type="number" placeholder="Цена ₸" value={newProd.price} onChange={(e) => setNewProd({ ...newProd, price: e.target.value })} />
                  <input style={{ ...inp, width: 70 }} placeholder="ед." value={newProd.unit} onChange={(e) => setNewProd({ ...newProd, unit: e.target.value })} />
                  <input style={{ ...inp, width: 60 }} placeholder="🛒" value={newProd.emoji} onChange={(e) => setNewProd({ ...newProd, emoji: e.target.value })} />
                </div>
                <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
                  <button style={{ ...S.btn(secTheme.accent), padding: "10px 18px", fontSize: 14 }}
                    onClick={() => {
                      if (!newProd.name.trim() || !Number(newProd.price)) return alert("Укажите название и цену");
                      if (!newProd.cat.trim()) return alert("Выберите отдел (категорию) или создайте новый");
                      addProduct(adminSection, { name: newProd.name.trim(), cat: newProd.cat.trim() || "Разное", price: Number(newProd.price), unit: newProd.unit || "шт", emoji: newProd.emoji || "🛒" });
                      setNewProd(null);
                    }}>Сохранить</button>
                  <button style={{ ...S.btn("#f2f1ed", "#444"), padding: "10px 18px", fontSize: 14 }} onClick={() => setNewProd(null)}>Отмена</button>
                </div>
              </div>
            )}

            <div style={{ fontSize: 13, color: "#888", marginBottom: 12 }}>
              💡 Цены сохраняются автоматически при выходе из поля. Нажмите 📷 чтобы загрузить фото товара с устройства (сожмётся автоматически). «Стар. цена» — если заполнена, товар показывается как акция со скидкой.
            </div>

            <input value={prodSearch} onChange={(e) => setProdSearch(e.target.value)} placeholder="Поиск товара по названию или категории…"
              style={{ width: "100%", padding: "12px 14px", borderRadius: 12, border: "1.5px solid #e2e0da", fontSize: 14.5, background: "#fff", marginBottom: 12 }} />
            <datalist id="sayman-cats">{sectionCats.map((c) => <option key={c} value={c} />)}</datalist>
            {productsData[adminSection].filter((p) =>
              (p.name + " " + p.cat).toLowerCase().includes(prodSearch.toLowerCase().trim())
            ).map((p) => (
              <div key={p.id} style={{ background: "#fff", borderRadius: 14, padding: "10px 14px", marginBottom: 8, display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap", opacity: p.available === false ? 0.55 : 1 }}>
                <label style={{ width: 52, height: 52, borderRadius: 10, background: secTheme.accentSoft, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 26, cursor: "pointer", overflow: "hidden", flexShrink: 0 }} title="Нажмите, чтобы загрузить фото">
                  {p.img ? <img src={p.img} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : p.emoji}
                  <input type="file" accept="image/*" style={{ display: "none" }} onChange={(e) => uploadPhoto(adminSection, p.id, e.target.files[0])} />
                </label>
                <div style={{ flex: "1 1 160px", minWidth: 140 }}>
                  <input key={p.id + p.name} defaultValue={p.name} onBlur={(e) => e.target.value.trim() && updateProduct(adminSection, p.id, { name: e.target.value.trim() })}
                    style={{ ...inp, width: "100%", fontWeight: 700, border: "1.5px solid transparent", padding: "6px 8px" }} />
                  <div style={{ display: "flex", alignItems: "center", gap: 4, paddingLeft: 4 }}>
                    <input key={p.id + "-cat" + p.cat} defaultValue={p.cat} list="sayman-cats"
                      onBlur={(e) => e.target.value.trim() && e.target.value.trim() !== p.cat && updateProduct(adminSection, p.id, { cat: e.target.value.trim() })}
                      title="Категория товара — можно переименовать"
                      style={{ fontSize: 11.5, color: "#999", border: "1px solid transparent", borderRadius: 6, padding: "2px 4px", width: 130, background: "transparent" }} />
                    <span style={{ fontSize: 11.5, color: "#bbb" }}>· {p.unit}</span>
                  </div>
                </div>
                <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                  <div>
                    <div style={{ fontSize: 10.5, color: "#999", fontWeight: 700 }}>ЦЕНА ₸</div>
                    <input key={p.id + "-p" + p.price} type="number" defaultValue={p.price}
                      onBlur={(e) => Number(e.target.value) > 0 && updateProduct(adminSection, p.id, { price: Number(e.target.value) })}
                      style={{ ...inp, width: 90, fontWeight: 800 }} />
                  </div>
                  <div>
                    <div style={{ fontSize: 10.5, color: "#999", fontWeight: 700 }}>ОСТАТОК</div>
                    <input key={p.id + "-s" + (p.stock ?? "")} type="number" defaultValue={p.stock ?? ""}
                      onBlur={(e) => updateProduct(adminSection, p.id, { stock: e.target.value === "" ? null : Math.max(0, Number(e.target.value)) })}
                      style={{ ...inp, width: 76 }} placeholder="∞" title="Пусто — не отслеживать остаток" />
                  </div>
                  <div>
                    <div style={{ fontSize: 10.5, color: "#999", fontWeight: 700 }}>СТАР. ЦЕНА</div>
                    <input key={p.id + "-o" + (p.oldPrice || "")} type="number" defaultValue={p.oldPrice || ""}
                      onBlur={(e) => updateProduct(adminSection, p.id, { oldPrice: Number(e.target.value) > 0 ? Number(e.target.value) : undefined })}
                      style={{ ...inp, width: 90 }} placeholder="—" />
                  </div>
                  <label style={{ fontSize: 12, fontWeight: 800, display: "flex", flexDirection: "column", alignItems: "center", gap: 3, cursor: "pointer" }}>
                    <span style={{ color: "#999", fontSize: 10.5 }}>ХИТ</span>
                    <input type="checkbox" checked={!!p.hit} onChange={(e) => updateProduct(adminSection, p.id, { hit: e.target.checked || undefined })} style={{ width: 18, height: 18 }} />
                  </label>
                  <label style={{ fontSize: 12, fontWeight: 800, display: "flex", flexDirection: "column", alignItems: "center", gap: 3, cursor: "pointer" }}>
                    <span style={{ color: "#999", fontSize: 10.5 }}>ЕСТЬ</span>
                    <input type="checkbox" checked={p.available !== false} onChange={(e) => updateProduct(adminSection, p.id, { available: e.target.checked })} style={{ width: 18, height: 18, accentColor: "#1E7A46" }} />
                  </label>
                  {p.img && (
                    <button onClick={() => updateProduct(adminSection, p.id, { img: undefined })} title="Убрать фото"
                      style={{ background: "#f2f1ed", border: "none", borderRadius: 8, padding: "8px 9px", fontSize: 13 }}>🖼️✕</button>
                  )}
                  <button onClick={() => addProduct(adminSection, { cat: p.cat, name: p.name + " (копия)", unit: p.unit, price: p.price, emoji: p.emoji, img: p.img })} title="Дублировать товар"
                    style={{ background: "#f2f1ed", border: "none", borderRadius: 8, padding: "8px 10px", fontSize: 13 }}>📋</button>
                  <button onClick={() => deleteProduct(adminSection, p.id)} title="Удалить товар"
                    style={{ background: "#FBE9E4", border: "none", borderRadius: 8, padding: "8px 10px", fontSize: 14 }}>🗑️</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      );
    }

    // ── вкладка Заказы ──
    return (
    <div style={S.page}>
      <style>{FONTS}</style>
      {adminHeader}
      <div style={{ ...S.wrap, maxWidth: 720, paddingTop: 24, paddingBottom: 60 }}>
        {(() => {
          const today = new Date().toLocaleDateString("ru-RU");
          const yd = new Date(); yd.setDate(yd.getDate() - 1);
          const yesterday = yd.toLocaleDateString("ru-RU");
          const todayOrders = adminOrders.filter((o) => o.date === today && o.status !== "cancelled");
          const todayRevenue = todayOrders.reduce((s, o) => s + o.total, 0);
          const ydRevenue = adminOrders.filter((o) => o.date === yesterday && o.status !== "cancelled").reduce((s, o) => s + o.total, 0);
          const stuck = adminOrders.filter((o) => ["new", "accepted"].includes(o.status) && (Date.now() - new Date(o.created_at)) > 15 * 60000).length;
          return (
            <div style={{ background: "#1B1B18", color: "#fff", borderRadius: 16, padding: "16px 20px", marginBottom: 16, display: "flex", gap: 28, flexWrap: "wrap" }}>
              <div>
                <div style={{ fontSize: 12, opacity: 0.6, fontWeight: 700 }}>СЕГОДНЯ ЗАКАЗОВ</div>
                <div style={{ fontFamily: "'Unbounded'", fontSize: 24, fontWeight: 700 }}>{todayOrders.length}</div>
              </div>
              <div>
                <div style={{ fontSize: 12, opacity: 0.6, fontWeight: 700 }}>СУММА ЗА ДЕНЬ</div>
                <div style={{ fontFamily: "'Unbounded'", fontSize: 24, fontWeight: 700 }}>{fmt(todayRevenue)}</div>
                <div style={{ fontSize: 11.5, opacity: 0.55 }}>вчера: {fmt(ydRevenue)}</div>
              </div>
              {stuck > 0 && (
                <div>
                  <div style={{ fontSize: 12, color: "#FF8A70", fontWeight: 800 }}>⚠ ЖДУТ &gt;15 МИН</div>
                  <div style={{ fontFamily: "'Unbounded'", fontSize: 24, fontWeight: 700, color: "#FF8A70" }}>{stuck}</div>
                </div>
              )}
              <div>
                <div style={{ fontSize: 12, opacity: 0.6, fontWeight: 700 }}>ВСЕГО ЗАКАЗОВ</div>
                <div style={{ fontFamily: "'Unbounded'", fontSize: 24, fontWeight: 700 }}>{adminOrders.length}</div>
              </div>
              <button onClick={() => loadAdminOrders(staffPin).catch(() => {})} style={{ marginLeft: "auto", alignSelf: "center", background: "rgba(255,255,255,.15)", color: "#fff", border: "none", borderRadius: 10, padding: "10px 16px", fontWeight: 700, fontSize: 13 }}>⟳ Обновить</button>
            </div>
          );
        })()}
        <input value={orderSearch} onChange={(e) => setOrderSearch(e.target.value)} placeholder="Поиск: номер заказа, телефон или имя…"
          style={{ width: "100%", padding: "13px 15px", borderRadius: 12, border: "1.5px solid #e2e0da", fontSize: 14.5, background: "#fff", marginBottom: 12 }} />
        <div style={{ display: "flex", gap: 8, marginBottom: 10, flexWrap: "wrap" }}>
          {[["all", "За всё время"], ["today", "Сегодня"], ["7", "7 дней"]].map(([k, label]) => (
            <button key={k} onClick={() => setOrderDays(k)}
              style={{ background: orderDays === k ? "#1B1B18" : "#fff", color: orderDays === k ? "#fff" : "#666", border: "none", borderRadius: 12, padding: "8px 13px", fontSize: 12.5, fontWeight: 700 }}>
              {label}
            </button>
          ))}
        </div>
        <div style={{ display: "flex", gap: 8, marginBottom: 18, flexWrap: "wrap" }}>
          <button onClick={() => setOrderFilter("all")}
            style={{ background: orderFilter === "all" ? "#1B1B18" : "#fff", color: orderFilter === "all" ? "#fff" : "#444", border: "none", borderRadius: 12, padding: "9px 14px", fontSize: 13, fontWeight: 700 }}>
            Все: {adminOrders.length}
          </button>
          {Object.entries(STATUS).filter(([k]) => k !== "work").map(([k, s]) => {
            const n = adminOrders.filter((o) => o.status === k).length;
            if (!n && orderFilter !== k) return null;
            return (
              <button key={k} onClick={() => setOrderFilter(orderFilter === k ? "all" : k)}
                style={{ background: orderFilter === k ? s.color : "#fff", color: orderFilter === k ? "#fff" : "#444", border: "none", borderRadius: 12, padding: "9px 14px", fontSize: 13, fontWeight: 700 }}>
                <span style={{ color: orderFilter === k ? "#fff" : s.color }}>●</span> {s.label}: {n}
              </button>
            );
          })}
        </div>
        {adminOrders.length === 0 ? (
          <div style={{ textAlign: "center", padding: 60, color: "#888", background: "#fff", borderRadius: 16 }}>
            <div style={{ fontSize: 40 }}>📭</div>
            <p style={{ marginTop: 10 }}>Заказов пока нет. Как только клиент оформит заказ на сайте — он появится здесь.</p>
          </div>
        ) : adminOrders.filter((o) =>
          (orderDays === "all" || (orderDays === "today" && o.date === new Date().toLocaleDateString("ru-RU")) ||
            (orderDays === "7" && (Date.now() - new Date(o.created_at)) < 7 * 86400000)) &&
          (orderFilter === "all" || o.status === orderFilter) &&
          ((o.num || "") + " " + (o.phone || "") + " " + (o.name || "")).toLowerCase().includes(orderSearch.toLowerCase().trim())
        ).map((o) => (
          <div key={o.id} style={{ background: "#fff", borderRadius: 16, padding: 18, marginBottom: 14, animation: "fadeUp .3s ease" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 8 }}>
              <div>
                <span style={{ fontFamily: "'Unbounded'", fontWeight: 700, fontSize: 16 }}>{o.num}</span>
                <span style={{ color: "#999", fontSize: 13, marginLeft: 10 }}>{o.date ? o.date + " · " : ""}{o.time}</span>
              </div>
              <div style={{ display: "flex", gap: 6 }}>
                <button onClick={() => cycleAdminStatus(o.id, o.status)}
                  style={{ background: STATUS[o.status].color, color: "#fff", border: "none", borderRadius: 99, padding: "7px 16px", fontWeight: 700, fontSize: 13 }}>
                  {STATUS[o.status].label}{NEXT_STATUS[o.status] ? " → " + STATUS[NEXT_STATUS[o.status]].label : ""}
                </button>
                <button onClick={() => notifyClient(o)} title="Написать клиенту в WhatsApp (готовый текст по статусу)"
                  style={{ background: "#25D366", color: "#fff", border: "none", borderRadius: 99, padding: "7px 12px", fontWeight: 800, fontSize: 13 }}>💬</button>
                <button onClick={() => printOrder(o)} title="Печать листа сборки"
                  style={{ background: "#f2f1ed", color: "#444", border: "none", borderRadius: 99, padding: "7px 12px", fontWeight: 800, fontSize: 13 }}>🖨</button>
                {!["done", "cancelled"].includes(o.status) && (
                  <button onClick={() => cancelOrder(o.id)} title="Отменить заказ"
                    style={{ background: "#FBE9E4", color: "#C7411A", border: "none", borderRadius: 99, padding: "7px 12px", fontWeight: 800, fontSize: 13 }}>✕</button>
                )}
              </div>
            </div>
            <div style={{ fontSize: 14, color: "#555", marginTop: 8, lineHeight: 1.7 }}>
              👤 {o.name} · 📞 {o.phone}<br />
              {o.type === "delivery" ? "🚚 Доставка: " + o.address : "🏪 Самовывоз"} · {o.pay === "kaspi" ? "Kaspi" : "Наличные"}
              {o.slot && <> · 🕒 {o.slot}</>}{o.zone && <> · {o.zone}</>}
              {(o.picker || o.courier) && <><br />{o.picker && <>🧺 {o.picker}</>}{o.picker && o.courier && " · "}{o.courier && <>🛵 {o.courier}</>}</>}
              {o.comment && <><br />💬 {o.comment}</>}
            </div>
            <div style={{ borderTop: "1px dashed #eee", marginTop: 10, paddingTop: 10, fontSize: 14 }}>
              {(o.items || []).map((i, idx) => (
                <div key={idx} style={{ display: "flex", justifyContent: "space-between", padding: "2px 0", opacity: i.missing ? 0.45 : 1, textDecoration: i.missing ? "line-through" : "none" }}>
                  <span>{i.emoji} {i.name} × {i.qty}{i.missing ? " (нет)" : ""}</span><span style={{ fontWeight: 600 }}>{fmt(i.qty * i.price)}</span>
                </div>
              ))}
              <div style={{ display: "flex", justifyContent: "space-between", fontWeight: 800, marginTop: 6, fontSize: 15 }}>
                <span>Итого</span><span>{fmt(o.total)}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
  }

  // ── личный кабинет клиента ──
  if (screen === "account") {
    const inp = { width: "100%", padding: "12px 14px", borderRadius: 12, border: "1.5px solid #ddd", fontSize: 15, marginTop: 6, background: "#fff" };
    const saveProfile = () => {
      try { appStorage.set("sayman-customer", JSON.stringify({ name: order.name, phone: order.phone, address: order.address, type: order.type, pay: order.pay })); } catch {}
      alert(t("saved"));
    };
    return (
      <div style={S.page}>
        <style>{FONTS}</style>
        <div style={{ ...S.wrap, maxWidth: 560, paddingTop: 24, paddingBottom: 60, animation: "fadeUp .3s ease" }}>
          <button onClick={() => setScreen("shop")} style={{ background: "none", border: "none", fontSize: 15, fontWeight: 700, color: "#666" }}>{t("backShort")}</button>
          <h1 style={{ fontFamily: "'Unbounded'", fontSize: 24, margin: "16px 0 4px" }}>{t("myOrders")}</h1>
          <p style={{ color: "#888", fontSize: 13.5, marginBottom: 16 }}>{t("myNote")}</p>

          {myLoading && <div style={{ textAlign: "center", padding: 30, color: "#999" }}>{t("loading")}</div>}
          {!myLoading && myOrders.length === 0 && (
            <div style={{ textAlign: "center", padding: 40, background: "#fff", borderRadius: 16, color: "#888" }}>
              <div style={{ fontSize: 40 }}>🛍️</div>
              <p style={{ marginTop: 10 }}>{t("noOrders")}</p>
            </div>
          )}
          {myOrders.map((o) => {
            const idx = ORDER_FLOW.indexOf(o.status);
            const isCancelled = o.status === "cancelled";
            return (
              <div key={o.id} style={{ background: "#fff", borderRadius: 16, padding: 18, marginBottom: 12 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 6 }}>
                  <div>
                    <span style={{ fontFamily: "'Unbounded'", fontWeight: 700, fontSize: 15 }}>{o.num}</span>
                    <span style={{ color: "#999", fontSize: 12.5, marginLeft: 8 }}>{o.date} · {o.time}</span>
                  </div>
                  <span style={{ background: (STATUS[o.status] || STATUS.new).color, color: "#fff", borderRadius: 99, padding: "4px 12px", fontSize: 12, fontWeight: 800 }}>
                    {t("st_" + o.status)}
                  </span>
                </div>
                {!isCancelled && (
                  <div style={{ display: "flex", gap: 4, marginTop: 12 }}>
                    {ORDER_FLOW.map((s, i) => (
                      <div key={s} style={{ flex: 1, height: 5, borderRadius: 3, background: i <= idx ? "#1E7A46" : "#eceae4", transition: "background .3s" }} />
                    ))}
                  </div>
                )}
                <div style={{ fontSize: 13.5, color: "#777", marginTop: 10, lineHeight: 1.5 }}>
                  {(o.items || []).slice(0, 3).map((i) => i.name + " ×" + i.qty).join(", ")}
                  {(o.items || []).length > 3 ? " и ещё " + ((o.items || []).length - 3) + "…" : ""}
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 12 }}>
                  <b style={{ fontSize: 16 }}>{fmt(o.total)}</b>
                  <button onClick={() => repeatFromItems(o.items)} style={{ ...S.btn(theme.accentSoft, theme.accentDark), padding: "9px 16px", fontSize: 13.5 }}>
                    {t("repeat")}
                  </button>
                </div>
              </div>
            );
          })}
          {myOrders.length > 0 && (
            <button onClick={loadMyOrders} style={{ ...S.btn("#fff", "#666"), width: "100%", padding: 12, fontSize: 14, border: "1.5px solid #e2e0da", marginBottom: 20 }}>
              {t("refreshSt")}
            </button>
          )}

          <div style={{ background: "#fff", borderRadius: 16, padding: 18, marginTop: 8 }}>
            <div style={{ fontWeight: 800, marginBottom: 4 }}>{t("myData")}</div>
            <p style={{ fontSize: 12.5, color: "#999" }}>{t("myDataNote")}</p>
            <label style={{ fontWeight: 700, fontSize: 13, display: "block", marginTop: 12 }}>{t("name")}</label>
            <input style={inp} value={order.name} onChange={(e) => setOrder({ ...order, name: e.target.value })} />
            <label style={{ fontWeight: 700, fontSize: 13, display: "block", marginTop: 12 }}>{t("phone")}</label>
            <input style={inp} value={order.phone} onChange={(e) => setOrder({ ...order, phone: e.target.value })} />
            <label style={{ fontWeight: 700, fontSize: 13, display: "block", marginTop: 12 }}>{t("address")}</label>
            <input style={inp} value={order.address} onChange={(e) => setOrder({ ...order, address: e.target.value })} />
            <button onClick={saveProfile} style={{ ...S.btn("#1B1B18"), width: "100%", marginTop: 14, padding: 13 }}>{t("save")}</button>
          </div>

          <div style={{ background: "#fff", borderRadius: 16, padding: 18, marginTop: 16 }}>
            <div style={{ fontWeight: 800, marginBottom: 4 }}>📲 {t("linkTitle")}</div>
            <p style={{ fontSize: 12.5, color: "#999" }}>{t("linkNote")}</p>
            {linkCode ? (
              <div style={{ textAlign: "center", marginTop: 12 }}>
                <p style={{ fontSize: 13, color: "#555" }}>{t("codeShown")}</p>
                <div style={{ fontFamily: "'Unbounded'", fontSize: 34, fontWeight: 900, letterSpacing: 8, color: theme.accent, margin: "10px 0" }}>{linkCode}</div>
              </div>
            ) : (
              <button style={{ ...S.btn(theme.accentSoft, theme.accentDark), width: "100%", marginTop: 12, padding: 13 }}
                onClick={async () => {
                  try { const c = await rpc("client_make_code", { _cid: getClientId() }); setLinkCode(c); }
                  catch { alert("Нет связи с базой — попробуйте позже"); }
                }}>{t("getCode")}</button>
            )}
            <div style={{ borderTop: "1px dashed #eee", margin: "16px 0 12px" }} />
            <div style={{ fontWeight: 700, fontSize: 13.5 }}>{t("haveCode")}</div>
            <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
              <input style={{ ...inp, marginTop: 0, textAlign: "center", letterSpacing: 4, fontWeight: 800 }} inputMode="numeric" maxLength={6}
                placeholder={t("codePh")} value={claimInput} onChange={(e) => setClaimInput(e.target.value.replace(/\D/g, ""))} />
              <button style={{ ...S.btn("#1B1B18"), padding: "12px 16px", fontSize: 13.5, whiteSpace: "nowrap" }}
                onClick={async () => {
                  if (claimInput.length !== 6) return;
                  try {
                    const cid = await rpc("client_claim_code", { _code: claimInput });
                    try { localStorage.setItem("sayman-cid", cid); } catch {}
                    setClaimInput(""); setLinkCode("");
                    await loadMyOrders();
                    alert(t("codeOk"));
                  } catch { alert(t("codeBad")); }
                }}>{t("applyCode")}</button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── экран оформления ──
  if (screen === "checkout") {
    const inp = { width: "100%", padding: "13px 14px", borderRadius: 12, border: "1.5px solid #ddd", fontSize: 15, marginTop: 6, background: "#fff" };
    const lbl = { fontWeight: 700, fontSize: 14, display: "block", marginTop: 16 };
    const seg = (active) => ({ flex: 1, padding: "12px 8px", borderRadius: 12, border: active ? `2px solid ${theme.accent}` : "1.5px solid #ddd", background: active ? theme.accentSoft : "#fff", fontWeight: 700, fontSize: 14 });
    return (
      <div style={S.page}>
        <style>{FONTS}</style>
        <div style={{ ...S.wrap, maxWidth: 560, paddingTop: 28, paddingBottom: 60, animation: "fadeUp .3s ease" }}>
          <button onClick={() => setScreen("shop")} style={{ background: "none", border: "none", fontSize: 15, fontWeight: 700, color: "#666" }}>{t("backCatalog")}</button>
          <h1 style={{ fontFamily: "'Unbounded'", fontSize: 24, margin: "18px 0 6px" }}>{t("coTitle")}</h1>
          <p style={{ color: "#777", fontSize: 14 }}>{cartCount} · {fmt(cartTotal)}</p>

          <label style={lbl}>{t("name")}</label>
          <input style={inp} value={order.name} onChange={(e) => setOrder({ ...order, name: e.target.value })} placeholder="Например, Асель" />

          <label style={lbl}>{t("phone")}</label>
          <input style={inp} value={order.phone} onChange={(e) => setOrder({ ...order, phone: e.target.value })} placeholder="+7 (7__) ___-__-__" />

          <label style={lbl}>{t("getType")}</label>
          <div style={{ display: "flex", gap: 10, marginTop: 6 }}>
            <button style={seg(order.type === "delivery")} onClick={() => setOrder({ ...order, type: "delivery" })}>🚚 {t("delivery")}</button>
            <button style={seg(order.type === "pickup")} onClick={() => setOrder({ ...order, type: "pickup" })}>🏪 {t("pickup")}</button>
          </div>

          {order.type === "delivery" ? (
            <>
              <label style={lbl}>{t("address")}</label>
              <input style={inp} value={order.address} onChange={(e) => setOrder({ ...order, address: e.target.value })} placeholder={lang === "kk" ? "Көше, үй, пәтер" : "Улица, дом, квартира"} />
              {zonesArr.length > 0 && (
                <>
                  <label style={lbl}>{t("zoneL")}</label>
                  <select style={{ ...inp, appearance: "auto" }} value={curZone} onChange={(e) => setOrder({ ...order, zone: e.target.value })}>
                    {zonesArr.map((z) => <option key={z.name} value={z.name}>{z.name} · {fmt(z.fee)}</option>)}
                  </select>
                </>
              )}
              <label style={lbl}>{t("slotL")}</label>
              <select style={{ ...inp, appearance: "auto" }} value={order.slot || ""} onChange={(e) => setOrder({ ...order, slot: e.target.value })}>
                {(() => {
                  const h = new Date().getHours();
                  const opts = [["Ближайшее время (60–90 мин)", t("asap")]];
                  [[12, 14], [14, 16], [16, 18], [18, 20]].forEach(([a, b]) => {
                    if (h < b - 1) opts.push(["Сегодня " + a + ":00–" + b + ":00", t("today") + " " + a + ":00–" + b + ":00"]);
                  });
                  if (opts.length === 1) opts.push(["Завтра 10:00–12:00", t("tomorrow") + " 10:00–12:00"]);
                  if (!order.slot) setTimeout(() => setOrder((o) => (o.slot ? o : { ...o, slot: opts[0][0] })), 0);
                  return opts.map(([v, l]) => <option key={v} value={v}>{l}</option>);
                })()}
              </select>
              <p style={{ fontSize: 13, color: "#888", marginTop: 8 }}>
                {cartTotal >= FREE_DELIVERY ? "🎉 " + t("free") + " (" + t("freeFrom") + " " + fmt(FREE_DELIVERY) + ")" : t("delivery") + " " + fmt(zoneFee) + " · " + t("freeFrom") + " " + fmt(FREE_DELIVERY)}
              </p>
            </>
          ) : (
            <p style={{ fontSize: 13, color: "#888", marginTop: 10 }}>{t("pickupNote")}</p>
          )}

          <label style={lbl}>{t("pay")}</label>
          <div style={{ display: "flex", gap: 10, marginTop: 6 }}>
            <button style={seg(order.pay === "kaspi")} onClick={() => setOrder({ ...order, pay: "kaspi" })}>{t("kaspi")}</button>
            <button style={seg(order.pay === "cash")} onClick={() => setOrder({ ...order, pay: "cash" })}>{t("cash")}</button>
          </div>

          <label style={lbl}>{t("comment")}</label>
          <textarea style={{ ...inp, minHeight: 70 }} value={order.comment} onChange={(e) => setOrder({ ...order, comment: e.target.value })} placeholder={t("commentPh")} />

          <label style={lbl}>{t("promoL")}</label>
          <div style={{ display: "flex", gap: 8, marginTop: 6 }}>
            <input style={{ ...inp, marginTop: 0, textTransform: "uppercase" }} placeholder={t("promoPh")} value={promoInput}
              onChange={(e) => { setPromoInput(e.target.value); if (promoApplied) setPromoApplied(null); }} />
            <button style={{ ...S.btn(promoApplied ? "#1E7A46" : "#1B1B18"), padding: "12px 18px", fontSize: 14, whiteSpace: "nowrap" }}
              onClick={async () => {
                if (!promoInput.trim()) return;
                try {
                  const res = await rpc("check_promo", { _code: promoInput, _total: cartTotal });
                  setPromoApplied(res);
                  alert(t("promoApplied") + " −" + fmt(res.discount));
                } catch (e) { setPromoApplied(null); alert(String(e.message || "Промокод не действует").slice(0, 120)); }
              }}>{promoApplied ? "✓" : t("applyP")}</button>
          </div>

          <div style={{ background: "#fff", borderRadius: 14, padding: 18, marginTop: 24, border: "1px solid #eee" }}>
            <Row label={t("items")} val={fmt(cartTotal)} />
            {discount > 0 && <Row label={t("discountL") + " (" + promoApplied.code + ")"} val={"−" + fmt(discount)} />}
            <Row label={t("delivery")} val={order.type === "pickup" ? "—" : deliveryFee ? fmt(deliveryFee) : t("free")} />
            <div style={{ borderTop: "1px dashed #ddd", margin: "10px 0" }} />
            <Row label={t("total")} val={fmt(grandTotal)} bold />
          </div>

          <button style={{ ...S.btn(theme.accent), width: "100%", marginTop: 18, padding: "16px" }} onClick={submitOrder}>
            {t("confirm")} · {fmt(grandTotal)}
          </button>
        </div>
      </div>
    );
  }

  // ── главный экран магазина ──
  return (
    <div style={S.page}>
      <style>{FONTS}</style>

      {/* Шапка */}
      <header style={{ background: "#1B1B18", color: "#fff", position: "sticky", top: 0, zIndex: 20 }}>
        <div style={{ ...S.wrap, display: "flex", alignItems: "center", justifyContent: "space-between", height: 66 }}>
          <div>
            <div style={{ fontFamily: "'Unbounded'", fontWeight: 900, fontSize: 22, letterSpacing: 1 }}>
              САЙМАН<span style={{ color: theme.accent }}>.</span>
            </div>
            <div style={{ fontSize: 11, opacity: 0.65 }}>Шымкент · {settings.hours}</div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <a href="tel:+77755683313" style={{ color: "#fff", textDecoration: "none", fontSize: 14, fontWeight: 700, opacity: 0.9 }}>📞 +7 775 568 33 13</a>
            <button onClick={switchLang} title="Тіл / Язык"
              style={{ ...S.btn("rgba(255,255,255,.14)"), padding: "10px 12px", fontSize: 12.5, fontWeight: 800 }}>{lang === "ru" ? "ҚАЗ" : "РУС"}</button>
            <button onClick={() => { setScreen("account"); loadMyOrders(); }} title="Мои заказы"
              style={{ ...S.btn("rgba(255,255,255,.14)"), padding: "10px 13px", fontSize: 17 }}>👤</button>
            <button onClick={() => setCartOpen(true)} style={{ ...S.btn(theme.accent), padding: "10px 16px", position: "relative" }}>
              🛒 {t("cart")}
              {cartCount > 0 && (
                <span style={{ position: "absolute", top: -8, right: -8, background: "#fff", color: theme.accentDark, borderRadius: 99, fontSize: 12, fontWeight: 800, padding: "2px 7px", border: `2px solid ${theme.accent}` }}>{cartCount}</span>
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Переключатель разделов — фирменная фишка */}
      <div style={{ background: theme.accent, transition: "background .35s ease" }}>
        <div style={{ ...S.wrap, padding: "26px 16px 30px" }}>
          <div style={{ display: "flex", gap: 8, background: "rgba(0,0,0,.18)", borderRadius: 14, padding: 5, width: "fit-content" }}>
            {["food", "build"].map((m) => (
              <button key={m} onClick={() => setMode(m)}
                style={{ background: mode === m ? "#fff" : "transparent", color: mode === m ? THEMES[m].accentDark : "rgba(255,255,255,.85)", border: "none", borderRadius: 10, padding: "10px 22px", fontWeight: 800, fontSize: 15, transition: "all .2s" }}>
                {m === "food" ? "🥖 " + t("sec_food") : "🧱 " + t("sec_build")}
              </button>
            ))}
          </div>
          <h1 style={{ fontFamily: "'Unbounded'", color: "#fff", fontSize: "clamp(22px, 4vw, 34px)", fontWeight: 700, marginTop: 18 }}>{t(mode === "food" ? "tag_food" : "tag_build")}</h1>
          <p style={{ color: "rgba(255,255,255,.85)", marginTop: 6, fontSize: 15 }}>{t("heroA")}{fmt(FREE_DELIVERY)}{t("heroB")}</p>
          {!settings.shop_open && (
            <div style={{ background: "rgba(0,0,0,.3)", color: "#fff", borderRadius: 12, padding: "10px 14px", marginTop: 12, fontSize: 14, fontWeight: 700 }}>
              {t("closed1")} ({settings.hours}). {t("closed2")}
            </div>
          )}
        </div>
      </div>

      {/* Поиск + категории */}
      <div style={{ ...S.wrap, paddingTop: 20 }}>
        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder={t("searchIn") + " «" + t(mode === "food" ? "sec_food" : "sec_build") + "»…"}
          style={{ width: "100%", padding: "14px 16px", borderRadius: 14, border: "1.5px solid #e2e0da", fontSize: 15, background: "#fff" }} />
        <div style={{ display: "flex", gap: 8, overflowX: "auto", padding: "14px 0 4px" }}>
          {categories.map((c) => (
            <button key={c} onClick={() => setCategory(c)}
              style={{ whiteSpace: "nowrap", padding: "9px 16px", borderRadius: 99, fontWeight: 700, fontSize: 13.5, border: "none", background: category === c ? theme.accent : "#fff", color: category === c ? "#fff" : "#444", boxShadow: category === c ? "none" : "0 1px 3px rgba(0,0,0,.06)" }}>
              {c === "Все" ? t("all") : c}
            </button>
          ))}
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "center", paddingTop: 8, flexWrap: "wrap" }}>
          <span style={{ fontSize: 13, color: "#888", fontWeight: 700 }}>{t("sort")}</span>
          {[["default", t("sort_default")], ["promo", t("sort_promo")], ["cheap", t("sort_cheap")], ["expensive", t("sort_exp")]].map(([k, label]) => (
            <button key={k} onClick={() => setSort(k)}
              style={{ padding: "6px 12px", borderRadius: 99, fontWeight: 700, fontSize: 12.5, border: sort === k ? `1.5px solid ${theme.accent}` : "1.5px solid #e2e0da", background: sort === k ? theme.accentSoft : "#fff", color: sort === k ? theme.accentDark : "#666" }}>
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Каталог */}
      <main style={{ ...S.wrap, paddingTop: 12, paddingBottom: 90 }}>
        {orders.length > 0 && cartCount === 0 && (
          <button onClick={repeatLastOrder}
            style={{ ...S.btn("#fff", theme.accentDark), width: "100%", marginBottom: 14, padding: "14px", border: `1.5px dashed ${theme.accent}`, fontSize: 14.5 }}>
            {t("repeatLast")} ({orders[0].items.length} · {fmt(orders[0].total)})
          </button>
        )}
        {sort !== "promo" && category === "Все" && !search && products.some((p) => p.oldPrice && p.available !== false) && (
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontWeight: 800, fontSize: 15, marginBottom: 8 }}>{t("promoWeek")}</div>
            <div style={{ display: "flex", gap: 10, overflowX: "auto", paddingBottom: 4 }}>
              {products.filter((p) => p.oldPrice && p.available !== false).map((p) => (
                <div key={"promo-" + p.id} style={{ minWidth: 200, background: "#fff", borderRadius: 14, padding: 12, display: "flex", alignItems: "center", gap: 10, border: "1.5px solid #f3d9c8" }}>
                  <div style={{ fontSize: 30 }}>{p.emoji}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 700, fontSize: 12.5, lineHeight: 1.3 }}>{p.name}</div>
                    <div style={{ fontSize: 12 }}>
                      <span style={{ color: "#aaa", textDecoration: "line-through", marginRight: 5 }}>{fmt(p.oldPrice)}</span>
                      <span style={{ color: "#C7411A", fontWeight: 800 }}>{fmt(p.price)}</span>
                    </div>
                  </div>
                  <button onClick={() => add(p.id, 1)} style={{ background: theme.accent, color: "#fff", border: "none", borderRadius: 10, width: 32, height: 32, fontSize: 18, fontWeight: 800 }}>+</button>
                </div>
              ))}
            </div>
          </div>
        )}
        {visible.length === 0 && (
          <div style={{ textAlign: "center", padding: 60, color: "#888" }}>
            <div style={{ fontSize: 40 }}>🔍</div>
            <p style={{ marginTop: 10 }}>{t("notFound")}</p>
          </div>
        )}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(165px, 1fr))", gap: 14 }}>
          {visible.map((p) => {
            const qty = cart[p.id] || 0;
            return (
              <div key={p.id} style={{ background: "#fff", borderRadius: 16, padding: 14, display: "flex", flexDirection: "column", boxShadow: "0 1px 4px rgba(0,0,0,.05)", animation: "fadeUp .3s ease", position: "relative" }}>
                {(p.oldPrice || p.hit || (p.stock != null && p.stock > 0 && p.stock <= 5)) && (
                  <div style={{ position: "absolute", top: 10, left: 10, zIndex: 2, display: "flex", gap: 4 }}>
                    {p.oldPrice && <span style={{ background: "#C7411A", color: "#fff", borderRadius: 99, fontSize: 11, fontWeight: 800, padding: "3px 8px" }}>−{Math.round((1 - p.price / p.oldPrice) * 100)}%</span>}
                    {p.hit && <span style={{ background: "#1B1B18", color: "#fff", borderRadius: 99, fontSize: 11, fontWeight: 800, padding: "3px 8px" }}>🔥 Хит</span>}
                    {p.stock != null && p.stock > 0 && p.stock <= 5 && <span style={{ background: "#fff", color: "#C7411A", border: "1.5px solid #C7411A", borderRadius: 99, fontSize: 11, fontWeight: 800, padding: "2px 8px" }}>{t("leftN")}: {p.stock}</span>}
                  </div>
                )}
                <div style={{ textAlign: "center", background: theme.accentSoft, borderRadius: 12, transition: "background .35s", overflow: "hidden", height: 92, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  {p.img ? (
                    <img src={p.img} alt={p.name} style={{ width: "100%", height: "100%", objectFit: "cover" }}
                      onError={(e) => { e.target.style.display = "none"; e.target.nextSibling.style.display = "block"; }} />
                  ) : null}
                  <span style={{ fontSize: 44, display: p.img ? "none" : "block" }}>{p.emoji}</span>
                </div>
                <div style={{ fontSize: 11.5, color: "#999", fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.4, marginTop: 10 }}>
                  {p.cat}{p._sec && p._sec !== mode ? (p._sec === "food" ? " · Продукты" : " · Стройка") : ""}
                </div>
                <div style={{ fontWeight: 700, fontSize: 14.5, marginTop: 4, lineHeight: 1.35, flex: 1 }}>{p.name}</div>
                <div style={{ marginTop: 8 }}>
                  {p.oldPrice && <span style={{ fontSize: 13, color: "#aaa", textDecoration: "line-through", marginRight: 6 }}>{fmt(p.oldPrice)}</span>}
                  <span style={{ fontWeight: 800, fontSize: 17, color: p.oldPrice ? "#C7411A" : "#1B1B18" }}>{fmt(p.price)}</span>
                  <span style={{ fontSize: 12, color: "#999", fontWeight: 600 }}> / {p.unit}</span>
                </div>
                {qty === 0 ? (
                  <button onClick={() => add(p.id, 1)} style={{ ...S.btn(theme.accentSoft, theme.accentDark), marginTop: 10, padding: "10px", fontSize: 14 }}>{t("toCart")}</button>
                ) : (
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 10, background: theme.accent, borderRadius: 12 }}>
                    <QtyBtn onClick={() => add(p.id, -1)}>−</QtyBtn>
                    <span style={{ color: "#fff", fontWeight: 800 }}>{qty}</span>
                    <QtyBtn onClick={() => add(p.id, 1)}>+</QtyBtn>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </main>

      {privacyOpen && (
        <div onClick={() => setPrivacyOpen(false)} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.5)", zIndex: 40, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
          <div onClick={(e) => e.stopPropagation()} style={{ background: "#fff", borderRadius: 18, padding: 24, maxWidth: 520, maxHeight: "80vh", overflowY: "auto", fontSize: 14, lineHeight: 1.65 }}>
            <h2 style={{ fontFamily: "'Unbounded'", fontSize: 18, marginBottom: 12 }}>Политика конфиденциальности</h2>
            <p>Оформляя заказ на этом сайте, вы передаёте магазину «Сайман» (г. Шымкент, ул. Байтерекова, 9а) своё имя, номер телефона и адрес доставки. Эти данные используются исключительно для приёма, сборки и доставки вашего заказа и для связи с вами по нему.</p>
            <p style={{ marginTop: 10 }}>Мы не передаём ваши данные третьим лицам, не используем их для рассылок без вашего согласия и храним их в защищённой базе данных. Обработка осуществляется в соответствии с Законом РК «О персональных данных и их защите».</p>
            <p style={{ marginTop: 10 }}>Чтобы уточнить или удалить свои данные, напишите нам в WhatsApp: +7 775 568 33 13.</p>
            <button onClick={() => setPrivacyOpen(false)} style={{ ...S.btn("#1B1B18"), width: "100%", marginTop: 16 }}>Понятно</button>
          </div>
        </div>
      )}

      {/* Кнопка WhatsApp для вопросов */}
      <a href={"https://wa.me/" + WA_PHONE + "?text=" + encodeURIComponent("Здравствуйте! Вопрос по магазину Сайман: ")} target="_blank" rel="noreferrer"
        style={{ position: "fixed", bottom: 20, right: 16, width: 54, height: 54, borderRadius: "50%", background: "#25D366", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 27, boxShadow: "0 6px 18px rgba(0,0,0,.25)", zIndex: 24, textDecoration: "none" }}
        title="Написать в WhatsApp">💬</a>

      {/* Плавающая кнопка итога */}
      {cartCount > 0 && !cartOpen && (
        <button onClick={() => setCartOpen(true)}
          style={{ position: "fixed", bottom: 20, left: "50%", transform: "translateX(-50%)", ...S.btn(theme.accentDark), padding: "15px 28px", borderRadius: 99, boxShadow: "0 8px 24px rgba(0,0,0,.25)", zIndex: 25, fontSize: 15 }}>
          🛒 {cartCount} · {fmt(cartTotal)} — {t("checkout")}
        </button>
      )}

      {/* Корзина (панель) */}
      {cartOpen && (
        <div onClick={() => setCartOpen(false)} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.45)", zIndex: 30 }}>
          <div onClick={(e) => e.stopPropagation()}
            style={{ position: "absolute", right: 0, top: 0, bottom: 0, width: "min(420px, 100%)", background: "#fff", padding: 22, overflowY: "auto", animation: "slideIn .25s ease", display: "flex", flexDirection: "column" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <h2 style={{ fontFamily: "'Unbounded'", fontSize: 19 }}>{t("cart")}</h2>
              <button onClick={() => setCartOpen(false)} style={{ background: "#f2f1ed", border: "none", borderRadius: 10, width: 36, height: 36, fontSize: 16 }}>✕</button>
            </div>
            {cartItems.length === 0 ? (
              <div style={{ textAlign: "center", marginTop: 80, color: "#888" }}>
                <div style={{ fontSize: 44 }}>🛒</div>
                <p style={{ marginTop: 10 }}>{t("cartEmpty")}</p>
              </div>
            ) : (
              <>
                <div style={{ flex: 1, marginTop: 14 }}>
                  {cartItems.map((i) => (
                    <div key={i.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 0", borderBottom: "1px solid #f0efe9" }}>
                      <div style={{ fontSize: 26 }}>{i.emoji}</div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 700, fontSize: 14 }}>{i.name}</div>
                        <div style={{ fontSize: 13, color: "#888" }}>{fmt(i.price)} / {i.unit}</div>
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <SmBtn onClick={() => add(i.id, -1)}>−</SmBtn>
                        <span style={{ fontWeight: 800, minWidth: 20, textAlign: "center" }}>{i.qty}</span>
                        <SmBtn onClick={() => add(i.id, 1)}>+</SmBtn>
                      </div>
                    </div>
                  ))}
                </div>
                {cartTotal < FREE_DELIVERY && (
                  <p style={{ fontSize: 13, color: "#888", marginTop: 12 }}>+{fmt(FREE_DELIVERY - cartTotal)} — {t("toFree")}</p>
                )}
                <div style={{ display: "flex", justifyContent: "space-between", fontWeight: 800, fontSize: 18, marginTop: 12 }}>
                  <span>{t("total")}</span><span>{fmt(cartTotal)}</span>
                </div>
                <button style={{ ...S.btn(theme.accent), width: "100%", marginTop: 14, padding: 16 }}
                  onClick={() => { setCartOpen(false); setScreen("checkout"); }}>
                  {t("makeOrder")}
                </button>
              </>
            )}
          </div>
        </div>
      )}

      {/* Подвал */}
      <footer style={{ background: "#1B1B18", color: "rgba(255,255,255,.75)", padding: "28px 0", fontSize: 14 }}>
        <div style={{ ...S.wrap, display: "flex", flexWrap: "wrap", gap: 20, justifyContent: "space-between" }}>
          <div>
            <div style={{ fontFamily: "'Unbounded'", fontWeight: 900, color: "#fff", fontSize: 18 }}>САЙМАН<span style={{ color: theme.accent }}>.</span></div>
            <div style={{ marginTop: 6 }}>{t("footerTag")}</div>
          </div>
          <div>
            📍 г. Шымкент, ул. Байтерекова, 9а<br />
            🕗 {t("daily")} {settings.hours}<br />
            📞 +7 775 568 33 13
          </div>
          <button onClick={() => setPrivacyOpen(true)}
            style={{ background: "none", color: "rgba(255,255,255,.6)", border: "none", padding: "8px 0", fontSize: 13, alignSelf: "center", textDecoration: "underline" }}>
            {t("privacy")}
          </button>
          <button onClick={() => setScreen("admin")}
            style={{ background: "rgba(255,255,255,.08)", color: "rgba(255,255,255,.6)", border: "1px solid rgba(255,255,255,.15)", borderRadius: 10, padding: "8px 14px", fontSize: 13, alignSelf: "center" }}>
            🔐 Админ-панель
          </button>
        </div>
      </footer>
    </div>
  );
}

function Row({ label, val, bold }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", padding: "4px 0", fontWeight: bold ? 800 : 500, fontSize: bold ? 17 : 15, color: bold ? "#1B1B18" : "#555" }}>
      <span>{label}</span><span>{val}</span>
    </div>
  );
}
function QtyBtn({ children, onClick }) {
  return <button onClick={onClick} style={{ background: "transparent", border: "none", color: "#fff", fontSize: 20, fontWeight: 800, padding: "8px 16px" }}>{children}</button>;
}
function SmBtn({ children, onClick }) {
  return <button onClick={onClick} style={{ background: "#f2f1ed", border: "none", borderRadius: 8, width: 30, height: 30, fontSize: 16, fontWeight: 800 }}>{children}</button>;
}
