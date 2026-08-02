import type { Config } from 'tailwindcss';
import animate from 'tailwindcss-animate';

const config: Config = {
  darkMode: ['class'],
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        serif: ['"Playfair Display"', 'Georgia', 'serif'],
        sans: ['"Inter"', 'system-ui', 'sans-serif'],
      },
      colors: {
        brand: {
          50:  '#f5f3ff',
          100: '#ede9fe',
          200: '#ddd6fe',
          300: '#c4b5fd',
          400: '#a78bfa',
          500: '#8b5cf6',
          600: '#7c3aed',
          700: '#6d28d9',
          800: '#5b21b6',
          900: '#4c1d95',
          DEFAULT: '#7c3aed',
        },
        gold: {
          light: '#fcd34d',
          DEFAULT: '#f59e0b',
          dark: '#d97706',
        },
      },
      keyframes: {
        'fade-up': {
          from: { opacity: '0', transform: 'translateY(24px)' },
          to:   { opacity: '1', transform: 'translateY(0)' },
        },
        'float': {
          '0%,100%': { transform: 'translateY(0px)' },
          '50%':      { transform: 'translateY(-10px)' },
        },
      },
      animation: {
        'fade-up': 'fade-up 0.6s ease-out forwards',
        'float':   'float 3s ease-in-out infinite',
      },
    },
  },
  plugins: [animate],
  safelist: [
    'page-light',
    'bg-gradient-brand',
    'shadow-glow',
    'shadow-glass',
    'glass',
    'glass-dark',
    'card-solid',
    'card',
    'section-tag',
    'section-title',
    'heading-xl',
    'heading-lg',
    'heading-md',
    'heading-sm',
    'btn-primary',
    'btn-outline',
    'btn-gold',
    'input-base',
    'input-dark',
    'container-pad',
    'section-py',
    'text-gradient',
    'text-gradient-gold',
    'shimmer',
  ],
};

export default config;
