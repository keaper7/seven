/* Витрина работ. */

window.SEVEN = window.SEVEN || {};

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
    scrollTo({ top: y, behavior: 'smooth' });
  }));

  load(1);
  frame();
};
