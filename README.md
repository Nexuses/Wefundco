# WeFundCo — Home page

Static site. Open `index.html` in a browser, or drop the folder on Netlify / Vercel / any host.

```
index.html
css/styles.css
js/main.js
```

No build step, no dependencies. Fonts + Unsplash images load over CDN; if images are blocked, they fall back to brand gradients automatically.

---

## On the SaleUnion reference

SaleUnion is a **commercial Webflow template** sold by Flomio Studio. None of its markup or CSS was copied into this project — shipping that on a live commercial site would be infringement.

What was taken is the **design specification**, measured from the rendered page: colour values, type scale, radii, spacing, container width and easing. Those are facts about a design, not protected expression, and the implementation here is original.

Measured tokens, all defined at the top of `styles.css`:

| Token | Value |
|---|---|
| Display type | Cambo 400 — 76px/76px, ls −0.04em |
| Sans headings | Aspekta 500 — 32px/41.6px, ls −0.02em |
| Body | Aspekta 400 — 16px/22.4px |
| Labels & buttons | Geist Mono 500 — 14px & 16px, uppercase |
| Ink / paper / muted | `#161515` / `#F8F7F7` / `#555151` |
| Accents | mint `#A4F7D2` · pink `#DF8BE0` · lilac `#DAC3FF` · blush `#F6CEF0` · sky `#E6F1FF` |
| Radii | 12 (buttons) · 16 · 24 · 32 · 80 (full-bleed cards) · 100% |
| Container / gutter | 1264px / 96px |
| Buttons | 20×24px padding, 12px radius, 58px tall |
| Transitions | 0.25s / 0.5s ease |

Worth knowing: the reference uses **no GSAP and no Lenis** — it's all native Webflow interactions. This build uses plain `requestAnimationFrame` scroll handlers, so there's no animation library to load.

### Fonts — licensing

All three are free for commercial use. Verified loading before shipping.

| Font | Licence | Source |
|---|---|---|
| Aspekta (variable, 50–1000) | OFL 1.1 | [github.com/ivodolenc/aspekta](https://github.com/ivodolenc/aspekta) via jsDelivr |
| Cambo | OFL | Google Fonts |
| Geist Mono | OFL | Google Fonts |

Aspekta currently loads from jsDelivr. **For production, self-host it** — download the woff2 from the repo and repoint the `@font-face` src at your own `/fonts` directory. Don't hotlink SaleUnion's Webflow CDN copy.

---

## Section flow

| # | Section | Purpose |
|---|---------|---------|
| 1 | Announce bar + sticky nav | Pre-launch status, persistent waitlist CTA |
| 2 | Hero + drifting image strip | Positioning line, primary CTA, social proof |
| 3 | Choose Your Path | Investor / Startup split — the two funnels |
| 4 | The Problem | Word-by-word reveal of the core thesis |
| 5 | How It Works | 5-step carousel with arrows |
| 6 | Why It Matters | Scroll-pinned stacking stat cards |
| 7 | Events | Sticky-stacking full-bleed event cards |
| 8 | Strategic Partners | Partner categories + marquee |
| 9 | Waitlist Momentum | Counters + animated meters |
| 10 | FAQ | Accordion, one open at a time |
| 11 | Resources | SEO/AEO guide cards |
| 12 | Final CTA | Segmented waitlist form (investor / founder / partner) |
| 13 | Footer | Full site architecture + legal disclaimer |

---

## Before you publish — three things

### 1. Replace the placeholder numbers
Every counter reads from a `data-count` attribute. Search `index.html` for `data-count` and swap in one pass.

| Where | Placeholder |
|-------|-------------|
| Hero + Momentum waitlist total | `640` |
| Founding investor seats | `100` |
| Founding startup seats | `50` |
| Strategic partners | `24` |
| Cities | `18` |
| Stat cards (§6) | `71%`, `60%`, `80%`, `100%` |

The four stat-card percentages are **illustrative only** — the page currently says so in small print under the cards. Either source them (IVCA, Bain–IVCA India Venture Capital Report, Tracxn, Inc42) and cite them, or replace the section with claims you can defend. Remove the disclaimer line once the figures are real.

Meter fill widths are separate from the counters — they're `style="--w:64%"` on each `.bar i`.

### 2. Wire up the waitlist form
`js/main.js` → section 10. It currently validates the email and logs the payload:

```js
const payload = { email, role, ts: ... };
console.log('[WeFundCo] waitlist submission →', payload); // TODO: POST to your endpoint
```

Replace with a `fetch()` to HubSpot, Mailchimp, a Google Sheet, or your API. The `role` field captures investor / founder / partner from the segmented control.

### 3. Swap the stock images
All images are Unsplash CDN URLs. Replace the `src` values with your own assets. Keep the aspect ratios (they're set in CSS) and the `alt` text.

---

## Notes on the copy

Written for a pre-launch platform, which shaped a few decisions:

- **No fabricated testimonials or logos.** SaleUnion uses a testimonials section; since WeFundCo has no users yet, that slot became Resources instead. Add real quotes once the founding cohort is live.
- **Scarcity is stated, not manufactured** — "first 100 investors" and "founding cohort" come from your brief and are verifiable.
- **The footer carries a platform disclaimer** clarifying WeFundCo is not a broker, adviser or intermediary. Have counsel review it before launch; it materially affects your regulatory posture in India.
- **"Merit over network"** is used as the recurring line. It's the sharpest articulation of the mission in your brief and works as a brand-level anchor.

Pages still to build from your architecture doc: For Investors, For Startups, Strategic Partners, Events, Resources, About Us, and the legal set.

---

## Accessibility & performance

- Respects `prefers-reduced-motion` — all scroll animation and count-ups disable.
- Semantic landmarks, real `<details>` accordion, keyboard-operable form.
- Scroll work is `requestAnimationFrame`-throttled and rect-based (not IntersectionObserver), so nothing gets stranded invisible on fast scrolls or anchor jumps.
- Verified: no horizontal overflow at 390 / 768 / 1440px, no console errors, all images resolve or fall back.

**Not yet done:** favicon, OG/Twitter meta images, analytics, and a `sitemap.xml` / `robots.txt`.
