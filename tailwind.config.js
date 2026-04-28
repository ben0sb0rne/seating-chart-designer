/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', '"Segoe UI"', 'Roboto', '"Helvetica Neue"', 'Arial', 'sans-serif'],
      },
      colors: {
        // Aligned with the Math Bingo palette so both apps feel like one product.
        ink: { DEFAULT: "#1a1a1a", muted: "#666666" },
        paper: "#f5f5f5",
        surface: { DEFAULT: "#ffffff", alt: "#f0f0f0" },
        primary: "#1565c0",
        front: "#fde68a",
      },
      borderRadius: {
        DEFAULT: "10px", // matches Math Bingo's --radius
      },
      boxShadow: {
        topbar: "0 2px 8px rgba(0, 0, 0, 0.12)",
      },
    },
  },
  plugins: [],
};
