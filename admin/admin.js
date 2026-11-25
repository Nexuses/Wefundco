(function () {
  'use strict';

  const $ = (s, c) => (c || document).querySelector(s);
  const $$ = (s, c) => Array.from((c || document).querySelectorAll(s));

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
  const blogRowsEl = $('#blogRows');
  if (!rowsEl && !onboardingRowsEl && !blogRowsEl) return;

  function initTabs() {
    const tabs = document.querySelectorAll('.admin-tabs__btn');
    const panelWaitlist = $('#panelWaitlist');
    const panelOnboarding = $('#panelOnboarding');
    const panelBlogs = $('#panelBlogs');
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
        if (panelBlogs) {
          const show = name === 'blogs';
          panelBlogs.classList.toggle('is-active', show);
          panelBlogs.hidden = !show;
          if (show && typeof showBlogList === 'function') showBlogList();
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
        <td>${escapeHtml(item.companyName || item.company || '—')}</td>
        <td class="email" title="${escapeHtml(item.userAgent || '')}">${escapeHtml(item.email)}</td>
        <td class="muted">${item.linkedin ? `<a href="${escapeHtml(item.linkedin)}" target="_blank" rel="noopener noreferrer">LinkedIn</a>` : '—'}</td>
        <td><span class="pill">${escapeHtml(item.role || 'general')}</span></td>
        <td>${escapeHtml(item.source || '—')}</td>
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

  const obState = { page: 1, pages: 1, items: [], q: '', role: 'all', status: 'complete' };

  function onboardingStatusLabel(status) {
    if (status === 'complete') return 'Complete';
    if (status === 'in_progress' || status === 'uploading') return 'Incomplete';
    return status || '—';
  }

  function renderOnboardingRows(items) {
    if (!onboardingRowsEl) return;
    if (!items.length) {
      onboardingRowsEl.innerHTML = '<tr><td class="empty" colspan="8">No onboarding submissions yet.</td></tr>';
      return;
    }
    onboardingRowsEl.innerHTML = items.map((item) => `
      <tr data-id="${escapeHtml(item.id)}">
        <td>${escapeHtml(item.contactName || '—')}</td>
        <td class="email">${escapeHtml(item.contactEmail)}</td>
        <td class="muted">${escapeHtml(item.contactPhone || '—')}</td>
        <td><span class="pill">${escapeHtml(item.role || '—')}</span></td>
        <td><span class="pill">${escapeHtml(onboardingStatusLabel(item.status))}</span></td>
        <td>${escapeHtml(fmtDate(item.status === 'complete' ? item.createdAt : item.updatedAt))}</td>
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
      role: obState.role,
      status: obState.status
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
    if ($('#obStatIncomplete')) $('#obStatIncomplete').textContent = data.stats.incompleteTotal ?? '—';
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

    modalTitle.textContent = (item.contactName || item.contactEmail || 'Submission')
      + ' · ' + onboardingStatusLabel(item.status);
    if (item.status !== 'complete' && item.currentStepId) {
      modalTitle.textContent += ' (step: ' + item.currentStepId + ')';
    }
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

  const blogState = {
    page: 1,
    pages: 1,
    items: [],
    q: '',
    editingId: '',
    slugTouched: false,
    view: 'list',
    htmlMode: false,
    savedRange: null,
    savedBookmark: null,
    blockMenuOpen: false
  };

  const BLOCK_STYLE_OPTIONS = [
    { tag: 'P', label: 'Paragraph' },
    { tag: 'H1', label: 'Heading 1' },
    { tag: 'H2', label: 'Heading 2' },
    { tag: 'H3', label: 'Heading 3' },
    { tag: 'H4', label: 'Heading 4' },
    { tag: 'H5', label: 'Heading 5' },
    { tag: 'H6', label: 'Heading 6' }
  ];

  function todayInputValue() {
    const d = new Date();
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  }

  function slugifyClient(value) {
    return String(value || '')
      .toLowerCase()
      .normalize('NFKD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 80);
  }

  function showBlogList() {
    blogState.view = 'list';
    if ($('#blogListView')) $('#blogListView').hidden = false;
    if ($('#blogEditorView')) $('#blogEditorView').hidden = true;
  }

  function showBlogEditor() {
    blogState.view = 'editor';
    if ($('#blogListView')) $('#blogListView').hidden = true;
    if ($('#blogEditorView')) $('#blogEditorView').hidden = false;
  }

  const BLOCK_TAGS = new Set(['P', 'DIV', 'H1', 'H2', 'H3', 'H4', 'H5', 'H6', 'BLOCKQUOTE', 'LI', 'PRE']);
  const HEADING_TAGS = new Set(['H1', 'H2', 'H3', 'H4', 'H5', 'H6']);

  function getEditorHtml() {
    if (blogState.htmlMode && $('#blogHtmlSource')) {
      return String($('#blogHtmlSource').value || '').trim();
    }
    const editor = $('#blogContentEditor');
    if (!editor) return '';
    const html = editor.innerHTML.trim();
    if (!html || html === '<br>' || html === '<p><br></p>' || html === '<div><br></div>') return '';
    return html;
  }

  function setEditorHtml(html) {
    const editor = $('#blogContentEditor');
    const value = String(html || '').trim();
    if (editor) {
      editor.innerHTML = value || '';
      ensureEditorParagraph(editor);
    }
    if ($('#blogHtmlSource')) $('#blogHtmlSource').value = value || '';
    blogState.savedRange = null;
    blogState.savedBookmark = null;
    syncBlockStyleSelect();
  }

  function setHtmlMode(on) {
    blogState.htmlMode = !!on;
    const editor = $('#blogContentEditor');
    const source = $('#blogHtmlSource');
    const toggle = $('#blogHtmlToggle');
    if (!editor || !source) return;
    closeBlockMenu();
    if (blogState.htmlMode) {
      source.value = editor.innerHTML;
      editor.hidden = true;
      source.hidden = false;
      source.classList.add('is-open');
      if (toggle) toggle.classList.add('is-active');
    } else {
      editor.innerHTML = source.value;
      ensureEditorParagraph(editor);
      source.hidden = true;
      source.classList.remove('is-open');
      editor.hidden = false;
      if (toggle) toggle.classList.remove('is-active');
      syncBlockStyleSelect();
    }
  }

  function pathFromNode(editor, node, offset) {
    const path = [];
    let current = node;
    let currentOffset = offset;
    if (current && current.nodeType === 1) {
      // Caret positioned on an element boundary — prefer a text/child anchor.
      if (current.childNodes[offset]) {
        current = current.childNodes[offset];
        currentOffset = 0;
      } else if (current.childNodes.length) {
        current = current.childNodes[current.childNodes.length - 1];
        currentOffset = current.nodeType === 3 ? current.textContent.length : current.childNodes.length;
      }
    }
    while (current && current !== editor) {
      const parent = current.parentNode;
      if (!parent) return null;
      path.unshift(Array.prototype.indexOf.call(parent.childNodes, current));
      current = parent;
    }
    if (current !== editor) return null;
    return { path, offset: currentOffset };
  }

  function nodeFromPath(editor, path) {
    let node = editor;
    for (let i = 0; i < path.length; i += 1) {
      if (!node || !node.childNodes || !node.childNodes[path[i]]) return null;
      node = node.childNodes[path[i]];
    }
    return node;
  }

  function saveEditorSelection() {
    const editor = $('#blogContentEditor');
    if (!editor || blogState.htmlMode) return;
    const sel = window.getSelection();
    if (!sel || !sel.rangeCount) return;
    const range = sel.getRangeAt(0);
    if (!editor.contains(range.commonAncestorContainer)) return;
    blogState.savedRange = range.cloneRange();
    const start = pathFromNode(editor, range.startContainer, range.startOffset);
    const end = pathFromNode(editor, range.endContainer, range.endOffset);
    if (start && end) {
      blogState.savedBookmark = { start, end };
    }
  }

  function restoreEditorSelection() {
    const editor = $('#blogContentEditor');
    if (!editor) return false;
    editor.focus();
    const sel = window.getSelection();
    if (!sel) return false;

    if (blogState.savedBookmark) {
      const startNode = nodeFromPath(editor, blogState.savedBookmark.start.path);
      const endNode = nodeFromPath(editor, blogState.savedBookmark.end.path);
      if (startNode && endNode) {
        try {
          const range = document.createRange();
          const startOffset = Math.min(
            blogState.savedBookmark.start.offset,
            startNode.nodeType === 3 ? startNode.textContent.length : startNode.childNodes.length
          );
          const endOffset = Math.min(
            blogState.savedBookmark.end.offset,
            endNode.nodeType === 3 ? endNode.textContent.length : endNode.childNodes.length
          );
          range.setStart(startNode, startOffset);
          range.setEnd(endNode, endOffset);
          sel.removeAllRanges();
          sel.addRange(range);
          blogState.savedRange = range.cloneRange();
          return true;
        } catch (_) {
          /* fall through */
        }
      }
    }

    if (blogState.savedRange) {
      try {
        sel.removeAllRanges();
        sel.addRange(blogState.savedRange);
        return true;
      } catch (_) {
        /* fall through */
      }
    }

    const fallback = editor.lastElementChild || editor;
    placeCaretInside(fallback, false);
    return false;
  }

  function placeCaretAtEnd(el) {
    placeCaretInside(el, false);
  }

  function placeCaretInside(el, atStart) {
    if (!el) return;
    const range = document.createRange();
    range.selectNodeContents(el);
    range.collapse(!!atStart);
    const sel = window.getSelection();
    if (!sel) return;
    sel.removeAllRanges();
    sel.addRange(range);
    blogState.savedRange = range.cloneRange();
    const editor = $('#blogContentEditor');
    if (editor) {
      const mark = pathFromNode(editor, range.startContainer, range.startOffset);
      if (mark) blogState.savedBookmark = { start: mark, end: mark };
    }
  }

  function ensureEditorParagraph(editor) {
    if (!editor) return null;
    const html = editor.innerHTML.trim();
    if (!html || html === '<br>') {
      editor.innerHTML = '<p><br></p>';
      return editor.firstElementChild;
    }
    if (!editor.querySelector('p,h1,h2,h3,h4,h5,h6,div,li,blockquote,pre,ul,ol')) {
      const p = document.createElement('p');
      while (editor.firstChild) p.appendChild(editor.firstChild);
      if (!p.innerHTML.trim()) p.innerHTML = '<br>';
      editor.appendChild(p);
      return p;
    }
    return null;
  }

  function nodeInsideEditor(node, editor) {
    if (!node || !editor) return false;
    const el = node.nodeType === 1 ? node : node.parentElement;
    return !!(el && (el === editor || editor.contains(el)));
  }

  function getClosestBlock(node, editor) {
    let el = node && node.nodeType === 1 ? node : node && node.parentElement;
    while (el && el !== editor) {
      if (BLOCK_TAGS.has(el.tagName)) return el;
      el = el.parentElement;
    }
    return null;
  }

  function getCurrentBlock() {
    const editor = $('#blogContentEditor');
    if (!editor || blogState.htmlMode) return null;

    const sel = window.getSelection();
    if (sel && sel.rangeCount && nodeInsideEditor(sel.anchorNode, editor)) {
      return getClosestBlock(sel.anchorNode, editor);
    }

    if (blogState.savedBookmark) {
      const node = nodeFromPath(editor, blogState.savedBookmark.start.path);
      if (node) return getClosestBlock(node, editor);
    }

    if (blogState.savedRange && nodeInsideEditor(blogState.savedRange.commonAncestorContainer, editor)) {
      return getClosestBlock(blogState.savedRange.commonAncestorContainer, editor);
    }
    return null;
  }

  function blockTagFromElement(block) {
    if (!block) return 'P';
    if (HEADING_TAGS.has(block.tagName)) return block.tagName;
    return 'P';
  }

  function syncBlockStyleSelect() {
    if (blogState.htmlMode || blogState.blockMenuOpen) return;
    const tag = blockTagFromElement(getCurrentBlock());
    const label = $('#blogBlockLabel');
    const option = BLOCK_STYLE_OPTIONS.find((item) => item.tag === tag) || BLOCK_STYLE_OPTIONS[0];
    if (label) label.textContent = option.label;
    $$('#blogBlockList [data-block]').forEach((btn) => {
      btn.classList.toggle('is-active', btn.getAttribute('data-block') === tag);
    });
  }

  function closeBlockMenu() {
    blogState.blockMenuOpen = false;
    const list = $('#blogBlockList');
    const toggle = $('#blogBlockToggle');
    if (list) list.hidden = true;
    if (toggle) toggle.setAttribute('aria-expanded', 'false');
  }

  function openBlockMenu() {
    saveEditorSelection();
    // Sync active option before locking sync (menu-open skips live caret sync).
    blogState.blockMenuOpen = false;
    syncBlockStyleSelect();
    blogState.blockMenuOpen = true;
    const list = $('#blogBlockList');
    const toggle = $('#blogBlockToggle');
    if (list) list.hidden = false;
    if (toggle) toggle.setAttribute('aria-expanded', 'true');
  }

  function renameBlockElement(block, tagName) {
    if (!block || !tagName || !block.parentNode) return null;
    const nextTag = String(tagName).toUpperCase();
    if (nextTag === 'DIV') return renameBlockElement(block, 'P');
    if (block.tagName === nextTag) return block;
    const replacement = document.createElement(nextTag.toLowerCase());
    while (block.firstChild) replacement.appendChild(block.firstChild);
    if (!replacement.innerHTML.replace(/<br\s*\/?>/gi, '').trim()) {
      replacement.innerHTML = '<br>';
    }
    block.parentNode.replaceChild(replacement, block);
    return replacement;
  }

  function applyBlockFormat(tagName) {
    const editor = $('#blogContentEditor');
    if (!editor || blogState.htmlMode) return false;
    const tag = String(tagName || 'P').toUpperCase();

    ensureEditorParagraph(editor);
    editor.focus();
    restoreEditorSelection();

    let block = getCurrentBlock();
    if (!block || block === editor) {
      ensureEditorParagraph(editor);
      block = editor.lastElementChild || editor.firstElementChild;
      if (block) placeCaretInside(block, false);
    }
    if (!block || block === editor) return false;

    if (block.tagName === 'LI') {
      const formats = ['<' + tag + '>', tag, tag.toLowerCase()];
      for (const format of formats) {
        try {
          if (document.execCommand('formatBlock', false, format)) break;
        } catch (_) {
          /* continue */
        }
      }
      saveEditorSelection();
      syncBlockStyleSelect();
      return true;
    }

    const renamed = renameBlockElement(block, tag);
    if (!renamed) return false;
    placeCaretInside(renamed, false);
    saveEditorSelection();
    syncBlockStyleSelect();
    return true;
  }

  function breakOutOfHeadingOnEnter(e) {
    if (e.key !== 'Enter' || e.shiftKey || e.ctrlKey || e.metaKey || e.altKey) return false;
    if (blogState.htmlMode) return false;
    const editor = $('#blogContentEditor');
    if (!editor) return false;
    const block = getCurrentBlock();
    if (!block || (!HEADING_TAGS.has(block.tagName) && block.tagName !== 'BLOCKQUOTE')) return false;

    e.preventDefault();

    const sel = window.getSelection();
    if (!sel || !sel.rangeCount) return true;
    const range = sel.getRangeAt(0);

    const after = range.cloneRange();
    after.selectNodeContents(block);
    after.setStart(range.endContainer, range.endOffset);
    const trailing = after.extractContents();

    const p = document.createElement('p');
    if (trailing && String(trailing.textContent || '').trim()) {
      p.appendChild(trailing);
    } else {
      p.innerHTML = '<br>';
    }

    if (block.nextSibling) block.parentNode.insertBefore(p, block.nextSibling);
    else block.parentNode.appendChild(p);

    if (!String(block.textContent || '').trim()) {
      block.innerHTML = '<br>';
    }

    placeCaretInside(p, true);
    syncBlockStyleSelect();
    saveEditorSelection();
    return true;
  }

  function normalizeDivBlocks(editor) {
    if (!editor) return;
    Array.from(editor.children).forEach((child) => {
      if (child.tagName === 'DIV') renameBlockElement(child, 'P');
    });
  }

  function insertHtmlAtCursor(html) {
    const editor = $('#blogContentEditor');
    if (!editor) return;
    if (blogState.htmlMode && $('#blogHtmlSource')) {
      const source = $('#blogHtmlSource');
      const start = source.selectionStart || source.value.length;
      const end = source.selectionEnd || start;
      source.value = source.value.slice(0, start) + html + source.value.slice(end);
      return;
    }
    editor.focus();
    restoreEditorSelection();
    const ok = document.execCommand('insertHTML', false, html);
    if (!ok) {
      editor.insertAdjacentHTML('beforeend', html);
    }
    saveEditorSelection();
  }

  function resetBlogForm() {
    blogState.editingId = '';
    blogState.slugTouched = false;
    blogState.savedRange = null;
    const form = $('#blogForm');
    if (form) form.reset();
    if ($('#blogId')) $('#blogId').value = '';
    if ($('#blogBodyHtml')) $('#blogBodyHtml').value = '';
    if ($('#blogPublishedAt')) $('#blogPublishedAt').value = todayInputValue();
    if ($('#blogStatus')) $('#blogStatus').value = 'published';
    if ($('#blogAuthor')) $('#blogAuthor').value = 'WeFundCo Editorial';
    if ($('#blogFormHeading')) $('#blogFormHeading').textContent = 'Create New Blog';
    if ($('#blogSubmitBtn')) $('#blogSubmitBtn').textContent = 'Save';
    if ($('#blogImageUrl')) $('#blogImageUrl').required = true;
    closeBlockMenu();
    setHtmlMode(false);
    setEditorHtml('');
    syncBlockStyleSelect();
    const preview = $('#blogCoverPreview');
    if (preview) preview.hidden = true;
    setMsg($('#blogMsg'), '', true);
  }

  function renderBlogRows(items) {
    if (!blogRowsEl) return;
    if (!items.length) {
      blogRowsEl.innerHTML = '<tr><td class="empty" colspan="7">No blogs yet. Click Create New to add one.</td></tr>';
      return;
    }
    blogRowsEl.innerHTML = items.map((item) => {
      const status = item.status === 'draft' ? 'draft' : 'published';
      return `
      <tr data-id="${escapeHtml(item.id)}">
        <td><strong>${escapeHtml(item.title)}</strong></td>
        <td class="muted">${escapeHtml(item.slug)}</td>
        <td>${escapeHtml(item.author || '—')}</td>
        <td><span class="pill pill--${status}">${status}</span></td>
        <td>${escapeHtml(item.publishedAtLabel || fmtDate(item.publishedAt))}</td>
        <td class="muted">${escapeHtml(fmtDate(item.updatedAt))}</td>
        <td class="col-actions col-actions--split">
          <button type="button" class="btn-icon btn-icon--edit" data-blog-edit="${escapeHtml(item.id)}" title="Edit" aria-label="Edit blog">
            <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M4 17.25V20h2.75L17.8 8.95l-2.75-2.75L4 17.25zM20.7 7.04a.996.996 0 0 0 0-1.41l-2.34-2.34a.996.996 0 0 0-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/></svg>
          </button>
          <a class="btn-icon btn-icon--view" href="/resources/blogs/${encodeURIComponent(item.slug)}" target="_blank" rel="noopener" title="View" aria-label="View blog">
            <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M12 5c-5 0-9.27 3.11-11 7 1.73 3.89 6 7 11 7s9.27-3.11 11-7c-1.73-3.89-6-7-11-7zm0 12a5 5 0 1 1 0-10 5 5 0 0 1 0 10zm0-8a3 3 0 1 0 .001 6.001A3 3 0 0 0 12 9z"/></svg>
          </a>
          <button type="button" class="btn-icon btn-icon--delete" data-blog-delete-id="${escapeHtml(item.id)}" data-blog-delete-title="${escapeHtml(item.title)}" title="Delete" aria-label="Delete blog">
            <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M9 3h6l1 2h4v2H4V5h4l1-2zm1 6h2v9h-2V9zm4 0h2v9h-2V9zM7 9h2v9H7V9zm-1 12h12l1-12H5l1 12z"/></svg>
          </button>
        </td>
      </tr>`;
    }).join('');
  }

  async function loadBlogs() {
    if (!blogRowsEl) return;
    const params = new URLSearchParams({
      page: String(blogState.page),
      limit: '50',
      q: blogState.q
    });
    const data = await api('/api/admin/blogs?' + params.toString());
    blogState.items = data.items;
    blogState.pages = data.pages;
    blogState.page = data.page;
    renderBlogRows(data.items);
    if ($('#blogPageInfo')) {
      $('#blogPageInfo').textContent = `Page ${data.page} of ${data.pages} · ${data.total} blogs`;
    }
    if ($('#blogPrevBtn')) $('#blogPrevBtn').disabled = data.page <= 1;
    if ($('#blogNextBtn')) $('#blogNextBtn').disabled = data.page >= data.pages;
  }

  async function openCreateBlog() {
    resetBlogForm();
    showBlogEditor();
  }

  async function fillBlogForm(id) {
    const data = await api('/api/admin/blogs?id=' + encodeURIComponent(id));
    const item = data.item;
    if (!item) throw new Error('Blog not found');

    resetBlogForm();
    blogState.editingId = item.id;
    blogState.slugTouched = true;
    if ($('#blogId')) $('#blogId').value = item.id;
    if ($('#blogTitle')) $('#blogTitle').value = item.title || '';
    if ($('#blogSlug')) $('#blogSlug').value = item.slug || '';
    if ($('#blogAuthor')) $('#blogAuthor').value = item.author || '';
    if ($('#blogStatus')) $('#blogStatus').value = item.status === 'draft' ? 'draft' : 'published';
    if ($('#blogPublishedAt')) $('#blogPublishedAt').value = item.publishedAtIso || todayInputValue();
    if ($('#blogImageUrl')) $('#blogImageUrl').value = item.imageUrl || item.coverImageUrl || '';
    if ($('#blogSeoTitle')) $('#blogSeoTitle').value = item.seoTitle || '';
    if ($('#blogSeoDescription')) $('#blogSeoDescription').value = item.seoDescription || item.excerpt || '';
    setHtmlMode(false);
    setEditorHtml(item.bodyHtml || '');
    if ($('#blogBodyHtml')) $('#blogBodyHtml').value = item.bodyHtml || '';
    if ($('#blogFormHeading')) $('#blogFormHeading').textContent = 'Edit Blog';
    if ($('#blogSubmitBtn')) $('#blogSubmitBtn').textContent = 'Save changes';

    const preview = $('#blogCoverPreview');
    const previewImg = $('#blogCoverPreviewImg');
    if (preview && previewImg && (item.imageUrl || item.coverImageUrl)) {
      previewImg.src = item.imageUrl || item.coverImageUrl;
      preview.hidden = false;
    }
    showBlogEditor();
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
    showBlogList();

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
          onboardingRowsEl.innerHTML = `<tr><td class="empty" colspan="8">${escapeHtml(err.message || 'Could not load onboarding.')}</td></tr>`;
        })
      );
    }
    if (blogRowsEl) {
      loads.push(
        loadBlogs().catch((err) => {
          blogRowsEl.innerHTML = `<tr><td class="empty" colspan="7">${escapeHtml(err.message || 'Could not load blogs.')}</td></tr>`;
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
          onboardingRowsEl.innerHTML = `<tr><td class="empty" colspan="8">${escapeHtml(err.message)}</td></tr>`;
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

  if ($('#obStatusFilter')) {
    $('#obStatusFilter').addEventListener('change', (e) => {
      obState.status = e.target.value;
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
      const header = ['companyName', 'email', 'linkedin', 'role', 'source', 'page', 'createdAt'];
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
      const params = new URLSearchParams({
        page: '1',
        limit: '500',
        q: obState.q,
        role: obState.role,
        status: obState.status
      });
      const data = await api('/api/admin/onboarding?' + params.toString());
      const header = ['contactName', 'contactEmail', 'contactPhone', 'role', 'status', 'currentStepId', 'fileCount', 'createdAt', 'updatedAt'];
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

  let blogTimer;
  if ($('#blogSearch')) {
    $('#blogSearch').addEventListener('input', (e) => {
      clearTimeout(blogTimer);
      blogTimer = setTimeout(() => {
        blogState.q = e.target.value.trim();
        blogState.page = 1;
        loadBlogs().catch((err) => {
          if (blogRowsEl) {
            blogRowsEl.innerHTML = `<tr><td class="empty" colspan="7">${escapeHtml(err.message)}</td></tr>`;
          }
        });
      }, 250);
    });
  }

  if ($('#blogPrevBtn')) {
    $('#blogPrevBtn').addEventListener('click', () => {
      if (blogState.page > 1) {
        blogState.page -= 1;
        loadBlogs();
      }
    });
  }
  if ($('#blogNextBtn')) {
    $('#blogNextBtn').addEventListener('click', () => {
      if (blogState.page < blogState.pages) {
        blogState.page += 1;
        loadBlogs();
      }
    });
  }

  if ($('#blogCreateBtn')) {
    $('#blogCreateBtn').addEventListener('click', () => openCreateBlog());
  }
  if ($('#blogBackBtn')) {
    $('#blogBackBtn').addEventListener('click', () => {
      resetBlogForm();
      showBlogList();
    });
  }
  if ($('#blogCancelBtn')) {
    $('#blogCancelBtn').addEventListener('click', () => {
      resetBlogForm();
      showBlogList();
    });
  }

  if ($('#blogTitle')) {
    $('#blogTitle').addEventListener('input', (e) => {
      if (blogState.slugTouched) return;
      if ($('#blogSlug')) $('#blogSlug').value = slugifyClient(e.target.value);
    });
  }
  if ($('#blogSlug')) {
    $('#blogSlug').addEventListener('input', () => {
      blogState.slugTouched = true;
    });
  }

  if ($('#blogContentEditor')) {
    const editorEl = $('#blogContentEditor');
    try {
      document.execCommand('defaultParagraphSeparator', false, 'p');
    } catch (_) {
      /* unsupported in some browsers */
    }
    editorEl.addEventListener('focus', () => {
      ensureEditorParagraph(editorEl);
      saveEditorSelection();
      syncBlockStyleSelect();
    });
    editorEl.addEventListener('mouseup', () => {
      saveEditorSelection();
      syncBlockStyleSelect();
    });
    editorEl.addEventListener('keyup', () => {
      normalizeDivBlocks(editorEl);
      saveEditorSelection();
      syncBlockStyleSelect();
    });
    editorEl.addEventListener('keydown', (e) => {
      if (breakOutOfHeadingOnEnter(e)) return;
      if (e.key === 'Enter' && !e.shiftKey) {
        // After browser inserts the new block, normalize div→p and sync style.
        requestAnimationFrame(() => {
          normalizeDivBlocks(editorEl);
          saveEditorSelection();
          syncBlockStyleSelect();
        });
      }
    });
    editorEl.addEventListener('input', () => {
      saveEditorSelection();
    });
    document.addEventListener('selectionchange', () => {
      if (blogState.view !== 'editor' || blogState.htmlMode || blogState.blockMenuOpen) return;
      const sel = window.getSelection();
      if (!sel || !sel.rangeCount) return;
      if (!editorEl.contains(sel.anchorNode)) return;
      saveEditorSelection();
      syncBlockStyleSelect();
    });
  }

  if ($('#blogBlockToggle')) {
    $('#blogBlockToggle').addEventListener('mousedown', (e) => {
      e.preventDefault();
      saveEditorSelection();
    });
    $('#blogBlockToggle').addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      if (blogState.htmlMode) {
        setMsg($('#blogMsg'), 'Switch off HTML mode to use formatting tools.', false);
        return;
      }
      if (blogState.blockMenuOpen) closeBlockMenu();
      else openBlockMenu();
    });
  }

  if ($('#blogBlockList')) {
    $('#blogBlockList').addEventListener('mousedown', (e) => {
      e.preventDefault();
      saveEditorSelection();
    });
    $('#blogBlockList').addEventListener('click', (e) => {
      const btn = e.target.closest('[data-block]');
      if (!btn) return;
      e.preventDefault();
      e.stopPropagation();
      const tag = btn.getAttribute('data-block') || 'P';
      closeBlockMenu();
      applyBlockFormat(tag);
    });
  }

  document.addEventListener('mousedown', (e) => {
    if (!blogState.blockMenuOpen) return;
    const menu = $('#blogBlockMenu');
    if (menu && !menu.contains(e.target)) closeBlockMenu();
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && blogState.blockMenuOpen) closeBlockMenu();
  });

  function openBlogImageModal() {
    const modal = $('#blogImageModal');
    if (!modal) return;
    if ($('#blogInlineImageUrl')) $('#blogInlineImageUrl').value = '';
    if ($('#blogInlineImageFile')) $('#blogInlineImageFile').value = '';
    if ($('#blogInlineImageAlt')) $('#blogInlineImageAlt').value = '';
    setMsg($('#blogImageModalMsg'), '', true);
    modal.hidden = false;
    modal.setAttribute('aria-hidden', 'false');
  }

  function closeBlogImageModal() {
    const modal = $('#blogImageModal');
    if (!modal) return;
    modal.hidden = true;
    modal.setAttribute('aria-hidden', 'true');
  }

  document.querySelectorAll('.rich-editor__toolbar [data-cmd]').forEach((btn) => {
    btn.addEventListener('mousedown', (e) => {
      e.preventDefault();
      saveEditorSelection();
    });
    btn.addEventListener('click', () => {
      const cmd = btn.getAttribute('data-cmd');
      const editor = $('#blogContentEditor');
      if (!editor && cmd !== 'toggleHtml') return;

      if (cmd === 'toggleHtml') {
        if (blogState.htmlMode) setHtmlMode(false);
        else setHtmlMode(true);
        return;
      }

      if (blogState.htmlMode && cmd !== 'insertImage') {
        setMsg($('#blogMsg'), 'Switch off HTML mode to use formatting tools.', false);
        return;
      }

      editor.focus();
      restoreEditorSelection();

      if (cmd === 'createLink') {
        const url = window.prompt('Enter link URL');
        if (url) document.execCommand('createLink', false, url);
        return;
      }
      if (cmd === 'blockquote') {
        applyBlockFormat('BLOCKQUOTE');
        return;
      }
      if (cmd === 'checklist') {
        insertHtmlAtCursor(
          '<ul class="blog-checklist"><li><label><input type="checkbox" /> Checklist item</label></li></ul><p><br></p>'
        );
        return;
      }
      if (cmd === 'insertImage') {
        openBlogImageModal();
        return;
      }
      document.execCommand(cmd, false, null);
    });
  });

  if ($('#blogImageModal')) {
    $('#blogImageModal').querySelectorAll('[data-blog-image-close]').forEach((el) => {
      el.addEventListener('click', closeBlogImageModal);
    });
  }

  if ($('#blogInlineImageInsert')) {
    $('#blogInlineImageInsert').addEventListener('click', async () => {
      const msg = $('#blogImageModalMsg');
      const alt = ($('#blogInlineImageAlt') && $('#blogInlineImageAlt').value.trim()) || '';
      const fileInput = $('#blogInlineImageFile');
      const file = fileInput && fileInput.files && fileInput.files[0];
      let url = ($('#blogInlineImageUrl') && $('#blogInlineImageUrl').value.trim()) || '';

      try {
        if (file) {
          setMsg(msg, 'Uploading…', true);
          const fd = new FormData();
          fd.append('cover', file);
          const res = await fetch('/api/admin/blogs?action=upload-image', {
            method: 'POST',
            credentials: 'include',
            body: fd
          });
          const data = await res.json().catch(() => ({}));
          if (!res.ok) throw new Error(data.error || 'Upload failed');
          url = data.url;
        }
        if (!url) {
          setMsg(msg, 'Provide an Image URL or upload a file.', false);
          return;
        }
        const safeAlt = escapeHtml(alt);
        const safeUrl = escapeHtml(url);
        insertHtmlAtCursor(
          `<figure class="blog-inline-image"><img src="${safeUrl}" alt="${safeAlt}" loading="lazy" /></figure><p><br></p>`
        );
        closeBlogImageModal();
      } catch (err) {
        setMsg(msg, err.message || 'Could not insert image.', false);
      }
    });
  }

  if ($('#blogImageUrl')) {
    $('#blogImageUrl').addEventListener('input', (e) => {
      const url = e.target.value.trim();
      const preview = $('#blogCoverPreview');
      const previewImg = $('#blogCoverPreviewImg');
      if (!preview || !previewImg) return;
      if (!url) {
        preview.hidden = true;
        return;
      }
      previewImg.src = url;
      preview.hidden = false;
    });
  }

  if ($('#blogCover')) {
    $('#blogCover').addEventListener('change', (e) => {
      const file = e.target.files && e.target.files[0];
      const preview = $('#blogCoverPreview');
      const previewImg = $('#blogCoverPreviewImg');
      if (!file || !preview || !previewImg) return;
      const url = URL.createObjectURL(file);
      previewImg.onload = () => URL.revokeObjectURL(url);
      previewImg.src = url;
      preview.hidden = false;
      // Temporary local preview; Image URL stays until upload saves a public URL
      if ($('#blogImageUrl') && !$('#blogImageUrl').value) {
        $('#blogImageUrl').required = false;
      }
    });
  }

  if ($('#blogForm')) {
    $('#blogForm').addEventListener('submit', async (e) => {
      e.preventDefault();
      const btn = $('#blogSubmitBtn');
      const msg = $('#blogMsg');
      const form = $('#blogForm');
      const editing = !!blogState.editingId;
      const contentHtml = getEditorHtml();
      const hasUpload = !!( $('#blogCover') && $('#blogCover').files && $('#blogCover').files[0] );
      const imageUrl = ($('#blogImageUrl') && $('#blogImageUrl').value.trim()) || '';

      if (!contentHtml) {
        setMsg(msg, 'Content Editor is required.', false);
        return;
      }
      if (!imageUrl && !hasUpload) {
        setMsg(msg, 'Image URL is required (or upload an image).', false);
        return;
      }

      if ($('#blogBodyHtml')) $('#blogBodyHtml').value = contentHtml;
      if ($('#blogSlug') && !$('#blogSlug').value.trim() && $('#blogTitle')) {
        $('#blogSlug').value = slugifyClient($('#blogTitle').value);
      }

      const fd = new FormData(form);
      fd.set('bodyHtml', contentHtml);
      fd.set('content', contentHtml);
      if (!hasUpload && imageUrl) {
        fd.set('imageUrl', imageUrl);
        fd.delete('cover');
      }

      if (btn) btn.disabled = true;
      setMsg(msg, 'Saving…', true);

      try {
        const url = editing
          ? '/api/admin/blogs?id=' + encodeURIComponent(blogState.editingId)
          : '/api/admin/blogs';
        const res = await fetch(url, {
          method: editing ? 'PATCH' : 'POST',
          credentials: 'include',
          body: fd
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(data.error || 'Request failed');
        resetBlogForm();
        showBlogList();
        await loadBlogs();
      } catch (err) {
        setMsg(msg, err.message || 'Could not save blog.', false);
      } finally {
        if (btn) btn.disabled = false;
      }
    });
  }

  if (blogRowsEl) {
    blogRowsEl.addEventListener('click', async (e) => {
      const editBtn = e.target.closest('[data-blog-edit]');
      if (editBtn) {
        try {
          await fillBlogForm(editBtn.getAttribute('data-blog-edit'));
        } catch (err) {
          window.alert(err.message || 'Could not load blog.');
        }
        return;
      }
      const delBtn = e.target.closest('[data-blog-delete-id]');
      if (!delBtn) return;
      const id = delBtn.getAttribute('data-blog-delete-id');
      const title = delBtn.getAttribute('data-blog-delete-title') || 'this blog';
      if (!id) return;
      if (!window.confirm(`Delete “${title}”? This cannot be undone.`)) return;
      delBtn.disabled = true;
      try {
        await api('/api/admin/blogs?id=' + encodeURIComponent(id), { method: 'DELETE' });
        if (blogState.editingId === id) {
          resetBlogForm();
          showBlogList();
        }
        await loadBlogs();
      } catch (err) {
        delBtn.disabled = false;
        window.alert(err.message || 'Could not delete that blog.');
      }
    });
  }
})();
