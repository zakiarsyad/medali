import { may } from "@/auth/access";
import type { Account } from "@/auth/accounts";
import type { Database } from "@/db/connect";
import { dormRooms } from "@/db/schema";
import type { Parsed } from "@/parsed";
import { DORM_NAMES, type DormId } from "./dorms";
import { NOT_ALLOWED } from "./not-allowed";
import { parseNewRoom, type SentRoom } from "./room-input";

/** What a save answers when the number is already used in the dorm. */
export function numberTaken(dorm: DormId, number: string) {
  return {
    ok: false,
    error: `Nomor kamar ${number} sudah dipakai di ${DORM_NAMES[dorm]}. Pakai nomor lain.`,
  } as const;
}

/**
 * Adds a room to a floor of a dorm, and gives back its number. A number
 * already used in the dorm is refused: the database decides that, so two
 * people adding the same number at once cannot both succeed.
 */
export async function addRoom(
  db: Database,
  actor: Pick<Account, "roles">,
  sent: SentRoom,
): Promise<Parsed<string>> {
  if (!may(actor.roles, "manage_dorm_rooms")) return NOT_ALLOWED;
  const parsed = parseNewRoom(sent);
  if (!parsed.ok) return parsed;
  const room = parsed.value;

  const [added] = await db
    .insert(dormRooms)
    .values(room)
    .onConflictDoNothing({ target: [dormRooms.dorm, dormRooms.number] })
    .returning({ id: dormRooms.id });
  if (!added) return numberTaken(room.dorm, room.number);
  return { ok: true, value: room.number };
}
