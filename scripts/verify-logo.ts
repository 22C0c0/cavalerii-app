import sharp from "sharp";
import { readFile, writeFile } from "node:fs/promises";

const svg = await readFile("public/logo.svg");
const noText = svg.toString().replace(/<text[\s\S]*?<\/text>/g, "");

const withText = await sharp(
  Buffer.from(svg), { density: 300 }
).resize(1024, 1024).raw().toBuffer();
const withoutText = await sharp(
  Buffer.from(noText), { density: 300 }
).resize(1024, 1024).raw().toBuffer();

let diff = 0;
for (let i = 0; i < withText.length; i++) {
  if (Math.abs(withText[i] - withoutText[i]) > 10) diff++;
}
console.log("differing bytes:", diff, "of", withText.length);
console.log(diff > 5000 ? "TEXT IS RENDERED ✓" : "TEXT MISSING ✗");

// also check the CAVALERII banner strip specifically (x 90..960, y 590..745)
const W = 1024, CH = 4;
let bannerLit = 0;
for (let y = 590; y < 745; y++) {
  for (let x = 90; x < 960; x++) {
    const p = (y * W + x) * CH;
    if (withText[p] > 200 && withText[p + 1] > 200 && withText[p + 2] > 200) bannerLit++;
  }
}
console.log("white pixels in CAVALERII banner:", bannerLit);
