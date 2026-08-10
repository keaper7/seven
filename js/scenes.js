/* Сцены по скроллу. Все начальные состояния ставятся из JS —
   если скрипт не выполнится, страница остаётся полностью читаемой. */

window.SEVEN = window.SEVEN || {};

/* ── подгрузка инлайновых SVG (нужен доступ к путям для анимации) ── */
SEVEN.loadSVG = async function loadSVG() {
  const jobs = [
    ['labMount', 'img/labyrinth-07.svg'],
  ];
  await Promise.all(jobs.map(async ([id, url]) => {
    const host = document.getElementById(id);
    if (!host) return;
    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error(res.status);
      host.innerHTML = await res.text();
    } catch (err) {
      console.warn('[seven] не загрузилось', url, err);
    }
  }));
};

SEVEN.scenes = function initScenes() {
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduced || !window.gsap || !window.ScrollTrigger) return;

  gsap.registerPlugin(ScrollTrigger);

  /* ─── 01 · пролог: логотип уходит вглубь ─── */
  gsap.to('.hero__mark', {
    yPercent: -14, scale: .94, ease: 'none',
    scrollTrigger: { trigger: '#s1', start: 'top top', end: 'bottom top', scrub: .6 },
  });
  gsap.to('.hero__ghost', {
    yPercent: -26, ease: 'none',
    scrollTrigger: { trigger: '#s1', start: 'top top', end: 'bottom top', scrub: .6 },
  });
  gsap.to(['.hud', '.scroll-hint', '.hero__cta'], {
    opacity: 0, ease: 'none',
    scrollTrigger: { trigger: '#s1', start: 'top top', end: '45% top', scrub: .4 },
  });

  /* ─── 06 · условия: цена и текст проявляются на входе ─── */
  gsap.from('.offer__tier', {
    yPercent: 20, opacity: 0, duration: 1, ease: 'power3.out', stagger: .12,
    scrollTrigger: { trigger: '#s6', start: 'top 62%' },
  });
  gsap.from('.offer__lead', {
    y: 18, opacity: 0, duration: .9, ease: 'power2.out',
    scrollTrigger: { trigger: '#s6', start: 'top 58%' },
  });
  gsap.from('#s6 .facts > div', {
    y: 18, opacity: 0, duration: .7, ease: 'power2.out', stagger: .09,
    scrollTrigger: { trigger: '#s6 .facts', start: 'top 88%' },
  });

  /* фоновые ленты — едут в разные стороны на разной скорости на
     протяжении всей секции, а не только на входе: разница хода и создаёт
     ощущение глубины между текстом и фоном */
  gsap.to('.offer__ticker--a .offer__ticker__track', {
    xPercent: -14, ease: 'none',
    scrollTrigger: { trigger: '#s6', start: 'top bottom', end: 'bottom top', scrub: .6 },
  });
  gsap.to('.offer__ticker--b .offer__ticker__track', {
    xPercent: 9, ease: 'none',
    scrollTrigger: { trigger: '#s6', start: 'top bottom', end: 'bottom top', scrub: .6 },
  });

  /* ─── 02 · регион: текст проявляется, фото идёт параллаксом ─── */
  gsap.from(['.region__lead', '.region__sub'], {
    y: 22, opacity: 0, duration: 1, ease: 'power3.out', stagger: .12,
    scrollTrigger: { trigger: '#s2', start: 'top 60%' },
  });
  /* фото движется медленнее текста поверх него — разница хода читается как
     глубина, тот же приём, что у .hero__ghost в прологе. 8% запаса в CSS
     (top/bottom: -8%) — ровно под этот сдвиг, без него снизу открывался бы
     край без изображения */
  gsap.to('.region__photo', {
    yPercent: 6, ease: 'none',
    scrollTrigger: { trigger: '#s2', start: 'top bottom', end: 'bottom top', scrub: .6 },
  });
  /* скоуп через #s2 обязателен: с тех пор как у секции условий (#s6)
     появился свой .facts, общий селектор '.facts' брал бы первый по DOM
     и триггерил факты обеих секций одним и тем же скроллом */
  gsap.from('#s2 .facts > div', {
    y: 18, opacity: 0, duration: .7, ease: 'power2.out', stagger: .09,
    scrollTrigger: { trigger: '#s2 .facts', start: 'top 88%' },
  });

  /* ─── 03 · направления ─── */
  gsap.from('.dir', {
    y: 34, opacity: 0, duration: .85, ease: 'power3.out', stagger: .12,
    scrollTrigger: { trigger: '.dirs', start: 'top 76%' },
  });

  /* ─── 04 · работа: подводка построчно, следом кейс ─── */
  gsap.from('.work__lead .reveal', {
    yPercent: 100, opacity: 0, duration: .95, ease: 'power3.out', stagger: .13,
    scrollTrigger: { trigger: '#s4', start: 'top 62%' },
  });
  gsap.from('.rule', {
    scaleX: 0, transformOrigin: 'left center', duration: 1, ease: 'power3.out',
    scrollTrigger: { trigger: '#s4', start: 'top 55%' },
  });
  /* два кейса теперь стоят друг под другом — триггер по классу берёт
     только первый элемент, поэтому проигрываем реveal на каждый .work__case
     отдельно, иначе второй кейс появляется без анимации */
  gsap.utils.toArray('.work__case').forEach((el) => {
    gsap.from(el.querySelector('.work__shot'), {
      y: 36, opacity: 0, duration: 1, ease: 'power3.out',
      scrollTrigger: { trigger: el, start: 'top 82%' },
    });
    gsap.from(el.querySelectorAll('.work__idx, .work__name, .work__kind, .work__desc, .work__link'), {
      y: 18, opacity: 0, duration: .8, ease: 'power2.out', stagger: .09,
      scrollTrigger: { trigger: el, start: 'top 78%' },
    });
  });

  /* ─── 05 · процесс: горизонтальная лента с пиннингом ─── */
  const mm = gsap.matchMedia();

  mm.add('(min-width: 861px)', () => {
    const steps = document.querySelector('.proc__steps');
    const line  = document.getElementById('procLine');
    if (!steps) return;

    const shift = () => Math.max(0, steps.scrollWidth - window.innerWidth + 40);

    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: '#s5',
        start: 'top top',
        end: () => '+=' + (shift() + window.innerHeight * .5),
        pin: true,
        scrub: .8,
        invalidateOnRefresh: true,
        /* секция условий (#s6) теперь идёт СРАЗУ ПОСЛЕ пиннинга — её
           реальное положение на странице зависит от финальной высоты
           спейсера пина. Без refreshPriority GSAP на refresh() меряет
           триггеры в порядке создания и считает позицию #s6 до того, как
           спейсер досчитан (то есть по старой, короткой высоте) — из-за
           этого лента застревала в самом начале своего диапазона и
           выглядела статичной. Более высокий приоритет заставляет этот
           пин пересчитаться первым */
        refreshPriority: 1,
      },
    });

    tl.to(steps, { x: () => -shift(), ease: 'none' }, 0);
    if (line) tl.fromTo(line, { width: '0%' }, { width: '100%', ease: 'none' }, 0);

    return () => { gsap.set(steps, { clearProps: 'x' }); };
  });

  mm.add('(max-width: 860px)', () => {
    gsap.from('.step', {
      y: 28, opacity: 0, duration: .7, ease: 'power2.out', stagger: .1,
      scrollTrigger: { trigger: '.proc__steps', start: 'top 82%' },
    });
    const line = document.getElementById('procLine');
    if (line) {
      gsap.fromTo(line, { height: '0%' }, {
        height: '100%', ease: 'none',
        scrollTrigger: { trigger: '.proc__track', start: 'top 70%', end: 'bottom 70%', scrub: .6 },
      });
    }
  });

  /* ─── 07 · лабиринт: единственный путь прорисовывается к центру ─── */
  const labPath = document.querySelector('.lab-path');
  if (labPath) {
    gsap.set(labPath, { strokeDasharray: 1000, strokeDashoffset: 1000 });
    /* одинаковый scrollTrigger-диапазон для линии и для подсветки надписи —
       если завести их раздельными триггерами, при любом будущем расхождении
       стартов/концов свет включится раньше или позже конца линии и разрушит
       саму метафору «линия доходит — надпись загорается». Объект конфига не
       шарим между двумя вызовами: GSAP пишет служебные поля прямо в него */
    const labRange = () => ({ trigger: '#s7', start: 'top 80%', end: 'bottom bottom', scrub: .7 });
    gsap.to(labPath, { strokeDashoffset: 0, ease: 'none', scrollTrigger: labRange() });

    const labCenter = document.querySelector('.lab__center');
    if (labCenter) {
      gsap.to(labCenter, {
        color: '#FF7700',
        textShadow: '0 0 26px rgba(255, 119, 0, .6)',
        ease: 'none',
        scrollTrigger: labRange(),
      });
    }
  }
  gsap.from(['.lab__slogan', '.lab__c', '.lab__center'], {
    opacity: 0, duration: .9, ease: 'power2.out', stagger: .1,
    scrollTrigger: { trigger: '#s7', start: 'top 55%' },
  });

  /* ─── индикатор 01…07 ─── создаём последним: конец диапазона каждой
     секции берём из уже готового старта следующего триггера, а не из
     пиннинга секции 05 напрямую, иначе индикатор 07 гас раньше конца страницы */
  const rail = document.getElementById('rail');
  const sections = [...document.querySelectorAll('.sec')];
  const railTriggers = [];
  sections.forEach((sec, i) => {
    const link = document.querySelector(`.rail a[href="#${sec.id}"]`);
    if (!link) { railTriggers.push(null); return; }
    // конец диапазона секции = начало следующей (уже посчитанное её же триггером) —
    // не пересчитываем позицию соседа заново через getBoundingClientRect: во время
    // пиннинга секции 05 сырое измерение мимо своего триггера ловит промежуточное
    // состояние спейсера и даёт заниженное число, из-за чего индикатор 07 гас рано
    railTriggers.push(ScrollTrigger.create({
      trigger: sec,
      start: 'top 50%',
      end: () => {
        const nextTrigger = railTriggers[i + 1];
        return nextTrigger ? nextTrigger.start : ScrollTrigger.maxScroll(window);
      },
      onToggle: (self) => {
        link.classList.toggle('is-current', self.isActive);
        if (self.isActive) rail.classList.toggle('on-paper', sec.dataset.theme === 'paper');
      },
    }));
  });

  ScrollTrigger.refresh();

  // шрифты догружаются асинхронно (display=swap) и после подмены могут
  // на пиксель сдвинуть высоту секций — пересчитываем позиции триггеров,
  // когда шрифты точно готовы, иначе индикатор 01…07 расходится с реальным
  // концом страницы (последняя секция не загоралась)
  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(() => ScrollTrigger.refresh());
  }
};
