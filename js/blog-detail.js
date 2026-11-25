(function () {
  'use strict';

  function slugFromPath() {
    const parts = window.location.pathname.split('/').filter(Boolean);
    const idx = parts.indexOf('blogs');
    if (idx >= 0 && parts[idx + 1]) return decodeURIComponent(parts[idx + 1]);
    return '';
  }

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

  function upsertMeta(attr, key, value) {
    if (!value) return;
    let el = document.head.querySelector(`meta[${attr}="${key}"]`);
    if (!el) {
      el = document.createElement('meta');
      el.setAttribute(attr, key);
      document.head.appendChild(el);
    }
    el.setAttribute('content', value);
  }

  const slug = slugFromPath();
  const titleEl = document.getElementById('blogTitle');
  const metaEl = document.getElementById('blogMeta');
  const heroEl = document.getElementById('blogHero');
  const coverEl = document.getElementById('blogCover');
  const bodyEl = document.getElementById('blogBody');

  if (!slug) {
    if (titleEl) titleEl.textContent = 'Article not found';
    if (bodyEl) bodyEl.innerHTML = '<p>This article could not be found. <a href="/resources">Back to Resources</a></p>';
    return;
  }

  fetch('/api/blogs/' + encodeURIComponent(slug))
    .then((res) => res.json().then((data) => ({ ok: res.ok, status: res.status, data })))
    .then(({ ok, data }) => {
      if (!ok || !data.item) throw new Error(data.error || 'Not found');
      const item = data.item;
      const pageTitle = item.seoTitle || ((item.title || 'Article') + ' | WeFundCo Blog');
      const description = item.seoDescription || item.excerpt || item.title || '';
      const mainImage = item.coverImageUrl || item.imageUrl || 'https://www.wefundco.com/Assets/thumbnail.png';
      const canonicalHref = 'https://www.wefundco.com/resources/blogs/' + encodeURIComponent(item.slug);

      document.title = pageTitle;
      upsertMeta('name', 'description', description);
      upsertMeta('property', 'og:title', pageTitle);
      upsertMeta('property', 'og:description', description);
      upsertMeta('property', 'og:image', mainImage);
      upsertMeta('property', 'og:url', canonicalHref);
      upsertMeta('property', 'og:type', 'article');
      upsertMeta('name', 'twitter:title', pageTitle);
      upsertMeta('name', 'twitter:description', description);
      upsertMeta('name', 'twitter:image', mainImage);

      let canonical = document.head.querySelector('link[rel="canonical"]');
      if (!canonical) {
        canonical = document.createElement('link');
        canonical.rel = 'canonical';
        document.head.appendChild(canonical);
      }
      canonical.href = canonicalHref;

      if (titleEl) titleEl.textContent = item.title || '';
      if (metaEl) {
        metaEl.hidden = false;
        metaEl.innerHTML =
          `<time datetime="${escapeHtml(item.publishedAtIso)}">${escapeHtml(item.publishedAtLabel)}</time>` +
          `<span class="blog-card__author">${escapeHtml(item.author)}</span>`;
      }
      if (heroEl && coverEl && (item.coverImageUrl || item.imageUrl)) {
        coverEl.src = encodeAssetUrl(item.coverImageUrl || item.imageUrl);
        coverEl.alt = '';
        heroEl.hidden = false;
      }
      if (bodyEl) bodyEl.innerHTML = item.bodyHtml || '<p></p>';
    })
    .catch(() => {
      if (titleEl) titleEl.textContent = 'Article not found';
      if (bodyEl) {
        bodyEl.innerHTML =
          '<p>This article could not be found. <a href="/resources">Back to Resources</a></p>';
      }
    });
})();
