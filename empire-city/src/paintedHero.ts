/** Uniform registration only: x/y/scale never stretch a garment along one axis. */
export const paintedRegistration = {
  "tee.black": { x: 4, y: 4, scale: 0.96 },
  "hoodie.gray": { x: 12, y: 15, scale: 0.9 },
  "cap.black": { x: 6, y: -7, scale: 0.92 },
  "cargo.olive": { x: 8, y: 12, scale: 0.95 },
  "jeans.blue": { x: 8, y: 12, scale: 0.95 },
  "sneakers.white": { x: 0, y: 0, scale: 1 },
  "gloves.black": { x: 25, y: 25, scale: 0.9 },
  "coat.charcoal": { x: 5, y: 22, scale: 0.96 },
  "trousers.charcoal": { x: 8, y: 14, scale: 0.94 },
  "oxfords.black": { x: 0, y: 0, scale: 1 },
  "fedora.charcoal": { x: 42, y: -9, scale: 0.65 },
} as const;
export type PaintedAssetId = keyof typeof paintedRegistration;

import type { Equipment } from "./equipment";
export function usesPaintedMaster(e: Equipment): boolean {
  return (
    e.head?.visualAssetId === "fedora.charcoal" &&
    e.chest?.visualAssetId === "coat.charcoal" &&
    e.legs?.visualAssetId === "trousers.charcoal" &&
    e.feet?.visualAssetId === "oxfords.black" &&
    e.weapon === null
  );
}
