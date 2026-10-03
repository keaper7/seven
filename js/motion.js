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
  const alt = document.getElementById('altNum');
  const region = document.getElementById('region');
  const ALT = 5642;

  if (reduced) {
    scrubs.forEach((el) => el.style.setProperty('--p', 1));
    return;
  }

  let vh = innerHeight;
  addEventListener('resize', () => { vh = innerHeight; queue(); });

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

  };

  let ticking = false;
  const queue = () => { if (!ticking) { ticking = true; requestAnimationFrame(frame); } };
  addEventListener('scroll', queue, { passive: true });
  frame();
  if (document.fonts) document.fonts.ready.then(queue);
};

/* ── витрина работ ──
   экран прилипает на n экранов прокрутки. Каждому проекту — свой отрезок:
   в начале отрезка его сайт въезжает шторкой, дальше листается внутри окна
   сверху вниз. Считается своим циклом, а не в общем motion: это навигация
   по работам, и при «уменьшить движение» она тоже должна работать */
SEVEN.show = function initShow() {
  const show = document.getElementById('show');
  if (!show) return;
  const items = [...show.querySelectorAll('.show__item')];
  const shots = [...show.querySelectorAll('.show__shot')];
  const dots = [...show.querySelectorAll('.show__dots button')];
  const screen = show.querySelector('.show__screen');
  const cur = document.getElementById('showCur');
  const url = document.getElementById('showUrl');
  const win = document.getElementById('showWindow');
  const open = document.getElementById('showOpen');
  const openText = open.querySelector('.show__open-text');
  const n = items.length;
  const clamp = (v) => Math.min(1, Math.max(0, v));
  let active = 0;

  /* картинки длинные — грузим только текущую и соседнюю */
  const load = (i) => {
    const pic = shots[i];
    if (!pic || pic.dataset.loaded) return;
    pic.dataset.loaded = '1';
    pic.querySelectorAll('[data-srcset]').forEach((s) => { s.srcset = s.dataset.srcset; });
    pic.querySelectorAll('[data-src]').forEach((im) => { im.src = im.dataset.src; });
  };

  const setActive = (i) => {
    if (i === active) return;
    shots.forEach((s, k) => s.classList.toggle('is-prev', k === active));
    items.forEach((it, k) => { it.classList.toggle('is-on', k === i); it.classList.toggle('is-past', k < i); });
    shots.forEach((s, k) => s.classList.toggle('is-on', k === i));
    dots.forEach((d, k) => d.setAttribute('aria-current', String(k === i)));
    active = i;
    load(i); load(i + 1);
    const it = items[i];
    cur.textContent = String(i + 1).padStart(2, '0');
    url.textContent = shots[i].dataset.dom;
    win.href = open.href = it.dataset.url;
    openText.textContent = it.dataset.cta;
  };

  const frame = () => {
    raf = 0;
    const r = show.getBoundingClientRect();
    const span = Math.max(1, r.height - innerHeight);
    const seg = clamp(-r.top / span) * n;
    const i = Math.min(n - 1, Math.floor(seg));
    setActive(i);
    /* внутри отрезка: короткая пауза на въезд, потом сайт листается */
    const k = clamp((seg - i - 0.14) / 0.78);
    const img = shots[i].querySelector('img');
    const dist = Math.max(0, img.offsetHeight - screen.clientHeight);
    const eased = k < .5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2;
    img.style.transform = `translate3d(0, ${(-eased * dist).toFixed(1)}px, 0)`;
  };

  let raf = 0;
  const queue = () => { if (!raf) raf = requestAnimationFrame(frame); };
  addEventListener('scroll', queue, { passive: true });
  addEventListener('resize', queue);
  shots.forEach((s) => s.querySelector('img').addEventListener('load', queue));

  /* точки — переход к началу отрезка нужного проекта */
  dots.forEach((d, k) => d.addEventListener('click', () => {
    const top = show.getBoundingClientRect().top + scrollY;
    const span = show.offsetHeight - innerHeight;
    const y = top + span * (k + 0.16) / n;
    if (SEVEN.lenis) SEVEN.lenis.scrollTo(y, { duration: 1.2 });
    else scrollTo({ top: y, behavior: 'smooth' });
  }));

  load(1);
  frame();
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
