/**
 * Jitsi Configuration Utilities
 * Helper functions for validating and managing Jitsi configuration
 */

export interface JitsiConfig {
  domain: string;
  protocol: 'http' | 'https';
  port?: number;
}

/**
 * Parse and validate Jitsi domain configuration
 * @param domain - Domain string (with or without protocol)
 * @returns Parsed configuration object
 */
export function parseJitsiDomain(domain: string): JitsiConfig {
  if (!domain) {
    return {
      domain: 'meet.jit.si',
      protocol: 'https',
    };
  }

  // Check for protocol
  let protocol: 'http' | 'https' = 'https';
  let cleanDomain = domain;

  if (domain.startsWith('http://')) {
    protocol = 'http';
    cleanDomain = domain.replace('http://', '');
  } else if (domain.startsWith('https://')) {
    protocol = 'https';
    cleanDomain = domain.replace('https://', '');
  }

  // Extract port if present
  const parts = cleanDomain.split(':');
  const domainOnly = parts[0];
  const port = parts[1] ? parseInt(parts[1], 10) : undefined;

  return {
    domain: domainOnly,
    protocol,
    port,
  };
}

/**
 * Build full Jitsi API URL
 * @param domain - Domain string
 * @returns Full API URL
 */
export function getJitsiApiUrl(domain: string): string {
  const config = parseJitsiDomain(domain);
  const protocol = config.protocol || 'https';
  const port = config.port ? `:${config.port}` : '';
  return `${protocol}://${config.domain}${port}/external_api.js`;
}

/**
 * Get the clean domain for Jitsi API initialization
 * (without protocol, just the domain)
 * @param domain - Domain string with or without protocol
 * @returns Clean domain
 */
export function getCleanDomain(domain: string): string {
  return parseJitsiDomain(domain).domain;
}

/**
 * Validate Jitsi domain accessibility
 * Attempts to fetch the external API to verify the domain is reachable
 * @param domain - Domain string
 * @returns Promise<boolean> - True if domain is accessible
 */
export async function validateJitsiDomain(domain: string): Promise<boolean> {
  try {
    const apiUrl = getJitsiApiUrl(domain);
    const response = await fetch(apiUrl, {
      method: 'HEAD',
      mode: 'no-cors',
      timeout: 5000,
    }).catch(() => ({ ok: false }));
    return response.ok || response.status === 0; // CORS requests may return 0
  } catch {
    return false;
  }
}

/**
 * Get recommended toolbar buttons based on use case
 */
export const TOOLBAR_PRESETS = {
  minimal: [
    'microphone',
    'camera',
    'hangup',
  ],
  
  standard: [
    'microphone',
    'camera',
    'desktop',
    'fullscreen',
    'hangup',
    'chat',
    'videoquality',
  ],
  
  full: [
    'microphone',
    'camera',
    'closedcaptions',
    'desktop',
    'fullscreen',
    'hangup',
    'chat',
    'recording',
    'settings',
    'raisehand',
    'videoquality',
    'tileview',
    'stats',
  ],
  
  host: [
    'microphone',
    'camera',
    'desktop',
    'fullscreen',
    'hangup',
    'chat',
    'recording',
    'livestream',
    'settings',
    'raisehand',
    'videoquality',
    'tileview',
    'stats',
  ],
};

/**
 * Get config overrides for different scenarios
 */
export const CONFIG_PRESETS = {
  development: {
    startWithAudioMuted: false,
    startWithVideoMuted: false,
    prejoinPageEnabled: false,
    enableNoisyMicDetection: true,
  },
  
  classroom: {
    startWithAudioMuted: true,
    startWithVideoMuted: false,
    prejoinPageEnabled: true,
    enableNoisyMicDetection: true,
  },
  
  webinar: {
    startWithAudioMuted: true,
    startWithVideoMuted: true,
    prejoinPageEnabled: true,
    enableNoisyMicDetection: false,
  },
  
  recording: {
    startWithAudioMuted: false,
    startWithVideoMuted: false,
    prejoinPageEnabled: false,
    enableNoisyMicDetection: true,
    disableSimulcast: false,
  },
};

/**
 * Generate meeting call summary
 */
export function generateMeetingSummary(
  roomName: string,
  domain: string,
  displayName: string
): string {
  const cleanDomain = getCleanDomain(domain);
  return `${cleanDomain}/${roomName} (${displayName})`;
}
