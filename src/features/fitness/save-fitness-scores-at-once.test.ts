// Sample NIMs of this file: 9986200400 to 9986200499.
import { eq } from "drizzle-orm";
import { describe, expect, it } from "vitest";
import { fitnessScores } from "@/db/schema";
import { withOwnTestDatabase } from "@/db/test-database-at-once";
import { readGroupMembers } from "./fitness-groups";
import { saveFitnessScores } from "./save-fitness-scores";
import { addTestActor, addTestGroup, addTestStudents } from "./test-fitness";

/*
 * Two presses at the same moment need two connections that both see the
 * saved rows. So these checks have a database of their own, dropped at
 * the end; scores are never erased, so each check adds its own students.
 */
const own = withOwnTestDatabase("jasmani");

// 10:00 on campus on 16 October 2026.
const MOMENT = new Date("2026-10-16T03:00:00Z");

async function addGroup(program: string, nim: string) {
  const { programId, studentIds } = await addTestStudents(own.db, program, [
    nim,
  ]);
  const [studentId = ""] = studentIds;
  const groupId = await addTestGroup(own.db, programId, studentIds);
  return { groupId, studentId };
}

function sentFor(groupId: string, studentId: string, typed: string) {
  return { groupId, testedOn: "2026-10-16", rows: [{ studentId, typed }] };
}

describe("Simpan skor pressed by two people for the same group at the same moment", () => {
  it("keeps both in order: the second waits, and its score counts", async () => {
    const { groupId, studentId } = await addGroup(
      "Prodi Uji Jasmani Berdua",
      "9986200401",
    );
    const ani = await addTestActor(own.db, "Penilai Ani", ["assessor"]);
    const budi = await addTestActor(own.db, "Kepala Budi", ["head_of_unit"]);

    const both = await own.atOnce(
      (db) =>
        saveFitnessScores(
          db,
          ani,
          crypto.randomUUID(),
          sentFor(groupId, studentId, "80"),
          MOMENT,
        ),
      (db) =>
        saveFitnessScores(
          db,
          budi,
          crypto.randomUUID(),
          sentFor(groupId, studentId, "60"),
          MOMENT,
        ),
    );

    expect(both).toEqual({
      sooner: { ok: true, value: 1 },
      later: { ok: true, value: 1 },
    });
    const kept = await own.db
      .select()
      .from(fitnessScores)
      .where(eq(fitnessScores.studentId, studentId));
    expect(kept).toHaveLength(2);
    const [member] = await readGroupMembers(own.db, ani, groupId);
    expect(member?.latestScore).toBe(60);
  });
});

describe("Simpan skor pressed twice at the same moment", () => {
  it("keeps the scores once: the second waits, then answers the same", async () => {
    const { groupId, studentId } = await addGroup(
      "Prodi Uji Jasmani Dua Kali",
      "9986200411",
    );
    const penilai = await addTestActor(own.db, "Penilai Uji Sekaligus", [
      "assessor",
    ]);
    const id = crypto.randomUUID();
    const sent = sentFor(groupId, studentId, "77");

    const both = await own.atOnce(
      (db) => saveFitnessScores(db, penilai, id, sent, MOMENT),
      (db) => saveFitnessScores(db, penilai, id, sent, MOMENT),
    );

    expect(both.sooner).toEqual({ ok: true, value: 1 });
    expect(both.later).toEqual(both.sooner);
    const kept = await own.db
      .select()
      .from(fitnessScores)
      .where(eq(fitnessScores.studentId, studentId));
    expect(kept).toHaveLength(1);
  });
});
