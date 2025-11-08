/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        'dark-bg-primary': '#1a1a1a',
        'dark-bg-secondary': '#2d2d2d',
        'dark-bg-tertiary': '#3a3a3a',
        'dark-border-primary': '#404040',
        'dark-border-secondary': '#525252',
      },
    },
  },
  plugins: [],
}

