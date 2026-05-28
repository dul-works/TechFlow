/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        samsung: ['SamsungSSHead', 'SamsungSSBody', 'sans-serif'],
        head: ['SamsungSSHead', 'sans-serif'],
        body: ['SamsungSSBody', 'sans-serif'],
      },
      colors: {
        bg: '#0f0f0f',
        surface: '#1a1a1a',
        border: '#2a2a2a',
      },
    },
  },
  plugins: [],
}

