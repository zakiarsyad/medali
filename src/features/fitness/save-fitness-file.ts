import { count, eq, sql } from "drizzle-orm";
import { campusDay } from "@/academic-periods/campus-day";
import { type AccountForAccess, may } from "@/auth/access";
import type { Database } from "@/db/connect";
import { isUuid } from "@/db/is-uuid";
import { fitnessScores, fitnessTests } from "@/db/schema";
import { WRITTEN_NOW } from "@/db/written-now";
import { sourceName } from "@/files/csv-file";
import type { SentFile } from "@/files/file-check";
import { fingerprintOf } from "@/files/file-fingerprint";
import type { Parsed } from "@/parsed";
import { checkFitnessFile, scorableBy } from "./fitness-file-check";
import { parseFileTestDay } from "./fitness-input";
import { NOT_ALLOWED_TO_ENTER } from "./save-fitness-scores";

export const NOTHING_TO_SAVE = {
  ok: false,
  error:
    "Tidak ada baris yang bisa disimpan. Periksa berkas, lalu unggah lagi.",
} as const;

/**
 * What a file's save answers when its key is that of a save it did not
 * just add: another file, another "Tanggal tes", another account's, or
 * a group form's.
 */
export const FILE_ALREADY_SENT = {
  ok: false,
  error:
    "Berkas ini sudah pernah terkirim, jadi tidak disimpan lagi. Muat ulang halaman, periksa Hasil tes kebugaran, lalu unggah lagi bila masih perlu.",
} as const;

/** What "Simpan (n) baris" says once the rows are saved. */
export function savedFileMessage(saved: number): string {
  return `${saved.toLocaleString("id-ID")} baris tersimpan.`;
}

/** What one save of a file holds besides its rows. */
interface FileSave {
  actor: AccountForAccess;
  id: string;
  fileName: string;
  fingerprint: string;
  testedOn: string;
}

/**
 * The answer to a key that is taken: the same file with the same
 * "Tanggal tes" sent again by the same account is answered as its first
 * save. Any other is refused. Null while the key is free.
 */
async function answerTaken(
  tx: Database,
  saving: FileSave,
): Promise<Parsed<number> | null> {
  const [kept] = await tx
    .select()
    .from(fitnessTests)
    .where(eq(fitnessTests.id, saving.id));
  if (!kept) return null;
  const isSameFile =
    kept.enteredBy === saving.actor.id &&
    kept.fileName !== null &&
    kept.fingerprint === saving.fingerprint &&
    kept.testedOn === saving.testedOn;
  if (!isSameFile) return FILE_ALREADY_SENT;
  const [saved] = await tx
    .select({ rows: count() })
    .from(fitnessScores)
    .where(eq(fitnessScores.testId, saving.id));
  return { ok: true, value: saved?.rows ?? 0 };
}

async function save(
  tx: Database,
  file: SentFile,
  saving: FileSave,
): Promise<Parsed<number>> {
  // Every save of scores waits here for the one before it to end, as the
  // group form's does. A second press then finds the key it used, and of
  // two saves the later is stamped by the database clock after the
  // sooner, so it counts.
  await tx.execute(
    sql`select pg_advisory_xact_lock(hashtext('fitness_scores'))`,
  );
  const taken = await answerTaken(tx, saving);
  if (taken) return taken;
  const rows = await checkFitnessFile(tx, scorableBy(saving.actor), file);
  if (!rows.ok) return rows;
  const { ready } = rows.value;
  if (ready.length === 0) return NOTHING_TO_SAVE;
  await tx.insert(fitnessTests).values({
    id: saving.id,
    fileName: saving.fileName,
    fingerprint: saving.fingerprint,
    testedOn: saving.testedOn,
    enteredBy: saving.actor.id,
    enteredAt: WRITTEN_NOW,
  });
  await tx.insert(fitnessScores).values(
    ready.map((row) => ({
      testId: saving.id,
      studentId: row.studentId,
      score: row.score,
    })),
  );
  return { ok: true, value: ready.length };
}

/**
 * "Simpan (n) baris": keeps every ready row of a fitness file as the
 * latest test of its student, with the "Tanggal tes" picked for the
 * whole file, all in one save that keeps the file's name. Each row is
 * its own line in the log: it can never be changed or deleted. The file
 * is read and checked again here: what the screen showed is not
 * trusted. The whole file is kept in one go, or nothing of it. Refused
 * for a role without the right "Penilaian jasmani", for a test day after
 * today on campus, and for a file with no row to save. `id` is the key
 * the screen made for the file: a file sent twice is kept once, and the
 * second press is answered as the first. Gives how many rows were kept.
 */
export async function saveFitnessFile(
  db: Database,
  actor: AccountForAccess,
  id: string,
  sentTestedOn: string,
  file: SentFile,
  moment: Date = new Date(),
): Promise<Parsed<number>> {
  if (!may(actor.roles, "enter_fitness_scores")) return NOT_ALLOWED_TO_ENTER;
  const testedOn = parseFileTestDay(sentTestedOn, campusDay(moment));
  if (!testedOn.ok) return testedOn;
  if (!isUuid(id)) return FILE_ALREADY_SENT;
  const saving = {
    actor,
    id,
    fileName: sourceName(file.name),
    fingerprint: fingerprintOf(file.bytes),
    testedOn: testedOn.value,
  };
  return db.transaction((tx) => save(tx, file, saving));
}
