const DEFAULT_MEETING_AI_PORT = 4010;

function getWindowLocationBase(): { protocol: 'http:' | 'https:'; hostname: string } | null {
  if (typeof window === 'undefined') {
    return null;
  }

  return {
    protocol: window.location.protocol === 'https:' ? 'https:' : 'http:',
    hostname: window.location.hostname,
  };
}

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

function buildDefaultMeetingAiSocketUrl(meetingId: string): string {
  const locationBase = getWindowLocationBase();

  if (!locationBase) {
    return '';
  }

  const protocol = locationBase.protocol === 'https:' ? 'wss:' : 'ws:';
  return `${protocol}//${locationBase.hostname}:${DEFAULT_MEETING_AI_PORT}/ws/${encodeURIComponent(meetingId)}`;
}

function buildDefaultMeetingAiHttpUrl(): string {
  const locationBase = getWindowLocationBase();

  if (!locationBase) {
    return `http://localhost:${DEFAULT_MEETING_AI_PORT}`;
  }

  return `${locationBase.protocol}//${locationBase.hostname}:${DEFAULT_MEETING_AI_PORT}`;
}

function uniqueNonEmpty(values: Array<string | null | undefined>): string[] {
  const seen = new Set<string>();

  for (const value of values) {
    const normalized = String(value || '').trim();
    if (!normalized || seen.has(normalized)) {
      continue;
    }

    seen.add(normalized);
  }

  return Array.from(seen);
}

export function resolveMeetingAiSocketUrls(meetingId: string): string[] {
  const configuredSocketUrl = process.env.NEXT_PUBLIC_MEETING_AI_WS_URL?.trim();
  const configuredControlUrl = process.env.NEXT_PUBLIC_MEETING_AI_CONTROL_URL?.trim();

  const candidates = uniqueNonEmpty([
    configuredSocketUrl ? appendMeetingPath(toWsBaseUrl(configuredSocketUrl), meetingId) : null,
    configuredControlUrl ? appendMeetingPath(toWsBaseUrl(configuredControlUrl), meetingId) : null,
    buildDefaultMeetingAiSocketUrl(meetingId),
  ]);

  return candidates;
}

export function resolveMeetingAiSocketUrl(meetingId: string): string {
  return resolveMeetingAiSocketUrls(meetingId)[0] || '';
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

  return buildDefaultMeetingAiHttpUrl();
}