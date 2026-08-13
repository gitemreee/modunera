import { readdir, readFile, rm, writeFile } from "node:fs/promises";
import { extname, join, relative } from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = fileURLToPath(new URL("../", import.meta.url));
const allowedExtensions = new Set([
  ".css",
  ".csv",
  ".html",
  ".js",
  ".json",
  ".md",
  ".py",
  ".txt",
  ".webmanifest",
  ".xml",
]);
const skippedDirectories = new Set([".git", ".github", "node_modules"]);
const skippedFiles = new Set([
  "tools/rebrand-modunera.mjs",
  "downloads/mc-tiny-germany-broschuere.pdf",
]);
const removedLegacyAssets = [
  "assets/images/mc-tiny-logo.png",
  "downloads/mc-tiny-germany-broschuere.pdf",
];

const replacements = [
  ["https://www.mctiny.com/de/", "https://modunera.com/"],
  ["https://www.mctiny.com/de", "https://modunera.com"],
  ["https://mctiny.com/de/", "https://modunera.com/"],
  ["https://mctiny.com/de", "https://modunera.com"],
  ["http://www.mctiny.com/de/", "https://modunera.com/"],
  ["http://www.mctiny.com/de", "https://modunera.com"],
  ["www.mctiny.com/de/", "modunera.com/"],
  ["www.mctiny.com/de", "modunera.com"],
  ["mctiny.com/de/", "modunera.com/"],
  ["mctiny.com/de", "modunera.com"],
  ["https://www.mctiny.com/", "https://modunera.com/"],
  ["https://www.mctiny.com", "https://modunera.com"],
  ["https://mctiny.com/", "https://modunera.com/"],
  ["https://mctiny.com", "https://modunera.com"],
  ["www.mctiny.com", "modunera.com"],
  ["mctiny.com", "modunera.com"],
  ["MC-Tiny-Germany-Broschuere.pdf", "mc-tiny-germany-broschuere.pdf"],
  ["mc-tiny-logo.png", "modunera-logo.png"],
  ["mc-tiny-konfiguration.txt", "modunera-konfiguration.txt"],
  ["mc-tiny-leads.csv", "modunera-leads.csv"],
  ["MC Tiny", "MODUNERA"],
  ["MC TINY", "MODUNERA"],
  ["MC-Tiny", "MODUNERA"],
  ["MC-TINY", "MODUNERA"],
  ["Mc-Tiny", "MODUNERA"],
  ["Mc Tiny", "MODUNERA"],
  ["MCTINY", "MODUNERA"],
  // Normalises the mixed-case spelling left by the earlier partial rebrand so the
  // wordmark reads MODUNERA on every page. Lowercase "modunera" is untouched, which
  // keeps modunera.com and the modunera-*.png asset names intact.
  ["Modunera", "MODUNERA"],
  // Product codes are MD 1 – MD 8. Only the spaced display form and the model URLs
  // move; the gallery filenames (mc1-exterior.webp) and the JavaScript model keys
  // (mc1…mc8) stay, since the keys appear in designs already saved to localStorage.
  ["MC 1", "MD 1"], ["MC 2", "MD 2"], ["MC 3", "MD 3"], ["MC 4", "MD 4"],
  ["MC 5", "MD 5"], ["MC 6", "MD 6"], ["MC 7", "MD 7"], ["MC 8", "MD 8"],
  ["modelle/mc-1", "modelle/md-1"], ["modelle/mc-2", "modelle/md-2"],
  ["modelle/mc-3", "modelle/md-3"], ["modelle/mc-4", "modelle/md-4"],
  ["modelle/mc-5", "modelle/md-5"], ["modelle/mc-6", "modelle/md-6"],
  ["modelle/mc-7", "modelle/md-7"], ["modelle/mc-8", "modelle/md-8"],
];

let scannedFiles = 0;
let changedFiles = 0;
let replacementsMade = 0;

async function walk(directory) {
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    if (entry.isDirectory() && skippedDirectories.has(entry.name)) continue;

    const absolutePath = join(directory, entry.name);
    if (entry.isDirectory()) {
      await walk(absolutePath);
      continue;
    }

    const repoPath = relative(repoRoot, absolutePath).replaceAll("\\", "/");
    if (
      skippedFiles.has(repoPath) ||
      !allowedExtensions.has(extname(entry.name).toLowerCase())
    ) {
      continue;
    }

    scannedFiles += 1;
    const original = await readFile(absolutePath, "utf8");
    let updated = original;

    for (const [from, to] of replacements) {
      const parts = updated.split(from);
      if (parts.length > 1) {
        replacementsMade += parts.length - 1;
        updated = parts.join(to);
      }
    }

    if (updated !== original) {
      await writeFile(absolutePath, updated, "utf8");
      changedFiles += 1;
    }
  }
}

await walk(repoRoot);
for (const asset of removedLegacyAssets) {
  await rm(join(repoRoot, asset), { force: true });
}

console.log(
  JSON.stringify({
    brand: "MODUNERA",
    domain: "https://modunera.com",
    scannedFiles,
    changedFiles,
    replacementsMade,
  })
);
