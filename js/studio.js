/* Мастерская в финале страницы.

   Человек семь раз отмеряет макет — на экране семь замеров, на стикере
   семь чёрточек, — потом один раз пишет код, и на мониторе открывается
   готовый сайт с оранжевой семёркой. На мониторе спит кот. Сцена живёт
   сама по себе и от прокрутки не зависит; пока её не видно, ничего не
   считается.

   Руки — два звена с углами в плече и локте, позы рассчитаны обратной
   кинематикой. Концы ленты на шее и хвост кота — цепочки точек на
   интеграторе Верле, как большая лента на обложке. */

(() => {
  const fig = document.getElementById('studio');
  if (!fig) return;
  const svg = fig.querySelector('svg');
  const NS = 'http://www.w3.org/2000/svg';
  const $ = (id) => document.getElementById(id);
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const DEG = Math.PI / 180;
  const r2 = (v) => Math.round(v * 100) / 100;
  const rnd = (a, b) => a + Math.random() * (b - a);
  const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
  const io = (q) => (q < .5 ? 4 * q * q * q : 1 - Math.pow(-2 * q + 2, 3) / 2);
  const out = (q) => 1 - Math.pow(1 - q, 3);
  const mk = (tag, attrs, parent) => {
    const e = document.createElementNS(NS, tag);
    for (const k in attrs) e.setAttribute(k, attrs[k]);
    if (parent) parent.appendChild(e);
    return e;
  };
  const set = (e, k, v) => e.setAttribute(k, v);

  /* ── скелет ── */
  const HIP = [118, 148];
  const UP = 29, FORE = 30;                      // плечо и предплечье
  const SH_N = [4.5, -42], SH_F = [1.5, -43];    // плечевые суставы, координаты туловища
  const P = { lean: 10, head: 3, nA: 60, nB: 20, fA: 60, fB: 20, recline: 0, smile: 0, curl: 14, breath: 0 };

  /* точка туловища в координатах сцены */
  const torsoPt = (p, lean = P.lean, br = P.breath) => {
    const a = lean * DEG, c = Math.cos(a), s = Math.sin(a);
    const x = p[0], y = p[1] * (1 + br);
    return [HIP[0] + x * c - y * s, HIP[1] + x * s + y * c];
  };

  /* обратная кинематика: углы плеча и предплечья, чтобы кисть пришла в T.
     bend — в какую сторону гнётся локоть */
  const solve = (lean, sh, T, bend = 1) => {
    const S = torsoPt(sh, lean, 0);
    const th = Math.atan2(T[1] - S[1], T[0] - S[0]);
    const d = clamp(Math.hypot(T[0] - S[0], T[1] - S[1]), Math.abs(UP - FORE) + .01, UP + FORE - .01);
    const A = Math.acos(clamp((UP * UP + d * d - FORE * FORE) / (2 * UP * d), -1, 1));
    const a = th + bend * A;
    const E = [S[0] + Math.cos(a) * UP, S[1] + Math.sin(a) * UP];
    const W = [S[0] + Math.cos(th) * d, S[1] + Math.sin(th) * d];
    return [a / DEG, Math.atan2(W[1] - E[1], W[0] - E[0]) / DEG];
  };
  const pose = (lean, head, nT, fT, bend, extra) => {
    const n = solve(lean, SH_N, nT, bend), f = solve(lean, SH_F, fT, bend);
    return Object.assign({ lean, head, nA: n[0], nB: n[1], fA: f[0], fB: f[1], recline: 0, smile: 0, curl: 14 }, extra);
  };
  const MOUSE_T = [182.6, 129.6];
  const POSE = {
    type: pose(10, 3, [166.6, 128.6], [160.6, 128.2], 1),
    mouse: pose(12, 0, MOUSE_T, [160, 128.6], 1, { curl: 6 }),
    stretch: pose(-7, -12, [108.5, 46.5], [103, 48.5], -1, { recline: -5, smile: 1, curl: -6 }),
    relax: pose(-10, -5, [140, 139.6], [136, 139.2], 1, { recline: -7, smile: .7, curl: 24 }),
  };
  Object.assign(P, POSE.relax);

  /* ── плавные переходы: любой объект, любые числовые поля ── */
  const tweens = [];
  const tween = (obj, target, dur, ease = io, delay = 0) => {
    for (const tw of tweens) if (tw.obj === obj) for (const k in target) delete tw.target[k];
    tweens.push({ obj, target: Object.assign({}, target), from: {}, t: -delay, dur, ease, started: false });
  };
  const runTweens = (dt) => {
    for (let i = tweens.length - 1; i >= 0; i--) {
      const tw = tweens[i];
      tw.t += dt;
      if (tw.t < 0) continue;
      if (!tw.started) { tw.started = true; for (const k in tw.target) tw.from[k] = tw.obj[k]; }
      const q = Math.min(1, tw.t / tw.dur), e = tw.ease(q);
      for (const k in tw.target) tw.obj[k] = tw.from[k] + (tw.target[k] - tw.from[k]) * e;
      if (q >= 1) tweens.splice(i, 1);
    }
  };
  const posePart = (p) => ({ lean: p.lean, head: p.head, nA: p.nA, nB: p.nB, fA: p.fA, fB: p.fB, recline: p.recline, smile: p.smile, curl: p.curl });

  /* ── элементы сцены ── */
  const torso = $('stTorso'), head = $('stHead'), chairBack = $('stChairBack');
  const eye = $('stEye'), mouth = $('stMouth'), lens = $('stLens'), glint = $('stGlint');
  const armN = $('stArmN'), cuffN = $('stCuffN'), handN = $('stHandN');
  const armF = $('stArmF'), cuffF = $('stCuffF'), handF = $('stHandF');
  const shoe = $('stShoe'), mouse = svg.querySelector('.st-mouse');
  const scr = { fig: $('stFig'), code: $('stCode'), site: $('stSite') };
  const board = $('stBoard'), wipe = $('stSiteWipe');
  const cursor = $('stCursor'), caret = $('stCaret'), linesHost = $('stLines');
  const tally = Array.from($('stTally').children);
  const catBody = $('stCatBody'), catHead = $('stCatHead');
  const catShut = $('stCatShut'), catOpen = $('stCatOpen');
  const pupL = $('stPupL'), pupR = $('stPupR'), earL = $('stEarL'), earR = $('stEarR');
  const tail = $('stTail'), phone = $('stPhone');

  /* семёрка на готовом сайте: деления по обоим краям ленты */
  (() => {
    const pts = [[266, 70], [298, 70], [284, 111]], h = 5.6 / 2 - .9;
    const side = (k) => {
      const o = [];
      for (let i = 0; i < pts.length; i++) {
        const a = pts[Math.max(0, i - 1)], b = pts[Math.min(pts.length - 1, i + 1)];
        let nx = -(b[1] - a[1]), ny = b[0] - a[0];
        const l = Math.hypot(nx, ny);
        nx /= l; ny /= l;
        const m = i > 0 && i < pts.length - 1 ? 1 / Math.cos(Math.acos(clamp(
          ((pts[i][0] - a[0]) * (b[0] - pts[i][0]) + (pts[i][1] - a[1]) * (b[1] - pts[i][1])) /
          (Math.hypot(pts[i][0] - a[0], pts[i][1] - a[1]) * Math.hypot(b[0] - pts[i][0], b[1] - pts[i][1])), -1, 1)) / 2) : 1;
        o.push([pts[i][0] + nx * h * k * m, pts[i][1] + ny * h * k * m]);
      }
      return 'M' + o.map((p) => r2(p[0]) + ' ' + r2(p[1])).join('L');
    };
    svg.querySelector('.st-site-ticks').setAttribute('d', side(1) + side(-1));
  })();

  /* ── семь замеров на макете ── */
  const msHost = $('stMeasures');
  const MS = [
    [[251, 63.4], [285, 63.4]],
    [[288.6, 66], [288.6, 116]],
    [[254.5, 71.3], [276.5, 71.3]],
    [[252.9, 73], [252.9, 85.6]],
    [[256, 93.3], [268, 93.3]],
    [[269.7, 94.6], [269.7, 106]],
    [[254, 114.8], [282, 114.8]],
  ].map(([a, b]) => {
    const g = mk('g', { class: 'st-ms' }, msHost);
    const hor = a[1] === b[1];
    const tick = (p) => (hor ? `M${p[0]} ${p[1] - 1.2}V${p[1] + 1.2}` : `M${p[0] - 1.2} ${p[1]}H${p[0] + 1.2}`);
    mk('path', { d: tick(a) }, g);
    const line = mk('path', { d: `M${a[0]} ${a[1]}` }, g);
    mk('path', { class: 'st-ms__end', d: tick(b) }, g);
    const at = mk('g', { transform: `translate(${(a[0] + b[0]) / 2} ${(a[1] + b[1]) / 2})` }, g);
    const k = mk('g', { class: 'st-ms__k' }, at);
    mk('rect', { class: 'st-ms__pill', x: -3.4, y: -1.5, width: 6.8, height: 3, rx: 1.5 }, k);
    mk('rect', { class: 'st-ms__t', x: -2, y: -.45, width: 4, height: .9, rx: .45 }, k);
    g.style.opacity = 0;
    return { g, a, b, line };
  });

  /* ── код: отступ и куски строки (тег, атрибут, строка, текст, ключевое слово) ── */
  const CODE = [
    [0, 't5 a6 s9'],
    [1, 't3 p20 t4'],
    [1, 't2 p16'],
    [1, 't4 a5 s8 p6'],
    [0, 't6'],
    [0, ''],
    [0, 'k8 p2'],
    [1, 'a9 s12'],
    [1, 'a7 o7'],
    [1, 'a8 s5'],
    [0, 'p2'],
    [0, ''],
    [0, 'k5 a6 p3'],
    [1, 'k4 p12'],
    [0, 'p2'],
  ];
  const LH = 6.1, CX = 222, CY = 62, ROWS = 9;
  const lines = CODE.map(([ind, spec], k) => {
    const y = CY + k * LH;
    const num = mk('rect', { class: 'c-n', x: 212.4, y: y + .25, width: k < 9 ? 2.2 : 3.6, height: 1.6, rx: .8, opacity: 0 }, linesHost);
    let x = CX + ind * 4.4;
    const segs = spec ? spec.split(' ').map((tok) => {
      const w = parseFloat(tok.slice(1));
      const s = { r: mk('rect', { class: 'c-' + tok[0], x, y, width: 0, height: 2.1, rx: 1.05 }, linesHost), x, w, cur: 0 };
      x += w + 1.6;
      return s;
    }) : [];
    return { num, segs, y, x0: CX + ind * 4.4 };
  });

  /* ── цепочки точек: концы ленты и хвост ── */
  const chain = (n, seg) => ({ n, seg, x: new Float64Array(n), y: new Float64Array(n), px: new Float64Array(n), py: new Float64Array(n) });
  const T_N = chain(11, 4), TAIL = chain(10, 4.2);
  const A_N = [14.8, -47.4];                    // где конец ленты уходит с шеи       // где концы ленты уходят с шеи
  const TAIL0 = [303.2, 47.6];
  const hang = (c, p) => {
    for (let i = 0; i < c.n; i++) { c.x[i] = c.px[i] = p[0] + i * .2; c.y[i] = c.py[i] = p[1] + i * c.seg; }
  };
  hang(T_N, torsoPt(A_N)); hang(TAIL, TAIL0);

  /* передний край свитера в координатах туловища: лента лежит на груди, не проходит сквозь неё */
  const FRONT = [[-50, 11], [-47, 13.6], [-44, 15.4], [-39, 17], [-27, 18], [-11, 17.2], [4, 16.2]];
  const front = (y) => {
    for (let i = 1; i < FRONT.length; i++) {
      if (y <= FRONT[i][0]) {
        const [y0, x0] = FRONT[i - 1], [y1, x1] = FRONT[i];
        return x0 + (x1 - x0) * clamp((y - y0) / (y1 - y0), 0, 1);
      }
    }
    return FRONT[FRONT.length - 1][1];
  };
  const onChest = (c, i) => {
    const a = P.lean * DEG, cs = Math.cos(a), sn = Math.sin(a);
    const dx = c.x[i] - HIP[0], dy = c.y[i] - HIP[1];
    const lx = dx * cs + dy * sn, ly = -dx * sn + dy * cs;
    if (ly < -50 || ly > 4) return;
    const fx = front(ly) + 2.1;
    if (lx < fx) { c.x[i] = HIP[0] + fx * cs - ly * sn; c.y[i] = HIP[1] + fx * sn + ly * cs; }
  };

  const stepChain = (c, g, damp, pin1, extra, collide, bendK) => {
    for (let i = pin1 ? 2 : 1; i < c.n; i++) {
      const vx = (c.x[i] - c.px[i]) * damp, vy = (c.y[i] - c.py[i]) * damp;
      c.px[i] = c.x[i]; c.py[i] = c.y[i];
      c.x[i] += vx + (extra ? extra(i) : 0);
      c.y[i] += vy + g;
    }
    const first = pin1 ? 2 : 1;
    for (let it = 0; it < 6; it++) {
      for (let i = 0; i < c.n - 1; i++) {
        const dx = c.x[i + 1] - c.x[i], dy = c.y[i + 1] - c.y[i];
        const d = Math.hypot(dx, dy) || 1e-6, f = (d - c.seg) / d;
        if (i + 1 < first) continue;
        if (i < first) { c.x[i + 1] -= dx * f; c.y[i + 1] -= dy * f; } else {
          c.x[i] += dx * f * .5; c.y[i] += dy * f * .5;
          c.x[i + 1] -= dx * f * .5; c.y[i + 1] -= dy * f * .5;
        }
      }
      if (bendK) {
        for (let i = 0; i < c.n - 2; i++) {
          const dx = c.x[i + 2] - c.x[i], dy = c.y[i + 2] - c.y[i];
          const d = Math.hypot(dx, dy) || 1e-6, f = (d - c.seg * 1.96) / d * bendK;
          if (d > c.seg * 1.96) continue;
          if (i + 2 < first) continue;
          if (i < first) { c.x[i + 2] -= dx * f; c.y[i + 2] -= dy * f; } else {
            c.x[i] += dx * f * .5; c.y[i] += dy * f * .5;
            c.x[i + 2] -= dx * f * .5; c.y[i + 2] -= dy * f * .5;
          }
        }
      }
      if (collide) for (let i = 1; i < c.n; i++) collide(c, i);
    }
  };

  /* гладкая кривая через точки (Катмулл — Ром) */
  const smooth = (pts) => {
    let d = `M${r2(pts[0][0])} ${r2(pts[0][1])}`;
    for (let i = 0; i < pts.length - 1; i++) {
      const p0 = pts[Math.max(0, i - 1)], p1 = pts[i], p2 = pts[i + 1], p3 = pts[Math.min(pts.length - 1, i + 2)];
      d += `C${r2(p1[0] + (p2[0] - p0[0]) / 6)} ${r2(p1[1] + (p2[1] - p0[1]) / 6)} ${r2(p2[0] - (p3[0] - p1[0]) / 6)} ${r2(p2[1] - (p3[1] - p1[1]) / 6)} ${r2(p2[0])} ${r2(p2[1])}`;
    }
    return d;
  };
  const normals = (pts) => pts.map((p, i) => {
    const a = pts[Math.max(0, i - 1)], b = pts[Math.min(pts.length - 1, i + 1)];
    const tx = b[0] - a[0], ty = b[1] - a[1], l = Math.hypot(tx, ty) || 1;
    return [-ty / l, tx / l];
  });
  const ptsOf = (c) => { const o = []; for (let i = 0; i < c.n; i++) o.push([c.x[i], c.y[i]]); return o; };

  const tapeEls = [$('stTapeN'), $('stTicksN'), $('stTipN')];
  const drawTape = (c, [band, ticks, tip]) => {
    const pts = ptsOf(c), nr = normals(pts);
    set(band, 'd', smooth(pts));
    const off = (k) => smooth(pts.map((p, i) => [p[0] + nr[i][0] * k, p[1] + nr[i][1] * k]));
    set(ticks, 'd', off(1.25) + off(-1.25));
    const n = c.n - 1, ux = c.x[n] - c.x[n - 1], uy = c.y[n] - c.y[n - 1], ul = Math.hypot(ux, uy) || 1;
    set(tip, 'd', `M${r2(c.x[n] - ux / ul * 2.4)} ${r2(c.y[n] - uy / ul * 2.4)}L${r2(c.x[n])} ${r2(c.y[n])}`);
  };
  const drawTail = () => {
    const pts = ptsOf(TAIL), nr = normals(pts), n = pts.length;
    const w = (i) => 2.35 - 1.05 * (i / (n - 1));
    const L = pts.map((p, i) => [p[0] + nr[i][0] * w(i), p[1] + nr[i][1] * w(i)]);
    const R = pts.map((p, i) => [p[0] - nr[i][0] * w(i), p[1] - nr[i][1] * w(i)]).reverse();
    const e = w(n - 1);
    set(tail, 'd', smooth(L) + `A${r2(e)} ${r2(e)} 0 0 0 ${r2(R[0][0])} ${r2(R[0][1])}` + smooth(R).replace(/^M[^C]*/, '') + 'Z');
  };

  /* ── руки ── */
  const drawArm = (sh, A, B, path, cuff, hand) => {
    const S = torsoPt(sh), a = A * DEG, b = B * DEG;
    const E = [S[0] + Math.cos(a) * UP, S[1] + Math.sin(a) * UP];
    const ux = Math.cos(b), uy = Math.sin(b);
    const W = [E[0] + ux * (FORE - 1), E[1] + uy * (FORE - 1)];
    set(path, 'd', `M${r2(S[0])} ${r2(S[1])}L${r2(E[0])} ${r2(E[1])}L${r2(W[0])} ${r2(W[1])}`);
    set(cuff, 'd', `M${r2(W[0] - ux * 2.6)} ${r2(W[1] - uy * 2.6)}L${r2(W[0] + ux * .6)} ${r2(W[1] + uy * .6)}`);
    set(hand, 'transform', `translate(${r2(W[0] + ux * .4)} ${r2(W[1] + uy * .4)}) rotate(${r2(B + P.curl)})`);
  };

  /* ── состояние ── */
  const S = {
    t: 0, look: 0, lookT: 0, lid: 1, blinkAt: rnd(1.5, 4), tapN: 0, tapF: 0,
    follow: false, drag: null, cursorOn: false, caretOn: false, caretBlink: 0, typedAt: -1,
    bright: 1, tapFoot: 0, buzz: 0, phoneLook: false,
  };
  const cur = { x: 268, y: 90 }, CUR0 = { x: 268, y: 90 };
  const brd = { x: 0, o: 1 }, scroll = { y: 0 }, wp = { h: 62 };
  const cat = { aw: 0, awT: 0, until: 0, look: [0, 0], lookT: [0, 0], ear: [0, 0], earAt: rnd(2, 6), flick: 0, lid: 1, blinkAt: 0 };

  const show = (name) => { for (const k in scr) scr[k].classList.toggle('is-on', k === name); };
  const key = (near, big) => {
    if (near) S.tapN = big ? 8 : 4.2; else S.tapF = 4.2;
    S.typedAt = S.t;
  };
  const catWake = (dur, look) => {
    cat.awT = 1;
    cat.until = S.t + dur;
    cat.lookT = look;
    cat.flick = 1;
  };

  /* ── сюжет: пришло сообщение, семь раз отмерим, один раз сделаем ── */
  function* message() {
    S.buzz = .6;
    phone.classList.add('is-on');
    yield .4;
    S.phoneLook = true;
    yield 1.5;
    S.phoneLook = false;
    yield .5;
    phone.classList.remove('is-on');
  }

  function* measure() {
    show('fig');
    MS.forEach((m) => { m.g.classList.remove('is-on'); m.g.style.opacity = 0; set(m.line, 'd', `M${m.a[0]} ${m.a[1]}`); });
    tally.forEach((t) => t.classList.remove('is-on'));
    brd.x = 26; brd.o = 0;
    tween(brd, { x: 0, o: 1 }, .6, out);
    cur.x = CUR0.x; cur.y = CUR0.y;
    tween(P, posePart(POSE.mouse), .7);
    S.bright = .45;
    yield .4;
    S.cursorOn = true;
    yield .35;
    S.follow = true;
    for (let i = 0; i < MS.length; i++) {
      const m = MS[i];
      tween(cur, { x: m.a[0], y: m.a[1] }, .3);
      yield .34;
      m.g.style.opacity = 1;
      S.drag = m;
      tween(cur, { x: m.b[0], y: m.b[1] }, .36);
      yield .38;
      S.drag = null;
      set(m.line, 'd', `M${m.a[0]} ${m.a[1]}L${m.b[0]} ${m.b[1]}`);
      m.g.classList.add('is-on');
      tally[i].classList.add('is-on');
      yield i === 4 ? .5 : .14;
    }
    tween(cur, { x: 300, y: 104 }, .45);
    yield .55;
    S.follow = false;
    S.cursorOn = false;
  }

  function* code() {
    show('code');
    lines.forEach((l) => { set(l.num, 'opacity', 0); l.segs.forEach((s) => { s.cur = 0; set(s.r, 'width', 0); }); });
    scroll.y = 0;
    S.caretOn = true;
    S.caret = [lines[0].x0, lines[0].y];
    tween(P, posePart(POSE.type), .55);
    S.bright = .12;
    yield .7;
    for (let li = 0; li < lines.length; li++) {
      const L = lines[li];
      set(L.num, 'opacity', 1);
      if (li >= ROWS) tween(scroll, { y: (li - ROWS + 1) * LH }, .22, out);
      S.caret = [L.x0, L.y];
      for (const s of L.segs) {
        while (s.cur < s.w) {
          s.cur = Math.min(s.w, s.cur + 2.6);
          set(s.r, 'width', r2(s.cur));
          S.caret = [s.x + s.cur + .5, L.y];
          key(Math.random() < .55);
          yield rnd(.045, .1);
        }
        if (Math.random() < .3) yield rnd(.12, .32);
      }
      key(true, true);
      yield rnd(.14, .34);
    }
    yield .35;
    S.caretOn = false;
  }

  function* done() {
    wp.h = 0;
    show('site');
    tween(wp, { h: 62 }, .8, out);
    S.bright = 1;
    yield .3;
    tween(P, posePart(POSE.stretch), .9);
    yield .5;
    catWake(3.2, [-.4, .7]);
    yield .9;
    tween(P, posePart(POSE.relax), 1.1);
    yield 3.4;
  }

  function* story() {
    for (;;) { yield* message(); yield* measure(); yield* code(); yield* done(); }
  }

  /* ── кадр ── */
  const physics = (h) => {
    const t = S.t;
    const an = torsoPt(A_N);
    T_N.x[0] = an[0]; T_N.y[0] = an[1];
    stepChain(T_N, .16, .955, false, null, onChest);
    /* хвост: основание покачивается, по хвосту бежит волна */
    const aw = cat.aw;
    const base = (62 + Math.sin(t * 1.3) * (6 + aw * 10)) * DEG;
    TAIL.x[0] = TAIL0[0]; TAIL.y[0] = TAIL0[1];
    TAIL.x[1] = TAIL0[0] + Math.cos(base) * TAIL.seg; TAIL.y[1] = TAIL0[1] + Math.sin(base) * TAIL.seg;
    const amp = .045 + aw * .07;
    stepChain(TAIL, .11, .93, true, (i) => Math.sin(t * 2.1 - i * .55) * amp * (i / TAIL.n) + (cat.flick > 0 && i > 6 ? cat.flick * .9 : 0), null, .22);
    cat.flick = Math.max(0, cat.flick - h * 3);
  };

  const render = () => {
    const br = P.breath;
    set(torso, 'transform', `translate(118 148) rotate(${r2(P.lean)}) scale(1 ${(1 + br).toFixed(4)})`);
    set(head, 'transform', `translate(6.8 -52.6) rotate(${r2(P.head + S.look)})`);
    set(chairBack, 'transform', `rotate(${r2(P.recline)} 106 152.6)`);
    set(eye, 'transform', `translate(13.5 -14.4) scale(1 ${S.lid.toFixed(3)}) translate(-13.5 14.4)`);
    const sm = P.smile;
    set(mouth, 'd', `M${r2(14 - sm * .3)} ${r2(-7.3 - sm * .3)}Q15 ${r2(-6.9 + sm * 1.3)} ${r2(15.9 + sm * .2)} ${r2(-7.3 - sm * .4)}`);
    set(lens, 'fill-opacity', (.07 + S.bright * .2).toFixed(3));
    set(glint, 'opacity', (.25 + S.bright * .6).toFixed(3));

    drawArm(SH_F, P.fA, P.fB + S.tapF, armF, cuffF, handF);
    drawArm(SH_N, P.nA, P.nB + S.tapN, armN, cuffN, handN);
    set(shoe, 'transform', `rotate(${r2(-S.tapFoot * 9)} 156 205)`);
    drawTape(T_N, tapeEls);
    drawTail();

    /* экран */
    set(board, 'transform', `translate(${r2(brd.x)} 0)`);
    set(board, 'opacity', r2(brd.o));
    set(cursor, 'transform', `translate(${r2(cur.x)} ${r2(cur.y)})`);
    cursor.style.opacity = S.cursorOn ? 1 : 0;
    if (S.drag) set(S.drag.line, 'd', `M${S.drag.a[0]} ${S.drag.a[1]}L${r2(cur.x)} ${r2(cur.y)}`);
    const mx = S.follow ? (cur.x - CUR0.x) * .09 : 0;
    set(mouse, 'transform', `translate(${r2(mx)} 0)`);
    linesHost.setAttribute('transform', `translate(0 ${r2(-scroll.y)})`);
    if (S.caret) {
      set(caret, 'x', r2(S.caret[0]));
      set(caret, 'y', r2(S.caret[1] - .65 - scroll.y));
      const idle = S.t - S.typedAt > .45;
      set(caret, 'opacity', S.caretOn && (!idle || Math.sin(S.t * 7.5) > -.2) ? 1 : 0);
    }
    set(wipe, 'height', r2(wp.h));
    set(phone, 'transform', S.buzz > 0 ? `translate(${r2(Math.sin(S.t * 95) * .45)} 0)` : '');

    /* кот */
    const aw = cat.aw;
    set(catBody, 'transform', `translate(0 52.4) scale(1 ${(1 + Math.sin(S.t * 2.1) * (.028 - aw * .012)).toFixed(4)}) translate(0 -52.4)`);
    set(catHead, 'transform', `translate(0 ${r2(-aw * 1.8)}) rotate(${r2(-aw * 3 + cat.look[1] * 4)} 241 50)`);
    const open = aw > .5 && cat.lid > .5;
    catShut.style.opacity = open ? 0 : 1;
    catOpen.style.opacity = open ? 1 : 0;
    set(pupL, 'transform', `translate(${r2(cat.look[0] * 2.6)} ${r2(cat.look[1] * 1.6)})`);
    set(pupR, 'transform', `translate(${r2(cat.look[0] * 2.6)} ${r2(cat.look[1] * 1.6)})`);
    set(earL, 'transform', `rotate(${r2(-cat.ear[0] * 14 + (1 - aw) * 4)} 234.7 33)`);
    set(earR, 'transform', `rotate(${r2(cat.ear[1] * 14 - (1 - aw) * 4)} 246.3 33)`);
  };

  show('site');
  const story$ = story();
  let wait = 0, acc = 0;
  const update = (dt) => {
    S.t += dt;
    wait -= dt;
    let guard = 0;
    while (wait <= 0 && guard++ < 64) wait += story$.next().value || 0;
    runTweens(dt);

    /* мышью водит правая рука; голова следит за курсором или за строкой */
    if (S.follow) {
      const T = [MOUSE_T[0] + (cur.x - CUR0.x) * .09, MOUSE_T[1] + (cur.y - CUR0.y) * .06];
      const n = solve(P.lean, SH_N, T, 1);
      P.nA = n[0]; P.nB = n[1];
      S.lookT = clamp((cur.y - 88) * .2, -4, 5) + clamp((cur.x - 268) * .05, -2, 2);
    } else if (S.phoneLook) {
      S.lookT = 15;
    } else if (S.caretOn && S.caret) {
      S.lookT = clamp((S.caret[1] - scroll.y - 86) * .16, -3, 4);
    } else S.lookT = 0;
    S.look += (S.lookT - S.look) * Math.min(1, dt * 7);

    P.breath = Math.sin(S.t * 1.65) * .011;
    S.buzz = Math.max(0, S.buzz - dt);
    S.tapN *= Math.exp(-dt * 26);
    S.tapF *= Math.exp(-dt * 26);
    /* пока отмеряет, иногда постукивает ногой */
    const tapping = S.cursorOn && Math.sin(S.t * 1.1) > .35;
    S.tapFoot = tapping ? Math.max(0, Math.sin(S.t * 9)) * .9 : S.tapFoot * Math.exp(-dt * 10);

    /* моргает раз в несколько секунд, иногда дважды */
    if (S.t > S.blinkAt) {
      const k = (S.t - S.blinkAt) / .14;
      S.lid = k < 1 ? Math.abs(1 - 2 * k) * .9 + .1 : 1;
      if (k >= 1) S.blinkAt = S.t + (Math.random() < .2 ? .25 : rnd(2.2, 5.5));
    }

    /* кот: просыпается, смотрит, засыпает; уши иногда дёргаются */
    if (cat.awT && S.t > cat.until) cat.awT = 0;
    cat.aw += (cat.awT - cat.aw) * Math.min(1, dt * (cat.awT ? 5 : 2));
    const lk = cat.awT ? cat.lookT : [0, 0];
    cat.look[0] += (lk[0] - cat.look[0]) * Math.min(1, dt * 6);
    cat.look[1] += (lk[1] - cat.look[1]) * Math.min(1, dt * 6);
    if (S.t > cat.earAt) {
      const k = (S.t - cat.earAt) / .32;
      const side = cat.earSide || 0;
      cat.ear[side] = k < 1 ? Math.sin(k * Math.PI) : 0;
      if (k >= 1) { cat.earAt = S.t + rnd(2.5, 7); cat.earSide = Math.random() < .5 ? 0 : 1; }
    }
    if (cat.awT && S.t > cat.blinkAt) {
      const k = (S.t - cat.blinkAt) / .5;
      cat.lid = k < 1 ? (k < .5 ? 0 : 1) : 1;
      if (k >= 1) cat.blinkAt = S.t + rnd(1.2, 2.4);
    }

    acc = Math.min(acc + dt, .1);
    while (acc >= 1 / 60) { physics(1 / 60); acc -= 1 / 60; }
    render();
  };

  /* ── касания: лампа щёлкает, кот просыпается и смотрит на вас ── */
  const hit = (x, y, w, h, fn) => {
    const r = mk('rect', { class: 'st-hit', x, y, width: w, height: h }, svg);
    r.addEventListener('click', fn);
  };
  hit(368, 60, 28, 76, () => fig.classList.toggle('is-dark'));
  hit(224, 25, 82, 30, () => {
    catWake(3.4, [0, 0]);
    cat.blinkAt = S.t + 1.6;
  });

  if (reduced) {
    /* без движения: готовый сайт на экране, человек за клавиатурой */
    Object.assign(P, POSE.type);
    tally.forEach((t) => t.classList.add('is-on'));
    show('site');
    wp.h = 62;
    S.bright = 1;
    for (let i = 0; i < 400; i++) physics(1 / 60);
    render();
    return;
  }

  let vis = false, raf = 0, last = 0;
  const frame = (now) => {
    raf = 0;
    if (!vis) return;
    const dt = Math.min(.05, (now - (last || now)) / 1000);
    last = now;
    update(dt);
    raf = requestAnimationFrame(frame);
  };
  for (let i = 0; i < 240; i++) physics(1 / 60);
  update(0);
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(([e]) => {
      vis = e.isIntersecting;
      fig.classList.toggle('is-paused', !vis);
      if (vis && !raf) { last = 0; raf = requestAnimationFrame(frame); }
    }, { rootMargin: '120px 0px' }).observe(fig);
  } else {
    vis = true;
    raf = requestAnimationFrame(frame);
  }

  window.SEVEN = window.SEVEN || {};
  /* для отладки: SEVEN.studio.ff(5) — промотать сцену на 5 секунд */
  SEVEN.studio = { P, S, cat, ff: (sec) => { for (let i = 0; i < sec * 60; i++) update(1 / 60); } };
})();
