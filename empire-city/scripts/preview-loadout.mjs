// Render the SAME tailored SVG rig used by React. This is graphics QA, not a browser.
import { transformWithEsbuild } from "vite";
import { readFile, writeFile, mkdir } from "node:fs/promises";
import { pathToFileURL } from "node:url";
import path from "node:path";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import sharp from "sharp";
await mkdir("preview", { recursive: true });
import { visualAssets } from "../src/avatarAssets.ts";
import { faces } from "../src/appearance.ts";
const cache = path.resolve("node_modules/.cache");
await mkdir(cache, { recursive: true });
const input = await readFile("src/AvatarRig.tsx", "utf8");
const transformed = await transformWithEsbuild(input, "AvatarRig.tsx", {
  jsx: "automatic",
  format: "esm",
});
const code = transformed.code.replaceAll(
  '"./avatarAssets"',
  JSON.stringify(pathToFileURL(path.resolve("src/avatarAssets.ts")).href),
);
const target = path.join(cache, "avatar-rig-preview.mjs");
await writeFile(target, code);
const { AvatarRig } = await import(
  pathToFileURL(target).href + "?v=" + Date.now()
);
// librsvg used by sharp needs PNG for an embedded raster image.
const heads = Object.fromEntries(
  await Promise.all(
    Object.entries(faces).map(async ([id, face]) => [
      id,
      (
        await sharp(`public/art/faces/${face.asset}.webp`).png().toBuffer()
      ).toString("base64"),
    ]),
  ),
);
const empty = () => ({
  head: null,
  chest: null,
  weapon: null,
  legs: null,
  feet: null,
});
const selected = process.argv.slice(2);
const defaults = [
  "sneakers.white",
  "jeans.blue",
  "tee.black",
  "cap.black",
  "gloves.black",
];
const outfit = (ids) => {
  const e = empty();
  for (const id of ids) {
    if (!visualAssets[id]) throw Error("Unknown visual asset: " + id);
    e[visualAssets[id].slot] = { visualAssetId: id };
  }
  return e;
};
const render = async (ids, index = 0, faceId = "street") => {
  const svg = renderToStaticMarkup(
    createElement(AvatarRig, {
      equipment: outfit(ids),
      headHref: "data:image/png;base64," + heads[faceId],
      idPrefix: "qa" + index,
      skin: faces[faceId].skin,
    }),
  );
  return sharp(Buffer.from(svg)).resize(320, 640).png().toBuffer();
};
await sharp(await render(selected.length ? selected : defaults))
  .flatten({ background: "#283c34" })
  .png()
  .toFile("preview/avatar-preview.png");
const variants = [
  [],
  ["tee.black", "jeans.blue", "sneakers.white"],
  ["hoodie.gray", "cargo.olive", "sneakers.white"],
  defaults,
];
const sheets = await Promise.all(
  variants.map(async (ids, i) => ({
    input: await render(ids, i),
    left: i * 320,
    top: 0,
  })),
);
await sharp({
  create: { width: 1280, height: 640, channels: 4, background: "#283c34" },
})
  .composite(sheets)
  .png()
  .toFile("preview/avatar-outfits-preview.png");
await mkdir("public/art/gear-ink", { recursive: true });
for (const id of Object.keys(visualAssets)) {
  const svg = renderToStaticMarkup(
    createElement(AvatarRig, {
      equipment: empty(),
      onlyAsset: id,
      idPrefix: "thumb",
    }),
  );
  const png = await sharp(Buffer.from(svg)).png().toBuffer();
  await sharp(png)
    .trim()
    .resize(144, 144, { fit: "contain", background: "#0000" })
    .webp({ quality: 92, effort: 6 })
    .toFile(`public/art/gear-ink/${id}.webp`);
}
console.log("preview/avatar-preview.png");
console.log("preview/avatar-outfits-preview.png");
const classic = [
  "coat.charcoal",
  "trousers.charcoal",
  "oxfords.black",
  "fedora.charcoal",
];
const profiles = await Promise.all(
  Object.keys(faces).map(async (faceId, i) => ({
    input: await render(classic, i, faceId),
    left: i * 320,
    top: 0,
  })),
);
await sharp({
  create: { width: 1280, height: 640, channels: 4, background: "#283c34" },
})
  .composite(profiles)
  .png()
  .toFile("preview/avatar-profiles-preview.png");
const office = await sharp("public/art/profile-office.webp")
  .resize(375, 667, { fit: "cover" })
  .png()
  .toBuffer();
const figure = await sharp(await render(classic, 20, "veteran"))
  .resize({ height: 640 })
  .png()
  .toBuffer();
await sharp(office)
  .composite([{ input: figure, left: 27, top: 10 }])
  .png()
  .toFile("preview/mafia-profile-art-preview.png");
console.log("preview/avatar-profiles-preview.png");
console.log(
  `${Object.keys(visualAssets).length} matching illustrated item thumbnails generated.`,
);
