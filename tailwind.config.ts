import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}"
  ],
  theme: {
    extend: {
      colors: {
        webex: {
          navy: "#071B33",
          blue: "#0A84FF",
          cyan: "#00BCEB",
          teal: "#00A3A6",
          mint: "#DFF7F4",
          ink: "#172B4D",
          muted: "#5E6C84",
          line: "#DDE7F0",
          canvas: "#F5F8FB"
        }
      },
      boxShadow: {
        webex: "0 12px 28px rgba(7, 27, 51, 0.08)"
      },
      fontFamily: {
        sans: ["Inter", "ui-sans-serif", "system-ui", "Segoe UI", "sans-serif"]
      }
    }
  },
  plugins: []
};

export default config;
