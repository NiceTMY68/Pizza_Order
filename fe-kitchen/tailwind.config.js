/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{js,jsx}'
  ],
  theme: {
    extend: {
      colors: {
        kitchen: {
          bg: '#112c5a',
          row: '#1f3f73',
          accent: '#ffd400',
          danger: '#ff4d4f',
          ready: '#29c76f',
          info: '#4287f5'
        }
      },
      fontFamily: {
        display: ['"Rajdhani"', 'sans-serif']
      }
    }
  },
  plugins: []
};

