import { mkdir, copyFile, readdir } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const distDir = join(__dirname, "dist");
const iconsDir = join(__dirname, "icons");

await mkdir(join(distDir, "icons"), { recursive: true });
await copyFile(join(__dirname, "manifest.json"), join(distDir, "manifest.json"));

for (const file of await readdir(iconsDir)) {
  await copyFile(join(iconsDir, file), join(distDir, "icons", file));
}
