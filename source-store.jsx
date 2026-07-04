import { useState, useMemo, useEffect } from "react";

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

const FREE_DELIVERY = 10000;
const DELIVERY_FEE = 700;
const WA_PHONE = "77755683313"; // WhatsApp магазина: +7 775 568 33 13

// ── Общая база данных (Supabase) ──
const SUPA_URL = "https://zbnlbxsoxdmmhvmdargy.supabase.co";
const SUPA_KEY = "sb_publishable_V7hiiZLeL5fEEowwmgSfTQ_NdlTbSrl";
const sHeaders = { apikey: SUPA_KEY, Authorization: "Bearer " + SUPA_KEY, "Content-Type": "application/json" };
const sGet = (path) => fetch(SUPA_URL + "/rest/v1/" + path, { headers: sHeaders }).then((r) => { if (!r.ok) throw new Error("db"); return r.json(); });
const sPost = (path, body, extra) => fetch(SUPA_URL + "/rest/v1/" + path, { method: "POST", headers: { ...sHeaders, ...(extra || {}) }, body: JSON.stringify(body) }).then((r) => { if (!r.ok) return r.text().then((t) => { throw new Error(t); }); return r.text().then((t) => (t ? JSON.parse(t) : null)); });
const rpc = (fn, args) => sPost("rpc/" + fn, args);
const rowToProduct = (r) => ({ id: r.id, cat: r.cat, name: r.name, unit: r.unit, price: r.price, oldPrice: r.old_price || undefined, hit: r.hit || undefined, img: r.img || undefined, emoji: r.emoji || "🛒" });
const productToRow = (sec, p) => ({ id: p.id, section: sec, cat: p.cat, name: p.name, unit: p.unit, price: p.price, old_price: p.oldPrice ?? null, hit: !!p.hit, img: p.img ?? null, emoji: p.emoji || "🛒" });
const mapOrderRow = (r) => ({ ...r, time: new Date(r.created_at).toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" }), date: new Date(r.created_at).toLocaleDateString("ru-RU") });

const fmt = (n) => n.toLocaleString("ru-RU") + " ₸";

const buildWaMsg = (o) => encodeURIComponent(
  "🛒 НОВЫЙ ЗАКАЗ " + o.num + " — Сайман\n" +
  "Имя: " + o.name + "\n" +
  "Телефон: " + o.phone + "\n" +
  (o.type === "delivery" ? "🚚 Доставка: " + o.address : "🏪 Самовывоз") + "\n" +
  "Оплата: " + (o.pay === "kaspi" ? "Kaspi" : "Наличные") + "\n" +
  (o.comment ? "Комментарий: " + o.comment + "\n" : "") +
  "───────────\n" +
  o.items.map((i) => "• " + i.name + " × " + i.qty + " = " + (i.qty * i.price).toLocaleString("ru-RU") + " ₸").join("\n") +
  "\n───────────\nИТОГО: " + o.total.toLocaleString("ru-RU") + " ₸"
);

const STATUS = { new: { label: "Новый", color: "#C7411A" }, work: { label: "В работе", color: "#C77B12" }, done: { label: "Выполнен", color: "#1E7A46" } };
const NEXT_STATUS = { new: "work", work: "done", done: "new" };


export default function SaymanStore() {
  const [mode, setMode] = useState("food");
  const [category, setCategory] = useState("Все");
  const [search, setSearch] = useState("");
  const [cart, setCart] = useState({}); // id -> qty
  const [cartOpen, setCartOpen] = useState(false);
  const [screen, setScreen] = useState("shop"); // shop | checkout | done
  const [order, setOrder] = useState({ name: "", phone: "", type: "delivery", address: "", pay: "kaspi", comment: "" });
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

  // Загрузка сохранённых данных (заказы + данные клиента) при открытии
  useEffect(() => {
    (async () => {
      try {
        const saved = await appStorage.get("sayman-orders");
        if (saved?.value) setOrders(JSON.parse(saved.value));
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
    const rows = await rpc("admin_get_orders", { _pin: pin });
    setAdminOrders(rows.map(mapOrderRow));
  };
  const tryStaffLogin = async (pin) => {
    try { await loadAdminOrders(pin); setStaffPin(pin); setStaffAuth(true); setPinInput(""); }
    catch { setPinInput(""); alert("Неверный PIN-код (или нет связи с базой)"); }
  };
  const cycleAdminStatus = (id, cur) => {
    const next = NEXT_STATUS[cur];
    rpc("admin_set_status", { _pin: staffPin, _id: id, _status: next }).catch(dbFail);
    setAdminOrders((prev) => prev.map((o) => (o.id === id ? { ...o, status: next } : o)));
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
    let list = products.filter((p) =>
      (category === "Все" || p.cat === category) &&
      p.name.toLowerCase().includes(search.toLowerCase())
    );
    if (sort === "cheap") list = [...list].sort((a, b) => a.price - b.price);
    if (sort === "expensive") list = [...list].sort((a, b) => b.price - a.price);
    if (sort === "promo") list = [...list].sort((a, b) => (b.oldPrice ? 1 : 0) + (b.hit ? 1 : 0) - (a.oldPrice ? 1 : 0) - (a.hit ? 1 : 0));
    return list;
  }, [products, category, search, sort]);

  const allProducts = [...productsData.food, ...productsData.build];
  const cartItems = Object.entries(cart).filter(([, q]) => q > 0)
    .map(([id, qty]) => ({ ...allProducts.find((p) => p.id === id), qty }));
  const cartCount = cartItems.reduce((s, i) => s + i.qty, 0);
  const cartTotal = cartItems.reduce((s, i) => s + i.qty * i.price, 0);
  const deliveryFee = order.type === "delivery" && cartTotal < FREE_DELIVERY ? DELIVERY_FEE : 0;

  const add = (id, d) => setCart((c) => ({ ...c, [id]: Math.max(0, (c[id] || 0) + d) }));

  const submitOrder = () => {
    if (!order.name.trim() || order.phone.trim().length < 10) return alert("Укажите имя и номер телефона");
    if (order.type === "delivery" && !order.address.trim()) return alert("Укажите адрес доставки");
    const num = "SM-" + Math.floor(1000 + Math.random() * 9000);
    const newOrder = {
      num, ...order, items: cartItems.map(({ img, ...rest }) => rest), total: cartTotal + deliveryFee,
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
      items: newOrder.items, total: newOrder.total,
    }, { Prefer: "return=minimal" }).catch(() => {});
    try { appStorage.set("sayman-customer", JSON.stringify({ name: order.name, phone: order.phone, address: order.address, type: order.type, pay: order.pay })); } catch {}
    setLastOrder(newOrder);
    setOrderNum(num);
    setScreen("done");
    setCart({});
  };

  const cycleStatus = (num) => setOrders((prev) => {
    const next = prev.map((o) => o.num === num ? { ...o, status: NEXT_STATUS[o.status] } : o);
    persistOrders(next);
    return next;
  });

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
        <h1 style={{ fontFamily: "'Unbounded'", fontSize: 26, margin: "16px 0 8px" }}>Заказ принят!</h1>
        <p style={{ fontSize: 17, color: "#555" }}>Номер вашего заказа</p>
        <div style={{ fontFamily: "'Unbounded'", fontSize: 34, fontWeight: 900, color: theme.accent, margin: "8px 0 20px" }}>{orderNum}</div>
        <p style={{ color: "#555", lineHeight: 1.6 }}>
          {order.type === "delivery"
            ? "Курьер свяжется с вами по телефону " + order.phone + " для уточнения времени доставки."
            : "Заказ можно забрать в магазине «Сайман» через 30–40 минут. Мы позвоним, когда всё будет готово."}
        </p>
        {lastOrder && (
          <button style={{ ...S.btn("#25D366"), width: "100%", marginTop: 26, padding: 16, fontSize: 16 }}
            onClick={() => window.open("https://wa.me/" + WA_PHONE + "?text=" + buildWaMsg(lastOrder), "_blank")}>
            💬 Отправить заказ в WhatsApp магазина
          </button>
        )}
        <p style={{ fontSize: 13, color: "#999", marginTop: 10 }}>Нажмите, чтобы продублировать заказ в WhatsApp — так магазин увидит его мгновенно</p>
        <button style={{ ...S.btn("#f2f1ed", "#1B1B18"), marginTop: 14 }} onClick={() => { setScreen("shop"); setOrder((o) => ({ ...o, comment: "" })); }}>
          Вернуться в магазин
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
    const adminHeader = (
      <header style={{ background: "#1B1B18", color: "#fff" }}>
        <div style={{ ...S.wrap, display: "flex", alignItems: "center", justifyContent: "space-between", height: 60, flexWrap: "wrap" }}>
          <div style={{ fontFamily: "'Unbounded'", fontWeight: 900, fontSize: 18 }}>САЙМАН · админ</div>
          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={() => { setStaffAuth(false); setStaffPin(""); setScreen("shop"); }} style={{ ...S.btn("rgba(255,255,255,.15)"), padding: "9px 14px", fontSize: 13 }}>Выйти</button>
            <button onClick={() => setScreen("shop")} style={{ ...S.btn("rgba(255,255,255,.15)"), padding: "9px 14px", fontSize: 13 }}>← В магазин</button>
          </div>
        </div>
        <div style={{ ...S.wrap, display: "flex", gap: 6, paddingBottom: 12 }}>
          {[["orders", "📦 Заказы"], ["products", "🏷️ Товары и цены"]].map(([k, label]) => (
            <button key={k} onClick={() => setAdminTab(k)}
              style={{ background: adminTab === k ? "#fff" : "rgba(255,255,255,.12)", color: adminTab === k ? "#1B1B18" : "#fff", border: "none", borderRadius: 10, padding: "9px 16px", fontWeight: 800, fontSize: 13.5 }}>
              {label}
            </button>
          ))}
        </div>
      </header>
    );

    // ── вкладка Товары и цены (CRM) ──
    if (adminTab === "products") {
      const inp = { padding: "8px 10px", borderRadius: 10, border: "1.5px solid #ddd", fontSize: 14, background: "#fff" };
      const secTheme = THEMES[adminSection];
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
              <button onClick={() => setNewProd({ name: "", cat: "", price: "", unit: "шт", emoji: "🛒" })}
                style={{ ...S.btn("#1B1B18"), padding: "10px 18px", fontSize: 14, marginLeft: "auto" }}>
                + Добавить товар
              </button>
            </div>

            {newProd && (
              <div style={{ background: "#fff", borderRadius: 16, padding: 16, marginBottom: 14, border: `2px solid ${secTheme.accent}` }}>
                <div style={{ fontWeight: 800, marginBottom: 10 }}>Новый товар → {secTheme.label}</div>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  <input style={{ ...inp, flex: "2 1 180px" }} placeholder="Название" value={newProd.name} onChange={(e) => setNewProd({ ...newProd, name: e.target.value })} />
                  <input style={{ ...inp, flex: "1 1 130px" }} placeholder="Категория" value={newProd.cat} onChange={(e) => setNewProd({ ...newProd, cat: e.target.value })} />
                  <input style={{ ...inp, width: 100 }} type="number" placeholder="Цена ₸" value={newProd.price} onChange={(e) => setNewProd({ ...newProd, price: e.target.value })} />
                  <input style={{ ...inp, width: 70 }} placeholder="ед." value={newProd.unit} onChange={(e) => setNewProd({ ...newProd, unit: e.target.value })} />
                  <input style={{ ...inp, width: 60 }} placeholder="🛒" value={newProd.emoji} onChange={(e) => setNewProd({ ...newProd, emoji: e.target.value })} />
                </div>
                <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
                  <button style={{ ...S.btn(secTheme.accent), padding: "10px 18px", fontSize: 14 }}
                    onClick={() => {
                      if (!newProd.name.trim() || !Number(newProd.price)) return alert("Укажите название и цену");
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

            {productsData[adminSection].map((p) => (
              <div key={p.id} style={{ background: "#fff", borderRadius: 14, padding: "10px 14px", marginBottom: 8, display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                <label style={{ width: 52, height: 52, borderRadius: 10, background: secTheme.accentSoft, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 26, cursor: "pointer", overflow: "hidden", flexShrink: 0 }} title="Нажмите, чтобы загрузить фото">
                  {p.img ? <img src={p.img} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : p.emoji}
                  <input type="file" accept="image/*" style={{ display: "none" }} onChange={(e) => uploadPhoto(adminSection, p.id, e.target.files[0])} />
                </label>
                <div style={{ flex: "1 1 160px", minWidth: 140 }}>
                  <input key={p.id + p.name} defaultValue={p.name} onBlur={(e) => e.target.value.trim() && updateProduct(adminSection, p.id, { name: e.target.value.trim() })}
                    style={{ ...inp, width: "100%", fontWeight: 700, border: "1.5px solid transparent", padding: "6px 8px" }} />
                  <div style={{ fontSize: 11.5, color: "#999", paddingLeft: 8 }}>{p.cat} · {p.unit}</div>
                </div>
                <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                  <div>
                    <div style={{ fontSize: 10.5, color: "#999", fontWeight: 700 }}>ЦЕНА ₸</div>
                    <input key={p.id + "-p" + p.price} type="number" defaultValue={p.price}
                      onBlur={(e) => Number(e.target.value) > 0 && updateProduct(adminSection, p.id, { price: Number(e.target.value) })}
                      style={{ ...inp, width: 90, fontWeight: 800 }} />
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
                  {p.img && (
                    <button onClick={() => updateProduct(adminSection, p.id, { img: undefined })} title="Убрать фото"
                      style={{ background: "#f2f1ed", border: "none", borderRadius: 8, padding: "8px 9px", fontSize: 13 }}>🖼️✕</button>
                  )}
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
          const todayOrders = adminOrders.filter((o) => o.date === today);
          const todayRevenue = todayOrders.reduce((s, o) => s + o.total, 0);
          return (
            <div style={{ background: "#1B1B18", color: "#fff", borderRadius: 16, padding: "16px 20px", marginBottom: 16, display: "flex", gap: 28, flexWrap: "wrap" }}>
              <div>
                <div style={{ fontSize: 12, opacity: 0.6, fontWeight: 700 }}>СЕГОДНЯ ЗАКАЗОВ</div>
                <div style={{ fontFamily: "'Unbounded'", fontSize: 24, fontWeight: 700 }}>{todayOrders.length}</div>
              </div>
              <div>
                <div style={{ fontSize: 12, opacity: 0.6, fontWeight: 700 }}>СУММА ЗА ДЕНЬ</div>
                <div style={{ fontFamily: "'Unbounded'", fontSize: 24, fontWeight: 700 }}>{fmt(todayRevenue)}</div>
              </div>
              <div>
                <div style={{ fontSize: 12, opacity: 0.6, fontWeight: 700 }}>ВСЕГО ЗАКАЗОВ</div>
                <div style={{ fontFamily: "'Unbounded'", fontSize: 24, fontWeight: 700 }}>{adminOrders.length}</div>
              </div>
              <button onClick={() => loadAdminOrders(staffPin).catch(() => {})} style={{ marginLeft: "auto", alignSelf: "center", background: "rgba(255,255,255,.15)", color: "#fff", border: "none", borderRadius: 10, padding: "10px 16px", fontWeight: 700, fontSize: 13 }}>⟳ Обновить</button>
            </div>
          );
        })()}
        <div style={{ display: "flex", gap: 12, marginBottom: 18, flexWrap: "wrap" }}>
          {Object.entries(STATUS).map(([k, s]) => (
            <div key={k} style={{ background: "#fff", borderRadius: 12, padding: "10px 16px", fontSize: 14, fontWeight: 700 }}>
              <span style={{ color: s.color }}>●</span> {s.label}: {adminOrders.filter((o) => o.status === k).length}
            </div>
          ))}
        </div>
        {adminOrders.length === 0 ? (
          <div style={{ textAlign: "center", padding: 60, color: "#888", background: "#fff", borderRadius: 16 }}>
            <div style={{ fontSize: 40 }}>📭</div>
            <p style={{ marginTop: 10 }}>Заказов пока нет. Как только клиент оформит заказ на сайте — он появится здесь.</p>
          </div>
        ) : adminOrders.map((o) => (
          <div key={o.id} style={{ background: "#fff", borderRadius: 16, padding: 18, marginBottom: 14, animation: "fadeUp .3s ease" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 8 }}>
              <div>
                <span style={{ fontFamily: "'Unbounded'", fontWeight: 700, fontSize: 16 }}>{o.num}</span>
                <span style={{ color: "#999", fontSize: 13, marginLeft: 10 }}>{o.date ? o.date + " · " : ""}{o.time}</span>
              </div>
              <button onClick={() => cycleAdminStatus(o.id, o.status)}
                style={{ background: STATUS[o.status].color, color: "#fff", border: "none", borderRadius: 99, padding: "7px 16px", fontWeight: 700, fontSize: 13 }}>
                {STATUS[o.status].label} →
              </button>
            </div>
            <div style={{ fontSize: 14, color: "#555", marginTop: 8, lineHeight: 1.7 }}>
              👤 {o.name} · 📞 {o.phone}<br />
              {o.type === "delivery" ? "🚚 Доставка: " + o.address : "🏪 Самовывоз"} · {o.pay === "kaspi" ? "Kaspi" : "Наличные"}
              {o.comment && <><br />💬 {o.comment}</>}
            </div>
            <div style={{ borderTop: "1px dashed #eee", marginTop: 10, paddingTop: 10, fontSize: 14 }}>
              {(o.items || []).map((i, idx) => (
                <div key={idx} style={{ display: "flex", justifyContent: "space-between", padding: "2px 0" }}>
                  <span>{i.emoji} {i.name} × {i.qty}</span><span style={{ fontWeight: 600 }}>{fmt(i.qty * i.price)}</span>
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

  // ── экран оформления ──
  if (screen === "checkout") {
    const inp = { width: "100%", padding: "13px 14px", borderRadius: 12, border: "1.5px solid #ddd", fontSize: 15, marginTop: 6, background: "#fff" };
    const lbl = { fontWeight: 700, fontSize: 14, display: "block", marginTop: 16 };
    const seg = (active) => ({ flex: 1, padding: "12px 8px", borderRadius: 12, border: active ? `2px solid ${theme.accent}` : "1.5px solid #ddd", background: active ? theme.accentSoft : "#fff", fontWeight: 700, fontSize: 14 });
    return (
      <div style={S.page}>
        <style>{FONTS}</style>
        <div style={{ ...S.wrap, maxWidth: 560, paddingTop: 28, paddingBottom: 60, animation: "fadeUp .3s ease" }}>
          <button onClick={() => setScreen("shop")} style={{ background: "none", border: "none", fontSize: 15, fontWeight: 700, color: "#666" }}>← Назад в каталог</button>
          <h1 style={{ fontFamily: "'Unbounded'", fontSize: 24, margin: "18px 0 6px" }}>Оформление заказа</h1>
          <p style={{ color: "#777", fontSize: 14 }}>{cartCount} товар(ов) на {fmt(cartTotal)}</p>

          <label style={lbl}>Ваше имя</label>
          <input style={inp} value={order.name} onChange={(e) => setOrder({ ...order, name: e.target.value })} placeholder="Например, Асель" />

          <label style={lbl}>Телефон</label>
          <input style={inp} value={order.phone} onChange={(e) => setOrder({ ...order, phone: e.target.value })} placeholder="+7 (7__) ___-__-__" />

          <label style={lbl}>Способ получения</label>
          <div style={{ display: "flex", gap: 10, marginTop: 6 }}>
            <button style={seg(order.type === "delivery")} onClick={() => setOrder({ ...order, type: "delivery" })}>🚚 Доставка</button>
            <button style={seg(order.type === "pickup")} onClick={() => setOrder({ ...order, type: "pickup" })}>🏪 Самовывоз</button>
          </div>

          {order.type === "delivery" ? (
            <>
              <label style={lbl}>Адрес доставки</label>
              <input style={inp} value={order.address} onChange={(e) => setOrder({ ...order, address: e.target.value })} placeholder="Улица, дом, квартира" />
              <p style={{ fontSize: 13, color: "#888", marginTop: 8 }}>
                {cartTotal >= FREE_DELIVERY ? "🎉 Доставка бесплатная (заказ от " + fmt(FREE_DELIVERY) + ")" : "Доставка " + fmt(DELIVERY_FEE) + " · бесплатно от " + fmt(FREE_DELIVERY)}
              </p>
            </>
          ) : (
            <p style={{ fontSize: 13, color: "#888", marginTop: 10 }}>📍 Магазин «Сайман», г. Шымкент, ул. Байтерекова, 9а. Заказ будет готов через 30–40 минут.</p>
          )}

          <label style={lbl}>Оплата</label>
          <div style={{ display: "flex", gap: 10, marginTop: 6 }}>
            <button style={seg(order.pay === "kaspi")} onClick={() => setOrder({ ...order, pay: "kaspi" })}>Kaspi перевод / QR</button>
            <button style={seg(order.pay === "cash")} onClick={() => setOrder({ ...order, pay: "cash" })}>Наличные</button>
          </div>

          <label style={lbl}>Комментарий к заказу</label>
          <textarea style={{ ...inp, minHeight: 70 }} value={order.comment} onChange={(e) => setOrder({ ...order, comment: e.target.value })} placeholder="Например: позвонить за 10 минут" />

          <div style={{ background: "#fff", borderRadius: 14, padding: 18, marginTop: 24, border: "1px solid #eee" }}>
            <Row label="Товары" val={fmt(cartTotal)} />
            <Row label="Доставка" val={order.type === "pickup" ? "—" : deliveryFee ? fmt(deliveryFee) : "бесплатно"} />
            <div style={{ borderTop: "1px dashed #ddd", margin: "10px 0" }} />
            <Row label="Итого" val={fmt(cartTotal + deliveryFee)} bold />
          </div>

          <button style={{ ...S.btn(theme.accent), width: "100%", marginTop: 18, padding: "16px" }} onClick={submitOrder}>
            Подтвердить заказ · {fmt(cartTotal + deliveryFee)}
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
            <div style={{ fontSize: 11, opacity: 0.65 }}>Шымкент · с 08:00 до 22:00</div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <a href="tel:+77755683313" style={{ color: "#fff", textDecoration: "none", fontSize: 14, fontWeight: 700, opacity: 0.9 }}>📞 +7 775 568 33 13</a>
            <button onClick={() => setCartOpen(true)} style={{ ...S.btn(theme.accent), padding: "10px 16px", position: "relative" }}>
              🛒 Корзина
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
                {m === "food" ? "🥖 Продукты" : "🧱 Стройматериалы"}
              </button>
            ))}
          </div>
          <h1 style={{ fontFamily: "'Unbounded'", color: "#fff", fontSize: "clamp(22px, 4vw, 34px)", fontWeight: 700, marginTop: 18 }}>{theme.tagline}</h1>
          <p style={{ color: "rgba(255,255,255,.85)", marginTop: 6, fontSize: 15 }}>Доставка по Шымкенту от 60 минут · бесплатно от {fmt(FREE_DELIVERY)}</p>
        </div>
      </div>

      {/* Поиск + категории */}
      <div style={{ ...S.wrap, paddingTop: 20 }}>
        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder={"Поиск в разделе «" + theme.label + "»…"}
          style={{ width: "100%", padding: "14px 16px", borderRadius: 14, border: "1.5px solid #e2e0da", fontSize: 15, background: "#fff" }} />
        <div style={{ display: "flex", gap: 8, overflowX: "auto", padding: "14px 0 4px" }}>
          {categories.map((c) => (
            <button key={c} onClick={() => setCategory(c)}
              style={{ whiteSpace: "nowrap", padding: "9px 16px", borderRadius: 99, fontWeight: 700, fontSize: 13.5, border: "none", background: category === c ? theme.accent : "#fff", color: category === c ? "#fff" : "#444", boxShadow: category === c ? "none" : "0 1px 3px rgba(0,0,0,.06)" }}>
              {c}
            </button>
          ))}
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "center", paddingTop: 8, flexWrap: "wrap" }}>
          <span style={{ fontSize: 13, color: "#888", fontWeight: 700 }}>Сортировка:</span>
          {[["default", "По порядку"], ["promo", "🔥 Акции и хиты"], ["cheap", "Дешевле"], ["expensive", "Дороже"]].map(([k, label]) => (
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
            🔄 Повторить прошлый заказ ({orders[0].items.length} поз. на {fmt(orders[0].total)})
          </button>
        )}
        {sort !== "promo" && category === "Все" && !search && products.some((p) => p.oldPrice) && (
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontWeight: 800, fontSize: 15, marginBottom: 8 }}>🔥 Акции недели</div>
            <div style={{ display: "flex", gap: 10, overflowX: "auto", paddingBottom: 4 }}>
              {products.filter((p) => p.oldPrice).map((p) => (
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
            <p style={{ marginTop: 10 }}>Ничего не нашлось. Попробуйте изменить запрос или позвоните нам — подберём вручную.</p>
          </div>
        )}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(165px, 1fr))", gap: 14 }}>
          {visible.map((p) => {
            const qty = cart[p.id] || 0;
            return (
              <div key={p.id} style={{ background: "#fff", borderRadius: 16, padding: 14, display: "flex", flexDirection: "column", boxShadow: "0 1px 4px rgba(0,0,0,.05)", animation: "fadeUp .3s ease", position: "relative" }}>
                {(p.oldPrice || p.hit) && (
                  <div style={{ position: "absolute", top: 10, left: 10, zIndex: 2, display: "flex", gap: 4 }}>
                    {p.oldPrice && <span style={{ background: "#C7411A", color: "#fff", borderRadius: 99, fontSize: 11, fontWeight: 800, padding: "3px 8px" }}>−{Math.round((1 - p.price / p.oldPrice) * 100)}%</span>}
                    {p.hit && <span style={{ background: "#1B1B18", color: "#fff", borderRadius: 99, fontSize: 11, fontWeight: 800, padding: "3px 8px" }}>🔥 Хит</span>}
                  </div>
                )}
                <div style={{ textAlign: "center", background: theme.accentSoft, borderRadius: 12, transition: "background .35s", overflow: "hidden", height: 92, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  {p.img ? (
                    <img src={p.img} alt={p.name} style={{ width: "100%", height: "100%", objectFit: "cover" }}
                      onError={(e) => { e.target.style.display = "none"; e.target.nextSibling.style.display = "block"; }} />
                  ) : null}
                  <span style={{ fontSize: 44, display: p.img ? "none" : "block" }}>{p.emoji}</span>
                </div>
                <div style={{ fontSize: 11.5, color: "#999", fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.4, marginTop: 10 }}>{p.cat}</div>
                <div style={{ fontWeight: 700, fontSize: 14.5, marginTop: 4, lineHeight: 1.35, flex: 1 }}>{p.name}</div>
                <div style={{ marginTop: 8 }}>
                  {p.oldPrice && <span style={{ fontSize: 13, color: "#aaa", textDecoration: "line-through", marginRight: 6 }}>{fmt(p.oldPrice)}</span>}
                  <span style={{ fontWeight: 800, fontSize: 17, color: p.oldPrice ? "#C7411A" : "#1B1B18" }}>{fmt(p.price)}</span>
                  <span style={{ fontSize: 12, color: "#999", fontWeight: 600 }}> / {p.unit}</span>
                </div>
                {qty === 0 ? (
                  <button onClick={() => add(p.id, 1)} style={{ ...S.btn(theme.accentSoft, theme.accentDark), marginTop: 10, padding: "10px", fontSize: 14 }}>В корзину</button>
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

      {/* Плавающая кнопка итога */}
      {cartCount > 0 && !cartOpen && (
        <button onClick={() => setCartOpen(true)}
          style={{ position: "fixed", bottom: 20, left: "50%", transform: "translateX(-50%)", ...S.btn(theme.accentDark), padding: "15px 28px", borderRadius: 99, boxShadow: "0 8px 24px rgba(0,0,0,.25)", zIndex: 25, fontSize: 15 }}>
          🛒 {cartCount} · {fmt(cartTotal)} — оформить
        </button>
      )}

      {/* Корзина (панель) */}
      {cartOpen && (
        <div onClick={() => setCartOpen(false)} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.45)", zIndex: 30 }}>
          <div onClick={(e) => e.stopPropagation()}
            style={{ position: "absolute", right: 0, top: 0, bottom: 0, width: "min(420px, 100%)", background: "#fff", padding: 22, overflowY: "auto", animation: "slideIn .25s ease", display: "flex", flexDirection: "column" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <h2 style={{ fontFamily: "'Unbounded'", fontSize: 19 }}>Корзина</h2>
              <button onClick={() => setCartOpen(false)} style={{ background: "#f2f1ed", border: "none", borderRadius: 10, width: 36, height: 36, fontSize: 16 }}>✕</button>
            </div>
            {cartItems.length === 0 ? (
              <div style={{ textAlign: "center", marginTop: 80, color: "#888" }}>
                <div style={{ fontSize: 44 }}>🛒</div>
                <p style={{ marginTop: 10 }}>Пока пусто. Добавьте товары из каталога.</p>
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
                  <p style={{ fontSize: 13, color: "#888", marginTop: 12 }}>Ещё {fmt(FREE_DELIVERY - cartTotal)} до бесплатной доставки</p>
                )}
                <div style={{ display: "flex", justifyContent: "space-between", fontWeight: 800, fontSize: 18, marginTop: 12 }}>
                  <span>Итого</span><span>{fmt(cartTotal)}</span>
                </div>
                <button style={{ ...S.btn(theme.accent), width: "100%", marginTop: 14, padding: 16 }}
                  onClick={() => { setCartOpen(false); setScreen("checkout"); }}>
                  Оформить заказ
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
            <div style={{ marginTop: 6 }}>Продукты и стройматериалы рядом с домом</div>
          </div>
          <div>
            📍 г. Шымкент, ул. Байтерекова, 9а<br />
            🕗 Ежедневно 08:00 – 22:00<br />
            📞 +7 775 568 33 13
          </div>
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
