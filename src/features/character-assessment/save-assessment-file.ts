import { count, eq } from "drizzle-orm";
import { campusDay } from "@/academic-periods/campus-day";
import { readRunningPeriod } from "@/academic-periods/stored-periods";
import { type AccountForAccess, may } from "@/auth/access";
import type { Database } from "@/db/connect";
import { isUuid } from "@/db/is-uuid";
import { characterAssessments, characterAssessmentUploads } from "@/db/schema";
import { sourceName } from "@/files/csv-file";
import type { SentFile } from "@/files/file-check";
import { fingerprintOf } from "@/files/file-fingerprint";
import type { Parsed } from "@/parsed";
import type { ReadyAssessmentRow } from "./assessment-file";
import { assessableBy, checkAssessmentFile } from "./assessment-file-check";
import type { AssessmentSource } from "./assessment-ids";
import { sourceNamed } from "./assessment-input";
import {
  FILE_ALREADY_SENT,
  NO_PERIOD,
  NOT_ALLOWED_TO_ASSESS,
  NOTHING_TO_SAVE,
  UNKNOWN_SOURCE,
} from "./assessment-messages";

/** What "Simpan (n) baris" tells the one who saved. */
export interface SavedAssessmentFile {
  /** How many rows were saved. */
  saved: number;
}

/** What "Simpan (n) baris" says once the rows are saved. */
export function savedFileMessage(saved: SavedAssessmentFile): string {
  return `${saved.saved.toLocaleString("id-ID")} baris tersimpan.`;
}

/** An upload as it is sent: its key, the file's name and its fingerprint. */
interface Upload {
  id: string;
  fileName: string;
  fingerprint: string;
}

/** What every row of one saved file shares. */
interface FileSave {
  actor: AccountForAccess;
  upload: Upload;
  source: AssessmentSource;
  moment: Date;
}

/**
 * The answer to a key that is taken: the same file with the same source
 * sent again by the same account is answered as its first save. Any
 * other is refused.
 */
async function answerTaken(
  tx: Database,
  { actor, upload, source }: FileSave,
): Promise<Parsed<SavedAssessmentFile> | null> {
  const [kept] = await tx
    .select()
    .from(characterAssessmentUploads)
    .where(eq(characterAssessmentUploads.id, upload.id));
  if (!kept) return null;
  const isSameFile =
    kept.enteredBy === actor.id && kept.fingerprint === upload.fingerprint;
  if (!isSameFile) return FILE_ALREADY_SENT;
  const bySource = await tx
    .select({ source: characterAssessments.source, saved: count() })
    .from(characterAssessments)
    .where(eq(characterAssessments.uploadId, upload.id))
    .groupBy(characterAssessments.source);
  const [only] = bySource;
  if (bySource.length !== 1 || only?.source !== source) {
    return FILE_ALREADY_SENT;
  }
  return { ok: true, value: { saved: only.saved } };
}

function assessmentOf(
  row: ReadyAssessmentRow,
  periodId: string,
  { actor, upload, source, moment }: FileSave,
) {
  const { scores } = row;
  return {
    id: crypto.randomUUID(),
    studentId: row.studentId,
    scoreM: scores.M,
    scoreE: scores.E,
    scoreD: scores.D,
    scoreA: scores.A,
    scoreL: scores.L,
    scoreI: scores.I,
    source,
    note: "",
    periodId,
    enteredBy: actor.id,
    enteredAt: moment,
    uploadId: upload.id,
  };
}

async function save(
  tx: Database,
  file: SentFile,
  saving: FileSave,
): Promise<Parsed<SavedAssessmentFile>> {
  const taken = await answerTaken(tx, saving);
  if (taken) return taken;
  const rows = await checkAssessmentFile(tx, assessableBy(saving.actor), file);
  if (!rows.ok) return rows;
  const { ready } = rows.value;
  if (ready.length === 0) return NOTHING_TO_SAVE;
  const period = await readRunningPeriod(tx, campusDay(saving.moment));
  if (period === null) return NO_PERIOD;
  // A second press waits here for the first to end, then adds nothing.
  const added = await tx
    .insert(characterAssessmentUploads)
    .values({
      ...saving.upload,
      enteredBy: saving.actor.id,
      enteredAt: saving.moment,
    })
    .onConflictDoNothing({ target: characterAssessmentUploads.id })
    .returning({ id: characterAssessmentUploads.id });
  if (added.length === 0) {
    return (await answerTaken(tx, saving)) ?? FILE_ALREADY_SENT;
  }
  await tx
    .insert(characterAssessments)
    .values(ready.map((row) => assessmentOf(row, period.id, saving)));
  return { ok: true, value: { saved: ready.length } };
}

/**
 * "Simpan (n) baris": keeps every ready row of an assessment file as the
 * newest assessment of its student, with the source picked for the
 * whole file and no note, in the academic period that runs on the day
 * it is saved, all tied to one upload that keeps the file's name. Each
 * row is its own line in the log: it can never be changed or deleted.
 * The file is read and checked again here: what the screen showed is
 * not trusted. The whole file is kept in one go, or nothing of it.
 * Refused for a role without the right Asesmen karakter, for a source
 * not on the list, while no period runs, and for a file with no row to
 * save. `id` is the key the screen made for the file: a file sent twice
 * is kept once, and the second press is answered as the first.
 */
export async function saveAssessmentFile(
  db: Database,
  actor: AccountForAccess,
  id: string,
  sentSource: string,
  file: SentFile,
  moment: Date = new Date(),
): Promise<Parsed<SavedAssessmentFile>> {
  if (!may(actor.roles, "assess_character")) return NOT_ALLOWED_TO_ASSESS;
  const source = sourceNamed(sentSource);
  if (source === null) return UNKNOWN_SOURCE;
  if (!isUuid(id)) return FILE_ALREADY_SENT;
  const upload = {
    id,
    fileName: sourceName(file.name),
    fingerprint: fingerprintOf(file.bytes),
  };
  const saving = { actor, upload, source, moment };
  return db.transaction((tx) => save(tx, file, saving));
}
