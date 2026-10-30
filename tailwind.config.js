/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html'],
  theme: {
    extend: {
      fontFamily: {
        anton: ['Anton', 'sans-serif'],
        mono: ['JetBrains Mono', 'Courier New', 'monospace'],
        sans: ['Inter', 'sans-serif']
      }
    }
  }
}
