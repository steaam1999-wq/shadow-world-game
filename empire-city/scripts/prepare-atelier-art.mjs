import sharp from "sharp";
import { mkdir } from "node:fs/promises";
const [people, districts] = process.argv.slice(2);
if (!people || !districts)
  throw Error("Pass the square 4x4 residents sheet and 3x2 district sheet.");
await sharp(people)
  .webp({ quality: 93, effort: 5 })
  .toFile("public/art/residents-atelier.webp");
await mkdir("public/art/districts", { recursive: true });
const m = await sharp(districts).metadata();
for (const [i, name] of [
  "center",
  "kings",
  "old",
  "industrial",
  "west",
  "ring",
].entries()) {
  const x = i % 3,
    y = Math.floor(i / 3),
    left = Math.round((x * m.width) / 3),
    top = Math.round((y * m.height) / 2),
    right = Math.round(((x + 1) * m.width) / 3),
    bottom = Math.round(((y + 1) * m.height) / 2);
  await sharp(districts)
    .extract({ left, top, width: right - left, height: bottom - top })
    .resize(600, 600, { fit: "contain", background: "#172d24" })
    .webp({ quality: 93, effort: 5 })
    .toFile(`public/art/districts/${name}.webp`);
}
console.log("16 refined portraits and six district scenes prepared.");
