import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#f0f7ff",
          100: "#e0effe",
          200: "#bae0fd",
          300: "#7cc6fc",
          400: "#36a9f8",
          500: "#0c8de9",
          600: "#026fc7",
          700: "#0359a1",
          800: "#074c84",
          900: "#0c406e",
          950: "#082949",
        },
        whatsapp: {
          light: "#EFEAE2",
          bubbleSent: "#D9FDD3",
          bubbleReceived: "#FFFFFF",
          teal: "#075E54",
          green: "#25D366",
          darkGreen: "#128C7E",
          check: "#53bdeb",
        }
      },
    },
  },
  plugins: [],
};
export default config;
