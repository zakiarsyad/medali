import { and, count, desc, eq, max, sql } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";
import { campusDay } from "@/academic-periods/campus-day";
import type { Database } from "@/db/connect";
import { accounts, skpmUploads } from "@/db/schema";
import type { UploadMark } from "@/files/upload-mark";
import { pageWithin } from "@/ui/list-pages";
import { HISTORY_PAGE_SIZE } from "./skpm-address";
import type { SkpmUploadMode } from "./skpm-ids";
import { IN_FORCE } from "./skpm-totals";

/** Whether an upload counts, was replaced, or was removed, and by whom. */
export type UploadState =
  | { kind: "in_force" }
  | { kind: "replaced" }
  | { kind: "removed"; at: Date; by: string };

/** One line of "Riwayat unggahan". */
export interface UploadLine {
  id: string;
  enteredAt: Date;
  fileName: string;
  rows: number;
  students: number;
  mode: SkpmUploadMode;
  enteredBy: string;
  state: UploadState;
}

export interface UploadHistory {
  lines: UploadLine[];
  /** How many uploads there are, on every page. */
  matching: number;
  /** The page shown, the last one when the address asked for more. */
  page: number;
}

/**
 * The campus day the same file was last saved, by anyone, in an upload
 * still in force, or null when there is none.
 */
export async function savedBefore(
  db: Database,
  mark: UploadMark,
): Promise<string | null> {
  const [found] = await db
    .select({ at: max(skpmUploads.enteredAt) })
    .from(skpmUploads)
    .where(
      and(
        eq(skpmUploads.fileName, mark.fileName),
        eq(skpmUploads.fingerprint, mark.fingerprint),
        IN_FORCE,
      ),
    );
  const at = found?.at ?? null;
  return at === null ? null : campusDay(at);
}

const remover = alias(accounts, "remover");

function stateOf(line: {
  inForce: boolean;
  removedAt: Date | null;
  removedBy: string | null;
}): UploadState {
  if (line.removedAt !== null) {
    return { kind: "removed", at: line.removedAt, by: line.removedBy ?? "-" };
  }
  if (line.inForce) return { kind: "in_force" };
  return { kind: "replaced" };
}

/**
 * One page of "Riwayat unggahan": every upload, the latest first, removed
 * ones too, each with whether it counts, was replaced by a later "Ganti
 * semua data", or was removed with who and when.
 */
export async function readUploadHistory(
  db: Database,
  asked: number,
): Promise<UploadHistory> {
  const [counted] = await db.select({ uploads: count() }).from(skpmUploads);
  const matching = counted?.uploads ?? 0;
  const page = pageWithin(asked, matching, HISTORY_PAGE_SIZE);
  const rows = await db
    .select({
      id: skpmUploads.id,
      enteredAt: skpmUploads.enteredAt,
      fileName: skpmUploads.fileName,
      rows: skpmUploads.rowCount,
      students: skpmUploads.studentCount,
      mode: skpmUploads.mode,
      enteredBy: accounts.name,
      inForce: sql<boolean>`(${IN_FORCE})`,
      removedAt: skpmUploads.removedAt,
      removedBy: remover.name,
    })
    .from(skpmUploads)
    .innerJoin(accounts, eq(accounts.id, skpmUploads.enteredBy))
    .leftJoin(remover, eq(remover.id, skpmUploads.removedBy))
    .orderBy(desc(skpmUploads.enteredAt), desc(skpmUploads.id))
    .limit(HISTORY_PAGE_SIZE)
    .offset((page - 1) * HISTORY_PAGE_SIZE);
  const lines = rows.map(({ inForce, removedAt, removedBy, ...line }) => ({
    ...line,
    state: stateOf({ inForce, removedAt, removedBy }),
  }));
  return { lines, matching, page };
}
