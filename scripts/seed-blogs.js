/**
 * Seed sample WeFundCo blogs for local/demo use.
 * Usage: node scripts/seed-blogs.js
 */
require('dotenv').config({ path: '.env' });
require('dotenv').config({ path: '.env.local', override: true });

const { createBlog, listBlogs } = require('../lib/blogs');

const posts = [
  {
    title: 'Governance Documentation Before the First Investor Call',
    slug: 'governance-documentation-before-investor-call',
    author: 'Navneet Momi',
    publishedAt: '2025-11-18',
    imageUrl: '/Assets/photos/analytics-desk.jpg',
    seoTitle: 'Governance Docs Before Investor Calls | WeFundCo',
    seoDescription: 'What founders should prepare before the first investor conversation — board notes, cap table clarity, and decision rights.',
    bodyHtml: `
      <p>Investor conversations move faster when governance is already clear. Before the first call, founders should be able to explain ownership, decision rights and how the company records material commitments.</p>
      <h2>What “good enough” looks like</h2>
      <p>You do not need a perfect data room on day one. You do need a coherent story: who owns what, who can approve what, and which documents already exist versus which are still being prepared.</p>
      <ul>
        <li>Current cap table with option pool visibility</li>
        <li>Board or advisor arrangements in writing</li>
        <li>Key founder agreements and IP assignment status</li>
      </ul>
      <blockquote>Clarity is not bureaucracy. It is how serious capital decides whether diligence is worth continuing.</blockquote>
      <h3>Use the first call to reduce ambiguity</h3>
      <p>Lead with structure. Investors evaluate readiness as carefully as they evaluate market opportunity — and WeFundCo is built around that distinction.</p>
    `
  },
  {
    title: 'Why Verification Is a Baseline — Not an Endorsement',
    slug: 'verification-baseline-not-endorsement',
    author: 'WeFundCo Editorial',
    publishedAt: '2025-11-10',
    imageUrl: '/Assets/demo-images/compressed/Five-level verification on every startup.jpg',
    seoTitle: 'Verification Is a Baseline | WeFundCo',
    seoDescription: 'Verification improves discovery quality. It does not replace diligence, endorsement or investment judgment.',
    bodyHtml: `
      <p>Verification helps the ecosystem start from shared facts. It is a baseline for structured discovery — not a recommendation to invest, partner or proceed.</p>
      <h2>What verification can and cannot do</h2>
      <p>It can reduce incomplete profiles and inconsistent claims. It cannot replace commercial diligence, legal review or the investor’s own thesis.</p>
      <ul class="blog-checklist">
        <li><label><input type="checkbox" checked disabled /> Identity and company basics reviewed</label></li>
        <li><label><input type="checkbox" checked disabled /> Profile completeness checked</label></li>
        <li><label><input type="checkbox" disabled /> Full investment diligence completed by the investor</label></li>
      </ul>
      <p>On WeFundCo, verification supports clarity. Outcomes remain the responsibility of the parties involved.</p>
    `
  },
  {
    title: 'Structuring Cap Tables for Early-Stage Diligence',
    slug: 'structuring-cap-tables-early-stage',
    author: 'WeFundCo Editorial',
    publishedAt: '2025-10-28',
    imageUrl: '/Assets/demo-images/compressed/Structured profiles before the first call.jpg',
    seoTitle: 'Early-Stage Cap Tables for Diligence | WeFundCo',
    seoDescription: 'How early-stage teams keep cap tables readable for investors without over-engineering the first raise.',
    bodyHtml: `
      <p>A messy cap table slows diligence more than most founders expect. Clean ownership records make conversations about valuation, pool size and future rounds far simpler.</p>
      <h2>Keep the story readable</h2>
      <p>Investors look for surprises: undocumented promises, unclear option grants, or founder equity that cannot be explained in one pass.</p>
      <h3>Practical habits</h3>
      <ol>
        <li>Maintain one source of truth for issued and reserved equity</li>
        <li>Document option grants before they become verbal commitments</li>
        <li>Align founder vesting with the story you tell investors</li>
      </ol>
      <figure class="blog-inline-image"><img src="/Assets/photos/market-screens.jpg" alt="Market screens on a desk" loading="lazy" /></figure>
      <p>Readiness is not a pitch deck. It is the ability to answer ownership questions without hesitation.</p>
    `
  },
  {
    title: 'Resolving Business Disputes: When to Litigate and When to Settle',
    slug: 'resolving-business-disputes',
    author: 'Ava Thompson',
    publishedAt: '2025-11-25',
    imageUrl: '/Assets/demo-images/compressed/www.beatsnoop.com-3000-DYtTr2O6za.jpg',
    seoTitle: 'Litigate or Settle? | WeFundCo Insights',
    seoDescription: 'For founders preparing for capital, dispute strategy should protect momentum, relationships and diligence readiness.',
    bodyHtml: `
      <p>Commercial disagreements rarely arrive at a convenient moment. For founders preparing for investment, a dispute can distract leadership and introduce uncertainty into diligence.</p>
      <h2>When settlement is often the better default</h2>
      <p>Settlement can preserve operating momentum, limit disclosure risk and reduce the management time absorbed by formal proceedings.</p>
      <ul>
        <li>The commercial relationship still has strategic value</li>
        <li>Exposure is containable and documentation is relatively clear</li>
        <li>Leadership bandwidth is needed elsewhere — including fundraising</li>
      </ul>
      <h2>When litigation may be necessary</h2>
      <p>Litigation becomes more defensible when precedent, enforcement or fundamental rights are at stake, or when delay itself creates irreversible harm.</p>
      <p>This is not legal advice. Founders should consult qualified counsel for matters specific to their company.</p>
    `
  },
  {
    title: 'Specialist Partners and Investment Readiness',
    slug: 'specialist-partners-investment-readiness',
    author: 'WeFundCo Editorial',
    publishedAt: '2025-10-14',
    imageUrl: '/Assets/photos/startup-workshop.jpg',
    seoTitle: 'Specialist Partners for Readiness | WeFundCo',
    seoDescription: 'How legal, accounting and specialist partners help businesses prepare for structured capital conversations.',
    bodyHtml: `
      <p>Investment readiness is rarely a solo exercise. Legal, accounting, product and talent specialists often remove friction before an investor ever opens a data room.</p>
      <h2>Where partners create leverage</h2>
      <p>The right specialist does not “sell” the company. They help the company become easier to evaluate — through documentation, controls and clearer operating narratives.</p>
      <blockquote>Capital conversations reward preparation. Partners help that preparation happen on purpose.</blockquote>
      <p>WeFundCo connects businesses and capital with greater clarity — while leaving diligence and decisions with the parties themselves.</p>
    `
  },
  {
    title: 'Introductions That Begin With Context, Not a Cold Ask',
    slug: 'introductions-with-context-not-cold-ask',
    author: 'WeFundCo Editorial',
    publishedAt: '2025-09-30',
    imageUrl: '/Assets/photos/team-meeting.jpg',
    seoTitle: 'Better Capital Introductions | WeFundCo',
    seoDescription: 'Warm, contextual introductions outperform cold outreach when businesses and investors are evaluating fit.',
    bodyHtml: `
      <p>Cold outreach asks for attention before earning it. Contextual introductions start with fit: thesis, stage, geography and what both sides are actually looking for.</p>
      <h2>Why context changes outcomes</h2>
      <p>Investors remember relevance. Founders remember respect for their time. A structured platform can carry that context so the first conversation is not a cold pitch.</p>
      <h3>A better first exchange includes</h3>
      <ul>
        <li>Why the introduction is being made</li>
        <li>What has already been verified or prepared</li>
        <li>What the next useful step could be</li>
      </ul>
      <p>That is the tone WeFundCo is designed around: clarity first, pressure never.</p>
    `
  }
];

async function main() {
  const existing = await listBlogs({ admin: true, limit: 100 });
  const bySlug = new Set((existing.items || []).map((i) => i.slug));
  let created = 0;
  let skipped = 0;

  for (const post of posts) {
    if (bySlug.has(post.slug)) {
      console.log('skip', post.slug);
      skipped += 1;
      continue;
    }
    const item = await createBlog({
      title: post.title,
      slug: post.slug,
      author: post.author,
      publishedAt: post.publishedAt,
      coverImageUrl: post.imageUrl,
      imageUrl: post.imageUrl,
      bodyHtml: post.bodyHtml,
      seoTitle: post.seoTitle,
      seoDescription: post.seoDescription,
      status: 'published'
    });
    console.log('created', item.slug);
    created += 1;
  }

  const after = await listBlogs({ admin: false, limit: 100 });
  console.log(JSON.stringify({ created, skipped, publicTotal: after.total }, null, 2));
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
