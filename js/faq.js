/* Плавное раскрытие частых вопросов.

   Сама механика <details> нативная и работает без этого файла — здесь
   только анимация. Загвоздка в том, что браузер прячет содержимое
   <details> ровно в тот момент, когда снимается атрибут open: закрытие
   получается рывком, каким бы плавным ни был CSS. Поэтому клик по
   заголовку перехватывается, состояние ведёт класс, а сам open снимается
   уже после того, как высота доехала до нуля. */

window.SEVEN = window.SEVEN || {};

/* var(--ease) из base.css — резкий старт, почти плоский хвост: проходит
   весь путь уже к первой трети времени. На открытие это и нужно (снэп),
   но на закрытие тем же значением грид почти сразу проседал до нескольких
   пикселей и потом на глаз «зависал» там до конца transition, прежде чем
   реально дойти до нуля. Зеркальное отражение той же кривой — там, где
   у оригинала быстрый старт и плоский хвост, у зеркала плоский старт и
   быстрый финиш — снимает именно это залипание на закрытии */
const EASE_OPEN = 'cubic-bezier(.22, 1, .36, 1)';
const EASE_CLOSE = 'cubic-bezier(.64, 0, .78, 0)';

SEVEN.faq = function initFaq() {
  const items = document.querySelectorAll('.faq__item');
  if (!items.length) return;

  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduced) return;   // остаётся нативное мгновенное поведение

  // флаг для CSS: пока его нет, раскрытием управляет атрибут open —
  // страница с неотработавшим скриптом остаётся полностью рабочей
  document.documentElement.classList.add('faq-js');

  items.forEach((item) => {
    const summary = item.querySelector('.faq__q');
    const panel = item.querySelector('.faq__a');
    if (!summary || !panel) return;

    if (item.open) item.classList.add('is-open');

    summary.addEventListener('click', (e) => {
      e.preventDefault();

      if (item.open) {
        panel.style.transitionTimingFunction = EASE_CLOSE;
        item.classList.remove('is-open');
        // страховка на случай, если transitionend не придёт (вкладка ушла
        // в фон и анимации не проигрываются) — иначе ответ залипнет открытым
        const close = () => { item.open = false; clearTimeout(timer); };
        const timer = setTimeout(close, 600);
        panel.addEventListener('transitionend', close, { once: true });
      } else {
        panel.style.transitionTimingFunction = EASE_OPEN;
        item.open = true;             // сначала контент попадает в DOM,
        void panel.offsetHeight;      // затем форсируем пересчёт: браузер
        item.classList.add('is-open');// фиксирует нулевую высоту и есть что анимировать
        /* именно синхронный рефлоу, а не requestAnimationFrame: rAF не
           тикает в неактивной вкладке, и ответ раскрывался бы рывком
           (или не раскрывался вовсе) у того, кто вернулся на вкладку */
      }
    });
  });
};
