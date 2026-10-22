import { count, eq } from "drizzle-orm";
import { campusDay } from "@/academic-periods/campus-day";
import { readRunningPeriod } from "@/academic-periods/stored-periods";
import { type AccountForAccess, may } from "@/auth/access";
import type { Database } from "@/db/connect";
import { isUuid } from "@/db/is-uuid";
import {
  sikuAdjustmentChanges,
  sikuAdjustmentStudents,
  sikuAdjustments,
  sikuUploads,
} from "@/db/schema";
import type { SentFile } from "@/files/file-check";
import { type UploadMark, uploadMarkOf } from "@/files/upload-mark";
import type { Parsed } from "@/parsed";
import { repeatedFile } from "@/ui/repeated-file";
import { lockEntryKey } from "./entry-key-lock";
import { enteredAsOf } from "./save-entry";
import type { ReadySikuRow } from "./siku-file";
import { checkSikuFile, sikuVisibleTo } from "./siku-file-check";
import { NO_PERIOD, NOT_ALLOWED_TO_ADJUST } from "./siku-messages";
import { savedBefore } from "./siku-uploads";

/** What "Simpan (n) baris" tells the one who saved. */
export interface SavedSikuFile {
  /** How many rows were saved. */
  saved: number;
}

export const NOTHING_TO_SAVE = {
  ok: false,
  error:
    "Tidak ada baris yang bisa disimpan. Periksa berkas, lalu unggah lagi.",
} as const;

/**
 * What a save answers when its key is that of an upload it did not just
 * add: another file, or another account's.
 */
export const FILE_ALREADY_SENT = {
  ok: false,
  error:
    "Berkas ini sudah pernah terkirim, jadi tidak disimpan lagi. Muat ulang halaman, periksa Riwayat penambahan dan pengurangan SIKU, lalu unggah lagi bila masih perlu.",
} as const;

/** What "Simpan (n) baris" says once the rows are saved. */
export function savedMessage(saved: SavedSikuFile): string {
  return `${saved.saved.toLocaleString("id-ID")} baris tersimpan.`;
}

interface Upload extends UploadMark {
  id: string;
}

/**
 * The answer to a key that is taken: the same file sent again by the
 * same account is answered as its first save. Any other is refused.
 */
async function answerTaken(
  tx: Database,
  actor: AccountForAccess,
  upload: Upload,
): Promise<Parsed<SavedSikuFile> | null> {
  const [kept] = await tx
    .select()
    .from(sikuUploads)
    .where(eq(sikuUploads.id, upload.id));
  if (!kept) return null;
  const isSame =
    kept.enteredBy === actor.id && kept.fingerprint === upload.fingerprint;
  if (!isSame) return FILE_ALREADY_SENT;
  const [rows] = await tx
    .select({ saved: count() })
    .from(sikuAdjustments)
    .where(eq(sikuAdjustments.uploadId, upload.id));
  return { ok: true, value: { saved: rows?.saved ?? 0 } };
}

/**
 * Whether a form entry has the key. The history and "Batalkan" find an
 * upload and a form entry by the same key, so they never share one.
 */
async function isEntryKey(tx: Database, id: string): Promise<boolean> {
  const [entry] = await tx
    .select({ id: sikuAdjustments.id })
    .from(sikuAdjustments)
    .where(eq(sikuAdjustments.id, id));
  return entry !== undefined;
}

async function addRows(
  tx: Database,
  actor: AccountForAccess,
  upload: Upload,
  ready: ReadySikuRow[],
  periodId: string,
  moment: Date,
): Promise<void> {
  const named = ready.map((row) => ({
    studentId: row.studentId,
    entry: {
      id: crypto.randomUUID(),
      kind: row.kind,
      reason: row.reason,
      points: row.points,
      day: campusDay(moment),
      note: row.note,
      basis: row.basis,
      periodId,
      enteredBy: actor.id,
      enteredAs: enteredAsOf(actor.roles),
      enteredAt: moment,
      uploadId: upload.id,
    },
  }));
  await tx.insert(sikuAdjustments).values(named.map(({ entry }) => entry));
  await tx.insert(sikuAdjustmentStudents).values(
    named.map(({ entry, studentId }) => ({
      adjustmentId: entry.id,
      studentId,
    })),
  );
  await tx.insert(sikuAdjustmentChanges).values(
    named.map(({ entry }) => ({
      adjustmentId: entry.id,
      changedBy: actor.id,
      action: "entered" as const,
    })),
  );
}

async function save(
  tx: Database,
  actor: AccountForAccess,
  upload: Upload,
  file: SentFile,
  confirmedRepeat: boolean,
  moment: Date,
): Promise<Parsed<SavedSikuFile>> {
  await lockEntryKey(tx, upload.id);
  const taken = await answerTaken(tx, actor, upload);
  if (taken) return taken;
  if (await isEntryKey(tx, upload.id)) return FILE_ALREADY_SENT;
  const rows = await checkSikuFile(tx, sikuVisibleTo(actor), file);
  if (!rows.ok) return rows;
  const { ready } = rows.value;
  if (ready.length === 0) return NOTHING_TO_SAVE;
  const period = await readRunningPeriod(tx, campusDay(moment));
  if (period === null) return NO_PERIOD;
  const before = await savedBefore(tx, upload);
  if (before !== null && !confirmedRepeat) return repeatedFile(before);
  // A second press waits here for the first to end, then adds nothing.
  const added = await tx
    .insert(sikuUploads)
    .values({ ...upload, enteredBy: actor.id, enteredAt: moment })
    .onConflictDoNothing({ target: sikuUploads.id })
    .returning({ id: sikuUploads.id });
  if (added.length === 0) {
    return (await answerTaken(tx, actor, upload)) ?? FILE_ALREADY_SENT;
  }
  await addRows(tx, actor, upload, ready, period.id, moment);
  return { ok: true, value: { saved: ready.length } };
}

/**
 * "Simpan (n) baris": keeps every ready row of a SIKU file as a gain or a
 * loss of its own for its one student, in the academic period that runs
 * on the day it is saved and dated that day, all tied to one upload, with
 * a line in the log for each. The file is read and checked again here:
 * what the screen showed is not trusted. The whole file is kept in one
 * go, or nothing of it. Refused for a role without the right Penilaian
 * SIKU, while no period runs, for a file with no row to save, and for a
 * file saved before that is still in force unless `confirmedRepeat`.
 * `id` is the key the screen made for the file: a file sent twice is
 * kept once, and the second press is answered as the first.
 */
export async function saveSikuFile(
  db: Database,
  actor: AccountForAccess,
  id: string,
  file: SentFile,
  confirmedRepeat: boolean,
  moment: Date = new Date(),
): Promise<Parsed<SavedSikuFile>> {
  if (!may(actor.roles, "adjust_siku")) return NOT_ALLOWED_TO_ADJUST;
  if (!isUuid(id)) return FILE_ALREADY_SENT;
  const upload = { id, ...uploadMarkOf(file) };
  return db.transaction((tx) =>
    save(tx, actor, upload, file, confirmedRepeat, moment),
  );
}
