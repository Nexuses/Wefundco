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

  function renderConfirmation(view) {
    if (!view || view.status === 'none' || !view.lines || !view.lines.length) {
      return '<div class="confirm"><p class="confirm__empty">No confirmation yet</p></div>';
    }
    const lines = view.lines.map((line) => (
      `<p class="confirm__${escapeHtml(line.kind)}">${escapeHtml(line.text)}</p>`
    )).join('');
    return `<div class="confirm confirm--${escapeHtml(view.status)}">${lines}</div>`;
  }

  function renderRows(items) {
    if (!items.length) {
      rowsEl.innerHTML = '<tr><td class="empty" colspan="8">No waitlist entries yet.</td></tr>';
      return;
    }
    rowsEl.innerHTML = items.map((item) => `
      <tr data-id="${escapeHtml(item.id)}">
        <td class="email" title="${escapeHtml(item.userAgent || '')}">${escapeHtml(item.email)}</td>
        <td class="muted">${escapeHtml(item.phone || '—')}</td>
        <td><span class="pill">${escapeHtml(item.role || 'general')}</span></td>
        <td>${escapeHtml(item.source || '—')}</td>
        <td class="muted">${escapeHtml(item.page || '—')}</td>
        <td>${escapeHtml(fmtDate(item.createdAt))}</td>
        <td class="col-confirm">${renderConfirmation(item.confirmation)}</td>
        <td class="col-actions">
          <button
            type="button"
            class="btn-send"
            data-send-id="${escapeHtml(item.id)}"
            data-send-email="${escapeHtml(item.email)}"
            aria-label="Send attendance email to ${escapeHtml(item.email)}"
            title="Send attendance email"
          >RSVP</button>
          <button
            type="button"
            class="btn-delete"
            data-delete-id="${escapeHtml(item.id)}"
            data-delete-email="${escapeHtml(item.email)}"
            aria-label="Delete ${escapeHtml(item.email)}"
            title="Delete"
          >
            <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
              <path d="M9 3h6l1 2h4v2H4V5h4l1-2zm1 6h2v9h-2V9zm4 0h2v9h-2V9zM7 9h2v9H7V9zm-1 12h12l1-12H5l1 12z"/>
            </svg>
          </button>
        </td>
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
      document.body.classList.remove('auth-pending');
      await load();
    } catch (_) {
      window.location.replace('/admin/login');
    }
  })();

  let timer;
  $('#search').addEventListener('input', (e) => {
    clearTimeout(timer);
    timer = setTimeout(() => {
      state.q = e.target.value.trim();
      state.page = 1;
      load().catch((err) => { rowsEl.innerHTML = `<tr><td class="empty" colspan="8">${escapeHtml(err.message)}</td></tr>`; });
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
    const header = ['email', 'phone', 'role', 'source', 'page', 'createdAt', 'confirmation'];
    const lines = [header.join(',')].concat(
      data.items.map((item) => header.map((key) => {
        const value = key === 'confirmation'
          ? ((item.confirmation && item.confirmation.lines) || []).map((line) => line.text).join(' | ')
          : item[key];
        return `"${String(value || '').replace(/"/g, '""')}"`;
      }).join(','))
    );
    const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'wefundco-waitlist.csv';
    a.click();
    URL.revokeObjectURL(url);
  });

  rowsEl.addEventListener('click', async (e) => {
    const sendBtn = e.target.closest('[data-send-id]');
    if (sendBtn) {
      const id = sendBtn.getAttribute('data-send-id');
      const email = sendBtn.getAttribute('data-send-email') || 'this person';
      if (!id) return;
      if (!window.confirm(`Send a unique attendance email to ${email}?`)) return;
      sendBtn.disabled = true;
      try {
        await api('/api/admin/waitlist', {
          method: 'POST',
          body: JSON.stringify({ id, kind: 'event_rsvp' })
        });
        await load();
      } catch (err) {
        sendBtn.disabled = false;
        window.alert(err.message || 'Could not send that email.');
      }
      return;
    }

    const btn = e.target.closest('[data-delete-id]');
    if (!btn) return;
    const id = btn.getAttribute('data-delete-id');
    const email = btn.getAttribute('data-delete-email') || 'this entry';
    if (!id) return;
    if (!window.confirm(`Delete ${email} from the waitlist?`)) return;

    btn.disabled = true;
    try {
      await api('/api/admin/waitlist?id=' + encodeURIComponent(id), { method: 'DELETE' });
      await load();
    } catch (err) {
      btn.disabled = false;
      window.alert(err.message || 'Could not delete that entry.');
    }
  });
})();
