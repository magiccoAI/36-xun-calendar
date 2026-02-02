/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        'xun-1': '#F87171',
        'xun-2': '#FBBF24',
        'xun-3': '#34D399',
        'mood-1': '#EFF6FF',
        'mood-2': '#DBEAFE',
        'mood-3': '#BFDBFE',
        'mood-4': '#93C5FD',
        'mood-5': '#60A5FA',
      }
    },
  },
  plugins: [],
}
