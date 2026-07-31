/* Магнитное притяжение ссылок к курсору. Только для мыши. */

window.SEVEN = window.SEVEN || {};

SEVEN.cursor = function initCursor() {
  const fine = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (!fine || reduced) return;

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
