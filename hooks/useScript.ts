'use client';

import { useEffect, useState } from 'react';

type UseScriptResult = {
  loaded: boolean;
  error: boolean;
};

export function useScript(src: string, timeoutMs = 10000): UseScriptResult {
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);

  useEffect(() => {
    setLoaded(false);
    setError(false);

    let timeoutId: ReturnType<typeof setTimeout> | null = null;

    const markError = () => {
      setError(true);
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };

    timeoutId = setTimeout(() => {
      console.error(`Timed out loading script: ${src}`);
      markError();
    }, timeoutMs);

    // Check if script already exists
    const script = document.querySelector(
      `script[src="${src}"]`
    ) as HTMLScriptElement | null;

    if (script) {
      if (window.JitsiMeetExternalAPI) {
        if (timeoutId) {
          clearTimeout(timeoutId);
        }
        setLoaded(true);
      } else {
        script.addEventListener(
          'load',
          () => {
            if (timeoutId) {
              clearTimeout(timeoutId);
            }
            setLoaded(true);
          },
          { once: true }
        );
        script.addEventListener(
          'error',
          () => {
            console.error(`Failed to load script: ${src}`);
            markError();
          },
          { once: true }
        );
      }

      return;
    }

    const scriptElement = document.createElement('script');
    scriptElement.src = src;
    scriptElement.async = true;
    scriptElement.onload = () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
      setLoaded(true);
    };
    scriptElement.onerror = () => {
      console.error(`Failed to load script: ${src}`);
      markError();
    };

    document.body.appendChild(scriptElement);

    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
      // Don't remove the script to avoid reloading
    };
  }, [src, timeoutMs]);

  return { loaded, error };
}
