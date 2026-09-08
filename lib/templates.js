function escapeHtml(value) {
  return String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function wrapEmail({ preheader, inner }) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>WeFundCo</title>
  <style>
    @media (max-width: 620px) {
      .wfc-pad { padding: 28px 20px !important; }
      .wfc-hero { font-size: 28px !important; line-height: 1.2 !important; }
    }
  </style>
</head>
<body style="margin:0;padding:0;background:#F4F6F9;font-family:Helvetica,Arial,sans-serif;">
  <div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent;">${escapeHtml(preheader)}</div>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#F4F6F9;padding:32px 12px;">
    <tr>
      <td align="center">
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#ffffff;border-radius:24px;overflow:hidden;box-shadow:0 18px 50px rgba(0,20,56,.08);">
          ${inner}
        </table>
        <p style="margin:20px 0 0;font-size:12px;line-height:1.6;color:#999999;text-align:center;max-width:520px;">
          WeFundCo is a discovery and introduction platform operated by CapitalPrime Technologies Private Limited. It is not an investment adviser, fundraising broker or crowdfunding platform.
        </p>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

function brandHeader(siteUrl, badge, logoSrc) {
  const home = escapeHtml(siteUrl || 'https://wefundco.in');
  const logo = escapeHtml(logoSrc || 'cid:wefundco-logo');
  return `
    <tr>
      <td style="background:#001438;padding:22px 40px;" class="wfc-pad">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
          <tr>
            <td style="vertical-align:middle;">
              <a href="${home}" style="text-decoration:none;">
                <img src="${logo}" alt="WeFundCo" width="160" height="47" style="display:block;border:0;outline:none;text-decoration:none;height:40px;width:auto;max-width:180px;" />
              </a>
            </td>
            <td align="right" style="vertical-align:middle;">
              <span style="font-family:ui-monospace,Menlo,Consolas,monospace;font-size:11px;letter-spacing:.12em;text-transform:uppercase;color:#0AAFC8;">${escapeHtml(badge || 'Waitlist')}</span>
            </td>
          </tr>
        </table>
      </td>
    </tr>
    <tr>
      <td style="height:4px;background:linear-gradient(90deg,#01279F,#0AAFC8,#30AFF8);font-size:0;line-height:0;">&nbsp;</td>
    </tr>`;
}

function roleLabel(role) {
  const map = {
    startup: 'Founder / startup',
    investor: 'Investor',
    partner: 'Strategic partner',
    general: 'Waitlist member'
  };
  return map[role] || 'Waitlist member';
}

function waitlistThankYouEmail({ email, role, siteUrl }) {
  const home = siteUrl || 'https://wefundco.in';
  const inner = `
    ${brandHeader(home, 'Thank you')}
    <tr>
      <td class="wfc-pad" style="padding:44px 40px 8px;background:#ffffff;">
        <p style="margin:0 0 12px;font-family:ui-monospace,Menlo,Consolas,monospace;font-size:12px;letter-spacing:.16em;text-transform:uppercase;color:#0AAFC8;">Thank you</p>
        <h1 class="wfc-hero" style="margin:0 0 18px;font-family:Georgia,'Times New Roman',serif;font-size:38px;line-height:1.12;letter-spacing:-0.03em;color:#001438;">
          Thank you for joining the WeFundCo waitlist.
        </h1>
        <p style="margin:0 0 12px;font-size:16px;line-height:1.65;color:#6E6E6E;">
          We have your place confirmed for <strong style="color:#001438;">${escapeHtml(email)}</strong> as a <strong style="color:#001438;">${escapeHtml(roleLabel(role))}</strong>.
        </p>
        <p style="margin:0;font-size:16px;line-height:1.65;color:#6E6E6E;">
          You will hear from us before launch. Founding cohort members get first access, first visibility, and the first look at readiness, matching and diligence tools.
        </p>
      </td>
    </tr>
    <tr>
      <td class="wfc-pad" style="padding:28px 40px 8px;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#F4F6F9;border-radius:16px;">
          <tr>
            <td style="padding:24px;">
              <p style="margin:0 0 14px;font-family:ui-monospace,Menlo,Consolas,monospace;font-size:11px;letter-spacing:.12em;text-transform:uppercase;color:#01279F;">What happens next</p>
              <p style="margin:0 0 12px;font-size:15px;line-height:1.55;color:#001438;"><strong>1.</strong> Your email is on the founding list.</p>
              <p style="margin:0 0 12px;font-size:15px;line-height:1.55;color:#001438;"><strong>2.</strong> We write to you first when WeFundCo goes live.</p>
              <p style="margin:0;font-size:15px;line-height:1.55;color:#001438;"><strong>3.</strong> You get early access to investment readiness and intelligence.</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
    <tr>
      <td class="wfc-pad" style="padding:28px 40px 44px;">
        <a href="${escapeHtml(home)}" style="display:inline-block;background:#01279F;color:#ffffff;text-decoration:none;font-family:ui-monospace,Menlo,Consolas,monospace;font-size:13px;letter-spacing:.08em;text-transform:uppercase;padding:16px 22px;border-radius:12px;">
          Visit WeFundCo &nbsp;→
        </a>
        <p style="margin:22px 0 0;font-size:14px;line-height:1.6;color:#999999;">
          From discovery to diligence. From readiness to transaction.
        </p>
      </td>
    </tr>
    <tr>
      <td style="background:#001438;padding:22px 40px;" class="wfc-pad">
        <p style="margin:0;font-size:12px;line-height:1.6;color:#D3D3D3;">
          Questions? Write to <a href="mailto:connect@wefundco.com" style="color:#0AAFC8;text-decoration:none;">connect@wefundco.com</a>
        </p>
      </td>
    </tr>`;

  return wrapEmail({
    preheader: 'Thank you for joining the WeFundCo waitlist. We will be in touch before launch.',
    inner
  });
}

function waitlistThankYouText({ email, role, siteUrl }) {
  const home = siteUrl || 'https://wefundco.in';
  return [
    'Thank you for joining the WeFundCo waitlist.',
    '',
    `We have your place confirmed for ${email} as a ${roleLabel(role)}.`,
    'You will hear from us before launch. Founding cohort members get first access.',
    '',
    'What happens next',
    '1. Your email is on the founding list.',
    '2. We write to you first when WeFundCo goes live.',
    '3. You get early access to investment readiness and intelligence.',
    '',
    `Visit WeFundCo: ${home}`,
    '',
    'From discovery to diligence. From readiness to transaction.',
    'Questions? connect@wefundco.com'
  ].join('\n');
}

function waitlistAdminEmail({ email, role, source, page, createdAt }) {
  const inner = `
    ${brandHeader('https://wefundco.in', 'New signup')}
    <tr>
      <td class="wfc-pad" style="padding:40px;">
        <p style="margin:0 0 8px;font-family:ui-monospace,Menlo,Consolas,monospace;font-size:12px;letter-spacing:.14em;text-transform:uppercase;color:#0AAFC8;">New signup</p>
        <h1 style="margin:0 0 20px;font-family:Georgia,'Times New Roman',serif;font-size:30px;line-height:1.2;color:#001438;">Someone just joined the waitlist.</h1>
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #D3D3D3;border-radius:16px;overflow:hidden;">
          ${row('Email', email)}
          ${row('Role', roleLabel(role))}
          ${row('Source', source || '—')}
          ${row('Page', page || '—')}
          ${row('Time', createdAt)}
        </table>
        <p style="margin:24px 0 0;font-size:14px;color:#6E6E6E;">Open <a href="${escapeHtml(process.env.SITE_URL || 'https://wefundco.in')}/admin" style="color:#01279F;">/admin</a> to see the full list.</p>
      </td>
    </tr>`;

  return wrapEmail({
    preheader: `New waitlist signup: ${email}`,
    inner
  });
}

function row(label, value) {
  return `
    <tr>
      <td style="padding:12px 16px;width:120px;background:#F4F6F9;font-family:ui-monospace,Menlo,Consolas,monospace;font-size:11px;letter-spacing:.08em;text-transform:uppercase;color:#6E6E6E;border-bottom:1px solid #E8ECF2;">${escapeHtml(label)}</td>
      <td style="padding:12px 16px;font-size:14px;color:#001438;border-bottom:1px solid #E8ECF2;">${escapeHtml(value)}</td>
    </tr>`;
}

module.exports = {
  waitlistThankYouEmail,
  waitlistThankYouText,
  waitlistConfirmationEmail: waitlistThankYouEmail,
  waitlistAdminEmail,
  roleLabel
};
