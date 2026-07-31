/* Курсор-прицел с магнитным притяжением к ссылкам. Только для мыши. */

window.SEVEN = window.SEVEN || {};

SEVEN.cursor = function initCursor() {
  const el = document.getElementById('cursor');
  if (!el) return;

  const fine = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (!fine || reduced) return;

  let mx = innerWidth / 2, my = innerHeight / 2;   // цель
  let cx = mx, cy = my;                             // текущее положение

  addEventListener('mousemove', (e) => { mx = e.clientX; my = e.clientY; }, { passive: true });

  const loop = () => {
    cx += (mx - cx) * 0.18;
    cy += (my - cy) * 0.18;
    el.style.transform = `translate3d(${cx}px, ${cy}px, 0)`;
    requestAnimationFrame(loop);
  };
  loop();

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
