# Theme

## Token Summary
- Font: `Segoe UI` system sans for UI; `Orbitron` for display headings.
- Ink: `#0b1324`; cloud background: `#f2f8ff`; dark background: `#010611`.
- Brand accents: cyan `#22d3ee`, mint `#34d399`, sun `#fbbf24`, indigo `#6366f1`.
- Content width: `80rem`; Tailwind radii commonly use `rounded-lg` and `rounded-2xl`.
- Visual character: cool white workspace surfaces, slate text, cyan/mint emphasis, dark tinted dashboard headers.

## `tailwind.config.ts`
```ts
import type { Config } from 'tailwindcss';
const config: Config = {
  darkMode: 'class',
  content: ['./app/**/*.{js,ts,jsx,tsx,mdx}', './components/**/*.{js,ts,jsx,tsx,mdx}', './pages/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: { extend: { colors: { brand: { 50: '#EEF2FF', 100: '#E0E7FF', 200: '#C7D2FE', 300: '#A5B4FC', 400: '#818CF8', 500: '#6366F1', 600: '#4F46E5', 700: '#4338CA', 800: '#3730A3', 900: '#312E81', 950: '#1E1B4B' }, primary: '#3B82F6', secondary: '#1F2937', accent: '#10B981' } } },
  plugins: [],
};
export default config;
```

## Global CSS token source
```css
:root {
  --aceternity-ink: #0b1324;
  --aceternity-sky: #22d3ee;
  --aceternity-mint: #34d399;
  --aceternity-sun: #fbbf24;
  --aceternity-sand: #fef3c7;
  --aceternity-cloud: #f2f8ff;
  --app-content-max: 80rem;
  --font-sans: 'Segoe UI', system-ui, -apple-system, BlinkMacSystemFont, sans-serif;
  --font-display: 'Orbitron', 'Segoe UI', system-ui, -apple-system, BlinkMacSystemFont, sans-serif;
}
```
