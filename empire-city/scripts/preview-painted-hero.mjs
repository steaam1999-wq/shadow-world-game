import { transformWithEsbuild } from "vite";
import { readFile, writeFile, mkdir } from "node:fs/promises";
import { pathToFileURL } from "node:url";
import path from "node:path";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import sharp from "sharp";
await mkdir("preview", { recursive: true });
await mkdir("node_modules/.cache", { recursive: true });
let code = (
  await transformWithEsbuild(
    await readFile("src/PaintedAvatar.tsx", "utf8"),
    "PaintedAvatar.tsx",
    { jsx: "automatic", format: "esm" },
  )
).code;
for (const name of ["paintedHero", "avatarAssets"])
  code = code.replaceAll(
    `"./${name}"`,
    JSON.stringify(pathToFileURL(path.resolve(`src/${name}.ts`)).href),
  );
const target = path.resolve("node_modules/.cache/painted-preview.mjs");
await writeFile(target, code);
const { PaintedAvatar } = await import(
  pathToFileURL(target).href + "?v=" + Date.now()
);
const ids = [
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
const data = Object.fromEntries(
  await Promise.all(
    ids.map(async (id) => [
      id,
      "data:image/png;base64," +
        (
          await sharp(`public/art/painted-hero/${id}.webp`).png().toBuffer()
        ).toString("base64"),
    ]),
  ),
);
const outfit = (entries) =>
  Object.fromEntries(
    ["head", "chest", "weapon", "legs", "feet"].map((slot) => [
      slot,
      entries[slot] ? { visualAssetId: entries[slot] } : null,
    ]),
  );
const variants = [
  {},
  {
    chest: "coat.charcoal",
    legs: "trousers.charcoal",
    feet: "oxfords.black",
    head: "fedora.charcoal",
    weapon: "cane.walnut",
  },
  {
    chest: "tee.black",
    legs: "jeans.blue",
    feet: "sneakers.white",
    head: "cap.black",
  },
  {
    chest: "hoodie.gray",
    legs: "cargo.olive",
    feet: "sneakers.white",
    weapon: "gloves.black",
  },
];
const render = async (e) =>
  sharp(
    Buffer.from(
      renderToStaticMarkup(
        createElement(PaintedAvatar, {
          equipment: outfit(e),
          assetHref: (id) => data[id],
          idPrefix: "qa",
        }),
      ),
    ),
  )
    .resize(320, 640)
    .png()
    .toBuffer();
const layers = await Promise.all(
  variants.map(async (e, i) => ({
    input: await render(e),
    left: i * 320,
    top: 0,
  })),
);
await sharp({
  create: { width: 1280, height: 640, channels: 4, background: "#30443a" },
})
  .composite(layers)
  .png()
  .toFile("preview/painted-outfits-qa.png");
const office = await sharp("public/art/profile-office.webp")
  .resize(375, 667, { fit: "cover" })
  .png()
  .toBuffer();
const figure = await render(variants[1]);
await sharp(office)
  .composite([{ input: figure, left: 27, top: 12 }])
  .png()
  .toFile("preview/painted-profile-qa.png");
console.log("preview/painted-outfits-qa.png");

const master = await sharp("public/art/painted-hero/classic-master.webp")
  .resize(307, 640, { fit: "contain", background: "#0000" })
  .png()
  .toBuffer();
await sharp(office)
  .composite([{ input: master, left: 34, top: 12 }])
  .png()
  .toFile("preview/hero-reference-preview.png");
console.log("preview/hero-reference-preview.png");
