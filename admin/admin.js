(function () {
  'use strict';

  const $ = (s, c) => (c || document).querySelector(s);

  function setMsg(el, text, ok) {
    if (!el) return;
    el.textContent = text || '';
    el.classList.toggle('is-error', !ok && !!text);
    el.classList.toggle('is-ok', !!ok && !!text);
  }

  async function api(url, options) {
    const res = await fetch(url, {
      credentials: 'same-origin',
      headers: { 'Content-Type': 'application/json', ...(options && options.headers) },
      ...options
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || 'Request failed');
    return data;
  }

  const loginForm = $('#loginForm');
  if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const btn = loginForm.querySelector('button[type="submit"]');
      const msg = $('#msg');
      btn.disabled = true;
      try {
        await api('/api/admin/login', {
          method: 'POST',
          body: JSON.stringify({
            email: $('#email').value.trim(),
            password: $('#password').value
          })
        });
        window.location.href = '/admin';
      } catch (err) {
        setMsg(msg, err.message, false);
      } finally {
        btn.disabled = false;
      }
    });
  }

  const signupForm = $('#signupForm');
  if (signupForm) {
    (async () => {
      try {
        const status = await api('/api/admin/signup');
        if (!status.open) {
          setMsg($('#msg'), 'Signup is closed. Ask an existing admin to add you.', false);
          signupForm.querySelector('button[type="submit"]').disabled = true;
        }
      } catch (_) { /* keep form usable if status check fails */ }
    })();

    signupForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const btn = signupForm.querySelector('button[type="submit"]');
      const msg = $('#msg');
      btn.disabled = true;
      try {
        await api('/api/admin/signup', {
          method: 'POST',
          body: JSON.stringify({
            name: $('#name').value.trim(),
            email: $('#email').value.trim(),
            password: $('#password').value
          })
        });
        window.location.href = '/admin';
      } catch (err) {
        setMsg(msg, err.message, false);
      } finally {
        btn.disabled = false;
      }
    });
  }

  const rowsEl = $('#rows');
  if (!rowsEl) return;

  const state = { page: 1, pages: 1, items: [], q: '', role: 'all' };

  function fmtDate(value) {
    if (!value) return '—';
    return new Date(value).toLocaleString('en-IN', {
      timeZone: 'Asia/Kolkata',
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  function renderRows(items) {
    if (!items.length) {
      rowsEl.innerHTML = '<tr><td class="empty" colspan="5">No waitlist entries yet.</td></tr>';
      return;
    }
    rowsEl.innerHTML = items.map((item) => `
      <tr>
        <td class="email" title="${escapeHtml(item.userAgent || '')}">${escapeHtml(item.email)}</td>
        <td><span class="pill">${escapeHtml(item.role || 'general')}</span></td>
        <td>${escapeHtml(item.source || '—')}</td>
        <td class="muted">${escapeHtml(item.page || '—')}</td>
        <td>${escapeHtml(fmtDate(item.createdAt))}</td>
      </tr>
    `).join('');
  }

  function escapeHtml(value) {
    return String(value || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  async function load() {
    const params = new URLSearchParams({
      page: String(state.page),
      limit: '50',
      q: state.q,
      role: state.role
    });
    const data = await api('/api/admin/waitlist?' + params.toString());
    state.items = data.items;
    state.pages = data.pages;
    state.page = data.page;
    renderRows(data.items);
    $('#statTotal').textContent = data.stats.allTotal;
    $('#statWeek').textContent = data.stats.thisWeek;
    $('#statStartup').textContent = data.stats.byRole.startup || 0;
    $('#statInvestor').textContent = data.stats.byRole.investor || 0;
    $('#pageInfo').textContent = `Page ${data.page} of ${data.pages} · ${data.total} shown by filter`;
    $('#prevBtn').disabled = data.page <= 1;
    $('#nextBtn').disabled = data.page >= data.pages;
  }

  (async () => {
    try {
      const me = await api('/api/admin/me');
      $('#adminEmail').textContent = me.email;
      await load();
    } catch (_) {
      window.location.href = '/admin/login';
    }
  })();

  let timer;
  $('#search').addEventListener('input', (e) => {
    clearTimeout(timer);
    timer = setTimeout(() => {
      state.q = e.target.value.trim();
      state.page = 1;
      load().catch((err) => { rowsEl.innerHTML = `<tr><td class="empty" colspan="5">${escapeHtml(err.message)}</td></tr>`; });
    }, 250);
  });

  $('#roleFilter').addEventListener('change', (e) => {
    state.role = e.target.value;
    state.page = 1;
    load().catch(() => {});
  });

  $('#prevBtn').addEventListener('click', () => {
    if (state.page > 1) {
      state.page -= 1;
      load();
    }
  });
  $('#nextBtn').addEventListener('click', () => {
    if (state.page < state.pages) {
      state.page += 1;
      load();
    }
  });

  $('#logoutBtn').addEventListener('click', async () => {
    await api('/api/admin/logout', { method: 'POST' });
    window.location.href = '/admin/login';
  });

  $('#exportBtn').addEventListener('click', async () => {
    const params = new URLSearchParams({
      page: '1',
      limit: '500',
      q: state.q,
      role: state.role
    });
    const data = await api('/api/admin/waitlist?' + params.toString());
    const header = ['email', 'role', 'source', 'page', 'createdAt', 'userAgent'];
    const lines = [header.join(',')].concat(
      data.items.map((item) => header.map((key) => `"${String(item[key] || '').replace(/"/g, '""')}"`).join(','))
    );
    const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'wefundco-waitlist.csv';
    a.click();
    URL.revokeObjectURL(url);
  });
})();
