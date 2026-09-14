/* =========================================================
   WeFundCo — interactions
   ---------------------------------------------------------
   ⚠️  PLACEHOLDER NUMBERS
   Every counter on the page reads its value from the
   data-count attribute in index.html. Search index.html for
   `data-count` to swap them all in one pass before launch.
   Current placeholders: 640 waitlist · 50 startup seats ·
   12 sectors · 18 cities · stat-card %s.
   ========================================================= */

(function () {
  'use strict';

  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const $  = (s, c) => (c || document).querySelector(s);
  const $$ = (s, c) => Array.from((c || document).querySelectorAll(s));

  /* Simple Icons (CC0) for live-page footer socials. Destinations stay in HTML. */
  const SOCIAL_ICONS = {
    LinkedIn: '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.225 0z"/></svg>',
    X: '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M18.901 1.153h3.68l-8.04 9.19L24 22.846h-7.406l-5.8-7.584-6.638 7.584H.474l8.6-9.83L0 1.154h7.594l5.243 6.932ZM17.61 20.644h2.039L6.486 3.24H4.298Z"/></svg>',
    YouTube: '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>',
    Instagram: '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M12 0C8.74 0 8.333.015 7.053.072 5.775.132 4.905.333 4.14.63c-.789.306-1.459.717-2.126 1.384S.935 3.35.63 4.14C.333 4.905.131 5.775.072 7.053.012 8.333 0 8.74 0 12s.015 3.667.072 4.947c.06 1.277.261 2.148.558 2.913.306.788.717 1.459 1.384 2.126.667.666 1.336 1.079 2.126 1.384.766.296 1.636.499 2.913.558C8.333 23.988 8.74 24 12 24s3.667-.015 4.947-.072c1.277-.06 2.148-.262 2.913-.558.788-.306 1.459-.718 2.126-1.384.666-.667 1.079-1.335 1.384-2.126.296-.765.499-1.636.558-2.913.06-1.28.072-1.687.072-4.947s-.015-3.667-.072-4.947c-.06-1.277-.262-2.149-.558-2.913-.306-.789-.718-1.459-1.384-2.126C21.319 1.347 20.651.935 19.86.63c-.765-.297-1.636-.499-2.913-.558C15.667.012 15.26 0 12 0zm0 2.16c3.203 0 3.585.016 4.85.071 1.17.055 1.805.249 2.227.415.562.217.96.477 1.382.896.419.42.679.819.896 1.381.164.422.36 1.057.413 2.227.057 1.266.07 1.646.07 4.85s-.015 3.585-.074 4.85c-.061 1.17-.256 1.805-.421 2.227-.224.562-.479.96-.899 1.382-.419.419-.824.679-1.38.896-.42.164-1.065.36-2.235.413-1.274.057-1.649.07-4.859.07-3.211 0-3.586-.015-4.859-.074-1.171-.061-1.816-.256-2.236-.421-.569-.224-.96-.479-1.379-.899-.421-.419-.69-.824-.9-1.38-.165-.42-.359-1.065-.42-2.235-.045-1.26-.061-1.649-.061-4.844 0-3.196.016-3.586.061-4.861.061-1.17.255-1.814.42-2.234.21-.57.479-.96.9-1.381.419-.419.81-.689 1.379-.898.42-.166 1.051-.361 2.221-.421 1.275-.045 1.65-.06 4.859-.06l.045.03zm0 3.678c-3.405 0-6.162 2.76-6.162 6.162 0 3.405 2.76 6.162 6.162 6.162 3.405 0 6.162-2.76 6.162-6.162 0-3.405-2.757-6.162-6.162-6.162zM12 16c-2.21 0-4-1.79-4-4s1.79-4 4-4 4 1.79 4 4-1.79 4-4 4zm7.846-10.405c0 .795-.646 1.44-1.44 1.44-.795 0-1.44-.646-1.44-1.44 0-.794.646-1.439 1.44-1.439.793-.001 1.44.645 1.44 1.439z"/></svg>',
    Facebook: '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M9.101 23.691v-7.98H6.627v-3.667h2.474v-1.58c0-4.085 1.848-5.978 5.859-5.978.401 0 .955.042 1.468.103a8.68 8.68 0 0 1 1.141.195v3.325a8.623 8.623 0 0 0-.653-.036c-.934 0-1.303.37-1.303 1.332v2.64h2.66l-.53 3.667h-2.13v7.98C19.396 23.293 24 18.299 24 12.045c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.628 3.874 10.35 9.101 11.647Z"/></svg>'
  };
  $$('.footer__social a').forEach((a) => {
    const icon = SOCIAL_ICONS[a.getAttribute('aria-label')];
    if (icon) a.innerHTML = icon;
  });
  if ($('.footer__social')) {
    const iconStyle = document.createElement('style');
    iconStyle.textContent = '.footer__social{flex-wrap:wrap}.footer__social a{color:#fff;font-size:0}.footer__social a svg{width:16px;height:16px;display:block;fill:currentColor}.footer__social a:focus-visible{outline:2px solid #fff;outline-offset:3px}';
    document.head.appendChild(iconStyle);
  }

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
  if (nav) {
    const onScrollNav = () => nav.classList.toggle('is-stuck', window.scrollY > 10);
    onScrollNav();
    window.addEventListener('scroll', onScrollNav, { passive: true });
  }

  /* mobile menu */
  const burger = $('#navBurger');
  const navLinks = $('#navLinks');
  if (burger && navLinks) {
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
    const parts = $$('.statement__part', el);
    const targets = parts.length ? parts : [el];
    targets.forEach((part) => {
      const words = part.textContent.trim().split(/\s+/);
      part.textContent = '';
      words.forEach((w, i) => {
        const s = document.createElement('span');
        s.className = 'w';
        s.textContent = w;
        part.appendChild(s);
        if (i < words.length - 1) part.appendChild(document.createTextNode(' '));
      });
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
  const stackSection = ($('#stack') || $('.stack-section'));
  const stackCards = stackSection ? $$('.stat-card', stackSection) : [];
  const stackCardsWrap = stackSection ? stackSection.querySelector('.stack__cards') : null;

  function stackScrollRange() {
    if (!stackSection) return 0;
    return Math.max(stackSection.offsetHeight - window.innerHeight, 1);
  }

  function syncStackSectionHeight() {
    if (!stackSection || !stackCards.length) return;
    const runwayPerCard = stackSection.classList.contains('stack-section--reasons') ? 42 : 70;
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
    const cardWidth = stackCards[0].offsetWidth;
    const maxOffset = Math.max(stackCardsWrap.offsetWidth - cardWidth, 0);
    const step = n > 1 ? Math.min(cardWidth * 0.7, maxOffset / (n - 1)) : 0;

    stackCards.forEach((card, i) => {
      card.style.zIndex = i + 1;
      const landedX = i * step;

      // Card 1 stays put; each next card slides in from the right and settles
      // about 70% across the previous card while still fitting in the wrapper.
      if (i === 0) {
        card.style.transform = 'translate3d(0,-50%,0)';
        return;
      }

      const segStart = (i - 1) / (n - 1);
      const segEnd = i / (n - 1);

      if (p >= segEnd) {
        card.style.transform = `translate3d(${landedX}px,-50%,0)`;
      } else if (p <= segStart) {
        card.style.transform = `translate3d(${enterFrom}px,-50%,0)`;
      } else {
        const t = (p - segStart) / (segEnd - segStart);
        const eased = 1 - Math.pow(1 - t, 3);
        const x = landedX + (enterFrom - landedX) * (1 - eased);
        card.style.transform = `translate3d(${x}px,-50%,0)`;
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
     10. Waitlist form → POST /api/waitlist
     --------------------------------------------------------- */
  const waitlistSuccessModal = $('#waitlistSuccessModal');
  let lastWaitlistEmail = '';
  const WAITLIST_COPY = {
    joined: {
      title: "You're on the waitlist.",
      text: "We'll be in touch shortly with a few questions to evaluate your profile and take things forward. While you wait, join WeFundCo Circle, our WhatsApp community for founders, operators and investors, and start the conversation early."
    },
    already: {
      title: "You're already on the waitlist.",
      text: "You're already on our list, so we won't send another confirmation. While you wait, join WeFundCo Circle, our WhatsApp community for founders, operators and investors, and start the conversation early."
    }
  };

  function resetPhoneForm() {
    const form = $('#waitlistPhoneForm', waitlistSuccessModal);
    const phoneEl = $('#waitlistPhone', waitlistSuccessModal);
    const msgEl = $('#waitlistPhoneMsg', waitlistSuccessModal);
    if (form) form.classList.remove('is-saved');
    if (phoneEl) {
      phoneEl.value = '';
      phoneEl.disabled = false;
    }
    if (msgEl) {
      msgEl.textContent = '';
      msgEl.classList.remove('is-ok', 'is-error');
    }
    const submit = form && form.querySelector('button[type="submit"]');
    if (submit) {
      submit.disabled = false;
      submit.textContent = 'Save number';
    }
  }

  function openWaitlistSuccessModal(opts) {
    if (!waitlistSuccessModal) return false;
    const alreadyJoined = !!(opts && opts.alreadyJoined);
    const copy = alreadyJoined ? WAITLIST_COPY.already : WAITLIST_COPY.joined;
    const titleEl = $('#waitlistSuccessTitle', waitlistSuccessModal);
    const textEl = $('#waitlistSuccessText', waitlistSuccessModal);
    if (titleEl) titleEl.textContent = copy.title;
    if (textEl) textEl.textContent = copy.text;
    lastWaitlistEmail = (opts && opts.email) || '';
    resetPhoneForm();

    const tick = $('.wfc-modal__tick', waitlistSuccessModal);
    if (tick) {
      tick.classList.remove('is-animating');
      void tick.offsetWidth;
      tick.classList.add('is-animating');
    }

    waitlistSuccessModal.classList.add('is-open');
    waitlistSuccessModal.setAttribute('aria-hidden', 'false');
    document.body.classList.add('modal-open');
    const phoneEl = $('#waitlistPhone', waitlistSuccessModal);
    if (phoneEl) phoneEl.focus();
    else {
      const cta = $('.wfc-modal__whatsapp', waitlistSuccessModal);
      if (cta) cta.focus();
    }
    return true;
  }

  function closeWaitlistSuccessModal() {
    if (!waitlistSuccessModal) return;
    waitlistSuccessModal.classList.remove('is-open');
    waitlistSuccessModal.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('modal-open');
  }

  if (waitlistSuccessModal) {
    $$('[data-modal-close]', waitlistSuccessModal).forEach((el) => {
      el.addEventListener('click', closeWaitlistSuccessModal);
    });
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && waitlistSuccessModal.classList.contains('is-open')) {
        closeWaitlistSuccessModal();
      }
    });

    const phoneForm = $('#waitlistPhoneForm', waitlistSuccessModal);
    if (phoneForm) {
      phoneForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const phoneEl = $('#waitlistPhone', waitlistSuccessModal);
        const msgEl = $('#waitlistPhoneMsg', waitlistSuccessModal);
        const submit = phoneForm.querySelector('button[type="submit"]');
        const phone = (phoneEl && phoneEl.value || '').trim();
        const digits = phone.replace(/\D/g, '');

        if (!lastWaitlistEmail) {
          if (msgEl) {
            msgEl.textContent = 'Please join the waitlist with your email first.';
            msgEl.classList.remove('is-ok');
            msgEl.classList.add('is-error');
          }
          return;
        }
        if (digits.length < 8 || digits.length > 15) {
          if (msgEl) {
            msgEl.textContent = 'Enter a valid phone number so we can send updates.';
            msgEl.classList.remove('is-ok');
            msgEl.classList.add('is-error');
          }
          return;
        }

        if (submit) {
          submit.disabled = true;
          submit.textContent = 'Saving…';
        }
        if (msgEl) {
          msgEl.textContent = '';
          msgEl.classList.remove('is-ok', 'is-error');
        }

        try {
          const res = await fetch('/api/waitlist', {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: lastWaitlistEmail, phone })
          });
          const data = await res.json().catch(() => ({}));
          if (!res.ok) throw new Error(data.error || 'Could not save your number.');
          closeWaitlistSuccessModal();
          return;
        } catch (err) {
          if (submit) {
            submit.disabled = false;
            submit.textContent = 'Save number';
          }
          if (msgEl) {
            msgEl.textContent = err.message || 'Could not save your number just now.';
            msgEl.classList.remove('is-ok');
            msgEl.classList.add('is-error');
          }
        }
      });
    }
  }

  function isWorkEmail(value) {
    if (!value || value.indexOf(' ') !== -1) return false;
    const at = value.indexOf('@');
    if (at < 1) return false;
    const domain = value.slice(at + 1);
    const dot = domain.lastIndexOf('.');
    return dot > 0 && dot < domain.length - 2;
  }

  function inferRole(form) {
    const checked = ($('input[name="role"]:checked', form) || {}).value;
    if (checked) return checked;
    if (form.dataset.role) return form.dataset.role;
    if (/startup/i.test(location.pathname)) return 'startup';
    if (/investor/i.test(location.pathname)) return 'investor';
    return 'general';
  }

  function bindWaitlist(form, emailEl, msgEl, colors) {
    if (!form || !emailEl) return;
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const email = emailEl.value.trim();
      const btn = form.querySelector('button[type="submit"]');

      if (!isWorkEmail(email)) {
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

      const payload = {
        email,
        role: inferRole(form),
        source: form.dataset.source || form.id || 'waitlist',
        page: location.pathname
      };

      if (btn) {
        btn.disabled = true;
        btn.dataset.label = btn.innerHTML;
        btn.textContent = 'Joining…';
      }
      if (msgEl) msgEl.textContent = '';

      try {
        const res = await fetch('/api/waitlist', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        const data = await res.json().catch(() => ({}));
        if (res.status === 409 || data.alreadyJoined === true) {
          throw new Error(data.error || 'This email is already on the waitlist.');
        }
        if (!res.ok) {
          throw new Error(data.error || 'Could not join the waitlist.');
        }
        if (openWaitlistSuccessModal({ alreadyJoined: false, email })) {
          if (msgEl) msgEl.textContent = '';
        } else if (msgEl) {
          msgEl.textContent = data.message || "You're on the list. We'll be in touch before launch.";
          msgEl.style.color = colors.ok;
        }
        form.reset();
      } catch (err) {
        if (msgEl) {
          msgEl.textContent = err.message || 'Could not join the waitlist just now.';
          msgEl.style.color = colors.error;
        } else {
          emailEl.setCustomValidity(err.message || 'Could not join the waitlist just now.');
          emailEl.reportValidity();
          emailEl.setCustomValidity('');
        }
      } finally {
        if (btn) {
          btn.disabled = false;
          btn.innerHTML = btn.dataset.label || btn.innerHTML;
        }
      }
    });
  }

  bindWaitlist($('#waitlistForm'), $('#wlEmail'), $('#wlMsg'), {
    error: '#FFB4B4',
    ok: '#D4F4F8'
  });
  bindWaitlist($('#heroWaitlistForm'), $('#heroEmail'), $('#heroMsg'), {
    error: '#B42318',
    ok: '#0AAFC8'
  });
  bindWaitlist($('#closeWaitlistForm'), $('#closeEmail'), $('#closeMsg'), {
    error: '#FFB4B4',
    ok: '#D4F4F8'
  });

  /* ---------------------------------------------------------
     11. Image fallback — if a stock photo fails to load,
         swap in a brand gradient so nothing looks broken.
     --------------------------------------------------------- */
  const grads = [
    'linear-gradient(135deg,#E6F4FD,#C5D8F5 55%,#D4F4F8)',
    'linear-gradient(135deg,#D6EEFC,#C5D8F5 60%,#E6F4FD)',
    'linear-gradient(135deg,#D4F4F8,#E6F4FD)',
    'linear-gradient(135deg,#C5D8F5,#D6EEFC)'
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
