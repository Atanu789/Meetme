'use strict';

const crypto = require('crypto');

function base64Url(input) {
  const buffer = Buffer.isBuffer(input) ? input : Buffer.from(String(input));

  return buffer
    .toString('base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');
}

function createJitsiBotToken({ meetingId, botName, domain, secret, issuer }) {
  const roomName = String(meetingId || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9-_]/g, '');
  const now = Math.floor(Date.now() / 1000);
  const header = { alg: 'HS256', typ: 'JWT' };
  const payload = {
    aud: 'jitsi',
    iss: issuer || 'melanam',
    sub: domain,
    room: roomName,
    exp: now + (60 * 60 * 6),
    nbf: now - 10,
    context: {
      user: {
        id: `bot:${meetingId}`,
        name: botName,
      },
    },
    moderator: false,
  };

  const encodedHeader = base64Url(JSON.stringify(header));
  const encodedPayload = base64Url(JSON.stringify(payload));
  const signature = crypto
    .createHmac('sha256', secret)
    .update(`${encodedHeader}.${encodedPayload}`)
    .digest();

  return `${encodedHeader}.${encodedPayload}.${base64Url(signature)}`;
}

module.exports = {
  createJitsiBotToken,
};
