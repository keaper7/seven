/* Заголовки во всю ширину. Каждый .fit подгоняется так, чтобы его
   строка заняла ровно ширину своей колонки: меряем текст на 100px и
   пересчитываем пропорцией. Межбуквенное расстояние задано в em, так
   что масштабируется вместе с кеглем. Без JS остаётся размер из CSS. */

window.SEVEN = window.SEVEN || {};

SEVEN.fit = function initFit() {
  const els = [...document.querySelectorAll('.fit')];
  if (!els.length) return;

  const run = () => {
    els.forEach((el) => {
      const inner = el.firstElementChild;
      if (!inner) return;
      el.style.fontSize = '100px';
      const w = inner.getBoundingClientRect().width;
      const target = el.clientWidth;
      if (w > 0 && target > 0) el.style.fontSize = (100 * target / w * 0.998).toFixed(2) + 'px';
    });
    document.documentElement.classList.add('fit-ok');
  };

  run();
  // шрифт приходит с задержкой — до этого строка мерялась системным
  if (document.fonts) document.fonts.ready.then(run);
  let t = 0;
  addEventListener('resize', () => { clearTimeout(t); t = setTimeout(run, 80); });
};
