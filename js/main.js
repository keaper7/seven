/* Точка входа: плавный скролл, затем прелоадер и сцены. */

(function boot() {
  /* ── старт всегда сверху ──
     сам флаг scrollRestoration выставлен инлайном в <head> — раньше GSAP,
     иначе ScrollTrigger вернёт исходное значение на событии load.
     здесь досбрасываем саму позицию: флаг отключает восстановление,
     но не перематывает страницу, если та уже успела уехать */
  window.scrollTo(0, 0);
  window.addEventListener('load', () => window.scrollTo(0, 0), { once: true });

  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ── Lenis: плавный скролл + связка со ScrollTrigger ── */
  if (window.Lenis && !reduced) {
    const lenis = new Lenis({ duration: 1.05, smoothWheel: true });
    window.lenis = lenis;
    lenis.scrollTo(0, { immediate: true, force: true });   // своя позиция, мимо window.scrollTo

    if (window.ScrollTrigger) {
      lenis.on('scroll', ScrollTrigger.update);
      gsap.ticker.add((t) => lenis.raf(t * 1000));
      gsap.ticker.lagSmoothing(0);
    } else {
      const raf = (t) => { lenis.raf(t); requestAnimationFrame(raf); };
      requestAnimationFrame(raf);
    }

    // клики по индикатору 01…07
    document.querySelectorAll('.rail a[href^="#"]').forEach((a) => {
      a.addEventListener('click', (e) => {
        e.preventDefault();
        const target = document.querySelector(a.getAttribute('href'));
        if (target) lenis.scrollTo(target, { duration: 1.2 });
      });
    });
  }

  SEVEN.clock();
  SEVEN.cursor();
  SEVEN.work();   // навигация, а не анимация — ставим до прелоадера и мимо reduced-motion

  // сцены собираем после того, как SVG вставлены в DOM
  SEVEN.loadSVG().then(() => {
    SEVEN.preloader(() => SEVEN.scenes());
  });
})();
