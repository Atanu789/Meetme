'use client';

import dynamic from 'next/dynamic';
import { useEffect, useMemo, useRef, useState } from 'react';
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
  updatedAt?: string | Date;
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
  const filesRef = useRef<ExcalidrawInitialDataState['files']>({});
  const lastSavedSnapshotRef = useRef('');
  const lastRemoteVersionRef = useRef('');
  const saveInFlightRef = useRef(false);
  const saveQueuedRef = useRef(false);
  const savePromiseRef = useRef<Promise<void> | null>(null);
  const saveTimerRef = useRef<number | null>(null);
  const excalidrawApiRef = useRef<any>(null);

  const sanitizeAppState = (appState: ExcalidrawInitialDataState['appState']) => {
    const { collaborators, ...rest } = (appState || {}) as Record<string, unknown>;
    return rest;
  };

  const syncSceneFromApi = () => {
    const api = excalidrawApiRef.current;

    if (!api) {
      return;
    }

    elementsRef.current = api.getSceneElements?.() || elementsRef.current;
    appStateRef.current = api.getAppState?.() || appStateRef.current;
    filesRef.current = api.getFiles?.() || filesRef.current;
  };

  const serializeSnapshot = () => {
    syncSceneFromApi();

    return JSON.stringify({
      meetingId,
      elements: elementsRef.current,
      appState: sanitizeAppState(appStateRef.current),
      files: filesRef.current || {},
    });
  };

  const schedulePersistScene = () => {
    if (saveTimerRef.current) {
      window.clearTimeout(saveTimerRef.current);
    }

    saveTimerRef.current = window.setTimeout(() => {
      void persistScene();
    }, 500);
  };

  const whiteboardUrl = useMemo(
    () => `/api/whiteboards?meetingId=${encodeURIComponent(meetingId)}`,
    [meetingId]
  );

  useEffect(() => {
    let active = true;

    const loadScene = async () => {
      try {
        setIsLoaded(false);
        setError('');
        setStatus('Loading whiteboard...');

        const response = await fetch(whiteboardUrl, { cache: 'no-store' });
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
              files: loadedScene.files || {},
            }
          : {
              meetingId,
              elements: [],
              appState: {
                collaborators: [],
              },
              files: {},
            };

        elementsRef.current = nextScene.elements;
        appStateRef.current = nextScene.appState;
        filesRef.current = nextScene.files || {};
        lastRemoteVersionRef.current = String(loadedScene?.updatedAt || '');
        lastSavedSnapshotRef.current = serializeSnapshot();
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

  const persistScene = async (flushQueued = false): Promise<void> => {
    if (!meetingId) {
      return;
    }

    if (saveInFlightRef.current) {
      saveQueuedRef.current = true;
      await savePromiseRef.current;

      if (flushQueued) {
        await persistScene(true);
      }

      return;
    }

    const snapshot = serializeSnapshot();

    if (snapshot === lastSavedSnapshotRef.current) {
      setStatus('Saved');
      return;
    }

    saveInFlightRef.current = true;
    setIsSaving(true);
    setStatus('Saving...');

    const savePromise = (async () => {
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
      lastRemoteVersionRef.current = String(body?.updatedAt || lastRemoteVersionRef.current);
      setStatus('Saved');
    })();

    savePromiseRef.current = savePromise;

    try {
      await savePromise;
    } catch (saveError: any) {
      setStatus(saveError?.message || 'Autosave failed');
    } finally {
      saveInFlightRef.current = false;
      savePromiseRef.current = null;
      setIsSaving(false);

      if (saveQueuedRef.current) {
        saveQueuedRef.current = false;
        await persistScene(flushQueued);
      }
    }
  };

  const handleClose = async () => {
    syncSceneFromApi();

    if (saveTimerRef.current) {
      window.clearTimeout(saveTimerRef.current);
      saveTimerRef.current = null;
    }

    await persistScene(true);
    onClose();
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
      void persistScene(true);
    };
  }, [error, isLoaded]);

  useEffect(() => {
    const handleBeforeUnload = () => {
      void persistScene();
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      if (saveTimerRef.current) {
        window.clearTimeout(saveTimerRef.current);
      }
      void persistScene(true);
    };
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

  return (
    <CollaborativeWhiteboard
      meetingId={meetingId}
      onClose={handleClose}
      scene={scene}
      initialData={initialData}
      status={status}
      isSaving={isSaving}
      whiteboardUrl={whiteboardUrl}
      lastRemoteVersionRef={lastRemoteVersionRef}
      setStatus={setStatus}
      schedulePersistScene={schedulePersistScene}
      onChange={(elements, appState) => {
        elementsRef.current = elements;
        appStateRef.current = appState;
      }}
      onSceneChange={(elements, appState, files) => {
        elementsRef.current = elements;
        appStateRef.current = appState;
        filesRef.current = files || {};
      }}
      onApiReady={(api) => {
        excalidrawApiRef.current = api;
      }}
    />
  );
}

function CollaborativeWhiteboard({
  meetingId,
  onClose,
  scene,
  initialData,
  status,
  isSaving,
  whiteboardUrl,
  lastRemoteVersionRef,
  setStatus,
  schedulePersistScene,
  onChange,
  onSceneChange,
  onApiReady,
}: {
  meetingId: string;
  onClose: () => void;
  scene: WhiteboardScene | null;
  initialData: ExcalidrawInitialDataState | null | undefined;
  status: string;
  isSaving: boolean;
  whiteboardUrl: string;
  lastRemoteVersionRef: React.MutableRefObject<string>;
  setStatus: (value: string) => void;
  schedulePersistScene: () => void;
  onChange: (elements: ExcalidrawInitialDataState['elements'], appState: ExcalidrawInitialDataState['appState']) => void;
  onSceneChange: (
    elements: ExcalidrawInitialDataState['elements'],
    appState: ExcalidrawInitialDataState['appState'],
    files: ExcalidrawInitialDataState['files']
  ) => void;
  onApiReady: (api: any) => void;
}) {
  const appliedRemoteSnapshotRef = useRef('');
  const lastLocalChangeAtRef = useRef(0);
  const isApplyingRemoteRef = useRef(false);
  const excalidrawApiRef = useRef<any>(null);

  useEffect(() => {
    if (!scene) {
      return;
    }

    appliedRemoteSnapshotRef.current = JSON.stringify(scene);
  }, [scene]);

  useEffect(() => {
    let active = true;

    const applyRemoteScene = async () => {
      if (Date.now() - lastLocalChangeAtRef.current < 1200) {
        return;
      }

      try {
        const response = await fetch(whiteboardUrl, { cache: 'no-store' });
        const body = await response.json().catch(() => ({}));

        if (!active || !response.ok) {
          return;
        }

        const nextScene = body?.whiteboard as WhiteboardScene | null;
        const nextRemoteVersion = String(nextScene?.updatedAt || '');

        if (!nextScene || !nextRemoteVersion || nextRemoteVersion === lastRemoteVersionRef.current) {
          return;
        }

        const nextSnapshot = JSON.stringify({
          meetingId,
          elements: nextScene.elements || [],
          appState: {
            collaborators: [],
            ...(nextScene.appState || {}),
          },
          files: nextScene.files || {},
        });

        if (nextSnapshot === appliedRemoteSnapshotRef.current) {
          lastRemoteVersionRef.current = nextRemoteVersion;
          return;
        }

        lastRemoteVersionRef.current = nextRemoteVersion;
        appliedRemoteSnapshotRef.current = nextSnapshot;
        isApplyingRemoteRef.current = true;
        excalidrawApiRef.current?.updateScene({
          elements: nextScene.elements || [],
          appState: {
            collaborators: [],
            ...(nextScene.appState || {}),
          },
          files: nextScene.files || {},
        });
        onSceneChange(nextScene.elements || [], nextScene.appState || {}, nextScene.files || {});
        setStatus('Live update received');
        window.setTimeout(() => {
          isApplyingRemoteRef.current = false;
        }, 0);
      } catch (err) {
        console.warn('[whiteboard] realtime sync failed:', err);
      }
    };

    const intervalId = window.setInterval(() => {
      void applyRemoteScene();
    }, 900);

    return () => {
      active = false;
      window.clearInterval(intervalId);
    };
  }, [lastRemoteVersionRef, meetingId, onChange, setStatus, whiteboardUrl]);

  return (
    <div className="flex h-full min-h-0 flex-col bg-slate-950 text-white">
      <div className="flex items-center justify-between gap-3 border-b border-white/10 px-4 py-3 sm:px-5">
        <div className="min-w-0">
          <div className="text-xs uppercase tracking-[0.24em] text-slate-400">Whiteboard session</div>
          <div className="truncate text-sm font-medium text-white">{meetingId}</div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-slate-200">
            Shared realtime
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
          onChange={(elements, appState, files) => {
            onSceneChange(elements, appState, files);

            if (!isApplyingRemoteRef.current) {
              lastLocalChangeAtRef.current = Date.now();
              setStatus('Unsaved changes');
            }

            schedulePersistScene();
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
