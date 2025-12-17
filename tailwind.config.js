/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        cyber: {
          primary: '#00ff9d',   // Neon Green
          secondary: '#7000ff', // Neon Purple
          accent: '#ff00ff',    // Neon Pink
          dark: '#0a0a12',      // Deep Background
          scifi: '#00f7ff',     // Cyan
        }
      },
      fontFamily: {
        mono: ['"Courier New"', 'Courier', 'monospace'], // Hacker style
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      backgroundImage: {
        'grid-pattern': "linear-gradient(to right, #1f2937 1px, transparent 1px), linear-gradient(to bottom, #1f2937 1px, transparent 1px)",
      }
    },
  },
  plugins: [],
}
