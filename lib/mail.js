const path = require('path');
const nodemailer = require('nodemailer');
const {
  waitlistThankYouEmail,
  waitlistThankYouText,
  waitlistAdminEmail
} = require('./templates');

const LOGO_PATH = path.join(__dirname, '..', 'Assets', 'Wefundco-white.png');
const REPLY_TO = 'connect@wefundco.com';
const logoAttachment = {
  filename: 'wefundco-logo.png',
  path: LOGO_PATH,
  cid: 'wefundco-logo'
};

function env(name, fallback = '') {
  const value = process.env[name];
  if (value == null || value === '') return fallback;
  return value;
}

function smtpConfigured() {
  return Boolean(env('SMTP_HOST') && env('SMTP_USER') && env('SMTP_PASS') && env('FROM_EMAIL'));
}

function publicSiteUrl() {
  const url = env('SITE_URL', 'https://wefundco.in').replace(/\/$/, '');
  if (/localhost|127\.0\.0\.1/.test(url)) return 'https://wefundco.in';
  return url || 'https://wefundco.in';
}

function createTransport() {
  const port = Number(env('SMTP_PORT', '587'));
  const secureEnv = env('SMTP_SECURE', '').toLowerCase();
  const secure = secureEnv === 'true' || secureEnv === '1' || port === 465;

  return nodemailer.createTransport({
    host: env('SMTP_HOST'),
    port,
    secure,
    requireTLS: !secure && port === 587,
    auth: {
      user: env('SMTP_USER'),
      pass: env('SMTP_PASS')
    }
  });
}

async function sendWaitlistEmails(entry) {
  if (!smtpConfigured()) {
    console.warn('[WeFundCo] SMTP is not fully configured — skipped email send.');
    return { sent: false, skipped: true };
  }

  const from = env('FROM_EMAIL');
  const siteUrl = publicSiteUrl();
  const transport = createTransport();
  const createdAt = new Date(entry.createdAt).toLocaleString('en-IN', {
    timeZone: 'Asia/Kolkata',
    dateStyle: 'medium',
    timeStyle: 'short'
  });

  try {
    const info = await transport.sendMail({
      from: `WeFundCo <${from}>`,
      to: entry.email,
      replyTo: REPLY_TO,
      subject: 'Thank you for joining the WeFundCo waitlist',
      text: waitlistThankYouText({
        email: entry.email,
        role: entry.role,
        siteUrl
      }),
      html: waitlistThankYouEmail({
        email: entry.email,
        role: entry.role,
        siteUrl
      }),
      attachments: [logoAttachment]
    });
    console.log('[WeFundCo] thank-you email sent to', entry.email, info.messageId || '');
  } catch (err) {
    console.error('[WeFundCo] thank-you email failed:', err);
    throw err;
  }

  const notifyTo = env('Mail_To') || env('MAIL_TO');
  if (notifyTo) {
    try {
      await transport.sendMail({
        from: `WeFundCo <${from}>`,
        to: notifyTo,
        replyTo: REPLY_TO,
        subject: `New waitlist signup: ${entry.email}`,
        html: waitlistAdminEmail({
          email: entry.email,
          role: entry.role,
          source: entry.source,
          page: entry.page,
          createdAt
        }),
        attachments: [logoAttachment]
      });
    } catch (err) {
      console.error('[WeFundCo] admin notify email failed:', err);
    }
  }

  return { sent: true };
}

module.exports = { sendWaitlistEmails, smtpConfigured };
