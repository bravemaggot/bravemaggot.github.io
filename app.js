/* Один reveal-паттерн: opacity + translateY, стаггер только между соседями. */
(function () {
  var groups = ['.grid-3 > li', '.grid-2 > li', '.steps > li', '.faq'];
  var cap = 280; // мс — суммарный стаггер не растёт бесконечно

  function mark(el, delay) {
    el.classList.add('reveal');
    el.style.transitionDelay = Math.min(delay, cap) + 'ms';
  }

  groups.forEach(function (sel) {
    document.querySelectorAll(sel).forEach(function (el, i) { mark(el, i * 55); });
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

  // Страховка: печать, краулеры без JS-рендера, медленные устройства —
  // всё скрытое проявляется через 1.5 с в любом случае.
  setTimeout(function () {
    nodes.forEach(function (el) { el.dataset.visible = 'true'; });
    io.disconnect();
  }, 1500);

  // Tagline reveal (B11): слова включаются по одному на триггер-линии.
  // Без JS текст остаётся полноцветным — спаны создаёт только скрипт.
  var tp = document.querySelector('[data-words]');
  if (tp && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    var words = tp.textContent.trim().split(/\s+/);
    tp.textContent = '';
    var spans = words.map(function (w) {
      var s = document.createElement('span');
      s.className = 'word';
      s.textContent = w;
      tp.appendChild(s);
      tp.appendChild(document.createTextNode(' '));
      return s;
    });
    var wio = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry, k) {
          if (!entry.isIntersecting) return;
          // несколько слов пересекли линию одновременно — каскад внутри батча
          entry.target.style.transitionDelay = (k * 60) + 'ms';
          entry.target.classList.add('on');
          wio.unobserve(entry.target);
        });
      },
      { rootMargin: '0px 0px -35% 0px', threshold: 0.5 }
    );
    spans.forEach(function (s) { wio.observe(s); });
  }
})();
