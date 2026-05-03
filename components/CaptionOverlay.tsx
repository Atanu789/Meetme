'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

/**
 * Caption data model matching Google Meet / Zoom
 */
type Caption = {
  id: string;
  speakerId: string;
  speakerName: string;
  text: string;
  isPartial: boolean;
  isFinal: boolean;
  createdAt: number;
  expiresAt?: number;
  opacity?: number;
};

type CaptionMessage = {
  type?: 'caption' | 'connected' | 'cleared';
  text?: string;
  speaker?: string;
  speakerId?: string;
  final?: boolean;
  timestamp?: number;
};

interface CaptionOverlayProps {
  meetingId: string;
  className?: string;
}

/**
 * Resolve WebSocket URL for caption service
 */
function resolveCaptionSocketUrl(meetingId: string): string {
  const configuredUrl = process.env.NEXT_PUBLIC_MEETING_AI_WS_URL?.trim();

  if (configuredUrl) {
    try {
      const normalized = configuredUrl.replace(/\/$/, '');
      const baseUrl = normalized.endsWith('/ws') ? normalized : `${normalized}/ws`;

      if (baseUrl.startsWith('ws://') || baseUrl.startsWith('wss://')) {
        return `${baseUrl}/${encodeURIComponent(meetingId)}`;
      }

      return `${baseUrl.replace(/^http/i, 'ws')}/${encodeURIComponent(meetingId)}`;
    } catch {
      // Fall through to default
    }
  }

  if (typeof window === 'undefined') return '';

  const isSecure = window.location.protocol === 'https:';
  const wsProtocol = isSecure ? 'wss:' : 'ws:';
  const hostname = window.location.hostname;
  
  return `${wsProtocol}//${hostname}:4010/ws/${encodeURIComponent(meetingId)}`;
}

/**
 * Caption reducer: implements Google Meet/Zoom behavior exactly
 * 
 * Rules:
 * - Max 2 captions visible (active + 1 previous final)
 * - Partial updates REPLACE same speaker's active caption
 * - New speaker creates new caption
 * - Final captions lock in queue, eventually removed
 */
function captionReducer(state: Caption[], action: any): Caption[] {
  const now = Date.now();

  // Remove expired captions
  let queue = state.filter(c => !c.expiresAt || c.expiresAt > now);

  switch (action.type) {
    case 'RECEIVE_CAPTION': {
      const { speakerId, speakerName, text, isFinal, timestamp } = action.payload;

      // Ignore empty or whitespace-only text
      if (!text || !text.trim()) {
        return queue;
      }

      const lastCaption = queue.length > 0 ? queue[queue.length - 1] : null;
      const textHasRegressed = lastCaption?.speakerId === speakerId && 
                               lastCaption?.text && 
                               text.length < lastCaption.text.length &&
                               !lastCaption.text.startsWith(text);

      // Ignore text regression (unless it's a final update)
      if (textHasRegressed && !isFinal) {
        return queue;
      }

      // Same speaker, same partial: deduplicate
      if (lastCaption && 
          lastCaption.speakerId === speakerId && 
          !lastCaption.isFinal &&
          lastCaption.text === text) {
        return queue;
      }

      if (lastCaption && lastCaption.speakerId === speakerId && !lastCaption.isFinal) {
        // Same speaker updating partial → replace text
        return queue.map((c, i) =>
          i === queue.length - 1
            ? {
                ...c,
                text,
                isPartial: !isFinal,
                isFinal: isFinal || c.isFinal,
                expiresAt: isFinal ? now + 2500 : undefined, // 2500ms visibility
              }
            : c
        );
      } else {
        // New speaker or first caption → enqueue new bubble
        // If we already have 2 non-expired captions, remove oldest
        let newQueue = queue.slice(-(2 - 1)); // Keep max 1 before adding new

        const captionId = `${speakerId}-${timestamp || now}-${Math.random()}`;
        newQueue.push({
          id: captionId,
          speakerId,
          speakerName,
          text,
          isPartial: !isFinal,
          isFinal: isFinal || false,
          createdAt: now,
          expiresAt: isFinal ? now + 2500 : undefined,
          opacity: 1,
        });

        return newQueue;
      }
    }

    case 'FINALIZE_SPEAKER': {
      // If a different speaker starts talking, finalize previous speaker's partial
      const { speakerId } = action.payload;
      const lastCaption = queue.length > 0 ? queue[queue.length - 1] : null;

      if (lastCaption && lastCaption.speakerId !== speakerId && !lastCaption.isFinal) {
        return queue.map((c, i) =>
          i === queue.length - 1
            ? {
                ...c,
                isFinal: true,
                isPartial: false,
                expiresAt: now + 2500,
              }
            : c
        );
      }

      return queue;
    }

    case 'TICK': {
      // Update fade opacity based on time until expiry
      return queue
        .filter(c => !c.expiresAt || c.expiresAt > now)
        .map(c => {
          if (!c.expiresAt) return { ...c, opacity: 1 };

          const remaining = c.expiresAt - now;
          let opacity = 1;

          // 4-step fade curve over final 2000ms window
          if (remaining <= 500) opacity = 0.15;
          else if (remaining <= 900) opacity = 0.35;
          else if (remaining <= 1400) opacity = 0.55;
          else if (remaining <= 2000) opacity = 0.75;

          return { ...c, opacity };
        });
    }

    case 'CLEAR':
      return [];

    default:
      return queue;
  }
}

