/* Один reveal-паттерн: opacity + translate, стаггер только между соседями. */
(function () {
  var groups = ['.grid > li', '.feats > li', '.steps > li'];
  var blocks = ['.block > .case', '.block > .contact'];

  function mark(el, delay) {
    el.classList.add('reveal');
    if (delay) el.style.transitionDelay = Math.min(delay, 280) + 'ms';
  }

  groups.forEach(function (sel) {
    document.querySelectorAll(sel).forEach(function (el, i) { mark(el, i * 55); });
  });
  blocks.forEach(function (sel) {
    document.querySelectorAll(sel).forEach(function (el) { mark(el, 0); });
  });

  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var nodes = document.querySelectorAll('.reveal');

  if (reduce) {
    nodes.forEach(function (el) {
      el.style.transitionDelay = '0ms';
      el.dataset.visible = 'true';
    });
    return;
  }

  var io = new IntersectionObserver(
    function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        entry.target.dataset.visible = 'true';
        io.unobserve(entry.target);
      });
    },
    { rootMargin: '0px 0px -10% 0px', threshold: 0.08 }
  );

  nodes.forEach(function (el) { io.observe(el); });
})();