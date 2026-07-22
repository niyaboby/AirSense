/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        darkBg: "#0B1120",
        darkCard: "#131C31",
        darkCardHeader: "#192540",
        borderDark: "#263554",
        textLight: "#F8FAFC",
        textMuted: "#94A3B8",
        cyanAccent: "#38BDF8",
        indigoAccent: "#6366F1",
        aqi: {
          good: "#22C55E",
          moderate: "#EAB308",
          poor: "#F97316",
          veryPoor: "#EF4444",
          severe: "#991B1B",
        },
      },
      fontFamily: {
        sans: ["Inter", "ui-sans-serif", "system-ui", "sans-serif"],
        mono: ["'JetBrains Mono'", "ui-monospace", "monospace"],
      },
      borderRadius: {
        xl: "12px",
        "2xl": "16px",
      },
      boxShadow: {
        darkCard: "0 10px 30px -5px rgba(0, 0, 0, 0.5), inset 0 1px 0 0 rgba(255, 255, 255, 0.05)",
      },
    },
  },
  plugins: [],
};
