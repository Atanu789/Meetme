const DEFAULT_MEETING_AI_PORT = 4010;

function trimTrailingSlash(value: string): string {
  return String(value || '').replace(/\/+$/, '');
}

function toHttpUrl(value: string): string {
  const trimmed = trimTrailingSlash(value);

  if (/^https?:\/\//i.test(trimmed)) {
    return trimmed;
  }

  if (/^wss?:\/\//i.test(trimmed)) {
    return trimmed
      .replace(/^wss?:/i, (protocol) => (protocol.toLowerCase().startsWith('wss') ? 'https:' : 'http:'))
      .replace(/\/ws$/i, '');
  }

  return trimmed;
}

function toWsBaseUrl(value: string): string {
  const trimmed = trimTrailingSlash(value);

  if (/^wss?:\/\//i.test(trimmed)) {
    return trimmed.endsWith('/ws') ? trimmed : `${trimmed}/ws`;
  }

  if (/^https?:\/\//i.test(trimmed)) {
    const wsBase = trimmed.replace(/^https?:/i, (protocol) => (protocol.toLowerCase().startsWith('https') ? 'wss:' : 'ws:'));
    return wsBase.endsWith('/ws') ? wsBase : `${wsBase}/ws`;
  }

  return trimmed.endsWith('/ws') ? trimmed : `${trimmed}/ws`;
}

function appendMeetingPath(baseUrl: string, meetingId: string): string {
  return `${trimTrailingSlash(baseUrl)}/${encodeURIComponent(meetingId)}`;
}

export function resolveMeetingAiSocketUrl(meetingId: string): string {
  const configuredSocketUrl = process.env.NEXT_PUBLIC_MEETING_AI_WS_URL?.trim();
  if (configuredSocketUrl) {
    return appendMeetingPath(toWsBaseUrl(configuredSocketUrl), meetingId);
  }

  const configuredControlUrl = process.env.NEXT_PUBLIC_MEETING_AI_CONTROL_URL?.trim();
  if (configuredControlUrl) {
    return appendMeetingPath(toWsBaseUrl(configuredControlUrl), meetingId);
  }

  if (typeof window === 'undefined') {
    return '';
  }

  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  return `${protocol}//${window.location.hostname}:${DEFAULT_MEETING_AI_PORT}/ws/${encodeURIComponent(meetingId)}`;
}

export function resolveMeetingAiHttpUrl(): string {
  const configuredControlUrl = process.env.NEXT_PUBLIC_MEETING_AI_CONTROL_URL?.trim();
  if (configuredControlUrl) {
    return toHttpUrl(configuredControlUrl);
  }

  const configuredSocketUrl = process.env.NEXT_PUBLIC_MEETING_AI_WS_URL?.trim();
  if (configuredSocketUrl) {
    return toHttpUrl(configuredSocketUrl);
  }

  if (typeof window === 'undefined') {
    return `http://localhost:${DEFAULT_MEETING_AI_PORT}`;
  }

  const protocol = window.location.protocol === 'https:' ? 'https:' : 'http:';
  return `${protocol}//${window.location.hostname}:${DEFAULT_MEETING_AI_PORT}`;
}