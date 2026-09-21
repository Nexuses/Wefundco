const path = require('path');
const nodemailer = require('nodemailer');
const {
  waitlistThankYouEmail,
  waitlistThankYouText,
  waitlistAdminEmail,
  eventRsvpEmail,
  eventRsvpText,
  CIRCLE_WHATSAPP_URL
} = require('./templates');
const { createEmailSend, markSendFailed, trackingUrl } = require('./tracking');

const LOGO_PATH = path.join(__dirname, '..', 'Assets', 'Wefundco-white.png');
const REPLY_TO = 'investments@wefundco.com';
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

function eventName() {
  return env('EVENT_NAME', 'the next WeFundCo event');
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

async function sendTrackedGuestEmail(db, entry, kind) {
  if (!smtpConfigured()) {
    console.warn('[WeFundCo] SMTP is not fully configured — skipped email send.');
    return { sent: false, skipped: true };
  }

  const from = env('FROM_EMAIL');
  const siteUrl = publicSiteUrl();
  const transport = createTransport();
  const send = await createEmailSend(db, {
    email: entry.email,
    waitlistId: entry._id || null,
    kind
  });

  const link = kind === 'waitlist_thankyou'
    ? trackingUrl(siteUrl, send.token, 'circle')
    : trackingUrl(siteUrl, send.token);

  try {
    if (kind === 'event_rsvp') {
      await transport.sendMail({
        from: `WeFundCo <${from}>`,
        to: entry.email,
        replyTo: REPLY_TO,
        subject: `Can you make it? Confirm your attendance — ${eventName()}`,
        text: eventRsvpText({ trackingUrl: link, eventName: eventName() }),
        html: eventRsvpEmail({
          siteUrl,
          trackingUrl: link,
          eventName: eventName()
        }),
        attachments: [logoAttachment]
      });
    } else {
      await transport.sendMail({
        from: `WeFundCo <${from}>`,
        to: entry.email,
        replyTo: REPLY_TO,
        subject: "You're on the WeFundCo waitlist",
        text: waitlistThankYouText({ trackingUrl: link }),
        html: waitlistThankYouEmail({
          siteUrl,
          trackingUrl: link
        }),
        attachments: [logoAttachment]
      });
    }
    console.log('[WeFundCo] email sent to', entry.email, kind, send.token);
    return { sent: true, send };
  } catch (err) {
    await markSendFailed(db, send.token).catch(() => {});
    console.error('[WeFundCo] guest email failed:', err);
    throw err;
  }
}

async function sendWaitlistEmails(db, entry) {
  const result = await sendTrackedGuestEmail(db, entry, 'waitlist_thankyou');

  const notifyTo = env('Mail_To') || env('MAIL_TO');
  if (notifyTo && smtpConfigured()) {
    const from = env('FROM_EMAIL');
    const transport = createTransport();
    const createdAt = new Date(entry.createdAt).toLocaleString('en-IN', {
      timeZone: 'Asia/Kolkata',
      dateStyle: 'medium',
      timeStyle: 'short'
    });
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

  return result;
}

module.exports = {
  sendWaitlistEmails,
  sendTrackedGuestEmail,
  smtpConfigured,
  publicSiteUrl,
  eventName,
  CIRCLE_WHATSAPP_URL
};
