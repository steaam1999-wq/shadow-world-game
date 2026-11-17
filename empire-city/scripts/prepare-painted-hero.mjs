import sharp from "sharp";
import { mkdir } from "node:fs/promises";
const file = process.argv[2];
if (!file) throw Error("Pass the original 6x2 transparent wardrobe PNG.");
await mkdir("public/art/painted-hero", { recursive: true });
await mkdir("public/art/painted-gear", { recursive: true });
const m = await sharp(file).metadata();
const names = [
  "base",
  "tee.black",
  "hoodie.gray",
  "cap.black",
  "cargo.olive",
  "jeans.blue",
  "sneakers.white",
  "gloves.black",
  "coat.charcoal",
  "trousers.charcoal",
  "oxfords.black",
  "fedora.charcoal",
];
for (const [i, name] of names.entries()) {
  const x = i % 6,
    y = Math.floor(i / 6),
    left = Math.round((x * m.width) / 6),
    top = Math.round((y * m.height) / 2),
    right = Math.round(((x + 1) * m.width) / 6),
    bottom = Math.round(((y + 1) * m.height) / 2);
  await sharp(file)
    .extract({
      left: left + 2,
      top: top + 2,
      width: right - left - 4,
      height: bottom - top - 4,
    })
    .extend({ top: 2, bottom: 2, left: 2, right: 2, background: "#0000" })
    .webp({ quality: 95, effort: 6 })
    .toFile(`public/art/painted-hero/${name}.webp`);
}
console.log(
  "12 registered painted layers prepared; source proportions preserved.",
);

for (const name of names.slice(1)) {
  const tile = await sharp(`public/art/painted-hero/${name}.webp`)
    .trim()
    .png()
    .toBuffer();
  await sharp(tile)
    .resize(144, 144, { fit: "contain", background: "#0000" })
    .webp({ quality: 93, effort: 6 })
    .toFile(`public/art/painted-gear/${name}.webp`);
}
await sharp("public/art/painted-hero/base.webp")
  .extract({ left: 97, top: 4, width: 79, height: 110 })
  .resize({ height: 320 })
  .webp({ quality: 94, effort: 6 })
  .toFile("public/art/faces/veteran.webp");
