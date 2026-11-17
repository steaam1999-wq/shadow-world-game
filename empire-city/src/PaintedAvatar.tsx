import { useId } from "react";
import type { Equipment, EquipmentSlot } from "./equipment";
import { paintedRegistration, type PaintedAssetId } from "./paintedHero";
import { visualAssets, type VisualAssetId } from "./avatarAssets";
export function PaintedAvatar({
  equipment,
  assetHref = (id) => `${import.meta.env.BASE_URL}art/painted-hero/${id}.webp`,
  idPrefix,
}: {
  equipment: Equipment;
  assetHref?: (id: string) => string;
  idPrefix?: string;
}) {
  const unique = useId().replace(/:/g, "");
  const id = idPrefix ?? "painted" + unique;
  const active = (slot: EquipmentSlot) => {
    const item = equipment[slot];
    return item &&
      visualAssets[item.visualAssetId as VisualAssetId]?.slot === slot
      ? item
      : null;
  };
  return (
    <svg
      className="avatar-rig painted-avatar"
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 256 512"
      preserveAspectRatio="xMidYMid meet"
      role="img"
      aria-label="Главный герой: рисованный персонаж в полный рост"
    >
      <defs>
        <mask
          id={id + "-body"}
          maskUnits="userSpaceOnUse"
          x="0"
          y="0"
          width="256"
          height="512"
        >
          <rect width="256" height="512" fill="white" />
          {active("feet") && (
            <rect x="42" y="465" width="194" height="47" fill="black" />
          )}
          {active("legs") && (
            <path d="M80 239L188 239 204 466 53 466Z" fill="black" />
          )}
          {["coat.charcoal", "hoodie.gray"].includes(
            active("chest")?.visualAssetId ?? "",
          ) && (
            <path
              d="M43 120L104 98 109 115 153 115 165 103 207 125 210 174 197 240 80 240 76 172Z"
              fill="black"
            />
          )}
          {["coat.charcoal", "hoodie.gray"].includes(
            active("chest")?.visualAssetId ?? "",
          ) && (
            <path d="M186 144L211 160 241 251 221 267 199 230Z" fill="black" />
          )}
          {active("chest")?.visualAssetId === "coat.charcoal" && (
            <path d="M15 118H108L100 250H15Z" fill="black" />
          )}
          {active("head") && (
            <rect x="91" y="0" width="92" height="31" fill="black" />
          )}
        </mask>
        <clipPath id={id + "-coat-body"}>
          <path d="M0 0H179L190 168 200 235 216 308H256V512H0Z" />
        </clipPath>
        <clipPath id={id + "-coat-arm"}>
          <path d="M172 84H256V315H197L182 215Z" />
        </clipPath>
      </defs>
      <ellipse cx="139" cy="504" rx="93" ry="6" fill="#08120c" opacity=".24" />
      <image
        data-slot="base"
        href={assetHref("base")}
        x="0"
        y="0"
        width="256"
        height="512"
        preserveAspectRatio="xMidYMid meet"
        mask={`url(#${id}-body)`}
      />
      {(["legs", "feet", "chest", "head", "weapon"] as const).map((slot) => {
        const item = active(slot);
        if (!item) return null;
        const asset = paintedRegistration[item.visualAssetId as PaintedAssetId];
        if (!asset) return null;
        if (item.visualAssetId === "coat.charcoal")
          return (
            <g
              key={slot}
              data-slot={slot}
              data-visual-asset={item.visualAssetId}
            >
              <g
                transform={`translate(${asset.x} ${asset.y}) scale(${asset.scale})`}
              >
                <g transform="translate(177 119) rotate(2) scale(.8) translate(-177 -119)">
                  <image
                    href={assetHref(item.visualAssetId)}
                    width="256"
                    height="512"
                    preserveAspectRatio="xMidYMid meet"
                    clipPath={`url(#${id}-coat-arm)`}
                  />
                </g>
                <image
                  href={assetHref(item.visualAssetId)}
                  width="256"
                  height="512"
                  preserveAspectRatio="xMidYMid meet"
                  clipPath={`url(#${id}-coat-body)`}
                />
              </g>
            </g>
          );
        return (
          <g key={slot} data-slot={slot} data-visual-asset={item.visualAssetId}>
            <image
              href={assetHref(item.visualAssetId)}
              x={asset.x}
              y={asset.y}
              width={256 * asset.scale}
              height={512 * asset.scale}
              preserveAspectRatio="xMidYMid meet"
            />
          </g>
        );
      })}
    </svg>
  );
}
