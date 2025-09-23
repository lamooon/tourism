// tailwind.config.js

/** @type {import('tailwindcss').Config} */
module.exports = {
  // Make sure this content array correctly points to all your template files
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      // Your theme extensions go here
    },
  },
  plugins: [
    // THIS IS THE CORRECT WAY TO ADD THE LIBRARY
    require('tw-animate-css'),
  ],
};