/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        cyber: {
          950: '#070b13',
          900: '#0b1320',
          850: '#0f1b2d',
          800: '#14233a',
          700: '#1e3352',
          accent: '#00f2fe',
          purple: '#9d4edd',
          warning: '#f77f00',
          danger: '#ff3366',
          success: '#00f5d4'
        }
      },
      fontFamily: {
        mono: ['JetBrains Mono', 'Fira Code', 'Courier New', 'monospace'],
        sans: ['Inter', 'system-ui', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
