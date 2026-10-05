const test = require('node:test');
const assert = require('node:assert/strict');
const { emailOrdinal, formatIst, buildConfirmationView } = require('../lib/confirmation');
const { mintToken } = require('../lib/tracking');

test('mints a unique opaque token per send', () => {
  const tokens = new Set(Array.from({ length: 40 }, () => mintToken()));
  assert.equal(tokens.size, 40);
  for (const token of tokens) {
    assert.match(token, /^[A-Za-z0-9_-]+$/);
    assert.ok(token.length >= 24);
  }
});

test('labels 1st / 2nd / 3rd emails in words, then numeric ordinals', () => {
  assert.equal(emailOrdinal(1), 'first email');
  assert.equal(emailOrdinal(2), 'second email');
  assert.equal(emailOrdinal(3), 'third email');
  assert.equal(emailOrdinal(11), '11th email');
  assert.equal(emailOrdinal(21), '21st email');
});

test('formats click and send times in IST', () => {
  const formatted = formatIst('2026-09-17T07:14:00.000Z');
  assert.match(formatted, /17 Sept 2026, 12:44 pm/);
});

test('new unique click names the matching send', () => {
  const view = buildConfirmationView({
    sends: [
      {
        token: 'aaa',
        sendIndex: 1,
        sentAt: '2026-09-17T07:14:00.000Z',
        clickedAt: '2026-09-17T07:20:00.000Z'
      },
      {
        token: 'bbb',
        sendIndex: 2,
        sentAt: '2026-09-17T07:16:00.000Z',
        clickedAt: null
      }
    ]
  });

  assert.equal(view.status, 'confirmed');
  assert.equal(view.confirmedSendIndex, 1);
  assert.deepEqual(view.lines.map((line) => line.text), [
    'Confirmed',
    'Clicked 17 Sept 2026, 12:50 pm',
    'First email · sent 17 Sept 2026, 12:44 pm'
  ]);
});

test('reconfirm on a later send keeps the first click and names the later email', () => {
  const view = buildConfirmationView({
    sends: [
      {
        token: 'aaa',
        sendIndex: 1,
        sentAt: '2026-09-17T07:14:00.000Z',
        clickedAt: '2026-09-17T07:20:00.000Z'
      },
      {
        token: 'bbb',
        sendIndex: 2,
        sentAt: '2026-09-17T07:16:00.000Z',
        clickedAt: '2026-09-17T07:30:00.000Z'
      },
      {
        token: 'ccc',
        sendIndex: 3,
        sentAt: '2026-09-17T08:00:00.000Z',
        clickedAt: null
      }
    ]
  });

  assert.equal(view.status, 'reconfirmed');
  assert.equal(view.confirmedSendIndex, 1);
  assert.equal(view.reconfirmedSendIndex, 2);
  assert.deepEqual(view.lines.map((line) => line.text), [
    'Confirmed',
    'Clicked 17 Sept 2026, 12:50 pm',
    'First email · sent 17 Sept 2026, 12:44 pm',
    'Reconfirmed',
    'On the second email · sent 17 Sept 2026, 12:46 pm',
    'Clicked 17 Sept 2026, 1:00 pm'
  ]);
});

test('ambiguous / old clicks list the candidate sends instead of “can’t tell which”', () => {
  const view = buildConfirmationView({
    sends: [
      { sendIndex: 1, sentAt: '2026-09-17T07:14:00.000Z', token: '' },
      { sendIndex: 2, sentAt: '2026-09-17T07:16:00.000Z', token: '' }
    ],
    legacyClickedAt: '2026-09-17T07:22:00.000Z',
    legacyAction: "Yes, I'll be attending"
  });

  assert.equal(view.status, 'ambiguous');
  assert.equal(view.lines[0].text, 'Confirmed');
  assert.equal(view.lines[1].text, 'Clicked 17 Sept 2026, 12:52 pm');
  assert.equal(view.lines[2].text, "Action: Yes, I'll be attending");
  assert.match(view.lines[3].text, /first email \(sent 17 Sept 2026, 12:44 pm\)/);
  assert.match(view.lines[3].text, /second email \(sent 17 Sept 2026, 12:46 pm\)/);
  assert.doesNotMatch(view.lines.map((line) => line.text).join(' '), /can't tell which/i);
  assert.doesNotMatch(view.lines.map((line) => line.text).join(' '), /Can't confirm/i);
});
