/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: "class",
  content: [
    "./app/**/*.{js,ts,tsx}",
    "./features/**/*.{js,ts,tsx}",
    "./components/**/*.{js,ts,tsx}",
  ],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        // ── Brand (Teal) ─────────────────────────────────────────
        brand: {
          DEFAULT: "#0B927E",
          dark: "#064E4B",
          hover: "#087565",
          active: "#065A4E",
          light: "#DDF4ED",
          bg: "#F0FAF7",
          pageBg: "#F8FAF9",
        },
        // ── CTA (Orange) ──────────────────────────────────────────
        cta: {
          DEFAULT: "#FF702E",
          hover: "#E85D1B",
          dark: "#D34D0F",
          light: "#FFE8DB",
        },
        // ── Neutrals ──────────────────────────────────────────────
        neutral: {
          main: "#102A2E",
          muted: "#647B80",
          dark: "#173A3A",
          border: "#E1E8E8",
          bg: "#F8FAF9",
        },
        // ── Semantic ──────────────────────────────────────────────
        success: "#0A9F8B",
        error: "#EF4444",
        warning: "#FF6B2C",
        info: "#3B82F6",

        // ── shadcn/RNR semantic aliases (mirror web CSS vars) ─────
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};
