import { DORM_IDS, type DormId } from "@/dorms/dorms";
import { AUDIENCES, type Audience } from "./activity-ids";

/*
 * Who an activity is for. A resident belongs to the dorm they live in, so
 * each Peserta is told as the dorms it covers.
 */

const MEN_DORMS: readonly DormId[] = ["wismantara_putra", "cipta_bakti"];
const WOMEN_DORMS: readonly DormId[] = ["wismantara_putri", "dana_rakca"];

/** The dorms whose residents take part. */
export function dormsOf(audience: Audience): readonly DormId[] {
  if (audience === "all") return DORM_IDS;
  if (audience === "men") return MEN_DORMS;
  if (audience === "women") return WOMEN_DORMS;
  return [audience];
}

/** Whether the residents of a dorm take part. */
export function covers(audience: Audience, dorm: DormId): boolean {
  return dormsOf(audience).includes(dorm);
}

/** Every Peserta that the residents of a dorm are part of. */
export function audiencesCovering(dorm: DormId): Audience[] {
  return AUDIENCES.filter((audience) => covers(audience, dorm));
}

/** How many residents each dorm has. */
export type ResidentsByDorm = Record<DormId, number>;

/** How many residents take part. */
export function countAudience(
  residents: ResidentsByDorm,
  audience: Audience,
): number {
  let total = 0;
  for (const dorm of dormsOf(audience)) total += residents[dorm];
  return total;
}
