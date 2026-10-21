import { and, inArray } from "drizzle-orm";
import type { AccountForAccess } from "@/auth/access";
import type { Database } from "@/db/connect";
import { isUuid } from "@/db/is-uuid";
import { activityAttendances } from "@/db/schema";
import {
  BULK_MAX,
  type BulkAnswer,
  type BulkCount,
  bulkDoneWords,
  NOTHING_TICKED,
  sentIds,
  TOO_MANY_TICKED,
} from "./bulk-validation";
import { countedAtEither } from "./counted-students";
import {
  CARD_NOT_FOUND,
  decideOne,
  VERIFY_NOT_ALLOWED,
} from "./decide-attendance";
import { mayVerify } from "./may-verify";
import { cardOf, IS_CARD, storedCards } from "./verification-cards";

function refused(error: string): BulkAnswer {
  return { state: { error, done: null }, cards: [] };
}

/**
 * Validates each photo that still waits, one after the other, each with
 * its own line in the log. One that someone decided first is counted
 * apart and left as it is; a key of no card is passed over.
 */
async function validateEach(
  db: Database,
  byId: string,
  ids: readonly string[],
  at: Date,
): Promise<BulkCount> {
  const count = { validated: 0, decidedBefore: 0 };
  for (const id of ids) {
    const end = await decideOne(db, byId, id, { status: "valid" }, at);
    if (end === "decided") count.validated += 1;
    if (end === "already-decided") count.decidedBefore += 1;
  }
  return count;
}

async function readCards(
  db: Database,
  ids: readonly string[],
  keepsPhotos: boolean,
) {
  const stored = await storedCards(
    db,
    and(IS_CARD, inArray(activityAttendances.id, [...ids])),
    await countedAtEither(db),
  );
  return stored.map((card) => cardOf(card, keepsPhotos));
}

/**
 * "Validasi (n) terpilih": validates the ticked photos that still wait,
 * for an account that may verify attendance; anyone else is refused
 * before anything is read. `sent` comes from outside and is not trusted:
 * only keys of cards are read, and more than one page of them is
 * refused. The answer holds each card as it stands afterwards.
 */
export async function validateTicked(
  db: Database,
  account: AccountForAccess,
  sent: unknown,
  at: Date,
  keepsPhotos: boolean,
): Promise<BulkAnswer> {
  if (!mayVerify(account)) return refused(VERIFY_NOT_ALLOWED);
  const ids = sentIds(sent).filter(isUuid);
  if (ids.length > BULK_MAX) return refused(TOO_MANY_TICKED);
  if (ids.length === 0) return refused(NOTHING_TICKED);
  const count = await validateEach(db, account.id, ids, at);
  const foundNone = count.validated === 0 && count.decidedBefore === 0;
  if (foundNone) return refused(CARD_NOT_FOUND);
  const cards = await readCards(db, ids, keepsPhotos);
  return { state: { error: null, done: bulkDoneWords(count) }, cards };
}
