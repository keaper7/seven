/* Живые данные Нальчика: часы по местному времени (МСК, UTC+3). */

window.SEVEN = window.SEVEN || {};

SEVEN.clock = function initClock() {
  const el = document.getElementById('clock');
  if (!el) return;

  const fmt = new Intl.DateTimeFormat('ru-RU', {
    timeZone: 'Europe/Moscow',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });

  const tick = () => { el.textContent = fmt.format(new Date()); };
  tick();
  setInterval(tick, 1000);
};
