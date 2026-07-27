import type { StudioSource } from './types';

const YOUTUBE_HOSTS = new Set(['youtube.com', 'www.youtube.com', 'm.youtube.com', 'youtu.be', 'www.youtu.be']);
const VIMEO_HOSTS = new Set(['vimeo.com', 'www.vimeo.com', 'player.vimeo.com']);
const LOOM_HOSTS = new Set(['loom.com', 'www.loom.com']);
const GOOGLE_DRIVE_HOSTS = new Set(['drive.google.com']);
const VIDEO_EXTENSIONS = /\.(mp4|mov|webm|mpeg|mpg|avi|wmv|3gp)(?:$|[?#])/i;
const URL_PATTERN = /https?:\/\/[^\s<>()]+/i;

export class StudioSourceError extends Error {
  constructor(message: string, public readonly code: string, public readonly status = 400) {
    super(message);
    this.name = 'StudioSourceError';
  }
}

export function parseStudioSource(input: string): StudioSource {
  const value = input.trim();
  if (!value) throw new StudioSourceError('Enter a topic or paste a public video URL.', 'SOURCE_REQUIRED');
  if (value.length > 12_000) throw new StudioSourceError('Source text must be 12,000 characters or fewer.', 'SOURCE_TOO_LARGE');

  const match = value.match(URL_PATTERN);
  if (!match) return { kind: 'prompt', value, providerLabel: 'Prompt' };
  if (match[0] !== value) {
    throw new StudioSourceError('Paste one URL by itself, or enter a text-only prompt.', 'AMBIGUOUS_SOURCE');
  }

  let url: URL;
  try {
    url = new URL(value);
  } catch {
    throw new StudioSourceError('Enter a valid HTTPS URL.', 'INVALID_URL');
  }

  if (url.protocol !== 'https:') {
    throw new StudioSourceError('Only HTTPS video URLs are accepted.', 'INSECURE_URL');
  }

  const host = url.hostname.toLowerCase();
  if (YOUTUBE_HOSTS.has(host)) return { kind: 'youtube', value, url: url.toString(), providerLabel: 'YouTube' };
  if (VIMEO_HOSTS.has(host)) return { kind: 'vimeo', value, url: url.toString(), providerLabel: 'Vimeo' };
  if (LOOM_HOSTS.has(host)) return { kind: 'loom', value, url: url.toString(), providerLabel: 'Loom' };
  if (GOOGLE_DRIVE_HOSTS.has(host)) return { kind: 'google-drive', value, url: url.toString(), providerLabel: 'Google Drive' };
  if (VIDEO_EXTENSIONS.test(url.pathname)) return { kind: 'public-video', value, url: url.toString(), providerLabel: 'Public video' };

  throw new StudioSourceError(
    'This URL is not a supported video source. Use a public YouTube URL or enter a topic prompt.',
    'UNSUPPORTED_URL'
  );
}
