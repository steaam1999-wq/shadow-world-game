/** Semantic assets share one tailored 320×640 rig. No per-item stretching. */
export const avatarFrame = { width: 320, height: 640 } as const;
export const avatarDrawOrder = [
  "legs",
  "feet",
  "chest",
  "head",
  "weapon",
] as const;
export const visualAssets = {
  "coat.charcoal": { slot: "chest", kind: "coat", color: "#25342f" },
  "trousers.charcoal": { slot: "legs", kind: "trousers", color: "#34414a" },
  "oxfords.black": { slot: "feet", kind: "oxfords", color: "#17282e" },
  "fedora.charcoal": { slot: "head", kind: "fedora", color: "#34443e" },
  "tee.black": { slot: "chest", kind: "tee", color: "#29343b" },
  "hoodie.gray": { slot: "chest", kind: "hoodie", color: "#52616b" },
  "cap.black": { slot: "head", kind: "cap", color: "#344249" },
  "cargo.olive": { slot: "legs", kind: "cargo", color: "#68775c" },
  "jeans.blue": { slot: "legs", kind: "jeans", color: "#405b75" },
  "sneakers.white": { slot: "feet", kind: "sneakers", color: "#e7e9dd" },
  "gloves.black": { slot: "weapon", kind: "gloves", color: "#303d43" },
} as const;
export type VisualAssetId = keyof typeof visualAssets;
export const avatarAnchors = {
  collar: { x: 160, y: 155 },
  waist: { x: 160, y: 350 },
  leftCuff: { x: 58, y: 347 },
  rightCuff: { x: 262, y: 347 },
  leftAnkle: { x: 112, y: 568 },
  rightAnkle: { x: 208, y: 568 },
} as const;
