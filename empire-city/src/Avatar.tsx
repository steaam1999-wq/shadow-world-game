import { defaultAppearance, faces, type Appearance } from "./appearance";
import type { Equipment } from "./equipment";
import { PaintedAvatar } from "./PaintedAvatar";
import { usesPaintedMaster } from "./paintedHero";
import { AvatarRig } from "./AvatarRig";
/** The outfit is one registered figure; no independently scaled photo cutouts. */
export function Avatar({
  equipment,
  appearance = defaultAppearance(),
}: {
  equipment: Equipment;
  appearance?: Appearance;
}) {
  const face = faces[appearance.face];
  return (
    <div className="avatar-renderer">
      {appearance.face === "veteran" ? (
        usesPaintedMaster(equipment) ? (
          <img
            className="painted-master"
            src={`${import.meta.env.BASE_URL}art/painted-hero/classic-master.webp`}
            alt="Главный герой в полный рост: седые усы, тёмное пальто, шляпа, цепь и трость"
            draggable={false}
          />
        ) : (
          <PaintedAvatar equipment={equipment} />
        )
      ) : (
        <AvatarRig
          equipment={equipment}
          headHref={`${import.meta.env.BASE_URL}art/faces/${face.asset}.webp`}
          skin={face.skin}
        />
      )}
    </div>
  );
}
