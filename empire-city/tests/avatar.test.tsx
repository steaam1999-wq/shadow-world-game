// @vitest-environment jsdom
import { describe, it, expect } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { AvatarRig } from "../src/AvatarRig";
import { emptyEquipment, gearCatalog, type Equipment } from "../src/equipment";
const render = (equipment: Equipment) => {
  const host = document.createElement("div");
  host.innerHTML = renderToStaticMarkup(
    <AvatarRig
      equipment={equipment}
      headHref="/art/faces/street.webp"
      idPrefix="test"
    />,
  );
  return host;
};
describe("Совместимость рисованной экипировки", () => {
  it("собирает все 288 сочетаний в одном холсте без деформации одежды или дублирующих слоёв", () => {
    let count = 0;
    const geometry = new Map<string, string>();
    for (const chest of [
      null,
      gearCatalog["gear.tee"],
      gearCatalog["gear.hoodie"],
      gearCatalog["gear.coat"],
    ])
      for (const legs of [
        null,
        gearCatalog["gear.jeans"],
        gearCatalog["gear.cargo"],
        gearCatalog["gear.tailored"],
      ])
        for (const feet of [
          null,
          gearCatalog["gear.sneakers"],
          gearCatalog["gear.oxfords"],
        ])
          for (const head of [
            null,
            gearCatalog["gear.cap"],
            gearCatalog["gear.fedora"],
          ])
            for (const weapon of [null, gearCatalog["gear.gloves"]]) {
              const e = { chest, legs, feet, head, weapon };
              const dom = render(e);
              expect(dom.querySelector("svg")?.getAttribute("viewBox")).toBe(
                "0 0 320 640",
              );
              expect(
                dom.querySelector("svg")?.getAttribute("preserveAspectRatio"),
              ).toBe("xMidYMid meet");
              // Clothing must be vector geometry in shared coordinates; only the face is a raster image.
              expect(dom.querySelectorAll("image")).toHaveLength(1);
              expect(
                dom.querySelectorAll("[data-visual-asset] image"),
              ).toHaveLength(0);
              for (const [slot, item] of Object.entries(e)) {
                const layer = dom.querySelectorAll(`[data-slot="${slot}"]`);
                expect(layer).toHaveLength(item ? 1 : 0);
                if (item) {
                  expect(layer[0].getAttribute("transform")).toBeNull();
                  const shape = layer[0].innerHTML;
                  const previous = geometry.get(item.id);
                  if (previous) expect(shape).toBe(previous);
                  else geometry.set(item.id, shape);
                }
              }
              for (const slot of ["chest", "legs", "feet"] as const)
                expect(
                  dom.querySelector(`[data-base-clothing="${slot}"]`) !== null,
                ).toBe(!e[slot]);
              count++;
            }
    expect(count).toBe(288);
    expect(geometry.size).toBe(11);
  });
  it("не подставляет чужой слот и сохраняет опрятную базовую одежду при неизвестном ассете", () => {
    const e = {
      ...emptyEquipment(),
      chest: gearCatalog["gear.cap"],
      feet: { ...gearCatalog["gear.sneakers"], visualAssetId: "missing" },
    };
    const dom = render(e);
    expect(dom.querySelectorAll("[data-visual-asset]")).toHaveLength(0);
    expect(dom.querySelectorAll("[data-base-clothing]")).toHaveLength(3);
    expect(dom.querySelector("image")?.getAttribute("clip-path")).toBeNull();
  });
  it("создаёт разные идентификаторы градиентов для профиля и предпросмотра", () => {
    const dom = document.createElement("div");
    dom.innerHTML = renderToStaticMarkup(
      <>
        <AvatarRig equipment={emptyEquipment()} />
        <AvatarRig equipment={emptyEquipment()} />
      </>,
    );
    const ids = Array.from(dom.querySelectorAll("[id]"), (e) => e.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const el of dom.querySelectorAll('[fill^="url(#"]')) {
      const id = el.getAttribute("fill")!.slice(5, -1);
      expect(ids).toContain(id);
    }
  });
});
