import sharp from "sharp";
import { readFile, writeFile } from "node:fs/promises";

const svg = await readFile("public/logo.svg");

// master render 1024px
const master = await sharp(svg, { density: 300 })
  .resize(1024, 1024)
  .png()
  .toBuffer();

const stats = await sharp(master).stats();
console.log(
  "channels min/max:",
  stats.channels.map((c) => `${c.min}-${c.max}`).join("  "),
);

await writeFile("public/logo.png", master);

// manifest / favicon sizes
for (const size of [192, 512]) {
  const buf = await sharp(master).resize(size, size).png().toBuffer();
  await writeFile(`public/logo-${size}.png`, buf);
}
console.log("written: logo.png (1024), logo-192.png, logo-512.png");
