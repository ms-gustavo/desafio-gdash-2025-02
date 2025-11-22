/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx,js,jsx}"],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: "#4C6FFF",
          dark: "#3B59D4",
        },
        accent: "#9F7AEA",
        background: "#F7F9FC",
        surface: "#FFFFFF",
        text: {
          DEFAULT: "#1A1A1A",
          muted: "#6B7280",
        },
        border: "#E5E7EB",
        sky: {
          light: "#DCE8FF",
          dark: "#1E293B",
        },
        wind: "#A0AEC0",
        storm: "#334155",
      },
      borderRadius: {
        xl: "12px",
      },
      boxShadow: {
        card: "0 4px 16px rgba(0, 0, 0, 0.06)",
      },
    },
  },
  plugins: [],
};
