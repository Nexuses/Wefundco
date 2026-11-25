(function () {
  'use strict';

  const grid = document.getElementById('resourcesBlogGrid');
  if (!grid) return;

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

  function setEmpty(message) {
    grid.innerHTML = `<p class="res-upcoming__empty">${escapeHtml(message)}</p>`;
  }

  fetch('/api/blogs?limit=50')
    .then((res) => res.json().then((data) => ({ ok: res.ok, data })))
    .then(({ ok, data }) => {
      if (!ok) throw new Error(data.error || 'Could not load blogs.');
      const items = data.items || [];
      if (!items.length) {
        setEmpty('Articles will appear here once published from Admin.');
        return;
      }
      grid.innerHTML = items
        .map((item, i) => cardHtml(item, 80 + i * 20))
        .join('');
    })
    .catch(() => {
      setEmpty('Could not load articles right now. Please try again later.');
    });
})();
