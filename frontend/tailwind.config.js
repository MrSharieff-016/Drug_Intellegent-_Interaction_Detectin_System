export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#ecfdf5',
          100: '#d1fae5',
          200: '#a7f3d0',
          300: '#6ee7b7',
          400: '#34d399',
          500: '#10b981',
          600: '#059669',
          700: '#047857',
          800: '#065f46',
          900: '#064e3b',
          950: '#022c22',
        },
        obsidian: {
          950: '#060a0f',
          900: '#090e17',
          850: '#0e1524',
          800: '#131d31',
          700: '#1e2c47',
        }
      },
      fontFamily: {
        sans: ['Plus Jakarta Sans', 'Inter', 'sans-serif'],
        serif: ['Newsreader', 'Georgia', 'serif'],
        heading: ['Newsreader', 'Georgia', 'serif'],
      }
    },
  },
  plugins: [],
}
