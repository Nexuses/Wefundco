/* =========================================================
   WeFundCo — interactions
   ---------------------------------------------------------
   ⚠️  PLACEHOLDER NUMBERS
   Every counter on the page reads its value from the
   data-count attribute in index.html. Search index.html for
   `data-count` to swap them all in one pass before launch.
   Current placeholders: 640 waitlist · 100 investor seats ·
   50 startup seats · 24 partners · 18 cities · stat-card %s.
   ========================================================= */

(function () {
  'use strict';

  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const $  = (s, c) => (c || document).querySelector(s);
  const $$ = (s, c) => Array.from((c || document).querySelectorAll(s));

  /* ---------------------------------------------------------
     1. Scroll reveal (.reveal, .bar, hero line-mask)
        Rect-based rather than IntersectionObserver: IO callbacks
        can be coalesced during fast scrolling / anchor jumps and
        leave elements permanently invisible. This never misses.
     --------------------------------------------------------- */
  let revealQueue = $$('.reveal, .bar, .hero__title');

  function paintReveals() {
    if (!revealQueue.length) return;
    const vh = window.innerHeight;
    revealQueue = revealQueue.filter((el) => {
      const r = el.getBoundingClientRect();
      const visible = r.top < vh * 0.92 && r.bottom > 0;
      if (!visible) return true;
      const delay = parseInt(el.dataset.delay || 0, 10);
      if (delay) setTimeout(() => el.classList.add('is-in'), delay);
      else el.classList.add('is-in');
      return false;
    });
  }

  /* ---------------------------------------------------------
     2. Number count-up
     --------------------------------------------------------- */
  function countUp(el) {
    const target = parseFloat(el.dataset.count);
    const suffix = el.dataset.suffix || '';
    if (isNaN(target)) return;
    if (reduced) { el.textContent = target + suffix; return; }

    const dur = 1500;
    const start = performance.now();
    (function tick(now) {
      const p = Math.min((now - start) / dur, 1);
      const eased = 1 - Math.pow(1 - p, 3);
      el.textContent = Math.round(target * eased).toLocaleString('en-IN') + suffix;
      if (p < 1) requestAnimationFrame(tick);
    })(start);
  }

  let countQueue = $$('[data-count]');

  function paintCounts() {
    if (!countQueue.length) return;
    const vh = window.innerHeight;
    countQueue = countQueue.filter((el) => {
      const r = el.getBoundingClientRect();
      if (r.top > vh * 0.9 || r.bottom < 0) return true;
      countUp(el);
      return false;
    });
  }

  /* ---------------------------------------------------------
     3. Sticky nav border
     --------------------------------------------------------- */
  const nav = $('#nav');
  const onScrollNav = () => nav.classList.toggle('is-stuck', window.scrollY > 10);
  onScrollNav();
  window.addEventListener('scroll', onScrollNav, { passive: true });

  /* mobile menu */
  const burger = $('#navBurger');
  const navLinks = $('#navLinks');
  if (burger) {
    burger.addEventListener('click', () => navLinks.classList.toggle('is-open'));
    $$('a', navLinks).forEach((a) =>
      a.addEventListener('click', () => navLinks.classList.remove('is-open'))
    );
  }

  /* ---------------------------------------------------------
     4. Hero image strip — horizontal drift on scroll
     --------------------------------------------------------- */
  const strip = $('#strip');
  const stripTrack = $('#stripTrack');

  /* ---------------------------------------------------------
     5. Word-by-word statement reveal
     --------------------------------------------------------- */
  $$('.reveal-words').forEach((el) => {
    const words = el.textContent.trim().split(/\s+/);
    el.textContent = '';
    words.forEach((w, i) => {
      const s = document.createElement('span');
      s.className = 'w';
      s.textContent = w;
      el.appendChild(s);
      if (i < words.length - 1) el.appendChild(document.createTextNode(' '));
    });
  });

  function paintWords() {
    $$('.reveal-words').forEach((el) => {
      const spans = $$('.w', el);
      const r = el.getBoundingClientRect();
      const vh = window.innerHeight;
      // progress: 0 when block enters lower third, 1 when it clears upper third
      const p = (vh * 0.82 - r.top) / (r.height + vh * 0.32);
      const lit = Math.round(Math.max(0, Math.min(1, p)) * spans.length);
      spans.forEach((s, i) => s.classList.toggle('on', i < lit));
    });
  }

  /* ---------------------------------------------------------
     6. Stacking stat cards (scroll-pinned)
     --------------------------------------------------------- */
  const stackSection = $('#stack');
  const stackCards = stackSection ? $$('.stat-card', stackSection) : [];
  const stackCardsWrap = stackSection ? stackSection.querySelector('.stack__cards') : null;

  function stackScrollRange() {
    if (!stackSection) return 0;
    return Math.max(stackSection.offsetHeight - window.innerHeight, 1);
  }

  function syncStackSectionHeight() {
    if (!stackSection || !stackCards.length) return;
    const runwayPerCard = 70;
    const runway = (stackCards.length - 1) * runwayPerCard;
    stackSection.style.height = `${100 + runway}vh`;
  }

  function paintStack() {
    if (!stackSection || !stackCards.length || !stackCardsWrap) return;

    const r = stackSection.getBoundingClientRect();
    const scrollable = stackScrollRange();
    // Progress 0→1 while the section is top-pinned and the runway scrolls away.
    const p = Math.max(0, Math.min(1, -r.top / scrollable));
    const n = stackCards.length;
    const enterFrom = stackCardsWrap.offsetWidth + 48;

    stackCards.forEach((card, i) => {
      card.style.zIndex = i + 1;

      // Card 1 stays put; each next card slides in from the right and stacks at x=0.
      if (i === 0) {
        card.style.transform = 'translate3d(0,0,0)';
        return;
      }

      const segStart = (i - 1) / (n - 1);
      const segEnd = i / (n - 1);

      if (p >= segEnd) {
        card.style.transform = 'translate3d(0,0,0)';
      } else if (p <= segStart) {
        card.style.transform = `translate3d(${enterFrom}px,0,0)`;
      } else {
        const t = (p - segStart) / (segEnd - segStart);
        const eased = 1 - Math.pow(1 - t, 3);
        card.style.transform = `translate3d(${enterFrom * (1 - eased)}px,0,0)`;
      }
    });
  }

  /* ---------------------------------------------------------
     7. Master scroll loop (rAF-throttled)
     --------------------------------------------------------- */
  let ticking = false;
  function onScroll() {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => {
      // strip drift
      if (strip && stripTrack && !reduced) {
        const r = strip.getBoundingClientRect();
        const vh = window.innerHeight;
        const prog = Math.max(0, Math.min(1, (vh - r.top) / (vh + r.height)));
        const max = stripTrack.scrollWidth - window.innerWidth;
        if (max > 0) stripTrack.style.transform = `translate3d(${-max * prog * 0.85}px,0,0)`;
      }
      paintReveals();
      paintCounts();
      paintWords();
      if (!reduced) paintStack();
      ticking = false;
    });
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', () => {
    syncStackSectionHeight();
    onScroll();
  });
  syncStackSectionHeight();
  onScroll();

  /* ---------------------------------------------------------
     8. How-it-works carousel arrows
     --------------------------------------------------------- */
  const rail = $('#howRail');
  const prev = $('#howPrev');
  const next = $('#howNext');
  if (rail && prev && next) {
    const step = () => (rail.querySelector('.how-card')?.offsetWidth || 320) + 20;
    prev.addEventListener('click', () => rail.scrollBy({ left: -step(), behavior: 'smooth' }));
    next.addEventListener('click', () => rail.scrollBy({ left: step(), behavior: 'smooth' }));

    const syncArrows = () => {
      prev.disabled = rail.scrollLeft < 4;
      next.disabled = rail.scrollLeft > rail.scrollWidth - rail.clientWidth - 4;
    };
    rail.addEventListener('scroll', syncArrows, { passive: true });
    window.addEventListener('resize', syncArrows);
    syncArrows();
  }

  /* ---------------------------------------------------------
     9. FAQ — one open at a time
     --------------------------------------------------------- */
  const faqItems = $$('.faq__item');
  faqItems.forEach((d) =>
    d.addEventListener('toggle', () => {
      if (d.open) faqItems.forEach((o) => { if (o !== d) o.open = false; });
    })
  );

  /* ---------------------------------------------------------
     10. Waitlist form
         ⚠️ Front-end only. Wire `payload` to your CRM /
         email tool (HubSpot, Mailchimp, Sheets, API) here.
     --------------------------------------------------------- */
  function bindWaitlist(form, emailEl, msgEl, colors) {
    if (!form || !emailEl) return;
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const email = emailEl.value.trim();
      const role = ($('input[name="role"]:checked', form) || {}).value || 'investor';

      if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) {
        if (msgEl) {
          msgEl.textContent = 'Please enter a valid work email address.';
          msgEl.style.color = colors.error;
        } else {
          emailEl.setCustomValidity('Please enter a valid work email address.');
          emailEl.reportValidity();
          emailEl.setCustomValidity('');
        }
        return;
      }

      const payload = { email, role, ts: new Date().toISOString() };
      console.log('[WeFundCo] waitlist submission →', payload); // TODO: POST to your endpoint

      if (msgEl) {
        msgEl.textContent = "You're on the list. We'll be in touch before launch.";
        msgEl.style.color = colors.ok;
      }
      form.reset();
    });
  }

  bindWaitlist($('#waitlistForm'), $('#wlEmail'), $('#wlMsg'), {
    error: '#FFC9C9',
    ok: '#A9F0C6'
  });
  bindWaitlist($('#heroWaitlistForm'), $('#heroEmail'), null, {
    error: '#B42318',
    ok: '#0F7B4A'
  });

  /* ---------------------------------------------------------
     11. Image fallback — if a stock photo fails to load,
         swap in a brand gradient so nothing looks broken.
     --------------------------------------------------------- */
  const grads = [
    'linear-gradient(135deg,#DCE6FF,#F6D9EC 55%,#FFE9CF)',
    'linear-gradient(135deg,#FFE3EE,#EADCFF 60%,#D9ECFF)',
    'linear-gradient(135deg,#A9F0C6,#D8E7FF)',
    'linear-gradient(135deg,#E4D3FB,#F8D6E6)'
  ];
  const BLANK =
    'data:image/svg+xml;charset=utf-8,' +
    encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="16" height="10"/>');

  $$('img').forEach((img, i) => {
    if (img.classList.contains('how-card__icon') || img.classList.contains('how-card__fill-img')) {
      img.addEventListener('error', () => { img.style.visibility = 'hidden'; });
      return;
    }
    const fallback = () => {
      img.style.background = grads[i % grads.length];
      img.style.objectFit = 'cover';
      img.alt = '';
      img.src = BLANK;
    };
    img.addEventListener('error', function onErr() {
      img.removeEventListener('error', onErr); // avoid a loop on the fallback itself
      fallback();
    });
    // images that already failed before this script ran
    if (img.complete && img.naturalWidth === 0 && img.getAttribute('src')) fallback();
  });
})();
