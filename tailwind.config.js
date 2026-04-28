/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: { DEFAULT: "#0f172a", muted: "#475569" },
        paper: "#fafaf7",
        front: "#fde68a",
      },
    },
  },
  plugins: [],
};
