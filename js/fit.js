/* Примерка: человек вписывает название своего дела — мини-сайт тут же
   перестраивается под него. Пока поле не тронуто, примеры печатаются
   сами, чтобы было видно, что экран живой. */

window.SEVEN = window.SEVEN || {};

SEVEN.fit = function initFit(goal = () => {}) {
  const view = document.getElementById('fitView');
  const mini = document.getElementById('mini');
  const input = document.getElementById('fitName');
  if (!view || !mini || !input) return;

  const $ = (id) => document.getElementById(id);
  const el = {
    logo: $('miniLogo'), links: $('miniLinks'), kicker: $('miniKicker'), title: $('miniTitle'),
    tag: $('miniTag'), btn: $('miniBtn'), tiles: $('miniTiles'), url: $('fitUrl'), send: $('fitSend'),
  };
  const typeBox = $('fitType');
  const moodBox = $('fitMood');

  const TYPES = {
    cafe:    { label: 'Кафе',    kicker: 'кафе · завтраки и ужины',   tag: 'Завтраки весь день и кофе, ради которого возвращаются.', btn: 'Забронировать стол',       links: ['Меню', 'Бронь', 'Контакты'],  tiles: ['Завтраки', 'Десерты', 'Кофе'] },
    beauty:  { label: 'Красота', kicker: 'студия красоты',            tag: 'Естественная красота и уход, которому можно доверять.', btn: 'Записаться онлайн',        links: ['Услуги', 'Мастера', 'Запись'], tiles: ['Уход', 'Процедуры', 'Отзывы'] },
    sport:   { label: 'Спорт',   kicker: 'спортивный клуб',           tag: 'Тренировки, после которых не хочется сдаваться.',      btn: 'Первая тренировка бесплатно', links: ['Тренеры', 'Расписание', 'Цены'], tiles: ['Группы', 'Персонально', 'Дети'] },
    shop:    { label: 'Магазин', kicker: 'магазин · доставка по городу', tag: 'Вещи, которые хочется показать друзьям.',            btn: 'Смотреть каталог',          links: ['Каталог', 'Доставка', 'О нас'], tiles: ['Новинки', 'Хиты', 'Подарки'] },
    service: { label: 'Услуги',  kicker: 'сервис · выезд в день заявки', tag: 'Сделаем так, что вы забудете о проблеме.',           btn: 'Оставить заявку',           links: ['Услуги', 'Работы', 'Контакты'], tiles: ['Ремонт', 'Монтаж', 'Гарантия'] },
  };
  const MOODS = { dark: 'Вечерний', light: 'Светлый', bold: 'Яркий' };

  const DEMOS = [
    { name: 'Кофейня «Ромашка»', type: 'cafe',    mood: 'dark' },
    { name: 'Студия «Лотос»',    type: 'beauty',  mood: 'light' },
    { name: 'FitBox',            type: 'sport',   mood: 'bold' },
    { name: 'Магазин «Нитка»',   type: 'shop',    mood: 'light' },
    { name: 'Мастер на час',     type: 'service', mood: 'dark' },
  ];

  const state = { name: DEMOS[0].name, type: 'cafe', mood: 'dark' };

  /* ── масштаб: мини-сайт всегда 640px, экран под него подстраивается ── */
  const fitScale = () => mini.style.setProperty('--s', (view.clientWidth / 640).toFixed(4));
  fitScale();
  if ('ResizeObserver' in window) new ResizeObserver(fitScale).observe(view);
  else addEventListener('resize', fitScale);

  /* ── адрес в строке браузера из названия ── */
  const TR = { а:'a',б:'b',в:'v',г:'g',д:'d',е:'e',ё:'e',ж:'zh',з:'z',и:'i',й:'y',к:'k',л:'l',м:'m',н:'n',о:'o',п:'p',р:'r',с:'s',т:'t',у:'u',ф:'f',х:'h',ц:'ts',ч:'ch',ш:'sh',щ:'sch',ъ:'',ы:'y',ь:'',э:'e',ю:'yu',я:'ya' };
  const STOP = /^(кофейня|кафе|ресторан|студия|магазин|салон|клуб|школа|центр)\s+/i;
  const slug = (name) => {
    const core = name.replace(STOP, '').toLowerCase();
    const s = [...core].map((c) => (c in TR ? TR[c] : c)).join('')
      .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 22);
    return (s || 'vash-sait') + '.ru';
  };

  const swap = (node) => { node.classList.remove('is-swap'); void node.offsetWidth; node.classList.add('is-swap'); };

  const renderName = () => {
    const name = state.name.trim() || 'Ваше название';
    el.title.textContent = name;
    el.logo.textContent = name.replace(/[«»"]/g, '');
    el.url.textContent = slug(name);
  };

  const renderType = (animate = true) => {
    const t = TYPES[state.type];
    mini.dataset.type = state.type;
    el.kicker.textContent = t.kicker;
    el.tag.textContent = t.tag;
    el.btn.textContent = t.btn;
    el.links.innerHTML = t.links.map((l) => `<i>${l}</i>`).join('');
    el.tiles.innerHTML = t.tiles.map((l) => `<span>${l}</span>`).join('');
    if (animate) [el.kicker, el.tag, el.btn, el.tiles].forEach(swap);
  };

  const renderMood = () => { mini.dataset.mood = state.mood; };

  const updateLink = () => {
    const text = [
      'Здравствуйте! Примерил сайт на sevensites.ru.',
      `Название: ${state.name.trim() || '—'}`,
      `Сфера: ${TYPES[state.type].label}`,
      `Настроение: ${MOODS[state.mood]}`,
      'Хочу обсудить такой сайт.',
    ].join('\n');
    el.send.dataset.text = text;
    el.send.href = 'https://t.me/seven_sites?text=' + encodeURIComponent(text);
  };

  const check = (box, v) => box.querySelectorAll('button').forEach((b) => b.setAttribute('aria-checked', String(b.dataset.v === v)));

  /* ── автопечать примеров, пока человек сам ничего не трогал ── */
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  let demoOn = !reduced, demoIdx = 0, timer = 0, inView = false;

  const stopDemo = () => {
    if (!demoOn) return;
    demoOn = false;
    clearTimeout(timer);
    el.title.classList.remove('is-typing');
  };

  const typeOut = (target, i = 0) => {
    if (!demoOn) return;
    state.name = target.slice(0, i);
    renderName();
    if (i < target.length) { timer = setTimeout(() => typeOut(target, i + 1), 70); return; }
    el.title.classList.remove('is-typing');
    updateLink();
    timer = setTimeout(nextDemo, 2600);
  };

  const nextDemo = () => {
    if (!demoOn) return;
    if (!inView) { timer = setTimeout(nextDemo, 600); return; }
    demoIdx = (demoIdx + 1) % DEMOS.length;
    const d = DEMOS[demoIdx];
    state.type = d.type; state.mood = d.mood;
    check(typeBox, d.type); check(moodBox, d.mood);
    renderType(); renderMood();
    el.title.classList.add('is-typing');
    typeOut(d.name);
  };

  /* ── управление ── */
  input.addEventListener('focus', stopDemo);
  input.addEventListener('input', () => {
    stopDemo();
    state.name = input.value;
    renderName();
    updateLink();
  });
  input.addEventListener('keydown', (e) => { if (e.key === 'Enter') input.blur(); });

  const bindChips = (box, key, after) => box.addEventListener('click', (e) => {
    const b = e.target.closest('button');
    if (!b) return;
    stopDemo();
    if (!input.value) { input.value = state.name; }
    state[key] = b.dataset.v;
    check(box, b.dataset.v);
    after();
    updateLink();
  });
  bindChips(typeBox, 'type', () => renderType());
  bindChips(moodBox, 'mood', renderMood);

  /* запасной путь, если ?text= не подхватился: текст в буфере обмена */
  el.send.addEventListener('click', () => {
    goal('fit_send_' + state.type);
    if (navigator.clipboard && el.send.dataset.text) navigator.clipboard.writeText(el.send.dataset.text).catch(() => {});
  });

  let touched = false;
  [input, typeBox, moodBox].forEach((n) => n.addEventListener('pointerdown', () => {
    if (!touched) { touched = true; goal('fit_start'); }
  }, { once: true }));

  renderName(); renderType(false); renderMood(); updateLink();

  if ('IntersectionObserver' in window) {
    new IntersectionObserver(([en]) => { inView = en.isIntersecting; }, { threshold: 0.3 }).observe(view);
  } else inView = true;
  if (demoOn) timer = setTimeout(nextDemo, 2400);
};
