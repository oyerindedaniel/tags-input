/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    // apps content
    "app/**/*.{ts,tsx}",
    "components/**/*.{ts,tsx}",
    // packages content
    "../../packages/ui/src/**/*.{js,ts,jsx,tsx}",
  ],
  prefix: "",
  theme: {
    extend: {},
  },
  plugins: [],
};
