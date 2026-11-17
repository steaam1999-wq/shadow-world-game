import sharp from "sharp";
import { mkdir, access } from "node:fs/promises";
import path from "node:path";
const source = process.argv[2];
if (!source)
  throw Error(
    "Usage: node scripts/prepare-art.mjs <directory with illustration PNG files>",
  );
await mkdir("public/art", { recursive: true });
// Each pack is optional; preserve existing art when its source is absent.
for (const name of [
  "city-modern",
  "world-map",
  "city-hub",
  "profile-office",
  "residents-ink",
  "fighters-ink",
]) {
  const file = path.join(source, name + ".png");
  try {
    await access(file);
  } catch {
    continue;
  }
  const image = sharp(file);

  await image
    .webp({ quality: 92, effort: 6 })
    .toFile(`public/art/${name}.webp`);
}
const atlas = path.join(source, "game-icons.png");
let hasAtlas = true;
try {
  await access(atlas);
} catch {
  hasAtlas = false;
}
if (hasAtlas) {
  await mkdir("public/art/icons", { recursive: true });
  const meta = await sharp(atlas).metadata();
  for (let i = 0; i < 20; i++) {
    const col = i % 5,
      row = Math.floor(i / 5),
      left = Math.round((col * meta.width) / 5),
      top = Math.round((row * meta.height) / 4),
      right = Math.round(((col + 1) * meta.width) / 5),
      bottom = Math.round(((row + 1) * meta.height) / 4);
    await sharp(atlas)
      .extract({ left, top, width: right - left, height: bottom - top })
      .resize(192, 192, { fit: "contain", background: "#000" })
      .webp({ quality: 90, effort: 6 })
      .toFile(`public/art/icons/${i}.webp`);
  }
}

console.log(
  "Illustrations prepared. Run node scripts/preview-loadout.mjs for matching wearable thumbnails.",
);

// Four equal cells; retain transparent edges and source proportions.
const heads = path.join(source, "profile-heads.png");
try {
  await access(heads);
  await mkdir("public/art/faces", { recursive: true });
  const meta = await sharp(heads).metadata();
  for (const [i, name] of [
    "street",
    "veteran",
    "negotiator",
    "strategist",
  ].entries()) {
    const x = i % 2,
      y = Math.floor(i / 2),
      left = Math.round((x * meta.width) / 2),
      top = Math.round((y * meta.height) / 2);
    const tile = await sharp(heads)
      .extract({
        left,
        top,
        width: Math.round(((x + 1) * meta.width) / 2) - left,
        height: Math.round(((y + 1) * meta.height) / 2) - top,
      })
      .png()
      .toBuffer();
    await sharp(tile)
      .trim()
      .resize({ height: 640 })
      .webp({ quality: 94, effort: 6 })
      .toFile(`public/art/faces/${name}.webp`);
  }
} catch (error) {
  if (error.code !== "ENOENT") throw error;
}
