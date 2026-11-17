import type { Appearance } from "./appearance";
import type { DistrictId } from "./data";
/** Shared by the real profile and its appearance preview. */
export function profileBackdrop(
  appearance: Appearance,
  district: DistrictId,
): string {
  const file =
    appearance.backdrop === "office"
      ? "profile-lounge"
      : appearance.backdrop === "club"
        ? "districts/ring"
        : `districts/${district}`;
  return `${import.meta.env.BASE_URL}art/${file}.webp`;
}
