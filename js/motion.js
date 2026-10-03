/* Движение сайта. Без GSAP: одна прокрутка, один rAF-цикл, а скрипт
   только раздаёт элементам прогресс --p (0…1). Всё остальное — calc()
   в CSS, поэтому на телефоне это дёшево: браузер двигает transform и
   clip-path, а не перекладывает вёрстку.

   data-scrub="sticky" — длинная секция с липкой сценой: 0 — сцена
                          только прилипла, 1 — вот-вот отлипнет
   data-scrub="read"   — блок текста: 0 — показался снизу, 1 — дочитан
   data-split          — заголовок режется на слова, каждое выезжает
                          из-под своей маски при появлении
   data-words          — слова манифеста «загораются» по мере чтения */

window.SEVEN = window.SEVEN || {};

SEVEN.motion = function initMotion() {
  const root = document.documentElement;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const fine = matchMedia('(hover: hover) and (pointer: fine)').matches;
  const clamp = (v) => Math.min(1, Math.max(0, v));

  /* ── нарезка на слова (и буквы для логотипа в подвале) ──
     идём по узлам, а не по textContent: внутри бывают <span class="accent">,
     их нужно сохранить вокруг своих слов */
  const split = (el) => {
    const chars = el.dataset.split === 'chars';
    let i = 0;
    const walk = (node) => {
      [...node.childNodes].forEach((ch) => {
        if (ch.nodeType === 3) {
          const parts = chars ? [...ch.textContent] : ch.textContent.split(/([ \t\n\r]+)/);
          const frag = document.createDocumentFragment();
          parts.forEach((w) => {
            if (!w) return;
            if (/^[ \t\n\r]+$/.test(w)) { frag.appendChild(document.createTextNode(' ')); return; }
            const m = document.createElement('span');
            m.className = 'wd';
            const inner = document.createElement('span');
            inner.textContent = w;
            inner.style.setProperty('--i', i++);
            m.appendChild(inner);
            frag.appendChild(m);
          });
          node.replaceChild(frag, ch);
        } else if (ch.nodeType === 1) {
          if (chars) {           // <i>.</i> в логотипе — тоже отдельная буква
            ch.style.setProperty('--i', i++);
            ch.classList.add('wd-solo');
          } else walk(ch);
        }
      });
    };
    if (!el.hasAttribute('aria-label')) el.setAttribute('aria-label', el.textContent.replace(/\s+/g, ' ').trim());
    walk(el);
    el.querySelectorAll('.wd').forEach((w) => w.setAttribute('aria-hidden', 'true'));
  };
  document.querySelectorAll('[data-split]').forEach(split);

  /* слова манифеста — без масок, только номер и общее число */
  document.querySelectorAll('[data-words]').forEach((el) => {
    let i = 0;
    const walk = (node) => {
      [...node.childNodes].forEach((ch) => {
        if (ch.nodeType === 3) {
          const frag = document.createDocumentFragment();
          ch.textContent.split(/([ \t\n\r]+)/).forEach((w) => {
            if (!w) return;
            if (/^[ \t\n\r]+$/.test(w)) { frag.appendChild(document.createTextNode(' ')); return; }
            const s = document.createElement('span');
            s.className = 'lw';
            s.textContent = w;
            s.style.setProperty('--i', i++);
            frag.appendChild(s);
          });
          node.replaceChild(frag, ch);
        } else if (ch.nodeType === 1) walk(ch);
      });
    };
    walk(el);
    el.style.setProperty('--n', i);
  });

  /* ── появление заголовков-масок ── */
  const splitHeads = [...document.querySelectorAll('[data-split]:not([data-split="hero"])')];
  if ('IntersectionObserver' in window && !reduced) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((en) => {
        if (!en.isIntersecting) return;
        en.target.classList.add('is-in');
        io.unobserve(en.target);
      });
    }, { rootMargin: '0px 0px -10% 0px', threshold: 0.2 });
    splitHeads.forEach((el) => io.observe(el));
  } else splitHeads.forEach((el) => el.classList.add('is-in'));

  /* ── плавная прокрутка колесом — только мышь; палец листает нативно ── */
  let lenis = null;
  if (fine && !reduced) {
    const s = document.createElement('script');
    s.src = 'https://cdn.jsdelivr.net/npm/lenis@1.3.26/dist/lenis.min.js';
    s.onload = () => {
      if (!window.Lenis) return;
      root.style.scrollBehavior = 'auto';
      lenis = new Lenis({ lerp: 0.1, anchors: { offset: -70 } });
      SEVEN.lenis = lenis;
      const raf = (t) => { lenis.raf(t); requestAnimationFrame(raf); };
      requestAnimationFrame(raf);
    };
    document.head.appendChild(s);
  }

  /* ── прогресс секций ── */
  const scrubs = [...document.querySelectorAll('[data-scrub]')];
  const stack = document.getElementById('stack');
  const cards = stack ? [...stack.querySelectorAll('.card')] : [];
  const alt = document.getElementById('altNum');
  const region = document.getElementById('region');
  const ALT = 5642;

  if (reduced) {
    scrubs.forEach((el) => el.style.setProperty('--p', 1));
    return;
  }

  let vh = innerHeight;
  // липкий top карточек задан в CSS через calc — читаем один раз, а не
  // в каждом кадре: getComputedStyle посреди записи --c пересчитал бы стили
  let sticks = [];
  const measure = () => { vh = innerHeight; sticks = cards.map((c) => parseFloat(getComputedStyle(c).top) || 0); };
  measure();
  addEventListener('resize', () => { measure(); queue(); });

  const frame = () => {
    ticking = false;
    scrubs.forEach((el) => {
      const r = el.getBoundingClientRect();
      if (r.bottom < -vh || r.top > vh * 2) return;     // далеко — не считаем
      let p;
      if (el.dataset.scrub === 'sticky') p = -r.top / Math.max(1, r.height - vh);
      else p = (vh * 0.88 - r.top) / (r.height * 0.75 + vh * 0.35);
      p = clamp(p);
      if (el._p !== p) { el._p = p; el.style.setProperty('--p', p.toFixed(4)); }
    });

    /* высота над уровнем моря набирается вместе с подъёмом фото */
    if (alt && region._p !== undefined) {
      const k = clamp((region._p - 0.08) / 0.55);
      const eased = 1 - Math.pow(1 - k, 2);
      alt.textContent = String(Math.round(eased * ALT));
    }

    /* стопка работ: карточка уходит вглубь, пока следующая наезжает */
    for (let i = 0; i < cards.length - 1; i++) {
      const cur = cards[i], next = cards[i + 1];
      const nr = next.getBoundingClientRect();
      const stick = sticks[i + 1];
      const c = clamp((vh - nr.top) / Math.max(1, vh - stick));
      if (cur._c !== c) { cur._c = c; cur.style.setProperty('--c', c.toFixed(4)); }
    }
  };

  let ticking = false;
  const queue = () => { if (!ticking) { ticking = true; requestAnimationFrame(frame); } };
  addEventListener('scroll', queue, { passive: true });
  frame();
  if (document.fonts) document.fonts.ready.then(queue);
};

