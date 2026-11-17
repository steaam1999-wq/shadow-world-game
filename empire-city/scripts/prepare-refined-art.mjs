import sharp from "sharp";
import { mkdir } from "node:fs/promises";
const [map, scenes, emblems] = process.argv.slice(2);
if (!map || !scenes || !emblems)
  throw Error("Pass map PNG, 3x2 scenes PNG, and 5x4 transparent emblems PNG.");
await mkdir("public/art/scenes", { recursive: true });
await mkdir("public/art/emblems", { recursive: true });
await sharp(map)
  .resize({ width: 1024, withoutEnlargement: true })
  .webp({ quality: 90, effort: 5 })
  .toFile("public/art/world-map-calm.webp");
const sceneNames = ["street", "bar", "ring", "office", "wardrobe", "desk"];
const extract = async (file, columns, rows, names, folder, size) => {
  const m = await sharp(file).metadata();
  for (const [i, name] of names.entries()) {
    const x = i % columns,
      y = Math.floor(i / columns),
      left = Math.round((x * m.width) / columns),
      top = Math.round((y * m.height) / rows),
      right = Math.round(((x + 1) * m.width) / columns),
      bottom = Math.round(((y + 1) * m.height) / rows);
    await sharp(file)
      .extract({ left, top, width: right - left, height: bottom - top })
      .resize(size, size, { fit: "contain", background: "#0000" })
      .webp({ quality: 92, effort: 5 })
      .toFile(`${folder}/${name}.webp`);
  }
};
await extract(scenes, 3, 2, sceneNames, "public/art/scenes", 600);
await extract(
  emblems,
  5,
  4,
  Array.from({ length: 20 }, (_, i) => String(i)),
  "public/art/emblems",
  192,
);
console.log("Calm map, 6 scenes and 20 restrained emblems prepared.");
