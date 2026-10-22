/**
 * .ht headline — static "Where" + word-by-word phrase crossfade.
 */
(function () {
  'use strict';

  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const STAGGER = 90;
  const DURATION = 380;
  const HOLD = 3200;

  function $(s, c) { return (c || document).querySelector(s); }
  function $$(s, c) { return Array.from((c || document).querySelectorAll(s)); }
  function wait(ms) { return new Promise((r) => { window.setTimeout(r, ms); }); }

  function splitWords(text) {
    return text.trim().split(/\s+/).filter(Boolean);
  }

  function init(root) {
    const staticEl = $('.ht__static', root);
    const liveEl = $('.ht__live', root);
    const measureEl = $('.ht__measure', root);
    const h1 = root.closest('h1');
    if (!staticEl || !liveEl || !measureEl || !h1) return;

    let phrases = [];
    try {
      phrases = JSON.parse(root.getAttribute('data-phrases') || '[]');
    } catch {
      return;
    }
    if (phrases.length < 1) return;

    measureEl.classList.add('display', 'display--lg');

    function phraseWidth(text) {
      measureEl.textContent = text;
      return measureEl.offsetWidth;
    }

    function wordWidth(word) {
      if (!word) return 0;
      measureEl.textContent = word;
      return measureEl.offsetWidth;
    }

    let maxPhraseW = 0;

    function layoutTrack() {
      maxPhraseW = Math.max(...phrases.map(phraseWidth), 1);
      const narrow = window.matchMedia('(max-width: 900px)').matches;
      if (narrow) {
        liveEl.style.width = '';
        liveEl.style.minWidth = '';
        liveEl.style.maxWidth = '';
      } else {
        liveEl.style.width = `${maxPhraseW}px`;
        liveEl.style.minWidth = `${maxPhraseW}px`;
        liveEl.style.maxWidth = `${maxPhraseW}px`;
      }
      liveEl.style.marginInline = 'auto';
    }

    function buildWord(word, layer) {
      const span = document.createElement('span');
      span.className = `ht__word ht__word--${layer}`;
      span.textContent = word;
      return span;
    }

    function mountPlain(text) {
      const words = splitWords(text);
      const frag = document.createDocumentFragment();
      words.forEach((word, i) => {
        if (i > 0) frag.appendChild(document.createTextNode(' '));
        frag.appendChild(buildWord(word, 'live'));
      });
      liveEl.replaceChildren(frag);
    }

    function needsPlainMount(text) {
      const words = splitWords(text);
      const live = $$('.ht__word--live', liveEl);
      if (live.length !== words.length) return true;
      return live.some((el, i) => el.textContent !== words[i]);
    }

    function setPlain(text) {
      if (!needsPlainMount(text)) return;
      mountPlain(text);
    }

    function buildSlot(fromWord, toWord) {
      const slot = document.createElement('span');
      slot.className = 'ht__slot';

      const base = fromWord || toWord;
      if (base) slot.appendChild(buildWord(base, 'ghost'));

      const w = Math.max(wordWidth(fromWord), wordWidth(toWord));
      if (w > 0) slot.style.width = `${w}px`;

      let outEl = null;
      let inEl = null;
      if (fromWord) {
        outEl = buildWord(fromWord, 'out');
        slot.appendChild(outEl);
      }
      if (toWord) {
        inEl = buildWord(toWord, 'in');
        slot.appendChild(inEl);
      }
      return { slot, outEl, inEl };
    }

    function crossfade(fromText, toText) {
      liveEl.classList.add('is-transitioning');
      const fromWords = splitWords(fromText);
      const toWords = splitWords(toText);
      const len = Math.max(fromWords.length, toWords.length);
      const slots = [];
      const frag = document.createDocumentFragment();

      for (let i = 0; i < len; i += 1) {
        if (i > 0) frag.appendChild(document.createTextNode(' '));
        const { slot, outEl, inEl } = buildSlot(fromWords[i], toWords[i]);
        frag.appendChild(slot);
        slots.push({ outEl, inEl });
      }

      liveEl.replaceChildren(frag);

      return slots.reduce(
        (p, { outEl, inEl }) => p.then(() => {
          if (outEl) outEl.classList.add('is-out');
          if (inEl) inEl.classList.add('is-in');
          return wait(STAGGER);
        }),
        Promise.resolve(),
      ).then(() => wait(DURATION)).then(() => {
        setPlain(toText);
        liveEl.classList.remove('is-transitioning');
      });
    }

    async function run() {
      let i = 0;
      setPlain(phrases[i]);

      // eslint-disable-next-line no-constant-condition
      while (true) {
        await wait(HOLD);
        const next = (i + 1) % phrases.length;
        await crossfade(phrases[i], phrases[next]);
        i = next;
      }
    }

    function start() {
      staticEl.style.transform = '';

      const boot = () => {
        layoutTrack();
        if (reduced) {
          setPlain(phrases[0]);
          return;
        }
        run().catch(() => {});
      };

      if (document.fonts && document.fonts.ready) {
        document.fonts.ready.then(boot);
      } else {
        boot();
      }

      window.addEventListener('resize', layoutTrack, { passive: true });
    }

    if (h1.classList.contains('is-in')) {
      start();
      return;
    }

    const obs = new MutationObserver(() => {
      if (!h1.classList.contains('is-in')) return;
      obs.disconnect();
      start();
    });
    obs.observe(h1, { attributes: true, attributeFilter: ['class'] });
  }

  document.querySelectorAll('[data-ht]').forEach(init);
})();
