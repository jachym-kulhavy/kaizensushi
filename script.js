/* ==========================================================================
   Kaizen Sushi Bar – demo behaviour
   Header, slow scroll motion, collapsible texts, lightbox, menu with search,
   3-step reservation wizard (front-end demo only, nothing is sent anywhere).
   ========================================================================== */
(() => {
  'use strict';

  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));
  const clamp = (n, a, b) => Math.min(b, Math.max(a, n));
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => (
    { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]
  ));

  /* ---------------------------------------------------------------------- */
  /* Header and mobile navigation                                           */
  /* ---------------------------------------------------------------------- */
  const header = $('.site-header');
  const navToggle = $('.nav-toggle');
  const nav = $('#site-nav');

  function setNav(open) {
    nav.classList.toggle('is-open', open);
    navToggle.setAttribute('aria-expanded', String(open));
    navToggle.setAttribute('aria-label', open ? 'Zavřít menu' : 'Otevřít menu');
    document.body.classList.toggle('no-scroll', open);
  }
  navToggle.addEventListener('click', () => setNav(!nav.classList.contains('is-open')));
  $$('.nav__link, .brand').forEach((a) => a.addEventListener('click', () => setNav(false)));
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && nav.classList.contains('is-open')) {
      setNav(false);
      navToggle.focus();
    }
  });

  /* ---------------------------------------------------------------------- */
  /* Scroll reveal (slow and subtle)                                        */
  /* ---------------------------------------------------------------------- */
  let revealObserver = null;
  if (!reduceMotion && 'IntersectionObserver' in window) {
    revealObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-in');
          revealObserver.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -6% 0px' });
  }
  function observeReveal(el) {
    if (revealObserver) revealObserver.observe(el);
    else el.classList.add('is-in');
  }
  $$('.reveal, .reveal-img').forEach(observeReveal);

  /* ---------------------------------------------------------------------- */
  /* Slow parallax on hero, gentle zoom on marked images                    */
  /* ---------------------------------------------------------------------- */
  const heroMedia = $('.hero__media');
  const zoomBoxes = $$('[data-zoom]');
  let ticking = false;

  function onFrame() {
    ticking = false;
    const y = window.scrollY;
    const vh = window.innerHeight;
    header.classList.toggle('is-scrolled', y > 40);
    if (reduceMotion) return;

    if (heroMedia && y < vh * 1.3) {
      heroMedia.style.transform = 'translate3d(0,' + (y * 0.16).toFixed(1) + 'px,0)';
    }
    zoomBoxes.forEach((box) => {
      const r = box.getBoundingClientRect();
      if (!r.height || r.bottom < -120 || r.top > vh + 120) return;
      const p = clamp((vh - r.top) / (vh + r.height), 0, 1);
      const img = $('img', box);
      if (img) {
        img.style.transform = 'translate3d(0,' + ((0.5 - p) * 28).toFixed(1) + 'px,0) scale(' + (1.05 + p * 0.09).toFixed(3) + ')';
      }
    });
  }
  function requestTick() {
    if (!ticking) {
      ticking = true;
      window.requestAnimationFrame(onFrame);
    }
  }
  window.addEventListener('scroll', requestTick, { passive: true });
  window.addEventListener('resize', requestTick);
  onFrame();

  /* ---------------------------------------------------------------------- */
  /* Scroll spy for the navigation                                          */
  /* ---------------------------------------------------------------------- */
  const navLinks = $$('.nav__link');
  const spyTargets = [$('#hero')].concat(navLinks.map((l) => $(l.getAttribute('href')))).filter(Boolean);
  if ('IntersectionObserver' in window) {
    const spy = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        navLinks.forEach((link) => {
          const on = link.getAttribute('href') === '#' + entry.target.id;
          link.classList.toggle('is-active', on);
          if (on) link.setAttribute('aria-current', 'true');
          else link.removeAttribute('aria-current');
        });
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    spyTargets.forEach((t) => spy.observe(t));
  }

  /* ---------------------------------------------------------------------- */
  /* Three pages: home + o nás | sushi sebou + rezervace | catering + kontakt */
  /* ---------------------------------------------------------------------- */
  const pages = $$('.page');
  const SECTION_PAGE = {
    'hero': 'page-home', 'o-nas': 'page-home',
    'sushi-sebou': 'page-order', 'menu': 'page-order', 'rezervace': 'page-order',
    'catering': 'page-more', 'kontakt': 'page-more'
  };
  const PAGE_TOP = { 'hero': true, 'sushi-sebou': true, 'catering': true };
  let currentPage = 'page-home';

  function showPage(id) {
    if (id === currentPage) return false;
    pages.forEach((p) => p.classList.toggle('is-active', p.id === id));
    currentPage = id;
    return true;
  }

  function goToSection(id, push) {
    const pageId = SECTION_PAGE[id];
    if (!pageId) return;
    const changed = showPage(pageId);
    if (push && location.hash !== '#' + id) history.pushState(null, '', '#' + id);
    const target = document.getElementById(id);
    window.requestAnimationFrame(() => {
      if (PAGE_TOP[id]) window.scrollTo({ top: 0, behavior: changed ? 'instant' : 'smooth' });
      else target.scrollIntoView({ behavior: changed ? 'instant' : 'smooth', block: 'start' });
      requestTick();
    });
  }

  document.addEventListener('click', (e) => {
    const a = e.target.closest('a[href^="#"]');
    if (!a) return;
    const id = a.getAttribute('href').slice(1);
    if (!SECTION_PAGE[id]) return;
    e.preventDefault();
    setNav(false);
    goToSection(id, true);
  });
  window.addEventListener('popstate', () => {
    const id = location.hash.slice(1);
    goToSection(SECTION_PAGE[id] ? id : 'hero', false);
  });
  if (SECTION_PAGE[location.hash.slice(1)]) goToSection(location.hash.slice(1), false);

  /* ---------------------------------------------------------------------- */
  /* Collapsible texts ("Číst více")                                        */
  /* ---------------------------------------------------------------------- */
  $$('[data-more-btn]').forEach((btn) => {
    const target = document.getElementById(btn.getAttribute('aria-controls'));
    const label = $('.more__label', btn);
    if (!target) return;

    btn.addEventListener('click', () => {
      const open = btn.getAttribute('aria-expanded') !== 'true';
      btn.setAttribute('aria-expanded', String(open));
      label.textContent = open ? btn.dataset.less : btn.dataset.more;

      if (open) {
        target.classList.add('is-open');
        if (reduceMotion) {
          target.style.maxHeight = 'none';
          return;
        }
        target.style.maxHeight = target.scrollHeight + 'px';
        const done = (e) => {
          if (e.propertyName !== 'max-height') return;
          target.removeEventListener('transitionend', done);
          if (target.classList.contains('is-open')) target.style.maxHeight = 'none';
        };
        target.addEventListener('transitionend', done);
      } else {
        target.style.maxHeight = target.scrollHeight + 'px';
        void target.offsetHeight; // force reflow so the collapse animates
        target.style.maxHeight = '';
        target.classList.remove('is-open');
      }
    });
  });

  /* ---------------------------------------------------------------------- */
  /* Lightbox                                                               */
  /* ---------------------------------------------------------------------- */
  const lb = $('#lightbox');
  const lbImg = $('#lightbox-img');
  const lbClose = $('.lightbox__close', lb);
  const lbPrev = $('.lightbox__prev', lb);
  const lbNext = $('.lightbox__next', lb);
  let lbGroup = [];
  let lbIndex = 0;
  let lbOpener = null;

  function lbShow() {
    const img = $('img', lbGroup[lbIndex]);
    lbImg.classList.remove('is-ready');
    lbImg.onload = () => lbImg.classList.add('is-ready');
    lbImg.alt = img.alt;
    lbImg.src = img.currentSrc || img.src;
    if (lbImg.complete) lbImg.classList.add('is-ready');
  }
  function lbOpen(btn) {
    lbGroup = $$('[data-lightbox="' + btn.dataset.lightbox + '"]');
    lbIndex = lbGroup.indexOf(btn);
    lbOpener = btn;
    lb.classList.toggle('is-single', lbGroup.length < 2);
    lb.hidden = false;
    document.body.classList.add('no-scroll');
    lbShow();
    window.requestAnimationFrame(() => lb.classList.add('is-open'));
    lbClose.focus();
  }
  function lbHide() {
    lb.classList.remove('is-open');
    document.body.classList.remove('no-scroll');
    window.setTimeout(() => { lb.hidden = true; lbImg.removeAttribute('src'); }, reduceMotion ? 0 : 450);
    if (lbOpener) lbOpener.focus();
  }
  function lbStep(dir) {
    if (lbGroup.length < 2) return;
    lbIndex = (lbIndex + dir + lbGroup.length) % lbGroup.length;
    lbShow();
  }
  $$('[data-lightbox]').forEach((btn) => btn.addEventListener('click', () => lbOpen(btn)));
  lbClose.addEventListener('click', lbHide);
  lbPrev.addEventListener('click', () => lbStep(-1));
  lbNext.addEventListener('click', () => lbStep(1));
  lb.addEventListener('click', (e) => { if (e.target === lb || e.target.classList.contains('lightbox__figure')) lbHide(); });
  document.addEventListener('keydown', (e) => {
    if (lb.hidden) return;
    if (e.key === 'Escape') lbHide();
    else if (e.key === 'ArrowLeft') lbStep(-1);
    else if (e.key === 'ArrowRight') lbStep(1);
    else if (e.key === 'Tab') {
      const focusable = [lbClose, lbPrev, lbNext].filter((b) => b.offsetParent !== null && getComputedStyle(b).visibility !== 'hidden');
      if (!focusable.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    }
  });

  /* ---------------------------------------------------------------------- */
  /* Menu with tabs and search                                              */
  /* ---------------------------------------------------------------------- */
  const MENU = Array.isArray(window.KAIZEN_MENU) ? window.KAIZEN_MENU : [];
  const tabsEl = $('#menu-tabs');
  const gridEl = $('#menu-grid');
  const noteEl = $('#menu-note');
  const emptyEl = $('#menu-empty');
  const searchEl = $('#menu-search');
  let activeCat = MENU.length ? MENU[0].id : null;

  const norm = (s) => String(s || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

  function wireImages(root) {
    $$('.dish__media', root).forEach((media) => {
      const img = $('img', media);
      if (!img) return;
      const fail = () => media.classList.add('no-img');
      img.addEventListener('error', fail);
      if (img.complete && img.naturalWidth === 0) fail();
    });
  }

  function dishHTML(item, cat, i, showCat) {
    const src = item.img || ('assets/menu/' + cat.id + '-' + (i + 1) + '.jpg');
    return '<article class="dish reveal">' +
      '<div class="dish__media"><img src="' + esc(src) + '" alt="' + esc(item.name) + '" loading="lazy">' +
      '<span class="dish__ph">' + esc(src) + '</span></div>' +
      (showCat ? '<span class="dish__cat">' + esc(cat.label) + '</span>' : '') +
      '<div class="dish__head"><h4 class="dish__name">' + esc(item.name) + '</h4>' +
      '<span class="dish__price">' + esc(item.price) + '</span></div>' +
      '<p class="dish__desc">' + esc(item.desc) + '</p></article>';
  }

  function renderGrid(entries, showCat) {
    gridEl.classList.add('is-swapping');
    window.setTimeout(() => {
      gridEl.innerHTML = entries.map((e, i) => dishHTML(e.item, e.cat, e.index, showCat)).join('');
      wireImages(gridEl);
      $$('.dish', gridEl).forEach((el, i) => {
        el.style.setProperty('--d', ((i % 4) * 90) + 'ms');
        observeReveal(el);
      });
      emptyEl.hidden = entries.length > 0;
      gridEl.classList.remove('is-swapping');
    }, reduceMotion ? 0 : 200);
  }

  function showCategory(id) {
    const cat = MENU.find((c) => c.id === id);
    if (!cat) return;
    activeCat = id;
    $$('.tab', tabsEl).forEach((t) => {
      const on = t.dataset.cat === id;
      t.setAttribute('aria-selected', String(on));
      t.tabIndex = on ? 0 : -1;
    });
    gridEl.setAttribute('aria-labelledby', 'tab-' + id);
    noteEl.textContent = cat.note || '';
    renderGrid(cat.items.map((item, index) => ({ item, cat, index })), false);
  }

  function runSearch(raw) {
    const q = norm(raw).trim();
    if (!q) {
      tabsEl.classList.remove('is-dim');
      showCategory(activeCat);
      return;
    }
    tabsEl.classList.add('is-dim');
    noteEl.textContent = '';
    const hits = [];
    MENU.forEach((cat) => cat.items.forEach((item, index) => {
      if (norm(item.name + ' ' + item.desc + ' ' + cat.label).indexOf(q) !== -1) hits.push({ item, cat, index });
    }));
    renderGrid(hits, true);
  }

  if (MENU.length && tabsEl && gridEl) {
    tabsEl.innerHTML = MENU.map((c) =>
      '<button class="tab" role="tab" type="button" id="tab-' + esc(c.id) + '" data-cat="' + esc(c.id) +
      '" aria-controls="menu-grid" aria-selected="false" tabindex="-1">' + esc(c.label) + '</button>'
    ).join('');

    tabsEl.addEventListener('click', (e) => {
      const tab = e.target.closest('.tab');
      if (!tab) return;
      searchEl.value = '';
      tabsEl.classList.remove('is-dim');
      showCategory(tab.dataset.cat);
    });
    tabsEl.addEventListener('keydown', (e) => {
      if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft' && e.key !== 'Home' && e.key !== 'End') return;
      const tabs = $$('.tab', tabsEl);
      let i = tabs.findIndex((t) => t === document.activeElement);
      if (i < 0) i = 0;
      if (e.key === 'ArrowRight') i = (i + 1) % tabs.length;
      else if (e.key === 'ArrowLeft') i = (i - 1 + tabs.length) % tabs.length;
      else if (e.key === 'Home') i = 0;
      else i = tabs.length - 1;
      e.preventDefault();
      tabs[i].focus();
      searchEl.value = '';
      tabsEl.classList.remove('is-dim');
      showCategory(tabs[i].dataset.cat);
    });

    let searchTimer = null;
    searchEl.addEventListener('input', () => {
      window.clearTimeout(searchTimer);
      searchTimer = window.setTimeout(() => runSearch(searchEl.value), 140);
    });

    showCategory(activeCat);
  }

  /* ---------------------------------------------------------------------- */
  /* Reservation wizard (demo): day, free time of arrival, guests            */
  /* ---------------------------------------------------------------------- */
  const form = $('#res-form');
  if (form) {
    // getDay(): 0 = Sunday … 6 = Saturday. Values are [open, close] in hours.
    const HOURS = { 3: [[16, 22]], 4: [[11, 14], [16, 22]], 5: [[16, 22]], 6: [[16, 20]] };
    const MAX_GUESTS = 6;
    const MONTHS_AHEAD = 3;
    const MIN_ADVANCE = 60;      // minutes, used only when BLOCK_PAST_TIMES is true
    const BLOCK_PAST_TIMES = false; // demo: today stays bookable at any time; set true for live use
    const LAST_ARRIVAL = 60;     // minutes before closing

    const startOfDay = (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate());
    const today = startOfDay(new Date());
    const maxDate = new Date(today.getFullYear(), today.getMonth() + MONTHS_AHEAD, today.getDate());
    const pad = (n) => String(n).padStart(2, '0');
    const iso = (d) => d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate());
    const parseISO = (s) => { const p = s.split('-').map(Number); return new Date(p[0], p[1] - 1, p[2]); };
    const hhmm = (m) => pad(Math.floor(m / 60)) + ':' + pad(m % 60);
    const parseTime = (v) => { const m = /^(\d{1,2}):(\d{2})$/.exec(v || ''); return m ? Number(m[1]) * 60 + Number(m[2]) : null; };
    const capitalize = (s) => s.charAt(0).toUpperCase() + s.slice(1);
    const fmtLong = (d) => new Intl.DateTimeFormat('cs-CZ', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }).format(d);
    const fmtMonth = (d) => capitalize(new Intl.DateTimeFormat('cs-CZ', { month: 'long', year: 'numeric' }).format(d));

    const state = {
      month: new Date(today.getFullYear(), today.getMonth(), 1),
      date: HOURS[today.getDay()] ? iso(today) : null,   // 'YYYY-MM-DD'; today is preselected when open
      time: null,   // minutes after midnight
      guests: 2,
      step: 1
    };

    const el = {
      calTitle: $('#cal-title'),
      calGrid: $('#cal-grid'),
      calPrev: $('#cal-prev'),
      calNext: $('#cal-next'),
      timeInput: $('#res-time'),
      timeChips: $('#time-chips'),
      timeHint: $('#time-hint'),
      guestsVal: $('#guests-val'),
      guestsMinus: $('#guests-minus'),
      guestsPlus: $('#guests-plus'),
      summary: $('#res-summary'),
      status: $('#res-status'),
      alt: $('#res-alt'),
      success: $('#res-success'),
      successText: $('#res-success-text'),
      reset: $('#res-reset')
    };

    // ---- opening hours helpers
    function windowsFor(date) {      // arrival windows in minutes
      return (HOURS[date.getDay()] || []).map((r) => [r[0] * 60, r[1] * 60 - LAST_ARRIVAL]);
    }
    function earliestToday(date) {
      if (!BLOCK_PAST_TIMES || iso(date) !== iso(today)) return -1;
      const now = new Date();
      return now.getHours() * 60 + now.getMinutes() + MIN_ADVANCE;
    }
    function inWindow(date, min) {
      return windowsFor(date).some((w) => min >= w[0] && min <= w[1]);
    }
    function allowed(date, min) {
      return inWindow(date, min) && min > earliestToday(date);
    }
    function quickSlots(date) {
      const out = [];
      windowsFor(date).forEach((w) => {
        for (let t = w[0]; t <= w[1]; t += 30) if (allowed(date, t)) out.push(t);
      });
      return out;
    }
    function describeWindows(date) {
      return windowsFor(date).map((w) => hhmm(w[0]) + '–' + hhmm(w[1])).join(' nebo ');
    }

    // ---- simulated availability (deterministic for the same day, time and party size)
    function isFree(dateKey, min, guests) {
      const s = dateKey + '|' + min + '|' + guests;
      let h = 0;
      for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
      return h % 100 >= 18;
    }
    function alternatives(date, min) {
      const out = [];
      windowsFor(date).forEach((w) => {
        for (let t = w[0]; t <= w[1]; t += 15) {
          if (t !== min && allowed(date, t) && isFree(iso(date), t, state.guests)) out.push(t);
        }
      });
      out.sort((a, b) => Math.abs(a - min) - Math.abs(b - min));
      return out.slice(0, 3).sort((a, b) => a - b);
    }

    // ---- rendering (step 1)
    function renderCalendar() {
      const y = state.month.getFullYear();
      const m = state.month.getMonth();
      el.calTitle.textContent = fmtMonth(state.month);
      const offset = (new Date(y, m, 1).getDay() + 6) % 7;
      const days = new Date(y, m + 1, 0).getDate();
      let html = '';
      for (let i = 0; i < offset; i++) html += '<span></span>';
      for (let d = 1; d <= days; d++) {
        const date = new Date(y, m, d);
        const key = iso(date);
        const open = Boolean(HOURS[date.getDay()]);
        const inRange = date >= today && date <= maxDate;
        const ok = open && inRange && quickSlots(date).length > 0;
        const cls = ['cal__day'];
        if (key === iso(today)) cls.push('is-today');
        if (!open) cls.push('is-closed');
        if (state.date === key) cls.push('is-selected');
        html += '<button type="button" class="' + cls.join(' ') + '" data-date="' + key + '"' + (ok ? '' : ' disabled') +
          ' aria-pressed="' + (state.date === key) + '" aria-label="' + esc(fmtLong(date)) + (open ? '' : ', zavřeno') + '">' + d + '</button>';
      }
      el.calGrid.innerHTML = html;
      el.calPrev.disabled = y === today.getFullYear() && m === today.getMonth();
      el.calNext.disabled = new Date(y, m + 1, 1) > maxDate;
    }

    function syncChips() {
      $$('.chip', el.timeChips).forEach((c) => c.setAttribute('aria-pressed', String(Number(c.dataset.time) === state.time)));
    }

    function renderTimes() {
      if (!state.date) {
        el.timeInput.disabled = true;
        el.timeInput.value = '';
        el.timeChips.innerHTML = '';
        el.timeHint.textContent = 'Nejdřív vyberte den v kalendáři.';
        return;
      }
      const date = parseISO(state.date);
      el.timeInput.disabled = false;
      if (state.time !== null && !allowed(date, state.time)) {
        state.time = null;
        el.timeInput.value = '';
      }
      el.timeChips.innerHTML = quickSlots(date).map((t) =>
        '<button type="button" class="chip" data-time="' + t + '" aria-pressed="' + (state.time === t) + '">' + hhmm(t) + '</button>'
      ).join('');
      el.timeHint.textContent = 'Příchod v ' + describeWindows(date) + '. Čas můžete zadat i po čtvrthodinách, například 16:15.';
    }

    function renderGuests() {
      el.guestsVal.textContent = String(state.guests);
      el.guestsMinus.disabled = state.guests <= 1;
      el.guestsPlus.disabled = state.guests >= MAX_GUESTS;
    }

    // ---- events (step 1)
    el.calGrid.addEventListener('click', (e) => {
      const btn = e.target.closest('.cal__day');
      if (!btn || btn.disabled) return;
      state.date = btn.dataset.date;
      renderCalendar();
      renderTimes();
    });
    el.calPrev.addEventListener('click', () => { state.month = new Date(state.month.getFullYear(), state.month.getMonth() - 1, 1); renderCalendar(); });
    el.calNext.addEventListener('click', () => { state.month = new Date(state.month.getFullYear(), state.month.getMonth() + 1, 1); renderCalendar(); });
    el.timeInput.addEventListener('input', () => { state.time = parseTime(el.timeInput.value); syncChips(); });
    el.timeChips.addEventListener('click', (e) => {
      const btn = e.target.closest('.chip');
      if (!btn) return;
      state.time = Number(btn.dataset.time);
      el.timeInput.value = hhmm(state.time);
      syncChips();
    });
    el.guestsMinus.addEventListener('click', () => { state.guests = Math.max(1, state.guests - 1); renderGuests(); });
    el.guestsPlus.addEventListener('click', () => { state.guests = Math.min(MAX_GUESTS, state.guests + 1); renderGuests(); });

    // ---- steps
    const panels = $$('.panel', form);
    const marks = $$('[data-step-mark]');

    function goTo(n) {
      state.step = n;
      panels.forEach((p) => {
        const on = Number(p.dataset.panel) === n;
        p.hidden = !on;
        p.classList.toggle('is-active', on);
      });
      marks.forEach((m) => {
        const k = Number(m.dataset.stepMark);
        m.classList.toggle('is-current', k === n);
        m.classList.toggle('is-done', k < n);
        if (k === n) m.setAttribute('aria-current', 'step');
        else m.removeAttribute('aria-current');
      });
      const title = $('.panel__title', panels[n - 1]);
      if (title) title.focus({ preventScroll: true });
      $('#wizard').scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'nearest' });
    }

    function setError(id, msg) { $('#' + id).textContent = msg || ''; }

    function validateStep1() {
      if (!state.date) return 'Vyberte prosím den v kalendáři.';
      const date = parseISO(state.date);
      if (state.time === null) return 'Zadejte prosím čas příchodu, například 16:15.';
      if (!inWindow(date, state.time)) return 'V tento den můžete přijít v čase ' + describeWindows(date) + '.';
      if (!allowed(date, state.time)) return 'Na dnešek rezervujeme nejpozději hodinu předem. Zvolte pozdější čas.';
      return '';
    }

    // Phone is checked first. Only when it is fine, a wrong e-mail is reported.
    function validateStep2() {
      const f = form.elements;
      const problems = [];
      [f.jmeno, f.prijmeni, f.telefon, f.email].forEach((i) => i.removeAttribute('aria-invalid'));
      if (!f.jmeno.value.trim()) { problems.push('Doplňte jméno.'); f.jmeno.setAttribute('aria-invalid', 'true'); }
      if (!f.prijmeni.value.trim()) { problems.push('Doplňte příjmení.'); f.prijmeni.setAttribute('aria-invalid', 'true'); }
      const phone = f.telefon.value.trim();
      const email = f.email.value.trim();
      const phoneOk = /^\+?[\d\s()-]{9,}$/.test(phone);
      const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
      if (!phone && !email) {
        problems.push('Vyplňte telefon nebo e-mail.');
        f.telefon.setAttribute('aria-invalid', 'true');
      } else if (phone && !phoneOk) {
        problems.push('Telefon vypadá nesprávně. Zkuste například +420 734 763 637.');
        f.telefon.setAttribute('aria-invalid', 'true');
      } else if (email && !emailOk) {
        problems.push('E-mail vypadá nesprávně.');
        f.email.setAttribute('aria-invalid', 'true');
      }
      return problems.join(' ');
    }

    function renderSummary() {
      const f = form.elements;
      const date = parseISO(state.date);
      const free = isFree(state.date, state.time, state.guests);
      el.status.textContent = free
        ? 'Na tento termín máme volno.'
        : 'V tento čas už nemáme volno. Vyberte jiný čas.';
      el.status.className = 'status ' + (free ? 'is-ok' : 'is-bad');
      const alts = free ? [] : alternatives(date, state.time);
      el.alt.hidden = alts.length === 0;
      el.alt.innerHTML = alts.map((t) => '<button type="button" class="chip" data-alt="' + t + '">' + hhmm(t) + '</button>').join('');
      const contact = [f.telefon.value.trim(), f.email.value.trim()].filter(Boolean).join(', ');
      const rows = [
        ['Den', capitalize(fmtLong(date))],
        ['Čas', hhmm(state.time)],
        ['Počet hostů', String(state.guests)],
        ['Jméno', (f.jmeno.value.trim() + ' ' + f.prijmeni.value.trim()).trim()],
        ['Kontakt', contact]
      ];
      if (f.zprava.value.trim()) rows.push(['Zpráva', f.zprava.value.trim()]);
      el.summary.innerHTML = rows.map((r) => '<div><dt>' + esc(r[0]) + '</dt><dd>' + esc(r[1]) + '</dd></div>').join('');
      return free;
    }

    el.alt.addEventListener('click', (e) => {
      const btn = e.target.closest('[data-alt]');
      if (!btn) return;
      state.time = Number(btn.dataset.alt);
      el.timeInput.value = hhmm(state.time);
      setError('err-3', '');
      renderSummary();
    });

    $$('[data-next]', form).forEach((btn) => btn.addEventListener('click', () => {
      if (state.step === 1) {
        const msg = validateStep1();
        setError('err-1', msg);
        if (!msg) goTo(2);
      } else if (state.step === 2) {
        const msg = validateStep2();
        setError('err-2', msg);
        if (!msg) { renderSummary(); setError('err-3', ''); goTo(3); }
      }
    }));
    $$('[data-back]', form).forEach((btn) => btn.addEventListener('click', () => goTo(state.step - 1)));

    form.addEventListener('submit', (e) => {
      e.preventDefault();
      // Enter inside a field must only move to the next step, never confirm the booking.
      if (state.step !== 3) {
        const next = $('[data-panel="' + state.step + '"] [data-next]', form);
        if (next) next.click();
        return;
      }
      if (!renderSummary()) { setError('err-3', 'Tento čas už není volný. Vyberte jiný čas.'); return; }
      const name = form.elements.jmeno.value.trim();
      el.successText.textContent = 'Děkujeme, ' + name + '. Rezervace na ' + fmtLong(parseISO(state.date)) + ' v ' + hhmm(state.time) +
        ' pro ' + state.guests + ' ' + (state.guests === 1 ? 'osobu' : 'osoby') + ' by byla přijata.';
      form.hidden = true;
      $('.steps').hidden = true;
      el.success.hidden = false;
      el.success.focus({ preventScroll: true });
    });

    el.reset.addEventListener('click', () => {
      form.reset();
      state.date = null; state.time = null; state.guests = 2;
      state.month = new Date(today.getFullYear(), today.getMonth(), 1);
      setError('err-1', ''); setError('err-2', ''); setError('err-3', '');
      el.success.hidden = true;
      form.hidden = false;
      $('.steps').hidden = false;
      renderCalendar(); renderTimes(); renderGuests();
      goTo(1);
    });

    renderCalendar();
    renderTimes();
    renderGuests();
  }
})();
