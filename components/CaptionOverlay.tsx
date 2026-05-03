'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

/**
 * Caption data structure for rolling display
 * Supports partial updates + final locking with auto-expire
 */
type Caption = {
  id: string;
  speaker: string;
  text: string;
  isFinal: boolean;
  startTime: number;
  expiresAt?: number;
  opacity: number;
};

type CaptionMessage = {
  type?: 'caption' | 'connected' | 'cleared' | 'summary';
  meetingId?: string;
  text?: string;
  summary?: string;
  actions?: Array<{ description: string; assignee?: string }>;
  speaker?: string;
  final?: boolean;
  timestamp?: number;
};

interface CaptionOverlayProps {
  meetingId: string;
  className?: string;
}

function resolveCaptionSocketUrl(meetingId: string) {
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
      // Fall through to default handling
    }
  }

  if (typeof window === 'undefined') {
    return '';
  }

  // Determine protocol based on current page
  const isSecure = window.location.protocol === 'https:';
  const wsProtocol = isSecure ? 'wss:' : 'ws:';
  
  // Extract just the hostname without port
  const hostname = window.location.hostname;
  
  // Try to connect to meeting-ai service on port 4010 on same host
  return `${wsProtocol}//${hostname}:4010/ws/${encodeURIComponent(meetingId)}`;
}

/**
 * Caption reducer: manages rolling queue with proper partial/final handling
 * Supports real-time streaming with partial updates and final lock
 */
function captionReducer(state: Caption[], action: any): Caption[] {
  const now = Date.now();
  
  // Clean up expired captions
  let queue = state.filter(c => !c.expiresAt || c.expiresAt > now);
  
  switch (action.type) {
    case 'UPDATE_ACTIVE': {
      // Update existing caption from current speaker (partial update)
      // or create new one if speaker changed
      const { speaker, text, isFinal } = action.payload;
      const lastCaption = queue.length > 0 ? queue[queue.length - 1] : null;
      
      if (lastCaption && lastCaption.speaker === speaker && !lastCaption.isFinal) {
        // Same speaker, partial update - replace text in place (realtime update)
        return queue.map((c, i) => 
          i === queue.length - 1 ? { ...c, text } : c
        );
      } else {
        // New speaker or speaker changed - enqueue new caption (keep max 2)
        return [
          ...queue.slice(-1),  // Keep previous caption for rolling display (max 1 old)
          {
            id: `${speaker}-${now}-${Math.random()}`,
            speaker,
            text,
            isFinal,
            startTime: now,
            opacity: 1,
          }
        ];
      }
    }
    
    case 'FINALIZE': {
      // Mark caption as final and set expiry (2.5 seconds for reading)
      const { captionId } = action.payload;
      return queue.map(c => 
        c.id === captionId ? { ...c, isFinal: true, expiresAt: now + 2500 } : c
      );
    }
    
    case 'FADE': {
      // Gradually reduce opacity for fade-out effect
      const { captionId } = action.payload;
      const opacity = action.payload.opacity ?? 0.5;
      return queue.map(c => 
        c.id === captionId ? { ...c, opacity } : c
      );
    }
    
    case 'CLEAR':
      return [];
    
    default:
      return queue;
  }
}

