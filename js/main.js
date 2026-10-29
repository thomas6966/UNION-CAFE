/* Union Cafe — sayt logikasi (til, menyu, tanlov savati, galereya, sharhlar, bron formasi) */
(function () {
  'use strict';

  const CFG = window.UNION_CONFIG;
  const DICT = window.UNION_I18N;
  const DISHES = window.UNION_DISHES;
  const CATS = window.UNION_CATEGORIES;
  const REVIEWS = window.UNION_REVIEWS;

  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);

  const store = {
    get(key) { try { return localStorage.getItem(key); } catch (e) { return null; } },
    set(key, value) { try { localStorage.setItem(key, value); } catch (e) { /* private mode */ } },
  };

  const LANGS = Object.keys(DICT);
  const byId = Object.fromEntries(DISHES.map((d) => [d.id, d]));
  const numberFmt = new Intl.NumberFormat('ru-RU');

  let lang = pickLang();
  let activeCat = 'all';
  let cart = loadCart();
  let autoComment = '';

  const t = (key) => (DICT[lang] && DICT[lang][key]) || DICT.uz[key] || key;
  const money = (n) => `${numberFmt.format(n)} ${t('menu.currency')}`;

  function pickLang() {
    const saved = store.get('uc-lang');
    if (saved && DICT[saved]) return saved;
    const nav = (navigator.language || '').slice(0, 2).toLowerCase();
    return DICT[nav] ? nav : 'uz';
  }

  function loadCart() {
    try {
      const raw = JSON.parse(store.get('uc-cart') || '{}');
      return Object.fromEntries(Object.entries(raw).filter(([id, q]) => byId[id] && q > 0));
    } catch (e) { return {}; }
  }

  /* ------------------------------------------------------------------ i18n */
  function applyLang(next) {
    lang = next;
    store.set('uc-lang', lang);
    document.documentElement.lang = lang;
    document.title = t('meta.title');
    $('meta[name="description"]').setAttribute('content', t('meta.desc'));

    $$('[data-i18n]').forEach((el) => { el.textContent = t(el.dataset.i18n); });
    $$('[data-i18n-html]').forEach((el) => { el.innerHTML = t(el.dataset.i18nHtml); });
    $$('[data-i18n-aria]').forEach((el) => { el.setAttribute('aria-label', t(el.dataset.i18nAria)); });
    $$('[data-i18n-ph]').forEach((el) => { el.setAttribute('placeholder', t(el.dataset.i18nPh)); });
    $$('.lang-switch__btn').forEach((btn) => {
      const on = btn.dataset.lang === lang;
      btn.classList.toggle('is-active', on);
      btn.setAttribute('aria-pressed', String(on));
    });

    renderContact();
    renderTabs();
    renderMenu();
    renderGallery();
    renderReviews();
    renderCartUI();
    fillBookingSelects();
  }

  /* --------------------------------------------------------------- contact */
  const ICONS = { instagram: '#i-instagram', telegram: '#i-telegram', yandex: '#i-pin' };
  const SOCIAL_LABELS = { instagram: 'Instagram', telegram: 'Telegram', yandex: 'Yandex Maps' };

  function renderContact() {
    const hours = `${CFG.hours.open} – ${CFG.hours.close}`;
    $('#addressText').textContent = CFG.address[lang];
    $('#footAddress').textContent = CFG.address[lang];
    $('#hoursText').textContent = hours;
    $('#footHours').textContent = hours;

    ['#phoneLink', '#footPhone'].forEach((sel) => {
      const a = $(sel);
      a.textContent = CFG.phone.display;
      if (CFG.phone.raw) a.setAttribute('href', `tel:${CFG.phone.raw}`);
    });

    $('#directionsBtn').href = CFG.map.directionsUrl;
    $('#mapOpen').href = CFG.map.directionsUrl;
    $('#yandexLink').href = CFG.social.yandex || CFG.map.directionsUrl;

    $$('[data-social-list]').forEach((box) => {
      box.innerHTML = Object.keys(ICONS).map((key) => {
        const url = CFG.social[key];
        const attrs = url ? `href="${esc(url)}" target="_blank" rel="noopener"` : 'aria-disabled="true"';
        return `<a ${attrs} aria-label="${SOCIAL_LABELS[key]}" title="${SOCIAL_LABELS[key]}"><svg class="icon"><use href="${ICONS[key]}"/></svg></a>`;
      }).join('');
    });

    if (CFG.map.embedUrl && !$('#mapBlock iframe')) {
      $('#mapBlock').innerHTML = `<iframe src="${esc(CFG.map.embedUrl)}" title="Union Cafe" loading="lazy" referrerpolicy="no-referrer-when-downgrade" allowfullscreen></iframe>`;
    }
  }

  /* ------------------------------------------------------------------ menu */
  function renderTabs() {
    const cats = ['all', ...CATS.filter((c) => DISHES.some((d) => d.cat === c))];
    $('#menuTabs').innerHTML = cats.map((c) =>
      `<button type="button" class="tab${c === activeCat ? ' is-active' : ''}" role="tab" aria-selected="${c === activeCat}" data-cat="${c}">${t('cat.' + c)}</button>`
    ).join('');
  }

  function ctrlHTML(d) {
    const qty = cart[d.id] || 0;
    if (!qty) return `<button type="button" class="btn dish__btn" data-add="${d.id}">${t('menu.pick')}</button>`;
    return `<div class="stepper" role="group" aria-label="${esc(d.name[lang])}">
      <button type="button" data-dec="${d.id}" aria-label="${t('menu.minus')}"><svg class="icon"><use href="#i-minus"/></svg></button>
      <output>${qty}</output>
      <button type="button" data-inc="${d.id}" aria-label="${t('menu.plus')}"><svg class="icon"><use href="#i-plus"/></svg></button>
    </div>`;
  }

  function dishCard(d, i) {
    const name = esc(d.name[lang]);
    const chef = d.chef ? `<span class="dish__chef"><svg class="icon"><use href="#i-chef"/></svg>${t('menu.chef')}</span>` : '';
    const kcal = d.macros ? `<span class="dish__kcal">${d.macros[0]} ${t('menu.kcal')}</span>` : '';
    const media = d.img === null
      ? `<div class="dish__media dish__media--ph"><img src="assets/img/brand/logo-512.png" alt="" loading="lazy">${chef}</div>`
      : `<div class="dish__media"><img src="assets/img/menu/${d.id}.jpg" alt="${name}" width="720" height="720" loading="lazy">${chef}${kcal}</div>`;
    const macros = d.macros
      ? `<div class="dish__macros"><span><b>${d.macros[1]}</b> ${t('menu.g')} ${t('menu.p')}</span><span><b>${d.macros[2]}</b> ${t('menu.g')} ${t('menu.f')}</span><span><b>${d.macros[3]}</b> ${t('menu.g')} ${t('menu.c')}</span></div>`
      : '';
    return `<article class="dish" data-id="${d.id}" style="animation-delay:${Math.min(i, 12) * 35}ms">
      ${media}
      <div class="dish__body">
        <h3 class="dish__name">${name}</h3>
        <p class="dish__desc">${esc(d.desc[lang])}</p>
        ${macros}
        <div class="dish__foot">
          <div class="dish__price">${numberFmt.format(d.price)}<small>${t('menu.currency')}</small></div>
          <div class="dish__ctrl">${ctrlHTML(d)}</div>
        </div>
      </div>
    </article>`;
  }

  function renderMenu() {
    const list = activeCat === 'all' ? DISHES : DISHES.filter((d) => d.cat === activeCat);
    $('#menuGrid').innerHTML = list.map(dishCard).join('');
  }

  /* ------------------------------------------------------- selection (cart) */
  function cartCount() { return Object.values(cart).reduce((a, b) => a + b, 0); }
  function cartSum() { return Object.entries(cart).reduce((s, [id, q]) => s + byId[id].price * q, 0); }

  function setQty(id, qty) {
    if (qty > 0) cart[id] = Math.min(qty, 99); else delete cart[id];
    store.set('uc-cart', JSON.stringify(cart));
    const ctrl = $(`.dish[data-id="${id}"] .dish__ctrl`);
    if (ctrl) ctrl.innerHTML = ctrlHTML(byId[id]);
    renderCartUI();
  }

  function renderCartUI() {
    const count = cartCount();
    const drawerOpen = $('#drawer').classList.contains('is-open');
    $('#cartBar').hidden = count === 0 || drawerOpen;
    $('#cartCount').textContent = count;
    $('#cartSum').textContent = money(cartSum());
    $('#drawerTotal').textContent = money(cartSum());

    const ids = Object.keys(cart);
    $('#drawerList').innerHTML = ids.length
      ? ids.map((id) => {
        const d = byId[id];
        const thumb = d.img === null
          ? `<span class="cart-item__ph"><img src="assets/img/brand/logo-512.png" alt=""></span>`
          : `<img src="assets/img/menu/${id}.jpg" alt="" width="56" height="56">`;
        return `<div class="cart-item">
          ${thumb}
          <div><div class="cart-item__name">${esc(d.name[lang])}</div><div class="cart-item__price">${money(d.price * cart[id])}</div></div>
          <div class="stepper">
            <button type="button" data-dec="${id}" aria-label="${t('menu.minus')}"><svg class="icon"><use href="#i-minus"/></svg></button>
            <output>${cart[id]}</output>
            <button type="button" data-inc="${id}" aria-label="${t('menu.plus')}"><svg class="icon"><use href="#i-plus"/></svg></button>
          </div>
        </div>`;
      }).join('')
      : `<p class="drawer__empty">${t('cart.empty')}</p>`;

    $('#drawerBook').disabled = !ids.length;
    $('#drawerClear').hidden = !ids.length;
    const tg = $('#drawerTelegram');
    tg.hidden = !ids.length || !CFG.booking.telegramUser;
    if (!tg.hidden) tg.href = `https://t.me/${CFG.booking.telegramUser}?text=${encodeURIComponent(orderText())}`;
  }

  function orderText() {
    const lines = Object.entries(cart).map(([id, q]) => `• ${byId[id].name[lang]} × ${q} — ${money(byId[id].price * q)}`);
    return `${t('book.order')}:\n${lines.join('\n')}\n${t('cart.total')}: ${money(cartSum())}`;
  }

  function setDrawer(open) {
    $('#drawer').classList.toggle('is-open', open);
    $('#drawer').setAttribute('aria-hidden', String(!open));
    $('#drawerOverlay').hidden = !open;
    document.body.classList.toggle('lock', open);
    renderCartUI();
    if (open) $('#drawerClose').focus();
  }

  /* --------------------------------------------------------------- gallery */
  const GALLERY = [
    { src: 'gallery/hall-wide', key: 'hall', cls: 'g-2x2' },
    { src: 'gallery/lamps-bar', key: 'lamps', cls: 'g-1x2' },
    { src: 'gallery/terrace', key: 'terrace', cls: 'g-1x2' },
    { src: 'gallery/arch-niches', key: 'arch', cls: '' },
    { src: 'gallery/window-lamps', key: 'lamps', cls: '' },
    { src: 'gallery/reserved-table', key: 'reserved', cls: 'g-2x1' },
    { src: 'gallery/sofa-palms', key: 'sofa', cls: 'g-1x2' },
    { src: 'gallery/round-table-stairs', key: 'stairs', cls: 'g-2x1' },
    { src: 'gallery/long-tables', key: 'hall', cls: '' },
    { src: 'gallery/niche-corner', key: 'arch', cls: '' },
    { src: 'gallery/booths', key: 'booths', cls: 'g-2x1' },
  ];
  let lbIndex = 0;

  function renderGallery() {
    $('#gallery-grid').innerHTML = GALLERY.map((g, i) =>
      `<button type="button" class="gallery__item reveal is-visible ${g.cls}" data-index="${i}">
        <img src="assets/img/${g.src}.jpg" alt="${esc(t('g.' + g.key))}" loading="lazy">
      </button>`
    ).join('');
    if ($('#lightbox').open) showLightbox(lbIndex);
  }

  function showLightbox(i) {
    lbIndex = (i + GALLERY.length) % GALLERY.length;
    const g = GALLERY[lbIndex];
    const alt = t('g.' + g.key);
    $('#lbImg').src = `assets/img/${g.src}.jpg`;
    $('#lbImg').alt = alt;
    $('#lbCap').textContent = alt;
  }

  /* --------------------------------------------------------------- reviews */
  function renderReviews() {
    $('#reviewsTrack').innerHTML = REVIEWS.map((r) =>
      `<article class="review">
        <svg class="icon review__quote"><use href="#i-quote"/></svg>
        <p class="review__text">${esc(r.text[lang])}</p>
        <div class="review__who">
          <span class="review__avatar" aria-hidden="true">${esc(r.name.charAt(0).toUpperCase())}</span>
          <div><span class="review__name">${esc(r.name)}</span><span class="review__src">${t('reviews.source')}</span></div>
        </div>
      </article>`
    ).join('');
  }

  /* --------------------------------------------------------------- booking */
  const modal = $('#bookingModal');
  const form = $('#bookingForm');

  function pad(n) { return String(n).padStart(2, '0'); }
  function localISODate(d = new Date()) { return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`; }

  function fillBookingSelects() {
    const guests = $('#bkGuests');
    const gPrev = guests.value || '2';
    guests.innerHTML = Array.from({ length: 10 }, (_, i) => i + 1)
      .map((n) => `<option value="${n}">${n} ${t('book.guests.unit')}</option>`).join('')
      + `<option value="10+">10+ ${t('book.guests.unit')}</option>`;
    guests.value = gPrev;
    fillTimes();
  }

  function fillTimes() {
    const sel = $('#bkTime');
    const prev = sel.value;
    const [oh, om] = CFG.hours.open.split(':').map(Number);
    const [ch, cm] = CFG.hours.close.split(':').map(Number);
    const end = ch * 60 + cm - 30;
    const isToday = $('#bkDate').value === localISODate();
    const now = new Date();
    const nowMin = now.getHours() * 60 + now.getMinutes() + 30;
    let html = `<option value="" disabled selected>—</option>`;
    for (let m = oh * 60 + om; m <= end; m += 30) {
      const label = `${pad(Math.floor(m / 60))}:${pad(m % 60)}`;
      html += `<option value="${label}"${isToday && m < nowMin ? ' disabled' : ''}>${label}</option>`;
    }
    sel.innerHTML = html;
    if (prev && !sel.querySelector(`option[value="${prev}"]:disabled`)) sel.value = prev;
  }

  function openBooking() {
    setDrawer(false);
    form.hidden = false;
    $('#bookingResult').hidden = true;
    $$('.field', form).forEach((f) => f.classList.remove('is-invalid'));
    $('#bkDate').min = localISODate();
    fillTimes();

    const comment = $('#bkComment');
    if (!comment.value || comment.value === autoComment) {
      autoComment = cartCount() ? orderText() : '';
      comment.value = autoComment;
    }
    document.body.classList.add('lock');
    if (!modal.open) modal.showModal();
  }

  function validate() {
    const data = Object.fromEntries(new FormData(form).entries());
    const phoneDigits = (data.phone || '').replace(/\D/g, '');
    const checks = {
      name: (data.name || '').trim().length >= 2,
      phone: phoneDigits.length >= 9,
      date: !!data.date,
      time: !!data.time,
    };
    Object.entries(checks).forEach(([key, ok]) => {
      $(`[data-err="${key}"]`).closest('.field').classList.toggle('is-invalid', !ok);
    });
    return Object.values(checks).every(Boolean) ? data : null;
  }

  function showResult(kind) {
    const title = $('#resultTitle');
    const text = $('#resultText');
    const phone = $('#resultPhone');
    const icon = $('.booking-result__icon use');
    form.hidden = true;
    $('#bookingResult').hidden = false;
    phone.hidden = true;

    if (kind === 'ok' || kind === 'telegram') {
      icon.setAttribute('href', '#i-check');
      title.textContent = t('book.ok.title');
      text.textContent = kind === 'telegram' ? t('book.ok.tg') : t('book.ok.text');
    } else {
      icon.setAttribute('href', '#i-phone');
      title.textContent = t('book.title');
      text.textContent = kind === 'error' ? t('book.error') : t('book.fallback');
      phone.hidden = false;
      phone.textContent = CFG.phone.display;
      if (CFG.phone.raw) phone.href = `tel:${CFG.phone.raw}`; else phone.removeAttribute('href');
    }
  }

  async function submitBooking(event) {
    event.preventDefault();
    const data = validate();
    if (!data) return;

    const label = (key) => t(key).replace(/\s*\(.*\)\s*$/, '');
    const message = [
      `${t('book.msg.head')} — Union Cafe`,
      `${label('book.name')}: ${data.name.trim()}`,
      `${label('book.phone')}: ${data.phone.trim()}`,
      `${label('book.date')}: ${data.date}`,
      `${label('book.time')}: ${data.time}`,
      `${label('book.guests')}: ${data.guests}`,
      data.comment && data.comment.trim() ? `${label('book.comment')}: ${data.comment.trim()}` : '',
    ].filter(Boolean).join('\n');

    if (CFG.booking.endpoint) {
      const submit = $('button[type="submit"]', form);
      submit.disabled = true;
      try {
        const res = await fetch(CFG.booking.endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...data, lang, message, order: cart }),
        });
        if (!res.ok) throw new Error(String(res.status));
        showResult('ok');
        resetAfterBooking();
      } catch (err) {
        showResult('error');
      } finally {
        submit.disabled = false;
      }
    } else if (CFG.booking.telegramUser) {
      window.open(`https://t.me/${CFG.booking.telegramUser}?text=${encodeURIComponent(message)}`, '_blank', 'noopener');
      showResult('telegram');
      resetAfterBooking();
    } else {
      showResult('fallback');
    }
  }

  function resetAfterBooking() {
    form.reset();
    autoComment = '';
    fillBookingSelects();
  }

  /* ----------------------------------------------------------------- shell */
  function initHeader() {
    const header = $('#header');
    const nav = $('#nav');
    const burger = $('#burger');
    const onScroll = () => header.classList.toggle('is-scrolled', window.scrollY > 24);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });

    const setNav = (open) => {
      nav.classList.toggle('is-open', open);
      header.classList.toggle('nav-open', open);
      burger.setAttribute('aria-expanded', String(open));
      $('use', burger).setAttribute('href', open ? '#i-close' : '#i-menu');
    };
    burger.addEventListener('click', () => setNav(!nav.classList.contains('is-open')));
    nav.addEventListener('click', (e) => { if (e.target.closest('a, button')) setNav(false); });
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape') setNav(false); });
    window.matchMedia('(min-width: 1021px)').addEventListener('change', () => setNav(false));
  }

  function initObservers() {
    const reveals = $$('.reveal');
    if (!('IntersectionObserver' in window)) { reveals.forEach((el) => el.classList.add('is-visible')); return; }

    const revealIO = new IntersectionObserver((entries) => {
      entries.forEach((e) => { if (e.isIntersecting) { e.target.classList.add('is-visible'); revealIO.unobserve(e.target); } });
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
    reveals.forEach((el) => revealIO.observe(el));

    const links = $$('.nav__link');
    const spyIO = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (!e.isIntersecting) return;
        links.forEach((a) => a.classList.toggle('is-active', a.getAttribute('href') === `#${e.target.id}`));
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    $$('main > section[id]').forEach((s) => spyIO.observe(s));
  }

  function bindEvents() {
    // til
    $$('.lang-switch__btn').forEach((btn) => btn.addEventListener('click', () => applyLang(btn.dataset.lang)));

    // menyu kategoriyalari
    $('#menuTabs').addEventListener('click', (e) => {
      const tab = e.target.closest('[data-cat]');
      if (!tab) return;
      activeCat = tab.dataset.cat;
      renderTabs();
      renderMenu();
    });

    // taom kartochkasi / drawer ichidagi tugmalar
    const qtyHandler = (e) => {
      const add = e.target.closest('[data-add]');
      const inc = e.target.closest('[data-inc]');
      const dec = e.target.closest('[data-dec]');
      if (add) setQty(add.dataset.add, 1);
      if (inc) setQty(inc.dataset.inc, (cart[inc.dataset.inc] || 0) + 1);
      if (dec) setQty(dec.dataset.dec, (cart[dec.dataset.dec] || 0) - 1);
    };
    $('#menuGrid').addEventListener('click', qtyHandler);
    $('#drawerList').addEventListener('click', qtyHandler);

    // drawer
    $('#cartOpen').addEventListener('click', () => setDrawer(true));
    $('#drawerClose').addEventListener('click', () => setDrawer(false));
    $('#drawerOverlay').addEventListener('click', () => setDrawer(false));
    $('#drawerClear').addEventListener('click', () => { Object.keys(cart).forEach((id) => setQty(id, 0)); setDrawer(false); });
    $('#drawerBook').addEventListener('click', openBooking);
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && $('#drawer').classList.contains('is-open')) setDrawer(false); });

    // bron
    document.addEventListener('click', (e) => { if (e.target.closest('[data-open-booking]')) openBooking(); });
    form.addEventListener('submit', submitBooking);
    $('#bkDate').addEventListener('change', fillTimes);
    $$('.field input, .field select', form).forEach((el) => el.addEventListener('input', () => el.closest('.field').classList.remove('is-invalid')));

    // dialoglarni yopish
    $$('dialog').forEach((dlg) => {
      dlg.addEventListener('click', (e) => { if (e.target === dlg || e.target.closest('[data-close]')) dlg.close(); });
      dlg.addEventListener('close', () => { if (!$('dialog[open]')) document.body.classList.remove('lock'); });
    });

    // galereya
    const lightbox = $('#lightbox');
    $('#gallery-grid').addEventListener('click', (e) => {
      const item = e.target.closest('[data-index]');
      if (!item) return;
      showLightbox(Number(item.dataset.index));
      document.body.classList.add('lock');
      lightbox.showModal();
    });
    $('#lbPrev').addEventListener('click', () => showLightbox(lbIndex - 1));
    $('#lbNext').addEventListener('click', () => showLightbox(lbIndex + 1));
    lightbox.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowLeft') showLightbox(lbIndex - 1);
      if (e.key === 'ArrowRight') showLightbox(lbIndex + 1);
    });
    let touchX = null;
    lightbox.addEventListener('touchstart', (e) => { touchX = e.changedTouches[0].clientX; }, { passive: true });
    lightbox.addEventListener('touchend', (e) => {
      if (touchX === null) return;
      const dx = e.changedTouches[0].clientX - touchX;
      if (Math.abs(dx) > 50) showLightbox(lbIndex + (dx < 0 ? 1 : -1));
      touchX = null;
    }, { passive: true });

    // sharhlar karuseli
    const track = $('#reviewsTrack');
    const step = () => Math.min(track.clientWidth * 0.8, 420);
    $('#revPrev').addEventListener('click', () => track.scrollBy({ left: -step(), behavior: 'smooth' }));
    $('#revNext').addEventListener('click', () => track.scrollBy({ left: step(), behavior: 'smooth' }));
    track.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowLeft') track.scrollBy({ left: -step(), behavior: 'smooth' });
      if (e.key === 'ArrowRight') track.scrollBy({ left: step(), behavior: 'smooth' });
    });
  }

  /* ------------------------------------------------------------------ init */
  $('#year').textContent = new Date().getFullYear();
  bindEvents();
  initHeader();
  applyLang(lang);
  initObservers();
})();
