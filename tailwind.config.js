/** @type {import('tailwindcss').Config} */
const defaultTheme = require('tailwindcss/defaultTheme');

module.exports = {
  content: ["./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        // Make Tailwind `font-sans` use Poppins via next/font CSS variable
        sans: ['var(--font-poppins)', ...defaultTheme.fontFamily.sans],
      },
    },
  },
  plugins: [],
}
