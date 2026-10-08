/* seven — сценарий страницы.

   Лента на обложке и у мерок — js/tape.js. Здесь: шапка, меню, размер
   экрана в пятой мерке, разматывание ленты при прокрутке, распечатки
   работ, бирка на гвоздике и плавная прокрутка с мышью.
   GSAP 3.15 + ScrollTrigger, Lenis только для мыши. Если CDN не ответил,
   страница остаётся целиком рабочей: всё видно сразу. */

(() => {
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const root = document.documentElement;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const fine = matchMedia('(hover: hover) and (pointer: fine)').matches;
  const gs = window.gsap;
  const ST = window.ScrollTrigger;
  const live = !!(gs && ST) && !reduced;
  window.SEVEN = window.SEVEN || {};

  const goal = (name) => { try { if (window.ym) window.ym(112505772, 'reachGoal', name); } catch (e) { /* без метрики */ } };
  document.addEventListener('click', (e) => {
    const a = e.target.closest('[data-goal]');
    if (a) goal(a.dataset.goal);
  });

  /* ── мерка 5: настоящий размер экрана того, кто читает ── */
  const size = $('#screenSize');
  const showSize = () => { if (size) size.textContent = innerWidth + ' × ' + innerHeight; };
  showSize();
  addEventListener('resize', showSize, { passive: true });

  /* ── шапка: цвет раздела, который сейчас под ней ── */
  const hd = $('#hd');
  const themed = $$('main > section, .ft');
  let headQueued = false;
  const paintHead = () => {
    headQueued = false;
    const y = hd.offsetHeight / 2;
    let theme = 'light';
    for (const s of themed) {
      const r = s.getBoundingClientRect();
      if (r.top <= y && r.bottom > y) { theme = s.dataset.theme || 'light'; break; }
    }
    if (hd.dataset.theme !== theme) hd.dataset.theme = theme;
    hd.classList.toggle('is-solid', scrollY > 8);
    hd.classList.toggle('on-hero', scrollY < innerHeight * .55);
  };
  addEventListener('scroll', () => {
    if (!headQueued) { headQueued = true; requestAnimationFrame(paintHead); }
  }, { passive: true });
  paintHead();

  /* ── меню ── */
  const burger = $('#burger');
  const menu = $('#menu');
  const setMenu = (open) => {
    root.classList.toggle('menu-open', open);
    burger.setAttribute('aria-expanded', String(open));
    menu.setAttribute('aria-hidden', String(!open));
    menu.inert = !open;
    document.body.style.overflow = open ? 'hidden' : '';
    if (SEVEN.lenis) open ? SEVEN.lenis.stop() : SEVEN.lenis.start();
  };
  menu.inert = true;
  burger.addEventListener('click', () => setMenu(!root.classList.contains('menu-open')));
  menu.addEventListener('click', (e) => { if (e.target.closest('a')) setMenu(false); });
  addEventListener('keydown', (e) => { if (e.key === 'Escape') setMenu(false); });

  /* ── обложка: лента складывается в семёрку ── */
  const hero = $('#top');
  const title = $('#heroTitle');
  const lead = $('#heroLead');
  const cta = $('#heroCta');
  const hint = $('#tapeHint');

  /* ширина ленты — та же формула, что --tw в CSS */
  const tapeW = () => {
    const vw = innerWidth;
    return vw < 900 ? Math.min(40, Math.max(30, vw * .086)) : Math.min(54, Math.max(40, vw * .033));
  };
  const box = (el, base) => {
    const a = el.getBoundingClientRect(), b = base.getBoundingClientRect();
    return { l: a.left - b.left, t: a.top - b.top, r: a.right - b.left, b: a.bottom - b.top };
  };

  let end = null;   // нижний конец семёрки: рядом с ним подсказка
  const heroLayout = (W, H) => {
    const w = tapeW();
    const g = parseFloat(getComputedStyle(hero).paddingLeft) || 20;
    const t = box(title, hero);
    const wide = W >= 900 || W > H * 1.2;
    let x0, y0, xR, xE, yE;
    let r = w * .95;
    if (!wide) {
      /* телефон: семёрка — отдельная крупная цифра в середине экрана,
         между заголовком и кнопкой. Пропорции настоящей «7»: высота
         в полтора раза больше ширины, ножка уходит под наклоном */
      /* телефон: лента — это цифра «7» во фразе «7 дней бесплатных правок».
         Семёрка слева, слово «дней.» справа на одной линии с её низом */
      const f = box($('#heroFacts'), hero);
      const word = box($('.hero__fact b'), hero);
      const base = word.t + (word.b - word.t) * .8;      // базовая линия слова
      let w7 = f.l - 12 - g;
      let h7 = Math.min(base - (f.t + 22) - w, w7 * 1.3);
      w7 = Math.min(w7, h7 / 1.15);
      x0 = g;
      xR = x0 + w7;
      yE = base + w * .1;           // нижний срез ленты садится на базовую линию слова
      y0 = yE - h7;
      xE = x0 + w7 * .2;
      r = w * .55;
      /* слово встаёт вплотную к ножке цифры — читается «7 дней», а не «картинка + текст» */
      const fact = $('.hero__fact');
      const diagAt = (y) => xE + (yE - y) / (yE - y0) * (xR - xE);
      const wordX = Math.max(xE + w * .6 + 14, diagAt(word.t) + w / 2 + 12);
      /* вся связка «7 дней» встаёт по центру экрана */
      const prev = parseFloat((fact.style.transform.match(/-?[\d.]+/) || [0])[0]) || 0;
      const factLeft0 = word.l - prev;                       // где слово стоит без сдвига
      const rng = document.createRange();
      rng.selectNodeContents(fact);
      const factW = Math.min(rng.getBoundingClientRect().width, W - 2 * g);
      const groupL = x0, groupR = Math.max(xR + w / 2, wordX + factW);
      const dx = Math.max(0, (W - (groupR - groupL)) / 2 - groupL);
      x0 += dx; xR += dx; xE += dx;
      fact.style.transform = 'translateX(' + Math.round(wordX + dx - factLeft0) + 'px)';
    } else {
      /* компьютер: семёрка стоит справа от заголовка во всю высоту */
      x0 = Math.max(t.r + 64, W * .53);
      xR = W - g - w / 2;
      y0 = t.t + w * .2;
      yE = H - 40 - w / 2;
      xE = x0 + (xR - x0) * .3;
    }
    end = { x: xE, y: yE, w, wide, k: (xE - xR) / (yE - y0) };
    return { pts: SEVEN.sevenPath(x0, y0, xR, xE, yE, r), w };
  };

  /* подсказка встаёт в пустое место между текстом и кнопкой, стрелкой к ленте */
  const placeHint = () => {
    if (!end || !hint) return;
    const l = box(lead, hero), c = box(cta, hero);
    const hw = hint.offsetWidth || 150, hh = hint.offsetHeight || 40;
    let y, x;
    let flip = false;
    if (end.wide) {
      /* справа от нижнего конца ленты, стрелкой влево; если тесно — слева */
      y = end.y - hh - 6;
      x = end.x + end.w / 2 + 26;
      flip = true;
      if (x + hw > hero.clientWidth - 16) { x = end.x - end.w / 2 - 26 - hw; flip = false; }
    } else {
      /* телефон: справа от ножки семёрки, у её нижнего конца, стрелкой к ленте */
      y = end.y - hh - 4;
      x = end.x + end.w / 2 + 18;
      flip = true;
      /* на совсем узком экране места нет — подсказку не показываем */
      hint.hidden = x + hw > hero.clientWidth - 10;
    }
    hint.classList.toggle('is-flip', flip);
    hint.style.left = Math.round(x) + 'px';
    hint.style.top = Math.round(y) + 'px';
  };

  const heroTape = SEVEN.heroTape = SEVEN.Tape && hero
    ? new SEVEN.Tape($('#heroTape'), { layout: heroLayout, area: hero, onPull: () => { goal('tape_pull'); root.classList.add('tape-touched'); } })
    : null;

  /* пока ленту не трогали, её свободный конец иногда приподнимает
     сквозняком — видно, что это настоящая лента и её можно потянуть */
  if (heroTape && !reduced) {
    const draft = () => {
      setTimeout(draft, 5200 + Math.random() * 3800);
      if (root.classList.contains('tape-touched') || document.hidden || scrollY > innerHeight * .5) return;
      heroTape.nudge(.8 + Math.random() * .5);
    };
    setTimeout(draft, 4600);
  }

  /* ── глава 1: лента у мерок разматывается при прокрутке ── */
  const mkBody = $('#mk');
  const mkTape = $('#mkTape');
  const mkStrip = $('#mkStrip');
  const roll = $('#mkRoll');
  const items = $$('.mk__item');
  const mkW = () => (innerWidth < 900 ? 28 : 36);
  const strip = SEVEN.Tape && mkTape
    ? new SEVEN.Tape($('#mkTapeHost'), {
      still: true,
      layout: (W, H) => {
        const w = mkW(), x = 24 + w / 2;
        return { pts: [[x, 24], [x, H - 24]], w };
      },
    })
    : null;
  let pins = [];
  const buildPins = () => {
    pins.forEach((p) => p.el.remove());
    const top = mkTape.offsetTop;
    pins = items.map((it) => {
      const h = $('h3', it);
      const y = it.offsetTop + h.offsetTop + h.offsetHeight / 2 - top;
      const el = document.createElement('i');
      el.className = 'mk__pin';
      el.style.top = y + 'px';
      mkTape.appendChild(el);
      return { el, y, on: false };
    });
  };
  const mkState = { p: 0 };
  const renderMk = () => {
    const H = mkTape.offsetHeight;
    const y = mkState.p * H;
    const R = roll.offsetWidth / 2 || 27;
    mkStrip.style.setProperty('--p', y.toFixed(1) + 'px');
    roll.style.transform = 'translateY(' + y.toFixed(1) + 'px) rotate(' + (y / R).toFixed(3) + 'rad)';
    pins.forEach((pin, i) => {
      const on = y >= pin.y - 2;
      if (on === pin.on) return;
      pin.on = on;
      pin.el.classList.toggle('is-on', on);
      items[i].classList.toggle('is-on', on);
    });
  };

  /* ── первый кадр: ждём шрифты, чтобы лента легла по готовому тексту ── */
  const fontsReady = document.fonts && document.fonts.load
    ? Promise.all([
      document.fonts.load('700 40px Unbounded'),
      document.fonts.load('300 40px Unbounded'),
      document.fonts.load('600 10px Onest'),
      document.fonts.load('800 10px Onest'),
    ]).catch(() => {})
    : Promise.resolve();

  let lastW = innerWidth;
  const rebuild = () => {
    if (heroTape) heroTape.build(false);
    placeHint();
    if (strip) strip.build(false);
    if (mkTape) buildPins();
    if (live) renderMk();
  };

  Promise.race([fontsReady, new Promise((r) => setTimeout(r, 1800))]).then(() => {
    root.classList.add('is-in');
    requestAnimationFrame(() => {
      if (heroTape) heroTape.build(true);
      placeHint();
      if (strip) strip.build(false);
      if (mkTape) buildPins();
      if (live) {
        start();
      } else {
        items.forEach((it) => it.classList.add('is-on'));
        $$('.srv__item').forEach((it) => it.classList.add('is-in'));
      }
    });
  });

  /* семёрка привязана к слову «дней»: если текст сдвинулся (догрузился
     шрифт, повернули экран), перекладываем ленту под него */
  const anchor = $('.hero__fact b');
  if (anchor && 'ResizeObserver' in window) {
    let lastTop = null;
    new ResizeObserver(() => {
      const t = Math.round(anchor.getBoundingClientRect().top + scrollY);
      if (lastTop !== null && t !== lastTop && heroTape && heroTape.N && !heroTape.revealing && heroTape.grab < 0) {
        heroTape.build(false); placeHint();
      }
      lastTop = t;
    }).observe(document.getElementById('heroFacts'));
  }

  /* если шрифт догрузился уже после того, как лента легла, раскладываем заново */
  if (document.fonts && document.fonts.addEventListener) {
    document.fonts.addEventListener('loadingdone', () => {
      if (heroTape && heroTape.N && !heroTape.revealing && heroTape.grab < 0) rebuild();
    });
  }

  let rz;
  addEventListener('resize', () => {
    clearTimeout(rz);
    rz = setTimeout(() => {
      if (Math.abs(innerWidth - lastW) < 2 && !fine) return;   // на телефоне это прячется адресная строка
      lastW = innerWidth;
      rebuild();
      if (live) ST.refresh();
    }, 180);
  });

  /* ── бирка с составом: висит на гвоздике и качается от прокрутки ── */
  const tag = $('#tag');
  if (tag && !reduced) {
    let th = 0, om = 0, yPrev = scrollY, vPrev = 0, vs = 0, run = false, vis = false;
    const tick = () => {
      const y = SEVEN.lenis ? SEVEN.lenis.scroll : scrollY;
      const v = y - yPrev;
      yPrev = y;
      /* бирку качает не сам рывок прокрутки, а сглаженное изменение её
         скорости, и толчок ограничен: при быстрой прокрутке она мягко
         отклоняется и возвращается, а не болтается по экрану */
      vs += (Math.max(-60, Math.min(60, v)) - vs) * .12;
      const a = Math.max(-1.6, Math.min(1.6, vs - vPrev));
      vPrev = vs;
      om += a * .0016 - Math.sin(th) * .012;
      om *= .94;
      th += om;
      const MAX = .13;                          // не больше ~7,5°
      tag.style.transform = 'rotate(' + (MAX * Math.tanh(th / MAX)).toFixed(4) + 'rad)';
      if (vis && (Math.abs(om) > 2e-5 || Math.abs(th) > 2e-4 || Math.abs(vs) > .05)) requestAnimationFrame(tick);
      else run = false;
    };
    const kick = () => {
      if (run || !vis) return;
      run = true;
      yPrev = SEVEN.lenis ? SEVEN.lenis.scroll : scrollY;
      vPrev = vs = 0;
      requestAnimationFrame(tick);
    };
    addEventListener('scroll', kick, { passive: true });
    new IntersectionObserver(([e]) => {
      vis = e.isIntersecting;
      if (vis) { om += .012; kick(); }
    }).observe(tag);
    let sx = null;
    tag.addEventListener('pointerdown', (e) => { sx = e.clientX; });
    tag.addEventListener('pointermove', (e) => {
      if (sx === null) return;
      om += (e.clientX - sx) * .0016;
      sx = e.clientX;
      kick();
    });
    /* бирку время от времени чуть качает сквозняком, даже если страница стоит */
    const breeze = () => {
      setTimeout(breeze, 3800 + Math.random() * 3600);
      if (!vis || document.hidden || Math.abs(om) > .002) return;
      om += (Math.random() < .5 ? -1 : 1) * (.0024 + Math.random() * .0018);
      kick();
    };
    setTimeout(breeze, 3000);
    const release = () => { sx = null; };
    tag.addEventListener('pointerup', release);
    tag.addEventListener('pointercancel', release);
    tag.addEventListener('pointerleave', release);
  }

  /* ── работы: замкнутая лента, которая листается шагами. Плавно подвозит
     следующую работу и даёт её прочитать; касание — пауза подольше,
     протяжка пальцем или мышью — и лента встаёт ровно на работу ── */
  const wkList = $('#wkList');
  const wkTrack = $('#wkTrack');
  if (wkTrack && !reduced) {
    root.classList.add('mq-live');
    wkList.scrollLeft = 0;          // до запуска ряд листался нативно и мог «прилипнуть» к краю карточки
    const orig = Array.from(wkTrack.children);
    orig.forEach((n) => {
      const c = n.cloneNode(true);
      c.setAttribute('aria-hidden', 'true');
      c.querySelectorAll('a').forEach((a) => { a.tabIndex = -1; });
      wkTrack.appendChild(c);
    });
    const HOLD = () => (innerWidth < 900 ? 2.6 : 2.4);   // сколько стоит каждая работа, с
    const GLIDE = .95;                                   // переезд к следующей, с
    const AFTER_TOUCH = 5;                               // пауза после касания, с
    const ease = (q) => (q < .5 ? 4 * q * q * q : 1 - Math.pow(-2 * q + 2, 3) / 2);
    let step = 1, setW = 1, x = 0;
    let mode = 'hold', wait = HOLD(), from = 0, to = 0, q = 0, dur = GLIDE;
    let last = 0, run = false, vis = false, hover = false;
    let drag = false, sx = 0, x0 = 0, moved = 0, px = 0, pt = 0, vel = 0;
    const measure = () => {
      step = wkTrack.children[1].offsetLeft - wkTrack.children[0].offsetLeft || 1;
      setW = step * orig.length;
      x = Math.round(x / step) * step;
    };
    const wrap = () => {
      while (x <= -setW) { x += setW; from += setW; to += setW; x0 += setW; }
      while (x > 0) { x -= setW; from -= setW; to -= setW; x0 -= setW; }
    };
    const glideTo = (target, d) => { mode = 'glide'; from = x; to = target; q = 0; dur = d; };
    const frame = (t) => {
      const dt = Math.min(.05, (t - (last || t)) / 1000);
      last = t;
      if (!drag) {
        if (mode === 'hold') {
          if (!hover) wait -= dt;
          if (wait <= 0) glideTo(Math.round(x / step) * step - step, GLIDE);
        } else {
          q = Math.min(1, q + dt / dur);
          x = from + (to - from) * ease(q);
          if (q >= 1) { x = to; mode = 'hold'; wait = Math.max(wait, HOLD()); }
        }
      }
      wrap();
      wkTrack.style.transform = 'translate3d(' + x.toFixed(2) + 'px,0,0)';
      /* куда едут работы: за ними следит кот за кнопкой ниже */
      SEVEN.wkDir = drag ? Math.max(-1, Math.min(1, vel / 500)) : mode === 'glide' ? Math.sign(to - from) * Math.sin(Math.PI * q) : 0;
      if (vis) requestAnimationFrame(frame); else { run = false; last = 0; }
    };
    const go = () => { if (!run && vis) { run = true; requestAnimationFrame(frame); } };
    new IntersectionObserver(([e]) => { vis = e.isIntersecting; go(); }).observe(wkList);
    measure();
    addEventListener('resize', measure);
    addEventListener('load', measure);

    wkList.addEventListener('pointerdown', (e) => {
      if (e.pointerType === 'mouse' && e.button !== 0) return;
      drag = true; moved = 0; sx = px = e.clientX; x0 = x; pt = performance.now(); vel = 0;
      wkList.classList.add('is-drag');
    });
    addEventListener('pointermove', (e) => {
      if (!drag) return;
      const now = performance.now();
      const dx = e.clientX - sx;
      moved = Math.max(moved, Math.abs(dx));
      x = x0 + dx;
      if (now > pt) vel = vel * .5 + ((e.clientX - px) / ((now - pt) / 1000)) * .5;
      px = e.clientX; pt = now;
    });
    const release = () => {
      if (!drag) return;
      drag = false;
      wkList.classList.remove('is-drag');
      /* куда докатится по инерции — к ближайшей работе, но не дальше двух */
      const aim = x + Math.max(-1600, Math.min(1600, vel)) * .22;
      let k = Math.round(aim / step);
      const k0 = Math.round(x0 / step);
      k = Math.max(k0 - 2, Math.min(k0 + 2, k));
      if (moved < 6) k = Math.round(x / step);
      glideTo(k * step, moved < 6 ? .35 : .6);
      wait = AFTER_TOUCH;
    };
    addEventListener('pointerup', release);
    addEventListener('pointercancel', release);   // палец повёл вверх-вниз — это прокрутка страницы
    wkList.addEventListener('click', (e) => { if (moved > 6) { e.preventDefault(); e.stopPropagation(); } }, true);
    if (fine) {
      wkList.addEventListener('mouseenter', () => { hover = true; });
      wkList.addEventListener('mouseleave', () => { hover = false; wait = Math.max(wait, 1.2); });
    }
  }

  /* ── кот за кнопкой «Все работы»: поднимается из-за края, когда
     до кнопки доходят, и следит глазами за проезжающими работами ── */
  const peek = $('#peekCat');
  if (peek && !reduced) {
    const btn = peek.closest('a');
    const head = $('#peekHead'), pupils = $('#peekPupils'), lids = $('#peekLids'), eyes = $('#peekEyes');
    const earL = $('#peekEarL'), earR = $('#peekEarR'), paws = $('#peekPaws');
    let vis = false, run = false, last = 0, t = 0, rise = -1;
    let lx = 0, ly = 0, blinkAt = 2.4, earAt = 3.5, earSide = 0, hover = false;
    const back = (q) => 1 + 2.4 * Math.pow(q - 1, 3) + 1.4 * Math.pow(q - 1, 2);
    peek.style.transform = 'translateY(40px)';
    paws.style.opacity = 0;
    const tick = (now) => {
      const dt = Math.min(.05, (now - (last || now)) / 1000);
      last = now;
      t += dt;
      if (rise < 0) rise = t + .6;                       // поднимается чуть погодя
      const q = Math.max(0, Math.min(1, (t - rise) / .7));
      peek.style.transform = 'translateY(' + ((1 - back(q)) * 40).toFixed(2) + 'px)';
      const pq = Math.max(0, Math.min(1, (t - rise - .5) / .25));
      paws.style.opacity = pq > 0 ? 1 : 0;
      paws.style.transform = 'translateY(' + ((1 - pq) * -3).toFixed(2) + 'px)';
      /* взгляд: за работами, при наведении — на надпись кнопки */
      const tx = hover ? -.85 : (SEVEN.wkDir || 0), ty = hover ? .9 : 0;
      lx += (tx - lx) * Math.min(1, dt * 6);
      ly += (ty - ly) * Math.min(1, dt * 6);
      pupils.style.transform = 'translate(' + (lx * 1.4).toFixed(2) + 'px,' + (ly * 1.1).toFixed(2) + 'px)';
      head.style.transform = 'rotate(' + (lx * 3.5).toFixed(2) + 'deg)';
      /* моргает; уши иногда дёргаются */
      const blink = t > blinkAt && t < blinkAt + .13;
      if (t > blinkAt + .13) blinkAt = t + (Math.random() < .2 ? .3 : 2.4 + Math.random() * 3.6);
      eyes.style.opacity = blink ? 0 : 1;
      lids.style.opacity = blink ? 1 : 0;
      let e = 0;
      if (t > earAt) {
        const k = (t - earAt) / .3;
        e = k < 1 ? Math.sin(k * Math.PI) : 0;
        if (k >= 1) { earAt = t + 2.5 + Math.random() * 5; earSide = Math.random() < .5 ? 0 : 1; }
      }
      earL.style.transform = 'rotate(' + (earSide === 0 ? -e * 14 : 0).toFixed(2) + 'deg)';
      earR.style.transform = 'rotate(' + (earSide === 1 ? e * 14 : 0).toFixed(2) + 'deg)';
      if (vis) requestAnimationFrame(tick); else { run = false; last = 0; }
    };
    new IntersectionObserver(([en]) => {
      vis = en.isIntersecting;
      if (vis && !run) { run = true; requestAnimationFrame(tick); }
    }, { rootMargin: '-8% 0px' }).observe(btn);
    if (fine) {
      btn.addEventListener('mouseenter', () => { hover = true; });
      btn.addEventListener('mouseleave', () => { hover = false; });
    }
  }

  if (SEVEN.faq) SEVEN.faq();

  /* ── движение при прокрутке ── */
  function start() {
    gs.registerPlugin(ST);
    ST.config({ ignoreMobileResize: true });
    root.classList.add('mk-live');

    /* мерки: рулон катится вниз по ленте, мерки «прикалываются» булавками */
    gs.to(mkState, {
      p: 1,
      ease: 'none',
      onUpdate: renderMk,
      scrollTrigger: { trigger: mkBody, start: 'top 62%', end: 'bottom 62%', scrub: .7 },
    });
    renderMk();

    /* заголовки глав «набираются краской»: вес шрифта растёт при прокрутке */
    $$('[data-ink]').forEach((el) => {
      const w = parseFloat(getComputedStyle(el).fontWeight) || 600;
      gs.fromTo(el, { fontWeight: 300 }, {
        fontWeight: w,
        ease: 'none',
        scrollTrigger: { trigger: el, start: 'top 94%', end: 'top 46%', scrub: .5 },
      });
    });

    /* заголовок работ: буквы падают на место по одной, как литеры при наборе */
    const wkTitle = $('#wkTitle');
    if (wkTitle) {
      wkTitle.setAttribute('aria-label', wkTitle.textContent.replace(/\s+/g, ' ').trim());
      wkTitle.querySelectorAll(':scope > span').forEach((line) => {
        line.setAttribute('aria-hidden', 'true');
        line.innerHTML = Array.from(line.textContent).map((ch) => (ch === ' ' ? ' ' : '<span class="ch-l">' + ch + '</span>')).join('');
      });
      const letters = wkTitle.querySelectorAll('.ch-l');
      gs.from(letters, {
        yPercent: -140,
        rotation: () => gs.utils.random(-28, 28),
        autoAlpha: 0,
        duration: .9,
        ease: 'back.out(2.2)',
        stagger: { each: .045, from: 'start' },
        scrollTrigger: { trigger: wkTitle, start: 'top 82%', once: true },
      });
    }

    /* лента работ проявляется, когда до неё доходят */
    gs.from('#wkTrack .wk', { y: 60, autoAlpha: 0, duration: 1.2, stagger: .1, ease: 'expo.out',
      scrollTrigger: { trigger: '#wkList', start: 'top 85%', once: true } });

    /* строки услуг и вопросов поднимаются по одной */
    gs.set('.srv__item, .faq__item, .srv__after', { y: 28, autoAlpha: 0 });
    ST.batch('.srv__item, .faq__item, .srv__after', {
      start: 'top 92%',
      once: true,
      onEnter: (els) => {
        gs.to(els, { y: 0, autoAlpha: 1, duration: 1, stagger: .08, ease: 'expo.out' });
        els.forEach((el, i) => setTimeout(() => el.classList.add('is-in'), i * 120));
      },
    });

    /* плавная прокрутка — только с мышью; на телефоне листается нативно */
    if (fine) {
      const s = document.createElement('script');
      s.src = 'https://cdn.jsdelivr.net/npm/lenis@1.3.26/dist/lenis.min.js';
      s.onload = () => {
        const lenis = new window.Lenis({ lerp: .1, anchors: { offset: -hd.offsetHeight + 1 } });
        SEVEN.lenis = lenis;
        lenis.on('scroll', ST.update);
        gs.ticker.add((t) => lenis.raf(t * 1000));
        gs.ticker.lagSmoothing(0);
      };
      document.head.appendChild(s);
    }

    addEventListener('load', () => ST.refresh());
  }
})();
