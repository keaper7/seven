/* Сцены по скроллу. Все начальные состояния ставятся из JS —
   если скрипт не выполнится, страница остаётся полностью читаемой. */

window.SEVEN = window.SEVEN || {};

/* ── подгрузка инлайновых SVG (нужен доступ к путям для анимации) ── */
SEVEN.loadSVG = async function loadSVG() {
  const jobs = [
    ['elbrusMount', 'img/elbrus-contours.svg'],
    ['labMount',    'img/labyrinth-07.svg'],
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
  gsap.to(['.hud', '.scroll-hint', '.hero__region'], {
    opacity: 0, ease: 'none',
    scrollTrigger: { trigger: '#s1', start: 'top top', end: '45% top', scrub: .4 },
  });

  /* ─── 02 · точность: буквы собираются, разрядка раскрывается ─── */
  const enLetters = gsap.utils.toArray('.precision__en span');
  if (enLetters.length) {
    gsap.from(enLetters, {
      yPercent: 105, opacity: 0, duration: .9, ease: 'power3.out', stagger: .045,
      scrollTrigger: { trigger: '#s2', start: 'top 62%' },
    });
    gsap.from('.precision__ru', {
      opacity: 0, duration: 1, ease: 'power2.out', delay: .3,
      scrollTrigger: { trigger: '#s2', start: 'top 62%' },
    });
  }

  /* ─── 03 · регион: изолинии Эльбруса прорисовываются ─── */
  const isoPaths = gsap.utils.toArray('.region__map path');
  if (isoPaths.length) {
    gsap.set(isoPaths, { strokeDasharray: 1000, strokeDashoffset: 1000 });
    gsap.to(isoPaths, {
      strokeDashoffset: 0, ease: 'none', stagger: { each: .05, from: 'end' },
      scrollTrigger: { trigger: '#s3', start: 'top 78%', end: 'bottom 60%', scrub: .8 },
    });
  }
  gsap.from('.region__code', {
    yPercent: 8, opacity: 0, duration: 1.1, ease: 'power3.out',
    scrollTrigger: { trigger: '#s3', start: 'top 60%' },
  });
  gsap.from('.facts > div', {
    y: 18, opacity: 0, duration: .7, ease: 'power2.out', stagger: .09,
    scrollTrigger: { trigger: '.facts', start: 'top 88%' },
  });

  /* ─── 04 · направления ─── */
  gsap.from('.dir', {
    y: 34, opacity: 0, duration: .85, ease: 'power3.out', stagger: .12,
    scrollTrigger: { trigger: '.dirs', start: 'top 76%' },
  });

  /* ─── 05 · философия: построчно ─── */
  gsap.from('.phil__title .reveal', {
    yPercent: 100, opacity: 0, duration: .95, ease: 'power3.out', stagger: .13,
    scrollTrigger: { trigger: '#s5', start: 'top 62%' },
  });
  gsap.from('.rule', {
    scaleX: 0, transformOrigin: 'left center', duration: 1, ease: 'power3.out',
    scrollTrigger: { trigger: '#s5', start: 'top 55%' },
  });

  /* ─── 06 · процесс: горизонтальная лента с пиннингом ─── */
  const mm = gsap.matchMedia();

  mm.add('(min-width: 861px)', () => {
    const steps = document.querySelector('.proc__steps');
    const line  = document.getElementById('procLine');
    if (!steps) return;

    const shift = () => Math.max(0, steps.scrollWidth - window.innerWidth + 40);

    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: '#s6',
        start: 'top top',
        end: () => '+=' + (shift() + window.innerHeight * .5),
        pin: true,
        scrub: .8,
        invalidateOnRefresh: true,
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
    gsap.to(labPath, {
      strokeDashoffset: 0, ease: 'none',
      scrollTrigger: { trigger: '#s7', start: 'top 80%', end: 'bottom bottom', scrub: .7 },
    });
  }
  gsap.from(['.lab__slogan', '.lab__c', '.lab__center'], {
    opacity: 0, duration: .9, ease: 'power2.out', stagger: .1,
    scrollTrigger: { trigger: '#s7', start: 'top 55%' },
  });

  /* ─── индикатор 01…07 ─── создаём последним: конец диапазона каждой
     секции берём из уже готового старта следующего триггера, а не из
     пиннинга секции 06 напрямую, иначе индикатор 07 гас раньше конца страницы */
  const rail = document.getElementById('rail');
  const sections = [...document.querySelectorAll('.sec')];
  const railTriggers = [];
  sections.forEach((sec, i) => {
    const link = document.querySelector(`.rail a[href="#${sec.id}"]`);
    if (!link) { railTriggers.push(null); return; }
    // конец диапазона секции = начало следующей (уже посчитанное её же триггером) —
    // не пересчитываем позицию соседа заново через getBoundingClientRect: во время
    // пиннинга секции 06 сырое измерение мимо своего триггера ловит промежуточное
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
