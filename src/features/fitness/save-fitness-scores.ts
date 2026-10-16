import { and, eq, inArray, sql } from "drizzle-orm";
import { campusDay } from "@/academic-periods/campus-day";
import { type AccountForAccess, may } from "@/auth/access";
import type { Database } from "@/db/connect";
import { isUuid } from "@/db/is-uuid";
import { fitnessScores, fitnessTests, students } from "@/db/schema";
import { WRITTEN_NOW } from "@/db/written-now";
import type { Parsed } from "@/parsed";
import { scoredMembersOf } from "./fitness-groups";
import {
  parseScores,
  parseTestDay,
  type SentScore,
  type StudentScore,
} from "./fitness-input";

/** A group form as sent: the group, "Tanggal tes" and each row. */
export interface SentGroupScores {
  groupId: string;
  testedOn: string;
  rows: readonly SentScore[];
}

/** A group form once checked. */
interface GroupScores {
  groupId: string;
  testedOn: string;
  scores: StudentScore[];
}

export const NOT_ALLOWED_TO_ENTER = {
  ok: false,
  error:
    "Anda tidak berhak menginput hasil tes kebugaran. Hasil tes kebugaran diinput oleh Kepala Unit Pembangunan Karakter dan Penilai Mahasiswa.",
} as const;

/**
 * What a save answers when a row names a student who is not an Aktif
 * member of the chosen group in force, names one twice, or the group is
 * not in force. Nothing of it is kept.
 */
export const NOT_GROUP_MEMBERS = {
  ok: false,
  error:
    "Ada mahasiswa yang bukan anggota aktif kelompok ini, jadi tidak ada skor yang disimpan. Muat ulang halaman, lalu pilih kelompok lagi.",
} as const;

/**
 * What a save answers when its key is that of a save it did not just
 * add: the form was sent before and changed since, or the key is not
 * its own.
 */
export const SCORES_ALREADY_SENT = {
  ok: false,
  error:
    "Formulir ini sudah pernah terkirim, jadi isian yang sekarang tidak disimpan. Muat ulang halaman, periksa Hasil tes kebugaran, lalu simpan lagi bila masih perlu.",
} as const;

type StoredTest = typeof fitnessTests.$inferSelect;

/** Whether every row names a different Aktif member of the group in force. */
async function areScoredMembers(
  tx: Database,
  actor: AccountForAccess,
  input: GroupScores,
): Promise<boolean> {
  const ids = input.scores.map((each) => each.studentId);
  if (new Set(ids).size !== ids.length) return false;
  if (!ids.every(isUuid)) return false;
  const found = await tx
    .select({ id: students.id })
    .from(students)
    .where(
      and(inArray(students.id, ids), scoredMembersOf(actor, input.groupId)),
    );
  return found.length === ids.length;
}

function sortedScores(scores: readonly StudentScore[]): string {
  return scores
    .map((each) => `${each.studentId}:${each.score}`)
    .sort()
    .join();
}

/**
 * Whether the save kept under a key is the one this form added before:
 * by the same account, with every part the same. A form changed after it
 * was sent is not the same form: taking it for one would drop the change
 * while saying it was saved.
 */
async function isSameSave(
  tx: Database,
  kept: StoredTest,
  actorId: string,
  input: GroupScores,
): Promise<boolean> {
  const isSame =
    kept.enteredBy === actorId &&
    kept.groupId === input.groupId &&
    kept.testedOn === input.testedOn;
  if (!isSame) return false;
  const keptScores = await tx
    .select({ studentId: fitnessScores.studentId, score: fitnessScores.score })
    .from(fitnessScores)
    .where(eq(fitnessScores.testId, kept.id));
  return sortedScores(keptScores) === sortedScores(input.scores);
}

async function save(
  tx: Database,
  actor: AccountForAccess,
  id: string,
  input: GroupScores,
): Promise<Parsed<number>> {
  // Every save waits here for the one before it to end. A second press
  // then finds the key it used, and of two saves at once the later is
  // stamped by the database clock after the sooner, so it counts.
  await tx.execute(
    sql`select pg_advisory_xact_lock(hashtext('fitness_scores'))`,
  );
  if (!(await areScoredMembers(tx, actor, input))) return NOT_GROUP_MEMBERS;
  const saved = { ok: true, value: input.scores.length } as const;
  const added = await tx
    .insert(fitnessTests)
    .values({
      id,
      groupId: input.groupId,
      testedOn: input.testedOn,
      enteredBy: actor.id,
      enteredAt: WRITTEN_NOW,
    })
    .onConflictDoNothing({ target: fitnessTests.id })
    .returning({ id: fitnessTests.id });
  if (added.length === 0) {
    const [kept] = await tx
      .select()
      .from(fitnessTests)
      .where(eq(fitnessTests.id, id));
    if (!kept) return SCORES_ALREADY_SENT;
    const isSame = await isSameSave(tx, kept, actor.id, input);
    return isSame ? saved : SCORES_ALREADY_SENT;
  }
  await tx
    .insert(fitnessScores)
    .values(input.scores.map((each) => ({ ...each, testId: id })));
  return saved;
}

/**
 * "Simpan skor": keeps the filled fitness scores of Aktif members of a
 * group in force, with "Tanggal tes", as the work of the actor. Each
 * save is its own line in the log: it can never be changed or deleted,
 * and a student's score of the save made last counts. Refused, with
 * nothing kept, for a role without the right "Penilaian jasmani", for a
 * score that is not whole from 0 to 100, for a test day after today on
 * campus, with no score filled, and for any student who is not an Aktif
 * member of the group. `id` is the key its form made: a form sent twice
 * is kept once, and the second press is answered as the first. Gives
 * how many scores were kept.
 */
export async function saveFitnessScores(
  db: Database,
  actor: AccountForAccess,
  id: string,
  sent: SentGroupScores,
  moment: Date = new Date(),
): Promise<Parsed<number>> {
  if (!may(actor.roles, "enter_fitness_scores")) return NOT_ALLOWED_TO_ENTER;
  const testedOn = parseTestDay(sent.testedOn, campusDay(moment));
  if (!testedOn.ok) return testedOn;
  const scores = parseScores(sent.rows);
  if (!scores.ok) return scores;
  if (!isUuid(id)) return SCORES_ALREADY_SENT;
  if (!isUuid(sent.groupId)) return NOT_GROUP_MEMBERS;
  const input = {
    groupId: sent.groupId,
    testedOn: testedOn.value,
    scores: scores.value,
  };
  return db.transaction((tx) => save(tx, actor, id, input));
}
