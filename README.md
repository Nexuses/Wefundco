# WeFundCo

Marketing site plus waitlist, SMTP, and `/admin`. The live homepage is `startups.html` (Vercel rewrites `/` → `/startups`).

```bash
cp .env.example .env
npm install
npm test
npm run dev
```

Admin: `http://localhost:3000/admin`.

## Email tracking

Every guest-facing email mints a unique token before send and stores a row in `emailSends`.

- Waitlist thank-you: the Circle button goes through `/r/{token}?next=circle`, then redirects to WhatsApp.
- Attendance / RSVP (admin **RSVP** button): the email’s **Yes, I'll be attending** button is `/r/{token}`.
- Clicks are stored on that send (`clickedAt`, `lastClickedAt`, `clickCount`). The admin Confirmation column names the matching send as the first / second / third email, and shows a reconfirm line if they click a later send.
- Older clicks with no token stay structured (clicked time + candidate send times) instead of “can’t tell which”.

Set `EVENT_NAME` if attendance emails should name a specific event.
