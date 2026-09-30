/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,tsx}",
    "./features/**/*.{js,ts,tsx}",
    "./components/**/*.{js,ts,tsx}",
  ],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: "#0B927E",
          dark: "#064E4B",
          hover: "#087565",
          light: "#DDF4ED",
          bg: "#F0FAF7",
          pageBg: "#F8FAF9",
        },
        cta: {
          DEFAULT: "#FF702E",
          hover: "#E85D1B",
          light: "#FFE8DB",
        },
        neutral: {
          main: "#102A2E",
          muted: "#647B80",
          dark: "#173A3A",
          border: "#E1E8E8",
          bg: "#F8FAF9",
        },
      },
    },
  },
  plugins: [],
};
