/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./**/*.html"],
  theme: {
    extend: {
      colors: {
        'primary-green': '#66BB6A',
        'secondary-peach': '#FFAB91',
        'accent-blue': '#90CAF9',
        'light-gray-bg': '#F5F5F5',
        'white-surface': '#FFFFFF',
        'dark-gray-text': '#424242',
        'medium-gray-text': '#757575',
      },
      fontFamily: {
        sans: ['Inter', 'Roboto', 'sans-serif'],
      },
    },
  },
  plugins: [
    require('@tailwindcss/aspect-ratio'),
  ],
}
