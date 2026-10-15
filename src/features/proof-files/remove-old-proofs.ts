import {
  and,
  getTableColumns,
  inArray,
  isNotNull,
  isNull,
  type SQL,
  sql,
} from "drizzle-orm";
import { campusDay } from "@/academic-periods/campus-day";
import { readAcademicPeriods } from "@/academic-periods/stored-periods";
import { may } from "@/auth/access";
import type { Account } from "@/auth/accounts";
import type { Database } from "@/db/connect";
import type { FileStore } from "@/files/file-store";
import type { Parsed } from "@/parsed";
import { NOT_SET_WORDS } from "./keep-days";
import { NOT_ALLOWED } from "./not-allowed";
import type { SentGroup } from "./proof-counts";
import { noCounts, PROOF_KINDS, totalOf } from "./proof-kinds";
import {
  campusDayOf,
  keepsFile,
  PROOF_SOURCES,
  type ProofSource,
} from "./proof-sources";
import { DECIDED_STATUSES, isRemovable, type KeepingRule } from "./removable";
import { writeRemovalLine } from "./removal-log";
import { readSentGroups } from "./sent-groups";
import { readKeepDays } from "./stored-keep-days";

export const NOT_SET_REFUSAL = {
  ok: false,
  error: NOT_SET_WORDS,
} as const;

export const NO_STORAGE_REFUSAL = {
  ok: false,
  error:
    "Penyimpanan berkas tidak tersedia di sini. Tidak ada berkas yang dihapus.",
} as const;

export const STOPPED_REFUSAL = {
  ok: false,
  error:
    "Penghapusan berhenti sebelum selesai. Tekan Hapus berkas lama lagi untuk menyelesaikannya.",
} as const;

/** How many files are removed from the storage at once. */
const BATCH_SIZE = 50;

/** The days on which the removable files of a kind were sent. */
function removableDays(
  groups: readonly SentGroup[],
  kind: SentGroup["kind"],
  rule: KeepingRule,
): string[] {
  const days = new Set<string>();
  for (const group of groups) {
    if (group.kind !== kind || group.isMarked) continue;
    if (group.sentOn === null || !isRemovable(group, rule)) continue;
    days.add(group.sentOn);
  }
  return [...days];
}

/**
 * Marks the files of one kind that may go now, so none of them is served
 * again. Gives back how many were marked.
 */
async function markRemovable(
  db: Database,
  source: ProofSource,
  days: string[],
  at: Date,
): Promise<number> {
  if (days.length === 0) return 0;
  const decided = DECIDED_STATUSES[source.kind];
  const marked = await db
    .update(source.table)
    .set({ fileRemovedAt: at })
    .where(
      and(
        keepsFile(source),
        isNull(source.removedAt),
        inArray(source.status, [...decided]),
        inArray(campusDayOf(source.sentAt), days),
      ),
    )
    .returning({ id: source.id });
  return marked.length;
}

interface MarkedFile {
  id: string;
  keys: string[];
}

/** The marked files of one kind that still wait to leave the storage. */
async function readMarked(
  db: Database,
  source: ProofSource,
): Promise<MarkedFile[]> {
  const keys: SQL<string[]> =
    sql`json_build_array(${sql.join([...source.keys], sql`, `)})`;
  const rows = await db
    .select({ id: sql<string>`${source.id}`, keys })
    .from(source.table)
    .where(and(keepsFile(source), isNotNull(source.removedAt)));
  return rows.map((row) => ({ id: row.id, keys: row.keys }));
}

/** Clears where the files of some rows were kept, once they are gone. */
async function clearPlaces(
  db: Database,
  source: ProofSource,
  ids: string[],
): Promise<void> {
  const columns = Object.entries(getTableColumns(source.table));
  const places = columns.filter(([, column]) => source.keys.includes(column));
  const cleared = Object.fromEntries(places.map(([name]) => [name, null]));
  await db.update(source.table).set(cleared).where(inArray(source.id, ids));
}

/**
 * Removes files from the storage. A storage that fails is not an error
 * to pass on: the files stay marked for the next press, and the cause is
 * logged, which names no person and no key.
 */
async function removeFromStorage(
  store: FileStore,
  keys: string[],
): Promise<boolean> {
  try {
    await Promise.all(keys.map((key) => store.remove(key)));
    return true;
  } catch (error) {
    console.error("Old proof files were not all removed.", error);
    return false;
  }
}

/**
 * Removes the marked files of one kind from the storage, a few at a time,
 * and clears their places once they are gone. Gives back how many went,
 * or that the storage stopped.
 */
async function finishMarked(
  db: Database,
  store: FileStore,
  source: ProofSource,
): Promise<number | "stopped"> {
  const marked = await readMarked(db, source);
  for (let start = 0; start < marked.length; start += BATCH_SIZE) {
    const batch = marked.slice(start, start + BATCH_SIZE);
    const keys = batch.flatMap((file) => file.keys);
    if (!(await removeFromStorage(store, keys))) return "stopped";
    const ids = batch.map((file) => file.id);
    await clearPlaces(db, source, ids);
  }
  return marked.length;
}

/**
 * Marks every file that may go now, all kinds at once, with one line in
 * the log of removals when any was marked. A file marked by an earlier
 * press that stopped is in that press's line already.
 */
async function markAll(
  db: Database,
  rule: KeepingRule & { keepDays: number },
  by: string,
  at: Date,
): Promise<void> {
  const groups = await readSentGroups(db);
  const counts = noCounts();
  await db.transaction(async (tx) => {
    for (const kind of PROOF_KINDS) {
      const days = removableDays(groups, kind, rule);
      counts[kind] = await markRemovable(tx, PROOF_SOURCES[kind], days, at);
    }
    if (totalOf(counts) === 0) return;
    await writeRemovalLine(tx, { by, at, keepDays: rule.keepDays, counts });
  });
}

/**
 * Removes the proof files that may go now from the file storage, while
 * every record keeps its status and decision. Each file is first marked,
 * so it is never served again, and its place is cleared only once it is
 * gone: a removal that stops half way leaves marked files, which the next
 * press finishes. Gives back how many files went.
 */
export async function removeOldProofs(
  db: Database,
  store: FileStore | null,
  actor: Pick<Account, "id" | "roles">,
  now: Date = new Date(),
): Promise<Parsed<number>> {
  if (!may(actor.roles, "manage_proof_files")) return NOT_ALLOWED;
  if (store === null) return NO_STORAGE_REFUSAL;
  const keepDays = await readKeepDays(db);
  if (keepDays === null) return NOT_SET_REFUSAL;
  const periods = await readAcademicPeriods(db);
  const rule = { keepDays, periods, today: campusDay(now) };
  await markAll(db, rule, actor.id, now);

  let removed = 0;
  for (const kind of PROOF_KINDS) {
    const finished = await finishMarked(db, store, PROOF_SOURCES[kind]);
    if (finished === "stopped") return STOPPED_REFUSAL;
    removed += finished;
  }
  return { ok: true, value: removed };
}
