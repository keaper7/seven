/* Прелоадер: счётчик идёт не до ста, а до кода региона — 00 → 07. */

window.SEVEN = window.SEVEN || {};

SEVEN.preloader = function initPreloader(onDone) {
  const root  = document.getElementById('preloader');
  const count = document.getElementById('preloaderCount');
  const bar   = document.getElementById('preloaderBar');

  if (!root || !count) { onDone && onDone(); return; }

  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const finish = () => {
    root.classList.add('is-done');
    document.documentElement.classList.add('is-ready');
    onDone && onDone();
    setTimeout(() => root.remove(), 1200);
  };

  if (reduced) {
    count.textContent = '07';
    count.classList.add('is-final');
    finish();
    return;
  }

  const STEP = 190;          // мс на цифру
  let n = 0;

  const advance = () => {
    count.textContent = String(n).padStart(2, '0');
    if (bar) bar.style.width = (n / 7 * 100) + '%';

    if (n === 7) {
      count.classList.add('is-final');
      setTimeout(finish, 620);
      return;
    }
    n += 1;
    setTimeout(advance, STEP);
  };

  advance();
};
