const path = require("path");

const CHUNK_SIZE = 15;

function chunkArray(array, size) {
  const chunks = [];
  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size));
  }
  return chunks;
}

module.exports = {
  // Run ESLint with auto-fix for Web workspace
  "apps/web/**/*.{js,jsx,ts,tsx}": (filenames) => {
    if (filenames.length === 0) return [];
    const webRoot = path.join(process.cwd(), "apps", "web");
    const relFiles = filenames.map((f) => `"${path.relative(webRoot, f).replace(/\\/g, "/")}"`);
    return chunkArray(relFiles, CHUNK_SIZE).map(
      (chunk) => `pnpm --filter=web exec eslint --fix ${chunk.join(" ")}`
    );
  },

  // Run ESLint with auto-fix for Mobile workspace
  "apps/mobile/**/*.{js,jsx,ts,tsx}": (filenames) => {
    if (filenames.length === 0) return [];
    const mobileRoot = path.join(process.cwd(), "apps", "mobile");
    const relFiles = filenames.map((f) => `"${path.relative(mobileRoot, f).replace(/\\/g, "/")}"`);
    return chunkArray(relFiles, CHUNK_SIZE).map(
      (chunk) => `pnpm --filter=mobile exec eslint --fix ${chunk.join(" ")}`
    );
  },

  // Run Prettier formatting on all relevant files
  "**/*.{js,jsx,ts,tsx,json,css,scss,md,yaml,yml}": (filenames) => {
    const files = filenames
      .filter((f) => !f.replace(/\\/g, "/").endsWith("AGENTS.md"))
      .map((f) => `"${path.relative(process.cwd(), f).replace(/\\/g, "/")}"`);

    if (files.length === 0) return [];
    return chunkArray(files, 25).map(
      (chunk) => `prettier --write --ignore-unknown ${chunk.join(" ")}`
    );
  },
};
