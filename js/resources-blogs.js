(function () {
  'use strict';

  const preview = document.getElementById('resourcesPreview');
  const grid = document.getElementById('resourcesBlogGrid');
  if (!preview || !grid) return;

  const veil = document.getElementById('resourcesVeil');
  const gate = document.getElementById('resourcesGate');
  const comingSoonHint = document.getElementById('resourcesComingSoonHint');

  function escapeHtml(value) {
    return String(value || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function encodeAssetUrl(url) {
    const raw = String(url || '').trim();
    if (!raw) return '';
    if (/^https?:\/\//i.test(raw)) return raw;
    return raw
      .split('/')
      .map((part, index) => (index === 0 && part === '' ? '' : encodeURIComponent(part)))
      .join('/');
  }

  function cardHtml(item, delay) {
    const href = '/resources/blogs/' + encodeURIComponent(item.slug);
    const img = escapeHtml(encodeAssetUrl(item.coverImageUrl || ''));
    const dateIso = escapeHtml(item.publishedAtIso || '');
    const dateLabel = escapeHtml(item.publishedAtLabel || '');
    const author = escapeHtml(item.author || '');
    const title = escapeHtml(item.title || '');
    return `
      <a class="blog-card reveal is-in" href="${href}" role="listitem" data-delay="${delay}">
        <figure class="blog-card__media">
          <img src="${img}" alt="" width="800" height="500" loading="lazy" decoding="async" />
        </figure>
        <div class="blog-card__body">
          <p class="blog-card__meta">
            <time datetime="${dateIso}">${dateLabel}</time>
            <span class="blog-card__author">${author}</span>
          </p>
          <h2 class="blog-card__title">${title}</h2>
        </div>
      </a>`;
  }

  function revealLive(items) {
    preview.classList.add('is-live');
    grid.removeAttribute('aria-hidden');
    grid.setAttribute('role', 'list');
    if (veil) veil.remove();
    if (gate) gate.remove();
    if (comingSoonHint) comingSoonHint.remove();
    grid.innerHTML = items
      .map((item, i) => cardHtml(item, 80 + i * 20))
      .join('');
  }

  fetch('/api/blogs?limit=50')
    .then((res) => res.json().then((data) => ({ ok: res.ok, data })))
    .then(({ ok, data }) => {
      if (!ok) return;
      const items = data.items || [];
      if (!items.length) return;
      revealLive(items);
    })
    .catch(() => {
      /* Keep Coming Soon + blur when the API is unavailable. */
    });
})();
