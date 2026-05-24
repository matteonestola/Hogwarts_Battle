/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        hogwarts: {
          gold: '#C9A84C',
          red: '#740001',
          dark: '#1A0A00',
          parchment: '#F5E6C8',
        },
      },
      fontFamily: {
        magic: ['Georgia', 'serif'],
      },
    },
  },
  plugins: [],
}
