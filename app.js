/* =========================================================
   Поведение страницы.
   Правило: без JS всё видно и работает (класс .js ставится
   только после успешной загрузки этого файла — см. index.html).
   ========================================================= */
(function () {
  'use strict';

  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  try {
    /* ---------- появление блоков при прокрутке ---------- */
    var rvs = document.querySelectorAll('.rv');
    if (reduced || !('IntersectionObserver' in window)) {
      rvs.forEach(function (el) { el.classList.add('in'); });
    } else {
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (e) {
          if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
        });
      }, { threshold: .12, rootMargin: '0px 0px -6% 0px' });
      rvs.forEach(function (el) { io.observe(el); });
    }

    /* ---------- одометры: цифры набегают снизу вверх ----------
       Цифра лежит в HTML (без JS видна сразу), reel строится поверх неё. */
    var ods = document.querySelectorAll('.od');
    ods.forEach(function (od) {
      var v = parseInt(od.dataset.v, 10) || 0;
      var reel = document.createElement('span');
      reel.className = 'reel';
      for (var i = 0; i <= 9; i++) {
        var s = document.createElement('span');
        s.textContent = i;
        reel.appendChild(s);
      }
      od.textContent = '';
      od.appendChild(reel);
      // сразу показываем верное число, анимация запустится при появлении блока
      reel.style.transform = 'translateY(-' + v + 'em)';
      od._v = v;
    });
    function fireOdometer() {
      document.querySelectorAll('.od').forEach(function (od, i) {
        var reel = od.querySelector('.reel');
        if (!reel) return;
        reel.style.transition = 'none';
        reel.style.transform = 'translateY(0em)';
        void reel.offsetHeight; /* старт анимации с нуля */
        reel.style.transition = '';
        reel.style.transitionDelay = (reduced ? 0 : i * 0.12) + 's';
        reel.style.transform = 'translateY(-' + od._v + 'em)';
      });
    }
    var stats = document.querySelector('.stats');
    if (stats) {
      if (reduced || !('IntersectionObserver' in window)) {
        fireOdometer();
      } else {
        var io2 = new IntersectionObserver(function (entries) {
          entries.forEach(function (e) {
            if (e.isIntersecting) { fireOdometer(); io2.disconnect(); }
          });
        }, { threshold: .35 });
        io2.observe(stats);
      }
    }

    /* ---------- манифест: слова проявляются по мере прокрутки ---------- */
    var man = document.getElementById('manifesto');
    var words = [];
    if (man) {
      var parts = man.textContent.trim().split(/\s+/);
      man.textContent = '';
      parts.forEach(function (w) {
        var s = document.createElement('span');
        s.className = 'mword';
        s.textContent = w;
        man.appendChild(s);
        man.appendChild(document.createTextNode(' '));
      });
      words = man.querySelectorAll('.mword');
      if (reduced) words.forEach(function (w) { w.classList.add('on'); });
    }
    var manTop = 0, manH = 0, manMeasured = false;
    function measureMan() {
      if (!man) return;
      var r = man.getBoundingClientRect();
      manTop = r.top + window.scrollY;
      manH = r.height;
      manMeasured = true;
    }
    function manTick() {
      if (!man || reduced || !manMeasured) return;
      var start = window.innerHeight * 0.88;
      // позиция меряется один раз (после первой раскладки) и пересчитывается
      // только на resize: чтение геометрии в каждом кадре скролла вызывало forced reflow
      var p = Math.min(1, Math.max(0, (start - (manTop - window.scrollY)) / (manH + start * 0.25)));
      var n = Math.round(p * words.length);
      words.forEach(function (w, i) { w.classList.toggle('on', i < n); });
    }
    var ticking = false;
    function onScroll() {
      if (!ticking) {
        requestAnimationFrame(function () { manTick(); ticking = false; });
        ticking = true;
      }
    }
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', function () { measureMan(); onScroll(); });
    // Замер откладываем до первой раскладки: иначе чтение геометрии
    // на старте вызывает forced reflow и тормозит первую отрисовку.
    if (man) {
      if ('ResizeObserver' in window) {
        new ResizeObserver(function () { measureMan(); manTick(); }).observe(man);
      } else if (window.requestIdleCallback) {
        window.requestIdleCallback(function () { measureMan(); manTick(); }, { timeout: 1200 });
      } else {
        window.setTimeout(function () { measureMan(); manTick(); }, 80);
      }
    }

    /* ---------- диалог с ботом в герое ---------- */
    var chatBody = document.getElementById('chatBody');
    var MSGS = [
      { who: 'client', text: 'Нужен бот, который собирает заявки с сайта и присылает мне в Telegram', chip: '/start', time: '10:41' },
      { who: 'bot', text: 'Заявка #12 принята. Дальше сама: форма → карточка в вашем Telegram → очередь со статусами', time: '10:41' },
      { who: 'client', text: 'а если клиент напишет криво и без бюджета?', time: '10:42' },
      { who: 'bot', text: 'Уточню недостающее встречным вопросом и дополню бриф. Заявка не потеряется', time: '10:42' }
    ];
    var playToken = 0;
    function sleep(ms) { return new Promise(function (r) { setTimeout(r, ms); }); }

    function makeMsg(m) {
      var wrap = document.createElement('div');
      wrap.className = 'msg msg--' + m.who;
      var b = document.createElement('div');
      b.className = 'bubble';
      b.textContent = m.text;
      wrap.appendChild(b);
      if (m.chip) {
        var chip = document.createElement('span');
        chip.className = 'chip';
        chip.textContent = m.chip;
        wrap.appendChild(chip);
      }
      var meta = document.createElement('div');
      meta.className = 'msg-meta';
      meta.textContent = m.time;
      wrap.appendChild(meta);
      return wrap;
    }
    function makeTyping() {
      var wrap = document.createElement('div');
      wrap.className = 'msg msg--bot';
      var b = document.createElement('div');
      b.className = 'bubble typing';
      b.innerHTML = '<span></span><span></span><span></span>';
      wrap.appendChild(b);
      return wrap;
    }

    async function playChat() {
      var token = ++playToken;
      chatBody.innerHTML = '';
      for (var i = 0; i < MSGS.length; i++) {
        var m = MSGS[i];
        if (token !== playToken) return;
        if (m.who === 'bot') {
          var t = makeTyping();
          chatBody.appendChild(t);
          requestAnimationFrame(function () { t.classList.add('show'); });
          await sleep(reduced ? 0 : 900);
          if (token !== playToken) return;
          t.remove();
        } else {
          await sleep(reduced ? 0 : 460);
          if (token !== playToken) return;
        }
        var node = makeMsg(m);
        chatBody.appendChild(node);
        requestAnimationFrame(function () { node.classList.add('show'); });
        await sleep(reduced ? 0 : 280);
      }
    }
    function renderAll() {
      chatBody.innerHTML = '';
      MSGS.forEach(function (m) {
        var node = makeMsg(m);
        chatBody.appendChild(node);
        node.classList.add('show');
      });
    }
    if (chatBody) {
      if (reduced || !('IntersectionObserver' in window)) {
        renderAll();
      } else {
        var io3 = new IntersectionObserver(function (entries) {
          entries.forEach(function (e) {
            if (e.isIntersecting) { playChat(); io3.disconnect(); }
          });
        }, { threshold: .35 });
        io3.observe(chatBody);
      }
    }
    var replay = document.getElementById('chatReplay');
    if (replay) replay.addEventListener('click', function () {
      if (reduced) renderAll(); else playChat();
    });

    /* ---------- аккордеон FAQ ---------- */
    document.querySelectorAll('.qa-q').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var item = btn.closest('.qa');
        var open = item.classList.toggle('open');
        btn.setAttribute('aria-expanded', open ? 'true' : 'false');
      });
    });

    /* ---------- модалка конфиденциальности ---------- */
    var mOv = document.getElementById('privacyModal');
    var mClose = document.getElementById('privacyClose');
    var mOk = document.getElementById('privacyOk');
    var lastTrigger = null;
    var FOCUSABLE = 'a[href], button:not([disabled]), input, select, textarea, [tabindex]:not([tabindex="-1"])';
    var BACKDROP = Array.prototype.slice.call(document.querySelectorAll('.topbar, main, .footer'));

    function openModal(trigger) {
      lastTrigger = trigger || null;
      mOv.classList.add('open');
      mOv.removeAttribute('inert');
      document.body.style.overflow = 'hidden';
      // фон уводим из дерева доступности, пока открыта модалка
      BACKDROP.forEach(function (el) { el.setAttribute('inert', ''); });
      requestAnimationFrame(function () { mClose.focus(); });
    }
    function closeModal() {
      mOv.classList.remove('open');
      mOv.setAttribute('inert', '');
      BACKDROP.forEach(function (el) { el.removeAttribute('inert'); });
      document.body.style.overflow = '';
      if (lastTrigger) lastTrigger.focus();
    }
    document.querySelectorAll('[data-privacy]').forEach(function (a) {
      a.addEventListener('click', function (e) { e.preventDefault(); openModal(a); });
    });
    if (mClose) mClose.addEventListener('click', closeModal);
    if (mOk) mOk.addEventListener('click', closeModal);
    if (mOv) {
      mOv.addEventListener('click', function (e) { if (e.target === mOv) closeModal(); });
      // ловушка фокуса внутри модалки
      mOv.addEventListener('keydown', function (e) {
        if (e.key !== 'Tab') return;
        var items = Array.prototype.filter.call(
          mOv.querySelectorAll(FOCUSABLE),
          function (el) { return el.offsetParent !== null; }
        );
        if (!items.length) return;
        var first = items[0], last = items[items.length - 1];
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
      });
      window.addEventListener('keydown', function (e) {
        if (e.key === 'Escape' && mOv.classList.contains('open')) closeModal();
      });
    }

    /* Страховка снимается только после того, как вся страница инициализирована.
       Если app.js не загрузится — таймер из index.html уберёт класс .js,
       и весь контент останется видимым. */
    if (window.__rvFallback) { clearTimeout(window.__rvFallback); window.__rvFallback = null; }
  } catch (err) {
    document.documentElement.classList.remove('js');
    if (window.console && console.error) console.error('[landing] init failed:', err);
  }
})();
