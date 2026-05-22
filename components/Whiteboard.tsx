'use client';

import dynamic from 'next/dynamic';
import { useEffect, useMemo, useRef, useState } from 'react';
import { LiveblocksProvider, RoomProvider, useBroadcastEvent, useEventListener, useOthers } from '@liveblocks/react';
import { Loader } from './Loader';
import type { ExcalidrawInitialDataState } from '@excalidraw/excalidraw/types';

const Excalidraw = dynamic(
  () => import('@excalidraw/excalidraw').then((module) => module.Excalidraw),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-full w-full items-center justify-center bg-slate-950 text-slate-100">
        <Loader />
      </div>
    ),
  }
);

type WhiteboardScene = {
  meetingId: string;
} & ExcalidrawInitialDataState;

interface WhiteboardProps {
  meetingId: string;
  onClose: () => void;
}

export function Whiteboard({ meetingId, onClose }: WhiteboardProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [status, setStatus] = useState('Loading whiteboard...');
  const [scene, setScene] = useState<WhiteboardScene | null>(null);

  const elementsRef = useRef<ExcalidrawInitialDataState['elements']>([]);
  const appStateRef = useRef<ExcalidrawInitialDataState['appState']>({});
  const lastSavedSnapshotRef = useRef('');
  const saveInFlightRef = useRef(false);
  const saveQueuedRef = useRef(false);
  const excalidrawApiRef = useRef<any>(null);

  const whiteboardUrl = useMemo(
    () => `/api/whiteboards?meetingId=${encodeURIComponent(meetingId)}`,
    [meetingId]
  );

  const liveblocksEnabled = Boolean(process.env.NEXT_PUBLIC_LIVEBLOCKS_PUBLIC_KEY);

  useEffect(() => {
    let active = true;

    const loadScene = async () => {
      try {
        setIsLoaded(false);
        setError('');
        setStatus('Loading whiteboard...');

        const response = await fetch(whiteboardUrl);
        const body = await response.json().catch(() => ({}));

        if (!active) {
          return;
        }

        if (!response.ok) {
          throw new Error(body?.error || 'Failed to load whiteboard');
        }

        const loadedScene = body?.whiteboard || null;
        const nextScene: WhiteboardScene = loadedScene
          ? {
              meetingId: String(loadedScene.meetingId || meetingId),
              elements: (loadedScene.elements || []) as ExcalidrawInitialDataState['elements'],
              appState: {
                collaborators: [],
                ...(loadedScene.appState || {}),
              },
            }
          : {
              meetingId,
              elements: [],
              appState: {
                collaborators: [],
              },
            };

        elementsRef.current = nextScene.elements;
        appStateRef.current = nextScene.appState;
        lastSavedSnapshotRef.current = JSON.stringify(nextScene);
        setScene(nextScene);
        setStatus(loadedScene ? 'Loaded saved whiteboard' : 'New whiteboard ready');
        setIsLoaded(true);
      } catch (loadError: any) {
        if (!active) {
          return;
        }

        setError(loadError?.message || 'Unable to load whiteboard');
        setStatus('Unable to load whiteboard');
        setIsLoaded(true);
      }
    };

    loadScene();

    return () => {
      active = false;
    };
  }, [meetingId, whiteboardUrl]);

  const persistScene = async () => {
    if (!meetingId || saveInFlightRef.current) {
      saveQueuedRef.current = true;
      return;
    }

    const snapshot = JSON.stringify({
      meetingId,
      elements: elementsRef.current,
      appState: appStateRef.current,
    });

    if (snapshot === lastSavedSnapshotRef.current) {
      setStatus('Saved');
      return;
    }

    saveInFlightRef.current = true;
    setIsSaving(true);
    setStatus('Saving...');

    try {
      const response = await fetch('/api/whiteboards', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: snapshot,
      });

      const body = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(body?.error || 'Failed to save whiteboard');
      }

      lastSavedSnapshotRef.current = snapshot;
      setStatus('Saved');
    } catch (saveError: any) {
      setStatus(saveError?.message || 'Autosave failed');
    } finally {
      saveInFlightRef.current = false;
      setIsSaving(false);

      if (saveQueuedRef.current) {
        saveQueuedRef.current = false;
        void persistScene();
      }
    }
  };

  useEffect(() => {
    if (!isLoaded || error) {
      return;
    }

    const intervalId = window.setInterval(() => {
      void persistScene();
    }, 5000);

    return () => {
      window.clearInterval(intervalId);
      void persistScene();
    };
  }, [error, isLoaded]);

  useEffect(() => {
    const handleBeforeUnload = () => {
      void persistScene();
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, []);

  if (!isLoaded) {
    return (
      <div className="flex h-full min-h-[24rem] items-center justify-center bg-slate-950 text-slate-100">
        <Loader />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-full min-h-[24rem] items-center justify-center bg-slate-950 px-6 text-center text-slate-100">
        <div className="max-w-md space-y-3">
          <p className="text-lg font-semibold text-white">Whiteboard unavailable</p>
          <p className="text-sm text-slate-300">{error}</p>
          <button
            onClick={onClose}
            className="rounded-full border border-white/15 bg-white/10 px-4 py-2 text-sm font-medium text-white transition hover:bg-white/15"
          >
            Close
          </button>
        </div>
      </div>
    );
  }

  const initialData = scene
    ? {
        elements: scene.elements,
        appState: scene.appState,
      }
    : undefined;

  if (!liveblocksEnabled) {
    return (
      <SoloWhiteboard
        meetingId={meetingId}
        onClose={onClose}
        initialData={initialData}
        status={status}
        isSaving={isSaving}
        onChange={(elements, appState) => {
          elementsRef.current = elements;
          appStateRef.current = appState;
        }}
        onApiReady={(api) => {
          excalidrawApiRef.current = api;
        }}
      />
    );
  }

  return (
    <LiveblocksProvider
      authEndpoint={async (room) => {
        const response = await fetch('/api/liveblocks-auth', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ room: room || meetingId }),
        });

        return response.json();
      }}
    >
      <RoomProvider id={meetingId} initialPresence={{}}>
        <CollaborativeWhiteboard
          meetingId={meetingId}
          onClose={onClose}
          scene={scene}
          initialData={initialData}
          status={status}
          isSaving={isSaving}
          setStatus={setStatus}
          onChange={(elements, appState) => {
            elementsRef.current = elements;
            appStateRef.current = appState;
          }}
          onApiReady={(api) => {
            excalidrawApiRef.current = api;
          }}
        />
      </RoomProvider>
    </LiveblocksProvider>
  );
}

