/* Эталонные паттерны: JS-gating reveal, одометры, манифест по прогрессу скролла,
   анимированный чат, аккордеон, модалка. Без JS всё видно (класс .js ставится в head). */
(function () {
  "use strict";
  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

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

  /* ---------- одометры: цифры набегают снизу вверх ---------- */
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
    od.appendChild(reel);
    od._v = v;
  });
  function fireOdometer() {
    document.querySelectorAll('.od').forEach(function (od, i) {
      var reel = od.querySelector('.reel');
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
      }, { threshold: .4 });
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
  function manTick() {
    if (!man || reduced) return;
    var r = man.getBoundingClientRect();
    var start = window.innerHeight * 0.88;
    var p = Math.min(1, Math.max(0, (start - r.top) / (r.height + start * 0.25)));
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
  window.addEventListener('resize', onScroll);
  manTick();

  /* ---------- мини-диалог в герое ---------- */
  var chatBody = document.getElementById('chatBody');
  var MSGS = [
    { who: 'c', text: 'Нужен бот, который собирает заявки с сайта и присылает мне в Telegram' },
    { who: 'b', text: 'Заявка #12 принята. Дальше сама: форма → карточка в вашем Telegram → очередь со статусами' },
    { who: 'c', text: 'а если клиент напишет криво и без бюджета?' },
    { who: 'b', text: 'Уточню недостающее встречным вопросом и дополню бриф. Заявка не потеряется' }
  ];
  var playToken = 0;
  function sleep(ms) { return new Promise(function (r) { setTimeout(r, ms); }); }
  function bubble(m) {
    var d = document.createElement('div');
    d.className = 'bubble ' + m.who;
    d.textContent = m.text;
    chatBody.appendChild(d);
    requestAnimationFrame(function () { d.classList.add('show'); });
  }
  function typingBubble() {
    var d = document.createElement('div');
    d.className = 'bubble bot typing';
    d.innerHTML = '<span></span><span></span><span></span>';
    chatBody.appendChild(d);
    requestAnimationFrame(function () { d.classList.add('show'); });
    return d;
  }
  async function playChat() {
    var token = ++playToken;
    chatBody.innerHTML = '';
    for (var i = 0; i < MSGS.length; i++) {
      var m = MSGS[i];
      if (token !== playToken) return;
      if (m.who === 'b') {
        var t = typingBubble();
        await sleep(reduced ? 0 : 950);
        if (token !== playToken) return;
        t.remove();
      } else {
        await sleep(reduced ? 0 : 520);
        if (token !== playToken) return;
      }
      bubble(m);
      await sleep(reduced ? 0 : 260);
    }
  }
  function renderAll() { chatBody.innerHTML = ''; MSGS.forEach(bubble); }
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
  function openModal() {
    mOv.classList.add('open');
    document.body.style.overflow = 'hidden';
    mClose.focus();
  }
  function closeModal() {
    mOv.classList.remove('open');
    document.body.style.overflow = '';
  }
  document.querySelectorAll('[data-privacy]').forEach(function (a) {
    a.addEventListener('click', function (e) { e.preventDefault(); openModal(); });
  });
  if (mClose) mClose.addEventListener('click', closeModal);
  if (mOk) mOk.addEventListener('click', closeModal);
  if (mOv) {
    mOv.addEventListener('click', function (e) { if (e.target === mOv) closeModal(); });
    window.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && mOv.classList.contains('open')) closeModal();
    });
  }
})();
