import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: '#3B82F6',
        secondary: '#1F2937',
        accent: '#10B981',
      },
      backdropFilter: {
        none: 'none',
        sm: 'blur(4px)',
        md: 'blur(12px)',
        lg: 'blur(16px)',
      },
    },
  },
  plugins: [],
};

export default config;
