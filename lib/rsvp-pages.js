function escapeHtml(value) {
  return String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function eventRsvpEmail({ siteUrl, logoSrc, trackingUrl, eventName } = {}) {
  const home = escapeHtml(siteUrl || 'https://wefundco.in');
  const logo = escapeHtml(logoSrc || 'cid:wefundco-logo');
  const confirmUrl = escapeHtml(trackingUrl || home);
  const event = escapeHtml(eventName || 'this WeFundCo event');

  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>Confirm your attendance</title>
</head>
<body style="margin:0; padding:0; background-color:#F4F1EA; font-family:Arial, Helvetica, sans-serif;">
  <div style="display:none; max-height:0; overflow:hidden; mso-hide:all;">
    Please confirm you will be attending ${event}.
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
                Can you make it?
              </p>
              <p style="margin:0 0 20px 0; font-size:15px; line-height:1.6; color:#333333;">
                You are invited to ${event}. This confirmation link is unique to this email, so we can tell which send you replied to if we write again.
              </p>
            </td>
          </tr>

          <tr>
            <td style="padding:8px 40px 32px 40px;">
              <table role="presentation" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="border-radius:4px; background-color:#1F2A44;">
                    <a href="${confirmUrl}" target="_blank" style="display:inline-block; padding:14px 28px; font-size:14px; font-weight:bold; color:#FFFFFF; text-decoration:none; border-radius:4px;">
                      Yes, I'll be attending
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <tr>
            <td style="background-color:#FAFAF7; padding:28px 40px;">
              <p style="margin:0 0 10px 0; font-size:12px; line-height:1.6; color:#6B7280;">
                WeFundCo does not provide investment advice, guarantee investment outcomes, or act as a broker, securities intermediary or placement agent.
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

function eventRsvpText({ trackingUrl, eventName } = {}) {
  const event = eventName || 'this WeFundCo event';
  return [
    'Can you make it?',
    '',
    `You are invited to ${event}. This confirmation link is unique to this email, so we can tell which send you replied to if we write again.`,
    '',
    "Yes, I'll be attending:",
    trackingUrl || 'https://wefundco.in',
    '',
    'Questions? investments@wefundco.com',
    '© 2026 CapitalPrime Technologies Private Limited. All rights reserved.'
  ].join('\n');
}

function attendanceConfirmedPage({ siteUrl, confirmation, eventName } = {}) {
  const home = escapeHtml(siteUrl || 'https://wefundco.in');
  const event = escapeHtml(eventName || 'this WeFundCo event');
  const lines = (confirmation && confirmation.lines) || [];
  const details = lines
    .filter((line) => line.kind !== 'status')
    .map((line) => `<p class="line line--${escapeHtml(line.kind)}">${escapeHtml(line.text)}</p>`)
    .join('');

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>Attendance confirmed | WeFundCo</title>
<style>
  body{margin:0;min-height:100vh;display:flex;align-items:center;justify-content:center;background:#F4F6F9;font-family:Helvetica,Arial,sans-serif;color:#001438;padding:24px;}
  .card{width:min(520px,100%);background:#fff;border-radius:24px;overflow:hidden;box-shadow:0 18px 50px rgba(0,20,56,.08);}
  .head{background:#001438;padding:28px 32px;}
  .head p{margin:0;font-family:ui-monospace,Menlo,Consolas,monospace;font-size:12px;letter-spacing:.14em;text-transform:uppercase;color:#0AAFC8;}
  .body{padding:32px;}
  h1{margin:0 0 12px;font-family:Georgia,'Times New Roman',serif;font-size:32px;line-height:1.2;}
  .lede{margin:0 0 20px;color:#6E6E6E;line-height:1.55;}
  .readout{margin:0;padding:16px 18px;border:1px solid #E8ECF2;border-radius:16px;background:#F4F6F9;}
  .line{margin:0 0 8px;font-size:15px;line-height:1.45;}
  .line:last-child{margin-bottom:0;}
  .line--meta{color:#6E6E6E;font-size:13px;}
  a{color:#01279F;}
</style>
</head>
<body>
  <main class="card">
    <div class="head"><p>Attendance</p></div>
    <div class="body">
      <h1>You're confirmed.</h1>
      <p class="lede">Thank you — we have you down for ${event}.</p>
      <div class="readout">${details || '<p class="line">Your confirmation has been recorded.</p>'}</div>
      <p class="lede" style="margin-top:20px;margin-bottom:0;"><a href="${home}">Back to WeFundCo</a></p>
    </div>
  </main>
</body>
</html>`;
}

function trackingNotFoundPage({ siteUrl } = {}) {
  const home = escapeHtml(siteUrl || 'https://wefundco.in');
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>Link not found | WeFundCo</title>
<style>
  body{margin:0;min-height:100vh;display:flex;align-items:center;justify-content:center;background:#F4F6F9;font-family:Helvetica,Arial,sans-serif;color:#001438;padding:24px;}
  .card{width:min(480px,100%);background:#fff;border-radius:24px;padding:32px;box-shadow:0 18px 50px rgba(0,20,56,.08);}
  h1{margin:0 0 12px;font-family:Georgia,'Times New Roman',serif;font-size:30px;}
  p{margin:0 0 16px;color:#6E6E6E;line-height:1.55;}
  a{color:#01279F;}
</style>
</head>
<body>
  <main class="card">
    <h1>This confirmation link is not valid.</h1>
    <p>It may have been copied incorrectly, or it belongs to an email that was never sent.</p>
    <p><a href="${home}">Back to WeFundCo</a></p>
  </main>
</body>
</html>`;
}

module.exports = {
  eventRsvpEmail,
  eventRsvpText,
  attendanceConfirmedPage,
  trackingNotFoundPage
};