export function CaptionOverlay({ meetingId }: CaptionOverlayProps) {
  const [connected, setConnected] = useState(false);
  const [captions, setCaptions] = useState<Caption[]>([]);
  const [captionsEnabled, setCaptionsEnabled] = useState(true);
  const [lastSpeakerId, setLastSpeakerId] = useState<string | null>(null);

  const socketUrl = useMemo(() => resolveCaptionSocketUrl(meetingId), [meetingId]);
  const [retryTick, setRetryTick] = useState(0);
  const attemptRef = useRef(0);
  const portalElRef = useRef<HTMLElement | null>(null);
  const captionDispatchRef = useRef<{ dispatch: (action: any) => void } | null>(null);
  const lastProcessedIdRef = useRef<string | null>(null);
  const socketRef = useRef<WebSocket | null>(null);

  // Initialize caption dispatcher
  useEffect(() => {
    const dispatcher = {
      dispatch(action: any) {
        setCaptions(prev => captionReducer(prev, action));
      }
    };
    captionDispatchRef.current = dispatcher;
  }, []);

  // WebSocket connection
  useEffect(() => {
    if (!socketUrl || !captionsEnabled) {
      return;
    }

    let disposed = false;

    const socket = new WebSocket(socketUrl);
    socketRef.current = socket;

    socket.addEventListener('open', () => {
      console.log('[captions] ✅ Connected to:', socketUrl);
      if (disposed) return;

      attemptRef.current = 0;
      setConnected(true);
      socket.send(JSON.stringify({ type: 'join', meetingId }));
      console.log('[captions] 📤 Sent join message for:', meetingId);
    });

    socket.addEventListener('message', (event) => {
      try {
        const payload = JSON.parse(event.data) as CaptionMessage;

        if (payload.type === 'connected') {
          console.log('[captions] ✅ Server confirmed connection for:', meetingId);
          return;
        }

        if (payload.type === 'cleared') {
          console.log('[captions] 🗑️  Captions cleared');
          captionDispatchRef.current?.dispatch({ type: 'CLEAR' });
          return;
        }

        // Ignore all non-caption types
        if (payload.type !== 'caption') {
          console.log('[captions] 🔹 Received message type:', payload.type);
          return;
        }

        if (!payload.text || !payload.speaker) {
          console.warn('[captions] ⚠️  Invalid caption (missing text or speaker):', payload);
          return;
        }

        // Deduplicate: create event ID and check if we've seen it
        const speakerId = payload.speakerId || payload.speaker;
        const eventId = `${speakerId}-${payload.timestamp || 0}-${payload.text}`;

        if (lastProcessedIdRef.current === eventId) {
          console.log('[captions] ℹ️  Ignoring duplicate caption');
          return;
        }

        lastProcessedIdRef.current = eventId;

        // If different speaker is now speaking, finalize previous
        if (lastSpeakerId !== null && lastSpeakerId !== speakerId) {
          captionDispatchRef.current?.dispatch({
            type: 'FINALIZE_SPEAKER',
            payload: { speakerId }
          });
        }

        setLastSpeakerId(speakerId);

        // Update caption
        const label = payload.final ? '✅ FINAL' : '🔹 PARTIAL';
        console.log(`[captions] ${label} caption: "${payload.text.slice(0, 60)}" from ${payload.speaker}`);

        captionDispatchRef.current?.dispatch({
          type: 'RECEIVE_CAPTION',
          payload: {
            speakerId,
            speakerName: payload.speaker || 'Unknown participant',
            text: payload.text,
            isFinal: payload.final || false,
            timestamp: payload.timestamp,
          }
        });
      } catch (err) {
        console.error('[captions] Parse error:', err);
      }
    });

    socket.addEventListener('close', () => {
      console.log('[captions] ❌ Disconnected from server');
      if (!disposed) {
        setConnected(false);
        const attempt = ++attemptRef.current;
        const delay = Math.min(30000, 1000 * 2 ** (attempt - 1));
        console.log(`[captions] Reconnect attempt ${attempt} in ${delay}ms`);
        setTimeout(() => setRetryTick(t => t + 1), delay);
      }
    });

    socket.addEventListener('error', (e) => {
      console.error('[captions] ❌ WebSocket error:', e);
      if (!disposed) {
        setConnected(false);
        const attempt = ++attemptRef.current;
        const delay = Math.min(30000, 1000 * 2 ** (attempt - 1));
        setTimeout(() => setRetryTick(t => t + 1), delay);
      }
    });

    return () => {
      disposed = true;
      socketRef.current = null;
      try { socket.close(); } catch (_) {}
    };
  }, [meetingId, socketUrl, retryTick, captionsEnabled]);

  // Auto-fade timer
  useEffect(() => {
    if (!captionsEnabled) return;

    const timer = setInterval(() => {
      captionDispatchRef.current?.dispatch({ type: 'TICK' });
    }, 300);

    return () => clearInterval(timer);
  }, [captionsEnabled]);

  // Portal setup
  useEffect(() => {
    try {
      const id = `captions-portal-${meetingId}`;
      let el = document.getElementById(id) as HTMLElement | null;

      if (!el) {
        el = document.createElement('div');
        el.id = id;
        el.style.position = 'fixed';
        el.style.left = '0';
        el.style.top = '0';
        el.style.width = '100%';
        el.style.height = '100%';
        el.style.pointerEvents = 'none';
        el.style.zIndex = String(2147483647);
        document.body.appendChild(el);
      }

      portalElRef.current = el;

      return () => {
        if (el?.parentElement) {
          try { el.parentElement.removeChild(el); } catch (_) {}
        }
        portalElRef.current = null;
      };
    } catch (_) {
      portalElRef.current = null;
    }
  }, [meetingId]);

  // Render overlay
  const overlay = (
    <div 
      className="fixed inset-0 z-40 pointer-events-none flex flex-col items-center justify-end"
      style={{ 
        paddingBottom: typeof window !== 'undefined' && window.innerWidth < 640 ? '72px' : '24px'
      }}
    >
      {/* Caption queue: max 2 items */}
      <div className="space-y-3 w-full flex flex-col items-center px-4">
        {captions.map((caption) => (
          <div
            key={caption.id}
            className="w-full max-w-2xl"
            style={{
              opacity: caption.opacity ?? 1,
              transition: 'opacity 300ms cubic-bezier(0.4, 0, 0.2, 1)',
            }}
          >
            <div className="rounded-3xl bg-black/80 backdrop-blur-sm px-6 py-4 shadow-2xl border border-white/10">
              {/* Speaker name */}
              <div className="mb-1.5 text-sm font-semibold opacity-75 text-gray-300">
                {caption.speakerName}
              </div>

              {/* Transcript text: max 2 lines */}
              <p
                className="text-base leading-relaxed text-white font-normal line-clamp-2"
                style={{
                  wordWrap: 'break-word',
                  width: 'calc(70vw)',
                  maxWidth: 'calc(100% - 24px)',
                }}
              >
                {caption.text}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* CC Toggle Button - Bottom Right */}
      <div className="fixed bottom-6 right-6 pointer-events-auto">
        <button
          onClick={() => setCaptionsEnabled(!captionsEnabled)}
          className={`flex items-center gap-2 px-4 py-2 rounded-full font-semibold text-sm transition-all duration-200 ${
            captionsEnabled
              ? 'bg-white/90 text-black hover:bg-white'
              : 'bg-white/20 text-white hover:bg-white/30'
          }`}
          title={captionsEnabled ? 'Captions on' : 'Captions off'}
        >
          <svg
            className="w-4 h-4"
            fill="currentColor"
            viewBox="0 0 24 24"
          >
            <path d="M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h14l4 4V6c0-1.1-.9-2-2-2zm-2 12H6v-2h12v2zm0-3H6V9h12v4z" />
          </svg>
          <span className="text-xs uppercase tracking-tight">
            {captionsEnabled ? 'CC' : 'CC Off'}
          </span>
        </button>
      </div>

      {/* Connection indicator (only when no captions & enabled) */}
      {captions.length === 0 && captionsEnabled && (
        <div className="mt-4 flex items-center gap-2 text-xs text-gray-400">
          <span className={`h-2 w-2 rounded-full ${connected ? 'bg-green-400' : 'bg-amber-400'}`}></span>
          <span>{connected ? 'Live captions' : 'Connecting...'}</span>
        </div>
      )}
    </div>
  );

  if (portalElRef.current) {
    try {
      return createPortal(overlay, portalElRef.current);
    } catch (_) {
      return overlay;
    }
  }

  return overlay;
}