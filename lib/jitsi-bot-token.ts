import { createJitsiJwt } from './jitsi-jwt';
import { normalizeJitsiRoomName } from './jitsi-room';

export function createJitsiBotToken(meetingId: string, botName = 'Melanam Live Captions Bot') {
  const secret = process.env.JITSI_JWT_SECRET;

  if (!secret) {
    return null;
  }

  const domain = (process.env.NEXT_PUBLIC_JITSI_DOMAIN || 'meet.jit.si')
    .replace(/^https?:\/\//, '')
    .trim();
  const issuer = process.env.JITSI_JWT_ISSUER || 'melanam';
  const roomName = normalizeJitsiRoomName(meetingId);

  return createJitsiJwt({
    roomName,
    domain,
    user: {
      id: `bot:${meetingId}`,
      name: botName,
    },
    secret,
    issuer,
    moderator: false,
    ttlSeconds: 60 * 60 * 6,
  });
}
