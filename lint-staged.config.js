const path = require("path");

module.exports = {
  // Run ESLint with auto-fix for Web workspace
  "apps/web/**/*.{js,jsx,ts,tsx}": (filenames) => {
    const files = filenames.map((f) => `"${path.resolve(f)}"`).join(" ");
    return `pnpm --filter=web exec eslint --fix ${files}`;
  },

  // Run ESLint with auto-fix for Mobile workspace
  "apps/mobile/**/*.{js,jsx,ts,tsx}": (filenames) => {
    const files = filenames.map((f) => `"${path.resolve(f)}"`).join(" ");
    return `pnpm --filter=mobile exec eslint --fix ${files}`;
  },

  // Run Prettier formatting on all relevant files
  "**/*.{js,jsx,ts,tsx,json,css,scss,md,yaml,yml}": (filenames) => {
    const files = filenames
      .filter((f) => !f.replace(/\\/g, "/").endsWith("AGENTS.md"))
      .map((f) => `"${path.resolve(f)}"`);

    return files.length > 0 ? `prettier --write --ignore-unknown ${files.join(" ")}` : [];
  },
};
