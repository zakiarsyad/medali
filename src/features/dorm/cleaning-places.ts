import { and, eq, isNotNull, isNull } from "drizzle-orm";
import { campusDay } from "@/academic-periods/campus-day";
import { may } from "@/auth/access";
import type { Account } from "@/auth/accounts";
import type { Database } from "@/db/connect";
import { isUuid } from "@/db/is-uuid";
import { dormCleaningPlaces } from "@/db/schema";
import { brokeUniqueRule } from "@/db/unique-violation";
import type { Parsed } from "@/parsed";
import {
  CLEANING_NOT_ALLOWED,
  NAME_TAKEN,
  PLACE_NOT_FOUND,
} from "./cleaning-messages";
import { parseDorm, parsePlaceName } from "./cleaning-place-input";

/** The rule the database keeps: a name is used once in a dorm. */
const NAME_RULE = "dorm_cleaning_places_name_in_dorm";

type Actor = Pick<Account, "id" | "roles">;

export interface SentPlace {
  name: string;
  dorm: string;
}

export interface SentName {
  placeId: string;
  name: string;
}

function mayManage(actor: Pick<Account, "roles">): boolean {
  return may(actor.roles, "manage_dorm_cleaning");
}

/**
 * Writes a change in a step of its own, which alone is undone when the
 * database refuses the name: another place of the dorm holds it.
 */
async function writeNamed(
  db: Database,
  write: (step: Database) => Promise<{ name: string }[]>,
): Promise<Parsed<string>> {
  try {
    const [written] = await db.transaction(write);
    if (!written) return PLACE_NOT_FOUND;
    return { ok: true, value: written.name };
  } catch (error) {
    if (!brokeUniqueRule(error, NAME_RULE)) throw error;
    return NAME_TAKEN;
  }
}

/**
 * "Tambah tempat": adds a place to a dorm, and gives back its name. A name
 * already used there is refused by the database, so two people adding it
 * at once cannot both succeed.
 */
export async function addCleaningPlace(
  db: Database,
  actor: Pick<Account, "roles">,
  sent: SentPlace,
): Promise<Parsed<string>> {
  if (!mayManage(actor)) return CLEANING_NOT_ALLOWED;
  const name = parsePlaceName(sent.name);
  if (!name.ok) return name;
  const dorm = parseDorm(sent.dorm);
  if (!dorm.ok) return dorm;

  const [added] = await db
    .insert(dormCleaningPlaces)
    .values({ dorm: dorm.value, name: name.value })
    .onConflictDoNothing()
    .returning({ name: dormCleaningPlaces.name });
  if (!added) return NAME_TAKEN;
  return { ok: true, value: added.name };
}

/** "Ubah": gives a place that is not removed a new name. */
export async function renameCleaningPlace(
  db: Database,
  actor: Pick<Account, "roles">,
  sent: SentName,
): Promise<Parsed<string>> {
  if (!mayManage(actor)) return CLEANING_NOT_ALLOWED;
  if (!isUuid(sent.placeId)) return PLACE_NOT_FOUND;
  const name = parsePlaceName(sent.name);
  if (!name.ok) return name;

  return writeNamed(db, (step) =>
    step
      .update(dormCleaningPlaces)
      .set({ name: name.value })
      .where(
        and(
          eq(dormCleaningPlaces.id, sent.placeId),
          isNull(dormCleaningPlaces.deletedAt),
        ),
      )
      .returning({ name: dormCleaningPlaces.name }),
  );
}

/**
 * "Hapus": marks a place as removed, with who, when and today as the first
 * day it no longer shows, and gives back its name. Nothing is erased: its
 * duties before today still show. `today` is the day on campus.
 */
export async function removeCleaningPlace(
  db: Database,
  actor: Actor,
  placeId: string,
  today = campusDay(),
): Promise<Parsed<string>> {
  if (!mayManage(actor)) return CLEANING_NOT_ALLOWED;
  if (!isUuid(placeId)) return PLACE_NOT_FOUND;

  const [removed] = await db
    .update(dormCleaningPlaces)
    .set({ removedFrom: today, deletedAt: new Date(), deletedBy: actor.id })
    .where(
      and(
        eq(dormCleaningPlaces.id, placeId),
        isNull(dormCleaningPlaces.deletedAt),
      ),
    )
    .returning({ name: dormCleaningPlaces.name });
  if (!removed) return PLACE_NOT_FOUND;
  return { ok: true, value: removed.name };
}

/**
 * "Urungkan": brings a removed place back with its duties, by taking its
 * mark away. Only the account that removed it brings it back this way, and
 * not once another place of the dorm took its name.
 */
export async function restoreCleaningPlace(
  db: Database,
  actor: Actor,
  placeId: string,
): Promise<Parsed<string>> {
  if (!mayManage(actor)) return CLEANING_NOT_ALLOWED;
  if (!isUuid(placeId)) return PLACE_NOT_FOUND;

  return writeNamed(db, (step) =>
    step
      .update(dormCleaningPlaces)
      .set({ removedFrom: null, deletedAt: null, deletedBy: null })
      .where(
        and(
          eq(dormCleaningPlaces.id, placeId),
          isNotNull(dormCleaningPlaces.deletedAt),
          eq(dormCleaningPlaces.deletedBy, actor.id),
        ),
      )
      .returning({ name: dormCleaningPlaces.name }),
  );
}
