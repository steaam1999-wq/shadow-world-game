import { describe, it, expect } from "vitest";
import { pages, readPage, pageNames } from "../src/navigation";
describe("Адреса игровых экранов", () => {
  it("открывает каждый отдельный экран по прямому адресу", () => {
    for (const p of pages) {
      expect(readPage("#" + p)).toBe(p);
      expect(readPage("#/" + p)).toBe(p);
      expect(pageNames[p].length).toBeGreaterThan(0);
    }
  });
  it("открывает профиль при первом входе или неизвестном адресе", () => {
    for (const hash of ["", "#unknown", "#toString", "#profile/missing"])
      expect(readPage(hash)).toBe("profile");
  });
});
