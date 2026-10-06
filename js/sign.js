/* лента под девизом в подвале: лежит ровно во всю ширину, её тоже
   можно потянуть — она вернётся на место */
(function () {
  const init = () => {
    const host = document.getElementById('signTape');
    const box = document.getElementById('sign');
    if (!host || !window.SEVEN || !SEVEN.Tape) return;
    const t = box.querySelector('.sign__t');
    const tape = new SEVEN.Tape(host, {
      area: box,
      layout: (W) => {
        const g = parseFloat(getComputedStyle(box).paddingLeft) || 20;
        const w = W < 900 ? Math.min(40, Math.max(30, W * .086)) : Math.min(54, Math.max(40, W * .033));
        const y = t.offsetTop + t.offsetHeight + 18 + w / 2;
        return { pts: [[g - w * .42, y], [W - g + w * .42, y]], w };
      },
    });
    const build = () => tape.build(false);
    (document.fonts ? document.fonts.ready : Promise.resolve()).then(build);
    let lw = innerWidth;
    addEventListener('resize', () => { if (Math.abs(innerWidth - lw) > 1) { lw = innerWidth; build(); } });
  };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
