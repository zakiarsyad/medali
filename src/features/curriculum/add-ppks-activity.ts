import { eq } from "drizzle-orm";
import { may } from "@/auth/access";
import type { Account } from "@/auth/accounts";
import type { Database } from "@/db/connect";
import { isUuid } from "@/db/is-uuid";
import { ppksActivities } from "@/db/schema";
import type { Parsed } from "@/parsed";
import { ACTIVITIES_NOT_ALLOWED } from "./not-allowed";
import {
  type PpksActivityInput,
  parsePpksActivity,
  type SentPpksActivity,
} from "./ppks-activity-input";

/**
 * What an add answers when its key is that of an activity it did not
 * just add: the form was sent before and changed since, or the key is
 * not its own.
 */
export const ACTIVITY_ALREADY_SENT = {
  ok: false,
  error:
    "Formulir ini sudah pernah terkirim, jadi isian yang sekarang tidak disimpan. Muat ulang halaman, periksa daftar kegiatan, lalu tambahkan lagi bila masih perlu.",
} as const;

type StoredActivity = typeof ppksActivities.$inferSelect;

/** Whether a stored activity holds, part for part, what the form sends. */
function holdsSameParts(
  kept: StoredActivity,
  input: PpksActivityInput,
): boolean {
  const sameValues = kept.valueKeys.join() === input.valueKeys.join();
  const sameIndicators =
    kept.indicatorCodes.join() === input.indicatorCodes.join();
  return (
    kept.semester === input.semester &&
    kept.name === input.name &&
    kept.targetParticipants === input.targetParticipants &&
    kept.isRequired === input.isRequired &&
    kept.description === input.description &&
    sameValues &&
    sameIndicators
  );
}

/**
 * Whether the activity kept under a key is the one this form added
 * before: last saved by the same account, still in the list, with every
 * part the same. A form whose parts were changed after it was sent is
 * not the same form: taking it for one would drop the change while
 * saying it was saved.
 */
async function isSameForm(
  db: Database,
  actorId: string,
  id: string,
  input: PpksActivityInput,
): Promise<boolean> {
  const [kept] = await db
    .select()
    .from(ppksActivities)
    .where(eq(ppksActivities.id, id));
  if (!kept || kept.deletedAt !== null) return false;
  return kept.changedBy === actorId && holdsSameParts(kept, input);
}

/**
 * Adds an activity, with who added it and when: a PPKS one to its
 * semester, or a special or additional one, which has no semester. `id`
 * is the key its form made. A form sent twice, as by a double press, is
 * kept once: two adds of one key never both add it, as the second waits
 * for the first and then adds nothing, and its answer is the same as the
 * first. Gives back the name that was kept.
 */
export async function addPpksActivity(
  db: Database,
  actor: Pick<Account, "id" | "roles">,
  id: string,
  sent: SentPpksActivity,
): Promise<Parsed<string>> {
  if (!may(actor.roles, "manage_activities")) return ACTIVITIES_NOT_ALLOWED;
  const parsed = parsePpksActivity(sent);
  if (!parsed.ok) return parsed;
  if (!isUuid(id)) return ACTIVITY_ALREADY_SENT;

  const added = await db
    .insert(ppksActivities)
    .values({ ...parsed.value, id, changedAt: new Date(), changedBy: actor.id })
    .onConflictDoNothing({ target: ppksActivities.id })
    .returning({ id: ppksActivities.id });
  const saved = { ok: true, value: parsed.value.name } as const;
  if (added.length > 0) return saved;
  if (await isSameForm(db, actor.id, id, parsed.value)) return saved;
  return ACTIVITY_ALREADY_SENT;
}
