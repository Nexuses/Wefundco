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
      credentials: 'include',
      headers: { 'Content-Type': 'application/json', ...(options && options.headers) },
      ...options
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      const err = new Error(data.error || 'Request failed');
      err.status = res.status;
      throw err;
    }
    return data;
  }

  function isAuthError(err) {
    return err && (err.status === 401 || err.status === 403);
  }

  function escapeHtml(value) {
    return String(value || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

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

  const loginForm = $('#loginForm');
  if (loginForm) {
    (async () => {
      try {
        await api('/api/admin/me');
        window.location.replace('/admin');
      } catch (_) { /* not signed in */ }
    })();

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
        // Session cookie is set by login; go straight to the dashboard.
        window.location.replace('/admin');
      } catch (err) {
        setMsg(msg, err.message || 'Sign-in failed. Try again.', false);
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
        await api('/api/admin/me');
        window.location.assign('/admin');
      } catch (err) {
        setMsg(msg, err.message, false);
      } finally {
        btn.disabled = false;
      }
    });
  }

  const rowsEl = $('#rows');
  const onboardingRowsEl = $('#onboardingRows');
  if (!rowsEl && !onboardingRowsEl) return;

  function initTabs() {
    const tabs = document.querySelectorAll('.admin-tabs__btn');
    const panelWaitlist = $('#panelWaitlist');
    const panelOnboarding = $('#panelOnboarding');
    if (!tabs.length) return;

    tabs.forEach((tab) => {
      tab.addEventListener('click', () => {
        const name = tab.getAttribute('data-tab');
        tabs.forEach((t) => t.classList.toggle('is-active', t === tab));
        if (panelWaitlist) {
          const show = name === 'waitlist';
          panelWaitlist.classList.toggle('is-active', show);
          panelWaitlist.hidden = !show;
        }
        if (panelOnboarding) {
          const show = name === 'onboarding';
          panelOnboarding.classList.toggle('is-active', show);
          panelOnboarding.hidden = !show;
        }
      });
    });
  }

  initTabs();

  const waitlistState = { page: 1, pages: 1, items: [], q: '', role: 'all' };

  function renderWaitlistRows(items) {
    if (!rowsEl) return;
    if (!items.length) {
      rowsEl.innerHTML = '<tr><td class="empty" colspan="7">No waitlist entries yet.</td></tr>';
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
        <td class="col-actions">
          <button type="button" class="btn-delete" data-wl-delete-id="${escapeHtml(item.id)}" data-wl-delete-email="${escapeHtml(item.email)}" aria-label="Delete ${escapeHtml(item.email)}" title="Delete">
            <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M9 3h6l1 2h4v2H4V5h4l1-2zm1 6h2v9h-2V9zm4 0h2v9h-2V9zM7 9h2v9H7V9zm-1 12h12l1-12H5l1 12z"/></svg>
          </button>
        </td>
      </tr>
    `).join('');
  }

  async function loadWaitlist() {
    const params = new URLSearchParams({
      page: String(waitlistState.page),
      limit: '50',
      q: waitlistState.q,
      role: waitlistState.role
    });
    const data = await api('/api/admin/waitlist?' + params.toString());
    waitlistState.items = data.items;
    waitlistState.pages = data.pages;
    waitlistState.page = data.page;
    renderWaitlistRows(data.items);
    if ($('#statTotal')) $('#statTotal').textContent = data.stats.allTotal;
    if ($('#statWeek')) $('#statWeek').textContent = data.stats.thisWeek;
    if ($('#statStartup')) $('#statStartup').textContent = data.stats.byRole.startup || 0;
    if ($('#statInvestor')) $('#statInvestor').textContent = data.stats.byRole.investor || 0;
    if ($('#pageInfo')) $('#pageInfo').textContent = `Page ${data.page} of ${data.pages} · ${data.total} shown by filter`;
    if ($('#prevBtn')) $('#prevBtn').disabled = data.page <= 1;
    if ($('#nextBtn')) $('#nextBtn').disabled = data.page >= data.pages;
  }

  const obState = { page: 1, pages: 1, items: [], q: '', role: 'all' };

  function renderOnboardingRows(items) {
    if (!onboardingRowsEl) return;
    if (!items.length) {
      onboardingRowsEl.innerHTML = '<tr><td class="empty" colspan="7">No onboarding submissions yet.</td></tr>';
      return;
    }
    onboardingRowsEl.innerHTML = items.map((item) => `
      <tr data-id="${escapeHtml(item.id)}">
        <td>${escapeHtml(item.contactName || '—')}</td>
        <td class="email">${escapeHtml(item.contactEmail)}</td>
        <td class="muted">${escapeHtml(item.contactPhone || '—')}</td>
        <td><span class="pill">${escapeHtml(item.role || '—')}</span></td>
        <td>${escapeHtml(fmtDate(item.createdAt))}</td>
        <td>${escapeHtml(String(item.fileCount || 0))}</td>
        <td class="col-actions col-actions--split">
          <button type="button" class="btn btn--ghost btn--sm" data-ob-view="${escapeHtml(item.id)}">View</button>
          <button type="button" class="btn-delete" data-ob-delete-id="${escapeHtml(item.id)}" data-ob-delete-label="${escapeHtml(item.contactEmail)}" title="Delete" aria-label="Delete submission">
            <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M9 3h6l1 2h4v2H4V5h4l1-2zm1 6h2v9h-2V9zm4 0h2v9h-2V9zM7 9h2v9H7V9zm-1 12h12l1-12H5l1 12z"/></svg>
          </button>
        </td>
      </tr>
    `).join('');
  }

  async function loadOnboarding() {
    const params = new URLSearchParams({
      page: String(obState.page),
      limit: '50',
      q: obState.q,
      role: obState.role
    });
    const data = await api('/api/admin/onboarding?' + params.toString());
    obState.items = data.items;
    obState.pages = data.pages;
    obState.page = data.page;
    renderOnboardingRows(data.items);
    if ($('#obStatTotal')) $('#obStatTotal').textContent = data.stats.allTotal;
    if ($('#obStatWeek')) $('#obStatWeek').textContent = data.stats.thisWeek;
    if ($('#obStatStartup')) $('#obStatStartup').textContent = data.stats.byRole.startup || 0;
    if ($('#obStatInvestor')) $('#obStatInvestor').textContent = data.stats.byRole.investor || 0;
    if ($('#obPageInfo')) $('#obPageInfo').textContent = `Page ${data.page} of ${data.pages} · ${data.total} shown by filter`;
    if ($('#obPrevBtn')) $('#obPrevBtn').disabled = data.page <= 1;
    if ($('#obNextBtn')) $('#obNextBtn').disabled = data.page >= data.pages;
  }

  const modal = $('#onboardingModal');
  const modalBody = $('#onboardingModalBody');
  const modalTitle = $('#onboardingModalTitle');

  function closeModal() {
    if (!modal) return;
    modal.hidden = true;
    modal.setAttribute('aria-hidden', 'true');
  }

  function openModal() {
    if (!modal) return;
    modal.hidden = false;
    modal.setAttribute('aria-hidden', 'false');
  }

  async function downloadOnboardingFile(submissionId, fileUrl) {
    const url = `/api/admin/onboarding?action=file&id=${encodeURIComponent(submissionId)}&url=${encodeURIComponent(fileUrl)}`;
    const res = await fetch(url, { credentials: 'include' });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data.error || 'Download failed');
    }
    const blob = await res.blob();
    const blobUrl = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = blobUrl;
    a.download = (String(fileUrl).split('/').pop() || 'download').split('?')[0];
    a.click();
    URL.revokeObjectURL(blobUrl);
  }

  async function showOnboardingDetail(id) {
    const data = await api('/api/admin/onboarding?id=' + encodeURIComponent(id));
    const item = data.item;
    if (!item) throw new Error('Submission not found');

    modalTitle.textContent = item.contactName || item.contactEmail || 'Submission';
    const answers = item.answers || {};
    const answerRows = Object.keys(answers).sort().map((key) => `
      <tr><th scope="row">${escapeHtml(key)}</th><td>${escapeHtml(formatAnswer(answers[key]))}</td></tr>
    `).join('');

    const fileRows = (item.files || []).map((f) => {
      const url = typeof f === 'string' ? f : (f && f.url) || '';
      const label = url.split('/').pop() || url;
      return `
      <li>
        <span title="${escapeHtml(url)}">${escapeHtml(decodeURIComponent(label))}</span>
        <button type="button" class="btn btn--ghost btn--sm" data-ob-dl="${escapeHtml(item.id)}" data-ob-url="${escapeHtml(url)}">Download</button>
      </li>`;
    }).join('');

    modalBody.innerHTML = `
      <p class="modal__meta">${escapeHtml(item.contactEmail)} · ${escapeHtml(item.contactPhone || '—')} · <span class="pill">${escapeHtml(item.role)}</span> · ${escapeHtml(fmtDate(item.createdAt))}</p>
      <h3 class="modal__subhead">Answers</h3>
      <table class="detail-table"><tbody>${answerRows || '<tr><td>No answers recorded.</td></tr>'}</tbody></table>
      <h3 class="modal__subhead">Documents</h3>
      <ul class="file-list">${fileRows || '<li>No files uploaded.</li>'}</ul>
    `;
    openModal();
  }

  function formatAnswer(value) {
    if (value === true) return 'Yes';
    if (value === false) return 'No';
    if (Array.isArray(value)) return value.join(', ');
    if (value && typeof value === 'object') return JSON.stringify(value);
    return String(value ?? '');
  }

  if (modal) {
    modal.querySelectorAll('[data-modal-close]').forEach((el) => {
      el.addEventListener('click', closeModal);
    });
    modalBody.addEventListener('click', async (e) => {
      const btn = e.target.closest('[data-ob-dl]');
      if (!btn) return;
      try {
        await downloadOnboardingFile(
          btn.getAttribute('data-ob-dl'),
          btn.getAttribute('data-ob-url')
        );
      } catch (err) {
        window.alert(err.message || 'Could not download file.');
      }
    });
  }

  (async () => {
    let me;
    try {
      me = await api('/api/admin/me');
    } catch (err) {
      if (isAuthError(err)) {
        window.location.replace('/admin/login');
      } else {
        document.body.classList.remove('auth-pending');
        if (rowsEl) {
          rowsEl.innerHTML = `<tr><td class="empty" colspan="7">${escapeHtml(err.message || 'Could not verify session.')}</td></tr>`;
        }
      }
      return;
    }

    if ($('#adminEmail')) $('#adminEmail').textContent = me.email;
    document.body.classList.remove('auth-pending');

    const loads = [];
    if (rowsEl) {
      loads.push(
        loadWaitlist().catch((err) => {
          rowsEl.innerHTML = `<tr><td class="empty" colspan="7">${escapeHtml(err.message || 'Could not load waitlist.')}</td></tr>`;
        })
      );
    }
    if (onboardingRowsEl) {
      loads.push(
        loadOnboarding().catch((err) => {
          onboardingRowsEl.innerHTML = `<tr><td class="empty" colspan="7">${escapeHtml(err.message || 'Could not load onboarding.')}</td></tr>`;
        })
      );
    }
    await Promise.all(loads);
  })();

  let wlTimer;
  if ($('#search')) {
    $('#search').addEventListener('input', (e) => {
      clearTimeout(wlTimer);
      wlTimer = setTimeout(() => {
        waitlistState.q = e.target.value.trim();
        waitlistState.page = 1;
        loadWaitlist().catch((err) => {
          rowsEl.innerHTML = `<tr><td class="empty" colspan="7">${escapeHtml(err.message)}</td></tr>`;
        });
      }, 250);
    });
  }

  if ($('#roleFilter')) {
    $('#roleFilter').addEventListener('change', (e) => {
      waitlistState.role = e.target.value;
      waitlistState.page = 1;
      loadWaitlist().catch(() => {});
    });
  }

  if ($('#prevBtn')) {
    $('#prevBtn').addEventListener('click', () => {
      if (waitlistState.page > 1) {
        waitlistState.page -= 1;
        loadWaitlist();
      }
    });
  }
  if ($('#nextBtn')) {
    $('#nextBtn').addEventListener('click', () => {
      if (waitlistState.page < waitlistState.pages) {
        waitlistState.page += 1;
        loadWaitlist();
      }
    });
  }

  let obTimer;
  if ($('#obSearch')) {
    $('#obSearch').addEventListener('input', (e) => {
      clearTimeout(obTimer);
      obTimer = setTimeout(() => {
        obState.q = e.target.value.trim();
        obState.page = 1;
        loadOnboarding().catch((err) => {
          onboardingRowsEl.innerHTML = `<tr><td class="empty" colspan="7">${escapeHtml(err.message)}</td></tr>`;
        });
      }, 250);
    });
  }

  if ($('#obRoleFilter')) {
    $('#obRoleFilter').addEventListener('change', (e) => {
      obState.role = e.target.value;
      obState.page = 1;
      loadOnboarding().catch(() => {});
    });
  }

  if ($('#obPrevBtn')) {
    $('#obPrevBtn').addEventListener('click', () => {
      if (obState.page > 1) {
        obState.page -= 1;
        loadOnboarding();
      }
    });
  }
  if ($('#obNextBtn')) {
    $('#obNextBtn').addEventListener('click', () => {
      if (obState.page < obState.pages) {
        obState.page += 1;
        loadOnboarding();
      }
    });
  }

  if ($('#logoutBtn')) {
    $('#logoutBtn').addEventListener('click', async () => {
      await api('/api/admin/logout', { method: 'POST' });
      window.location.href = '/admin/login';
    });
  }

  if ($('#exportBtn')) {
    $('#exportBtn').addEventListener('click', async () => {
      const params = new URLSearchParams({ page: '1', limit: '500', q: waitlistState.q, role: waitlistState.role });
      const data = await api('/api/admin/waitlist?' + params.toString());
      const header = ['email', 'phone', 'role', 'source', 'page', 'createdAt'];
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
  }

  if ($('#obExportBtn')) {
    $('#obExportBtn').addEventListener('click', async () => {
      const params = new URLSearchParams({ page: '1', limit: '500', q: obState.q, role: obState.role });
      const data = await api('/api/admin/onboarding?' + params.toString());
      const header = ['contactName', 'contactEmail', 'contactPhone', 'role', 'fileCount', 'createdAt'];
      const lines = [header.join(',')].concat(
        data.items.map((item) => header.map((key) => `"${String(item[key] || '').replace(/"/g, '""')}"`).join(','))
      );
      const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'wefundco-onboarding.csv';
      a.click();
      URL.revokeObjectURL(url);
    });
  }

  if (rowsEl) {
    rowsEl.addEventListener('click', async (e) => {
      const btn = e.target.closest('[data-wl-delete-id]');
      if (!btn) return;
      const id = btn.getAttribute('data-wl-delete-id');
      const email = btn.getAttribute('data-wl-delete-email') || 'this entry';
      if (!id) return;
      if (!window.confirm(`Delete ${email} from the waitlist?`)) return;
      btn.disabled = true;
      try {
        await api('/api/admin/waitlist?id=' + encodeURIComponent(id), { method: 'DELETE' });
        await loadWaitlist();
      } catch (err) {
        btn.disabled = false;
        window.alert(err.message || 'Could not delete that entry.');
      }
    });
  }

  if (onboardingRowsEl) {
    onboardingRowsEl.addEventListener('click', async (e) => {
      const viewBtn = e.target.closest('[data-ob-view]');
      if (viewBtn) {
        try {
          await showOnboardingDetail(viewBtn.getAttribute('data-ob-view'));
        } catch (err) {
          window.alert(err.message || 'Could not load submission.');
        }
        return;
      }
      const delBtn = e.target.closest('[data-ob-delete-id]');
      if (!delBtn) return;
      const id = delBtn.getAttribute('data-ob-delete-id');
      const label = delBtn.getAttribute('data-ob-delete-label') || 'this submission';
      if (!id) return;
      if (!window.confirm(`Delete onboarding submission for ${label}?`)) return;
      delBtn.disabled = true;
      try {
        await api('/api/admin/onboarding?id=' + encodeURIComponent(id), { method: 'DELETE' });
        await loadOnboarding();
      } catch (err) {
        delBtn.disabled = false;
        window.alert(err.message || 'Could not delete that submission.');
      }
    });
  }
})();
