import type { Config } from "tailwindcss";

export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        oat: "#f7f0e2",
        parchment: "#fbf7ee",
        ink: "#1f1613",
        bronze: "#d18a4e",
        cinnabar: "#a52a1d",
        gold: "#f0bd52",
        jade: "#2f7d67",
        sky: "#8cb8c5"
      },
      fontFamily: {
        display: ["Cormorant Garamond", "serif"],
        body: ["Manrope", "sans-serif"]
      },
      boxShadow: {
        paper: "0 24px 60px rgba(70, 40, 20, 0.14)",
        stamp: "0 12px 24px rgba(165, 42, 29, 0.28)",
        plaque: "0 10px 20px rgba(173, 107, 29, 0.2)"
      },
      keyframes: {
        bob: {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-10px)" }
        },
        shimmer: {
          "0%": { backgroundPosition: "200% 0" },
          "100%": { backgroundPosition: "-200% 0" }
        },
        twinkle: {
          "0%, 100%": { opacity: "0.35", transform: "scale(0.85)" },
          "50%": { opacity: "1", transform: "scale(1.15)" }
        }
      },
      animation: {
        bob: "bob 4s ease-in-out infinite",
        shimmer: "shimmer 2.2s linear infinite",
        twinkle: "twinkle 1.8s ease-in-out infinite"
      }
    }
  },
  plugins: []
} satisfies Config;