function SoloWhiteboard({
  meetingId,
  onClose,
  initialData,
  status,
  isSaving,
  onChange,
  onApiReady,
}: {
  meetingId: string;
  onClose: () => void;
  initialData: ExcalidrawInitialDataState | null | undefined;
  status: string;
  isSaving: boolean;
  onChange: (elements: ExcalidrawInitialDataState['elements'], appState: ExcalidrawInitialDataState['appState']) => void;
  onApiReady: (api: any) => void;
}) {
  return (
    <div className="flex h-full min-h-0 flex-col bg-slate-950 text-white">
      <div className="flex items-center justify-between gap-3 border-b border-white/10 px-4 py-3 sm:px-5">
        <div className="min-w-0">
          <div className="text-xs uppercase tracking-[0.24em] text-slate-400">Whiteboard session</div>
          <div className="truncate text-sm font-medium text-white">{meetingId}</div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-slate-200">Solo mode</span>
          <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-slate-200">
            {isSaving ? 'Saving' : status}
          </span>
          <button
            onClick={onClose}
            className="rounded-full border border-white/15 bg-white/10 px-4 py-2 text-sm font-medium text-white transition hover:bg-white/15"
          >
            Close
          </button>
        </div>
      </div>

      <div className="min-h-0 flex-1 bg-slate-900">
        <Excalidraw
          key={meetingId}
          name={meetingId}
          theme={'light'}
          initialData={initialData}
          autoFocus
          handleKeyboardGlobally={false}
          detectScroll={false}
          excalidrawAPI={onApiReady}
          onChange={onChange}
          UIOptions={{
            canvasActions: {
              changeViewBackgroundColor: true,
              clearCanvas: true,
              export: { saveFileToDisk: true },
              loadScene: true,
              saveAsImage: true,
              saveToActiveFile: true,
              toggleTheme: true,
            },
            tools: {
              image: true,
            },
          }}
        />
      </div>
    </div>
  );
}

