import { eq } from "drizzle-orm";
import { campusDay } from "@/academic-periods/campus-day";
import { readRunningPeriod } from "@/academic-periods/stored-periods";
import { type AccountForAccess, may } from "@/auth/access";
import type { Database } from "@/db/connect";
import { isUuid } from "@/db/is-uuid";
import { skpmRows, skpmUploadChanges, skpmUploads } from "@/db/schema";
import type { SentFile } from "@/files/file-check";
import { type UploadMark, uploadMarkOf } from "@/files/upload-mark";
import type { Parsed } from "@/parsed";
import { repeatedFile } from "@/ui/repeated-file";
import type { ReadySkpmRow } from "./skpm-file";
import { checkSkpmFile } from "./skpm-file-check";
import { studentsIn } from "./skpm-file-preview";
import { SKPM_UPLOAD_MODES, type SkpmUploadMode } from "./skpm-ids";
import {
  FILE_ALREADY_SENT,
  NO_PERIOD,
  NOT_ALLOWED_TO_UPLOAD,
  NOTHING_TO_SAVE,
  UNKNOWN_MODE,
} from "./skpm-messages";
import { savedBefore } from "./skpm-uploads";

/** What "Simpan (n) baris" tells the one who saved. */
export interface SavedSkpmFile {
  /** How many rows were saved, and the file name as kept. */
  saved: number;
  fileName: string;
}

/** What "Simpan (n) baris" says once the rows are saved. */
export function savedMessage(saved: SavedSkpmFile): string {
  return `${saved.saved.toLocaleString("id-ID")} baris dari ${saved.fileName} tersimpan.`;
}

/** The mode a form names, or null for anything else. */
export function modeNamed(sent: string): SkpmUploadMode | null {
  return SKPM_UPLOAD_MODES.find((mode) => mode === sent) ?? null;
}

interface Upload extends UploadMark {
  id: string;
  mode: SkpmUploadMode;
}

/**
 * The refusal of a "Tambahkan" file saved before and still in force,
 * unless `confirmedRepeat`, or null. "Ganti semua data" never asks: it
 * replaces every upload before it, so nothing counts twice.
 */
async function refuseRepeat(
  tx: Database,
  upload: Upload,
  confirmedRepeat: boolean,
): Promise<Parsed<SavedSkpmFile> | null> {
  if (upload.mode !== "add" || confirmedRepeat) return null;
  const before = await savedBefore(tx, upload);
  if (before === null) return null;
  return repeatedFile(before);
}

/**
 * The answer to a key that is taken: the same file sent again in the same
 * mode by the same account is answered as its first save. Any other is
 * refused.
 */
async function answerTaken(
  tx: Database,
  actor: AccountForAccess,
  upload: Upload,
): Promise<Parsed<SavedSkpmFile> | null> {
  const [kept] = await tx
    .select()
    .from(skpmUploads)
    .where(eq(skpmUploads.id, upload.id));
  if (!kept) return null;
  const isSame =
    kept.enteredBy === actor.id &&
    kept.fingerprint === upload.fingerprint &&
    kept.mode === upload.mode;
  if (!isSame) return FILE_ALREADY_SENT;
  return { ok: true, value: { saved: kept.rowCount, fileName: kept.fileName } };
}

async function addRows(
  tx: Database,
  uploadId: string,
  ready: ReadySkpmRow[],
): Promise<void> {
  await tx.insert(skpmRows).values(
    ready.map((row) => ({
      uploadId,
      line: row.row,
      studentId: row.studentId,
      activity: row.activity,
      category: row.category,
      level: row.level,
      activityRole: row.activityRole,
      day: row.day,
      points: row.points,
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
): Promise<Parsed<SavedSkpmFile>> {
  const taken = await answerTaken(tx, actor, upload);
  if (taken) return taken;
  const rows = await checkSkpmFile(tx, file);
  if (!rows.ok) return rows;
  const { ready } = rows.value;
  if (ready.length === 0) return NOTHING_TO_SAVE;
  const period = await readRunningPeriod(tx, campusDay(moment));
  if (period === null) return NO_PERIOD;
  const repeat = await refuseRepeat(tx, upload, confirmedRepeat);
  if (repeat) return repeat;
  // A second press waits here for the first to end, then adds nothing.
  const added = await tx
    .insert(skpmUploads)
    .values({
      ...upload,
      periodId: period.id,
      rowCount: ready.length,
      studentCount: studentsIn(ready),
      enteredBy: actor.id,
      enteredAt: moment,
    })
    .onConflictDoNothing({ target: skpmUploads.id })
    .returning({ id: skpmUploads.id });
  if (added.length === 0) {
    return (await answerTaken(tx, actor, upload)) ?? FILE_ALREADY_SENT;
  }
  await addRows(tx, upload.id, ready);
  await tx.insert(skpmUploadChanges).values({
    uploadId: upload.id,
    changedBy: actor.id,
    changedAt: moment,
    action: "uploaded",
  });
  return {
    ok: true,
    value: { saved: ready.length, fileName: upload.fileName },
  };
}

/**
 * "Simpan (n) baris": keeps every ready row of an SKPM file, tied to one
 * upload in the academic period that runs on the day it is saved, with a
 * line in the log. With "Ganti semua data" every upload before it counts
 * no more. The file is read and checked again here: what the screen
 * showed is not trusted. The whole file is kept in one go, or nothing of
 * it. Refused for a role without the right "Unggah data SKPM", while no
 * period runs, for a file with no row to save, and in "Tambahkan" for a
 * file saved before that is still in force unless `confirmedRepeat`.
 * `id` is the key the screen made for the file: a file sent twice is
 * kept once, and the second press is answered as the first.
 */
export async function saveSkpmFile(
  db: Database,
  actor: AccountForAccess,
  id: string,
  sentMode: string,
  file: SentFile,
  confirmedRepeat: boolean,
  moment: Date = new Date(),
): Promise<Parsed<SavedSkpmFile>> {
  if (!may(actor.roles, "upload_skpm")) return NOT_ALLOWED_TO_UPLOAD;
  if (!isUuid(id)) return FILE_ALREADY_SENT;
  const mode = modeNamed(sentMode);
  if (mode === null) return UNKNOWN_MODE;
  const upload = { id, ...uploadMarkOf(file), mode };
  return db.transaction((tx) =>
    save(tx, actor, upload, file, confirmedRepeat, moment),
  );
}
