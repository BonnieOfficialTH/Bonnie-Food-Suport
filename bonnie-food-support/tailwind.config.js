/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        bonnie: {
          pink: '#FBCFE8',
          rose: '#A855F7',
          cream: '#FAF5FF',
          warm: '#F3E8FF',
          dark: '#09090B',
          muted: '#6B21A8',
          blue: '#BAE6FD',
          lavender: '#D8B4FE',
        }
      },
      fontFamily: {
        display: ['Georgia', 'serif'],
        body: ['system-ui', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
