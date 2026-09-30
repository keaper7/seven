/* Подбор формата за три вопроса. Итог — готовое сообщение в Telegram:
   человеку не нужно придумывать, с чего начать разговор, а заявка
   приходит уже с контекстом. Работает и без анимаций. */

window.SEVEN = window.SEVEN || {};

SEVEN.quiz = function initQuiz(goal = () => {}) {
  const box = document.getElementById('qz');
  if (!box) return;

  const qs     = [...box.querySelectorAll('.qz__q')];
  const bar    = document.getElementById('qzBar');
  const stepEl = document.getElementById('qzStep');
  const back   = document.getElementById('qzBack');
  const result = document.getElementById('qzResult');
  const planEl = document.getElementById('qzPlan');
  const metaEl = document.getElementById('qzMeta');
  const send   = document.getElementById('qzSend');
  const hint   = document.getElementById('qzHint');
  const again  = document.getElementById('qzAgain');

  const answers = {};
  let catalog = false;
  let cur = 0;
  let started = false;

  const show = (i) => {
    cur = i;
    qs.forEach((q, k) => q.classList.toggle('is-current', k === i));
    const done = i >= qs.length;
    result.hidden = !done;
    back.hidden = i === 0 || done;
    stepEl.textContent = done ? 'Готово' : `Вопрос ${i + 1} из ${qs.length}`;
    bar.style.width = (Math.min(i, qs.length) / qs.length * 100) + '%';
  };

  const finish = () => {
    const plan = catalog
      ? { name: 'Сайт с каталогом', meta: 'запуск за 14–18 дней' }
      : { name: 'Сайт-визитка',     meta: 'запуск за 7–10 дней' };
    planEl.textContent = plan.name;
    metaEl.textContent = plan.meta;

    const text = [
      'Здравствуйте! Пишу с сайта sevensites.ru.',
      `Бизнес: ${answers.biz}`,
      `Сейчас: ${answers.now}`,
      `Сроки: ${answers.when}`,
      `Подходит: ${plan.name.toLowerCase()}`,
    ].join('\n');
    send.dataset.text = text;
    send.href = 'https://t.me/seven_sites?text=' + encodeURIComponent(text);
    hint.textContent = 'Ответы уже подставлены в сообщение — останется нажать «отправить».';

    show(qs.length);
    goal('quiz_done', { plan: plan.name });
  };

  qs.forEach((q, i) => {
    q.addEventListener('click', (e) => {
      const btn = e.target.closest('button');
      if (!btn) return;
      if (!started) { started = true; goal('quiz_start'); }

      q.querySelectorAll('button').forEach((b) => b.classList.toggle('is-picked', b === btn));
      answers[q.dataset.key] = btn.dataset.v;
      if (q.dataset.key === 'biz') catalog = btn.hasAttribute('data-catalog');

      // короткая пауза: выбранный вариант успевает подсветиться — видно,
      // что касание засчитано, прежде чем вопрос сменится
      setTimeout(() => (i + 1 < qs.length ? show(i + 1) : finish()), 220);
    });
  });

  /* ссылка ?text= подставляет сообщение не во всех версиях Telegram —
     на этот случай текст заодно уходит в буфер обмена */
  send.addEventListener('click', () => {
    const text = send.dataset.text;
    if (!text || !navigator.clipboard) return;
    navigator.clipboard.writeText(text).then(() => {
      hint.textContent = 'Текст заявки ещё и скопирован: если чат открылся пустым — просто вставьте его.';
    }).catch(() => {});
  });

  back.addEventListener('click', () => show(Math.max(0, cur - 1)));
  again.addEventListener('click', () => {
    qs.forEach((q) => q.querySelectorAll('.is-picked').forEach((b) => b.classList.remove('is-picked')));
    show(0);
  });

  show(0);
};
