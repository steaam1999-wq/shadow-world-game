import { describe, it, expect } from "vitest";
import postcss from "postcss";
import baseStyles from "../src/style.css?raw";
import sharedStyles from "../src/refined.css?raw";
import profileStyles from "../src/profile.css?raw";
const declarations = (selector: string) => {
  const result: Record<string, string> = {};
  postcss.parse(profileStyles).walkRules((rule) => {
    if (rule.selector === selector)
      rule.walkDecls((d) => {
        result[d.prop] = d.value;
      });
  });
  return result;
};
describe("Ограничения компактного профиля", () => {
  it("держит сцену в пределах 190–280 px на мобильных ширинах и оставляет fallback без svh", () => {
    const css = declarations(".profile-figure");
    const heights: string[] = [];
    postcss.parse(profileStyles).walkRules((rule) => {
      if (rule.selector === ".profile-figure")
        rule.walkDecls("height", (d) => {
          heights.push(d.value);
        });
    });
    expect(heights).toContain("232px");
    // Evaluate the values of the actual CSS declaration, not a separate sizing implementation.
    const match = css.height.match(
      /^clamp\((\d+)px,\s*min\((\d+)vw,\s*(\d+)svh\),\s*(\d+)px\)$/,
    );
    expect(match).not.toBeNull();
    const [, lo, vw, svh, hi] = match!.map(Number);
    for (const [width, height] of [
      [375, 667],
      [375, 812],
      [390, 844],
      [430, 932],
    ]) {
      const pixels = Math.min(
        hi,
        Math.max(lo, Math.min((width * vw) / 100, (height * svh) / 100)),
      );
      expect(pixels).toBeGreaterThanOrEqual(190);
      expect(pixels).toBeLessThanOrEqual(280);
      expect(pixels / height).toBeLessThan(0.4);
    }
  });
  it("не растягивает локацию и не наследует старые правила окна персонажа", () => {
    const css = declarations(".profile-location");
    expect(css.position).toBe("static");
    expect(css.top).toBeUndefined();
    expect(css.bottom).toBeUndefined();
    expect(css.height).toBe("auto");
    for (const source of [baseStyles, sharedStyles])
      postcss.parse(source).walkRules((rule) => {
        expect(rule.selector).not.toMatch(
          /\.(character-stage|stage-location|profile-scene|equipment-rail)(?![\w-])/,
        );
      });
    const avatar = declarations(".profile-avatar > .avatar-renderer");
    expect(avatar.position).toBe("relative");
    expect(avatar.inset).toBe("auto");
  });
});
