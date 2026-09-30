/* SEVEN v3 — точка входа. Без GSAP и плавного скролла: на телефоне
   нативная прокрутка быстрее и привычнее, а всё движение здесь — CSS,
   которому скрипт только ставит классы. */

(function boot() {
  const root = document.documentElement;
  root.classList.add('app-ok');

  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ── Метрика: цели на кликах. В самой Метрике их нужно завести как
     «JavaScript-событие» с тем же идентификатором (tg_hero, quiz_send…) ── */
  const goal = (name, params) => {
    try { if (window.ym) ym(112505772, 'reachGoal', name, params); } catch (e) {}
  };
  document.addEventListener('click', (e) => {
    const a = e.target.closest('[data-goal]');
    if (a) goal(a.dataset.goal);
  });

  SEVEN.clock();
  SEVEN.cursor();
  SEVEN.work();
  SEVEN.faq();
  SEVEN.quiz(goal);

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
          intro.classList.add('is-done');
          ready();
          setTimeout(() => intro.remove(), 900);
        }, 260);
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

  /* ── живые телефоны: экран сам листает сайт, пока телефон на виду ──
     сдвиг = высота картинки минус высота экрана; скорость постоянная,
     поэтому длинный сайт листается дольше короткого, а не быстрее */
  const phones = [...document.querySelectorAll('.phone')];
  const measure = (phone) => {
    const screen = phone.querySelector('.phone__screen');
    const img = screen && screen.querySelector('img');
    if (!img) return;
    const apply = () => {
      const shift = Math.max(0, img.offsetTop + img.getBoundingClientRect().height - screen.clientHeight);
      phone.style.setProperty('--shift', shift + 'px');
      phone.style.setProperty('--dur', Math.max(8, shift / 70) + 's');
    };
    if (img.complete && img.naturalHeight) apply();
    else img.addEventListener('load', apply, { once: true });
  };
  phones.forEach(measure);
  let resizeT = 0;
  addEventListener('resize', () => {
    clearTimeout(resizeT);
    resizeT = setTimeout(() => phones.forEach(measure), 200);
  });

  /* живым считается телефон, который виден больше чем на 60% — в ленте
     на телефоне это ровно одна карточка по центру, а не соседние краешки */
  const liveIO = new IntersectionObserver((entries) => {
    entries.forEach((en) => en.target.classList.toggle('is-live', en.intersectionRatio > 0.6));
  }, { threshold: [0, 0.6, 1] });
  phones.forEach((p) => liveIO.observe(p));

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
     прячется у квиза и у контактов — там уже есть крупные кнопки */
  const dock = document.getElementById('dock');
  const hero = document.getElementById('hero');
  const blockers = ['quiz', 'contact'].map((id) => document.getElementById(id)).filter(Boolean);
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