function CollaborativeWhiteboard({
  meetingId,
  onClose,
  scene,
  initialData,
  status,
  isSaving,
  setStatus,
  onChange,
  onApiReady,
}: {
  meetingId: string;
  onClose: () => void;
  scene: WhiteboardScene | null;
  initialData: ExcalidrawInitialDataState | null | undefined;
  status: string;
  isSaving: boolean;
  setStatus: (value: string) => void;
  onChange: (elements: ExcalidrawInitialDataState['elements'], appState: ExcalidrawInitialDataState['appState']) => void;
  onApiReady: (api: any) => void;
}) {
  const collaboratorsCount = useOthers().length;
  const broadcast = useBroadcastEvent();
  const appliedRemoteSnapshotRef = useRef('');
  const pendingBroadcastRef = useRef<number | null>(null);
  const isApplyingRemoteRef = useRef(false);
  const excalidrawApiRef = useRef<any>(null);

  useEventListener(({ event }) => {
    if (!event || (event as any).type !== 'whiteboard-scene') {
      return;
    }

    const nextScene = (event as any).scene as WhiteboardScene;
    const nextSnapshot = JSON.stringify(nextScene);

    if (!nextScene || nextSnapshot === appliedRemoteSnapshotRef.current) {
      return;
    }

    appliedRemoteSnapshotRef.current = nextSnapshot;
    isApplyingRemoteRef.current = true;
    excalidrawApiRef.current?.updateScene({
      elements: nextScene.elements || [],
      appState: {
        collaborators: [],
        ...(nextScene.appState || {}),
      },
    });
    onChange(nextScene.elements || [], nextScene.appState || {});
    setStatus('Live update received');
    window.setTimeout(() => {
      isApplyingRemoteRef.current = false;
    }, 0);
  });

  useEffect(() => {
    if (!scene) {
      return;
    }

    appliedRemoteSnapshotRef.current = JSON.stringify(scene);
  }, [scene]);

  const scheduleBroadcast = (nextScene: WhiteboardScene) => {
    if (pendingBroadcastRef.current) {
      window.clearTimeout(pendingBroadcastRef.current);
    }

    pendingBroadcastRef.current = window.setTimeout(() => {
      const nextSnapshot = JSON.stringify(nextScene);

      if (isApplyingRemoteRef.current || nextSnapshot === appliedRemoteSnapshotRef.current) {
        return;
      }

      broadcast({
        type: 'whiteboard-scene',
        scene: nextScene,
        version: Date.now(),
      } as any);
    }, 120);
  };

  return (
    <div className="flex h-full min-h-0 flex-col bg-slate-950 text-white">
      <div className="flex items-center justify-between gap-3 border-b border-white/10 px-4 py-3 sm:px-5">
        <div className="min-w-0">
          <div className="text-xs uppercase tracking-[0.24em] text-slate-400">Whiteboard session</div>
          <div className="truncate text-sm font-medium text-white">{meetingId}</div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-slate-200">
            {collaboratorsCount > 0 ? `${collaboratorsCount + 1} participants` : 'Solo mode'}
          </span>
          <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-slate-200">
            {isSaving ? 'Saving' : status}
          </span>
          <button
            onClick={onClose}
            className="rounded-full border border-white/15 bg-white/10 px-4 py-2 text-sm font-medium text-white transition hover:bg-white/15"
          >
            Close
          </button>
        </div>
      </div>

      <div className="min-h-0 flex-1 bg-slate-900">
        <Excalidraw
          key={meetingId}
          name={meetingId}
          theme={'light'}
          initialData={initialData}
          autoFocus
          handleKeyboardGlobally={false}
          detectScroll={false}
          excalidrawAPI={(api) => {
            excalidrawApiRef.current = api;
            onApiReady(api);
          }}
          onChange={(elements, appState) => {
            onChange(elements, appState);

            if (!isApplyingRemoteRef.current) {
              setStatus('Unsaved changes');
              scheduleBroadcast({
                meetingId,
                elements,
                appState,
              });
            }
          }}
          UIOptions={{
            canvasActions: {
              changeViewBackgroundColor: true,
              clearCanvas: true,
              export: { saveFileToDisk: true },
              loadScene: true,
              saveAsImage: true,
              saveToActiveFile: true,
              toggleTheme: true,
            },
            tools: {
              image: true,
            },
          }}
        />
      </div>
    </div>
  );
}

export default Whiteboard;