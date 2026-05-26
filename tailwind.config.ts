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
          navy: "#07131D",
          blue: "#00BCEB",
          "blue-dark": "#0097BE",
          "blue-light": "#E8F7FD",
          teal: "#00A3A6",
          mint: "#E3F9F7",
          ink: "#1A2B3C",
          muted: "#6B7A8D",
          line: "#E1E8EF",
          canvas: "#F3F6FA"
        }
      },
      boxShadow: {
        webex: "0 1px 4px rgba(0,0,0,0.08), 0 4px 12px rgba(0,0,0,0.06)",
        "webex-md": "0 4px 20px rgba(0,0,0,0.10), 0 1px 4px rgba(0,0,0,0.06)",
        "webex-lg": "0 8px 32px rgba(0,0,0,0.14), 0 2px 8px rgba(0,0,0,0.06)"
      },
      fontFamily: {
        sans: ["Inter", "ui-sans-serif", "system-ui", "Segoe UI", "sans-serif"]
      }
    }
  },
  plugins: []
};

export default config;
