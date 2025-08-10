/** @type {import('tailwindcss').Config} */
export default {
  darkMode: "class", // Enable class-based dark mode
  content: ["./src/**/*.{astro,html,js,jsx,ts,tsx,md,mdx}"],
  theme: {
    extend: {
      colors: {
        primary: "#0f172a", // deep navy
        accent: "#ef4444", // red-500 style
      },
    },
  },
  plugins: [],
};
