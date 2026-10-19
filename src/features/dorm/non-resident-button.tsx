import { DORM_NAMES, type DormId } from "@/dorms/dorms";
import { makeNonResidentAction } from "./resident-actions";
import { RoomButton } from "./room-button";
import type { Resident } from "./room-list";

/**
 * "Jadikan non asrama" for one resident, which asks first: the resident
 * leaves their room, when they have one, and the dorm.
 */
export function NonResidentButton({
  resident,
  dorm,
  roomNumber = null,
}: {
  resident: Resident;
  dorm: DormId;
  /** The number of the resident's room, null without one. */
  roomNumber?: string | null;
}) {
  const room = roomNumber === null ? "" : `kamar ${roomNumber} dan `;
  return (
    <RoomButton
      action={makeNonResidentAction}
      ids={{ studentId: resident.id }}
      confirm={`Jadikan ${resident.name} non asrama? Ia keluar dari ${room}${DORM_NAMES[dorm]}.`}
    >
      Jadikan non asrama
    </RoomButton>
  );
}
