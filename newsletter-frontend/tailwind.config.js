// tailwind.config.js
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}"
  ],
  theme: {
    extend: {
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0", transform: "scale(0.95)" },
          "100%": { opacity: "1", transform: "scale(1)" },
        },
        fadeInUp: {
          "0%": { opacity: "0", transform: "translateY(1rem)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
      },
      animation: {
        // your existing slow spin
        "spin-slow": "spin 10s linear infinite",
        // new custom animations
        "fade-in": "fadeIn 0.8s ease-out both",
        "fade-in-up": "fadeInUp 0.8s ease-out both",
      },
    },
  },
  plugins: [],
};
