/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        darkBg: "#0a0a0a",
        purpleAccent: "#6D28D9",
        blueAccent: "#3B82F6",
      },
    },
  },
  plugins: [],
}
