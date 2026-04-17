'use client';

import { useEffect, useRef, useState } from 'react';

const DEFAULT_TOOLBAR_BUTTONS = [
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
];

declare global {
  interface Window {
    JitsiMeetExternalAPI: any;
  }
}

export interface JitsiMeetingProps {
  /** Meeting room identifier */
  roomName: string;
  /** User display name - defaults to "Guest" */
  displayName?: string;
  /** User email address - optional */
  userEmail?: string;
  /** Custom domain for self-hosted Jitsi - defaults to NEXT_PUBLIC_JITSI_DOMAIN env var */
  domain?: string;
  /** Callback when meeting is ready */
  onReady?: () => void;
  /** Callback when user leaves the meeting */
  onReadyToClose?: () => void;
  /** Start audio muted - defaults to false */
  startWithAudioMuted?: boolean;
  /** Start video muted - defaults to false */
  startWithVideoMuted?: boolean;
  /** Show prejoin page - defaults to false */
  prejoinPageEnabled?: boolean;
  /** Custom toolbar buttons to display */
  toolbarButtons?: string[];
  /** Optional JWT for private rooms */
  jwt?: string;
  /** Callback when the Jitsi API instance is ready */
  onApiReady?: (api: any) => void;
  /** Enable custom styling */
  showLogo?: boolean;
  /** Container height - defaults to 100% */
  height?: string;
  /** Custom CSS class for container */
  className?: string;
}

/**
 * JitsiMeeting Component
 * 
 * Embeds a Jitsi Meet video conference in your React/Next.js application.
 * Supports both public (meet.jit.si) and self-hosted Jitsi servers.
 * 
 * @example
 * ```tsx
 * <JitsiMeeting
 *   roomName="my-meeting-room"
 *   displayName="John Doe"
 *   userEmail="john@example.com"
 *   domain="meet.melanam.com"
 *   onReadyToClose={() => router.push('/dashboard')}
 * />
 * ```
 */
