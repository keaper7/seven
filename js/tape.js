/* Лента-сантиметр: главный предмет сайта.

   Лента — цепочка точек на интеграторе Верле. Соседние точки держатся
   на постоянном расстоянии, поэтому лента не тянется, а через одну —
   мягче, чтобы на изгибах она не ломалась в острый угол. Пока ленту
   никто не трогает, каждая точка понемногу возвращается на своё место
   в форме, которую задаёт страница (на первом экране — цифра 7).

   Тень рисуется на отдельном canvas в четверть разрешения и
   растягивается CSS: так она мягкая и почти ничего не стоит. Там, где
   ленту приподняли пальцем, тень отходит дальше, и видно, что лента
   оторвалась от бумаги. */

window.SEVEN = window.SEVEN || {};

(function () {
  const TAU = Math.PI * 2;

  /* полилиния в форме семёрки: перекладина, скруглённый угол, диагональ */
  function sevenPath(x0, y0, xR, xE, yE, r) {
    const dx = xE - xR, dy = yE - y0, dl = Math.hypot(dx, dy);
    const d2 = [dx / dl, dy / dl];
    const phi = Math.acos(Math.max(-1, Math.min(1, d2[0])));   // поворот от горизонтали
    const t = r * Math.tan(phi / 2);
    const T1 = [xR - t, y0];
    const T2 = [xR + d2[0] * t, y0 + d2[1] * t];
    const C = [T1[0], T1[1] + r];
    const a0 = -Math.PI / 2;
    let a1 = Math.atan2(T2[1] - C[1], T2[0] - C[0]);
    while (a1 < a0) a1 += TAU;
    const pts = [[x0, y0], T1];
    for (let i = 1; i < 18; i++) {
      const a = a0 + (a1 - a0) * i / 18;
      pts.push([C[0] + Math.cos(a) * r, C[1] + Math.sin(a) * r]);
    }
    pts.push(T2, [xE, yE]);
    return pts;
  }

  /* точка на полилинии по длине дуги */
  function sampler(pts) {
    const cum = [0];
    for (let i = 1; i < pts.length; i++) {
      cum.push(cum[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]));
    }
    const total = cum[cum.length - 1];
    const at = (s) => {
      let i = 1;
      while (i < cum.length - 1 && cum[i] < s) i++;
      const f = (s - cum[i - 1]) / ((cum[i] - cum[i - 1]) || 1);
      return [pts[i - 1][0] + (pts[i][0] - pts[i - 1][0]) * f, pts[i - 1][1] + (pts[i][1] - pts[i - 1][1]) * f];
    };
    return { total, at };
  }

  class Tape {
    /* host — блок, в котором лежит лента (в нём два canvas);
       layout(W, H) возвращает { pts, w } — форму покоя и ширину ленты;
       area — элемент, который ловит касания (по умолчанию host) */
    constructor(host, { layout, area, onPull, colors, still } = {}) {
      this.host = host;
      this.area = area || host;
      this.layout = layout;
      this.onPull = onPull;
      this.col = Object.assign({
        tape: '#F07F2E', edge: 'rgba(120, 48, 8, .38)', ink: 'rgba(26, 26, 26, .92)',
        shadow: 'rgba(48, 30, 12, .34)', contact: 'rgba(70, 34, 8, .22)',
      }, colors || {});
      this.sh = host.querySelector('.tape__sh');
      this.cv = host.querySelector('.tape__main');
      this.ctx = this.cv.getContext('2d');
      this.sctx = this.sh.getContext('2d');
      this.reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
      this.grab = -1;
      this.home = 0;
      this.homeMax = .03;
      this.wait = 0;
      this.running = false;
      this.visible = true;
      this.fx = 0; this.fy = 0;
      this.loop = this.loop.bind(this);
      if (!still) this.bind();          // still — лента только рисуется, без касаний
    }

    /* пересчёт формы под размер блока; intro — лента падает на бумагу */
    build(intro) {
      const W = this.host.clientWidth, H = this.host.clientHeight;
      if (!W || !H) return;
      this.W = W; this.H = H;
      this.dpr = Math.min(window.devicePixelRatio || 1, 2);
      this.cv.width = Math.round(W * this.dpr);
      this.cv.height = Math.round(H * this.dpr);
      this.SS = 4;
      this.sh.width = Math.ceil(W / this.SS);
      this.sh.height = Math.ceil(H / this.SS);

      const L = this.layout(W, H);
      if (!L) return;
      this.w = L.w;
      this.unit = L.w * .36;     // «сантиметр» ленты
      this.tip = L.w * .42;      // металлический наконечник

      const S = sampler(L.pts);
      const seg = Math.max(6, this.w * .3);
      const N = Math.max(8, Math.round(S.total / seg) + 1);
      this.N = N;
      this.seg = S.total / (N - 1);
      this.total = S.total;
      this.x = new Float32Array(N); this.y = new Float32Array(N);
      this.px = new Float32Array(N); this.py = new Float32Array(N);
      this.rx = new Float32Array(N); this.ry = new Float32Array(N);
      this.lift = new Float32Array(N);
      this.bend = new Float32Array(N);
      this.nx = new Float32Array(N); this.ny = new Float32Array(N);
      for (let i = 0; i < N; i++) {
        const p = S.at(i * this.seg);
        this.rx[i] = p[0]; this.ry[i] = p[1];
      }
      for (let i = 0; i < N - 2; i++) {
        this.bend[i] = Math.hypot(this.rx[i + 2] - this.rx[i], this.ry[i + 2] - this.ry[i]);
      }
      /* границы, за которые ленту не утащить: поле блока, но не уже самой формы */
      const m = this.w * .5;
      let x0 = m, x1 = W - m, y0 = m, y1 = H - m;
      for (let i = 0; i < N; i++) {
        x0 = Math.min(x0, this.rx[i]); x1 = Math.max(x1, this.rx[i]);
        y0 = Math.min(y0, this.ry[i]); y1 = Math.max(y1, this.ry[i]);
      }
      this.bounds = [x0, x1, y0, y1];

      for (let i = 0; i < N; i++) {
        this.x[i] = this.px[i] = this.rx[i];
        this.y[i] = this.py[i] = this.ry[i];
        this.lift[i] = 0;
      }
      if (intro && !this.reduced) {
        /* появление: лента вытягивается вдоль семёрки от нулевой отметки,
           как из рулетки, деления пробегают одно за другим */
        this.reveal = 0;
        this.t0 = null;
        this.revealing = true;
        this.start();
      } else {
        this.reveal = this.total;
        this.revealing = false;
        if (intro) this.host.classList.add('is-ready');
        this.draw();
      }
    }

    start() {
      if (this.running || !this.visible) return;
      this.running = true;
      requestAnimationFrame(this.loop);
    }

    loop(now) {
      if (!this.running) return;
      if (this.revealing) {
        if (this.t0 == null) this.t0 = now;
        const q = Math.min(1, (now - this.t0) / 1700);
        const e = q < .5 ? 4 * q * q * q : 1 - Math.pow(-2 * q + 2, 3) / 2;
        this.reveal = this.tip * 2.2 + (this.total - this.tip * 2.2) * e;
        this.draw();
        if (q < 1) { requestAnimationFrame(this.loop); return; }
        this.finishReveal();
        this.running = false;
        return;
      }
      this.step();
      this.draw();
      if (this.settled()) { this.running = false; this.draw(); return; }
      requestAnimationFrame(this.loop);
    }

    settled() {
      if (this.grab >= 0 || this.home <= 0) return false;
      let err = 0, v = 0, lf = 0;
      for (let i = 0; i < this.N; i++) {
        err = Math.max(err, Math.abs(this.x[i] - this.rx[i]) + Math.abs(this.y[i] - this.ry[i]));
        v = Math.max(v, Math.abs(this.x[i] - this.px[i]) + Math.abs(this.y[i] - this.py[i]));
        lf = Math.max(lf, this.lift[i]);
      }
      if (err < .3 && v < .06 && lf < .01) {
        for (let i = 0; i < this.N; i++) {
          this.x[i] = this.px[i] = this.rx[i];
          this.y[i] = this.py[i] = this.ry[i];
          this.lift[i] = 0;
        }
        return true;
      }
      return false;
    }

    step() {
      const { N, x, y, px, py, rx, ry } = this;
      const g = this.grab;
      const damp = g >= 0 ? .9 : .86;

      if (g < 0) {
        if (this.wait > 0) this.wait -= 1;
        else this.home = Math.min(this.homeMax, this.home + .0012);
      } else {
        this.home = 0;
      }

      for (let i = 0; i < N; i++) {
        if (i === g) continue;
        const vx = (x[i] - px[i]) * damp, vy = (y[i] - py[i]) * damp;
        px[i] = x[i]; py[i] = y[i];
        x[i] += vx + (rx[i] - x[i]) * this.home;
        y[i] += vy + (ry[i] - y[i]) * this.home;
      }
      if (g >= 0) {
        px[g] = x[g]; py[g] = y[g];
        x[g] += (this.fx - x[g]) * .55;
        y[g] += (this.fy - y[g]) * .55;
      }

      const seg = this.seg, bend = this.bend;
      const c = (i, j, rest, k) => {
        const dx = x[j] - x[i], dy = y[j] - y[i];
        const d = Math.hypot(dx, dy) || 1e-6;
        const wi = i === g ? 0 : 1, wj = j === g ? 0 : 1, s = wi + wj;
        if (!s) return;
        const f = (d - rest) / d * k / s;
        x[i] += dx * f * wi; y[i] += dy * f * wi;
        x[j] -= dx * f * wj; y[j] -= dy * f * wj;
      };
      for (let it = 0; it < 12; it++) {
        for (let i = 0; i < N - 1; i++) c(i, i + 1, seg, 1);
        for (let i = 0; i < N - 2; i++) c(i, i + 2, bend[i], .1);
      }

      const [bx0, bx1, by0, by1] = this.bounds;
      for (let i = 0; i < N; i++) {
        if (x[i] < bx0) x[i] = bx0 * .5 + x[i] * .5;
        if (x[i] > bx1) x[i] = bx1 * .5 + x[i] * .5;
        if (y[i] < by0) y[i] = by0 * .5 + y[i] * .5;
        if (y[i] > by1) y[i] = by1 * .5 + y[i] * .5;
      }

      for (let i = 0; i < N; i++) {
        const t = g >= 0 ? Math.exp(-Math.abs(i - g) / 12) : 0;
        this.lift[i] += (t - this.lift[i]) * .14;
      }
    }

    /* положение и нормаль в точке на расстоянии s от начала ленты */
    at(s) {
      const f = Math.max(0, Math.min(this.N - 1.0001, s / this.seg));
      const i = Math.floor(f), t = f - i;
      return [
        this.x[i] + (this.x[i + 1] - this.x[i]) * t,
        this.y[i] + (this.y[i + 1] - this.y[i]) * t,
        this.nx[i] + (this.nx[i + 1] - this.nx[i]) * t,
        this.ny[i] + (this.ny[i + 1] - this.ny[i]) * t,
      ];
    }

    finishReveal() {
      this.revealing = false;
      this.reveal = this.total;
      this.host.classList.add('is-ready');
      this.draw();
    }

    draw() {
      const { N, x, y, nx, ny, lift, w } = this;
      if (!N) return;
      for (let i = 0; i < N; i++) {
        const a = Math.max(0, i - 1), b = Math.min(N - 1, i + 1);
        let tx = x[b] - x[a], ty = y[b] - y[a];
        const l = Math.hypot(tx, ty) || 1;
        tx /= l; ty /= l;
        nx[i] = -ty; ny[i] = tx;
      }
      const h = w / 2;

      /* видимая часть ленты: при появлении она растёт от нуля до конца */
      const L = Math.min(this.total, this.reveal == null ? this.total : this.reveal);
      const P = [];
      const kMax = Math.min(N - 1, Math.floor(L / this.seg + 1e-6));
      for (let i = 0; i <= kMax; i++) P.push([x[i], y[i], nx[i], ny[i], lift[i]]);
      if (L - kMax * this.seg > .5) {
        const e = this.at(L);
        P.push([e[0], e[1], e[2], e[3], lift[kMax]]);
      }
      const M = P.length;

      /* тень — в четверть разрешения, CSS растягивает её мягко */
      const s = this.sctx, k = 1 / this.SS;
      s.setTransform(k, 0, 0, k, 0, 0);
      s.clearRect(0, 0, this.W, this.H);
      s.beginPath();
      for (let i = 0; i < M; i++) {
        const p = P[i], ox = 1.5 + p[4] * 7, oy = 3.5 + p[4] * 16;
        s.lineTo(p[0] + p[2] * h + ox, p[1] + p[3] * h + oy);
      }
      for (let i = M - 1; i >= 0; i--) {
        const p = P[i], ox = 1.5 + p[4] * 7, oy = 3.5 + p[4] * 16;
        s.lineTo(p[0] - p[2] * h + ox, p[1] - p[3] * h + oy);
      }
      s.closePath();
      s.fillStyle = this.col.shadow;
      s.fill();

      const c = this.ctx, d = this.dpr;
      c.setTransform(d, 0, 0, d, 0, 0);
      c.clearRect(0, 0, this.W, this.H);

      const edge = (sign, off) => {
        c.beginPath();
        const q = (h - off) * sign;
        for (let i = 0; i < M; i++) c.lineTo(P[i][0] + P[i][2] * q, P[i][1] + P[i][3] * q);
      };
      const body = (dx, dy) => {
        c.beginPath();
        for (let i = 0; i < M; i++) c.lineTo(P[i][0] + P[i][2] * h + dx, P[i][1] + P[i][3] * h + dy);
        for (let i = M - 1; i >= 0; i--) c.lineTo(P[i][0] - P[i][2] * h + dx, P[i][1] - P[i][3] * h + dy);
        c.closePath();
      };

      /* контактная тень: тонкая и плотная, прижимает ленту к бумаге */
      body(0, 1.1);
      c.fillStyle = this.col.contact;
      c.fill();

      body(0, 0);
      c.fillStyle = this.col.tape;
      c.fill();
      c.lineWidth = 1;
      c.strokeStyle = this.col.edge;
      edge(1, .5); c.stroke();
      edge(-1, .5); c.stroke();
      c.strokeStyle = 'rgba(255, 236, 214, .32)';
      edge(-1, 1.8); c.stroke();

      /* деления: сантиметры длиннее, полсантиметра короче, с обоих краёв */
      const unit = this.unit, tip = this.tip, end = L - tip;
      c.beginPath();
      for (let m = 0; ; m++) {
        const sd = tip + m * unit / 2;
        if (sd > end - 1) break;
        const [px, py, qx, qy] = this.at(sd);
        const len = (m % 2 ? .15 : .27) * w;
        c.moveTo(px + qx * h, py + qy * h);
        c.lineTo(px + qx * (h - len), py + qy * (h - len));
        c.moveTo(px - qx * h, py - qy * h);
        c.lineTo(px - qx * (h - len), py - qy * (h - len));
      }
      c.strokeStyle = this.col.ink;
      c.lineWidth = .9;
      c.stroke();

      c.fillStyle = this.col.ink;
      c.textAlign = 'center';
      c.textBaseline = 'middle';
      const fs = Math.max(7, Math.round(w * .25));
      for (let n = 1; ; n++) {
        const sd = tip + n * unit;
        if (sd > end - unit * .4) break;
        const [px, py, qx, qy] = this.at(sd);
        c.font = (n % 10 ? '600 ' : '800 ') + fs + 'px Onest, system-ui, sans-serif';
        c.save();
        c.translate(px, py);
        c.rotate(Math.atan2(-qx, qy));     // текст идёт вдоль ленты
        c.fillText(String(n), 0, .5);
        c.restore();
      }

      /* металлические наконечники на обоих концах */
      const cap = (s0, s1) => {
        const a = this.at(s0), b = this.at(s1), e = h + .8;
        c.beginPath();
        c.moveTo(a[0] + a[2] * e, a[1] + a[3] * e);
        c.lineTo(b[0] + b[2] * e, b[1] + b[3] * e);
        c.lineTo(b[0] - b[2] * e, b[1] - b[3] * e);
        c.lineTo(a[0] - a[2] * e, a[1] - a[3] * e);
        c.closePath();
        const gr = c.createLinearGradient(a[0] + a[2] * e, a[1] + a[3] * e, a[0] - a[2] * e, a[1] - a[3] * e);
        gr.addColorStop(0, '#d9d7d1');
        gr.addColorStop(.45, '#a9a69f');
        gr.addColorStop(1, '#8b8880');
        c.fillStyle = gr;
        c.fill();
        c.strokeStyle = 'rgba(40, 38, 34, .35)';
        c.stroke();
        const m = this.at((s0 + s1) / 2);
        c.fillStyle = 'rgba(60, 58, 52, .55)';
        for (const side of [-.42, .42]) {
          c.beginPath();
          c.arc(m[0] + m[2] * h * side, m[1] + m[3] * h * side, Math.max(1, w * .045), 0, TAU);
          c.fill();
        }
      };
      cap(0, tip);
      cap(L - tip, L);
    }

    /* сквозняк: свободный конец ленты на миг приподнимается и ложится
       обратно. Так видно, что это настоящая лента, которую можно тянуть */
    nudge(k = 1) {
      if (!this.N || this.grab >= 0 || this.revealing || this.reduced) return;
      const N = this.N, from = Math.floor(N * .6), span = N - 1 - from;
      for (let i = from; i < N; i++) {
        const f = Math.pow((i - from) / span, 1.7);
        this.x[i] += this.nx[i] * this.w * .28 * k * f;
        this.y[i] += this.ny[i] * this.w * .28 * k * f;
        this.lift[i] = Math.max(this.lift[i], .75 * k * f);
      }
      this.wait = 0;
      this.home = Math.max(this.home, .02);
      this.start();
    }

    /* ближайшая к точке узловая точка ленты, если касание попало на ленту */
    hit(px, py, pad) {
      let best = -1, bd = Infinity;
      for (let i = 0; i < this.N; i++) {
        const d = Math.hypot(this.x[i] - px, this.y[i] - py);
        if (d < bd) { bd = d; best = i; }
      }
      return bd < this.w * .5 + pad ? best : -1;
    }

    local(cx, cy) {
      const r = this.host.getBoundingClientRect();
      return [cx - r.left, cy - r.top];
    }

    down(i, p) {
      if (this.revealing) this.finishReveal();
      this.grab = i;
      this.fx = p[0]; this.fy = p[1];
      this.homeMax = .03;
      this.host.classList.add('is-dragging', 'is-touched');
      if (this.tid != null && navigator.vibrate) { try { navigator.vibrate(8); } catch (e) { /* нет вибро */ } }
      if (this.onPull) { this.onPull(); this.onPull = null; }
      this.start();
    }

    up() {
      if (this.grab < 0) return;
      this.grab = -1;
      this.wait = 50;           // ~0,8 с лента лежит как бросили, потом собирается
      this.home = 0;
      this.host.classList.remove('is-dragging');
      this.start();
    }

    bind() {
      const area = this.area;

      /* касание: прокрутку отменяем только если палец попал на ленту —
         в остальных местах страница листается как обычно */
      area.addEventListener('touchstart', (e) => {
        if (this.grab >= 0 || e.touches.length > 1) return;
        const t = e.changedTouches[0];
        const p = this.local(t.clientX, t.clientY);
        const i = this.hit(p[0], p[1], 14);
        if (i < 0) return;
        e.preventDefault();
        this.tid = t.identifier;
        this.down(i, p);
      }, { passive: false });
      window.addEventListener('touchmove', (e) => {
        if (this.grab < 0) return;
        for (const t of e.changedTouches) {
          if (t.identifier !== this.tid) continue;
          e.preventDefault();
          const p = this.local(t.clientX, t.clientY);
          this.fx = p[0]; this.fy = p[1];
        }
      }, { passive: false });
      const tend = (e) => {
        for (const t of e.changedTouches) if (t.identifier === this.tid) this.up();
      };
      window.addEventListener('touchend', tend);
      window.addEventListener('touchcancel', tend);

      area.addEventListener('mousedown', (e) => {
        if (e.button !== 0) return;
        const p = this.local(e.clientX, e.clientY);
        const i = this.hit(p[0], p[1], 4);
        if (i < 0) return;
        e.preventDefault();
        this.tid = null;
        this.down(i, p);
      });
      window.addEventListener('mousemove', (e) => {
        const p = this.local(e.clientX, e.clientY);
        if (this.grab >= 0) { this.fx = p[0]; this.fy = p[1]; return; }
        if (p[1] < -40 || p[1] > this.H + 40) return;
        const over = this.hit(p[0], p[1], 4) >= 0;
        if (over !== this.over) { this.over = over; area.classList.toggle('is-grab', over); }
      });
      window.addEventListener('mouseup', () => this.up());

      /* за экраном лента не считается */
      if ('IntersectionObserver' in window) {
        new IntersectionObserver(([en]) => {
          this.visible = en.isIntersecting;
          if (this.visible && !this.running && (this.revealing || (this.grab < 0 && this.home > 0))) this.start();
          if (!this.visible) this.running = false;
        }).observe(this.host);
      }
    }
  }

  SEVEN.Tape = Tape;
  SEVEN.sevenPath = sevenPath;
})();
