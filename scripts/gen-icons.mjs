// Rasterize public/icon.svg → the PNG app-icon set. Run: `node scripts/gen-icons.mjs`
// (dev-only; the generated PNGs are committed, so CI/Pages never runs this).
import { Resvg } from "@resvg/resvg-js";
import { readFileSync, writeFileSync } from "node:fs";

const svg = readFileSync(new URL("../public/icon.svg", import.meta.url));
const targets = [
  ["apple-touch-icon", 180],
  ["icon-192", 192],
  ["icon-512", 512],
];

for (const [name, size] of targets) {
  const png = new Resvg(svg, { fitTo: { mode: "width", value: size } }).render().asPng();
  writeFileSync(new URL(`../public/${name}.png`, import.meta.url), png);
  console.log(`wrote public/${name}.png (${size}×${size}, ${png.length} bytes)`);
}
