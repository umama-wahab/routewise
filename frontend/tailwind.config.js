/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        bg: "#F7F7F5",
        card: "#FFFFFF",
        ink: "#171717",
        muted: "#6B7280",
        border: "#ECECEC",
        accent: "#3C8D89",
        "accent-secondary": "#5E8BFF",
        warning: "#F2A93B",
        success: "#43B581",
        error: "#E55C5C",
      },
      fontFamily: {
        sans: ["Plus Jakarta Sans", "Inter", "system-ui", "sans-serif"],
      },
      fontSize: {
        hero: ["40px", { lineHeight: "1.15", fontWeight: "700" }],
        section: ["28px", { lineHeight: "1.25", fontWeight: "700" }],
        "card-number": ["30px", { lineHeight: "1.2", fontWeight: "700" }],
        body: ["15px", { lineHeight: "1.6", fontWeight: "400" }],
        caption: ["13px", { lineHeight: "1.4", fontWeight: "500" }],
      },
      spacing: {
        "sp-card": "24px",
        "sp-section": "40px",
        "sp-pad": "32px",
      },
      borderRadius: {
        card: "28px",
        button: "18px",
        input: "16px",
      },
      boxShadow: {
        soft: "0 1px 2px rgba(23,23,23,0.04), 0 8px 24px rgba(23,23,23,0.05)",
        floating: "0 12px 40px rgba(23,23,23,0.08)",
      },
      keyframes: {
        "fade-in-up": {
          "0%": { opacity: 0, transform: "translateY(8px)" },
          "100%": { opacity: 1, transform: "translateY(0)" },
        },
        shimmer: {
          "0%": { backgroundPosition: "-400px 0" },
          "100%": { backgroundPosition: "400px 0" },
        },
      },
      animation: {
        "fade-in-up": "fade-in-up 0.4s ease-out both",
        shimmer: "shimmer 1.4s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};
