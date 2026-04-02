/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        campus: {
          primary: '#2563eb',
          secondary: '#1d4ed8',
          accent: '#3b82f6',
          dark: '#1e40af',
          light: '#dbeafe',
        },
        landing: {
          sky: '#00a3ff',
          navy: '#1a202c',
          slate: '#2d3748',
        },
      },
      fontFamily: {
        display: ['"Dancing Script"', 'cursive'],
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        card: '0 1px 3px 0 rgb(15 23 42 / 0.06), 0 1px 2px -1px rgb(15 23 42 / 0.06)',
        'card-hover':
          '0 10px 15px -3px rgb(15 23 42 / 0.08), 0 4px 6px -4px rgb(15 23 42 / 0.06)',
        float: '0 10px 40px rgb(15 23 42 / 0.12), 0 4px 12px rgb(37 99 235 / 0.08)',
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
      },
    },
  },
  plugins: [],
};
