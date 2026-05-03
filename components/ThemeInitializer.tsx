"use client";

import { useEffect } from 'react';

export default function ThemeInitializer() {
  useEffect(() => {
    try {
      const stored = localStorage.getItem('theme');
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      const useDark = stored ? stored === 'dark' : prefersDark;
      if (useDark) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    } catch (_) {}
  }, []);

  return null;
}
