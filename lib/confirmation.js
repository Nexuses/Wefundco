const ORDINAL_WORDS = [
  'first',
  'second',
  'third',
  'fourth',
  'fifth',
  'sixth',
  'seventh',
  'eighth',
  'ninth',
  'tenth'
];

function emailOrdinal(n) {
  const index = Number(n);
  if (!Number.isInteger(index) || index < 1) return 'an email';
  if (index <= ORDINAL_WORDS.length) return `${ORDINAL_WORDS[index - 1]} email`;
  const mod100 = index % 100;
  const mod10 = index % 10;
  let suffix = 'th';
  if (mod100 < 11 || mod100 > 13) {
    if (mod10 === 1) suffix = 'st';
    else if (mod10 === 2) suffix = 'nd';
    else if (mod10 === 3) suffix = 'rd';
  }
  return `${index}${suffix} email`;
}

function capitalize(value) {
  const text = String(value || '');
  if (!text) return '';
  return text.charAt(0).toUpperCase() + text.slice(1);
}

function formatIst(value) {
  if (!value) return '';
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return '';

  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Asia/Kolkata',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  }).formatToParts(date);

  const pick = (type) => {
    const part = parts.find((item) => item.type === type);
    return part ? part.value : '';
  };

  const day = pick('day');
  const month = pick('month');
  const year = pick('year');
  const hour = pick('hour');
  const minute = pick('minute');
  const dayPeriod = pick('dayPeriod').toLowerCase().replace(/\./g, '');

  return `${day} ${month} ${year}, ${hour}:${minute} ${dayPeriod}`;
}

function sortSends(sends) {
  return [...(sends || [])].sort((a, b) => {
    const sentDiff = new Date(a.sentAt) - new Date(b.sentAt);
    if (sentDiff !== 0) return sentDiff;
    return Number(a.sendIndex || 0) - Number(b.sendIndex || 0);
  });
}

function hasUniqueToken(send) {
  return Boolean(send && send.token && !send.ambiguous);
}

function candidateSendSummary(sends) {
  return sortSends(sends)
    .map((send) => `${emailOrdinal(send.sendIndex)} (sent ${formatIst(send.sentAt)})`)
    .join(' or ');
}

function buildConfirmationView({
  sends = [],
  legacyClickedAt = null,
  legacyAction = ''
} = {}) {
  const ordered = sortSends(sends);
  const clicked = ordered.filter((send) => send.clickedAt);
  const action = String(legacyAction || '').trim();

  if (!clicked.length && !legacyClickedAt) {
    return {
      status: 'none',
      sendCount: ordered.length,
      lines: []
    };
  }

  if (!clicked.length && legacyClickedAt) {
    const lines = [
      { kind: 'status', text: 'Confirmed' },
      { kind: 'detail', text: `Clicked ${formatIst(legacyClickedAt)}` }
    ];
    if (action) {
      lines.push({ kind: 'detail', text: `Action: ${action}` });
    }
    if (ordered.length >= 2) {
      lines.push({
        kind: 'meta',
        text: `This click is not tied to a unique send link, so it could be the ${candidateSendSummary(ordered)}.`
      });
    } else if (ordered.length === 1) {
      lines.push({
        kind: 'meta',
        text: `Likely the ${emailOrdinal(ordered[0].sendIndex)} · sent ${formatIst(ordered[0].sentAt)}. The click was not stored against a unique link.`
      });
    } else {
      lines.push({
        kind: 'meta',
        text: 'This click used a link that was not unique to one send, so the matching email cannot be identified.'
      });
    }
    return {
      status: 'ambiguous',
      firstClickedAt: legacyClickedAt,
      sendCount: ordered.length,
      lines
    };
  }

  const first = clicked.reduce((earliest, send) => (
    new Date(send.clickedAt) < new Date(earliest.clickedAt) ? send : earliest
  ));
  const uniqueFirst = hasUniqueToken(first);
  const laterReconfirm = clicked
    .filter((send) => (
      hasUniqueToken(send)
      && send.token !== first.token
      && new Date(send.sentAt) > new Date(first.sentAt)
    ))
    .sort((a, b) => new Date(b.clickedAt) - new Date(a.clickedAt))[0];

  if (!uniqueFirst) {
    const lines = [
      { kind: 'status', text: 'Confirmed' },
      { kind: 'detail', text: `Clicked ${formatIst(first.clickedAt)}` }
    ];
    if (action) {
      lines.push({ kind: 'detail', text: `Action: ${action}` });
    }
    if (ordered.length >= 2) {
      lines.push({
        kind: 'meta',
        text: `This click is not tied to a unique send link, so it could be the ${candidateSendSummary(ordered)}.`
      });
    } else {
      lines.push({
        kind: 'meta',
        text: 'This click used a link that was not unique to one send, so the matching email cannot be identified.'
      });
    }
    return {
      status: 'ambiguous',
      firstClickedAt: first.clickedAt,
      sendCount: ordered.length,
      lines
    };
  }

  const lines = [
    { kind: 'status', text: 'Confirmed' },
    { kind: 'detail', text: `Clicked ${formatIst(first.clickedAt)}` },
    {
      kind: 'meta',
      text: `${capitalize(emailOrdinal(first.sendIndex))} · sent ${formatIst(first.sentAt)}`
    }
  ];

  if (laterReconfirm) {
    lines.push(
      { kind: 'status', text: 'Reconfirmed' },
      {
        kind: 'detail',
        text: `On the ${emailOrdinal(laterReconfirm.sendIndex)} · sent ${formatIst(laterReconfirm.sentAt)}`
      },
      { kind: 'meta', text: `Clicked ${formatIst(laterReconfirm.clickedAt)}` }
    );
    return {
      status: 'reconfirmed',
      firstClickedAt: first.clickedAt,
      reconfirmedAt: laterReconfirm.clickedAt,
      confirmedSendIndex: first.sendIndex,
      reconfirmedSendIndex: laterReconfirm.sendIndex,
      sendCount: ordered.length,
      lines
    };
  }

  return {
    status: 'confirmed',
    firstClickedAt: first.clickedAt,
    confirmedSendIndex: first.sendIndex,
    sendCount: ordered.length,
    lines
  };
}

module.exports = {
  emailOrdinal,
  capitalize,
  formatIst,
  buildConfirmationView
};
