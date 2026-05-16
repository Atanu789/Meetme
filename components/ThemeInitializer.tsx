"use client";

import { useEffect } from 'react';

export default function ThemeInitializer() {
  useEffect(() => {
    try {
      // Always use light mode
      document.documentElement.classList.remove('dark');
    } catch (_) {}
  }, []);

  return null;
}