export function JitsiMeeting({
  roomName,
  displayName = 'Guest',
  userEmail,
  domain,
  onReady,
  onReadyToClose,
  startWithAudioMuted = false,
  startWithVideoMuted = false,
  prejoinPageEnabled = false,
  toolbarButtons = DEFAULT_TOOLBAR_BUTTONS,
  jwt,
  onApiReady,
  showLogo = false,
  height = '100%',
  className = '',
}: JitsiMeetingProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const jitsiRef = useRef<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [scriptLoading, setScriptLoading] = useState(true);
  const scriptTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const hasRetriedRef = useRef(false);
  const onReadyRef = useRef(onReady);
  const onReadyToCloseRef = useRef(onReadyToClose);

  useEffect(() => {
    onReadyRef.current = onReady;
  }, [onReady]);

  useEffect(() => {
    onReadyToCloseRef.current = onReadyToClose;
  }, [onReadyToClose]);

  // Get domain from prop or environment variable
  const { domain: cleanDomain, explicitProtocol, preferredProtocol } = (() => {
    const domainInput =
      domain ||
      process.env.NEXT_PUBLIC_JITSI_DOMAIN ||
      'meet.jit.si';

    const normalized = domainInput.trim();

    if (normalized.startsWith('http://')) {
      return {
        domain: normalized.replace('http://', '').trim(),
        explicitProtocol: 'http' as const,
        preferredProtocol: 'http' as const,
      };
    }

    if (normalized.startsWith('https://')) {
      return {
        domain: normalized.replace('https://', '').trim(),
        explicitProtocol: 'https' as const,
        preferredProtocol: 'https' as const,
      };
    }

    // No protocol in env/domain input: use HTTPS first for self-hosted domains.
    return {
      domain: normalized,
      explicitProtocol: null,
      preferredProtocol: 'https' as const,
    };
  })();

  const [activeProtocol, setActiveProtocol] = useState<'http' | 'https'>(preferredProtocol);

  useEffect(() => {
    setActiveProtocol(preferredProtocol);
    hasRetriedRef.current = false;
    setScriptLoading(true);
    setLoading(true);
    setError(null);
  }, [cleanDomain, preferredProtocol]);

  // Load Jitsi external API script
  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Check if script is already loaded
    if (window.JitsiMeetExternalAPI) {
      console.log('[Jitsi] API already loaded');
      setScriptLoading(false);
      return;
    }

    const script = document.createElement('script');
    script.src = `${activeProtocol}://${cleanDomain}/external_api.js`;
    script.async = true;

    console.log(`[Jitsi] Loading from ${activeProtocol}://${cleanDomain}/external_api.js`);
    setScriptLoading(true);

    // Set timeout for script loading (15 seconds)
    scriptTimeoutRef.current = setTimeout(() => {
      console.error(`[Jitsi] Load timeout from ${activeProtocol}://${cleanDomain}/external_api.js`);

      // If protocol was explicit in env, do not fallback automatically.
      if (!explicitProtocol && !hasRetriedRef.current) {
        hasRetriedRef.current = true;
        const fallbackProtocol: 'http' | 'https' =
          activeProtocol === 'https' ? 'http' : 'https';
        console.log(`[Jitsi] Trying fallback: ${fallbackProtocol}://${cleanDomain}`);
        setActiveProtocol(fallbackProtocol);
        return;
      }

      setScriptLoading(false);
      setError(
        `Cannot load from ${activeProtocol}://${cleanDomain}. Domain may be unreachable or incorrect.`
      );
    }, 15000);

    const handleLoad = () => {
      console.log(`[Jitsi] Successfully loaded from ${activeProtocol}://${cleanDomain}/external_api.js`);
      if (scriptTimeoutRef.current) clearTimeout(scriptTimeoutRef.current);
      setScriptLoading(false);
    };

    const handleError = () => {
      console.error(`[Jitsi] Load error from ${activeProtocol}://${cleanDomain}/external_api.js`);
      if (scriptTimeoutRef.current) clearTimeout(scriptTimeoutRef.current);

      if (!explicitProtocol && !hasRetriedRef.current) {
        hasRetriedRef.current = true;
        const fallbackProtocol: 'http' | 'https' =
          activeProtocol === 'https' ? 'http' : 'https';
        console.log(`[Jitsi] Fallback attempt: ${fallbackProtocol}://${cleanDomain}`);
        setActiveProtocol(fallbackProtocol);
        return;
      }

      setScriptLoading(false);
      setError(
        `Cannot reach ${cleanDomain} on http or https. Verify domain and network connectivity.`
      );
    };

    script.addEventListener('load', handleLoad);
    script.addEventListener('error', handleError);
    document.head.appendChild(script);

    return () => {
      script.removeEventListener('load', handleLoad);
      script.removeEventListener('error', handleError);
      if (scriptTimeoutRef.current) clearTimeout(scriptTimeoutRef.current);
      if (document.head.contains(script)) {
        document.head.removeChild(script);
      }
    };
  }, [activeProtocol, cleanDomain, explicitProtocol]);

  // Initialize Jitsi meeting
  useEffect(() => {
    if (scriptLoading || !containerRef.current || error) {
      console.log('JitsiMeeting: Waiting or error state', { scriptLoading, containerRef: !!containerRef.current, error });
      return;
    }

    if (!window.JitsiMeetExternalAPI) {
      console.error('JitsiMeeting: JitsiMeetExternalAPI not available on window');
      setError('Jitsi Meet API not available. The script may not have loaded properly.');
      return;
    }

    try {
      console.log('JitsiMeeting: Initializing with config', { 
        roomName, 
        displayName, 
        domain: cleanDomain,
        protocol: activeProtocol,
        containerExists: !!containerRef.current 
      });
      setLoading(true);

      const options = {
        roomName: roomName,
        parentNode: containerRef.current,
        width: '100%',
        height: height,
        ...(jwt ? { jwt } : {}),
        userInfo: {
          displayName: displayName,
          ...(userEmail && { email: userEmail }),
        },
        configOverwrite: {
          startWithAudioMuted: startWithAudioMuted,
          startWithVideoMuted: startWithVideoMuted,
          disableSimulcast: false,
          enableNoisyMicDetection: true,
          prejoinPageEnabled: prejoinPageEnabled,
          // Explicit endpoints for self-hosted deployments behind reverse proxy.
          bosh: `${activeProtocol}://${cleanDomain}/http-bind`,
          websocket: `${activeProtocol === 'https' ? 'wss' : 'ws'}://${cleanDomain}/xmpp-websocket`,
          openBridgeChannel: 'websocket',
          chromeExtensionBanner: null,
          disableAudioLevels: false,
          enableLayerSuspension: true,
          enableFeaturesBasedOnToken: Boolean(jwt),
          // Self-hosted Jitsi configuration
          enableWelcomePage: false,
          enableUserRolesBasedOnToken: Boolean(jwt),
        },
        interfaceConfigOverwrite: {
          TOOLBAR_BUTTONS: toolbarButtons,
          LANG_DETECTION: true,
          SHOW_CHROME_EXTENSION_BANNER: false,
          MOBILE_APP_PROMO: false,
          SHOW_POWERED_BY: showLogo,
          DEFAULT_REMOTE_DISPLAY_NAME: 'Fellow Jitsian',
          APP_NAME: 'Melanam',
        },
      };

      jitsiRef.current = new window.JitsiMeetExternalAPI(cleanDomain, options);
      onApiReady?.(jitsiRef.current);

      console.log('JitsiMeeting: API instance created successfully');
      // Unblock UI as soon as iframe API is mounted.
      setLoading(false);

      jitsiRef.current.addEventListener('videoConferenceJoined', () => {
        console.log('JitsiMeeting: Video conference joined');
        setLoading(false);
        onReadyRef.current?.();
      });

      jitsiRef.current.addEventListener('readyToClose', () => {
        console.log('Meeting ended');
        onReadyToCloseRef.current?.();
      });

      jitsiRef.current.addEventListener('participantJoined', (participant: any) => {
        console.log('Participant joined:', participant.getDisplayName());
      });

      jitsiRef.current.addEventListener('participantLeft', (participant: any) => {
        console.log('Participant left:', participant.getDisplayName());
      });

      jitsiRef.current.addEventListener('conferenceError', (error: any) => {
        console.error('Conference error:', error);
        setLoading(false);
        setError('Conference failed to start. Please refresh and try again.');
      });
    } catch (err) {
      console.error('Error initializing Jitsi Meeting:', err);
      setError('Failed to initialize video conference');
      setLoading(false);
    }

    return () => {
      if (jitsiRef.current) {
        try {
          jitsiRef.current.dispose();
        } catch (err) {
          console.error('Error disposing Jitsi:', err);
        }
      }
    };
  }, [
    scriptLoading,
    roomName,
    displayName,
    userEmail,
    cleanDomain,
    startWithAudioMuted,
    startWithVideoMuted,
    prejoinPageEnabled,
    toolbarButtons,
    error,
    height,
    showLogo,
    activeProtocol,
  ]);

  if (error) {
    return (
      <div
        className={`w-full flex items-center justify-center bg-gradient-to-br from-slate-900 to-slate-800 ${className}`}
        style={{ height }}
      >
        <div className="text-center px-4">
          <h3 className="text-lg font-semibold text-red-400 mb-2">Unable to Load Video Call</h3>
          <p className="text-gray-400 text-sm mb-4">{error}</p>
          <details className="text-left text-xs text-gray-500 bg-slate-800 rounded p-3 inline-block">
            <summary className="cursor-pointer font-semibold mb-2">Technical Details</summary>
            <p className="mb-1"><span className="text-gray-400">Domain:</span> {cleanDomain}</p>
            <p className="mb-1"><span className="text-gray-400">Protocol:</span> {activeProtocol}://</p>
            <p className="mb-1"><span className="text-gray-400">Room:</span> {roomName}</p>
            <p className="mt-2 text-gray-600">Attempting: {activeProtocol}://{cleanDomain}/external_api.js</p>
          </details>
        </div>
      </div>
    );
  }

  return (
    <div className={`relative ${className}`} style={{ height, width: '100%' }}>
      <div
        ref={containerRef}
        style={{ height: '100%', width: '100%' }}
      />

      {(scriptLoading || loading) && (
        <div className="absolute inset-0 z-20 w-full flex items-center justify-center bg-gradient-to-br from-slate-900 to-slate-800">
          <div className="text-center">
            <div className="inline-block">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mb-4"></div>
            </div>
            <p className="text-gray-300">
              {scriptLoading ? 'Loading video service...' : 'Joining meeting...'}
            </p>
            <p className="text-xs text-gray-500 mt-2">
              {cleanDomain !== 'meet.jit.si' ? `Using ${cleanDomain}` : 'Powered by Jitsi'}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

