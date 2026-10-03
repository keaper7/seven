/* SEVEN v3 — точка входа. Без GSAP и плавного скролла: на телефоне
   нативная прокрутка быстрее и привычнее, а всё движение здесь — CSS,
   которому скрипт только ставит классы. */

(function boot() {
  const root = document.documentElement;
  root.classList.add('app-ok');

  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ── Метрика: цели на кликах. В самой Метрике их нужно завести как
     «JavaScript-событие» с тем же идентификатором (tg_hero, fit_send…) ── */
  const goal = (name, params) => {
    try { if (window.ym) ym(112505772, 'reachGoal', name, params); } catch (e) {}
  };
  document.addEventListener('click', (e) => {
    const a = e.target.closest('[data-goal]');
    if (a) goal(a.dataset.goal);
  });

  SEVEN.clock();
  SEVEN.motion();
  SEVEN.cursor();
  SEVEN.faq();
  SEVEN.show();
  SEVEN.ticker();
  SEVEN.menu();

  /* ── заставка 00 → 07: только первый заход, быстро ── */
  const intro = document.getElementById('intro');
  const ready = () => root.classList.add('is-ready');

  if (root.classList.contains('intro') && intro && !reduced) {
    try { localStorage.setItem('seven-intro', '1'); } catch (e) {}
    const count = document.getElementById('introCount');
    const bar = document.getElementById('introBar');
    let n = 0;
    const tick = () => {
      count.textContent = String(n).padStart(2, '0');
      bar.style.width = (n / 7 * 100) + '%';
      if (n === 7) {
        count.classList.add('is-final');
        setTimeout(() => {
          intro.classList.add('is-done');          // шторка уезжает вверх
          setTimeout(ready, 280);                  // слова выезжают следом
          setTimeout(() => intro.remove(), 1200);
        }, 320);
        return;
      }
      n += 1;
      setTimeout(tick, 72);
    };
    tick();
  } else {
    if (intro) intro.remove();
    requestAnimationFrame(ready);
  }

  /* ── шапка: фон появляется, как только ушли с самого верха ── */
  const top = document.getElementById('top');
  const onScroll = () => top.classList.toggle('is-scrolled', scrollY > 24);
  addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  if (!('IntersectionObserver' in window)) {
    document.querySelectorAll('[data-reveal]').forEach((el) => el.classList.add('is-in'));
    return;
  }

  /* ── появление блоков при скролле ── */
  const revealIO = new IntersectionObserver((entries) => {
    entries.forEach((en) => {
      if (!en.isIntersecting) return;
      en.target.classList.add('is-in');
      revealIO.unobserve(en.target);
    });
  }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
  document.querySelectorAll('[data-reveal]').forEach((el) => revealIO.observe(el));

  /* ── маршрут процесса: линия заливается по мере прохода секции ── */
  const steps = document.querySelector('.steps');
  if (steps && !reduced) {
    let raf = 0;
    const paint = () => {
      raf = 0;
      const r = steps.getBoundingClientRect();
      const p = (innerHeight * 0.7 - r.top) / r.height;
      steps.style.setProperty('--progress', Math.min(1, Math.max(0, p)).toFixed(3));
    };
    addEventListener('scroll', () => { if (!raf) raf = requestAnimationFrame(paint); }, { passive: true });
    paint();
  } else if (steps) {
    steps.style.setProperty('--progress', 1);
  }

  /* ── липкая кнопка: после главного экрана, но не поверх своих CTA ──
     прячется у витрины работ и у контактов — там свои кнопки */
  const dock = document.getElementById('dock');
  const hero = document.getElementById('hero');
  const blockers = ['show', 'contact'].map((id) => document.getElementById(id)).filter(Boolean);
  const state = { heroOut: false, blocked: new Set() };
  const syncDock = () => dock.classList.toggle('is-on', state.heroOut && state.blocked.size === 0);

  new IntersectionObserver(([en]) => {
    state.heroOut = !en.isIntersecting;
    syncDock();
  }, { rootMargin: '-45% 0px 0px 0px' }).observe(hero);

  const blockIO = new IntersectionObserver((entries) => {
    entries.forEach((en) => {
      if (en.isIntersecting) state.blocked.add(en.target.id);
      else state.blocked.delete(en.target.id);
    });
    syncDock();
  }, { rootMargin: '0px 0px -30% 0px' });
  blockers.forEach((b) => blockIO.observe(b));
  syncDock();

  /* ── текущий раздел в меню шапки ── */
  const navLinks = [...document.querySelectorAll('.top__nav a')];
  const navIO = new IntersectionObserver((entries) => {
    entries.forEach((en) => {
      if (!en.isIntersecting) return;
      navLinks.forEach((a) => a.classList.toggle('is-current', a.getAttribute('href') === '#' + en.target.id));
    });
  }, { rootMargin: '-45% 0px -50% 0px' });
  navLinks.forEach((a) => {
    const sec = document.querySelector(a.getAttribute('href'));
    if (sec) navIO.observe(sec);
  });
})();
