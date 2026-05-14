/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{tsx,ts,jsx,js}',
    './components/**/*.{tsx,ts,jsx,js}',
    './screens/**/*.{tsx,ts,jsx,js}',
  ],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        primary: '#0D0D0D',
        'primary-mid': '#525252',
        'primary-light': '#A3A3A3',
        'primary-pale': '#D4D4D4',
        background: '#F5F5F5',
        surface: '#FFFFFF',
        'surface-muted': '#FAFAFA',
        border: '#F0F0F0',
        'border-mid': '#E5E5E5',
        success: '#22C55E',
        warning: '#F59E0B',
        error: '#EF4444',
        info: '#3B82F6',
      },
    },
  },
};
