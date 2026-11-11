(function () {
  'use strict';

  const hero = document.getElementById('top');
  if (!hero || !document.body.classList.contains('page-home')) return;

  const bg = hero.querySelector('.home-hero__bg');
  const lightField = hero.querySelector('.home-hero__light-field');
  const cursorReveal = document.getElementById('homeHeroCursorReveal');
  if (!bg || !lightField || !cursorReveal) return;

  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  let targetX = 800;
  let targetY = 480;
  let currentX = 800;
  let currentY = 480;
  let targetClientX = 50;
  let targetClientY = 48;
  let rafId = null;
  let isInside = false;

  function updateTarget(event) {
    const rect = hero.getBoundingClientRect();
    const x = Math.max(0, Math.min(1, (event.clientX - rect.left) / rect.width));
    const y = Math.max(0, Math.min(1, (event.clientY - rect.top) / rect.height));
    targetX = x * 1600;
    targetY = y * 1000;
    targetClientX = x * 100;
    targetClientY = y * 100;
  }

  function animate() {
    const ease = 0.085;
    currentX += (targetX - currentX) * ease;
    currentY += (targetY - currentY) * ease;

    cursorReveal.setAttribute('cx', currentX.toFixed(1));
    cursorReveal.setAttribute('cy', currentY.toFixed(1));
    lightField.style.setProperty('--cursor-x', targetClientX + '%');
    lightField.style.setProperty('--cursor-y', targetClientY + '%');

    const dx = ((currentX / 1600) - 0.5) * -7;
    const dy = ((currentY / 1000) - 0.5) * -5;
    bg.style.setProperty('--grid-shift-x', dx.toFixed(2) + 'px');
    bg.style.setProperty('--grid-shift-y', dy.toFixed(2) + 'px');

    const stillMoving = Math.abs(targetX - currentX) > 0.25 || Math.abs(targetY - currentY) > 0.25;
    if (stillMoving || isInside) {
      rafId = requestAnimationFrame(animate);
    } else {
      rafId = null;
    }
  }

  function startAnimation() {
    if (reducedMotion || rafId !== null) return;
    rafId = requestAnimationFrame(animate);
  }

  hero.addEventListener('pointerenter', (event) => {
    if (event.pointerType === 'touch') return;
    isInside = true;
    hero.classList.add('is-pointer-active');
    lightField.classList.add('is-active');
    updateTarget(event);
    startAnimation();
  });

  hero.addEventListener('pointermove', (event) => {
    if (event.pointerType === 'touch') return;
    updateTarget(event);
    startAnimation();
  });

  hero.addEventListener('pointerleave', () => {
    isInside = false;
    hero.classList.remove('is-pointer-active');
    lightField.classList.remove('is-active');
    targetX = 800;
    targetY = 480;
    targetClientX = 50;
    targetClientY = 48;
    startAnimation();
  });
})();
