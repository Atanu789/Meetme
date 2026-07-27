"use client";

import { useEffect } from 'react';

export default function ThemeInitializer() {
  useEffect(() => {
    try {
      document.documentElement.classList.add('dark');
    } catch (_) {}
  }, []);

  return null;
}
