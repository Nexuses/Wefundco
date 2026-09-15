function escapeHtml(value) {
  return String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

const CIRCLE_WHATSAPP_URL = 'https://chat.whatsapp.com/FVf4arP8OCu0OVstKVfXt5?mode=gi_t';

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

function waitlistThankYouEmail({ siteUrl, logoSrc } = {}) {
  const home = escapeHtml(siteUrl || 'https://wefundco.in');
  const logo = escapeHtml(logoSrc || 'cid:wefundco-logo');
  const circleUrl = escapeHtml(CIRCLE_WHATSAPP_URL);

  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>You're on the WeFundCo waitlist</title>
</head>
<body style="margin:0; padding:0; background-color:#F4F1EA; font-family:Arial, Helvetica, sans-serif;">
  <div style="display:none; max-height:0; overflow:hidden; mso-hide:all;">
    You're on the WeFundCo waitlist. Here's what happens next, and a community to join in the meantime.
  </div>

  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#F4F1EA; padding:32px 0;">
    <tr>
      <td align="center">
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px; width:100%; background-color:#FFFFFF; border-radius:8px; overflow:hidden;">

          <tr>
            <td style="background-color:#1F2A44; padding:28px 40px;">
              <a href="${home}" style="text-decoration:none;">
                <img src="${logo}" alt="WeFundCo" width="160" height="47" style="display:block;border:0;outline:none;text-decoration:none;height:40px;width:auto;max-width:180px;" />
              </a>
            </td>
          </tr>

          <tr>
            <td style="padding:40px 40px 8px 40px;">
              <p style="margin:0 0 20px 0; font-size:19px; line-height:1.4; color:#1F2A44; font-weight:bold;">
                You're on the waitlist.
              </p>
              <p style="margin:0 0 20px 0; font-size:15px; line-height:1.6; color:#333333;">
                Thank you for your interest in WeFundCo, an investment readiness, intelligence and transaction platform built to help businesses prepare for capital with greater clarity.
              </p>
              <p style="margin:0 0 20px 0; font-size:15px; line-height:1.6; color:#333333;">
                Your spot is confirmed on the waitlist. Our team will be in touch shortly to ask for a few basic profile details. This helps us evaluate where you are and take things forward as early access opens.
              </p>
            </td>
          </tr>

          <tr>
            <td style="padding:8px 40px 24px 40px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#F4F1EA; border-radius:6px;">
                <tr>
                  <td style="padding:24px 28px;">
                    <p style="margin:0 0 8px 0; font-size:15px; line-height:1.5; color:#1F2A44; font-weight:bold;">
                      While you wait: join WeFundCo Circle
                    </p>
                    <p style="margin:0 0 16px 0; font-size:14px; line-height:1.6; color:#333333;">
                      A WhatsApp community for founders, operators and investors to exchange ideas and build relevant connections, open now, ahead of the platform itself.
                    </p>
                    <table role="presentation" cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="border-radius:4px; background-color:#1F2A44;">
                          <a href="${circleUrl}" target="_blank" style="display:inline-block; padding:12px 24px; font-size:14px; font-weight:bold; color:#FFFFFF; text-decoration:none; border-radius:4px;">
                            Join WeFundCo Circle on WhatsApp →
                          </a>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <tr>
            <td style="padding:0 40px 32px 40px;">
              <p style="margin:0 0 10px 0; font-size:15px; line-height:1.6; color:#333333; font-weight:bold;">
                What happens next
              </p>
              <p style="margin:0; font-size:14px; line-height:1.7; color:#333333;">
                1. We review waitlist sign-ups on a rolling basis.<br />
                2. Our team reaches out for a few basic profile details to evaluate fit and readiness.<br />
                3. You'll hear from us as early access opens.
              </p>
            </td>
          </tr>

          <tr>
            <td style="padding:0 40px 40px 40px; border-top:1px solid #EAEAEA;">
              <p style="margin:24px 0 0 0; font-size:14px; line-height:1.6; color:#333333;">
                Thank you for your patience, and for your interest in WeFundCo.
              </p>
              <p style="margin:16px 0 0 0; font-size:14px; line-height:1.6; color:#333333; font-weight:bold;">
                The WeFundCo Team
              </p>
            </td>
          </tr>

          <tr>
            <td style="background-color:#FAFAF7; padding:28px 40px;">
              <p style="margin:0 0 10px 0; font-size:12px; line-height:1.6; color:#6B7280;">
                An investment readiness, intelligence and transaction platform connecting businesses and capital with greater clarity.
              </p>
              <p style="margin:0 0 10px 0; font-size:12px; line-height:1.6; color:#6B7280;">
                WeFundCo does not provide investment advice, guarantee investment outcomes, or act as a broker, securities intermediary or placement agent. Joining the waitlist does not guarantee platform access or any transaction outcome.
              </p>
              <p style="margin:0 0 8px 0; font-size:12px; line-height:1.6; color:#6B7280;">
                Questions? <a href="mailto:investments@wefundco.com" style="color:#1F2A44; text-decoration:underline;">investments@wefundco.com</a>
              </p>
              <p style="margin:0; font-size:12px; line-height:1.6; color:#6B7280;">
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

function waitlistThankYouText() {
  return [
    "You're on the waitlist.",
    '',
    'Thank you for your interest in WeFundCo, an investment readiness, intelligence and transaction platform built to help businesses prepare for capital with greater clarity.',
    '',
    'Your spot is confirmed on the waitlist. Our team will be in touch shortly to ask for a few basic profile details. This helps us evaluate where you are and take things forward as early access opens.',
    '',
    'While you wait: join WeFundCo Circle',
    'A WhatsApp community for founders, operators and investors to exchange ideas and build relevant connections, open now, ahead of the platform itself.',
    CIRCLE_WHATSAPP_URL,
    '',
    'What happens next',
    '1. We review waitlist sign-ups on a rolling basis.',
    '2. Our team reaches out for a few basic profile details to evaluate fit and readiness.',
    "3. You'll hear from us as early access opens.",
    '',
    'Thank you for your patience, and for your interest in WeFundCo.',
    '',
    'The WeFundCo Team',
    '',
    'Questions? investments@wefundco.com',
    '© 2026 CapitalPrime Technologies Private Limited. All rights reserved.'
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

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>WeFundCo</title>
</head>
<body style="margin:0;padding:0;background:#F4F6F9;font-family:Helvetica,Arial,sans-serif;">
  <div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent;">New waitlist signup: ${escapeHtml(email)}</div>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#F4F6F9;padding:32px 12px;">
    <tr>
      <td align="center">
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#ffffff;border-radius:24px;overflow:hidden;box-shadow:0 18px 50px rgba(0,20,56,.08);">
          ${inner}
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
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
  roleLabel,
  CIRCLE_WHATSAPP_URL
};