/* ── шоурил: проекты сменяют друг друга, пока окно на экране ── */
SEVEN.reel = function initReel() {
  const box = document.getElementById('reelSlides');
  if (!box) return;
  const slides = [...box.children];
  const name = document.getElementById('reelName');
  const kind = document.getElementById('reelKind');
  const bar = document.getElementById('reelBar');
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const DUR = 2600;
  let i = 0, timer = 0, inView = false;

  const show = (n) => {
    slides[i].classList.remove('is-on');
    i = n;
    const s = slides[i];
    s.classList.add('is-on');
    name.textContent = s.dataset.name;
    kind.textContent = s.dataset.kind;
    if (bar) { bar.style.animation = 'none'; void bar.offsetWidth; bar.style.animation = ''; }
  };

  const loop = () => {
    clearTimeout(timer);
    if (!inView) return;
    timer = setTimeout(() => { show((i + 1) % slides.length); loop(); }, DUR);
  };

  if (reduced || !('IntersectionObserver' in window)) return;
  new IntersectionObserver(([en]) => {
    inView = en.isIntersecting;
    box.closest('.reel').classList.toggle('is-playing', inView);
    if (inView) loop(); else clearTimeout(timer);
  }, { threshold: 0.1 }).observe(box);
};

/* ── бегущая лента ускоряется от скорости прокрутки ── */
SEVEN.ticker = function initTicker() {
  const track = document.getElementById('ticker');
  if (!track || !track.getAnimations) return;
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  let last = scrollY, boost = 0, raf = 0;
  const anim = () => track.getAnimations()[0];
  const tick = () => {
    const a = anim();
    boost *= 0.92;
    if (a) a.playbackRate = 1 + boost;
    raf = boost > 0.02 ? requestAnimationFrame(tick) : 0;
  };
  addEventListener('scroll', () => {
    const v = Math.abs(scrollY - last);
    last = scrollY;
    boost = Math.min(5, boost + v / 40);
    if (!raf) raf = requestAnimationFrame(tick);
  }, { passive: true });
};

/* ── меню на весь экран ── */
SEVEN.menu = function initMenu() {
  const btn = document.getElementById('menuBtn');
  const menu = document.getElementById('menu');
  if (!btn || !menu) return;
  const text = btn.querySelector('.top__menu-text');
  const set = (open) => {
    document.documentElement.classList.toggle('menu-open', open);
    btn.setAttribute('aria-expanded', String(open));
    menu.setAttribute('aria-hidden', String(!open));
    text.textContent = open ? text.dataset.close : text.dataset.open;
    if (SEVEN.lenis) open ? SEVEN.lenis.stop() : SEVEN.lenis.start();
  };
  btn.addEventListener('click', () => set(btn.getAttribute('aria-expanded') !== 'true'));
  menu.addEventListener('click', (e) => { if (e.target.closest('a')) set(false); });
  addEventListener('keydown', (e) => { if (e.key === 'Escape') set(false); });
};