export function CaptionOverlay({ meetingId, className = '' }: CaptionOverlayProps) {
  const [connected, setConnected] = useState(false);
  const [captions, setCaptions] = useState<Caption[]>([]);
  const [debugEnabled, setDebugEnabled] = useState(false);
  const [rawLast, setRawLast] = useState<string | null>(null);
  
  const socketUrl = useMemo(() => resolveCaptionSocketUrl(meetingId), [meetingId]);
  const [retryTick, setRetryTick] = useState(0);
  const attemptRef = useRef(0);
  const portalElRef = useRef<HTMLElement | null>(null);
  const captionDispatchRef = useRef<{ dispatch: (action: any) => void } | null>(null);
  const fadeTimerRef = useRef<{ [captionId: string]: NodeJS.Timeout }>({});

  // Initialize caption queue and dispatcher
  useEffect(() => {
    const dispatcher = {
      dispatch(action: any) {
        setCaptions(prev => captionReducer(prev, action));
      }
    };
    captionDispatchRef.current = dispatcher;
  }, []);

  useEffect(() => {
    if (!socketUrl) {
      console.warn('[captions] No socket URL configured');
      return;
    }

    let disposed = false;
    console.log('[captions] Connecting to WebSocket:', socketUrl, 'for meetingId:', meetingId);
    const socket = new WebSocket(socketUrl);

    socket.addEventListener('open', () => {
      console.log('[captions] ✅ WebSocket CONNECTED to:', socketUrl);
      if (disposed) return;

      attemptRef.current = 0;
      setConnected(true);
      socket.send(JSON.stringify({ type: 'join', meetingId }));
      console.log('[captions] Sent join message for:', meetingId);
    });

    socket.addEventListener('message', (event) => {
      console.log('[captions] 📨 Raw message received:', event.data);
      if (debugEnabled) setRawLast(String(event.data));
      
      try {
        const payload = JSON.parse(event.data) as CaptionMessage;
        console.log('[captions] ✅ Parsed message type:', payload.type);

        if (payload.type === 'cleared') {
          console.log('[captions] Cleared captions');
          captionDispatchRef.current?.dispatch({ type: 'CLEAR' });
          return;
        }

        // Ignore summary type entirely - should never appear in live overlay
        if (payload.type === 'summary') {
          console.log('[captions] Ignoring summary message during live meeting');
          return;
        }

        if (payload.type === 'caption' && payload.text && payload.speaker) {
          console.log('[captions] 🎤 CAPTION:', payload.text.slice(0, 80), 'speaker:', payload.speaker, 'final:', payload.final);
          
          // Update active caption (partial) or enqueue new one
          captionDispatchRef.current?.dispatch({
            type: 'UPDATE_ACTIVE',
            payload: {
              speaker: payload.speaker,
              text: payload.text,
              isFinal: payload.final || false,
            }
          });

          // If final, schedule fade and expiry
          if (payload.final) {
            // Find the last caption (just updated) and mark as final
            setCaptions(prev => {
              if (prev.length > 0) {
                const lastCaption = prev[prev.length - 1];
                const captionId = lastCaption.id;
                
                // Finalize caption (set expiry time)
                captionDispatchRef.current?.dispatch({
                  type: 'FINALIZE',
                  payload: { captionId }
                });

                // Start fade animation at 1.5 seconds
                setTimeout(() => {
                  captionDispatchRef.current?.dispatch({
                    type: 'FADE',
                    payload: { captionId, opacity: 0.6 }
                  });
                }, 1500);

                // Fade more at 2 seconds
                setTimeout(() => {
                  captionDispatchRef.current?.dispatch({
                    type: 'FADE',
                    payload: { captionId, opacity: 0.3 }
                  });
                }, 2000);
              }
              return prev;
            });
          }
        }
      } catch (err) {
        console.error('[captions] Failed to parse message:', err);
      }
    });

    socket.addEventListener('close', () => {
      console.log('[captions] ❌ WebSocket closed');
      if (!disposed) {
        setConnected(false);
        const attempt = ++attemptRef.current;
        const delay = Math.min(30000, 1000 * 2 ** (attempt - 1));
        console.log(`[captions] Scheduling reconnect attempt ${attempt} in ${delay}ms`);
        setTimeout(() => setRetryTick(t => t + 1), delay);
      }
    });

    socket.addEventListener('error', (e) => {
      console.error('[captions] ❌ WebSocket ERROR:', e);
      if (!disposed) {
        setConnected(false);
        const attempt = ++attemptRef.current;
        const delay = Math.min(30000, 1000 * 2 ** (attempt - 1));
        console.log(`[captions] Scheduling reconnect attempt ${attempt} in ${delay}ms due to error`);
        setTimeout(() => setRetryTick(t => t + 1), delay);
      }
    });

    return () => {
      disposed = true;
      socket.close();
    };
  }, [meetingId, socketUrl, retryTick, debugEnabled]);

  // Auto-expire final captions
  useEffect(() => {
    const checkExpiry = () => {
      setCaptions(prev => {
        const now = Date.now();
        return prev.filter(c => !c.expiresAt || c.expiresAt > now);
      });
    };

    const timer = setInterval(checkExpiry, 300);
    return () => clearInterval(timer);
  }, []);

  // Create and manage portal element
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
        if (el && el.parentElement) {
          try { el.parentElement.removeChild(el); } catch (_) {}
        }
        portalElRef.current = null;
      };
    } catch (_) {
      portalElRef.current = null;
    }
  }, [meetingId]);

  // Initialize debug mode
  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      setDebugEnabled(params.get('captions_debug') === '1');
    } catch (_) {
      setDebugEnabled(false);
    }
  }, []);

  // Render caption queue
  const overlay = (
    <div className="fixed inset-x-0 bottom-0 z-50 flex flex-col items-center gap-2 px-4 pb-8" style={{ pointerEvents: 'none' }}>
      {/* Display max 2 captions in rolling queue */}
      <div className="max-w-2xl w-full space-y-2">
        {captions.map((caption) => (
          <div
            key={caption.id}
            className="rounded-2xl border border-white/20 bg-slate-950/85 px-4 py-3 shadow-2xl backdrop-blur transition-all duration-300"
            style={{
              opacity: caption.opacity,
              transform: caption.opacity < 1 ? 'translateY(8px)' : 'translateY(0)',
            }}
          >
            {/* Speaker name badge */}
            <div className="mb-2 flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse"></div>
              <span className="text-xs font-semibold uppercase tracking-wide text-emerald-300">
                {caption.speaker || 'Speaker'}
              </span>
              {caption.isFinal && (
                <span className="text-[10px] text-slate-400">●</span>
              )}
            </div>
            
            {/* Caption text */}
            <p className="text-sm leading-relaxed text-white">
              {caption.text}
            </p>
          </div>
        ))}
      </div>

      {/* Connection status when no captions */}
      {captions.length === 0 && (
        <div className="rounded-full border border-white/10 bg-slate-950/70 px-3 py-1 text-xs text-slate-300 backdrop-blur">
          <span className="mr-2">Live captions</span>
          <span className={`inline-block h-2 w-2 rounded-full ${connected ? 'bg-emerald-400' : 'bg-amber-400'}`}></span>
        </div>
      )}

      {/* Debug panel */}
      {debugEnabled && (
        <div className="mt-2 max-w-2xl w-full rounded-md bg-black/70 px-3 py-2 text-xs text-amber-200">
          <div className="font-medium text-amber-100 mb-1">WS Debug</div>
          <div className="whitespace-pre-wrap break-all text-[10px]">
            {rawLast ? rawLast.slice(0, 200) : 'waiting...'}
          </div>
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