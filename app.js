/* Reveal: 20px + opacity, стаггер только между соседями (по родителю), cap 300ms. */
(function () {
  var groups = [
    '.grid-3 > li', '.grid-2 > li', '.steps > li', '.faq',
    '.band-item', '.section h2', '.section .eyebrow', '.section-sub'
  ];
  var cap = 300; // мс — суммарный стаггер не растёт бесконечно

  function mark(el, delay) {
    el.classList.add('reveal');
    el.style.transitionDelay = Math.min(delay, cap) + 'ms';
  }

  groups.forEach(function (sel) {
    // индекс внутри одного родителя: соседние карточки каскадом,
    // разрозненные заголовки — без накопленной задержки
    var byParent = new Map();
    document.querySelectorAll(sel).forEach(function (el) {
      var p = el.parentElement;
      var i = byParent.get(p) || 0;
      byParent.set(p, i + 1);
      mark(el, i * 55);
    });
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

  // Count-up в полосе показателей: 1200ms, один раз, только целые числа.
  // Без JS текст показывает финальное значение — анимация не прячет контент.
  var nums = document.querySelectorAll('.band-num[data-count]');
  if (nums.length && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    var nio = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          nio.unobserve(entry.target);
          var el = entry.target;
          var target = parseInt(el.dataset.count, 10);
          var t0 = null;
          var tick = function (ts) {
            if (t0 === null) t0 = ts;
            var p = Math.min((ts - t0) / 1200, 1);
            var eased = 1 - Math.pow(1 - p, 3);
            el.textContent = Math.round(target * eased);
            if (p < 1) requestAnimationFrame(tick);
          };
          requestAnimationFrame(tick);
        });
      },
      { rootMargin: '0px 0px -10% 0px', threshold: 0.3 }
    );
    nums.forEach(function (el) { nio.observe(el); });
  }
})();
