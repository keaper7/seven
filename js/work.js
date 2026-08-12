/* Карусель работ (секция 04).

   Навигация, а не украшение: работает и при prefers-reduced-motion, и без
   GSAP — единственное, что она делает, это крутит нативный overflow-x.
   Если скрипт не выполнится, карусель остаётся листаемой свайпом и
   трекпадом, просто без стрелок и счётчика. */

window.SEVEN = window.SEVEN || {};

SEVEN.work = function initWork() {
  const track = document.getElementById('workCarousel');
  if (!track) return;

  const cases = [...track.querySelectorAll('.work__case')];
  if (cases.length < 2) return;

  const prev  = document.querySelector('.work__arrow--prev');
  const next  = document.querySelector('.work__arrow--next');
  const cur   = document.getElementById('workCur');
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  let index = 0;

  /* шаг = позиция карточки внутри ленты. Считаем по offsetLeft, а не по
     «ширина + gap»: ширина карточки задана через clamp/vw и на дробных
     значениях накопленная ошибка к третьему кейсу уводит скролл мимо снапа */
  const posOf = (i) => cases[i].offsetLeft - track.offsetLeft;

  const maxScroll = () => track.scrollWidth - track.clientWidth;

  /* индекс по фактическому положению ленты — источник правды один и тот же
     и для стрелок, и для свайпа, и для драга, поэтому счётчик не расходится
     с картинкой, каким бы способом ленту ни прокрутили */
  const indexFromScroll = () => {
    const x = track.scrollLeft;
    let best = 0, bestGap = Infinity;
    cases.forEach((_, i) => {
      const gap = Math.abs(posOf(i) - x);
      if (gap < bestGap) { bestGap = gap; best = i; }
    });
    // у последней карточки лента упирается в конец и до её posOf не доезжает —
    // без этого счётчик на правом краю залипал бы на предпоследнем номере
    if (maxScroll() - x < 2) best = cases.length - 1;
    return best;
  };

  const paint = () => {
    if (cur) cur.textContent = String(index + 1).padStart(2, '0');
    if (prev) prev.disabled = index === 0;
    if (next) next.disabled = index === cases.length - 1;
    cases.forEach((el, i) => el.classList.toggle('is-active', i === index));
  };

  /* ── проезд к карточке ──
     нативный scrollTo({behavior:'smooth'}) здесь не годится: вместе с
     scroll-snap-type: mandatory браузер переснапывает ленту обратно к
     исходной карточке прямо посреди своей же анимации — счётчик уезжал на
     02, а лента оставалась на 01. Поэтому на время проезда снап снимаем и
     ведём scrollLeft сами, тем же ease, что и остальные движения сайта */
  let tween = 0, safety = 0, gliding = false;

  const glideTo = (x, done) => {
    cancelAnimationFrame(tween);
    clearTimeout(safety);
    const from = track.scrollLeft;
    const dist = x - from;
    if (Math.abs(dist) < 1) { done?.(); return; }

    track.style.scrollSnapType = 'none';
    const t0 = performance.now();
    const dur = Math.min(900, 380 + Math.abs(dist) * .38);

    gliding = true;

    const settle = () => {
      cancelAnimationFrame(tween);
      clearTimeout(safety);
      track.scrollLeft = x;
      track.style.scrollSnapType = '';
      gliding = false;
      done?.();
    };

    const step = (now) => {
      const p = Math.min(1, (now - t0) / dur);
      const e = 1 - Math.pow(1 - p, 3);            // power3.out, как в сценах
      track.scrollLeft = from + dist * e;
      if (p < 1) tween = requestAnimationFrame(step);
      else settle();
    };
    tween = requestAnimationFrame(step);

    // подстраховка: в фоновой вкладке rAF замирает, и лента осталась бы
    // застывшей на полпути с выключенным снапом. Таймер доводит её до цели
    // и возвращает снап, даже если ни один кадр так и не отрисовался
    safety = setTimeout(settle, dur + 400);
  };

  const goTo = (i) => {
    index = Math.max(0, Math.min(cases.length - 1, i));
    paint();
    if (reduced) {
      track.scrollLeft = posOf(index);
      return;
    }
    glideTo(posOf(index));
  };

  prev?.addEventListener('click', () => goTo(index - 1));
  next?.addEventListener('click', () => goTo(index + 1));

  /* ── синхронизация счётчика со свайпом/трекпадом ── */
  let raf = 0;
  track.addEventListener('scroll', () => {
    // во время собственного проезда счётчик уже показывает цель — иначе он
    // мигал бы промежуточным номером на каждом кадре анимации
    if (gliding || raf) return;
    raf = requestAnimationFrame(() => {
      raf = 0;
      const i = indexFromScroll();
      if (i !== index) { index = i; paint(); }
    });
  }, { passive: true });

  /* ── стрелки клавиатуры, когда лента в фокусе ── */
  track.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowRight') { e.preventDefault(); goTo(index + 1); }
    if (e.key === 'ArrowLeft')  { e.preventDefault(); goTo(index - 1); }
  });

  /* ── перетаскивание мышью ──
     колесо мы намеренно не перехватываем: вертикальный wheel над секцией
     должен продолжать листать страницу, иначе на середине сайта человек
     упирается в ловушку и не может проскроллить дальше. Трекпад отдаёт
     горизонтальный deltaX нативно, палец — тач, мыши остаются стрелки
     и вот этот драг. */
  let dragging = false, startX = 0, startLeft = 0, moved = 0;

  track.addEventListener('pointerdown', (e) => {
    if (e.pointerType !== 'mouse' || e.button !== 0) return;
    dragging = true; moved = 0;
    startX = e.clientX;
    startLeft = track.scrollLeft;
    // на время драга снап выключен: с mandatory лента дёргается к ближайшей
    // карточке на каждом кадре и за пальцем не идёт
    track.style.scrollSnapType = 'none';
    track.classList.add('is-dragging');
  });

  window.addEventListener('pointermove', (e) => {
    if (!dragging) return;
    const dx = e.clientX - startX;
    moved = Math.max(moved, Math.abs(dx));
    track.scrollLeft = startLeft - dx;
  });

  const endDrag = () => {
    if (!dragging) return;
    dragging = false;
    track.style.scrollSnapType = '';
    track.classList.remove('is-dragging');
    goTo(indexFromScroll());
  };

  window.addEventListener('pointerup', endDrag);
  window.addEventListener('pointercancel', endDrag);

  // после драга указатель отпускается поверх ссылки кейса — без этого
  // каждое перетаскивание заканчивалось бы открытием чужого сайта
  track.addEventListener('click', (e) => {
    if (moved > 8) { e.preventDefault(); e.stopPropagation(); }
  }, true);

  /* ширина карточки зависит от vw — после ресайза позиции пересчитываются,
     и лента должна остаться на той же карточке, а не между двумя */
  let resizeTimer = 0;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
      track.scrollTo({ left: posOf(index), behavior: 'auto' });
    }, 150);
  });

  paint();
};
