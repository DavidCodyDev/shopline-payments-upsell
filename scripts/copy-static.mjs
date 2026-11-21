import { cpSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const pairs = [
  ["src/admin/public", "dist/admin/public"],
  ["src/thank-you/public", "dist/thank-you/public"],
];

for (const [from, to] of pairs) {
  const dest = join(root, to);
  mkdirSync(dirname(dest), { recursive: true });
  cpSync(join(root, from), dest, { recursive: true });
  console.log(`Copied ${from} → ${to}`);
}
