import sharp from "sharp";
import { mkdir, access } from "node:fs/promises";
import path from "node:path";
const source = process.argv[2];
if (!source)
  throw new Error(
    "Usage: node scripts/prepare-art.mjs <directory containing city.png, residents.png, player.png, districts.png>",
  );
await mkdir("public/art", { recursive: true });
for (const name of [
  "city",
  "residents",
  "player",
  "districts",
  "character",
  "medallions",
]) {
  const input = path.join(source, `${name}.png`);
  const output = `public/art/${name}.webp`;
  if (["character", "medallions"].includes(name)) {
    try {
      await access(input);
    } catch {
      console.log(
        `${name}: optional source not provided; existing asset retained`,
      );
      continue;
    }
  }
  const meta = await sharp(input).metadata();
  await sharp(input).webp({ quality: 88, effort: 6 }).toFile(output);
  console.log(`${name}: ${meta.width}×${meta.height} → ${output}`);
}
