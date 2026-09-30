import fs from "node:fs";
import path from "node:path";

// Directories and build artifact files to remove
const targets = [
  ".turbo",
  "apps/web/.next",
  "apps/web/.turbo",
  "apps/web/tsconfig.tsbuildinfo",
  "apps/mobile/.expo",
  "apps/mobile/.turbo",
  "apps/mobile/dist",
  "packages/shared/.turbo",
  "packages/shared/dist",
  "packages/shared/tsconfig.tsbuildinfo",
];

let removedCount = 0;

for (const target of targets) {
  const fullPath = path.resolve(process.cwd(), target);
  if (fs.existsSync(fullPath)) {
    try {
      fs.rmSync(fullPath, { recursive: true, force: true });
      console.log(`Removed: ${target}`);
      removedCount++;
    } catch (err) {
      console.warn(`Failed to remove ${target}:`, err.message);
    }
  }
}

if (removedCount === 0) {
  console.log("Everything is already clean.");
} else {
  console.log(`Clean complete. Removed ${removedCount} target(s).`);
}
