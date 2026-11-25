function escapeHtml(value) {
  return String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

const CIRCLE_WHATSAPP_URL = 'https://chat.whatsapp.com/FVf4arP8OCu0OVstKVfXt5?mode=gi_t';
const LOGO_URL = 'https://assets.wefundco.com/WeFundCo-color_1795602703208_ea81.png';
const SUPPORT_EMAIL = 'investments@wefundco.com';

const COLORS = {
  royal: '#01279F',
  teal: '#0AAFC8',
  picton: '#30AFF8',
  oxford: '#001438',
  navy: '#1A1B60',
  gray: '#6E6E6E',
  line: '#D3D3D3',
  paper: '#F4F6F9',
  white: '#FFFFFF'
};

function roleLabel(role) {
  const map = {
    startup: 'Founder / startup',
    investor: 'Investor',
    partner: 'Strategic partner',
    general: 'Waitlist member'
  };
  return map[role] || 'Waitlist member';
}

function brandShell({ title, preheader, badge, siteUrl, logoSrc, bodyHtml }) {
  const home = escapeHtml(siteUrl || 'https://www.wefundco.com');
  const logo = escapeHtml(logoSrc || LOGO_URL);
  const safeTitle = escapeHtml(title || 'WeFundCo');
  const safeBadge = escapeHtml(badge || 'WeFundCo');
  const safePre = escapeHtml(preheader || '');

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta name="color-scheme" content="light" />
  <meta name="supported-color-schemes" content="light" />
  <title>${safeTitle}</title>
</head>
<body style="margin:0;padding:0;background:${COLORS.paper};font-family:Helvetica,Arial,sans-serif;color:${COLORS.oxford};">
  <div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent;">${safePre}</div>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${COLORS.paper};padding:32px 12px;">
    <tr>
      <td align="center">
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:${COLORS.white};border-radius:20px;overflow:hidden;border:1px solid #E8ECF2;">
          <tr>
            <td style="background:${COLORS.white};padding:22px 36px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="vertical-align:middle;">
                    <a href="${home}" style="text-decoration:none;">
                      <img src="${logo}" alt="WeFundCo" width="168" style="display:block;border:0;outline:none;text-decoration:none;height:auto;max-width:180px;width:168px;" />
                    </a>
                  </td>
                  <td align="right" style="vertical-align:middle;">
                    <span style="font-family:ui-monospace,Menlo,Consolas,monospace;font-size:11px;letter-spacing:.14em;text-transform:uppercase;color:${COLORS.teal};">${safeBadge}</span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="height:4px;background:linear-gradient(90deg,${COLORS.royal},${COLORS.teal},${COLORS.picton});font-size:0;line-height:0;">&nbsp;</td>
          </tr>
          ${bodyHtml}
          <tr>
            <td style="background:${COLORS.paper};padding:28px 36px;border-top:1px solid #E8ECF2;">
              <p style="margin:0 0 10px;font-size:12px;line-height:1.6;color:${COLORS.gray};">
                An investment readiness, intelligence and transaction platform connecting businesses and capital with greater clarity.
              </p>
              <p style="margin:0 0 10px;font-size:12px;line-height:1.6;color:${COLORS.gray};">
                WeFundCo does not provide investment advice, guarantee investment outcomes, or act as a broker, securities intermediary or placement agent.
              </p>
              <p style="margin:0 0 8px;font-size:12px;line-height:1.6;color:${COLORS.gray};">
                Questions? <a href="mailto:${SUPPORT_EMAIL}" style="color:${COLORS.royal};text-decoration:underline;">${SUPPORT_EMAIL}</a>
              </p>
              <p style="margin:0;font-size:12px;line-height:1.6;color:${COLORS.gray};">
                © 2026 CapitalPrime Technologies Private Limited. All rights reserved.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

function ctaButton(href, label) {
  return `
    <table role="presentation" cellpadding="0" cellspacing="0">
      <tr>
        <td style="border-radius:999px;background:${COLORS.royal};">
          <a href="${escapeHtml(href)}" target="_blank" style="display:inline-block;padding:13px 22px;font-size:14px;font-weight:700;color:${COLORS.white};text-decoration:none;border-radius:999px;">
            ${escapeHtml(label)}
          </a>
        </td>
      </tr>
    </table>`;
}

function infoCard(rowsHtml) {
  return `
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border:1px solid ${COLORS.line};border-radius:14px;overflow:hidden;">
      ${rowsHtml}
    </table>`;
}

function row(label, value) {
  return `
    <tr>
      <td style="padding:12px 16px;width:130px;background:${COLORS.paper};font-family:ui-monospace,Menlo,Consolas,monospace;font-size:11px;letter-spacing:.08em;text-transform:uppercase;color:${COLORS.gray};border-bottom:1px solid #E8ECF2;">${escapeHtml(label)}</td>
      <td style="padding:12px 16px;font-size:14px;color:${COLORS.oxford};border-bottom:1px solid #E8ECF2;">${escapeHtml(value)}</td>
    </tr>`;
}

function waitlistThankYouEmail({ siteUrl, logoSrc } = {}) {
  const home = siteUrl || 'https://www.wefundco.com';
  const bodyHtml = `
    <tr>
      <td style="padding:36px 36px 12px;">
        <p style="margin:0 0 10px;font-family:ui-monospace,Menlo,Consolas,monospace;font-size:12px;letter-spacing:.14em;text-transform:uppercase;color:${COLORS.teal};">Waitlist confirmed</p>
        <h1 style="margin:0 0 18px;font-family:Georgia,'Times New Roman',serif;font-size:30px;line-height:1.2;color:${COLORS.oxford};letter-spacing:-.02em;">
          You're on the <span style="color:${COLORS.picton};">waitlist.</span>
        </h1>
        <p style="margin:0 0 16px;font-size:15px;line-height:1.65;color:${COLORS.navy};">
          Thank you for your interest in WeFundCo — an investment readiness, intelligence and transaction platform built to help businesses prepare for capital with greater clarity.
        </p>
        <p style="margin:0 0 8px;font-size:15px;line-height:1.65;color:${COLORS.navy};">
          Your spot is confirmed. Our team will be in touch shortly for a few basic profile details so we can evaluate fit as early access opens.
        </p>
      </td>
    </tr>
    <tr>
      <td style="padding:8px 36px 24px;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${COLORS.paper};border-radius:14px;border:1px solid #E8ECF2;">
          <tr>
            <td style="padding:22px 24px;">
              <p style="margin:0 0 8px;font-size:15px;line-height:1.5;color:${COLORS.oxford};font-weight:700;">While you wait: join WeFundCo Circle</p>
              <p style="margin:0 0 16px;font-size:14px;line-height:1.6;color:${COLORS.navy};">
                A WhatsApp community for founders, operators and investors to exchange ideas and build relevant connections.
              </p>
              ${ctaButton(CIRCLE_WHATSAPP_URL, 'Join WeFundCo Circle →')}
            </td>
          </tr>
        </table>
      </td>
    </tr>
    <tr>
      <td style="padding:0 36px 32px;">
        <p style="margin:0 0 10px;font-size:15px;line-height:1.5;color:${COLORS.oxford};font-weight:700;">What happens next</p>
        <p style="margin:0;font-size:14px;line-height:1.75;color:${COLORS.navy};">
          1. We review waitlist sign-ups on a rolling basis.<br />
          2. Our team reaches out for a few basic profile details.<br />
          3. You'll hear from us as early access opens.
        </p>
        <p style="margin:22px 0 0;font-size:14px;line-height:1.6;color:${COLORS.navy};">
          Thank you for your interest in WeFundCo.
        </p>
        <p style="margin:12px 0 0;font-size:14px;line-height:1.6;color:${COLORS.oxford};font-weight:700;">
          The WeFundCo Team
        </p>
        <div style="margin-top:22px;">${ctaButton(home, 'Visit WeFundCo →')}</div>
      </td>
    </tr>`;

  return brandShell({
    title: "You're on the WeFundCo waitlist",
    preheader: "You're on the WeFundCo waitlist. Here's what happens next.",
    badge: 'Waitlist',
    siteUrl: home,
    logoSrc,
    bodyHtml
  });
}

function waitlistThankYouText() {
  return [
    "You're on the waitlist.",
    '',
    'Thank you for your interest in WeFundCo, an investment readiness, intelligence and transaction platform built to help businesses prepare for capital with greater clarity.',
    '',
    'Your spot is confirmed on the waitlist. Our team will be in touch shortly to ask for a few basic profile details.',
    '',
    'While you wait: join WeFundCo Circle',
    CIRCLE_WHATSAPP_URL,
    '',
    'What happens next',
    '1. We review waitlist sign-ups on a rolling basis.',
    '2. Our team reaches out for a few basic profile details.',
    "3. You'll hear from us as early access opens.",
    '',
    'The WeFundCo Team',
    `Questions? ${SUPPORT_EMAIL}`
  ].join('\n');
}

function waitlistAdminEmail({ email, role, source, page, createdAt, siteUrl, logoSrc } = {}) {
  const home = siteUrl || 'https://www.wefundco.com';
  const bodyHtml = `
    <tr>
      <td style="padding:36px;">
        <p style="margin:0 0 8px;font-family:ui-monospace,Menlo,Consolas,monospace;font-size:12px;letter-spacing:.14em;text-transform:uppercase;color:${COLORS.teal};">New signup</p>
        <h1 style="margin:0 0 18px;font-family:Georgia,'Times New Roman',serif;font-size:28px;line-height:1.2;color:${COLORS.oxford};">
          Someone just joined the waitlist.
        </h1>
        ${infoCard(`
          ${row('Email', email)}
          ${row('Role', roleLabel(role))}
          ${row('Source', source || '—')}
          ${row('Page', page || '—')}
          ${row('Time', createdAt || '—')}
        `)}
        <p style="margin:22px 0 0;font-size:14px;color:${COLORS.gray};">
          Open <a href="${escapeHtml(home)}/admin" style="color:${COLORS.royal};">Admin</a> to review the full list.
        </p>
      </td>
    </tr>`;

  return brandShell({
    title: 'New WeFundCo waitlist signup',
    preheader: `New waitlist signup: ${email || ''}`,
    badge: 'Admin',
    siteUrl: home,
    logoSrc,
    bodyHtml
  });
}

function fileListHtml(files) {
  const list = Array.isArray(files) ? files.filter(Boolean) : [];
  if (!list.length) {
    return `<p style="margin:16px 0 0;font-size:14px;color:${COLORS.gray};">No files were uploaded with this submission.</p>`;
  }
  const items = list
    .map((f) => {
      const name = typeof f === 'string' ? f : (f.name || f.filename || 'file');
      return `<li style="margin:0 0 6px;font-size:14px;color:${COLORS.navy};">${escapeHtml(name)}</li>`;
    })
    .join('');
  return `
    <p style="margin:18px 0 8px;font-size:15px;line-height:1.5;color:${COLORS.oxford};font-weight:700;">Uploaded files (${list.length})</p>
    <ul style="margin:0;padding-left:18px;">${items}</ul>
    <p style="margin:10px 0 0;font-size:13px;color:${COLORS.gray};">These files are also attached to this email.</p>`;
}

function onboardingThankYouEmail({ siteUrl, logoSrc, name, role, files } = {}) {
  const home = siteUrl || 'https://www.wefundco.com';
  const greeting = name ? `Hi ${escapeHtml(name)},` : 'Hello,';
  const bodyHtml = `
    <tr>
      <td style="padding:36px 36px 12px;">
        <p style="margin:0 0 10px;font-family:ui-monospace,Menlo,Consolas,monospace;font-size:12px;letter-spacing:.14em;text-transform:uppercase;color:${COLORS.teal};">Submission received</p>
        <h1 style="margin:0 0 18px;font-family:Georgia,'Times New Roman',serif;font-size:30px;line-height:1.2;color:${COLORS.oxford};letter-spacing:-.02em;">
          Thank you — we received your <span style="color:${COLORS.picton};">submission.</span>
        </h1>
        <p style="margin:0 0 14px;font-size:15px;line-height:1.65;color:${COLORS.navy};">${greeting}</p>
        <p style="margin:0 0 14px;font-size:15px;line-height:1.65;color:${COLORS.navy};">
          Your WeFundCo onboarding details have been submitted successfully${role ? ` as a <strong>${escapeHtml(roleLabel(role))}</strong>` : ''}.
          Our team will review your profile and follow up if anything else is needed.
        </p>
        ${fileListHtml(files)}
        <p style="margin:16px 0 8px;font-size:15px;line-height:1.65;color:${COLORS.navy};">
          No further action is required from you right now.
        </p>
      </td>
    </tr>
    <tr>
      <td style="padding:8px 36px 36px;">
        ${ctaButton(home, 'Visit WeFundCo →')}
        <p style="margin:22px 0 0;font-size:14px;line-height:1.6;color:${COLORS.oxford};font-weight:700;">
          The WeFundCo Team
        </p>
      </td>
    </tr>`;

  return brandShell({
    title: 'We received your WeFundCo submission',
    preheader: 'Your WeFundCo onboarding submission was received successfully.',
    badge: 'Onboarding',
    siteUrl: home,
    logoSrc,
    bodyHtml
  });
}

function onboardingThankYouText({ name, role, files } = {}) {
  const fileLines = (Array.isArray(files) ? files : [])
    .map((f) => `- ${typeof f === 'string' ? f : (f.name || f.filename || 'file')}`);
  return [
    name ? `Hi ${name},` : 'Hello,',
    '',
    'Thank you — we received your WeFundCo onboarding submission.',
    role ? `Role: ${roleLabel(role)}` : '',
    '',
    fileLines.length ? 'Uploaded files:' : 'No files were uploaded.',
    ...fileLines,
    fileLines.length ? '(Files are attached to this email.)' : '',
    '',
    'Our team will review your profile and follow up if anything else is needed.',
    'No further action is required from you right now.',
    '',
    'The WeFundCo Team',
    `Questions? ${SUPPORT_EMAIL}`
  ].filter((line) => line !== '').join('\n');
}

function onboardingAdminEmail({
  email,
  name,
  role,
  phone,
  status,
  createdAt,
  siteUrl,
  logoSrc,
  files
} = {}) {
  const home = siteUrl || 'https://www.wefundco.com';
  const bodyHtml = `
    <tr>
      <td style="padding:36px;">
        <p style="margin:0 0 8px;font-family:ui-monospace,Menlo,Consolas,monospace;font-size:12px;letter-spacing:.14em;text-transform:uppercase;color:${COLORS.teal};">New onboarding</p>
        <h1 style="margin:0 0 18px;font-family:Georgia,'Times New Roman',serif;font-size:28px;line-height:1.2;color:${COLORS.oxford};">
          A new onboarding submission is ready.
        </h1>
        ${infoCard(`
          ${row('Name', name || '—')}
          ${row('Email', email || '—')}
          ${row('Phone', phone || '—')}
          ${row('Role', roleLabel(role))}
          ${row('Status', status || 'complete')}
          ${row('Files', String((files && files.length) || 0))}
          ${row('Time', createdAt || '—')}
        `)}
        ${fileListHtml(files)}
        <p style="margin:22px 0 0;font-size:14px;color:${COLORS.gray};">
          Open <a href="${escapeHtml(home)}/admin" style="color:${COLORS.royal};">Admin → Onboarding</a> to review details and files.
        </p>
      </td>
    </tr>`;

  return brandShell({
    title: 'New WeFundCo onboarding submission',
    preheader: `New onboarding submission: ${email || name || ''}`,
    badge: 'Admin',
    siteUrl: home,
    logoSrc,
    bodyHtml
  });
}

module.exports = {
  LOGO_URL,
  COLORS,
  waitlistThankYouEmail,
  waitlistThankYouText,
  waitlistConfirmationEmail: waitlistThankYouEmail,
  waitlistAdminEmail,
  onboardingThankYouEmail,
  onboardingThankYouText,
  onboardingAdminEmail,
  roleLabel,
  CIRCLE_WHATSAPP_URL
};
