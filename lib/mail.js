const nodemailer = require('nodemailer');
const {
  LOGO_URL,
  waitlistThankYouEmail,
  waitlistThankYouText,
  waitlistAdminEmail,
  onboardingThankYouEmail,
  onboardingThankYouText,
  onboardingAdminEmail
} = require('./templates');
const { openFileStream, fileMeta } = require('./onboarding-store');

const REPLY_TO = 'investments@wefundco.com';
/** Keep under SES ~10MB raw message limit */
const MAX_ATTACH_TOTAL_BYTES = 8 * 1024 * 1024;

function env(name, fallback = '') {
  const value = process.env[name];
  if (value == null || value === '') return fallback;
  return value;
}

function smtpConfigured() {
  return Boolean(env('SMTP_HOST') && env('SMTP_USER') && env('SMTP_PASS') && env('FROM_EMAIL'));
}

function publicSiteUrl() {
  const url = env('SITE_URL', 'https://www.wefundco.com').replace(/\/$/, '');
  if (/localhost|127\.0\.0\.1/.test(url)) return 'https://www.wefundco.com';
  return url || 'https://www.wefundco.com';
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

function formatIst(dateValue) {
  const d = dateValue ? new Date(dateValue) : new Date();
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleString('en-IN', {
    timeZone: 'Asia/Kolkata',
    dateStyle: 'medium',
    timeStyle: 'short'
  });
}

async function streamToBuffer(stream) {
  const chunks = [];
  for await (const chunk of stream) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }
  return Buffer.concat(chunks);
}

async function buildOnboardingAttachments(files) {
  const list = Array.isArray(files) ? files : [];
  const attachments = [];
  const listed = [];
  let total = 0;

  for (const entry of list) {
    const meta = fileMeta(entry);
    if (!meta || !meta.url) continue;
    listed.push({ name: meta.name, fieldId: meta.fieldId, url: meta.url });

    try {
      const opened = await openFileStream(meta.url);
      if (!opened || !opened.stream) continue;
      const content = await streamToBuffer(opened.stream);
      if (!content.length) continue;
      if (total + content.length > MAX_ATTACH_TOTAL_BYTES) {
        console.warn('[WeFundCo] skipping attachment (size cap):', meta.name);
        continue;
      }
      total += content.length;
      attachments.push({
        filename: meta.name || opened.meta.filename || 'upload',
        content,
        contentType: opened.meta.contentType || 'application/octet-stream'
      });
    } catch (err) {
      console.error('[WeFundCo] could not attach onboarding file:', meta.name, err.message || err);
    }
  }

  return { attachments, listed };
}

async function sendMail({ to, subject, text, html, attachments }) {
  if (!smtpConfigured()) {
    console.warn('[WeFundCo] SMTP is not fully configured — skipped email send.');
    return { sent: false, skipped: true };
  }

  const from = env('FROM_EMAIL');
  const transport = createTransport();
  const info = await transport.sendMail({
    from: `WeFundCo <${from}>`,
    to,
    replyTo: REPLY_TO,
    subject,
    text,
    html,
    attachments: attachments && attachments.length ? attachments : undefined
  });
  return { sent: true, messageId: info.messageId || '' };
}

async function sendWaitlistEmails(entry) {
  if (!smtpConfigured()) {
    console.warn('[WeFundCo] SMTP is not fully configured — skipped email send.');
    return { sent: false, skipped: true };
  }

  const siteUrl = publicSiteUrl();
  const createdAt = formatIst(entry.createdAt);

  try {
    const result = await sendMail({
      to: entry.email,
      subject: "You're on the WeFundCo waitlist",
      text: waitlistThankYouText(),
      html: waitlistThankYouEmail({
        siteUrl,
        logoSrc: LOGO_URL
      })
    });
    console.log('[WeFundCo] waitlist thank-you sent to', entry.email, result.messageId || '');
  } catch (err) {
    console.error('[WeFundCo] waitlist thank-you failed:', err);
    throw err;
  }

  const notifyTo = env('Mail_To') || env('MAIL_TO');
  if (notifyTo) {
    try {
      await sendMail({
        to: notifyTo,
        subject: `New waitlist signup: ${entry.email}`,
        text: `New waitlist signup\nEmail: ${entry.email}\nRole: ${entry.role || ''}\nTime: ${createdAt}`,
        html: waitlistAdminEmail({
          email: entry.email,
          role: entry.role,
          source: entry.source,
          page: entry.page,
          createdAt,
          siteUrl,
          logoSrc: LOGO_URL
        })
      });
    } catch (err) {
      console.error('[WeFundCo] waitlist admin notify failed:', err);
    }
  }

  return { sent: true };
}

async function sendOnboardingEmails(submission) {
  if (!smtpConfigured()) {
    console.warn('[WeFundCo] SMTP is not fully configured — skipped onboarding email.');
    return { sent: false, skipped: true };
  }

  const siteUrl = publicSiteUrl();
  const email = String(submission.contactEmail || '').trim().toLowerCase();
  const name = String(submission.contactName || '').trim();
  const role = submission.role || '';
  const phone = submission.contactPhone || '';
  const createdAt = formatIst(submission.updatedAt || submission.createdAt);
  const { attachments, listed } = await buildOnboardingAttachments(submission.files || []);

  if (email) {
    try {
      const result = await sendMail({
        to: email,
        subject: 'We received your WeFundCo submission',
        text: onboardingThankYouText({ name, role, files: listed }),
        html: onboardingThankYouEmail({
          siteUrl,
          logoSrc: LOGO_URL,
          name,
          role,
          files: listed
        }),
        attachments
      });
      console.log(
        '[WeFundCo] onboarding thank-you sent to',
        email,
        `(${attachments.length} attachments)`,
        result.messageId || ''
      );
    } catch (err) {
      console.error('[WeFundCo] onboarding thank-you failed:', err);
      throw err;
    }
  }

  const notifyTo = env('Mail_To') || env('MAIL_TO');
  if (notifyTo) {
    try {
      await sendMail({
        to: notifyTo,
        subject: `New onboarding submission: ${email || name || 'unknown'}`,
        text: [
          'New onboarding submission',
          `Name: ${name}`,
          `Email: ${email}`,
          `Role: ${role}`,
          `Files: ${listed.length}`,
          ...listed.map((f) => `- ${f.name}`),
          `Time: ${createdAt}`
        ].join('\n'),
        html: onboardingAdminEmail({
          email,
          name,
          role,
          phone,
          status: submission.status || 'complete',
          createdAt,
          siteUrl,
          logoSrc: LOGO_URL,
          files: listed
        }),
        attachments
      });
      console.log(
        '[WeFundCo] onboarding admin notify sent with',
        attachments.length,
        'attachments'
      );
    } catch (err) {
      console.error('[WeFundCo] onboarding admin notify failed:', err);
    }
  }

  return { sent: true, attachmentCount: attachments.length };
}

module.exports = {
  sendWaitlistEmails,
  sendOnboardingEmails,
  smtpConfigured,
  createTransport,
  publicSiteUrl
};
