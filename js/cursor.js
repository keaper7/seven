/* Курсор-прицел с магнитным притяжением к ссылкам. Только для мыши. */

window.SEVEN = window.SEVEN || {};

SEVEN.cursor = function initCursor() {
  const el = document.getElementById('cursor');
  if (!el) return;
  const ring = el.querySelector('.cursor__ring');
  const dot = el.querySelector('.cursor__dot');

  const fine = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (!fine || reduced) return;

  let mx = innerWidth / 2, my = innerHeight / 2;   // цель — реальная позиция мыши
  let rx = mx, ry = my;                             // текущее положение кольца (с задержкой)

  const place = (node, x, y) => {
    node.style.transform = `translate3d(${x}px, ${y}px, 0) translate(-50%, -50%)`;
  };
  place(dot, mx, my);
  place(ring, rx, ry);

  // точка идёт вместе с курсором без задержки, кольцо летит следом отдельным rAF-циклом
  addEventListener('mousemove', (e) => {
    mx = e.clientX; my = e.clientY;
    place(dot, mx, my);
  }, { passive: true });

  const loop = () => {
    rx += (mx - rx) * 0.18;
    ry += (my - ry) * 0.18;
    place(ring, rx, ry);
    requestAnimationFrame(loop);
  };
  loop();

  // курсор ушёл за пределы окна — прячем оба узла, иначе они повисают
  // на последней известной точке у края экрана
  document.addEventListener('mouseleave', () => el.classList.add('is-hidden'));
  document.addEventListener('mouseenter', () => el.classList.remove('is-hidden'));

  // расширение кольца над интерактивным
  const targets = document.querySelectorAll('a, button, .dir');
  targets.forEach((t) => {
    t.addEventListener('mouseenter', () => el.classList.add('is-active'));
    t.addEventListener('mouseleave', () => el.classList.remove('is-active'));
  });

  // магнит: ссылки слегка тянутся к курсору
  const magnets = document.querySelectorAll('[data-magnet], .rail a, .lab__c');
  magnets.forEach((m) => {
    m.addEventListener('mousemove', (e) => {
      const r = m.getBoundingClientRect();
      const dx = e.clientX - (r.left + r.width / 2);
      const dy = e.clientY - (r.top + r.height / 2);
      m.style.transform = `translate(${dx * 0.22}px, ${dy * 0.3}px)`;
    });
    m.addEventListener('mouseleave', () => { m.style.transform = ''; });
  });
};
