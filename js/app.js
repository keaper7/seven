/* SEVEN — точка входа. Нативная прокрутка, никаких библиотек: скрипт
   только ставит классы, всё движение — короткие CSS-переходы. */

(function boot() {
  const root = document.documentElement;
  root.classList.add('app-ok');

  /* ── Метрика: цели на кликах. В самой Метрике их нужно завести как
     «JavaScript-событие» с тем же идентификатором (tg_hero, case_open…) ── */
  document.addEventListener('click', (e) => {
    const a = e.target.closest('[data-goal]');
    if (!a) return;
    try { if (window.ym) ym(112505772, 'reachGoal', a.dataset.goal); } catch (err) {}
  });

  SEVEN.faq();

  requestAnimationFrame(() => root.classList.add('is-ready'));

  /* ── шапка: фон появляется, как только ушли с самого верха ── */
  const top = document.getElementById('top');
  const onScroll = () => top.classList.toggle('is-scrolled', scrollY > 16);
  addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* ── меню на телефоне ── */
  const btn = document.getElementById('menuBtn');
  const menu = document.getElementById('menu');
  const setMenu = (open) => {
    root.classList.toggle('menu-open', open);
    btn.setAttribute('aria-expanded', String(open));
    btn.textContent = open ? 'Закрыть' : 'Меню';
    menu.setAttribute('aria-hidden', String(!open));
  };
  btn.addEventListener('click', () => setMenu(btn.getAttribute('aria-expanded') !== 'true'));
  menu.addEventListener('click', (e) => { if (e.target.closest('a')) setMenu(false); });
  addEventListener('keydown', (e) => { if (e.key === 'Escape') setMenu(false); });

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
  }, { rootMargin: '0px 0px -8% 0px', threshold: 0.1 });
  document.querySelectorAll('[data-reveal]').forEach((el) => revealIO.observe(el));

  /* ── липкая кнопка: после первого экрана, но не поверх своих CTA ── */
  const dock = document.getElementById('dock');
  const hero = document.getElementById('hero');
  const blockers = ['contact'].map((id) => document.getElementById(id)).filter(Boolean);
  const state = { heroOut: false, blocked: new Set() };
  const syncDock = () => dock.classList.toggle('is-on', state.heroOut && state.blocked.size === 0);

  new IntersectionObserver(([en]) => {
    state.heroOut = !en.isIntersecting;
    syncDock();
  }, { rootMargin: '-60% 0px 0px 0px' }).observe(hero);

  const blockIO = new IntersectionObserver((entries) => {
    entries.forEach((en) => {
      if (en.isIntersecting) state.blocked.add(en.target.id);
      else state.blocked.delete(en.target.id);
    });
    syncDock();
  }, { rootMargin: '0px 0px -30% 0px' });
  blockers.forEach((b) => blockIO.observe(b));

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
