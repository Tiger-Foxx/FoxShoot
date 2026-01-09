/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: '#F97316',    // Orange vif logo
        'primary-dark': '#EA580C',
        background: '#0F0F0F', // Noir profond
        surface: '#111827',    // Gris anthracite
        text: '#F3F4F6',       // Gris clair
      },
      borderRadius: {
        DEFAULT: '4px',        // Coins légèrement arrondis, flat
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
