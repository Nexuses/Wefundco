(function () {
  'use strict';

  const hero = document.getElementById('top');
  if (!hero || !document.body.classList.contains('page-home')) return;

  const bg = hero.querySelector('.home-hero__bg');
  const lightField = hero.querySelector('.home-hero__light-field');
  const cursorReveal = document.getElementById('homeHeroCursorReveal');
  if (!bg || !lightField || !cursorReveal) return;

  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const stops = Array.from(cursorReveal.querySelectorAll('stop'));

  // Fixed hero center — no cursor tracking
  const CX = 800;
  const CY = 500;
  cursorReveal.setAttribute('cx', String(CX));
  cursorReveal.setAttribute('cy', String(CY));
  lightField.style.setProperty('--cursor-x', '50%');
  lightField.style.setProperty('--cursor-y', '50%');
  bg.style.setProperty('--grid-shift-x', '0px');
  bg.style.setProperty('--grid-shift-y', '0px');
  bg.style.setProperty('--grid-repel-scale', '1');

  function setStops(configs) {
    configs.forEach((cfg, i) => {
      if (!stops[i]) return;
      stops[i].setAttribute('offset', cfg.offset);
      stops[i].setAttribute('stop-opacity', String(cfg.opacity));
      stops[i].setAttribute('stop-color', cfg.color || 'white');
    });
  }

  function resetPulse() {
    cursorReveal.setAttribute('r', '48');
    setStops([
      { offset: '0%', opacity: 0, color: 'black' },
      { offset: '40%', opacity: 0, color: 'black' },
      { offset: '70%', opacity: 0, color: 'white' },
      { offset: '100%', opacity: 0, color: 'black' }
    ]);
    lightField.style.opacity = '0';
    bg.style.setProperty('--grid-repel-scale', '1');
    hero.classList.remove('is-repel-active');
    lightField.classList.remove('is-active');
  }

  if (reducedMotion) {
    cursorReveal.setAttribute('r', '520');
    setStops([
      { offset: '0%', opacity: 0.55, color: 'white' },
      { offset: '45%', opacity: 0.35, color: 'white' },
      { offset: '75%', opacity: 0.12, color: 'white' },
      { offset: '100%', opacity: 0, color: 'black' }
    ]);
    hero.classList.add('is-repel-active');
    lightField.classList.add('is-active');
    lightField.style.opacity = '0.35';
    return;
  }

  const CYCLE_MS = 3000;
  const PULSE_MS = 1600;
  const start = performance.now();

  function easeOutCubic(t) {
    return 1 - Math.pow(1 - t, 3);
  }

  function frame(now) {
    const elapsed = (now - start) % CYCLE_MS;

    if (elapsed > PULSE_MS) {
      resetPulse();
      requestAnimationFrame(frame);
      return;
    }

    const t = elapsed / PULSE_MS;
    const e = easeOutCubic(t);

    // Expanding ring from center — bright arrows travel outward
    const r = 60 + e * 900;
    cursorReveal.setAttribute('r', r.toFixed(1));

    const bandStart = Math.max(0, 55 + e * 28);
    const bandPeak = Math.min(96, bandStart + 18);
    setStops([
      { offset: '0%', opacity: 0, color: 'black' },
      { offset: bandStart.toFixed(1) + '%', opacity: 0, color: 'black' },
      { offset: bandPeak.toFixed(1) + '%', opacity: 1, color: 'white' },
      { offset: '100%', opacity: 0, color: 'black' }
    ]);

    const fade = t < 0.12 ? t / 0.12 : t > 0.72 ? (1 - t) / 0.28 : 1;
    lightField.style.opacity = String(Math.max(0, Math.min(1, fade * 0.75)));
    bg.style.setProperty('--grid-repel-scale', (1 + e * 0.05).toFixed(4));

    hero.classList.add('is-repel-active');
    lightField.classList.add('is-active');

    requestAnimationFrame(frame);
  }

  resetPulse();
  requestAnimationFrame(frame);
})();
